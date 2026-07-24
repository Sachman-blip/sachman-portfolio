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

// Flag for CSS that should only apply once JS is driving animations.
document.documentElement.classList.add('js-anim');

function boot(): void {
  // Theme first: everything downstream (favicon, WebGL rim light) reads --acc.
  initTheme();
  initBoot();

  initSmoothScroll();
  initCursor();

  // Content + behaviour
  initHero();
  initStory();
  initDiscipline();
  initRoad();
  initWork();
  initContact();
  deferThree();

  // Interaction polish across the now-built DOM.
  initMagnetic();
  initHud();

  // Feature layer: command palette, sound, telemetry, easter eggs.
  initPerf(); // adaptive quality — must precede consumers (flow-field density)
  initAudio();
  initTelemetry();
  initFavicon();
  initKonami();
  initSecrets();
  initScramble();
  initFlowField();
  initTerminal();
  initNav();
  initSectionFx();
  initIdle();
  initPWA();
  initPalette();
  initDock();

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
