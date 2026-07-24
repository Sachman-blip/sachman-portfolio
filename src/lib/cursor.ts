// Custom cursor — a crisp leading dot + a liquid trailing ring.
//
// The ring does the expressive work:
//  · velocity squash-&-stretch — it elongates along the direction of travel and
//    thins perpendicular, rotated to the movement angle, so fast flicks feel
//    fluid and springy; it relaxes back to a circle at rest.
//  · magnetic lock-on — over small interactive controls it snaps to the element
//    centre (and the dot hides) so hovers feel deliberate and premium.
//  · click pop — a springy scale on press.
//
// Everything is one rAF loop of exponential springs. Native cursor under
// reduced motion (CSS hides the custom one there).

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const LABELS: Record<string, string> = {
  switch: 'SWITCH',
  view: 'VIEW',
  drag: 'DRAG',
  top: 'TOP ↑',
  link: 'OPEN ↗',
};

export function initCursor(): void {
  if (reduce) return;

  const dot = document.querySelector<HTMLElement>('.cur-dot');
  const ring = document.querySelector<HTMLElement>('.cur-ring');
  const labelEl = document.querySelector<HTMLElement>('.cur-label');
  if (!dot || !ring || !labelEl) return;

  // pointer target
  let tx = innerWidth / 2;
  let ty = innerHeight / 2;
  // dot (fast) + ring (trailing) positions
  let dx = tx;
  let dy = ty;
  let rx = tx;
  let ry = ty;
  // smoothed velocity (px/frame-ish)
  let vx = 0;
  let vy = 0;
  let lastTx = tx;
  let lastTy = ty;
  // ring size + press spring
  let w = 40;
  let targetW = 40;
  let press = 1;
  let pressTarget = 1;
  // magnetic lock
  let magnetEl: HTMLElement | null = null;

  let prev = performance.now();
  const sf = (dt: number, r: number) => 1 - Math.exp(-dt * r);

  addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    dot.classList.add('on');
    ring.classList.add('on');
  });
  addEventListener('pointerdown', () => {
    ring.classList.add('down');
    pressTarget = 0.78;
  });
  addEventListener('pointerup', () => {
    ring.classList.remove('down');
    pressTarget = 1;
  });
  addEventListener('mouseleave', () => {
    dot.classList.remove('on');
    ring.classList.remove('on');
  });

  // Contextual labels + magnetic targeting via delegation on [data-cursor].
  const enter = (el: HTMLElement) => {
    const key = el.dataset.cursor;
    if (!key) return;
    labelEl.textContent = LABELS[key] ?? key.toUpperCase();
    ring.classList.add('labeled');
    dot.classList.add('mini');
    targetW = 84;
    const r = el.getBoundingClientRect();
    // lock onto small controls (buttons/links), not big zones (canvas/media)
    magnetEl = r.width < 260 && r.height < 130 ? el : null;
  };
  const leave = () => {
    ring.classList.remove('labeled');
    dot.classList.remove('mini');
    labelEl.textContent = '';
    targetW = 40;
    magnetEl = null;
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

    // dot chases the true pointer, crisp and quick
    dx += (tx - dx) * sf(dt, 24);
    dy += (ty - dy) * sf(dt, 24);

    // smoothed pointer velocity for the deformation
    vx += (tx - lastTx - vx) * sf(dt, 16);
    vy += (ty - lastTy - vy) * sf(dt, 16);
    lastTx = tx;
    lastTy = ty;

    // ring target: element centre when magnet-locked, else the pointer
    let rtx = tx;
    let rty = ty;
    let locked = false;
    if (magnetEl) {
      const r = magnetEl.getBoundingClientRect();
      if (r.width > 0) {
        rtx = r.left + r.width / 2;
        rty = r.top + r.height / 2;
        locked = true;
      }
    }
    const follow = locked ? 20 : 8;
    rx += (rtx - rx) * sf(dt, follow);
    ry += (rty - ry) * sf(dt, follow);

    // springs for size + press
    w += (targetW - w) * sf(dt, 12);
    press += (pressTarget - press) * sf(dt, 22);

    // ---- deformation ----
    const labeled = ring!.classList.contains('labeled');
    let a = 0;
    let sx = press;
    let sy = press;
    if (!labeled) {
      const speed = Math.hypot(vx, vy);
      const stretch = Math.min(speed * 0.022, 0.42); // cap so it never inverts
      a = (Math.atan2(vy, vx) * 180) / Math.PI;
      sx = press * (1 + stretch);
      sy = press * (1 - stretch * 0.7);
    }

    // dot: round, with a tactile grow on press
    const dotScale = 1 + (1 - press) * 0.8;
    dot!.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%) scale(${dotScale})`;

    ring!.style.width = ring!.style.height = w + 'px';
    ring!.style.transform =
      `translate(${rx}px,${ry}px) translate(-50%,-50%) rotate(${a}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
