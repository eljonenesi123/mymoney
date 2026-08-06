const CACHE_VERSION = 'mymoney-v4';

// Deployed at the site root locally, but under /mymoney/ on GitHub Pages —
// derive the app's base path from this script's own URL so caching works
// in both places without hardcoding either one.
const BASE = self.location.pathname.replace(/sw\.js$/, '');
const APP_SHELL = [BASE, `${BASE}manifest.json`, `${BASE}icon-192.png`, `${BASE}icon-512.png`];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigations: network-first, fall back to the cached app shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(BASE, copy));
          return response;
        })
        .catch(() => caches.match(BASE)),
    );
    return;
  }

  // API reads (often a different origin than the static site, e.g. GitHub
  // Pages frontend + Render backend): network-first, cache successful GETs
  // so recently viewed data stays available offline.
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});

// Groundwork for bill-due push notifications. This only fires if something
// sends a real Web Push message to this service worker's subscription — and
// nothing does yet, because that requires a backend (or serverless
// function) holding the subscription and triggering pushes at the right
// time (e.g. a daily cron checking bills due soon). Without that backend
// piece, this handler exists but is never invoked; wiring it up is future
// work, not something the client alone can do reliably.
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Bill reminder';
  const options = {
    body: data.body || 'You have a bill due soon.',
    icon: `${BASE}icon-192.png`,
    badge: `${BASE}icon-192.png`,
    data: { url: data.url || BASE },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || BASE;
  event.waitUntil(self.clients.openWindow(url));
});
