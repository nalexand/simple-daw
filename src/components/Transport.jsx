import React, { useEffect } from 'react';
import { Play, Square, Settings, Volume2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';

const Transport = () => {
    const { isPlaying, togglePlay, bpm, setBpm, sequenceLength, setSequenceLength } = useAppStore();

    useEffect(() => {
        audioEngine.setBpm(bpm);
    }, [bpm]);

    const handleTogglePlay = async () => {
        if (!audioEngine.initialized) {
            await audioEngine.init();
        }
        const nextPlayState = !isPlaying;
        audioEngine.togglePlay(nextPlayState);
        togglePlay();
    };

    return (
        <div className="panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--border)',
            height: '60px'
        }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    className={`btn ${isPlaying ? 'primary' : ''}`}
                    onClick={handleTogglePlay}
                >
                    {isPlaying ? <Square size={16} fill="white" /> : <Play size={16} fill="currentColor" />}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '80px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)' }}>
                    <span>BPM</span>
                    <span>{bpm}</span>
                </div>
                <input
                    type="range"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '80px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)' }}>
                    <span>LEN</span>
                    <span>{sequenceLength}</span>
                </div>
                <input
                    type="range"
                    min="16"
                    max="64"
                    step="4"
                    value={sequenceLength}
                    onChange={(e) => setSequenceLength(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
            </div>

            <div style={{ flex: 1 }} />


        </div>
    );
};

export default Transport;
