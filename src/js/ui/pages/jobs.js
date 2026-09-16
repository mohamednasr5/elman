/**
 * jobs.js — صفحة الوظائف المتاحة في المنزلة والمطرية
 * الدليل الرقمي للمنزلة والمطرية — فرص عمل حقيقية ومباشرة بدون وسطاء
 */

import { api } from '../../core/api.js';
import { getCurrentUser, getIdToken, isAdmin, signInWithGoogle, waitForAuth } from '../../core/auth.js';
import { showToast } from '../components/Toast.js';

let currentFilter = {
  q: '',
  profession: 'all',
  location: 'all',
  salaryType: 'all',
  status: 'active',
  onlyMine: false
};

let cachedJobs = [];
let currentUser = null;

export async function renderJobsPage($container) {
  currentUser = await waitForAuth();

  // Read URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const paramLocation = urlParams.get('location');
  const paramWorkplace = urlParams.get('workplace');
  const paramId = urlParams.get('id');

  if (paramLocation) currentFilter.location = paramLocation;
  if (paramWorkplace) currentFilter.q = paramWorkplace;

  $container.innerHTML = `
    <div class="jb-container">
      <!-- Hero Section -->
      <section class="jb-hero">
        <div class="jb-hero-content">
          <div class="jb-kicker">
            <span>📢 وظائف وفرص عمل في المنزلة والمطرية</span>
          </div>
          <h1 class="jb-title">لوحة الوظائف الشاغرة وفرص العمل المحلية</h1>
          <p class="jb-subtitle">
            استكشف أحدث فرص العمل المتاحة في المحلات، الشركات، العيادات، والمصانع داخل مدينتي المنزلة والمطرية. تواصل مباشرة مع صاحب العمل بدون وسطاء أو عمولات.
          </p>
          <div class="jb-hero-actions">
            <button type="button" class="jb-btn-primary" id="btn-open-job-modal">
              <span>➕ أضف إعلان وظيفة شاغرة</span>
            </button>
            <a href="/job-seekers.html" class="jb-btn-secondary">
              <span>👥 تصفح الباحثين عن عمل والكوادر</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Filter Panel -->
      <div class="jb-filter-panel">
        <div class="jb-filter-search-row">
          <div class="jb-search-box">
            <span class="jb-search-icon">🔍</span>
            <input type="text" id="job-search-input" placeholder="ابحث بعنوان الوظيفة، اسم المحل أو الشركة، أو المهنة..." value="${escapeHtml(currentFilter.q)}"/>
          </div>
          <button type="button" class="jb-btn-primary" id="btn-filter-job-search" style="padding:0 20px;height:46px;font-size:14px">
            <span>بحث</span>
          </button>
        </div>

        <div class="jb-filter-grid">
          <select id="job-profession-filter" class="jb-select">
            <option value="all">كل المهن والأنشطة</option>
            <option value="مبيعات وكاشير">مبيعات، كاشير وتجارة</option>
            <option value="محاسبة وإدارة">محاسبة وإدارة وسكرتارية</option>
            <option value="صنايعية وفنيين">فنيين، صيانة وتشطيبات</option>
            <option value="سائقين وتوصيل">سائقين، دليفري ونقل</option>
            <option value="مطاعم وكافيهات">مطاعم، شيفات وويتر</option>
            <option value="صيادلة وتمريض">صيادلة، تمريض وعيادات</option>
            <option value="تعليم وحضانات">تدريس، معلمات وحضانات</option>
            <option value="خياطة ومصانع">خياطة، تفصيل ومصانع</option>
            <option value="عمال وخدمات">عمال، نظافة وأمن</option>
            <option value="أخرى">أنشطة أخرى</option>
          </select>

          <select id="job-location-filter" class="jb-select">
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

          <select id="job-salary-filter" class="jb-select">
            <option value="all">نوع الراتب (الكل)</option>
            <option value="specified">راتب محدد بالجنيه</option>
            <option value="negotiable">يحدد في المقابلة</option>
          </select>

          <select id="job-status-filter" class="jb-select">
            <option value="active">الوظائف الشاغرة حالياً</option>
            <option value="all">كل الوظائف (بما فيها المكتملة)</option>
            <option value="filled">تم شغلها بالفعل 🎉</option>
          </select>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:4px">
          <label style="display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--text-secondary,#334155);cursor:pointer">
            <input type="checkbox" id="job-mine-checkbox" style="width:17px;height:17px;accent-color:#0284c7">
            <span>عرض إعلاناتي فقط</span>
          </label>
          <button type="button" id="btn-reset-job-filters" style="background:none;border:none;color:#64748b;font-size:13px;font-weight:700;cursor:pointer;text-decoration:underline">
            إعادة تعيين الفلاتر
          </button>
        </div>
      </div>

      <!-- Results Meta Info -->
      <div class="jb-results-meta">
        <div>
          <span>الوظائف الشاغرة: </span>
          <span class="jb-count-badge" id="job-count-badge">0 وظيفة</span>
        </div>
        <div style="font-size:13px">
          <span>فرص عمل موثقة ومحدثة يومياً في المنزلة والمطرية</span>
        </div>
      </div>

      <!-- Cards Grid -->
      <div class="jb-grid" id="jobs-grid">
        <div style="grid-column:1/-1;text-align:center;padding:48px 16px">
          <div class="spinner spinner-lg"></div>
          <p style="color:var(--text-muted);font-size:14px;margin-top:12px">جاري تحميل الوظائف المتاحة...</p>
        </div>
      </div>

      <!-- Modal Slot for Add/Edit/Details -->
      <div id="job-modal-slot"></div>
    </div>
  `;

  // Filter Event Listeners
  const $searchInput = document.getElementById('job-search-input');
  const $btnSearch = document.getElementById('btn-filter-job-search');
  const $profFilter = document.getElementById('job-profession-filter');
  const $locFilter = document.getElementById('job-location-filter');
  const $salaryFilter = document.getElementById('job-salary-filter');
  const $statusFilter = document.getElementById('job-status-filter');
  const $mineCheckbox = document.getElementById('job-mine-checkbox');
  const $btnReset = document.getElementById('btn-reset-job-filters');
  const $btnOpenAdd = document.getElementById('btn-open-job-modal');

  if (paramLocation && $locFilter) $locFilter.value = paramLocation;

  let debounceTimer = null;
  $searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentFilter.q = $searchInput.value.trim();
      loadJobs();
    }, 350);
  });

  $btnSearch?.addEventListener('click', () => {
    currentFilter.q = $searchInput.value.trim();
    loadJobs();
  });

  $profFilter?.addEventListener('change', () => {
    currentFilter.profession = $profFilter.value;
    loadJobs();
  });

  $locFilter?.addEventListener('change', () => {
    currentFilter.location = $locFilter.value;
    loadJobs();
  });

  $salaryFilter?.addEventListener('change', () => {
    currentFilter.salaryType = $salaryFilter.value;
    loadJobs();
  });

  $statusFilter?.addEventListener('change', () => {
    currentFilter.status = $statusFilter.value;
    loadJobs();
  });

  $mineCheckbox?.addEventListener('change', () => {
    currentFilter.onlyMine = $mineCheckbox.checked;
    loadJobs();
  });

  $btnReset?.addEventListener('click', () => {
    currentFilter = { q: '', profession: 'all', location: 'all', salaryType: 'all', status: 'active', onlyMine: false };
    if ($searchInput) $searchInput.value = '';
    if ($profFilter) $profFilter.value = 'all';
    if ($locFilter) $locFilter.value = 'all';
    if ($salaryFilter) $salaryFilter.value = 'all';
    if ($statusFilter) $statusFilter.value = 'active';
    if ($mineCheckbox) $mineCheckbox.checked = false;
    loadJobs();
  });

  $btnOpenAdd?.addEventListener('click', () => {
    openAddJobModal();
  });

  // Initial Load
  await loadJobs();

  // If URL has ?id=..., open details
  if (paramId) {
    const target = cachedJobs.find(j => String(j.id) === String(paramId));
    if (target) {
      openJobDetailsModal(target);
    } else {
      fetchJobDetailsAndOpen(paramId);
    }
  }
}

