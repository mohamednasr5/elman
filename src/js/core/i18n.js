/**
 * دليل المنزلة والمطرية الرقمي — Internationalization & Bilingual Engine (i18n)
 * Full Arabic (ar) & English (en) Support with LTR/RTL Layout Automation
 */

export const SUPPORTED_LANGS = ['ar', 'en'];
export const DEFAULT_LANG = 'ar';

// ── Complete Bilingual Dictionary ───────────────────────────────────────────
export const TRANSLATIONS = {
  ar: {
    // Brand & Meta
    site_title: 'دليل المنزلة والمطرية الرقمي',
    site_tagline: 'منصة الدليل الرقمي والخدمات الأولى في المنزلة والمطرية والدقهلية',
    all_rights_reserved: 'جميع الحقوق محفوظة لمنصة دليل المنزلة والمطرية الرقمي',
    
    // Navigation
    nav_home: 'الرئيسية',
    nav_popular: 'الأكثر شعبية',
    nav_places: 'الأماكن',
    nav_categories: 'التصنيفات',
    nav_offers: 'العروض',
    nav_now: 'طلبات أهالينا',
    nav_around_me: 'بالقرب مني',
    nav_favorites: 'المفضلة',
    nav_contact: 'تواصل معنا',
    nav_free_verification: 'التوثيق المجاني',
    nav_emergency: 'طوارئ وأرقام هامة',
    nav_dashboard: 'لوحة التحكم',
    nav_login: 'تسجيل الدخول',
    nav_logout: 'تسجيل الخروج',
    
    // Search
    search_placeholder: 'ابحث عن مكان، دكتور، خدمة، محل...',
    search_btn: 'بحث',
    search_quick_title: 'بحث سريع في المنزلة والمطرية',
    search_live_results: 'نتائج بحث فورية',
    search_view_all: 'عرض كافة النتائج في صفحة البحث',
    search_no_results: 'لم نجد نتائج مطابقة لبحثك',
    search_clear: 'مسح',
    
    // Actions & Buttons
    btn_call: 'اتصال',
    btn_whatsapp: 'واتساب',
    btn_directions: 'الاتجاهات',
    btn_share: 'مشاركة',
    btn_favorite: 'حفظ',
    btn_favorited: 'محفوظ',
    btn_verified: 'معتمد 🛡️',
    btn_verify_place: 'وثّق مكانك 🛡️',
    btn_free_offer: '🎁 عرض التوثيق المجاني',
    btn_add_place: 'أضف مكانك مجاناً',
    btn_save: 'حفظ',
    btn_cancel: 'إلغاء',
    btn_delete: 'حذف',
    btn_edit: 'تعديل',
    btn_close: 'إغلاق',
    btn_submit: 'إرسال',
    btn_back: 'رجوع',
    btn_read_more: 'قراءة المزيد',
    btn_view_details: 'عرض التفاصيل',
    btn_filter: 'تصفية',
    btn_all: 'الكل',
    
    // Status
    status_open: 'مفتوح الآن',
    status_closed: 'مغلق حالياً',
    status_busy: 'مشغول',
    status_verified: 'نشاط موثق رسمياً',
    status_sponsored: 'إعلان مميز',
    
    // Place Details
    place_address: 'العنوان',
    place_phone: 'الهاتف',
    place_whatsapp: 'واتساب',
    place_working_hours: 'مواعيد العمل',
    place_services: 'الخدمات والمنتجات',
    place_reviews: 'آراء وتقييمات العملاء',
    place_add_review: 'أضف تقييمك ورأيك',
    place_rating_avg: 'متوسط التقييمات',
    place_photos: 'الصور والمعرض',
    place_branches: 'الفروع الأخرى',
    place_not_found: 'المكان غير موجود في الدليل',
    place_similar: 'أماكن مشابهة في المنطقة',
    
    // Categories
    cat_all: 'كافة الأقسام',
    cat_doctors: 'أطباء وعيادات',
    cat_pharmacies: 'صيدليات',
    cat_restaurants: 'مطاعم وكافيهات',
    cat_craftsmen: 'حرفيين وخدمات منزلية',
    cat_shopping: 'محلات وتسوق',
    cat_emergency: 'طوارئ وإسعاف',
    cat_education: 'تعليم ومدارس ومدرسين',
    cat_government: 'جهات ومصالح حكومية',
    
    // Area Filter
    area_all: 'كل المناطق',
    area_manzala: 'مدينة المنزلة',
    area_matariya: 'مدينة المطرية',
    area_villages: 'قرى وضواحي المنزلة والمطرية',
    
    // Theme & Lang
    theme_dark: 'الوضع الليلي',
    theme_light: 'الوضع النهاري',
    lang_toggle_label: 'English',
    lang_current: 'العربية',
    
    // Alerts & Notifications
    loading: 'جاري التحميل...',
    error_generic: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',
    success_copied: 'تم نسخ الرابط بنجاح!'
  },

  en: {
    // Brand & Meta
    site_title: 'Dalil El Manzala & El Matariya',
    site_tagline: 'The #1 Official Digital Directory & Local Services in El Manzala & El Matariya, Egypt',
    all_rights_reserved: 'All rights reserved to Dalil El Manzala & El Matariya Digital Platform',
    
    // Navigation
    nav_home: 'Home',
    nav_popular: 'Popular',
    nav_places: 'Places',
    nav_categories: 'Categories',
    nav_offers: 'Offers',
    nav_now: 'Community Requests',
    nav_around_me: 'Near Me',
    nav_favorites: 'Favorites',
    nav_contact: 'Contact Us',
    nav_free_verification: 'Free Verification',
    nav_emergency: 'Emergency & Hotlines',
    nav_dashboard: 'Dashboard',
    nav_login: 'Sign In',
    nav_logout: 'Sign Out',
    
    // Search
    search_placeholder: 'Search for a place, doctor, shop, service...',
    search_btn: 'Search',
    search_quick_title: 'Instant Search in El Manzala & El Matariya',
    search_live_results: 'Live Search Results',
    search_view_all: 'View all results on search page',
    search_no_results: 'No matching results found',
    search_clear: 'Clear',
    
    // Actions & Buttons
    btn_call: 'Call',
    btn_whatsapp: 'WhatsApp',
    btn_directions: 'Directions',
    btn_share: 'Share',
    btn_favorite: 'Save',
    btn_favorited: 'Saved',
    btn_verified: 'Verified 🛡️',
    btn_verify_place: 'Verify Your Place 🛡️',
    btn_free_offer: '🎁 Free Verification Offer',
    btn_add_place: 'List Your Business Free',
    btn_save: 'Save',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete',
    btn_edit: 'Edit',
    btn_close: 'Close',
    btn_submit: 'Submit',
    btn_back: 'Back',
    btn_read_more: 'Read More',
    btn_view_details: 'View Details',
    btn_filter: 'Filter',
    btn_all: 'All',
    
    // Status
    status_open: 'Open Now',
    status_closed: 'Closed Now',
    status_busy: 'Busy',
    status_verified: 'Officially Verified Business',
    status_sponsored: 'Featured Listing',
    
    // Place Details
    place_address: 'Address',
    place_phone: 'Phone',
    place_whatsapp: 'WhatsApp',
    place_working_hours: 'Working Hours',
    place_services: 'Services & Specialties',
    place_reviews: 'Customer Reviews & Ratings',
    place_add_review: 'Write a Review',
    place_rating_avg: 'Average Rating',
    place_photos: 'Photos & Gallery',
    place_branches: 'Other Branches',
    place_not_found: 'Place not found in directory',
    place_similar: 'Similar Places Nearby',
    
    // Categories
    cat_all: 'All Categories',
    cat_doctors: 'Doctors & Clinics',
    cat_pharmacies: 'Pharmacies',
    cat_restaurants: 'Restaurants & Cafes',
    cat_craftsmen: 'Craftsmen & Home Services',
    cat_shopping: 'Shops & Retail',
    cat_emergency: 'Emergency & Ambulances',
    cat_education: 'Education & Tutors',
    cat_government: 'Government Offices',
    
    // Area Filter
    area_all: 'All Areas',
    area_manzala: 'El Manzala City',
    area_matariya: 'El Matariya City',
    area_villages: 'Villages & Surrounding Districts',
    
    // Theme & Lang
    theme_dark: 'Dark Mode',
    theme_light: 'Light Mode',
    lang_toggle_label: 'عربي',
    lang_current: 'English',
    
    // Alerts & Notifications
    loading: 'Loading...',
    error_generic: 'An unexpected error occurred, please try again later',
    success_copied: 'Link copied successfully!'
  }
};

