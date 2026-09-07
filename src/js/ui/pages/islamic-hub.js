/* Premium Islamic Hub — local-first, zero D1/Firebase for Islamic data */
const QURAN_META_URL = './quran/source/surah.json';
const QURAN_SURAH_URL = n => './quran/source/surah/surah_' + n + '.json';

const HADITH_BOOKS = [
  {id:1,title:'صحيح البخاري',path:['the_9_books','bukhari'],chapters:97},
  {id:2,title:'صحيح مسلم',path:['the_9_books','muslim'],chapters:57},
  {id:3,title:'سنن النسائي',path:['the_9_books','nasai'],chapters:52},
  {id:4,title:'سنن أبي داود',path:['the_9_books','abudawud'],chapters:43},
  {id:5,title:'جامع الترمذي',path:['the_9_books','tirmidhi'],chapters:49},
  {id:6,title:'سنن ابن ماجه',path:['the_9_books','ibnmajah'],chapters:38},
  {id:7,title:'موطأ مالك',path:['the_9_books','malik'],chapters:61},
  {id:8,title:'مسند الإمام أحمد بن حنبل',path:['the_9_books','ahmed'],chapters:8},
  {id:9,title:'سنن الدارمي',path:['the_9_books','darimi'],chapters:24},
  {id:10,title:'الأربعون النووية',path:['forties','nawawi40'],chapters:1},
  {id:11,title:'الأربعون القدسية',path:['forties','qudsi40'],chapters:1},
  {id:12,title:'أربعون ولي الله الدهلوي',path:['forties','shahwaliullah40'],chapters:1},
  {id:13,title:'رياض الصالحين',path:['other_books','riyad_assalihin'],chapters:20},
  {id:14,title:'مشكاة المصابيح',path:['other_books','mishkat_almasabih'],chapters:25},
  {id:15,title:'الأدب المفرد',path:['other_books','aladab_almufrad'],chapters:57},
  {id:16,title:'الشمائل المحمدية',path:['other_books','shamail_muhammadiyah'],chapters:57},
  {id:17,title:'بلوغ المرام',path:['other_books','bulugh_almaram'],chapters:16}
];

const cache = new Map();
const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function norm(v){
  return String(v??'').normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'')
    .replace(/[إأآٱ]/g,'ا').replace(/[ؤئ]/g,'و').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ء/g,'')
    .replace(/[ٱ]/g,'ا').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^\u0621-\u063A\u0641-\u064A0-9a-zA-Z\s]/g,' ')
    .replace(/\s+/g,' ').trim().toLowerCase();
}

async function getJson(url){
  if(cache.has(url)) return cache.get(url);
  const p=fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r.json()});
  cache.set(url,p);
  try{return await p}catch(e){cache.delete(url);throw e}
}

function shell(title,sub,icon){
 return '<div class="islamic-hub"><div class="ih-wrap">'+
 '<section class="ih-hero"><div class="ih-hero-copy">'+
 '<span class="ih-kicker">✦ القسم الإسلامي · دليل المنزلة والمطرية</span>'+
 '<h1 class="ih-title">'+icon+' '+title+'</h1><p class="ih-sub">'+sub+'</p>'+
 '<div class="ih-tools"><a class="ih-btn" href="index.html">الرئيسية</a><a class="ih-btn" href="quran-search.html">الباحث القرآني</a><a class="ih-btn" href="hadith.html">الأحاديث</a></div>'+
 '</div><div class="ih-ornament"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 7l10 20 22 3-16 16 4 23-20-11-20 11 4-23-16-16 22-3z"/><circle cx="50" cy="50" r="12"/></svg></div></section>'+
 '<section id="ih-content" class="ih-card"><div class="ih-loading"><div><div class="ih-pulse"></div><p>جاري تجهيز المحتوى محلياً…</p></div></div></section></div></div>';
}

async function loadQuranMeta(){
 const raw=await getJson(QURAN_META_URL);
 return (raw||[]).map((s,i)=>({number:Number(s.index)||i+1,name:s.titleAr||s.title||('سورة '+(i+1)),count:Number(s.count)||0,type:s.type||'',place:s.place||''}));
}
async function loadSurah(n){
 const raw=await getJson(QURAN_SURAH_URL(n));
 const verses=Object.entries(raw?.verse||{}).map(([k,text],i)=>({n:Number(k.replace(/\D/g,''))||i+1,text:String(text||'').replace(/^\uFEFF/, '')})).filter(x=>x.text);
 return {number:Number(raw.index)||n,name:raw.name||'',ayahs:verses};
}
async function loadAllQuran(){
 if(cache.has('__all_quran__')) return cache.get('__all_quran__');
 const promise=(async()=>{
   const meta=await loadQuranMeta();
   const chunks=await Promise.all(meta.map(s=>loadSurah(s.number)));
   return chunks;
 })();
 cache.set('__all_quran__',promise);
 return promise;
}

