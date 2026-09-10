/**
 * page-shell.js
 * Injects shared Header, BottomNav, Footer, and PWA Banner.
 * Initializes Firebase, Auth, Theme, Floating Voice Assistant, Realtime Live Sync, and FCM.
 */

import { initAuth, onAuthStateChange, signOut, waitForAuth, isAdmin, getCurrentUser, getClientIp, signInWithGoogle } from './auth.js';
import { toast } from '../ui/components/Toast.js';

/* ─────────────────────────────────────────────────────────
   HTML BUILDERS
───────────────────────────────────────────────────────── */
function _headerHTML(active) {
  const links = [
    ['index.html',      'الرئيسية'],
    ['popular.html',    'الأكثر شعبية 🔥'],
    ['places.html',     'الأماكن'],
    ['categories.html', 'التصنيفات'],
    ['offers.html',     'العروض'],
    ['now.html',        'يحدث الآن 🔥'],
    ['around-me.html',  'بالقرب مني 🧭'],
    ['favorites.html',  '❤️ المفضلة'],
  ];

  return `
<header class="header" id="site-header" role="banner">
  <div class="container header__inner">
    <a href="index.html" class="header__logo" aria-label="دليل المنزلة والمطرية الرقمي">
      <img src="./icons/icon-48x48.png" alt="شعار دليل المنزلة والمطرية الرقمي" width="36" height="36" decoding="async" class="header__logo-img"/>
      <div class="header__logo-text">
        <span class="header__logo-name">دليل المنزلة والمطرية</span>
      </div>
    </a>

    <div class="header-search-expandable" id="header-search-container" role="search">
      <div class="header-search-pill" id="header-search-pill">
        <button type="button" class="header-search-btn-trigger" id="header-search-trigger" aria-label="بحث في الدليل" title="بحث سريع في المنزلة والمطرية">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <input type="search" id="header-search-input" class="header-search-input"
               placeholder="ابحث عن مكان، دكتور، صيدلية، مطعم..."
               autocomplete="off" aria-label="ابحث في دليل المنزلة والمطرية"/>
        <button type="button" class="header-search-clear-btn" id="header-search-clear" aria-label="مسح البحث" title="مسح">✕</button>
      </div>

      <!-- Floating Live Results Dropdown -->
      <div class="header-live-dropdown" id="header-live-dropdown" aria-live="polite">
        <div class="header-live-dropdown__header">
          <span>⚡ نتائج بحث فورية:</span>
          <span class="header-live-dropdown__count" id="header-live-count">0</span>
        </div>
        <div class="header-live-dropdown__list" id="header-live-list"></div>
        <div class="header-live-dropdown__footer">
          <a href="search.html" class="header-live-dropdown__all-btn" id="header-live-all-btn">
            <span>عرض كافة النتائج في صفحة البحث</span>
            <span>←</span>
          </a>
        </div>
      </div>
    </div>

    <nav class="header__nav" aria-label="التنقل الرئيسي">
      ${links.map(([file, label]) =>
        `<a href="${file}" class="header__nav-link${file === active ? ' active' : ''}">${label}</a>`
      ).join('')}
    </nav>
    
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

function _bottomNavHTML(active) {
  if (active === 'admin/index.html') {
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
    <div class="fab-guide-bubble" id="fab-add-place-guide" role="tooltip">
      <span class="fab-guide-sparkle">✨</span>
      <span class="fab-guide-text">إضافة مكان جديد</span>
      <span class="fab-guide-arrow"></span>
    </div>
    <button type="button" data-dash-sec="add" class="bottom-nav__fab-btn fab-btn--pulsing-glow" aria-label="إضافة مكان" title="إضافة مكان جديد">
      <span class="fab-icon-plus">➕</span>
      <span class="fab-sun-rays"></span>
    </button>
  </div>
  <button type="button" data-dash-sec="offers" class="bottom-nav__item">
    <span class="bottom-nav__icon">🏷️</span>
    <span class="bottom-nav__label">العروض</span>
  </button>
  <button type="button" data-dash-sec="more" class="bottom-nav__item" id="dash-bottom-more-btn" aria-label="المزيد">
    <span class="bottom-nav__icon">☰</span>
    <span class="bottom-nav__label">المزيد</span>
  </button>
</nav>`;
  }

  const items = [
    ['index.html',      '🏠', 'الرئيسية'],
    ['categories.html', '📋', 'التصنيفات'],
    ['offers.html',     '🏷️', 'العروض'],
    ['#more',           '☰', 'المزيد'],
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
  <button type="button" class="bottom-nav__item" id="bottom-nav-more-btn" aria-label="المزيد">
    <span class="bottom-nav__icon">${items[3][1]}</span>
    <span class="bottom-nav__label">${items[3][2]}</span>
  </button>
</nav>`;
}

function _footerHTML() {
  return `
<footer class="footer" id="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a href="index.html" class="footer__logo">
          <img src="./icons/icon-48x48.png" alt="شعار دليل المنزلة والمطرية الرقمي" width="40" height="40" loading="lazy" decoding="async"/>
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
          <li><a href="popular.html"    class="footer__link">🔥 الأكثر شعبية</a></li>
          <li><a href="places.html"     class="footer__link">دليل الأماكن</a></li>
          <li><a href="categories.html" class="footer__link">التصنيفات</a></li>
          <li><a href="offers.html"     class="footer__link">العروض اليومية</a></li>
          <li><a href="products.html"   class="footer__link">المنتجات</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">الخدمات والدليل</h3>
        <ul class="footer__links">
          <li><a href="dashboard.html?section=add" class="footer__link">➕ إضافة مكان جديد</a></li>
          <li><a href="dashboard.html"             class="footer__link">📊 لوحة التحكم</a></li>
          <li><a href="search.html"                class="footer__link">🔍 البحث المتقدم</a></li>
          <li><a href="manzala.html"               class="footer__link">🏛️ عن مدينة المنزلة</a></li>
          <li><a href="matariya.html"              class="footer__link">⛵ عن مدينة المطرية</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">تواصل معنا</h3>
        <ul class="footer__links">
          <li><a href="contact.html"  class="footer__link">📧 تواصل معنا</a></li>
          <li><a href="legal.html"    class="footer__link">⚖️ قانوني وإخلاء المسؤولية</a></li>
          <li><a href="privacy.html"  class="footer__link">سياسة الخصوصية</a></li>
          <li><a href="terms.html"    class="footer__link">شروط الاستخدام</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p class="footer__copyright">© جميع الأماكن والبيانات والحقوق محفوظة لدليل المنزلة والمطرية الرقمي (${new Date().getFullYear()}).</p>
      <div class="footer__bottom-links">
        <a href="legal.html"   class="footer__bottom-link">قانوني</a>
        <a href="privacy.html" class="footer__bottom-link">الخصوصية</a>
        <a href="terms.html"   class="footer__bottom-link">الشروط</a>
        <a href="contact.html" class="footer__bottom-link">تواصل</a>
      </div>
    </div>
  </div>

  <!-- Desktop Floating Voice FAB (Visible on Desktop >= 769px) -->
  <button type="button" class="desktop-voice-fab" id="desktop-voice-fab" aria-label="مساعد المنزلة والمطرية الصوتي الذكي" title="البحث الصوتي الذكي (M)" data-voice-trigger="true">
    <span class="desktop-voice-fab__icon">🎙️</span>
    <span class="desktop-voice-fab__pulse"></span>
  </button>

  <!-- Scroll to Top Floating Button -->
  <button type="button" class="scroll-to-top-btn" id="scroll-to-top-btn" aria-label="الصعود لأعلى الصفحة" title="العودة لأعلى الصفحة">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  </button>
</footer>`;
}

function _pwaBannerHTML() {
  return `
<div class="pwa-banner" id="pwa-banner" hidden role="dialog" aria-label="تثبيت تطبيق المنزلة والمطرية الرقمي">
  <div class="pwa-banner__rect">
    <div class="pwa-banner__lead">
      <img src="./icons/icon-96x96.png" alt="دليل المنزلة والمطرية" class="pwa-banner__rect-icon" width="42" height="42" loading="eager" decoding="async" />
      <div class="pwa-banner__rect-text">
        <strong class="pwa-banner__rect-title">ثبت تطبيق المنزلة والمطرية الرقمي</strong>
        <span class="pwa-banner__rect-desc">وخليك دايماً متابع</span>
      </div>
    </div>
    <div class="pwa-banner__rect-actions">
      <button type="button" class="pwa-banner__rect-install" id="pwa-install-btn">تثبيت</button>
      <button type="button" class="pwa-banner__rect-close" id="pwa-banner-close" aria-label="إغلاق التنبيه" title="إغلاق">✕</button>
    </div>
  </div>
</div>`;
}

/* ─────────────────────────────────────────────────────────
   MAIN INIT — called from every page
───────────────────────────────────────────────────────── */
export async function initPage(activeFile = '') {
  /* 1. Render the shared shell immediately. Auth/network checks must never block first paint. */
  _setupTheme();

  /* 2. Inject shared layout blocks */
  _inject('header-slot',  _headerHTML(activeFile));
  const isHomePage = activeFile === 'index.html' || activeFile === 'home' || (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/')));

  if (!isHomePage) {
    let banner = document.getElementById('wide-ads-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'wide-ads-banner';
      banner.className = 'container wide-ads-banner-page-top';
      banner.style.margin = '14px auto';

      const header = document.getElementById('site-header');
      const pageMain = document.getElementById('page-container') || document.querySelector('main') || document.querySelector('#admin-container') || document.querySelector('.admin-layout') || document.querySelector('#app') || document.body;

      if (header && header.nextSibling) {
        header.parentNode.insertBefore(banner, header.nextSibling);
      } else if (pageMain && pageMain.firstChild) {
        pageMain.insertBefore(banner, pageMain.firstChild);
      } else if (pageMain) {
        pageMain.appendChild(banner);
      } else {
        document.body.appendChild(banner);
      }
    }
    if (banner) {
      setTimeout(() => {
        import('../ui/components/WideAdsBanner.js')
          .then(({ mountWideAdsBanner }) => mountWideAdsBanner(banner))
          .catch(() => {});
      }, 50);
    }
  } else {
    // For homepage: home.js handles placement right after "محتاج إيه دلوقتي؟"
    const pollHomeBanner = (attempts = 0) => {
      const banner = document.getElementById('wide-ads-banner');
      if (banner && !banner.dataset.wideAdsMounted) {
        import('../ui/components/WideAdsBanner.js')
          .then(({ mountWideAdsBanner }) => mountWideAdsBanner(banner))
          .catch(() => {});
      } else if (!banner && attempts < 25) {
        setTimeout(() => pollHomeBanner(attempts + 1), 100);
      }
    };
    pollHomeBanner();
  }
  _inject('footer-slot',  _footerHTML());
  _inject('nav-slot',     _bottomNavHTML(activeFile));
  _inject('pwa-slot',     _pwaBannerHTML());

  /* 4. Check standalone APK/PWA environment to hide APK download button */
  _checkApkPwaEnvironment();

  /* 4. Attach theme toggle listener to header button */
  _bindThemeToggle();

  /* 5. Attach M Voice Assistant FAB listener */
try {
  import('../services/voice.service.js')
    .then(({ bindGlobalVoiceAssistantFab }) => bindGlobalVoiceAssistantFab())
    .catch(err => console.warn('[initPage] voice FAB init failed:', err));
} catch (err) { console.warn('[initPage] voice FAB import failed:', err); }

  /* 6. Scroll shadow on header & Scroll to top floating button */
  const hdr = document.getElementById('site-header');
  const scrollBtn = document.getElementById('scroll-to-top-btn');

  window.addEventListener('scroll', () => {
    const y = window.scrollY || window.pageYOffset || 0;
    hdr?.classList.toggle('scrolled', y > 8);
    scrollBtn?.classList.toggle('visible', y > 300);
  }, { passive: true });

  scrollBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* 7. Header Luxury Expandable Search & Live Results Dropdown */
try { _setupHeaderSearch(); } catch (err) { console.warn('[initPage] header search init failed:', err); }

  /* 7.5 Mobile More Menu / Dashboard Drawer trigger from Bottom Nav */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#bottom-nav-more-btn') || e.target.closest('#dash-bottom-more-btn')) {
      e.preventDefault();
      openDashboardMoreModal();
    }
  });

  /* 8. Non-critical account, settings and notification work runs after first paint. */
  const runDeferred = (fn) => {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 0);
  };
  runDeferred(async () => {
    try {
      const { ensureFirebaseReady } = await import('./firebase.js');
      const firebaseReady = await ensureFirebaseReady(2500);
      if (firebaseReady?.auth) initAuth();
    } catch (_) {}
    try { await _enforceBanGuard(); } catch (_) {}
    try {
      const [{ initLiveNotificationSubscriber }, { initFcmMessaging }] = await Promise.all([
        import('../services/notification.service.js'),
        import('../services/fcm.service.js')
      ]);
      onAuthStateChange(user => {
        _renderUser(user);
        initLiveNotificationSubscriber(user?.uid);
        initFcmMessaging(user);
      });
    } catch (_) {}
    try {
      const { getSettings } = await import('./db.js');
      const s = await getSettings();
      const waLink = s?.contact?.whatsappLink;
      if (waLink) document.querySelectorAll('[data-wa]').forEach(a => { a.href = waLink; });
    } catch (_) {}
  });

  /* 9. PWA Install banner */
try { _setupPwa(); } catch (err) { console.warn('[initPage] PWA setup failed:', err); }

  /* 10. Service Worker registration is non-blocking. FCM starts only after Auth is ready. */
  if ('serviceWorker' in navigator) {
    runDeferred(() => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  // Automatically purge legacy stale data caches (Keep only Auth & Theme)
  try {
    const staleKeys = [
      'manzala_fast_places_cache',
      'manzala_live_news_store_v2',
      'manzala_global_broadcast_notifs_cache'
    ];
    staleKeys.forEach(k => localStorage.removeItem(k));
  } catch (_) {}

  /* 11. Non-critical enhancement work */
  runDeferred(() => {
    import('../services/realtime-sync.service.js')
      .then(({ initRealtimePwaSyncBus }) => initRealtimePwaSyncBus())
      .catch(() => {});
    import('../utils/mobile-tooltip.js')
      .then(({ initUniversalMobileTouchTooltips }) => initUniversalMobileTouchTooltips())
      .catch(() => {});
    try { _setupInstantPrefetch(); } catch (_) {}
    try { _setupContentProtection(); } catch (_) {}
  });
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

  const corePages = ['index.html', 'popular.html', 'places.html', 'categories.html', 'offers.html', 'search.html'];
  const idlePrefetch = () => {
    corePages.forEach(p => prefetch(p));
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(idlePrefetch, { timeout: 1500 });
  } else {
    setTimeout(idlePrefetch, 800);
  }
}

export { waitForAuth, isAdmin };

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
      <div style="display:flex;align-items:center;gap:10px">
        <a href="dashboard.html?section=notifications" class="header-notif-btn" title="الإشعارات والزيارات" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);color:var(--text-primary);text-decoration:none;font-size:16px;transition:all 0.2s">
          <span>🔔</span>
          <span id="header-notifs-badge" class="header-notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:9999px;border:1.5px solid #fff;min-width:16px;text-align:center">0</span>
        </a>

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
            <a href="dashboard.html"                          class="header__dropdown-item" role="menuitem">🏠 لوحتي</a>
            <a href="dashboard.html?section=notifications"    class="header__dropdown-item" role="menuitem">🔔 الإشعارات والزيارات</a>
            <a href="dashboard.html?section=add"              class="header__dropdown-item" role="menuitem">➕ إضافة مكان</a>
            ${isAdmin(user)
              ? '<a href="admin.html" class="header__dropdown-item" style="color:var(--secondary,#F5A623);font-weight:bold" role="menuitem">⚙️ لوحة الإدارة</a>'
              : ''}
            <a href="dashboard.html?section=loyalty"          class="header__dropdown-item" role="menuitem">🎁 نادي الولاء والنقاط</a>
            <hr style="margin:4px 0;border:none;border-top:1px solid var(--border)"/>
            <button class="header__dropdown-item" id="logout-btn" role="menuitem" style="color:var(--danger)">🚪 خروج</button>
          </div>
        </div>
      </div>`;

    const btn = document.getElementById('usr-btn');
    const dd  = document.getElementById('usr-dd');
    if (btn && dd) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.innerWidth < 769) {
          openDashboardMoreModal(user);
          return;
        }
        const isOpen = dd.classList.contains('open');
        dd.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#usr-btn') && !e.target.closest('#usr-dd')) {
          dd.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      location.reload();
    });
  } else {
    wrap.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm"><span>🔑</span> دخول</a>`;
  }
}

