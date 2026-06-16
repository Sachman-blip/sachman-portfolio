import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initRoad(): void {
  const section = document.getElementById('road');
  const media = document.getElementById('roadMedia');
  const video = section?.querySelector<HTMLVideoElement>('.road-video');
  const lines = gsap.utils.toArray<HTMLElement>('.road-quote .cine-line > span');
  const sub = section?.querySelector('.road-sub');

  // Reduced motion: hold on the poster frame.
  if (reduce && video) {
    video.removeAttribute('autoplay');
    video.pause();
  }

  if (section && !reduce) {
    // Subtle parallax on the video layer.
    if (media) {
      gsap.fromTo(
        media,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    }

    gsap.set(lines, { yPercent: 120 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.12,
      scrollTrigger: { trigger: section, start: 'top 55%' },
    });

    if (sub) {
      gsap.from(sub, {
        autoAlpha: 0,
        y: 20,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 40%' },
      });
    }
  }
}
