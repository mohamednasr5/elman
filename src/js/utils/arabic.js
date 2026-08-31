/**
 * المنزلة وناسها — Arabic Text Utilities & Advanced Egyptian Dialect NLP
 * Normalization for better Arabic search, food cravings, product matching, and intents.
 */

/**
 * Normalize Arabic text for search comparison.
 * Handles all common variations in Arabic letters (أ إ آ ا ٱ, ؤ و, ي ى ئ, ة ه, Tashkeel, Hamzas, Tatweel).
 */
export function normalizeArabic(text) {
  if (!text) return '';

  return String(text)
    .replace(/[أإآاٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/[يىئ]/g, 'ي')
    .replace(/[ةه]/g, 'ه')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[ء]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()؟،\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Remove definite article (ال) from the beginning of Arabic words
 */
export function stripAl(text) {
  if (!text) return '';
  return text.split(/\s+/).map(w => (w.startsWith('ال') && w.length > 3) ? w.slice(2) : w).join(' ');
}

/**
 * Extract root search keyword & detect Egyptian conversational intents
 * (Open Now, Nearest, Best/Top Rated, Food Cravings, Product/Offer requests)
 */
export function extractSmartDialectKeyword(text) {
  if (!text) return { keyword: '', wantsOpenNow: false, wantsNearest: false, wantsBest: false, wantsOffer: false };
  let norm = normalizeArabic(text);

  const wantsOpenNow = Boolean(
    norm.includes('فاتح') || norm.includes('مفتوح') || norm.includes('شغال') || 
    norm.includes('دلوقت') || norm.includes('حاليا') || norm.includes('24 ساعه') || norm.includes('طول اليوم')
  );

  const wantsNearest = Boolean(
    norm.includes('قريب') || norm.includes('جنب') || norm.includes('جمب') || norm.includes('اقرب')
  );

  const wantsBest = Boolean(
    norm.includes('شاطر') || norm.includes('احسن') || norm.includes('افضل') || 
    norm.includes('ممتاز') || norm.includes('كويس') || norm.includes('اعلى تقييم') || norm.includes('نمره واحد') || norm.includes('رقم واحد')
  );

  const wantsOffer = Boolean(
    norm.includes('عرض') || norm.includes('عروض') || norm.includes('خصم') || norm.includes('تخفيض') || norm.includes('اوفر')
  );

  // 1. Multi-pass strip conversational Egyptian prefixes including cravings & requests
  const prefixes = [
    /^(عاوز|عايز|عاوزه|عايزه|محتاج|محتاجه|محتاجين)\s*/i,
    /^(نفسي في|نفسي اكل|نفسي اشرب|نفسي اجيب|بدور على|بدور لي على|بدورلي على|عايز اكل|عاوز اكل|عايز اجيب|عاوز اجيب)\s*/i,
    /^(احسن حد بيعمل|افضل حد بيعمل|اشطر حد بيعمل|مين احسن حد بيعمل|مين بيعمل|مين بيقدم|مين عنده|فين احسن|فين افضل|حد بيعمل|حد بيقدم|بيعمل|بيقدم)\s*/i,
    /^(ابحث عن|ابحث لي عن|ابحثلي عن|دورلي على|دور على|شوفلي|وريني|هاتلي|قولي على)\s*/i,
    /^(فين في المنزله والمطريه|فين في المنزله|فين في المطريه|فين مكان|فين اقرب|فين|عند مين في المنزله|عند مين في المطريه|مين في المنزله|مين في المطريه|مين احسن|مين افضل|مين اشطر|مين)\s*/i,
    /^(دليل المنزله والمطريه|دليل المنزله|دليل المطريه|محلات المنزله|محلات المطريه|خدمات المنزله|خدمات المطريه)\s*/i,
    /^(عروض علي|عروض على|خصومات على|خصومات علي|تخفيضات على|تخفيضات علي|اسعار|سعر)\s*/i,
    /^(لو سمحت|من فضلك|بالله عليك|يا ريت|اقرب|احسن|افضل|اشطر|مطعم بيعمل|مطعم بيقدم|محل بيعمل|محل بيقدم)\s*/i
  ];

  let prev = '';
  while (prev !== norm) {
    prev = norm;
    for (const p of prefixes) {
      norm = norm.replace(p, '').trim();
    }
  }

  // 2. Strip state modifiers & dialect suffixes
  const dialectWords = [
    /\s*(في المنزله والمطريه|في المنزله|في المطريه|بالمنزله|بالمطريه|في مدينة المنزله)$/gi,
    /\s*(فاتح دلوقتي|فاتحه دلوقتي|مفتوح دلوقتي|مفتوحه دلوقتي|شغال دلوقتي|شغاله دلوقتي|فاتح دلوقتى|فاتحه دلوقتى|مفتوح دلوقتى|مفتوحه دلوقتى|شغال دلوقتى|شغاله دلوقتى|فاتح بليل|فاتح الصبح|فاتح|فاتحه|مفتوح|مفتوحه|شغال|شغاله|دلوقتي|دلوقتى|دلوقت|حاليا|النهارده|بليل|بالليل|الصبح)$/gi,
    /\s*(قريب مني|قريبه مني|قريب|قريبه|جنبي|جمبي|شاطر|شاطره|ممتاز|ممتازه)$/gi
  ];

  for (const d of dialectWords) {
    norm = norm.replace(d, '').trim();
  }

  return {
    keyword: norm || normalizeArabic(text),
    wantsOpenNow,
    wantsNearest,
    wantsBest,
    wantsOffer
  };
}

export function extractSearchKeywords(text) {
  return extractSmartDialectKeyword(text).keyword;
}

/**
 * Intelligent Semantic Intent & Synonym Expansion
 * Maps search terms to related Egyptian Arabic keywords, food items, products, categories.
 */
export function expandArabicSearchIntent(rawQuery) {
  if (!rawQuery) return [];
  const clean = normalizeArabic(extractSearchKeywords(rawQuery));
  const tokens = clean.split(/\s+/).filter(Boolean);

  const SYNONYM_CLUSTERS = [
    // 1. Pizza & Italian & Pies
    ['بيتزا', 'بيزا', 'بيتزات', 'فطير', 'فطاير', 'فطيرة', 'بيتزا ايطالي', 'بيتزا شرقي', 'مارجريتا', 'مشكل جبن', 'بيبروني', 'سجق', 'بسطرمة', 'pizza', 'مطعم', 'اكل', 'وجبات'],

    // 2. Shawarma & Syrian Foods
    ['شاورما', 'شاورمه', 'شاورمات', 'سوري', 'شاورما فراخ', 'شاورما لحمة', 'فتة شاورما', 'ثومية', 'تومية', 'ساندوتش سوري', 'shawarma', 'مطعم', 'اكل'],

    // 3. Crepes & Waffles
    ['كريب', 'كريبات', 'وافل', 'بان كيك', 'كريب كرانشي', 'كريب بانيه', 'كريب شاورما', 'كريب نوتيلا', 'crepe', 'waffle', 'مطعم', 'كافيه'],

    // 4. Burgers & Fried Chicken
    ['برجر', 'برغر', 'سماش برجر', 'فرايد تشيكن', 'بروستد', 'دجاج مقلي', 'زنجر', 'استربس', 'burger', 'fried chicken', 'مطعم', 'وجبات'],

    // 5. Grills & BBQ
    ['مشويات', 'مشوي', 'حاتي', 'كباب', 'كفتة', 'كفته', 'طرب', 'فراخ مشوية', 'شيش طاووق', 'ريش', 'حواوشي', 'grill', 'kebab', 'مطعم'],

    // 6. Fish & Seafood
    ['سمك', 'اسماك', 'أسماك', 'سي فود', 'ماكولات بحرية', 'جمبري', 'سبيط', 'كابوريا', 'سمك مشوي', 'سمك مقلي', 'فسخاني', 'فسيخ', 'رنجة', 'fish', 'seafood', 'مطعم'],

    // 7. Koshari & Casseroles
    ['كشري', 'طاجن', 'طواجن', 'مكرونة بشاميل', 'دقة', 'صلصة', 'koshari', 'مطعم'],

    // 8. Sweets, Cakes, Ice Cream, Bakery
    ['تورتة', 'تورته', 'تورت', 'جاتوه', 'جاتوهات', 'حلويات', 'حلواني', 'بسبوسة', 'كنافة', 'كنافه', 'قطايف', 'ايس كريم', 'مخبز', 'عيش', 'فينو', 'كرواسون', 'باتيه', 'sweets', 'cake', 'bakery'],

    // 9. Juices & Cafes
    ['عصير', 'عصائر', 'قصب', 'مانجو', 'فراولة', 'كوكتيل', 'سموزي', 'قهوة', 'اسبريسو', 'ايس كوفي', 'شاي', 'juice', 'coffee', 'cafe', 'كافيه', 'كافيهات'],

    // 10. Doctors, Clinics, Medical
    ['دكتور', 'دكاترة', 'طبيب', 'اطباء', 'عيادة', 'عيادات', 'كشف', 'استشاري', 'اخصائي', 'مستشفى', 'معمل', 'تحاليل', 'doctor', 'clinic', 'medical'],

    // 11. Pharmacy, Medicine
    ['صيدلية', 'صيدليات', 'دواء', 'ادوية', 'علاج', 'روشتة', 'مستلزمات طبية', 'pharmacy'],

    // 12. Supermarket & Groceries
    ['سوبر ماركت', 'ماركت', 'هايبر', 'بقالة', 'خضار', 'فاكهة', 'جبن', 'البان', 'سلع غذائية', 'شيبسي', 'زيت', 'سكر', 'ارز', 'مكرونة', 'supermarket'],

    // 13. Craftsmen & Home Services
    ['سباك', 'سباكة', 'مواسير', 'حنفية', 'خلاط', 'سخان', 'فلتر', 'نجار', 'نجارة', 'موبيليا', 'ابواب', 'كهربائي', 'كهرباء', 'اضاءة', 'مبلط', 'سيراميك', 'بلاط', 'نقاش', 'دهانات', 'بويات', 'plumber', 'electrician', 'carpenter'],

    // 14. Auto Mechanics & Transportation
    ['ميكانيكي', 'عفشة', 'كاوتش', 'غيار زيت', 'صيانة سيارات', 'تصليح عربيات', 'بطاريات', 'قطع غيار', 'سيارة', 'عربية', 'تاكسي', 'مشوار', 'مشاوير', 'توكتوك', 'موتوسيكل', 'توصيل', 'mechanic', 'car', 'delivery'],

    // 15. Phones & Tech
    ['موبايل', 'موبايلات', 'هاتف', 'هواتف', 'تليفون', 'شاحن', 'جراب', 'شاشة', 'صيانة موبايل', 'كمبيوتر', 'لاب توب', 'mobile', 'phones'],

    // 16. ATM & Cash Machines
    ['atm', 'اي تي ام', 'صراف', 'صراف الي', 'ماكينة صرف', 'ماكينة فلوس', 'سحب فلوس', 'ايداع فلوس', 'سحب كاش']
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
 * Check if Arabic text A matches/contains B (smart & flexible)
 * Handles letter normalization, with/without 'ال', word-level matching
 */
export function arabicMatch(haystack, needle) {
  if (!needle) return true;
  if (!haystack) return false;

  const h = normalizeArabic(haystack);
  const n = normalizeArabic(needle);

  if (!n) return true;
  if (!h) return false;

  // 1. Direct contains after full normalization
  if (h.includes(n)) return true;

  // 2. Query without 'ال' matching haystack
  const nNoAl = stripAl(n);
  if (nNoAl && nNoAl !== n && h.includes(nNoAl)) return true;

  // 3. Haystack without 'ال' matching query or query without 'ال'
  const hNoAl = stripAl(h);
  if (hNoAl && (hNoAl.includes(n) || (nNoAl && hNoAl.includes(nNoAl)))) return true;

  // 4. Token-by-token matching (e.g. multi-word search)
  const nTokens = n.split(/\s+/).filter(Boolean);
  if (nTokens.length > 1) {
    const allTokensMatch = nTokens.every(tok => {
      const tokNoAl = stripAl(tok);
      return h.includes(tok) || (tokNoAl && h.includes(tokNoAl)) || (hNoAl && hNoAl.includes(tok));
    });
    if (allTokensMatch) return true;
  }

  return false;
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

  // Exact match without 'ال'
  const nQueryNoAl = stripAl(normalQuery);
  const nTextNoAl = stripAl(normalText);
  if (nTextNoAl === nQueryNoAl) return 95;

  // Starts with query
  if (normalText.startsWith(normalQuery)) return 85;
  if (nTextNoAl.startsWith(nQueryNoAl)) return 80;

  // Contains query as whole word
  const wordBoundary = new RegExp(`(^|\\s)${escapeRegex(normalQuery)}(\\s|$)`);
  if (wordBoundary.test(normalText)) return 70;

  // Contains query anywhere
  if (normalText.includes(normalQuery)) return 55;
  if (nQueryNoAl && normalText.includes(nQueryNoAl)) return 50;
  if (nTextNoAl && nTextNoAl.includes(normalQuery)) return 50;
  if (nTextNoAl && nQueryNoAl && nTextNoAl.includes(nQueryNoAl)) return 45;

  // Partial match of words
  const queryWords = normalQuery.split(' ').filter(Boolean);
  const matchedWords = queryWords.filter(word => {
    const wordNoAl = stripAl(word);
    return normalText.includes(word) || (wordNoAl && normalText.includes(wordNoAl));
  });
  if (matchedWords.length > 0) {
    return 35 * (matchedWords.length / queryWords.length);
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
