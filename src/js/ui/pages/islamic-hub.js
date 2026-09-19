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

const QURAN_RECITERS = {
  alafasy: { name: 'مشاري راشد العفاسي (مرتل نقي)', cdn: 'https://everyayah.com/data/Alafasy_128kbps' },
  abdulbasit: { name: 'عبد الباسط عبد الصمد (مرتل)', cdn: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps' },
  ghamadi: { name: 'سعد الغامدي (سريع ومحلي)', cdn: 'https://everyayah.com/data/Ghamadi_40kbps' },
  husary: { name: 'محمود خليل الحصري (معلم)', cdn: 'https://everyayah.com/data/Husary_128kbps' },
  muaiqly: { name: 'ماهر المعيقلي (الحرم المكي)', cdn: 'https://everyayah.com/data/Maher_AlMuaiqly_64kbps' },
  minshawy: { name: 'محمد صديق المنشاوي (خاشع)', cdn: 'https://everyayah.com/data/Minshawy_Murattal_128kbps' }
};

function getAyahAudioCandidates(surahNum, ayahNum, reciter = 'alafasy') {
  const s = String(surahNum).padStart(3, '0');
  const a = String(ayahNum).padStart(3, '0');
  let localUrl;
  try {
    localUrl = new URL(`quran/source/audio/${s}/${a}.mp3`, document.baseURI || window.location.href).href;
  } catch (_) {
    localUrl = `./quran/source/audio/${s}/${a}.mp3`;
  }
  const info = QURAN_RECITERS[reciter] || QURAN_RECITERS.alafasy;
  const cdnUrl = `${info.cdn}/${s}${a}.mp3`;
  const universalFallback = `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
  if (reciter === 'ghamadi') {
    return [localUrl, cdnUrl, universalFallback];
  }
  return [cdnUrl, localUrl, universalFallback];
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
   <a class="ih-btn" href="prayer-times.html">🕌 مواقيت الصلاة</a>
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
 const rawVerses=raw?.verse||{};
 const hasVerse0=n!==1&&n!==9&&Boolean(rawVerses.verse_0);
 const basmalah=hasVerse0?String(rawVerses.verse_0).replace(/^\uFEFF/,'').trim():'';
 const verses=Object.entries(rawVerses)
   .filter(([k])=>k!=='verse_0')
   .map(([k,text])=>({n:Number(k.replace(/\D/g,'')),text:String(text||'').replace(/^\uFEFF/,'').trim()}))
   .filter(x=>x.text&&x.n>0);
 return {number:Number(raw.index)||n,name:raw.name||'',basmalah,ayahs:verses};
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
   const rows=surahs.map(s=>{
     return s.ayahs.map(a=>({sn:s.number,snName:s.name,n:a.n,text:a.text,key:norm(a.text)}));
   });
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
   if(activeAudio){activeAudio.pause();activeAudio.removeAttribute('src');activeAudio=null;}
   out.querySelectorAll('.ih-result').forEach(x=>x.classList.remove('is-playing'));
   out.querySelectorAll('.ih-result-play').forEach(x=>x.textContent='▶');
 };
 const playResult=(v,card,button)=>{
   const key=`${v.sn}:${v.n}`;
   if(activeAudio&&activeAudio._key===key&&!activeAudio.paused){stopAudio();return;}
   stopAudio();
   const candidates=getAyahAudioCandidates(v.sn,v.n,'alafasy');
   let cIdx=0;
   const audio=new Audio();
   activeAudio=audio;
   audio._key=key;
   card.classList.add('is-playing');
   button.textContent='❚❚';

   const tryPlay=()=>{
     if(cIdx>=candidates.length){
       stopAudio();
       showToast('تعذر تشغيل الصوت لهذه الآية.');
       return;
     }
     audio.src=candidates[cIdx++];
     audio.onended=stopAudio;
     audio.onerror=tryPlay;
     audio.play().catch(err=>{if(err.name!=='AbortError')tryPlay();});
   };
   tryPlay();
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
  '<select id="qr-reciter" class="qr-select" aria-label="اختيار القارئ">'+Object.entries(QURAN_RECITERS).map(([k,r])=>'<option value="'+k+'">'+esc(r.name)+'</option>').join('')+'</select><select id="qr-lang" class="qr-select" aria-label="عرض الترجمة"><option value="ar">العربية</option><option value="en">English · الترجمة الإنجليزية</option><option value="both">العربية + English</option></select><button id="qr-play-all" class="qr-btn" type="button">▶ تشغيل السورة</button><button id="qr-tw" class="qr-btn" type="button">تفعيل التجويد</button><a class="qr-btn" href="quran.html">السور</a><a class="qr-btn" href="prayer-times.html">🕌 المواقيت</a><a class="qr-btn" href="qibla.html">🧭 القبلة</a><a class="qr-btn" href="quran-search.html">الباحث</a></div>'+ 
  '<div class="qr-legend" id="qr-legend" hidden><span>الأزرق: همزة وصل</span><span>الذهبي: لام شمسية</span><span>البنفسجي: مد</span></div></div>'+ 
  (s.basmalah ? '<div class="qr-basmalah-wrap" aria-label="بسم الله الرحمن الرحيم"><div class="qr-basmalah-text">'+esc(s.basmalah)+'</div></div>' : '')+
  '<div id="qr-list">'+s.ayahs.map(a=>{
    const et=ev['verse_'+a.n]||ev['verse_'+(a.n-1)]||'';
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

  let twOn=false, activeIndex=-1, playingAll=false, audioPlayer=null;
  const cards=[...box.querySelectorAll('.qr-ayah')];
  const texts=[...box.querySelectorAll('.qr-text')];
  const plays=[...box.querySelectorAll('.qr-play')];
  const playAllBtn=box.querySelector('#qr-play-all');
  const reciterSelect=box.querySelector('#qr-reciter');

  const savedReciter=localStorage.getItem('manzala_quran_reciter')||'alafasy';
  if(reciterSelect && QURAN_RECITERS[savedReciter]){
    reciterSelect.value=savedReciter;
  }

  const clearActive=()=>{
    cards.forEach(c=>c.classList.remove('is-playing'));
    texts.forEach(t=>t.classList.remove('is-reading'));
    plays.forEach(b=>{b.textContent='▶';b.classList.remove('is-active');});
  };

  const stopAudio=()=>{
    if(audioPlayer){
      try{audioPlayer.pause();}catch(_){}
      audioPlayer.removeAttribute('src');
      try{audioPlayer.load();}catch(_){}
      audioPlayer=null;
    }
    clearActive();
    activeIndex=-1;
  };

  const scrollTo=i=>cards[i]?.scrollIntoView({behavior:'smooth',block:'center'});

  const playAyah=async(index,candidateIdx=0)=>{
    if(index<0||index>=s.ayahs.length){
      stopAudio();
      playingAll=false;
      if(playAllBtn)playAllBtn.textContent='▶ تشغيل السورة';
      return;
    }
    const a=s.ayahs[index];
    const reciter=reciterSelect?.value||'alafasy';
    const candidates=getAyahAudioCandidates(n,a.n,reciter);

    if(candidateIdx>=candidates.length){
      console.warn('[IslamicHub] All audio candidates failed for Surah',n,'Ayah',a.n);
      showToast('تعذر تشغيل صوت الآية '+a.n);
      if(playingAll && index+1<s.ayahs.length){
        setTimeout(()=>playAyah(index+1,0),400);
        return;
      }
      stopAudio();
      playingAll=false;
      if(playAllBtn)playAllBtn.textContent='▶ تشغيل السورة';
      return;
    }

    const src=candidates[candidateIdx];
    if(!audioPlayer){
      audioPlayer=new Audio();
    }else{
      try{audioPlayer.pause();}catch(_){}
    }

    clearActive();
    activeIndex=index;
    cards[index]?.classList.add('is-playing');
    texts[index]?.classList.add('is-reading');
    if(plays[index]){
      plays[index].textContent='❚❚';
      plays[index].classList.add('is-active');
    }
    scrollTo(index);

    audioPlayer.onended=()=>{
      if(playingAll){
        playAyah(index+1,0);
      }else{
        stopAudio();
      }
    };

    audioPlayer.onerror=()=>{
      console.warn('[IslamicHub] Audio candidate '+candidateIdx+' failed ('+src+'), trying next candidate...');
      playAyah(index,candidateIdx+1);
    };

    try{
      audioPlayer.src=src;
      await audioPlayer.play();
    }catch(err){
      if(err.name==='AbortError')return;
      console.warn('[IslamicHub] Audio play error, trying candidate '+(candidateIdx+1),err);
      playAyah(index,candidateIdx+1);
    }
  };

  plays.forEach((btn,i)=>{
    btn.addEventListener('click',async e=>{
      e.stopPropagation();
      if(activeIndex===i && audioPlayer && !audioPlayer.paused){
        audioPlayer.pause();
        playingAll=false;
        if(playAllBtn)playAllBtn.textContent='▶ تشغيل السورة';
        btn.textContent='▶';
        btn.classList.remove('is-active');
        cards[i]?.classList.remove('is-playing');
        texts[i]?.classList.remove('is-reading');
        return;
      }
      if(activeIndex===i && audioPlayer && audioPlayer.paused){
        try{
          await audioPlayer.play();
          cards[i]?.classList.add('is-playing');
          texts[i]?.classList.add('is-reading');
          btn.textContent='❚❚';
          btn.classList.add('is-active');
          return;
        }catch(_){}
      }
      playingAll=false;
      if(playAllBtn)playAllBtn.textContent='▶ تشغيل السورة';
      playAyah(i,0);
    });
  });

  if(playAllBtn){
    playAllBtn.onclick=()=>{
      if(playingAll && audioPlayer && !audioPlayer.paused){
        stopAudio();
        playingAll=false;
        playAllBtn.textContent='▶ تشغيل السورة';
        return;
      }
      playingAll=true;
      playAllBtn.textContent='❚❚ إيقاف السورة';
      const startIdx=activeIndex>=0?activeIndex:0;
      playAyah(startIdx,0);
    };
  }

  if(reciterSelect){
    reciterSelect.onchange=()=>{
      localStorage.setItem('manzala_quran_reciter',reciterSelect.value);
      if(activeIndex>=0){
        const wasPlaying=audioPlayer && !audioPlayer.paused;
        if(wasPlaying||playingAll){
          playAyah(activeIndex,0);
        }else{
          stopAudio();
        }
      }
    };
  }

  const surahSelect=box.querySelector('#qr-surah-select');
  const goSurah=target=>{
    target=Math.min(114,Math.max(1,Number(target)||1));
    if(target!==n){
      stopAudio();
      location.href='quran-surah.html?surah='+target;
    }
  };
  if(surahSelect)surahSelect.onchange=e=>goSurah(e.target.value);
  const prevSurahBtn=box.querySelector('#qr-prev-surah');
  if(prevSurahBtn)prevSurahBtn.onclick=()=>goSurah(n-1);
  const nextSurahBtn=box.querySelector('#qr-next-surah');
  if(nextSurahBtn)nextSurahBtn.onclick=()=>goSurah(n+1);
  const applyLanguage=()=>{const mode=box.querySelector('#qr-lang').value;cards.forEach(card=>{const ar=card.querySelector('.qr-text'),en=card.querySelector('.qr-translation');if(!en)return;ar.style.display=mode==='en'?'none':'block';en.style.display=mode==='ar'?'none':'block'})};box.querySelector('#qr-lang').onchange=applyLanguage;applyLanguage();
  const renderTw=()=>{texts.forEach((el,i)=>{const a=s.ayahs[i];el.innerHTML=twOn?'<span class="qr-tajweed">'+tajweedHtml(a.text,rules['verse_'+a.n])+'</span>':esc(a.text)});box.querySelector('#qr-legend').hidden=!twOn};
  box.querySelector('#qr-tw').onclick=()=>{twOn=!twOn;box.querySelector('#qr-tw').textContent=twOn?'إيقاف التجويد':'تفعيل التجويد';renderTw()};
  box.querySelector('#qr-font').onchange=e=>texts.forEach(el=>el.style.fontSize=(1.65*Number(e.target.value))+'rem');
 }catch(e){box.innerHTML='<div class="ih-empty">تعذر فتح السورة. تأكد من رقم السورة والملفات المحلية.</div>';console.error('[IslamicHub] Surah',e)}
}

function calcQiblaAzimuth(lat=31.1582, lng=31.9360){
  const d2r=Math.PI/180;
  const lat1=lat*d2r;
  const lat2=21.4225*d2r;
  const deltaLon=(39.8262-lng)*d2r;
  const y=Math.sin(deltaLon)*Math.cos(lat2);
  const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(deltaLon);
  const bearing=(Math.atan2(y,x)*180/Math.PI + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

function calcKaabaDistance(lat=31.1582, lng=31.9360){
  const R=6371; // Earth radius in km
  const d2r=Math.PI/180;
  const lat1=lat*d2r, lon1=lng*d2r;
  const lat2=21.4225*d2r, lon2=39.8262*d2r;
  const dLat=lat2-lat1, dLon=lon2-lon1;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  const c=2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R*c);
}

// Magnetic Declination for El Manzala & Northern Egypt (~4.9° East)
const MAGNETIC_DECLINATION = 4.9;

function computeCompassHeading(alpha, beta, gamma, webkitHeading=null, isCameraMode=false){
  // 1. iOS Safari (direct compass heading relative to magnetic north)
  if(webkitHeading!==null && typeof webkitHeading!=='undefined' && !isNaN(webkitHeading)){
    let h=Number(webkitHeading);
    const screenAngle=(window.screen?.orientation?.angle || window.orientation || 0);
    return (h + screenAngle + 360) % 360;
  }

  // 2. Android Chrome with 3D Matrix & Tilt Compensation
  if(alpha===null || typeof alpha==='undefined' || isNaN(alpha)) return null;

  const degToRad=Math.PI/180;
  const a=(alpha||0)*degToRad;
  const b=(beta||0)*degToRad;
  const g=(gamma||0)*degToRad;

  const ca=Math.cos(a), sa=Math.sin(a);
  const cb=Math.cos(b), sb=Math.sin(b);
  const cg=Math.cos(g), sg=Math.sin(g);

  let east, north;

  // In AR / Camera mode or when phone is held upright in front of eyes:
  // Back camera points along the -Z axis of the phone
  if(isCameraMode || Math.abs(b) > 45 * degToRad){
    east = -(ca * sg + sa * sb * cg);
    north = -(sa * sg - ca * sb * cg);
  } else {
    // In flat / compass mode: top edge points along +Y axis of the phone
    if(Math.abs(cb) < 0.1){
      east = -(ca * sg + sa * sb * cg);
      north = -(sa * sg - ca * sb * cg);
    } else {
      east = -sa * cb;
      north = ca * cb;
    }
  }

  let heading = (Math.atan2(east, north) * (180 / Math.PI) + 360) % 360;
  if(isNaN(heading)){
    heading = (360 - (alpha || 0) + 360) % 360;
  }

  const screenAngle = (window.screen?.orientation?.angle || window.orientation || 0);
  return (heading + screenAngle + 360) % 360;
}

function buildCompassDialSvg(qiblaDeg=138.08){
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
    <circle cx="0" cy="0" r="148" fill="url(#dialBgGrad)" filter="url(#dialShadow)" stroke="rgba(243,156,18,0.25)" stroke-width="2"/>
    <circle cx="0" cy="0" r="138" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="rgba(243,156,18,0.18)" stroke-width="1" stroke-dasharray="3 3"/>
    
    <g class="qibla-ticks">${ticks.join('')}</g>
    <g class="qibla-deg-nums">${numLabels}</g>
    
    <!-- Cardinal Directions in Arabic -->
    <g class="qibla-cardinal-wrap" transform="translate(0, -78)">
      <polygon points="0,-12 -6,0 6,0" fill="#EF4444"/>
      <text x="0" y="12" class="qibla-cardinal qibla-cardinal--north" text-anchor="middle" dominant-baseline="central">ش</text>
    </g>
    <g class="qibla-cardinal-wrap" transform="translate(78, 0)">
      <text x="0" y="0" class="qibla-cardinal" text-anchor="middle" dominant-baseline="central">ق</text>
    </g>
    <g class="qibla-cardinal-wrap" transform="translate(0, 78)">
      <text x="0" y="0" class="qibla-cardinal" text-anchor="middle" dominant-baseline="central">ج</text>
    </g>
    <g class="qibla-cardinal-wrap" transform="translate(-78, 0)">
      <text x="0" y="0" class="qibla-cardinal" text-anchor="middle" dominant-baseline="central">غ</text>
    </g>

    <line x1="0" y1="0" x2="${kx}" y2="${ky}" stroke="#10B981" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.85"/>
    <g transform="translate(${kbx}, ${kby})">
      <circle cx="0" cy="0" r="16" fill="#111827" stroke="url(#kaabaGlow)" stroke-width="2"/>
      <text x="0" y="2" font-size="15" text-anchor="middle" dominant-baseline="central">🕋</text>
    </g>
  </svg>`;
}

async function renderQibla(container){
  container.innerHTML=shell('بوصلة اتجاه القبلة (بتقنية Google Qibla Finder)','تحديد اتجاه الكعبة المشرفة بدقة فائقة بالواقع المعزز (AR) ومستشعرات الهاتف وحساب فلكي جيوديسي للكعبة.','🧭',false);
  const box=container.querySelector('#ih-content');

  let currentLat=31.1582, currentLng=31.9360; // El Manzala Center exact coordinates (142.2° True / 137.3° Mag)
  let cityName='المنزلة (المركز)، الدقهلية';
  let qiblaAzimuth=calcQiblaAzimuth(currentLat,currentLng); // 142.2° (True North / Google Maps)
  let compassAzimuth=Math.round((qiblaAzimuth - MAGNETIC_DECLINATION) * 10) / 10; // 137.3° (Magnetic North)
  let kaabaDistance=calcKaabaDistance(currentLat,currentLng); // 1337 km
  let bearingMode='magnetic'; // 'magnetic' (137.3°) or 'true' (142.2°)
  let currentHeading=0;
  let smoothedHeading=0;
  let currentMode='ar'; // 'ar' or 'compass'
  let hasSensor=false;
  let vTimer=null;
  let mediaStream=null;

  box.innerHTML=`
    <div class="ih-qibla-view">
      <!-- Mode Switcher (AR Camera vs 3D Compass) -->
      <div class="qibla-mode-switcher">
        <button type="button" class="qibla-mode-btn is-active" id="qibla-btn-ar">
          <span>📸 كاميرا الواقع المعزز (AR)</span>
        </button>
        <button type="button" class="qibla-mode-btn" id="qibla-btn-compass">
          <span>🧭 بوصلة 3D</span>
        </button>
      </div>

      <!-- Target Bearing Mode Switcher (Magnetic 137.3° vs Google Maps 142.2°) -->
      <div class="qibla-target-switcher">
        <button type="button" class="qibla-target-pill is-active" id="qibla-target-magnetic" title="زاوية البوصلة المغناطيسية بعد مراعاة الانحراف">
          <span>🧭 بوصلة الهاتف: <strong id="qibla-target-mag-val">${compassAzimuth}°</strong></span>
        </button>
        <button type="button" class="qibla-target-pill" id="qibla-target-true" title="زاوية خرائط جوجل ونظام GPS الفلكي">
          <span>🌐 خرائط جوجل وAR: <strong id="qibla-target-true-val">${qiblaAzimuth}°</strong></span>
        </button>
      </div>

      <!-- Top Header Strip: Location Pill, City Selector, GPS, Calibration -->
      <div class="qibla-header-strip">
        <div class="qibla-location-pill" id="qibla-location-pill">
          <span class="qibla-loc-pin">📍</span>
          <span class="qibla-loc-name" id="qibla-loc-name">${esc(cityName)}</span>
          <span class="qibla-loc-angle">زاوية القبلة: <strong id="qibla-pill-azimuth">${compassAzimuth}°</strong></span>
        </div>
        
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button id="qibla-gps-trigger" class="ih-btn qibla-gps-btn" type="button" title="تحديد موقعك الدقيق بالـ GPS">
            <span>موقعي الحالي (GPS)</span>
            <span class="qibla-gps-icon">🎯</span>
          </button>
          <button id="qibla-calib-trigger" class="ih-btn" type="button" style="border-radius:999px;padding:9px 16px;font-size:.84rem" title="معايرة البوصلة">
            <span>معايرة (حركة ∞)</span>
          </button>
        </div>
      </div>

      <!-- Metrics Row: Qibla Angles, Current Heading, Distance in KM -->
      <div class="qibla-metrics-grid">
        <div class="qibla-metric-card" id="qibla-card-mag">
          <span class="qibla-metric-label">زاوية بوصلة الهاتف</span>
          <strong class="qibla-metric-val" id="qibla-azimuth-mag">${compassAzimuth}°</strong>
          <small class="qibla-metric-sub">انحراف مغناطيسي 4.9° شرقاً</small>
        </div>
        <div class="qibla-metric-card" id="qibla-card-true">
          <span class="qibla-metric-label">زاوية خرائط جوجل وAR</span>
          <strong class="qibla-metric-val" id="qibla-azimuth-val">${qiblaAzimuth}°</strong>
          <small class="qibla-metric-sub">الشمال الحقيقي (مكة المكرمة)</small>
        </div>
        <div class="qibla-metric-card qibla-metric-card--active">
          <span class="qibla-metric-label">اتجاه هاتفك الآن</span>
          <strong class="qibla-metric-val" id="qibla-heading-val">0°</strong>
          <small class="qibla-metric-sub" id="qibla-heading-cardinal">شمال</small>
        </div>
        <div class="qibla-metric-card">
          <span class="qibla-metric-label">المسافة إلى الكعبة</span>
          <strong class="qibla-metric-val" id="qibla-distance-val">${kaabaDistance.toLocaleString('ar-EG')}</strong>
          <small class="qibla-metric-sub">كيلومتر (خط مباشر)</small>
        </div>
      </div>

      <!-- 1. Augmented Reality (AR) Camera Viewport (like Google Qibla Finder) -->
      <div class="qibla-ar-container is-active" id="qibla-ar-viewport">
        <video id="qibla-camera-video" class="qibla-camera-video" playsinline autoplay muted></video>
        
        <div class="qibla-ar-overlay">
          <div class="qibla-ar-top-hud">
            <span class="qibla-ar-hud-item">📍 القبلة: <strong id="qibla-hud-azimuth">${qiblaAzimuth}°</strong></span>
            <span class="qibla-ar-hud-item">🧭 وجهتك: <strong id="qibla-hud-heading">0°</strong></span>
            <span class="qibla-ar-hud-item">🕋 المسافة: <strong id="qibla-hud-dist">${kaabaDistance.toLocaleString('ar-EG')} كم</strong></span>
          </div>

          <!-- Crosshair target in the center -->
          <div class="qibla-ar-crosshair" id="qibla-ar-crosshair"></div>

          <!-- Floating 3D Kaaba badge tracking horizontally in the camera view -->
          <div class="qibla-ar-kaaba-wrap" id="qibla-ar-kaaba-wrap">
            <div class="qibla-ar-kaaba-card" id="qibla-ar-kaaba-card">
              <span class="qibla-ar-kaaba-icon">🕋</span>
              <span class="qibla-ar-kaaba-label">الكعبة المشرفة</span>
              <span class="qibla-ar-kaaba-sub">${qiblaAzimuth}°</span>
            </div>
          </div>

          <!-- Bottom live guidance pill -->
          <div class="qibla-ar-hint" id="qibla-ar-hint">
            <span id="qibla-hint-icon">↻</span>
            <span id="qibla-hint-text">أدر هاتفك للبحث عن اتجاه الكعبة…</span>
          </div>
        </div>

        <!-- Camera fallback message if permission denied or desktop -->
        <div class="qibla-camera-msg" id="qibla-camera-fallback" style="display:none">
          <div style="font-size:42px">📷</div>
          <h3 style="margin:0;font-size:1.1rem">تفعيل الكاميرا لعرض القبلة بالواقع المعزز</h3>
          <p style="margin:0;font-size:.85rem;color:rgba(255,255,255,0.7);max-width:300px">
            يرجى السماح بالوصول إلى الكاميرا لرؤية الكعبة المشرفة تطفو في موقعك تماماً مثل Google Qibla Finder.
          </p>
          <button type="button" class="qibla-camera-msg-btn" id="qibla-req-camera-btn">تشغيل الكاميرا الآن</button>
        </div>
      </div>

      <!-- 2. Main 3D Compass Section (Alternative Tab) -->
      <div class="qibla-compass-section" id="qibla-compass-section" style="display:none">
        <div class="qibla-stage-3d">
          <div class="qibla-sightline" title="خط اتجاه الهاتف للأمام">
            <div class="qibla-sightline-arrow"></div>
          </div>

          <div class="qibla-align-glow" id="qibla-glow-ring"></div>

          <div class="qibla-bezel" id="qibla-bezel">
            <div class="qibla-glass-shine"></div>
            <div class="qibla-dial" id="qibla-dial">
              ${buildCompassDialSvg(qiblaAzimuth)}
            </div>
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
      </div>

      <!-- Live Dynamic Alignment Banner -->
      <div class="qibla-banner" id="qibla-align-banner" role="status" aria-live="polite">
        <div class="qibla-banner-icon">🕋</div>
        <div class="qibla-banner-text">
          <strong id="qibla-status-title">أدر هاتفك باتجاه الكعبة المشرفة</strong>
          <p id="qibla-status-desc">ضع الهاتف في مستوى النظر ووجهه بزاوية ${qiblaAzimuth}° نحو الكعبة</p>
        </div>
      </div>

      <!-- Interactive Controls & Sensor States -->
      <div class="qibla-controls-card">
        <div class="qibla-sensor-bar">
          <span class="qibla-sensor-state" id="qibla-sensor-state">
            <span class="qibla-sensor-dot"></span>
            <span id="qibla-sensor-txt">في انتظار استجابة مستشعرات الهاتف (الجيروسكوب والمغناطيسية)…</span>
          </span>
          <button id="qibla-permission-btn" class="ih-btn qibla-perm-btn" type="button" style="display:none">
            🧭 تفعيل مستشعر البوصلة (iPhone)
          </button>
        </div>

        <!-- Quick City Selector for Fast Accurate Bearing -->
        <div style="margin-top:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <label style="font-size:.85rem;font-weight:700;color:var(--text-secondary)">اختر مدينتك أو قريتك مباشرة:</label>
          <select id="qibla-city-select" class="jb-select" style="padding:6px 12px;font-size:.85rem;border-radius:10px">
            <option value="31.1582,31.9360" selected>المنزلة (المركز) - 142.2°</option>
            <option value="31.1825,32.0315">المطرية (دقهلية) - 142.6°</option>
            <option value="31.1865,31.8980">الجمالية - 142.1°</option>
            <option value="31.1290,31.9120">الأحمدية - 142.0°</option>
            <option value="31.1620,31.9750">العزيزة - 142.3°</option>
            <option value="31.1410,31.8950">البصراط - 142.0°</option>
            <option value="31.2150,31.9820">النسايمة - 142.5°</option>
            <option value="31.1340,31.8720">ميت شريف - 142.4°</option>
            <option value="31.1920,31.8750">الروضة - 142.1°</option>
            <option value="31.2410,32.0520">الشبول - 142.6°</option>
            <option value="31.0364,31.3807">المنصورة (عاصمة المحافظة) - 141.9°</option>
            <option value="31.2565,32.2841">بورسعيد - 142.8°</option>
            <option value="31.4165,31.8133">دمياط ورأس البر - 142.0°</option>
            <option value="30.0444,31.2357">القاهرة الكبرى والجيزة - 136.2°</option>
            <option value="31.2001,29.9187">الإسكندرية - 135.5°</option>
          </select>
        </div>

        <!-- Manual angle slider fallback for Desktop / PC -->
        <div class="qibla-manual-slider-wrap">
          <div class="qibla-slider-label">
            <span>تدوير تجريبي يدوي (للحواسيب والأجهزة بدون مستشعر بوصلة):</span>
            <strong id="qibla-slider-val">0°</strong>
          </div>
          <input type="range" id="qibla-manual-range" min="0" max="360" value="0" step="1" class="qibla-range-input">
        </div>
      </div>

      <!-- Calibration Modal (Figure-8 animation) -->
      <div class="qibla-calib-modal" id="qibla-calib-modal">
        <div class="qibla-calib-content">
          <h3 style="margin:0 0 6px;font-size:1.1rem;color:var(--text-primary)">معايرة بوصلة الهاتف 🧭</h3>
          <p style="font-size:.86rem;color:var(--text-secondary);margin:0">
            للحصول على أعلى دقة مثل Google Qibla Finder، حرّك هاتفك في الهواء برسم الرقم 8 (∞) مرتين إلى ثلاث مرات:
          </p>
          <div class="qibla-calib-svg">
            <svg viewBox="-70 -40 140 80" width="100%" height="100%">
              <!-- Figure 8 path -->
              <path d="M -40,0 C -40,-25 -10,-25 0,0 C 10,25 40,25 40,0 C 40,-25 10,-25 0,0 C -10,25 -40,25 -40,0 Z" 
                    fill="none" stroke="rgba(243,156,18,0.35)" stroke-width="3" stroke-dasharray="4 4"/>
              <!-- Phone icon animated -->
              <g class="qibla-calib-phone">
                <rect x="-10" y="-18" width="20" height="36" rx="4" fill="#0284c7" stroke="#fff" stroke-width="1.5"/>
                <circle cx="0" cy="13" r="1.5" fill="#fff"/>
              </g>
            </svg>
          </div>
          <button type="button" class="ih-btn" id="qibla-close-calib-btn" style="width:100%;border-radius:12px">
            تمت المعايرة بنجاح ✓
          </button>
        </div>
      </div>

      <!-- Tips & Instructions -->
      <div class="qibla-tips-card">
        <h4 class="qibla-tips-title">💡 إرشادات دقة القبلة وفق معايير Google Qibla Finder:</h4>
        <ul class="qibla-tips-list">
          <li><strong>كاميرا الواقع المعزز:</strong> انظر من خلال شاشة الكاميرا، ووجّه الهاتف للأمام حتى يظهر رمز الكعبة المشرفة في المنتصف تماماً.</li>
          <li><strong>الوضع الأفقي (للبوصلة):</strong> احرص على وضع الهاتف مستوياً على راحة يدك موازياً لسطح الأرض.</li>
          <li><strong>تجنب التداخل المغناطيسي:</strong> ابتعد عن حافظات الهواتف المغناطيسية، أجهزة اللابتوب، والأسطح المعدنية.</li>
          <li><strong>تفعيل الـ GPS:</strong> للحصول على الزاوية والمسافة الدقيقة بالسنتيمتر من موقعك الحالي للكعبة.</li>
        </ul>
      </div>
    </div>
  `;

  const btnAr=box.querySelector('#qibla-btn-ar');
  const btnCompass=box.querySelector('#qibla-btn-compass');
  const arViewport=box.querySelector('#qibla-ar-viewport');
  const compassSection=box.querySelector('#qibla-compass-section');
  const videoEl=box.querySelector('#qibla-camera-video');
  const cameraFallback=box.querySelector('#qibla-camera-fallback');
  const reqCameraBtn=box.querySelector('#qibla-req-camera-btn');
  const arKaabaWrap=box.querySelector('#qibla-ar-kaaba-wrap');
  const arKaabaCard=box.querySelector('#qibla-ar-kaaba-card');
  const arCrosshair=box.querySelector('#qibla-ar-crosshair');
  const arHint=box.querySelector('#qibla-ar-hint');
  const hintIcon=box.querySelector('#qibla-hint-icon');
  const hintText=box.querySelector('#qibla-hint-text');
  const dialEl=box.querySelector('#qibla-dial');
  const glowRing=box.querySelector('#qibla-glow-ring');
  const bannerEl=box.querySelector('#qibla-align-banner');
  const statusTitle=box.querySelector('#qibla-status-title');
  const statusDesc=box.querySelector('#qibla-status-desc');
  const headingVal=box.querySelector('#qibla-heading-val');
  const headingCard=box.querySelector('#qibla-heading-cardinal');
  const hudHeading=box.querySelector('#qibla-hud-heading');
  const sensorTxt=box.querySelector('#qibla-sensor-txt');
  const sensorState=box.querySelector('#qibla-sensor-state');
  const slider=box.querySelector('#qibla-manual-range');
  const sliderVal=box.querySelector('#qibla-slider-val');
  const permBtn=box.querySelector('#qibla-permission-btn');
  const gpsBtn=box.querySelector('#qibla-gps-trigger');
  const citySelect=box.querySelector('#qibla-city-select');
  const calibModal=box.querySelector('#qibla-calib-modal');
  const calibTrigger=box.querySelector('#qibla-calib-trigger');
  const closeCalibBtn=box.querySelector('#qibla-close-calib-btn');

  const targetMagBtn=box.querySelector('#qibla-target-magnetic');
  const targetTrueBtn=box.querySelector('#qibla-target-true');

  if(targetMagBtn && targetTrueBtn){
    targetMagBtn.onclick=()=>{
      bearingMode='magnetic';
      targetMagBtn.classList.add('is-active');
      targetTrueBtn.classList.remove('is-active');
      box.querySelector('#qibla-card-mag')?.classList.add('qibla-metric-card--active');
      box.querySelector('#qibla-card-true')?.classList.remove('qibla-metric-card--active');
      box.querySelector('#qibla-pill-azimuth').textContent=compassAzimuth+'°';
      box.querySelector('#qibla-hud-azimuth').textContent=compassAzimuth+'°';
      box.querySelector('#qibla-dial').innerHTML=buildCompassDialSvg(compassAzimuth);
      updateHeading(currentHeading, true);
      showToast(`تم التوجيه وفق بوصلة الهاتف: ${compassAzimuth}° (انحراف +${MAGNETIC_DECLINATION}°) 🧭`);
    };

    targetTrueBtn.onclick=()=>{
      bearingMode='true';
      targetTrueBtn.classList.add('is-active');
      targetMagBtn.classList.remove('is-active');
      box.querySelector('#qibla-card-true')?.classList.add('qibla-metric-card--active');
      box.querySelector('#qibla-card-mag')?.classList.remove('qibla-metric-card--active');
      box.querySelector('#qibla-pill-azimuth').textContent=qiblaAzimuth+'°';
      box.querySelector('#qibla-hud-azimuth').textContent=qiblaAzimuth+'°';
      box.querySelector('#qibla-dial').innerHTML=buildCompassDialSvg(qiblaAzimuth);
      updateHeading(currentHeading, true);
      showToast(`تم التوجيه وفق خرائط جوجل وGPS: ${qiblaAzimuth}° 🌐`);
    };
  }

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

  // ── Camera Management for AR Mode ──
  async function startCamera(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      cameraFallback.style.display='flex';
      return;
    }
    try{
      if(mediaStream){
        mediaStream.getTracks().forEach(t=>t.stop());
      }
      mediaStream=await navigator.mediaDevices.getUserMedia({
        video:{
          facingMode:{ ideal:'environment' },
          width:{ ideal:1280 },
          height:{ ideal:720 }
        },
        audio:false
      });
      videoEl.srcObject=mediaStream;
      await videoEl.play().catch(()=>{});
      cameraFallback.style.display='none';
    }catch(err){
      console.warn('[Qibla Camera Error]:', err);
      cameraFallback.style.display='flex';
    }
  }

  function stopCamera(){
    if(mediaStream){
      mediaStream.getTracks().forEach(t=>t.stop());
      mediaStream=null;
    }
  }

  // Tab switching
  btnAr.onclick=()=>{
    currentMode='ar';
    btnAr.classList.add('is-active');
    btnCompass.classList.remove('is-active');
    arViewport.classList.add('is-active');
    compassSection.style.display='none';
    startCamera();
  };

  btnCompass.onclick=()=>{
    currentMode='compass';
    btnCompass.classList.add('is-active');
    btnAr.classList.remove('is-active');
    arViewport.classList.remove('is-active');
    compassSection.style.display='block';
    stopCamera();
  };

  reqCameraBtn.onclick=()=>startCamera();

  // Calibration modal toggles
  calibTrigger.onclick=()=>calibModal.classList.add('is-open');
  closeCalibBtn.onclick=()=>calibModal.classList.remove('is-open');

  // ── Heading Update & AR View Tracking ──
  function updateHeading(targetHeading, isManual=false){
    // Circular smoothing for stability
    if(isManual){
      smoothedHeading=targetHeading;
    }else{
      let d=(targetHeading - smoothedHeading + 540) % 360 - 180;
      smoothedHeading=(smoothedHeading + d * 0.35 + 360) % 360;
    }

    currentHeading=Math.round(smoothedHeading);
    headingVal.textContent=currentHeading+'°';
    headingCard.textContent=getCardinal(currentHeading);
    hudHeading.textContent=currentHeading+'°';

    if(isManual && slider){
      slider.value=currentHeading;
      sliderVal.textContent=currentHeading+'°';
    }

    const activeTarget = bearingMode === 'magnetic' ? compassAzimuth : qiblaAzimuth;

    // 1. Rotate 3D Compass Dial so real North matches 'ش'
    if(dialEl){
      dialEl.style.transform=`rotate(${-currentHeading}deg)`;
    }

    // 2. Rotate Compass Needle directly towards Mecca
    const needleEl=box.querySelector('#qibla-needle-assembly');
    if(needleEl){
      const needleAngle=(activeTarget - currentHeading + 360) % 360;
      needleEl.style.transform=`rotate(${needleAngle}deg)`;
    }

    // 3. Calculate signed shortest angle difference to target Qibla
    let diff=((activeTarget - currentHeading + 540) % 360) - 180;
    const absDiff=Math.abs(diff);
    const isAligned=absDiff <= 3.5;

    // 4. Update AR Kaaba Marker Position on Camera View
    if(arKaabaWrap){
      if(absDiff <= 32){
        arKaabaWrap.style.display='flex';
        const xOffset=(diff / 28) * 38;
        arKaabaWrap.style.transform=`translate(calc(-50% + ${xOffset}vw), -50%)`;
      }else{
        arKaabaWrap.style.display='none';
      }
    }

    // 5. Update Alignment Glow & HUD Feedback
    if(isAligned){
      arCrosshair?.classList.add('is-aligned');
      arKaabaCard?.classList.add('is-aligned');
      glowRing?.classList.add('is-aligned');
      bannerEl?.classList.add('is-aligned');
      arHint?.classList.add('is-aligned');

      statusTitle.textContent='✦ أنت الآن باتجاه القبلة الشريفة تماماً 🕋 ✦';
      statusDesc.textContent=`وجهتك الحالية متطابقة مع الكعبة المشرفة (${activeTarget}°).`;
      hintIcon.textContent='✓';
      hintText.textContent='أنت بمحاذاة الكعبة المشرفة تماماً 🕋';

      if(!vTimer && navigator.vibrate && !isManual){
        try{ navigator.vibrate([40, 50, 60]); }catch(_){}
        vTimer=setTimeout(()=>{ vTimer=null; }, 1800);
      }
    }else{
      arCrosshair?.classList.remove('is-aligned');
      arKaabaCard?.classList.remove('is-aligned');
      glowRing?.classList.remove('is-aligned');
      bannerEl?.classList.remove('is-aligned');
      arHint?.classList.remove('is-aligned');

      const turnWay=diff > 0 ? 'لليمين ↻' : 'لليسار ↺';
      const arrowIcon=diff > 0 ? '↻' : '↺';
      statusTitle.textContent=`أدر الهاتف ${turnWay} بمقدار ${Math.round(absDiff)}°`;
      statusDesc.textContent=`الهدف: ${activeTarget}° (${bearingMode === 'magnetic' ? 'بوصلة مغناطيسية' : 'خرائط جوجل'}) · وجهة هاتفك: ${currentHeading}°`;
      hintIcon.textContent=arrowIcon;
      hintText.textContent=`أدر الهاتف ${turnWay} بمقدار ${Math.round(absDiff)}°`;
    }
  }

  // ── Multi-Source Sensor Listener (Absolute + 3D Tilt-Compensated) ──
  function onOrientation(e){
    const webkitHeading = typeof e.webkitCompassHeading!=='undefined' ? e.webkitCompassHeading : null;
    const isCam = currentMode === 'ar';
    const computed = computeCompassHeading(e.alpha, e.beta, e.gamma, webkitHeading, isCam);

    if(computed!==null && !isNaN(computed)){
      if(!hasSensor){
        hasSensor=true;
        sensorState.classList.add('is-active');
        sensorTxt.textContent='مستشعر البوصلة الجيومغناطيسية نشط ومباشر 🟢';
      }
      updateHeading(computed, false);
    }
  }

  // Generic Sensor API: AbsoluteOrientationSensor (Chrome / Android)
  let absSensor=null;
  if(typeof window!=='undefined' && 'AbsoluteOrientationSensor' in window){
    try{
      absSensor=new AbsoluteOrientationSensor({ frequency:60, referenceFrame:'device' });
      absSensor.addEventListener('reading', ()=>{
        if(absSensor.quaternion){
          const [q0, q1, q2, q3] = absSensor.quaternion;
          // Calculate heading from quaternion
          const heading = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - 2 * (q1 * q1 + q2 * q2)) * (180 / Math.PI);
          const trueHeading = (heading + 360) % 360;
          if(!hasSensor){
            hasSensor=true;
            sensorState.classList.add('is-active');
            sensorTxt.textContent='مستشعر AbsoluteOrientationSensor عالي الدقة نشط 🟢';
          }
          updateHeading(trueHeading, false);
        }
      });
      absSensor.start();
    }catch(_){}
  }

  if(typeof window!=='undefined'){
    if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
      permBtn.style.display='inline-flex';
      permBtn.onclick=async()=>{
        try{
          const res=await DeviceOrientationEvent.requestPermission();
          if(res==='granted'){
            permBtn.style.display='none';
            window.addEventListener('deviceorientation', onOrientation, true);
            showToast('تم تفعيل مستشعر البوصلة بنجاح 🧭');
          }
        }catch(err){
          showToast('تعذر الوصول لمستشعر الحركة.');
        }
      };
    }else{
      if('ondeviceorientationabsolute' in window){
        window.addEventListener('deviceorientationabsolute', onOrientation, true);
      }
      window.addEventListener('deviceorientation', onOrientation, true);
    }
  }

  slider.oninput=()=>{
    updateHeading(Number(slider.value), true);
    sensorTxt.textContent='وضع التدوير اليدوي التجريبي 🕹️';
  };

  // ── City Preset Change ──
  citySelect.onchange=(e)=>{
    const [latStr, lngStr] = e.target.value.split(',');
    currentLat = Number(latStr);
    currentLng = Number(lngStr);
    cityName = e.target.options[e.target.selectedIndex].text;
    applyLocationUpdate();
    const activeTarget = bearingMode === 'magnetic' ? compassAzimuth : qiblaAzimuth;
    showToast(`تم ضبط الإحداثيات لـ: ${cityName} (القبلة: ${activeTarget}°) 🕋`);
  };

  function applyLocationUpdate(){
    qiblaAzimuth=calcQiblaAzimuth(currentLat, currentLng);
    compassAzimuth=Math.round((qiblaAzimuth - MAGNETIC_DECLINATION) * 100) / 100;
    kaabaDistance=calcKaabaDistance(currentLat, currentLng);

    const activeTarget = bearingMode === 'magnetic' ? compassAzimuth : qiblaAzimuth;

    box.querySelector('#qibla-loc-name').textContent=cityName;
    box.querySelector('#qibla-pill-azimuth').textContent=activeTarget+'°';
    box.querySelector('#qibla-azimuth-val').textContent=qiblaAzimuth+'°';
    box.querySelector('#qibla-azimuth-mag').textContent=compassAzimuth+'°';
    box.querySelector('#qibla-target-mag-val').textContent=compassAzimuth+'°';
    box.querySelector('#qibla-target-true-val').textContent=qiblaAzimuth+'°';
    box.querySelector('#qibla-distance-val').textContent=kaabaDistance.toLocaleString('ar-EG');
    box.querySelector('#qibla-hud-azimuth').textContent=activeTarget+'°';
    box.querySelector('#qibla-hud-dist').textContent=kaabaDistance.toLocaleString('ar-EG')+' كم';
    box.querySelector('#qibla-dial').innerHTML=buildCompassDialSvg(activeTarget);

    updateHeading(currentHeading, true);
  }

  // ── High-Accuracy GPS ──
  gpsBtn.onclick=()=>{
    if(!navigator.geolocation){
      showToast('خدمة تحديد الموقع (GPS) غير مدعومة في متصفحك.');
      return;
    }
    gpsBtn.disabled=true;
    gpsBtn.innerHTML='<span>جاري تحديد موقعك الدقيق…</span> <div class="spinner spinner-sm" style="display:inline-block"></div>';
    
    navigator.geolocation.getCurrentPosition(pos=>{
      currentLat=pos.coords.latitude;
      currentLng=pos.coords.longitude;
      cityName=`موقعك الدقيق (GPS: ${currentLat.toFixed(2)}°, ${currentLng.toFixed(2)}°)`;
      applyLocationUpdate();
      gpsBtn.disabled=false;
      gpsBtn.innerHTML='<span>موقعي الحالي (GPS)</span> <span class="qibla-gps-icon">✓</span>';
      showToast(`تم تحديد موقعك بدقة GPS (زاوية القبلة: ${qiblaAzimuth}°) 🕋`);
    },err=>{
      gpsBtn.disabled=false;
      gpsBtn.innerHTML='<span>موقعي الحالي (GPS)</span> <span class="qibla-gps-icon">🎯</span>';
      showToast('تعذر الحصول على إحداثيات GPS بدقة. تم الإبقاء على الإحداثيات المحددة.');
    },{enableHighAccuracy:true, timeout:10000, maximumAge:0});
  };

  // Auto-detect GPS if available
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      currentLat=pos.coords.latitude;
      currentLng=pos.coords.longitude;
      cityName=`موقعي الدقيق (GPS: ${currentLat.toFixed(3)}°, ${currentLng.toFixed(3)}°)`;
      applyLocationUpdate();
    }, ()=>{}, {enableHighAccuracy:true, timeout:6000, maximumAge:60000});
  }

  // Try starting Camera for AR mode on mobile
  if(window.innerWidth <= 820){
    startCamera();
  }else{
    // Desktop: default to 3D compass mode
    btnCompass.click();
  }

  updateHeading(0, true);
}

