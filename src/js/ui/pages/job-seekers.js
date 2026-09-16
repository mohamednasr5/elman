/**
 * job-seekers.js — صفحة الباحثين عن عمل في المنزلة والمطرية
 * الدليل الرقمي للمنزلة والمطرية — ربط مباشر بالكفاءات والكوادر المحلية
 */

import { api } from '../../core/api.js';
import { getCurrentUser, getIdToken, isAdmin, signInWithGoogle, waitForAuth } from '../../core/auth.js';
import { showToast } from '../components/Toast.js';

let currentFilter = {
  q: '',
  profession: 'all',
  gender: 'all',
  location: 'all',
  status: 'active',
  onlyMine: false
};

let cachedSeekers = [];
let currentUser = null;

export async function renderJobSeekersPage($container) {
  currentUser = await waitForAuth();

  // Read URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const paramLocation = urlParams.get('location');
  if (paramLocation) currentFilter.location = paramLocation;
  const paramId = urlParams.get('id');

  $container.innerHTML = `
    <div class="jb-container">
      <!-- Hero Section -->
      <section class="jb-hero">
        <div class="jb-hero-content">
          <div class="jb-kicker">
            <span>💼 سوق العمل المحلي — المنزلة والمطرية</span>
          </div>
          <h1 class="jb-title">دليل الباحثين عن عمل والكوادر المحلية</h1>
          <p class="jb-subtitle">
            منصة تواصل مباشرة وموثوقة تجمع أصحاب المهن، الخريجين، والفنيين الباحثين عن فرص عمل في مدينتي المنزلة والمطرية وضواحيهما مع أصحاب المحلات والشركات.
          </p>
          <div class="jb-hero-actions">
            <button type="button" class="jb-btn-primary" id="btn-open-seeker-modal">
              <span>➕ أضف بياناتك كباحث عن عمل</span>
            </button>
            <a href="/jobs.html" class="jb-btn-secondary">
              <span>🔍 استعرض الوظائف المتاحة</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Filter Panel -->
      <div class="jb-filter-panel">
        <div class="jb-filter-search-row">
          <div class="jb-search-box">
            <span class="jb-search-icon">🔍</span>
            <input type="text" id="seeker-search-input" placeholder="ابحث بالاسم، المهنة، المهارة أو التخصص..." value="${escapeHtml(currentFilter.q)}"/>
          </div>
          <button type="button" class="jb-btn-primary" id="btn-filter-search" style="padding:0 20px;height:46px;font-size:14px">
            <span>بحث</span>
          </button>
        </div>

        <div class="jb-filter-grid">
          <select id="seeker-profession-filter" class="jb-select">
            <option value="all">كل التخصصات والمهن</option>
            <option value="محاسبة وإدارة">محاسبة وإدارة ومكتبات</option>
            <option value="مبيعات وكاشير">مبيعات، كاشير وتجارة</option>
            <option value="هندسة وتكنولوجيا">هندسة، صيانة وتكنولوجيا</option>
            <option value="طب وصيدلة وتمريض">طب، صيدلة وتمريض</option>
            <option value="تعليم وتدريس">تعليم وتدريس وحضانات</option>
            <option value="حرف وصنايعية">حرف يدوية، صيانة وتشطيبات</option>
            <option value="سائقين وتوصيل">سائقين، دليفري ونقل</option>
            <option value="مطاعم وكافيهات">مطاعم، باريستا وشيفات</option>
            <option value="خياطة وتطريز">خياطة، تفصيل وتطريز</option>
            <option value="أخرى">مهن أخرى متنوعة</option>
          </select>

          <select id="seeker-location-filter" class="jb-select">
            <option value="all">كل المناطق</option>
            <option value="المنزلة">المنزلة</option>
            <option value="المطرية">المطرية</option>
            <option value="العزيزة">العزيزة</option>
            <option value="البصراط">البصراط</option>
            <option value="الفروسات">الفروسات</option>
            <option value="ميت مرجا">ميت مرجا</option>
            <option value="الجمالية">الجمالية وضواحيها</option>
            <option value="أخرى">قرى وضواحي أخرى</option>
          </select>

          <select id="seeker-gender-filter" class="jb-select">
            <option value="all">النوع (الكل)</option>
            <option value="male">ذكور فقط</option>
            <option value="female">إناث فقط</option>
          </select>

          <select id="seeker-status-filter" class="jb-select">
            <option value="active">يبحث عن عمل حالياً</option>
            <option value="all">الكل (بما في ذلك من وجدوا عملاً)</option>
            <option value="employed">وجدوا عملاً بالفعل 🎉</option>
          </select>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:4px">
          <label style="display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--text-secondary,#334155);cursor:pointer">
            <input type="checkbox" id="seeker-mine-checkbox" style="width:17px;height:17px;accent-color:#0284c7">
            <span>عرض طلباتي وسيرتي فقط</span>
          </label>
          <button type="button" id="btn-reset-filters" style="background:none;border:none;color:#64748b;font-size:13px;font-weight:700;cursor:pointer;text-decoration:underline">
            إعادة تعيين الفلاتر
          </button>
        </div>
      </div>

      <!-- Results Meta Info -->
      <div class="jb-results-meta">
        <div>
          <span>النتائج المعروضة: </span>
          <span class="jb-count-badge" id="seeker-count-badge">0 كادر</span>
        </div>
        <div style="font-size:13px">
          <span>يتم تحديث القائمة دورياً والتحقق من أرقام الهواتف</span>
        </div>
      </div>

      <!-- Cards Grid -->
      <div class="jb-grid" id="seeker-grid">
        <div style="grid-column:1/-1;text-align:center;padding:48px 16px">
          <div class="spinner spinner-lg"></div>
          <p style="color:var(--text-muted);font-size:14px;margin-top:12px">جاري تحميل الباحثين عن عمل...</p>
        </div>
      </div>

      <!-- Modal Slot for Add/Edit/Details -->
      <div id="seeker-modal-slot"></div>
    </div>
  `;

  // Attach Filter Listeners
  const $searchInput = document.getElementById('seeker-search-input');
  const $btnSearch = document.getElementById('btn-filter-search');
  const $profFilter = document.getElementById('seeker-profession-filter');
  const $locFilter = document.getElementById('seeker-location-filter');
  const $genderFilter = document.getElementById('seeker-gender-filter');
  const $statusFilter = document.getElementById('seeker-status-filter');
  const $mineCheckbox = document.getElementById('seeker-mine-checkbox');
  const $btnReset = document.getElementById('btn-reset-filters');
  const $btnOpenAdd = document.getElementById('btn-open-seeker-modal');

  if (paramLocation && $locFilter) $locFilter.value = paramLocation;

  let debounceTimer = null;
  $searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentFilter.q = $searchInput.value.trim();
      loadSeekers();
    }, 350);
  });

  $btnSearch?.addEventListener('click', () => {
    currentFilter.q = $searchInput.value.trim();
    loadSeekers();
  });

  $profFilter?.addEventListener('change', () => {
    currentFilter.profession = $profFilter.value;
    loadSeekers();
  });

  $locFilter?.addEventListener('change', () => {
    currentFilter.location = $locFilter.value;
    loadSeekers();
  });

  $genderFilter?.addEventListener('change', () => {
    currentFilter.gender = $genderFilter.value;
    loadSeekers();
  });

  $statusFilter?.addEventListener('change', () => {
    currentFilter.status = $statusFilter.value;
    loadSeekers();
  });

  $mineCheckbox?.addEventListener('change', () => {
    currentFilter.onlyMine = $mineCheckbox.checked;
    loadSeekers();
  });

  $btnReset?.addEventListener('click', () => {
    currentFilter = { q: '', profession: 'all', gender: 'all', location: 'all', status: 'active', onlyMine: false };
    if ($searchInput) $searchInput.value = '';
    if ($profFilter) $profFilter.value = 'all';
    if ($locFilter) $locFilter.value = 'all';
    if ($genderFilter) $genderFilter.value = 'all';
    if ($statusFilter) $statusFilter.value = 'active';
    if ($mineCheckbox) $mineCheckbox.checked = false;
    loadSeekers();
  });

  $btnOpenAdd?.addEventListener('click', () => {
    openAddSeekerModal();
  });

  // Initial Load
  await loadSeekers();

  // If URL has ?id=..., open details
  if (paramId) {
    const target = cachedSeekers.find(s => String(s.id) === String(paramId));
    if (target) {
      openSeekerDetailsModal(target);
    } else {
      fetchSeekerDetailsAndOpen(paramId);
    }
  }
}

