import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { revealUp, parallax } from '../lib/scrollFx';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initStory(): void {
  const section = document.getElementById('story');
  if (!section) return;

  const tag = section.querySelector('.story .tag') ?? section.querySelector('.tag');
  const lines = gsap.utils.toArray<HTMLElement>('.story-head .line > span');
  const body = section.querySelector('.story-body');
  const meta = section.querySelector('.story-meta');
  const portrait = section.querySelector('.story-portrait');
  const portraitImg = section.querySelector('.story-portrait img');
  const bgno = section.querySelector('.story-bgno');

  if (tag) revealUp(tag);

  if (!reduce && lines.length) {
    gsap.set(lines, { yPercent: 120 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.1,
      scrollTrigger: { trigger: section, start: 'top 68%' },
    });
  }

  if (body) revealUp(body, { y: 24 });
  if (meta) revealUp(meta, { y: 16 });
  if (portrait) revealUp(portrait, { y: 50 });
  if (portraitImg) parallax(portraitImg, 40);
  if (bgno) parallax(bgno, 60);
}
