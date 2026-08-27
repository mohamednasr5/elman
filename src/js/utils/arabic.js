/**
 * المنزلة وناسها — Arabic Text Utilities
 * Normalization for better Arabic search and display
 */

/**
 * Normalize Arabic text for search comparison.
 * Handles common variations in Arabic letters.
 */
export function normalizeArabic(text) {
  if (!text) return '';

  let cleaned = text
    // Normalize Alef variants
    .replace(/[أإآا]/g, 'ا')
    // Normalize Hamza variants
    .replace(/[ؤئ]/g, 'ء')
    // Remove Tashkeel (diacritics)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Teh Marbuta and Heh
    .replace(/[ةه]/g, 'ه')
    // Normalize Yeh variants
    .replace(/[يى]/g, 'ي')
    // Normalize Waw
    .replace(/و/g, 'و')
    // Remove Tatweel
    .replace(/\u0640/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return cleaned;
}

/**
 * Extract root search term by stripping common conversational question phrases
 * e.g. "فين في المنزلة سباك" -> "سباك", "مين في المنزلة دكتور" -> "دكتور"
 */
export function extractSearchKeywords(text) {
  if (!text) return '';
  let normal = normalizeArabic(text);

  // Common conversational prefixes used by people in El Manzala
  const prefixes = [
    /^عند مين في المنزله\s*/,
    /^عند مين في\s*/,
    /^فين في المنزله\s*/,
    /^فين في\s*/,
    /^مين في المنزله\s*/,
    /^مين في\s*/,
    /^دليل المنزله\s*/,
    /^في المنزله\s*/,
    /\s*في المنزله$/
  ];

  for (const prefix of prefixes) {
    normal = normal.replace(prefix, '').trim();
  }

  return normal || normalizeArabic(text);
}

/**
 * Intelligent Semantic Intent & Synonym Expansion
 * Maps search terms to related Egyptian Arabic keywords, categories, and vehicle types.
 */
export function expandArabicSearchIntent(rawQuery) {
  if (!rawQuery) return [];
  const clean = normalizeArabic(extractSearchKeywords(rawQuery));
  const tokens = clean.split(/\s+/).filter(Boolean);

  const SYNONYM_CLUSTERS = [
    // 1. Cars, Rides, Deliveries, Vehicles
    ['سيارة', 'عربية', 'عربيات', 'سيارات', 'تاكسي', 'مشوار', 'مشاوير', 'سواق', 'رحلات', 'توصيل', 'شاحنة', 'دليفري', 'car', 'delivery', 'تكاتك', 'توكتوك', 'توك توك', 'موتوسيكل', 'موتسيكل', 'موتوسيكلات'],
    
    // 2. Doctors, Clinics, Medical
    ['دكتور', 'دكاترة', 'طبيب', 'اطباء', 'عيادة', 'عيادات', 'كشف', 'استشاري', 'اخصائي', 'مستشفى', 'معمل', 'تحاليل', 'doctor', 'clinic', 'medical'],

    // 3. Pharmacy, Medicine
    ['صيدلية', 'صيدليات', 'دواء', 'ادوية', 'علاج', 'روشتة', 'مستلزمات طبية', 'pharmacy'],

    // 4. Plumbing
    ['سباك', 'سباكة', 'مواسير', 'حنفية', 'حنفيات', 'خلاط', 'خلاطات', 'فلتر', 'فلاتر', 'سخان', 'سخانات', 'تسريب', 'تسريب مياه', 'صحي', 'ادوات صحية', 'plumber'],

    // 5. Carpentry & Furniture
    ['نجار', 'نجارة', 'موبيليا', 'خشب', 'اثاث', 'غرف نوم', 'انتريه', 'سفرة', 'ابواب', 'شبابيك', 'مطابخ', 'carpenter'],

    // 6. Electricity
    ['كهربائي', 'كهرباء', 'اضاءة', 'ليد', 'فيشة', 'مفاتيح كهرباء', 'لوحة كهرباء', 'تاسيس كهرباء', 'اسلاك', 'نجف', 'electrician'],

    // 7. Tiles & Ceramics
    ['مبلط', 'سيراميك', 'بورسلين', 'بلاط', 'ارضيات', 'تركيب سيراميك', 'رخام', 'جرانيت', 'tiler', 'marble'],

    // 8. Painting & Decor
    ['نقاش', 'نقاشة', 'دهان', 'دهانات', 'بويات', 'الوان', 'ديكور', 'ورق حائط', 'تشطيب', 'painter'],

    // 9. Food & Restaurants
    ['مطعم', 'مطاعم', 'اكل', 'وجبات', 'مشويات', 'شاورما', 'بيتزا', 'كريب', 'فول', 'طعمية', 'كشري', 'سمك', 'اسماك', 'مأكولات', 'ساندوتش', 'restaurant', 'food'],

    // 10. Cafes & Drinks
    ['كافيه', 'كافيهات', 'قهوة', 'مقهى', 'شاي', 'عصير', 'عصائر', 'مشروبات', 'cafe', 'coffee'],

    // 11. Phones & Tech
    ['موبايل', 'موبايلات', 'هاتف', 'هواتف', 'تليفون', 'تليفونات', 'جوال', 'شاحن', 'جراب', 'شاشة', 'صيانة موبايل', 'كمبيوتر', 'لاب توب', 'mobile', 'phones'],

    // 12. Bakery & Sweets
    ['مخبز', 'فرن', 'افران', 'عيش', 'خبز', 'حلواني', 'حلويات', 'تورتة', 'جاتوه', 'معجنات', 'bakery'],

    // 13. Barber & Beauty
    ['حلاق', 'حلاقة', 'كوافير', 'صالون', 'تجميل', 'شعر', 'مكياج', 'تجهيز عرسان', 'barber', 'beauty'],

    // 14. Auto Mechanics
    ['ميكانيكي', 'عفشة', 'كاوتش', 'غيار زيت', 'صيانة سيارات', 'تصليح عربيات', 'بطاريات', 'قطع غيار', 'mechanic'],

    // 15. Clothing & Fashion
    ['ملابس', 'لبس', 'ازياء', 'فستان', 'فساتين', 'بدل', 'عبايات', 'بنطلون', 'قميص', 'بوتيك', 'clothing', 'fashion'],

    // 16. Supermarket & Groceries
    ['سوبر ماركت', 'ماركت', 'هايبر', 'بقالة', 'خضار', 'فاكهة', 'جبن', 'البان', 'سلع غذائية', 'supermarket']
  ];

  const expanded = new Set([clean, ...tokens]);

  for (const cluster of SYNONYM_CLUSTERS) {
    const normalizedCluster = cluster.map(normalizeArabic);
    const hasMatch = tokens.some(t => normalizedCluster.some(c => c.includes(t) || t.includes(c))) ||
                     normalizedCluster.some(c => c.includes(clean) || clean.includes(c));
    if (hasMatch) {
      cluster.forEach(word => {
        expanded.add(normalizeArabic(word));
      });
    }
  }

  return Array.from(expanded);
}

/**
 * Check if Arabic text A matches/contains B (normalized)
 */
export function arabicMatch(haystack, needle) {
  const h = normalizeArabic(haystack);
  const n = normalizeArabic(needle);
  return h.includes(n);
}

/**
 * Score text match relevance for search ranking (0-100)
 */
export function arabicScore(text, query) {
  if (!text || !query) return 0;

  const normalText = normalizeArabic(text);
  const normalQuery = normalizeArabic(query);

  if (!normalText || !normalQuery) return 0;

  // Exact match
  if (normalText === normalQuery) return 100;

  // Starts with query
  if (normalText.startsWith(normalQuery)) return 85;

  // Contains query as whole word
  const wordBoundary = new RegExp(`(^|\\s)${escapeRegex(normalQuery)}(\\s|$)`);
  if (wordBoundary.test(normalText)) return 70;

  // Contains query anywhere
  if (normalText.includes(normalQuery)) return 50;

  // Partial match of words
  const queryWords = normalQuery.split(' ').filter(Boolean);
  const matchedWords = queryWords.filter(word => normalText.includes(word));
  if (matchedWords.length > 0) {
    return 30 * (matchedWords.length / queryWords.length);
  }

  return 0;
}

/**
 * Highlight matched text in HTML-safe way
 */
export function highlightMatch(text, query) {
  if (!text || !query) return escapeHtml(text || '');

  const normalQuery = normalizeArabic(query);
  if (!normalQuery) return escapeHtml(text);

  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query);

  // Simple case-insensitive highlight
  const regex = new RegExp(`(${escapeRegex(escapedQuery)})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

/**
 * Get Arabic day name
 */
export function getArabicDay(dayIndex) {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[dayIndex] ?? '';
}

/**
 * Get Arabic month name
 */
export function getArabicMonth(monthIndex) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthIndex] ?? '';
}

/**
 * Format number in Arabic/Egyptian locale
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '٠';
  return new Intl.NumberFormat('ar-EG').format(num);
}

/**
 * Format price in EGP
 */
export function formatPrice(price) {
  if (!price && price !== 0) return '';
  return `${formatNumber(price)} ج.م`;
}

/**
 * Calculate discount percentage
 */
export function calcDiscount(oldPrice, newPrice) {
  if (!oldPrice || !newPrice || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

// ── Private helpers ──

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
