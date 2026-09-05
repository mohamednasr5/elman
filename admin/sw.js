/**
 * Dedicated Admin PWA Service Worker
 */
const CACHE_NAME = 'elmanzala-admin-v2.2.0';
const ADMIN_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  '../src/css/main.css',
  '../src/css/pages/dashboard.css',
  '../icons/icon-192x192.png',
  '../icons/icon-512x512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ADMIN_ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('elmanzala-admin-') && k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com') || url.pathname.includes('/api/')) return;

  // Network-First for JS, HTML to ensure immediate code updates
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (!res || res.status !== 200) return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for images/icons
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200) return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      });
    })
  );
});
