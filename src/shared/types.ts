// Electron API types
export interface ElectronAPI {
  audioFileApi: {
    openWavFile: () => Promise<OpenWavFileResult>;
  };
  mediaApi: {
    openMediaFiles: () => Promise<OpenMediaFilesResult>;
  };
}

export interface OpenWavFileResult {
  canceled: boolean;
  filePath?: string;
  fileName?: string;
  buffer?: ArrayBuffer;
  error?: string;
}

export interface OpenMediaFilesResult {
  canceled: boolean;
  mediaFiles?: MediaFile[];
  error?: string;
}

export interface MediaFile {
  filePath: string;
  fileName: string;
  url: string;
}

// Audio types
export interface AudioData {
  buffer: AudioBuffer;
  filePath: string;
  fileName: string;
}

export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  timeDomainData: Uint8Array;
  averageFrequency: number;
  peaks: number[];
  bpm: number | null;
  instrumentPrediction: string | null;
}

// Visualization types
export enum VisualizationType {
  SPECTRUM = 'spectrum',
  WAVEFORM = 'waveform',
  PARTICLES = 'particles',
  COSMIC = 'cosmic',
  PSYCHEDELIC = 'psychedelic',
  SUNBURST = 'sunburst',
  RECTANGULAR = 'rectangular',
  HOLIDAY = 'holiday',
  HOLIDAY_3D = 'holiday_3d',
}

export interface VisualizationConfig {
  type: VisualizationType;
  colorScheme: string;
  sensitivity: number;
  showInstruments: boolean;
  customParams: Record<string, any>;
}

// Instrument detection types
export interface InstrumentDetection {
  instrument: string;
  confidence: number;
  timestamp: number;
}

// 3D visualization types
export interface CameraControls {
  position: {
    x: number;
    y: number;
    z: number;
  };
  target: {
    x: number;
    y: number;
    z: number;
  };
  zoom: number;
  enableOrbit: boolean;
  enablePan: boolean;
  enableZoom: boolean;
}

export interface ThreeDElementProps {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
  color: string;
  intensity: number;
  reactsTo: {
    frequencyRange: [number, number];
    instrument?: string;
  };
}

// Visualization settings for customization
export interface VisualizationSettings {
  // General settings
  brightness: number;       // 0.0 to 2.0, affects overall brightness
  reactivity: number;       // 0.0 to 2.0, affects how strongly elements react to audio
  
  // Holiday3D specific settings
  snowIntensity?: number;   // 0.0 to 2.0, controls amount of snow
  auroraIntensity?: number; // 0.0 to 2.0, controls aurora brightness
  treeLights?: boolean;     // Toggle tree lights
  crystalVisibility?: boolean; // Toggle ice crystals
  colorTheme?: 'warm' | 'cool' | 'rainbow' | 'classic'; // Color theme
  
  // Rectangular visualization settings
  colorCycling?: boolean;     // Enable color cycling effect
  colorCyclingSpeed?: number; // Speed of color cycling (0.05 to 2.0)
  rayCount?: number;          // Number of rays to display (50 to 500)
  
  // Cosmic visualization settings
  starDensity?: number;       // 0.1 to 1.0, controls density of stars
  starSpeed?: number;         // 0.1 to 2.0, controls speed of star movement
  starDepth?: number;         // 0.1 to 1.0, controls depth effect of stars
  
  // Psychedelic visualization settings
  complexity?: number;        // 0.1 to 1.0, controls complexity of patterns
  waveDensity?: number;       // 0.1 to 1.0, controls density of waves
  warping?: number;           // 0.1 to 1.0, controls warping effect
}

// Declare global types for TypeScript
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
