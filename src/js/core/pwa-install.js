/* Universal PWA install prompt for every page shell. */
let deferredPrompt = null;
let banner = null;
let showTimer = null;

function isEnglish() {
  return document.documentElement.lang === 'en' || window.location.pathname === '/en' || window.location.pathname.startsWith('/en/');
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true || document.referrer.includes('android-app://');
}

function ensureBanner() {
  if (isStandalone()) return null;
  if (document.getElementById('pwa-banner')) return document.getElementById('pwa-banner');
  const en = isEnglish();
  const slot = document.getElementById('pwa-slot') || document.body;
  banner = document.createElement('aside');
  banner.id = 'pwa-banner';
  banner.className = 'pwa-banner';
  banner.hidden = true;
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', en ? 'Install app' : 'تثبيت التطبيق');
  banner.innerHTML = `
    <div class="pwa-banner__content">
      <div class="pwa-banner__icon">📱</div>
      <div class="pwa-banner__text">
        <strong class="pwa-banner__title">${en ? 'Install Dalil El Manzala & El Matariya' : 'ثبّت دليل المنزلة والمطرية'}</strong>
        <span class="pwa-banner__desc">${en ? 'Install the app for faster access and a better experience.' : 'ثبّت التطبيق للوصول السريع وتجربة أفضل.'}</span>
      </div>
    </div>
    <div class="pwa-banner__actions">
      <button class="btn btn-primary btn-sm" id="pwa-install-btn" type="button">${en ? 'Install App' : 'تثبيت التطبيق'}</button>
      <button class="pwa-banner__close" id="pwa-banner-close" type="button" aria-label="${en ? 'Close' : 'إغلاق'}">✕</button>
    </div>`;
  slot.appendChild(banner);

  banner.querySelector('#pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) { showManualInstructions(); return; }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') { deferredPrompt = null; hideBanner(); }
    } catch (_) {}
  });
  banner.querySelector('#pwa-banner-close')?.addEventListener('click', () => {
    hideBanner();
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  });
  return banner;
}

function showBanner(force = false) {
  const b = ensureBanner();
  if (!b || isStandalone()) return;
  if (!force && sessionStorage.getItem('pwa-banner-dismissed')) return;
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
    ? (ios ? 'On iPhone or iPad, tap Share, then choose “Add to Home Screen”.' : 'Installation is not available through the browser prompt right now. Open the browser menu and choose “Install app” or “Add to Home screen”.')
    : (ios ? 'على iPhone أو iPad: اضغط مشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».' : 'التثبيت غير متاح عبر النافذة التلقائية حالياً. افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».');
  window.alert(message);
}

function scheduleFallbackBanner() {
  clearTimeout(showTimer);
  showTimer = setTimeout(() => showBanner(false), 3500);
}

function capture(e) {
  e.preventDefault();
  deferredPrompt = e;
  window.__deferredPwaPrompt = e;
  clearTimeout(showTimer);
  setTimeout(() => showBanner(false), 900);
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
  setTimeout(() => showBanner(false), 900);
}

async function refreshPwaRuntime() {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update().catch(() => {});
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.filter(name => /^manzala-(images|api)-/i.test(name)).map(name => caches.delete(name)));
    }
  } catch (_) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ensureBanner();
    scheduleFallbackBanner();
    refreshPwaRuntime();
  }, { once: true });
} else {
  ensureBanner();
  scheduleFallbackBanner();
  refreshPwaRuntime();
}
