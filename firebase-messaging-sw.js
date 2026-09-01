/**
 * firebase-messaging-sw.js
 * Official Firebase Cloud Messaging (FCM) Service Worker for Dalil Manzala
 * Receives background system push notifications when app/browser is completely closed.
 */

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBK0c6d7sCOqdj3ZikvVqz7qKy_lzJP3p0",
  authDomain: "elmanzla.firebaseapp.com",
  databaseURL: "https://elmanzla-default-rtdb.firebaseio.com",
  projectId: "elmanzla",
  storageBucket: "elmanzla.firebasestorage.app",
  messagingSenderId: "230168369208",
  appId: "1:230168369208:web:84175973e7838d07ddeecd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'دليل المنزلة والمطرية 🔔';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'تنبيه جديد في دليل المنزلة والمطرية',
    icon: payload.notification?.icon || './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [150, 50, 150, 50, 200],
    data: {
      url: payload.data?.url || payload.notification?.click_action || './'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
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
