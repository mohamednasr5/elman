/**
 * fcm.service.js
 * Firebase Cloud Messaging Client Service
 * Registers device Web Push Tokens & listens for real-time foreground messages.
 */

import { getDB } from '../core/db.js';
import { FCM_VAPID_KEY } from '../core/firebase.js';
import { showLiveNotificationPopup, updateAllNotificationBadges } from './notification.service.js';

let _fcmInitialized = false;

export async function initFcmMessaging(user = null) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return;
  }
  if (_fcmInitialized) return;
  _fcmInitialized = true;

  try {
    if (typeof firebase === 'undefined' || !firebase.messaging) return;

    const messaging = firebase.messaging();

    // Register Service Worker explicitly for FCM
    const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: '/' });

    // Handle Foreground Messages (Instant Realtime In-App Popup)
    messaging.onMessage((payload) => {
      const notif = {
        title: payload.notification?.title || payload.data?.title || 'دليل المنزلة والمطرية 🔔',
        message: payload.notification?.body || payload.data?.body || '',
        actionUrl: payload.data?.url || payload.notification?.click_action || './',
        createdAt: Date.now()
      };
      showLiveNotificationPopup(notif);
      updateAllNotificationBadges(user?.uid);
    });

    // If permission already granted, auto-refresh token
    if (Notification.permission === 'granted') {
      await registerDeviceFcmToken(messaging, registration, user);
    }
  } catch (err) {
    console.debug('[FCM] Client init handled:', err.message);
  }
}

/**
 * Request Notification Permission and register FCM Token
 */
export async function requestNotificationPermissionAndRegisterToken(user = null) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = firebase.messaging();
      const registration = await navigator.serviceWorker.ready;
      await registerDeviceFcmToken(messaging, registration, user);
      return true;
    }
  } catch (err) {
    console.debug('[FCM] Permission request handled:', err.message);
  }
  return false;
}

async function registerDeviceFcmToken(messaging, serviceWorkerRegistration, user = null) {
  try {
    const token = await messaging.getToken({
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration
    });

    if (token) {
      const tokenKey = token.replace(/[^a-zA-Z0-9]/g, '_').slice(-40);
      const db = getDB();
      await db.ref('fcmTokens/' + tokenKey).set({
        token,
        uid: user?.uid || 'anonymous',
        userName: user?.displayName || user?.name || 'مستخدم المنصة',
        platform: navigator.userAgent.includes('Android') ? 'android' : (navigator.userAgent.includes('iPhone') ? 'ios' : 'desktop'),
        updatedAt: Date.now()
      });
    }
  } catch (err) {
    console.debug('[FCM] Token registration handled:', err.message);
  }
}
