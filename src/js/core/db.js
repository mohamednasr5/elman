import { getDB, getAuth, WORKER_URL } from './firebase.js';
import { idbGetAll, idbPutBulk, idbPut, idbGet, idbDelete, idbClear, idbGetMeta, idbSetMeta, STORES } from '../services/idb-cache.service.js';

export { getDB };
export { idbGetAll, idbPutBulk, idbPut, idbGet, idbDelete, idbClear, idbGetMeta, idbSetMeta, STORES };

const _dbMemoryCache = new Map();

function getCached(key, maxAgeMs = 600000) {
  const mem = _dbMemoryCache.get(key);
  if (mem && Date.now() - mem.ts < maxAgeMs) return mem.data;
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('__db_' + key);
      if (stored) {
        const item = JSON.parse(stored);
        if (item && Date.now() - item.ts < maxAgeMs * 3) {
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
  try { if (typeof localStorage !== 'undefined') localStorage.setItem('__db_' + key, JSON.stringify(item)); } catch (_) {}
  return data;
}

export function clearDbCache(prefix = '') {
  if (!prefix) {
    _dbMemoryCache.clear();
    try {
      if (typeof localStorage !== 'undefined') Object.keys(localStorage).filter(k => k.startsWith('__db_')).forEach(k => localStorage.removeItem(k));
    } catch (_) {}
    return;
  }
  for (const k of _dbMemoryCache.keys()) if (k.startsWith(prefix)) _dbMemoryCache.delete(k);
  try {
    if (typeof localStorage !== 'undefined') Object.keys(localStorage).filter(k => k.startsWith('__db_' + prefix)).forEach(k => localStorage.removeItem(k));
  } catch (_) {}
}

function isBusinessDataPath(path = '') {
  const p = String(path || '').replace(/^\/+/, '');
  return /^(places|categories|offers|products|ads)(?:\/|$)/i.test(p);
}

function parseBusinessPath(path = '') {
  const p = String(path || '').replace(/^\/+/, '');
  const parts = p.split('/').filter(Boolean);
  return { p, parts, root: parts[0] || '' };
}

async function workerFetch(path, options = {}) {
  const auth = getAuth();
  let token = null;
  try { token = auth?.currentUser ? await auth.currentUser.getIdToken() : null; } catch (_) {}
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: 'Bearer ' + token } : {})
  };
  return fetch(`${WORKER_URL}${path}`, { ...options, headers });
}