async function loadSeekers() {
  const $grid = document.getElementById('seeker-grid');
  const $countBadge = document.getElementById('seeker-count-badge');
  if (!$grid) return;

  $grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:48px 16px">
      <div class="spinner spinner-lg"></div>
      <p style="color:var(--text-muted);font-size:14px;margin-top:12px">جاري جلب البيانات...</p>
    </div>
  `;

  try {
    const queryParams = new URLSearchParams();
    if (currentFilter.q) queryParams.set('q', currentFilter.q);
    if (currentFilter.profession !== 'all') queryParams.set('profession', currentFilter.profession);
    if (currentFilter.gender !== 'all') queryParams.set('gender', currentFilter.gender);
    if (currentFilter.location !== 'all') queryParams.set('location', currentFilter.location);
    if (currentFilter.status !== 'all') queryParams.set('status', currentFilter.status);

    const res = await api.get(`/api/job-seekers?${queryParams.toString()}`);
    let list = res.data || [];

    if (currentFilter.onlyMine) {
      const uid = currentUser?.uid;
      list = list.filter(item => item.owner_uid === uid);
    }

    cachedSeekers = list;
    if ($countBadge) $countBadge.textContent = `${list.length} كادر`;

    if (list.length === 0) {
      $grid.innerHTML = `
        <div class="jb-empty-state">
          <div class="jb-empty-icon">📂</div>
          <h3 class="jb-empty-title">لا توجد نتائج مطابقة حالياً</h3>
          <p class="jb-empty-desc">
            لم نجد باحثين عن عمل بالخيارات المحددة. جرب تغيير كلمات البحث أو إعادة تعيين الفلاتر، أو أضف سيرتك الذاتية لتكون أول من يتواصل معه أصحاب العمل!
          </p>
          <button type="button" class="jb-btn-primary" id="btn-empty-add-seeker" style="margin-top:14px">
            <span>➕ أضف بياناتك الآن</span>
          </button>
        </div>
      `;
      document.getElementById('btn-empty-add-seeker')?.addEventListener('click', openAddSeekerModal);
      return;
    }

    $grid.innerHTML = list.map(item => renderSeekerCardHTML(item)).join('');
    attachSeekerCardEvents($grid);
  } catch (err) {
    console.error('[JobSeekers] Failed to load:', err);
    $grid.innerHTML = `
      <div class="jb-empty-state">
        <div class="jb-empty-icon">⚠️</div>
        <h3 class="jb-empty-title">تعذر تحميل البيانات</h3>
        <p class="jb-empty-desc">حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.</p>
        <button type="button" class="jb-btn-primary" id="btn-retry-seekers" style="margin-top:12px">إعادة المحاولة</button>
      </div>
    `;
    document.getElementById('btn-retry-seekers')?.addEventListener('click', loadSeekers);
  }
}

function renderSeekerCardHTML(item) {
  const isOwner = currentUser && (currentUser.uid === item.owner_uid || isAdmin(currentUser));
  const isEmployed = item.status === 'employed';
  const genderLabel = item.gender === 'female' ? 'أنثى' : 'ذكر';
  const ageStr = item.age ? `${item.age} سنة` : '';
  const expStr = item.experience_years ? `خبرة ${item.experience_years} سنوات` : 'مبتدئ / خبرة حديثة';
  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '';

  return `
    <div class="jb-card ${isEmployed ? 'jb-card--inactive' : ''}" data-id="${item.id}">
      <div class="jb-card-head">
        <div class="jb-card-title-wrap">
          <h2 class="jb-card-name">${escapeHtml(item.name)}</h2>
          <span class="jb-badge-profession">💼 ${escapeHtml(item.profession)}</span>
        </div>
        <span class="jb-card-status-pill ${isEmployed ? 'jb-status--employed' : 'jb-status--active'}">
          ${isEmployed ? '🎉 تم التوظيف' : '⚡ متاح للعمل'}
        </span>
      </div>

      <div class="jb-card-meta-list">
        <span class="jb-card-meta-item">📍 ${escapeHtml(item.location || 'المنزلة')}</span>
        <span class="jb-card-meta-item">👤 ${genderLabel}${ageStr ? ` (${ageStr})` : ''}</span>
        <span class="jb-card-meta-item">⏳ ${expStr}</span>
        ${dateStr ? `<span class="jb-card-meta-item" style="color:var(--text-muted);font-size:12px">📅 ${dateStr}</span>` : ''}
      </div>

      <p class="jb-card-desc-snippet">
        ${escapeHtml(item.bio || 'لم يتم إضافة تفاصيل إضافية.')}
      </p>

      <div class="jb-card-footer">
        <button type="button" class="jb-btn-contact-wa btn-contact-seeker" data-id="${item.id}">
          <span>💬 تواصل واتساب</span>
        </button>
        <button type="button" class="jb-btn-view-details btn-view-seeker" data-id="${item.id}">
          <span>التفاصيل ↤</span>
        </button>
      </div>

      ${isOwner ? `
        <div class="jb-owner-banner" style="margin-top:10px">
          <span>👑 تحكم صاحب الإعلان:</span>
          <div class="jb-owner-actions">
            <button type="button" class="jb-owner-btn ${isEmployed ? '' : 'jb-owner-btn--success'} btn-toggle-employed" data-id="${item.id}" data-status="${item.status}">
              ${isEmployed ? 'إعادة التفعيل' : 'وجدت عمل بالفعل 🎉'}
            </button>
            <button type="button" class="jb-owner-btn btn-edit-seeker" data-id="${item.id}">
              تعديل
            </button>
            <button type="button" class="jb-owner-btn jb-owner-btn--danger btn-delete-seeker" data-id="${item.id}">
              حذف
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function attachSeekerCardEvents($container) {
  // Contact WhatsApp Click
  $container.querySelectorAll('.btn-contact-seeker').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await handleContactSeeker(id);
    });
  });

  // View Details Click
  $container.querySelectorAll('.btn-view-seeker').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const item = cachedSeekers.find(s => String(s.id) === String(id));
      if (item) openSeekerDetailsModal(item);
    });
  });

  // Card click defaults to view details
  $container.querySelectorAll('.jb-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const id = card.getAttribute('data-id');
      const item = cachedSeekers.find(s => String(s.id) === String(id));
      if (item) openSeekerDetailsModal(item);
    });
  });

  // Toggle Employed Status
  $container.querySelectorAll('.btn-toggle-employed').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const cur = btn.getAttribute('data-status');
      const nextStatus = cur === 'employed' ? 'active' : 'employed';
      await updateSeekerStatus(id, nextStatus);
    });
  });

  // Edit Seeker
  $container.querySelectorAll('.btn-edit-seeker').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const item = cachedSeekers.find(s => String(s.id) === String(id));
      if (item) openEditSeekerModal(item);
    });
  });

  // Delete Seeker
  $container.querySelectorAll('.btn-delete-seeker').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (!confirm('هل أنت متأكد من حذف هذه السيرة الذاتية؟')) return;
      await deleteSeeker(id);
    });
  });
}

async function handleContactSeeker(id) {
  try {
    showToast('جاري فتح محادثة الواتساب...', 'info', 2000);
    const res = await api.get(`/api/job-seekers/${id}/contact`);
    if (res?.data?.whatsapp_url) {
      window.open(res.data.whatsapp_url, '_blank', 'noopener,noreferrer');
    } else if (res?.data?.phone) {
      const waUrl = `https://wa.me/2${res.data.phone}?text=${encodeURIComponent('السلام عليكم، رأيت سيرتك الذاتية على دليل المنزلة والمطرية وأود الاستفسار عن تفاصيل العمل.')}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('تعذر جلب رابط التواصل.', 'error');
    }
  } catch (err) {
    console.error('[Contact Seeker Error]:', err);
    showToast(err.message || 'تعذر فتح واتساب', 'error');
  }
}

