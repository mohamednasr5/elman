/**
 * notification.service.js
 * Comprehensive Notification Management & Crystal Web Audio Chime System
 * Provides real-time notifications, audio chimes, dismiss/delete controls, and tab filtering.
 */

import { getDB, dbGet, dbSet, dbRemove, dbUpdate } from '../core/db.js';

// ── Web Audio API Synthesized Crystal Chime ──
let _audioCtx = null;

function getAudioContext() {
  if (!_audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      _audioCtx = new AudioContextClass();
    }
  }
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

/**
 * Plays a pleasant crystal bell notification chime
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  const isSoundEnabled = localStorage.getItem('manzala_notif_sound_enabled') !== 'false';
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [1396.91, 1760.00, 2093.00];
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.28 / (index + 1), now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.6);
    });

    if (navigator.vibrate) {
      navigator.vibrate([70, 40, 110]);
    }
  } catch (err) {
    console.debug('[NotificationSound] Audio play handled:', err);
  }
}

/**
 * Toggle Notification Sound preference
 */
export function toggleNotificationSound() {
  const current = localStorage.getItem('manzala_notif_sound_enabled') !== 'false';
  const next = !current;
  localStorage.setItem('manzala_notif_sound_enabled', String(next));
  if (next) {
    playNotificationSound();
  }
  return next;
}

export function isNotificationSoundEnabled() {
  return localStorage.getItem('manzala_notif_sound_enabled') !== 'false';
}

// ── Notification Storage & Universal Management ──

/**
 * Get all deleted notification IDs across all storage keys
 */
export function getDeletedNotifIds(uid) {
  const merged = new Set();
  if (typeof localStorage === 'undefined') return merged;

  const keys = ['manzala_deleted_notifs_all', 'deleted_notifs_anon'];
  if (uid) {
    keys.push(`deleted_notifs_${uid}`);
  }

  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        JSON.parse(raw).forEach(id => merged.add(String(id)));
      }
    } catch (_) {}
  });

  return merged;
}

/**
 * Get all read notification IDs across all storage keys
 */
export function getReadNotifIds(uid) {
  const merged = new Set();
  if (typeof localStorage === 'undefined') return merged;

  const keys = ['manzala_read_notifs_all', 'read_global_notifs_anon'];
  if (uid) {
    keys.push(`read_global_notifs_${uid}`);
  }

  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        JSON.parse(raw).forEach(id => merged.add(String(id)));
      }
    } catch (_) {}
  });

  return merged;
}

/**
 * Delete / Dismiss a single notification permanently
 */
export async function deleteSingleNotification(notifId, uid) {
  if (!notifId) return;
  const idStr = String(notifId);

  // Save to universal deleted set
  const set = getDeletedNotifIds(uid);
  set.add(idStr);
  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_deleted_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`deleted_notifs_${uid}`, JSON.stringify(arr));
    localStorage.setItem('deleted_notifs_anon', JSON.stringify(arr));
  }

  if (uid) {
    try {
      await dbRemove(`userNotifications/${uid}/${idStr}`);
    } catch (_) {}
  }
}

/**
 * Clear / Delete all notifications
 */
export async function clearAllUserNotifications(uid) {
  // 1. Fetch all existing notifications
  const allNotifs = await fetchManagedUserNotifications(uid);
  const set = getDeletedNotifIds(uid);

  allNotifs.forEach(n => {
    if (n.id) set.add(String(n.id));
  });

  try {
    const globalNotifsMap = (await dbGet('globalNotifications')) || {};
    Object.keys(globalNotifsMap).forEach(id => set.add(String(id)));
  } catch (_) {}

  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_deleted_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`deleted_notifs_${uid}`, JSON.stringify(arr));
    localStorage.setItem('deleted_notifs_anon', JSON.stringify(arr));
    localStorage.removeItem('manzala_global_broadcast_notifs_cache');
  }

  if (uid) {
    try {
      await dbRemove(`userNotifications/${uid}`);
    } catch (_) {}
  }
}

