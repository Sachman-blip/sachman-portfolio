import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { on } from '../lib/bus';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Full-bleed photo hero with an oversized name. The entrance is held until the
// boot curtain lifts (via the `ss:booted` bus event) so the name sweeps into
// view with the reveal instead of animating unseen behind the curtain. Scroll
// parallax/scale is wired immediately.
export function initHero(): void {
  const media = document.getElementById('heroMedia');

  if (reduce) return;

  // Scroll-driven effects — safe to attach right away.
  if (media) {
    gsap.to(media, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero-content', {
      autoAlpha: 0,
      yPercent: -30,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true },
    });
  }

  // Entrance: name lines rise from behind their mask, eyebrow + tagline fade up.
  // Built paused; `from` tweens apply their start (hidden) state immediately, so
  // everything stays concealed until the curtain lift triggers play().
  const tl = gsap.timeline({ paused: true });
  tl.from('.hero-name .line > span', {
    yPercent: 120,
    duration: 1.1,
    ease: 'power4.out',
    stagger: 0.12,
  })
    .from(
      '.hero-eyebrow span',
      { autoAlpha: 0, y: 14, duration: 0.7, ease: 'power3.out', stagger: 0.08 },
      '-=0.7'
    )
    .from('.hero-tagline', { autoAlpha: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .from(
      ['.topbar', '.hero-scroll'],
      { autoAlpha: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 },
      '-=0.5'
    );

  // Slow Ken-Burns zoom-in that plays with the reveal, then scroll takes over.
  const kenBurns = media
    ? gsap.fromTo(media, { scale: 1.18 }, { scale: 1.0, duration: 2.4, ease: 'power2.out', paused: true })
    : null;

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    tl.play(0);
    kenBurns?.play(0);
  };

  on('ss:booted', start);
  // Fallback: never leave the hero hidden if the boot module is absent/fails.
  window.setTimeout(start, 2600);
}
