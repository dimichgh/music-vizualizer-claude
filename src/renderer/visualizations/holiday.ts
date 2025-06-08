import Base2DVisualization from './base2d';
import { AudioAnalysisData } from '../../shared/types';
import { DEFAULT_COLOR_SCHEMES } from '../../shared/constants';

// Element types
enum HolidayElementType {
  ROOFLINE,
  WINDOW,
  DOOR,
  CHIMNEY,
  TREE,
  BUSH,
  SNOWMAN,
  REINDEER,
  STAR,
  GIFT,
  SANTA
}

// Animation patterns
enum AnimationPattern {
  STATIC,
  BLINK,
  CHASE,
  WAVE,
  TWINKLE,
  STROBE,
  FADE,
  ALTERNATE
}

// Light element interface
interface LightElement {
  type: HolidayElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  brightness: number;
  active: boolean;
  pattern: AnimationPattern;
  freqRange: [number, number]; // [min, max] frequency range
  instrument?: string; // Specific instrument this responds to
  points?: Array<{x: number, y: number}>; // For complex shapes
  lastUpdateTime: number;
  state: any; // Element-specific state for animations
}

interface HouseStructure {
  roof: LightElement[];
  windows: LightElement[];
  door: LightElement;
  chimney: LightElement;
  outline: LightElement[];
}

interface YardElements {
  trees: LightElement[];
  bushes: LightElement[];
  ornaments: LightElement[];
}

