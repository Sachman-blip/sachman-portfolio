import { gsap } from 'gsap';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pull [data-magnetic] elements toward the cursor when it's nearby — the
// classic award-site "magnetic button" feel.
export function initMagnetic(): void {
  if (reduce) return;
  const els = document.querySelectorAll<HTMLElement>('[data-magnetic]');

  els.forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.4;
    const radius = 90;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > Math.max(r.width, r.height) / 2 + radius) return;
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power3.out' });
    };
    const reset = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
  });
}