async function loadJobs() {
  const $grid = document.getElementById('jobs-grid');
  const $countBadge = document.getElementById('job-count-badge');
  if (!$grid) return;

  $grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:48px 16px">
      <div class="spinner spinner-lg"></div>
      <p style="color:var(--text-muted);font-size:14px;margin-top:12px">جاري جلب الوظائف...</p>
    </div>
  `;

  try {
    const queryParams = new URLSearchParams();
    if (currentFilter.q) queryParams.set('q', currentFilter.q);
    if (currentFilter.profession !== 'all') queryParams.set('profession', currentFilter.profession);
    if (currentFilter.location !== 'all') queryParams.set('location', currentFilter.location);
    if (currentFilter.salaryType !== 'all') queryParams.set('salary_type', currentFilter.salaryType);
    if (currentFilter.status !== 'all') queryParams.set('status', currentFilter.status);

    const res = await api.get(`/api/jobs?${queryParams.toString()}`);
    let list = res.data || [];

    if (currentFilter.onlyMine) {
      const uid = currentUser?.uid;
      list = list.filter(item => item.owner_uid === uid);
    }

    cachedJobs = list;
    if ($countBadge) $countBadge.textContent = `${list.length} وظيفة`;

    // Inject JobPosting JSON-LD schemas for top active jobs
    updateJobPostingJsonLd(list.filter(j => j.status === 'active').slice(0, 10));

    if (list.length === 0) {
      $grid.innerHTML = `
        <div class="jb-empty-state">
          <div class="jb-empty-icon">💼</div>
          <h3 class="jb-empty-title">لا توجد وظائف مطابقة حالياً</h3>
          <p class="jb-empty-desc">
            لم نعثر على وظائف تطابق خيارات البحث الحالية. جرب تغيير كلمات البحث أو أضف إعلان وظيفتك الشاغرة لتصل إلى آلاف الباحثين عن عمل في المنزلة والمطرية.
          </p>
          <button type="button" class="jb-btn-primary" id="btn-empty-add-job" style="margin-top:14px">
            <span>➕ أضف إعلان وظيفة شاغرة</span>
          </button>
        </div>
      `;
      document.getElementById('btn-empty-add-job')?.addEventListener('click', openAddJobModal);
      return;
    }

    $grid.innerHTML = list.map(item => renderJobCardHTML(item)).join('');
    attachJobCardEvents($grid);
  } catch (err) {
    console.error('[Jobs] Failed to load:', err);
    $grid.innerHTML = `
      <div class="jb-empty-state">
        <div class="jb-empty-icon">⚠️</div>
        <h3 class="jb-empty-title">تعذر تحميل بيانات الوظائف</h3>
        <p class="jb-empty-desc">حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.</p>
        <button type="button" class="jb-btn-primary" id="btn-retry-jobs" style="margin-top:12px">إعادة المحاولة</button>
      </div>
    `;
    document.getElementById('btn-retry-jobs')?.addEventListener('click', loadJobs);
  }
}

function renderJobCardHTML(item) {
  const isOwner = currentUser && (currentUser.uid === item.owner_uid || isAdmin(currentUser));
  const isFilled = item.status === 'filled';
  const isFeatured = Boolean(item.isFeatured);
  const salaryDisplay = item.salary_type === 'specified' && item.salary
    ? `${Number(item.salary).toLocaleString('ar-EG')} ج.م`
    : 'الراتب يحدد في المقابلة';
  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '';

  return `
    <div class="jb-card ${isFilled ? 'jb-card--inactive' : ''} ${isFeatured ? 'jb-card--featured' : ''}" data-id="${item.id}" style="${isFeatured ? 'border:2px solid #F5A623;box-shadow:0 6px 22px rgba(245,166,35,0.22);' : ''}">
      <div class="jb-card-head">
        <div class="jb-card-title-wrap">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <h2 class="jb-card-name">${escapeHtml(item.title)}</h2>
            ${isFeatured ? '<span class="jb-badge-featured" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:3px">⭐ إعلان مميز</span>' : ''}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:3px">
            <span class="jb-badge-profession">💼 ${escapeHtml(item.profession)}</span>
            <span style="font-size:12px;font-weight:700;color:var(--text-secondary);background:var(--surface-2,#f8fafc);padding:2px 8px;border-radius:6px;border:1px solid var(--border,#e2e8f0)">
              🏢 ${escapeHtml(item.workplace)}
            </span>
          </div>
        </div>
        <span class="jb-card-status-pill ${isFilled ? 'jb-status--filled' : 'jb-status--active'}">
          ${isFilled ? '🎉 تم شغل الوظيفة' : '⚡ متاحة للتقديم'}
        </span>
      </div>

      <div class="jb-card-meta-list">
        <span class="jb-card-meta-item">📍 ${escapeHtml(item.location || 'المنزلة')}</span>
        <span class="jb-card-meta-item">💵 <strong>${salaryDisplay}</strong></span>
        ${item.working_hours ? `<span class="jb-card-meta-item">⏰ ${escapeHtml(item.working_hours)}</span>` : ''}
        ${dateStr ? `<span class="jb-card-meta-item" style="color:var(--text-muted);font-size:12px">📅 ${dateStr}</span>` : ''}
      </div>

      <p class="jb-card-desc-snippet">
        ${escapeHtml(item.description || 'لم يتم إضافة تفاصيل إضافية.')}
      </p>

      <div class="jb-card-footer">
        <button type="button" class="jb-btn-contact-wa btn-contact-job" data-id="${item.id}">
          <span>💬 تقديم عبر واتساب</span>
        </button>
        <button type="button" class="jb-btn-view-details btn-view-job" data-id="${item.id}">
          <span>التفاصيل الكاملة ↤</span>
        </button>
      </div>

      ${isOwner ? `
        <div class="jb-owner-banner" style="margin-top:10px">
          <span>👑 تحكم صاحب الإعلان:</span>
          <div class="jb-owner-actions">
            ${!isFeatured ? `
              <button type="button" class="jb-owner-btn btn-promote-job" data-id="${item.id}" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;font-weight:900;border:none">
                ⭐ تمييز (500 🪙)
              </button>
            ` : `
              <span style="background:rgba(245,166,35,0.15);color:#D97706;border:1px solid #F5A623;font-size:11px;font-weight:900;padding:4px 8px;border-radius:6px">
                ⭐ مميز في الصدارة
              </span>
            `}
            <button type="button" class="jb-owner-btn ${isFilled ? '' : 'jb-owner-btn--success'} btn-toggle-job-filled" data-id="${item.id}" data-status="${item.status}">
              ${isFilled ? 'إعادة الإعلان' : 'تم العثور على شخص بالفعل 🎉'}
            </button>
            <button type="button" class="jb-owner-btn btn-edit-job" data-id="${item.id}">
              تعديل
            </button>
            <button type="button" class="jb-owner-btn jb-owner-btn--danger btn-delete-job" data-id="${item.id}">
              حذف
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function attachJobCardEvents($container) {
  // Contact WhatsApp Click
  $container.querySelectorAll('.btn-contact-job').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await handleContactJob(id);
    });
  });

  // View Details Click
  $container.querySelectorAll('.btn-view-job').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const item = cachedJobs.find(j => String(j.id) === String(id));
      if (item) openJobDetailsModal(item);
    });
  });

  // Card click
  $container.querySelectorAll('.jb-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const id = card.getAttribute('data-id');
      const item = cachedJobs.find(j => String(j.id) === String(id));
      if (item) openJobDetailsModal(item);
    });
  });

  // Toggle Filled Status
  $container.querySelectorAll('.btn-toggle-job-filled').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const cur = btn.getAttribute('data-status');
      const nextStatus = cur === 'filled' ? 'active' : 'filled';
      await updateJobStatus(id, nextStatus);
    });
  });

  // Edit Job
  $container.querySelectorAll('.btn-edit-job').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const item = cachedJobs.find(j => String(j.id) === String(id));
      if (item) openEditJobModal(item);
    });
  });

  // Delete Job
  $container.querySelectorAll('.btn-delete-job').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (!confirm('هل أنت متأكد من حذف هذا الإعلان الوظيفي؟')) return;
      await deleteJob(id);
    });
  });

  // Promote Job Click
  $container.querySelectorAll('.btn-promote-job').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (!confirm('هل ترغب في تمييز هذه الوظيفة بأولوية الظهور في صدارة الموقع والصفحات لمدة 3 أيام مقابل 500 ذهبية؟\n\nتأكيد: العملات غير قابلة للاسترداد نهائياً بعد التفعيل.')) return;
      try {
        const token = await getIdToken();
        if (!token) throw new Error('يرجى تسجيل الدخول أولاً');
        const res = await api.post('/api/coins/promote', { targetType: 'job', targetId: id }, token);
        if (res.success) {
          showToast('تم تمييز الإعلان بنجاح في صدارة الموقع لمدة 3 أيام! ⭐', 'success');
          await loadJobs();
        }
      } catch (err) {
        console.warn('[Promote Job Error]:', err);
        showModal({
          title: '🪙 رصيد العملات غير كافٍ',
          content: `
            <div style="text-align:center;padding:12px">
              <div style="font-size:40px;margin-bottom:8px">🪙</div>
              <h4 style="font-size:15px;font-weight:800;color:#D97706;margin-bottom:6px">يلزم 500 ذهبية لتمييز هذا الإعلان</h4>
              <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px">رصيدك الحالي غير كافٍ لإتمام التمييز. يمكنك شحن رصيدك فوراً عبر فودافون كاش.</p>
              <a href="/wallet.html" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#F5A623,#D97706);color:#fff">
                <span>🪙 شحن رصيد الذهبيات الآن</span>
              </a>
            </div>
          `,
          buttons: [{ label: 'إغلاق', type: 'ghost', closeOnClick: true }]
        });
      }
    });
  });
}

async function handleContactJob(id) {
  try {
    showToast('جاري فتح محادثة الواتساب مع جهة العمل...', 'info', 2000);
    const res = await api.get(`/api/jobs/${id}/contact`);
    if (res?.data?.whatsapp_url) {
      window.open(res.data.whatsapp_url, '_blank', 'noopener,noreferrer');
    } else if (res?.data?.phone) {
      const waUrl = `https://wa.me/2${res.data.phone}?text=${encodeURIComponent('السلام عليكم، بخصوص إعلان الوظيفة المعروضة على دليل المنزلة والمطرية، أود الاستفسار والتقديم.')}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('تعذر جلب رابط التواصل.', 'error');
    }
  } catch (err) {
    console.error('[Contact Job Error]:', err);
    showToast(err.message || 'تعذر فتح واتساب', 'error');
  }
}

