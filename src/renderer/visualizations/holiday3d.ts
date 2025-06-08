import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Base3DVisualization from './base3d';
import { AudioAnalysisData, CameraControls, ThreeDElementProps } from '../../shared/types';
import { DEFAULT_COLOR_SCHEMES } from '../../shared/constants';

// 3D elements types
enum ElementType {
  HOUSE,
  ROOF,
  WINDOW,
  DOOR,
  CHIMNEY,
  TREE,
  SNOWMAN,
  GIFT,
  STAR,
  LIGHT_STRING,
  GROUND
}

// Light types
enum LightType {
  POINT,
  SPOT,
  DIRECTIONAL,
  AMBIENT
}

// Interface for 3D scene elements
interface SceneElement {
  type: ElementType;
  object: THREE.Object3D;
  material?: THREE.Material | THREE.Material[];
  update: (time: number, audioData: AudioAnalysisData) => void;
  props: ThreeDElementProps;
}

// Interface for light elements
interface LightElement {
  type: LightType;
  light: THREE.Light;
  helper?: THREE.Object3D;
  update: (time: number, audioData: AudioAnalysisData) => void;
}

class Holiday3DVisualization extends Base3DVisualization {
  // Three.js extensions
  private controls: OrbitControls;
  
  // Scene elements
  private elements: SceneElement[] = [];
  private lights: LightElement[] = [];
  private particleSystems: THREE.Points[] = [];
  
  // Shader materials
  private shaderMaterials: {
    glow: THREE.ShaderMaterial;
    snow: THREE.ShaderMaterial;
    lightString: THREE.ShaderMaterial;
    particle: THREE.ShaderMaterial;
    aurora: THREE.ShaderMaterial;
    iceCrystal: THREE.ShaderMaterial;
  };
  
  // Camera control properties
  protected cameraControls: CameraControls = {
    position: { x: 0, y: 5, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
    enableOrbit: true,
    enablePan: true,
    enableZoom: true
  };
  
  // Additional properties
  private time: number = 0;
  private dominantInstrument: string | null = null;
  private colorTransitionSpeed: number = 0.01;
  private currentHue: number = 0;
  private snowParticles: THREE.Points | null = null;
  
  // Instrument colors
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
  
  // Custom settings
  private brightness: number = 1.0;
  private reactivity: number = 1.0;
  private snowIntensity: number = 1.0;
  private auroraIntensity: number = 1.0;
  private treeLightsVisible: boolean = true;
  private crystalsVisible: boolean = true;
  private colorTheme: 'warm' | 'cool' | 'rainbow' | 'classic' = 'classic';
  
  // Color theme presets
  private colorThemes = {
    classic: {
      sky: { top: 0x001133, bottom: 0x0a1a3f },
      aurora: { base: 0x00ff80, secondary: 0x4169e1 },
      snow: 0xffffff,
      trees: 0x005500,
      crystals: 0x88ccff,
      house: 0x8B4513,
      roof: 0x703030
    },
    warm: {
      sky: { top: 0x110022, bottom: 0x331122 },
      aurora: { base: 0xff8800, secondary: 0xff3366 },
      snow: 0xfff0e0,
      trees: 0x225500,
      crystals: 0xff88aa,
      house: 0x8B5533,
      roof: 0x803020
    },
    cool: {
      sky: { top: 0x000033, bottom: 0x001a4f },
      aurora: { base: 0x00ffff, secondary: 0x0088ff },
      snow: 0xe0f0ff,
      trees: 0x004466,
      crystals: 0x00ccff,
      house: 0x6B5933,
      roof: 0x505060
    },
    rainbow: {
      sky: { top: 0x000022, bottom: 0x220044 },
      aurora: { base: 0xff00ff, secondary: 0x00ffff },
      snow: 0xf8f8f8,
      trees: 0x33cc33,
      crystals: 0xff88ff,
      house: 0x996633,
      roof: 0x990000
    }
  };
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.colorScheme = DEFAULT_COLOR_SCHEMES.COSMIC;
    
    // Initialize Three.js components with enhanced settings
    this.scene = new THREE.Scene();
    
    // Make sure width and height are valid before creating camera
    if (this.width === 0) this.width = canvas.clientWidth || 800;
    if (this.height === 0) this.height = canvas.clientHeight || 600;
    
    this.camera = new THREE.PerspectiveCamera(
      65, // FOV (increased for wider view)
      this.width / this.height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    // Set up renderer with enhanced settings
    // We're using a dedicated canvas for WebGL so we don't need to check for existing contexts
    try {
      // First, ensure the canvas is properly initialized
      if (this.width === 0) this.width = this.canvas.clientWidth || 800;
      if (this.height === 0) this.height = this.canvas.clientHeight || 600;
      
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance', // Request high performance GPU
        preserveDrawingBuffer: true // Important for mixing with other visuals
      });
    } catch (e) {
      console.error('Failed to create WebGL renderer:', e);
      throw e;
    }
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Better color accuracy
    
    // Set up camera
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
    
    // Set up controls with enhanced parameters
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1; // Increased for smoother movement
    this.controls.minDistance = 3; // Allow closer zoom for detail viewing
    this.controls.maxDistance = 40; // Reduced maximum distance to keep scene in view
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from going below ground
    this.controls.minPolarAngle = 0.1; // Prevent camera from going directly overhead
    this.controls.zoomSpeed = 1.2; // Slightly faster zoom for better responsiveness
    this.controls.rotateSpeed = 0.8; // Slightly slower rotation for more precision
    this.controls.panSpeed = 0.8; // Slightly slower panning for more precision
    this.controls.keyPanSpeed = 20; // Faster keyboard panning
    
    // Initialize clock for animations
    this.clock = new THREE.Clock();
    
    // Initialize shader materials
    this.shaderMaterials = this.createShaderMaterials();
    