/**
 * Mobile More Menu & Dashboard Bottom Sheet Drawer
 */
export async function openDashboardMoreModal(user = null) {
  const currentUser = user || getCurrentUser();
  const isLoggedIn = Boolean(currentUser && (currentUser.uid || currentUser.id));
  const isUserAdmin = isLoggedIn && isAdmin(currentUser);
  const userName = isLoggedIn ? (currentUser.name || currentUser.displayName || 'صاحب النشاط') : 'زائر كريم';
  const userPhoto = isLoggedIn ? (currentUser.photoURL || './icons/icon-72x72.png') : './icons/icon-72x72.png';
  const isDashboardPage = typeof window !== 'undefined' && (window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('/dashboard.html'));

  const content = isLoggedIn ? `
    <div class="more-menu-container" style="direction:rtl;text-align:right">
      <!-- User Info Card -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;background:var(--surface-2,#F8FAFC);border-radius:14px;margin-bottom:12px;border:1px solid var(--border,#E2E8F0)">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${_a(userPhoto)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--primary,#1B4F72)" alt="${_h(userName)}" onerror="this.src='./icons/icon-72x72.png'"/>
          <div>
            <div style="font-weight:800;font-size:0.98rem;color:var(--text-primary,#0F172A)">${_h(userName)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted,#64748B)">${isUserAdmin ? 'مدير المنصة ⭐' : 'صاحب حساب تجاري'}</div>
          </div>
        </div>
      </div>

      <!-- Golden Verification Card -->
      <a href="contact.html?type=verification" class="more-menu-highlight-card" id="more-modal-verify-card">
        <div style="font-size:26px;line-height:1;background:rgba(245,166,35,0.22);padding:8px;border-radius:10px;flex-shrink:0">🛡️</div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:0.95rem;color:#92400E;display:flex;align-items:center;justify-content:space-between">
            <span>وثّق ملفك التجاري</span>
            <span style="font-size:11px;background:#d97706;color:#fff;padding:2px 7px;border-radius:6px;font-weight:700">شارة التوثيق</span>
          </div>
          <div style="font-size:0.78rem;color:#78350F;margin-top:2px">احصل على الشارة الزرقاء 🛡️ وأولوية الظهور في نتائج البحث</div>
        </div>
      </a>

      <!-- Dashboard Sections Grid -->
      <div style="font-weight:800;font-size:0.88rem;color:var(--text-muted,#64748B);margin-bottom:8px">أقسام لوحة التحكم</div>
      <div class="more-menu-grid">
        <a href="dashboard.html?section=overview" class="more-menu-tile" data-dash-nav="overview">
          <span class="tile-icon">📊</span>
          <span class="tile-title">نظرة عامة</span>
        </a>
        <a href="dashboard.html?section=places" class="more-menu-tile" data-dash-nav="places">
          <span class="tile-icon">🏪</span>
          <span class="tile-title">أماكني</span>
        </a>
        <a href="dashboard.html?section=add" class="more-menu-tile" data-dash-nav="add" style="background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.3);color:#059669">
          <span class="tile-icon">➕</span>
          <span class="tile-title">إضافة مكان</span>
        </a>
        <a href="dashboard.html?section=offers" class="more-menu-tile" data-dash-nav="offers">
          <span class="tile-icon">🏷️</span>
          <span class="tile-title">إدارة العروض</span>
        </a>
        <a href="dashboard.html?section=products" class="more-menu-tile" data-dash-nav="products">
          <span class="tile-icon">📦</span>
          <span class="tile-title">المنتجات</span>
        </a>
        <a href="dashboard.html?section=notifications" class="more-menu-tile" data-dash-nav="notifications">
          <span class="tile-icon">🔔</span>
          <span class="tile-title">الإشعارات</span>
        </a>
        <a href="dashboard.html?section=following" class="more-menu-tile" data-dash-nav="following">
          <span class="tile-icon">⭐</span>
          <span class="tile-title">متابعاتي</span>
        </a>
        <a href="dashboard.html?section=loyalty" class="more-menu-tile" data-dash-nav="loyalty">
          <span class="tile-icon">🎁</span>
          <span class="tile-title">نادي الولاء</span>
        </a>
        <a href="around-me.html" class="more-menu-tile">
          <span class="tile-icon">🧭</span>
          <span class="tile-title">بالقرب مني</span>
        </a>
        <a href="popular.html" class="more-menu-tile">
          <span class="tile-icon">🔥</span>
          <span class="tile-title">الأكثر شعبية</span>
        </a>
        <a href="favorites.html" class="more-menu-tile">
          <span class="tile-icon">❤️</span>
          <span class="tile-title">المفضلة</span>
        </a>
        ${isUserAdmin ? `
          <a href="admin.html" class="more-menu-tile" style="grid-column:1 / -1;background:rgba(27,79,114,0.08);border-color:rgba(27,79,114,0.3);color:var(--primary)">
            <span class="tile-icon">⚙️</span>
            <span class="tile-title">لوحة تحكم الإدارة الشاملة</span>
          </a>
        ` : ''}
      </div>

      <!-- Quick Services -->
      <div style="font-weight:800;font-size:0.88rem;color:var(--text-muted,#64748B);margin-bottom:6px;margin-top:4px">روابط سريعة</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <a href="contact.html" class="more-menu-row">
          <span style="font-size:18px">💬</span>
          <span>تواصل مع الإدارة والدعم الفني</span>
        </a>
        <a href="quran.html" class="more-menu-row">
          <span style="font-size:18px">📖</span>
          <span>القرآن الكريم والأذكار</span>
        </a>
        <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="more-menu-row">
          <span style="font-size:18px">📥</span>
          <span>تحميل تطبيق الأندرويد APK</span>
        </a>
      </div>

      <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border,#E2E8F0)">
        <button type="button" class="btn btn-outline btn-block" id="more-modal-logout-btn" style="color:var(--danger,#EF4444);border-color:rgba(239,68,68,0.3);font-weight:700">
          <span>🚪</span> تسجيل الخروج
        </button>
      </div>
    </div>
  ` : `
    <div class="more-menu-container" style="direction:rtl;text-align:right">
      <!-- Guest User Header Card -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--surface-2,#F8FAFC);border-radius:14px;margin-bottom:12px;border:1px solid var(--border,#E2E8F0)">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:22px;border:2px solid var(--primary,#1B4F72);box-shadow:0 3px 10px rgba(0,0,0,0.1);flex-shrink:0">
            👤
          </div>
          <div>
            <div style="font-weight:900;font-size:1.02rem;color:var(--text-primary,#0F172A)">زائر كريم</div>
            <div style="font-size:0.8rem;color:var(--text-muted,#64748B)">دليل المنزلة والمطرية</div>
          </div>
        </div>
        <a href="login.html" class="btn btn-primary btn-sm" style="font-weight:800;padding:7px 18px;border-radius:10px;display:inline-flex;align-items:center;gap:6px">
          <span>🔑</span> دخول
        </a>
      </div>

      <!-- Google Sign-in Interactive Promo Card -->
      <div class="guest-login-promo-card" style="background:linear-gradient(145deg, rgba(27,79,114,0.05) 0%, rgba(245,158,11,0.12) 100%);border:1.5px solid rgba(245,158,11,0.45);border-radius:16px;padding:18px 14px;margin-bottom:14px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.03)">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.08);margin-bottom:10px">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        </div>

        <div style="font-weight:900;font-size:1.02rem;color:var(--text-primary,#0F172A);margin-bottom:6px;line-height:1.4">
          ادخل بحساب جوجل بضغطة زر
        </div>
        <div style="font-size:0.86rem;color:var(--text-muted,#475569);margin-bottom:14px;line-height:1.5">
          ينتظرك العديد من المميزات والعروض
        </div>

        <button type="button" class="btn btn-block" id="more-modal-google-login-btn" style="background:#ffffff;color:#0F172A;border:1.5px solid #CBD5E1;font-weight:800;font-size:0.92rem;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 16px;border-radius:12px;box-shadow:0 3px 10px rgba(0,0,0,0.07);cursor:pointer;width:100%;transition:transform 0.15s ease">
          <svg width="20" height="20" viewBox="0 0 24 24" style="flex-shrink:0">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>تسجيل الدخول السريع بحساب Google</span>
        </button>

        <div style="margin-top:14px;padding-top:10px;border-top:1px dashed rgba(245,158,11,0.3);display:flex;flex-direction:column;gap:3px">
          <div style="font-weight:900;font-size:0.92rem;color:var(--primary,#1B4F72)">دليل المنزلة والمطرية الرقمي</div>
          <div style="font-size:0.8rem;color:#D97706;font-weight:700">الدليل الأول فى المنطقة ⭐</div>
        </div>
      </div>

      <!-- Quick Links for Guests -->
      <div style="font-weight:800;font-size:0.88rem;color:var(--text-muted,#64748B);margin-bottom:8px">روابط تهمك</div>
      <div class="more-menu-grid" style="margin-bottom:10px">
        <a href="around-me.html" class="more-menu-tile">
          <span class="tile-icon">🧭</span>
          <span class="tile-title">بالقرب مني</span>
        </a>
        <a href="popular.html" class="more-menu-tile">
          <span class="tile-icon">🔥</span>
          <span class="tile-title">الأكثر شعبية</span>
        </a>
        <a href="favorites.html" class="more-menu-tile">
          <span class="tile-icon">❤️</span>
          <span class="tile-title">المفضلة</span>
        </a>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px">
        <a href="contact.html" class="more-menu-row">
          <span style="font-size:18px">💬</span>
          <span>تواصل مع الإدارة والدعم الفني</span>
        </a>
        <a href="quran.html" class="more-menu-row">
          <span style="font-size:18px">📖</span>
          <span>القرآن الكريم والأذكار</span>
        </a>
        <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="more-menu-row">
          <span style="font-size:18px">📥</span>
          <span>تحميل تطبيق الأندرويد APK</span>
        </a>
      </div>
    </div>
  `;

  const { showModal } = await import('../ui/components/Modal.js');
  const modal = showModal({
    title: isLoggedIn ? '☰ القائمة ولوحة التحكم' : '☰ دليل المنزلة والمطرية',
    content,
    sheet: true,
    closeable: true,
    size: 'sm'
  });

  const modalEl = document.querySelector('.modal');
  if (modalEl) {
    modalEl.querySelectorAll('[data-dash-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        const sec = el.getAttribute('data-dash-nav');
        if (isDashboardPage && typeof window.switchDashboardSection === 'function') {
          e.preventDefault();
          modal.close();
          window.switchDashboardSection(sec, null, true);
        } else {
          modal.close();
        }
      });
    });

    document.getElementById('more-modal-logout-btn')?.addEventListener('click', async () => {
      modal.close();
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      window.location.reload();
    });

    document.getElementById('more-modal-google-login-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const btn = e.currentTarget;
      const originalHTML = btn.innerHTML;
      try {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<span>جاري فتح تسجيل الدخول...</span>';
        const signedUser = await signInWithGoogle();
        if (signedUser) {
          modal.close();
          toast.success(`أهلاً بك ${signedUser.displayName || signedUser.name || ''} 👋`);
          window.location.reload();
        } else {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = originalHTML;
        }
      } catch (err) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = originalHTML;
        console.error('[MoreModal GoogleSignIn] error:', err);
        if (err?.code !== 'auth/popup-closed-by-user') {
          toast.error('تعذر تسجيل الدخول: ' + (err?.message || 'يرجى المحاولة مرة أخرى'));
        }
      }
    });
  }
  return modal;
}

