// The living background of the WHOLE site. A full-viewport particle flow-field:
// particles drift along a domain-warped pseudo-noise field leaving glowing
// accent trails, swirl into a vortex around the cursor, and a few brighter
// "sparks" add depth. It becomes the page background (body goes transparent only
// once this mounts), so every section floats over the same living field.
//
// Pure Canvas2D — no libraries. Pauses when the tab is hidden, thins under the
// perf guardian's low-FX mode, renders a static frame under reduced motion, and
// bows out entirely on data-saver (leaving the solid dark background).

import { on } from './bus';
import { getQuality } from './perf';
import { getBars } from './audio';

type P = { x: number; y: number; spark: boolean };

// Domain-warped field → an organic, evolving flow angle at (x, y, t).
function fieldAngle(x: number, y: number, t: number): number {
  const w1 = Math.sin(x * 0.0016 + t) + Math.cos(y * 0.0018 - t * 0.7);
  const w2 = Math.sin((x + y) * 0.0011 + t * 0.4) + Math.cos((x - y) * 0.0013 - t * 0.5);
  return (w1 + w2) * (Math.PI * 0.6);
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/(.)/g, '$1$1') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function initFlowField(): void {
  // Data-saver: keep the solid dark background instead of an animated canvas.
  if ((navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'flow-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    canvas.remove();
    return;
  }

  // Hand the page background over to the field.
  document.documentElement.classList.add('livebg');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0;
  let H = 0;

  const accentHex = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#c8ff00';
  let accent = accentHex();
  on('ss:accent', () => (accent = accentHex()));

  let particles: P[] = [];
  const seed = () => {
    const base = Math.min(Math.floor(W / 6), 340);
    const count = getQuality() === 'LOW' ? Math.floor(base * 0.45) : base;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      spark: Math.random() < 0.08,
    }));
  };

  const resize = () => {
    // A soft particle field doesn't need full retina — cap DPR to keep the
    // per-frame fullscreen fill cheap (lower still under the perf guardian).
    const dpr = getQuality() === 'LOW' ? 1 : Math.min(devicePixelRatio, 1.5);
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
    seed();
  };
  resize();
  addEventListener('resize', () => requestAnimationFrame(resize));

  // cursor (field vortex origin); starts off-canvas
  const mouse = { x: -9999, y: -9999 };
  addEventListener(
    'pointermove',
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  // click shockwaves — an expanding ring that shoves the field outward
  type Ripple = { x: number; y: number; r: number; life: number };
  const ripples: Ripple[] = [];
  addEventListener('pointerdown', (e) => {
    if (ripples.length < 6) ripples.push({ x: e.clientX, y: e.clientY, r: 0, life: 1 });
  });

  const R = 190; // cursor influence radius
  const R2 = R * R;
  let t = 0;
  let lastScroll = scrollY;
  let scrollBoost = 0;

  const advance = () => {
    if (W === 0) return;

    // scroll velocity → the field surges while you scroll
    const ds = Math.abs(scrollY - lastScroll);
    lastScroll = scrollY;
    scrollBoost += (Math.min(ds, 70) - scrollBoost) * 0.12;

    // audio level → the field breathes with the sound design (when enabled)
    const audio = getBars(3).reduce((a, b) => a + b, 0) / 3;

    t += 0.0015 + scrollBoost * 0.0002;
    const speedMul = 1 + scrollBoost * 0.02 + audio * 0.5;

    // advance ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].r += 7;
      ripples[i].life -= 0.018;
      if (ripples[i].life <= 0) ripples.splice(i, 1);
    }

    // long, elegant trails (low-alpha dark wash over the previous frame)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(10,10,11,0.055)';
    ctx.fillRect(0, 0, W, H);

    // additive layer for glow
    ctx.globalCompositeOperation = 'lighter';

    // soft accent halo around the cursor, pulsing with audio
    if (mouse.x > -9000) {
      const halo = R * (1 + audio * 0.5);
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, halo);
      g.addColorStop(0, hexA(accent, 0.05 + audio * 0.06));
      g.addColorStop(1, hexA(accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(mouse.x - halo, mouse.y - halo, halo * 2, halo * 2);
    }

    // accent trails in one batched path
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.12 + audio * 0.08;
    ctx.beginPath();
    const sparks: [number, number][] = [];
    for (const p of particles) {
      const a = fieldAngle(p.x, p.y, t);
      let vx = Math.cos(a);
      let vy = Math.sin(a);

      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        const d = Math.sqrt(d2) + 0.001;
        const f = (R2 - d2) / R2;
        // gentle pull + strong swirl → a vortex
        vx += (dx / d) * f * 1.4 + (-dy / d) * f * 2.6;
        vy += (dy / d) * f * 1.4 + (dx / d) * f * 2.6;
      }

      // click shockwaves shove particles along the expanding ring
      for (const rip of ripples) {
        const rdx = p.x - rip.x;
        const rdy = p.y - rip.y;
        const rd = Math.hypot(rdx, rdy) + 0.001;
        const band = rd - rip.r;
        if (Math.abs(band) < 55) {
          const push = (1 - Math.abs(band) / 55) * rip.life * 3.4;
          vx += (rdx / rd) * push;
          vy += (rdy / rd) * push;
        }
      }

      const spd = (p.spark ? 1.8 : 1.1) * speedMul;
      const nx = p.x + vx * spd;
      const ny = p.y + vy * spd;

      if (p.spark) {
        sparks.push([nx, ny]);
      } else {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
      }

      p.x = nx;
      p.y = ny;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      }
    }
    ctx.stroke();

    // faint expanding ring for each shockwave
    for (const rip of ripples) {
      ctx.strokeStyle = hexA(accent, rip.life * 0.16);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // brighter depth sparks
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#f4f4f1';
    for (const [x, y] of sparks) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  let visible = true;
  const loop = () => {
    requestAnimationFrame(loop);
    if (visible && !document.hidden) advance();
  };
  document.addEventListener('visibilitychange', () => (visible = !document.hidden));

  if (reduce) {
    for (let i = 0; i < 80; i++) advance(); // one rich static frame
  } else {
    requestAnimationFrame(loop);
  }
}