/**
 * Mark a single notification as read
 */
export async function markSingleNotificationAsRead(notifId, uid) {
  if (!notifId) return;
  const idStr = String(notifId);

  const set = getReadNotifIds(uid);
  set.add(idStr);
  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_read_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(arr));
    localStorage.setItem('read_global_notifs_anon', JSON.stringify(arr));
  }

  if (uid) {
    try {
      await dbUpdate(`userNotifications/${uid}/${idStr}`, { isRead: true });
    } catch (_) {}
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllUserNotificationsAsRead(uid) {
  const allNotifs = await fetchManagedUserNotifications(uid);
  const set = getReadNotifIds(uid);

  allNotifs.forEach(n => {
    if (n.id) set.add(String(n.id));
  });

  try {
    const globalNotifsMap = (await dbGet('globalNotifications')) || {};
    Object.keys(globalNotifsMap).forEach(id => set.add(String(id)));
  } catch (_) {}

  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_read_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(arr));
    localStorage.setItem('read_global_notifs_anon', JSON.stringify(arr));
  }

  if (uid) {
    try {
      const userNotifsMap = (await dbGet(`userNotifications/${uid}`)) || {};
      const updates = {};
      Object.keys(userNotifsMap).forEach(k => {
        updates[`userNotifications/${uid}/${k}/isRead`] = true;
      });
      if (Object.keys(updates).length > 0) {
        await dbUpdate('', updates);
      }
    } catch (_) {}
  }
}

/**
 * Get filtered & managed user notifications
 */
/**
 * Get filtered & managed user notifications (100% Cross-Device Realtime Synced)
 */
/**
 * Get filtered & managed user notifications (Direct Cloud RTDB Stream from /platformNotifications/)
 */
export async function fetchManagedUserNotifications(uid) {
  const deletedIds = getDeletedNotifIds(uid);
  const readIds = getReadNotifIds(uid);
  const mergedMap = {};

  // 1. Primary Direct Cloud /platformNotifications/ Stream (Zero latency, all users)
  try {
    const db = getDB();
    const snap = await db.ref('platformNotifications').once('value');
    if (snap && snap.exists()) {
      snap.forEach(child => {
        const id = String(child.key);
        const val = child.val();
        if (val && !deletedIds.has(id)) {
          mergedMap[id] = { id, ...val, isBroadcast: true, isRead: readIds.has(id) };
        }
      });
    }
  } catch (err) {
    console.debug('[NotificationService] Cloud read fallback:', err.message);
  }

  // 2. Personal User Notifications Inbox
  if (uid) {
    try {
      const db = getDB();
      const snap = await db.ref(`userNotifications/${uid}`).once('value');
      if (snap && snap.exists()) {
        snap.forEach(child => {
          const id = String(child.key);
          const val = child.val();
          if (val && !deletedIds.has(id)) {
            mergedMap[id] = { 
              id, 
              ...val, 
              isBroadcast: !!val.type && val.type !== 'profile_visit',
              isRead: Boolean(val.isRead || readIds.has(id))
            };
          }
        });
      }
    } catch (_) {}
  }

  // 3. Fallback: Synthesize from Verified Places
  try {
    const db = getDB();
    const snap = await db.ref('places').once('value');
    if (snap && snap.exists()) {
      snap.forEach(child => {
        const place = child.val();
        const id = child.key;
        if (place && place.isVerified) {
          const notifId = 'notif_verified_' + id;
          if (!deletedIds.has(notifId) && !mergedMap[notifId]) {
            const targetUrl = 'place.html?slug=' + encodeURIComponent(place.slug || id);
            mergedMap[notifId] = {
              id: notifId,
              type: 'place_verified',
              title: '👑 توثيق رسمي: ' + (place.name || 'مكان موثق'),
              placeId: id,
              placeName: place.name || 'المكان',
              placeSlug: place.slug || id,
              message: 'وثّق (' + (place.name || 'المكان') + ') ملَفَه لكي يظهر أمام الكل في كامل دليل المنزلة والمطرية الرقمي أولاً!',
              actionText: 'وثّق ملفك الآن 🚀',
              actionUrl: targetUrl,
              url: targetUrl,
              icon: place.logoUrl || './icons/icon-192x192.png',
              createdAt: Number(place.verifiedAt || place.updatedAt || place.createdAt || (Date.now() - 3600000)),
              isBroadcast: true,
              isRead: readIds.has(notifId)
            };
          }
        }
      });
    }
  } catch (_) {}

  const all = Object.values(mergedMap).map(n => ({
    ...n,
    isRead: Boolean(n.isRead || readIds.has(String(n.id)))
  }));

  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Update Notification Badges across Header, Sidebar, and Mobile Navigation instantly
 */
export async function updateAllNotificationBadges(uid) {
  try {
    const notifs = await fetchManagedUserNotifications(uid);
    const unread = notifs.filter(n => !n.isRead).length;

    const allBadgeSelectors = [
      '#header-notifs-badge',
      '#header-notif-badge',
      '.header-notif-badge',
      '#sidebar-notifs-badge',
      '.sidebar-notifs-badge',
      '#bottom-notifs-badge',
      '.bottom-nav-notif-badge',
      '[data-notifs-badge]'
    ];

    allBadgeSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(badge => {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline-flex' : 'none';
        if (unread > 0) {
          badge.classList.remove('badge-pop-anim');
          void badge.offsetWidth;
          badge.classList.add('badge-pop-anim');
        }
      });
    });
  } catch (_) {}
}

