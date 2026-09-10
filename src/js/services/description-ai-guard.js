/*
 * المنزلة وناسها — AI Description Guard
 *
 * Adds a strict, category-aware instruction layer to the existing /api/ai/chat
 * request used by the dashboard's SEO description generator.
 * The selected category is the single source of truth for the business model,
 * grammatical subject, and vocabulary used by the generated description.
 */
(function installDescriptionAIGuard() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (window.__descriptionAIGuardInstalled) return;
  window.__descriptionAIGuardInstalled = true;

  const originalFetch = window.fetch.bind(window);

  const normalize = (value = '') => String(value)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .trim();

  const has = (text, ...terms) => terms.some(term => text.includes(normalize(term)));

  function classify(category = '', placeName = '') {
    const raw = `${category} ${placeName}`;
    const c = normalize(category);
    const n = normalize(placeName);

    // Explicit business form always wins over generic words in the name.
    if (has(c, 'دكتورة')) return {
      entity: 'دكتورة',
      pronoun: 'feminine',
      verb: 'تتميز',
      subject: 'الدكتورة',
      forbidden: ['الورشة', 'المعرض', 'المحل', 'المطعم', 'العيادة'],
      rule: 'هذا نشاط طبي تقوده دكتورة؛ استخدم الدكتورة/تتميز، ولا تحوّلها إلى ورشة أو معرض.'
    };
    if (has(c, 'دكتور', 'طبيب')) return {
      entity: 'دكتور',
      pronoun: 'masculine',
      verb: 'يتميز',
      subject: 'الدكتور',
      forbidden: ['الورشة', 'المعرض', 'المحل', 'المطعم'],
      rule: 'هذا نشاط طبي يقوده دكتور؛ استخدم الدكتور/يتميز عند الإشارة إلى الشخص، ولا تخترع ورشة أو معرضاً.'
    };
    if (has(c, 'صيدلية')) return {
      entity: 'صيدلية', pronoun: 'feminine', verb: 'تتميز', subject: 'الصيدلية',
      forbidden: ['الورشة', 'المعرض', 'المحل', 'العيادة'],
      rule: 'الصيدلية مؤنث: الصيدلية، تتميز، خدماتها.'
    };
    if (has(c, 'عيادة', 'عيادات')) return {
      entity: 'عيادة', pronoun: 'feminine', verb: 'تتميز', subject: 'العيادة',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'العيادة مؤنث: العيادة، تتميز، رعايتها؛ لا تصفها كمعرض أو ورشة.'
    };
    if (has(c, 'ورشة')) return {
      entity: 'ورشة', pronoun: 'feminine', verb: 'تتميز', subject: 'الورشة',
      forbidden: ['المعرض', 'المحل', 'العيادة', 'المطعم', 'الصيدلية'],
      rule: 'التصنيف ورشة: استخدم الورشة/تتميز/أعمالها. لا تستخدم معرض أو محل أو عيادة. لا تصف نشاطاً تجارياً للبيع فقط بأنه ورشة إلا إذا كانت الفئة نفسها ورشة.'
    };
    if (has(c, 'معرض')) return {
      entity: 'معرض', pronoun: 'masculine', verb: 'يتميز', subject: 'المعرض',
      forbidden: ['الورشة', 'العيادة', 'الصيدلية', 'المحل', 'المطعم'],
      rule: 'التصنيف معرض: استخدم المعرض/يتميز/تشكيلته/معروضاته. ممنوع تماماً استخدام الورشة أو التصنيع أو التركيب أو الصيانة إلا إذا كانت هذه الخدمات مذكورة صراحة ضمن بيانات المكان.'
    };
    if (has(c, 'محل', 'بقالة', 'سوبر ماركت', 'هايبر ماركت', 'ماركت', 'عطارة', 'محمصة', 'مقهى', 'كافيه', 'مطعم', 'حلواني', 'مخبز')) return {
      entity: 'محل/منشأة تجارية', pronoun: 'masculine', verb: 'يتميز', subject: 'المحل',
      forbidden: ['الورشة', 'المعرض', 'العيادة', 'الصيدلية'],
      rule: 'نشاط تجاري ثابت؛ استخدم المحل/يتميز أو اسم النشاط مباشرة، ولا تخترع ورشة أو معرضاً أو عيادة.'
    };
    if (has(c, 'مركز')) return {
      entity: 'مركز', pronoun: 'masculine', verb: 'يتميز', subject: 'المركز',
      forbidden: ['الورشة', 'المعرض', 'المحل', 'الصيدلية'],
      rule: 'المركز مذكر: المركز، يتميز، خدماته. لا تحوله إلى ورشة أو معرض.'
    };
    if (has(c, 'شركة', 'مؤسسة', 'اكاديمية', 'أكاديمية', 'وكالة', 'حضانة', 'مكتبة', 'جمعية')) return {
      entity: 'مؤسسة', pronoun: 'feminine', verb: 'تتميز', subject: 'المؤسسة',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'الكيان مؤنث بحسب الاسم المحدد في التصنيف؛ استخدم المؤسسة/تتميز/خدماتها أو الاسم الاسمي الدقيق للتصنيف.'
    };
    if (has(c, 'مكتب')) return {
      entity: 'مكتب', pronoun: 'masculine', verb: 'يتميز', subject: 'المكتب',
      forbidden: ['الورشة', 'المعرض', 'المحل', 'العيادة'],
      rule: 'المكتب مذكر: المكتب، يتميز، خدماته. لا تحوله إلى محل أو ورشة.'
    };
    if (has(c, 'قاعة')) return {
      entity: 'قاعة', pronoun: 'feminine', verb: 'تتميز', subject: 'القاعة',
      forbidden: ['الورشة', 'المعرض', 'المحل', 'العيادة'],
      rule: 'القاعة مؤنث: القاعة، تتميز، تجهيزاتها.'
    };
    if (has(c, 'معصرة')) return {
      entity: 'معصرة', pronoun: 'feminine', verb: 'تتميز', subject: 'المعصرة',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'المعصرة مؤنث: المعصرة، تتميز، عصائرها.'
    };
    if (has(c, 'فندق')) return {
      entity: 'فندق', pronoun: 'masculine', verb: 'يتميز', subject: 'الفندق',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'الفندق مذكر: الفندق، يتميز، غرفه وخدماته.'
    };
    if (has(c, 'مدرس')) return {
      entity: 'مدرس', pronoun: 'masculine', verb: 'يتميز', subject: 'المدرس',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'المدرس شخص مذكر: المدرس، يتميز، أسلوبه؛ لا تستخدم صيغة المكان التجاري.'
    };
    if (has(c, 'مدرسة')) return {
      entity: 'مدرسة', pronoun: 'feminine', verb: 'تتميز', subject: 'المدرسة',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'المدرسة مؤنث: المدرسة، تتميز، برامجها.'
    };
    if (has(c, 'ماكينة صراف', 'صراف الي', 'صراف آلي')) return {
      entity: 'ماكينة صراف آلي', pronoun: 'feminine', verb: 'تتيح', subject: 'الماكينة',
      forbidden: ['الورشة', 'المعرض', 'المحل', 'المركز'],
      rule: 'هذا جهاز خدمة وليس محلاً؛ استخدم الماكينة/تتيح/تدعم عمليات السحب والإيداع.'
    };
    if (has(c, 'معاهد وكليات')) return {
      entity: 'مؤسسة تعليمية', pronoun: 'feminine', verb: 'تتميز', subject: 'المؤسسة التعليمية',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'استخدم المؤسسة التعليمية كمرجع محايد دقيق، ولا تختلق نشاطاً تجارياً.'
    };
    if (has(c, 'طباخة افراح')) return {
      entity: 'طباخة/شيف', pronoun: 'feminine', verb: 'تتميز', subject: 'الطباخة',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'الخدمة يقودها شخص؛ استخدم الطباخة/تتميز، ولا تحولها إلى مطعم أو ورشة إلا إذا كان التصنيف نفسه كذلك.'
    };
    if (has(c, 'تدريس مواد')) return {
      entity: 'مركز تدريس', pronoun: 'masculine', verb: 'يتميز', subject: 'مركز التدريس',
      forbidden: ['الورشة', 'المعرض', 'المحل'],
      rule: 'هذا نشاط تعليمي؛ استخدم مركز التدريس/يتميز وخدماته التعليمية.'
    };
    if (has(c, 'حفر وشغل ليزر', 'قص وتصليح زجاج')) return {
      entity: 'ورشة/خدمة فنية', pronoun: 'feminine', verb: 'تتميز', subject: 'الورشة',
      forbidden: ['المعرض', 'العيادة', 'الصيدلية'],
      rule: 'هذه فئة عمل فني؛ استخدم الورشة فقط عندما يكون التصنيف نفسه ورشة أو عندما يكون الاسم واضحاً بذلك، ولا تستخدم معرضاً.'
    };
    if (has(c, 'صيانة', 'تركيب', 'خدمات')) return {
      entity: 'خدمة متخصصة', pronoun: 'feminine', verb: 'تتميز', subject: 'الخدمة',
      forbidden: ['المعرض', 'المحل', 'العيادة', 'الصيدلية'],
      rule: 'الفئة خدمة متخصصة؛ استخدم الخدمة/تتميز أو المركز إذا كان التصنيف يذكر مركزاً، ولا تخترع معرضاً أو ورشة.'
    };

    // Safe neutral fallback for any of the remaining taxonomy entries.
    return {
      entity: 'النشاط', pronoun: 'masculine', verb: 'يتميز', subject: 'النشاط',
      forbidden: ['الورشة', 'المعرض', 'العيادة', 'الصيدلية', 'المحل'],
      rule: 'التزم بالاسم الحرفي للتصنيف ولا تستبدله بنوع منشأة آخر. استخدم النشاط كمرجع محايد إذا لم تكن بنية المنشأة واضحة.'
    };
  }

  function buildGuard(category, placeName, address, area, customKeywords) {
    const profile = classify(category, placeName);
    const location = [address, area].filter(Boolean).join(' - ');
    const services = Array.isArray(customKeywords) ? customKeywords.filter(Boolean).slice(0, 8) : [];

    return `

[STRICT CATEGORY & DESCRIPTION CONTROL — دليل المنزلة]
أنت تكتب وصفاً لصفحة مكان محدد، وليس وصفاً عاماً لفئة.

مصدر الحقيقة الوحيد:
- الاسم: ${placeName || 'غير محدد'}
- التصنيف المختار في قاعدة البيانات: ${category || 'غير محدد'}
- الموقع/الفرع الحالي: ${location || 'غير محدد'}
- الخدمات التي أدخلها صاحب المكان: ${services.length ? services.join('، ') : 'لا توجد خدمات إضافية'}

هوية المنشأة:
- نوع الكيان: ${profile.entity}
- المرجع النحوي المفضل: ${profile.subject}
- الفعل المفضل: ${profile.verb}
- الجنس النحوي: ${profile.pronoun === 'feminine' ? 'مؤنث' : 'مذكر'}
- تعليمات الفئة: ${profile.rule}

قواعد إلزامية:
1. التصنيف المختار هو الحقيقة النهائية. لا تستنتج تصنيفاً آخر من اسم المكان، ولا من الكلمات المفتاحية، ولا من عنوان الفرع.
2. ممنوع خلط نمط المنشأة: معرض ≠ ورشة ≠ محل ≠ مركز ≠ عيادة ≠ صيدلية. لا تستخدم أي واحد مكان الآخر.
3. إذا كان التصنيف "معرض أجهزة كهربائية" فاكتب عن معرض/تشكيلة/أجهزة/ماركات/ضمان/بيع، ولا تكتب "الورشة" أو "التصنيع" أو "التركيب" أو "الصيانة" إلا إذا كانت الخدمة مذكورة صراحة في بيانات المكان.
4. إذا كان التصنيف "ورشة" فاكتب عن الورشة/أعمالها/التصنيع أو الإصلاح أو التركيب فقط بحسب التصنيف والخدمات، ولا تصفها كمعرض.
5. إذا كان التصنيف "دكتور" أو "دكتورة" فالشخص هو محور الوصف: دكتور/دكتورة، يختص/تختص، يتميز/تتميز. لا تخترع عيادة أو مركزاً إذا لم يذكرها التصنيف.
6. طابق الجنس النحوي بدقة في كل الجمل، وليس في أول كلمة فقط.
7. لا تستخدم "يتميز" مع مؤنث ولا "تتميز" مع مذكر. استخدم المرجع المحدد أعلاه.
8. لا تستخدم "يقدم/تقدم". استخدم أفعالاً طبيعية مثل: يتميز، تتميز، يختص، تختص، يوفر، توفر، يضم، تضم، يشتهر، تتيح، حسب جنس الكيان.
9. لا تنقل أي معلومة عن فرع آخر. العنوان الحالي هو ${location || 'الموقع المقدم فقط'}؛ لا تخترع شارعاً أو بجوار مكان أو فرعاً آخر.
10. لا تضف خدمات أو منتجات أو ماركات أو ضمانات أو تقسيط أو توصيل أو تصنيع أو تركيب غير موجودة في التصنيف/الخدمات/البيانات.
11. الكلمات المفتاحية دليل موضوعي فقط وليست تصريحاً بتغيير نوع المنشأة.
12. اكتب وصفاً محلياً دقيقاً، طبيعي اللغة، واضحاً لمحركات البحث وAI Search، من 2–3 جمل، مع الحفاظ على اسم المكان والتصنيف والموقع الصحيحين.
13. قبل الإخراج، نفّذ فحصاً ذهنياً: هل كل اسم منشأة في النص يطابق التصنيف؟ هل الجنس النحوي متسق؟ هل ذكرت فرعاً أو خدمة غير موجودة؟ إذا نعم، أصلح النص قبل إرساله.

ممنوع استخدام هذه الأنواع لهذا المكان إلا إذا وردت صراحة في التصنيف/الخدمات: ${profile.forbidden.join('، ')}.
[/STRICT CATEGORY & DESCRIPTION CONTROL]
`;
  }

  window.fetch = async function guardedFetch(input, init) {
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (!url.includes('/api/ai/chat')) return originalFetch(input, init);

      let options = init ? { ...init } : {};
      let rawBody = options.body;
      if (!rawBody && input && typeof input !== 'string' && input instanceof Request) {
        rawBody = await input.clone().text();
      }
      if (typeof rawBody !== 'string') return originalFetch(input, options);

      const body = JSON.parse(rawBody);
      const prompt = String(body.prompt || body.message || '');
      if (!/وصفاً تسويقياً|الصيغة المطلوبة|وصف.*نشاط تجاري/i.test(prompt)) {
        return originalFetch(input, options);
      }

      const placeName = String((prompt.match(/\(([^\n()]*)\) في/) || [])[1] || '');
      const categoryName = String((prompt.match(/هو \(([^\n()]*)\) ومتخصص/) || [])[1] || '');
      const locationMatch = prompt.match(/في \(([^\n()]*)\) هو/);
      const location = locationMatch ? locationMatch[1] : '';
      const keywordMatch = prompt.match(/متخصص في توفير \(([^\n()]*)\)/);
      const customKeywords = keywordMatch ? keywordMatch[1].split('،').map(s => s.trim()).filter(Boolean) : [];

      const guard = buildGuard(categoryName, placeName, location, '', customKeywords);
      body.prompt = `${prompt}${guard}`;
      body.systemPrompt = `${String(body.systemPrompt || '')}\n\nأنت محرر أوصاف محلية صارم. لا تغير التصنيف ولا نوع المنشأة ولا موقع الفرع ولا الجنس النحوي.`.trim();
      options.body = JSON.stringify(body);
      options.headers = new Headers(options.headers || (input instanceof Request ? input.headers : {}));
      options.headers.set('Content-Type', 'application/json');
      return originalFetch(input, options);
    } catch (_) {
      return originalFetch(input, init);
    }
  };
})();
