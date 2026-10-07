/**
 * image-cdn.service.js
 * R2 & Cloudflare CDN Image Optimizer
 * Canonicalizes every R2 URL through the same-origin /api/r2 proxy.
 */
import { R2_PUBLIC_URL } from '../core/firebase.js';

export const IMAGE_SIZES = { LOGO:'logo', THUMB:'thumb', MEDIUM:'medium', COVER:'cover', ORIGINAL:'orig' };

const R2_PROXY_PATH = (() => {
  try {
    return new URL(R2_PUBLIC_URL, typeof window !== 'undefined' ? window.location.origin : 'https://dalilmanzala.com').pathname.replace(/\/+$/, '') || '/api/r2';
  } catch (_) {
    return '/api/r2';
  }
})();

// The Worker only allows transformations from this public R2 origin.  Keep the
// public origin here rather than sending an internal /api/r2 URL to /api/image,
// which would bypass Cloudflare's image-resizing path.
const R2_IMAGE_ORIGIN = 'https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev';

const TRANSFORM_DIMENSIONS = {
  [IMAGE_SIZES.LOGO]:   { width: 90, height: 90, quality: 82 },
  [IMAGE_SIZES.THUMB]:  { width: 300, height: 180, quality: 78 },
  [IMAGE_SIZES.MEDIUM]: { width: 600, height: 360, quality: 82 },
  [IMAGE_SIZES.COVER]:  { width: 1200, height: 630, quality: 85 },
  [IMAGE_SIZES.ORIGINAL]: { width: 1400, height: 0, quality: 88 }
};

function extractR2Key(value) {
  if (!value || typeof value !== 'string') return '';
  const clean = value.trim();
  if (!clean || clean.startsWith('data:') || /\.svg(?:\?|$)/i.test(clean)) return '';

  try {
    const u = new URL(clean, typeof window !== 'undefined' ? window.location.origin : 'https://dalilmanzala.com');
    const proxyPrefix = R2_PROXY_PATH + '/';

    // Already canonical: https://dalilmanzala.com/api/r2/<key> or /api/r2/<key>.
    if (u.pathname.startsWith(proxyPrefix)) return decodeURIComponent(u.pathname.slice(proxyPrefix.length));
    if (u.hostname.endsWith('.r2.dev')) return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
  } catch (_) {
    const proxyMatch = clean.match(/(?:https?:\/\/[^/]+)?\/api\/r2\/(.+)$/i);
    if (proxyMatch) return decodeURIComponent(proxyMatch[1].split('?')[0]);
    const r2Match = clean.match(/\.r2\.dev\/(.+)$/i);
    if (r2Match) return decodeURIComponent(r2Match[1].split('?')[0]);
  }

  return '';
}

export function getOptimizedImageUrl(url, size = IMAGE_SIZES.THUMB, timestamp = null) {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  if (!cleanUrl) return '';
  if (cleanUrl.startsWith('data:') || /\.svg(?:\?|$)/i.test(cleanUrl)) return cleanUrl;

  if (cleanUrl.includes('images.unsplash.com')) {
    const width = size === IMAGE_SIZES.LOGO ? 90 : (size === IMAGE_SIZES.THUMB ? 420 : (size === IMAGE_SIZES.MEDIUM ? 900 : (size === IMAGE_SIZES.COVER ? 1440 : 1800)));
    const quality = size === IMAGE_SIZES.LOGO ? 82 : (size === IMAGE_SIZES.THUMB ? 82 : 88);
    try {
      const u = new URL(cleanUrl);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      if (size === IMAGE_SIZES.LOGO) u.searchParams.set('h', '90');
      else if (size === IMAGE_SIZES.THUMB) u.searchParams.set('h', '236');
      else if (size === IMAGE_SIZES.MEDIUM) u.searchParams.set('h', '560');
      else if (size === IMAGE_SIZES.COVER) u.searchParams.set('h', '630');
      return u.toString();
    } catch (_) {
      return cleanUrl;
    }
  }

  const r2Key = extractR2Key(cleanUrl);
  if (r2Key) {
    const transform = TRANSFORM_DIMENSIONS[size] || TRANSFORM_DIMENSIONS[IMAGE_SIZES.THUMB];
    const source = `${R2_IMAGE_ORIGIN}/${encodeURI(r2Key)}`;
    const params = new URLSearchParams({
      src: source,
      w: String(transform.width),
      q: String(transform.quality),
      fit: 'cover'
    });
    if (transform.height) params.set('h', String(transform.height));
    if (timestamp) params.set('v', String(timestamp));
    return `/api/image?${params.toString()}`;
  }

  return cleanUrl;
}
