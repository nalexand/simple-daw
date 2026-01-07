import React from 'react';
import Transport from './components/Transport';
import ChannelRack from './components/ChannelRack';
import Mixer from './components/Mixer';
import PianoRoll from './components/PianoRoll';
import Playlist from './components/Playlist';
import SoundSearchModal from './components/SoundSearchModal';
import { useAppStore } from './store/useAppStore';
import { audioEngine } from './audio/AudioEngine';
import { Layers, ListMusic, Settings2, Sliders, Activity, ChevronLeft, ChevronRight, Save, FolderOpen, Download, Trash2, Play } from 'lucide-react';

const App = () => {
  const { selectedChannelId, saveProject, loadProject, projects, deleteProject, savedSounds, removeSoundFromLibrary, addChannel, isMixerOpen, setMixerOpen } = useAppStore();
  const [browserWidth, setBrowserWidth] = React.useState(250);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [sidebarTab, setSidebarTab] = React.useState('projects'); // 'projects' | 'sounds'
  const isResizing = React.useRef(false);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMixerOpen]);

  const startResizing = React.useCallback((e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  }, []);

  const handleMouseMove = React.useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth > 150 && newWidth < 800) {
      setBrowserWidth(newWidth);
    }
  }, []);

  const fileInputRef = React.useRef(null);

  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target.result);
        loadProject(project);
      } catch (err) {
        console.error("Failed to parse project file:", err);
        alert("Invalid project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const handleSave = () => {
    const name = prompt("Enter project name:", `Project ${projects.length + 1}`);
    if (name) saveProject(name);
  };

  return (
    <>
      <Transport />

      <div className="daw-container">
        {/* Sidebar / Browser */}
        <div className="panel" style={{
          width: isCollapsed ? '40px' : `${browserWidth}px`,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: isResizing.current ? 'none' : 'width 0.2s ease',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '5px', overflow: 'hidden' }}>
            {isCollapsed ? (
              <button className="btn" onClick={() => setIsCollapsed(false)}><ChevronRight size={16} /></button>
            ) : (
              <>
                <button className="btn" title="Save Project" onClick={handleSave}><Save size={16} /></button>
                <button className="btn" title="Load Project File" onClick={() => fileInputRef.current.click()}><FolderOpen size={16} /></button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileLoad}
                  accept=".json"
                  style={{ display: 'none' }}
                />
                <div style={{ width: '1px', background: 'var(--border)', margin: '0 5px' }} />
                <button className="btn" title="Export WAV" onClick={() => audioEngine.exportToWav()}><Download size={16} /></button>
                <button className="btn" onClick={() => setIsCollapsed(true)} style={{ marginLeft: 'auto' }}><ChevronLeft size={16} /></button>
              </>
            )}
          </div>

          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

              {/* Sidebar Tabs */}
              <div style={{ display: 'flex', background: '#222', borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => setSidebarTab('projects')}
                  style={{ flex: 1, padding: '8px', background: sidebarTab === 'projects' ? 'var(--bg-main)' : 'transparent', border: 'none', color: sidebarTab === 'projects' ? 'var(--primary)' : 'var(--text-dim)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                  PROJECTS
                </button>
                <button
                  onClick={() => setSidebarTab('sounds')}
                  style={{ flex: 1, padding: '8px', background: sidebarTab === 'sounds' ? 'var(--bg-main)' : 'transparent', border: 'none', color: sidebarTab === 'sounds' ? 'var(--primary)' : 'var(--text-dim)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                  SAVED SOUNDS
                </button>
              </div>

              <div style={{ padding: '10px', color: 'var(--text-dim)', fontSize: '12px', flex: 1, overflowY: 'auto' }}>

                {sidebarTab === 'projects' && (
                  <>
                    {projects.length === 0 ? (
                      <div style={{ fontStyle: 'italic', padding: '10px' }}>No saved projects</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {projects.map(p => (
                          <div
                            key={p.id}
                            style={{
                              padding: '6px 8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            className="menu-item-hover"
                            onClick={() => loadProject(p)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                              <span style={{ fontSize: '10px', color: '#666' }}>{new Date(p.date).toLocaleDateString()}</span>
                            </div>
                            <Trash2
                              size={12}
                              color="#666"
                              style={{ flexShrink: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${p.name}"?`)) deleteProject(p.id);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {sidebarTab === 'sounds' && (
                  <>
                    {savedSounds.length === 0 ? (
                      <div style={{ fontStyle: 'italic', padding: '10px' }}>No saved sounds</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {savedSounds.map(s => (
                          <div
                            key={s.id}
                            style={{
                              padding: '6px 8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            className="menu-item-hover"
                            title="Click to add to channel rack"
                            onClick={() => addChannel(s.name, 'sampler', s.previews?.['preview-hq-ogg'] || s.url)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  audioEngine.previewSample(s.previews?.['preview-hq-ogg'] || s.url);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '4px',
                                  color: 'var(--text-dim)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255,255,255,0.05)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                                title="Preview Sound"
                              >
                                <Play size={12} fill="currentColor" />
                              </button>

                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                                <span style={{ fontSize: '10px', color: '#666' }}>{s.username}</span>
                              </div>
                            </div>
                            <Trash2
                              size={12}
                              color="#666"
                              style={{ flexShrink: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Remove "${s.name}" from library?`)) removeSoundFromLibrary(s.id);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Resizer Handle */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: 'transparent',
              // Note: '&:hover' is not valid in inline styles. This would typically be handled with a CSS class or a state-based style change.
              // For simplicity in this inline style context, we'll omit the hover effect.
            }}
          />
        )}

        {/* Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '10px', height: '400px', minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '0 0 50%', maxWidth: '50%', minWidth: 0 }}>
              <ChannelRack />
            </div>
            <PianoRoll activeChannelId={selectedChannelId} />
          </div>

          <Playlist />

          {/* Bottom Info */}
          <div className="panel" style={{ height: '40px', display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: '12px', color: 'var(--text-dim)', marginTop: '10px' }}>
            <Activity size={14} style={{ marginRight: '8px' }} />
            44100Hz | 24bit | Buffer: 512 | Tone.js Ready
          </div>
        </div>
      </div>
      <SoundSearchModal />

      {/* Mixer Modal */}
      {
        isMixerOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }} onClick={() => setMixerOpen(false)}>
            <div
              style={{
                width: '80%',
                maxWidth: '1000px',
                maxHeight: '80vh',
                background: '#111',
                borderRadius: '8px',
                border: '2px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '10px 15px', background: '#222', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13px', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} /> MIXER
                </h3>
                <button className="btn" onClick={() => setMixerOpen(false)} style={{ padding: '4px 8px', minWidth: 0, height: 'auto' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '10px', height: '400px', minHeight: '400px', display: 'flex' }}>
                <Mixer />
              </div>
            </div>
          </div>
        )
      }
    </>
  );
}

export default App;
