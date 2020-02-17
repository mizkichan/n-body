attribute float index;
uniform sampler2D texture;
uniform float textureSize;
uniform mat4 perspective;
uniform mat4 lookAt;

void main() {
  vec2 coord = vec2(mod(index, textureSize) / textureSize,
                    floor(index / textureSize) / textureSize);
  vec3 position = texture2D(texture, coord).xyz;
  gl_Position = perspective * lookAt * vec4(position, 1.0);
  gl_PointSize = 2.0;
}

/* vim: set ft=c ts=2 sw=2 et: */
