import React, { memo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';

const MixerStrip = memo(({ channel }) => {
    const updateChannel = useAppStore(state => state.updateChannel);

    return (
        <div style={{
            width: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 5px',
            background: 'var(--bg-element)',
            borderRight: '1px solid var(--border)',
            height: '100%',
            whiteSpace: 'nowrap'
        }}>
            <div style={{
                fontSize: '10px',
                color: 'var(--text-dim)',
                textAlign: 'center',
                height: '30px',
                borderTop: `3px solid ${channel.color || 'var(--primary)'}`,
                width: '100%',
                paddingTop: '5px'
            }}>
                {channel.name?.toUpperCase() || 'SYNTH'}
            </div>

            {/* Pan Knob (Simplified as slider for now) */}
            <div className="knob-container">
                <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={channel.pan}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateChannel(channel.id, { pan: val });
                        audioEngine.updateChannelSettings({ ...channel, pan: val });
                    }}
                    style={{ width: '40px', accentColor: 'var(--accent)' }}
                />
                <span className="knob-label">PAN</span>
            </div>

            {/* Volume Fader */}
            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '10px 0'
            }}>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    className="vertical-slider"
                    value={channel.volume}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateChannel(channel.id, { volume: val });
                        audioEngine.updateChannelSettings({ ...channel, volume: val });
                    }}
                    style={{
                        appearance: 'slider-vertical',
                        width: '20px',
                        height: '150px',
                        accentColor: 'var(--primary)'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
                <button
                    className="btn"
                    style={{ padding: '2px 6px', fontSize: '10px', color: channel.mute ? 'var(--primary)' : 'inherit' }}
                    onClick={() => {
                        const updated = { ...channel, mute: !channel.mute };
                        updateChannel(channel.id, updated);
                        audioEngine.updateChannelSettings(updated);
                    }}
                >
                    M
                </button>
                <button
                    className="btn"
                    style={{ padding: '2px 6px', fontSize: '10px', color: channel.solo ? 'var(--accent)' : 'inherit' }}
                    onClick={() => {
                        const updated = { ...channel, solo: !channel.solo };
                        updateChannel(channel.id, updated);
                        audioEngine.updateChannelSettings(updated);
                    }}
                >
                    S
                </button>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dim)' }}>
                -
            </div>
        </div>
    );
});

const Mixer = () => {
    // Select specific state to avoid re-renders when currentStep changes
    const channels = useAppStore(state => state.channels);
    const masterVolume = useAppStore(state => state.masterVolume);
    const masterReverb = useAppStore(state => state.masterReverb);
    const masterWidth = useAppStore(state => state.masterWidth);

    // Stable way to update state
    const set = (update) => useAppStore.setState(update);

    return (
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-dim)' }}>
                MIXER
            </div>
            <div style={{ flex: 1, display: 'flex', overflowX: 'auto', background: '#181818', minHeight: '350px' }}>
                {(channels || []).map((ch, idx) => (
                    <MixerStrip key={ch?.id || idx} channel={ch} />
                ))}

                {/* Master track */}
                <div style={{
                    width: '140px',
                    background: '#252525',
                    borderLeft: '2px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '10px 10px',
                    height: '100%'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', letterSpacing: '1px' }}>MASTER</div>

                    {/* Effects Controls */}
                    <div style={{ width: '100%', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="knob-container" style={{ width: '100%' }}>
                            <span className="knob-label" style={{ marginBottom: '2px', fontSize: '9px' }}>REVERB</span>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={masterReverb}
                                onChange={(e) => {
                                    set({ masterReverb: parseFloat(e.target.value) });
                                    audioEngine.updateMasterEffects();
                                }}
                                style={{ width: '100%', accentColor: 'var(--accent)' }}
                            />
                        </div>
                        <div className="knob-container" style={{ width: '100%' }}>
                            <span className="knob-label" style={{ marginBottom: '2px', fontSize: '9px' }}>3D WIDTH</span>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={masterWidth}
                                onChange={(e) => {
                                    set({ masterWidth: parseFloat(e.target.value) });
                                    audioEngine.updateMasterEffects();
                                }}
                                style={{ width: '100%', accentColor: 'var(--accent)' }}
                            />
                        </div>
                    </div>

                    {/* Master Volume Fader */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <input
                            type="range"
                            min="0" max="1.2" step="0.01"
                            className="vertical-slider"
                            value={masterVolume}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                set({ masterVolume: val });
                                audioEngine.updateMasterEffects();
                            }}
                            style={{
                                appearance: 'slider-vertical',
                                height: '200px',
                                width: '25px',
                                accentColor: 'var(--primary)'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mixer;
