// Vertex Shader
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

// Fragment Shader
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