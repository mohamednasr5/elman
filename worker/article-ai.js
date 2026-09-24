const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openrouter/free'
];

export function toConciseEnglishSlug(textHint, defaultName = 'place') {
  const raw = String(textHint || defaultName || 'article').trim().toLowerCase();

  // If already clean latin slug (3-5 words)
  if (/^[a-z0-9\s-]+$/.test(raw)) {
    const s = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const parts = s.split('-').filter(Boolean).slice(0, 5);
    if (parts.length >= 2) return parts.join('-');
  }

  // Common local translation dictionary for Egyptian cities & businesses
  const dict = {
    'الحسن': 'al-hassan', 'حسن': 'hassan', 'محمد': 'mohamed', 'احمد': 'ahmed', 'محمود': 'mahmoud', 'علي': 'ali',
    'المنزلة': 'elmanzala', 'المطرية': 'elmatareya', 'الاحمدية': 'al-ahmadiya', 'الدقهلية': 'dakahlia',
    'صيانة': 'repair', 'هواتف': 'phones', 'موبايل': 'mobile', 'محمول': 'mobile', 'اجهزة': 'devices',
    'بيع': 'sales', 'شراء': 'buy', 'اكسسوارات': 'accessories', 'عروض': 'offers', 'تخفيضات': 'deals',
    'مطعم': 'restaurant', 'كافيه': 'cafe', 'قهوة': 'coffee', 'مشويات': 'grill', 'اسماك': 'fish',
    'جمبري': 'shrimp', 'صيدلية': 'pharmacy', 'دكتور': 'doctor', 'عيادة': 'clinic', 'طبيب': 'doctor',
    'سوبر': 'super', 'ماركت': 'market', 'هايبر': 'hyper', 'بقالة': 'grocery', 'خضار': 'vegetables',
    'لحوم': 'meat', 'جزارة': 'butcher', 'دواجن': 'poultry', 'فراخ': 'chicken', 'مخبز': 'bakery',
    'حلويات': 'sweets', 'عطور': 'perfumes', 'ملابس': 'clothes', 'احذية': 'shoes', 'شنط': 'bags',
    'مغسلة': 'laundry', 'سيارات': 'cars', 'قطع': 'parts', 'غيار': 'spare-parts', 'ورشة': 'workshop',
    'سباك': 'plumber', 'كهربائي': 'electrician', 'نجار': 'carpenter', 'نقاش': 'painter',
    'خدمات': 'services', 'توصيل': 'delivery', 'دليفري': 'delivery', 'دليل': 'guide', 'متجر': 'store',
    'سنتر': 'center', 'مستشفى': 'hospital', 'معمل': 'lab', 'تحاليل': 'labs', 'اشعة': 'xray'
  };

  const words = raw
    .normalize('NFKD')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const translated = [];
  for (const w of words) {
    if (dict[w]) {
      translated.push(dict[w]);
    } else if (/^[a-z0-9]+$/i.test(w)) {
      translated.push(w.toLowerCase());
    }
    if (translated.length >= 5) break;
  }

  let finalSlug = translated.join('-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (!finalSlug || finalSlug.length < 3) {
    const arToEn = {
      'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h', 'خ': 'kh',
      'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
      'ي': 'y', 'ى': 'a', 'ة': 'a', 'ء': '', 'ئ': 'e', 'ؤ': 'o'
    };
    finalSlug = raw.split('').map(c => arToEn[c] || (/[a-z0-9]/.test(c) ? c : '')).join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }

  return (finalSlug || 'place-article').slice(0, 38).replace(/-+$/, '');
}

