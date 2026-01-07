import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Play, Plus, Search, Loader2, Save, Trash2 } from 'lucide-react';

const SoundSearchModal = () => {
    const { isSoundSearchOpen, setSoundSearchOpen, addChannel, saveSoundToLibrary, savedSounds, removeSoundFromLibrary } = useAppStore();
    const [activeTab, setActiveTab] = React.useState('search'); // 'search' | 'saved'

    // Search State
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [apiKey, setApiKey] = React.useState('');
    const [page, setPage] = React.useState(1);

    // Filters
    const [minDuration, setMinDuration] = React.useState('');
    const [maxDuration, setMaxDuration] = React.useState('15');

    const currentAudioRef = useRef(null);

    // 2. Stop audio when the modal is closed
    useEffect(() => {
        if (!isSoundSearchOpen && currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
    }, [isSoundSearchOpen]);

    // 3. New function to handle playing sounds exclusively
    const handlePreview = (url) => {
        if (!url) return;

        // If there is a sound playing, pause it and reset time
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
        }

        // Create new audio, save it to ref, and play
        const newAudio = new Audio(url);
        currentAudioRef.current = newAudio;
        newAudio.play().catch(e => console.log('Audio play interrupted', e));
    };

    if (!isSoundSearchOpen) return null;

    const handleSearch = async (newPage = 1) => {
        if (!query) return;
        setLoading(true);
        // Reset results if new search
        if (newPage === 1) setResults([]);

        try {
            // Freesound Search API
            const token = apiKey.trim() || '6yO5R9R9M2V5T8K8G8J8H8F8D8S8A8Q8'; // Placeholder/Hint
            let filterString = '';
            if (maxDuration) filterString += ` duration:[${minDuration || 0} TO ${maxDuration}]`;

            const fields = 'id,name,previews,username,duration,tags';
            const url = `https://freesound.org/apiv2/search/text/?query=${query}&filter=${encodeURIComponent(filterString)}&fields=${fields}&page=${newPage}&token=${token}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            setResults(data.results || []);
            setPage(newPage);
        } catch (err) {
            console.error('Freesound search failed', err);
            alert('Search failed. Please check your Freesound API token.');
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

        // Stop preview before adding
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
        }

        // Use the sound name and type 'sampler'
        // Add with Default C3, No Trim
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
                width: '700px',
                height: '650px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 0 40px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <h2
                            onClick={() => setActiveTab('search')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', margin: 0,
                                color: activeTab === 'search' ? 'var(--primary)' : 'var(--text-dim)', cursor: 'pointer'
                            }}>
                            <Search size={24} /> Freesound
                        </h2>
                        <h2
                            onClick={() => setActiveTab('saved')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', margin: 0,
                                color: activeTab === 'saved' ? 'var(--primary)' : 'var(--text-dim)', cursor: 'pointer'
                            }}>
                            Saved Library
                        </h2>
                    </div>
                    <button className="btn btn-icon" onClick={() => setSoundSearchOpen(false)}><X size={20} /></button>
                </div>

                {/* API Key Input (only in search) */}
                {activeTab === 'search' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="password"
                                placeholder="Freesound API Token..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    width: '150px'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <input
                                    placeholder="Min Sec"
                                    className="input"
                                    style={{ width: '60px', height: '30px', fontSize: '11px' }}
                                    value={minDuration}
                                    onChange={e => setMinDuration(e.target.value)}
                                />
                                <span style={{ fontSize: '10px' }}>to</span>
                                <input
                                    placeholder="Max Sec"
                                    className="input"
                                    style={{ width: '60px', height: '30px', fontSize: '11px' }}
                                    value={maxDuration}
                                    onChange={e => setMaxDuration(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'search' && (
                    <>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <input
                                className="input"
                                type="text"
                                placeholder="Search sounds..."
                                value={query}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{ flex: 1, height: '42px', fontSize: '15px' }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSearch(1)}
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
                                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{parseInt(sound.duration)}s • by {sound.username}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-icon btn-sm" onClick={() => {
                                            handlePreview(getBestPreview(sound.previews));
                                        }} title="Preview"><Play size={14} /></button>

                                        <button className="btn btn-sm" onClick={() => {
                                            saveSoundToLibrary({
                                                id: sound.id, // Use sound.id for unique identification
                                                name: sound.name,
                                                username: sound.username,
                                                duration: sound.duration,
                                                url: getBestPreview(sound.previews),
                                                // formatted_filename: sound.name + '.ogg' // Not needed for saved sounds
                                            });
                                            alert("Saved to Library!");
                                        }} title="Save to Library">
                                            <Save size={14} />
                                        </button>

                                        <button className="btn btn-primary btn-sm" onClick={() => handleAddSound(sound)} title="Add to project">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {results.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', gap: '10px' }}>
                                    <button disabled={page <= 1} onClick={() => handleSearch(page - 1)} className="btn btn-sm">Prev</button>
                                    <span style={{ fontSize: '12px', alignSelf: 'center' }}>Page {page}</span>
                                    <button onClick={() => handleSearch(page + 1)} className="btn btn-sm">Next</button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'saved' && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        {savedSounds.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No saved sounds yet. Search and save sounds to build your library.</div>
                        ) : (
                            savedSounds.map(s => (
                                <div key={s.id} style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{s.name}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{s.username}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-icon btn-sm" onClick={() => handlePreview(s.url)}><Play size={14} /></button>
                                        <button className="btn btn-primary btn-sm" onClick={() => {
                                            addChannel(s.name, 'sampler', s.url);
                                            setSoundSearchOpen(false);
                                        }}><Plus size={16} /></button>
                                        <button className="btn btn-sm btn-icon" onClick={() => {
                                            if (confirm("Remove?")) removeSoundFromLibrary(s.id);
                                        }}><Trash2 size={14} color="#666" /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
                    Samples provided by <a href="https://freesound.org" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Freesound.org</a> under Creative Commons licenses.
                </div>
            </div>
        </div>
    );
};

export default SoundSearchModal;
