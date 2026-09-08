/**
 * المنزلة وناسها — Admin Users & RBAC Management Page
 */

import { AdminService } from '../services/admin.service.js';
import { DataTable } from '../components/datatable.js';
import { showModal, confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { getCurrentAdmin, can } from '../core/auth.js';
import { ROLES, ROLE_LABELS, ROLE_BADGE_CLASSES } from '../core/permissions.js';

export async function renderUsersPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">إدارة المستخدمين والصلاحيات</h1>
        <p class="admin-page-desc">مراقبة حسابات المستخدمين، تعيين الأدوار الإدارية، وإدارة الحظر</p>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="admin-filters-card mb-3">
      <div class="filter-group">
        <label>الدور:</label>
        <select id="filter-user-role" class="form-select">
          <option value="">جميع الأدوار</option>
          <option value="SUPERADMIN">مدير عام المنظومة</option>
          <option value="ADMIN">مسؤول إدارة</option>
          <option value="MODERATOR">مشرف محتوى</option>
          <option value="EDITOR">محرر بيانات</option>
          <option value="SUPPORT">دعم فني</option>
          <option value="USER">مستخدم عادي</option>
        </select>
      </div>
      <div class="filter-group">
        <label>حالة الحساب:</label>
        <select id="filter-user-status" class="form-select">
          <option value="">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف مؤقتاً</option>
        </select>
      </div>
    </div>

    <div class="admin-card">
      <div id="users-datatable-container"></div>
    </div>
  `;

  const currentAdmin = getCurrentAdmin();
  const tableContainer = container.querySelector('#users-datatable-container');

  const columns = [
    {
      key: 'name',
      label: 'المستخدم',
      sortable: true,
      render: (val, row) => {
        const photo = row.photo_url || row.photoURL || '';
        const initial = (val || row.email || 'U')[0].toUpperCase();
        return `
          <div class="cell-user-identity">
            <div class="cell-user-avatar">
              ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(val || '')}" onerror="this.src=''"/>` : `<span>${initial}</span>`}
            </div>
            <div class="cell-user-meta">
              <strong>${escapeHtml(val || row.email?.split('@')[0] || 'مستخدم')}</strong>
              <small class="text-muted" dir="ltr">${escapeHtml(row.email || row.id)}</small>
            </div>
          </div>
        `;
      }
    },
    {
      key: 'role',
      label: 'الدور الإداري',
      sortable: true,
      align: 'center',
      render: (val) => {
        const role = String(val || 'USER').toUpperCase();
        const label = ROLE_LABELS[role] || role;
        const badgeClass = ROLE_BADGE_CLASSES[role] || 'badge-neutral';
        return `<span class="badge ${badgeClass}">${escapeHtml(label)}</span>`;
      }
    },
    {
      key: 'status',
      label: 'حالة الحساب',
      align: 'center',
      render: (val) => {
        const isSusp = val === 'suspended' || val === 'banned';
        return `<span class="badge ${isSusp ? 'badge-danger' : 'badge-success'}">${isSusp ? 'موقوف' : 'نشط'}</span>`;
      }
    },
    {
      key: 'created_at',
      label: 'تاريخ الانضمام',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
    },
    {
      key: 'actions',
      label: 'إجراءات',
      align: 'left',
      render: (_, row) => `
        <div class="table-actions-cell">
          ${can('users.role') ? `<button type="button" class="btn-action btn-action-edit btn-change-role" data-row='${escapeAttr(JSON.stringify(row))}'>🔑 تعديل الصلاحية</button>` : ''}
          ${can('users.suspend') ? `
            <button type="button" class="btn-action ${row.status === 'suspended' ? 'btn-action-success' : 'btn-action-delete text-danger'} btn-toggle-suspend" data-id="${row.id}" data-status="${row.status || 'active'}" data-name="${escapeHtml(row.name || row.email || '')}">
              ${row.status === 'suspended' ? 'تنشيط' : 'إيقاف'}
            </button>
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
    searchPlaceholder: 'بحث بالاسم، البريد، أو المعرف...',
    fetchData: async ({ page, limit, search, sort, order, filters }) => {
      return await AdminService.getUsers({
        page,
        limit,
        search,
        sort,
        order,
        role: filters.role || undefined,
        status: filters.status || undefined
      });
    }
  });

  // Filter listeners
  const roleFilter = container.querySelector('#filter-user-role');
  const statusFilter = container.querySelector('#filter-user-status');

  const onFilterChange = () => {
    table.setFilters({
      role: roleFilter.value,
      status: statusFilter.value
    });
  };

  roleFilter.addEventListener('change', onFilterChange);
  statusFilter.addEventListener('change', onFilterChange);

  // Table action listeners
  tableContainer.addEventListener('click', async (e) => {
    // 1. Change Role
    const roleBtn = e.target.closest('.btn-change-role');
    if (roleBtn) {
      const row = JSON.parse(roleBtn.getAttribute('data-row') || '{}');
      openRoleModal(row, currentAdmin, table);
      return;
    }

    // 2. Suspend / Activate User
    const suspBtn = e.target.closest('.btn-toggle-suspend');
    if (suspBtn) {
      const id = suspBtn.getAttribute('data-id');
      const name = suspBtn.getAttribute('data-name');
      const currentStatus = suspBtn.getAttribute('data-status');
      const isSuspending = currentStatus !== 'suspended';

      const ok = await confirmModal({
        title: isSuspending ? 'إيقاف حساب المستخدم' : 'إعادة تنشيط الحساب',
        message: isSuspending 
          ? `هل أنت متأكد من إيقاف حساب "${name}"؟ لن يتمكن المستخدم من تسجيل الدخول أو نشر أي بيانات.`
          : `هل تريد إعادة تنشيط حساب "${name}"؟`,
        confirmText: isSuspending ? 'إيقاف الحساب' : 'تنشيط الحساب',
        variant: isSuspending ? 'danger' : 'success'
      });
      if (!ok) return;

      try {
        await AdminService.updateUserStatus(id, isSuspending ? 'suspended' : 'active', isSuspending ? 'إيقاف بواسطة الإدارة' : 'تنشيط');
        toast.success(isSuspending ? 'تم إيقاف الحساب' : 'تم تنشيط الحساب');
        table.refresh();
      } catch (err) {
        toast.error(err.message || 'فشل تغيير حالة الحساب');
      }
    }
  });
}

function openRoleModal(user, currentAdmin, table) {
  const currentRole = String(user.role || 'USER').toUpperCase();
  const isSuper = currentAdmin?.role === 'SUPERADMIN';

  const content = `
    <div>
      <p>المستخدم: <strong>${escapeHtml(user.name || user.email)}</strong></p>
      <p class="text-muted">البريد: ${escapeHtml(user.email || user.id)}</p>

      <div class="form-group mt-3">
        <label class="form-label required">اختر الدور الجديد:</label>
        <select id="select-new-role" class="form-select">
          ${isSuper ? `<option value="SUPERADMIN" ${currentRole === 'SUPERADMIN' ? 'selected' : ''}>مدير عام المنظومة (SUPERADMIN)</option>` : ''}
          <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>مسؤول إدارة (ADMIN)</option>
          <option value="MODERATOR" ${currentRole === 'MODERATOR' ? 'selected' : ''}>مشرف محتوى وتوثيق (MODERATOR)</option>
          <option value="EDITOR" ${currentRole === 'EDITOR' ? 'selected' : ''}>محرر بيانات (EDITOR)</option>
          <option value="SUPPORT" ${currentRole === 'SUPPORT' ? 'selected' : ''}>دعم فني واستعلام (SUPPORT)</option>
          <option value="USER" ${currentRole === 'USER' ? 'selected' : ''}>مستخدم عادي (USER)</option>
        </select>
      </div>
    </div>
  `;

  const footer = `
    <button type="button" class="btn btn-secondary btn-modal-cancel">إلغاء</button>
    <button type="button" class="btn btn-primary btn-modal-save-role">حفظ الصلاحية</button>
  `;

  const modal = showModal({
    title: 'تعديل الدور الإداري للمستخدم',
    content,
    footer,
    size: 'sm'
  });

  modal.element.querySelector('.btn-modal-cancel').addEventListener('click', () => modal.close());

  modal.element.querySelector('.btn-modal-save-role').addEventListener('click', async () => {
    const newRole = modal.element.querySelector('#select-new-role').value;
    if (newRole === currentRole) {
      modal.close();
      return;
    }

    modal.setLoading(true);
    try {
      await AdminService.updateUserRole(user.id, newRole);
      toast.success(`تم تغيير دور "${user.name || user.email}" إلى ${ROLE_LABELS[newRole] || newRole}`);
      modal.close();
      table.refresh();
    } catch (err) {
      toast.error(err.message || 'فشل تحديث الصلاحية');
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
