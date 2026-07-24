// Dynamic, accent-aware favicon drawn on a canvas ("SS" monogram on the dark
// surface), redrawn whenever the accent changes. Plus a tab-away title swap so
// the browser tab nudges the user to come back.

import { on } from './bus';
import { currentAccent } from './theme';

const ORIGINAL_TITLE = document.title;

function draw(): void {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const accent = currentAccent().value;

  // surface
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, size, size);

  // accent underline bar
  ctx.fillStyle = accent;
  ctx.fillRect(8, 50, size - 16, 6);

  // monogram
  ctx.fillStyle = '#f4f4f1';
  ctx.font = '700 34px "Arial Narrow", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SS', size / 2, 26);

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-dynamic]');
  if (!link) {
    // keep the shipped SVG favicon as-is; add a higher-priority PNG we control
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.setAttribute('data-dynamic', '1');
    document.head.appendChild(link);
  }
  link.href = canvas.toDataURL('image/png');
}

export function initFavicon(): void {
  draw();
  on('ss:accent', draw);

  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '← come back — Sachman Singh' : ORIGINAL_TITLE;
  });
}
