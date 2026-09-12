/**
 * Dalil El Manzala & El Matariya — Internationalization Engine
 * Arabic / English, clean bilingual routing, dynamic DOM support.
 */
export const SUPPORTED_LANGS=['ar','en'];
export const DEFAULT_LANG='ar';
export const TRANSLATIONS={
 ar:{site_title:'دليل المنزلة والمطرية الرقمي',site_tagline:'منصة الدليل الرقمي والخدمات الأولى في المنزلة والمطرية والدقهلية',all_rights_reserved:'جميع الحقوق محفوظة لمنصة دليل المنزلة والمطرية الرقمي',nav_home:'الرئيسية',nav_popular:'الأكثر شعبية',nav_places:'الأماكن',nav_categories:'التصنيفات',nav_offers:'العروض',nav_now:'طلبات أهالينا',nav_around_me:'بالقرب مني',nav_favorites:'المفضلة',nav_contact:'تواصل معنا',nav_free_verification:'التوثيق المجاني',nav_emergency:'طوارئ وأرقام هامة',nav_dashboard:'لوحة التحكم',nav_login:'تسجيل الدخول',nav_logout:'تسجيل الخروج',search_placeholder:'ابحث عن مكان، دكتور، خدمة، محل...',search_btn:'بحث',search_quick_title:'بحث سريع في المنزلة والمطرية',search_live_results:'نتائج بحث فورية',search_view_all:'عرض كافة النتائج في صفحة البحث',search_no_results:'لم نجد نتائج مطابقة لبحثك',search_clear:'مسح',header_live_empty_title:'لم يتم العثور على أماكن مطابقة',header_live_empty_desc:'جرب كلمة أخرى مثل (صيدلية، دكتور، مطعم، نجار)',header_place_fallback:'مكان بالدليل',header_status_open:'مفتوح الآن',header_status_closed:'مغلق',btn_call:'اتصال',btn_whatsapp:'واتساب',btn_directions:'الاتجاهات',btn_share:'مشاركة',btn_favorite:'حفظ',btn_favorited:'محفوظ',btn_verified:'معتمد 🛡️',btn_verify_place:'وثّق مكانك 🛡️',btn_free_offer:'🎁 عرض التوثيق المجاني',btn_add_place:'أضف مكانك مجاناً',btn_save:'حفظ',btn_cancel:'إلغاء',btn_delete:'حذف',btn_edit:'تعديل',btn_close:'إغلاق',btn_submit:'إرسال',btn_back:'رجوع',btn_read_more:'قراءة المزيد',btn_view_details:'عرض التفاصيل',btn_filter:'تصفية',btn_all:'الكل',status_open:'مفتوح الآن',status_closed:'مغلق حالياً',status_busy:'مشغول',status_verified:'نشاط موثق رسمياً',status_sponsored:'إعلان مميز',place_address:'العنوان',place_phone:'الهاتف',place_whatsapp:'واتساب',place_working_hours:'مواعيد العمل',place_services:'الخدمات والمنتجات',place_reviews:'آراء وتقييمات العملاء',place_add_review:'أضف تقييمك ورأيك',place_rating_avg:'متوسط التقييمات',place_photos:'الصور والمعرض',place_branches:'الفروع الأخرى',place_not_found:'المكان غير موجود في الدليل',place_similar:'أماكن مشابهة في المنطقة',cat_all:'كافة الأقسام',cat_doctors:'أطباء وعيادات',cat_pharmacies:'صيدليات',cat_restaurants:'مطاعم وكافيهات',cat_craftsmen:'حرفيين وخدمات منزلية',cat_shopping:'محلات وتسوق',cat_emergency:'طوارئ وإسعاف',cat_education:'تعليم ومدارس ومدرسين',cat_government:'جهات ومصالح حكومية',area_all:'كل المناطق',area_manzala:'مدينة المنزلة',area_matariya:'مدينة المطرية',area_villages:'قرى وضواحي المنزلة والمطرية',theme_dark:'الوضع الليلي',theme_light:'الوضع النهاري',lang_toggle_label:'English',lang_current:'العربية',loading:'جاري التحميل...',error_generic:'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',success_copied:'تم نسخ الرابط بنجاح!',header_search_aria:'بحث في الدليل',header_search_title:'بحث سريع',nav_aria:'التنقل الرئيسي',lang_aria:'تبديل اللغة إلى الإنجليزية',theme_aria:'تبديل الوضع الليلي والنهاري',mobile_home:'الرئيسية',mobile_categories:'التصنيفات',mobile_offers:'العروض',mobile_more:'المزيد',mobile_quick_nav:'تنقل سريع',voice_assistant:'مساعد المنزلة الصوتي الذكي',unknown:'غير محدد',open_24h:'مفتوح 24 ساعة يومياً 🟢',search_filters:'فلاتر سريعة',smart_filter_all:'✨ الكل',toast_theme_dark:'تم تفعيل الوضع الليلي 🌙',toast_theme_light:'تم تفعيل الوضع النهاري ☀️',logout_success:'تم تسجيل الخروج',dashboard_my:'لوحة تحكمي',dashboard_places:'أماكني',dashboard_add:'إضافة مكان',admin:'الإدارة',logout:'خروج'},
 en:{site_title:'Dalil El Manzala & El Matariya Digital Directory',site_tagline:'The official digital directory & local services platform for El Manzala, El Matariya and Dakahlia, Egypt',all_rights_reserved:'All rights reserved to Dalil El Manzala & El Matariya Digital Directory',nav_home:'Home',nav_popular:'Popular',nav_places:'Places',nav_categories:'Categories',nav_offers:'Offers',nav_now:'Community Requests',nav_around_me:'Near Me',nav_favorites:'Favorites',nav_contact:'Contact Us',nav_free_verification:'Free Verification',nav_emergency:'Emergency & Hotlines',nav_dashboard:'Dashboard',nav_login:'Sign In',nav_logout:'Sign Out',search_placeholder:'Search for a place, doctor, shop or service...',search_btn:'Search',search_quick_title:'Quick Search in El Manzala & El Matariya',search_live_results:'Live Search Results',search_view_all:'View all results on the search page',search_no_results:'No matching results found',search_clear:'Clear',header_live_empty_title:'No matching places found',header_live_empty_desc:'Try another term such as pharmacy, doctor, restaurant or carpenter',header_place_fallback:'Directory listing',header_status_open:'Open Now',header_status_closed:'Closed',btn_call:'Call',btn_whatsapp:'WhatsApp',btn_directions:'Directions',btn_share:'Share',btn_favorite:'Save',btn_favorited:'Saved',btn_verified:'Verified 🛡️',btn_verify_place:'Verify Your Place 🛡️',btn_free_offer:'🎁 Free Verification Offer',btn_add_place:'List Your Business Free',btn_save:'Save',btn_cancel:'Cancel',btn_delete:'Delete',btn_edit:'Edit',btn_close:'Close',btn_submit:'Submit',btn_back:'Back',btn_read_more:'Read More',btn_view_details:'View Details',btn_filter:'Filter',btn_all:'All',status_open:'Open Now',status_closed:'Closed Now',status_busy:'Busy',status_verified:'Officially Verified Business',status_sponsored:'Featured Listing',place_address:'Address',place_phone:'Phone',place_whatsapp:'WhatsApp',place_working_hours:'Working Hours',place_services:'Services & Products',place_reviews:'Customer Reviews & Ratings',place_add_review:'Write a Review',place_rating_avg:'Average Rating',place_photos:'Photos & Gallery',place_branches:'Other Branches',place_not_found:'Place not found in the directory',place_similar:'Similar Places Nearby',cat_all:'All Categories',cat_doctors:'Doctors & Clinics',cat_pharmacies:'Pharmacies',cat_restaurants:'Restaurants & Cafes',cat_craftsmen:'Craftsmen & Home Services',cat_shopping:'Shops & Retail',cat_emergency:'Emergency & Ambulances',cat_education:'Education & Tutors',cat_government:'Government Offices',area_all:'All Areas',area_manzala:'El Manzala City',area_matariya:'El Matariya City',area_villages:'Villages & Surrounding Districts',theme_dark:'Dark Mode',theme_light:'Light Mode',lang_toggle_label:'عربي',lang_current:'English',loading:'Loading...',error_generic:'An unexpected error occurred, please try again later',success_copied:'Link copied successfully!',header_search_aria:'Search the directory',header_search_title:'Quick Search',nav_aria:'Main navigation',lang_aria:'Switch language to Arabic',theme_aria:'Toggle dark and light mode',mobile_home:'Home',mobile_categories:'Categories',mobile_offers:'Offers',mobile_more:'More',mobile_quick_nav:'Quick navigation',voice_assistant:'Smart voice assistant',unknown:'Not specified',open_24h:'Open 24 hours daily 🟢',search_filters:'Quick filters',smart_filter_all:'✨ All',toast_theme_dark:'Dark mode enabled 🌙',toast_theme_light:'Light mode enabled ☀️',logout_success:'Signed out successfully',dashboard_my:'My Dashboard',dashboard_places:'My Places',dashboard_add:'Add Place',admin:'Administration',logout:'Sign Out'}
};

