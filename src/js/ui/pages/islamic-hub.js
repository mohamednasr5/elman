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

const LAST_READ_KEY = 'manzala_quran_last_read';
const FAVS_KEY = 'manzala_quran_favs';

function getLastRead(){
  try{
    const raw=localStorage.getItem(LAST_READ_KEY);
    return raw?JSON.parse(raw):null;
  }catch(_){return null;}
}

function setLastRead(data){
  try{
    localStorage.setItem(LAST_READ_KEY,JSON.stringify({...data,timestamp:Date.now()}));
  }catch(_){}
}

function getFavorites(){
  try{
    const raw=localStorage.getItem(FAVS_KEY);
    return raw?JSON.parse(raw):[];
  }catch(_){return [];}
}

function toggleFavorite(data){
  try{
    let list=getFavorites();
    const key=`${data.surahNumber}:${data.ayahNumber}`;
    const idx=list.findIndex(x=>x.key===key);
    let fav=false;
    if(idx>=0){
      list.splice(idx,1);
      fav=false;
    }else{
      list.push({key,surahNumber:data.surahNumber,surahName:data.surahName,ayahNumber:data.ayahNumber,text:data.text,timestamp:Date.now()});
      fav=true;
    }
    localStorage.setItem(FAVS_KEY,JSON.stringify(list));
    return fav;
  }catch(_){return false;}
}

function showToast(msg){
  let t=document.getElementById('qr-global-toast');
  if(!t){
    t=document.createElement('div');
    t.id='qr-global-toast';
    t.className='qr-toast';
    document.body.appendChild(t);
  }
  t.textContent=msg;
  t.classList.add('is-visible');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{t.classList.remove('is-visible');},3200);
}

function renderLastReadBanner(currentSurah=null){
  const item=getLastRead();
  if(!item||!item.surahNumber) return '';
  const isSameSurah=currentSurah&&Number(currentSurah)===Number(item.surahNumber);
  const targetHref=isSameSurah?`#ayah-${item.ayahNumber}`:`quran-surah.html?surah=${item.surahNumber}#ayah-${item.ayahNumber}`;
  return `<div class="ih-last-read-banner" id="ih-last-read-banner" role="region" aria-label="آخر موضع توقفت عنده">
    <div class="ih-last-read-inner">
      <div class="ih-last-read-emblem">
        <span class="ih-last-read-icon">🔖</span>
      </div>
      <div class="ih-last-read-body">
        <span class="ih-last-read-kicker">آخر ما توقفت عنده في التلاوة</span>
        <strong class="ih-last-read-title">سورة ${esc(item.surahName||('سورة '+item.surahNumber))} · آية ${item.ayahNumber}</strong>
        <p class="ih-last-read-snippet">«${esc(item.text||'')}»</p>
      </div>
      <a class="ih-last-read-btn" id="ih-resume-btn" href="${targetHref}">
        <span>متابعة التلاوة</span>
        <span class="ih-last-read-arrow">←</span>
      </a>
    </div>
  </div>`;
}

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

function shell(title,sub,icon,showAyah=true){
 const heroSlot = showAyah
  ? `<div class="ih-ayah-today" id="ih-ayah-today"><div class="ih-ayah-today-label">آية اليوم</div><div class="ih-ayah-today-text"><div class="ih-pulse"></div></div><div class="ih-ayah-today-meta">جاري اختيار آية عشوائية من المصحف الشريف…</div></div>`
  : `<div class="ih-hadith-emblem" role="region" aria-label="حديث شريف: بلِّغوا عني ولو آية"><div class="ih-hadith-emblem-inner"><div class="ih-hadith-emblem-header"><span class="ih-hadith-emblem-star">۞</span><span class="ih-hadith-emblem-prefix">قال النبي ﷺ</span><span class="ih-hadith-emblem-star">۞</span></div><div class="ih-hadith-emblem-text">«بلِّغوا عني ولو آية»</div><div class="ih-hadith-emblem-footer"><span class="ih-hadith-emblem-rule"></span><span class="ih-hadith-emblem-sub">صحيح البخاري</span><span class="ih-hadith-emblem-rule"></span></div></div><span class="ih-quran-shine" aria-hidden="true"></span></div>`;
 const subtitle = sub ? `<p class="ih-sub">${esc(sub)}</p>` : '';
 return `<div class="islamic-hub"><div class="ih-wrap">
 <section class="ih-hero"><div class="ih-hero-copy">
 <span class="ih-kicker">✦ القسم الإسلامي · دليل المنزلة والمطرية</span>
 <h1 class="ih-title">${esc(icon)} ${esc(title)}</h1>
 ${subtitle}
 <div class="ih-tools">
   <a class="ih-btn" href="index.html">الرئيسية</a>
   <a class="ih-btn" href="quran.html">المصحف الشريف</a>
   <a class="ih-btn" href="qibla.html">🧭 اتجاه القبلة</a>
   <a class="ih-btn" href="quran-search.html">الباحث القرآني</a>
   <a class="ih-btn" href="hadith.html">الأحاديث</a>
 </div>
 </div><div class="ih-ornament ih-hero-slot">${heroSlot}</div></section>
 <section id="ih-content" class="ih-card"><div class="ih-loading"><div><div class="ih-pulse"></div><p>جاري تجهيز المحتوى محلياً…</p></div></div></section></div></div>`;
}

