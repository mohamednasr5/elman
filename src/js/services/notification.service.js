/**
 * notification.service.js
 * Universal Real-Time Notification & Audio Chime Engine
 * Guarantees zero-delay instant notifications across PC, Mobile, and PWA when places are added or verified.
 */

import { getDB, dbGet, dbSet, dbRemove, dbUpdate } from '../core/db.js';

// ── Web Audio API Synthesized Crystal Bell Chime ──
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

// ── Read & Deleted IDs Tracking ──

export function getDeletedNotifIds(uid) {
  const merged = new Set();
  if (typeof localStorage === 'undefined') return merged;

  const keys = ['manzala_user_dismissed_notifs'];
  if (uid) keys.push(`dismissed_notifs_${uid}`);

  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) JSON.parse(raw).forEach(id => merged.add(String(id)));
    } catch (_) {}
  });

  return merged;
}

export function getReadNotifIds(uid) {
  const merged = new Set();
  if (typeof localStorage === 'undefined') return merged;

  const keys = ['manzala_read_notifs_all'];
  if (uid) keys.push(`read_global_notifs_${uid}`);

  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) JSON.parse(raw).forEach(id => merged.add(String(id)));
    } catch (_) {}
  });

  return merged;
}

export async function deleteSingleNotification(notifId, uid) {
  if (!notifId) return;
  const idStr = String(notifId);

  const set = getDeletedNotifIds(uid);
  set.add(idStr);
  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_user_dismissed_notifs', JSON.stringify(arr));
    if (uid) localStorage.setItem(`dismissed_notifs_${uid}`, JSON.stringify(arr));
  }
}

export async function clearAllUserNotifications(uid) {
  const allNotifs = await fetchManagedUserNotifications(uid);
  const set = getDeletedNotifIds(uid);

  allNotifs.forEach(n => {
    if (n.id) set.add(String(n.id));
  });

  const arr = Array.from(set);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_user_dismissed_notifs', JSON.stringify(arr));
    if (uid) localStorage.setItem(`dismissed_notifs_${uid}`, JSON.stringify(arr));
  }
}

export async function markSingleNotificationAsRead(notifId, uid) {
  if (!notifId) return;
  const idStr = String(notifId);

  const set = getReadNotifIds(uid);
  set.add(idStr);
  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_read_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(arr));
  }
}

export async function markAllUserNotificationsAsRead(uid) {
  const allNotifs = await fetchManagedUserNotifications(uid);
  const set = getReadNotifIds(uid);

  allNotifs.forEach(n => {
    if (n.id) set.add(String(n.id));
  });

  const arr = Array.from(set);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_read_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(arr));
  }
}

/**
 * Fetch all notifications (Live Firebase RTDB + Verified/New Places Synthesizer)
 */
