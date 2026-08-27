/**
 * المنزلة وناسها — App Entry Point
 * Bootstraps the entire application
 */

import { initFirebase } from './core/firebase.js';
import { initAuth, signInWithGoogle, signOut, getCurrentUser, isAdmin } from './core/auth.js';
import { appState } from './core/state.js';
import { on } from './core/events.js';
import { route, notFound, initRouter, navigate } from './core/router.js';
import { getSettings, getCategories } from './core/db.js';
import { setMeta } from './utils/seo.js';
import { toast } from './ui/components/Toast.js';

// Import page handlers
import { renderHomePage } from './ui/pages/home.js';
import { renderPlacePage } from './ui/pages/place.js';
import { renderSearchPage } from './ui/pages/search.js';
import { renderDashboard } from './ui/pages/dashboard.js';
import { renderAdmin } from './ui/pages/admin.js';

// ── Bootstrap ──
async function bootstrap() {
  // 1. Initialize Firebase
  initFirebase();

  // 2. Initialize Auth listener
  initAuth();

  // 3. Load settings & categories in parallel
  loadGlobalData();

  // 4. Setup header interactivity
  setupHeader();

  // 5. Setup PWA install prompt
  setupPwaInstall();

  // 6. Register routes
  registerRoutes();

  // 7. Start router
  initRouter();

  // 8. Listen to auth state changes to update UI
  on('auth:signedIn', (user) => updateHeaderAuth(user));
  on('auth:signedOut', () => updateHeaderAuth(null));
}

// ── Global Data ──
async function loadGlobalData() {
  try {
    const [settings, categories] = await Promise.all([
      getSettings(),
      getCategories()
    ]);

    if (settings) {
      appState.set('settings', settings);
      applySettings(settings);
    }

    if (categories) {
      appState.set('categories', categories);
    }
  } catch (err) {
    console.warn('[App] Failed to load global data:', err);
  }
}

function applySettings(settings) {
  // Apply site name
  if (settings.general?.siteName) {
    document.querySelector('.header__logo-name').textContent = settings.general.siteName;
    document.querySelector('.footer__logo-name').textContent = settings.general.siteName;
  }

  // Apply primary color from settings
  if (settings.general?.primaryColor) {
    document.documentElement.style.setProperty('--primary', settings.general.primaryColor);
  }

  // Render footer social links
  if (settings.social) {
    renderFooterSocial(settings.social);
  }

  // Render footer contact
  if (settings.contact) {
    renderFooterContact(settings.contact);
  }
}

function renderFooterSocial(social) {
  const container = document.getElementById('footer-social');
  if (!container) return;

  const links = [];
  if (social.facebook)  links.push({ url: social.facebook,  icon: 'f', name: 'فيسبوك' });
  if (social.instagram) links.push({ url: social.instagram, icon: '📷', name: 'إنستجرام' });
  if (social.youtube)   links.push({ url: social.youtube,   icon: '▶', name: 'يوتيوب' });

  container.innerHTML = links.map(l => `
    <a href="${l.url}" target="_blank" rel="noopener noreferrer" 
       class="footer__social-link" aria-label="${l.name}">
      ${l.icon}
    </a>
  `).join('');
}

function renderFooterContact(contact) {
  const container = document.getElementById('footer-contact');
  if (!container) return;

  const items = [`<li><a href="#/contact" class="footer__link">📧 تواصل معنا</a></li>`];

  if (contact.whatsappLink) {
    items.unshift(`<li><a href="${contact.whatsappLink}" target="_blank" rel="noopener" class="footer__link">💬 واتساب</a></li>`);
  }

  items.push(
    `<li><a href="#/privacy" class="footer__link">سياسة الخصوصية</a></li>`,
    `<li><a href="#/terms" class="footer__link">شروط الاستخدام</a></li>`
  );

  container.innerHTML = items.join('');
}

// ── Header ──
function setupHeader() {
  // Scroll shadow
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Header search
  const headerSearch = document.getElementById('header-search-input');
  if (headerSearch) {
    let debounceTimer;
    headerSearch.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const q = headerSearch.value.trim();
        if (q.length >= 2) {
          navigate(`/search?q=${encodeURIComponent(q)}`);
        }
      }, 500);
    });

    headerSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = headerSearch.value.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
      }
    });
  }

  // Mobile search button
  document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
    navigate('/search');
  });

  // Bottom nav active state
  setupBottomNav();
}

