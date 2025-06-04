import BaseVisualization from './base';
import { AudioAnalysisData } from '../../shared/types';
import { DEFAULT_COLOR_SCHEMES } from '../../shared/constants';

interface Wave {
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
  color: string;
}

class PsychedelicVisualization extends BaseVisualization {
  private time: number = 0;
  private waves: Wave[] = [];
  private complexity: number = 0.8;
  private waveDensity: number = 0.7;
  private warping: number = 0.8;
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.colorScheme = DEFAULT_COLOR_SCHEMES.PSYCHEDELIC;
    this.initWaves();
  }
  
  public setComplexity(complexity: number): void {
    this.complexity = Math.max(0.1, Math.min(1.0, complexity));
  }
  
  public setWaveDensity(density: number): void {
    this.waveDensity = Math.max(0.1, Math.min(1.0, density));
    this.initWaves();
  }
  
  public setWarping(warping: number): void {
    this.warping = Math.max(0.1, Math.min(1.0, warping));
  }
  
  private initWaves(): void {
    const waveCount = Math.floor(10 * this.waveDensity);
    this.waves = [];
    
    for (let i = 0; i < waveCount; i++) {
      this.waves.push(this.createRandomWave());
    }
  }
  
  private createRandomWave(): Wave {
    return {
      amplitude: Math.random() * 50 + 20,
      frequency: Math.random() * 0.01 + 0.005,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.01,
      color: this.colorScheme[Math.floor(Math.random() * this.colorScheme.length)],
    };
  }
  
  public draw(analysisData: AudioAnalysisData): void {
    this.time += 0.02;
    
    // Clear with semi-transparent black for trails
    this.fade(0.1);
    
    // Get average frequency for intensity
    const intensity = analysisData.averageFrequency / 255;
    
    // Update waves based on audio intensity
    this.updateWaves(intensity);
    
    // Draw psychedelic patterns
    this.drawMandala(intensity);
    this.drawWaves(intensity);
    this.drawSpirals(intensity);
    
    // Draw beat pulses
    if (analysisData.peaks.length > 0) {
      this.drawBeatPulse(intensity);
    }
  }
  
  private updateWaves(intensity: number): void {
    for (let wave of this.waves) {
      wave.phase += wave.speed * (1 + intensity);
      wave.amplitude = wave.amplitude * 0.99 + (Math.random() * 50 + 20) * 0.01 * intensity;
    }
  }
  
  private drawMandala(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    
    const segments = 5 + Math.floor(this.complexity * 10);
    const rings = 3 + Math.floor(this.complexity * 5);
    
    for (let ring = 1; ring <= rings; ring++) {
      const radius = (ring / rings) * maxRadius;
      const segmentAngle = (Math.PI * 2) / segments;
      
      this.ctx.lineWidth = 2 + intensity * 3;
      
      for (let i = 0; i < segments; i++) {
        const startAngle = i * segmentAngle + this.time;
        const endAngle = startAngle + segmentAngle;
        
        // Distort the radius based on time and audio intensity
        const distortedRadius = radius * (1 + 
          Math.sin(this.time * 2 + i) * 0.1 * this.warping * intensity);
        
        // Use color from scheme with hue rotation based on time
        const colorIndex = (i + Math.floor(this.time)) % this.colorScheme.length;
        this.ctx.strokeStyle = this.colorScheme[colorIndex];
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, distortedRadius, startAngle, endAngle);
        this.ctx.stroke();
        
        // Connect to center for more complexity
        if (ring % 2 === 0 && this.complexity > 0.5) {
          const midAngle = (startAngle + endAngle) / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, centerY);
          this.ctx.lineTo(
            centerX + Math.cos(midAngle) * distortedRadius,
            centerY + Math.sin(midAngle) * distortedRadius
          );
          this.ctx.stroke();
        }
      }
    }
  }
  
  private drawWaves(intensity: number): void {
    const height = this.height;
    
    for (let wave of this.waves) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = wave.color;
      this.ctx.lineWidth = 2 + intensity * 4;
      
      for (let x = 0; x < this.width; x += 5) {
        const normalizedX = x / this.width;
        
        // Create complex wave pattern using multiple sine functions
        const y = height / 2 + 
          wave.amplitude * Math.sin(normalizedX * 10 * wave.frequency + wave.phase) +
          wave.amplitude / 2 * Math.sin(normalizedX * 20 * wave.frequency + wave.phase * 2) * 
            Math.sin(this.time + normalizedX * 5);
        
        if (x === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
    }
  }
  
  private drawSpirals(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.3;
    
    const arms = 3 + Math.floor(this.complexity * 5);
    const rotationSpeed = 0.001 + intensity * 0.005;
    
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = (arm / arms) * Math.PI * 2;
      const color = this.colorScheme[arm % this.colorScheme.length];
      
      this.ctx.beginPath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2 + intensity * 3;
      
      for (let r = 0; r < maxRadius; r += 5) {
        const normalizedRadius = r / maxRadius;
        
        // Create spiral effect with time-based rotation
        const angle = baseAngle + 
          normalizedRadius * Math.PI * 4 + 
          this.time * rotationSpeed * (arm + 1);
        
        // Apply warping effect
        const warpedRadius = r * (1 + 
          Math.sin(normalizedRadius * Math.PI * 2 + this.time) * 
          0.2 * this.warping * intensity);
        
        const x = centerX + Math.cos(angle) * warpedRadius;
        const y = centerY + Math.sin(angle) * warpedRadius;
        
        if (r === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
    }
  }
  
  private drawBeatPulse(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Cycle through colors based on time
    const colorIndex = Math.floor(this.time * 2) % this.colorScheme.length;
    const pulseColor = this.colorScheme[colorIndex];
    
    // Create pulsing circles
    for (let i = 0; i < 3; i++) {
      const radius = (i + 1) * 50 * intensity;
      
      this.ctx.strokeStyle = pulseColor;
      this.ctx.lineWidth = 5 * intensity;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
}

export default PsychedelicVisualization;