const CLEAN_ROUTES={'/index.html':'/','/places.html':'/places','/categories.html':'/categories','/search.html':'/search','/offers.html':'/offers','/now.html':'/now','/around-me.html':'/around-me','/contact.html':'/contact','/free-verification.html':'/free-verification','/favorites.html':'/favorites','/dashboard.html':'/dashboard','/login.html':'/login','/emergency.html':'/emergency','/privacy.html':'/privacy','/terms.html':'/terms','/legal.html':'/legal','/hadith.html':'/hadith','/quran.html':'/quran','/quran-search.html':'/quran-search','/quran-surah.html':'/quran-surah','/products.html':'/products','/manzala.html':'/manzala','/matariya.html':'/matariya'};

export function detectLanguage(){
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const p = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (p === '/en' || p.startsWith('/en/')) return 'en';
  return 'ar';
}
let _currentLang = detectLanguage();
let _observer = null;

export function getLang() { return _currentLang; }
export function isArabic() { return _currentLang === 'ar'; }
export function isEnglish() { return _currentLang === 'en'; }

export function t(k, fallback = '') {
  const dict = TRANSLATIONS[_currentLang] || TRANSLATIONS[DEFAULT_LANG];
  if (dict && dict[k] !== undefined) return dict[k];
  return fallback || k;
}