if (typeof window !== 'undefined') {
  window.openDashboardMoreModal = openDashboardMoreModal;
}

let _dp = (typeof window !== 'undefined' && window.__deferredPwaPrompt) ? window.__deferredPwaPrompt : null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _dp = e;
    window.__deferredPwaPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    try { localStorage.setItem('pwa-installed', 'true'); } catch (_) {}
    _dp = null;
    if (typeof window !== 'undefined') window.__deferredPwaPrompt = null;
    _dismissPwaBanner();
  });
}

function _isAppInstalled() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://') ||
    localStorage.getItem('pwa-installed') === 'true'
  );
}

function _hasDismissedRecently() {
  try {
    const val = localStorage.getItem('pwa-dismissed');
    if (!val) return false;
    const ts = parseInt(val, 10);
    if (isNaN(ts)) return false;
    // Cooldown: 2 hours so testing and repeated visits can install
    return (Date.now() - ts) < (2 * 60 * 60 * 1000);
  } catch (_) {
    return false;
  }
}

function _canShowPwaBanner() {
  if (_isAppInstalled()) return false;
  if (_hasDismissedRecently()) return false;
  try {
    // Prevent showing on every refresh in the same session
    if (sessionStorage.getItem('pwa_session_shown') === 'true') return false;
  } catch (_) {}
  return true;
}

