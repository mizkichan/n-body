precision mediump float;
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
const float textureSize = 256.0;

void main() {
  vec2 coord = gl_FragCoord.xy / textureSize;
  vec3 position = texture2D(positionTexture, coord).xyz;
  vec3 velocity = texture2D(velocityTexture, coord).xyz;
  gl_FragColor = vec4(position + velocity, 1.0);
}

/* vim: set ft=c ts=2 sw=2 et: */
