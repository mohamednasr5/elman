/**
 * المنزلة وناسها — Admin Control Panel (Instant SPA + Sponsored Ads Edition)
 * Zero-latency navigation, in-memory caching, responsive mobile bottom-bar,
 * and complete Sponsored Place / Paid Ad priority controls.
 */

import { dbGet, dbSet, dbUpdate, dbRemove, dbPush, serverTimestamp, getSettings, getCategories } from '../../core/db.js';
import { isAdmin } from '../../core/auth.js';
import { renderStatusBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../../utils/date.js';

// ── In-Memory Cache Store for 0ms Tab Switching ──
const adminCache = {
  users: null,
  places: null,
  offers: null,
  ads: null,
  verificationRequests: null,
  categoryRequests: null,
  categories: null,
  settings: null,
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
  document.querySelectorAll('#admin-mobile-bottom-nav .bottom-nav__item[data-admin-sec]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-admin-sec') === sectionName);
  });

  try {
    if      (sectionName === 'overview')      await renderAdminOverview($main);
    else if (sectionName === 'places')        await renderAdminPlaces($main);
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
    const q = e.target.value.toLowerCase();
    const filtered = places.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.area || '').toLowerCase().includes(q) ||
      (p.categoryId || '').toLowerCase().includes(q)
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

    return `
      <tr>
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
        <td>${renderStatusBadge(p.status || 'published')}</td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
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
            <input type="text" id="s-desc" class="form-input" value="${escAttr(settings.general?.siteDescription || 'دليل المنزلة الرقمي — الأماكن، المحلات، الأطباء، العروض، والخدمات')}" />
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

  const areas = [
    'المنزلة (المدينة)', 'الأحمدية', 'العزيزة', 'البصراط', 'الفروسات', 'النسايمة', 
    'ميت شرف', 'الشبول', 'ميت مرجا سلسيل', 'ميت سلسيل', 'الجمالية', 'الروضة', 'منطقة أخرى'
  ];

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
            <label class="form-label">المنطقة / القرية</label>
            <select id="aep-area" class="form-select">
              ${areas.map(a => `<option value="${escAttr(a)}" ${(place.area === a || (!place.area && a.includes('المدينة'))) ? 'selected' : ''}>${a}</option>`).join('')}
            </select>
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
            area: document.getElementById('aep-area')?.value || 'المنزلة',
            deliveryType: document.getElementById('aep-deliveryType')?.value || null,
            address: document.getElementById('aep-address')?.value.trim() || '',
            mapsLink: document.getElementById('aep-mapsLink')?.value.trim() || '',
            coverImageUrl: document.getElementById('aep-coverImageUrl')?.value.trim() || '',
            logoUrl: document.getElementById('aep-logoUrl')?.value.trim() || '',
            status: document.getElementById('aep-status')?.value || 'published',
            isVerified: document.getElementById('aep-isVerified')?.value === 'true',
            description: document.getElementById('aep-description')?.value.trim() || '',
            services: servicesArr,
            updatedAt: serverTimestamp()
          };

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

// ── Utils ──
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
