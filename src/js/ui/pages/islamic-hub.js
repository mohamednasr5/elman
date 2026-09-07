/* Premium Islamic Knowledge Hub — local-first, offline-first, zero D1/Firebase data usage */
const LOCAL_SOURCES = {
  quran: ['./quran.json', './data/quran.json'],
  hadith: ['./hadith.json', './data/hadith.json']
};

const memoryCache = new Map();

const stripArabic = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
  .replace(/[إأآٱ]/g, 'ا')
  .replace(/[ؤئ]/g, 'و')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/ء/g, '')
  .replace(/ـ/g, '')
  .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  .replace(/[^\u0621-\u063A\u0641-\u064A0-9a-zA-Z\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const tokenize = (value) => stripArabic(value).split(' ').filter(Boolean);

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[m]));

const verseText = (a) => a?.text ?? a?.text_uthmani ?? a?.aya_text ?? a?.content ?? a?.arabic ?? a?.ar ?? '';

const normalizeQuran = (raw) => {
  const root = raw?.data ?? raw?.quran ?? raw;
  if (Array.isArray(root) && root.length && (root[0]?.ayahs || root[0]?.verses || root[0]?.ayah)) {
    return root.map((s, i) => ({
      number: s.number ?? s.id ?? i + 1,
      name: s.name ?? s.englishName ?? s.arabicName ?? ('سورة ' + (i + 1)),
      ayahs: (s.ayahs ?? s.verses ?? s.ayah).map((a, j) => ({
        n: a.numberInSurah ?? a.verseNumber ?? a.number ?? j + 1,
        text: verseText(a)
      })).filter(a => a.text)
    })).filter(s => s.ayahs.length);
  }
  if (Array.isArray(root)) {
    const groups = new Map();
    root.forEach((a, i) => {
      const sn = a?.surah?.number ?? a?.surah_number ?? a?.chapter ?? a?.surahId ?? a?.surah ?? 1;
      if (!groups.has(sn)) {
        groups.set(sn, {
          number: sn,
          name: a?.surah?.name ?? a?.surah_name ?? a?.chapter_name ?? ('سورة ' + sn),
          ayahs: []
        });
      }
      groups.get(sn).ayahs.push({
        n: a?.ayah_number ?? a?.numberInSurah ?? a?.verseNumber ?? a?.number ?? groups.get(sn).ayahs.length + 1,
        text: verseText(a)
      });
    });
    return [...groups.values()].filter(s => s.ayahs.length);
  }
  if (root && typeof root === 'object') {
    const entries = Object.values(root);
    if (entries.some(Array.isArray)) return normalizeQuran(entries.flat());
  }
  return [];
};

const normalizeHadith = (raw) => {
  const root = raw?.data?.hadiths ?? raw?.hadiths ?? raw?.data ?? raw;
  const arr = Array.isArray(root)
    ? root
    : Object.values(root || {}).flatMap(v => Array.isArray(v) ? v : [v]);
  return arr.map((h, i) => ({
    id: h?.id ?? h?.hadith_id ?? h?.number ?? i + 1,
    text: verseText(h) || h?.hadith || h?.body || h?.textArabic || '',
    book: h?.book?.name ?? h?.book ?? h?.source ?? h?.collection ?? 'حديث',
    chapter: h?.chapter?.name ?? h?.chapter ?? ''
  })).filter(h => h.text);
};

