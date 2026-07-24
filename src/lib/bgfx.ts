// Custom GLSL backdrop. A single full-screen fragment shader (raw WebGL, no
// libraries) paints a slow domain-warped fbm flow in near-black with accent-
// tinted filaments, reacting to the cursor, scroll position and live audio
// level. It becomes the page's living background: only when it initializes
// successfully do we make <body> transparent so it shows through the dark
// sections — if WebGL is unavailable the site keeps its solid dark background.

import { on } from './bus';
import { currentAccent } from './theme';
import { getBars } from './audio';
import { getQuality } from './perf';

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_scroll;
uniform vec3 u_accent;
uniform float u_level;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;
  float t = u_time*0.05 + u_scroll*0.0006;

  vec2 q = vec2(fbm(p*1.5 + t), fbm(p*1.5 - t + 3.1));
  float f = fbm(p*2.0 + q*1.6 + vec2(t*0.6, -t*0.4));

  float md = distance(uv, u_mouse);
  float glow = smoothstep(0.55, 0.0, md) * 0.5;
  float fil = smoothstep(0.52, 0.82, f);

  vec3 base = vec3(0.039, 0.039, 0.043);
  vec3 col = base;
  col += u_accent * (fil*0.16 + glow*0.22 + u_level*0.16);
  col *= 1.0 - 0.22*length(p);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function initBgFx(): void {
  const canvas = document.createElement('canvas');
  canvas.id = 'bgfx';
  canvas.setAttribute('aria-hidden', 'true');

  const gl = (canvas.getContext('webgl', { antialias: false, alpha: false }) ||
    canvas.getContext('experimental-webgl', { antialias: false, alpha: false })) as WebGLRenderingContext | null;
  if (!gl) return; // no WebGL → leave the solid dark background in place

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  if (!prog) return;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // full-screen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uScroll = gl.getUniformLocation(prog, 'u_scroll');
  const uAccent = gl.getUniformLocation(prog, 'u_accent');
  const uLevel = gl.getUniformLocation(prog, 'u_level');

  let accent = hexToRgb(currentAccent().value);
  on('ss:accent', () => (accent = hexToRgb(currentAccent().value)));

  const mouse = { x: 0.5, y: 0.5 };
  addEventListener(
    'pointermove',
    (e) => {
      mouse.x = e.clientX / innerWidth;
      mouse.y = 1 - e.clientY / innerHeight;
    },
    { passive: true }
  );

  const resize = () => {
    const scale = getQuality() === 'LOW' ? 0.6 : Math.min(devicePixelRatio, 1.5);
    const w = Math.floor(innerWidth * scale);
    const h = Math.floor(innerHeight * scale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  };
  resize();
  addEventListener('resize', resize);

  // success → mount and hand the page background to the shader
  document.body.appendChild(canvas);
  document.documentElement.classList.add('bgfx');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reduce) requestAnimationFrame(loop);
  });

  const render = (nowMs: number) => {
    resize();
    const level = getBars(3).reduce((a, b) => a + b, 0) / 3;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (nowMs - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, scrollY);
    gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);
    gl.uniform1f(uLevel, level);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now: number) => {
    if (!running) return;
    render(now);
    requestAnimationFrame(loop);
  };

  if (reduce) {
    render(start); // one static frame
  } else {
    requestAnimationFrame(loop);
  }
}