function score(text,q){
 const t=norm(text); if(!q)return 0;
 if(t===q)return 1000;if(t.includes(q))return 700;
 const ws=q.split(' ').filter(Boolean); const hit=ws.filter(w=>t.includes(w)).length;
 return hit?(hit*100+(hit===ws.length?50:0)):0;
}

async function renderQuran(container){
 container.innerHTML=shell('القرآن الكريم','تلاوة القرآن الكريم محلياً بسرعة عالية، مع تحميل السورة عند اختيارها ودعم PWA.','✦');
 const box=container.querySelector('#ih-content');
 try{
   const meta=await loadQuranMeta();
   box.innerHTML='<div class="ih-meta"><b>سور القرآن الكريم</b><span>'+meta.length+' سورة</span></div>'+
   '<div class="ih-surah-list">'+meta.map(s=>'<button class="ih-surah" data-surah="'+s.number+'"><strong>'+esc(s.name)+'</strong><small>'+s.count+' آية · '+esc(s.type)+'</small></button>').join('')+'</div>'+
   '<div id="quran-reader" class="ih-results"></div>';
   const reader=box.querySelector('#quran-reader');
   box.querySelectorAll('.ih-surah').forEach(btn=>btn.addEventListener('click',async()=>{
     reader.innerHTML='<div class="ih-loading"><div><div class="ih-pulse"></div><p>جاري فتح السورة…</p></div></div>';
     try{
       const s=await loadSurah(Number(btn.dataset.surah));
       reader.innerHTML='<div class="ih-meta"><b>سورة '+esc(meta.find(x=>x.number===s.number)?.name||s.name)+'</b><button class="ih-btn" id="back-surahs">السور</button></div>'+
       s.ayahs.map(a=>'<div class="ih-ayah">'+esc(a.text)+' <span class="ih-ayah-num">'+a.n+'</span></div>').join('');
       reader.querySelector('#back-surahs').onclick=()=>box.querySelector('.ih-surah-list').scrollIntoView({behavior:'smooth'});
       reader.scrollIntoView({behavior:'smooth',block:'start'});
     }catch(e){reader.innerHTML='<div class="ih-empty">تعذر تحميل السورة محلياً.</div>'}
   }));
 }catch(e){box.innerHTML='<div class="ih-empty">تعذر قراءة ملفات القرآن المحلية.</div>';console.error('[IslamicHub] Quran',e)}
}

async function renderQuranSearch(container){
 container.innerHTML=shell('الباحث في القرآن الكريم','اكتب بأي طريقة: الإسعاف/الاسعاف، الرحمن/الرحمٰن، أو بدون همزات وتشكيل. الفهرسة محلية بالكامل ولا تستخدم D1 أو Firebase.','⌕');
 const box=container.querySelector('#ih-content');
 box.innerHTML='<div class="ih-search-head"><input id="quran-q" class="ih-input" autofocus placeholder="ابحث بكلمة أو آية…" autocomplete="off" inputmode="search"><span id="quran-count" class="ih-count">جاهز</span></div><div id="quran-results" class="ih-results"><div class="ih-empty">ابدأ البحث وستظهر النتائج هنا.</div></div>';
 const input=box.querySelector('#quran-q'),out=box.querySelector('#quran-results'),count=box.querySelector('#quran-count');
 let index=null,timer=null;
 const ensure=async()=>{if(index)return index;count.textContent='جاري تجهيز الفهرس…';const surahs=await loadAllQuran();index=surahs.flatMap(s=>s.ayahs.map(a=>({sn:s.number,snName:s.name,n:a.n,text:a.text,key:norm(a.text)})));return index};
 const draw=async()=>{
   const q=norm(input.value);if(!q){out.innerHTML='<div class="ih-empty">اكتب كلمة للبحث في القرآن الكريم.</div>';count.textContent='جاهز';return}
   const data=await ensure();
   const rows=data.map(v=>({v,s:score(v.text,q)})).filter(x=>x.s).sort((a,b)=>b.s-a.s).slice(0,80).map(x=>x.v);
   count.textContent=rows.length+' نتيجة';
   out.innerHTML=rows.length?rows.map(v=>'<article class="ih-result"><div class="ih-meta"><b>سورة '+esc(v.snName)+'</b><span>آية '+v.n+'</span></div><div class="ih-ayah">'+highlight(v.text,q)+'</div></article>').join(''):'<div class="ih-empty">لا توجد نتائج مطابقة.</div>';
 };
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>draw(),20)});
}