// ─────────────────────────────────────────────────────────────
// 🕌 خوارزمية الحساب الفلكي لمواقيت الصلاة في مصر والدقهلية
// وفق معايير الهيئة المصرية العامة للمساحة (فجر 19.5°، عشاء 17.5°، عصر شافعي)
// ─────────────────────────────────────────────────────────────
function calculatePrayerTimes(date = new Date(), lat = 31.1582, lng = 31.9360, timezone = 3){
  const d2r = Math.PI / 180;
  const r2d = 180 / Math.PI;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const d = jd - 2451545.0;

  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(g * d2r) + 0.020 * Math.sin(2 * g * d2r)) % 360;
  const e = 23.439 - 0.00000036 * d;
  const RA = Math.atan2(Math.cos(e * d2r) * Math.sin(L * d2r), Math.cos(L * d2r)) * r2d / 15;
  const decl = Math.asin(Math.sin(e * d2r) * Math.sin(L * d2r)) * r2d;
  const EqT = q / 15 - ((RA + 24) % 24);

  const noon = 12 + timezone - lng / 15 - EqT;

  function sunHourAngle(angle, direction = 'ccw') {
    const cosHA = (Math.sin(angle * d2r) - Math.sin(lat * d2r) * Math.sin(decl * d2r)) / (Math.cos(lat * d2r) * Math.cos(decl * d2r));
    if (cosHA > 1 || cosHA < -1) return null;
    const ha = Math.acos(cosHA) * r2d / 15;
    return direction === 'ccw' ? -ha : ha;
  }

  const fajrHA = sunHourAngle(-19.5, 'ccw');
  const sunriseHA = sunHourAngle(-0.8333, 'ccw');
  const sunsetHA = sunHourAngle(-0.8333, 'cw');
  const ishaHA = sunHourAngle(-17.5, 'cw');

  const noonZenith = Math.abs(lat - decl);
  const asrZenith = Math.atan(1 + Math.tan(noonZenith * d2r)) * r2d;
  const asrHA = sunHourAngle(90 - asrZenith, 'cw');

  function toMinutes(hourDec) {
    let h = (hourDec + 24) % 24;
    return Math.round(h * 60);
  }

  function formatTime(minutes) {
    const h24 = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    const h12 = h24 % 12 || 12;
    const period = h24 >= 12 ? 'م' : 'ص';
    return {
      time24: pad(h24) + ':' + pad(m),
      time12: pad(h12) + ':' + pad(m) + ' ' + period,
      totalMinutes: minutes
    };
  }

  const prayers = [
    { id: 'fajr', name: 'الفجر', icon: '🌙', ...formatTime(toMinutes(noon + fajrHA)) },
    { id: 'sunrise', name: 'الشروق', icon: '🌅', ...formatTime(toMinutes(noon + sunriseHA)) },
    { id: 'dhuhr', name: 'الظهر', icon: '☀️', ...formatTime(toMinutes(noon + 2/60)) },
    { id: 'asr', name: 'العصر', icon: '🌤️', ...formatTime(toMinutes(noon + asrHA)) },
    { id: 'maghrib', name: 'المغرب', icon: '🌇', ...formatTime(toMinutes(noon + sunsetHA + 2/60)) },
    { id: 'isha', name: 'العشاء', icon: '🌌', ...formatTime(toMinutes(noon + ishaHA)) }
  ];

  // Calculate Next Prayer
  const now = new Date();
  const currentMinutes = (now.getUTCHours() + timezone) * 60 + now.getUTCMinutes();
  const currentSecondsInDay = currentMinutes * 60 + now.getUTCSeconds();

  let nextPrayer = null;
  let remainingSecs = 0;

  for (const p of prayers) {
    if (p.id === 'sunrise') continue;
    const pSeconds = p.totalMinutes * 60;
    if (pSeconds > currentSecondsInDay) {
      nextPrayer = p;
      remainingSecs = pSeconds - currentSecondsInDay;
      break;
    }
  }

  if (!nextPrayer) {
    nextPrayer = prayers[0];
    remainingSecs = (24 * 3600 - currentSecondsInDay) + (prayers[0].totalMinutes * 60);
  }

  const remH = Math.max(0, Math.floor(remainingSecs / 3600));
  const remM = Math.max(0, Math.floor((remainingSecs % 3600) / 60));
  const remS = Math.max(0, remainingSecs % 60);

  const hUnit = (remH >= 3 && remH <= 10) ? 'ساعات' : (remH === 2 ? 'ساعتان' : (remH === 1 ? 'ساعة واحدة' : 'ساعة'));
  const mUnit = 'دقيقة';
  const sUnit = 'ثانية';

  const hStr = String(remH);
  const mStr = String(remM);
  const sStr = String(remS).padStart(2, '0');

  const remText = `${hStr} ${hUnit} و ${mStr} ${mUnit} و ${sStr} ${sUnit}`;

  return { prayers, nextPrayer, remainingSecs, remH, remM, remS, hUnit, mUnit, sUnit, hStr, mStr, sStr, remText };
}

