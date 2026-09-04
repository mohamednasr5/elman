/**
 * المنزلة وناسها — Maps & Location Helper
 * Extract coordinates from Google Maps short links, Plus codes, or GPS.
 */

import { WORKER_URL } from '../core/firebase.js';

export async function extractCoordinates(urlOrText) {
  if (!urlOrText || typeof urlOrText !== 'string') return null;
  let input = urlOrText.trim();

  // If user pasted full <iframe ... src="..."> code, extract src URL
  if (input.includes('<iframe') || input.includes('src=')) {
    const srcMatch = input.match(/src=["']([^"']+)["']/i);
    if (srcMatch) input = srcMatch[1].trim();
  }

  // 1. Direct Regex for Lat/Lng (e.g. 31.1940, 31.9814 or @31.1940,31.9814 or embed !3d31.1939!2d31.9819)
  const pbLatMatch = input.match(/!3d(-?\d+\.\d+)/);
  const pbLngMatch = input.match(/!2d(-?\d+\.\d+)/) || input.match(/!4d(-?\d+\.\d+)/);
  if (pbLatMatch && pbLngMatch) {
    const lat = parseFloat(pbLatMatch[1]);
    const lng = parseFloat(pbLngMatch[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'embed_pb' };
    }
  }

  const regexMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                     input.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                     input.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                     input.match(/^(-?\d+\.\d{3,})\s*[,\s]\s*(-?\d+\.\d{3,})$/);
  
  if (regexMatch) {
    const lat = parseFloat(regexMatch[1]);
    const lng = parseFloat(regexMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'regex' };
    }
  }

  // 2. If it's a short URL (e.g. maps.app.goo.gl or goo.gl/maps or google.com/maps)
  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      const res = await fetch(`${WORKER_URL}/api/maps/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.lat && data.lng) {
          return { lat: data.lat, lng: data.lng, source: 'worker_resolver' };
        }
      }
    } catch (_) {}
  }

  return null;
}

// ─────────────────────────────────────────────
//  GEOLOCATION & DISTANCE CALCULATIONS (أقرب مكان)
// ─────────────────────────────────────────────

/** Complete List of 54 Towns, Villages, and Neighborhoods in El-Manzala & El-Matareya */
export const MANZALA_VILLAGES_LIST = [
  'المنزلة',
  'المطرية',
  'الجمالية',
  'العصافرة',
  'ميت سلسيل',
  'الفروسات',
  'البصراط',
  'المنزلة الجديدة',
  'ميت شريف',
  'العامرة',
  'الستايتة',
  'كفر حجاج',
  'ميت خضير',
  'العزيزة',
  'دار السلام',
  'الشبول',
  'الأحمدية',
  'النسايمة',
  'أولاد علم',
  'خندق الموز',
  'الحوتة',
  'القزاقزة',
  'الشريفية',
  'أولاد سراج',
  'أولاد نور',
  'الزعاترة',
  'القتايلة',
  'البصايلة',
  'الهنايدة',
  'أولاد بانا',
  'أولاد حانا',
  'القطشة',
  'المحارقة',
  'الطوابرة',
  'العمارنة',
  'الجماملة',
  'إصلاح أبو الأخضر',
  'عزبة المفارق',
  'الإسكندرية الجديدة',
  'مصر الجديدة',
  'الجوابر',
  'المواجد',
  'الضهير',
  'أولاد صبور',
  'أبو خضير',
  'بطل شميس',
  'حي البساتين',
  'الخلايفة',
  'العرب والنجوع',
  'الجباسات',
  'الجسر الواقي',
  'طريق الشونة',
  'المثلث',
  'المجاير',
  'شرق السكة الحديد',
  'القبلية'
];

/** Default Coordinates for El-Manzala Center (مدينة المنزلة) */
export const MANZALA_CENTER = { lat: 31.1578, lng: 31.9356 };

/** Known Coordinates for El-Manzala Areas & Neighborhoods */
export const MANZALA_AREAS_COORDINATES = {
  'المنزلة': { lat: 31.1578, lng: 31.9356 },
  'المطرية': { lat: 31.1830, lng: 32.0310 },
  'العصافرة': { lat: 31.1730, lng: 31.9540 },
  'وسط البلد': { lat: 31.1578, lng: 31.9356 },
  'شارع البحر': { lat: 31.1595, lng: 31.9320 },
  'القومية': { lat: 31.1540, lng: 31.9390 },
  'المحطة': { lat: 31.1535, lng: 31.9380 },
  'المعهد الديني': { lat: 31.1610, lng: 31.9420 },
  'العزيزة': { lat: 31.1420, lng: 31.9180 },
  'الضهير': { lat: 31.1730, lng: 31.9540 },
  'البصراط': { lat: 31.1780, lng: 31.9120 },
  'الجمالية': { lat: 31.1850, lng: 31.9820 },
  'ميت سلسيل': { lat: 31.1920, lng: 31.8950 },
  'النسايمة': { lat: 31.1350, lng: 31.9700 },
  'مستشفى المنزلة': { lat: 31.1560, lng: 31.9410 },
  'ميدان الأنصاري': { lat: 31.1630, lng: 31.9310 },
  'الأحمدية': { lat: 31.1510, lng: 31.9250 },
  'الجلاء': { lat: 31.1565, lng: 31.9340 },
  'حي الجامعة': { lat: 31.1625, lng: 31.9315 }
};

function hashString(str) {
  let hash = 0;
  if (!str) return 42;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Calculate Distance in Kilometers between two coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;

  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance into friendly Arabic string (e.g. "450 متر" or "1.2 كم")
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || distanceKm === Infinity || isNaN(distanceKm)) return '';
  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round(distanceKm * 1000));
    return `${meters} متر`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

/**
 * Get Place Coordinates from place object with smart multi-tier detection:
 * 1. Exact place.location if custom
 * 2. Regex from Google Maps URL (!3d/!4d, @lat,lng, query=)
 * 3. Area / neighborhood specific coordinates (العزيزة، الضهير، البحر...)
 * 4. Deterministic distinct street coordinates
 */
export function getPlaceCoords(place) {
  if (!place) return null;

  // 1. Direct Location Object (if distinct from generic center)
  if (place.location && typeof place.location.lat === 'number' && typeof place.location.lng === 'number') {
    const isGenericDefault = (
      Math.abs(place.location.lat - 31.1578) < 0.0001 &&
      Math.abs(place.location.lng - 31.9367) < 0.0001
    );
    if (!isGenericDefault) {
      return { lat: place.location.lat, lng: place.location.lng };
    }
  }

  // 2. Direct lat / lng properties
  if (place.lat && place.lng) {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // 3. Try extracting from mapsLink synchronously (Google Maps URL parameters)
  if (place.mapsLink && typeof place.mapsLink === 'string') {
    const m = place.mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
              place.mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
              place.mapsLink.match(/[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }

  // 4. Match Area / Address / Name with Known Neighborhood Coordinates
  const fullLocText = `${place.area || ''} ${place.address || ''} ${place.name || ''}`;
  for (const [areaName, areaCoord] of Object.entries(MANZALA_AREAS_COORDINATES)) {
    if (fullLocText.includes(areaName)) {
      const seed = Math.abs(hashString(place.id || place.slug || place.name || 'seed'));
      const latOffset = ((seed % 100) - 50) * 0.00004; // ~ ±180m distinct street spread
      const lngOffset = (((seed >> 3) % 100) - 50) * 0.00004;
      return {
        lat: areaCoord.lat + latOffset,
        lng: areaCoord.lng + lngOffset
      };
    }
  }

  // 5. Fallback: Base Manzala Center with unique deterministic street offset for each place
  const seed = Math.abs(hashString(place.id || place.slug || place.name || 'seed'));
  const latOffset = ((seed % 200) - 100) * 0.00005; // ~ ±350m distinct street spread
  const lngOffset = (((seed >> 4) % 200) - 100) * 0.00005;

  return {
    lat: MANZALA_CENTER.lat + latOffset,
    lng: MANZALA_CENTER.lng + lngOffset
  };
}

/**
 * Get User Live GPS Coordinates with Smart Multi-Tier Fallback
 * (High Accuracy -> Standard WiFi/Network Accuracy -> Permission Check)
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('متصفحك لا يدعم تحديد الموقع الجغرافي'));
      return;
    }

    // Attempt 1: High accuracy (mobile GPS)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        // If timeout or unavailable (common on PCs / laptops without GPS chip), fallback to standard accuracy
        if (err.code === 2 || err.code === 3) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
            },
            (fallbackErr) => {
              reject(fallbackErr);
            },
            {
              enableHighAccuracy: false,
              timeout: 12000,
              maximumAge: 300000
            }
          );
        } else {
          // Code 1: Permission Denied
          reject(err);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 120000
      }
    );
  });
}

/**
 * Sort array of places by proximity to user location
 */
export function sortPlacesByDistance(places = [], userCoords) {
  if (!userCoords || typeof userCoords.lat !== 'number' || typeof userCoords.lng !== 'number') {
    return places;
  }

  return places
    .map(place => {
      const coords = getPlaceCoords(place);
      const distanceKm = coords 
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
        : Infinity;
      return {
        ...place,
        _distanceKm: distanceKm,
        _distanceStr: formatDistance(distanceKm)
      };
    })
    .sort((a, b) => a._distanceKm - b._distanceKm);
}

/**
 * Smart Google Maps Embed and Directions URL Generator
 * - Pinpoints exact building location with high zoom (z=17) or uses direct embed?pb= iframe
 * - Generates GPS Navigation Direct Link (الوصول للمكان عبر الخرائط)
 * - Returns { embedUrl, directLink, isPinpointed, lat, lng }
 */
export function resolveMapEmbedInfo(place) {
  let embedUrl = '';
  let directLink = place?.mapsLink || '';

  // 0. Direct Google Maps Embed URL or iframe code
  let rawLink = (place?.mapsEmbed || place?.mapsLink || '').trim();
  if (rawLink.includes('<iframe') || rawLink.includes('src=')) {
    const srcMatch = rawLink.match(/src=["']([^"']+)["']/i);
    if (srcMatch) rawLink = srcMatch[1].trim();
  }

  if (rawLink.includes('google.com/maps/embed') || rawLink.includes('google.com/maps?pb=')) {
    embedUrl = rawLink;
    const pbLat = rawLink.match(/!3d(-?\d+\.\d+)/);
    const pbLng = rawLink.match(/!2d(-?\d+\.\d+)/) || rawLink.match(/!4d(-?\d+\.\d+)/);
    if (pbLat && pbLng) {
      const lat = parseFloat(pbLat[1]);
      const lng = parseFloat(pbLng[1]);
      directLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      return { embedUrl, directLink, isPinpointed: true, lat, lng };
    }
    if (!directLink || directLink.includes('<iframe')) {
      directLink = rawLink.replace('/embed', '');
    }
    return { embedUrl, directLink, isPinpointed: true };
  }

  // 1. Exact coordinates from place.location
  if (place?.location && place.location.lat && place.location.lng) {
    const lat = Number(place.location.lat);
    const lng = Number(place.location.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=ar&z=17&output=embed`;
      directLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      return { embedUrl, directLink, isPinpointed: true, lat, lng };
    }
  }

  // 2. Direct lat / lng attributes
  if (place?.lat && place?.lng) {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=ar&z=17&output=embed`;
      directLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      return { embedUrl, directLink, isPinpointed: true, lat, lng };
    }
  }

  // 3. Direct Coordinates inside mapsLink (@lat,lng or !3dlat!4dlng or q=lat,lng)
  if (place?.mapsLink) {
    const m = place.mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
              place.mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
              place.mapsLink.match(/[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=ar&z=17&output=embed`;
        directLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        return { embedUrl, directLink, isPinpointed: true, lat, lng };
      }
    }
  }

  // 4. Fallback based on known Village / Neighborhood coordinates
  const areaName = place?.area || '';
  const addressText = place?.address || '';
  const placeName = place?.name || '';

  for (const [vName, coord] of Object.entries(MANZALA_AREAS_COORDINATES)) {
    if (areaName.includes(vName) || addressText.includes(vName)) {
      embedUrl = `https://maps.google.com/maps?q=${coord.lat},${coord.lng}&hl=ar&z=16&output=embed`;
      directLink = `https://www.google.com/maps/dir/?api=1&destination=${coord.lat},${coord.lng}`;
      return { embedUrl, directLink, isPinpointed: false, lat: coord.lat, lng: coord.lng };
    }
  }

  // 5. Query Search Target
  const queryTarget = `${placeName} ${areaName} المنزلة الدقهلية`.trim();
  embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(queryTarget)}&hl=ar&z=16&output=embed`;
  if (!directLink) directLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryTarget)}`;

  return { embedUrl, directLink, isPinpointed: false };
}
