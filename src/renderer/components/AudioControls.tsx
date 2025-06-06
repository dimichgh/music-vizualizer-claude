import React from 'react';
import { AudioData, VisualizationType } from '../../shared/types';

interface AudioControlsProps {
  audioData: AudioData | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onFileOpen: () => void;
  onMediaOpen: () => void;
  currentTime: number;
  onSeek: (time: number) => void;
  visualizationType: VisualizationType;
  onVisualizationChange: (type: VisualizationType) => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  audioData,
  isPlaying,
  onPlayPause,
  onStop,
  onFileOpen,
  onMediaOpen,
  currentTime,
  onSeek,
  visualizationType,
  onVisualizationChange,
}) => {
  return (
    <>
      <div className="file-info">
        {audioData ? (
          <div>
            <div>{audioData.fileName}</div>
            <div>Duration: {audioData.buffer.duration.toFixed(2)}s</div>
          </div>
        ) : (
          <div>No file loaded</div>
        )}
      </div>
      
      <div className="playback-controls">
        <button onClick={onFileOpen}>
          Open WAV File
        </button>
        
        <button onClick={onMediaOpen}>
          Open Media Files
        </button>
        
        <button 
          onClick={onPlayPause}
          disabled={!audioData}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button 
          onClick={onStop}
          disabled={!audioData || (!isPlaying && currentTime === 0)}
        >
          Stop
        </button>
        
        {audioData && (
          <div className="seek-controls">
            <input 
              type="range" 
              min="0" 
              max={audioData.buffer.duration} 
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
            />
            <span>{formatTime(currentTime)} / {formatTime(audioData.buffer.duration)}</span>
          </div>
        )}
      </div>
      
      <div className="visualization-settings">
        <select 
          value={visualizationType}
          onChange={(e) => onVisualizationChange(e.target.value as VisualizationType)}
        >
          <option value={VisualizationType.SPECTRUM}>Spectrum</option>
          <option value={VisualizationType.WAVEFORM}>Waveform</option>
          <option value={VisualizationType.PARTICLES}>Particles</option>
          <option value={VisualizationType.COSMIC}>Cosmic</option>
          <option value={VisualizationType.PSYCHEDELIC}>Psychedelic</option>
          <option value={VisualizationType.SUNBURST}>Sunburst</option>
          <option value={VisualizationType.RECTANGULAR}>Rectangular</option>
        </select>
      </div>
    </>
  );
};

// Helper function to format time in MM:SS format
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default AudioControls;