async function updateSeekerStatus(id, newStatus) {
  try {
    const token = await getIdToken();
    if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

    await api.post(`/api/job-seekers/${id}/status`, { status: newStatus }, token);
    showToast(newStatus === 'employed' ? 'مبارك! تم تحديث الحالة إلى تم التوظيف 🎉' : 'تم إعادة التفعيل بنجاح ✨', 'success');
    await loadSeekers();
  } catch (err) {
    showToast(err.message || 'فشل تحديث الحالة', 'error');
  }
}

async function deleteSeeker(id) {
  try {
    const token = await getIdToken();
    if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

    await api.delete(`/api/job-seekers/${id}`, token);
    showToast('تم حذف السيرة الذاتية بنجاح', 'success');
    await loadSeekers();
  } catch (err) {
    showToast(err.message || 'فشل حذف السيرة الذاتية', 'error');
  }
}

// ── Modals: Add / Edit / Details ──

function openAddSeekerModal() {
  if (!currentUser) {
    if (confirm('يتطلب إضافة سيرة ذاتية تسجيل الدخول عبر حساب جوجل لحماية بياناتك وتمكينك من تعديلها أو حذفها لاحقاً. هل تريد تسجيل الدخول الآن؟')) {
      signInWithGoogle().then(u => {
        if (u) {
          currentUser = u;
          openAddSeekerModal();
        }
      }).catch(err => showToast(err.message, 'error'));
    }
    return;
  }

  const $slot = document.getElementById('seeker-modal-slot');
  if (!$slot) return;

  $slot.innerHTML = `
    <div class="jb-modal-backdrop" id="add-seeker-modal-backdrop">
      <div class="jb-modal-dialog">
        <div class="jb-modal-header">
          <h3 class="jb-modal-title">➕ إضافة سيرة ذاتية وباحث عن عمل</h3>
          <button type="button" class="jb-modal-close" id="btn-close-seeker-modal">✕</button>
        </div>

        <form id="form-add-seeker" class="jb-modal-body">
          <div class="jb-form-group">
            <label class="jb-label">الاسم بالكامل <span style="color:#ef4444">*</span></label>
            <input type="text" name="name" class="jb-input" required placeholder="مثال: أحمد محمد علي" value="${escapeHtml(currentUser.displayName || '')}"/>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">المهنة أو التخصص المطلوب <span style="color:#ef4444">*</span></label>
            <input type="text" name="profession" class="jb-input" required placeholder="مثال: محاسب، كاشير، فني تكييف، ممرض، شيف..."/>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">النوع <span style="color:#ef4444">*</span></label>
              <select name="gender" class="jb-select" style="width:100%" required>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">العمر (سنة)</label>
              <input type="number" name="age" class="jb-input" min="16" max="75" placeholder="مثال: 24"/>
            </div>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">رقم الهاتف / واتساب المصري <span style="color:#ef4444">*</span></label>
            <input type="tel" name="phone" class="jb-input" required placeholder="01xxxxxxxxx" pattern="^01[0125][0-9]{8}$" title="رقم محمول مصري مكون من 11 رقم يبدأ بـ 01"/>
            <small style="color:var(--text-muted);font-size:12px;margin-top:4px;display:block">
              🔒 رقم هاتفك محمي ومشفر في العرض العام ولا يظهر إلا لمن يرغب في مراسلتك للعمل عبر الواتساب.
            </small>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">المدينة / القرية <span style="color:#ef4444">*</span></label>
              <select name="location" class="jb-select" style="width:100%" required>
                <option value="المنزلة">المنزلة</option>
                <option value="المطرية">المطرية</option>
                <option value="العزيزة">العزيزة</option>
                <option value="البصراط">البصراط</option>
                <option value="الفروسات">الفروسات</option>
                <option value="ميت مرجا">ميت مرجا</option>
                <option value="الجمالية">الجمالية وضواحيها</option>
                <option value="أخرى">قرى وضواحي أخرى</option>
              </select>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">سنوات الخبرة</label>
              <input type="number" name="experience_years" class="jb-input" min="0" max="40" value="0"/>
            </div>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">نبذة عن خبراتك، مهاراتك والوظائف المناسبة لك <span style="color:#ef4444">*</span></label>
            <textarea name="bio" class="jb-textarea" rows="4" required placeholder="اكتب نبذة واضحة وموجزة: دراستك، الدورات، الأماكن التي عملت بها سابقاً، مواعيد العمل المناسبة لك، إلخ..."></textarea>
          </div>

          <div class="jb-modal-footer">
            <button type="button" class="jb-btn-cancel" id="btn-cancel-add-seeker">إلغاء</button>
            <button type="submit" class="jb-btn-submit" id="btn-submit-add-seeker">
              <span>نشر السيرة الذاتية</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const $backdrop = document.getElementById('add-seeker-modal-backdrop');
  const close = () => { $slot.innerHTML = ''; };
  document.getElementById('btn-close-seeker-modal')?.addEventListener('click', close);
  document.getElementById('btn-cancel-add-seeker')?.addEventListener('click', close);
  $backdrop?.addEventListener('click', (e) => { if (e.target === $backdrop) close(); });

  const $form = document.getElementById('form-add-seeker');
  $form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-add-seeker');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري الحفظ والتوثيق...</span>';
    }

    try {
      const fd = new FormData($form);
      const payload = {
        name: fd.get('name').trim(),
        profession: fd.get('profession').trim(),
        gender: fd.get('gender'),
        age: fd.get('age') ? parseInt(fd.get('age'), 10) : null,
        phone: fd.get('phone').trim(),
        location: fd.get('location'),
        experience_years: parseInt(fd.get('experience_years') || '0', 10),
        bio: fd.get('bio').trim(),
      };

      // Egyptian phone validation
      if (!/^01[0125][0-9]{8}$/.test(payload.phone)) {
        throw new Error('يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)');
      }

      const token = await getIdToken();
      if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

      await api.post('/api/job-seekers', payload, token);
      showToast('تمت إضافة سيرتك الذاتية بنجاح وستظهر فوراً للجميع 🎉', 'success');
      close();
      await loadSeekers();
    } catch (err) {
      console.error('[Add Seeker Error]:', err);
      showToast(err.message || 'فشل حفظ البيانات', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>نشر السيرة الذاتية</span>';
      }
    }
  });
}

function openEditSeekerModal(item) {
  const $slot = document.getElementById('seeker-modal-slot');
  if (!$slot) return;

  $slot.innerHTML = `
    <div class="jb-modal-backdrop" id="edit-seeker-modal-backdrop">
      <div class="jb-modal-dialog">
        <div class="jb-modal-header">
          <h3 class="jb-modal-title">✏️ تعديل السيرة الذاتية</h3>
          <button type="button" class="jb-modal-close" id="btn-close-edit-modal">✕</button>
        </div>

        <form id="form-edit-seeker" class="jb-modal-body">
          <div class="jb-form-group">
            <label class="jb-label">الاسم بالكامل <span style="color:#ef4444">*</span></label>
            <input type="text" name="name" class="jb-input" required value="${escapeHtml(item.name || '')}"/>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">المهنة أو التخصص المطلوب <span style="color:#ef4444">*</span></label>
            <input type="text" name="profession" class="jb-input" required value="${escapeHtml(item.profession || '')}"/>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">النوع <span style="color:#ef4444">*</span></label>
              <select name="gender" class="jb-select" style="width:100%" required>
                <option value="male" ${item.gender === 'male' ? 'selected' : ''}>ذكر</option>
                <option value="female" ${item.gender === 'female' ? 'selected' : ''}>أنثى</option>
              </select>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">العمر (سنة)</label>
              <input type="number" name="age" class="jb-input" min="16" max="75" value="${item.age || ''}"/>
            </div>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">رقم الهاتف / واتساب (اختياري - اتركه فارغاً للإبقاء على الرقم الحالي)</label>
            <input type="tel" name="phone" class="jb-input" placeholder="01xxxxxxxxx (اتركه فارغاً لعدم التغيير)"/>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">المدينة / القرية <span style="color:#ef4444">*</span></label>
              <select name="location" class="jb-select" style="width:100%" required>
                ${['المنزلة', 'المطرية', 'العزيزة', 'البصراط', 'الفروسات', 'ميت مرجا', 'الجمالية', 'أخرى'].map(loc => `
                  <option value="${loc}" ${item.location === loc ? 'selected' : ''}>${loc}</option>
                `).join('')}
              </select>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">سنوات الخبرة</label>
              <input type="number" name="experience_years" class="jb-input" min="0" max="40" value="${item.experience_years || 0}"/>
            </div>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">الحالة الحالية</label>
            <select name="status" class="jb-select" style="width:100%">
              <option value="active" ${item.status === 'active' ? 'selected' : ''}>يبحث عن عمل حالياً</option>
              <option value="employed" ${item.status === 'employed' ? 'selected' : ''}>تم التوظيف بنجاح 🎉</option>
            </select>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">نبذة عن خبراتك ومهاراتك <span style="color:#ef4444">*</span></label>
            <textarea name="bio" class="jb-textarea" rows="4" required>${escapeHtml(item.bio || '')}</textarea>
          </div>

          <div class="jb-modal-footer">
            <button type="button" class="jb-btn-cancel" id="btn-cancel-edit-modal">إلغاء</button>
            <button type="submit" class="jb-btn-submit" id="btn-submit-edit-seeker">
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const $backdrop = document.getElementById('edit-seeker-modal-backdrop');
  const close = () => { $slot.innerHTML = ''; };
  document.getElementById('btn-close-edit-modal')?.addEventListener('click', close);
  document.getElementById('btn-cancel-edit-modal')?.addEventListener('click', close);
  $backdrop?.addEventListener('click', (e) => { if (e.target === $backdrop) close(); });

  const $form = document.getElementById('form-edit-seeker');
  $form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-edit-seeker');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري الحفظ...</span>';
    }

    try {
      const fd = new FormData($form);
      const payload = {
        name: fd.get('name').trim(),
        profession: fd.get('profession').trim(),
        gender: fd.get('gender'),
        age: fd.get('age') ? parseInt(fd.get('age'), 10) : null,
        location: fd.get('location'),
        experience_years: parseInt(fd.get('experience_years') || '0', 10),
        status: fd.get('status'),
        bio: fd.get('bio').trim(),
      };

      const phoneVal = fd.get('phone').trim();
      if (phoneVal) {
        if (!/^01[0125][0-9]{8}$/.test(phoneVal)) {
          throw new Error('يرجى إدخال رقم هاتف مصري صحيح (11 رقم)');
        }
        payload.phone = phoneVal;
      }

      const token = await getIdToken();
      if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

      await api.put(`/api/job-seekers/${item.id}`, payload, token);
      showToast('تم تحديث السيرة الذاتية بنجاح ✨', 'success');
      close();
      await loadSeekers();
    } catch (err) {
      console.error('[Edit Seeker Error]:', err);
      showToast(err.message || 'فشل التعديل', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>حفظ التعديلات</span>';
      }
    }
  });
}

