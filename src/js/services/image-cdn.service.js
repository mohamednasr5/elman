/**
 * image-cdn.service.js
 * R2 & Cloudflare CDN Image Optimizer
 * Provides 3 standardized responsive WebP sizes (thumb, medium, original)
 * to prevent loading large images in lists and search results.
 */

import { R2_PUBLIC_URL } from '../core/firebase.js';

export const IMAGE_SIZES = {
  LOGO: 'logo',      // 88-100px (44px display at 2x DPR)
  THUMB: 'thumb',    // 280-320px (Lists, Cards, Search Results, Grids)
  MEDIUM: 'medium',  // 600-800px (Place Detail Page, Hero, Headers)
  ORIGINAL: 'orig'   // Original Full Resolution (Lightbox, Zoom)
};

/**
 * Transforms an image URL to its optimal size variant.
 * Supports Cloudflare image resizing / R2 path conventions / Unsplash params.
 * 
 * @param {string} url - Source image URL
 * @param {'logo'|'thumb'|'medium'|'orig'} size - Desired size
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(url, size = IMAGE_SIZES.THUMB) {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

  // 1. Data URLs / Local SVGs -> Return untouched
  if (cleanUrl.startsWith('data:') || cleanUrl.endsWith('.svg')) {
    return cleanUrl;
  }

  // 2. Unsplash URLs -> Optimize using URL query parameters (w, q, auto=format)
  if (cleanUrl.includes('images.unsplash.com')) {
    const width = size === IMAGE_SIZES.LOGO ? 90 : (size === IMAGE_SIZES.THUMB ? 300 : (size === IMAGE_SIZES.MEDIUM ? 800 : 1400));
    const quality = (size === IMAGE_SIZES.LOGO || size === IMAGE_SIZES.THUMB) ? 75 : 85;
    try {
      const u = new URL(cleanUrl);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      if (size === IMAGE_SIZES.LOGO) {
        u.searchParams.set('h', '90');
      } else if (size === IMAGE_SIZES.THUMB) {
        u.searchParams.set('h', '180');
      }
      return u.toString();
    } catch (_) {
      return cleanUrl;
    }
  }

  // 3. Cloudflare R2 / Worker Resizing URLs
  if (cleanUrl.includes('r2.dev') || (R2_PUBLIC_URL && cleanUrl.includes(R2_PUBLIC_URL))) {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    if (size === IMAGE_SIZES.LOGO && !cleanUrl.includes('w=')) {
      return `${cleanUrl}${separator}w=90&h=90&fit=crop&q=80&format=webp`;
    }
    if (size === IMAGE_SIZES.THUMB && !cleanUrl.includes('w=')) {
      return `${cleanUrl}${separator}w=300&q=80&format=webp`;
    }
    if (size === IMAGE_SIZES.MEDIUM && !cleanUrl.includes('w=')) {
      return `${cleanUrl}${separator}w=800&q=85&format=webp`;
    }
  }

  return cleanUrl;
}
