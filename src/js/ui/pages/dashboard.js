import { showAddPlaceOnboardingModal } from '../components/AddPlaceOnboardingModal.js';
import { 
  fetchManagedUserNotifications, 
  deleteSingleNotification, 
  clearAllUserNotifications, 
  markSingleNotificationAsRead, 
  markAllUserNotificationsAsRead,
  updateAllNotificationBadges,
  playNotificationSound, 
  toggleNotificationSound, 
  isNotificationSoundEnabled 
} from '../../services/notification.service.js';
import { getCategoryTaxonomy, SPECIALIZED_CATEGORIES_TAXONOMY } from '../../utils/specialized-taxonomy.js';
/**
 * المنزلة وناسها — User Place Owner Dashboard
 * Mobile-first dashboard for managing places, daily offers, products, photos,
 * AI translation, AI cover generator, and verification requests.
 */

import { getPlacesByOwner, getPlace, getCategories, getPlaceOffers, getPlaceProducts, getSettings, getUserNotifications, markAllNotificationsAsRead, clearAllNotifications, getUserFollowedPlaces, getUserFollowedOffers, unfollowPlace, clearDbCache } from '../../core/db.js';
import { createPlace, updatePlace, deletePlace, addOffer, updateOffer, deleteOffer, addProduct, updateProduct, deleteProduct, submitVerificationRequest } from '../../services/places.service.js';
import { openOfferFullDetailsModal, openProductFullDetailsModal } from '../components/OfferProductModals.js';
import { uploadImage } from '../../services/upload.service.js';
import { translatePlaceName, generateCoverImage, generatePlaceLogo, generateSeoDescription, generateSeoServices } from '../../services/ai.service.js';
import { renderVerifiedBadge, renderPendingBadge, renderDeliveryBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { isAdmin } from '../../core/auth.js';
import { formatPrice, arabicMatch } from '../../utils/arabic.js';
import { extractCoordinates, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';
import { isAtmPlace, ATM_UNIFIED_COVER, ATM_UNIFIED_LOGO } from '../../utils/atm.js';
import { mountAroundMeRadar } from '../components/AroundMeRadar.js';
import { formatDate } from '../../utils/date.js';
import { getUserLoyaltyProfile, getLoyaltyLevelInfo, redeemPointsForVerification, claimDailyBonus, LOYALTY_LEVELS, POINTS_RULES, VERIFICATION_POINTS_COST } from '../../services/loyalty.service.js';

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
          <a href="dashboard.html?section=around-me" data-section="around-me" class="dashboard-nav-item ${section === 'around-me' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">🗺️</span> بالقرب مني (GPS)
          </a>
          <a href="dashboard.html?section=loyalty" data-section="loyalty" class="dashboard-nav-item ${section === 'loyalty' ? 'active' : ''}">
            <span class="dashboard-nav-item__icon">🎁</span> نادي الولاء والنقاط
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
            <a href="admin/index.html" class="dashboard-nav-item" style="color:var(--secondary);font-weight:bold">
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
    } else if (section === 'loyalty') {
      await renderLoyaltySection($mainArea, _dashUser);
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

              ${(() => {
                const isAtm = isAtmPlace(place);
                if (isAtm) {
                  return `
                    <div class="my-place-item__actions">
                      <a href="dashboard.html?section=edit&id=${escAttr(placeId)}" class="btn btn-sm btn-outline">✏️ تعديل العنوان والموقع</a>
                      <span class="badge" style="background:rgba(27,79,114,0.1);color:var(--primary);font-size:11px;font-weight:700;padding:4px 8px;border-radius:4px">🏧 صراف آلي</span>
                    </div>
                  `;
                }
                return `
                  <div class="my-place-item__actions">
                    <a href="dashboard.html?section=edit&id=${escAttr(placeId)}" class="btn btn-sm btn-outline">✏️ تعديل</a>
                    <a href="dashboard.html?section=offers&id=${escAttr(placeId)}" class="btn btn-sm btn-secondary">🏷️ العروض</a>
                    ${place.isVerified ? `
                      <a href="dashboard.html?section=products&id=${escAttr(placeId)}" class="btn btn-sm btn-primary">🛍️ المنتجات</a>
                    ` : ''}
                  </div>
                `;
              })()}
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

  // Show 3D Onboarding Guide for first-time place creators
  if (!isEdit) {
    setTimeout(() => {
      showAddPlaceOnboardingModal(false);
    }, 150);
  }

  if (isEdit) {
    place = await getPlace(placeId);
    if (!place) {
      $container.innerHTML = `<div class="empty-state"><h2>المكان غير موجود</h2></div>`;
      return;
    }
  }

  const categories = (await getCategories()) || [];
  if (!categories.some(c => c.slug === 'atm' || c._key === 'atm' || (c.name && c.name.includes('صراف')))) {
    categories.unshift({ _key: 'atm', slug: 'atm', name: 'ماكينة صراف آلي (ATM)', icon: '🏧' });
  }

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
          <label class="form-label" id="p-name-label">اسم المكان أو النشاط أو المهنة / الحرفي <span class="required">*</span></label>
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

        <!-- ATM Specific Notice Banner -->
        <div class="form-group animate-fade-in" id="p-atm-notice" style="display:none;background:linear-gradient(135deg,#0F2B48 0%,#1B4F72 100%);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:var(--radius-lg);padding:18px;box-shadow:0 8px 24px rgba(27,79,114,0.3)">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;flex-wrap:wrap">
            <img src="assets/images/atm-logo.png" style="width:64px;height:64px;border-radius:50%;object-fit:cover;box-shadow:0 4px 14px rgba(0,0,0,0.4);border:2.5px solid #F5A623;flex-shrink:0" alt="شعار ماكينة الصراف الآلي" />
            <div>
              <div style="font-weight:800;color:#FDE68A;font-size:15px;margin-bottom:4px">🏧 تصنيف ماكينة صراف آلي (ATM)</div>
              <div style="font-size:12.5px;color:rgba(255,255,255,0.9);line-height:1.5">
                تم إلغاء رفع الغلاف والشعار يدوياً وتطبيق الهوية الرسمية المعتمدة تلقائياً. كل ما عليك إدخاله هو <strong>اسم البنك</strong> و<strong>مكان الماكينة بالتفصيل</strong> و<strong>موقعها على الخريطة</strong>.
              </div>
            </div>
          </div>
          <div style="border-radius:var(--radius-md);overflow:hidden;border:1px solid rgba(255,255,255,0.18);max-height:130px">
            <img src="assets/images/atm-cover.jpg" style="width:100%;height:130px;object-fit:cover" alt="غلاف ماكينة صراف آلي" />
          </div>
        </div>

        
        <!-- Medical Specialty for Doctors & Clinics -->
        <div class="form-group animate-fade-in" id="doctor-specialty-group" style="display:${(place?.categoryId?.includes('doctor') || place?.categoryId?.includes('clinic') || place?.customCategory?.includes('دكتور') || place?.customCategory?.includes('عياد') || place?.medicalSpecialty) ? 'block' : 'none'};background:rgba(2,132,199,0.06);border:1.5px solid #0284C7;border-radius:var(--radius-lg);padding:14px;margin-top:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:20px">🩺</span>
            <label class="form-label" style="font-weight:800;color:#0369A1;font-size:14px;margin:0">التخصص الطبي الدقيق للدكتور أو العيادة <span class="required">*</span></label>
          </div>
          <p style="font-size:12px;color:var(--text-muted);margin:0 0 10px 0">
            اكتب تخصصك الطبي أو اختر من الأزرار السريعة أدناه (مثل: دكتور جراحة عامة، دكتور أسنان، دكتور باطنة، دكتور أطفال، دكتور أورام...).
          </p>
          <input 
            type="text" 
            id="p-medical-specialty" 
            class="form-input" 
            placeholder="مثال: دكتور جراحة عامة، دكتور أسنان، استشاري باطنة، أطفال، عظام..." 
            value="${escAttr(place?.medicalSpecialty || '')}" 
            style="border-color:#0284C7;background:#fff;font-weight:700;font-size:14px"
          />
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px">
            <span style="font-size:12px;color:#0369A1;font-weight:700">⚡ اختيار تخصص سريع بنقرة واحدة:</span>
            ${[
              'دكتور جراحة عامة', 'دكتور أسنان', 'دكتور باطنة وجهاز هضمي', 'دكتور أطفال وحديثي الولادة', 
              'دكتور عظام ومفاصل', 'دكتور نساء وتوليد', 'دكتور جلدية وتجميل', 'دكتور عيون ورمد', 
              'دكتور أنف وأذن وحنجرة', 'دكتور أورام', 'دكتور مخ وأعصاب', 'دكتور قلب وأوعية دموية', 
              'دكتور مسالك بولية', 'دكتور علاج طبيعي وتغذية', 'دكتور صدر وحساسية', 'دكتور ذكورة وعقم'
            ].map(spec => `
              <button type="button" class="btn btn-sm btn-outline btn-quick-specialty" data-spec="${escAttr(spec)}" style="font-size:11.5px;padding:4px 10px;border-radius:9999px;border-color:#BAE6FD;color:#0369A1;background:#fff">
                ${escHtml(spec)}
              </button>
            `).join('')}
          </div>
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
      </div>

      <!-- 3. Location & Area Section (قسم اختيار المكان والمنطقة) -->
      <div class="form-section" id="p-location-section">
        <h2 class="form-section__title"><span>📍</span> اختيار المكان والمنطقة والعنوان</h2>

        <!-- Searchable Area / Village Selector -->
        <div class="form-group" style="background:var(--surface-2);border:1.5px solid var(--primary);border-radius:var(--radius-lg);padding:var(--space-4)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);flex-wrap:wrap;gap:6px">
            <label class="form-label" style="margin-bottom:0;font-weight:var(--font-weight-bold);color:var(--primary)">المنطقة داخل المنزلة / المطرية <span class="required">*</span></label>
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
          <label class="form-label" id="p-address-label">العنوان بالتفصيل أو الشارع</label>
          <input type="text" id="p-address" class="form-input" placeholder="مثال: شارع البحر، بجوار المسجد الكبير" value="${escAttr(place?.address || '')}" />
        </div>

        <div class="form-group">
          <label class="form-label" id="p-maps-label">رابط خرائط جوجل (Google Maps Link)</label>
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

        <div class="form-row" id="p-phone-row">
          <div class="form-group">
            <label class="form-label">رقم الهاتف <span class="required">*</span></label>
            <input type="tel" id="p-phone" class="form-input" required placeholder="01012345678" value="${escAttr(place?.phone || '')}" style="direction:ltr;text-align:right" />
          </div>

          <div class="form-group">
            <label class="form-label">رقم WhatsApp للتواصل المباشر</label>
            <input type="tel" id="p-whatsapp" class="form-input" placeholder="01012345678" value="${escAttr(place?.whatsapp || '')}" style="direction:ltr;text-align:right" />
          </div>
        </div>
      </div>

      <!-- 4. Description, Services & Specialized Keywords Section -->
      <div class="form-section" id="p-desc-section">
        <h2 class="form-section__title"><span>📝</span> وصف المكان والنشاط والكلمات المفتاحية</h2>

        <div class="form-group">
          <label class="form-label" style="font-weight:700">الخدمات والكلمات المفتاحية لنشاطك (اضغط Enter بعد كل كلمة)</label>
          
          <div class="tags-input-container" id="p-services-tags-box" onclick="document.getElementById('p-service-tag-input')?.focus()">
            <div id="p-tags-list" style="display:inline-flex;flex-wrap:wrap;gap:6px"></div>
            <input 
              type="text" 
              id="p-service-tag-input" 
              class="tag-text-entry" 
              placeholder="اكتب الكلمة واضغط Enter أو سهم الكيبورد ↵..." 
              enterkeyhint="done"
              autocomplete="off"
            />
          </div>

          <!-- Hidden Synchronized Input for Form Submit -->
          <input type="hidden" id="p-services" value="${escAttr((place?.services || []).join('، '))}" />
          
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;flex-wrap:wrap">
            <p style="font-size:11.5px;color:var(--text-muted);margin:0">💡 اكتب الكلمة ثم اضغط <strong>Enter</strong> في الكمبيوتر أو <strong>سهم الإدخال ↵</strong> في كيبورد الهاتف للإضافة الفورية.</p>
            <button type="button" class="btn btn-sm btn-outline" id="btn-add-typed-tag" style="font-size:11.5px;padding:3px 10px;border-radius:6px">
              ➕ إضافة الكلمة
            </button>
          </div>
        </div>

        <div class="form-group">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);flex-wrap:wrap;gap:6px">
            <label class="form-label" style="margin-bottom:0">وصف المكان والنشاط التسويقي</label>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-ai-gen-desc" title="توليد وصف متوافق 100% مع محركات البحث وسيو المنزلة">
              ✨ توليد وصف سيو (SEO) بالذكاء الاصطناعي
            </button>
          </div>
          <textarea id="p-desc" class="form-textarea" rows="4" placeholder="اكتب نبذة عن المكان، المنتجات، التخصصات، وسنوات الخبرة... (أو اضغط زر التوليد الذكي أعلاه)">${escHtml(place?.description || '')}</textarea>
        </div>
      </div>

      <!-- Images & Branding -->
      <div class="form-section" id="p-images-section">
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
      <div class="form-section" id="p-working-hours-section">
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
      <div class="form-section" id="p-social-section">
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
      <div class="form-section" id="p-services-section">
        <h2 class="form-section__title"><span>✨</span> الخدمات والكلمات المفتاحية</h2>
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

  // Doctor Specialty Visibility Controller
  function updateDoctorSpecialtyVisibility(catVal = '', customCatVal = '', catNameVal = '') {
    const combined = `${catVal || ''} ${customCatVal || ''} ${catNameVal || ''}`.toLowerCase();
    const isDoc = (
      combined.includes('doctor') || 
      combined.includes('clinic') || 
      combined.includes('دكتور') || 
      combined.includes('عياد') ||
      combined.includes('طبيب') ||
      combined.includes('طبي') ||
      combined.includes('اسنان') ||
      combined.includes('علاج')
    );
    const docGroup = document.getElementById('doctor-specialty-group');
    if (docGroup) {
      docGroup.style.display = isDoc ? 'block' : 'none';
      if (isDoc) {
        docGroup.classList.add('animate-fade-in');
      }
    }
  }

  // Doctor Quick Specialty Pills Click Handlers
  document.querySelectorAll('.btn-quick-specialty').forEach(btn => {
    btn.addEventListener('click', () => {
      const spec = btn.getAttribute('data-spec');
      const input = document.getElementById('p-medical-specialty');
      if (input && spec) {
        input.value = spec;
        toast.info(`تم اختيار التخصص: ${spec}`);
      }
    });
  });

  // Category Search Input Filtering
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

  // Category Pill Selection Click Handlers
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const catId = pill.getAttribute('data-cat-id');
      const catName = pill.getAttribute('data-cat-name');

      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      if (hiddenSelect) {
        hiddenSelect.value = catId;
        hiddenSelect.dispatchEvent(new Event('change'));
        updateAtmMode(catId);
      }

      if (selectedBadge && selectedBadgeName) {
        selectedBadgeName.textContent = catName;
        selectedBadge.style.display = 'flex';
      }

      const customCatGroup = document.getElementById('custom-category-group');
      updateDoctorSpecialtyVisibility(catId, customCatGroup?.querySelector('input')?.value, catName);
      
      const deliveryGroup = document.getElementById('delivery-type-group');
      if (deliveryGroup) deliveryGroup.style.display = (catId || '').includes('delivery') ? 'block' : 'none';

      if (customCatGroup) customCatGroup.style.display = catId === 'other' ? 'block' : 'none';
    });
  });

  function updateAtmMode(catVal) {
    const isAtm = (catVal === 'atm' || catVal === 'atm-machines' || String(catVal).includes('صراف') || String(catVal).includes('atm'));
    const nameLabel = document.getElementById('p-name-label');
    const nameInput = document.getElementById('p-name');
    const addressLabel = document.getElementById('p-address-label');
    const addressInput = document.getElementById('p-address');
    const mapsLabel = document.getElementById('p-maps-label');
    const atmNotice = document.getElementById('p-atm-notice');
    const phoneRow = document.getElementById('p-phone-row');
    const phoneInput = document.getElementById('p-phone');
    const workingSection = document.getElementById('p-working-hours-section');
    const socialSection = document.getElementById('p-social-section');
    const servicesSection = document.getElementById('p-services-section');
    const imagesSection = document.getElementById('p-images-section');
    const coverUploadZone = document.getElementById('cover-upload-zone');
    const logoUploadZone = document.getElementById('logo-upload-zone');

    if (isAtm) {
      if (nameLabel) nameLabel.innerHTML = 'اسم البنك <span class="required">*</span>';
      if (nameInput) nameInput.placeholder = 'مثال: البنك الأهلي المصري، بنك مصر، بنك القاهرة، CIB، بنك الإسكندرية...';
      if (addressLabel) addressLabel.innerHTML = 'مكان الماكينة بالتفصيل <span class="required">*</span>';
      if (addressInput) addressInput.placeholder = 'مثال: شارع البحر، أمام المستشفى المركزي، بجوار محطة القطار...';
      if (mapsLabel) mapsLabel.innerHTML = 'رابط عنوان وموقع الماكينة على خرائط جوجل <span class="required">*</span>';
      if (atmNotice) atmNotice.style.display = 'block';
      if (phoneRow) phoneRow.style.display = 'none';
      if (phoneInput) { phoneInput.required = false; if (!phoneInput.value) phoneInput.value = '19666'; }
      if (workingSection) workingSection.style.display = 'none';
      if (socialSection) socialSection.style.display = 'none';
      if (servicesSection) servicesSection.style.display = 'none';
      if (imagesSection) imagesSection.style.display = 'none';
    } else {
      if (nameLabel) nameLabel.innerHTML = 'اسم المكان أو النشاط أو المهنة / الحرفي <span class="required">*</span>';
      if (nameInput) nameInput.placeholder = 'مثال: ورشة نجار فلان، السباك أحمد، صيدلية الأمل، دكتور علي';
      if (addressLabel) addressLabel.innerHTML = 'العنوان بالتفصيل أو الشارع';
      if (addressInput) addressInput.placeholder = 'مثال: شارع البحر، بجوار المسجد الكبير';
      if (mapsLabel) mapsLabel.innerHTML = 'رابط خرائط جوجل (Google Maps Link)';
      if (atmNotice) atmNotice.style.display = 'none';
      if (phoneRow) phoneRow.style.display = 'flex';
      if (phoneInput) phoneInput.required = true;
      if (workingSection) workingSection.style.display = 'block';
      if (socialSection) socialSection.style.display = 'block';
      if (servicesSection) servicesSection.style.display = 'block';
      if (imagesSection) imagesSection.style.display = 'block';
    }
  }

  // Initial checks on load
  if (place?.categoryId || place?.customCategory || place?.medicalSpecialty) {
    updateAtmMode(place?.categoryId || '');
    updateDoctorSpecialtyVisibility(place?.categoryId || '', place?.customCategory || '', '');
  }

  // Category toggle for delivery vehicle and custom category
  document.getElementById('p-category')?.addEventListener('change', (e) => {
    updateAtmMode(e.target.value);
    updateDoctorSpecialtyVisibility(e.target.value, document.getElementById('p-custom-category')?.value);
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
    const catText = catSelect?.options[catSelect.selectedIndex]?.text?.replace(/^[^s]+s+/, '') || '';
    const customCat = document.getElementById('p-custom-category')?.value.trim();
    const catName = customCat || catText || '';
    const area = document.getElementById('p-area')?.value.trim() || 'المنزلة';
    const address = document.getElementById('p-address')?.value.trim() || '';
    const customServices = (typeof _currentTagsList !== 'undefined' && _currentTagsList.length) 
      ? _currentTagsList 
      : (document.getElementById('p-services')?.value || '').split(/[،,]+/).map(s => s.trim()).filter(Boolean);

    if (!name) {
      toast.warning('اكتب اسم المكان بالعربية أولاً لتوليد وصف SEO متطابق معه');
      return;
    }

    const btn = document.getElementById('btn-ai-gen-desc');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const seoDesc = await generateSeoDescription({
        placeName: name,
        categoryName: catName,
        area: area,
        address: address,
        customKeywords: customServices
      });
      if (seoDesc) {
        document.getElementById('p-desc').value = seoDesc;
        toast.success('تم توليد وصف سيو (SEO) ذكي واحترافي ✨');
      }
    } catch {
      toast.error('تعذر توليد الوصف، يرجى المحاولة ثانية');
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
        medicalSpecialty: document.getElementById('p-medical-specialty')?.value.trim() || null,
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

      const isAtm = isAtmPlace(placeData);
      if (isAtm) {
        placeData.coverImageUrl = placeData.coverImageUrl || ATM_UNIFIED_COVER;
        placeData.logoUrl = placeData.logoUrl || ATM_UNIFIED_LOGO;
        placeData.alwaysOpen = true;
        placeData.services = ['سحب نقدي', 'إيداع نقدي', 'خدمات فيزا', 'تحويل أموال'];
        if (!placeData.phone) placeData.phone = '19666';
      }

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

      clearDbCache();
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
  let place = placeId ? await getPlace(placeId) : null;
  const userPlaces = await getPlacesByOwner(user.uid);

  if (!place) {
    if (!userPlaces || userPlaces.length === 0) {
      $container.innerHTML = `
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-header__title">🏷️ إدارة العروض اليومية</h1>
            <div class="dashboard-header__subtitle">انشر عروضك وخصوماتك لتظهر في مقدمة الدليل</div>
          </div>
        </div>
        <div class="empty-state" style="padding:4rem 1rem;background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div class="empty-state__icon">🏷️</div>
          <h2 class="empty-state__title">ليس لديك أي نشاط تجاري مسجل بعد</h2>
          <p class="empty-state__text">لإضافة ونشر العروض والخصومات، يرجى تسجيل نشاطك التجاري في دليل المنزلة والمطرية أولاً.</p>
          <a href="dashboard.html?section=add" class="btn btn-primary" style="margin-top:1rem">
            <span>➕</span> إضافة مكان ونشاط جديد الآن
          </a>
        </div>
      `;
      return;
    }
    // Auto select first place
    place = userPlaces[0];
    placeId = place.id || place._key;
  }

    if (isAtmPlace(place)) {
    $container.innerHTML = `
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إدارة: ${escHtml(place.name)}</h1>
          <div class="dashboard-header__subtitle">ماكينات الصراف الآلي مخصصة للخدمات المصرفية والنقدية فقط</div>
        </div>
        <a href="dashboard.html?section=places" class="btn btn-outline">← عودة للأماكن</a>
      </div>

      ${userPlaces && userPlaces.length > 1 ? `
        <!-- Multiple Places Switcher -->
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:18px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:12.5px;font-weight:700;color:var(--text-muted)">🏪 اختر المكان:</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${userPlaces.map(p => {
              const pKey = p.id || p._key;
              const isCur = pKey === placeId;
              return `
                <button type="button" class="btn btn-xs ${isCur ? 'btn-primary' : 'btn-outline'}" onclick="window.switchDashboardSection('offers', '${escAttr(pKey)}', true)" style="border-radius:var(--radius-full)">
                  ${isCur ? '✓ ' : ''}${escHtml(p.name)}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="empty-state" style="padding:4rem 1rem;background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border)">
        <div class="empty-state__icon">🏧</div>
        <h2 class="empty-state__title">ماكينات الصراف الآلي لا تخضع للعروض أو الإعلانات</h2>
        <p class="empty-state__text" style="max-width:520px;margin:0 auto;line-height:1.6">
          هذا النشاط (ماكينة صراف آلي) مخصص للاستعلام عن توفر النقدية ومعرفة الموقع على الخريطة فقط. التحكم للمضيف مخصص لتعديل العنوان والرابط على الخريطة.
        </p>
        <a href="dashboard.html?section=edit&id=${escAttr(placeId)}" class="btn btn-primary" style="margin-top:1.2rem">
          <span>✏️</span> تعديل عنوان ورابط الماكينة على الخريطة
        </a>
      </div>
    `;
    return;
  }

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
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
        <button class="btn btn-primary" id="btn-open-add-offer" ${offers.length >= maxAllowed ? 'disabled title="تم الوصول للحد الأقصى"' : ''}>
          <span>➕</span> إضافة عرض جديد
        </button>
        <a href="dashboard.html?section=places" class="btn btn-outline">← عودة للأماكن</a>
      </div>
    </div>

    ${userPlaces && userPlaces.length > 1 ? `
      <!-- Multiple Places Switcher -->
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:18px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:12.5px;font-weight:700;color:var(--text-muted)">🏪 اختر المكان لإدارة عروضه:</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${userPlaces.map(p => {
            const pKey = p.id || p._key;
            const isCur = pKey === placeId;
            return `
              <button type="button" class="btn btn-xs ${isCur ? 'btn-primary' : 'btn-outline'}" onclick="window.switchDashboardSection('offers', '${escAttr(pKey)}', true)" style="border-radius:var(--radius-full)">
                ${isCur ? '✓ ' : ''}${escHtml(p.name)}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Offers List -->
    <div class="my-places-list">
      ${offers.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__icon">🏷️</div>
          <h3>لا توجد عروض نشطة لهذا المكان</h3>
          <p class="empty-state__text">العروض تظهر في الصفحة الرئيسية وصفحة العروض وتجذب آلاف الزبائن</p>
        </div>
      ` : offers.map(o => {
        const oId = o.id || o._id || o._key;
        return `
          <div class="my-place-item">
            <div class="my-place-item__header" style="flex-wrap:wrap;gap:12px">
              ${o.imageUrl ? `<img src="${escAttr(o.imageUrl)}" class="my-place-item__img" style="width:68px;height:68px;object-fit:cover;border-radius:8px" />` : '<div class="my-place-item__img-placeholder" style="width:68px;height:68px;font-size:1.8rem">🏷️</div>'}
              
              <div class="my-place-item__info">
                <div class="my-place-item__name" style="font-size:1.05rem">${escHtml(o.title)}</div>
                <div class="my-place-item__meta" style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span style="font-weight:800;color:#10B981;font-size:1.1rem">${formatPrice(o.newPrice)}</span>
                  ${o.oldPrice ? `<span style="text-decoration:line-through;color:var(--text-muted);font-size:0.9rem">${formatPrice(o.oldPrice)}</span>` : ''}
                  <span class="badge ${o.status === 'active' ? 'badge--success' : 'badge--secondary'}">
                    ${o.status === 'active' ? '● نشط حالياً' : 'منتهي'}
                  </span>
                  <span class="badge" style="background:rgba(27,79,114,0.08);color:var(--primary);font-weight:700;font-size:11.5px">
                    👁️ ${o.views || 0} مشاهدة &nbsp;|&nbsp; 👆 ${o.clicks || 0} نقرة وطلب
                  </span>
                </div>
              </div>

              <!-- Action Buttons: View, Edit, Delete -->
              <div class="my-place-item__actions" style="display:flex;align-items:center;gap:6px;margin-right:auto">
                <button type="button" class="btn btn-sm btn-outline btn-view-user-offer" data-id="${escAttr(oId)}" title="مشاهدة تفاصيل العرض">
                  <span>👁️</span> مشاهدة
                </button>
                <button type="button" class="btn btn-sm btn-outline btn-edit-user-offer" data-id="${escAttr(oId)}" style="color:var(--primary);border-color:var(--primary)" title="تعديل العرض">
                  <span>✏️</span> تعديل
                </button>
                <button type="button" class="btn btn-sm btn-outline btn-delete-user-offer" data-id="${escAttr(oId)}" style="color:var(--danger);border-color:rgba(239,68,68,0.4)" title="حذف العرض">
                  <span>🗑️</span> حذف
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Add offer button
  document.getElementById('btn-open-add-offer')?.addEventListener('click', () => {
    showAddOfferModal(place, user, () => renderPlaceOffersSection($container, user, placeId));
  });

  // View offer click handlers
  $container.querySelectorAll('.btn-view-user-offer').forEach(btn => {
    btn.addEventListener('click', () => {
      const oId = btn.getAttribute('data-id');
      const target = (offers || []).find(o => (o.id || o._id || o._key) === oId);
      if (target) {
        openOfferFullDetailsModal(target, place);
      }
    });
  });

  // Edit offer click handlers
  $container.querySelectorAll('.btn-edit-user-offer').forEach(btn => {
    btn.addEventListener('click', () => {
      const oId = btn.getAttribute('data-id');
      const target = (offers || []).find(o => (o.id || o._id || o._key) === oId);
      if (target) {
        showEditOfferModal(place, target, user, () => renderPlaceOffersSection($container, user, placeId));
      }
    });
  });

  // Delete offer click handlers
  $container.querySelectorAll('.btn-delete-user-offer').forEach(btn => {
    btn.addEventListener('click', async () => {
      const oId = btn.getAttribute('data-id');
      const ok = await showConfirm({
        title: 'حذف العرض',
        message: 'هل أنت متأكد من رغبتك في حذف هذا العرض نهائياً من المكان؟',
        confirmText: 'نعم، حذف العرض',
        cancelText: 'إلغاء'
      });
      if (ok) {
        try {
          await deleteOffer(oId, placeId, user);
          toast.success('تم حذف العرض بنجاح');
          renderPlaceOffersSection($container, user, placeId);
        } catch (err) {
          toast.error(err.message || 'فشل حذف العرض');
        }
      }
    });
  });
}

function showAddOfferModal(place, user, onDone) {
  const modal = showModal({
    title: 'إضافة عرض يومي جديد',
    content: `
      <form id="add-offer-form">
        <div class="form-group">
          <label class="form-label">عنوان العرض <span class="required">*</span></label>
          <input type="text" id="off-title" class="form-input" required placeholder="مثال: خصم 20% على جميع الأصناف / عرض خاص" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">السعر الجديد بعد الخصم (ج.م) <span class="required">*</span></label>
            <input type="number" id="off-new-price" class="form-input" required placeholder="مثال: 80" />
          </div>
          <div class="form-group">
            <label class="form-label">السعر الأصلي قبل الخصم (ج.م)</label>
            <input type="number" id="off-old-price" class="form-input" placeholder="مثال: 100" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">وصف تفاصيل وشروط العرض</label>
          <textarea id="off-desc" class="form-textarea" placeholder="اكتب تفاصيل العرض، الشروط، الأصناف المشمولة..." rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">صورة أو بانر العرض</label>
          <input type="file" id="off-file" accept="image/*" class="form-input" />
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
              toast.info('جاري رفع صورة العرض...');
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
            toast.success('تمت إضافة العرض بنجاح 🎉');
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

function showEditOfferModal(place, offer, user, onDone) {
  const oId = offer.id || offer._id || offer._key;
  const modal = showModal({
    title: `✏️ تعديل العرض: ${escHtml(offer.title)}`,
    content: `
      <form id="edit-offer-form">
        <div class="form-group">
          <label class="form-label">عنوان العرض <span class="required">*</span></label>
          <input type="text" id="edit-off-title" class="form-input" value="${escAttr(offer.title || '')}" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">السعر الجديد (ج.م) <span class="required">*</span></label>
            <input type="number" id="edit-off-new-price" class="form-input" value="${escAttr(offer.newPrice || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label">السعر قبل الخصم (ج.م)</label>
            <input type="number" id="edit-off-old-price" class="form-input" value="${escAttr(offer.oldPrice || '')}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">حالة العرض</label>
          <select id="edit-off-status" class="form-input">
            <option value="active" ${offer.status === 'active' ? 'selected' : ''}>نشط حالياً</option>
            <option value="expired" ${offer.status === 'expired' ? 'selected' : ''}>منتهي</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">وصف تفاصيل وشروط العرض</label>
          <textarea id="edit-off-desc" class="form-textarea" rows="3">${escHtml(offer.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">صورة العرض (اختر ملفاً لتغيير الصورة الحالية)</label>
          ${offer.imageUrl ? `
            <div style="margin-bottom:8px">
              <img src="${escAttr(offer.imageUrl)}" style="max-height:100px;border-radius:6px;object-fit:contain;background:#0f172a;display:block" />
            </div>
          ` : ''}
          <input type="file" id="edit-off-file" accept="image/*" class="form-input" />
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'حفظ التعديلات',
        type: 'primary',
        onClick: async () => {
          const title = document.getElementById('edit-off-title')?.value.trim();
          const newPrice = document.getElementById('edit-off-new-price')?.value;
          const oldPrice = document.getElementById('edit-off-old-price')?.value;
          const status = document.getElementById('edit-off-status')?.value;
          const desc = document.getElementById('edit-off-desc')?.value;
          const fileInput = document.getElementById('edit-off-file');

          if (!title || !newPrice) {
            toast.warning('يرجى ملء عنوان وسعر العرض');
            return;
          }

          let imageUrl = offer.imageUrl || '';
          if (fileInput && fileInput.files[0]) {
            try {
              toast.info('جاري رفع الصورة الجديدة...');
              const res = await uploadImage(fileInput.files[0], 'offers');
              imageUrl = res.url;
            } catch (e) {
              console.warn(e);
            }
          }

          try {
            await updateOffer(oId, {
              title,
              newPrice,
              oldPrice,
              status,
              description: desc,
              imageUrl
            }, user);
            toast.success('تم تحديث العرض بنجاح');
            modal.close();
            onDone();
          } catch (err) {
            toast.error(err.message || 'فشل تحديث العرض');
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
  let place = placeId ? await getPlace(placeId) : null;
  const userPlaces = await getPlacesByOwner(user.uid);

  if (!place) {
    if (!userPlaces || userPlaces.length === 0) {
      $container.innerHTML = `
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-header__title">🛍️ إدارة المنتجات</h1>
            <div class="dashboard-header__subtitle">اعرض كتالوج منتجاتك وأسعارها وتخفيضاتها</div>
          </div>
        </div>
        <div class="empty-state" style="padding:4rem 1rem;background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div class="empty-state__icon">🛍️</div>
          <h2 class="empty-state__title">ليس لديك أي نشاط تجاري مسجل بعد</h2>
          <p class="empty-state__text">لإضافة وإدارة المنتجات، يرجى تسجيل نشاطك وتوثيقه في دليل المنزلة والمطرية أولاً.</p>
          <a href="dashboard.html?section=add" class="btn btn-primary" style="margin-top:1rem">
            <span>➕</span> إضافة مكان ونشاط جديد الآن
          </a>
        </div>
      `;
      return;
    }
    // Auto select first place
    place = userPlaces[0];
    placeId = place.id || place._key;
  }

  if (!place.isVerified && user.role !== 'admin') {
    $container.innerHTML = `
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-header__title">إدارة منتجات: ${escHtml(place.name)}</h1>
          <div class="dashboard-header__subtitle">المنتجات متاحة حصرياً للحسابات الموثقة</div>
        </div>
        <a href="dashboard.html?section=places" class="btn btn-outline">← عودة للأماكن</a>
      </div>

      ${userPlaces && userPlaces.length > 1 ? `
        <!-- Multiple Places Switcher -->
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:18px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:12.5px;font-weight:700;color:var(--text-muted)">🏪 اختر المكان:</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${userPlaces.map(p => {
              const pKey = p.id || p._key;
              const isCur = pKey === placeId;
              return `
                <button type="button" class="btn btn-xs ${isCur ? 'btn-primary' : 'btn-outline'}" onclick="window.switchDashboardSection('products', '${escAttr(pKey)}', true)" style="border-radius:var(--radius-full)">
                  ${isCur ? '✓ ' : ''}${escHtml(p.name)}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="empty-state" style="padding:3.5rem 1rem;background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border)">
        <div class="empty-state__icon">🔒</div>
        <h2>المنتجات متاحة حصرياً للأماكن الموثقة</h2>
        <p class="empty-state__text">وثّق مكانك الآن لتتمكن من إضافة حتى 350 منتجاً في دليلك الرقمي مع الأسعار والصور والوصف</p>
        <a href="place.html?slug=${place.slug || place.id}" class="btn btn-primary" style="margin-top:1rem">طلب التوثيق الآن</a>
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
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
        <button class="btn btn-primary" id="btn-open-add-product" ${products.length >= 350 ? 'disabled' : ''}>
          <span>➕</span> إضافة منتج جديد
        </button>
        <a href="dashboard.html?section=places" class="btn btn-outline">← عودة للأماكن</a>
      </div>
    </div>

    ${userPlaces && userPlaces.length > 1 ? `
      <!-- Multiple Places Switcher -->
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:18px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:12.5px;font-weight:700;color:var(--text-muted)">🏪 اختر المكان لإدارة منتجاته:</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${userPlaces.map(p => {
            const pKey = p.id || p._key;
            const isCur = pKey === placeId;
            return `
              <button type="button" class="btn btn-xs ${isCur ? 'btn-primary' : 'btn-outline'}" onclick="window.switchDashboardSection('products', '${escAttr(pKey)}', true)" style="border-radius:var(--radius-full)">
                ${isCur ? '✓ ' : ''}${escHtml(p.name)}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

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
            <th style="min-width:180px">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${products.length === 0 ? `
            <tr><td colspan="6" class="text-center" style="padding:2rem">لا توجد منتجات مسجلة بعد</td></tr>
          ` : products.map(p => {
            const pId = p.id || p._key;
            const isPending = p.status === 'pending' || (!p.status && p.isApproved === false);
            const isApproved = p.status === 'approved' || p.isApproved === true || (!p.status && p.isApproved === undefined);
            const isRejected = p.status === 'rejected';

            let modBadge = '';
            if (isPending) modBadge = '<span class="badge" style="background:#FEF3C7;color:#D97706;font-weight:700">⏳ قيد المراجعة</span>';
            else if (isApproved) modBadge = '<span class="badge badge--success">✓ معتمد وظاهر</span>';
            else modBadge = `<span class="badge badge--danger" title="${escAttr(p.rejectReason || '')}">✕ مرفوض</span>`;

            return `
              <tr>
                <td>
                  <img src="${p.imageUrl || './icons/icon-72x72.png'}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;background:#0f172a" />
                </td>
                <td>
                  <strong style="font-size:13.5px">${escHtml(p.name)}</strong>
                  ${p.category ? `<div style="font-size:11px;color:var(--text-muted)">🏷️ ${escHtml(p.category)}</div>` : ''}
                  <div style="font-size:11px;color:var(--primary);font-weight:700;margin-top:3px;display:flex;gap:6px">
                    <span>👁️ ${p.views || 0} مشاهدة</span>
                    <span>•</span>
                    <span style="color:#059669">👆 ${p.clicks || 0} طلب</span>
                  </div>
                </td>
                <td>
                  <span style="font-weight:800;color:var(--primary)">${formatPrice(p.price)}</span>
                  ${p.oldPrice ? `<div style="text-decoration:line-through;color:var(--text-muted);font-size:11px">${formatPrice(p.oldPrice)}</div>` : ''}
                </td>
                <td>${modBadge}</td>
                <td>${p.inStock !== false ? '<span class="badge badge--published">متوفر</span>' : '<span class="badge badge--suspended">غير متوفر</span>'}</td>
                <td>
                  <div style="display:flex;gap:4px;flex-wrap:wrap">
                    <button type="button" class="btn btn-xs btn-outline btn-view-user-prod" data-id="${escAttr(pId)}" title="مشاهدة تفاصيل المنتج">
                      👁️ مشاهدة
                    </button>
                    <button type="button" class="btn btn-xs btn-outline btn-make-prod-offer" data-id="${escAttr(pId)}" style="color:#D97706;border-color:#F59E0B;background:rgba(245,158,11,0.08);font-weight:700" title="تعيين هذا المنتج كعرض يومي في الدليل">
                      🎁 كعرض يومي
                    </button>
                    <button type="button" class="btn btn-xs btn-outline btn-edit-user-prod" data-id="${escAttr(pId)}" style="color:var(--primary);border-color:var(--primary)" title="تعديل المنتج">
                      ✏️ تعديل
                    </button>
                    <button type="button" class="btn btn-xs btn-outline btn-delete-user-prod" data-id="${escAttr(pId)}" style="color:var(--danger);border-color:rgba(239,68,68,0.4)" title="حذف المنتج">
                      🗑️ حذف
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Open add product button
  document.getElementById('btn-open-add-product')?.addEventListener('click', () => {
    showAddProductModal(place, user, () => renderPlaceProductsSection($container, user, placeId));
  });

  // View product handlers
  $container.querySelectorAll('.btn-view-user-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      const target = (products || []).find(p => (p.id || p._key) === pId);
      if (target) {
        openProductFullDetailsModal(target, place);
      }
    });
  });

  // Set Product as Daily Offer handlers
  $container.querySelectorAll('.btn-make-prod-offer').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      const target = (products || []).find(p => (p.id || p._key) === pId);
      if (target) {
        showSetProductAsOfferModal(place, target, user, () => renderPlaceProductsSection($container, user, placeId));
      }
    });
  });

  // Edit product handlers
  $container.querySelectorAll('.btn-edit-user-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      const target = (products || []).find(p => (p.id || p._key) === pId);
      if (target) {
        showEditProductModal(place, target, user, () => renderPlaceProductsSection($container, user, placeId));
      }
    });
  });

  // Delete product handlers
  $container.querySelectorAll('.btn-delete-user-prod').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = btn.getAttribute('data-id');
      const ok = await showConfirm({
        title: 'حذف المنتج',
        message: 'هل أنت متأكد من حذف هذا المنتج نهائياً من قائمتك؟',
        confirmText: 'نعم، حذف المنتج',
        cancelText: 'إلغاء'
      });
      if (ok) {
        try {
          await deleteProduct(placeId, pId, user);
          toast.success('تم حذف المنتج بنجاح');
          renderPlaceProductsSection($container, user, placeId);
        } catch (err) {
          toast.error(err.message || 'فشل حذف المنتج');
        }
      }
    });
  });
}

