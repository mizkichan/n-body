precision mediump float;
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
const float textureSize = 64.0;

void main() {
  vec2 coord0 = gl_FragCoord.xy / textureSize;
  vec3 x0 = texture2D(positionTexture, coord0).xyz; // position
  vec3 v = texture2D(velocityTexture, coord0).xyz;  // velocity

  vec3 a = vec3(0.0, 0.0, 0.0); // acceleration
  for (float y = 0.0; y < textureSize; ++y) {
    for (float x = 0.0; x < textureSize; ++x) {
      vec2 coord1 = vec2(x, y) / textureSize;
      vec3 x1 = texture2D(positionTexture, coord1).xyz;
      if (x0 == x1) {
        continue;
      }
      float d = distance(x1, x0);
      a += normalize(x1 - x0) / (d * d);
    }
  }

  gl_FragColor = vec4(v + a, 1.0);
}

/* vim: set ft=c ts=2 sw=2 et: */
