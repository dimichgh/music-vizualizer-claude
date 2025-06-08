// Vertex Shader
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

// Fragment Shader
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