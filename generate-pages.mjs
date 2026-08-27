/**
 * generate-pages.mjs
 * Generates all standalone HTML pages for المنزلة وناسها
 * Run: node generate-pages.mjs
 */
import fs from 'fs';

// ── Shared template builder ──────────────────────────────────
function page({ file, title, desc, activeNav, canonical, bodyClass = '', moduleScript }) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
  <title>${title} | المنزلة وناسها</title>
  <meta name="description" content="${desc}"/>
  <meta name="robots" content="index,follow"/>
  <link rel="canonical" href="https://elmanzala.com/${file}"/>
  <meta property="og:title" content="${title} | المنزلة وناسها"/>
  <meta property="og:description" content="${desc}"/>
  <meta property="og:image" content="https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/assets/og-default.webp"/>
  <meta property="og:locale" content="ar_EG"/>
  <meta property="og:type" content="website"/>
  <meta name="theme-color" content="#1B4F72"/>
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <link rel="manifest" href="./manifest.webmanifest"/>
  <link rel="icon" type="image/png" sizes="96x96" href="./icons/icon-96x96.png"/>
  <link rel="apple-touch-icon" href="./icons/icon-192x192.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"/>
  <link rel="stylesheet" href="./src/css/main.css"/>
</head>
<body class="${bodyClass}">
<div id="app">

  <!-- Header injected by JS -->
  <div id="header-slot"></div>

  <!-- Page Content -->
  <main class="page-main" id="page-container" role="main">
    <div style="display:flex;align-items:center;justify-content:center;min-height:50vh;flex-direction:column;gap:1rem">
      <div class="spinner spinner-lg"></div>
      <p style="color:var(--text-muted);font-size:.9rem">جاري التحميل...</p>
    </div>
  </main>

  <!-- Bottom Nav injected by JS -->
  <div id="nav-slot"></div>

  <!-- PWA Banner injected by JS -->
  <div id="pwa-slot"></div>

  <!-- Footer injected by JS -->
  <div id="footer-slot"></div>

</div>

<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>

