/**
 * fcm.service.js
 * Hardened Web Push / Firebase Cloud Messaging client service.
 */

import { FCM_VAPID_KEY, WORKER_URL } from '../core/firebase.js';
import { getCurrentUser } from '../core/auth.js';
import { showLiveNotificationPopup, updateAllNotificationBadges, playNotificationSound } from './notification.service.js';
import { toast } from '../ui/components/Toast.js';

let _fcmInitialized = false;
let _lastRegisteredUserId = null;
let _messaging = null;
let _registration = null;

function resolveUser(user = null) {
  return (user && typeof user === 'object') ? user : (getCurrentUser?.() || null);
}

function notificationFromPayload(payload) {
  const title = payload?.notification?.title || payload?.data?.title || 'دليل المنزلة والمطرية 🔔';
  const message = payload?.notification?.body || payload?.data?.body || payload?.data?.message || '';
  const actionUrl = payload?.data?.url || payload?.data?.actionUrl || payload?.notification?.click_action || './';
  const icon = payload?.notification?.icon || payload?.data?.icon || './icons/icon-192x192.png';
  const tag = payload?.data?.tag || ('fcm-' + Date.now());
  return { id: payload?.data?.notificationId || tag, title, message, actionUrl, url: actionUrl, icon, tag, createdAt: Date.now(), type: payload?.data?.type || 'push' };
}

export async function initFcmMessaging(user = null) {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return false;
  const currentUser = resolveUser(user);
  try {
    _registration = _registration || await navigator.serviceWorker.ready;
    if (typeof firebase !== 'undefined' && firebase.messaging) {
      try {
        _messaging = _messaging || firebase.messaging();
        if (!_fcmInitialized) {
          _fcmInitialized = true;
          _messaging.onMessage((payload) => {
            const notif = notificationFromPayload(payload);
            const activeUser = resolveUser();
            showLiveNotificationPopup(notif, activeUser?.uid);
            updateAllNotificationBadges(activeUser?.uid);
            playNotificationSound();
          });
        }
        if (Notification.permission === 'granted') {
          const uid = currentUser?.uid || 'anonymous';
          if (_lastRegisteredUserId !== uid) {
            await registerDeviceFcmToken(_messaging, _registration, currentUser);
            _lastRegisteredUserId = uid;
          }
        }
      } catch (fcmErr) {
        console.debug('[FCM] Messaging setup handled:', fcmErr?.message || fcmErr);
      }
    }
    if (Notification.permission === 'default') setTimeout(() => mountPushNotificationPrompt(resolveUser()), 3500);
    return true;
  } catch (err) {
    console.debug('[FCM] Client init handled:', err?.message || err);
    return false;
  }
}

export async function requestNotificationPermissionAndRegisterToken(user = null) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  const currentUser = resolveUser(user);
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    _registration = _registration || await navigator.serviceWorker.ready;
    if (typeof firebase !== 'undefined' && firebase.messaging) {
      try {
        _messaging = _messaging || firebase.messaging();
        await registerDeviceFcmToken(_messaging, _registration, currentUser);
        _lastRegisteredUserId = currentUser?.uid || 'anonymous';
      } catch (err) {
        console.debug('[FCM] Token registration handled:', err?.message || err);
      }
    }
    try {
      await _registration.showNotification('🎉 تم تفعيل إشعارات المنزلة والمطرية بنجاح!', {
        body: 'ستصلك الآن تنبيهات الأماكن الجديدة، التوثيقات، وأهم العروض مباشرة على شاشة هاتفك.',
        icon: './icons/icon-192x192.png', badge: './icons/icon-96x96.png', dir: 'rtl', lang: 'ar',
        vibrate: [200, 100, 200], tag: 'manzala-welcome-push', renotify: true, data: { url: './' }
      });
    } catch (_) {}
    playNotificationSound();
    localStorage.setItem('manzala_push_granted', '1');
    localStorage.removeItem('manzala_push_dismissed');
    return true;
  } catch (err) {
    console.debug('[FCM] Permission request handled:', err?.message || err);
    return false;
  }
}

