// Vertex Shader
varying vec2 vUv;
varying float vHeight;

void main() {
  vUv = uv;
  vHeight = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform sampler2D snowTexture;
uniform float time;
uniform float noiseScale;
uniform float snowBrightness;

varying vec2 vUv;
varying float vHeight;

// Simplex noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  // Create dynamic snow surface with noise
  float noise = snoise(vUv * noiseScale + vec2(time * 0.1));
  
  // Base snow color with slight blue tint
  vec3 snowColor = vec3(0.9, 0.95, 1.0);
  
  // Add sparkle effect
  float sparkle = pow(max(0.0, snoise(vUv * 50.0 + time * 0.2)), 20.0) * 0.5;
  
  // Add height-based shading
  float heightFactor = vHeight * 0.5 + 0.5;
  
  // Combine all effects
  vec3 finalColor = snowColor * (noise * 0.2 + 0.8) * heightFactor;
  finalColor += vec3(sparkle);
  
  // Apply overall brightness
  finalColor *= snowBrightness;
  
  gl_FragColor = vec4(finalColor, 1.0);
}