import BaseVisualization from './base';
import { AudioAnalysisData, InstrumentDetection } from '../../shared/types';
import { INSTRUMENTS } from '../../shared/constants';

interface Figure {
  instrument: string;
  opacity: number;
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

class FiguresVisualization extends BaseVisualization {
  private figures: Map<string, Figure> = new Map();
  private readonly figureImages: Map<string, HTMLImageElement> = new Map();
  private readonly defaultFigureSize: number = 200;
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.loadFigureImages();
  }
  
  /**
   * Load the instrument figure images
   * In a real implementation, these would be actual images of players
   */
  private loadFigureImages(): void {
    // For each instrument, we would load an image
    // For this example, we'll simulate loaded images with colored rectangles
    
    for (const instrument of INSTRUMENTS) {
      const img = new Image();
      
      // In a real implementation, load actual images
      // img.src = `assets/figures/${instrument}.png`;
      
      // Add to map even though we're not really loading images
      this.figureImages.set(instrument, img);
    }
  }
  
  /**
   * Update the figures based on instrument detection
   */
  private updateFigures(instrumentDetection: InstrumentDetection | null, intensity: number): void {
    if (!instrumentDetection) return;
    
    const { instrument, confidence } = instrumentDetection;
    
    // Update detected instrument figure
    if (confidence > 0.5) {
      // If the instrument is newly detected, create a new figure
      if (!this.figures.has(instrument)) {
        this.figures.set(instrument, {
          instrument,
          opacity: 0,
          scale: 0.8 + confidence * 0.4,
          x: Math.random() * this.width * 0.8 + this.width * 0.1,
          y: Math.random() * this.height * 0.7 + this.height * 0.2,
          rotation: (Math.random() - 0.5) * 0.2,
        });
      }
      
      // Increase opacity based on confidence
      const figure = this.figures.get(instrument)!;
      figure.opacity = Math.min(0.8, figure.opacity + 0.05 * confidence);
      
      // Apply subtle animation based on audio intensity
      figure.scale = 0.8 + confidence * 0.4 + intensity * 0.2;
      figure.rotation += (Math.random() - 0.5) * 0.02 * intensity;
    }
    
    // Fade out all other instruments
    for (const [key, figure] of this.figures.entries()) {
      if (key !== instrument) {
        figure.opacity = Math.max(0, figure.opacity - 0.03);
        
        // Remove figure if it's completely transparent
        if (figure.opacity <= 0) {
          this.figures.delete(key);
        }
      }
    }
  }
  
  /**
   * Draw the visualization
   */
  public draw(analysisData: AudioAnalysisData): void {
    // Don't clear the canvas, as figures should be drawn on top of other visualizations
    
    // Get audio intensity for animation
    const intensity = analysisData.averageFrequency / 255;
    
    // Update figures based on instrument detection
    this.updateFigures(
      analysisData.instrumentPrediction ? 
        {
          instrument: analysisData.instrumentPrediction,
          confidence: 0.7 + Math.random() * 0.3, // Simulated confidence
          timestamp: Date.now(),
        } : null,
      intensity
    );
    
    // Draw all visible figures
    this.drawFigures(intensity);
  }
  
  /**
   * Draw all instrument figures
   */
  private drawFigures(intensity: number): void {
    for (const figure of this.figures.values()) {
      this.drawFigure(figure, intensity);
    }
  }
  
  /**
   * Draw a single instrument figure
   */
  private drawFigure(figure: Figure, intensity: number): void {
    // Save current drawing state
    this.ctx.save();
    
    // Position and rotate figure
    this.ctx.translate(figure.x, figure.y);
    this.ctx.rotate(figure.rotation);
    this.ctx.scale(figure.scale, figure.scale);
    
    // Set transparency
    this.ctx.globalAlpha = figure.opacity;
    
    // In a real implementation, we would draw the actual image
    // this.ctx.drawImage(
    //   this.figureImages.get(figure.instrument)!,
    //   -this.defaultFigureSize / 2,
    //   -this.defaultFigureSize / 2,
    //   this.defaultFigureSize,
    //   this.defaultFigureSize
    // );
    
    // Instead, draw a colored rectangle with instrument name
    this.drawPlaceholderFigure(figure.instrument, intensity);
    
    // Restore drawing state
    this.ctx.restore();
  }
  
