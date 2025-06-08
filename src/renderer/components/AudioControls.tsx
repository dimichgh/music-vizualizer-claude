import React, { useState, useEffect, useRef } from 'react';
import { AudioData, VisualizationType, CameraControls, VisualizationSettings } from '../../shared/types';

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
  onCameraReset?: () => void;
  onCameraView?: (view: 'front' | 'top' | 'side') => void;
  onCameraControlToggle?: (control: 'orbit' | 'pan' | 'zoom', enabled: boolean) => void;
  visualizationSettings?: VisualizationSettings;
  onSettingsChange?: (settings: Partial<VisualizationSettings>) => void;
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
  onCameraReset,
  onCameraView,
  onCameraControlToggle,
  visualizationSettings,
  onSettingsChange,
}) => {
  // State for showing settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Reference to tabs container
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Handle tab switching
  const switchTab = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };
  
  // Add click event handlers to tab buttons after component mounts
  useEffect(() => {
    if (tabsRef.current && visualizationType === VisualizationType.HOLIDAY_3D) {
      const tabButtons = tabsRef.current.querySelectorAll('.tab-button');
      const tabContents = tabsRef.current.querySelectorAll('.tab-content');
      
      // Reset active state
      tabButtons.forEach((button, index) => {
        if (index === activeTab) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });
      
      tabContents.forEach((content, index) => {
        if (index === activeTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Add click handlers
      tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => switchTab(index));
      });
    }
  }, [activeTab, visualizationType, showSettings]);
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
        <div className="visualization-type-row">
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
            <option value={VisualizationType.HOLIDAY}>Holiday</option>
            <option value={VisualizationType.HOLIDAY_3D}>Holiday 3D</option>
          </select>
          
          <button 
            className="settings-btn" 
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </button>
        </div>
        
        {showSettings && visualizationSettings && onSettingsChange && (
          <div className="settings-panel">
            <div className="settings-group">
              <h4>General Settings</h4>
              <div className="slider-control">
                <label>Brightness</label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1"
                  value={visualizationSettings.brightness}
                  onChange={(e) => onSettingsChange({ brightness: parseFloat(e.target.value) })}
                />
                <span>{visualizationSettings.brightness.toFixed(1)}</span>
              </div>
              
              <div className="slider-control">
                <label>Reactivity</label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1"
                  value={visualizationSettings.reactivity}
                  onChange={(e) => onSettingsChange({ reactivity: parseFloat(e.target.value) })}
                />
                <span>{visualizationSettings.reactivity.toFixed(1)}</span>
              </div>
            </div>
            
            {visualizationType === VisualizationType.HOLIDAY_3D && (
              <div className="settings-group holiday-settings">
                <h4>Holiday 3D Settings</h4>
                
                <div className="settings-tabs" ref={tabsRef}>
                  <div className="tab-buttons">
                    <button className="tab-button active">Scene</button>
                    <button className="tab-button">Effects</button>
                    <button className="tab-button">Colors</button>
                  </div>
                  
                  <div className="tab-content active">
                    <h5>Scene Elements</h5>
                    <div className="checkbox-controls">
                      <label className="feature-toggle">
                        <input 
                          type="checkbox" 
                          checked={visualizationSettings.treeLights}
                          onChange={(e) => onSettingsChange({ treeLights: e.target.checked })}
                        /> 
                        <span className="toggle-label">Tree Lights</span>
                        <span className="toggle-description">Colorful lights on trees that respond to music</span>
                      </label>
                      
                      <label className="feature-toggle">
                        <input 
                          type="checkbox" 
                          checked={visualizationSettings.crystalVisibility}
                          onChange={(e) => onSettingsChange({ crystalVisibility: e.target.checked })}
                        /> 
                        <span className="toggle-label">Ice Crystals</span>
                        <span className="toggle-description">Glowing crystals scattered around the scene</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="tab-content">
                    <h5>Visual Effects</h5>
                    <div className="slider-control with-icon">
                      <span className="slider-icon">❄️</span>
                      <label>Snow Intensity</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="2" 
                        step="0.1"
                        value={visualizationSettings.snowIntensity}
                        onChange={(e) => onSettingsChange({ snowIntensity: parseFloat(e.target.value) })}
                      />
                      <span className="slider-value">{visualizationSettings.snowIntensity?.toFixed(1)}</span>
                    </div>
                    
                    <div className="slider-control with-icon">
                      <span className="slider-icon">✨</span>
                      <label>Aurora Intensity</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="2" 
                        step="0.1"
                        value={visualizationSettings.auroraIntensity}
                        onChange={(e) => onSettingsChange({ auroraIntensity: parseFloat(e.target.value) })}
                      />
                      <span className="slider-value">{visualizationSettings.auroraIntensity?.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="tab-content">
                    <h5>Color Theme</h5>
                    <div className="theme-selector">
                      <div 
                        className={`theme-option ${visualizationSettings.colorTheme === 'classic' ? 'active' : ''}`}
                        onClick={() => onSettingsChange({ colorTheme: 'classic' })}
                      >
                        <div className="theme-preview classic-theme"></div>
                        <span>Classic</span>
                      </div>
                      <div 
                        className={`theme-option ${visualizationSettings.colorTheme === 'warm' ? 'active' : ''}`}
                        onClick={() => onSettingsChange({ colorTheme: 'warm' })}
                      >
                        <div className="theme-preview warm-theme"></div>
                        <span>Warm</span>
                      </div>
                      <div 
                        className={`theme-option ${visualizationSettings.colorTheme === 'cool' ? 'active' : ''}`}
                        onClick={() => onSettingsChange({ colorTheme: 'cool' })}
                      >
                        <div className="theme-preview cool-theme"></div>
                        <span>Cool</span>
                      </div>
                      <div 
                        className={`theme-option ${visualizationSettings.colorTheme === 'rainbow' ? 'active' : ''}`}
                        onClick={() => onSettingsChange({ colorTheme: 'rainbow' })}
                      >
                        <div className="theme-preview rainbow-theme"></div>
                        <span>Rainbow</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {visualizationType === VisualizationType.HOLIDAY_3D && (
          <div className="camera-controls">
            <h4>Camera Controls</h4>
            <div className="camera-views">
              <button 
                className="camera-view-btn" 
                title="Reset Camera"
                onClick={() => onCameraReset && onCameraReset()}
              >
                <div className="view-icon reset-icon"></div>
                <span>Reset</span>
              </button>
              <button 
                className="camera-view-btn" 
                title="Front View"
                onClick={() => onCameraView && onCameraView('front')}
              >
                <div className="view-icon front-icon"></div>
                <span>Front</span>
              </button>
              <button 
                className="camera-view-btn" 
                title="Top View"
                onClick={() => onCameraView && onCameraView('top')}
              >
                <div className="view-icon top-icon"></div>
                <span>Top</span>
              </button>
              <button 
                className="camera-view-btn" 
                title="Side View"
                onClick={() => onCameraView && onCameraView('side')}
              >
                <div className="view-icon side-icon"></div>
                <span>Side</span>
              </button>
            </div>
            
            <div className="camera-options">
              <div className="option-group">
                <h5>Navigation Options</h5>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    defaultChecked={true} 
                    onChange={(e) => onCameraControlToggle && onCameraControlToggle('orbit', e.target.checked)}
                  /> 
                  <span className="switch-slider"></span>
                  <span className="switch-label">Orbit Camera</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    defaultChecked={true} 
                    onChange={(e) => onCameraControlToggle && onCameraControlToggle('pan', e.target.checked)}
                  /> 
                  <span className="switch-slider"></span>
                  <span className="switch-label">Pan Camera</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    defaultChecked={true} 
                    onChange={(e) => onCameraControlToggle && onCameraControlToggle('zoom', e.target.checked)}
                  /> 
                  <span className="switch-slider"></span>
                  <span className="switch-label">Zoom Camera</span>
                </label>
              </div>
              <div className="camera-help">
                <p><strong>Navigation Help:</strong></p>
                <ul>
                  <li>Left-click + drag to rotate</li>
                  <li>Right-click + drag to pan</li>
                  <li>Scroll wheel to zoom</li>
                </ul>
              </div>
            </div>
          </div>
        )}
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