import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { revealUp } from '../lib/scrollFx';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initDiscipline(): void {
  const section = document.getElementById('discipline');
  if (!section) return;

  const tag = section.querySelector('.tag');
  const lines = gsap.utils.toArray<HTMLElement>('.disc-title .line > span');
  const body = section.querySelector('.disc-body');
  const meta = section.querySelector('.disc-meta');

  if (tag) revealUp(tag);

  if (!reduce && lines.length) {
    gsap.set(lines, { yPercent: 120 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.1,
      scrollTrigger: { trigger: section, start: 'top 65%' },
    });
  }
  if (body) revealUp(body, { y: 24 });
  if (meta) revealUp(meta, { y: 16 });
}
