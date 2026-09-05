/**
 * المنزلة وناسها — Admin Control Panel (Instant SPA + Sponsored Ads Edition)
 * Zero-latency navigation, in-memory caching, responsive mobile bottom-bar,
 * and complete Sponsored Place / Paid Ad priority controls.
 */

import { getDB, dbGet, dbSet, dbUpdate, dbRemove, dbPush, dbIncrement, serverTimestamp, getSettings, getCategories, getAllReviews, adminAddReview, adminUpdateReview, adminDeleteReview, adminBulkDeleteReviews, parseBulkReviews, adminBulkAddReviews, generateSyntheticReviews, isPlaceBanned, adminBanPlace, adminUnbanPlace, getAllProducts, adminApproveProduct, adminRejectProduct, adminDeleteProduct, adminApproveReportedReview, HAMMAD_TESTIMONIALS, HAMMAD_PLACE_SLUG, broadcastNewPlaceNotification, broadcastPlaceVerifiedNotification, adminBanIp, adminUnbanIp, getAllBannedIps } from '../../core/db.js';
import { isAdmin, getCurrentUser } from '../../core/auth.js';
import { renderStatusBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../../utils/date.js';
import { getPendingLiveNews, getPublishedLiveNews, adminApproveLiveNews, adminUpdateLiveNews, adminDeleteLiveNews, submitLiveReport, NEWS_CATEGORIES, STATUS_TAGS } from '../../services/live-news.service.js';
import { getLoyaltyLevelInfo, LOYALTY_LEVELS } from '../../services/loyalty.service.js';
import { arabicMatch, normalizeArabic } from '../../utils/arabic.js';
import { normalizePhoneNumber } from '../../utils/phone.js';
import { isAtmPlace, ATM_UNIFIED_COVER, ATM_UNIFIED_LOGO } from '../../utils/atm.js';
import { extractCoordinates, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';

// ── In-Memory Cache Store for 0ms Tab Switching ──
const adminCache = {
  users: null,
  places: null,
  products: null,
  offers: null,
  ads: null,
  verificationRequests: null,
  categoryRequests: null,
  categories: null,
  settings: null,
  reviews: null,
  isPreloaded: false
};

let _currentUser = null;
let _currentSection = 'overview';

// ── SVG Icon Helper ──
function svgIcon(path) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${path}</svg>`;
}

const ICONS = {
  chart:     svgIcon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  pin:       svgIcon('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  shield:    svgIcon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  folder:    svgIcon('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
  users:     svgIcon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  tag:       svgIcon('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
  megaphone: svgIcon('<path d="m3 11 19-9-9 19-2-8-8-2z"/>'),
  cog:       svgIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  home:      svgIcon('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  globe:     svgIcon('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  trash:     svgIcon('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  edit:      svgIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  eye:       svgIcon('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  check:     svgIcon('<polyline points="20 6 9 17 4 12"/>'),
  x:         svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  plus:      svgIcon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  star:      svgIcon('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  clock:     svgIcon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  bullhorn:  svgIcon('<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>')
};

function navLink(sectionKey, href, icon, label, active) {
  return `<a href="${href}" data-section="${sectionKey}" class="dashboard-nav-item${active ? ' active' : ''}">
    <span style="display:inline-flex;align-items:center">${icon}</span>
    <span>${label}</span>
  </a>`;
}

// ─────────────────────────────────────────────
//  MAIN ENTRY POINT
// ─────────────────────────────────────────────
export async function renderAdmin($container, { user, section = 'overview' }) {
  if (!user || !isAdmin(user)) return;
  _currentUser = user;
  _currentSection = section;
  // Explicitly remove public bottom nav in admin
  document.getElementById('nav-slot')?.remove();
  document.querySelector('.bottom-nav')?.remove();
  document.body.classList.add('admin-page');

  $container.innerHTML = `
    <div class="dashboard-layout">
      <!-- Admin Sidebar -->
      <aside class="dashboard-sidebar" style="background:#0F273D;color:#fff" role="navigation" aria-label="لوحة الإدارة">
        <div class="dashboard-sidebar__user" style="border-color:rgba(255,255,255,0.1)">
          <img src="${user.photoURL || './icons/icon-72x72.png'}" class="dashboard-sidebar__avatar" alt="${escHtml(user.name)}" />
          <div>
            <div class="dashboard-sidebar__name" style="color:#fff">${escHtml(user.name)}</div>
            <div class="dashboard-sidebar__role" style="color:var(--secondary,#F5A623)">إدارة المنصة ★</div>
          </div>
        </div>

        <nav class="dashboard-sidebar__nav" id="admin-sidebar-nav">
          ${navLink('overview',      '#', ICONS.chart,     'الإحصائيات',     section === 'overview')}
          ${navLink('places',        '#', ICONS.pin,       'الأماكن',         section === 'places')}
          ${navLink('live-news',     '#', svgIcon('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'), 'المنزلة والمطرية الآن 🔥', section === 'live-news')}
          ${navLink('products',      '#', ICONS.tag,       'المنتجات والمراجعة 🛍️', section === 'products')}
          ${navLink('reviews',       '#', ICONS.star,      'التقييمات ⭐',    section === 'reviews')}
          ${navLink('verification',  '#', ICONS.shield,    'طلبات التوثيق',  section === 'verification')}
          ${navLink('categories',    '#', ICONS.folder,    'التصنيفات',       section === 'categories')}
          ${navLink('users',         '#', ICONS.users,     'المستخدمون',      section === 'users')}
          ${navLink('offers',        '#', ICONS.tag,       'العروض',          section === 'offers')}
          ${navLink('ads',           '#', ICONS.megaphone, 'الإعلانات والترويج', section === 'ads')}
          ${navLink('settings',      '#', ICONS.cog,       'الإعدادات',       section === 'settings')}

          <div class="dashboard-nav-section" style="color:rgba(255,255,255,0.4)">العودة</div>
          <a href="../dashboard.html" class="dashboard-nav-item" style="color:rgba(255,255,255,0.7)">
            <span style="display:inline-flex;align-items:center">${ICONS.home}</span>
            <span>لوحة المستخدم</span>
          </a>
          <a href="../index.html" class="dashboard-nav-item" style="color:rgba(255,255,255,0.7)">
            <span style="display:inline-flex;align-items:center">${ICONS.globe}</span>
            <span>الصفحة الرئيسية</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="dashboard-content" id="admin-main-area">

        <!-- Smart Standalone PWA Install Banner for Admin -->
        <div id="admin-pwa-top-banner" style="display:none;background:linear-gradient(135deg,#0284C7,#0369A1);border-radius:14px;padding:12px 16px;margin-bottom:16px;box-shadow:0 4px 15px rgba(2,132,199,0.25);color:#fff;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📲</span>
            <div>
              <div style="font-weight:800;font-size:13.5px">تثبيت تطبيق إدارة الدليل على هاتفك</div>
              <div style="font-size:11.5px;opacity:0.9">تطبيق مستقل وسريع جداً مخصص للمشرفين والمسؤولين</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button type="button" id="btn-trigger-admin-install-banner" class="btn" style="background:#fff;color:#0369A1;font-weight:800;font-size:12.5px;padding:6px 14px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1)">
              تثبيت الآن ⬇️
            </button>
            <button type="button" id="btn-dismiss-admin-install-banner" style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer;opacity:0.8;padding:4px">✕</button>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:center;min-height:50vh">
          <div class="spinner spinner-lg"></div>
        </div>
      </main>

      <!-- Admin Mobile Bottom Bar (5 Primary Clean Tabs) -->
      <nav class="admin-mobile-bottom-bar" id="admin-mobile-bottom-nav" aria-label="شريط إدارة الهاتف">
        <button type="button" class="admin-bottom-tab ${section === 'overview' ? 'active' : ''}" data-admin-sec="overview">
          <span class="admin-bottom-tab__icon">${ICONS.chart}</span>
          <span class="admin-bottom-tab__label">الإحصائيات</span>
        </button>
        <button type="button" class="admin-bottom-tab ${section === 'places' ? 'active' : ''}" data-admin-sec="places">
          <span class="admin-bottom-tab__icon">${ICONS.pin}</span>
          <span class="admin-bottom-tab__label">الأماكن</span>
        </button>
        <button type="button" class="admin-bottom-tab ${section === 'reviews' ? 'active' : ''}" data-admin-sec="reviews">
          <span class="admin-bottom-tab__icon">${ICONS.star}</span>
          <span class="admin-bottom-tab__label">التقييمات</span>
        </button>
        <button type="button" class="admin-bottom-tab ${section === 'verification' ? 'active' : ''}" data-admin-sec="verification">
          <span class="admin-bottom-tab__icon">${ICONS.shield}</span>
          <span class="admin-bottom-tab__label">التوثيق</span>
        </button>
        <button type="button" class="admin-bottom-tab ${['products', 'categories', 'users', 'offers', 'ads', 'settings'].includes(section) ? 'active' : ''}" id="btn-admin-open-more-sheet" data-admin-action="open-more" aria-label="المزيد من الأقسام">
          <span class="admin-bottom-tab__icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </span>
          <span class="admin-bottom-tab__label">المزيد ⋯</span>
        </button>
      </nav>

      <!-- Admin "المزيد" Drawer Bottom Sheet -->
      <div class="admin-more-sheet-backdrop" id="admin-more-sheet-backdrop">
        <div class="admin-more-sheet" role="dialog" aria-modal="true" aria-label="كافة أقسام الإدارة">
          <div class="admin-sheet-handle"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px">
            <div style="font-weight:800;font-size:15px;color:#F5A623;display:flex;align-items:center;gap:6px">
              <span>⚙️</span>
              <span>كافة أقسام لوحة الإدارة</span>
            </div>
            <button type="button" id="btn-close-admin-more-sheet" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:4px">✕</button>
          </div>

          <div class="admin-sheet-grid">
            <button type="button" class="admin-sheet-item" data-admin-sec="live-news" style="border-color:rgba(245,166,35,0.4)">
              <span>🔥</span>
              <span style="color:#F5A623;font-weight:800">يحدث الآن</span>
            </button>
            <button type="button" class="admin-sheet-item" data-admin-sec="products">
              <span>🛍️</span>
              <span>المنتجات</span>
            </button>
            <button type="button" class="admin-sheet-item" data-admin-sec="categories">
              <span>📁</span>
              <span>التصنيفات</span>
            </button>
            <button type="button" class="admin-sheet-item" data-admin-sec="users">
              <span>👥</span>
              <span>المستخدمين</span>
            </button>
            <button type="button" class="admin-sheet-item" data-admin-sec="offers">
              <span>🏷️</span>
              <span>العروض</span>
            </button>
            <button type="button" class="admin-sheet-item" data-admin-sec="ads">
              <span>📢</span>
              <span>الإعلانات</span>
            </button>
            <button type="button" class="admin-sheet-item" data-admin-sec="settings">
              <span>⚙️</span>
              <span>الإعدادات</span>
            </button>
            <a href="../dashboard.html" class="admin-sheet-item" style="background:rgba(2,132,199,0.15);border-color:#0284C7">
              <span>👤</span>
              <span>لوحة حسابي</span>
            </a>
            <a href="../index.html" class="admin-sheet-item" style="background:rgba(16,185,129,0.15);border-color:#10B981">
              <span>🌐</span>
              <span>الرئيسية</span>
            </a>
            <button type="button" class="admin-sheet-item" id="btn-admin-pwa-install-app" style="background:rgba(245,166,35,0.15);border-color:#F5A623">
              <span>📲</span>
              <span>تثبيت PWA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  setupAdminNavigation();

  // Detect if already installed / standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const banner = document.getElementById('admin-pwa-top-banner');
  
  if (!isStandalone && banner && !sessionStorage.getItem('admin_pwa_banner_dismissed')) {
    banner.style.display = 'flex';
  }

  document.getElementById('btn-dismiss-admin-install-banner')?.addEventListener('click', () => {
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('admin_pwa_banner_dismissed', 'true');
  });

  document.getElementById('btn-trigger-admin-install-banner')?.addEventListener('click', async () => {
    if (_adminDeferredPrompt) {
      _adminDeferredPrompt.prompt();
      const { outcome } = await _adminDeferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('تم تثبيت تطبيق لوحة إدارة الدليل بنجاح! 📲');
        if (banner) banner.style.display = 'none';
      }
      _adminDeferredPrompt = null;
    } else {
      toast.info('لتثبيت تطبيق الإدارة: افتح قائمة المتصفح (⋮) واختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"');
    }
  });
  
  await switchAdminSection(section, false);
  preloadAdminData();
}

/**
 * Instant SPA Section Switcher (0ms perceived latency)
 */
async function switchAdminSection(sectionName, pushState = true) {
  _currentSection = sectionName;
  const $main = document.getElementById('admin-main-area');
  if (!$main) return;

  if (pushState) {
    const newUrl = sectionName === 'overview' ? window.location.pathname : `${window.location.pathname}?section=${sectionName}`;
    history.pushState({ section: sectionName }, '', newUrl);
  }

  document.querySelectorAll('#admin-sidebar-nav .dashboard-nav-item[data-section]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-section') === sectionName);
  });

  // Update mobile bottom nav
  document.querySelectorAll('#admin-mobile-bottom-nav .admin-bottom-tab[data-admin-sec]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-admin-sec') === sectionName);
  });

  try {
    if      (sectionName === 'overview')      await renderAdminOverview($main);
    else if (sectionName === 'places')        await renderAdminPlaces($main);
    else if (sectionName === 'products')      await renderAdminProducts($main);
    else if (sectionName === 'live-news')     await renderAdminLiveNews($main);
    else if (sectionName === 'reviews')       await renderAdminReviews($main);
    else if (sectionName === 'verification')  await renderAdminVerification($main);
    else if (sectionName === 'categories')    await renderAdminCategories($main);
    else if (sectionName === 'users')         await renderAdminUsers($main);
    else if (sectionName === 'offers')        await renderAdminOffers($main);
    else if (sectionName === 'ads')           await renderAdminAds($main);
    else if (sectionName === 'settings')      await renderAdminSettings($main);
    else                                      await renderAdminOverview($main);
  } catch (err) {
    console.error('[Admin] Switch section error:', err);
    $main.innerHTML = `
      <div class="empty-state" style="margin-top:60px">
        <span class="empty-state__icon">⚠️</span>
        <h3>حدث خطأ أثناء تحميل البيانات</h3>
        <p style="color:var(--danger);max-width:440px;margin:.5rem auto">${escHtml(err.message || 'تعذر عرض القسم')}</p>
        <button class="btn btn-primary" onclick="window.refreshCurrentAdminSection()" style="margin-top:16px">إعادة المحاولة</button>
      </div>
    `;
  }
}

function setupAdminNavigation() {
  const nav = document.getElementById('admin-sidebar-nav');
  if (nav && !nav.dataset.listening) {
    nav.dataset.listening = 'true';
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-section]');
      if (link) {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        switchAdminSection(section, true);
      }
    });
  }

  // Mobile Bottom Nav & More Sheet Listeners
  const mobileNav = document.getElementById('admin-mobile-bottom-nav');
  const moreSheetBackdrop = document.getElementById('admin-more-sheet-backdrop');
  const btnOpenMore = document.getElementById('btn-admin-open-more-sheet');
  const btnCloseMore = document.getElementById('btn-close-admin-more-sheet');

  function openMoreSheet() {
    if (moreSheetBackdrop) moreSheetBackdrop.classList.add('visible');
  }

  function closeMoreSheet() {
    if (moreSheetBackdrop) moreSheetBackdrop.classList.remove('visible');
  }

  btnOpenMore?.addEventListener('click', openMoreSheet);
  btnCloseMore?.addEventListener('click', closeMoreSheet);
  moreSheetBackdrop?.addEventListener('click', (e) => {
    if (e.target === moreSheetBackdrop) closeMoreSheet();
  });

  document.querySelectorAll('.admin-sheet-item[data-admin-sec]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = btn.getAttribute('data-admin-sec');
      closeMoreSheet();
      switchAdminSection(sec, true);
    });
  });

  if (mobileNav && !mobileNav.dataset.listening) {
    mobileNav.dataset.listening = 'true';
    mobileNav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-admin-sec]');
      if (btn) {
        e.preventDefault();
        const section = btn.getAttribute('data-admin-sec');
        closeMoreSheet();
        switchAdminSection(section, true);
      }
    });
  }

  // Admin PWA Standalone Install Trigger
  let _adminDeferredPrompt = null;
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _adminDeferredPrompt = e;
    });
  }

  document.getElementById('btn-admin-pwa-install-app')?.addEventListener('click', async () => {
    if (_adminDeferredPrompt) {
      _adminDeferredPrompt.prompt();
      const { outcome } = await _adminDeferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('تم تثبيت تطبيق لوحة إدارة الدليل بنجاح! 📲');
      }
      _adminDeferredPrompt = null;
    } else {
      toast.info('لتثبيت تطبيق الإدارة: افتح قائمة المتصفح (⋮) واختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"');
    }
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      const params = new URLSearchParams(location.search);
      const section = params.get('section') || 'overview';
      switchAdminSection(section, false);
    });
  }
}

if (typeof window !== 'undefined') {
  window.refreshCurrentAdminSection = () => switchAdminSection(_currentSection, false);

  window.adminBanPlaceAction = (placeId, placeName) => {
    const modal = showModal({
      title: `🚫 حظر المكان: ${escHtml(placeName)}`,
      size: 'md',
      content: `
        <form id="form-ban-place" style="display:flex;flex-direction:column;gap:14px" onsubmit="return false">
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;background:var(--surface-2);padding:10px 14px;border-radius:var(--radius-md)">
            ⚠️ <strong>تنبيه:</strong> عند حظر هذا المكان، سيتم إخفاؤه تماماً من كافة صفحات الدليل والبحث والتصنيفات طوال فترة الحظر.
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">نوع ومدة الحظر <span class="required">*</span></label>
            <select id="ban-place-type" class="form-select">
              <option value="temp_7">حظر مؤقت لمدة 7 أيام</option>
              <option value="temp_14">حظر مؤقت لمدة 14 يوماً</option>
              <option value="temp_30" selected>حظر مؤقت لمدة شهر (30 يوماً)</option>
              <option value="temp_90">حظر مؤقت لمدة 3 أشهر (90 يوماً)</option>
              <option value="permanent">🚫 حظر نهائي دائم</option>
            </select>
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">سبب الحظر (ملاحظات الإدارة) <span class="required">*</span></label>
            <textarea id="ban-place-reason" class="form-textarea" rows="3" placeholder="اكتب سبب الحظر هنا..." required>مخالفة شروط وسياسات الاستخدام ونشر محتوى غير مصرح به</textarea>
          </div>
        </form>
      `,
      buttons: [
        {
          label: '🚫 تطبيق الحظر فوراً',
          type: 'danger',
          closeOnClick: false,
          onClick: async () => {
            const typeVal = document.getElementById('ban-place-type')?.value;
            const reason = document.getElementById('ban-place-reason')?.value.trim();
            const isPermanent = typeVal === 'permanent';
            let durationDays = 30;
            if (typeVal === 'temp_7') durationDays = 7;
            else if (typeVal === 'temp_14') durationDays = 14;
            else if (typeVal === 'temp_30') durationDays = 30;
            else if (typeVal === 'temp_90') durationDays = 90;

            try {
              toast.info('جاري تطبيق الحظر...');
              await adminBanPlace(placeId, {
                type: isPermanent ? 'permanent' : 'temporary',
                durationDays,
                reason
              });
              toast.success('تم حظر المكان بنجاح وإخفاؤه من الدليل 🚫');
              modal.close();
              adminCache.places = null;
              await renderAdminPlaces(document.getElementById('admin-main-area'));
            } catch (err) {
              toast.error(err.message || 'فشل تطبيق الحظر');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  };

  window.adminUnbanPlaceAction = async (placeId) => {
    const ok = await showConfirm({
      title: 'إلغاء حظر المكان',
      message: 'هل أنت متأكد من إلغاء الحظر وإعادة هذا المكان للظهور في الدليل والبحث فوراً؟',
      confirmText: 'نعم، فك الحظر',
      cancelText: 'تراجع'
    });
    if (ok) {
      try {
        await adminUnbanPlace(placeId);
        toast.success('تم إلغاء الحظر وإعادة المكان للدليل بنجاح ✅');
        adminCache.places = null;
        await renderAdminPlaces(document.getElementById('admin-main-area'));
      } catch (err) {
        toast.error(err.message || 'فشل إلغاء الحظر');
      }
    }
  };
}

// ─────────────────────────────────────────────
//  1. OVERVIEW & STATISTICS SECTION (نظرة عامة والإحصائيات)
// ─────────────────────────────────────────────
async function renderAdminOverview($container) {
  $container.innerHTML = '<div class="spinner spinner-lg" style="margin:4rem auto"></div>';

  try {
    if (!adminCache.places || !adminCache.users || !adminCache._rawProducts || !adminCache.offers) {
      const [places, users, products, offers, reviews, cats, news] = await Promise.all([
        dbGet('places').catch(() => ({})),
        dbGet('users').catch(() => ({})),
        dbGet('products').catch(() => ({})),
        dbGet('offers').catch(() => ({})),
        getAllReviews().catch(() => []),
        getCategories().catch(() => []),
        getPublishedLiveNews({ limit: 100 }).catch(() => [])
      ]);
      adminCache.places = places || {};
      adminCache.users = users || {};
      // NOTE: raw products from dbGet is a nested object {placeId:{prodId:prod}},
      // not an Array. We keep it separate so renderAdminProducts can fetch via getAllProducts().
      adminCache._rawProducts = products || {};
      adminCache.offers = offers || {};
      adminCache.reviews = reviews || [];
      adminCache.categories = cats || [];
      adminCache.liveNews = news || [];
    }

    const placesList = Object.values(adminCache.places || {});
    const usersList = Object.values(adminCache.users || {});
    // Count products from the raw nested map for the stat card only
    const _rawProds = adminCache._rawProducts || {};
    const productsList = Object.values(_rawProds).flatMap(placeProds =>
      placeProds && typeof placeProds === 'object' ? Object.values(placeProds) : []
    );
    const offersList = Object.values(adminCache.offers || {});
    const reviewsList = adminCache.reviews || [];
    const newsList = adminCache.liveNews || [];

    const totalPlaces = placesList.length;
    const verifiedPlaces = placesList.filter(p => p.isVerified).length;
    const sponsoredPlaces = placesList.filter(p => p.isSponsored && (!p.sponsoredUntil || p.sponsoredUntil > Date.now())).length;
    const totalUsers = usersList.length;
    const totalProducts = productsList.length;
    const totalOffers = offersList.length;
    const totalReviews = reviewsList.length;
    const totalNews = newsList.length;

    // Recent Places (last 5)
    const recentPlaces = [...placesList]
      .sort((a, b) => (Number(b.createdAt || b.updatedAt || 0)) - (Number(a.createdAt || a.updatedAt || 0)))
      .slice(0, 5);

    $container.innerHTML = `
      <div class="admin-fade-in">
        
        <!-- Welcome Header -->
        <div class="dashboard-header" style="margin-bottom:24px">
          <div>
            <h1 class="dashboard-header__title" style="color:#FFFFFF;font-weight:900;display:flex;align-items:center;gap:10px">
              <span>📊</span>
              <span>لوحة الإحصائيات ونظرة عامة</span>
            </h1>
            <div class="dashboard-header__subtitle" style="color:#CBD5E1;font-size:13.5px">
              متابعة حية وشاملة لكافة أنشطة دليل المنزلة والمطرية الرقمي
            </div>
          </div>
        </div>

        <!-- 8 Stat Cards Grid -->
        <div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:28px">
          
          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">إجمالي الأماكن</span>
              <span style="font-size:22px">📍</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#FFFFFF">${totalPlaces.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#38BDF8;margin-top:4px">${verifiedPlaces} مكان موثق رسمي</div>
          </div>

          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">الأماكن الموثقة</span>
              <span style="font-size:22px">👑</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#10B981">${verifiedPlaces.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#34D399;margin-top:4px">موثقة بالعلامة الزرقاء</div>
          </div>

          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">إعلانات نشطة مدفوعة</span>
              <span style="font-size:22px">📢</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#F5A623">${sponsoredPlaces.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#FBBF24;margin-top:4px">تتصدر نتائج البحث أولاً</div>
          </div>

          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">المستخدمين المسجلين</span>
              <span style="font-size:22px">👥</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#8B5CF6">${totalUsers.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#A78BFA;margin-top:4px">حسابات نشطة بالمنصة</div>
          </div>

          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">يحدث الآن (الأخبار)</span>
              <span style="font-size:22px">🔥</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#EF4444">${totalNews.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#F87171;margin-top:4px">تحديثات الطرق وماكينات ATM</div>
          </div>

          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">العروض والخصومات</span>
              <span style="font-size:22px">🛒</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#EC4899">${totalOffers.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#F472B6;margin-top:4px">عروض حصرية نشطة</div>
          </div>

          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">كتالوج المنتجات</span>
              <span style="font-size:22px">📦</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#06B6D4">${totalProducts.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#22D3EE;margin-top:4px">منتجات معروضة للجمهور</div>
          </div>

          <div class="stat-card" style="background:#0F2B48;border:1.5px solid #1E3A5F;border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#94A3B8;font-weight:700">التقييمات والآراء</span>
              <span style="font-size:22px">⭐</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:#F59E0B">${totalReviews.toLocaleString('ar-EG')}</div>
            <div style="font-size:12px;color:#FCD34D;margin-top:4px">تقييم ومراجعة موثوقة</div>
          </div>

        </div>

        <!-- Quick Shortcuts Grid -->
        <div style="background:#0F2B48;border-radius:18px;padding:22px;border:1px solid rgba(255,255,255,0.1);margin-bottom:28px">
          <h2 style="font-size:16px;font-weight:800;color:#FFFFFF;margin:0 0 16px 0;display:flex;align-items:center;gap:8px">
            <span>⚡</span>
            <span>روابط وإجراءات سريعة</span>
          </h2>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a href="admin.html?section=places" class="btn btn-sm" style="background:#1B4F72;color:#fff;border-radius:10px;font-weight:800;padding:8px 16px;text-decoration:none">
              📍 إدارة الأماكن
            </a>
            <a href="admin.html?section=live-news" class="btn btn-sm" style="background:#EF4444;color:#fff;border-radius:10px;font-weight:800;padding:8px 16px;text-decoration:none">
              🔥 نشر خبر في يحدث الآن
            </a>
            <a href="admin.html?section=verification" class="btn btn-sm" style="background:#10B981;color:#fff;border-radius:10px;font-weight:800;padding:8px 16px;text-decoration:none">
              👑 طلبات التوثيق
            </a>
            <a href="admin.html?section=users" class="btn btn-sm" style="background:#8B5CF6;color:#fff;border-radius:10px;font-weight:800;padding:8px 16px;text-decoration:none">
              👥 رتب ونقاط المستخدمين
            </a>
            <a href="admin.html?section=reviews" class="btn btn-sm" style="background:#F5A623;color:#0B1E30;border-radius:10px;font-weight:800;padding:8px 16px;text-decoration:none">
              ⭐ إدارة التقييمات
            </a>
            <a href="admin.html?section=settings" class="btn btn-sm" style="background:#334155;color:#fff;border-radius:10px;font-weight:800;padding:8px 16px;text-decoration:none">
              ⚙️ إعدادات المنصة وبوت تليجرام
            </a>
          </div>
        </div>

        <!-- Recent Places Table -->
        <div style="background:#0F2B48;border-radius:18px;padding:22px;border:1px solid rgba(255,255,255,0.1)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
            <h2 style="font-size:16px;font-weight:800;color:#FFFFFF;margin:0;display:flex;align-items:center;gap:8px">
              <span>🆕</span>
              <span>أحدث الأماكن المسجلة حديثاً</span>
            </h2>
            <a href="admin.html?section=places" style="color:#38BDF8;font-size:13px;font-weight:800;text-decoration:none">
              عرض كل الأماكن (${totalPlaces}) ←
            </a>
          </div>

          <div class="dashboard-table-wrapper" style="border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden">
            <table class="dashboard-table">
              <thead style="background:#0B1E30;color:#F8FAFC">
                <tr>
                  <th style="color:#F8FAFC;font-weight:800">اسم المكان</th>
                  <th style="color:#F8FAFC;font-weight:800">التصنيف</th>
                  <th style="color:#F8FAFC;font-weight:800">المنطقة</th>
                  <th style="color:#F8FAFC;font-weight:800">الهاتف</th>
                  <th style="color:#F8FAFC;font-weight:800">الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${recentPlaces.map(p => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
                    <td style="padding:10px 14px">
                      <strong style="color:#FFFFFF">${escHtml(p.name)}</strong>
                      ${p.isVerified ? '<span style="color:#10B981;font-size:11px;font-weight:800;margin-right:6px">✓ موثق</span>' : ''}
                    </td>
                    <td style="color:#E2E8F0;font-weight:700">${escHtml(p.categoryName || p.categoryId || 'عام')}</td>
                    <td style="color:#FCD34D;font-weight:800">📍 ${escHtml(p.area || 'المنزلة')}</td>
                    <td style="color:#38BDF8;font-weight:700">${escHtml(p.phone || '—')}</td>
                    <td>${renderStatusBadge(p.status || 'published')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    console.error('[Admin] Error rendering overview:', err);
    $container.innerHTML = `
      <div class="empty-state" style="padding:3rem 1rem">
        <span class="empty-state__icon">⚠️</span>
        <h3>تعذر تحميل الإحصائيات</h3>
        <p style="color:var(--danger)">${escHtml(err.message || 'خطأ غير متوقع')}</p>
        <button class="btn btn-primary" onclick="window.refreshCurrentAdminSection()">إعادة المحاولة</button>
      </div>
    `;
  }
}

// ─────────────────────────────────────────────
//  PRELOAD & PLACES MANAGEMENT
// ─────────────────────────────────────────────
async function preloadAdminData() {
  if (adminCache.isPreloaded) return;
  adminCache.isPreloaded = true;
  try {
    const [places, categories, settings, reviews] = await Promise.all([
      dbGet('places'),
      getCategories(),
      getSettings(),
      getAllReviews().catch(() => [])
    ]);
    adminCache.places = places || {};
    adminCache.categories = categories || [];
    adminCache.settings = settings || {};
    adminCache.reviews = reviews || [];
  } catch (err) {
    console.debug('[Admin] Preload cached gracefully:', err.message);
  }
}

async function renderAdminPlaces($container) {
  if (!adminCache.places) {
    adminCache.places = (await dbGet('places')) || {};
  }
  
  // Sort places by Latest Added First (الأحدث إضافة أولاً في الأعلى)
  const allPlaces = Object.entries(adminCache.places || {})
    .map(([id, p]) => ({ ...p, _id: p._id || p.id || id }))
    .sort((a, b) => {
      const timeA = Number(a.createdAt || a.updatedAt || a.publishedAt || 0);
      const timeB = Number(b.createdAt || b.updatedAt || b.publishedAt || 0);
      return timeB - timeA;
    });

  let currentPage = 1;
  let pageSize = 25; // default 25 places per page for instant zero-lag rendering
  let filteredPlaces = [...allPlaces];

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header" style="margin-bottom:20px">
        <div>
          <h1 class="dashboard-header__title" style="color:#FFFFFF;font-weight:900;display:flex;align-items:center;gap:8px">
            <span>📍</span>
            <span>إدارة الأماكن والأنشطة</span>
            <span class="badge" id="admin-places-total-badge" style="background:#F5A623;color:#0B1E30;font-size:13px;font-weight:900;padding:2px 10px;border-radius:9999px">
              ${allPlaces.length} مكان
            </span>
          </h1>
          <div class="dashboard-header__subtitle" style="color:#CBD5E1;font-size:13px">
            الأماكن مرتبة بالأحدث إضافة أولاً — نظام متطور يدعم آلاف الأماكن بسرعة فائقة وتصفح مرن
          </div>
        </div>
      </div>

      <!-- Search Filter & Actions -->
      <div class="filter-bar" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:#0F2B48;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,0.1)">
        <div style="flex:1;min-width:280px;max-width:500px;position:relative">
          <input type="search" id="admin-place-search" class="form-input" placeholder="🔍 بحث فوري بالاسم، المالك، المنطقة، الهاتف أو التصنيف..." style="width:100%;margin:0;background:#1B4F72;color:#fff;border-color:rgba(255,255,255,0.2);padding-left:36px" />
        </div>
        
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn btn-success" id="btn-export-places-excel" style="display:inline-flex;align-items:center;gap:8px;font-weight:800;padding:10px 18px;background:#10B981;border-color:#10B981;color:#fff;border-radius:10px;box-shadow:0 3px 12px rgba(16,185,129,0.3);cursor:pointer;transition:all 0.2s" title="تصدير جميع بيانات الأنشطة والأماكن إلى ملف Excel منسق بالكامل بالحدود والألوان">
            <span style="font-size:16px">📊</span>
            <span>تصدير ملف Excel (.xlsx / .xls)</span>
          </button>
        </div>
      </div>

      <!-- Places Table -->
      <div class="dashboard-table-wrapper" style="background:#0F2B48;border-radius:14px;border:1px solid rgba(255,255,255,0.12);overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.2)">
        <table class="dashboard-table" style="color:#FFFFFF;width:100%;border-collapse:collapse">
          <thead style="background:#0B1E30;color:#F8FAFC">
            <tr>
              <th style="color:#F8FAFC;font-weight:800;padding:12px 14px">المكان / المالك</th>
              <th style="color:#F8FAFC;font-weight:800;padding:12px 14px">التصنيف</th>
              <th style="color:#F8FAFC;font-weight:800;padding:12px 14px">المنطقة</th>
              <th style="color:#F8FAFC;font-weight:800;padding:12px 14px">إعلان مدفوع ⭐</th>
              <th style="color:#F8FAFC;font-weight:800;padding:12px 14px">التوثيق</th>
              <th style="color:#F8FAFC;font-weight:800;padding:12px 14px">الحالة</th>
              <th style="color:#F8FAFC;font-weight:800;padding:12px 14px;min-width:180px">إجراءات</th>
            </tr>
          </thead>
          <tbody id="admin-places-tbody">
            <!-- Rows rendered dynamically by renderCurrentPage() -->
          </tbody>
        </table>
      </div>

      <!-- Pagination & Performance Controls -->
      <div id="admin-places-pagination-container" style="margin-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;background:#0F2B48;padding:12px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);color:#fff">
        <div id="admin-places-page-info" style="font-size:13px;font-weight:700;color:#CBD5E1">
          جاري تجهيز الصفحات...
        </div>

        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#CBD5E1">
            <span>عرض بالصفحة:</span>
            <select id="admin-places-page-size" class="form-select" style="width:auto;padding:5px 12px;margin:0;font-size:12.5px;font-weight:700;background:#1B4F72;color:#fff;border-color:rgba(255,255,255,0.2);border-radius:8px;cursor:pointer">
              <option value="25" selected>25 مكان</option>
              <option value="50">50 مكان</option>
              <option value="100">100 مكان</option>
              <option value="all">عرض الكل بدون تقسيم</option>
            </select>
          </div>

          <div id="admin-places-pagination-buttons" style="display:flex;align-items:center;gap:4px">
            <!-- Buttons dynamically generated -->
          </div>
        </div>
      </div>
    </div>
  `;

  const tbody = document.getElementById('admin-places-tbody');
  const pageInfo = document.getElementById('admin-places-page-info');
  const pageButtons = document.getElementById('admin-places-pagination-buttons');
  const pageSizeSelect = document.getElementById('admin-places-page-size');
  const searchInput = document.getElementById('admin-place-search');
  const totalBadge = document.getElementById('admin-places-total-badge');

  function renderCurrentPage() {
    const total = filteredPlaces.length;
    const isAll = pageSize === 'all';
    const numPageSize = isAll ? total : Number(pageSize);
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / numPageSize));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = isAll ? 0 : (currentPage - 1) * numPageSize;
    const endIdx = isAll ? total : Math.min(startIdx + numPageSize, total);
    const pagedItems = filteredPlaces.slice(startIdx, endIdx);

    if (tbody) tbody.innerHTML = renderAdminPlacesTableRows(pagedItems);

    if (pageInfo) {
      if (total === 0) {
        pageInfo.textContent = 'لا توجد نتائج مطابقة للبحث';
      } else {
        pageInfo.innerHTML = `عرض <strong style="color:#F5A623">${startIdx + 1}</strong> إلى <strong style="color:#F5A623">${endIdx}</strong> من إجمالي <strong style="color:#38BDF8">${total}</strong> مكان ${total !== allPlaces.length ? `(مفلترة من ${allPlaces.length})` : ''}`;
      }
    }

    if (totalBadge) {
      totalBadge.textContent = `${total} مكان`;
    }

    // Render Pagination Buttons
    if (pageButtons) {
      if (isAll || totalPages <= 1) {
        pageButtons.innerHTML = '';
      } else {
        let btnHtml = '';
        
        // Prev button
        const prevDisabled = currentPage <= 1;
        btnHtml += `<button type="button" class="btn btn-xs btn-page-nav" data-page="${currentPage - 1}" ${prevDisabled ? 'disabled style="opacity:0.4;cursor:not-allowed"' : 'style="cursor:pointer"'} style="background:#1B4F72;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-weight:800">السابق ‹</button>`;

        // Smart range of pages (show max 5 surrounding page numbers)
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        if (startPage > 1) {
          btnHtml += `<button type="button" class="btn btn-xs btn-page-num" data-page="1" style="background:#1B4F72;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-weight:800">1</button>`;
          if (startPage > 2) btnHtml += `<span style="color:#64748B;padding:0 2px">…</span>`;
        }

        for (let p = startPage; p <= endPage; p++) {
          const isActive = p === currentPage;
          btnHtml += `<button type="button" class="btn btn-xs btn-page-num" data-page="${p}" style="background:${isActive ? '#F5A623' : '#1B4F72'};color:${isActive ? '#0B1E30' : '#fff'};border:none;border-radius:6px;padding:6px 10px;font-weight:900;cursor:pointer">${p}</button>`;
        }

        if (endPage < totalPages) {
          if (endPage < totalPages - 1) btnHtml += `<span style="color:#64748B;padding:0 2px">…</span>`;
          btnHtml += `<button type="button" class="btn btn-xs btn-page-num" data-page="${totalPages}" style="background:#1B4F72;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-weight:800">${totalPages}</button>`;
        }

        // Next button
        const nextDisabled = currentPage >= totalPages;
        btnHtml += `<button type="button" class="btn btn-xs btn-page-nav" data-page="${currentPage + 1}" ${nextDisabled ? 'disabled style="opacity:0.4;cursor:not-allowed"' : 'style="cursor:pointer"'} style="background:#1B4F72;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-weight:800">التالي ›</button>`;

        pageButtons.innerHTML = btnHtml;
      }
    }
  }

  // Delegated handler for pagination buttons
  pageButtons?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    const targetPage = Number(btn.getAttribute('data-page'));
    if (!isNaN(targetPage) && targetPage > 0) {
      currentPage = targetPage;
      renderCurrentPage();
      const tableWrapper = document.querySelector('.dashboard-table-wrapper');
      if (tableWrapper) tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Page Size change handler
  pageSizeSelect?.addEventListener('change', (e) => {
    pageSize = e.target.value;
    currentPage = 1;
    renderCurrentPage();
  });

  // Fast Debounced Search Filter
  let searchTimer = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = e.target.value.trim();
      if (!q) {
        filteredPlaces = [...allPlaces];
      } else {
        const normQ = normalizeArabic(q);
        const normDigits = q.replace(/[^0-9]/g, '');
        filteredPlaces = allPlaces.filter(p => {
          if (arabicMatch(p.name, q)) return true;
          if (normDigits && p.phone && p.phone.includes(normDigits)) return true;
          if (p.area && arabicMatch(p.area, q)) return true;
          if (p.address && arabicMatch(p.address, q)) return true;
          if (p.categoryName && arabicMatch(p.categoryName, q)) return true;
          if (p.categoryId && arabicMatch(p.categoryId, q)) return true;
          if (p.ownerName && arabicMatch(p.ownerName, q)) return true;
          if (p.ownerEmail && p.ownerEmail.toLowerCase().includes(q.toLowerCase())) return true;
          if (p.description && arabicMatch(p.description, q)) return true;
          return false;
        });
      }
      currentPage = 1;
      renderCurrentPage();
    }, 120);
  });

  // Delegated Click Event Listener on tbody for 100% Reliable Action Handling
  tbody?.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;
    const action = actionBtn.getAttribute('data-action');
    const id = actionBtn.getAttribute('data-id');
    if (!id) return;

    if (action === 'edit') {
      if (typeof window.editPlaceAdmin === 'function') window.editPlaceAdmin(id);
    } else if (action === 'delete') {
      if (typeof window.deletePlaceAdmin === 'function') window.deletePlaceAdmin(id);
    } else if (action === 'transfer') {
      if (typeof window.transferPlaceOwnershipAdmin === 'function') window.transferPlaceOwnershipAdmin(id);
    } else if (action === 'ban') {
      const placeName = actionBtn.getAttribute('data-name') || '';
      if (typeof window.adminBanPlaceAction === 'function') window.adminBanPlaceAction(id, placeName);
    } else if (action === 'unban') {
      if (typeof window.adminUnbanPlaceAction === 'function') window.adminUnbanPlaceAction(id);
    } else if (action === 'toggle-sponsored') {
      const status = actionBtn.getAttribute('data-status') === 'true';
      if (typeof window.togglePlaceSponsored === 'function') window.togglePlaceSponsored(id, status);
    } else if (action === 'toggle-verify') {
      const status = actionBtn.getAttribute('data-status') === 'true';
      if (typeof window.togglePlaceVerification === 'function') window.togglePlaceVerification(id, status);
    }
  });

  document.getElementById('btn-export-places-excel')?.addEventListener('click', exportPlacesToExcel);

  // Initial render
  renderCurrentPage();
}

