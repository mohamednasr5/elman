/**
 * page-shell.js — Shared page initialization for all standalone HTML pages
 * Injects header/footer/bottom-nav/PWA banner and sets up common functionality
 */
import { initFirebase } from './firebase.js';
import { initAuth, signOut, waitForAuth, onAuthStateChange, isAdmin } from './auth.js';
import { getSettings } from './db.js';
import { toast } from '../ui/components/Toast.js';
import { bindGlobalVoiceAssistantFab } from '../services/voice.service.js';

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
    <a href="index.html" class="header__logo" aria-label="دليل المنزلة والمطرية الرقمي">
      <img src="./icons/icon-72x72.png" alt="" class="header__logo-icon" width="36" height="36"/>
      <div class="header__logo-text">
        <span class="header__logo-name">دليل المنزلة والمطرية</span>
        <span class="header__logo-tagline">الدليل الرقمي الشامل للمدن والقرى المجاورة</span>
      </div>
    </a>

    <div class="header__search" role="search">
      <div class="form-input-wrapper">
        <span class="form-input-icon">🔍</span>
        <input type="search" id="header-search-input" class="form-input"
               placeholder="ابحث في المنزلة والمطرية والقرى..." autocomplete="off"/>
      </div>
    </div>

    <nav class="header__nav" role="navigation" aria-label="التنقل الرئيسي">
      ${links.map(([href, label]) =>
        `<a href="${href}" class="header__nav-link${href === active ? ' active' : ''}">${label}</a>`
      ).join('')}
    </nav>

      <button class="header__search-btn" id="mobile-search-btn" aria-label="بحث">🔍</button>
      
      <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="تبديل الوضع الليلي والنهاري" title="تبديل الوضع الليلي / الفاتح">
        <span class="theme-icon-light">☀️</span>
        <span class="theme-icon-dark">🌙</span>
      </button>

      <div id="header-user-section">
        <a href="login.html" class="btn btn-primary btn-sm"><span>🔑</span> دخول</a>
      </div>
    </div>
  </div>
</header>`;
}

function _bottomNavHTML(active) {
  if (active === 'admin.html') {
    return `
<nav class="bottom-nav bottom-nav--admin" id="admin-mobile-bottom-nav" role="navigation" aria-label="لوحة الإدارة">
  <button type="button" data-admin-sec="overview" class="bottom-nav__item active">
    <span class="bottom-nav__icon">📊</span>
    <span class="bottom-nav__label">الإحصائيات</span>
  </button>
  <button type="button" data-admin-sec="places" class="bottom-nav__item">
    <span class="bottom-nav__icon">📍</span>
    <span class="bottom-nav__label">الأماكن</span>
  </button>
  <button type="button" data-admin-sec="verification" class="bottom-nav__item">
    <span class="bottom-nav__icon">🛡️</span>
    <span class="bottom-nav__label">التوثيق</span>
  </button>
  <button type="button" data-admin-sec="categories" class="bottom-nav__item">
    <span class="bottom-nav__icon">📁</span>
    <span class="bottom-nav__label">التصنيفات</span>
  </button>
  <button type="button" data-admin-sec="ads" class="bottom-nav__item">
    <span class="bottom-nav__icon">📢</span>
    <span class="bottom-nav__label">الإعلانات</span>
  </button>
  <button type="button" data-admin-sec="settings" class="bottom-nav__item">
    <span class="bottom-nav__icon">⚙️</span>
    <span class="bottom-nav__label">الإعدادات</span>
  </button>
</nav>`;
  }

  if (active === 'dashboard.html') {
    return `
<nav class="bottom-nav bottom-nav--dashboard" id="dash-mobile-bottom-nav" role="navigation" aria-label="لوحة التحكم">
  <button type="button" data-dash-sec="overview" class="bottom-nav__item active">
    <span class="bottom-nav__icon">📊</span>
    <span class="bottom-nav__label">نظرة عامة</span>
  </button>
  <button type="button" data-dash-sec="places" class="bottom-nav__item">
    <span class="bottom-nav__icon">🏪</span>
    <span class="bottom-nav__label">أماكني</span>
  </button>
  <div class="bottom-nav__fab">
    <button type="button" data-dash-sec="add" class="bottom-nav__fab-btn" aria-label="إضافة مكان" title="إضافة مكان جديد">➕</button>
  </div>
  <button type="button" data-dash-sec="offers" class="bottom-nav__item">
    <span class="bottom-nav__icon">🏷️</span>
    <span class="bottom-nav__label">العروض</span>
  </button>
  <button type="button" data-dash-sec="products" class="bottom-nav__item">
    <span class="bottom-nav__icon">📦</span>
    <span class="bottom-nav__label">المنتجات</span>
  </button>