  /**
   * Draw a placeholder figure for an instrument
   * In a real implementation, this would be replaced with actual images
   */
  private drawPlaceholderFigure(instrument: string, intensity: number): void {
    const size = this.defaultFigureSize;
    const colors: Record<string, string> = {
      piano: '#4285F4',
      guitar: '#EA4335',
      bass: '#FBBC05',
      drums: '#34A853',
      violin: '#FF6D01',
      cello: '#46BDC6',
      flute: '#7BAAF7',
      saxophone: '#F6AEA9',
      trumpet: '#FDE293',
      synthesizer: '#A8DAB5',
      voice: '#FFA3B1',
    };
    
    const color = colors[instrument] || '#AAAAAA';
    
    // Draw a silhouette shape
    this.ctx.fillStyle = color;
    
    // Draw pulsing silhouette based on instrument
    switch (instrument) {
      case 'piano':
        this.drawPianoFigure(size, intensity);
        break;
      case 'guitar':
        this.drawGuitarFigure(size, intensity);
        break;
      case 'drums':
        this.drawDrumsFigure(size, intensity);
        break;
      default:
        // Generic humanoid figure
        this.drawGenericFigure(size, intensity);
    }
    
    // Add instrument name
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(instrument.toUpperCase(), 0, size / 2 + 30);
  }
  
  private drawPianoFigure(size: number, intensity: number): void {
    const pulse = 1 + intensity * 0.2;
    
    // Piano body
    this.ctx.fillRect(-size / 2 * 0.8, -size / 2 * 0.4, size * 0.8, size * 0.4);
    
    // Piano keys
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 12; i++) {
      const keyWidth = size * 0.8 / 12;
      this.ctx.fillRect(
        -size / 2 * 0.8 + i * keyWidth,
        -size / 2 * 0.4,
        keyWidth * 0.9,
        size * 0.4 * 0.7
      );
    }
    
    // Person
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Head
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.1, size * 0.1, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.fillRect(-size * 0.15, -size * 0.1, size * 0.3, size * 0.3);
    
