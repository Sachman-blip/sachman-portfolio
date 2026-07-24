// Tiny decoupled event bus over window CustomEvents. Modules emit/subscribe to
// cross-cutting state changes (accent, sound, overdrive, telemetry) without
// importing each other. Keeps the "over-engineered" feature layer loosely wired.

export type BusEvent =
  | 'ss:accent' // detail: { name: string; value: string }
  | 'ss:sound' // detail: { on: boolean }
  | 'ss:overdrive' // detail: { on: boolean }
  | 'ss:telemetry' // detail: { on: boolean }
  | 'ss:booted'; // detail: undefined

export function emit<T = unknown>(type: BusEvent, detail?: T): void {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function on<T = unknown>(type: BusEvent, fn: (detail: T) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent).detail as T);
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
}

// Shared helper: is the user currently typing into a field? Used to gate
// single-key shortcuts so they don't fire while the command palette is open.
export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
}
