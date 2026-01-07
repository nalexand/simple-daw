import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine'; // Static import

const NOTES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3, 2];
const ALL_NOTES = OCTAVES.flatMap(o => NOTES.map(n => `${n}${o}`));

const PianoRoll = ({ activeChannelId }) => {
    // Keyboard Mapping
    const KEY_TO_NOTE = {
        'z': 'C4', 's': 'C#4', 'x': 'D4', 'd': 'D#4', 'c': 'E4', 'v': 'F4', 'g': 'F#4', 'b': 'G4', 'h': 'G#4', 'n': 'A4', 'j': 'A#4', 'm': 'B4',
        ',': 'C5', 'l': 'C#5', '.': 'D5', ';': 'D#5', '/': 'E5',
        'q': 'C5', '2': 'C#5', 'w': 'D5', '3': 'D#5', 'e': 'E5', '4': 'F5', 'r': 'F#5', '5': 'G5', 't': 'G#5', '6': 'A5', 'y': 'A#5', '7': 'B5'
    };

    const { channels, updateChannel, currentStep, sequenceLength, isRecording } = useAppStore();
    const activeChannel = channels.find(c => c.id === activeChannelId);
    const gridRef = useRef(null);
    const [activeKeys, setActiveKeys] = React.useState({});

    // Use Ref for recording notes to avoid re-binding listeners and stale closures
    const recordingNotesRef = useRef({}); // { note: startTime }

    // Track dragging locally
    const [dragNote, setDragNote] = React.useState(null); // { pitch, time }

    // Unified Play/Record Logic
    const playNote = (pitch) => {
        const { activeChannel, isRecording, currentStep } = stateRef.current;
        if (!activeChannel) return;

        // Visual Feedback
        setActiveKeys(prev => ({ ...prev, [pitch]: true }));

        // Audio Trigger
        audioEngine.triggerSound(activeChannel, pitch);

        // Recording Logic
        if (isRecording) {
            if (recordingNotesRef.current[pitch] === undefined) {
                recordingNotesRef.current[pitch] = currentStep;
            }
        }
    };

    const stopNote = (pitch) => {
        setActiveKeys(prev => ({ ...prev, [pitch]: false }));

        const { isRecording, currentStep, sequenceLength, activeChannelId } = stateRef.current;

        if (isRecording && recordingNotesRef.current[pitch] !== undefined) {
            const startTime = recordingNotesRef.current[pitch];
            const endTime = currentStep;

            delete recordingNotesRef.current[pitch];

            // Calculate Duration
            let duration = endTime - startTime;
            if (endTime <= startTime) {
                // Wrap case or instant
                if (endTime < startTime) {
                    duration = (sequenceLength - startTime) + endTime;
                } else {
                    duration = 1;
                }
            }
            if (duration < 1) duration = 1;

            const newNote = { pitch, time: startTime, duration };

            console.log(`[Recording] Added note: ${pitch} at step ${startTime} (dur: ${duration})`);

            const freshChannel = useAppStore.getState().channels.find(c => c.id === activeChannelId);
            if (freshChannel) {
                updateChannel(activeChannelId, { notes: [...freshChannel.notes, newNote] });
            }
        }
    };

    // We need to keep "playNote" and "stopNote" stable or use Refs for the logic inside them if we want to avoid dep changes.
    // Let's inline the logic into the useEffect slightly or use a Ref for the current state dependencies.

    // Better pattern:
    // Event listener calls a ref-held function or uses refs for state.
    const stateRef = useRef({ activeChannelId, isRecording, currentStep, sequenceLength, activeChannel });
    useEffect(() => {
        stateRef.current = { activeChannelId, isRecording, currentStep, sequenceLength, activeChannel };
    }, [activeChannelId, isRecording, currentStep, sequenceLength, activeChannel]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return;
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];
            if (note) {
                playNote(note);
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];
            if (note) {
                stopNote(note);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []); // Empty dependency array! Listeners bound ONCE. Uses refs for state.

    const handleRulerClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newStep = Math.floor(x / 32);
        setCurrentStep(newStep % sequenceLength);
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => setDragNote(null);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    if (!activeChannel) return <div className="panel">Select a channel to edit notes</div>;

    const handleCellMouseDown = (pitch, time) => {
        const existingIndex = activeChannel.notes.findIndex(n => n.pitch === pitch && Number(n.time) === Number(time));

        if (existingIndex > -1) {
            // Toggle off
            const newNotes = [...activeChannel.notes];
            newNotes.splice(existingIndex, 1);
            updateChannel(activeChannelId, { notes: newNotes });
            setDragNote(null);
        } else {
            // Toggle on + Start Drag
            // Play preview
            audioEngine.triggerSound(activeChannel, pitch);

            const newNote = { pitch, time: Number(time), duration: 1 };
            updateChannel(activeChannelId, { notes: [...activeChannel.notes, newNote] });
            setDragNote({ pitch, time: Number(time) });
        }
    };

    const handleCellMouseEnter = (pitch, time) => {
        // If dragging to extend note
        if (dragNote && pitch === dragNote.pitch) {
            const startTime = Number(dragNote.time);
            const currentTime = Number(time);
            if (currentTime >= startTime) {
                const newDuration = Math.max(1, Math.min(64, currentTime - startTime + 1));
                const newNotes = activeChannel.notes.map(n =>
                    (n.pitch === dragNote.pitch && Number(n.time) === startTime)
                        ? { ...n, duration: newDuration }
                        : n
                );
                updateChannel(activeChannelId, { notes: newNotes });
            }
        }
    };

    const totalWidth = sequenceLength * 32;

    return (
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>
            <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>PIANO ROLL: {activeChannel.name}</span>
                    <button
                        className="btn"
                        onClick={() => useAppStore.getState().clearChannelNotes(activeChannelId)}
                        style={{ padding: '2px 8px', fontSize: '10px', height: 'auto', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                        Clear Notes
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-dim)' }}>
                    {isRecording && <span style={{ color: '#ff3d3d', fontWeight: 'bold', animation: 'blink 1s infinite' }}>● RECORDING</span>}
                    <span>Notes: {activeChannel.notes.length}</span>
                    <span>1/16 Grid</span>
                </div>
            </div>

            {/* Scroll Container for Vertical Sync */}
            <div style={{ flex: 1, display: 'flex', overflow: 'auto', background: '#111' }}>
                {/* Keys */}
                <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid #333', zIndex: 10, background: '#1a1a1a', position: 'sticky', left: 0 }}>
                    <div style={{ height: '24px', borderBottom: '1px solid #222', backgroundColor: '#000' }} />
                    {ALL_NOTES.map(note => (
                        <div
                            key={note}
                            onMouseDown={(e) => { e.preventDefault(); playNote(note); }}
                            onMouseUp={(e) => { e.preventDefault(); stopNote(note); }}
                            onMouseLeave={(e) => { if (activeKeys[note]) stopNote(note); }}
                            style={{
                                height: '24px',
                                borderBottom: '1px solid #222',
                                fontSize: '9px',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '5px',
                                backgroundColor: activeKeys[note] ? 'var(--primary)' : (note.includes('#') ? '#111' : '#eee'),
                                color: activeKeys[note] ? 'white' : (note.includes('#') ? '#666' : '#000'),
                                fontWeight: 'bold',
                                transition: 'background 0.1s',
                                cursor: 'pointer'
                            }}
                        >
                            {note}
                        </div>
                    ))}
                </div>

                {/* Grid Container with Horizontal Scroll */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {/* Tiny Ruler/Seek area for Piano Roll */}
                    <div
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            setCurrentStep(Math.floor(x / 32) % sequenceLength);
                        }}
                        style={{ height: '24px', width: `${totalWidth}px`, background: '#1a1a1a', cursor: 'pointer', borderBottom: '1px solid #333' }}
                    />
                    <div
                        ref={gridRef} // gridRef moved here to the inner div
                        style={{
                            width: `${totalWidth}px`,
                            position: 'relative',
                            background: 'linear-gradient(90deg, #222 1px, transparent 1px), linear-gradient(#222 1px, transparent 1px)',
                            backgroundSize: '32px 24px',
                            backgroundColor: '#151515'
                        }}
                    >
                        {ALL_NOTES.map(note => (
                            <div key={note} style={{ display: 'flex', height: '24px' }}>
                                {Array(sequenceLength).fill(0).map((_, i) => {
                                    // Check if this cell is part of a saved note
                                    const noteAtCell = activeChannel.notes.find(n =>
                                        n.pitch === note &&
                                        i >= Number(n.time) &&
                                        i < Number(n.time) + (typeof n.duration === 'number' ? n.duration : 1)
                                    );

                                    const isActive = !!noteAtCell;
                                    const isStart = noteAtCell && Number(noteAtCell.time) === i;

                                    return (
                                        <div
                                            key={i}
                                            onMouseDown={(e) => { e.preventDefault(); handleCellMouseDown(note, i); }}
                                            onMouseEnter={() => handleCellMouseEnter(note, i)}
                                            style={{
                                                minWidth: '32px',
                                                height: '100%',
                                                borderRight: i % 4 === 3 ? '1px solid #333' : '1px solid rgba(255,255,255,0.03)',
                                                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                                                cursor: 'crosshair',
                                                boxSizing: 'border-box',
                                                borderLeft: isStart ? '2px solid rgba(255,255,255,0.4)' : 'none',
                                                zIndex: isActive ? 5 : 0,
                                                boxShadow: isActive ? 'inset 0 0 5px rgba(0,0,0,0.3)' : 'none'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}

                        {/* Playhead in Piano Roll */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: `${(currentStep % sequenceLength) * 32}px`,
                            width: '2px',
                            height: '100%',
                            background: 'rgba(255,255,255,0.4)',
                            pointerEvents: 'none',
                            zIndex: 100,
                            boxShadow: '0 0 10px var(--primary)'
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PianoRoll;
