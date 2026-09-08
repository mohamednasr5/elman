/**
 * المنزلة وناسها — Admin Places Management Page
 * Production-grade server-side pagination, advanced filtering, and bulk operations.
 */

import { AdminService } from '../services/admin.service.js';
import { DataTable } from '../components/datatable.js';
import { confirmModal, showModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderPlacesPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">إدارة الأماكن والأنشطة</h1>
        <p class="admin-page-desc">تصفح وتعديل ومراقبة جميع المحلات والأنشطة المسجلة في الدليل</p>
      </div>
      <div class="admin-page-actions">
        ${can('places.create') ? `<a href="#place-edit/new" class="btn btn-primary">+ إضافة مكان جديد</a>` : ''}
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="admin-filters-card mb-3">
      <div class="filter-group">
        <label>التصنيف:</label>
        <select id="filter-category" class="form-select">
          <option value="">جميع التصنيفات</option>
        </select>
      </div>
      <div class="filter-group">
        <label>حالة التوثيق:</label>
        <select id="filter-verified" class="form-select">
          <option value="">الكل</option>
          <option value="1">موثق رسمياً فقط</option>
          <option value="0">غير موثق</option>
        </select>
      </div>
      <div class="filter-group">
        <label>حالة النشر:</label>
        <select id="filter-status" class="form-select">
          <option value="">جميع الحالات</option>
          <option value="active">نشط ومنشور</option>
          <option value="pending">بانتظار المراجعة</option>
          <option value="suspended">موقوف مؤقتاً</option>
        </select>
      </div>
    </div>

    <!-- Main DataTable Container -->
    <div class="admin-card">
      <div id="places-datatable-container"></div>
    </div>
  `;

  // Populate categories filter
  try {
    const cats = await AdminService.getCategories();
    const catSelect = container.querySelector('#filter-category');
    if (Array.isArray(cats)) {
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name || c.id;
        opt.textContent = c.name;
        catSelect.appendChild(opt);
      });
    }
  } catch (e) {
    console.error('Failed to load categories for filter:', e);
  }

  // Setup DataTable
  const tableContainer = container.querySelector('#places-datatable-container');
  let table = null;

  const columns = [
    {
      key: 'name',
      label: 'المكان / النشاط',
      sortable: true,
      render: (val, row) => {
        const img = row.image || row.logo || '../icons/icon-96x96.png';
        return `
          <div class="cell-place-identity">
            <img src="${escapeHtml(img)}" class="cell-place-thumb" alt="${escapeHtml(val || '')}" onerror="this.src='../icons/icon-96x96.png'"/>
            <div class="cell-place-meta">
              <strong>${escapeHtml(val || 'بدون اسم')}</strong>
              <small class="text-muted">${escapeHtml(row.address || 'العنوان غير محدد')}</small>
            </div>
          </div>
        `;
      }
    },
    {
      key: 'category',
      label: 'القسم',
      sortable: true,
      render: (val, row) => `
        <span class="badge badge-neutral">${escapeHtml(val || 'عام')}</span>
        ${row.subcategory ? `<small class="text-muted d-block">${escapeHtml(row.subcategory)}</small>` : ''}
      `
    },
    {
      key: 'phone',
      label: 'الاتصال',
      render: (val) => val ? `<a href="tel:${escapeHtml(val)}" dir="ltr" class="cell-phone">${escapeHtml(val)}</a>` : '<span class="text-muted">-</span>'
    },
    {
      key: 'is_verified',
      label: 'التوثيق',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const isVer = val === 1 || val === true || val === '1';
        return `
          <button type="button" class="badge-toggle ${isVer ? 'badge-verified' : 'badge-unverified'} btn-toggle-verify" data-id="${row.id}" data-verified="${isVer ? '1' : '0'}" title="انقر لتغيير حالة التوثيق">
            ${isVer ? '✓ موثق' : '✕ غير موثق'}
          </button>
        `;
      }
    },
    {
      key: 'is_published',
      label: 'النشر',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const isPub = val === 1 || val === true || val === '1';
        return `
          <button type="button" class="badge-toggle ${isPub ? 'badge-success' : 'badge-warning'} btn-toggle-publish" data-id="${row.id}" data-published="${isPub ? '1' : '0'}" title="انقر للتبديل">
            ${isPub ? 'منشور' : 'مسودة'}
          </button>
        `;
      }
    },
    {
      key: 'views',
      label: 'المشاهدات',
      sortable: true,
      align: 'center',
      render: (val) => `<span class="cell-views">${(val || 0).toLocaleString('ar-EG')}</span>`
    },
    {
      key: 'actions',
      label: 'إجراءات',
      align: 'left',
      render: (_, row) => `
        <div class="table-actions-cell">
          <a href="#place-edit/${row.id}" class="btn-action btn-action-edit" title="تعديل بيانات المكان">✏ تعديل</a>
          <a href="../place.html?id=${row.id}" target="_blank" class="btn-action btn-action-view" title="معاينة في الموقع العام">👁 معاينة</a>
          ${can('places.delete') ? `<button type="button" class="btn-action btn-action-delete text-danger" data-id="${row.id}" data-name="${escapeHtml(row.name || '')}" title="حذف المكان">🗑</button>` : ''}
        </div>
      `
    }
  ];

  const bulkActions = [];
  if (can('places.verify')) {
    bulkActions.push({
      label: '✓ توثيق المحدد',
      variant: 'primary',
      action: async (ids) => {
        const ok = await confirmModal({
          title: 'توثيق الأماكن المحددة',
          message: `هل أنت متأكد من منح شارة التوثيق لـ (${ids.length}) مكان محدد؟`,
          variant: 'primary'
        });
        if (!ok) return;
        await AdminService.bulkPlacesAction('verify', ids);
        toast.success(`تم توثيق ${ids.length} مكان بنجاح`);
      }
    });

    bulkActions.push({
      label: '✕ إلغاء توثيق المحدد',
      variant: 'secondary',
      action: async (ids) => {
        const ok = await confirmModal({
          title: 'إلغاء توثيق الأماكن المحددة',
          message: `هل أنت متأكد من إلغاء توثيق (${ids.length}) مكان محدد؟`,
          variant: 'warning'
        });
        if (!ok) return;
        await AdminService.bulkPlacesAction('unverify', ids);
        toast.success(`تم إلغاء توثيق ${ids.length} مكان`);
      }
    });
  }

  if (can('places.publish')) {
    bulkActions.push({
      label: 'نشر المحدد',
      variant: 'success',
      action: async (ids) => {
        await AdminService.bulkPlacesAction('publish', ids);
        toast.success(`تم نشر ${ids.length} مكان بنجاح`);
      }
    });

    bulkActions.push({
      label: 'إيقاف نشر المحدد',
      variant: 'warning',
      action: async (ids) => {
        await AdminService.bulkPlacesAction('unpublish', ids);
        toast.warning(`تم إيقاف نشر ${ids.length} مكان`);
      }
    });
  }

  if (can('places.delete')) {
    bulkActions.push({
      label: '🗑 حذف المحدد',
      variant: 'danger',
      action: async (ids) => {
        const ok = await confirmModal({
          title: 'حذف الأماكن المحددة نهائياً',
          message: `تحذير: سيتم حذف (${ids.length}) مكان نهائياً من قاعدة البيانات مع المنتجات والتقييمات التابعة لهم. هل تريد المتابعة؟`,
          confirmText: 'نعم، احذف نهائياً',
          variant: 'danger'
        });
        if (!ok) return;
        await AdminService.bulkPlacesAction('delete', ids);
        toast.success(`تم حذف ${ids.length} مكان نهائياً`);
      }
    });
  }

  table = new DataTable({
    container: tableContainer,
    columns,
    bulkActions,
    defaultSort: 'created_at',
    defaultOrder: 'DESC',
    defaultLimit: 25,
    searchPlaceholder: 'بحث بالاسم، العنوان، الهاتف...',
    fetchData: async ({ page, limit, search, sort, order, filters }) => {
      const params = {
        page,
        limit,
        search,
        sort,
        order,
        category: filters.category || undefined,
        verified: filters.verified !== '' ? filters.verified : undefined,
        status: filters.status || undefined
      };
      return await AdminService.getPlaces(params);
    }
  });

  // Attach filter change listeners
  const catFilter = container.querySelector('#filter-category');
  const verFilter = container.querySelector('#filter-verified');
  const statusFilter = container.querySelector('#filter-status');

  const onFilterChange = () => {
    table.setFilters({
      category: catFilter.value,
      verified: verFilter.value,
      status: statusFilter.value
    });
  };

  catFilter.addEventListener('change', onFilterChange);
  verFilter.addEventListener('change', onFilterChange);
  statusFilter.addEventListener('change', onFilterChange);

  // Table Delegation for Inline Action Clicks (Verify toggle, Publish toggle, Delete)
  tableContainer.addEventListener('click', async (e) => {
    // 1. Verify toggle button
    const verifyBtn = e.target.closest('.btn-toggle-verify');
    if (verifyBtn && can('places.verify')) {
      const id = verifyBtn.getAttribute('data-id');
      const current = verifyBtn.getAttribute('data-verified') === '1';
      const targetState = !current;
      verifyBtn.disabled = true;
      try {
        await AdminService.verifyPlace(id, targetState, targetState ? 'توثيق من جدول الأماكن' : 'إلغاء توثيق');
        toast.success(targetState ? 'تم توثيق المكان بنجاح' : 'تم إلغاء التوثيق');
        table.refresh();
      } catch (err) {
        toast.error(err.message || 'فشل تغيير حالة التوثيق');
        verifyBtn.disabled = false;
      }
      return;
    }

    // 2. Publish toggle button
    const pubBtn = e.target.closest('.btn-toggle-publish');
    if (pubBtn && can('places.publish')) {
      const id = pubBtn.getAttribute('data-id');
      const current = pubBtn.getAttribute('data-published') === '1';
      const targetState = !current;
      pubBtn.disabled = true;
      try {
        await AdminService.publishPlace(id, targetState);
        toast.success(targetState ? 'تم نشر المكان' : 'تم تعليق النشر');
        table.refresh();
      } catch (err) {
        toast.error(err.message || 'فشل تغيير حالة النشر');
        pubBtn.disabled = false;
      }
      return;
    }

    // 3. Delete single place button
    const deleteBtn = e.target.closest('.btn-action-delete');
    if (deleteBtn && can('places.delete')) {
      const id = deleteBtn.getAttribute('data-id');
      const name = deleteBtn.getAttribute('data-name');
      const ok = await confirmModal({
        title: 'حذف المكان',
        message: `هل أنت متأكد من حذف "${name || id}" نهائياً من قاعدة البيانات؟ لن يمكن التراجع عن هذا الإجراء.`,
        confirmText: 'حذف نهائي',
        variant: 'danger'
      });
      if (!ok) return;

      try {
        await AdminService.deletePlace(id);
        toast.success(`تم حذف "${name || id}" بنجاح`);
        table.refresh();
      } catch (err) {
        toast.error(err.message || 'فشل حذف المكان');
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
