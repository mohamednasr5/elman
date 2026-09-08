/**
 * المنزلة وناسها — Firebase RTDB Helpers
 * Typed, promise-based wrappers around Firebase Realtime Database
 */

import { WORKER_URL, getAuth } from './firebase.js';
import { idbGetAll, idbPutBulk, idbPut, idbGet, idbGetByIndex, idbDelete, idbClear, idbGetMeta, idbSetMeta, STORES } from '../services/idb-cache.service.js';

export { idbGetAll, idbPutBulk, idbPut, idbGet, idbGetByIndex, idbDelete, idbClear, idbGetMeta, idbSetMeta, STORES };

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

// ── Database helpers ──
// Business/public data is NEVER read from Firebase RTDB.
// Firebase remains available only for legacy user/notification/presence paths.

function isBusinessDataPath(path = '') {
  const p = String(path || '').replace(/^\/+/, '');
  return /^(places|categories|offers|products|ads)(?:\/|$)/i.test(p);
}

function parseBusinessPath(path = '') {
  const p = String(path || '').replace(/^\/+/, '');
  const parts = p.split('/').filter(Boolean);
  return { p, parts, root: parts[0] || '' };
}

/**
 * Primary Worker API caller - Communicates with Worker which connects directly to Turso DB.
 */
async function tursoFetch(path, options = {}) {
  let token = null;
  try {
    let auth = getAuth();
    if (auth?.currentUser) {
      token = await auth.currentUser.getIdToken().catch(() => null);
    } else if (options.requiresAuth || (options.method && options.method !== 'GET')) {
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 100));
        auth = getAuth();
        if (auth?.currentUser) {
          token = await auth.currentUser.getIdToken().catch(() => null);
          break;
        }
      }
    }
  } catch (_) {}

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: 'Bearer ' + token } : {})
  };

  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(20000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Worker HTTP ${res.status}`);
  return data;
}

export { tursoFetch };

/**
 * Sync a place to the authoritative Turso database through the Worker.
 * The browser never connects directly to Turso; the Worker authenticates
 * the Firebase user and writes to Turso.
 */
export async function syncPlaceToWorkerTurso(placeId, placeData = {}) {
  if (!placeId) throw new Error('معرف المكان مطلوب للمزامنة مع Turso');
  const payload = { ...(placeData || {}), id: placeId };
  return tursoFetch('/api/places/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000)
  });
}

function normalizeReviewFromTurso(r, placeId = '') {
  if (!r) return null;
  return {
    id: r.id,
    placeId: r.place_id || placeId,
    userId: r.user_id,
    userName: r.user_name || 'مستخدم',
    userPhoto: r.user_photo || '',
    placeName: r.place_name || '',
    placeSlug: r.place_slug || '',
    rating: Number(r.rating) || 5,
    comment: r.comment || '',
    likes: Number(r.likes) || 0,
    isAdminGenerated: Boolean(r.is_admin_generated),
    editCount: Number(r.edit_count) || 0,
    isReported: Boolean(r.is_reported),
    reportCount: Number(r.report_count) || 0,
    lastReportReason: r.last_report_reason || '',
    reportedAt: Number(r.reported_at) || 0,
    lastReporterName: r.last_reporter_name || '',
    isReviewedByAdmin: Boolean(r.is_reviewed_by_admin),
    adminReviewStatus: r.admin_review_status || '',
    adminReviewNote: r.admin_review_note || '',
    reviewedAt: Number(r.reviewed_at) || 0,
    createdAt: Number(r.created_at) || Date.now(),
    updatedAt: Number(r.updated_at) || Date.now()
  };
}

async function tursoGetBusiness(path) {
  const { parts, root } = parseBusinessPath(path);
  if (root === 'ads') {
    const data = await tursoFetch('/api/ads'); const list = Array.isArray(data.data) ? data.data : [];
    if (parts.length === 1) return Object.fromEntries(list.map(a => [a.id || a._id, a]));
    return list.find(a => String(a.id || a._id) === String(parts[1])) || null;
  }
  if (root === 'categories') {
    const data = await tursoFetch('/api/categories'); const list = Array.isArray(data.data) ? data.data : [];
    if (parts.length === 1) return Object.fromEntries(list.map(c => [c.id || c.slug, c]));
    return list.find(c => String(c.id || c.slug) === String(parts[1])) || null;
  }
  if (root === 'places') {
    if (parts.length >= 3 && parts[2] === 'reviews') {
      const data = await tursoFetch(`/api/reviews?place_id=${encodeURIComponent(parts[1])}`); const list = Array.isArray(data.data) ? data.data : [];
      if (parts[3]) return list.find(r => String(r.id) === String(parts[3])) || null;
      return Object.fromEntries(list.map(r => [r.id, r]));
    }
    if (parts.length === 1) {
      const data = await tursoFetch('/api/places?limit=1000');
      return Object.fromEntries((Array.isArray(data.data) ? data.data : []).map(x => [x.id, x]));
    }
    const data = await tursoFetch(`/api/places?id=${encodeURIComponent(parts[1])}`); return data.data || null;
  }
  if (root === 'offers') {
    const data = await tursoFetch(parts.length > 1 ? `/api/offers?id=${encodeURIComponent(parts[1])}` : '/api/offers');
    const list = Array.isArray(data.data) ? data.data : [];
    return parts.length === 1 ? Object.fromEntries(list.filter(x => x.id).map(x => [x.id, x])) : (list.find(x => String(x.id) === String(parts[1])) || null);
  }
  if (root === 'products') {
    const placeId = parts[1] || '', productId = parts[2] || '';
    const apiPath = productId ? `/api/products?id=${encodeURIComponent(productId)}` : (placeId ? `/api/products?place_id=${encodeURIComponent(placeId)}` : '/api/products');
    const data = await tursoFetch(apiPath); const list = Array.isArray(data.data) ? data.data : [];
    if (parts.length <= 2) return Object.fromEntries(list.filter(x => x.id).map(x => [x.id, x]));
    return list.find(x => String(x.id) === String(productId)) || null;
  }
  return null;
}

async function tursoWriteBusiness(path, method, data = null) {
  const { parts, root } = parseBusinessPath(path);
  if (root === 'ads') {
    if (method === 'POST') return tursoFetch('/api/ads', { method:'POST', body:JSON.stringify(data || {}) });
    if (method === 'PUT') return tursoFetch('/api/ads', { method:'POST', body:JSON.stringify({ ...(data || {}), id:parts[1] || data?.id || data?._id }) });
    if (method === 'DELETE' && parts[1]) return tursoFetch(`/api/ads?id=${encodeURIComponent(parts[1])}`, { method:'DELETE' });
    throw new Error(`Unsupported ads write path: ${path}`);
  }
  if (root === 'places') {
    if (parts.length >= 3 && parts[2] === 'reviews') {
      const placeId=parts[1], reviewId=parts[3];
      if (method==='DELETE') return tursoFetch(reviewId ? `/api/reviews?id=${encodeURIComponent(reviewId)}` : `/api/reviews?place_id=${encodeURIComponent(placeId)}`, {method:'DELETE'});
      if (method==='POST') return tursoFetch('/api/reviews',{method:'POST',body:JSON.stringify({...data,place_id:data?.place_id||placeId})});
      if (method==='PUT' && reviewId) return tursoFetch(`/api/reviews?id=${encodeURIComponent(reviewId)}`,{method:'PUT',body:JSON.stringify(data||{})});
    }
    if (parts.length===2 && (method==='POST'||method==='PUT')) return tursoFetch('/api/places/sync',{method:'POST',body:JSON.stringify({id:parts[1],...(data||{})})});
    if (parts.length===2 && method==='DELETE') return tursoFetch(`/api/places/${encodeURIComponent(parts[1])}`,{method:'DELETE'});
    throw new Error(`Unsupported place write path: ${path}`);
  }
  if (root==='offers') {
    if(method==='POST') return tursoFetch('/api/offers',{method:'POST',body:JSON.stringify(data||{})});
    if(method==='PUT'&&parts[1]) return tursoFetch(`/api/offers/${encodeURIComponent(parts[1])}`,{method:'PUT',body:JSON.stringify(data||{})});
    if(method==='DELETE'&&parts[1]) return tursoFetch(`/api/offers/${encodeURIComponent(parts[1])}`,{method:'DELETE'});
  }
  if (root==='products') {
    if(method==='POST') return tursoFetch('/api/products',{method:'POST',body:JSON.stringify({...data,place_id:data?.place_id||data?.placeId||parts[1]})});
    if(method==='PUT'&&parts[2]) return tursoFetch(`/api/products/${encodeURIComponent(parts[2])}`,{method:'PUT',body:JSON.stringify(data||{})});
    if(method==='DELETE'&&parts[2]) return tursoFetch(`/api/products/${encodeURIComponent(parts[2])}`,{method:'DELETE'});
  }
  if(root==='categories'){
    if(method==='POST') return tursoFetch('/api/categories',{method:'POST',body:JSON.stringify(data||{})});
    if(method==='PUT'&&parts[1]) return tursoFetch(`/api/categories/${encodeURIComponent(parts[1])}`,{method:'PUT',body:JSON.stringify(data||{})});
    if(method==='DELETE'&&parts[1]) return tursoFetch(`/api/categories/${encodeURIComponent(parts[1])}`,{method:'DELETE'});
  }
  throw new Error(`No Turso write endpoint configured for ${root}`);
}

export function getDB() {
  return null;
}

export function dbRef(path) {
  throw new Error('Firebase Realtime Database is disabled. Use Turso APIs: '+path);
}

export async function dbGet(path, useCache = true) {
  const key='path:'+path;
  if(useCache){const cached=getCached(key);if(cached!==null)return cached;}
  try {
    if(isBusinessDataPath(path)){
      const val=await tursoGetBusiness(path); if(useCache)setCache(key,val); return val;
    }
    // No Firebase Realtime Database fallback. Non-business legacy paths must
    // be migrated to a dedicated Turso endpoint instead of silently reading RTDB.
    return null;
  } catch(err){ console.warn('[dbGet] Turso read failed for '+path+':',err?.message||err); return null; }
}

export async function dbSet(path, data) {
  clearDbCache();
  if (isBusinessDataPath(path)) {
    if (String(path).match(/^places\/[^/]+\/reviews\/[^/]+$/)) {
      await tursoWriteBusiness(path, 'POST', {
        ...(data || {}),
        place_id: data?.place_id || data?.placeId || String(path).split('/')[1]
      });
      return;
    }
    await tursoWriteBusiness(path, 'PUT', data);
    return;
  }
  throw new Error('Firebase Realtime Database is disabled; migrate this path to Turso: '+path);
}

export async function dbUpdate(path, updates) {
  clearDbCache();
  if (isBusinessDataPath(path)) {
    if (String(path).match(/^places\/[^/]+\/reviews\/[^/]+$/)) {
      await tursoWriteBusiness(path, 'PUT', updates);
      return;
    }
    if (String(path).match(/^places\/[^/]+$/)) {
      await tursoWriteBusiness(path, 'PUT', updates);
      return;
    }
    if (String(path).match(/^places\/[^/]+\/reviews$/)) {
      // Update multiple reviews without touching Firebase.
      const placeId = String(path).split('/')[1];
      for (const [reviewId, patch] of Object.entries(updates || {})) {
        if (patch === null) {
          await tursoWriteBusiness(`places/${placeId}/reviews/${reviewId}`, 'DELETE');
        } else {
          await tursoWriteBusiness(`places/${placeId}/reviews/${reviewId}`, 'PUT', patch);
        }
      }
      return;
    }
    await tursoWriteBusiness(path, 'PUT', updates);
    return;
  }
  throw new Error('Firebase Realtime Database is disabled; migrate this path to Turso: '+path);
}

export async function dbPush(path, data) {
  if (isBusinessDataPath(path)) {
    const cleanPath = String(path || '').replace(/^\/+/, '');

    // Ads are authoritative in Turso. Never attempt Firebase push.
    if (/^ads(?:\/|$)/i.test(cleanPath)) {
      const parts = cleanPath.split('/').filter(Boolean);
      const result = await tursoWriteBusiness(cleanPath, 'POST', data || {});
      const newId = result?.id || result?.data?.id || data?.id || data?._id || `local_${Date.now()}`;
      return { key: newId, id: newId };
    }

    // Reviews are authoritative in Turso.
    if (/^places\/[^/]+\/reviews$/i.test(cleanPath)) {
      const placeId = cleanPath.split('/')[1];
      const result = await tursoWriteBusiness(cleanPath, 'POST', { ...(data || {}), place_id: data?.place_id || placeId });
      const newId = result?.id || result?.data?.id || data?.id || `local_${Date.now()}`;
      return { key: newId, id: newId };
    }

    throw new Error(`Turso write path is not supported for business data: ${cleanPath}`);
  }

  throw new Error('Firebase Realtime Database is disabled; migrate this path to Turso: '+path);
}

export async function dbRemove(path) {
  clearDbCache();
  if (!path || String(path).trim() === '') return;
  if (isBusinessDataPath(path)) {
    await tursoWriteBusiness(path, 'DELETE');
    return;
  }
  throw new Error('Firebase Realtime Database is disabled; migrate this path to Turso: '+path);
}

export async function dbIncrement(path, delta = 1) {
  if (isBusinessDataPath(path)) {
    const m = String(path).match(/^places\/([^/]+)\/stats\/([^/]+)$/);
    if (m) {
      const res = await fetch(`${WORKER_URL}/api/places/track-stat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: m[1], stat: m[2], delta: Number(delta) || 1 }),
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`Worker stat update failed: ${res.status}`);
      return;
    }
    throw new Error(`Firebase increment blocked for business data path: ${path}`);
  }
  throw new Error('Firebase Realtime Database is disabled; migrate this path to Turso: '+path);
}