class HolidayVisualization extends Base2DVisualization {
  private elements: LightElement[] = [];
  private house: HouseStructure = {
    roof: [],
    windows: [],
    door: {} as LightElement,
    chimney: {} as LightElement,
    outline: []
  };
  private yard: YardElements = {
    trees: [],
    bushes: [],
    ornaments: []
  };
  private time: number = 0;
  private lastBeatTime: number = 0;
  private beatCount: number = 0;
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
    this.initElements();
  }
  
  private initElements(): void {
    // Create house structure
    this.createHouse();
    
    // Create yard elements
    this.createYardElements();
    
    // Combine all elements for easier processing
    this.elements = [
      ...this.house.roof,
      ...this.house.windows,
      this.house.door,
      this.house.chimney,
      ...this.house.outline,
      ...this.yard.trees,
      ...this.yard.bushes,
      ...this.yard.ornaments
    ];
  }
  
  private createHouse(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // House dimensions
    const houseWidth = this.width * 0.6;
    const houseHeight = this.height * 0.4;
    const houseX = centerX - houseWidth / 2;
    const houseY = centerY - houseHeight / 3; // Position house a bit higher than center
    
    // Create roof
    this.createRoof(houseX, houseY, houseWidth, houseHeight);
    
    // Create windows
    this.createWindows(houseX, houseY, houseWidth, houseHeight);
    
    // Create door
    this.createDoor(houseX, houseY, houseWidth, houseHeight);
    
    // Create chimney
    this.createChimney(houseX, houseY, houseWidth, houseHeight);
    
    // Create house outline
    this.createHouseOutline(houseX, houseY, houseWidth, houseHeight);
  }
  
  private createRoof(houseX: number, houseY: number, houseWidth: number, houseHeight: number): void {
    const roofHeight = houseHeight * 0.4;
    const roofX = houseX;
    const roofY = houseY - roofHeight;
    
    // Main roof segment (triangle)
    const roofSegment: LightElement = {
      type: HolidayElementType.ROOFLINE,
      x: roofX,
      y: roofY,
      width: houseWidth,
      height: roofHeight,
      color: 'red',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.CHASE,
      freqRange: [20, 40], // Mid-range frequencies
      instrument: 'guitar',
      points: [
        { x: roofX, y: houseY },
        { x: roofX + houseWidth / 2, y: roofY },
        { x: roofX + houseWidth, y: houseY }
      ],
      lastUpdateTime: Date.now(),
      state: { position: 0 }
    };
    
    this.house.roof.push(roofSegment);
  }
  
  private createWindows(houseX: number, houseY: number, houseWidth: number, houseHeight: number): void {
    const windowWidth = houseWidth * 0.15;
    const windowHeight = houseHeight * 0.25;
    const windowPadding = houseWidth * 0.1;
    
    // Left window
    const leftWindow: LightElement = {
      type: HolidayElementType.WINDOW,
      x: houseX + windowPadding,
      y: houseY + houseHeight * 0.2,
      width: windowWidth,
      height: windowHeight,
      color: 'yellow',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.BLINK,
      freqRange: [40, 60], // Higher mid-range
      instrument: 'piano',
      lastUpdateTime: Date.now(),
      state: {}
    };
    
    // Right window
    const rightWindow: LightElement = {
      type: HolidayElementType.WINDOW,
      x: houseX + houseWidth - windowPadding - windowWidth,
      y: houseY + houseHeight * 0.2,
      width: windowWidth,
      height: windowHeight,
      color: 'yellow',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.BLINK,
      freqRange: [40, 60], // Higher mid-range
      instrument: 'piano',
      lastUpdateTime: Date.now(),
      state: {}
    };
    
    this.house.windows.push(leftWindow, rightWindow);
  }
  
  private createDoor(houseX: number, houseY: number, houseWidth: number, houseHeight: number): void {
    const doorWidth = houseWidth * 0.2;
    const doorHeight = houseHeight * 0.5;
    const doorX = houseX + (houseWidth - doorWidth) / 2;
    const doorY = houseY + houseHeight - doorHeight;
    
    this.house.door = {
      type: HolidayElementType.DOOR,
      x: doorX,
      y: doorY,
      width: doorWidth,
      height: doorHeight,
      color: 'green',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.STATIC,
      freqRange: [0, 10], // Bass frequencies
      instrument: 'bass',
      lastUpdateTime: Date.now(),
      state: {}
    };
  }
  
  private createChimney(houseX: number, houseY: number, houseWidth: number, houseHeight: number): void {
    const chimneyWidth = houseWidth * 0.1;
    const chimneyHeight = houseHeight * 0.4;
    const chimneyX = houseX + houseWidth * 0.75;
    const chimneyY = houseY - chimneyHeight * 0.5;
    
    this.house.chimney = {
      type: HolidayElementType.CHIMNEY,
      x: chimneyX,
      y: chimneyY,
      width: chimneyWidth,
      height: chimneyHeight,
      color: 'rgb(150, 75, 0)',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.STATIC,
      freqRange: [5, 15], // Lower frequencies
      instrument: 'drums',
      lastUpdateTime: Date.now(),
      state: { smokeParticles: [] }
    };
  }
  
  private createHouseOutline(houseX: number, houseY: number, houseWidth: number, houseHeight: number): void {
    // Bottom of house
    const bottomOutline: LightElement = {
      type: HolidayElementType.ROOFLINE,
      x: houseX,
      y: houseY + houseHeight,
      width: houseWidth,
      height: 2,
      color: 'blue',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.CHASE,
      freqRange: [30, 50],
      instrument: 'synthesizer',
      points: [
        { x: houseX, y: houseY + houseHeight },
        { x: houseX + houseWidth, y: houseY + houseHeight }
      ],
      lastUpdateTime: Date.now(),
      state: { position: 0 }
    };
    
    // Left side of house
    const leftOutline: LightElement = {
      type: HolidayElementType.ROOFLINE,
      x: houseX,
      y: houseY,
      width: 2,
      height: houseHeight,
      color: 'blue',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.CHASE,
      freqRange: [30, 50],
      instrument: 'synthesizer',
      points: [
        { x: houseX, y: houseY },
        { x: houseX, y: houseY + houseHeight }
      ],
      lastUpdateTime: Date.now(),
      state: { position: 0 }
    };
    
    // Right side of house
    const rightOutline: LightElement = {
      type: HolidayElementType.ROOFLINE,
      x: houseX + houseWidth,
      y: houseY,
      width: 2,
      height: houseHeight,
      color: 'blue',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.CHASE,
      freqRange: [30, 50],
      instrument: 'synthesizer',
      points: [
        { x: houseX + houseWidth, y: houseY },
        { x: houseX + houseWidth, y: houseY + houseHeight }
      ],
      lastUpdateTime: Date.now(),
      state: { position: 0 }
    };
    
    this.house.outline.push(bottomOutline, leftOutline, rightOutline);
  }
  
  private createYardElements(): void {
    this.createTrees();
    this.createBushes();
    this.createOrnaments();
  }
  
  private createTrees(): void {
    const centerX = this.width / 2;
    const groundLevel = this.height * 0.7;
    
    // Left tree
    const leftTreeX = centerX - this.width * 0.3;
    const leftTreeHeight = this.height * 0.3;
    const leftTree = this.createTree(leftTreeX, groundLevel, leftTreeHeight, 'green', AnimationPattern.TWINKLE, [50, 70], 'flute');
    
    // Right tree
    const rightTreeX = centerX + this.width * 0.3;
    const rightTreeHeight = this.height * 0.25;
    const rightTree = this.createTree(rightTreeX, groundLevel, rightTreeHeight, 'green', AnimationPattern.TWINKLE, [60, 80], 'violin');
    
    this.yard.trees.push(leftTree, rightTree);
  }
  
  private createTree(x: number, groundY: number, height: number, color: string, pattern: AnimationPattern, freqRange: [number, number], instrument: string): LightElement {
    return {
      type: HolidayElementType.TREE,
      x: x,
      y: groundY - height,
      width: height * 0.7,
      height: height,
      color: color,
      brightness: 1,
      active: true,
      pattern: pattern,
      freqRange: freqRange,
      instrument: instrument,
      lastUpdateTime: Date.now(),
      state: { lights: [] }
    };
  }
  
  private createBushes(): void {
    const groundLevel = this.height * 0.7;
    const houseWidth = this.width * 0.6;
    const houseX = this.width / 2 - houseWidth / 2;
    
    // Create bushes along the front of the house
    const bushCount = 3;
    const bushWidth = houseWidth / (bushCount * 2);
    const bushHeight = bushWidth * 0.7;
    
    for (let i = 0; i < bushCount; i++) {
      const bushX = houseX + (houseWidth / bushCount) * i + bushWidth / 2;
      
      const bush: LightElement = {
        type: HolidayElementType.BUSH,
        x: bushX,
        y: groundLevel - bushHeight / 2,
        width: bushWidth,
        height: bushHeight,
        color: 'rgb(0, 150, 0)',
        brightness: 1,
        active: true,
        pattern: AnimationPattern.FADE,
        freqRange: [i * 10 + 20, i * 10 + 40], // Different frequency range for each bush
        instrument: i % 2 === 0 ? 'saxophone' : 'trumpet',
        lastUpdateTime: Date.now(),
        state: { fadeLevel: 0 }
      };
      
      this.yard.bushes.push(bush);
    }
  }
  
  private createOrnaments(): void {
    const groundLevel = this.height * 0.7;
    
    // Snowman - right side
    const snowman: LightElement = {
      type: HolidayElementType.SNOWMAN,
      x: this.width * 0.8,
      y: groundLevel,
      width: this.width * 0.08,
      height: this.height * 0.2,
      color: 'white',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.BLINK,
      freqRange: [70, 90],
      instrument: 'voice',
      lastUpdateTime: Date.now(),
      state: {}
    };
    
    // Star at the top of the screen
    const star: LightElement = {
      type: HolidayElementType.STAR,
      x: this.width / 2,
      y: this.height * 0.1,
      width: this.width * 0.1,
      height: this.width * 0.1,
      color: 'yellow',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.STROBE,
      freqRange: [100, 120],
      instrument: 'synthesizer',
      lastUpdateTime: Date.now(),
      state: { strobePhase: 0 }
    };
    
    // Gift box - left side
    const gift: LightElement = {
      type: HolidayElementType.GIFT,
      x: this.width * 0.2,
      y: groundLevel,
      width: this.width * 0.1,
      height: this.height * 0.1,
      color: 'red',
      brightness: 1,
      active: true,
      pattern: AnimationPattern.ALTERNATE,
      freqRange: [50, 100],
      instrument: 'cello',
      lastUpdateTime: Date.now(),
      state: { colorIndex: 0 }
    };
    
    this.yard.ornaments.push(snowman, star, gift);
  }
  
  public draw(analysisData: AudioAnalysisData): void {
    // Update time
    this.time += 0.01;
    
    // Clear or fade background
    this.drawBackground();
    
    // Update elements based on audio data
    this.updateElements(analysisData);
    
    // Draw ground/snow
    this.drawGround();
    
    // Draw house structure
    this.drawHouse();
    
    // Draw yard elements
    this.drawYardElements();
    
    // Add special effects based on beats
    if (analysisData.peaks.length > 0) {
      this.triggerBeatEffects(analysisData);
    }
  }
  
  private drawBackground(): void {
    // Night sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.7);
    gradient.addColorStop(0, 'rgb(0, 0, 30)');
    gradient.addColorStop(1, 'rgb(30, 30, 70)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw stars
    const starCount = 100;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height * 0.6; // Stars only in the sky
      const size = Math.random() * 2 + 1;
      
      // Twinkle effect
      const twinkle = Math.sin(this.time * 3 + i) * 0.5 + 0.5;
      this.ctx.globalAlpha = 0.3 + twinkle * 0.7;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  private drawGround(): void {
    // Snow-covered ground
    const groundY = this.height * 0.7;
    
    // Draw ground gradient
    const gradient = this.ctx.createLinearGradient(0, groundY, 0, this.height);
    gradient.addColorStop(0, 'rgb(220, 240, 255)'); // Lighter snow at top
    gradient.addColorStop(1, 'rgb(180, 210, 240)'); // Deeper snow at bottom
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, groundY, this.width, this.height - groundY);
    
    // Add snow texture details
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let x = 0; x < this.width; x += 40) {
      const snowHeight = Math.random() * 10 + 5;
      const snowWidth = Math.random() * 80 + 40;
      this.ctx.beginPath();
      this.ctx.ellipse(x, groundY, snowWidth / 2, snowHeight / 2, 0, 0, Math.PI, true);
      this.ctx.fill();
    }
  }
  
  private updateElements(analysisData: AudioAnalysisData): void {
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
    
    // Process each element
    for (const element of this.elements) {
      // Get frequency range for this element
      const [minFreq, maxFreq] = element.freqRange;
      const freqRange = maxFreq - minFreq;
      
      // Calculate energy in this frequency range
      let energy = 0;
      let count = 0;
      for (let i = minFreq; i <= maxFreq && i < analysisData.frequencyData.length; i++) {
        energy += analysisData.frequencyData[i] / 255;
        count++;
      }
      energy = count > 0 ? energy / count : 0;
      
      // Instrument-specific behavior
      if (element.instrument && this.dominantInstrument === element.instrument) {
        energy *= 1.5; // Boost elements that match the dominant instrument
      }
      
      // Update element brightness based on energy
      element.brightness = Math.min(1, energy * 1.5);
      
      // Make sure the element is active if it has energy
      if (energy > 0.3) {
        element.active = true;
      }
      
      // Update element state based on its animation pattern
      this.updateElementAnimation(element, energy);
      
      // Update element color based on dominant instrument
      if (this.dominantInstrument && element.instrument === this.dominantInstrument) {
        const hue = this.currentHue;
        element.color = `hsl(${hue}, 100%, 50%)`;
      }
    }
  }
  
  private updateElementAnimation(element: LightElement, energy: number): void {
    const now = Date.now();
    const elapsed = now - element.lastUpdateTime;
    
    // Different animation patterns
    switch (element.pattern) {
      case AnimationPattern.BLINK:
        element.active = Math.sin(this.time * 5 * energy) > 0;
        break;
        
      case AnimationPattern.CHASE:
        // Update chase position
        element.state.position = (element.state.position + energy * 0.1) % 1;
        break;
        
      case AnimationPattern.TWINKLE:
        // Random twinkling effect
        if (Math.random() < energy * 0.2) {
          element.active = !element.active;
        }
        break;
        
      case AnimationPattern.STROBE:
        // Fast strobing effect
        element.state.strobePhase = (element.state.strobePhase + energy * 0.5) % 1;
        element.active = element.state.strobePhase < 0.5;
        break;
        
      case AnimationPattern.FADE:
        // Smooth fading effect
        element.state.fadeLevel = (Math.sin(this.time * 2 * energy) * 0.5 + 0.5);
        element.brightness = element.state.fadeLevel * energy;
        break;
        
      case AnimationPattern.ALTERNATE:
        // Alternate between colors
        if (Math.random() < energy * 0.1) {
          element.state.colorIndex = (element.state.colorIndex + 1) % this.colorScheme.length;
          element.color = this.colorScheme[element.state.colorIndex];
        }
        break;
        
      case AnimationPattern.WAVE:
        // Wave effect - brightness varies with position
        if (element.points && element.points.length > 1) {
          // For elements with multiple points like rooflines
          const wavePosition = (this.time * energy) % 1;
          element.state.wavePosition = wavePosition;
        }
        break;
    }
    
    element.lastUpdateTime = now;
  }
  
  private triggerBeatEffects(analysisData: AudioAnalysisData): void {
    const now = Date.now();
    
    // Only trigger if enough time has passed since last beat
    if (now - this.lastBeatTime > 200) {
      this.lastBeatTime = now;
      this.beatCount++;
      
      // Add flash effects on strong beats
      const flashIntensity = analysisData.averageFrequency / 255 * 0.3;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Temporarily boost brightness of all elements
      for (const element of this.elements) {
        element.brightness = Math.min(1, element.brightness * 1.5);
      }
      
      // Special effects on every 4th beat
      if (this.beatCount % 4 === 0) {
        this.triggerSpecialEffect();
      }
    }
  }
  
  private triggerSpecialEffect(): void {
    // Pick a random element to highlight
    const randomIndex = Math.floor(Math.random() * this.elements.length);
    const element = this.elements[randomIndex];
    
    // Apply a special effect based on element type
    switch (element.type) {
      case HolidayElementType.STAR:
        // Make the star extra bright and big
        element.brightness = 2;
        element.width *= 1.5;
        element.height *= 1.5;
        
        // Reset size after a delay
        setTimeout(() => {
          if (element.type === HolidayElementType.STAR) {
            element.width /= 1.5;
            element.height /= 1.5;
          }
        }, 500);
        break;
        
      case HolidayElementType.CHIMNEY:
        // Add smoke particles to chimney
        element.state.smokeParticles = [];
        for (let i = 0; i < 10; i++) {
          element.state.smokeParticles.push({
            x: element.x + element.width / 2,
            y: element.y,
            size: Math.random() * 10 + 5,
            speed: Math.random() * 2 + 1,
            age: 0
          });
        }
        break;
        
      case HolidayElementType.TREE:
        // Make the tree "sparkle"
        element.state.sparkle = true;
        
        // Reset after a delay
        setTimeout(() => {
          if (element.type === HolidayElementType.TREE) {
            element.state.sparkle = false;
          }
        }, 500);
        break;
    }
  }
  
  private drawHouse(): void {
    // Draw house body first
    this.drawHouseBody();
    
    // Draw windows
    for (const window of this.house.windows) {
      this.drawWindow(window);
    }
    
    // Draw door
    this.drawDoor(this.house.door);
    
    // Draw roof
    for (const roofSegment of this.house.roof) {
      this.drawRoofLights(roofSegment);
    }
    
    // Draw house outline
    for (const outline of this.house.outline) {
      this.drawRoofLights(outline);
    }
    
    // Draw chimney
    this.drawChimney(this.house.chimney);
  }
  
  private drawHouseBody(): void {
    const houseWidth = this.width * 0.6;
    const houseHeight = this.height * 0.4;
    const houseX = this.width / 2 - houseWidth / 2;
    const houseY = this.height / 2 - houseHeight / 3;
    
    // House body
    this.ctx.fillStyle = 'rgb(100, 80, 70)'; // Brown house color
    this.ctx.fillRect(houseX, houseY, houseWidth, houseHeight);
    
    // House roof
    this.ctx.fillStyle = 'rgb(60, 40, 40)'; // Dark roof color
    this.ctx.beginPath();
    this.ctx.moveTo(houseX, houseY);
    this.ctx.lineTo(houseX + houseWidth / 2, houseY - houseHeight * 0.4);
    this.ctx.lineTo(houseX + houseWidth, houseY);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  private drawWindow(window: LightElement): void {
    if (!window.active) return;
    
    // Window frame
    this.ctx.fillStyle = 'rgb(60, 40, 30)';
    this.ctx.fillRect(window.x, window.y, window.width, window.height);
    
    // Window panes
    const paneWidth = window.width / 2;
    const paneHeight = window.height / 2;
    
    // Window light
    this.ctx.globalAlpha = window.brightness;
    this.ctx.fillStyle = window.color;
    
    // Draw window panes with light
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const paneX = window.x + col * paneWidth + 2;
        const paneY = window.y + row * paneHeight + 2;
        this.ctx.fillRect(paneX, paneY, paneWidth - 4, paneHeight - 4);
      }
    }
    
    // Add glow effect
    this.ctx.shadowBlur = 20 * window.brightness;
    this.ctx.shadowColor = window.color;
    this.ctx.fillRect(window.x + 2, window.y + 2, window.width - 4, window.height - 4);
    this.ctx.shadowBlur = 0;
    
    this.ctx.globalAlpha = 1;
  }
  
  private drawDoor(door: LightElement): void {
    // Door frame
    this.ctx.fillStyle = 'rgb(60, 30, 20)';
    this.ctx.fillRect(door.x, door.y, door.width, door.height);
    
    // Door wreath or lights
    if (door.active) {
      this.ctx.globalAlpha = door.brightness;
      
      // Door decoration (wreath)
      const wreathSize = door.width * 0.6;
      const wreathX = door.x + door.width / 2;
      const wreathY = door.y + door.height * 0.3;
      
      this.ctx.fillStyle = 'rgb(0, 100, 0)'; // Green wreath
      this.ctx.beginPath();
      this.ctx.arc(wreathX, wreathY, wreathSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Wreath center hole
      this.ctx.fillStyle = 'rgb(60, 30, 20)'; // Same as door
      this.ctx.beginPath();
      this.ctx.arc(wreathX, wreathY, wreathSize / 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Wreath decorations (lights)
      const lightCount = 8;
      for (let i = 0; i < lightCount; i++) {
        const angle = (i / lightCount) * Math.PI * 2;
        const lightX = wreathX + Math.cos(angle) * (wreathSize / 2.5);
        const lightY = wreathY + Math.sin(angle) * (wreathSize / 2.5);
        
        // Alternate red and gold lights
        this.ctx.fillStyle = i % 2 === 0 ? 'red' : 'gold';
        this.ctx.beginPath();
        this.ctx.arc(lightX, lightY, wreathSize / 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.beginPath();
        this.ctx.arc(lightX, lightY, wreathSize / 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
      
      // Doorknob
      this.ctx.fillStyle = 'gold';
      this.ctx.beginPath();
      this.ctx.arc(door.x + door.width * 0.8, door.y + door.height * 0.5, door.width * 0.1, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.globalAlpha = 1;
    }
  }
  
  private drawRoofLights(roofSegment: LightElement): void {
    if (!roofSegment.active || !roofSegment.points || roofSegment.points.length < 2) return;
    
    const { points } = roofSegment;
    const { position } = roofSegment.state; // For chase animations
    
    // Calculate total length of the roof line for even spacing
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Number of lights based on roof length
    const lightSpacing = 15; // Pixels between lights
    const lightCount = Math.floor(totalLength / lightSpacing);
    
    this.ctx.globalAlpha = roofSegment.brightness;
    
    // Draw each light along the roof line
    for (let i = 0; i < lightCount; i++) {
      const t = i / (lightCount - 1); // Position along the entire line (0 to 1)
      
      // For chase pattern, only light up certain sections
      if (roofSegment.pattern === AnimationPattern.CHASE) {
        const relativeDist = (t - position + 1) % 1;
        if (relativeDist > 0.2) continue;
      }
      
      // For wave pattern, vary brightness along the wave
      if (roofSegment.pattern === AnimationPattern.WAVE) {
        const wavePos = (t + roofSegment.state.wavePosition) % 1;
        this.ctx.globalAlpha = roofSegment.brightness * (Math.sin(wavePos * Math.PI * 2) * 0.5 + 0.5);
      }
      
      // Find the segment this light belongs to
      let segmentStart = 0;
      let segmentIdx = 0;
      
      for (let j = 1; j < points.length; j++) {
        const dx = points[j].x - points[j-1].x;
        const dy = points[j].y - points[j-1].y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        const segmentEnd = segmentStart + segmentLength / totalLength;
        
        if (t <= segmentEnd || j === points.length - 1) {
          segmentIdx = j - 1;
          const segmentT = (t - segmentStart) / ((segmentEnd - segmentStart) || 1);
          
          // Calculate light position
          const lightX = points[segmentIdx].x + (points[segmentIdx + 1].x - points[segmentIdx].x) * segmentT;
          const lightY = points[segmentIdx].y + (points[segmentIdx + 1].y - points[segmentIdx].y) * segmentT;
          
          // Draw light
          this.ctx.fillStyle = roofSegment.color;
          this.ctx.beginPath();
          this.ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Add glow
          this.ctx.shadowBlur = 10 * roofSegment.brightness;
          this.ctx.shadowColor = roofSegment.color;
          this.ctx.beginPath();
          this.ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          
          break;
        }
        
        segmentStart = segmentEnd;
      }
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  private drawChimney(chimney: LightElement): void {
    // Draw chimney body
    this.ctx.fillStyle = 'rgb(80, 30, 30)'; // Brick red
    this.ctx.fillRect(chimney.x, chimney.y, chimney.width, chimney.height);
    
    // Draw chimney top
    this.ctx.fillStyle = 'rgb(60, 20, 20)'; // Darker top
    this.ctx.fillRect(chimney.x - chimney.width * 0.2, chimney.y, chimney.width * 1.4, chimney.width);
    
    // Draw smoke if active
    if (chimney.active && chimney.state.smokeParticles) {
      this.ctx.globalAlpha = chimney.brightness * 0.7;
      
      // Update and draw smoke particles
      for (let i = chimney.state.smokeParticles.length - 1; i >= 0; i--) {
        const particle = chimney.state.smokeParticles[i];
        
        // Update particle position
        particle.y -= particle.speed;
        particle.x += Math.sin(this.time * 2 + i) * 0.5;
        particle.age += 0.02;
        
        // Remove old particles
        if (particle.age > 1) {
          chimney.state.smokeParticles.splice(i, 1);
          continue;
        }
        
        // Draw smoke particle
        const alpha = 0.7 * (1 - particle.age);
        this.ctx.fillStyle = `rgba(200, 200, 220, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * (1 + particle.age), 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.globalAlpha = 1;
    }
  }
  
  private drawYardElements(): void {
    // Draw bushes
    for (const bush of this.yard.bushes) {
      this.drawBush(bush);
    }
    
    // Draw trees
    for (const tree of this.yard.trees) {
      this.drawTree(tree);
    }
    
    // Draw ornaments
    for (const ornament of this.yard.ornaments) {
      this.drawOrnament(ornament);
    }
  }
  
  private drawBush(bush: LightElement): void {
    // Draw bush body
    this.ctx.fillStyle = 'rgb(0, 60, 0)'; // Dark green
    this.ctx.beginPath();
    this.ctx.ellipse(bush.x, bush.y, bush.width / 2, bush.height / 2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw lights on bush if active
    if (bush.active) {
      this.ctx.globalAlpha = bush.brightness;
      
      // Number of lights
      const lightCount = 12;
      
      for (let i = 0; i < lightCount; i++) {
        // Skip some lights based on pattern
        if (bush.pattern === AnimationPattern.FADE && Math.random() > bush.state.fadeLevel) {
          continue;
        }
        
        // Calculate light position - distributed along the ellipse
        const angle = (i / lightCount) * Math.PI * 2;
        const noiseX = Math.sin(this.time + i) * 0.1; // Small movement
        const noiseY = Math.cos(this.time * 0.7 + i) * 0.1;
        const lightX = bush.x + Math.cos(angle + noiseX) * (bush.width / 2 * 0.9);
        const lightY = bush.y + Math.sin(angle + noiseY) * (bush.height / 2 * 0.9);
        
        // Alternate colors
        const hue = (this.currentHue + i * 30) % 360;
        this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        // Draw light
        this.ctx.beginPath();
        this.ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.beginPath();
        this.ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
      
      this.ctx.globalAlpha = 1;
    }
  }
  
  private drawTree(tree: LightElement): void {
    // Tree trunk
    this.ctx.fillStyle = 'rgb(80, 50, 20)'; // Brown
    this.ctx.fillRect(
      tree.x - tree.width * 0.1,
      tree.y + tree.height * 0.8,
      tree.width * 0.2,
      tree.height * 0.2
    );
    
    // Tree foliage - triangle layers
    this.ctx.fillStyle = 'rgb(0, 80, 30)'; // Green
    
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const layerWidth = tree.width * (1 - i * 0.2);
      const layerHeight = tree.height * 0.3;
      const layerY = tree.y + i * tree.height * 0.25;
      
      this.ctx.beginPath();
      this.ctx.moveTo(tree.x - layerWidth / 2, layerY + layerHeight);
      this.ctx.lineTo(tree.x, layerY);
      this.ctx.lineTo(tree.x + layerWidth / 2, layerY + layerHeight);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    // Draw lights on tree if active
    if (tree.active) {
      this.ctx.globalAlpha = tree.brightness;
      
      // Lights for each layer
      for (let layer = 0; layer < layers; layer++) {
        const layerWidth = tree.width * (1 - layer * 0.2);
        const layerHeight = tree.height * 0.3;
        const layerY = tree.y + layer * tree.height * 0.25;
        
        // Number of lights per layer
        const lightCount = 8 - layer * 2;
        
        for (let i = 0; i < lightCount; i++) {
          // Skip some lights for twinkling effect
          if (tree.pattern === AnimationPattern.TWINKLE && Math.random() > 0.7) {
            continue;
          }
          
          // Special sparkle effect
          if (tree.state.sparkle && Math.random() > 0.5) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'white';
          }
          
          // Calculate light position along the triangle
          const t = i / (lightCount - 1);
          const lightWidth = layerWidth * t;
          const lightHeight = layerHeight * (1 - t);
          
          const lightX = tree.x - layerWidth / 2 + lightWidth;
          const lightY = layerY + layerHeight - lightHeight;
          
          // Alternate colors
          const hue = (this.currentHue + layer * 40 + i * 20) % 360;
          this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          
          // Draw light
          this.ctx.beginPath();
          this.ctx.arc(lightX, lightY, 4, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Add glow
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = this.ctx.fillStyle;
          this.ctx.beginPath();
          this.ctx.arc(lightX, lightY, 4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }
      
      // Draw star on top
      if (tree.brightness > 0.5) {
        this.ctx.fillStyle = 'rgb(255, 220, 0)'; // Gold
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgb(255, 200, 0)';
        
        // Simple star shape
        const starSize = tree.width * 0.15;
        this.ctx.beginPath();
        this.ctx.moveTo(tree.x, tree.y - starSize);
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i * 2/5) - Math.PI/2;
          const outerAngle = (Math.PI * 2 * (i * 2 + 1)/5) - Math.PI/2;
          
          this.ctx.lineTo(
            tree.x + Math.cos(angle) * starSize,
            tree.y + Math.sin(angle) * starSize
          );
          
          this.ctx.lineTo(
            tree.x + Math.cos(outerAngle) * starSize * 0.4,
            tree.y + Math.sin(outerAngle) * starSize * 0.4
          );
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
      }
      
      this.ctx.globalAlpha = 1;
    }
  }
  
  private drawOrnament(ornament: LightElement): void {
    if (!ornament.active) return;
    
    this.ctx.globalAlpha = ornament.brightness;
    
    switch (ornament.type) {
      case HolidayElementType.SNOWMAN:
        this.drawSnowman(ornament);
        break;
        
      case HolidayElementType.STAR:
        this.drawStar(ornament);
        break;
        
      case HolidayElementType.GIFT:
        this.drawGift(ornament);
        break;
        
      case HolidayElementType.REINDEER:
        // Implementation for reindeer
        break;
        
      case HolidayElementType.SANTA:
        // Implementation for Santa
        break;
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  private drawSnowman(snowman: LightElement): void {
    // Snowman body - three stacked circles
    const baseRadius = snowman.width / 2;
    const midRadius = baseRadius * 0.7;
    const headRadius = baseRadius * 0.5;
    
    // Bottom circle
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(snowman.x, snowman.y - baseRadius, baseRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Middle circle
    this.ctx.beginPath();
    this.ctx.arc(snowman.x, snowman.y - baseRadius * 2 - midRadius, midRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Head circle
    this.ctx.beginPath();
    this.ctx.arc(snowman.x, snowman.y - baseRadius * 2 - midRadius * 2 - headRadius, headRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(snowman.x - headRadius * 0.3, snowman.y - baseRadius * 2 - midRadius * 2 - headRadius - headRadius * 0.1, headRadius * 0.15, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(snowman.x + headRadius * 0.3, snowman.y - baseRadius * 2 - midRadius * 2 - headRadius - headRadius * 0.1, headRadius * 0.15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Carrot nose
    this.ctx.fillStyle = 'orange';
    this.ctx.beginPath();
    this.ctx.moveTo(snowman.x, snowman.y - baseRadius * 2 - midRadius * 2 - headRadius);
    this.ctx.lineTo(snowman.x + headRadius * 0.7, snowman.y - baseRadius * 2 - midRadius * 2 - headRadius);
    this.ctx.lineTo(snowman.x, snowman.y - baseRadius * 2 - midRadius * 2 - headRadius + headRadius * 0.3);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Scarf
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(
      snowman.x - midRadius - midRadius * 0.2,
      snowman.y - baseRadius * 2 - midRadius - midRadius * 0.3,
      midRadius * 2.4,
      midRadius * 0.6
    );
    
    // Scarf end
    this.ctx.beginPath();
    this.ctx.moveTo(snowman.x + midRadius, snowman.y - baseRadius * 2 - midRadius);
    this.ctx.lineTo(snowman.x + midRadius * 1.3, snowman.y - baseRadius * 2);
    this.ctx.lineTo(snowman.x + midRadius * 0.8, snowman.y - baseRadius * 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Buttons
    this.ctx.fillStyle = 'black';
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(snowman.x, snowman.y - baseRadius * 2 - midRadius + midRadius * 0.5 * i - midRadius * 0.5, midRadius * 0.1, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Hat
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(
      snowman.x - headRadius * 0.8,
      snowman.y - baseRadius * 2 - midRadius * 2 - headRadius * 2,
      headRadius * 1.6,
      headRadius
    );
    
    this.ctx.fillRect(
      snowman.x - headRadius * 1.2,
      snowman.y - baseRadius * 2 - midRadius * 2 - headRadius * 2 + headRadius,
      headRadius * 2.4,
      headRadius * 0.3
    );
    
    // Optional: Add some lights or glow effects if snowman is active
    if (snowman.pattern === AnimationPattern.BLINK) {
      this.ctx.fillStyle = snowman.color;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = snowman.color;
      
      // Draw small lights around the snowman
      const lightCount = 8;
      for (let i = 0; i < lightCount; i++) {
        const angle = (i / lightCount) * Math.PI * 2;
        const radius = baseRadius * 1.5;
        const lightX = snowman.x + Math.cos(angle) * radius;
        const lightY = snowman.y - baseRadius + Math.sin(angle) * radius;
        
        this.ctx.beginPath();
        this.ctx.arc(lightX, lightY, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.shadowBlur = 0;
    }
  }
  
  private drawStar(star: LightElement): void {
    // Star with glow effect
    this.ctx.fillStyle = star.color;
    
    // Add strong glow
    this.ctx.shadowBlur = 20 * star.brightness;
    this.ctx.shadowColor = star.color;
    
    // Draw star shape
    const cx = star.x;
    const cy = star.y;
    const spikes = 5;
    const outerRadius = star.width / 2;
    const innerRadius = outerRadius * 0.4;
    
    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i / spikes) - Math.PI / 2;
      
      if (i === 0) {
        this.ctx.moveTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      } else {
        this.ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
    
    // Add pulsing inner glow
    const pulse = (Math.sin(this.time * 3) * 0.5 + 0.5) * star.brightness;
    const innerGlow = `rgba(255, 255, 200, ${pulse * 0.8})`;
    
    this.ctx.fillStyle = innerGlow;
    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = (i % 2 === 0 ? outerRadius : innerRadius) * 0.7;
      const angle = (Math.PI * i / spikes) - Math.PI / 2;
      
      if (i === 0) {
        this.ctx.moveTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      } else {
        this.ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    
    // Add rays of light from the star for extra effect
    if (star.pattern === AnimationPattern.STROBE && star.state.strobePhase < 0.2) {
      this.ctx.strokeStyle = `rgba(255, 255, 200, ${0.6 * star.brightness})`;
      this.ctx.lineWidth = 1;
      
      const rayCount = 12;
      const rayLength = star.width * 2;
      
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const startX = cx + Math.cos(angle) * outerRadius;
        const startY = cy + Math.sin(angle) * outerRadius;
        const endX = cx + Math.cos(angle) * rayLength;
        const endY = cy + Math.sin(angle) * rayLength;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
      }
    }
  }
  
  private drawGift(gift: LightElement): void {
    // Gift box
    this.ctx.fillStyle = gift.color;
    this.ctx.fillRect(
      gift.x - gift.width / 2,
      gift.y - gift.height,
      gift.width,
      gift.height
    );
    
    // Box lid
    this.ctx.fillStyle = this.ctx.fillStyle === 'red' ? 'rgb(200, 0, 0)' : 'rgb(150, 0, 0)';
    this.ctx.fillRect(
      gift.x - gift.width / 2 - gift.width * 0.1,
      gift.y - gift.height - gift.height * 0.2,
      gift.width * 1.2,
      gift.height * 0.2
    );
    
    // Ribbon
    this.ctx.fillStyle = 'gold';
    
    // Vertical ribbon
    this.ctx.fillRect(
      gift.x - gift.width * 0.1,
      gift.y - gift.height - gift.height * 0.2,
      gift.width * 0.2,
      gift.height * 1.2
    );
    
    // Horizontal ribbon
    this.ctx.fillRect(
      gift.x - gift.width / 2,
      gift.y - gift.height - gift.height * 0.1 + gift.height * 0.5,
      gift.width,
      gift.height * 0.2
    );
    
    // Ribbon bow
    this.ctx.beginPath();
    this.ctx.ellipse(
      gift.x - gift.width * 0.15,
      gift.y - gift.height - gift.height * 0.2,
      gift.width * 0.2,
      gift.height * 0.1,
      Math.PI / 4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.ellipse(
      gift.x + gift.width * 0.15,
      gift.y - gift.height - gift.height * 0.2,
      gift.width * 0.2,
      gift.height * 0.1,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    
    // Add sparkle or glow effect if alternating
    if (gift.pattern === AnimationPattern.ALTERNATE) {
      this.ctx.shadowBlur = 15 * gift.brightness;
      this.ctx.shadowColor = 'gold';
      
      // Draw sparkles
      const sparkleCount = 5;
      for (let i = 0; i < sparkleCount; i++) {
        const sparkleX = gift.x - gift.width / 2 + Math.random() * gift.width;
        const sparkleY = gift.y - gift.height + Math.random() * gift.height;
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.shadowBlur = 0;
    }
  }
  
  // Method to clean up resources
  public destroy(): void {
    super.destroy();
  }
}

export default HolidayVisualization;
