// src/js/utils/category-visual.js
/**
 * Universal Premium Category Visual Engine for El Manzala & Matariya Directory
 * 
 * Features:
 * - 100% complete coverage for all 108+ database and craft categories.
 * - Specialized Animated Dress SVG with swaying ballgown, golden hanger, and twinkling sparkles for Atelier.
 * - Animated thematic badges with tailored CSS animations (swing, pulse, bounce, float, vibrate).
 * - Coordinated color palettes with matching soft background tints and crisp borders.
 * - Eliminates all weird glyphs, tiny dots, spinning clutter, and mismatched icons.
 */

import { normalizeArabic } from './arabic.js';

// Dedicated Animated Luxury Wedding Dress SVG
export function getDressSvg(color = '#E11D48', size = 42) {
  const s = parseInt(size, 10) || 42;
  const uid = Math.random().toString(36).substring(2, 7);
  return `
    <div class="cat-dress-animated-icon" style="width:${s}px;height:${s}px;" aria-label="أتيليه فساتين زفاف وسهرة">
      <svg class="cat-dress-svg" viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="dressGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fda4af" />
            <stop offset="50%" stop-color="${color}" />
            <stop offset="100%" stop-color="#be123c" />
          </linearGradient>
          <linearGradient id="goldRibbon_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="100%" stop-color="#eab308" />
          </linearGradient>
        </defs>
        <!-- Luxury Gold Hanger -->
        <path d="M24 7 C24 4.5, 21.5 4.5, 21.5 6 C21.5 7.5, 24 8.5, 24 9.5 L16 15 L32 15 Z" stroke="url(#goldRibbon_${uid})" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Animated Swaying Gown Group -->
        <g class="cat-dress-sway-group">
          <!-- Corset & Bodice -->
          <path d="M19 14.5 C19 14.5, 21.5 17, 24 17 C26.5 17, 29 14.5, 29 14.5 L28 22 C26 23, 22 23, 20 22 Z" fill="url(#dressGrad_${uid})" />
          <!-- Sweetheart neckline trim -->
          <path d="M19 14.5 C21 16.5, 24 16.5, 24 16.5 C24 16.5, 27 16.5, 29 14.5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" fill="none"/>
          <!-- Royal Gold Ribbon Waist Belt -->
          <path d="M19.5 22 C22 23, 26 23, 28.5 22 L29 24.5 C26 25.5, 22 25.5, 19 24.5 Z" fill="url(#goldRibbon_${uid})"/>
          <circle cx="24" cy="23.5" r="1.8" fill="#ffffff" stroke="#eab308" stroke-width="0.8"/>
          <!-- Luxury Flowing Ballgown Skirt with Pleats -->
          <path d="M19 24.5 C19 24.5, 13 36, 10 42 C15 44.5, 33 44.5, 38 42 C35 36, 29 24.5, 29 24.5 C26 25.5, 22 25.5, 19 24.5 Z" fill="url(#dressGrad_${uid})" />
          <!-- Skirt Pleat Highlights -->
          <path d="M22 25 C20 32, 17 38, 16 42.5" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M26 25 C28 32, 31 38, 32 42.5" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M24 25 L24 43.5" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
          <!-- Sparkling Twinkling Star Jewels -->
          <path class="cat-dress-star-1" d="M37 13 L38 15.5 L41 16.5 L38 17.5 L37 20 L36 17.5 L33 16.5 L36 15.5 Z" fill="#fbbf24"/>
          <path class="cat-dress-star-2" d="M10 27 L11 29 L13 30 L11 31 L10 33 L9 31 L7 30 L9 29 Z" fill="#fbbf24"/>
          <circle class="cat-dress-star-3" cx="37" cy="33" r="1.5" fill="#ffffff"/>
        </g>
      </svg>
    </div>
  `;
}

/**
 * Verified Registry of Category Visual Rules
 * Ordered specifically from specific to general to avoid broad collisions.
 */
