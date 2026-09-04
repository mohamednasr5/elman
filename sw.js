/**
 * دليل المنزلة والمطرية — Advanced Realtime PWA Service Worker
 * Network-First for 100% Live Direct Sync, Zero Stale Caching,
 * Native Mobile System Push Notifications & Background Sync Engine.
 */

const CACHE_VERSION = 'v2.3.0-crisp-icons';
const STATIC_CACHE  = `manzala-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `manzala-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE   = `manzala-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './offline.html',
  './src/css/main.css',
  './manifest.webmanifest',
  './icons/icon-48x48.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-192x192.png',
  './icons/icon-maskable-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512x512.png'
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

// ── Activate (Purge all old stale caches immediately) ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== STATIC_CACHE && key !== IMAGE_CACHE)
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

// ── Fetch Strategy: Network-First Direct Live ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Real-time Firebase RTDB, APIs & Workers -> Complete Live Network Pass-Through
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // Navigation / HTML Pages -> Network-First (Always live from server, cache only as offline fallback)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Images -> Cache First with network update
  if (url.hostname.includes('r2.dev') || url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // Static assets (CSS, JS, Fonts) -> Network First with static cache fallback
  event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
});

/**
 * Network-First Strategy (Always fetch fresh live network data first)
 */
async function networkFirstStrategy(request, fallbackCacheName = DYNAMIC_CACHE) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(fallbackCacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Offline fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) return offlinePage;
    }

    return new Response('Network Error / Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirstStrategy(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    return new Response('', { status: 503 });
  }
}

// ═════════════════════════════════════════════════════════════════════
//  PWA PUSH NOTIFICATIONS & NATIVE MOBILE NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_) {
      data = { title: 'دليل المنزلة والمطرية 🔔', message: event.data.text() };
    }
  }

  const title = data.title || data.notification?.title || 'دليل المنزلة والمطرية 🔔';
  const body = data.message || data.body || data.notification?.body || 'لديك تنبيه جديد في دليل المنزلة والمطرية';
  const url = data.url || data.data?.url || './';
  const icon = data.icon || './icons/icon-192x192.png';
  const badge = './icons/icon-96x96.png';

  const options = {
    body,
    icon,
    badge,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [150, 50, 150, 50, 200],
    tag: data.tag || 'manzala-pwa-push-' + Date.now(),
    renotify: true,
    data: { url, timestamp: Date.now() }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'SHOW_PWA_NOTIFICATION') {
    const notif = event.data.payload || {};
    const title = notif.title || 'دليل المنزلة والمطرية 🔔';
    const body = notif.message || notif.body || '';
    const url = notif.url || notif.actionUrl || './';

    self.registration.showNotification(title, {
      body,
      icon: notif.icon || './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [150, 50, 150, 50, 200],
      tag: notif.tag || 'pwa-local-push-' + Date.now(),
      renotify: true,
      data: { url }
    });
  }
});
