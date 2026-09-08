/**
 * المنزلة وناسها — Place Create / Edit Page
 */

import { AdminService } from '../services/admin.service.js';
import { toast } from '../components/toast.js';
import { can } from '../core/auth.js';

export async function renderPlaceEditPage(container, placeId) {
  const isNew = !placeId || placeId === 'new';
  const pageTitle = isNew ? 'إضافة مكان جديد' : 'تعديل بيانات المكان';

  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">${pageTitle}</h1>
        <p class="admin-page-desc">${isNew ? 'تسجيل نشاط تجاري أو خدمي جديد في قاعدة البيانات' : `المعرف: ${escapeHtml(placeId)}`}</p>
      </div>
      <div class="admin-page-actions">
        <a href="#places" class="btn btn-secondary btn-sm">&laquo; عودة لقائمة الأماكن</a>
        ${!isNew ? `<a href="../place.html?id=${placeId}" target="_blank" class="btn btn-outline btn-sm">معاينة بالموقع العام ↗</a>` : ''}
      </div>
    </div>

    <div class="admin-card place-edit-card" id="place-form-wrapper">
      <div style="padding: 2rem; text-align: center;">
        <div class="spinner"></div>
        <p class="mt-2 text-muted">جاري تحميل البيانات...</p>
      </div>
    </div>
  `;

  const formWrapper = container.querySelector('#place-form-wrapper');

  let placeData = null;
  let categories = [];

  try {
    const [catsRes, placeRes] = await Promise.all([
      AdminService.getCategories(),
      !isNew ? AdminService.getPlace(placeId) : Promise.resolve(null)
    ]);
    categories = Array.isArray(catsRes) ? catsRes : [];
    placeData = placeRes;
  } catch (err) {
    console.error(err);
    formWrapper.innerHTML = `
      <div class="alert alert-danger">
        <strong>تعذر تحميل بيانات المكان</strong>
        <p>${escapeHtml(err.message || 'خطأ بالاتصال بقاعدة البيانات')}</p>
        <div class="mt-3">
          <button type="button" class="btn btn-warning btn-sm" onclick="location.reload()">↻ إعادة المحاولة</button>
          <a href="#places" class="btn btn-secondary btn-sm">العودة لقائمة الأماكن</a>
        </div>
      </div>
    `;
    return;
  }

  // Default empty form values for new place
  const p = placeData || {
    name: '',
    category: categories[0]?.name || '',
    subcategory: '',
    address: '',
    area: 'المنزلة',
    phone: '',
    whatsapp: '',
    description: '',
    image: '',
    images: '[]',
    facebook: '',
    instagram: '',
    website: '',
    latitude: '',
    longitude: '',
    google_maps_url: '',
    working_hours: '',
    is_verified: 0,
    is_published: 1,
    is_featured: 0,
    status: 'active'
  };

  formWrapper.innerHTML = `
    <form id="place-edit-form" class="admin-form">
      <div class="form-grid-2">
        <!-- Main Column -->
        <div class="form-col-main">
          <div class="form-section">
            <h3 class="form-section-title">المعلومات الأساسية</h3>
            
            <div class="form-group">
              <label class="form-label required">اسم المكان أو النشاط:</label>
              <input type="text" name="name" class="form-input" required value="${escapeHtml(p.name)}" placeholder="مثال: مطعم النيل للمأكولات البحرية"/>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label required">القسم الرئيسي:</label>
                <select name="category" class="form-select" required>
                  ${categories.map(c => `
                    <option value="${escapeHtml(c.name)}" ${c.name === p.category ? 'selected' : ''}>${escapeHtml(c.name)}</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">القسم الفرعي:</label>
                <input type="text" name="subcategory" class="form-input" value="${escapeHtml(p.subcategory || '')}" placeholder="مثال: أسماك ومأكولات بحرية"/>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">الوصف التفصيلي:</label>
              <textarea name="description" class="form-textarea" rows="4" placeholder="وصف النشاط، الخدمات والمنتجات المقدمة...">${escapeHtml(p.description || '')}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">العنوان والموقع الجغرافي</h3>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label required">المنطقة / المركز:</label>
                <select name="area" class="form-select">
                  <option value="المنزلة" ${p.area === 'المنزلة' ? 'selected' : ''}>المنزلة</option>
                  <option value="المطرية" ${p.area === 'المطرية' ? 'selected' : ''}>المطرية</option>
                  <option value="العزيزة" ${p.area === 'العزيزة' ? 'selected' : ''}>العزيزة</option>
                  <option value="البصراط" ${p.area === 'البصراط' ? 'selected' : ''}>البصراط</option>
                  <option value="ميت مرجا" ${p.area === 'ميت مرجا' ? 'selected' : ''}>ميت مرجا</option>
                  <option value="أخرى" ${p.area === 'أخرى' ? 'selected' : ''}>أخرى</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">العنوان بالتفصيل:</label>
                <input type="text" name="address" class="form-input" value="${escapeHtml(p.address || '')}" placeholder="الشارع، بجوار معالم معروفة"/>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">إحداثيات خط العرض (Latitude):</label>
                <input type="text" name="latitude" class="form-input" dir="ltr" value="${escapeHtml(p.latitude || '')}" placeholder="31.157..."/>
              </div>
              <div class="form-group">
                <label class="form-label">إحداثيات خط الطول (Longitude):</label>
                <input type="text" name="longitude" class="form-input" dir="ltr" value="${escapeHtml(p.longitude || '')}" placeholder="31.936..."/>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">رابط خرائط جوجل (Google Maps URL):</label>
              <input type="url" name="google_maps_url" class="form-input" dir="ltr" value="${escapeHtml(p.google_maps_url || '')}" placeholder="https://maps.google.com/..."/>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">بيانات التواصل والسوشيال ميديا</h3>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">رقم الهاتف:</label>
                <input type="tel" name="phone" class="form-input" dir="ltr" value="${escapeHtml(p.phone || '')}" placeholder="010XXXXXXXX"/>
              </div>
              <div class="form-group">
                <label class="form-label">رقم الواتساب:</label>
                <input type="tel" name="whatsapp" class="form-input" dir="ltr" value="${escapeHtml(p.whatsapp || '')}" placeholder="01XXXXXXXXX"/>
              </div>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">رابط فيسبوك:</label>
                <input type="url" name="facebook" class="form-input" dir="ltr" value="${escapeHtml(p.facebook || '')}" placeholder="https://facebook.com/..."/>
              </div>
              <div class="form-group">
                <label class="form-label">رابط إنستغرام:</label>
                <input type="url" name="instagram" class="form-input" dir="ltr" value="${escapeHtml(p.instagram || '')}" placeholder="https://instagram.com/..."/>
              </div>
              <div class="form-group">
                <label class="form-label">موقع إلكتروني:</label>
                <input type="url" name="website" class="form-input" dir="ltr" value="${escapeHtml(p.website || '')}" placeholder="https://..."/>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">مواعيد وساعات العمل:</label>
              <input type="text" name="working_hours" class="form-input" value="${escapeHtml(p.working_hours || '')}" placeholder="يومياً من 9 صباحاً حتى 11 مساءً"/>
            </div>
          </div>
        </div>

        <!-- Sidebar / Media & Settings Column -->
        <div class="form-col-side">
          <div class="form-section">
            <h3 class="form-section-title">الصورة الرئيسية (الغلاف/الشعار)</h3>
            <div class="form-group">
              <div class="image-preview-box">
                <img id="image-preview" src="${p.image || '../icons/icon-96x96.png'}" alt="معاينة الصورة" onerror="this.src='../icons/icon-96x96.png'"/>
              </div>
              <label class="form-label mt-2">رابط الصورة (URL):</label>
              <input type="url" name="image" id="input-image-url" class="form-input" dir="ltr" value="${escapeHtml(p.image || '')}" placeholder="https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/..."/>
              <small class="text-muted d-block mt-1">يمكنك نسخ الرابط من مكتبة وسائط R2</small>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">إعدادات الإدارة والحالة</h3>

            <div class="form-check-group">
              <label class="form-checkbox-label">
                <input type="checkbox" name="is_verified" value="1" ${p.is_verified ? 'checked' : ''} ${!can('places.verify') ? 'disabled' : ''}/>
                <span><strong>نشاط موثق رسمياً (شارة زرقاء ✓)</strong></span>
              </label>
              <small class="text-muted d-block ps-4">يظهر شارة التوثيق ويحظى بأولوية الظهور في نتائج البحث</small>
            </div>

            <div class="form-check-group mt-3">
              <label class="form-checkbox-label">
                <input type="checkbox" name="is_published" value="1" ${p.is_published !== 0 ? 'checked' : ''} ${!can('places.publish') ? 'disabled' : ''}/>
                <span><strong>منشور ومعروض للجمهور</strong></span>
              </label>
              <small class="text-muted d-block ps-4">في حال إلغاء التحديد، لن يظهر المكان في نتائج الموقع</small>
            </div>

            <div class="form-check-group mt-3">
              <label class="form-checkbox-label">
                <input type="checkbox" name="is_featured" value="1" ${p.is_featured ? 'checked' : ''}/>
                <span><strong>نشاط مميز (إعلان بارز)</strong></span>
              </label>
            </div>

            <div class="form-group mt-3">
              <label class="form-label">حالة الحساب:</label>
              <select name="status" class="form-select">
                <option value="active" ${p.status === 'active' ? 'selected' : ''}>نشط (Active)</option>
                <option value="pending" ${p.status === 'pending' ? 'selected' : ''}>بانتظار المراجعة (Pending)</option>
                <option value="suspended" ${p.status === 'suspended' ? 'selected' : ''}>موقوف (Suspended)</option>
              </select>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="form-section">
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-save-place">
              💾 ${isNew ? 'إضافة ونشر المكان' : 'حفظ التعديلات'}
            </button>
            <a href="#places" class="btn btn-secondary btn-block mt-2">إلغاء</a>
          </div>
        </div>
      </div>
    </form>
  `;

  // Live image preview
  const imgInput = formWrapper.querySelector('#input-image-url');
  const imgPreview = formWrapper.querySelector('#image-preview');
  imgInput.addEventListener('input', () => {
    imgPreview.src = imgInput.value.trim() || '../icons/icon-96x96.png';
  });

  // Handle Form Submit
  const form = formWrapper.querySelector('#place-edit-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = form.querySelector('#btn-save-place');
    saveBtn.disabled = true;
    saveBtn.textContent = 'جاري الحفظ...';

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name')?.trim(),
      category: formData.get('category')?.trim(),
      subcategory: formData.get('subcategory')?.trim() || null,
      description: formData.get('description')?.trim() || null,
      address: formData.get('address')?.trim() || null,
      area: formData.get('area')?.trim() || 'المنزلة',
      latitude: formData.get('latitude')?.trim() || null,
      longitude: formData.get('longitude')?.trim() || null,
      google_maps_url: formData.get('google_maps_url')?.trim() || null,
      phone: formData.get('phone')?.trim() || null,
      whatsapp: formData.get('whatsapp')?.trim() || null,
      facebook: formData.get('facebook')?.trim() || null,
      instagram: formData.get('instagram')?.trim() || null,
      website: formData.get('website')?.trim() || null,
      working_hours: formData.get('working_hours')?.trim() || null,
      image: formData.get('image')?.trim() || null,
      is_verified: formData.get('is_verified') ? 1 : 0,
      is_published: formData.get('is_published') ? 1 : 0,
      is_featured: formData.get('is_featured') ? 1 : 0,
      status: formData.get('status') || 'active'
    };

    try {
      if (isNew) {
        await AdminService.createPlace(payload);
        toast.success(`تم إنشاء مكان "${payload.name}" بنجاح!`);
      } else {
        await AdminService.updatePlace(placeId, payload);
        toast.success(`تم تحديث بيانات "${payload.name}" بنجاح!`);
      }
      window.location.hash = '#places';
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'فشل حفظ المكان في قاعدة البيانات');
      saveBtn.disabled = false;
      saveBtn.textContent = isNew ? 'إضافة ونشر المكان' : 'حفظ التعديلات';
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