// ─────────────────────────────────────────────────────────────
// 🕌 صفحة مواقيت الصلاة والسنن والأذكار والأركان الكاملة
// ─────────────────────────────────────────────────────────────
async function renderPrayerTimes(container){
  container.innerHTML = shell(
    'مواقيت الصلاة والسنن والأذكار',
    'مواقيت الصلاة الدقيقة للمنصورة والمنزلة والمطرية والقرى المجاورة مع أذكار بعد الصلاة، أركان الصلاة، والسنن الرواتب.',
    '🕌',
    false
  );
  const box = container.querySelector('#ih-content');

  let currentLat = 31.1582, currentLng = 31.9360;
  let currentCity = 'المنزلة (المركز)، الدقهلية';
  let activeTab = 'prayers'; // 'prayers' | 'azkar' | 'arkan' | 'sunan'

  function renderFullView(){
    const data = calculatePrayerTimes(new Date(), currentLat, currentLng, 3);
    const nowStr = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    box.innerHTML = `
      <div class="ih-prayers-wrap">
        <!-- Top Navigation Pills -->
        <div class="ih-prayers-nav">
          <button type="button" class="ih-pnav-btn ${activeTab === 'prayers' ? 'is-active' : ''}" data-tab="prayers">
            <span>⏱️ مواقيت الصلاة</span>
          </button>
          <button type="button" class="ih-pnav-btn ${activeTab === 'azkar' ? 'is-active' : ''}" data-tab="azkar">
            <span>📿 أذكار بعد الصلاة</span>
          </button>
          <button type="button" class="ih-pnav-btn ${activeTab === 'arkan' ? 'is-active' : ''}" data-tab="arkan">
            <span>🏛️ أركان وواجبات الصلاة</span>
          </button>
          <button type="button" class="ih-pnav-btn ${activeTab === 'sunan' ? 'is-active' : ''}" data-tab="sunan">
            <span>⭐ السنن والرواتب</span>
          </button>
        </div>

        <!-- Tab 1: Prayers -->
        <div class="ih-ptab-content ${activeTab === 'prayers' ? 'is-active' : ''}" id="tab-prayers">
          <!-- Next Prayer Countdown Hero -->
          <div class="ih-p-hero">
            <div class="ih-p-hero-inner">
              <div class="ih-p-hero-tag">الصلاة القادمة بمشيئة الله</div>
              <h2 class="ih-p-hero-title">صلاة ${data.nextPrayer.name}</h2>
              <div class="ih-p-hero-time">${data.nextPrayer.time12}</div>
              
              <!-- 3 Boxes: ساعات / دقيقة / ثانية -->
              <div class="ih-p-countdown-boxes" aria-label="${data.remText}">
                <div class="ih-pcd-item">
                  <span class="ih-pcd-num" id="ih-pcd-h">${data.hStr}</span>
                  <span class="ih-pcd-lbl" id="ih-pcd-hlbl">${data.hUnit}</span>
                </div>
                <div class="ih-pcd-item">
                  <span class="ih-pcd-num" id="ih-pcd-m">${data.mStr}</span>
                  <span class="ih-pcd-lbl">${data.mUnit}</span>
                </div>
                <div class="ih-pcd-item">
                  <span class="ih-pcd-num" id="ih-pcd-s">${data.sStr}</span>
                  <span class="ih-pcd-lbl">${data.sUnit}</span>
                </div>
              </div>

              <div class="ih-p-countdown-box">
                <div class="ih-p-countdown-val" id="ih-p-countdown-val">${data.remText}</div>
                <div class="ih-p-countdown-sub">المتبقي حتى رفع الأذان</div>
              </div>

              <!-- Location and GPS Header Strip -->
              <div class="ih-p-loc-bar">
                <span class="ih-p-loc-name">📍 ${esc(currentCity)} · ${nowStr}</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px">
                  <select id="ih-prayer-city-select" class="jb-select" style="padding:6px 14px;border-radius:12px;font-size:0.86rem;background:var(--surface-3);color:var(--text-primary)">
                    <option value="31.1582,31.9360" ${currentCity.includes('المنزلة') ? 'selected' : ''}>المنزلة (المركز)</option>
                    <option value="31.1825,32.0315" ${currentCity.includes('المطرية') ? 'selected' : ''}>المطرية (دقهلية)</option>
                    <option value="31.1865,31.8980" ${currentCity.includes('الجمالية') ? 'selected' : ''}>الجمالية</option>
                    <option value="31.1290,31.9120" ${currentCity.includes('الأحمدية') ? 'selected' : ''}>الأحمدية</option>
                    <option value="31.1620,31.9750" ${currentCity.includes('العزيزة') ? 'selected' : ''}>العزيزة</option>
                    <option value="31.1410,31.8950" ${currentCity.includes('البصراط') ? 'selected' : ''}>البصراط</option>
                    <option value="31.2150,31.9820" ${currentCity.includes('النسايمة') ? 'selected' : ''}>النسايمة</option>
                    <option value="31.1340,31.8720" ${currentCity.includes('ميت شريف') ? 'selected' : ''}>ميت شريف</option>
                    <option value="31.1920,31.8750" ${currentCity.includes('الروضة') ? 'selected' : ''}>الروضة</option>
                    <option value="31.2410,32.0520" ${currentCity.includes('الشبول') ? 'selected' : ''}>الشبول</option>
                    <option value="31.0364,31.3807" ${currentCity.includes('المنصورة') ? 'selected' : ''}>المنصورة (عاصمة المحافظة)</option>
                    <option value="31.2565,32.2841" ${currentCity.includes('بورسعيد') ? 'selected' : ''}>بورسعيد</option>
                    <option value="31.4165,31.8133" ${currentCity.includes('دمياط') ? 'selected' : ''}>دمياط ورأس البر</option>
                  </select>
                  <button type="button" id="ih-prayer-gps-btn" class="ih-btn" style="padding:6px 14px;border-radius:12px;font-size:0.84rem">
                    <span>موقعي الحالي (GPS) 🎯</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 6 Prayer Cards Grid -->
          <div class="ih-p-cards-grid">
            ${data.prayers.map(p => `
              <div class="ih-p-card ${p.id === data.nextPrayer.id ? 'is-next' : ''}">
                <div class="ih-p-card-icon">${p.icon}</div>
                <h3 class="ih-p-card-name">${p.name}</h3>
                <div class="ih-p-card-time">${p.time12}</div>
                ${p.id === data.nextPrayer.id ? '<span class="ih-p-next-badge">الصلاة القادمة</span>' : ''}
              </div>
            `).join('')}
          </div>

          <!-- Link to Qibla compass -->
          <div class="ih-p-qibla-banner">
            <div style="font-size:2rem">🧭</div>
            <div style="flex:1">
              <strong style="display:block;font-size:1.05rem;color:var(--text-primary)">هل تريد تحديد اتجاه القبلة للصلاة؟</strong>
              <p style="margin:0;font-size:0.86rem;color:var(--text-secondary)">استخدم بوصلة الكعبة ثلاثية الأبعاد وتقنية الواقع المعزز (AR).</p>
            </div>
            <a href="./qibla.html" class="ih-btn" style="border-radius:999px;padding:8px 18px">فتح البوصلة 🕋</a>
          </div>
        </div>

        <!-- Tab 2: Azkar After Prayer -->
        <div class="ih-ptab-content ${activeTab === 'azkar' ? 'is-active' : ''}" id="tab-azkar">
          <div class="ih-section-header">
            <h3 class="ih-section-title">📿 أذكار دبر الصلوات المكتوبة (المفروضة)</h3>
            <p class="ih-section-sub">أذكار مأثورة وثابتة عن النبي ﷺ يُستحب للمسلم قولها عقب التسليم من الفريضة مباشرة.</p>
          </div>

          <div class="ih-azkar-list">
            <!-- Azkar Item 1 -->
            <div class="ih-azkar-card" data-count="3">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">«أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ، اللَّهُمَّ أَنْتَ السَّلامُ وَمِنْكَ السَّلامُ، تَبَارَكْتَ يَا ذَا الجَلالِ وَالإِكْرَامِ»</p>
                <div class="ih-azkar-source">صحيح مسلم — يُقال 3 مرات عقب التسليم</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="3">
                  <span class="ih-tasbeeh-num">3</span>
                  <small>مرات</small>
                </button>
              </div>
            </div>

            <!-- Azkar Item 2 -->
            <div class="ih-azkar-card" data-count="1">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">«لا إِلَهَ إِلا اللهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لا مَانِعَ لِمَا أَعْطَيْتَ، وَلا مُعْطِيَ لِمَا مَنَعْتَ، وَلا يَنْفَعُ ذَا الجَدِّ مِنْكَ الجَدُّ»</p>
                <div class="ih-azkar-source">متفق عليه — مرة واحدة</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="1">
                  <span class="ih-tasbeeh-num">1</span>
                  <small>مرة</small>
                </button>
              </div>
            </div>

            <!-- Azkar Item 3: Tasbeeh 33 -->
            <div class="ih-azkar-card" data-count="33">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">«سُبْحَانَ اللهِ»</p>
                <div class="ih-azkar-source">صحيح مسلم — 33 مرة</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="33">
                  <span class="ih-tasbeeh-num">33</span>
                  <small>تسبيحة</small>
                </button>
              </div>
            </div>

            <!-- Azkar Item 4: Tahmeed 33 -->
            <div class="ih-azkar-card" data-count="33">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">«الْحَمْدُ للهِ»</p>
                <div class="ih-azkar-source">صحيح مسلم — 33 مرة</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="33">
                  <span class="ih-tasbeeh-num">33</span>
                  <small>تحميدة</small>
                </button>
              </div>
            </div>

            <!-- Azkar Item 5: Takbeer 33 -->
            <div class="ih-azkar-card" data-count="33">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">«اللهُ أَكْبَرُ»</p>
                <div class="ih-azkar-source">صحيح مسلم — 33 مرة</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="33">
                  <span class="ih-tasbeeh-num">33</span>
                  <small>تكبيرة</small>
                </button>
              </div>
            </div>

            <!-- Azkar Item 6: Tamam 100 -->
            <div class="ih-azkar-card" data-count="1">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">«لا إِلَهَ إِلا اللهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ»</p>
                <div class="ih-azkar-source">صحيح مسلم — تمام المائة؛ غُفرت خطاياه وإن كانت مثل زبد البحر</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="1">
                  <span class="ih-tasbeeh-num">1</span>
                  <small>مرة</small>
                </button>
              </div>
            </div>

            <!-- Ayat Al-Kursi -->
            <div class="ih-azkar-card" data-count="1">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾</p>
                <div class="ih-azkar-source">رواه النسائي وصححه الألباني: «مَنْ قَرَأَ آيَةَ الْكُرْسِيِّ دُبُرَ كُلِّ صَلَاةٍ مَكْتُوبَةٍ لَمْ يَمْنَعْهُ مِنْ دُخُولِ الْجَنَّةِ إِلَّا أَنْ يَمُوتَ».</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="1">
                  <span class="ih-tasbeeh-num">1</span>
                  <small>مرة</small>
                </button>
              </div>
            </div>

            <!-- Mu'awwidhat -->
            <div class="ih-azkar-card" data-count="1">
              <div class="ih-azkar-body">
                <p class="ih-azkar-text">قراءة سورة الإخلاص وسورة الفلق وسورة الناس (مرة بعد كل صلاة، وثلاث مرات بعد الفجر والمغرب).</p>
                <div class="ih-azkar-source">سنن أبي داود والترمذي</div>
              </div>
              <div class="ih-azkar-counter">
                <button type="button" class="ih-tasbeeh-btn" data-max="3">
                  <span class="ih-tasbeeh-num">3</span>
                  <small>مرات</small>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Arkan & Shuroot -->
        <div class="ih-ptab-content ${activeTab === 'arkan' ? 'is-active' : ''}" id="tab-arkan">
          <div class="ih-section-header">
            <h3 class="ih-section-title">🏛️ أركان الصلاة وشروطها وواجباتها</h3>
            <p class="ih-section-sub">الفرق بين الركن (لا يسقط عمداً ولا سهواً) والواجب (يُجبر بسجود السهو) وشروط الصحة.</p>
          </div>

          <!-- Shuroot Box -->
          <div class="ih-law-box">
            <h4 class="ih-law-title">🔹 شروط صحة الصلاة التسعة (تسبق الصلاة):</h4>
            <ol class="ih-law-list">
              <li><strong>الإسلام:</strong> فالصلاة لا تصح من كافر.</li>
              <li><strong>العقل:</strong> فلا تجب ولا تصح من مجنون أو فاقد العقل.</li>
              <li><strong>التمييز:</strong> لقوله ﷺ: «مُرُوا أَوْلادَكُمْ بِالصَّلاةِ وَهُمْ أَبْنَاءُ سَبْعِ سِنِينَ».</li>
              <li><strong>رفع الحَدَث:</strong> بالوضوء من الأصغر، والغُسل من الأكبر.</li>
              <li><strong>طهارة الخَبَث:</strong> طهارة البدن، والثوب، ومكان الصلاة.</li>
              <li><strong>سَتْر العورة:</strong> عورة الرجل من السرة للركبة، والمرأة كلها عورة في الصلاة عدا الوجه والكفين.</li>
              <li><strong>دخول الوقت:</strong> لقوله تعالى: ﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا﴾.</li>
              <li><strong>استقبال القبلة:</strong> التوجه نحو الكعبة المشرفة بمكة المكرمة.</li>
              <li><strong>النيّة:</strong> ومحلها القلب، والتلفظ بها بدعة.</li>
            </ol>
          </div>

          <!-- Arkan Box -->
          <div class="ih-law-box" style="margin-top:20px">
            <h4 class="ih-law-title">⭐ أركان الصلاة الأربعة عشر (إن تُركت بطلت الصلاة):</h4>
            <div class="ih-arkan-grid">
              <div class="ih-arkan-card"><span class="ih-arkan-num">1</span><strong>القيام مع القدرة</strong> في الفريضة</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">2</span><strong>تكبيرة الإحرام</strong> (الله أكبر)</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">3</span><strong>قراءة سورة الفاتحة</strong> في كل ركعة</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">4</span><strong>الركوع</strong> وحَدّه أن تمس يداه ركبتيه</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">5</span><strong>الرفع والاعتدال</strong> قائماً من الركوع</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">6</span><strong>السجود</strong> على الأعضاء السبعة</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">7</span><strong>الرفع والجلوس</strong> بين السجدتين</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">8</span><strong>الطمأنينة</strong> في جميع الأركان</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">9</span><strong>التشهد الأخير</strong></div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">10</span><strong>الجلوس للتشهد الأخير</strong></div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">11</span><strong>الصلاة على النبي ﷺ</strong> في الأخير</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">12</span><strong>التسليم</strong> (عن اليمين والشمال)</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">13</span><strong>الترتيب</strong> بين الأركان</div>
              <div class="ih-arkan-card"><span class="ih-arkan-num">14</span><strong>الخشوع</strong> واستحضار عظمة الله</div>
            </div>
          </div>

          <!-- Wajibat Box -->
          <div class="ih-law-box" style="margin-top:20px">
            <h4 class="ih-law-title">🔸 واجبات الصلاة الثمانية (تُجبر بسجود السهو إن سها عنها):</h4>
            <ul class="ih-law-list">
              <li>التكبيرات غير تكبيرة الإحرام (تكبيرات الانتقال).</li>
              <li>قول «سَمِعَ اللهُ لِمَنْ حَمِدَهُ» للإمام والمنفرد.</li>
              <li>قول «رَبَّنَا وَلَكَ الحَمْدُ» للجميع.</li>
              <li>قول «سُبْحَانَ رَبِّيَ العَظِيمِ» مرة في الركوع.</li>
              <li>قول «سُبْحَانَ رَبِّيَ الأَعْلَى» مرة في السجود.</li>
              <li>قول «رَبِّ اغْفِرْ لِي» بين السجدتين.</li>
              <li>التشهد الأول.</li>
              <li>الجلوس للتشهد الأول.</li>
            </ul>
          </div>
        </div>

        <!-- Tab 4: Sunan -->
        <div class="ih-ptab-content ${activeTab === 'sunan' ? 'is-active' : ''}" id="tab-sunan">
          <div class="ih-section-header">
            <h3 class="ih-section-title">⭐ السنن الرواتب والنوافل وعدد ركعاتها</h3>
            <p class="ih-section-sub">عن أم حبيبة رضي الله عنها قالت: سمعت رسول الله ﷺ يقول: «مَنْ صَلَّى اثْنَتَيْ عَشْرَةَ رَكْعَةً فِي يَوْمٍ وَلَيْلَةٍ بُنِيَ لَهُ بِهِنَّ بَيْتٌ فِي الْجَنَّةِ» (صحيح مسلم).</p>
          </div>

          <div class="ih-sunan-table-wrap">
            <table class="ih-sunan-table">
              <thead>
                <tr>
                  <th>الصلاة</th>
                  <th>السنن القبلية</th>
                  <th>الفريضة</th>
                  <th>السنن البعدية</th>
                  <th>إجمالي الرواتب</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>صلاة الفجر</strong></td>
                  <td><span class="ih-badge-sunnah">ركعتان (مؤكدة)</span></td>
                  <td>ركعتان</td>
                  <td>—</td>
                  <td><strong>ركعتان</strong></td>
                </tr>
                <tr>
                  <td><strong>صلاة الظهر</strong></td>
                  <td><span class="ih-badge-sunnah">4 ركعات (بتسليمتين)</span></td>
                  <td>4 ركعات</td>
                  <td><span class="ih-badge-sunnah">ركعتان (مؤكدة)</span></td>
                  <td><strong>6 ركعات</strong></td>
                </tr>
                <tr>
                  <td><strong>صلاة العصر</strong></td>
                  <td>4 ركعات (مستحبة غير راتبة)</td>
                  <td>4 ركعات</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td><strong>صلاة المغرب</strong></td>
                  <td>ركعتان (مستحبة)</td>
                  <td>3 ركعات</td>
                  <td><span class="ih-badge-sunnah">ركعتان (مؤكدة)</span></td>
                  <td><strong>ركعتان</strong></td>
                </tr>
                <tr>
                  <td><strong>صلاة العشاء</strong></td>
                  <td>ركعتان (مستحبة)</td>
                  <td>4 ركعات</td>
                  <td><span class="ih-badge-sunnah">ركعتان (مؤكدة)</span></td>
                  <td><strong>ركعتان</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Other Nawafil -->
          <div class="ih-nawafil-grid" style="margin-top:24px">
            <div class="ih-nafl-card">
              <h4>☀️ صلاة الضحى (صلاة الأوابين)</h4>
              <p>ركعتان إلى ثمان ركعات، وقتها بعد شروق الشمس بـ 15 دقيقة حتى قبل الظهر بنصف ساعة. فضلها: تجزئ عن 360 صدقة عن مفاصل الجسد.</p>
            </div>
            <div class="ih-nafl-card">
              <h4>🌌 صلاة الشفع والوتر</h4>
              <p>أقلها ركعة وأكملها 3 ركعات أو 5 أو أكثر، وقتها بعد العشاء حتى طلوع الفجر، وأفضلها في الثلث الأخير من الليل.</p>
            </div>
            <div class="ih-nafl-card">
              <h4>✨ قيام الليل والتهجد</h4>
              <p>دَأْبُ الصالحين وشرف المؤمن، يُصلى مثنى مثنى، وختامه بركعة الوتر لقوله ﷺ: «اجْعَلُوا آخِرَ صَلَاتِكُمْ بِاللَّيْلِ وِتْرًا».</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind Tab switching
    box.querySelectorAll('.ih-pnav-btn').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.getAttribute('data-tab');
        renderFullView();
      };
    });

    // Bind City select
    const citySel = box.querySelector('#ih-prayer-city-select');
    if (citySel) {
      citySel.onchange = (e) => {
        const [latStr, lngStr] = e.target.value.split(',');
        currentLat = Number(latStr);
        currentLng = Number(lngStr);
        currentCity = e.target.options[e.target.selectedIndex].text;
        renderFullView();
        showToast(`تم تحديث مواقيت الصلاة لـ: ${currentCity} 🕌`);
      };
    }

    // Bind GPS button
    const gpsBtn = box.querySelector('#ih-prayer-gps-btn');
    if (gpsBtn) {
      gpsBtn.onclick = () => {
        if (!navigator.geolocation) {
          showToast('خدمة تحديد الموقع (GPS) غير مدعومة.');
          return;
        }
        gpsBtn.disabled = true;
        gpsBtn.textContent = 'جاري التحديد...';
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            currentCity = `موقعي الحالي (GPS: ${currentLat.toFixed(2)}°, ${currentLng.toFixed(2)}°)`;
            renderFullView();
            showToast('تم تحديد مواقيت الصلاة بدقة GPS لموقعك الحالي 🕌');
          },
          () => {
            gpsBtn.disabled = false;
            gpsBtn.textContent = 'موقعي الحالي (GPS) 🎯';
            showToast('تعذر جلب موقع GPS. تم الاحتفاظ بالمدينة المحددة.');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      };
    }

    // Bind interactive Tasbeeh buttons
    box.querySelectorAll('.ih-tasbeeh-btn').forEach(btn => {
      let count = Number(btn.getAttribute('data-max') || 33);
      btn.onclick = () => {
        if (count > 0) {
          count--;
          btn.querySelector('.ih-tasbeeh-num').textContent = count;
          if (navigator.vibrate) {
            try { navigator.vibrate(25); } catch(_) {}
          }
          if (count === 0) {
            btn.classList.add('is-done');
            btn.querySelector('.ih-tasbeeh-num').textContent = '✓';
            showToast('أحسنت! أتممت هذا الذكر المبارك بنجاح ✨');
          }
        } else {
          // Reset
          count = Number(btn.getAttribute('data-max') || 33);
          btn.classList.remove('is-done');
          btn.querySelector('.ih-tasbeeh-num').textContent = count;
        }
      };
    });
  }

  renderFullView();

  // Auto live ticker for countdown
  const ticker = setInterval(() => {
    if (!document.getElementById('ih-p-countdown-val') && !document.getElementById('ih-pcd-s')) {
      clearInterval(ticker);
      return;
    }
    const data = calculatePrayerTimes(new Date(), currentLat, currentLng, 3);
    const el = document.getElementById('ih-p-countdown-val');
    if (el) el.textContent = data.remText;
    const elH = document.getElementById('ih-pcd-h');
    if (elH) elH.textContent = data.hStr;
    const elHL = document.getElementById('ih-pcd-hlbl');
    if (elHL) elHL.textContent = data.hUnit;
    const elM = document.getElementById('ih-pcd-m');
    if (elM) elM.textContent = data.mStr;
    const elS = document.getElementById('ih-pcd-s');
    if (elS) elS.textContent = data.sStr;
  }, 1000);
}

export {renderQuran,renderHadith,renderQuranSearch,renderQuranSurah,renderQibla,renderPrayerTimes,calculatePrayerTimes};

