/**
 * المنزلة وناسها — Places Service
 * Core business logic for Place, Offers and Products management
 */

import { getDB } from '../core/firebase.js';
import { dbGet, dbSet, dbUpdate, dbPush, dbRemove, dbIncrement, serverTimestamp, sendTelegramAdminNotification, broadcastNewPlaceNotification, clearDbCache } from '../core/db.js';
import { broadcastRealtimeChange } from './realtime-sync.service.js';
import { generatePlaceSlug } from '../utils/slug.js';
import { normalizeArabic } from '../utils/arabic.js';
import { isAtmPlace } from '../utils/atm.js';
import { WORKER_URL } from '../core/firebase.js';
import { getIdToken } from '../core/auth.js';

/**
 * Validate that Place Name and Phone Number are completely unique
 */
export async function validatePlaceUniqueness({ name, phone, excludePlaceId = null, categoryId = '', placeData = null }) {
  const isAtm = isAtmPlace(placeData || { categoryId, name });
  const normName = normalizeArabic(name || '').trim();
  const cleanPhoneNum = (phone || '').replace(/\D/g, '');

  if (!normName) {
    throw new Error(isAtm ? 'يرجى إدخال اسم البنك' : 'اسم المكان مطلوب');
  }

  // ATMs are public banking utilities: no phone required, multiple ATMs per bank allowed
  if (isAtm) {
    return;
  }

  if (!cleanPhoneNum || cleanPhoneNum.length < 7) {
    throw new Error('يرجى إدخال رقم هاتف صحيح للمكان');
  }

  const allPlaces = (await dbGet('places')) || {};
  for (const [id, p] of Object.entries(allPlaces)) {
    if (!p) continue;
    const currentId = p.id || p._key || id;
    if (excludePlaceId && (currentId === excludePlaceId || p.slug === excludePlaceId)) {
      continue; // Skip the place itself during updates
    }

    // Skip ATM places during commercial unique checks
    if (isAtmPlace(p)) continue;

    // 1. Strict Unique Name Check (Normalized Arabic)
    const existingNormName = normalizeArabic(p.name || '').trim();
    if (existingNormName && existingNormName === normName) {
      throw new Error(`يوجد مكان مسجل مسبقاً بنفس الاسم ("${p.name}")، يرجى اختيار اسم فريد ومميز لنشاطك.`);
    }

    // 2. Strict Unique Phone Check
    const existingPhone = (p.phone || '').replace(/\D/g, '');
    if (existingPhone && existingPhone === cleanPhoneNum) {
      throw new Error(`رقم الهاتف ("${phone}") مسجل بالفعل لنشاط آخر ("${p.name}")، لكل مكان رقم هاتف فريد.`);
    }
  }
}

/**
 * Create a new place (with strict uniqueness enforcement)
 * @param {Object} placeData
 * @param {Object} currentUser
 * @returns {Promise<string>} placeId
 */
export async function createPlace(placeData, currentUser) {
  if (!currentUser) throw new Error('يجب تسجيل الدخول لإضافة مكان');

  // Enforce unique name and phone
  await validatePlaceUniqueness({
    name: placeData.name,
    phone: placeData.phone,
    categoryId: placeData.categoryId,
    placeData
  });

  const token = await getIdToken();
  const db = getDB();
  const placesRef = db.ref('places');
  const newPlaceRef = placesRef.push();
  const placeId = newPlaceRef.key;

  const slug = generatePlaceSlug(placeData.name, placeId);

  const newPlace = {
    id: placeId,
    slug,
    ownerId: currentUser.uid,
    ownerEmail: currentUser.email || '',
    name: placeData.name.trim(),
    nameEn: placeData.nameEn || '',
    categoryId: placeData.categoryId || 'other',
    subcategoryId: placeData.subcategoryId || '',
    description: placeData.description || '',
    phone: placeData.phone || '',
    whatsapp: placeData.whatsapp || '',
    address: placeData.address || '',
    area: placeData.area || 'المنزلة',
    mapsLink: placeData.mapsLink || '',
    location: placeData.location || { lat: 31.1578, lng: 31.9367 }, // Default El Manzala
    workingHours: placeData.workingHours || getDefaultWorkingHours(),
    coverImageUrl: placeData.coverImageUrl || '',
    logoUrl: placeData.logoUrl || '',
    imageUrls: placeData.imageUrls || [],
    services: placeData.services || [],
    social: placeData.social || { facebook: '', instagram: '', tiktok: '', youtube: '' },
    deliveryType: placeData.deliveryType || null,
    status: 'published', // Published by default, can be suspended by admin
    verificationStatus: 'unverified',
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    stats: {
      views: 0,
      phoneClicks: 0,
      whatsappClicks: 0,
      directionsClicks: 0,
      productViews: 0,
      offerViews: 0
    },
    offerCount: 0,
    productCount: 0
  };

  // Atomic write to places, slugIndex and user placeIds
  const updates = {};
  updates[`places/${placeId}`] = newPlace;
  updates[`slugIndex/${slug}`] = placeId;
  updates[`users/${currentUser.uid}/placeIds/${placeId}`] = true;

  await db.ref().update(updates);

  // Update category placeCount
  if (placeData.categoryId) {
    dbIncrement(`categories/${placeData.categoryId}/placeCount`, 1);
  }

  // Broadcast notification across directory to all registered users
  broadcastNewPlaceNotification(newPlace).catch(() => {});

  // Push instant notification to Telegram Admin
  sendTelegramAdminNotification('new_place', {
    id: placeId,
    name: newPlace.name,
    categoryName: placeData.categoryName || placeData.categoryId,
    phone: newPlace.phone,
    area: newPlace.area,
    ownerName: currentUser.name || currentUser.displayName || currentUser.email
  });

  // Invalidate local and persistent database cache immediately
  clearDbCache();

  // Broadcast realtime event across all open tabs, windows and PWA
  broadcastRealtimeChange('NEW_PLACE', { place: { id: placeId, ...newPlace } });

  return placeId;
}

