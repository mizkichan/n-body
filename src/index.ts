import { vec3, mat4 } from "gl-matrix";
import renderVert from "./render.vert";
import renderFrag from "./render.frag";
import updateVert from "./update.vert";
import updatePositionFrag from "./updatePosition.frag";
import updateVelocityFrag from "./updatePosition.frag";

const TEXTURE_SIZE = 256;

interface Program {
  program: WebGLProgram;
  attributes: { [name: string]: GLint };
  uniforms: { [name: string]: WebGLUniformLocation };
}

interface Framebuffer {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
}

function main() {
  const canvas = document.querySelector("canvas")!;
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.onresize = resize;
  resize();

  const gl = canvas.getContext("webgl")!;
  gl.getExtension("OES_texture_float");
  gl.getExtension("WEBGL_color_buffer_float");

  // プログラムの作成
  const renderProgram = createProgram(gl, renderVert, renderFrag, {
    attributes: ["index"],
    uniforms: ["positionTexture", "perspective", "lookAt"]
  });
  const updatePositionProgram = createProgram(
    gl,
    updateVert,
    updatePositionFrag,
    {
      attributes: ["position"],
      uniforms: ["positionTexture", "velocityTexture"]
    }
  );
  const updateVelocityProgram = createProgram(
    gl,
    updateVert,
    updateVelocityFrag,
    {
      attributes: ["position"],
      uniforms: ["positionTexture", "velocityTexture"]
    }
  );

  // 位置テクスチャの初期化
  const positions = range(TEXTURE_SIZE ** 2).flatMap(() =>
    randomPointInSphere(1)
  );
  let frontPositionTexture = createFrameBuffer(gl, TEXTURE_SIZE, positions);
  let backPositionTexture = createFrameBuffer(gl, TEXTURE_SIZE, positions);

  // 速度テクスチャの初期化
  const velocities = range(TEXTURE_SIZE ** 2).flatMap(() =>
    randomPointInSphere(0.001)
  );
  let frontVelocityTexture = createFrameBuffer(gl, TEXTURE_SIZE, velocities);
  let backVelocityTexture = createFrameBuffer(gl, TEXTURE_SIZE, velocities);

  // プレーンバッファの定義
  const planeBuffer = createBuffer(
    gl,
    // prettier-ignore
    [
      -1,  1,
      -1, -1,
       1,  1,
       1, -1,
    ]
  );

  // インデックスバッファの定義
  const indexBuffer = createBuffer(gl, range(TEXTURE_SIZE ** 2));

  // 変換行列の初期化
  const perspective = mat4.create();
  const lookAt = mat4.create();

  // 速度更新処理
  const updateVelocity = () => {
    gl.useProgram(updateVelocityProgram.program);
    gl.viewport(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    // 更新対象のフレームバッファをバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, frontVelocityTexture.framebuffer);

    // テクスチャをバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backPositionTexture.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, backVelocityTexture.texture);

    // バッファをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffer);

    // attributes の設定
    gl.vertexAttribPointer(
      updateVelocityProgram.attributes.position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(updateVelocityProgram.attributes.position);

    // uniforms の設定
    gl.uniform1i(updateVelocityProgram.uniforms.positionTexture, 0);
    gl.uniform1i(updateVelocityProgram.uniforms.velocityTexture, 1);

    // 更新
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // アンバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  // 位置更新処理
  const updatePosition = () => {
    gl.useProgram(updatePositionProgram.program);
    gl.viewport(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    // 更新対象のフレームバッファをバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, frontPositionTexture.framebuffer);

    // テクスチャをバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backPositionTexture.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, backVelocityTexture.texture);

    // バッファをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffer);

    // attributes の設定
    gl.vertexAttribPointer(
      updatePositionProgram.attributes.position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(updatePositionProgram.attributes.position);

    // uniforms の設定
    gl.uniform1i(updatePositionProgram.uniforms.positionTexture, 0);
    gl.uniform1i(updatePositionProgram.uniforms.velocityTexture, 1);

    // 更新
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // アンバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  // 描画処理
  const render = () => {
    gl.useProgram(renderProgram.program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // テクスチャをバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backPositionTexture.texture);

    // バッファをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);

    // attributes の設定
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
    gl.uniform1i(renderProgram.uniforms.positionTexture, 0);
    mat4.perspective(
      perspective,
      degrees(45), // field of view
      gl.canvas.width / gl.canvas.height, // aspect
      0.01, // near
      1000 // far
    );
    gl.uniformMatrix4fv(renderProgram.uniforms.perspective, false, perspective);
    mat4.lookAt(
      lookAt,
      [0, 3, 0], // eye
      [0, 0, 0], // center
      [0, 0, 1] // up
    );
    gl.uniformMatrix4fv(renderProgram.uniforms.lookAt, false, lookAt);

    // 描画
    gl.drawArrays(gl.POINTS, 0, positions.length / 4);
  };

  const frame = () => {
    // テクスチャのスワップ
    let temp;

    //updateVelocity();

    temp = frontVelocityTexture;
    frontVelocityTexture = backVelocityTexture;
    backVelocityTexture = temp;

    updatePosition();

    temp = frontPositionTexture;
    frontPositionTexture = backPositionTexture;
    backPositionTexture = temp;

    render();

    window.requestAnimationFrame(frame);
  };

  frame();
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

function createBuffer(gl: WebGLRenderingContext, array: number[]): WebGLBuffer {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(array), gl.STATIC_DRAW);
  return buffer;
}

function createFrameBuffer(
  gl: WebGLRenderingContext,
  size: number,
  pixels: number[]
): Framebuffer {
  const framebuffer = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  const texture = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level of detail
    gl.RGBA, // internal format
    size, // width
    size, // height
    0, // border (must be 0)
    gl.RGBA, // format (must be the same as internal format)
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
    0
  );

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture };
}

function degrees(value: number): number {
  return (value * Math.PI) / 180;
}

function range(max: number): number[] {
  const result = [];
  for (let i = 0; i < max; ++i) {
    result.push(i);
  }
  return result;
}

function randomPointInSphere(radius: number): [number, number, number, number] {
  const z = Math.random() * 2 - 1;
  const phi = Math.random() * Math.PI * 2;
  const r = Math.random();
  return [
    radius * r ** (1 / 3) * Math.sqrt(1 - z ** 2) * Math.cos(phi),
    radius * r ** (1 / 3) * Math.sqrt(1 - z ** 2) * Math.sin(phi),
    radius * r ** (1 / 3) * z,
    0
  ];
}

window.onload = main;

// vim: set ts=2 sw=2 et:
