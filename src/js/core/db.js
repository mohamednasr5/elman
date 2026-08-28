/**
 * المنزلة وناسها — Firebase RTDB Helpers
 * Typed, promise-based wrappers around Firebase Realtime Database
 */

import { getDB } from './firebase.js';

export { getDB };

// ── Ultra-Fast Multi-Tier SWR Cache (0ms Instant Navigation) ──
const _dbMemoryCache = new Map();
const _dbPendingPromises = new Map();

function getCached(key, maxAgeMs = 180000) {
  // 1. In-Memory Cache (0.01ms)
  const mem = _dbMemoryCache.get(key);
  if (mem && (Date.now() - mem.ts < maxAgeMs)) {
    return mem.data;
  }

  // 2. Persistent LocalStorage (0.5ms cold-start)
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('__db_' + key);
      if (stored) {
        const item = JSON.parse(stored);
        if (item && (Date.now() - item.ts < maxAgeMs * 2)) {
          _dbMemoryCache.set(key, item);
          return item.data;
        }
      }
    }
  } catch (_) {}

  return null;
}

function setCache(key, data) {
  const item = { data, ts: Date.now() };
  _dbMemoryCache.set(key, item);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('__db_' + key, JSON.stringify(item));
    }
  } catch (_) {}
  return data;
}

export function clearDbCache(prefix = '') {
  if (!prefix) {
    _dbMemoryCache.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage)
          .filter(k => k.startsWith('__db_'))
          .forEach(k => localStorage.removeItem(k));
      }
    } catch (_) {}
  } else {
    for (const k of _dbMemoryCache.keys()) {
      if (k.startsWith(prefix)) _dbMemoryCache.delete(k);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage)
          .filter(k => k.startsWith('__db_' + prefix))
          .forEach(k => localStorage.removeItem(k));
      }
    } catch (_) {}
  }
}

// ── Generic RTDB helpers ──

export function dbRef(path) {
  return getDB().ref(path);
}

export async function dbGet(path, useCache = true) {
  if (useCache) {
    const cached = getCached('path:' + path);
    if (cached !== null) return cached;
  }
  
  const snap = await getDB().ref(path).once('value');
  const val = snap.exists() ? snap.val() : null;
  if (useCache) setCache('path:' + path, val);
  return val;
}

export async function dbSet(path, data) {
  clearDbCache();
  await getDB().ref(path).set(data);
}

export async function dbUpdate(path, updates) {
  clearDbCache();
  await getDB().ref(path).update(updates);
}

export async function dbPush(path, data) {
  const ref = await getDB().ref(path).push(data);
  return ref.key;
}

export async function dbRemove(path) {
  await getDB().ref(path).remove();
}

export async function dbIncrement(path, delta = 1) {
  await getDB().ref(path).transaction((current) => {
    return (current || 0) + delta;
  });
}

export function dbListen(path, callback) {
  const ref = getDB().ref(path);
  ref.on('value', (snap) => callback(snap.val()));
  return () => ref.off('value');
}

export function dbListenChild(path, addedCb, changedCb, removedCb) {
  const ref = getDB().ref(path);
  if (addedCb)   ref.on('child_added',   (s) => addedCb(s.key, s.val()));
  if (changedCb) ref.on('child_changed', (s) => changedCb(s.key, s.val()));
  if (removedCb) ref.on('child_removed', (s) => removedCb(s.key));

  return () => ref.off();
}

// ── Paginated query ──

/**
 * Get a paginated list from RTDB ordered by a child field
 */
export async function dbQuery({
  path,
  orderBy = 'createdAt',
  limit = 20,
  startAfter = null,
  equalTo = null,
  direction = 'desc'
}) {
  let query = getDB().ref(path).orderByChild(orderBy);

  if (equalTo !== null) {
    query = query.equalTo(equalTo);
  }

  if (startAfter !== null) {
    query = query.startAfter(startAfter);
  }

  if (direction === 'desc') {
    query = query.limitToLast(limit);
  } else {
    query = query.limitToFirst(limit);
  }

  const snap = await query.once('value');
  if (!snap.exists()) return [];

  const items = [];
  snap.forEach((child) => {
    items.push({ _key: child.key, ...child.val() });
  });

  return direction === 'desc' ? items.reverse() : items;
}