/**
 * Update an existing place (with strict uniqueness enforcement)
 */
export async function updatePlace(placeId, placeData) {
  const db = getDB();
  const current = await dbGet(`places/${placeId}`);
  if (!current) throw new Error('المكان غير موجود');

  // Enforce unique name and phone on edit
  if (placeData.name || placeData.phone) {
    await validatePlaceUniqueness({
      name: placeData.name || current.name,
      phone: placeData.phone || current.phone,
      excludePlaceId: placeId,
      categoryId: placeData.categoryId || current.categoryId,
      placeData: { ...current, ...placeData }
    });
  }

  const updates = {
    name: placeData.name ? placeData.name.trim() : current.name,
    nameEn: placeData.nameEn !== undefined ? placeData.nameEn : (current.nameEn || ''),
    categoryId: placeData.categoryId || current.categoryId,
    subcategoryId: placeData.subcategoryId || '',
    description: placeData.description !== undefined ? placeData.description : current.description,
    phone: placeData.phone || current.phone || '',
    whatsapp: placeData.whatsapp !== undefined ? placeData.whatsapp : (current.whatsapp || ''),
    address: placeData.address !== undefined ? placeData.address : current.address,
    area: placeData.area || current.area || 'المنزلة',
    mapsLink: placeData.mapsLink !== undefined ? placeData.mapsLink : (current.mapsLink || ''),
    location: placeData.location || current.location,
    workingHours: placeData.workingHours || current.workingHours,
    coverImageUrl: placeData.coverImageUrl !== undefined ? placeData.coverImageUrl : current.coverImageUrl,
    logoUrl: placeData.logoUrl !== undefined ? placeData.logoUrl : current.logoUrl,
    imageUrls: placeData.imageUrls || current.imageUrls || [],
    services: placeData.services || current.services || [],
    social: placeData.social || current.social || {},
    deliveryType: placeData.deliveryType || null,
    updatedAt: serverTimestamp()
  };

  await dbUpdate(`places/${placeId}`, updates);
  clearDbCache();
  broadcastRealtimeChange('PLACE_UPDATED', { place: { id: placeId, ...updates } });
}

/**
 * Delete a place
 */
export async function deletePlace(placeId, ownerId) {
  const place = await dbGet(`places/${placeId}`);
  if (!place) return;

  const db = getDB();
  const updates = {};
  updates[`places/${placeId}`] = null;
  if (place.slug) updates[`slugIndex/${place.slug}`] = null;
  updates[`users/${ownerId}/placeIds/${placeId}`] = null;
  updates[`products/${placeId}`] = null;

  await db.ref().update(updates);

  if (place.categoryId) {
    dbIncrement(`categories/${place.categoryId}/placeCount`, -1);
  }

  clearDbCache();
  broadcastRealtimeChange('PLACE_DELETED', { placeId });
}

/**
 * Submit Verification Request
 */
