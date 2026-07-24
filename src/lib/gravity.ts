// Interactive headings — cursor "gravity". The big display headings lean and
// drift toward the pointer when it comes near, with a spring and a subtle 3D
// tilt, then settle back when it leaves. Applied only to heading CONTAINERS that
// GSAP animates the children of (never the container itself), so it can't fight
// the reveal animations. Desktop pointers only; skipped under reduced motion.

const SELECTORS = [
  '.hero-name',
  '.story-head',
  '.disc-title',
  '.road-quote',
  '.contact-statement',
  '.stats-title',
];

type Item = {
  el: HTMLElement;
  tx: number;
  ty: number;
  rx: number;
  ry: number;
};

export function initGravity(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return;

  const els = SELECTORS.flatMap((s) => Array.from(document.querySelectorAll<HTMLElement>(s)));
  if (!els.length) return;

  const items: Item[] = els.map((el) => {
    el.style.willChange = 'transform';
    return { el, tx: 0, ty: 0, rx: 0, ry: 0 };
  });

  // only react to headings currently on screen
  const visible = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
  });
  items.forEach((it) => io.observe(it.el));

  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

  const loop = () => {
    requestAnimationFrame(loop);
    for (const it of items) {
      let targetX = 0;
      let targetY = 0;
      let rotX = 0;
      let rotY = 0;

      if (visible.has(it.el)) {
        const r = it.el.getBoundingClientRect();
        const dx = mx - (r.left + r.width / 2);
        const dy = my - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        const fall = Math.max(0, 1 - dist / 650); // gravity well radius
        targetX = clamp(dx * 0.09 * fall, 20);
        targetY = clamp(dy * 0.09 * fall, 16);
        rotY = clamp(dx * 0.01 * fall, 6);
        rotX = clamp(-dy * 0.01 * fall, 6);
      }

      it.tx += (targetX - it.tx) * 0.08;
      it.ty += (targetY - it.ty) * 0.08;
      it.rx += (rotX - it.rx) * 0.08;
      it.ry += (rotY - it.ry) * 0.08;

      it.el.style.transform =
        `perspective(900px) translate3d(${it.tx.toFixed(2)}px,${it.ty.toFixed(2)}px,0) ` +
        `rotateX(${it.rx.toFixed(2)}deg) rotateY(${it.ry.toFixed(2)}deg)`;
    }
  };
  requestAnimationFrame(loop);
}