export function toArabicCategory(raw) {
  if (!raw) return 'خدمات ومنتجات متميزة';
  const trimmed = String(raw).trim();
  if (!trimmed) return 'خدمات ومنتجات متميزة';

  // If already purely Arabic (or Arabic with punctuation/numbers)
  if (/^[\u0600-\u06FF\s0-9،.\-&/]+$/.test(trimmed)) {
    return trimmed;
  }

  const normalizedKey = trimmed.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const slugKey = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const MAP = {
    'home furnishings and bed sets': 'مفروشات ومستلزمات السرير والمنزل',
    'home-furnishings-and-bed-sets': 'مفروشات ومستلزمات السرير والمنزل',
    'home furnishings': 'مفروشات وأثاث منزلي',
    'bed sets': 'مفروشات وأطقم سراير',
    'furniture showroom': 'معارض أثاث وموبيليا',
    'furniture-showroom': 'معارض أثاث وموبيليا',
    'furniture': 'أثاث وموبيليا',
    'sweets supplies': 'مستلزمات حلويات ومخابز',
    'sweets-supplies': 'مستلزمات حلويات ومخابز',
    'medical analysis laboratory': 'معامل تحاليل طبية',
    'medical-analysis-laboratory': 'معامل تحاليل طبية',
    'medical analysis': 'تحاليل طبية',
    'electronics': 'أجهزة كهربائية وإلكترونيات',
    'restaurant': 'مطاعم ومأكولات',
    'restaurants': 'مطاعم ومأكولات',
    'cafe': 'كافيهات ومقاهي',
    'cafes': 'كافيهات ومقاهي',
    'coffee': 'كافيهات ومقاهي',
    'pharmacy': 'صيدليات وأدوية',
    'pharmacies': 'صيدليات وأدوية',
    'supermarket': 'سوبر ماركت وبقالة',
    'supermarkets': 'سوبر ماركت وبقالة',
    'grocery': 'بقالة ومواد غذائية',
    'mobile shop': 'محلات ومراكز هواتف ومحمول',
    'mobile-shop': 'محلات ومراكز هواتف ومحمول',
    'mobile repair': 'صيانة هواتف ومحمول',
    'mobile-repair': 'صيانة هواتف ومحمول',
    'mobile': 'هواتف ومحمول',
    'phones': 'هواتف ومحمول',
    'devices': 'أجهزة ذكية وإلكترونيات',
    'clothing': 'ملابس وأزياء',
    'clothes': 'ملابس وأزياء',
    'fashion': 'أزياء وملابس',
    'shoes': 'أحذية ومصنوعات جلدية',
    'bags': 'شنط وحقائب',
    'perfumes': 'عطور ومستحضرات تجميل',
    'cosmetics': 'مستحضرات تجميل وعناية',
    'beauty salon': 'صالونات تجميل وعناية',
    'barbershop': 'صالونات حلاقة ورجالي',
    'clinic': 'عيادات ومراكز طبية',
    'clinics': 'عيادات ومراكز طبية',
    'doctor': 'أطباء وعيادات',
    'hospital': 'مستشفيات ومراكز طبية',
    'dentist': 'عيادات طب وجراحة الأسنان',
    'gym': 'صالات ألعاب رياضية وجيم',
    'fitness': 'لياقة بدنية وجيم',
    'bakery': 'مخابز وحلويات',
    'butcher': 'جزارة ولحوم طازجة',
    'meat': 'لحوم ومصنعاتها',
    'fish': 'أسماك ومأكولات بحرية',
    'poultry': 'دواجن وطيور',
    'vegetables': 'خضروات وفواكه',
    'cars': 'خدمات وصيانة سيارات',
    'car repair': 'صيانة وورش سيارات',
    'spare parts': 'قطع غيار سيارات',
    'accessories': 'إكسسوارات وكماليات',
    'plumber': 'خدمات سباكة وصحي',
    'electrician': 'خدمات كهرباء',
    'carpenter': 'نجارة وموبيليا',
    'painter': 'دهانات وتشطيبات',
    'workshop': 'ورش صناعية وفنية',
    'services': 'خدمات متخصصة',
    'delivery': 'خدمات شحن وتوصيل',
    'store': 'متاجر ومحلات تجارية',
    'optics': 'بصريات ونظارات',
    'jewelry': 'ذهب ومجوهرات وإكسسوارات',
    'gifts': 'هدايا وألعاب',
    'stationery': 'مكتبات وأدوات مدرسية',
    'laundry': 'مغاسل وتنظيف دراي كلين'
  };

  if (MAP[normalizedKey]) return MAP[normalizedKey];
  if (MAP[slugKey]) return MAP[slugKey];

  const wordsDict = {
    'home': 'منزل',
    'furnishings': 'مفروشات',
    'bed': 'سرير',
    'sets': 'أطقم ومستلزمات',
    'linen': 'مفروشات',
    'linens': 'مفروشات',
    'bedding': 'مفارش وسراير',
    'furniture': 'أثاث وموبيليا',
    'showroom': 'معرض',
    'store': 'متجر',
    'shop': 'محل',
    'center': 'سنتر',
    'market': 'ماركت',
    'supermarket': 'سوبر ماركت',
    'hyper': 'هايبر',
    'grocery': 'بقالة',
    'pharmacy': 'صيدلية',
    'doctor': 'طبيب',
    'clinic': 'عيادة',
    'hospital': 'مستشفى',
    'lab': 'معمل',
    'laboratory': 'معمل تحاليل',
    'analysis': 'تحاليل',
    'medical': 'طبي',
    'dental': 'أسنان',
    'dentist': 'طبيب أسنان',
    'repair': 'صيانة',
    'service': 'خدمة',
    'services': 'خدمات',
    'phone': 'هاتف',
    'phones': 'هواتف',
    'mobile': 'موبايل',
    'electronics': 'إلكترونيات وأجهزة',
    'devices': 'أجهزة',
    'clothes': 'ملابس',
    'clothing': 'ملابس',
    'fashion': 'أزياء',
    'shoes': 'أحذية',
    'bags': 'شنط',
    'perfumes': 'عطور',
    'cosmetics': 'تجميل',
    'sweets': 'حلويات',
    'supplies': 'مستلزمات',
    'bakery': 'مخبز',
    'meat': 'لحوم',
    'butcher': 'جزارة',
    'fish': 'أسماك',
    'chicken': 'دواجن',
    'car': 'سيارة',
    'cars': 'سيارات',
    'parts': 'قطع غيار',
    'accessories': 'إكسسوارات',
    'plumber': 'سباكة',
    'electrician': 'كهرباء',
    'carpenter': 'نجارة'
  };

  const tokens = normalizedKey.split(' ');
  const translated = tokens.map(t => wordsDict[t] || '').filter(Boolean);
  if (translated.length > 0) return translated.join(' ');

  return 'خدمات ومنتجات متميزة';
}

