import React, { useRef, useEffect, useState, MutableRefObject } from 'react';
import { AudioData, VisualizationType, AudioAnalysisData, CameraControls, VisualizationSettings } from '../../shared/types';
import SunburstVisualization from '../visualizations/sunburst';
import RectangularVisualization from '../visualizations/rectangular';
import HolidayVisualization from '../visualizations/holiday';
import Holiday3DVisualization from '../visualizations/holiday3d';
import { FFT_SIZE, SMOOTHING_TIME_CONSTANT } from '../../shared/constants';

interface VisualizerProps {
  audioData: AudioData | null;
  isPlaying: boolean;
  visualizationType: VisualizationType;
  audioContextRef: MutableRefObject<AudioContext | null>;
  sourceNodeRef: MutableRefObject<AudioBufferSourceNode | null>;
  analyserNodeRef: MutableRefObject<AnalyserNode | null>;
  mediaUrls?: string[]; // New prop for media URLs
  cameraControls?: CameraControls; // New prop for camera controls
  visualizationSettings?: VisualizationSettings; // New prop for visualization settings
}

const Visualizer: React.FC<VisualizerProps> = ({
  audioData,
  isPlaying,
  visualizationType,
  audioContextRef,
  sourceNodeRef,
  analyserNodeRef,
  mediaUrls = [],
  cameraControls,
  visualizationSettings,
}) => {
  // Use separate canvas refs for 2D and 3D visualizations to avoid context conflicts
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  
  // Helper to get the active canvas based on visualization type
  const getActiveCanvas = () => {
    return visualizationType === VisualizationType.HOLIDAY_3D ? 
      canvas3DRef.current : canvas2DRef.current;
  };
  // We now receive these refs from props instead of creating them here
  const rafIdRef = useRef<number | null>(null);
  const sunburstRef = useRef<SunburstVisualization | null>(null);
  const rectangularRef = useRef<RectangularVisualization | null>(null);
  const holidayRef = useRef<HolidayVisualization | null>(null);
  const holiday3DRef = useRef<Holiday3DVisualization | null>(null);
  
  // Camera controls for 3D visualization
  const [localCameraControls, setLocalCameraControls] = useState<CameraControls>({
    position: { x: 0, y: 5, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
    enableOrbit: true,
    enablePan: true,
    enableZoom: true
  });
  
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(null);

  // Handle animation based on play state
  useEffect(() => {
    if (!audioData || !analyserNodeRef.current) return;
    
    // Clean up existing visualizations when the visualization type changes
    if (visualizationType === VisualizationType.HOLIDAY_3D) {
      // Clean up 2D visualizations
      if (sunburstRef.current) {
        sunburstRef.current.destroy();
        sunburstRef.current = null;
      }
      if (rectangularRef.current) {
        rectangularRef.current.destroy();
        rectangularRef.current = null;
      }
      if (holidayRef.current) {
        holidayRef.current.destroy();
        holidayRef.current = null;
      }
      
      // Ensure the 3D canvas is ready for use
      const canvas3D = canvas3DRef.current;
      if (canvas3D) {
        canvas3D.width = canvas3D.clientWidth || window.innerWidth;
        canvas3D.height = canvas3D.clientHeight || window.innerHeight;
      }
    } else {
      // Clean up 3D visualization
      if (holiday3DRef.current) {
        holiday3DRef.current.destroy();
        holiday3DRef.current = null;
      }
      
      // Ensure the 2D canvas is ready for use
      const canvas2D = canvas2DRef.current;
      if (canvas2D) {
        canvas2D.width = canvas2D.clientWidth || window.innerWidth;
        canvas2D.height = canvas2D.clientHeight || window.innerHeight;
      }
    }
    
    if (isPlaying) {
      // Start animation
      startVisualization();
    } else {
      // Stop animation
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
    
    return () => {
      // Cleanup function
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [audioData, isPlaying, visualizationType]);

  // Set media URLs when they change
  useEffect(() => {
    if (rectangularRef.current && mediaUrls.length > 0) {
      rectangularRef.current.setMediaItems(mediaUrls);
    }
  }, [mediaUrls, visualizationType]);

  const startVisualization = () => {
    // Get the appropriate canvas based on visualization type
    const canvas = getActiveCanvas();
    if (!canvas || !analyserNodeRef.current) return;
    
    const analyser = analyserNodeRef.current;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
    
    // Only get 2D context if we're not using 3D visualization
    let ctx = null;
    if (visualizationType !== VisualizationType.HOLIDAY_3D) {
      // For 2D visualizations, clear any existing context first
      ctx = canvas.getContext('2d');
      if (!ctx) return;
    }
    
    // Create data arrays
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const waveformData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyser.frequencyBinCount);
    
    const animate = () => {
      rafIdRef.current = requestAnimationFrame(animate);
      
      // Get frequency and time domain data
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeDomainData);
      
      // Calculate average frequency
      let sum = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
      }
      const averageFrequency = sum / frequencyData.length;
      
      // Find peaks (for beat detection)
      const peaks: number[] = [];
      for (let i = 1; i < frequencyData.length - 1; i++) {
        if (frequencyData[i] > frequencyData[i - 1] && 
            frequencyData[i] > frequencyData[i + 1] &&
            frequencyData[i] > 200) {
          peaks.push(i);
        }
      }
      
      // Update analysis data
      setAnalysisData({
        frequencyData: new Uint8Array(frequencyData),
        waveformData: new Uint8Array(waveformData),
        timeDomainData: new Uint8Array(timeDomainData),
        averageFrequency,
        peaks,
        bpm: null, // Will implement BPM detection later
        instrumentPrediction: null, // Will implement instrument detection later
      });
      
      // Handle visualization based on type
      if (visualizationType === VisualizationType.HOLIDAY_3D) {
        // For 3D visualization, we use the dedicated 3D canvas
        const canvas3D = canvas3DRef.current;
        if (!canvas3D) return;
        drawHoliday3D(null, canvas3D, frequencyData, timeDomainData, averageFrequency, analysisData ? analysisData.instrumentPrediction : null);
      } else if (ctx) {
        // For 2D visualizations, clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw based on visualization type
        switch (visualizationType) {
        case VisualizationType.SPECTRUM:
          drawSpectrum(ctx, canvas, frequencyData);
          break;
        case VisualizationType.WAVEFORM:
          drawWaveform(ctx, canvas, timeDomainData);
          break;
        case VisualizationType.PARTICLES:
          drawParticles(ctx, canvas, frequencyData, averageFrequency);
          break;
        case VisualizationType.COSMIC:
          drawCosmic(ctx, canvas, frequencyData, timeDomainData, averageFrequency);
          break;
        case VisualizationType.PSYCHEDELIC:
          drawPsychedelic(ctx, canvas, frequencyData, timeDomainData, averageFrequency);
          break;
        case VisualizationType.SUNBURST:
          drawSunburst(ctx, canvas, frequencyData, timeDomainData, averageFrequency, analysisData ? analysisData.instrumentPrediction : null);
          break;
        case VisualizationType.RECTANGULAR:
          drawRectangular(ctx, canvas, frequencyData, timeDomainData, averageFrequency, analysisData ? analysisData.instrumentPrediction : null);
          break;
        case VisualizationType.HOLIDAY:
          drawHoliday(ctx, canvas, frequencyData, timeDomainData, averageFrequency, analysisData ? analysisData.instrumentPrediction : null);
          break;
        // HOLIDAY_3D case is handled outside the switch
        default:
          drawSpectrum(ctx, canvas, frequencyData);
        }
      }
    };
    
    // Add a small delay before starting animation for Holiday3D
    // to ensure proper WebGL context initialization
    if (visualizationType === VisualizationType.HOLIDAY_3D) {
      setTimeout(() => animate(), 100);
    } else {
      animate();
    }
  };

  const stopVisualization = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  // Cleanup function for the useEffect hook
  useEffect(() => {
    return () => {
      // Clean up visualizations if they exist
      if (sunburstRef.current) {
        sunburstRef.current.destroy();
        sunburstRef.current = null;
      }
      if (rectangularRef.current) {
        rectangularRef.current.destroy();
        rectangularRef.current = null;
      }
      if (holidayRef.current) {
        holidayRef.current.destroy();
        holidayRef.current = null;
      }
      if (holiday3DRef.current) {
        holiday3DRef.current.destroy();
        holiday3DRef.current = null;
      }
    };
  }, []);

  // Basic visualization renderers
  const drawSpectrum = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    frequencyData: Uint8Array
  ) => {
    const barWidth = canvas.width / frequencyData.length;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * canvas.height;
      
      const r = 255 * (i / frequencyData.length);
      const g = 100 * (frequencyData[i] / 255);
      const b = 255 - (i / frequencyData.length) * 255;
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
    }
  };
  
  const drawWaveform = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    timeDomainData: Uint8Array
  ) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00FFFF';
    ctx.beginPath();
    
    const sliceWidth = canvas.width / timeDomainData.length;
    let x = 0;
    
    for (let i = 0; i < timeDomainData.length; i++) {
      const v = timeDomainData[i] / 128.0;
      const y = v * canvas.height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };
  
  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    averageFrequency: number
  ) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const particleCount = 100;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * (0.5 + (averageFrequency / 255) * 0.5);
    
    for (let i = 0; i < particleCount; i++) {
      const freqIndex = Math.floor(i / particleCount * frequencyData.length);
      const amplitude = frequencyData[freqIndex] / 255;
      
      const angle = (i / particleCount) * Math.PI * 2;
      const particleRadius = 2 + amplitude * 8;
      
      const x = centerX + Math.cos(angle) * radius * amplitude;
      const y = centerY + Math.sin(angle) * radius * amplitude;
      
      const hue = (i / particleCount) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(x, y, particleRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  const drawCosmic = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    averageFrequency: number
  ) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2 + (averageFrequency / 255) * 3;
      
      const freqIndex = Math.floor(Math.random() * frequencyData.length);
      const brightness = 50 + (frequencyData[freqIndex] / 255) * 50;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness / 100})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw nebula-like shapes
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let i = 0; i < 5; i++) {
      const radius = 50 + Math.random() * 200 + (averageFrequency / 255) * 100;
      const x = centerX + (Math.random() - 0.5) * canvas.width * 0.5;
      const y = centerY + (Math.random() - 0.5) * canvas.height * 0.5;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      const hue1 = Math.random() * 60 + 180; // Blue to purple
      const hue2 = hue1 + 30;
      
      gradient.addColorStop(0, `hsla(${hue1}, 100%, 50%, 0.2)`);
      gradient.addColorStop(1, `hsla(${hue2}, 100%, 50%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  const drawPsychedelic = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    averageFrequency: number
  ) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw psychedelic circles
    const circleCount = 5;
    for (let i = 0; i < circleCount; i++) {
      const freqIndex = Math.floor((i / circleCount) * frequencyData.length);
      const amplitude = frequencyData[freqIndex] / 255;
      
      const radius = 50 + i * 50 + amplitude * 100;
      
      const hue = (Date.now() / 100 + i * 30) % 360;
      
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.lineWidth = 2 + amplitude * 8;
      
      ctx.beginPath();
      ctx.arc(
        centerX, 
        centerY, 
        radius, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();
    }
    
    // Draw spiral patterns
    const spiralCount = 5;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
    
    for (let i = 0; i < spiralCount; i++) {
      const freqIndex = Math.floor((i / spiralCount) * frequencyData.length);
      const amplitude = frequencyData[freqIndex] / 255;
      
      const rotation = (Date.now() / 1000 + i) % (Math.PI * 2);
      const arms = 5 + Math.floor(amplitude * 10);
      
      ctx.strokeStyle = `hsl(${(i * 60) % 360}, 100%, 50%)`;
      ctx.lineWidth = 2 + amplitude * 3;
      
      for (let arm = 0; arm < arms; arm++) {
        ctx.beginPath();
        
        for (let r = 0; r < maxRadius; r += 5) {
          const angle = rotation + (arm / arms) * Math.PI * 2 + (r / maxRadius) * Math.PI * 4;
          
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          
          if (r === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }
    }
  };
  
  const drawSunburst = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    averageFrequency: number,
    instrumentPrediction: string | null
  ) => {
    // Create a persistent SunburstVisualization instance or reuse existing one
    if (!sunburstRef.current) {
      sunburstRef.current = new SunburstVisualization(canvas);
    }
    
    // Create a properly formed analysis data object
    const sunburstAnalysisData: AudioAnalysisData = {
      frequencyData,
      waveformData: new Uint8Array(frequencyData.length), // Placeholder with correct size
      timeDomainData,
      averageFrequency,
      peaks: analysisData?.peaks || [], // Use actual peaks if available
      bpm: analysisData?.bpm || null,
      instrumentPrediction
    };
    
    // Use the persistent sunburst visualization to draw
    sunburstRef.current.draw(sunburstAnalysisData);
  };

  const drawRectangular = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    averageFrequency: number,
    instrumentPrediction: string | null
  ) => {
    // Create a persistent RectangularVisualization instance or reuse existing one
    if (!rectangularRef.current) {
      rectangularRef.current = new RectangularVisualization(canvas);
      
      // Set media URLs if available
      if (mediaUrls.length > 0) {
        rectangularRef.current.setMediaItems(mediaUrls);
      }
    }
    
    // Apply visualization settings if available
    if (visualizationSettings) {
      // Apply general settings
      rectangularRef.current.setReactivityLevel(visualizationSettings.reactivity);
      
      // Apply Rectangular specific settings
      if (visualizationSettings.colorCycling !== undefined) {
        rectangularRef.current.setColorCycling(visualizationSettings.colorCycling);
      }
      
      if (visualizationSettings.colorCyclingSpeed !== undefined) {
        rectangularRef.current.setColorCyclingSpeed(visualizationSettings.colorCyclingSpeed);
      }
      
      if (visualizationSettings.rayCount !== undefined) {
        rectangularRef.current.setRayCount(visualizationSettings.rayCount);
      }
    }
    
    // Create a properly formed analysis data object
    const rectangularAnalysisData: AudioAnalysisData = {
      frequencyData,
      waveformData: new Uint8Array(frequencyData.length), // Placeholder with correct size
      timeDomainData,
      averageFrequency,
      peaks: analysisData?.peaks || [], // Use actual peaks if available
      bpm: analysisData?.bpm || null,
      instrumentPrediction
    };
    
    // Use the persistent rectangular visualization to draw
    rectangularRef.current.draw(rectangularAnalysisData);
  };
  
  const drawHoliday = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    averageFrequency: number,
    instrumentPrediction: string | null
  ) => {
    // Create a persistent HolidayVisualization instance or reuse existing one
    if (!holidayRef.current) {
      holidayRef.current = new HolidayVisualization(canvas);
    }
    
    // Create a properly formed analysis data object
    const holidayAnalysisData: AudioAnalysisData = {
      frequencyData,
      waveformData: new Uint8Array(frequencyData.length), // Placeholder with correct size
      timeDomainData,
      averageFrequency,
      peaks: analysisData?.peaks || [], // Use actual peaks if available
      bpm: analysisData?.bpm || null,
      instrumentPrediction
    };
    
    // Use the persistent holiday visualization to draw
    holidayRef.current.draw(holidayAnalysisData);
  };
  
  const drawHoliday3D = (
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    averageFrequency: number,
    instrumentPrediction: string | null
  ) => {
    // Create a persistent Holiday3DVisualization instance or reuse existing one
    try {
      if (!holiday3DRef.current) {
        // Make sure canvas is properly sized
        if (canvas.width === 0) canvas.width = canvas.clientWidth || window.innerWidth;
        if (canvas.height === 0) canvas.height = canvas.clientHeight || window.innerHeight;
        
        holiday3DRef.current = new Holiday3DVisualization(canvas);
      }
    } catch (error) {
      console.error('Error initializing Holiday3D visualization:', error);
      return; // Exit the function if initialization fails
    }
    
    // Create a properly formed analysis data object
    const holiday3DAnalysisData: AudioAnalysisData = {
      frequencyData,
      waveformData: new Uint8Array(frequencyData.length), // Placeholder with correct size
      timeDomainData,
      averageFrequency,
      peaks: analysisData?.peaks || [], // Use actual peaks if available
      bpm: analysisData?.bpm || null,
      instrumentPrediction
    };
    
    // Apply camera controls if they exist
    if (holiday3DRef.current) {
      const controlsToUse = cameraControls || localCameraControls;
      // Set camera position and target
      holiday3DRef.current.setCameraPosition(controlsToUse.position);
      holiday3DRef.current.setCameraTarget(controlsToUse.target);
      
      // Set control enablement
      holiday3DRef.current.setOrbitEnabled(controlsToUse.enableOrbit);
      holiday3DRef.current.setPanEnabled(controlsToUse.enablePan);
      holiday3DRef.current.setZoomEnabled(controlsToUse.enableZoom);
    }
    
    // Apply visualization settings if available
    if (visualizationSettings) {
      // Apply general settings
      holiday3DRef.current.setBrightness(visualizationSettings.brightness);
      holiday3DRef.current.setReactivity(visualizationSettings.reactivity);
      
      // Apply Holiday3D specific settings
      if (visualizationSettings.snowIntensity !== undefined) {
        holiday3DRef.current.setSnowIntensity(visualizationSettings.snowIntensity);
      }
      
      if (visualizationSettings.auroraIntensity !== undefined) {
        holiday3DRef.current.setAuroraIntensity(visualizationSettings.auroraIntensity);
      }
      
      if (visualizationSettings.treeLights !== undefined) {
        holiday3DRef.current.setTreeLightsVisibility(visualizationSettings.treeLights);
      }
      
      if (visualizationSettings.crystalVisibility !== undefined) {
        holiday3DRef.current.setCrystalVisibility(visualizationSettings.crystalVisibility);
      }
      
      if (visualizationSettings.colorTheme) {
        holiday3DRef.current.setColorTheme(visualizationSettings.colorTheme);
      }
    }
    
    // Use the persistent 3D holiday visualization to draw
    holiday3DRef.current.draw(holiday3DAnalysisData);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 2D Canvas - visible only when not using 3D visualization */}
      <canvas
        ref={canvas2DRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          display: visualizationType === VisualizationType.HOLIDAY_3D ? 'none' : 'block'
        }}
      />
      {/* 3D Canvas - visible only when using 3D visualization */}
      <canvas
        ref={canvas3DRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          display: visualizationType === VisualizationType.HOLIDAY_3D ? 'block' : 'none'
        }}
      />
    </div>
  );
};

export default Visualizer;