// ── Server timestamp ──
export function serverTimestamp() {
  return firebase.database.ServerValue.TIMESTAMP;
}

// ── Specific entity helpers ──

/** Get user profile */
export async function getUserProfile(uid) {
  return dbGet(`users/${uid}`);
}

/** Get place by ID */
export async function getPlace(placeId) {
  return dbGet(`places/${placeId}`);
}

/** Get place by slug */
export async function getPlaceBySlug(slug) {
  const placeId = await dbGet(`slugIndex/${slug}`);
  if (!placeId) return null;
  return getPlace(placeId);
}

/** Get all published places (paginated) */
export async function getPublishedPlaces({ limit = 20, lastKey = null } = {}) {
  const cacheKey = `published_${limit}_${lastKey || ''}`;
  const cached = getCached(cacheKey, 20000);
  if (cached) return cached;

  let query = getDB().ref('places')
    .orderByChild('status')
    .equalTo('published')
    .limitToFirst(limit);

  if (lastKey) {
    query = query.startAfter(null, lastKey);
  }

  const snap = await query.once('value');
  if (!snap.exists()) return [];

  const places = [];
  snap.forEach(child => {
    places.push({ _key: child.key, ...child.val() });
  });

  return setCache(cacheKey, places);
}

/** Get places by category */
export async function getPlacesByCategory(categoryId, limit = 20) {
  const cacheKey = `places_cat_${categoryId}_${limit}`;
  const cached = getCached(cacheKey, 20000);
  if (cached) return cached;

  const snap = await getDB().ref('places')
    .orderByChild('categoryId')
    .equalTo(categoryId)
    .limitToFirst(limit)
    .once('value');

  if (!snap.exists()) return [];

  const places = [];
  snap.forEach(child => {
    places.push({ _key: child.key, ...child.val() });
  });

  const res = places.filter(p => p.status === 'published');
  return setCache(cacheKey, res);
}

/** Get places by owner */
export async function getPlacesByOwner(uid) {
  const cacheKey = `places_owner_${uid}`;
  const cached = getCached(cacheKey, 15000);
  if (cached) return cached;

  const snap = await getDB().ref('places')
    .orderByChild('ownerId')
    .equalTo(uid)
    .once('value');

  if (!snap.exists()) return [];

  const places = [];
  snap.forEach(child => {
    places.push({ _key: child.key, ...child.val() });
  });

  return setCache(cacheKey, places);
}

/** Get all categories (ordered) */
export async function getCategories() {
  const cacheKey = 'categories_all';
  const cached = getCached(cacheKey, 60000);
  if (cached) return cached;

  const snap = await getDB().ref('categories')
    .orderByChild('order')
    .once('value');

  if (!snap.exists()) return [];

  const cats = [];
  snap.forEach(child => {
    const cat = child.val();
    if (cat.isActive !== false) {
      cats.push({ _key: child.key, ...cat });
    }
  });

  return setCache(cacheKey, cats);
}

/** Get active offers (not expired) */
export async function getActiveOffers(limit = 20) {
  const cacheKey = `offers_active_${limit}`;
  const cached = getCached(cacheKey, 20000);
  if (cached) return cached;

  const now = Date.now();
  const snap = await getDB().ref('offers')
    .orderByChild('status')
    .equalTo('active')
    .limitToFirst(limit * 2)
    .once('value');

  if (!snap.exists()) return [];

  const offers = [];
  snap.forEach(child => {
    const offer = { _key: child.key, ...child.val() };
    if (offer.endDate > now) {
      offers.push(offer);
    }
  });

  const res = offers.slice(0, limit);
  return setCache(cacheKey, res);
}

