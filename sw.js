/**
 * المنزلة وناسها — Service Worker
 * Cache Strategy: Network-First for dynamic API/DB, Cache-First for static assets
 */

const CACHE_VERSION = 'v1.0.1';
const STATIC_CACHE  = `elmanzala-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `elmanzala-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE   = `elmanzala-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './src/css/main.css',
  './src/js/app.js',
  './manifest.webmanifest',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon.svg'
];

const OFFLINE_PAGE = './offline.html';

// ── Install ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install warning:', err))
  );
});

// ── Activate ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith('elmanzala-') && ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key))
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

// ── Fetch ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Real-time Firebase & API requests -> Bypass SW
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // Images from R2 or local icons -> Cache First
  if (url.hostname.includes('r2.dev') || url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // Static assets (CSS, JS, Fonts) -> Cache First
  if (
    url.pathname.match(/\.(css|js|woff2|woff|ttf)$/) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Navigation requests -> Network First with Offline Fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

async function cacheFirstStrategy(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    if (maxAge) {
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const cacheAge = (Date.now() - new Date(dateHeader).getTime()) / 1000;
        if (cacheAge > maxAge) {
          return fetchAndCache(request, cache);
        }
      }
    }
    return cached;
  }

  return fetchAndCache(request, cache);
}

async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
