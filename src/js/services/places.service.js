/**
 * المنزلة وناسها — Places Service
 * Core business logic for Place, Offers and Products management
 */

import { dbGet, dbSet, dbUpdate, dbPush, dbRemove, dbIncrement, sendTelegramAdminNotification, broadcastNewPlaceNotification, clearDbCache, syncPlaceToWorkerTurso, invalidateLocalPlaceCache, getPlace, getPublishedPlaces, idbGetAll, idbGet, idbPut, idbDelete, STORES, tursoFetch, getCached } from '../core/db.js';
import { broadcastRealtimeChange } from './realtime-sync.service.js';
import { generatePlaceSlug, generateCleanSlug } from '../utils/slug.js';
import { normalizeArabic } from '../utils/arabic.js';
import { isAtmPlace } from '../utils/atm.js';
import { WORKER_URL } from '../core/firebase.js';
import { getIdToken } from '../core/auth.js';
import { isValidPhoneNumber, normalizePhoneNumber, isIncompleteMobilePhone } from '../utils/phone.js';
import { awardPoints } from './loyalty.service.js';

export function extractBrandRoot(name) {
  if (!name) return '';
  let str = String(name).trim();
  str = str.split(/\s*[\/\-–—|]\s*/)[0];
  str = str.replace(/\s*\([^)]*\)/g, '');
  str = str.split(/\s+فرع\s+/)[0];
  str = str.split(/\s+بجوار\s+/)[0];
  str = str.split(/\s+امام\s+/)[0];
  str = str.split(/\s+أمام\s+/)[0];
  return normalizeArabic(str).trim();
}

export function isSameBusinessOrBranch(p1, p2) {
  if (!p1 || !p2) return false;
  const id1 = p1.id || p1._key || p1.placeId;
  const id2 = p2.id || p2._key || p2.placeId;
  if (id1 && id2 && String(id1) === String(id2)) return true;
  if (p1.slug && p2.slug && p1.slug === p2.slug) return true;
  const parent1 = p1.parent_id || p1.parentId;
  const parent2 = p2.parent_id || p2.parentId;
  if (parent1 && id2 && String(parent1) === String(id2)) return true;
  if (parent2 && id1 && String(parent2) === String(id1)) return true;
  if (parent1 && parent2 && String(parent1) === String(parent2)) return true;
  const owner1 = p1.ownerId || p1.owner_id;
  const owner2 = p2.ownerId || p2.owner_id;
  if (owner1 && owner2 && String(owner1) === String(owner2)) return true;
  const email1 = (p1.ownerEmail || p1.owner_email || '').toLowerCase().trim();
  const email2 = (p2.ownerEmail || p2.owner_email || '').toLowerCase().trim();
  if (email1 && email2 && email1 === email2) return true;
  const brand1 = extractBrandRoot(p1.name);
  const brand2 = extractBrandRoot(p2.name);
  if (brand1 && brand2) {
    if (brand1 === brand2) return true;
    if (brand1.length >= 6 && (brand1.startsWith(brand2) || brand2.startsWith(brand1))) return true;
    if (brand1.length >= 6 && (brand1.includes(brand2) || brand2.includes(brand1))) return true;
  }
  return false;
}

