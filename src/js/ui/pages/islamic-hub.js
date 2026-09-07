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
   box.innerHTML='<div class="ih-meta"><b>سور القرآن الكريم</b><span>'+meta.length+' سورة · اختر السورة لفتح صفحة مستقلة</span></div>'+
   '<div class="ih-surah-list">'+meta.map(s=>'<a class="ih-surah" href="quran-surah.html?surah='+s.number+'"><strong>'+esc(s.name)+'</strong><small>'+s.count+' آية · '+esc(s.type)+'</small></a>').join('')+'</div>';
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

function tajweedHtml(text,rules){
 const arr=Array.isArray(rules)?rules.slice().sort((a,b)=>a.start-b.start):[];
 if(!arr.length)return esc(text);
 let out='',pos=0;
 for(const r of arr){
   const st=Math.max(0,Number(r.start)||0),en=Math.min(text.length,Number(r.end)||0);
   if(st<pos||en<=st)continue;
   out+=esc(text.slice(pos,st));
   out+='<span class="tw-'+esc(r.rule)+'">'+esc(text.slice(st,en))+'</span>';
   pos=en;
 }
 return out+esc(text.slice(pos));
}
async function loadTajweed(n){try{return await getJson('./quran/source/tajweed/surah_'+n+'.json')}catch(_){return null}}
async function loadAudioIndex(n){try{return await getJson('./quran/source/audio/'+String(n).padStart(3,'0')+'/index.json')}catch(_){return null}}
async function loadEnglishTranslation(n){try{return await getJson('./quran/source/translation/en/en_translation_'+n+'.json')}catch(_){return null}}

