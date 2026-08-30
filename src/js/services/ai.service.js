/**
 * المنزلة وناسها — AI Service (خدمة الذكاء الاصطناعي وسيو المنزلة)
 * Multi-model AI orchestration via OpenRouter & Cloudflare Worker.
 *
 * Capabilities:
 * 1. Professional & Natural English Business Translation (غير حرفية ومراعية لأسماء الأنشطة والأشخاص)
 * 2. Smart Grammatical Gender Recognition (مذكر / مؤنث) for Descriptions
 * 3. 100% SEO-Optimized Descriptions (خالية تماماً من كلمة "يقدم/تقدم" ومتوافقة مع محركات البحث و AI Search)
 * 4. Comprehensive Egyptian Commerce Services & Keywords Dictionary (مبني على واقع الأنشطة التجارية في مصر والمنزلة)
 * 5. High-Resolution Categorized Cover & Dynamic Logo Generators
 * 6. Semantic AI Search
 */

import { generateSlug, transliterateToEnglishName } from '../utils/slug.js';
import { WORKER_URL } from '../core/firebase.js';

// Multi-Model Cascade for Text & SEO Generation (Free & Ultra-Fast Models on OpenRouter)
const AI_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2.5-7b-instruct:free'
];

/**
 * Call OpenRouter with automatic multi-model fallback cascade
 */
