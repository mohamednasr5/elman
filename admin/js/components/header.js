/**
 * المنزلة وناسها — Admin Header Component
 */

import { getCurrentAdmin, signOutAdmin } from '../core/auth.js';
import { ROLE_LABELS, ROLE_BADGE_CLASSES } from '../core/permissions.js';
import { AdminService } from '../services/admin.service.js';

export function renderHeader(container) {
  const admin = getCurrentAdmin();
  const role = admin?.role || 'ADMIN';
  const roleLabel = ROLE_LABELS[role] || role;
  const roleBadgeClass = ROLE_BADGE_CLASSES[role] || 'badge-admin';

  container.innerHTML = `
    <header class="admin-header">
      <div class="admin-header-left">
        <button type="button" class="admin-sidebar-toggle" aria-label="تبديل القائمة الجانبية">☰</button>
        <div class="admin-breadcrumbs">
          <span class="breadcrumb-root">لوحة الإدارة</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current" id="admin-breadcrumb-title">الرئيسية</span>
        </div>
      </div>

      <div class="admin-header-center">
        <div class="admin-global-search">
          <span class="search-icon">🔍</span>
          <input type="search" id="admin-global-search-input" placeholder="بحث شامل (مكان، هاتف، مستخدم)..." autocomplete="off"/>
          <div class="admin-search-results-dropdown" id="admin-search-dropdown" style="display:none;"></div>
        </div>
      </div>

      <div class="admin-header-right">
        <!-- Live System Status Pill -->
        <a href="#system-health" class="admin-status-pill status-pill-operational" id="admin-header-status-pill" title="حالة النظام وقاعدة البيانات">
          <span class="status-pulse-dot"></span>
          <span class="status-label">المنظومة تعمل</span>
        </a>

        <!-- Admin Profile Dropdown -->
        <div class="admin-profile-menu">
          <button type="button" class="admin-profile-btn" id="admin-profile-trigger">
            <div class="admin-avatar">
              ${admin?.photoURL ? `<img src="${admin.photoURL}" alt="${admin.displayName || ''}"/>` : `<span>${(admin?.displayName || admin?.email || 'A')[0].toUpperCase()}</span>`}
            </div>
            <div class="admin-info-inline">
              <span class="admin-name">${admin?.displayName || admin?.email?.split('@')[0] || 'المسؤول'}</span>
              <span class="admin-role-badge ${roleBadgeClass}">${roleLabel}</span>
            </div>
            <span class="profile-arrow">▾</span>
          </button>

          <div class="admin-profile-dropdown" id="admin-profile-menu-dropdown" style="display:none;">
            <div class="dropdown-header">
              <strong>${admin?.displayName || 'المسؤول'}</strong>
              <small>${admin?.email || ''}</small>
              <div class="dropdown-role-tag ${roleBadgeClass}">${roleLabel}</div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="#settings" class="dropdown-item">⚙ إعدادات المنظومة</a>
            <a href="#system-health" class="dropdown-item">🩺 فحص صحة الخوادم</a>
            <a href="#audit-logs" class="dropdown-item">📋 سجل العمليات</a>
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-item text-danger" id="admin-btn-logout">🚪 تسجيل الخروج</button>
          </div>
        </div>
      </div>
    </header>
  `;

  // Sidebar toggle
  const toggleBtn = container.querySelector('.admin-sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('admin-sidebar-open');
  });

  // Profile dropdown toggle
  const profileTrigger = container.querySelector('#admin-profile-trigger');
  const profileDropdown = container.querySelector('#admin-profile-menu-dropdown');
  profileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = profileDropdown.style.display === 'block';
    profileDropdown.style.display = isShown ? 'none' : 'block';
  });

  document.addEventListener('click', () => {
    if (profileDropdown) profileDropdown.style.display = 'none';
  });

  // Logout button
  const logoutBtn = container.querySelector('#admin-btn-logout');
  logoutBtn.addEventListener('click', async () => {
    await signOutAdmin();
    window.location.reload();
  });

  // Setup Global Search Debouncing
  const searchInput = container.querySelector('#admin-global-search-input');
  const searchDropdown = container.querySelector('#admin-search-dropdown');
  let searchTimer = null;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length < 2) {
      searchDropdown.style.display = 'none';
      return;
    }

    searchTimer = setTimeout(async () => {
      try {
        const res = await AdminService.globalSearch(q);
        renderSearchResults(searchDropdown, res, q);
      } catch (err) {
        console.error('Global search error:', err);
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.style.display = 'none';
    }
  });

  // Initial Health Check
  checkSystemStatus(container.querySelector('#admin-header-status-pill'));
}

async function checkSystemStatus(pillEl) {
  if (!pillEl) return;
  try {
    const health = await AdminService.getSystemHealth();
    if (health.status === 'DEGRADED') {
      pillEl.className = 'admin-status-pill status-pill-degraded';
      pillEl.querySelector('.status-label').textContent = 'أداء منخفض';
    } else if (health.status === 'OUTAGE') {
      pillEl.className = 'admin-status-pill status-pill-outage';
      pillEl.querySelector('.status-label').textContent = 'عطل في بعض الخدمات';
    } else {
      pillEl.className = 'admin-status-pill status-pill-operational';
      pillEl.querySelector('.status-label').textContent = 'المنظومة تعمل';
    }
  } catch (_) {
    pillEl.className = 'admin-status-pill status-pill-degraded';
    pillEl.querySelector('.status-label').textContent = 'حالة غير مؤكدة';
  }
}

function renderSearchResults(dropdown, data, query) {
  const places = data?.places || [];
  const users = data?.users || [];

  if (places.length === 0 && users.length === 0) {
    dropdown.innerHTML = `<div class="search-no-results">لا توجد نتائج مطابقة لـ "${escapeHtml(query)}"</div>`;
    dropdown.style.display = 'block';
    return;
  }

  let html = '';

  if (places.length > 0) {
    html += `<div class="search-category-title">🏢 الأماكن والأنشطة (${places.length})</div>`;
    places.slice(0, 5).forEach(p => {
      html += `
        <a href="#place-edit/${p.id}" class="search-result-item" onclick="document.getElementById('admin-search-dropdown').style.display='none'">
          <div class="result-item-main">
            <strong>${escapeHtml(p.name)}</strong>
            <small>${escapeHtml(p.category || '')} • ${escapeHtml(p.address || '')}</small>
          </div>
          ${p.is_verified ? '<span class="badge-verified-tiny">موثق ✓</span>' : ''}
        </a>
      `;
    });
  }

  if (users.length > 0) {
    html += `<div class="search-category-title">👥 المستخدمين (${users.length})</div>`;
    users.slice(0, 5).forEach(u => {
      html += `
        <a href="#users?q=${encodeURIComponent(u.email || u.id)}" class="search-result-item" onclick="document.getElementById('admin-search-dropdown').style.display='none'">
          <div class="result-item-main">
            <strong>${escapeHtml(u.name || u.email || u.id)}</strong>
            <small>${escapeHtml(u.email || '')}</small>
          </div>
          <span class="badge-role-tiny">${escapeHtml(u.role || 'USER')}</span>
        </a>
      `;
    });
  }

  dropdown.innerHTML = html;
  dropdown.style.display = 'block';
}

export function updateBreadcrumb(title) {
  const el = document.getElementById('admin-breadcrumb-title');
  if (el) el.textContent = title;
  document.title = `${title} — لوحة إدارة دليل المنزلة والمطرية`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
