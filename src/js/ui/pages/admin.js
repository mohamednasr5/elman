/**
 * المنزلة وناسها — Admin Control Panel (Instant SPA + Sponsored Ads Edition)
 * Zero-latency navigation, in-memory caching, responsive mobile bottom-bar,
 * and complete Sponsored Place / Paid Ad priority controls.
 */

import { dbGet, dbSet, dbUpdate, dbRemove, dbPush, serverTimestamp, getSettings, getCategories, getAllReviews, adminAddReview, adminUpdateReview, adminDeleteReview, adminBulkDeleteReviews, parseBulkReviews, adminBulkAddReviews, generateSyntheticReviews, isPlaceBanned, adminBanPlace, adminUnbanPlace, getAllProducts, adminApproveProduct, adminRejectProduct, adminDeleteProduct, adminApproveReportedReview, HAMMAD_TESTIMONIALS, HAMMAD_PLACE_SLUG } from '../../core/db.js';
import { isAdmin } from '../../core/auth.js';
import { renderStatusBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../../utils/date.js';
import { extractCoordinates, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';
import { arabicMatch } from '../../utils/arabic.js';

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
          ${navLink('overview',      'admin.html',                      ICONS.chart,     'الإحصائيات',     section === 'overview')}
          ${navLink('places',        'admin.html?section=places',       ICONS.pin,       'الأماكن',         section === 'places')}
          ${navLink('products',      'admin.html?section=products',     ICONS.tag,       'المنتجات والمراجعة 🛍️', section === 'products')}
          ${navLink('reviews',       'admin.html?section=reviews',      ICONS.star,      'التقييمات ⭐',    section === 'reviews')}
          ${navLink('verification',  'admin.html?section=verification', ICONS.shield,    'طلبات التوثيق',  section === 'verification')}
          ${navLink('categories',    'admin.html?section=categories',   ICONS.folder,    'التصنيفات',       section === 'categories')}
          ${navLink('users',         'admin.html?section=users',        ICONS.users,     'المستخدمون',      section === 'users')}
          ${navLink('offers',        'admin.html?section=offers',       ICONS.tag,       'العروض',          section === 'offers')}
          ${navLink('ads',           'admin.html?section=ads',          ICONS.megaphone, 'الإعلانات والترويج', section === 'ads')}
          ${navLink('settings',      'admin.html?section=settings',     ICONS.cog,       'الإعدادات',       section === 'settings')}

          <div class="dashboard-nav-section" style="color:rgba(255,255,255,0.4)">العودة</div>
          <a href="dashboard.html" class="dashboard-nav-item" style="color:rgba(255,255,255,0.7)">
            <span style="display:inline-flex;align-items:center">${ICONS.home}</span>
            <span>لوحة المستخدم</span>
          </a>
          <a href="index.html" class="dashboard-nav-item" style="color:rgba(255,255,255,0.7)">
            <span style="display:inline-flex;align-items:center">${ICONS.globe}</span>
            <span>الصفحة الرئيسية</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="dashboard-content" id="admin-main-area">
        <div style="display:flex;align-items:center;justify-content:center;min-height:50vh">
          <div class="spinner spinner-lg"></div>
        </div>
      </main>

      <!-- Admin Mobile Bottom Bar for PWA -->
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
        <button type="button" class="admin-bottom-tab ${section === 'categories' ? 'active' : ''}" data-admin-sec="categories">
          <span class="admin-bottom-tab__icon">${ICONS.folder}</span>
          <span class="admin-bottom-tab__label">التصنيفات</span>
        </button>
        <button type="button" class="admin-bottom-tab ${section === 'users' ? 'active' : ''}" data-admin-sec="users">
          <span class="admin-bottom-tab__icon">${ICONS.users}</span>
          <span class="admin-bottom-tab__label">المستخدمين</span>
        </button>
        <button type="button" class="admin-bottom-tab ${section === 'offers' ? 'active' : ''}" data-admin-sec="offers">
          <span class="admin-bottom-tab__icon">${ICONS.tag}</span>
          <span class="admin-bottom-tab__label">العروض</span>
        </button>
        <button type="button" class="admin-bottom-tab ${section === 'ads' ? 'active' : ''}" data-admin-sec="ads">
          <span class="admin-bottom-tab__icon">${ICONS.megaphone}</span>
          <span class="admin-bottom-tab__label">الإعلانات</span>
        </button>
        <button type="button" class="admin-bottom-tab ${section === 'settings' ? 'active' : ''}" data-admin-sec="settings">
          <span class="admin-bottom-tab__icon">${ICONS.cog}</span>
          <span class="admin-bottom-tab__label">الإعدادات</span>
        </button>
      </nav>
    </div>
  `;

  setupAdminNavigation();
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
    const newUrl = sectionName === 'overview' ? 'admin.html' : `admin.html?section=${sectionName}`;
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

if (typeof window !== 'undefined') {
  window.refreshCurrentAdminSection = () => switchAdminSection(_currentSection, false);
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

  // Mobile Bottom Nav Listener
  const mobileNav = document.getElementById('admin-mobile-bottom-nav');
  if (mobileNav && !mobileNav.dataset.listening) {
    mobileNav.dataset.listening = 'true';
    mobileNav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-admin-sec]');
      if (btn) {
        e.preventDefault();
        const section = btn.getAttribute('data-admin-sec');
        switchAdminSection(section, true);
      }
    });
  }

  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') || 'overview';
    switchAdminSection(section, false);
  });
}

async function preloadAdminData() {
  if (adminCache.isPreloaded) return;
  try {
    const [u, p, o, a, v, c, cat, s] = await Promise.all([
      adminCache.users || dbGet('users'),
      adminCache.places || dbGet('places'),
      adminCache.offers || dbGet('offers'),
      adminCache.ads || dbGet('ads'),
      adminCache.verificationRequests || dbGet('verificationRequests'),
      adminCache.categoryRequests || dbGet('categoryRequests'),
      adminCache.categories || getCategories(),
      adminCache.settings || getSettings()
    ]);
    adminCache.users = u || {};
    adminCache.places = p || {};
    adminCache.offers = o || {};
    adminCache.ads = a || {};
    adminCache.verificationRequests = v || {};
    adminCache.categoryRequests = c || {};
    adminCache.categories = cat || [];
    adminCache.settings = s || {};
    adminCache.isPreloaded = true;
  } catch (_) {}
}

// ─────────────────────────────────────────────
//  1. Overview
// ─────────────────────────────────────────────
async function renderAdminOverview($container) {
  if (!adminCache.places || !adminCache.users) {
    const [u, p, o, a, v] = await Promise.all([
      dbGet('users'), dbGet('places'), dbGet('offers'), dbGet('ads'), dbGet('verificationRequests')
    ]);
    adminCache.users = u || {};
    adminCache.places = p || {};
    adminCache.offers = o || {};
    adminCache.ads = a || {};
    adminCache.verificationRequests = v || {};
  }

  const users        = Object.values(adminCache.users  || {});
  const places       = Object.values(adminCache.places || {});
  const offers       = Object.values(adminCache.offers || {});
  const ads          = Object.values(adminCache.ads    || {});
  const pendingReqs  = Object.values(adminCache.verificationRequests || {}).filter(r => r && r.status === 'pending');
  const verified     = places.filter(p => p.isVerified);
  const sponsored    = places.filter(p => p.isSponsored || p.isFeatured || p.isPromoted);

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header" style="margin-bottom:24px">
        <div>
          <h1 class="dashboard-header__title">لوحة التحكم الشاملة — المنزلة وناسها</h1>
          <div class="dashboard-header__subtitle">مراقبة وإدارة جميع أقسام المنصة والمستخدمين والأنشطة</div>
        </div>
      </div>

      <!-- Stats KPIs -->
      <div class="stats-grid" style="margin-bottom:32px">
        <div class="stat-card">
          <div class="stat-card__icon" style="color:#3B82F6">${ICONS.users}</div>
          <div class="stat-card__value">${users.length}</div>
          <div class="stat-card__label">المستخدمون المسجلون</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon" style="color:#10B981">${ICONS.pin}</div>
          <div class="stat-card__value">${places.length}</div>
          <div class="stat-card__label">إجمالي الأماكن</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon" style="color:#FF8C00">⭐</div>
          <div class="stat-card__value" style="color:#FF8C00">${sponsored.length}</div>
          <div class="stat-card__label">إعلانات مدفوعة نشطة</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon" style="color:var(--secondary,#F5A623)">${ICONS.shield}</div>
          <div class="stat-card__value" style="color:var(--secondary,#F5A623)">${verified.length}</div>
          <div class="stat-card__label">أنشطة موثقة</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon" style="color:var(--danger,#EF4444)">${ICONS.clock}</div>
          <div class="stat-card__value" style="color:var(--danger,#EF4444)">${pendingReqs.length}</div>
          <div class="stat-card__label">طلبات توثيق معلقة</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon" style="color:#06B6D4">${ICONS.megaphone}</div>
          <div class="stat-card__value">${ads.length}</div>
          <div class="stat-card__label">إجمالي الإعلانات</div>
        </div>
      </div>

      <!-- Quick Action Sections -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px">
        <!-- Pending Verification Requests -->
        <div class="form-section">
          <h2 class="form-section__title">
            <span>${ICONS.shield}</span> أحدث طلبات التوثيق (${pendingReqs.length})
          </h2>
          ${pendingReqs.length === 0 ? '<p class="text-muted">لا توجد طلبات توثيق معلقة حالياً</p>' : `
            <div style="display:flex;flex-direction:column;gap:10px">
              ${pendingReqs.slice(0, 5).map(r => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--surface-2);border-radius:var(--radius-md)">
                  <div>
                    <strong>${escHtml(r.placeName)}</strong>
                    <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${escHtml(r.ownerName || r.ownerEmail || '')}</div>
                  </div>
                  <button class="btn btn-sm btn-secondary" onclick="window.navToSection('verification')">مراجعة</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Latest Places -->
        <div class="form-section">
          <h2 class="form-section__title">
            <span>${ICONS.pin}</span> أحدث الأماكن المضافة
          </h2>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${places.slice(-5).reverse().map(p => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--surface-2);border-radius:var(--radius-md)">
                <div>
                  <strong>${escHtml(p.name)}</strong>
                  <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${escHtml(p.area || 'المنزلة')}</div>
                </div>
                <a href="place.html?slug=${escAttr(p.slug)}" target="_blank" class="btn btn-sm btn-outline">${ICONS.eye}</a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

if (typeof window !== 'undefined') {
  window.navToSection = (sec) => switchAdminSection(sec, true);
}

// ─────────────────────────────────────────────
//  2. Places
// ─────────────────────────────────────────────
async function renderAdminPlaces($container) {
  if (!adminCache.places) {
    adminCache.places = (await dbGet('places')) || {};
  }
  const places = Object.entries(adminCache.places || {}).map(([id, p]) => ({ ...p, _id: id }));

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إدارة الأماكن (${places.length})</h1>
          <div class="dashboard-header__subtitle">التحكم في التوثيق، حالة النشر، والإعلانات المدفوعة المميزة</div>
        </div>
      </div>

      <!-- Search Filter -->
      <div class="filter-bar" style="margin-bottom:16px">
        <input type="search" id="admin-place-search" class="form-input" placeholder="🔍 بحث باسم المكان أو المنطقة أو التصنيف..." style="max-width:400px" />
      </div>

      <!-- Places Table -->
      <div class="dashboard-table-wrapper">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>المكان</th>
              <th>التصنيف</th>
              <th>المنطقة</th>
              <th>إعلان مدفوع ⭐</th>
              <th>التوثيق</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody id="admin-places-tbody">
            ${renderAdminPlacesTableRows(places)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('admin-place-search')?.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    const filtered = places.filter(p => 
      !q ||
      arabicMatch(p.name, q) || 
      arabicMatch(p.area, q) ||
      arabicMatch(p.address, q) ||
      arabicMatch(p.categoryName || p.categoryId, q) ||
      arabicMatch(p.description, q)
    );
    document.getElementById('admin-places-tbody').innerHTML = renderAdminPlacesTableRows(filtered);
  });
}

function renderAdminPlacesTableRows(places) {
  if (!places.length) return '<tr><td colspan="7" class="text-center">لا توجد أماكن مطابقة</td></tr>';

  return places.map(p => {
    const isSpons = Boolean(p.isSponsored || p.isFeatured || p.isPromoted);
    const isExpired = isSpons && p.sponsoredUntil && p.sponsoredUntil <= Date.now();
    const isCurrentlyActive = isSpons && !isExpired;

    let buttonHtml = '';
    if (isCurrentlyActive) {
      const expText = p.sponsoredUntil ? `ينتهي: ${formatDate(p.sponsoredUntil)}` : 'دائم';
      buttonHtml = `<button class="btn btn-xs btn-success" onclick="togglePlaceSponsored('${escAttr(p._id)}', false)" title="${expText} - انقر للإلغاء">⭐ نشط (${expText}) ✕</button>`;
    } else if (isExpired) {
      buttonHtml = `<button class="btn btn-xs btn-warning" onclick="togglePlaceSponsored('${escAttr(p._id)}', true)" title="انتهت مدة الإعلان - انقر للتجديد">⚠️ انتهى الإعلان (تجديد)</button>`;
    } else {
      buttonHtml = `<button class="btn btn-xs btn-outline" onclick="togglePlaceSponsored('${escAttr(p._id)}', true)" title="تعيين كإعلان مدفوع في قمة كل الصفحات">📢 تعيين كإعلان</button>`;
    }

    const banned = isPlaceBanned(p);
    let statusBadgeHtml = '';
    if (banned) {
      const banText = p.isPermanentlyBanned || !p.bannedUntil
        ? '🚫 محظور نهائياً'
        : `⏳ محظور حتى ${formatDate(p.bannedUntil)}`;
      statusBadgeHtml = `<span class="badge" style="background:#FEE2E2;color:#DC2626;font-weight:700;padding:4px 8px" title="${escAttr(p.banReason || 'مخالفة الشروط')}">${banText}</span>`;
    } else {
      statusBadgeHtml = renderStatusBadge(p.status || 'published');
    }

    let banButtonHtml = '';
    if (banned) {
      banButtonHtml = `<button class="btn btn-xs btn-success" onclick="adminUnbanPlaceAction('${escAttr(p._id)}')" title="إلغاء الحظر وإعادة المكان للدليل فوراً">✅ فك الحظر</button>`;
    } else {
      banButtonHtml = `<button class="btn btn-xs btn-outline" style="color:#DC2626;border-color:#FCA5A5;background:#FEF2F2" onclick="adminBanPlaceAction('${escAttr(p._id)}', '${escAttr(p.name)}')" title="حظر هذا المكان مؤقتاً أو نهائياً">🚫 حظر</button>`;
    }

    return `
      <tr style="${banned ? 'background:rgba(239,68,68,0.05)' : ''}">
        <td>
          <strong>${escHtml(p.name)}</strong>
          <div style="font-size:11px;color:var(--text-muted)">${p.phone || ''}</div>
          <div style="font-size:11px;margin-top:3px">
            ${p.ownerId ? `<span style="color:#7E22CE;font-weight:600">👤 المالك: ${escHtml(p.ownerName || p.ownerEmail || p.ownerId.slice(0, 8))}</span>` : `<span style="color:var(--text-muted)">👤 المالك: بدون مستخدم (المنصة)</span>`}
          </div>
        </td>
        <td>${escHtml(p.categoryId || 'عام')}</td>
        <td>${escHtml(p.area || 'المنزلة')}</td>
        <td>${buttonHtml}</td>
        <td>
          <button class="btn btn-xs ${p.isVerified ? 'btn-danger' : 'btn-secondary'}" onclick="togglePlaceVerification('${escAttr(p._id)}', ${!p.isVerified})">
            ${p.isVerified ? ICONS.x + ' إلغاء التوثيق' : ICONS.shield + ' توثيق'}
          </button>
        </td>
        <td>${statusBadgeHtml}</td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${banButtonHtml}
            <button class="btn btn-xs btn-outline" style="background:#FAF5FF;color:#7E22CE;border-color:#E9D5FF" onclick="transferPlaceOwnershipAdmin('${escAttr(p._id)}')" title="نقل ملكية هذا المكان لمستخدم مسجل">${ICONS.users} نقل</button>
            <button class="btn btn-xs btn-outline" style="background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE" onclick="editPlaceAdmin('${escAttr(p._id)}')" title="تعديل كافة بيانات المكان أو الشخص">${ICONS.edit}</button>
            <a href="place.html?slug=${escAttr(p.slug)}" target="_blank" class="btn btn-xs btn-outline" title="عرض صفحة المكان">${ICONS.eye}</a>
            <button class="btn btn-xs btn-danger" onclick="deletePlaceAdmin('${escAttr(p._id)}')" title="حذف المكان">${ICONS.trash}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

if (typeof window !== 'undefined') {
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
//  2.4. Products Moderation (المنتجات والمراجعة)
// ─────────────────────────────────────────────
async function renderAdminProducts($container) {
  if (!adminCache.products) {
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
          <div style="display:flex;gap:6px;flex-wrap:wrap">
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
      <div class="dashboard-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="dashboard-header__title">إدارة التقييمات والمراجعات (${totalReviews})</h1>
          <div class="dashboard-header__subtitle">التحكم في تقييمات الأماكن، وإضافة مراجعات بأسماء عملاء، ومراجعة البلاغات المسيئة</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary" id="btn-admin-bulk-reviews" style="border-radius:var(--radius-full);gap:6px">
            <span>📦</span> إضافة تقييمات مجمعة (Bulk)
          </button>
          <button class="btn btn-primary" id="btn-admin-add-review" style="border-radius:var(--radius-full);gap:6px">
            <span>➕</span> إضافة تقييم باسم عميل
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:var(--space-5)">
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">إجمالي التقييمات</div>
          <div style="font-size:1.8rem;font-weight:800;color:var(--primary)">${totalReviews}</div>
        </div>
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">تقييمات 5 نجوم ★</div>
          <div style="font-size:1.8rem;font-weight:800;color:#F59E0B">${fiveStarReviews}</div>
        </div>
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">متوسط التقييم العام</div>
          <div style="font-size:1.8rem;font-weight:800;color:var(--accent)">${avgOverall} ★</div>
        </div>
        <div class="stat-card" style="background:var(--surface);padding:18px;border-radius:var(--radius-lg);border:1px solid ${reportedReviews.length > 0 ? 'rgba(239,68,68,0.4)' : 'var(--border)'}">
          <div style="font-size:12px;color:${reportedReviews.length > 0 ? 'var(--danger)' : 'var(--text-muted)'};margin-bottom:6px">بلاغات مسيئة 🚩</div>
          <div style="font-size:1.8rem;font-weight:800;color:${reportedReviews.length > 0 ? 'var(--danger)' : 'var(--text-muted)'}">${reportedReviews.length}</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;background:var(--surface);padding:12px 16px;border-radius:var(--radius-md);border:1px solid var(--border)">
        <div style="flex:1;min-width:200px">
          <input type="text" id="admin-reviews-search" class="form-input" placeholder="🔍 بحث باسم المكان أو العميل أو نص التقييم..." style="margin:0" />
        </div>
        <div style="min-width:160px">
          <select id="admin-reviews-filter-place" class="form-select" style="margin:0">
            <option value="">كل الأماكن</option>
            ${placesList.map(p => `<option value="${escAttr(p.id)}">${escHtml(p.name)}</option>`).join('')}
          </select>
        </div>
        <div style="min-width:160px">
          <select id="admin-reviews-filter-stars" class="form-select" style="margin:0">
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
      <div id="admin-reviews-bulk-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);padding:10px 16px;border-radius:var(--radius-md)">
        <div style="display:flex;align-items:center;gap:10px">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;cursor:pointer;margin:0">
            <input type="checkbox" id="admin-reviews-select-all" style="width:16px;height:16px;cursor:pointer" />
            <span>تحديد الكل</span>
          </label>
          <span id="admin-reviews-selected-count" style="font-size:12px;color:var(--text-muted);font-weight:600">0 محدد</span>
        </div>

        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-sm btn-danger" id="btn-delete-selected-reviews" style="font-size:12px;padding:5px 14px;border-radius:var(--radius-md);display:none;font-weight:700">
            <span>🗑️</span> حذف المحدد (<span id="btn-delete-count">0</span>)
          </button>
          <button type="button" class="btn btn-sm btn-outline" id="btn-delete-filtered-negative" style="font-size:12px;padding:5px 14px;border-radius:var(--radius-md);color:var(--danger);border-color:rgba(239,68,68,0.3);background:var(--surface)">
            <span>⚠️</span> حذف كل السلبي (1-2 نجوم)
          </button>
          <button type="button" class="btn btn-sm btn-outline" id="btn-delete-all-filtered" style="font-size:12px;padding:5px 14px;border-radius:var(--radius-md);color:var(--text-secondary);background:var(--surface)">
            <span>🧹</span> حذف كل المعروض حالياً
          </button>
        </div>
      </div>

      <!-- Reviews Table -->
      <div class="dashboard-table-wrapper" style="background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);overflow:hidden">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th style="width:40px;text-align:center">
                <input type="checkbox" id="admin-reviews-th-select-all" style="cursor:pointer;width:15px;height:15px" title="تحديد / إلغاء تحديد الكل" />
              </th>
              <th>المكان</th>
              <th>العميل / المستخدم</th>
              <th>التقييم</th>
              <th>نص المراجعة</th>
              <th>التاريخ</th>
              <th style="text-align:center">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="admin-reviews-table-body">
            <!-- Rendered by renderReviewsRows() -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  let currentFilteredReviews = [];

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

  function renderReviewsRows() {
    const searchVal = (document.getElementById('admin-reviews-search')?.value || '').trim().toLowerCase();
    const placeFilter = document.getElementById('admin-reviews-filter-place')?.value || '';
    const starsFilter = document.getElementById('admin-reviews-filter-stars')?.value || '';

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

    const tbody = document.getElementById('admin-reviews-table-body');
    if (!tbody) return;

    if (currentFilteredReviews.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding:2.5rem;color:var(--text-muted)">
            لا توجد تقييمات مطابقة للبحث
          </td>
        </tr>
      `;
      updateBulkSelectionUI();
      return;
    }

    tbody.innerHTML = currentFilteredReviews.map(r => {
      const rStars = Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5));
      const placeObj = adminCache.places?.[r.placeId];
      const placeSlug = placeObj?.slug || r.placeSlug || r.placeId;
      const isReported = Boolean(r.isReported);

      return `
        <tr style="${isReported ? 'background:rgba(239,68,68,0.06)' : ''}">
          <td style="text-align:center">
            <input type="checkbox" class="admin-review-checkbox" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" style="cursor:pointer;width:15px;height:15px" />
          </td>
          <td>
            <div style="font-weight:700;color:var(--primary);display:flex;align-items:center;gap:6px">
              <span>📍</span>
              <a href="place.html?slug=${escAttr(placeSlug)}" target="_blank" style="color:inherit;text-decoration:none">
                ${escHtml(r.placeName || placeObj?.name || 'مكان غير معروف')}
              </a>
            </div>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:30px;height:30px;border-radius:50%;overflow:hidden;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--primary);flex-shrink:0">
                ${r.userPhoto ? `<img src="${escAttr(r.userPhoto)}" style="width:100%;height:100%;object-fit:cover" />` : (r.userName?.charAt(0) || '👤')}
              </div>
              <div>
                <div style="font-weight:600;font-size:13px">${escHtml(r.userName || 'مستخدم')}</div>
                ${r.isAdminGenerated ? `<span class="badge" style="font-size:9.5px;padding:1px 4px;background:rgba(245,166,35,0.15);color:#D97706">إداري</span>` : ''}
              </div>
            </div>
          </td>
          <td>
            <div style="color:#F59E0B;font-size:14px;letter-spacing:1px;white-space:nowrap">
              ${'★'.repeat(rStars)}${'☆'.repeat(5 - rStars)}
              <span style="color:var(--text-muted);font-size:11px;margin-right:3px">(${rStars}/5)</span>
            </div>
          </td>
          <td style="max-width:320px">
            <div style="font-size:13px;line-height:1.5;color:var(--text-primary)" title="${escAttr(r.comment)}">
              ${escHtml(r.comment || '—')}
            </div>
            ${isReported ? `
              <div style="font-size:11px;color:var(--danger);font-weight:700;margin-top:4px;display:flex;align-items:center;gap:4px">
                <span>🚩</span>
                <span>بلاغ مسيء: ${escHtml(r.lastReportReason || 'محتوى غير لائق')} (من ${escHtml(r.lastReporterName || 'مستخدم')})</span>
              </div>
            ` : ''}
            ${(r.isReviewedByAdmin && (r.adminReviewStatus === 'approved_compliant' || r.adminReviewNote)) ? `
              <div style="font-size:11px;color:#047857;margin-top:3px;font-weight:600">
                🛡️ تم مراجعة هذا التعليق وتأكيد التزامه بالسياسة
              </div>
            ` : ''}
          </td>
          <td style="font-size:12px;color:var(--text-muted);white-space:nowrap">
            ${formatDate(r.createdAt || Date.now())}
          </td>
          <td style="text-align:center;white-space:nowrap">
            <div style="display:inline-flex;gap:4px;flex-wrap:wrap">
              ${isReported ? `
                <button class="btn btn-xs btn-success btn-approve-reported-review" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" title="الموافقة والتأكيد أن التعليق يلتزم بالسياسة وتبرئته">
                  🛡️ سليم (تأكيد)
                </button>
              ` : ''}
              <button class="btn btn-xs btn-outline btn-edit-review-admin" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" title="تعديل التقييم">
                ${ICONS.edit}
              </button>
              <button class="btn btn-xs btn-danger btn-delete-review-admin" data-pid="${escAttr(r.placeId)}" data-rid="${escAttr(r.id)}" title="حذف التقييم">
                ${ICONS.trash}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Checkbox change events
    tbody.querySelectorAll('.admin-review-checkbox').forEach(cb => {
      cb.addEventListener('change', updateBulkSelectionUI);
    });

    updateBulkSelectionUI();

    // Attach row button events
    tbody.querySelectorAll('.btn-approve-reported-review').forEach(btn => {
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

    tbody.querySelectorAll('.btn-edit-review-admin').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-pid');
        const rId = btn.getAttribute('data-rid');
        const rev = allReviews.find(x => x.id === rId && x.placeId === pId);
        if (rev) openAdminEditReviewModal(rev);
      });
    });

    tbody.querySelectorAll('.btn-delete-review-admin').forEach(btn => {
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

  // Toggle select all
  function toggleSelectAll(checked) {
    document.querySelectorAll('.admin-review-checkbox').forEach(cb => {
      cb.checked = checked;
    });
    updateBulkSelectionUI();
  }

  document.getElementById('admin-reviews-select-all')?.addEventListener('change', (e) => {
    toggleSelectAll(e.target.checked);
  });
  document.getElementById('admin-reviews-th-select-all')?.addEventListener('change', (e) => {
    toggleSelectAll(e.target.checked);
  });

  // Delete Selected Reviews Button
  document.getElementById('btn-delete-selected-reviews')?.addEventListener('click', async () => {
    const checkedBoxes = Array.from(document.querySelectorAll('.admin-review-checkbox:checked'));
    if (!checkedBoxes.length) return;

    const ok = await showConfirm({
      title: 'حذف التقييمات المحددة',
      message: `هل أنت متأكد من رغبتك في حذف ${checkedBoxes.length} تقييم محدد نهائياً؟ سيتم تحديث متوسط تقييمات الأماكن تلقائياً.`,
      confirmText: 'نعم، حذف المحدد',
      cancelText: 'إلغاء'
    });

    if (ok) {
      try {
        const toDelete = checkedBoxes.map(cb => ({
          placeId: cb.getAttribute('data-pid'),
          id: cb.getAttribute('data-rid')
        }));
        toast.info(`جاري حذف ${toDelete.length} تقييم وتحديث التقييمات...`);
        const res = await adminBulkDeleteReviews(toDelete);
        toast.success(`تم حذف ${res.deletedCount} تقييم بنجاح وتحديث الأماكن ⭐`);
        adminCache.reviews = null;
        await renderAdminReviews($container);
      } catch (err) {
        toast.error(err.message || 'فشل حذف التقييمات');
      }
    }
  });

  // Delete All Negative Reviews
  document.getElementById('btn-delete-filtered-negative')?.addEventListener('click', async () => {
    const negativeReviews = allReviews.filter(r => (Number(r.rating) || 5) <= 2);
    if (!negativeReviews.length) {
      toast.info('لا توجد أي تقييمات سلبية (1-2 نجوم) حالياً');
      return;
    }

    const placeFilter = document.getElementById('admin-reviews-filter-place')?.value;
    const targetList = placeFilter ? negativeReviews.filter(r => r.placeId === placeFilter) : negativeReviews;

    if (!targetList.length) {
      toast.info('لا توجد تقييمات سلبية لهذا المكان المحدد');
      return;
    }

    const ok = await showConfirm({
      title: 'حذف كل التقييمات السلبية (1-2 نجوم)',
      message: `هل أنت متأكد من حذف ${targetList.length} تقييم سلبي (1-2 نجوم)؟ سيتم تحديث تقييمات الأماكن المتأثرة فوراً.`,
      confirmText: 'نعم، حذف الكل السلبي',
      cancelText: 'إلغاء'
    });

    if (ok) {
      try {
        toast.info(`جاري حذف ${targetList.length} تقييم سلبي...`);
        const res = await adminBulkDeleteReviews(targetList);
        toast.success(`تم حذف ${res.deletedCount} تقييم سلبي بنجاح! ⭐`);
        adminCache.reviews = null;
        await renderAdminReviews($container);
      } catch (err) {
        toast.error(err.message || 'فشل حذف التقييمات السلبية');
      }
    }
  });

  // Delete All Filtered Reviews
  document.getElementById('btn-delete-all-filtered')?.addEventListener('click', async () => {
    if (!currentFilteredReviews.length) {
      toast.warning('لا توجد أي تقييمات معروضة للحذف');
      return;
    }

    const ok = await showConfirm({
      title: 'حذف جميع التقييمات المعروضة في الفلتر',
      message: `هل أنت متأكد من رغبتك في حذف جميع التقييمات الظاهرة حالياً (${currentFilteredReviews.length} تقييم) نهائياً؟`,
      confirmText: 'نعم، حذف الكل المعروض',
      cancelText: 'إلغاء'
    });

    if (ok) {
      try {
        toast.info(`جاري حذف ${currentFilteredReviews.length} تقييم...`);
        const res = await adminBulkDeleteReviews(currentFilteredReviews);
        toast.success(`تم حذف ${res.deletedCount} تقييم بنجاح وتحديث الأماكن ⭐`);
        adminCache.reviews = null;
        await renderAdminReviews($container);
      } catch (err) {
        toast.error(err.message || 'فشل حذف التقييمات');
      }
    }
  });

  // Initial render
  renderReviewsRows();

  // Search & Filter listeners
  document.getElementById('admin-reviews-search')?.addEventListener('input', renderReviewsRows);
  document.getElementById('admin-reviews-filter-place')?.addEventListener('change', renderReviewsRows);
  document.getElementById('admin-reviews-filter-stars')?.addEventListener('change', renderReviewsRows);

  // Bulk Reviews Import button listener
  document.getElementById('btn-admin-bulk-reviews')?.addEventListener('click', () => {
    openAdminBulkReviewsModal(placesList, async () => {
      adminCache.reviews = null;
      await renderAdminReviews($container);
    });
  });

  // Add Single Review button listener
  document.getElementById('btn-admin-add-review')?.addEventListener('click', () => {
    openAdminAddReviewModal(placesList, usersList, async () => {
      adminCache.reviews = null;
      await renderAdminReviews($container);
    });
  });

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
            <select id="add-rev-place" class="form-select" required>
              <option value="">-- اختر المكان من القائمة (${places.length} مكان) --</option>
              ${places.map(p => `<option value="${escAttr(p.id)}" data-slug="${escAttr(p.slug || '')}">${escHtml(p.name)}</option>`).join('')}
            </select>
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
    const addRevSearch = document.getElementById('add-rev-place-search');
    const addRevSelect = document.getElementById('add-rev-place');
    const addRevMatchCount = document.getElementById('add-rev-place-match-count');

    addRevSearch?.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      let matchedCount = 0;
      let firstMatchedId = null;

      Array.from(addRevSelect.options).forEach((opt, idx) => {
        if (idx === 0) return;
        const text = opt.textContent || '';
        const match = !q || arabicMatch(text, q);
        opt.hidden = !match;
        opt.style.display = match ? 'block' : 'none';
        if (match) {
          matchedCount++;
          if (!firstMatchedId) firstMatchedId = opt.value;
        }
      });

      if (addRevMatchCount) {
        addRevMatchCount.textContent = q ? `${matchedCount} مطابق للبحث` : `${places.length} مكان متاح`;
      }

      if (q && matchedCount > 0 && firstMatchedId) {
        addRevSelect.value = firstMatchedId;
      }
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
            <select id="bulk-rev-place" class="form-select" required>
              <option value="">-- اختر المكان من القائمة (${places.length} مكان) --</option>
              ${places.map(p => {
                const isHammad = (p.slug === HAMMAD_PLACE_SLUG || p.name?.includes('محمد حماد'));
                return `<option value="${escAttr(p.id)}" ${isHammad ? 'selected' : ''}>${escHtml(p.name)} ${isHammad ? '⭐ (مهندس محمد حماد)' : ''}</option>`;
              }).join('')}
            </select>
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
    const bulkPlaceSearch = document.getElementById('bulk-rev-place-search');
    const bulkPlaceSelect = document.getElementById('bulk-rev-place');
    const bulkPlaceMatchCount = document.getElementById('bulk-place-match-count');

    bulkPlaceSearch?.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      let matchedCount = 0;
      let firstMatchedId = null;

      Array.from(bulkPlaceSelect.options).forEach((opt, idx) => {
        if (idx === 0) return;
        const text = opt.textContent || '';
        const match = !q || arabicMatch(text, q);
        opt.hidden = !match;
        opt.style.display = match ? 'block' : 'none';
        if (match) {
          matchedCount++;
          if (!firstMatchedId) firstMatchedId = opt.value;
        }
      });

      if (bulkPlaceMatchCount) {
        bulkPlaceMatchCount.textContent = q ? `${matchedCount} مطابق للبحث` : `${places.length} مكان متاح`;
      }

      if (q && matchedCount > 0 && firstMatchedId) {
        bulkPlaceSelect.value = firstMatchedId;
        bulkPlaceSelect.dispatchEvent(new Event('change'));
      }
    });

    // Auto update specialty when place changes
    document.getElementById('bulk-rev-place')?.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const targetPlace = places.find(p => p.id === selectedId);
      const specInput = document.getElementById('gen-rev-specialty');
      if (targetPlace && specInput) {
        specInput.value = targetPlace.categoryName || targetPlace.category || targetPlace.description || 'الخدمات والنشاط';
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
      const placeSelect = document.getElementById('bulk-rev-place');
      const placeName = placeSelect?.options[placeSelect.selectedIndex]?.textContent || '';

      toast.info(`جاري توليد ${count} تقييم فريد في مجال (${specialty || 'النشاط'})...`);
      const generated = generateSyntheticReviews({ count, starRange, specialty, placeName });

      const formattedTable = [
        '| # | اسم العميل | التقييم | نص التقييم |',
        '|---|---|---|---|',
        ...generated.map((t, idx) => `| ${idx + 1} | ${t.name} | ${'⭐'.repeat(t.rating)} | ${t.comment} |`)
      ].join('\n');

      if (textarea) {
        textarea.value = formattedTable;
        updateLivePreview();
        toast.success(`تم توليد ${generated.length} تقييم فريد بتخصص (${specialty}) وتعبئتها في الجدول بنجاح! ✨`);
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
//  5. Users
// ─────────────────────────────────────────────
async function renderAdminUsers($container) {
  if (!adminCache.users) {
    adminCache.users = (await dbGet('users')) || {};
  }
  const users = Object.values(adminCache.users || {});

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إدارة المستخدمين (${users.length})</h1>
          <div class="dashboard-header__subtitle">التحكم في صلاحيات وحالة حسابات الأعضاء</div>
        </div>
      </div>

      <div class="dashboard-table-wrapper">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>البريد الإلكتروني</th>
              <th>الصلاحية</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <img src="${u.photoURL || './icons/icon-72x72.png'}" style="width:34px;height:34px;border-radius:50%;object-fit:cover" />
                    <strong>${escHtml(u.name || 'مستخدم')}</strong>
                  </div>
                </td>
                <td style="font-size:var(--font-size-sm)">${escHtml(u.email || '')}</td>
                <td>
                  <span class="chip ${u.role === 'admin' || u.role === 'superadmin' ? 'chip--warning' : 'chip--primary'}">
                    ${u.role || 'user'}
                  </span>
                </td>
                <td>${u.status === 'suspended' ? '<span class="badge badge--rejected">موقوف</span>' : '<span class="badge badge--published">نشط</span>'}</td>
                <td>
                  <button class="btn btn-xs ${u.status === 'suspended' ? 'btn-success' : 'btn-danger'}" onclick="toggleUserStatus('${escAttr(u.uid)}', '${u.status === 'suspended' ? 'active' : 'suspended'}')">
                    ${u.status === 'suspended' ? ICONS.check + ' تفعيل' : ICONS.x + ' إيقاف'}
                  </button>
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
//  6. Offers
// ─────────────────────────────────────────────
async function renderAdminOffers($container) {
  if (!adminCache.offers) {
    adminCache.offers = (await dbGet('offers')) || {};
  }
  const offers = Object.entries(adminCache.offers || {}).map(([id, o]) => ({ ...o, _id: id }));

  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إدارة العروض (${offers.length})</h1>
          <div class="dashboard-header__subtitle">مراجعة وحذف عروض الأنشطة التجارية</div>
        </div>
      </div>

      <div class="dashboard-table-wrapper">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>العرض</th>
              <th>المكان</th>
              <th>السعر الجديد</th>
              <th>الحالة</th>
              <th>حذف</th>
            </tr>
          </thead>
          <tbody>
            ${offers.length === 0 ? '<tr><td colspan="5" class="text-center">لا توجد عروض حالياً</td></tr>' : offers.map(o => `
              <tr>
                <td><strong>${escHtml(o.title || '')}</strong></td>
                <td>${escHtml(o.placeName || '')}</td>
                <td><strong>${o.newPrice || 0} ج.م</strong></td>
                <td><span class="badge ${o.status === 'active' ? 'badge--published' : 'badge--pending'}">${o.status || 'active'}</span></td>
                <td>
                  <button class="btn btn-xs btn-danger" onclick="deleteOfferAdmin('${escAttr(o._id)}')">${ICONS.trash} حذف</button>
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
        <label class="form-label">اختر المكان لترويجه كإعلان مدفوع <span class="required">*</span></label>
        <select id="ad-place-id" class="form-select">
          <option value="">-- اختر المكان من القائمة --</option>
          ${placesList.map(p => `
            <option value="${escAttr(p._id)}" data-name="${escAttr(p.name)}" data-slug="${escAttr(p.slug)}" data-img="${escAttr(p.coverImageUrl || p.logoUrl || '')}">
              ${escHtml(p.name)} (${escHtml(p.categoryId || 'عام')} - ${escHtml(p.area || 'المنزلة')})
            </option>
          `).join('')}
        </select>
        <div style="margin-top:10px">
          <label class="form-label">مدة الإعلان (بالأيام) <span class="required">*</span></label>
          <input type="number" id="ad-place-days" class="form-input" value="30" placeholder="عدد الأيام (مثال: 7 أو 30 أو 90)" />
        </div>
        <div class="form-hint">عند اختيار مكان، سيتم منحه شارة "إعلان مدفوع" وإعطائه الأولوية القصوى ليظهر أولاً في كل الصفحات حتى تاريخ انتهاء المدة المحددة.</div>
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
    toast.success(status ? 'تم توثيق المكان وتفعيل العلامة الزرقاء ✓' : 'تم إلغاء التوثيق');
    switchAdminSection(_currentSection, false);
  } catch (err) {
    toast.error('فشلت العملية: ' + err.message);
  }
};

window.transferPlaceOwnershipAdmin = async (placeId) => {
  let place = adminCache.places ? adminCache.places[placeId] : null;
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
            <input type="tel" id="aep-phone" class="form-input" placeholder="010XXXXXXXX" value="${escAttr(place.phone || '')}" />
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

          try {
            await dbUpdate(`places/${placeId}`, updates);

            if (adminCache.places && adminCache.places[placeId]) {
              Object.assign(adminCache.places[placeId], updates);
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
    message: 'هل أنت متأكد من حذف هذا المكان من المنصة؟',
    confirmType: 'danger'
  });
  if (ok) {
    try {
      const place = adminCache.places ? adminCache.places[placeId] : await dbGet(`places/${placeId}`);
      if (place?.slug) await dbRemove(`slugIndex/${place.slug}`);
      await dbRemove(`places/${placeId}`);
      if (adminCache.places) delete adminCache.places[placeId];
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

    toast.success('تم قبول طلب التوثيق وتفعيل العلامة الزرقاء للمكان ✓');
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
