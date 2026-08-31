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
export async function fetchManagedUserNotifications(uid) {
  const deletedIds = getDeletedNotifIds(uid);
  const readIds = getReadNotifIds(uid);
  const mergedMap = {};

  // 1. Local broadcast cache
  try {
    const raw = localStorage.getItem('manzala_global_broadcast_notifs_cache') || '[]';
    const list = JSON.parse(raw);
    list.forEach(n => {
      const notifId = String(n.id);
      if (!deletedIds.has(notifId)) {
        mergedMap[notifId] = { ...n, id: notifId, isRead: readIds.has(notifId) };
      }
    });
  } catch (_) {}

  // 2. Global Broadcast Notifications from Firebase
  try {
    const globalNotifsMap = (await dbGet('globalNotifications')) || {};
    Object.entries(globalNotifsMap).forEach(([id, n]) => {
      const notifId = String(id);
      if (!deletedIds.has(notifId)) {
        mergedMap[notifId] = { id: notifId, ...n, isBroadcast: true, isRead: readIds.has(notifId) };
      }
    });
  } catch (_) {}

  // 3. Personal User Notifications Inbox
  if (uid) {
    try {
      const userNotifsMap = (await dbGet(`userNotifications/${uid}`)) || {};
      Object.entries(userNotifsMap).forEach(([id, n]) => {
        const notifId = String(id);
        if (!deletedIds.has(notifId)) {
          mergedMap[notifId] = { 
            id: notifId, 
            ...n, 
            isBroadcast: !!n.type && n.type !== 'profile_visit',
            isRead: Boolean(n.isRead || readIds.has(notifId))
          };
        }
      });
    } catch (_) {}
  }

  const all = Object.values(mergedMap).map(n => ({
    ...n,
    isRead: Boolean(n.isRead || readIds.has(String(n.id)))
  }));

  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Update Notification Badges across Header and Sidebar
 */
export async function updateAllNotificationBadges(uid) {
  try {
    const notifs = await fetchManagedUserNotifications(uid);
    const unread = notifs.filter(n => !n.isRead).length;

    // Header Bell Badge
    document.querySelectorAll('#header-notif-badge, .header-notif-badge').forEach(badge => {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-flex' : 'none';
    });

    // Sidebar Badge
    document.querySelectorAll('#sidebar-notifs-badge, .sidebar-notifs-badge').forEach(badge => {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-block' : 'none';
    });
  } catch (_) {}
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
