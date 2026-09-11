import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER_URL = 'https://dalilmanzala.com/api/places?limit=1000';

async function fetchPlaces() {
  const res = await fetch(WORKER_URL);
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data || [];
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function run() {
  console.log('Fetching places from Turso via Worker for Sitemap...');
  const places = await fetchPlaces();
  console.log(`Found ${places.length} published places.`);

  const today = new Date().toISOString().split('T')[0];

  // Core indexable static pages (strictly excludes /admin, /dashboard, /login, /search, /favorites)
  const staticPages = [
    { loc: 'https://dalilmanzala.com/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/places.html', priority: '0.9', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/categories.html', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://dalilmanzala.com/manzala.html', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://dalilmanzala.com/matariya.html', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://dalilmanzala.com/offers.html', priority: '0.8', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/now.html', priority: '0.8', changefreq: 'hourly' },
    { loc: 'https://dalilmanzala.com/emergency.html', priority: '0.8', changefreq: 'monthly' },
    { loc: 'https://dalilmanzala.com/around-me.html', priority: '0.7', changefreq: 'weekly' },
    { loc: 'https://dalilmanzala.com/products.html', priority: '0.7', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/about.html', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://dalilmanzala.com/contact.html', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://dalilmanzala.com/privacy.html', priority: '0.3', changefreq: 'yearly' },
    { loc: 'https://dalilmanzala.com/terms.html', priority: '0.3', changefreq: 'yearly' }
  ];

  // Collect unique category slugs from places
  const categorySet = new Set();
  for (const place of places) {
    const rawCat = place.customCategory || place.category || place.categoryId || place.category_id || '';
    if (rawCat) {
      const slug = String(rawCat).toLowerCase().replace(/\s+/g, '-');
      categorySet.add(slug);
    }
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n';

  // 1. Static Pages
  for (const p of staticPages) {
    xml += '  <url>\n';
    xml += `    <loc>${p.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // 2. Category Landing Pages
  for (const catSlug of categorySet) {
    const catUrl = `https://dalilmanzala.com/category/${encodeURIComponent(catSlug)}`;
    xml += '  <url>\n';
    xml += `    <loc>${catUrl}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.85</priority>\n';
    xml += '  </url>\n';
  }

  // 3. Business Profile Pages (Clean canonical /place/:slug URLs)
  for (const place of places) {
    let slug = place.slug || place.id;
    if (!slug) continue;
    const placeUrl = `https://dalilmanzala.com/place/${encodeURIComponent(slug)}`;
    const lastMod = place.updatedAt ? new Date(place.updatedAt).toISOString().split('T')[0] : today;

    xml += '  <url>\n';
    xml += `    <loc>${placeUrl}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';

    let img = place.coverImageUrl || place.cover_image_url || place.logoUrl || place.logo_url;
    if (img) {
      if (!img.startsWith('http://') && !img.startsWith('https://')) {
        img = `https://dalilmanzala.com/${img.replace(/^\/+/, '')}`;
      }
      const escImg = escapeXml(img);
      const title = escapeXml(place.name || '');
      xml += '    <image:image>\n';
      xml += `      <image:loc>${escImg}</image:loc>\n`;
      xml += `      <image:title>${title}</image:title>\n`;
      xml += `      <image:caption>${title} في المنزلة والمطرية - دليل المنزلة والمطرية الرقمي</image:caption>\n`;
      xml += '    </image:image>\n';
    }

    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  const totalUrls = staticPages.length + categorySet.size + places.length;
  console.log(`Successfully generated ${sitemapPath} with ${totalUrls} canonical URLs (${places.length} places, ${categorySet.size} categories, ${staticPages.length} core pages).`);
}

run().catch(console.error);
