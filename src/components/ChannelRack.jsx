import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Volume2, Music, Trash2, Settings2, Save } from 'lucide-react';
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
    const { toggleStep, currentStep, selectedChannelId, setSelectedChannelId, deleteChannel, sequenceLength, updateChannel, saveSoundToLibrary } = useAppStore();
    const isActive = selectedChannelId === channel.id;
    const [showSettings, setShowSettings] = React.useState(false);

    // Close settings when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (showSettings && !e.target.closest('.channel-settings-popover') && !e.target.closest('.settings-btn')) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSettings]);

    return (
        <div
            onClick={() => setSelectedChannelId(channel.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(255,140,0,0.1)' : 'transparent',
                width: 'max-content',
                minWidth: '100%',
                boxSizing: 'border-box',
                position: 'relative'
            }}
        >
            {/* Sticky Track Info */}
            <div style={{
                width: '240px',
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
                <div style={{ width: '4px', height: '20px', flexShrink: 0, background: channel.color || (channel.type === 'sampler' ? '#4a9eff' : '#ffcf4a') }} />

                <span style={{
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? 'var(--primary)' : 'inherit',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                }}>{channel.name}</span>

                {/* Settings Button */}
                <button
                    className="btn-icon settings-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(!showSettings);
                    }}
                    style={{ color: 'var(--text-dim)', padding: '4px' }}
                    title="Channel Settings"
                >
                    <Settings2 size={14} />
                </button>

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
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Popover Settings */}
            {showSettings && (
                <div className="channel-settings-popover" style={{
                    position: 'absolute',
                    top: '100%',
                    left: '20px',
                    zIndex: 100,
                    width: '300px',
                    background: '#252525',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    padding: '16px',
                    borderRadius: '4px',
                    cursor: 'default'
                }} onClick={e => e.stopPropagation()}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--primary)', borderBottom: '1px solid #333', paddingBottom: '8px' }}>Channel Settings: {channel.name}</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {channel.type === 'sampler' ? (
                            <>
                                {/* Root Note */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '12px', color: '#aaa' }}>Root Note</label>
                                    <div style={{ display: 'flex', gap: '5px', width: '60%' }}>
                                        <select
                                            value={channel.rootNote || 'C3'}
                                            onChange={(e) => updateChannel(channel.id, { rootNote: e.target.value })}
                                            style={{ background: '#111', border: '1px solid #333', color: 'white', fontSize: '11px', padding: '4px', flex: 1 }}
                                        >
                                            {/* Generate C0 to B8 */}
                                            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note =>
                                                [0, 1, 2, 3, 4, 5, 6, 7, 8].map(octave => {
                                                    const noteName = `${note}${octave}`;
                                                    return <option key={noteName} value={noteName}>{noteName} {noteName === 'C3' ? '(Default)' : ''}</option>;
                                                })
                                            )}
                                        </select>
                                        <button
                                            title="Auto-Detect Pitch"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const detected = audioEngine.detectPitch(channel.id);
                                                if (detected) {
                                                    updateChannel(channel.id, { rootNote: detected });
                                                } else {
                                                    alert("Could not detect pitch for this sample or it's still loading.");
                                                }
                                            }}
                                            className="btn"
                                            style={{ padding: '0 8px', fontSize: '10px', height: '24px', background: 'rgba(255,140,0,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                        >
                                            Auto
                                        </button>
                                    </div>
                                </div>

                                {/* Trim Start */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label style={{ fontSize: '12px', color: '#aaa' }}>Trim Start (Offset)</label>
                                        <span style={{ fontSize: '10px', color: '#666' }}>{(channel.trimStart || 0).toFixed(2)}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="2" step="0.01"
                                        value={channel.trimStart || 0}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            updateChannel(channel.id, { trimStart: val });
                                            // Live update audio engine
                                            audioEngine.refreshChannelSettings({ ...channel, trimStart: val });
                                        }}
                                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                                    />
                                </div>

                                {/* Trim End */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label style={{ fontSize: '12px', color: '#aaa' }}>Trim End</label>
                                        <span style={{ fontSize: '10px', color: '#666' }}>{(channel.trimEnd || 0).toFixed(2)}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="2" step="0.01"
                                        value={channel.trimEnd || 0}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            updateChannel(channel.id, { trimEnd: val });
                                            // Live update audio engine
                                            audioEngine.refreshChannelSettings({ ...channel, trimEnd: val });
                                        }}
                                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '11px' }}>
                                This channel uses a Synthesizer. Sample settings are not available.
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid #333', margin: '8px 0' }}></div>

                        <button className="btn btn-sm" onClick={() => {
                            if (channel.sampleUrl) {
                                saveSoundToLibrary({
                                    name: channel.name,
                                    username: 'User',
                                    url: channel.sampleUrl
                                });
                                alert("Channel sound saved to Library!");
                                setShowSettings(false);
                            } else {
                                alert("No sample to save (Synth channels not supported yet for library).");
                            }
                        }}>
                            <Save size={12} style={{ marginRight: '5px' }} /> Save to Library
                        </button>
                    </div>
                </div>
            )}

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