async function mountDailyAyah(container){
 const today=container?.querySelector('#ih-ayah-today');
 if(!today)return;
 try{
  const meta=await loadQuranMeta();
  if(!meta.length)throw new Error('Quran metadata is empty');
  const chosen=meta[Math.floor(Math.random()*meta.length)];
  const surah=await loadSurah(chosen.number);
  if(!surah.ayahs.length)throw new Error('Selected surah has no ayahs');
  const ayah=surah.ayahs[Math.floor(Math.random()*surah.ayahs.length)];
  today.innerHTML='<div class="ih-ayah-today-label">آية اليوم</div><div class="ih-ayah-today-text">'+esc(ayah.text)+'</div><div class="ih-ayah-today-meta"><a href="quran-surah.html?surah='+chosen.number+'">سورة '+esc(chosen.name||surah.name)+'</a> · آية '+ayah.n+'</div>';
 }catch(e){
  today.innerHTML='<div class="ih-ayah-today-label">آية اليوم</div><div class="ih-ayah-today-text">تعذر تحميل الآية الآن.</div>';
  console.error('[IslamicHub] Daily Ayah',e);
 }
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
 const promise=(async()=>{ const meta=await loadQuranMeta(); return Promise.all(meta.map(s=>loadSurah(s.number))); })();
 cache.set('__all_quran__',promise); return promise;
}
function score(text,q){ const t=norm(text); if(!q)return 0; if(t===q)return 1000;if(t.includes(q))return 700; const ws=q.split(' ').filter(Boolean); const hit=ws.filter(w=>t.includes(w)).length; return hit?(hit*100+(hit===ws.length?50:0)):0; }
async function renderQuran(container){
 container.innerHTML=shell('القرآن الكريم','تلاوة القرآن الكريم محلياً بسرعة عالية، مع تحميل السورة عند اختيارها ودعم PWA.','✦');
 const box=container.querySelector('#ih-content'),today=container.querySelector('#ih-ayah-today');
 try{
  const meta=await loadQuranMeta();
  await mountDailyAyah(container);
  const lastReadHtml=renderLastReadBanner();
  box.innerHTML=lastReadHtml+'<div class="ih-meta"><b>سور القرآن الكريم</b><span>'+meta.length+' سورة · اختر السورة لفتح صفحة مستقلة</span></div><div class="ih-surah-list">'+meta.map((s,i)=>'<a class="ih-surah" style="--i:'+i+'" href="quran-surah.html?surah='+s.number+'"><strong>'+esc(s.name)+'</strong><small>'+s.count+' آية · '+esc(s.type)+'</small></a>').join('')+'</div>';
 }catch(e){
  if(today)today.innerHTML='<div class="ih-ayah-today-label">آية اليوم</div><div class="ih-ayah-today-text">تعذر تحميل الآية الآن.</div>';
  box.innerHTML='<div class="ih-empty">تعذر قراءة ملفات القرآن المحلية.</div>';console.error('[IslamicHub] Quran',e)
 }
}
async function renderQuranSearch(container){
 container.innerHTML=shell('الباحث في القرآن الكريم','','⌕');
 await mountDailyAyah(container);
 const box=container.querySelector('#ih-content');
 box.innerHTML='<div class="ih-search-head"><input id="quran-q" class="ih-input" autofocus placeholder="ابحث بكلمة أو آية…" autocomplete="off" inputmode="search"><span id="quran-count" class="ih-count">جاهز</span></div><div id="quran-results" class="ih-results"><div class="ih-empty">ابدأ البحث وستظهر النتائج هنا.</div></div>';
 const input=box.querySelector('#quran-q'),out=box.querySelector('#quran-results'),count=box.querySelector('#quran-count');
 let index=null,timer=null,activeAudio=null;
 const ensure=async()=>{
   if(index)return index;
   count.textContent='جاري تجهيز الفهرس…';
   const surahs=await loadAllQuran();
   const rows=await Promise.all(surahs.map(async s=>{
     const ai=await loadAudioIndex(s.number);
     const av=ai?.verse||{};
     return s.ayahs.map(a=>({sn:s.number,snName:s.name,n:a.n,text:a.text,key:norm(a.text),file:av['verse_'+a.n]?.file||av['verse_'+(a.n-1)]?.file||''}));
   }));
   index=rows.flat();
   return index;
 };
 const highlight=(text,q)=>{
   const safe=esc(text),nq=norm(q);
   if(!nq)return safe;
   const parts=safe.split(/(\s+)/);
   return parts.map(p=>norm(p).includes(nq)?'<mark>'+p+'</mark>':p).join('');
 };
 const stopAudio=()=>{
   if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null;}
   out.querySelectorAll('.ih-result').forEach(x=>x.classList.remove('is-playing'));
   out.querySelectorAll('.ih-result-play').forEach(x=>x.textContent='▶');
 };
 const playResult=(v,card,button)=>{
   if(!v.file)return;
   if(activeAudio&&activeAudio.src===new URL('./quran/source/audio/'+String(v.sn).padStart(3,'0')+'/'+encodeURIComponent(v.file),location.href).href&&!activeAudio.paused){stopAudio();return;}
   stopAudio();
   const audio=document.createElement('audio');
   audio.preload='metadata';
   audio.src='./quran/source/audio/'+String(v.sn).padStart(3,'0')+'/'+encodeURIComponent(v.file);
   audio.addEventListener('ended',()=>{card.classList.remove('is-playing');button.textContent='▶';activeAudio=null;});
   audio.addEventListener('error',()=>{card.classList.remove('is-playing');button.textContent='▶';activeAudio=null;});
   card.classList.add('is-playing');
   button.textContent='❚❚';
   activeAudio=audio;
   audio.play().catch(()=>{card.classList.remove('is-playing');button.textContent='▶';activeAudio=null;});
 };
 const draw=async()=>{
   const q=norm(input.value);
   stopAudio();
   if(!q){out.innerHTML='<div class="ih-empty">اكتب كلمة للبحث في القرآن الكريم.</div>';count.textContent='جاهز';return}
   const data=await ensure();
   const rows=data.map(v=>({v,s:score(v.text,q)})).filter(x=>x.s).sort((a,b)=>b.s-a.s).slice(0,80).map(x=>x.v);
   count.textContent=rows.length+' نتيجة';
   out.innerHTML=rows.length?rows.map(v=>'<article class="ih-result"><div class="ih-meta"><b>سورة '+esc(v.snName)+'</b><span>آية '+v.n+'</span></div><div class="ih-result-content"><div class="ih-ayah">'+highlight(v.text,q)+'</div>'+(v.file?'<button class="ih-result-play" type="button" aria-label="تشغيل الآية '+v.n+'">▶</button>':'')+'</div></article>').join(''):'<div class="ih-empty">لا توجد نتائج مطابقة.</div>';
   out.querySelectorAll('.ih-result').forEach((card,i)=>{const button=card.querySelector('.ih-result-play');if(button)button.addEventListener('click',()=>playResult(rows[i],card,button));});
 };
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>draw(),20)});
}
async function loadHadithBook(book){ const key='hadith:'+book.id;if(cache.has(key))return cache.get(key);const p=(async()=>{const files=Array.from({length:book.chapters},(_,i)=>String(i+1));if(book.id===2)files.unshift('introduction');if(book.id===6)files.unshift('introduction');if(book.id===9)files.unshift('introduction');if(book.chapters===1)files[0]='';const results=await Promise.all(files.map(async ch=>{const file=ch?ch+'.json':'all.json';const url='./hadith/db/by_chapter/'+book.path[0]+'/'+book.path[1]+'/'+file;try{return await getJson(url)}catch(_){return null}}));return results.flatMap(x=>Array.isArray(x?.hadiths)?x.hadiths:[])})();cache.set(key,p);return p; }
async function renderHadith(container){
 container.innerHTML=shell('الأحاديث الشريفة','','۞');
 await mountDailyAyah(container);
 const box=container.querySelector('#ih-content');
 let removeTashkeel=false;
 const stripTashkeel=(s)=>String(s||'').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,'');
 box.innerHTML='<div class="ih-meta ih-hadith-toolbar"><b>كتب الحديث</b><span>17 كتاباً</span><button id="hadith-tashkeel" class="ih-btn ih-tashkeel-btn" type="button" aria-pressed="false">إزالة التشكيل</button></div><div class="ih-book-grid">'+HADITH_BOOKS.map((b,i)=>'<button class="ih-book" style="--i:'+i+'" data-id="'+b.id+'"><span class="ih-book-icon">۞</span><strong>'+esc(b.title)+'</strong><small>'+b.chapters+' فصول تقريباً</small></button>').join('')+'</div><div id="hadith-panel" class="ih-results"></div>';
 const panel=box.querySelector('#hadith-panel');
 const tashkeelBtn=box.querySelector('#hadith-tashkeel');
 tashkeelBtn.onclick=()=>{removeTashkeel=!removeTashkeel;tashkeelBtn.textContent=removeTashkeel?'إظهار التشكيل':'إزالة التشكيل';tashkeelBtn.setAttribute('aria-pressed',String(removeTashkeel));};
 box.querySelectorAll('.ih-book').forEach(btn=>btn.addEventListener('click',async()=>{
  const book=HADITH_BOOKS.find(b=>b.id===Number(btn.dataset.id));
  panel.innerHTML='<div class="ih-loading"><div><div class="ih-pulse"></div><p>جاري تحميل '+esc(book.title)+' محلياً…</p></div></div>';
  try{
   const hadith=await loadHadithBook(book);
   if(!hadith.length){panel.innerHTML='<div class="ih-empty">لا توجد أحاديث متاحة في هذا الكتاب.</div>';return;}
   let index=0;
   const draw=()=>{
    const h=hadith[index]||{};
    const number=h.idInBook||h.id||index+1;
    const arabicText=removeTashkeel?stripTashkeel(h.arabic||''):(h.arabic||'');
    panel.innerHTML='<article class="ih-result ih-hadith-single">'+
      '<div class="ih-meta"><b>'+esc(book.title)+'</b><span>حديث '+esc(number)+' من '+hadith.length+'</span></div>'+
      '<div class="ih-hadith">'+esc(arabicText)+'</div>'+
      (h.english?.text?'<details class="ih-hadith-en"><summary>English</summary><p>'+esc(h.english.text)+'</p></details>':'')+
      '<div class="ih-hadith-nav">'+
        '<button class="ih-btn" id="hadith-prev" type="button" '+(index===0?'disabled':'')+'>← السابق</button>'+
        '<span class="ih-hadith-index">'+(index+1)+' / '+hadith.length+'</span>'+
        '<button class="ih-btn" id="hadith-next" type="button" '+(index===hadith.length-1?'disabled':'')+'>التالي →</button>'+
      '</div></article>';
    panel.querySelector('#hadith-prev').onclick=()=>{if(index>0){index--;draw();panel.scrollIntoView({behavior:'smooth',block:'start'})}};
    panel.querySelector('#hadith-next').onclick=()=>{if(index<hadith.length-1){index++;draw();panel.scrollIntoView({behavior:'smooth',block:'start'})}};
   };
   draw();
   panel.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
   panel.innerHTML='<div class="ih-empty">تعذر تحميل هذا الكتاب من الملفات المحلية.</div>';
   console.error('[IslamicHub] Hadith',e);
  }
 }));
}
function tajweedHtml(text,rules){const arr=Array.isArray(rules)?rules.slice().sort((a,b)=>a.start-b.start):[];if(!arr.length)return esc(text);let out='',pos=0;for(const r of arr){const st=Math.max(0,Number(r.start)||0),en=Math.min(text.length,Number(r.end)||0);if(st<pos||en<=st)continue;out+=esc(text.slice(pos,st));out+='<span class="tw-'+esc(r.rule)+'">'+esc(text.slice(st,en))+'</span>';pos=en}return out+esc(text.slice(pos));}
async function loadTajweed(n){try{return await getJson('./quran/source/tajweed/surah_'+n+'.json')}catch(_){return null}}
async function loadAudioIndex(n){try{return await getJson('./quran/source/audio/'+String(n).padStart(3,'0')+'/index.json')}catch(_){return null}}
async function loadEnglishTranslation(n){try{return await getJson('./quran/source/translation/en/en_translation_'+n+'.json')}catch(_){return null}}
async function renderQuranSurah(container){
 const p=new URLSearchParams(location.search),n=Math.min(114,Math.max(1,Number(p.get('surah')||1)||1));
 container.innerHTML=shell('القرآن الكريم','صفحة مستقلة للسورة · قراءة محلية · تجويد · تلاوة صوتية · تعمل مع PWA.','✦',false);
 const box=container.querySelector('#ih-content');
 try{
  const meta=await loadQuranMeta(),info=meta.find(x=>x.number===n)||{name:'السورة',count:0};
  const s=await loadSurah(n),[tw,audio,en]=await Promise.all([loadTajweed(n),loadAudioIndex(n),loadEnglishTranslation(n)]);
  const rules=tw?.verse||{},av=audio?.verse||{},ev=en?.verse||{};
  const favs=getFavorites();
  const isFavAyah=ayahNum=>favs.some(f=>f.key===`${n}:${ayahNum}`);

  box.innerHTML='<div class="ih-reader">'+
  '<div id="ih-last-read-slot">'+renderLastReadBanner(n)+'</div>'+
  '<div class="qr-head"><h2 class="qr-title">سورة '+esc(info.name||s.name)+'</h2><p class="qr-sub">'+s.ayahs.length+' آية · '+esc(info.type||'القرآن الكريم')+'</p>'+ 
  '<div class="qr-surah-picker" aria-label="التنقل بين السور"><button id="qr-prev-surah" class="qr-surah-arrow" type="button" aria-label="السورة السابقة" title="السورة السابقة" '+(n<=1?'disabled':'')+'>‹</button><div class="qr-surah-select-wrap"><label for="qr-surah-select">اختر السورة</label><select id="qr-surah-select" class="qr-select" aria-label="اختيار السورة">'+meta.map(m=>'<option value="'+m.number+'"'+(m.number===n?' selected':'')+'>'+m.number+' — سورة '+esc(m.name)+'</option>').join('')+'</select></div><button id="qr-next-surah" class="qr-surah-arrow" type="button" aria-label="السورة التالية" title="السورة التالية" '+(n>=114?'disabled':'')+'>›</button></div><div class="qr-actions"><select id="qr-font" class="qr-select"><option value="1">حجم الخط: متوسط</option><option value="1.15">حجم الخط: كبير</option><option value=".9">حجم الخط: صغير</option></select>'+ 
  '<select id="qr-reciter" class="qr-select" aria-label="اختيار القارئ"><option value="local">التلاوة المحلية المتاحة</option></select><select id="qr-lang" class="qr-select" aria-label="عرض الترجمة"><option value="ar">العربية</option><option value="en">English · الترجمة الإنجليزية</option><option value="both">العربية + English</option></select><button id="qr-play-all" class="qr-btn" type="button">▶ تشغيل السورة</button><button id="qr-tw" class="qr-btn" type="button">تفعيل التجويد</button><a class="qr-btn" href="quran.html">السور</a><a class="qr-btn" href="qibla.html">🧭 القبلة</a><a class="qr-btn" href="quran-search.html">الباحث</a></div>'+ 
  '<div class="qr-legend" id="qr-legend" hidden><span>الأزرق: همزة وصل</span><span>الذهبي: لام شمسية</span><span>البنفسجي: مد</span></div></div>'+ 
  '<div id="qr-list">'+s.ayahs.map(a=>{
    const f=av['verse_'+a.n]?.file||av['verse_'+(a.n-1)]?.file,et=ev['verse_'+a.n]||ev['verse_'+(a.n-1)]||'';
    const faved=isFavAyah(a.n);
    return '<article class="qr-ayah" id="ayah-'+a.n+'" data-ayah="'+a.n+'">'+
      '<div class="qr-ayah-header">'+
        '<span class="qr-num" title="آية '+a.n+'">'+a.n+'</span>'+
        '<div class="qr-ayah-actions">'+
          '<button class="qr-ayah-btn qr-ayah-share" type="button" aria-label="مشاركة الآية '+a.n+'" title="مشاركة الآية">'+
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>'+
          '</button>'+
          '<button class="qr-ayah-btn qr-ayah-fav'+(faved?' is-favorited':'')+'" type="button" aria-label="حفظ الآية '+a.n+' كموضع توقف والمفضلة" title="'+(faved?'في المفضلة (تم حفظ الموضع)':'حفظ كموضع توقف ومفضلة')+'">'+
            '<svg class="qr-heart-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'+
          '</button>'+
          '<button class="qr-ayah-btn qr-play" type="button" aria-label="تشغيل الآية '+a.n+'" title="استماع">▶</button>'+
        '</div>'+
      '</div>'+
      '<div class="qr-main"><div class="qr-text" data-base="'+esc(a.text)+'">'+esc(a.text)+'</div></div>'+
      (et?'<div class="qr-translation" data-en="'+esc(et)+'">'+esc(et)+'</div>':'')+
      (f?'<audio class="qr-audio" preload="metadata" src="./quran/source/audio/'+String(n).padStart(3,'0')+'/'+encodeURIComponent(f)+'"></audio>':'<audio class="qr-audio" preload="none"></audio>')+
    '</article>'
  }).join('')+'</div>'+ 
  '<div class="qr-nav">'+(n>1?'<a class="qr-btn" href="quran-surah.html?surah='+(n-1)+'">السورة السابقة</a>':'<span></span>')+(n<114?'<a class="qr-btn" href="quran-surah.html?surah='+(n+1)+'">السورة التالية</a>':'<span></span>')+'</div></div>';

  const bindResumeClick=()=>{
    const resumeBtn=box.querySelector('#ih-resume-btn');
    if(!resumeBtn)return;
    resumeBtn.addEventListener('click',e=>{
      const href=resumeBtn.getAttribute('href')||'';
      if(href.startsWith('#ayah-')){
        e.preventDefault();
        const target=box.querySelector(href);
        if(target){
          target.scrollIntoView({behavior:'smooth',block:'center'});
          target.classList.add('is-focused-bookmark');
          setTimeout(()=>target.classList.remove('is-focused-bookmark'),3200);
        }
      }
    });
  };
  bindResumeClick();

  box.querySelectorAll('.qr-ayah-share').forEach(btn=>{
    btn.addEventListener('click',async e=>{
      e.stopPropagation();
      const card=btn.closest('.qr-ayah'),num=Number(card?.dataset.ayah);
      const a=s.ayahs.find(x=>x.n===num);
      if(!a)return;
      const shareUrl=location.origin+location.pathname+'?surah='+n+'#ayah-'+a.n;
      const shareText='﴿ '+a.text+' ﴾\n[سورة '+(info.name||s.name)+': '+a.n+']\n\nتلاوة وقراءة عبر دليل المنزلة والمطرية:\n'+shareUrl;
      if(navigator.share){
        try{
          await navigator.share({title:'سورة '+(info.name||s.name)+' - آية '+a.n,text:shareText,url:shareUrl});
          return;
        }catch(err){if(err.name==='AbortError')return;}
      }
      if(navigator.clipboard?.writeText){
        try{
          await navigator.clipboard.writeText(shareText);
          showToast('تم نسخ الآية الكريمة ورابطها للمشاركة بنجاح ✨');
          return;
        }catch(_){}
      }
      showToast('رابط الآية: '+shareUrl);
    });
  });

  box.querySelectorAll('.qr-ayah-fav').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const card=btn.closest('.qr-ayah'),num=Number(card?.dataset.ayah);
      const a=s.ayahs.find(x=>x.n===num);
      if(!a)return;
      const isFav=toggleFavorite({
        surahNumber:n,
        surahName:info.name||s.name,
        ayahNumber:a.n,
        text:a.text
      });
      setLastRead({
        surahNumber:n,
        surahName:info.name||s.name,
        ayahNumber:a.n,
        text:a.text
      });
      if(isFav){
        btn.classList.add('is-favorited');
        btn.title='في المفضلة (تم حفظ الموضع)';
        showToast('تم حفظ موضعك في التلاوة وإضافتها للمفضلة ❤️');
      }else{
        btn.classList.remove('is-favorited');
        btn.title='حفظ موضع التلاوة والمفضلة';
        showToast('تم حفظ موضع التلاوة عند الآية '+a.n+' 🔖');
      }
      const bannerSlot=box.querySelector('#ih-last-read-slot');
      if(bannerSlot){
        bannerSlot.innerHTML=renderLastReadBanner(n);
        bindResumeClick();
      }
    });
  });

  const checkHash=()=>{
    const hash=window.location.hash;
    if(hash&&hash.startsWith('#ayah-')){
      const target=box.querySelector(hash);
      if(target){
        setTimeout(()=>{
          target.scrollIntoView({behavior:'smooth',block:'center'});
          target.classList.add('is-focused-bookmark');
          setTimeout(()=>target.classList.remove('is-focused-bookmark'),3200);
        },250);
      }
    }
  };
  checkHash();

  const surahSelect=box.querySelector('#qr-surah-select'); const goSurah=target=>{target=Math.min(114,Math.max(1,Number(target)||1));if(target!==n)location.href='quran-surah.html?surah='+target}; surahSelect.onchange=e=>goSurah(e.target.value); box.querySelector('#qr-prev-surah').onclick=()=>goSurah(n-1); box.querySelector('#qr-next-surah').onclick=()=>goSurah(n+1);
  let twOn=false,activeIndex=-1,playingAll=false;
  const cards=[...box.querySelectorAll('.qr-ayah')],texts=[...box.querySelectorAll('.qr-text')],audios=[...box.querySelectorAll('.qr-audio')],plays=[...box.querySelectorAll('.qr-play')];
  const clearActive=()=>{cards.forEach(c=>c.classList.remove('is-playing'));texts.forEach(t=>t.classList.remove('is-reading'));plays.forEach(b=>b.textContent='▶')};
  const scrollTo=i=>cards[i]?.scrollIntoView({behavior:'smooth',block:'center'});
  const start=async i=>{if(i<0||i>=audios.length)return;audios.forEach((a,j)=>{if(j!==i){a.pause();a.currentTime=0}});clearActive();activeIndex=i;cards[i].classList.add('is-playing');texts[i].classList.add('is-reading');plays[i].textContent='❚❚';scrollTo(i);if(!audios[i].src){clearActive();activeIndex=-1;return}try{audios[i].currentTime=0;await audios[i].play()}catch(_){clearActive();activeIndex=-1;playingAll=false}};
  const next=async()=>{const ni=activeIndex+1;if(playingAll&&ni<audios.length){await start(ni);return}playingAll=false;box.querySelector('#qr-play-all').textContent='▶ تشغيل السورة';clearActive();activeIndex=-1};
  audios.forEach((a,i)=>{a.addEventListener('ended',()=>{if(activeIndex===i)next()});a.addEventListener('play',()=>{clearActive();activeIndex=i;cards[i].classList.add('is-playing');texts[i].classList.add('is-reading');plays[i].textContent='❚❚'})});
  plays.forEach((b,i)=>b.addEventListener('click',async()=>{if(activeIndex===i&&!audios[i].paused){playingAll=false;audios[i].pause();clearActive();activeIndex=-1;return}playingAll=false;await start(i)}));
  box.querySelector('#qr-play-all').onclick=async()=>{if(playingAll){playingAll=false;audios[activeIndex]?.pause();box.querySelector('#qr-play-all').textContent='▶ تشغيل السورة';clearActive();activeIndex=-1;return}const first=audios.findIndex(a=>!!a.src);if(first<0)return;playingAll=true;box.querySelector('#qr-play-all').textContent='❚❚ إيقاف السورة';await start(first)};
  box.querySelector('#qr-reciter').onchange=()=>{audios.forEach(a=>{a.pause();a.currentTime=0});playingAll=false;clearActive();activeIndex=-1};
  const applyLanguage=()=>{const mode=box.querySelector('#qr-lang').value;cards.forEach(card=>{const ar=card.querySelector('.qr-text'),en=card.querySelector('.qr-translation');if(!en)return;ar.style.display=mode==='en'?'none':'block';en.style.display=mode==='ar'?'none':'block'})};box.querySelector('#qr-lang').onchange=applyLanguage;applyLanguage();
  const renderTw=()=>{texts.forEach((el,i)=>{const a=s.ayahs[i];el.innerHTML=twOn?'<span class="qr-tajweed">'+tajweedHtml(a.text,rules['verse_'+a.n])+'</span>':esc(a.text)});box.querySelector('#qr-legend').hidden=!twOn};
  box.querySelector('#qr-tw').onclick=()=>{twOn=!twOn;box.querySelector('#qr-tw').textContent=twOn?'إيقاف التجويد':'تفعيل التجويد';renderTw()};
  box.querySelector('#qr-font').onchange=e=>texts.forEach(el=>el.style.fontSize=(1.65*Number(e.target.value))+'rem');
 }catch(e){box.innerHTML='<div class="ih-empty">تعذر فتح السورة. تأكد من رقم السورة والملفات المحلية.</div>';console.error('[IslamicHub] Surah',e)}
}