    // Create scene elements
    this.initScene();
  }
  
  // Create shader materials from glsl files
  private createShaderMaterials() {
    // In a real implementation, we would load the shaders from files
    // For this example, we'll create basic shader materials
    
    // Glow shader
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x00ffff) },
        intensity: { value: 1.0 },
        power: { value: 2.0 },
        baseBrightness: { value: 0.1 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float power;
        uniform float baseBrightness;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Calculate glow effect based on view angle
          float viewAngle = abs(dot(normalize(vNormal), normalize(-vPosition)));
          float glow = pow(1.0 - viewAngle, power) * intensity + baseBrightness;
          
          // Apply glow color
          vec3 finalColor = glowColor * glow;
          gl_FragColor = vec4(finalColor, glow);
        }
      `,
      transparent: true,
      side: THREE.FrontSide
    });
    
    // Snow shader
    const snowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        snowTexture: { value: null },
        time: { value: 0.0 },
        noiseScale: { value: 5.0 },
        snowBrightness: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vHeight;
        
        void main() {
          vUv = uv;
          vHeight = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float noiseScale;
        uniform float snowBrightness;
        
        varying vec2 vUv;
        varying float vHeight;
        
        // Simple noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          // Create dynamic snow surface with simple noise
          float noise = random(vUv * noiseScale + vec2(time * 0.1));
          
          // Base snow color with slight blue tint
          vec3 snowColor = vec3(0.9, 0.95, 1.0);
          
          // Add height-based shading
          float heightFactor = vHeight * 0.5 + 0.5;
          
          // Combine all effects
          vec3 finalColor = snowColor * (noise * 0.2 + 0.8) * heightFactor;
          
          // Apply overall brightness
          finalColor *= snowBrightness;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
    
    // Light string shader
    const lightStringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH5QMfFDAYEKrZRwAAArhJREFUWMPt10+IVlUUB/DPjClmOS0ibRGEVBC1qE0WQRH9WbWoRUGLahO0KoKgoGXQHyiCIKRFQRG0KKJVRrWIFhFBi6BaRP9sUTQxIZUac1o8Z+B5vffmzcw7Ay38weO9e+7vnnPuued37itoNFq4AxuxAdfhCizFn/gRP+JTfIpDKVmmPWrhQdyPrNL+K9/jdXyA33sBYA2ewFpplxJBzOIbfIsJrMJ5uEw5fSUr1PG5xLxn3SUuRVBwO27BYqzpMrdO8FaMllvxAp4tzDuDcTzfjaBV4NiFhc70Izx6rKUvwS5pwD13c/H3NF5Jc27H2SWmDuQOo/gGX6Bd2eNMvIf9uBKLKu0tfI+bcamZ/foVpvq9CR9WgEzL23FQc6fD3Q73FXt3iZsK+5gUJcUGKvEATgHe6sC0ztGV4XBlbKs0JsqrXtdmGMcbBaNXMYEJDEnXrZNjJ7yL9ThX6oIR7MC5PfzuxN04u9B/hjMQKAJoYW9GrfKPVh4v4vFCfxA7/z+AkXK+1kFBxfGnimwtduEBuULOleYqD6DPeMQHy/lRuVLuB4CL5MFNy/W+HwCOlHOz9JbxfgDYKz9+mVzu+gHgYDl/WIB0YtrBKpFv5WpYY64I7oOQ5/l1vCs3l+W/3Ut9ADCtXtG3YLnkpIW9fQCwrZzflYtPxfJRdS+mdD99vMIJuK3Q/yM9Rqs4ORc6gVz2+okV+LSKSWF+jOxCxvYGHpKbUiEkG/GSfM8rlgbxxFFyQjYx1mX8vLTRSOG4jU+wiHoT6kYXyVeuTvH8cWnpO52QFZyFfTJiMlm3Z5+SU+7xDu1deRwPStf3WAfgVnGU3Ax61oq5/fCvkbvcHVIPWK7+w9TvP6Mj+A3H5L9jM8kF/BMMDaImT+LrVwAAAABJRU5ErkJggg==') },
        time: { value: 0.0 },
        pulseFrequency: { value: 2.0 },
        pulseAmount: { value: 0.3 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        attribute float intensity;
        
        varying vec3 vColor;
        varying float vIntensity;
        
        void main() {
          vColor = customColor;
          vIntensity = intensity;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        uniform float time;
        uniform float pulseFrequency;
        uniform float pulseAmount;
        
        varying vec3 vColor;
        varying float vIntensity;
        
        void main() {
          // Calculate radial distance from center of point
          vec2 uv = gl_PointCoord.xy - 0.5;
          float r = length(uv) * 2.0;
          
          // Create soft circular point
          float intensity = vIntensity * (0.5 + sin(time * pulseFrequency) * pulseAmount * 0.5);
          float alpha = max(0.0, 1.0 - r) * intensity;
          
          // Apply glow effect
          vec3 glow = vColor * (1.0 + sin(time * pulseFrequency) * pulseAmount * 0.5);
          
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Particle shader
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH5QMfFDAYEKrZRwAAArhJREFUWMPt10+IVlUUB/DPjClmOS0ibRGEVBC1qE0WQRH9WbWoRUGLahO0KoKgoGXQHyiCIKRFQRG0KKJVRrWIFhFBi6BaRP9sUTQxIZUac1o8Z+B5vffmzcw7Ay38weO9e+7vnnPuued37itoNFq4AxuxAdfhCizFn/gRP+JTfIpDKVmmPWrhQdyPrNL+K9/jdXyA33sBYA2ewFpplxJBzOIbfIsJrMJ5uEw5fSUr1PG5xLxn3SUuRVBwO27BYqzpMrdO8FaMllvxAp4tzDuDcTzfjaBV4NiFhc70Izx6rKUvwS5pwD13c/H3NF5Jc27H2SWmDuQOo/gGX6Bd2eNMvIf9uBKLKu0tfI+bcamZ/foVpvq9CR9WgEzL23FQc6fD3Q73FXt3iZsK+5gUJcUGKvEATgHe6sC0ztGV4XBlbKs0JsqrXtdmGMcbBaNXMYEJDEnXrZNjJ7yL9ThX6oIR7MC5PfzuxN04u9B/hjMQKAJoYW9GrfKPVh4v4vFCfxA7/z+AkXK+1kFBxfGnimwtduEBuULOleYqD6DPeMQHy/lRuVLuB4CL5MFNy/W+HwCOlHOz9JbxfgDYKz9+mVzu+gHgYDl/WIB0YtrBKpFv5WpYY64I7oOQ5/l1vCs3l+W/3Ut9ADCtXtG3YLnkpIW9fQCwrZzflYtPxfJRdS+mdD99vMIJuK3Q/yM9Rqs4ORc6gVz2+okV+LSKSWF+jOxCxvYGHpKbUiEkG/GSfM8rlgbxxFFyQjYx1mX8vLTRSOG4jU+wiHoT6kYXyVeuTvH8cWnpO52QFZyFfTJiMlm3Z5+SU+7xDu1deRwPStf3WAfgVnGU3Ax61oq5/fCvkbvcHVIPWK7+w9TvP6Mj+A3H5L9jM8kF/BMMDaImT+LrVwAAAABJRU5ErkJggg==') },
        time: { value: 0.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        attribute float opacity;
        attribute float angle;
        
        varying vec3 vColor;
        varying float vOpacity;
        varying float vAngle;
        
        void main() {
          vColor = customColor;
          vOpacity = opacity;
          vAngle = angle;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        uniform float time;
        
        varying vec3 vColor;
        varying float vOpacity;
        varying float vAngle;
        
        void main() {
          // Calculate rotated texture coordinates
          float c = cos(vAngle);
          float s = sin(vAngle);
          vec2 rotatedUV = vec2(
            c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,
            c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5
          );
          
          // Sample texture
          vec4 texColor = texture2D(pointTexture, rotatedUV);
          
          // Apply color and opacity
          gl_FragColor = vec4(vColor, vOpacity) * texColor;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Aurora borealis shader
    const auroraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(this.width, this.height) },
        intensity: { value: 0.5 },
        speed: { value: 0.2 },
        baseColor: { value: new THREE.Color(0x00ff80) },
        secondColor: { value: new THREE.Color(0x4169e1) }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        uniform float intensity;
        uniform float speed;
        uniform vec3 baseColor;
        uniform vec3 secondColor;
        
        varying vec2 vUv;
        
        // Simple noise function
        float noise(vec2 p) {
          return sin(p.x * 10.0) * sin(p.y * 10.0) * 0.5 + 0.5;
        }
        
        // Fractal Brownian Motion
        float fbm(vec2 p) {
          float f = 0.0;
          float amp = 0.5;
          float freq = 4.0;
          
          for (int i = 0; i < 6; i++) {
            f += amp * noise(p * freq);
            amp *= 0.5;
            freq *= 2.0;
          }
          
          return f;
        }
        
        void main() {
          // Normalized coordinates
          vec2 uv = vUv;
          
          // Create time-varying wave pattern
          float t = time * speed;
          
          // Create multiple layers of moving noise
          float n1 = fbm(vec2(uv.x * 3.0, uv.y * 2.0 - t * 0.5));
          float n2 = fbm(vec2(uv.x * 2.0 + t * 0.2, uv.y * 3.0));
          float n3 = fbm(vec2(uv.x * 1.0 - t * 0.1, uv.y * 4.0 + t * 0.3));
          
          // Combine noise layers
          float finalNoise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
          
          // Vertical gradient for sky effect
          float gradient = pow(1.0 - uv.y, 2.0);
          
          // Shape the aurora
          float auroraShape = smoothstep(0.2, 0.7, finalNoise) * gradient * intensity;
          
          // Mix between two colors
          vec3 finalColor = mix(baseColor, secondColor, finalNoise);
          
          // Apply alpha for transparency based on shape
          gl_FragColor = vec4(finalColor * auroraShape, auroraShape * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    // Ice crystal shader for decorative elements
    const iceCrystalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0x88ccff) },
        opacity: { value: 0.7 },
        refractPower: { value: 0.3 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        uniform float refractPower;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          // Compute refraction-like effect
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - dot(normal, viewDir), 5.0);
          
          // Create time-varying shimmer
          float shimmer = sin(time * 3.0 + dot(normal, vec3(0.3, 0.5, 0.2)) * 20.0) * 0.05 + 0.95;
          
          // Refraction and reflection effect
          vec3 refraction = refract(viewDir, normal, 0.7);
          vec3 reflection = reflect(viewDir, normal);
          
          // Calculate internal crystal patterns
          float pattern = sin(reflection.x * 10.0 + time) * sin(reflection.y * 10.0) * 0.25 + 0.75;
          
          // Mix everything for the final color
          vec3 finalColor = color * (shimmer * pattern + fresnel * refractPower);
          
          // Increase brightness near edges with fresnel
          finalColor += fresnel * color * 0.5;
          
          gl_FragColor = vec4(finalColor, opacity + fresnel * 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    return {
      glow: glowMaterial,
      snow: snowMaterial,
      lightString: lightStringMaterial,
      particle: particleMaterial,
      aurora: auroraMaterial,
      iceCrystal: iceCrystalMaterial
    };
  }
  
  private initScene() {
    // Create sky with aurora borealis
    this.createSkyWithAurora();
    
    // Add ambient light
    this.addAmbientLight();
    
    // Add directional light (sun)
    this.addDirectionalLight();
    
    // Add ground with snow
    this.addGround();
    
    // Create snow particles
    this.addSnowParticles();
    
    // Add house and decorations
    this.createHouse();
    
    // Add trees and other yard elements
    this.createYardElements();
    
    // Add ice crystal decorations
    this.addIceCrystals();
  }
  
  private createSkyWithAurora() {
    // Create a dome for the sky
    const skyRadius = 200;
    const skyGeometry = new THREE.SphereGeometry(skyRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Create a gradient sky material
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x001133) },
        bottomColor: { value: new THREE.Color(0x0a1a3f) },
        offset: { value: 10 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        
        varying vec3 vWorldPosition;
        
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float t = max(0.0, h);
          t = pow(t, exponent);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    // Create sky dome
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.y = -5; // Position slightly below ground to ensure full coverage
    this.scene.add(sky);
    
    // Create stars in the sky
    this.addStars();
    
    // Create aurora borealis
    const auroraWidth = 100;
    const auroraHeight = 60;
    const auroraGeometry = new THREE.PlaneGeometry(auroraWidth, auroraHeight, 32, 32);
    const auroraMaterial = this.shaderMaterials.aurora.clone();
    
    // Create aurora mesh
    const aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
    aurora.position.set(0, 50, -80);
    aurora.rotation.x = Math.PI / 10; // Slight tilt
    this.scene.add(aurora);
    
    // Add to elements for updates
    this.elements.push({
      type: ElementType.STAR, // Reusing star type for aurora
      object: aurora,
      material: auroraMaterial,
      props: {
        position: { x: 0, y: 50, z: -80 },
        rotation: { x: Math.PI / 10, y: 0, z: 0 },
        scale: 1,
        color: '#00ff80',
        intensity: 1,
        reactsTo: {
          frequencyRange: [80, 110],
          instrument: 'flute'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Update aurora shader
        const material = aurora.material as THREE.ShaderMaterial;
        material.uniforms.time.value = time;
        
        // Aurora responds to high frequencies
        const highFreqEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 80, 110);
        
        // Update intensity based on high frequencies
        material.uniforms.intensity.value = 0.5 + highFreqEnergy * 1.5;
        
        // Change speed based on energy
        material.uniforms.speed.value = 0.2 + highFreqEnergy * 0.4;
        
        // Change colors based on dominant instrument
        if (this.dominantInstrument === 'flute' || this.dominantInstrument === 'synthesizer') {
          // Shift to blue-purple palette for flute or synth
          material.uniforms.baseColor.value = new THREE.Color(
            0.1 + 0.2 * Math.sin(time),
            0.3 + 0.3 * Math.cos(time * 0.7),
            0.7 + 0.3 * Math.sin(time * 0.5)
          );
          material.uniforms.secondColor.value = new THREE.Color(
            0.3 + 0.2 * Math.cos(time * 0.8),
            0.1 + 0.1 * Math.sin(time * 0.6),
            0.6 + 0.4 * Math.cos(time * 0.4)
          );
        } else if (this.dominantInstrument === 'violin' || this.dominantInstrument === 'piano') {
          // Shift to green-teal palette for violin or piano
          material.uniforms.baseColor.value = new THREE.Color(
            0.1 + 0.1 * Math.sin(time * 0.7),
            0.6 + 0.4 * Math.cos(time * 0.5),
            0.3 + 0.2 * Math.sin(time * 0.3)
          );
          material.uniforms.secondColor.value = new THREE.Color(
            0.1 + 0.1 * Math.cos(time * 0.6),
            0.4 + 0.2 * Math.sin(time * 0.4),
            0.7 + 0.3 * Math.cos(time * 0.3)
          );
        } else {
          // Default green-blue palette
          material.uniforms.baseColor.value = new THREE.Color(
            0.0 + 0.1 * Math.sin(time * 0.5),
            0.8 + 0.2 * Math.cos(time * 0.3),
            0.5 + 0.3 * Math.sin(time * 0.2)
          );
          material.uniforms.secondColor.value = new THREE.Color(
            0.2 + 0.1 * Math.cos(time * 0.4),
            0.2 + 0.1 * Math.sin(time * 0.3),
            0.8 + 0.2 * Math.cos(time * 0.2)
          );
        }
      }
    });
  }
  
  private addStars() {
    // Create stars in the sky as points
    const starCount = 1000;
    const starsGeometry = new THREE.BufferGeometry();
    
    // Create positions for stars
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      // Create stars in a half-sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const radius = 150 + Math.random() * 50;
      
      // Calculate position
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Random colors leaning towards blue-white
      colors[i * 3] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      
      // Random sizes
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create star material
    const starsMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
    
    // Add to elements for updates
    this.elements.push({
      type: ElementType.STAR,
      object: stars,
      props: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: 'white',
        intensity: 1,
        reactsTo: {
          frequencyRange: [100, 120],
          instrument: ''
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Make stars twinkle based on high frequencies
        const highFreqEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 100, 120);
        
        // Update star sizes for twinkling effect
        const sizes = stars.geometry.attributes.size;
        for (let i = 0; i < starCount; i++) {
          // Use noise based on position and time for natural twinkling
          const noiseTime = time * 2 + positions[i * 3] * 0.01 + positions[i * 3 + 1] * 0.02 + positions[i * 3 + 2] * 0.01;
          const twinkle = 0.5 + 0.5 * Math.sin(noiseTime);
          
          // Amplify twinkling based on audio energy
          sizes.array[i] = (Math.random() * 1.5 + 0.5) * (1 + twinkle * highFreqEnergy * 2);
        }
        sizes.needsUpdate = true;
        
        // Slowly rotate the stars
        stars.rotation.y = time * 0.02;
      }
    });
  }
  
  private addIceCrystals() {
    // Add decorative ice crystals using the ice crystal shader
    const crystalCount = 12;
    const crystalPositions = [];
    
    // Create positions for crystals, distributed around the scene
    for (let i = 0; i < crystalCount; i++) {
      const angle = (i / crystalCount) * Math.PI * 2;
      const radius = 20 + Math.random() * 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 1 + Math.random() * 3;
      
      crystalPositions.push({ x, y, z });
    }
    
    // Create crystals
    crystalPositions.forEach((pos, index) => {
      // Create crystal geometry
      const crystal = this.createIceCrystal(pos.x, pos.y, pos.z, 1 + Math.random() * 0.5);
      this.scene.add(crystal);
      
      // Get the material from the createIceCrystal method
      const crystalMaterial = this.shaderMaterials.iceCrystal.clone();
      
      // Add point light inside crystal
      const light = new THREE.PointLight(0x88CCFF, 0.8, 5);
      light.position.set(pos.x, pos.y, pos.z);
      this.scene.add(light);
      
      this.lights.push({
        type: LightType.POINT,
        light: light,
        update: (time: number, audioData: AudioAnalysisData) => {
          // Ice crystal lights respond to high frequencies
          const highFreqIndex = 70 + (index % 30);
          const energy = audioData.frequencyData[highFreqIndex] / 255;
          
          // Pulsing light based on frequency
          light.intensity = 0.5 + Math.sin(time * 3 + index) * 0.3 + energy * 1.5;
        }
      });
      
      // Add crystal to elements for updates
      this.elements.push({
        type: ElementType.STAR, // Reusing star type
        object: crystal,
        material: crystalMaterial,
        props: {
          position: { x: pos.x, y: pos.y, z: pos.z },
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
          color: '#88CCFF',
          intensity: 1,
          reactsTo: {
            frequencyRange: [70, 100],
            instrument: 'piano'
          }
        },
        update: (time: number, audioData: AudioAnalysisData) => {
          // Update crystal shader
          // For now, let's bypass this complex material handling since it's causing errors
          // Just perform the rotation updates which don't depend on the material
          
          // Crystal responds to mid-high frequencies
          const freqIndex = 70 + (index % 30);
          const energy = audioData.frequencyData[freqIndex] / 255;
          
          // Slow rotation
          crystal.rotation.y = time * 0.2 + index;
          crystal.rotation.x = Math.sin(time * 0.3 + index * 0.5) * 0.2;
        }
      });
    });
  }
  
  private createIceCrystal(x: number, y: number, z: number, scale: number = 1.0) {
    // Create a crystal group
    const crystalGroup = new THREE.Group();
    crystalGroup.position.set(x, y, z);
    crystalGroup.scale.set(scale, scale, scale);
    
    // Create a base crystal shape
    const mainCrystalGeometry = new THREE.ConeGeometry(0.5, 2, 6);
    const material = this.shaderMaterials.iceCrystal.clone();
    
    const mainCrystal = new THREE.Mesh(mainCrystalGeometry, material);
    mainCrystal.position.y = 0.5;
    crystalGroup.add(mainCrystal);
    
    // Add small crystal spikes around the main crystal
    const spikeCount = 6;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2;
      const spikeGeometry = new THREE.ConeGeometry(0.2, 1, 4);
      const spike = new THREE.Mesh(spikeGeometry, material);
      
      // Position and rotate the spike
      spike.position.set(
        Math.cos(angle) * 0.3,
        0.2,
        Math.sin(angle) * 0.3
      );
      spike.rotation.z = Math.PI / 4; // Tilt outward
      spike.rotation.y = angle; // Face outward
      
      crystalGroup.add(spike);
    }
    
    // Add top spike
    const topSpikeGeometry = new THREE.ConeGeometry(0.3, 1.5, 5);
    const topSpike = new THREE.Mesh(topSpikeGeometry, material);
    topSpike.position.y = 1.5;
    topSpike.rotation.x = Math.PI; // Point upward
    crystalGroup.add(topSpike);
    
    return crystalGroup;
  }
  
  private addAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);
    
    this.lights.push({
      type: LightType.AMBIENT,
      light: ambientLight,
      update: (time: number, audioData: AudioAnalysisData) => {
        // Subtle ambient light variation with low frequencies
        const bassEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 0, 10);
        ambientLight.intensity = 0.5 + bassEnergy * 0.3;
      }
    });
  }
  
  private addDirectionalLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    this.scene.add(directionalLight);
    
    // Add helper for debugging
    // const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
    // this.scene.add(helper);
    
    this.lights.push({
      type: LightType.DIRECTIONAL,
      light: directionalLight,
      // helper: helper,
      update: (time: number, audioData: AudioAnalysisData) => {
        // Subtle light movement
        directionalLight.position.x = 10 * Math.cos(time * 0.1);
        directionalLight.position.z = 10 * Math.sin(time * 0.1);
        
        // Update helper if it exists
        // if (helper) helper.update();
      }
    });
  }
  
  private addGround() {
    // Create a large ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    
    // Apply snow material
    const groundMaterial = this.shaderMaterials.snow.clone();
    groundMaterial.uniforms.noiseScale.value = 10.0;
    groundMaterial.uniforms.snowBrightness.value = 0.8;
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -0.1; // Slightly below zero
    ground.receiveShadow = true;
    
    this.scene.add(ground);
    
    this.elements.push({
      type: ElementType.GROUND,
      object: ground,
      material: groundMaterial,
      props: {
        position: { x: 0, y: -0.1, z: 0 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        scale: 1,
        color: 'white',
        intensity: 1,
        reactsTo: {
          frequencyRange: [0, 10]
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Update snow shader time
        const material = ground.material as THREE.ShaderMaterial;
        material.uniforms.time.value = time;
        
        // Make snow "sparkle" with high frequencies
        const highFreqEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 100, 120);
        material.uniforms.snowBrightness.value = 0.8 + highFreqEnergy * 0.4;
      }
    });
  }
  
  private addSnowParticles() {
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    
    // Create positions for particles across a wide area
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Position
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 20;
      const z = (Math.random() - 0.5) * 60;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Color - slight blue tint for snow
      colors[i * 3] = 0.9;
      colors[i * 3 + 1] = 0.95;
      colors[i * 3 + 2] = 1.0;
      
      // Size - varied for depth effect
      sizes[i] = Math.random() * 2 + 1;
      
      // Opacity - varied for depth effect
      opacities[i] = Math.random() * 0.5 + 0.5;
      
      // Rotation angle
      angles[i] = Math.random() * Math.PI * 2;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    particleGeometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
    
    // Use our particle shader
    const particleMaterial = this.shaderMaterials.particle.clone();
    
    this.snowParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.snowParticles);
    
    this.particleSystems.push(this.snowParticles);
  }
  
  private createHouse() {
    // We'll create a house at the center of the scene
    const houseGroup = new THREE.Group();
    houseGroup.position.set(0, 0, 0);
    this.scene.add(houseGroup);
    
    // House dimensions
    const houseWidth = 8;
    const houseDepth = 6;
    const houseHeight = 4;
    const roofHeight = 2;
    
    // Create a more detailed house structure
    
    // Foundation
    const foundationGeometry = new THREE.BoxGeometry(houseWidth + 0.5, 0.3, houseDepth + 0.5);
    const foundationMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777, // Concrete color
      roughness: 0.9,
      metalness: 0.1
    });
    
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.y = -0.15;
    foundation.receiveShadow = true;
    houseGroup.add(foundation);
    
    // Main house walls
    // We'll create detailed walls with wooden plank texture
    const wallTextureLoader = new THREE.TextureLoader();
    const woodTexture = wallTextureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjItMTItMjVUMTI6MzA6NDcrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIyLTEyLTI1VDEyOjM4OjI3KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIyLTEyLTI1VDEyOjM4OjI3KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjM4ZTg1ZmZjLTRj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');
    
    // Create bump texture for wood
    const woodBumpTexture = wallTextureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjItMTItMjVUMTI6MzA6NDcrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIyLTEyLTI1VDEyOjQzOjI5KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIyLTEyLTI1VDEyOjQzOjI5KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmQ5MGMwZDkzLTExNGYtNDYyNi05NDIzLWU1N2UyN2Y0YTliMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozOGU4NWZmYy00YzhmLTQ0ZTYtYWFiZS00ZTcyZmQzNGU2MWQiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozOGU4NWZmYy00YzhmLTQ0ZTYtYWFiZS00ZTcyZmQzNGU2MWQiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjM4ZTg1ZmZjLTRjOGYtNDRlNi1hYWJlLTRlNzJmZDM0ZTYxZCIgc3RFdnQ6d2hlbj0iMjAyMi0xMi0yNVQxMjozMDo0NyswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmQ5MGMwZDkzLTExNGYtNDYyNi05NDIzLWU1N2UyN2Y0YTliMSIgc3RFdnQ6d2hlbj0iMjAyMi0xMi0yNVQxMjo0MzoyOSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+tEGF4wAAB2NJREFUeJzdW91vG8cVxX933r3skhQl2dYHLauJGxupGzuyG7uJnALpSwH7JQhQoED72vQP6D/UP6APfWiBPKVAixQw0KLtY+GH2mmRuK4jB24rxVGsimIlf1DUx+5ML8v9JimKS7uJ5AMsyZ2dnTkz55wz904odRcD/SRJtgAA6iepXFPq1TDJxEsBr6Wfy/nGjbH4Zw9X/HdG+wBQXTv+ZUWJe6QFgw/HTz+B1uBf50y8eP5yDCyDKxLgMPj3o9bpjXodqt+A3wDwVGv77eTg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');
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      map: woodTexture,
      bumpMap: woodBumpTexture,
      bumpScale: 0.1,
      color: 0x8B4513, // Brown
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Create walls with woodgrain texture
    const wallThickness = 0.2;
    
    // Front wall with door and windows cutout
    const frontWallGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, wallThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, houseHeight/2, houseDepth/2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    houseGroup.add(frontWall);
    
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, wallThickness);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, houseHeight/2, -houseDepth/2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    houseGroup.add(backWall);
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, houseHeight, houseDepth);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-houseWidth/2, houseHeight/2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    houseGroup.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(wallThickness, houseHeight, houseDepth);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(houseWidth/2, houseHeight/2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    houseGroup.add(rightWall);
    
    // Floor
    const floorTextureLoader = new THREE.TextureLoader();
    const floorTexture = floorTextureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEsWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS42LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjY0IgogICBleGlmOlBpeGVsWURpbWVuc2lvbj0iNjQiCiAgIGV4aWY6Q29sb3JTcGFjZT0iMSIKICAgdGlmZjpJbWFnZVdpZHRoPSI2NCIKICAgdGlmZjpJbWFnZUxlbmd0aD0iNjQiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjcyLjAiCiAgIHRpZmY6WVJlc29sdXRpb249IjcyLjAiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIKICAgeG1w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');
    
    // Create bump texture for floor
    const floorBumpTexture = floorTextureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEsWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS42LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjY0IgogICBleGlmOlBpeGVsWURpbWVuc2lvbj0iNjQiCiAgIGV4aWY6Q29sb3JTcGFjZT0iMSIKICAgdGlmZjpJbWFnZVdpZHRoPSI2NCIKICAgdGlmZjpJbWFnZUxlbmd0aD0iNjQiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjcyLjAiCiAgIHRpZmY6WVJlc29sdXRpb249IjcyLjAiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIKICAgeG1w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');
    
    // Create floor with wooden planks texture
    const floorGeometry = new THREE.BoxGeometry(houseWidth - 0.4, 0.1, houseDepth - 0.4);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      bumpMap: floorBumpTexture,
      bumpScale: 0.1,
      color: 0xA0522D, // Brown
      roughness: 0.8,
      metalness: 0.2
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0.05;
    floor.receiveShadow = true;
    houseGroup.add(floor);
    
    // Create detailed roof with individual planks
    this.createRoof(houseGroup, houseWidth, houseDepth, houseHeight, roofHeight);
    
    // Create the roof
    this.createRoof(houseGroup, houseWidth, houseDepth, houseHeight, roofHeight);
    
    // Add windows
    this.createWindows(houseGroup, houseWidth, houseDepth, houseHeight);
    
    // Add door
    this.createDoor(houseGroup, houseWidth, houseDepth, houseHeight);
    
    // Add chimney
    this.createChimney(houseGroup, houseWidth, houseDepth, houseHeight, roofHeight);
    
    // Add roof lights
    this.createRoofLights(houseGroup, houseWidth, houseDepth, houseHeight, roofHeight);
    
    this.elements.push({
      type: ElementType.HOUSE,
      object: houseGroup,
      props: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: '#8B4513',
        intensity: 1,
        reactsTo: {
          frequencyRange: [0, 10],
          instrument: 'bass'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Subtle house movement on heavy bass
        const bassEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 0, 5);
        const shakeAmount = bassEnergy * 0.05;
        
        houseGroup.position.y = Math.sin(time * 10) * shakeAmount;
      }
    });
  }
  
  private createRoof(houseGroup: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number, roofHeight: number) {
    // Create triangular roof faces
    const roofGeometry = new THREE.ConeGeometry(
      Math.sqrt(houseWidth * houseWidth + houseDepth * houseDepth) / 2, 
      roofHeight, 
      4
    );
    
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x703030, // Dark red
      roughness: 0.9,
      metalness: 0.1
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = houseHeight + roofHeight / 2;
    roof.rotation.y = Math.PI / 4; // Align corners with house corners
    roof.castShadow = true;
    
    houseGroup.add(roof);
    
    this.elements.push({
      type: ElementType.ROOF,
      object: roof,
      material: roofMaterial,
      props: {
        position: { x: 0, y: houseHeight + roofHeight / 2, z: 0 },
        rotation: { x: 0, y: Math.PI / 4, z: 0 },
        scale: 1,
        color: '#703030',
        intensity: 1,
        reactsTo: {
          frequencyRange: [20, 40],
          instrument: 'guitar'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Update based on mid-range frequencies
        const midFreqEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 20, 40);
        
        if (midFreqEnergy > 0.7) {
          const material = roof.material as THREE.MeshStandardMaterial;
          material.color.setHSL(
            (Math.sin(time * 5) * 0.05 + 0.05) % 1, // Subtle hue shift
            0.8,
            0.4 + midFreqEnergy * 0.2 // Brightness changes with energy
          );
        }
      }
    });
  }
  
  private createWindows(houseGroup: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number) {
    // Front windows
    const createWindow = (x: number, z: number, isLit: boolean = true) => {
      const windowGroup = new THREE.Group();
      
      // Window frame
      const frameGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.2);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x352718, // Dark brown
        roughness: 0.8,
        metalness: 0.2
      });
      
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.castShadow = true;
      windowGroup.add(frame);
      
      // Window panes (2x2 grid)
      const paneSize = 0.5;
      const paneGeometry = new THREE.BoxGeometry(paneSize, paneSize, 0.05);
      
      // Create glowing material for lit windows
      const paneMaterial = isLit
        ? this.shaderMaterials.glow.clone()
        : new THREE.MeshStandardMaterial({
            color: 0x88CCFF, // Light blue for unlit windows
            roughness: 0.3,
            metalness: 0.7
          });
      
      if (isLit) {
        (paneMaterial as THREE.ShaderMaterial).uniforms.glowColor.value = new THREE.Color(0xFFCC88); // Warm glow
        (paneMaterial as THREE.ShaderMaterial).uniforms.intensity.value = 1.0;
      }
      
      // Create 2x2 grid of panes
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const pane = new THREE.Mesh(paneGeometry, paneMaterial.clone());
          pane.position.x = (i - 0.5) * (paneSize + 0.05);
          pane.position.y = (j - 0.5) * (paneSize + 0.05);
          pane.position.z = 0.05;
          windowGroup.add(pane);
          
          // Add light behind window if lit
          if (isLit) {
            const light = new THREE.PointLight(0xFFCC88, 0.5, 5);
            light.position.z = -0.5;
            pane.add(light);
            
            // Add this light to our lights array for updates
            this.lights.push({
              type: LightType.POINT,
              light: light,
              update: (time: number, audioData: AudioAnalysisData) => {
                // Make light flicker based on mid-high frequencies and time
                const freqRange = [40, 60];
                const energy = this.getFrequencyRangeEnergy(audioData.frequencyData, freqRange[0], freqRange[1]);
                const flickerAmount = 0.3 + Math.random() * 0.1;
                
                light.intensity = 0.5 + Math.sin(time * 10 + i * 2 + j * 3) * flickerAmount * energy;
                
                // Update window pane glow
                const material = pane.material as THREE.ShaderMaterial;
                if (material.uniforms && material.uniforms.intensity) {
                  material.uniforms.intensity.value = 0.8 + Math.sin(time * 10 + i * 2 + j * 3) * flickerAmount * energy;
                }
              }
            });
          }
        }
      }
      
      // Position the window on the house
      windowGroup.position.set(x, houseHeight / 2, z);
      houseGroup.add(windowGroup);
      
      return windowGroup;
    };
    
    // Front windows
    const frontWindowLeft = createWindow(-houseWidth / 4, houseDepth / 2 + 0.01);
    const frontWindowRight = createWindow(houseWidth / 4, houseDepth / 2 + 0.01);
    
    // Side windows
    const leftWindowFront = createWindow(-houseWidth / 2 - 0.01, houseDepth / 4, false);
    const leftWindowBack = createWindow(-houseWidth / 2 - 0.01, -houseDepth / 4, true);
    leftWindowFront.rotation.y = Math.PI / 2;
    leftWindowBack.rotation.y = Math.PI / 2;
    
    const rightWindowFront = createWindow(houseWidth / 2 + 0.01, houseDepth / 4, true);
    const rightWindowBack = createWindow(houseWidth / 2 + 0.01, -houseDepth / 4, false);
    rightWindowFront.rotation.y = -Math.PI / 2;
    rightWindowBack.rotation.y = -Math.PI / 2;
    
    // Back windows
    const backWindowLeft = createWindow(-houseWidth / 4, -houseDepth / 2 - 0.01, false);
    const backWindowRight = createWindow(houseWidth / 4, -houseDepth / 2 - 0.01, true);
    backWindowLeft.rotation.y = Math.PI;
    backWindowRight.rotation.y = Math.PI;
    
    // Store front windows in elements for updates
    [frontWindowLeft, frontWindowRight].forEach((window, index) => {
      this.elements.push({
        type: ElementType.WINDOW,
        object: window,
        props: {
          position: { 
            x: index === 0 ? -houseWidth / 4 : houseWidth / 4, 
            y: houseHeight / 2, 
            z: houseDepth / 2 + 0.01 
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
          color: '#FFCC88',
          intensity: 1,
          reactsTo: {
            frequencyRange: [40, 60],
            instrument: 'piano'
          }
        },
        update: (time: number, audioData: AudioAnalysisData) => {
          // Windows are updated via their lights
        }
      });
    });
  }
  
  private createDoor(houseGroup: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number) {
    const doorGroup = new THREE.Group();
    
    // Door frame
    const frameGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.3);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x352718, // Dark brown
      roughness: 0.9,
      metalness: 0.1
    });
    
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    doorGroup.add(frame);
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(1.3, 2.3, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x702010, // Dark red
      roughness: 0.8,
      metalness: 0.2
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.z = 0.1;
    doorGroup.add(door);
    
    // Door knob
    const knobGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const knobMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4AF37, // Gold
      roughness: 0.2,
      metalness: 0.8
    });
    
    const knob = new THREE.Mesh(knobGeometry, knobMaterial);
    knob.position.set(0.4, 0, 0.15);
    doorGroup.add(knob);
    
    // Position the door on the house
    doorGroup.position.set(0, houseHeight / 2 - 0.75, houseDepth / 2 + 0.01);
    doorGroup.castShadow = true;
    houseGroup.add(doorGroup);
    
    // Add door light
    const doorLight = new THREE.PointLight(0xFF9966, 0.7, 10);
    doorLight.position.set(0, 1.5, 0.5);
    doorGroup.add(doorLight);
    
    this.lights.push({
      type: LightType.POINT,
      light: doorLight,
      update: (time: number, audioData: AudioAnalysisData) => {
        // Door light responds to bass
        const bassEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 0, 10);
        doorLight.intensity = 0.7 + bassEnergy * 0.5;
      }
    });
    
    this.elements.push({
      type: ElementType.DOOR,
      object: doorGroup,
      material: doorMaterial,
      props: {
        position: { x: 0, y: houseHeight / 2 - 0.75, z: houseDepth / 2 + 0.01 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: '#702010',
        intensity: 1,
        reactsTo: {
          frequencyRange: [0, 10],
          instrument: 'bass'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Door responds to bass hits
        const bassEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 0, 10);
        
        if (bassEnergy > 0.8 && Math.random() > 0.95) {
          // Animate door opening slightly
          door.rotation.y = Math.sin(time * 5) * 0.1;
        } else {
          // Return to closed position
          door.rotation.y *= 0.9;
        }
      }
    });
  }
  
  private createChimney(houseGroup: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number, roofHeight: number) {
    const chimneyGroup = new THREE.Group();
    
    // Chimney body
    const chimneyGeometry = new THREE.BoxGeometry(1, 2, 1);
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x802010, // Brick red
      roughness: 0.9,
      metalness: 0.1
    });
    
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.castShadow = true;
    chimneyGroup.add(chimney);
    
    // Chimney top
    const topGeometry = new THREE.BoxGeometry(1.2, 0.3, 1.2);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060, // Dark gray
      roughness: 0.7,
      metalness: 0.3
    });
    
    const chimneyTop = new THREE.Mesh(topGeometry, topMaterial);
    chimneyTop.position.y = 1.15;
    chimneyTop.castShadow = true;
    chimneyGroup.add(chimneyTop);
    
    // Position the chimney
    chimneyGroup.position.set(
      houseWidth / 3, 
      houseHeight + roofHeight / 2 + 0.5, 
      houseDepth / 4
    );
    
    houseGroup.add(chimneyGroup);
    
    // Add smoke particles
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Initial position just above chimney
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 1.5;
      positions[i * 3 + 2] = 0;
      
      // Gray smoke
      colors[i * 3] = 0.7;
      colors[i * 3 + 1] = 0.7;
      colors[i * 3 + 2] = 0.7;
      
      // Random size
      sizes[i] = Math.random() * 0.5 + 0.3;
      
      // Low opacity
      opacities[i] = Math.random() * 0.3 + 0.1;
      
      // Random angle
      angles[i] = Math.random() * Math.PI * 2;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    particleGeometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
    
    // Use our particle shader
    const smokeMaterial = this.shaderMaterials.particle.clone();
    
    const smokeParticles = new THREE.Points(particleGeometry, smokeMaterial);
    chimneyGroup.add(smokeParticles);
    
    // Add point light inside chimney
    const chimneyLight = new THREE.PointLight(0xFF6600, 0.5, 5);
    chimneyLight.position.set(0, 0.5, 0);
    chimneyGroup.add(chimneyLight);
    
    this.lights.push({
      type: LightType.POINT,
      light: chimneyLight,
      update: (time: number, audioData: AudioAnalysisData) => {
        // Chimney light flickers with drums
        const drumEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 5, 15);
        chimneyLight.intensity = 0.5 + Math.random() * 0.2 * drumEnergy;
      }
    });
    
    this.elements.push({
      type: ElementType.CHIMNEY,
      object: chimneyGroup,
      material: chimneyMaterial,
      props: {
        position: { 
          x: houseWidth / 3, 
          y: houseHeight + roofHeight / 2 + 0.5, 
          z: houseDepth / 4 
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: '#802010',
        intensity: 1,
        reactsTo: {
          frequencyRange: [5, 15],
          instrument: 'drums'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Update smoke particles
        const positions = smokeParticles.geometry.attributes.position;
        const opacities = smokeParticles.geometry.attributes.opacity;
        const sizes = smokeParticles.geometry.attributes.size;
        
        // Chimney activity based on drum hits
        const drumEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 5, 15);
        const emitRate = 0.1 + drumEnergy * 0.3;
        
        for (let i = 0; i < particleCount; i++) {
          // Move particles upward
          positions.array[i * 3 + 1] += 0.02 + Math.random() * 0.01;
          
          // Random horizontal drift
          positions.array[i * 3] += (Math.random() - 0.5) * 0.02;
          positions.array[i * 3 + 2] += (Math.random() - 0.5) * 0.02;
          
          // Increase size as they rise
          sizes.array[i] += 0.01;
          
          // Decrease opacity with age
          opacities.array[i] -= 0.005;
          
          // Reset particles that are too high or transparent
          if (positions.array[i * 3 + 1] > 5 || opacities.array[i] <= 0) {
            // Reset position to just above chimney
            positions.array[i * 3] = 0;
            positions.array[i * 3 + 1] = 1.5;
            positions.array[i * 3 + 2] = 0;
            
            // Reset properties
            sizes.array[i] = Math.random() * 0.5 + 0.3;
            
            // Only emit particles based on energy
            opacities.array[i] = Math.random() < emitRate ? (Math.random() * 0.3 + 0.1) : 0;
          }
        }
        
        positions.needsUpdate = true;
        opacities.needsUpdate = true;
        sizes.needsUpdate = true;
      }
    });
  }
  
  private createRoofLights(houseGroup: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number, roofHeight: number) {
    // Create light strings along roof edges
    const lightCount = 40; // Number of lights per edge
    const stringGroup = new THREE.Group();
    
    // Create positions for particles along roof edges
    const edgeLightCount = lightCount * 4; // 4 edges
    const particleGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(edgeLightCount * 3);
    const colors = new Float32Array(edgeLightCount * 3);
    const sizes = new Float32Array(edgeLightCount);
    const intensities = new Float32Array(edgeLightCount);
    
    // Helper function to get color from our instrument color mapping
    const getColorFromHue = (hue: number) => {
      const color = new THREE.Color();
      color.setHSL(hue / 360, 1.0, 0.5);
      return color;
    };
    
    // Place lights along each roof edge
    for (let edge = 0; edge < 4; edge++) {
      const startAngle = edge * Math.PI / 2 + Math.PI / 4;
      const endAngle = startAngle + Math.PI / 2;
      
      for (let i = 0; i < lightCount; i++) {
        const index = edge * lightCount + i;
        const t = i / (lightCount - 1);
        const angle = startAngle + t * (endAngle - startAngle);
        
        // Calculate position along roof edge
        const x = Math.cos(angle) * (houseWidth / 2 + 0.1);
        const z = Math.sin(angle) * (houseDepth / 2 + 0.1);
        const y = houseHeight + 0.1;
        
        positions[index * 3] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;
        
        // Assign colors in patterns along the edge
        const colorIndex = Math.floor(i / 3) % 6; // Groups of 3 lights share color, 6 colors total
        const baseHue = (60 * colorIndex) % 360; // Space colors evenly
        const color = getColorFromHue(baseHue);
        
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
        
        // Light size
        sizes[index] = 0.15;
        
        // Initial intensity
        intensities[index] = 1.0;
        
        // Create point light at each 5th position for actual illumination
        if (i % 5 === 0) {
          const light = new THREE.PointLight(color.getHex(), 0.3, 3);
          light.position.set(x, y, z);
          stringGroup.add(light);
          
          this.lights.push({
            type: LightType.POINT,
            light: light,
            update: (time: number, audioData: AudioAnalysisData) => {
              // Make lights respond to frequencies based on their position
              const freqIndex = Math.floor(30 + (index / edgeLightCount) * 80);
              const energy = audioData.frequencyData[freqIndex] / 255;
              
              // Pulsing pattern based on position and time
              const pulse = 0.5 + Math.sin(time * 5 + index * 0.2) * 0.5;
              light.intensity = 0.3 + pulse * energy * 0.5;
            }
          });
        }
      }
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('intensity', new THREE.BufferAttribute(intensities, 1));
    
    // Use our light string shader
    const lightsMaterial = this.shaderMaterials.lightString.clone();
    
    const lightPoints = new THREE.Points(particleGeometry, lightsMaterial);
    stringGroup.add(lightPoints);
    houseGroup.add(stringGroup);
    
    this.elements.push({
      type: ElementType.LIGHT_STRING,
      object: stringGroup,
      material: lightsMaterial,
      props: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: 'multicolor',
        intensity: 1,
        reactsTo: {
          frequencyRange: [30, 50],
          instrument: 'synthesizer'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Update light string shader
        const material = lightPoints.material as THREE.ShaderMaterial;
        material.uniforms.time.value = time;
        
        // Update based on mid-range frequencies
        const midFreqEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 30, 50);
        
        // Set pulse amount based on energy
        material.uniforms.pulseAmount.value = 0.3 + midFreqEnergy * 0.4;
        
        // Adjust pulse frequency based on beat detection
        if (audioData.peaks.length > 0) {
          material.uniforms.pulseFrequency.value = 5.0;
        } else {
          material.uniforms.pulseFrequency.value = 2.0;
        }
        
        // Update individual light intensities
        const intensities = lightPoints.geometry.attributes.intensity;
        
        for (let i = 0; i < edgeLightCount; i++) {
          // Get frequency bin corresponding to this light's position
          const freqIndex = Math.floor(30 + (i / edgeLightCount) * 80);
          const energy = audioData.frequencyData[freqIndex] / 255;
          
          // Chase pattern along each edge
          const edgeIndex = Math.floor(i / lightCount); // Which edge
          const lightIndexInEdge = i % lightCount; // Position along edge
          
          // Different patterns based on edge
          switch (edgeIndex) {
            case 0: // Front edge - chase pattern
              intensities.array[i] = (lightIndexInEdge / lightCount + time) % 1 > 0.5 ? 1.0 : 0.3;
              break;
            case 1: // Right edge - twinkle pattern
              intensities.array[i] = 0.3 + Math.sin(time * 5 + i * 0.7) * 0.7;
              break;
            case 2: // Back edge - alternate pattern
              intensities.array[i] = i % 2 === (Math.floor(time * 2) % 2) ? 1.0 : 0.3;
              break;
            case 3: // Left edge - random pattern
              intensities.array[i] = Math.random() > 0.2 ? 1.0 : 0.3;
              break;
          }
          
          // Boost intensity based on frequency energy
          intensities.array[i] *= (0.5 + energy * 0.5);
        }
        
        intensities.needsUpdate = true;
      }
    });
  }
  
  private createYardElements() {
    // Add trees
    this.createTrees();
    
    // Add snowman
    this.createSnowman();
    
    // Add gift boxes
    this.createGifts();
    
    // Add star
    this.createStar();
  }
  
  private createTrees() {
    // Create multiple trees around the scene
    const treePositions = [
      { x: -12, z: 8 },
      { x: -10, z: -10 },
      { x: 8, z: 12 },
      { x: 15, z: -5 },
      { x: -5, z: 15 },
      { x: 12, z: -12 }
    ];
    
    treePositions.forEach((pos, index) => {
      // Randomize tree size slightly
      const scale = 0.8 + Math.random() * 0.5;
      
      // Create tree
      const tree = this.createTree(pos.x, pos.z, scale);
      this.scene.add(tree.group);
      
      // Add to elements
      this.elements.push({
        type: ElementType.TREE,
        object: tree.group,
        props: {
          position: { x: pos.x, y: 0, z: pos.z },
          rotation: { x: 0, y: 0, z: 0 },
          scale: scale,
          color: '#005500',
          intensity: 1,
          reactsTo: {
            frequencyRange: [50 + index * 5, 70 + index * 5],
            instrument: index % 2 === 0 ? 'flute' : 'violin'
          }
        },
        update: (time: number, audioData: AudioAnalysisData) => {
          // Update tree lights
          tree.update(time, audioData);
        }
      });
    });
  }
  
  private createTree(x: number, z: number, scale: number = 1) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);
    treeGroup.scale.set(scale, scale, scale);
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x7D5A4F, // Brown
      roughness: 0.9,
      metalness: 0.1
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Tree layers (cones)
    const layerCount = 4;
    const cones: THREE.Mesh[] = [];
    
    for (let i = 0; i < layerCount; i++) {
      const height = 1.5 - i * 0.2;
      const radius = 1.8 - i * 0.3;
      const posY = 2 + i * 1.0;
      
      const coneGeometry = new THREE.ConeGeometry(radius, height, 8);
      const coneMaterial = new THREE.MeshStandardMaterial({
        color: 0x005500, // Dark green
        roughness: 0.8,
        metalness: 0.1
      });
      
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.y = posY;
      cone.castShadow = true;
      cones.push(cone);
      treeGroup.add(cone);
    }
    
    // Add lights to the tree
    const lightCount = 40;
    const lightPositions: THREE.Vector3[] = [];
    const lightColors: THREE.Color[] = [];
    const lightObjects: THREE.PointLight[] = [];
    
    // Generate random positions on the tree for lights
    for (let i = 0; i < lightCount; i++) {
      // Random angle around the tree
      const angle = Math.random() * Math.PI * 2;
      
      // Random height between trunk top and tree top
      const height = 2 + Math.random() * 3;
      
      // Radius decreases with height
      const radiusFactor = (5 - height) / 3; // 1 at bottom, 0 at top
      const radius = 0.2 + radiusFactor * 1.3;
      
      // Calculate position
      const x = Math.cos(angle) * radius;
      const y = height;
      const z = Math.sin(angle) * radius;
      
      lightPositions.push(new THREE.Vector3(x, y, z));
      
      // Assign a color
      const colorIndex = i % 5; // 5 different colors
      let color: THREE.Color;
      
      switch (colorIndex) {
        case 0: color = new THREE.Color(0xFF0000); break; // Red
        case 1: color = new THREE.Color(0x00FF00); break; // Green
        case 2: color = new THREE.Color(0x0000FF); break; // Blue
        case 3: color = new THREE.Color(0xFFFF00); break; // Yellow
        case 4: color = new THREE.Color(0xFF00FF); break; // Purple
        default: color = new THREE.Color(0xFFFFFF); // White
      }
      
      lightColors.push(color);
      
      // Add actual light every few positions to keep performance reasonable
      if (i % 5 === 0) {
        const light = new THREE.PointLight(color.getHex(), 0.5, 2);
        light.position.set(x, y, z);
        treeGroup.add(light);
        lightObjects.push(light);
        
        this.lights.push({
          type: LightType.POINT,
          light: light,
          update: () => {
            // Lights will be updated in the tree update function
          }
        });
      }
    }
    
    // Create light particles
    const particleGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(lightCount * 3);
    const colors = new Float32Array(lightCount * 3);
    const sizes = new Float32Array(lightCount);
    const intensities = new Float32Array(lightCount);
    
    for (let i = 0; i < lightCount; i++) {
      // Position
      positions[i * 3] = lightPositions[i].x;
      positions[i * 3 + 1] = lightPositions[i].y;
      positions[i * 3 + 2] = lightPositions[i].z;
      
      // Color
      colors[i * 3] = lightColors[i].r;
      colors[i * 3 + 1] = lightColors[i].g;
      colors[i * 3 + 2] = lightColors[i].b;
      
      // Size
      sizes[i] = 0.15;
      
      // Intensity
      intensities[i] = 1.0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('intensity', new THREE.BufferAttribute(intensities, 1));
    
    // Use our light string shader
    const lightsMaterial = this.shaderMaterials.lightString.clone();
    
    const lightPoints = new THREE.Points(particleGeometry, lightsMaterial);
    treeGroup.add(lightPoints);
    
    // Function to update tree lights
    const updateTree = (time: number, audioData: AudioAnalysisData) => {
      // Update light shader
      const material = lightPoints.material as THREE.ShaderMaterial;
      material.uniforms.time.value = time;
      
      // Get energy based on frequency range (different for each tree)
      const freqStart = 50 + Math.floor(x * 2) % 20;
      const freqEnd = 70 + Math.floor(z * 2) % 20;
      const energy = this.getFrequencyRangeEnergy(audioData.frequencyData, freqStart, freqEnd);
      
      // Update individual light intensities
      const intensities = lightPoints.geometry.attributes.intensity;
      
      for (let i = 0; i < lightCount; i++) {
        // Create twinkle pattern
        const twinkle = Math.sin(time * 3 + i * 0.7) * 0.5 + 0.5;
        
        // More energetic twinkling with higher frequencies
        intensities.array[i] = 0.3 + twinkle * energy * 0.7;
        
        // Update actual lights
        if (i % 5 === 0) {
          const lightIndex = Math.floor(i / 5);
          if (lightIndex < lightObjects.length) {
            lightObjects[lightIndex].intensity = 0.2 + intensities.array[i] * 0.8;
          }
        }
      }
      
      intensities.needsUpdate = true;
      
      // Update tree colors - add subtle tint with low frequencies
      const bassEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 0, 10);
      
      if (bassEnergy > 0.7) {
        cones.forEach((cone, index) => {
          const material = cone.material as THREE.MeshStandardMaterial;
          
          // Add subtle color changes
          const hue = (time * 20 + index * 30) % 360 / 360;
          const saturation = 0.7;
          const lightness = 0.2 + bassEnergy * 0.1;
          
          material.color.setHSL(hue, saturation, lightness);
        });
      } else {
        // Return to natural green
        cones.forEach(cone => {
          const material = cone.material as THREE.MeshStandardMaterial;
          material.color.setHSL(0.33, 0.8, 0.2);
        });
      }
    };
    
    return { group: treeGroup, update: updateTree };
  }
  
  private createSnowman() {
    const snowmanGroup = new THREE.Group();
    snowmanGroup.position.set(-8, 0, 0);
    
    // Snowman body - three spheres
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, // White
      roughness: 0.2,
      metalness: 0.1
    });
    
    // Bottom sphere
    const bottomGeometry = new THREE.SphereGeometry(1.2, 24, 24);
    const bottomSphere = new THREE.Mesh(bottomGeometry, bodyMaterial);
    bottomSphere.position.y = 1.2;
    bottomSphere.castShadow = true;
    bottomSphere.receiveShadow = true;
    snowmanGroup.add(bottomSphere);
    
    // Middle sphere
    const middleGeometry = new THREE.SphereGeometry(0.9, 24, 24);
    const middleSphere = new THREE.Mesh(middleGeometry, bodyMaterial);
    middleSphere.position.y = 2.8;
    middleSphere.castShadow = true;
    snowmanGroup.add(middleSphere);
    
    // Top sphere (head)
    const headGeometry = new THREE.SphereGeometry(0.6, 24, 24);
    const headSphere = new THREE.Mesh(headGeometry, bodyMaterial);
    headSphere.position.y = 4.0;
    headSphere.castShadow = true;
    snowmanGroup.add(headSphere);
    
    // Eyes
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000, // Black
      roughness: 0.5,
      metalness: 0.2
    });
    
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 4.1, 0.5);
    snowmanGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 4.1, 0.5);
    snowmanGroup.add(rightEye);
    
    // Carrot nose
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600, // Orange
      roughness: 0.8,
      metalness: 0.2
    });
    
    const noseGeometry = new THREE.ConeGeometry(0.1, 0.5, 16);
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 4.0, 0.6);
    nose.rotation.x = -Math.PI / 2;
    snowmanGroup.add(nose);
    
    // Buttons
    const buttonGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const buttonMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222, // Dark gray
      roughness: 0.5,
      metalness: 0.3
    });
    
    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button.position.set(0, 3.0 - i * 0.3, 0.9);
      snowmanGroup.add(button);
    }
    
    // Hat
    const hatBottomGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 32);
    const hatTopGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 32);
    const hatMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222, // Black
      roughness: 0.9,
      metalness: 0.1
    });
    
    const hatBottom = new THREE.Mesh(hatBottomGeometry, hatMaterial);
    hatBottom.position.y = 4.5;
    snowmanGroup.add(hatBottom);
    
    const hatTop = new THREE.Mesh(hatTopGeometry, hatMaterial);
    hatTop.position.y = 4.8;
    snowmanGroup.add(hatTop);
    
    // Hat band
    const hatBandGeometry = new THREE.CylinderGeometry(0.51, 0.51, 0.12, 32);
    const hatBandMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Red
      roughness: 0.7,
      metalness: 0.3
    });
    
    const hatBand = new THREE.Mesh(hatBandGeometry, hatBandMaterial);
    hatBand.position.y = 4.65;
    snowmanGroup.add(hatBand);
    
    // Arms
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 1.0,
      metalness: 0.0
    });
    
    // Left arm
    const leftArmGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
    leftArm.position.set(-1.0, 3.0, 0);
    leftArm.rotation.z = Math.PI / 4;
    snowmanGroup.add(leftArm);
    
    // Right arm
    const rightArmGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    const rightArm = new THREE.Mesh(rightArmGeometry, armMaterial);
    rightArm.position.set(1.0, 3.0, 0);
    rightArm.rotation.z = -Math.PI / 4;
    snowmanGroup.add(rightArm);
    
    // Add a soft point light
    const snowmanLight = new THREE.PointLight(0x8888FF, 0.5, 10);
    snowmanLight.position.set(0, 3, 1);
    snowmanGroup.add(snowmanLight);
    
    this.scene.add(snowmanGroup);
    
    this.lights.push({
      type: LightType.POINT,
      light: snowmanLight,
      update: (time: number, audioData: AudioAnalysisData) => {
        // Light responds to voice frequencies
        const voiceEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 70, 90);
        snowmanLight.intensity = 0.5 + voiceEnergy * 0.5;
      }
    });
    
    this.elements.push({
      type: ElementType.SNOWMAN,
      object: snowmanGroup,
      props: {
        position: { x: -8, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: 'white',
        intensity: 1,
        reactsTo: {
          frequencyRange: [70, 90],
          instrument: 'voice'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Snowman responds to voice frequencies
        const voiceEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 70, 90);
        
        // Make the arms wave with the music
        leftArm.rotation.z = Math.PI / 4 + Math.sin(time * 3) * voiceEnergy * 0.3;
        rightArm.rotation.z = -Math.PI / 4 - Math.sin(time * 3 + 1) * voiceEnergy * 0.3;
        
        // Make the head bob slightly
        headSphere.position.y = 4.0 + Math.sin(time * 2) * voiceEnergy * 0.1;
        
        // Make the hat move with the head
        hatBottom.position.y = 4.5 + Math.sin(time * 2) * voiceEnergy * 0.1;
        hatTop.position.y = 4.8 + Math.sin(time * 2) * voiceEnergy * 0.1;
        hatBand.position.y = 4.65 + Math.sin(time * 2) * voiceEnergy * 0.1;
        
        // Make the eyes blink occasionally
        if (Math.random() < 0.01) {
          leftEye.scale.y = 0.1;
          rightEye.scale.y = 0.1;
          
          // Reset after a short time
          setTimeout(() => {
            if (leftEye && rightEye) {
              leftEye.scale.y = 1;
              rightEye.scale.y = 1;
            }
          }, 200);
        }
      }
    });
  }
  
  private createGifts() {
    // Create gift boxes at different positions
    const giftPositions = [
      { x: 7, y: 0, z: 0, scale: 1.2, color: 0xFF0000 },
      { x: 6, y: 0, z: 1.5, scale: 0.8, color: 0x00FF00 },
      { x: 8, y: 0, z: 1, scale: 1.0, color: 0x0000FF },
      { x: 6.5, y: 0, z: -1, scale: 0.7, color: 0xFFFF00 }
    ];
    
    giftPositions.forEach((gift, index) => {
      const giftGroup = new THREE.Group();
      giftGroup.position.set(gift.x, gift.y, gift.z);
      giftGroup.scale.set(gift.scale, gift.scale, gift.scale);
      
      // Create gift box
      const boxGeometry = new THREE.BoxGeometry(1, 0.8, 1);
      const boxMaterial = new THREE.MeshStandardMaterial({
        color: gift.color,
        roughness: 0.7,
        metalness: 0.3
      });
      
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.y = 0.4; // Half height
      box.castShadow = true;
      box.receiveShadow = true;
      giftGroup.add(box);
      
      // Create gift lid
      const lidGeometry = new THREE.BoxGeometry(1.1, 0.2, 1.1);
      const lidMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.5,
        metalness: 0.2
      });
      
      const lid = new THREE.Mesh(lidGeometry, lidMaterial);
      lid.position.y = 0.9; // Position on top of box
      lid.castShadow = true;
      giftGroup.add(lid);
      
      // Create ribbon
      const ribbonMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.6,
        metalness: 0.3
      });
      
      // Vertical ribbon
      const verticalRibbonGeometry = new THREE.BoxGeometry(0.1, 0.82, 0.1);
      const verticalRibbon = new THREE.Mesh(verticalRibbonGeometry, ribbonMaterial);
      verticalRibbon.position.y = 0.41;
      giftGroup.add(verticalRibbon);
      
      // Horizontal ribbon
      const horizontalRibbonGeometry = new THREE.BoxGeometry(1.02, 0.1, 0.1);
      const horizontalRibbon = new THREE.Mesh(horizontalRibbonGeometry, ribbonMaterial);
      horizontalRibbon.position.y = 0.41;
      giftGroup.add(horizontalRibbon);
      
      // Ribbon bow
      const bowSize = 0.3;
      const bowGeometry = new THREE.BoxGeometry(bowSize, 0.05, bowSize);
      
      const bowLeft = new THREE.Mesh(bowGeometry, ribbonMaterial);
      bowLeft.position.set(0, 1.1, 0);
      bowLeft.rotation.z = Math.PI / 4;
      giftGroup.add(bowLeft);
      
      const bowRight = new THREE.Mesh(bowGeometry, ribbonMaterial);
      bowRight.position.set(0, 1.1, 0);
      bowRight.rotation.z = -Math.PI / 4;
      giftGroup.add(bowRight);
      
      // Add a soft light inside the gift
      const giftLight = new THREE.PointLight(gift.color, 0.5, 3);
      giftLight.position.set(0, 0.5, 0);
      giftGroup.add(giftLight);
      
      this.scene.add(giftGroup);
      
      this.lights.push({
        type: LightType.POINT,
        light: giftLight,
        update: (time: number, audioData: AudioAnalysisData) => {
          // Light responds to cello frequencies
          const celloEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 50, 100);
          giftLight.intensity = 0.5 + celloEnergy * 0.5;
        }
      });
      
      this.elements.push({
        type: ElementType.GIFT,
        object: giftGroup,
        material: boxMaterial,
        props: {
          position: { x: gift.x, y: gift.y, z: gift.z },
          rotation: { x: 0, y: 0, z: 0 },
          scale: gift.scale,
          color: '#' + gift.color.toString(16).padStart(6, '0'),
          intensity: 1,
          reactsTo: {
            frequencyRange: [50, 100],
            instrument: 'cello'
          }
        },
        update: (time: number, audioData: AudioAnalysisData) => {
          // Gifts respond to cello frequencies
          const celloEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 50, 100);
          
          // Make the gift bounce slightly
          giftGroup.position.y = Math.sin(time * 2 + index) * celloEnergy * 0.2;
          
          // Make the lid open on strong beats
          if (celloEnergy > 0.8 && audioData.peaks.length > 0) {
            lid.rotation.x = Math.sin(time * 5) * 0.2;
          } else {
            // Return to closed position
            lid.rotation.x *= 0.9;
          }
          
          // Make the bow flutter
          bowLeft.rotation.z = Math.PI / 4 + Math.sin(time * 3 + index) * 0.1;
          bowRight.rotation.z = -Math.PI / 4 + Math.sin(time * 3 + index + 1) * 0.1;
        }
      });
    });
  }
  
  private createStar() {
    // Create a large star at the top of the scene
    const starGroup = new THREE.Group();
    starGroup.position.set(0, 15, 0);
    
    // Star geometry - create a custom star shape
    const starShape = new THREE.Shape();
    const outerRadius = 2;
    const innerRadius = 0.8;
    const spikes = 5;
    
    // Draw star path
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        starShape.moveTo(x, y);
      } else {
        starShape.lineTo(x, y);
      }
    }
    starShape.closePath();
    
    // Extrude shape to create 3D star
    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    };
    
    const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    
    // Create glowing material for the star
    const starMaterial = this.shaderMaterials.glow.clone();
    starMaterial.uniforms.glowColor.value = new THREE.Color(0xFFFF00); // Yellow glow
    starMaterial.uniforms.intensity.value = 1.0;
    starMaterial.uniforms.power.value = 1.5;
    starMaterial.uniforms.baseBrightness.value = 0.3;
    
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.rotation.x = -Math.PI / 2; // Make it flat horizontally
    starGroup.add(star);
    
    // Add point light for illumination
    const starLight = new THREE.PointLight(0xFFFF88, 1.0, 30);
    starLight.position.set(0, 0, 0);
    starGroup.add(starLight);
    
    this.scene.add(starGroup);
    
    this.lights.push({
      type: LightType.POINT,
      light: starLight,
      update: (time: number, audioData: AudioAnalysisData) => {
        // Star light responds to high frequencies and synthesizer
        const highFreqEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 100, 120);
        starLight.intensity = 1.0 + highFreqEnergy * 2.0;
        
        // Change color based on dominant instrument
        if (this.dominantInstrument === 'synthesizer') {
          const hue = (time * 30) % 360;
          const color = new THREE.Color();
          color.setHSL(hue / 360, 1.0, 0.5);
          starLight.color = color;
          
          // Update star material color
          (starMaterial as THREE.ShaderMaterial).uniforms.glowColor.value = color;
        } else {
          // Default to yellow
          starLight.color.set(0xFFFF88);
          (starMaterial as THREE.ShaderMaterial).uniforms.glowColor.value = new THREE.Color(0xFFFF00);
        }
      }
    });
    
    this.elements.push({
      type: ElementType.STAR,
      object: starGroup,
      material: starMaterial,
      props: {
        position: { x: 0, y: 15, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: '#FFFF00',
        intensity: 1,
        reactsTo: {
          frequencyRange: [100, 120],
          instrument: 'synthesizer'
        }
      },
      update: (time: number, audioData: AudioAnalysisData) => {
        // Star responds to high frequencies
        const highFreqEnergy = this.getFrequencyRangeEnergy(audioData.frequencyData, 100, 120);
        
        // Rotate the star
        starGroup.rotation.y = time * 0.2;
        
        // Make the star pulse
        const pulseScale = 1 + Math.sin(time * 3) * 0.1 * highFreqEnergy;
        star.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Update star material
        const material = star.material as THREE.ShaderMaterial;
        material.uniforms.intensity.value = 1.0 + highFreqEnergy * 1.0;
        
        // Make the star emit occasional flashes on strong high frequencies
        if (highFreqEnergy > 0.8 && Math.random() > 0.9) {
          material.uniforms.intensity.value = 3.0;
          starLight.intensity = 3.0;
          
          // Reset after a short time
          setTimeout(() => {
            if (material.uniforms) {
              material.uniforms.intensity.value = 1.0;
            }
          }, 100);
        }
      }
    });
  }
  
  // Utility function to get energy in a frequency range
  private getFrequencyRangeEnergy(frequencyData: Uint8Array, minFreq: number, maxFreq: number): number {
    let energy = 0;
    let count = 0;
    
    for (let i = minFreq; i <= maxFreq && i < frequencyData.length; i++) {
      energy += frequencyData[i] / 255;
      count++;
    }
    
    return count > 0 ? energy / count : 0;
  }
  
  // Main draw function called on each frame
  public draw(analysisData: AudioAnalysisData): void {
    // Check if renderer is initialized
    if (!this.renderer) {
      console.error('Cannot draw: WebGL renderer is not initialized');
      return;
    }
    // Update time
    this.time += this.clock.getDelta();
    
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
      const intensity = analysisData.averageFrequency / 255;
      this.currentHue += (targetHue - this.currentHue) * this.colorTransitionSpeed * (1 + intensity);
      
      // Keep within 0-360 range
      this.currentHue = ((this.currentHue % 360) + 360) % 360;
    }
    
    // Apply custom settings to analysis data
    const modifiedAnalysisData = this.applySettings(analysisData);
    
    // Update camera controls
    this.controls.update();
    
    // Update shader materials
    this.updateShaderMaterials(this.time, modifiedAnalysisData);
    
    // Update scene elements
    this.updateElements(this.time, modifiedAnalysisData);
    
    // Update lights
    this.updateLights(this.time, modifiedAnalysisData);
    
    // Update snow particles
    this.updateSnowParticles(this.time, modifiedAnalysisData);
    
    // Render the scene
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Error rendering 3D scene:', error);
    }
  }
  
  // Apply settings to modify analysis data
  private applySettings(analysisData: AudioAnalysisData): AudioAnalysisData {
    // Create a copy of the analysis data to modify
    const modifiedData: AudioAnalysisData = {
      ...analysisData,
      frequencyData: new Uint8Array(analysisData.frequencyData),
      waveformData: new Uint8Array(analysisData.waveformData),
      timeDomainData: new Uint8Array(analysisData.timeDomainData),
      peaks: [...analysisData.peaks]
    };
    
    // Apply reactivity setting
    if (this.reactivity !== 1.0) {
      // Modify frequency data based on reactivity
      for (let i = 0; i < modifiedData.frequencyData.length; i++) {
        // Apply reactivity - boost or reduce frequencies
        const value = modifiedData.frequencyData[i] / 255; // Normalize to 0-1
        const modifiedValue = Math.pow(value, 2 - this.reactivity); // Apply power curve
        modifiedData.frequencyData[i] = Math.min(255, Math.max(0, Math.round(modifiedValue * 255)));
      }
      
      // Adjust peaks based on reactivity
      if (this.reactivity < 1.0 && modifiedData.peaks.length > 0) {
        // Reduce number of peaks when reactivity is low
        const keepRatio = this.reactivity;
        const peaksToKeep = Math.max(1, Math.floor(modifiedData.peaks.length * keepRatio));
        modifiedData.peaks = modifiedData.peaks.slice(0, peaksToKeep);
      }
    }
    
    return modifiedData;
  }
  
  private updateShaderMaterials(time: number, audioData: AudioAnalysisData): void {
    // Update global shader uniforms
    this.shaderMaterials.glow.uniforms.intensity.value = 1.0 + (audioData.averageFrequency / 255) * 0.5;
    this.shaderMaterials.lightString.uniforms.time.value = time;
    this.shaderMaterials.particle.uniforms.time.value = time;
    this.shaderMaterials.snow.uniforms.time.value = time;
  }
  
  private updateElements(time: number, audioData: AudioAnalysisData): void {
    // Update all scene elements
    for (const element of this.elements) {
      element.update(time, audioData);
    }
  }
  
  private updateLights(time: number, audioData: AudioAnalysisData): void {
    // Update all lights
    for (const light of this.lights) {
      light.update(time, audioData);
    }
  }
  
  private updateSnowParticles(time: number, audioData: AudioAnalysisData): void {
    if (!this.snowParticles) return;
    
    const positions = this.snowParticles.geometry.attributes.position;
    const opacities = this.snowParticles.geometry.attributes.opacity;
    
    // Snow intensity based on high frequencies
    const snowIntensity = this.getFrequencyRangeEnergy(audioData.frequencyData, 100, 120);
    
    for (let i = 0; i < positions.count; i++) {
      // Move particles downward
      positions.array[i * 3 + 1] -= 0.05 + Math.random() * 0.05;
      
      // Add some horizontal drift
      positions.array[i * 3] += (Math.random() - 0.5) * 0.02;
      positions.array[i * 3 + 2] += (Math.random() - 0.5) * 0.02;
      
      // Reset particles that reach the ground
      if (positions.array[i * 3 + 1] < 0) {
        positions.array[i * 3 + 1] = 20; // Reset to top
        positions.array[i * 3] = (Math.random() - 0.5) * 60; // Random x
        positions.array[i * 3 + 2] = (Math.random() - 0.5) * 60; // Random z
        
        // Set opacity based on snow intensity
        if (opacities) {
          opacities.array[i] = Math.random() < snowIntensity ? (Math.random() * 0.5 + 0.5) : 0.2;
        }
      }
    }
    
    positions.needsUpdate = true;
    if (opacities) opacities.needsUpdate = true;
  }
  
  // Camera control methods
  public setCameraPosition(position: { x: number, y: number, z: number }): void {
    this.camera.position.set(position.x, position.y, position.z);
    this.controls.update();
  }
  
  public setCameraTarget(target: { x: number, y: number, z: number }): void {
    this.controls.target.set(target.x, target.y, target.z);
    this.controls.update();
  }
  
  public resetCamera(): void {
    // Smoothly transition to default camera position and target
    this.animateCameraTransition(
      this.cameraControls.position,
      this.cameraControls.target,
      1000
    );
  }
  
  public setFrontView(): void {
    // Enhanced front view - better angle to see the scene
    const targetPosition = { x: 0, y: 5, z: 20 };
    const targetLookAt = { x: 0, y: 3, z: 0 }; // Look slightly higher to see more of the scene
    
    // Smoothly transition to this view
    this.animateCameraTransition(targetPosition, targetLookAt, 1000);
  }
  
  public setTopView(): void {
    // Enhanced top view with slight angle for better perspective
    const targetPosition = { x: 0, y: 20, z: 5 }; // Add z offset for better perspective
    const targetLookAt = { x: 0, y: 0, z: 0 };
    
    // Smoothly transition to this view
    this.animateCameraTransition(targetPosition, targetLookAt, 1000);
  }
  
  public setSideView(): void {
    // Enhanced side view - better angle to see the scene
    const targetPosition = { x: 20, y: 6, z: 5 }; // Add z offset for better perspective
    const targetLookAt = { x: 0, y: 3, z: 0 }; // Look slightly higher
    
    // Smoothly transition to this view
    this.animateCameraTransition(targetPosition, targetLookAt, 1000);
  }
  
  public setOrbitEnabled(enabled: boolean): void {
    this.controls.enableRotate = enabled;
    // Update internal state to match
    this.cameraControls.enableOrbit = enabled;
    // Provide visual feedback when orbit is disabled
    if (!enabled) {
      // Add a brief flash effect to indicate restriction
      const flashLight = new THREE.AmbientLight(0xff0000, 0.5);
      this.scene.add(flashLight);
      setTimeout(() => {
        this.scene.remove(flashLight);
      }, 300);
    }
  }
  
  public setPanEnabled(enabled: boolean): void {
    this.controls.enablePan = enabled;
    // Update internal state to match
    this.cameraControls.enablePan = enabled;
    // Provide visual feedback when pan is disabled
    if (!enabled) {
      // Add a brief flash effect to indicate restriction
      const flashLight = new THREE.AmbientLight(0x00ff00, 0.5);
      this.scene.add(flashLight);
      setTimeout(() => {
        this.scene.remove(flashLight);
      }, 300);
    }
  }
  
  public setZoomEnabled(enabled: boolean): void {
    this.controls.enableZoom = enabled;
    // Update internal state to match
    this.cameraControls.enableZoom = enabled;
    // Provide visual feedback when zoom is disabled
    if (!enabled) {
      // Add a brief flash effect to indicate restriction
      const flashLight = new THREE.AmbientLight(0x0000ff, 0.5);
      this.scene.add(flashLight);
      setTimeout(() => {
        this.scene.remove(flashLight);
      }, 300);
    }
  }

  // Helper method to smoothly animate camera transitions
  private animateCameraTransition(
    targetPosition: { x: number, y: number, z: number },
    targetLookAt: { x: number, y: number, z: number },
    duration: number = 1000
  ): void {
    // Store initial camera position and target
    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    
    // Calculate distances to move
    const positionDelta = {
      x: targetPosition.x - startPosition.x,
      y: targetPosition.y - startPosition.y,
      z: targetPosition.z - startPosition.z
    };
    
    const targetDelta = {
      x: targetLookAt.x - startTarget.x,
      y: targetLookAt.y - startTarget.y,
      z: targetLookAt.z - startTarget.z
    };
    
    // Set up animation variables
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    // Animation function
    const animate = () => {
      const currentTime = Date.now();
      if (currentTime >= endTime) {
        // Animation complete, set final values
        this.camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
        this.controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
        this.controls.update();
        return;
      }
      
      // Calculate progress (0 to 1)
      const progress = (currentTime - startTime) / duration;
      
      // Use easing function for smoother transition (ease in/out)
      const easedProgress = this.easeInOutCubic(progress);
      
      // Update camera position
      this.camera.position.set(
        startPosition.x + positionDelta.x * easedProgress,
        startPosition.y + positionDelta.y * easedProgress,
        startPosition.z + positionDelta.z * easedProgress
      );
      
      // Update controls target
      this.controls.target.set(
        startTarget.x + targetDelta.x * easedProgress,
        startTarget.y + targetDelta.y * easedProgress,
        startTarget.z + targetDelta.z * easedProgress
      );
      
      // Update controls
      this.controls.update();
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
  }
  
  // Easing function for smooth camera transitions
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Handle resize events
  protected resizeCanvas(): void {
    super.resizeCanvas();
    
    // Check if camera and renderer are initialized
    if (this.camera && this.renderer) {
      // Update camera aspect ratio
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      
      // Update renderer size
      this.renderer.setSize(this.width, this.height);
    }
  }
  
  // Cleanup
  // Settings methods
  public setBrightness(value: number): void {
    this.brightness = Math.max(0, Math.min(2, value));
  }
  
  public setReactivity(value: number): void {
    this.reactivity = Math.max(0, Math.min(2, value));
  }
  
  public setSnowIntensity(value: number): void {
    this.snowIntensity = Math.max(0, Math.min(2, value));
  }
  
  public setAuroraIntensity(value: number): void {
    this.auroraIntensity = Math.max(0, Math.min(2, value));
  }
  
  public setTreeLightsVisibility(visible: boolean): void {
    this.treeLightsVisible = visible;
  }
  
  public setCrystalVisibility(visible: boolean): void {
    this.crystalsVisible = visible;
    
    // Find all ice crystal elements and update their visibility
    this.elements.forEach(element => {
      if (element.type === ElementType.STAR && 
          element.props.color === '#88CCFF') {
        element.object.visible = visible;
      }
    });
  }
  
  public setColorTheme(theme: 'warm' | 'cool' | 'rainbow' | 'classic'): void {
    if (this.colorTheme !== theme) {
      this.colorTheme = theme;
      this.applyColorTheme();
    }
  }
  
  private applyColorTheme(): void {
    const theme = this.colorThemes[this.colorTheme];
    
    // Find the sky mesh
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Apply theme to sky
        if (object.geometry instanceof THREE.SphereGeometry && 
            object.geometry.parameters.radius > 100) {
          const material = object.material as THREE.ShaderMaterial;
          if (material.uniforms && material.uniforms.topColor) {
            material.uniforms.topColor.value = new THREE.Color(theme.sky.top);
            material.uniforms.bottomColor.value = new THREE.Color(theme.sky.bottom);
          }
        }
        
        // Apply theme to house
        if (object.geometry instanceof THREE.BoxGeometry && 
            object.position.y > 1 && object.position.y < 4) {
          const material = object.material as THREE.MeshStandardMaterial;
          if (material.map && material.map.image && 
              material.map.image.width > 0) {
            material.color.set(theme.house);
          }
        }
        
        // Apply theme to roof
        if (object.geometry instanceof THREE.ConeGeometry) {
          const material = object.material as THREE.MeshStandardMaterial;
          if (material.color) {
            material.color.set(theme.roof);
          }
        }
      }
    });
    
    // Update aurora colors
    this.elements.forEach(element => {
      if (element.type === ElementType.STAR && element.props.position.y > 40) {
        const material = element.material as THREE.ShaderMaterial;
        if (material.uniforms && material.uniforms.baseColor) {
          material.uniforms.baseColor.value = new THREE.Color(theme.aurora.base);
          material.uniforms.secondColor.value = new THREE.Color(theme.aurora.secondary);
        }
      }
    });
  }
  
  public destroy(): void {
    super.destroy();
    
    // Check if controls are initialized before disposing
    if (this.controls) {
      this.controls.dispose();
    }
    
    // Check if scene is initialized before cleaning up
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
    
    // Clear references
    this.elements = [];
    this.lights = [];
    this.particleSystems = [];
  }
}

export default Holiday3DVisualization;
