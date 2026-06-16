import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches && !reduce;

type Media = { type: 'image' | 'video'; src: string };
type Work = {
  title: string;
  kind: string;
  cat: string;
  media?: Media;
  link?: string; // omit => rendered as TODO row
};

// TODO (Sachman): add real links as projects go live.
const WORK: Work[] = [
  { title: '6-DOF Robotic Arm', kind: 'Robotics · Mechatronics', cat: 'BUILD', media: { type: 'image', src: '/assets/6dof-arm.jpg' } },
  { title: 'Drone', kind: 'Flight · Controls', cat: 'AERIAL', media: { type: 'image', src: '/assets/drone.jpg' } },
  { title: 'Robotic Car', kind: 'Autonomous · STM32', cat: 'ROBOTICS', media: { type: 'video', src: '/assets/robotic-car.mp4' } },
  { title: 'Line-Follower Robot', kind: 'STM32 · Sensor Array', cat: 'EMBEDDED' },
  { title: 'Pure-Sine Inverter', kind: 'STM32 · Power', cat: 'EMBEDDED' },
  { title: 'Servo Stabilizer', kind: 'dsPIC · Control', cat: 'EMBEDDED' },
];

function buildMedia(m: Media, title: string): HTMLElement {
  if (m.type === 'image') {
    const img = document.createElement('img');
    img.src = m.src;
    img.alt = title;
    img.loading = 'lazy';
    return img;
  }
  const v = document.createElement('video');
  v.src = m.src;
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'metadata';
  return v;
}

type Item = { row: HTMLElement; media: HTMLElement | null };

function buildRow(w: Work, i: number): Item {
  const hasLink = !!w.link;
  const row = document.createElement('li');
  row.className = 'work-row';
  row.setAttribute('data-cursor', hasLink ? 'link' : 'view');
  if (!hasLink) row.setAttribute('data-todo', '1');

  const inner = hasLink ? document.createElement('a') : document.createElement('div');
  inner.className = 'work-link';
  if (hasLink) {
    (inner as HTMLAnchorElement).href = w.link!;
    (inner as HTMLAnchorElement).target = '_blank';
    (inner as HTMLAnchorElement).rel = 'noopener noreferrer';
  }

  const no = document.createElement('span');
  no.className = 'work-no';
  no.textContent = String(i + 1).padStart(2, '0');

  const name = document.createElement('span');
  name.className = 'work-name';
  name.textContent = w.title;

  const cat = document.createElement('span');
  cat.className = 'work-cat';
  cat.textContent = w.cat;

  const kind = document.createElement('span');
  kind.className = 'work-kind';
  kind.textContent = w.kind;

  const go = document.createElement('span');
  go.className = 'work-go';
  go.textContent = '↗';

  inner.append(no, name, cat, kind, go);
  row.appendChild(inner);

  const media = w.media ? buildMedia(w.media, w.title) : null;
  return { row, media };
}

export function initWork(): void {
  const list = document.getElementById('workList');
  const section = document.getElementById('work');
  if (!list || !section) return;

  const items = WORK.map((w, i) => buildRow(w, i));
  items.forEach((it) => list.appendChild(it.row));

  // Touch / reduced motion: no cursor reveal — drop media inline under the row.
  if (!canHover) {
    items.forEach((it) => {
      if (!it.media) return;
      it.media.classList.add('work-inline-media');
      it.row.appendChild(it.media);
      if (it.media instanceof HTMLVideoElement) {
        it.media.autoplay = true;
        it.media.play().catch(() => {});
      }
    });
  } else {
    // Floating media that chases the cursor over rows that have media.
    const reveal = document.createElement('div');
    reveal.className = 'work-reveal';
    reveal.setAttribute('aria-hidden', 'true');
    section.appendChild(reveal);

    let active: Item | null = null;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;

    const follow = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      reveal.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(follow);
    };

    section.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    items.forEach((it) => {
      if (!it.media) return;
      it.row.addEventListener('pointerenter', () => {
        active = it;
        cx = tx;
        cy = ty;
        reveal.replaceChildren(it.media!);
        reveal.classList.toggle('is-video', it.media instanceof HTMLVideoElement);
        if (it.media instanceof HTMLVideoElement) it.media.play().catch(() => {});
        reveal.classList.add('on');
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(follow);
      });
      it.row.addEventListener('pointerleave', () => {
        if (active !== it) return;
        if (it.media instanceof HTMLVideoElement) it.media.pause();
        active = null;
        reveal.classList.remove('on');
        cancelAnimationFrame(raf);
      });
    });
  }

  const tag = section.querySelector('.tag');
  const title = section.querySelector('.work-title');
  const rows = items.map((it) => it.row);
  if (reduce) {
    gsap.set([tag, title, ...rows].filter(Boolean), { opacity: 1, y: 0 });
    return;
  }

  gsap.from([tag, title], {
    autoAlpha: 0,
    y: 24,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: section, start: 'top 75%' },
  });

  gsap.from(rows, {
    autoAlpha: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.07,
    scrollTrigger: { trigger: '.work-list', start: 'top 82%' },
  });
}
