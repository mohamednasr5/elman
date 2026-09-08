/**
 * المنزلة وناسها — Places Service
 * Core business logic for Place, Offers and Products management
 */

import { getDB } from '../core/firebase.js';
import { dbGet, dbSet, dbUpdate, dbPush, dbRemove, dbIncrement, serverTimestamp, sendTelegramAdminNotification, broadcastNewPlaceNotification, clearDbCache, syncPlaceToWorkerTurso, invalidateLocalPlaceCache, getPlace, getPublishedPlaces, idbGet, idbPut, idbDelete, STORES } from '../core/db.js';
import { broadcastRealtimeChange } from './realtime-sync.service.js';
import { generatePlaceSlug, generateCleanSlug } from '../utils/slug.js';
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

  if (!normName) throw new Error(isAtm ? 'يرجى إدخال اسم البنك' : 'اسم المكان مطلوب');
  if (isAtm) return;
  if (!cleanPhoneNum || cleanPhoneNum.length < 4 || cleanPhoneNum.length > 15) throw new Error('يرجى إدخال رقم هاتف صحيح للمكان (موبايل، أرضي، أو رقم موحد مثل 17555)');

  const allPlaces = (await getPublishedPlaces({ limit: 1000 })) || [];
  const matchingPhonePlaces = [];
  for (const p of allPlaces) {
    if (!p) continue;
    const currentId = p.id || p._key;
    if (excludePlaceId && (currentId === excludePlaceId || p.slug === excludePlaceId)) continue;
    if (isAtmPlace(p)) continue;
    const existingNormName = normalizeArabic(p.name || '').trim();
    if (existingNormName && existingNormName === normName) throw new Error(`يوجد مكان مسجل مسبقاً بنفس الاسم ("${p.name}")، يرجى اختيار اسم فريد ومميز لنشاطك.`);
    const existingPhone = (p.phone || '').replace(/\D/g, '');
    if (existingPhone && existingPhone === cleanPhoneNum) matchingPhonePlaces.push(p);
  }
  if (matchingPhonePlaces.length >= 2) {
    const placesNames = matchingPhonePlaces.map(p => `"${p.name}"`).join(' و ');
    throw new Error(`رقم الهاتف ("${phone}") مسجل بالفعل لمكانين (${placesNames})، والحد الأقصى المسموح به هو تسجيل نفس الرقم لمكانين فقط.`);
  }
}

export async function createPlace(placeData, currentUser) {
  if (!currentUser) throw new Error('يجب تسجيل الدخول لإضافة مكان');
  await validatePlaceUniqueness({name:placeData.name,phone:placeData.phone,categoryId:placeData.categoryId,placeData});
  const placeId='p_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
  const cleanCandidate=generateCleanSlug(placeData.name); let slug=cleanCandidate;
  try { const existingKey=await dbGet(`slugIndex/${slug}`); if(existingKey&&existingKey!==placeId) slug=`${cleanCandidate}-${placeId.slice(-5)}`; } catch(_){ slug=cleanCandidate; }

  const newPlace={
    id:placeId, slug, ownerId:currentUser.uid, ownerEmail:currentUser.email||'', name:placeData.name.trim(), nameEn:placeData.nameEn||'',
    categoryId:placeData.categoryId||'other', customCategory:placeData.customCategory||null, medicalSpecialty:placeData.medicalSpecialty||null,
    subcategoryId:placeData.subcategoryId||'', description:placeData.description||'', phone:placeData.phone||'', whatsapp:placeData.whatsapp||'',
    address:placeData.address||'', area:placeData.area||'المنزلة', mapsLink:placeData.mapsLink||'', location:placeData.location||{lat:31.1578,lng:31.9367},
    alwaysOpen:Boolean(placeData.alwaysOpen), alwaysOpenExcept:Boolean(placeData.alwaysOpenExcept), workingHours:placeData.workingHours||getDefaultWorkingHours(),
    coverImageUrl:placeData.coverImageUrl||'', logoUrl:placeData.logoUrl||'', imageUrls:placeData.imageUrls||[], services:placeData.services||[],
    social:{facebook:'',instagram:'',tiktok:'',youtube:'',x:'',threads:'',website:'',...(placeData.social||{})}, deliveryType:placeData.deliveryType||null,
    status:'published', verificationStatus:'unverified', isVerified:false, verifiedAt:null, verifiedBy:null, createdAt:Date.now(), updatedAt:Date.now(),
    stats:{views:0,phoneClicks:0,whatsappClicks:0,directionsClicks:0,productViews:0,offerViews:0}, offerCount:0, productCount:0
  };

  // 1. Authoritative write to Turso directly!
  await syncPlaceToWorkerTurso(placeId, newPlace);

  // 2. Cache in IndexedDB for fast instant reads
  await idbPut(STORES.PLACES, { id: placeId, ...newPlace }).catch(() => {});
  if (placeData.categoryId) {
    try {
      const cat = await idbGet(STORES.CATEGORIES, placeData.categoryId);
      if (cat) {
        cat.placeCount = (cat.placeCount || 0) + 1;
        await idbPut(STORES.CATEGORIES, cat);
      }
    } catch (_) {}
  }
  broadcastNewPlaceNotification(newPlace).catch(() => {});
  sendTelegramAdminNotification('new_place', {
    id: placeId,
    name: newPlace.name,
    categoryName: placeData.categoryName || placeData.categoryId,
    phone: newPlace.phone,
    area: newPlace.area,
    ownerName: currentUser.name || currentUser.displayName || currentUser.email
  });
  clearDbCache();
  broadcastRealtimeChange('NEW_PLACE', { place: { id: placeId, ...newPlace } });
  return placeId;
}

