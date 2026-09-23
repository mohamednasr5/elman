import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SITE = 'https://dalilmanzala.com';
const must = (ok, msg) => { if (!ok) throw new Error(msg); };
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const required = [
  'robots.txt','sitemap.xml',
  'sitemap-places-ar.xml','sitemap-places-en.xml',
  'sitemap-categories-ar.xml','sitemap-categories-en.xml',
  'sitemap-static-ar.xml','sitemap-static-en.xml',
  'indexnow-key.txt','.indexnow-urls.json',
  'llms.txt','llms-en.txt',
  'scripts/submit-indexnow.mjs','scripts/generate-seo-assets.mjs'
];

for (const file of required) must(fs.existsSync(path.join(ROOT,file)), 'Missing SEO/AI asset: ' + file);

const robots = read('robots.txt');
for (const bot of [
  'User-agent: Googlebot','User-agent: Bingbot','User-agent: OAI-SearchBot',
  'User-agent: GPTBot','User-agent: PerplexityBot','User-agent: ClaudeBot','User-agent: Applebot'
]) must(robots.includes(bot), 'robots.txt missing crawler: ' + bot);
must(!/Disallow:\s*\/place\//i.test(robots), 'robots.txt blocks public profiles');
must(robots.includes('Sitemap: ' + SITE + '/sitemap.xml'), 'robots.txt missing sitemap index');

for (const file of [
  'sitemap-places-ar.xml','sitemap-places-en.xml',
  'sitemap-categories-ar.xml','sitemap-categories-en.xml',
  'sitemap-static-ar.xml','sitemap-static-en.xml'
]) {
  const xml = read(file);
  must(xml.includes('<?xml'), file + ': XML header missing');
  must(!xml.includes(SITE + 'assets/'), file + ': malformed absolute URL');
  must(!/\/place\.html\?slug=/i.test(xml), file + ': legacy place URL advertised');
  if (file.includes('places')) {
    must(xml.includes('hreflang="ar"') && xml.includes('hreflang="en"'),
      file + ': hreflang pair missing');
    must(/<loc>https:\/\/dalilmanzala\.com\/(?:en\/)?place\/[^<]+\/<\/loc>/i.test(xml),
      file + ': canonical place pattern missing');
  }
}

const sitemapIndex = read('sitemap.xml');
for (const file of [
  'sitemap-places-ar.xml','sitemap-places-en.xml',
  'sitemap-categories-ar.xml','sitemap-categories-en.xml',
  'sitemap-static-ar.xml','sitemap-static-en.xml'
]) must(sitemapIndex.includes(SITE + '/' + file), 'sitemap.xml missing: ' + file);

must(/^[A-Za-z0-9_-]{8,128}$/.test(read('indexnow-key.txt').trim()), 'IndexNow key format invalid');

const registry = JSON.parse(read('.indexnow-urls.json'));
const urls = Array.isArray(registry.urls) ? [...new Set(registry.urls)] : [];
must(urls.length > 0, 'IndexNow URL registry is empty');
for (const url of urls) {
  must(/^https:\/\/dalilmanzala\.com\/(?:en\/)?place\/[^\s]+\/$/.test(String(url)),
    'Non-canonical IndexNow URL: ' + url);
}

const indexNow = read('scripts/submit-indexnow.mjs');
must(indexNow.includes('https://api.indexnow.org/indexnow'), 'IndexNow endpoint missing');
must(indexNow.includes('https://www.bing.com/indexnow'), 'Bing IndexNow endpoint missing');
must(indexNow.includes('keyLocation'), 'IndexNow key location missing');

const generator = read('scripts/generate-seo-assets.mjs');
must(generator.includes('offset'), 'SEO generator must paginate places');
must(generator.includes('s.replace(/^\\/+/, \'\')') || generator.includes("s.replace(/^\\/+/, '')"),
  'SEO generator URL normalization missing');

const workflow = read('.github/workflows/generate-english-pages.yml');
must(workflow.includes('node scripts/submit-indexnow.mjs'), 'SEO workflow missing IndexNow');
must(workflow.includes('node scripts/generate-seo-assets.mjs'), 'SEO workflow missing sitemap generation');

const llms = read('llms.txt');
const llmsEn = read('llms-en.txt');
must(llms.includes('/place/{slug}/') && /AI Search|OAI-SearchBot/i.test(llms), 'Arabic AI context incomplete');
must(llmsEn.includes('/en/place/{slug}/') && /AI Search|OAI-SearchBot/i.test(llmsEn), 'English AI context incomplete');

function collectHtml(dir) {
  const base = path.join(ROOT, dir);
  const out = [];
  if (!fs.existsSync(base)) return out;
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
    }
  };
  walk(base);
  return out;
}

const profileFiles = [...collectHtml('place'), ...collectHtml('en/place')];
must(profileFiles.length > 0, 'No generated place profiles found');

for (const file of profileFiles) {
  const html = fs.readFileSync(file, 'utf8');
  must(/<h1\b[^>]*>\s*[^<]+<\/h1>/i.test(html), file + ': H1 missing');
  must(/<meta\s+name=["']robots["'][^>]*index,\s*follow/i.test(html), file + ': profile not indexable');
  must(/<link\s+rel=["']canonical["'][^>]*https:\/\/dalilmanzala\.com\//i.test(html), file + ': canonical missing');
  must(/application\/ld\+json/i.test(html) && /BreadcrumbList/i.test(html), file + ': structured data incomplete');
  must(/(?:LocalBusiness|Restaurant|Pharmacy|Dentist|Physician|Store|ClothingStore|ShoeStore|JewelryStore|GroceryStore|Bakery|Hotel|BeautySalon|AutoRepair|Plumber|Electrician|ProfessionalService|RealEstateAgent|HomeAndConstructionBusiness)/i.test(html),
    file + ': local business entity type missing');
  must(/(?:أسئلة وأجوبة|معلومات أساسية|Questions &amp; answers|Key information)/i.test(html),
    file + ': AI-readable fact/Q&A section missing');
  must(!/place\.html\?slug=/i.test(html), file + ': legacy place URL remains');
  must(!/"@type"\s*:\s*"FAQPage"/i.test(html), file + ': FAQPage schema on profile');
}

console.log('AI/SEO audit passed.');