export function serverTimestamp() {
  return Date.now();
}

export function dbListen(path, callback) {
  throw new Error('Firebase Realtime Database listeners are disabled: '+path);
}

export function dbListenChild(path, addedCb, changedCb, removedCb) {
  throw new Error('Firebase Realtime Database listeners are disabled: '+path);
}

export async function dbQuery({ path, orderBy = 'createdAt', limit = 20, startAfter = null, equalTo = null, direction = 'desc' }) {
  if (isBusinessDataPath(path)) {
    const val = await tursoGetBusiness(path);
    let items = Object.entries(val || {}).map(([id, item]) => ({ _key: id, ...item }));
    if (equalTo !== null) items = items.filter(x => x?.[orderBy] === equalTo);
    items.sort((a, b) => (Number(b?.[orderBy]) || 0) - (Number(a?.[orderBy]) || 0));
    if (startAfter !== null) {
      const idx = items.findIndex(x => String(x?._key) === String(startAfter));
      if (idx >= 0) items = items.slice(idx + 1);
    }
    return items.slice(0, limit);
  }

  throw new Error('Firebase Realtime Database queries are disabled; use Turso APIs: '+path);
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const cached = getCached('user:' + uid);
  if (cached) return cached;
  try {
    const res = await fetch(`${WORKER_URL}/api/users`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        const found = data.data.find(u => u.id === uid);
        if (found) return setCache('user:' + uid, found);
      }
    }
  } catch (_) {}
  return null;
}

