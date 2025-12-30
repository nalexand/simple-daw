import React from 'react';
import Transport from './components/Transport';
import ChannelRack from './components/ChannelRack';
import Mixer from './components/Mixer';
import PianoRoll from './components/PianoRoll';
import Playlist from './components/Playlist';
import SoundSearchModal from './components/SoundSearchModal';
import { useAppStore } from './store/useAppStore';
import { audioEngine } from './audio/AudioEngine';
import { Layers, ListMusic, Settings2, Activity, ChevronLeft, ChevronRight, Save, FolderOpen, Download } from 'lucide-react';

function App() {
  const { selectedChannelId, saveProject, loadProject } = useAppStore();
  const [browserWidth, setBrowserWidth] = React.useState(430);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const isResizing = React.useRef(false);

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
    if (newWidth > 150 && newWidth < 1200) {
      setBrowserWidth(newWidth);
    }
  }, []);

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
                <button className="btn" title="Save Project" onClick={saveProject}><Save size={16} /></button>
                <button className="btn" title="Load Project" onClick={loadProject}><FolderOpen size={16} /></button>
                <button className="btn" title="Export WAV" onClick={() => audioEngine.exportToWav()}><Download size={16} /></button>
                <button className="btn" onClick={() => setIsCollapsed(true)} style={{ marginLeft: 'auto' }}><ChevronLeft size={16} /></button>
              </>
            )}
          </div>

          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '20px', color: 'var(--text-dim)', fontSize: '12px', flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '10px', color: 'var(--text-main)' }}>Browser</div>
                <div style={{ paddingLeft: '10px' }}>
                  <div>📁 Packs</div>
                  <div style={{ paddingLeft: '15px' }}>📁 Drums</div>
                  <div style={{ paddingLeft: '15px' }}>📁 Instruments</div>
                  <div>📁 Projects</div>
                </div>
              </div>

              {/* Mixer in Sidebar */}
              <div style={{ borderTop: '1px solid var(--border)', height: '368px', background: '#111' }}>
                <Mixer />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '0 0 450px' }}>
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
    </>
  );
}

export default App;
