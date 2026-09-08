/**
 * المنزلة وناسها — Verification Queue Page
 * Manages commercial verification requests with approve/reject workflows and document viewing.
 */

import { AdminService } from '../services/admin.service.js';
import { DataTable } from '../components/datatable.js';
import { showModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { updateSidebarBadge } from '../components/sidebar.js';
import { can } from '../core/auth.js';

export async function renderVerificationPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">طابور مراجعة طلبات التوثيق</h1>
        <p class="admin-page-desc">مراجعة وثائق وتراخيص الأنشطة التجارية لمنح شارة التوثيق الرسمية</p>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="admin-tabs mb-3" id="verif-status-tabs">
      <button type="button" class="tab-btn active" data-status="pending">⏳ طلبات قيد المراجعة</button>
      <button type="button" class="tab-btn" data-status="approved">✓ طلبات مقبولة</button>
      <button type="button" class="tab-btn" data-status="rejected">✕ طلبات مرفوضة</button>
      <button type="button" class="tab-btn" data-status="">الكل</button>
    </div>

    <div class="admin-card">
      <div id="verif-datatable-container"></div>
    </div>
  `;

  let currentStatus = 'pending';
  const tableContainer = container.querySelector('#verif-datatable-container');

  const columns = [
    {
      key: 'id',
      label: '#',
      width: '60px'
    },
    {
      key: 'place_name',
      label: 'النشاط التجاري',
      render: (val, row) => `
        <div class="cell-place-identity">
          <div class="cell-place-meta">
            <strong>${escapeHtml(val || row.place_id || 'مكان')}</strong>
            <small class="text-muted">المعرف: ${escapeHtml(row.place_id || '')}</small>
          </div>
        </div>
      `
    },
    {
      key: 'applicant_name',
      label: 'مقدم الطلب',
      render: (val, row) => `
        <div>
          <strong>${escapeHtml(val || row.user_name || 'غير محدد')}</strong>
          ${row.applicant_phone ? `<div class="cell-phone" dir="ltr">${escapeHtml(row.applicant_phone)}</div>` : ''}
        </div>
      `
    },
    {
      key: 'status',
      label: 'حالة الطلب',
      align: 'center',
      render: (val) => {
        if (val === 'approved') return '<span class="badge badge-success">✓ مقبول وموثق</span>';
        if (val === 'rejected') return '<span class="badge badge-danger">✕ مرفوض</span>';
        return '<span class="badge badge-warning">⏳ بانتظار المراجعة</span>';
      }
    },
    {
      key: 'created_at',
      label: 'تاريخ التقديم',
      render: (val) => val ? new Date(val).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
    },
    {
      key: 'actions',
      label: 'إجراءات البت',
      align: 'left',
      render: (_, row) => `
        <div class="table-actions-cell">
          <button type="button" class="btn-action btn-action-view btn-view-verif" data-row='${escapeAttr(JSON.stringify(row))}'>👁 فحص المستندات</button>
          ${row.status === 'pending' && can('verification.decide') ? `
            <button type="button" class="btn-action btn-action-success btn-approve-verif" data-id="${row.id}" data-place-id="${row.place_id}">✓ قبول</button>
            <button type="button" class="btn-action btn-action-delete btn-reject-verif" data-id="${row.id}" data-place-id="${row.place_id}">✕ رفض</button>
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
    defaultLimit: 20,
    searchPlaceholder: 'بحث باسم المكان أو مقدم الطلب...',
    fetchData: async ({ page, limit, search, sort, order }) => {
      return await AdminService.getVerificationQueue({
        page,
        limit,
        search,
        status: currentStatus || undefined
      });
    }
  });

  // Tab buttons
  const tabs = container.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatus = tab.getAttribute('data-status');
      table.setFilters({ status: currentStatus });
    });
  });

  // Action clicks
  tableContainer.addEventListener('click', async (e) => {
    // 1. View Documents
    const viewBtn = e.target.closest('.btn-view-verif');
    if (viewBtn) {
      const row = JSON.parse(viewBtn.getAttribute('data-row') || '{}');
      openVerificationModal(row, table);
      return;
    }

    // 2. Approve Request
    const approveBtn = e.target.closest('.btn-approve-verif');
    if (approveBtn) {
      const id = approveBtn.getAttribute('data-id');
      const placeId = approveBtn.getAttribute('data-place-id');
      openDecisionModal(id, placeId, 'approved', table);
      return;
    }

    // 3. Reject Request
    const rejectBtn = e.target.closest('.btn-reject-verif');
    if (rejectBtn) {
      const id = rejectBtn.getAttribute('data-id');
      const placeId = rejectBtn.getAttribute('data-place-id');
      openDecisionModal(id, placeId, 'rejected', table);
    }
  });
}

function openVerificationModal(row, table) {
  const docs = [];
  if (row.commercial_reg_doc) docs.push({ title: 'السجل التجاري أو الترخيص', url: row.commercial_reg_doc });
  if (row.national_id_doc) docs.push({ title: 'بطاقة الرقم القومي للمالك', url: row.national_id_doc });
  if (row.facade_image) docs.push({ title: 'صورة واجهة المحل أو اللوحة', url: row.facade_image });

  const content = `
    <div class="verif-detail-view">
      <div class="detail-row">
        <strong>النشاط التجاري:</strong>
        <span>${escapeHtml(row.place_name || row.place_id)}</span>
      </div>
      <div class="detail-row">
        <strong>مقدم الطلب:</strong>
        <span>${escapeHtml(row.applicant_name || 'غير محدد')} (${escapeHtml(row.applicant_phone || 'بدون هاتف')})</span>
      </div>
      <div class="detail-row">
        <strong>حالة الطلب الحالية:</strong>
        <span>${row.status === 'approved' ? 'مقبول وموثق' : (row.status === 'rejected' ? 'مرفوض' : 'معلق')}</span>
      </div>
      ${row.notes ? `
        <div class="detail-row">
          <strong>ملاحظات المراجعة:</strong>
          <span class="text-warning">${escapeHtml(row.notes)}</span>
        </div>
      ` : ''}

      <h4 class="mt-3 mb-2">المستندات والصور المرفقة:</h4>
      ${docs.length === 0 ? '<p class="text-muted">لم يتم إرفاق صور مستندات خارجية مع هذا الطلب.</p>' : `
        <div class="verif-docs-grid">
          ${docs.map(d => `
            <div class="verif-doc-item">
              <span class="doc-title">${escapeHtml(d.title)}</span>
              <a href="${d.url}" target="_blank" class="doc-img-link">
                <img src="${d.url}" alt="${escapeHtml(d.title)}" class="verif-doc-thumb"/>
                <span class="doc-overlay">عرض بالحجم الكامل ↗</span>
              </a>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  const footer = `
    <button type="button" class="btn btn-secondary btn-modal-close">إغلاق</button>
    ${row.status === 'pending' && can('verification.decide') ? `
      <button type="button" class="btn btn-danger btn-modal-reject">✕ رفض الطلب</button>
      <button type="button" class="btn btn-success btn-modal-approve">✓ قبول ومنح التوثيق</button>
    ` : ''}
  `;

  const modal = showModal({
    title: `تفاصيل طلب توثيق #${row.id}`,
    content,
    footer,
    size: 'lg'
  });

  modal.element.querySelector('.btn-modal-close').addEventListener('click', () => modal.close());

  const approveBtn = modal.element.querySelector('.btn-modal-approve');
  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      modal.close();
      openDecisionModal(row.id, row.place_id, 'approved', table);
    });
  }

  const rejectBtn = modal.element.querySelector('.btn-modal-reject');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      modal.close();
      openDecisionModal(row.id, row.place_id, 'rejected', table);
    });
  }
}