function _setupPwa() {
  const isFirstTimeVoice = !localStorage.getItem('manzala_voice_guide_seen');

  // Voice search guide check: show once for first-time users after 2 seconds
  if (isFirstTimeVoice) {
    setTimeout(() => {
      _showVoiceSearchGuideOnce();
    }, 2000);
  }

  const pwaDelay = isFirstTimeVoice ? 12000 : 5000;

  const triggerShowBanner = () => {
    const promptEvent = _dp || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);
    if (!promptEvent) return; // Strict: ONLY show banner if native install prompt is ready!
    if (_canShowPwaBanner() && !document.getElementById('voice-guide-callout')) {
      _showPwaBanner();
    }
  };

  if (_canShowPwaBanner()) {
    if (_dp || (typeof window !== 'undefined' && window.__deferredPwaPrompt)) {
      setTimeout(triggerShowBanner, pwaDelay);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', () => {
        setTimeout(triggerShowBanner, pwaDelay);
      }, { once: true });
    }
  }

  document.addEventListener('click', e => {
    if (e.target.closest('#pwa-banner-close') || e.target.closest('#pwa-banner-later')) {
      e.preventDefault();
      _dismissPwaBanner();
      return;
    }
    if (e.target.closest('#pwa-install-btn')) {
      e.preventDefault();
      _triggerInstall();
      return;
    }
    if (e.target.closest('#desktop-voice-fab')) {
      e.preventDefault();
      try {
        import('../services/voice.service.js')
          .then(({ openManzalaVoiceAssistantModal }) => openManzalaVoiceAssistantModal())
          .catch(() => {});
      } catch (_) {}
      return;
    }
  });
}