const CATEGORY_RULES = [
  // 1. فساتين الزفاف والأتيليه (Top Priority)
  {
    match: /wedding.*dress|atelier|اتيليه|اتيلية|فستان|فساتين|سهرة|خطوبة/,
    icon: '👗',
    isDress: true,
    color: '#E11D48',
    bgColor: '#FFE4E6',
    borderColor: '#FDA4AF',
    anim: 'cat-anim-swing'
  },
  // 2. تايكوندو وكاراتيه وأكاديميات فنون قتالية
  {
    match: /taekwondo|karate|تايكوندو|كاراتيه|قتالية|فنون قتال/,
    icon: '🥋',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    anim: 'cat-anim-snap'
  },
  // 3. أكاديميات كرة القدم والرياضة
  {
    match: /football|soccer|كرة.*قدم|كورة|أكاديمية تعليم كرة/,
    icon: '⚽',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    anim: 'cat-anim-bounce'
  },
  // 4. جيم ولياقة بدنية وكمال أجسام
  {
    match: /\bgym\b|fitness|جيم|لياقة|حديد|فتنس|كمال اجسام/,
    icon: '🏋️',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-pulse'
  },
  // 5. مفروشات وأطقم سرير ومراتب
  {
    match: /furnishing|bed.*set|mattress|مفروشات|اطقم.*سرير|أطقم.*سرير|مراتب|مخدات|لحاف/,
    icon: '🛏️',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    anim: 'cat-anim-float'
  },
  // 6. سجاد وموكيت
  {
    match: /carpet|سجاد|موكيت|كليم/,
    icon: '🧶',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    borderColor: '#D8B4FE',
    anim: 'cat-anim-float'
  },
  // 7. صيني وأدوات العروسة
  {
    match: /china|bridal|عروسة|ادوات.*عروس|أدوات.*عروس|صيني|نيش/,
    icon: '🫖',
    color: '#E11D48',
    bgColor: '#FFE4E6',
    borderColor: '#FDA4AF',
    anim: 'cat-anim-swing'
  },
  // 8. ألبان وجبن ومعامل ألبان
  {
    match: /dairy|cheese|البان|ألبان|جبن|جبنة|قشطة|زبادي|معمل.*البان/,
    icon: '🧀',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-float'
  },
  // 9. بقالة وسوبر ماركت وهايبر
  {
    match: /supermarket|hypermarket|سوبر.*ماركت|هايبر/,
    icon: '🛒',
    color: '#1B4F72',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-bounce'
  },
  {
    match: /grocery|بقالة|بقاله|ميني ماركت/,
    icon: '🏪',
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    anim: 'cat-anim-pulse'
  },
  // 10. بيع وصيانة الكمبيوتر واللاب توب
  {
    match: /computer|laptop|كمبيوتر|لاب.*توب|سوفت.*وير|شبكات/,
    icon: '💻',
    color: '#0891B2',
    bgColor: '#CFFAFE',
    borderColor: '#67E8F9',
    anim: 'cat-anim-float'
  },
  // 11. مواد غذائية بالجملة
  {
    match: /wholesale.*food|غذائية.*جملة|مواد.*غذائية/,
    icon: '🥫',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-pulse'
  },
  // 12. تدريس ومدرسين وسناتر
  {
    match: /study.*material|تدريس|تدرس|دروس|مذكرات/,
    icon: '📚',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
    anim: 'cat-anim-float'
  },
  {
    match: /teacher|مدرس|معلم|استاذ|أستاذ/,
    icon: '🧑‍🏫',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
    anim: 'cat-anim-float'
  },
  {
    match: /course|سنتر.*كورسات|تدريب|دورات/,
    icon: '🎓',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    anim: 'cat-anim-float'
  },
  // 13. دواجن وتفريخ وطيور
  {
    match: /poultry.*hatching|تفريخ/,
    icon: '🐣',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    borderColor: '#FDE047',
    anim: 'cat-anim-bounce'
  },
  {
    match: /poultry|chicken|دواجن|فراخ|طيور|بط|أرانب/,
    icon: '🍗',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-pulse'
  },
  // 14. جزارة ولحوم طازجة
  {
    match: /butcher|meat|جزار|جزارة|لحوم|لحمة|عجول|كبدة/,
    icon: '🥩',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    anim: 'cat-anim-pulse'
  },
  // 15. حفر وشغل ليزر ودروع
  {
    match: /laser|حفر|ليزر|دروع|اكريليك/,
    icon: '✨',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    anim: 'cat-anim-pulse'
  },
  // 16. حلواني وتورتة ومخبز
  {
    match: /confectioner|cake|حلواني|تورتة|تورته|جاتوه|شوكولاتة|بسبوسة|كنافة/,
    icon: '🎂',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-bounce'
  },
  {
    match: /bakery|مخبز|عيش|فينو|مخبوزات/,
    icon: '🍞',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-bounce'
  },
  // 17. توصيل ودليفري وشحن
  {
    match: /delivery|توصيل|دليفري|شحن|طرد/,
    icon: '🚀',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-float'
  },
  // 18. كاش ورصيد ومحافظ إلكترونية
  {
    match: /cash|balance|كاش|رصيد|فوري|امان|محفظة|فودافون كاش/,
    icon: '💵',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    anim: 'cat-anim-float'
  },
  // 19. صراف آلي ATM وبنوك
  {
    match: /\batm\b|صراف.*ال|صراف.*آل|ماكينة.*صراف|بنك/,
    icon: '🏧',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },
  // 20. أطباء وعيادات
  {
    match: /doctor|clinic|دكتور|طبيب|عيادة|عيادات|استشاري|اخصائي/,
    icon: '👨‍⚕️',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },
  // 21. صيدليات ودواء
  {
    match: /pharmacy|صيدلية|صيدليه|دواء|علاج|روشتة/,
    icon: '💊',
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    anim: 'cat-anim-pulse'
  },
  // 22. معمل تحاليل
  {
    match: /analysis|تحاليل|معمل.*تحاليل/,
    icon: '🧪',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },
  // 23. علاج طبيعي وتغذية
  {
    match: /physical.*therapy|nutrition|علاج.*طبيعي|تغذية.*علاجية|تاهيل/,
    icon: '🩺',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    borderColor: '#5EEAD4',
    anim: 'cat-anim-pulse'
  },
  // 24. تصوير وفوتوسيشن واستوديو
  {
    match: /photograph|photoshoot|استوديو|ستديو|تصوير|سيشن|فوتوغرافي/,
    icon: '📸',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    anim: 'cat-anim-snap'
  },
  // 25. سياحة وسفر وحج وعمرة
  {
    match: /travel|tourism|سياحة|سياحه|سفر|طيران|حج|عمرة/,
    icon: '✈️',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-float'
  },
  // 26. فنادق ومبيت
  {
    match: /hotel|فندق|مبيت|لوكاندا|اقامة/,
    icon: '🏨',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    anim: 'cat-anim-pulse'
  },
  // 27. عقارات وأراضي وشقق
  {
    match: /real.*estate|عقار|عقارات|أراضي|اراضي|شقق|منازل|بيوت/,
    icon: '🏢',
    color: '#0F766E',
    bgColor: '#CCFBF1',
    borderColor: '#5EEAD4',
    anim: 'cat-anim-pulse'
  },
  // 28. صيانة الأجهزة الكهربائية المنزلية
  {
    match: /home.*appliance|electrical.*appliance|اجهزة.*كهربائية|أجهزة.*كهربائية|صيانة.*اجهزة|الأجهزة المنزلية|غسالات|بوتاجاز/,
    icon: '📺',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
    anim: 'cat-anim-pulse'
  },
  // 29. صيانة موتوسيكلات وتوكتوك
  {
    match: /motorcycle|موتوسيكل|موتسيكل|موتسيكلات|توكتوك|بيتش باجي/,
    icon: '🏍️',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-bounce'
  },
  // 30. صيانة وتركيب التكييف والتبريد
  {
    match: /air.*condition|hvac|تكييف|مكيف|تبريد|تكييفات|التكييف/,
    icon: '❄️',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-spin-slow'
  },
  // 31. طباخة أفراح وبوفيهات
  {
    match: /wedding.*cook|طباخ|طباخة|بوفيه|ولائم/,
    icon: '👩‍🍳',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-swing'
  },
  // 32. عطارة وتوابل وأعشاب
  {
    match: /\bherbs?\b|spice|عطارة|عطاره|توابل|بهارات|أعشاب|اعشاب/,
    icon: '🌿',
    color: '#65A30D',
    bgColor: '#ECFCCB',
    borderColor: '#BEF264',
    anim: 'cat-anim-float'
  },
  // 33. فروع شركات الاتصالات
  {
    match: /telecom|اتصالات|فودافون|اورنج|أورانج|\bwe\b|شبكات.*محمول/,
    icon: '📶',
    color: '#E11D48',
    bgColor: '#FFE4E6',
    borderColor: '#FDA4AF',
    anim: 'cat-anim-pulse'
  },
  // 34. فسيخ ورنجة وأسماك
  {
    match: /fesikh|herring|فسيخ|رنجة|رنجه|ملوحة/,
    icon: '🐟',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-swing'
  },
  {
    match: /fish|seafood|اسماك|أسماك|سمك|جمبري|سبيط/,
    icon: '🐟',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-swing'
  },
  // 35. قاعات أفراح ومناسبات
  {
    match: /wedding.*hall|قاعة|قاعات|افراح|أفراح|مناسبات/,
    icon: '👑',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    borderColor: '#D8B4FE',
    anim: 'cat-anim-pulse'
  },
  // 36. حلاقة رجالي وقص شعر
  {
    match: /barber|haircut|حلاق|حلاقة|قص.*شعر/,
    icon: '💈',
    color: '#1E293B',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    anim: 'cat-anim-swing'
  },
  // 37. كوافير حريمي وبيوتي سنتر
  {
    match: /hairdresser|beauty|كوافير.*حريم|كوافير|بيوتي.*سنتر|ميك.*اب|صالون.*حريم/,
    icon: '💇‍♀️',
    color: '#DB2777',
    bgColor: '#FCE7F3',
    borderColor: '#F9A8D4',
    anim: 'cat-anim-swing'
  },
  // 38. زجاج وألوميتال
  {
    match: /glass.*cut|زجاج|قص.*زجاج|مرايا/,
    icon: '🪟',
    color: '#0891B2',
    bgColor: '#CFFAFE',
    borderColor: '#67E8F9',
    anim: 'cat-anim-pulse'
  },
  {
    match: /aluminum|alumital|الوميتال|ألوميتال|الومنتيال/,
    icon: '🪟',
    color: '#64748B',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    anim: 'cat-anim-pulse'
  },
  // 39. مطاعم وكافيهات ومأكولات ومشويات
  {
    match: /restaurant|مطعم|مطاعم|مأكولات|مشويات|شاورما|بيتزا|برجر|كريب|وجبات/,
    icon: '🍽️',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-swing'
  },
  // 40. قهوة بلدي ومقاهي
  {
    match: /local.*coffee|قهوة|مقهى|شاي|\bكافيه\b/,
    icon: '☕',
    color: '#78350F',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-swing'
  },
  // 40. أحذية وشنط
  {
    match: /shoe|احذية|أحذية|شوز|كوتشي/,
    icon: '👞',
    color: '#BE185D',
    bgColor: '#FCE7F3',
    borderColor: '#F9A8D4',
    anim: 'cat-anim-swing'
  },
  {
    match: /\bbag\b|شنط|حقائب|صيانة.*احذية/,
    icon: '👜',
    color: '#78350F',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-swing'
  },
  // 41. بويات ودهانات ونقاشة
  {
    match: /\bpaint\b|بويات|دهانات|نقاشة|معجون|الوان/,
    icon: '🎨',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-float'
  },
  // 42. محل ملابس وأزياء
  {
    match: /clothing|ملابس|بدل|عبايات|أزياء|قميص|بنطلون|الملابس/,
    icon: '👔',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    anim: 'cat-anim-float'
  },
  // 43. عصافير زينة وأسماك زينة
  {
    match: /pet.*bird|عصافير|عصافير.*زينة|طيور.*زينة/,
    icon: '🦜',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    anim: 'cat-anim-bounce'
  },
  // 44. خضار وفاكهة
  {
    match: /vegetable|fruit|خضار|فاكهة|فواكه|طماطم|بطاطس/,
    icon: '🍎',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    anim: 'cat-anim-bounce'
  },
  // 45. سباكة وأدوات صحية
  {
    match: /plumb|sanitary|سباك|سباكة|ادوات.*صحية|أدوات.*صحية|خلاطات|مواسير|السباكة/,
    icon: '🔧',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-swing'
  },
  // 46. هواتف وموبايل وصيانة
  {
    match: /phone|mobile|موبايل|هاتف|هواتف|تليفون|صيانة.*موبايل/,
    icon: '📱',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
    anim: 'cat-anim-vibrate'
  },
  // 47. مفاتيح وطباعة مفاتيح
  {
    match: /key|مفاتيح|طباعة.*مفاتيح|كالون/,
    icon: '🔑',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-swing'
  },
  // 48. علف وحبوب ومواشي
  {
    match: /\bfeed\b|علف|أعلاف|اعلاف|حبوب|ردة|دشيش/,
    icon: '🌾',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    borderColor: '#FDE047',
    anim: 'cat-anim-swing'
  },
  // 49. هدايا وإكسسوارات
  {
    match: /gift|accessor|هدايا|إكسسوار|اكسسوار|برفانات|عطور/,
    icon: '🎁',
    color: '#DB2777',
    bgColor: '#FCE7F3',
    borderColor: '#F9A8D4',
    anim: 'cat-anim-bounce'
  },
  // 50. ذهب ومجوهرات وصاغة
  {
    match: /gold|jewel|ذهب|مجوهرات|صاغة|فضة/,
    icon: '💍',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-pulse'
  },
  // 51. حيوانات أليفة
  {
    match: /\bpet\b|حيوانات|حيوانات.*أليفة|حيوانات.*اليفة|قطط|كلاب/,
    icon: '🐱',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-bounce'
  },
  // 52. لعب أطفال وملاهي
  {
    match: /toy|العاب.*اطفال|لعب.*اطفال|ألعاب.*أطفال|لعب.*الأطفال/,
    icon: '🧸',
    color: '#E11D48',
    bgColor: '#FFE4E6',
    borderColor: '#FDA4AF',
    anim: 'cat-anim-bounce'
  },
  // 53. مقلة ومحمصة ولب ومكسرات (Using precise word boundaries to prevent matching 'البان' / 'البناء')
  {
    match: /roastery|محمصة|مقلة|تسالي|\bلب\b|مكسرات|سوداني/,
    icon: '🥜',
    color: '#78350F',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-float'
  },
  // 54. سبوع ومستلزمات أعياد ميلاد
  {
    match: /birthday|baby.*shower|سبوع|اعياد.*ميلاد|أعياد.*ميلاد|حفلات/,
    icon: '🎈',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    borderColor: '#F9A8D4',
    anim: 'cat-anim-float'
  },
  // 55. مستلزمات طبية ومستحضرات تجميل
  {
    match: /medical.*suppl|cosmetic|مستلزمات.*طبية|مستحضرات.*تجميل|شاش|قطن/,
    icon: '🧴',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },

  // 57. مطبخ للأكل البيتي
  {
    match: /home.*food|اكل.*بيتي|أكل.*بيتي|مطبخ.*بيتي|طواجن|عزومات|مطبخ للأكل/,
    icon: '🍲',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-swing'
  },
  // 58. مطبعة وبانر ودعاية وإعلان
  {
    match: /print|banner|advertis|مطبعة|بانر|اعلانات|إعلانات|دعاية|فلكس/,
    icon: '🖨️',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    anim: 'cat-anim-pulse'
  },
  // 59. معاهد وكليات وجامعات
  {
    match: /institute|college|معاهد|كليات|معهد|كلية|جامعة/,
    icon: '🏛️',
    color: '#1E293B',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    anim: 'cat-anim-pulse'
  },
  // 60. أنتيكات وتحف
  {
    match: /antique|أنتيكات|انتيكات|تحف|كريستال/,
    icon: '🏺',
    color: '#B45309',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-float'
  },
  // 61. أثاث ونجارة وموبيليا
  {
    match: /furniture|اثاث|أثاث|موبيليا|غرف نوم|انتريه|صالون|النجارة والأثاث/,
    icon: '🛋️',
    color: '#78350F',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-float'
  },
  // 62. عصير ومعصرة قصب
  {
    match: /juice|عصير|معصرة|قصب|فريش/,
    icon: '🧃',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-bounce'
  },
  // 63. مقاولات وبناء وإنشاءات
  {
    match: /contract|construct|مقاولات|البناء والإنشاء|بناء|تشييد|خرسانة|اسمنت/,
    icon: '🏗️',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    anim: 'cat-anim-pulse'
  },
  // 64. تخليص أوراق ومصالح حكومية
  {
    match: /document|تخليص.*اوراق|تخليص.*أوراق|خدمات.*حكومية/,
    icon: '📑',
    color: '#0F766E',
    bgColor: '#CCFBF1',
    borderColor: '#5EEAD4',
    anim: 'cat-anim-float'
  },
  // 65. محاسبة وضرائب ومراجعة
  {
    match: /account|محاسبة|محاسب|ضرائب|دفاتر/,
    icon: '📊',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },
  // 66. محاماة واستشارات قانونية
  {
    match: /law|lawyer|محاماة|محامي|قانون|استشارات.*قانونية/,
    icon: '⚖️',
    color: '#1E293B',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    anim: 'cat-anim-swing'
  },
  // 67. مكتبة وكتب وأدوات مدرسية
  {
    match: /bookstore|library|مكتبة|مكتبه|كتب|كشاكيل|قرطاسية/,
    icon: '📚',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
    anim: 'cat-anim-float'
  },
  // 68. منتجات بلاستيكية وورقية
  {
    match: /plastic|paper|بلاستيك|ورقيات|مناديل|أكياس|اكياس/,
    icon: '🧻',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    borderColor: '#5EEAD4',
    anim: 'cat-anim-float'
  },
  // 69. منظفات وأدوات تنظيف
  {
    match: /clean.*product|منظفات|ادوات.*تنظيف|صابون|مسحوق/,
    icon: '🧴',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },
  // 70. ذكاء اصطناعي وبرمجة
  {
    match: /artificial.*intel|ذكاء.*اصطناعي|ذكاء.*إصطناعي|مبرمج|برمجة/,
    icon: '🤖',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    anim: 'cat-anim-pulse'
  },
  // 71. نظارات وبصريات
  {
    match: /optic|glasses|نظارات|بصريات|عدسات|كشف.*نظر/,
    icon: '👓',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-swing'
  },
  // 72. جبس بورد وديكور أسقف
  {
    match: /gypsum|جبس.*بورد|اسقف.*معلقة|جبسوم/,
    icon: '📐',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    anim: 'cat-anim-pulse'
  },
  // 73. تصليح وميكانيكا سيارات ومركبات
  {
    match: /car.*repair|mechanic|تصليح.*سيارات|ميكانيكي|عفشة|رادياتير|السيارات والمركبات/,
    icon: '🚗',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    anim: 'cat-anim-bounce'
  },
  // 74. حدادة وشغل كريتال
  {
    match: /blacksmith|حدادة|حداد|كريتال|ابواب.*حديد|الحدادة والألوميتال/,
    icon: '🔨',
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    anim: 'cat-anim-swing'
  },
  // 75. رخام وجرانيت
  {
    match: /marble|granite|رخام|جرانيت|مطابخ.*رخام/,
    icon: '🪨',
    color: '#475569',
    bgColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    anim: 'cat-anim-pulse'
  },
  // 76. نجارة أخشاب
  {
    match: /woodwork|carpenter|نجارة.*اخشاب|نجار.*اخشاب/,
    icon: '🪚',
    color: '#78350F',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    anim: 'cat-anim-swing'
  },
  // 77. كهرباء وإنارة
  {
    match: /electric|كهرباء|كهربائي|إنارة|انارة|ليدات/,
    icon: '⚡',
    color: '#EAB308',
    bgColor: '#FEF9C3',
    borderColor: '#FDE047',
    anim: 'cat-anim-pulse'
  },
  // 78. تشطيبات وديكور
  {
    match: /finishing|decor|تشطيبات|ديكور|معمار|التشطيبات/,
    icon: '🎨',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },
  // 79. خياطة وتفصيل
  {
    match: /tailor|sewing|خياطة|خياط|ترزي|تفصيل/,
    icon: '🧵',
    color: '#DB2777',
    bgColor: '#FCE7F3',
    borderColor: '#F9A8D4',
    anim: 'cat-anim-swing'
  },
  // 80. نظافة منزلية وغسيل سجاد
  {
    match: /cleaning|نظافة|خدمات.*منزلية|غسيل.*سجاد|مكافحة.*حشرات|النظافة والخدمات/,
    icon: '🧹',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-swing'
  },
  // 81. زراعة وحدائق ولاندسكيب
  {
    match: /gardening|agricultur|زراعة|حدائق|مشاتل|شجر|نخيل|الزراعة والحدائق/,
    icon: '🌳',
    color: '#15803D',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    anim: 'cat-anim-float'
  },
  // 82. قرآن كريم وقراء
  {
    match: /quran|قرآن|مصحف|قارئ|تلاوة|جامع|مسجد/,
    icon: '📖',
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    anim: 'cat-anim-float'
  },
  // 83. نقل وخدمات لوجستية
  {
    match: /transport|النقل والخدمات|خدمات نقل|شاحنات/,
    icon: '🚚',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  },
  // 84. خدمات متنوعة
  {
    match: /misc|خدمات متنوعة/,
    icon: '🔑',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    anim: 'cat-anim-pulse'
  }
];

