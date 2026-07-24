// Work rows come alive — as the cursor moves across a row, the big project name
// slides toward it and the index number drifts the opposite way for depth, with
// a snappy spring. Uses the row's own transform slot (the hover CSS only touches
// colour/padding, so no conflict). Pointer devices only.

export function initWorkPhysics(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return;

  const rows = Array.from(document.querySelectorAll<HTMLElement>('.work-row'));

  rows.forEach((row) => {
    const name = row.querySelector<HTMLElement>('.work-name');
    const no = row.querySelector<HTMLElement>('.work-no');
    if (!name) return;

    const spring = 'transform 0.22s cubic-bezier(0.2, 0.7, 0.2, 1)';

    row.addEventListener('pointerenter', () => {
      name.style.transition = spring + ', color 0.4s';
      if (no) no.style.transition = spring + ', color 0.4s';
    });

    row.addEventListener('pointermove', (e) => {
      const r = row.getBoundingClientRect();
      const rx = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
      const ry = (e.clientY - r.top) / r.height - 0.5;
      name.style.transform = `translate(${(rx * 36).toFixed(1)}px, ${(ry * 9).toFixed(1)}px)`;
      if (no) no.style.transform = `translateX(${(rx * -14).toFixed(1)}px)`;
    });

    row.addEventListener('pointerleave', () => {
      name.style.transform = '';
      if (no) no.style.transform = '';
    });
  });
}
