/**
 * Dalil El Manzala & El Matariya — English Pages Controller
 * Real, independent English routing and module invocation.
 */

import { initPage } from './page-shell.js?v=63fea2cf';
import { getCurrentUser, waitForAuth } from './auth.js';

const clean = p => String(p || '/').replace(/^\/en(?:\/|$)/, '/').replace(/\/+$/, '') || '/';
const parts = () => clean(location.pathname).split('/').filter(Boolean);
const page = () => parts()[0] || '';

async function render(container) {
  const p = page();
  const q = new URLSearchParams(location.search);
  const user = getCurrentUser();

  if (p === 'place') {
    const { renderEnglishPlacePage } = await import('../ui/pages/en/place-en.js');
    return renderEnglishPlacePage(container, { slug: parts()[1] || q.get('slug') || '', user });
  }

  if (p === 'category') {
    const { renderEnglishCategoryPage } = await import('../ui/pages/en/categories-en.js');
    return renderEnglishCategoryPage(container, { slug: parts()[1] || q.get('slug') || '', query: { prof: q.get('prof') }, user });
  }

  if (p === 'categories') {
    const { renderEnglishCategoriesPage } = await import('../ui/pages/en/categories-en.js');
    return renderEnglishCategoriesPage(container);
  }

  if (p === 'places') {
    const { renderEnglishPlacesPage } = await import('../ui/pages/en/places-en.js');
    return renderEnglishPlacesPage(container, { query: { q: q.get('q') || '', area: q.get('area') || '', category: q.get('category') || '', filter: q.get('filter') || '' }, user });
  }

  if (p === 'search') {
    const { renderEnglishSearchPage } = await import('../ui/pages/en/search-en.js');
    return renderEnglishSearchPage(container, { q: q.get('q') || '', user });
  }

  if (p === 'popular') {
    const { renderEnglishPopularPage } = await import('../ui/pages/en/popular-en.js');
    return renderEnglishPopularPage(container, { filter: q.get('filter') || 'views', category: q.get('category') || '', area: q.get('area') || '', q: q.get('q') || '' });
  }

  if (p === 'offers') {
    const { renderEnglishOffersPage } = await import('../ui/pages/en/offers-en.js');
    return renderEnglishOffersPage(container);
  }

  if (p === 'now') {
    const { renderEnglishNowPage } = await import('../ui/pages/en/now-en.js');
    return renderEnglishNowPage(container);
  }

  if (p === 'around-me') {
    const { renderEnglishAroundMePage } = await import('../ui/pages/en/around-me-en.js');
    return renderEnglishAroundMePage(container);
  }

  if (p === 'favorites') {
    const { renderEnglishFavoritesPage } = await import('../ui/pages/en/favorites-en.js');
    return renderEnglishFavoritesPage(container);
  }

  if (p === 'contact') {
    const { renderEnglishContactPage } = await import('../ui/pages/en/contact-en.js');
    return renderEnglishContactPage(container);
  }

  if (p === 'free-verification') {
    const { renderEnglishFreeVerificationPage } = await import('../ui/pages/en/free-verification-en.js');
    return renderEnglishFreeVerificationPage(container, { user });
  }

  if (p === 'emergency') {
    const { renderEnglishEmergencyPage } = await import('../ui/pages/en/emergency-en.js');
    return renderEnglishEmergencyPage(container);
  }

  if (p === 'products') {
    const { renderEnglishProductsPage } = await import('../ui/pages/en/products-en.js');
    return renderEnglishProductsPage(container);
  }

  if (p === 'manzala' || p === 'matariya') {
    const { renderEnglishCityPage } = await import('../ui/pages/en/city-en.js');
    return renderEnglishCityPage(container, p);
  }

  if (p === 'privacy' || p === 'terms' || p === 'legal') {
    const { renderEnglishStaticPage } = await import('../ui/pages/static-en.js');
    return renderEnglishStaticPage(container, p);
  }

  if (p === 'login') {
    const authUser = await waitForAuth();
    if (authUser) {
      location.replace('/en/dashboard/');
    } else {
      const { renderEnglishLoginPage } = await import('../ui/pages/en/login-en.js');
      return renderEnglishLoginPage(container);
    }
  }

  if (p === 'dashboard') {
    const { renderEnglishDashboard } = await import('../ui/pages/en/dashboard-en.js');
    return renderEnglishDashboard(container, { user, section: q.get('section') || 'overview' });
  }

  // Default: Homepage
  const { renderEnglishHomePage } = await import('../ui/pages/en/home-en.js');
  return renderEnglishHomePage(container, { user });
}

(async () => {
  try {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    await initPage(`${page() || 'index'}.html`);
    await render(document.getElementById('page-container'));
  } catch (error) {
    console.error('[English Pages]', error);
    const c = document.getElementById('page-container');
    if (c) {
      c.innerHTML = `
        <section class="container section text-center" style="padding:48px 16px">
          <h1 style="color:var(--primary);margin-bottom:1rem">Something went wrong</h1>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem">Please reload the page or return to the homepage.</p>
          <a href="/en/" class="btn btn-primary">Return to Homepage</a>
        </section>
      `;
    }
  }
})();
