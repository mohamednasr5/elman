/* Premium Islamic Knowledge Hub — local-first, fast, smart Arabic search */
const SOURCES = {
  // Local files are always preferred for PWA/offline speed.
  quran: ['./quran.json','./data/quran.json','./quran.js','./data/quran.js','https://raw.githubusercontent.com/azvox/quran.json/master/quran.json'],
  hadith: ['./hadith.json','./data/hadith.json','./hadith.js','./data/hadith.js','https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_book/the_9_books/bukhari.json']
};
const stripArabic = s => String(s??'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ء/g,'').replace(/[^\u0621-\u063A\u0641-\u064A0-9a-zA-Z\s]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const escapeHtml = s => String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const verseText = a => a?.text ?? a?.text_uthmani ?? a?.aya_text ?? a?.content ?? a?.arabic ?? a?.ar ?? '';
const normalizeQuran = raw => {
  const root = raw?.data ?? raw?.quran ?? raw;
  if(Array.isArray(root) && root.length && (root[0].ayahs || root[0].verses || root[0].ayah)) {
    return root.map((s,i)=>({number:s.number??s.id??i+1,name:s.name??s.englishName??('سورة '+(i+1)),ayahs:(s.ayahs??s.verses??s.ayah).map((a,j)=>({n:a.numberInSurah??a.number??j+1,text:verseText(a)}))}));
  }
  if(Array.isArray(root)) {
    const groups=new Map(); root.forEach((a,i)=>{const sn=a.surah?.number??a.surah_number??a.chapter??a.surahId??1; if(!groups.has(sn))groups.set(sn,{number:sn,name:a.surah?.name??a.surah_name??a.chapter_name??('سورة '+sn),ayahs:[]}); groups.get(sn).ayahs.push({n:a.ayah_number??a.numberInSurah??a.number??groups.get(sn).ayahs.length+1,text:verseText(a)});}); return [...groups.values()];
  }
  return [];
};
const normalizeHadith = raw => {
  const root=raw?.data?.hadiths??raw?.hadiths??raw?.data??raw;
  const arr=Array.isArray(root)?root:Object.values(root||{}).flatMap(v=>Array.isArray(v)?v:[v]);
  return arr.map((h,i)=>({id:h.id??i+1,text:verseText(h) || h.hadith ?? h.body ?? h.textArabic ?? '',book:h.book?.name??h.book??h.source??h.collection??'حديث',chapter:h.chapter?.name??h.chapter??''})).filter(h=>h.text);
};
async function loadLocal(kind){
  for(const src of SOURCES[kind]){
    try{const res=await fetch(src,{cache:'force-cache'}); if(!res.ok)continue; const text=await res.text(); if(src.endsWith('.js')){const blob=new Blob([text+'\n'],{type:'text/javascript'}); const url=URL.createObjectURL(blob); const mod=await import(url); URL.revokeObjectURL(url); return kind==='quran'?normalizeQuran(mod.default??mod.quran??mod.data):normalizeHadith(mod.default??mod.hadith??mod.data)} return kind==='quran'?normalizeQuran(JSON.parse(text)):normalizeHadith(JSON.parse(text));}catch(_){}
  }
  return [];
}
function shell(kind,title,subtitle,icon){
  return '<div class="islamic-hub"><div class="ih-wrap"><div class="ih-hero"><div class="ih-hero-copy"><span class="ih-kicker">✦ المعرفة الإسلامية في دليل المنزلة والمطرية</span><h1 class="ih-title">'+title+'</h1><p class="ih-sub">'+subtitle+'</p><div class="ih-tools"><a class="ih-btn" href="index.html">الرئيسية</a><a class="ih-btn" href="quran-search.html">الباحث في القرآن</a></div></div><div class="ih-ornament"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 61 31 86 35 68 53 72 79 50 67 28 79 32 53 14 35 39 31Z"/><circle cx="50" cy="50" r="11"/></svg></div></div><div id="ih-content" class="ih-card"><div class="ih-loading"><div><div class="ih-pulse"></div><p>جاري تجهيز المحتوى...</p></div></div></div></div></div>';
}
async function renderQuran(container){
  container.innerHTML=shell('quran','القرآن الكريم','تلاوة وقراءة هادئة بواجهة سريعة، محلية، ومهيأة للهاتف وPWA.','☾');
  const box=container.querySelector('#ih-content'), surahs=await loadLocal('quran');
  if(!surahs.length){box.innerHTML='<div class="ih-empty">تعذر العثور على ملف القرآن المحلي. ضع الملف quran.json أو data/quran.json وسيعمل تلقائياً.</div>';return;}
  box.innerHTML='<div class="ih-meta"><span>سور القرآن الكريم</span><span>'+surahs.length+' سورة</span></div><div class="ih-surah-list">'+surahs.map((s,i)=>'<button class="ih-surah" data-i="'+i+'">'+escapeHtml(s.name)+'<br><small>'+s.ayahs.length+' آية</small></button>').join('')+'</div><div id="quran-reader" class="ih-results" style="margin-top:22px"></div>';
  const reader=box.querySelector('#quran-reader'), render=i=>{const s=surahs[i]; reader.innerHTML='<div class="ih-meta"><span>سورة '+escapeHtml(s.name)+'</span><button class="ih-btn" id="back-surahs">السور</button></div>'+s.ayahs.map(a=>'<div class="ih-ayah">'+escapeHtml(a.text)+' <span class="ih-ayah-num">'+a.n+'</span></div>').join(''); reader.scrollIntoView({behavior:'smooth',block:'start'});};
  box.querySelectorAll('.ih-surah').forEach(b=>b.onclick=()=>render(Number(b.dataset.i)));
}
async function renderHadith(container){
  container.innerHTML=shell('hadith','الأحاديث الشريفة','ابحث في نصوص الأحاديث ومصادرها بسرعة، مع إزالة التشكيل وتوحيد الهمزات تلقائياً.','✦');
  const box=container.querySelector('#ih-content'), hadith=await loadLocal('hadith');
  if(!hadith.length){box.innerHTML='<div class="ih-empty">تعذر العثور على ملف الأحاديث المحلي. ضع الملف hadith.json أو data/hadith.json وسيعمل تلقائياً.</div>';return;}
  box.innerHTML='<div class="ih-tools"><input id="hadith-q" class="ih-input" placeholder="ابحث في الأحاديث: اكتب بدون تشكيل أو همزات..."><button class="ih-btn" id="hadith-clear">مسح</button></div><div id="hadith-results" class="ih-results"></div>';
  const input=box.querySelector('#hadith-q'), out=box.querySelector('#hadith-results');
  const draw=()=>{const q=stripArabic(input.value);const rows=q?hadith.filter(h=>stripArabic(h.text+' '+h.book+' '+h.chapter).includes(q)):hadith.slice(0,30);out.innerHTML=rows.length?rows.slice(0,100).map(h=>'<article class="ih-result"><div class="ih-meta"><b>'+escapeHtml(h.book)+'</b><span>#'+h.id+'</span></div><div>'+escapeHtml(h.text)+'</div>'+(h.chapter?'<small style="color:var(--ih-muted)">'+escapeHtml(h.chapter)+'</small>':'')+'</article>').join(''):'<div class="ih-empty">لا توجد نتائج مطابقة.</div>'};
  let t;input.oninput=()=>{clearTimeout(t);t=setTimeout(draw,80)};box.querySelector('#hadith-clear').onclick=()=>{input.value='';draw()};draw();
}
async function renderQuranSearch(container){
  container.innerHTML=shell('search','الباحث في القرآن الكريم','اكتب أي كلمة أو عبارة؛ البحث يتجاهل التشكيل والهمزات والاختلافات الإملائية ليصل إلى الآية بأقل زمن ممكن.','⌕');
  const box=container.querySelector('#ih-content'), surahs=await loadLocal('quran');
  if(!surahs.length){box.innerHTML='<div class="ih-empty">تعذر العثور على ملف القرآن المحلي. ضع quran.json أو data/quran.json.</div>';return;}
  const verses=surahs.flatMap(s=>s.ayahs.map(a=>({s:s.name,sn:s.number,n:a.n,text:a.text}))), index=verses.map(v=>({key:stripArabic(v.text),v}));
  box.innerHTML='<div class="ih-tools"><input id="quran-q" class="ih-input" autofocus placeholder="مثال: الحمد لله أو الرحمن أو الصلاة..."><span class="ih-btn" style="cursor:default">بحث فوري</span></div><div id="quran-results" class="ih-results"></div>';
  const input=box.querySelector('#quran-q'),out=box.querySelector('#quran-results');
  const highlight=(text,q)=>{if(!q)return escapeHtml(text);const n=stripArabic(text),needle=stripArabic(q);const at=n.indexOf(needle);if(at<0)return escapeHtml(text);return escapeHtml(text.slice(0,at))+'<mark>'+escapeHtml(text.slice(at,at+needle.length))+'</mark>'+escapeHtml(text.slice(at+needle.length))};
  const draw=()=>{const q=stripArabic(input.value);if(!q){out.innerHTML='<div class="ih-empty">ابدأ بكتابة كلمة للبحث في القرآن الكريم.</div>';return} const rows=index.filter(x=>x.key.includes(q)).slice(0,80);out.innerHTML=rows.length?rows.map(x=>'<article class="ih-result"><div class="ih-meta"><b>سورة '+escapeHtml(x.v.s)+'</b><span>آية '+x.v.n+'</span></div><div class="ih-ayah" style="border:0;padding:4px 0">'+highlight(x.v.text,q)+'</div></article>').join(''):'<div class="ih-empty">لم نجد آية مطابقة لهذه الكلمة.</div>'};
  let t;input.oninput=()=>{clearTimeout(t);t=setTimeout(draw,40)};draw();
}
export {renderQuran,renderHadith,renderQuranSearch};