function _showPwaBanner() {
  if (!_canShowPwaBanner()) return;
  const b = document.getElementById('pwa-banner');
  if (b) {
    try {
      sessionStorage.setItem('pwa_session_shown', 'true');
    } catch (_) {}
    b.hidden = false;
    b.style.display = 'block';
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
      b.hidden = true;
      b.style.display = 'none';
    }, 350);
  }
  try {
    localStorage.setItem('pwa-dismissed', Date.now().toString());
    sessionStorage.setItem('pwa_session_shown', 'true');
  } catch (_) {}

  // Trigger one-time animated voice search discovery guide
  _showVoiceSearchGuideOnce();
}

async function _triggerInstall() {
  const promptEvent = _dp || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);
  if (promptEvent) {
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        try { localStorage.setItem('pwa-installed', 'true'); } catch (_) {}
        _dismissPwaBanner();
        toast.success('تم تثبيت التطبيق بنجاح! ستجده في شاشة تطبيقات هاتفك 🎉');
        setTimeout(() => _showVoiceSearchGuideOnce(), 1200);
      } else {
        _dismissPwaBanner();
      }
    } catch (_) {
      _dismissPwaBanner();
    } finally {
      _dp = null;
      if (typeof window !== 'undefined') window.__deferredPwaPrompt = null;
    }
  } else {
    // Completely silent: zero toasts, zero hints, zero tooltips
    _dismissPwaBanner();
  }
}