export function sanitizeArticleArabic(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  const replacements = [
    [/home[\s_-]*furnishings[\s_-]*and[\s_-]*bed[\s_-]*sets/gi, 'مفروشات ومستلزمات السرير والمنزل'],
    [/home[\s_-]*furnishings/gi, 'مفروشات وأثاث منزلي'],
    [/bed[\s_-]*sets/gi, 'أطقم ومفارش سراير'],
    [/furniture[\s_-]*showroom/gi, 'معارض أثاث وموبيليا'],
    [/sweets[\s_-]*supplies/gi, 'مستلزمات حلويات ومخابز'],
    [/medical[\s_-]*analysis[\s_-]*laboratory/gi, 'معامل تحاليل طبية'],
    [/medical[\s_-]*analysis/gi, 'تحاليل طبية'],
    [/mobile[\s_-]*repair/gi, 'صيانة الهواتف والمحمول'],
    [/mobile[\s_-]*shop/gi, 'محلات الهواتف والمحمول'],
    [/supermarket/gi, 'سوبر ماركت'],
    [/hypermarket/gi, 'هايبر ماركت'],
    [/restaurant/gi, 'مطاعم ومأكولات'],
    [/pharmacy/gi, 'صيدلية']
  ];
  for (const [re, rep] of replacements) {
    out = out.replace(re, rep);
  }
  return out;
}

function parseJson(value) {
  const clean = String(value || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try { return JSON.parse(clean); } catch (_) {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) {}
  }
  return null;
}

