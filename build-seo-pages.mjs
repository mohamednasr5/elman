/**
 * build-seo-pages.mjs
 * Static Pre-rendering & SEO Engine for dalilmanzala.com
 * Fetches all active places & categories from Turso DB,
 * generating standalone, indexable HTML files with complete Semantic markup,
 * unique Meta tags, canonical links, and Schema.org JSON-LD.
 *
 * Run: node build-seo-pages.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SITE_DOMAIN,
  DEFAULT_OG_IMAGE,
  escapeHtml,
  generateBusinessSEO,
  generateCategorySEO,
  getArabicCategoryName
} from './src/js/utils/seo-entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_PLACES_URL = 'https://dalilmanzala.com/api/places?limit=1000';

async function fetchAllPlaces() {
  console.log('Fetching all published places from Turso...');
  try {
    const res = await fetch(API_PLACES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json?.data || [];
  } catch (err) {
    console.warn('API fetch error, attempting fallback to local seed if available:', err.message);
    return [];
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Builds HTML template for a single business entity
 */
function buildBusinessPageHTML(place, relatedPlaces = []) {
  const seo = generateBusinessSEO(place);
  if (!seo) return null;

  const phoneClean = seo.phone ? seo.phone.replace(/\s+/g, '') : '';
  const waClean = seo.whatsapp ? seo.whatsapp.replace(/\D/g, '').replace(/^0+/, '') : '';
  const waLink = waClean ? `https://wa.me/20${waClean}` : '';
  const isManzala = (place.area || '').includes('المطرية') ? false : true;
  const locationPage = isManzala ? 'manzala.html' : 'matariya.html';
  const locationName = isManzala ? 'مدينة المنزلة' : 'مدينة المطرية';

  // Format working hours table if available
  let workingHoursHtml = '';
  let hoursObj = place.workingHours || place.working_hours;
  if (typeof hoursObj === 'string') {
    try { hoursObj = JSON.parse(hoursObj); } catch (_) {}
  }
  if (hoursObj && typeof hoursObj === 'object') {
    const daysAr = {
      saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين',
      tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة'
    };
    const rows = [];
    for (const [dayKey, dayName] of Object.entries(daysAr)) {
      const d = hoursObj[dayKey];
      if (d) {
        const timeStr = d.closed ? 'مغلق' : `${d.open || ''} - ${d.close || ''}`;
        rows.push(`<tr><td style="padding:6px 12px;font-weight:700">${dayName}</td><td style="padding:6px 12px;direction:ltr;text-align:right">${timeStr}</td></tr>`);
      }
    }
    if (rows.length > 0) {
      workingHoursHtml = `
        <div class="card" style="margin-top:20px;padding:20px;border-radius:16px;background:var(--surface,#fff);box-shadow:0 2px 12px rgba(0,0,0,0.06)">
          <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px">
            <span>🕒</span> <span>مواعيد وساعات العمل</span>
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:0.92rem">
            <tbody>${rows.join('')}</tbody>
          </table>
        </div>
      `;
    }
  }

  // Related businesses in the same category & region
  let relatedHtml = '';
  if (relatedPlaces.length > 0) {
    const items = relatedPlaces.slice(0, 4).map(r => `
      <div style="padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,0.08);background:var(--surface,#fff)">
        <h3 style="margin:0 0 6px;font-size:0.95rem;font-weight:800">
          <a href="/place/${encodeURIComponent(r.slug || r.id)}" style="color:var(--primary,#0284c7);text-decoration:none">
            ${escapeHtml(r.name)}
          </a>
        </h3>
        <p style="margin:0;font-size:0.82rem;color:var(--text-muted,#64748b)">
          📍 ${escapeHtml(r.area || 'المنزلة')} ${r.phone ? '• 📞 ' + escapeHtml(r.phone) : ''}
        </p>
      </div>
    `).join('');

    relatedHtml = `
      <div class="card" style="margin-top:24px;padding:20px;border-radius:16px;background:var(--surface,#fff);box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <span>🤝</span> <span>أنشطة مشابهة في ${escapeHtml(seo.catName)}</span>
        </h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
          ${items}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <!-- Instant Zero-CLS Theme Setup: Runs before paint -->
  <script>
    (function() {
      try {
        var t = localStorage.getItem('elmanzala-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', t);
      } catch(_) {}
    })();
  </script>

  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}"/>
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <link rel="canonical" href="${seo.canonicalUrl}"/>

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="business.business"/>
  <meta property="og:url" content="${seo.canonicalUrl}"/>
  <meta property="og:site_name" content="دليل المنزلة والمطرية الرقمي"/>
  <meta property="og:title" content="${escapeHtml(seo.title)}"/>
  <meta property="og:description" content="${escapeHtml(seo.description)}"/>
  <meta property="og:image" content="${escapeHtml(seo.image)}"/>
  <meta property="og:image:secure_url" content="${escapeHtml(seo.image)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:locale" content="ar_EG"/>

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:url" content="${seo.canonicalUrl}"/>
  <meta name="twitter:title" content="${escapeHtml(seo.title)}"/>
  <meta name="twitter:description" content="${escapeHtml(seo.description)}"/>
  <meta name="twitter:image" content="${escapeHtml(seo.image)}"/>

  <!-- Mobile & PWA -->
  <meta name="theme-color" content="#1B4F72"/>
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <link rel="manifest" href="/manifest.webmanifest"/>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png"/>

  <!-- Fonts & Core Styles -->
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"/>
  <link rel="stylesheet" href="/src/css/main.css?v=2.8.1"/>

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
${JSON.stringify(seo.schemas[0], null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(seo.schemas[1], null, 2)}
  </script>
</head>
<body>
<div id="app">

  <!-- Header injected by page-shell -->
  <div id="header-slot"></div>

  <!-- Semantic Body Content (Discoverable immediately without JS execution) -->
  <main class="page-main" id="page-container" role="main">
    <div class="container" style="max-width:960px;margin:0 auto;padding:16px 12px">
      
      <!-- Crawlable Breadcrumb Navigation -->
      <nav class="page-breadcrumbs" aria-label="مسار التنقل" style="display:flex;align-items:center;gap:6px;font-size:0.85rem;margin-bottom:16px;flex-wrap:wrap">
        <a href="/" style="color:var(--text-muted,#64748b);text-decoration:none">الرئيسية</a>
        <span style="color:var(--text-muted,#64748b)">/</span>
        <a href="/places.html" style="color:var(--text-muted,#64748b);text-decoration:none">دليل الأماكن</a>
        <span style="color:var(--text-muted,#64748b)">/</span>
        <a href="${seo.categoryUrl}" style="color:var(--text-muted,#64748b);text-decoration:none">${escapeHtml(seo.catName)}</a>
        <span style="color:var(--text-muted,#64748b)">/</span>
        <span style="color:var(--text-primary,#0f172a);font-weight:700">${escapeHtml(seo.rawName)}</span>
      </nav>

      <!-- Business Hero Card -->
      <article class="place-profile-card" style="background:var(--surface,#fff);border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid rgba(0,0,0,0.06)">
        
        <!-- Cover Photo -->
        <div style="position:relative;width:100%;height:260px;background:linear-gradient(135deg,#1E3E62 0%,#0077FF 100%);overflow:hidden">
          <img src="${escapeHtml(seo.image)}" alt="${escapeHtml(seo.rawName)} - ${escapeHtml(seo.catName)} في ${escapeHtml(seo.rawArea)}" style="width:100%;height:100%;object-fit:cover" loading="eager" width="960" height="260"/>
        </div>

        <div style="padding:24px 20px">
          
          <!-- Category & Area Badges -->
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <a href="${seo.categoryUrl}" style="background:rgba(2,132,199,0.12);color:#0284c7;padding:4px 12px;border-radius:9999px;font-size:0.82rem;font-weight:800;text-decoration:none">
              🏷️ ${escapeHtml(seo.catName)}
            </a>
            <a href="/${locationPage}" style="background:rgba(16,185,129,0.12);color:#059669;padding:4px 12px;border-radius:9999px;font-size:0.82rem;font-weight:800;text-decoration:none">
              📍 ${escapeHtml(seo.rawArea)} (${escapeHtml(locationName)})
            </a>
            ${place.is_verified || place.isVerified ? '<span style="background:rgba(34,197,94,0.15);color:#16a34a;padding:4px 10px;border-radius:9999px;font-size:0.78rem;font-weight:800">✓ نشاط موثق</span>' : ''}
          </div>

          <!-- Main Primary H1 -->
          <h1 style="font-size:clamp(1.4rem, 3.5vw, 2.1rem);font-weight:900;color:var(--text-primary,#0f172a);margin:0 0 10px;line-height:1.3">
            ${escapeHtml(seo.rawName)}
          </h1>

          <!-- Address -->
          <p style="font-size:0.95rem;color:var(--text-secondary,#475569);margin:0 0 18px;display:flex;align-items:flex-start;gap:6px;line-height:1.5">
            <span>📍</span>
            <span>${escapeHtml(seo.rawAddress || seo.rawArea + ' — محافظة الدقهلية')}</span>
          </p>

          <!-- Immediate Call & WhatsApp Actions -->
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px">
            ${phoneClean ? `
              <a href="tel:${phoneClean}" class="btn btn-primary" style="padding:10px 22px;border-radius:12px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;gap:8px;background:#0284c7;color:#fff">
                <span>📞</span>
                <span>اتصال: ${escapeHtml(seo.phone)}</span>
              </a>
            ` : ''}
            ${waLink ? `
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn" style="padding:10px 22px;border-radius:12px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff">
                <span>💬</span>
                <span>مراسلة عبر واتساب</span>
              </a>
            ` : ''}
          </div>

          <!-- Full Text Description -->
          <div class="place-description-block" style="border-top:1px solid rgba(0,0,0,0.08);padding-top:20px">
            <h2 style="font-size:1.15rem;font-weight:800;color:var(--text-primary,#0f172a);margin:0 0 10px">
              عن ${escapeHtml(seo.rawName)}
            </h2>
            <div style="font-size:0.95rem;color:var(--text-secondary,#334155);line-height:1.8;white-space:pre-line">
              ${escapeHtml(place.description || seo.description)}
            </div>
          </div>

        </div>
      </article>

      <!-- Working Hours -->
      ${workingHoursHtml}

      <!-- Internal Link Relationships to Category & Region -->
      <div class="card" style="margin-top:20px;padding:18px 20px;border-radius:16px;background:var(--surface,#fff);box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <h2 style="font-size:1.05rem;font-weight:800;margin:0 0 10px;color:var(--text-primary,#0f172a)">
          روابط وأقسام ذات صلة
        </h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a href="${seo.categoryUrl}" style="color:#0284c7;text-decoration:underline;font-weight:700;font-size:0.9rem">
            تصفح جميع ${escapeHtml(seo.catName)} بالمنزلة والمطرية
          </a>
          <span>•</span>
          <a href="/${locationPage}" style="color:#0284c7;text-decoration:underline;font-weight:700;font-size:0.9rem">
            دليل خدمات ${escapeHtml(locationName)}
          </a>
          <span>•</span>
          <a href="/places.html" style="color:#0284c7;text-decoration:underline;font-weight:700;font-size:0.9rem">
            جميع الأنشطة والمحلات
          </a>
        </div>
      </div>

      <!-- Related Places in Same Category -->
      ${relatedHtml}

    </div>
  </main>

  <!-- Bottom Nav injected by JS -->
  <div id="nav-slot"></div>
  <!-- Footer injected by JS -->
  <div id="footer-slot"></div>

</div>

<!-- Progressive Enhancement / Hydration Module -->
<script type="module">
  import { initPage } from '/src/js/core/page-shell.js?v=2.8.1';
  import { renderPlacePage } from '/src/js/ui/pages/place.js?v=2.8.1';
  import { waitForAuth } from '/src/js/core/auth.js?v=2.8.1';

  // Concurrently initialize shell without clearing static content
  initPage('').catch(err => console.warn('[PageShell Error]:', err));
  
  // Hydrate full interactive features (maps, reviews, modals, gallery)
  waitForAuth().then(user => {
    const pc = document.getElementById('page-container');
    if (pc) {
      renderPlacePage(pc, { slug: '${seo.slug}', user });
    }
  }).catch(err => console.warn('[Place Hydration Error]:', err));
</script>

</body>
</html>`;
}

/**
 * Builds HTML template for a category landing page
 */
function buildCategoryPageHTML(catName, places) {
  const seo = generateCategorySEO(catName, places);
  const placesListHtml = places.slice(0, 30).map(p => {
    const slug = p.slug || p.id;
    const phone = p.phone ? String(p.phone).trim() : '';
    const area = p.area || 'المنزلة والمطرية';
    return `
      <article style="background:var(--surface,#fff);border:1px solid rgba(0,0,0,0.08);border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <span style="font-size:0.75rem;background:rgba(2,132,199,0.1);color:#0284c7;padding:3px 10px;border-radius:9999px;font-weight:700;display:inline-block;margin-bottom:8px">
            📍 ${escapeHtml(area)}
          </span>
          <h2 style="margin:0 0 6px;font-size:1.1rem;font-weight:800">
            <a href="/place/${encodeURIComponent(slug)}" style="color:var(--text-primary,#0f172a);text-decoration:none">
              ${escapeHtml(p.name)}
            </a>
          </h2>
          <p style="margin:0 0 12px;font-size:0.88rem;color:var(--text-secondary,#475569);line-height:1.5">
            ${escapeHtml(p.address || area)}
          </p>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(0,0,0,0.06);padding-top:12px;margin-top:8px">
          ${phone ? `<a href="tel:${phone.replace(/\s+/g,'')}" style="color:#0284c7;font-weight:700;font-size:0.88rem;text-decoration:none">📞 ${escapeHtml(phone)}</a>` : '<span></span>'}
          <a href="/place/${encodeURIComponent(slug)}" style="font-weight:800;font-size:0.85rem;color:#0284c7;text-decoration:none">
            عرض التفاصيل ←
          </a>
        </div>
      </article>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <script>
    (function() {
      try {
        var t = localStorage.getItem('elmanzala-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', t);
      } catch(_) {}
    })();
  </script>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}"/>
  <meta name="robots" content="index, follow, max-image-preview:large"/>
  <link rel="canonical" href="${seo.canonicalUrl}"/>

  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${seo.canonicalUrl}"/>
  <meta property="og:site_name" content="دليل المنزلة والمطرية الرقمي"/>
  <meta property="og:title" content="${escapeHtml(seo.title)}"/>
  <meta property="og:description" content="${escapeHtml(seo.description)}"/>
  <meta property="og:image" content="${DEFAULT_OG_IMAGE}"/>
  <meta property="og:locale" content="ar_EG"/>

  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(seo.title)}"/>
  <meta name="twitter:description" content="${escapeHtml(seo.description)}"/>
  <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}"/>

  <link rel="manifest" href="/manifest.webmanifest"/>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"/>
  <link rel="stylesheet" href="/src/css/main.css?v=2.8.1"/>

  <script type="application/ld+json">
${JSON.stringify(seo.schemas[0], null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(seo.schemas[1], null, 2)}
  </script>
</head>
<body>
<div id="app">
  <div id="header-slot"></div>
  <main class="page-main" id="page-container" role="main">
    <div class="container" style="max-width:1100px;margin:0 auto;padding:16px 12px">
      
      <nav class="page-breadcrumbs" aria-label="مسار التنقل" style="display:flex;align-items:center;gap:6px;font-size:0.85rem;margin-bottom:16px;flex-wrap:wrap">
        <a href="/" style="color:var(--text-muted,#64748b);text-decoration:none">الرئيسية</a>
        <span style="color:var(--text-muted,#64748b)">/</span>
        <a href="/categories.html" style="color:var(--text-muted,#64748b);text-decoration:none">التصنيفات</a>
        <span style="color:var(--text-muted,#64748b)">/</span>
        <span style="color:var(--text-primary,#0f172a);font-weight:700">${escapeHtml(seo.catName)}</span>
      </nav>

      <div style="margin-bottom:24px;background:linear-gradient(135deg,#0B192C 0%,#1E3E62 100%);color:#fff;border-radius:20px;padding:28px 24px">
        <h1 style="margin:0 0 10px;font-size:clamp(1.5rem, 3.2vw, 2.2rem);font-weight:900">
          ${escapeHtml(seo.catName)} في المنزلة والمطرية
        </h1>
        <p style="margin:0;font-size:0.95rem;color:#e2e8f0;line-height:1.6;max-width:700px">
          ${escapeHtml(seo.description)}
        </p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
        ${placesListHtml}
      </div>

    </div>
  </main>
  <div id="nav-slot"></div>
  <div id="footer-slot"></div>
</div>

<script type="module">
  import { initPage } from '/src/js/core/page-shell.js?v=2.8.1';
  import { renderCategoryPage } from '/src/js/ui/pages/categories.js?v=2.8.1';
  initPage('categories.html').catch(console.warn);
  renderCategoryPage(document.getElementById('page-container'), { slug: '${seo.categorySlug}' }).catch(console.warn);
</script>
</body>
</html>`;
}

async function run() {
  const places = await fetchAllPlaces();
  if (places.length === 0) {
    console.error('No places fetched. Aborting.');
    return;
  }

  console.log(`Processing ${places.length} places for static pre-rendering...`);

  // Group places by category
  const categoryMap = new Map();
  for (const place of places) {
    const rawCat = place.customCategory || place.category || place.categoryId || place.category_id || 'عام';
    if (!categoryMap.has(rawCat)) {
      categoryMap.set(rawCat, []);
    }
    categoryMap.get(rawCat).push(place);
  }

  // 1. Generate Business Pages under /place/:slug/index.html
  let generatedPlaces = 0;
  for (const place of places) {
    const slug = (place.slug || place.id || '').trim();
    if (!slug) continue;

    const rawCat = place.customCategory || place.category || place.categoryId || place.category_id || 'عام';
    const related = (categoryMap.get(rawCat) || []).filter(p => (p.slug || p.id) !== slug);

    const html = buildBusinessPageHTML(place, related);
    if (!html) continue;

    const placeDir = path.join(__dirname, 'place', slug);
    ensureDir(placeDir);
    fs.writeFileSync(path.join(placeDir, 'index.html'), html, 'utf8');
    generatedPlaces++;
  }
  console.log(`✓ Successfully pre-rendered ${generatedPlaces} business pages under /place/:slug/index.html`);

  // 2. Generate Category Pages under /category/:slug/index.html
  let generatedCats = 0;
  for (const [catName, catPlaces] of categoryMap.entries()) {
    const slug = encodeURIComponent(String(catName).toLowerCase().replace(/\s+/g, '-'));
    if (!slug) continue;

    const html = buildCategoryPageHTML(catName, catPlaces);
    const catDir = path.join(__dirname, 'category', slug);
    ensureDir(catDir);
    fs.writeFileSync(path.join(catDir, 'index.html'), html, 'utf8');
    generatedCats++;
  }
  console.log(`✓ Successfully pre-rendered ${generatedCats} category pages under /category/:slug/index.html`);

  // 3. Inject Internal Links into places.html for Googlebot Link Discovery
  const placesHtmlPath = path.join(__dirname, 'places.html');
  if (fs.existsSync(placesHtmlPath)) {
    let placesHtml = fs.readFileSync(placesHtmlPath, 'utf8');
    const placeCardsHtml = places.map(p => {
      const pSlug = (p.slug || p.id || '').trim();
      const pName = escapeHtml(p.name || 'مكان في الدليل');
      const pArea = escapeHtml(p.area || 'المنزلة والمطرية');
      const pCat = escapeHtml(p.customCategory || p.category || 'خدمات');
      return `
        <article class="seo-place-preview-card" style="padding:1rem;background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:14px">
          <h2 style="font-size:1rem;margin:0 0 0.35rem"><a href="/place/${encodeURIComponent(pSlug)}" style="color:var(--text-primary,#0f172a);text-decoration:none">${pName}</a></h2>
          <p style="font-size:0.82rem;color:var(--text-secondary,#64748b);margin:0 0 0.5rem">📍 ${pArea} • 📂 ${pCat}</p>
          <a href="/place/${encodeURIComponent(pSlug)}" style="font-size:0.82rem;font-weight:700;color:var(--primary,#0284c7);text-decoration:none">عرض تفاصيل المكان ووسائل الاتصال ←</a>
        </article>`;
    }).join('\n');

    const skeletonRegex = /<!-- Instant Skeleton Loader \(hydrated seamlessly by JS\) -->[\s\S]*?<\/div>\s*<\/div>/;
    if (skeletonRegex.test(placesHtml)) {
      const replacement = `<!-- Instant SEO Place Directory & Skeleton Loader (hydrated seamlessly by JS) -->
      <div id="seo-places-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${placeCardsHtml}
      </div>
    </div>`;
      placesHtml = placesHtml.replace(skeletonRegex, replacement);
      fs.writeFileSync(placesHtmlPath, placesHtml, 'utf8');
      console.log(`✓ Successfully injected ${places.length} crawlable place links into places.html`);
    }
  }

  // 4. Inject Internal Links into categories.html for Googlebot Link Discovery
  const catHtmlPath = path.join(__dirname, 'categories.html');
  if (fs.existsSync(catHtmlPath)) {
    let catHtml = fs.readFileSync(catHtmlPath, 'utf8');
    const catCardsHtml = Array.from(categoryMap.entries()).map(([cName, cPlaces]) => {
      const cSlug = encodeURIComponent(String(cName).toLowerCase().replace(/\s+/g, '-'));
      const escapedName = escapeHtml(cName);
      return `
        <a href="/category/${cSlug}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.25rem 0.75rem;background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:16px;text-decoration:none;color:var(--text-primary,#0f172a);text-align:center">
          <span style="font-weight:700;font-size:0.95rem;margin-bottom:0.25rem">${escapedName}</span>
          <span style="font-size:0.8rem;color:var(--text-muted,#64748b)">${cPlaces.length} مكان</span>
        </a>`;
    }).join('\n');

    const catSkeletonRegex = /<div style="display:grid;grid-template-columns:repeat\(auto-fill,minmax\(140px,1fr\)\);gap:1rem;">[\s\S]*?<\/div>\s*<\/div>/;
    if (catSkeletonRegex.test(catHtml)) {
      const catReplacement = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1rem;">
        ${catCardsHtml}
      </div>
    </div>`;
      catHtml = catHtml.replace(catSkeletonRegex, catReplacement);
      fs.writeFileSync(catHtmlPath, catHtml, 'utf8');
      console.log(`✓ Successfully injected ${categoryMap.size} crawlable category links into categories.html`);
    }
  }

  console.log('\n🌟 Static SEO pre-rendering complete!');
}

run();
