import { dbGet, dbSet, dbUpdate, dbRemove, dbPush, serverTimestamp, getSettings, getCategories } from '../../core/db.js';
import { isAdmin } from '../../core/auth.js';
import { renderStatusBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../../utils/date.js';

function svgIcon(path, opts = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${opts}>${path}</svg>`;
}
const ICONS = {
  chart: svgIcon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  pin: svgIcon('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  shield: svgIcon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  folder: svgIcon('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
  users: svgIcon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  tag: svgIcon('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
  megaphone: svgIcon('<path d="m3 11 19-9-9 19-2-8-8-2z"/>'),
  cog: svgIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  home: svgIcon('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  globe: svgIcon('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  trash: svgIcon('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  edit: svgIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  eye: svgIcon('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  check: svgIcon('<polyline points="20 6 9 17 4 12"/>'),
  x: svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  plus: svgIcon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  star: svgIcon('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>')
};

export async function renderAdmin() {
  const container = document.getElementById('app');
  if (!container) return;
  
  if (!isAdmin()) {
    window.location.href = 'index.html';
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section') || 'dashboard';

  let contentHtml = '';
  try {
    if (section === 'dashboard') contentHtml = await renderDashboard();
    else if (section === 'verification') contentHtml = await renderVerification();
    else if (section === 'places') contentHtml = await renderPlaces();
    else if (section === 'settings') contentHtml = await renderSettings();
    else contentHtml = `<h2>القسم غير موجود</h2>`;
  } catch (e) {
    contentHtml = `<div class="error-msg">حدث خطأ: ${escHtml(e.message)}</div>`;
  }

  container.innerHTML = `
    <div class="admin-layout admin-fade-in">
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h3>لوحة الإدارة</h3>
        </div>
        <nav class="sidebar-nav">
          <a href="admin.html?section=dashboard" class="dashboard-nav-item ${section === 'dashboard' ? 'active' : ''}">
            ${ICONS.chart} الرئيسية
          </a>
          <a href="admin.html?section=verification" class="dashboard-nav-item ${section === 'verification' ? 'active' : ''}">
            ${ICONS.shield} طلبات التوثيق
          </a>
          <a href="admin.html?section=places" class="dashboard-nav-item ${section === 'places' ? 'active' : ''}">
            ${ICONS.pin} الأماكن
          </a>
          <a href="admin.html?section=settings" class="dashboard-nav-item ${section === 'settings' ? 'active' : ''}">
            ${ICONS.cog} الإعدادات
          </a>
        </nav>
      </aside>
      <main class="admin-content">
        ${contentHtml}
      </main>
    </div>
  `;

  if (section === 'places') bindPlacesEvents();
  if (section === 'settings') bindSettingsEvents();
  if (section === 'verification') bindVerificationEvents();
}

async function renderDashboard() {
  const placesMap = await dbGet('places') || {};
  const places = Object.values(placesMap);
  const usersMap = await dbGet('users') || {};
  const users = Object.values(usersMap);
  const verificationMap = await dbGet('verification_requests') || {};
  const verifications = Object.values(verificationMap);
  const pendingVerifications = verifications.filter(v => v.status === 'pending').length;
  
  return `
    <h2>إحصائيات عامة</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">${ICONS.pin}</div>
        <div class="stat-info">
          <h4>الأماكن</h4>
          <p>${places.length}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">${ICONS.users}</div>
        <div class="stat-info">
          <h4>المستخدمين</h4>
          <p>${users.length}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">${ICONS.shield}</div>
        <div class="stat-info">
          <h4>طلبات توثيق جديدة</h4>
          <p>${pendingVerifications}</p>
        </div>
      </div>
    </div>
  `;
}

async function renderVerification() {
  const reqsMap = await dbGet('verification_requests') || {};
  const reqs = Object.entries(reqsMap).map(([id, req]) => ({ id, ...req }));
  reqs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (!reqs.length) {
    return `<h2>طلبات التوثيق</h2><p>لا توجد طلبات حالياً.</p>`;
  }

  let rows = '';
  for (const req of reqs) {
    rows += `
      <tr>
        <td>${escHtml(req.placeName || 'غير معروف')}</td>
        <td>${escHtml(req.ownerName || req.userId)}</td>
        <td>${escHtml(req.status)}</td>
        <td>${req.verifiedUntil ? formatDate(req.verifiedUntil) : '-'}</td>
        <td>
          ${req.status === 'pending' ? `
            <button class="btn btn-sm btn-success" onclick="window.approveVerification('${escAttr(req.id)}', '${escAttr(req.placeId)}')">موافقة</button>
            <button class="btn btn-sm btn-danger" onclick="window.rejectVerification('${escAttr(req.id)}')">رفض</button>
          ` : ''}
        </td>
      </tr>
    `;
  }

  return `
    <h2>طلبات التوثيق</h2>
    <div class="table-responsive">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>المكان</th>
            <th>صاحب الطلب</th>
            <th>الحالة</th>
            <th>صالح حتى</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function bindVerificationEvents() {
  window.approveVerification = async (reqId, placeId) => {
    const months = prompt("أدخل عدد الأشهر للتوثيق (مثال: 12):", "12");
    if (!months || isNaN(months) || months <= 0) return;
    
    const d = new Date();
    d.setMonth(d.getMonth() + parseInt(months));
    const verifiedUntil = d.getTime();

    try {
      await dbUpdate(`verification_requests/${reqId}`, {
        status: 'approved',
        verifiedUntil,
        updatedAt: serverTimestamp()
      });
      if (placeId) {
        await dbUpdate(`places/${placeId}`, {
          isVerified: true,
          verifiedUntil
        });
      }
      toast('تم الموافقة على التوثيق', 'success');
      location.reload();
    } catch (e) {
      toast('حدث خطأ', 'error');
    }
  };

  window.rejectVerification = async (reqId) => {
    if (!confirm('هل أنت متأكد من رفض الطلب؟')) return;
    try {
      await dbUpdate(`verification_requests/${reqId}`, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      toast('تم رفض الطلب', 'success');
      location.reload();
    } catch (e) {
      toast('حدث خطأ', 'error');
    }
  };
}

async function renderPlaces() {
  const placesMap = await dbGet('places') || {};
  let places = Object.entries(placesMap).map(([id, p]) => ({ id, ...p }));
  
  return `
    <h2>الأماكن</h2>
    <input type="text" id="adminPlaceSearch" placeholder="بحث في الأماكن..." class="form-control" style="margin-bottom: 15px;">
    <div class="table-responsive">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>القسم</th>
            <th>موثق</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody id="adminPlacesTbody">
        </tbody>
      </table>
    </div>
  `;
}

function bindPlacesEvents() {
  const searchInput = document.getElementById('adminPlaceSearch');
  const tbody = document.getElementById('adminPlacesTbody');
  
  const loadPlaces = async () => {
    const placesMap = await dbGet('places') || {};
    window.allAdminPlaces = Object.entries(placesMap).map(([id, p]) => ({ id, ...p }));
    renderTable(window.allAdminPlaces);
  };

  const renderTable = (list) => {
    if(!tbody) return;
    tbody.innerHTML = list.map(p => `
      <tr>
        <td>${escHtml(p.name)}</td>
        <td>${escHtml(p.category)}</td>
        <td>${p.isVerified ? 'نعم' : 'لا'}</td>
        <td>
          <a class="btn btn-sm btn-primary" href="place.html?id=${escAttr(p.id)}" target="_blank">${ICONS.eye}</a>
          <button class="btn btn-sm ${p.isVerified ? 'btn-warning' : 'btn-success'}" onclick="window.toggleVerifyPlace('${escAttr(p.id)}', ${p.isVerified})">
            ${p.isVerified ? 'إلغاء التوثيق' : 'توثيق'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="window.deletePlace('${escAttr(p.id)}')">${ICONS.trash}</button>
        </td>
      </tr>
    `).join('');
  };

  if(searchInput && tbody) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = window.allAdminPlaces.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
      renderTable(filtered);
    });
    loadPlaces();
  }

  window.toggleVerifyPlace = async (id, isVerified) => {
    if (!confirm(isVerified ? 'إلغاء التوثيق؟' : 'توثيق هذا المكان؟')) return;
    try {
      await dbUpdate(`places/${id}`, {
        isVerified: !isVerified,
        verifiedUntil: !isVerified ? (new Date().setFullYear(new Date().getFullYear() + 1)) : null
      });
      toast('تم التحديث', 'success');
      loadPlaces();
    } catch(e) { toast('خطأ', 'error'); }
  };

  window.deletePlace = async (id) => {
    if (!confirm('حذف هذا المكان نهائياً؟')) return;
    try {
      await dbRemove(`places/${id}`);
      toast('تم الحذف', 'success');
      loadPlaces();
    } catch(e) { toast('خطأ', 'error'); }
  };
}

async function renderSettings() {
  const settings = await getSettings() || {};
  return `
    <h2>الإعدادات</h2>
    <form id="adminSettingsForm" class="form-section">
      <div class="form-group">
        <label>اسم الموقع</label>
        <input type="text" id="siteName" class="form-control" value="${escAttr(settings.siteName || 'المنزلة وناسها')}">
      </div>
      <div class="form-group">
        <label>وصف الموقع</label>
        <textarea id="siteDesc" class="form-control">${escHtml(settings.siteDesc || '')}</textarea>
      </div>
      <button type="submit" class="btn btn-primary">حفظ الإعدادات</button>
    </form>
  `;
}

function bindSettingsEvents() {
  const form = document.getElementById('adminSettingsForm');
  if(!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('loading');
    try {
      const name = document.getElementById('siteName').value;
      const desc = document.getElementById('siteDesc').value;
      await dbUpdate('settings/site', { siteName: name, siteDesc: desc, updatedAt: serverTimestamp() });
      toast('تم حفظ الإعدادات', 'success');
    } catch(e) {
      toast('حدث خطأ', 'error');
    } finally {
      btn.classList.remove('loading');
    }
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