async function d1Fetch(path, options = {}) {
  const res = await workerFetch(path, { ...options, signal: options.signal || AbortSignal.timeout(7000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Worker HTTP ${res.status}`);
  return data;
}

function normalizeReviewFromD1(r, placeId = '') {
  if (!r) return null;
  return {
    id:r.id, placeId:r.place_id || placeId, userId:r.user_id, userName:r.user_name || 'مستخدم', userPhoto:r.user_photo || '',
    placeName:r.place_name || '', placeSlug:r.place_slug || '', rating:Number(r.rating) || 5, comment:r.comment || '', likes:Number(r.likes)||0,
    isAdminGenerated:Boolean(r.is_admin_generated), editCount:Number(r.edit_count)||0, isReported:Boolean(r.is_reported),
    reportCount:Number(r.report_count)||0, lastReportReason:r.last_report_reason || '', reportedAt:Number(r.reported_at)||0,
    lastReporterName:r.last_reporter_name || '', isReviewedByAdmin:Boolean(r.is_reviewed_by_admin), adminReviewStatus:r.admin_review_status || '',
    adminReviewNote:r.admin_review_note || '', reviewedAt:Number(r.reviewed_at)||0, createdAt:Number(r.created_at)||Date.now(), updatedAt:Number(r.updated_at)||Date.now()
  };
}

async function d1GetBusiness(path) {
  const { parts, root } = parseBusinessPath(path);
  if (root === 'ads') {
    const data = await d1Fetch('/api/ads'); const list = Array.isArray(data.data) ? data.data : [];
    if (parts.length === 1) return Object.fromEntries(list.map(a => [a.id || a._id, a]));
    return list.find(a => String(a.id || a._id) === String(parts[1])) || null;
  }
  if (root === 'categories') {
    const data = await d1Fetch('/api/categories'); const list = Array.isArray(data.data) ? data.data : [];
    if (parts.length === 1) return Object.fromEntries(list.map(c => [c.id || c.slug, c]));
    return list.find(c => String(c.id || c.slug) === String(parts[1])) || null;
  }
  if (root === 'places') {
    if (parts.length >= 3 && parts[2] === 'reviews') {
      const data = await d1Fetch(`/api/reviews?place_id=${encodeURIComponent(parts[1])}`); const list = Array.isArray(data.data) ? data.data : [];
      if (parts[3]) return list.find(r => String(r.id) === String(parts[3])) || null;
      return Object.fromEntries(list.map(r => [r.id, r]));
    }
    if (parts.length === 1) {
      const data = await d1Fetch('/api/places?limit=1000');
      return Object.fromEntries((Array.isArray(data.data) ? data.data : []).map(x => [x.id, x]));
    }
    const data = await d1Fetch(`/api/places?id=${encodeURIComponent(parts[1])}`); return data.data || null;
  }
  if (root === 'offers') {
    const data = await d1Fetch(parts.length > 1 ? `/api/offers?id=${encodeURIComponent(parts[1])}` : '/api/offers');
    const list = Array.isArray(data.data) ? data.data : [];
    return parts.length === 1 ? Object.fromEntries(list.filter(x => x.id).map(x => [x.id, x])) : (list.find(x => String(x.id) === String(parts[1])) || null);
  }
  if (root === 'products') {
    const placeId = parts[1] || '', productId = parts[2] || '';
    const apiPath = productId ? `/api/products?id=${encodeURIComponent(productId)}` : (placeId ? `/api/products?place_id=${encodeURIComponent(placeId)}` : '/api/products');
    const data = await d1Fetch(apiPath); const list = Array.isArray(data.data) ? data.data : [];
    if (parts.length <= 2) return Object.fromEntries(list.filter(x => x.id).map(x => [x.id, x]));
    return list.find(x => String(x.id) === String(productId)) || null;
  }
  return null;
}

async function d1WriteBusiness(path, method, data = null) {
  const { parts, root } = parseBusinessPath(path);
  if (root === 'ads') {
    if (method === 'POST' || method === 'PUT') return d1Fetch('/api/ads', { method:'POST', body:JSON.stringify({ ...(data || {}), id:parts[1] || data?.id || data?._id }) });
    if (method === 'DELETE' && parts[1]) return d1Fetch(`/api/ads?id=${encodeURIComponent(parts[1])}`, { method:'DELETE' });
    throw new Error(`Unsupported ads write path: ${path}`);
  }
  if (root === 'places') {
    if (parts.length >= 3 && parts[2] === 'reviews') {
      const placeId=parts[1], reviewId=parts[3];
      if (method==='DELETE') return d1Fetch(reviewId ? `/api/reviews?id=${encodeURIComponent(reviewId)}` : `/api/reviews?place_id=${encodeURIComponent(placeId)}`, {method:'DELETE'});
      if (method==='POST') return d1Fetch('/api/reviews',{method:'POST',body:JSON.stringify({...data,place_id:data?.place_id||placeId})});
      if (method==='PUT' && reviewId) return d1Fetch(`/api/reviews?id=${encodeURIComponent(reviewId)}`,{method:'PUT',body:JSON.stringify(data||{})});
    }
    if (parts.length===2 && (method==='POST'||method==='PUT')) return d1Fetch('/api/places/sync',{method:'POST',body:JSON.stringify({id:parts[1],...(data||{})})});
    if (parts.length===2 && method==='DELETE') return d1Fetch(`/api/places/${encodeURIComponent(parts[1])}`,{method:'DELETE'});
    throw new Error(`Unsupported place write path: ${path}`);
  }
  if (root==='offers') {
    if(method==='POST') return d1Fetch('/api/offers',{method:'POST',body:JSON.stringify(data||{})});
    if(method==='PUT'&&parts[1]) return d1Fetch(`/api/offers/${encodeURIComponent(parts[1])}`,{method:'PUT',body:JSON.stringify(data||{})});
    if(method==='DELETE'&&parts[1]) return d1Fetch(`/api/offers/${encodeURIComponent(parts[1])}`,{method:'DELETE'});
  }
  if (root==='products') {
    if(method==='POST') return d1Fetch('/api/products',{method:'POST',body:JSON.stringify({...data,place_id:data?.place_id||data?.placeId||parts[1]})});
    if(method==='PUT'&&parts[2]) return d1Fetch(`/api/products/${encodeURIComponent(parts[2])}`,{method:'PUT',body:JSON.stringify(data||{})});
    if(method==='DELETE'&&parts[2]) return d1Fetch(`/api/products/${encodeURIComponent(parts[2])}`,{method:'DELETE'});
  }
  if(root==='categories'){
    if(method==='POST') return d1Fetch('/api/categories',{method:'POST',body:JSON.stringify(data||{})});
    if(method==='PUT'&&parts[1]) return d1Fetch(`/api/categories/${encodeURIComponent(parts[1])}`,{method:'PUT',body:JSON.stringify(data||{})});
    if(method==='DELETE'&&parts[1]) return d1Fetch(`/api/categories/${encodeURIComponent(parts[1])}`,{method:'DELETE'});
  }
  throw new Error(`No Turso write endpoint configured for ${root}`);
}

export function dbRef(path) {
  if (isBusinessDataPath(path)) throw new Error(`Firebase RTDB access blocked for business data path: ${path}`);
  return getDB().ref(path);
}

export async function dbGet(path, useCache = true) {
  if (useCache) { const cached=getCached('path:'+path); if(cached!==null) return cached; }
  try {
    if(isBusinessDataPath(path)){ const val=await d1GetBusiness(path); if(useCache)setCache('path:'+path,val); return val; }
    const db=getDB(); if(!db || typeof db.ref!=='function') return null;
    const snap=await db.ref(path).once('value'); const val=snap?.exists?.()?snap.val():null; if(useCache)setCache('path:'+path,val); return val;
  } catch(err){ console.warn(`[dbGet] Handled error on path "${path}":`,err?.message||err); return null; }
}

export async function dbSet(path,data){ clearDbCache(); if(isBusinessDataPath(path)){ await d1WriteBusiness(path,'PUT',data); return; } await getDB().ref(path).set(data); }
export async function dbUpdate(path,updates){ clearDbCache(); if(isBusinessDataPath(path)){ await d1WriteBusiness(path,'PUT',updates); return; } await getDB().ref(path).update(updates); }
export async function dbPush(path,data){
  if(isBusinessDataPath(path)){
    const clean=String(path).replace(/^\/+/,''), m=clean.match(/^places\/([^/]+)\/reviews$/i);
    if(m){ const result=await d1WriteBusiness(clean,'POST',{...(data||{}),place_id:data?.place_id||m[1]}); const id=result?.id||data?.id||`review_${Date.now()}`; return {key:id,id}; }
    if(/^offers$/i.test(clean)){ const result=await d1WriteBusiness('offers','POST',data||{}); const id=result?.id||data?.id||`offer_${Date.now()}`; return {key:id,id}; }
    if(/^products\/[^/]+$/i.test(clean)){ const result=await d1WriteBusiness(clean,'POST',data||{}); const id=result?.id||data?.id||`prod_${Date.now()}`; return {key:id,id}; }
    if(/^ads(?:\/|$)/i.test(clean)){ const result=await d1WriteBusiness(clean,'POST',data||{}); const id=result?.id||data?.id||data?._id||`ad_${Date.now()}`; return {key:id,id}; }
    throw new Error(`Turso write path is not supported for business data: ${clean}`);
  }
  const pushed=await getDB().ref(path).push(data); const key=pushed?.key||`legacy_${Date.now()}`; return {key,id:key};
}

export async function dbRemove(path){ clearDbCache(); if(!path)return; if(isBusinessDataPath(path)){ await d1WriteBusiness(path,'DELETE'); return; } await getDB().ref(path).remove(); }

export async function dbIncrement(path,delta=1){
  if(isBusinessDataPath(path)){
    const m=String(path).match(/^places\/([^/]+)\/stats\/([^/]+)$/);
    if(m){ const res=await workerFetch('/api/places/track-stat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({placeId:m[1],stat:m[2],delta:Number(delta)||1}),signal:AbortSignal.timeout(4000)}); if(!res.ok)throw new Error(`Worker stat update failed: ${res.status}`); return; }
    const offer=String(path).match(/^offers\/([^/]+)\/(views|clicks)$/); if(offer){const res=await workerFetch('/api/offers/track-stat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:offer[1],stat:offer[2]}),signal:AbortSignal.timeout(4000)});if(!res.ok)throw new Error(`Offer stat update failed: ${res.status}`);return;}
    const product=String(path).match(/^products\/([^/]+)\/([^/]+)\/(views|clicks)$/); if(product){const res=await workerFetch('/api/products/track-stat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:product[2],stat:product[3]}),signal:AbortSignal.timeout(4000)});if(!res.ok)throw new Error(`Product stat update failed: ${res.status}`);return;}
    throw new Error(`Turso increment path is not supported: ${path}`);
  }
  await getDB().ref(path).transaction(current=>(current||0)+delta);
}

export function dbListen(path,callback){
  if(isBusinessDataPath(path)) throw new Error(`Firebase RTDB listeners blocked for business data path: ${path}`);
  return getDB().ref(path).on('value',callback);
}
export function dbOff(path,eventType='value',callback){ if(isBusinessDataPath(path)) return; return getDB().ref(path).off(eventType,callback); }
export const serverTimestamp=()=>Date.now();

export function getPlaceUrl(slugOrId){
  if(!slugOrId)return '#'; if(typeof slugOrId==='string'&&/^https?:\/\//i.test(slugOrId))return slugOrId;
  const slug=encodeURIComponent(slugOrId); const prefix=typeof window!=='undefined'&&window.location.pathname.includes('/admin/')?'../':'./'; return `${prefix}place.html?slug=${slug}`;
}

export async function getPlace(placeId){
  if(!placeId)return null;
  const cached=await idbGet(STORES.PLACES,placeId).catch(()=>null); if(cached)return cached;
  try{const data=await d1Fetch(`/api/places?id=${encodeURIComponent(placeId)}`);if(data?.success&&data.data){const place=data.data;idbPut(STORES.PLACES,place).catch(()=>{});return place;}}catch(_){ }
  return null;
}

export async function getPublishedPlaces(options={}){
  try{const limit=Math.min(Number(options.limit||1000),1000);const data=await d1Fetch(`/api/places?limit=${limit}`);return Array.isArray(data.data)?data.data:[];}catch(_){return [];}
}

/** Compatibility name retained for callers; implementation is Turso-backed. */
export async function syncPlaceToWorkerD1(placeId,updates={}){
  if(!placeId) return false;
  await d1Fetch('/api/places/sync',{method:'POST',body:JSON.stringify({id:placeId,...updates}),signal:AbortSignal.timeout(10000)});
  return true;
}
export const syncPlaceToWorkerTurso = syncPlaceToWorkerD1;

export async function searchPlacesD1(query='',{category='',area='',limit=20,offset=0,verified=false,minRating=0}={}){
  try{
    const url=new URL(`${WORKER_URL}/api/search`); if(query)url.searchParams.set('q',query); if(category)url.searchParams.set('category',category); if(area)url.searchParams.set('area',area);
    url.searchParams.set('limit',String(limit));url.searchParams.set('offset',String(offset));if(verified)url.searchParams.set('verified','1');if(Number(minRating)>0)url.searchParams.set('min_rating',String(minRating));
    const res=await workerFetch(url.pathname+url.search,{signal:AbortSignal.timeout(6000)});if(!res.ok)return null;const data=await res.json();
    if(data?.success&&Array.isArray(data.data))return {places:data.data,pagination:data.pagination||{limit,offset,returned:data.data.length,hasMore:false}};
  }catch(err){console.warn('[Search] Worker search failed:',err);} return null;
}

export async function reportPlaceData({placeId,reason='معلومة غير صحيحة',details='',reporterName='زائر'}={}){
  const res=await workerFetch('/api/place-reports',{method:'POST',body:JSON.stringify({placeId,reason,details,reporterName}),signal:AbortSignal.timeout(6000)});
  const data=await res.json().catch(()=>({})); if(!res.ok)throw new Error(data?.error||`Worker HTTP ${res.status}`); return data;
}

export async function sendTelegramAdminNotification(type,data={}){ try{await workerFetch('/api/telegram/test',{method:'POST',body:JSON.stringify({type,data}),signal:AbortSignal.timeout(5000)});}catch(_){ } }
export async function broadcastNewPlaceNotification(place){ return place; }

function normalizeUserD1(u = {}) {
  return {
    ...u,
    uid: u.uid || u.id || '',
    id: u.id || u.uid || '',
    photoURL: u.photoURL || u.photo_url || '',
    points: Number(u.points || 0),
    createdAt: Number(u.createdAt || u.created_at || 0),
    updatedAt: Number(u.updatedAt || u.updated_at || 0),
    placesCount: Number(u.placesCount || u.places_count || 0)
  };
}

function normalizeCategoryRequestD1(r = {}) {
  return {
    ...r,
    id: r.id || '',
    categoryName: r.categoryName || r.category_name || '',
    placeName: r.placeName || r.place_name || '',
    ownerName: r.ownerName || r.owner_name || '',
    userId: r.userId || r.user_id || '',
    status: r.status || 'pending',
    requestedAt: Number(r.requestedAt || r.createdAt || r.created_at || 0),
    reviewedAt: Number(r.reviewedAt || r.reviewed_at || 0)
  };
}

function normalizeVerificationRequestD1(r = {}) {
  return {
    ...r,
    id: r.id || '',
    placeId: r.placeId || r.place_id || '',
    placeName: r.placeName || r.place_name || '',
    ownerId: r.ownerId || r.owner_id || '',
    ownerName: r.ownerName || r.owner_name || '',
    ownerEmail: r.ownerEmail || r.owner_email || '',
    verifiedUntil: r.verifiedUntil ?? r.verified_until ?? null,
    requestedAt: Number(r.requestedAt || r.createdAt || r.created_at || 0),
    reviewedAt: Number(r.reviewedAt || r.reviewed_at || 0)
  };
}

export async function getAllUsersD1() {
  const data = await d1Fetch('/api/users');
  const list = Array.isArray(data?.data) ? data.data.map(normalizeUserD1) : [];
  return Object.fromEntries(list.filter(u => u.uid).map(u => [u.uid, u]));
}

export async function updateUserD1(uid, updates = {}) {
  if (!uid) throw new Error('User ID required');
  const data = await d1Fetch(`/api/users/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
  return data?.data ? normalizeUserD1(data.data) : data;
}

export async function getCategoryRequestsD1() {
  const data = await d1Fetch('/api/category-requests');
  const list = Array.isArray(data?.data) ? data.data.map(normalizeCategoryRequestD1) : [];
  return Object.fromEntries(list.filter(r => r.id).map(r => [r.id, r]));
}

export async function updateCategoryRequestD1(reqId, status = 'approved') {
  if (!reqId) throw new Error('Request ID required');
  return d1Fetch(`/api/category-requests/${encodeURIComponent(reqId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ id: reqId, status })
  });
}

export async function getVerificationRequestsD1() {
  const data = await d1Fetch('/api/verification-requests');
  const list = Array.isArray(data?.data) ? data.data.map(normalizeVerificationRequestD1) : [];
  return Object.fromEntries(list.filter(r => r.id).map(r => [r.id, r]));
}

export async function updateVerificationRequestD1(reqId, status = 'approved', verifiedUntil = null) {
  if (!reqId) throw new Error('Request ID required');
  return d1Fetch(`/api/verification-requests/${encodeURIComponent(reqId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ id: reqId, status, verified_until: verifiedUntil })
  });
}