let _isLiveNotifSubscribed = false;

/**
 * Initialize Direct Live Notification Stream from /platformNotifications/
 */
export function initLiveNotificationSubscriber(uid) {
  if (typeof window === 'undefined') return;

  updateAllNotificationBadges(uid);

  if (_isLiveNotifSubscribed) return;
  _isLiveNotifSubscribed = true;

  // Listen to Local Cross-Window sync
  window.addEventListener('manzala:realtime_sync', () => updateAllNotificationBadges(uid));
  window.addEventListener('manzala:new_broadcast_notification', (e) => {
    updateAllNotificationBadges(uid);
    if (e.detail) showLiveNotificationPopup(e.detail);
  });
  window.addEventListener('focus', () => updateAllNotificationBadges(uid));

  // Live Firebase RTDB Stream on /platformNotifications/
  try {
    const db = getDB();
    const startTime = Date.now();

    // Any notification change or addition triggers instant badge update
    db.ref('platformNotifications').on('value', () => {
      updateAllNotificationBadges(uid);
    });

    // New notification added in real-time -> Trigger pop chime & floating banner
    db.ref('platformNotifications').on('child_added', (snap) => {
      const n = snap.val();
      updateAllNotificationBadges(uid);
      if (n && (Number(n.createdAt) || 0) > startTime - 3000) {
        showLiveNotificationPopup({ id: snap.key, ...n });
      }
    });

    // Live personal notifications
    if (uid) {
      db.ref(`userNotifications/${uid}`).on('value', () => {
        updateAllNotificationBadges(uid);
      });
    }

  } catch (err) {
    console.debug('[NotificationService] Live stream initialized:', err.message);
  }
}

// ── In-App Live Floating Notification Banner ──

