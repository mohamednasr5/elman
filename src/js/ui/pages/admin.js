/**
 * المنزلة وناسها — Admin Control Panel
 * Comprehensive admin panel: stats, user management, place verification,
 * categories CRUD, offers, products, ads, verification requests, and site settings.
 */

import { dbGet, dbSet, dbUpdate, dbRemove, dbPush, serverTimestamp, getSettings, getCategories } from '../../core/db.js';
import { isAdmin, isSuperAdmin } from '../../core/auth.js';
import { renderVerifiedBadge, renderStatusBadge } from '../components/VerifiedBadge.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
// navigate removed — using direct location.href
import { formatDate } from '../../utils/date.js';

export async function renderAdmin($container, { user, section = 'overview' }) {
  if (!user || !isAdmin(user)) {
    window.location.href = 'index.html';
    return;
  }

  $container.innerHTML = `
    <div class="dashboard-layout">
      <!-- Admin Sidebar -->
      <aside class="dashboard-sidebar" style="background:#0F273D;color:#fff">
        <div class="dashboard-sidebar__user" style="border-color:rgba(255,255,255,0.1)">
          <img src="${user.photoURL || './icons/icon-72x72.png'}" class="dashboard-sidebar__avatar" alt="${user.name}" />
          <div>
            <div class="dashboard-sidebar__name" style="color:#fff">${escHtml(user.name)}</div>
            <div class="dashboard-sidebar__role" style="color:var(--secondary)">إدارة المنصة ⭐</div>
          </div>
        </div>

        <nav class="dashboard-sidebar__nav">
          <a href="admin.html" class="dashboard-nav-item ${section === 'overview' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>📊</span> الإحصائيات العامة
          </a>
          <a href="admin.html?section=places" class="dashboard-nav-item ${section === 'places' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>📍</span> إدارة الأماكن
          </a>
          <a href="admin.html?section=verification" class="dashboard-nav-item ${section === 'verification' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>⭐</span> طلبات التوثيق
          </a>
          <a href="admin.html?section=categories" class="dashboard-nav-item ${section === 'categories' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>📁</span> إدارة التصنيفات
          </a>
          <a href="admin.html?section=users" class="dashboard-nav-item ${section === 'users' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>👥</span> إدارة المستخدمين
          </a>
          <a href="admin.html?section=offers" class="dashboard-nav-item ${section === 'offers' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>🏷️</span> إدارة العروض
          </a>
          <a href="admin.html?section=ads" class="dashboard-nav-item ${section === 'ads' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>📢</span> إدارة الإعلانات
          </a>
          <a href="admin.html?section=settings" class="dashboard-nav-item ${section === 'settings' ? 'active' : ''}" style="color:rgba(255,255,255,0.8)">
            <span>⚙️</span> إعدادات الموقع
          </a>

          <div class="dashboard-nav-section" style="color:rgba(255,255,255,0.4)">العودة</div>
          <a href="dashboard.html" class="dashboard-nav-item" style="color:rgba(255,255,255,0.6)">
            <span>🏠</span> لوحة المستخدم
          </a>
          <a href="index.html" class="dashboard-nav-item" style="color:rgba(255,255,255,0.6)">
            <span>🌐</span> الصفحة الرئيسية
          </a>
        </nav>
      </aside>

      <!-- Admin Main Area -->
      <main class="dashboard-content" id="admin-main-area">
        <div class="spinner spinner-lg" style="margin:4rem auto"></div>
      </main>
    </div>
  `;

  const $main = document.getElementById('admin-main-area');

  try {
    if (section === 'overview') await renderAdminOverview($main);
    else if (section === 'places') await renderAdminPlaces($main);
    else if (section === 'verification') await renderAdminVerification($main, user);
    else if (section === 'categories') await renderAdminCategories($main);
    else if (section === 'users') await renderAdminUsers($main, user);
    else if (section === 'offers') await renderAdminOffers($main);
    else if (section === 'ads') await renderAdminAds($main, user);
    else if (section === 'settings') await renderAdminSettings($main);
  } catch (err) {
    console.error('[Admin] Section error:', err);
  }
}

