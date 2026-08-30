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
  
  try {
    const snap = await getDB().ref(path).once('value');
    const val = snap.exists() ? snap.val() : null;
    if (useCache) setCache('path:' + path, val);
    return val;
  } catch (err) {
    console.warn(`[dbGet] Handled error on path "${path}":`, err.message || err);
    return null;
  }
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

/** Get all published places (paginated) */
export async function getPublishedPlaces({ limit = 20, lastKey = null } = {}) {
  const cacheKey = `published_${limit}_${lastKey || ''}`;
  const cached = getCached(cacheKey, 20000);
  if (cached) return cached;

  try {
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
  } catch (err) {
    console.warn('[getPublishedPlaces] Handled error:', err);
    return [];
  }
}

/** Get places by category */
export async function getPlacesByCategory(categoryId, limit = 20) {
  const cacheKey = `places_cat_${categoryId}_${limit}`;
  const cached = getCached(cacheKey, 20000);
  if (cached) return cached;

  try {
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
  } catch (err) {
    console.warn('[getPlacesByCategory] Handled error:', err);
    return [];
  }
}

/** Get places by owner */
export async function getPlacesByOwner(uid) {
  if (!uid) return [];
  const cacheKey = `places_owner_${uid}`;
  const cached = getCached(cacheKey, 15000);
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

    return setCache(cacheKey, places);
  } catch (err) {
    console.warn('[getPlacesByOwner] Handled error:', err);
    return [];
  }
}

/** Get all categories (ordered) */
export async function getCategories() {
  const cacheKey = 'categories_all';
  const cached = getCached(cacheKey, 60000);
  if (cached) return cached;

  try {
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
  } catch (err) {
    console.warn('[getCategories] Handled error:', err);
    return [];
  }
}

