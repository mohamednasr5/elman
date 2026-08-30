/**
 * shared-layout.js
 * بناء الـ Header + Footer + Bottom-Nav المشترك بين جميع الصفحات
 * يُستدعى من كل صفحة HTML مستقلة
 */
import { initFirebase } from './firebase.js';
import { initAuth, signInWithGoogle, signOut, getCurrentUser, onAuthStateChange } from './auth.js';
import { getSettings } from './db.js';
import { toast } from '../ui/components/Toast.js';
import { bindGlobalVoiceAssistantFab } from '../services/voice.service.js';

/**
 * @param {string} activeHref - مثال: 'places.html' لتلوين الرابط النشط
 */
export async function initSharedLayout(activeHref = '') {
  initFirebase();
  initAuth();
  _setupTheme();
  _setupHeaderScroll();
  _setupHeaderSearch();
  _setupPwaBanner();
  _setActiveLinks(activeHref);
  _checkApkPwaEnvironment();
  _bindThemeToggle();
  bindGlobalVoiceAssistantFab();

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

function _setupTheme() {
  const savedTheme = localStorage.getItem('elmanzala-theme') || 
                     (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  _applyTheme(savedTheme);
}

function _bindThemeToggle() {
  document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      _applyTheme(nextTheme);
      localStorage.setItem('elmanzala-theme', nextTheme);
      toast.info(nextTheme === 'dark' ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع النهاري ☀️');
    });
  });
}

function _applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (document.body) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'dark' ? '#0F172A' : '#1B4F72');
  }
}

function _checkApkPwaEnvironment() {
  try {
    const isStandalone = (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
      (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) ||
      window.navigator.standalone === true ||
      (document.referrer && document.referrer.includes('android-app://')) ||
      (navigator.userAgent && (navigator.userAgent.includes('wv') || (navigator.userAgent.includes('Android') && navigator.userAgent.includes('Version/')))) ||
      (new URLSearchParams(window.location.search).get('source') === 'apk') ||
      (new URLSearchParams(window.location.search).get('source') === 'pwa')
    );

    if (isStandalone) {
      document.querySelectorAll('#footer-apk-container, .footer__apk-download').forEach(el => {
        el.style.display = 'none';
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
      <button class="header__search-btn" id="mobile-search-btn" aria-label="بحث">🔍</button>

      <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="تبديل الوضع الليلي والنهاري" title="تبديل الوضع الليلي / الفاتح">
        <span class="theme-icon-light">☀️</span>
        <span class="theme-icon-dark">🌙</span>
      </button>

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
      <button type="button" class="bottom-nav__fab-btn bottom-nav__voice-assistant-fab" id="global-voice-assistant-fab" aria-label="مساعد المنزلة الصوتي الذكي" title="مساعد المنزلة الصوتي الذكي (M)">
        <span class="fab-letter-m">M</span>
        <span class="fab-pulse-ring"></span>
        <span class="fab-pulse-ring ring-2"></span>
        <span class="fab-mic-badge">🎙️</span>
      </button>
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
          <div class="footer__apk-download" id="footer-apk-container" style="margin-top:18px">
            <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="apk-pro-download-btn" id="footer-apk-download-btn" title="تحميل تطبيق دليل المنزلة للأندرويد APK">
              <div class="apk-btn-icon-box">
                <svg class="android-svg-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1557-.2698.0632-.6141-.2066-.7698-.2693-.1552-.6135-.0632-.7692.2066l-2.0231 3.5042c-1.4286-.6507-3.0373-1.0135-4.8786-1.0135-1.8412 0-3.45.3628-4.8785 1.0135L5.0995 5.301c-.1557-.2698-.5-.3618-.7692-.2066-.2698.1557-.3623.5-.2066.7698l1.996 3.4572C2.6806 11.2334.3333 15.1165.3333 19.6667h23.3334c0-4.5502-2.3473-8.4333-5.7867-10.3453"/>
                </svg>
              </div>
              <div class="apk-btn-text-box">
                <span class="apk-btn-sub">تطبيق الأندرويد المباشر</span>
                <span class="apk-btn-main">تحميل تطبيق المنزلة APK</span>
              </div>
              <div class="apk-btn-arrow-box">
                <svg class="download-arrow-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
            </a>
          </div>
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
