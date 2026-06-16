// Fixed heads-up display: a scroll-progress bar plus a live section index and
// label driven by each section's data-hud attribute.

export function initHud(): void {
  const bar = document.getElementById('hudBar');
  const noEl = document.getElementById('hudNo');
  const labelEl = document.getElementById('hudLabel');
  if (!bar) return;

  // Progress bar — updates on scroll (works under Lenis, which drives scrollY).
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(scrollY / max, 1) : 0;
    bar.style.transform = `scaleY(${p})`;
    ticking = false;
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();

  // Section index/label — whichever data-hud section owns the viewport centre.
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-hud]'));
  if (!noEl || !labelEl || sections.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const raw = (entry.target as HTMLElement).dataset.hud ?? '';
        const [no, ...rest] = raw.split('·').map((s) => s.trim());
        noEl.textContent = no;
        labelEl.textContent = rest.join(' · ');
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  sections.forEach((s) => io.observe(s));
}