/**
 * One-Time Clean Voice Search Callout Guide (كلمة مع سهم أنيقة)
 * Displays a sleek red callout pill "ممكن تبحث بالصوت من هنا 🎙️" with an animated arrow
 * pointing directly at the center 'M' button on mobile, or the desktop mic on desktop.
 * Shows once and only once for the user.
 */
function _showVoiceSearchGuideOnce() {
  if (typeof document === 'undefined') return;
  try {
    if (localStorage.getItem('manzala_voice_guide_seen') === 'true') return;
    localStorage.setItem('manzala_voice_guide_seen', 'true');
  } catch (_) {
    return;
  }

  setTimeout(() => {
    const isDesktop = window.innerWidth >= 769;
    let targetBtn = null;
    if (isDesktop) {
      targetBtn = document.getElementById('desktop-voice-fab') ||
                  document.getElementById('global-voice-assistant-fab');
    } else {
      targetBtn = document.getElementById('global-voice-assistant-fab') ||
                  document.querySelector('.bottom-nav__fab-btn') ||
                  document.querySelector('.bottom-nav__fab');
    }

    if (!targetBtn) return;

    // Remove any previous instance
    document.getElementById('voice-guide-callout')?.remove();

    // Ensure PWA banner does not overlap the voice guide
    const pwaBanner = document.getElementById('pwa-banner');
    if (pwaBanner && pwaBanner.classList.contains('visible')) {
      pwaBanner.classList.remove('visible');
      pwaBanner.style.display = 'none';
      pwaBanner.hidden = true;
    }

    const callout = document.createElement('div');
    callout.className = 'voice-guide-callout';
    callout.id = 'voice-guide-callout';
    callout.setAttribute('role', 'tooltip');

    callout.innerHTML = `
      <div class="voice-guide-callout__bubble" id="voice-guide-bubble">
        <button type="button" class="voice-guide-callout__close" id="voice-guide-callout-close" aria-label="إغلاق التلميح" title="إغلاق">✕</button>
        <div class="voice-guide-callout__body">
          <span class="voice-guide-callout__text">ممكن تبحث بالصوت من هنا</span>
          <span class="voice-guide-callout__mic">🎙️</span>
        </div>
      </div>
      <div class="voice-guide-callout__arrow-wrap">
        <svg class="voice-guide-callout__arrow" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="3" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    `;

    document.body.appendChild(callout);
    targetBtn.classList.add('voice-mic-highlighted');

    const closeGuide = () => {
      callout.classList.add('fade-out');
      targetBtn?.classList.remove('voice-mic-highlighted');
      setTimeout(() => callout.remove(), 350);
    };

    callout.querySelector('#voice-guide-callout-close')?.addEventListener('click', e => {
      e.stopPropagation();
      closeGuide();
    });

    callout.querySelector('#voice-guide-bubble')?.addEventListener('click', e => {
      if (e.target.closest('#voice-guide-callout-close')) return;
      closeGuide();
      try {
        import('../services/voice.service.js')
          .then(({ openManzalaVoiceAssistantModal }) => openManzalaVoiceAssistantModal())
          .catch(() => {});
      } catch (_) {}
    });

    targetBtn.addEventListener('click', closeGuide, { once: true });

    // Dismiss on click outside
    const outsideClickListener = e => {
      if (!callout.contains(e.target) && !targetBtn.contains(e.target)) {
        closeGuide();
        document.removeEventListener('click', outsideClickListener);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', outsideClickListener);
    }, 400);

    // Auto dismiss after 9 seconds if not interacted with
    setTimeout(() => {
      if (document.body.contains(callout)) {
        closeGuide();
        document.removeEventListener('click', outsideClickListener);
      }
    }, 9000);
  }, 500);
}

