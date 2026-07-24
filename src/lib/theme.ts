// Live accent theming. The whole site is single-accent (--acc); flipping that
// custom property on :root recolours text strokes, rules, the HUD and — because
// three-hero.ts watches documentElement's style attribute — the WebGL rim light.
// Persisted so a chosen accent survives reloads.

import { emit } from './bus';

export type Accent = { name: string; value: string };

export const ACCENTS: Accent[] = [
  { name: 'ACID LIME', value: '#c8ff00' },
  { name: 'RED LINE', value: '#ff2e2e' },
  { name: 'CYAN', value: '#00e6ff' },
  { name: 'AMBER', value: '#ff9e00' },
  { name: 'MAGENTA', value: '#ff2ea6' },
];

const KEY = 'ss-accent';
let idx = 0;

function apply(persist = true): void {
  const a = ACCENTS[idx];
  const root = document.documentElement;
  root.style.setProperty('--acc', a.value);
  root.style.setProperty('--fight', a.value);
  if (persist) {
    try {
      localStorage.setItem(KEY, a.value);
    } catch {
      /* private mode — ignore */
    }
  }
  emit('ss:accent', a);
}

export function initTheme(): void {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const i = ACCENTS.findIndex((a) => a.value.toLowerCase() === saved.toLowerCase());
      if (i >= 0) idx = i;
    }
  } catch {
    /* ignore */
  }
  apply(false);
}

export function cycleAccent(): Accent {
  idx = (idx + 1) % ACCENTS.length;
  apply();
  return ACCENTS[idx];
}

export function setAccent(value: string): Accent {
  const i = ACCENTS.findIndex((a) => a.value.toLowerCase() === value.toLowerCase());
  if (i >= 0) idx = i;
  apply();
  return ACCENTS[idx];
}

export function currentAccent(): Accent {
  return ACCENTS[idx];
}
