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
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'k',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y',
  'ى': 'a', 'ئ': 'y', 'ؤ': 'w', 'ء': '',
  ' ': ' ', '،': '', '؟': '', '!': '',
  '.': '', ',': '', '/': '-', '\\': '-',
};

const COMMON_TERMS = {
  'دكتور': 'Dr.',
  'دكتورة': 'Dr.',
  'طبيب': 'Dr.',
  'صيدلية': 'Pharmacy',
  'محل': 'Store',
  'سوبر ماركت': 'Supermarket',
  'ماركت': 'Market',
  'هايبر': 'Hypermarket',
  'ورشة': 'Workshop',
  'نجار': 'Carpenter',
  'سباك': 'Plumber',
  'مبلط': 'Tiler',
  'نقاش': 'Painter',
  'كهربائي': 'Electrician',
  'حداد': 'Blacksmith',
  'ألوميتال': 'Alumital',
  'مطبعة': 'Printing Press',
  'دعاية': 'Advertising',
  'مخبز': 'Bakery',
  'حلواني': 'Pastry & Sweets',
  'عطارة': 'Spices & Herbs',
  'علف': 'Feeds',
  'دواجن': 'Poultry',
  'فراخ': 'Poultry',
  'معرض': 'Showroom',
  'سجاد': 'Carpets',
  'مراتب': 'Mattresses',
  'أجهزة': 'Appliances',
  'مكتب': 'Office',
  'شركة': 'Company',
  'مركز': 'Center',
  'استوديو': 'Studio',
  'ستوديو': 'Studio',
  'كافيه': 'Cafe',
  'مقهى': 'Cafe',
  'مطعم': 'Restaurant',
  'أسماك': 'Fish Restaurant',
  'مشويات': 'Grill',
  'شاورما': 'Shawarma',
  'فول': 'Foul',
  'فلافل': 'Falafel',
  'كوافير': 'Salon',
  'حلاق': 'Barber Shop',
  'مغسلة': 'Laundry',
  'مستشفى': 'Hospital',
  'عيادة': 'Clinic',
  'معمل': 'Lab',
  'تحاليل': 'Medical Lab'
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
 * Convert Arabic business name into proper capitalized English business name
 */
export function transliterateToEnglishName(text) {
  if (!text) return '';
  let result = text.trim();

  // Replace recognized business terms
  Object.keys(COMMON_TERMS).forEach(term => {
    const reg = new RegExp(`(^|\\s)${term}(\\s|$)`, 'gi');
    result = result.replace(reg, `$1${COMMON_TERMS[term]}$2`);
  });

  // Transliterate remaining Arabic words
  const words = result.split(/\s+/).map(word => {
    // If it is English already, keep it
    if (/^[A-Za-z0-9.'&-]+$/.test(word)) return word;
    // Transliterate Arabic word
    const latin = transliterateArabic(word);
    // Capitalize first letter
    return latin.charAt(0).toUpperCase() + latin.slice(1).toLowerCase();
  });

  return words.join(' ').trim();
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
 * Generate a clean, readable, short slug without random ID suffixes
 * e.g. "مهندس محمد حماد" -> "mhnds-mhmd-hmad"
 */
export function generateCleanSlug(text) {
  if (!text) return 'place';

  let slug = transliterateArabic(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')       // Remove non-word chars
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/-+/g, '-')            // Multiple hyphens to single
    .replace(/^-+|-+$/g, '');       // Trim hyphens

  return slug || 'place';
}

/**
 * Get the standardized canonical friendly URL for any place
 * Supports short path e.g. "/mhnds-mhmd-hmad" and relative navigation
 */
export function getPlaceUrl(placeOrSlug) {
  if (!placeOrSlug) return 'places.html';
  const slug = typeof placeOrSlug === 'string' ? placeOrSlug : (placeOrSlug.slug || placeOrSlug.id || placeOrSlug._key || '');
  if (!slug) return 'places.html';
  return `${encodeURIComponent(slug)}`;
}

/**
 * Get the full absolute URL for sharing and SEO
 */
export function getPlaceAbsoluteUrl(placeOrSlug) {
  const rel = getPlaceUrl(placeOrSlug);
  return `https://dalilmanzala.com/${rel.replace(/^\//, '')}`;
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