/** Get all users - Primary Turso */
export async function getAllUsersTurso() {
  try {
    const data = await tursoFetch('/api/users');
    if (data && data.success && Array.isArray(data.data)) {
      const usersMap = {};
      data.data.forEach(u => {
        usersMap[u.id] = {
          uid: u.id,
          id: u.id,
          name: u.name,
          displayName: u.name,
          email: u.email,
          photoURL: u.photo_url,
          phone: u.phone,
          role: u.role,
          status: u.status,
          createdAt: u.created_at,
          updatedAt: u.updated_at
        };
      });
      return usersMap;
    }
  } catch (err) {
    console.debug('[getAllUsersTurso] Worker fetch handled:', err.message);
  }
  return {};
}


/** Get all Category Requests - Primary Turso */
export async function getCategoryRequestsTurso() {
  try {
    const res = await fetch(`${WORKER_URL}/api/category-requests`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        const map = {};
        data.data.forEach(r => {
          map[r.id] = {
            id: r.id,
            categoryName: r.category_name,
            placeName: r.place_name,
            ownerName: r.owner_name,
            userId: r.user_id,
            status: r.status,
            createdAt: r.created_at,
            reviewedAt: r.reviewed_at
          };
        });
        return map;
      }
    }
  } catch (_) {}
  return {};
}

/** Submit a new Category Request to Turso */
export async function submitCategoryRequestTurso({ categoryName, placeName, ownerName, userId }) {
  try {
    const data = await tursoFetch('/api/category-requests', {
      method: 'POST',
      body: JSON.stringify({ categoryName, placeName, ownerName, userId })
    });
    return Boolean(data && data.success);
  } catch (_) {
    return false;
  }
}

/** Get all Verification Requests - Primary Turso */
export async function getVerificationRequestsTurso() {
  try {
    const data = await tursoFetch('/api/verification-requests');
    if (data && data.success && Array.isArray(data.data)) {
      const map = {};
      data.data.forEach(r => {
        map[r.id] = {
          id: r.id,
          placeId: r.place_id,
          placeName: r.place_name,
          ownerId: r.owner_id,
          ownerName: r.owner_name,
          ownerEmail: r.owner_email,
          phone: r.phone,
          notes: r.notes,
          status: r.status,
          verifiedUntil: r.verified_until,
          createdAt: r.created_at,
          requestedAt: r.created_at,
          reviewedAt: r.reviewed_at
        };
      });
      return map;
    }
  } catch (err) {
    console.warn('[getVerificationRequestsTurso] Error:', err.message);
  }
  return {};
}

/** Update Verification Request status in Turso */
export async function updateVerificationRequestTurso(id, status = 'approved', verifiedUntil = null) {
  return tursoFetch('/api/verification-requests/' + encodeURIComponent(id), {
    method: 'PUT',
    body: JSON.stringify({ status, verifiedUntil })
  });
}

