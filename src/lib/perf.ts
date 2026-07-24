// Adaptive performance guardian. Samples the frame rate once a second and, if
// the page sustains a low FPS, drops to a lighter visual mode (html.lowfx) that
// trims the most expensive effects (grain, blurs, particle density). Recovers
// automatically when headroom returns. Surfaced in the telemetry HUD.

import { emit } from './bus';

export type Quality = 'HIGH' | 'LOW';
let quality: Quality = 'HIGH';

export function getQuality(): Quality {
  return quality;
}

function set(q: Quality): void {
  if (q === quality) return;
  quality = q;
  document.documentElement.classList.toggle('lowfx', q === 'LOW');
  emit('ss:quality', { quality: q });
}

export function initPerf(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frames = 0;
  let acc = 0;
  let prev = performance.now();
  let lowStreak = 0;
  let highStreak = 0;

  const loop = (now: number) => {
    requestAnimationFrame(loop);
    const dt = now - prev;
    prev = now;
    if (dt > 250) return; // ignore tab-away / GC hitches
    frames++;
    acc += dt;
    if (acc < 1000) return;

    const fps = (frames * 1000) / acc;
    frames = 0;
    acc = 0;

    if (fps < 42) {
      lowStreak++;
      highStreak = 0;
    } else {
      highStreak++;
      lowStreak = 0;
    }

    // Demote after ~3s of sustained low FPS; only promote after longer calm.
    if (quality === 'HIGH' && lowStreak >= 3) set('LOW');
    else if (quality === 'LOW' && highStreak >= 8) set('HIGH');
  };
  requestAnimationFrame(loop);
}
