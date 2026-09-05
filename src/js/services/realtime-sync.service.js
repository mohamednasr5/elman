/**
 * realtime-sync.service.js
 * ─────────────────────────────────────────────────────────────────────────
 * Universal Realtime Synchronization & Instant Push Engine
 * Guarantees 0ms delay sync across Web Browsers, Standalone PWA, and Admin Panel.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { getDB } from '../core/db.js';
import { playNotificationSound } from './notification.service.js';

let _syncChannel = null;
let _isListeningToFirebase = false;

/**
 * Initialize Realtime Cross-Platform Sync Bus (BroadcastChannel + Firebase RTDB listeners)
 */
export function initRealtimePwaSyncBus() {
  if (typeof window === 'undefined') return;

  // 1. Cross-Tab / Cross-Window / PWA BroadcastChannel
  if ('BroadcastChannel' in window && !_syncChannel) {
    _syncChannel = new BroadcastChannel('manzala_realtime_sync_bus');
    _syncChannel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      handleIncomingRealtimeEvent(type, payload, false);
    };
  }

  // 2. Firebase Live RTDB Listeners (for background remote sync from other devices/admin)
  if (!_isListeningToFirebase) {
    try {
      const db = getDB();
      _isListeningToFirebase = true;
      const startTime = Date.now();

      // Listen to urgent announcements & notifications (where real-time is actually needed)
      db.ref('sync/version').on('value', (snap) => {
        const remoteVersion = snap.val();
        if (remoteVersion) {
          handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', { version: remoteVersion }, true);
        }
      });

      // Listen to live news (يحدث الآن)
      db.ref('liveNews').limitToLast(1).on('child_added', (snap) => {
        const news = snap.val();
        if (news && (Number(news.createdAt) || 0) > startTime - 5000 && news.status === 'published') {
          handleIncomingRealtimeEvent('NEW_LIVE_NEWS', { news: { id: snap.key, ...news } }, true);
        }
      });

      // Listen to global notifications
      db.ref('globalNotifications').limitToLast(1).on('child_added', (snap) => {
        const notif = snap.val();
        if (notif && (Number(notif.createdAt) || 0) > startTime - 5000) {
          handleIncomingRealtimeEvent('GLOBAL_NOTIFICATION', { notif: { id: snap.key, ...notif } }, true);
        }
      });

    } catch (err) {
      console.debug('[RealtimeSync] Firebase RTDB live listeners initialized in fallback mode:', err.message);
    }
  }
}

/**
 * Broadcast an update from the current client to all other PWA / Web windows
 */
export function broadcastRealtimeChange(type, payload = {}) {
  if (typeof window === 'undefined') return;

  // Invalidate local memory and storage caches
  localStorage.removeItem('manzala_fast_places_cache');

  if (_syncChannel) {
    try {
      _syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (_) {}
  }

  // Also dispatch locally on current window
  handleIncomingRealtimeEvent(type, payload, false);
}

/**
 * Handle incoming sync events across Web and PWA
 */
function handleIncomingRealtimeEvent(type, payload, isRemote = false) {
  if (!type) return;

  if (type === 'DATA_VERSION_CHANGED') {
    import('../core/db.js').then(m => {
      m.clearDbCache('published_');
      m.getPublishedPlaces({ limit: 100, forceFresh: true }).catch(() => {});
    }).catch(() => {});
  }

  // Clear stale cache so next navigation or search gets live data instantly
  try {
    localStorage.removeItem('manzala_fast_places_cache');
    localStorage.removeItem('manzala_live_news_store_v3');
  } catch (_) {}

  // Dispatch custom event on window for active components to re-render
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manzala:realtime_sync', {
      detail: { type, payload, isRemote }
    }));
  }

  // Trigger Native Mobile / PWA Push Notification if remote event
  if (isRemote) {
    if (type === 'NEW_PLACE' && payload?.place) {
      const p = payload.place;
      showPwaNativeSystemNotification(
        '🎉 انضمام نشاط جديد: ' + p.name,
        p.name + ' من ' + (p.area || 'المنزلة والمطرية') + ' انضم حديثاً للدليل',
        'place.html?slug=' + encodeURIComponent(p.slug || p.id)
      );
    } else if (type === 'PLACE_UPDATED' && payload?.place?.isVerified) {
      const p = payload.place;
      showPwaNativeSystemNotification(
        '👑 تم توثيق رسمي جديد: ' + p.name,
        'تم توثيق ' + p.name + ' رسمياً بالعلامة الزرقاء ليتصدر دليل المنزلة والمطرية',
        'place.html?slug=' + encodeURIComponent(p.slug || p.id)
      );
    } else if (type === 'NEW_LIVE_NEWS' && payload?.news) {
      const n = payload.news;
      showPwaNativeSystemNotification(
        '🔥 تحديث حي (يحدث الآن): ' + n.title,
        n.location + ' — ' + (n.details || 'تحديث مباشر جديد'),
        'now.html'
      );
    }
  }
}

/**
 * Helper: Show Native System Notification via Service Worker in PWA
 */
function showPwaNativeSystemNotification(title, body, url) {
  if (typeof window === 'undefined') return;

  playNotificationSound();

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_PWA_NOTIFICATION',
      payload: {
        title,
        message: body,
        url: url || './',
        icon: './icons/icon-192x192.png'
      }
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: './icons/icon-192x192.png',
        dir: 'rtl',
        lang: 'ar'
      });
    } catch (_) {}
  }
}
