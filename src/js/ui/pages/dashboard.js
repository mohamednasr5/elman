/**
 * المنزلة وناسها — User Place Owner Dashboard
 * Mobile-first dashboard for managing places, daily offers, products, photos,
 * AI translation, AI cover generator, and verification requests.
 */

import { getPlacesByOwner, getPlace, getCategories, getPlaceOffers, getPlaceProducts, getSettings } from '../../core/db.js';
import { createPlace, updatePlace, deletePlace, addOffer, addProduct, submitVerificationRequest } from '../../services/places.service.js';
import { uploadImage } from '../../services/upload.service.js';
import { translatePlaceName, generateCoverImage } from '../../services/ai.service.js';
import { renderVerifiedBadge, renderPendingBadge, renderDeliveryBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { isAdmin } from '../../core/auth.js';
import { formatPrice } from '../../utils/arabic.js';

export async function renderDashboard($container, { user, section = 'overview', placeId = null }) {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  $container.innerHTML = `
    <div class="dashboard-layout">
      <!-- Sidebar Desktop -->
      <aside class="dashboard-sidebar" role="navigation" aria-label="لوحة التحكم">
        <div class="dashboard-sidebar__user">
          <img src="${user.photoURL || './icons/icon-72x72.png'}" class="dashboard-sidebar__avatar" alt="${user.name}" />
          <div>
            <div class="dashboard-sidebar__name">${escHtml(user.name)}</div>
            <div class="dashboard-sidebar__role">${user.role === 'admin' || user.role === 'superadmin' ? 'مدير المنصة ⭐' : 'صاحب نشاط'}</div>
          </div>
        </div>

        <nav class="dashboard-sidebar__nav">
          <a href="dashboard.html" class="dashboard-nav-item ${section === 'overview' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">📊</span> نظرة عامة
          </a>
          <a href="dashboard.html?section=places" class="dashboard-nav-item ${section === 'places' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">📍</span> أماكني
          </a>
          <a href="dashboard.html?section=add" class="dashboard-nav-item ${section === 'add' || section === 'add-place' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">➕</span> إضافة مكان جديد
          </a>
          
          ${isAdmin(user) ? `
            <div class="dashboard-nav-section">الإدارة</div>
            <a href="admin.html" class="dashboard-nav-item" style="color:var(--secondary);font-weight:bold">
              <span class="dashboard-nav-item__icon">⚙️</span> لوحة تحكم الإدارة
            </a>
          ` : ''}
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="dashboard-content" id="dashboard-main-area">
        <div class="spinner spinner-lg" style="margin:4rem auto"></div>
      </main>
    </div>
  `;

  const $mainArea = document.getElementById('dashboard-main-area');

  try {
    if (section === 'overview') {
      await renderOverviewSection($mainArea, user);
    } else if (section === 'places') {
      await renderPlacesSection($mainArea, user);
    } else if (section === 'add' || section === 'add-place') {
      await renderPlaceFormSection($mainArea, user, null);
    } else if (section === 'edit' || section === 'edit-place') {
      await renderPlaceFormSection($mainArea, user, placeId);
    } else if (section === 'offers' || section === 'place-offers') {
      await renderPlaceOffersSection($mainArea, user, placeId);
    } else if (section === 'products' || section === 'place-products') {
      await renderPlaceProductsSection($mainArea, user, placeId);
    } else if (section === 'settings' || section === 'place-settings') {
      await renderPlaceSettingsSection($mainArea, user, placeId);
    } else {
      await renderOverviewSection($mainArea, user);
    }
  } catch (err) {
    console.error('[Dashboard] Error rendering section:', err);
    $mainArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h2 class="empty-state__title">حدث خطأ أثناء تحميل البيانات</h2>
        <button class="btn btn-primary" onclick="location.reload()">تحديث</button>
      </div>
    `;
  }
}

// ── 1. Overview Section ──
async function renderOverviewSection($container, user) {
  const places = await getPlacesByOwner(user.uid);
  
  let totalViews = 0;
  let totalPhoneClicks = 0;
  let totalWaClicks = 0;
  let verifiedCount = 0;

  places.forEach(p => {
    if (p.isVerified) verifiedCount++;
    if (p.stats) {
      totalViews += (p.stats.views || 0);
      totalPhoneClicks += (p.stats.phoneClicks || 0);
      totalWaClicks += (p.stats.whatsappClicks || 0);
    }
  });

  $container.innerHTML = `
    <div class="dashboard-header animate-fade-in">
      <div>
        <h1 class="dashboard-header__title">أهلاً بك، ${escHtml(user.name.split(' ')[0])} 👋</h1>
        <div class="dashboard-header__subtitle">إليك ملخص تفاعل الزوار مع أنشطتك وأماكنك في المنزلة</div>
      </div>
      <a href="dashboard.html?section=add" class="btn btn-primary">
        <span>➕</span> إضافة مكان جديد
      </a>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid animate-fade-in-up">
      <div class="stat-card">
        <div class="stat-card__icon">🏪</div>
        <div class="stat-card__value">${places.length}</div>
        <div class="stat-card__label">إجمالي أماكني</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">⭐</div>
        <div class="stat-card__value" style="color:var(--secondary)">${verifiedCount}</div>
        <div class="stat-card__label">أماكن موثقة</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">👁️</div>
        <div class="stat-card__value">${totalViews}</div>
        <div class="stat-card__label">مشاهدات الصفحة</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">💬</div>
        <div class="stat-card__value" style="color:#25D366">${totalPhoneClicks + totalWaClicks}</div>
        <div class="stat-card__label">نقرات الاتصال والواتساب</div>
      </div>
    </div>

    <!-- Places Overview -->
    <div class="section-title">
      <span>📍</span> أماكني المسجلة
    </div>

    ${renderPlacesListHTML(places)}
  `;
}

// ── 2. Places Section ──
async function renderPlacesSection($container, user) {
  const places = await getPlacesByOwner(user.uid);

  $container.innerHTML = `
    <div class="dashboard-header animate-fade-in">
      <div>
        <h1 class="dashboard-header__title">إدارة أماكني</h1>
        <div class="dashboard-header__subtitle">تحكم في بيانات الأماكن، العروض، والمنتجات</div>
      </div>
      <a href="dashboard.html?section=add" class="btn btn-primary">
        <span>➕</span> إضافة مكان جديد
      </a>
    </div>

    ${renderPlacesListHTML(places)}
  `;
}

function renderPlacesListHTML(places) {
  if (!places || places.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">🏪</div>
        <h2 class="empty-state__title">لم تقم بإضافة أي مكان بعد</h2>
        <p class="empty-state__text">أضف محلك التجاري أو عيادتك أو خدمتك للظهور أمام آلاف المستخدمين في المنزلة</p>
        <a href="dashboard.html?section=add" class="btn btn-primary btn-lg">➕ أضف مكانك الأول الآن</a>
      </div>
    `;
  }

  return `
    <div class="my-places-list">
      ${places.map(place => {
        const placeId = place.id || place._key;
        return `
          <div class="my-place-item animate-fade-in">
            <div class="my-place-item__header">
              ${place.logoUrl || place.coverImageUrl 
                ? `<img src="${escAttr(place.logoUrl || place.coverImageUrl)}" class="my-place-item__img" alt="${escAttr(place.name)}" />`
                : `<div class="my-place-item__img-placeholder">🏪</div>`
              }
              <div class="my-place-item__info">
                <div class="my-place-item__name">
                  ${escHtml(place.name)}
                  ${place.isVerified ? renderVerifiedBadge() : (place.verificationStatus === 'verification_requested' ? renderPendingBadge() : '')}
                  ${place.deliveryType ? renderDeliveryBadge(place.deliveryType) : ''}
                </div>
                <div class="my-place-item__meta">
                  <span class="chip chip--primary">📍 ${escHtml(place.area || 'المنزلة')}</span>
                  <a href="place.html?slug=${escAttr(place.slug)}" target="_blank" style="font-size:var(--font-size-xs)">🔗 الصفحة العامة</a>
                </div>
              </div>

              <div class="my-place-item__actions">
                <a href="dashboard.html?section=edit&id=${escAttr(placeId)}" class="btn btn-sm btn-outline">✏️ تعديل</a>
                <a href="dashboard.html?section=offers&id=${escAttr(placeId)}" class="btn btn-sm btn-secondary">🏷️ العروض</a>
                ${place.isVerified ? `
                  <a href="dashboard.html?section=products&id=${escAttr(placeId)}" class="btn btn-sm btn-primary">🛍️ المنتجات</a>
                ` : ''}
              </div>
            </div>

            <div class="my-place-item__body">
              <div class="my-place-stat">
                <div class="my-place-stat__value">${place.stats?.views || 0}</div>
                <div class="my-place-stat__label">مشاهدات</div>
              </div>
              <div class="my-place-stat">
                <div class="my-place-stat__value">${place.stats?.phoneClicks || 0}</div>
                <div class="my-place-stat__label">اتصالات</div>
              </div>
              <div class="my-place-stat">
                <div class="my-place-stat__value">${place.stats?.whatsappClicks || 0}</div>
                <div class="my-place-stat__label">واتساب</div>
              </div>
              <div class="my-place-stat">
                <div class="my-place-stat__value">${place.stats?.directionsClicks || 0}</div>
                <div class="my-place-stat__label">نقرات الخريطة</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── 3. Place Add / Edit Form Section ──
async function renderPlaceFormSection($container, user, placeId = null) {
  const isEdit = !!placeId;
  let place = null;
  if (isEdit) {
    place = await getPlace(placeId);
    if (!place) {
      $container.innerHTML = `<div class="empty-state"><h2>المكان غير موجود</h2></div>`;
      return;
    }
  }

  const categories = await getCategories();

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">${isEdit ? `تعديل مكان: ${escHtml(place.name)}` : 'إضافة مكان جديد'}</h1>
        <div class="dashboard-header__subtitle">أدخل جميع المعلومات بدقة لضمان سهولة عثور العملاء عليك</div>
      </div>
      <a href="dashboard.html?section=places" class="btn btn-outline">← عودة للأماكن</a>
    </div>

    <form id="place-form" class="animate-fade-in-up">
      
      <!-- Basic Info -->
      <div class="form-section">
        <h2 class="form-section__title"><span>📍</span> المعلومات الأساسية</h2>
        
        <div class="form-group">
          <label class="form-label">اسم المكان أو النشاط أو المهنة / الحرفي <span class="required">*</span></label>
          <div style="display:flex;gap:var(--space-2)">
            <input type="text" id="p-name" class="form-input" required placeholder="مثال: ورشة نجار فلان، السباك أحمد، صيدلية الأمل، دكتور علي" value="${escAttr(place?.name || '')}" />
            <button type="button" class="btn btn-secondary" id="btn-ai-translate-name" title="ترجمة الاسم بالذكاء الاصطناعي">
              ✨ ترجمة En
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">الاسم بالإنجليزية (اختياري)</label>
            <input type="text" id="p-name-en" class="form-input" placeholder="El Amal Pharmacy" value="${escAttr(place?.nameEn || '')}" style="direction:ltr;text-align:left" />
          </div>

          <div class="form-group">
            <label class="form-label">التصنيف الرئيسي <span class="required">*</span></label>
            <select id="p-category" class="form-select" required>
              <option value="">اختر التصنيف...</option>
              ${categories.map(c => `
                <option value="${c.slug || c._key}" ${place?.categoryId === (c.slug || c._key) ? 'selected' : ''}>
                  ${c.icon || '📁'} ${c.name}
                </option>
              `).join('')}
              <option value="printing" ${place?.categoryId === 'printing' ? 'selected' : ''}>🖨️ مطبعة ودعاية وإعلان</option>
              <option value="other" ${place?.customCategory ? 'selected' : ''}>✨ أخرى (اكتب تصنيفاً جديداً)</option>
            </select>
          </div>
        </div>

        <!-- Custom Category Input Box (shows when 'other' is selected) -->
        <div class="form-group animate-fade-in" id="custom-category-group" style="${place?.customCategory ? '' : 'display:none'}">
          <label class="form-label">اكتب اسم التصنيف الجديد <span class="required">*</span></label>
          <div style="display:flex;gap:var(--space-2)">
            <input type="text" id="p-custom-category" class="form-input" placeholder="مثال: مطبعة، ستوديو تصوير، مركز تدريب، محل حيوانات أليفة" value="${escAttr(place?.customCategory || '')}" />
          </div>
          <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:4px">
            💡 سيتم إرسال هذا التصنيف للإدارة لاعتماده وإضافته في دليل المنزلة وناسها.
          </p>
        </div>

        <!-- Vehicle Type for Delivery -->
        <div class="form-group" id="delivery-type-group" style="${place?.categoryId?.includes('delivery') ? '' : 'display:none'}">
          <label class="form-label">نوع وسيلة التوصيل</label>
          <select id="p-delivery-type" class="form-select">
            <option value="">غير محدد</option>
            <option value="motorcycle" ${place?.deliveryType === 'motorcycle' ? 'selected' : ''}>🏍️ موتوسيكل</option>
            <option value="tuktuk" ${place?.deliveryType === 'tuktuk' ? 'selected' : ''}>🛺 توكتوك</option>
            <option value="car" ${place?.deliveryType === 'car' ? 'selected' : ''}>🚗 سيارة</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">وصف المكان والخدمات المقدمة</label>
          <textarea id="p-desc" class="form-textarea" placeholder="اكتب نبذة عن المكان، المنتجات، التخصصات، وسنوات الخبرة...">${escHtml(place?.description || '')}</textarea>
        </div>
      </div>

      <!-- Contact & Location -->
      <div class="form-section">
        <h2 class="form-section__title"><span>📞</span> التواصل والموقع</h2>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">رقم الهاتف <span class="required">*</span></label>
            <input type="tel" id="p-phone" class="form-input" required placeholder="01012345678" value="${escAttr(place?.phone || '')}" style="direction:ltr;text-align:right" />
          </div>

          <div class="form-group">
            <label class="form-label">رقم WhatsApp للتواصل المباشر</label>
            <input type="tel" id="p-whatsapp" class="form-input" placeholder="01012345678" value="${escAttr(place?.whatsapp || '')}" style="direction:ltr;text-align:right" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">المنطقة داخل المنزلة</label>
            <input type="text" id="p-area" class="form-input" placeholder="مثال: وسط البلد، شارع البحر، القومية، المعهد الديني" value="${escAttr(place?.area || 'المنزلة')}" />
          </div>

          <div class="form-group">
            <label class="form-label">العنوان بالتفصيل</label>
            <input type="text" id="p-address" class="form-input" placeholder="شارع الجيش، بجوار برج الأطباء" value="${escAttr(place?.address || '')}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">رابط خرائط جوجل (Google Maps Link)</label>
          <input type="url" id="p-maps" class="form-input" placeholder="https://maps.app.goo.gl/..." value="${escAttr(place?.mapsLink || '')}" style="direction:ltr;text-align:left" />
        </div>
      </div>

      <!-- Images & Branding -->
      <div class="form-section">
        <h2 class="form-section__title"><span>🖼️</span> الصور والهوية</h2>

        <!-- Cover Image -->
        <div class="form-group">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">
            <label class="form-label">صورة الغلاف (Cover Image)</label>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-ai-gen-cover">
              ✨ إنشاء غلاف بالذكاء الاصطناعي
            </button>
          </div>
          <div class="file-upload" id="cover-upload-zone">
            <div class="file-upload__icon">🌅</div>
            <div class="file-upload__text">اضغط هنا لاختيار صورة الغلاف أو اسحبها إلى هنا</div>
            <div class="file-upload__hint">يُفضل مقاس عريض بجودة واضحة (الحد الأقصى 5 ميجابايت)</div>
            <input type="file" id="p-cover-file" accept="image/jpeg,image/png,image/webp" />
          </div>
          <input type="hidden" id="p-cover-url" value="${escAttr(place?.coverImageUrl || '')}" />
          <div id="cover-preview-wrapper" style="margin-top:var(--space-3);${place?.coverImageUrl ? '' : 'display:none'}">
            <img id="cover-preview-img" src="${escAttr(place?.coverImageUrl || '')}" style="max-height:160px;width:100%;object-fit:cover;border-radius:var(--radius-md)" />
          </div>
        </div>

        <!-- Logo -->
        <div class="form-group">
          <label class="form-label">شعار المكان أو الصورة الشخصية (Logo / Icon)</label>
          <div class="file-upload" id="logo-upload-zone" style="padding:var(--space-4)">
            <div class="file-upload__text">📷 اضغط لاختيار اللوجو</div>
            <input type="file" id="p-logo-file" accept="image/jpeg,image/png,image/webp" />
          </div>
          <input type="hidden" id="p-logo-url" value="${escAttr(place?.logoUrl || '')}" />
          <div id="logo-preview-wrapper" style="margin-top:var(--space-3);${place?.logoUrl ? '' : 'display:none'}">
            <img id="logo-preview-img" src="${escAttr(place?.logoUrl || '')}" style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);border:2px solid var(--border)" />
          </div>
        </div>
      </div>

      <!-- Working Hours Section -->
      <div class="form-section">
        <h2 class="form-section__title"><span>🕒</span> مواعيد وساعات العمل</h2>
        
        <!-- Quick 24/7 Toggle -->
        <div class="form-group" style="margin-bottom:var(--space-4);background:var(--surface-2);padding:var(--space-4);border-radius:var(--radius-md);border:1px solid var(--border)">
          <label style="display:flex;align-items:center;gap:var(--space-3);cursor:pointer;font-weight:var(--font-weight-bold)">
            <input type="checkbox" id="p-always-open" style="width:18px;height:18px" ${place?.alwaysOpen ? 'checked' : ''} />
            <span>🟢 مفتوح دائماً على مدار 24 ساعة (طوال أيام الأسبوع)</span>
          </label>
        </div>

        <div id="working-hours-schedule" style="${place?.alwaysOpen ? 'display:none' : ''}">
          <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-3)">
            حدد أوقات العمل لكل يوم أو علم على "مغلق" لأيام العطلات:
          </p>

          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              { key: 'saturday', label: 'السبت' },
              { key: 'sunday', label: 'الأحد' },
              { key: 'monday', label: 'الاثنين' },
              { key: 'tuesday', label: 'الثلاثاء' },
              { key: 'wednesday', label: 'الأربعاء' },
              { key: 'thursday', label: 'الخميس' },
              { key: 'friday', label: 'الجمعة' }
            ].map(day => {
              const h = place?.workingHours?.[day.key] || { open: '09:00', close: '22:00', closed: false };
              return `
                <div style="display:flex;align-items:center;gap:var(--space-2);background:var(--surface-2);padding:6px 12px;border-radius:var(--radius-md);flex-wrap:wrap">
                  <div style="min-width:70px;font-weight:var(--font-weight-semibold)">${day.label}</div>
                  
                  <div style="display:flex;align-items:center;gap:4px">
                    <span style="font-size:var(--font-size-xs);color:var(--text-muted)">من:</span>
                    <input type="time" id="wh-${day.key}-open" class="form-input" style="padding:4px 8px;font-size:var(--font-size-xs);width:110px" value="${escAttr(h.open || '09:00')}" ${h.closed ? 'disabled' : ''} />
                  </div>

                  <div style="display:flex;align-items:center;gap:4px">
                    <span style="font-size:var(--font-size-xs);color:var(--text-muted)">إلى:</span>
                    <input type="time" id="wh-${day.key}-close" class="form-input" style="padding:4px 8px;font-size:var(--font-size-xs);width:110px" value="${escAttr(h.close || '22:00')}" ${h.closed ? 'disabled' : ''} />
                  </div>

                  <label style="margin-right:auto;display:flex;align-items:center;gap:4px;cursor:pointer;font-size:var(--font-size-xs);color:var(--danger)">
                    <input type="checkbox" id="wh-${day.key}-closed" onchange="toggleDayHours('${day.key}', this.checked)" ${h.closed ? 'checked' : ''} />
                    <span>مغلق</span>
                  </label>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Services & Tags -->
      <div class="form-section">
        <h2 class="form-section__title"><span>✨</span> الخدمات والمميزات الإضافية</h2>
        <div class="form-group">
          <label class="form-label">اكتب الخدمات مفصولة بفواصل (، أو ,)</label>
          <input type="text" id="p-services" class="form-input" placeholder="توصيل للمنازل، دفع بالفيزا، متاح 24 ساعة، كشف منزلي" value="${escAttr(place?.services ? place.services.join('، ') : '')}" />
        </div>
      </div>

      <!-- Submit buttons -->
      <div style="display:flex;gap:var(--space-3);padding-bottom:var(--space-8)">
        <button type="submit" class="btn btn-primary btn-lg" id="btn-save-place">
          <span>💾</span> ${isEdit ? 'حفظ التعديلات' : 'إضافة المكان إلى الدليل'}
        </button>
        <a href="dashboard.html?section=places" class="btn btn-ghost btn-lg">إلغاء</a>
      </div>

    </form>
  `;

  // ── Handlers ──

  // Category toggle for delivery vehicle and custom category
  document.getElementById('p-category')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const isDelivery = val.includes('delivery');
    const isOther = val === 'other';

    const deliveryGroup = document.getElementById('delivery-type-group');
    if (deliveryGroup) deliveryGroup.style.display = isDelivery ? 'block' : 'none';

    const customCatGroup = document.getElementById('custom-category-group');
    if (customCatGroup) customCatGroup.style.display = isOther ? 'block' : 'none';
  });

  // Always Open 24/7 toggle
  document.getElementById('p-always-open')?.addEventListener('change', (e) => {
    const schedule = document.getElementById('working-hours-schedule');
    if (schedule) schedule.style.display = e.target.checked ? 'none' : 'block';
  });

  // AI Name Translation
  document.getElementById('btn-ai-translate-name')?.addEventListener('click', async () => {
    const name = document.getElementById('p-name')?.value.trim();
    if (!name) {
      toast.warning('اكتب اسم المكان بالعربية أولاً');
      return;
    }

    const btn = document.getElementById('btn-ai-translate-name');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const translated = await translatePlaceName(name);
      const enInput = document.getElementById('p-name-en');
      if (enInput) enInput.value = translated;
      toast.success('تمت الترجمة بالذكاء الاصطناعي ✨');
    } catch {
      toast.error('تعذرت الترجمة');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });

  // AI Cover Generation
  document.getElementById('btn-ai-gen-cover')?.addEventListener('click', async () => {
    const name = document.getElementById('p-name')?.value.trim();
    const cat = document.getElementById('p-category')?.value;
    if (!name) {
      toast.warning('اكتب اسم المكان أولاً لإنشاء صورة مناسبة له');
      return;
    }

    const btn = document.getElementById('btn-ai-gen-cover');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const url = await generateCoverImage(name, cat);
      if (url) {
        document.getElementById('p-cover-url').value = url;
        const preview = document.getElementById('cover-preview-img');
        const wrapper = document.getElementById('cover-preview-wrapper');
        if (preview && wrapper) {
          preview.src = url;
          wrapper.style.display = 'block';
        }
        toast.success('تم إنشاء الغلاف بنجاح ✨');
      }
    } catch (err) {
      toast.error(err.message || 'تعذر إنشاء الغلاف');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });

  // Upload Cover
  setupFileUpload('cover-upload-zone', 'p-cover-file', async (file) => {
    const res = await uploadImage(file, 'places');
    document.getElementById('p-cover-url').value = res.url;
    const preview = document.getElementById('cover-preview-img');
    const wrapper = document.getElementById('cover-preview-wrapper');
    if (preview && wrapper) { preview.src = res.url; wrapper.style.display = 'block'; }
    toast.success('تم رفع صورة الغلاف');
  });

  // Upload Logo
  setupFileUpload('logo-upload-zone', 'p-logo-file', async (file) => {
    const res = await uploadImage(file, 'places');
    document.getElementById('p-logo-url').value = res.url;
    const preview = document.getElementById('logo-preview-img');
    const wrapper = document.getElementById('logo-preview-wrapper');
    if (preview && wrapper) { preview.src = res.url; wrapper.style.display = 'block'; }
    toast.success('تم رفع اللوجو');
  });

  // Form Submit
  document.getElementById('place-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-place');
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;

    try {
      const rawServices = document.getElementById('p-services')?.value || '';
      const services = rawServices.split(/[,،]/).map(s => s.trim()).filter(Boolean);

      const categoryVal = document.getElementById('p-category').value;
      const customCategory = categoryVal === 'other' ? (document.getElementById('p-custom-category')?.value.trim() || '') : null;

      if (categoryVal === 'other' && !customCategory) {
        toast.warning('يرجى كتابة اسم التصنيف الجديد');
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
        return;
      }

      const alwaysOpen = document.getElementById('p-always-open')?.checked || false;
      const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const workingHours = {};

      if (alwaysOpen) {
        days.forEach(d => {
          workingHours[d] = { open: '00:00', close: '23:59', closed: false };
        });
      } else {
        days.forEach(d => {
          const closed = document.getElementById(`wh-${d}-closed`)?.checked || false;
          const open = document.getElementById(`wh-${d}-open`)?.value || '09:00';
          const close = document.getElementById(`wh-${d}-close`)?.value || '22:00';
          workingHours[d] = { open, close, closed };
        });
      }

      const placeData = {
        name: document.getElementById('p-name').value,
        nameEn: document.getElementById('p-name-en').value,
        categoryId: categoryVal === 'other' ? 'other' : categoryVal,
        customCategory: customCategory,
        deliveryType: document.getElementById('p-delivery-type')?.value || null,
        description: document.getElementById('p-desc').value,
        phone: document.getElementById('p-phone').value,
        whatsapp: document.getElementById('p-whatsapp').value,
        area: document.getElementById('p-area').value,
        address: document.getElementById('p-address').value,
        mapsLink: document.getElementById('p-maps').value,
        coverImageUrl: document.getElementById('p-cover-url').value,
        logoUrl: document.getElementById('p-logo-url').value,
        alwaysOpen,
        workingHours,
        services
      };

      if (isEdit) {
        await updatePlace(placeId, placeData);
        toast.success('تم تحديث بيانات المكان بنجاح');
      } else {
        const newId = await createPlace(placeData, user);
        toast.success('تمت إضافة المكان بنجاح إلى الدليل! 🎉');
      }

      // If user proposed custom category, also register it in categoryRequests node for admin review
      if (customCategory) {
        try {
          const catReqRef = getDB().ref('categoryRequests').push();
          await catReqRef.set({
            id: catReqRef.key,
            categoryName: customCategory,
            placeName: placeData.name,
            ownerName: user.name || user.displayName || 'مستخدم',
            ownerUid: user.uid,
            status: 'pending',
            createdAt: serverTimestamp()
          });
        } catch (_) {}
      }

      window.location.href = 'dashboard.html?section=places';
    } catch (err) {
      console.error('Save place error:', err);
      toast.error(err.message || 'فشل حفظ المكان');
    } finally {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
    }
  });
}

