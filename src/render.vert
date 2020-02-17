attribute float index;
uniform sampler2D positionTexture;
uniform mat4 perspective;
uniform mat4 lookAt;
const float textureSize = 256.0;

void main() {
  float x = mod(index, textureSize);
  float y = floor(index / textureSize);
  vec2 coord = vec2(x, y) / textureSize;
  vec3 position = texture2D(positionTexture, coord).xyz;
  gl_Position = perspective * lookAt * vec4(position, 1.0);
}

/* vim: set ft=c ts=2 sw=2 et: */