// ── 1. Admin Overview ──
async function renderAdminOverview($container) {
  const [usersMap, placesMap, offersMap, adsMap, reqsMap] = await Promise.all([
    dbGet('users') || {},
    dbGet('places') || {},
    dbGet('offers') || {},
    dbGet('ads') || {},
    dbGet('verificationRequests') || {}
  ]);

  const users = Object.values(usersMap);
  const places = Object.values(placesMap);
  const offers = Object.values(offersMap);
  const ads = Object.values(adsMap);
  const pendingReqs = Object.values(reqsMap).filter(r => r && r.status === 'pending');

  const verifiedPlaces = places.filter(p => p.isVerified);
  const unverifiedPlaces = places.filter(p => !p.isVerified);

  $container.innerHTML = `
    <div class="admin-header">
      <h1 class="admin-header__title">لوحة التحكم الشاملة — المنزلة وناسها</h1>
      <p class="admin-header__subtitle">مراقبة وإدارة جميع أقسام المنصة والمستخدمين والأماكن</p>
    </div>

    <!-- KPIs -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__icon">👥</div>
        <div class="stat-card__value">${users.length}</div>
        <div class="stat-card__label">المستخدمين المسجلين</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">📍</div>
        <div class="stat-card__value">${places.length}</div>
        <div class="stat-card__label">إجمالي الأماكن</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">⭐</div>
        <div class="stat-card__value" style="color:var(--secondary)">${verifiedPlaces.length}</div>
        <div class="stat-card__label">أماكن موثقة</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">⏳</div>
        <div class="stat-card__value" style="color:var(--danger)">${pendingReqs.length}</div>
        <div class="stat-card__label">طلبات توثيق معلقة</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">🏷️</div>
        <div class="stat-card__value">${offers.length}</div>
        <div class="stat-card__label">إجمالي العروض</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">📢</div>
        <div class="stat-card__value">${ads.length}</div>
        <div class="stat-card__label">الإعلانات النشطة</div>
      </div>
    </div>

    <!-- Quick Sections -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:var(--space-6);margin-top:var(--space-6)">
      <!-- Pending Verification -->
      <div class="form-section">
        <h2 class="form-section__title"><span>⭐</span> أحدث طلبات التوثيق (${pendingReqs.length})</h2>
        ${pendingReqs.length === 0 ? '<p class="text-muted">لا توجد طلبات توثيق معلقة</p>' : `
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            ${pendingReqs.slice(0, 5).map(r => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3);background:var(--surface-2);border-radius:var(--radius-md)">
                <div>
                  <strong>${escHtml(r.placeName)}</strong>
                  <div style="font-size:var(--font-size-xs);color:var(--text-muted)">بواسطة: ${escHtml(r.ownerName || r.ownerEmail)}</div>
                </div>
                <a href="admin.html?section=verification" class="btn btn-sm btn-secondary">مراجعة</a>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Recent Places -->
      <div class="form-section">
        <h2 class="form-section__title"><span>📍</span> أحدث الأماكن المضافة</h2>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          ${places.slice(-5).reverse().map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3);background:var(--surface-2);border-radius:var(--radius-md)">
              <div>
                <strong>${escHtml(p.name)}</strong>
                <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${escHtml(p.area || 'المنزلة')}</div>
              </div>
              <a href="place.html?slug=${p.slug}" target="_blank" class="btn btn-sm btn-outline">عرض</a>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── 2. Admin Places ──
async function renderAdminPlaces($container) {
  const placesMap = await dbGet('places') || {};
  const places = Object.entries(placesMap).map(([id, p]) => ({ ...p, _id: id }));

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة الأماكن (${places.length})</h1>
        <div class="dashboard-header__subtitle">التحكم في توثيق وحالة ونشر الأماكن</div>
      </div>
    </div>

    <!-- Search filter -->
    <div class="filter-bar">
      <input type="search" id="admin-place-search" class="form-input" placeholder="بحث باسم المكان..." />
    </div>

    <!-- Places Table -->
    <div class="dashboard-table-wrapper">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>المكان</th>
            <th>التصنيف</th>
            <th>المنطقة</th>
            <th>التوثيق</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody id="admin-places-tbody">
          ${renderAdminPlacesTableRows(places)}
        </tbody>
      </table>
    </div>
  `;

  // Search filter
  document.getElementById('admin-place-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = places.filter(p => p.name?.toLowerCase().includes(q) || p.area?.toLowerCase().includes(q));
    document.getElementById('admin-places-tbody').innerHTML = renderAdminPlacesTableRows(filtered);
  });
}

function renderAdminPlacesTableRows(places) {
  if (!places.length) return '<tr><td colspan="6" class="text-center">لا توجد أماكن</td></tr>';

  return places.map(p => `
    <tr>
      <td>
        <strong>${escHtml(p.name)}</strong>
        <div style="font-size:11px;color:var(--text-muted)">${p.phone || ''}</div>
      </td>
      <td>${escHtml(p.categoryId || 'عام')}</td>
      <td>${escHtml(p.area || 'المنزلة')}</td>
      <td>
        <button class="btn btn-xs ${p.isVerified ? 'btn-danger' : 'btn-secondary'}" onclick="togglePlaceVerification('${escAttr(p._id)}', ${!p.isVerified})">
          ${p.isVerified ? '✓ موثق (إلغاء)' : 'توثيق ⭐'}
        </button>
      </td>
      <td>${renderStatusBadge(p.status || 'published')}</td>
      <td>
        <div style="display:flex;gap:4px">
          <a href="place.html?slug=${escAttr(p.slug)}" target="_blank" class="btn btn-xs btn-outline">عرض</a>
          <button class="btn btn-xs btn-danger" onclick="deletePlaceAdmin('${escAttr(p._id)}')">حذف</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── 3. Admin Verification Requests ──
async function renderAdminVerification($container, user) {
  const reqsMap = await dbGet('verificationRequests') || {};
  const reqs = Object.values(reqsMap).sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">طلبات التوثيق (${reqs.length})</h1>
        <div class="dashboard-header__subtitle">مراجعة واعتماد طلبات توثيق الأنشطة التجارية</div>
      </div>
    </div>

    <div class="dashboard-table-wrapper">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>اسم المكان</th>
            <th>مقدم الطلب</th>
            <th>تاريخ الطلب</th>
            <th>الحالة</th>
            <th>الإجراء</th>
          </tr>
        </thead>
        <tbody>
          ${reqs.length === 0 ? '<tr><td colspan="5" class="text-center">لا توجد طلبات توثيق</td></tr>' : reqs.map(r => `
            <tr>
              <td><strong>${escHtml(r.placeName)}</strong></td>
              <td>${escHtml(r.ownerName || r.ownerEmail)}</td>
              <td>${formatDate(r.requestedAt)}</td>
              <td>
                <span class="badge ${r.status === 'approved' ? 'badge--published' : (r.status === 'rejected' ? 'badge--rejected' : 'badge--pending')}">
                  ${r.status === 'approved' ? 'معتمد ✓' : (r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة')}
                </span>
              </td>
              <td>
                ${r.status === 'pending' ? `
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-xs btn-success" onclick="approveVerification('${escAttr(r.id)}', '${escAttr(r.placeId)}')">
                      ✓ اعتماد
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="rejectVerification('${escAttr(r.id)}', '${escAttr(r.placeId)}')">
                      ✕ رفض
                    </button>
                  </div>
                ` : 'مكتمل'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── 4. Admin Categories ──
async function renderAdminCategories($container) {
  const [categories, catReqsMap] = await Promise.all([
    getCategories(),
    dbGet('categoryRequests') || {}
  ]);

  const catRequests = Object.values(catReqsMap).filter(r => r.status === 'pending');

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة وتدقيق التصنيفات (${categories.length})</h1>
        <div class="dashboard-header__subtitle">إضافة وتعديل وحذف تصنيفات الدليل واعتماد المقترحات الجديدة</div>
      </div>
      <button class="btn btn-primary" id="btn-add-category">
        <span>➕</span> إضافة تصنيف جديد
      </button>
    </div>

    <!-- Pending Category Requests -->
    ${catRequests.length > 0 ? `
      <div class="form-section animate-fade-in" style="margin-bottom:var(--space-6);border:1.5px solid var(--secondary)">
        <h2 class="form-section__title" style="color:var(--secondary)">
          <span>🔔</span> طلبات التصنيفات الجديدة المقترحة من أصحاب الأنشطة (${catRequests.length})
        </h2>
        <div class="dashboard-table-wrapper">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>التصنيف المقترح</th>
                <th>اسم المكان التابع له</th>
                <th>صاحب الحساب</th>
                <th>إجراءات الإدارة</th>
              </tr>
            </thead>
            <tbody>
              ${catRequests.map(req => `
                <tr>
                  <td><strong style="font-size:1.1rem;color:var(--primary)">✨ ${escHtml(req.categoryName)}</strong></td>
                  <td>${escHtml(req.placeName || 'غير محدد')}</td>
                  <td>${escHtml(req.ownerName || 'مستخدم')}</td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-xs btn-success" onclick="approveCategoryRequest('${escAttr(req.id)}', '${escAttr(req.categoryName)}')">
                        ✓ اعتماد وتفعيل
                      </button>
                      <button class="btn btn-xs btn-outline" onclick="editAndApproveCategoryRequest('${escAttr(req.id)}', '${escAttr(req.categoryName)}')">
                        ✏️ تعديل واعتماد
                      </button>
                      <button class="btn btn-xs btn-danger" onclick="rejectCategoryRequest('${escAttr(req.id)}')">
                        ✕ رفض
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <div class="dashboard-table-wrapper">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>الأيقونة</th>
            <th>اسم التصنيف</th>
            <th>الاسم بالإنجليزية / Slug</th>
            <th>عدد الأماكن</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map(c => `
            <tr>
              <td style="font-size:1.5rem">${c.icon || '📁'}</td>
              <td><strong>${escHtml(c.name)}</strong></td>
              <td>${escHtml(c.slug || c.nameEn || '')}</td>
              <td>${c.placeCount || 0}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-xs btn-outline" onclick="editCategoryAdmin('${escAttr(c._key || c.slug)}', '${escAttr(c.name)}', '${escAttr(c.icon || '📁')}')">تعديل</button>
                  <button class="btn btn-xs btn-danger" onclick="deleteCategoryAdmin('${escAttr(c._key || c.slug)}')">حذف</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-add-category')?.addEventListener('click', () => {
    showAddCategoryModal(() => renderAdminCategories($container));
  });
}

function showAddCategoryModal(onDone) {
  const modal = showModal({
    title: 'إضافة تصنيف جديد',
    content: `
      <form id="add-cat-form">
        <div class="form-group">
          <label class="form-label">اسم التصنيف بالعربية <span class="required">*</span></label>
          <input type="text" id="cat-name-ar" class="form-input" required placeholder="مثال: ورشة نجارة، ستوديو تصوير" />
        </div>
        <div class="form-group">
          <label class="form-label">الاسم بالإنجليزية (Slug) <span class="required">*</span></label>
          <input type="text" id="cat-name-en" class="form-input" required placeholder="carpentry" style="direction:ltr" />
        </div>
        <div class="form-group">
          <label class="form-label">الأيقونة (Emoji أو Icon) <span class="required">*</span></label>
          <input type="text" id="cat-icon" class="form-input" required placeholder="🪑" />
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'حفظ التصنيف',
        type: 'primary',
        onClick: async () => {
          const name = document.getElementById('cat-name-ar')?.value.trim();
          const slug = document.getElementById('cat-name-en')?.value.trim().toLowerCase();
          const icon = document.getElementById('cat-icon')?.value.trim() || '📁';

          if (!name || !slug) {
            toast.warning('يرجى ملء الاسم والـ Slug');
            return;
          }

          try {
            await dbSet(`categories/${slug}`, {
              id: slug,
              slug,
              name,
              nameEn: slug,
              icon,
              order: Date.now(),
              isActive: true,
              placeCount: 0,
              createdAt: serverTimestamp()
            });
            toast.success('تمت إضافة التصنيف');
            modal.close();
            onDone();
          } catch (err) {
            toast.error(err.message || 'فشل حفظ التصنيف');
          }
        },
        closeOnClick: false
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}

// ── 5. Admin Users ──
async function renderAdminUsers($container, currentUser) {
  const usersMap = await dbGet('users') || {};
  const users = Object.values(usersMap);

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة المستخدمين (${users.length})</h1>
        <div class="dashboard-header__subtitle">التحكم في صلاحيات المستخدمين وحالة الحسابات</div>
      </div>
    </div>

    <div class="dashboard-table-wrapper">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>المستخدم</th>
            <th>البريد الإلكتروني</th>
            <th>الصلاحية</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <img src="${u.photoURL || './icons/icon-72x72.png'}" style="width:32px;height:32px;border-radius:50%" />
                  <strong>${escHtml(u.name || 'مستخدم')}</strong>
                </div>
              </td>
              <td>${escHtml(u.email || '')}</td>
              <td>
                <span class="chip ${u.role === 'admin' || u.role === 'superadmin' ? 'chip--warning' : 'chip--primary'}">
                  ${u.role || 'user'}
                </span>
              </td>
              <td>${u.status === 'suspended' ? '<span class="badge badge--suspended">موقوف</span>' : '<span class="badge badge--published">نشط</span>'}</td>
              <td>
                <button class="btn btn-xs ${u.status === 'suspended' ? 'btn-success' : 'btn-danger'}" onclick="toggleUserStatus('${escAttr(u.uid)}', '${u.status === 'suspended' ? 'active' : 'suspended'}')">
                  ${u.status === 'suspended' ? 'تفعيل' : 'إيقاف'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── 6. Admin Offers ──
async function renderAdminOffers($container) {
  const offersMap = await dbGet('offers') || {};
  const offers = Object.entries(offersMap).map(([id, o]) => ({ ...o, _id: id }));

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة العروض (${offers.length})</h1>
      </div>
    </div>

    <div class="dashboard-table-wrapper">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>العرض</th>
            <th>المكان</th>
            <th>السعر</th>
            <th>الحالة</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          ${offers.length === 0 ? '<tr><td colspan="5" class="text-center">لا توجد عروض</td></tr>' : offers.map(o => `
            <tr>
              <td><strong>${escHtml(o.title)}</strong></td>
              <td>${escHtml(o.placeName || '')}</td>
              <td>${o.newPrice} ج.م</td>
              <td>${o.status || 'active'}</td>
              <td>
                <button class="btn btn-xs btn-danger" onclick="deleteOfferAdmin('${escAttr(o._id)}')">حذف</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── 7. Admin Ads ──
async function renderAdminAds($container, user) {
  const adsMap = await dbGet('ads') || {};
  const ads = Object.entries(adsMap).map(([id, a]) => ({ ...a, _id: id }));

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إدارة الإعلانات (${ads.length})</h1>
        <div class="dashboard-header__subtitle">إضافة وتفعيل البانرات الإعلانية في الموقع</div>
      </div>
      <button class="btn btn-primary" id="btn-add-ad">
        <span>➕</span> إضافة إعلان جديد
      </button>
    </div>

    <div class="dashboard-table-wrapper">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>البانر</th>
            <th>العنوان</th>
            <th>الموضع</th>
            <th>النقرات</th>
            <th>الحالة</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          ${ads.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد إعلانات</td></tr>' : ads.map(a => `
            <tr>
              <td>
                ${a.imageUrl ? `<img src="${escAttr(a.imageUrl)}" style="height:36px;border-radius:4px" />` : 'نص'}
              </td>
              <td><strong>${escHtml(a.title || '')}</strong></td>
              <td>${escHtml(a.placement || 'homepage')}</td>
              <td>${a.clicks || 0}</td>
              <td>${a.isActive ? '<span class="badge badge--published">نشط</span>' : '<span class="badge badge--suspended">متوقف</span>'}</td>
              <td>
                <button class="btn btn-xs btn-danger" onclick="deleteAdAdmin('${escAttr(a._id)}')">حذف</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-add-ad')?.addEventListener('click', () => {
    showAddAdModal(user, () => renderAdminAds($container, user));
  });
}

function showAddAdModal(user, onDone) {
  const modal = showModal({
    title: 'إضافة إعلان جديد',
    content: `
      <form id="add-ad-form">
        <div class="form-group">
          <label class="form-label">عنوان الإعلان <span class="required">*</span></label>
          <input type="text" id="ad-title" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label">رابط التوجيه (URL)</label>
          <input type="url" id="ad-link" class="form-input" placeholder="https://..." style="direction:ltr" />
        </div>
        <div class="form-group">
          <label class="form-label">رابط صورة الإعلان (URL)</label>
          <input type="url" id="ad-img" class="form-input" style="direction:ltr" />
        </div>
        <div class="form-group">
          <label class="form-label">مكان الظهور</label>
          <select id="ad-placement" class="form-select">
            <option value="homepage">الصفحة الرئيسية</option>
            <option value="sidebar">الشريط الجانبي</option>
            <option value="category">صفحات التصنيفات</option>
            <option value="all">جميع الصفحات</option>
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'حفظ الإعلان',
        type: 'primary',
        onClick: async () => {
          const title = document.getElementById('ad-title')?.value.trim();
          const link = document.getElementById('ad-link')?.value.trim();
          const imageUrl = document.getElementById('ad-img')?.value.trim();
          const placement = document.getElementById('ad-placement')?.value;

          if (!title) { toast.warning('اكتب عنوان الإعلان'); return; }

          try {
            await dbPush('ads', {
              title,
              link,
              imageUrl,
              placement,
              priority: 1,
              isActive: true,
              startDate: Date.now(),
              endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
              clicks: 0,
              createdAt: serverTimestamp(),
              createdBy: user.uid
            });
            toast.success('تمت إضافة الإعلان');
            modal.close();
            onDone();
          } catch (e) {
            toast.error('فشل حفظ الإعلان');
          }
        },
        closeOnClick: false
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}

// ── 8. Admin Settings ──
async function renderAdminSettings($container) {
  const settings = await getSettings() || {};

  $container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">إعدادات المنصة الشاملة</h1>
        <div class="dashboard-header__subtitle">تحكم كامل في نصوص وروابط وحدود المنصة دون الحاجة لتعديل الكود</div>
      </div>
    </div>

    <form id="admin-settings-form">
      <!-- General & Branding -->
      <div class="form-section">
        <h2 class="form-section__title"><span>🎨</span> الهوية العامة</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">اسم الموقع</label>
            <input type="text" id="s-site-name" class="form-input" value="${escAttr(settings.general?.siteName || 'المنزلة وناسها')}" />
          </div>
          <div class="form-group">
            <label class="form-label">اللون الرئيسي (Primary Color Hex)</label>
            <input type="color" id="s-color" class="form-input" style="height:48px;padding:4px" value="${escAttr(settings.general?.primaryColor || '#1B4F72')}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">وصف الموقع (Tagline)</label>
          <input type="text" id="s-desc" class="form-input" value="${escAttr(settings.general?.siteDescription || 'دليل المنزلة الرقمي')}" />
        </div>
      </div>

      <!-- WhatsApp & Contact -->
      <div class="form-section">
        <h2 class="form-section__title"><span>💬</span> واتساب والتواصل مع الإدارة</h2>
        <div class="form-group">
          <label class="form-label">رابط واتساب الإدارة لطلب التوثيق <span class="required">*</span></label>
          <input type="url" id="s-wa-link" class="form-input" style="direction:ltr;text-align:left" value="${escAttr(settings.contact?.whatsappLink || 'https://wa.me/wasendernew')}" />
          <div class="form-hint">هذا الرابط يُفتح عند ضغط صاحب المكان على "طلب التوثيق عبر WhatsApp"</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">بريد الدعم الفني</label>
            <input type="email" id="s-email" class="form-input" style="direction:ltr;text-align:left" value="${escAttr(settings.contact?.email || 'info@elmanzala.com')}" />
          </div>
          <div class="form-group">
            <label class="form-label">رابط فيسبوك المنصة</label>
            <input type="url" id="s-fb" class="form-input" style="direction:ltr;text-align:left" value="${escAttr(settings.social?.facebook || '')}" />
          </div>
        </div>
      </div>

      <!-- Limits -->
      <div class="form-section">
        <h2 class="form-section__title"><span>⚙️</span> حدود العروض والمنتجات</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">عروض المكان الموثق (يومياً)</label>
            <input type="number" id="s-lim-off-ver" class="form-input" value="${settings.limits?.offersVerified || 3}" />
          </div>
          <div class="form-group">
            <label class="form-label">عروض المكان غير الموثق (يومياً)</label>
            <input type="number" id="s-lim-off-unver" class="form-input" value="${settings.limits?.offersUnverified || 1}" />
          </div>
          <div class="form-group">
            <label class="form-label">الحد الأقصى للمنتجات للموثق</label>
            <input type="number" id="s-lim-prod-ver" class="form-input" value="${settings.limits?.productsVerified || 350}" />
          </div>
        </div>
      </div>

      <div style="padding-bottom:var(--space-8)">
        <button type="submit" class="btn btn-primary btn-lg" id="btn-save-settings">
          <span>💾</span> حفظ جميع الإعدادات
        </button>
      </div>
    </form>
  `;

  document.getElementById('admin-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-settings');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const updates = {
        'general/siteName': document.getElementById('s-site-name').value,
        'general/primaryColor': document.getElementById('s-color').value,
        'general/siteDescription': document.getElementById('s-desc').value,
        'contact/whatsappLink': document.getElementById('s-wa-link').value,
        'contact/email': document.getElementById('s-email').value,
        'social/facebook': document.getElementById('s-fb').value,
        'limits/offersVerified': Number(document.getElementById('s-lim-off-ver').value) || 3,
        'limits/offersUnverified': Number(document.getElementById('s-lim-off-unver').value) || 1,
        'limits/productsVerified': Number(document.getElementById('s-lim-prod-ver').value) || 350,
      };

      await dbUpdate('settings', updates);
      toast.success('تم حفظ إعدادات المنصة بنجاح!');
    } catch (err) {
      toast.error('فشل حفظ الإعدادات');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

// ── Admin Global Action Helpers ──
window.togglePlaceVerification = async (placeId, status) => {
  try {
    await dbUpdate(`places/${placeId}`, {
      isVerified: status,
      verificationStatus: status ? 'verified' : 'unverified',
      verifiedAt: status ? serverTimestamp() : null
    });
    toast.success(status ? 'تم توثيق المكان ومنحه العلامة الذهبية ✓' : 'تم إلغاء التوثيق');
    navigate('/admin/places');
  } catch {
    toast.error('فشلت العملية');
  }
};

window.deletePlaceAdmin = async (placeId) => {
  const ok = await showConfirm({
    title: 'حذف المكان نهائياً',
    message: 'هل أنت متأكد من حذف هذا المكان من المنصة؟',
    confirmType: 'danger'
  });
  if (ok) {
    try {
      const place = await dbGet(`places/${placeId}`);
      if (place?.slug) await dbRemove(`slugIndex/${place.slug}`);
      await dbRemove(`places/${placeId}`);
      toast.success('تم حذف المكان');
      navigate('/admin/places');
    } catch {
      toast.error('فشل الحذف');
    }
  }
};

window.approveVerification = async (reqId, placeId) => {
  try {
    await dbUpdate(`verificationRequests/${reqId}`, {
      status: 'approved',
      reviewedAt: serverTimestamp()
    });
    await dbUpdate(`places/${placeId}`, {
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: serverTimestamp()
    });
    toast.success('تم قبول طلب التوثيق وتفعيل علامة التوثيق ✓');
    navigate('/admin/verification');
  } catch {
    toast.error('فشلت العملية');
  }
};

window.rejectVerification = async (reqId, placeId) => {
  try {
    await dbUpdate(`verificationRequests/${reqId}`, {
      status: 'rejected',
      reviewedAt: serverTimestamp()
    });
    await dbUpdate(`places/${placeId}`, {
      verificationStatus: 'unverified'
    });
    toast.info('تم رفض طلب التوثيق');
    navigate('/admin/verification');
  } catch {
    toast.error('فشلت العملية');
  }
};

window.deleteCategoryAdmin = async (catId) => {
  const ok = await showConfirm({ title: 'حذف التصنيف', message: 'هل أنت متأكد من حذف هذا التصنيف؟' });
  if (ok) {
    await dbRemove(`categories/${catId}`);
    toast.success('تم حذف التصنيف');
    window.location.href = 'admin.html?section=categories';
  }
};

window.editCategoryAdmin = async (catId, currentName, currentIcon) => {
  const modal = showModal({
    title: 'تعديل التصنيف',
    content: `
      <form id="edit-cat-form">
        <div class="form-group">
          <label class="form-label">اسم التصنيف بالعربية</label>
          <input type="text" id="edit-cat-name" class="form-input" value="${escAttr(currentName)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">الأيقونة (Emoji)</label>
          <input type="text" id="edit-cat-icon" class="form-input" value="${escAttr(currentIcon)}" required />
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'حفظ التعديلات',
        type: 'primary',
        onClick: async () => {
          const name = document.getElementById('edit-cat-name')?.value.trim();
          const icon = document.getElementById('edit-cat-icon')?.value.trim() || '📁';
          if (!name) return;
          try {
            await dbUpdate(`categories/${catId}`, { name, icon });
            toast.success('تم تحديث التصنيف بنجاح');
            modal.close();
            window.location.href = 'admin.html?section=categories';
          } catch {
            toast.error('فشل التحديث');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.approveCategoryRequest = async (reqId, categoryName) => {
  try {
    const slug = 'cat_' + Date.now().toString(36);
    await dbSet(`categories/${slug}`, {
      id: slug,
      slug,
      name: categoryName,
      nameEn: slug,
      icon: '✨',
      order: Date.now(),
      isActive: true,
      placeCount: 1,
      createdAt: serverTimestamp()
    });

    await dbUpdate(`categoryRequests/${reqId}`, {
      status: 'approved',
      approvedAt: serverTimestamp()
    });

    toast.success(`تم اعتماد تصنيف "${categoryName}" وإضافته في الدليل بنجاح!`);
    window.location.href = 'admin.html?section=categories';
  } catch (err) {
    toast.error('فشل الاعتماد');
  }
};

window.editAndApproveCategoryRequest = async (reqId, initialName) => {
  const modal = showModal({
    title: 'تعديل وتفعيل التصنيف المقترح',
    content: `
      <form id="approve-cat-form">
        <div class="form-group">
          <label class="form-label">اسم التصنيف النهائي</label>
          <input type="text" id="appr-cat-name" class="form-input" value="${escAttr(initialName)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">اختر أيقونة مناسبة</label>
          <input type="text" id="appr-cat-icon" class="form-input" value="✨" required />
        </div>
      </form>
    `,
    buttons: [
      {
        label: 'اعتماد وإضافة للدليل',
        type: 'primary',
        onClick: async () => {
          const name = document.getElementById('appr-cat-name')?.value.trim();
          const icon = document.getElementById('appr-cat-icon')?.value.trim() || '📁';
          if (!name) return;

          try {
            const slug = 'cat_' + Date.now().toString(36);
            await dbSet(`categories/${slug}`, {
              id: slug,
              slug,
              name,
              nameEn: slug,
              icon,
              order: Date.now(),
              isActive: true,
              placeCount: 1,
              createdAt: serverTimestamp()
            });

            await dbUpdate(`categoryRequests/${reqId}`, {
              status: 'approved',
              finalName: name,
              approvedAt: serverTimestamp()
            });

            toast.success(`تم اعتماد تصنيف "${name}" بنجاح!`);
            modal.close();
            window.location.href = 'admin.html?section=categories';
          } catch {
            toast.error('فشلت العملية');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
};

window.rejectCategoryRequest = async (reqId) => {
  const ok = await showConfirm({ title: 'رفض التصنيف', message: 'هل أنت متأكد من رفض هذا التصنيف المقترح؟' });
  if (ok) {
    try {
      await dbUpdate(`categoryRequests/${reqId}`, {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      toast.info('تم رفض التصنيف المقترح');
      window.location.href = 'admin.html?section=categories';
    } catch {
      toast.error('فشلت العملية');
    }
  }
};

window.toggleUserStatus = async (uid, newStatus) => {
  await dbUpdate(`users/${uid}`, { status: newStatus });
  toast.success('تم تحديث حالة المستخدم');
  navigate('/admin/users');
};

window.deleteOfferAdmin = async (offerId) => {
  await dbRemove(`offers/${offerId}`);
  toast.success('تم حذف العرض');
  navigate('/admin/offers');
};

window.deleteAdAdmin = async (adId) => {
  await dbRemove(`ads/${adId}`);
  toast.success('تم حذف الإعلان');
  navigate('/admin/ads');
};

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