async function loadLocal(kind) {
  if (memoryCache.has(kind)) return memoryCache.get(kind);

  let lastError = null;
  for (const src of LOCAL_SOURCES[kind]) {
    try {
      const response = await fetch(src, { cache: 'force-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + src);
      const raw = await response.json();
      const data = kind === 'quran' ? normalizeQuran(raw) : normalizeHadith(raw);
      if (!data.length) throw new Error('Empty or unsupported ' + kind + ' dataset');
      memoryCache.set(kind, data);
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  console.error('[IslamicHub] Local dataset unavailable:', kind, lastError);
  return [];
}

function shell(title, subtitle) {
  return '<div class="islamic-hub"><div class="ih-wrap">' +
    '<div class="ih-hero"><div class="ih-hero-copy">' +
    '<span class="ih-kicker">✦ المعرفة الإسلامية في دليل المنزلة والمطرية</span>' +
    '<h1 class="ih-title">' + title + '</h1>' +
    '<p class="ih-sub">' + subtitle + '</p>' +
    '<div class="ih-tools"><a class="ih-btn" href="index.html">الرئيسية</a><a class="ih-btn" href="quran-search.html">الباحث في القرآن</a></div>' +
    '</div><div class="ih-ornament"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 61 31 86 35 68 53 72 79 50 67 28 79 32 53 14 35 39 31Z"/><circle cx="50" cy="50" r="11"/></svg></div></div>' +
    '<div id="ih-content" class="ih-card"><div class="ih-loading"><div><div class="ih-pulse"></div><p>جاري تجهيز المحتوى محلياً...</p></div></div></div>' +
    '</div></div>';
}

function searchScore(text, query) {
  const normalized = stripArabic(text);
  if (!query) return 0;
  if (normalized === query) return 1000;
  if (normalized.includes(query)) return 700;
  const words = tokenize(query);
  if (!words.length) return 0;
  const matched = words.reduce((n, word) => n + (normalized.includes(word) ? 1 : 0), 0);
  return matched ? matched * 100 + (matched === words.length ? 50 : 0) : 0;
}

function makeQuranIndex(surahs) {
  return surahs.flatMap(s => s.ayahs.map(a => ({
    s: s.name, sn: s.number, n: a.n, text: a.text, key: stripArabic(a.text)
  })));
}

async function renderQuran(container) {
  container.innerHTML = shell('القرآن الكريم', 'قراءة محلية سريعة للقرآن الكريم، تعمل مع PWA حتى دون اتصال بعد أول زيارة.');
  const box = container.querySelector('#ih-content');
  const surahs = await loadLocal('quran');
  if (!surahs.length) {
    box.innerHTML = '<div class="ih-empty">لم يتم العثور على quran.json. يجب أن يكون الملف في جذر المشروع أو داخل data/.</div>';
    return;
  }

  box.innerHTML =
    '<div class="ih-meta"><span>سور القرآن الكريم</span><span>' + surahs.length + ' سورة</span></div>' +
    '<div class="ih-surah-list">' +
    surahs.map((s, i) => '<button class="ih-surah" data-i="' + i + '">' + escapeHtml(s.name) + '<br><small>' + s.ayahs.length + ' آية</small></button>').join('') +
    '</div><div id="quran-reader" class="ih-results" style="margin-top:22px"></div>';

  const reader = box.querySelector('#quran-reader');
  const render = (i) => {
    const s = surahs[i];
    reader.innerHTML =
      '<div class="ih-meta"><span>سورة ' + escapeHtml(s.name) + '</span><button class="ih-btn" id="back-surahs">السور</button></div>' +
      s.ayahs.map(a => '<div class="ih-ayah">' + escapeHtml(a.text) + ' <span class="ih-ayah-num">' + escapeHtml(a.n) + '</span></div>').join('');
    reader.querySelector('#back-surahs')?.addEventListener('click', () => box.querySelector('.ih-surah-list')?.scrollIntoView({behavior:'smooth', block:'start'}));
    reader.scrollIntoView({behavior:'smooth', block:'start'});
  };
  box.querySelectorAll('.ih-surah').forEach(button => {
    button.addEventListener('click', () => render(Number(button.dataset.i)));
  });
}

async function renderHadith(container) {
  container.innerHTML = shell('الأحاديث الشريفة', 'قاعدة أحاديث محلية سريعة مع بحث عربي ذكي يتجاهل التشكيل والهمزات والاختلافات الإملائية.');
  const box = container.querySelector('#ih-content');
  const hadith = await loadLocal('hadith');
  if (!hadith.length) {
    box.innerHTML = '<div class="ih-empty">لم يتم العثور على hadith.json. يجب أن يكون الملف في جذر المشروع أو داخل data/.</div>';
    return;
  }

  box.innerHTML = '<div class="ih-tools"><input id="hadith-q" class="ih-input" placeholder="ابحث في الأحاديث بدون تشكيل أو همزات..." autocomplete="off" inputmode="search"><button class="ih-btn" id="hadith-clear">مسح</button></div><div class="ih-meta"><span>قاعدة محلية</span><span>' + hadith.length.toLocaleString('ar-EG') + ' حديث</span></div><div id="hadith-results" class="ih-results"></div>';
  const input = box.querySelector('#hadith-q');
  const out = box.querySelector('#hadith-results');

  const draw = () => {
    const q = stripArabic(input.value);
    const rows = q
      ? hadith.map(h => ({h, score: searchScore(h.text + ' ' + h.book + ' ' + h.chapter, q)})).filter(x => x.score > 0).sort((a,b) => b.score-a.score).slice(0, 100).map(x => x.h)
      : hadith.slice(0, 30);

    out.innerHTML = rows.length
      ? rows.map(h => '<article class="ih-result"><div class="ih-meta"><b>' + escapeHtml(h.book) + '</b><span>#' + escapeHtml(h.id) + '</span></div><div>' + escapeHtml(h.text) + '</div>' + (h.chapter ? '<small style="color:var(--ih-muted)">' + escapeHtml(h.chapter) + '</small>' : '') + '</article>').join('')
      : '<div class="ih-empty">لا توجد نتائج مطابقة.</div>';
  };

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(draw, 30);
  });
  box.querySelector('#hadith-clear').addEventListener('click', () => {
    input.value = '';
    input.focus();
    draw();
  });
  draw();
}

async function renderQuranSearch(container) {
  container.innerHTML = shell('الباحث في القرآن الكريم', 'ابحث بأي كلمة أو عبارة؛ البحث يتجاهل التشكيل والهمزات والاختلافات الإملائية ويعمل محلياً بلا D1 أو Firebase.');
  const box = container.querySelector('#ih-content');
  const surahs = await loadLocal('quran');
  if (!surahs.length) {
    box.innerHTML = '<div class="ih-empty">لم يتم العثور على quran.json. يجب أن يكون الملف في جذر المشروع أو داخل data/.</div>';
    return;
  }

  const index = makeQuranIndex(surahs);
  box.innerHTML = '<div class="ih-tools"><input id="quran-q" class="ih-input" autofocus placeholder="مثال: الحمد لله أو الرحمن أو الصلاة..." autocomplete="off" inputmode="search"><span class="ih-btn" style="cursor:default">بحث فوري</span></div><div id="quran-results" class="ih-results"></div>';
  const input = box.querySelector('#quran-q');
  const out = box.querySelector('#quran-results');

  const draw = () => {
    const q = stripArabic(input.value);
    if (!q) {
      out.innerHTML = '<div class="ih-empty">ابدأ بكتابة كلمة للبحث في القرآن الكريم.</div>';
      return;
    }

    const rows = index
      .map(v => ({v, score: searchScore(v.text, q)}))
      .filter(x => x.score > 0)
      .sort((a,b) => b.score-a.score)
      .slice(0, 80)
      .map(x => x.v);

    out.innerHTML = rows.length
      ? rows.map(v => '<article class="ih-result"><div class="ih-meta"><b>سورة ' + escapeHtml(v.s) + '</b><span>آية ' + escapeHtml(v.n) + '</span></div><div class="ih-ayah" style="border:0;padding:4px 0">' + escapeHtml(v.text) + '</div></article>').join('')
      : '<div class="ih-empty">لم نجد آية مطابقة. جرّب الكلمة بدون تشكيل أو همزات.</div>';
  };

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(draw, 20);
  });
  draw();
}

export { renderQuran, renderHadith, renderQuranSearch };
