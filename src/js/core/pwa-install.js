/* Universal PWA install prompt + mobile shell utilities + Realtime Auto-Sync. */
let deferredPrompt = null, banner = null, showTimer = null;

function loadPwaStyles() {
  if (document.getElementById('pwa-install-design')) return;
  const link = document.createElement('link');
  link.id = 'pwa-install-design';
  link.rel = 'stylesheet';
  link.href = '/src/css/pwa-install.css?v=20260924_v2';
  document.head.appendChild(link);
}

function isEnglish() {
  return document.documentElement.lang === 'en' || location.pathname === '/en' || location.pathname.startsWith('/en/');
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true || document.referrer.includes('android-app://');
}

/** Aggressively purge legacy floating buttons from the DOM */
function purgeMobileActionHints() {
  try {
    document.querySelectorAll('#mobile-action-hints, .mobile-action-hints, .mobile-action-hint').forEach(el => el.remove());
  } catch (_) {}
}
purgeMobileActionHints();

// Persistent observer to immediately zap #mobile-action-hints if any legacy cached script tries to inject it
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
  try {
    const purgeObserver = new MutationObserver(() => {
      const el = document.getElementById('mobile-action-hints') || document.querySelector('.mobile-action-hints');
      if (el) el.remove();
    });
    purgeObserver.observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}
}

function ensureBanner() {
  if (isStandalone()) return null;
  if (document.getElementById('pwa-banner')) return document.getElementById('pwa-banner');
  const en = isEnglish(), slot = document.getElementById('pwa-slot') || document.body;
  banner = document.createElement('div');
  banner.id = 'pwa-banner';
  banner.className = 'pwa-banner';
  banner.hidden = true;
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', en ? 'Install application' : 'تثبيت التطبيق');
  banner.innerHTML = `
    <div class="pwa-banner__card">
      <div class="pwa-banner__header">
        <div class="pwa-banner__logo-wrap">
          <img src="/icons/icon-96x96.png" alt="App Icon" class="pwa-banner__logo-img" width="52" height="52" onerror="this.src='/favicon-48x48.png'">
          <span class="pwa-banner__badge-verified" title="${en ? 'Verified App' : 'تطبيق موثق رسمي'}">✓</span>
        </div>
        <div class="pwa-banner__info">
          <div class="pwa-banner__title-wrap">
            <h3 class="pwa-banner__title">${en ? 'Dalil El Manzala & El Matariya' : 'دليل المنزلة والمطرية الرقمي'}</h3>
          </div>
          <div class="pwa-banner__rating-pill">
            <span class="pwa-banner__stars">⭐⭐⭐⭐⭐</span>
            <span class="pwa-banner__rating-text">4.9 • ${en ? 'Official PWA' : 'تطبيق رسمي مجاني'}</span>
          </div>
          <p class="pwa-banner__desc">${en ? 'Fast access, offline directory & instant updates on your home screen.' : 'تصفح أسرع، وصول فوري بدون متصفح، وإشعارات حية لكافة الخدمات.'}</p>
        </div>
        <button class="pwa-banner__close-btn" id="pwa-banner-close" type="button" aria-label="${en ? 'Close' : 'إغلاق'}">✕</button>
      </div>
      <div class="pwa-banner__features">
        <div class="pwa-banner__feature"><span class="pwa-banner__feat-icon">⚡</span><span>${en ? 'Super fast' : 'خفيف وسريع'}</span></div>
        <div class="pwa-banner__feature"><span class="pwa-banner__feat-icon">📶</span><span>${en ? 'Works offline' : 'يعمل بدون نت'}</span></div>
        <div class="pwa-banner__feature"><span class="pwa-banner__feat-icon">🔔</span><span>${en ? 'Live Alerts' : 'تنبيهات فورية'}</span></div>
      </div>
      <div class="pwa-banner__footer">
        <button class="pwa-banner__btn-install" id="pwa-install-btn" type="button">
          <span class="pwa-banner__install-icon">📲</span>
          <span>${en ? 'Install to Home Screen' : 'تثبيت التطبيق الآن'}</span>
        </button>
        <button class="pwa-banner__btn-later" id="pwa-banner-later" type="button">${en ? 'Maybe Later' : 'لاحقاً'}</button>
      </div>
    </div>`;
  slot.appendChild(banner);

  banner.querySelector('#pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) {
      showManualInstructions();
      return;
    }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        deferredPrompt = null;
        hideBanner();
      }
    } catch (_) {}
  });

  const dismiss = () => {
    hideBanner();
    try { sessionStorage.setItem('pwa-banner-dismissed', '1'); } catch (_) {}
  };
  banner.querySelector('#pwa-banner-close')?.addEventListener('click', dismiss);
  banner.querySelector('#pwa-banner-later')?.addEventListener('click', dismiss);
  banner.querySelector('#pwa-banner-backdrop')?.addEventListener('click', dismiss);
  return banner;
}

