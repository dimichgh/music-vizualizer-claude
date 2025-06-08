import Base2DVisualization from './base2d';
import { AudioAnalysisData } from '../../shared/types';

/**
 * Base class for all visualizations
 * 
 * @deprecated Use Base2DVisualization for 2D visualizations or Base3DVisualization for 3D visualizations
 */
abstract class BaseVisualization extends Base2DVisualization {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }
  
  /**
   * Draw the visualization based on audio analysis data
   */
  public abstract draw(analysisData: AudioAnalysisData): void;
}

export default BaseVisualization;
