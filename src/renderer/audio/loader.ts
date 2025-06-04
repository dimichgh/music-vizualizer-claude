import { AudioData } from '../../shared/types';

class AudioLoader {
  private audioContext: AudioContext;
  
  constructor() {
    this.audioContext = new AudioContext();
  }
  
  /**
   * Loads a WAV file from the file system using Electron's IPC
   */
  public async loadWavFile(): Promise<AudioData | null> {
    try {
      const result = await window.electron.audioFileApi.openWavFile();
      
      if (result.canceled || !result.buffer || !result.filePath) {
        return null;
      }
      
      const audioBuffer = await this.audioContext.decodeAudioData(result.buffer);
      
      return {
        buffer: audioBuffer,
        filePath: result.filePath,
        fileName: result.fileName || 'Unknown',
      };
    } catch (error) {
      console.error('Error loading WAV file:', error);
      return null;
    }
  }
  
  /**
   * Extracts metadata from the audio buffer
   */
  public extractMetadata(audioBuffer: AudioBuffer): Record<string, any> {
    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length,
    };
  }
  
  /**
   * Closes the audio context
   */
  public close(): void {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

export default AudioLoader;