function buildSystemPrompt() {
  return `أنت كاتب مقالات وخبير سيو ومحركات بحث وذكاء اصطناعي (SEO & AI Search GEO)، تكتب مقالات مهنية تثقيفية وتسويقية راقية لأصحاب الأنشطة التجارية في محافظة الدقهلية (المنزلة والمطرية وما حولهما).

قواعد الصياغة الإلزامية ومعايير الجودة الـ 14:
1. الطول المستهدف: مقال متكامل من حوالي 550 كلمة (بين 520 و 580 كلمة) غني بالمعلومات الحقيقية بدون أي حشو أو كلام مكرر.
2. الكلمة المفتاحية الرئيسية: حدد كلمة مفتاحية رئيسية واحدة مستهدفة بدقة واستخدمها طبيعياً في (العنوان، المقدمة، أحد العناوين الفرعية، موجز الميتا، ورابط slug) وتجنب التكرار المصطنع نهائياً.
3. عنوان المقال: واضح، محدد، يصف المحتوى بدقة، جذاب دون تضليل، ويتضمن الكلمة المفتاحية (مثال: أفضل خدمات صيانة الهواتف في المنزلة 2026: دليل شامل بالأسعار والمميزات).
4. المقدمة: تبدأ مباشرة بالإجابة السريعة عن أسئلة القارئ الثلاثة: ما هو الموضوع؟ لماذا يهمه ويفيده؟ وماذا سيجد بالتفصيل داخل هذا الدليل؟ بدون أي مقدمات إنشائية طويلة.
5. تنظيم وهيكل المقال:
   - مقدمة قوية ومباشرة (تعتبر prose-lead).
   - عنوان رئيسي ## (H2) يشرح الموضوع وأهميته للعميل في المنطقة.
   - عنوان رئيسي ## (H2) يقدم أهم المعلومات مع عناوين فرعية ### (H3) للنقاط المهمة.
   - عنوان رئيسي ## (H2) مخصص لـ "الأسئلة الشائعة" وإجاباتها النموذجية السريعة والعملية.
   - عنوان رئيسي ## (H2) مخصص لـ "الخلاصة" وإرشادات التواصل وطلب الخدمة أو الزيارة.
6. تجنب الكليشيهات تماماً ❌: ممنوع منعاً باتاً استخدام عبارات الذكاء الاصطناعي الركيكة (ممنوع: "في عالمنا المعاصر"، "مما لا شك فيه"، "تعتبر من أهم"، "في ختام هذا المقال"، "يسرنا أن نقدم"، "دعونا نستكشف").
7. لغة عربية فصحى نقية 100% وخالية تماماً من الكلمات الإنجليزية ❌:
   - ممنوع منعاً باتاً كتابة أي تصنيفات أو كلمات أو مصطلحات باللغة الإنجليزية في أي جزء من المقال العربي (مثال خطأ فادح: لا تكتب أبداً "home furnishings and bed sets" بل اكتب دائماً "مفروشات ومستلزمات السرير والمنزل"، ولا تكتب "restaurant" بل "مطاعم ومأكولات"، ولا تكتب أي slug إنجليزي في النص العربي إطلاقاً).
   - النص العربي بالكامل من العنوان والمقدمة والعناوين الفرعية وحتى الخاتمة يجب أن يكون باللغة العربية الفصحى السليمة فقط. الحقل الوحيد الذي يجب أن يكون بالإنجليزية هو حقل "slug" فقط داخل كائن JSON.
8. القيمة المحلية العالية: ربط المقال ببيئة المنزلة والمطرية والقرى المجاورة بدقة، وبثقة وأمانة تعكس حرص صاحب العمل على خدمة مجتمعه.
9. الرابط المختصر (slug): إنجليزي حصراً من 3 إلى 5 كلمات بحروف صغيرة وشرطات فقط (مثل: al-hassan-phone-repair-guide). ممنوع وضع أي حروف عربية في حقل slug.

المخرجات حصراً بصيغة JSON نظيفة بدون أي وسوم خارجية:
{
  "title": "عنوان المقال الدقيق والجذاب المتضمن الكلمة المفتاحية باللغة العربية حصراً",
  "slug": "concise-english-slug-only-3-to-5-words",
  "excerpt": "موجز ميتا مركز وجذاب يصف المقال في سطرين (حوالي 140-160 حرف) باللغة العربية حصراً",
  "content": "نص المقال المتكامل من حوالي 550 كلمة مقسم بالعناوين ## و ### والأسئلة الشائعة والخلاصة باللغة العربية حصراً بدون أي كلمة إنجليزية",
  "keywords": ["الكلمة الرئيسية", "كلمة مرتبطة 1", "كلمة 2", "كلمة 3", "المنزلة", "دليل المنزلة"]
}`;
}