async function renderQuranSurah(container){
 const p=new URLSearchParams(location.search),n=Math.min(114,Math.max(1,Number(p.get('surah')||1)||1));
 container.innerHTML=shell('القرآن الكريم','صفحة مستقلة للسورة · قراءة محلية · تجويد · تلاوة صوتية · تعمل مع PWA.','✦');
 const box=container.querySelector('#ih-content');
 try{
  const meta=await loadQuranMeta(),info=meta.find(x=>x.number===n)||{name:'السورة',count:0};
  const s=await loadSurah(n),[tw,audio,en]=await Promise.all([loadTajweed(n),loadAudioIndex(n),loadEnglishTranslation(n)]);
  const rules=tw?.verse||{},av=audio?.verse||{},ev=en?.verse||{};
  box.innerHTML='<div class="ih-reader"><div class="qr-head"><h2 class="qr-title">سورة '+esc(info.name||s.name)+'</h2><p class="qr-sub">'+s.ayahs.length+' آية · '+esc(info.type||'القرآن الكريم')+'</p>'+ 
  '<div class="qr-actions"><select id="qr-font" class="qr-select"><option value="1">حجم الخط: متوسط</option><option value="1.15">حجم الخط: كبير</option><option value=".9">حجم الخط: صغير</option></select>'+ 
  '<select id="qr-reciter" class="qr-select" aria-label="اختيار القارئ"><option value="local">التلاوة المحلية المتاحة</option></select><select id="qr-lang" class="qr-select" aria-label="عرض الترجمة"><option value="ar">العربية</option><option value="en">English · الترجمة الإنجليزية</option><option value="both">العربية + English</option></select><button id="qr-play-all" class="qr-btn" type="button">▶ تشغيل السورة</button><button id="qr-tw" class="qr-btn" type="button">تفعيل التجويد</button><a class="qr-btn" href="quran.html">السور</a><a class="qr-btn" href="quran-search.html">الباحث</a></div>'+ 
  '<div class="qr-legend" id="qr-legend" hidden><span>الأزرق: همزة وصل</span><span>الذهبي: لام شمسية</span><span>البنفسجي: مد</span></div></div>'+ 
  '<div id="qr-list">'+s.ayahs.map(a=>{const f=av['verse_'+a.n]?.file||av['verse_'+(a.n-1)]?.file,et=ev['verse_'+a.n]||ev['verse_'+(a.n-1)]||'';return '<article class="qr-ayah" id="ayah-'+a.n+'"><span class="qr-num">'+a.n+'</span><div class="qr-main"><div class="qr-text" data-base="'+esc(a.text)+'">'+esc(a.text)+'</div><button class="qr-play" type="button" aria-label="تشغيل الآية '+a.n+'">▶</button></div>'+(et?'<div class="qr-translation" data-en="'+esc(et)+'">'+esc(et)+'</div>':'')+(f?'<audio class="qr-audio" preload="metadata" src="./quran/source/audio/'+String(n).padStart(3,'0')+'/'+encodeURIComponent(f)+'"></audio>':'<audio class="qr-audio" preload="none"></audio>')+'</article>'}).join('')+'</div>'+ 
  '<div class="qr-nav">'+(n>1?'<a class="qr-btn" href="quran-surah.html?surah='+(n-1)+'">السورة السابقة</a>':'<span></span>')+(n<114?'<a class="qr-btn" href="quran-surah.html?surah='+(n+1)+'">السورة التالية</a>':'<span></span>')+'</div></div>';
  let twOn=false,activeIndex=-1,playingAll=false;
  const cards=[...box.querySelectorAll('.qr-ayah')],texts=[...box.querySelectorAll('.qr-text')],audios=[...box.querySelectorAll('.qr-audio')],plays=[...box.querySelectorAll('.qr-play')];
  const clearActive=()=>{cards.forEach(c=>c.classList.remove('is-playing'));texts.forEach(t=>t.classList.remove('is-reading'));plays.forEach(b=>b.textContent='▶');};
  const scrollTo=i=>cards[i]?.scrollIntoView({behavior:'smooth',block:'center'});
  const start=async i=>{if(i<0||i>=audios.length)return;audios.forEach((a,j)=>{if(j!==i){a.pause();a.currentTime=0}});clearActive();activeIndex=i;cards[i].classList.add('is-playing');texts[i].classList.add('is-reading');plays[i].textContent='❚❚';scrollTo(i);if(!audios[i].src){clearActive();activeIndex=-1;return}try{audios[i].currentTime=0;await audios[i].play()}catch(_){clearActive();activeIndex=-1;playingAll=false}};
  const next=async()=>{const ni=activeIndex+1;if(playingAll&&ni<audios.length){await start(ni);return}playingAll=false;box.querySelector('#qr-play-all').textContent='▶ تشغيل السورة';clearActive();activeIndex=-1};
  audios.forEach((a,i)=>{a.addEventListener('ended',()=>{if(activeIndex===i)next()});a.addEventListener('play',()=>{clearActive();activeIndex=i;cards[i].classList.add('is-playing');texts[i].classList.add('is-reading');plays[i].textContent='❚❚'});});
  plays.forEach((b,i)=>b.addEventListener('click',async()=>{if(activeIndex===i&&!audios[i].paused){playingAll=false;audios[i].pause();clearActive();activeIndex=-1;return}playingAll=false;await start(i)}));
  box.querySelector('#qr-play-all').onclick=async()=>{if(playingAll){playingAll=false;audios[activeIndex]?.pause();box.querySelector('#qr-play-all').textContent='▶ تشغيل السورة';clearActive();activeIndex=-1;return}const first=audios.findIndex(a=>!!a.src);if(first<0)return;playingAll=true;box.querySelector('#qr-play-all').textContent='❚❚ إيقاف السورة';await start(first)};
  box.querySelector('#qr-reciter').onchange=()=>{audios.forEach(a=>{a.pause();a.currentTime=0});playingAll=false;clearActive();activeIndex=-1};
  const applyLanguage=()=>{const mode=box.querySelector('#qr-lang').value;cards.forEach(card=>{const ar=card.querySelector('.qr-text'),en=card.querySelector('.qr-translation');if(!en)return;ar.style.display=mode==='en'?'none':'block';en.style.display=mode==='ar'?'none':'block'})};
  box.querySelector('#qr-lang').onchange=applyLanguage;applyLanguage();
  const renderTw=()=>{texts.forEach((el,i)=>{const a=s.ayahs[i];el.innerHTML=twOn?'<span class="qr-tajweed">'+tajweedHtml(a.text,rules['verse_'+a.n])+'</span> <span class="qr-num">'+a.n+'</span>':esc(a.text)+' <span class="qr-num">'+a.n+'</span>'});box.querySelector('#qr-legend').hidden=!twOn;};
  box.querySelector('#qr-tw').onclick=()=>{twOn=!twOn;box.querySelector('#qr-tw').textContent=twOn?'إيقاف التجويد':'تفعيل التجويد';renderTw()};
  box.querySelector('#qr-font').onchange=e=>texts.forEach(el=>el.style.fontSize=(1.65*Number(e.target.value))+'rem');
 }catch(e){box.innerHTML='<div class="ih-empty">تعذر فتح السورة. تأكد من رقم السورة والملفات المحلية.</div>';console.error('[IslamicHub] Surah',e)}
}

export {renderQuran,renderHadith,renderQuranSearch,renderQuranSurah};
