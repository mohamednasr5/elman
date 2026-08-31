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

  // Check if sound is enabled by user
  const isSoundEnabled = localStorage.getItem('manzala_notif_sound_enabled') !== 'false';
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic bell chord: F6 (1396.91Hz) -> A6 (1760.00Hz) -> C7 (2093.00Hz)
    const frequencies = [1396.91, 1760.00, 2093.00];
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      // Envelope: Fast attack, smooth exponential decay
      gain.gain.setValueAtTime(0.001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.28 / (index + 1), now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.6);
    });

    // Mobile Haptic Vibration
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

// ── Notification Storage & Management ──

/**
 * Get deleted notification IDs for current user
 */
function getDeletedNotifIds(uid = 'anon') {
  try {
    const raw = localStorage.getItem(`deleted_notifs_${uid}`) || '[]';
    return new Set(JSON.parse(raw));
  } catch (_) {
    return new Set();
  }
}

/**
 * Save deleted notification ID
 */
function markNotifAsDeleted(notifId, uid = 'anon') {
  try {
    const set = getDeletedNotifIds(uid);
    set.add(notifId);
    localStorage.setItem(`deleted_notifs_${uid}`, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

/**
 * Delete / Dismiss a single notification permanently
 */
export async function deleteSingleNotification(notifId, uid) {
  if (!notifId) return;

  markNotifAsDeleted(notifId, uid);

  if (uid) {
    try {
      await dbRemove(`userNotifications/${uid}/${notifId}`);
    } catch (_) {}
  }
}

/**
 * Clear / Delete all notifications
 */
export async function clearAllUserNotifications(uid) {
  if (uid) {
    try {
      await dbRemove(`userNotifications/${uid}`);
    } catch (_) {}
  }

  try {
    const globalNotifsMap = (await dbGet('globalNotifications')) || {};
    const allIds = Object.keys(globalNotifsMap);
    const set = getDeletedNotifIds(uid);
    allIds.forEach(id => set.add(id));
    localStorage.setItem(`deleted_notifs_${uid || 'anon'}`, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

/**
 * Mark a single notification as read
 */
export async function markSingleNotificationAsRead(notifId, uid) {
  if (!notifId) return;

  if (uid) {
    try {
      await dbUpdate(`userNotifications/${uid}/${notifId}`, { isRead: true });
    } catch (_) {}
  }

  try {
    const raw = localStorage.getItem(`read_global_notifs_${uid || 'anon'}`) || '[]';
    const set = new Set(JSON.parse(raw));
    set.add(notifId);
    localStorage.setItem(`read_global_notifs_${uid || 'anon'}`, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

/**
 * Get filtered & managed user notifications
 */
export async function fetchManagedUserNotifications(uid) {
  const deletedIds = getDeletedNotifIds(uid || 'anon');
  const mergedMap = {};

  // 1. Local broadcast cache
  try {
    const raw = localStorage.getItem('manzala_global_broadcast_notifs_cache') || '[]';
    const list = JSON.parse(raw);
    list.forEach(n => {
      if (!deletedIds.has(n.id)) {
        mergedMap[n.id] = { ...n, isRead: false };
      }
    });
  } catch (_) {}

  // 2. Global Broadcast Notifications
  try {
    const globalNotifsMap = (await dbGet('globalNotifications')) || {};
    Object.entries(globalNotifsMap).forEach(([id, n]) => {
      if (!deletedIds.has(id)) {
        mergedMap[id] = { id, ...n, isBroadcast: true };
      }
    });
  } catch (_) {}

  // 3. Personal User Notifications
  if (uid) {
    try {
      const userNotifsMap = (await dbGet(`userNotifications/${uid}`)) || {};
      Object.entries(userNotifsMap).forEach(([id, n]) => {
        if (!deletedIds.has(id)) {
          mergedMap[id] = { id, ...n, isBroadcast: !!n.type && n.type !== 'profile_visit' };
        }
      });
    } catch (_) {}
  }

  // Check read status
  let readIds = new Set();
  try {
    const raw = localStorage.getItem(`read_global_notifs_${uid || 'anon'}`) || '[]';
    readIds = new Set(JSON.parse(raw));
  } catch (_) {}

  const all = Object.values(mergedMap).map(n => ({
    ...n,
    isRead: Boolean(n.isRead || readIds.has(n.id))
  }));

  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// ── In-App Live Floating Notification Banner ──

export function showLiveNotificationPopup(notification) {
  if (typeof document === 'undefined') return;

  // Play audio chime
  playNotificationSound();

  // Create popup container if not exists
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

  // Click to view place
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

  // Auto dismiss after 6.5s
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

  try {
    const db = getDB();
    if (!db) return;

    const startTime = Date.now();

    // Listen to new global broadcasts in real-time
    db.ref('globalNotifications')
      .orderByChild('createdAt')
      .startAt(startTime)
      .on('child_added', (snap) => {
        const notif = snap.val();
        if (notif && notif.createdAt >= startTime - 2000) {
          showLiveNotificationPopup({ id: snap.key, ...notif });
        }
      });

    // Listen to personal notifications if user is logged in
    if (currentUser?.uid) {
      db.ref(`userNotifications/${currentUser.uid}`)
        .orderByChild('createdAt')
        .startAt(startTime)
        .on('child_added', (snap) => {
          const notif = snap.val();
          if (notif && notif.createdAt >= startTime - 2000) {
            showLiveNotificationPopup({ id: snap.key, ...notif });
          }
        });
    }
  } catch (err) {
    console.debug('[RealtimeNotifications] Listener setup handled:', err);
  }
}
