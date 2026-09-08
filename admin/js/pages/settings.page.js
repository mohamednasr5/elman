/**
 * المنزلة وناسها — System Settings Page
 */

import { toast } from '../components/toast.js';

export async function renderSettingsPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">إعدادات المنظومة</h1>
        <p class="admin-page-desc">الروابط التقنية، المفاتيح السحابية، وإدارة ذاكرة التخزين المؤقت</p>
      </div>
    </div>

    <div class="admin-grid-2">
      <!-- Cloud Infrastructure Config -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🌐 نقاط الربط السحابية (Endpoints)</h2>
        </div>
        <div class="admin-card-body">
          <div class="form-group">
            <label class="form-label">خادم الحوسبة Cloudflare Worker:</label>
            <input type="text" class="form-input" dir="ltr" readonly value="https://elmanzala.nonm1724.workers.dev"/>
          </div>

          <div class="form-group">
            <label class="form-label">رابط التوزيع العام Cloudflare R2 CDN:</label>
            <input type="text" class="form-input" dir="ltr" readonly value="https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev"/>
          </div>

          <div class="form-group">
            <label class="form-label">مشروع Firebase App ID:</label>
            <input type="text" class="form-input" dir="ltr" readonly value="elmanzla-7402a"/>
          </div>
        </div>
      </div>

      <!-- Cache & Maintenance -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🧹 الصيانة وذاكرة التخزين (Cache)</h2>
        </div>
        <div class="admin-card-body">
          <p class="text-muted">يقوم المتصفح بحفظ بعض البيانات محلياً لتسريع التصفح. يمكنك إفراغ الذاكرة المؤقتة للأجهزة في حال حدوث أي تعارض بالبيانات.</p>
          
          <div class="mt-4">
            <button type="button" class="btn btn-warning btn-block" id="btn-purge-admin-cache">
              🗑 تفريغ ذاكرة الجلسة المحلية (Clear Cache)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-purge-admin-cache').addEventListener('click', () => {
    sessionStorage.clear();
    toast.success('تم مسح الذاكرة المؤقتة للمشرف بنجاح');
  });
}
