// GPU fluid background — a real WebGL simulation. A dye field is advected every
// frame through a procedural curl-noise velocity field (plus your cursor's
// motion), with dissipation, and injected with accent-colored "ink" at the
// pointer. Semi-Lagrangian advection on ping-ponged RGBA8 textures at half-res:
// robust across GPUs (no float-texture extensions needed), cheap, and it reads
// as flowing smoke/ink that swirls around the cursor.
//
// initFluid() returns true if it mounted. On ANY failure it cleans up and
// returns false so the caller can fall back to the Canvas2D flow-field.

import { on } from './bus';
import { currentAccent } from './theme';
import { getQuality } from './perf';
import { getBars } from './audio';

const QUAD_VERT = `
attribute vec2 a;
varying vec2 v_uv;
void main() { v_uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }
`;

const SIM_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_dye;
uniform float u_time;
uniform float u_dt;
uniform vec2 u_pointer;
uniform vec2 u_pointerVel;
uniform float u_down;
uniform float u_audio;
uniform vec3 u_accent;
uniform float u_aspect;
uniform float u_dissipation;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
vec2 curl(vec2 p){
  float e = 0.09;
  float n1 = fbm(p + vec2(0.0, e));
  float n2 = fbm(p - vec2(0.0, e));
  float n3 = fbm(p + vec2(e, 0.0));
  float n4 = fbm(p - vec2(e, 0.0));
  return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
}

void main(){
  vec2 uv = v_uv;
  vec2 p = vec2(uv.x * u_aspect, uv.y);

  vec2 vel = curl(p * 2.6 + vec2(0.0, u_time * 0.04)) * 0.024;

  vec2 pv = vec2((uv.x - u_pointer.x) * u_aspect, uv.y - u_pointer.y);
  float pd = exp(-dot(pv, pv) * 55.0);
  vel += u_pointerVel * pd * 2.6;

  vec2 velUV = vec2(vel.x / u_aspect, vel.y);
  vec3 dye = texture2D(u_dye, uv - velUV * u_dt).rgb * u_dissipation;

  // pointer injects ink (kept modest so text stays readable)
  float inject = pd * (0.10 + u_down * 0.35 + u_audio * 0.28);
  dye += u_accent * inject;

  // structured ambient seed — sparse drifting filaments so the field is alive
  // and flowing even before the cursor touches it (dim, so it reads as texture)
  float seed = fbm(p * 4.2 - vec2(u_time * 0.03, u_time * 0.015));
  seed = smoothstep(0.66, 0.95, seed);
  dye += u_accent * seed * 0.005;

  gl_FragColor = vec4(dye, 1.0);
}
`;

const SHOW_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_dye;
void main(){
  vec3 dye = texture2D(u_dye, v_uv).rgb;
  vec3 base = vec3(0.039, 0.039, 0.043);
  // dim the dye so it's a quiet backdrop that text reads cleanly over
  vec3 col = base + dye * 0.5;
  vec2 q = v_uv - 0.5;
  col *= 1.0 - 0.42 * dot(q, q);
  gl_FragColor = vec4(col, 1.0);
}
`;

function makeShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function makeProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const v = makeShader(gl, gl.VERTEX_SHADER, vs);
  const f = makeShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  return p;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function initFluid(): boolean {
  if ((navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData) return false;

  const canvas = document.createElement('canvas');
  canvas.className = 'flow-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const gl = (canvas.getContext('webgl', { alpha: false, antialias: false, depth: false }) ||
    canvas.getContext('experimental-webgl', { alpha: false })) as WebGLRenderingContext | null;
  if (!gl) return false;

  const simProg = makeProgram(gl, QUAD_VERT, SIM_FRAG);
  const showProg = makeProgram(gl, QUAD_VERT, SHOW_FRAG);
  if (!simProg || !showProg) return false;

  // fullscreen triangle
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const bindQuad = (prog: WebGLProgram) => {
    const loc = gl.getAttribLocation(prog, 'a');
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  };

  // ping-pong dye targets
  let simW = 0;
  let simH = 0;
  type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };
  const makeTarget = (w: number, h: number): Target | null => {
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  };

  const coarse = matchMedia('(pointer: coarse)').matches;
  const computeSize = () => {
    // lighter simulation grid on phones/tablets and under the perf guardian
    const scale = getQuality() === 'LOW' ? 0.3 : coarse ? 0.4 : 0.5;
    simW = Math.max(2, Math.floor(innerWidth * scale));
    simH = Math.max(2, Math.floor(innerHeight * scale));
  };
  computeSize();
  const t0 = makeTarget(simW, simH);
  const t1 = makeTarget(simW, simH);
  if (!t0 || !t1) return false;

  // check the framebuffer is actually usable
  gl.bindFramebuffer(gl.FRAMEBUFFER, t0.fbo);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return false;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // ping-pong holder (always non-null, so no closure-narrowing headaches)
  const T = { a: t0, b: t1 };

  // Everything is valid → mount and take over the page background.
  document.body.appendChild(canvas);
  document.documentElement.classList.add('livebg');

  const resizeCanvas = () => {
    const dpr = Math.min(devicePixelRatio, coarse ? 1.5 : 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
  };
  resizeCanvas();

  let accent = hexToRgb(currentAccent().value);
  on('ss:accent', () => (accent = hexToRgb(currentAccent().value)));

  // pointer in uv (y flipped for GL), with smoothed velocity
  const ptr = { x: 0.5, y: 0.5, vx: 0, vy: 0, down: 0 };
  let lastPx = 0.5;
  let lastPy = 0.5;
  addEventListener(
    'pointermove',
    (e) => {
      ptr.x = e.clientX / innerWidth;
      ptr.y = 1 - e.clientY / innerHeight;
    },
    { passive: true }
  );
  addEventListener('pointerdown', () => (ptr.down = 1));
  addEventListener('pointerup', () => (ptr.down = 0));

  addEventListener('resize', () => {
    resizeCanvas();
    computeSize();
    const n0 = makeTarget(simW, simH);
    const n1 = makeTarget(simW, simH);
    if (n0 && n1) {
      gl.deleteTexture(T.a.tex);
      gl.deleteFramebuffer(T.a.fbo);
      gl.deleteTexture(T.b.tex);
      gl.deleteFramebuffer(T.b.fbo);
      T.a = n0;
      T.b = n1;
    }
  });

  const uni = (prog: WebGLProgram, name: string) => gl.getUniformLocation(prog, name);
  const su = {
    dye: uni(simProg, 'u_dye'),
    time: uni(simProg, 'u_time'),
    dt: uni(simProg, 'u_dt'),
    pointer: uni(simProg, 'u_pointer'),
    pointerVel: uni(simProg, 'u_pointerVel'),
    down: uni(simProg, 'u_down'),
    audio: uni(simProg, 'u_audio'),
    accent: uni(simProg, 'u_accent'),
    aspect: uni(simProg, 'u_aspect'),
    dissipation: uni(simProg, 'u_dissipation'),
  };
  const du = { dye: uni(showProg, 'u_dye') };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let visible = true;
  document.addEventListener('visibilitychange', () => (visible = !document.hidden));

  const frame = (nowMs: number) => {
    // smooth pointer velocity, decay when still
    const rawvx = ptr.x - lastPx;
    const rawvy = ptr.y - lastPy;
    lastPx = ptr.x;
    lastPy = ptr.y;
    ptr.vx = ptr.vx * 0.8 + rawvx * 0.2;
    ptr.vy = ptr.vy * 0.8 + rawvy * 0.2;

    const audio = getBars(3).reduce((s, v) => s + v, 0) / 3;

    // --- simulation pass: read T.a, write T.b ---
    gl.useProgram(simProg);
    bindQuad(simProg);
    gl.viewport(0, 0, simW, simH);
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.b.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, T.a.tex);
    gl.uniform1i(su.dye, 0);
    gl.uniform1f(su.time, (nowMs - start) / 1000);
    gl.uniform1f(su.dt, 1.0);
    gl.uniform2f(su.pointer, ptr.x, ptr.y);
    gl.uniform2f(su.pointerVel, ptr.vx, ptr.vy);
    gl.uniform1f(su.down, ptr.down);
    gl.uniform1f(su.audio, audio);
    gl.uniform3f(su.accent, accent[0], accent[1], accent[2]);
    gl.uniform1f(su.aspect, innerWidth / innerHeight);
    gl.uniform1f(su.dissipation, 0.972);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // --- display pass: read T.b, write screen ---
    gl.useProgram(showProg);
    bindQuad(showProg);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, T.b.tex);
    gl.uniform1i(du.dye, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // swap
    const tmp = T.a;
    T.a = T.b;
    T.b = tmp;
  };

  const loop = (now: number) => {
    requestAnimationFrame(loop);
    if (visible && !document.hidden) frame(now);
  };

  if (reduce) {
    for (let i = 0; i < 60; i++) frame(start + i * 16);
  } else {
    requestAnimationFrame(loop);
  }
  return true;
}
