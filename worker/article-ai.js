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
  return `أنت كاتب مقالات تسويقية وسيو خبير في محركات البحث والذكاء الاصطناعي (SEO & AI Search GEO)، تكتب بأسلوب بشري راقٍ، دافئ وواقعي لأصحاب الأنشطة التجارية في محافظة الدقهلية (المنزلة والمطرية وما حولهما).
قواعد الصياغة الإلزامية:
1. النبرة بشرية طبيعية 100%: كما يكتب صاحب المحل لزبائنه وأهل بلده، دافئة، صادقة، مقنعة وعملية، وتخلو تماماً من ركاكة وكليشيهات الذكاء الاصطناعي المبتذلة (ممنوع منعاً باتاً: "في عالمنا المعاصر"، "مما لا شك فيه"، "تعتبر من أهم"، "في ختام هذا المقال"، "يسرنا أن نقدم"، "دعونا نستكشف").
2. الطول المستهدف: مقال غني ومفصل من حوالي 400 إلى 500 كلمة (Words) مقسم إلى فقرات منسقة بعناية وتتضمن عناوين فرعية منسقة تجيب على استفسارات العملاء وتبرز خبرة المكان وجودته الحقيقية.
3. التوافق التام مع محركات البحث ومحركات الذكاء الاصطناعي (GEO): اذكر اسم المكان، المنطقة، العنوان الدقيق، والخدمات الحقيقية بسياق سردي مفيد وطبيعي يفضله جوجل ومساعدات الذكاء الاصطناعي (ChatGPT, Gemini, Perplexity).
4. الرابط بالإنجليزية فقط (slug): يجب توليد رابط مختصر باللغة الإنجليزية حصراً من 3 إلى 5 كلمات بحروف صغيرة وشرطات فقط (مثل: al-hassan-phone-repair-offers). ممنوع وضع أي حروف عربية في حقل slug نهائياً.
5. المخرجات حصراً بصيغة JSON بدون أي وسوم markdown خارجية:
{
  "title": "عنوان المقال الجذاب والواقعي باللغة العربية",
  "slug": "concise-english-slug-only-3-to-5-words",
  "excerpt": "موجز تسويقي جذاب للمقال في سطرين (حوالي 120-160 حرف)",
  "content": "نص المقال المتكامل من حوالي 400 إلى 500 كلمة، منظم في فقرات مترابطة مع عناوين فرعية منسقة",
  "keywords": ["كلمة 1", "كلمة 2", "كلمة 3", "كلمة 4", "كلمة 5", "كلمة 6"]
}`;
}

