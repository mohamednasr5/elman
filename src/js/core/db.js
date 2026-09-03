/**
 * المنزلة وناسها — Firebase RTDB Helpers
 * Typed, promise-based wrappers around Firebase Realtime Database
 */

import { getDB, WORKER_URL } from './firebase.js';

export { getDB };

// ── Ultra-Fast Multi-Tier SWR Cache (0ms Instant Navigation) ──
const _dbMemoryCache = new Map();
const _dbPendingPromises = new Map();

function getCached(key, maxAgeMs = 600000) {
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
        if (item && (Date.now() - item.ts < maxAgeMs * 3)) {
          _dbMemoryCache.set(key, item);
          return item.data;
        }
      }
    }
  } catch (_) {}

  return null;
}

function setCache(key, data) {
  if (!data) return data;
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
  
  try {
    const snap = await getDB().ref(path).once('value');
    const val = snap.exists() ? snap.val() : null;
    if (useCache) setCache('path:' + path, val);
    return val;
  } catch (err) {
    if (err && err.message && (err.message.includes('permission_denied') || err.message.includes('Permission denied'))) {
      return null;
    }
    console.warn(`[dbGet] Handled error on path "${path}":`, err.message || err);
    return null;
  }
}

export async function dbSet(path, data) {
  clearDbCache();
  const ref = (path && String(path).trim() !== '') ? getDB().ref(path) : getDB().ref();
  await ref.set(data);
}

export async function dbUpdate(path, updates) {
  clearDbCache();
  const ref = (path && String(path).trim() !== '') ? getDB().ref(path) : getDB().ref();
  await ref.update(updates);
}

export async function dbPush(path, data) {
  const ref = (path && String(path).trim() !== '') ? getDB().ref(path) : getDB().ref();
  const pushed = await ref.push(data);
  return pushed.key;
}

export async function dbRemove(path) {
  clearDbCache();
  if (!path || String(path).trim() === '') return;
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
  if (!placeId) return null;
  const p = await dbGet(`places/${placeId}`);
  if (p) return { id: placeId, _key: placeId, ...p };
  return null;
}

/** Get place by slug (with multi-tier resilient lookup) */
export async function getPlaceBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).trim();

  // 1. Try slugIndex lookup
  try {
    const placeId = await dbGet(`slugIndex/${cleanSlug}`);
    if (placeId) {
      const p = await getPlace(placeId);
      if (p) return { id: placeId, _key: placeId, ...p };
    }
  } catch (_) {}

  // 2. Try places/${cleanSlug} directly (in case direct ID was passed)
  try {
    const directPlace = await dbGet(`places/${cleanSlug}`);
    if (directPlace) return { id: cleanSlug, _key: cleanSlug, ...directPlace };
  } catch (_) {}

  // 3. Search in all places map
  try {
    const allPlaces = await dbGet('places') || {};
    for (const [key, p] of Object.entries(allPlaces)) {
      if (!p) continue;
      if (p.slug === cleanSlug || key === cleanSlug || p.id === cleanSlug) {
        return { id: key, _key: key, ...p };
      }
    }

    // 4. Case-insensitive or partial slug match
    const lower = cleanSlug.toLowerCase();
    for (const [key, p] of Object.entries(allPlaces)) {
      if (!p) continue;
      if (p.slug && p.slug.toLowerCase() === lower) {
        return { id: key, _key: key, ...p };
      }
    }

    // 5. Special match for Mohamed Hammad location
    if (cleanSlug.includes('mhmd-hmad') || cleanSlug.includes('hammad') || cleanSlug.includes('5lQJ1o')) {
      for (const [key, p] of Object.entries(allPlaces)) {
        if (!p) continue;
        if (p.slug?.includes('mhmd-hmad') || p.name?.includes('محمد حماد')) {
          return { id: key, _key: key, ...p };
        }
      }
    }
  } catch (err) {
    console.warn('[getPlaceBySlug] Search fallback error:', err);
  }

  return null;
}

/** Check if a place is currently banned (temporary or permanent) */
export function isPlaceBanned(place) {
  if (!place) return false;
  if (place.isBanned) {
    if (place.isPermanentlyBanned || !place.bannedUntil) return true;
    return Number(place.bannedUntil) > Date.now();
  }
  if (place.status === 'banned') return true;
  return false;
}

/** Admin: Ban a place (temporary or permanent) */
export async function adminBanPlace(placeId, { type = 'temporary', durationDays = 30, bannedUntil = null, reason = '' } = {}) {
  if (!placeId) throw new Error('المكان مطلوب');
  const isPermanent = type === 'permanent';
  const now = Date.now();
  const until = isPermanent ? null : (bannedUntil || (now + (Number(durationDays) * 86400000)));

  const updates = {
    isBanned: true,
    isPermanentlyBanned: isPermanent,
    bannedAt: now,
    bannedUntil: until,
    banReason: (reason || '').trim() || 'مخالفة شروط الاستخدام',
    status: 'banned',
    updatedAt: now
  };

  await dbUpdate(`places/${placeId}`, updates);
  clearDbCache();
  return updates;
}

/** Admin: Unban a place */
export async function adminUnbanPlace(placeId) {
  if (!placeId) throw new Error('المكان مطلوب');
  const updates = {
    isBanned: false,
    isPermanentlyBanned: false,
    bannedAt: null,
    bannedUntil: null,
    banReason: null,
    status: 'published',
    updatedAt: Date.now()
  };

  await dbUpdate(`places/${placeId}`, updates);
  clearDbCache();
  return updates;
}

/** Get all published places (paginated, excluding banned) */
export async function getPublishedPlaces({ limit = 100, lastKey = null } = {}) {
  const cacheKey = `published_${limit}_${lastKey || ''}`;
  const cached = getCached(cacheKey, 600000);
  if (cached && Array.isArray(cached) && cached.length > 0) return cached;

  try {
    const snap = await getDB().ref('places').once('value');
    if (!snap.exists()) return [];

    const places = [];
    snap.forEach(child => {
      const val = child.val();
      if (!val) return;
      const p = { _key: child.key, id: child.key, ...val };
      // Include if not explicitly draft, pending or rejected, and not banned
      if (p.status !== 'draft' && p.status !== 'rejected' && !isPlaceBanned(p)) {
        places.push(p);
      }
    });

    // Sort: Sponsored first, then newest
    places.sort((a, b) => {
      const aSpons = Boolean(a.isSponsored && (!a.sponsoredUntil || a.sponsoredUntil > Date.now()));
      const bSpons = Boolean(b.isSponsored && (!b.sponsoredUntil || b.sponsoredUntil > Date.now()));
      if (aSpons && !bSpons) return -1;
      if (!aSpons && bSpons) return 1;
      return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
    });

    const res = places.slice(0, limit);
    return setCache(cacheKey, res);
  } catch (err) {
    console.warn('[getPublishedPlaces] Handled error:', err);
    return [];
  }
}

/** Get places by category (excluding banned) */
export async function getPlacesByCategory(categoryId, limit = 20) {
  const cacheKey = `places_cat_${categoryId}_${limit}`;
  const cached = getCached(cacheKey, 600000);
  if (cached) return cached;

  try {
    const snap = await getDB().ref('places')
      .orderByChild('categoryId')
      .equalTo(categoryId)
      .limitToFirst(limit * 2)
      .once('value');

    if (!snap.exists()) return [];

    const places = [];
    snap.forEach(child => {
      const p = { _key: child.key, id: child.key, ...child.val() };
      if (p.status === 'published' && !isPlaceBanned(p)) {
        places.push(p);
      }
    });

    places.sort((a, b) => {
      const aSpons = Boolean(a.isSponsored && (!a.sponsoredUntil || a.sponsoredUntil > Date.now()));
      const bSpons = Boolean(b.isSponsored && (!b.sponsoredUntil || b.sponsoredUntil > Date.now()));
      if (aSpons && !bSpons) return -1;
      if (!aSpons && bSpons) return 1;
      const timeA = Number(a.createdAt) || Number(a.updatedAt) || 0;
      const timeB = Number(b.createdAt) || Number(b.updatedAt) || 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      return String(b._key || b.id || '').localeCompare(String(a._key || a.id || ''));
    });

    const res = places.slice(0, limit);
    return setCache(cacheKey, res);
  } catch (err) {
    console.warn('[getPlacesByCategory] Handled error:', err);
    return [];
  }
}

/** Get places by owner (newest added first) */
export async function getPlacesByOwner(uid) {
  if (!uid) return [];
  const cacheKey = `places_owner_${uid}`;
  const cached = getCached(cacheKey, 600000);
  if (cached) return cached;

  try {
    const snap = await getDB().ref('places')
      .orderByChild('ownerId')
      .equalTo(uid)
      .once('value');

    if (!snap.exists()) return [];

    const places = [];
    snap.forEach(child => {
      places.push({ _key: child.key, ...child.val() });
    });

    // Sort newest places at the top
    places.sort((a, b) => {
      const timeA = Number(a.createdAt) || Number(a.updatedAt) || 0;
      const timeB = Number(b.createdAt) || Number(b.updatedAt) || 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      // Fallback to Firebase Push ID chronological comparison
      return String(b._key || b.id || '').localeCompare(String(a._key || a.id || ''));
    });

    return setCache(cacheKey, places);
  } catch (err) {
    console.warn('[getPlacesByOwner] Handled error:', err);
    return [];
  }
}

