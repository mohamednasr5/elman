import { initPage } from './page-shell.js?v=20260913';
import { getCurrentUser, waitForAuth } from './auth.js';
import { installI18nHardening } from './i18n-runtime.js';

const clean = p => String(p || '/').replace(/^\/en(?:\/|$)/, '/').replace(/\/+$/, '') || '/';
const parts = () => clean(location.pathname).split('/').filter(Boolean);
const page = () => parts()[0] || '';

async function render(container) {
  const p = page();
  const q = new URLSearchParams(location.search);
  const user = getCurrentUser();
  if (p === 'place') { const { renderPlacePage } = await import('../ui/pages/place.js'); return renderPlacePage(container, { slug: parts()[1] || q.get('slug') || '', user }); }
  if (p === 'category') { const { renderCategoryPage } = await import('../ui/pages/categories.js'); return renderCategoryPage(container, { slug: parts()[1] || q.get('slug') || '' }); }
  if (p === 'privacy' || p === 'terms' || p === 'legal') { const { renderEnglishStaticPage } = await import('../ui/pages/static-en.js'); return renderEnglishStaticPage(container, p); }
  if (p === 'manzala' || p === 'matariya') { const mod = await import(`../ui/pages/${p}.js`); return (p === 'manzala' ? mod.renderManzalaPage : mod.renderMatariyaPage)(container); }
  if (p === 'quran' || p === 'quran-search' || p === 'quran-surah' || p === 'hadith') { const mod = await import('../ui/pages/islamic-hub.js'); const fn = { quran:'renderQuran','quran-search':'renderQuranSearch','quran-surah':'renderQuranSurah',hadith:'renderHadith' }[p]; return mod[fn](container); }
  if (p === 'emergency') return renderEmergency(container);
  const routes = {'':['../ui/pages/home.js','renderHomePage'],'places':['../ui/pages/places.js','renderPlacesPage'],'categories':['../ui/pages/categories.js','renderCategoriesPage'],'search':['../ui/pages/search.js','renderSearchPage'],'popular':['../ui/pages/popular.js','renderPopularPage'],'offers':['../ui/pages/offers.js','renderOffersPage'],'now':['../ui/pages/now.js','renderNowPage'],'around-me':['../ui/pages/around-me.js','renderAroundMePage'],'favorites':['../ui/pages/favorites.js','renderFavoritesPage'],'products':['../ui/pages/products.js','renderProductsPage'],'dashboard':['../ui/pages/dashboard.js','renderDashboard'],'login':['../ui/pages/login.js','renderLoginPage'],'contact':['../ui/pages/contact.js','renderContactPage'],'free-verification':['../ui/pages/free-verification.js','renderFreeVerificationPage']};
  const route = routes[p] || routes['']; const mod = await import(route[0]); const fn = mod[route[1]]; if (!fn) throw new Error(`English route renderer not found: ${route[1]}`);
  if (p === 'places') return fn(container,{query:{q:q.get('q')||'',category:q.get('category')||'',filter:q.get('filter')||''},user});
  if (p === 'search') return fn(container,{q:q.get('q')||'',user});
  if (p === 'popular') return fn(container,{filter:q.get('filter')||'views',category:q.get('category')||'',area:q.get('area')||'',q:q.get('q')||''});
  if (p === 'dashboard') return fn(container,{user,section:q.get('section')||'overview',placeId:q.get('id')||null});
  if (p === 'login') { const authUser = await waitForAuth(); if (authUser) location.replace('/en/dashboard/'); else return fn(container); }
  if (p === 'contact') return fn(container,{user});
  if (p === 'free-verification') return fn(container,{user});
  if (p === '') return fn(container,{user});
  return fn(container);
}

function renderEmergency(container) { container.innerHTML = `<section class="container section" aria-labelledby="emergency-title"><div class="page-header"><h1 id="emergency-title">Emergency & Important Numbers</h1><p>Quick access to essential emergency services in Egypt.</p></div><div class="grid grid-2"><a class="card" href="tel:123"><strong>🚑 Ambulance</strong><span>123</span></a><a class="card" href="tel:122"><strong>🚓 Police</strong><span>122</span></a><a class="card" href="tel:180"><strong>🚒 Civil Defense / Fire</strong><span>180</span></a><a class="card" href="tel:121"><strong>⚡ Electricity Emergency</strong><span>121</span></a><a class="card" href="tel:105"><strong>🏥 Health Hotline</strong><span>105</span></a><a class="card" href="tel:16528"><strong>☎️ Government Complaints</strong><span>16528</span></a></div></section>`; }

(async () => { try { document.documentElement.lang='en'; document.documentElement.dir='ltr'; localStorage.setItem('dalil-lang','en'); localStorage.setItem('elmanzala-lang','en'); await initPage(`${page()||'index'}.html`); installI18nHardening(); await render(document.getElementById('page-container')); installI18nHardening(); } catch (error) { console.error('[English Pages]',error); const c=document.getElementById('page-container'); if(c)c.innerHTML='<section class="container section"><h1>Something went wrong</h1><p>Please reload the page and try again.</p></section>'; } })();