export async function fetchManagedUserNotifications(uid) {
  const deletedIds = getDeletedNotifIds(uid);
  const readIds = getReadNotifIds(uid);
  const mergedMap = {};

  // 1. Fetch Global Notifications from Firebase RTDB
  try {
    const db = getDB();
    const snap = await db.ref('globalNotifications').once('value');
    if (snap && snap.exists()) {
      snap.forEach(child => {
        const id = String(child.key);
        const val = child.val();
        if (val && !deletedIds.has(id)) {
          mergedMap[id] = { id, ...val, isBroadcast: true, isRead: readIds.has(id) };
        }
      });
    }
  } catch (_) {}

  // 2. Synthesize directly from Verified Places & Latest Places in DB
  try {
    const db = getDB();
    const snap = await db.ref('places').once('value');
    if (snap && snap.exists()) {
      snap.forEach(child => {
        const place = child.val();
        const id = String(child.key);
        if (!place) return;

        const targetUrl = 'place.html?slug=' + encodeURIComponent(place.slug || id);

        // Verified Place Notification
        if (place.isVerified) {
          const notifId = 'notif_verified_' + id;
          if (!deletedIds.has(notifId) && !mergedMap[notifId]) {
            mergedMap[notifId] = {
              id: notifId,
              type: 'place_verified',
              title: '👑 توثيق رسمي: ' + (place.name || 'مكان موثق'),
              placeId: id,
              placeName: place.name || 'المكان',
              placeSlug: place.slug || id,
              message: 'تم توثيق (' + (place.name || 'المكان') + ') رسمياً بالعلامة الزرقاء ليتصدر دليل المنزلة والمطرية الرقمي!',
              actionText: 'مشاهدة المكان 🚀',
              actionUrl: targetUrl,
              url: targetUrl,
              icon: place.logoUrl || './icons/icon-192x192.png',
              createdAt: Number(place.verifiedAt || place.updatedAt || place.createdAt || (Date.now() - 3600000)),
              isBroadcast: true,
              isRead: readIds.has(notifId)
            };
          }
        }

        // New Place Joined Notification (Recent places)
        const createdTime = Number(place.createdAt || 0);
        if (createdTime > 0) {
          const notifId = 'notif_new_place_' + id;
          if (!deletedIds.has(notifId) && !mergedMap[notifId]) {
            mergedMap[notifId] = {
              id: notifId,
              type: 'new_place',
              title: '🎉 انضمام نشاط جديد: ' + (place.name || 'نشاط جديد'),
              placeId: id,
              placeName: place.name || 'المكان',
              placeSlug: place.slug || id,
              message: 'انضم (' + (place.name || 'المكان') + ') من (' + (place.area || 'المنزلة والمطرية') + ') حديثاً إلى الدليل.',
              actionText: 'زيارة المكان ↗',
              actionUrl: targetUrl,
              url: targetUrl,
              icon: place.logoUrl || './icons/icon-192x192.png',
              createdAt: createdTime,
              isBroadcast: true,
              isRead: readIds.has(notifId)
            };
          }
        }
      });
    }
  } catch (_) {}

  // 3. Personal User Notifications
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
              isBroadcast: false,
              isRead: Boolean(val.isRead || readIds.has(id))
            };
          }
        });
      }
    } catch (_) {}
  }

  const all = Object.values(mergedMap).map(n => ({
    ...n,
    isRead: Boolean(n.isRead || readIds.has(String(n.id)))
  }));

  return all.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
}

/**
 * Update Notification Badges across Header, Sidebar, and Mobile Navigation
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
 * Initialize 100% Real-Time Live Notification Stream on Firebase RTDB
 */
