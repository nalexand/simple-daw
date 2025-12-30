import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Volume2, Music, Trash2 } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';

const Step = ({ active, current, onClick }) => (
    <div
        onClick={onClick}
        style={{
            width: '24px',
            height: '32px',
            backgroundColor: active
                ? 'var(--primary)'
                : current
                    ? 'var(--bg-hover)'
                    : 'var(--bg-element)',
            border: `1px solid ${current ? 'var(--primary)' : 'rgba(0,0,0,0.3)'}`,
            borderRadius: '3px',
            cursor: 'pointer',
            transition: 'all 0.1s ease',
            boxShadow: active ? '0 0 10px var(--primary)' : 'none'
        }}
    />
);

const ChannelRow = ({ channel }) => {
    const { toggleStep, currentStep, selectedChannelId, setSelectedChannelId, deleteChannel, sequenceLength } = useAppStore();
    const isActive = selectedChannelId === channel.id;

    return (
        <div
            onClick={() => setSelectedChannelId(channel.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(255,140,0,0.1)' : 'transparent',
                width: 'max-content', // Important to allow parent to scroll
                minWidth: '100%',
                boxSizing: 'border-box'
            }}
        >
            {/* Sticky Track Info */}
            <div style={{
                width: '200px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 15px',
                position: 'sticky',
                left: 0,
                backgroundColor: isActive ? 'rgba(45, 45, 45, 1)' : 'var(--bg-panel)',
                zIndex: 2,
                borderRight: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ width: '4px', height: '20px', flexShrink: 0, background: channel.type === 'sampler' ? '#4a9eff' : '#ffcf4a' }} />

                <span style={{
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? 'var(--primary)' : 'inherit',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                }}>{channel.name}</span>

                <button
                    className="btn-icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${channel.name}?`)) {
                            audioEngine.disposeChannel(channel.id);
                            deleteChannel(channel.id);
                        }
                    }}
                    style={{
                        color: 'var(--text-dim)',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ff4d4d'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-dim)'}
                    title="Delete Channel"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Steps Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 15px'
            }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {channel.steps.slice(0, sequenceLength).map((active, i) => (
                        <React.Fragment key={i}>
                            <Step
                                active={active}
                                current={(currentStep % sequenceLength) === i}
                                onClick={() => toggleStep(channel.id, i)}
                            />
                            {(i + 1) % 4 === 0 && (i + 1) !== sequenceLength && <div style={{ minWidth: '8px' }} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ChannelRack = () => {
    const { channels, addChannel, setSoundSearchOpen } = useAppStore();
    const [showAddMenu, setShowAddMenu] = React.useState(false);

    const instruments = [
        { name: 'Kick', type: 'sampler' },
        { name: 'Snare', type: 'sampler' },
        { name: 'HiHat', type: 'sampler' },
        { name: 'Clap', type: 'sampler' },
        { name: 'Synth', type: 'synth' },
    ];

    return (
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>CHANNEL RACK</span>
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn"
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        onClick={() => setShowAddMenu(!showAddMenu)}
                    >
                        + ADD TRACK
                    </button>
                    {showAddMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: '#252525',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            zIndex: 100,
                            width: '160px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            marginTop: '5px'
                        }}>
                            {instruments.map(inst => (
                                <div
                                    key={inst.name}
                                    onClick={() => {
                                        addChannel(inst.name, inst.type);
                                        setShowAddMenu(false);
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border)',
                                        color: 'var(--text-main)',
                                        transition: 'background 0.2s'
                                    }}
                                    className="menu-item-hover"
                                    onMouseEnter={(e) => e.target.style.background = '#333'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    {inst.name}
                                </div>
                            ))}
                            <div
                                onClick={() => {
                                    setSoundSearchOpen(true);
                                    setShowAddMenu(false);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    color: 'var(--primary)',
                                    fontWeight: 'bold',
                                    transition: 'background 0.2s'
                                }}
                                className="menu-item-hover"
                                onMouseEnter={(e) => e.target.style.background = '#333'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                                🔍 Search Freesound...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {channels.map(ch => (
                        <ChannelRow key={ch.id} channel={ch} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChannelRack;