// Fallback Default
const DEFAULT_VISUAL = {
  icon: '🏪',
  color: '#0284C7',
  bgColor: '#E0F2FE',
  borderColor: '#BAE6FD',
  anim: 'cat-anim-pulse'
};

/**
 * Resolves complete visual metadata for any category object, slug, or name
 */
export function getCategoryVisualMeta(categoryOrSlugOrName = {}) {
  let slug = '';
  let name = '';
  let rawIcon = '';

  if (typeof categoryOrSlugOrName === 'string') {
    slug = categoryOrSlugOrName;
    name = categoryOrSlugOrName;
  } else if (categoryOrSlugOrName && typeof categoryOrSlugOrName === 'object') {
    slug = categoryOrSlugOrName.slug || categoryOrSlugOrName._key || categoryOrSlugOrName.id || '';
    name = categoryOrSlugOrName.name || categoryOrSlugOrName.nameAr || categoryOrSlugOrName.nameEn || '';
    rawIcon = categoryOrSlugOrName.icon || '';
  }

  const query = `${slug} ${name}`.toLowerCase();
  const normalized = normalizeArabic(query).toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(query) || rule.match.test(normalized)) {
      return {
        slug,
        name,
        icon: rule.icon,
        isDress: Boolean(rule.isDress),
        color: rule.color,
        bgColor: rule.bgColor,
        borderColor: rule.borderColor,
        animClass: rule.anim
      };
    }
  }

  // If no rule matched but there is a clean valid emoji in rawIcon (not a broken glyph)
  const isBrokenGlyph = /[\u1000-\u109F\uA800-\uA82F\u{10000}-\u{1FFFF}]/u.test(rawIcon) && rawIcon.length === 1;
  const cleanEmoji = (rawIcon && !isBrokenGlyph && rawIcon !== '📁' && rawIcon !== '🏪') ? rawIcon : DEFAULT_VISUAL.icon;

  return {
    slug,
    name,
    icon: cleanEmoji,
    isDress: false,
    color: DEFAULT_VISUAL.color,
    bgColor: DEFAULT_VISUAL.bgColor,
    borderColor: DEFAULT_VISUAL.borderColor,
    animClass: DEFAULT_VISUAL.anim
  };
}

/**
 * Returns HTML markup for rendering an icon inside category card or header
 */
export function renderCategoryCardIcon(categoryOrSlugOrName, { size = 42 } = {}) {
  const meta = getCategoryVisualMeta(categoryOrSlugOrName);

  if (meta.isDress) {
    return getDressSvg(meta.color, size);
  }

  return `
    <span class="category-icon-orb ${meta.animClass}" style="font-size:${Math.round(size * 0.72)}px;display:grid;place-items:center;width:100%;height:100%;line-height:1;" aria-hidden="true">
      ${meta.icon}
    </span>
  `;
}
