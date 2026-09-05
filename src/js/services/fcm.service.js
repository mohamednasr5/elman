/**
 * fcm.service.js
 * Comprehensive Web Push & Firebase Cloud Messaging (FCM) Client Service
 * Handles:
 *  1. Service Worker & Push Notification Permission Management
 *  2. Device Web Push / FCM Token Registration in Firebase RTDB
 *  3. Android System Notification Display (Foreground & Background)
 *  4. Native Mobile User Opt-in Luxury Prompt
 *  5. Instant Push Test Chime & Diagnostics
 */

import { getDB } from '../core/db.js';
import { FCM_VAPID_KEY } from '../core/firebase.js';
import { showLiveNotificationPopup, updateAllNotificationBadges, playNotificationSound } from './notification.service.js';
import { toast } from '../ui/components/Toast.js';

let _fcmInitialized = false;

/**
 * Initialize Web Push / FCM Messaging on app startup
 */
export async function initFcmMessaging(user = null) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return;
  }
  if (_fcmInitialized) return;
  _fcmInitialized = true;

  try {
    // Wait for unified Service Worker to be active
    const registration = await navigator.serviceWorker.ready;

    // Check if Firebase messaging compat is available
    if (typeof firebase !== 'undefined' && firebase.messaging) {
      try {
        const messaging = firebase.messaging();

        // Handle Foreground Incoming Push Messages
        messaging.onMessage((payload) => {
          const title = payload.notification?.title || payload.data?.title || 'دليل المنزلة والمطرية 🔔';
          const message = payload.notification?.body || payload.data?.body || payload.data?.message || '';
          const actionUrl = payload.data?.url || payload.data?.actionUrl || payload.notification?.click_action || './';

          const notif = {
            title,
            message,
            actionUrl,
            createdAt: Date.now()
          };

          // 1. Show In-App Floating Toast & Sound
          showLiveNotificationPopup(notif);
          updateAllNotificationBadges(user?.uid);

          // 2. ALSO trigger Android System Notification if the page/browser is minimized or hidden
          if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
            registration.showNotification(title, {
              body: message,
              icon: payload.notification?.icon || payload.data?.icon || './icons/icon-192x192.png',
              badge: './icons/icon-96x96.png',
              dir: 'rtl',
              lang: 'ar',
              vibrate: [200, 100, 200],
              tag: payload.data?.tag || ('fcm-fore-' + Date.now()),
              renotify: true,
              data: { url: actionUrl }
            });
          }
        });

        // If permission already granted, auto-refresh token and update RTDB
        if (Notification.permission === 'granted') {
          await registerDeviceFcmToken(messaging, registration, user);
        }
      } catch (fcmErr) {
        console.debug('[FCM] Firebase messaging setup handled:', fcmErr.message);
      }
    }

    // If permission is default (not asked yet), mount the luxury prompt after short delay
    if (Notification.permission === 'default') {
      setTimeout(() => {
        mountPushNotificationPrompt(user);
      }, 3500);
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
      const registration = await navigator.serviceWorker.ready;

      // Register FCM Token if firebase.messaging is available
      if (typeof firebase !== 'undefined' && firebase.messaging) {
        try {
          const messaging = firebase.messaging();
          await registerDeviceFcmToken(messaging, registration, user);
        } catch (_) {}
      }

      // Trigger Welcome System Notification on Android / Desktop
      try {
        await registration.showNotification('🎉 تم تفعيل إشعارات المنزلة والمطرية بنجاح!', {
          body: 'ستصلك الآن تنبيهات الأماكن الجديدة، التوثيقات، وأهم العروض مباشرة على شاشة هاتفك.',
          icon: './icons/icon-192x192.png',
          badge: './icons/icon-96x96.png',
          dir: 'rtl',
          lang: 'ar',
          vibrate: [200, 100, 200],
          tag: 'manzala-welcome-push',
          renotify: true,
          data: { url: './' }
        });
      } catch (_) {}

      playNotificationSound();
      localStorage.setItem('manzala_push_granted', '1');
      return true;
    }
  } catch (err) {
    console.debug('[FCM] Permission request handled:', err.message);
  }
  return false;
}

/**
 * Register device FCM token in Firebase RTDB
 */
