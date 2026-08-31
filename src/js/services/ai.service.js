import { getCategoryTaxonomy, generateLocalSeoContent } from '../utils/specialized-taxonomy.js';
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
  'السيد': 'El-Sayed',
  'سيد': 'Sayed',
  'محمود السيد': 'Mahmoud El-Sayed',
  'طه': 'Taha',
  'يوسف': 'Youssef',
  'شمس': 'Shams',
  'نور': 'Nour',
  'حامد': 'Hamed',
  'فتحي': 'Fathy',
  'عطية': 'Attia',
  'رمضان': 'Ramadan',
  'شعبان': 'Shaaban',
  'شوقي': 'Shawky',
  'فاروق': 'Farouk',
  'السعدي': 'El-Saadi',
  'البدري': 'El-Badry',
  'الشناوي': 'El-Shenawy',
  'الدسوقي': 'El-Desouky',
  'الباز': 'El-Baz',
  'الحديدي': 'El-Hadidy',
  'غانم': 'Ghanem',
  'حجازي': 'Hegazy',
  'العرب': 'El-Arab',

  'الرحمة': 'El-Rahma',
  'رحمة': 'Rahma',
  'السلام': 'Al-Salam',
  'الصفا': 'Al-Safa',
  'المروة': 'Al-Marwa',
  'الفرقان': 'Al-Forqan',
  'التقوى': 'Al-Taqwa',
  'الفجر': 'Al-Fajr',
  'التوحيد': 'Al-Tawheed',
  'الإيمان': 'Al-Iman',
  'الايمان': 'Al-Iman',
  'البركة': 'Al-Baraka',
  'بركة': 'Baraka',
  'الوفاء': 'Al-Wafaa',
  'الإخلاص': 'Al-Ikhlas',
  'الاخلاص': 'Al-Ikhlas',
  'الريان': 'Al-Rayan',
  'الزهراء': 'Al-Zahraa',
  'الزهور': 'Al-Zohoor',
  'الياسمين': 'Al-Yasmeen',
  'طيبة': 'Tayba',
  'زمزم': 'Zamzam',
  'الأصيل': 'Al-Aseel',
  'الاصيل': 'Al-Aseel',
  'النجمة': 'Al-Negma',
  'الهلال': 'Al-Helal',
  'الماسة': 'Al-Massa',
  'جوهرة': 'Gawhara',
  'الجوهرة': 'Al-Gawhara',
  'العروبة': 'Al-Orouba',
  'النصر': 'Al-Nasr',
  'المنصورة': 'Mansoura',
  'المطرية': 'Matariya',
  'العصافرة': 'Asafra',
  'الجمالية': 'Gamaliya',
  'ميت سلسيل': 'Mit Salsil',
  'البصراط': 'Besrat',
  'العزيزة': 'Aziza',
  'الأحمدية': 'Ahmadiya',
  'الاحمدية': 'Ahmadiya',
  'الروضة': 'Rawda',
  'الحوتة': 'Houta',
  'النسايمة': 'Nasayma',
  'ميت خضير': 'Mit Khodeir',
  'ميت شريف': 'Mit Sherif',

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
  'المنزلية': 'Home',
  'منزلية': 'Home',
  'الحوائط': 'Wall',
  'حوائط': 'Wall',
  'محل': 'Store',
  'ورشة': 'Workshop',
  'صيدلية دكتور': 'Dr.',

  'علاج طبيعي': 'Physical Therapy',
  'العلاج الطبيعي': 'Physical Therapy',
  'تغذية علاجية': 'Clinical Nutrition',
  'التغذية العلاجية': 'Clinical Nutrition',
  'علاج طبيعي وتغذية علاجية': 'Physical Therapy & Clinical Nutrition',
  'تخسيس': 'Weight Loss & Fitness',
  'تأهيل': 'Rehabilitation',
  'تأهيل حركي': 'Physical Rehabilitation',
  'اطفال': 'Pediatrics',
  'أطفال': 'Pediatrics',
  'نساء وتوليد': 'Obstetrics & Gynecology',
  'باطنة': 'Internal Medicine',
  'عظام': 'Orthopedics',
  'جلدية': 'Dermatology',
  'اسنان': 'Dental Clinic',
  'أسنان': 'Dental Clinic',
  'عيون': 'Ophthalmology',
  'انف واذن': 'ENT Clinic',
  'أنف وأذن': 'ENT Clinic',
  'مخ واعصاب': 'Neurology',
  'مخ وأعصاب': 'Neurology',
  'قلب': 'Cardiology',
  'اورام': 'Oncology',
  'أورام': 'Oncology',
  'مسالك بولية': 'Urology',
  'جراحة': 'Surgery Clinic',
  'ذكاء اصطناعي': 'Artificial Intelligence',
  'برمجة': 'Software & Coding',
  'الوميتال': 'Alumital & Aluminum Works',
  'ألوميتال': 'Alumital & Aluminum Works',
  'بويات': 'Paints & Wall Finishes',
  'دهانات': 'Paints & Wall Decor',
  'سباكة': 'Plumbing Services & Supplies',
  'عطارة': 'Spices, Herbs & Natural Oils',
  'علف': 'Animal & Poultry Feeds',
  'دواجن': 'Fresh Poultry & Chicken',
  'مخبز': 'Bakery & Pastries',
  'حلواني': 'Pastry & Oriental Sweets',
  'خضار وفاكهة': 'Fresh Fruits & Vegetables',
  'انتيكات': 'Antiques & Collectibles',
  'أنتيكات': 'Antiques & Collectibles',
  'اجهزة كهربائية': 'Home Appliances',
  'أجهزة كهربائية': 'Home Appliances',
  'سجاد': 'Carpets & Rugs',
  'مراتب ومخدات': 'Mattresses & Bedding',
  'صيني': 'Kitchenware & Dinnerware',
  'ادوات منزلية': 'Housewares & Kitchenware',
  'أدوات منزلية': 'Housewares & Kitchenware',
  'كهرباء وإنارة': 'Electrical & Lighting Supplies',
  'مكسرات': 'Premium Nuts & Roastery',
  'صيانة هواتف': 'Mobile Repair & Accessories',
  'توصيل ودليفري': 'Delivery & Logistics',
  'احذية': 'Footwear & Shoes',
  'أحذية': 'Footwear & Shoes',
  'حفر ليزر': 'Laser Engraving & Cutting',
  'زجاج': 'Glass & Mirrors',
  'صيانة موتوسيكلات': 'Motorcycle Repair & Parts',
  'صيانة سيارات': 'Auto Repair & Mechanics',
  'حلاقة': 'Barbershop & Grooming',
  'كوافير': 'Ladies Beauty Salon',
  'فساتين زفاف': 'Bridal & Evening Dresses Atelier',
  'لعب اطفال': 'Toys & Games Store',
  'لعب أطفال': 'Toys & Games Store',
  'اوراق حكومية': 'Government Documents Services',
  'أوراق حكومية': 'Government Documents Services',
  'تفريخ دواجن': 'Poultry Hatchery',
  'صيانة تكييف': 'AC & HVAC Maintenance',
  'خدمات كاش': 'Cash & Electronic Payments',
  'رخام وجرانيت': 'Marble & Granite Works',
  'جبس بورد': 'Gypsum Board & Interior Decor',
  'حدادة': 'Blacksmith & Metal Works',
  'نظارات': 'Optics & Eyewear',
  'مفاتيح': 'Keys Duplication & Programming',
  'استوديو': 'Photography & Wedding Studio',
  'قاعة افراح': 'Weddings & Events Hall',
  'قاعة أفراح': 'Weddings & Events Hall',
  'صيانة احذية': 'Shoes & Bags Repair',
  'صيانة أحذية': 'Shoes & Bags Repair',
  'كمبيوتر ولاب توب': 'Computers & Laptops',
  'فندق': 'Hotel & Lodging',
  'كورسات': 'Training & Educational Courses',
  'محاماة': 'Law Firm & Legal Services',
  'محاسبة': 'Accounting & Tax Advisory',
  'ملابس': 'Fashion & Clothing Store',
  'عصائر': 'Fresh Juices Bar',
  'تورتة': 'Cakes & Pastries',
  'مستلزمات سبوع': 'Party & Baby Shower Supplies',
  'منظفات': 'Detergents & Cleaning Supplies',
  'بلاستيك': 'Plastic & Paper Disposables',
  'نجارة': 'Carpentry & Furniture Workshop',
  'اثاث': 'Furniture & Modern Living',
  'أثاث': 'Furniture & Modern Living',
  'ادوات صحية': 'Sanitary Ware & Plumbing Fixtures',
  'أدوات صحية': 'Sanitary Ware & Plumbing Fixtures',
  'اسماك': 'Fresh Seafood & Fish Market',
  'أسماك': 'Fresh Seafood & Fish Market',
  'فسيخ ورنجة': 'Salted & Smoked Fish (Feseekh)',
  'معاهد وكليات': 'Higher Education & Institutes',
  'طباخة افراح': 'Wedding & Event Catering Chef',
  'طباخة أفراح': 'Wedding & Event Catering Chef',
  'اكاديمية كورة': 'Football Academy & Training',
  'أكاديمية كورة': 'Football Academy & Training',
  'تايكوندو وكاراتيه': 'Martial Arts & Karate Academy',
  'مدرس': 'Private Teacher & Tutor',
  'تدريس مواد': 'Academic Tutoring Center',
  'صراف الي': 'ATM Banking Machine',
  'صراف آلي': 'ATM Banking Machine',

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
/**
 * Translates Arabic business name to natural, idiomatic, high-end American English (US English)
 */
