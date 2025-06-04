import { AudioData } from '../../shared/types';

class AudioPlayer {
  private audioContext: AudioContext;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPlaying: boolean = false;
  
  constructor() {
    this.audioContext = new AudioContext();
    this.setupAudioGraph();
  }
  
  private setupAudioGraph(): void {
    // Create gain node
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;
    this.gainNode.connect(this.audioContext.destination);
    
    // Create analyser node
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.connect(this.gainNode);
  }
  
  public loadAudio(audioData: AudioData): void {
    this.currentBuffer = audioData.buffer;
  }
  
  public play(): void {
    if (!this.currentBuffer || !this.analyserNode) return;
    
    // If already playing, stop first
    if (this.isPlaying) {
      this.stop();
    }
    
    // Create new source node
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;
    this.sourceNode.connect(this.analyserNode);
    
    // Start playback
    if (this.pauseTime > 0) {
      // Resume from pause position
      this.sourceNode.start(0, this.pauseTime);
      this.startTime = this.audioContext.currentTime - this.pauseTime;
    } else {
      // Start from beginning
      this.sourceNode.start(0);
      this.startTime = this.audioContext.currentTime;
    }
    
    this.isPlaying = true;
    
    // Handle playback end
    this.sourceNode.onended = () => {
      this.isPlaying = false;
      this.pauseTime = 0;
    };
  }
  
  public pause(): void {
    if (!this.isPlaying || !this.sourceNode) return;
    
    // Calculate current position
    this.pauseTime = this.getCurrentTime();
    
    // Stop playback
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;
  }
  
  public stop(): void {
    if (!this.sourceNode) return;
    
    // Stop playback and reset position
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;
    this.pauseTime = 0;
  }
  
  public getCurrentTime(): number {
    if (!this.isPlaying) {
      return this.pauseTime;
    }
    
    return this.audioContext.currentTime - this.startTime;
  }
  
  public getDuration(): number {
    return this.currentBuffer ? this.currentBuffer.duration : 0;
  }
  
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  public setVolume(volume: number): void {
    if (this.gainNode) {
      // Clamp volume between 0 and 1
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.value = clampedVolume;
    }
  }
  
  public seekTo(time: number): void {
    if (!this.currentBuffer) return;
    
    // Clamp time between 0 and duration
    const clampedTime = Math.max(0, Math.min(this.currentBuffer.duration, time));
    
    const wasPlaying = this.isPlaying;
    
    // Stop current playback
    if (this.isPlaying) {
      this.stop();
    }
    
    // Set new position
    this.pauseTime = clampedTime;
    
    // Resume playback if it was playing
    if (wasPlaying) {
      this.play();
    }
  }
  
  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }
  
  public close(): void {
    this.stop();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

export default AudioPlayer;