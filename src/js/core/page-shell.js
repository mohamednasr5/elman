/**
 * page-shell.js — Shared page initialization for all standalone HTML pages
 * Injects header/footer/bottom-nav/PWA banner and sets up common functionality
 */
import { initFirebase } from './firebase.js';
import { initAuth, signOut, waitForAuth, onAuthStateChange, isAdmin } from './auth.js';
import { getSettings } from './db.js';
import { toast } from '../ui/components/Toast.js';

/* ─────────────────────────────────────────────────────────
   HTML BUILDERS
───────────────────────────────────────────────────────── */
function _headerHTML(active) {
  const links = [
    ['index.html',      'الرئيسية'],
    ['places.html',     'الأماكن'],
    ['categories.html', 'التصنيفات'],
    ['offers.html',     'العروض'],
  ];
  return `
<header class="header" id="site-header" role="banner">
  <div class="header__inner container">
    <a href="index.html" class="header__logo" aria-label="المنزلة وناسها">
      <img src="./icons/icon-72x72.png" alt="" class="header__logo-icon" width="36" height="36"/>
      <div class="header__logo-text">
        <span class="header__logo-name">المنزلة وناسها</span>
        <span class="header__logo-tagline">دليل المنزلة الرقمي</span>
      </div>
    </a>

    <div class="header__search" role="search">
      <div class="form-input-wrapper">
        <span class="form-input-icon">🔍</span>
        <input type="search" id="header-search-input" class="form-input"
               placeholder="ابحث في المنزلة..." autocomplete="off"/>
      </div>
    </div>

    <nav class="header__nav" role="navigation" aria-label="التنقل الرئيسي">
      ${links.map(([href, label]) =>
        `<a href="${href}" class="header__nav-link${href === active ? ' active' : ''}">${label}</a>`
      ).join('')}
    </nav>

    <button class="header__search-btn" id="mobile-search-btn" aria-label="بحث">🔍</button>

    <div id="header-user-section">
      <a href="login.html" class="btn btn-primary btn-sm"><span>🔑</span> دخول</a>
    </div>
  </div>
</header>`;
}

function _bottomNavHTML(active) {
  const items = [
    ['index.html',      '🏠', 'الرئيسية'],
    ['categories.html', '📋', 'التصنيفات'],
    ['offers.html',     '🏷️', 'العروض'],
    ['dashboard.html',  '👤', 'حسابي'],
  ];
  return `
<nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="تنقل سريع">
  <a href="${items[0][0]}" class="bottom-nav__item${items[0][0]===active?' active':''}">
    <span class="bottom-nav__icon">${items[0][1]}</span>
    <span class="bottom-nav__label">${items[0][2]}</span>
  </a>
  <a href="${items[1][0]}" class="bottom-nav__item${items[1][0]===active?' active':''}">
    <span class="bottom-nav__icon">${items[1][1]}</span>
    <span class="bottom-nav__label">${items[1][2]}</span>
  </a>
  <div class="bottom-nav__fab">
    <a href="search.html" class="bottom-nav__fab-btn" aria-label="بحث">🔍</a>
  </div>
  <a href="${items[2][0]}" class="bottom-nav__item${items[2][0]===active?' active':''}">
    <span class="bottom-nav__icon">${items[2][1]}</span>
    <span class="bottom-nav__label">${items[2][2]}</span>
  </a>
  <a href="${items[3][0]}" class="bottom-nav__item${items[3][0]===active?' active':''}">
    <span class="bottom-nav__icon">${items[3][1]}</span>
    <span class="bottom-nav__label">${items[3][2]}</span>
  </a>
</nav>`;
}

