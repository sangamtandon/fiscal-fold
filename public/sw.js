/**
 * Fiscal Fold — Service Worker
 * Strategy:
 *   - Navigation requests: network-first, fallback to cached shell
 *   - Same-origin assets: cache-first with background revalidation
 *   - External (fonts etc.): stale-while-revalidate
 */

const CACHE = 'fiscal-fold-v1';
const SHELL_ASSETS = ['/', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Navigation → network-first, fallback to shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(SHELL_ASSETS[0]))
    );
    return;
  }

  // Same-origin assets → cache-first, update cache in background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const network = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached || network;
        })
      )
    );
    return;
  }

  // External (Google Fonts, etc.) → stale-while-revalidate
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(request).then(cached => {
        const network = fetch(request)
          .then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
