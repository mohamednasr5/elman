/**
 * professions-data.js
 * Comprehensive Professions & Craft Categories System with Professional Animated SVGs
 * 
 * 15 Main Craft & Service Categories + 165+ Detailed Professional Trades
 * High-performance, lightweight, dual-tone animated SVG vector rendering
 */

import { normalizeArabic } from './arabic.js';

/**
 * ── SVG Icon Generator ──
 * Generates lightweight, scalable, dual-tone animated SVGs
 */
export function createSvgIcon(type, { size = 24, className = '', color = 'currentColor', secondaryColor = '' } = {}) {
  const sec = secondaryColor || color;

  let inner = '';
  let animClass = '';

  switch (type) {
    /* ── 1. Finishing & Decor (التشطيبات والديكور) ── */
    case 'decor-main':
    case 'paint-roller':
    case 'painter':
      animClass = 'svg-anim-swing';
      inner = `
        <rect x="4" y="3" width="13" height="6" rx="2" fill="${sec}" opacity="0.25" />
        <rect x="4" y="3" width="13" height="6" rx="2" stroke="${color}" stroke-width="2" fill="none" />
        <path d="M17 6h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-8v6a2 2 0 0 1-2 2H8" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <path d="M7 5v2M10 5v2M13 5v2" stroke="${color}" stroke-width="1.5" stroke-linecap="round" />
      `;
      break;

    case 'tiler':
    case 'tiles':
      animClass = 'svg-anim-pulse';
      inner = `
        <rect x="3" y="3" width="8" height="8" rx="1.5" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="1.8" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" fill="${color}" opacity="0.85" stroke="${color}" stroke-width="1.8" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" fill="${color}" opacity="0.85" stroke="${color}" stroke-width="1.8" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="1.8" />
      `;
      break;

    case 'plasterer':
    case 'trowel':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M4 14l8-8 8 8-8 4-8-4z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <path d="M12 10v-3a2 2 0 0 0-2-2H8" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'gypsum-board':
    case 'level-ruler':
      animClass = 'svg-anim-pulse';
      inner = `
        <rect x="2" y="7" width="20" height="10" rx="2" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <line x1="6" y1="10" x2="6" y2="14" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="12" y1="9" x2="12" y2="15" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="18" y1="10" x2="18" y2="14" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'decor-technician':
    case 'palette':
      animClass = 'svg-anim-swing';
      inner = `
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.2 0 2.2-.9 2.2-2.1 0-.6-.2-1.1-.6-1.5-.4-.4-.6-.9-.6-1.4 0-1.2 1-2.2 2.2-2.2H17c2.8 0 5-2.2 5-5 0-5.4-4.5-9.8-10-9.8z" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <circle cx="7.5" cy="10.5" r="1.5" fill="${color}" />
        <circle cx="11.5" cy="7.5" r="1.5" fill="${color}" />
        <circle cx="16.5" cy="10.5" r="1.5" fill="${color}" />
      `;
      break;

    case 'wallpaper-tech':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2z" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <path d="M14 2v6h6" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <path d="M8 13h8M8 17h5" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'marble':
    case 'marble-alternative-tech':
    case 'marble-granite-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <rect x="3" y="4" width="18" height="16" rx="2" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <path d="M4 18l6-6 4 3 6-7" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M5 8l4 4" stroke="${color}" stroke-width="1.5" stroke-linecap="round" />
      `;
      break;

    case 'wood-alternative-tech':
    case 'parquet-tech':
    case 'flooring-tech':
      animClass = 'svg-anim-float';
      inner = `
        <rect x="3" y="3" width="18" height="6" rx="1.5" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="1.8" />
        <rect x="3" y="11" width="18" height="6" rx="1.5" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="1.8" />
        <path d="M7 5v2M15 5v2M11 13v2" stroke="${color}" stroke-width="1.5" stroke-linecap="round" />
      `;
      break;

    case 'insulation-tech':
    case 'roof-insulation-tech':
    case 'bathroom-insulation-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M12 3L3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9l-9-6z" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <path d="M8 14c1.5-1.5 3-1.5 4 0s3 1.5 4 0" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'door-installer':
      animClass = 'svg-anim-swing';
      inner = `
        <rect x="5" y="3" width="14" height="18" rx="1" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <circle cx="15" cy="12" r="1.5" fill="${color}" />
        <line x1="5" y1="21" x2="19" y2="21" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    /* ── 2. Plumbing & Drainage (السباكة والصرف) ── */
    case 'plumbing-main':
    case 'plumber':
    case 'wrench-pipe':
      animClass = 'svg-anim-wrench';
      inner = `
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="18" cy="6" r="1.5" fill="${color}" />
      `;
      break;

    case 'sewage-tech':
    case 'drain-unclogging-tech':
    case 'pipe':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M3 7h6v4H3zM15 13h6v4h-6z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <path d="M9 9h6v6H9z" fill="${sec}" opacity="0.5" stroke="${color}" stroke-width="2" />
        <path d="M12 3v3M12 18v3" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'leak-detection-tech':
    case 'water-drop':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <circle cx="12" cy="14" r="3" stroke="${color}" stroke-width="1.8" fill="none" />
      `;
      break;

    case 'water-heater-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <rect x="6" y="3" width="12" height="18" rx="3" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <circle cx="12" cy="9" r="2.5" stroke="${color}" stroke-width="1.8" fill="none" />
        <path d="M10 16c1-1 3-1 4 0" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="9" y1="21" x2="9" y2="23" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="15" y1="21" x2="15" y2="23" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'water-pump-tech':
    case 'water-filter-tech':
    case 'water-tank-tech':
    case 'swimming-pool-tech':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M3 15c3-2 6 2 9 0s6-2 9 0" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
        <path d="M3 19c3-2 6 2 9 0s6-2 9 0" stroke="${color}" stroke-width="2.2" stroke-linecap="round" opacity="0.6" />
        <circle cx="12" cy="8" r="4" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <path d="M12 6v4M10 8h4" stroke="${color}" stroke-width="1.8" stroke-linecap="round" />
      `;
      break;

    /* ── 3. Electrical (الكهرباء) ── */
    case 'electrical-main':
    case 'electrician':
    case 'lightning':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="${sec}" opacity="0.35" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
      `;
      break;

    case 'electrical-panels-tech':
    case 'control-tech':
      animClass = 'svg-anim-spin';
      inner = `
        <rect x="3" y="3" width="18" height="18" rx="2" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <circle cx="8" cy="8" r="1.5" fill="${color}" />
        <circle cx="16" cy="8" r="1.5" fill="${color}" />
        <path d="M8 14h8M8 17h5" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'cctv-tech':
    case 'security-camera':
      animClass = 'svg-anim-blink';
      inner = `
        <path d="M3 10h14l3-4v8l-3-4" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <rect x="2" y="8" width="14" height="8" rx="2" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <circle cx="7" cy="12" r="2" fill="${color}" />
        <path d="M6 16v4h4" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'fire-alarm-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <circle cx="12" cy="12" r="8" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <path d="M12 8v4l2.5 2.5" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <path d="M8 2h8M12 2v2" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'solar-energy-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <circle cx="12" cy="6" r="3" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="2" />
        <path d="M4 14l3-4h10l3 4-2 7H6l-2-7z" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <line x1="12" y1="10" x2="12" y2="21" stroke="${color}" stroke-width="1.8" />
        <line x1="6" y1="15" x2="18" y2="15" stroke="${color}" stroke-width="1.8" />
      `;
      break;

    case 'networks-tech':
    case 'satellite-dish-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <circle cx="12" cy="18" r="3" fill="${color}" />
        <circle cx="6" cy="6" r="3" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="2" />
        <circle cx="18" cy="6" r="3" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="2" />
        <path d="M8.5 7.5L11 15.5M15.5 7.5L13 15.5" stroke="${color}" stroke-width="2" />
      `;
      break;

    /* ── 4. HVAC & Refrigeration (التكييف والتبريد) ── */
    case 'hvac-main':
    case 'ac-technician':
    case 'snowflake':
      animClass = 'svg-anim-spin';
      inner = `
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="12" r="2.5" fill="${sec}" opacity="0.6" stroke="${color}" stroke-width="1.5" />
      `;
      break;

    case 'refrigerator-tech':
    case 'fridge':
      animClass = 'svg-anim-float';
      inner = `
        <rect x="5" y="2" width="14" height="20" rx="2" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <line x1="5" y1="9" x2="19" y2="9" stroke="${color}" stroke-width="2" />
        <line x1="8" y1="5" x2="8" y2="7" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="8" y1="12" x2="8" y2="15" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'ventilation-tech':
    case 'exhaust-fan-tech':
      animClass = 'svg-anim-spin';
      inner = `
        <circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="2" fill="${sec}" opacity="0.1" />
        <path d="M12 12c-2-3-4-2-4 0s3 2 4 0zm0 0c3-2 2-4 0-4s-2 3 0 4zm0 0c2 3 4 2 4 0s-3-2-4 0zm0 0c-3 2-2 4 0 4s2-3 0-4z" fill="${color}" opacity="0.85" />
      `;
      break;

    /* ── 5. Carpentry & Furniture (النجارة والأثاث) ── */
    case 'carpentry-main':
    case 'carpenter':
    case 'saw':
      animClass = 'svg-anim-swing';
      inner = `
        <path d="M3 17l6-6 3 3-6 6H3v-3z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <path d="M9 11l9-9a2 2 0 0 1 2.8 2.8L12 14" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <path d="M14 6l-1 1M16 8l-1 1M18 10l-1 1" stroke="${color}" stroke-width="1.8" />
      `;
      break;

    case 'upholsterer':
    case 'sofa':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <rect x="2" y="11" width="20" height="7" rx="2" fill="${sec}" opacity="0.35" stroke="${color}" stroke-width="2" />
        <line x1="5" y1="18" x2="5" y2="21" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="19" y1="18" x2="19" y2="21" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'curtains-tech':
      animClass = 'svg-anim-swing';
      inner = `
        <line x1="2" y1="4" x2="22" y2="4" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
        <path d="M4 4c1 4 0 12-1 16M9 4c-1 4 0 12 1 16M15 4c1 4 0 12-1 16M20 4c-1 4 0 12 1 16" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none" />
      `;
      break;

    /* ── 6. Building & Construction (البناء والإنشاء) ── */
    case 'construction-main':
    case 'builder':
    case 'brick-wall':
      animClass = 'svg-anim-pulse';
      inner = `
        <rect x="3" y="4" width="18" height="16" rx="2" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <line x1="3" y1="9" x2="21" y2="9" stroke="${color}" stroke-width="2" />
        <line x1="3" y1="15" x2="21" y2="15" stroke="${color}" stroke-width="2" />
        <line x1="9" y1="4" x2="9" y2="9" stroke="${color}" stroke-width="1.8" />
        <line x1="15" y1="4" x2="15" y2="9" stroke="${color}" stroke-width="1.8" />
        <line x1="6" y1="9" x2="6" y2="15" stroke="${color}" stroke-width="1.8" />
        <line x1="12" y1="9" x2="12" y2="15" stroke="${color}" stroke-width="1.8" />
        <line x1="18" y1="9" x2="18" y2="15" stroke="${color}" stroke-width="1.8" />
      `;
      break;

    case 'scaffolding-tech':
    case 'crane':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M4 21V4l14 6H4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M18 10v6l-2 2" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="2" y1="21" x2="22" y2="21" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    /* ── 7. Automotive & Vehicles (السيارات والمركبات) ── */
    case 'automotive-main':
    case 'car-mechanic':
    case 'car':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <rect x="2" y="13" width="20" height="6" rx="2" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <circle cx="7" cy="18" r="2.5" fill="${color}" />
        <circle cx="17" cy="18" r="2.5" fill="${color}" />
      `;
      break;

    case 'tire-tech':
    case 'wheel':
      animClass = 'svg-anim-spin';
      inner = `
        <circle cx="12" cy="12" r="9" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <circle cx="12" cy="12" r="4" stroke="${color}" stroke-width="2" />
        <line x1="12" y1="3" x2="12" y2="8" stroke="${color}" stroke-width="2" />
        <line x1="12" y1="16" x2="12" y2="21" stroke="${color}" stroke-width="2" />
        <line x1="3" y1="12" x2="8" y2="12" stroke="${color}" stroke-width="2" />
        <line x1="16" y1="12" x2="21" y2="12" stroke="${color}" stroke-width="2" />
      `;
      break;

    case 'car-battery-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <rect x="3" y="6" width="18" height="14" rx="2" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <line x1="7" y1="3" x2="7" y2="6" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
        <line x1="17" y1="3" x2="17" y2="6" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
        <path d="M6 11h3M15 11h4M17 9v4" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    /* ── 8. Blacksmith & Alumital (الحدادة والألوميتال) ── */
    case 'blacksmith-main':
    case 'anvil':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M4 8h16l-3 4H7L4 8z" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <path d="M7 12v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6" stroke="${color}" stroke-width="2" fill="${sec}" opacity="0.2" />
        <path d="M2 8c2-2 4-2 6-2" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'welder':
    case 'electric-welder':
    case 'spark':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M14.5 4l-4 8h5l-3 8 7-10h-5l3-6h-3z" fill="${color}" opacity="0.9" />
        <circle cx="7" cy="16" r="3" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="1.8" />
      `;
      break;

    case 'alumital-tech':
    case 'window':
      animClass = 'svg-anim-float';
      inner = `
        <rect x="3" y="3" width="18" height="18" rx="2" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <line x1="12" y1="3" x2="12" y2="21" stroke="${color}" stroke-width="2" />
        <line x1="3" y1="12" x2="21" y2="12" stroke="${color}" stroke-width="2" />
      `;
      break;

    /* ── 9. Cleaning & Home Services (النظافة والخدمات المنزلية) ── */
    case 'cleaning-main':
    case 'cleaner':
    case 'broom-sparkle':
      animClass = 'svg-anim-swing';
      inner = `
        <path d="M18 3L9 12l2 2 9-9-2-2z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <path d="M9 12l-5 5a3 3 0 0 0 4.2 4.2l5-5" stroke="${color}" stroke-width="2" fill="${color}" opacity="0.8" />
        <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="${sec}" />
      `;
      break;

    case 'pest-control':
    case 'shield-bug':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <circle cx="12" cy="11" r="2.5" fill="${color}" />
        <path d="M9 11h6M10 8l-2-2M14 8l2-2M10 14l-2 2M14 14l2 2" stroke="${color}" stroke-width="1.8" stroke-linecap="round" />
      `;
      break;

    /* ── 10. Agriculture & Gardening (الزراعة والحدائق) ── */
    case 'agriculture-main':
    case 'gardener':
    case 'sprout-plant':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M12 21V10" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <path d="M12 10c0-4 4-7 8-7-1 5-4 7-8 7z" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <path d="M12 14c0-3-3-5-6-5 1 4 3 5 6 5z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
      `;
      break;

    case 'tree-pruning-tech':
    case 'shears':
      animClass = 'svg-anim-swing';
      inner = `
        <circle cx="6" cy="6" r="3" stroke="${color}" stroke-width="2" fill="none" />
        <circle cx="6" cy="18" r="3" stroke="${color}" stroke-width="2" fill="none" />
        <path d="M8.5 8.5L20 20M8.5 15.5L20 4" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    /* ── 11. Home Appliances (الأجهزة المنزلية) ── */
    case 'appliances-main':
    case 'washing-machine':
      animClass = 'svg-anim-spin';
      inner = `
        <rect x="4" y="2" width="16" height="20" rx="3" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <circle cx="12" cy="13" r="5" stroke="${color}" stroke-width="2" />
        <circle cx="12" cy="13" r="2.5" fill="${color}" opacity="0.6" />
        <circle cx="8" cy="5" r="1" fill="${color}" />
        <circle cx="11" cy="5" r="1" fill="${color}" />
      `;
      break;

    case 'tv-screens-tech':
      animClass = 'svg-anim-pulse';
      inner = `
        <rect x="2" y="5" width="20" height="13" rx="2" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <path d="M8 21h8M12 18v3" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="11.5" r="2" fill="${color}" />
      `;
      break;

    /* ── 12. Tailoring & Clothing (الملابس والخياطة) ── */
    case 'tailoring-main':
    case 'tailor':
    case 'scissors':
      animClass = 'svg-anim-swing';
      inner = `
        <circle cx="6" cy="6" r="3" stroke="${color}" stroke-width="2" fill="none" />
        <circle cx="6" cy="18" r="3" stroke="${color}" stroke-width="2" fill="none" />
        <line x1="8.5" y1="8.5" x2="20" y2="20" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <line x1="8.5" y1="15.5" x2="20" y2="4" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    case 'sewing-needle':
    case 'embroidery':
      animClass = 'svg-anim-float';
      inner = `
        <path d="M19 5c1-1 2 0 1 1L7 19a2 2 0 0 1-2.8-2.8L17 3c.5-.5 1.5-.5 2 0z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="1.8" />
        <circle cx="18" cy="5" r="0.8" fill="${color}" />
        <path d="M5 19c-2 2-3 1-3 3" stroke="${color}" stroke-width="1.8" stroke-linecap="round" />
      `;
      break;

    /* ── 13. Barber & Beauty (الحلاقة والتجميل) ── */
    case 'barber-main':
    case 'barber':
    case 'barber-pole':
      animClass = 'svg-anim-float';
      inner = `
        <rect x="7" y="5" width="10" height="14" rx="3" fill="${sec}" opacity="0.25" stroke="${color}" stroke-width="2" />
        <line x1="7" y1="9" x2="17" y2="13" stroke="${color}" stroke-width="2" />
        <line x1="7" y1="13" x2="17" y2="17" stroke="${color}" stroke-width="2" />
        <circle cx="12" cy="3" r="2" fill="${color}" />
        <circle cx="12" cy="21" r="2" fill="${color}" />
      `;
      break;

    case 'makeup-artist':
    case 'sparkle-beauty':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M12 2l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <circle cx="12" cy="11" r="2" fill="${color}" />
      `;
      break;

    /* ── 14. Transportation & Logistics (النقل والخدمات) ── */
    case 'transport-main':
    case 'truck-driver':
    case 'truck':
      animClass = 'svg-anim-float';
      inner = `
        <rect x="1" y="5" width="13" height="11" rx="1.5" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <path d="M14 8h4l3 3v5h-7V8z" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="2" />
        <circle cx="5.5" cy="18.5" r="2.5" fill="${color}" />
        <circle cx="17.5" cy="18.5" r="2.5" fill="${color}" />
      `;
      break;

    case 'furniture-crane-lift':
    case 'winch':
      animClass = 'svg-anim-swing';
      inner = `
        <path d="M4 21V5l12 7H4" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <path d="M16 12v5" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <rect x="13" y="17" width="6" height="4" rx="1" fill="${sec}" opacity="0.4" stroke="${color}" stroke-width="1.8" />
      `;
      break;

    case 'taxi-driver':
      animClass = 'svg-anim-float';
      inner = `
        <rect x="3" y="10" width="18" height="8" rx="2" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <path d="M6 10l2-5h8l2 5" stroke="${color}" stroke-width="2" />
        <rect x="9" y="3" width="6" height="2.5" rx="1" fill="${color}" />
        <circle cx="7" cy="18" r="2" fill="${color}" />
        <circle cx="17" cy="18" r="2" fill="${color}" />
      `;
      break;

    /* ── 15. Miscellaneous Services (خدمات متنوعة) ── */
    case 'misc-main':
    case 'key':
    case 'locksmith-keys':
      animClass = 'svg-anim-float';
      inner = `
        <circle cx="7.5" cy="12" r="4.5" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" />
        <circle cx="7.5" cy="12" r="1.8" fill="${color}" />
        <path d="M12 12h9v3h-3v2h-2v-5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      `;
      break;

    case 'security-systems-tech':
    case 'shield-check':
      animClass = 'svg-anim-pulse';
      inner = `
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="${sec}" opacity="0.3" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      `;
      break;

    case 'advertising-tech':
    case 'megaphone':
      animClass = 'svg-anim-swing';
      inner = `
        <path d="M3 11v2a2 2 0 0 0 2 2h2l6 4V5L7 9H5a2 2 0 0 0-2 2z" fill="${sec}" opacity="0.35" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <path d="M17 9c1.5 1.5 1.5 4.5 0 6M20 7c3 3 3 7 0 10" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
      break;

    default:
      animClass = 'svg-anim-pulse';
      inner = `
        <circle cx="12" cy="12" r="9" fill="${sec}" opacity="0.2" stroke="${color}" stroke-width="2" />
        <path d="M12 8v4l3 3" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
  }

  return `
    <span class="craft-svg-icon ${className}" style="width:${size}px;height:${size}px;">
      <svg viewBox="0 0 24 24" fill="none" class="${animClass}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${inner}
      </svg>
    </span>
  `;
}

