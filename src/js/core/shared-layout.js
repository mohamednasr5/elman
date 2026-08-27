/**
 * shared-layout.js
 * بناء الـ Header + Footer + Bottom-Nav المشترك بين جميع الصفحات
 * يُستدعى من كل صفحة HTML مستقلة
 */
import { initFirebase } from './firebase.js';
import { initAuth, signInWithGoogle, signOut, getCurrentUser, onAuthStateChange } from './auth.js';
import { getSettings } from './db.js';
import { toast } from '../ui/components/Toast.js';

/**
 * @param {string} activeHref - مثال: 'places.html' لتلوين الرابط النشط
 */
export async function initSharedLayout(activeHref = '') {
  initFirebase();
  initAuth();
  _setupHeaderScroll();
  _setupHeaderSearch();
  _setupPwaBanner();
  _setActiveLinks(activeHref);

  onAuthStateChange((user) => {
    _renderUserSection(user);
  });

  try {
    const settings = await getSettings();
    if (settings?.contact?.whatsappLink) {
      document.querySelectorAll('[data-wa-link]').forEach(el => {
        el.href = settings.contact.whatsappLink;
      });
    }
  } catch (_) {}
}

function _setActiveLinks(activeHref) {
  if (!activeHref) return;
  document.querySelectorAll('.header__nav-link, .bottom-nav__item').forEach(el => {
    const href = el.getAttribute('href') || '';
    if (href === activeHref) {
      el.classList.add('active');
    }
  });
}

function _setupHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });
}

function _setupHeaderSearch() {
  const input = document.getElementById('header-search-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }
  document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
    window.location.href = 'search.html';
  });
}

function _renderUserSection(user) {
  const wrap = document.getElementById('header-user-section');
  if (!wrap) return;

  if (user) {
    wrap.innerHTML = `
      <div class="header__user" style="position:relative">
        <button class="header__user-btn" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
          <img src="${user.photoURL || './icons/icon-72x72.png'}"
               alt="${_esc(user.name)}"
               class="header__avatar" width="32" height="32"
               onerror="this.src='./icons/icon-72x72.png'" />
          <span class="header__user-name">${_esc(user.name.split(' ')[0])}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div class="header__dropdown" id="user-dropdown" role="menu">
          <a href="dashboard.html" class="header__dropdown-item" role="menuitem">🏠 لوحة تحكمي</a>
          <a href="dashboard.html?section=places" class="header__dropdown-item" role="menuitem">📍 أماكني</a>
          <a href="dashboard.html?section=add" class="header__dropdown-item" role="menuitem">➕ إضافة مكان</a>
          ${(user.role === 'admin' || user.role === 'superadmin') ? `
            <div class="header__dropdown-divider"></div>
            <a href="admin.html" class="header__dropdown-item" style="color:var(--secondary)" role="menuitem">⚙️ الإدارة</a>
          ` : ''}
          <div class="header__dropdown-divider"></div>
          <button class="header__dropdown-item header__dropdown-item--danger" id="logout-btn" role="menuitem">🚪 خروج</button>
        </div>
      </div>`;

    document.getElementById('user-menu-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('user-dropdown')?.classList.toggle('open');
    });
    document.addEventListener('click', () =>
      document.getElementById('user-dropdown')?.classList.remove('open'));
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await signOut();
      toast.success('تم تسجيل الخروج');
      window.location.reload();
    });
  } else {
    wrap.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm"><span>🔑</span> دخول</a>`;
  }
}

