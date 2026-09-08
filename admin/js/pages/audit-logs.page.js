/**
 * المنزلة وناسها — Admin Audit Logs Page
 * Read-only transparent audit log tracking all staff actions.
 */

import { AdminService } from '../services/admin.service.js';
import { DataTable } from '../components/datatable.js';
import { showModal } from '../components/modal.js';

export async function renderAuditLogsPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">سجل الرقابة والعمليات (Audit Logs)</h1>
        <p class="admin-page-desc">سجل دقيق غير قابل للتعديل يوثق جميع الأنشطة والإجراءات التي يقوم بها المشرفون</p>
      </div>
    </div>

    <div class="admin-card">
      <div id="audit-datatable-container"></div>
    </div>
  `;

  const tableContainer = container.querySelector('#audit-datatable-container');

  const columns = [
    {
      key: 'created_at',
      label: 'التوقيت',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : '-'
    },
    {
      key: 'admin_email',
      label: 'المسؤول / المشرف',
      render: (val, row) => `
        <div>
          <strong>${escapeHtml(val || 'مسؤول')}</strong>
          ${row.admin_role ? `<small class="badge badge-neutral ms-1">${escapeHtml(row.admin_role)}</small>` : ''}
        </div>
      `
    },
    {
      key: 'action',
      label: 'الإجراء المنفذ',
      sortable: true,
      render: (val) => {
        let badgeClass = 'badge-neutral';
        if (val.includes('delete')) badgeClass = 'badge-danger';
        else if (val.includes('verify') || val.includes('approve')) badgeClass = 'badge-success';
        else if (val.includes('update') || val.includes('role')) badgeClass = 'badge-warning';
        return `<span class="badge ${badgeClass}">${escapeHtml(val)}</span>`;
      }
    },
    {
      key: 'target_type',
      label: 'الهدف',
      render: (val, row) => `
        <span>${escapeHtml(val || '-')}: <code>${escapeHtml(row.target_id || '-')}</code></span>
      `
    },
    {
      key: 'ip_address',
      label: 'عنوان IP',
      render: (val) => `<code dir="ltr">${escapeHtml(val || '-')}</code>`
    },
    {
      key: 'details',
      label: 'تفاصيل العملية',
      align: 'left',
      render: (val) => {
        if (!val || val === '{}') return '<span class="text-muted">-</span>';
        return `
          <button type="button" class="btn-action btn-action-view btn-view-audit-details" data-json="${escapeAttr(val)}">
            🔍 عرض التفاصيل
          </button>
        `;
      }
    }
  ];

  new DataTable({
    container: tableContainer,
    columns,
    defaultSort: 'created_at',
    defaultOrder: 'DESC',
    defaultLimit: 25,
    searchPlaceholder: 'بحث في سجل العمليات والبريد...',
    fetchData: async ({ page, limit, search, sort, order }) => {
      return await AdminService.getAuditLogs({ page, limit, search, sort, order });
    }
  });

  tableContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-view-audit-details');
    if (btn) {
      const jsonStr = btn.getAttribute('data-json');
      let formatted = jsonStr;
      try {
        formatted = JSON.stringify(JSON.parse(jsonStr), null, 2);
      } catch (_) {}

      showModal({
        title: 'تفاصيل سجل العملية',
        content: `<pre class="code-block-view" dir="ltr"><code>${escapeHtml(formatted)}</code></pre>`,
        size: 'md'
      });
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

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
