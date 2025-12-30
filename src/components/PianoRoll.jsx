import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const NOTES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3, 2];
const ALL_NOTES = OCTAVES.flatMap(o => NOTES.map(n => `${n}${o}`));

const PianoRoll = ({ activeChannelId }) => {
    const { channels, updateChannel, currentStep, setCurrentStep, sequenceLength } = useAppStore();
    const activeChannel = channels.find(c => c.id === activeChannelId);
    const gridRef = useRef(null);

    // Track dragging locally
    const [dragNote, setDragNote] = React.useState(null); // { pitch, time }

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
            const newNote = { pitch, time: Number(time), duration: 1 };
            updateChannel(activeChannelId, { notes: [...activeChannel.notes, newNote] });
            setDragNote({ pitch, time: Number(time) });
        }
    };

    const handleCellMouseEnter = (pitch, time) => {
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
                <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>PIANO ROLL: {activeChannel.name}</span>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-dim)' }}>
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
                        <div key={note} style={{
                            height: '24px',
                            borderBottom: '1px solid #222',
                            fontSize: '9px',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '5px',
                            backgroundColor: note.includes('#') ? '#111' : '#eee',
                            color: note.includes('#') ? '#666' : '#000',
                            fontWeight: 'bold'
                        }}>
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
