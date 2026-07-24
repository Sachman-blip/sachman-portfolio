// Progressive Web App wiring. Registers the service worker (production only, so
// it never fights Vite's HMR in dev) and captures the install prompt so the
// command palette can offer "Install app". The site becomes installable and
// works offline after the first visit.

let deferredPrompt: (Event & { prompt: () => void }) | null = null;

export function canInstall(): boolean {
  return !!deferredPrompt;
}

export function promptInstall(): boolean {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  deferredPrompt = null;
  return true;
}

export function initPWA(): void {
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as Event & { prompt: () => void };
  });

  if (!import.meta.env.PROD) return; // dev: skip SW so HMR stays clean
  if (!('serviceWorker' in navigator)) return;
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW unsupported / blocked — the site works fine without it */
    });
  });
}