function _h(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _a(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * Universal Content Protection & Right-Click Guard & Decorative Console Warning
 */
function _setupContentProtection() {
  if (typeof window === 'undefined') return;

  const currentYear = new Date().getFullYear();

  // 1. Decorative Console Warning Banner
  const printConsoleWarning = () => {
    try {
      console.log(
        `%c© جميع الأماكن والبيانات والحقوق محفوظة لدليل المنزلة والمطرية الرقمي (${currentYear}).`,
        'background: linear-gradient(135deg, #0B2239, #153A5C); color: #F5A623; font-size: 16px; font-weight: 800; padding: 12px 20px; border-radius: 8px; border: 2px solid #F5A623; font-family: Cairo, Tahoma, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.5);'
      );
      console.log(
        `%c⚠️ تحذير قانوني رسمي:\nكافة المحتويات والبيانات وقواعد البيانات المنشورة مسجلة ومحمية رقمياً، ولا يمكن نقلها أو نسخها حتى لا يتم مساءلتك قانونياً أمام المحاكم بالمنزلة والمطرية.`,
        'color: #EF4444; font-size: 13px; font-weight: 700; line-height: 1.8; font-family: Cairo, Tahoma, sans-serif;'
      );
      console.log(
        `%cرابط البوابة الرسمية: %chttps://dalilmanzala.com/`,
        'color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;',
        'color: #0284C7; font-size: 11px; font-weight: 700; text-decoration: underline;'
      );
      console.log(
        `%c💬 للاستفسارات والاقتراحات: %chttps://wa.me/wasendernew`,
        'color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;',
        'color: #10B981; font-size: 11px; font-weight: 700; text-decoration: underline;'
      );
    } catch (_) {}
  };

  printConsoleWarning();

  // Re-print when developer tools are opened / resized
  let lastWidth = window.outerWidth - window.innerWidth;
  let lastHeight = window.outerHeight - window.innerHeight;
  window.addEventListener('resize', () => {
    const diffW = window.outerWidth - window.innerWidth;
    const diffH = window.outerHeight - window.innerHeight;
    if (diffW !== lastWidth || diffH !== lastHeight) {
      lastWidth = diffW;
      lastHeight = diffH;
      printConsoleWarning();
    }
  }, { passive: true });

  // 2. Disable Context Menu (Right Click) across the site, except on input/textarea
  document.addEventListener('contextmenu', (e) => {
    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
      return; // Allow editing fields
    }
    e.preventDefault();
    if (typeof toast !== 'undefined' && toast.info) {
      toast.info('🛡️ المحتوى والبيانات محمية قانونياً — غير مصرح بنسخ أو نقل محتوى الدليل.');
    }
  });

  // 3. Prevent Copy & Cut actions on protected text
  document.addEventListener('copy', (e) => {
    const targetTag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
      return;
    }
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', `© جميع الأماكن والبيانات والحقوق محفوظة لدليل المنزلة والمطرية الرقمي (${currentYear}). https://dalilmanzala.com/`);
    }
    if (typeof toast !== 'undefined' && toast.warning) {
      toast.warning('⚠️ تم حفظ حقوق الملكية: لا يجوز نسخ أو اقتباس بيانات الدليل.');
    }
  });

  document.addEventListener('cut', (e) => {
    const targetTag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
      return;
    }
    e.preventDefault();
  });

  // 4. Block common keyboard shortcuts (Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+P, F12)
  document.addEventListener('keydown', (e) => {
    const targetTag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
    const isInput = targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable;

    // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+Shift+C (DevTools inspect)
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))) {
      printConsoleWarning();
    }

    // Ctrl+U (View Source), Ctrl+S (Save Page), Ctrl+P (Print)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      if (typeof toast !== 'undefined' && toast.warning) {
        toast.warning('🔒 مصدر وبيانات الدليل محمية بموجب قانون الملكية الفكرية.');
      }
    }

    // Ctrl+C on non-input elements
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && !isInput) {
      const selection = window.getSelection ? window.getSelection().toString() : '';
      if (selection.length > 0) {
        e.preventDefault();
        if (typeof toast !== 'undefined' && toast.warning) {
          toast.warning('🛡️ المحتوى محمي: لا يمكن النسخ لمنع التعدي القانوني.');
        }
      }
    }
  });
}

/**
 * Global IP & Account Ban Enforcement
 * If user IP or user account is banned/suspended, blocks access completely.
 */
async function _enforceBanGuard() {
  try {
    const user = getCurrentUser();
    // Superadmins and admins are never locked out
    if (user && isAdmin(user)) return;

    // Check account status if logged in
    if (user && user.status === 'suspended') {
      _showBannedScreen('تم إيقاف حسابك من قبل إدارة المنصة لمخالفة الشروط.');
      return;
    }

    // Check IP
    const clientIp = await getClientIp();
    if (clientIp) {
      const { isIpBanned } = await import('./db.js');
      const banInfo = await isIpBanned(clientIp);
      if (banInfo) {
        const reason = banInfo.reason || 'مخالفة معايير وسياسات المنصة';
        const untilDate = banInfo.bannedUntil ? new Date(banInfo.bannedUntil).toLocaleDateString('ar-EG') : null;
        const msg = banInfo.isPermanent 
          ? `تم حظر عنوان جهازك (${clientIp}) نهائياً من دخول المنصة بسبب: ${reason}`
          : `تم حظر عنوان جهازك (${clientIp}) حتى ${untilDate} بسبب: ${reason}`;
        _showBannedScreen(msg);
      }
    }
  } catch (err) {
    console.debug('[_enforceBanGuard] notice:', err);
  }
}