function _footerHTML() {
  return `
<footer class="footer" id="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a href="index.html" class="footer__logo">
          <img src="./icons/icon-72x72.png" alt="شعار المنزلة وناسها" width="40" height="40"/>
          <span class="footer__logo-name">المنزلة وناسها</span>
        </a>
        <p class="footer__description">
          دليلك الرقمي الشامل في مدينة المنزلة — ابحث عن الأطباء والمحلات والخدمات كلها في مكان واحد.
        </p>
      </div>
      <div>
        <h3 class="footer__col-title">روابط سريعة</h3>
        <ul class="footer__links">
          <li><a href="index.html"      class="footer__link">الرئيسية</a></li>
          <li><a href="places.html"     class="footer__link">دليل الأماكن</a></li>
          <li><a href="categories.html" class="footer__link">التصنيفات</a></li>
          <li><a href="offers.html"     class="footer__link">العروض اليومية</a></li>
          <li><a href="products.html"   class="footer__link">المنتجات</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">الخدمات</h3>
        <ul class="footer__links">
          <li><a href="dashboard.html?section=add" class="footer__link">إضافة مكان</a></li>
          <li><a href="dashboard.html"             class="footer__link">لوحة التحكم</a></li>
          <li><a href="search.html"                class="footer__link">البحث المتقدم</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">تواصل معنا</h3>
        <ul class="footer__links">
          <li><a href="contact.html"  class="footer__link">📧 تواصل معنا</a></li>
          <li><a href="privacy.html"  class="footer__link">سياسة الخصوصية</a></li>
          <li><a href="terms.html"    class="footer__link">شروط الاستخدام</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p class="footer__copyright">© 2026 المنزلة وناسها. جميع الحقوق محفوظة.</p>
      <div class="footer__bottom-links">
        <a href="privacy.html" class="footer__bottom-link">الخصوصية</a>
        <a href="terms.html"   class="footer__bottom-link">الشروط</a>
        <a href="contact.html" class="footer__bottom-link">تواصل</a>
      </div>
    </div>
  </div>
</footer>`;
}

function _pwaBannerHTML() {
  return `
<div class="pwa-banner" id="pwa-banner" hidden>
  <img src="./icons/icon-72x72.png" alt="" class="pwa-banner__icon" width="52" height="52"/>
  <div class="pwa-banner__content">
    <div class="pwa-banner__title">ثبّت التطبيق</div>
    <div class="pwa-banner__text">المنزلة وناسها — وصول أسرع</div>
  </div>
  <div class="pwa-banner__actions">
    <button class="btn btn-primary btn-sm" id="pwa-install-btn">تثبيت</button>
  </div>
  <button class="pwa-banner__close" id="pwa-banner-close" aria-label="إغلاق">✕</button>
</div>`;
}

/* ─────────────────────────────────────────────────────────
   MAIN INIT — called from every page
───────────────────────────────────────────────────────── */
export async function initPage(activeFile = '') {
  /* 1. Firebase + Auth */
  initFirebase();
  initAuth();

  /* 2. Inject shared layout blocks */
  _inject('header-slot',  _headerHTML(activeFile));
  _inject('footer-slot',  _footerHTML());
  _inject('nav-slot',     _bottomNavHTML(activeFile));
  _inject('pwa-slot',     _pwaBannerHTML());

  /* 3. Scroll shadow on header */
  const hdr = document.getElementById('site-header');
  window.addEventListener('scroll', () =>
    hdr?.classList.toggle('scrolled', scrollY > 8), { passive: true });

  /* 4. Header search */
  document.getElementById('header-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim())
      location.href = `search.html?q=${encodeURIComponent(e.target.value.trim())}`;
  });
  document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
    location.href = 'search.html';
  });

  /* 5. Auth UI (reactive) */
  onAuthStateChange(user => _renderUser(user));

  /* 6. Dynamic settings (WhatsApp link) */
  try {
    const s = await getSettings();
    const waLink = s?.contact?.whatsappLink;
    if (waLink) {
      document.querySelectorAll('[data-wa]').forEach(a => { a.href = waLink; });
    }
  } catch (_) {}

  /* 7. PWA Install banner */
  _setupPwa();

  /* 8. Service Worker */
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}