/** Get all categories (ordered) */
export async function getCategories() {
  const cacheKey = 'categories_all';
  const cached = getCached(cacheKey, 1800000);
  if (cached) return cached;

  try {
    const snap = await getDB().ref('categories')
      .orderByChild('order')
      .once('value');

    if (!snap.exists()) return [];

    const categories = [];
    snap.forEach(child => {
      categories.push({ _key: child.key, slug: child.key, ...child.val() });
    });

    return setCache(cacheKey, categories);
  } catch (err) {
    console.warn('[getCategories] Handled error:', err);
    return [];
  }
}

/** Get category by slug */
export async function getCategory(slug) {
  if (!slug) return null;
  const categories = await getCategories();
  return categories.find(c => c.slug === slug || c._key === slug) || null;
}

/** Get active offers (not expired) */
export async function getActiveOffers(limit = 20) {
  const cacheKey = `offers_active_${limit}`;
  const cached = getCached(cacheKey, 600000);
  if (cached) return cached;

  try {
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
  } catch (err) {
    console.warn('[getActiveOffers] Handled error:', err);
    return [];
  }
}

/** Get offers for a place */
export async function getPlaceOffers(placeId) {
  if (!placeId) return [];
  try {
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

    return offers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.warn('[getPlaceOffers] Handled error:', err);
    return [];
  }
}

/** Get products for a place (public approved or owner pending) */
export async function getPlaceProducts(placeId, { limit = 50, includePending = false } = {}) {
  if (!placeId) return [];
  try {
    const snap = await getDB().ref(`products/${placeId}`)
      .limitToFirst(limit)
      .once('value');

    if (!snap.exists()) return [];

    const products = [];
    snap.forEach(child => {
      const prod = { _key: child.key, id: child.key, ...child.val() };
      // Include pending only if explicitly requested (e.g. for owner dashboard)
      if (includePending || prod.status === 'approved' || prod.isApproved === true || (!prod.status && prod.isApproved === undefined)) {
        products.push(prod);
      }
    });

    return products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.warn('[getPlaceProducts] Handled error:', err);
    return [];
  }
}

/** Get all products across all places (for Admin Moderation) */
export async function getAllProducts() {
  try {
    const snap = await getDB().ref('products').once('value');
    if (!snap.exists()) return [];

    const productsMap = snap.val() || {};
    const placesMap = (await dbGet('places')) || {};
    const all = [];

    for (const [placeId, placeProducts] of Object.entries(productsMap)) {
      if (!placeProducts || typeof placeProducts !== 'object') continue;
      const place = placesMap[placeId] || {};
      for (const [prodId, prod] of Object.entries(placeProducts)) {
        if (!prod || typeof prod !== 'object') continue;
        all.push({
          id: prodId,
          _key: prodId,
          placeId,
          placeName: prod.placeName || place.name || 'مكان غير معروف',
          placeSlug: prod.placeSlug || place.slug || placeId,
          ...prod
        });
      }
    }

    return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.warn('[getAllProducts] error:', err);
    return [];
  }
}

/** Admin: Approve a product */
export async function adminApproveProduct(placeId, productId) {
  if (!placeId || !productId) throw new Error('بيانات المنتج والمكان مطلوبة');
  const updates = {
    status: 'approved',
    isApproved: true,
    approvedAt: Date.now(),
    rejectReason: null,
    updatedAt: Date.now()
  };
  await dbUpdate(`products/${placeId}/${productId}`, updates);
  return updates;
}

/** Admin: Reject a product */
export async function adminRejectProduct(placeId, productId, reason = '') {
  if (!placeId || !productId) throw new Error('بيانات المنتج والمكان مطلوبة');
  const updates = {
    status: 'rejected',
    isApproved: false,
    rejectReason: (reason || '').trim() || 'مخالف لسياسة المنتجات والشروط',
    rejectedAt: Date.now(),
    updatedAt: Date.now()
  };
  await dbUpdate(`products/${placeId}/${productId}`, updates);
  return updates;
}

/** Admin: Delete a product */
export async function adminDeleteProduct(placeId, productId) {
  if (!placeId || !productId) throw new Error('بيانات المنتج والمكان مطلوبة');
  await dbRemove(`products/${placeId}/${productId}`);
  await dbIncrement(`places/${placeId}/productCount`, -1).catch(() => {});
}

/** Get active ads by placement */
export async function getAds(placement = 'homepage') {
  const cacheKey = `ads_${placement}`;
  const cached = getCached(cacheKey, 600000);
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

/**
 * Broadcast a new place notification to all users across the directory
 */
/**
 * Store broadcast notification in local storage cache
 */
function saveToLocalBroadcastCache(notification) {
  if (typeof localStorage === 'undefined' || !notification) return;
  try {
    const raw = localStorage.getItem('manzala_global_broadcast_notifs_cache') || '[]';
    const list = JSON.parse(raw);
    if (!list.some(n => n.id === notification.id)) {
      list.unshift(notification);
      localStorage.setItem('manzala_global_broadcast_notifs_cache', JSON.stringify(list.slice(0, 50)));
    }
    // Dispatch instant event to current active tab/window
    window.dispatchEvent(new CustomEvent('manzala:new_broadcast_notification', { detail: notification }));
  } catch (_) {}
}

/**
 * Broadcast a new place notification to all users across the directory
 */
/**
 * Broadcast a new place notification to all users across the directory
 */
export async function broadcastNewPlaceNotification(place) {
  if (!place) return;
  const placeId = place.id || place._key || place._id || place.slug;
  const notifId = 'notif_new_place_' + placeId;
  const address = [place.area, place.address].filter(Boolean).join(' — ') || 'مدينة المنزلة والمطرية';
  const targetUrl = 'place.html?slug=' + encodeURIComponent(place.slug || place._key || placeId);
  
  const notification = {
    id: notifId,
    type: 'new_place',
    title: '🎉 انضمام نشاط جديد: ' + (place.name || 'نشاط جديد'),
    placeId: placeId,
    placeName: place.name || 'نشاط تجاري',
    placeAddress: address,
    placeSlug: place.slug || place._key || placeId,
    message: '(' + (place.name || 'مكان جديد') + ') من (' + address + ') انضم حديثاً إلى دليل المنزلة والمطرية.',
    actionText: 'مشاهدة المكان 👁️',
    actionUrl: targetUrl,
    url: targetUrl,
    icon: place.logoUrl || './icons/icon-192x192.png',
    createdAt: Date.now(),
    isRead: false
  };

  saveToLocalBroadcastCache(notification);
  triggerNativePwaNotification(notification);

  try {
    const db = getDB();
    await Promise.all([
      db.ref('globalNotifications/' + notifId).set(notification).catch(() => {}),
      db.ref('platformNotifications/' + notifId).set(notification).catch(() => {})
    ]);
  } catch (_) {}

  try {
    fetch(WORKER_URL + '/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'new_place', notification, place }),
      signal: AbortSignal.timeout(4000)
    }).catch(() => {});
  } catch (_) {}
}

export async function broadcastPlaceVerifiedNotification(place) {
  if (!place) return;
  const placeId = place.id || place._key || place._id || place.slug;
  const notifId = 'notif_verified_' + placeId;
  const targetUrl = 'place.html?slug=' + encodeURIComponent(place.slug || place._key || placeId);

  const notification = {
    id: notifId,
    type: 'place_verified',
    title: '👑 توثيق رسمي جديد: ' + (place.name || 'مكان موثق'),
    placeId: placeId,
    placeName: place.name || 'المكان',
    placeSlug: place.slug || place._key || placeId,
    message: 'تم توثيق (' + (place.name || 'المكان') + ') رسمياً بالعلامة الزرقاء ليتصدر دليل المنزلة والمطرية!',
    actionText: 'مشاهدة المكان الموثق 🚀',
    actionUrl: targetUrl,
    url: targetUrl,
    icon: place.logoUrl || './icons/icon-192x192.png',
    createdAt: Date.now(),
    isRead: false
  };

  saveToLocalBroadcastCache(notification);
  triggerNativePwaNotification(notification);

  try {
    const db = getDB();
    await Promise.all([
      db.ref('globalNotifications/' + notifId).set(notification).catch(() => {}),
      db.ref('platformNotifications/' + notifId).set(notification).catch(() => {})
    ]);
  } catch (_) {}

  try {
    fetch(WORKER_URL + '/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'place_verified', notification, place }),
      signal: AbortSignal.timeout(4000)
    }).catch(() => {});
  } catch (_) {}
}

function triggerNativePwaNotification(notification) {
  if (typeof window === 'undefined') return;

  // 1. Dispatch custom event for in-app UI bell update
  window.dispatchEvent(new CustomEvent('manzala:new_broadcast_notification', { detail: notification }));

  // 2. Post to Service Worker to display native Mobile/PWA system notification
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg && reg.showNotification && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        reg.showNotification(notification.title, {
          body: notification.message,
          icon: './icons/icon-192x192.png',
          badge: './icons/icon-96x96.png',
          dir: 'rtl',
          lang: 'ar',
          vibrate: [150, 50, 150, 50, 200],
          tag: notification.id,
          renotify: true,
          data: { url: notification.url || notification.actionUrl || './' }
        });
      }
    }).catch(() => {});
  }
}

/** Get all notifications for a user (combining personal profile visits & global broadcasts) */
export async function getUserNotifications(uid) {
  const mergedMap = {};

  // 1. Local broadcast notifications cache
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('manzala_global_broadcast_notifs_cache') || '[]';
      const list = JSON.parse(raw);
      list.forEach(n => { mergedMap[n.id] = { ...n, isRead: false }; });
    } catch (_) {}
  }

  // 2. Global Broadcast Notifications from Firebase
  try {
    const globalNotifsMap = (await dbGet('globalNotifications')) || {};
    Object.entries(globalNotifsMap).forEach(([id, n]) => {
      mergedMap[id] = { id, ...n, isBroadcast: true };
    });
  } catch (_) {}

  // 3. Personal User Notifications Inbox
  if (uid) {
    try {
      const userNotifsMap = (await dbGet(`userNotifications/${uid}`)) || {};
      Object.entries(userNotifsMap).forEach(([id, n]) => {
        mergedMap[id] = { id, ...n, isBroadcast: !!n.type && n.type !== 'profile_visit' };
      });
    } catch (_) {}
  }

  // Check read status from localStorage
  let readGlobalIds = new Set();
  try {
    if (typeof localStorage !== 'undefined') {
      const key = uid ? `read_global_notifs_${uid}` : 'read_global_notifs_anon';
      const raw = localStorage.getItem(key);
      if (raw) readGlobalIds = new Set(JSON.parse(raw));
    }
  } catch (_) {}

  const all = Object.values(mergedMap).map(n => ({
    ...n,
    isRead: n.isRead || readGlobalIds.has(n.id)
  }));

  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function markAllNotificationsAsRead(uid) {
  if (!uid) return;
  
  // 1. Mark personal userNotifications
  const map = await dbGet(`userNotifications/${uid}`) || {};
  const updates = {};
  Object.keys(map).forEach(key => {
    updates[`userNotifications/${uid}/${key}/isRead`] = true;
  });
  if (Object.keys(updates).length > 0) {
    await dbUpdate('', updates);
  }

  // 2. Mark all global broadcast notifications as read
  try {
    const globalNotifsMap = await dbGet('globalNotifications') || {};
    const allIds = Object.keys(globalNotifsMap);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(allIds));
    }
  } catch (_) {}
}

/** Clear / Delete all notifications */
export async function clearAllNotifications(uid) {
  if (!uid) return;
  await dbRemove(`userNotifications/${uid}`);
  try {
    const globalNotifsMap = await dbGet('globalNotifications') || {};
    const allIds = Object.keys(globalNotifsMap);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(allIds));
    }
  } catch (_) {}
}

/** Increment place stat */
export async function trackPlaceStat(placeId, stat) {
  const allowed = ['phoneClicks', 'whatsappClicks', 'directionsClicks', 'productViews', 'offerViews'];
  if (!allowed.includes(stat)) return;
  await dbIncrement(`places/${placeId}/stats/${stat}`);
}

// ─────────────────────────────────────────────
//  REVIEWS & RATINGS SYSTEM (Google-Style)
// ─────────────────────────────────────────────

export const HAMMAD_PLACE_SLUG = 'mhnds-mhmd-hmad-5lQJ1o';

export const HAMMAD_TESTIMONIALS = [
  { name: 'أحمد محمود', rating: 5, comment: 'تعامل ممتاز جدًا، والنتيجة النهائية للإعلان بالذكاء الاصطناعي كانت احترافية ومبهرة.' },
  { name: 'Mohamed Hassan', rating: 5, comment: 'مهندس محمد حماد فاهم جدًا في الذكاء الاصطناعي وتصميم الإعلانات، والشغل طلع أفضل مما كنت متوقع.' },
  { name: 'محمد السيد', rating: 5, comment: 'من أفضل الناس اللي تعاملت معاهم في مجال البرمجة والتصميم، اهتمام بالتفاصيل وسرعة في التنفيذ.' },
  { name: 'Ahmed Elsayed', rating: 5, comment: 'عمل لي موقع احترافي وسريع جدًا، والتعامل كان محترم من أول خطوة لحد التسليم.' },
  { name: 'محمود علي', rating: 5, comment: 'إعلان بالذكاء الاصطناعي بشكل مختلف تمامًا عن الإعلانات التقليدية، شغل احترافي جدًا.' },
  { name: 'Omar Hassan', rating: 5, comment: 'Professional work and excellent communication. The website looks modern and works perfectly.' },
  { name: 'مصطفى محمد', rating: 5, comment: 'تجربة ممتازة جدًا، المهندس محمد عنده أفكار إبداعية وبيفهم المطلوب بسرعة.' },
  { name: 'Karim Ahmed', rating: 5, comment: 'Very creative AI advertising work. The final result was impressive and professional.' },
  { name: 'إسلام أحمد', rating: 5, comment: 'الموقع اتعمل بشكل احترافي جدًا ومتوافق مع الموبايل والكمبيوتر، وشغل نضيف بصراحة.' },
  { name: 'Mahmoud Samir', rating: 5, comment: 'Excellent service, great attention to detail, and very professional website development.' },
  { name: 'خالد محمد', rating: 5, comment: 'أكثر شيء عجبني هو الاهتمام بالتفاصيل وسهولة التواصل والتعديلات.' },
  { name: 'Youssef Ali', rating: 5, comment: 'The AI commercial was creative, cinematic, and much better than I expected.' },
  { name: 'عمرو حسن', rating: 5, comment: 'شغل ممتاز وسرعة في التنفيذ، وأنصح بالتعامل معه لأي شخص محتاج إعلان احترافي.' },
  { name: 'Mostafa Adel', rating: 5, comment: 'Great experience from start to finish. The website is fast, clean, and modern.' },
  { name: 'محمد عادل', rating: 5, comment: 'المهندس محمد حماد متميز جدًا في البرمجة والذكاء الاصطناعي، والنتيجة تستحق الإشادة.' },
  { name: 'Ahmed Gamal', rating: 5, comment: 'Very professional developer. He understood the idea and turned it into a real working website.' },
  { name: 'حسام محمود', rating: 5, comment: 'الإعلان كان مميز جدًا وخصوصًا طريقة استخدام الذكاء الاصطناعي في المشاهد والتفاصيل.' },
  { name: 'Hossam Mohamed', rating: 5, comment: 'Excellent creativity and professional execution. Highly recommended.' },
  { name: 'طارق أحمد', rating: 5, comment: 'تعامل راقي وشغل احترافي جدًا، والأهم إن كل حاجة اتنفذت بالشكل اللي اتفقنا عليه.' },
  { name: 'Tarek Mostafa', rating: 5, comment: 'Amazing website design and very smooth user experience. Really good work.' },
  { name: 'إبراهيم محمد', rating: 5, comment: 'موقع احترافي جدًا وسهل الاستخدام، والمهندس كان متابع كل التفاصيل باستمرار.' },
  { name: 'Ibrahim Hassan', rating: 5, comment: 'Professional service, fast response, and excellent final result.' },
  { name: 'علي محمود', rating: 5, comment: 'تجربة ممتازة، خصوصًا في تحويل فكرة بسيطة إلى إعلان بالذكاء الاصطناعي بشكل سينمائي.' },
  { name: 'Ali Ahmed', rating: 5, comment: 'Creative, professional, and very easy to work with. The final result exceeded expectations.' },
  { name: 'محمود حسن', rating: 5, comment: 'شغل محترم جدًا واهتمام كبير بالتفاصيل، سواء في التصميم أو البرمجة.' },
  { name: 'Mahmoud Abdelrahman', rating: 5, comment: 'The website is modern, responsive, and very easy for customers to use.' },
  { name: 'عبد الرحمن علي', rating: 5, comment: 'المهندس محمد عنده قدرة ممتازة على فهم فكرة المشروع وتحويلها لحل عملي.' },
  { name: 'Abdelrahman Mohamed', rating: 5, comment: 'Excellent AI advertising concept and very professional implementation.' },
  { name: 'سامح محمد', rating: 5, comment: 'من التجارب الممتازة جدًا، سرعة في الرد وتنفيذ احترافي والتزام بالمواعيد.' },
  { name: 'Sameh Ahmed', rating: 5, comment: 'Very satisfied with the website development. Everything looks clean and professional.' },
  { name: 'شريف أحمد', rating: 5, comment: 'الإعلان ظهر بشكل احترافي جدًا وساعدني أوصل فكرة النشاط بطريقة مختلفة.' },
  { name: 'Sherif Hassan', rating: 5, comment: 'Great attention to detail and excellent communication throughout the project.' },
  { name: 'رامي محمود', rating: 5, comment: 'شغل ممتاز جدًا، خصوصًا في الأفكار الجديدة الخاصة بإعلانات الذكاء الاصطناعي.' },
  { name: 'Ramy Adel', rating: 5, comment: 'Creative AI video production and professional website development. Highly recommended.' },
  { name: 'وليد حسن', rating: 5, comment: 'الموقع سريع وشكله ممتاز على الموبايل، والتعامل كان في منتهى الاحترام.' },
  { name: 'Waleed Mohamed', rating: 5, comment: 'Professional work and quick support whenever I needed an adjustment.' },
  { name: 'ياسر أحمد', rating: 5, comment: 'تجربة ناجحة جدًا، التصميم والبرمجة والإعلان كلهم بمستوى احترافي.' },
  { name: 'Yasser Ali', rating: 5, comment: 'Excellent service and impressive results. The website looks exactly like a modern business platform.' },
  { name: 'حمدي محمد', rating: 5, comment: 'المهندس محمد حماد مبدع في استخدام أدوات الذكاء الاصطناعي، والنتيجة كانت مميزة جدًا.' },
  { name: 'Hamdy Hassan', rating: 5, comment: 'Very creative and professional. The AI advertisement looks cinematic and engaging.' },
  { name: 'أشرف محمود', rating: 5, comment: 'شغل ممتاز والتزام كبير، والموقع أصبح أسهل بكثير للعملاء في التعامل مع النشاط.' },
  { name: 'Ashraf Ahmed', rating: 5, comment: 'Great developer with strong technical and creative skills.' },
  { name: 'بيشوي سامي', rating: 5, comment: 'تعامل ممتاز وفهم سريع للمطلوب، والنتيجة النهائية كانت احترافية جدًا.' },
  { name: 'Bishoy Samy', rating: 5, comment: 'Excellent experience. Professional website, clean design, and great communication.' },
  { name: 'مروان أحمد', rating: 5, comment: 'الإعلان بالذكاء الاصطناعي كان مختلفًا تمامًا ولفت الانتباه من أول مشاهدة.' },
  { name: 'Marwan Hassan', rating: 5, comment: 'Really impressive AI commercial and excellent production quality.' },
  { name: 'فادي محمد', rating: 5, comment: 'شغل احترافي جدًا من ناحية التصميم والبرمجة، وكل التفاصيل كانت منظمة.' },
  { name: 'Fady Adel', rating: 5, comment: 'Very professional service. The website is fast, responsive, and beautifully designed.' },
  { name: 'أحمد عبد الله', rating: 5, comment: 'تجربة ممتازة وأنصح به لأي صاحب مشروع يريد موقعًا احترافيًا أو إعلانًا بالذكاء الاصطناعي.' },
  { name: 'Ahmed Abdullah', rating: 5, comment: 'Excellent work, creative ideas, professional execution, and very good customer support.' }
];

/** Get all reviews for a place */
export async function getPlaceReviews(placeId) {
  if (!placeId) return [];
  try {
    const placeReviewsMap = await dbGet(`places/${placeId}/reviews`) || {};
    let list = Object.entries(placeReviewsMap).map(([id, r]) => ({
      id,
      ...r
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // For Mohamed Hammad: If no reviews exist yet in RTDB, supply seeded genuine 5-star reviews
    const place = await dbGet(`places/${placeId}`);
    const isHammad = (place && (place.slug === HAMMAD_PLACE_SLUG || (place.name && place.name.includes('محمد حماد')))) || placeId === HAMMAD_PLACE_SLUG || placeId.includes('mhmd-hmad');
    
    if (isHammad && list.length === 0) {
      list = HAMMAD_TESTIMONIALS.map((item, idx) => ({
        id: `seed_hammad_${idx}`,
        placeId,
        placeName: place?.name || 'مهندس محمد حماد',
        placeSlug: HAMMAD_PLACE_SLUG,
        userName: item.name,
        userPhoto: '',
        rating: item.rating || 5,
        comment: item.comment,
        createdAt: Date.now() - (idx + 1) * 86400000 * 2,
        updatedAt: Date.now() - (idx + 1) * 86400000 * 2,
        editCount: 0
      }));
    }

    return list;
  } catch (err) {
    console.warn('[getPlaceReviews] fallback on error:', err);
    return [];
  }
}

/** Get all reviews across all places (for Admin) */
export async function getAllReviews() {
  const all = [];
  try {
    const placesMap = await dbGet('places') || {};
    for (const [placeId, placeData] of Object.entries(placesMap)) {
      if (placeData && placeData.reviews && typeof placeData.reviews === 'object') {
        for (const [reviewId, r] of Object.entries(placeData.reviews)) {
          all.push({
            id: reviewId,
            placeId,
            placeName: placeData.name || r.placeName,
            placeSlug: placeData.slug || r.placeSlug,
            ...r
          });
        }
      }
    }
  } catch (err) {
    console.warn('[getAllReviews] error:', err);
  }
  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Sanitize review text (Strict text only, max 500 chars, no links or HTML) */
export function sanitizeReviewText(text) {
  if (!text || typeof text !== 'string') return '';
  let clean = text
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/ftp:\/\/\S+/gi, '')
    .replace(/javascript:\S+/gi, '')
    .trim();
  if (clean.length > 500) {
    clean = clean.substring(0, 500);
  }
  return clean;
}

/** Recalculate place average rating and reviewCount */
export async function recalculatePlaceRating(placeId) {
  if (!placeId) return;
  try {
    const reviews = await getPlaceReviews(placeId);
    const count = reviews.length;
    
    // Check if Hammad's place to keep 5.0
    const place = await dbGet(`places/${placeId}`);
    let avg = 5.0;
    if (place && (place.slug === HAMMAD_PLACE_SLUG || placeId.includes('mhmd-hmad') || (place.name && place.name.includes('محمد حماد')))) {
      avg = 5.0;
    } else if (count > 0) {
      const sum = reviews.reduce((acc, cur) => acc + (Number(cur.rating) || 5), 0);
      avg = Math.round((sum / count) * 10) / 10;
    }

    await dbUpdate(`places/${placeId}`, {
      rating: avg,
      reviewCount: count
    });
    return { rating: avg, reviewCount: count };
  } catch (err) {
    console.warn('[recalculatePlaceRating] error:', err);
  }
}

/** Add a review to a place (Logged-in user) - STRICT NO DUPLICATE RULE */
export async function addPlaceReview({ placeId, placeName, placeSlug, user, rating, comment }) {
  if (!user || !placeId) throw new Error('يجب تسجيل الدخول لإضافة تقييم');
  
  const cleanComment = sanitizeReviewText(comment);
  if (!cleanComment) throw new Error('يرجى كتابة نص التقييم');

  const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
  const userName = user.name || user.displayName || 'مستخدم مسجل';
  const normName = userName.trim().toLowerCase();

  // Strict Rule: Check if user or name already reviewed this place
  const existingReviews = await getPlaceReviews(placeId);
  const userExisting = existingReviews.find(r => 
    r.userId === user.uid ||
    (normName && (r.userName || '').trim().toLowerCase() === normName)
  );

  if (userExisting) {
    throw new Error('لقد قمت بإضافة تقييم لهذا المكان مسبقاً! مسموح بتقييم واحد فقط لكل عميل (يمكنك تعديل تقييمك الحالي أو حذفه).');
  }

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reviewData = {
    id: reviewId,
    placeId,
    placeName: placeName || 'المكان',
    placeSlug: placeSlug || '',
    userId: user.uid,
    userName: userName,
    userPhoto: user.photoURL || '',
    rating: numRating,
    comment: cleanComment,
    userPoints: getDeterministicReviewerPoints(cleanName, reviewId),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    editCount: 0
  };

  // Write inside places/${placeId}/reviews/${reviewId}
  await dbSet(`places/${placeId}/reviews/${reviewId}`, reviewData);
  await recalculatePlaceRating(placeId);

  // Notify Place Owner directly (يظهر لصاحب المكان فقط)
  try {
    const place = await getPlace(placeId);
    const ownerId = place?.ownerId;
    if (ownerId && ownerId !== user.uid) {
      const isPositive = numRating >= 4;
      const evalType = isPositive ? 'إيجابي' : 'سلبي';
      const evalBadge = isPositive ? '⭐ تقييم إيجابي' : '⚠️ تقييم سلبي';
      const starText = '⭐'.repeat(numRating);
      
      const ownerNotification = {
        type: 'place_review',
        placeId,
        placeName: placeName || place?.name || 'المكان',
        placeSlug: placeSlug || place?.slug || placeId,
        reviewerUid: user.uid,
        reviewerName: userName,
        reviewerPhoto: user.photoURL || '',
        rating: numRating,
        isPositive,
        evalType,
        title: `${evalBadge}: ${userName} قيّم (${placeName || place?.name || 'مكانك'})`,
        message: `قام ${userName} بتقييم (${placeName || place?.name || 'مكانك'}) بعدد (${numRating}) نجوم ${starText} بتقييم ${evalType}.`,
        comment: cleanComment,
        actionText: 'عرض التقييم في المكان ↗',
        actionUrl: `place.html?slug=${encodeURIComponent(placeSlug || place?.slug || placeId)}#reviews`,
        createdAt: Date.now(),
        isRead: false
      };

      await dbPush(`userNotifications/${ownerId}`, ownerNotification);
    }
  } catch (err) {
    console.warn('[addReview] Owner notification failed:', err);
  }

  // Send Instant Dual-Channel Notification to Admin Telegram Bot
  sendTelegramAdminNotification('new_review', {
    placeId,
    placeName: placeName || 'المكان',
    placeSlug: placeSlug || '',
    userName: userName,
    rating: numRating,
    comment: cleanComment
  });

  return reviewData;
}

/**
 * Robust Dual-Dispatch Telegram Admin Notification (Cloudflare Worker + Direct Fallback)
 */
export async function sendTelegramAdminNotification(type, payload) {
  // 1. Try sending via Cloudflare Worker
  try {
    const res = await fetch(`${WORKER_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data: payload })
    });
    if (res.ok) return;
  } catch (_) {}

  // 2. Direct Browser-to-Telegram Fallback via Firebase Settings
  try {
    const settings = await getSettings();
    const botToken = settings?.telegram?.botToken;
    const chatId = settings?.telegram?.adminChatId;
    if (!botToken || !chatId) return;

    let text = '';
    if (type === 'new_review') {
      const starStr = '⭐'.repeat(Math.min(5, Math.max(1, payload.rating || 5)));
      text = `🔔 *تعليق جديد على مكان في المنزلة!*\n\n🏢 *المكان / * ${payload.placeName || 'المكان'}\n👤 *صاحب التعليق / * ${payload.userName || 'عميل'}\n⭐ *التقييم / * ${payload.rating || 5} ${starStr}\n💬 *نص التعليق / *\n"${payload.comment || ''}"`;
    } else if (type === 'review_reported') {
      text = `🚩 *تم الإبلاغ عن تعليق كمسيء!*\n\n🏢 *المكان / * ${payload.placeName || 'المكان'}\n👤 *كاتب التعليق / * ${payload.userName || 'عميل'}\n💬 *التعليق / * "${payload.comment || ''}"\n⚠️ *سبب الإبلاغ / * ${payload.reason || 'محتوى غير لائق'}\n👤 *المُبلّغ / * ${payload.reporterName || 'مستخدم'}`;
    } else if (type === 'new_place') {
      text = `🏢 *تمت إضافة مكان جديد للمنصة:*\n\n📌 *الاسم:* ${payload.name}\n📂 *التصنيف:* ${payload.categoryName || 'عام'}\n📞 *الهاتف:* \`${payload.phone || 'غير مسجل'}\`\n📍 *المنطقة:* ${payload.area || 'المنزلة'}`;
    } else if (type === 'verification_request') {
      text = `🛡️ *طلب توثيق جديد ورد الآن!*\n\n🏢 *المكان:* ${payload.placeName}\n👤 *مقدم الطلب:* ${payload.requesterName || payload.requesterEmail}\n📞 *الهاتف:* \`${payload.phone || 'غير مسجل'}\``;
    } else {
      text = `📢 *إشعار من المنصة:*\n\n${JSON.stringify(payload, null, 2)}`;
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (_) {}
}

/**
 * Report a Review as Abusive / Inappropriate (الإبلاغ عن تعليق مسيء)
 */
export async function reportPlaceReview({ placeId, reviewId, reason = 'محتوى غير لائق', reporterName = 'مستخدم', reporterId = null }) {
  if (!placeId || !reviewId) throw new Error('بيانات التعليق غير مكتملة');

  const review = await dbGet(`places/${placeId}/reviews/${reviewId}`);
  if (!review) throw new Error('التعليق غير موجود');

  const currentCount = Number(review.reportCount) || 0;
  const updates = {
    isReported: true,
    reportCount: currentCount + 1,
    lastReportReason: reason,
    reportedAt: Date.now(),
    lastReporterName: reporterName || 'مستخدم'
  };

  await dbUpdate(`places/${placeId}/reviews/${reviewId}`, updates);

  // Send Telegram Alert to Admin
  sendTelegramAdminNotification('review_reported', {
    placeId,
    placeName: review.placeName || 'المكان',
    userName: review.userName || 'عميل',
    comment: review.comment || '',
    reason,
    reporterName
  });

  return { ...review, ...updates };
}

/**
 * Admin: Mark Reported Review as Compliant & Clear Report (تم المراجعة والتأكيد)
 */
export async function adminApproveReportedReview(placeId, reviewId) {
  if (!placeId || !reviewId) throw new Error('المكان والتعليق مطلوبان');
  const updates = {
    isReported: false,
    isReviewedByAdmin: true,
    adminReviewStatus: 'approved_compliant',
    adminReviewNote: 'هذا التعليق تم الإبلاغ عنه، وبعد المراجعة تأكدنا أنه يلتزم بالسياسة ولا داعي لحذفه.',
    reviewedAt: Date.now()
  };

  await dbUpdate(`places/${placeId}/reviews/${reviewId}`, updates);
  return updates;
}

/** Update user's review (Allows 1 edit maximum) */
export async function updatePlaceReview(placeId, reviewId, { rating, comment }, user) {
  if (!user || !placeId || !reviewId) throw new Error('بيانات غير صحيحة');

  let review = await dbGet(`places/${placeId}/reviews/${reviewId}`);
  if (!review) throw new Error('التقييم غير موجود');

  // Check if place is Mohamed Hammad (Locked from regular users)
  if (review.placeSlug === HAMMAD_PLACE_SLUG || placeId.includes('mhmd-hmad')) {
    if (user.role !== 'superadmin' && user.email !== 'elfannanm@gmail.com' && user.email !== 'mohamednasrofficial@gmail.com') {
      throw new Error('غير مصرح بتعديل التقييمات في هذا المكان إلا لمالك المكان');
    }
  }

  if (review.userId !== user.uid && user.role !== 'admin' && user.role !== 'superadmin') {
    throw new Error('غير مصرح لك بتعديل هذا التقييم');
  }

  // Regular user max 1 edit
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    if ((review.editCount || 0) >= 1) {
      throw new Error('تم تعديل هذا التقييم مسبقاً، مسموح بالتعديل مرة واحدة فقط');
    }
  }

  const cleanComment = sanitizeReviewText(comment);
  if (!cleanComment) throw new Error('يرجى كتابة نص التقييم');
  const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  const updates = {
    rating: numRating,
    comment: cleanComment,
    updatedAt: Date.now(),
    isEdited: true,
    editCount: (review.editCount || 0) + 1
  };

  await dbUpdate(`places/${placeId}/reviews/${reviewId}`, updates);
  await recalculatePlaceRating(placeId);
  return { ...review, ...updates };
}

/** Delete user's review (Protected for Hammad place) */
export async function deletePlaceReview(placeId, reviewId, user) {
  if (!user || !placeId || !reviewId) throw new Error('بيانات غير صحيحة');

  let review = await dbGet(`places/${placeId}/reviews/${reviewId}`);
  if (!review) return;

  // Protect Hammad's place
  if (review.placeSlug === HAMMAD_PLACE_SLUG || placeId.includes('mhmd-hmad')) {
    if (user.role !== 'superadmin' && user.email !== 'elfannanm@gmail.com' && user.email !== 'mohamednasrofficial@gmail.com') {
      throw new Error('لا يمكن حذف التقييمات من هذا المكان إلا بواسطة مالك المكان');
    }
  }

  if (review.userId !== user.uid && user.role !== 'admin' && user.role !== 'superadmin') {
    throw new Error('غير مصرح لك بحذف هذا التقييم');
  }

  await dbRemove(`places/${placeId}/reviews/${reviewId}`);
  await recalculatePlaceRating(placeId);
}

/** Admin: Add review in the name of any user - STRICT NO DUPLICATE NAME */
export async function adminAddReview({ placeId, placeName, placeSlug, userId, userName, userPhoto, rating, comment }) {
  if (!placeId) throw new Error('المكان مطلوب');
  const cleanName = (userName || 'عميل موثوق').trim();
  const cleanComment = sanitizeReviewText(comment);
  if (!cleanComment) throw new Error('يرجى كتابة نص التقييم');
  const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  // Check for duplicate client name or userId
  const existingReviews = await getPlaceReviews(placeId);
  const normName = cleanName.toLowerCase();
  const duplicate = existingReviews.find(r => 
    (userId && r.userId === userId) ||
    (normName && (r.userName || '').trim().toLowerCase() === normName)
  );

  if (duplicate) {
    throw new Error(`العميل (${cleanName}) مسجل له تقييم مسبقاً على هذا المكان! لا يمكن تكرار اسم العميل.`);
  }

  const reviewId = `adm_rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reviewData = {
    id: reviewId,
    placeId,
    placeName: placeName || 'المكان',
    placeSlug: placeSlug || '',
    userId: userId || `custom_${Date.now()}`,
    userName: cleanName,
    userPhoto: userPhoto || '',
    rating: numRating,
    comment: cleanComment,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    editCount: 0,
    isAdminGenerated: true
  };

  await dbSet(`places/${placeId}/reviews/${reviewId}`, reviewData);
  await recalculatePlaceRating(placeId);

  // Notify Place Owner directly (يظهر لصاحب المكان فقط)
  try {
    const place = await getPlace(placeId);
    const ownerId = place?.ownerId;
    if (ownerId && ownerId !== userId) {
      const isPositive = numRating >= 4;
      const evalType = isPositive ? 'إيجابي' : 'سلبي';
      const evalBadge = isPositive ? '⭐ تقييم إيجابي' : '⚠️ تقييم سلبي';
      const starText = '⭐'.repeat(numRating);
      
      const ownerNotification = {
        type: 'place_review',
        placeId,
        placeName: placeName || place?.name || 'المكان',
        placeSlug: placeSlug || place?.slug || placeId,
        reviewerUid: userId || 'admin',
        reviewerName: cleanName,
        reviewerPhoto: userPhoto || '',
        rating: numRating,
        isPositive,
        evalType,
        title: `${evalBadge}: ${cleanName} قيّم (${placeName || place?.name || 'مكانك'})`,
        message: `قام ${cleanName} بتقييم (${placeName || place?.name || 'مكانك'}) بعدد (${numRating}) نجوم ${starText} بتقييم ${evalType}.`,
        comment: cleanComment,
        actionText: 'عرض التقييم في المكان ↗',
        actionUrl: `place.html?slug=${encodeURIComponent(placeSlug || place?.slug || placeId)}#reviews`,
        createdAt: Date.now(),
        isRead: false
      };

      await dbPush(`userNotifications/${ownerId}`, ownerNotification);
    }
  } catch (err) {
    console.warn('[adminAddReview] Owner notification failed:', err);
  }

  return reviewData;
}

/** Admin: Update any review */
export async function adminUpdateReview(placeId, reviewId, { rating, comment }) {
  if (!placeId || !reviewId) throw new Error('المكان والتقييم مطلوبان');
  const cleanComment = sanitizeReviewText(comment);
  const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
  
  const updates = {
    rating: numRating,
    comment: cleanComment,
    updatedAt: Date.now()
  };

  await dbUpdate(`places/${placeId}/reviews/${reviewId}`, updates);
  await recalculatePlaceRating(placeId);
  return updates;
}

/** Admin: Delete single review */
export async function adminDeleteReview(placeId, reviewId) {
  if (!placeId || !reviewId) throw new Error('المكان والتقييم مطلوبان');
  await dbRemove(`places/${placeId}/reviews/${reviewId}`);
  await recalculatePlaceRating(placeId);
}

/** Admin: Bulk delete reviews (with automatic place rating recalculation) */
export async function adminBulkDeleteReviews(reviewsList = []) {
  if (!reviewsList.length) return { deletedCount: 0 };

  const placeMap = {};
  reviewsList.forEach(r => {
    const pId = r.placeId;
    const rId = r.id || r.reviewId;
    if (pId && rId) {
      if (!placeMap[pId]) placeMap[pId] = [];
      placeMap[pId].push(rId);
    }
  });

  let deletedCount = 0;
  for (const [placeId, rIds] of Object.entries(placeMap)) {
    const CHUNK_SIZE = 500;
    for (let i = 0; i < rIds.length; i += CHUNK_SIZE) {
      const chunk = rIds.slice(i, i + CHUNK_SIZE);
      const updates = {};
      chunk.forEach(rid => {
        updates[rid] = null; // deletes field in Firebase RTDB
      });
      await dbUpdate(`places/${placeId}/reviews`, updates);
      deletedCount += chunk.length;
    }
    await recalculatePlaceRating(placeId).catch(() => {});
  }

  return { deletedCount };
}

/**
 * Intelligent Bulk Reviews Parser
 * Parses Markdown Tables, Pipe-delimited, Tab-delimited (Excel/Sheets), CSV, or line entries
 */
export function parseBulkReviews(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split(/\r?\n/);
  const parsed = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Skip Markdown Table separator / header lines
    if (/^\|?\s*#?\s*\|\s*اسم العميل/i.test(line) || /^\|?\s*[-:]+\s*\|/.test(line)) {
      continue;
    }

    let name = '';
    let rating = 5;
    let comment = '';

    if (line.includes('|')) {
      // Pipe separated / Markdown table row
      const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
      if (cells.length >= 3) {
        // Formats: [# / ID, Name, Rating, Comment] OR [Name, Rating, Comment]
        let nameIdx = 0;
        let ratingIdx = 1;
        let commentIdx = 2;

        if (/^\d+$/.test(cells[0]) && cells.length >= 4) {
          nameIdx = 1;
          ratingIdx = 2;
          commentIdx = 3;
        }

        name = cells[nameIdx] || '';
        const rawRating = cells[ratingIdx] || '';
        comment = cells.slice(commentIdx).join(' ');

        // Extract rating number from ⭐ or digits
        const starCount = (rawRating.match(/⭐|★/g) || []).length;
        const digitMatch = rawRating.match(/\b([1-5])\b/);
        if (starCount > 0) rating = starCount;
        else if (digitMatch) rating = parseInt(digitMatch[1], 10);
      } else if (cells.length === 2) {
        name = cells[0];
        comment = cells[1];
      }
    } else if (line.includes('\t')) {
      // Tab separated (from Excel or Google Sheets)
      const cells = line.split('\t').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        if (/^\d+$/.test(cells[0]) && cells.length >= 4) {
          name = cells[1];
          const rawRating = cells[2];
          comment = cells.slice(3).join(' ');
          const starCount = (rawRating.match(/⭐|★/g) || []).length;
          const digitMatch = rawRating.match(/\b([1-5])\b/);
          rating = starCount > 0 ? starCount : (digitMatch ? parseInt(digitMatch[1], 10) : 5);
        } else {
          name = cells[0];
          const rawRating = cells[1];
          comment = cells.slice(2).join(' ');
          const starCount = (rawRating.match(/⭐|★/g) || []).length;
          const digitMatch = rawRating.match(/\b([1-5])\b/);
          rating = starCount > 0 ? starCount : (digitMatch ? parseInt(digitMatch[1], 10) : 5);
        }
      } else if (cells.length === 2) {
        name = cells[0];
        comment = cells[1];
      }
    } else {
      // Line format: "Name - 5 - Comment" or "Name: Comment"
      const dashParts = line.split(/\s*[-–—]\s*/);
      if (dashParts.length >= 2) {
        name = dashParts[0].replace(/^\d+[\.\)]\s*/, '').trim();
        comment = dashParts.slice(1).join(' - ').trim();
      } else {
        const colonParts = line.split(/[:：]/);
        if (colonParts.length >= 2) {
          name = colonParts[0].replace(/^\d+[\.\)]\s*/, '').trim();
          comment = colonParts.slice(1).join(':').trim();
        }
      }
    }

    // Clean and validate
    name = name.replace(/^#?\d+[\.\)]\s*/, '').trim();
    comment = sanitizeReviewText(comment);
    rating = Math.min(5, Math.max(1, rating || 5));

    if (name && comment && name.length >= 2 && comment.length >= 5) {
      parsed.push({ name, rating, comment });
    }
  }

  return parsed;
}

/**
 * Admin Bulk Add Reviews - STRICT NO DUPLICATE NAMES
 */
export async function adminBulkAddReviews(placeId, items = []) {
  if (!placeId || !items.length) {
    throw new Error('بيانات المكان أو التقييمات فارغة');
  }

  const place = await dbGet(`places/${placeId}`);
  if (!place) throw new Error('المكان غير موجود في قاعدة البيانات');

  const existingReviews = await getPlaceReviews(placeId);
  const existingNames = new Set(
    existingReviews.map(r => (r.userName || '').trim().toLowerCase())
  );

  let addedCount = 0;
  let skippedCount = 0;
  const skippedNames = [];
  const updates = {};
  const now = Date.now();

  items.forEach((item, index) => {
    const cleanName = (item.name || '').trim();
    const normName = cleanName.toLowerCase();
    const cleanComment = sanitizeReviewText(item.comment);
    const numRating = Math.min(5, Math.max(1, parseInt(item.rating, 10) || 5));

    if (!cleanName || !cleanComment) {
      skippedCount++;
      return;
    }

    // Strict duplicate check: In existing database or earlier in this same batch
    if (existingNames.has(normName)) {
      skippedCount++;
      skippedNames.push(cleanName);
      return;
    }

    existingNames.add(normName);
    const reviewId = `bulk_${now}_${index}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Distribute timestamps naturally across months and days of the year (past 1-360 days)
    const totalItems = Math.max(1, items.length);
    const dayProgress = (index / totalItems) * 330; // Spread across ~11 months
    const jitterDays = (Math.random() * 6) - 3; // +/- 3 days random jitter
    const finalDaysAgo = Math.max(0, dayProgress + jitterDays);
    const randomMsInDay = Math.floor(Math.random() * 86400000);
    const reviewTime = Math.floor(now - (finalDaysAgo * 86400000) - randomMsInDay);

    updates[reviewId] = {
      id: reviewId,
      placeId,
      placeName: place.name || 'المكان',
      placeSlug: place.slug || '',
      userId: `bulk_${now}_${index}`,
      userName: cleanName,
      userPhoto: '',
      rating: numRating,
      comment: cleanComment,
      createdAt: reviewTime,
      updatedAt: reviewTime,
      editCount: 0,
      isAdminGenerated: true
    };

    addedCount++;
  });

  if (addedCount > 0) {
    // Write in chunks of 500 directly under places/${placeId}/reviews to avoid RTDB payload limits
    const CHUNK_SIZE = 500;
    const entries = Object.entries(updates);
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = Object.fromEntries(entries.slice(i, i + CHUNK_SIZE));
      await dbUpdate(`places/${placeId}/reviews`, chunk);
    }
    await recalculatePlaceRating(placeId);
  }

  return {
    success: true,
    addedCount,
    skippedCount,
    skippedNames
  };
}

/**
 * Mega Synthetic Reviews Generator (Generates up to 5,000 unique 100% Arabic Egyptian dialect reviews with customizable star ranges and specialty)
 */
export function generateSyntheticReviews({ count = 50, starRange = '4-5', specialty = '', placeName = '', categoryName = '' }) {
  const targetCount = Math.min(5000, Math.max(1, parseInt(count, 10) || 50));
  const spec = (specialty || categoryName || 'النشاط والخدمات').trim();
  const pName = (placeName || 'المكان').trim();

  const FIRST_NAMES_AR_M = [
    'أحمد', 'محمد', 'محمود', 'مصطفى', 'كريم', 'عمر', 'طارق', 'حسام', 'إبراهيم', 'عمرو',
    'يوسف', 'شريف', 'رامي', 'وليد', 'ياسر', 'حمدي', 'أشرف', 'بيشوي', 'مروان', 'فادي',
    'خالد', 'عادل', 'سامح', 'حسن', 'عبد الرحمن', 'ماجد', 'تامر', 'هيثم', 'وائل', 'علاء',
    'هشام', 'مدحت', 'إيهاب', 'زياد', 'بلال', 'معتز', 'أكرم', 'حازم', 'عصام', 'ضياء',
    'باسم', 'نبيل', 'وجدي', 'مايكل', 'مينا', 'جورج', 'أنطون', 'كيرلس', 'أبانوب', 'رفيق',
    'هاني', 'عماد', 'سامي', 'ماهر', 'مجدي', 'صلاح', 'أيمن', 'عاطف', 'نادر', 'يحيى'
  ];

  const FIRST_NAMES_AR_F = [
    'سارة', 'مريم', 'نورهان', 'ياسمين', 'آية', 'دينا', 'منى', 'رنا', 'ريم', 'مروة',
    'داليا', 'شيماء', 'هدى', 'مي', 'سلمى', 'إنجي', 'فاطمة', 'خلود', 'هدير', 'رضوى',
    'إسراء', 'ندى', 'أمنية', 'ريهام', 'نهى', 'أسماء', 'بسنت', 'ميرنا', 'هاجر', 'شروق',
    'رحمة', 'حبيبة', 'تسنيم', 'هايدي', 'نورا', 'يارا', 'روان', 'فريدة', 'جنى', 'ملك'
  ];

  const FIRST_NAMES_EN = [
    'Ahmed', 'Mohamed', 'Mahmoud', 'Mostafa', 'Karim', 'Omar', 'Tarek', 'Hossam', 'Ibrahim', 'Amr',
    'Youssef', 'Sherif', 'Ramy', 'Waleed', 'Yasser', 'Hamdy', 'Ashraf', 'Bishoy', 'Marwan', 'Fady',
    'Khaled', 'Adel', 'Sameh', 'Hassan', 'Abdelrahman', 'Maged', 'Tamer', 'Sarah', 'Mariam', 'Nourhan',
    'Dina', 'Aya', 'Rania', 'Mona', 'Reem', 'Hadeer', 'Salma', 'Farida', 'Nada', 'Nour'
  ];

  const LAST_NAMES_AR = [
    'محمود', 'السيد', 'علي', 'حسن', 'إبراهيم', 'أحمد', 'عبد الرحمن', 'الجمال', 'النجار', 'الشناوي',
    'الدسوقي', 'الشربيني', 'سمير', 'عادل', 'كمال', 'مصطفى', 'بدر', 'توفيق', 'غانم', 'زهران',
    'الباز', 'عطية', 'يونس', 'منصور', 'سليمان', 'مطاوع', 'فهمي', 'رضوان', 'زكي', 'عثمان',
    'عوض', 'حجازي', 'غريب', 'الشرقاوي', 'السعيد', 'خليل', 'عبد العال', 'شلبي', 'حامد', 'زايد',
    'صقر', 'قنديل', 'العوضي', 'بركات', 'الجزار', 'فودة', 'البسيوني', 'خطاب', 'صبري', 'يحيى'
  ];

  const LAST_NAMES_EN = [
    'Mahmoud', 'Elsayed', 'Ali', 'Hassan', 'Ibrahim', 'Ahmed', 'Abdelrahman', 'Gamal', 'Naggar', 'Shennawy',
    'Desouky', 'Sherbiny', 'Samir', 'Adel', 'Kamal', 'Mostafa', 'Badr', 'Tawfik', 'Ghanem', 'Zahran',
    'Baz', 'Attia', 'Younis', 'Mansour', 'Soliman', 'Fahmy', 'Radwan', 'Zaki', 'Osman', 'Awad'
  ];

  // 100% Authentic Egyptian Dialect Arabic Comments with Place & Specialty Integration
  const TEMPLATES_5 = [
    `بصراحة ${pName} في ${spec} مفيش بعد كده، دقة واحترافية والتزام في المواعيد وناس محترمة جداً.`,
    `من أفضل الأماكن في المنزلة لـ ${spec}، تعامل راقي وشغل مظبوط على الفرازة تسلم إيديكم.`,
    `تعاملت مع ${pName} وبجد تجربة ممتازة، شاطرين جداً في ${spec} وسريعين والأسعار مناسبة.`,
    `شغل عالي واحترافي جداً في ${spec}، والنتيجة كانت فوق الممتازة ومرضية لأبعد حد.`,
    `أحسن وأشطر حد في المنزلة والدقهلية في مجال ${spec}، ربنا يوفقكم دايماً.`,
    `ما شاء الله تبارك الله، أمانة وإتقان وسرعة في الرد، أنصح أي حد محتاج ${spec} يتعامل مع ${pName}.`,
    `خدمة 5 نجوم واستقبال ممتاز، ${pName} رقم 1 في ${spec} بلا منازع.`,
    `تجربة هايلة، ${pName} ناس فاهمة في ${spec} جداً وعندهم ذوق عالي في التعامل وسرعة تنفيذ.`,
    `من أحسن التجارب اللي مريت بيها، جودة في ${spec} ومعاملة في قمة الذوق والاحترام.`,
    `مكان محترم وموثوق، والخدمة في ${spec} طلعت أحسن من اللي طلبته بكتير.`,
    `قمة في الأمانة والاحترافية، شكراً جزيلاً لـ ${pName} على الشغل النظيف.`,
    `بجد ناس في منتهى الذوق والأمانة، وخدمة ${spec} عندهم ممتازة ومفيهاش أي غلطة.`,
    `كل الشكر والتقدير لـ ${pName}، متميزين جداً في ${spec} وسرعة في الإنجاز.`,
    `أفضل خدمة وتجربة تعامل في المنزلة كلها، شغل ${spec} ممتاز ربنا يباركلهم.`,
    `دقة في المواعيد وجودة وسعر ممتاز في ${spec}، أنصح بالتعامل معاهم بشدة.`,
    `والله العظيم قمة في الذوق والاحتراف، ${pName} أحسن من يقدم ${spec}.`,
    `شغل نظيف ومرتب، وأسعار مناسبة جداً مقارنة بالجودة العالية لـ ${spec}.`,
    `استجابة سريعة جداً وخدمة عملاء ممتازة، ${pName} الاختيار الأول دائماً في ${spec}.`
  ];

  const TEMPLATES_4 = [
    `خدمة جيدة جداً في ${spec} وتعامل راقي ومحترم، تجربة موفقة ومرضية.`,
    `شغل نظيف ومنظم من ${pName}، فقط استغرق وقتاً قليلاً لكن النتيجة في ${spec} ممتازة.`,
    `تجربة طيبة وتعامل محترم، شكراً لكم على المجهود المميز في ${spec}.`,
    `جودة العمل عالية ومطابقة لما تم الاتفاق عليه، أنصح بتجربة ${pName}.`,
    `مكان محترم وخدمة سريعة في ${spec}، بالتوفيق دائمًا.`,
    `تعاملت معاهم في ${spec} والخدمة ممتازة، السعر كان ممكن يكون أفضل لكن الجودة كويسة جداً.`,
    `مكان كويس وموثوق وناس محترمة جداً وشغل ${spec} عندهم مظبوط.`,
    `تجربة ممتازة بوجه عام وخدمة ${spec} طلعت كويسة جداً.`,
    `ناس محترمة وسريعين في الرد، وخدمة ${spec} جيدة ومطابقة للطلب.`
  ];

  const TEMPLATES_3 = [
    `الخدمة في ${spec} مقبولة وجيدة في المجمل، لكن تحتاج بعض التطوير والسرعة في التنفيذ.`,
    `تعامل عادي من ${pName} والنتيجة في ${spec} متوسطة كما هو متوقع.`,
    `تجربة مقبولة ولكن هناك مجال للتحسين في مواعيد تسليم ${spec}.`,
    `الخدمة جيدة لكن أسعار ${spec} تحتاج إعادة نظر لتناسب الجميع.`,
    `المكان كويس بس الزحمة مأثرة شوية على سرعة تقديم ${spec}.`,
    `مستوى الخدمة في ${spec} متوسط، معقول لكن يحتاج اهتمام أكثر بالتفاصيل.`
  ];

  const TEMPLATES_2 = [
    `الخدمة في ${spec} تحتاج تحسين ملحوظ في سرعة الاستجابة والالتزام بالمواعيد.`,
    `التجربة مع ${pName} في ${spec} لم تكن على المستوى المطلوب، نأمل التطوير مستقبلاً.`,
    `للأسف فيه تأخير ملحوظ في تنفيذ ${spec} وضعف في سرعة الرد على العملاء.`,
    `الأسعار مرتفعة مقارنة بمستوى الخدمة المقدمة في ${spec}.`
  ];

  const TEMPLATES_1 = [
    'خدمة سيئة وغير مرضية، وتحتاج مراجعة شاملة في الالتزام بالمواعيد والتعامل.',
    'تجربة غير موفقة نهائياً للأسف في هذا المكان، تأخير كبير وعدم اهتمام بالعميل.',
    'مستوى الخدمة ضعيف جداً ولا أنصح بالتعامل حتى يتم تحسين الجودة.'
  ];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function pickRating() {
    if (starRange === 'negative' || starRange === '1-2') return Math.random() < 0.5 ? 2 : 1;
    if (starRange === 'positive' || starRange === '3-5') return [3, 4, 5, 5][Math.floor(Math.random() * 4)];
    if (starRange === '5') return 5;
    if (starRange === '4-5') return Math.random() < 0.75 ? 5 : 4;
    if (starRange === '3-4') return Math.random() < 0.5 ? 4 : 3;
    if (starRange === '2-4') return [2, 3, 4][Math.floor(Math.random() * 3)];
    if (starRange === '1') return 1;
    if (starRange === '2') return 2;
    if (starRange === '3') return 3;
    if (starRange === '4') return 4;
    
    const r = Math.random();
    if (r < 0.65) return 5;
    if (r < 0.85) return 4;
    if (r < 0.93) return 3;
    if (r < 0.97) return 2;
    return 1;
  }

  const usedNames = new Set();
  const results = [];
  let safetyLoop = 0;

  while (results.length < targetCount && safetyLoop < targetCount * 10) {
    safetyLoop++;
    let name = '';
    const typeRoll = Math.random();

    if (typeRoll < 0.5) {
      name = `${pick(FIRST_NAMES_AR_M)} ${pick(LAST_NAMES_AR)}`;
    } else if (typeRoll < 0.75) {
      name = `${pick(FIRST_NAMES_AR_F)} ${pick(LAST_NAMES_AR)}`;
    } else {
      name = `${pick(FIRST_NAMES_EN)} ${pick(LAST_NAMES_EN)}`;
    }

    const normName = name.trim().toLowerCase();
    if (usedNames.has(normName)) continue;
    usedNames.add(normName);

    const rating = pickRating();
    let comment = '';
    if (rating === 5) comment = pick(TEMPLATES_5);
    else if (rating === 4) comment = pick(TEMPLATES_4);
    else if (rating === 3) comment = pick(TEMPLATES_3);
    else if (rating === 2) comment = pick(TEMPLATES_2);
    else comment = pick(TEMPLATES_1);

    results.push({
      name,
      rating,
      comment
    });
  }

  return results;
}

/** Auto-assign a 5-star review for Mohamed Hammad when a new user registers */
export async function autoAssignHammadReview(user) {
  if (!user || !user.uid) return;

  try {
    const placesMap = await dbGet('places') || {};
    let hammadPlaceId = null;
    let hammadPlace = null;

    for (const [pId, pData] of Object.entries(placesMap)) {
      if (pData.slug === HAMMAD_PLACE_SLUG || pId === HAMMAD_PLACE_SLUG || (pData.name && pData.name.includes('محمد حماد'))) {
        hammadPlaceId = pId;
        hammadPlace = pData;
        break;
      }
    }

    if (!hammadPlaceId) return;

    const existing = await getPlaceReviews(hammadPlaceId);
    if (existing.some(r => r.userId === user.uid)) return;

    const randomComment = HAMMAD_TESTIMONIALS[Math.floor(Math.random() * HAMMAD_TESTIMONIALS.length)];
    const starRating = 5;

    const reviewId = `auto_hammad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reviewData = {
      id: reviewId,
      placeId: hammadPlaceId,
      placeName: hammadPlace.name || 'مهندس محمد حماد',
      placeSlug: hammadPlace.slug || HAMMAD_PLACE_SLUG,
      userId: user.uid,
      userName: user.name || user.displayName || 'مستخدم مسجل',
      userPhoto: user.photoURL || '',
      rating: starRating,
      comment: randomComment,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      editCount: 0
    };

    await dbSet(`places/${hammadPlaceId}/reviews/${reviewId}`, reviewData);
    await dbUpdate(`places/${hammadPlaceId}`, { rating: 5.0, reviewCount: (existing.length + 1) });
  } catch (err) {
    console.warn('[AutoReview] Hammad review error:', err);
  }
}

// ─────────────────────────────────────────────
//  FOLLOW PLACES SYSTEM (متابعة الأماكن وعروضها)
// ─────────────────────────────────────────────

/** Check if user follows a place */
export async function isFollowingPlace(placeId, userId) {
  if (!placeId || !userId) return false;
  try {
    const follow = await dbGet(`users/${userId}/following/${placeId}`);
    return !!follow;
  } catch (_) {
    return false;
  }
}

/** Follow a place */
export async function followPlace(placeId, user) {
  if (!placeId || !user || !user.uid) throw new Error('يجب تسجيل الدخول لمتابعة المكان');
  
  const now = Date.now();
  await dbSet(`users/${user.uid}/following/${placeId}`, {
    followedAt: now,
    placeId
  });

  await dbSet(`places/${placeId}/followers/${user.uid}`, {
    userId: user.uid,
    userName: user.name || user.displayName || 'متابع',
    userPhoto: user.photoURL || '',
    followedAt: now
  });

  // Increment followersCount
  try {
    const place = await dbGet(`places/${placeId}`);
    const currentCount = Number(place?.followersCount) || 0;
    await dbUpdate(`places/${placeId}`, { followersCount: currentCount + 1 });
  } catch (_) {}

  return true;
}

/** Unfollow a place */
export async function unfollowPlace(placeId, user) {
  if (!placeId || !user || !user.uid) return;

  await dbRemove(`users/${user.uid}/following/${placeId}`);
  await dbRemove(`places/${placeId}/followers/${user.uid}`);

  // Decrement followersCount
  try {
    const place = await dbGet(`places/${placeId}`);
    const currentCount = Math.max(0, (Number(place?.followersCount) || 1) - 1);
    await dbUpdate(`places/${placeId}`, { followersCount: currentCount });
  } catch (_) {}

  return false;
}

/** Get all places followed by user */
export async function getUserFollowedPlaces(userId) {
  if (!userId) return [];
  try {
    const followingMap = await dbGet(`users/${userId}/following`) || {};
    const placeIds = Object.keys(followingMap);
    if (!placeIds.length) return [];

    const placesList = [];
    for (const pId of placeIds) {
      const p = await dbGet(`places/${pId}`);
      if (p) placesList.push({ id: pId, ...p });
    }
    return placesList;
  } catch (err) {
    console.warn('[getUserFollowedPlaces] error:', err);
    return [];
  }
}

/** Get all active offers from places followed by user */
export async function getUserFollowedOffers(userId) {
  if (!userId) return [];
  try {
    const places = await getUserFollowedPlaces(userId);
    if (!places.length) return [];
    
    const placeIds = new Set(places.map(p => p.id));
    const allOffersMap = await dbGet('offers') || {};
    const now = Date.now();

    const offers = Object.entries(allOffersMap)
      .map(([id, o]) => ({ id, ...o }))
      .filter(o => placeIds.has(o.placeId) && o.status === 'active' && (!o.expiresAt || o.expiresAt > now))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return offers;
  } catch (err) {
    console.warn('[getUserFollowedOffers] error:', err);
    return [];
  }
}

/**
 * Subscribe to Real-Time Presence / Online status of a Place Owner
 * @param {string} ownerId
 * @param {Function} callback - receives { isOnline: boolean, lastSeen: number }
 * @returns {Function} unsubscribe function
 */
export function subscribeToOwnerPresence(ownerId, callback) {
  if (!ownerId || typeof callback !== 'function') return () => {};

  try {
    const db = getDB();
    const presenceRef = db.ref(`users/${ownerId}/presence`);
    const userRef = db.ref(`users/${ownerId}`);

    const listener = (snap) => {
      if (snap && snap.exists()) {
        const val = snap.val() || {};
        const isOnline = Boolean(val.isOnline);
        const lastSeen = Number(val.lastSeen) || 0;
        const activeRecently = isOnline || (Date.now() - lastSeen < 3 * 60 * 1000);
        callback({ isOnline: activeRecently, lastSeen });
      } else {
        userRef.once('value').then(uSnap => {
          if (uSnap.exists()) {
            const uVal = uSnap.val() || {};
            const lastLogin = Number(uVal.lastLoginAt) || 0;
            const activeRecently = Date.now() - lastLogin < 3 * 60 * 1000;
            callback({ isOnline: activeRecently, lastSeen: lastLogin });
          } else {
            callback({ isOnline: false, lastSeen: 0 });
          }
        }).catch(() => callback({ isOnline: false, lastSeen: 0 }));
      }
    };

    presenceRef.on('value', listener);

    return () => {
      try { presenceRef.off('value', listener); } catch (_) {}
    };
  } catch (err) {
    console.warn('[subscribeToOwnerPresence] error:', err);
    return () => {};
  }
}



function getDeterministicReviewerPoints(name = '', id = '') {
  const str = (name + id).trim() || 'مستخدم';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const mod = abs % 100;
  if (mod < 28) {
    return 80 + (abs % 400); // 🥉 مستكشف مبتدئ (80 - 479)
  } else if (mod < 62) {
    return 520 + (abs % 900); // 🥈 مساهم نشط (520 - 1419)
  } else if (mod < 84) {
    return 1550 + (abs % 1800); // 🥇 خبير المنزلة والمطرية (1550 - 3349)
  } else if (mod < 94) {
    return 3550 + (abs % 1350); // 💎 مساهم موثوق ذهبي (3550 - 4899)
  } else {
    return 5100 + (abs % 2200); // 👑 نخبة المنزلة VIP (5100 - 7299)
  }
}
