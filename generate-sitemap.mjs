import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = 'https://elmanzla-default-rtdb.firebaseio.com/places.json';

function fetchPlaces() {
  return new Promise((resolve, reject) => {
    https.get(DB_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json || {});
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
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
  console.log('Fetching places from RTDB...');
  const placesObj = await fetchPlaces();
  const places = Object.values(placesObj).filter(p => p && (p.status === 'published' || (!p.status && p.name)));
  console.log(`Found ${places.length} published places.`);

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: 'https://dalilmanzala.com/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/places.html', priority: '0.9', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/categories.html', priority: '0.8', changefreq: 'weekly' },
    { loc: 'https://dalilmanzala.com/search.html', priority: '0.8', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/offers.html', priority: '0.8', changefreq: 'daily' },
    { loc: 'https://dalilmanzala.com/emergency.html', priority: '0.9', changefreq: 'monthly' },
    { loc: 'https://dalilmanzala.com/about.html', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://dalilmanzala.com/contact.html', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://dalilmanzala.com/privacy.html', priority: '0.3', changefreq: 'yearly' },
    { loc: 'https://dalilmanzala.com/terms.html', priority: '0.3', changefreq: 'yearly' }
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n';

  for (const p of staticPages) {
    xml += '  <url>\n';
    xml += `    <loc>${p.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  for (const place of places) {
    let slug = place.slug || place.id;
    if (!slug) continue;
    // Strip random hash suffix if it exists to generate the cleanest canonical short slug
    const cleanShortSlug = String(slug).replace(/-[a-z0-9_]{5,7}$/i, '');
    const finalSlug = cleanShortSlug && cleanShortSlug.length >= 3 ? cleanShortSlug : slug;
    const placeUrl = `https://dalilmanzala.com/${encodeURIComponent(finalSlug)}`;
    const lastMod = place.updatedAt ? new Date(place.updatedAt).toISOString().split('T')[0] : today;

    xml += '  <url>\n';
    xml += `    <loc>${placeUrl}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';

    const img = place.coverImageUrl || place.logoUrl;
    if (img) {
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
  console.log(`Successfully generated ${sitemapPath} with ${staticPages.length + places.length} total URLs.`);
}

run().catch(console.error);
