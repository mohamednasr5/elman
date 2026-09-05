/**
 * category-assets.js
 * Universal High-Resolution Category Default Assets (Covers & Logos)
 * Guarantees every place without user-uploaded images looks 100% complete, modern, and professional.
 */

import { normalizeArabic } from './arabic.js';

export const CATEGORY_ASSET_DEFINITIONS = [
  {
    keys: ['dairy', 'لبن', 'البان', 'ألبان', 'جبن', 'جبنة', 'قشطة', 'زبدة', 'زبادي'],
    cover: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🧀',
    name: 'معمل ألبان وجبن',
    color: '#D97706',
    bgColor: 'FEF3C7',
    textColor: '92400E'
  },
  {
    keys: ['pharmacy', 'صيدل', 'دواء', 'علاج', 'روشت'],
    cover: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '💊',
    name: 'صيدلية ومستلزمات طبية',
    color: '#059669',
    bgColor: 'D1FAE5',
    textColor: '065F46'
  },
  {
    keys: ['medical supplies', 'مستلزمات طبية', 'مستحضرات تجميل'],
    cover: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🍼',
    name: 'مستلزمات طبية ومستحضرات تجميل',
    color: '#0284C7',
    bgColor: 'E0F2FE',
    textColor: '0369A1'
  },
  {
    keys: ['doctor', 'clinic', 'دكتور', 'طبيب', 'عياد', 'استشاري', 'اخصائي'],
    cover: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '👨‍⚕️',
    name: 'دكتور وعيادات',
    color: '#0284C7',
    bgColor: 'E0F2FE',
    textColor: '0369A1'
  },
  {
    keys: ['dental', 'اسنان', 'أسنان', 'فم', 'ضروس'],
    cover: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🦷',
    name: 'عيادة أسنان',
    color: '#0284C7',
    bgColor: 'E0F2FE',
    textColor: '075985'
  },
  {
    keys: ['physical therapy', 'علاج طبيعي', 'تغذية علاجية', 'تاهيل', 'تأهيل'],
    cover: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🩺',
    name: 'مركز علاج طبيعي وتغذية',
    color: '#0D9488',
    bgColor: 'CCFBF1',
    textColor: '115E59'
  },
  {
    keys: ['supermarket', 'سوبر ماركت', 'ماركت', 'بقالة', 'بقاله', 'هايبر'],
    cover: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🛒',
    name: 'سوبر ماركت',
    color: '#4F46E5',
    bgColor: 'EEF2FF',
    textColor: '3730A3'
  },
  {
    keys: ['roastery', 'محمص', 'مقل', 'تسالي', 'لب', 'مكسرات', 'ياميش'],
    cover: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🥜',
    name: 'محمصة ولب ومكسرات',
    color: '#B45309',
    bgColor: 'FEF3C7',
    textColor: '78350F'
  },
  {
    keys: ['bakery', 'confectioner', 'مخبز', 'حلواني', 'حلويات', 'تورتة', 'كحك', 'فينو', 'عيش', 'كيك'],
    cover: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🍞',
    name: 'مخبز وحلواني',
    color: '#D97706',
    bgColor: 'FEF3C7',
    textColor: '92400E'
  },
  {
    keys: ['restaurant', 'food', 'مطعم', 'مشويات', 'كريب', 'بيتزا', 'شاورما', 'حواوشي', 'برجر', 'وجبات'],
    cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🍔',
    name: 'مطعم ومأكولات',
    color: '#EA580C',
    bgColor: 'FFEDD5',
    textColor: '9A3412'
  },
  {
    keys: ['cafe', 'coffee', 'كافيه', 'مقهى', 'قهوة', 'كوفي'],
    cover: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '☕',
    name: 'كافيه ومشروبات',
    color: '#78350F',
    bgColor: 'F5EBE6',
    textColor: '451A03'
  },
  {
    keys: ['juice', 'عصير', 'قصب', 'سموذي', 'كوكتيل', 'معصرة'],
    cover: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🥤',
    name: 'عصائر طبيعية وفريش',
    color: '#16A34A',
    bgColor: 'DCFCE7',
    textColor: '14532D'
  },
  {
    keys: ['fish', 'seafood', 'fesikh', 'سمك', 'اسماك', 'أسماك', 'فسيخ', 'رنجة', 'جمبري'],
    cover: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🐟',
    name: 'أسماك ومأكولات بحرية وفسيخ',
    color: '#0284C7',
    bgColor: 'E0F2FE',
    textColor: '075985'
  },
  {
    keys: ['poultry', 'دواجن', 'فراخ', 'بط', 'تفريخ'],
    cover: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🍗',
    name: 'محل دواجن وطيور',
    color: '#D97706',
    bgColor: 'FEF3C7',
    textColor: '92400E'
  },
  {
    keys: ['clothing', 'ملابس', 'بوتيك', 'ازياء', 'أزياء', 'بدل', 'عبايات', 'فساتين'],
    cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '👔',
    name: 'محل ملابس وأزياء',
    color: '#9333EA',
    bgColor: 'F3E8FF',
    textColor: '6B21A8'
  },
  {
    keys: ['shoes', 'احذية', 'أحذية', 'شنط', 'جلد'],
    cover: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '👠',
    name: 'محل أحذية وشنط',
    color: '#E11D48',
    bgColor: 'FFE4E6',
    textColor: '9F1239'
  },
  {
    keys: ['phones', 'mobile', 'موبايل', 'هواتف', 'تليفون'],
    cover: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '📱',
    name: 'محل هواتف وإكسسوارات',
    color: '#2563EB',
    bgColor: 'DBEAFE',
    textColor: '1E40AF'
  },
  {
    keys: ['computers', 'laptop', 'كمبيوتر', 'لاب توب', 'صيانة كمبيوتر'],
    cover: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🖥️',
    name: 'كمبيوتر ولاب توب',
    color: '#0891B2',
    bgColor: 'CFFAFE',
    textColor: '155E75'
  },
  {
    keys: ['haircut', 'barber', 'حلاق', 'حلاقة', 'قص شعر'],
    cover: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '✂️',
    name: 'صالون حلاقة ورجالي',
    color: '#1E293B',
    bgColor: 'F1F5F9',
    textColor: '0F172A'
  },
  {
    keys: ['women hairdresser', 'كوافير', 'تجميل', 'ميك اب', 'بيوتي سنتر'],
    cover: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '💄',
    name: 'كوافير ومركز تجميل',
    color: '#DB2777',
    bgColor: 'FCE7F3',
    textColor: '831843'
  },
  {
    keys: ['wedding dress', 'atelier', 'اتيليه', 'اتيلية', 'فساتين زفاف', 'خطوبة', 'سهرة'],
    cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '👗',
    name: 'أتيليه فساتين زفاف وسهرة',
    color: '#E11D48',
    bgColor: 'FFE4E6',
    textColor: '9F1239'
  },
  {
    keys: ['wedding hall', 'قاعة', 'قاعات', 'افراح', 'أفراح', 'مناسبات'],
    cover: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '👑',
    name: 'قاعات أفراح ومناسبات',
    color: '#D97706',
    bgColor: 'FEF3C7',
    textColor: '78350F'
  },
  {
    keys: ['photography', 'photoshoot', 'استوديو', 'ستديو', 'تصوير', 'سيشن'],
    cover: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '📷',
    name: 'استوديو تصوير فوتوغرافي',
    color: '#475569',
    bgColor: 'F1F5F9',
    textColor: '1E293B'
  },
  {
    keys: ['paint', 'بويات', 'دهانات', 'معجون'],
    cover: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🎨',
    name: 'محل بويات ودهانات',
    color: '#D97706',
    bgColor: 'FEF3C7',
    textColor: '92400E'
  },
  {
    keys: ['plumbing', 'sanitary', 'سباك', 'سباكة', 'ادوات صحية', 'أدوات صحية', 'مواسير', 'خلاطات'],
    cover: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🔧',
    name: 'محل سباكة وأدوات صحية',
    color: '#0284C7',
    bgColor: 'E0F2FE',
    textColor: '0369A1'
  },
  {
    keys: ['electrical', 'كهربا', 'كهرباء', 'إنارة', 'ليدات', 'لمبات', 'نجف'],
    cover: 'https://images.unsplash.com/photo-1558384078-054045f5a896?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '💡',
    name: 'محل كهرباء وإنارة',
    color: '#F59E0B',
    bgColor: 'FEF3C7',
    textColor: '92400E'
  },
  {
    keys: ['furniture', 'woodworking', 'نجارة', 'اخشاب', 'أخشاب', 'اثاث', 'أثاث', 'موبيليا', 'غرف نوم'],
    cover: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🪵',
    name: 'معرض وورشة أثاث ونجارة',
    color: '#78350F',
    bgColor: 'F5EBE6',
    textColor: '451A03'
  },
  {
    keys: ['aluminum', 'الوميتال', 'ألوميتال', 'زجاج'],
    cover: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🪟',
    name: 'ورشة ألوميتال وزجاج',
    color: '#64748B',
    bgColor: 'F1F5F9',
    textColor: '334155'
  },
  {
    keys: ['car repair', 'mechanic', 'ميكانيكي', 'سيارات', 'تصليح سيارات', 'كاوتش', 'زيوت'],
    cover: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🚗',
    name: 'صيانة وتصليح سيارات',
    color: '#DC2626',
    bgColor: 'FEE2E2',
    textColor: '991B1B'
  },
  {
    keys: ['motorcycle', 'موتوسيكل', 'موتسيكلات', 'توكتوك'],
    cover: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🏍️',
    name: 'صيانة موتوسيكلات وتوكتوك',
    color: '#EA580C',
    bgColor: 'FFEDD5',
    textColor: '9A3412'
  },
  {
    keys: ['real estate', 'عقارات', 'اراضي', 'أراضي', 'شقق', 'منازل'],
    cover: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🏢',
    name: 'تسويق عقاري وأراضي',
    color: '#0F766E',
    bgColor: 'CCFBF1',
    textColor: '115E59'
  },
  {
    keys: ['law firm', 'محاماة', 'محامي', 'استشارات قانونية'],
    cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '⚖️',
    name: 'مكتب محاماة واستشارات',
    color: '#1E293B',
    bgColor: 'F1F5F9',
    textColor: '0F172A'
  },
  {
    keys: ['accounting', 'محاسبة', 'محاسب', 'ضرائب'],
    cover: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '📊',
    name: 'مكتب محاسبة ومراجعة',
    color: '#0369A1',
    bgColor: 'E0F2FE',
    textColor: '075985'
  },
  {
    keys: ['hotel', 'فندق', 'مبيت', 'إقامة'],
    cover: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🏨',
    name: 'فندق وإقامة فندقية',
    color: '#0284C7',
    bgColor: 'E0F2FE',
    textColor: '075985'
  },
  {
    keys: ['gym', 'جيم', 'لياقة', 'فتنس', 'كمال اجسام', 'كاراتيه', 'تايكوندو', 'كرة القدم', 'اكاديمية'],
    cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🏋️',
    name: 'جيم وأكاديمية رياضية',
    color: '#DC2626',
    bgColor: 'FEE2E2',
    textColor: '991B1B'
  },
  {
    keys: ['atm', 'صراف'],
    cover: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&h=500&q=85',
    icon: '🏧',
    name: 'ماكينة صراف آلي ATM',
    color: '#0284C7',
    bgColor: 'E0F2FE',
    textColor: '0369A1'
  }
];