/** Get offers for a place */
export async function getPlaceOffers(placeId) {
  const now = Date.now();
  const snap = await getDB().ref('offers')
    .orderByChild('placeId')
    .equalTo(placeId)
    .once('value');

  if (!snap.exists()) return [];

  const offers = [];
  snap.forEach(child => {
    const offer = { _key: child.key, ...child.val() };
    if (offer.endDate > now) {
      offers.push(offer);
    }
  });

  return offers.sort((a, b) => b.createdAt - a.createdAt);
}

/** Get products for a place */
export async function getPlaceProducts(placeId, { limit = 50, page = 1 } = {}) {
  const snap = await getDB().ref(`products/${placeId}`)
    .limitToFirst(limit)
    .once('value');

  if (!snap.exists()) return [];

  const products = [];
  snap.forEach(child => {
    products.push({ _key: child.key, ...child.val() });
  });

  return products.sort((a, b) => b.createdAt - a.createdAt);
}

/** Get active ads by placement */
export async function getAds(placement = 'homepage') {
  const cacheKey = `ads_${placement}`;
  const cached = getCached(cacheKey, 30000);
  if (cached) return cached;

  const now = Date.now();
  const snap = await getDB().ref('ads').once('value');
  if (!snap.exists()) return [];

  const ads = [];
  snap.forEach(child => {
    const ad = { _key: child.key, ...child.val() };
    if (
      ad.isActive &&
      ad.startDate <= now &&
      ad.endDate >= now &&
      (ad.placement === placement || ad.placement === 'all')
    ) {
      ads.push(ad);
    }
  });

  const res = ads.sort((a, b) => b.priority - a.priority);
  return setCache(cacheKey, res);
}

/** Get site settings */
export async function getSettings() {
  return dbGet('settings', true);
}

/** Increment place view stat and notify place owner about profile visitors */
export async function trackPlaceView(place, visitor = null) {
  if (!place) return;
  const placeId = typeof place === 'string' ? place : (place.id || place._key);
  if (!placeId) return;

  // 1. Increment raw views counter
  await dbIncrement(`places/${placeId}/stats/views`);

  // 2. If place has an owner, log profile visit notification (session debounced)
  const ownerId = typeof place === 'object' ? place.ownerId : null;
  if (ownerId) {
    // Don't notify if the owner is visiting their own page
    if (visitor && visitor.uid === ownerId) return;

    // Check session storage to avoid spamming the same owner multiple times per browser session
    const sessionKey = `visited_place_${placeId}`;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, '1');
    }

    const notification = {
      type: 'profile_view',
      placeId: placeId,
      placeName: place.name || 'المكان',
      visitorUid: visitor?.uid || null,
      visitorName: visitor ? (visitor.displayName || visitor.name || visitor.email || 'مستخدم مسجل') : 'زائر (غير مسجل)',
      visitorPhoto: visitor?.photoURL || '',
      isGuest: !visitor,
      createdAt: Date.now(),
      isRead: false
    };

    try {
      await dbPush(`userNotifications/${ownerId}`, notification);
    } catch (_) {}
  }
}

/** Get notifications for a user */
export async function getUserNotifications(uid) {
  if (!uid) return [];
  const map = await dbGet(`userNotifications/${uid}`) || {};
  return Object.entries(map).map(([id, n]) => ({
    id,
    ...n
  })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Mark all notifications as read */
export async function markAllNotificationsAsRead(uid) {
  if (!uid) return;
  const map = await dbGet(`userNotifications/${uid}`) || {};
  const updates = {};
  Object.keys(map).forEach(key => {
    updates[`userNotifications/${uid}/${key}/isRead`] = true;
  });
  if (Object.keys(updates).length > 0) {
    await dbUpdate('', updates);
  }
}

/** Clear / Delete all notifications */
export async function clearAllNotifications(uid) {
  if (!uid) return;
  await dbRemove(`userNotifications/${uid}`);
}

/** Increment place stat */
export async function trackPlaceStat(placeId, stat) {
  const allowed = ['phoneClicks', 'whatsappClicks', 'directionsClicks', 'productViews', 'offerViews'];
  if (!allowed.includes(stat)) return;
  await dbIncrement(`places/${placeId}/stats/${stat}`);
}