function buildUserPrompt(topic, title, facts) {
  const cleanCat = toArabicCategory(facts.category);
  const parts = [
    `موضوع المقال المطلوب من صاحب المكان: «${topic}»`,
    title ? `العنوان المقترح مبدئياً: «${title}»` : '',
    `بيانات المكان الحقيقية الموثقة:`,
    `- اسم المكان: ${facts.name || 'النشاط التجاري'}`,
    facts.area ? `- المنطقة والمدينة: ${facts.area}` : '- المنطقة: المنزلة والمطرية',
    facts.address ? `- العنوان التفصيلي: ${facts.address}` : '',
    cleanCat ? `- التصنيف والنشاط التجاري: ${cleanCat}` : '',
    facts.description ? `- نبذة عن المكان: ${facts.description}` : '',
    Array.isArray(facts.services) && facts.services.length ? `- أبرز الخدمات: ${facts.services.slice(0, 10).join('، ')}` : '',
    `المطلوب: توليد مقال بشري ثري من حوالي 550 كلمة يلتزم بالمعايير الـ 14 للسيو المنظم بصيغة JSON المحددة فقط. تذكير حاسم: اكتب كل الكلمات والتصنيفات باللغة العربية الفصحى حصراً، وممنوع إدراج أي كلمات إنجليزية مثل أسماء التصنيفات داخل النص العربي نهائياً.`
  ];
  return parts.filter(Boolean).join('\n');
}

