import { generateBusinessSEOEnglish, escapeHtml } from './src/js/utils/seo-entity.js';
import fs from 'fs';
import path from 'path';
const ROOT=process.cwd(),EN=path.join(ROOT,'en'),SITE='https://dalilmanzala.com';
const P={index:['Dalil El Manzala & El Matariya | Local Business Directory','Discover verified businesses, services, shops, professionals, offers and local places in El Manzala and El Matariya, Dakahlia, Egypt.','/en/','/'],places:['Places & Local Businesses in El Manzala & El Matariya','Browse local businesses, shops, services, professionals and organizations across El Manzala and El Matariya, Dakahlia, Egypt.','/en/places/','/places.html'],categories:['Business Categories & Services | Dalil El Manzala','Explore business categories, professions and local services in El Manzala and El Matariya, Dakahlia, Egypt.','/en/categories/','/categories.html'],manzala:['El Manzala Local Directory | Businesses & Services','Find businesses, shops, professionals, services and local places in El Manzala, Dakahlia, Egypt.','/en/manzala/','/manzala.html'],matariya:['El Matariya Local Directory | Businesses & Services','Find businesses, shops, professionals, services and local places in El Matariya, Dakahlia, Egypt.','/en/matariya/','/matariya.html'],offers:['Local Offers & Deals | El Manzala & El Matariya','Discover current local offers, discounts and promotions from businesses in El Manzala and El Matariya.','/en/offers/','/offers.html'],now:['Open Now | Places Open Today in El Manzala & El Matariya','Find local places and services that are open now in El Manzala and El Matariya.','/en/now/','/now.html'],'around-me':['Places Near Me | Local Directory & Nearby Services','Find nearby businesses, services and places using your location in El Manzala and El Matariya.','/en/around-me/','/around-me.html'],products:['Local Products & Prices | El Manzala & El Matariya','Browse local products, prices and catalogs from businesses in El Manzala and El Matariya.','/en/products/','/products.html'],contact:['Contact Dalil El Manzala & El Matariya','Contact the directory team for support, corrections, verification and business listing requests.','/en/contact/','/contact.html'],privacy:['Privacy Policy | Dalil El Manzala & El Matariya','Privacy policy and data protection information for Dalil El Manzala & El Matariya.','/en/privacy/','/privacy.html'],terms:['Terms of Use | Dalil El Manzala & El Matariya','Terms and conditions for using Dalil El Manzala & El Matariya.','/en/terms/','/terms.html'],legal:['Legal Information | Dalil El Manzala & El Matariya','Legal information and notices for Dalil El Manzala & El Matariya.','/en/legal/','/legal.html'],hadith:['Hadith | Dalil El Manzala & El Matariya','Read selected authentic Hadith resources through Dalil El Manzala & El Matariya.','/en/hadith/','/hadith.html'],quran:['Quran | Dalil El Manzala & El Matariya','Read the Quran through the digital services of Dalil El Manzala & El Matariya.','/en/quran/','/quran.html'],'quran-search':['Quran Search | Dalil El Manzala & El Matariya','Search Quran text and verses through Dalil El Manzala & El Matariya.','/en/quran-search/','/quran-search.html'],'quran-surah':['Quran Surah | Dalil El Manzala & El Matariya','Read Quran surahs through Dalil El Manzala & El Matariya.','/en/quran-surah/','/quran-surah.html']};
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const noindex=new Set(['login','dashboard','favorites','search']);
function html(key,t,d,en,ar){const c=SITE+en,a=SITE+ar,r=noindex.has(key)?'noindex,follow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';const schema={'@context':'https://schema.org','@type':'WebPage','@id':c+'#webpage',url:c,name:t,description:d,inLanguage:'en-EG'};return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="${r}"><meta name="googlebot" content="${r}"><title>${esc(t)}</title><meta name="description" content="${esc(d)}"><link rel="canonical" href="${c}"><link rel="alternate" hreflang="ar" href="${a}"><link rel="alternate" hreflang="en" href="${c}"><link rel="alternate" hreflang="x-default" href="${a}"><meta property="og:type" content="website"><meta property="og:site_name" content="Dalil El Manzala &amp; El Matariya"><meta property="og:locale" content="en_EG"><meta property="og:url" content="${c}"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(d)}"><meta property="og:image" content="${SITE}/assets/images/og-whatsapp.jpg"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(t)}"><meta name="twitter:description" content="${esc(d)}"><meta name="twitter:image" content="${SITE}/assets/images/og-whatsapp.jpg"><meta name="theme-color" content="#1B4F72"><link rel="manifest" href="/en/manifest.webmanifest"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png"><link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png"><link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png"><link rel="icon" type="image/x-icon" href="/favicon.ico"><link rel="shortcut icon" href="/favicon.ico"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"><link rel="stylesheet" href="/src/css/main.css?v=20260913.9"><link rel="stylesheet" href="/src/css/i18n-layout.css?v=20260913.9"><link rel="stylesheet" href="/src/css/en/index.css?v=20260913.9"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body data-lang="en"><div id="app"><div id="header-slot"></div><main id="page-container" class="page-main" role="main"><div class="en-container en-section" style="text-align:start">${englishLandingBody(key,t,d)}</div></main><div id="nav-slot"></div><div id="pwa-slot"></div><div id="footer-slot"></div></div><script defer src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script><script defer src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script><script defer src="https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"></script><script type="module" src="/src/js/core/english-pages.js?v=20260913.9"></script><script type="module" src="/src/js/core/pwa-install.js?v=20260913.9"></script></body></html>`}
function write(rel,key,t,d,en,ar){const dir=path.join(EN,rel);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html(key,t,d,en,ar),'utf8')}
fs.mkdirSync(EN,{recursive:true});for(const [k,[t,d,en,ar]] of Object.entries(P))write(k==='index'?'':k,k,t,d,en,ar);
for(const key of ['search','favorites','login','dashboard'])write(key,key,`${key[0].toUpperCase()+key.slice(1)} | Dalil El Manzala & El Matariya`,'Directory account or utility page.',`/en/${key}/`,`/${key}.html`);
for(const group of ['place','category']){const source=path.join(ROOT,group);if(!fs.existsSync(source))continue;for(const s of fs.readdirSync(source)){if(s==='index')continue;const entry=path.join(source,s,'index.html');if(!fs.existsSync(entry))continue;const label=s.replace(/[-_]+/g,' '),en=`/en/${group}/${encodeURIComponent(s)}/`,ar=`/${group}/${encodeURIComponent(s)}/`;write(`${group}/${s}`,`${group}/${s}`,group==='place'?`${label} | Dalil El Manzala & El Matariya`:`${label} | Business Category`,group==='place'?`Local business profile for ${label} in El Manzala and El Matariya, Dakahlia, Egypt.`:`Local businesses and services in the ${label} category.`,en,ar)}}
function englishLandingBody(key, title, description) {
  const blocks = {
    index: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Browse local businesses, services and places in El Manzala and El Matariya, Dakahlia, Egypt.</p><p><a href="/en/places/">Browse places</a> · <a href="/en/categories/">Browse categories</a> · <a href="/en/manzala/">El Manzala</a> · <a href="/en/matariya/">El Matariya</a></p>`,
    places: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Explore published local businesses and services with direct profile pages and contact details.</p><p><a href="/en/categories/">Browse categories</a> · <a href="/en/manzala/">El Manzala</a> · <a href="/en/matariya/">El Matariya</a></p>`,
    categories: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Each category links to individual local business profiles where available.</p><p><a href="/en/places/">Browse all places</a></p>`,
    manzala: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Find businesses and services in El Manzala through individual local profiles.</p><p><a href="/en/places/">Browse places</a> · <a href="/en/categories/">Browse categories</a></p>`,
    matariya: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Find businesses and services in El Matariya through individual local profiles.</p><p><a href="/en/places/">Browse places</a> · <a href="/en/categories/">Browse categories</a></p>`,
    offers: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Offers and promotions are time-sensitive; verify the individual business page for current details.</p>`,
    now: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Opening status depends on the current working-hours data for each place.</p>`,
    'around-me': `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Location-based discovery uses the user's device permissions when available.</p>`,
    products: `<h1>${esc(title)}</h1><p>${esc(description)}</p><p>Product availability and prices are place-specific and may change.</p>`,
    contact: `<h1>${esc(title)}</h1><p>${esc(description)}</p>`,
    privacy: `<h1>${esc(title)}</h1><p>${esc(description)}</p>`,
    terms: `<h1>${esc(title)}</h1><p>${esc(description)}</p>`,
    legal: `<h1>${esc(title)}</h1><p>${esc(description)}</p>`,
    hadith: `<h1>${esc(title)}</h1><p>${esc(description)}</p>`,
    quran: `<h1>${esc(title)}</h1><p>${esc(description)}</p>`,
    'quran-search': `<h1>${esc(title)}</h1><p>${esc(description)}</p>`,
    'quran-surah': `<h1>${esc(title)}</h1><p>${esc(description)}</p>`
  };
  return `<section class="seo-static-intro" style="max-width:960px;margin:0 auto;padding:24px;text-align:start;line-height:1.8">${blocks[key] || `<h1>${esc(title)}</h1><p>${esc(description)}</p>`}</section>`;
}

