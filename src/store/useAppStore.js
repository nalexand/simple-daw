import { create } from 'zustand';

const getSavedProjects = () => {
    try {
        const item = localStorage.getItem('fl_studio_projects_list');
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error("Failed to load projects from storage:", e);
        return [];
    }
};

export const useAppStore = create((set) => ({
    isPlaying: false,
    bpm: 128,
    currentStep: 0,
    selectedChannelId: '1',
    masterVolume: 0.8,
    masterReverb: 0.0,
    masterWidth: 0.0,
    sequenceLength: 16,
    setSequenceLength: (length) => set({ sequenceLength: length }),
    channels: [

    ],
    playlistClips: [

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

        // 16 FL-Studio inspired distinct colors
        const colors = [
            '#FF3D3D', // Red
            '#3DFF3D', // Green
            '#3D3DFF', // Blue
            '#FFFF3D', // Yellow
            '#FF3DFF', // Magenta
            '#3DFFFF', // Cyan
            '#FF853D', // Orange
            '#85FF3D', // Lime
            '#3D85FF', // Azure
            '#853DFF', // Purple
            '#FF3D85', // Rose
            '#FFD43D', // Gold
            '#3DFF85', // Mint
            '#D43DFF', // Violet
            '#3DFFD4', // Aqua
            '#D4FF3D'  // Chartreuse
        ];

        const nextColorIndex = state.channels.length % colors.length;
        const channelColor = colors[nextColorIndex];

        const newChannel = {
            id,
            name: name || `Synth ${state.channels.length + 1}`,
            type: type || 'synth',
            sampleUrl: sampleUrl || null,
            steps: Array(64).fill(false),
            notes: [],
            volume: 0.8,
            pan: 0,
            mute: false,
            solo: false,
            color: channelColor
        };
        return { channels: [...state.channels, newChannel] };
    }),
    deleteChannel: (channelId) => set((state) => ({
        channels: state.channels.filter(ch => ch.id !== channelId),
        playlistClips: state.playlistClips.filter(c => c.channelId !== channelId)
    })),
    isSoundSearchOpen: false,
    setSoundSearchOpen: (open) => set({ isSoundSearchOpen: open }),

    // Project Management
    projects: getSavedProjects(),

    saveProject: (name) => {
        try {
            const state = useAppStore.getState();

            // Clean data to avoid circular refs or extra bloat
            const cleanChannels = JSON.parse(JSON.stringify(state.channels));
            const cleanClips = JSON.parse(JSON.stringify(state.playlistClips));

            const projectData = {
                id: Math.random().toString(36).substr(2, 9),
                name: name,
                date: new Date().toISOString(),
                channels: cleanChannels,
                playlistClips: cleanClips,
                bpm: state.bpm,
                sequenceLength: state.sequenceLength
            };

            // Update Local Storage List
            const updatedProjects = [...state.projects, projectData];
            set({ projects: updatedProjects });
            localStorage.setItem('fl_studio_projects_list', JSON.stringify(updatedProjects));

            // Download JSON File
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${name}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            alert(`Project "${name}" saved and downloaded!`);
        } catch (e) {
            console.error("Save failed:", e);
            alert("Error saving project. Storage might be full.");
        }
    },

    loadProject: (project) => {
        set({
            channels: project.channels,
            playlistClips: project.playlistClips,
            bpm: project.bpm,
            sequenceLength: project.sequenceLength || 16,
            selectedChannelId: project.channels[0]?.id || '1'
        });
        alert(`Project "${project.name}" loaded!`);
    },

    deleteProject: (projectId) => {
        const updatedProjects = useAppStore.getState().projects.filter(p => p.id !== projectId);
        set({ projects: updatedProjects });
        localStorage.setItem('fl_studio_projects_list', JSON.stringify(updatedProjects));
    }
}));