    // Arms moving with intensity
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.15, -size * 0.05);
    this.ctx.lineTo(-size * 0.3, -size * 0.05 + Math.sin(Date.now() / 200) * 10 * pulse);
    this.ctx.lineTo(-size * 0.3, -size * 0.05 + Math.sin(Date.now() / 200) * 10 * pulse + 10);
    this.ctx.lineTo(-size * 0.15, -size * 0.05 + 10);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.15, -size * 0.05);
    this.ctx.lineTo(size * 0.3, -size * 0.05 + Math.sin(Date.now() / 180 + 1) * 10 * pulse);
    this.ctx.lineTo(size * 0.3, -size * 0.05 + Math.sin(Date.now() / 180 + 1) * 10 * pulse + 10);
    this.ctx.lineTo(size * 0.15, -size * 0.05 + 10);
    this.ctx.fill();
  }
  
  private drawGuitarFigure(size: number, intensity: number): void {
    const pulse = 1 + intensity * 0.2;
    
    // Person
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Head
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.25, size * 0.1, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.fillRect(-size * 0.15, -size * 0.25, size * 0.3, size * 0.5);
    
    // Guitar
    this.ctx.fillStyle = this.ctx.fillStyle;
    this.ctx.beginPath();
    this.ctx.ellipse(
      0, 
      size * 0.1, 
      size * 0.2, 
      size * 0.3, 
      Math.sin(Date.now() / 1000) * 0.2 * pulse, 
      0, 
      Math.PI * 2
    );
    this.ctx.fill();
    
    // Guitar neck
    this.ctx.save();
    this.ctx.translate(0, size * 0.1);
    this.ctx.rotate(Math.sin(Date.now() / 1000) * 0.2 * pulse + 0.3);
    this.ctx.fillRect(-size * 0.05, -size * 0.6, size * 0.1, size * 0.6);
    this.ctx.restore();
    
    // Strumming arm
    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.15, -size * 0.1);
    this.ctx.lineTo(size * 0.1, size * 0.1 + Math.sin(Date.now() / 150) * 15 * pulse);
    this.ctx.lineTo(size * 0.1 + 10, size * 0.1 + Math.sin(Date.now() / 150) * 15 * pulse + 5);
    this.ctx.lineTo(size * 0.15 + 10, -size * 0.1 + 5);
    this.ctx.fill();
  }
  
  private drawDrumsFigure(size: number, intensity: number): void {
    const pulse = 1 + intensity * 0.3;
    
    // Drums
    this.ctx.fillStyle = this.ctx.fillStyle;
    
    // Bass drum
    this.ctx.beginPath();
    this.ctx.ellipse(0, size * 0.1, size * 0.25, size * 0.2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Toms
    this.ctx.beginPath();
    this.ctx.ellipse(-size * 0.25, -size * 0.1, size * 0.1, size * 0.08, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.ellipse(size * 0.25, -size * 0.1, size * 0.1, size * 0.08, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Cymbal
    this.ctx.beginPath();
    this.ctx.ellipse(
      size * 0.3, 
      -size * 0.25, 
      size * 0.15, 
      size * 0.05, 
      Math.sin(Date.now() / 200) * 0.1 * pulse, 
      0, 
      Math.PI * 2
    );
    this.ctx.fill();
    
    // Person
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Head
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.3, size * 0.1, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.fillRect(-size * 0.15, -size * 0.3, size * 0.3, size * 0.3);
    
    // Arms moving with intensity
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.15, -size * 0.2);
    this.ctx.lineTo(
      -size * 0.25, 
      -size * 0.1 + Math.sin(Date.now() / 100) * 20 * pulse
    );
    this.ctx.lineTo(
      -size * 0.25 + 10, 
      -size * 0.1 + Math.sin(Date.now() / 100) * 20 * pulse + 10
    );
    this.ctx.lineTo(-size * 0.15 + 10, -size * 0.2 + 10);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.15, -size * 0.2);
    this.ctx.lineTo(
      size * 0.3, 
      -size * 0.2 + Math.sin(Date.now() / 120 + 2) * 20 * pulse
    );
    this.ctx.lineTo(
      size * 0.3 + 10, 
      -size * 0.2 + Math.sin(Date.now() / 120 + 2) * 20 * pulse + 10
    );
    this.ctx.lineTo(size * 0.15 + 10, -size * 0.2 + 10);
    this.ctx.fill();
  }
  
  private drawGenericFigure(size: number, intensity: number): void {
    const pulse = 1 + intensity * 0.2;
    
    // Person
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Head
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.25, size * 0.1, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.fillRect(-size * 0.15, -size * 0.25, size * 0.3, size * 0.5);
    
    // Arms
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.15, -size * 0.15);
    this.ctx.lineTo(
      -size * 0.3, 
      -size * 0.05 + Math.sin(Date.now() / 300) * 10 * pulse
    );
    this.ctx.lineTo(
      -size * 0.3 + 10, 
      -size * 0.05 + Math.sin(Date.now() / 300) * 10 * pulse + 10
    );
    this.ctx.lineTo(-size * 0.15 + 10, -size * 0.15 + 10);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.15, -size * 0.15);
    this.ctx.lineTo(
      size * 0.3, 
      -size * 0.05 + Math.sin(Date.now() / 350 + 1) * 10 * pulse
    );
    this.ctx.lineTo(
      size * 0.3 + 10, 
      -size * 0.05 + Math.sin(Date.now() / 350 + 1) * 10 * pulse + 10
    );
    this.ctx.lineTo(size * 0.15 + 10, -size * 0.15 + 10);
    this.ctx.fill();
    
    // Legs
    this.ctx.fillRect(-size * 0.15, size * 0.25, size * 0.1, size * 0.25);
    this.ctx.fillRect(size * 0.05, size * 0.25, size * 0.1, size * 0.25);
  }
}

export default FiguresVisualization;