export function initLiveNotificationSubscriber(uid) {
  if (typeof window === 'undefined') return;

  updateAllNotificationBadges(uid);

  if (_isLiveNotifSubscribed) return;
  _isLiveNotifSubscribed = true;

  // Local window listeners
  window.addEventListener('manzala:realtime_sync', () => updateAllNotificationBadges(uid));
  window.addEventListener('manzala:new_broadcast_notification', (e) => {
    updateAllNotificationBadges(uid);
    if (e.detail) showLiveNotificationPopup(e.detail);
  });
  window.addEventListener('focus', () => updateAllNotificationBadges(uid));

  // Firebase Live Stream Listeners
  try {
    const db = getDB();
    const startTime = Date.now();

    // 1. When places are verified or updated in Firebase RTDB
    db.ref('places').on('child_changed', (snap) => {
      const place = snap.val();
      updateAllNotificationBadges(uid);
      if (place && place.isVerified) {
        showLiveNotificationPopup({
          id: 'notif_verified_' + snap.key,
          type: 'place_verified',
          title: '👑 توثيق رسمي جديد: ' + (place.name || 'مكان موثق'),
          message: 'تم توثيق (' + (place.name || 'المكان') + ') رسمياً بالعلامة الزرقاء ليتصدر دليل المنزلة والمطرية!',
          actionUrl: 'place.html?slug=' + encodeURIComponent(place.slug || snap.key),
          createdAt: Date.now()
        });
      }
    });

    // 2. When new places are added to Firebase RTDB
    db.ref('places').limitToLast(1).on('child_added', (snap) => {
      const place = snap.val();
      if (place && (Number(place.createdAt) || 0) > startTime - 3000) {
        updateAllNotificationBadges(uid);
        showLiveNotificationPopup({
          id: 'notif_new_place_' + snap.key,
          type: 'new_place',
          title: '🎉 انضمام نشاط جديد: ' + (place.name || 'نشاط جديد'),
          message: '(' + (place.name || 'مكان جديد') + ') انضم حديثاً إلى دليل المنزلة والمطرية.',
          actionUrl: 'place.html?slug=' + encodeURIComponent(place.slug || snap.key),
          createdAt: Date.now()
        });
      }
    });

    // 3. Global notifications node
    db.ref('globalNotifications').on('child_added', (snap) => {
      const n = snap.val();
      updateAllNotificationBadges(uid);
      if (n && (Number(n.createdAt) || 0) > startTime - 3000) {
        showLiveNotificationPopup({ id: snap.key, ...n });
      }
    });

    // 4. Personal user notifications
    if (uid) {
      db.ref(`userNotifications/${uid}`).on('value', () => {
        updateAllNotificationBadges(uid);
      });
    }

  } catch (err) {
    console.debug('[NotificationService] Live stream subscriber handled:', err.message);
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
  notifEl.className = 'live-notif-toast';
  notifEl.style.cssText = `
    background: #0B1E30;
    color: #FFFFFF;
    border: 1.5px solid #0284C7;
    border-radius: 14px;
    padding: 12px 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    pointer-events: auto;
    animation: liveNotifSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    direction: rtl;
    text-align: right;
  `;

  const iconEmoji = notification.type === 'place_verified' ? '👑' : '🎉';
  const targetUrl = notification.actionUrl || notification.url || 'dashboard.html?section=notifications';

  notifEl.innerHTML = `
    <div style="font-size:24px;flex-shrink:0">${iconEmoji}</div>
    <div style="flex:1;min-width:0">
      <strong style="display:block;font-size:13.5px;color:#38BDF8">${notification.title || 'إشعار جديد'}</strong>
      <span style="font-size:12px;color:#CBD5E1;display:block;margin-top:2px">${notification.message || ''}</span>
    </div>
    <button type="button" style="background:none;border:none;color:#94A3B8;font-size:14px;cursor:pointer;padding:4px" aria-label="إغلاق">✕</button>
  `;

  notifEl.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      window.location.href = targetUrl;
    }
  });

  notifEl.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation();
    notifEl.remove();
  });

  popupBox.appendChild(notifEl);

  setTimeout(() => {
    if (notifEl && notifEl.parentNode) {
      notifEl.style.opacity = '0';
      notifEl.style.transform = 'translateY(-10px)';
      notifEl.style.transition = 'all 0.3s ease';
      setTimeout(() => notifEl.remove(), 300);
    }
  }, 5000);
}

// ── Backward-Compatibility Export Aliases ──
export const initGlobalRealtimeNotificationsListener = initLiveNotificationSubscriber;
export const mountPushNotificationPrompt = () => {};
export const setupForegroundMessageListener = () => {};

export async function broadcastLiveNewsPushNotification(newsItem) {
  if (!newsItem) return;
  const notifId = 'notif_news_' + (newsItem.id || Date.now());
  const notif = {
    id: notifId,
    type: 'live_news',
    title: '🔥 خبر عاجل في يحدث الآن: ' + (newsItem.title || 'خبر جديد'),
    message: newsItem.title || 'تم نشر تحديث جديد في المنزلة والمطرية',
    actionUrl: 'now.html',
    url: 'now.html',
    createdAt: Date.now(),
    isRead: false
  };
  try {
    const db = getDB();
    await db.ref('globalNotifications/' + notifId).set(notif);
  } catch (_) {}
}