async function callOpenRouterWithFallback(prompt, systemPrompt = 'أنت مساعد ذكاء اصطناعي خبير في الترجمة الاحترافية والسيو التجاري والمحلي في مصر.') {
  for (const model of AI_MODELS) {
    try {
      const workerRes = await fetch(`${WORKER_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt, model }),
        signal: AbortSignal.timeout(7000)
      });
      if (workerRes.ok) {
        const data = await workerRes.json();
        const text = data.result || data.text || data.content || (data.choices && data.choices[0]?.message?.content);
        if (text && typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      }
    } catch (_) {
      // Try next model in cascade
    }
  }
  return null;
}

/**
 * ─────────────────────────────────────────────────────────────
 * 1. PROFESSIONAL ENGLISH BUSINESS NAME TRANSLATION (ترجمة غير حرفية)
 * ─────────────────────────────────────────────────────────────
 */

const EGYPTIAN_NAME_TRANSLITERATION = {
  'محمد': 'Mohamed',
  'احمد': 'Ahmed',
  'أحمد': 'Ahmed',
  'محمود': 'Mahmoud',
  'مصطفى': 'Mostafa',
  'مصطفي': 'Mostafa',
  'حماد': 'Hammad',
  'نصر': 'Nasr',
  'علي': 'Ali',
  'على': 'Ali',
  'حسن': 'Hassan',
  'حسين': 'Hussein',
  'ابراهيم': 'Ibrahim',
  'إبراهيم': 'Ibrahim',
  'عمر': 'Omar',
  'عمرو': 'Amr',
  'خالد': 'Khaled',
  'طارق': 'Tarek',
  'سامح': 'Sameh',
  'كريم': 'Karim',
  'شريف': 'Sherif',
  'وليد': 'Walid',
  'ياسر': 'Yasser',
  'هشام': 'Hesham',
  'عادل': 'Adel',
  'عصام': 'Essam',
  'حازم': 'Hazem',
  'جمال': 'Gamal',
  'اشرف': 'Ashraf',
  'أشرف': 'Ashraf',
  'رضا': 'Reda',
  'صبري': 'Sabry',
  'البحر': 'El-Bahr',
  'الاهرام': 'Al-Ahram',
  'الأهرام': 'Al-Ahram',
  'الامل': 'Al-Amal',
  'الأمل': 'Al-Amal',
  'النور': 'Al-Nour',
  'الهدى': 'Al-Hoda',
  'الشروق': 'Al-Shorouk',
  'الفرسان': 'Al-Forsan',
  'البرنس': 'El-Prens',
  'الملك': 'El-Malek',
  'الملكة': 'El-Maleka',
  'الباشا': 'El-Basha',
  'الزعيم': 'El-Zaeem',
  'الندى': 'El-Nada',
  'المنزلة': 'El-Manzala',
  'الدقهلية': 'Dakahlia',
  'الفنان': 'El-Fannan',
  'الحديث': 'Modern',
  'الحديثة': 'Modern',
  'التخصصية': 'Specialized',
  'الدولي': 'International',
  'الدولية': 'International',
  'العالمية': 'Global',
  'الذهبي': 'Golden',
  'الذهبية': 'Golden'
};

const BIZ_TERMS_MAP = {
  'صيدلية': 'Pharmacy',
  'دكتور': 'Dr.',
  'طبيب': 'Clinic',
  'عيادة': 'Clinic',
  'مركز': 'Center',
  'مستشفى': 'Hospital',
  'معمل': 'Laboratories',
  'مختبر': 'Lab',
  'اشعة': 'Radiology Center',
  'أشعة': 'Radiology Center',
  'سوبر ماركت': 'Supermarket',
  'هايبر': 'Hypermarket',
  'ماركت': 'Market',
  'بقالة': 'Grocery',
  'محمصة': 'Roastery & Coffee',
  'مقلة': 'Roastery & Nuts',
  'بن': 'Coffee',
  'مطعم': 'Restaurant',
  'مشويات': 'Grills & BBQ',
  'اسماك': 'Fresh Seafood',
  'أسماك': 'Fresh Seafood',
  'كريب': 'Crepe & Waffles',
  'شاورما': 'Shawarma',
  'فطائر': 'Pies & Pastries',
  'بيتزا': 'Pizza',
  'كشري': 'Koshary',
  'حواوشي': 'Hawawshi',
  'فول': 'Foul & Falafel',
  'كافيه': 'Cafe',
  'مقهى': 'Coffee Lounge',
  'عصائر': 'Fresh Juice Bar',
  'حلويات': 'Sweets & Confectionery',
  'حلواني': 'Pastry & Confectionery',
  'مخبز': 'Artisan Bakery',
  'فرن': 'Bakery',
  'معرض': 'Showroom',
  'موبيليا': 'Furniture',
  'اثاث': 'Furniture',
  'أثاث': 'Furniture',
  'مفروشات': 'Home Linens & Bedding',
  'سجاد': 'Carpets & Rugs',
  'ستائر': 'Curtains & Drapes',
  'سيراميك': 'Ceramics & Porcelain',
  'رخام': 'Marble & Granite',
  'ديكور': 'Design & Decor',
  'مقاولات': 'Contracting',
  'هندسة': 'Engineering',
  'مهندس': 'Eng.',
  'ملابس': 'Fashion & Apparel',
  'بوتيك': 'Boutique',
  'احذية': 'Footwear & Shoes',
  'أحذية': 'Shoes & Bags',
  'مجوهرات': 'Jewelry',
  'ذهب': 'Gold & Jewelry',
  'موبايل': 'Phones & Accessories',
  'هواتف': 'Mobile Store',
  'كمبيوتر': 'Computers & Tech',
  'مكتبة': 'Stationery & Books',
  'حلاق': 'Barbershop & Grooming',
  'كوافير': 'Beauty Salon',
  'تجميل': 'Cosmetics & Beauty',
  'صالون': 'Salon & Spa',
  'سنتر': 'Center',
  'جيم': 'Gym & Fitness',
  'مغسلة': 'Laundry & Dry Clean',
  'دراي كلين': 'Dry Clean',
  'سباك': 'Plumbing Services',
  'كهربائي': 'Electrical Services',
  'نجار': 'Carpentry & Woodwork',
  'نقاش': 'Painting & Finishes',
  'حداد': 'Metal & Iron Works',
  'الوميتال': 'Alumital & Glass',
  'ميكانيكي': 'Auto Repair & Mechanic',
  'كاوتش': 'Tire Care & Wheel Alignment',
  'زيوت': 'Lube & Oil Service',
  'قطع غيار': 'Auto Spare Parts',
  'عقارات': 'Real Estate',
  'محامي': 'Legal Firm',
  'محاسب': 'Accounting & Tax',
  'استوديو': 'Photography Studio',
  'قصر': 'Qasr',
  'مكسرات': 'Premium Nuts',
  'تسالي': 'Nuts & Snacks',
  'عطور': 'Perfumes & Fragrances',
  'بصريات': 'Optics & Eyewear',
  'نظارات': 'Eyewear & Sunglasses',
  'عطارة': 'Spices & Herbs',
  'اعشاب': 'Herbal Center',
  'أعشاب': 'Herbal Center',
  'فراخ': 'Poultry & Chicken',
  'دواجن': 'Poultry & Chicken',
  'لحوم': 'Fresh Meats',
  'جزارة': 'Butcher Shop',
  'كبدة': 'Kebda & Oriental Fast Food',
  'طباعة': 'Printing & Advertising',
  'دعاية': 'Advertising & Media',
  'اعلان': 'Advertising Agency',
  'إعلان': 'Advertising Agency',
  'قاعة': 'Events & Wedding Hall',
  'افراح': 'Weddings',
  'أفراح': 'Weddings',
  'بلايستيشن': 'Gaming Lounge',
  'العاب': 'Toys & Games',
  'ألعاب': 'Toys & Games',
  'هدايا': 'Gifts & Accessories'
};

/**
 * Translates Arabic business name to natural, idiomatic, high-end English (Non-literal)
 */
export async function translatePlaceName(arabicName, category = '') {
  if (!arabicName || typeof arabicName !== 'string') return '';
  const cleanArabic = arabicName.trim();

  // Try OpenRouter AI First for natural branding
  try {
    const prompt = `Translate this Egyptian business/place name into a natural, polished, high-end English brand name suitable for a business directory.
CRITICAL RULES:
- Do NOT translate literally word-by-word. Use standard professional business naming (e.g. "محمصة البحر للمكسرات" -> "El-Bahr Roastery & Premium Nuts", "مهندس محمد حماد للمقاولات" -> "Eng. Mohamed Hammad Contracting", "دكتور أحمد علي لطب الأطفال" -> "Dr. Ahmed Ali Pediatrics Clinic").
- Correctly transliterate personal and family names into natural English.
- Return ONLY the final English name. No quotation marks, no explanations, no Arabic text.

Arabic Name: ${cleanArabic}
Category: ${category || 'Local Business'}`;

    const aiResult = await callOpenRouterWithFallback(prompt);
    if (aiResult) {
      let cleaned = aiResult.replace(/["'`«»]/g, '').trim();
      cleaned = cleaned.replace(/^(Translation|Name|English|Brand):\s*/i, '').trim();

      const hasArabic = /[\u0600-\u06FF]/.test(cleaned);
      if (cleaned && !hasArabic && cleaned.length >= 3) {
        return cleaned;
      }
    }
  } catch (_) {}

  // Deterministic Intelligent Synthesis Fallback
  let englishParts = [];
  const words = cleanArabic.split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Strip connectors: للـ, لـ, والـ, و
    let cleanWord = word;
    let isAndConnector = false;

    if (word.startsWith('وال')) {
      cleanWord = word.slice(3);
      isAndConnector = true;
    } else if (word.startsWith('لل')) {
      cleanWord = word.slice(2);
    } else if (word.startsWith('ال')) {
      cleanWord = word.slice(2);
    } else if (word.startsWith('ل') && word.length > 2) {
      cleanWord = word.slice(1);
    } else if (word.startsWith('و') && word.length > 2) {
      cleanWord = word.slice(1);
      isAndConnector = true;
    }

    const twoWords = (words[i] + ' ' + (words[i+1] || '')).trim();

    if (BIZ_TERMS_MAP[twoWords]) {
      englishParts.push(BIZ_TERMS_MAP[twoWords]);
      i++;
    } else if (BIZ_TERMS_MAP[word]) {
      englishParts.push(BIZ_TERMS_MAP[word]);
    } else if (BIZ_TERMS_MAP[cleanWord]) {
      if (isAndConnector && englishParts.length > 0 && englishParts[englishParts.length - 1] !== '&') {
        englishParts.push('&');
      }
      englishParts.push(BIZ_TERMS_MAP[cleanWord]);
    } else if (EGYPTIAN_NAME_TRANSLITERATION[word]) {
      englishParts.push(EGYPTIAN_NAME_TRANSLITERATION[word]);
    } else if (EGYPTIAN_NAME_TRANSLITERATION[cleanWord]) {
      if (isAndConnector && englishParts.length > 0 && englishParts[englishParts.length - 1] !== '&') {
        englishParts.push('&');
      }
      englishParts.push(EGYPTIAN_NAME_TRANSLITERATION[cleanWord]);
    } else {
      const trans = transliterateToEnglishName(cleanWord || word);
      if (trans) {
        if (isAndConnector && englishParts.length > 0 && englishParts[englishParts.length - 1] !== '&') {
          englishParts.push('&');
        }
        englishParts.push(trans);
      }
    }
  }

  if (englishParts.length > 0) {
    return englishParts.join(' ');
  }

  return transliterateToEnglishName(cleanArabic) || generateSlug(cleanArabic) || 'Premier Business';
}