function _showBannedScreen(reasonMessage) {
  // Wipe body and show locked screen
  document.body.innerHTML = `
    <div style="min-height:100vh;background:#06101E;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif;direction:rtl;text-align:center">
      <div style="max-width:540px;background:#0F273D;border:1px solid rgba(239,68,68,0.4);border-radius:20px;padding:36px 24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
        <div style="font-size:64px;margin-bottom:16px">🚫</div>
        <h1 style="color:#EF4444;font-size:1.8rem;margin-bottom:12px;font-weight:900">تم حظر الوصول إلى المنصة</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin-bottom:24px;background:rgba(239,68,68,0.1);padding:14px;border-radius:12px;border:1px dashed rgba(239,68,68,0.3)">
          ${reasonMessage}
        </p>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;margin-bottom:24px">
          دليل المنزلة والمطرية الرقمي يلتزم بحماية مستخدميه والحفاظ على نزاهة وأمان المجتمع المحلي. إذا كنت ترى أن هذا الإجراء تم بالخطأ، يمكنك التواصل مع الإدارة.
        </div>
        <a href="https://wa.me/wasendernew" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#000;font-weight:800;padding:12px 24px;border-radius:12px;text-decoration:none">
          <span>💬</span>
          <span>التواصل مع الدعم الفني عبر واتساب</span>
        </a>
      </div>
    </div>
  `;
}

function _setupHeaderSearch() {
  const container = document.getElementById('header-search-container');
  const pill = document.getElementById('header-search-pill');
  const triggerBtn = document.getElementById('header-search-trigger');
  const input = document.getElementById('header-search-input');
  const clearBtn = document.getElementById('header-search-clear');
  const dropdown = document.getElementById('header-live-dropdown');
  const resultsList = document.getElementById('header-live-list');
  const countBadge = document.getElementById('header-live-count');
  const allBtn = document.getElementById('header-live-all-btn');

  if (!input) return;

  let debounceTimer = null;
  let activeSearchReq = 0;

  const openSearch = () => {
    pill?.classList.add('expanded');
    input.focus();
    if (input.value.trim().length >= 1) {
      dropdown?.classList.add('visible');
    }
  };

  const closeSearch = () => {
    pill?.classList.remove('expanded');
    dropdown?.classList.remove('visible');
  };

  triggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (pill?.classList.contains('expanded') && input.value.trim()) {
      window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
    } else {
      openSearch();
    }
  });

  input.addEventListener('focus', () => {
    pill?.classList.add('expanded');
    if (input.value.trim().length >= 1 && resultsList?.children.length > 0) {
      dropdown?.classList.add('visible');
    }
  });

  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    clearBtn.classList.remove('visible');
    dropdown?.classList.remove('visible');
    if (resultsList) resultsList.innerHTML = '';
    input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  // ⚡ Live Search as user types (Instant auto-complete)
  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearBtn?.classList.toggle('visible', query.length > 0);

    if (allBtn) {
      allBtn.href = `search.html?q=${encodeURIComponent(query)}`;
    }

    if (!query) {
      dropdown?.classList.remove('visible');
      if (resultsList) resultsList.innerHTML = '';
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const currentReq = ++activeSearchReq;
      try {
        const { executeFastSearch } = await import('../services/search-engine.service.js');
        const results = await executeFastSearch(query, { limit: 6 });
        if (currentReq !== activeSearchReq) return; // Discard stale request

        if (!dropdown || !resultsList) return;

        if (!results || results.length === 0) {
          countBadge && (countBadge.textContent = '0');
          resultsList.innerHTML = `
            <div class="header-live-empty">
              <div class="header-live-empty__icon">🔍</div>
              <div class="header-live-empty__title">لم يتم العثور على أماكن مطابقة</div>
              <div class="header-live-empty__desc">جرب كلمة أخرى مثل (صيدلية، دكتور، مطعم، نجار)</div>
            </div>
          `;
          dropdown.classList.add('visible');
          return;
        }

        countBadge && (countBadge.textContent = String(results.length));

        resultsList.innerHTML = results.map(doc => {
          const p = doc.raw || doc;
          const name = p.name || 'مكان بالدليل';
          const cat = p.categoryName || doc.category || '';
          const area = p.area || p.address || 'مدينة المنزلة';
          const slug = p.slug || p.id || '';
          const photo = p.photoURL || p.logo || p.coverURL || '';
          const isVerified = p.isVerified || false;
          const isOpen = p.isOpen !== undefined ? p.isOpen : true;

          const letter = (name.trim()[0] || 'م').toUpperCase();

          return `
            <a href="/place.html?slug=${encodeURIComponent(slug)}" class="header-live-dropdown__item" role="option">
              <div class="header-live-avatar">
                ${photo
                  ? `<img src="${photo}" alt="${_esc(name)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'header-live-avatar-fallback\\'>${letter}</div>'"/>`
                  : `<div class="header-live-avatar-fallback">${letter}</div>`
                }
              </div>
              <div class="header-live-content">
                <div class="header-live-title-row">
                  <span class="header-live-name">${_esc(name)}</span>
                  ${isVerified ? '<span class="header-live-verified" title="مكان موثق">✓</span>' : ''}
                </div>
                <div class="header-live-meta-row">
                  ${cat ? `<span class="header-live-cat">${_esc(cat)}</span>` : ''}
                  <span class="header-live-area">${_esc(area)}</span>
                  <span class="${isOpen ? 'header-live-status-open' : 'header-live-status-closed'}">
                    ${isOpen ? 'مفتوح الآن' : 'مغلق'}
                  </span>
                </div>
              </div>
            </a>
          `;
        }).join('');

        dropdown.classList.add('visible');
      } catch (err) {
        console.warn('[HeaderLiveSearch] search error:', err);
      }
    }, 120);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container?.contains(e.target)) {
      dropdown?.classList.remove('visible');
      if (window.innerWidth <= 767) {
        pill?.classList.remove('expanded');
      }
    }
  });
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

