/**
 * المنزلة وناسها — Admin Overview / Dashboard Page
 * Connects directly to /api/admin/dashboard (real parallel SQL aggregation).
 * NEVER converts failed stats into 0.
 */

import { AdminService } from '../services/admin.service.js';
import { renderStatCard } from '../components/stat-card.js';
import { updateSidebarBadge } from '../components/sidebar.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderOverviewPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">لوحة التحكم والمؤشرات</h1>
        <p class="admin-page-desc">مؤشرات الأداء الحية وإحصائيات المنظومة الحقيقية من قاعدة البيانات</p>
      </div>
      <div class="admin-page-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-overview">↻ تحديث المؤشرات</button>
        ${can('places.create') ? `<a href="#place-edit/new" class="btn btn-primary btn-sm">+ إضافة مكان جديد</a>` : ''}
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="admin-stats-grid" id="overview-stats-grid"></div>

    <!-- Secondary Row: Pending Actions & System Health Overview -->
    <div class="admin-dashboard-row">
      <!-- Quick Queue / Attention Card -->
      <div class="admin-card card-half">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🛡️ طلبات وإجراءات تتطلب الانتباه</h2>
        </div>
        <div class="admin-card-body" id="overview-attention-body">
          <div class="skeleton-text" style="height: 100px;"></div>
        </div>
      </div>

      <!-- Live Infrastructure Health Snapshot -->
      <div class="admin-card card-half">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🩺 حالة البنية التحتية والاتصال</h2>
          <a href="#system-health" class="btn btn-outline btn-xs">عرض التفاصيل الكاملة &raquo;</a>
        </div>
        <div class="admin-card-body" id="overview-health-body">
          <div class="skeleton-text" style="height: 100px;"></div>
        </div>
      </div>
    </div>

    <!-- Quick Shortcuts Grid -->
    <div class="admin-card mt-4">
      <div class="admin-card-header">
        <h2 class="admin-card-title">⚡ وصول سريع للإدارة</h2>
      </div>
      <div class="admin-card-body">
        <div class="admin-shortcuts-grid">
          <a href="#places" class="admin-shortcut-btn">
            <span class="sc-icon">🏢</span>
            <span class="sc-label">إدارة الأماكن</span>
            <span class="sc-desc">تعديل ونشر وتوثيق المحلات</span>
          </a>
          <a href="#verification" class="admin-shortcut-btn">
            <span class="sc-icon">🛡️</span>
            <span class="sc-label">طابور التوثيق</span>
            <span class="sc-desc">مراجعة طلبات شارة التوثيق</span>
          </a>
          <a href="#users" class="admin-shortcut-btn">
            <span class="sc-icon">👥</span>
            <span class="sc-label">صلاحيات المستخدمين</span>
            <span class="sc-desc">تعيين الأدوار والحسابات</span>
          </a>
          <a href="#media" class="admin-shortcut-btn">
            <span class="sc-icon">🖼️</span>
            <span class="sc-label">مكتبة R2</span>
            <span class="sc-desc">تصفح ورفع الصور والملفات</span>
          </a>
          <a href="#notifications" class="admin-shortcut-btn">
            <span class="sc-icon">📢</span>
            <span class="sc-label">إرسال إشعار FCM</span>
            <span class="sc-desc">بث إشعار لهواتف المستخدمين</span>
          </a>
          <a href="#audit-logs" class="admin-shortcut-btn">
            <span class="sc-icon">📜</span>
            <span class="sc-label">سجل الرقابة</span>
            <span class="sc-desc">تدقيق عمليات المشرفين</span>
          </a>
        </div>
      </div>
    </div>
  `;

  const refreshBtn = container.querySelector('#btn-refresh-overview');
  refreshBtn.addEventListener('click', () => loadDashboardData(container));

  await loadDashboardData(container);
}

async function loadDashboardData(container) {
  const statsGrid = container.querySelector('#overview-stats-grid');
  const attentionBody = container.querySelector('#overview-attention-body');
  const healthBody = container.querySelector('#overview-health-body');

  // Initial loading skeleton state
  statsGrid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    statsGrid.appendChild(renderStatCard({ isLoading: true }));
  }

  try {
    const data = await AdminService.getDashboard();
    renderStats(statsGrid, data, container);
    renderAttentionCard(attentionBody, data);
    renderHealthSnapshot(healthBody, data?.health);

    // Update pending verification badge in sidebar
    const pendingVerif = data?.verification?.pending || 0;
    updateSidebarBadge('badge-nav-verification', pendingVerif);

  } catch (err) {
    console.error('Dashboard load failed:', err);
    toast.error('تعذر جلب إحصائيات لوحة التحكم من قاعدة البيانات');

    // STRICT ERROR STATE: Render "غير متاح" cards, NEVER 0!
    statsGrid.innerHTML = '';
    const cardsToRender = [
      { id: 'places-total', title: 'إجمالي الأماكن' },
      { id: 'places-verified', title: 'الأماكن الموثقة' },
      { id: 'verification-pending', title: 'طلبات التوثيق المعلقة' },
      { id: 'users-total', title: 'إجمالي المستخدمين' },
      { id: 'reviews-total', title: 'إجمالي التقييمات' },
      { id: 'categories-total', title: 'الأقسام المعتمدة' }
    ];

    cardsToRender.forEach(c => {
      statsGrid.appendChild(renderStatCard({
        id: c.id,
        title: c.title,
        isError: true,
        errorMessage: 'غير متاح',
        onRetry: () => loadDashboardData(container)
      }));
    });

    attentionBody.innerHTML = `
      <div class="alert alert-danger">
        <strong>تعذر استرداد بيانات الطابور</strong>
        <p>${escapeHtml(err.message || 'خطأ في الاتصال بقاعدة البيانات')}</p>
        <button type="button" class="btn btn-sm btn-outline mt-2" onclick="location.reload()">↻ إعادة تحميل الصفحة</button>
      </div>
    `;

    healthBody.innerHTML = `
      <div class="alert alert-warning">
        <strong>حالة الاتصال غير مؤكدة</strong>
        <p>فشل الاستعلام التشخيصي المباشر.</p>
      </div>
    `;
  }
}

function renderStats(container, data, pageContainer) {
  container.innerHTML = '';

  const places = data?.places || {};
  const users = data?.users || {};
  const verif = data?.verification || {};
  const rev = data?.reviews || {};
  const cats = data?.categories || {};
  const prods = data?.products || {};

  const cards = [
    {
      id: 'places-total',
      title: 'إجمالي الأماكن المسجلة',
      value: places.total,
      icon: '🏢',
      subtitle: `${places.published ?? '-'} منشور على الموقع`,
      badge: 'نشط',
      badgeType: 'success'
    },
    {
      id: 'places-verified',
      title: 'الأماكن الموثقة رسمياً',
      value: places.verified,
      icon: '✓',
      subtitle: 'تحمل شارة التوثيق الزرقاء',
      badge: 'موثق',
      badgeType: 'primary'
    },
    {
      id: 'verification-pending',
      title: 'طلبات التوثيق المعلقة',
      value: verif.pending,
      icon: '⏳',
      subtitle: 'تتطلب مراجعة من المشرفين',
      badge: (verif.pending > 0 ? 'يتطلب إجراء' : 'مكتمل'),
      badgeType: (verif.pending > 0 ? 'warning' : 'neutral')
    },
    {
      id: 'users-total',
      title: 'المستخدمين المسجلين',
      value: users.total,
      icon: '👥',
      subtitle: `${users.admins ?? 0} مسؤول ومشرف`,
      badge: 'حقيقي',
      badgeType: 'info'
    },
    {
      id: 'reviews-total',
      title: 'التقييمات والآراء',
      value: rev.total,
      icon: '⭐',
      subtitle: 'تقييمات الزوار للمحلات',
      badge: 'تفاعل',
      badgeType: 'neutral'
    },
    {
      id: 'categories-total',
      title: 'الأقسام والتصنيفات',
      value: cats.total,
      icon: '🗂️',
      subtitle: `${prods.total ?? 0} منتج معروض`,
      badge: 'هيكل',
      badgeType: 'neutral'
    }
  ];

  cards.forEach(c => {
    container.appendChild(renderStatCard({
      ...c,
      onRetry: () => loadDashboardData(pageContainer)
    }));
  });
}

function renderAttentionCard(container, data) {
  const pendingVerif = data?.verification?.pending || 0;
  const pendingPlaces = data?.places?.pending || 0;
  const pendingProds = data?.products?.pending || 0;

  const totalActionNeeded = pendingVerif + pendingPlaces + pendingProds;

  if (totalActionNeeded === 0) {
    container.innerHTML = `
      <div class="attention-all-clear">
        <span class="clear-icon">🎉</span>
        <strong>كافة الطوابير نظيفة!</strong>
        <p>لا توجد طلبات توثيق أو أماكن معلقة تنتظر المراجعة حالياً.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <ul class="attention-list">
      ${pendingVerif > 0 ? `
        <li class="attention-item attention-warning">
          <div class="attention-info">
            <strong>${pendingVerif} طلب توثيق بانتظار البت</strong>
            <small>تحقق من صحة بيانات الأنشطة ومستنداتها</small>
          </div>
          <a href="#verification" class="btn btn-sm btn-warning">مراجعة الآن &raquo;</a>
        </li>
      ` : ''}

      ${pendingPlaces > 0 ? `
        <li class="attention-item attention-info">
          <div class="attention-info">
            <strong>${pendingPlaces} مكان جديد غير منشور</strong>
            <small>بانتظار الموافقة على النشر للجمهور</small>
          </div>
          <a href="#places?status=pending" class="btn btn-sm btn-info">عرض الأماكن &raquo;</a>
        </li>
      ` : ''}

      ${pendingProds > 0 ? `
        <li class="attention-item attention-neutral">
          <div class="attention-info">
            <strong>${pendingProds} منتج/خدمة تتطلب المراجعة</strong>
            <small>منتجات مضافة من أصحاب المحلات</small>
          </div>
          <a href="#products?status=pending" class="btn btn-sm btn-secondary">فحص المنتجات &raquo;</a>
        </li>
      ` : ''}
    </ul>
  `;
}

function renderHealthSnapshot(container, health) {
  if (!health) {
    container.innerHTML = `<p class="text-muted">بيانات الفحص غير متوفرة</p>`;
    return;
  }

  const services = [
    { name: 'قاعدة بيانات Turso (libSQL)', status: health.turso, label: health.turso === 'OPERATIONAL' ? 'تعمل بكفاءة' : 'متعثرة' },
    { name: 'مخزن الوسائط Cloudflare R2', status: health.r2, label: health.r2 === 'OPERATIONAL' ? 'يعمل بكفاءة' : 'متعثر' },
    { name: 'خادم الحوسبة Cloudflare Worker', status: health.worker, label: health.worker === 'OPERATIONAL' ? 'استجابة سريعة' : 'بطيء' },
    { name: 'خدمة إشعارات FCM', status: health.fcm, label: health.fcm === 'OPERATIONAL' ? 'مهيأة' : 'مراجعة المفاتيح' }
  ];

  container.innerHTML = `
    <div class="health-mini-list">
      ${services.map(s => `
        <div class="health-mini-item">
          <div class="health-mini-name">
            <span class="health-dot health-dot-${s.status === 'OPERATIONAL' ? 'ok' : 'err'}"></span>
            <span>${escapeHtml(s.name)}</span>
          </div>
          <span class="health-mini-status badge-${s.status === 'OPERATIONAL' ? 'success' : 'danger'}">${escapeHtml(s.label)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
