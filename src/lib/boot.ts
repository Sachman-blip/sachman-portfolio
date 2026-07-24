// Award-style boot sequence. The overlay markup ships in the HTML (so it paints
// instantly, before the module loads), and this drives a fake-but-satisfying
// system-init: a climbing counter, a streaming log of subsystems coming online,
// then a curtain reveal. Skipped fast under reduced motion.

import { emit } from './bus';

const LINES = [
  'INIT RENDER PIPELINE',
  'MOUNTING SMOOTH-SCROLL RIG',
  'CALIBRATING CURSOR LENS',
  'SPOOLING GSAP TIMELINES',
  'DECODING HERO FRAME',
  'ALLOCATING WEBGL CONTEXT',
  'LINKING TELEMETRY BUS',
  'SYSTEM READY',
];

// A single-frame accent bloom as the curtain lifts — the "ignition" of the site.
function ignite(): void {
  const f = document.createElement('div');
  f.className = 'boot-flash';
  document.body.appendChild(f);
  requestAnimationFrame(() => f.classList.add('on'));
  window.setTimeout(() => f.remove(), 900);
}

function done(boot: HTMLElement, flash: boolean): void {
  boot.classList.add('done');
  const root = document.documentElement;
  root.classList.remove('booting'); // release the scroll lock
  root.classList.add('booted');
  if (flash) ignite();
  // Fire as the curtain BEGINS lifting so the hero entrance plays on-screen,
  // sweeping into view with the curtain rather than hidden behind it.
  emit('ss:booted');
  window.setTimeout(() => boot.remove(), 720);
}

export function initBoot(): void {
  const boot = document.getElementById('boot');
  if (!boot) {
    emit('ss:booted');
    return;
  }
  document.documentElement.classList.add('booting');

  const bar = document.getElementById('bootBar');
  const pctEl = document.getElementById('bootPct');
  const log = document.getElementById('bootLog');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    if (pctEl) pctEl.textContent = '100';
    if (bar) bar.style.transform = 'scaleX(1)';
    if (log) log.textContent = LINES[LINES.length - 1];
    window.setTimeout(() => done(boot, false), 200);
    return;
  }

  let pct = 0;
  let shown = 0;
  const start = performance.now();
  const DURATION = 1500;

  const tick = (now: number) => {
    const t = Math.min((now - start) / DURATION, 1);
    // ease-out so it decelerates into 100
    const eased = 1 - Math.pow(1 - t, 3);
    pct = Math.round(eased * 100);

    if (pctEl) pctEl.textContent = String(pct);
    if (bar) bar.style.transform = `scaleX(${eased})`;
    boot.style.setProperty('--p', eased.toFixed(3)); // drives the monogram glow ramp

    const targetLines = Math.floor((pct / 100) * LINES.length);
    while (shown < targetLines && shown < LINES.length) {
      if (log) {
        const line = document.createElement('span');
        line.textContent = `› ${LINES[shown]}`;
        log.appendChild(line);
      }
      shown++;
    }

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // ensure the final line ("SYSTEM READY") shows
      while (shown < LINES.length) {
        if (log) {
          const line = document.createElement('span');
          line.textContent = `› ${LINES[shown]}`;
          log.appendChild(line);
        }
        shown++;
      }
      window.setTimeout(() => done(boot, true), 320);
    }
  };
  requestAnimationFrame(tick);
}
