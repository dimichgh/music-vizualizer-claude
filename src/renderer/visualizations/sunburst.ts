import BaseVisualization from './base';
import { AudioAnalysisData } from '../../shared/types';
import { DEFAULT_COLOR_SCHEMES } from '../../shared/constants';

interface SunRay {
  angle: number;
  length: number;
  width: number;
  color: string;
  frequency: number;
}

class SunburstVisualization extends BaseVisualization {
  private rays: SunRay[] = [];
  private centerRadius: number = 150; // Increased center size
  private centerPulse: number = 0;
  private time: number = 0;
  private rayDensity: number = 0.8;
  private dominantInstrument: string | null = null;
  private colorTransitionSpeed: number = 0.01;
  private currentHue: number = 0;
  
  // Color mapping for different instruments
  private instrumentColors: Record<string, number> = {
    'piano': 210,     // Blue
    'guitar': 120,    // Green
    'bass': 330,      // Magenta
    'drums': 30,      // Orange
    'violin': 60,     // Yellow-green
    'cello': 270,     // Purple
    'flute': 180,     // Cyan
    'saxophone': 0,   // Red
    'trumpet': 40,    // Orange-yellow
    'synthesizer': 300, // Pink
    'voice': 150      // Blue-green
  };
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.colorScheme = DEFAULT_COLOR_SCHEMES.COSMIC;
    this.initRays();
  }
  
  public setRayDensity(density: number): void {
    this.rayDensity = Math.max(0.1, Math.min(1.0, density));
    this.initRays();
  }
  
  private initRays(): void {
    // More rays for better resolution
    const rayCount = Math.floor(120 * this.rayDensity);
    this.rays = [];
    
    for (let i = 0; i < rayCount; i++) {
      this.rays.push(this.createRay(i, rayCount));
    }
  }
  
  private createRay(index: number, total: number): SunRay {
    const angle = (index / total) * Math.PI * 2;
    
    // Each ray corresponds to a specific frequency band
    // Map ray index to frequency index to create a spectrum-like effect
    const frequency = Math.floor((index / total) * 128);
    
    return {
      angle,
      length: 50, // Shorter rays to start with
      width: 8,
      color: this.colorScheme[Math.floor(index / total * this.colorScheme.length)],
      frequency: frequency, // Assign frequencies sequentially around the circle
    };
  }
  
  public draw(analysisData: AudioAnalysisData): void {
    this.time += 0.01;
    
    // Clear with gradient background
    this.drawBackground();
    
    // Get intensity from average frequency
    const intensity = analysisData.averageFrequency / 255;
    
    // Update dominant instrument if available
    if (analysisData.instrumentPrediction) {
      this.dominantInstrument = analysisData.instrumentPrediction;
      
      // Get target hue for instrument
      const targetHue = this.instrumentColors[this.dominantInstrument] || 0;
      
      // Smoothly transition current hue toward target
      const diff = targetHue - this.currentHue;
      if (Math.abs(diff) > 180) {
        // Take the shortest path around the color wheel
        if (this.currentHue < targetHue) {
          this.currentHue += 360;
        } else {
          this.currentHue -= 360;
        }
      }
      
      // Ease toward target hue
      this.currentHue += (targetHue - this.currentHue) * this.colorTransitionSpeed * (1 + intensity);
      
      // Keep within 0-360 range
      this.currentHue = ((this.currentHue % 360) + 360) % 360;
    }
    
    // Update center pulse based on bass frequencies (lower end of spectrum)
    const bassEnergy = this.getBassEnergy(analysisData.frequencyData);
    this.centerPulse = this.centerPulse * 0.7 + bassEnergy * 0.3;
    
    // Draw center sun
    this.drawSunCenter(intensity);
    
    // Update and draw rays
    this.updateRays(analysisData, intensity);
    this.drawRays();
    
    // Draw beat pulses
    if (analysisData.peaks.length > 0) {
      this.drawBeatPulse(intensity);
    }
  }
  
  private drawBackground(): void {
    // Fade previous frame slightly to create trails
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw dark radial gradient for background
    const gradient = this.ctx.createRadialGradient(
      this.width / 2, 
      this.height / 2, 
      0,
      this.width / 2, 
      this.height / 2, 
      Math.max(this.width, this.height) / 2
    );
    
    gradient.addColorStop(0, 'rgba(5, 5, 15, 0.2)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 10, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 5, 0.5)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw subtle grid lines for depth
    const gridSize = 30;
    const gridOpacity = 0.05;
    
    this.ctx.strokeStyle = `rgba(100, 100, 255, ${gridOpacity})`;
    this.ctx.lineWidth = 0.5;
    
    // Draw circular grid lines
    for (let r = this.centerRadius * 2; r < Math.max(this.width, this.height); r += gridSize) {
      this.ctx.beginPath();
      this.ctx.arc(this.width / 2, this.height / 2, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
  
  private getBassEnergy(frequencyData: Uint8Array): number {
    // Calculate energy in bass frequency range (first ~10% of frequencies)
    const bassRange = Math.floor(frequencyData.length * 0.1);
    let energy = 0;
    let weight = 0;
    
    for (let i = 0; i < bassRange; i++) {
      // Weight lower frequencies more heavily (sub-bass)
      const frequencyWeight = 1 - (i / bassRange) * 0.7; // 1.0 to 0.3 weight range
      energy += (frequencyData[i] / 255) * frequencyWeight;
      weight += frequencyWeight;
    }
    
    // Amplify the effect by applying a power curve
    const normalizedEnergy = energy / weight;
    return Math.pow(normalizedEnergy, 1.5); // Emphasize stronger bass hits
  }
  
  private drawSunCenter(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Calculate pulsing radius based on bass energy
    const radius = this.centerRadius * (1 + this.centerPulse * 0.5);
    
    // Create gradient for the sun center
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    // Map bass energy to hue - deep reds and oranges
    const bassHue = 30 - this.centerPulse * 30; // 0-30 range: red to orange
    
    // Use bass energy to determine the sun center color
    const baseColor = `hsl(${bassHue}, 100%, ${50 + this.centerPulse * 20}%)`;
    const outerColor = `hsl(${bassHue}, 90%, ${30 + this.centerPulse * 10}%)`;
    
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.7, outerColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add inner glow that pulses with bass
    const innerRadius = radius * 0.8;
    const innerGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, innerRadius
    );
    
    const glowColor = `hsla(${bassHue + 20}, 100%, 80%, ${0.6 + this.centerPulse * 0.4})`;
    
    innerGradient.addColorStop(0, glowColor);
    innerGradient.addColorStop(0.6, `hsla(${bassHue + 40}, 100%, 70%, ${0.3 + this.centerPulse * 0.2})`);
    innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.fillStyle = innerGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add pulsing corona that responds to bass
    const coronaSize = radius * (1.1 + this.centerPulse * 0.3);
    const coronaGradient = this.ctx.createRadialGradient(
      centerX, centerY, radius * 0.9,
      centerX, centerY, coronaSize
    );
    
    const coronaColor = `hsla(${bassHue + 10}, 100%, 60%, ${0.2 + this.centerPulse * 0.3})`;
    
    coronaGradient.addColorStop(0, coronaColor);
    coronaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = coronaGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, coronaSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add texture by drawing small arcs at varying distances from center
    const textureCount = 5;
    const textureWidth = 2;
    
    this.ctx.lineWidth = textureWidth;
    
    for (let i = 0; i < textureCount; i++) {
      const texRadius = radius * (0.3 + (i / textureCount) * 0.6);
      const texOpacity = 0.1 + this.centerPulse * 0.2;
      
      this.ctx.strokeStyle = `hsla(${bassHue + i * 10}, 100%, 70%, ${texOpacity})`;
      this.ctx.beginPath();
      
      // Draw incomplete circle with random start and end
      const startAngle = i * Math.PI / textureCount;
      const endAngle = startAngle + Math.PI * (1 + this.centerPulse * 0.5);
      
      this.ctx.arc(centerX, centerY, texRadius, startAngle, endAngle);
      this.ctx.stroke();
    }
  }
  
  private updateRays(analysisData: AudioAnalysisData, globalIntensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRayLength = Math.min(this.width, this.height) * 0.25; // Shorter maximum ray length
    
    for (let ray of this.rays) {
      // Get frequency data for this ray
      const freqIntensity = analysisData.frequencyData[ray.frequency] / 255;
      
      // Update ray length based directly on its frequency amplitude - more like a spectrum analyzer
      ray.length = maxRayLength * freqIntensity;
      
      // Ensure minimum length for visibility
      ray.length = Math.max(10, ray.length);
      
      // Update ray width - thinner for higher frequencies
      ray.width = 8 - (ray.frequency / 128) * 4 + freqIntensity * 6;
      
      // Update ray color based on frequency and intensity
      // Low frequencies are red, high frequencies are violet
      const rayHue = (ray.frequency / 128) * 270; // 0-270 degree hue range (red to violet)
      
      // Higher frequencies get higher saturation
      const saturation = 80 + (ray.frequency / 128) * 20;
      
      // Louder frequencies get higher lightness
      const lightness = 40 + freqIntensity * 40;
      
      ray.color = `hsl(${rayHue}, ${saturation}%, ${lightness}%)`;
    }
  }
  
  private drawRays(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // First draw all ray backgrounds (larger, more transparent)
    for (let ray of this.rays) {
      // Don't rotate rays with time - use fixed angles
      const startX = centerX + Math.cos(ray.angle) * this.centerRadius * 0.9;
      const startY = centerY + Math.sin(ray.angle) * this.centerRadius * 0.9;
      
      const endX = centerX + Math.cos(ray.angle) * (ray.length + this.centerRadius);
      const endY = centerY + Math.sin(ray.angle) * (ray.length + this.centerRadius);
      
      // Create gradient for the ray
      const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
      
      // Get the hue value from the ray color
      const hueStr = ray.color.split('(')[1].split(',')[0];
      const hue = parseInt(hueStr, 10);
      
      gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.7)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = ray.width * 1.5;
      this.ctx.lineCap = 'round';
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    // Then draw the brighter core of each ray
    for (let ray of this.rays) {
      const startX = centerX + Math.cos(ray.angle) * this.centerRadius;
      const startY = centerY + Math.sin(ray.angle) * this.centerRadius;
      
      const endX = centerX + Math.cos(ray.angle) * (ray.length * 0.7 + this.centerRadius);
      const endY = centerY + Math.sin(ray.angle) * (ray.length * 0.7 + this.centerRadius);
      
      this.ctx.strokeStyle = ray.color;
      this.ctx.lineWidth = ray.width * 0.5;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
  }
  
  private drawBeatPulse(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Create multiple concentric rings for beat pulses
    const ringCount = 3;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    
    for (let i = 0; i < ringCount; i++) {
      // Each ring has different size and color
      const radiusOffset = i * 0.3;
      const ringRadius = this.centerRadius * (1.5 + radiusOffset + intensity);
      
      // Limit to max radius
      if (ringRadius > maxRadius) continue;
      
      // Different hue for each ring
      const hue = (i * 30) % 360;
      
      // Fade opacity based on ring index
      const opacity = (1 - i / ringCount) * intensity * 0.5;
      
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${opacity})`;
      this.ctx.lineWidth = (10 - i * 2) * intensity;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Add flash effect on beat
    const flashOpacity = intensity * 0.15;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}

export default SunburstVisualization;