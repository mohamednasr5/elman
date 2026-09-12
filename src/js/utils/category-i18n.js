import { getCategoryBySlug, getProfessionById } from './professions-data.js';

export const VILLAGE_NAMES_EN = {
  'المنزلة': 'El Manzala', 'المطرية': 'El Matariya', 'الجمالية': 'El Gamaliya', 'العصافرة': 'El Asafra', 'الفروسات': 'El Forosat', 'البصراط': 'El Basrat', 'المنزلة الجديدة': 'New Manzala', 'ميت شريف': 'Mit Sharif', 'العامرة': 'El Amra', 'الستايتة': 'El Stayta', 'كفر حجاج': 'Kafr Haggag', 'ميت خضير': 'Mit Khodeir', 'العزيزة': 'El Aziza', 'دار السلام': 'Dar El Salam', 'الشبول': 'El Shbool', 'الأحمدية': 'El Ahmadiya', 'النسايمة': 'El Nasayma', 'أولاد علم': 'Awlad Alam', 'خندق الموز': 'Khandaq El Moz', 'الحوتة': 'El Houta', 'القزاقزة': 'El Qazaqza', 'الشريفية': 'El Sharifia', 'أولاد سراج': 'Awlad Serag', 'أولاد نور': 'Awlad Nour', 'الزعاترة': 'El Zaatra', 'القتايلة': 'El Qatayla', 'البصايلة': 'El Basayla', 'الهنايدة': 'El Hanayda', 'أولاد بانا': 'Awlad Bana', 'أولاد حانا': 'Awlad Hana', 'القطشة': 'El Qatsha', 'المحارقة': 'El Maharqa', 'الطوابرة': 'El Tawabra', 'العمارنة': 'El Amarna', 'الجماملة': 'El Gamamla', 'إصلاح أبو الأخضر': 'Eslah Abu El Akhdar', 'عزبة المفارق': 'Ezbet El Mafareq', 'الإسكندرية الجديدة': 'New Alexandria', 'مصر الجديدة': 'Masr El Gedida', 'الجوابر': 'El Gawaber', 'المواجد': 'El Mowaged', 'الضهير': 'El Dheir', 'أولاد صبور': 'Awlad Sabour', 'أبو خضير': 'Abu Khodeir', 'بطل شميس': 'Batal Shemis', 'حي البساتين': 'El Basateen District', 'الخلايفة': 'El Khalayfa', 'العرب والنجوع': 'El Arab & El Nogoo', 'الجباسات': 'El Gabbasat', 'الجسر الواقي': 'El Gesr El Waqi', 'طريق الشونة': 'El Shona Road', 'المثلث': 'El Mosalas', 'المجاير': 'El Magayer', 'شرق السكة الحديد': 'East Railway', 'القبلية': 'El Qeblia', 'المنزلة والمطرية': 'El Manzala & El Matariya', 'وسط البلد': 'Downtown', 'شارع البحر': 'El Bahr Street', 'القومية': 'El Qawmia', 'المحطة': 'Station District', 'المعهد الديني': 'Religious Institute'
};

export const CATEGORY_NAMES_EN = {
  doctor: 'Doctors & Clinics', pharmacy: 'Pharmacies', 'restaurants-and-cafes': 'Restaurants & Cafes', supermarket: 'Supermarket', delivery: 'Delivery & Transport', 'confectioner and cake shop': 'Confectionery & Bakery', 'butchery and meat': 'Butchery & Meat', 'electrical appliance maintenance': 'Appliance Maintenance', 'sale of computers and laptops': 'Mobile & Computers', plumbing: 'Plumbing & Sanitary', 'plumbing-drainage': 'Plumbing & Drainage', 'decor-finishing': 'Finishing, Decor & Painting', electrical: 'Electrical & Maintenance', electrician: 'Electrical Services', 'real estate company': 'Real Estate', 'travel and tourism': 'Travel & Tourism', 'courses center': 'Educational Centers', 'cash and balance services': 'Cash & Balance Services', carpenter: 'Carpentry & Furniture', painter: 'Painting & Decor', tiler: 'Ceramic & Tiling', blacksmith: 'Blacksmith', alumital: 'Alumital & Glass', gym: 'Gym & Fitness', 'clothing-store': 'Clothing Stores', 'gold-and-jewelry-shops': 'Gold & Jewelry', 'haircut-and-shave': 'Barbershop & Salon', 'fish-shop': 'Fish & Seafood', bookstore: 'Bookstores & Stationery', auto_repair: 'Auto Repair & Mechanics', bakery: 'Bakeries', dentist: 'Dentists', pediatrician: 'Pediatricians', ophthalmology: 'Eye Clinics', atm: 'ATMs'
};

