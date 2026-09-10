/**
 * دليل المنزلة والمطرية — Advanced PWA Service Worker
 * Live platform data stays network-first; Islamic content is local JSON and cache-first.
 */
try {
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: "AIzaSyCUGCecmvBdf6b38UVIM9zcxhbbux7VSzM",
    authDomain: "elmanzla-7402a.firebaseapp.com",
    projectId: "elmanzla-7402a",
    storageBucket: "elmanzla-7402a.firebasestorage.app",
    messagingSenderId: "252271215500",
    appId: "1:252271215500:web:adc234e58f4ba455fdcca9",
    measurementId: "G-EY6TEPLGSK"
  });

  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'دليل المنزلة والمطرية 🔔';
    const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'تنبيه جديد في دليل المنزلة والمطرية';
    const url = payload.data?.url || payload.data?.actionUrl || payload.notification?.click_action || './';
    eventlessNotification(title, body, url, payload);
  });
} catch (err) {
  console.warn('[SW] Firebase messaging init warning:', err);
}

const CACHE_VERSION = 'v3.6.0-service-requests-who-is-available-v1';
const STATIC_CACHE = 'manzala-static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'manzala-dynamic-' + CACHE_VERSION;
const IMAGE_CACHE = 'manzala-images-' + CACHE_VERSION;

const STATIC_ASSETS = [
  './offline.html',
  './place.html',
  './src/css/main.css',
  './src/css/islamic-hub.css',
  './src/js/ui/pages/islamic-hub.js',
  './manifest.webmanifest',
  './quran.html',
  './hadith.html',
  './quran-search.html',
  './icons/icon-48x48.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-192x192.png',
  './icons/icon-maskable-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512x512.png'
];

const OFFLINE_PAGE = './offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Static install warning:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.filter(key => ![STATIC_CACHE, IMAGE_CACHE, DYNAMIC_CACHE].includes(key))
          .map(key => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;

  // Live APIs and Firebase/Auth/notification infrastructure are never intercepted.
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('workers.dev')
  ) return;

  // Quran/Hadith local datasets: cache-first after first successful load.
  if (
    url.origin === self.location.origin &&
    (url.pathname.endsWith('/quran.json') ||
     url.pathname.endsWith('/hadith.json') ||
     url.pathname.endsWith('/data/quran.json') ||
     url.pathname.endsWith('/data/hadith.json') ||
     url.pathname.startsWith('/quran/source/') ||
     url.pathname.startsWith('/hadith/db/'))
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    // Instant App-Shell for Place details page (0ms mobile / PWA subsecond transition)
    if (url.pathname === '/place.html' || url.pathname.endsWith('/place.html')) {
      event.respondWith(appShellStrategy(request));
      return;
    }
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  if (url.hostname.includes('r2.dev') || url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // App scripts and styles: network-first when online to guarantee immediate updates in PWA
  if (url.origin === self.location.origin && url.pathname.match(/\.(js|css)$/i)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

async function networkFirstStrategy(request) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SW fetch timeout')), 8000))
    ]);
    if (response?.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
      const offline = await caches.match(OFFLINE_PAGE);
      if (offline) return offline;
    }
    return new Response('Network Error / Offline', {status:503, statusText:'Offline'});
  }
}

async function appShellStrategy(request) {
  try {
    const cached = (await caches.match('./place.html')) || (await caches.match('/place.html')) || (await caches.match(request));
    if (cached) {
      // Revalidate in background to keep shell up to date without blocking
      fetch(request).then(async (res) => {
        if (res?.status === 200) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put('./place.html', res.clone());
        }
      }).catch(() => {});
      return cached;
    }
  } catch (_) {}
  return networkFirstStrategy(request);
}

async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response?.status === 200) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return new Response('', {status:503});
  }
}

function eventlessNotification(title, body, url, payload) {
  return self.registration.showNotification(title, {
    body,
    icon: payload.notification?.icon || payload.data?.icon || './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200,100,200],
    tag: payload.data?.tag || ('fcm-bg-' + Date.now()),
    renotify: true,
    data: {url, timestamp: Date.now()}
  });
}

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = {message: event.data?.text?.() || ''};
  }

  const title = data.notification?.title || data.data?.title || data.title || 'دليل المنزلة والمطرية 🔔';
  const body = data.notification?.body || data.data?.body || data.data?.message || data.message || data.body || 'لديك تنبيه جديد في دليل المنزلة والمطرية';
  const url = data.data?.url || data.data?.actionUrl || data.url || data.notification?.click_action || './';

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: data.notification?.icon || data.data?.icon || data.icon || './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200,100,200],
    tag: data.tag || data.data?.tag || ('manzala-pwa-push-' + Date.now()),
    renotify: true,
    data: {url, timestamp: Date.now()}
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(windowClients => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) client.navigate(targetUrl);
          return;
        }
      }
      return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();

  if (event.data?.type === 'SHOW_PWA_NOTIFICATION') {
    const notif = event.data.payload || {};
    self.registration.showNotification(notif.title || 'دليل المنزلة والمطرية 🔔', {
      body: notif.message || notif.body || '',
      icon: notif.icon || './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [150,50,150,50,200],
      tag: notif.tag || 'pwa-local-push-' + Date.now(),
      renotify: true,
      data: {url: notif.url || notif.actionUrl || './'}
    });
  }
});