function writeEnglishCategory(rel, slug, items) {
  const matching = items.filter(p => {
    const raw = String(p.customCategoryEn || p.custom_category_en || p.customCategory || p.category || p.categoryId || p.category_id || '').trim();
    const normalized = raw.toLowerCase().replace(/\s+/g,'-');
    return normalized === slug.toLowerCase() || normalized === decodeURIComponent(slug).toLowerCase();
  });
  const label = matching[0] ? String(matching[0].customCategoryEn || matching[0].customCategory || matching[0].category || slug).trim().replace(/[-_]+/g,' ') : slug.replace(/[-_]+/g,' ');
  const cards = matching.slice(0,60).map(p => {
    const s=String(p.slug||p.id||'').trim(), n=String(p.nameEn||p.name_en||p.name||'Local Business').trim(), a=String(p.areaEn||p.area_en||p.area||'El Manzala & El Matariya').trim();
    return `<article style="padding:16px;border:1px solid #e2e8f0;border-radius:14px"><h2 style="font-size:1rem;margin:0 0 6px"><a href="/en/place/${encodeURIComponent(s)}/">${esc(n)}</a></h2><p style="margin:0;color:#64748b">${esc(a)}</p></article>`;
  }).join('');
  const html = `<!doctype html><html lang="en" dir="ltr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><title>${esc(label)} | Businesses & Services | Dalil El Manzala</title><meta name="description" content="Browse ${esc(label)} businesses and services in El Manzala and El Matariya, Dakahlia, Egypt."><link rel="canonical" href="${SITE}/en/category/${encodeURIComponent(slug)}/"><link rel="alternate" hreflang="en" href="${SITE}/en/category/${encodeURIComponent(slug)}/"><link rel="alternate" hreflang="x-default" href="${SITE}/category/${encodeURIComponent(slug)}/"><link rel="alternate" hreflang="ar" href="${SITE}/category/${encodeURIComponent(slug)}/"><meta property="og:title" content="${esc(label)} | Dalil El Manzala"><meta property="og:description" content="Browse ${esc(label)} businesses and services in El Manzala and El Matariya."><meta property="og:type" content="website"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage','name':`${label} | Dalil El Manzala`,'url':`${SITE}/en/category/${encodeURIComponent(slug)}/`,'inLanguage':'en-EG'})}</script><link rel="stylesheet" href="/src/css/main.css?v=20260913.9"></head><body data-lang="en"><main id="page-container" class="page-main" role="main"><div class="en-container en-section" style="max-width:1100px;margin:auto;padding:20px"><nav aria-label="Breadcrumb"><a href="/en/">Home</a> / <a href="/en/categories/">Categories</a> / <span>${esc(label)}</span></nav><h1>${esc(label)} businesses and services in El Manzala &amp; El Matariya</h1><p>Browse published local profiles in this category. Individual profiles contain the current available contact and location details.</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">${cards || '<p>No published places are currently listed in this category.</p>'}</div></div></main></body></html>`;
  const dir=path.join(EN,'category',slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html,'utf8');
}

