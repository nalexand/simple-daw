import * as Tone from 'tone';
import { useAppStore } from '../store/useAppStore';

class AudioEngine {
    constructor() {
        this.samplers = new Map();
        this.synths = new Map(); // channelId -> synth instance
        this.channelNodes = new Map(); // id -> { volume: Tone.Volume, panner: Tone.Panner }
        this.initialized = false;

        // Master Chain
        this.masterVolume = new Tone.Volume(0).toDestination();
        this.reverb = new Tone.Freeverb({ roomSize: 0.7, dampening: 3000, wet: 0.2 }).connect(this.masterVolume);

        // Chorus used as a "widener" for 3D effect
        this.widener = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.1 }).connect(this.reverb);
        this.widener.start();

        this.masterBus = new Tone.Volume(0).connect(this.widener);

        // PolySynth is shared
        this.polySynth = new Tone.PolySynth(Tone.Synth).connect(this.masterBus);

        this.isExporting = false;
        this.recorder = new Tone.Recorder();
        Tone.getDestination().connect(this.recorder);
    }

    async exportToWav() {
        if (!this.initialized) await this.init();

        this.isExporting = true; // Disable looping

        // Start recording
        this.recorder.start();

        // Calculate song duration
        const { setCurrentStep, playlistClips, sequenceLength, bpm } = useAppStore.getState();

        let minStart = 0;
        let maxEnd = sequenceLength; // Default to 1 pattern length

        if (playlistClips.length > 0) {
            minStart = Math.min(...playlistClips.map(c => c.blockIndex * sequenceLength));
            const endPoints = playlistClips.map(c => (c.blockIndex + c.blockCount) * sequenceLength);
            maxEnd = Math.max(...endPoints);
        }

        // Add 1 extra pattern length for decay/tails
        // We record from minStart to maxEnd + sequenceLength
        const totalDurationSteps = (maxEnd - minStart) + sequenceLength;
        const recordTime = (totalDurationSteps * 60) / (bpm * 4);

        setCurrentStep(minStart); // Start from beginning of content (no empty start)
        Tone.getTransport().start();

        //alert(`Exporting ~${recordTime.toFixed(1)}s... Please wait.`);

        setTimeout(async () => {
            const recording = await this.recorder.stop();
            const url = URL.createObjectURL(recording);
            const anchor = document.createElement("a");
            anchor.download = "fl_studio_export.wav";
            anchor.href = url;
            anchor.click();

            Tone.getTransport().stop();
            this.isExporting = false; // Re-enable looping
            setCurrentStep(minStart);
            alert("Export complete!");
        }, recordTime * 1000 + 500);
    }

    getOrCreateChannelNodes(channelId, channelName) {
        if (!this.channelNodes.has(channelId)) {
            const volume = new Tone.Volume(0).connect(this.masterBus);
            const panner = new Tone.Panner(0).connect(volume);
            this.channelNodes.set(channelId, { volume, panner });

            // Create dedicated synth for this channel if not a sampler
            const name = channelName.toLowerCase();
            let synth;
            if (name === 'kick') {
                synth = new Tone.MembraneSynth();
            } else if (name === 'snare') {
                synth = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } });
            } else if (name === 'hihat') {
                synth = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1, release: 0.01 } });
            } else if (name === 'clap') {
                synth = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0 } });
            } else {
                synth = new Tone.Synth();
            }
            synth.connect(panner);
            this.synths.set(channelId, synth);
        }
        return this.channelNodes.get(channelId);
    }

    updateMasterEffects() {
        const { masterVolume, masterReverb, masterWidth } = useAppStore.getState();
        if (this.masterVolume) {
            this.masterVolume.volume.value = Tone.gainToDb(masterVolume);
        }
        if (this.reverb) {
            this.reverb.wet.value = masterReverb;
        }
        if (this.widener) {
            this.widener.wet.value = masterWidth;
        }
    }

    async init() {
        if (this.initialized) return;
        await Tone.start();

        // Fix: Pre-initialize nodes for existing channels
        const { channels } = useAppStore.getState();
        channels.forEach(ch => this.getOrCreateChannelNodes(ch.id, ch.name));

        Tone.getTransport().scheduleRepeat((time) => {
            const { currentStep, setCurrentStep, channels, playlistClips, sequenceLength } = useAppStore.getState();

            // Calculate active loop range
            let minStart = 0;
            let maxEnd = 64; // Default to 4 bars if empty

            if (playlistClips.length > 0) {
                minStart = Math.min(...playlistClips.map(c => c.blockIndex * sequenceLength));
                const endPoints = playlistClips.map(c => (c.blockIndex + c.blockCount) * sequenceLength);
                maxEnd = Math.max(...endPoints);
            }

            // Loop Logic - Only loop if NOT exporting
            if (!this.isExporting && currentStep >= maxEnd) {
                // Loop back to start
                setCurrentStep(minStart);
                // Also reset Tone transport position if needed for sycronization, though we are driving steps manually
                // But since we are inside the callback, we just set the next step state.
                return;
            }

            // Keep master effects in sync with store
            this.updateMasterEffects();

            channels.forEach(channel => {
                const nodes = this.getOrCreateChannelNodes(channel.id, channel.name);
                nodes.volume.volume.value = Tone.gainToDb(channel.volume * (channel.mute ? 0 : 1));
                nodes.panner.pan.value = channel.pan;

                // Load sample if URL is provided and not already loaded for this channel
                if (channel.sampleUrl && !this.samplers.has(channel.id)) {
                    // Marker to prevent multiple concurrent loads
                    this.samplers.set(channel.id, { loading: true });
                    this.loadSample(channel.id, channel.sampleUrl);
                }

                // Check if there is a clip active for this channel at this step
                const activeClip = playlistClips.find(clip =>
                    clip.channelId === channel.id &&
                    currentStep >= clip.blockIndex * sequenceLength &&
                    currentStep < (clip.blockIndex + clip.blockCount) * sequenceLength
                );

                if (activeClip && !channel.mute) {
                    const stepInPattern = (currentStep - activeClip.blockIndex * sequenceLength) % sequenceLength;

                    // Play Step Sequencer
                    if (channel.steps[stepInPattern]) {
                        this.triggerSound(channel, 'C3', time);
                    }

                    // Play Piano Roll Notes
                    if (channel.notes) {
                        const notesAtThisTime = channel.notes.filter(n => n.time === stepInPattern);
                        notesAtThisTime.forEach(note => {
                            this.triggerSound(channel, note.pitch, time, note.duration);
                        });
                    }
                }
            });

            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
        }, '16n');

        this.initialized = true;
    }

    setBpm(bpm) {
        Tone.getTransport().bpm.value = bpm;
    }

    togglePlay(isPlaying) {
        if (isPlaying) {
            Tone.getTransport().start();
        } else {
            Tone.getTransport().stop();
        }
    }

    triggerSound(channel, pitch, time = Tone.now(), duration = '16n') {
        const sampler = this.samplers.get(channel.id);
        const name = channel.name.toLowerCase();

        // Pitch correction for Kicks to sound deep
        const p = (pitch === 'C3' && name === 'kick') ? 'C1' : pitch;

        // Convert numeric duration (steps) to Tone.js duration
        const d = typeof duration === 'number' ? { '16n': duration } : duration;

        if (sampler && sampler.loaded) {
            sampler.triggerAttackRelease(p, d, time);
        } else {
            const synth = this.synths.get(channel.id);
            if (synth) {
                if (name === 'snare' || name === 'clap') {
                    // Reverting to triggerAttack for snappier transients as requested
                    synth.triggerAttack(time);
                } else {
                    synth.triggerAttackRelease(p, d, time);
                }
            }
        }
    }

    async loadSample(channelId, url) {
        return new Promise((resolve) => {
            const nodes = this.getOrCreateChannelNodes(channelId, 'sampler');

            // Dispose old sampler if it exists
            if (this.samplers.has(channelId)) {
                const old = this.samplers.get(channelId);
                if (old && typeof old.dispose === 'function') old.dispose();
            }

            const sampler = new Tone.Sampler({
                urls: { C3: url },
                release: 1,
                onload: () => {
                    sampler.connect(nodes.panner);
                    this.samplers.set(channelId, sampler);
                    resolve();
                },
                onerror: () => {
                    console.warn(`Failed to load sample for channel ${channelId}. Using synth fallback.`);
                    this.samplers.delete(channelId);
                    resolve();
                }
            });
        });
    }

    disposeChannel(channelId) {
        // Dispose Sampler
        if (this.samplers.has(channelId)) {
            const sampler = this.samplers.get(channelId);
            if (sampler && typeof sampler.dispose === 'function') sampler.dispose();
            this.samplers.delete(channelId);
        }

        // Dispose Synth
        if (this.synths.has(channelId)) {
            const synth = this.synths.get(channelId);
            if (synth) synth.dispose();
            this.synths.delete(channelId);
        }

        // Dispose Channel Nodes (Volume, Panner)
        if (this.channelNodes.has(channelId)) {
            const nodes = this.channelNodes.get(channelId);
            if (nodes.panner) nodes.panner.dispose();
            if (nodes.volume) nodes.volume.dispose();
            this.channelNodes.delete(channelId);
        }
    }
}

export const audioEngine = new AudioEngine();