/**
 * ── The 15 Main Craft Categories & 165+ Detailed Trades ──
 */
export const PROFESSION_CATEGORIES = [
  {
    id: 'decor-finishing',
    slug: 'decor-finishing',
    name: 'التشطيبات والديكور',
    nameEn: 'Finishing & Decoration',
    icon: '🏠',
    svgType: 'decor-main',
    color: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    description: 'أعمال الدهانات والنقاشة، السيراميك، البورسلين، الجبس بورد، وعزل الأسطح والحمامات',
    order: 10,
    professions: [
      { id: 'painter', name: 'نقاش', nameEn: 'Painter', svgType: 'paint-roller', keywords: ['دهان', 'بوية', 'بويات', 'تشطيب'] },
      { id: 'tiler', name: 'مبلط', nameEn: 'Tiler', svgType: 'tiler', keywords: ['بلاط', 'سيراميك', 'ارضيات'] },
      { id: 'plasterer', name: 'محارة', nameEn: 'Plasterer', svgType: 'plasterer', keywords: ['مبيض', 'اسمنت'] },
      { id: 'gypsum-board', name: 'معلم جبس بورد', nameEn: 'Gypsum Board Tech', svgType: 'gypsum-board', keywords: ['جبسن', 'اسقف معلقة', 'ديكور جبس'] },
      { id: 'decor-technician', name: 'فني ديكور', nameEn: 'Decor Technician', svgType: 'decor-technician', keywords: ['مهندس ديكور', 'مصمم داخلي'] },
      { id: 'wallpaper-tech', name: 'فني ورق حائط', nameEn: 'Wallpaper Tech', svgType: 'wallpaper-tech', keywords: ['ورق جدران', 'ثري دي', '3d'] },
      { id: 'marble-alternative-tech', name: 'فني بديل رخام', nameEn: 'Faux Marble Tech', svgType: 'marble', keywords: ['بديل الرخام', 'pvc رخام'] },
      { id: 'wood-alternative-tech', name: 'فني بديل خشب', nameEn: 'Faux Wood Tech', svgType: 'wood-alternative-tech', keywords: ['بديل الخشب', 'wpc خشب'] },
      { id: 'flooring-tech', name: 'فني أرضيات', nameEn: 'Flooring Tech', svgType: 'flooring-tech', keywords: ['ايبوكسي', 'فينيل', 'ارضيات'] },
      { id: 'parquet-tech', name: 'فني باركيه', nameEn: 'Parquet Tech', svgType: 'wood-alternative-tech', keywords: ['باركيه', 'خشب ارضيات', 'hdl'] },
      { id: 'marble-granite-tech', name: 'فني رخام وجرانيت', nameEn: 'Marble & Granite Tech', svgType: 'marble', keywords: ['رخام', 'جرانيت', 'مطابخ رخام', 'درج'] },
      { id: 'hashemi-stone-tech', name: 'فني حجر هاشمي', nameEn: 'Hashemi Stone Tech', svgType: 'construction-main', keywords: ['حجر مايكا', 'حجر فرعوني', 'واجهات'] },
      { id: 'roof-insulation-tech', name: 'فني عزل أسطح', nameEn: 'Roof Insulation Tech', svgType: 'insulation-tech', keywords: ['عزل مائي', 'عزل حراري', 'انسومات'] },
      { id: 'bathroom-insulation-tech', name: 'فني عزل حمامات', nameEn: 'Bathroom Insulation Tech', svgType: 'insulation-tech', keywords: ['عزل كيميائي', 'تسريب'] },
      { id: 'ceramic-installer', name: 'فني تركيب سيراميك', nameEn: 'Ceramic Installer', svgType: 'tiler', keywords: ['سيراميك', 'بلاط حمامات'] },
      { id: 'porcelain-installer', name: 'فني تركيب بورسلين', nameEn: 'Porcelain Installer', svgType: 'tiler', keywords: ['بورسلين كليوباترا', 'بورسلين هندي'] },
      { id: 'expansion-joints-tech', name: 'فني فواصل وتمدد', nameEn: 'Expansion Joints Tech', svgType: 'tiler', keywords: ['فواصل بلاط', 'تمدد'] },
      { id: 'silicone-tech', name: 'فني سيلكون', nameEn: 'Silicone Tech', svgType: 'insulation-tech', keywords: ['سيلكون', 'فوم', 'سد فواصل'] },
      { id: 'kitchen-installer', name: 'فني تركيب مطابخ', nameEn: 'Kitchen Installer', svgType: 'carpenter', keywords: ['مطبخ خشب', 'مطبخ الوميتال', 'خشمونيوم'] },
      { id: 'door-installer', name: 'فني تركيب أبواب', nameEn: 'Door Installer', svgType: 'door-installer', keywords: ['باب مصفح', 'ابواب غرف', 'كالون'] },
      { id: 'furniture-installer-decor', name: 'فني تركيب أثاث', nameEn: 'Furniture Installer', svgType: 'carpenter', keywords: ['ايكيا', 'غرف نوم', 'سفره'] }
    ]
  },
  {
    id: 'plumbing-drainage',
    slug: 'plumbing-drainage',
    name: 'السباكة والصرف',
    nameEn: 'Plumbing & Drainage',
    icon: '🔧',
    svgType: 'plumbing-main',
    color: '#0891B2',
    gradient: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    description: 'تأسيس وصيانة السباكة، تسليك المجاري، فلاتر المياه، السخانات، ومضخات وخزانات المياه',
    order: 11,
    professions: [
      { id: 'plumber', name: 'سباك', nameEn: 'Plumber', svgType: 'plumber', keywords: ['صنايعي سباكة', 'سباك شاطر', 'ادوات صحية'] },
      { id: 'sewage-tech', name: 'فني صرف صحي', nameEn: 'Sewage Tech', svgType: 'sewage-tech', keywords: ['بيارات', 'خطوط صرف', 'مواسير صرف'] },
      { id: 'drain-unclogging-tech', name: 'فني تسليك مجاري', nameEn: 'Drain Unclogging Tech', svgType: 'drain-unclogging-tech', keywords: ['تسليك حوض', 'تسليك بلاعة', 'ضغط نيتروجين'] },
      { id: 'leak-detection-tech', name: 'فني كشف تسربات', nameEn: 'Leak Detection Tech', svgType: 'leak-detection-tech', keywords: ['كشف تسريب', 'جهاز كشف التسرب'] },
      { id: 'pipe-installation-tech', name: 'فني تركيب مواسير', nameEn: 'Pipe Installation Tech', svgType: 'pipe', keywords: ['تغذية', 'بولي بروبلين', 'شريف'] },
      { id: 'water-heater-tech', name: 'فني سخانات', nameEn: 'Water Heater Tech', svgType: 'water-heater-tech', keywords: ['سخان غاز', 'سخان كهرباء', 'اوليمبيك', 'توشيبا'] },
      { id: 'water-filter-tech', name: 'فني فلاتر مياه', nameEn: 'Water Filter Tech', svgType: 'water-filter-tech', keywords: ['فلتر 7 مراحل', 'تغيير شمعات', 'مياه نقية'] },
      { id: 'water-pump-tech', name: 'فني مضخات مياه', nameEn: 'Water Pump Tech', svgType: 'water-pump-tech', keywords: ['ماتور مياه', 'كالبيدا', 'موتور'] },
      { id: 'water-tank-tech', name: 'فني خزانات مياه', nameEn: 'Water Tank Tech', svgType: 'water-tank-tech', keywords: ['خزان اسطح', 'عوامة خزان'] },
      { id: 'swimming-pool-tech', name: 'فني حمامات سباحة', nameEn: 'Swimming Pool Tech', svgType: 'swimming-pool-tech', keywords: ['مسبح', 'فلاتر مسابح', 'كلور'] }
    ]
  },
  {
    id: 'electrical',
    slug: 'electrical',
    name: 'الكهرباء',
    nameEn: 'Electrical',
    icon: '⚡',
    svgType: 'electrical-main',
    color: '#D97706',
    gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    description: 'تأسيس وصيانة كهرباء المنازل والمصانع، اللوحات، كاميرات المراقبة، الطاقة الشمسية، والدش',
    order: 12,
    professions: [
      { id: 'electrician', name: 'كهربائي', nameEn: 'Electrician', svgType: 'electrician', keywords: ['سيليسيون', 'فني كهرباء', 'كهربائي منازل'] },
      { id: 'home-electrician', name: 'فني كهرباء منازل', nameEn: 'Home Electrician', svgType: 'electrician', keywords: ['توصيل كهرباء', 'اسبوتات', 'ليد بروفايل'] },
      { id: 'factory-electrician', name: 'فني كهرباء مصانع', nameEn: 'Factory Electrician', svgType: 'electrical-panels-tech', keywords: ['جهد عالي', '3 فاز', 'محركات'] },
      { id: 'electrical-panels-tech', name: 'فني لوحات كهربائية', nameEn: 'Electrical Panels Tech', svgType: 'electrical-panels-tech', keywords: ['قواطع', 'شنايدر', 'لوحة توزيع'] },
      { id: 'control-tech', name: 'فني كنترول', nameEn: 'Control & PLC Tech', svgType: 'control-tech', keywords: ['plc', 'كلاسيك كنترول', 'حساسات'] },
      { id: 'fire-alarm-tech', name: 'فني إنذار حريق', nameEn: 'Fire Alarm Tech', svgType: 'fire-alarm-tech', keywords: ['حساس دخان', 'انذار مبكر'] },
      { id: 'cctv-tech', name: 'فني كاميرات مراقبة', nameEn: 'CCTV Tech', svgType: 'cctv-tech', keywords: ['كاميرات داهوا', 'هيكفيجن', 'dvr'] },
      { id: 'networks-tech', name: 'فني شبكات', nameEn: 'Networks Tech', svgType: 'networks-tech', keywords: ['راوتر', 'سويتش', 'كابلات انترنت'] },
      { id: 'intercom-tech', name: 'فني إنتركم', nameEn: 'Intercom Tech', svgType: 'intercom-tech', keywords: ['انتركم صوتي', 'انتركم مرئي', 'كالون كهربائي'] },
      { id: 'satellite-dish-tech', name: 'فني دش وستالايت', nameEn: 'Satellite Dish Tech', svgType: 'satellite-dish-tech', keywords: ['دش', 'نايل سات', 'رسيفر', 'ضبط اشارة'] },
      { id: 'solar-energy-tech', name: 'فني طاقة شمسية', nameEn: 'Solar Energy Tech', svgType: 'solar-energy-tech', keywords: ['الواح شمسية', 'انفرتر', 'طاقة نظيفة'] },
      { id: 'generator-tech', name: 'فني مولدات كهرباء', nameEn: 'Generators Tech', svgType: 'electrical-panels-tech', keywords: ['مولد ديزل', 'مولد بنزين'] },
      { id: 'ups-tech', name: 'فني UPS', nameEn: 'UPS Tech', svgType: 'electrical-panels-tech', keywords: ['طاقة احتياطية', 'انقطاع كهرباء', 'بطاريات ups'] }
    ]
  },
  {
    id: 'hvac-refrigeration',
    slug: 'hvac-refrigeration',
    name: 'التكييف والتبريد',
    nameEn: 'HVAC & Refrigeration',
    icon: '❄️',
    svgType: 'hvac-main',
    color: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    description: 'صيانة وشحن وتركيب التكييفات، غرف التبريد، الثلاجات، الفريزر، والشفاطات المركزية',
    order: 13,
    professions: [
      { id: 'ac-technician', name: 'فني تكييف', nameEn: 'AC Tech', svgType: 'ac-technician', keywords: ['شحن فريون', 'شارب', 'كارير', 'تكييف سبليت'] },
      { id: 'central-ac-tech', name: 'فني تكييف مركزي', nameEn: 'Central AC Tech', svgType: 'ac-technician', keywords: ['كونسيلد', 'دكت تكييف', 'تشيلر'] },
      { id: 'refrigeration-tech', name: 'فني تبريد', nameEn: 'Refrigeration Tech', svgType: 'refrigerator-tech', keywords: ['غرف تبريد', 'غرف تجميد', 'كمبروسر'] },
      { id: 'refrigerator-tech', name: 'فني ثلاجات', nameEn: 'Refrigerator Tech', svgType: 'refrigerator-tech', keywords: ['توشيبا', 'ال جي', 'شارب', 'تسريب فريون'] },
      { id: 'freezer-tech', name: 'فني فريزر', nameEn: 'Freezer Tech', svgType: 'refrigerator-tech', keywords: ['ديب فريزر', 'كريازي'] },
      { id: 'dishwasher-tech', name: 'فني غسالات أطباق', nameEn: 'Dishwasher Tech', svgType: 'appliances-main', keywords: ['غسالة اطباق', 'بيكو'] },
      { id: 'exhaust-fan-tech', name: 'فني شفاطات', nameEn: 'Exhaust Fan Tech', svgType: 'ventilation-tech', keywords: ['شفاط مطبخ', 'شفاط حمام', 'تورنيدو'] },
      { id: 'ventilation-tech', name: 'فني تهوية', nameEn: 'Ventilation Tech', svgType: 'ventilation-tech', keywords: ['مداخن', 'هوايات'] }
    ]
  },
  {
    id: 'carpentry-furniture',
    slug: 'carpentry-furniture',
    name: 'النجارة والأثاث',
    nameEn: 'Carpentry & Furniture',
    icon: '🪚',
    svgType: 'carpentry-main',
    color: '#92400E',
    gradient: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
    description: 'تفصيل وصيانة الموبيليا وغرف النوم، الأبواب، المطابخ، التنجيد، وتركيب الأثاث',
    order: 14,
    professions: [
      { id: 'carpenter', name: 'نجار', nameEn: 'Carpenter', svgType: 'carpenter', keywords: ['صنايعي نجار', 'باب وشباك', 'كالون'] },
      { id: 'furniture-carpenter', name: 'نجار موبيليا', nameEn: 'Furniture Carpenter', svgType: 'carpenter', keywords: ['غرف نوم', 'سفره', 'صالون', 'انتريه'] },
      { id: 'concrete-formwork-carpenter', name: 'نجار مسلح', nameEn: 'Shuttering Carpenter', svgType: 'carpenter', keywords: ['خرسانات', 'سقف', 'اعمدة'] },
      { id: 'door-carpenter', name: 'نجار أبواب', nameEn: 'Door Carpenter', svgType: 'door-installer', keywords: ['حلق باب', 'كالون', 'مفصلات'] },
      { id: 'kitchen-carpenter', name: 'نجار مطابخ', nameEn: 'Kitchen Carpenter', svgType: 'carpenter', keywords: ['دواليب مطبخ', 'خشب طبيعي', 'mdf'] },
      { id: 'alumital-carpenter', name: 'نجار ألوميتال', nameEn: 'Alumital Tech', svgType: 'alumital-tech', keywords: ['الوميتال جامبو', 'تيكنو'] },
      { id: 'furniture-assembly-tech', name: 'فني تركيب أثاث', nameEn: 'Furniture Assembly Tech', svgType: 'carpenter', keywords: ['فك وتركيب', 'تركيب ايكيا'] },
      { id: 'upholstery-tech', name: 'فني تنجيد', nameEn: 'Upholstery Tech', svgType: 'upholsterer', keywords: ['تنجيد قماش', 'اسفنج مضغوط'] },
      { id: 'upholsterer', name: 'منجد', nameEn: 'Upholsterer', svgType: 'upholsterer', keywords: ['منجد بلدي', 'تجديد انتريهات'] },
      { id: 'curtains-tech', name: 'فني ستائر', nameEn: 'Curtains Tech', svgType: 'curtains-tech', keywords: ['مواسير ستائر', 'شيفون', 'بلاك اوت'] },
      { id: 'mattress-tech', name: 'فني مراتب', nameEn: 'Mattress Tech', svgType: 'upholsterer', keywords: ['مراتب سوست', 'يانسن', 'تاكي'] }
    ]
  },
  {
    id: 'building-construction',
    slug: 'building-construction',
    name: 'البناء والإنشاء',
    nameEn: 'Building & Construction',
    icon: '🧱',
    svgType: 'construction-main',
    color: '#C2410C',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #9A3412 100%)',
    description: 'مقاولات المباني والترميم، أعمال البناء والمحارة، الحدادة المسلحة، الخرسانات، والهدم',
    order: 15,
    professions: [
      { id: 'builder', name: 'بناء', nameEn: 'Mason / Builder', svgType: 'builder', keywords: ['طوب احمر', 'بنا', 'اسمنت'] },
      { id: 'plasterer-mason', name: 'مبيض محارة', nameEn: 'Plasterer', svgType: 'plasterer', keywords: ['طرطشة', 'محارة حوائط'] },
      { id: 'rebar-steel-fixer', name: 'حداد مسلح', nameEn: 'Rebar Steel Fixer', svgType: 'anvil', keywords: ['حديد تسليح', 'قواعد', 'سملات'] },
      { id: 'shuttering-carpenter', name: 'نجار مسلح', nameEn: 'Formwork Carpenter', svgType: 'carpenter', keywords: ['شدات خشبية', 'سقف'] },
      { id: 'concrete-worker', name: 'عامل خرسانة', nameEn: 'Concrete Worker', svgType: 'builder', keywords: ['صب خرسانة', 'خلاطة'] },
      { id: 'insulation-tech-construction', name: 'فني عزل', nameEn: 'Insulation Tech', svgType: 'insulation-tech', keywords: ['عزل اسطح', 'عزل فوم'] },
      { id: 'scaffolding-tech', name: 'فني شدات معدنية', nameEn: 'Scaffolding Tech', svgType: 'scaffolding-tech', keywords: ['سقالات', 'شدات حديد'] },
      { id: 'demolition-tech', name: 'فني هدم', nameEn: 'Demolition Tech', svgType: 'builder', keywords: ['تكسير', 'هيلتي', 'ازالة حوائط'] },
      { id: 'building-contractor', name: 'مقاول مباني', nameEn: 'Building Contractor', svgType: 'scaffolding-tech', keywords: ['مقاولات', 'تسليم مفتاح'] },
      { id: 'finishing-contractor', name: 'مقاول تشطيبات', nameEn: 'Finishing Contractor', svgType: 'decor-main', keywords: ['تشطيب كامل', 'سوبر لوكس'] },
      { id: 'restoration-contractor', name: 'مقاول ترميم', nameEn: 'Restoration Contractor', svgType: 'builder', keywords: ['ترميم شروخ', 'تدعيم اعمدة'] },
      { id: 'welder-construction', name: 'فني لحام', nameEn: 'Welder', svgType: 'welder', keywords: ['لحام حديد', 'كمر'] }
    ]
  },
  {
    id: 'automotive-vehicles',
    slug: 'automotive-vehicles',
    name: 'السيارات والمركبات',
    nameEn: 'Automotive & Vehicles',
    icon: '🚗',
    svgType: 'automotive-main',
    color: '#DC2626',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    description: 'ميكانيكا وكهرباء السيارات، سمكرة ودوكو، ضبط زوايا وعفشة، إطارات وبطاريات، ومغاسل السيارات',
    order: 16,
    professions: [
      { id: 'car-mechanic', name: 'ميكانيكي سيارات', nameEn: 'Car Mechanic', svgType: 'car-mechanic', keywords: ['ميكانيكا', 'عمرة موتور', 'سير كاتينة'] },
      { id: 'car-electrician', name: 'كهربائي سيارات', nameEn: 'Car Electrician', svgType: 'electrical-main', keywords: ['دينامو', 'مارش', 'انوار السيارة'] },
      { id: 'car-denter', name: 'سمكري سيارات', nameEn: 'Car Denter', svgType: 'car-mechanic', keywords: ['سمكرة ع البارد', 'تعديل صاج'] },
      { id: 'car-painter-doku', name: 'دوكو سيارات', nameEn: 'Car Painter (Doku)', svgType: 'paint-roller', keywords: ['دهان سيارات', 'فرن دهان'] },
      { id: 'car-ac-tech', name: 'فني تكييف سيارات', nameEn: 'Car AC Tech', svgType: 'hvac-main', keywords: ['شحن تكييف عربية', 'سربنتينة'] },
      { id: 'tire-tech', name: 'فني إطارات', nameEn: 'Tire Tech', svgType: 'tire-tech', keywords: ['كاوتش', 'ترصيص', 'نيتروجين', 'لحام كاوتش'] },
      { id: 'car-battery-tech', name: 'فني بطاريات', nameEn: 'Car Battery Tech', svgType: 'car-battery-tech', keywords: ['شحن بطارية', 'بطاريات جافة'] },
      { id: 'car-glass-tech', name: 'فني زجاج سيارات', nameEn: 'Car Glass Tech', svgType: 'window', keywords: ['زجاج امامي', 'تريلكس', 'فامية'] },
      { id: 'car-brake-tech', name: 'فني فرامل', nameEn: 'Brake Tech', svgType: 'tire-tech', keywords: ['تيل فرامل', 'طنابير', 'abs'] },
      { id: 'suspension-tech', name: 'فني عفشة', nameEn: 'Suspension Tech', svgType: 'car-mechanic', keywords: ['مساعدين', 'بيض مقصات', 'عفشة'] },
      { id: 'transmission-tech', name: 'فني فتيس', nameEn: 'Transmission Tech', svgType: 'car-mechanic', keywords: ['فتيس اوتوماتيك', 'مانيوال', 'زيت فتيس'] },
      { id: 'car-diagnostics-tech', name: 'فني تشخيص أعطال', nameEn: 'Diagnostics Tech', svgType: 'electrical-main', keywords: ['كشف كمبيوتر', 'obd', 'check engine'] },
      { id: 'car-wash', name: 'مغسلة سيارات', nameEn: 'Car Wash', svgType: 'cleaning-main', keywords: ['غسيل كيماوي', 'تلميع صالون'] },
      { id: 'car-polishing-tech', name: 'فني تلميع سيارات', nameEn: 'Car Detailing Tech', svgType: 'paint-roller', keywords: ['بولش', 'كومباوند', 'تلميع فوانيس'] },
      { id: 'nano-ceramic-tech', name: 'فني نانو سيراميك', nameEn: 'Nano Ceramic Tech', svgType: 'sparkle-beauty', keywords: ['حماية دهان', 'نانو'] },
      { id: 'motorcycle-repair-tech', name: 'فني إصلاح موتوسيكلات', nameEn: 'Motorcycle Tech', svgType: 'car-mechanic', keywords: ['موتوسيكل', 'صيني', 'بجاج'] },
      { id: 'toktok-repair-tech', name: 'فني إصلاح توكتوك', nameEn: 'Tuk-Tuk Tech', svgType: 'car-mechanic', keywords: ['توكتوك', 'موتور توكتوك', 'عمرة'] }
    ]
  },
  {
    id: 'blacksmith-alumital',
    slug: 'blacksmith-alumital',
    name: 'الحدادة والألوميتال',
    nameEn: 'Blacksmith & Alumital',
    icon: '🔩',
    svgType: 'blacksmith-main',
    color: '#475569',
    gradient: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)',
    description: 'حدادة الأبواب والشبابيك والكريتال، قطاعات الألوميتال و UPVC، لحام أرجون، وستانلس ستيل',
    order: 17,
    professions: [
      { id: 'blacksmith', name: 'حداد', nameEn: 'Blacksmith', svgType: 'anvil', keywords: ['ورشة حدادة', 'حديد'] },
      { id: 'reinforced-steel-blacksmith', name: 'حداد مسلح', nameEn: 'Reinforced Steel Blacksmith', svgType: 'anvil', keywords: ['تسليح مباني', 'حديد سقف'] },
      { id: 'decorative-iron-blacksmith', name: 'حداد كريتال', nameEn: 'Decorative Iron Blacksmith', svgType: 'anvil', keywords: ['كريتال ليزر', 'فورفورجيه'] },
      { id: 'doors-windows-blacksmith', name: 'حداد أبواب وشبابيك', nameEn: 'Doors & Windows Blacksmith', svgType: 'door-installer', keywords: ['ابواب حديد', 'حماية شبابيك'] },
      { id: 'alumital-tech', name: 'فني ألوميتال', nameEn: 'Alumital Tech', svgType: 'alumital-tech', keywords: ['مطابخ الوميتال', 'شبابيك ps'] },
      { id: 'upvc-tech', name: 'فني UPVC', nameEn: 'UPVC Tech', svgType: 'alumital-tech', keywords: ['عازل للصوت', 'قطاعات يو بي في سي'] },
      { id: 'electric-welder', name: 'فني لحام كهرباء', nameEn: 'Electric Arc Welder', svgType: 'welder', keywords: ['لحام كهربائي', 'حديد'] },
      { id: 'argon-welder', name: 'فني لحام أرجون', nameEn: 'Argon Welder', svgType: 'welder', keywords: ['لحام استانلس', 'تيك'] },
      { id: 'stainless-steel-tech', name: 'فني ستانلس ستيل', nameEn: 'Stainless Steel Tech', svgType: 'welder', keywords: ['درابزين استانلس', 'ترابيزات استانلس'] },
      { id: 'facade-installer-tech', name: 'فني تركيب واجهات', nameEn: 'Facade Installer Tech', svgType: 'scaffolding-tech', keywords: ['كلادينج', 'واجهات زجاج سيكوريت'] }
    ]
  },
  {
    id: 'cleaning-home-services',
    slug: 'cleaning-home-services',
    name: 'النظافة والخدمات المنزلية',
    nameEn: 'Cleaning & Home Services',
    icon: '🧹',
    svgType: 'cleaning-main',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    description: 'تنظيف المنازل والمكاتب، غسيل السجاد والإنتريهات بالبخار، جلي الرخام، ومكافحة الحشرات',
    order: 18,
    professions: [
      { id: 'cleaner', name: 'عامل نظافة', nameEn: 'Cleaner', svgType: 'cleaner', keywords: ['شغالة', 'نظافة يومية'] },
      { id: 'cleaning-company', name: 'شركة تنظيف', nameEn: 'Cleaning Company', svgType: 'cleaning-main', keywords: ['تنظيف شركات', 'تنظيف فلل'] },
      { id: 'house-cleaning', name: 'تنظيف منازل', nameEn: 'House Cleaning', svgType: 'cleaning-main', keywords: ['نظافة شقق', 'تنظيف بعد التشطيب'] },
      { id: 'office-cleaning', name: 'تنظيف مكاتب', nameEn: 'Office Cleaning', svgType: 'cleaning-main', keywords: ['نظافة شركات', 'واجهات مكاتب'] },
      { id: 'carpet-cleaning', name: 'تنظيف سجاد', nameEn: 'Carpet Cleaning', svgType: 'cleaning-main', keywords: ['غسيل سجاد بالمنزل', 'مغسلة سجاد'] },
      { id: 'rug-cleaning', name: 'تنظيف موكيت', nameEn: 'Rug Cleaning', svgType: 'cleaning-main', keywords: ['تنظيف موكيت مساجد'] },
      { id: 'mattress-cleaning', name: 'تنظيف مراتب', nameEn: 'Mattress Cleaning', svgType: 'cleaning-main', keywords: ['غسيل مراتب بالبخار'] },
      { id: 'facade-cleaning', name: 'تنظيف واجهات', nameEn: 'Facade Cleaning', svgType: 'cleaning-main', keywords: ['تنظيف واجهات زجاجية'] },
      { id: 'tank-cleaning', name: 'تنظيف خزانات', nameEn: 'Tank Cleaning', svgType: 'water-tank-tech', keywords: ['تطهير خزانات مياه'] },
      { id: 'pest-control', name: 'مكافحة حشرات', nameEn: 'Pest Control', svgType: 'pest-control', keywords: ['رش صراصير', 'بق الفراش', 'نمل ابيض'] },
      { id: 'rodent-control', name: 'مكافحة قوارض', nameEn: 'Rodent Control', svgType: 'pest-control', keywords: ['فئران', 'ابادة قوارض'] },
      { id: 'sterilization-disinfection', name: 'تعقيم وتطهير', nameEn: 'Disinfection & Sterilization', svgType: 'cleaning-main', keywords: ['تعقيم منازل', 'تطهير طبي'] },
      { id: 'marble-polishing', name: 'جلي وتلميع رخام', nameEn: 'Marble Polishing', svgType: 'marble', keywords: ['جلي بالالماظ', 'تلميع كريستال'] }
    ]
  },
  {
    id: 'agriculture-gardening',
    slug: 'agriculture-gardening',
    name: 'الزراعة والحدائق',
    nameEn: 'Agriculture & Gardening',
    icon: '🌳',
    svgType: 'agriculture-main',
    color: '#15803D',
    gradient: 'linear-gradient(135deg, #16A34A 0%, #166534 100%)',
    description: 'تنسيق الحدائق المنزلية، شبكات الري الحديثة، تقليم وقص الأشجار، ومكافحة الآفات الزراعية',
    order: 19,
    professions: [
      { id: 'gardener', name: 'جنايني', nameEn: 'Gardener', svgType: 'gardener', keywords: ['حدائقي', 'رعاية نباتات'] },
      { id: 'landscaping-tech', name: 'فني تنسيق حدائق', nameEn: 'Landscaping Tech', svgType: 'gardener', keywords: ['لاند سكيب', 'احواض زهور'] },
      { id: 'agricultural-worker', name: 'عامل زراعي', nameEn: 'Agricultural Worker', svgType: 'gardener', keywords: ['اراضي زراعية', 'زراعة'] },
      { id: 'irrigation-tech', name: 'فني ري', nameEn: 'Irrigation Tech', svgType: 'water-drop', keywords: ['ري بالتنقيط', 'رشاشات'] },
      { id: 'irrigation-networks-tech', name: 'فني شبكات ري', nameEn: 'Irrigation Networks Tech', svgType: 'water-drop', keywords: ['مواسير ري', 'محبس اتوماتيك'] },
      { id: 'tree-pruning-tech', name: 'تقليم أشجار', nameEn: 'Tree Pruning Tech', svgType: 'tree-pruning-tech', keywords: ['تهذيب اشجار', 'نخيل'] },
      { id: 'tree-cutting-tech', name: 'قص أشجار', nameEn: 'Tree Cutting Tech', svgType: 'tree-pruning-tech', keywords: ['ازالة اشجار', 'منشار شجر'] },
      { id: 'home-gardening-landscaping', name: 'تنسيق حدائق منزلية', nameEn: 'Home Gardening Tech', svgType: 'gardener', keywords: ['حديقة فيلا', 'سطح اخضر'] },
      { id: 'agricultural-pest-control', name: 'مكافحة آفات زراعية', nameEn: 'Agricultural Pest Control', svgType: 'pest-control', keywords: ['مبيدات زراعية', 'سوسة النخيل'] }
    ]
  },
  {
    id: 'home-appliances-maintenance',
    slug: 'home-appliances-maintenance',
    name: 'الأجهزة المنزلية',
    nameEn: 'Home Appliances Maintenance',
    icon: '📺',
    svgType: 'appliances-main',
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #3730A3 100%)',
    description: 'صيانة الغسالات الأوتوماتيك، الثلاجات، البوتاجازات، الأفران، الميكروويف، والشاشات',
    order: 20,
    professions: [
      { id: 'washing-machine-tech', name: 'فني صيانة غسالات', nameEn: 'Washing Machine Tech', svgType: 'washing-machine', keywords: ['غسالة فول اتوماتيك', 'زانوسي', 'توشيبا'] },
      { id: 'fridge-maintenance-tech', name: 'فني صيانة ثلاجات', nameEn: 'Refrigerator Repair Tech', svgType: 'refrigerator-tech', keywords: ['ثلاجة نوفروست', 'ماتور ثلاجة'] },
      { id: 'stove-maintenance-tech', name: 'فني صيانة بوتاجازات', nameEn: 'Stove Maintenance Tech', svgType: 'welder', keywords: ['بوتاجاز يونيفرسال', 'فونيات غاز'] },
      { id: 'oven-maintenance-tech', name: 'فني صيانة أفران', nameEn: 'Oven Maintenance Tech', svgType: 'welder', keywords: ['فرن كهرباء', 'فرن غاز', 'شواية'] },
      { id: 'microwave-maintenance-tech', name: 'فني صيانة ميكروويف', nameEn: 'Microwave Maintenance Tech', svgType: 'tv-screens-tech', keywords: ['ميكروويف سامسونج', 'شارب'] },
      { id: 'ac-maintenance-tech', name: 'فني صيانة تكييف', nameEn: 'AC Maintenance Tech', svgType: 'ac-technician', keywords: ['صيانة سنوية للتكييف', 'غسيل تكييف'] },
      { id: 'tv-screens-tech', name: 'فني صيانة شاشات', nameEn: 'TV / Screens Tech', svgType: 'tv-screens-tech', keywords: ['شاشة led', 'ليدات شاشة', 'بانل'] },
      { id: 'general-appliance-tech', name: 'فني صيانة أجهزة منزلية', nameEn: 'Home Appliances Tech', svgType: 'appliances-main', keywords: ['خلاط', 'مكنسة كهربائية', 'مكواة'] }
    ]
  },
  {
    id: 'tailoring-clothing',
    slug: 'tailoring-clothing',
    name: 'الملابس والخياطة',
    nameEn: 'Tailoring & Clothing',
    icon: '🧵',
    svgType: 'tailoring-main',
    color: '#A21CAF',
    gradient: 'linear-gradient(135deg, #D946EF 0%, #86198F 100%)',
    description: 'تفصيل وخياطة الملابس الرجالي والحريمي، تطريز، إصلاح ملابس، تفصيل ستائر، وتنجيد',
    order: 21,
    professions: [
      { id: 'tailor', name: 'خياط', nameEn: 'Tailor', svgType: 'tailor', keywords: ['خياطة رجالي', 'بدل'] },
      { id: 'tarzi', name: 'ترزي', nameEn: 'Tarzi', svgType: 'tailor', keywords: ['ترزي رجالي', 'قميص وبنطلون'] },
      { id: 'seamstress', name: 'خياطة', nameEn: 'Seamstress', svgType: 'tailor', keywords: ['خياطة حريمي', 'عبايات', 'فساتين'] },
      { id: 'fashion-tailoring', name: 'تفصيل ملابس', nameEn: 'Custom Tailoring', svgType: 'tailor', keywords: ['باترون', 'فستان سواريه'] },
      { id: 'embroidery', name: 'تطريز', nameEn: 'Embroidery Tech', svgType: 'embroidery', keywords: ['تطريز كمبيوتر', 'تطريز يدوي'] },
      { id: 'clothing-alterations', name: 'إصلاح ملابس', nameEn: 'Clothing Alterations', svgType: 'tailor', keywords: ['تقصير بنطلون', 'تضييق', 'سوستة'] },
      { id: 'curtain-tailor-tech', name: 'فني ستائر', nameEn: 'Curtain Tailor', svgType: 'curtains-tech', keywords: ['تفصيل ستائر', 'براقع'] },
      { id: 'upholstery-tailor-tech', name: 'فني تنجيد', nameEn: 'Upholstery Tailor', svgType: 'upholsterer', keywords: ['كسوة انتريه', 'كراسي سفرة'] },
      { id: 'clothes-dyer', name: 'صباغ ملابس', nameEn: 'Clothes Dyer', svgType: 'paint-roller', keywords: ['صباغة بناطيل', 'تجديد الوان'] },
      { id: 'laundry-ironing', name: 'مغسلة وكي ملابس', nameEn: 'Laundry & Dry Clean', svgType: 'cleaning-main', keywords: ['دراي كلين', 'مكوجي'] }
    ]
  },
  {
    id: 'barber-beauty',
    slug: 'barber-beauty',
    name: 'الحلاقة والتجميل',
    nameEn: 'Barber & Beauty',
    icon: '💇‍♂️',
    svgType: 'barber-main',
    color: '#BE185D',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #9D174D 100%)',
    description: 'صالونات الحلاقة الرجالي والأطفال، كوافير وميكب آرتست، والعناية بالبشرة والأظافر',
    order: 22,
    professions: [
      { id: 'barber', name: 'حلاق', nameEn: 'Barber', svgType: 'barber', keywords: ['صالون حلاقة', 'قص شعر', 'حلاقة ذقن'] },
      { id: 'hair-dresser', name: 'كوافير', nameEn: 'Hairdresser', svgType: 'barber', keywords: ['كوافير حريمي', 'سشوار', 'صبغة'] },
      { id: 'hair-stylist', name: 'مصفف شعر', nameEn: 'Hair Stylist', svgType: 'barber', keywords: ['تسريحة شعر', 'بروتين شعر'] },
      { id: 'makeup-artist', name: 'ميكب آرتست', nameEn: 'Makeup Artist', svgType: 'makeup-artist', keywords: ['ميك اب عرايس', 'مكياج سواريه'] },
      { id: 'beauty-expert', name: 'خبيرة تجميل', nameEn: 'Beauty Expert', svgType: 'makeup-artist', keywords: ['سنتر تجميل', 'ميكروبليدنج'] },
      { id: 'nail-tech', name: 'فني أظافر', nameEn: 'Nail Technician', svgType: 'makeup-artist', keywords: ['باديكير', 'مانيكير', 'جل بولش'] },
      { id: 'skincare-tech', name: 'فني عناية بالبشرة', nameEn: 'Skincare Tech', svgType: 'makeup-artist', keywords: ['تنظيف بشرة', 'هيدرافيشل'] },
      { id: 'kids-barber', name: 'حلاق أطفال', nameEn: 'Kids Barber', svgType: 'barber', keywords: ['حلاقة اطفال', 'كرسي سيارة'] }
    ]
  },
  {
    id: 'transportation-logistics',
    slug: 'transportation-logistics',
    name: 'النقل والخدمات',
    nameEn: 'Transportation & Logistics',
    icon: '🚚',
    svgType: 'transport-main',
    color: '#EA580C',
    gradient: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
    description: 'نقل العفش والأثاث، سيارات النصف نقل، ونش رفع الأثاث، ونش الإنقاذ، وسيارات الأجرة',
    order: 23,
    professions: [
      { id: 'truck-driver', name: 'سائق نقل', nameEn: 'Truck Driver', svgType: 'truck-driver', keywords: ['سيارة نقل', 'عربية جامبو'] },
      { id: 'furniture-transport-driver', name: 'سائق نقل أثاث', nameEn: 'Furniture Moving Driver', svgType: 'truck-driver', keywords: ['عربية عفش مقفولة'] },
      { id: 'half-truck-driver', name: 'سائق نصف نقل', nameEn: 'Half-Truck Driver', svgType: 'truck-driver', keywords: ['دبابة', 'شيفروليه نصف نقل'] },
      { id: 'trailer-truck-driver', name: 'سائق تريلا', nameEn: 'Trailer Driver', svgType: 'truck-driver', keywords: ['تريلا بضائع', 'نقل ثقيل'] },
      { id: 'microbus-driver', name: 'سائق ميكروباص', nameEn: 'Microbus Driver', svgType: 'taxi-driver', keywords: ['ميكروباص المنصورة', 'ميكروباص دمياط'] },
      { id: 'taxi-driver', name: 'سائق تاكسي', nameEn: 'Taxi Driver', svgType: 'taxi-driver', keywords: ['تاكسي المنزلة', 'تاكسي المطرية'] },
      { id: 'furniture-crane-lift', name: 'ونش رفع أثاث', nameEn: 'Furniture Elevator / Winch', svgType: 'furniture-crane-lift', keywords: ['ونش هيدروليك', 'رفع عفش ادوار عليا'] },
      { id: 'car-towing-winch', name: 'ونش إنقاذ سيارات', nameEn: 'Car Towing Winch', svgType: 'furniture-crane-lift', keywords: ['سحب سيارات', 'طوارئ طريق'] },
      { id: 'furniture-moving-company', name: 'شركة نقل أثاث', nameEn: 'Furniture Moving Co', svgType: 'truck-driver', keywords: ['تغليف عفش', 'نقل اثاث المنزلة'] },
      { id: 'loading-porters', name: 'عمال نقل وتحميل', nameEn: 'Loading Porters', svgType: 'builder', keywords: ['شيالين', 'عمال تنزيل'] },
      { id: 'furniture-assembly-moving-tech', name: 'فني تركيب وفك أثاث', nameEn: 'Furniture Disassembly Tech', svgType: 'carpenter', keywords: ['فني فك غرف نوم'] }
    ]
  },
  {
    id: 'misc-services',
    slug: 'misc-services',
    name: 'خدمات متنوعة',
    nameEn: 'Miscellaneous Services',
    icon: '🔑',
    svgType: 'misc-main',
    color: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    description: 'نسخ المفاتيح والأقفال، الزجاج والمرايا، الدعاية والإعلان، المظلات، والأنظمة الأمنية',
    order: 24,
    professions: [
      { id: 'locksmith-keys', name: 'فني مفاتيح وأقفال', nameEn: 'Locksmith', svgType: 'locksmith-keys', keywords: ['نسخ مفاتيح', 'فتح باب مقفول', 'كالون'] },
      { id: 'keys-blacksmith', name: 'حداد مفاتيح', nameEn: 'Keys Blacksmith', svgType: 'locksmith-keys', keywords: ['تصنيع مفتاح', 'مفاتيح سيارات كمبيوتر'] },
      { id: 'safe-vault-tech', name: 'فني خزائن', nameEn: 'Safe & Vault Tech', svgType: 'locksmith-keys', keywords: ['فتح خزنة', 'خزائن مصفحة'] },
      { id: 'signage-installer', name: 'فني تركيب لافتات', nameEn: 'Signage Installer', svgType: 'advertising-tech', keywords: ['يافطة مضيئة', 'حروف بارزة', 'كلادينج'] },
      { id: 'advertising-tech', name: 'فني دعاية وإعلان', nameEn: 'Advertising Tech', svgType: 'advertising-tech', keywords: ['بنر', 'فليكس', 'طباعة اعلانات'] },
      { id: 'glass-tech', name: 'فني زجاج', nameEn: 'Glass Tech', svgType: 'window', keywords: ['زجاج سيكوريت', 'زجاج طاولات'] },
      { id: 'mirror-tech', name: 'فني مرايا', nameEn: 'Mirror Tech', svgType: 'window', keywords: ['مرايات ليد', 'مرايا شطف'] },
      { id: 'acrylic-tech', name: 'فني أكرليك', nameEn: 'Acrylic Tech', svgType: 'advertising-tech', keywords: ['اكريليك ليزر', 'حوامل اكريليك'] },
      { id: 'artificial-grass-tech', name: 'فني نجيلة صناعية', nameEn: 'Artificial Grass Tech', svgType: 'gardener', keywords: ['ثيل صناعي', 'نجيل ملاعب', 'حدائق'] },
      { id: 'pool-services-tech', name: 'فني حمامات سباحة', nameEn: 'Pool Services Tech', svgType: 'swimming-pool-tech', keywords: ['صيانة مسابح', 'مضخات مسابح'] },
      { id: 'canopies-pergolas-installer', name: 'فني تركيب مظلات', nameEn: 'Canopies & Pergolas Installer', svgType: 'scaffolding-tech', keywords: ['برجولات خشبية', 'مظلات سيارات'] },
      { id: 'privacy-screens-installer', name: 'فني تركيب سواتر', nameEn: 'Privacy Screens Installer', svgType: 'scaffolding-tech', keywords: ['سواتر حديد', 'سواتر قماش'] },
      { id: 'camera-installer-tech', name: 'فني تركيب كاميرات', nameEn: 'Camera Installer Tech', svgType: 'cctv-tech', keywords: ['كاميرات مراقبة واي فاي'] },
      { id: 'security-systems-tech', name: 'فني أنظمة أمنية', nameEn: 'Security Systems Tech', svgType: 'security-systems-tech', keywords: ['اجهزة انذار سرقة', 'بوابات امنية'] }
    ]
  }
];

