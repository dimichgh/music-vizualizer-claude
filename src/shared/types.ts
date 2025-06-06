// Electron API types
export interface ElectronAPI {
  audioFileApi: {
    openWavFile: () => Promise<OpenWavFileResult>;
  };
}

export interface OpenWavFileResult {
  canceled: boolean;
  filePath?: string;
  fileName?: string;
  buffer?: ArrayBuffer;
  error?: string;
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

// Declare global types for TypeScript
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}