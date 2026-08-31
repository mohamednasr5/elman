/**
 * المنزلة وناسها — User Place Owner Dashboard
 * Mobile-first dashboard for managing places, daily offers, products, photos,
 * AI translation, AI cover generator, and verification requests.
 */

import { getPlacesByOwner, getPlace, getCategories, getPlaceOffers, getPlaceProducts, getSettings, getUserNotifications, markAllNotificationsAsRead, clearAllNotifications, getUserFollowedPlaces, getUserFollowedOffers, unfollowPlace } from '../../core/db.js';
import { createPlace, updatePlace, deletePlace, addOffer, addProduct, submitVerificationRequest } from '../../services/places.service.js';
import { uploadImage } from '../../services/upload.service.js';
import { translatePlaceName, generateCoverImage, generatePlaceLogo, generateSeoDescription, generateSeoServices } from '../../services/ai.service.js';
import { renderVerifiedBadge, renderPendingBadge, renderDeliveryBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { isAdmin } from '../../core/auth.js';
import { formatPrice, arabicMatch } from '../../utils/arabic.js';
import { extractCoordinates, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';

let _dashUser = null;
let _dashPlacesCache = null;

export async function renderDashboard($container, { user, section = 'overview', placeId = null }) {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  _dashUser = user;

  // Fetch initial notifications count
  let unreadNotifsCount = 0;
  try {
    const userNotifs = await getUserNotifications(user.uid);
    unreadNotifsCount = userNotifs.filter(n => !n.isRead).length;
  } catch (_) {}

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

        <nav class="dashboard-sidebar__nav" id="dashboard-sidebar-nav">
          <a href="dashboard.html" data-section="overview" class="dashboard-nav-item ${section === 'overview' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">📊</span> نظرة عامة
          </a>
          <a href="dashboard.html?section=places" data-section="places" class="dashboard-nav-item ${section === 'places' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">📍</span> أماكني
          </a>
          <a href="dashboard.html?section=following" data-section="following" class="dashboard-nav-item ${section === 'following' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">⭐</span> متابعاتي وعروضها
          </a>
          <a href="dashboard.html?section=add" data-section="add" class="dashboard-nav-item ${section === 'add' || section === 'add-place' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">➕</span> إضافة مكان جديد
          </a>
          <a href="dashboard.html?section=notifications" data-section="notifications" class="dashboard-nav-item ${section === 'notifications' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">🔔</span> الإشعارات والزيارات
            <span id="sidebar-notifs-badge" class="badge badge--danger" style="margin-right:auto;font-size:11px;padding:2px 6px;${unreadNotifsCount > 0 ? '' : 'display:none'}">${unreadNotifsCount}</span>
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

  setupDashboardNavigation();
  await switchDashboardSection(section, placeId, false);
}

export async function switchDashboardSection(section = 'overview', placeId = null, pushState = true) {
  const $mainArea = document.getElementById('dashboard-main-area');
  if (!$mainArea) return;

  if (pushState) {
    let newUrl = 'dashboard.html';
    if (section && section !== 'overview') {
      newUrl += `?section=${section}`;
      if (placeId) newUrl += `&id=${placeId}`;
    }
    history.pushState({ section, placeId }, '', newUrl);
  }

  // Update active sidebar tab
  document.querySelectorAll('#dashboard-sidebar-nav .dashboard-nav-item[data-section]').forEach(el => {
    const sec = el.getAttribute('data-section');
    const isActive = sec === section || (sec === 'add' && section === 'add-place');
    el.classList.toggle('active', isActive);
  });

  // Update mobile bottom nav
  document.querySelectorAll('#dash-mobile-bottom-nav [data-dash-sec]').forEach(el => {
    const sec = el.getAttribute('data-dash-sec');
    const isActive = sec === section || (sec === 'add' && (section === 'add-place' || section === 'add'));
    el.classList.toggle('active', isActive);
  });

  try {
    if (section === 'overview') {
      await renderOverviewSection($mainArea, _dashUser);
    } else if (section === 'places') {
      await renderPlacesSection($mainArea, _dashUser);
    } else if (section === 'add' || section === 'add-place') {
      await renderPlaceFormSection($mainArea, _dashUser, null);
    } else if (section === 'edit' || section === 'edit-place') {
      await renderPlaceFormSection($mainArea, _dashUser, placeId);
    } else if (section === 'offers' || section === 'place-offers') {
      await renderPlaceOffersSection($mainArea, _dashUser, placeId);
    } else if (section === 'products' || section === 'place-products') {
      await renderPlaceProductsSection($mainArea, _dashUser, placeId);
    } else if (section === 'settings' || section === 'place-settings') {
      await renderPlaceSettingsSection($mainArea, _dashUser, placeId);
    } else if (section === 'following') {
      await renderFollowingSection($mainArea, _dashUser);
    } else if (section === 'notifications') {
      await renderDashboardNotifications($mainArea, _dashUser);
    } else {
      await renderOverviewSection($mainArea, _dashUser);
    }
  } catch (err) {
    console.error('[Dashboard] Error rendering section:', err);
    $mainArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h2 class="empty-state__title">حدث خطأ أثناء تحميل البيانات</h2>
        <button class="btn btn-primary" onclick="window.switchDashboardSection('${section}', '${placeId||''}', false)">إعادة المحاولة</button>
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.switchDashboardSection = switchDashboardSection;
}

function setupDashboardNavigation() {
  const container = document.querySelector('.dashboard-layout');
  if (container && !container.dataset.listening) {
    container.dataset.listening = 'true';
    container.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="dashboard.html"]');
      if (link && !link.getAttribute('target')) {
        const url = new URL(link.href, location.href);
        if (url.pathname.endsWith('dashboard.html') || url.pathname.endsWith('/dashboard.html')) {
          e.preventDefault();
          const section = url.searchParams.get('section') || 'overview';
          const placeId = url.searchParams.get('id') || null;
          switchDashboardSection(section, placeId, true);
        }
      }
    });
  }

  // Mobile bottom nav listener
  const mobileNav = document.getElementById('dash-mobile-bottom-nav');
  if (mobileNav && !mobileNav.dataset.listening) {
    mobileNav.dataset.listening = 'true';
    mobileNav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dash-sec]');
      if (btn) {
        e.preventDefault();
        const section = btn.getAttribute('data-dash-sec');
        switchDashboardSection(section, null, true);
      }
    });
  }

  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') || 'overview';
    const placeId = params.get('id') || null;
    switchDashboardSection(section, placeId, false);
  });
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

  const currentArea = place?.area ? place.area.trim() : 'المنزلة';
  const isCustomArea = Boolean(currentArea && !MANZALA_VILLAGES_LIST.includes(currentArea));
  const currentAreaVal = isCustomArea ? 'other' : currentArea;
  const currentAreaName = isCustomArea ? currentArea : (currentArea || 'المنزلة');

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
        </div>

        <!-- Searchable Category Selector -->
        <div class="form-group" style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-4);margin-top:var(--space-2)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);flex-wrap:wrap;gap:6px">
            <label class="form-label" style="margin-bottom:0;font-weight:var(--font-weight-bold)">التصنيف الرئيسي والمهنة <span class="required">*</span></label>
            <div id="p-selected-cat-badge" style="font-size:12px;color:var(--primary);display:${place?.categoryId ? 'flex' : 'none'};align-items:center;gap:6px">
              <span>المختار:</span>
              <span id="p-selected-cat-name" class="chip chip--primary" style="font-weight:700">${place?.categoryId ? (categories.find(c => (c.slug || c._key) === place.categoryId)?.name || (place.customCategory ? place.customCategory : place.categoryId)) : ''}</span>
            </div>
          </div>

          <!-- Live Search Input -->
          <div style="position:relative;margin-bottom:10px">
            <input 
              type="search" 
              id="p-category-search-input" 
              class="form-input" 
              placeholder="🔍 ابحث في التصنيفات (اكتب أول حرفين، مثال: دكتور، سباك، صيدلية، مطعم...)" 
              autocomplete="off"
              style="padding-right:38px;background:var(--surface);border-color:var(--primary)"
            />
            <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none">🔎</span>
          </div>

          <!-- Category Quick Selection Pills Box -->
          <div id="p-category-picker-box" style="max-height:170px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:6px;padding:6px;border-radius:var(--radius-md);background:var(--surface);border:1px solid var(--border)">
            ${categories.map(c => `
              <button type="button" class="category-select-pill ${place?.categoryId === (c.slug || c._key) ? 'active' : ''}" data-cat-id="${escAttr(c.slug || c._key)}" data-cat-name="${escAttr(c.name)}">
                <span>${c.icon || '📁'}</span>
                <span>${escHtml(c.name)}</span>
              </button>
            `).join('')}
            <button type="button" class="category-select-pill ${place?.customCategory ? 'active' : ''}" data-cat-id="other" data-cat-name="أخرى (اكتب تصنيفاً جديداً)">
              <span>✨</span>
              <span>أخرى (اكتب تصنيفاً جديداً)</span>
            </button>
          </div>
          <div id="p-cat-no-match" style="display:none;padding:8px;font-size:12px;color:var(--text-muted);text-align:center">
            لم نجد تصنيفاً مطابقاً. يمكنك اختيار <strong style="color:var(--secondary,#F5A623);cursor:pointer" onclick="document.querySelector('[data-cat-id=other]')?.click()">✨ أخرى (اكتب تصنيفاً جديداً)</strong>
          </div>

          <!-- Hidden Synchronized Select for Form Validation & Submission -->
          <select id="p-category" class="form-select" style="display:none" required>
            <option value="">اختر التصنيف...</option>
            ${categories.map(c => `
              <option value="${c.slug || c._key}" ${place?.categoryId === (c.slug || c._key) ? 'selected' : ''}>
                ${c.icon || '📁'} ${c.name}
              </option>
            `).join('')}
            <option value="other" ${place?.customCategory ? 'selected' : ''}>✨ أخرى (اكتب تصنيفاً جديداً)</option>
          </select>
        </div>

        <!-- Custom Category Input Box (shows when 'other' is selected) -->
        <div class="form-group animate-fade-in" id="custom-category-group" style="${place?.customCategory ? '' : 'display:none'}">
          <label class="form-label">اكتب اسم التصنيف الجديد <span class="required">*</span></label>
          <div style="display:flex;gap:var(--space-2)">
            <input type="text" id="p-custom-category" class="form-input" placeholder="مثال: مطبعة، ستوديو تصوير، مركز تدريب، محل حيوانات أليفة" value="${escAttr(place?.customCategory || '')}" />
          </div>
          <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:4px">
            💡 سيتم إرسال هذا التصنيف للإدارة لاعتماده وإضافته في دليل المنزلة والمطرية الرقمي.
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
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);flex-wrap:wrap;gap:6px">
            <label class="form-label" style="margin-bottom:0">وصف المكان والنشاط</label>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-ai-gen-desc" title="توليد وصف متوافق 100% مع محركات البحث وسيو المنزلة">
              ✨ توليد وصف سيو (SEO) بالذكاء الاصطناعي
            </button>
          </div>
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

        <!-- Searchable Area / Village Selector -->
        <div class="form-group" style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-4);margin-top:var(--space-2)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);flex-wrap:wrap;gap:6px">
            <label class="form-label" style="margin-bottom:0;font-weight:var(--font-weight-bold)">المنطقة داخل المنزلة / المطرية <span class="required">*</span></label>
            <div id="p-selected-area-badge" style="font-size:12px;color:var(--primary);display:flex;align-items:center;gap:6px">
              <span>المختار:</span>
              <span id="p-selected-area-name" class="chip chip--primary" style="font-weight:700">${escHtml(currentAreaName)}</span>
            </div>
          </div>

          <!-- Live Smart Search Input -->
          <div style="position:relative;margin-bottom:10px">
            <input 
              type="search" 
              id="p-area-search-input" 
              class="form-input" 
              placeholder="🔍 ابحث بالاسم عن قريتك أو منطقتك (54 قرية ومدينة)..." 
              autocomplete="off"
              style="padding-right:38px;background:var(--surface);border-color:var(--primary)"
            />
            <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none">🗺️</span>
          </div>

          <!-- Area Quick Selection Pills Box -->
          <div id="p-area-picker-box" style="max-height:160px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:6px;padding:6px;border-radius:var(--radius-md);background:var(--surface);border:1px solid var(--border)">
            ${MANZALA_VILLAGES_LIST.map(v => `
              <button type="button" class="area-select-pill ${currentAreaVal === v ? 'active' : ''}" data-area-name="${escAttr(v)}">
                <span>📍</span>
                <span>${escHtml(v)}</span>
              </button>
            `).join('')}
            <button type="button" class="area-select-pill ${isCustomArea ? 'active' : ''}" data-area-name="other">
              <span>✏️</span>
              <span>بلد أو قرية أخرى...</span>
            </button>
          </div>
          <div id="p-area-no-match" style="display:none;padding:8px;font-size:12px;color:var(--text-muted);text-align:center">
            لم نجد قرية مطابقة. يمكنك اختيار <strong style="color:var(--secondary,#F5A623);cursor:pointer" onclick="document.querySelector('[data-area-name=other]')?.click()">✏️ بلد أو قرية أخرى...</strong> وكتابتها يدوياً.
          </div>

          <!-- Hidden Input for Form Submission -->
          <input type="hidden" id="p-area" value="${escAttr(currentAreaVal)}" />

          <!-- Custom Area Text Input (Shows when 'other' is selected) -->
          <div class="form-group animate-fade-in" id="custom-area-group" style="margin-top:10px;${isCustomArea ? '' : 'display:none'}">
            <label class="form-label" style="font-size:12.5px;font-weight:700">اكتب اسم البلد أو القرية الجديدة <span class="required">*</span></label>
            <input type="text" id="p-custom-area" class="form-input" placeholder="مثال: ميت مرجا سلسيل، الكردي، أو أي قرية أخرى..." value="${escAttr(isCustomArea ? place?.area : '')}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">العنوان بالتفصيل أو الشارع</label>
          <input type="text" id="p-address" class="form-input" placeholder="مثال: شارع البحر، بجوار المسجد الكبير" value="${escAttr(place?.address || '')}" />
        </div>

        <div class="form-group">
          <label class="form-label">رابط خرائط جوجل (Google Maps Link)</label>
          <input type="text" id="p-maps" class="form-input" placeholder="مثال: https://maps.app.goo.gl/ruGRycBTGHt8Ecr2A" value="${escAttr(place?.mapsLink || '')}" style="direction:ltr;text-align:left" />
          <p style="font-size:11.5px;color:var(--text-muted);margin-top:4px">💡 يمكنك وضع رابط خرائط جوجل أو كود بلس أو العنوان وسيتم استخراج وتثبيت موقعك الفعلي بدقة على الخريطة.</p>
          <div id="map-live-preview-box" style="margin-top:8px;${place?.location?.lat ? '' : 'display:none'}">
            ${place?.location?.lat ? `
              <div style="padding:8px 12px;background:rgba(16, 185, 129, 0.08);border:1px solid rgba(16, 185, 129, 0.3);border-radius:var(--radius-md)">
                <div style="font-size:12px;font-weight:700;color:#059669;margin-bottom:6px;display:flex;align-items:center;gap:6px">
                  <span>✅</span> تم استخراج الموقع الجغرافي بدقة (${Number(place.location.lat).toFixed(4)}, ${Number(place.location.lng).toFixed(4)})
                </div>
                <iframe 
                  src="https://maps.google.com/maps?q=${place.location.lat},${place.location.lng}&hl=ar&z=17&output=embed" 
                  style="border:0;width:100%;height:150px;border-radius:var(--radius-sm);display:block" 
                  loading="lazy">
                </iframe>
              </div>
            ` : ''}
          </div>
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
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">
            <label class="form-label">شعار المكان أو الصورة الشخصية (Logo / Icon)</label>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-ai-gen-logo">
              ✨ إنشاء لوجو ذكي بالاسم
            </button>
          </div>
          <div class="file-upload" id="logo-upload-zone" style="padding:var(--space-4)">
            <div class="file-upload__text">📷 اضغط لاختيار اللوجو أو اسحبه هنا</div>
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

      <!-- Social Media & Website Links -->
      <div class="form-section">
        <h2 class="form-section__title"><span>🌐</span> وسائل التواصل الاجتماعي والموقع</h2>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:var(--space-3)">
          أضف روابط حساباتك الرسمية، وسيتم عرض الأيقونات الأصلية للأشياء المكتوبة فقط في صفحة المكان:
        </p>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">📘 رابط صفحة Facebook</label>
            <input type="url" id="p-social-facebook" class="form-input" placeholder="https://facebook.com/yourpage" value="${escAttr(place?.social?.facebook || '')}" style="direction:ltr;text-align:left" />
          </div>

          <div class="form-group">
            <label class="form-label">✖️ رابط حساب منصة X (تويتر)</label>
            <input type="url" id="p-social-x" class="form-input" placeholder="https://x.com/yourhandle" value="${escAttr(place?.social?.x || place?.social?.twitter || '')}" style="direction:ltr;text-align:left" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">📷 رابط حساب Instagram</label>
            <input type="url" id="p-social-instagram" class="form-input" placeholder="https://instagram.com/yourprofile" value="${escAttr(place?.social?.instagram || '')}" style="direction:ltr;text-align:left" />
          </div>

          <div class="form-group">
            <label class="form-label">🎵 رابط حساب TikTok</label>
            <input type="url" id="p-social-tiktok" class="form-input" placeholder="https://tiktok.com/@youraccount" value="${escAttr(place?.social?.tiktok || '')}" style="direction:ltr;text-align:left" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">🧵 رابط حساب Threads</label>
            <input type="url" id="p-social-threads" class="form-input" placeholder="https://threads.net/@youraccount" value="${escAttr(place?.social?.threads || '')}" style="direction:ltr;text-align:left" />
          </div>

          <div class="form-group">
            <label class="form-label">▶️ رابط قناة YouTube</label>
            <input type="url" id="p-social-youtube" class="form-input" placeholder="https://youtube.com/@yourchannel" value="${escAttr(place?.social?.youtube || '')}" style="direction:ltr;text-align:left" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">🌍 رابط الموقع الإلكتروني الرسمي (Website)</label>
          <input type="url" id="p-social-website" class="form-input" placeholder="https://www.yourwebsite.com" value="${escAttr(place?.social?.website || '')}" style="direction:ltr;text-align:left" />
        </div>
      </div>

      <!-- Services & Tags -->
      <div class="form-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);flex-wrap:wrap;gap:6px">
          <h2 class="form-section__title" style="margin-bottom:0"><span>✨</span> الخدمات والكلمات المفتاحية</h2>
          <button type="button" class="btn btn-sm btn-secondary" id="btn-ai-gen-services" title="اقتراح أهم الكلمات المفتاحية والخدمات للظهور في نتائج البحث الأولى">
            ✨ توليد خدمات سيو (SEO) بالذكاء الاصطناعي
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">اكتب الخدمات مفصولة بفواصل (، أو ,)</label>
          <input type="text" id="p-services" class="form-input" placeholder="توصيل للمنازل، دفع بالفيزا، متاح 24 ساعة، كشف منزلي" value="${escAttr(place?.services ? place.services.join('، ') : '')}" />
          <div class="form-hint">الكلمات والخدمات المكتوبة هنا تجعل مكانك يظهر في صدارة نتائج البحث عند كتابة أي منها.</div>
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

  // Live Category Search Filter & Pill Selection
  const catSearchInput = document.getElementById('p-category-search-input');
  const catPickerBox = document.getElementById('p-category-picker-box');
  const catPills = catPickerBox ? catPickerBox.querySelectorAll('.category-select-pill') : [];
  const catNoMatch = document.getElementById('p-cat-no-match');
  const hiddenSelect = document.getElementById('p-category');
  const selectedBadge = document.getElementById('p-selected-cat-badge');
  const selectedBadgeName = document.getElementById('p-selected-cat-name');

  catSearchInput?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let visibleCount = 0;
    catPills.forEach(pill => {
      const name = (pill.getAttribute('data-cat-name') || '').toLowerCase();
      const id = (pill.getAttribute('data-cat-id') || '').toLowerCase();
      const match = !q || name.includes(q) || id.includes(q);
      pill.style.display = match ? 'inline-flex' : 'none';
      if (match) visibleCount++;
    });
    if (catNoMatch) catNoMatch.style.display = visibleCount === 0 ? 'block' : 'none';
  });

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const catId = pill.getAttribute('data-cat-id');
      const catName = pill.getAttribute('data-cat-name');

      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      if (hiddenSelect) {
        hiddenSelect.value = catId;
        hiddenSelect.dispatchEvent(new Event('change'));
      }

      if (selectedBadge && selectedBadgeName) {
        selectedBadgeName.textContent = catName;
        selectedBadge.style.display = 'flex';
      }

      const deliveryGroup = document.getElementById('delivery-type-group');
      if (deliveryGroup) deliveryGroup.style.display = (catId || '').includes('delivery') ? 'block' : 'none';

      const customCatGroup = document.getElementById('custom-category-group');
      if (customCatGroup) customCatGroup.style.display = catId === 'other' ? 'block' : 'none';
    });
  });

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

  // Live Area Search Filter & Pill Selection
  const areaSearchInput = document.getElementById('p-area-search-input');
  const areaPickerBox = document.getElementById('p-area-picker-box');
  const areaPills = areaPickerBox ? areaPickerBox.querySelectorAll('.area-select-pill') : [];
  const areaNoMatch = document.getElementById('p-area-no-match');
  const hiddenAreaInput = document.getElementById('p-area');
  const customAreaGroup = document.getElementById('custom-area-group');
  const customAreaInput = document.getElementById('p-custom-area');
  const selectedAreaBadgeName = document.getElementById('p-selected-area-name');

  areaSearchInput?.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    let visibleCount = 0;
    areaPills.forEach(pill => {
      const name = pill.getAttribute('data-area-name') || '';
      const text = pill.textContent || '';
      const match = !q || arabicMatch(name, q) || arabicMatch(text, q);
      pill.style.display = match ? 'inline-flex' : 'none';
      if (match) visibleCount++;
    });
    if (areaNoMatch) areaNoMatch.style.display = visibleCount === 0 ? 'block' : 'none';
  });

  areaPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const areaName = pill.getAttribute('data-area-name');
      areaPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      if (areaName === 'other') {
        if (customAreaGroup) customAreaGroup.style.display = 'block';
        if (customAreaInput) {
          customAreaInput.focus();
          if (hiddenAreaInput) hiddenAreaInput.value = customAreaInput.value.trim() || 'المنزلة';
          if (selectedAreaBadgeName) selectedAreaBadgeName.textContent = customAreaInput.value.trim() || 'بلد مخصص';
        }
      } else {
        if (customAreaGroup) customAreaGroup.style.display = 'none';
        if (hiddenAreaInput) hiddenAreaInput.value = areaName;
        if (selectedAreaBadgeName) selectedAreaBadgeName.textContent = areaName;
      }
    });
  });

  customAreaInput?.addEventListener('input', () => {
    const val = customAreaInput.value.trim();
    if (hiddenAreaInput) hiddenAreaInput.value = val || 'المنزلة';
    if (selectedAreaBadgeName) selectedAreaBadgeName.textContent = val || 'بلد مخصص';
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

  // AI Logo Generation
  document.getElementById('btn-ai-gen-logo')?.addEventListener('click', () => {
    const name = document.getElementById('p-name')?.value.trim();
    const cat = document.getElementById('p-category')?.value;
    if (!name) {
      toast.warning('اكتب اسم المكان أولاً لتوليد اللوجو المناسب له');
      return;
    }

    try {
      const logoUrl = generatePlaceLogo(name, cat);
      document.getElementById('p-logo-url').value = logoUrl;
      const preview = document.getElementById('logo-preview-img');
      const wrapper = document.getElementById('logo-preview-wrapper');
      if (preview && wrapper) {
        preview.src = logoUrl;
        wrapper.style.display = 'block';
      }
      toast.success('تم إنشاء الشعار بالذكاء الاصطناعي بنجاح ✨');
    } catch {
      toast.error('تعذر إنشاء الشعار');
    }
  });

  // AI SEO Description Generation
  document.getElementById('btn-ai-gen-desc')?.addEventListener('click', async () => {
    const name = document.getElementById('p-name')?.value.trim();
    const catSelect = document.getElementById('p-category');
    const catText = catSelect?.options[catSelect.selectedIndex]?.text?.replace(/^[^\s]+\s+/, '') || '';
    const customCat = document.getElementById('p-custom-category')?.value.trim();
    const catName = customCat || catText || '';
    const area = document.getElementById('p-area')?.value.trim() || 'المنزلة';

    if (!name) {
      toast.warning('اكتب اسم المكان بالعربية أولاً لتوليد وصف SEO متطابق معه');
      return;
    }

    const btn = document.getElementById('btn-ai-gen-desc');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const seoDesc = await generateSeoDescription(name, catName, area);
      if (seoDesc) {
        document.getElementById('p-desc').value = seoDesc;
        toast.success('تم توليد وصف سيو (SEO) احترافي بنجاح ✨');
      }
    } catch {
      toast.error('تعذر توليد الوصف، يرجى المحاولة ثانية');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });

  // AI SEO Services & Keywords Generation
  document.getElementById('btn-ai-gen-services')?.addEventListener('click', async () => {
    const name = document.getElementById('p-name')?.value.trim();
    const catSelect = document.getElementById('p-category');
    const catText = catSelect?.options[catSelect.selectedIndex]?.text?.replace(/^[^\s]+\s+/, '') || '';
    const customCat = document.getElementById('p-custom-category')?.value.trim();
    const catName = customCat || catText || '';

    if (!name && !catName) {
      toast.warning('اكتب اسم المكان أو اختر التصنيف أولاً لاقتراح الخدمات');
      return;
    }

    const btn = document.getElementById('btn-ai-gen-services');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const services = await generateSeoServices(name, catName);
      if (services) {
        document.getElementById('p-services').value = services;
        toast.success('تم توليد الكلمات المفتاحية والخدمات بنجاح ✨');
      }
    } catch {
      toast.error('تعذر اقتراح الخدمات');
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

  // Live Google Maps Coordinate Auto-Extraction
  let _currentCoords = place?.location || null;

  async function updateMapPreview() {
    const rawMap = document.getElementById('p-maps')?.value.trim() || '';
    const rawAddress = document.getElementById('p-address')?.value.trim() || '';

    let coords = await extractCoordinates(rawMap);
    if (!coords && rawAddress) {
      coords = await extractCoordinates(rawAddress);
    }

    let embedSrc = '';
    if (rawMap.includes('<iframe') || rawMap.includes('google.com/maps/embed') || rawMap.includes('google.com/maps?pb=')) {
      const srcMatch = rawMap.match(/src=["']([^"']+)["']/i);
      embedSrc = srcMatch ? srcMatch[1].trim() : (rawMap.startsWith('http') ? rawMap : '');
    }

    const previewBox = document.getElementById('map-live-preview-box');
    if ((coords && coords.lat && coords.lng) || embedSrc) {
      if (coords && coords.lat && coords.lng) {
        _currentCoords = { lat: coords.lat, lng: coords.lng };
      }
      const finalSrc = embedSrc || `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=ar&z=17&output=embed`;
      const coordsText = coords ? `(${Number(coords.lat).toFixed(4)}, ${Number(coords.lng).toFixed(4)})` : 'المحدد بالرابط';

      if (previewBox) {
        previewBox.style.display = 'block';
        previewBox.innerHTML = `
          <div style="padding:8px 12px;background:rgba(16, 185, 129, 0.08);border:1px solid rgba(16, 185, 129, 0.3);border-radius:var(--radius-md)">
            <div style="font-size:12px;font-weight:700;color:#059669;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span>✅</span> تم استخراج وتثبيت الموقع الجغرافي بدقة ${coordsText}
            </div>
            <iframe 
              src="${finalSrc}" 
              style="border:0;width:100%;height:180px;border-radius:var(--radius-sm);display:block" 
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin">
            </iframe>
          </div>
        `;
      }
    }
  }

  document.getElementById('p-maps')?.addEventListener('change', updateMapPreview);
  document.getElementById('p-maps')?.addEventListener('input', () => {
    clearTimeout(window._mapDebounce);
    window._mapDebounce = setTimeout(updateMapPreview, 600);
  });
  document.getElementById('p-address')?.addEventListener('change', updateMapPreview);

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
        area: (document.getElementById('p-area')?.value === 'other' 
          ? (document.getElementById('p-custom-area')?.value.trim() || 'المنزلة') 
          : (document.getElementById('p-area')?.value || 'المنزلة')),
        address: document.getElementById('p-address').value,
        mapsLink: document.getElementById('p-maps').value,
        location: _currentCoords,
        coverImageUrl: document.getElementById('p-cover-url').value,
        logoUrl: document.getElementById('p-logo-url').value,
        alwaysOpen,
        workingHours,
        services,
        social: {
          facebook: document.getElementById('p-social-facebook')?.value.trim() || '',
          x: document.getElementById('p-social-x')?.value.trim() || '',
          twitter: document.getElementById('p-social-x')?.value.trim() || '',
          instagram: document.getElementById('p-social-instagram')?.value.trim() || '',
          tiktok: document.getElementById('p-social-tiktok')?.value.trim() || '',
          threads: document.getElementById('p-social-threads')?.value.trim() || '',
          youtube: document.getElementById('p-social-youtube')?.value.trim() || '',
          website: document.getElementById('p-social-website')?.value.trim() || ''
        }
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

  const products = await getPlaceProducts(placeId, { limit: 350, includePending: true });

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة منتجات: ${escHtml(place.name)}</h1>
        <div class="dashboard-header__subtitle">المنتجات المسجلة: ${products.length} من أصل 350 منتج (تخضع المنتجات للمراجعة للتأكد من مطابقتها للشروط)</div>
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
            <th>حالة المراجعة</th>
            <th>التوفر</th>
          </tr>
        </thead>
        <tbody>
          ${products.length === 0 ? `
            <tr><td colspan="5" class="text-center" style="padding:2rem">لا توجد منتجات مسجلة</td></tr>
          ` : products.map(p => {
            const isPending = p.status === 'pending' || (!p.status && p.isApproved === false);
            const isApproved = p.status === 'approved' || p.isApproved === true || (!p.status && p.isApproved === undefined);
            const isRejected = p.status === 'rejected';

            let modBadge = '';
            if (isPending) modBadge = '<span class="badge" style="background:#FEF3C7;color:#D97706;font-weight:700">⏳ قيد مراجعة الإدارة</span>';
            else if (isApproved) modBadge = '<span class="badge badge--success">✓ معتمد وظاهر في الدليل</span>';
            else modBadge = `<span class="badge badge--danger" title="${escAttr(p.rejectReason || '')}">✕ مرفوض (${escHtml(p.rejectReason || 'مخالف للشروط')})</span>`;

            return `
              <tr>
                <td>
                  <img src="${p.imageUrl || './icons/icon-72x72.png'}" style="width:40px;height:40px;object-fit:cover;border-radius:4px" />
                </td>
                <td><strong>${escHtml(p.name)}</strong></td>
                <td>${formatPrice(p.price)}</td>
                <td>${modBadge}</td>
                <td>${p.inStock ? '<span class="badge badge--published">متوفر</span>' : '<span class="badge badge--suspended">نفذ</span>'}</td>
              </tr>
            `;
          }).join('')}
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
            toast.success('تمت إضافة المنتج بنجاح، وسيظهر في دليلك فور اعتماده من الإدارة ⏳');
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

if (typeof window !== 'undefined') {
  window.toggleDayHours = (dayKey, isClosed) => {
    const openInput = document.getElementById(`wh-${dayKey}-open`);
    const closeInput = document.getElementById(`wh-${dayKey}-close`);
    if (openInput) openInput.disabled = isClosed;
    if (closeInput) closeInput.disabled = isClosed;
  };
}

/**
 * Render Dashboard Notifications Section (Profile visitors & alerts)
 */
async function renderDashboardNotifications($container, user) {
  $container.innerHTML = `<div class="spinner spinner-lg" style="margin:4rem auto"></div>`;
  const notifications = await getUserNotifications(user.uid);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  $container.innerHTML = `
    <div class="dashboard-header animate-fade-in-up" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-6)">
      <div>
        <h1 class="dashboard-title" style="margin-bottom:4px;display:flex;align-items:center;gap:8px">
          <span>🔔</span> سجل الإشعارات وزوار البروفايل
          ${unreadCount > 0 ? `<span class="badge badge--danger" style="font-size:12px;padding:2px 8px">${unreadCount} جديد</span>` : ''}
        </h1>
        <p class="dashboard-subtitle" style="margin:0;color:var(--text-muted);font-size:13px">
          تعرف على الأشخاص والزوار الذين شاهدوا أنشطتك وأماكنك اليوم مع التوقيت الدقيق
        </p>
      </div>

      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${notifications.length > 0 ? `
          <button class="btn btn-sm btn-outline" id="btn-mark-all-read" style="font-size:12px">
            ✓ تحديد الكل كمقروء
          </button>
          <button class="btn btn-sm btn-ghost" id="btn-clear-all-notifs" style="color:var(--danger);font-size:12px">
            🗑️ مسح الكل
          </button>
        ` : ''}
      </div>
    </div>

    ${notifications.length === 0 ? `
      <div class="empty-state" style="background:var(--surface);border-radius:var(--radius-lg);padding:3rem 1.5rem;text-align:center;border:1px solid var(--border)">
        <div style="font-size:3.5rem;margin-bottom:12px">🔕</div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:6px">لا توجد إشعارات جديدة حالياً</h3>
        <p style="color:var(--text-muted);font-size:13px;max-width:400px;margin:0 auto">
          عندما يقوم الزوار بتصفح أماكنك أو بروفايلك ستصلك تنبيهات فورية هنا بأسماء الزوار وتوقيت الزيارة.
        </p>
      </div>
    ` : `
      <div class="notifications-list" style="display:flex;flex-direction:column;gap:10px">
        ${notifications.map(n => {
          const isUnread = !n.isRead;
          const timeStr = formatTimeAgo(n.createdAt);
          const isGuest = n.isGuest || !n.visitorUid;

          return `
            <div class="notification-card" style="background:${isUnread ? 'rgba(27, 79, 114, 0.05)' : 'var(--surface)'};border:1px solid ${isUnread ? 'var(--primary)' : 'var(--border)'};border-radius:var(--radius-md);padding:12px 16px;display:flex;align-items:center;gap:14px;transition:all 0.2s">
              
              <!-- Avatar -->
              <div style="width:44px;height:44px;border-radius:50%;background:${isGuest ? 'var(--surface-3)' : 'var(--primary-alpha)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1.5px solid var(--border)">
                ${n.visitorPhoto ? `
                  <img src="${escAttr(n.visitorPhoto)}" alt="${escAttr(n.visitorName)}" style="width:100%;height:100%;object-fit:cover" />
                ` : `
                  <span style="font-size:1.3rem">${isGuest ? '👤' : (n.visitorName?.charAt(0) || '👤')}</span>
                `}
              </div>

              <!-- Content -->
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                  <div style="font-weight:700;font-size:13.5px;color:var(--text-primary)">
                    ${isGuest ? `<span style="color:var(--text-muted)">زائر (غير مسجل)</span>` : escHtml(n.visitorName)}
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">
                    ⏱️ ${timeStr}
                  </div>
                </div>

                <div style="font-size:12.5px;color:var(--text-secondary);margin-top:2px">
                  ${isGuest ? 'قام زائر بتصفح' : 'قام بزيارة وتصفح'} صفحة <strong>${escHtml(n.placeName || 'المكان')}</strong>
                </div>
              </div>

              ${isUnread ? `
                <div style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0" title="إشعار غير مقروء"></div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  // Setup Button Handlers
  document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
    await markAllNotificationsAsRead(user.uid);
    toast.success('تم تحديد جميع الإشعارات كمقروءة');
    await renderDashboardNotifications($container, user);
    updateNotificationBadges(user.uid);
  });

  document.getElementById('btn-clear-all-notifs')?.addEventListener('click', async () => {
    const ok = await showConfirm({
      title: 'مسح جميع الإشعارات',
      message: 'هل أنت متأكد من رغبتك في حذف كافة سجلات الزيارات والإشعارات؟',
      confirmText: 'نعم، حذف الكل',
      cancelText: 'إلغاء'
    });
    if (ok) {
      await clearAllNotifications(user.uid);
      toast.success('تم مسح جميع الإشعارات بنجاح');
      await renderDashboardNotifications($container, user);
      updateNotificationBadges(user.uid);
    }
  });
}

async function updateNotificationBadges(uid) {
  try {
    const notifs = await getUserNotifications(uid);
    const unread = notifs.filter(n => !n.isRead).length;
    const badge = document.getElementById('sidebar-notifs-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-block' : 'none';
    }
  } catch (_) {}
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'حديثاً';
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'منذ لحظات';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(timestamp).toLocaleDateString('ar-EG');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * Render Followed Places & Active Offers Section
 */
async function renderFollowingSection($container, user) {
  $container.innerHTML = `
    <div class="dashboard-section-header">
      <div>
        <h1 class="dashboard-section-title">⭐ الأماكن المتابعة وعروضها الحصرية</h1>
        <p class="dashboard-section-subtitle">تابع أنشطتك المفضلة في المنزلة وشاهد عروضهم الحصرية فور نزولها</p>
      </div>
    </div>
    <div class="spinner spinner-lg" style="margin:3rem auto"></div>
  `;

  try {
    const [places, offers] = await Promise.all([
      getUserFollowedPlaces(user.uid),
      getUserFollowedOffers(user.uid)
    ]);

    if (!places.length) {
      $container.innerHTML = `
        <div class="dashboard-section-header">
          <div>
            <h1 class="dashboard-section-title">⭐ الأماكن المتابعة وعروضها الحصرية</h1>
            <p class="dashboard-section-subtitle">تابع أنشطتك المفضلة في المنزلة وشاهد عروضهم الحصرية فور نزولها</p>
          </div>
        </div>

        <div class="empty-state" style="padding:4rem 1rem;background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div class="empty-state__icon">🔔</div>
          <h2 class="empty-state__title">لم تقم بمتابعة أي مكان بعد</h2>
          <p class="empty-state__text">عندما تقوم بالضغط على زر "متابعة المكان" في صفحة أي نشاط، ستظهر جميع عروضه وتحديثاته هنا أولاً بأول</p>
          <a href="places.html" class="btn btn-primary" style="margin-top:1rem">استكشف دليل الأماكن في المنزلة</a>
        </div>
      `;
      return;
    }

    $container.innerHTML = `
      <div class="dashboard-section-header">
        <div>
          <h1 class="dashboard-section-title">⭐ الأماكن المتابعة (${places.length})</h1>
          <p class="dashboard-section-subtitle">عروض وخصومات حية من الأماكن التي تتابعها</p>
        </div>
      </div>

      <!-- Live Offers Grid from Followed Places -->
      ${offers.length > 0 ? `
        <div style="margin-bottom:var(--space-6)">
          <h2 style="font-size:1.2rem;font-weight:800;color:var(--primary);margin-bottom:var(--space-3);display:flex;align-items:center;gap:8px">
            <span>🏷️</span> العروض الحالية من متابعاتك (${offers.length})
          </h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:var(--space-4)">
            ${offers.map(offer => `
              <div class="offer-card" style="border:1px solid var(--border);background:var(--surface);border-radius:var(--radius-lg);overflow:hidden">
                <div class="offer-card__image" style="height:150px">
                  ${offer.imageUrl ? `<img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" style="width:100%;height:100%;object-fit:cover" />` : `<div style="padding:2rem;text-align:center;font-size:2.5rem">🏷️</div>`}
                  ${offer.discountPercent ? `<span class="offer-card__discount-badge">-${offer.discountPercent}%</span>` : ''}
                </div>
                <div class="offer-card__body" style="padding:14px">
                  <h3 class="offer-card__title" style="font-size:15px;margin-bottom:6px">${escHtml(offer.title)}</h3>
                  <div class="offer-card__price" style="margin-bottom:10px">
                    <span class="offer-card__price-new" style="font-weight:700;color:var(--primary);font-size:16px">${formatPrice(offer.newPrice)}</span>
                    ${offer.oldPrice ? `<span class="offer-card__price-old" style="text-decoration:line-through;color:var(--text-muted);font-size:13px;margin-right:8px">${formatPrice(offer.oldPrice)}</span>` : ''}
                  </div>
                  <a href="place.html?slug=${escAttr(offer.placeSlug || offer.placeId)}" class="btn btn-sm btn-outline" style="width:100%;justify-content:center;font-size:12.5px;border-radius:var(--radius-md)">
                    عرض المكان والتواصل
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Followed Places Cards List -->
      <h2 style="font-size:1.2rem;font-weight:800;color:var(--text-primary);margin-bottom:var(--space-3);display:flex;align-items:center;gap:8px">
        <span>📍</span> الأنشطة والأماكن التي تتابعها
      </h2>

      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:var(--space-4)">
        ${places.map(p => `
          <div class="stat-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:50px;height:50px;border-radius:var(--radius-md);overflow:hidden;background:#1B4F72;flex-shrink:0">
                <img src="${escAttr(p.logoUrl || p.coverImageUrl || './icons/icon-72x72.png')}" alt="${escAttr(p.name)}" style="width:100%;height:100%;object-fit:cover" />
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:14px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${escHtml(p.name)}
                </div>
                <div style="font-size:12px;color:var(--text-muted)">
                  📍 ${escHtml(p.address || p.area || 'المنزلة')}
                </div>
                <div style="font-size:11.5px;color:#F59E0B;font-weight:700">
                  ★ ${(Number(p.rating) || 5.0).toFixed(1)} (${p.reviewCount || 0} تقييم)
                </div>
              </div>
            </div>

            <div style="display:flex;gap:8px;margin-top:auto">
              <a href="place.html?slug=${escAttr(p.slug || p.id)}" class="btn btn-sm btn-primary" style="flex:1;justify-content:center;font-size:12px;border-radius:var(--radius-md)">
                عرض الصفحة
              </a>
              <button type="button" class="btn btn-sm btn-outline btn-dash-unfollow" data-pid="${escAttr(p.id)}" style="font-size:12px;border-radius:var(--radius-md);color:var(--danger);border-color:var(--border)" title="إلغاء المتابعة">
                إلغاء
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Unfollow buttons handler
    $container.querySelectorAll('.btn-dash-unfollow').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-pid');
        try {
          await unfollowPlace(pId, user);
          toast.info('تم إلغاء المتابعة');
          await renderFollowingSection($container, user);
        } catch (err) {
          toast.error('حدث خطأ أثناء إلغاء المتابعة');
        }
      });
    });

  } catch (err) {
    console.error('[renderFollowingSection] error:', err);
    $container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h2 class="empty-state__title">فشل تحميل المتابعات</h2>
        <button class="btn btn-primary" onclick="window.switchDashboardSection('following', null, false)">إعادة المحاولة</button>
      </div>
    `;
  }
}