function openSeekerDetailsModal(item) {
  const $slot = document.getElementById('seeker-modal-slot');
  if (!$slot) return;

  const isEmployed = item.status === 'employed';
  const genderLabel = item.gender === 'female' ? 'أنثى' : 'ذكر';
  const ageStr = item.age ? `${item.age} سنة` : 'غير محدد';
  const expStr = item.experience_years ? `${item.experience_years} سنوات خبرة` : 'مبتدئ / حديث التخرج';
  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  $slot.innerHTML = `
    <div class="jb-modal-backdrop" id="details-seeker-modal-backdrop">
      <div class="jb-modal-dialog">
        <div class="jb-modal-header">
          <div style="display:flex;align-items:center;gap:8px">
            <h3 class="jb-modal-title">${escapeHtml(item.name)}</h3>
            <span class="jb-badge-profession" style="font-size:12px">${escapeHtml(item.profession)}</span>
          </div>
          <button type="button" class="jb-modal-close" id="btn-close-details-modal">✕</button>
        </div>

        <div class="jb-modal-body" style="gap:16px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="jb-card-status-pill ${isEmployed ? 'jb-status--employed' : 'jb-status--active'}">
              ${isEmployed ? '🎉 تم التوظيف' : '⚡ يبحث عن فرصة عمل'}
            </span>
            <span style="font-size:13px;color:var(--text-muted)">📅 تاريخ الإضافة: ${dateStr}</span>
          </div>

          <div style="background:var(--surface-2,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13.5px">
            <div><strong style="color:var(--text-primary)">📍 المكان:</strong> ${escapeHtml(item.location || 'المنزلة')}</div>
            <div><strong style="color:var(--text-primary)">👤 النوع:</strong> ${genderLabel}</div>
            <div><strong style="color:var(--text-primary)">🎂 العمر:</strong> ${ageStr}</div>
            <div><strong style="color:var(--text-primary)">⏳ الخبرة:</strong> ${expStr}</div>
          </div>

          <div>
            <h4 style="margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text-primary)">النبذة والمهارات والخبرات:</h4>
            <div style="font-size:14.5px;line-height:1.75;color:var(--text-secondary);background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:14px;white-space:pre-wrap">
              ${escapeHtml(item.bio || 'لا توجد تفاصيل إضافية.')}
            </div>
          </div>

          <div style="background:rgba(2,132,199,0.06);border:1px solid rgba(2,132,199,0.2);border-radius:12px;padding:12px;font-size:13px;color:#0369a1;display:flex;align-items:center;gap:8px">
            <span>🛡️</span>
            <span>رقم الهاتف محمي ومتاح للتواصل المباشر مع صاحب الطلب عبر واتساب.</span>
          </div>
        </div>

        <div class="jb-modal-footer" style="justify-content:space-between">
          <button type="button" class="jb-btn-cancel" id="btn-share-seeker">
            <span>🔗 مشاركة</span>
          </button>
          <button type="button" class="jb-btn-contact-wa" id="btn-details-wa-contact" style="padding:10px 22px;font-size:14px">
            <span>💬 تواصل الآن عبر واتساب</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const $backdrop = document.getElementById('details-seeker-modal-backdrop');
  const close = () => { $slot.innerHTML = ''; };
  document.getElementById('btn-close-details-modal')?.addEventListener('click', close);
  $backdrop?.addEventListener('click', (e) => { if (e.target === $backdrop) close(); });

  document.getElementById('btn-details-wa-contact')?.addEventListener('click', async () => {
    await handleContactSeeker(item.id);
  });

  document.getElementById('btn-share-seeker')?.addEventListener('click', async () => {
    const shareUrl = `${window.location.origin}/job-seekers.html?id=${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.name} — باحث عن عمل (${item.profession})`,
          text: `شاهد السيرة الذاتية لـ ${item.name} (${item.profession}) على دليل المنزلة والمطرية:`,
          url: shareUrl
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('تم نسخ رابط السيرة الذاتية بنجاح 📋', 'success');
    }
  });
}

async function fetchSeekerDetailsAndOpen(id) {
  try {
    const res = await api.get(`/api/job-seekers/${id}`);
    if (res?.data) {
      openSeekerDetailsModal(res.data);
    }
  } catch (err) {
    console.warn('[Seeker fetch by id failed]:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
