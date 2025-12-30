import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { audioEngine } from './audio/AudioEngine'

// Pre-load default samples
const defaultSamples = {
  '1': 'https://raw.githubusercontent.com/mdn/webaudio-examples/master/step-sequencer/sounds/kick.wav',
  '2': 'https://raw.githubusercontent.com/mdn/webaudio-examples/master/step-sequencer/sounds/snare.wav',
  '3': 'https://raw.githubusercontent.com/mdn/webaudio-examples/master/step-sequencer/sounds/hihat.wav',
  '4': 'https://raw.githubusercontent.com/mdn/webaudio-examples/master/step-sequencer/sounds/clap.wav'
};

Object.entries(defaultSamples).forEach(([id, url]) => {
  audioEngine.loadSample(id, url);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