async function callOpenRouter(key, prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://dalilmanzala.com',
      'X-Title': 'Dalil Manzala Place Articles'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODELS[0],
      models: OPENROUTER_MODELS,
      temperature: 0.6,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(22000)
  });
  if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json'
      }
    }),
    signal: AbortSignal.timeout(22000)
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function synthesizeSmartArticle(topic, title, facts) {
  const name = facts.name || 'المكان';
  const area = facts.area || 'المنزلة والمطرية';
  const cat = toArabicCategory(facts.category);
  const addr = facts.address ? `في ${facts.address}` : `بمدينة ${area}`;

  const englishSlug = toConciseEnglishSlug(`${name} ${topic} ${area}`, 'place-article');
  const finalTitle = sanitizeArticleArabic(title || `دليل ${topic} في ${area} مع ${name}: الجودة والأسعار والتفاصيل الكاملة`);

  const lead = `إذا كنت تبحث عن خدمة ${cat} موثوقة ومضمونة في ${area} وما جاورها، فإن معرفة المعايير الحقيقية للاختيار هي خطوتك الأولى لتوفير وقتك ومالك. في هذا الدليل العملي، نستعرض معكم كل ما يخص ${topic}، بدءاً من تفاصيل الجودة والأسعار العادلة، وصولاً إلى النصائح الفنية التي تضمن لك راحة البال، وكيف يقدم ${name} الكائن ${addr} حلولاً نموذجية متكاملة مصممة خصيصاً لتلبية احتياجات أهالينا الكرام.`;

  const h2_1 = `## ما الذي يجعل خدمات ${cat} في ${name} خيارك الأنسب في ${area}؟`;
  const p1 = `اختيار مقدم الخدمة أو المتجر ليس مجرد عملية شراء عابرة، بل هو قرار يرتبط بالثقة والأمانة وضمان استمرارية الجودة. يحرص ${name} على ترسيخ سمعة طيبة اكتسبها من خلال العمل المتواصل والاهتمام بأدق التفاصيل الفنية ورضا كل عميل. نعتمد في عملنا على أحدث المعدات وأفضل الخامات وقطع الغيار المعتمدة لضمان تحقيق أعلى كفاءة ممكنة، مع الالتزام التام بالشفافية في تحديد التكلفة وتقديم فحص دقيق وشامل قبل البدء في أي عمل، مما يجنبك أي تكاليف مفاجئة أو غير مبررة.`;

  const h2_2 = `## أهم المعلومات والحلول المتكاملة التي نوفرها لعملائنا`;
  const p2 = `لأن متطلبات العملاء تتنوع وتتطور باستمرار، فقد حرصنا في ${name} على توفير باقة شاملة من الخدمات المتخصصة التي تغطي كافة جوانب ${topic} تحت سقف واحد:`;
  const h3_1 = `### معايير الجودة العالية والاعتماد على القطع والخامات الأصلية`;
  const p3 = `لا نساوم أبداً على جودة المواد وقطع الغيار المستخدمة، حيث نحرص على انتقاء المنتجات المطابقة للمواصفات القياسية والتي تمنحك عمراً افتراضياً طويلاً وأداءً مستقراً. يتيح لك ذلك الاطمئنان التام على استثمارك والتأكد من أن الخدمة المقدمة ستدوم طويلاً دون الحاجة إلى تكرار الزيارات أو الصيانة.`;
  const h3_2 = `### أسعار عادلة ومدروسة تراعي أهالي المنطقة والقرى المجاورة`;
  const p4 = `ندرك جيداً أهمية الموازنة بين الجودة الفائقة والتكلفة المناسبة، ولذلك نحرص على تقديم عروض موسمية وخطط أسعار تنافسية تراعي ميزانيات مختلف الأسر والشباب في ${area}، مع وضوح كامل في بيان الأسعار وفترات الضمان والسياسات المتبعة لخدمة ما بعد البيع.`;

  const h2_3 = `## الأسئلة الشائعة حول ${topic} وإجاباتها المباشرة`;
  const p5 = `- **س: ما هي ساعات العمل ومواعيد الاستقبال؟**\nنستقبلكم يومياً على مدار الأسبوع في أوقات العمل المحددة، كما نوفر قنوات تواصل سريعة عبر الهاتف وتطبيق واتساب للرد على كافة الاستفسارات الطارئة ومتابعة الطلبات.\n\n- **س: هل تتوفر فترات ضمان على المنتجات والخدمات؟**\nنعم بكل تأكيد، نمنح عملاءنا ضماناً موثوقاً وشاملاً يغطي أعمال الصيانة والمنتجات المباعة لضمان حقوق العميل ومنحه أقصى درجات الثقة.\n\n- **س: هل يمكن الاستفسار عن التكلفة التقديرية مسبقاً؟**\nيسعدنا دائماً تلقي اتصالاتكم ورسائلكم لتوضيح التكلفة التقريبية بناءً على الشرح الأولي للحالة، قبل زيارة المحل لإجراء الفحص النهائي الدقيق.`;

  const h2_4 = `## الخلاصة ودعوة لزيارتنا والتواصل المباشر`;
  const p6 = `إن الاستثمار في الجودة والتعامل مع أهل الخبرة والأمانة هو دائماً القرار الأذكى. نرحب بكم دائماً في ${name} ${addr} لتجربة خدماتنا المتطورة في مجال ${cat}. لا تترددوا في زيارتنا أو التواصل معنا فوراً عبر الاتصال الهاتفي أو رسائل الواتساب للاستفادة من أحدث العروض والخصومات المتاحة حالياً لأهل المنزلة والمطرية.`;

  const rawContent = `${lead}\n\n${h2_1}\n\n${p1}\n\n${h2_2}\n\n${p2}\n\n${h3_1}\n\n${p3}\n\n${h3_2}\n\n${p4}\n\n${h2_3}\n\n${p5}\n\n${h2_4}\n\n${p6}`;
  const content = sanitizeArticleArabic(rawContent);
  const words = content.trim().split(/\s+/).length;

  return {
    title: finalTitle,
    slug: englishSlug,
    excerpt: sanitizeArticleArabic(`دليل شامل ومفصل عن ${topic} في ${area} مع ${name} ${addr}. جودة معتمدة، أسعار عادلة، وأمانة تامة تضمن لك أفضل النتائج.`),
    content,
    keywords: [name, area, cat, topic, 'عروض المنزلة', 'دليل المنزلة'].map(k => sanitizeArticleArabic(k)).filter(Boolean),
    aiGenerated: true,
    wordsCount: words,
    characterCount: content.length
  };
}

