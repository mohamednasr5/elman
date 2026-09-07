// src/js/utils/category-svg.js
/**
 * Centralized High-Performance SVG Generator for Directory Categories
 * Supports dynamic animated SVGs for both well-known categories and automatic AI fallback.
 * Includes specialized animated SVGs (like swinging dresses for ataliers, beating heart/cross for clinics, etc.)
 */

import { createSvgIcon } from "./professions-data.js";
import { getDressSvg, getCategoryVisualMeta, renderCategoryCardIcon } from "./category-visual.js";
export { getDressSvg, getCategoryVisualMeta, renderCategoryCardIcon };

// Animation utility classes
const ANIM_CLASSES = [
  'svg-anim-float',
  'svg-anim-pulse',
  'svg-anim-swing',
  'svg-anim-wrench',
  'svg-anim-spin'
];

// Color palettes
const PALETTES = [
  '#E11D48', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777',
  '#0891B2', '#EA580C', '#4F46E5', '#16A34A', '#CA8A04', '#9333EA'
];

function hashStr(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Handcrafted animated vector SVGs for all categories
 */
export function getDirectSvg(type, color = '#E11D48', size = 36) {
  let inner = '';
  let anim = 'svg-anim-float';

  switch (type) {
    // 👗 فساتين زفاف، أتيليه، خطوبة وسهرة
    case 'dress':
    case 'wedding-dress':
    case 'atelier':
      return getDressSvg(color, size);

    // 👔 محل ملابس، بدلات، أزياء
    case 'clothing':
      anim = 'svg-anim-float';
      inner = `
        <path d="M6 4l6-2 6 2 3 5-3 3-2-1v11H8V11L6 12 3 9z" fill="${color}" opacity="0.2"/>
        <path d="M6 4l6-2 6 2 3 5-3 3-2-1v11H8V11L6 12 3 9z" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
        <!-- Collar & Buttons -->
        <path d="M10 2l2 4 2-4" stroke="${color}" stroke-width="1.5"/>
        <circle cx="12" cy="10" r="1" fill="${color}"/>
        <circle cx="12" cy="14" r="1" fill="${color}"/>
        <circle cx="12" cy="18" r="1" fill="${color}"/>
      `;
      break;

    // 👠 أحذية وشنط
    case 'shoes':
    case 'bags':
      anim = 'svg-anim-pulse';
      inner = `
        <path d="M4 16c2-4 5-8 8-9h3v3l-2 3h5a2 2 0 0 1 2 2v2H4z" fill="${color}" opacity="0.25"/>
        <path d="M4 16c2-4 5-8 8-9h3v3l-2 3h5a2 2 0 0 1 2 2v2H4z" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
        <path d="M19 17v4" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="3" y1="17" x2="19" y2="17" stroke="${color}" stroke-width="1.8"/>
      `;
      break;

    // 👑 قاعات أفراح ومناسبات
    case 'wedding-halls':
      anim = 'svg-anim-pulse';
      inner = `
        <path d="M2 19h20M5 19V9l7-5 7 5v10" stroke="${color}" stroke-width="1.8" fill="${color}" opacity="0.2"/>
        <path d="M9 19v-5a3 3 0 0 1 6 0v5" stroke="${color}" stroke-width="1.8" fill="none"/>
        <circle cx="12" cy="4" r="1.5" fill="${color}"/>
        <path d="M10 7l2-2 2 2" stroke="${color}" stroke-width="1.5"/>
      `;
      break;

    // 🥩 جزارة ولحوم طازجة
    case 'meat':
    case 'butchery':
      anim = 'svg-anim-pulse';
      inner = `
        <path d="M6 14c-2.5-3-1-7 2-9 4-3 9-1 11 2 3 4 1 8-2 10-3 2-8 0-11-3z" fill="${color}" opacity="0.25"/>
        <path d="M6 14c-2.5-3-1-7 2-9 4-3 9-1 11 2 3 4 1 8-2 10-3 2-8 0-11-3z" stroke="${color}" stroke-width="1.8" fill="none"/>
        <ellipse cx="13" cy="10" rx="3" ry="2" fill="${color}" opacity="0.4"/>
        <circle cx="13" cy="10" r="1.5" fill="#fff"/>
        <path d="M4 17l-2 2a1.5 1.5 0 0 0 2 2l2-2" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      `;
      break;

    // 🧀 ألبان وجبن وقشطة
    case 'dairy':
      anim = 'svg-anim-float';
      inner = `
        <path d="M3 15h18l-3-8H6z" fill="${color}" opacity="0.3"/>
        <path d="M3 15h18l-3-8H6z" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="8" cy="12" r="1.5" fill="${color}"/>
        <circle cx="14" cy="11" r="1.2" fill="${color}"/>
        <circle cx="17" cy="13" r="1" fill="${color}"/>
        <path d="M8 7V4h8v3" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      `;
      break;

    // 🍽️ مطاعم، كافيهات، مأكولات
    case 'restaurant':
    case 'food':
    case 'cafe':
      anim = 'svg-anim-swing';
      inner = `
        <path d="M5 3v6a3 3 0 0 0 3 3v9M7 3v6M9 3v6" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M17 3v18M14 3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-3" stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="${color}" opacity="0.2"/>
      `;
      break;

    // 🐟 أسماك ومأكولات بحرية وفسيخ
    case 'fish':
    case 'seafood':
      anim = 'svg-anim-swing';
      inner = `
        <path d="M2 12c4-6 12-7 17-2l3-3v10l-3-3c-5 5-13 4-17-2z" fill="${color}" opacity="0.25"/>
        <path d="M2 12c4-6 12-7 17-2l3-3v10l-3-3c-5 5-13 4-17-2z" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
        <circle cx="6" cy="11" r="1.5" fill="${color}"/>
        <path d="M12 9c1 1.5 1 4.5 0 6M15 10c1 1 1 3 0 4" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      `;
      break;

    // 📱 هواتف وصيانة محمول
    case 'phone':
    case 'mobile':
      anim = 'svg-anim-pulse';
      inner = `
        <rect x="6" y="2" width="12" height="20" rx="3" fill="${color}" opacity="0.2"/>
        <rect x="6" y="2" width="12" height="20" rx="3" stroke="${color}" stroke-width="1.8" fill="none"/>
        <circle cx="12" cy="18" r="1.2" fill="${color}"/>
        <line x1="10" y1="5" x2="14" y2="5" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      `;
      break;

    // 🖥️ كمبيوتر، لاب توب، برمجيات
    case 'computer':
    case 'laptop':
      anim = 'svg-anim-pulse';
      inner = `
        <rect x="3" y="4" width="18" height="12" rx="2" fill="${color}" opacity="0.2"/>
        <rect x="3" y="4" width="18" height="12" rx="2" stroke="${color}" stroke-width="1.8" fill="none"/>
        <path d="M2 19h20M9 16v3M15 16v3" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      `;
      break;

    // ✂️ كوافير، صالون حلاقة، بيوتي سنتر
    case 'haircut':
    case 'barber':
    case 'beauty':
      anim = 'svg-anim-swing';
      inner = `
        <circle cx="6" cy="6" r="3" stroke="${color}" stroke-width="1.8" fill="none"/>
        <circle cx="6" cy="18" r="3" stroke="${color}" stroke-width="1.8" fill="none"/>
        <line x1="8.5" y1="8.5" x2="20" y2="20" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="8.5" y1="15.5" x2="20" y2="4" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      `;
      break;

    // 📷 استوديو تصوير وفوتوسيشن
    case 'camera':
    case 'photo':
      anim = 'svg-anim-pulse';
      inner = `
        <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="${color}" opacity="0.2"/>
        <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke="${color}" stroke-width="1.8" fill="none"/>
        <circle cx="12" cy="13" r="4" stroke="${color}" stroke-width="1.8" fill="${color}" opacity="0.4"/>
      `;
      break;

    // 👓 نظارات وبصريات
    case 'optics':
    case 'glasses':
      anim = 'svg-anim-float';
      inner = `
        <circle cx="6" cy="13" r="4" stroke="${color}" stroke-width="1.8" fill="${color}" opacity="0.2"/>
        <circle cx="18" cy="13" r="4" stroke="${color}" stroke-width="1.8" fill="${color}" opacity="0.2"/>
        <path d="M10 13c1-1 3-1 4 0M2 12l2-4M22 12l-2-4" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      `;
      break;

    // 🏧 صراف آلي ATM وبنوك
    case 'atm':
      anim = 'svg-anim-pulse';
      inner = `
        <rect x="3" y="4" width="18" height="16" rx="2" fill="${color}" opacity="0.2"/>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="${color}" stroke-width="1.8" fill="none"/>
        <rect x="6" y="7" width="12" height="4" rx="1" stroke="${color}" stroke-width="1.5" fill="none"/>
        <line x1="7" y1="15" x2="11" y2="15" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="14" y1="15" x2="17" y2="15" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      `;
      break;

    // 🏋️ جيم وألعاب قوى
    case 'gym':
      anim = 'svg-anim-pulse';
      inner = `
        <path d="M6 7v10M18 7v10M2 9v6M22 9v6M2 12h20M6 10v4M18 10v4" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      `;
      break;

    // 📕 قرآن كريم وقراء ومساجد
    case 'quran':
    case 'book':
      anim = 'svg-anim-float';
      inner = `
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="${color}" stroke-width="1.8" fill="none"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="${color}" opacity="0.25" stroke="${color}" stroke-width="1.8"/>
        <circle cx="12" cy="10" r="3" stroke="${color}" stroke-width="1.5" fill="none"/>
        <path d="M12 8v4M10 10h4" stroke="${color}" stroke-width="1.5"/>
      `;
      break;

    // 🚕 نقل ومواصلات وتوصيل
    case 'transport':
    case 'delivery':
      anim = 'svg-anim-float';
      inner = `
        <rect x="1" y="5" width="13" height="11" rx="1.5" fill="${color}" opacity="0.25" stroke="${color}" stroke-width="1.8"/>
        <path d="M14 8h4l3 3v5h-7V8z" fill="${color}" opacity="0.35" stroke="${color}" stroke-width="1.8"/>
        <circle cx="5.5" cy="18.5" r="2.5" fill="${color}"/>
        <circle cx="17.5" cy="18.5" r="2.5" fill="${color}"/>
      `;
      break;

    // 🏬 سوبر ماركت وهايبر وبقالة
    case 'supermarket':
    case 'grocery':
      anim = 'svg-anim-float';
      inner = `
        <circle cx="9" cy="20" r="2" fill="${color}"/>
        <circle cx="17" cy="20" r="2" fill="${color}"/>
        <path d="M3 4h3l2.5 11h11l2.5-8H7" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="${color}" opacity="0.2"/>
      `;
      break;

    // 🩺 صيدلية وعلاج وأدوية
    case 'pharmacy':
    case 'doctor':
    case 'clinic':
      anim = 'svg-anim-pulse';
      inner = `
        <rect x="3" y="5" width="18" height="14" rx="3" fill="${color}" opacity="0.2" stroke="${color}" stroke-width="1.8"/>
        <path d="M12 8v8M8 12h8" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      `;
      break;

    // Default universal star badge
    default:
      anim = 'svg-anim-pulse';
      inner = `
        <circle cx="12" cy="12" r="9" fill="${color}" opacity="0.2" stroke="${color}" stroke-width="1.8"/>
        <path d="M12 6l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L6.2 10.2l4-.6z" fill="${color}"/>
      `;
  }

  return `
    <span class="craft-svg-icon" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" class="${anim}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${inner}
      </svg>
    </span>
  `;
}

/**
 * Intelligent Slug & Category Detection
 */
export function detectCategoryType(input = '') {
  const s = String(input).toLowerCase();

  if (/wedding.*dress|atelier|اتيليه|اتيلية|فستان|فساتين|خطوبة|سهرة/.test(s)) return 'dress';
  if (/clothing|ملابس|بدل|عبايات|قميص/.test(s)) return 'clothing';
  if (/shoe|bag|حذاء|احذية|أحذية|شنط/.test(s)) return 'shoes';
  if (/wedding.*hall|قاعة|قاعات|افراح|أفراح|مناسبات/.test(s)) return 'wedding-halls';
  if (/butchery|meat|جزارة|لحوم|لحمة|عجول/.test(s)) return 'meat';
  if (/dairy|جبن|البان|ألبان|قشطة|زبادي|معمل/.test(s)) return 'dairy';
  if (/restaur|cafe|كافيه|مطعم|اكل|مأكولات|مشويات|شاورما|بيتزا|برجر/.test(s)) return 'restaurant';
  if (/fish|seafood|fesikh|سمك|اسماك|أسماك|فسيخ|رنجة|جمبري/.test(s)) return 'fish';
  if (/phone|mobile|موبايل|هواتف|تليفون|صيانة.*هواتف/.test(s)) return 'phone';
  if (/comput|laptop|كمبيوتر|لاب.*توب|سوفت/.test(s)) return 'computer';
  if (/hair|barber|حلاق|حلاقة|كوافير|تجميل|ميك.*اب|بيوتي/.test(s)) return 'haircut';
  if (/photo|camera|تصوير|سيشن|استوديو|ستديو/.test(s)) return 'camera';
  if (/optic|glasses|نظارات|بصريات|عدسات/.test(s)) return 'optics';
  if (/atm|صراف|بنك/.test(s)) return 'atm';
  if (/gym|جيم|لياقة|فتنس|حديد|كاراتيه|تايكوندو/.test(s)) return 'gym';
  if (/quran|قرآن|مصحف|شيخ|قارئ/.test(s)) return 'quran';
  if (/transport|delivery|توصيل|دليفري|نقل|تاكسي|اوبر/.test(s)) return 'transport';
  if (/supermarket|hypermarket|grocery|سوبر.*ماركت|هايبر|بقالة/.test(s)) return 'supermarket';
  if (/pharmacy|doctor|clinic|medical|صيدلية|دكتور|طبيب|عيادة|مستشفى/.test(s)) return 'pharmacy';

  // Crafts
  if (/plumb|سباك|سباكة|صرف/.test(s)) return 'plumbing-main';
  if (/electr|كهربا|كهربائي|انارة/.test(s)) return 'electrical-main';
  if (/carpenter|furniture|نجار|نجارة|موبيليا|اثاث/.test(s)) return 'carpenter-main';
  if (/paint|دهان|نقاش|بويات/.test(s)) return 'paint-main';
  if (/hvac|تكييف|تبريد|ثلاجات/.test(s)) return 'hvac-main';
  if (/blacksmith|حداد|حدادة|الوميتال/.test(s)) return 'blacksmith-main';
  if (/mechanic|ميكانيك|سيارات|كاوتش/.test(s)) return 'automotive-main';

  return 'default';
}

/**
 * Main function: getCategorySvg(slugOrName, options)
 */
export function getCategorySvg(slugOrName = '', sizeOrOptions = 36) {
  const size = typeof sizeOrOptions === 'number' ? sizeOrOptions : (sizeOrOptions.size || 36);
  const color = (typeof sizeOrOptions === 'object' && sizeOrOptions.color) ? sizeOrOptions.color : null;
  const cleanStr = String(slugOrName || '').trim();

  const detected = detectCategoryType(cleanStr);
  const finalColor = color || PALETTES[hashStr(cleanStr) % PALETTES.length];

  // If detected type is a profession craft type, call createSvgIcon
  if (detected.includes('-main')) {
    return createSvgIcon(detected, { size, color: finalColor });
  }

  return getDirectSvg(detected, finalColor, size);
}
