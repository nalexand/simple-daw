import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Play, Plus, Search, Loader2 } from 'lucide-react';

const SoundSearchModal = () => {
    const { isSoundSearchOpen, setSoundSearchOpen, addChannel } = useAppStore();
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [apiKey, setApiKey] = React.useState('');

    if (!isSoundSearchOpen) return null;

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            // Freesound Search API
            const token = apiKey.trim() || '6yO5R9R9M2V5T8K8G8J8H8F8D8S8A8Q8'; // Placeholder/Hint
            const response = await fetch(`https://freesound.org/apiv2/search/text/?query=${query}&fields=id,name,previews,username&token=${token}`);

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            console.error('Freesound search failed', err);
            alert('Search failed. Please check your Freesound API token (Client Secret).');
        } finally {
            setLoading(false);
        }
    };

    const getBestPreview = (previews) => {
        if (!previews) return null;
        return previews['preview-hq-ogg'] ||
            previews['preview-lq-ogg'] ||
            previews['preview-hq-mp3'] ||
            previews['preview-lq-mp3'];
    };

    const handleAddSound = (sound) => {
        const url = getBestPreview(sound.previews);
        if (!url) {
            alert('No suitable audio preview found for this sound.');
            return;
        }
        // Use the sound name and type 'sampler'
        addChannel(sound.name, 'sampler', url);
        setSoundSearchOpen(false);
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="panel" style={{
                width: '600px',
                height: '600px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 0 40px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', margin: 0 }}>
                        <Search size={24} className="text-primary" /> Freesound Library
                    </h2>
                    <button className="btn btn-icon" onClick={() => setSoundSearchOpen(false)}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Freesound API Token</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="password"
                            placeholder="Enter your Client Token here..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                flex: 1
                            }}
                        />
                        <a href="https://freesound.org/apiv2/apply/" target="_blank" rel="noreferrer" className="btn" style={{ fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Get Key</a>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <input
                        className="input"
                        type="text"
                        placeholder="Search for sounds (e.g. kick, vinyl, field)..."
                        value={query}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ flex: 1, height: '42px', fontSize: '15px' }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={loading}
                        style={{ padding: '0 24px', height: '42px' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    {results.map(sound => (
                        <div key={sound.id} style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.2s'
                        }} className="search-result-item">
                            <div style={{ flex: 1, overflow: 'hidden', marginRight: '16px' }}>
                                <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sound.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>by {sound.username}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-icon btn-sm" onClick={() => {
                                    const url = getBestPreview(sound.previews);
                                    if (url) {
                                        const audio = new Audio(url);
                                        audio.play();
                                    }
                                }} title="Preview"><Play size={14} /></button>
                                <button className="btn btn-primary btn-sm" onClick={() => handleAddSound(sound)} title="Add to project">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {results.length === 0 && !loading && (
                        <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                            <Search size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <div>Search Freesound for high-quality samples.</div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
                    Samples provided by <a href="https://freesound.org" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Freesound.org</a> under Creative Commons licenses.
                </div>
            </div>
        </div>
    );
};

export default SoundSearchModal;