<!-- Page Module -->
<script type="module">
${moduleScript}
</script>
</body>
</html>`;
}

// ── Pages config ─────────────────────────────────────────────
const pages = [
  {
    file: 'places.html',
    title: 'دليل الأماكن والخدمات والمهن في المنزلة',
    desc: 'تصفح جميع المحلات والأطباء والحرفيين والمهن (سباك، نجار، مبلط، كهربائي) والأنشطة التجارية في مدينة المنزلة',
    activeNav: 'places.html',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderPlacesPage } from './src/js/ui/pages/places.js';
  await initPage('places.html');
  const params = new URLSearchParams(location.search);
  await renderPlacesPage(document.getElementById('page-container'), {
    query: { q: params.get('q')||'', category: params.get('category')||'', filter: params.get('filter')||'' }
  });`
  },
  {
    file: 'categories.html',
    title: 'تصنيفات الدليل والمهن',
    desc: 'استكشف جميع تصنيفات الأماكن، المحلات، العيادات، والمهن الحرفية في دليل المنزلة الرقمي',
    activeNav: 'categories.html',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderCategoriesPage } from './src/js/ui/pages/categories.js';
  await initPage('categories.html');
  await renderCategoriesPage(document.getElementById('page-container'));`
  },
  {
    file: 'category.html',
    title: 'تصنيف ومهنة',
    desc: 'تصفح الأماكن ومقدمي الخدمات في هذا التصنيف بمدينة المنزلة',
    activeNav: 'categories.html',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderCategoryPage } from './src/js/ui/pages/categories.js';
  await initPage('categories.html');
  const slug = new URLSearchParams(location.search).get('slug') || '';
  await renderCategoryPage(document.getElementById('page-container'), { slug });`
  },
  {
    file: 'place.html',
    title: 'تفاصيل المكان أو النشاط',
    desc: 'عرض معلومات وتفاصيل المكان كاملة — المواعيد وأرقام التواصل والعنوان والعروض والخدمات',
    activeNav: '',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderPlacePage } from './src/js/ui/pages/place.js';
  import { waitForAuth } from './src/js/core/auth.js';
  await initPage('');
  const user = await waitForAuth();
  const slug = new URLSearchParams(location.search).get('slug') || '';
  if (!slug) { location.href = 'places.html'; }
  else await renderPlacePage(document.getElementById('page-container'), { slug, user });`
  },
  {
    file: 'search.html',
    title: 'فين في المنزلة؟ مين في المنزلة؟ عند مين في المنزلة؟ | بحث ذكي',
    desc: 'ابحث بالذكاء الاصطناعي عن أي مكان، طبيب، أو صنايعي ومهني (سباك، نجار، مبلط، كهربائي) في دليل المنزلة',
    activeNav: '',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderSearchPage } from './src/js/ui/pages/search.js';
  await initPage('');
  const q = new URLSearchParams(location.search).get('q') || '';
  await renderSearchPage(document.getElementById('page-container'), { q });`
  },
  {
    file: 'offers.html',
    title: 'العروض اليومية',
    desc: 'اطلع على أحدث عروض وتخفيضات محلات وخدمات مدينة المنزلة المحدثة يومياً',
    activeNav: 'offers.html',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderOffersPage } from './src/js/ui/pages/offers.js';
  await initPage('offers.html');
  await renderOffersPage(document.getElementById('page-container'));`
  },
  {
    file: 'products.html',
    title: 'دليل المنتجات والأسعار',
    desc: 'استعرض قائمة المنتجات والأسعار المتاحة من المحلات الموثقة في مدينة المنزلة',
    activeNav: '',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderProductsPage } from './src/js/ui/pages/products.js';
  await initPage('');
  await renderProductsPage(document.getElementById('page-container'));`
  },
  {
    file: 'login.html',
    title: 'تسجيل الدخول',
    desc: 'سجّل دخولك بحساب Google لإضافة مكانك وإدارة نشاطك في المنزلة',
    activeNav: '',
    bodyClass: 'auth-page',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderLoginPage } from './src/js/ui/pages/login.js';
  import { waitForAuth } from './src/js/core/auth.js';
  await initPage('');
  const user = await waitForAuth();
  if (user) { location.href = 'dashboard.html'; }
  else await renderLoginPage(document.getElementById('page-container'));`
  },
  {
    file: 'dashboard.html',
    title: 'لوحة التحكم',
    desc: 'إدارة أماكنك وعروضك ومنتجاتك في دليل المنزلة الرقمي',
    activeNav: 'dashboard.html',
    bodyClass: 'dashboard-page',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderDashboard } from './src/js/ui/pages/dashboard.js';
  import { waitForAuth } from './src/js/core/auth.js';
  await initPage('dashboard.html');
  const user = await waitForAuth();
  if (!user) { location.href = 'login.html'; }
  else {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') || 'overview';
    const placeId = params.get('id') || null;
    await renderDashboard(document.getElementById('page-container'), { user, section, placeId });
  }`
  },
  {
    file: 'admin.html',
    title: 'لوحة الإدارة',
    desc: 'إدارة شاملة لمنصة المنزلة وناسها — الأماكن والمستخدمين والإعدادات',
    activeNav: '',
    bodyClass: 'dashboard-page',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderAdmin } from './src/js/ui/pages/admin.js';
  import { waitForAuth, isAdmin } from './src/js/core/auth.js';
  await initPage('');
  const user = await waitForAuth();
  if (!user || !isAdmin(user)) { location.href = 'index.html'; }
  else {
    const section = new URLSearchParams(location.search).get('section') || 'overview';
    await renderAdmin(document.getElementById('page-container'), { user, section });
  }`
  },
  {
    file: 'privacy.html',
    title: 'سياسة الخصوصية',
    desc: 'سياسة الخصوصية وحماية البيانات لمنصة المنزلة وناسها',
    activeNav: '',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderStaticPage } from './src/js/ui/pages/static.js';
  await initPage('');
  await renderStaticPage(document.getElementById('page-container'), 'privacy');`
  },
  {
    file: 'terms.html',
    title: 'شروط الاستخدام',
    desc: 'شروط وأحكام استخدام منصة المنزلة وناسها',
    activeNav: '',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderStaticPage } from './src/js/ui/pages/static.js';
  await initPage('');
  await renderStaticPage(document.getElementById('page-container'), 'terms');`
  },
  {
    file: 'contact.html',
    title: 'تواصل معنا',
    desc: 'تواصل مع إدارة منصة المنزلة وناسها لاستفساراتك وطلبات التوثيق',
    activeNav: '',
    moduleScript: `
  import { initPage } from './src/js/core/page-shell.js';
  import { renderContactPage } from './src/js/ui/pages/static.js';
  import { waitForAuth } from './src/js/core/auth.js';
  await initPage('');
  const user = await waitForAuth();
  await renderContactPage(document.getElementById('page-container'), { user });`
  },
];

// ── Write all files ──────────────────────────────────────────
let generated = 0;
pages.forEach(p => {
  const html = page(p);
  fs.writeFileSync(p.file, html, 'utf8');
  generated++;
  console.log(`✓ ${p.file}`);
});

console.log(`\n✅ Generated ${generated} HTML pages successfully!`);
