// A small fixed controls dock (bottom-left) that makes the hidden feature layer
// discoverable: a ⌘K button that opens the command palette and a sound toggle
// that reflects live state. Everything here is also reachable via the palette
// and keyboard, so the dock is pure affordance.

import { on } from './bus';
import { toggleSound, isSoundOn } from './audio';

export function initDock(): void {
  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.setAttribute('aria-hidden', 'false');

  const cmdBtn = document.createElement('button');
  cmdBtn.type = 'button';
  cmdBtn.className = 'dock-btn dock-cmd';
  cmdBtn.setAttribute('data-cursor', 'view');
  cmdBtn.setAttribute('aria-label', 'Open command palette');
  cmdBtn.innerHTML = '<kbd>⌘</kbd><kbd>K</kbd><span>menu</span>';
  cmdBtn.addEventListener('click', () => {
    (window as unknown as { __ssPalette?: () => void }).__ssPalette?.();
  });

  const soundBtn = document.createElement('button');
  soundBtn.type = 'button';
  soundBtn.className = 'dock-btn dock-sound';
  soundBtn.setAttribute('data-cursor', 'view');
  soundBtn.setAttribute('aria-label', 'Toggle sound');

  const paintSound = (state: boolean) => {
    soundBtn.classList.toggle('on', state);
    soundBtn.innerHTML = `<span class="dock-eq"><i></i><i></i><i></i><i></i></span><span>${
      state ? 'sound on' : 'sound off'
    }</span>`;
  };
  paintSound(isSoundOn());
  soundBtn.addEventListener('click', () => paintSound(toggleSound()));
  on<{ on: boolean }>('ss:sound', (d) => paintSound(d.on));

  dock.append(cmdBtn, soundBtn);
  document.body.appendChild(dock);

  // First-run nudge toward the palette, shown once.
  try {
    if (!localStorage.getItem('ss-seen-cmdk')) {
      on('ss:booted', () => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = 'Press <kbd>⌘</kbd><kbd>K</kbd> — this site has a command palette.';
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('on'));
        window.setTimeout(() => toast.classList.remove('on'), 5200);
        window.setTimeout(() => toast.remove(), 5800);
        try {
          localStorage.setItem('ss-seen-cmdk', '1');
        } catch {
          /* ignore */
        }
      });
    }
  } catch {
    /* ignore */
  }
}