async function updateJobStatus(id, newStatus) {
  try {
    const token = await getIdToken();
    if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

    await api.post(`/api/jobs/${id}/status`, { status: newStatus }, token);
    showToast(newStatus === 'filled' ? 'تم تحديث الإعلان إلى تم شغل الوظيفة 🎉' : 'تم إعادة تفعيل الإعلان بنجاح ✨', 'success');
    await loadJobs();
  } catch (err) {
    showToast(err.message || 'فشل تحديث الحالة', 'error');
  }
}

async function deleteJob(id) {
  try {
    const token = await getIdToken();
    if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

    await api.delete(`/api/jobs/${id}`, token);
    showToast('تم حذف الإعلان بنجاح', 'success');
    await loadJobs();
  } catch (err) {
    showToast(err.message || 'فشل حذف الإعلان', 'error');
  }
}

// ── Modals: Add / Edit / Details ──

function openAddJobModal() {
  if (!currentUser) {
    if (confirm('يتطلب إضافة إعلان وظيفة تسجيل الدخول لحماية بياناتك وتمكينك من إدارة الإعلان لاحقاً. هل تريد تسجيل الدخول عبر حساب جوجل الآن؟')) {
      signInWithGoogle().then(u => {
        if (u) {
          currentUser = u;
          openAddJobModal();
        }
      }).catch(err => showToast(err.message, 'error'));
    }
    return;
  }

  const $slot = document.getElementById('job-modal-slot');
  if (!$slot) return;

  $slot.innerHTML = `
    <div class="jb-modal-backdrop" id="add-job-modal-backdrop">
      <div class="jb-modal-dialog">
        <div class="jb-modal-header">
          <h3 class="jb-modal-title">➕ إضافة وظيفة شاغرة جديدة</h3>
          <button type="button" class="jb-modal-close" id="btn-close-job-modal">✕</button>
        </div>

        <form id="form-add-job" class="jb-modal-body">
          <div class="jb-form-group">
            <label class="jb-label">عنوان الوظيفة المطلوب <span style="color:#ef4444">*</span></label>
            <input type="text" name="title" class="jb-input" required placeholder="مثال: مطلوب كاشير لفترة مسائية، مطلوب آنسة مبيعات، معلم شاورما..."/>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">اسم المحل / الشركة / جهة العمل <span style="color:#ef4444">*</span></label>
              <input type="text" name="workplace" class="jb-input" required placeholder="مثال: سوبر ماركت الهدى، صيدلية السلام..."/>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">النشاط / التخصص <span style="color:#ef4444">*</span></label>
              <select name="profession" class="jb-select" style="width:100%" required>
                <option value="مبيعات وكاشير">مبيعات وكاشير</option>
                <option value="محاسبة وإدارة">محاسبة وإدارة</option>
                <option value="صنايعية وفنيين">صنايعية وفنيين</option>
                <option value="سائقين وتوصيل">سائقين وتوصيل</option>
                <option value="مطاعم وكافيهات">مطاعم وكافيهات</option>
                <option value="صيادلة وتمريض">صيادلة وتمريض</option>
                <option value="تعليم وحضانات">تعليم وحضانات</option>
                <option value="خياطة ومصانع">خياطة ومصانع</option>
                <option value="عمال وخدمات">عمال وخدمات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">المدينة / القرية / مكان العمل <span style="color:#ef4444">*</span></label>
              <input type="text" name="location" list="job-location-suggestions" class="jb-input" placeholder="اكتب المدينة أو القرية أو العنوان..." required autocomplete="off" />
              <datalist id="job-location-suggestions">
                <option value="المنزلة"></option>
                <option value="المطرية"></option>
                <option value="العزيزة"></option>
                <option value="البصراط"></option>
                <option value="الفروسات"></option>
                <option value="ميت مرجا"></option>
                <option value="الجمالية"></option>
                <option value="الروضة"></option>
                <option value="بني عبيد"></option>
                <option value="دكرنس"></option>
              </datalist>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">مواعيد وساعات العمل <span style="color:#ef4444">*</span></label>
              <input type="text" name="working_hours" class="jb-input" required placeholder="مثال: من 9 ص إلى 5 م / 8 ساعات يومياً"/>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">نظام الراتب</label>
              <select name="salary_type" id="add-job-salary-type" class="jb-select" style="width:100%">
                <option value="negotiable">يحدد في المقابلة</option>
                <option value="specified">محدد بمبلغ شهري</option>
              </select>
            </div>
            <div class="jb-form-group" id="add-job-salary-val-wrap" style="display:none">
              <label class="jb-label">قيمة الراتب (بالجنيه)</label>
              <input type="number" name="salary" class="jb-input" min="500" max="100000" placeholder="مثال: 4500"/>
            </div>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">رقم الهاتف / واتساب لتلقي طلبات التقديم <span style="color:#ef4444">*</span></label>
            <input type="tel" name="phone" class="jb-input" required placeholder="01xxxxxxxxx" pattern="^01[0125][0-9]{8}$" title="رقم محمول مصري مكون من 11 رقم يبدأ بـ 01"/>
            <small style="color:var(--text-muted);font-size:12px;margin-top:4px;display:block">
              🔒 رقم هاتفك محمي من البريد العشوائي ويتم استخدامه للتواصل المباشر مع المتقدمين للوظيفة.
            </small>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">تفاصيل الوظيفة وشروط التقديم <span style="color:#ef4444">*</span></label>
            <textarea name="description" class="jb-textarea" rows="4" required placeholder="اكتب شروط الوظيفة بوضوح: المؤهل، الخبرة المطلوبة، المهام، أيام الإجازة، عنوان المحل بالتفصيل..."></textarea>
          </div>

          <div class="jb-featured-box" style="background:linear-gradient(135deg,rgba(245,166,35,0.12),rgba(217,119,6,0.06));border:1.5px solid #F5A623;border-radius:12px;padding:12px 14px;margin:14px 0">
            <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
              <input type="checkbox" name="is_featured" id="add-job-is-featured" value="1" style="width:18px;height:18px;margin-top:2px;accent-color:#F5A623" />
              <div>
                <div style="font-weight:900;font-size:13.5px;color:#D97706;display:flex;align-items:center;gap:6px">
                  <span>⭐ تمييز الإعلان بأولوية الظهور</span>
                  <span style="background:#F5A623;color:#0B1E30;font-size:10.5px;padding:1px 6px;border-radius:999px;font-weight:900">500 ذهبية / 3 أيام</span>
                </div>
                <p style="font-size:11.5px;color:var(--text-muted);margin:4px 0 0 0;line-height:1.5">
                  يمنح وظيفتك صدارة العرض في بطاقات الأماكن والصفحة الرئيسية مع إطار ذهبي لافت للأنظار.
                </p>
              </div>
            </label>
          </div>

          <div class="jb-modal-footer">
            <button type="button" class="jb-btn-cancel" id="btn-cancel-add-job">إلغاء</button>
            <button type="submit" class="jb-btn-submit" id="btn-submit-add-job">
              <span>نشر الوظيفة الآن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const $backdrop = document.getElementById('add-job-modal-backdrop');
  const close = () => { $slot.innerHTML = ''; };
  document.getElementById('btn-close-job-modal')?.addEventListener('click', close);
  document.getElementById('btn-cancel-add-job')?.addEventListener('click', close);
  $backdrop?.addEventListener('click', (e) => { if (e.target === $backdrop) close(); });

  const $salaryTypeSelect = document.getElementById('add-job-salary-type');
  const $salaryValWrap = document.getElementById('add-job-salary-val-wrap');
  $salaryTypeSelect?.addEventListener('change', () => {
    if ($salaryValWrap) {
      $salaryValWrap.style.display = $salaryTypeSelect.value === 'specified' ? 'block' : 'none';
    }
  });

  const $form = document.getElementById('form-add-job');
  $form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-add-job');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري نشر الوظيفة...</span>';
    }

    try {
      const fd = new FormData($form);
      const salaryType = fd.get('salary_type');
      const salaryRaw = fd.get('salary');
      const wantsFeatured = fd.get('is_featured') === '1';

      const payload = {
        title: fd.get('title').trim(),
        profession: fd.get('profession').trim(),
        workplace: fd.get('workplace').trim(),
        location: fd.get('location'),
        working_hours: fd.get('working_hours').trim(),
        salary_type: salaryType,
        salary: salaryType === 'specified' && salaryRaw ? parseFloat(salaryRaw) : null,
        phone: fd.get('phone').trim(),
        description: fd.get('description').trim(),
      };

      // Egyptian phone validation
      if (!/^01[0125][0-9]{8}$/.test(payload.phone)) {
        throw new Error('يرجى إدخال رقم هاتف مصري صحيح (11 رقم)');
      }

      const token = await getIdToken();
      if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

      const jobRes = await api.post('/api/jobs', payload, token);
      const newJobId = jobRes.id || (jobRes.data && jobRes.data.id);

      if (wantsFeatured && newJobId) {
        try {
          const promoRes = await api.post('/api/coins/promote', { targetType: 'job', targetId: newJobId }, token);
          if (promoRes.success) {
            showToast('تم نشر وتمييز إعلان الوظيفة بنجاح في صدارة الموقع 👑⭐', 'success');
          }
        } catch (promoErr) {
          console.warn('[Auto promote job warning]:', promoErr);
          showModal({
            title: '⚠️ تنبيه بخصوص تمييز الإعلان',
            content: `
              <div style="text-align:center;padding:12px">
                <div style="font-size:40px;margin-bottom:8px">🪙</div>
                <h4 style="font-size:15px;font-weight:800;color:#D97706;margin-bottom:6px">تم نشر الوظيفة بنجاح، ولكن رصيدك غير كافٍ للتمييز!</h4>
                <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px">يلزم 500 ذهبية لتمييز الإعلان لمدة 3 أيام. يمكنك شحن رصيدك بسهولة عبر فودافون كاش.</p>
                <a href="/wallet.html" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#F5A623,#D97706);color:#fff">
                  <span>🪙 شحن رصيد الذهبيات الآن</span>
                </a>
              </div>
            `,
            buttons: [{ label: 'حسناً، فهمت', type: 'ghost', closeOnClick: true }]
          });
        }
      } else {
        showToast('تم نشر إعلان الوظيفة بنجاح 🎉', 'success');
      }

      close();
      await loadJobs();
    } catch (err) {
      console.error('[Add Job Error]:', err);
      showToast(err.message || 'فشل نشر الوظيفة', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>نشر الوظيفة الآن</span>';
      }
    }
  });
}

function openEditJobModal(item) {
  const $slot = document.getElementById('job-modal-slot');
  if (!$slot) return;

  $slot.innerHTML = `
    <div class="jb-modal-backdrop" id="edit-job-modal-backdrop">
      <div class="jb-modal-dialog">
        <div class="jb-modal-header">
          <h3 class="jb-modal-title">✏️ تعديل إعلان الوظيفة</h3>
          <button type="button" class="jb-modal-close" id="btn-close-edit-job-modal">✕</button>
        </div>

        <form id="form-edit-job" class="jb-modal-body">
          <div class="jb-form-group">
            <label class="jb-label">عنوان الوظيفة <span style="color:#ef4444">*</span></label>
            <input type="text" name="title" class="jb-input" required value="${escapeHtml(item.title || '')}"/>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">مكان العمل <span style="color:#ef4444">*</span></label>
              <input type="text" name="workplace" class="jb-input" required value="${escapeHtml(item.workplace || '')}"/>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">النشاط / التخصص <span style="color:#ef4444">*</span></label>
              <input type="text" name="profession" class="jb-input" required value="${escapeHtml(item.profession || '')}"/>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">المدينة / القرية / مكان العمل <span style="color:#ef4444">*</span></label>
              <input type="text" name="location" list="job-edit-location-suggestions" class="jb-input" value="${escapeHtml(item.location || '')}" placeholder="اكتب المدينة أو القرية أو العنوان..." required autocomplete="off" />
              <datalist id="job-edit-location-suggestions">
                <option value="المنزلة"></option>
                <option value="المطرية"></option>
                <option value="العزيزة"></option>
                <option value="البصراط"></option>
                <option value="الفروسات"></option>
                <option value="ميت مرجا"></option>
                <option value="الجمالية"></option>
                <option value="الروضة"></option>
                <option value="بني عبيد"></option>
                <option value="دكرنس"></option>
              </datalist>
            </div>
            <div class="jb-form-group">
              <label class="jb-label">مواعيد العمل <span style="color:#ef4444">*</span></label>
              <input type="text" name="working_hours" class="jb-input" required value="${escapeHtml(item.working_hours || '')}"/>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="jb-form-group">
              <label class="jb-label">نظام الراتب</label>
              <select name="salary_type" id="edit-job-salary-type" class="jb-select" style="width:100%">
                <option value="negotiable" ${item.salary_type === 'negotiable' ? 'selected' : ''}>يحدد في المقابلة</option>
                <option value="specified" ${item.salary_type === 'specified' ? 'selected' : ''}>محدد بمبلغ</option>
              </select>
            </div>
            <div class="jb-form-group" id="edit-job-salary-val-wrap" style="${item.salary_type === 'specified' ? 'display:block' : 'display:none'}">
              <label class="jb-label">قيمة الراتب (بالجنيه)</label>
              <input type="number" name="salary" class="jb-input" min="500" max="100000" value="${item.salary || ''}"/>
            </div>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">رقم الهاتف / واتساب (اختياري - اتركه فارغاً لعدم التغيير)</label>
            <input type="tel" name="phone" class="jb-input" placeholder="01xxxxxxxxx (اتركه فارغاً لعدم التغيير)"/>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">حالة الإعلان</label>
            <select name="status" class="jb-select" style="width:100%">
              <option value="active" ${item.status === 'active' ? 'selected' : ''}>متاحة للتقديم حالياً</option>
              <option value="filled" ${item.status === 'filled' ? 'selected' : ''}>تم شغل الوظيفة بنجاح 🎉</option>
            </select>
          </div>

          <div class="jb-form-group">
            <label class="jb-label">التفاصيل والشروط <span style="color:#ef4444">*</span></label>
            <textarea name="description" class="jb-textarea" rows="4" required>${escapeHtml(item.description || '')}</textarea>
          </div>

          <div class="jb-modal-footer">
            <button type="button" class="jb-btn-cancel" id="btn-cancel-edit-job">إلغاء</button>
            <button type="submit" class="jb-btn-submit" id="btn-submit-edit-job">
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const $backdrop = document.getElementById('edit-job-modal-backdrop');
  const close = () => { $slot.innerHTML = ''; };
  document.getElementById('btn-close-edit-job-modal')?.addEventListener('click', close);
  document.getElementById('btn-cancel-edit-job')?.addEventListener('click', close);
  $backdrop?.addEventListener('click', (e) => { if (e.target === $backdrop) close(); });

  const $salaryTypeSelect = document.getElementById('edit-job-salary-type');
  const $salaryValWrap = document.getElementById('edit-job-salary-val-wrap');
  $salaryTypeSelect?.addEventListener('change', () => {
    if ($salaryValWrap) {
      $salaryValWrap.style.display = $salaryTypeSelect.value === 'specified' ? 'block' : 'none';
    }
  });

  const $form = document.getElementById('form-edit-job');
  $form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-edit-job');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري الحفظ...</span>';
    }

    try {
      const fd = new FormData($form);
      const salaryType = fd.get('salary_type');
      const salaryRaw = fd.get('salary');

      const payload = {
        title: fd.get('title').trim(),
        workplace: fd.get('workplace').trim(),
        profession: fd.get('profession').trim(),
        location: fd.get('location'),
        working_hours: fd.get('working_hours').trim(),
        salary_type: salaryType,
        salary: salaryType === 'specified' && salaryRaw ? parseFloat(salaryRaw) : null,
        status: fd.get('status'),
        description: fd.get('description').trim(),
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

      await api.put(`/api/jobs/${item.id}`, payload, token);
      showToast('تم تعديل الإعلان الوظيفي بنجاح ✨', 'success');
      close();
      await loadJobs();
    } catch (err) {
      console.error('[Edit Job Error]:', err);
      showToast(err.message || 'فشل التعديل', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>حفظ التعديلات</span>';
      }
    }
  });
}

