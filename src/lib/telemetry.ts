// Engineering-style telemetry overlay: a live readout of render + scroll state
// in the top-left, in the site's mono HUD language. Toggle with `T` or the
// command palette. The rAF loop only writes DOM while the panel is visible.

import { emit, isTyping, on as busOn } from './bus';
import { currentAccent } from './theme';
import { getQuality } from './perf';

type Row = { k: string; el: HTMLElement };

let toggle: (() => boolean) | null = null;

// Toggle the telemetry panel from elsewhere (command palette). No-op until init.
export function toggleTelemetry(): boolean {
  return toggle ? toggle() : false;
}

export function initTelemetry(): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const panel = document.createElement('aside');
  panel.className = 'tele';
  panel.setAttribute('aria-hidden', 'true');

  const rows: Record<string, Row> = {};
  const fields: [string, string][] = [
    ['session', 'SESSION'],
    ['fps', 'FPS'],
    ['frame', 'FRAME'],
    ['scroll', 'SCROLL'],
    ['vel', 'VELOCITY'],
    ['section', 'SECTION'],
    ['cursor', 'CURSOR'],
    ['view', 'VIEWPORT'],
    ['dpr', 'DPR'],
    ['quality', 'QUALITY'],
    ['accent', 'ACCENT'],
  ];

  const head = document.createElement('div');
  head.className = 'tele-head';
  head.innerHTML = '<span class="tele-dot"></span> SYS · TELEMETRY';
  panel.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'tele-grid';
  fields.forEach(([key, label]) => {
    const k = document.createElement('span');
    k.className = 'tele-k';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'tele-v';
    v.textContent = '—';
    grid.append(k, v);
    rows[key] = { k: label, el: v };
  });
  panel.appendChild(grid);
  document.body.appendChild(panel);

  let visible = false;
  const t0 = performance.now();

  // pointer + scroll sampling
  let px = 0;
  let py = 0;
  addEventListener('pointermove', (e) => {
    px = e.clientX;
    py = e.clientY;
  });
  let lastY = scrollY;
  let lastT = performance.now();
  let vel = 0;

  // fps smoothing
  let frames = 0;
  let acc = 0;
  let fps = 0;
  let frameMs = 0;
  let prev = performance.now();
  let writeAcc = 0;

  const set = (key: string, val: string) => {
    const r = rows[key];
    if (r && r.el.textContent !== val) r.el.textContent = val;
  };

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const loop = (now: number) => {
    requestAnimationFrame(loop);
    const dt = now - prev;
    prev = now;
    if (!visible) return;

    frames++;
    acc += dt;
    if (acc >= 250) {
      fps = Math.round((frames * 1000) / acc);
      frameMs = acc / frames;
      frames = 0;
      acc = 0;
    }

    writeAcc += dt;
    if (writeAcc < 100) return; // throttle DOM writes to ~10Hz
    writeAcc = 0;

    // scroll velocity
    const nowT = performance.now();
    const dy = scrollY - lastY;
    const dts = (nowT - lastT) / 1000;
    if (dts > 0) vel = vel * 0.6 + (dy / dts) * 0.4;
    lastY = scrollY;
    lastT = nowT;

    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? (scrollY / max) * 100 : 0;

    const secNo = document.getElementById('hudNo')?.textContent ?? '00';
    const secLabel = document.getElementById('hudLabel')?.textContent ?? 'INTRO';

    set('session', fmtTime(now - t0));
    set('fps', String(fps).padStart(3, ' '));
    set('frame', `${frameMs.toFixed(1)}ms`);
    set('scroll', `${pct.toFixed(1)}%`);
    set('vel', `${Math.abs(vel).toFixed(0)} px/s`);
    set('section', `${secNo} · ${secLabel}`);
    set('cursor', `${px} , ${py}`);
    set('view', `${innerWidth}×${innerHeight}`);
    set('dpr', devicePixelRatio.toFixed(2));
    set('quality', getQuality());
    set('accent', currentAccent().name);
  };
  if (!reduce) requestAnimationFrame(loop);

  const setVisible = (v: boolean) => {
    visible = v;
    panel.classList.toggle('on', v);
    emit('ss:telemetry', { on: v });
  };

  // keep accent field fresh even between throttled writes
  busOn('ss:accent', () => {
    if (visible) set('accent', currentAccent().name);
  });

  addEventListener('keydown', (e) => {
    if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      setVisible(!visible);
    }
  });

  // expose a toggle for the palette
  toggle = () => {
    setVisible(!visible);
    return visible;
  };
}