function openDecisionModal(verifId, placeId, decision, table) {
  const isApprove = decision === 'approved';
  const title = isApprove ? 'قبول طلب التوثيق' : 'رفض طلب التوثيق';

  const content = `
    <div>
      <p>${isApprove ? 'سيتم منح المكان شارة التوثيق الرسمية وتحديث حالته في الدليل.' : 'يرجى تدوين سبب الرفض لتوضيحه لصاحب الطلب.'}</p>
      <div class="form-group mt-2">
        <label class="form-label">${isApprove ? 'ملاحظات إضافية (اختياري):' : 'سبب الرفض (مطلوب):'}</label>
        <textarea id="decision-notes" class="form-textarea" rows="3" placeholder="${isApprove ? 'تم التحقق من النشاط والمستندات...' : 'عدم وضوح السجل التجاري، بيانات غير مطابقة...'}"></textarea>
      </div>
    </div>
  `;

  const footer = `
    <button type="button" class="btn btn-secondary btn-cancel-decide">إلغاء</button>
    <button type="button" class="btn btn-${isApprove ? 'success' : 'danger'} btn-confirm-decide">
      ${isApprove ? '✓ تأكيد القبول والتوثيق' : '✕ تأكيد الرفض'}
    </button>
  `;

  const modal = showModal({
    title,
    content,
    footer,
    size: 'sm'
  });

  modal.element.querySelector('.btn-cancel-decide').addEventListener('click', () => modal.close());

  modal.element.querySelector('.btn-confirm-decide').addEventListener('click', async () => {
    const notes = modal.element.querySelector('#decision-notes').value.trim();
    if (!isApprove && !notes) {
      toast.warning('يرجى كتابة سبب الرفض');
      return;
    }

    modal.setLoading(true);
    try {
      await AdminService.decideVerification(verifId, decision, notes);
      toast.success(isApprove ? 'تم قبول طلب التوثيق وتفعيل الشارة الزرقاء' : 'تم تسجيل رفض الطلب');
      modal.close();
      table.refresh();

      // Refresh sidebar count
      const dash = await AdminService.getDashboard().catch(() => null);
      if (dash) updateSidebarBadge('badge-nav-verification', dash?.verification?.pending || 0);
    } catch (err) {
      toast.error(err.message || 'فشل تسجيل القرار');
      modal.setLoading(false);
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
