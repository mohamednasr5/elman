import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
const ROOT=process.cwd(),SITE='https://dalilmanzala.com',API=`${SITE}/api/places`,TODAY=new Date().toISOString().slice(0,10);
const STATIC=[['/','/en/','daily','index.html'],['/places.html','/en/places/','daily','places.html'],['/categories.html','/en/categories/','weekly','categories.html'],['/manzala.html','/en/manzala/','weekly','manzala.html'],['/matariya.html','/en/matariya/','weekly','matariya.html'],['/emergency.html','/en/emergency/','monthly','emergency.html'],['/about.html','/en/about.html','monthly','about.html'],['/contact.html','/en/contact/','monthly','contact.html'],['/privacy.html','/en/privacy/','yearly','privacy.html'],['/terms.html','/en/terms/','yearly','terms.html'],['/legal.html','/en/legal/','yearly','legal.html'],['/hadith.html','/en/hadith/','weekly','hadith.html'],['/quran.html','/en/quran/','weekly','quran.html'],['/quran-search.html','/en/quran-search/','weekly','quran-search.html'],['/quran-surah.html','/en/quran-surah/','weekly','quran-surah.html'],['/prayer-times.html','/prayer-times.html','daily','prayer-times.html'],['/qibla.html','/qibla.html','weekly','qibla.html'],['/free-verification.html','/free-verification.html','monthly','free-verification.html']];
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const abs=p=>{const s=String(p??'').trim();if(!s)return '';if(/^https?:\/\//i.test(s))return s;return `${SITE}/${s.replace(/^\/+/, '')}`};
const slug=p=>String(p.slug||p.id||'').trim();
const pathSlug=v=>encodeURIComponent(String(v||'').trim());
const arPlaceUrl=p=>`/place/${pathSlug(slug(p))}/`;
const enPlaceUrl=p=>`/en/place/${pathSlug(slug(p))}/`;
const lastmod=p=>{const v=p.updatedAt||p.updated_at||p.modifiedAt||p.modified_at||p.updated||p.lastModified||p.last_modified;if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10)};
const gitDate=f=>{try{const d=execFileSync('git',['log','-1','--format=%cs','--',f],{encoding:'utf8'}).trim();return /^\d{4}-\d{2}-\d{2}$/.test(d)?d:TODAY}catch{return TODAY}};
const image=p=>{const v=p.coverImageUrl||p.cover_image_url||p.coverUrl||p.cover_url||p.logoUrl||p.logo_url||p.imageUrl||p.image_url||'';return v?abs(v):''};
const indexable=p=>{if(!p||!slug(p))return false;const s=String(p.status||p.state||'').toLowerCase();if(['draft','deleted','rejected','archived','hidden'].includes(s))return false;if(p.isPublished===false||p.is_published===false)return false;return true};
async function fetchAllPlaces(){const out=[],limit=1000;for(let offset=0;offset<100000;offset+=limit){const r=await fetch(`${API}?limit=${limit}&offset=${offset}`,{headers:{accept:'application/json'}});if(!r.ok)throw new Error(`Places API HTTP ${r.status} at offset ${offset}`);const j=await r.json(),batch=Array.isArray(j?.data)?j.data:[];out.push(...batch);if(batch.length<limit)break}return [...new Map(out.map(p=>[slug(p),p])).values()].filter(indexable)}
function entry(loc,lm,freq,prio,alt){let a=['  <url>',`    <loc>${esc(abs(loc))}</loc>`];if(lm)a.push(`    <lastmod>${lm}</lastmod>`);a.push(`    <changefreq>${freq}</changefreq>`,`    <priority>${prio}</priority>`);if(alt)a.push(`    <xhtml:link rel="alternate" hreflang="ar" href="${esc(abs(alt.ar))}"/>`,`    <xhtml:link rel="alternate" hreflang="en" href="${esc(abs(alt.en))}"/>`,`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(abs(alt.ar))}"/>`);if(alt?.image)a.push('    <image:image>',`      <image:loc>${esc(alt.image)}</image:loc>`,'    </image:image>');a.push('  </url>');return a.join('\n')}
const doc=es=>['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',es.join('\n'),'</urlset>',''].join('\n');
async function main(){const places=await fetchAllPlaces();if(!places.length)throw new Error('No indexable places; refusing to replace SEO assets.');const ar=[],en=[],cats=new Set();for(const [a,b,f,file] of STATIC){const lm=gitDate(file);ar.push(entry(a,lm,f,a==='/'?'1.0':'0.7',{ar:a,en:b}));en.push(entry(b,lm,f,b==='/en/'?'1.0':'0.7',{ar:a,en:b}))}for(const p of places){const c=p.customCategory||p.category||p.categoryId||p.category_id;if(c)cats.add(String(c).trim().toLowerCase().replace(/\s+/g,'-'))}const ca=[],ce=[];for(const c of [...cats].sort()){const a=`/category/${encodeURIComponent(c)}/`,b=`/en/category/${encodeURIComponent(c)}/`;ca.push(entry(a,null,'weekly','0.8',{ar:a,en:b}));ce.push(entry(b,null,'weekly','0.8',{ar:a,en:b}))}const pa=[],pe=[],urls=[];for(const p of places){const a=arPlaceUrl(p),b=enPlaceUrl(p),alt={ar:a,en:b,image:image(p)},lm=lastmod(p);pa.push(entry(a,lm,'weekly','1.0',alt));pe.push(entry(b,lm,'weekly','1.0',alt));urls.push(abs(a),abs(b))}fs.writeFileSync(path.join(ROOT,'sitemap-static-ar.xml'),doc(ar));fs.writeFileSync(path.join(ROOT,'sitemap-static-en.xml'),doc(en));fs.writeFileSync(path.join(ROOT,'sitemap-categories-ar.xml'),doc(ca));fs.writeFileSync(path.join(ROOT,'sitemap-categories-en.xml'),doc(ce));fs.writeFileSync(path.join(ROOT,'sitemap-places-ar.xml'),doc(pa));fs.writeFileSync(path.join(ROOT,'sitemap-places-en.xml'),doc(pe));const sitemapMeta=[
  ['sitemap-places-ar.xml',pa],['sitemap-places-en.xml',pe],
  ['sitemap-categories-ar.xml',ca],['sitemap-categories-en.xml',ce],
  ['sitemap-static-ar.xml',ar],['sitemap-static-en.xml',en]
];
const extractLastmod=entries=>{
  const dates=[];
  for(const xmlEntry of entries){
    const m=xmlEntry.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/);
    if(m) dates.push(m[1]);
  }
  return dates.sort().pop()||null;
};
fs.writeFileSync(path.join(ROOT,'sitemap.xml'),[
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapMeta.map(([f,entries])=>{
    const lm=extractLastmod(entries);
    return `  <sitemap><loc>${SITE}/${f}</loc>${lm?`<lastmod>${lm}</lastmod>`:''}</sitemap>`;
  }),
  '</sitemapindex>',''
].join('\n'));
try {
  const rssRes = await fetch(`${SITE}/api/rss/places`);
  if (rssRes.ok) {
    const rssXml = await rssRes.text();
    if (rssXml && rssXml.includes('<rss')) {
      fs.writeFileSync(path.join(ROOT, 'rss.xml'), rssXml, 'utf8');
      console.log('Updated rss.xml statically.');
    }
  }
} catch (_) {}
fs.writeFileSync(path.join(ROOT,'.indexnow-urls.json'),JSON.stringify({urls:[...new Set(urls)]},null,2)+'\n');console.log(`SEO assets: ${places.length} places, ${cats.size} categories, ${STATIC.length} static pairs.`)}
main().catch(e=>{console.error(e);process.exit(1)});