export async function validatePlaceUniqueness({ name, phone, excludePlaceId = null, categoryId = '', placeData = null }) {
  const isAtm = isAtmPlace(placeData || { categoryId, name });
  const isPhoneUnavailable = Boolean(placeData?.phoneUnavailable || !phone);
  const normName = normalizeArabic(name || '').trim();
  const cleanPhoneNum = normalizePhoneNumber(phone || '');
  if (!normName) throw new Error(isAtm ? 'يرجى إدخال اسم البنك' : 'اسم المكان مطلوب');
  if (isAtm) return;
  if (!isPhoneUnavailable) {
    if (isIncompleteMobilePhone(phone)) {
      throw new Error('⚠️ رقم الهاتف ناقص! يبدو أنك أدخلت 10 أرقام فقط لرقم موبايل، ورقم الموبايل المصري يتكون من 11 رقماً (مثال: 01xxxxxxxxx).');
    }
    if (!isValidPhoneNumber(phone)) {
      throw new Error('يرجى إدخال رقم هاتف مصري صحيح ومفعل (موبايل 11 رقم أو أرضي أو رقم موحد)، أو تحديد خيار "رقم التواصل غير متوفر حالياً".');
    }
  }
  let allPlaces = [];
  try {
    if (typeof idbGetAll === 'function') {
      allPlaces = (await idbGetAll(STORES.PLACES)) || [];
    }
  } catch (_) {}
  if (!allPlaces || allPlaces.length === 0) {
    try {
      if (typeof getCached === 'function') {
        allPlaces = getCached('published_100_') || [];
      }
    } catch (_) {}
  }
  if (!allPlaces || allPlaces.length === 0) {
    try {
      if (typeof getPublishedPlaces === 'function') {
        allPlaces = (await getPublishedPlaces(100)) || [];
      }
    } catch (_) {}
  }
  const currentPlaceObj = { ...(placeData || {}), name, phone: isPhoneUnavailable ? '' : phone, id: excludePlaceId || placeData?.id || placeData?._key };
  const unrelatedMatchingPhonePlaces = [];
  for (const p of allPlaces) {
    if (!p) continue;
    const currentId = p.id || p._key;
    if (excludePlaceId && (currentId === excludePlaceId || p.slug === excludePlaceId)) continue;
    if (isAtmPlace(p)) continue;
    const existingNormName = normalizeArabic(p.name || '').trim();
    if (existingNormName && existingNormName === normName) {
      throw new Error(`يوجد مكان مسجل مسبقاً بنفس الاسم تماماً ("${p.name}")، يرجى إضافة اسم الفرع أو المنطقة لتمييزه (مثال: "${p.name} / بجوار كذا").`);
    }
    if (!isPhoneUnavailable && cleanPhoneNum) {
      const existingPhone = normalizePhoneNumber(p.phone || '');
      if (existingPhone && existingPhone === cleanPhoneNum && !isSameBusinessOrBranch(currentPlaceObj, p)) unrelatedMatchingPhonePlaces.push(p);
    }
  }
  if (!isPhoneUnavailable && unrelatedMatchingPhonePlaces.length >= 2) {
    const placesNames = unrelatedMatchingPhonePlaces.map(p => `"${p.name}"`).join(' و ');
    throw new Error(`رقم الهاتف ("${phone}") مسجل بالفعل لأنشطة تجارية أخرى مختلفة (${placesNames}). إذا كان هذا فرعاً لنفس النشاط، يرجى كتابة اسم النشاط الرئيسي في بداية اسم الفرع.`);
  }
}

