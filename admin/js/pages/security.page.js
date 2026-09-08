/**
 * المنزلة وناسها — Security & IP Firewall Page
 */

import { AdminService } from '../services/admin.service.js';
import { showModal, confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderSecurityPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">جدار الحماية والحظر (IP Firewall)</h1>
        <p class="admin-page-desc">حظر العناوين المشبوهة لمنع الهجمات وإساءة استخدام المنظومة</p>
      </div>
      <div class="admin-page-actions">
        ${can('security.ban') ? `<button type="button" class="btn btn-danger" id="btn-add-ip-ban">+ حظر عنوان IP جديد</button>` : ''}
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-body" id="bans-list-container">
        <div class="spinner"></div>
      </div>
    </div>
  `;

  const listContainer = container.querySelector('#bans-list-container');
  const addBtn = container.querySelector('#btn-add-ip-ban');

  if (addBtn) {
    addBtn.addEventListener('click', () => openBanModal(() => loadBans(listContainer)));
  }

  await loadBans(listContainer);
}

async function loadBans(container) {
  container.innerHTML = `
    <div style="padding:2rem;text-align:center;">
      <div class="spinner"></div>
      <p class="mt-2 text-muted">جاري تحميل قائمة المحظورين...</p>
    </div>
  `;

  try {
    const bans = await AdminService.getBannedIps();
    if (!Array.isArray(bans) || bans.length === 0) {
      container.innerHTML = `
        <div class="dt-empty-content">
          <span class="dt-empty-icon">🛡️</span>
          <p>قائمة الحظر فارغة. لا توجد أي عناوين IP محظورة حالياً.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="dt-table-scroll">
        <table class="dt-table">
          <thead>
            <tr>
              <th>عنوان IP المحظور</th>
              <th>سبب الحظر</th>
              <th>المشرف الذي حظره</th>
              <th>تاريخ الحظر</th>
              <th>تاريخ انتهاء الحظر</th>
              <th style="text-align:left;">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${bans.map(b => `
              <tr class="dt-row">
                <td><code dir="ltr" class="text-danger font-bold">${escapeHtml(b.ip)}</code></td>
                <td>${escapeHtml(b.reason || 'بدون سبب')}</td>
                <td>${escapeHtml(b.banned_by || 'النظام')}</td>
                <td>${b.created_at ? new Date(b.created_at).toLocaleDateString('ar-EG') : '-'}</td>
                <td>${b.expires_at ? new Date(b.expires_at).toLocaleDateString('ar-EG') : '<span class="badge badge-danger">دائم</span>'}</td>
                <td style="text-align:left;">
                  ${can('security.ban') ? `
                    <button type="button" class="btn btn-sm btn-outline btn-unban-ip" data-ip="${escapeAttr(b.ip)}">
                      فك الحظر
                    </button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.btn-unban-ip').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ip = btn.getAttribute('data-ip');
        const ok = await confirmModal({
          title: 'فك حظر IP',
          message: `هل أنت متأكد من فك الحظر عن عنوان IP (${ip})؟`,
          variant: 'warning'
        });
        if (!ok) return;

        try {
          await AdminService.unbanIp(ip);
          toast.success(`تم فك الحظر عن ${ip}`);
          loadBans(container);
        } catch (err) {
          toast.error(err.message || 'فشل فك الحظر');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>تعذر تحميل قائمة الحظر</strong>
        <p>${escapeHtml(err.message || 'خطأ في الاتصال')}</p>
        <button type="button" class="btn btn-warning btn-sm mt-2" onclick="location.reload()">↻ إعادة المحاولة</button>
      </div>
    `;
  }
}

function openBanModal(onSuccess) {
  const content = `
    <form id="ban-form">
      <div class="form-group">
        <label class="form-label required">عنوان IP:</label>
        <input type="text" id="ban-ip" class="form-input" dir="ltr" required placeholder="مثال: 197.34.12.88"/>
      </div>
      <div class="form-group">
        <label class="form-label required">سبب الحظر:</label>
        <input type="text" id="ban-reason" class="form-input" required placeholder="مثال: محاولات متكررة لإرسال بيانات عشوائية"/>
      </div>
    </form>
  `;

  const footer = `
    <button type="button" class="btn btn-secondary btn-modal-cancel">إلغاء</button>
    <button type="button" class="btn btn-danger btn-modal-confirm-ban">تأكيد الحظر</button>
  `;

  const modal = showModal({
    title: 'حظر عنوان IP جديد',
    content,
    footer,
    size: 'sm'
  });

  modal.element.querySelector('.btn-modal-cancel').addEventListener('click', () => modal.close());

  modal.element.querySelector('.btn-modal-confirm-ban').addEventListener('click', async () => {
    const ip = modal.element.querySelector('#ban-ip').value.trim();
    const reason = modal.element.querySelector('#ban-reason').value.trim();

    if (!ip || !reason) {
      toast.warning('يرجى إدخال عنوان IP والسبب');
      return;
    }

    modal.setLoading(true);
    try {
      await AdminService.banIp(ip, reason);
      toast.success(`تم حظر عنوان IP (${ip}) بنجاح`);
      modal.close();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'فشل تنفيذ الحظر');
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