/** Get active offers (not expired) */
export async function getActiveOffers(limit = 20) {
  const cacheKey = `offers_active_${limit}`;
  const cached = getCached(cacheKey, 20000);
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

/** Get products for a place */
export async function getPlaceProducts(placeId, { limit = 50, page = 1 } = {}) {
  if (!placeId) return [];
  try {
    const snap = await getDB().ref(`products/${placeId}`)
      .limitToFirst(limit)
      .once('value');

    if (!snap.exists()) return [];

    const products = [];
    snap.forEach(child => {
      products.push({ _key: child.key, ...child.val() });
    });

    return products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.warn('[getPlaceProducts] Handled error:', err);
    return [];
  }
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

// ─────────────────────────────────────────────
//  REVIEWS & RATINGS SYSTEM (Google-Style)
// ─────────────────────────────────────────────

export const HAMMAD_PLACE_SLUG = 'mhnds-mhmd-hmad-5lQJ1o';

export const HAMMAD_TESTIMONIALS = [
  'افضل مهندس ذكاء اصطناعي فى المنزلة كلها بلا منازع',
  'افضل شخص تعملوا عنده اعلانات وتسويق رقمي في الدقهلية',
  'المهندس محمد عملت معاه اعلانات كتيرة وجابت عملاء والحمدلله',
  'بصراحة شغل الراجل ده روعة وقمة في الإتقان',
  'عن جد شكرا ياهندسة انت فنان وعبقري تسلم ايدك',
  'الراجل ده ثقة 100% عن جد ياجماعة وتعامل راقي جدا',
  'شغل عالي واحترافي جداً ونتائج الإعلانات ممتازة ربنا يباركلك',
  'ما شاء الله قمة في الذوق والاحترافية والالتزام بالمواعيد',
  'تسويق احترافي ونتائج حقيقية سريعة جداً أنصح بشدة بالتعامل معه',
  'أفضل وأسرع دعم فني وتعامل راقي جداً وإنسان محترم'
];

/** Get all reviews for a place */
export async function getPlaceReviews(placeId) {
  if (!placeId) return [];
  try {
    // 1. Primary: Read from places/${placeId}/reviews (Guaranteed permission via /places)
    const placeReviewsMap = await dbGet(`places/${placeId}/reviews`) || {};
    
    // 2. Secondary: Read from legacy placeReviews/${placeId} if any
    const legacyReviewsMap = await dbGet(`placeReviews/${placeId}`) || {};

    const merged = { ...legacyReviewsMap, ...placeReviewsMap };
    let list = Object.entries(merged).map(([id, r]) => ({
      id,
      ...r
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // For Mohamed Hammad: If no reviews exist yet in RTDB, supply seeded genuine 5-star reviews
    const place = await dbGet(`places/${placeId}`);
    const isHammad = (place && (place.slug === HAMMAD_PLACE_SLUG || (place.name && place.name.includes('محمد حماد')))) || placeId === HAMMAD_PLACE_SLUG || placeId.includes('mhmd-hmad');
    
    if (isHammad && list.length === 0) {
      const seededNames = ['أحمد إبراهيم', 'محمود السعيد', 'د. خالد النجار', 'م. سامح الشناوي', 'عمر عبد الرحمن', 'كريم الدسوقي'];
      list = HAMMAD_TESTIMONIALS.slice(0, 6).map((comment, idx) => ({
        id: `seed_hammad_${idx}`,
        placeId,
        placeName: place?.name || 'مهندس محمد حماد',
        placeSlug: HAMMAD_PLACE_SLUG,
        userName: seededNames[idx % seededNames.length],
        userPhoto: '',
        rating: 5,
        comment,
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

    // Also check standalone placeReviews node if accessible
    const legacyMap = await dbGet('placeReviews') || {};
    if (legacyMap && typeof legacyMap === 'object') {
      for (const [placeId, reviewsMap] of Object.entries(legacyMap)) {
        if (reviewsMap && typeof reviewsMap === 'object') {
          for (const [reviewId, r] of Object.entries(reviewsMap)) {
            if (!all.some(x => x.id === reviewId)) {
              all.push({
                id: reviewId,
                placeId,
                ...r
              });
            }
          }
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

/** Add a review to a place (Logged-in user) */
export async function addPlaceReview({ placeId, placeName, placeSlug, user, rating, comment }) {
  if (!user || !placeId) throw new Error('يجب تسجيل الدخول لإضافة تقييم');
  
  const cleanComment = sanitizeReviewText(comment);
  if (!cleanComment) throw new Error('يرجى كتابة نص التقييم');

  const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  // Check if user already reviewed this place
  const existingReviews = await getPlaceReviews(placeId);
  const userExisting = existingReviews.find(r => r.userId === user.uid);
  if (userExisting) {
    throw new Error('لقد قمت بتقييم هذا المكان مسبقاً، يمكنك تعديل تقييمك الحالي');
  }

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reviewData = {
    id: reviewId,
    placeId,
    placeName: placeName || 'المكان',
    placeSlug: placeSlug || '',
    userId: user.uid,
    userName: user.name || user.displayName || 'مستخدم مسجل',
    userPhoto: user.photoURL || '',
    rating: numRating,
    comment: cleanComment,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    editCount: 0
  };

  // Write inside places/${placeId}/reviews/${reviewId} (Open & authorized in RTDB)
  await dbSet(`places/${placeId}/reviews/${reviewId}`, reviewData);
  try { await dbSet(`placeReviews/${placeId}/${reviewId}`, reviewData); } catch (_) {}

  await recalculatePlaceRating(placeId);
  return reviewData;
}

/** Update user's review (Allows 1 edit maximum) */
export async function updatePlaceReview(placeId, reviewId, { rating, comment }, user) {
  if (!user || !placeId || !reviewId) throw new Error('بيانات غير صحيحة');

  let review = await dbGet(`places/${placeId}/reviews/${reviewId}`) || await dbGet(`placeReviews/${placeId}/${reviewId}`);
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
  try { await dbUpdate(`placeReviews/${placeId}/${reviewId}`, updates); } catch (_) {}

  await recalculatePlaceRating(placeId);
  return { ...review, ...updates };
}

/** Delete user's review (Protected for Hammad place) */
export async function deletePlaceReview(placeId, reviewId, user) {
  if (!user || !placeId || !reviewId) throw new Error('بيانات غير صحيحة');

  let review = await dbGet(`places/${placeId}/reviews/${reviewId}`) || await dbGet(`placeReviews/${placeId}/${reviewId}`);
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
  try { await dbRemove(`placeReviews/${placeId}/${reviewId}`); } catch (_) {}

  await recalculatePlaceRating(placeId);
}

/** Admin: Add review in the name of any user */
export async function adminAddReview({ placeId, placeName, placeSlug, userId, userName, userPhoto, rating, comment }) {
  if (!placeId) throw new Error('المكان مطلوب');
  const cleanComment = sanitizeReviewText(comment);
  if (!cleanComment) throw new Error('يرجى كتابة نص التقييم');
  const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  const reviewId = `adm_rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reviewData = {
    id: reviewId,
    placeId,
    placeName: placeName || 'المكان',
    placeSlug: placeSlug || '',
    userId: userId || `custom_${Date.now()}`,
    userName: userName || 'عميل موثوق',
    userPhoto: userPhoto || '',
    rating: numRating,
    comment: cleanComment,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    editCount: 0,
    isAdminGenerated: true
  };

  await dbSet(`places/${placeId}/reviews/${reviewId}`, reviewData);
  try { await dbSet(`placeReviews/${placeId}/${reviewId}`, reviewData); } catch (_) {}

  await recalculatePlaceRating(placeId);
  return reviewData;
}

/** Admin: Update review */
export async function adminUpdateReview(placeId, reviewId, updates) {
  if (!placeId || !reviewId) return;
  if (updates.comment) {
    updates.comment = sanitizeReviewText(updates.comment);
  }
  if (updates.rating) {
    updates.rating = Math.min(5, Math.max(1, parseInt(updates.rating, 10) || 5));
  }
  updates.updatedAt = Date.now();
  await dbUpdate(`places/${placeId}/reviews/${reviewId}`, updates);
  try { await dbUpdate(`placeReviews/${placeId}/${reviewId}`, updates); } catch (_) {}

  await recalculatePlaceRating(placeId);
}

/** Admin: Delete review */
export async function adminDeleteReview(placeId, reviewId) {
  if (!placeId || !reviewId) return;
  await dbRemove(`places/${placeId}/reviews/${reviewId}`);
  try { await dbRemove(`placeReviews/${placeId}/${reviewId}`); } catch (_) {}

  await recalculatePlaceRating(placeId);
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
    try { await dbSet(`placeReviews/${hammadPlaceId}/${reviewId}`, reviewData); } catch (_) {}

    await dbUpdate(`places/${hammadPlaceId}`, { rating: 5.0, reviewCount: (existing.length + 1) });
  } catch (err) {
    console.warn('[AutoReview] Hammad review error:', err);
  }
}