export async function createPlace(placeData, currentUser) {
  if (!currentUser?.uid) throw new Error('يجب تسجيل الدخول لإضافة مكان');
  const cleanCandidate = generateCleanSlug(placeData.name);
  await validatePlaceUniqueness({ name: placeData.name, phone: placeData.phone, categoryId: placeData.categoryId, placeData });
  const placeId = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const slug = cleanCandidate;
  const now = Date.now();
  const isPhoneUnavailable = Boolean(placeData.phoneUnavailable || !placeData.phone);
  const targetArea = (placeData.area || 'المنزلة').trim();
  const validLocation = (placeData.location && Number(placeData.location.lat) > 20 && Number(placeData.location.lng) > 20)
    ? { lat: Number(placeData.location.lat), lng: Number(placeData.location.lng) }
    : (placeData.latitude && placeData.longitude && Number(placeData.latitude) > 20 && Number(placeData.longitude) > 20)
      ? { lat: Number(placeData.latitude), lng: Number(placeData.longitude) }
      : null;

  const newPlace = {
    id: placeId, slug, ownerId: currentUser.uid, ownerEmail: currentUser.email || '', name: placeData.name.trim(), nameEn: placeData.nameEn || '',
    categoryId: placeData.categoryId || 'other', customCategory: placeData.customCategory || null, medicalSpecialty: placeData.medicalSpecialty || null,
    subcategoryId: placeData.subcategoryId || '', description: placeData.description || '',
    phone: isPhoneUnavailable ? '' : normalizePhoneNumber(placeData.phone || ''),
    phoneUnavailable: isPhoneUnavailable,
    whatsapp: normalizePhoneNumber(placeData.whatsapp || ''),
    address: placeData.address || '', area: targetArea, mapsLink: placeData.mapsLink || '', location: validLocation, latitude: validLocation?.lat ?? null, longitude: validLocation?.lng ?? null,
    alwaysOpen: Boolean(placeData.alwaysOpen), alwaysOpenExcept: Boolean(placeData.alwaysOpenExcept), workingHours: placeData.workingHours || getDefaultWorkingHours(),
    coverImageUrl: placeData.coverImageUrl || '', logoUrl: placeData.logoUrl || '', imageUrls: placeData.imageUrls || [], services: placeData.services || [],
    paymentMethods: placeData.paymentMethods || placeData.payment_methods || [],
    social: { facebook: '', instagram: '', tiktok: '', youtube: '', x: '', threads: '', website: '', ...(placeData.social || {}) }, deliveryType: placeData.deliveryType || null, branches: (placeData.branches || []).map(b => ({ ...b, phone: normalizePhoneNumber(b.phone || ''), whatsapp: normalizePhoneNumber(b.whatsapp || '') })), availabilityStatus: placeData.availabilityStatus || 'available',
    status: 'published', verificationStatus: 'unverified', isVerified: false, verifiedAt: null, verifiedBy: null, createdAt: now, updatedAt: now,
    stats: { views: 0, phoneClicks: 0, whatsappClicks: 0, directionsClicks: 0, productViews: 0, offerViews: 0 }, offerCount: 0, productCount: 0
  };
  await syncPlaceToWorkerTurso(placeId, newPlace);
  idbPut(STORES.PLACES, { id: placeId, ...newPlace }).catch(() => {});
  clearDbCache();
  broadcastNewPlaceNotification(newPlace).catch(() => {});
  Promise.resolve(sendTelegramAdminNotification('new_place', { id: placeId, name: newPlace.name, categoryName: placeData.categoryName || placeData.categoryId, phone: newPlace.phone, area: newPlace.area, ownerName: currentUser.name || currentUser.displayName || currentUser.email })).catch(() => {});
  Promise.resolve(broadcastRealtimeChange('NEW_PLACE', { place: { id: placeId, ...newPlace } })).catch(() => {});
  Promise.resolve(awardPoints(currentUser.uid, 'ADD_PLACE', { placeId, placeName: newPlace.name })).catch(() => {});
  return placeId;
}