/* ─────────────────────────────────────────────────────────
   Re-export helpers needed by page modules
───────────────────────────────────────────────────────── */
export { waitForAuth, isAdmin };

/* ─────────────────────────────────────────────────────────
   PRIVATE HELPERS
───────────────────────────────────────────────────────── */
function _inject(slotId, html) {
  const slot = document.getElementById(slotId);
  if (!slot) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = html.trim();
  slot.replaceWith(tmp.firstElementChild);
}

function _renderUser(user) {
  const wrap = document.getElementById('header-user-section');
  if (!wrap) return;
  if (user) {
    wrap.innerHTML = `
      <div style="position:relative">
        <button class="header__user-btn" id="usr-btn" aria-haspopup="true" aria-expanded="false">
          <img src="${_a(user.photoURL || './icons/icon-72x72.png')}"
               class="header__avatar" width="32" height="32"
               onerror="this.src='./icons/icon-72x72.png'"
               alt="${_h(user.name)}"/>
          <span class="header__user-name">${_h((user.name||'').split(' ')[0])}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div class="header__dropdown" id="usr-dd" role="menu">
          <a href="dashboard.html"             class="header__dropdown-item" role="menuitem">🏠 لوحتي</a>
          <a href="dashboard.html?section=add" class="header__dropdown-item" role="menuitem">➕ إضافة مكان</a>
          ${isAdmin(user)
            ? '<a href="admin.html" class="header__dropdown-item" style="color:var(--secondary);font-weight:bold" role="menuitem">⚙️ لوحة الإدارة</a>'
            : ''}
          <div class="header__dropdown-divider"></div>
          <button id="logout-btn" class="header__dropdown-item header__dropdown-item--danger" role="menuitem">
            🚪 تسجيل الخروج
          </button>
        </div>
      </div>`;

    const btn = document.getElementById('usr-btn');
    const dd  = document.getElementById('usr-dd');
    btn?.addEventListener('click', e => { e.stopPropagation(); dd?.classList.toggle('open'); });
    document.addEventListener('click', () => dd?.classList.remove('open'));
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      location.reload();
    });
  } else {
    wrap.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm"><span>🔑</span> دخول</a>`;
  }
}

let _dp = null;
function _setupPwa() {
  // Capture native install prompt
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _dp = e;
    _showPwaBanner();
  });

  // Also check and show banner after delay on desktop/mobile if not installed/dismissed
  setTimeout(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone && !sessionStorage.getItem('pwa-dismissed')) {
      _showPwaBanner();
    }
  }, 3500);

  // Setup click listeners immediately on document to ensure they always work
  document.addEventListener('click', e => {
    // Close button
    if (e.target.closest('#pwa-banner-close')) {
      e.preventDefault();
      _dismissPwaBanner();
      return;
    }

    // Install button
    if (e.target.closest('#pwa-install-btn')) {
      e.preventDefault();
      if (_dp) {
        _dp.prompt();
        _dp.userChoice.then(() => { _dp = null; });
      } else {
        toast.info('لتثبيت التطبيق على الكمبيوتر: اضغط على أيقونة التثبيت ⊕ في شريط عنوان المتصفح بالأعلى');
      }
      _dismissPwaBanner();
    }
  });
}

function _showPwaBanner() {
  const b = document.getElementById('pwa-banner');
  if (b && !sessionStorage.getItem('pwa-dismissed')) {
    b.removeAttribute('hidden');
    requestAnimationFrame(() => {
      b.classList.add('visible');
    });
  }
}

function _dismissPwaBanner() {
  const b = document.getElementById('pwa-banner');
  if (b) {
    b.classList.remove('visible');
    setTimeout(() => {
      b.setAttribute('hidden', '');
    }, 400);
  }
  sessionStorage.setItem('pwa-dismissed', '1');
}

function _h(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _a(s){ return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