export async function translatePlaceName(arabicName, category = '') {
  if (!arabicName || typeof arabicName !== 'string') return '';
  const cleanArabic = arabicName.trim();

  // 1. Try OpenRouter AI First for natural branding
  try {
    const prompt = `You are an expert professional translator specializing in natural American English (US English) business nomenclature and Egyptian brand names.

TASK: Translate the following Arabic business / commercial place name into a polished, natural, grammatically correct American English (US English) name.

RULES:
1. Use natural US English business naming conventions:
   - "مركز الرحمة للعلاج الطبيعي والتغذية العلاجية" -> "El-Rahma Physical Therapy & Clinical Nutrition Center"
   - "صيدلية دكتور محمود السيد" -> "Dr. Mahmoud El-Sayed Pharmacy"
   - "معرض الأجهزة الكهربائية الحديثة" -> "Modern Home Appliances Showroom"
   - "ورشة الألوميتال والزجاج السيكوريت" -> "Alumital & Securit Glass Workshop"
   - "محل بويات ودهانات الحوائط" -> "Paints & Wall Finishes Store"
   - "محمصة البحر للبن والمكسرات" -> "El-Bahr Roastery, Coffee & Premium Nuts"
2. KEEP Egyptian proper and family names transliterated exactly as commonly spelled in Egypt (e.g. Mahmoud, Mohamed, Ahmed, El-Rahma, El-Basha, El-Sayed, Al-Amal, Al-Salam).
3. Accurately translate medical, technical, commercial, craftsmanship, and trade specialties into standard US English terms.
4. Return ONLY the final English name. No extra punctuation, no quotes, no Arabic text.

Arabic Business Name: ${cleanArabic}
Category: ${category || 'Business'}`;

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

  // 2. Deterministic Intelligent Synthesis Fallback
  function stripPrefix(w) {
    if (!w) return '';
    let res = w;
    if (res.startsWith('وال')) res = res.slice(3);
    else if (res.startsWith('لل')) res = res.slice(2);
    else if (res.startsWith('ال')) res = res.slice(2);
    else if (res.startsWith('ل') && res.length > 2) res = res.slice(1);
    else if (res.startsWith('و') && res.length > 2) res = res.slice(1);
    return res;
  }

  const words = cleanArabic.split(/\s+/).filter(Boolean);
  let englishParts = [];
  let businessHead = '';

  // Check if first word is a common business head (مركز, صيدلية, معمل, عيادة, معرض, ورشة, محل)
  const firstWordClean = stripPrefix(words[0]);
  if (['مركز', 'معرض', 'ورشة', 'محل', 'شركة', 'مؤسسة'].includes(words[0]) || ['مركز', 'معرض', 'ورشة', 'محل', 'شركة', 'مؤسسة'].includes(firstWordClean)) {
    businessHead = BIZ_TERMS_MAP[words[0]] || BIZ_TERMS_MAP[firstWordClean] || 'Center';
    words.shift();
  }

  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i];
    const isAnd = rawWord.startsWith('و') || rawWord.startsWith('وال');
    const cleanW1 = stripPrefix(rawWord);
    const cleanW2 = stripPrefix(words[i+1] || '');
    const cleanW3 = stripPrefix(words[i+2] || '');

    const threeWordsClean = `${cleanW1} ${cleanW2} ${cleanW3}`.trim();
    const twoWordsClean = `${cleanW1} ${cleanW2}`.trim();

    if (BIZ_TERMS_MAP[threeWordsClean]) {
      if (isAnd && englishParts.length > 0 && englishParts[englishParts.length - 1] !== '&') englishParts.push('&');
      englishParts.push(BIZ_TERMS_MAP[threeWordsClean]);
      i += 2;
    } else if (BIZ_TERMS_MAP[twoWordsClean]) {
      if (isAnd && englishParts.length > 0 && englishParts[englishParts.length - 1] !== '&') englishParts.push('&');
      englishParts.push(BIZ_TERMS_MAP[twoWordsClean]);
      i += 1;
    } else if (BIZ_TERMS_MAP[cleanW1]) {
      if (isAnd && englishParts.length > 0 && englishParts[englishParts.length - 1] !== '&') englishParts.push('&');
      englishParts.push(BIZ_TERMS_MAP[cleanW1]);
    } else if (EGYPTIAN_NAME_TRANSLITERATION[rawWord]) {
      englishParts.push(EGYPTIAN_NAME_TRANSLITERATION[rawWord]);
    } else if (EGYPTIAN_NAME_TRANSLITERATION[cleanW1]) {
      englishParts.push(EGYPTIAN_NAME_TRANSLITERATION[cleanW1]);
    } else {
      const trans = transliterateToEnglishName(cleanW1 || rawWord);
      if (trans) {
        if (isAnd && englishParts.length > 0 && englishParts[englishParts.length - 1] !== '&') englishParts.push('&');
        englishParts.push(trans);
      }
    }
  }

  if (businessHead) {
    englishParts.push(businessHead);
  }

  if (englishParts.length > 0) {
    return englishParts.join(' ');
  }

  return transliterateToEnglishName(cleanArabic) || generateSlug(cleanArabic) || 'Premier Business';
}

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
export async function generateSeoDescription(arg1, arg2, arg3, arg4, arg5) {
  // Support both object and positional argument signatures
  let placeName = '';
  let categoryName = '';
  let area = 'المنزلة';
  let address = '';
  let customServices = [];

  if (typeof arg1 === 'object' && arg1 !== null) {
    placeName = arg1.placeName || '';
    categoryName = arg1.categoryName || '';
    area = arg1.area || 'المنزلة';
    address = arg1.address || '';
    customServices = Array.isArray(arg1.customKeywords) ? arg1.customKeywords : (arg1.customServices || []);
  } else {
    placeName = arg1 || '';
    categoryName = arg2 || '';
    area = arg3 || 'المنزلة';
    address = arg4 || '';
    customServices = Array.isArray(arg5) ? arg5 : [];
  }

  // Use our specialized 74-category local taxonomy engine with exact formula
  const localTaxonomyData = generateLocalSeoContent({
    placeName,
    categoryName,
    area,
    address,
    customKeywords: customServices
  });

  // Try OpenRouter AI for additional unique phrasing following user's exact formula
  try {
    const prompt = `أنت خبير سيو محلي وتسويق تجاري في مصر (دليل المنزلة والمطرية بمحافظة الدقهلية).
اكتب وصفاً تسويقياً فريداً واحترافياً لنشاط تجاري باتباع هذه الصيغة المحددة بدقة:

الصيغة المطلوبة:
الجملة الأولى: (${placeName}) في (${address ? `${address} - ${area}` : area}) هو (${categoryName}) ومتخصص في توفير (${localTaxonomyData.keywords.slice(0, 6).join('، ')})
الجملة الثانية: عبارة تسويقية فريدة وجذابة توضح مميزات هذا النشاط للزبائن في المنزلة والمطرية بأسلوب مقنع وراقي دون استخدام كلمات مكررة أو كلمة "يقدم/تقدم".

أعد النص النهائي المكون من سطرين إلى ثلاثة فقط بدون أي مقدمات أو علامات تنصيص.`;

    const aiRes = await callOpenRouterWithFallback(prompt);
    if (aiRes && aiRes.length > 40) {
      let cleaned = aiRes.replace(/["'`«»]/g, '').trim();
      cleaned = cleaned.replace(/^(الوصف|Description|النص):\s*/i, '').trim();
      if (!/[a-zA-Z]{5,}/.test(cleaned)) {
        return cleaned;
      }
    }
  } catch (_) {}

  return localTaxonomyData.description;
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

export async function generateCoverImage(placeName = '', categoryName = '', area = 'المنزلة') {
  const queryMap = {
    'طبيب': 'modern medical clinic doctor',
    'صيدلية': 'pharmacy store interior medicine',
    'مطعم': 'restaurant food gourmet delicious',
    'كافيه': 'cafe coffee shop modern',
    'سوبر ماركت': 'supermarket grocery store products',
    'مخبز': 'bakery fresh bread pastry',
    'ميكانيكي': 'auto repair garage mechanic',
    'سباك': 'plumbing modern tools bathroom',
    'كهربائي': 'electrical professional tools lighting',
    'نجار': 'carpenter workshop wood furniture',
    'مدرسة': 'school classroom education',
    'جيم': 'gym fitness workout center',
    'فندق': 'hotel luxury room lobby',
    'حلاق': 'barbershop modern hair salon',
    'خياط': 'tailor atelier fashion design',
    'كوافير': 'beauty salon makeup hair',
    'علاج طبيعي': 'physical therapy rehabilitation clinic',
    'اسماك': 'fresh fish seafood market'
  };

  let query = 'egypt modern business';
  for (const [key, val] of Object.entries(queryMap)) {
    if (categoryName.includes(key) || placeName.includes(key)) {
      query = val;
      break;
    }
  }

  const seed = encodeURIComponent((placeName + categoryName).slice(0, 20));
  return `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&h=500&q=80&sig=${seed}`;
}

export function generateSeoServices(categoryName = '') {
  const taxonomy = getCategoryTaxonomy(categoryName);
  return taxonomy?.keywords || [];
}
