/**
 * Universal Realtime Synchronization & Instant Push Engine.
 * Keeps the hot local cache usable while refreshing changed public data in background.
 */
import { playNotificationSound } from './notification.service.js';

let _syncChannel = null;
let _eventSource = null;
let _currentDataVersion = null;
let _isInitialized = false;
let _checkTimer = null;
let _isReconciling = false;

export function initRealtimePwaSyncBus() {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;

  if ('BroadcastChannel' in window && !_syncChannel) {
    try {
      _syncChannel = new BroadcastChannel('manzala_realtime_sync_bus');
      _syncChannel.onmessage = event => {
        const { type, payload } = event.data || {};
        handleIncomingRealtimeEvent(type, payload, false);
      };
    } catch (_) {}
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'DATA_VERSION_CHANGED') {
        handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', event.data.payload || {}, true);
      }
    });
  }

  connectSyncStream();
  const checkVersionNow = () => reconcileVersionDifference();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkVersionNow();
      if (!_eventSource || _eventSource.readyState === EventSource.CLOSED) connectSyncStream();
    }
  });
  window.addEventListener('focus', checkVersionNow);
  window.addEventListener('online', () => { checkVersionNow(); connectSyncStream(); });
  _checkTimer = setInterval(checkVersionNow, 20000);
  checkVersionNow();
  window.addEventListener('beforeunload', () => {
    if (_checkTimer) clearInterval(_checkTimer);
    try { _eventSource?.close(); } catch (_) {}
  }, { once: true });
}

function connectSyncStream() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
  if (_eventSource && _eventSource.readyState !== EventSource.CLOSED) return;
  try {
    _eventSource = new EventSource(`/api/sync/stream?v=${encodeURIComponent(_currentDataVersion || '0')}`);
    _eventSource.addEventListener('connected', e => {
      try {
        const data = JSON.parse(e.data);
        if (data?.version) {
          if (_currentDataVersion && _currentDataVersion !== data.version) handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', data, true);
          _currentDataVersion = data.version;
        }
      } catch (_) {}
    });
    _eventSource.addEventListener('change', e => {
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
      setTimeout(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') connectSyncStream();
      }, 5000);
    };
  } catch (err) { console.warn('[RealtimeSync] Stream connection warning:', err?.message || err); }
}

async function reconcileVersionDifference() {
  if (_isReconciling) return;
  _isReconciling = true;
  try {
    const res = await fetch('/api/sync/version', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const serverVersion = data?.version;
    if (serverVersion && serverVersion !== '0') {
      if (_currentDataVersion && _currentDataVersion !== serverVersion) {
        _currentDataVersion = serverVersion;
        handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', { version: serverVersion }, true);
      } else _currentDataVersion = serverVersion;
    }
  } catch (_) {} finally { _isReconciling = false; }
}

export function broadcastRealtimeChange(type, payload = {}) {
  if (typeof window === 'undefined') return;
  if (_syncChannel) {
    try { _syncChannel.postMessage({ type, payload, timestamp: Date.now() }); } catch (_) {}
  }
  handleIncomingRealtimeEvent(type, payload, false);
}

async function refreshHotPublicCache() {
  try {
    const db = await import('../core/db.js');
    const se = await import('./search-engine.service.js');
    db.clearDbCache('published_');
    db.clearDbCache('offers_');
    db.clearDbCache('ads_');
    const [freshPlaces, freshCats] = await Promise.all([
      db.getPublishedPlaces({ limit: 200, forceFresh: true }).catch(() => []),
      db.getCategories().catch(() => [])
    ]);
    if (freshPlaces?.length) {
      try { localStorage.setItem('manzala_fast_places_cache', JSON.stringify(freshPlaces.slice(0, 150))); } catch (_) {}
      se.warmupSearchEngine(freshPlaces, freshCats || []);
    }
    if (freshCats?.length) {
      try { localStorage.setItem('manzala_fast_cats_cache', JSON.stringify(freshCats)); } catch (_) {}
    }
  } catch (_) {}
}

function handleIncomingRealtimeEvent(type, payload, isRemote = false) {
  if (!type) return;
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'INVALIDATE_API_CACHE', payload: { timestamp: Date.now() } });
  }

  if (type === 'DATA_VERSION_CHANGED' || type === 'NEW_PLACE' || type === 'PLACE_UPDATED') {
    // Never blank the hot cache. Refresh it in the background so the next read is instant.
    refreshHotPublicCache();
  }
  if (type === 'NEW_LIVE_NEWS') {
    try { localStorage.removeItem('manzala_live_news_store_v3'); } catch (_) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manzala:realtime_sync', { detail: { type, payload, isRemote, timestamp: Date.now() } }));
  }

  if (isRemote) {
    if (type === 'NEW_PLACE' && payload?.place) {
      const p = payload.place;
      showPwaNativeSystemNotification('🎉 New business: ' + p.name, p.name + ' has joined the directory.', '/place.html?slug=' + encodeURIComponent(p.slug || p.id));
    } else if (type === 'PLACE_UPDATED' && payload?.place?.isVerified) {
      const p = payload.place;
      showPwaNativeSystemNotification('👑 Profile verified: ' + p.name, p.name + ' is now officially verified.', '/place.html?slug=' + encodeURIComponent(p.slug || p.id));
    } else if (type === 'NEW_LIVE_NEWS' && payload?.news) {
      const n = payload.news;
      showPwaNativeSystemNotification('🔥 Live update: ' + n.title, (n.location || '') + ' — ' + (n.details || 'New live update'), 'now.html');
    }
  }
}

function showPwaNativeSystemNotification(title, body, url) {
  if (typeof window === 'undefined') return;
  playNotificationSound();
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SHOW_PWA_NOTIFICATION', payload: { title, message: body, url: url || './', icon: './icons/icon-192x192.png' } });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: './icons/icon-192x192.png', dir: 'ltr', lang: 'en' }); } catch (_) {}
  }
}