export const DEFAULT_PLACE_COVER = 'assets/images/default-cover.png';
export const DEFAULT_PLACE_LOGO = 'assets/images/default-logo.png';

const DEFAULT_BUSINESS_ASSET = {
  cover: DEFAULT_PLACE_COVER,
  icon: '🏪',
  name: 'نشاط تجاري وخدمات',
  color: '#1B4F72',
  bgColor: 'E0F2FE',
  textColor: '0F2B48'
};

export function resolveCategoryAsset(categoryName = '', placeName = '') {
  const query = (String(categoryName) + ' ' + String(placeName)).toLowerCase();
  const normalized = normalizeArabic(query);

  for (const def of CATEGORY_ASSET_DEFINITIONS) {
    if (def.keys.some(k => normalized.includes(normalizeArabic(k).toLowerCase()))) {
      return def;
    }
  }

  return DEFAULT_BUSINESS_ASSET;
}

export function generateCategoryBrandLogo(placeName = '', categoryName = '') {
  // If no custom logo, return the official directory logo asset
  return DEFAULT_PLACE_LOGO;
}

export function getDefaultPlaceAssets(place = {}, category = {}) {
  const catName = category.name || place.categoryName || place.customCategory || '';
  const pName = place.name || '';
  const asset = resolveCategoryAsset(catName, pName);

  let finalCover = place.coverImageUrl || place.coverImage || place.image || place.photos?.[0] || '';
  if (!finalCover || String(finalCover).includes('placeholder') || String(finalCover).length < 8) {
    // Priority: Default Directory Cover requested by user
    finalCover = DEFAULT_PLACE_COVER;
  }

  let finalLogo = place.logoUrl || place.logo || place.photoURL || '';
  if (!finalLogo || String(finalLogo).includes('placeholder') || String(finalLogo).length < 8) {
    // Priority: Default Directory Logo requested by user
    finalLogo = DEFAULT_PLACE_LOGO;
  }

  return {
    coverImageUrl: finalCover,
    logoUrl: finalLogo,
    categoryIcon: asset.icon,
    categoryColor: asset.color
  };
}