export async function updatePlace(placeId, placeData) {
  const current = (await getPlace(placeId)) || (await idbGet(STORES.PLACES, placeId));
  if (!current) throw new Error('المكان غير موجود');
  if (placeData.name || placeData.phone) await validatePlaceUniqueness({ name: placeData.name || current.name, phone: placeData.phone || current.phone, excludePlaceId: placeId, categoryId: placeData.categoryId || current.categoryId, placeData: { ...current, ...placeData } });
  const updates = { name: placeData.name ? placeData.name.trim() : current.name, nameEn: placeData.nameEn !== undefined ? placeData.nameEn : (current.nameEn || ''), categoryId: placeData.categoryId || current.categoryId, customCategory: placeData.customCategory !== undefined ? placeData.customCategory : (current.customCategory || null), medicalSpecialty: placeData.medicalSpecialty !== undefined ? placeData.medicalSpecialty : (current.medicalSpecialty || null), subcategoryId: placeData.subcategoryId || '', description: placeData.description !== undefined ? placeData.description : current.description, phone: placeData.phone || current.phone || '', whatsapp: placeData.whatsapp !== undefined ? placeData.whatsapp : (current.whatsapp || ''), address: placeData.address !== undefined ? placeData.address : current.address, area: placeData.area || current.area || 'المنزلة', mapsLink: placeData.mapsLink !== undefined ? placeData.mapsLink : (current.mapsLink || ''), location: placeData.location !== undefined ? placeData.location : current.location, alwaysOpen: placeData.alwaysOpen !== undefined ? Boolean(placeData.alwaysOpen) : Boolean(current.alwaysOpen), alwaysOpenExcept: placeData.alwaysOpenExcept !== undefined ? Boolean(placeData.alwaysOpenExcept) : Boolean(current.alwaysOpenExcept), workingHours: placeData.workingHours || current.workingHours, coverImageUrl: placeData.coverImageUrl !== undefined ? placeData.coverImageUrl : current.coverImageUrl, logoUrl: placeData.logoUrl !== undefined ? placeData.logoUrl : current.logoUrl, imageUrls: placeData.imageUrls || current.imageUrls || [], services: placeData.services || current.services || [], social: { ...(current.social || {}), ...(placeData.social || {}) }, deliveryType: placeData.deliveryType !== undefined ? placeData.deliveryType : (current.deliveryType || null), updatedAt: Date.now() };
  const updatedPlace = { ...current, ...updates, id: placeId, slug: current.slug || updates.slug };

  // 1. Authoritative write to Turso directly!
  await syncPlaceToWorkerTurso(placeId, updatedPlace);

  // 2. Cache in IndexedDB
  await idbPut(STORES.PLACES, updatedPlace).catch(() => {});
  await invalidateLocalPlaceCache(placeId, current.slug);
  clearDbCache();
  broadcastRealtimeChange('PLACE_UPDATED', { place: { id: placeId, ...updates } });
}

export async function deletePlace(placeId,ownerId){
  const place=(await getPlace(placeId))||(await idbGet(STORES.PLACES,placeId)); if(!place)return;
  await idbDelete(STORES.PLACES,placeId).catch(()=>{});
  if(place.categoryId){try{const cat=await idbGet(STORES.CATEGORIES,place.categoryId);if(cat&&cat.placeCount>0){cat.placeCount-=1;await idbPut(STORES.CATEGORIES,cat);}}catch(_) {}}
  fetch(`${WORKER_URL}/api/places/${encodeURIComponent(placeId)}`,{method:'DELETE',headers:{Authorization:`Bearer ${await getIdToken()}`}}).catch(()=>{});
  await invalidateLocalPlaceCache(placeId,place.slug); clearDbCache(); broadcastRealtimeChange('PLACE_DELETED',{placeId});
}

export async function submitVerificationRequest(placeId,user,notes=''){
  const place=(await getPlace(placeId))||(await idbGet(STORES.PLACES,placeId)); if(!place)throw new Error('المكان غير موجود');
  const reqId=`vreq_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  try{await fetch(`${WORKER_URL}/api/verification-requests`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await getIdToken()}`},body:JSON.stringify({id:reqId,place_id:placeId,place_name:place.name,owner_id:user.uid,owner_name:user.name||user.displayName||'',owner_email:user.email||'',phone:user.phone||place.phone||'',notes})});}catch(_){}
  place.verificationStatus='verification_requested'; await syncPlaceToWorkerTurso(placeId,{verificationStatus:'verification_requested'}); await idbPut(STORES.PLACES,place).catch(()=>{});
  fetch(`${WORKER_URL}/api/notify`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await getIdToken()}`},body:JSON.stringify({type:'verification_request',data:{placeId,placeName:place.name,requesterName:user.name||user.displayName||user.email,phone:user.phone||place.phone||'',notes}})}).catch(()=>{});
  return reqId;
}

function getDefaultWorkingHours(){return{ saturday:{open:'09:00',close:'22:00',closed:false}, sunday:{open:'09:00',close:'22:00',closed:false}, monday:{open:'09:00',close:'22:00',closed:false}, tuesday:{open:'09:00',close:'22:00',closed:false}, wednesday:{open:'09:00',close:'22:00',closed:false}, thursday:{open:'09:00',close:'22:00',closed:false}, friday:{open:'13:00',close:'22:00',closed:false} };}
