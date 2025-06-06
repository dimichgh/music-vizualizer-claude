import BaseVisualization from './base';
import { AudioAnalysisData } from '../../shared/types';
import { DEFAULT_COLOR_SCHEMES } from '../../shared/constants';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  loaded: boolean;
  element: HTMLImageElement | HTMLVideoElement;
}

interface SpectrumRay {
  angle: number;
  frequency: number;
  height: number;
  color: string;
  speed: number; // Speed multiplier for more varied motion
}

class RectangularVisualization extends BaseVisualization {
  private centerRectWidth: number = 0; // Will be set dynamically based on canvas size
  private centerRectHeight: number = 0; // Will be set dynamically based on canvas size
  private centerPulse: number = 0;
  private time: number = 0;
  private reactivityLevel: number = 1.0; // Increased reactivity
  private dominantInstrument: string | null = null;
  private colorTransitionSpeed: number = 0.01;
  private currentHue: number = 0;
  private mediaItems: MediaItem[] = [];
  private currentMediaIndex: number = 0;
  private lastMediaChangeTime: number = 0;
  private mediaDuration: number = 5000; // Time in ms to show each media item
  private spectrumRays: SpectrumRay[] = [];
  private rayCount: number = 300; // Even more rays for better coverage
  
  // Color mapping for different instruments (same as sunburst)
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
    this.initDefaults();
    this.initSpectrumRays();
  }
  
  private initSpectrumRays(): void {
    this.spectrumRays = [];
    
    for (let i = 0; i < this.rayCount; i++) {
      const angle = (i / this.rayCount) * Math.PI * 2;
      const frequency = Math.floor((i / this.rayCount) * 128); // Map each ray to a frequency bin
      const speed = 0.8 + Math.random() * 0.4; // Random speed multiplier between 0.8 and 1.2
      
      this.spectrumRays.push({
        angle,
        frequency,
        height: 0,
        color: `hsl(${(i / this.rayCount) * 360}, 100%, 50%)`,
        speed
      });
    }
  }
  
  public setMediaItems(items: string[]): void {
    console.log('Setting media items:', items);
    
    // Clear existing media items and stop any playing videos
    this.mediaItems.forEach(item => {
      if (item.type === 'video') {
        const video = item.element as HTMLVideoElement;
        video.pause();
        video.src = '';
      }
    });
    
    this.mediaItems = [];
    
    // Process each media URL
    items.forEach(url => {
      const isVideo = url.match(/\.(mp4|webm|ogg)$/i) !== null;
      
      if (isVideo) {
        const video = document.createElement('video');
        video.crossOrigin = '';
        video.muted = true;
        video.loop = true;
        
        // Set event handlers before setting src to avoid race conditions
        video.onloadeddata = () => {
          console.log('Video loaded:', url);
          const mediaItem = this.mediaItems.find(item => item.url === url);
          if (mediaItem) {
            mediaItem.loaded = true;
            
            // Start playing the video if it's the current one
            if (this.mediaItems[this.currentMediaIndex]?.url === url) {
              video.play().catch(e => console.error('Error playing video:', e));
            }
          }
        };
        
        video.onerror = (e) => {
          console.error('Error loading video:', url, e);
        };
        
        // Set src after event handlers
        video.src = url;
        
        this.mediaItems.push({
          type: 'video',
          url,
          loaded: false,
          element: video
        });
      } else {
        // Assume it's an image
        const img = new Image();
        img.crossOrigin = '';
        
        img.onload = () => {
          console.log('Image loaded:', url);
          const mediaItem = this.mediaItems.find(item => item.url === url);
          if (mediaItem) {
            mediaItem.loaded = true;
          }
        };
        
        img.onerror = (e) => {
          console.error('Error loading image:', url, e);
        };
        
        img.src = url;
        
        this.mediaItems.push({
          type: 'image',
          url,
          loaded: false,
          element: img
        });
      }
    });
    
    // Initialize with the first item
    if (this.mediaItems.length > 0) {
      this.currentMediaIndex = 0;
      this.lastMediaChangeTime = Date.now();
      
      if (this.mediaItems[0].type === 'video') {
        const video = this.mediaItems[0].element as HTMLVideoElement;
        // Try to play the video
        setTimeout(() => {
          video.play().catch(e => console.error('Error playing initial video:', e));
        }, 100);
      }
    }
  }
  
  public setReactivityLevel(level: number): void {
    this.reactivityLevel = Math.max(0.1, Math.min(1.0, level));
  }
  
  public setMediaDuration(duration: number): void {
    this.mediaDuration = Math.max(1000, duration);
  }
  
  private initDefaults(): void {
    // Calculate rectangle size based on canvas dimensions
    this.updateRectangleSize();
  }
  
  private updateRectangleSize(): void {
    // Make the rectangle smaller to allow more space for rays and effects
    // Width is 55% of canvas width, up to a maximum of 55% of the canvas height with a 16:9 aspect ratio
    const maxWidth = this.width * 0.55;
    const maxHeight = this.height * 0.55;
    
    // Calculate dimensions while preserving a 16:9 aspect ratio
    if (maxWidth / 16 * 9 <= maxHeight) {
      // Width constrained
      this.centerRectWidth = maxWidth;
      this.centerRectHeight = maxWidth / 16 * 9;
    } else {
      // Height constrained
      this.centerRectHeight = maxHeight;
      this.centerRectWidth = maxHeight / 9 * 16;
    }
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
    this.centerPulse = this.centerPulse * 0.5 + bassEnergy * 0.5; // More responsive pulse
    
    // Update spectrum rays
    this.updateSpectrumRays(analysisData.frequencyData);
    
    // Draw spectrum rays
    this.drawSpectrumRays();
    
    // Draw center rectangle with media
    this.drawCenterRect(intensity);
    
    // Update media if needed
    this.updateMedia();
    
    // Draw beat pulses
    if (analysisData.peaks.length > 0) {
      this.drawBeatPulse(intensity);
    }
  }
  
  private updateMedia(): void {
    const currentTime = Date.now();
    
    // Check if it's time to change the media
    if (this.mediaItems.length > 1 && 
        currentTime - this.lastMediaChangeTime > this.mediaDuration) {
      
      // Stop current video if it's playing
      if (this.mediaItems[this.currentMediaIndex]?.type === 'video') {
        const video = this.mediaItems[this.currentMediaIndex].element as HTMLVideoElement;
        video.pause();
      }
      
      // Move to next media item
      this.currentMediaIndex = (this.currentMediaIndex + 1) % this.mediaItems.length;
      
      // Start new video if needed
      if (this.mediaItems[this.currentMediaIndex]?.type === 'video' && 
          this.mediaItems[this.currentMediaIndex].loaded) {
        const video = this.mediaItems[this.currentMediaIndex].element as HTMLVideoElement;
        video.currentTime = 0;
        video.play().catch(e => console.error('Error playing video during update:', e));
      }
      
      this.lastMediaChangeTime = currentTime;
    }
  }
  
  private updateSpectrumRays(frequencyData: Uint8Array): void {
    // Update each ray
    for (let i = 0; i < this.spectrumRays.length; i++) {
      const ray = this.spectrumRays[i];
      
      // Get frequency data for this ray with more emphasis on peaks
      const freqIndex = ray.frequency;
      const freqValue = Math.pow(frequencyData[freqIndex] / 255, 1.2); // Emphasize higher values
      
      // Calculate max ray height based on canvas dimensions - shorter rays
      const maxRayHeight = Math.min(this.width, this.height) * 0.15;
      
      // Update ray height with less smoothing for more dynamic response
      ray.height = ray.height * 0.4 + (freqValue * maxRayHeight * ray.speed) * 0.6;
      
      // Update ray color based on position (full gradient around the rectangle)
      const hue = (i / this.spectrumRays.length) * 360; // Full color spectrum
      const saturation = 90 + freqValue * 10; // Higher saturation
      const lightness = 50 + freqValue * 30; // Brighter colors
      
      ray.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  }
  
  private drawSpectrumRays(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Calculate rectangle dimensions with pulsing effect
    const rectWidth = this.centerRectWidth * (1 + this.centerPulse * 0.5 * this.reactivityLevel);
    const rectHeight = this.centerRectHeight * (1 + this.centerPulse * 0.5 * this.reactivityLevel);
    
    // Calculate rectangle corners
    const left = centerX - rectWidth / 2;
    const right = centerX + rectWidth / 2;
    const top = centerY - rectHeight / 2;
    const bottom = centerY + rectHeight / 2;
    
    // Draw rays
    for (let i = 0; i < this.spectrumRays.length; i++) {
      const ray = this.spectrumRays[i];
      const angle = ray.angle;
      
      // Determine which side of the rectangle this ray originates from
      let startX = centerX;
      let startY = centerY;
      
      // Find the intersection point of the ray with the rectangle
      try {
        if (angle >= 0 && angle < Math.PI / 2) {
          // Top-right quadrant
          const xIntersectRight = right;
          const yIntersectRight = centerY + Math.tan(angle) * (right - centerX);
          
          const yIntersectTop = top;
          const xIntersectTop = centerX + (top - centerY) / Math.tan(angle);
          
          if (yIntersectRight >= top && yIntersectRight <= bottom) {
            startX = right;
            startY = yIntersectRight;
          } else if (xIntersectTop >= left && xIntersectTop <= right) {
            startX = xIntersectTop;
            startY = top;
          }
        } else if (angle >= Math.PI / 2 && angle < Math.PI) {
          // Top-left quadrant
          const xIntersectLeft = left;
          const yIntersectLeft = centerY + Math.tan(angle) * (left - centerX);
          
          const yIntersectTop = top;
          const xIntersectTop = centerX + (top - centerY) / Math.tan(angle);
          
          if (yIntersectLeft >= top && yIntersectLeft <= bottom) {
            startX = left;
            startY = yIntersectLeft;
          } else if (xIntersectTop >= left && xIntersectTop <= right) {
            startX = xIntersectTop;
            startY = top;
          }
        } else if (angle >= Math.PI && angle < 3 * Math.PI / 2) {
          // Bottom-left quadrant
          const xIntersectLeft = left;
          const yIntersectLeft = centerY + Math.tan(angle) * (left - centerX);
          
          const yIntersectBottom = bottom;
          const xIntersectBottom = centerX + (bottom - centerY) / Math.tan(angle);
          
          if (yIntersectLeft >= top && yIntersectLeft <= bottom) {
            startX = left;
            startY = yIntersectLeft;
          } else if (xIntersectBottom >= left && xIntersectBottom <= right) {
            startX = xIntersectBottom;
            startY = bottom;
          }
        } else {
          // Bottom-right quadrant
          const xIntersectRight = right;
          const yIntersectRight = centerY + Math.tan(angle) * (right - centerX);
          
          const yIntersectBottom = bottom;
          const xIntersectBottom = centerX + (bottom - centerY) / Math.tan(angle);
          
          if (yIntersectRight >= top && yIntersectRight <= bottom) {
            startX = right;
            startY = yIntersectRight;
          } else if (xIntersectBottom >= left && xIntersectBottom <= right) {
            startX = xIntersectBottom;
            startY = bottom;
          }
        }
      } catch (e) {
        // Handle any edge cases (like division by zero)
        // Special case for vertical and horizontal angles
        if (angle === 0 || angle === Math.PI) {
          startX = angle === 0 ? right : left;
          startY = centerY;
        } else if (angle === Math.PI / 2 || angle === 3 * Math.PI / 2) {
          startX = centerX;
          startY = angle === Math.PI / 2 ? top : bottom;
        }
      }
      
      // Handle division by zero cases for vertical and horizontal rays
      if (!isFinite(startX) || isNaN(startX)) startX = centerX;
      if (!isFinite(startY) || isNaN(startY)) startY = centerY;
      
      // Calculate end points
      const endX = startX + Math.cos(angle) * ray.height;
      const endY = startY + Math.sin(angle) * ray.height;
      
      // Create gradient for the ray
      const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
      
      // Get base color
      const baseColor = ray.color;
      
      // Extract hue value (assumes hsl format)
      const hueMatch = baseColor.match(/hsl\((\d+)/);
      const hue = hueMatch ? parseInt(hueMatch[1]) : 0;
      
      // Brighter gradient colors
      gradient.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.85)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
      
      // Draw ray with glow effect
      this.ctx.save();
      this.ctx.shadowBlur = 8; // More pronounced glow
      this.ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.5)`;
      
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 1.5 + Math.random(); // Slightly thinner lines but still varied
      this.ctx.lineCap = 'round';
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
      
      this.ctx.restore();
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
    
    // Draw horizontal and vertical grid lines
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
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
  
  private drawCenterRect(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Calculate pulsing dimensions based on bass energy and reactivity
    const rectWidth = this.centerRectWidth * (1 + this.centerPulse * 0.5 * this.reactivityLevel);
    const rectHeight = this.centerRectHeight * (1 + this.centerPulse * 0.5 * this.reactivityLevel);
    
    // Calculate rectangle position
    const x = centerX - rectWidth / 2;
    const y = centerY - rectHeight / 2;
    
    // Draw glow effect with brighter colors
    const glowSize = 25 * (1 + intensity * this.reactivityLevel); // Larger glow
    const glowColor = this.dominantInstrument 
      ? `hsla(${this.currentHue}, 100%, 60%, ${0.4 + intensity * 0.4})` // Brighter glow
      : `hsla(40, 100%, 60%, ${0.4 + intensity * 0.4})`;
    
    this.ctx.shadowBlur = glowSize;
    this.ctx.shadowColor = glowColor;
    
    // Draw the rectangle frame with multiple layers for extra glow
    for (let i = 0; i < 3; i++) {
      const layerOpacity = 0.8 - i * 0.2; // Higher opacity
      this.ctx.strokeStyle = glowColor.replace('hsla', 'hsl').replace(/, [0-9.]+\)/, `, ${layerOpacity})`);
      this.ctx.lineWidth = (3 + intensity * 5) - i;
      this.ctx.strokeRect(x, y, rectWidth, rectHeight);
    }
    
    // Reset shadow for content
    this.ctx.shadowBlur = 0;
    
    // Draw the current media item if available
    if (this.mediaItems.length > 0 && 
        this.currentMediaIndex < this.mediaItems.length && 
        this.mediaItems[this.currentMediaIndex]?.loaded) {
      
      const mediaItem = this.mediaItems[this.currentMediaIndex];
      
      // Create a clip path for the rectangle
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(x, y, rectWidth, rectHeight);
      this.ctx.clip();
      
      // Draw the media content
      try {
        this.ctx.drawImage(mediaItem.element, x, y, rectWidth, rectHeight);
      } catch (e) {
        // Handle any errors with drawing media
        console.error('Error drawing media:', e);
        
        // Draw a placeholder for failed media
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, rectWidth, rectHeight);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Error loading media', centerX, centerY);
      }
      
      // Apply a color overlay based on the current instrument
      if (this.dominantInstrument && intensity > 0.5) {
        this.ctx.fillStyle = `hsla(${this.currentHue}, 70%, 50%, ${(intensity - 0.5) * 0.4})`;
        this.ctx.fillRect(x, y, rectWidth, rectHeight);
      }
      
      this.ctx.restore();
    } else {
      // Draw a placeholder if no media is available or loaded
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(x, y, rectWidth, rectHeight);
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.mediaItems.length > 0 ? 'Loading media...' : 'No media loaded', centerX, centerY);
    }
    
    // Draw corner accent effects with brighter colors
    this.drawCornerAccents(x, y, rectWidth, rectHeight, intensity);
  }
  
  private drawCornerAccents(x: number, y: number, width: number, height: number, intensity: number): void {
    const cornerSize = 35 * (1 + intensity * 0.5); // Slightly larger corners
    
    // Set up style for corner accents with brighter colors
    this.ctx.strokeStyle = this.dominantInstrument 
      ? `hsla(${this.currentHue}, 100%, 80%, ${0.6 + intensity * 0.4})` // Brighter
      : `hsla(40, 100%, 80%, ${0.6 + intensity * 0.4})`;
    this.ctx.lineWidth = 2 + intensity * 3;
    
    // Draw with glow effect
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = this.ctx.strokeStyle;
    
    // Top-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + cornerSize);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(x + cornerSize, y);
    this.ctx.stroke();
    
    // Top-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(x + width - cornerSize, y);
    this.ctx.lineTo(x + width, y);
    this.ctx.lineTo(x + width, y + cornerSize);
    this.ctx.stroke();
    
    // Bottom-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(x + width, y + height - cornerSize);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x + width - cornerSize, y + height);
    this.ctx.stroke();
    
    // Bottom-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(x + cornerSize, y + height);
    this.ctx.lineTo(x, y + height);
    this.ctx.lineTo(x, y + height - cornerSize);
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }
  
  private drawBeatPulse(intensity: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Calculate rectangle dimensions for pulses
    const baseWidth = this.centerRectWidth * (1 + this.centerPulse * 0.5);
    const baseHeight = this.centerRectHeight * (1 + this.centerPulse * 0.5);
    
    // Create multiple concentric rectangles for beat pulses
    const pulseCount = 5; // Increased pulse count
    
    for (let i = 0; i < pulseCount; i++) {
      // Each pulse has different size and color
      const sizeOffset = i * 0.2; // Reduced spacing between pulses
      const pulseWidth = baseWidth * (1 + sizeOffset + intensity);
      const pulseHeight = baseHeight * (1 + sizeOffset + intensity);
      
      // Calculate rectangle position
      const x = centerX - pulseWidth / 2;
      const y = centerY - pulseHeight / 2;
      
      // Different hue for each pulse - brighter colors
      const hue = (i * 30 + this.currentHue) % 360;
      
      // Fade opacity based on pulse index but higher overall opacity
      const opacity = (1 - i / pulseCount) * intensity * 0.7;
      
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 75%, ${opacity})`;
      this.ctx.lineWidth = (8 - i * 1.5) * intensity;
      
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${opacity * 0.7})`;
      
      this.ctx.beginPath();
      this.ctx.rect(x, y, pulseWidth, pulseHeight);
      this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
    
    // Add flash effect on beat
    const flashOpacity = intensity * 0.2; // Stronger flash
    this.ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  // Handle canvas resizing
  protected resizeCanvas(): void {
    super.resizeCanvas();
    
    // Update center rect size based on new canvas dimensions
    this.updateRectangleSize();
  }
  
  // Clean up any resources
  public destroy(): void {
    super.destroy();
    
    // Stop any playing videos
    this.mediaItems.forEach(item => {
      if (item.type === 'video') {
        const video = item.element as HTMLVideoElement;
        video.pause();
        video.src = '';
      }
    });
    
    // Clear media items
    this.mediaItems = [];
  }
}

export default RectangularVisualization;