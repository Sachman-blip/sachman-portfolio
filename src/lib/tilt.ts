// Subtle pointer-driven 3D tilt for any [data-tilt] element — the parallax
// "card" feel. Desktop pointers only; disabled under reduced motion. Only
// touches elements that have no other transform, so it can't fight GSAP.

export function initTilt(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return;

  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
  const MAX = 7; // degrees

  els.forEach((el) => {
    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'transform 0.25s var(--ease-smooth)';
    let raf = 0;

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transition = 'transform 0.08s linear';
        el.style.transform = `perspective(760px) rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg)`;
      });
    });

    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.style.transition = 'transform 0.4s var(--ease-smooth)';
      el.style.transform = '';
    });
  });
}