/** Update User Role/Status in Turso */
export async function updateUserTurso(uid, { role, status, name, email, phone, points } = {}) {
  const body = {};
  for (const [key, value] of Object.entries({ role, status, name, email, phone, points })) {
    if (value !== undefined) body[key] = value;
  }
  return tursoFetch('/api/users/' + encodeURIComponent(uid), {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function getAdminPlacesTurso({limit=1000,offset=0}={}) {
  const data = await tursoFetch('/api/places?admin=1&limit=' + encodeURIComponent(Math.min(1000,Math.max(1,limit))) + '&offset=' + encodeURIComponent(Math.max(0,offset)));
  const list = Array.isArray(data?.data) ? data.data : [];
  return Object.fromEntries(list.map(p => [p.id || p._id, normalizeTursoPlace(p)]).filter(([id,p]) => id && p));
}

/** Get place by ID - Reads from Turso and IndexedDB */
export async function getPlace(placeId) {
  if (!placeId) return null;
  const cleanId = String(placeId).trim();

  // Turso is authoritative. IndexedDB is cache-only and must never mask
  // a deleted/updated record or make a local-only record appear to exist.
  // 1. Fetch directly from Turso Worker by ID
  try {
    const res = await fetch(`${WORKER_URL}/api/places?id=${encodeURIComponent(cleanId)}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        const place = normalizeTursoPlace(data.data);
        if (place) {
          idbPut(STORES.PLACES, place).catch(() => {});
          return place;
        }
      }
    }
  } catch (_) {}

  // 3. Fallback: try by slug in Turso Worker
  try {
    const resSlug = await fetch(`${WORKER_URL}/api/places?slug=${encodeURIComponent(cleanId)}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (resSlug.ok) {
      const dataSlug = await resSlug.json();
      if (dataSlug && dataSlug.success && dataSlug.data) {
        const place = normalizeTursoPlace(dataSlug.data);
        if (place) {
          idbPut(STORES.PLACES, place).catch(() => {});
          return place;
        }
      }
    }
  } catch (_) {}

  // 4. Fallback: search all published places list
  try {
    const all = await getPublishedPlaces({ limit: 1000 });
    const s = cleanId.toLowerCase();
    const found = all.find(p => String(p?.id || '').toLowerCase() === s || String(p?.slug || '').toLowerCase() === s);
    if (found) return found;
  } catch (_) {}

  return null;
}



/** Invalidate local caches (IndexedDB and in-memory SWR) for a place */
export async function invalidateLocalPlaceCache(placeId,slug='') {
  try{if(placeId)await idbDelete(STORES.PLACES,placeId);}catch(_){}
  clearDbCache('path:places');clearDbCache('places');if(slug)clearDbCache('place:'+slug);return true;
}

export async function searchPlacesTurso(query = '', { category = '', area = '', limit = 20, offset = 0, verified = false, minRating = 0 } = {}) {
  try {
    const url = new URL(`${WORKER_URL}/api/search`);
    if (query) url.searchParams.set('q', query);
    if (category) url.searchParams.set('category', category);
    if (area) url.searchParams.set('area', area);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    if (verified) url.searchParams.set('verified', '1');
    if (Number(minRating) > 0) url.searchParams.set('min_rating', String(minRating));

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return {
          places: data.data.map(p => normalizeTursoPlace(p)),
          pagination: data.pagination || { limit, offset, returned: data.data.length, hasMore: false }
        };
      }
    }
  } catch (err) {
    console.warn('[SearchTurso] Worker search failed:', err);
  }
  return null;
}

/** Submit a public report about incorrect/stale place information. */
export async function reportPlaceData({ placeId, reason = 'معلومة غير صحيحة', details = '', reporterName = 'زائر' } = {}) {
  if (!placeId || !reason) throw new Error('بيانات البلاغ غير مكتملة');
  const res = await fetch(`${WORKER_URL}/api/place-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placeId, reason, details, reporterName })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || 'تعذر إرسال البلاغ');
  return data;
}

/** Get place by slug (with multi-tier resilient lookup and 0ms instant cache) */
export async function getPlaceBySlug(slug) {
  if (!slug) return null;
  const raw = String(slug).trim();
  const clean = raw.toLowerCase();

  // Tier 0: Check Local Storage / IndexedDB for 0ms sub-second transition
  try {
    let localPlace = await idbGet(STORES.PLACES, raw);
    if (!localPlace && clean !== raw) localPlace = await idbGet(STORES.PLACES, clean);
    if (!localPlace) localPlace = await idbGetByIndex(STORES.PLACES, 'slug', raw);
    if (!localPlace && clean !== raw) localPlace = await idbGetByIndex(STORES.PLACES, 'slug', clean);

    if (!localPlace) {
      const allCached = getCached('published_1000_') || getCached('published_500_') || getCached('published_100_');
      if (Array.isArray(allCached)) {
        localPlace = allCached.find(item => 
          item && (
            String(item.slug || '').toLowerCase() === clean || 
            String(item.id || '').toLowerCase() === clean ||
            String(item.slug || '') === raw ||
            String(item.id || '') === raw
          )
        );
      }
    }

    if (localPlace && !isPlaceBanned(localPlace)) {
      // Revalidate in background to keep data fresh without blocking page navigation
      tursoFetch('/api/places?slug=' + encodeURIComponent(localPlace.slug || raw)).then(data => {
        if (data?.success && data.data) {
          const fresh = normalizeTursoPlace(data.data);
          if (fresh) idbPut(STORES.PLACES, fresh).catch(() => {});
        }
      }).catch(() => {});
      return localPlace;
    }
  } catch (_) {}

  // 1. Fetch directly from Turso Worker by slug (try raw then clean)
  try {
    const data = await tursoFetch('/api/places?slug=' + encodeURIComponent(raw));
    if (data?.success && data.data) {
      const p = normalizeTursoPlace(data.data);
      if (p) {
        idbPut(STORES.PLACES, p).catch(() => {});
        return p;
      }
    }
  } catch (_) {}

  if (clean !== raw) {
    try {
      const dataClean = await tursoFetch('/api/places?slug=' + encodeURIComponent(clean));
      if (dataClean?.success && dataClean.data) {
        const p = normalizeTursoPlace(dataClean.data);
        if (p) {
          idbPut(STORES.PLACES, p).catch(() => {});
          return p;
        }
      }
    } catch (_) {}
  }

  // 2. Fallback: try by ID in Turso Worker
  try {
    const dataId = await tursoFetch('/api/places?id=' + encodeURIComponent(raw));
    if (dataId?.success && dataId.data) {
      const p = normalizeTursoPlace(dataId.data);
      if (p) {
        idbPut(STORES.PLACES, p).catch(() => {});
        return p;
      }
    }
  } catch (_) {}

  // 3. Multi-tier resilient fallback: search published places list
  try {
    const all = await getPublishedPlaces({ limit: 1000 });
    return (all || []).find(p => 
      String(p?.slug || '').toLowerCase() === clean || 
      String(p?.id || '').toLowerCase() === clean ||
      String(p?.slug || '') === raw ||
      String(p?.id || '') === raw
    ) || null;
  } catch (_) {
    return null;
  }
}

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

  await syncPlaceToWorkerTurso(placeId, updates);
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

  await syncPlaceToWorkerTurso(placeId, updates);
  clearDbCache();
  return updates;
}

/**
 * IP & User Ban System
 */
export function sanitizeIpKey(ip) {
  if (!ip) return '';
  return String(ip).trim().replace(/[.:%[\]#$]/g, '_');
}

/** Check if an IP address is banned */
export async function isIpBanned(ip) {
  if (!ip) return false;
  try {
    const data = await tursoFetch('/api/ip-bans?ip=' + encodeURIComponent(String(ip).trim()));
    return data?.data || false;
  } catch (_) {
    return false;
  }
}

/** Admin: Ban an IP address */
export async function adminBanIp(ip, { reason = '', durationDays = 30, isPermanent = false, bannedBy = 'admin', userId = null, userName = '' } = {}) {
  if (!ip) throw new Error('عنوان IP مطلوب للحظر');
  const days = Number(durationDays);
  if (!isPermanent && (!Number.isFinite(days) || days < 1 || days > 3650)) throw new Error('مدة حظر IP غير صالحة');
  const res = await tursoFetch('/api/ip-bans', {
    method: 'POST',
    body: JSON.stringify({ ip:String(ip).trim(), reason, durationDays:days, isPermanent:Boolean(isPermanent), bannedBy, userId, userName })
  });
  return res?.data || res;
}

/** Admin: Unban an IP address */
export async function adminUnbanIp(ipOrKey) {
  if (!ipOrKey) throw new Error('معرف IP مطلوب');
  return tursoFetch('/api/ip-bans?ip=' + encodeURIComponent(String(ipOrKey).trim()), { method:'DELETE' });
}

/** Admin: Get all banned IPs */
export async function getAllBannedIps() {
  try {
    const data = await tursoFetch('/api/ip-bans');
    return Array.isArray(data?.data) ? data.data : [];
  } catch (_) {
    return [];
  }
}

/**
 * Get all published places with IndexedDB Cache-First & Background Sync Engine
 * 1. Checks memory & IndexedDB first for instant 0ms response
 * 2. Checks system/dataVersion or lastSync to avoid redundant Firebase reads
 * 3. Falls back to RTDB query only when necessary
 */
export function normalizeTursoPlace(p) {
  if (!p) return null;
  const id = String(p.id || p._key || p._id || '');
  return {
    ...p,
    id,
    _key: id,
    slug: p.slug || id,
    name: p.name || 'بدون اسم',
    categoryId: p.categoryId || p.category_id || '',
    customCategory: p.customCategory || p.custom_category || '',
    categoryName: p.categoryName || p.category_name || p.customCategory || p.custom_category || '',
    logoUrl: p.logoUrl || p.logo_url || null,
    coverImageUrl: p.coverImageUrl || p.cover_image_url || null,
    isVerified: Boolean(p.isVerified || p.is_verified || p.verified),
    verified: Boolean(p.isVerified || p.is_verified || p.verified),
    isSponsored: Boolean(p.isSponsored || p.is_sponsored || p.isFeatured || p.is_featured),
    isFeatured: Boolean(p.isFeatured || p.is_featured),
    sponsoredUntil: p.sponsoredUntil || p.sponsored_until || null,
    createdAt: Number(p.createdAt || p.created_at || 0),
    updatedAt: Number(p.updatedAt || p.updated_at || 0),
    ownerId: p.ownerId || p.owner_id || '',
    ownerEmail: p.ownerEmail || p.owner_email || p.owner_email_d1 || '',
    ownerName: p.ownerName || p.owner_name || p.ownerEmail || p.owner_email || p.owner_email_d1 || '',
    mapsLink: p.mapsLink || p.maps_link || '',
    workingHours: p.workingHours || p.working_hours || {},
    services: Array.isArray(p.services) ? p.services : (typeof p.services_json === 'string' ? JSON.parse(p.services_json || '[]') : []),
    social: typeof p.social === 'object' ? p.social : (typeof p.social_json === 'string' ? JSON.parse(p.social_json || '{}') : {}),
    atmPoll: typeof p.atmPoll === 'object' ? p.atmPoll : (typeof p.atm_poll_json === 'string' ? (()=>{try{return JSON.parse(p.atm_poll_json||'{}')}catch(_){return {}}})() : {}),
    reviewCount: Number(p.reviewCount != null ? p.reviewCount : (p.review_count != null ? p.review_count : 0)),
    review_count: Number(p.reviewCount != null ? p.reviewCount : (p.review_count != null ? p.review_count : 0)),
    rating: Number(p.rating != null ? p.rating : 0.0),
    trustScore: (p.trustScore != null ? Number(p.trustScore) : (p.trust_score != null ? Number(p.trust_score) : undefined)),
    trust_score: (p.trust_score != null ? Number(p.trust_score) : (p.trustScore != null ? Number(p.trustScore) : undefined))
  };
}

export async function getPublishedPlaces({ limit = 100, lastKey = null, forceFresh = false } = {}) {
  const cacheKey = `published_${limit}_${lastKey || ''}`;

  if (!forceFresh) {
    // 1. Instant In-Memory / LocalStorage Cache (0ms instant UI)
    const memCached = getCached(cacheKey);
    if (Array.isArray(memCached) && memCached.length > 0) {
      _syncPublishedPlaces(limit, cacheKey).catch(() => {});
      return memCached;
    }

    // 2. Instant IndexedDB Cache (1ms - 5ms)
    try {
      const localPlaces = await idbGetAll(STORES.PLACES);
      if (Array.isArray(localPlaces) && localPlaces.length > 0) {
        const valid = localPlaces.filter(p => p && p.status !== 'draft' && p.status !== 'rejected' && !isPlaceBanned(p));
        if (valid.length > 0) {
          valid.sort((a, b) => {
            const aSpons = Boolean(a.isSponsored && (!a.sponsoredUntil || a.sponsoredUntil > Date.now()));
            const bSpons = Boolean(b.isSponsored && (!b.sponsoredUntil || b.sponsoredUntil > Date.now()));
            if (aSpons && !bSpons) return -1;
            if (!aSpons && bSpons) return 1;
            return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
          });
          const res = valid.slice(0, limit);
          setCache(cacheKey, res);
          _syncPublishedPlaces(limit, cacheKey).catch(() => {});
          return res;
        }
      }
    } catch (_) {}
  }

  // 3. Fallback or cold-start: Fetch directly from authoritative Turso Worker
  const fresh = await _syncPublishedPlaces(limit, cacheKey);
  if (Array.isArray(fresh) && fresh.length > 0) {
    return fresh;
  }

  // 4. Last resort: check IDB again if network failed
  try {
    const localPlaces = await idbGetAll(STORES.PLACES);
    if (localPlaces && localPlaces.length > 0) {
      const filtered = localPlaces.filter(p => p && p.status !== 'draft' && p.status !== 'rejected' && !isPlaceBanned(p));
      const res = filtered.slice(0, limit);
      return setCache(cacheKey, res);
    }
  } catch (_) {}

  return [];
}

async function _syncPublishedPlaces(limit = 100, cacheKey = '') {
  try {
    const workerRes = await fetch(`${WORKER_URL}/api/places?limit=${limit}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (workerRes.ok) {
      const data = await workerRes.json();
      if (data && data.success && Array.isArray(data.data)) {
        const places = [];
        const allForIdb = [];

        data.data.forEach(item => {
          const p = normalizeTursoPlace(item);
          if (!p) return;
          allForIdb.push(p);

          if (p.status !== 'draft' && p.status !== 'rejected' && !isPlaceBanned(p)) {
            places.push(p);
          }
        });

        if (allForIdb.length > 0) {
          idbPutBulk(STORES.PLACES, allForIdb).catch(() => {});
          idbSetMeta('lastPlacesSync', Date.now()).catch(() => {});
        }

        places.sort((a, b) => {
          const aSpons = Boolean(a.isSponsored && (!a.sponsoredUntil || a.sponsoredUntil > Date.now()));
          const bSpons = Boolean(b.isSponsored && (!b.sponsoredUntil || b.sponsoredUntil > Date.now()));
          if (aSpons && !bSpons) return -1;
          if (!aSpons && bSpons) return 1;
          return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
        });

        const res = places.slice(0, limit);
        if (cacheKey) setCache(cacheKey, res);
        return res;
      }
    }
  } catch (workerErr) {
    console.debug('[_syncPublishedPlaces] Handled network notice:', workerErr?.message);
  }
  return null;
}

let _isSyncingPlaces = false;
async function _triggerBackgroundSyncPlaces() {
  if (_isSyncingPlaces) return;
  const lastSync = await idbGetMeta('lastPlacesSync', 0);
  if (Date.now() - lastSync < 21600000) return;

  _isSyncingPlaces = true;
  try {
    const res = await fetch(`${WORKER_URL}/api/places?limit=250`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        const places = data.data.map(normalizeTursoPlace).filter(Boolean);
        await idbPutBulk(STORES.PLACES, places);
        await idbSetMeta('lastPlacesSync', Date.now());
        clearDbCache('published_');
      }
    }
  } catch (_) {} finally {
    _isSyncingPlaces = false;
  }
}

/** Get places by category (excluding banned) - Reads from Turso / IndexedDB */
export async function getPlacesByCategory(categoryId, limit = 20) {
  const cacheKey = `places_cat_${categoryId}_${limit}`;
  const cached = getCached(cacheKey, 600000);
  if (cached) return cached;

  try {
    const all = await getPublishedPlaces({ limit: 500 });
    const places = (all || []).filter(p => {
      if (!p || isPlaceBanned(p)) return false;
      const cId = p.categoryId || p.category_id || p.category;
      return cId === categoryId || String(cId).toLowerCase() === String(categoryId).toLowerCase();
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

/** Get places by owner (newest added first) - Reads from Turso / IndexedDB */
export async function getPlacesByOwner(userOrUid) {
  if (!userOrUid) return [];
  const uid = typeof userOrUid === 'object' ? userOrUid.uid : userOrUid;
  const email = typeof userOrUid === 'object' ? (userOrUid.email || '') : '';

  if (!uid && !email) return [];
  const cacheKey = `places_owner_${uid || email}`;

  try {
    let url = `${WORKER_URL}/api/places?owner_id=${encodeURIComponent(uid || '')}`;
    if (email) url += `&owner_email=${encodeURIComponent(email)}`;

    const workerRes = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    });
    if (workerRes.ok) {
      const data = await workerRes.json();
      if (data && data.success && Array.isArray(data.data)) {
        const places = data.data.map(normalizeTursoPlace).filter(Boolean);
        places.sort((a, b) => {
          const timeA = Number(a.createdAt) || Number(a.updatedAt) || 0;
          const timeB = Number(b.createdAt) || Number(b.updatedAt) || 0;
          if (timeA && timeB && timeA !== timeB) return timeB - timeA;
          return String(b.id || '').localeCompare(String(a.id || ''));
        });
        return setCache(cacheKey, places);
      }
    }
  } catch (workerErr) {
    console.debug('[getPlacesByOwner] Worker Turso query error, falling back to local list:', workerErr.message);
  }

  try {
    const all = await getPublishedPlaces({ limit: 1000 });
    const places = (all || []).filter(p => {
      if (!p) return false;
      const owner = p.ownerId || p.owner_id || p.owner;
      return owner === uid;
    });

    places.sort((a, b) => {
      const timeA = Number(a.createdAt) || Number(a.updatedAt) || 0;
      const timeB = Number(b.createdAt) || Number(b.updatedAt) || 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      return String(b._key || b.id || '').localeCompare(String(a._key || a.id || ''));
    });

    return setCache(cacheKey, places);
  } catch (err) {
    console.warn('[getPlacesByOwner] Handled error:', err);
    return [];
  }
}

/** Save or Update Category in Turso + Local IndexedDB */
export async function saveCategoryTurso(category) {
  if(!category||(!category.name&&!category.slug&&!category.id))throw new Error('بيانات التصنيف غير مكتملة');
  const slug=String(category.slug||category.id||category._key||'').trim().toLowerCase().replace(/\s+/g,'-');
  const payload={...category,id:category.id||slug,_key:category.id||slug,slug,nameEn:category.nameEn||category.name_en||slug,icon:category.icon||'📁',order:Number(category.order??category.sort_order??0)};
  const data=await tursoFetch('/api/categories',{method:'POST',body:JSON.stringify(payload)});
  clearDbCache('categories');clearDbCache('categories_all');return data?.data||payload;
}

export async function deleteCategoryTurso(categoryId) {
  if(!categoryId)throw new Error('Category ID required');
  const data=await tursoFetch('/api/categories/'+encodeURIComponent(categoryId),{method:'DELETE'});
  clearDbCache('categories');clearDbCache('categories_all');return data;
}

export async function getCategories() {
  const cached = getCached('categories_all', 1800000);
  if (Array.isArray(cached) && cached.length) return cached;

  // 1. Instant IDB Cache (0ms)
  try {
    const local = await idbGetAll(STORES.CATEGORIES);
    if (Array.isArray(local) && local.length > 0) {
      setCache('categories_all', local);
      _syncCategoriesInBackground().catch(() => {});
      return local;
    }
  } catch (_) {}

  // 2. Network Fetch if cold start
  try {
    const data = await tursoFetch('/api/categories');
    const categories = (Array.isArray(data?.data) ? data.data : []).map(c => ({
      id: c.id || c.slug, _key: c.id || c.slug, slug: c.slug || c.id, name: c.name || '',
      nameEn: c.name_en || c.nameEn || '', icon: c.icon || '🏪', description: c.description || '',
      color: c.color || '#1B4F72', order: Number(c.order ?? c.sort_order ?? 0),
      placeCount: Number(c.place_count ?? c.placeCount ?? 0)
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (categories.length) {
      idbPutBulk(STORES.CATEGORIES, categories).catch(() => {});
      return setCache('categories_all', categories);
    }
  } catch (err) {
    console.warn('[getCategories] Worker error:', err?.message || err);
  }
  return [];
}

async function _syncCategoriesInBackground() {
  try {
    const data = await tursoFetch('/api/categories');
    if (Array.isArray(data?.data) && data.data.length > 0) {
      const categories = data.data.map(c => ({
        id: c.id || c.slug, _key: c.id || c.slug, slug: c.slug || c.id, name: c.name || '',
        nameEn: c.name_en || c.nameEn || '', icon: c.icon || '🏪', description: c.description || '',
        color: c.color || '#1B4F72', order: Number(c.order ?? c.sort_order ?? 0),
        placeCount: Number(c.place_count ?? c.placeCount ?? 0)
      })).sort((a, b) => (a.order || 0) - (b.order || 0));
      if (categories.length) {
        idbPutBulk(STORES.CATEGORIES, categories).catch(() => {});
        setCache('categories_all', categories);
      }
    }
  } catch (_) {}
}

export async function getCategory(slug) {
  if (!slug) return null;
  const categories = await getCategories();
  return categories.find(c => c.slug === slug || c._key === slug) || null;
}

/** Get active offers (not expired) */
export async function getActiveOffers(limit=20) {
  const key='offers_active_'+limit,cached=getCached(key,300000);
  if(Array.isArray(cached))return cached;
  try{const data=await tursoFetch('/api/offers');const now=Date.now();
    const list=(Array.isArray(data?.data)?data.data:[]).filter(o=>!o.endDate||Number(o.endDate)>now).slice(0,Math.max(0,Number(limit)||20));
    return setCache(key,list);
  }catch(_){return [];}
}

export async function getPlaceOffers(placeId) {
  if(!placeId)return [];
  try{const data=await tursoFetch('/api/offers?place_id='+encodeURIComponent(placeId));return Array.isArray(data?.data)?data.data:[];}catch(_){return [];}
}

export async function getPlaceProducts(placeId,{limit=50,includePending=false}={}) {
  if(!placeId)return [];
  try{const data=await tursoFetch('/api/products?place_id='+encodeURIComponent(placeId));let list=Array.isArray(data?.data)?data.data:[];
    if(!includePending)list=list.filter(p=>p.isApproved!==false&&p.is_approved!==0);
    return list.slice(0,Number(limit)||50);
  }catch(_){return [];}
}

export async function getAllProducts() {
  try{const data=await tursoFetch('/api/products');return Array.isArray(data?.data)?data.data:[];}catch(_){return [];}
}

export async function adminApproveProduct(placeId,productId) {
  if(!productId)throw new Error('بيانات المنتج والمكان مطلوبة');
  const data=await tursoFetch('/api/products/'+encodeURIComponent(productId),{method:'PUT',body:JSON.stringify({status:'approved',isApproved:true,is_approved:1})});return data?.data||data;
}

export async function adminRejectProduct(placeId,productId,rejectionReason='') {
  if(!productId)throw new Error('بيانات المنتج والمكان مطلوبة');
  const reason=String(rejectionReason||'').trim();
  if(!reason) throw new Error('سبب رفض المنتج مطلوب');
  const data=await tursoFetch('/api/products/'+encodeURIComponent(productId),{
    method:'PUT',
    body:JSON.stringify({status:'rejected',isApproved:false,is_approved:0,rejectionReason:reason})
  });
  return data?.data||data;
}

export async function adminDeleteProduct(placeId,productId) {
  if(!productId)throw new Error('بيانات المنتج والمكان مطلوبة');
  return tursoFetch('/api/products/'+encodeURIComponent(productId),{method:'DELETE'});
}

export async function getAds(placement = 'homepage') {
  const key = 'ads_' + (placement || 'all');
  const cached = getCached(key, 300000);
  if (Array.isArray(cached) && cached.length) return cached;
  try {
    const data = await tursoFetch('/api/ads');
    const list = Array.isArray(data?.data) ? data.data : [];
    const filtered = list.filter(a => !placement || a.placement === placement || a.placement === 'all');
    return setCache(key, filtered);
  } catch (_) {
    return [];
  }
}

export async function getSettings({forceFresh=false}={}) {
  const cached=!forceFresh && getCached('site_settings',600000);if(cached)return cached;
  try{const data=await tursoFetch('/api/settings');if(data?.success&&data.data)return setCache('site_settings',data.data);}catch(_){}
  return setCache('site_settings',{siteName:'دليل المنزلة والمطرية الرقمي',contact:{whatsapp:'01000000000'}});
}

export async function updateSettings(settings) {
  const data = await tursoFetch('/api/settings', {
    method:'POST',
    body:JSON.stringify(settings || {})
  });
  if(!data?.success) throw new Error(data?.error || 'تعذر حفظ الإعدادات');
  setCache('site_settings', data.data || settings);
  return data.data || settings;
}

/**
 * Get visitor IP, geographic location, and ISP details
 */
async function getVisitorClientInfo() {
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const d = await res.json();
      if (d && d.success !== false) {
        const city = d.city || '';
        const region = d.region || '';
        const country = d.country || '';
        const parts = [city, region, country].filter(Boolean);
        return {
          ip: d.ip || '',
          city: city,
          region: region,
          country: country,
          latitude: d.latitude || null,
          longitude: d.longitude || null,
          isp: d.connection?.isp || d.connection?.org || '',
          location: parts.join('، ') || 'مصر',
          mapsUrl: (d.latitude && d.longitude) ? `https://www.google.com/maps?q=${d.latitude},${d.longitude}` : ''
        };
      }
    }
  } catch (_) {}

  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const d = await res.json();
      return {
        ip: d.ip || '',
        location: 'مصر',
        city: '',
        region: '',
        country: 'مصر'
      };
    }
  } catch (_) {}

  return null;
}

function getVisitorDeviceSummary() {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent || '';
  let os = 'كمبيوتر';
  if (/Android/i.test(ua)) os = 'هاتف أندرويد';
  else if (/iPhone/i.test(ua)) os = 'آيفون';
  else if (/iPad/i.test(ua)) os = 'آيباد';
  else if (/Windows/i.test(ua)) os = 'ويندوز PC';
  else if (/Macintosh/i.test(ua)) os = 'ماك Mac';
  else if (/Linux/i.test(ua)) os = 'لينكس';

  let browser = '';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return browser ? `${os} (${browser})` : os;
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

    // Capture visitor client details (IP, city, governorate, device)
    let clientInfo = null;
    let deviceSummary = '';
    try {
      deviceSummary = getVisitorDeviceSummary();
      clientInfo = await getVisitorClientInfo();
    } catch (_) {}

    const notification = {
      type: 'profile_view',
      placeId: placeId,
      placeName: place.name || 'المكان',
      visitorUid: visitor?.uid || null,
      visitorName: visitor ? (visitor.displayName || visitor.name || visitor.email || 'مستخدم مسجل') : 'زائر (غير مسجل)',
      visitorPhoto: visitor?.photoURL || '',
      isGuest: !visitor,
      ip: clientInfo?.ip || '',
      location: clientInfo?.location || '',
      city: clientInfo?.city || '',
      region: clientInfo?.region || '',
      country: clientInfo?.country || '',
      isp: clientInfo?.isp || '',
      mapsUrl: clientInfo?.mapsUrl || '',
      device: deviceSummary || '',
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
    // Un-dismiss if previously marked deleted so fresh broadcasts always show
    ['manzala_user_dismissed_notifs'].forEach(k => {
      const raw = localStorage.getItem(k);
      if (raw) {
        const list = JSON.parse(raw).filter(id => id !== notification.id);
        localStorage.setItem(k, JSON.stringify(list));
      }
    });

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

  // Firebase RTDB broadcast path removed; FCM is handled by notification.service.js.
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

  // Firebase RTDB broadcast path removed; FCM is handled by notification.service.js.
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
  const allowed = ['phoneClicks', 'whatsappClicks', 'directionsClicks', 'productViews', 'offerViews', 'views'];
  if (!allowed.includes(stat) || !placeId) return;

  // 1. Primary: Turso via Worker
  try {
    fetch(`${WORKER_URL}/api/places/track-stat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId, stat }),
      signal: AbortSignal.timeout(3000)
    }).catch(() => {});
  } catch (_) {}

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
export async function getPlaceReviews(placeId, slug = '') {
  if (!placeId && !slug) return [];
  const targetId = placeId || slug;
  try {
    const querySlug = slug && slug !== targetId ? `&slug=${encodeURIComponent(slug)}` : '';
    const res = await fetch(`${WORKER_URL}/api/reviews?place_id=${encodeURIComponent(targetId)}${querySlug}&limit=5000`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`Reviews Worker HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data.data) ? data.data.map(r => normalizeReviewFromTurso(r, targetId)).filter(Boolean) : [];
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.warn('[getPlaceReviews] Turso error:', err?.message || err);
    return [];
  }
}

/** Get all reviews across all places (for Admin) - Primary Turso */
export async function getAllReviews() {
  try {
    const data = await tursoFetch('/api/reviews');
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map(r => ({
          id: r.id,
          placeId: r.place_id,
          placeName: r.place_name || 'المكان',
          placeSlug: r.place_slug || '',
          userId: r.user_id,
          userName: r.user_name || 'مستخدم',
          userPhoto: r.user_photo || '',
          rating: Number(r.rating) || 5,
          comment: r.comment || '',
          likes: Number(r.likes) || 0,
          isAdminGenerated: Boolean(r.is_admin_generated),
          editCount: Number(r.edit_count) || 0,
          isReported: Boolean(r.is_reported),
          reportCount: Number(r.report_count) || 0,
          lastReportReason: r.last_report_reason || '',
          reportedAt: Number(r.reported_at) || 0,
          lastReporterName: r.last_reporter_name || '',
          isReviewedByAdmin: Boolean(r.is_reviewed_by_admin),
          adminReviewStatus: r.admin_review_status || '',
          adminReviewNote: r.admin_review_note || '',
          reviewedAt: Number(r.reviewed_at) || 0,
          createdAt: Number(r.created_at) || Date.now(),
          updatedAt: Number(r.updated_at) || Date.now()
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  } catch (err) {
    console.debug('[getAllReviews] Worker fetch handled, fallback to cache:', err.message);
  }


  const all = [];
  try {
    const places = (await getPublishedPlaces({ limit: 1000 })) || [];
    for (const placeData of places) {
      if (placeData && placeData.reviews && typeof placeData.reviews === 'object') {
        for (const [reviewId, r] of Object.entries(placeData.reviews)) {
          all.push({
            id: reviewId,
            placeId: placeData.id,
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
    // Keep review creation self-contained: do not call an optional helper that may be absent from a cached bundle.
    userPoints: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    editCount: 0
  };

  // Single authoritative write: Frontend → Worker → Turso.
  // Do not silently ignore a Turso failure; the user only sees "published"
  // after the review has actually been persisted.
  await dbSet(`places/${placeId}/reviews/${reviewId}`, {
    ...reviewData,
    place_id: placeId,
    place_name: placeName || 'المكان',
    place_slug: placeSlug || ''
  });

  // Review persistence is intentionally isolated from notifications.
  // The review is considered successful as soon as Turso confirms the write.
  // Notifications are handled by separate server-side flows and must never
  // participate in the user's submit transaction.

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
  await tursoWriteBusiness(`places/${placeId}/reviews/${reviewId}`, 'DELETE');
  await recalculatePlaceRating(placeId);
}

/** Admin: Bulk delete reviews (with automatic place rating recalculation) */
export async function adminBulkDeleteReviews(reviewsList = []) {
  if (!reviewsList.length) return { deletedCount: 0 };
  let deletedCount = 0;
  const affectedPlaces = new Set();

  for (const r of reviewsList) {
    const placeId = r?.placeId;
    const reviewId = r?.id || r?.reviewId;
    if (!placeId || !reviewId) continue;
    try {
      await tursoWriteBusiness(`places/${placeId}/reviews/${reviewId}`, 'DELETE');
      deletedCount++;
      affectedPlaces.add(placeId);
    } catch (err) {
      console.warn('[adminBulkDeleteReviews] delete failed:', reviewId, err?.message || err);
    }
  }

  for (const placeId of affectedPlaces) {
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
export async function adminBulkAddReviews(placeId, items = [], onProgress = null) {
  if (!placeId || !items.length) {
    throw new Error('بيانات المكان أو التقييمات فارغة');
  }
  if (items.length > 5000) throw new Error('الحد الأقصى للإضافة الجماعية هو 5000 تقييم في العملية الواحدة');

  const place = await dbGet(`places/${placeId}`);
  if (!place) throw new Error('المكان غير موجود في قاعدة البيانات');

  const existingReviews = await getPlaceReviews(placeId, place.slug);
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

    // If name already exists for this place, naturally diversify with a patronymic variation
    // so the admin always gets the EXACT count requested without arbitrary drops
    let finalName = cleanName;
    if (existingNames.has(normName)) {
      const suffixes = ['محمد', 'أحمد', 'محمود', 'علي', 'حسن', 'السيد', 'إبراهيم', 'عادل', 'سامح', 'خالد'];
      const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      finalName = `${cleanName} ${randomSuffix}`;
    }

    existingNames.add(finalName.toLowerCase());
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
      userName: finalName,
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
    const reviewsArray = Object.values(updates).map(reviewData => ({
      id: reviewData.id,
      place_id: placeId,
      place_name: reviewData.placeName || place.name || '',
      place_slug: reviewData.placeSlug || place.slug || '',
      user_id: reviewData.userId,
      user_name: reviewData.userName,
      user_photo: reviewData.userPhoto || '',
      rating: reviewData.rating,
      comment: reviewData.comment,
      is_admin_generated: 1,
      edit_count: 0,
      created_at: reviewData.createdAt,
      updated_at: reviewData.updatedAt
    }));

    // Send in chunks of 100 to Worker batch API for faster 5,000 imports
    const totalChunks = Math.ceil(reviewsArray.length / 100);
    for (let i = 0; i < reviewsArray.length; i += 100) {
      const chunk = reviewsArray.slice(i, i + 100);
      const chunkIdx = Math.floor(i / 100) + 1;
      if (typeof onProgress === 'function') {
        try { onProgress(chunkIdx, totalChunks, chunk.length); } catch (_) {}
      }
      try {
        const result = await tursoFetch('/api/reviews', {
          method: 'POST',
          body: JSON.stringify({ reviews: chunk })
        });
        const persisted = Number(result?.insertedCount ?? chunk.length);
        if (persisted !== chunk.length) throw new Error(`تم حفظ ${persisted} من ${chunk.length} فقط في الدفعة ${chunkIdx}`);
      } catch (err) {
        throw new Error(`فشل حفظ الدفعة ${chunkIdx}/${totalChunks}: ${err?.message || err}`);
      }
    }
    const newStats = await recalculatePlaceRating(placeId);
    await invalidateLocalPlaceCache(placeId, place?.slug);
    if (newStats) {
      clearDbCache();
    }
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
export function generateSyntheticReviews({ count = 50, starRange = '4-5', specialty = '', placeName = '', categoryName = '', gender = 'mixed' }) {
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

  const MIDDLE_NAMES_AR = [
    'محمد', 'أحمد', 'محمود', 'علي', 'حسن', 'إبراهيم', 'مصطفى', 'عبد الله', 'السيد', 'عمر',
    'طارق', 'حسام', 'عادل', 'سامح', 'خالد', 'كمال', 'نبيل', 'صلاح', 'ماهر', 'مجدي'
  ];

  const usedNames = new Set();
  const results = [];
  let safetyLoop = 0;

  while (results.length < targetCount && safetyLoop < targetCount * 25) {
    safetyLoop++;
    let name = '';
    const typeRoll = Math.random();
    const useMiddle = Math.random() < 0.65; // 65% triple names for massive natural Egyptian uniqueness

    if (gender === 'male') {
      // Male only: Arabic male or English male names
      if (typeRoll < 0.85) {
        name = useMiddle
          ? `${pick(FIRST_NAMES_AR_M)} ${pick(MIDDLE_NAMES_AR)} ${pick(LAST_NAMES_AR)}`
          : `${pick(FIRST_NAMES_AR_M)} ${pick(LAST_NAMES_AR)}`;
      } else {
        const enFirst = pick(FIRST_NAMES_EN.filter(n => !['Sarah','Mariam','Nourhan','Dina','Aya','Rania','Mona','Reem','Hadeer','Salma','Farida','Nada','Nour'].includes(n)));
        name = useMiddle ? `${enFirst} M. ${pick(LAST_NAMES_EN)}` : `${enFirst} ${pick(LAST_NAMES_EN)}`;
      }
    } else if (gender === 'female') {
      // Female only: Arabic female or English female names
      const FIRST_NAMES_EN_F = ['Sara','Mariam','Nourhan','Dina','Aya','Rania','Mona','Reem','Hadeer','Salma','Farida','Nada','Nour','Yasmine','Hana','Laila','Rana'];
      if (typeRoll < 0.85) {
        name = useMiddle
          ? `${pick(FIRST_NAMES_AR_F)} ${pick(MIDDLE_NAMES_AR)} ${pick(LAST_NAMES_AR)}`
          : `${pick(FIRST_NAMES_AR_F)} ${pick(LAST_NAMES_AR)}`;
      } else {
        const enFirst = pick(FIRST_NAMES_EN_F);
        name = useMiddle ? `${enFirst} A. ${pick(LAST_NAMES_EN)}` : `${enFirst} ${pick(LAST_NAMES_EN)}`;
      }
    } else {
      // Mixed (default): male 50%, female 30%, English 20%
      if (typeRoll < 0.5) {
        name = useMiddle
          ? `${pick(FIRST_NAMES_AR_M)} ${pick(MIDDLE_NAMES_AR)} ${pick(LAST_NAMES_AR)}`
          : `${pick(FIRST_NAMES_AR_M)} ${pick(LAST_NAMES_AR)}`;
      } else if (typeRoll < 0.8) {
        name = useMiddle
          ? `${pick(FIRST_NAMES_AR_F)} ${pick(MIDDLE_NAMES_AR)} ${pick(LAST_NAMES_AR)}`
          : `${pick(FIRST_NAMES_AR_F)} ${pick(LAST_NAMES_AR)}`;
      } else {
        name = `${pick(FIRST_NAMES_EN)} ${pick(LAST_NAMES_EN)}`;
      }
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
  let cancelled=false;
  const check=async()=>{ try {
    const data=await tursoFetch('/api/users?id='+encodeURIComponent(ownerId));
    const u=Array.isArray(data?.data)?data.data[0]:data?.data;
    if(!cancelled) callback({isOnline:u?.status==='active',lastSeen:Number(u?.updated_at||u?.updatedAt||0)});
  } catch(_) { if(!cancelled) callback({isOnline:false,lastSeen:0}); } };
  check();
  return ()=>{cancelled=true;};
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




export async function updateCategoryRequestTurso(reqId, status = 'approved') {
  if (!reqId) throw new Error('Request ID required');
  return tursoFetch('/api/category-requests/' + encodeURIComponent(reqId), {
    method: 'PATCH',
    body: JSON.stringify({ id: reqId, status })
  });
}