/**
 * ─────────────────────────────────────────────────────────────
 * 2. SMART GRAMMATICAL GENDER DETECTOR (مذكر / مؤنث)
 * ─────────────────────────────────────────────────────────────
 */

export function detectArabicGrammaticalGender(name = '', category = '') {
  const combined = (name + ' ' + category).toLowerCase();

  // Feminine indicators
  const feminineKeywords = [
    'صيدلية', 'عيادة', 'محمصة', 'مقلة', 'مدرسة', 'مغسلة', 'ورشة',
    'شركة', 'مؤسسة', 'أكاديمية', 'اكاديمية', 'وكالة', 'حضانة', 'مكتبة',
    'كافتيريا', 'صالة', 'جمعية', 'قرية', 'حديقة', 'محطة', 'قاعة', 'مصبغة',
    'دكتورة', 'مهندسة', 'معلمة', 'كوافير حريمي'
  ];

  for (const fem of feminineKeywords) {
    if (combined.includes(fem)) {
      return 'feminine';
    }
  }

  // Check if primary business noun ends with feminine 'ة' or 'اء'
  const firstWord = (name.trim().split(/\s+/)[0] || '');
  if (firstWord.endsWith('ة') || firstWord.endsWith('ية') || firstWord.endsWith('اء')) {
    return 'feminine';
  }

  return 'masculine';
}