function showBanner(force = false) {
  const b = ensureBanner();
  if (!b || isStandalone()) return;
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('pwa-banner-dismissed') === '1'; } catch (_) {}
  if (!force && dismissed) return;
  b.hidden = false;
  requestAnimationFrame(() => b.classList.add('visible'));
}

function hideBanner() {
  const b = document.getElementById('pwa-banner');
  if (!b) return;
  b.classList.remove('visible');
  setTimeout(() => { b.hidden = true; }, 350);
}

function showManualInstructions() {
  const en = isEnglish();
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const message = en
    ? (ios ? 'On iPhone or iPad: tap the Share button below, then choose "Add to Home Screen".' : 'Open the browser menu (⋮) and choose "Install app" or "Add to Home screen".')
    : (ios ? 'على iPhone أو iPad: اضغط زر المشاركة (Share) في الأسفل ثم اختر «إضافة إلى الشاشة الرئيسية». ' : 'افتح قائمة المتصفح (الثلاث نقاط) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».');
  window.alert(message);
}

function scheduleFallbackBanner() {
  clearTimeout(showTimer);
  showTimer = setTimeout(() => showBanner(false), 2400);
}

function capture(e) {
  e.preventDefault();
  deferredPrompt = e;
  window.__deferredPwaPrompt = e;
  clearTimeout(showTimer);
  setTimeout(() => showBanner(false), 500);
}

window.addEventListener('beforeinstallprompt', capture);
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.__deferredPwaPrompt = null;
  clearTimeout(showTimer);
  hideBanner();
});
if (window.__deferredPwaPrompt) {
  deferredPrompt = window.__deferredPwaPrompt;
  setTimeout(() => showBanner(false), 500);
}

/** Realtime Service Worker Lifecycle & Auto-Sync */
async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });

    // If a waiting worker already exists, force it to activate immediately
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // When an update is discovered in the background, skip waiting as soon as installed
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    // Auto-reload the tab seamlessly when the new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.__pwaControllerReloaded) return;
      window.__pwaControllerReloaded = true;
      window.location.reload();
    }, { once: true });

    // Periodic check for new versions & recheck on tab focus / visibility
    if (registration.update) {
      registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
      setInterval(() => {
        if (registration.update) registration.update().catch(() => {});
      }, 3 * 60 * 1000);
    }

    return registration;
  } catch (err) {
    console.warn('[PWA] Service worker registration:', err);
    return null;
  }
}