/**
 * Detect Current Language:
 * Priority: 1) Path Prefix (/en/ or /ar/), 2) localStorage, 3) Browser default
 */
export function detectLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANG;

  // 1. Check Pathname
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/en/') || pathname === '/en') {
    return 'en';
  }
  if (pathname.startsWith('/ar/') || pathname === '/ar') {
    return 'ar';
  }

  // 2. Check query param ?lang=
  const urlParams = new URLSearchParams(window.location.search);
  const paramLang = urlParams.get('lang')?.toLowerCase();
  if (paramLang && SUPPORTED_LANGS.includes(paramLang)) {
    return paramLang;
  }

  // 3. Check localStorage
  try {
    const saved = localStorage.getItem('dalil-lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
  } catch (_) {}

  // 4. Default to Arabic for regional audience
  return DEFAULT_LANG;
}

let _currentLang = detectLanguage();

/**
 * Get current active language ('ar' or 'en')
 */
export function getLang() {
  return _currentLang;
}

/**
 * Check if current language is Arabic
 */
export function isArabic() {
  return _currentLang === 'ar';
}

/**
 * Check if current language is English
 */
export function isEnglish() {
  return _currentLang === 'en';
}

/**
 * Translate key with fallback
 */
export function t(key, fallback = '') {
  const dict = TRANSLATIONS[_currentLang] || TRANSLATIONS.ar;
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  // Fallback to Arabic dict if missing in English
  if (TRANSLATIONS.ar && TRANSLATIONS.ar[key] !== undefined) {
    return TRANSLATIONS.ar[key];
  }
  return fallback || key;
}

