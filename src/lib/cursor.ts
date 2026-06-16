// Custom invert cursor: a tight white dot + a larger trailing ring that can
// grow and surface a contextual label ("VIEW", "DRAG", "SWITCH"…) over
// interactive zones. Over the hero, reveal.ts takes over the ring's size to
// open the lens — coordinated via the `lens` class on <body>.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const LABELS: Record<string, string> = {
  switch: 'SWITCH',
  view: 'VIEW',
  drag: 'DRAG',
  top: 'TOP ↑',
  link: 'OPEN ↗',
};

export function initCursor(): void {
  if (reduce) return; // reduced motion: native cursor (CSS hides custom one)

  const dot = document.querySelector<HTMLElement>('.cur-dot');
  const ring = document.querySelector<HTMLElement>('.cur-ring');
  const labelEl = document.querySelector<HTMLElement>('.cur-label');
  if (!dot || !ring || !labelEl) return;

  let tx = innerWidth / 2;
  let ty = innerHeight / 2;
  let dx = tx;
  let dy = ty;
  let rx = tx;
  let ry = ty;
  let w = 40; // current ring diameter
  let targetW = 40;
  let prev = performance.now();

  const sf = (dt: number, r: number) => 1 - Math.exp(-dt * r);

  addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    dot.classList.add('on');
    ring.classList.add('on');
  });
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));
  addEventListener('mouseleave', () => {
    dot.classList.remove('on');
    ring.classList.remove('on');
  });

  // Contextual labels via event delegation on [data-cursor].
  const enter = (el: HTMLElement) => {
    const key = el.dataset.cursor;
    if (!key) return;
    const text = LABELS[key] ?? key.toUpperCase();
    labelEl.textContent = text;
    ring.classList.add('labeled');
    targetW = 86;
  };
  const leave = () => {
    ring.classList.remove('labeled');
    labelEl.textContent = '';
    targetW = 40;
  };
  document.addEventListener('pointerover', (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]');
    if (el) enter(el);
  });
  document.addEventListener('pointerout', (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]');
    if (el) leave();
  });

  function loop(now: number) {
    let dt = (now - prev) / 1000;
    prev = now;
    if (dt > 0.05) dt = 0.05;

    dx += (tx - dx) * sf(dt, 16);
    dy += (ty - dy) * sf(dt, 16);
    rx += (tx - rx) * sf(dt, 7);
    ry += (ty - ry) * sf(dt, 7);

    dot!.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
    ring!.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;

    // Hand off ring sizing to reveal.ts while the hero lens is active.
    if (!document.body.classList.contains('lens')) {
      w += (targetW - w) * sf(dt, 12);
      ring!.style.width = ring!.style.height = w + 'px';
    } else {
      w = parseFloat(ring!.style.width) || w; // keep in sync for clean handoff
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
