import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fade + 40px rise. Used on headings, cards, paragraphs (children staggered).
export function revealUp(
  el: Element,
  opts: { stagger?: boolean; y?: number; start?: string } = {}
): void {
  const targets: Element[] = opts.stagger ? Array.from(el.children) : [el];
  targets.forEach((t) => t.classList.add('reveal-up'));

  if (reduce) {
    gsap.set(targets, { opacity: 1, y: 0, clearProps: 'all' });
    return;
  }

  gsap.fromTo(
    targets,
    { autoAlpha: 0, y: opts.y ?? 40 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: opts.stagger ? 0.12 : 0,
      scrollTrigger: { trigger: el, start: opts.start ?? 'top 80%' },
    }
  );
}

// Split a heading into word spans and rise them behind an overflow mask.
export function splitReveal(el: HTMLElement, start = 'top 82%'): void {
  const words = el.textContent?.trim().split(/\s+/) ?? [];
  el.textContent = '';
  el.classList.add('split');

  const inners: HTMLElement[] = [];
  words.forEach((w) => {
    const mask = document.createElement('span');
    mask.className = 'split-mask';
    const inner = document.createElement('span');
    inner.className = 'split-word';
    inner.textContent = w;
    mask.appendChild(inner);
    el.appendChild(mask);
    el.appendChild(document.createTextNode(' '));
    inners.push(inner);
  });

  if (reduce) return;

  gsap.set(inners, { yPercent: 115 });
  gsap.to(inners, {
    yPercent: 0,
    duration: 1.1,
    ease: 'power4.out',
    stagger: 0.08,
    scrollTrigger: { trigger: el, start },
  });
}

// Gentle parallax on a media element.
export function parallax(el: Element, amount = 60): void {
  if (reduce) return;
  gsap.fromTo(
    el,
    { yPercent: -amount / 10 },
    {
      yPercent: amount / 10,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    }
  );
}

// Infinite, scroll-velocity-aware marquee. Returns nothing; self-manages rAF.
export function marquee(track: HTMLElement, speed = 0.6): void {
  // duplicate content so it can loop seamlessly
  track.innerHTML += track.innerHTML;
  if (reduce) return;

  const half = () => track.scrollWidth / 2;
  let x = 0;
  let dir = -1;

  // nudge direction/speed with scroll velocity
  ScrollTrigger.create({
    onUpdate: (self) => {
      dir = self.direction === 1 ? -1 : 1;
    },
  });

  let prev = performance.now();
  function loop(now: number) {
    let dt = (now - prev) / 1000;
    prev = now;
    if (dt > 0.05) dt = 0.05;
    x += dir * speed * dt * 100;
    const w = half();
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    track.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

export function refresh(): void {
  ScrollTrigger.refresh();
}
