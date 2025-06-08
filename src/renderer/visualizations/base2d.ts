import AbstractVisualization from './abstract';
import { AudioAnalysisData } from '../../shared/types';

/**
 * Base class for all 2D visualizations
 */
abstract class Base2DVisualization extends AbstractVisualization {
  protected ctx: CanvasRenderingContext2D;
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    
    this.ctx = context;
  }
  
  /**
   * Clear the canvas
   */
  protected clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  
  /**
   * Apply fade effect (useful for trails)
   */
  protected fade(alpha: number = 0.1): void {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  /**
   * Draw the visualization based on audio analysis data
   */
  public abstract draw(analysisData: AudioAnalysisData): void;
}

export default Base2DVisualization;
