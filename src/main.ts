import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/hud-extra.css';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCursor } from './lib/cursor';
import { initMagnetic } from './lib/magnetic';
import { initHud } from './lib/hud';
import { initSmoothScroll } from './lib/smoothScroll';
import { initHero } from './sections/hero';
import { initStory } from './sections/story';
import { initDiscipline } from './sections/discipline';
import { initRoad } from './sections/road';
import { initWork } from './sections/work';
import { initContact } from './sections/contact';

// Over-engineered feature layer
import { initTheme } from './lib/theme';
import { initBoot } from './lib/boot';
import { initAudio } from './lib/audio';
import { initTelemetry } from './lib/telemetry';
import { initFavicon } from './lib/favicon';
import { initKonami } from './lib/konami';
import { initPalette } from './lib/palette';
import { initDock } from './lib/dock';
import { initPerf } from './lib/perf';
import { initScramble } from './lib/scramble';
import { initSecrets } from './lib/secrets';
import { initFlowField } from './lib/flowfield';
import { initTerminal } from './lib/terminal';
import { initNav } from './lib/nav';
import { initSectionFx } from './lib/sectionfx';
import { initIdle } from './lib/idle';
import { initPWA } from './lib/pwa';
import { initFluid } from './lib/fluid';
import { initStats } from './lib/stats';
import { initTilt } from './lib/tilt';
import { initSignature } from './lib/signature';
import { marquee } from './lib/scrollFx';

// Flag for CSS that should only apply once JS is driving animations.
document.documentElement.classList.add('js-anim');

// Run an init in isolation: if any single module throws, log it and keep the
// rest of the site working rather than white-screening. Critical for a feature
// layer this large — one bad WebGL/analyser call must not sink everything.
function safe(name: string, fn: () => void): void {
  try {
    fn();
  } catch (err) {
    console.warn(`[init] ${name} failed:`, err);
  }
}

safe('signature', initSignature);

function boot(): void {
  // Theme first: everything downstream (favicon, WebGL rim light) reads --acc.
  safe('theme', initTheme);
  safe('boot', initBoot);

  safe('smoothScroll', initSmoothScroll);
  safe('cursor', initCursor);

  // Content + behaviour
  safe('hero', initHero);
  safe('story', initStory);
  safe('discipline', initDiscipline);
  safe('road', initRoad);
  safe('work', initWork);
  safe('stats', initStats);
  safe('contact', initContact);
  safe('deferThree', deferThree);

  // Cinematic capabilities marquee (velocity-aware, reuses scrollFx).
  safe('capMarquee', () => {
    const capTrack = document.getElementById('capTrack');
    if (capTrack) marquee(capTrack, 0.6);
  });

  // Interaction polish across the now-built DOM.
  safe('magnetic', initMagnetic);
  safe('hud', initHud);

  // Feature layer: command palette, sound, telemetry, easter eggs.
  safe('perf', initPerf); // adaptive quality — must precede consumers (flow-field density)
  safe('audio', initAudio);
  // Global living backdrop: GPU fluid sim by default, Canvas2D flow-field as the
  // fallback (and as a user-selectable alternative persisted in ss-bg).
  safe('background', () => {
    let pref: string | null = null;
    try {
      pref = localStorage.getItem('ss-bg');
    } catch {
      /* ignore */
    }
    let ok = false;
    if (pref !== 'flow') {
      try {
        ok = initFluid();
      } catch {
        ok = false;
      }
    }
    if (!ok) initFlowField();
  });
  safe('telemetry', initTelemetry);
  safe('favicon', initFavicon);
  safe('konami', initKonami);
  safe('secrets', initSecrets);
  safe('scramble', initScramble);
  safe('terminal', initTerminal);
  safe('nav', initNav);
  safe('sectionFx', initSectionFx);
  safe('tilt', initTilt); // pointer 3D tilt on [data-tilt] cards (stats/radar)
  safe('idle', initIdle);
  safe('pwa', initPWA);
  safe('palette', initPalette);
  safe('dock', initDock);

  // Layout is now fully built — recompute trigger positions.
  ScrollTrigger.refresh();

  // Recompute after fonts settle (Anton/Space Mono shift heading metrics)
  // and after the hero image decodes (it changes layout height).
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  addEventListener('load', () => ScrollTrigger.refresh());
}

// Three.js is heavy — load its chunk only once the 3D section nears the
// viewport, then refresh triggers since it adds a pinned section.
function deferThree(): void {
  const section = document.getElementById('three');
  if (!section) return;
  const load = () => {
    import('./lib/three-hero').then(({ initThree }) => {
      initThree();
      ScrollTrigger.refresh();
    });
  };
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        io.disconnect();
        load();
      }
    },
    { rootMargin: '600px 0px' }
  );
  io.observe(section);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
