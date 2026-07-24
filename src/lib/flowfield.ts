// A living particle flow-field behind the closing CONTACT section. Particles
// drift along a smooth pseudo-noise field, leaving faint accent trails, and bend
// around the cursor. Pauses when the section is offscreen, thins out under the
// perf guardian's low-FX mode, and renders a single static frame under reduced
// motion. Pure 2D canvas — no extra dependencies.

import { on } from './bus';
import { getQuality } from './perf';

type P = { x: number; y: number };

// cheap smooth field: layered sines → an angle in [0, 2π)
function fieldAngle(x: number, y: number, t: number): number {
  const s =
    Math.sin(x * 0.0022 + t) +
    Math.cos(y * 0.0025 - t * 0.8) +
    Math.sin((x + y) * 0.0015 + t * 0.5);
  return s * Math.PI;
}

export function initFlowField(): void {
  const section = document.getElementById('contact');
  if (!section) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'flow-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  section.insertBefore(canvas, section.firstChild);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0;
  let H = 0;
  let dpr = Math.min(devicePixelRatio, 2);

  const accent = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#c8ff00';
  let stroke = accent();
  on('ss:accent', () => (stroke = accent()));

  let particles: P[] = [];
  const seed = () => {
    const base = Math.min(Math.floor(W / 7), 260);
    const count = getQuality() === 'LOW' ? Math.floor(base * 0.4) : base;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
    }));
  };

  const resize = () => {
    const r = section.getBoundingClientRect();
    W = r.width;
    H = r.height;
    dpr = Math.min(devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    seed();
  };

  // pointer position relative to the canvas (or far away when outside)
  const mouse = { x: -9999, y: -9999 };
  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 }).observe(section);

  let t = 0;

  // One simulation + paint step (no scheduling — callers decide cadence).
  const advance = () => {
    if (W === 0) return;
    t += 0.0016;

    // fade the previous frame slightly → trails
    ctx.fillStyle = 'rgba(10,10,11,0.09)';
    ctx.fillRect(0, 0, W, H);

    ctx.lineWidth = 1;
    ctx.strokeStyle = stroke;
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    for (const p of particles) {
      const a = fieldAngle(p.x, p.y, t);
      let vx = Math.cos(a);
      let vy = Math.sin(a);

      // cursor bend
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 26000) {
        const f = (26000 - d2) / 26000;
        vx += (dx / (Math.sqrt(d2) + 0.001)) * f * 2.2;
        vy += (dy / (Math.sqrt(d2) + 0.001)) * f * 2.2;
      }

      const nx = p.x + vx * 1.1;
      const ny = p.y + vy * 1.1;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      p.x = nx;
      p.y = ny;

      // wrap / respawn
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const loop = () => {
    requestAnimationFrame(loop);
    if (visible) advance();
  };

  const startWhenSized = () => {
    resize();
    if (reduce) {
      // paint a few static frames so it reads as a field, then stop entirely
      for (let i = 0; i < 70; i++) advance();
      return;
    }
    requestAnimationFrame(loop);
  };

  addEventListener('resize', () => {
    // debounce-ish: recompute next frame
    requestAnimationFrame(resize);
  });

  // wait a tick so layout/section height is settled
  requestAnimationFrame(startWhenSized);
}
