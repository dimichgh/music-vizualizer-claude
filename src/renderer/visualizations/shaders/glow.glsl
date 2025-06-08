// Vertex Shader
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
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