import React from 'react';
import { useAppStore } from '../store/useAppStore';

const Playlist = () => {
    const { currentStep, setCurrentStep, channels, playlistClips, addClip, moveClip, deleteClip, selectedChannelId, sequenceLength } = useAppStore();
    const [draggingClip, setDraggingClip] = React.useState(null);
    const [mouseMode, setMouseMode] = React.useState('none'); // 'none', 'painting', 'erasing'

    const handleRulerClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newBlock = Math.floor(x / 32);
        setCurrentStep(newBlock * sequenceLength);
    };

    const handleMouseInteraction = (x, trackIndex, mode) => {
        const blockIndex = Math.floor(x / 32);
        const channelId = channels[trackIndex]?.id;
        if (!channelId) return;

        const existingClip = playlistClips.find(c => c.channelId === channelId && c.blockIndex === blockIndex);

        if (mode === 'painting' && !existingClip) {
            addClip({ channelId, blockIndex, blockCount: 1 });
        } else if (mode === 'erasing' && existingClip) {
            deleteClip(existingClip.id);
        }
    };

    const handleGridMouseDown = (e, trackIndex) => {
        if (e.button === 0) { // Left click
            setMouseMode('painting');
            const rect = e.currentTarget.getBoundingClientRect();
            handleMouseInteraction(e.clientX - rect.left, trackIndex, 'painting');
        } else if (e.button === 2) { // Right click
            setMouseMode('erasing');
            const rect = e.currentTarget.getBoundingClientRect();
            handleMouseInteraction(e.clientX - rect.left, trackIndex, 'erasing');
        }
    };

    const handleGridMouseMove = (e, trackIndex) => {
        if (mouseMode === 'none') return;
        const rect = e.currentTarget.getBoundingClientRect();
        handleMouseInteraction(e.clientX - rect.left, trackIndex, mouseMode);
    };

    React.useEffect(() => {
        const handleGlobalMouseUp = () => setMouseMode('none');
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const onMouseDown = (e, clip) => {
        if (e.button === 2) {
            e.preventDefault();
            deleteClip(clip.id);
            setMouseMode('erasing');
            return;
        }
        e.stopPropagation();
        setDraggingClip({ clip, startX: e.clientX, originalBlockIndex: clip.blockIndex });

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - e.clientX;
            const blockDelta = Math.round(deltaX / 32);
            const newBlockIndex = Math.max(0, clip.blockIndex + blockDelta);
            moveClip(clip.id, newBlockIndex);
        };

        const onMouseUp = () => {
            setDraggingClip(null);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onRightClick = (e, clipId) => {
        e.preventDefault();
        // Handled in onMouseDown/handleGridMouseDown
    };

    return (
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '300px' }}>
            <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontSize: '12px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span>PLAYLIST</span>
                <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                    Drag to move | Left Drag to Paint | Right Drag to Erase | Click ruler to seek
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'auto' }}>
                {/* Track Headers */}
                <div style={{ width: '80px', flexShrink: 0, overflow: 'hidden', background: '#1a1a1a', borderRight: '1px solid #333', position: 'sticky', left: 0, zIndex: 100 }}>
                    <div style={{ height: '24px', background: '#222', borderBottom: '1px solid #333' }} /> {/* Ruler header spacer */}
                    {channels.map((ch, i) => (
                        <div key={ch.id} style={{
                            height: '40px',
                            borderBottom: '1px solid #222',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '10px',
                            color: ch.id === selectedChannelId ? 'var(--text-main)' : 'var(--text-dim)',
                            borderLeft: `3px solid ${ch.color}`
                        }}>
                            {ch.name}
                        </div>
                    ))}
                </div>

                {/* Timeline and Grid */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {/* Ruler */}
                    <div
                        onClick={handleRulerClick}
                        style={{
                            height: '24px',
                            width: '4096px',
                            background: '#222',
                            borderBottom: '1px solid #333',
                            position: 'relative',
                            cursor: 'pointer'
                        }}
                    >
                        {Array(128).fill(0).map((_, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                left: i * 32,
                                fontSize: '10px',
                                color: '#666',
                                borderLeft: '1px solid #444',
                                height: '100%',
                                paddingLeft: '2px'
                            }}>
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <div style={{
                        position: 'relative',
                        background: 'linear-gradient(90deg, #222 1px, transparent 1px), linear-gradient(#222 1px, transparent 1px)',
                        backgroundSize: '32px 40px',
                        width: '4096px',
                        flex: 1
                    }}>
                        {channels.map((ch, trackIndex) => (
                            <div
                                key={trackIndex}
                                onMouseDown={(e) => handleGridMouseDown(e, trackIndex)}
                                onMouseMove={(e) => handleGridMouseMove(e, trackIndex)}
                                onContextMenu={(e) => e.preventDefault()}
                                style={{ height: '40px', width: '100%', position: 'relative' }}
                            >
                                {playlistClips
                                    .filter(clip => clip.channelId === ch.id)
                                    .map(clip => (
                                        <div
                                            key={clip.id}
                                            onMouseDown={(e) => onMouseDown(e, clip)}
                                            onContextMenu={(e) => e.preventDefault()}
                                            style={{
                                                position: 'absolute',
                                                left: `${clip.blockIndex * 32}px`,
                                                width: `${clip.blockCount * 32}px`,
                                                height: '36px',
                                                top: '2px',
                                                backgroundColor: (ch.color || 'var(--primary)') + '44',
                                                border: `1px solid ${ch.color || 'var(--primary)'}`,
                                                boxShadow: ch.id === selectedChannelId ? `0 0 10px ${ch.color}` : 'none',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                padding: '2px',
                                                cursor: 'move',
                                                userSelect: 'none',
                                                zIndex: draggingClip?.clip.id === clip.id ? 100 : 1
                                            }}
                                        >

                                        </div>
                                    ))}
                            </div>
                        ))}

                        {/* Playhead */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: `${(currentStep / sequenceLength) * 32}px`,
                            width: '2px',
                            height: '100%',
                            background: 'white',
                            boxShadow: '0 0 5px white',
                            zIndex: 10,
                            pointerEvents: 'none'
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Playlist;