export function showLiveNotificationPopup(notification) {
  if (typeof document === 'undefined') return;

  const deletedIds = getDeletedNotifIds();
  if (notification.id && deletedIds.has(String(notification.id))) return;

  playNotificationSound();

  let popupBox = document.getElementById('manzala-live-notifs-container');
  if (!popupBox) {
    popupBox = document.createElement('div');
    popupBox.id = 'manzala-live-notifs-container';
    popupBox.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100vw - 40px);
      pointer-events: none;
    `;
    document.body.appendChild(popupBox);
  }

  const notifEl = document.createElement('div');
  notifEl.className = 'live-notif-toast animate-slide-in';
  notifEl.style.cssText = `
    background: rgba(15, 23, 42, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-right: 4px solid ${notification.type === 'place_verified' ? '#F59E0B' : '#10B981'};
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.3s ease;
  `;

  const isVerified = notification.type === 'place_verified';
  const icon = isVerified ? '👑' : '🏪';
  const title = isVerified ? 'توثيق رسمي جديد' : 'انضمام مكان جديد';

  notifEl.innerHTML = `
    <div style="font-size: 24px; flex-shrink: 0; background: rgba(255,255,255,0.1); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      ${icon}
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-size: 11px; color: ${isVerified ? '#FDE68A' : '#6EE7B7'}; font-weight: 700;">
        ${title} • الآن
      </div>
      <div style="font-size: 13.5px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
        ${notification.placeName || 'مكان جديد'}
      </div>
      <div style="font-size: 11.5px; color: rgba(255,255,255,0.75); margin-top: 2px;">
        ${notification.placeAddress || 'المنزلة والمطرية'}
      </div>
    </div>
    <button type="button" class="live-notif-close-btn" style="background: none; border: none; color: rgba(255,255,255,0.5); font-size: 16px; cursor: pointer; padding: 4px; border-radius: 4px; line-height: 1;">
      ✕
    </button>
  `;

  notifEl.addEventListener('click', (e) => {
    if (e.target.closest('.live-notif-close-btn')) {
      e.stopPropagation();
      notifEl.remove();
      return;
    }
    const targetUrl = notification.actionUrl || (notification.placeSlug ? `place.html?slug=${notification.placeSlug}` : 'places.html');
    window.location.href = targetUrl;
  });

  popupBox.appendChild(notifEl);

  setTimeout(() => {
    if (notifEl.parentNode) {
      notifEl.style.opacity = '0';
      notifEl.style.transform = 'translateY(-10px)';
      setTimeout(() => notifEl.remove(), 300);
    }
  }, 6500);
}

// ── Global Realtime Notifications Listener for PWA / Web ──
let _hasInitializedLiveListener = false;

export function initGlobalRealtimeNotificationsListener(currentUser) {
  if (_hasInitializedLiveListener || typeof window === 'undefined') return;
  _hasInitializedLiveListener = true;

  updateAllNotificationBadges(currentUser?.uid);

  try {
    const db = getDB();
    if (!db) return;

    const startTime = Date.now();

    db.ref('globalNotifications')
      .orderByChild('createdAt')
      .startAt(startTime)
      .on('child_added', (snap) => {
        const notif = snap.val();
        if (notif && notif.createdAt >= startTime - 2000) {
          showLiveNotificationPopup({ id: snap.key, ...notif });
          updateAllNotificationBadges(currentUser?.uid);
        }
      });

    if (currentUser?.uid) {
      db.ref(`userNotifications/${currentUser.uid}`)
        .orderByChild('createdAt')
        .startAt(startTime)
        .on('child_added', (snap) => {
          const notif = snap.val();
          if (notif && notif.createdAt >= startTime - 2000) {
            showLiveNotificationPopup({ id: snap.key, ...notif });
            updateAllNotificationBadges(currentUser.uid);
          }
        });
    }
  } catch (err) {
    console.debug('[RealtimeNotifications] Listener setup handled:', err);
  }
}


// ═════════════════════════════════════════════════════════════════════
//  FIREBASE CLOUD MESSAGING (FCM) WEB PUSH NOTIFICATION ENGINE
// ═════════════════════════════════════════════════════════════════════

let _fcmMessaging = null;
let _defaultVapidKey = 'BGysPV54ekHXamWK9ZZ_dkoW2PgeGjQbniLME3oEY277KzX4KlgjPWVwdvz_e5eZosozZjk9GjdvhzWRE1R4yxQ';

/**
 * Get or initialize Firebase Messaging instance
 */
export function getFirebaseMessaging() {
  if (!_fcmMessaging && typeof window !== 'undefined' && typeof firebase !== 'undefined' && firebase.messaging) {
    try {
      _fcmMessaging = firebase.messaging();
    } catch (err) {
      console.warn('[FCM] Messaging init warning:', err);
    }
  }
  return _fcmMessaging;
}

/**
 * Generate or retrieve a persistent device ID for this browser/phone
 */
function getOrCreateDeviceId() {
  if (typeof localStorage === 'undefined') return 'device_' + Math.random().toString(36).substr(2, 9);
  let id = localStorage.getItem('manzala_device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
    localStorage.setItem('manzala_device_id', id);
  }
  return id;
}

/**
 * Register FCM Push Token in Firebase Database for user / device
 */
export async function registerDevicePushToken(token, user = null) {
  if (!token) return;
  const deviceId = getOrCreateDeviceId();
  const db = getDB();

  const deviceInfo = {
    fcmToken: token,
    platform: navigator.platform || 'unknown',
    userAgent: navigator.userAgent || 'unknown',
    notificationsEnabled: true,
    lastActive: firebase.database.ServerValue.TIMESTAMP,
    updatedAt: new Date().toISOString()
  };

  // 1. If user is logged in, register in user's devices node
  if (user && user.uid) {
    await db.ref(`users/${user.uid}/devices/${deviceId}`).update(deviceInfo).catch(() => {});
  }

  // 2. Register in global active FCM tokens pool for general broadcasts & ATM updates
  const tokenKey = token.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  await db.ref(`fcmTokens/${tokenKey}`).set({
    token,
    deviceId,
    uid: user?.uid || null,
    lastUpdated: firebase.database.ServerValue.TIMESTAMP
  }).catch(() => {});

  localStorage.setItem('manzala_fcm_token', token);
}

/**
 * Request Push Notification Permission and acquire FCM Token
 */
export async function requestFCMNotificationPermission(vapidKey = '') {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  const effectiveVapid = vapidKey || _defaultVapidKey || window._MANZALA_VAPID_KEY || '';

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'denied' };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return { success: false, reason: 'no_messaging' };
    }

    // Get FCM registration token
    const tokenOptions = {
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    };
    if (effectiveVapid) {
      tokenOptions.vapidKey = effectiveVapid;
    }

    const token = await messaging.getToken(tokenOptions);
    if (token) {
      const user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
      await registerDevicePushToken(token, user);
      playNotificationSound();
      return { success: true, token };
    }

    return { success: false, reason: 'no_token' };
  } catch (err) {
    console.error('[FCM] Permission/Token error:', err);
    return { success: false, error: err };
  }
}

/**
 * Listen for foreground push messages while PWA is open
 */
export function setupForegroundMessageListener(onMessageCallback) {
  const messaging = getFirebaseMessaging();
  if (!messaging) return;

  messaging.onMessage((payload) => {
    console.log('[FCM] Foreground push message received:', payload);
    playNotificationSound();

    const title = payload.notification?.title || payload.data?.title || 'تنبيه جديد';
    const body = payload.notification?.body || payload.data?.body || '';

    // Show in-app banner or toast
    if (typeof toast !== 'undefined' && toast.info) {
      toast.info(`🔔 ${title}: ${body}`);
    }

    if (onMessageCallback) {
      onMessageCallback(payload);
    }
  });
}

/**
 * Mount smart in-app Push Notification prompt banner on first visit
 */
export function mountPushNotificationPrompt(vapidKey = '') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!('Notification' in window) || Notification.permission === 'granted') return;
  if (sessionStorage.getItem('manzala_push_prompt_dismissed')) return;

  if (vapidKey) _defaultVapidKey = vapidKey;

  setTimeout(() => {
    if (document.getElementById('manzala-push-permission-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'manzala-push-permission-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 75px;
      right: 16px;
      left: 16px;
      max-width: 440px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0F2B48, #1B4F72);
      color: #fff;
      border: 1.5px solid #F5A623;
      border-radius: 16px;
      padding: 14px 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      animation: pushSlideUp 0.35s ease forwards;
    `;

    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px">
        <span style="font-size:24px">🔔</span>
        <div>
          <div style="font-weight:800;font-size:13.5px;color:#fff;margin-bottom:2px">تفعيل إشعارات دليل المنزلة والمطرية</div>
          <div style="font-size:11.5px;color:rgba(255,255,255,0.8);line-height:1.4">تلقي تنبيهات العروض، وتحديثات ماكينات ATM والأماكن فوراً</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button type="button" id="btn-accept-push-notif" style="background:#F5A623;color:#0F2B48;border:none;border-radius:8px;padding:7px 14px;font-weight:800;font-size:12px;cursor:pointer">
          تفعيل 🔔
        </button>
        <button type="button" id="btn-dismiss-push-notif" style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer;opacity:0.7;padding:4px">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('btn-dismiss-push-notif')?.addEventListener('click', () => {
      banner.remove();
      sessionStorage.setItem('manzala_push_prompt_dismissed', 'true');
    });

    document.getElementById('btn-accept-push-notif')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-accept-push-notif');
      if (btn) btn.textContent = 'جاري التفعيل...';
      const res = await requestFCMNotificationPermission(_defaultVapidKey);
      if (res.success) {
        banner.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;color:#10B981;font-weight:800;font-size:13px">
            <span>✓</span>
            <span>تم تفعيل إشعارات الهاتف بنجاح! 🔔</span>
          </div>
        `;
        setTimeout(() => banner.remove(), 2500);
      } else {
        banner.remove();
      }
    });
  }, 2000);
}


/**
 * Broadcasts an approved live news update to ALL users via In-App Notifications and Web Push
 */
/**
 * Broadcasts an approved live news update to ALL users via In-App Notifications and Web Push
 */
export async function broadcastLiveNewsPushNotification(post) {
  if (!post || !post.title) return;

  try {
    const db = getDB();
    const notifId = db.ref('globalNotifications').push().key;

    const notifData = {
      id: notifId,
      title: '🔥 يحدث الآن: ' + post.title,
      message: '📍 ' + (post.location || 'المنزلة والمطرية') + ' (' + (post.city || 'المنزلة') + ') ' + (post.details ? '— ' + post.details : ''),
      url: 'now.html',
      type: 'live_news',
      category: post.category || 'general',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      newsId: post.id || null,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    // 1. Write to both globalNotifications and notifications nodes in Firebase
    await Promise.all([
      db.ref('globalNotifications/' + notifId).set(notifData),
      db.ref('notifications/' + notifId).set(notifData)
    ]);

    // 2. Play chime sound and show live popup locally
    playNotificationSound();
    showLiveNotificationPopup(notifData);
    updateAllNotificationBadges();

    // 3. Trigger Browser Web Push Notification if granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            reg.showNotification(notifData.title, {
              body: notifData.message,
              icon: './icons/icon-192x192.png',
              badge: './icons/icon-96x96.png',
              vibrate: [100, 50, 150],
              data: { url: 'now.html' },
              tag: 'live-news-' + (post.id || notifId),
              renotify: true
            });
          }
        }
      } catch (pushErr) {
        console.warn('[NotificationService] Local push warning:', pushErr);
      }
    }

    console.log('[NotificationService] Broadcasted live news notification successfully:', notifId);
    return notifData;
  } catch (err) {
    console.warn('[NotificationService] broadcastLiveNewsPushNotification error:', err);
  }
}