export const CATEGORY_NAMES_AR = {
  'cash and balance services': 'خدمات كاش ورصيد', 'cash-and-balance-services': 'خدمات كاش ورصيد', 'cash and balance': 'خدمات كاش ورصيد', cash: 'خدمات كاش ورصيد', doctor: 'أطباء وعيادات', pharmacy: 'صيدليات', 'restaurants and cafes': 'مطاعم وكافيهات', 'restaurants-and-cafes': 'مطاعم وكافيهات', supermarket: 'سوبر ماركت', delivery: 'خدمات توصيل وشحن', 'confectioner and cake shop': 'حلويات ومخبوزات', 'butchery and meat': 'جزارة ولحوم', 'electrical appliance maintenance': 'صيانة أجهزة كهربائية', 'sale of computers and laptops': 'كمبيوتر ولاب توب', plumbing: 'سباكة وأدوات صحية', 'plumbing-drainage': 'سباكة وصرف صحي', 'decor-finishing': 'تشطيبات وديكور ودهانات', electrical: 'كهرباء وصيانة', electrician: 'كهرباء وتجهيزات', 'wedding, engagement and evening dress atelier': 'أتيليه وفساتين', 'real estate company': 'عقارات واستثمار عقاري', 'travel and tourism': 'سياحة ورحلات', 'courses center': 'مراكز تدريب وكورسات', carpenter: 'نجارة وموبيليا', painter: 'دهانات وديكور', tiler: 'سيراميك وبلاط', blacksmith: 'حدادة وكريتال', alumital: 'ألوميتال وزجاج', gym: 'صالات رياضية وجيم', 'clothing-store': 'محلات ملابس', 'clothing store': 'محلات ملابس', 'gold-and-jewelry-shops': 'ذهب ومجوهرات', 'gold and jewelry shops': 'ذهب ومجوهرات', 'haircut-and-shave': 'صالونات وحلاقة', 'haircut and shave': 'صالونات وحلاقة', 'fish-shop': 'أسماك ومأكولات بحرية', 'fish shop': 'أسماك ومأكولات بحرية', bookstore: 'مكتبات وأدوات مدرسية', auto_repair: 'صيانة سيارات وميكانيكا', 'auto repair': 'صيانة سيارات وميكانيكا', bakery: 'مخابز وأفران', dentist: 'طب أسنان', pediatrician: 'أطباء أطفال', ophthalmology: 'طب وجراحة عيون', atm: 'ماكينات صراف آلي ATM', roastery: 'محامص ومقالي', 'physical therapy and nutrition center': 'علاج طبيعي وتغذية', 'institutes and colleges': 'معاهد وكليات', 'advertising-and-marketing-company': 'دعاية وإعلان وتصميم', 'henna-art-&-engraving': 'حنة وتجميل', 'artificial intelligence engineer': 'هندسة وبرمجة وذكاء اصطناعي', 'chef-of-weddings-and-celebrations': 'طباخ أفراح ومناسبات', 'butterfly-weddings-&-events': 'فراشة أفراح ومناسبات', 'air-conditioner-maintenance-and-installation': 'صيانة وتركيب تكييفات', 'aluminum-workshop': 'ورشة ألوميتال', 'antiques-&-chandeliers': 'تحف ونجف', 'banner-and-advertising-printing': 'طباعة بنرات ودعاية وإعلان', "bride's-supplies": 'مستلزمات العرائس', phones: 'موبايلات وهواتف', 'building-construction': 'مقاولات وبناء', other: 'خدمات وأنشطة متنوعة'
};

