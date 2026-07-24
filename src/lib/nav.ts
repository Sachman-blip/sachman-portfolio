// A vertical section minimap on the right edge — one tick per section with the
// live label revealed on hover, the active section elongated + accented, and a
// click that smooth-scrolls there. Mirrors the HUD's section model.

import { scrollTo } from './smoothScroll';

export function initNav(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-hud]'));
  if (sections.length === 0) return;

  const nav = document.createElement('nav');
  nav.className = 'minimap';
  nav.setAttribute('aria-label', 'Section navigation');

  const items = sections.map((section) => {
    const raw = section.dataset.hud ?? '';
    const [no, ...rest] = raw.split('·').map((s) => s.trim());
    const label = rest.join(' · ') || section.id;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mm-item';
    btn.setAttribute('data-cursor', 'view');
    btn.setAttribute('aria-label', `Go to ${label}`);
    btn.innerHTML = `<span class="mm-label">${no} · ${label}</span><span class="mm-tick"></span>`;
    btn.addEventListener('click', () => scrollTo('#' + section.id));
    nav.appendChild(btn);
    return { section, btn };
  });

  document.body.appendChild(nav);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        items.forEach((it) => it.btn.classList.toggle('on', it.section === entry.target));
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  items.forEach((it) => io.observe(it.section));
}