let _deferredPrompt = null;
function _setupPwaBanner() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    const banner = document.getElementById('pwa-banner');
    if (banner && !sessionStorage.getItem('pwa-dismissed')) {
      setTimeout(() => { banner.hidden = false; banner.classList.add('visible'); }, 6000);
    }
  });
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (_deferredPrompt) { _deferredPrompt.prompt(); _deferredPrompt = null; }
    document.getElementById('pwa-banner')?.classList.remove('visible');
  });
  document.getElementById('pwa-banner-close')?.addEventListener('click', () => {
    document.getElementById('pwa-banner')?.classList.remove('visible');
    sessionStorage.setItem('pwa-dismissed', '1');
  });
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// تصدير هيكل الـ HTML الثابت المشترك لبناء كل صفحة
export function getSharedHeaderHTML(activePage = '') {
  const nav = [
    { href: 'index.html',      label: 'الرئيسية' },
    { href: 'places.html',     label: 'الأماكن' },
    { href: 'categories.html', label: 'التصنيفات' },
    { href: 'offers.html',     label: 'العروض' },
  ];
  return `
  <header class="header" id="site-header" role="banner">
    <div class="header__inner container">
      <a href="index.html" class="header__logo" aria-label="المنزلة وناسها">
        <img src="./icons/icon-72x72.png" alt="شعار" class="header__logo-icon" width="36" height="36"/>
        <div class="header__logo-text">
          <span class="header__logo-name">المنزلة وناسها</span>
          <span class="header__logo-tagline">دليل المنزلة الرقمي</span>
        </div>
      </a>
      <div class="header__search" role="search">
        <div class="form-input-wrapper">
          <span class="form-input-icon">🔍</span>
          <input type="search" id="header-search-input" class="form-input" placeholder="ابحث في المنزلة..." autocomplete="off"/>
        </div>
      </div>
      <nav class="header__nav" role="navigation" aria-label="التنقل الرئيسي">
        ${nav.map(n => `<a href="${n.href}" class="header__nav-link${activePage===n.href?' active':''}">${n.label}</a>`).join('')}
      </nav>
      <button class="header__search-btn" id="mobile-search-btn" aria-label="بحث">🔍</button>
      <div class="header__user" id="header-user-section">
        <a href="login.html" class="btn btn-primary btn-sm"><span>🔑</span> دخول</a>
      </div>
    </div>
  </header>`;
}

export function getSharedBottomNavHTML(activePage = '') {
  return `
  <nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="التنقل السريع">
    <a href="index.html"      class="bottom-nav__item${activePage==='index.html'?' active':''}">
      <span class="bottom-nav__icon">🏠</span><span class="bottom-nav__label">الرئيسية</span>
    </a>
    <a href="categories.html" class="bottom-nav__item${activePage==='categories.html'?' active':''}">
      <span class="bottom-nav__icon">📋</span><span class="bottom-nav__label">التصنيفات</span>
    </a>
    <div class="bottom-nav__fab">
      <a href="search.html" class="bottom-nav__fab-btn" aria-label="بحث">🔍</a>
    </div>
    <a href="offers.html"     class="bottom-nav__item${activePage==='offers.html'?' active':''}">
      <span class="bottom-nav__icon">🏷️</span><span class="bottom-nav__label">العروض</span>
    </a>
    <a href="dashboard.html"  class="bottom-nav__item${activePage==='dashboard.html'?' active':''}">
      <span class="bottom-nav__icon">👤</span><span class="bottom-nav__label">حسابي</span>
    </a>
  </nav>`;
}

export function getSharedFooterHTML() {
  return `
  <footer class="footer" id="site-footer" role="contentinfo">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="index.html" class="footer__logo">
            <img src="./icons/icon-72x72.png" alt="شعار المنزلة وناسها" width="40" height="40"/>
            <span class="footer__logo-name">المنزلة وناسها</span>
          </a>
          <p class="footer__description">دليلك الرقمي الشامل في مدينة المنزلة — ابحث عن الأطباء والمحلات والخدمات كلها في مكان واحد.</p>
        </div>
        <div>
          <h3 class="footer__col-title">روابط سريعة</h3>
          <ul class="footer__links">
            <li><a href="index.html"      class="footer__link">الصفحة الرئيسية</a></li>
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
            <li><a href="dashboard.html"  class="footer__link">لوحة التحكم</a></li>
            <li><a href="search.html"     class="footer__link">بحث متقدم</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer__col-title">تواصل معنا</h3>
          <ul class="footer__links">
            <li><a href="#" data-wa-link class="footer__link">💬 واتساب الإدارة</a></li>
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

export function getPwaBannerHTML() {
  return `
  <div class="pwa-banner" id="pwa-banner" role="complementary" hidden>
    <img src="./icons/icon-72x72.png" alt="أيقونة التطبيق" class="pwa-banner__icon" width="52" height="52"/>
    <div class="pwa-banner__content">
      <div class="pwa-banner__title">ثبّت التطبيق على هاتفك</div>
      <div class="pwa-banner__text">المنزلة وناسها — وصول أسرع وتجربة أفضل</div>
    </div>
    <div class="pwa-banner__actions">
      <button class="btn btn-primary btn-sm" id="pwa-install-btn">تثبيت</button>
    </div>
    <button class="pwa-banner__close" id="pwa-banner-close" aria-label="إغلاق">✕</button>
  </div>`;
}