// ── 4. Manage Place Offers Section ──
async function renderPlaceOffersSection($container, user, placeId) {
  const place = await getPlace(placeId);
  if (!place) { $container.innerHTML = 'المكان غير موجود'; return; }

  const offers = await getPlaceOffers(placeId);
  const maxAllowed = place.isVerified ? 3 : 1;

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة عروض: ${escHtml(place.name)}</h1>
        <div class="dashboard-header__subtitle">
          الحد المسموح لك: <strong>${maxAllowed}</strong> عروض نشطة 
          (${place.isVerified ? 'حساب موثق ✓' : 'حساب غير موثق — وثّق مكانك للحصول على 3 عروض'})
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn-primary" id="btn-open-add-offer" ${offers.length >= maxAllowed ? 'disabled title="تم الوصول للحد الأقصى"' : ''}>
          <span>➕</span> إضافة عرض جديد
        </button>
        <a href="dashboard.html?section=places" class="btn btn-outline">← عودة</a>
      </div>
    </div>

    <!-- Offers List -->
    <div class="my-places-list">
      ${offers.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__icon">🏷️</div>
          <h3>لا توجد عروض نشطة لهذا المكان</h3>
          <p class="empty-state__text">العروض تظهر في الصفحة الرئيسية وصفحة العروض وتجذب الزبائن</p>
        </div>
      ` : offers.map(o => `
        <div class="my-place-item">
          <div class="my-place-item__header">
            ${o.imageUrl ? `<img src="${escAttr(o.imageUrl)}" class="my-place-item__img" />` : '<div class="my-place-item__img-placeholder">🏷️</div>'}
            <div class="my-place-item__info">
              <div class="my-place-item__name">${escHtml(o.title)}</div>
              <div class="my-place-item__meta">
                <span style="font-weight:700;color:var(--accent)">${formatPrice(o.newPrice)}</span>
                ${o.oldPrice ? `<span style="text-decoration:line-through;color:var(--text-muted)">${formatPrice(o.oldPrice)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('btn-open-add-offer')?.addEventListener('click', () => {
    showAddOfferModal(place, user, () => renderPlaceOffersSection($container, user, placeId));
  });
}

function showAddOfferModal(place, user, onDone) {
  const modal = showModal({
    title: 'إضافة عرض يومي جديد',
    content: `
      <form id="add-offer-form">
        <div class="form-group">
          <label class="form-label">عنوان العرض <span class="required">*</span></label>
          <input type="text" id="off-title" class="form-input" required placeholder="مثال: خصم 20% على جميع الأدوية / ساندوتش هدية" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">السعر الجديد (ج.م) <span class="required">*</span></label>
            <input type="number" id="off-new-price" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">السعر قبل الخصم (ج.م)</label>
            <input type="number" id="off-old-price" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">وصف تفاصيل العرض</label>
          <textarea id="off-desc" class="form-textarea" placeholder="الشروط، الأصناف المشمولة..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">صورة العرض</label>
          <input type="file" id="off-file" accept="image/*" class="form-input" />
          <input type="hidden" id="off-img-url" />
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'نشر العرض',
        type: 'primary',
        onClick: async () => {
          const title = document.getElementById('off-title')?.value.trim();
          const newPrice = document.getElementById('off-new-price')?.value;
          const oldPrice = document.getElementById('off-old-price')?.value;
          const desc = document.getElementById('off-desc')?.value;
          const fileInput = document.getElementById('off-file');

          if (!title || !newPrice) {
            toast.warning('يرجى كتابة عنوان وسعر العرض');
            return;
          }

          let imageUrl = '';
          if (fileInput && fileInput.files[0]) {
            try {
              const res = await uploadImage(fileInput.files[0], 'offers');
              imageUrl = res.url;
            } catch (e) {
              console.warn(e);
            }
          }

          try {
            await addOffer(place.id || place._key, {
              title,
              newPrice,
              oldPrice,
              description: desc,
              imageUrl
            }, user);
            toast.success('تمت إضافة العرض بنجاح');
            modal.close();
            onDone();
          } catch (err) {
            toast.error(err.message || 'فشل إضافة العرض');
          }
        },
        closeOnClick: false
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}

// ── 5. Manage Place Products Section (Verified places only) ──
async function renderPlaceProductsSection($container, user, placeId) {
  const place = await getPlace(placeId);
  if (!place) { $container.innerHTML = 'المكان غير موجود'; return; }

  if (!place.isVerified && user.role !== 'admin') {
    $container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔒</div>
        <h2>المنتجات متاحة حصرياً للأماكن الموثقة</h2>
        <p class="empty-state__text">وثّق مكانك الآن لتتمكن من إضافة حتى 350 منتجاً في دليلك الرقمي</p>
        <a href="place.html?slug=${place.slug}" class="btn btn-primary">طلب التوثيق</a>
      </div>
    `;
    return;
  }

  const products = await getPlaceProducts(placeId, { limit: 350 });

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة منتجات: ${escHtml(place.name)}</h1>
        <div class="dashboard-header__subtitle">المنتجات المسجلة: ${products.length} من أصل 350 منتج</div>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn-primary" id="btn-open-add-product" ${products.length >= 350 ? 'disabled' : ''}>
          <span>➕</span> إضافة منتج
        </button>
        <a href="dashboard.html?section=places" class="btn btn-outline">← عودة</a>
      </div>
    </div>

    <!-- Products Table -->
    <div class="dashboard-table-wrapper">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>الصورة</th>
            <th>اسم المنتج</th>
            <th>السعر</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${products.length === 0 ? `
            <tr><td colspan="4" class="text-center" style="padding:2rem">لا توجد منتجات مسجلة</td></tr>
          ` : products.map(p => `
            <tr>
              <td>
                <img src="${p.imageUrl || './icons/icon-72x72.png'}" style="width:40px;height:40px;object-fit:cover;border-radius:4px" />
              </td>
              <td><strong>${escHtml(p.name)}</strong></td>
              <td>${formatPrice(p.price)}</td>
              <td>${p.inStock ? '<span class="badge badge--published">متوفر</span>' : '<span class="badge badge--suspended">نفذ</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-open-add-product')?.addEventListener('click', () => {
    showAddProductModal(place, user, () => renderPlaceProductsSection($container, user, placeId));
  });
}

function showAddProductModal(place, user, onDone) {
  const modal = showModal({
    title: 'إضافة منتج جديد',
    content: `
      <form id="add-prod-form">
        <div class="form-group">
          <label class="form-label">اسم المنتج <span class="required">*</span></label>
          <input type="text" id="prod-name" class="form-input" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">السعر (ج.م) <span class="required">*</span></label>
            <input type="number" id="prod-price" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">السعر القديم</label>
            <input type="number" id="prod-old-price" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">صورة المنتج</label>
          <input type="file" id="prod-file" accept="image/*" class="form-input" />
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'حفظ المنتج',
        type: 'primary',
        onClick: async () => {
          const name = document.getElementById('prod-name')?.value.trim();
          const price = document.getElementById('prod-price')?.value;
          const oldPrice = document.getElementById('prod-old-price')?.value;
          const fileInput = document.getElementById('prod-file');

          if (!name || !price) {
            toast.warning('يرجى ملء الاسم والسعر');
            return;
          }

          let imageUrl = '';
          if (fileInput && fileInput.files[0]) {
            try {
              const res = await uploadImage(fileInput.files[0], 'products');
              imageUrl = res.url;
            } catch (e) {
              console.warn(e);
            }
          }

          try {
            await addProduct(place.id || place._key, {
              name,
              price,
              oldPrice,
              imageUrl
            }, user);
            toast.success('تمت إضافة المنتج');
            modal.close();
            onDone();
          } catch (err) {
            toast.error(err.message || 'فشل إضافة المنتج');
          }
        },
        closeOnClick: false
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}

function setupFileUpload(zoneId, inputId, onFileSelected) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      onFileSelected(input.files[0]);
    }
  });
}

window.toggleDayHours = (dayKey, isClosed) => {
  const openInput = document.getElementById(`wh-${dayKey}-open`);
  const closeInput = document.getElementById(`wh-${dayKey}-close`);
  if (openInput) openInput.disabled = isClosed;
  if (closeInput) closeInput.disabled = isClosed;
};

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
