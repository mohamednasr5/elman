import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKER_URL = 'https://dalilmanzala.com/api/places?limit=1000';

async function fetchPlaces(){try{const res=await fetch(WORKER_URL);if(!res.ok)return [];const json=await res.json();return json?.data||[]}catch{return []}}
function escapeXml(str){return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function addUrl(lines,loc,lastmod,changefreq,priority,alternate){lines.push('  <url>',`    <loc>${escapeXml(loc)}</loc>`,`    <lastmod>${lastmod}</lastmod>`,`    <changefreq>${changefreq}</changefreq>`,`    <priority>${priority}</priority>`);if(alternate){lines.push(`    <xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(alternate.ar)}"/>`,`    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(alternate.en)}"/>`,`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(alternate.ar)}"/>`)}lines.push('  </url>')}

async function run(){
  const places=await fetchPlaces();
  const today=new Date().toISOString().split('T')[0];
  const staticPages=[
    ['https://dalilmanzala.com/','https://dalilmanzala.com/en/','daily','1.0'],
    ['https://dalilmanzala.com/places.html','https://dalilmanzala.com/en/places/','daily','0.9'],
    ['https://dalilmanzala.com/categories.html','https://dalilmanzala.com/en/categories/','weekly','0.9'],
    ['https://dalilmanzala.com/manzala.html','https://dalilmanzala.com/en/manzala/','weekly','0.9'],
    ['https://dalilmanzala.com/matariya.html','https://dalilmanzala.com/en/matariya/','weekly','0.9'],
    ['https://dalilmanzala.com/offers.html','https://dalilmanzala.com/en/offers/','daily','0.8'],
    ['https://dalilmanzala.com/now.html','https://dalilmanzala.com/en/now/','hourly','0.8'],
    ['https://dalilmanzala.com/emergency.html','https://dalilmanzala.com/en/emergency/','monthly','0.8'],
    ['https://dalilmanzala.com/around-me.html','https://dalilmanzala.com/en/around-me/','weekly','0.7'],
    ['https://dalilmanzala.com/products.html','https://dalilmanzala.com/en/products/','daily','0.7'],
    ['https://dalilmanzala.com/contact.html','https://dalilmanzala.com/en/contact/','monthly','0.5'],
    ['https://dalilmanzala.com/privacy.html','https://dalilmanzala.com/en/privacy/','yearly','0.3'],
    ['https://dalilmanzala.com/terms.html','https://dalilmanzala.com/en/terms/','yearly','0.3'],
    ['https://dalilmanzala.com/legal.html','https://dalilmanzala.com/en/legal/','yearly','0.3']
  ];
  const categorySet=new Set();for(const place of places){const raw=place.customCategory||place.category||place.categoryId||place.category_id||'';if(raw)categorySet.add(String(raw).toLowerCase().replace(/\s+/g,'-'))}
  const lines=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"','        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"','        xmlns:xhtml="http://www.w3.org/1999/xhtml">',''];
  for(const [ar,en,changefreq,priority] of staticPages){addUrl(lines,ar,today,changefreq,priority,{ar,en});addUrl(lines,en,today,changefreq,priority,{ar,en})}
  for(const slug of categorySet){const ar=`https://dalilmanzala.com/category/${encodeURIComponent(slug)}`,en=`https://dalilmanzala.com/en/category/${encodeURIComponent(slug)}`;addUrl(lines,ar,today,'daily','0.85',{ar,en});addUrl(lines,en,today,'daily','0.85',{ar,en})}
  for(const place of places){const slug=place.slug||place.id;if(!slug)continue;const ar=`https://dalilmanzala.com/place/${encodeURIComponent(slug)}`,en=`https://dalilmanzala.com/en/place/${encodeURIComponent(slug)}`;const lastMod=place.updatedAt?new Date(place.updatedAt).toISOString().split('T')[0]:today;addUrl(lines,ar,lastMod,'weekly','0.9',{ar,en});addUrl(lines,en,lastMod,'weekly','0.9',{ar,en})}
  lines.push('</urlset>','');
  fs.writeFileSync(path.join(__dirname,'sitemap.xml'),lines.join('\n'),'utf8');
  console.log(`Generated bilingual sitemap: ${staticPages.length*2+categorySet.size*2+places.length*2} URLs.`)
}
run().catch(err=>{console.error(err);process.exitCode=1});
