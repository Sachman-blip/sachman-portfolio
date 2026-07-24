// Easter egg: the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) arms OVERDRIVE — a heightened
// visual mode (accent snaps to red-line, grain + scanline intensify, headings
// get an accent glow). Also toggleable from the command palette.

import { emit, isTyping } from './bus';
import { setAccent, cycleAccent } from './theme';
import { blip } from './audio';

const SEQ = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

let overdrive = false;
let prevAccent = '#c8ff00';

function banner(text: string): void {
  const b = document.createElement('div');
  b.className = 'od-banner';
  b.textContent = text;
  document.body.appendChild(b);
  requestAnimationFrame(() => b.classList.add('on'));
  window.setTimeout(() => b.classList.remove('on'), 2200);
  window.setTimeout(() => b.remove(), 2800);
}

export function setOverdrive(next: boolean): boolean {
  if (next === overdrive) return overdrive;
  overdrive = next;
  document.documentElement.classList.toggle('overdrive', overdrive);
  if (overdrive) {
    prevAccent =
      getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#c8ff00';
    setAccent('#ff2e2e');
    banner('OVERDRIVE ENGAGED');
  } else {
    setAccent(prevAccent);
    banner('OVERDRIVE OFF');
  }
  blip();
  emit('ss:overdrive', { on: overdrive });
  return overdrive;
}

export function toggleOverdrive(): boolean {
  return setOverdrive(!overdrive);
}

export function isOverdrive(): boolean {
  return overdrive;
}

export function initKonami(): void {
  let i = 0;
  addEventListener('keydown', (e) => {
    if (isTyping(e.target)) return;
    const want = SEQ[i];
    if (e.key.toLowerCase() === want.toLowerCase()) {
      i++;
      if (i === SEQ.length) {
        i = 0;
        setOverdrive(true);
        // a couple of accent flickers for drama
        window.setTimeout(() => cycleAccent(), 120);
        window.setTimeout(() => setAccent('#ff2e2e'), 260);
      }
    } else {
      // allow a wrong key to be the start of a fresh attempt
      i = e.key === SEQ[0] ? 1 : 0;
    }
  });
}
