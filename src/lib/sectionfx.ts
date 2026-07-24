// Scroll-reactive cinematics. A single rAF loop turns scroll velocity into two
// CSS custom properties: --split (chromatic-aberration offset on the big accent
// words) and the opacity of a faint scanline overlay. Everything fades to zero
// when the scroll settles, so it only bites during motion. Disabled under
// reduced motion; the perf guardian's low-FX mode zeroes it via CSS.

export function initSectionFx(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;

  const scan = document.createElement('div');
  scan.className = 'velscan';
  scan.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scan);

  let last = scrollY;
  let vel = 0;

  const loop = () => {
    requestAnimationFrame(loop);
    const dy = scrollY - last;
    last = scrollY;
    // clamp per-frame delta so a jump-scroll doesn't spike, then ease
    vel += (Math.min(Math.abs(dy), 140) - vel) * 0.2;
    const n = Math.min(vel / 95, 1); // 0..1 normalized intensity

    // Only paint the chromatic split while actually moving, so accent words stay
    // clean at rest (a 0px shadow still tints transparent-filled glyphs).
    root.classList.toggle('moving', n > 0.06);
    root.style.setProperty('--split', (n * 3).toFixed(2) + 'px');
    scan.style.opacity = (n * 0.11).toFixed(3);
  };
  requestAnimationFrame(loop);
}