function articleCardsForPlace(placeArticles = []) {
  if (!placeArticles.length) return '';
  const cards = placeArticles.slice(0,6).map((a,index)=>{
    const s=String(a.slug||a.id||'').trim();
    const href=`/article/${encodeURIComponent(s)}/`;
    const img=a.coverImageUrl||a.cover_image_url||a.coverUrl||a.cover_url||'';
    return `<article style="overflow:hidden;border:1px solid #e2e8f0;border-radius:14px;background:#fff">`+
      `<a href="${href}" style="display:block;aspect-ratio:16/9;background:#eef2f7;overflow:hidden">`+
      (img?`<img src="${escapeHtml(img)}" alt="${escapeHtml(a.title||'Article')}" width="640" height="360" loading="${index===0?'eager':'lazy'}" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block">`:`<div style="height:100%;display:grid;place-items:center;font-size:36px">📝</div>`)+
      `</a><div style="padding:12px"><h3 style="margin:0 0 6px;font-size:.98rem;line-height:1.6"><a href="${href}" style="color:#0f172a;text-decoration:none">${escapeHtml(a.title||'Related article')}</a></h3><p style="margin:0;color:#64748b;font-size:.82rem;line-height:1.7">${escapeHtml(a.excerpt||String(a.content||'').slice(0,150))}</p></div></article>`;
  }).join('');
  return `<section aria-labelledby="related-articles-title" style="margin-top:24px;padding:20px;border:1px solid #e2e8f0;border-radius:16px"><h2 id="related-articles-title" style="font-size:1.1rem;margin:0 0 14px">📝 Related articles</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">${cards}</div></section>`;
}
function writeEnglishPlace(rel, place, placeArticles = []) {
  const seo = generateBusinessSEOEnglish(place);
  if (!seo) return;
  const phone = seo.phone ? seo.phone.replace(/\s+/g, '') : '';
  const waRaw = seo.whatsapp ? String(seo.whatsapp).replace(/\D/g, '') : '';
  const wa = waRaw.startsWith('20') ? waRaw : (waRaw.startsWith('0') ? `20${waRaw.slice(1)}` : `20${waRaw}`);
  const waLink = wa && wa.length >= 10 ? `https://wa.me/${wa}` : '';
  const qa = seo.qa.map(item => `<div class="place-qa__item" style="padding:12px 0;border-top:1px solid #e2e8f0"><h2 style="font-size:1rem;margin:0 0 6px">${escapeHtml(item.name)}</h2><p style="line-height:1.8;margin:0;color:#475569">${escapeHtml(item.acceptedAnswer.text)}</p></div>`).join('');
  const html = `<!doctype html><html lang="en" dir="ltr"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <title>${escapeHtml(seo.title)}</title><meta name="description" content="${escapeHtml(seo.description)}">
  <link rel="canonical" href="${seo.canonicalUrl}"><link rel="alternate" hreflang="ar" href="${SITE}/place/${encodeURIComponent(seo.slug)}/"><link rel="alternate" hreflang="en" href="${seo.canonicalUrl}"><link rel="alternate" hreflang="x-default" href="${SITE}/place/${encodeURIComponent(seo.slug)}/">
  <meta property="og:type" content="business.business"><meta property="og:site_name" content="Dalil El Manzala &amp; El Matariya"><meta property="og:url" content="${seo.canonicalUrl}"><meta property="og:title" content="${escapeHtml(seo.title)}"><meta property="og:description" content="${escapeHtml(seo.description)}"><meta property="og:image" content="${escapeHtml(seo.image)}"><meta property="og:locale" content="en_EG">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(seo.title)}"><meta name="twitter:description" content="${escapeHtml(seo.description)}"><meta name="twitter:image" content="${escapeHtml(seo.image)}">
  <link rel="manifest" href="/en/manifest.webmanifest"><link rel="stylesheet" href="/src/css/main.css?v=20260913.9"><link rel="stylesheet" href="/src/css/i18n-layout.css?v=20260913.9">
  <script type="application/ld+json">${JSON.stringify(seo.schemas[0])}</script><script type="application/ld+json">${JSON.stringify(seo.schemas[1])}</script>
  </head><body data-lang="en"><div id="app"><main id="page-container" class="page-main" role="main"><div class="en-container en-section" style="max-width:960px;margin:auto;padding:20px">
  <nav aria-label="Breadcrumb" style="margin-bottom:16px"><a href="/en/">Home</a> / <a href="/en/places/">Places</a> / <a href="${seo.categoryUrl}">${escapeHtml(seo.catName)}</a> / <span>${escapeHtml(seo.rawName)}</span></nav>
  <article><img src="${escapeHtml(seo.image)}" alt="${escapeHtml(seo.rawName)} in ${escapeHtml(seo.rawArea)}" width="960" height="540" loading="eager" fetchpriority="high" decoding="async" style="width:100%;height:auto;max-height:420px;object-fit:cover;border-radius:18px"><h1>${escapeHtml(seo.rawName)}</h1>
  <p><strong>Location:</strong> ${escapeHtml(seo.rawAddress || seo.rawArea)}</p>${phone ? `<p><a href="tel:${phone}">Call ${escapeHtml(seo.phone)}</a></p>` : ''}${waLink ? `<p><a href="${waLink}" rel="noopener noreferrer">WhatsApp</a></p>` : ''}
  <div class="place-description"><h2>About ${escapeHtml(seo.rawName)}</h2><p style="line-height:1.8">${escapeHtml(place.descriptionEn || place.description_en || seo.description)}</p></div>
  <section class="place-qa" aria-labelledby="qa-title" style="margin-top:24px;padding:20px;border:1px solid #e2e8f0;border-radius:16px"><h2 id="qa-title">Questions &amp; answers</h2>${qa}</section>
  ${articleCardsForPlace(placeArticles)}
  </article></div></main></div><script type="module" src="/src/js/core/english-pages.js?v=20260913.9"></script></body></html>`;
  const dir = path.join(EN, rel); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}
