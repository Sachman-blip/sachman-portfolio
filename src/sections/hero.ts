import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Full-bleed photo hero with an oversized name. Cinematic entrance + a slow
// parallax/scale on the image as you scroll past.
export function initHero(): void {
  const media = document.getElementById('heroMedia');

  if (reduce) return;

  // Entrance: name lines rise from behind their mask, eyebrow + tagline fade up.
  const tl = gsap.timeline({ delay: 0.15 });
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
    .from(
      '.hero-tagline',
      { autoAlpha: 0, y: 20, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )
    .from(
      ['.topbar', '.hero-scroll'],
      { autoAlpha: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 },
      '-=0.5'
    );

  // Slow Ken-Burns zoom-in on load, then scroll parallax takes over.
  if (media) {
    gsap.fromTo(
      media,
      { scale: 1.18 },
      { scale: 1.0, duration: 2.4, ease: 'power2.out' }
    );
    gsap.to(media, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    // Fade content out as the hero leaves.
    gsap.to('.hero-content', {
      autoAlpha: 0,
      yPercent: -30,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true },
    });
  }
}
