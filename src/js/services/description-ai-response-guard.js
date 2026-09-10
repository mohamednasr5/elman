/*
 * Deterministic post-generation safety net for place descriptions.
 * It only touches the AI response for description-generation requests.
 */
(function installDescriptionAIResponseGuard() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (window.__descriptionAIResponseGuardInstalled) return;
  window.__descriptionAIResponseGuardInstalled = true;

  const previousFetch = window.fetch.bind(window);
  const normalize = (value = '') => String(value)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim();
  const has = (text, ...terms) => terms.some(term => text.includes(normalize(term)));

  function profile(category = '') {
    const c = normalize(category);
    if (has(c, 'معرض')) return { kind: 'showroom', masculine: true, from: ['الورشة'], to: ['المعرض'] };
    if (has(c, 'ورشة')) return { kind: 'workshop', masculine: false, from: ['المعرض'], to: ['الورشة'] };
    if (has(c, 'دكتورة')) return { kind: 'femaleDoctor', masculine: false, from: [], to: [] };
    if (has(c, 'دكتور', 'طبيب')) return { kind: 'maleDoctor', masculine: true, from: [], to: [] };
    if (has(c, 'صيدلية')) return { kind: 'feminine', masculine: false, from: [], to: [] };
    if (has(c, 'عيادة')) return { kind: 'feminine', masculine: false, from: [], to: [] };
    if (has(c, 'قاعة')) return { kind: 'feminine', masculine: false, from: [], to: [] };
    if (has(c, 'معصرة')) return { kind: 'feminine', masculine: false, from: [], to: [] };
    if (has(c, 'مدرسة')) return { kind: 'feminine', masculine: false, from: [], to: [] };
    if (has(c, 'مؤسسة', 'شركة', 'اكاديمية', 'أكاديمية', 'وكالة', 'حضانة')) return { kind: 'feminine', masculine: false, from: [], to: [] };
    if (has(c, 'مركز', 'مكتب', 'فندق', 'محل', 'بقالة', 'مطعم', 'مخبز', 'حلواني', 'محمصة', 'سوبر ماركت', 'هايبر ماركت')) return { kind: 'masculine', masculine: true, from: [], to: [] };
    return { kind: 'neutral', masculine: true, from: [], to: [] };
  }

  function rewrite(text, category) {
    let out = String(text || '').trim();
    const p = profile(category);

    if (p.kind === 'showroom') {
      out = out.replace(/الورشة/g, 'المعرض');
      out = out.replace(/ورشة/g, 'معرض');
      out = out.replace(/تتميز\s+(المعرض)/g, 'يتميز $1');
      out = out.replace(/تتميز\s+(معرض)/g, 'يتميز $1');
      out = out.replace(/أعمال\s+(المعرض)/g, 'معروضات $1');
    }

    if (p.kind === 'workshop') {
      out = out.replace(/المعرض/g, 'الورشة');
      out = out.replace(/معرض/g, 'ورشة');
      out = out.replace(/يتميز\s+(الورشة)/g, 'تتميز $1');
      out = out.replace(/يتميز\s+(ورشة)/g, 'تتميز $1');
    }

    if (p.kind === 'femaleDoctor') {
      out = out.replace(/الدكتور/g, 'الدكتورة');
      out = out.replace(/يتميز\s+(الدكتورة)/g, 'تتميز $1');
      out = out.replace(/يختص\s+(الدكتورة)/g, 'تختص $1');
    }

    if (p.kind === 'maleDoctor') {
      out = out.replace(/الدكتورة/g, 'الدكتور');
      out = out.replace(/تتميز\s+(الدكتور)/g, 'يتميز $1');
      out = out.replace(/تختص\s+(الدكتور)/g, 'يختص $1');
    }

    if (!p.masculine) {
      out = out
        .replace(/يتميز\s+(الصيدلية|العيادة|الورشة|القاعة|المعصرة|المدرسة|المؤسسة|الشركة|الأكاديمية|الاكاديمية|الوكالة|الحضانة|الخدمة|الدكتورة|الطباخة)/g, 'تتميز $1')
        .replace(/يختص\s+(الصيدلية|العيادة|الورشة|القاعة|المعصرة|المدرسة|المؤسسة|الشركة|الأكاديمية|الاكاديمية|الوكالة|الحضانة|الخدمة|الدكتورة|الطباخة)/g, 'تختص $1');
    } else {
      out = out
        .replace(/تتميز\s+(المعرض|المحل|المركز|المكتب|الفندق|الدكتور|المدرس|النشاط)/g, 'يتميز $1')
        .replace(/تختص\s+(المعرض|المحل|المركز|المكتب|الفندق|الدكتور|المدرس|النشاط)/g, 'يختص $1');
    }

    return out;
  }

  function extractCategory(prompt = '') {
    return String((prompt.match(/هو \(([^\n()]*)\) ومتخصص/) || [])[1] || '');
  }

  window.fetch = async function guardedResponseFetch(input, init) {
    const response = await previousFetch(input, init);
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (!url.includes('/api/ai/chat')) return response;

      let rawBody = init && init.body;
      if (!rawBody && input && typeof input !== 'string' && input instanceof Request) rawBody = await input.clone().text();
      if (typeof rawBody !== 'string') return response;
      const requestBody = JSON.parse(rawBody);
      const prompt = String(requestBody.prompt || requestBody.message || '');
      if (!/وصفاً تسويقياً|الصيغة المطلوبة|وصف.*نشاط تجاري/i.test(prompt)) return response;

      const category = extractCategory(prompt);
      const data = await response.clone().json();
      let changed = false;
      const rewriteField = (key) => {
        if (typeof data[key] !== 'string') return;
        const next = rewrite(data[key], category);
        if (next !== data[key]) { data[key] = next; changed = true; }
      };

      rewriteField('result');
      rewriteField('text');
      rewriteField('content');
      if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
        const next = rewrite(data.choices[0].message.content, category);
        if (next !== data.choices[0].message.content) {
          data.choices[0].message.content = next;
          changed = true;
        }
      }

      if (!changed) return response;
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers });
    } catch (_) {
      return response;
    }
  };
})();