/**
 * ─────────────────────────────────────────────────────────────
 * 3. 100% SEO-OPTIMIZED DESCRIPTION GENERATOR (خالي تماماً من "يقدم/تقدم")
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Generates an SEO & AI-Search Optimized place description.
 * STRICT DIRECTIVE: Never uses "يقدم" or "تقدم". Uses rich vocabulary and respects grammatical gender.
 */
export async function generateSeoDescription(placeName = '', categoryName = '', area = 'المنزلة') {
  if (!placeName || !placeName.trim()) return '';

  const cleanName = placeName.trim();
  const cleanCategory = (categoryName || 'خدمات وأنشطة عامة').trim();
  const cleanArea = (area || 'المنزلة').trim();
  const gender = detectArabicGrammaticalGender(cleanName, cleanCategory);

  const prompt = `اكتب وصفاً تسويقياً فريداً واحترافياً ومتوافقاً مع معايير السيو (SEO) ومحركات البحث الذكية (AI Search / Google SGE) لنشاط في مدينة المنزلة بمحافظة الدقهلية.

البيانات:
- اسم النشاط: ${cleanName}
- نوع التخصص: ${cleanCategory}
- المنطقة: ${cleanArea}
- الصيغة اللغوية: ${gender === 'feminine' ? 'مؤنث (صيدلية، عيادة، شركة...)' : 'مذكر (محل، مركز، مطعم، صالون...)'}

قواعد وإرشادات صارمة جداً:
1. ممنوع منعاً باتاً استخدام كلمة "يقدم" أو "تقدم" أو "يقوم بتقديم" أو "تقوم بتقديم".
2. استخدم أفعالاً وعبارات راقية ومتباينة حسب الصيغة (${gender === 'feminine' ? 'تتميز بـ، تُعد وجهتكِ الموثوقة لـ، تختص في، تجمع بين، توفر تشكيلة واسعة من' : 'يتميز بـ، يُعد وجهتك الموثوقة لـ، يختص في، يجمع بين، يوفر تشكيلة واسعة من'}).
3. اجعل النص غنياً بالكلمات المفتاحية الطبيعية والكيانات الجغرافية (مدينة المنزلة، محافظة الدقهلية، ${cleanArea}) بحيث يظهر المكان في النتيجة الأولى عند البحث.
4. اذكر مميزات الجودة والسرعة وحسن التعامل وثقة العملاء.
5. اكتب فقرة واحدة انسيابية وجذابة (من 3 إلى 5 أسطر) بدون أي مقدمات، بدون تعداد نقطي، وبدون علامات تنصيص.`;

  const aiResult = await callOpenRouterWithFallback(prompt, 'أنت خبير سيو وكتابة محتوى إعلاني رقمي فائق الاحترافية للأنشطة والشركات المصرية.');
  if (aiResult && aiResult.length > 25) {
    // Sanitize any accidental "يقدم/تقدم" from AI output
    let sanitized = aiResult
      .replace(/^["'«»]+|["'«»]+$/g, '')
      .replace(/\bيقدم\b/g, 'يوفر')
      .replace(/\bتقدم\b/g, 'توفر')
      .replace(/\bيقوم بتقديم\b/g, 'يختص بتوفير')
      .replace(/\bتقوم بتقديم\b/g, 'تختص بتوفير')
      .trim();
    return sanitized;
  }

  // High-End SEO Deterministic Dynamic Fallback (Zero "يقدم/تقدم", 100% Unique & Gender-Aware)
  if (gender === 'feminine') {
    return `تُعد ${cleanName} من أبرز الوجهات الموثوقة في مدينة ${cleanArea} بمحافظة الدقهلية المتخصصة في مجالات ${cleanCategory}. تنفرد بتوفير أعلى معايير الجودة والإتقان مع الحرص الدائم على تلبية متطلبات أهالي المنزلة الكرام بدقة فائقة، وتجمع بين عراقة الخبرة وحسن الاستقبال والأسعار التنافسية التي تجعلها الاختيار الأول دائماً.`;
  } else {
    return `يُعد ${cleanName} من أبرز الوجهات الموثوقة في مدينة ${cleanArea} بمحافظة الدقهلية المتخصصة في مجالات ${cleanCategory}. ينفرد بتوفير أعلى معايير الجودة والإتقان مع الحرص الدائم على تلبية متطلبات أهالي المنزلة الكرام بدقة فائقة، ويجمع بين عراقة الخبرة وحسن الاستقبال والأسعار التنافسية التي تجعله الاختيار الأول دائماً.`;
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * 4. EGYPTIAN COMMERCE SERVICES & KEYWORDS GENERATOR (السوق المصري)
 * ─────────────────────────────────────────────────────────────
 */

const EGYPTIAN_DETAILED_SERVICES_MAP = {
  'سوبر ماركت': 'سلع تموينية وغذائية، ألبان وأجبان طازجة، مجمدات ولحوم، منظفات ومستلزمات منزلية، مشروبات وعصائر، خدمة توصيل طلبات للمنازل دليفري، دفع فواتير وفودافون كاش، عروض وتخفيضات يومية',
  'ماركت': 'سلع تموينية وغذائية، ألبان وأجبان طازجة، مجمدات ولحوم، منظفات ومستلزمات منزلية، مشروبات وعصائر، خدمة توصيل طلبات للمنازل دليفري، دفع فواتير وفودافون كاش، عروض وتخفيضات يومية',
  'هايبر': 'تسوق شامل ومواد غذائية، قسم الأدوات المنزلية والأجهزة، مجمدات وأغذية طازجة، عروض جملة وقطاعي، خدمة دليفري وتوصيل سريع',
  'صيدلية': 'صرف الروشتات الطبية وتوفير كافة الأدوية، أدوية الأمراض المزمنة، قياس الضغط ونسبة السكر بالدم، مستحضرات العناية بالبشرة والشعر، مكملات غذائية وفيتامينات، مستلزمات رعاية الأطفال وحديثي الولادة، خدمة توصيل علاج للمنازل 24 ساعة',
  'محمصة': 'بن يمني وبرازيلي مطحون طازج، مكسرات فاخرة (كاجو وفستق ولوز وبندق وعين جمل)، لب سوبر ولب خشب وتسالي مشكلة، ياميش وفواكه مجففة، شوكولاتة وهدايا فاخرة، مقرمشات وحبوب، تمور وعطارة',
  'مقلة': 'بن يمني وبرازيلي مطحون طازج، مكسرات فاخرة (كاجو وفستق ولوز وبندق وعين جمل)، لب سوبر ولب خشب وتسالي مشكلة، ياميش وفواكه مجففة، شوكولاتة وهدايا فاخرة، مقرمشات وحبوب، تمور وعطارة',
  'بن': 'توليفات بن ممتازة فاتح ومحوج وغامق، بن يمني وبرازيلي وكولومبي، حبوب قهوة مختصة، بهارات ومستلزمات القهوة، طحن فوري طازج',
  'مطعم': 'وجبات سريعة وسفاري، كريب وسندوتشات، بيتزا وفطائر، مشويات ولحوم بلدي طازجة، وجبات عائلية وطواجن، صوصات ومقبلات، خدمة صالة وتيك أواي، توصيل دليفري سريع بالمنزلة',
  'مشويات': 'كباب وكفتة وطرب بلدي، فراخ مشوية على الفحم، طواجن لحمة وموزات، أرز بسمتي وسلطات ومقبلات، تجهيز عزومات وحفلات، توصيل سخن للمنازل',
  'اسماك': 'سمك بلطي وبوري وطوبار بحيرة المنزلة طازج، جمبري وكابوريا واستاكوزا، طواجن سي فود وشوربة بحرية، شوي بالردة والزيت والليمون، قلي وتتبيل جاهز، خدمة تجهيز ولائم وعزومات أسماك',
  'أسماك': 'سمك بلطي وبوري وطوبار بحيرة المنزلة طازج، جمبري وكابوريا واستاكوزا، طواجن سي فود وشوربة بحرية، شوي بالردة والزيت والليمون، قلي وتتبيل جاهز، خدمة تجهيز ولائم وعزومات أسماك',
  'كافيه': 'مشروبات ساخنة وإسبريسو، عصائر وكوكتيلات فريش، سموزي وميلك شيك، وافل وكريب وشوكولاتة، شاشات عرض مباريات، جلسات عائلية وشبابية مكيفة، واي فاي مجاني',
  'دكتور': 'كشف وتشخيص طبي دقيق، استشارات متخصصة، أحدث الأجهزة التشخيصية، بروتوكولات علاجية حديثة، متابعة دورية للحالات، حجز مسبق لتجنب الانتظار، رعاية صحية متكاملة',
  'طبيب': 'كشف وتشخيص طبي دقيق، استشارات متخصصة، أحدث الأجهزة التشخيصية، بروتوكولات علاجية حديثة، متابعة دورية للحالات، حجز مسبق لتجنب الانتظار، رعاية صحية متكاملة',
  'عيادة': 'كشف وتشخيص طبي دقيق، استشارات متخصصة، أحدث الأجهزة التشخيصية، بروتوكولات علاجية حديثة، متابعة دورية للحالات، حجز مسبق لتجنب الانتظار، رعاية صحية متكاملة',
  'سباك': 'تأسيس شبكات سباكة وصرف صحي للشقق والعمائر، صيانة وتركيب خلاطات وأطقم حمامات، تصليح مواتير المياه، كشف تسربات المياه بأجهزة حديثة، تركيب فلاتر مياه وسخانات، طوارئ سباكة 24 ساعة',
  'كهربائي': 'تأسيس شبكات كهرباء حديثة للشقق والمحلات، صيانة لوحات الكهرباء والقواطع، تركيب نجف وسبوت لايت وليد بروفايل، صيانة الأجهزة الكهربائية المنزلية، توزيع أحمال وكشف أعطال الشورت',
  'نجار': 'تصنيع غرف نوم وسفرة وصالونات، صيانة وتصليح أبواب وشبابيك، مطابخ خشب ومودرن و MDF، فك ونقل وتركيب أثاث، نجارة باب وشباك وتشطيبات عمولة بالطلب',
  'نقاش': 'أحدث ديكورات الدهانات وورق الحائط، دهانات قطيفة وثري دي وجرافيتو، تشطيبات داخلية وخارجية، عزل ومعالجة الرطوبة والنشع، دقة والتزام بالمواعيد',
  'ميكانيكي': 'صيانة وتوضيب محركات وعفشة، فحص كمبيوتر وكشف أعطال دقيق، تغيير زيوت وفلاتر وسيور، صيانة فرامل ودبرياج، توفير قطع غيار أصلية بضمان، إنقاذ وطوارئ سيارات',
  'حلاق': 'قصات شعر عصرية واستشوار، تنعيم وفرد بروتين وكرياتين، تنظيف بشرة وحمام بخار وماسكات، تشذيب وتحديد لحية احترافي، باقات تجهيز عرسان متكاملة، أدوات معقمة ذات استخدام فردي',
  'كوافير': 'ميك أب سواريه وعرائس احترافي، قص وتصفيف وتسريحات شعر، فرد وعلاج الشعر بالبروتين والكولاجين، تنظيف بشرة عميق وهيدرافيشل، باديكير ومانيكير وتركيب رموش، حجاب ولفات طرح عصرية',
  'مخبز': 'عيش بلدي وفينو وباتيه طازج، تورت وجاتوهات أعياد ميلاد ومناسبات، حلويات شرقية فاخرة (بسبوسة، كنافة، بقلاوة)، مخبوزات دايت وشوفان، فطير مشلتت بالسمن البلدي، تجهيز طلبيات الحفلات',
  'موبايل': 'بيع أحدث الهواتف الذكية والأجهزة اللوحية، صيانة شاشات وبوردات وسوفت وير فوري، إكسسوارات وجرابات وشواحن أصلية، بطاريات وسماعات إيربودز، استبدال هواتف وشراء مستعمل، تحويلات ودفع فواتير',
  'ملابس': 'أحدث صيحات الموضة والملابس الجاهزة، ملابس كاجوال وكلاسيك وخروج، أزياء رجالي وحريمي وأطفال، خامات قطنية عالية الجودة، تشكيلة أحذية وشنط وإكسسوارات، عروض وتخفيضات موسمية',
  'مغسلة': 'غسيل وكي ملابس بالبخار، تنظيف جاف وبقع مستعصية، غسيل بطاطين وسجاد ومفروشات، تعقيم وتغليف معطر، خدمة استلام وتوصيل للمنازل',
  'عقارات': 'بيع وشراء شقق وعقارات وأراضي، إيجارات سكنية وتجارية ومحلات، استشارات وتسويق عقاري بالمنزلة، إنهاء الإجراءات القانونية ونقل الملكية، تقييم وتثمين عقاري',
  'مقاولات': 'تصميمات هندسية ومعمارية وديكور، إشراف وتنفيذ أعمال البناء والتشطيبات المتكاملة، تشطيب شقق وفلل ومحلات على المفتاح، أعمال السباكة والكهرباء والنجارة والدهانات'
};

/**
 * Generates Egyptian-market comprehensive services & SEO keywords
 */
export async function generateSeoServices(placeName = '', categoryName = '') {
  if (!placeName && !categoryName) return '';

  const cleanName = (placeName || '').trim();
  const cleanCat = (categoryName || '').trim();

  // Try OpenRouter AI for tailored Egyptian services
  try {
    const prompt = `اقترح قائمة بأهم 6 إلى 8 خدمات وكلمات مفتاحية بحثية متخصصة ومطلوبة بشدة في السوق المصري يبحث عنها المواطنون على جوجل ودليل المنزلة لهذا النشاط:
اسم المكان: ${cleanName}
النشاط / التخصص: ${cleanCat}
المدينة: المنزلة - محافظة الدقهلية

القواعد:
- اعطني فقط أسماء الخدمات مفصولة بفواصل عربية (،) بدون ترقيم وبدون أي نصوص إضافية.
- ركز على الخدمات الحقيقية التي يحتاجها الزبائن في مصر مثل (توصيل للمنازل، عروض وخصومات، صيانة متخصصة، منتجات طازجة، حجز مسبق...).`;

    const aiResult = await callOpenRouterWithFallback(prompt, 'أنت خبير كلمات مفتاحية وسيو وتجارة محلية في مصر.');
    if (aiResult && aiResult.length > 10) {
      return aiResult.replace(/\n/g, ' ').replace(/^["'«»]+|["'«»]+$/g, '').trim();
    }
  } catch (_) {}

  // Dictionary Lookup Fallback
  const combined = (cleanCat + ' ' + cleanName).toLowerCase();
  for (const [key, serv] of Object.entries(EGYPTIAN_DETAILED_SERVICES_MAP)) {
    if (combined.includes(key)) {
      return serv;
    }
  }

  return 'خدمة عملاء فائقة التميز، سرعة ودقة في التنفيذ، أسعار تنافسية مناسبة، خبرة وضمان معتمد، تلبية جميع احتياجات أهالي المنزلة على مدار الساعة';
}

/**
 * ─────────────────────────────────────────────────────────────
 * 5. HIGH-RESOLUTION COVER & VECTOR LOGO GENERATORS
 * ─────────────────────────────────────────────────────────────
 */

export async function generateCoverImage(placeName = '', categoryName = '', area = 'المنزلة') {
  const queryMap = {
    'طبيب': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    'دكتور': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    'عيادة': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    'صيدلية': 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=1200&q=80',
    'سوبر ماركت': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
    'ماركت': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
    'محمصة': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&q=80',
    'مقلة': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&q=80',
    'مطعم': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    'مشويات': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
    'اسماك': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=1200&q=80',
    'كافيه': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
    'مخبز': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80',
    'ملابس': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
    'جيم': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    'حلاق': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80',
    'كوافير': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
    'سباك': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80',
    'نجار': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1200&q=80',
    'ميكانيكي': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&q=80',
    'عقارات': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    'موبايل': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80'
  };

  const combined = (placeName + ' ' + categoryName).toLowerCase();
  for (const [key, url] of Object.entries(queryMap)) {
    if (combined.includes(key)) {
      return url;
    }
  }

  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80';
}

export function generateLogoImage(placeName = '', categoryName = '') {
  const name = (placeName || 'مكان').trim();
  
  const categoryColors = {
    'طبيب': { bg: '0284C7', text: 'FFFFFF' },
    'صيدلية': { bg: '059669', text: 'FFFFFF' },
    'محمصة': { bg: 'B45309', text: 'FFFFFF' },
    'مقلة': { bg: 'D97706', text: 'FFFFFF' },
    'مطعم': { bg: 'EA580C', text: 'FFFFFF' },
    'كافيه': { bg: '78350F', text: 'FFFFFF' },
    'سوبر ماركت': { bg: '4F46E5', text: 'FFFFFF' },
    'مخبز': { bg: 'D97706', text: 'FFFFFF' },
    'جيم': { bg: 'DC2626', text: 'FFFFFF' },
    'ملابس': { bg: '9333EA', text: 'FFFFFF' },
    'موبايل': { bg: '2563EB', text: 'FFFFFF' },
    'حلاق': { bg: '1E293B', text: 'F59E0B' },
    'كوافير': { bg: 'DB2777', text: 'FFFFFF' },
    'عقارات': { bg: '0F766E', text: 'FFFFFF' }
  };

  let palette = { bg: '1B4F72', text: 'FFFFFF' };
  for (const [key, val] of Object.entries(categoryColors)) {
    if (categoryName.includes(key) || name.includes(key)) {
      palette = val;
      break;
    }
  }

  const words = name.split(/\s+/).filter(Boolean);
  let initials = words.length >= 2 
    ? words[0].slice(0, 1) + ' ' + words[1].slice(0, 1)
    : name.slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${palette.bg}&color=${palette.text}&size=512&bold=true&font-size=0.42&rounded=false&format=svg`;
}

export const generatePlaceLogo = generateLogoImage;

/**
 * ─────────────────────────────────────────────────────────────
 * 6. SEMANTIC AI SEARCH
 * ─────────────────────────────────────────────────────────────
 */

export async function aiSearch(query) {
  if (!query || !query.trim()) return { results: [], suggestions: [] };
  try {
    const res = await fetch(`${WORKER_URL}/api/ai/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return { results: [], suggestions: [] };
}

export const aiSmartSearch = async (query, places = []) => {
  return await aiSearch(query);
};

export const getAiSuggestions = async (query) => {
  const res = await aiSearch(query);
  return res?.suggestions || [];
};