export async function updatePlace(placeId, placeData) {
  const current = (await idbGet(STORES.PLACES, placeId)) || (await getPlace(placeId));
  if (!current) throw new Error('المكان غير موجود');
  if (placeData.name || placeData.phone !== undefined || placeData.phoneUnavailable !== undefined) {
    await validatePlaceUniqueness({ name: placeData.name || current.name, phone: placeData.phone !== undefined ? placeData.phone : current.phone, excludePlaceId: placeId, categoryId: placeData.categoryId || current.categoryId, placeData: { ...current, ...placeData } });
  }
  const isPhoneUnavailable = placeData.phoneUnavailable !== undefined
    ? Boolean(placeData.phoneUnavailable)
    : (placeData.phone === '' ? true : Boolean(current.phoneUnavailable));

    const targetArea = (placeData.area || current.area || 'المنزلة').trim();
    const resolvedLocation = (placeData.location && Number(placeData.location.lat) > 20 && Number(placeData.location.lng) > 20)
      ? { lat: Number(placeData.location.lat), lng: Number(placeData.location.lng) }
      : (placeData.latitude && placeData.longitude && Number(placeData.latitude) > 20 && Number(placeData.longitude) > 20)
        ? { lat: Number(placeData.latitude), lng: Number(placeData.longitude) }
        : (current.location && Number(current.location.lat) > 20 && Number(current.location.lng) > 20)
          ? { lat: Number(current.location.lat), lng: Number(current.location.lng) }
          : null;

    const updates = {
    name: placeData.name ? placeData.name.trim() : current.name,
    nameEn: placeData.nameEn !== undefined ? placeData.nameEn : (current.nameEn || ''),
    categoryId: placeData.categoryId || current.categoryId,
    customCategory: placeData.customCategory !== undefined ? placeData.customCategory : (current.customCategory || null),
    medicalSpecialty: placeData.medicalSpecialty !== undefined ? placeData.medicalSpecialty : (current.medicalSpecialty || null),
    subcategoryId: placeData.subcategoryId || '',
    description: placeData.description !== undefined ? placeData.description : current.description,
    phone: isPhoneUnavailable ? '' : (placeData.phone !== undefined ? normalizePhoneNumber(placeData.phone || '') : (current.phone || '')),
    phoneUnavailable: isPhoneUnavailable,
    whatsapp: placeData.whatsapp !== undefined ? normalizePhoneNumber(placeData.whatsapp || '') : (current.whatsapp || ''),
    address: placeData.address !== undefined ? placeData.address : current.address,
    area: targetArea,
    mapsLink: placeData.mapsLink !== undefined ? placeData.mapsLink : (current.mapsLink || ''),
    location: resolvedLocation,
    latitude: resolvedLocation?.lat ?? null,
    longitude: resolvedLocation?.lng ?? null,
    alwaysOpen: placeData.alwaysOpen !== undefined ? Boolean(placeData.alwaysOpen) : Boolean(current.alwaysOpen),
    alwaysOpenExcept: placeData.alwaysOpenExcept !== undefined ? Boolean(placeData.alwaysOpenExcept) : Boolean(current.alwaysOpenExcept),
    workingHours: placeData.workingHours || current.workingHours,
    coverImageUrl: placeData.coverImageUrl !== undefined ? placeData.coverImageUrl : current.coverImageUrl,
    logoUrl: placeData.logoUrl !== undefined ? placeData.logoUrl : current.logoUrl,
    imageUrls: placeData.imageUrls || current.imageUrls || [],
    services: placeData.services || current.services || [],
    paymentMethods: placeData.paymentMethods !== undefined ? placeData.paymentMethods : (current.paymentMethods || current.payment_methods || []),
    social: { ...(current.social || {}), ...(placeData.social || {}) },
    deliveryType: placeData.deliveryType !== undefined ? placeData.deliveryType : (current.deliveryType || null),
    branches: placeData.branches !== undefined ? placeData.branches.map(b => ({ ...b, phone: normalizePhoneNumber(b.phone || ''), whatsapp: normalizePhoneNumber(b.whatsapp || '') })) : (current.branches || []),
    availabilityStatus: placeData.availabilityStatus !== undefined ? placeData.availabilityStatus : (current.availabilityStatus || current.availability_status || 'available'),
    updatedAt: Date.now()
  };
  const updatedPlace = { ...current, ...updates, id: placeId, slug: current.slug || updates.slug };
  await syncPlaceToWorkerTurso(placeId, updatedPlace);
  idbPut(STORES.PLACES, updatedPlace).catch(() => {});
  invalidateLocalPlaceCache(placeId, current.slug).catch(() => {});
  if (updatedPlace.slug && updatedPlace.slug !== current.slug) {
    invalidateLocalPlaceCache(placeId, updatedPlace.slug).catch(() => {});
  }
  clearDbCache();
  broadcastRealtimeChange('PLACE_UPDATED', { place: { id: placeId, slug: updatedPlace.slug, ...updates } });
  return updatedPlace;
}

