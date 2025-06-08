import * as THREE from 'three';
import AbstractVisualization from './abstract';
import { AudioAnalysisData, CameraControls } from '../../shared/types';

/**
 * Base class for all 3D visualizations
 */
abstract class Base3DVisualization extends AbstractVisualization {
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected renderer: THREE.WebGLRenderer;
  protected clock: THREE.Clock;
  
  protected cameraControls: CameraControls = {
    position: { x: 0, y: 5, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
    enableOrbit: true,
    enablePan: true,
    enableZoom: true
  };
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    
    // Make sure width and height are valid before creating camera
    if (this.width === 0) this.width = canvas.clientWidth || 800;
    if (this.height === 0) this.height = canvas.clientHeight || 600;
    
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      65, // FOV
      this.width / this.height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    // Set up WebGL renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      });
    } catch (e) {
      console.error('Failed to create WebGL renderer:', e);
      throw e;
    }
    
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Set initial camera position
    this.camera.position.set(
      this.cameraControls.position.x,
      this.cameraControls.position.y,
      this.cameraControls.position.z
    );
    this.camera.lookAt(
      this.cameraControls.target.x,
      this.cameraControls.target.y,
      this.cameraControls.target.z
    );
    
    // Initialize clock for animations
    this.clock = new THREE.Clock();
  }
  
  /**
   * Resize handling for 3D renderer
   */
  protected resizeCanvas(): void {
    super.resizeCanvas();
    
    if (this.camera && this.renderer) {
      // Update camera aspect ratio
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      
      // Update renderer size
      this.renderer.setSize(this.width, this.height);
    }
  }
  
  /**
   * Set camera position
   */
  public setCameraPosition(position: { x: number, y: number, z: number }): void {
    this.cameraControls.position = position;
    this.camera.position.set(position.x, position.y, position.z);
  }
  
  /**
   * Set camera target (look at point)
   */
  public setCameraTarget(target: { x: number, y: number, z: number }): void {
    this.cameraControls.target = target;
    this.camera.lookAt(target.x, target.y, target.z);
  }
  
  /**
   * Enable/disable orbit controls
   */
  public setOrbitEnabled(enabled: boolean): void {
    this.cameraControls.enableOrbit = enabled;
  }
  
  /**
   * Enable/disable pan controls
   */
  public setPanEnabled(enabled: boolean): void {
    this.cameraControls.enablePan = enabled;
  }
  
  /**
   * Enable/disable zoom controls
   */
  public setZoomEnabled(enabled: boolean): void {
    this.cameraControls.enableZoom = enabled;
  }
  
  /**
   * Draw the visualization based on audio analysis data
   */
  public abstract draw(analysisData: AudioAnalysisData): void;
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    super.destroy();
    
    // Dispose of Three.js resources
    if (this.scene) {
      // Dispose of all geometries and materials
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      // Clear scene
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }
    
    // Clear renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

export default Base3DVisualization;