/** Hover-only display controls rail on desktop; hidden on mobile */
export function installDisplayControlsRail() {
  if (document.getElementById('display-controls-rail')) return;
  const lang = document.getElementById('lang-toggle-btn'), theme = document.getElementById('theme-toggle-btn');
  if (!lang && !theme) return;

  const en = isEnglish();
  const rail = document.createElement('aside');
  rail.id = 'display-controls-rail';
  rail.className = 'display-controls-rail is-collapsed';
  rail.setAttribute('aria-label', en ? 'Language and theme controls' : 'عناصر التحكم في اللغة والمظهر');

  // Edge hover trigger sensor strip
  const edgeTrigger = document.createElement('div');
  edgeTrigger.className = 'display-controls-edge-trigger';
  edgeTrigger.id = 'display-controls-edge-trigger';
  edgeTrigger.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'display-controls-content';
  if (theme) content.appendChild(theme);
  if (lang) content.appendChild(lang);

  rail.appendChild(content);
  document.body.appendChild(edgeTrigger);
  document.body.appendChild(rail);

  let collapseTimer = null;
  function scheduleCollapse(delay = 1800) {
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(() => {
      rail.classList.remove('is-expanded');
      rail.classList.add('is-collapsed');
    }, delay);
  }

  function revealRail() {
    clearTimeout(collapseTimer);
    rail.classList.remove('is-collapsed');
    rail.classList.add('is-expanded');
  }

  edgeTrigger.addEventListener('mouseenter', revealRail);
  edgeTrigger.addEventListener('touchstart', revealRail, { passive: true });
  rail.addEventListener('mouseenter', revealRail);
  rail.addEventListener('mouseleave', () => scheduleCollapse(1200));

  window.addEventListener('scroll', () => {
    if (rail.classList.contains('is-expanded')) {
      scheduleCollapse(400);
    }
  }, { passive: true });

  document.addEventListener('pointerdown', e => {
    if (rail.classList.contains('is-expanded') && !rail.contains(e.target) && !edgeTrigger.contains(e.target)) {
      scheduleCollapse(100);
    }
  }, { passive: true });
}

