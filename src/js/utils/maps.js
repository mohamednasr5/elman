/**
 * المنزلة وناسها — Maps & Location Helper
 * Extract coordinates from Google Maps short links, Plus codes, or GPS.
 */

import { WORKER_URL } from '../core/firebase.js';

export async function extractCoordinates(urlOrText) {
  if (!urlOrText || typeof urlOrText !== 'string') return null;
  const input = urlOrText.trim();

  // 1. Direct Regex for Lat/Lng (e.g. 31.1940, 31.9814 or @31.1940,31.9814)
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

  // 2. If it's a URL (e.g. maps.app.goo.gl or goo.gl/maps or google.com/maps)
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

/** Default Coordinates for El-Manzala Center (مدينة المنزلة) */
export const MANZALA_CENTER = { lat: 31.1578, lng: 31.9356 };

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
    const meters = Math.round(distanceKm * 1000);
    return `${meters} متر`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

/**
 * Get Place Coordinates from place object (location object, mapsLink, or default)
 */
export function getPlaceCoords(place) {
  if (!place) return null;
  if (place.location && typeof place.location.lat === 'number' && typeof place.location.lng === 'number') {
    return { lat: place.location.lat, lng: place.location.lng };
  }
  if (place.lat && place.lng) {
    return { lat: parseFloat(place.lat), lng: parseFloat(place.lng) };
  }
  // Try extracting from mapsLink synchronously if contains @lat,lng
  if (place.mapsLink) {
    const m = place.mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
              place.mapsLink.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    }
  }
  return null;
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
        if (err.code === 2 || err.code === 3) { // 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
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
          // Code 1: Permission Denied (User clicked "Block" or site permissions restricted)
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