function renderAdminPlacesTableRows(places) {
  if (!places.length) {
    return '<tr><td colspan="7" class="text-center" style="color:#94A3B8;padding:2.5rem;font-weight:700">لا توجد أماكن مطابقة للبحث</td></tr>';
  }

  return places.map(p => {
    const isAtm = isAtmPlace(p);
    const isSpons = Boolean(p.isSponsored || p.isFeatured || p.isPromoted);
    const isExpired = isSpons && p.sponsoredUntil && p.sponsoredUntil <= Date.now();
    const isCurrentlyActive = isSpons && !isExpired;

    let buttonHtml = '';
    if (isAtm) {
      buttonHtml = `<span class="badge" style="background:#1B4F72;color:#38BDF8;font-size:11px;font-weight:800;padding:4px 8px;border-radius:6px">🏧 صراف آلي</span>`;
    } else if (isCurrentlyActive) {
      const expText = p.sponsoredUntil ? `ينتهي: ${formatDate(p.sponsoredUntil)}` : 'دائم';
      buttonHtml = `<button type="button" class="btn btn-xs" data-action="toggle-sponsored" data-id="${escAttr(p._id)}" data-status="false" style="background:#10B981;color:#fff;font-weight:800;border:none;border-radius:6px;padding:4px 8px;cursor:pointer" title="${expText} - انقر للإلغاء">⭐ نشط (${expText}) ✕</button>`;
    } else if (isExpired) {
      buttonHtml = `<button type="button" class="btn btn-xs" data-action="toggle-sponsored" data-id="${escAttr(p._id)}" data-status="true" style="background:#D97706;color:#fff;font-weight:800;border:none;border-radius:6px;padding:4px 8px;cursor:pointer" title="انتهت مدة الإعلان - انقر للتجديد">⚠️ انتهى الإعلان (تجديد)</button>`;
    } else {
      buttonHtml = `<button type="button" class="btn btn-xs" data-action="toggle-sponsored" data-id="${escAttr(p._id)}" data-status="true" style="background:#1E3A5F;color:#94A3B8;border:1px solid rgba(255,255,255,0.15);font-weight:800;border-radius:6px;padding:4px 8px;cursor:pointer" title="تعيين كإعلان مدفوع في قمة كل الصفحات">📢 تعيين كإعلان</button>`;
    }

    const banned = isPlaceBanned(p);
    let statusBadgeHtml = '';
    if (banned) {
      const banText = p.isPermanentlyBanned || !p.bannedUntil
        ? '🚫 محظور نهائياً'
        : `⏳ محظور حتى ${formatDate(p.bannedUntil)}`;
      statusBadgeHtml = `<span class="badge" style="background:#DC2626;color:#fff;font-weight:800;padding:4px 8px;border-radius:6px" title="${escAttr(p.banReason || 'مخالفة الشروط')}">${banText}</span>`;
    } else {
      statusBadgeHtml = renderStatusBadge(p.status || 'published');
    }

    let banButtonHtml = '';
    if (banned) {
      banButtonHtml = `<button type="button" class="btn btn-xs" data-action="unban" data-id="${escAttr(p._id)}" style="background:#10B981;color:#fff;border:none;font-weight:800;border-radius:6px;cursor:pointer;padding:5px 8px" title="إلغاء الحظر وإعادة المكان للدليل فوراً">✅ فك الحظر</button>`;
    } else {
      banButtonHtml = `<button type="button" class="btn btn-xs" data-action="ban" data-id="${escAttr(p._id)}" data-name="${escAttr(p.name)}" style="background:rgba(239,68,68,0.2);color:#F87171;border:1px solid #EF4444;font-weight:800;border-radius:6px;cursor:pointer;padding:5px 8px" title="حظر هذا المكان مؤقتاً أو نهائياً">🚫 حظر</button>`;
    }

    const targetSlug = p.slug || p._id || p.id;

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08);background:${banned ? 'rgba(239,68,68,0.1)' : 'transparent'}">
        <td style="padding:12px 14px">
          <strong style="color:#FFFFFF;font-size:14px;display:block;margin-bottom:2px">${escHtml(p.name)}</strong>
          ${p.phone ? `<div style="font-size:12px;color:#38BDF8;font-weight:700">📞 ${escHtml(p.phone)}</div>` : ''}
          <div style="font-size:11.5px;margin-top:4px">
            ${p.ownerId 
              ? `<span style="color:#FBBF24;font-weight:800">👤 المالك: ${escHtml(p.ownerName || p.ownerEmail || p.ownerId.slice(0, 8))}</span>` 
              : `<span style="color:#94A3B8">👤 المالك: بدون مستخدم (المنصة)</span>`
            }
          </div>
        </td>
        <td style="color:#E2E8F0;font-weight:700;padding:12px 14px">${escHtml(p.categoryName || p.categoryId || 'عام')}</td>
        <td style="color:#FCD34D;font-weight:800;padding:12px 14px">📍 ${escHtml(p.area || 'المنزلة')}</td>
        <td style="padding:12px 14px">${buttonHtml}</td>
        <td style="padding:12px 14px">
          <button type="button" class="btn btn-xs" data-action="toggle-verify" data-id="${escAttr(p._id)}" data-status="${!p.isVerified}" style="background:${p.isVerified ? '#DC2626' : '#F5A623'};color:${p.isVerified ? '#fff' : '#0B1E30'};font-weight:800;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:4px">
            <span style="pointer-events:none;display:inline-flex">${p.isVerified ? ICONS.x : ICONS.shield}</span>
            <span>${p.isVerified ? 'إلغاء التوثيق' : 'توثيق'}</span>
          </button>
        </td>
        <td style="padding:12px 14px">${statusBadgeHtml}</td>
        <td style="padding:12px 14px">
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            ${banButtonHtml}
            <button type="button" class="btn btn-xs" data-action="transfer" data-id="${escAttr(p._id)}" style="background:#8B5CF6;color:#fff;border:none;font-weight:800;border-radius:6px;padding:5px 8px;cursor:pointer;display:inline-flex;align-items:center;gap:4px" title="نقل ملكية هذا المكان لمستخدم مسجل"><span style="pointer-events:none;display:inline-flex">${ICONS.users}</span><span>نقل</span></button>
            <button type="button" class="btn btn-xs" data-action="edit" data-id="${escAttr(p._id)}" style="background:#0284C7;color:#fff;border:none;font-weight:800;border-radius:6px;padding:5px 8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center" title="تعديل كافة بيانات المكان أو الشخص"><span style="pointer-events:none;display:inline-flex">${ICONS.edit}</span></button>
            <a href="place.html?slug=${encodeURIComponent(targetSlug)}" target="_blank" class="btn btn-xs" style="background:#334155;color:#fff;border:none;font-weight:800;border-radius:6px;padding:5px 8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center" title="عرض صفحة المكان"><span style="pointer-events:none;display:inline-flex">${ICONS.eye}</span></a>
            <button type="button" class="btn btn-xs" data-action="delete" data-id="${escAttr(p._id)}" style="background:#EF4444;color:#fff;border:none;font-weight:800;border-radius:6px;padding:5px 8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center" title="حذف المكان"><span style="pointer-events:none;display:inline-flex">${ICONS.trash}</span></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

export async function exportPlacesToExcel() {
  const exportBtn = document.getElementById('btn-export-places-excel');
  if (exportBtn) {
    exportBtn.classList.add('loading');
    exportBtn.disabled = true;
  }

  try {
    if (!adminCache.places || !adminCache.users) {
      const [u, p] = await Promise.all([dbGet('users'), dbGet('places')]);
      adminCache.users = u || {};
      adminCache.places = p || {};
    }

    const places = Object.entries(adminCache.places || {}).map(([id, p]) => ({ ...p, _id: id }));
    const usersMap = adminCache.users || {};

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<?mso-application progid="Excel.Sheet"?>\n' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:o="urn:schemas-microsoft-com:office:office"\n' +
      ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n' +
      ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:html="http://www.w3.org/TR/REC-html40">\n' +
      '<Worksheet ss:Name="دليل الأماكن"><Table>\n';

    // Header Row
    xml += '<Row><Cell><Data ss:Type="String">اسم المكان</Data></Cell><Cell><Data ss:Type="String">التصنيف</Data></Cell><Cell><Data ss:Type="String">المنطقة</Data></Cell><Cell><Data ss:Type="String">الهاتف</Data></Cell><Cell><Data ss:Type="String">الحالة</Data></Cell><Cell><Data ss:Type="String">موثق</Data></Cell></Row>\n';

    places.forEach(p => {
      xml += '<Row>' +
        '<Cell><Data ss:Type="String">' + escXml(p.name || '') + '</Data></Cell>' +
        '<Cell><Data ss:Type="String">' + escXml(p.categoryName || p.categoryId || '') + '</Data></Cell>' +
        '<Cell><Data ss:Type="String">' + escXml(p.area || '') + '</Data></Cell>' +
        '<Cell><Data ss:Type="String">' + escXml(p.phone || '') + '</Data></Cell>' +
        '<Cell><Data ss:Type="String">' + escXml(p.status || 'published') + '</Data></Cell>' +
        '<Cell><Data ss:Type="String">' + (p.isVerified ? 'نعم' : 'لا') + '</Data></Cell>' +
        '</Row>\n';
    });

    xml += '</Table></Worksheet></Workbook>';

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dalil_manzala_places_' + new Date().toISOString().split('T')[0] + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تصدير ملف الإكسيل بنجاح! 📊');
  } catch (err) {
    toast.error('فشل تصدير الإكسيل: ' + err.message);
  } finally {
    if (exportBtn) {
      exportBtn.classList.remove('loading');
      exportBtn.disabled = false;
    }
  }
}

function escXml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
//  2.4. Products Moderation (المنتجات والمراجعة)
// ─────────────────────────────────────────────
async function renderAdminProducts($container) {
  if (!Array.isArray(adminCache.products)) {
    adminCache.products = await getAllProducts();
  }
  const products = adminCache.products || [];

  const totalProds = products.length;
  const pendingProds = products.filter(p => p.status === 'pending' || (!p.status && p.isApproved === false));
  const approvedProds = products.filter(p => p.status === 'approved' || p.isApproved === true || (!p.status && p.isApproved === undefined));
  const rejectedProds = products.filter(p => p.status === 'rejected');

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="dashboard-header__title">إدارة ومراجعة المنتجات (${totalProds})</h1>
          <div class="dashboard-header__subtitle">مراجعة منتجات الأنشطة الموثقة والموافقة عليها لمنع المنتجات المخالفة أو المحظورة</div>
        </div>
        <button class="btn btn-outline" id="btn-refresh-products" style="gap:6px">
          <span>🔄</span> تحديث القائمة
        </button>
      </div>

      <!-- Quick KPI Stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:var(--space-5)">
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">إجمالي المنتجات</div>
          <div style="font-size:1.8rem;font-weight:800;color:var(--primary)">${totalProds}</div>
        </div>
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">قيد المراجعة والاعتماد ⏳</div>
          <div style="font-size:1.8rem;font-weight:800;color:#F59E0B">${pendingProds.length}</div>
        </div>
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">معتمدة ومفعلة ✓</div>
          <div style="font-size:1.8rem;font-weight:800;color:#10B981">${approvedProds.length}</div>
        </div>
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">منتجات مرفوضة ✕</div>
          <div style="font-size:1.8rem;font-weight:800;color:#EF4444">${rejectedProds.length}</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;background:var(--surface);padding:12px 16px;border-radius:var(--radius-md);border:1px solid var(--border)">
        <div style="flex:1;min-width:220px">
          <input type="search" id="admin-products-search" class="form-input" placeholder="🔍 بحث باسم المنتج أو المكان أو التصنيف..." style="margin:0" />
        </div>
        <div style="min-width:180px">
          <select id="admin-products-status-filter" class="form-select" style="margin:0">
            <option value="">كل المنتجات</option>
            <option value="pending" ${pendingProds.length > 0 ? 'selected' : ''}>⏳ قيد المراجعة (${pendingProds.length})</option>
            <option value="approved">✓ المعتمدة (${approvedProds.length})</option>
            <option value="rejected">✕ المرفوضة (${rejectedProds.length})</option>
          </select>
        </div>
      </div>

      <!-- Products Table -->
      <div class="dashboard-table-wrapper">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th style="width:70px">الصورة</th>
              <th>المنتج</th>
              <th>المكان التابع له</th>
              <th>السعر</th>
              <th>الحالة</th>
              <th>تاريخ الإضافة</th>
              <th>إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody id="admin-products-tbody">
            ${renderAdminProductsTableRows(pendingProds.length > 0 ? pendingProds : products)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const searchInput = document.getElementById('admin-products-search');
  const statusFilter = document.getElementById('admin-products-status-filter');
  const tbody = document.getElementById('admin-products-tbody');
  const refreshBtn = document.getElementById('btn-refresh-products');

  const applyFilters = () => {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const st = statusFilter?.value || '';

    const filtered = products.filter(p => {
      const matchQ = !q || (p.name || '').toLowerCase().includes(q) || (p.placeName || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      let matchSt = true;
      if (st === 'pending') matchSt = p.status === 'pending' || (!p.status && p.isApproved === false);
      else if (st === 'approved') matchSt = p.status === 'approved' || p.isApproved === true || (!p.status && p.isApproved === undefined);
      else if (st === 'rejected') matchSt = p.status === 'rejected';
      return matchQ && matchSt;
    });

    if (tbody) tbody.innerHTML = renderAdminProductsTableRows(filtered);
  };

  searchInput?.addEventListener('input', applyFilters);
  statusFilter?.addEventListener('change', applyFilters);

  refreshBtn?.addEventListener('click', async () => {
    adminCache.products = null;
    toast.info('جاري تحديث قائمة المنتجات...');
    await renderAdminProducts($container);
  });
}

function renderAdminProductsTableRows(products) {
  if (!products.length) {
    return '<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--text-muted)">لا توجد منتجات مطابقة لهذا الفلتر</td></tr>';
  }

  return products.map(p => {
    const isPending = p.status === 'pending' || (!p.status && p.isApproved === false);
    const isApproved = p.status === 'approved' || p.isApproved === true || (!p.status && p.isApproved === undefined);
    const isRejected = p.status === 'rejected';

    let badge = '';
    if (isPending) {
      badge = '<span class="badge" style="background:#FEF3C7;color:#D97706;font-weight:700">⏳ قيد المراجعة</span>';
    } else if (isApproved) {
      badge = '<span class="badge badge--success">✓ معتمد ومفعل</span>';
    } else {
      badge = `<span class="badge badge--danger" title="${escAttr(p.rejectReason || '')}">✕ مرفوض</span>`;
    }

    const img = p.imageUrl || './icons/icon-192x192.png';

    return `
      <tr>
        <td>
          <img src="${escAttr(img)}" alt="${escAttr(p.name)}" style="width:48px;height:48px;object-fit:cover;border-radius:var(--radius-md);border:1px solid var(--border)" onerror="this.src='./icons/icon-192x192.png'" />
        </td>
        <td>
          <div style="font-weight:700">${escHtml(p.name)}</div>
          ${p.description ? `<div style="font-size:12px;color:var(--text-muted);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p.description)}</div>` : ''}
          ${p.category ? `<span class="badge" style="font-size:10px;margin-top:4px">${escHtml(p.category)}</span>` : ''}
        </td>
        <td>
          <a href="place.html?slug=${escAttr(p.placeSlug || p.placeId)}" target="_blank" style="font-weight:600;color:var(--primary);display:inline-flex;align-items:center;gap:4px">
            ${escHtml(p.placeName || 'المكان')} ${ICONS.eye}
          </a>
        </td>
        <td style="font-weight:700;color:var(--accent)">
          ${p.price ? `${p.price} ج.م` : 'غير محدد'}
          ${p.oldPrice ? `<span style="font-size:11px;color:var(--text-muted);text-decoration:line-through;margin-right:4px">${p.oldPrice} ج.م</span>` : ''}
        </td>
        <td>
          ${badge}
          ${isRejected && p.rejectReason ? `<div style="font-size:11px;color:var(--danger);margin-top:3px">${escHtml(p.rejectReason)}</div>` : ''}
        </td>
        <td style="font-size:12px;color:var(--text-muted)">
          ${p.createdAt ? formatDate(p.createdAt) : '—'}
        </td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn btn-xs btn-outline" style="background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE" onclick="adminViewProductAction('${escAttr(p.placeId)}', '${escAttr(p.id)}')" title="مشاهدة تفاصيل وصورة المنتج">
              ${ICONS.eye} مشاهدة
            </button>
            <button class="btn btn-xs btn-outline" style="background:#F0FDF4;color:#15803D;border-color:#BBF7D0" onclick="adminEditProductAction('${escAttr(p.placeId)}', '${escAttr(p.id)}')" title="تعديل بيانات وسعر وصورة المنتج">
              ${ICONS.edit} تعديل
            </button>
            ${!isApproved ? `
              <button class="btn btn-xs btn-success" onclick="adminApproveProductAction('${escAttr(p.placeId)}', '${escAttr(p.id)}')" title="الموافقة على المنتج وتفعيله في صفحة المكان">
                ✓ اعتماد
              </button>
            ` : ''}
            ${!isRejected ? `
              <button class="btn btn-xs btn-outline" style="color:#DC2626;border-color:#FCA5A5" onclick="adminRejectProductAction('${escAttr(p.placeId)}', '${escAttr(p.id)}', '${escAttr(p.name)}')" title="رفض المنتج وتحديد السبب">
                ✕ رفض
              </button>
            ` : ''}
            <button class="btn btn-xs btn-danger" onclick="adminDeleteProductAction('${escAttr(p.placeId)}', '${escAttr(p.id)}')" title="حذف المنتج نهائياً">
              ${ICONS.trash}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

if (typeof window !== 'undefined') {
  window.adminViewProductAction = async (placeId, productId) => {
    const products = Array.isArray(adminCache.products) ? adminCache.products : (await getAllProducts());
    const prod = products.find(p => p.id === productId && p.placeId === placeId) || (await dbGet(`places/${placeId}/products/${productId}`));
    
    if (!prod) {
      toast.error('لم يتم العثور على بيانات المنتج');
      return;
    }

    const modal = showModal({
      title: `🛍️ تفاصيل المنتج: ${escHtml(prod.name || '')}`,
      size: 'md',
      content: `
        <div style="display:flex;flex-direction:column;gap:14px;padding:4px">
          ${prod.imageUrl ? `
            <div style="width:100%;height:220px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);background:var(--surface-2);display:flex;align-items:center;justify-content:center">
              <img src="${escAttr(prod.imageUrl)}" alt="${escAttr(prod.name)}" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.src='./icons/icon-192x192.png'" />
            </div>
          ` : ''}

          <div style="background:var(--surface-2);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap">
              <h3 style="margin:0;font-size:1.15rem;color:var(--text-primary)">${escHtml(prod.name)}</h3>
              <span class="badge ${prod.status === 'approved' || prod.isApproved === true ? 'badge--success' : (prod.status === 'rejected' ? 'badge--danger' : 'badge--warning')}">
                ${prod.status === 'approved' || prod.isApproved === true ? '✓ معتمد ومفعل' : (prod.status === 'rejected' ? '✕ مرفوض' : '⏳ قيد المراجعة')}
              </span>
            </div>

            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
              ${escHtml(prod.description || 'لا يوجد وصف مضاف لهذا المنتج.')}
            </div>

            <div style="display:flex;align-items:center;gap:14px;padding-top:10px;border-top:1px dashed var(--border);flex-wrap:wrap">
              <div>
                <span style="font-size:12px;color:var(--text-muted)">السعر: </span>
                <strong style="font-size:1.25rem;color:var(--primary)">${prod.price || 0} ج.م</strong>
              </div>
              ${prod.oldPrice ? `
                <div>
                  <span style="font-size:12px;color:var(--text-muted)">السعر السابق: </span>
                  <span style="text-decoration:line-through;color:var(--text-muted);font-size:1.05rem">${prod.oldPrice} ج.م</span>
                </div>
              ` : ''}
              ${prod.category ? `
                <span class="badge" style="font-size:11px;background:var(--surface);border:1px solid var(--border)">🏷️ ${escHtml(prod.category)}</span>
              ` : ''}
            </div>
          </div>

          <div style="font-size:12px;color:var(--text-muted);display:flex;justify-content:space-between;padding:0 4px;flex-wrap:wrap;gap:6px">
            <span>🏪 تابع لمكان: <strong>${escHtml(prod.placeName || 'غير محدد')}</strong></span>
            <span>📅 تاريخ الإضافة: <strong>${prod.createdAt ? formatDate(prod.createdAt) : '—'}</strong></span>
          </div>
        </div>
      `,
      buttons: [
        {
          label: '✏️ تعديل هذا المنتج',
          type: 'primary',
          onClick: () => {
            modal.close();
            adminEditProductAction(placeId, productId);
          }
        },
        { label: 'إغلاق', type: 'ghost', closeOnClick: true }
      ]
    });
  };

  window.adminEditProductAction = async (placeId, productId) => {
    const products = Array.isArray(adminCache.products) ? adminCache.products : (await getAllProducts());
    const prod = products.find(p => p.id === productId && p.placeId === placeId) || (await dbGet(`places/${placeId}/products/${productId}`));
    
    if (!prod) {
      toast.error('لم يتم العثور على بيانات المنتج');
      return;
    }

    const modal = showModal({
      title: `✏️ تعديل المنتج: ${escHtml(prod.name || '')}`,
      size: 'md',
      content: `
        <form id="admin-edit-prod-form" onsubmit="return false">
          <div class="form-group">
            <label class="form-label">اسم المنتج <span class="required">*</span></label>
            <input type="text" id="aeprod-name" class="form-input" value="${escAttr(prod.name || '')}" required />
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group">
              <label class="form-label">السعر الحالي (ج.م) <span class="required">*</span></label>
              <input type="number" id="aeprod-price" class="form-input" value="${prod.price || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label">السعر القديم قبل الخصم</label>
              <input type="number" id="aeprod-oldPrice" class="form-input" value="${prod.oldPrice || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">تصنيف المنتج / القسم</label>
            <input type="text" id="aeprod-category" class="form-input" value="${escAttr(prod.category || '')}" placeholder="مثال: مشروبات ساخنة، ملابس شتوية..." />
          </div>

          <div class="form-group">
            <label class="form-label">رابط صورة المنتج (URL)</label>
            <input type="url" id="aeprod-imageUrl" class="form-input" value="${escAttr(prod.imageUrl || '')}" placeholder="https://..." style="direction:ltr" />
          </div>

          <div class="form-group">
            <label class="form-label">حالة المنتج</label>
            <select id="aeprod-status" class="form-select">
              <option value="approved" ${prod.status === 'approved' || prod.isApproved === true ? 'selected' : ''}>✓ معتمد ومفعل</option>
              <option value="pending" ${prod.status === 'pending' || (!prod.status && prod.isApproved === false) ? 'selected' : ''}>⏳ قيد المراجعة</option>
              <option value="rejected" ${prod.status === 'rejected' ? 'selected' : ''}>✕ مرفوض</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">وصف تفصيلي للمنتج</label>
            <textarea id="aeprod-description" class="form-textarea" rows="3">${escHtml(prod.description || '')}</textarea>
          </div>
        </form>
      `,
      buttons: [
        {
          label: '💾 حفظ تعديلات المنتج',
          type: 'primary',
          closeOnClick: false,
          onClick: async () => {
            const name = document.getElementById('aeprod-name')?.value.trim();
            const price = parseFloat(document.getElementById('aeprod-price')?.value);
            const oldPrice = parseFloat(document.getElementById('aeprod-oldPrice')?.value) || null;
            const category = document.getElementById('aeprod-category')?.value.trim() || '';
            const imageUrl = document.getElementById('aeprod-imageUrl')?.value.trim();
            const status = document.getElementById('aeprod-status')?.value || 'approved';
            const description = document.getElementById('aeprod-description')?.value.trim();

            if (!name || isNaN(price)) {
              toast.warning('يرجى كتابة اسم وسعر المنتج');
              return;
            }

            const updates = {
              name,
              price,
              oldPrice,
              category,
              imageUrl,
              status,
              isApproved: status === 'approved',
              description,
              updatedAt: serverTimestamp()
            };

            try {
              await dbUpdate(`places/${placeId}/products/${productId}`, updates);
              if (Array.isArray(adminCache.products)) {
                const pItem = adminCache.products.find(p => p.id === productId && p.placeId === placeId);
                if (pItem) Object.assign(pItem, updates);
              }
              toast.success('تم تحديث بيانات المنتج بنجاح ✨');
              modal.close();
              switchAdminSection('products', false);
            } catch (err) {
              toast.error('فشل تحديث المنتج: ' + err.message);
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  };

  window.adminApproveProductAction = async (placeId, productId) => {
    try {
      await adminApproveProduct(placeId, productId);
      toast.success('تمت الموافقة على المنتج وتفعيله بنجاح! ⭐');
      adminCache.products = null;
      await renderAdminProducts(document.getElementById('admin-main-area'));
    } catch (err) {
      toast.error(err.message || 'فشلت الموافقة على المنتج');
    }
  };

  window.adminRejectProductAction = (placeId, productId, productName) => {
    const modal = showModal({
      title: `✕ رفض المنتج: ${escHtml(productName)}`,
      size: 'md',
      content: `
        <form id="form-reject-product" style="display:flex;flex-direction:column;gap:12px" onsubmit="return false">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">سبب الرفض <span class="required">*</span></label>
            <select id="reject-prod-preset" class="form-select" onchange="document.getElementById('reject-prod-reason').value = this.value">
              <option value="منتج غير مصرح به أو مخالف للسياسات">منتج غير مصرح به أو مخالف للسياسات</option>
              <option value="صورة المنتج غير لائقة أو غير واضحة">صورة المنتج غير لائقة أو غير واضحة</option>
              <option value="بيانات أو سعر المنتج غير دقيقة">بيانات أو سعر المنتج غير دقيقة</option>
              <option value="منتج مكرر">منتج مكرر</option>
            </select>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">توضيح إضافي للمالك</label>
            <textarea id="reject-prod-reason" class="form-textarea" rows="3">منتج غير مصرح به أو مخالف للسياسات</textarea>
          </div>
        </form>
      `,
      buttons: [
        {
          label: '✕ تأكيد الرفض',
          type: 'danger',
          closeOnClick: false,
          onClick: async () => {
            const reason = document.getElementById('reject-prod-reason')?.value.trim();
            try {
              await adminRejectProduct(placeId, productId, reason);
              toast.warning('تم رفض المنتج وتحديث حالته');
              modal.close();
              adminCache.products = null;
              await renderAdminProducts(document.getElementById('admin-main-area'));
            } catch (err) {
              toast.error(err.message || 'فشل رفض المنتج');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  };

  window.adminDeleteProductAction = async (placeId, productId) => {
    const ok = await showConfirm({
      title: 'حذف المنتج',
      message: 'هل أنت متأكد من حذف هذا المنتج نهائياً؟',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء'
    });
    if (ok) {
      try {
        await adminDeleteProduct(placeId, productId);
        toast.success('تم حذف المنتج بنجاح');
        adminCache.products = null;
        await renderAdminProducts(document.getElementById('admin-main-area'));
      } catch (err) {
        toast.error(err.message || 'فشل حذف المنتج');
      }
    }
  };
}

// ─────────────────────────────────────────────
//  2.5. Reviews Management (التقييمات والمراجعات)
// ─────────────────────────────────────────────
async function renderAdminReviews($container) {
  if (!adminCache.reviews || !adminCache.places || !adminCache.users) {
    const [revs, pls, usrs] = await Promise.all([
      getAllReviews(),
      adminCache.places || dbGet('places'),
      adminCache.users || dbGet('users')
    ]);
    adminCache.reviews = revs || [];
    adminCache.places = pls || {};
    adminCache.users = usrs || {};
  }

  const allReviews = adminCache.reviews || [];
  const placesList = Object.entries(adminCache.places || {}).map(([id, p]) => ({ id, ...p }));
  const usersList = Object.entries(adminCache.users || {}).map(([uid, u]) => ({ uid, ...u }));
  const totalReviews = allReviews.length;
  const fiveStarReviews = allReviews.filter(r => Number(r.rating) === 5).length;
  const reportedReviews = allReviews.filter(r => r.isReported);
  const avgOverall = totalReviews > 0 ? (allReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1) : '5.0';

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="dashboard-header__title" style="color:#fff;font-size:1.6rem;font-weight:800;display:flex;align-items:center;gap:8px">
            <span>⭐</span>
            <span>إدارة التقييمات والمراجعات</span>
            <span class="badge" style="background:#F5A623;color:#0B1E30;font-size:13px;font-weight:800;padding:2px 10px;border-radius:9999px">${totalReviews}</span>
          </h1>
          <div class="dashboard-header__subtitle" style="color:rgba(255,255,255,0.7);font-size:13px">التحكم في تقييمات الأماكن، إضافة مراجعات العملاء، ومراجعة البلاغات فورياً</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary" id="btn-admin-bulk-reviews" style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:var(--radius-full);gap:6px">
            <span>📦</span> إضافة مراجعات مجمعة
          </button>
          <button class="btn btn-primary" id="btn-admin-add-review" style="background:#F5A623;color:#0B1E30;font-weight:800;border:none;border-radius:var(--radius-full);gap:6px">
            <span>➕</span> إضافة تقييم باسم عميل
          </button>
        </div>
      </div>

      <!-- Executive Stats Cards -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:20px">
        <div class="stat-card" style="background:#0F273D;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.1)">
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:4px">إجمالي التقييمات</div>
          <div style="font-size:1.8rem;font-weight:800;color:#0284C7">${totalReviews}</div>
        </div>
        <div class="stat-card" style="background:#0F273D;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.1)">
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:4px">تقييمات 5 نجوم ★</div>
          <div style="font-size:1.8rem;font-weight:800;color:#F5A623">${fiveStarReviews}</div>
        </div>
        <div class="stat-card" style="background:#0F273D;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.1)">
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:4px">متوسط التقييم العام</div>
          <div style="font-size:1.8rem;font-weight:800;color:#10B981">${avgOverall} ★</div>
        </div>
        <div class="stat-card" style="background:#0F273D;padding:16px;border-radius:14px;border:1px solid ${reportedReviews.length > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}">
          <div style="font-size:12px;color:${reportedReviews.length > 0 ? '#EF4444' : 'rgba(255,255,255,0.6)'};margin-bottom:4px">بلاغات مسيئة 🚩</div>
          <div style="font-size:1.8rem;font-weight:800;color:${reportedReviews.length > 0 ? '#EF4444' : 'rgba(255,255,255,0.6)'}">${reportedReviews.length}</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;background:#0F273D;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,0.1)">
        <div style="flex:1;min-width:200px">
          <input type="text" id="admin-reviews-search" class="form-input" placeholder="🔍 بحث باسم المكان أو العميل أو نص المراجعة..." style="margin:0;background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.15);color:#fff" />
        </div>
        <div style="min-width:160px">
          <select id="admin-reviews-filter-place" class="form-select" style="margin:0;background:#0B1E30;border-color:rgba(255,255,255,0.15);color:#fff">
            <option value="">كل الأماكن</option>
            ${placesList.map(p => `<option value="${escAttr(p.id)}">${escHtml(p.name)}</option>`).join('')}
          </select>
        </div>
        <div style="min-width:160px">
          <select id="admin-reviews-filter-stars" class="form-select" style="margin:0;background:#0B1E30;border-color:rgba(255,255,255,0.15);color:#fff">
            <option value="">كل التقييمات</option>
            <option value="reported" ${reportedReviews.length > 0 ? 'selected' : ''}>🚩 التعليقات المُبلّغ عنها (${reportedReviews.length})</option>
            <option value="positive">إيجابي (3 - 5 نجوم) 👍</option>
            <option value="negative">سلبي (1 - 2 نجوم) 👎</option>
            <option value="5">5 نجوم ★★★★★</option>
            <option value="4">4 نجوم ★★★★☆</option>
            <option value="3">3 نجوم ★★★☆☆</option>
            <option value="2">نجمتان ★★☆☆☆</option>
            <option value="1">نجمة واحدة ★☆☆☆☆</option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions Toolbar -->
      <div id="admin-reviews-bulk-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.2);padding:10px 16px;border-radius:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#fff;cursor:pointer;margin:0">
            <input type="checkbox" id="admin-reviews-select-all" style="width:16px;height:16px;cursor:pointer" />
            <span>تحديد الكل</span>
          </label>
          <span id="admin-reviews-selected-count" style="font-size:12px;color:#F5A623;font-weight:700">0 محدد</span>
        </div>

        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-sm btn-danger" id="btn-delete-selected-reviews" style="font-size:12px;padding:5px 14px;border-radius:8px;display:none;font-weight:700">
            <span>🗑️</span> حذف المحدد (<span id="btn-delete-count">0</span>)
          </button>
          <button type="button" class="btn btn-sm" id="btn-delete-filtered-negative" style="font-size:12px;padding:5px 14px;border-radius:8px;color:#EF4444;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.08)">
            <span>⚠️</span> حذف كل السلبي (1-2 نجوم)
          </button>
          <button type="button" class="btn btn-sm" id="btn-delete-all-filtered" style="font-size:12px;padding:5px 14px;border-radius:8px;color:#fff;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06)">
            <span>🧹</span> حذف المعروض حالياً
          </button>
        </div>
      </div>

      <!-- Reviews Table with Smooth Paginated Render -->
      <div class="dashboard-table-wrapper" style="background:#0F273D;border-radius:14px;border:1px solid rgba(255,255,255,0.1);overflow:hidden">
        <table class="dashboard-table" style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-size:12.5px">
              <th style="width:40px;text-align:center;padding:12px">
                <input type="checkbox" id="admin-reviews-th-select-all" style="cursor:pointer;width:15px;height:15px" />
              </th>
              <th style="padding:12px">المكان</th>
              <th style="padding:12px">العميل / المستخدم</th>
              <th style="padding:12px">التقييم</th>
              <th style="padding:12px">نص المراجعة</th>
              <th style="padding:12px">التاريخ</th>
              <th style="text-align:center;padding:12px">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="admin-reviews-table-body">
            <!-- Rendered smoothly by chunks -->
          </tbody>
        </table>

        <!-- Load More Pagination Button -->
        <div id="admin-reviews-load-more-wrap" style="padding:14px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);display:none">
          <button type="button" id="btn-admin-reviews-load-more" class="btn btn-secondary btn-sm" style="border-radius:8px;font-weight:700;padding:8px 24px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15)">
            تحميل المزيد من التقييمات ↓
          </button>
        </div>
      </div>
    </div>
  `;

  let currentFilteredReviews = [];
  let displayedCount = 0;
  const PAGE_CHUNK = 30;

  function updateBulkSelectionUI() {
    const checkedBoxes = document.querySelectorAll('.admin-review-checkbox:checked');
    const count = checkedBoxes.length;
    const selectedCountEl = document.getElementById('admin-reviews-selected-count');
    const deleteBtn = document.getElementById('btn-delete-selected-reviews');
    const deleteCountSpan = document.getElementById('btn-delete-count');
    const masterSelect = document.getElementById('admin-reviews-select-all');
    const thSelect = document.getElementById('admin-reviews-th-select-all');

    if (selectedCountEl) selectedCountEl.textContent = `${count} محدد`;
    if (deleteCountSpan) deleteCountSpan.textContent = count;
    if (deleteBtn) deleteBtn.style.display = count > 0 ? 'inline-flex' : 'none';

    const allBoxes = document.querySelectorAll('.admin-review-checkbox');
    const isAllChecked = allBoxes.length > 0 && count === allBoxes.length;
    if (masterSelect) masterSelect.checked = isAllChecked;
    if (thSelect) thSelect.checked = isAllChecked;
  }

  function renderRowHTML(r) {
    const rStars = Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5));
    const placeObj = adminCache.places?.[r.placeId];
    const placeSlug = placeObj?.slug || r.placeSlug || r.placeId;
    const isReported = Boolean(r.isReported);

    return `
      <tr style="${isReported ? 'background:rgba(239,68,68,0.12)' : 'border-bottom:1px solid rgba(255,255,255,0.05)'}">
        <td style="text-align:center;padding:10px">
          <input type="checkbox" class="admin-review-checkbox" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" style="cursor:pointer;width:15px;height:15px" />
        </td>
        <td style="padding:10px">
          <div style="font-weight:700;color:#38BDF8;display:flex;align-items:center;gap:6px">
            <span>📍</span>
            <a href="../place.html?slug=${escAttr(placeSlug)}" target="_blank" style="color:#38BDF8;text-decoration:none">
              ${escHtml(r.placeName || placeObj?.name || 'مكان غير معروف')}
            </a>
          </div>
        </td>
        <td style="padding:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:30px;height:30px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#F5A623;flex-shrink:0">
              ${r.userPhoto ? `<img src="${escAttr(r.userPhoto)}" style="width:100%;height:100%;object-fit:cover" />` : (r.userName?.charAt(0) || '👤')}
            </div>
            <div>
              <div style="font-weight:700;font-size:13px;color:#fff">${escHtml(r.userName || 'مستخدم')}</div>
              ${r.isAdminGenerated ? `<span class="badge" style="font-size:9.5px;padding:1px 6px;border-radius:4px;background:rgba(245,166,35,0.2);color:#F5A623;font-weight:700">إداري</span>` : ''}
            </div>
          </div>
        </td>
        <td style="padding:10px">
          <div style="color:#F5A623;font-size:14px;letter-spacing:1px;white-space:nowrap">
            ${'★'.repeat(rStars)}${'☆'.repeat(5 - rStars)}
            <span style="color:rgba(255,255,255,0.5);font-size:11px;margin-right:3px">(${rStars}/5)</span>
          </div>
        </td>
        <td style="max-width:320px;padding:10px">
          <div style="font-size:13px;line-height:1.5;color:#E2E8F0" title="${escAttr(r.comment)}">
            ${escHtml(r.comment || '—')}
          </div>
          ${isReported ? `
            <div style="font-size:11px;color:#EF4444;font-weight:700;margin-top:4px;display:flex;align-items:center;gap:4px">
              <span>🚩</span>
              <span>بلاغ: ${escHtml(r.lastReportReason || 'محتوى غير لائق')} (من ${escHtml(r.lastReporterName || 'مستخدم')})</span>
            </div>
          ` : ''}
          ${(r.isReviewedByAdmin && (r.adminReviewStatus === 'approved_compliant' || r.adminReviewNote)) ? `
            <div style="font-size:11px;color:#10B981;margin-top:3px;font-weight:700">
              🛡️ تم التحقق وتأكيد التزامه بالسياسة
            </div>
          ` : ''}
        </td>
        <td style="font-size:12px;color:rgba(255,255,255,0.6);white-space:nowrap;padding:10px">
          ${formatDate(r.createdAt || Date.now())}
        </td>
        <td style="text-align:center;white-space:nowrap;padding:10px">
          <div style="display:inline-flex;gap:4px;flex-wrap:wrap">
            ${isReported ? `
              <button class="btn btn-xs btn-approve-reported-review" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" style="background:#10B981;color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700" title="تأكيد سلامة التعليق">
                🛡️ سليم
              </button>
            ` : ''}
            <button class="btn btn-xs btn-edit-review-admin" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" style="background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:6px;padding:4px 8px" title="تعديل التقييم">
              ${ICONS.edit}
            </button>
            <button class="btn btn-xs btn-delete-review-admin" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" style="background:rgba(239,68,68,0.2);color:#EF4444;border:none;border-radius:6px;padding:4px 8px" title="حذف التقييم">
              ${ICONS.trash}
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function bindRowEvents(container) {
    container.querySelectorAll('.admin-review-checkbox').forEach(cb => {
      cb.addEventListener('change', updateBulkSelectionUI);
    });

    container.querySelectorAll('.btn-approve-reported-review').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-pid');
        const rId = btn.getAttribute('data-rid');
        try {
          await adminApproveReportedReview(pId, rId);
          toast.success('تمت مراجعة التعليق وتأكيد التزامه بالسياسة بنجاح 🛡️');
          adminCache.reviews = null;
          await renderAdminReviews($container);
        } catch (err) {
          toast.error(err.message || 'فشلت العملية');
        }
      });
    });

    container.querySelectorAll('.btn-edit-review-admin').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-pid');
        const rId = btn.getAttribute('data-rid');
        const rev = allReviews.find(x => x.id === rId && x.placeId === pId);
        if (rev) openAdminEditReviewModal(rev);
      });
    });

    container.querySelectorAll('.btn-delete-review-admin').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-pid');
        const rId = btn.getAttribute('data-rid');
        const ok = await showConfirm({
          title: 'حذف التقييم',
          message: 'هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟',
          confirmText: 'نعم، حذف',
          cancelText: 'إلغاء'
        });
        if (ok) {
          try {
            await adminDeleteReview(pId, rId);
            toast.success('تم حذف التقييم بنجاح');
            adminCache.reviews = null;
            await renderAdminReviews($container);
          } catch (err) {
            toast.error(err.message || 'فشل حذف التقييم');
          }
        }
      });
    });
  }

  function renderReviewsRows(isAppend = false) {
    const searchVal = (document.getElementById('admin-reviews-search')?.value || '').trim().toLowerCase();
    const placeFilter = document.getElementById('admin-reviews-filter-place')?.value || '';
    const starsFilter = document.getElementById('admin-reviews-filter-stars')?.value || '';

    if (!isAppend) {
      displayedCount = 0;
      currentFilteredReviews = allReviews.filter(r => {
        if (placeFilter && r.placeId !== placeFilter) return false;
        
        const numStars = Number(r.rating) || 5;
        if (starsFilter === 'reported') {
          if (!r.isReported) return false;
        } else if (starsFilter === 'positive') {
          if (numStars < 3) return false;
        } else if (starsFilter === 'negative') {
          if (numStars > 2) return false;
        } else if (starsFilter && String(r.rating) !== starsFilter) {
          return false;
        }
        if (searchVal) {
          const placeName = (r.placeName || '').toLowerCase();
          const userName = (r.userName || '').toLowerCase();
          const comment = (r.comment || '').toLowerCase();
          if (!placeName.includes(searchVal) && !userName.includes(searchVal) && !comment.includes(searchVal)) {
            return false;
          }
        }
        return true;
      });
    }

    const tbody = document.getElementById('admin-reviews-table-body');
    const loadMoreWrap = document.getElementById('admin-reviews-load-more-wrap');
    if (!tbody) return;

    if (currentFilteredReviews.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding:2.5rem;color:rgba(255,255,255,0.5)">
            لا توجد تقييمات مطابقة للبحث
          </td>
        </tr>
      `;
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      updateBulkSelectionUI();
      return;
    }

    const nextBatch = currentFilteredReviews.slice(displayedCount, displayedCount + PAGE_CHUNK);
    displayedCount += nextBatch.length;

    const htmlChunk = nextBatch.map(renderRowHTML).join('');

    if (isAppend) {
      tbody.insertAdjacentHTML('beforeend', htmlChunk);
    } else {
      tbody.innerHTML = htmlChunk;
    }

    bindRowEvents(tbody);
    updateBulkSelectionUI();

    if (loadMoreWrap) {
      loadMoreWrap.style.display = displayedCount < currentFilteredReviews.length ? 'block' : 'none';
    }
  }

  // Initial Instant Render
  renderReviewsRows(false);

  // Load More Button Click
  document.getElementById('btn-admin-reviews-load-more')?.addEventListener('click', () => {
    renderReviewsRows(true);
  });

  // Debounced Search & Filters
  let _revFilterTimer = null;
  const triggerFilteredRender = () => {
    if (_revFilterTimer) clearTimeout(_revFilterTimer);
    _revFilterTimer = setTimeout(() => renderReviewsRows(false), 150);
  };

  document.getElementById('admin-reviews-search')?.addEventListener('input', triggerFilteredRender);
  document.getElementById('admin-reviews-filter-place')?.addEventListener('change', triggerFilteredRender);
  document.getElementById('admin-reviews-filter-stars')?.addEventListener('change', triggerFilteredRender);

  // Bulk Master Selection
  const handleSelectAll = (checked) => {
    document.querySelectorAll('.admin-review-checkbox').forEach(cb => {
      cb.checked = checked;
    });
    updateBulkSelectionUI();
  };

  document.getElementById('admin-reviews-select-all')?.addEventListener('change', (e) => handleSelectAll(e.target.checked));
  document.getElementById('admin-reviews-th-select-all')?.addEventListener('change', (e) => handleSelectAll(e.target.checked));

  // Bulk Delete Actions
  document.getElementById('btn-delete-selected-reviews')?.addEventListener('click', async () => {
    const checked = Array.from(document.querySelectorAll('.admin-review-checkbox:checked'));
    if (checked.length === 0) return;
    const ok = await showConfirm({
      title: 'حذف التقييمات المحددة',
      message: `هل أنت متأكد من رغبتك في حذف ${checked.length} تقييم محدد؟`,
      confirmText: 'نعم، حذف الكل',
      cancelText: 'إلغاء'
    });
    if (ok) {
      try {
        for (const cb of checked) {
          await adminDeleteReview(cb.getAttribute('data-pid'), cb.getAttribute('data-rid'));
        }
        toast.success(`تم حذف ${checked.length} تقييم بنجاح`);
        adminCache.reviews = null;
        await renderAdminReviews($container);
      } catch (err) {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  });

  document.getElementById('btn-admin-bulk-reviews')?.addEventListener('click', () => openAdminBulkReviewsModal(placesList, async () => {
    adminCache.reviews = null;
    await renderAdminReviews($container);
  }));
  document.getElementById('btn-admin-add-review')?.addEventListener('click', () => openAdminAddReviewModal(placesList, usersList, async () => {
    adminCache.reviews = null;
    await renderAdminReviews($container);
  }));
}


  function openAdminEditReviewModal(rev) {
    let editStars = Number(rev.rating) || 5;

    const modal = showModal({
      title: '✏️ تعديل التقييم والمراجعة',
      size: 'md',
      content: `
        <form id="form-admin-edit-rev" style="display:flex;flex-direction:column;gap:14px">
          <div>
            <strong>المكان:</strong> ${escHtml(rev.placeName || 'المكان')}
          </div>
          <div>
            <strong>العميل:</strong> ${escHtml(rev.userName || 'مستخدم')}
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label">التقييم بالنجوم</label>
            <select id="edit-rev-stars" class="form-select">
              <option value="5" ${editStars === 5 ? 'selected' : ''}>5 نجوم ★★★★★ (ممتاز جداً)</option>
              <option value="4" ${editStars === 4 ? 'selected' : ''}>4 نجوم ★★★★☆ (جيد جداً)</option>
              <option value="3" ${editStars === 3 ? 'selected' : ''}>3 نجوم ★★★☆☆ (متوسط)</option>
              <option value="2" ${editStars === 2 ? 'selected' : ''}>نجمتان ★★☆☆☆ (ضعيف)</option>
              <option value="1" ${editStars === 1 ? 'selected' : ''}>نجمة واحدة ★☆☆☆☆ (سيء)</option>
            </select>
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label">نص المراجعة والتقييم <span class="required">*</span></label>
            <textarea id="edit-rev-comment" class="form-textarea" rows="4" maxlength="500" required>${escHtml(rev.comment || '')}</textarea>
          </div>
        </form>
      `,
      buttons: [
        {
          label: '💾 حفظ التعديل',
          type: 'primary',
          closeOnClick: false,
          onClick: async () => {
            const comment = document.getElementById('edit-rev-comment')?.value.trim();
            const rating = parseInt(document.getElementById('edit-rev-stars')?.value, 10) || 5;
            if (!comment) {
              toast.warning('يرجى كتابة نص المراجعة');
              return;
            }
            try {
              await adminUpdateReview(rev.placeId, rev.id, { rating, comment });
              toast.success('تم تحديث التقييم بنجاح');
              modal.close();
              adminCache.reviews = null;
              await renderAdminReviews($container);
            } catch (err) {
              toast.error(err.message || 'فشل التحديث');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  }

  function openAdminAddReviewModal(places, users, onSuccess) {
    const modal = showModal({
      title: '⭐ إضافة تقييم باسم عميل إلى مكان',
      size: 'md',
      content: `
        <form id="form-admin-add-rev" style="display:flex;flex-direction:column;gap:14px">
          
          <!-- Place Selector with Live Search -->
          <div class="form-group" style="margin:0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <label class="form-label" style="margin:0;font-weight:700">اختر المكان المطلوب <span class="required">*</span></label>
              <span id="add-rev-place-match-count" style="font-size:11px;color:var(--text-muted)">${places.length} مكان متاح</span>
            </div>
            <div style="position:relative;margin-bottom:6px">
              <input 
                type="search" 
                id="add-rev-place-search" 
                class="form-input" 
                placeholder="🔍 اكتب اسم المحل أو النشاط للبحث السريع..." 
                autocomplete="off" 
                style="padding-right:32px;font-size:12.5px"
              />
              <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none">🔎</span>
            </div>
            <select id="add-rev-place" class="form-select" required style="border-radius:10px;font-weight:600">
              <option value="">-- اختر المكان من القائمة (${places.length} مكان) --</option>
              ${places.map(p => `
                <option value="${escAttr(p.id)}" data-slug="${escAttr(p.slug || '')}" data-name="${escAttr(p.name)}" data-cat="${escAttr(p.categoryName || p.categoryId || '')}" data-area="${escAttr(p.area || 'المنزلة')}" data-phone="${escAttr(p.phone || '')}" data-img="${escAttr(p.coverImageUrl || p.logoUrl || '')}">
                  ${escHtml(p.name)} (${escHtml(p.categoryName || p.categoryId || 'عام')} - ${escHtml(p.area || 'المنزلة')}) ${p.phone ? '📞 ' + escHtml(p.phone) : ''}
                </option>
              `).join('')}
            </select>

            <!-- Preview Card -->
            <div id="add-rev-place-preview-card" style="display:none;margin-top:8px;padding:8px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;align-items:center;gap:10px">
              <div class="place-preview-img" style="width:36px;height:36px;border-radius:6px;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;font-size:16px">
                🏢
              </div>
              <div style="flex:1;min-width:0">
                <div class="place-preview-name" style="font-weight:700;font-size:13px;color:var(--text-primary)" class="truncate">اسم المكان</div>
                <div class="place-preview-meta" style="font-size:11px;color:var(--text-muted)" class="truncate">التصنيف والمنطقة</div>
              </div>
              <span class="chip chip--success" style="font-size:10px;padding:2px 6px">تم الاختيار ✓</span>
            </div>
          </div>

          <!-- User Mode -->
          <div class="form-group" style="margin:0">
            <label class="form-label">نوع العميل / صاحب التقييم <span class="required">*</span></label>
            <select id="add-rev-user-type" class="form-select">
              <option value="registered">اختيار من المستخدمين المسجلين بالمنصة</option>
              <option value="custom">كتابة اسم عميل مخصص يدوياً</option>
            </select>
          </div>

          <!-- Registered Users Dropdown -->
          <div class="form-group" id="group-registered-user" style="margin:0">
            <label class="form-label">المستخدم المسجل</label>
            <select id="add-rev-registered-user" class="form-select">
              ${users.map(u => `<option value="${escAttr(u.uid)}" data-name="${escAttr(u.name || u.displayName || '')}" data-photo="${escAttr(u.photoURL || '')}">${escHtml(u.name || u.email || 'مستخدم')}</option>`).join('')}
            </select>
          </div>

          <!-- Custom User Name Input (Hidden by default) -->
          <div class="form-group" id="group-custom-user" style="margin:0;display:none">
            <label class="form-label">اسم العميل المخصص</label>
            <input type="text" id="add-rev-custom-name" class="form-input" placeholder="مثال: أحمد محمود" />
          </div>

          <!-- Rating -->
          <div class="form-group" style="margin:0">
            <label class="form-label">عدد النجوم <span class="required">*</span></label>
            <select id="add-rev-stars" class="form-select">
              <option value="5" selected>5 نجوم ★★★★★ (ممتاز جداً)</option>
              <option value="4">4 نجوم ★★★★☆ (جيد جداً)</option>
              <option value="3">3 نجوم ★★★☆☆ (متوسط)</option>
              <option value="2">نجمتان ★★☆☆☆ (ضعيف)</option>
              <option value="1">نجمة واحدة ★☆☆☆☆ (سيء)</option>
            </select>
          </div>

          <!-- Comment -->
          <div class="form-group" style="margin:0">
            <label class="form-label">نص التقييم والمراجعة <span class="required">*</span></label>
            <textarea id="add-rev-comment" class="form-textarea" rows="4" maxlength="500" placeholder="اكتب نص التقييم ورأي العميل بالتفصيل..." required></textarea>
          </div>

        </form>
      `,
      buttons: [
        {
          label: '🚀 إضافة التقييم',
          type: 'primary',
          closeOnClick: false,
          onClick: async () => {
            const placeSelect = document.getElementById('add-rev-place');
            const placeId = placeSelect?.value;
            const placeOption = placeSelect?.options[placeSelect.selectedIndex];
            const placeName = placeOption?.textContent?.trim() || '';
            const placeSlug = placeOption?.getAttribute('data-slug') || '';

            if (!placeId) {
              toast.warning('يرجى اختيار المكان');
              return;
            }

            const userType = document.getElementById('add-rev-user-type')?.value;
            let userId = `admin_gen_${Date.now()}`;
            let userName = 'عميل موثوق';
            let userPhoto = '';

            if (userType === 'registered') {
              const regSelect = document.getElementById('add-rev-registered-user');
              const regOption = regSelect?.options[regSelect.selectedIndex];
              userId = regSelect?.value || userId;
              userName = regOption?.getAttribute('data-name') || regOption?.textContent || 'مستخدم مسجل';
              userPhoto = regOption?.getAttribute('data-photo') || '';
            } else {
              const customName = document.getElementById('add-rev-custom-name')?.value.trim();
              if (customName) userName = customName;
            }

            const rating = parseInt(document.getElementById('add-rev-stars')?.value, 10) || 5;
            const comment = document.getElementById('add-rev-comment')?.value.trim();

            if (!comment) {
              toast.warning('يرجى كتابة نص التقييم');
              return;
            }

            try {
              await adminAddReview({
                placeId,
                placeName,
                placeSlug,
                userId,
                userName,
                userPhoto,
                rating,
                comment
              });
              toast.success('تمت إضافة التقييم بنجاح ⭐');
              modal.close();
              if (onSuccess) onSuccess();
            } catch (err) {
              toast.error(err.message || 'فشل إضافة التقييم');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });

    // Live search filter for add-rev-place
    setupPlaceLiveSearch({
      searchInputId: 'add-rev-place-search',
      selectElementId: 'add-rev-place',
      matchCountId: 'add-rev-place-match-count',
      previewCardId: 'add-rev-place-preview-card',
      totalCount: places.length
    });

    // Toggle custom/registered user fields
    document.getElementById('add-rev-user-type')?.addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      const regGroup = document.getElementById('group-registered-user');
      const customGroup = document.getElementById('group-custom-user');
      if (regGroup) regGroup.style.display = isCustom ? 'none' : 'block';
      if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
    });
  }

  function openAdminBulkReviewsModal(places, onSuccess) {
    let currentParsed = [];

    const modal = showModal({
      title: '📦 إضافة وتوليد تقييمات مجمعة (Bulk Reviews Generator up to 5,000)',
      size: 'lg',
      content: `
        <div style="display:flex;flex-direction:column;gap:14px">
          
          <!-- Place Selector with Live Search -->
          <div class="form-group" style="margin:0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <label class="form-label" style="margin:0;font-weight:700">اختر المكان المطلوب إضافة التقييمات عليه <span class="required">*</span></label>
              <span id="bulk-place-match-count" style="font-size:11px;color:var(--text-muted)">${places.length} مكان متاح</span>
            </div>
            <div style="position:relative;margin-bottom:6px">
              <input 
                type="search" 
                id="bulk-rev-place-search" 
                class="form-input" 
                placeholder="🔍 اكتب اسم المحل أو النشاط للبحث السريع..." 
                autocomplete="off" 
                style="padding-right:32px;font-size:12.5px"
              />
              <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none">🔎</span>
            </div>
            <select id="bulk-rev-place" class="form-select" required style="border-radius:10px;font-weight:600">
              <option value="">-- اختر المكان من القائمة (${places.length} مكان) --</option>
              ${places.map(p => {
                const isHammad = (p.slug === HAMMAD_PLACE_SLUG || p.name?.includes('محمد حماد'));
                return `
                  <option value="${escAttr(p.id)}" ${isHammad ? 'selected' : ''} data-name="${escAttr(p.name)}" data-slug="${escAttr(p.slug || '')}" data-cat="${escAttr(p.categoryName || p.categoryId || '')}" data-area="${escAttr(p.area || 'المنزلة')}" data-phone="${escAttr(p.phone || '')}" data-img="${escAttr(p.coverImageUrl || p.logoUrl || '')}">
                    ${escHtml(p.name)} ${isHammad ? '⭐ (مهندس محمد حماد)' : `(${escHtml(p.categoryName || p.categoryId || 'عام')} - ${escHtml(p.area || 'المنزلة')})`} ${p.phone ? '📞 ' + escHtml(p.phone) : ''}
                  </option>
                `;
              }).join('')}
            </select>

            <!-- Preview Card -->
            <div id="bulk-rev-place-preview-card" style="display:none;margin-top:8px;padding:8px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;align-items:center;gap:10px">
              <div class="place-preview-img" style="width:36px;height:36px;border-radius:6px;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;font-size:16px">
                🏢
              </div>
              <div style="flex:1;min-width:0">
                <div class="place-preview-name" style="font-weight:700;font-size:13px;color:var(--text-primary)" class="truncate">اسم المكان</div>
                <div class="place-preview-meta" style="font-size:11px;color:var(--text-muted)" class="truncate">التصنيف والمنطقة</div>
              </div>
              <span class="chip chip--primary" style="font-size:10px;padding:2px 6px">المكان المختار ✓</span>
            </div>
          </div>

          <!-- Mega Generator Controls Box -->
          <div style="background:var(--surface-2);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border);display:flex;flex-direction:column;gap:10px">
            <div style="font-weight:700;font-size:13px;color:var(--primary);display:flex;align-items:center;gap:6px">
              <span>⚡</span> أداة توليد التعليقات التلقائية بالذكاء الاصطناعي (حتى 5000 تقييم مصري فريد)
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px">
              <!-- Specialty input -->
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12px">تخصص أو نشاط المكان <span class="required">*</span></label>
                <input type="text" id="gen-rev-specialty" class="form-input" placeholder="مثال: برمجة وذكاء اصطناعي، عيادة أسنان، مطعم، محل ملابس..." value="برمجة ومواقع وذكاء اصطناعي" style="font-size:12px;padding:6px 10px" />
              </div>

              <!-- Count selector -->
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12px">عدد التقييمات المطلوب</label>
                <select id="gen-rev-count" class="form-select" style="font-size:12.5px;padding:6px 10px">
                  <option value="50">50 تقييم</option>
                  <option value="100">100 تقييم</option>
                  <option value="250">250 تقييم</option>
                  <option value="500">500 تقييم</option>
                  <option value="1000">1,000 تقييم</option>
                  <option value="2500">2,500 تقييم</option>
                  <option value="5000">5,000 تقييم (الحد الأقصى)</option>
                  <option value="custom">رقم مخصص...</option>
                </select>
                <input type="number" id="gen-rev-custom-count" class="form-input" placeholder="اكتب العدد (1 - 5000)" min="1" max="5000" style="display:none;margin-top:6px;font-size:12px;padding:6px" />
              </div>

              <!-- Star Rating Range selector with Positive / Negative filter -->
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12px">نوع التقييم بالنجوم</label>
                <select id="gen-rev-stars" class="form-select" style="font-size:12.5px;padding:6px 10px">
                  <option value="positive" selected>إيجابي — من 3 إلى 5 نجوم (الأكثر طلباً) 👍</option>
                  <option value="negative">سلبي — من 1 إلى 2 نجوم 👎</option>
                  <option value="4-5">ممتاز جداً — 4 إلى 5 نجوم ★★★★★</option>
                  <option value="5">5 نجوم فقط ★★★★★</option>
                  <option value="3-4">متوسط إلى جيد — 3 إلى 4 نجوم ★★★★☆</option>
                  <option value="2-4">منوع — 2 إلى 4 نجوم ★★★☆☆</option>
                  <option value="1-2">ضعيف وسلبي — 1 إلى 2 نجوم ★☆☆☆☆</option>
                  <option value="all">تشكيلة طبيعية شاملة (1 - 5 نجوم)</option>
                </select>
              </div>

              <!-- Gender selector -->
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12px">جنس المعلقين 👥</label>
                <select id="gen-rev-gender" class="form-select" style="font-size:12.5px;padding:6px 10px">
                  <option value="mixed" selected>مختلط — رجال وبنات معاً (افتراضي)</option>
                  <option value="male">رجال فقط 👨</option>
                  <option value="female">بنات فقط 👩 (مناسب للكوافير والبيوتي)</option>
                </select>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px">
              <button type="button" class="btn btn-sm btn-primary" id="btn-run-synthetic-generator" style="font-size:12px;padding:6px 14px;border-radius:var(--radius-full);gap:6px">
                <span>✨</span> توليد التقييمات باسم وتخصص المكان فوراً
              </button>
              <button type="button" class="btn btn-sm btn-outline" id="btn-load-hammad-50" style="font-size:12px;padding:6px 14px;border-radius:var(--radius-full);background:var(--surface)">
                <span>⭐</span> تعبئة الـ 50 تقييم الأصلية لمهندس محمد حماد
              </button>
            </div>
          </div>

          <!-- Bulk Textarea -->
          <div class="form-group" style="margin:0">
            <label class="form-label" style="display:flex;justify-content:space-between;align-items:center">
              <span>نص وجدول التقييمات <span class="required">*</span></span>
              <span id="bulk-counter-label" style="font-size:11.5px;color:var(--primary);font-weight:700">0 تقييم مستخرج</span>
            </label>
            <textarea 
              id="bulk-rev-raw-text" 
              class="form-textarea" 
              rows="7" 
              placeholder="| # | اسم العميل | التقييم | نص التقييم |&#10;| 1 | أحمد محمود | ⭐⭐⭐⭐⭐ | تعامل ممتاز جدًا ورائع |&#10;| 2 | Mohamed Hassan | 5 | شغل احترافي وممتاز |" 
              style="font-family:monospace;font-size:12px;direction:rtl"
              required></textarea>
          </div>

          <!-- Live Preview Container -->
          <div id="bulk-preview-wrapper" style="display:none;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;background:var(--surface)">
            <div style="background:var(--surface-2);padding:8px 12px;font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)">
              <span>معاينة البيانات المستخرجة:</span>
              <span id="bulk-valid-count" style="color:var(--success)">0 صالح للإضافة</span>
            </div>
            <div style="max-height:180px;overflow-y:auto;font-size:12px">
              <table class="dashboard-table" style="margin:0">
                <thead>
                  <tr>
                    <th style="padding:6px 10px">#</th>
                    <th style="padding:6px 10px">الاسم</th>
                    <th style="padding:6px 10px">النجوم</th>
                    <th style="padding:6px 10px">نص التقييم</th>
                  </tr>
                </thead>
                <tbody id="bulk-preview-tbody"></tbody>
              </table>
            </div>
          </div>

          <div style="font-size:11.5px;color:var(--text-muted);line-height:1.5;background:rgba(245,166,35,0.08);padding:8px 12px;border-radius:var(--radius-sm)">
            🔒 <strong>قاعدة عدم التكرار والأمان:</strong> سيقوم النظام تلقائياً بفحص كل اسم والتأكد من عدم تكراره نهائياً، ويتم الحفظ بنظام الدفعات المجزأة (Chunks) لضمان سرعة واستقرار الحفظ حتى 5000 تقييم دون أي أخطاء مسار.
          </div>

        </div>
      `,
      buttons: [
        {
          label: '🚀 فحص وإضافة التقييمات فوراً',
          type: 'primary',
          closeOnClick: false,
          onClick: async () => {
            const placeId = document.getElementById('bulk-rev-place')?.value;
            if (!placeId) {
              toast.warning('يرجى اختيار المكان أولاً');
              return;
            }

            const rawText = document.getElementById('bulk-rev-raw-text')?.value || '';
            const items = parseBulkReviews(rawText);

            if (!items.length) {
              toast.warning('لم يتم استخراج أي تقييم صالح. استخدم زر التوليد التلقائي أو الصق جدول التقييمات.');
              return;
            }

            try {
              toast.info(`جاري حفظ ${items.length} تقييم بنظام الدفعات السريعة...`);
              const res = await adminBulkAddReviews(placeId, items);

              if (res.addedCount > 0) {
                toast.success(`تمت إضافة ${res.addedCount} تقييم بنجاح! ⭐`);
              }
              if (res.skippedCount > 0) {
                toast.warning(`تم تخطي ${res.skippedCount} اسم مكرر لمنع التكرار على نفس المكان.`);
              }

              modal.close();
              if (onSuccess) onSuccess();
            } catch (err) {
              toast.error(err.message || 'فشل استيراد التقييمات');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });

    const textarea = document.getElementById('bulk-rev-raw-text');
    const counterLabel = document.getElementById('bulk-counter-label');
    const previewWrapper = document.getElementById('bulk-preview-wrapper');
    const previewTbody = document.getElementById('bulk-preview-tbody');
    const validCountEl = document.getElementById('bulk-valid-count');

    function updateLivePreview() {
      const text = textarea?.value || '';
      currentParsed = parseBulkReviews(text);

      if (counterLabel) {
        counterLabel.textContent = `${currentParsed.length} تقييم مستخرج`;
      }

      if (currentParsed.length > 0) {
        if (previewWrapper) previewWrapper.style.display = 'block';
        if (validCountEl) validCountEl.textContent = `${currentParsed.length} تقييم صالح`;
        if (previewTbody) {
          // Preview first 100 for fast UI performance
          const previewSlice = currentParsed.slice(0, 100);
          previewTbody.innerHTML = previewSlice.map((item, idx) => `
            <tr>
              <td style="padding:6px 10px;color:var(--text-muted)">${idx + 1}</td>
              <td style="padding:6px 10px;font-weight:700;white-space:nowrap">${escHtml(item.name)}</td>
              <td style="padding:6px 10px;color:#F59E0B;white-space:nowrap">${'★'.repeat(item.rating)} (${item.rating})</td>
              <td style="padding:6px 10px;color:var(--text-primary);max-width:250px" class="truncate">${escHtml(item.comment)}</td>
            </tr>
          `).join('') + (currentParsed.length > 100 ? `<tr><td colspan="4" style="text-align:center;padding:8px;color:var(--text-muted)">... وغيرها ${currentParsed.length - 100} تقييم جاهز للإضافة</td></tr>` : '');
        }
      } else {
        if (previewWrapper) previewWrapper.style.display = 'none';
      }
    }

    textarea?.addEventListener('input', updateLivePreview);

    // Custom count toggle
    document.getElementById('gen-rev-count')?.addEventListener('change', (e) => {
      const customInput = document.getElementById('gen-rev-custom-count');
      if (customInput) {
        customInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
      }
    });

    // Live Search Filter for Bulk Review Place Dropdown
    setupPlaceLiveSearch({
      searchInputId: 'bulk-rev-place-search',
      selectElementId: 'bulk-rev-place',
      matchCountId: 'bulk-place-match-count',
      previewCardId: 'bulk-rev-place-preview-card',
      totalCount: places.length,
      onSelectCallback: (selectedId) => {
        const targetPlace = places.find(p => p.id === selectedId);
        const specInput = document.getElementById('gen-rev-specialty');
        if (targetPlace && specInput) {
          specInput.value = targetPlace.categoryName || targetPlace.category || targetPlace.description || 'الخدمات والنشاط';
        }
      }
    });

    // Run Generator
    document.getElementById('btn-run-synthetic-generator')?.addEventListener('click', () => {
      const countSelect = document.getElementById('gen-rev-count')?.value;
      let count = parseInt(countSelect, 10) || 50;
      if (countSelect === 'custom') {
        count = parseInt(document.getElementById('gen-rev-custom-count')?.value, 10) || 50;
      }
      count = Math.min(5000, Math.max(1, count));

      const starRange = document.getElementById('gen-rev-stars')?.value || 'positive';
      const specialty = document.getElementById('gen-rev-specialty')?.value || '';
      const gender = document.getElementById('gen-rev-gender')?.value || 'mixed';
      const placeSelect = document.getElementById('bulk-rev-place');
      const placeName = placeSelect?.options[placeSelect.selectedIndex]?.textContent || '';

      const genderLabel = gender === 'male' ? ' (رجال فقط 👨)' : gender === 'female' ? ' (بنات فقط 👩)' : ' (مختلط)';
      toast.info(`جاري توليد ${count} تقييم فريد في مجال (${specialty || 'النشاط'})${genderLabel}...`);
      const generated = generateSyntheticReviews({ count, starRange, specialty, placeName, gender });

      const formattedTable = [
        '| # | اسم العميل | التقييم | نص التقييم |',
        '|---|---|---|---|',
        ...generated.map((t, idx) => `| ${idx + 1} | ${t.name} | ${'⭐'.repeat(t.rating)} | ${t.comment} |`)
      ].join('\n');

      if (textarea) {
        textarea.value = formattedTable;
        updateLivePreview();
        toast.success(`تم توليد ${generated.length} تقييم فريد بتخصص (${specialty})${genderLabel} ✨`);
      }
    });

    // Load Hammad 50 Reviews
    document.getElementById('btn-load-hammad-50')?.addEventListener('click', () => {
      const formattedTable = [
        '| # | اسم العميل | التقييم | نص التقييم |',
        '|---|---|---|---|',
        ...HAMMAD_TESTIMONIALS.map((t, idx) => `| ${idx + 1} | ${t.name} | ⭐⭐⭐⭐⭐ | ${t.comment} |`)
      ].join('\n');

      if (textarea) {
        textarea.value = formattedTable;
        updateLivePreview();
        toast.info('تم تحميل جدول الـ 50 تقييم الأصلية بنجاح! جاهز للإضافة ⚡');
      }
    });
  }

// ─────────────────────────────────────────────
//  3. Verification Requests
// ─────────────────────────────────────────────
async function renderAdminVerification($container) {
  if (!adminCache.verificationRequests) {
    adminCache.verificationRequests = (await dbGet('verificationRequests')) || {};
  }
  const reqs = Object.entries(adminCache.verificationRequests || {}).map(([id, r]) => ({ ...r, id }))
    .sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">طلبات التوثيق (${reqs.length})</h1>
          <div class="dashboard-header__subtitle">مراجعة واعتماد طلبات توثيق الأنشطة التجارية وتحديد مدة الصلاحية</div>
        </div>
      </div>

      <div class="dashboard-table-wrapper">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>اسم المكان</th>
              <th>مقدم الطلب</th>
              <th>تاريخ الطلب</th>
              <th>انتهاء الصلاحية</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            ${reqs.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد طلبات توثيق حالياً</td></tr>' : reqs.map(r => `
              <tr>
                <td><strong>${escHtml(r.placeName)}</strong></td>
                <td>${escHtml(r.ownerName || r.ownerEmail || '')}</td>
                <td>${formatDate(r.requestedAt)}</td>
                <td>${r.verifiedUntil ? formatDate(r.verifiedUntil) : '<span class="text-muted">—</span>'}</td>
                <td>
                  <span class="badge ${r.status === 'approved' ? 'badge--published' : (r.status === 'rejected' ? 'badge--rejected' : 'badge--pending')}">
                    ${r.status === 'approved' ? 'معتمد ✓' : (r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة')}
                  </span>
                </td>
                <td>
                  ${r.status === 'pending' ? `
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-xs btn-success" onclick="approveVerification('${escAttr(r.id)}', '${escAttr(r.placeId)}')">
                        ${ICONS.check} اعتماد
                      </button>
                      <button class="btn btn-xs btn-danger" onclick="rejectVerification('${escAttr(r.id)}', '${escAttr(r.placeId)}')">
                        ${ICONS.x} رفض
                      </button>
                    </div>
                  ` : '<span style="color:var(--text-muted);font-size:.85rem">مكتمل</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
//  4. Categories
// ─────────────────────────────────────────────
async function renderAdminCategories($container) {
  if (!adminCache.categories || !adminCache.categoryRequests) {
    const [cat, catReqs, p] = await Promise.all([
      getCategories(), dbGet('categoryRequests'), dbGet('places')
    ]);
    adminCache.categories = cat || [];
    adminCache.categoryRequests = catReqs || {};
    adminCache.places = p || {};
  }

  const categories = adminCache.categories;
  const catRequests = Object.entries(adminCache.categoryRequests || {})
    .map(([id, r]) => ({ ...r, id }))
    .filter(r => r.status === 'pending');
  const allPlaces = Object.values(adminCache.places || {});

  categories.forEach(c => {
    c.placeCount = allPlaces.filter(p => p.categoryId === (c.slug || c.nameEn)).length;
  });

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إدارة وتدقيق التصنيفات (${categories.length})</h1>
          <div class="dashboard-header__subtitle">إضافة وتعديل وحذف تصنيفات الدليل واعتماد المقترحات الجديدة</div>
        </div>
        <button class="btn btn-primary" id="btn-add-category">
          ${ICONS.plus} إضافة تصنيف جديد
        </button>
      </div>

      <!-- Pending Category Requests -->
      ${catRequests.length > 0 ? `
        <div class="form-section" style="margin-bottom:24px;border:1.5px solid var(--secondary,#F5A623)">
          <h2 class="form-section__title" style="color:var(--secondary,#F5A623)">
            <span>${ICONS.star}</span> طلبات التصنيفات المقترحة من الأعضاء (${catRequests.length})
          </h2>
          <div class="dashboard-table-wrapper">
            <table class="dashboard-table">
              <thead>
                <tr>
                  <th>التصنيف المقترح</th>
                  <th>اسم المكان</th>
                  <th>صاحب الحساب</th>
                  <th>إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody>
                ${catRequests.map(req => `
                  <tr>
                    <td><strong style="font-size:1.05rem;color:var(--primary)">✨ ${escHtml(req.categoryName)}</strong></td>
                    <td>${escHtml(req.placeName || 'غير محدد')}</td>
                    <td>${escHtml(req.ownerName || 'مستخدم')}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-xs btn-success" onclick="approveCategoryRequest('${escAttr(req.id)}', '${escAttr(req.categoryName)}')">
                          ${ICONS.check} اعتماد وتفعيل
                        </button>
                        <button class="btn btn-xs btn-outline" onclick="editAndApproveCategoryRequest('${escAttr(req.id)}', '${escAttr(req.categoryName)}')">
                          ${ICONS.edit} تعديل واعتماد
                        </button>
                        <button class="btn btn-xs btn-danger" onclick="rejectCategoryRequest('${escAttr(req.id)}')">
                          ${ICONS.x} رفض
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Live Search in Admin Categories -->
      <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div style="position:relative;flex:1;max-width:420px">
          <input 
            type="search" 
            id="admin-categories-search" 
            class="form-input" 
            placeholder="🔍 ابحث في التصنيفات والمهن الحالية (بالعربية أو الإنجليزية)..." 
            style="padding-right:38px;background:var(--surface)"
          />
          <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none">🔎</span>
        </div>
        <div id="admin-cat-filter-count" style="font-size:12.5px;color:var(--text-muted);font-weight:600">
          عرض ${categories.length} تصنيف
        </div>
      </div>

      <div class="dashboard-table-wrapper">
        <table class="dashboard-table" id="admin-categories-table">
          <thead>
            <tr>
              <th>الأيقونة</th>
              <th>اسم التصنيف</th>
              <th>الاسم بالإنجليزية / Slug</th>
              <th>عدد الأماكن</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map(c => `
              <tr data-cat-row-name="${escAttr((c.name || '').toLowerCase())}" data-cat-row-slug="${escAttr((c.slug || c.nameEn || '').toLowerCase())}">
                <td style="font-size:1.5rem">${c.icon || '📁'}</td>
                <td><strong>${escHtml(c.name)}</strong></td>
                <td><code>${escHtml(c.slug || c.nameEn || '')}</code></td>
                <td><span class="chip chip--primary">${c.placeCount || 0} مكان</span></td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-xs btn-outline" onclick="editCategoryAdmin('${escAttr(c._key || c.slug)}', '${escAttr(c.name)}', '${escAttr(c.icon || '📁')}')">${ICONS.edit} تعديل</button>
                    <button class="btn btn-xs btn-danger" onclick="deleteCategoryAdmin('${escAttr(c._key || c.slug)}')">${ICONS.trash} حذف</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Live Categories Search Handler
  const adminCatSearch = document.getElementById('admin-categories-search');
  const catRows = document.querySelectorAll('#admin-categories-table tbody tr');
  const catCountEl = document.getElementById('admin-cat-filter-count');

  adminCatSearch?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let matchCount = 0;
    catRows.forEach(row => {
      const name = row.getAttribute('data-cat-row-name') || '';
      const slug = row.getAttribute('data-cat-row-slug') || '';
      const match = !q || name.includes(q) || slug.includes(q);
      row.style.display = match ? '' : 'none';
      if (match) matchCount++;
    });
    if (catCountEl) {
      catCountEl.textContent = q ? `تم العثور على ${matchCount} من ${categories.length}` : `عرض ${categories.length} تصنيف`;
    }
  });

  document.getElementById('btn-add-category')?.addEventListener('click', () => {
    showAddCategoryModal(() => switchAdminSection('categories', false));
  });
}

function showAddCategoryModal(onDone) {
  const modal = showModal({
    title: 'إضافة تصنيف جديد للدليل',
    content: `
      <div class="form-group">
        <label class="form-label">اسم التصنيف بالعربية <span class="required">*</span></label>
        <input type="text" id="cat-name-ar" class="form-input" required placeholder="مثال: ورشة نجارة، ستوديو تصوير" />
      </div>
      <div class="form-group">
        <label class="form-label">الاسم بالإنجليزية (Slug) <span class="required">*</span></label>
        <input type="text" id="cat-name-en" class="form-input" required placeholder="carpentry" style="direction:ltr" />
      </div>
      <div class="form-group">
        <label class="form-label">الأيقونة (Emoji أو رمز) <span class="required">*</span></label>
        <input type="text" id="cat-icon" class="form-input" required placeholder="🪑" />
      </div>
    `,
    buttons: [
      {
        label: 'حفظ التصنيف',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const name = document.getElementById('cat-name-ar')?.value.trim();
          const slug = document.getElementById('cat-name-en')?.value.trim().toLowerCase().replace(/\\s+/g, '-');
          const icon = document.getElementById('cat-icon')?.value.trim() || '📁';

          if (!name || !slug) {
            toast.warning('يرجى كتابة الاسم والـ Slug');
            return;
          }

          try {
            const newCat = {
              id: slug,
              slug,
              name,
              nameEn: slug,
              icon,
              order: Date.now(),
              isActive: true,
              placeCount: 0,
              createdAt: serverTimestamp()
            };
            await dbSet(`categories/${slug}`, newCat);
            if (adminCache.categories) adminCache.categories.push(newCat);
            toast.success('تمت إضافة التصنيف بنجاح');
            modal.close();
            onDone();
          } catch (err) {
            toast.error(err.message || 'فشل حفظ التصنيف');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}

// ─────────────────────────────────────────────
//  5. Users (إدارة الأعضاء والتحكم الشامل)
// ─────────────────────────────────────────────
async function renderAdminUsers($container) {
  // Load users, places, reviews, and banned IPs
  if (!adminCache.users) {
    adminCache.users = (await dbGet('users')) || {};
  }
  if (!adminCache.places) {
    adminCache.places = (await dbGet('places')) || {};
  }
  if (!adminCache.reviews) {
    adminCache.reviews = await getAllReviews();
  }

  const allPlaces = Object.entries(adminCache.places || {}).map(([id, p]) => ({ ...p, _id: p._id || p.id || id }));
  const allReviews = adminCache.reviews || [];
  const bannedIps = await getAllBannedIps();
  const bannedIpsMap = new Map();
  bannedIps.forEach(b => {
    if (b.ip) bannedIpsMap.set(b.ip, b);
  });

  const users = Object.entries(adminCache.users || {}).map(([uid, u]) => {
    const userPlaces = allPlaces.filter(p => p.ownerId === uid || (p.ownerEmail && u.email && p.ownerEmail.toLowerCase() === u.email.toLowerCase()));
    const userReviews = allReviews.filter(r => r.userId === uid || (r.userEmail && u.email && r.userEmail.toLowerCase() === u.email.toLowerCase()));
    const clientIp = u.lastIp || u.registrationIp || null;
    const isIpBlocked = clientIp && bannedIpsMap.has(clientIp);
    return {
      uid,
      ...u,
      userPlaces,
      userReviews,
      clientIp,
      isIpBlocked,
      ipBanData: isIpBlocked ? bannedIpsMap.get(clientIp) : null
    };
  });

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="dashboard-header__title" style="color:#fff;font-size:1.6rem;font-weight:800;display:flex;align-items:center;gap:8px">
            <span>👥</span>
            <span>إدارة المستخدمين والرقابة الكاملة (${users.length})</span>
          </h1>
          <div class="dashboard-header__subtitle" style="color:rgba(255,255,255,0.7);font-size:13px">
            تحكم شامل في الأماكن، مراجعة وتعديل وحذف التعليقات، حظر الـ IP، وتعديل النقاط والصلاحيات
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-sm btn-outline" id="btn-admin-show-banned-ips" style="border-radius:8px;font-weight:800;border-color:rgba(239,68,68,0.5);color:#EF4444">
            🚫 سجل الـ IP المحظورة (${bannedIps.length})
          </button>
          <button class="btn btn-sm btn-outline" id="btn-admin-refresh-users" style="border-radius:8px;font-weight:700">
            🔄 تحديث
          </button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap">
        <input type="text" id="admin-user-search-input" class="form-input" placeholder="🔍 ابحث بالاسم، البريد الإلكتروني، معرف المستخدم UID، أو عنوان IP..." style="flex:1;min-width:280px;background:#0F273D;color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:10px 14px" />
      </div>

      <div class="dashboard-table-wrapper" style="background:#0F273D;border-radius:14px;border:1px solid rgba(255,255,255,0.1);overflow-x:auto">
        <table class="dashboard-table" style="width:100%;border-collapse:collapse;min-width:980px" id="admin-users-table">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-size:12.5px">
              <th style="padding:12px;text-align:right">المستخدم والـ IP</th>
              <th style="padding:12px;text-align:center">الأماكن التابعة 🏪</th>
              <th style="padding:12px;text-align:center">التعليقات ⭐</th>
              <th style="padding:12px;text-align:center">الرتبة والنقاط 🏆</th>
              <th style="padding:12px;text-align:center">الصلاحية</th>
              <th style="padding:12px;text-align:center">الحالة</th>
              <th style="text-align:center;padding:12px">لوحة التحكم السريعة</th>
            </tr>
          </thead>
          <tbody id="admin-users-tbody">
            ${_buildAdminUserRows(users)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Search Filter Handler
  const searchInput = $container.querySelector('#admin-user-search-input');
  searchInput?.addEventListener('input', () => {
    const q = normalizeArabic(searchInput.value.trim().toLowerCase());
    if (!q) {
      $container.querySelector('#admin-users-tbody').innerHTML = _buildAdminUserRows(users);
      _bindAdminUserRowEvents($container, users);
      return;
    }
    const filtered = users.filter(u => {
      const name = normalizeArabic((u.name || '').toLowerCase());
      const email = (u.email || '').toLowerCase();
      const uid = (u.uid || '').toLowerCase();
      const ip = (u.clientIp || '').toLowerCase();
      return name.includes(q) || email.includes(q) || uid.includes(q) || ip.includes(q);
    });
    $container.querySelector('#admin-users-tbody').innerHTML = _buildAdminUserRows(filtered);
    _bindAdminUserRowEvents($container, filtered);
  });

  // Refresh Button
  $container.querySelector('#btn-admin-refresh-users')?.addEventListener('click', async () => {
    adminCache.users = null;
    adminCache.places = null;
    adminCache.reviews = null;
    await renderAdminUsers($container);
  });

  // Banned IPs modal button
  $container.querySelector('#btn-admin-show-banned-ips')?.addEventListener('click', () => {
    openAdminBannedIpsModal(bannedIps, async () => {
      await renderAdminUsers($container);
    });
  });

  _bindAdminUserRowEvents($container, users);
}

function _buildAdminUserRows(usersList) {
  if (!usersList.length) {
    return `<tr><td colspan="7" style="text-align:center;padding:30px;color:rgba(255,255,255,0.5)">لا يوجد مستخدمون مطابقون</td></tr>`;
  }

  return usersList.map(u => {
    const pts = Number(u.loyalty?.points ?? u.points ?? 0);
    const lvlInfo = getLoyaltyLevelInfo(pts);
    const lvl = lvlInfo.currentLevel;
    const placesCount = u.userPlaces.length;
    const reviewsCount = u.userReviews.length;

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <!-- User Info & IP -->
        <td style="padding:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${u.photoURL || './icons/icon-72x72.png'}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.2);flex-shrink:0" />
            <div style="min-width:0">
              <strong style="color:#fff;font-size:13.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(u.name || 'مستخدم')}</strong>
              <div style="font-size:11.5px;color:rgba(255,255,255,0.65)">${escHtml(u.email || 'بدون بريد')}</div>
              <div style="display:flex;gap:6px;align-items:center;margin-top:3px;flex-wrap:wrap">
                <span style="font-size:10px;background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;color:rgba(255,255,255,0.5)">UID: ${escHtml((u.uid || '').slice(0, 8))}...</span>
                ${u.clientIp ? `
                  <span class="badge ${u.isIpBlocked ? 'badge--rejected' : ''}" style="font-size:10px;padding:1px 6px;border-radius:4px;background:${u.isIpBlocked ? '#EF4444' : 'rgba(14,165,233,0.15)'};color:${u.isIpBlocked ? '#fff' : '#38BDF8'}">
                    IP: ${escHtml(u.clientIp)} ${u.isIpBlocked ? '🚫 محظور' : ''}
                  </span>
                ` : '<span style="font-size:10px;color:rgba(255,255,255,0.3)">IP: غير مسجل</span>'}
              </div>
            </div>
          </div>
        </td>

        <!-- Places Button -->
        <td style="text-align:center;padding:10px">
          <button class="btn btn-xs btn-user-places-modal" data-uid="${escAttr(u.uid)}" style="background:rgba(14,165,233,0.15);color:#38BDF8;border:1px solid rgba(14,165,233,0.3);border-radius:8px;font-weight:800;padding:4px 10px;font-size:11.5px">
            🏪 ${placesCount} ${placesCount === 1 ? 'مكان' : 'أماكن'}
          </button>
        </td>

        <!-- Reviews Button -->
        <td style="text-align:center;padding:10px">
          <button class="btn btn-xs btn-user-reviews-modal" data-uid="${escAttr(u.uid)}" style="background:rgba(245,166,35,0.15);color:#F5A623;border:1px solid rgba(245,166,35,0.3);border-radius:8px;font-weight:800;padding:4px 10px;font-size:11.5px">
            💬 ${reviewsCount} ${reviewsCount === 1 ? 'تعليق' : 'تعليقات'}
          </button>
        </td>

        <!-- Rank & Points -->
        <td style="text-align:center;padding:10px">
          <div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px">
            <span class="badge" style="background:rgba(245,166,35,0.15);color:${lvl.color};border:1px solid ${lvl.color}40;font-weight:800;padding:2px 8px;border-radius:6px;font-size:11px">
              ${lvl.icon} ${lvl.name}
            </span>
            <span style="font-size:11.5px;font-weight:700;color:#F5A623">${pts.toLocaleString('ar-EG')} نقطة</span>
          </div>
        </td>

        <!-- Role -->
        <td style="text-align:center;padding:10px">
          <button class="btn btn-xs btn-user-toggle-role" data-uid="${escAttr(u.uid)}" data-role="${escAttr(u.role || 'user')}" title="انقر لتبديل الصلاحية" style="font-size:11px;padding:3px 8px;border-radius:6px;border:none;background:${u.role === 'admin' || u.role === 'superadmin' ? '#F5A623' : 'rgba(255,255,255,0.1)'};color:${u.role === 'admin' || u.role === 'superadmin' ? '#0B1E30' : '#fff'};font-weight:800">
            ${u.role === 'superadmin' ? '👑 سوبر آدمن' : (u.role === 'admin' ? '⭐ مشرف' : 'عضو')}
          </button>
        </td>

        <!-- Status -->
        <td style="text-align:center;padding:10px">
          ${u.status === 'suspended' 
            ? '<span class="badge badge--rejected" style="font-size:11px">موقوف</span>' 
            : '<span class="badge badge--published" style="font-size:11px">نشط</span>'
          }
        </td>

        <!-- Actions -->
        <td style="text-align:center;padding:10px;white-space:nowrap">
          <div style="display:inline-flex;gap:5px;align-items:center">
            <!-- Points Modal Button -->
            <button class="btn btn-xs btn-edit-user-points" data-uid="${escAttr(u.uid)}" data-name="${escAttr(u.name)}" data-pts="${pts}" title="تعديل النقاط والرتبة" style="background:#F5A623;color:#0B1E30;font-weight:800;border:none;border-radius:6px;padding:4px 8px;font-size:11.5px">
              🎁 نقاط
            </button>

            <!-- Suspend / Activate Account -->
            <button class="btn btn-xs ${u.status === 'suspended' ? 'btn-success' : 'btn-outline'}" onclick="toggleUserStatus('${escAttr(u.uid)}', '${u.status === 'suspended' ? 'active' : 'suspended'}')" title="${u.status === 'suspended' ? 'تفعيل الحساب' : 'إيقاف الحساب'}" style="border-radius:6px;padding:4px 8px;font-size:11.5px;${u.status === 'suspended' ? '' : 'color:#EF4444;border-color:rgba(239,68,68,0.4)'}">
              ${u.status === 'suspended' ? '✓ تفعيل' : '✕ إيقاف'}
            </button>

            <!-- IP Ban Modal Button -->
            <button class="btn btn-xs btn-ban-user-ip" data-uid="${escAttr(u.uid)}" data-name="${escAttr(u.name)}" data-ip="${escAttr(u.clientIp || '')}" title="حظر شامل لعنوان IP والجهاز" style="background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.4);border-radius:6px;padding:4px 8px;font-size:11.5px;font-weight:800">
              🚫 حظر IP
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function _bindAdminUserRowEvents($container, usersList) {
  const usersMap = new Map();
  usersList.forEach(u => usersMap.set(u.uid, u));

  // Points Modal
  $container.querySelectorAll('.btn-edit-user-points').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.getAttribute('data-uid');
      const name = btn.getAttribute('data-name') || 'المستخدم';
      const curPts = parseInt(btn.getAttribute('data-pts'), 10) || 0;
      openAdminUserPointsModal(uid, name, curPts, async () => {
        adminCache.users = null;
        await renderAdminUsers($container);
      });
    });
  });

  // Places Modal
  $container.querySelectorAll('.btn-user-places-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.getAttribute('data-uid');
      const user = usersMap.get(uid);
      if (user) {
        openAdminUserPlacesModal(user, async () => {
          adminCache.places = null;
          await renderAdminUsers($container);
        });
      }
    });
  });

  // Reviews Modal
  $container.querySelectorAll('.btn-user-reviews-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.getAttribute('data-uid');
      const user = usersMap.get(uid);
      if (user) {
        openAdminUserReviewsModal(user, async () => {
          adminCache.reviews = null;
          await renderAdminUsers($container);
        });
      }
    });
  });

  // Toggle Admin / Member Role
  $container.querySelectorAll('.btn-user-toggle-role').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-uid');
      const currentRole = btn.getAttribute('data-role');
      if (currentRole === 'superadmin') {
        toast.info('حساب السوبر أدمن محمي دائماً ولا يمكن تعديله');
        return;
      }
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const ok = await showConfirm({
        title: newRole === 'admin' ? 'ترقية لمشرف' : 'تخفيض إلى عضو عادي',
        message: `هل أنت متأكد من تغيير صلاحية هذا المستخدم إلى (${newRole === 'admin' ? 'مشرف على المنصة' : 'عضو عادي'})؟`
      });
      if (ok) {
        try {
          await dbUpdate(`users/${uid}`, { role: newRole });
          if (adminCache.users && adminCache.users[uid]) {
            adminCache.users[uid].role = newRole;
          }
          toast.success('تم تعديل الصلاحية بنجاح');
          await renderAdminUsers($container);
        } catch (err) {
          toast.error('فشل تعديل الصلاحية');
        }
      }
    });
  });

  // IP Ban Modal
  $container.querySelectorAll('.btn-ban-user-ip').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.getAttribute('data-uid');
      const user = usersMap.get(uid);
      if (user) {
        openAdminUserBanModal(user, async () => {
          adminCache.users = null;
          await renderAdminUsers($container);
        });
      }
    });
  });
}

/**
 * Modal to Edit / Award Points & Change Loyalty Rank
 */
/**
 * Modal to Edit / Award Points & Change Loyalty Rank
 */
function openAdminUserPointsModal(uid, userName, currentPoints, onDone) {
  let selectedPresetLevel = null;
  const currentPts = parseInt(currentPoints, 10) || 0;

  const modal = showModal({
    title: `🎁 تعديل نقاط ورتبة: ${escHtml(userName)}`,
    size: 'md',
    content: `
      <form id="form-admin-user-points" style="display:flex;flex-direction:column;gap:16px" onsubmit="return false">
        
        <div style="background:rgba(245,166,35,0.08);border:1.5px solid rgba(245,166,35,0.3);border-radius:14px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7)">الرصيد الحالي للمستخدم:</div>
            <div style="font-size:1.7rem;font-weight:900;color:#F5A623" id="admin-user-live-pts-display">${currentPts.toLocaleString('ar-EG')} نقطة</div>
          </div>
          <div style="text-align:left">
            <span class="badge" style="font-size:13px;font-weight:800;padding:5px 12px;background:#F5A623;color:#0B1E30;border-radius:9999px" id="admin-user-live-lvl-badge">
              ${getLoyaltyLevelInfo(currentPts).currentLevel.icon} ${getLoyaltyLevelInfo(currentPts).currentLevel.name}
            </span>
          </div>
        </div>

        <!-- Quick Rank Picker -->
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:800">ترقية مباشرة إلى رتبة:</label>
          <select id="select-admin-target-rank" class="form-select" style="font-weight:700">
            <option value="">-- اختر رتبة لتحديد النقاط تلقائياً --</option>
            <option value="5000">👑 نخبة المنزلة والمطرية VIP (5,000+ نقطة - يفتح التوثيق الفوري)</option>
            <option value="3500">💎 مساهم موثوق ذهبي (3,500 نقطة)</option>
            <option value="1500">🥇 خبير المنزلة والمطرية (1,500 نقطة)</option>
            <option value="500">🥈 مساهم نشط (500 نقطة)</option>
            <option value="0">🥉 مستكشف مبتدئ (0 نقطة)</option>
          </select>
        </div>

        <!-- Direct Points Input -->
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:800">أو حدد إجمالي رصيد النقاط الجديد:</label>
          <input type="number" id="input-admin-new-points" class="form-input" value="${currentPts}" min="0" max="100000" step="10" required style="font-weight:800;font-size:15px" />
        </div>

        <!-- Quick Increment Buttons -->
        <div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-bottom:6px;font-weight:700">إضافة سريعة للرصيد الحالي:</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-xs btn-outline btn-quick-add-pts" data-add="100" style="border-radius:8px;font-weight:700">+100</button>
            <button type="button" class="btn btn-xs btn-outline btn-quick-add-pts" data-add="500" style="border-radius:8px;font-weight:700">+500</button>
            <button type="button" class="btn btn-xs btn-outline btn-quick-add-pts" data-add="1000" style="border-radius:8px;font-weight:700">+1,000</button>
            <button type="button" class="btn btn-xs btn-outline btn-quick-add-pts" data-add="5000" style="color:#10B981;border-color:#10B981;font-weight:800;border-radius:8px">+5,000 (توثيق فوري 👑)</button>
          </div>
        </div>

        <!-- Reason / Note -->
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:800">ملاحظة / سبب المنح:</label>
          <input type="text" id="input-admin-points-note" class="form-input" value="مكافأة وترقية من إدارة دليل المنزلة والمطرية" />
        </div>

      </form>
    `,
    buttons: [
      {
        label: '💾 حفظ وتحديث الرتبة فوراً',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const newPts = parseInt(document.getElementById('input-admin-new-points')?.value, 10);
          const note = document.getElementById('input-admin-points-note')?.value.trim() || 'تحديث رصيد من الإدارة';

          if (isNaN(newPts) || newPts < 0) {
            toast.warning('يرجى إدخال عدد نقاط صالح');
            return;
          }

          try {
            const db = getDB();
            const logId = db.ref('users/' + uid + '/loyalty/history').push().key;
            const delta = newPts - currentPts;

            // 1. Dual-write to users/{uid} and users/{uid}/loyalty
            await Promise.all([
              db.ref('users/' + uid).update({
                points: newPts
              }),
              db.ref('users/' + uid + '/loyalty').update({
                points: newPts,
                totalEarned: Math.max(newPts, currentPts),
                lastAdminUpdate: firebase.database.ServerValue.TIMESTAMP
              }),
              db.ref('users/' + uid + '/loyalty/history/' + logId).set({
                id: logId,
                type: delta >= 0 ? 'earn' : 'deduct',
                amount: delta >= 0 ? '+' + delta : String(delta),
                pointsDelta: delta,
                label: note,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                byAdmin: true
              })
            ]);

            // 2. Refresh local in-memory cache directly
            if (adminCache.users && adminCache.users[uid]) {
              adminCache.users[uid].points = newPts;
              adminCache.users[uid].loyalty = {
                ...(adminCache.users[uid].loyalty || {}),
                points: newPts,
                totalEarned: Math.max(newPts, currentPts)
              };
            }

            toast.success(`تم تحديث رتبة ورصيد ${userName} إلى ${newPts.toLocaleString('ar-EG')} نقطة بنجاح! ✨`);
            modal.close();
            if (onDone) onDone();
          } catch (err) {
            toast.error(err.message || 'فشل حفظ النقاط');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });

  // Handle Rank Picker change
  document.getElementById('select-admin-target-rank')?.addEventListener('change', (e) => {
    if (e.target.value !== '') {
      const input = document.getElementById('input-admin-new-points');
      if (input) {
        input.value = e.target.value;
        const pts = parseInt(e.target.value, 10) || 0;
        const lvl = getLoyaltyLevelInfo(pts).currentLevel;
        const badge = document.getElementById('admin-user-live-lvl-badge');
        if (badge) badge.innerHTML = `${lvl.icon} ${lvl.name}`;
      }
    }
  });

  // Handle Quick Add buttons
  document.querySelectorAll('.btn-quick-add-pts').forEach(btn => {
    btn.addEventListener('click', () => {
      const add = parseInt(btn.getAttribute('data-add'), 10) || 0;
      const input = document.getElementById('input-admin-new-points');
      if (input) {
        const val = (parseInt(input.value, 10) || 0) + add;
        input.value = val;
        const lvl = getLoyaltyLevelInfo(val).currentLevel;
        const badge = document.getElementById('admin-user-live-lvl-badge');
        if (badge) badge.innerHTML = `${lvl.icon} ${lvl.name}`;
      }
    });
  });
}

/**
 * Modal to View, Edit, and Delete Places Owned by User
 */
function openAdminUserPlacesModal(user, onDone) {
  const places = user.userPlaces || [];
  
  const modal = showModal({
    title: `🏪 أماكن المستخدم: ${escHtml(user.name || 'مستخدم')} (${places.length})`,
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="font-size:13px;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.05);padding:10px 14px;border-radius:10px">
          قائمة بجميع الأنشطة والأماكن التي أضافها هذا المستخدم. يمكنك مشاهدتها، تعديل بياناتها، نقل ملكيتها لمستخدم آخر، أو حذفها نهائياً.
        </div>

        ${places.length === 0 ? `
          <div style="text-align:center;padding:36px;color:rgba(255,255,255,0.5)">
            <div style="font-size:36px;margin-bottom:8px">🏪</div>
            لم يقم هذا المستخدم بإضافة أي أماكن حتى الآن.
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:10px;max-height:60vh;overflow-y:auto;padding-left:4px">
            ${places.map(p => {
              const placeId = p._id || p.id;
              const slugOrId = p.slug || placeId;
              return `
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
                  <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
                    <img src="${p.logoUrl || ATM_UNIFIED_LOGO}" style="width:46px;height:46px;border-radius:10px;object-fit:cover;border:1px solid rgba(255,255,255,0.15);flex-shrink:0" onerror="this.src='./icons/icon-72x72.png'" />
                    <div style="min-width:0">
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                        <strong style="color:#fff;font-size:14px">${escHtml(p.name || 'بدون اسم')}</strong>
                        ${p.verified ? '<span class="badge badge--verified" style="font-size:10px">موثق ✓</span>' : ''}
                        ${p.isSponsored ? '<span class="badge" style="font-size:10px;background:#F5A623;color:#0B1E30;font-weight:800">إعلان ممول ★</span>' : ''}
                      </div>
                      <div style="font-size:11.5px;color:rgba(255,255,255,0.6);margin-top:2px">
                        ${escHtml(p.categoryName || 'بدون تصنيف')} • ${escHtml(p.area || 'المنزلة')} ${p.phone ? '• ' + escHtml(p.phone) : ''}
                      </div>
                    </div>
                  </div>

                  <div style="display:flex;gap:6px;align-items:center">
                    <a href="place.html?slug=${encodeURIComponent(slugOrId)}" target="_blank" class="btn btn-xs btn-outline" style="border-radius:6px;padding:4px 8px;font-size:11px" title="مشاهدة المكان">
                      👁️ مشاهدة
                    </a>
                    <button class="btn btn-xs btn-user-place-edit" data-id="${escAttr(placeId)}" style="background:#0EA5E9;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:11px" title="تعديل المكان">
                      ✏️ تعديل
                    </button>
                    <button class="btn btn-xs btn-user-place-transfer" data-id="${escAttr(placeId)}" style="background:rgba(245,166,35,0.15);color:#F5A623;border:1px solid rgba(245,166,35,0.3);border-radius:6px;padding:4px 8px;font-size:11px" title="نقل الملكية">
                      🔄 نقل
                    </button>
                    <button class="btn btn-xs btn-user-place-delete" data-id="${escAttr(placeId)}" data-name="${escAttr(p.name)}" style="background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:4px 8px;font-size:11px" title="حذف المكان">
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `,
    buttons: [
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });

  // Attach Place Actions
  const modalEl = document.querySelector('.modal-content') || document.body;
  
  modalEl.querySelectorAll('.btn-user-place-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-id');
      modal.close();
      if (typeof window.editPlaceAdmin === 'function') window.editPlaceAdmin(pid);
    });
  });

  modalEl.querySelectorAll('.btn-user-place-transfer').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-id');
      modal.close();
      if (typeof window.transferPlaceOwnershipAdmin === 'function') window.transferPlaceOwnershipAdmin(pid);
    });
  });

  modalEl.querySelectorAll('.btn-user-place-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.getAttribute('data-id');
      const pname = btn.getAttribute('data-name');
      const ok = await showConfirm({
        title: 'حذف المكان نهائياً',
        message: `هل أنت متأكد من حذف المكان "${pname}" نهائياً من الدليل؟ لا يمكن التراجع عن هذا الإجراء.`
      });
      if (ok) {
        try {
          await dbRemove(`places/${pid}`);
          if (adminCache.places && adminCache.places[pid]) delete adminCache.places[pid];
          toast.success('تم حذف المكان بنجاح');
          modal.close();
          if (onDone) onDone();
        } catch (err) {
          toast.error('فشل حذف المكان');
        }
      }
    });
  });
}

/**
 * Modal to View, Edit, and Delete Comments/Reviews Written by User
 */
function openAdminUserReviewsModal(user, onDone) {
  const reviews = user.userReviews || [];

  const modal = showModal({
    title: `💬 تعليقات وتقييمات: ${escHtml(user.name || 'مستخدم')} (${reviews.length})`,
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="font-size:13px;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.05);padding:10px 14px;border-radius:10px">
          استعراض شامل لكافة التقييمات والآراء التي كتبها هذا المستخدم في أي مكان بالدليل، مع إمكانية تعديل نص التقييم أو حذفه فوراً.
        </div>

        ${reviews.length === 0 ? `
          <div style="text-align:center;padding:36px;color:rgba(255,255,255,0.5)">
            <div style="font-size:36px;margin-bottom:8px">💬</div>
            لم يقم هذا المستخدم بكتابة أي تقييمات أو تعليقات حتى الآن.
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:10px;max-height:60vh;overflow-y:auto;padding-left:4px">
            ${reviews.map(r => {
              const stars = '⭐'.repeat(r.rating || 5);
              const dateStr = r.createdAt ? formatDate(r.createdAt) : '—';
              return `
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
                    <div>
                      <span style="font-size:11px;color:rgba(255,255,255,0.5)">علق في:</span>
                      <strong style="color:#38BDF8;font-size:13.5px;margin-right:4px">${escHtml(r.placeName || 'مكان بالدليل')}</strong>
                      <span style="font-size:11px;color:rgba(255,255,255,0.4);margin-right:8px">${dateStr}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                      <span style="font-size:12px">${stars}</span>
                      <button class="btn btn-xs btn-user-review-edit" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" data-rating="${r.rating || 5}" data-comment="${escAttr(r.comment || '')}" style="background:#0EA5E9;color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:11px">
                        ✏️ تعديل
                      </button>
                      <button class="btn btn-xs btn-user-review-delete" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" style="background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:3px 8px;font-size:11px">
                        🗑️ حذف
                      </button>
                    </div>
                  </div>

                  <div style="background:rgba(0,0,0,0.25);border-radius:8px;padding:10px;font-size:13px;color:rgba(255,255,255,0.9);line-height:1.6">
                    ${escHtml(r.comment || 'بدون تعليق نصي')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `,
    buttons: [
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });

  const modalEl = document.querySelector('.modal-content') || document.body;

  // Edit Review
  modalEl.querySelectorAll('.btn-user-review-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-pid');
      const rid = btn.getAttribute('data-rid');
      const rating = btn.getAttribute('data-rating');
      const currentComment = btn.getAttribute('data-comment') || '';

      const editModal = showModal({
        title: '✏️ تعديل التعليق',
        size: 'sm',
        content: `
          <form id="form-edit-user-single-review" style="display:flex;flex-direction:column;gap:12px" onsubmit="return false">
            <div class="form-group">
              <label class="form-label">التقييم بالنجوم:</label>
              <select id="input-edit-rev-rating" class="form-select">
                <option value="5" ${rating == 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5 نجوم)</option>
                <option value="4" ${rating == 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4 نجوم)</option>
                <option value="3" ${rating == 3 ? 'selected' : ''}>⭐⭐⭐ (3 نجوم)</option>
                <option value="2" ${rating == 2 ? 'selected' : ''}>⭐⭐ (نجمتان)</option>
                <option value="1" ${rating == 1 ? 'selected' : ''}>⭐ (نجمة واحدة)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">نص التعليق:</label>
              <textarea id="input-edit-rev-comment" class="form-textarea" rows="4">${escHtml(currentComment)}</textarea>
            </div>
          </form>
        `,
        buttons: [
          {
            label: '💾 حفظ التعديل',
            type: 'primary',
            closeOnClick: false,
            onClick: async () => {
              const newRating = parseInt(document.getElementById('input-edit-rev-rating')?.value, 10) || 5;
              const newComment = document.getElementById('input-edit-rev-comment')?.value.trim() || '';
              try {
                await adminUpdateReview(pid, rid, { rating: newRating, comment: newComment });
                toast.success('تم تحديث التعليق بنجاح');
                editModal.close();
                modal.close();
                if (onDone) onDone();
              } catch (err) {
                toast.error(err.message || 'فشل تحديث التعليق');
              }
            }
          },
          { label: 'إلغاء', type: 'ghost', closeOnClick: true }
        ]
      });
    });
  });

  // Delete Review
  modalEl.querySelectorAll('.btn-user-review-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.getAttribute('data-pid');
      const rid = btn.getAttribute('data-rid');
      const ok = await showConfirm({
        title: 'حذف التعليق',
        message: 'هل أنت متأكد من حذف هذا التعليق نهائياً؟'
      });
      if (ok) {
        try {
          await adminDeleteReview(pid, rid);
          toast.success('تم حذف التعليق بنجاح');
          modal.close();
          if (onDone) onDone();
        } catch (err) {
          toast.error('فشل حذف التعليق');
        }
      }
    });
  });
}

/**
 * Modal to Ban User & User IP Address
 */
function openAdminUserBanModal(user, onDone) {
  const defaultIp = user.clientIp || '';

  const modal = showModal({
    title: `🚫 حظر المستخدم وعنوان IP: ${escHtml(user.name || 'مستخدم')}`,
    size: 'md',
    content: `
      <form id="form-admin-ban-user-ip" style="display:flex;flex-direction:column;gap:14px" onsubmit="return false">
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:12px;font-size:13px;color:#FCA5A5;line-height:1.6">
          ⚠️ <strong>إجراء حاسم:</strong> حظر المستخدم يمنعه من تسجيل الدخول، وحظر عنوان IP يمنع جهازه وشبكته من فتح أي صفحة في الدليل نهائياً، مع شاشة حظر توضح سبب المخالفة.
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:800">عنوان IP الخاص بالمستخدم:</label>
          <input type="text" id="input-ban-ip-address" class="form-input" value="${escAttr(defaultIp)}" placeholder="مثال: 197.35.120.44" style="direction:ltr;font-family:monospace;font-weight:700" />
          <div style="font-size:11.5px;color:rgba(255,255,255,0.5);margin-top:4px">
            ${defaultIp ? '✓ تم التقاط عنوان الـ IP تلقائياً من آخر تسجيل دخول' : 'لم يتم تسجيل IP تلقائياً، يمكنك إدخاله يدوياً'}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:800">مدة الحظر:</label>
          <select id="select-ban-ip-duration" class="form-select">
            <option value="permanent">⛔ حظر نهائي ودائم (Permanent Ban)</option>
            <option value="365">عام كامل (365 يوم)</option>
            <option value="90">3 شهور (90 يوم)</option>
            <option value="30" selected>شهر واحد (30 يوم)</option>
            <option value="7">أسبوع واحد (7 أيام)</option>
            <option value="1">24 ساعة (يوم واحد)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:800">سبب الحظر (يظهر للمستخدم عند محاولة الدخول):</label>
          <input type="text" id="input-ban-ip-reason" class="form-input" value="مخالفة معايير وسياسات النشر على دليل المنزلة والمطرية الرقمي" required />
        </div>

        <div style="display:flex;gap:10px;flex-direction:column;background:rgba(255,255,255,0.03);padding:10px;border-radius:8px">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#fff;cursor:pointer">
            <input type="checkbox" id="check-ban-user-account" checked />
            <span>إيقاف حساب المستخدم فوراً (${escHtml(user.email || user.name)})</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#fff;cursor:pointer">
            <input type="checkbox" id="check-ban-user-ip" checked />
            <span>حظر عنوان الـ IP والشبكة بالكامل في قاعدة البيانات</span>
          </label>
        </div>
      </form>
    `,
    buttons: [
      {
        label: '🚫 تنفيذ الحظر الصارم فوراً',
        type: 'danger',
        closeOnClick: false,
        onClick: async () => {
          const ip = document.getElementById('input-ban-ip-address')?.value.trim();
          const durationVal = document.getElementById('select-ban-ip-duration')?.value;
          const isPermanent = durationVal === 'permanent';
          const durationDays = isPermanent ? null : parseInt(durationVal, 10);
          const reason = document.getElementById('input-ban-ip-reason')?.value.trim() || 'مخالفة السياسات';
          const banAccount = document.getElementById('check-ban-user-account')?.checked;
          const banIp = document.getElementById('check-ban-user-ip')?.checked;

          if (banIp && !ip) {
            toast.warning('يرجى تحديد عنوان IP صالح للحظر، أو إلغاء تحديد خيار حظر الـ IP');
            return;
          }

          try {
            // 1. Suspend User Account
            if (banAccount) {
              await dbUpdate(`users/${user.uid}`, {
                status: 'suspended',
                suspendedAt: Date.now(),
                suspensionReason: reason
              });
              if (adminCache.users && adminCache.users[user.uid]) {
                adminCache.users[user.uid].status = 'suspended';
              }
            }

            // 2. Ban IP in bannedIPs
            if (banIp && ip) {
              await adminBanIp(ip, {
                reason,
                durationDays: durationDays || 30,
                isPermanent,
                bannedBy: _currentUser?.name || 'إدارة الدليل',
                userId: user.uid,
                userName: user.name || 'مستخدم'
              });
            }

            toast.success(`تم تنفيذ الحظر بنجاح!`);
            modal.close();
            if (onDone) onDone();
          } catch (err) {
            toast.error(err.message || 'فشلت عملية الحظر');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}

/**
 * Modal to View and Unban Banned IP Addresses
 */
function openAdminBannedIpsModal(bannedIpsList, onDone) {
  const modal = showModal({
    title: `🚫 سجل عناوين IP المحظورة (${bannedIpsList.length})`,
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="font-size:13px;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.05);padding:10px 14px;border-radius:10px">
          قائمة بجميع عناوين IP والأجهزة المحظورة من الوصول للمنصة. يمكنك إلغاء حظر أي عنوان بضغطة زر.
        </div>

        <!-- Add Manual IP Ban Input -->
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <input type="text" id="input-manual-ban-ip" class="form-input" placeholder="أدخل عنوان IP لحظره يدوياً (مثال: 156.204.11.89)" style="flex:1;min-width:200px;direction:ltr;font-family:monospace;font-weight:700" />
          <input type="text" id="input-manual-ban-reason" class="form-input" placeholder="سبب الحظر" style="flex:1;min-width:180px" value="حظر إداري مباشر" />
          <button class="btn btn-sm btn-danger" id="btn-submit-manual-ip-ban" style="border-radius:8px;font-weight:800;white-space:nowrap">
            🚫 حظر هذا الـ IP
          </button>
        </div>

        ${bannedIpsList.length === 0 ? `
          <div style="text-align:center;padding:36px;color:rgba(255,255,255,0.5)">
            <div style="font-size:36px;margin-bottom:8px">🛡️</div>
            لا توجد أي عناوين IP محظورة حالياً. المنصة نظيفة تماماً!
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:10px;max-height:55vh;overflow-y:auto;padding-left:4px">
            ${bannedIpsList.map(b => {
              const isPermanent = b.isPermanent;
              const dateStr = b.bannedAt ? formatDate(b.bannedAt) : '—';
              const untilStr = isPermanent ? 'حظر دائم' : (b.bannedUntil ? 'حتى ' + new Date(b.bannedUntil).toLocaleDateString('ar-EG') : '—');
              return `
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                      <strong style="color:#EF4444;font-family:monospace;font-size:14px;direction:ltr">${escHtml(b.ip)}</strong>
                      <span class="badge ${isPermanent ? 'badge--rejected' : 'badge--warning'}" style="font-size:11px">
                        ${untilStr}
                      </span>
                      ${b.userName ? `<span style="font-size:11.5px;color:rgba(255,255,255,0.7)">المستخدم: ${escHtml(b.userName)}</span>` : ''}
                    </div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px">
                      السبب: ${escHtml(b.reason || 'مخالفة السياسة')}
                    </div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px">
                      تاريخ الحظر: ${dateStr} • بواسطة: ${escHtml(b.bannedBy || 'الإدارة')}
                    </div>
                  </div>

                  <div>
                    <button class="btn btn-xs btn-success btn-unban-ip-action" data-ip="${escAttr(b.ip)}" data-key="${escAttr(b.ipKey)}" style="border-radius:6px;font-weight:800;padding:5px 12px;font-size:12px">
                      ✓ إلغاء الحظر
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `,
    buttons: [
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });

  const modalEl = document.querySelector('.modal-content') || document.body;

  // Unban button
  modalEl.querySelectorAll('.btn-unban-ip-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ip = btn.getAttribute('data-ip');
      const ipKey = btn.getAttribute('data-key');
      const ok = await showConfirm({
        title: 'إلغاء حظر الـ IP',
        message: `هل أنت متأكد من إلغاء الحظر عن عنوان IP (${ip}) والسماح له بدخول المنصة مجدداً؟`
      });
      if (ok) {
        try {
          await adminUnbanIp(ipKey || ip);
          toast.success(`تم إلغاء الحظر عن ${ip} بنجاح`);
          modal.close();
          if (onDone) onDone();
        } catch (err) {
          toast.error('فشل إلغاء الحظر');
        }
      }
    });
  });

  // Manual Ban Button
  modalEl.querySelector('#btn-submit-manual-ip-ban')?.addEventListener('click', async () => {
    const ip = modalEl.querySelector('#input-manual-ban-ip')?.value.trim();
    const reason = modalEl.querySelector('#input-manual-ban-reason')?.value.trim() || 'حظر إداري مباشر';
    if (!ip) {
      toast.warning('يرجى كتابة عنوان IP صالح');
      return;
    }
    try {
      await adminBanIp(ip, {
        reason,
        durationDays: 365,
        isPermanent: false,
        bannedBy: _currentUser?.name || 'إدارة الدليل'
      });
      toast.success(`تم حظر ${ip} بنجاح`);
      modal.close();
      if (onDone) onDone();
    } catch (err) {
      toast.error('فشل حظر عنوان الـ IP');
    }
  });
}

// ─────────────────────────────────────────────
//  6. Offers (إدارة العروض)
// ─────────────────────────────────────────────
async function renderAdminOffers($container) {
  if (!adminCache.offers) {
    adminCache.offers = (await dbGet('offers')) || {};
  }
  const offers = Object.entries(adminCache.offers || {}).map(([id, o]) => ({ ...o, _id: id }));

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="dashboard-header__title">إدارة العروض والخصومات (${offers.length})</h1>
          <div class="dashboard-header__subtitle">مشاهدة وتعديل واعتماد وحذف عروض وتخفيضات الأنشطة التجارية</div>
        </div>
      </div>

      <!-- Offers Search Filter -->
      <div class="filter-bar" style="margin-bottom:16px">
        <input type="search" id="admin-offers-search" class="form-input" placeholder="🔍 بحث بعنوان العرض أو اسم المكان..." style="max-width:380px;margin:0" />
      </div>

      <div class="dashboard-table-wrapper">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th style="width:60px">الصورة</th>
              <th>العرض</th>
              <th>المكان</th>
              <th>السعر بعد الخصم</th>
              <th>السعر القديم</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody id="admin-offers-tbody">
            ${renderAdminOffersTableRows(offers)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('admin-offers-search')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = offers.filter(o => 
      !q ||
      (o.title || '').toLowerCase().includes(q) ||
      (o.placeName || '').toLowerCase().includes(q) ||
      (o.description || '').toLowerCase().includes(q)
    );
    const tbody = document.getElementById('admin-offers-tbody');
    if (tbody) tbody.innerHTML = renderAdminOffersTableRows(filtered);
  });
}

function renderAdminOffersTableRows(offers) {
  if (!offers.length) return '<tr><td colspan="7" class="text-center" style="padding:30px;color:var(--text-muted)">لا توجد عروض حالياً</td></tr>';

  return offers.map(o => {
    const img = o.imageUrl || './icons/icon-192x192.png';
    const isActive = o.status === 'active';

    return `
      <tr>
        <td>
          <img src="${escAttr(img)}" alt="${escAttr(o.title)}" style="width:44px;height:44px;object-fit:cover;border-radius:var(--radius-md);border:1px solid var(--border)" onerror="this.src='./icons/icon-192x192.png'" />
        </td>
        <td>
          <strong style="font-size:13.5px">${escHtml(o.title || '')}</strong>
          ${o.discount ? `<span class="badge badge--danger" style="margin-right:6px;font-size:10px;font-weight:700">خصم ${o.discount}%</span>` : ''}
          ${o.description ? `<div style="font-size:11.5px;color:var(--text-muted);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px">${escHtml(o.description)}</div>` : ''}
        </td>
        <td>
          <a href="place.html?slug=${escAttr(o.placeSlug || o.placeId)}" target="_blank" style="color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:4px">
            ${escHtml(o.placeName || 'المكان')}
          </a>
        </td>
        <td><strong style="color:var(--accent);font-size:1.05rem">${o.newPrice || 0} ج.م</strong></td>
        <td>${o.oldPrice ? `<span style="text-decoration:line-through;color:var(--text-muted);font-size:12px">${o.oldPrice} ج.م</span>` : '<span class="text-muted">—</span>'}</td>
        <td>
          <span class="badge ${isActive ? 'badge--published' : 'badge--pending'}">${isActive ? '✓ نشط' : 'متوقف'}</span>
        </td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn btn-xs btn-outline" style="background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE" onclick="adminViewOfferAction('${escAttr(o._id)}')" title="مشاهدة تفاصيل العرض">
              ${ICONS.eye} مشاهدة
            </button>
            <button class="btn btn-xs btn-outline" style="background:#F0FDF4;color:#15803D;border-color:#BBF7D0" onclick="adminEditOfferAction('${escAttr(o._id)}')" title="تعديل بيانات العرض">
              ${ICONS.edit} تعديل
            </button>
            <button class="btn btn-xs btn-danger" onclick="deleteOfferAdmin('${escAttr(o._id)}')" title="حذف العرض">
              ${ICONS.trash}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
//  7. Ads & Place Promotion (إدارة الإعلانات والترويج)
// ─────────────────────────────────────────────
async function renderAdminAds($container) {
  if (!adminCache.ads || !adminCache.places) {
    const [adsMap, placesMap] = await Promise.all([dbGet('ads'), dbGet('places')]);
    adminCache.ads = adsMap || {};
    adminCache.places = placesMap || {};
  }

  const ads = Object.entries(adminCache.ads || {}).map(([id, a]) => ({ ...a, _id: id }));
  const sponsoredPlaces = Object.entries(adminCache.places || {})
    .map(([id, p]) => ({ ...p, _id: id }))
    .filter(p => p.isSponsored || p.isFeatured || p.isPromoted);

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إدارة الإعلانات وترويج الأماكن</h1>
          <div class="dashboard-header__subtitle">تعيين الأماكن كإعلانات مدفوعة في صدارة الصفحات + إضافة بانرات مخصصة</div>
        </div>
        <button class="btn btn-primary" id="btn-add-ad">
          ${ICONS.plus} إضافة إعلان / ترويج مكان
        </button>
      </div>

      <!-- Sponsored Places Table -->
      <div class="form-section" style="margin-bottom:24px;border:1.5px solid #FF8C00">
        <h2 class="form-section__title" style="color:#FF8C00">
          <span>⭐</span> الأماكن المميزة كإعلانات مدفوعة (${sponsoredPlaces.length})
        </h2>
        <div class="dashboard-table-wrapper">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>المكان</th>
                <th>التصنيف</th>
                <th>المنطقة</th>
                <th>الأولوية في العرض</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              ${sponsoredPlaces.length === 0 ? '<tr><td colspan="5" class="text-center">لا توجد أماكن معينة كإعلانات مدفوعة حالياً. اضغط على الزر بالأعلى لاختيار مكان.</td></tr>' : sponsoredPlaces.map(p => `
                <tr>
                  <td>
                    <strong>${escHtml(p.name)}</strong>
                    <div style="font-size:11px;color:var(--text-muted)">${p.phone || ''}</div>
                  </td>
                  <td>${escHtml(p.categoryId || 'عام')}</td>
                  <td>${escHtml(p.area || 'المنزلة')}</td>
                  <td>
                    <span class="badge-sponsored">⭐ الأولى في كل الصفحات</span>
                  </td>
                  <td>
                    <button class="btn btn-xs btn-danger" onclick="togglePlaceSponsored('${escAttr(p._id)}', false)">
                      ${ICONS.x} إلغاء الإعلان
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- General Banner Ads Table -->
      <div class="form-section">
        <h2 class="form-section__title">
          <span>${ICONS.megaphone}</span> البانرات الإعلانية العامة (${ads.length})
        </h2>
        <div class="dashboard-table-wrapper">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>البانر</th>
                <th>العنوان</th>
                <th>الموضع</th>
                <th>النوع</th>
                <th>النقرات</th>
                <th>الحالة</th>
                <th>حذف</th>
              </tr>
            </thead>
            <tbody>
              ${ads.length === 0 ? '<tr><td colspan="7" class="text-center">لا توجد بانرات إعلانية نشطة</td></tr>' : ads.map(a => `
                <tr>
                  <td>
                    ${a.imageUrl ? `<img src="${escAttr(a.imageUrl)}" style="height:36px;border-radius:4px;object-fit:cover" />` : 'نص'}
                  </td>
                  <td><strong>${escHtml(a.title || '')}</strong></td>
                  <td>${escHtml(a.placement || 'homepage')}</td>
                  <td>${a.placeId ? '<span class="chip chip--warning">مكان مميز</span>' : '<span class="chip chip--primary">بانر عام</span>'}</td>
                  <td>${a.clicks || 0}</td>
                  <td>${a.isActive ? '<span class="badge badge--published">نشط</span>' : '<span class="badge badge--pending">متوقف</span>'}</td>
                  <td>
                    <button class="btn btn-xs btn-danger" onclick="deleteAdAdmin('${escAttr(a._id)}')">${ICONS.trash} حذف</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-add-ad')?.addEventListener('click', () => {
    showAddAdModal(_currentUser, () => switchAdminSection('ads', false));
  });
}

function showAddAdModal(user, onDone) {
  const placesList = Object.entries(adminCache.places || {}).map(([id, p]) => ({ ...p, _id: id }));

  const modal = showModal({
    title: 'إضافة إعلان جديد / ترويج مكان',
    content: `
      <div class="form-group">
        <label class="form-label">نوع الإعلان <span class="required">*</span></label>
        <select id="ad-type-selector" class="form-select">
          <option value="place">⭐ ترويج مكان من الدليل (إعلان مدفوع يظهر أولاً)</option>
          <option value="banner">📢 بانر إعلاني مخصص (رابط وصورة خارجية)</option>
        </select>
      </div>

      <!-- Option 1: Promote Place -->
      <div id="ad-place-group" class="form-group">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <label class="form-label" style="margin:0;font-weight:700">اختر المكان لترويجه كإعلان مدفوع <span class="required">*</span></label>
          <span id="ad-place-match-count" style="font-size:11px;color:var(--text-muted)">${placesList.length} مكان متاح</span>
        </div>

        <!-- Fast Search Input -->
        <div style="position:relative;margin-bottom:8px">
          <input 
            type="search" 
            id="ad-place-search" 
            class="form-input" 
            placeholder="🔍 اكتب اسم المكان، التصنيف، المنطقة، أو رقم الهاتف للبحث السريع..." 
            autocomplete="off" 
            style="padding-right:34px;font-size:13px;border-radius:10px"
          />
          <span style="position:absolute;right:11px;top:50%;transform:translateY(-50%);font-size:15px;pointer-events:none">🔎</span>
        </div>

        <select id="ad-place-id" class="form-select" style="border-radius:10px;font-weight:600">
          <option value="">-- اختر المكان من القائمة (${placesList.length} مكان) --</option>
          ${placesList.map(p => `
            <option value="${escAttr(p._id)}" data-name="${escAttr(p.name)}" data-slug="${escAttr(p.slug)}" data-img="${escAttr(p.coverImageUrl || p.logoUrl || '')}" data-phone="${escAttr(p.phone || '')}" data-cat="${escAttr(p.categoryName || p.categoryId || '')}" data-area="${escAttr(p.area || 'المنزلة')}">
              ${escHtml(p.name)} (${escHtml(p.categoryName || p.categoryId || 'عام')} - ${escHtml(p.area || 'المنزلة')}) ${p.phone ? '📞 ' + escHtml(p.phone) : ''}
            </option>
          `).join('')}
        </select>

        <!-- Selected Place Preview Card -->
        <div id="ad-place-preview-card" style="display:none;margin-top:10px;padding:10px 14px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:12px;align-items:center;gap:12px">
          <div class="place-preview-img" style="width:44px;height:44px;border-radius:8px;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;font-size:20px">
            🏢
          </div>
          <div style="flex:1;min-width:0">
            <div class="place-preview-name" style="font-weight:800;font-size:13.5px;color:var(--text-primary)" class="truncate">اسم المكان</div>
            <div class="place-preview-meta" style="font-size:11.5px;color:var(--text-muted)" class="truncate">التصنيف والمنطقة</div>
          </div>
          <span class="chip chip--warning" style="font-size:11px;padding:3px 8px;font-weight:700">ترويج كإعلان مدفوع ⭐</span>
        </div>

        <div style="margin-top:12px">
          <label class="form-label" style="font-weight:700">مدة الإعلان (بالأيام) <span class="required">*</span></label>
          <input type="number" id="ad-place-days" class="form-input" value="30" placeholder="عدد الأيام (مثال: 7 أو 30 أو 90)" style="border-radius:10px" />
        </div>
        <div class="form-hint" style="margin-top:6px">عند اختيار مكان، سيتم منحه شارة "إعلان مدفوع" وإعطائه الأولوية القصوى ليظهر أولاً في كل الصفحات حتى تاريخ انتهاء المدة المحددة.</div>
      </div>

      <!-- Option 2: Custom Banner Fields -->
      <div id="ad-custom-fields" style="display:none">
        <div class="form-group">
          <label class="form-label">عنوان الإعلان <span class="required">*</span></label>
          <input type="text" id="ad-title" class="form-input" placeholder="مثال: خصم 50% على جميع المأكولات" />
        </div>
        <div class="form-group">
          <label class="form-label">رابط التوجيه (URL)</label>
          <input type="url" id="ad-link" class="form-input" placeholder="https://..." style="direction:ltr" />
        </div>
        <div class="form-group">
          <label class="form-label">رابط صورة الإعلان (URL)</label>
          <input type="url" id="ad-img" class="form-input" style="direction:ltr" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">مكان الظهور</label>
        <select id="ad-placement" class="form-select">
          <option value="all">جميع الصفحات والتصنيفات (شامل)</option>
          <option value="homepage">الصفحة الرئيسية فقط</option>
          <option value="category">صفحات التصنيفات</option>
          <option value="sidebar">الشريط الجانبي</option>
        </select>
      </div>
    `,
    buttons: [
      {
        label: 'حفظ وتفعيل الإعلان',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const type = document.getElementById('ad-type-selector')?.value;
          const placement = document.getElementById('ad-placement')?.value || 'all';

          if (type === 'place') {
            const placeSelect = document.getElementById('ad-place-id');
            const placeId = placeSelect?.value;
            const opt = placeSelect?.selectedOptions[0];
            const daysNum = Number(document.getElementById('ad-place-days')?.value) || 30;

            if (!placeId) {
              toast.warning('يرجى اختيار المكان المراد ترويجه');
              return;
            }

            const placeName = opt?.dataset.name || 'مكان مميز';
            const placeSlug = opt?.dataset.slug || placeId;
            const placeImg = opt?.dataset.img || '';
            const expiresAt = Date.now() + (daysNum * 24 * 60 * 60 * 1000);

            try {
              // 1. Set Place as Sponsored in database
              await dbUpdate(`places/${placeId}`, {
                isSponsored: true,
                isFeatured: true,
                sponsoredAt: serverTimestamp(),
                sponsoredUntil: expiresAt
              });

              if (adminCache.places && adminCache.places[placeId]) {
                adminCache.places[placeId].isSponsored = true;
                adminCache.places[placeId].isFeatured = true;
                adminCache.places[placeId].sponsoredUntil = expiresAt;
              }

              // 2. Create Ad record
              const newAd = {
                title: `إعلان: ${placeName}`,
                placeId,
                link: `place.html?slug=${placeSlug}`,
                imageUrl: placeImg,
                placement,
                priority: 10,
                isActive: true,
                startDate: Date.now(),
                endDate: expiresAt,
                clicks: 0,
                createdAt: serverTimestamp(),
                createdBy: user.uid
              };

              const ref = await dbPush('ads', newAd);
              if (adminCache.ads) adminCache.ads[ref.key] = newAd;

              toast.success(`تم تفعيل ترويج "${placeName}" كإعلان مدفوع يظهر أولاً في كل مكان ✓`);
              modal.close();
              onDone();
            } catch (err) {
              toast.error('فشلت العملية: ' + err.message);
            }
          } else {
            // Custom Banner
            const title = document.getElementById('ad-title')?.value.trim();
            const link = document.getElementById('ad-link')?.value.trim();
            const imageUrl = document.getElementById('ad-img')?.value.trim();

            if (!title) { toast.warning('يرجى كتابة عنوان الإعلان'); return; }

            try {
              const newAd = {
                title,
                link,
                imageUrl,
                placement,
                priority: 1,
                isActive: true,
                startDate: Date.now(),
                endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
                clicks: 0,
                createdAt: serverTimestamp(),
                createdBy: user.uid
              };
              const ref = await dbPush('ads', newAd);
              if (adminCache.ads) adminCache.ads[ref.key] = newAd;
              toast.success('تمت إضافة الإعلان بنجاح ✓');
              modal.close();
              onDone();
            } catch (e) {
              toast.error('فشل حفظ الإعلان');
            }
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });

  // Toggle dynamic form visibility
  document.getElementById('ad-type-selector')?.addEventListener('change', (e) => {
    const isPlace = e.target.value === 'place';
    const placeGroup = document.getElementById('ad-place-group');
    const customFields = document.getElementById('ad-custom-fields');
    if (placeGroup) placeGroup.style.display = isPlace ? 'block' : 'none';
    if (customFields) customFields.style.display = isPlace ? 'none' : 'block';
  });

  // Fast live search for places in Ad modal
  setupPlaceLiveSearch({
    searchInputId: 'ad-place-search',
    selectElementId: 'ad-place-id',
    matchCountId: 'ad-place-match-count',
    previewCardId: 'ad-place-preview-card',
    totalCount: placesList.length
  });
}

// ─────────────────────────────────────────────
//  8. Settings
// ─────────────────────────────────────────────
async function renderAdminSettings($container) {
  if (!adminCache.settings) {
    adminCache.settings = (await getSettings()) || {};
  }
  const settings = adminCache.settings;

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إعدادات المنصة الشاملة</h1>
          <div class="dashboard-header__subtitle">تحكم كامل في نصوص وروابط وحدود المنصة دون الحاجة لتعديل الكود</div>
        </div>
      </div>

      <form id="admin-settings-form">
        <!-- General & Branding -->
        <div class="form-section">
          <h2 class="form-section__title"><span>${ICONS.globe}</span> الهوية العامة</h2>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">اسم الموقع</label>
              <input type="text" id="s-site-name" class="form-input" value="${escAttr(settings.general?.siteName || 'المنزلة وناسها')}" />
            </div>
            <div class="form-group">
              <label class="form-label">اللون الرئيسي (Primary Color Hex)</label>
              <input type="color" id="s-color" class="form-input" style="height:48px;padding:4px" value="${escAttr(settings.general?.primaryColor || '#1B4F72')}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">وصف الموقع (Tagline)</label>
            <input type="text" id="s-desc" class="form-input" value="${escAttr(settings.general?.siteDescription || 'دليل المنزلة والمطرية الرقمي — الأماكن، المحلات، الأطباء، العروض، والخدمات')}" />
          </div>
        </div>

        <!-- WhatsApp & Contact -->
        <div class="form-section">
          <h2 class="form-section__title"><span>${ICONS.megaphone}</span> واتساب والتواصل مع الإدارة</h2>
          <div class="form-group">
            <label class="form-label">رابط واتساب الإدارة لطلب التوثيق <span class="required">*</span></label>
            <input type="url" id="s-wa-link" class="form-input" style="direction:ltr;text-align:left" value="${escAttr(settings.contact?.whatsappLink || 'https://wa.me/201000000000')}" />
            <div class="form-hint">هذا الرابط يُفتح عند ضغط صاحب المكان على "طلب التوثيق عبر WhatsApp"</div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">بريد الدعم الفني</label>
              <input type="email" id="s-email" class="form-input" style="direction:ltr;text-align:left" value="${escAttr(settings.contact?.email || 'info@elmanzala.com')}" />
            </div>
            <div class="form-group">
              <label class="form-label">رابط فيسبوك المنصة</label>
              <input type="url" id="s-fb" class="form-input" style="direction:ltr;text-align:left" value="${escAttr(settings.social?.facebook || '')}" />
            </div>
          </div>
        </div>

        <!-- Telegram Bot Notifications Settings -->
        <div class="form-section" style="border:1px solid rgba(0, 136, 204, 0.3);background:rgba(0, 136, 204, 0.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:var(--space-3)">
            <h2 class="form-section__title" style="margin-bottom:0;color:#0088cc">
              <span>✈️</span> إعدادات بوت تليجرام للإشعارات الفورية
            </h2>
            <span class="badge" style="background:#0088cc;color:#fff;font-size:11px">Telegram Bot Engine</span>
          </div>

          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:var(--space-3);line-height:1.6">
            يقوم البوت بإرسال إشعارات فورية للإدارة عند إضافة أماكن جديدة، طلبات التوثيق، التعليقات الجديدة، بلاغات الإساءة، ورسائل تواصل معنا، مع إمكانية التوثيق والرفض بضغطة زر من تليجرام مباشرة.
          </p>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">توكن البوت (Bot Token من @BotFather)</label>
              <input type="text" id="s-tg-token" class="form-input" placeholder="مثال: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ" style="direction:ltr;text-align:left" value="${escAttr(settings.telegram?.botToken || '')}" />
              <div class="form-hint">احصل عليه مجاناً عبر فتح محادثة مع @BotFather في تليجرام وإنشاء بوت.</div>
            </div>

            <div class="form-group">
              <label class="form-label">معرف شات الإدارة (Admin Chat ID)</label>
              <input type="text" id="s-tg-chat-id" class="form-input" placeholder="مثال: 123456789" style="direction:ltr;text-align:left" value="${escAttr(settings.telegram?.adminChatId || '')}" />
              <div class="form-hint">احصل على معرف حسابك الشخصي عبر مراسلة @userinfobot في تليجرام.</div>
            </div>
          </div>

          <!-- Telegram Action Buttons -->
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:var(--space-2)">
            <button type="button" class="btn btn-sm btn-secondary" id="btn-tg-test-notify" style="background:#0088cc;color:#fff;border-color:#0088cc">
              <span>🔔</span> إرسال رسالة تجريبية وفحص الاتصال
            </button>
            <button type="button" class="btn btn-sm btn-ghost" id="btn-tg-set-webhook">
              <span>🔗</span> إعادة ربط الويب هوك (Set Webhook)
            </button>
          </div>
          <div id="tg-test-status" style="display:none;margin-top:10px;font-size:12.5px;padding:8px 12px;border-radius:var(--radius-md)"></div>
        </div>

        <!-- Limits -->
        <div class="form-section">
          <h2 class="form-section__title"><span>${ICONS.cog}</span> حدود العروض والمنتجات</h2>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">عروض المكان الموثق (يومياً)</label>
              <input type="number" id="s-lim-off-ver" class="form-input" value="${settings.limits?.offersVerified || 3}" />
            </div>
            <div class="form-group">
              <label class="form-label">عروض المكان غير الموثق (يومياً)</label>
              <input type="number" id="s-lim-off-unver" class="form-input" value="${settings.limits?.offersUnverified || 1}" />
            </div>
            <div class="form-group">
              <label class="form-label">الحد الأقصى للمنتجات للموثق</label>
              <input type="number" id="s-lim-prod-ver" class="form-input" value="${settings.limits?.productsVerified || 350}" />
            </div>
          </div>
        </div>

        <div style="padding-bottom:var(--space-8)">
          <button type="submit" class="btn btn-primary btn-lg" id="btn-save-settings">
            ${ICONS.check} حفظ جميع الإعدادات
          </button>
        </div>
      </form>
    </div>
  `;

  // Telegram Test Notification Handler
  document.getElementById('btn-tg-test-notify')?.addEventListener('click', async () => {
    const token = document.getElementById('s-tg-token')?.value.trim();
    const chatId = document.getElementById('s-tg-chat-id')?.value.trim();
    const statusBox = document.getElementById('tg-test-status');

    if (!token || !chatId) {
      toast.warning('يرجى كتابة توكن البوت ومعرف الشات أولاً');
      return;
    }

    const btn = document.getElementById('btn-tg-test-notify');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      // 1. Direct Telegram API call from browser
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🎉 *مرحباً بك في نظام إشعارات المنزلة وناسها!*\n\n✅ تم اختبار الاتصال ببوت تليجرام بنجاح وهو يعمل الآن بكفاءة 100% لاستقبال جميع إشعارات المنصة.\n\n⏰ الوقت: ${new Date().toLocaleTimeString('ar-EG')}`,
          parse_mode: 'Markdown'
        })
      });

      const data = await res.json();
      if (data.ok) {
        toast.success('تم إرسال الرسالة التجريبية إلى تليجرام بنجاح! تفقد هاتفك 📱');
        if (statusBox) {
          statusBox.style.display = 'block';
          statusBox.style.background = 'rgba(16, 185, 129, 0.1)';
          statusBox.style.color = '#059669';
          statusBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
          statusBox.innerHTML = '✅ <strong>الاتصال ناجح:</strong> تم إرسال الرسالة إلى تليجرام وتأكيد جاهزية البوت.';
        }
      } else {
        throw new Error(data.description || 'فشل الاتصال بتليجرام');
      }
    } catch (err) {
      toast.error('خطأ: ' + err.message);
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.background = 'rgba(239, 68, 68, 0.1)';
        statusBox.style.color = '#dc2626';
        statusBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        statusBox.innerHTML = `❌ <strong>فشل الاتصال:</strong> ${escHtml(err.message)}<br><small>تأكد من صحة التوكن ومن أنك قمت ببدء المحادثة مع البوت عبر الضغط على Start.</small>`;
      }
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });

  // Telegram Set Webhook Handler
  document.getElementById('btn-tg-set-webhook')?.addEventListener('click', async () => {
    const token = document.getElementById('s-tg-token')?.value.trim();
    if (!token) {
      toast.warning('اكتب توكن البوت أولاً');
      return;
    }

    try {
      const webhookUrl = `https://elmanzala.nonm1724.workers.dev/api/telegram/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const data = await res.json();
      if (data.ok) {
        toast.success('تم ربط الـ Webhook مع سيرفر المنصة بنجاح 🔗');
      } else {
        throw new Error(data.description || 'فشل ضبط الويب هوك');
      }
    } catch (err) {
      toast.error('خطأ: ' + err.message);
    }
  });

  document.getElementById('admin-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-settings');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const updates = {
        'general/siteName': document.getElementById('s-site-name').value,
        'general/primaryColor': document.getElementById('s-color').value,
        'general/siteDescription': document.getElementById('s-desc').value,
        'contact/whatsappLink': document.getElementById('s-wa-link').value,
        'contact/email': document.getElementById('s-email').value,
        'social/facebook': document.getElementById('s-fb').value,
        'telegram/botToken': (document.getElementById('s-tg-token')?.value || '').trim(),
        'telegram/adminChatId': (document.getElementById('s-tg-chat-id')?.value || '').trim(),
        'limits/offersVerified': Number(document.getElementById('s-lim-off-ver').value) || 3,
        'limits/offersUnverified': Number(document.getElementById('s-lim-off-unver').value) || 1,
        'limits/productsVerified': Number(document.getElementById('s-lim-prod-ver').value) || 350,
      };

      await dbUpdate('settings', updates);
      adminCache.settings = null;
      if (updates['telegram/botToken'] && updates['telegram/adminChatId']) {
        localStorage.setItem('manzala_telegram_bot_config', JSON.stringify({
          botToken: updates['telegram/botToken'],
          chatId: updates['telegram/adminChatId']
        }));
      }
      toast.success('تم حفظ إعدادات المنصة بنجاح! ✓');
    } catch (err) {
      toast.error('فشل حفظ الإعدادات: ' + err.message);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

// ─────────────────────────────────────────────
//  Reactive Global Action Handlers (Instant UI updates)
// ─────────────────────────────────────────────

if (typeof window !== 'undefined') {
window.togglePlaceSponsored = async (placeId, newStatus) => {
  try {
    const updates = {
      isSponsored: newStatus,
      isFeatured: newStatus,
      sponsoredAt: newStatus ? serverTimestamp() : null
    };

    if (newStatus) {
      const days = prompt('كم عدد أيام استمرار هذا الإعلان؟\n(اكتب عدد الأيام مثل: 7 أو 15 أو 30 أو 90، أو اتركه فارغاً ليكون إعلان دائم)', '30');
      if (days === null) return; // User cancelled

      if (days.trim() !== '' && !isNaN(days) && Number(days) > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(days));
        updates.sponsoredUntil = expiresAt.getTime();
      } else {
        updates.sponsoredUntil = null; // Permanent
      }
    } else {
      updates.sponsoredUntil = null;
    }

    await dbUpdate(`places/${placeId}`, updates);

    if (adminCache.places && adminCache.places[placeId]) {
      Object.assign(adminCache.places[placeId], updates);
    }

    toast.success(newStatus ? 'تم ترويج المكان وتحديد مدة الإعلان بنجاح ⭐' : 'تم إلغاء ترويج المكان');
    switchAdminSection(_currentSection, false);
  } catch (err) {
    toast.error('فشلت العملية: ' + err.message);
  }
};

window.togglePlaceVerification = async (placeId, status) => {
  try {
    const updates = {
      isVerified: status,
      verificationStatus: status ? 'verified' : 'unverified',
      verifiedAt: status ? serverTimestamp() : null
    };
    await dbUpdate(`places/${placeId}`, updates);
    if (adminCache.places && adminCache.places[placeId]) {
      Object.assign(adminCache.places[placeId], updates);
    }
    if (status) {
      const placeData = adminCache.places ? adminCache.places[placeId] : (await dbGet(`places/${placeId}`));
      if (placeData) broadcastPlaceVerifiedNotification(placeData).catch(() => {});
    }
    toast.success(status ? 'تم توثيق المكان وتفعيل العلامة المعتمدة وإرسال إشعار لكافة المستخدمين ✓' : 'تم إلغاء التوثيق');
    switchAdminSection(_currentSection, false);
  } catch (err) {
    toast.error('فشلت العملية: ' + err.message);
  }
};

window.transferPlaceOwnershipAdmin = async (placeId) => {
  let place = adminCache.places ? adminCache.places[placeId] : null;
  if (!place && adminCache.places) {
    place = Object.values(adminCache.places).find(p => p && (p._id === placeId || p.id === placeId));
  }
  if (!place) {
    place = await dbGet(`places/${placeId}`);
  }
  if (!place) {
    toast.error('لم يتم العثور على بيانات المكان');
    return;
  }

  if (!adminCache.users) {
    adminCache.users = (await dbGet('users')) || {};
  }
  const users = Object.entries(adminCache.users || {}).map(([uid, u]) => ({
    uid: u.uid || uid,
    displayName: u.displayName || u.name || 'مستخدم بدون اسم',
    email: u.email || '',
    phone: u.phone || '',
    photoURL: u.photoURL || ''
  }));

  const currentOwnerText = place.ownerId 
    ? (place.ownerName || place.ownerEmail || place.ownerId) 
    : 'بدون مستخدم (ملك المنصة مباشرة)';

  const modal = showModal({
    title: `🔄 نقل ملكية: ${escHtml(place.name || 'المكان')}`,
    size: 'md',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px;padding:4px">
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;font-size:13px">
          <div style="margin-bottom:4px"><strong>النشاط الحالي:</strong> ${escHtml(place.name)}</div>
          <div style="color:var(--primary);font-weight:600"><strong>المالك الحالي:</strong> ${escHtml(currentOwnerText)}</div>
        </div>

        <p style="font-size:12.5px;color:var(--text-secondary);margin:0;line-height:1.6">
          اختر المستخدم الذي ترغب في نقل ملكية هذا المكان إليه. سيتمكن هذا المستخدم بعد ذلك من إدارة وتعديل المكان وإضافة العروض والمنتجات من لوحة تحكمه الخاصة.
        </p>

        <!-- Live Search for Users -->
        <div style="position:relative">
          <input 
            type="search" 
            id="transfer-user-search-input" 
            class="form-input" 
            placeholder="🔍 ابحث في المستخدمين (بالاسم، الإيميل، أو رقم الهاتف)..." 
            autocomplete="off"
            style="padding-right:36px"
          />
          <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none">🔎</span>
        </div>

        <!-- Users Selection Area -->
        <div id="transfer-users-list" style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);display:flex;flex-direction:column;gap:2px;padding:4px">
          
          <!-- Option: No Owner (Platform Only) -->
          <label class="transfer-user-item" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;transition:background 0.15s">
            <input type="radio" name="transfer-selected-user" value="none" ${!place.ownerId ? 'checked' : ''} />
            <div style="font-size:1.2rem">🏢</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px;color:var(--text-primary)">بدون مالك (تابع للمنصة مباشرة)</div>
              <div style="font-size:11px;color:var(--text-muted)">إلغاء ارتباط المكان بأي مستخدم</div>
            </div>
          </label>

          ${users.map(u => {
            const isSelected = place.ownerId === u.uid;
            return `
              <label class="transfer-user-item" data-uname="${escAttr(u.displayName.toLowerCase())}" data-uemail="${escAttr(u.email.toLowerCase())}" data-uphone="${escAttr(u.phone)}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;transition:background 0.15s">
                <input type="radio" name="transfer-selected-user" value="${escAttr(u.uid)}" data-name="${escAttr(u.displayName)}" data-email="${escAttr(u.email)}" ${isSelected ? 'checked' : ''} />
                <div style="width:34px;height:34px;border-radius:50%;background:var(--primary-alpha);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">
                  ${u.photoURL ? `<img src="${escAttr(u.photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />` : (u.displayName ? u.displayName.charAt(0) : '👤')}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:13px;color:var(--text-primary)" class="truncate">${escHtml(u.displayName)}</div>
                  <div style="font-size:11px;color:var(--text-muted)" class="truncate">${escHtml(u.email || u.phone || 'بدون إيميل')}</div>
                </div>
                ${isSelected ? '<span class="chip chip--success" style="font-size:10px;padding:1px 6px">المالك الحالي</span>' : ''}
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `,
    buttons: [
      {
        label: '🔄 تأكيد ونقل الملكية الآن',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const selectedRadio = document.querySelector('input[name="transfer-selected-user"]:checked');
          if (!selectedRadio) {
            toast.warning('يرجى اختيار مستخدم من القائمة لنقل الملكية إليه');
            return;
          }

          const selectedVal = selectedRadio.value;
          let updates = {};

          if (selectedVal === 'none') {
            updates = {
              ownerId: null,
              ownerEmail: null,
              ownerName: null,
              updatedAt: serverTimestamp()
            };
          } else {
            const targetUser = users.find(u => u.uid === selectedVal);
            updates = {
              ownerId: selectedVal,
              ownerEmail: targetUser?.email || '',
              ownerName: targetUser?.displayName || targetUser?.email || 'مستخدم',
              updatedAt: serverTimestamp()
            };
          }

          try {
            await dbUpdate(`places/${placeId}`, updates);

            if (adminCache.places && adminCache.places[placeId]) {
              Object.assign(adminCache.places[placeId], updates);
            }

            toast.success(selectedVal === 'none' 
              ? `تم إلغاء ارتباط المكان وأصبح تابعاً للمنصة مباشرة` 
              : `تم نقل ملكية "${place.name}" بنجاح! سيظهر للمستخدم الآن في لوحة تحكمه.`
            );
            modal.close();
            switchAdminSection('places', false);
          } catch (err) {
            console.error(err);
            toast.error('فشل نقل الملكية: ' + err.message);
          }
        }
      },
      {
        label: 'إلغاء',
        type: 'ghost',
        closeOnClick: true
      }
    ]
  });

  // Setup Live User Search Filter inside Modal
  setTimeout(() => {
    const searchInput = document.getElementById('transfer-user-search-input');
    const userItems = document.querySelectorAll('.transfer-user-item');
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      userItems.forEach(item => {
        const uname = item.getAttribute('data-uname') || '';
        const uemail = item.getAttribute('data-uemail') || '';
        const uphone = item.getAttribute('data-uphone') || '';
        const isNoOwner = !item.hasAttribute('data-uname');
        const match = isNoOwner || !q || uname.includes(q) || uemail.includes(q) || uphone.includes(q);
        item.style.display = match ? 'flex' : 'none';
      });
    });
  }, 100);
};

window.editPlaceAdmin = async (placeId) => {
  let place = adminCache.places ? adminCache.places[placeId] : null;
  if (!place && adminCache.places) {
    place = Object.values(adminCache.places).find(p => p && (p._id === placeId || p.id === placeId));
  }
  if (!place) {
    place = await dbGet(`places/${placeId}`);
  }
  if (!place) {
    toast.error('لم يتم العثور على بيانات هذا المكان أو الشخص');
    return;
  }

  if (!adminCache.categories) {
    adminCache.categories = (await getCategories()) || [];
  }
  const categories = adminCache.categories || [];

  const placeArea = (place.area || '').trim();
  const isCustomArea = Boolean(placeArea && !MANZALA_VILLAGES_LIST.includes(placeArea));

  const modal = showModal({
    title: `✏️ تعديل بيانات: ${escHtml(place.name || 'المكان')}`,
    size: 'lg',
    content: `
      <form id="admin-edit-place-form" style="display:flex;flex-direction:column;gap:14px;max-height:72vh;overflow-y:auto;padding:4px 8px" onsubmit="return false;">
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          <div class="form-group">
            <label class="form-label">الاسم بالعربية <span class="required">*</span></label>
            <input type="text" id="aep-name" class="form-input" required value="${escAttr(place.name || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">الاسم بالإنجليزية (اختياري)</label>
            <input type="text" id="aep-nameEn" class="form-input" style="direction:ltr;text-align:left" value="${escAttr(place.nameEn || '')}" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          <div class="form-group">
            <label class="form-label">التصنيف الرئيسي <span class="required">*</span></label>
            <select id="aep-categoryId" class="form-select" required>
              ${categories.map(c => `
                <option value="${c.slug || c._key}" ${(place.categoryId === (c.slug || c._key)) ? 'selected' : ''}>
                  ${c.icon || '📁'} ${c.name}
                </option>
              `).join('')}
              <option value="other" ${place.customCategory ? 'selected' : ''}>✨ أخرى (تصنيف مخصص)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">تصنيف مخصص (إذا كان غير مدرج)</label>
            <input type="text" id="aep-customCategory" class="form-input" placeholder="مثال: استوديو تصوير، رخام وجرانيت" value="${escAttr(place.customCategory || '')}" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          <div class="form-group">
            <label class="form-label">رقم الهاتف للتواصل</label>
            <input type="tel" id="aep-phone" class="form-input" placeholder="010XXXXXXXX أو 17555" value="${escAttr(place.phone || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">رقم الواتساب</label>
            <input type="tel" id="aep-whatsapp" class="form-input" placeholder="010XXXXXXXX" value="${escAttr(place.whatsapp || '')}" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          <div class="form-group">
            <label class="form-label">المنطقة داخل المنزلة / المطرية <span class="required">*</span></label>
            <select id="aep-area" class="form-select">
              ${MANZALA_VILLAGES_LIST.map(a => `<option value="${escAttr(a)}" ${(placeArea === a || (!placeArea && a === 'المنزلة')) ? 'selected' : ''}>📍 ${a}</option>`).join('')}
              <option value="other" ${isCustomArea ? 'selected' : ''}>✏️ بلد أو قرية أخرى...</option>
            </select>
            <div id="aep-custom-area-group" style="margin-top:8px;${isCustomArea ? '' : 'display:none'}">
              <input type="text" id="aep-custom-area" class="form-input" placeholder="اكتب اسم البلد أو القرية هنا..." value="${escAttr(isCustomArea ? placeArea : '')}" style="font-size:12.5px" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">نوع وسيلة التوصيل (إن وجد)</label>
            <select id="aep-deliveryType" class="form-select">
              <option value="" ${!place.deliveryType ? 'selected' : ''}>بدون (نشاط عادي)</option>
              <option value="car" ${place.deliveryType === 'car' ? 'selected' : ''}>🚗 سيارة / تاكسي / رحلات</option>
              <option value="motorcycle" ${place.deliveryType === 'motorcycle' ? 'selected' : ''}>🛵 موتوسيكل دليفري</option>
              <option value="tuktuk" ${place.deliveryType === 'tuktuk' ? 'selected' : ''}>🛺 توكتوك مشاوير</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">العنوان بالتفصيل أو Plus Code</label>
          <input type="text" id="aep-address" class="form-input" placeholder="مثال: الضهير، مركز المنزلة أو 5XVJ+GF مركز المنزلة" value="${escAttr(place.address || '')}" />
        </div>

        <div class="form-group">
          <label class="form-label">رابط خرائط جوجل (Google Maps Link) أو العنوان</label>
          <input type="text" id="aep-mapsLink" class="form-input" placeholder="مثال: https://maps.app.goo.gl/ruGRycBTGHt8Ecr2A" value="${escAttr(place.mapsLink || '')}" />
          <p style="font-size:11.5px;color:var(--text-muted);margin-top:4px">💡 يدعم روابط خرائط Google القصيرة، أكواد Plus Codes، والعناوين النصية لتوليد الخريطة بدقة.</p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
          <div class="form-group">
            <label class="form-label">رابط صورة الغلاف (Cover Image)</label>
            <input type="url" id="aep-coverImageUrl" class="form-input" placeholder="https://..." value="${escAttr(place.coverImageUrl || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">رابط اللوجو / الصورة الشخصية (Logo)</label>
            <input type="url" id="aep-logoUrl" class="form-input" placeholder="https://..." value="${escAttr(place.logoUrl || '')}" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
          <div class="form-group">
            <label class="form-label">حالة النشر</label>
            <select id="aep-status" class="form-select">
              <option value="published" ${place.status === 'published' ? 'selected' : ''}>منشور (يعمل)</option>
              <option value="pending" ${place.status === 'pending' ? 'selected' : ''}>معلق قيد المراجعة</option>
              <option value="rejected" ${place.status === 'rejected' ? 'selected' : ''}>مرفوض</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">حالة التوثيق</label>
            <select id="aep-isVerified" class="form-select">
              <option value="false" ${!place.isVerified ? 'selected' : ''}>غير موثق</option>
              <option value="true" ${place.isVerified ? 'selected' : ''}>موثق بالعلامة المعتمدة ✓</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">الوصف والنبذة التعريفية</label>
          <textarea id="aep-description" class="form-textarea" rows="3" placeholder="اكتب وصفاً للنشاط أو الخدمات المقدمة...">${escHtml(place.description || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">الخدمات والمميزات (مفصولة بفواصل)</label>
          <input type="text" id="aep-services" class="form-input" placeholder="توصيل للمنازل، دفع بالفيزا، متاح 24 ساعة" value="${escAttr(place.services ? place.services.join('، ') : '')}" />
        </div>

        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px">
          <label class="form-label" style="font-weight:700;margin-bottom:8px">🌐 روابط التواصل الاجتماعي والموقع الإلكتروني</label>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
            <div class="form-group">
              <label class="form-label" style="font-size:11px">📘 Facebook</label>
              <input type="url" id="aep-social-facebook" class="form-input" placeholder="https://facebook.com/..." value="${escAttr(place.social?.facebook || '')}" style="direction:ltr" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11px">✖️ X (Twitter)</label>
              <input type="url" id="aep-social-x" class="form-input" placeholder="https://x.com/..." value="${escAttr(place.social?.x || place.social?.twitter || '')}" style="direction:ltr" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11px">📷 Instagram</label>
              <input type="url" id="aep-social-instagram" class="form-input" placeholder="https://instagram.com/..." value="${escAttr(place.social?.instagram || '')}" style="direction:ltr" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11px">🎵 TikTok</label>
              <input type="url" id="aep-social-tiktok" class="form-input" placeholder="https://tiktok.com/@..." value="${escAttr(place.social?.tiktok || '')}" style="direction:ltr" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11px">🧵 Threads</label>
              <input type="url" id="aep-social-threads" class="form-input" placeholder="https://threads.net/@..." value="${escAttr(place.social?.threads || '')}" style="direction:ltr" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11px">▶️ YouTube</label>
              <input type="url" id="aep-social-youtube" class="form-input" placeholder="https://youtube.com/@..." value="${escAttr(place.social?.youtube || '')}" style="direction:ltr" />
            </div>
          </div>
          <div class="form-group" style="margin-top:8px">
            <label class="form-label" style="font-size:11px">🌍 الموقع الإلكتروني الرسمي (Website)</label>
            <input type="url" id="aep-social-website" class="form-input" placeholder="https://..." value="${escAttr(place.social?.website || '')}" style="direction:ltr" />
          </div>
        </div>

      </form>
    `,
    buttons: [
      {
        label: '💾 حفظ كافة التعديلات',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const name = document.getElementById('aep-name')?.value.trim();
          if (!name) {
            toast.error('يرجى كتابة اسم المكان أو الشخص');
            return;
          }

          const rawServices = document.getElementById('aep-services')?.value || '';
          const servicesArr = rawServices.split(/[،,]/).map(s => s.trim()).filter(Boolean);

          const updates = {
            name,
            nameEn: document.getElementById('aep-nameEn')?.value.trim() || '',
            categoryId: document.getElementById('aep-categoryId')?.value || 'general',
            customCategory: document.getElementById('aep-customCategory')?.value.trim() || '',
            phone: document.getElementById('aep-phone')?.value.trim() || '',
            whatsapp: document.getElementById('aep-whatsapp')?.value.trim() || '',
            area: (document.getElementById('aep-area')?.value === 'other'
              ? (document.getElementById('aep-custom-area')?.value.trim() || 'المنزلة')
              : (document.getElementById('aep-area')?.value || 'المنزلة')),
            deliveryType: document.getElementById('aep-deliveryType')?.value || null,
            address: document.getElementById('aep-address')?.value.trim() || '',
            mapsLink: document.getElementById('aep-mapsLink')?.value.trim() || '',
            coverImageUrl: document.getElementById('aep-coverImageUrl')?.value.trim() || '',
            logoUrl: document.getElementById('aep-logoUrl')?.value.trim() || '',
            status: document.getElementById('aep-status')?.value || 'published',
            isVerified: document.getElementById('aep-isVerified')?.value === 'true',
            description: document.getElementById('aep-description')?.value.trim() || '',
            services: servicesArr,
            social: {
              facebook: document.getElementById('aep-social-facebook')?.value.trim() || '',
              x: document.getElementById('aep-social-x')?.value.trim() || '',
              twitter: document.getElementById('aep-social-x')?.value.trim() || '',
              instagram: document.getElementById('aep-social-instagram')?.value.trim() || '',
              tiktok: document.getElementById('aep-social-tiktok')?.value.trim() || '',
              threads: document.getElementById('aep-social-threads')?.value.trim() || '',
              youtube: document.getElementById('aep-social-youtube')?.value.trim() || '',
              website: document.getElementById('aep-social-website')?.value.trim() || ''
            },
            updatedAt: serverTimestamp()
          };

          const mapsLinkVal = document.getElementById('aep-mapsLink')?.value.trim() || '';
          const addressVal = document.getElementById('aep-address')?.value.trim() || '';
          let coords = await extractCoordinates(mapsLinkVal);
          if (!coords && addressVal) {
            coords = await extractCoordinates(addressVal);
          }
          if (coords && coords.lat && coords.lng) {
            updates.location = { lat: coords.lat, lng: coords.lng };
          }

          if (isAtmPlace({ id: placeId, ...place, ...updates })) {
            updates.coverImageUrl = updates.coverImageUrl || ATM_UNIFIED_COVER;
            updates.logoUrl = updates.logoUrl || ATM_UNIFIED_LOGO;
            updates.alwaysOpen = true;
          }

          try {
            await dbUpdate(`places/${placeId}`, updates);

            if (adminCache.places && adminCache.places[placeId]) {
              Object.assign(adminCache.places[placeId], updates);
            }

            if (updates.isVerified && !place.isVerified) {
              broadcastPlaceVerifiedNotification({ id: placeId, ...place, ...updates }).catch(() => {});
            }

            toast.success('تم حفظ وتحديث بيانات المكان بنجاح ✨');
            modal.close();
            switchAdminSection('places', false);
          } catch (err) {
            console.error(err);
            toast.error('فشل حفظ التعديلات: ' + err.message);
          }
        }
      },
      {
        label: 'إلغاء',
        type: 'ghost',
        closeOnClick: true
      }
    ]
  });

  document.getElementById('aep-area')?.addEventListener('change', (e) => {
    const isOther = e.target.value === 'other';
    const customGroup = document.getElementById('aep-custom-area-group');
    if (customGroup) customGroup.style.display = isOther ? 'block' : 'none';
  });
};

window.deletePlaceAdmin = async (placeId) => {
  const ok = await showConfirm({
    title: 'حذف المكان نهائياً',
    message: 'هل أنت متأكد من حذف هذا المكان من المنصة؟ لن تتمكن من استرجاع بياناته بعد الحذف.',
    confirmType: 'danger'
  });
  if (ok) {
    try {
      let place = adminCache.places ? adminCache.places[placeId] : null;
      if (!place && adminCache.places) {
        place = Object.values(adminCache.places).find(p => p && (p._id === placeId || p.id === placeId));
      }
      if (!place) place = await dbGet(`places/${placeId}`);
      if (place?.slug) await dbRemove(`slugIndex/${place.slug}`).catch(() => {});
      await dbRemove(`places/${placeId}`);
      if (adminCache.places) {
        delete adminCache.places[placeId];
        for (const [k, v] of Object.entries(adminCache.places)) {
          if (v && (v._id === placeId || v.id === placeId || k === placeId)) {
            delete adminCache.places[k];
          }
        }
      }
      toast.success('تم حذف المكان بنجاح');
      switchAdminSection('places', false);
    } catch (err) {
      toast.error('فشل الحذف: ' + err.message);
    }
  }
};

window.approveVerification = async (reqId, placeId) => {
  const months = prompt('كم شهر تريد أن يستمر هذا التوثيق؟\n(اكتب عدد الأشهر، أو اتركه فارغاً ليكون توثيق دائم)', '12');
  if (months === null) return;

  const updates = {
    isVerified: true,
    verificationStatus: 'verified',
    verifiedAt: serverTimestamp()
  };

  if (months.trim() !== '' && !isNaN(months) && Number(months) > 0) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + Number(months));
    updates.verifiedUntil = expiresAt.getTime();
  } else {
    updates.verifiedUntil = null;
  }

  try {
    await dbUpdate(`verificationRequests/${reqId}`, {
      status: 'approved',
      reviewedAt: serverTimestamp()
    });
    await dbUpdate(`places/${placeId}`, updates);

    if (adminCache.verificationRequests && adminCache.verificationRequests[reqId]) {
      adminCache.verificationRequests[reqId].status = 'approved';
      adminCache.verificationRequests[reqId].verifiedUntil = updates.verifiedUntil;
    }
    if (adminCache.places && adminCache.places[placeId]) {
      Object.assign(adminCache.places[placeId], updates);
    }

    const placeData = adminCache.places ? adminCache.places[placeId] : (await dbGet(`places/${placeId}`));
    if (placeData) broadcastPlaceVerifiedNotification(placeData).catch(() => {});

    toast.success('تم قبول طلب التوثيق وتفعيل العلامة المعتمدة وإرسال إشعار لكافة المستخدمين ✓');
    switchAdminSection(_currentSection, false);
  } catch (err) {
    console.error(err);
    toast.error('فشلت العملية: ' + err.message);
  }
};

window.rejectVerification = async (reqId, placeId) => {
  if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
  try {
    await dbUpdate(`verificationRequests/${reqId}`, {
      status: 'rejected',
      reviewedAt: serverTimestamp()
    });
    await dbUpdate(`places/${placeId}`, {
      verificationStatus: 'unverified'
    });

    if (adminCache.verificationRequests && adminCache.verificationRequests[reqId]) {
      adminCache.verificationRequests[reqId].status = 'rejected';
    }

    toast.success('تم رفض الطلب');
    switchAdminSection(_currentSection, false);
  } catch (err) {
    console.error(err);
    toast.error('فشلت العملية');
  }
};

window.deleteCategoryAdmin = async (catId) => {
  const ok = await showConfirm({ title: 'حذف التصنيف', message: 'هل أنت متأكد من حذف هذا التصنيف؟' });
  if (ok) {
    await dbRemove(`categories/${catId}`);
    if (adminCache.categories) {
      adminCache.categories = adminCache.categories.filter(c => (c._key || c.slug) !== catId);
    }
    toast.success('تم حذف التصنيف');
    switchAdminSection('categories', false);
  }
};

window.editCategoryAdmin = async (catId, currentName, currentIcon) => {
  const modal = showModal({
    title: 'تعديل التصنيف',
    content: `
      <div class="form-group">
        <label class="form-label">اسم التصنيف بالعربية</label>
        <input type="text" id="edit-cat-name" class="form-input" value="${escAttr(currentName)}" required />
      </div>
      <div class="form-group">
        <label class="form-label">الأيقونة (Emoji)</label>
        <input type="text" id="edit-cat-icon" class="form-input" value="${escAttr(currentIcon)}" required />
      </div>
    `,
    buttons: [
      {
        label: 'حفظ التعديلات',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const name = document.getElementById('edit-cat-name')?.value.trim();
          const icon = document.getElementById('edit-cat-icon')?.value.trim() || '📁';
          if (!name) return;
          try {
            await dbUpdate(`categories/${catId}`, { name, icon });
            if (adminCache.categories) {
              const cat = adminCache.categories.find(c => (c._key || c.slug) === catId);
              if (cat) { cat.name = name; cat.icon = icon; }
            }
            toast.success('تم تحديث التصنيف بنجاح');
            modal.close();
            switchAdminSection('categories', false);
          } catch {
            toast.error('فشل التحديث');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.approveCategoryRequest = async (reqId, categoryName) => {
  try {
    const slug = 'cat_' + Date.now().toString(36);
    const newCat = {
      id: slug,
      slug,
      name: categoryName,
      nameEn: slug,
      icon: '✨',
      order: Date.now(),
      isActive: true,
      placeCount: 1,
      createdAt: serverTimestamp()
    };
    await dbSet(`categories/${slug}`, newCat);
    await dbUpdate(`categoryRequests/${reqId}`, {
      status: 'approved',
      approvedAt: serverTimestamp()
    });

    if (adminCache.categories) adminCache.categories.push(newCat);
    if (adminCache.categoryRequests && adminCache.categoryRequests[reqId]) {
      adminCache.categoryRequests[reqId].status = 'approved';
    }

    toast.success(`تم اعتماد تصنيف "${categoryName}" وإضافته في الدليل بنجاح!`);
    switchAdminSection('categories', false);
  } catch (err) {
    toast.error('فشل الاعتماد');
  }
};

window.editAndApproveCategoryRequest = async (reqId, initialName) => {
  const modal = showModal({
    title: 'تعديل وتفعيل التصنيف المقترح',
    content: `
      <div class="form-group">
        <label class="form-label">اسم التصنيف النهائي</label>
        <input type="text" id="appr-cat-name" class="form-input" value="${escAttr(initialName)}" required />
      </div>
      <div class="form-group">
        <label class="form-label">اختر أيقونة مناسبة</label>
        <input type="text" id="appr-cat-icon" class="form-input" value="✨" required />
      </div>
    `,
    buttons: [
      {
        label: 'اعتماد وإضافة للدليل',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const name = document.getElementById('appr-cat-name')?.value.trim();
          const icon = document.getElementById('appr-cat-icon')?.value.trim() || '📁';
          if (!name) return;

          try {
            const slug = 'cat_' + Date.now().toString(36);
            const newCat = {
              id: slug,
              slug,
              name,
              nameEn: slug,
              icon,
              order: Date.now(),
              isActive: true,
              placeCount: 1,
              createdAt: serverTimestamp()
            };
            await dbSet(`categories/${slug}`, newCat);
            await dbUpdate(`categoryRequests/${reqId}`, {
              status: 'approved',
              finalName: name,
              approvedAt: serverTimestamp()
            });

            if (adminCache.categories) adminCache.categories.push(newCat);
            if (adminCache.categoryRequests && adminCache.categoryRequests[reqId]) {
              adminCache.categoryRequests[reqId].status = 'approved';
            }

            toast.success(`تم اعتماد تصنيف "${name}" بنجاح!`);
            modal.close();
            switchAdminSection('categories', false);
          } catch {
            toast.error('فشلت العملية');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.rejectCategoryRequest = async (reqId) => {
  const ok = await showConfirm({ title: 'رفض التصنيف', message: 'هل أنت متأكد من رفض هذا التصنيف المقترح؟' });
  if (ok) {
    try {
      await dbUpdate(`categoryRequests/${reqId}`, {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      if (adminCache.categoryRequests && adminCache.categoryRequests[reqId]) {
        adminCache.categoryRequests[reqId].status = 'rejected';
      }
      toast.info('تم رفض التصنيف المقترح');
      switchAdminSection('categories', false);
    } catch {
      toast.error('فشلت العملية');
    }
  }
};

window.toggleUserStatus = async (uid, newStatus) => {
  try {
    await dbUpdate(`users/${uid}`, { status: newStatus });
    if (adminCache.users && adminCache.users[uid]) {
      adminCache.users[uid].status = newStatus;
    }
    toast.success('تم تحديث حالة المستخدم');
    switchAdminSection('users', false);
  } catch (err) {
    toast.error('فشلت العملية');
  }
};

window.adminViewOfferAction = async (offerId) => {
  const offer = adminCache.offers?.[offerId] || (await dbGet(`offers/${offerId}`));
  if (!offer) {
    toast.error('لم يتم العثور على بيانات العرض');
    return;
  }

  const modal = showModal({
    title: `🎁 تفاصيل العرض: ${escHtml(offer.title || '')}`,
    size: 'md',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px;padding:4px">
        ${offer.imageUrl ? `
          <div style="width:100%;height:220px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);background:var(--surface-2);display:flex;align-items:center;justify-content:center">
            <img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.src='./icons/icon-192x192.png'" />
          </div>
        ` : ''}

        <div style="background:var(--surface-2);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <h3 style="margin:0;font-size:1.15rem;color:var(--text-primary)">${escHtml(offer.title)}</h3>
            <span class="badge ${offer.status === 'active' ? 'badge--success' : 'badge--warning'}">
              ${offer.status === 'active' ? '✓ نشط ومفعل' : 'متوقف'}
            </span>
          </div>

          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
            ${escHtml(offer.description || 'لا يوجد وصف تفصيلي لهذا العرض.')}
          </div>

          <div style="display:flex;align-items:center;gap:14px;padding-top:10px;border-top:1px dashed var(--border);flex-wrap:wrap">
            <div>
              <span style="font-size:12px;color:var(--text-muted)">السعر بعد الخصم: </span>
              <strong style="font-size:1.25rem;color:var(--primary)">${offer.newPrice || 0} ج.م</strong>
            </div>
            ${offer.oldPrice ? `
              <div>
                <span style="font-size:12px;color:var(--text-muted)">السعر الأصلي: </span>
                <span style="text-decoration:line-through;color:var(--text-muted);font-size:1.05rem">${offer.oldPrice} ج.م</span>
              </div>
            ` : ''}
            ${offer.discount ? `
              <span class="badge badge--danger" style="font-weight:700">خصم ${offer.discount}%</span>
            ` : ''}
          </div>
        </div>

        <div style="font-size:12px;color:var(--text-muted);display:flex;justify-content:space-between;padding:0 4px;flex-wrap:wrap;gap:6px">
          <span>🏪 تابع لمكان: <strong>${escHtml(offer.placeName || 'غير محدد')}</strong></span>
          <span>📅 ينتهي في: <strong>${offer.expiresAt ? formatDate(offer.expiresAt) : 'غير محدد'}</strong></span>
        </div>
      </div>
    `,
    buttons: [
      {
        label: '✏️ تعديل هذا العرض',
        type: 'primary',
        onClick: () => {
          modal.close();
          adminEditOfferAction(offerId);
        }
      },
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.adminEditOfferAction = async (offerId) => {
  const offer = adminCache.offers?.[offerId] || (await dbGet(`offers/${offerId}`));
  if (!offer) {
    toast.error('لم يتم العثور على بيانات العرض');
    return;
  }

  const modal = showModal({
    title: `✏️ تعديل العرض: ${escHtml(offer.title || '')}`,
    size: 'md',
    content: `
      <form id="admin-edit-offer-form" onsubmit="return false">
        <div class="form-group">
          <label class="form-label">عنوان العرض <span class="required">*</span></label>
          <input type="text" id="aeo-title" class="form-input" value="${escAttr(offer.title || '')}" required />
        </div>

        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">السعر بعد الخصم (ج.م) <span class="required">*</span></label>
            <input type="number" id="aeo-newPrice" class="form-input" value="${offer.newPrice || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">السعر القديم قبل الخصم</label>
            <input type="number" id="aeo-oldPrice" class="form-input" value="${offer.oldPrice || ''}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">رابط صورة العرض (URL)</label>
          <input type="url" id="aeo-imageUrl" class="form-input" value="${escAttr(offer.imageUrl || '')}" placeholder="https://..." style="direction:ltr" />
        </div>

        <div class="form-group">
          <label class="form-label">حالة العرض</label>
          <select id="aeo-status" class="form-select">
            <option value="active" ${offer.status === 'active' ? 'selected' : ''}>نشط ومفعل ✓</option>
            <option value="expired" ${offer.status === 'expired' ? 'selected' : ''}>منتهي الصلاحية</option>
            <option value="disabled" ${offer.status === 'disabled' ? 'selected' : ''}>متوقف مؤقتاً</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">تفاصيل وشروط العرض</label>
          <textarea id="aeo-description" class="form-textarea" rows="3">${escHtml(offer.description || '')}</textarea>
        </div>
      </form>
    `,
    buttons: [
      {
        label: '💾 حفظ تعديلات العرض',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const title = document.getElementById('aeo-title')?.value.trim();
          const newPrice = parseFloat(document.getElementById('aeo-newPrice')?.value);
          const oldPrice = parseFloat(document.getElementById('aeo-oldPrice')?.value) || null;
          const imageUrl = document.getElementById('aeo-imageUrl')?.value.trim();
          const status = document.getElementById('aeo-status')?.value || 'active';
          const description = document.getElementById('aeo-description')?.value.trim();

          if (!title || isNaN(newPrice)) {
            toast.warning('يرجى كتابة عنوان وسعر العرض');
            return;
          }

          let discount = 0;
          if (oldPrice && oldPrice > newPrice) {
            discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
          }

          const updates = {
            title,
            newPrice,
            oldPrice,
            discount,
            imageUrl,
            status,
            description,
            updatedAt: serverTimestamp()
          };

          try {
            await dbUpdate(`offers/${offerId}`, updates);
            if (adminCache.offers && adminCache.offers[offerId]) {
              Object.assign(adminCache.offers[offerId], updates);
            }
            toast.success('تم تحديث بيانات العرض بنجاح ✨');
            modal.close();
            switchAdminSection('offers', false);
          } catch (err) {
            toast.error('فشل تحديث العرض: ' + err.message);
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.deleteOfferAdmin = async (offerId) => {
  try {
    await dbRemove(`offers/${offerId}`);
    if (adminCache.offers) delete adminCache.offers[offerId];
    toast.success('تم حذف العرض');
    switchAdminSection('offers', false);
  } catch (err) {
    toast.error('فشل الحذف');
  }
};

window.deleteAdAdmin = async (adId) => {
  try {
    const ad = adminCache.ads ? adminCache.ads[adId] : await dbGet(`ads/${adId}`);
    if (ad?.placeId) {
      await dbUpdate(`places/${ad.placeId}`, { isSponsored: false, isFeatured: false });
      if (adminCache.places && adminCache.places[ad.placeId]) {
        adminCache.places[ad.placeId].isSponsored = false;
        adminCache.places[ad.placeId].isFeatured = false;
      }
    }
    await dbRemove(`ads/${adId}`);
    if (adminCache.ads) delete adminCache.ads[adId];
    toast.success('تم حذف الإعلان');
    switchAdminSection('ads', false);
  } catch (err) {
    toast.error('فشل الحذف');
  }
};

window.adminViewProductAction = async (placeId, productId) => {
  const prod = await dbGet(`products/${placeId}/${productId}`);
  if (!prod) {
    toast.error('لم يتم العثور على بيانات المنتج');
    return;
  }

  const modal = showModal({
    title: `🛍️ تفاصيل المنتج: ${escHtml(prod.name || '')}`,
    size: 'md',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px;padding:4px">
        ${prod.imageUrl ? `
          <div style="width:100%;height:220px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);background:var(--surface-2);display:flex;align-items:center;justify-content:center">
            <img src="${escAttr(prod.imageUrl)}" alt="${escAttr(prod.name)}" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.src='./icons/icon-192x192.png'" />
          </div>
        ` : ''}

        <div style="background:var(--surface-2);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <h3 style="margin:0;font-size:1.15rem;color:var(--text-primary)">${escHtml(prod.name)}</h3>
            <span class="badge ${prod.status === 'approved' ? 'badge--success' : 'badge--warning'}">
              ${prod.status === 'approved' ? '✓ معتمد' : '⏳ قيد المراجعة'}
            </span>
          </div>

          ${prod.category ? `<div style="font-size:12px;color:var(--primary);margin-bottom:8px;font-weight:700">🏷️ ${escHtml(prod.category)}</div>` : ''}

          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
            ${escHtml(prod.description || 'لا يوجد وصف تفصيلي لهذا المنتج.')}
          </div>

          <div style="display:flex;align-items:center;gap:14px;padding-top:10px;border-top:1px dashed var(--border);flex-wrap:wrap">
            <div>
              <span style="font-size:12px;color:var(--text-muted)">السعر: </span>
              <strong style="font-size:1.25rem;color:var(--primary)">${prod.price || 0} ج.م</strong>
            </div>
            ${prod.oldPrice ? `
              <div>
                <span style="font-size:12px;color:var(--text-muted)">السعر القديم: </span>
                <span style="text-decoration:line-through;color:var(--text-muted);font-size:1.05rem">${prod.oldPrice} ج.م</span>
              </div>
            ` : ''}
            ${prod.oldPrice && Number(prod.oldPrice) > Number(prod.price) ? `
              <div style="margin-right:auto;background:#ECFDF5;color:#065F46;padding:4px 10px;border-radius:var(--radius-full);font-size:12px;font-weight:800;border:1px solid #A7F3D0">
                💰 وفرت ${Number(prod.oldPrice) - Number(prod.price)} ج.م (خصم ${Math.round(((Number(prod.oldPrice) - Number(prod.price)) / Number(prod.oldPrice)) * 100)}%)
              </div>
            ` : ''}
            <span class="badge ${prod.inStock !== false ? 'badge--published' : 'badge--suspended'}">
              ${prod.inStock !== false ? 'متوفر' : 'غير متوفر'}
            </span>
          </div>
        </div>
      </div>
    `,
    buttons: [
      {
        label: '✏️ تعديل هذا المنتج',
        type: 'primary',
        onClick: () => {
          modal.close();
          adminEditProductAction(placeId, productId);
        }
      },
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.adminEditProductAction = async (placeId, productId) => {
  const prod = await dbGet(`products/${placeId}/${productId}`);
  if (!prod) {
    toast.error('لم يتم العثور على بيانات المنتج');
    return;
  }

  const modal = showModal({
    title: `✏️ تعديل المنتج: ${escHtml(prod.name || '')}`,
    size: 'md',
    content: `
      <form id="admin-edit-prod-form" onsubmit="return false">
        <div class="form-group">
          <label class="form-label">اسم المنتج <span class="required">*</span></label>
          <input type="text" id="aeprod-name" class="form-input" value="${escAttr(prod.name || '')}" required />
        </div>

        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">السعر (ج.م) <span class="required">*</span></label>
            <input type="number" id="aeprod-price" class="form-input" value="${prod.price || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">السعر القديم</label>
            <input type="number" id="aeprod-oldPrice" class="form-input" value="${prod.oldPrice || ''}" />
          </div>
        </div>

        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">تصنيف / قسم المنتج</label>
            <input type="text" id="aeprod-category" class="form-input" value="${escAttr(prod.category || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">حالة التوفر</label>
            <select id="aeprod-inStock" class="form-select">
              <option value="true" ${prod.inStock !== false ? 'selected' : ''}>متوفر بالمخزون</option>
              <option value="false" ${prod.inStock === false ? 'selected' : ''}>نفذ من المخزون</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">رابط صورة المنتج (URL)</label>
          <input type="url" id="aeprod-imageUrl" class="form-input" value="${escAttr(prod.imageUrl || '')}" placeholder="https://..." style="direction:ltr" />
        </div>

        <div class="form-group">
          <label class="form-label">حالة الاعتماد والمراجعة</label>
          <select id="aeprod-status" class="form-select">
            <option value="approved" ${prod.status === 'approved' ? 'selected' : ''}>معتمد وظاهر في الدليل ✓</option>
            <option value="pending" ${prod.status === 'pending' ? 'selected' : ''}>قيد المراجعة ⏳</option>
            <option value="rejected" ${prod.status === 'rejected' ? 'selected' : ''}>مرفوض ✕</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">وصف تفاصيل ومواصفات المنتج</label>
          <textarea id="aeprod-description" class="form-textarea" rows="3">${escHtml(prod.description || '')}</textarea>
        </div>
      </form>
    `,
    buttons: [
      {
        label: '💾 حفظ تعديلات المنتج',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const name = document.getElementById('aeprod-name')?.value.trim();
          const price = parseFloat(document.getElementById('aeprod-price')?.value);
          const oldPrice = parseFloat(document.getElementById('aeprod-oldPrice')?.value) || null;
          const category = document.getElementById('aeprod-category')?.value.trim();
          const inStock = document.getElementById('aeprod-inStock')?.value === 'true';
          const imageUrl = document.getElementById('aeprod-imageUrl')?.value.trim();
          const status = document.getElementById('aeprod-status')?.value || 'approved';
          const description = document.getElementById('aeprod-description')?.value.trim();

          if (!name || isNaN(price)) {
            toast.warning('يرجى كتابة اسم وسعر المنتج');
            return;
          }

          const updates = {
            name,
            price,
            oldPrice,
            category,
            inStock,
            imageUrl,
            status,
            isApproved: status === 'approved',
            description,
            updatedAt: serverTimestamp()
          };

          try {
            await dbUpdate(`products/${placeId}/${productId}`, updates);
            toast.success('تم تحديث بيانات المنتج بنجاح ✨');
            modal.close();
            switchAdminSection('products', false);
          } catch (err) {
            toast.error('فشل تحديث المنتج: ' + err.message);
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.deleteProductAdmin = async (placeId, productId) => {
  const ok = await showConfirm({ title: 'حذف المنتج', message: 'هل أنت متأكد من حذف هذا المنتج نهائياً؟' });
  if (ok) {
    try {
      await dbRemove(`products/${placeId}/${productId}`);
      await dbIncrement(`places/${placeId}/productCount`, -1).catch(() => {});
      toast.success('تم حذف المنتج');
      switchAdminSection('products', false);
    } catch {
      toast.error('فشل الحذف');
    }
  }
};
}

// ── Utils ──
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Setup a Live Search input linked to a Place <select> dropdown
 * Supports filtering by Arabic text, Egyptian dialect normalization, and phone numbers.
 * Also manages real-time match count badges and a visual preview card.
 */
function setupPlaceLiveSearch({
  searchInputId,
  selectElementId,
  matchCountId,
  previewCardId,
  totalCount = 0,
  onSelectCallback = null
}) {
  const searchInput = document.getElementById(searchInputId);
  const selectEl = document.getElementById(selectElementId);
  const matchCountEl = matchCountId ? document.getElementById(matchCountId) : null;
  const previewCard = previewCardId ? document.getElementById(previewCardId) : null;

  function updatePreview() {
    if (!previewCard || !selectEl) return;
    const opt = selectEl.selectedOptions ? selectEl.selectedOptions[0] : null;
    if (!opt || !opt.value) {
      previewCard.style.display = 'none';
      return;
    }
    previewCard.style.display = 'flex';
    const name = opt.dataset.name || opt.textContent.trim();
    const cat = opt.dataset.cat || '';
    const area = opt.dataset.area || '';
    const phone = opt.dataset.phone || '';
    const img = opt.dataset.img || '';

    const nameEl = previewCard.querySelector('.place-preview-name');
    const metaEl = previewCard.querySelector('.place-preview-meta');
    const imgEl = previewCard.querySelector('.place-preview-img');

    if (nameEl) nameEl.textContent = name;
    if (metaEl) {
      const parts = [];
      if (cat) parts.push(cat);
      if (area) parts.push(area);
      if (phone) parts.push(`📞 ${phone}`);
      metaEl.textContent = parts.join(' • ');
    }
    if (imgEl) {
      if (img) {
        imgEl.innerHTML = `<img src="${escAttr(img)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🏢'" />`;
      } else {
        imgEl.innerHTML = '🏢';
      }
    }
  }

  selectEl?.addEventListener('change', () => {
    updatePreview();
    if (onSelectCallback) onSelectCallback(selectEl.value, selectEl.selectedOptions ? selectEl.selectedOptions[0] : null);
  });

  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    const qNorm = normalizeArabic(q);
    const qPhone = normalizePhoneNumber(q);
    let matchedCount = 0;
    let firstMatchedId = null;

    Array.from(selectEl.options).forEach((opt, idx) => {
      if (idx === 0) return; // Keep placeholder option
      const name = opt.dataset.name || opt.textContent || '';
      const cat = opt.dataset.cat || '';
      const area = opt.dataset.area || '';
      const phone = opt.dataset.phone || '';
      const fullText = `${name} ${cat} ${area} ${phone}`;

      let match = !q;
      if (q) {
        if (arabicMatch(fullText, q)) match = true;
        else if (normalizeArabic(fullText).includes(qNorm)) match = true;
        else if (qPhone && phone && normalizePhoneNumber(phone).includes(qPhone)) match = true;
      }

      opt.hidden = !match;
      opt.style.display = match ? 'block' : 'none';
      if (match) {
        matchedCount++;
        if (!firstMatchedId) firstMatchedId = opt.value;
      }
    });

    if (matchCountEl) {
      matchCountEl.textContent = q ? `${matchedCount} مطابق للبحث` : `${totalCount || (selectEl.options.length - 1)} مكان متاح`;
    }

    if (q && matchedCount > 0 && firstMatchedId) {
      selectEl.value = firstMatchedId;
      updatePreview();
      if (onSelectCallback) onSelectCallback(selectEl.value, selectEl.selectedOptions ? selectEl.selectedOptions[0] : null);
    } else if (q && matchedCount === 0) {
      selectEl.value = '';
      updatePreview();
      if (onSelectCallback) onSelectCallback('', null);
    }
  });

  // Initial preview
  updatePreview();
}


// ─────────────────────────────────────────────────────────────────────────
//  LIVE NEWS & COMMUNITY PULSE FULL CRUD (إدارة المنزلة والمطرية الآن)
// ─────────────────────────────────────────────────────────────────────────
async function renderAdminLiveNews($container) {
  $container.innerHTML = '<div class="spinner spinner-lg" style="margin:4rem auto"></div>';

  const [pendingNews, publishedNews] = await Promise.all([
    getPendingLiveNews(),
    getPublishedLiveNews({ limit: 60 })
  ]);

  $container.innerHTML = `
    <div class="admin-fade-in">
      <!-- Section Header -->
      <div class="dashboard-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:22px">
        <div>
          <h1 class="dashboard-header__title" style="color:#fff;font-size:1.6rem;font-weight:800;display:flex;align-items:center;gap:10px">
            <span style="color:#F5A623">🔥</span>
            <span>إدارة قسم (المنزلة والمطرية الآن)</span>
            ${pendingNews.length > 0 ? `<span class="badge" style="background:#EF4444;color:#fff;font-size:12px;font-weight:800;padding:3px 10px;border-radius:9999px;box-shadow:0 0 10px rgba(239,68,68,0.5)">${pendingNews.length} بانتظار الموافقة</span>` : ''}
          </h1>
          <div class="dashboard-header__subtitle" style="color:rgba(255,255,255,0.7);font-size:13px">
            التحكم الكامل: نشر تنبيهات رسمية، تعديل وحذف الأخبار، ومراجعة تقارير المواطنين الحية
          </div>
        </div>

        <button type="button" id="btn-admin-post-live-news" class="btn btn-primary" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#0B1E30;font-weight:800;border:none;border-radius:12px;padding:10px 20px;font-size:13.5px;box-shadow:0 4px 15px rgba(245,166,35,0.3);gap:8px">
          <span>📢</span>
          <span>نشر خبر / تنبيه رسمي عاجل</span>
        </button>
      </div>

      <!-- Quick Stats Grid -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:24px">
        <div class="stat-card" style="background:#0F273D;padding:18px;border-radius:16px;border:1.5px solid ${pendingNews.length > 0 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}">
          <div style="font-size:12.5px;color:${pendingNews.length > 0 ? '#EF4444' : 'rgba(255,255,255,0.6)'};margin-bottom:6px;font-weight:700">⏳ طلبات تنتظر مراجعتك والاعتماد</div>
          <div style="font-size:2rem;font-weight:900;color:${pendingNews.length > 0 ? '#EF4444' : '#fff'}">${pendingNews.length}</div>
        </div>
        <div class="stat-card" style="background:#0F273D;padding:18px;border-radius:16px;border:1.5px solid rgba(255,255,255,0.1)">
          <div style="font-size:12.5px;color:rgba(255,255,255,0.6);margin-bottom:6px;font-weight:700">🟢 أخبار وتحديثات منشورة على الموقع</div>
          <div style="font-size:2rem;font-weight:900;color:#10B981">${publishedNews.length}</div>
        </div>
      </div>

      <!-- 1. Pending Approvals Section -->
      ${pendingNews.length > 0 ? `
        <div style="margin-bottom:28px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <span style="font-size:20px">⏳</span>
            <h2 style="font-size:16px;font-weight:800;color:#EF4444;margin:0">
              أخبار واردة من المواطنين بانتظار موافقتك واعتمادها (${pendingNews.length})
            </h2>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px">
            ${pendingNews.map(item => `
              <div style="background:#0F273D;border:1.5px solid rgba(239,68,68,0.4);border-radius:16px;padding:16px;box-shadow:0 6px 20px rgba(0,0,0,0.25);display:flex;flex-direction:column;justify-content:space-between">
                <div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                    <span class="badge" style="background:rgba(2,132,199,0.25);color:#38BDF8;font-weight:800;font-size:11.5px;padding:3px 8px;border-radius:6px">
                      📍 ${escHtml(item.city || 'المنزلة')} • ${escHtml(NEWS_CATEGORIES[item.category]?.label || 'عام')}
                    </span>
                    <span style="font-size:11.5px;color:rgba(255,255,255,0.5)">${formatDate(item.createdAt || Date.now())}</span>
                  </div>

                  <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 6px 0;line-height:1.4">${escHtml(item.title)}</h3>
                  <div style="font-size:12.5px;color:#F5A623;font-weight:700;margin-bottom:8px">📍 ${escHtml(item.location)}</div>
                  
                  ${item.details ? `<p style="font-size:12.5px;color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.06);padding:10px;border-radius:8px;margin:0 0 12px 0;line-height:1.5">${escHtml(item.details)}</p>` : ''}
                  
                  <div style="font-size:11.5px;color:rgba(255,255,255,0.6);margin-bottom:14px">
                    بواسطة: <strong style="color:#fff">${escHtml(item.userName || 'مواطن')}</strong>
                  </div>
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <button type="button" class="btn btn-sm btn-success btn-approve-news" data-nid="${escAttr(item.id)}" style="flex:1;border-radius:8px;font-weight:800;font-size:12px;padding:7px">
                    ✓ اعتماد ونشر
                  </button>
                  <button type="button" class="btn btn-sm btn-outline btn-edit-news" data-nid="${escAttr(item.id)}" style="border-radius:8px;font-weight:800;font-size:12px;padding:7px 12px;color:#38BDF8;border-color:#38BDF8">
                    ✏️ تعديل
                  </button>
                  <button type="button" class="btn btn-sm btn-danger btn-delete-news" data-nid="${escAttr(item.id)}" style="border-radius:8px;font-weight:800;font-size:12px;padding:7px 12px">
                    ✕ رفض
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 2. Published News Table with Edit / Delete Controls -->
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
          <h2 style="font-size:16px;font-weight:800;color:#fff;margin:0">
            الأخبار والتحديثات المنشورة الحالية (${publishedNews.length})
          </h2>

          <input type="text" id="admin-search-live-news" class="form-input" placeholder="🔍 بحث في الأخبار المنشورة..." style="max-width:260px;font-size:12.5px;padding:6px 12px;margin:0" />
        </div>

        <div class="dashboard-table-wrapper" style="background:#0F273D;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden">
          <table class="dashboard-table" style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-size:12px">
                <th style="padding:12px">الخبر / الحدث</th>
                <th style="padding:12px">الموقع والمدينة</th>
                <th style="padding:12px">التصنيف</th>
                <th style="padding:12px">التفاعلات</th>
                <th style="padding:12px">التاريخ</th>
                <th style="text-align:center;padding:12px">إجراءات التحكم</th>
              </tr>
            </thead>
            <tbody id="admin-live-news-tbody">
              ${publishedNews.map(item => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05)" class="admin-news-table-row" data-search-text="${escAttr((item.title + ' ' + item.location + ' ' + (item.city || '')).toLowerCase())}">
                  <td style="padding:12px;color:#fff;font-weight:700;font-size:13.5px">${escHtml(item.title)}</td>
                  <td style="padding:12px;color:#38BDF8;font-size:12px">📍 ${escHtml(item.location)} (${escHtml(item.city || 'المنزلة')})</td>
                  <td style="padding:12px;font-size:12px;color:rgba(255,255,255,0.8)">${escHtml(NEWS_CATEGORIES[item.category]?.label || item.category || 'عام')}</td>
                  <td style="padding:12px;font-size:12px;color:#10B981;font-weight:700">
                    👍 ${item.reactions?.confirm || 0} • ❤️ ${item.reactions?.love || 0}
                  </td>
                  <td style="padding:12px;font-size:11.5px;color:rgba(255,255,255,0.6)">${formatDate(item.createdAt || Date.now())}</td>
                  <td style="text-align:center;padding:12px;white-space:nowrap">
                    <button class="btn btn-xs btn-outline btn-edit-news" data-nid="${escAttr(item.id)}" style="border-radius:6px;padding:4px 10px;margin-left:4px;color:#38BDF8;border-color:#38BDF8" title="تعديل">
                      ✏️ تعديل
                    </button>
                    <button class="btn btn-xs btn-danger btn-delete-news" data-nid="${escAttr(item.id)}" style="border-radius:6px;padding:4px 8px" title="حذف">
                      ${ICONS.trash}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Search Filter Handler
  document.getElementById('admin-search-live-news')?.addEventListener('input', (e) => {
    const q = (e.target.value || '').trim().toLowerCase();
    $container.querySelectorAll('.admin-news-table-row').forEach(row => {
      const text = row.getAttribute('data-search-text') || '';
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // Approve Listener
  $container.querySelectorAll('.btn-approve-news').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nid = btn.getAttribute('data-nid');
      try {
        await adminApproveLiveNews(nid);
        toast.success('تم اعتماد ونشر الخبر وإرسال إشعار فوري للجميع! 🔥');
        renderAdminLiveNews($container);
      } catch (err) {
        toast.error(err.message || 'فشلت العملية');
      }
    });
  });

  // Edit Listener
  $container.querySelectorAll('.btn-edit-news').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nid = btn.getAttribute('data-nid');
      const allNews = [...pendingNews, ...publishedNews];
      const item = allNews.find(n => n.id === nid);
      if (item) {
        openEditLiveNewsModal(item, () => renderAdminLiveNews($container));
      }
    });
  });

  // Delete Listener
  $container.querySelectorAll('.btn-delete-news').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nid = btn.getAttribute('data-nid');
      const ok = await showConfirm({
        title: 'حذف الخبر',
        message: 'هل أنت متأكد من حذف هذا التحديث نهائياً من يحدث الآن؟',
        confirmText: 'نعم، حذف نهائي',
        cancelText: 'إلغاء'
      });
      if (ok) {
        try {
          await adminDeleteLiveNews(nid);
          toast.success('تم حذف التحديث بنجاح');
          renderAdminLiveNews($container);
        } catch (err) {
          toast.error(err.message || 'فشل الحذف');
        }
      }
    });
  });

  // Post Admin News Directly
  document.getElementById('btn-admin-post-live-news')?.addEventListener('click', () => {
    const user = getCurrentUser();
    const modal = showModal({
      title: '📢 نشر خبر / تنبيه رسمي عاجل',
      size: 'md',
      content: `
        <form id="form-admin-direct-news" style="display:flex;flex-direction:column;gap:12px" onsubmit="return false">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">عنوان الخبر / التنبيه <span class="required">*</span></label>
            <input type="text" id="admin-news-title" class="form-input" placeholder="مثال: تنبيه بخصوص انقطاع المياه غداً / افتتاح معرض..." required />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:700">المدينة <span class="required">*</span></label>
              <select id="admin-news-city" class="form-select">
                <option value="المنزلة">📍 المنزلة</option>
                <option value="المطرية">🌊 المطرية</option>
                <option value="العصافرة">🌾 العصافرة والقرى المجاورة</option>
                <option value="المنزلة والمطرية">🏙️ المنزلة والمطرية معاً</option>
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:700">التصنيف <span class="required">*</span></label>
              <select id="admin-news-cat" class="form-select">
                ${Object.entries(NEWS_CATEGORIES).map(([k, c]) => `
                  <option value="${k}">${c.icon} ${c.label}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">المكان / المنطقة بالتحديد <span class="required">*</span></label>
            <input type="text" id="admin-news-location" class="form-input" placeholder="مثال: شارع عبد المنعم رياض، المنزلة" required />
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">تفاصيل الخبر / التنبيه</label>
            <textarea id="admin-news-details" class="form-textarea" rows="3" placeholder="تفاصيل وبيان الخبر..."></textarea>
          </div>
        </form>
      `,
      buttons: [
        {
          label: '🚀 نشر وإرسال إشعار فوري للجميع',
          type: 'primary',
          closeOnClick: false,
          onClick: async () => {
            const title = document.getElementById('admin-news-title')?.value.trim();
            const location = document.getElementById('admin-news-location')?.value.trim();
            const city = document.getElementById('admin-news-city')?.value;
            const category = document.getElementById('admin-news-cat')?.value;
            const details = document.getElementById('admin-news-details')?.value.trim();

            if (!title || !location) {
              toast.warning('يرجى ملء العنوان والمكان');
              return;
            }

            try {
              await submitLiveReport({
                title,
                location,
                city,
                category,
                statusTagKey: 'urgent_tag',
                details,
                user,
                isAdminUser: true
              });
              toast.success('تم نشر التنبيه الرسمي وإرسال إشعار فوري للجميع! 📢');
              modal.close();
              renderAdminLiveNews($container);
            } catch (err) {
              toast.error(err.message || 'فشل النشر');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  });
}

/**
 * Modal to Edit an Existing Live News Report
 */
function openEditLiveNewsModal(item, onSaveCallback) {
  const modal = showModal({
    title: '✏️ تعديل خبر في (المنزلة والمطرية الآن)',
    size: 'md',
    content: `
      <form id="form-edit-live-news" style="display:flex;flex-direction:column;gap:12px" onsubmit="return false">
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:700">عنوان الخبر <span class="required">*</span></label>
          <input type="text" id="edit-news-title" class="form-input" value="${escAttr(item.title || '')}" required />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">المدينة <span class="required">*</span></label>
            <select id="edit-news-city" class="form-select">
              <option value="المنزلة" ${item.city === 'المنزلة' ? 'selected' : ''}>📍 المنزلة</option>
              <option value="المطرية" ${item.city === 'المطرية' ? 'selected' : ''}>🌊 المطرية</option>
              <option value="العصافرة" ${item.city === 'العصافرة' ? 'selected' : ''}>🌾 العصافرة والقرى المجاورة</option>
              <option value="المنزلة والمطرية" ${item.city === 'المنزلة والمطرية' ? 'selected' : ''}>🏙️ المنزلة والمطرية معاً</option>
            </select>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">التصنيف <span class="required">*</span></label>
            <select id="edit-news-cat" class="form-select">
              ${Object.entries(NEWS_CATEGORIES).map(([k, c]) => `
                <option value="${k}" ${item.category === k ? 'selected' : ''}>${c.icon} ${c.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">المكان / الشارع بالتحديد <span class="required">*</span></label>
            <input type="text" id="edit-news-location" class="form-input" value="${escAttr(item.location || '')}" required />
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">شارة الحالة</label>
            <select id="edit-news-tag" class="form-select">
              ${Object.entries(STATUS_TAGS).map(([k, t]) => `
                <option value="${k}" ${item.statusTagKey === k ? 'selected' : ''}>${t.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:700">تفاصيل الخبر</label>
          <textarea id="edit-news-details" class="form-textarea" rows="3">${escHtml(item.details || '')}</textarea>
        </div>
      </form>
    `,
    buttons: [
      {
        label: '💾 حفظ التعديلات ونشرها',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const title = document.getElementById('edit-news-title')?.value.trim();
          const location = document.getElementById('edit-news-location')?.value.trim();
          const city = document.getElementById('edit-news-city')?.value;
          const category = document.getElementById('edit-news-cat')?.value;
          const statusTagKey = document.getElementById('edit-news-tag')?.value;
          const details = document.getElementById('edit-news-details')?.value.trim();

          if (!title || !location) {
            toast.warning('يرجى ملء العنوان والمكان');
            return;
          }

          try {
            await adminUpdateLiveNews(item.id, {
              title,
              location,
              city,
              category,
              statusTagKey,
              details,
              status: 'published'
            });

            toast.success('تم حفظ تعديلات الخبر بنجاح! 💾');
            modal.close();
            if (onSaveCallback) onSaveCallback();
          } catch (err) {
            toast.error(err.message || 'فشل حفظ التعديل');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}