function highlight(text,q){
 const safe=esc(text); const nq=norm(q); if(!nq)return safe;
 const parts=safe.split(/(\s+)/); return parts.map(p=>norm(p).includes(nq)?'<mark>'+p+'</mark>':p).join('');
}

async function loadHadithBook(book){
 const key='hadith:'+book.id;if(cache.has(key))return cache.get(key);
 const p=(async()=>{
   const files=Array.from({length:book.chapters},(_,i)=>String(i+1));
   if(book.id===2)files.unshift('introduction');
   if(book.id===6)files.unshift('introduction');
   if(book.id===9)files.unshift('introduction');
   if(book.chapters===1)files[0]='';
   const results=await Promise.all(files.map(async ch=>{
     const file=ch?ch+'.json':'all.json';
     const url='./hadith/db/by_chapter/'+book.path[0]+'/'+book.path[1]+'/'+file;
     try{return await getJson(url)}catch(_){return null}
   }));
   return results.flatMap(x=>Array.isArray(x?.hadiths)?x.hadiths:[]);
 })();
 cache.set(key,p);return p;
}

async function renderHadith(container){
 container.innerHTML=shell('الأحاديث الشريفة','تصفح كتب الحديث المحلية، وحمّل الكتاب عند الحاجة فقط للحفاظ على السرعة واستهلاك أقل للبيانات.','۞');
 const box=container.querySelector('#ih-content');
 box.innerHTML='<div class="ih-meta"><b>كتب الحديث</b><span>17 كتاباً</span></div><div class="ih-book-grid">'+
 HADITH_BOOKS.map(b=>'<button class="ih-book" data-id="'+b.id+'"><span class="ih-book-icon">۞</span><strong>'+esc(b.title)+'</strong><small>'+b.chapters+' فصول تقريباً</small></button>').join('')+'</div><div id="hadith-panel" class="ih-results"></div>';
 const panel=box.querySelector('#hadith-panel');
 box.querySelectorAll('.ih-book').forEach(btn=>btn.addEventListener('click',async()=>{
   const book=HADITH_BOOKS.find(b=>b.id===Number(btn.dataset.id));
   panel.innerHTML='<div class="ih-loading"><div><div class="ih-pulse"></div><p>جاري تحميل '+esc(book.title)+' محلياً…</p></div></div>';
   try{
     const hadith=await loadHadithBook(book);
     panel.innerHTML='<div class="ih-search-head"><input class="ih-input" id="hadith-q" placeholder="ابحث داخل '+esc(book.title)+'…" autocomplete="off"><span id="hadith-count" class="ih-count">'+hadith.length+' حديث</span></div><div id="hadith-list" class="ih-results"></div>';
     const input=panel.querySelector('#hadith-q'),list=panel.querySelector('#hadith-list'),count=panel.querySelector('#hadith-count');
     const draw=()=>{
       const q=norm(input.value);const rows=(q?hadith.map(h=>({h,s:score((h.arabic||'')+' '+(h.english?.text||''),q)})).filter(x=>x.s).sort((a,b)=>b.s-a.s).slice(0,100).map(x=>x.h):hadith.slice(0,30));
       count.textContent=(q?rows.length:Math.min(30,hadith.length))+' حديث';
       list.innerHTML=rows.length?rows.map(h=>'<article class="ih-result"><div class="ih-meta"><b>'+esc(book.title)+'</b><span>#'+esc(h.idInBook||h.id)+'</span></div><div class="ih-hadith">'+esc(h.arabic||'')+'</div></article>').join(''):'<div class="ih-empty">لا توجد نتائج.</div>';
     };
     input.addEventListener('input',draw);draw();
     panel.scrollIntoView({behavior:'smooth',block:'start'});
   }catch(e){panel.innerHTML='<div class="ih-empty">تعذر تحميل هذا الكتاب من الملفات المحلية.</div>';console.error('[IslamicHub] Hadith',e)}
 }));
}

export {renderQuran,renderHadith,renderQuranSearch};
