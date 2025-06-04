import { FFT_SIZE, SMOOTHING_TIME_CONSTANT } from '../../shared/constants';
import { AudioAnalysisData } from '../../shared/types';

class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Uint8Array | null = null;
  
  constructor() {
    this.initAudioContext();
  }
  
  private initAudioContext() {
    try {
      this.audioContext = new AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = FFT_SIZE;
      this.analyserNode.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
      this.analyserNode.connect(this.audioContext.destination);
      
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }
  
  public loadAudioBuffer(buffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }
    
    return this.audioContext.decodeAudioData(buffer);
  }
  
  public play(audioBuffer: AudioBuffer): void {
    if (!this.audioContext || !this.analyserNode) {
      throw new Error('Audio context not initialized');
    }
    
    // Stop any currently playing audio
    this.stop();
    
    // Create and start a new source node
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = audioBuffer;
    this.sourceNode.connect(this.analyserNode);
    this.sourceNode.start(0);
  }
  
  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Ignore errors if the source is already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }
  
  public getAnalysisData(): AudioAnalysisData | null {
    if (!this.analyserNode || !this.frequencyData || !this.timeDomainData) {
      return null;
    }
    
    this.analyserNode.getByteFrequencyData(this.frequencyData);
    this.analyserNode.getByteTimeDomainData(this.timeDomainData);
    
    // Calculate average frequency
    let sum = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i];
    }
    const averageFrequency = sum / this.frequencyData.length;
    
    // Detect peaks (for beat detection)
    const peaks: number[] = [];
    for (let i = 1; i < this.frequencyData.length - 1; i++) {
      if (this.frequencyData[i] > this.frequencyData[i - 1] && 
          this.frequencyData[i] > this.frequencyData[i + 1] &&
          this.frequencyData[i] > 200) {
        peaks.push(i);
      }
    }
    
    // TODO: Implement proper BPM detection
    const bpm = null;
    
    // TODO: Implement instrument detection
    const instrumentPrediction = null;
    
    return {
      frequencyData: new Uint8Array(this.frequencyData),
      waveformData: new Uint8Array(this.frequencyData), // Placeholder for waveform data
      timeDomainData: new Uint8Array(this.timeDomainData),
      averageFrequency,
      peaks,
      bpm,
      instrumentPrediction,
    };
  }
  
  public detectBPM(buffer: AudioBuffer): number | null {
    // Basic BPM detection - placeholder for more sophisticated algorithm
    // This is a simplified version and won't be accurate for many songs
    
    // TODO: Implement proper BPM detection algorithm
    return null;
  }
  
  public close(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyserNode = null;
    }
  }
}

export default AudioAnalyzer;