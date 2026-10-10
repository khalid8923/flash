/* =========================================================
   FLASH - Service Worker
   Strategy: cache-first for assets, network-first for API.
   Versioned cache — bump CACHE_VERSION on release.
   ========================================================= */
const CACHE_VERSION = 'flash-v1.0.0';
const CORE_CACHE = CACHE_VERSION + '-core';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

/* Core assets that MUST be available offline */
const CORE_ASSETS = [
  './',
  './index.html',
  './domain.html',
  './manifest.webmanifest',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './css/tokens.css',
  './css/base.css',
  './css/layout.css'
];

/* Install — precache core */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Some core assets missing:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* Activate — cleanup old caches */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k.indexOf('flash-') === 0 && k.indexOf(CACHE_VERSION) === -1)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

/* Fetch */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin
  if (url.origin !== location.origin) return;

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip API calls
  if (url.pathname.indexOf('/api/') === 0) return;

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') return;

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cache only 200 OK
        if (response.status === 200 && response.type === 'basic'){
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, clone);
          }).catch(() => {});
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML
        if (event.request.mode === 'navigate'){
          return caches.match('./index.html');
        }
        return new Response('', { status: 503 });
      });
    })
  );
});

/* Message channel — allow pages to force-update */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE'){
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});