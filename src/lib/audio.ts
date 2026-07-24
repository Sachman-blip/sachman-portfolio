// Synthesized interaction sound design. No audio files — every cue is generated
// on the fly with the WebAudio API: a short filtered tick on hovering any
// interactive [data-cursor] zone, a lower blip on press, and a two-note confirm
// when toggled on. Off by default (respects autoplay policy + taste), persisted.

import { emit, isTyping } from './bus';

const KEY = 'ss-sound';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;
let lastTick = 0;

function ensureCtx(): void {
  if (!ctx) {
    const AC =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number, glideTo?: number): void {
  if (!on || !ctx || !master) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function tick(): void {
  const now = performance.now();
  if (now - lastTick < 45) return; // throttle rapid hover streams
  lastTick = now;
  tone(2100, 0.05, 'square', 0.04);
}

export function blip(): void {
  tone(320, 0.12, 'triangle', 0.12, 160);
}

function confirm(): void {
  tone(660, 0.1, 'sine', 0.14);
  window.setTimeout(() => tone(990, 0.16, 'sine', 0.14), 90);
}

export function isSoundOn(): boolean {
  return on;
}

export function toggleSound(): boolean {
  on = !on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (on) {
    ensureCtx();
    confirm();
  }
  emit('ss:sound', { on });
  return on;
}

export function initAudio(): void {
  try {
    on = localStorage.getItem(KEY) === '1';
  } catch {
    /* ignore */
  }

  // Any real gesture is a safe place to (re)create/resume the context.
  const wake = () => ensureCtx();
  addEventListener('pointerdown', wake, { passive: true });
  addEventListener('keydown', (e) => {
    if (!isTyping(e.target)) wake();
  });

  // Hover ticks over interactive zones; press blips.
  document.addEventListener('pointerover', (e) => {
    if (!on) return;
    const el = (e.target as HTMLElement)?.closest('[data-cursor]');
    if (el) tick();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!on) return;
    const el = (e.target as HTMLElement)?.closest('[data-cursor],button,a');
    if (el) blip();
  });

  emit('ss:sound', { on });
}