async function refreshPwaRuntime() {
  try {
    const registration = await ensureServiceWorker();
    if (registration) {
      registration.update().catch(() => {});
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch (_) {}
}

const DASHBOARD_MOBILE_LINKS_AR = [
  ['🏠', 'نظرة عامة', '/dashboard.html'],
  ['📍', 'أماكني', '/dashboard.html?section=places'],
  ['📈', 'التقارير والإحصائيات', '/dashboard.html?section=analytics'],
  ['⭐', 'متابعاتي وعروضها', '/dashboard.html?section=following'],
  ['🗺️', 'بالقرب مني (GPS)', '/dashboard.html?section=around-me'],
  ['🎁', 'نادي الولاء والنقاط', '/dashboard.html?section=loyalty'],
  ['📸', 'تصوير كارت المحل (AI)', '/dashboard.html?section=add&action=scan'],
  ['➕', 'إضافة مكان يدويًا', '/dashboard.html?section=add'],
  ['🔔', 'الإشعارات والزيارات', '/dashboard.html?section=notifications'],
  ['🛡️', 'وثق ملفك (العلامة الزرقاء)', '/contact.html?type=verification']
];

const DASHBOARD_MOBILE_LINKS_EN = [
  ['🏠', 'Overview', '/en/dashboard/'],
  ['📍', 'My Places', '/en/dashboard/?section=places'],
  ['📈', 'Reports & Analytics', '/en/dashboard/?section=analytics'],
  ['⭐', 'Following & Offers', '/en/dashboard/?section=following'],
  ['🗺️', 'Near Me (GPS)', '/en/dashboard/?section=around-me'],
  ['🎁', 'Loyalty & Points', '/en/dashboard/?section=loyalty'],
  ['📸', 'Business Card AI', '/en/dashboard/?section=add&action=scan'],
  ['➕', 'Add a Place', '/en/dashboard/?section=add'],
  ['🔔', 'Notifications', '/en/dashboard/?section=notifications'],
  ['🛡️', 'Verify Your Profile', '/en/contact/?type=verification']
];

function currentAuthUser() {
  try { return window.firebase?.auth?.().currentUser || null; } catch (_) { return null; }
}

async function isCurrentUserAdmin(user) {
  if (!user) return false;
  try {
    const mod = await import('./auth.js');
    return !!mod.isAdmin(mod.getCurrentUser?.() || user);
  } catch (_) {
    try {
      const token = await user.getIdTokenResult();
      return !!(token.claims?.admin || token.claims?.role === 'admin' || token.claims?.role === 'superadmin');
    } catch (_) { return false; }
  }
}

async function syncMobileMoreMenu() {
  const sheet = document.getElementById('mobile-more-sheet');
  if (!sheet) return;
  const links = sheet.querySelector('[data-more-links]');
  if (!links) return;
  const user = currentAuthUser();
  const en = isEnglish();
  const base = en
    ? [['🏠', 'Home', '/en/'], ['📍', 'Places Directory', '/en/places/'], ['📋', 'Categories', '/en/categories/'], ['🏷️', 'Offers', '/en/offers/'], ['❤️', 'Favorites', '/en/favorites/']]
    : [['🏠', 'الرئيسية', '/index.html'], ['📍', 'دليل الأماكن', '/places.html'], ['📋', 'التصنيفات', '/categories.html'], ['🏷️', 'العروض', '/offers.html'], ['❤️', 'المفضلة', '/favorites.html']];
  if (!user) {
    links.innerHTML = base.map(([i, t, h]) => `<a class="mobile-more-sheet__link" href="${h}"><span>${i} ${t}</span><span aria-hidden="true">›</span></a>`).join('');
    return;
  }
  const dash = en ? DASHBOARD_MOBILE_LINKS_EN : DASHBOARD_MOBILE_LINKS_AR;
  const publicLinks = en
    ? [['🔎', 'Search Directory', '/en/search/'], ['🤝', 'Community Requests', '/en/now/'], ['✉️', 'Contact Us', '/en/contact/']]
    : [['🔎', 'البحث في الدليل', '/search.html'], ['🤝', 'طلبات أهالينا', '/now.html'], ['✉️', 'تواصل معنا', '/contact.html']];
  let html = `<div class="mobile-more-sheet__section-title">${en ? 'My Dashboard' : 'لوحة تحكمي'}</div>`
    + dash.map(([i, t, h]) => `<a class="mobile-more-sheet__link mobile-more-sheet__dashboard-link" href="${h}"><span>${i} ${t}</span><span aria-hidden="true">›</span></a>`).join('')
    + `<div class="mobile-more-sheet__section-title">${en ? 'Directory' : 'الدليل'}</div>`
    + base.concat(publicLinks).map(([i, t, h]) => `<a class="mobile-more-sheet__link" href="${h}"><span>${i} ${t}</span><span aria-hidden="true">›</span></a>`).join('');
  if (await isCurrentUserAdmin(user)) {
    html += `<div class="mobile-more-sheet__section-title">${en ? 'Administration' : 'الإدارة'}</div><a class="mobile-more-sheet__link mobile-more-sheet__admin-link" href="/admin/index.html"><span>⚙️ ${en ? 'Admin Dashboard' : 'لوحة تحكم الإدارة'}</span><span aria-hidden="true">›</span></a>`;
  }
  links.innerHTML = html;
}

function observeAuthenticatedMoreMenu() {
  if (document.body.dataset.authMoreObserver === '1') return;
  document.body.dataset.authMoreObserver = '1';
  const observer = new MutationObserver(() => {
    if (document.getElementById('mobile-more-sheet')) syncMobileMoreMenu().catch(() => {});
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const bind = () => {
    try {
      const auth = window.firebase?.auth?.();
      if (auth) {
        auth.onAuthStateChanged(() => syncMobileMoreMenu().catch(() => {}));
        syncMobileMoreMenu().catch(() => {});
      }
    } catch (_) {}
  };
  setTimeout(bind, 500);
  setTimeout(bind, 2000);
}

export function ensureMobileActionHints() {
  purgeMobileActionHints();
}

async function restorePwaNotificationPrompt() {
  if (!isStandalone() || typeof Notification === 'undefined' || Notification.permission !== 'default') return;
  try {
    localStorage.removeItem('manzala_push_dismissed');
    const mod = await import('../services/fcm.service.js');
    mod.mountPushNotificationPrompt?.(currentAuthUser());
  } catch (_) {}
}

function bootPwaInstall() {
  purgeMobileActionHints();
  loadPwaStyles();
  ensureBanner();
  scheduleFallbackBanner();
  refreshPwaRuntime();
  setTimeout(installDisplayControlsRail, 150);
  observeAuthenticatedMoreMenu();
  setTimeout(restorePwaNotificationPrompt, 1100);
  window.addEventListener('resize', () => {
    purgeMobileActionHints();
    installDisplayControlsRail();
  }, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootPwaInstall, { once: true });
} else {
  bootPwaInstall();
}
