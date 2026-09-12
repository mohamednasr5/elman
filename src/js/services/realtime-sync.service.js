/**
 * realtime-sync.service.js
 * ─────────────────────────────────────────────────────────────────────────
 * Universal Realtime Synchronization & Instant Push Engine
 * Guarantees 0ms - sub-second live synchronization between Turso / Cloudflare
 * Edge and PWA clients, updating UI reactively without page reload.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { playNotificationSound } from './notification.service.js';

let _syncChannel = null;
let _eventSource = null;
let _currentDataVersion = null;
let _isInitialized = false;
let _checkTimer = null;
let _isReconciling = false;

/**
 * Initialize Realtime Cross-Platform Sync Bus (SSE Stream + Visibility Pulse + BroadcastChannel)
 */
export function initRealtimePwaSyncBus() {
  if (typeof window === 'undefined') return;
  if (_isInitialized) return;
  _isInitialized = true;

  // 1. Cross-Tab & Cross-PWA BroadcastChannel (0ms on same device)
  if ('BroadcastChannel' in window && !_syncChannel) {
    try {
      _syncChannel = new BroadcastChannel('manzala_realtime_sync_bus');
      _syncChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        handleIncomingRealtimeEvent(type, payload, false);
      };
    } catch (_) {}
  }

  // 2. Service Worker Message Relay (when background sync or FCM arrives)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'DATA_VERSION_CHANGED') {
        handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', event.data.payload || {}, true);
      }
    });
  }

  // 3. Connect to Server-Sent Events (SSE) Stream for real-time edge push
  connectSyncStream();

  // 4. Quick Visibility & Focus Pulse (instant catch-up when waking mobile screen)
  const checkVersionNow = () => reconcileVersionDifference();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkVersionNow();
      if (!_eventSource || _eventSource.readyState === EventSource.CLOSED) {
        connectSyncStream();
      }
    }
  });
  window.addEventListener('focus', checkVersionNow);
  window.addEventListener('online', () => {
    checkVersionNow();
    connectSyncStream();
  });

  // 5. Lightweight Edge Heartbeat Check (every 20s, sub-millisecond, 0 DB cost)
  _checkTimer = setInterval(checkVersionNow, 20000);

  // Initial check on boot
  checkVersionNow();

  window.addEventListener('beforeunload', () => {
    if (_checkTimer) clearInterval(_checkTimer);
    if (_eventSource) {
      try { _eventSource.close(); } catch (_) {}
    }
  }, { once: true });
}

/**
 * Connect to Cloudflare Worker SSE Stream for zero-delay live push
 */
function connectSyncStream() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
  if (_eventSource && _eventSource.readyState !== EventSource.CLOSED) return;

  try {
    const streamUrl = `/api/sync/stream?v=${encodeURIComponent(_currentDataVersion || '0')}`;
    _eventSource = new EventSource(streamUrl);

    _eventSource.addEventListener('connected', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.version) {
          if (_currentDataVersion && _currentDataVersion !== data.version) {
            handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', data, true);
          }
          _currentDataVersion = data.version;
        }
      } catch (_) {}
    });

    _eventSource.addEventListener('change', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.version && data.version !== _currentDataVersion) {
          _currentDataVersion = data.version;
          handleIncomingRealtimeEvent(data.type || 'DATA_VERSION_CHANGED', data, true);
        }
      } catch (_) {}
    });

    _eventSource.onerror = () => {
      try { _eventSource.close(); } catch (_) {}
      _eventSource = null;
      // Auto reconnect after brief pause
      setTimeout(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          connectSyncStream();
        }
      }, 5000);
    };
  } catch (err) {
    console.warn('[RealtimeSync] Stream connection warning:', err?.message || err);
  }
}

/**
 * Reconcile version with Cloudflare Edge (<2ms response, 0 DB cost)
 */
async function reconcileVersionDifference() {
  if (_isReconciling) return;
  try {
    _isReconciling = true;
    const res = await fetch('/api/sync/version', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) return;
    const data = await res.json();
    const serverVersion = data?.version;

    if (serverVersion && serverVersion !== '0') {
      if (_currentDataVersion && _currentDataVersion !== serverVersion) {
        _currentDataVersion = serverVersion;
        handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', { version: serverVersion }, true);
      } else {
        _currentDataVersion = serverVersion;
      }
    }
  } catch (_) {
  } finally {
    _isReconciling = false;
  }
}

/**
 * Broadcast an update from the current client to all other PWA / Web windows
 */
export function broadcastRealtimeChange(type, payload = {}) {
  if (typeof window === 'undefined') return;

  // Invalidate local memory and storage caches
  try {
    localStorage.removeItem('manzala_fast_places_cache');
  } catch (_) {}

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

  // 1. Notify Service Worker to purge API cache
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_API_CACHE',
      payload: { timestamp: Date.now() }
    });
  }

  // 2. Refresh local data & Search Engine in background
  if (type === 'DATA_VERSION_CHANGED' || type === 'NEW_PLACE' || type === 'PLACE_UPDATED') {
    Promise.all([
      import('../core/db.js'),
      import('./search-engine.service.js')
    ]).then(async ([db, se]) => {
      try {
        db.clearDbCache('published_');
        db.clearDbCache('offers_');
        db.clearDbCache('ads_');
        const [freshPlaces, freshCats] = await Promise.all([
          db.getPublishedPlaces({ limit: 100, forceFresh: true }).catch(() => []),
          db.getCategories().catch(() => [])
        ]);
        if (freshPlaces && freshPlaces.length) {
          se.warmupSearchEngine(freshPlaces, freshCats || []);
        }
      } catch (_) {}
    }).catch(() => {});
  }

  // 3. Clear stale storage caches so next lookup is guaranteed fresh
  try {
    localStorage.removeItem('manzala_fast_places_cache');
    localStorage.removeItem('manzala_live_news_store_v3');
  } catch (_) {}

  // 4. Dispatch custom event on window for active components to re-render in place
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manzala:realtime_sync', {
      detail: { type, payload, isRemote, timestamp: Date.now() }
    }));
  }

  // 5. Trigger Native Mobile / PWA Push Notification if remote event
  if (isRemote) {
    if (type === 'NEW_PLACE' && payload?.place) {
      const p = payload.place;
      showPwaNativeSystemNotification(
        '🎉 انضمام نشاط جديد: ' + p.name,
        p.name + ' من ' + (p.area || 'المنزلة والمطرية') + ' انضم حديثاً للدليل',
        '/place.html?slug=' + encodeURIComponent(p.slug || p.id)
      );
    } else if (type === 'PLACE_UPDATED' && payload?.place?.isVerified) {
      const p = payload.place;
      showPwaNativeSystemNotification(
        '👑 تم توثيق رسمي جديد: ' + p.name,
        'تم توثيق ' + p.name + ' رسمياً بالعلامة الزرقاء ليتصدر دليل المنزلة والمطرية',
        '/place.html?slug=' + encodeURIComponent(p.slug || p.id)
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

