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
      : size === IMAGE_SIZES.THUMB ? 360
      : size === IMAGE_SIZES.MEDIUM ? 1600
      : size === IMAGE_SIZES.COVER ? 1800
      : 2400;
    const quality = size === IMAGE_SIZES.LOGO ? 80
      : size === IMAGE_SIZES.THUMB ? 84
      : size === IMAGE_SIZES.MEDIUM ? 92
      : 94;
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

  if (cleanUrl.includes('r2.dev') || (R2_PUBLIC_URL && cleanUrl.includes(R2_PUBLIC_URL))) {
    const params = new URLSearchParams();
    if (size === IMAGE_SIZES.LOGO) {
      params.set('w', '90'); params.set('h', '90'); params.set('fit', 'cover'); params.set('q', '90');
    } else if (size === IMAGE_SIZES.THUMB) {
      params.set('w', '360'); params.set('h', '216'); params.set('fit', 'cover'); params.set('q', '88');
    } else if (size === IMAGE_SIZES.MEDIUM) {
      // The previous 800px profile variant was too small for large desktop
      // heroes and became visibly soft when stretched. Keep a high-resolution
      // variant for all detail/profile media.
      params.set('w', '1600'); params.set('h', '1000'); params.set('fit', 'cover'); params.set('q', '92');
    } else if (size === IMAGE_SIZES.COVER) {
      params.set('w', '1800'); params.set('h', '720'); params.set('fit', 'cover'); params.set('q', '94');
    } else {
      return cleanUrl;
    }
    params.set('src', cleanUrl);
    return '/api/image?' + params.toString();
  }

  return cleanUrl;
}