export async function generateArticleDraft({ env, topic, title = '', facts = {} }) {
  const userPrompt = buildUserPrompt(topic, title, facts);

  // 1. Try OpenRouter API keys
  const openRouterKeys = [
    env?.OPENROUTER_API_KEY,
    env?.OPENROUTER_API_KEY_2,
    env?.OPENROUTER_API_KEY_3,
    env?.OPENROUTER_API_KEY_4
  ].filter(v => typeof v === 'string' && v.trim()).map(v => v.trim());

  for (const key of openRouterKeys) {
    try {
      const raw = await callOpenRouter(key, userPrompt);
      const parsed = parseJson(raw);
      if (parsed && parsed.content) {
        const rawContent = String(parsed.content).trim();
        const content = sanitizeArticleArabic(rawContent);
        const words = content.split(/\s+/).length;
        if (words >= 250) {
          const rawSlug = String(parsed.slug || '').trim();
          const cleanSlug = /^[a-z0-9-]+$/.test(rawSlug) && rawSlug.length >= 4 && !rawSlug.includes('http')
            ? rawSlug.slice(0, 45)
            : toConciseEnglishSlug(`${facts.name || ''} ${topic}`, 'place-article');

          const finalTitle = sanitizeArticleArabic(String(parsed.title || title || `${facts.name || 'مقال'} في ${facts.area || 'المنزلة'}`).trim().slice(0, 180));
          const finalExcerpt = sanitizeArticleArabic(String(parsed.excerpt || content.slice(0, 160)).trim().slice(0, 240));

          return {
            title: finalTitle,
            slug: cleanSlug,
            excerpt: finalExcerpt,
            content,
            keywords: Array.isArray(parsed.keywords)
              ? [...new Set(parsed.keywords.map(k => sanitizeArticleArabic(String(k || '').trim())).filter(Boolean))].slice(0, 8)
              : [facts.name, facts.area, topic].map(k => sanitizeArticleArabic(k)).filter(Boolean),
            aiGenerated: true,
            wordsCount: words,
            characterCount: content.length
          };
        }
      }
    } catch (err) {
      console.warn('[OpenRouter draft attempt notice]:', err?.message || err);
    }
  }

  // 2. Try Gemini API
  const geminiKey = env?.GEMINI_API_KEY || env?.FIREBASE_API_KEY;
  if (geminiKey) {
    try {
      const raw = await callGemini(geminiKey, userPrompt);
      const parsed = parseJson(raw);
      if (parsed && parsed.content) {
        const rawContent = String(parsed.content).trim();
        const content = sanitizeArticleArabic(rawContent);
        const words = content.split(/\s+/).length;
        if (words >= 250) {
          const rawSlug = String(parsed.slug || '').trim();
          const cleanSlug = /^[a-z0-9-]+$/.test(rawSlug) && rawSlug.length >= 4 && !rawSlug.includes('http')
            ? rawSlug.slice(0, 45)
            : toConciseEnglishSlug(`${facts.name || ''} ${topic}`, 'place-article');

          const finalTitle = sanitizeArticleArabic(String(parsed.title || title || `${facts.name || 'مقال'} في ${facts.area || 'المنزلة'}`).trim().slice(0, 180));
          const finalExcerpt = sanitizeArticleArabic(String(parsed.excerpt || content.slice(0, 160)).trim().slice(0, 240));

          return {
            title: finalTitle,
            slug: cleanSlug,
            excerpt: finalExcerpt,
            content,
            keywords: Array.isArray(parsed.keywords)
              ? [...new Set(parsed.keywords.map(k => sanitizeArticleArabic(String(k || '').trim())).filter(Boolean))].slice(0, 8)
              : [facts.name, facts.area, topic].map(k => sanitizeArticleArabic(k)).filter(Boolean),
            aiGenerated: true,
            wordsCount: words,
            characterCount: content.length
          };
        }
      }
    } catch (err) {
      console.warn('[Gemini draft attempt notice]:', err?.message || err);
    }
  }

  // 3. Fallback: Local High-Quality Human-like Synthesis (~420 words)
  return synthesizeSmartArticle(topic, title, facts);
}