function stripLang(path) {
  let p = String(path || '/').replace(/^\/(en|ar)(\/|$)/, '/');
  if (!p.startsWith('/')) p = '/' + p;
  return p || '/';
}

export function localizeUrl(path, targetLang = _currentLang) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || /^(mailto|tel):/i.test(path) || path.startsWith('#')) return path;
  const [base, hash = ''] = String(path).split('#');
  const [pathname, query = ''] = base.split('?');
  let clean = stripLang(pathname);
  if (CLEAN_ROUTES[clean]) clean = CLEAN_ROUTES[clean];

  let out;
  if (targetLang === 'en') {
    out = clean === '/' ? '/en/' : (clean.endsWith('/') ? `/en${clean}` : `/en${clean}/`);
  } else {
    // In Arabic, map clean routes back to root files if needed
    out = clean === '/' ? '/' : (clean.endsWith('.html') ? clean : (CLEAN_ROUTES[clean] ? clean : `${clean}`));
  }
  return `${out}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

export function switchLanguage(newLang) {
  if (!SUPPORTED_LANGS.includes(newLang) || typeof window === 'undefined') return;
  _currentLang = newLang;
  try { localStorage.setItem('dalil-lang', newLang); } catch (_) {}
  
  const pathname = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;
  
  if (newLang === 'en') {
    // Navigate to English equivalent
    let clean = stripLang(pathname);
    if (clean === '/' || clean === '/index.html') {
      window.location.assign(`/en/${search}${hash}`);
      return;
    }
    // Handle place pages
    if (clean === '/place.html' || clean.startsWith('/place/')) {
      const q = new URLSearchParams(search);
      const slug = clean.startsWith('/place/') ? clean.replace('/place/', '').replace(/\/$/, '') : (q.get('slug') || '');
      if (slug) {
        window.location.assign(`/en/place/${encodeURIComponent(slug)}/${hash}`);
        return;
      }
      window.location.assign(`/en/places/${search}${hash}`);
      return;
    }
    // Handle category pages
    if (clean === '/category.html' || clean.startsWith('/category/')) {
      const q = new URLSearchParams(search);
      const slug = clean.startsWith('/category/') ? clean.replace('/category/', '').replace(/\/$/, '') : (q.get('slug') || '');
      if (slug) {
        window.location.assign(`/en/category/${encodeURIComponent(slug)}/${hash}`);
        return;
      }
      window.location.assign(`/en/categories/${search}${hash}`);
      return;
    }
    // General route mapping
    const base = clean.replace(/\.html$/, '').replace(/^\/+/, '');
    window.location.assign(`/en/${base}/${search}${hash}`);
  } else {
    // Navigate to Arabic equivalent
    let clean = stripLang(pathname).replace(/\/+$/, '') || '/';
    if (clean === '/' || clean === '') {
      window.location.assign(`/${search}${hash}`);
      return;
    }
    if (clean === '/place' || clean.startsWith('/place/')) {
      const slug = clean.startsWith('/place/') ? clean.replace('/place/', '').replace(/\/$/, '') : '';
      if (slug) {
        window.location.assign(`/place.html?slug=${encodeURIComponent(slug)}${hash}`);
        return;
      }
      window.location.assign(`/places.html${search}${hash}`);
      return;
    }
    if (clean === '/category' || clean.startsWith('/category/')) {
      const slug = clean.startsWith('/category/') ? clean.replace('/category/', '').replace(/\/$/, '') : '';
      if (slug) {
        window.location.assign(`/category.html?slug=${encodeURIComponent(slug)}${hash}`);
        return;
      }
      window.location.assign(`/categories.html${search}${hash}`);
      return;
    }
    const target = clean.endsWith('.html') ? clean : `${clean}.html`;
    window.location.assign(`${target}${search}${hash}`);
  }
}

export function applyLangToDOM(lang = _currentLang) {
  if (typeof document === 'undefined') return;
  _currentLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  const isEn = _currentLang === 'en';
  
  if (isEn) {
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('data-lang', 'en');
    document.documentElement.classList.remove('is-rtl');
    document.documentElement.classList.add('is-ltr');
    if (document.body) {
      document.body.setAttribute('dir', 'ltr');
      document.body.setAttribute('data-lang', 'en');
      document.body.classList.remove('is-rtl');
      document.body.classList.add('is-ltr');
    }
  } else {
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('data-lang', 'ar');
    document.documentElement.classList.remove('is-ltr');
    document.documentElement.classList.add('is-rtl');
    if (document.body) {
      document.body.setAttribute('dir', 'rtl');
      document.body.setAttribute('data-lang', 'ar');
      document.body.classList.remove('is-ltr');
      document.body.classList.add('is-rtl');
    }
  }
  
  window.dispatchEvent(new CustomEvent('dalil:languagechange', {
    detail: { lang: _currentLang, dir: isEn ? 'ltr' : 'rtl' }
  }));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyLangToDOM(_currentLang), { once: true });
  } else {
    applyLangToDOM(_currentLang);
  }
}