async function registerDeviceFcmToken(messaging, serviceWorkerRegistration, user = null) {
  try {
    const token = await messaging.getToken({
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration
    });

    if (token) {
      localStorage.setItem('manzala_fcm_token', token);
      const tokenKey = token.replace(/[^a-zA-Z0-9]/g, '_').slice(-40);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      const db = getDB();
      await db.ref('fcmTokens/' + tokenKey).set({
        token,
        uid: user?.uid || 'anonymous',
        userName: user?.displayName || user?.name || 'مستخدم المنصة',
        platform: isAndroid ? 'android' : (isIos ? 'ios' : 'desktop'),
        userAgent: navigator.userAgent,
        updatedAt: Date.now(),
        lastActive: Date.now()
      });
    }
  } catch (err) {
    console.debug('[FCM] Token registration handled:', err.message);
  }
}

/**
 * Luxury Non-Intrusive Push Notification Prompt Banner
 */
export function mountPushNotificationPrompt(user = null) {
  if (typeof document === 'undefined') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;

  // Don't show if dismissed within 3 days
  const lastDismissed = localStorage.getItem('manzala_push_dismissed');
  if (lastDismissed && Date.now() - Number(lastDismissed) < 3 * 24 * 60 * 60 * 1000) {
    return;
  }

  // Prevent multiple banners
  if (document.getElementById('manzala-push-prompt-card')) return;

  const card = document.createElement('div');
  card.id = 'manzala-push-prompt-card';
  card.className = 'push-prompt-card';
  card.innerHTML = `
    <div class="push-prompt-inner">
      <div class="push-prompt-icon-wrap">
        <div class="push-prompt-halo"></div>
        <span class="push-prompt-emoji">🔔</span>
      </div>
      <div class="push-prompt-text">
        <strong class="push-prompt-title">تفعيل إشعارات الهاتف 🔔</strong>
        <p class="push-prompt-desc">
          استلم تنبيهات فورية على شاشة هاتفك عند إضافة أماكن جديدة، توثيق أنشطة، أو نزول عروض حصرية في المنزلة والمطرية.
        </p>
      </div>
      <div class="push-prompt-actions">
        <button type="button" class="btn-push-allow" id="btn-push-prompt-allow">
          <span>تفعيل الإشعارات الآن 🚀</span>
        </button>
        <button type="button" class="btn-push-dismiss" id="btn-push-prompt-dismiss">
          <span>لاحقاً</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(card);

  // Animate in
  requestAnimationFrame(() => {
    card.classList.add('active');
  });

  // Handle Allow
  card.querySelector('#btn-push-prompt-allow')?.addEventListener('click', async () => {
    card.classList.remove('active');
    setTimeout(() => card.remove(), 350);

    const granted = await requestNotificationPermissionAndRegisterToken(user);
    if (granted) {
      toast.success('تم تفعيل إشعارات الهاتف بنجاح 🔔');
    } else {
      toast.info('يمكنك تفعيل الإشعارات في أي وقت من إعدادات المتصفح.');
    }
  });

  // Handle Dismiss
  card.querySelector('#btn-push-prompt-dismiss')?.addEventListener('click', () => {
    card.classList.remove('active');
    setTimeout(() => card.remove(), 350);
    localStorage.setItem('manzala_push_dismissed', String(Date.now()));
  });
}

/**
 * Send an immediate Test Push Notification to the Android/Device System Tray
 */
export async function testPhoneSystemNotification(user = null) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    toast.error('متصفحك لا يدعم نظام إشعارات Web Push');
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('🔔 تجربة إشعار نظام Android', {
        body: 'تهانينا! نظام الإشعارات يعمل بكفاءة 100% على هاتفك وفي شريط الإشعارات.',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-96x96.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200],
        tag: 'test-push-' + Date.now(),
        renotify: true,
        data: { url: 'dashboard.html?section=notifications' }
      });
      playNotificationSound();
      toast.success('تم إرسال إشعار تجريبي لشريط تنبيهات هاتفك 📲');
      return true;
    } catch (err) {
      toast.error('حدث خطأ أثناء إظهار الإشعار: ' + err.message);
      return false;
    }
  } else {
    const granted = await requestNotificationPermissionAndRegisterToken(user);
    if (granted) {
      toast.success('تم تفعيل إشعارات الهاتف بنجاح 🔔');
      return true;
    } else {
      toast.warning('يرجى السماح بالإشعارات من إعدادات المتصفح.');
      return false;
    }
  }
}
