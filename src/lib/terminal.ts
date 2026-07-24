// An interactive terminal easter egg — a real command parser styled like a
// shell, wired to the site's live systems (theme, sound, telemetry, overdrive,
// navigation, matrix). Open with the backtick key or the command palette.

import { scrollTo } from './smoothScroll';
import { isTyping } from './bus';
import { cycleAccent, setAccent, currentAccent, ACCENTS } from './theme';
import { toggleSound, isSoundOn } from './audio';
import { toggleTelemetry } from './telemetry';
import { toggleOverdrive, isOverdrive } from './konami';
import { triggerMatrix } from './secrets';

const SECTIONS: Record<string, string> = {
  intro: '#hero',
  hero: '#hero',
  story: '#story',
  discipline: '#discipline',
  road: '#road',
  work: '#work',
  lab: '#three',
  hood: '#three',
  contact: '#contact',
};

const BANNER = [
  '  ███████╗███████╗',
  '  ██╔════╝██╔════╝   Sachman Singh // interactive shell',
  '  ███████╗███████╗   type `help` for commands · `exit` to close',
  '  ╚════██║╚════██║',
  '  ███████║███████║',
  '  ╚══════╝╚══════╝',
];

export function initTerminal(): void {
  const root = document.createElement('div');
  root.className = 'term';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="term-backdrop"></div>
    <div class="term-win" role="dialog" aria-label="Terminal">
      <div class="term-bar">
        <span class="term-dots"><i></i><i></i><i></i></span>
        <span class="term-title">visitor@sachman — ~/portfolio</span>
        <button class="term-x" type="button" aria-label="Close">✕</button>
      </div>
      <div class="term-body" id="termBody"></div>
      <div class="term-input-line">
        <span class="term-ps1">visitor@sachman:~$</span>
        <input class="term-input" type="text" autocomplete="off" spellcheck="false" />
      </div>
    </div>`;
  document.body.appendChild(root);

  const body = root.querySelector<HTMLElement>('#termBody')!;
  const input = root.querySelector<HTMLInputElement>('.term-input')!;
  const win = root.querySelector<HTMLElement>('.term-win')!;

  let open = false;
  const history: string[] = [];
  let hIdx = -1;

  const print = (text = '', cls = '') => {
    const line = document.createElement('div');
    line.className = 'term-out' + (cls ? ' ' + cls : '');
    line.textContent = text;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  };
  const printHTML = (html: string) => {
    const line = document.createElement('div');
    line.className = 'term-out';
    line.innerHTML = html;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  };

  const echoCommand = (cmd: string) => {
    const line = document.createElement('div');
    line.className = 'term-out term-echo';
    line.innerHTML = `<span class="term-ps1">visitor@sachman:~$</span> ${escapeHTML(cmd)}`;
    body.appendChild(line);
  };

  const commands: Record<string, (args: string[]) => void> = {
    help: () => {
      print('AVAILABLE COMMANDS', 'term-accent');
      const rows: [string, string][] = [
        ['help', 'this list'],
        ['whoami', 'who is this'],
        ['ls', 'list sections'],
        ['cd <section>', 'jump to a section (story, work, lab…)'],
        ['accent [name|next]', 'change the brand colour'],
        ['sound [on|off]', 'toggle sound design'],
        ['telemetry', 'toggle the telemetry HUD'],
        ['overdrive', 'toggle OVERDRIVE mode'],
        ['matrix', 'it begins…'],
        ['stack', 'what this site is built with'],
        ['sys', 'system / device readout'],
        ['contact', 'how to reach me'],
        ['date', 'current date/time'],
        ['clear', 'clear the screen'],
        ['exit', 'close the terminal'],
      ];
      rows.forEach(([c, d]) => printHTML(`  <span class="term-cmdname">${c.padEnd(20)}</span> ${d}`));
    },
    whoami: () => {
      print('sachman singh', 'term-accent');
      print('engineer · national kickboxing champion · rider · builder.');
      print("relentlessly curious. doesn't race anyone but the limit.");
    },
    ls: () => {
      printHTML(
        Object.keys(SECTIONS)
          .filter((k, i, a) => a.indexOf(k) === i)
          .map((k) => `<span class="term-dir">${k}/</span>`)
          .join('   ')
      );
    },
    cd: (args) => {
      const key = (args[0] || '').replace(/\/$/, '').toLowerCase();
      const sel = SECTIONS[key];
      if (!sel) return print(`cd: no such section: ${key || '(none)'}`, 'term-err');
      print(`→ ${key}`, 'term-accent');
      scrollTo(sel);
      window.setTimeout(close, 350);
    },
    goto: (a) => commands.cd(a),
    accent: (args) => {
      const q = (args[0] || '').toLowerCase();
      if (!q || q === 'list') {
        print('accents: ' + ACCENTS.map((a) => a.name.toLowerCase().replace(/\s+/g, '')).join(', '));
        print('current: ' + currentAccent().name, 'term-accent');
        return;
      }
      if (q === 'next') return print('accent → ' + cycleAccent().name, 'term-accent');
      const found = ACCENTS.find((a) => a.name.toLowerCase().replace(/\s+/g, '') === q);
      if (!found) return print(`accent: unknown "${q}"`, 'term-err');
      setAccent(found.value);
      print('accent → ' + found.name, 'term-accent');
    },
    theme: (a) => commands.accent(a),
    sound: (args) => {
      const q = (args[0] || '').toLowerCase();
      const want = q === 'on' ? true : q === 'off' ? false : !isSoundOn();
      if (want !== isSoundOn()) toggleSound();
      print('sound: ' + (isSoundOn() ? 'ON' : 'OFF'), 'term-accent');
    },
    telemetry: () => {
      toggleTelemetry();
      print('telemetry toggled', 'term-accent');
    },
    overdrive: () => {
      toggleOverdrive();
      print('OVERDRIVE: ' + (isOverdrive() ? 'ENGAGED' : 'OFF'), 'term-accent');
    },
    matrix: () => {
      print('wake up…', 'term-accent');
      window.setTimeout(() => {
        close();
        triggerMatrix();
      }, 500);
    },
    stack: () => {
      print('BUILT WITH', 'term-accent');
      ['TypeScript (strict)', 'Vite', 'GSAP + ScrollTrigger', 'Lenis smooth scroll', 'Three.js (WebGL STL gallery)', 'Raw Canvas2D (flow-field + matrix)', 'WebAudio (synthesized sound design)', 'Zero UI frameworks — hand-rolled'].forEach(
        (s) => print('  · ' + s)
      );
    },
    contact: () => {
      printHTML('  email     <span class="term-accent">sachman.singh.saund@gmail.com</span>');
      printHTML('  instagram <span class="term-accent">@sachman.singh</span>');
      printHTML('  github    <span class="term-accent">github.com/Sachman-blip</span>');
    },
    date: () => print(new Date().toString()),
    sys: () => {
      print('SYSTEM', 'term-accent');
      print('  browser  ' + navigator.userAgent.slice(0, 62));
      print('  screen   ' + `${screen.width}×${screen.height} @${window.devicePixelRatio}x`);
      print('  viewport ' + `${innerWidth}×${innerHeight}`);
      print('  cores    ' + (navigator.hardwareConcurrency || '?'));
      print('  lang     ' + navigator.language);
      print('  accent   ' + currentAccent().name);
    },
    history: () => {
      if (!history.length) return print('(no history)');
      history.forEach((h, i) => print('  ' + String(i + 1).padStart(3, ' ') + '  ' + h));
    },
    echo: (args) => print(args.join(' ')),
    sudo: () => print("nice try. you already have root here — it's your browser.", 'term-err'),
    clear: () => {
      body.innerHTML = '';
    },
    exit: () => close(),
    close: () => close(),
    q: () => close(),
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    echoCommand(cmd);
    if (!cmd) return;
    history.push(cmd);
    hIdx = history.length;
    const [name, ...args] = cmd.split(/\s+/);
    const fn = commands[name.toLowerCase()];
    if (fn) fn(args);
    else print(`command not found: ${name} — try \`help\``, 'term-err');
  };

  const banner = () => {
    body.innerHTML = '';
    BANNER.forEach((l) => print(l, 'term-banner'));
    print('');
  };

  const show = () => {
    open = true;
    root.classList.add('on');
    root.setAttribute('aria-hidden', 'false');
    if (!body.childElementCount) banner();
    requestAnimationFrame(() => input.focus());
  };
  const close = () => {
    open = false;
    root.classList.remove('on');
    root.setAttribute('aria-hidden', 'true');
    input.blur();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIdx > 0) input.value = history[--hIdx] ?? '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx < history.length - 1) input.value = history[++hIdx] ?? '';
      else {
        hIdx = history.length;
        input.value = '';
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  root.querySelector('.term-x')!.addEventListener('click', close);
  root.querySelector('.term-backdrop')!.addEventListener('click', close);
  win.addEventListener('click', () => input.focus());

  // backtick opens/closes (when not already typing elsewhere)
  addEventListener('keydown', (e) => {
    if (e.key === '`' && !isTyping(e.target)) {
      e.preventDefault();
      open ? close() : show();
    }
  });

  (window as unknown as { __ssTerminal: () => void }).__ssTerminal = show;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
}
