/**
 * المنزلة وناسها — Arabic Text Utilities & Advanced Egyptian Dialect NLP
 * Ultra Normalization for Arabic letters (أ إ آ ا ٱ, ؤ و, ي ى ئ, ة ه, Tashkeel, Hamzas, Tatweel).
 */

/**
 * Normalize Arabic text for search comparison.
 * Ignores all variations in Arabic letters (أ إ آ ا ٱ, ؤ و, ي ى ئ, ة ه, Tashkeel, Hamzas, Tatweel).
 */
export function normalizeArabic(text) {
  if (!text) return '';

  return String(text)
    // 1. Normalize all Alef forms (أ, إ, آ, ا, ٱ) to plain Alef (ا)
    .replace(/[أإآاٱ]/g, 'ا')
    // 2. Normalize Waw with Hamza (ؤ) to plain Waw (و)
    .replace(/ؤ/g, 'و')
    // 3. Normalize all Yeh variants (ي, ى, ئ) to plain Yeh (ي)
    .replace(/[يىئ]/g, 'ي')
    // 4. Normalize Teh Marbuta (ة) and Heh (ه) to (ه)
    .replace(/[ةه]/g, 'ه')
    // 5. Remove Tashkeel (diacritics) & Tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // 6. Remove standalone Hamzas & quotes
    .replace(/[ء`'"]/g, '')
    // 7. Remove punctuation & symbols
    .replace(/[.,/#!$%^&*;:{}=\-_~()؟،\|]/g, ' ')
    // 8. Collapse multiple spaces
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

  // 1. Multi-pass strip conversational Egyptian prefixes
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

  let prevSuffix = '';
  while (prevSuffix !== norm) {
    prevSuffix = norm;
    for (const d of dialectWords) {
      norm = norm.replace(d, '').trim();
    }
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
 * Comprehensive Semantic Intent & Synonym Expansion for Egyptian Search
 */
export function expandArabicSearchIntent(rawQuery) {
  if (!rawQuery) return [];
  const clean = normalizeArabic(extractSearchKeywords(rawQuery));
  const tokens = clean.split(/\s+/).filter(Boolean);

  const SYNONYM_CLUSTERS = [
    // 1. Roastery, Nuts, Coffee & Snacks (محامص وتسالي وبن ومكسرات)
    ['محمصة', 'محمصه', 'محامص', 'تسالي', 'لب', 'سوداني', 'مكسرات', 'كاجو', 'فستق', 'بندق', 'عين جمل', 'شيكولاتة', 'شوكولاتة', 'بن', 'بن ومكسرات', 'حلويات', 'مقرمشات', 'البدوي', 'السيد البدوي', 'roastery', 'nuts', 'coffee'],

    // 2. Pizza & Italian & Pies (بيتزا وفطير)
    ['بيتزا', 'بيزا', 'بيتزات', 'فطير', 'فطاير', 'فطيرة', 'بيتزا ايطالي', 'بيتزا شرقي', 'مارجريتا', 'مشكل جبن', 'بيبروني', 'سجق', 'بسطرمة', 'pizza', 'مطعم', 'اكل', 'وجبات'],

    // 3. Shawarma & Syrian Foods (شاورما وسوري)
    ['شاورما', 'شاورمه', 'شاورمات', 'سوري', 'شاورما فراخ', 'شاورما لحمة', 'فتة شاورما', 'ثومية', 'تومية', 'ساندوتش سوري', 'shawarma', 'مطعم', 'اكل'],

    // 4. Crepes & Waffles (كريب ووافل)
    ['كريب', 'كريبات', 'وافل', 'بان كيك', 'كريب كرانشي', 'كريب بانيه', 'كريب شاورما', 'كريب نوتيلا', 'crepe', 'waffle', 'مطعم', 'كافيه'],

    // 5. Burgers & Fried Chicken (برجر وفرايد تشيكن)
    ['برجر', 'برغر', 'سماش برجر', 'فرايد تشيكن', 'بروستد', 'دجاج مقلي', 'زنجر', 'استربس', 'burger', 'fried chicken', 'مطعم', 'وجبات'],

    // 6. Grills & BBQ (مشويات وحاتي)
    ['مشويات', 'مشوي', 'حاتي', 'كباب', 'كفتة', 'كفته', 'طرب', 'فراخ مشوية', 'شيش طاووق', 'ريش', 'حواوشي', 'grill', 'kebab', 'مطعم'],

    // 7. Fish & Seafood (أسماك ومأكولات بحرية وفسخانية)
    ['سمك', 'اسماك', 'أسماك', 'سي فود', 'ماكولات بحرية', 'جمبري', 'سبيط', 'كابوريا', 'سمك مشوي', 'سمك مقلي', 'فسخاني', 'فسيخ', 'رنجة', 'fish', 'seafood', 'مطعم'],

    // 8. Koshari & Casseroles (كشري وطواجن)
    ['كشري', 'طاجن', 'طواجن', 'مكرونة بشاميل', 'دقة', 'صلصة', 'koshari', 'مطعم'],

    // 9. Sweets, Cakes, Ice Cream, Bakery (حلويات وتورت ومخبوزات)
    ['تورتة', 'تورته', 'تورت', 'جاتوه', 'جاتوهات', 'حلويات', 'حلواني', 'بسبوسة', 'كنافة', 'كنافه', 'قطايف', 'ايس كريم', 'مخبز', 'عيش', 'فينو', 'كرواسون', 'باتيه', 'sweets', 'cake', 'bakery'],

    // 10. Juices & Cafes (عصائر ومشروبات وكافيهات)
    ['عصير', 'عصائر', 'قصب', 'مانجو', 'فراولة', 'كوكتيل', 'سموزي', 'قهوة', 'اسبريسو', 'ايس كوفي', 'شاي', 'juice', 'coffee', 'cafe', 'كافيه', 'كافيهات'],

    // 11. Doctors, Clinics, Medical (أطباء وعيادات ومستشفيات)
    ['دكتور', 'دكاترة', 'طبيب', 'اطباء', 'عيادة', 'عيادات', 'كشف', 'استشاري', 'اخصائي', 'مستشفى', 'معمل', 'تحاليل', 'doctor', 'clinic', 'medical'],

    // 12. Pharmacy, Medicine (صيدليات وأدوية)
    ['صيدلية', 'صيدليات', 'دواء', 'ادوية', 'دوا', 'علاج', 'روشتة', 'مستلزمات طبية', 'pharmacy', 'medicine'],

    // 13. Supermarket & Groceries (سوبر ماركت وبقالة)
    ['سوبر ماركت', 'ماركت', 'هايبر', 'بقالة', 'خضار', 'فاكهة', 'جبن', 'البان', 'سلع غذائية', 'شيبسي', 'زيت', 'سكر', 'ارز', 'مكرونة', 'supermarket'],

    // 14. Craftsmen & Home Services (حرفيين وصيانة منزلية)
    ['سباك', 'سباكة', 'مواسير', 'حنفية', 'خلاط', 'سخان', 'فلتر', 'نجار', 'نجارة', 'موبيليا', 'ابواب', 'كهربائي', 'كهرباء', 'اضاءة', 'مبلط', 'سيراميك', 'بلاط', 'نقاش', 'دهانات', 'بويات', 'plumber', 'electrician', 'carpenter'],

    // 15. Auto Mechanics & Transportation (سيارات ونقل وصيانة)
    ['ميكانيكي', 'عفشة', 'كاوتش', 'غيار زيت', 'صيانة سيارات', 'تصليح عربيات', 'بطاريات', 'قطع غيار', 'سيارة', 'عربية', 'تاكسي', 'مشوار', 'مشاوير', 'توكتوك', 'موتوسيكل', 'توصيل', 'mechanic', 'car', 'delivery'],

    // 16. Phones & Tech (هواتف وإلكترونيات)
    ['موبايل', 'موبايلات', 'هاتف', 'هواتف', 'تليفون', 'شاحن', 'جراب', 'شاشة', 'صيانة موبايل', 'كمبيوتر', 'لاب توب', 'mobile', 'phones'],

    // 17. ATM & Cash Machines (صراف آلي وفلوس)
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
 */
export function arabicMatch(haystack, needle) {
  if (!needle) return true;
  if (!haystack) return false;

  const h = normalizeArabic(haystack);
  const n = normalizeArabic(needle);

  if (!n) return true;
  if (!h) return false;

  if (h.includes(n)) return true;

  const nNoAl = stripAl(n);
  if (nNoAl && nNoAl !== n && h.includes(nNoAl)) return true;

  const hNoAl = stripAl(h);
  if (hNoAl && (hNoAl.includes(n) || (nNoAl && hNoAl.includes(nNoAl)))) return true;

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
 * Calculate match relevance score (0 - 100) between text and search query
 */
export function arabicScore(haystack, needle) {
  if (!needle || !haystack) return 0;

  const h = normalizeArabic(haystack);
  const n = normalizeArabic(needle);

  if (!h || !n) return 0;

  if (h === n) return 100;
  if (h.startsWith(n)) return 95;
  if (h.includes(n)) return 85;

  const hNoAl = stripAl(h);
  const nNoAl = stripAl(n);

  if (hNoAl === nNoAl) return 92;
  if (hNoAl.startsWith(nNoAl)) return 88;
  if (hNoAl.includes(nNoAl)) return 80;

  const nTokens = n.split(/\s+/).filter(Boolean);
  if (nTokens.length > 0) {
    let matchedTokens = 0;
    nTokens.forEach(tok => {
      const tokNoAl = stripAl(tok);
      if (h.includes(tok) || (tokNoAl && h.includes(tokNoAl)) || (hNoAl && hNoAl.includes(tok))) {
        matchedTokens++;
      }
    });

    if (matchedTokens === nTokens.length) return 75;
    if (matchedTokens > 0) return Math.round((matchedTokens / nTokens.length) * 60);
  }

  return 0;
}


/**
 * Format price in Egyptian Pounds
 */
export function formatPrice(price, currency = 'ج.م') {
  if (price === null || price === undefined || price === '') return '';
  const num = Number(price);
  if (isNaN(num)) return String(price);
  return `${num.toLocaleString('ar-EG')} ${currency}`;
}

/**
 * Calculate discount percentage
 */
export function calcDiscount(originalPrice, discountPrice) {
  const orig = Number(originalPrice);
  const disc = Number(discountPrice);
  if (!orig || !disc || disc >= orig) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

/**
 * Get Arabic day name
 */
export function getArabicDay(dayIndex) {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[dayIndex % 7] || '';
}

/**
 * Get Arabic month name
 */
export function getArabicMonth(monthIndex) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthIndex % 12] || '';
}
