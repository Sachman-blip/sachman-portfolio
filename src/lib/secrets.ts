// Hidden keyword engine + set-piece easter eggs. A rolling buffer of recent
// keystrokes triggers effects when it ends with a known word:
//   matrix  → a burst of accent-tinted digital rain
//   boost   → OVERDRIVE
//   <accent name> → switch the brand colour
// Also exposes triggerMatrix() so the terminal can fire it.

import { isTyping } from './bus';
import { setAccent, ACCENTS } from './theme';
import { toggleOverdrive } from './konami';

let matrixRunning = false;

export function triggerMatrix(durationMs = 6000): void {
  if (matrixRunning) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  matrixRunning = true;

  const canvas = document.createElement('canvas');
  canvas.className = 'matrix-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    matrixRunning = false;
    return;
  }

  const dpr = Math.min(devicePixelRatio, 2);
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  requestAnimationFrame(() => canvas.classList.add('on'));

  const accent = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#c8ff00';
  const glyphs = 'アカサタナハマヤラワ0123456789ABCDEFｦｧｨｩｪｫ<>*/#';
  const fontSize = 16;
  const cols = Math.ceil(innerWidth / fontSize);
  const drops = Array.from({ length: cols }, () => Math.random() * -50);

  const start = performance.now();
  let raf = 0;
  const draw = (now: number) => {
    // fade previous frame for trails
    ctx.fillStyle = 'rgba(10,10,11,0.16)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = `${fontSize}px "Space Mono", monospace`;
    const col = accent();
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[(Math.random() * glyphs.length) | 0];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      ctx.fillStyle = Math.random() < 0.08 ? '#f4f4f1' : col;
      ctx.fillText(ch, x, y);
      if (y > innerHeight && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 1;
    }

    const elapsed = now - start;
    if (elapsed > durationMs - 700) canvas.classList.remove('on'); // fade out
    if (elapsed < durationMs && !reduce) {
      raf = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      window.setTimeout(() => {
        canvas.remove();
        matrixRunning = false;
      }, 700);
    }
  };
  raf = requestAnimationFrame(draw);

  // Esc bails early
  const esc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelAnimationFrame(raf);
      canvas.classList.remove('on');
      window.setTimeout(() => {
        canvas.remove();
        matrixRunning = false;
      }, 400);
      removeEventListener('keydown', esc);
      removeEventListener('resize', resize);
    }
  };
  addEventListener('keydown', esc);
}

export function initSecrets(): void {
  let buffer = '';
  const words = ['matrix', 'boost', ...ACCENTS.map((a) => a.name.replace(/\s+/g, '').toLowerCase())];

  addEventListener('keydown', (e) => {
    if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-16);

    for (const w of words) {
      if (!buffer.endsWith(w)) continue;
      buffer = '';
      if (w === 'matrix') triggerMatrix();
      else if (w === 'boost') toggleOverdrive();
      else {
        const acc = ACCENTS.find((a) => a.name.replace(/\s+/g, '').toLowerCase() === w);
        if (acc) setAccent(acc.value);
      }
      break;
    }
  });
}