export async function deletePlace(placeId, ownerId) {
  const place = (await getPlace(placeId)) || (await idbGet(STORES.PLACES, placeId)); if (!place) return;
  await tursoFetch(`/api/places/${encodeURIComponent(placeId)}`, { method: 'DELETE' });
  await idbDelete(STORES.PLACES, placeId).catch(() => {});
  await invalidateLocalPlaceCache(placeId, place.slug); clearDbCache(); broadcastRealtimeChange('PLACE_DELETED', { placeId });
}

export async function submitVerificationRequest(placeId, user, notes = '') {
  const place = (await getPlace(placeId)) || (await idbGet(STORES.PLACES, placeId)); if (!place) throw new Error('المكان غير موجود');
  const reqId = `vreq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const response = await tursoFetch('/api/verification-requests', { method: 'POST', body: JSON.stringify({ id: reqId, place_id: placeId, place_name: place.name, owner_id: user.uid, owner_name: user.name || user.displayName || '', owner_email: user.email || '', phone: user.phone || place.phone || '', notes }) });
  if (response?.success === false) throw new Error(response.error || 'تعذر إرسال طلب التوثيق');
  place.verificationStatus = 'verification_requested';
  await idbPut(STORES.PLACES, place).catch(() => {});
  tursoFetch('/api/notify', { method: 'POST', body: JSON.stringify({ type: 'verification_request', data: { placeId, placeName: place.name, requesterName: user.name || user.displayName || user.email, phone: user.phone || place.phone || '', notes } }) }).catch(() => {});
  return reqId;
}

function getDefaultWorkingHours() { return { saturday: { open: '09:00', close: '22:00', closed: false }, sunday: { open: '09:00', close: '22:00', closed: false }, monday: { open: '09:00', close: '22:00', closed: false }, tuesday: { open: '09:00', close: '22:00', closed: false }, wednesday: { open: '09:00', close: '22:00', closed: false }, thursday: { open: '09:00', close: '22:00', closed: false }, friday: { open: '13:00', close: '22:00', closed: false } }; }

export async function addOffer(placeId, data = {}, user = null) {
  if (!placeId) throw new Error('المكان مطلوب');
  const id = data.id || `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const result = await tursoFetch('/api/offers', { method: 'POST', body: JSON.stringify({ ...data, id, place_id: placeId, placeId }) });
  clearDbCache();
  return result?.id || result?.data?.id || id;
}

export async function updateOffer(offerId, data = {}, user = null) {
  if (!offerId) throw new Error('معرف العرض مطلوب');
  const result = await tursoFetch(`/api/offers/${encodeURIComponent(offerId)}`, { method: 'PUT', body: JSON.stringify(data) });
  clearDbCache();
  return result;
}

export async function deleteOffer(offerId, placeId = null, user = null) {
  if (!offerId) throw new Error('معرف العرض مطلوب');
  const result = await tursoFetch(`/api/offers/${encodeURIComponent(offerId)}`, { method: 'DELETE' });
  clearDbCache();
  return result;
}

export async function addProduct(placeId, data = {}, user = null) {
  if (!placeId) throw new Error('المكان مطلوب');
  const id = data.id || `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const result = await tursoFetch('/api/products', { method: 'POST', body: JSON.stringify({ ...data, id, place_id: placeId, placeId }) });
  clearDbCache();
  return result?.id || result?.data?.id || id;
}

export async function updateProduct(placeId, productId, data = {}, user = null) {
  if (!productId) throw new Error('معرف المنتج مطلوب');
  const result = await tursoFetch(`/api/products/${encodeURIComponent(productId)}`, { method: 'PUT', body: JSON.stringify({ ...data, place_id: placeId, placeId }) });
  clearDbCache();
  return result;
}

export async function deleteProduct(placeId, productId, user = null) {
  if (!productId) throw new Error('معرف المنتج مطلوب');
  const result = await tursoFetch(`/api/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
  clearDbCache();
  return result;
}