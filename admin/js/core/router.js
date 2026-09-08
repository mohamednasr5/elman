/**
 * المنزلة وناسها — Admin SPA Router & App Bootstrap
 */

import { initAdminAuth, waitForAuth, getCurrentAdmin, signInWithGoogle, signOutAdmin, can } from './auth.js';
import { renderHeader, updateBreadcrumb } from '../components/header.js';
import { renderSidebar, setActiveNavLink, updateSidebarBadge } from '../components/sidebar.js';
import { toast } from '../components/toast.js';

// Page Imports
import { renderOverviewPage } from '../pages/overview.page.js';
import { renderPlacesPage } from '../pages/places.page.js';
import { renderPlaceEditPage } from '../pages/place-edit.page.js';
import { renderVerificationPage } from '../pages/verification.page.js';
import { renderCategoriesPage } from '../pages/categories.page.js';
import { renderUsersPage } from '../pages/users.page.js';
import { renderReviewsPage } from '../pages/reviews.page.js';
import { renderProductsPage } from '../pages/products.page.js';
import { renderMediaPage } from '../pages/media.page.js';
import { renderNotificationsPage } from '../pages/notifications.page.js';
import { renderAuditLogsPage } from '../pages/audit-logs.page.js';
import { renderSystemHealthPage } from '../pages/system-health.page.js';
import { renderSecurityPage } from '../pages/security.page.js';
import { renderSettingsPage } from '../pages/settings.page.js';

const ROUTES = {
  'overview': { title: 'لوحة المؤشرات', handler: renderOverviewPage, perm: 'dashboard.read' },
  'places': { title: 'إدارة الأماكن', handler: renderPlacesPage, perm: 'places.read' },
  'place-edit': { title: 'بيانات المكان', handler: renderPlaceEditPage, perm: 'places.read' },
  'verification': { title: 'طابور التوثيق', handler: renderVerificationPage, perm: 'verification.read' },
  'categories': { title: 'الأقسام والتصنيفات', handler: renderCategoriesPage, perm: 'categories.read' },
  'users': { title: 'المستخدمين والصلاحيات', handler: renderUsersPage, perm: 'users.read' },
  'reviews': { title: 'التقييمات والآراء', handler: renderReviewsPage, perm: 'reviews.read' },
  'products': { title: 'المنتجات والخدمات', handler: renderProductsPage, perm: 'products.read' },
  'media': { title: 'مكتبة الوسائط R2', handler: renderMediaPage, perm: 'media.read' },
  'notifications': { title: 'إرسال إشعارات FCM', handler: renderNotificationsPage, perm: 'notifications.send' },
  'audit-logs': { title: 'سجل العمليات', handler: renderAuditLogsPage, perm: 'audit.read' },
  'system-health': { title: 'صحة النظام والخدمات', handler: renderSystemHealthPage, perm: 'system.read' },
  'security': { title: 'جدار الحماية والحظر', handler: renderSecurityPage, perm: 'security.read' },
  'settings': { title: 'إعدادات المنظومة', handler: renderSettingsPage, perm: 'settings.read' }
};

let _headerMounted = false;
let _sidebarMounted = false;

export async function initAdminApp() {
  const root = document.getElementById('admin-app-root');
  if (!root) return;

  // Initial loading view
  root.innerHTML = `
    <div class="admin-auth-loading">
      <div class="spinner spinner-lg"></div>
      <p class="mt-3">جاري التحقق من جلسة المسؤول وتصاريح الإدارة...</p>
    </div>
  `;

  try {
    await initAdminAuth();
    const admin = getCurrentAdmin();

    if (!admin) {
      renderLoginScreen(root);
      return;
    }

    // Verify if user is an admin or staff
    mountAdminShell(root);
  } catch (err) {
    console.error('App init error:', err);
    renderLoginScreen(root, err.message);
  }
}