function calcQiblaAzimuth(lat=31.1578,lng=31.8150){
  const PI=Math.PI;
  const lat1=lat*PI/180,lon1=lng*PI/180;
  const lat2=21.422487*PI/180,lon2=39.826206*PI/180;
  const dLon=lon2-lon1;
  const y=Math.sin(dLon);
  const x=Math.cos(lat1)*Math.tan(lat2)-Math.sin(lat1)*Math.cos(dLon);
  let qibla=Math.atan2(y,x)*180/PI;
  return Math.round((qibla+360)%360);
}

function buildCompassDialSvg(qiblaDeg=136){
  const ticks=[];
  for(let deg=0;deg<360;deg+=5){
    const rad=(deg-90)*Math.PI/180;
    const isMajor=deg%30===0;
    const isMedium=deg%15===0;
    const len=isMajor?14:(isMedium?9:5);
    const rOuter=138, rInner=rOuter-len;
    const x1=(rOuter*Math.cos(rad)).toFixed(1), y1=(rOuter*Math.sin(rad)).toFixed(1);
    const x2=(rInner*Math.cos(rad)).toFixed(1), y2=(rInner*Math.sin(rad)).toFixed(1);
    const stroke=isMajor?'var(--ih-gold)':'rgba(255,255,255,0.35)';
    const width=isMajor?'2':'1';
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`);
  }

  const nums=[0,30,60,90,120,150,180,210,240,270,300,330];
  const numLabels=nums.map(d=>{
    const rad=(d-90)*Math.PI/180;
    const r=112;
    const x=(r*Math.cos(rad)).toFixed(1), y=(r*Math.sin(rad)).toFixed(1);
    return `<text x="${x}" y="${y}" class="qibla-deg-num" text-anchor="middle" dominant-baseline="central">${d}°</text>`;
  }).join('');

  // Kaaba angle indicator on the dial
  const qRad=(qiblaDeg-90)*Math.PI/180;
  const kx=(138*Math.cos(qRad)).toFixed(1), ky=(138*Math.sin(qRad)).toFixed(1);
  const kbx=(92*Math.cos(qRad)).toFixed(1), kby=(92*Math.sin(qRad)).toFixed(1);

  return `<svg viewBox="-160 -160 320 320" class="qibla-dial-svg" aria-hidden="true">
    <defs>
      <radialGradient id="dialBgGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="65%" stop-color="#070d18"/>
        <stop offset="100%" stop-color="#030712"/>
      </radialGradient>
      <linearGradient id="kaabaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F5B041"/>
        <stop offset="100%" stop-color="#D4AC0D"/>
      </linearGradient>
      <filter id="dialShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
      </filter>
    </defs>
    <!-- Background Circle -->
    <circle cx="0" cy="0" r="148" fill="url(#dialBgGrad)" filter="url(#dialShadow)" stroke="rgba(243,156,18,0.25)" stroke-width="2"/>
    <circle cx="0" cy="0" r="138" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="rgba(243,156,18,0.18)" stroke-width="1" stroke-dasharray="3 3"/>
    
    <!-- Ticks & Degree Numbers -->
    <g class="qibla-ticks">${ticks.join('')}</g>
    <g class="qibla-deg-nums">${numLabels}</g>
    
    <!-- Cardinal Directions in Arabic -->
    <!-- North: ش -->
    <g class="qibla-cardinal-wrap" transform="translate(0, -78)">
      <polygon points="0,-12 -6,0 6,0" fill="#EF4444"/>
      <text x="0" y="12" class="qibla-cardinal qibla-cardinal--north" text-anchor="middle" dominant-baseline="central">ش</text>
    </g>
    <!-- East: ق -->
    <g class="qibla-cardinal-wrap" transform="translate(78, 0)">
      <text x="0" y="0" class="qibla-cardinal" text-anchor="middle" dominant-baseline="central">ق</text>
    </g>
    <!-- South: ج -->
    <g class="qibla-cardinal-wrap" transform="translate(0, 78)">
      <text x="0" y="0" class="qibla-cardinal" text-anchor="middle" dominant-baseline="central">ج</text>
    </g>
    <!-- West: غ -->
    <g class="qibla-cardinal-wrap" transform="translate(-78, 0)">
      <text x="0" y="0" class="qibla-cardinal" text-anchor="middle" dominant-baseline="central">غ</text>
    </g>

    <!-- Kaaba Vector Line and Pin on Dial -->
    <line x1="0" y1="0" x2="${kx}" y2="${ky}" stroke="#10B981" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.85"/>
    <g transform="translate(${kbx}, ${kby})">
      <circle cx="0" cy="0" r="16" fill="#111827" stroke="url(#kaabaGlow)" stroke-width="2"/>
      <text x="0" y="2" font-size="15" text-anchor="middle" dominant-baseline="central">🕋</text>
    </g>
  </svg>`;
}

async function renderQibla(container){
  container.innerHTML=shell('بوصلة اتجاه القبلة','تحديد اتجاه الكعبة المشرفة بتقنية ثلاثية الأبعاد 3D وحساب فلكي دقيق بالبوصلة ومستشعرات الهاتف.','🧭',false);
  const box=container.querySelector('#ih-content');

  let currentLat=31.1578, currentLng=31.8150; // El Manzala & El Matariya default
  let cityName='مدينة المنزلة والمطرية، الدقهلية';
  let qiblaAzimuth=calcQiblaAzimuth(currentLat,currentLng);
  let currentHeading=0;
  let hasSensor=false;
  let vTimer=null;

  box.innerHTML=`
    <div class="ih-qibla-view">
      <div class="qibla-header-strip">
        <div class="qibla-location-pill" id="qibla-location-pill">
          <span class="qibla-loc-pin">📍</span>
          <span class="qibla-loc-name">${esc(cityName)}</span>
          <span class="qibla-loc-angle">زاوية القبلة: <strong>${qiblaAzimuth}°</strong></span>
        </div>
        <button id="qibla-gps-trigger" class="ih-btn qibla-gps-btn" type="button">
          <span>تحديد موقعي بالـ GPS</span>
          <span class="qibla-gps-icon">🎯</span>
        </button>
      </div>

      <!-- Metrics Row -->
      <div class="qibla-metrics-grid">
        <div class="qibla-metric-card">
          <span class="qibla-metric-label">زاوية القبلة للكعبة</span>
          <strong class="qibla-metric-val" id="qibla-azimuth-val">${qiblaAzimuth}°</strong>
          <small class="qibla-metric-sub">جنوب شرق (مكة المكرمة)</small>
        </div>
        <div class="qibla-metric-card qibla-metric-card--active">
          <span class="qibla-metric-label">اتجاه الهاتف الآن</span>
          <strong class="qibla-metric-val" id="qibla-heading-val">0°</strong>
          <small class="qibla-metric-sub" id="qibla-heading-cardinal">شمال</small>
        </div>
        <div class="qibla-metric-card">
          <span class="qibla-metric-label">الفرق عن القبلة</span>
          <strong class="qibla-metric-val" id="qibla-diff-val">${qiblaAzimuth}°</strong>
          <small class="qibla-metric-sub" id="qibla-diff-status">أدر الهاتف للمحاذاة</small>
        </div>
      </div>

      <!-- Main 3D Compass Section -->
      <div class="qibla-stage-3d">
        <div class="qibla-sightline" title="خط اتجاه الهاتف للأمام">
          <div class="qibla-sightline-arrow"></div>
        </div>

        <div class="qibla-align-glow" id="qibla-glow-ring"></div>

        <div class="qibla-bezel" id="qibla-bezel">
          <!-- Glass Reflection highlight -->
          <div class="qibla-glass-shine"></div>

          <!-- Rotating Dial -->
          <div class="qibla-dial" id="qibla-dial">
            ${buildCompassDialSvg(qiblaAzimuth)}
          </div>

          <!-- 3D Center Emerald Needle Pointing Ahead -->
          <div class="qibla-needle-assembly" id="qibla-needle-assembly">
            <div class="qibla-needle-north">
              <span class="qibla-needle-glow"></span>
            </div>
            <div class="qibla-needle-south"></div>
            <div class="qibla-needle-pivot">
              <div class="qibla-needle-jewel"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Dynamic Alignment Banner -->
      <div class="qibla-banner" id="qibla-align-banner" role="status" aria-live="polite">
        <div class="qibla-banner-icon">🕋</div>
        <div class="qibla-banner-text">
          <strong id="qibla-status-title">أدر هاتفك باتجاه الكعبة المشرفة</strong>
          <p id="qibla-status-desc">ضع الهاتف مستوياً على راحة يدك ووجهه بزاوية ${qiblaAzimuth}° نحو الكعبة</p>
        </div>
      </div>

      <!-- Interactive Controls & Permissions -->
      <div class="qibla-controls-card">
        <div class="qibla-sensor-bar">
          <span class="qibla-sensor-state" id="qibla-sensor-state">
            <span class="qibla-sensor-dot"></span>
            <span id="qibla-sensor-txt">في انتظار تحريك الهاتف أو تشغيل المستشعر…</span>
          </span>
          <button id="qibla-permission-btn" class="ih-btn qibla-perm-btn" type="button" style="display:none">
            🧭 تفعيل مستشعر البوصلة (iPhone)
          </button>
        </div>

        <!-- Manual angle slider fallback for Desktop / PC -->
        <div class="qibla-manual-slider-wrap">
          <div class="qibla-slider-label">
            <span>تدوير تجريبي يدوي (للحواسيب والأجهزة بدون مستشعر):</span>
            <strong id="qibla-slider-val">0°</strong>
          </div>
          <input type="range" id="qibla-manual-range" min="0" max="360" value="0" step="1" class="qibla-range-input">
        </div>
      </div>

      <!-- Tips & Instructions -->
      <div class="qibla-tips-card">
        <h4 class="qibla-tips-title">💡 إرشادات للحصول على أعلى دقة:</h4>
        <ul class="qibla-tips-list">
          <li><strong>الوضع الأفقي:</strong> احرص على حمل الهاتف بشكل مسطّح ومستوٍ في راحة يدك مثل البوصلة الحقيقية.</li>
          <li><strong>تجنب التشويش:</strong> ابتعد عن القطع المعدنية، المغناطيس، والكمبيوترات أو الأجهزة الكهربائية القوية.</li>
          <li><strong>المعايرة الحركية:</strong> إذا شعرت أن الاتجاه غير دقيق، حرّك الهاتف في الهواء بلطف على شكل رقم 8 (∞).</li>
        </ul>
      </div>
    </div>
  `;

  const dialEl=box.querySelector('#qibla-dial');
  const glowRing=box.querySelector('#qibla-glow-ring');
  const bannerEl=box.querySelector('#qibla-align-banner');
  const statusTitle=box.querySelector('#qibla-status-title');
  const statusDesc=box.querySelector('#qibla-status-desc');
  const headingVal=box.querySelector('#qibla-heading-val');
  const headingCard=box.querySelector('#qibla-heading-cardinal');
  const diffVal=box.querySelector('#qibla-diff-val');
  const diffStatus=box.querySelector('#qibla-diff-status');
  const sensorTxt=box.querySelector('#qibla-sensor-txt');
  const sensorState=box.querySelector('#qibla-sensor-state');
  const slider=box.querySelector('#qibla-manual-range');
  const sliderVal=box.querySelector('#qibla-slider-val');
  const permBtn=box.querySelector('#qibla-permission-btn');
  const gpsBtn=box.querySelector('#qibla-gps-trigger');

  function getCardinal(deg){
    const d=(deg%360+360)%360;
    if(d>=337.5||d<22.5) return 'شمال (ش)';
    if(d>=22.5&&d<67.5) return 'شمال شرق';
    if(d>=67.5&&d<112.5) return 'شرق (ق)';
    if(d>=112.5&&d<157.5) return 'جنوب شرق';
    if(d>=157.5&&d<202.5) return 'جنوب (ج)';
    if(d>=202.5&&d<247.5) return 'جنوب غرب';
    if(d>=247.5&&d<292.5) return 'غرب (غ)';
    return 'شمال غرب';
  }

  function updateHeading(heading,isManual=false){
    currentHeading=Math.round((heading%360+360)%360);
    headingVal.textContent=currentHeading+'°';
    headingCard.textContent=getCardinal(currentHeading);
    if(isManual){
      slider.value=currentHeading;
      sliderVal.textContent=currentHeading+'°';
    }

    // Dial rotates counter to device heading so North matches real North
    if(dialEl){
      dialEl.style.transform=`rotate(${-currentHeading}deg)`;
    }

    // Calculate signed shortest angle difference between current heading and Qibla
    let diff=((qiblaAzimuth-currentHeading+540)%360)-180;
    const absDiff=Math.abs(diff);
    diffVal.textContent=Math.round(absDiff)+'°';

    const isAligned=absDiff<=3;

    if(isAligned){
      glowRing.classList.add('is-aligned');
      bannerEl.classList.add('is-aligned');
      statusTitle.textContent='✦ أنت الآن باتجاه القبلة الشريفة تماماً 🕋 ✦';
      statusDesc.textContent='وجهتك الحالية متطابقة مع الكعبة المشرفة بالمسجد الحرام.';
      diffStatus.textContent='محاذاة تامة 100%';

      if(!vTimer&&navigator.vibrate&&!isManual){
        try{navigator.vibrate([40,50,40]);}catch(_){}
        vTimer=setTimeout(()=>{vTimer=null;},1800);
      }
    }else{
      glowRing.classList.remove('is-aligned');
      bannerEl.classList.remove('is-aligned');
      const turnWay=diff>0?'لليمين ↻':'لليسار ↺';
      statusTitle.textContent=`أدر الهاتف ${turnWay} بمقدار ${Math.round(absDiff)}°`;
      statusDesc.textContent=`زاوية القبلة للكعبة: ${qiblaAzimuth}° · اتجاهك الحالي: ${currentHeading}°`;
      diffStatus.textContent=`انحراف ${Math.round(absDiff)}° ${turnWay}`;
    }
  }

  function onOrientation(e){
    let heading=null;
    if(typeof e.webkitCompassHeading!=='undefined'){
      heading=e.webkitCompassHeading;
    }else if(e.alpha!==null){
      heading=(360-e.alpha)%360;
    }
    if(heading!==null&&!isNaN(heading)){
      if(!hasSensor){
        hasSensor=true;
        sensorState.classList.add('is-active');
        sensorTxt.textContent='مستشعر البوصلة نشط ومباشر 🟢';
      }
      updateHeading(heading,false);
    }
  }

  // Setup sensors
  if(typeof window!=='undefined'){
    if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
      permBtn.style.display='inline-flex';
      permBtn.onclick=async()=>{
        try{
          const res=await DeviceOrientationEvent.requestPermission();
          if(res==='granted'){
            permBtn.style.display='none';
            window.addEventListener('deviceorientation',onOrientation,true);
            showToast('تم تفعيل مستشعر البوصلة بنجاح 🧭');
          }
        }catch(err){
          showToast('تعذر الوصول لمستشعر الحركة.');
        }
      };
    }else{
      if('ondeviceorientationabsolute' in window){
        window.addEventListener('deviceorientationabsolute',onOrientation,true);
      }else if('ondeviceorientation' in window){
        window.addEventListener('deviceorientation',onOrientation,true);
      }
    }
  }

  slider.oninput=()=>{
    updateHeading(Number(slider.value),true);
    sensorTxt.textContent='وضع التدوير اليدوي التجريبي 🕹️';
  };

  gpsBtn.onclick=()=>{
    if(!navigator.geolocation){
      showToast('خدمة تحديد الموقع (GPS) غير مدعومة في متصفحك.');
      return;
    }
    gpsBtn.disabled=true;
    gpsBtn.textContent='جاري تحديد الموقع…';
    navigator.geolocation.getCurrentPosition(pos=>{
      currentLat=pos.coords.latitude;
      currentLng=pos.coords.longitude;
      qiblaAzimuth=calcQiblaAzimuth(currentLat,currentLng);
      cityName=`موقعك الدقيق (GPS: ${currentLat.toFixed(2)}°, ${currentLng.toFixed(2)}°)`;
      box.querySelector('#qibla-location-pill').innerHTML=`
        <span class="qibla-loc-pin">📍</span>
        <span class="qibla-loc-name">${esc(cityName)}</span>
        <span class="qibla-loc-angle">زاوية القبلة: <strong>${qiblaAzimuth}°</strong></span>
      `;
      box.querySelector('#qibla-azimuth-val').textContent=qiblaAzimuth+'°';
      box.querySelector('#qibla-dial').innerHTML=buildCompassDialSvg(qiblaAzimuth);
      updateHeading(currentHeading,true);
      gpsBtn.disabled=false;
      gpsBtn.innerHTML='<span>تم تحديث الموقع</span> <span class="qibla-gps-icon">✓</span>';
      showToast(`تم تحديث اتجاه القبلة لموقعك بدقة: ${qiblaAzimuth}° 🕋`);
    },err=>{
      gpsBtn.disabled=false;
      gpsBtn.innerHTML='<span>تحديد موقعي بالـ GPS</span> <span class="qibla-gps-icon">🎯</span>';
      showToast('تعذر الحصول على إحداثيات GPS. تم الإبقاء على إحداثيات المنزلة والمطرية.');
    },{enableHighAccuracy:true,timeout:10000});
  };

  updateHeading(0,true);
}

export {renderQuran,renderHadith,renderQuranSearch,renderQuranSurah,renderQibla};

