// Cyberpunk text-scramble: reveal text by cycling random glyphs that resolve
// left-to-right into the final string. Applied to the mono `//` section tags as
// they scroll in — a decode effect that suits the technical HUD language.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/_<>*+·—';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scramble(el: HTMLElement, opts: { duration?: number } = {}): void {
  const text = el.dataset.scrambleText ?? el.textContent ?? '';
  el.dataset.scrambleText = text;
  if (reduce || !text.trim()) {
    el.textContent = text;
    return;
  }

  const duration = opts.duration ?? 620;
  const start = performance.now();
  const seeds = Array.from(text, () => Math.random());

  const frame = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const revealCount = Math.floor(t * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') {
        out += ' ';
      } else if (i < revealCount) {
        out += ch;
      } else {
        // flicker; occasionally hold the real glyph as it settles
        out += seeds[i] < t ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
    }
    el.textContent = out;
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = text;
  };
  requestAnimationFrame(frame);
}

// Decode every `.tag` (and a couple of other mono labels) the first time it
// enters the viewport.
export function initScramble(): void {
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('.tag, .work-hint, .three-sub')
  ).filter((el) => (el.textContent ?? '').length < 80);

  if (!('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        scramble(entry.target as HTMLElement);
      });
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  targets.forEach((t) => io.observe(t));
}