function openJobDetailsModal(item) {
  const $slot = document.getElementById('job-modal-slot');
  if (!$slot) return;

  const isFilled = item.status === 'filled';
  const salaryDisplay = item.salary_type === 'specified' && item.salary
    ? `${Number(item.salary).toLocaleString('ar-EG')} جنيه مصري شهرياً`
    : 'يحدد الراتب في المقابلة الشخصية حسب الخبرة';
  const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  $slot.innerHTML = `
    <div class="jb-modal-backdrop" id="details-job-modal-backdrop">
      <div class="jb-modal-dialog">
        <div class="jb-modal-header">
          <div>
            <h3 class="jb-modal-title">${escapeHtml(item.title)}</h3>
            <span style="font-size:13px;color:var(--text-muted)">🏢 جهة العمل: ${escapeHtml(item.workplace)}</span>
          </div>
          <button type="button" class="jb-modal-close" id="btn-close-job-details">✕</button>
        </div>

        <div class="jb-modal-body" style="gap:16px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="jb-card-status-pill ${isFilled ? 'jb-status--filled' : 'jb-status--active'}">
              ${isFilled ? '🎉 تم شغل الوظيفة' : '⚡ التقديم مفتوح الآن'}
            </span>
            <span class="jb-badge-profession" style="font-size:12px">💼 ${escapeHtml(item.profession)}</span>
            <span style="font-size:13px;color:var(--text-muted)">📅 تاريخ الإعلان: ${dateStr}</span>
          </div>

          <div style="background:var(--surface-2,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13.5px">
            <div><strong style="color:var(--text-primary)">📍 المكان:</strong> ${escapeHtml(item.location || 'المنزلة')}</div>
            <div><strong style="color:var(--text-primary)">⏰ المواعيد:</strong> ${escapeHtml(item.working_hours || 'غير محدد')}</div>
            <div style="grid-column:1/-1"><strong style="color:var(--text-primary)">💵 الراتب:</strong> ${salaryDisplay}</div>
          </div>

          <div>
            <h4 style="margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text-primary)">شروط الوظيفة وتفاصيلها:</h4>
            <div style="font-size:14.5px;line-height:1.75;color:var(--text-secondary);background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:14px;white-space:pre-wrap">
              ${escapeHtml(item.description || 'لا توجد تفاصيل إضافية.')}
            </div>
          </div>

          <div style="background:rgba(2,132,199,0.06);border:1px solid rgba(2,132,199,0.2);border-radius:12px;padding:12px;font-size:13px;color:#0369a1;display:flex;align-items:center;gap:8px">
            <span>🛡️</span>
            <span>تواصل مباشرة عبر واتساب مع صاحب العمل للتقديم وإرسال بياناتك.</span>
          </div>
        </div>

        <div class="jb-modal-footer" style="justify-content:space-between">
          <button type="button" class="jb-btn-cancel" id="btn-share-job">
            <span>🔗 مشاركة الوظيفة</span>
          </button>
          <button type="button" class="jb-btn-contact-wa" id="btn-details-job-wa" style="padding:10px 22px;font-size:14px">
            <span>💬 تقدم للوظيفة عبر واتساب</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const $backdrop = document.getElementById('details-job-modal-backdrop');
  const close = () => { $slot.innerHTML = ''; };
  document.getElementById('btn-close-job-details')?.addEventListener('click', close);
  $backdrop?.addEventListener('click', (e) => { if (e.target === $backdrop) close(); });

  document.getElementById('btn-details-job-wa')?.addEventListener('click', async () => {
    await handleContactJob(item.id);
  });

  document.getElementById('btn-share-job')?.addEventListener('click', async () => {
    const shareUrl = `${window.location.origin}/jobs.html?id=${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.title} — ${item.workplace}`,
          text: `فرصة عمل: مطلوب ${item.title} لدى ${item.workplace} في ${item.location || 'المنزلة والمطرية'}:`,
          url: shareUrl
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('تم نسخ رابط الوظيفة بنجاح 📋', 'success');
    }
  });
}

async function fetchJobDetailsAndOpen(id) {
  try {
    const res = await api.get(`/api/jobs/${id}`);
    if (res?.data) {
      openJobDetailsModal(res.data);
    }
  } catch (err) {
    console.warn('[Job fetch by id failed]:', err);
  }
}

function updateJobPostingJsonLd(jobs) {
  const existing = document.getElementById('jobs-dynamic-ld');
  if (existing) existing.remove();

  if (!jobs || jobs.length === 0) return;

  const script = document.createElement('script');
  script.id = 'jobs-dynamic-ld';
  script.type = 'application/ld+json';

  const schemaItems = jobs.map(j => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": j.title,
    "description": j.description,
    "datePosted": new Date(j.created_at || Date.now()).toISOString().split('T')[0],
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": j.workplace || "محلات وشركات المنزلة والمطرية",
      "sameAs": "https://dalilmanzala.com/"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": j.location || "المنزلة",
        "addressRegion": "الدقهلية",
        "addressCountry": "EG"
      }
    },
    ...(j.salary_type === 'specified' && j.salary ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "EGP",
        "value": {
          "@type": "QuantitativeValue",
          "value": j.salary,
          "unitText": "MONTH"
        }
      }
    } : {})
  }));

  script.textContent = JSON.stringify(schemaItems.length === 1 ? schemaItems[0] : schemaItems);
  document.head.appendChild(script);
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
