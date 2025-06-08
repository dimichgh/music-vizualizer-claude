import Base2DVisualization from './base2d';
import { AudioAnalysisData } from '../../shared/types';
import { DEFAULT_COLOR_SCHEMES } from '../../shared/constants';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  speed: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color1: string;
  color2: string;
  opacity: number;
  pulseSpeed: number;
  pulseAmount: number;
  phase: number;
}

class CosmicVisualization extends Base2DVisualization {
  private stars: Star[] = [];
  private nebulae: Nebula[] = [];
  private time: number = 0;
  private starDensity: number = 0.8;
  private starSpeed: number = 0.5;
  private starDepth: number = 0.6;
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.colorScheme = DEFAULT_COLOR_SCHEMES.COSMIC;
    this.initStars();
    this.initNebulae();
  }
  
  public setStarDensity(density: number): void {
    this.starDensity = Math.max(0.1, Math.min(1.0, density));
    this.initStars();
  }
  
  public setStarSpeed(speed: number): void {
    this.starSpeed = Math.max(0.1, Math.min(2.0, speed));
  }
  
  public setStarDepth(depth: number): void {
    this.starDepth = Math.max(0.1, Math.min(1.0, depth));
  }
  
  private initStars(): void {
    const starCount = Math.floor(200 * this.starDensity);
    this.stars = [];
    
    for (let i = 0; i < starCount; i++) {
      this.stars.push(this.createRandomStar());
    }
  }
  
  private createRandomStar(): Star {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      z: Math.random() * this.starDepth + 0.1,
      size: Math.random() * 2 + 1,
      color: this.colorScheme[Math.floor(Math.random() * this.colorScheme.length)],
      speed: Math.random() * 0.5 + 0.5,
    };
  }
  
  private initNebulae(): void {
    const nebulaCount = 3;
    this.nebulae = [];
    
    for (let i = 0; i < nebulaCount; i++) {
      this.nebulae.push(this.createRandomNebula());
    }
  }
  
  private createRandomNebula(): Nebula {
    const colorIndex1 = Math.floor(Math.random() * this.colorScheme.length);
    const colorIndex2 = (colorIndex1 + 1) % this.colorScheme.length;
    
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: Math.random() * 200 + 100,
      color1: this.colorScheme[colorIndex1],
      color2: this.colorScheme[colorIndex2],
      opacity: Math.random() * 0.3 + 0.1,
      pulseSpeed: Math.random() * 0.01 + 0.005,
      pulseAmount: Math.random() * 0.3 + 0.1,
      phase: Math.random() * Math.PI * 2,
    };
  }
  
  public draw(analysisData: AudioAnalysisData): void {
    this.time += 0.01;
    
    // Clear with semi-transparent black for trails
    this.fade(0.05);
    
    // Get average frequency for intensity
    const intensity = analysisData.averageFrequency / 255;
    
    // Update and draw nebulae
    this.updateNebulae(intensity);
    this.drawNebulae();
    
    // Update and draw stars
    this.updateStars(intensity);
    this.drawStars(intensity);
    
    // Draw beat pulses
    if (analysisData.peaks.length > 0) {
      this.drawBeatPulse(intensity);
    }
  }
  
  private updateNebulae(intensity: number): void {
    for (let nebula of this.nebulae) {
      nebula.phase += nebula.pulseSpeed;
      nebula.radius = nebula.radius * (1 + Math.sin(nebula.phase) * nebula.pulseAmount * intensity);
    }
  }
  
  private drawNebulae(): void {
    for (let nebula of this.nebulae) {
      const gradient = this.ctx.createRadialGradient(
        nebula.x, nebula.y, 0, 
        nebula.x, nebula.y, nebula.radius
      );
      
      gradient.addColorStop(0, this.hexToRgba(nebula.color1, nebula.opacity));
      gradient.addColorStop(1, this.hexToRgba(nebula.color2, 0));
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  private updateStars(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    for (let star of this.stars) {
      // Move stars from center outward
      const dx = star.x - centerX;
      const dy = star.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > Math.max(this.width, this.height)) {
        // Reset star when it goes off screen
        Object.assign(star, this.createRandomStar());
        star.x = centerX;
        star.y = centerY;
      } else {
        // Move star outward
        const angle = Math.atan2(dy, dx);
        const speed = star.speed * this.starSpeed * (1 + intensity);
        
        star.x += Math.cos(angle) * speed * (1 / star.z);
        star.y += Math.sin(angle) * speed * (1 / star.z);
      }
    }
  }
  
  private drawStars(intensity: number): void {
    for (let star of this.stars) {
      const size = star.size * (1 + intensity * 2);
      
      // Star brightness based on audio intensity
      const alpha = 0.5 + intensity * 0.5;
      
      this.ctx.fillStyle = this.hexToRgba(star.color, alpha);
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow effect
      const gradient = this.ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, size * 3
      );
      
      gradient.addColorStop(0, this.hexToRgba(star.color, 0.3 * alpha));
      gradient.addColorStop(1, this.hexToRgba(star.color, 0));
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  private drawBeatPulse(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    
    // Create pulse
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius
    );
    
    const pulseColor = this.colorScheme[0];
    
    gradient.addColorStop(0, this.hexToRgba(pulseColor, 0.2 * intensity));
    gradient.addColorStop(0.7, this.hexToRgba(pulseColor, 0.1 * intensity));
    gradient.addColorStop(1, this.hexToRgba(pulseColor, 0));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

export default CosmicVisualization;
