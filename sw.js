/**
 * دليل المنزلة والمطرية — Advanced PWA Service Worker
 * Network-First for dynamic data, Cache-First for static assets,
 * Native Mobile System Push Notifications & Background Sync Engine.
 */

const CACHE_VERSION = 'v2.1.0-turbo-pwa';
const STATIC_CACHE  = `manzala-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `manzala-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE   = `manzala-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './places.html',
  './place.html',
  './categories.html',
  './category.html',
  './search.html',
  './offers.html',
  './products.html',
  './now.html',
  './around-me.html',
  './login.html',
  './dashboard.html',
  './admin.html',
  './privacy.html',
  './terms.html',
  './contact.html',
  './offline.html',
  './404.html',
  './src/css/main.css',
  './manifest.webmanifest',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
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
            .filter(key => key.startsWith('manzala-') && ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key))
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

// ── Fetch Strategy ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Real-time Firebase RTDB & Worker API -> Bypass SW to keep real-time sync
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // Images -> Cache First
  if (url.hostname.includes('r2.dev') || url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // Static assets (CSS, JS, Fonts) -> Stale-While-Revalidate
  if (
    url.pathname.match(/\.(css|js|woff2|woff|ttf)$/) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(staleWhileRevalidateStrategy(request, STATIC_CACHE));
    return;
  }

  // Navigation requests
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
});

async function cacheFirstStrategy(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  return fetchAndCache(request, cache);
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  if (cached) return cached;

  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  if (request.mode === 'navigate') {
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) return offlinePage;
  }

  return new Response('Offline', { status: 503, statusText: 'Offline' });
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

// ═════════════════════════════════════════════════════════════════════
//  PWA PUSH NOTIFICATIONS & BACKGROUND NATIVE MOBILE NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════

// 1. Web Push Event from Server/FCM
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
    data: { url, timestamp: Date.now() },
    actions: [
      { action: 'open', title: 'عرض التفاصيل 👁️' },
      { action: 'close', title: 'إغلاق' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Notification Click Handler (Deep-Linking to target page in PWA)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If PWA window is already open, focus it and navigate
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
      // If PWA is closed in background, open window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. Message from Client Pages to Trigger Instant PWA Native Mobile Notification
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
