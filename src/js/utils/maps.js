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