/**
 * Build localized URL based on current language
 */
export function localizeUrl(path, targetLang = _currentLang) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }

  // Clean existing prefix
  let cleanPath = path.replace(/^\/(en|ar)(\/|$)/, '/');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  if (targetLang === 'en') {
    return cleanPath === '/' ? '/en/' : `/en${cleanPath}`;
  }
  // Arabic can either be root /... or /ar/...
  return cleanPath;
}

/**
 * Switch Language and update DOM + URL
 */
export function switchLanguage(newLang) {
  if (!SUPPORTED_LANGS.includes(newLang)) return;
  _currentLang = newLang;

  try {
    localStorage.setItem('dalil-lang', newLang);
  } catch (_) {}

  // Calculate new URL
  const currentPath = window.location.pathname;
  let cleanPath = currentPath.replace(/^\/(en|ar)(\/|$)/, '/');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  let newUrl = cleanPath;
  if (newLang === 'en') {
    newUrl = cleanPath === '/' ? '/en/' : `/en${cleanPath}`;
  }

  // Preserve query string and hash
  const search = window.location.search;
  const hash = window.location.hash;

  window.location.href = `${newUrl}${search}${hash}`;
}

/**
 * Apply Language attributes to document element (Instant Zero-CLS)
 */
export function applyLangToDOM(lang = _currentLang) {
  if (typeof document === 'undefined') return;
  const isRtl = lang === 'ar';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('data-lang', lang);

  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', translated);
      } else {
        el.textContent = translated;
      }
    }
  });
}

// Auto-run apply on import in browser
if (typeof document !== 'undefined') {
  applyLangToDOM(_currentLang);
}