</nav>`;
  }

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
    <button type="button" class="bottom-nav__fab-btn bottom-nav__voice-assistant-fab" id="global-voice-assistant-fab" aria-label="مساعد المنزلة الصوتي الذكي" title="مساعد المنزلة الصوتي الذكي (M)">
      <span class="fab-letter-m">M</span>
      <span class="fab-pulse-ring"></span>
      <span class="fab-pulse-ring ring-2"></span>
      <span class="fab-mic-badge">🎙️</span>
    </button>
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
          <img src="./icons/icon-72x72.png" alt="شعار دليل المنزلة والمطرية الرقمي" width="40" height="40"/>
          <span class="footer__logo-name">دليل المنزلة والمطرية الرقمي</span>
        </a>
        <p class="footer__description">
          دليلك الرقمي الشامل لجميع الأماكن، المحلات، العيادات، الحرفيين والخدمات في المنزلة، المطرية، العصافرة، الجمالية، ميت سلسيل، البصراط، العزيزة، الأحمدية، الروضة، الحوتة، النسايمة، ميت خضير، ميت شريف، وكافة القرى المجاورة بمحافظة الدقهلية.
        </p>
        <div class="footer__apk-download" id="footer-apk-container" style="margin-top:18px">
          <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="apk-pro-download-btn" id="footer-apk-download-btn" title="تحميل تطبيق دليل المنزلة والمطرية للأندرويد APK">
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
      <p class="footer__copyright">© 2026 دليل المنزلة والمطرية الرقمي (المنزلة وناسها). جميع الحقوق محفوظة.</p>
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
  <img src="./icons/icon-72x72.png" alt="" class="pwa-banner__icon" width="48" height="48"/>
  <div class="pwa-banner__content">
    <div class="pwa-banner__title">ثبّت دليل المنزلة والمطرية الرقمي</div>
    <div class="pwa-banner__text">تصفّح أسرع وتجربة أفضل على هاتفك</div>
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

  /* 2. Theme setup (Dark / Light) */
  _setupTheme();

  /* 3. Inject shared layout blocks */
  _inject('header-slot',  _headerHTML(activeFile));
  _inject('footer-slot',  _footerHTML());
  _inject('nav-slot',     _bottomNavHTML(activeFile));
  _inject('pwa-slot',     _pwaBannerHTML());

  /* 4. Check standalone APK/PWA environment to hide APK download button */
  _checkApkPwaEnvironment();

  /* 5. Attach theme toggle listener to header button */
  _bindThemeToggle();

  /* 6. Attach M Voice Assistant FAB listener */
  bindGlobalVoiceAssistantFab();

  /* 7. Scroll shadow on header */
  const hdr = document.getElementById('site-header');
  window.addEventListener('scroll', () =>
    hdr?.classList.toggle('scrolled', scrollY > 8), { passive: true });

  /* 7. Header search */
  document.getElementById('header-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim())
      location.href = `search.html?q=${encodeURIComponent(e.target.value.trim())}`;
  });
  document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
    location.href = 'search.html';
  });

  /* 8. Auth UI (reactive) */
  onAuthStateChange(user => _renderUser(user));

  /* 9. Dynamic settings (WhatsApp link) */
  try {
    const s = await getSettings();
    const waLink = s?.contact?.whatsappLink;
    if (waLink) {
      document.querySelectorAll('[data-wa]').forEach(a => { a.href = waLink; });
    }
  } catch (_) {}

  /* 10. PWA Install banner */
  _setupPwa();

  /* 11. Service Worker */
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js').catch(() => {});

  /* 12. Instant Link Prefetching for 0ms page loads */
  _setupInstantPrefetch();
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
      document.querySelectorAll('#footer-apk-container, .footer__apk-download, .apk-pro-download-btn').forEach(el => {
        el.style.display = 'none';
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

function _setupInstantPrefetch() {
  const prefetched = new Set();
  const prefetch = (href) => {
    if (!href) return;
    try {
      const url = new URL(href, location.href);
      if (url.origin === location.origin && !prefetched.has(url.href)) {
        prefetched.add(url.href);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url.href;
        document.head.appendChild(link);
      }
    } catch (_) {}
  };

  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a[href]');
    if (a) prefetch(a.href);
  }, { passive: true });

  document.addEventListener('touchstart', (e) => {
    const a = e.target.closest('a[href]');
    if (a) prefetch(a.href);
  }, { passive: true });

  // Eager prefetch core pages when browser is idle (0ms navigation everywhere)
  const corePages = ['index.html', 'places.html', 'categories.html', 'offers.html', 'search.html'];
  const idlePrefetch = () => {
    corePages.forEach(p => prefetch(p));
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(idlePrefetch, { timeout: 1500 });
  } else {
    setTimeout(idlePrefetch, 800);
  }
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
    if (!isStandalone && !localStorage.getItem('pwa-dismissed')) {
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
        _showManualInstallInstructions();
      }
      _dismissPwaBanner();
    }
  });
}

function _showManualInstallInstructions() {
  const ua = navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  
  let title = 'تثبيت التطبيق';
  let html = '';

  if (isIos) {
    title = 'تثبيت التطبيق على الآيفون';
    html = `
      <div style="text-align:center;line-height:1.7;padding:10px 0;">
        <p style="margin-bottom:15px;font-size:15px;">لتثبيت التطبيق على جهازك، اتبع الخطوات التالية:</p>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;background:#f8f9fa;padding:12px;border-radius:8px;">
          <span style="font-size:24px;color:var(--primary);">1️⃣</span>
          <span>اضغط على زر <strong>المشاركة (Share)</strong> في شريط المتصفح أسفل الشاشة <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin:0 4px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;background:#f8f9fa;padding:12px;border-radius:8px;">
          <span style="font-size:24px;color:var(--primary);">2️⃣</span>
          <span>اختر <strong>إضافة للشاشة الرئيسية (Add to Home Screen)</strong> <span>➕</span></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:#f8f9fa;padding:12px;border-radius:8px;">
          <span style="font-size:24px;color:var(--primary);">3️⃣</span>
          <span>اضغط على <strong>إضافة (Add)</strong> بالأعلى لتأكيد التثبيت</span>
        </div>
      </div>
    `;
  } else if (isAndroid) {
    title = 'تثبيت التطبيق على الأندرويد';
    html = `
      <div style="text-align:center;line-height:1.7;padding:10px 0;">
        <p style="margin-bottom:15px;font-size:15px;">لتثبيت التطبيق على جهازك، اتبع الخطوات التالية:</p>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;background:#f8f9fa;padding:12px;border-radius:8px;">
          <span style="font-size:24px;color:var(--primary);">1️⃣</span>
          <span>اضغط على زر <strong>القائمة (⋮)</strong> في أعلى يسار متصفح جوجل كروم</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;background:#f8f9fa;padding:12px;border-radius:8px;">
          <span style="font-size:24px;color:var(--primary);">2️⃣</span>
          <span>اختر <strong>تثبيت التطبيق (Install app)</strong> أو إضافة للشاشة الرئيسية</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:#f8f9fa;padding:12px;border-radius:8px;">
          <span style="font-size:24px;color:var(--primary);">3️⃣</span>
          <span>اضغط <strong>تثبيت (Install)</strong> لتأكيد العملية</span>
        </div>
      </div>
    `;
  } else {
    title = 'تثبيت التطبيق على الكمبيوتر';
    html = `
      <div style="text-align:center;line-height:1.7;padding:10px 0;">
        <p style="margin-bottom:15px;font-size:15px;">لتثبيت التطبيق على الكمبيوتر:</p>
        <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;">
          اضغط على أيقونة التثبيت <strong>(⊕ أو شاشة بجوارها سهم)</strong> الموجودة في نهاية <strong>شريط عنوان المتصفح</strong> بالأعلى، ثم اختر تثبيت.
        </div>
      </div>
    `;
  }

  // Import Modal dynamically to avoid circular dependencies if any, though top-level is better, we can just use the DOM
  const m = document.createElement('div');
  m.className = 'modal-backdrop visible';
  m.style.zIndex = '99999';
  m.innerHTML = `
    <div class="modal visible">
      <div class="modal__header">
        <h3 class="modal__title">📱 ${title}</h3>
        <button class="modal__close" onclick="this.closest('.modal-backdrop').remove()">×</button>
      </div>
      <div class="modal__body">
        ${html}
        <div style="margin-top:20px;text-align:center;">
          <button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove()" style="width:100%">حسناً، فهمت</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(m);
}

function _showPwaBanner() {
  const b = document.getElementById('pwa-banner');
  if (b && !localStorage.getItem('pwa-dismissed')) {
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
  localStorage.setItem('pwa-dismissed', '1');
}

function _h(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _a(s){ return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
