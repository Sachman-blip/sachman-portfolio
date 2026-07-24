// Command palette (⌘K / Ctrl+K) — the control surface that ties the whole
// over-engineered layer together. Fuzzy-filter a command list, drive it entirely
// from the keyboard, and fire navigation + every toggle (sound, telemetry,
// accent, overdrive) through it. Built in JS, styled in hud-extra.css.

import { scrollTo } from './smoothScroll';
import { isTyping } from './bus';
import { cycleAccent, setAccent, ACCENTS } from './theme';
import { toggleSound, isSoundOn } from './audio';
import { toggleTelemetry } from './telemetry';
import { toggleOverdrive, isOverdrive } from './konami';

type Cmd = {
  id: string;
  label: string;
  hint: string;
  group: string;
  keywords?: string;
  run: () => void;
  live?: () => string; // dynamic right-side status
};

const SECTIONS: [string, string][] = [
  ['#hero', 'Intro'],
  ['#story', 'Story'],
  ['#discipline', 'Discipline'],
  ['#road', 'The Road'],
  ['#work', 'The Work'],
  ['#three', 'Under the Hood'],
  ['#contact', 'Contact'],
];

function buildCommands(close: () => void): Cmd[] {
  const nav: Cmd[] = SECTIONS.map(([sel, name], i) => ({
    id: `go-${sel}`,
    label: `Go to ${name}`,
    hint: String(i).padStart(2, '0'),
    group: 'NAVIGATE',
    keywords: `jump section ${name}`,
    run: () => {
      close();
      scrollTo(sel);
    },
  }));

  const accents: Cmd[] = ACCENTS.map((a) => ({
    id: `acc-${a.value}`,
    label: `Accent · ${a.name}`,
    hint: '●',
    group: 'THEME',
    keywords: `color accent ${a.name}`,
    run: () => {
      setAccent(a.value);
    },
  }));

  const actions: Cmd[] = [
    {
      id: 'accent-cycle',
      label: 'Cycle accent colour',
      hint: '⇧A',
      group: 'THEME',
      keywords: 'theme color next',
      run: () => cycleAccent(),
    },
    {
      id: 'sound',
      label: 'Toggle sound design',
      hint: 'S',
      group: 'SYSTEM',
      keywords: 'audio mute unmute noise',
      live: () => (isSoundOn() ? 'ON' : 'OFF'),
      run: () => toggleSound(),
    },
    {
      id: 'telemetry',
      label: 'Toggle telemetry HUD',
      hint: 'T',
      group: 'SYSTEM',
      keywords: 'stats fps debug performance',
      run: () => toggleTelemetry(),
    },
    {
      id: 'overdrive',
      label: 'Toggle OVERDRIVE',
      hint: '✦',
      group: 'SYSTEM',
      keywords: 'konami secret rave boost',
      live: () => (isOverdrive() ? 'ON' : 'OFF'),
      run: () => toggleOverdrive(),
    },
    {
      id: 'top',
      label: 'Back to top',
      hint: '↑',
      group: 'NAVIGATE',
      keywords: 'scroll up start',
      run: () => {
        close();
        scrollTo(0);
      },
    },
    {
      id: 'email',
      label: 'Copy email address',
      hint: '✉',
      group: 'CONTACT',
      keywords: 'mail contact clipboard',
      run: () => {
        navigator.clipboard?.writeText('sachman.singh.saund@gmail.com').catch(() => {});
      },
    },
    {
      id: 'insta',
      label: 'Open Instagram',
      hint: '↗',
      group: 'CONTACT',
      keywords: 'social instagram',
      run: () => window.open('https://instagram.com/sachman.singh', '_blank', 'noopener'),
    },
    {
      id: 'source',
      label: 'View source on GitHub',
      hint: '↗',
      group: 'CONTACT',
      keywords: 'code github repo',
      run: () => window.open('https://github.com/Sachman-blip/sachman-portfolio', '_blank', 'noopener'),
    },
  ];

  return [...nav, ...actions, ...accents];
}