export async function submitVerificationRequest(placeId, user, notes = '') {
  const place = await dbGet(`places/${placeId}`);
  if (!place) throw new Error('المكان غير موجود');

  const db = getDB();
  const reqRef = db.ref('verificationRequests').push();
  const reqId = reqRef.key;

  const reqData = {
    id: reqId,
    placeId,
    placeName: place.name,
    ownerId: user.uid,
    ownerName: user.name || '',
    ownerEmail: user.email || '',
    notes,
    status: 'pending',
    requestedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null
  };

  const updates = {};
  updates[`verificationRequests/${reqId}`] = reqData;
  updates[`places/${placeId}/verificationStatus`] = 'verification_requested';

  await db.ref().update(updates);

  // Push instant notification to Telegram Admin (async)
  fetch(`${WORKER_URL}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'verification_request',
      data: {
        placeId,
        placeName: place.name,
        requesterName: user.name || user.displayName || user.email,
        phone: user.phone || place.phone || '',
        notes
      }
    })
  }).catch(() => {});

  return reqId;
}

/**
 * Add Daily Offer (enforced limit via Worker or direct verify check)
 * Rule: Verified = max 3, Unverified = max 1
 */
export async function addOffer(placeId, offerData, currentUser) {
  const place = await dbGet(`places/${placeId}`);
  if (!place) throw new Error('المكان غير موجود');
  if (place.ownerId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new Error('لا تملك صلاحية إضافة عروض لهذا المكان');
  }

  // Check current active offers count for this place
  const now = Date.now();
  const existingOffers = await dbGet('offers') || {};
  const activeCount = Object.values(existingOffers).filter(
    o => o && o.placeId === placeId && o.status === 'active' && o.endDate > now
  ).length;

  const maxAllowed = place.isVerified ? 3 : 1;
  if (activeCount >= maxAllowed) {
    throw new Error(
      place.isVerified
        ? `الحد الأقصى للعروض اليومية للأماكن الموثقة هو ${maxAllowed} عروض نشطة`
        : `الحد الأقصى للعروض اليومية للأماكن غير الموثقة هو عرض واحد فقط. وثّق مكانك لإضافة حتى 3 عروض!`
    );
  }

  const db = getDB();
  const offerRef = db.ref('offers').push();
  const offerId = offerRef.key;

  const newOffer = {
    id: offerId,
    placeId,
    placeName: place.name,
    placeSlug: place.slug,
    ownerId: currentUser.uid,
    title: offerData.title.trim(),
    description: offerData.description || '',
    oldPrice: Number(offerData.oldPrice) || 0,
    newPrice: Number(offerData.newPrice) || 0,
    discountPercent: Number(offerData.discountPercent) || 0,
    imageUrl: offerData.imageUrl || '',
    startDate: offerData.startDate ? new Date(offerData.startDate).getTime() : now,
    endDate: offerData.endDate ? new Date(offerData.endDate).getTime() : now + (24 * 60 * 60 * 1000), // Default 24h
    status: 'active',
    isVerifiedPlace: !!place.isVerified,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    views: 0
  };

  await dbSet(`offers/${offerId}`, newOffer);
  await dbIncrement(`places/${placeId}/offerCount`, 1);

  return offerId;
}

/**
 * Add Product (With Admin Moderation & Approval Workflow)
 * Rule: Only verified places can add products (up to 350)
 */
export async function addProduct(placeId, productData, currentUser) {
  const place = await dbGet(`places/${placeId}`);
  if (!place) throw new Error('المكان غير موجود');
  if (place.ownerId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new Error('لا تملك صلاحية إضافة منتجات لهذا المكان');
  }

  // Server-side & Client Enforce: Only verified places can add products
  if (!place.isVerified && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new Error('إضافة المنتجات متاحة حصرياً للأماكن الموثقة. يرجى طلب توثيق مكانك أولاً');
  }

  // Check product count limit (350)
  const existingProducts = await dbGet(`products/${placeId}`) || {};
  const count = Object.keys(existingProducts).length;
  if (count >= 350) {
    throw new Error('تم الوصول للحد الأقصى من المنتجات (350 منتج) لهذا المكان');
  }

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
  const db = getDB();
  const prodRef = db.ref(`products/${placeId}`).push();
  const productId = prodRef.key;

  const newProduct = {
    id: productId,
    placeId,
    placeName: place.name || '',
    placeSlug: place.slug || '',
    name: productData.name.trim(),
    description: productData.description || '',
    price: Number(productData.price) || 0,
    oldPrice: Number(productData.oldPrice) || 0,
    imageUrl: productData.imageUrl || '',
    category: productData.category || '',
    sku: productData.sku || '',
    inStock: productData.inStock !== false,
    isFeatured: !!productData.isFeatured,
    status: isAdmin ? 'approved' : 'pending',
    isApproved: isAdmin,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await dbSet(`products/${placeId}/${productId}`, newProduct);
  await dbIncrement(`places/${placeId}/productCount`, 1);

  return productId;
}

/**
 * Update Offer
 */
export async function updateOffer(offerId, updates, currentUser) {
  const offer = await dbGet(`offers/${offerId}`);
  if (!offer) throw new Error('العرض غير موجود');

  const place = await dbGet(`places/${offer.placeId}`);
  if (offer.ownerId !== currentUser.uid && place?.ownerId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new Error('لا تملك صلاحية تعديل هذا العرض');
  }

  const patch = {
    title: updates.title ? updates.title.trim() : offer.title,
    description: updates.description !== undefined ? updates.description : offer.description,
    newPrice: updates.newPrice !== undefined ? Number(updates.newPrice) : offer.newPrice,
    oldPrice: updates.oldPrice !== undefined ? Number(updates.oldPrice) : offer.oldPrice,
    discountPercent: updates.discountPercent !== undefined ? Number(updates.discountPercent) : (offer.discountPercent || 0),
    imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : offer.imageUrl,
    status: updates.status || offer.status || 'active',
    updatedAt: serverTimestamp()
  };

  await dbUpdate(`offers/${offerId}`, patch);
  return patch;
}

/**
 * Delete Offer
 */
export async function deleteOffer(offerId, placeId, currentUser) {
  const offer = await dbGet(`offers/${offerId}`);
  if (!offer) return;

  const targetPlaceId = placeId || offer.placeId;
  const place = targetPlaceId ? await dbGet(`places/${targetPlaceId}`) : null;
  if (offer.ownerId !== currentUser.uid && place?.ownerId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new Error('لا تملك صلاحية حذف هذا العرض');
  }

  await dbRemove(`offers/${offerId}`);
  if (targetPlaceId) {
    await dbIncrement(`places/${targetPlaceId}/offerCount`, -1).catch(() => {});
  }
}

/**
 * Update Product
 */
export async function updateProduct(placeId, productId, updates, currentUser) {
  const place = await dbGet(`places/${placeId}`);
  if (!place) throw new Error('المكان غير موجود');

  if (place.ownerId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new Error('لا تملك صلاحية تعديل هذا المنتج');
  }

  const existing = await dbGet(`products/${placeId}/${productId}`);
  if (!existing) throw new Error('المنتج غير موجود');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
  const patch = {
    name: updates.name ? updates.name.trim() : existing.name,
    description: updates.description !== undefined ? updates.description : existing.description,
    price: updates.price !== undefined ? Number(updates.price) : existing.price,
    oldPrice: updates.oldPrice !== undefined ? Number(updates.oldPrice) : existing.oldPrice,
    imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : existing.imageUrl,
    category: updates.category !== undefined ? updates.category : existing.category,
    inStock: updates.inStock !== undefined ? !!updates.inStock : existing.inStock,
    isFeatured: updates.isFeatured !== undefined ? !!updates.isFeatured : existing.isFeatured,
    updatedAt: serverTimestamp()
  };

  // If user edited product details and is not admin, re-submit for moderation
  if (!isAdmin && (updates.name || updates.price || updates.imageUrl || updates.description)) {
    patch.status = 'pending';
    patch.isApproved = false;
  }

  await dbUpdate(`products/${placeId}/${productId}`, patch);
  return patch;
}

/**
 * Delete Product
 */
export async function deleteProduct(placeId, productId, currentUser) {
  const place = await dbGet(`places/${placeId}`);
  if (!place) throw new Error('المكان غير موجود');

  if (place.ownerId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new Error('لا تملك صلاحية حذف هذا المنتج');
  }

  await dbRemove(`products/${placeId}/${productId}`);
  await dbIncrement(`places/${placeId}/productCount`, -1).catch(() => {});
}

function getDefaultWorkingHours() {
  return {
    saturday:  { open: '09:00', close: '22:00', closed: false },
    sunday:    { open: '09:00', close: '22:00', closed: false },
    monday:    { open: '09:00', close: '22:00', closed: false },
    tuesday:   { open: '09:00', close: '22:00', closed: false },
    wednesday: { open: '09:00', close: '22:00', closed: false },
    thursday:  { open: '09:00', close: '22:00', closed: false },
    friday:    { open: '13:00', close: '22:00', closed: false }
  };
}