function buildUserPrompt(topic, title, facts) {
  const parts = [
    `موضوع المقال المطلوب من صاحب المكان: «${topic}»`,
    title ? `العنوان المقترح مبدئياً: «${title}»` : '',
    `بيانات المكان الحقيقية الموثقة:`,
    `- اسم المكان: ${facts.name || 'النشاط التجاري'}`,
    facts.area ? `- المنطقة والمدينة: ${facts.area}` : '- المنطقة: المنزلة والمطرية',
    facts.address ? `- العنوان التفصيلي: ${facts.address}` : '',
    facts.category ? `- التصنيف والنشاط: ${facts.category}` : '',
    facts.description ? `- نبذة عن المكان: ${facts.description}` : '',
    Array.isArray(facts.services) && facts.services.length ? `- أبرز الخدمات: ${facts.services.slice(0, 10).join('، ')}` : '',
    `المطلوب: توليد مقال بشري جذاب من حوالي 400 إلى 500 كلمة مع رابط إنجليزي مختصر بصيغة JSON المحددة فقط.`
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
      max_tokens: 2400,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(18000)
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
        maxOutputTokens: 2400,
        responseMimeType: 'application/json'
      }
    }),
    signal: AbortSignal.timeout(18000)
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function synthesizeSmartArticle(topic, title, facts) {
  const name = facts.name || 'المكان';
  const area = facts.area || 'المنزلة والمطرية';
  const cat = facts.category || 'خدمات متميزة';
  const addr = facts.address ? `في ${facts.address}` : `بمدينة ${area}`;

  const englishSlug = toConciseEnglishSlug(`${name} ${topic} ${area}`, 'place-article');
  const finalTitle = title || `${name} في ${area}: دليلك المتكامل للجودة وأفضل العروض في ${topic}`;

  const p1 = `عندما يتعلق الأمر بالبحث عن أفضل خدمات ${cat} في مدينة ${area} وما حولها، فإن الاختيار الموفق يبدأ دائماً من المكان الذي يجمع بين الخبرة الطويلة، والأمانة المطلقة، وراحة العميل. في ${name} ${addr}، كرسنا جهودنا منذ اليوم الأول لنكون الخيار الأول والوجهة الأكثر موثوقية لكل من يبحث عن الجودة الفائقة والتنفيذ المتقن. نحن لا نعتبر عملنا مجرد تقديم خدمة أو بيع منتج، بل نبني علاقة ثقة مستدامة مع كل عميل يقصدنا، مدركين أن السمعة الطيبة وحسن المعاملة هما رأس مالنا الحقيقي في منطقتنا الكريمة.`;

  const h1 = `### ما الذي يجعل ${name} وجهتك الأولى والاختيار الأمثل في ${area}؟`;
  const p2 = `في ظل تنوع الخيارات في السوق اليوم، قد يشعر العميل بالحيرة عند المقارنة بين المحلات ومقدمي الخدمات. لكن ما يميز ${name} عن غيره هو التزامنا الصارم بأعلى معايير الجودة والشفافية التامة في كل خطوة. نحن نوفر فحصاً دقيقاً وتشخيصاً صريحاً لاحتياجك، ونعتمد فقط على الخامات الأصلية وقطع الغيار المضمونة ذات العمر الافتراضي الطويل. فريقنا يمتلك مهارات فنية عميقة تم صقلها عبر سنوات من العمل الجاد، مما يضمن لك الحصول على أعلى أداء ممكن بأقل مجهود وبدون أي مفاجآت أو تكاليف غير مبررة.`;

  const h2 = `### خدمات متكاملة وعروض حصرية تلبي تطلعات أهل المنطقة`;
  const p3 = `نحن نعلم جيداً مدى أهمية ${topic} لجميع أهالينا في ${area} والمراكز والقرى المجاورة، ولذلك نحرص دائماً على تصميم عروض خاصة وباقات أسعار متوازنة تراعي الظروف وتلائم ميزانيات كافة الأسر والشباب. سواء كنت بحاجة إلى استشارة فنية فورية، أو صيانة احترافية سريعة، أو شراء مستلزمات حديثة ومضمونة، فإننا نوفر لك تجربة سلسة تبدأ من لحظة تواصلك معنا وحتى ما بعد استلامك للخدمة، مع التزامنا التام بالمواعيد الدقيقة التي نقدر فيها وقت كل عميل وقيمة ثقته بنا.`;

  const h3 = `### إرشادات ونصائح ذهبية تهمك قبل طلب الخدمة أو الشراء`;
  const p4 = `انطلاقاً من حرصنا الدائم على توعية عملائنا الكرام وتقديم قيمة حقيقية تتجاوز مجرد العمل التجاري، نشارككم بعض النصائح الهامة: أولاً، احرص دائماً على التعامل مع المتخصصين المعتمدين وتجنب البدائل مجهولة المصدر أو الأسعار الزهيدة غير المنطقية التي غالباً ما تكلفك أضعاف ما وفرته بسبب تكرار الأعطال. ثانياً، حافظ على المتابعة الدورية والاستفسار عن الضمان وسياسات الاستبدال وخدمة ما بعد البيع. نحن في ${name} نضع بين يديك كامل معرفتنا ونمنحك الإرشاد الصادق والنصيحة المخلصة لتختار دائماً الأنسب لك.`;

  const h4 = `### تشرفنا زيارتكم وتواصلكم المباشر عبر الهاتف والواتساب`;
  const p5 = `أبوابنا مفتوحة دائماً لاستقبالكم في ${name} ${addr}. يسعدنا الرد الفوري على كافة أسئلتكم واستفساراتكم بخصوص الأسعار، وتوافر المنتجات، ومواعيد العمل عبر أرقام هواتفنا أو رسائل الواتساب المباشرة. لا تترددوا في الاستفسار أو طلب النصيحة، فنحن هنا دائماً لخدمة أهلنا في ${area} وتقديم أفضل ما لدينا بكل فخر واعتزاز. نسعد بخدمتكم ونتطلع دائماً لأن نكون عند حسن ظنكم في كل زيارة.`;

  const content = `${p1}\n\n${h1}\n\n${p2}\n\n${h2}\n\n${p3}\n\n${h3}\n\n${p4}\n\n${h4}\n\n${p5}`;
  const words = content.trim().split(/\s+/).length;

  return {
    title: finalTitle,
    slug: englishSlug,
    excerpt: `تعرف على خدمات وعروض ${name} ${addr}. جودة معتمدة، أسعار عادلة، وأمانة تامة تلبي كافة احتياجاتك في ${area}.`,
    content,
    keywords: [name, area, cat, topic, 'عروض المنزلة', 'دليل المنزلة'].filter(Boolean),
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
        const content = String(parsed.content).trim();
        const words = content.split(/\s+/).length;
        if (words >= 250) {
          const rawSlug = String(parsed.slug || '').trim();
          const cleanSlug = /^[a-z0-9-]+$/.test(rawSlug) && rawSlug.length >= 4 && !rawSlug.includes('http')
            ? rawSlug.slice(0, 45)
            : toConciseEnglishSlug(`${facts.name || ''} ${topic}`, 'place-article');

          return {
            title: String(parsed.title || title || `${facts.name || 'مقال'} في ${facts.area || 'المنزلة'}`).trim().slice(0, 180),
            slug: cleanSlug,
            excerpt: String(parsed.excerpt || content.slice(0, 160)).trim().slice(0, 240),
            content,
            keywords: Array.isArray(parsed.keywords)
              ? [...new Set(parsed.keywords.map(k => String(k || '').trim()).filter(Boolean))].slice(0, 8)
              : [facts.name, facts.area, topic].filter(Boolean),
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
        const content = String(parsed.content).trim();
        const words = content.split(/\s+/).length;
        if (words >= 250) {
          const rawSlug = String(parsed.slug || '').trim();
          const cleanSlug = /^[a-z0-9-]+$/.test(rawSlug) && rawSlug.length >= 4 && !rawSlug.includes('http')
            ? rawSlug.slice(0, 45)
            : toConciseEnglishSlug(`${facts.name || ''} ${topic}`, 'place-article');

          return {
            title: String(parsed.title || title || `${facts.name || 'مقال'} في ${facts.area || 'المنزلة'}`).trim().slice(0, 180),
            slug: cleanSlug,
            excerpt: String(parsed.excerpt || content.slice(0, 160)).trim().slice(0, 240),
            content,
            keywords: Array.isArray(parsed.keywords)
              ? [...new Set(parsed.keywords.map(k => String(k || '').trim()).filter(Boolean))].slice(0, 8)
              : [facts.name, facts.area, topic].filter(Boolean),
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