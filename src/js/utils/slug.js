/**
 * المنزلة وناسها — URL Slug Generator
 */

/**
 * Generate a URL-safe slug from Arabic or mixed text.
 * - Arabic text is transliterated to Latin
 * - Spaces become hyphens
 * - Special chars removed
 * - Guaranteed to be unique when combined with a random suffix
 */

const ARABIC_MAP = {
  'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y',
  'ى': 'a', 'ئ': 'y', 'ؤ': 'w', 'ء': '',
  ' ': '-', '،': '', '؟': '', '!': '',
  '.': '', ',': '', '/': '-', '\\': '-',
};

/**
 * Transliterate Arabic text to Latin
 */
export function transliterateArabic(text) {
  if (!text) return '';
  return text
    .split('')
    .map(char => ARABIC_MAP[char] ?? char)
    .join('');
}

/**
 * Generate a clean URL slug
 */
export function generateSlug(text, id = null) {
  if (!text) return id ? `place-${id.slice(0, 8)}` : 'place';

  let slug = transliterateArabic(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')       // Remove non-word chars
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/-+/g, '-')            // Multiple hyphens to single
    .replace(/^-+|-+$/g, '');       // Trim hyphens

  if (!slug) slug = 'place';

  // Append short ID for uniqueness
  const suffix = id ? id.slice(-6) : Math.random().toString(36).slice(2, 8);
  return `${slug}-${suffix}`;
}

/**
 * Generate slug from place name + ID
 */
export function generatePlaceSlug(name, placeId) {
  return generateSlug(name, placeId);
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 100;
}

/**
 * Generate a unique push ID (client-side, similar to Firebase push keys)
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
