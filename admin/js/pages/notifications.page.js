/**
 * المنزلة وناسها — Admin Push Notifications Page
 */

import { AdminService } from '../services/admin.service.js';
import { confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderNotificationsPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">إرسال إشعارات الدفع (Web Push Notifications)</h1>
        <p class="admin-page-desc">بث إشعارات حية عبر Firebase Cloud Messaging (FCM) لهواتف وأجهزة المستخدمين</p>
      </div>
    </div>

    <div class="admin-grid-2">
      <!-- Composer Card -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📢 إنشاء وبث إشعار جديد</h2>
        </div>
        <div class="admin-card-body">
          <form id="notification-form" class="admin-form">
            <div class="form-group">
              <label class="form-label required">عنوان الإشعار:</label>
              <input type="text" name="title" class="form-input" required placeholder="مثال: عروض مميزة جديدة في مدينة المنزلة!"/>
            </div>

            <div class="form-group">
              <label class="form-label required">نص الإشعار:</label>
              <textarea name="body" class="form-textarea" rows="3" required placeholder="اكتب نص الرسالة المختصر الذي سيظهر على شاشة المستخدم..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">رابط التوجيه عند النقر (URL):</label>
              <input type="text" name="url" class="form-input" dir="ltr" value="/" placeholder="/place.html?id=... أو رابط مباشر"/>
            </div>

            <div class="form-group">
              <label class="form-label">الجمهور المستهدف:</label>
              <select name="target" class="form-select">
                <option value="all">جميع المشتركين (Topic: all_users)</option>
                <option value="merchants">أصحاب المحلات والأنشطة (Topic: merchants)</option>
              </select>
            </div>

            <div class="form-group mt-3">
              <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-send-notification" ${!can('notifications.send') ? 'disabled' : ''}>
                🚀 بث الإشعار للمستخدمين
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Preview Card -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📱 معاينة شكل الإشعار</h2>
        </div>
        <div class="admin-card-body">
          <div class="push-preview-box">
            <div class="push-preview-header">
              <img src="../icons/icon-96x96.png" class="push-icon" alt="icon"/>
              <div class="push-header-meta">
                <strong>دليل المنزلة والمطرية</strong>
                <small>الآن</small>
              </div>
            </div>
            <div class="push-preview-content">
              <div class="push-title" id="preview-title">عنوان الإشعار يظهر هنا</div>
              <div class="push-body" id="preview-body">محتوى الإشعار النصي سيظهر على شاشة قفل الهاتف أو سطح المكتب...</div>
            </div>
          </div>
          <p class="text-muted mt-3 small">يتم تسليم الإشعارات عبر Google FCM للأجهزة التي وافقت على استقبال التنبيهات.</p>
        </div>
      </div>
    </div>
  `;

  // Live preview binding
  const titleInput = container.querySelector('input[name="title"]');
  const bodyInput = container.querySelector('textarea[name="body"]');
  const previewTitle = container.querySelector('#preview-title');
  const previewBody = container.querySelector('#preview-body');

  titleInput.addEventListener('input', () => {
    previewTitle.textContent = titleInput.value.trim() || 'عنوان الإشعار يظهر هنا';
  });

  bodyInput.addEventListener('input', () => {
    previewBody.textContent = bodyInput.value.trim() || 'محتوى الإشعار النصي سيظهر على شاشة قفل الهاتف...';
  });

  // Handle Form Submit
  const form = container.querySelector('#notification-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    const url = form.querySelector('input[name="url"]').value.trim() || '/';
    const target = form.querySelector('select[name="target"]').value;

    const ok = await confirmModal({
      title: 'تأكيد بث الإشعار',
      message: `هل أنت متأكد من إرسال الإشعار بعنوان "${title}" لجميع أجهزة الجمهور المستهدف (${target})؟`,
      confirmText: 'نعم، إرسال الآن',
      variant: 'primary'
    });
    if (!ok) return;

    const btn = container.querySelector('#btn-send-notification');
    btn.disabled = true;
    btn.textContent = 'جاري البث عبر FCM...';

    try {
      await AdminService.sendNotification({
        title,
        body,
        url,
        topic: target === 'merchants' ? 'merchants' : 'all_users'
      });
      toast.success('تم بث الإشعار بنجاح لجميع الأجهزة المستهدفة!');
      form.reset();
      previewTitle.textContent = 'عنوان الإشعار يظهر هنا';
      previewBody.textContent = 'محتوى الإشعار النصي سيظهر على شاشة قفل الهاتف...';
    } catch (err) {
      toast.error(err.message || 'فشل إرسال الإشعار، يرجى مراجعة إعدادات FCM');
    } finally {
      btn.disabled = false;
      btn.textContent = '🚀 بث الإشعار للمستخدمين';
    }
  });
}