/**
 * ── Flattened All Professions List ──
 */
export const ALL_PROFESSIONS = PROFESSION_CATEGORIES.flatMap(cat => 
  cat.professions.map(prof => ({
    ...prof,
    categorySlug: cat.slug,
    categoryId: cat.id,
    categoryName: cat.name,
    categoryColor: cat.color,
    categoryIcon: cat.icon
  }))
);

/**
 * Get category by ID or slug
 */
export function getCategoryBySlug(slug) {
  if (!slug) return null;
  const s = String(slug).trim().toLowerCase();
  return PROFESSION_CATEGORIES.find(c => 
    c.slug.toLowerCase() === s || 
    c.id.toLowerCase() === s || 
    normalizeArabic(c.name) === normalizeArabic(s)
  ) || null;
}

/**
 * Get profession by ID or slug
 */
export function getProfessionById(id) {
  if (!id) return null;
  const s = String(id).trim().toLowerCase();
  return ALL_PROFESSIONS.find(p => p.id.toLowerCase() === s) || null;
}

/**
 * Find profession by Arabic name or keyword
 */
export function findProfessionByName(name) {
  if (!name) return null;
  const norm = normalizeArabic(String(name).trim());
  return ALL_PROFESSIONS.find(p => {
    if (normalizeArabic(p.name) === norm) return true;
    if (p.keywords && p.keywords.some(k => normalizeArabic(k) === norm)) return true;
    return false;
  }) || null;
}