function setupBottomNav() {
  const navItems = document.querySelectorAll('.bottom-nav__item[data-route]');

  function updateActive() {
    const hash = window.location.hash.slice(1) || '/';
    navItems.forEach(item => {
      const route = item.dataset.route;
      const isActive = route === '/' ? hash === '/' || hash === '' : hash.startsWith(route);
      item.classList.toggle('active', isActive);
    });
  }

  window.addEventListener('hashchange', updateActive);
  updateActive();
}

function updateHeaderAuth(user) {
  const container = document.getElementById('header-user-section');
  if (!container) return;

  const loading = document.getElementById('header-auth-loading');
  if (loading) loading.remove();

  if (user) {
    container.innerHTML = `
      <div class="header__user">
        <button class="header__user-btn" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
          <img
            src="${user.photoURL || '/icons/icon-72x72.png'}"
            alt="${user.name}"
            class="header__avatar"
            width="32" height="32"
          />
          <span class="header__user-name">${user.name.split(' ')[0]}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div class="header__dropdown" id="user-dropdown" role="menu">
          <a href="#/dashboard" class="header__dropdown-item" role="menuitem">
            <span aria-hidden="true">🏠</span> لوحة تحكمي
          </a>
          <a href="#/dashboard/places" class="header__dropdown-item" role="menuitem">
            <span aria-hidden="true">📍</span> أماكني
          </a>
          <a href="#/dashboard/places/add" class="header__dropdown-item" role="menuitem">
            <span aria-hidden="true">➕</span> إضافة مكان
          </a>
          ${isAdmin(user) ? `
          <div class="header__dropdown-divider"></div>
          <a href="#/admin" class="header__dropdown-item" role="menuitem">
            <span aria-hidden="true">⚙️</span> لوحة الإدارة
          </a>
          ` : ''}
          <div class="header__dropdown-divider"></div>
          <button class="header__dropdown-item header__dropdown-item--danger" id="logout-btn" role="menuitem">
            <span aria-hidden="true">🚪</span> تسجيل الخروج
          </button>
        </div>
      </div>
    `;

    // Dropdown toggle
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');

    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', () => {
      dropdown?.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try {
        await signOut();
        toast.success('تم تسجيل الخروج بنجاح');
        navigate('/');
      } catch {
        toast.error('حدث خطأ أثناء تسجيل الخروج');
      }
    });
  } else {
    container.innerHTML = `
      <button class="btn btn-primary btn-sm header__login-btn" id="header-login-btn">
        <span>🔑</span> دخول
      </button>
    `;

    document.getElementById('header-login-btn')?.addEventListener('click', async () => {
      try {
        const btn = document.getElementById('header-login-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        await signInWithGoogle();
      } catch (err) {
        if (err.message === 'ACCOUNT_SUSPENDED') {
          toast.error('تم تعليق حسابك. تواصل مع الإدارة.');
        } else {
          toast.error('فشل تسجيل الدخول. حاول مجدداً.');
        }
        const btn = document.getElementById('header-login-btn');
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
      }
    });
  }
}

// ── PWA Install ──
let _deferredInstallPrompt = null;

function setupPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;

    // Show banner after 30 seconds if not dismissed
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (!dismissed) {
      setTimeout(() => showPwaBanner(), 30000);
    }
  });

  window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    hidePwaBanner();
    toast.success('تم تثبيت التطبيق بنجاح! 🎉');
  });

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!_deferredInstallPrompt) {
      showInstallInstructions();
      return;
    }

    _deferredInstallPrompt.prompt();
    const { outcome } = await _deferredInstallPrompt.userChoice;

    if (outcome === 'accepted') {
      _deferredInstallPrompt = null;
      hidePwaBanner();
    }
  });

  document.getElementById('pwa-banner-close')?.addEventListener('click', () => {
    hidePwaBanner();
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  });
}

function showPwaBanner() {
  const banner = document.getElementById('pwa-banner');
  if (banner) {
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('visible'));
  }
}

function hidePwaBanner() {
  const banner = document.getElementById('pwa-banner');
  if (banner) {
    banner.classList.remove('visible');
    setTimeout(() => { banner.hidden = true; }, 400);
  }
}

