import { create } from 'zustand';

export const useAppStore = create((set) => ({
    isPlaying: false,
    bpm: 128,
    currentStep: 0,
    selectedChannelId: '1',
    masterVolume: 0.8,
    masterReverb: 0.2,
    masterWidth: 0.1, // 3D Sound
    sequenceLength: 16,
    setSequenceLength: (length) => set({ sequenceLength: length }),
    channels: [
        { id: '1', name: 'Kick', type: 'sampler', steps: Array(64).fill(false), notes: [], volume: 0.8, pan: 0, mute: false, solo: false, color: '#ff4d4d' },
        { id: '2', name: 'Snare', type: 'sampler', steps: Array(64).fill(false), notes: [], volume: 0.8, pan: 0, mute: false, solo: false, color: '#4dff4d' },
        { id: '3', name: 'HiHat', type: 'sampler', steps: Array(64).fill(false), notes: [], volume: 0.8, pan: 0, mute: false, solo: false, color: '#4d4dff' },
        { id: '4', name: 'Clap', type: 'sampler', steps: Array(64).fill(false), notes: [], volume: 0.8, pan: 0, mute: false, solo: false, color: '#ffff4d' },
        { id: '5', name: 'Synth 1', type: 'synth', steps: Array(64).fill(false), notes: [], volume: 0.5, pan: 0, mute: false, solo: false, color: '#ff4dff' },
    ],
    playlistClips: [
        { id: 'c1', channelId: '1', blockIndex: 0, blockCount: 1 },
    ],

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setBpm: (bpm) => set({ bpm }),
    setSelectedChannelId: (id) => set({ selectedChannelId: id }),
    setCurrentStep: (step) => set({ currentStep: step }),
    toggleStep: (channelId, stepIndex) => set((state) => ({
        channels: state.channels.map((ch) =>
            ch.id === channelId
                ? { ...ch, steps: ch.steps.map((s, i) => (i === stepIndex ? !s : s)) }
                : ch
        ),
    })),
    updateChannel: (channelId, updates) => set((state) => ({
        channels: state.channels.map((ch) =>
            ch.id === channelId ? { ...ch, ...updates } : ch
        ),
    })),
    addClip: (clip) => set((state) => ({
        playlistClips: [...state.playlistClips, { ...clip, id: Math.random().toString(36).substr(2, 9) }]
    })),
    moveClip: (clipId, blockIndex) => set((state) => ({
        playlistClips: state.playlistClips.map(c => c.id === clipId ? { ...c, blockIndex } : c)
    })),
    deleteClip: (clipId) => set((state) => ({
        playlistClips: state.playlistClips.filter(c => c.id !== clipId)
    })),
    addChannel: (name, type, sampleUrl) => set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        const colors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff', '#4dffff', '#ff994d', '#99ff4d', '#4d99ff'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newChannel = {
            id,
            name: name || `Synth ${state.channels.length + 1}`,
            type: type || 'synth',
            sampleUrl: sampleUrl || null,
            steps: Array(64).fill(false),
            notes: [],
            volume: 0.5,
            pan: 0,
            mute: false,
            solo: false,
            color: randomColor
        };
        return { channels: [...state.channels, newChannel] };
    }),
    deleteChannel: (channelId) => set((state) => ({
        channels: state.channels.filter(ch => ch.id !== channelId),
        playlistClips: state.playlistClips.filter(c => c.channelId !== channelId)
    })),
    isSoundSearchOpen: false,
    setSoundSearchOpen: (open) => set({ isSoundSearchOpen: open }),
    saveProject: () => {
        const state = useAppStore.getState();
        const projectData = {
            channels: state.channels,
            playlistClips: state.playlistClips,
            bpm: state.bpm
        };
        localStorage.setItem('fl_studio_project', JSON.stringify(projectData));
        alert('Project saved to browser storage!');
    },
    loadProject: () => {
        const saved = localStorage.getItem('fl_studio_project');
        if (saved) {
            const data = JSON.parse(saved);
            set({
                channels: data.channels,
                playlistClips: data.playlistClips,
                bpm: data.bpm,
                selectedChannelId: data.channels[0]?.id || '1'
            });
            alert('Project loaded!');
        } else {
            alert('No saved project found.');
        }
    }
}));
