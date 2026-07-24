// "By the numbers" — living data. Count-up stat tiles, an animated SVG skills
// radar, and a scroll-revealed timeline. All content below is placeholder and
// meant to be edited by Sachman with real figures.

// ---- EDIT ME: real numbers make this section land -------------------------
const STATS: { value: number; suffix: string; label: string }[] = [
  { value: 8, suffix: '+', label: 'Years training' },
  { value: 3, suffix: '', label: 'National medals' },
  { value: 6, suffix: '', label: 'Things built' },
  { value: 40, suffix: '+', label: 'CAD parts designed' },
];

const SKILLS: [string, number][] = [
  ['CAD / SolidWorks', 92],
  ['Embedded / STM32', 85],
  ['Controls', 80],
  ['Robotics', 88],
  ['TypeScript / Web', 78],
  ['Kickboxing', 95],
];

const TIMELINE: [string, string][] = [
  ['2016', 'Stepped into the ring — learned there is no ceiling.'],
  ['2019', 'National kickboxing champion.'],
  ['2021', 'First serious build — a 6-DOF robotic arm.'],
  ['2023', 'Deep into embedded systems, controls and CAD.'],
  ['2026', 'Building relentlessly — chasing the next limit.'],
];
// ---------------------------------------------------------------------------

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function buildTiles(row: HTMLElement): (() => void)[] {
  const runners: (() => void)[] = [];
  STATS.forEach((s) => {
    const tile = document.createElement('div');
    tile.className = 'stat-tile';
    const num = document.createElement('span');
    num.className = 'stat-num';
    num.textContent = '0' + s.suffix;
    const lbl = document.createElement('span');
    lbl.className = 'stat-label';
    lbl.textContent = s.label;
    tile.append(num, lbl);
    row.appendChild(tile);

    runners.push(() => {
      if (reduce) {
        num.textContent = s.value + s.suffix;
        return;
      }
      const start = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        num.textContent = Math.round(eased * s.value) + s.suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
  return runners;
}

function buildRadar(host: HTMLElement): void {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 46;
  const n = SKILLS.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const ring = (f: number) =>
    SKILLS.map((_, i) => `${cx + Math.cos(angle(i)) * R * f},${cy + Math.sin(angle(i)) * R * f}`).join(' ');

  const dataPts = SKILLS.map(
    ([, v], i) => `${cx + Math.cos(angle(i)) * R * (v / 100)},${cy + Math.sin(angle(i)) * R * (v / 100)}`
  ).join(' ');

  const axes = SKILLS.map((_, i) => {
    const x = cx + Math.cos(angle(i)) * R;
    const y = cy + Math.sin(angle(i)) * R;
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis"/>`;
  }).join('');

  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon points="${ring(f)}" class="radar-ring"/>`)
    .join('');

  const labels = SKILLS.map(([name], i) => {
    const x = cx + Math.cos(angle(i)) * (R + 20);
    const y = cy + Math.sin(angle(i)) * (R + 20);
    const anchor = Math.abs(Math.cos(angle(i))) < 0.3 ? 'middle' : Math.cos(angle(i)) > 0 ? 'start' : 'end';
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="radar-label">${name}</text>`;
  }).join('');

  host.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" class="radar-svg" role="img" aria-label="Skills radar">
      ${rings}${axes}
      <polygon points="${dataPts}" class="radar-poly"/>
      ${SKILLS.map(([, v], i) => {
        const x = cx + Math.cos(angle(i)) * R * (v / 100);
        const y = cy + Math.sin(angle(i)) * R * (v / 100);
        return `<circle cx="${x}" cy="${y}" r="3" class="radar-node"/>`;
      }).join('')}
      ${labels}
    </svg>`;
}

function buildTimeline(list: HTMLElement): void {
  TIMELINE.forEach(([year, text]) => {
    const li = document.createElement('li');
    li.className = 'tl-item';
    li.innerHTML = `<span class="tl-year">${year}</span><span class="tl-text">${text}</span>`;
    list.appendChild(li);
  });
}

export function initStats(): void {
  const section = document.getElementById('stats');
  const row = document.getElementById('statRow');
  const radar = document.getElementById('radar');
  const timeline = document.getElementById('timeline');
  if (!section || !row || !radar || !timeline) return;

  const runners = buildTiles(row);
  buildRadar(radar);
  buildTimeline(timeline);

  if (reduce) {
    runners.forEach((r) => r());
    radar.classList.add('on');
    section.classList.add('sts-in');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        runners.forEach((r) => r());
        radar.classList.add('on');
        section.classList.add('sts-in');
      });
    },
    { rootMargin: '0px 0px -20% 0px' }
  );
  io.observe(section);
}