/**
 * Superfast Live Search for Categories and Professions
 */
export function searchProfessionsAndCategories(query) {
  if (!query || !query.trim()) return { categories: PROFESSION_CATEGORIES, professions: ALL_PROFESSIONS.slice(0, 30) };

  const q = normalizeArabic(query.trim().toLowerCase());

  const matchedCategories = PROFESSION_CATEGORIES.filter(cat => 
    normalizeArabic(cat.name).includes(q) || 
    cat.nameEn.toLowerCase().includes(q) ||
    cat.slug.toLowerCase().includes(q)
  );

  const matchedProfessions = ALL_PROFESSIONS.filter(prof => {
    if (normalizeArabic(prof.name).includes(q)) return true;
    if (prof.nameEn.toLowerCase().includes(q)) return true;
    if (prof.categoryName && normalizeArabic(prof.categoryName).includes(q)) return true;
    if (prof.keywords && prof.keywords.some(k => normalizeArabic(k).includes(q))) return true;
    return false;
  });

  return { categories: matchedCategories, professions: matchedProfessions };
}

/**
 * Render Category SVG & Visual Metadata
 */
import { getCategorySvg as _getCategorySvg, getDressSvg, getCategoryVisualMeta, renderCategoryCardIcon } from "./category-svg.js";
export { getDressSvg, getCategoryVisualMeta, renderCategoryCardIcon };
export function getCategorySvg(slug, options = {}) {
  return _getCategorySvg(slug, options);
}

/**
 * Render Profession SVG
 */
export function getProfessionSvg(idOrName, options = {}) {
  let prof = getProfessionById(idOrName) || findProfessionByName(idOrName);
  const type = prof?.svgType || 'wrench-pipe';
  const color = options.color || prof?.categoryColor || '#0284C7';
  return createSvgIcon(type, { ...options, color });
}

/**
 * Resolve Place Profession
 * Inspects subcategoryId, name, services, categoryId to match a specific trade
 */
export function resolvePlaceProfession(place) {
  if (!place) return null;

  // 1. Explicit subcategoryId
  if (place.subcategoryId) {
    const matched = getProfessionById(place.subcategoryId);
    if (matched) return matched;
  }

  // 2. Exact match in name or custom category
  const textToScan = `${place.name || ''} ${place.customCategory || ''} ${place.categoryName || ''} ${(Array.isArray(place.services) ? place.services.join(' ') : '')}`;
  const normText = normalizeArabic(textToScan);

  for (const prof of ALL_PROFESSIONS) {
    const profNorm = normalizeArabic(prof.name);
    if (normText.includes(profNorm)) {
      return prof;
    }
  }

  return null;
}
