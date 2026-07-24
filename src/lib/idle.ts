// Attract mode. After a stretch of no interaction the site drifts into a slow
// ambient "standby" — a centred readout appears and the accent cycles gently.
// Any input instantly restores the previous accent and dismisses it. Skipped
// under reduced motion.

import { cycleAccent, setAccent, currentAccent } from './theme';

const IDLE_MS = 45000;
const CYCLE_MS = 5000;

export function initIdle(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const overlay = document.createElement('div');
  overlay.className = 'attract';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<span class="attract-dot"></span><span class="attract-text">STANDBY</span><span class="attract-sub">move to resume</span>';
  document.body.appendChild(overlay);

  let timer = 0;
  let cycler = 0;
  let idle = false;
  let savedAccent = '';

  const enter = () => {
    idle = true;
    savedAccent = currentAccent().value;
    overlay.classList.add('on');
    cycler = window.setInterval(() => cycleAccent(), CYCLE_MS);
  };

  const exit = () => {
    idle = false;
    overlay.classList.remove('on');
    window.clearInterval(cycler);
    if (savedAccent) setAccent(savedAccent); // restore the visitor's choice
  };

  const activity = () => {
    if (idle) exit();
    window.clearTimeout(timer);
    timer = window.setTimeout(enter, IDLE_MS);
  };

  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((e) =>
    addEventListener(e, activity, { passive: true })
  );
  activity();
}