function score(cmd: Cmd, q: string): number {
  if (!q) return 1;
  const hay = `${cmd.label} ${cmd.group} ${cmd.keywords ?? ''}`.toLowerCase();
  const needle = q.toLowerCase();
  const idx = hay.indexOf(needle);
  if (idx === -1) {
    // subsequence fallback (fuzzy)
    let j = 0;
    for (let i = 0; i < hay.length && j < needle.length; i++) {
      if (hay[i] === needle[j]) j++;
    }
    return j === needle.length ? 0.3 : 0;
  }
  // earlier + label-start matches rank higher
  const labelHit = cmd.label.toLowerCase().indexOf(needle);
  return 2 - idx * 0.001 + (labelHit === 0 ? 1 : 0);
}

export function initPalette(): void {
  const root = document.createElement('div');
  root.className = 'cmdk';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="cmdk-backdrop"></div>
    <div class="cmdk-panel" role="dialog" aria-label="Command palette">
      <div class="cmdk-search">
        <span class="cmdk-prompt">⌘</span>
        <input class="cmdk-input" type="text" placeholder="Type a command or search…" autocomplete="off" spellcheck="false" />
        <kbd class="cmdk-esc">ESC</kbd>
      </div>
      <ul class="cmdk-list" role="listbox"></ul>
      <div class="cmdk-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> run</span>
        <span>SS · COMMAND</span>
      </div>
    </div>`;
  document.body.appendChild(root);

  const input = root.querySelector<HTMLInputElement>('.cmdk-input')!;
  const list = root.querySelector<HTMLUListElement>('.cmdk-list')!;
  const backdrop = root.querySelector<HTMLElement>('.cmdk-backdrop')!;

  let open = false;
  let active = 0;
  let filtered: Cmd[] = [];

  const close = () => {
    if (!open) return;
    open = false;
    root.classList.remove('on');
    root.setAttribute('aria-hidden', 'true');
  };

  const commands = buildCommands(close);

  const render = () => {
    const q = input.value.trim();
    filtered = commands
      .map((c) => ({ c, s: score(c, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c);

    if (active >= filtered.length) active = Math.max(0, filtered.length - 1);

    list.innerHTML = '';
    let lastGroup = '';
    filtered.forEach((c, i) => {
      if (c.group !== lastGroup && !q) {
        const g = document.createElement('li');
        g.className = 'cmdk-group';
        g.textContent = c.group;
        list.appendChild(g);
        lastGroup = c.group;
      }
      const li = document.createElement('li');
      li.className = 'cmdk-item' + (i === active ? ' active' : '');
      li.setAttribute('role', 'option');
      const live = c.live ? `<span class="cmdk-live">${c.live()}</span>` : '';
      li.innerHTML = `<span class="cmdk-label">${c.label}</span>${live}<kbd class="cmdk-hint">${c.hint}</kbd>`;
      li.addEventListener('pointermove', () => {
        if (active !== i) {
          active = i;
          itemEls().forEach((el, j) => el.classList.toggle('active', j === active));
        }
      });
      li.addEventListener('click', () => run(i));
      list.appendChild(li);
    });
  };

  // `.cmdk-item` nodes line up 1:1 with `filtered` (group headers are separate
  // `.cmdk-group` elements), so indices are interchangeable.
  const itemEls = () => list.querySelectorAll<HTMLElement>('.cmdk-item');

  const run = (i: number) => {
    const cmd = filtered[i];
    if (!cmd) return;
    cmd.run();
    // Navigation commands call close() themselves; for the rest keep the palette
    // open and re-render so live states (sound/telemetry/overdrive) update.
    if (open) render();
  };

  const move = (dir: number) => {
    if (!filtered.length) return;
    active = (active + dir + filtered.length) % filtered.length;
    // repaint active state across current item nodes
    const els = itemEls();
    els.forEach((el, i) => el.classList.toggle('active', i === active));
    els[active]?.scrollIntoView({ block: 'nearest' });
  };

  const show = () => {
    open = true;
    active = 0;
    input.value = '';
    render();
    root.classList.add('on');
    root.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => input.focus());
  };

  input.addEventListener('input', () => {
    active = 0;
    render();
  });

  backdrop.addEventListener('click', close);

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(active);
    }
  });

  // Global open shortcut + `S` sound / `?` help entry points.
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      open ? close() : show();
      return;
    }
    if (open || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') {
      e.preventDefault();
      show();
    }
  });

  // let the dock button open it
  (window as unknown as { __ssPalette: () => void }).__ssPalette = show;
}
