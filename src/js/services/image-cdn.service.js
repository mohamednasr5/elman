/**
 * image-cdn.service.js
 * R2 & Cloudflare CDN Image Optimizer
 * Responsive image variants for logos, cards, profile covers and originals.
 */

import { R2_PUBLIC_URL } from '../core/firebase.js';

export const IMAGE_SIZES = {
  LOGO: 'logo',
  THUMB: 'thumb',
  MEDIUM: 'medium',
  COVER: 'cover',
  ORIGINAL: 'orig'
};

export function getOptimizedImageUrl(url, size = IMAGE_SIZES.THUMB) {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

  if (cleanUrl.startsWith('data:') || cleanUrl.endsWith('.svg')) return cleanUrl;

  if (cleanUrl.includes('images.unsplash.com')) {
    const width = size === IMAGE_SIZES.LOGO ? 90
      : size === IMAGE_SIZES.THUMB ? 900
      : size === IMAGE_SIZES.MEDIUM ? 2200
      : size === IMAGE_SIZES.COVER ? 2400
      : 3000;
    const quality = size === IMAGE_SIZES.LOGO ? 85
      : size === IMAGE_SIZES.THUMB ? 92
      : 95;
    try {
      const u = new URL(cleanUrl);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'max');
      return u.toString();
    } catch (_) {
      return cleanUrl;
    }
  }

  // R2 public objects are already served from the project's CDN. Do not route
  // them through /api/image here: that transformation endpoint can be absent
  // on older deployments and produces broken <img> requests. The original
  // object is the quality ceiling and lets the browser perform the final
  // display-size downscaling without introducing an artificial low-res source.
  if (cleanUrl.includes('r2.dev') || (R2_PUBLIC_URL && cleanUrl.includes(R2_PUBLIC_URL))) {
    return cleanUrl;
  }

  return cleanUrl;
}
