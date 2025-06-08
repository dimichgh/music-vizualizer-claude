import { AudioAnalysisData } from '../../shared/types';

/**
 * Abstract base class for all visualizations (both 2D and 3D)
 */
abstract class AbstractVisualization {
  protected canvas: HTMLCanvasElement;
  protected width: number;
  protected height: number;
  protected sensitivity: number = 1.0;
  protected colorScheme: string[] = ['#FF0000', '#00FF00', '#0000FF'];
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Make sure canvas is properly sized
    this.resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }
  
  /**
   * Resize canvas to match its display size
   */
  protected resizeCanvas(): void {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    
    // Check if canvas size needs to be updated
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.width = displayWidth;
      this.height = displayHeight;
    }
  }
  
  /**
   * Set the visualization sensitivity
   */
  public setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0, Math.min(2, sensitivity));
  }
  
  /**
   * Set the color scheme to use for the visualization
   */
  public setColorScheme(colors: string[]): void {
    if (colors.length > 0) {
      this.colorScheme = colors;
    }
  }
  
  /**
   * Draw the visualization based on audio analysis data
   */
  public abstract draw(analysisData: AudioAnalysisData): void;
  
  /**
   * Clean up any resources
   */
  public destroy(): void {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }
}

export default AbstractVisualization;
