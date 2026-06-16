import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

// Init Lenis, drive it from GSAP's ticker, and sync ScrollTrigger to it.
// Disabled entirely under reduced motion (native scroll takes over).
export function initSmoothScroll(): Lenis | null {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  lenis = new Lenis({
    duration: 1.25,
    // a gentle exponential ease-out — heavy, premium glide
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

// Smooth scroll to a target (used by "back to top"). Falls back to native.
export function scrollTo(target: number | string | HTMLElement): void {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.2 });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}
