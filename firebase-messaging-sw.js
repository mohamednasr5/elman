/**
 * firebase-messaging-sw.js
 * Firebase Cloud Messaging Service Worker for Background Push Notifications
 */

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBK0c6d7sCOqdj3ZikvVqz7qKy_lzJP3p0",
  authDomain: "elmanzla.firebaseapp.com",
  databaseURL: "https://elmanzla-default-rtdb.firebaseio.com",
  projectId: "elmanzla",
  storageBucket: "elmanzla.firebasestorage.app",
  messagingSenderId: "230168369208",
  appId: "1:230168369208:web:84175973e7838d07ddeecd",
  measurementId: "G-JD2LSTR2G1"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'دليل المنزلة والمطرية 🔔';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'لديك تنبيه جديد من دليل المنزلة والمطرية',
    icon: payload.notification?.icon || payload.data?.icon || './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    image: payload.notification?.image || payload.data?.image,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [100, 50, 100],
    tag: payload.data?.tag || 'manzala-general-notification',
    renotify: true,
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || './',
      timestamp: Date.now()
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