async function showSetProductAsOfferModal(place, product, user, onDone) {
  const pId = product.id || product._key;
  const placeId = place.id || place._key;

  // Check current offers count
  const allOffers = await dbGet('offers') || {};
  const now = Date.now();
  const activeOffers = Object.values(allOffers).filter(
    o => o && o.placeId === placeId && o.status === 'active' && o.endDate > now
  );

  const maxAllowed = place.isVerified ? 3 : 1;
  if (activeOffers.length >= maxAllowed) {
    showModal({
      title: '⚠️ تم الوصول للحد الأقصى من العروض',
      size: 'sm',
      content: `
        <div style="text-align:center;padding:10px">
          <div style="font-size:3rem;margin-bottom:10px">🏷️</div>
          <h3 style="font-size:1.1rem;margin-bottom:8px">لديك ${activeOffers.length} من أصل ${maxAllowed} عروض نشطة</h3>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">
            ${place.isVerified 
              ? 'الحد الأقصى للعروض اليومية المتزامنة للمكان الموثق هو 3 عروض نشطة.' 
              : 'الحد الأقصى للعروض اليومية للمكان غير الموثق هو عرض واحد فقط. يمكنك توثيق مكانك لزيادة الحد إلى 3 عروض.'}
          </p>
          <p style="font-size:12.5px;color:var(--text-muted)">
            لتعيين هذا المنتج كعرض، يرجى حذف أو إيقاف أحد عروضك النشطة من قسم "إدارة العروض".
          </p>
        </div>
      `,
      buttons: [
        {
          label: 'الانتقال لإدارة العروض',
          type: 'primary',
          onClick: () => {
            renderPlaceOffersSection(document.getElementById('dashboard-main-content'), user, placeId);
          }
        },
        { label: 'إغلاق', type: 'ghost', closeOnClick: true }
      ]
    });
    return;
  }

  const defaultNewPrice = Number(product.price) || 0;
  const defaultOldPrice = product.oldPrice ? Number(product.oldPrice) : (defaultNewPrice > 0 ? Math.round(defaultNewPrice * 1.25) : 0);

  const modal = showModal({
    title: `🎁 تعيين كعرض يومي: ${escHtml(product.name)}`,
    size: 'md',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px;padding:4px">
        <!-- Info Banner -->
        <div style="background:rgba(245,158,11,0.09);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-md);padding:10px 14px;font-size:12.5px;color:var(--text-primary)">
          <span>⚡</span> سيتم نشر هذا المنتج فوراً في <strong>العروض اليومية</strong> وتظهر عليه شارة التوفير والخصم.
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">
            المتاح لك: (${activeOffers.length} من ${maxAllowed}) عروض نشطة — <strong>${place.isVerified ? 'حساب موثق ✓' : 'حساب عادي'}</strong>
          </div>
        </div>

        <form id="set-prod-offer-form" onsubmit="return false">
          ${product.imageUrl ? `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;background:var(--surface);padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border)">
              <img src="${escAttr(product.imageUrl)}" style="width:54px;height:54px;object-fit:cover;border-radius:6px;background:#0f172a" />
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px" class="truncate">${escHtml(product.name)}</div>
                <div style="font-size:11.5px;color:var(--text-muted)">سيتم استخدام صورة المنتج الحالية كبانر للعرض</div>
              </div>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">عنوان العرض <span class="required">*</span></label>
            <input type="text" id="po-title" class="form-input" value="${escAttr(product.name)}" required />
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group">
              <label class="form-label">سعر العرض بعد الخصم (ج.م) <span class="required">*</span></label>
              <input type="number" id="po-new-price" class="form-input" value="${defaultNewPrice}" required />
            </div>
            <div class="form-group">
              <label class="form-label">السعر الأصلي قبل الخصم (ج.م)</label>
              <input type="number" id="po-old-price" class="form-input" value="${defaultOldPrice || ''}" placeholder="مثال: 100" />
            </div>
          </div>

          <div id="po-discount-preview" style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:var(--radius-md);padding:8px 12px;font-size:12.5px;color:#065F46;font-weight:700;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
            <span>💰 التوفير للعميل:</span>
            <span id="po-discount-calc-text">احسب الخصم</span>
          </div>

          <div class="form-group">
            <label class="form-label">مدة استمرار العرض</label>
            <select id="po-duration" class="form-select">
              <option value="1">24 ساعة (عرض يومي خاص) ⏰</option>
              <option value="3">3 أيام</option>
              <option value="7" selected>أسبوع كامل (7 أيام)</option>
              <option value="15">15 يوم (نصف شهر)</option>
              <option value="30">30 يوم (شهر كامل)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">تفاصيل وشروط العرض</label>
            <textarea id="po-desc" class="form-textarea" rows="2" placeholder="اكتب تفاصيل أو شروط العرض...">${escHtml(product.description || '')}</textarea>
          </div>
        </form>
      </div>
    `,
    buttons: [
      {
        label: '🚀 تأكيد ونشر كعرض يومي الآن',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const title = document.getElementById('po-title')?.value.trim();
          const newPrice = parseFloat(document.getElementById('po-new-price')?.value);
          const oldPrice = parseFloat(document.getElementById('po-old-price')?.value) || null;
          const durationDays = parseInt(document.getElementById('po-duration')?.value, 10) || 7;
          const desc = document.getElementById('po-desc')?.value.trim();

          if (!title || isNaN(newPrice)) {
            toast.warning('يرجى كتابة عنوان وسعر العرض');
            return;
          }

          let discountPercent = 0;
          if (oldPrice && oldPrice > newPrice) {
            discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
          }

          const startDate = Date.now();
          const endDate = startDate + (durationDays * 24 * 60 * 60 * 1000);

          try {
            await addOffer(placeId, {
              title,
              newPrice,
              oldPrice,
              discountPercent,
              description: desc,
              imageUrl: product.imageUrl || '',
              startDate,
              endDate,
              productId: pId
            }, user);

            toast.success(`تم تعيين "${product.name}" كعرض يومي بنجاح! 🎉`);
            modal.close();
            onDone();
          } catch (err) {
            toast.error(err.message || 'فشل إضافة العرض');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });

  // Dynamic live calculation
  function updateDiscountPreview() {
    const np = parseFloat(document.getElementById('po-new-price')?.value) || 0;
    const op = parseFloat(document.getElementById('po-old-price')?.value) || 0;
    const calcEl = document.getElementById('po-discount-calc-text');
    if (!calcEl) return;

    if (op > np && np > 0) {
      const diff = op - np;
      const pct = Math.round((diff / op) * 100);
      calcEl.innerHTML = `وفرت ${formatPrice(diff)} (خصم ${pct}%) ✨`;
    } else {
      calcEl.innerHTML = `سعر العرض: ${formatPrice(np)}`;
    }
  }

  document.getElementById('po-new-price')?.addEventListener('input', updateDiscountPreview);
  document.getElementById('po-old-price')?.addEventListener('input', updateDiscountPreview);
  updateDiscountPreview();
}

function showAddProductModal(place, user, onDone) {
  const modal = showModal({
    title: 'إضافة منتج جديد',
    content: `
      <form id="add-prod-form">
        <div class="form-group">
          <label class="form-label">اسم المنتج <span class="required">*</span></label>
          <input type="text" id="prod-name" class="form-input" required placeholder="مثال: بيتزا مارجريتا حجم عائلي" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">السعر (ج.م) <span class="required">*</span></label>
            <input type="number" id="prod-price" class="form-input" required placeholder="مثال: 120" />
          </div>
          <div class="form-group">
            <label class="form-label">السعر القديم (اختياري)</label>
            <input type="number" id="prod-old-price" class="form-input" placeholder="مثال: 140" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">تصنيف / قسم المنتج (اختياري)</label>
          <input type="text" id="prod-category" class="form-input" placeholder="مثال: مأكولات، إلكترونيات، ملابس رجالي..." />
        </div>
        <div class="form-group">
          <label class="form-label">وصف المنتج ومواصفاته</label>
          <textarea id="prod-desc" class="form-textarea" placeholder="اكتب وصفاً مختصراً للمنتج، الحجم، المكونات..." rows="3"></textarea>
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
          const category = document.getElementById('prod-category')?.value.trim();
          const desc = document.getElementById('prod-desc')?.value;
          const fileInput = document.getElementById('prod-file');

          if (!name || !price) {
            toast.warning('يرجى ملء الاسم والسعر');
            return;
          }

          let imageUrl = '';
          if (fileInput && fileInput.files[0]) {
            try {
              toast.info('جاري رفع صورة المنتج...');
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
              category,
              description: desc,
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

function showEditProductModal(place, product, user, onDone) {
  const pId = product.id || product._key;
  const modal = showModal({
    title: `✏️ تعديل المنتج: ${escHtml(product.name)}`,
    content: `
      <form id="edit-prod-form">
        <div class="form-group">
          <label class="form-label">اسم المنتج <span class="required">*</span></label>
          <input type="text" id="edit-prod-name" class="form-input" value="${escAttr(product.name || '')}" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">السعر (ج.م) <span class="required">*</span></label>
            <input type="number" id="edit-prod-price" class="form-input" value="${escAttr(product.price || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label">السعر القديم</label>
            <input type="number" id="edit-prod-old-price" class="form-input" value="${escAttr(product.oldPrice || '')}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">تصنيف / قسم المنتج</label>
            <input type="text" id="edit-prod-category" class="form-input" value="${escAttr(product.category || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">حالة التوفر</label>
            <select id="edit-prod-stock" class="form-input">
              <option value="true" ${product.inStock !== false ? 'selected' : ''}>متوفر حالياً</option>
              <option value="false" ${product.inStock === false ? 'selected' : ''}>نفذ من المخزون</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">وصف المنتج ومواصفاته</label>
          <textarea id="edit-prod-desc" class="form-textarea" rows="3">${escHtml(product.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">صورة المنتج (اختر ملفاً لتغيير الصورة الحالية)</label>
          ${product.imageUrl ? `
            <div style="margin-bottom:8px">
              <img src="${escAttr(product.imageUrl)}" style="max-height:100px;border-radius:6px;object-fit:contain;background:#0f172a;display:block" />
            </div>
          ` : ''}
          <input type="file" id="edit-prod-file" accept="image/*" class="form-input" />
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'حفظ التعديلات',
        type: 'primary',
        onClick: async () => {
          const name = document.getElementById('edit-prod-name')?.value.trim();
          const price = document.getElementById('edit-prod-price')?.value;
          const oldPrice = document.getElementById('edit-prod-old-price')?.value;
          const category = document.getElementById('edit-prod-category')?.value.trim();
          const inStock = document.getElementById('edit-prod-stock')?.value === 'true';
          const desc = document.getElementById('edit-prod-desc')?.value;
          const fileInput = document.getElementById('edit-prod-file');

          if (!name || !price) {
            toast.warning('يرجى ملء الاسم والسعر');
            return;
          }

          let imageUrl = product.imageUrl || '';
          if (fileInput && fileInput.files[0]) {
            try {
              toast.info('جاري رفع الصورة الجديدة...');
              const res = await uploadImage(fileInput.files[0], 'products');
              imageUrl = res.url;
            } catch (e) {
              console.warn(e);
            }
          }

          try {
            await updateProduct(place.id || place._key, pId, {
              name,
              price,
              oldPrice,
              category,
              inStock,
              description: desc,
              imageUrl
            }, user);
            toast.success('تم تحديث المنتج بنجاح');
            modal.close();
            onDone();
          } catch (err) {
            toast.error(err.message || 'فشل تحديث المنتج');
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
/**
 * Professional Dashboard Notifications Management (Tabs, Audio Chimes, Individual Delete, Batch Controls)
 */
let _activeNotifFilter = 'all';

async function renderDashboardNotifications($container, user) {
  $container.innerHTML = `<div class="spinner spinner-lg" style="margin:4rem auto"></div>`;
  const allNotifs = await fetchManagedUserNotifications(user.uid);
  const unreadCount = allNotifs.filter(n => !n.isRead).length;
  const newPlacesCount = allNotifs.filter(n => n.type === 'new_place').length;
  const verifiedCount = allNotifs.filter(n => n.type === 'place_verified').length;
  const visitsCount = allNotifs.filter(n => n.type === 'profile_visit' || !n.type).length;

  let filteredNotifs = allNotifs;
  if (_activeNotifFilter === 'unread') filteredNotifs = allNotifs.filter(n => !n.isRead);
  else if (_activeNotifFilter === 'new_place') filteredNotifs = allNotifs.filter(n => n.type === 'new_place');
  else if (_activeNotifFilter === 'verified') filteredNotifs = allNotifs.filter(n => n.type === 'place_verified');
  else if (_activeNotifFilter === 'visits') filteredNotifs = allNotifs.filter(n => n.type === 'profile_visit' || !n.type);

  const soundOn = isNotificationSoundEnabled();

  $container.innerHTML = `
    <div class="dashboard-header animate-fade-in-up" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-4)">
      <div>
        <h1 class="dashboard-title" style="margin-bottom:4px;display:flex;align-items:center;gap:8px">
          <span>🔔</span> سجل الإشعارات وزوار البروفايل
          ${unreadCount > 0 ? `<span class="badge badge--danger" style="font-size:12px;padding:2px 8px">${unreadCount} جديد</span>` : ''}
        </h1>
        <p class="dashboard-subtitle" style="margin:0;color:var(--text-muted);font-size:13px">
          إدارة شاملة لجميع التنبيهات وزوار الأماكن والأنشطة المنضمة والموثقة حديثاً
        </p>
      </div>

      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <!-- Sound Toggle Button -->
        <button type="button" class="btn btn-sm ${soundOn ? 'btn-outline' : 'btn-ghost'}" id="btn-toggle-notif-sound" style="font-size:12px;gap:6px" title="تفعيل أو كتم صوت الإشعارات">
          <span>${soundOn ? '🔊' : '🔇'}</span>
          <span>${soundOn ? 'صوت الإشعارات: مفعّل' : 'صوت الإشعارات: مكتوم'}</span>
        </button>

        <button type="button" class="btn btn-sm btn-ghost" id="btn-test-notif-sound" style="font-size:12px;gap:4px" title="تجربة رنة التنبيه">
          <span>🔔</span> تجربة الصوت
        </button>

        ${allNotifs.length > 0 ? `
          <button class="btn btn-sm btn-outline" id="btn-mark-all-read" style="font-size:12px;gap:4px">
            <span>✓</span> تحديد الكل كمقروء
          </button>
          <button class="btn btn-sm btn-ghost" id="btn-clear-all-notifs" style="color:var(--danger);font-size:12px;gap:4px">
            <span>🗑️</span> مسح الكل
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Category Filter Tabs -->
    <div style="display:flex;gap:8px;align-items:center;overflow-x:auto;padding-bottom:12px;margin-bottom:var(--space-4)">
      <button type="button" class="btn btn-sm notif-filter-tab ${_activeNotifFilter === 'all' ? 'btn-primary' : 'btn-outline'}" data-filter="all" style="border-radius:9999px;font-size:12px">
        🔔 الكل (${allNotifs.length})
      </button>
      <button type="button" class="btn btn-sm notif-filter-tab ${_activeNotifFilter === 'unread' ? 'btn-primary' : 'btn-outline'}" data-filter="unread" style="border-radius:9999px;font-size:12px">
        🔴 غير المقروءة (${unreadCount})
      </button>
      <button type="button" class="btn btn-sm notif-filter-tab ${_activeNotifFilter === 'new_place' ? 'btn-primary' : 'btn-outline'}" data-filter="new_place" style="border-radius:9999px;font-size:12px">
        🎉 انضمام جديد (${newPlacesCount})
      </button>
      <button type="button" class="btn btn-sm notif-filter-tab ${_activeNotifFilter === 'verified' ? 'btn-primary' : 'btn-outline'}" data-filter="verified" style="border-radius:9999px;font-size:12px">
        👑 التوثيق الرسمي (${verifiedCount})
      </button>
      <button type="button" class="btn btn-sm notif-filter-tab ${_activeNotifFilter === 'visits' ? 'btn-primary' : 'btn-outline'}" data-filter="visits" style="border-radius:9999px;font-size:12px">
        👁️ زوار البروفايل (${visitsCount})
      </button>
    </div>

    ${filteredNotifs.length === 0 ? `
      <div class="empty-state" style="background:var(--surface);border-radius:var(--radius-lg);padding:3rem 1.5rem;text-align:center;border:1px solid var(--border)">
        <div style="font-size:3.5rem;margin-bottom:12px">${_activeNotifFilter === 'unread' ? '✨' : '🔕'}</div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:6px">
          ${_activeNotifFilter === 'unread' ? 'رائع! لا توجد أي إشعارات غير مقروءة' : 'لا توجد إشعارات في هذا القسم'}
        </h3>
        <p style="color:var(--text-muted);font-size:13px;max-width:400px;margin:0 auto">
          ستظهر أي تنبيهات جديدة أو أماكن منضمة أو زيارات لملفك الشخصي فورياً هنا مع صوت تنبيهي.
        </p>
      </div>
    ` : `
      <div class="notifications-list" style="display:flex;flex-direction:column;gap:12px">
        ${filteredNotifs.map(n => {
          const isUnread = !n.isRead;
          const timeStr = formatTimeAgo(n.createdAt);
          const isGuest = n.isGuest || !n.visitorUid;

          if (n.type === 'new_place') {
            return `
              <div class="notification-card" id="notif-card-${n.id}" style="background:${isUnread ? 'rgba(16, 185, 129, 0.06)' : 'var(--surface)'};border:1px solid ${isUnread ? '#10B981' : 'var(--border)'};border-radius:var(--radius-md);padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all 0.25s ease;flex-wrap:wrap">
                <div style="width:46px;height:46px;border-radius:50%;background:rgba(16, 185, 129, 0.15);color:#059669;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;border:1.5px solid rgba(16, 185, 129, 0.3)">
                  🏪
                </div>
                <div style="flex:1;min-width:220px">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                    <div style="display:flex;align-items:center;gap:6px">
                      <span class="badge" style="background:#D1FAE5;color:#065F46;font-weight:700;font-size:11px;padding:2px 8px;border-radius:var(--radius-full)">🎉 انضمام جديد</span>
                      <strong style="font-size:13.5px;color:var(--text-primary)">${escHtml(n.placeName)}</strong>
                    </div>
                    <div style="font-size:11px;color:var(--text-muted)">⏱️ ${timeStr}</div>
                  </div>
                  <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;line-height:1.5">
                    (${escHtml(n.placeName)}) من (${escHtml(n.placeAddress || 'المنزلة')}) أنضم حديثاً إلى دليل المنزلة والمطرية الرقمي.
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <a href="${escAttr(n.actionUrl || `place.html?slug=${n.placeSlug}`)}" class="btn btn-sm btn-primary" style="font-size:12px;padding:6px 14px;border-radius:var(--radius-full);gap:5px;white-space:nowrap;display:inline-flex;align-items:center">
                    <span>👁️</span> مشاهدة المكان
                  </a>
                  ${isUnread ? `
                    <button type="button" class="btn btn-sm btn-outline btn-mark-one-read" data-notif-id="${escAttr(n.id)}" title="تحديد كمقروء" style="font-size:11px;padding:5px 8px;border-radius:var(--radius-full)">
                      ✓
                    </button>
                  ` : ''}
                  <button type="button" class="btn btn-sm btn-ghost btn-delete-one-notif" data-notif-id="${escAttr(n.id)}" title="حذف وإخفاء هذا الإشعار" style="color:var(--danger);font-size:13px;padding:4px 8px;border-radius:var(--radius-full)">
                    🗑️
                  </button>
                </div>
              </div>
            `;
          }

          if (n.type === 'place_verified') {
            return `
              <div class="notification-card" id="notif-card-${n.id}" style="background:${isUnread ? 'rgba(245, 158, 11, 0.07)' : 'var(--surface)'};border:1px solid ${isUnread ? '#F59E0B' : 'var(--border)'};border-radius:var(--radius-md);padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all 0.25s ease;flex-wrap:wrap">
                <div style="width:46px;height:46px;border-radius:50%;background:rgba(245, 158, 11, 0.15);color:#D97706;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;border:1.5px solid rgba(245, 158, 11, 0.3)">
                  👑
                </div>
                <div style="flex:1;min-width:220px">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                    <div style="display:flex;align-items:center;gap:6px">
                      <span class="badge" style="background:#FEF3C7;color:#92400E;font-weight:700;font-size:11px;padding:2px 8px;border-radius:var(--radius-full)">👑 توثيق رسمي</span>
                      <strong style="font-size:13.5px;color:var(--text-primary)">${escHtml(n.placeName)}</strong>
                    </div>
                    <div style="font-size:11px;color:var(--text-muted)">⏱️ ${timeStr}</div>
                  </div>
                  <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;line-height:1.5">
                    وثّق (${escHtml(n.placeName)}) ملفه لكي يظهر أمام الكل في كامل دليل المنزلة والمطرية الرقمي أولاً!
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <a href="${escAttr(n.actionUrl || 'https://wa.me/wasendernew')}" target="_blank" rel="noopener" class="btn btn-sm" style="font-size:12px;padding:6px 14px;border-radius:var(--radius-full);gap:5px;white-space:nowrap;background:linear-gradient(135deg, #10B981 0%, #059669 100%);color:#fff;border:none;box-shadow:0 2px 8px rgba(16,185,129,0.3);display:inline-flex;align-items:center">
                    <span>🚀</span> وثّق ملفك الآن
                  </a>
                  ${isUnread ? `
                    <button type="button" class="btn btn-sm btn-outline btn-mark-one-read" data-notif-id="${escAttr(n.id)}" title="تحديد كمقروء" style="font-size:11px;padding:5px 8px;border-radius:var(--radius-full)">
                      ✓
                    </button>
                  ` : ''}
                  <button type="button" class="btn btn-sm btn-ghost btn-delete-one-notif" data-notif-id="${escAttr(n.id)}" title="حذف وإخفاء هذا الإشعار" style="color:var(--danger);font-size:13px;padding:4px 8px;border-radius:var(--radius-full)">
                    🗑️
                  </button>
                </div>
              </div>
            `;
          }

          return `
            <div class="notification-card" id="notif-card-${n.id}" style="background:${isUnread ? 'rgba(27, 79, 114, 0.05)' : 'var(--surface)'};border:1px solid ${isUnread ? 'var(--primary)' : 'var(--border)'};border-radius:var(--radius-md);padding:12px 16px;display:flex;align-items:center;gap:14px;transition:all 0.25s ease;flex-wrap:wrap">
              <div style="width:44px;height:44px;border-radius:50%;background:${isGuest ? 'var(--surface-3)' : 'var(--primary-alpha)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1.5px solid var(--border)">
                ${n.visitorPhoto ? `
                  <img src="${escAttr(n.visitorPhoto)}" alt="${escAttr(n.visitorName)}" style="width:100%;height:100%;object-fit:cover" />
                ` : `
                  <span style="font-size:1.3rem">${isGuest ? '👤' : (n.visitorName?.charAt(0) || '👤')}</span>
                `}
              </div>

              <div style="flex:1;min-width:200px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                  <div style="font-weight:700;font-size:13.5px;color:var(--text-primary)">
                    ${isGuest ? `<span style="color:var(--text-muted)">زائر (غير مسجل)</span>` : escHtml(n.visitorName)}
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">⏱️ ${timeStr}</div>
                </div>

                <div style="font-size:12.5px;color:var(--text-secondary);margin-top:2px">
                  ${isGuest ? 'قام زائر بتصفح' : 'قام بزيارة وتصفح'} صفحة <strong>${escHtml(n.placeName || 'المكان')}</strong>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:6px">
                ${isUnread ? `
                  <button type="button" class="btn btn-sm btn-outline btn-mark-one-read" data-notif-id="${escAttr(n.id)}" title="تحديد كمقروء" style="font-size:11px;padding:5px 8px;border-radius:var(--radius-full)">
                    ✓
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-ghost btn-delete-one-notif" data-notif-id="${escAttr(n.id)}" title="حذف هذا الإشعار" style="color:var(--danger);font-size:13px;padding:4px 8px;border-radius:var(--radius-full)">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  // ── Setup Action Listeners ──

  // Filter Tabs click
  $container.querySelectorAll('.notif-filter-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      _activeNotifFilter = tab.getAttribute('data-filter') || 'all';
      await renderDashboardNotifications($container, user);
    });
  });

  // Sound Toggle click
  document.getElementById('btn-toggle-notif-sound')?.addEventListener('click', () => {
    const isNowOn = toggleNotificationSound();
    toast.info(isNowOn ? 'تم تفعيل صوت التنبيهات 🔊' : 'تم كتم صوت التنبيهات 🔇');
    renderDashboardNotifications($container, user);
  });

  // Sound Test click
  document.getElementById('btn-test-notif-sound')?.addEventListener('click', () => {
    playNotificationSound();
    toast.success('🔔 تم تشغيل نغمة التنبيه البلورية بنجاح');
  });

  // Individual Delete Button Click
  $container.querySelectorAll('.btn-delete-one-notif').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const notifId = btn.getAttribute('data-notif-id');
      const card = document.getElementById(`notif-card-${notifId}`);
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(30px)';
      }
      await deleteSingleNotification(notifId, user?.uid);
      toast.info('تم حذف وإخفاء الإشعار بنجاح');
      setTimeout(async () => {
        await renderDashboardNotifications($container, user);
        await updateAllNotificationBadges(user?.uid);
      }, 200);
    });
  });

  // Individual Mark as Read Button Click
  $container.querySelectorAll('.btn-mark-one-read').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const notifId = btn.getAttribute('data-notif-id');
      await markSingleNotificationAsRead(notifId, user?.uid);
      toast.success('تم التحديد كمقروء ✓');
      await renderDashboardNotifications($container, user);
      await updateAllNotificationBadges(user?.uid);
    });
  });

  // Batch Mark All Read
  document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
    await markAllUserNotificationsAsRead(user?.uid);
    toast.success('تم تحديد جميع الإشعارات كمقروءة ✓');
    await renderDashboardNotifications($container, user);
    await updateAllNotificationBadges(user?.uid);
  });

  // Batch Clear All
  document.getElementById('btn-clear-all-notifs')?.addEventListener('click', async () => {
    const ok = await showConfirm({
      title: 'مسح جميع الإشعارات',
      message: 'هل أنت متأكد من رغبتك في حذف وإخفاء كافة سجلات الزيارات والإشعارات نهائياً؟',
      confirmText: 'نعم، حذف الكل',
      cancelText: 'إلغاء'
    });
    if (ok) {
      await clearAllUserNotifications(user?.uid);
      toast.success('تم مسح جميع الإشعارات بنجاح 🗑️');
      await renderDashboardNotifications($container, user);
      await updateAllNotificationBadges(user?.uid);
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


// ─────────────────────────────────────────────
//  LOYALTY & REWARDS SECTION (نادي الولاء والمكافآت)
// ─────────────────────────────────────────────
async function renderLoyaltySection($container, user) {
  $container.innerHTML = '<div class="spinner spinner-lg" style="margin:4rem auto"></div>';

  const [loyalty, userPlaces] = await Promise.all([
    getUserLoyaltyProfile(user.uid),
    getPlacesByOwner(user.uid).catch(() => [])
  ]);

  const levelInfo = getLoyaltyLevelInfo(loyalty?.points || 0);
  const unverifiedPlaces = (userPlaces || []).filter(p => !p.isVerified);

  $container.innerHTML = `
    <div class="admin-fade-in" style="max-width:960px;margin:0 auto">
      <!-- Header -->
      <div class="dashboard-header" style="margin-bottom:24px">
        <h1 class="dashboard-header__title" style="display:flex;align-items:center;gap:10px">
          <span>🎁</span>
          <span>نادي الولاء والمكافآت</span>
          <span class="badge" style="background:#F5A623;color:#0B1E30;font-size:14px;font-weight:800;padding:3px 12px;border-radius:9999px">
            ${levelInfo.currentLevel.icon} ${levelInfo.currentLevel.name}
          </span>
        </h1>
        <div class="dashboard-header__subtitle">
          اجمع النقاط بتفاعلك وتقييماتك في الدليل، واستبدل <strong>5,000 نقطة</strong> بتوثيق مجاني رسمي لمكانك (علامة التوثيق ✓)!
        </div>
      </div>

      <!-- Main Status Card -->
      <div style="background:linear-gradient(135deg,#0F2B48,#1B4F72);border-radius:20px;padding:24px;color:#fff;box-shadow:0 10px 30px rgba(15,43,72,0.25);border:1.5px solid rgba(245,166,35,0.3);margin-bottom:24px;position:relative;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px">
          <div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:6px">رصيد نقاطك الحالي:</div>
            <div style="font-size:2.6rem;font-weight:800;color:#F5A623;line-height:1;display:flex;align-items:center;gap:10px">
              <span>${(levelInfo.points || 0).toLocaleString('ar-EG')}</span>
              <span style="font-size:1.1rem;color:#fff;font-weight:600">نقطة</span>
            </div>
            <div style="font-size:12.5px;color:rgba(255,255,255,0.7);margin-top:6px">
              إجمالي ما جمعته: ${(loyalty.totalEarned || 0).toLocaleString('ar-EG')} نقطة
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <button type="button" id="btn-claim-daily-bonus" class="btn" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;font-weight:800;border-radius:12px;padding:10px 18px;font-size:13px">
              <span>☀️</span> استلام مكافأة الدخول اليومي (+10 نقاط)
            </button>
          </div>
        </div>

        <!-- Progress to 5000 points / Next Level -->
        <div style="margin-top:20px;background:rgba(0,0,0,0.2);padding:14px 16px;border-radius:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;margin-bottom:8px">
            <span>الهدف الذهبي: <strong>توثيق المكان الرسمي (5,000 نقطة)</strong></span>
            <span style="color:#F5A623;font-weight:800">${Math.min(100, Math.round((levelInfo.points / 5000) * 100))}%</span>
          </div>
          <div style="width:100%;height:10px;background:rgba(255,255,255,0.15);border-radius:9999px;overflow:hidden">
            <div style="width:${Math.min(100, Math.round((levelInfo.points / 5000) * 100))}%;height:100%;background:linear-gradient(90deg,#F5A623,#10B981);border-radius:9999px;transition:width 0.4s ease"></div>
          </div>
          <div style="font-size:11.5px;color:rgba(255,255,255,0.8);margin-top:6px">
            ${levelInfo.canRedeemVerification 
              ? '🎉 مبروك! لقد جمعت 5,000 نقطة ويمكنك الآن توثيق نشاطك مجاناً!' 
              : `متبقي لك <strong>${levelInfo.pointsToVerification.toLocaleString('ar-EG')} نقطة</strong> للحصول على التوثيق المجاني!`
            }
          </div>
        </div>
      </div>

      <!-- 5000 Points Verification Redemption Feature Card -->
      <div style="background:var(--surface,#fff);border:2px solid ${levelInfo.canRedeemVerification ? '#10B981' : 'var(--border,#e2e8f0)'};border-radius:18px;padding:22px;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <div style="width:50px;height:50px;border-radius:14px;background:${levelInfo.canRedeemVerification ? 'rgba(16,185,129,0.15)' : 'rgba(245,166,35,0.15)'};color:${levelInfo.canRedeemVerification ? '#059669' : '#D97706'};display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">
            ✓
          </div>
          <div style="flex:1">
            <h3 style="font-weight:800;font-size:16px;color:var(--text-primary,#0F2B48);margin-bottom:4px">
              🌟 استبدال 5,000 نقطة بتوثيق رسمي لمكانك (Verified Badge)
            </h3>
            <p style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">
              العلامة الموثقة الزرقاء/الخضراء تمنح نشاطك ثقة العملاء وتجعله يتصدر نتائج البحث ويوفر إحصائيات متقدمة مجاناً لمدة عام كامل.
            </p>

            ${levelInfo.canRedeemVerification ? `
              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:16px">
                ${unverifiedPlaces.length > 0 ? `
                  <div class="form-group" style="margin-bottom:12px">
                    <label class="form-label" style="font-weight:700">اختر المكان الذي ترغب في توثيقه:</label>
                    <select id="select-redeem-place" class="form-select" style="font-weight:700">
                      ${unverifiedPlaces.map(p => `<option value="${escAttr(p.id)}">${escHtml(p.name)} (${escHtml(p.area || 'المنزلة')})</option>`).join('')}
                    </select>
                  </div>
                  <button type="button" id="btn-redeem-verification-action" class="btn btn-primary" style="background:#10B981;border:none;border-radius:10px;padding:10px 24px;font-weight:800;font-size:14px">
                    🚀 تأكيد استبدال 5,000 نقطة وتوثيق المكان فوراً ✓
                  </button>
                ` : (userPlaces.length > 0 ? `
                  <div style="color:#059669;font-weight:700;font-size:13.5px">
                    ✅ كافة الأماكن المسجلة بحسابك موثقة بالفعل! يمكنك الاحتفاظ بالنقاط أو إضافة مكان جديد لتوثيقه.
                  </div>
                ` : `
                  <div style="color:#D97706;font-size:13px">
                    💡 ليس لديك أماكن مضافة بعد. <a href="dashboard.html?section=add" style="font-weight:800;color:var(--primary)">أضف نشاطك أولاً</a> ثم استبدل الـ 5000 نقطة لتوثيقه فوراً.
                  </div>
                `)}
              </div>
            ` : `
              <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2,#f8fafc);padding:12px 16px;border-radius:10px;font-size:13px;flex-wrap:wrap;gap:10px">
                <span style="color:var(--text-muted)">
                  🔒 الزر سيتفعل تلقائياً فور وصول رصيدك إلى <strong>5,000 نقطة</strong>
                </span>
                <span style="font-weight:700;color:#0284C7">
                  رصيدك: ${levelInfo.points} / 5,000
                </span>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- How to Earn Points Guide -->
      <div style="background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:18px;padding:20px;margin-bottom:24px">
        <h3 style="font-weight:800;font-size:15px;color:var(--text-primary,#0F2B48);margin-bottom:14px;display:flex;align-items:center;gap:6px">
          <span>⚡</span>
          <span>كيف تجمع النقاط بسرعة في دليل المنزلة والمطرية؟</span>
        </h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:10px">
          ${Object.entries(POINTS_RULES).map(([k, rule]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--surface-2,#f8fafc);border-radius:10px;border:1px solid var(--border,#e2e8f0)">
              <span style="font-size:13px;color:var(--text-primary,#0F2B48)">${escHtml(rule.label)}</span>
              <span class="badge" style="background:rgba(245,166,35,0.18);color:#D97706;font-weight:800;font-size:12px">+${rule.points} نقطة</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Points Transaction History Log -->
      <div style="background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:18px;padding:20px">
        <h3 style="font-weight:800;font-size:15px;color:var(--text-primary,#0F2B48);margin-bottom:14px;display:flex;align-items:center;gap:6px">
          <span>📜</span>
          <span>سجل نشاط النقاط والمكافآت</span>
        </h3>
        ${loyalty.history && loyalty.history.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:8px">
            ${loyalty.history.map(item => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border,#e2e8f0)">
                <div>
                  <div style="font-weight:700;font-size:13px;color:var(--text-primary,#0F2B48)">${escHtml(item.label)}</div>
                  <div style="font-size:11.5px;color:var(--text-muted)">${formatDate(item.createdAt || Date.now())}</div>
                </div>
                <span style="font-weight:800;font-size:14px;color:${item.pointsDelta > 0 ? '#10B981' : '#EF4444'}">
                  ${item.amount} نقطة
                </span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">
            لم تسجل أي حركات نقاط بعد. ابدأ بالتفاعل والتقييم لجمع أولى نقاطك! ⭐
          </div>
        `}
      </div>
    </div>
  `;

  // Daily Bonus Listener
  document.getElementById('btn-claim-daily-bonus')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-claim-daily-bonus');
    if (btn) btn.disabled = true;
    const res = await claimDailyBonus(user.uid);
    if (res.success) {
      toast.success('🎉 حصلت على +10 نقاط مكافأة تسجيل الدخول اليومي!');
      await renderLoyaltySection($container, user);
    } else if (res.reason === 'already_claimed') {
      toast.info('لقد استلمت مكافأة اليوم بالفعل، عد غداً للحصول على 10 نقاط جديدة! ☀️');
    }
    if (btn) btn.disabled = false;
  });

  // Verification Redemption Listener
  document.getElementById('btn-redeem-verification-action')?.addEventListener('click', async () => {
    const select = document.getElementById('select-redeem-place');
    const placeId = select?.value;
    const placeName = select?.options[select.selectedIndex]?.textContent || '';

    if (!placeId) {
      toast.warning('يرجى اختيار المكان أولاً');
      return;
    }

    const ok = await showConfirm({
      title: '🌟 استبدال 5000 نقطة بالتوثيق',
      message: `هل ترغب في استبدال 5,000 نقطة لتوثيق نشاطك (${placeName}) لمدة عام كامل؟`,
      confirmText: 'نعم، استبدال وتوثيق فوراً',
      cancelText: 'إلغاء'
    });

    if (ok) {
      const res = await redeemPointsForVerification(user.uid, placeId, placeName);
      if (res.success) {
        toast.success(res.message);
        await renderLoyaltySection($container, user);
      } else {
        toast.error(res.message || 'فشلت العملية');
      }
    }
  });
}


// ─────────────────────────────────────────────────────────────────────────
//  DASHBOARD AROUND ME SECTION (بالقرب مني بالـ GPS)
// ─────────────────────────────────────────────────────────────────────────
async function renderDashboardAroundMeSection($container) {
  $container.innerHTML = `
    <div class="admin-fade-in">
      <div class="dashboard-header" style="margin-bottom:20px">
        <h1 class="dashboard-header__title" style="display:flex;align-items:center;gap:8px">
          <span>🗺️</span>
          <span>الأماكن والخدمات بالقرب مني</span>
        </h1>
        <div class="dashboard-header__subtitle">
          اكتشف الصيدليات، ماكينات ATM، الأطباء، والمطاعم الأقرب لموقعك الحالي في المنزلة والمطرية
        </div>
      </div>

      <div id="dash-around-me-radar-mount"></div>
    </div>
  `;

  mountAroundMeRadar('dash-around-me-radar-mount');
}
