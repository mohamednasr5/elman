/**
 * page-shell.js
 * Injects shared Header, BottomNav, Footer, and PWA Banner.
 * Initializes Firebase, Auth, Theme, Floating Voice Assistant, Realtime Live Sync, and FCM.
 */

import { initFirebase } from './firebase.js';
import { initAuth, onAuthStateChange, signOut, waitForAuth, isAdmin, getCurrentUser } from './auth.js';
import { getSettings, getUserNotifications } from './db.js';
import { toast } from '../ui/components/Toast.js';
import { bindGlobalVoiceAssistantFab } from '../services/voice.service.js';
import { initRealtimePwaSyncBus } from '../services/realtime-sync.service.js';
import { initLiveNotificationSubscriber, updateAllNotificationBadges } from '../services/notification.service.js';
import { initFcmMessaging } from '../services/fcm.service.js';
import { initUniversalMobileTouchTooltips } from '../utils/mobile-tooltip.js';

/* ─────────────────────────────────────────────────────────
   HTML BUILDERS
───────────────────────────────────────────────────────── */
function _headerHTML(active) {
  const links = [
    ['index.html',      'الرئيسية'],
    ['places.html',     'الأماكن'],
    ['categories.html', 'التصنيفات'],
    ['offers.html',     'العروض'],
    ['now.html',        'يحدث الآن 🔥'],
    ['around-me.html',  'بالقرب مني 🧭'],
  ];

  return `
<header class="header" id="site-header" role="banner">
  <div class="container header__inner">
    <a href="index.html" class="header__logo" aria-label="دليل المنزلة والمطرية الرقمي">
      <img src="./icons/icon-192x192.png" alt="شعار دليل المنزلة والمطرية الرقمي" width="36" height="36" class="header__logo-img"/>
      <div class="header__logo-text">
        <span class="header__logo-name">دليل المنزلة والمطرية</span>
      </div>
    </a>

    <div class="header__search" role="search">
      <input type="search" id="header-search-input" class="header__search-input"
             placeholder="ابحث في المنزلة والمطرية والقرى المجاورة..."
             autocomplete="off" aria-label="بحث في الدليل"/>
      <span class="header__search-icon" aria-hidden="true">🔍</span>
    </div>

    <nav class="header__nav" aria-label="التنقل الرئيسي">
      ${links.map(([file, label]) =>
        `<a href="${file}" class="header__nav-link${file === active ? ' active' : ''}">${label}</a>`
      ).join('')}
    </nav>

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
        <h3 class="footer__col-title">الخدمات والدليل</h3>
        <ul class="footer__links">
          <li><a href="dashboard.html?section=add" class="footer__link">➕ إضافة مكان جديد</a></li>
          <li><a href="dashboard.html"             class="footer__link">📊 لوحة التحكم</a></li>
          <li><a href="search.html"                class="footer__link">🔍 البحث المتقدم</a></li>
          <li><a href="manzala.html"               class="footer__link" style="color:var(--secondary,#F5A623);font-weight:700">🏛️ عن مدينة المنزلة</a></li>
          <li><a href="matariya.html"              class="footer__link" style="color:var(--secondary,#F5A623);font-weight:700">⛵ عن مدينة المطرية</a></li>
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
<div class="pwa-banner" id="pwa-banner" hidden>
  <img src="./icons/icon-192x192.png" alt="" class="pwa-banner__icon" width="48" height="48"/>
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

  /* 7. Scroll shadow on header & Scroll to top floating button */
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

  /* 8. Header search */
  document.getElementById('header-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim())
      location.href = `search.html?q=${encodeURIComponent(e.target.value.trim())}`;
  });
  document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
    location.href = 'search.html';
  });

  /* 9. Auth UI & Live Notification / FCM Subscriber (reactive) */
  onAuthStateChange(user => {
    _renderUser(user);
    initLiveNotificationSubscriber(user?.uid);
    initFcmMessaging(user);
  });

  /* 10. Dynamic settings (WhatsApp link) */
  try {
    const s = await getSettings();
    const waLink = s?.contact?.whatsappLink;
    if (waLink) {
      document.querySelectorAll('[data-wa]').forEach(a => { a.href = waLink; });
    }
  } catch (_) {}

  /* 11. PWA Install banner */
  _setupPwa();

  /* 12. Service Worker */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
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

  /* 13. Universal Realtime PWA Sync Bus (0ms Sync) */
  initRealtimePwaSyncBus();

  /* 14. Universal Mobile Touch Tooltips (Tap on badges/labels) */
  initUniversalMobileTouchTooltips();

  /* 15. Instant Link Prefetching for 0ms page loads */
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

let _dp = null;
function _setupPwa() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _dp = e;
    _showPwaBanner();
  });

  setTimeout(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone && !localStorage.getItem('pwa-dismissed')) {
      _showPwaBanner();
    }
  }, 3500);

  document.addEventListener('click', e => {
    if (e.target.closest('#pwa-banner-close')) {
      e.preventDefault();
      _dismissPwaBanner();
      return;
    }
    if (e.target.closest('#pwa-install-btn')) {
      e.preventDefault();
      _triggerInstall();
      return;
    }
  });
}

function _showPwaBanner() {
  const b = document.getElementById('pwa-banner');
  if (b) {
    b.hidden = false;
    b.style.display = 'flex';
  }
}

function _dismissPwaBanner() {
  const b = document.getElementById('pwa-banner');
  if (b) {
    b.hidden = true;
    b.style.display = 'none';
  }
  localStorage.setItem('pwa-dismissed', 'true');
}

async function _triggerInstall() {
  if (_dp) {
    _dp.prompt();
    const { outcome } = await _dp.userChoice;
    if (outcome === 'accepted') {
      _dismissPwaBanner();
      toast.success('شكراً لتثبيت تطبيق دليل المنزلة والمطرية! 🎉');
    }
    _dp = null;
  } else {
    toast.info('لتثبيت التطبيق: افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
  }
}

function _h(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _a(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