function normalizeKey(value = '') { return String(value || '').trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/_/g, '-').replace(/\s+/g, ' '); }
function hasArabic(value = '') { return /[\u0600-\u06FF]/.test(String(value || '')); }
function resolveProfessionLabel(value = '') { return getProfessionById(normalizeKey(value)) || null; }
function resolveMainCategoryLabel(value = '') { return getCategoryBySlug(normalizeKey(value)) || null; }

export function resolveCategoryLabel(category = '', isEn = false) {
  if (!category) return '';
  if (typeof category === 'object') {
    const slug = category.slug || category.id || category._key || category.categoryId || '';
    const arabic = category.nameAr || category.name_ar || category.arabicName || category.name || '';
    const english = category.nameEn || category.name_en || category.englishName || '';
    if (isEn) return english || CATEGORY_NAMES_EN[normalizeKey(slug)] || (hasArabic(arabic) ? '' : arabic) || normalizeKey(slug).replace(/-/g, ' ');
    if (hasArabic(arabic)) return arabic;
    return resolveCategoryLabel(slug, false);
  }
  const raw = String(category).trim();
  if (!raw) return '';
  const key = normalizeKey(raw);
  if (isEn) {
    if (CATEGORY_NAMES_EN[key]) return CATEGORY_NAMES_EN[key];
    const main = resolveMainCategoryLabel(key);
    if (main?.nameEn) return main.nameEn;
    const profession = resolveProfessionLabel(key);
    if (profession?.nameEn) return profession.nameEn;
    return hasArabic(raw) ? raw : key.replace(/-/g, ' ');
  }
  if (hasArabic(raw)) return raw;
  if (CATEGORY_NAMES_AR[key]) return CATEGORY_NAMES_AR[key];
  const main = resolveMainCategoryLabel(key);
  if (main?.name) return main.name;
  const profession = resolveProfessionLabel(key);
  if (profession?.name) return profession.name;
  const spaced = key.replace(/-/g, ' ');
  if (CATEGORY_NAMES_AR[spaced]) return CATEGORY_NAMES_AR[spaced];
  return 'خدمات وأنشطة';
}

export function toArabicCategory(cat = '') { return resolveCategoryLabel(cat, false); }
export function translateArea(area = '', isEn = false) { if (!isEn || !area) return area || 'المنزلة'; return VILLAGE_NAMES_EN[area] || area; }
export function translateCategory(cat = '', isEn = false) { return resolveCategoryLabel(cat, isEn); }

// The directory search page should advertise platform coverage, not expose the current API result count.
function installSearchCoverageLabelPolicy() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__dalilSearchCoveragePolicy) return;
  window.__dalilSearchCoveragePolicy = true;
  let lastApplied = '';
  const apply = () => {
    if (document.documentElement.lang === 'en') return;
    const el = document.getElementById('search-meta');
    if (!el) return;
    const q = new URLSearchParams(window.location.search).get('q')?.trim();
    const next = q
      ? `نتائج البحث في دليل المنزلة والمطرية عن: <strong style="color:var(--primary);font-size:1.05rem">${String(q).replace(/[&<>\"]/g, '')}</strong>`
      : 'استكشف أكثر من <strong style="color:var(--primary);font-size:1.05rem">15,000</strong> مكان وخدمة في دليل المنزلة والمطرية';
    if (lastApplied === next && el.innerHTML === next) return;
    if (el.innerHTML !== next) el.innerHTML = next;
    lastApplied = next;
  };
  const observer = new MutationObserver(() => apply());
  const start = () => { apply(); observer.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) start(); else window.addEventListener('DOMContentLoaded', start, { once: true });
}
installSearchCoverageLabelPolicy();
