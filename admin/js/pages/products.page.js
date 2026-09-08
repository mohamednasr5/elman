/**
 * المنزلة وناسها — Admin Products Management Page
 */

import { AdminService } from '../services/admin.service.js';
import { DataTable } from '../components/datatable.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderProductsPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">إدارة المنتجات والخدمات</h1>
        <p class="admin-page-desc">مراجعة واعتماد المنتجات والعروض المضافة بواسطة أصحاب الأنشطة</p>
      </div>
    </div>

    <!-- Status Filters -->
    <div class="admin-filters-card mb-3">
      <div class="filter-group">
        <label>حالة المنتج:</label>
        <select id="filter-product-status" class="form-select">
          <option value="">جميع الحالات</option>
          <option value="active">معتمد ونشط</option>
          <option value="pending">بانتظار الموافقة</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>
    </div>

    <div class="admin-card">
      <div id="products-datatable-container"></div>
    </div>
  `;

  const tableContainer = container.querySelector('#products-datatable-container');

  const columns = [
    {
      key: 'name',
      label: 'المنتج / الخدمة',
      sortable: true,
      render: (val, row) => {
        const img = row.image || '../icons/icon-96x96.png';
        return `
          <div class="cell-place-identity">
            <img src="${escapeHtml(img)}" class="cell-place-thumb" alt="${escapeHtml(val || '')}" onerror="this.src='../icons/icon-96x96.png'"/>
            <div class="cell-place-meta">
              <strong>${escapeHtml(val || 'بدون اسم')}</strong>
              <small class="text-muted">${escapeHtml(row.description || '')}</small>
            </div>
          </div>
        `;
      }
    },
    {
      key: 'place_name',
      label: 'المتجر / المحل',
      render: (val, row) => `
        <strong>${escapeHtml(val || row.place_id || 'متجر')}</strong>
      `
    },
    {
      key: 'price',
      label: 'السعر',
      sortable: true,
      render: (val) => val ? `<strong>${parseFloat(val).toLocaleString('ar-EG')} ج.م</strong>` : '<span class="text-muted">غير محدد</span>'
    },
    {
      key: 'status',
      label: 'الحالة',
      align: 'center',
      render: (val) => {
        if (val === 'active' || val === 'approved') return '<span class="badge badge-success">معتمد</span>';
        if (val === 'rejected') return '<span class="badge badge-danger">مرفوض</span>';
        return '<span class="badge badge-warning">بانتظار الموافقة</span>';
      }
    },
    {
      key: 'actions',
      label: 'إجراءات الإشراف',
      align: 'left',
      render: (_, row) => `
        <div class="table-actions-cell">
          ${can('products.approve') && row.status !== 'active' ? `
            <button type="button" class="btn-action btn-action-success btn-prod-status" data-id="${row.id}" data-status="active">✓ اعتماد</button>
          ` : ''}
          ${can('products.approve') && row.status !== 'rejected' ? `
            <button type="button" class="btn-action btn-action-delete text-danger btn-prod-status" data-id="${row.id}" data-status="rejected">✕ حجب</button>
          ` : ''}
        </div>
      `
    }
  ];

  const table = new DataTable({
    container: tableContainer,
    columns,
    defaultSort: 'created_at',
    defaultOrder: 'DESC',
    defaultLimit: 25,
    searchPlaceholder: 'بحث باسم المنتج أو المتجر...',
    fetchData: async ({ page, limit, search, sort, order, filters }) => {
      return await AdminService.getProducts({
        page,
        limit,
        search,
        sort,
        order,
        status: filters.status || undefined
      });
    }
  });

  const statusFilter = container.querySelector('#filter-product-status');
  statusFilter.addEventListener('change', () => {
    table.setFilters({ status: statusFilter.value });
  });

  tableContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-prod-status');
    if (btn && can('products.approve')) {
      const id = btn.getAttribute('data-id');
      const newStatus = btn.getAttribute('data-status');
      btn.disabled = true;

      try {
        await AdminService.moderateProduct(id, newStatus);
        toast.success(newStatus === 'active' ? 'تم اعتماد المنتج ونشره' : 'تم حجب المنتج');
        table.refresh();
      } catch (err) {
        toast.error(err.message || 'فشل تحديث حالة المنتج');
        btn.disabled = false;
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
