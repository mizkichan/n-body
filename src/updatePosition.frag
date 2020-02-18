precision mediump float;
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
const float textureSize = 64.0;

void main() {
  vec2 coord = gl_FragCoord.xy / textureSize;
  vec3 x = texture2D(positionTexture, coord).xyz; // position
  vec3 v = texture2D(velocityTexture, coord).xyz; // velocity
  gl_FragColor = vec4(x + v, 1.0);
}

/* vim: set ft=c ts=2 sw=2 et: */
