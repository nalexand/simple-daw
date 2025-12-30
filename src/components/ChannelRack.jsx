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
    const { toggleStep, currentStep, selectedChannelId, setSelectedChannelId, deleteChannel } = useAppStore();
    const isActive = selectedChannelId === channel.id;

    return (
        <div
            onClick={() => setSelectedChannelId(channel.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(255,140,0,0.1)' : 'transparent'
            }}
        >
            <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '20px', background: channel.type === 'sampler' ? '#4a9eff' : '#ffcf4a' }} />
                <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? 'var(--primary)' : 'inherit' }}>{channel.name}</span>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
                {channel.steps.map((active, i) => (
                    <React.Fragment key={i}>
                        <Step
                            active={active}
                            current={currentStep === i}
                            onClick={() => toggleStep(channel.id, i)}
                        />
                        {(i + 1) % 4 === 0 && i !== 15 && <div style={{ width: '8px' }} />}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
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
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ff4d4d'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-dim)'}
                    title="Delete Channel"
                >
                    <Trash2 size={16} />
                </button>
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
        <div className="panel" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', position: 'relative' }}>
                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Music size={16} /> Channel Rack
                </h3>
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn"
                        style={{ fontSize: '12px' }}
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
                            width: '160px', // Wider for the search text
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

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {channels.map(ch => (
                    <ChannelRow key={ch.id} channel={ch} />
                ))}
            </div>
        </div>
    );
};

export default ChannelRack;
