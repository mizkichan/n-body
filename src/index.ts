import { vec3, mat4 } from "gl-matrix";
import renderVert from "./render.vert";
import renderFrag from "./render.frag";

const TEXTURE_SIZE = 32;

interface Program {
  program: WebGLProgram;
  attributes: { [name: string]: GLint };
  uniforms: { [name: string]: WebGLUniformLocation };
}

interface Texture {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
}

function main() {
  const canvas = document.querySelector("canvas")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const gl = canvas.getContext("webgl")!;
  gl.getExtension("OES_texture_float");

  // テクスチャの初期化
  const positions = [];
  for (const i of range(0, TEXTURE_SIZE ** 2)) {
    const z = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const r = Math.random();
    positions.push(
      r ** (1 / 3) * Math.sqrt(1 - z ** 2) * Math.cos(phi),
      r ** (1 / 3) * Math.sqrt(1 - z ** 2) * Math.sin(phi),
      r ** (1 / 3) * z
    );
  }
  const texture = createTexture(gl, TEXTURE_SIZE, TEXTURE_SIZE, positions);

  const renderProgram = createProgram(gl, renderVert, renderFrag, {
    attributes: ["index"],
    uniforms: ["texture", "textureSize", "perspective", "lookAt"]
  });
  gl.useProgram(renderProgram.program);

  // attributes の設定
  const indices = range(0, TEXTURE_SIZE ** 2);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(indices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    renderProgram.attributes.index,
    1,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(renderProgram.attributes.index);

  // uniforms の設定

  gl.uniform1f(renderProgram.uniforms.textureSize, TEXTURE_SIZE);

  gl.bindTexture(gl.TEXTURE_2D, texture.texture);
  gl.uniform1i(renderProgram.uniforms.texture, 0);

  const perspective = mat4.create();
  mat4.perspective(
    perspective,
    degrees(45), // field of view
    gl.canvas.width / gl.canvas.height, // aspect
    0.1, // near
    100 // far
  );
  gl.uniformMatrix4fv(
    renderProgram.uniforms.perspective,
    false, // don't transpose
    perspective
  );

  const lookAt = mat4.create();
  mat4.lookAt(
    lookAt,
    [0, 5, 0], // eye
    [0, 0, 0], // center
    [0, 0, 1] // up
  );
  gl.uniformMatrix4fv(
    renderProgram.uniforms.lookAt,
    false, // don't transpose
    lookAt
  );

  // Draw!
  gl.drawArrays(
    gl.POINTS,
    0, // offset
    positions.length / 3 // count
  );
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
  {
    attributes = [],
    uniforms = []
  }: { attributes?: string[]; uniforms?: string[] }
): Program {
  const program = gl.createProgram()!;
  gl.attachShader(
    program,
    createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  );
  gl.attachShader(
    program,
    createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || undefined);
  }

  return {
    program,
    attributes: Object.fromEntries(
      attributes.map(name => [name, gl.getAttribLocation(program, name)])
    ),
    uniforms: Object.fromEntries(
      uniforms.map(name => [name, gl.getUniformLocation(program, name)!])
    )
  };
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  shaderSource: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || undefined);
  }
  return shader;
}

function createTexture(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  pixels: number[]
): Texture {
  const framebuffer = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level of detail
    gl.RGB, // internal format
    width,
    height,
    0, // border (must be 0)
    gl.RGB, // format (must be the same as internal format)
    gl.FLOAT, // type
    Float32Array.from(pixels)
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0 // mipmap level (must be 0)
  );

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture };
}

function degrees(value: number): number {
  return (value * Math.PI) / 180;
}

function* range(min: number, max: number): Generator<number, void, unknown> {
  for (let i = min; i < max; ++i) {
    yield i;
  }
}

window.onload = main;

// vim: set ts=2 sw=2 et:
