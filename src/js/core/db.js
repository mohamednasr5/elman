/**
 * المنزلة وناسها — Firebase RTDB Helpers
 * Typed, promise-based wrappers around Firebase Realtime Database
 */

import { getDB } from './firebase.js';

export { getDB };

// ── Generic RTDB helpers ──

export function dbRef(path) {
  return getDB().ref(path);
}

export async function dbGet(path) {
  const snap = await getDB().ref(path).once('value');
  return snap.exists() ? snap.val() : null;
}

export async function dbSet(path, data) {
  await getDB().ref(path).set(data);
}

export async function dbUpdate(path, updates) {
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

  return places;
}

/** Get places by category */
export async function getPlacesByCategory(categoryId, limit = 20) {
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

  return places.filter(p => p.status === 'published');
}

/** Get places by owner */
export async function getPlacesByOwner(uid) {
  const snap = await getDB().ref('places')
    .orderByChild('ownerId')
    .equalTo(uid)
    .once('value');

  if (!snap.exists()) return [];

  const places = [];
  snap.forEach(child => {
    places.push({ _key: child.key, ...child.val() });
  });

  return places;
}

/** Get all categories (ordered) */
export async function getCategories() {
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

  return cats;
}

/** Get active offers (not expired) */
export async function getActiveOffers(limit = 20) {
  const now = Date.now();
  const snap = await getDB().ref('offers')
    .orderByChild('status')
    .equalTo('active')
    .limitToFirst(limit * 2) // Fetch extra, filter client-side
    .once('value');

  if (!snap.exists()) return [];

  const offers = [];
  snap.forEach(child => {
    const offer = { _key: child.key, ...child.val() };
    if (offer.endDate > now) {
      offers.push(offer);
    }
  });

  return offers.slice(0, limit);
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

  return ads.sort((a, b) => b.priority - a.priority);
}

/** Get site settings */
export async function getSettings() {
  return dbGet('settings');
}

/** Increment place view stat */
export async function trackPlaceView(placeId) {
  await dbIncrement(`places/${placeId}/stats/views`);
}

/** Increment place stat */
export async function trackPlaceStat(placeId, stat) {
  const allowed = ['phoneClicks', 'whatsappClicks', 'directionsClicks', 'productViews', 'offerViews'];
  if (!allowed.includes(stat)) return;
  await dbIncrement(`places/${placeId}/stats/${stat}`);
}
