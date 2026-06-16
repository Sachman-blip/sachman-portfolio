import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

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

// Flag for CSS that should only apply once JS is driving animations.
document.documentElement.classList.add('js-anim');

function boot(): void {
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
