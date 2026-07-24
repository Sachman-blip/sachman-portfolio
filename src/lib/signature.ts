// A styled console signature for anyone who opens devtools — a nod to the kind
// of person who inspects a portfolio. Harmless, on-brand, and it advertises the
// hidden interactions.

export function initSignature(): void {
  const acc = '#c8ff00';
  const big = `color:${acc};font-family:Arial,Helvetica,sans-serif;font-size:34px;font-weight:800;letter-spacing:1px;`;
  const mut = 'color:#76766f;font-family:monospace;font-size:12px;line-height:1.6;';
  const ink = 'color:#f4f4f1;font-family:monospace;font-size:12px;';
  const link = `color:${acc};font-family:monospace;font-size:12px;`;

  try {
    console.log('%cSACHMAN SINGH', big);
    console.log('%cEngineer · Fighter · Rider', ink);
    console.log(
      '%cYou opened the console. Respect. Here is what is under the hood:',
      mut
    );
    console.log(
      '%c  ⌘K / Ctrl+K  →  command palette\n  `            →  interactive terminal\n  T            →  telemetry HUD\n  type "matrix" →  you know what to do\n  ↑↑↓↓←→←→BA   →  OVERDRIVE',
      mut
    );
    console.log(
      '%cHand-rolled: TypeScript · GSAP · Three.js · WebAudio · raw WebGL + Canvas. Zero UI frameworks.',
      mut
    );
    console.log('%c→ sachman.singh.saund@gmail.com', link);
  } catch {
    /* console styling unsupported — no-op */
  }
}
