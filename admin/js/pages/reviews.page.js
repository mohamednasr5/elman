/**
 * المنزلة وناسها — Admin Reviews Management Page
 */

import { AdminService } from '../services/admin.service.js';
import { DataTable } from '../components/datatable.js';
import { confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderReviewsPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">التقييمات والآراء</h1>
        <p class="admin-page-desc">مراقبة تقييمات الزوار للمحلات، واكتشاف التعليقات غير اللائقة وحذفها</p>
      </div>
    </div>

    <div class="admin-card">
      <div id="reviews-datatable-container"></div>
    </div>
  `;

  const tableContainer = container.querySelector('#reviews-datatable-container');

  const columns = [
    {
      key: 'place_name',
      label: 'المكان',
      render: (val, row) => `
        <strong>${escapeHtml(val || row.place_id || 'مكان')}</strong>
      `
    },
    {
      key: 'user_name',
      label: 'صاحب التقييم',
      render: (val) => escapeHtml(val || 'زائر')
    },
    {
      key: 'rating',
      label: 'التقييم',
      sortable: true,
      align: 'center',
      render: (val) => {
        const r = Math.min(5, Math.max(1, parseInt(val || 5, 10)));
        return `<span class="cell-rating text-warning">${'★'.repeat(r)}${'☆'.repeat(5 - r)} (${r}/5)</span>`;
      }
    },
    {
      key: 'comment',
      label: 'التعليق',
      render: (val) => `<div class="cell-review-comment">${escapeHtml(val || 'بدون تعليق نصي')}</div>`
    },
    {
      key: 'created_at',
      label: 'التاريخ',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
    },
    {
      key: 'actions',
      label: 'إجراءات',
      align: 'left',
      render: (_, row) => `
        <div class="table-actions-cell">
          ${can('reviews.delete') ? `
            <button type="button" class="btn-action btn-action-delete text-danger btn-delete-review" data-id="${row.id}">🗑 حذف التعليق</button>
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
    searchPlaceholder: 'بحث في نص التقييمات...',
    fetchData: async ({ page, limit, search, sort, order }) => {
      return await AdminService.getReviews({ page, limit, search, sort, order });
    }
  });

  tableContainer.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.btn-delete-review');
    if (delBtn && can('reviews.delete')) {
      const id = delBtn.getAttribute('data-id');
      const ok = await confirmModal({
        title: 'حذف التقييم',
        message: 'هل أنت متأكد من حذف هذا التقييم؟ سيتم إعادة احتساب متوسط تقييم المكان تلقائياً.',
        variant: 'danger'
      });
      if (!ok) return;

      try {
        await AdminService.deleteReview(id);
        toast.success('تم حذف التقييم بنجاح');
        table.refresh();
      } catch (err) {
        toast.error(err.message || 'فشل حذف التقييم');
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
