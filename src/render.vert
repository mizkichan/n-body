attribute float index;
uniform sampler2D positionTexture;
uniform mat4 perspective;
uniform mat4 lookAt;
const float textureSize = 64.0;

void main() {
  vec2 coord =
      vec2(mod(index, textureSize), floor(index / textureSize)) / textureSize;
  vec3 x = texture2D(positionTexture, coord).xyz; // position
  gl_Position = perspective * lookAt * vec4(x, 1.0);
  gl_PointSize = 2.0;
}

/* vim: set ft=c ts=2 sw=2 et: */
