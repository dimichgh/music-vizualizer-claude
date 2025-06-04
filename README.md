# Music Visualizer

An Electron-based music visualizer application that creates ethereal, psychedelic, cosmic imagery based on audio analysis. The application also detects instruments and displays transparent figures playing those instruments according to the music.

## Features

- Load and play WAV audio files
- Real-time audio analysis and visualization
- Multiple visualization modes:
  - Spectrum analyzer
  - Waveform display
  - Particle system
  - Cosmic/space-themed visuals
  - Psychedelic patterns
- Instrument detection with animated player figures
- Cross-platform desktop application (Windows, macOS, Linux)

## Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/music-visualizer.git
cd music-visualizer

# Install dependencies
npm install
```

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

This will create packaged applications in the `out` directory.

## Project Structure

- `src/main/` - Electron main process code
- `src/renderer/` - React application (renderer process)
  - `components/` - React components
  - `audio/` - Audio processing and analysis
  - `visualizations/` - Visualization effects
  - `utils/` - Utility functions
- `src/shared/` - Shared code between processes
- `assets/` - Static assets

## Technologies Used

- Electron
- TypeScript
- React
- Web Audio API
- HTML5 Canvas/WebGL
- Three.js

## License

MIT