import React, { useState, useRef, useEffect } from 'react';
import AudioControls from './AudioControls';
import Visualizer from './Visualizer';
import { AudioData, VisualizationType, CameraControls, VisualizationSettings } from '../../shared/types';

const App: React.FC = () => {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(
    VisualizationType.COSMIC
  );
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [cameraControls, setCameraControls] = useState<CameraControls>({
    position: { x: 0, y: 5, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
    enableOrbit: true,
    enablePan: true,
    enableZoom: true
  });
  
  // Add visualization settings state
  const [visualizationSettings, setVisualizationSettings] = useState<VisualizationSettings>({
    brightness: 1.0,
    reactivity: 1.0,
    snowIntensity: 1.0,
    auroraIntensity: 1.0,
    treeLights: true,
    crystalVisibility: true,
    colorTheme: 'classic'
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const handleFileOpen = async () => {
    try {
      // Stop any existing playback
      handleStop();
      
      const result = await window.electron.audioFileApi.openWavFile();
      
      if (result.canceled || !result.buffer || !result.filePath) {
        return;
      }
      
      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyser node
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      analyserNode.connect(audioContext.destination);
      analyserNodeRef.current = analyserNode;
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(result.buffer);
      
      setAudioData({
        buffer: audioBuffer,
        filePath: result.filePath,
        fileName: result.fileName || 'Unknown',
      });
      
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
      pauseTimeRef.current = 0;
    } catch (error) {
      console.error('Error opening audio file:', error);
    }
  };

  const handleMediaOpen = async () => {
    try {
      const result = await window.electron.mediaApi.openMediaFiles();
      
      if (result.canceled || !result.mediaFiles || result.mediaFiles.length === 0) {
        return;
      }
      
      // Extract URLs from the media files
      const urls = result.mediaFiles.map(file => file.url);
      setMediaUrls(urls);
      
      // Auto-switch to rectangular visualization if media files are loaded
      if (urls.length > 0 && visualizationType !== VisualizationType.RECTANGULAR) {
        setVisualizationType(VisualizationType.RECTANGULAR);
      }
    } catch (error) {
      console.error('Error opening media files:', error);
    }
  };

  // Update current time while playing
  useEffect(() => {
    const updateCurrentTime = () => {
      if (isPlaying && audioContextRef.current) {
        setCurrentTime(audioContextRef.current.currentTime - startTimeRef.current);
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
      }
    };
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);
  
  const handlePlayPause = () => {
    if (!audioData || !audioContextRef.current || !analyserNodeRef.current) return;
    
    if (isPlaying) {
      // Pause playback
      if (sourceNodeRef.current) {
        const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current;
        pauseTimeRef.current = elapsedTime;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(true);
    } else {
      // Start or resume playback
      const sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = audioData.buffer;
      sourceNode.connect(analyserNodeRef.current);
      
      if (isPaused) {
        // Resume from pause position
        sourceNode.start(0, pauseTimeRef.current);
        startTimeRef.current = audioContextRef.current.currentTime - pauseTimeRef.current;
      } else {
        // Start from beginning or specified position
        sourceNode.start(0, currentTime);
        startTimeRef.current = audioContextRef.current.currentTime - currentTime;
      }
      
      sourceNodeRef.current = sourceNode;
      setIsPlaying(true);
      setIsPaused(false);
      
      // Handle playback end
      sourceNode.onended = () => {
        if (sourceNodeRef.current === sourceNode) { // Only if this is still the active source
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentTime(0);
          pauseTimeRef.current = 0;
        }
      };
    }
  };
  
  const handleStop = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  };
  
  const handleSeek = (time: number) => {
    if (!audioData) return;
    
    const wasPlaying = isPlaying;
    
    // Stop current playback
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    // Update time
    setCurrentTime(time);
    pauseTimeRef.current = time;
    
    // Resume playback if it was playing
    if (wasPlaying) {
      handlePlayPause();
    }
  };
  
  const handleVisualizationChange = (type: VisualizationType) => {
    setVisualizationType(type);
  };
  
  // Handler for updating visualization settings
  const handleSettingsChange = (settings: Partial<VisualizationSettings>) => {
    setVisualizationSettings(prevSettings => ({
      ...prevSettings,
      ...settings
    }));
  };

  // Camera control handlers
  const handleCameraReset = () => {
    if (visualizationType === VisualizationType.HOLIDAY_3D) {
      setCameraControls({
        ...cameraControls,
        position: { x: 0, y: 5, z: 15 },
        target: { x: 0, y: 0, z: 0 }
      });
    }
  };

  const handleCameraView = (view: 'front' | 'top' | 'side') => {
    if (visualizationType === VisualizationType.HOLIDAY_3D) {
      switch (view) {
        case 'front':
          setCameraControls({
            ...cameraControls,
            position: { x: 0, y: 5, z: 20 },
            target: { x: 0, y: 0, z: 0 }
          });
          break;
        case 'top':
          setCameraControls({
            ...cameraControls,
            position: { x: 0, y: 20, z: 0.1 },
            target: { x: 0, y: 0, z: 0 }
          });
          break;
        case 'side':
          setCameraControls({
            ...cameraControls,
            position: { x: 20, y: 5, z: 0 },
            target: { x: 0, y: 0, z: 0 }
          });
          break;
      }
    }
  };

  const handleCameraControlToggle = (control: 'orbit' | 'pan' | 'zoom', enabled: boolean) => {
    if (visualizationType === VisualizationType.HOLIDAY_3D) {
      setCameraControls({
        ...cameraControls,
        enableOrbit: control === 'orbit' ? enabled : cameraControls.enableOrbit,
        enablePan: control === 'pan' ? enabled : cameraControls.enablePan,
        enableZoom: control === 'zoom' ? enabled : cameraControls.enableZoom
      });
    }
  };

  return (
    <div className="app-container">
      <div className="visualizer-container">
        <Visualizer 
          audioData={audioData} 
          isPlaying={isPlaying}
          visualizationType={visualizationType}
          audioContextRef={audioContextRef}
          sourceNodeRef={sourceNodeRef}
          analyserNodeRef={analyserNodeRef}
          mediaUrls={mediaUrls}
          cameraControls={cameraControls}
          visualizationSettings={visualizationSettings}
        />
      </div>
      <div className="controls-container">
        <AudioControls 
          audioData={audioData}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          currentTime={currentTime}
          onSeek={handleSeek}
          onFileOpen={handleFileOpen}
          onMediaOpen={handleMediaOpen}
          visualizationType={visualizationType}
          onVisualizationChange={handleVisualizationChange}
          onCameraReset={handleCameraReset}
          onCameraView={handleCameraView}
          onCameraControlToggle={handleCameraControlToggle}
          visualizationSettings={visualizationSettings}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    </div>
  );
};

export default App;