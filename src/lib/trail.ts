// Fluid cursor trail. Pointer movement emits soft accent-tinted metaballs that
// drift with inertia and fade — a physics-y glow that follows the cursor,
// composited with screen blend so it only adds light. Fixed full-viewport
// canvas below the overlays; skipped under reduced motion, thinned in low-FX.

import { on } from './bus';
import { currentAccent } from './theme';
import { getQuality } from './perf';

type Dot = { x: number; y: number; vx: number; vy: number; life: number; r: number };

export function initTrail(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return; // pointer-driven only

  const canvas = document.createElement('canvas');
  canvas.className = 'trailfx';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = Math.min(devicePixelRatio, 2);
  const resize = () => {
    dpr = Math.min(devicePixelRatio, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  let accent = currentAccent().value;
  on('ss:accent', () => (accent = currentAccent().value));

  const dots: Dot[] = [];
  let lx = 0;
  let ly = 0;
  let has = false;

  addEventListener(
    'pointermove',
    (e) => {
      if (has) {
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        const speed = Math.min(Math.hypot(dx, dy), 60);
        const budget = getQuality() === 'LOW' ? 1 : 2;
        for (let i = 0; i < budget; i++) {
          dots.push({
            x: e.clientX,
            y: e.clientY,
            vx: dx * 0.08 + (Math.random() - 0.5) * 0.6,
            vy: dy * 0.08 + (Math.random() - 0.5) * 0.6,
            life: 1,
            r: 10 + speed * 0.5 + Math.random() * 8,
          });
        }
        const cap = getQuality() === 'LOW' ? 90 : 180;
        if (dots.length > cap) dots.splice(0, dots.length - cap);
      }
      lx = e.clientX;
      ly = e.clientY;
      has = true;
    },
    { passive: true }
  );

  const loop = () => {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'screen';
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.92;
      d.vy *= 0.92;
      d.life -= 0.028;
      if (d.life <= 0) {
        dots.splice(i, 1);
        continue;
      }
      const rad = d.r * d.life;
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, rad);
      const a = (d.life * 0.28).toFixed(3);
      g.addColorStop(0, hexA(accent, a));
      g.addColorStop(1, hexA(accent, '0'));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  };
  requestAnimationFrame(loop);
}

// #rrggbb + alpha(0..1 as string) → rgba()
function hexA(hex: string, a: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/(.)/g, '$1$1') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
