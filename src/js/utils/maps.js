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

/** Complete List of 55 Towns and villages */
export const MANZALA_VILLAGES_LIST = [
  'المنزلة',
  'المطرية',
  'الجمالية',
  'العصافرة',
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
 * Haversine distance between two GPS coordinates in kilometers.
 * Returns Infinity for invalid coordinates.
 */
export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const a = [lat1, lng1, lat2, lng2].map(Number);
  if (a.some(v => !Number.isFinite(v))) return Infinity;
  const [p1, l1, p2, l2] = a;
  const rad = Math.PI / 180;
  const dLat = (p2 - p1) * rad;
  const dLng = (l2 - l1) * rad;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1 * rad) * Math.cos(p2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Format a distance for Egyptian Arabic UI.
 */
export function formatDistance(distanceKm) {
  const km = Number(distanceKm);
  if (!Number.isFinite(km)) return '—';
  if (km < 1) return `${Math.round(km * 1000)} متر`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} كم`;
}

/**
 * Read stored place coordinates without inventing a fallback pin.
 */
export function getPlaceCoords(place) {
  const p = place || {};
  const location = p.location || p.coordinates || {};
  const lat = Number(p.lat ?? p.latitude ?? location.lat ?? location.latitude);
  const lng = Number(p.lng ?? p.longitude ?? location.lng ?? location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/**
 * Reference point used only when a user has not granted live GPS.
 * This is a UI/search origin, never assigned to a business record.
 */
export const MANZALA_CENTER = Object.freeze({
  lat: 31.1578,
  lng: 31.9367,
  accuracy: null,
  source: 'directory_reference'
});

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
  const p = place || {};
  let directLink = typeof p.mapsLink === 'string' ? p.mapsLink.trim() : '';
  let rawLink = typeof p.mapsEmbed === 'string' ? p.mapsEmbed.trim() : directLink;

  if (rawLink.includes('<iframe') || rawLink.includes('src=')) {
    const match = rawLink.match(/src=["']([^"']+)["']/i);
    if (match) rawLink = match[1].trim();
  }

  if (rawLink.includes('google.com/maps/embed') || rawLink.includes('google.com/maps?pb=')) {
    const pbLat = rawLink.match(/!3d(-?\d+(?:\.\d+)?)/);
    const pbLng = rawLink.match(/!2d(-?\d+(?:\.\d+)?)/) || rawLink.match(/!4d(-?\d+(?:\.\d+)?)/);
    if (pbLat && pbLng) {
      const lat = Number(pbLat[1]), lng = Number(pbLng[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        directLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        return { embedUrl: rawLink, directLink, isPinpointed: true, lat, lng };
      }
    }
    directLink = rawLink.replace('/embed','');
    return { embedUrl: rawLink, directLink, isPinpointed: false };
  }

  const coords = getPlaceCoords(p);
  if (coords) {
    const embedUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=ar&z=18&output=embed`;
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    return { embedUrl, directLink: directions, isPinpointed: true, lat: coords.lat, lng: coords.lng };
  }

  // No stored coordinates: use a real Google Maps search query, never an invented pin.
  const query = [p.name || '', p.address || '', p.area || '', 'الدقهلية', 'مصر'].filter(Boolean).join(', ');
  const search = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return {
    embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=ar&z=16&output=embed`,
    directLink: directLink || search,
    searchLink: search,
    isPinpointed: false
  };
}