function showInstallInstructions() {
  const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome/.test(navigator.userAgent.toLowerCase());

  import('./ui/components/Modal.js').then(({ showModal }) => {
    showModal({
      title: 'تثبيت التطبيق',
      size: 'sm',
      content: isIos && isSafari ? `
        <div style="text-align:center">
          <p style="margin-bottom:1rem;color:var(--text-secondary)">لتثبيت التطبيق على iPhone/iPad:</p>
          <ol style="text-align:right;line-height:2;color:var(--text-secondary)">
            <li>اضغط على زر <strong>المشاركة</strong> ⬆️ في أسفل الشاشة</li>
            <li>اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong></li>
            <li>اضغط <strong>إضافة</strong></li>
          </ol>
        </div>
      ` : `
        <div style="text-align:center">
          <p style="color:var(--text-secondary)">يمكنك تثبيت التطبيق من قائمة المتصفح (⋮) ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"</p>
        </div>
      `,
      buttons: [{ label: 'حسناً', type: 'primary', closeOnClick: true }]
    });
  });
}

// ── Route Registration ──
function registerRoutes() {
  const $main = document.getElementById('page-container');

  function setPage(content) {
    $main.innerHTML = content;
  }

  // Remove app loading
  const appLoading = document.getElementById('app-loading');

  // Home
  route('/', async ({ params, query, user }) => {
    appLoading?.remove();
    setMeta({});
    await renderHomePage($main, { user });
  });

  // Places list
  route('/places', async ({ params, query, user }) => {
    appLoading?.remove();
    setMeta({ title: 'دليل الأماكن', url: '/#/places' });
    const { renderPlacesPage } = await import('./ui/pages/places.js');
    await renderPlacesPage($main, { query, user });
  });

  // Categories list
  route('/categories', async ({ params, query, user }) => {
    appLoading?.remove();
    setMeta({ title: 'التصنيفات', url: '/#/categories' });
    const { renderCategoriesPage } = await import('./ui/pages/categories.js');
    await renderCategoriesPage($main, { user });
  });

  // Category detail
  route('/category/:slug', async ({ params, query, user }) => {
    appLoading?.remove();
    const { renderCategoryPage } = await import('./ui/pages/categories.js');
    await renderCategoryPage($main, { slug: params.slug, query, user });
  });

  // Place detail
  route('/place/:slug', async ({ params, user }) => {
    appLoading?.remove();
    await renderPlacePage($main, { slug: params.slug, user });
  });

  // Search
  route('/search', async ({ query, user }) => {
    appLoading?.remove();
    setMeta({ title: query.q ? `نتائج بحث: ${query.q}` : 'البحث', url: '/#/search' });
    await renderSearchPage($main, { q: query.q || '', user });
  });

  // Offers
  route('/offers', async ({ user }) => {
    appLoading?.remove();
    setMeta({ title: 'العروض اليومية', url: '/#/offers' });
    const { renderOffersPage } = await import('./ui/pages/offers.js');
    await renderOffersPage($main, { user });
  });

  // Products
  route('/products', async ({ user }) => {
    appLoading?.remove();
    setMeta({ title: 'المنتجات', url: '/#/products' });
    const { renderProductsPage } = await import('./ui/pages/products.js');
    await renderProductsPage($main, { user });
  });

  // Login
  route('/login', async ({ user }) => {
    appLoading?.remove();
    if (user) { navigate('/dashboard'); return; }
    setMeta({ title: 'تسجيل الدخول', noindex: true });
    const { renderLoginPage } = await import('./ui/pages/login.js');
    await renderLoginPage($main);
  });

  // ── Dashboard (requires auth) ──
  route('/dashboard', async ({ user }) => {
    appLoading?.remove();
    setMeta({ title: 'لوحة التحكم', noindex: true });
    await renderDashboard($main, { user, section: 'overview' });
  }, { requiresAuth: true });

  route('/dashboard/places', async ({ user }) => {
    appLoading?.remove();
    setMeta({ title: 'أماكني', noindex: true });
    await renderDashboard($main, { user, section: 'places' });
  }, { requiresAuth: true });

  route('/dashboard/places/add', async ({ user }) => {
    appLoading?.remove();
    setMeta({ title: 'إضافة مكان', noindex: true });
    await renderDashboard($main, { user, section: 'add-place' });
  }, { requiresAuth: true });

  route('/dashboard/places/:id', async ({ params, user }) => {
    appLoading?.remove();
    setMeta({ title: 'تعديل المكان', noindex: true });
    await renderDashboard($main, { user, section: 'edit-place', placeId: params.id });
  }, { requiresAuth: true });

  route('/dashboard/places/:id/offers', async ({ params, user }) => {
    appLoading?.remove();
    setMeta({ title: 'إدارة العروض', noindex: true });
    await renderDashboard($main, { user, section: 'place-offers', placeId: params.id });
  }, { requiresAuth: true });

  route('/dashboard/places/:id/products', async ({ params, user }) => {
    appLoading?.remove();
    setMeta({ title: 'إدارة المنتجات', noindex: true });
    await renderDashboard($main, { user, section: 'place-products', placeId: params.id });
  }, { requiresAuth: true });

  route('/dashboard/places/:id/settings', async ({ params, user }) => {
    appLoading?.remove();
    setMeta({ title: 'إعدادات المكان', noindex: true });
    await renderDashboard($main, { user, section: 'place-settings', placeId: params.id });
  }, { requiresAuth: true });

  // ── Admin (requires admin role) ──
  route('/admin', async ({ user }) => {
    appLoading?.remove();
    setMeta({ title: 'لوحة الإدارة', noindex: true });
    await renderAdmin($main, { user, section: 'overview' });
  }, { requiresAdmin: true });

  route('/admin/users', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'users' });
  }, { requiresAdmin: true });

  route('/admin/places', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'places' });
  }, { requiresAdmin: true });

  route('/admin/categories', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'categories' });
  }, { requiresAdmin: true });

  route('/admin/offers', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'offers' });
  }, { requiresAdmin: true });

  route('/admin/products', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'products' });
  }, { requiresAdmin: true });

  route('/admin/ads', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'ads' });
  }, { requiresAdmin: true });

  route('/admin/settings', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'settings' });
  }, { requiresAdmin: true });

  route('/admin/verification', async ({ user }) => {
    appLoading?.remove();
    await renderAdmin($main, { user, section: 'verification' });
  }, { requiresAdmin: true });

  // Static pages
  route('/privacy', async () => {
    appLoading?.remove();
    setMeta({ title: 'سياسة الخصوصية', url: '/#/privacy' });
    const { renderStaticPage } = await import('./ui/pages/static.js');
    await renderStaticPage($main, 'privacy');
  });

  route('/terms', async () => {
    appLoading?.remove();
    setMeta({ title: 'شروط الاستخدام', url: '/#/terms' });
    const { renderStaticPage } = await import('./ui/pages/static.js');
    await renderStaticPage($main, 'terms');
  });

  route('/contact', async ({ user }) => {
    appLoading?.remove();
    setMeta({ title: 'تواصل معنا', url: '/#/contact' });
    const { renderContactPage } = await import('./ui/pages/static.js');
    await renderContactPage($main, { user });
  });

  // 404
  notFound(async () => {
    appLoading?.remove();
    setMeta({ title: 'الصفحة غير موجودة', noindex: true });
    $main.innerHTML = `
      <div class="error-page">
        <div class="error-page__content animate-fade-in-up">
          <div class="error-page__code">404</div>
          <h1 class="error-page__title">الصفحة غير موجودة</h1>
          <p class="error-page__text">لم نعثر على الصفحة التي تبحث عنها</p>
          <a href="#/" class="btn btn-primary btn-lg">العودة للرئيسية</a>
        </div>
      </div>
    `;
  });
}

// ── Track place stats (global function for card buttons) ──
window.trackStat = async (placeId, stat) => {
  if (!placeId || !stat) return;
  try {
    const { trackPlaceStat } = await import('./core/db.js');
    await trackPlaceStat(placeId, stat);
  } catch { /* silent */ }
};

// ── Start App ──
bootstrap().catch(err => {
  console.error('[App] Bootstrap failed:', err);
  document.getElementById('app-loading').innerHTML = `
    <div style="text-align:center;padding:2rem;color:var(--danger)">
      <p>حدث خطأ في تحميل التطبيق. حاول تحديث الصفحة.</p>
      <button onclick="location.reload()" class="btn btn-primary" style="margin-top:1rem">تحديث</button>
    </div>
  `;
});
