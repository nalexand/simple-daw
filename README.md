# Simple DAW

A modern, web-based Digital Audio Workstation built with React, Vite, and Tone.js. Create beats, melodies, and arrangements directly in your browser.

![DAW Screenshot](https://via.placeholder.com/800x450.png?text=Simple+DAW+Screenshot)

## Features

### 🎧 **Audio & Sequencing**
- **Channel Rack**: Classic step sequencer workflow with configurable pattern length (16 to 64 steps).
- **Piano Roll**: Intuitive MIDI-style editor for complex melodies and chords.
- **Dynamic Playlist**: Arrange your patterns into full songs with a block-based timeline.
- **Audio Engine**: Powered by **Tone.js** for sample-accurate timing and high-quality audio synthesis.

### 🎛️ **Mixing & Effects**
- **Mixer**: Per-channel Volume, Pan, Mute, and Solo controls.
- **Master Effects**: Global Reverb and Stereo Width (3D Sound) processing.
- **WAV Export**: Render your full arrangement to a high-quality WAV file.

### 📂 **Sample Library**
- **Freesound Integration**: Search and import thousands of sounds directly from Freesound.org logic.
- **Drag & Drop**: (Planned/Partial) support for samples.

### 💾 **Project Management**
- **Save & Load**: Save projects locally to your browser or download them as `.json` files.
- **Projects List**: Built-in side panel to manage your saved compositions.
- **Persistence**: Auto-saves logic prevents data loss on reload.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite
- **State Management**: Zustand
- **Audio**: Tone.js
- **Styling**: Vanilla CSS (Dark Theme)
- **Icons**: Lucide React

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/simple-daw.git
   cd simple-daw
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:5173`

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

Copyright (c) 2025 Simple DAW Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
