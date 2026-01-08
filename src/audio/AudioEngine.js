import * as Tone from 'tone';
import { useAppStore } from '../store/useAppStore';

class AudioEngine {
    constructor() {
        this.samplers = new Map();
        this.synths = new Map();
        this.channelNodes = new Map();
        this.initialized = false;

        this.masterVolume = new Tone.Volume(0).toDestination();
        this.reverb = new Tone.Freeverb({ roomSize: 0.7, dampening: 3000, wet: 0 }).connect(this.masterVolume);

        this.widener = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0 }).connect(this.reverb);
        this.widener.start();

        this.masterBus = new Tone.Volume(0).connect(this.widener);
        this.polySynth = new Tone.PolySynth(Tone.Synth).connect(this.masterBus);

        this.isExporting = false;
        this.recorder = new Tone.Recorder();
        Tone.getDestination().connect(this.recorder);

        // Global preview player for library
        this.previewSampler = new Tone.Sampler().toDestination();
    }

    async exportToWav() {
        if (!this.initialized) await this.init();

        this.isExporting = true;

        this.recorder.start();

        const { setCurrentStep, playlistClips, sequenceLength, bpm } = useAppStore.getState();

        let minStart = 0;
        let maxEnd = sequenceLength;

        if (playlistClips.length > 0) {
            minStart = Math.min(...playlistClips.map(c => c.blockIndex * sequenceLength));
            const endPoints = playlistClips.map(c => (c.blockIndex + c.blockCount) * sequenceLength);
            maxEnd = Math.max(...endPoints);
        }

        // Add 1 extra pattern length for decay/tails
        // We record from minStart to maxEnd + sequenceLength
        const totalDurationSteps = (maxEnd - minStart) + sequenceLength;
        const recordTime = (totalDurationSteps * 60) / (bpm * 4);

        setCurrentStep(minStart);
        Tone.getTransport().start();

        setTimeout(async () => {
            const recording = await this.recorder.stop();
            const url = URL.createObjectURL(recording);
            const anchor = document.createElement("a");
            anchor.download = "fl_studio_export.wav";
            anchor.href = url;
            anchor.click();

            Tone.getTransport().stop();
            this.isExporting = false;
            setCurrentStep(minStart);
            alert("Export complete!");
        }, recordTime * 1000 + 500);
    }

    async loadSample(channelId, url) {
        return new Promise((resolve) => {
            const nodes = this.getOrCreateChannelNodes(channelId, 'sampler');

            // Sync current channel state from store immediately
            const channel = useAppStore.getState().channels.find(c => c.id === channelId);
            if (channel) this.updateChannelSettings(channel);

            if (this.samplers.has(channelId)) {
                const old = this.samplers.get(channelId);
                // Safety check: ensure dispose exists before calling
                if (old && typeof old.dispose === 'function') {
                    old.dispose();
                }
            }

            // 1. Initialize Sampler with URL immediately
            const sampler = new Tone.Sampler({
                urls: { C3: url },
                release: 1,
                onload: () => {
                    sampler.connect(nodes); // nodes is the Tone.Channel instance
                    this.samplers.set(channelId, sampler);
                    resolve();
                },
                onerror: () => {
                    console.warn(`Failed to load sample for channel ${channelId}. Using synth fallback.`);
                    this.samplers.delete(channelId);
                    resolve();
                }
            });

            // 2. Load Raw Buffer separately for Trim/Edit features
            const buffer = new Tone.Buffer(url, () => {
                if (!this.rawBuffers) this.rawBuffers = new Map();
                this.rawBuffers.set(channelId, buffer);
            });
        });
    }

    getOrCreateChannelNodes(channelId, channelName) {
        if (!this.channelNodes.has(channelId)) {
            // Tone.Channel combines volume, pan, mute, solo and is stereo-native
            const channelNode = new Tone.Channel().connect(this.masterBus);
            this.channelNodes.set(channelId, channelNode);

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
                synth = new Tone.PolySynth(Tone.Synth);
            }
            synth.connect(channelNode);
            this.synths.set(channelId, synth);
        }
        return this.channelNodes.get(channelId);
    }

    // New unified update method for Mixer/Settings
    updateChannelSettings(channel) {
        const node = this.channelNodes.get(channel.id);
        if (node) {
            // volume is in dB. 0.8 -> ~ -2dB. 1.0 -> 0dB.
            // Using gainToDb for cleaner mapping
            node.volume.value = Tone.gainToDb(channel.volume ?? 1);
            node.pan.value = channel.pan ?? 0;
            node.mute = channel.mute ?? false;
            node.solo = channel.solo ?? false;
        }

        // Also refresh buffer-based settings if it's a sampler
        if (channel.type === 'sampler') {
            this.refreshChannelSettings(channel);
        }
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

    // Bulk sync for project load or init
    syncAllSettings() {
        const { channels } = useAppStore.getState();
        this.updateMasterEffects();
        channels.forEach(ch => {
            this.getOrCreateChannelNodes(ch.id, ch.name);
            this.updateChannelSettings(ch);
        });
    }

    async init() {
        if (this.initialized) return;
        await Tone.start();

        const { channels } = useAppStore.getState();
        this.syncAllSettings();

        Tone.getTransport().scheduleRepeat((time) => {
            const { currentStep, setCurrentStep, channels, playlistClips, sequenceLength } = useAppStore.getState();

            let minStart = 0;
            let maxEnd = 64;

            if (playlistClips.length > 0) {
                minStart = Math.min(...playlistClips.map(c => c.blockIndex * sequenceLength));
                const endPoints = playlistClips.map(c => (c.blockIndex + c.blockCount) * sequenceLength);
                maxEnd = Math.max(...endPoints);
            }

            if (!this.isExporting && currentStep >= maxEnd) {
                setCurrentStep(minStart);
                return;
            }

            channels.forEach(channel => {
                if (channel.sampleUrl && !this.samplers.has(channel.id)) {
                    this.samplers.set(channel.id, { loading: true });
                    this.loadSample(channel.id, channel.sampleUrl);
                }

                const activeClip = playlistClips.find(clip =>
                    clip.channelId === channel.id &&
                    currentStep >= clip.blockIndex * sequenceLength &&
                    currentStep < (clip.blockIndex + clip.blockCount) * sequenceLength
                );

                if (activeClip && !channel.mute) {
                    const stepInPattern = (currentStep - activeClip.blockIndex * sequenceLength) % sequenceLength;

                    // Trigger legacy step sequencer notes (mapped to C3 usually)
                    if (channel.steps[stepInPattern]) {
                        this.triggerSound(channel, 'C3', time);
                    }

                    // Trigger recorded piano roll notes
                    if (channel.notes) {
                        const notesAtThisTime = channel.notes.filter(n => n.time === stepInPattern);

                        // FIX: If multiple notes exist for exact same time/pitch (duplicates), filter them?
                        // Or if we have a chord, we need polyphony.
                        // Default Synth is monophonic. If strict chord, it might crash or glitch.
                        // For now, let's just iterate. Most users won't hit exact same frame overlap unless recording duplicates.

                        // Safety: Map unique pitches to avoid duplicate triggers of SAME PITCH at SAME TIME
                        const uniquePitches = new Set();
                        notesAtThisTime.forEach(note => {
                            if (!uniquePitches.has(note.pitch)) {
                                uniquePitches.add(note.pitch);
                                this.triggerSound(channel, note.pitch, time, note.duration);
                            }
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
        try {
            // Validate time and duration
            if (time === null || time === undefined || isNaN(time)) time = Tone.now();

            const name = channel.name.toLowerCase();

            // 1. Calculate proper duration in Seconds to handle both '16n' string and numeric steps
            let finalDuration;
            if (typeof duration === 'number') {
                // Duration is in steps (16th notes)
                finalDuration = Tone.Time('16n').toSeconds() * duration;
            } else {
                finalDuration = duration; // '16n' or other string
            }
            if (!finalDuration || finalDuration <= 0) finalDuration = 0.1; // Safety fallback

            // 2. Determine Source
            const sampler = this.samplers.get(channel.id);
            const hasSample = !!channel.sampleUrl;

            // If it's a sample channel, ONLY use sampler (even if loading, wait or silent).
            // Do NOT fallback to synth, otherwise it sounds like a synth while loading.
            if (hasSample) {
                if (sampler && sampler.loaded) {
                    // Root Note Logic:
                    let playPitch = pitch;
                    if (channel.rootNote && channel.rootNote !== 'C3') {
                        try {
                            const rootMidi = Tone.Frequency(channel.rootNote).toMidi();
                            const defaultMidi = Tone.Frequency('C3').toMidi();
                            let shift = defaultMidi - rootMidi;
                            const inputMidi = Tone.Frequency(pitch).toMidi();
                            playPitch = Tone.Frequency(inputMidi + shift, "midi").toNote();
                        } catch (e) {
                            console.warn("Invalid root note:", channel.rootNote);
                        }
                    }
                    sampler.triggerAttackRelease(playPitch, finalDuration, time);
                }
                // Else: Sample is loading or failed. Silent.
            } else {
                // Synth Channel
                const synth = this.synths.get(channel.id);
                if (synth) {
                    try {
                        // NoiseSynth (Snare/Clap) does not accept pitch in triggerAttackRelease
                        if (name === 'snare' || name === 'clap') {
                            synth.triggerAttackRelease(finalDuration, time);
                        } else {
                            // Membrane, Metal, PolySynth accept pitch
                            synth.triggerAttackRelease(pitch, finalDuration, time);
                        }
                    } catch (synthErr) {
                        console.warn("Synth trigger warning:", synthErr);
                        // Last resort fallback
                        if (synth.triggerAttack) synth.triggerAttack(time);
                        if (synth.triggerRelease) synth.triggerRelease(time + 0.1);
                    }
                }
            }
        } catch (err) {
            console.warn("AudioEngine trigger error ignored:", err);
        }
    }

    async previewSample(url) {
        if (!this.initialized) await this.init();

        // Dispose old preview if any to prevent overlap/leak
        if (this.previewSampler) {
            try {
                this.previewSampler.dispose();
            } catch (e) { }
        }

        return new Promise((resolve) => {
            this.previewSampler = new Tone.Sampler({
                urls: { C3: url },
                onload: () => {
                    this.previewSampler.toDestination();
                    this.previewSampler.triggerAttackRelease('C3', '1n');
                    resolve();
                },
                onerror: () => {
                    console.warn("Preview load failed:", url);
                    resolve();
                }
            });
        });
    }

    // Call this when Trim settings change
    refreshChannelSettings(channel) {
        const sampler = this.samplers.get(channel.id);
        const rawBuffer = this.rawBuffers?.get(channel.id);

        // Safety: Ensure sampler is a real Tone.Sampler instance, not a { loading: true } placeholder
        if (sampler && sampler instanceof Tone.Sampler && rawBuffer && rawBuffer.loaded) {
            const start = channel.trimStart || 0;
            const end = channel.trimEnd || 0;

            if (start > 0 || end > 0) {
                const newDuration = rawBuffer.duration - start - end;
                if (newDuration > 0.01) {
                    // Slice returns a new Tone.Buffer
                    // slice(start, end) where end is duration? No, slice(start, duration) ? 
                    // Validating Tone.Buffer.slice API: .slice(start, end (optional))?
                    // Tone.js docs: buffer.slice(start, [end=duration]) -> value is time
                    // So we pass start time and end time (absolute from 0)
                    const endTime = rawBuffer.duration - end;
                    const sliced = rawBuffer.slice(start, endTime);
                    sampler.add('C3', sliced);
                }
            } else {
                // Reset to full buffer
                sampler.add('C3', rawBuffer);
            }
        }
    }

    detectPitch(channelId) {
        const buffer = this.rawBuffers?.get(channelId);
        if (!buffer || !buffer.loaded) return null;

        const floatData = buffer.toArray(0); // Use first channel
        const sampleRate = buffer.sampleRate;

        // We need a decent window. 4096 is good for low frequencies.
        const fftSize = 4096;
        const startOffset = Math.floor(Math.min(sampleRate * 0.1, floatData.length * 0.1)); // Skip initial silence/attack
        const data = floatData.slice(startOffset, startOffset + fftSize);

        if (data.length < fftSize) return null;

        // Perform Autocorrelation
        let bestR = -1;
        let bestLag = -1;

        // Search lags between 30Hz and 2000Hz
        const minLag = Math.floor(sampleRate / 2000);
        const maxLag = Math.floor(sampleRate / 30);

        for (let lag = minLag; lag < maxLag; lag++) {
            let r = 0;
            for (let i = 0; i < fftSize - lag; i++) {
                r += data[i] * data[i + lag];
            }
            if (r > bestR) {
                bestR = r;
                bestLag = lag;
            }
        }

        if (bestLag === -1 || bestR < 5) return null; // 5 is a noise threshold

        const freq = sampleRate / bestLag;
        try {
            return Tone.Frequency(freq).toNote();
        } catch (e) {
            return null;
        }
    }

    disposeChannel(channelId) {
        if (this.samplers.has(channelId)) {
            const sampler = this.samplers.get(channelId);
            if (sampler && typeof sampler.dispose === 'function') sampler.dispose();
            this.samplers.delete(channelId);
        }

        if (this.rawBuffers && this.rawBuffers.has(channelId)) {
            const buf = this.rawBuffers.get(channelId);
            buf.dispose();
            this.rawBuffers.delete(channelId);
        }

        if (this.synths.has(channelId)) {
            const synth = this.synths.get(channelId);
            if (synth) synth.dispose();
            this.synths.delete(channelId);
        }

        if (this.channelNodes.has(channelId)) {
            const node = this.channelNodes.get(channelId);
            if (node) node.dispose();
            this.channelNodes.delete(channelId);
        }
    }
}

export const audioEngine = new AudioEngine();
