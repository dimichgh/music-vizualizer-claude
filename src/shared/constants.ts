// Audio Analysis Constants
export const FFT_SIZE = 2048;
export const SMOOTHING_TIME_CONSTANT = 0.8;

// Visualization Constants
export const DEFAULT_COLOR_SCHEMES = {
  COSMIC: ['#1a237e', '#283593', '#303f9f', '#3949ab', '#3f51b5', '#5c6bc0', '#7986cb', '#9fa8da'],
  PSYCHEDELIC: ['#6200ea', '#7c4dff', '#651fff', '#d500f9', '#aa00ff', '#c51162', '#f50057', '#ff1744'],
  ETHEREAL: ['#004d40', '#00695c', '#00796b', '#00897b', '#009688', '#26a69a', '#4db6ac', '#80cbc4'],
  FIRE: ['#bf360c', '#d84315', '#e64a19', '#f4511e', '#ff5722', '#ff7043', '#ff8a65', '#ffab91'],
  ICE: ['#01579b', '#0277bd', '#0288d1', '#039be5', '#03a9f4', '#29b6f6', '#4fc3f7', '#81d4fa'],
};

// Instrument Detection Constants
export const INSTRUMENTS = [
  'piano',
  'guitar',
  'bass',
  'drums',
  'violin',
  'cello',
  'flute',
  'saxophone',
  'trumpet',
  'synthesizer',
  'voice',
];

// UI Constants
export const VISUALIZATION_PRESETS = {
  COSMIC_JOURNEY: {
    type: 'cosmic',
    colorScheme: 'COSMIC',
    sensitivity: 0.7,
    showInstruments: true,
    customParams: {
      starDensity: 0.8,
      speed: 0.5,
      depth: 0.6,
    },
  },
  PSYCHEDELIC_TRIP: {
    type: 'psychedelic',
    colorScheme: 'PSYCHEDELIC',
    sensitivity: 0.8,
    showInstruments: true,
    customParams: {
      waveDensity: 0.7,
      complexity: 0.9,
      warping: 0.8,
    },
  },
  ETHEREAL_DREAM: {
    type: 'particles',
    colorScheme: 'ETHEREAL',
    sensitivity: 0.6,
    showInstruments: true,
    customParams: {
      particleDensity: 0.6,
      particleSize: 0.4,
      smoothing: 0.8,
    },
  },
};