async function fetchAllArticlesForSEO(){
  const out=[];const limit=1000;let offset=0;
  try{
    for(;;offset+=limit){
      const r=await fetch(`${SITE}/api/articles?limit=${limit}&offset=${offset}`,{headers:{accept:'application/json'}});
      if(!r.ok) throw new Error(`Articles API HTTP ${r.status} at offset ${offset}`);
      const j=await r.json();const batch=Array.isArray(j?.data)?j.data:[];out.push(...batch);if(batch.length<limit)break;
    }
  }catch(err){ console.warn('English SEO article fetch skipped:',err?.message||err); }
  return [...new Map(out.map(a=>[String(a.slug||a.id||'').trim(),a]).filter(([k])=>k)).values()].filter(a=>String(a.status||'published').toLowerCase()==='published');
}
async function fetchAllPlaces(){const out=[],limit=1000;for(let offset=0;offset<100000;offset+=limit){const r=await fetch(`${SITE}/api/places?limit=${limit}&offset=${offset}`,{headers:{accept:'application/json'}});if(!r.ok)throw new Error(`Places API HTTP ${r.status} at offset ${offset}`);const j=await r.json(),batch=Array.isArray(j?.data)?j.data:[];out.push(...batch);if(batch.length<limit)break}return [...new Map(out.map(p=>[String(p.slug||p.id||'').trim(),p])).values()].filter(p=>{const s=String(p.status||p.state||'').toLowerCase();return String(p.slug||p.id||'').trim()&&!['draft','deleted','rejected','archived','hidden'].includes(s)&&p.isPublished!==false&&p.is_published!==false})}
const items=await fetchAllPlaces();
const articles=await fetchAllArticlesForSEO();
const desiredEnglishPlaceSlugs=new Set(items.map(p=>String(p.slug||p.id||'').trim()).filter(Boolean));
const englishPlaceRoot=path.join(EN,'place');
if(fs.existsSync(englishPlaceRoot)){
  for(const entry of fs.readdirSync(englishPlaceRoot,{withFileTypes:true})){
    if(entry.isDirectory() && entry.name!=='index' && !desiredEnglishPlaceSlugs.has(entry.name)){
      fs.rmSync(path.join(englishPlaceRoot,entry.name),{recursive:true,force:true});
    }
  }
}
for(const p of items){const s=String(p.slug||p.id).trim();if(s){const placeArticles=articles.filter(a=>String(a.placeId||a.place_id||a.place?.id||'').trim()===String(p.id||p._key||'').trim());writeEnglishPlace(`place/${s}`,p,placeArticles)}}
for(const s of fs.existsSync(path.join(ROOT,'category')) ? fs.readdirSync(path.join(ROOT,'category')) : []) { if(s!=='index' && fs.existsSync(path.join(ROOT,'category',s,'index.html'))) writeEnglishCategory(s,s,items); }
const enPlacesFile = path.join(EN, 'places', 'index.html');
if (fs.existsSync(enPlacesFile)) {
  let enPlacesContent = fs.readFileSync(enPlacesFile, 'utf8');
  const enCardsHtml = items.map(p => {
    const pSlug = (p.slug || p.id || '').trim();
    const pName = esc(p.nameEn || p.name_en || p.name || 'Local Business');
    const pArea = esc(p.areaEn || p.area_en || (p.area === 'المطرية' ? 'El Matariya' : 'El Manzala'));
    const pCat = esc(p.customCategoryEn || p.customCategory || p.category || 'Services');
    return `<article class="seo-place-preview-card" style="padding:1rem;background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:14px">
      <h2 style="font-size:1rem;margin:0 0 0.35rem"><a href="/en/place/${encodeURIComponent(pSlug)}/" style="color:var(--text-primary,#0f172a);text-decoration:none">${pName}</a></h2>
      <p style="font-size:0.82rem;color:var(--text-secondary,#64748b);margin:0 0 0.5rem">📍 ${pArea} • 📂 ${pCat}</p>
      <a href="/en/place/${encodeURIComponent(pSlug)}/" style="font-size:0.82rem;font-weight:700;color:var(--primary,#0284c7);text-decoration:none">View profile and contact details →</a>
    </article>`;
  }).join('\n');
  enPlacesContent = enPlacesContent.replace(/<main id="page-container"[^>]*>[\s\S]*?<\/main>/i, `<main id="page-container" class="page-main" role="main">
    <div class="en-container en-section">
      <h1 style="font-size:1.4rem;font-weight:800;margin-bottom:1rem">Places & Local Businesses in El Manzala & El Matariya</h1>
      <div id="seo-places-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${enCardsHtml}
      </div>
    </div>
  </main>`);
  fs.writeFileSync(enPlacesFile, enPlacesContent, 'utf8');
}
console.log(`English SEO-aware static pages generated for ${items.length} published places.`);