function renderLoginScreen(root, errorMessage = '') {
  root.innerHTML = `
    <div class="admin-login-screen">
      <div class="admin-login-card">
        <div class="login-brand">
          <span class="login-logo">🏛️</span>
          <h1>دليل المنزلة والمطرية</h1>
          <p>لوحة التحكم والإدارة المستقلة v2</p>
        </div>

        ${errorMessage ? `
          <div class="alert alert-danger mb-3">
            <strong>تعذر التحقق من الدخول:</strong>
            <p>${escapeHtml(errorMessage)}</p>
          </div>
        ` : ''}

        <div class="login-instructions">
          <p>هذه البوابة مخصصة حصراً للمشرفين والمسؤولين المعتمدين لإدارة المنظومة.</p>
        </div>

        <button type="button" class="btn-google-login" id="btn-admin-google-login">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>تسجيل الدخول بحساب Google المعتمد</span>
        </button>

        <div class="login-footer">
          <a href="../index.html">العودة إلى الموقع العام للدليل &raquo;</a>
        </div>
      </div>
    </div>
  `;

  const loginBtn = root.querySelector('#btn-admin-google-login');
  loginBtn.addEventListener('click', async () => {
    loginBtn.disabled = true;
    loginBtn.innerHTML = 'جاري التحقق من الحساب...';
    try {
      await signInWithGoogle();
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'فشل تسجيل الدخول بواسطة Google');
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>تسجيل الدخول بحساب Google المعتمد</span>';
    }
  });
}

function mountAdminShell(root) {
  root.innerHTML = `
    <div class="admin-shell-layout">
      <!-- Sidebar Slot -->
      <div id="admin-sidebar-slot"></div>

      <!-- Main Layout -->
      <div class="admin-main-wrapper">
        <!-- Header Slot -->
        <div id="admin-header-slot"></div>

        <!-- Dynamic Content Slot -->
        <main class="admin-page-container" id="admin-page-content" role="main">
          <div class="spinner"></div>
        </main>
      </div>
    </div>
  `;

  const sidebarSlot = root.querySelector('#admin-sidebar-slot');
  const headerSlot = root.querySelector('#admin-header-slot');

  renderSidebar(sidebarSlot);
  renderHeader(headerSlot);

  // Setup hash router
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

async function handleRoute() {
  const content = document.getElementById('admin-page-content');
  if (!content) return;

  const rawHash = window.location.hash.replace(/^#\/?/, '') || 'overview';
  const parts = rawHash.split('/');
  const routeKey = parts[0] || 'overview';
  const routeParam = parts[1] || null;

  const routeConfig = ROUTES[routeKey];

  if (!routeConfig) {
    content.innerHTML = `
      <div class="admin-card text-center p-5">
        <h2 class="text-danger">الصفحة غير موجودة (404)</h2>
        <p class="text-muted">المسار <code>#${escapeHtml(rawHash)}</code> غير صالح في لوحة الإدارة.</p>
        <a href="#overview" class="btn btn-primary mt-3">العودة للوحة المؤشرات</a>
      </div>
    `;
    updateBreadcrumb('404 غير موجود');
    return;
  }

  // RBAC Permission Check
  if (routeConfig.perm && !can(routeConfig.perm)) {
    content.innerHTML = `
      <div class="admin-card text-center p-5">
        <h2 class="text-warning">غير مصرح بالوصول (403 Forbidden)</h2>
        <p class="text-muted">حسابك لا يمتلك الصلاحية المطلوبة [<code>${escapeHtml(routeConfig.perm)}</code>] لفتح هذا القسم.</p>
        <a href="#overview" class="btn btn-primary mt-3">العودة للصفحة الرئيسية</a>
      </div>
    `;
    updateBreadcrumb('غير مصرح');
    return;
  }

  // Update UI state
  updateBreadcrumb(routeConfig.title);
  setActiveNavLink(routeKey);

  // Show skeleton loading
  content.innerHTML = `
    <div class="admin-page-loading">
      <div class="spinner"></div>
      <p class="mt-2 text-muted">جاري تحميل ${escapeHtml(routeConfig.title)}...</p>
    </div>
  `;

  try {
    await routeConfig.handler(content, routeParam);
  } catch (err) {
    console.error(`Route error for #${rawHash}:`, err);
    content.innerHTML = `
      <div class="alert alert-danger p-4">
        <h3>تعذر تحميل الصفحة</h3>
        <p>${escapeHtml(err.message || 'حدث خطأ غير متوقع أثناء معالجة الصفحة')}</p>
        <button type="button" class="btn btn-warning btn-sm mt-3" onclick="location.reload()">↻ إعادة المحاولة</button>
      </div>
    `;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