async function registerDeviceFcmToken(messaging, serviceWorkerRegistration, user = null) {
  try {
    const token = await messaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration });
    if (!token) return false;
    localStorage.setItem('manzala_fcm_token', token);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const platform = isAndroid ? 'android' : (isIos ? 'ios' : 'desktop');
    const response = await fetch(`${WORKER_URL}/api/fcm/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: user?.uid || 'anonymous', userName: user?.displayName || user?.name || 'مستخدم المنصة', platform, userAgent: navigator.userAgent }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`Token sync HTTP ${response.status}`);
    return true;
  } catch (err) {
    console.debug('[FCM] Token registration handled:', err?.message || err);
    return false;
  }
}

export function mountPushNotificationPrompt(user = null) {
  if (typeof document === 'undefined') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
  const currentUser = resolveUser(user);
  const lastDismissed = localStorage.getItem('manzala_push_dismissed');
  if (lastDismissed && Date.now() - Number(lastDismissed) < 3 * 24 * 60 * 60 * 1000) return;
  if (document.getElementById('manzala-push-prompt-card')) return;
  const card = document.createElement('div');
  card.id = 'manzala-push-prompt-card'; card.className = 'push-prompt-card';
  card.innerHTML = `<div class="push-prompt-inner"><div class="push-prompt-icon-wrap"><div class="push-prompt-halo"></div><span class="push-prompt-emoji">🔔</span></div><div class="push-prompt-text"><strong class="push-prompt-title">تفعيل إشعارات الهاتف 🔔</strong><p class="push-prompt-desc">استلم تنبيهات فورية على شاشة هاتفك عند إضافة أماكن جديدة، توثيق أنشطة، أو نزول عروض حصرية في المنزلة والمطرية.</p></div><div class="push-prompt-actions"><button type="button" class="btn-push-allow" id="btn-push-prompt-allow"><span>تفعيل الإشعارات الآن 🚀</span></button><button type="button" class="btn-push-dismiss" id="btn-push-prompt-dismiss"><span>لاحقاً</span></button></div></div>`;
  document.body.appendChild(card); requestAnimationFrame(() => card.classList.add('active'));
  card.querySelector('#btn-push-prompt-allow')?.addEventListener('click', async () => {
    card.classList.remove('active'); setTimeout(() => card.remove(), 350);
    const granted = await requestNotificationPermissionAndRegisterToken(resolveUser(currentUser));
    if (granted) toast.success('تم تفعيل إشعارات الهاتف بنجاح 🔔'); else toast.info('يمكنك تفعيل الإشعارات في أي وقت من إعدادات المتصفح.');
  });
  card.querySelector('#btn-push-prompt-dismiss')?.addEventListener('click', () => { card.classList.remove('active'); setTimeout(() => card.remove(), 350); localStorage.setItem('manzala_push_dismissed', String(Date.now())); });
}

export async function testPhoneSystemNotification(user = null) {
  if (typeof window === 'undefined' || !('Notification' in window)) { toast.error('متصفحك لا يدعم نظام إشعارات Web Push'); return false; }
  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermissionAndRegisterToken(user);
    if (granted) toast.success('تم تفعيل إشعارات الهاتف بنجاح 🔔'); else toast.warning('يرجى السماح بالإشعارات من إعدادات المتصفح.');
    return granted;
  }
  try {
    _registration = _registration || await navigator.serviceWorker.ready;
    await _registration.showNotification('🔔 تجربة إشعار نظام Android', {
      body: 'تهانينا! نظام الإشعارات يعمل بكفاءة على هاتفك وفي شريط الإشعارات.', icon: './icons/icon-192x192.png', badge: './icons/icon-96x96.png', dir: 'rtl', lang: 'ar', vibrate: [200, 100, 200], tag: 'test-push-' + Date.now(), renotify: true, data: { url: 'dashboard.html?section=notifications' }
    });
    playNotificationSound(); toast.success('تم إرسال إشعار تجريبي لشريط تنبيهات هاتفك 📲'); return true;
  } catch (err) { toast.error('حدث خطأ أثناء إظهار الإشعار: ' + err.message); return false; }
}
