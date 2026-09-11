import { fetchServiceRequests, closeServiceRequest, deleteServiceRequest, voteInteractiveItem, reportInteractiveItem } from '../../services/interactive-hub.service.js';
import { openNeedServiceModal } from './NeedServiceModal.js';
import { getCurrentUser, isAdmin } from '../../core/auth.js';
import { toast } from './Toast.js';

export async function renderServiceRequestsSection($container, { limit = 6, showHero = true, isCompact = false } = {}) {
  const container = typeof $container === 'string' ? document.getElementById($container) : $container;
  if (!container) return;

  container.innerHTML = `
    <section class="service-requests-section">
      ${showHero ? `
        <!-- Luxury Hero Banner with Animated Broadcast Icon & Pulse -->
        <div class="need-service-hero">
          <div style="display:flex;align-items:center;gap:16px;max-width:700px">
            <div class="service-request-badge" aria-hidden="true">
              <div class="service-request-ping"></div>
              <svg class="service-request-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <div class="service-request-dot"></div>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
                <h3 style="font-size:1.35rem;font-weight:900;margin:0;color:#fff">
                  طلبات أهالينا (اطلب صنايعي أو خدمة)
                </h3>
                <span style="font-size:0.75rem;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);color:#fef08a;padding:2px 10px;border-radius:12px;font-weight:800;display:inline-flex;align-items:center;gap:5px">
                  <span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span>
                  <span>مباشر — استقبال عروض الفنيين</span>
                </span>
              </div>
              <p style="margin:0;font-size:0.88rem;color:#e0e7ff;line-height:1.6">
                محتاج سباك، كهربائي، نجار، صيانة تكييف أو أي خدمة؟ اكتب احتياجك وسيصلك الفنيون المناسبون فوراً، أو تصفح دليل الفنيين المعتمدين بالمدينة.
              </p>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <button type="button" class="need-service-cta-btn btn-open-service-request-modal">
              <span style="font-size:1.15rem">➕</span>
              <span>اطلب صنايعي الآن</span>
            </button>
            <a href="categories.html" class="btn" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:14px;padding:10px 18px;font-weight:800;font-size:0.88rem;display:inline-flex;align-items:center;gap:6px;text-decoration:none">
              <span>تصفح الفنيين بالدليل ←</span>
            </a>
          </div>
        </div>
      ` : ''}

      <!-- Header Row (If no hero, or compact) -->
      ${!showHero ? `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="service-request-badge" style="width:40px;height:40px" aria-hidden="true">
              <div class="service-request-ping"></div>
              <svg class="service-request-svg" style="width:22px;height:22px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <div class="service-request-dot"></div>
            </div>
            <div>
              <h3 style="margin:0;font-size:1.25rem;font-weight:900;color:var(--text-primary);display:flex;align-items:center;gap:8px">
                <span>📢</span>
                <span>طلبات أهالينا الجارية</span>
                <span style="font-size:0.75rem;background:rgba(245,158,11,0.15);color:#d97706;padding:2px 8px;border-radius:10px;font-weight:700">محدث لحظياً</span>
              </h3>
              <p style="margin:2px 0 0;font-size:0.82rem;color:var(--text-muted)">
                تفاعل وقدم عروضك للطلبات المفتوحة بالمنزلة والمطرية
              </p>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <button type="button" class="need-service-cta-btn btn-open-service-request-modal" style="padding:8px 18px;font-size:0.88rem">
              <span>➕</span>
              <span>اطلب خدمة الآن</span>
            </button>
            <a href="categories.html" class="btn btn-outline btn-sm" style="border-radius:12px;font-weight:800;padding:8px 14px;font-size:0.82rem">
              <span>تصفح الفنيين</span>
            </a>
          </div>
        </div>
      ` : ''}

      <!-- Grid of Service Requests -->
      <div class="need-service-grid service-requests-grid-slot">
        <div style="grid-column:1/-1;text-align:center;padding:28px 0;color:var(--text-muted)">
          <span>جاري تحميل طلبات الخدمات...</span>
        </div>
      </div>

      ${isCompact ? `
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px;flex-wrap:wrap">
          <a href="now.html" class="btn btn-outline btn-sm" style="border-radius:12px;font-weight:800;padding:8px 18px">
            <span>عرض كافة طلبات أهالينا والفنيين المتاحين</span>
            <span style="margin-right:4px">←</span>
          </a>
          <a href="categories.html" class="btn btn-outline btn-sm" style="border-radius:12px;font-weight:800;padding:8px 18px">
            <span>تصفح دليل الفنيين والحرفيين المعتمدين (165+ مهنة)</span>
            <span style="margin-right:4px">←</span>
          </a>
        </div>
      ` : ''}
    </section>
  `;

  // Attach modal triggers
  container.querySelectorAll('.btn-open-service-request-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      openNeedServiceModal(() => loadRequests(container, limit));
    });
  });

  await loadRequests(container, limit);
}

async function loadRequests(container, limit = 6) {
  const $grid = container.querySelector('.service-requests-grid-slot');
  if (!$grid) return;

  try {
    const requests = await fetchServiceRequests({ status: 'open', limit });

    if (!requests || requests.length === 0) {
      $grid.innerHTML = `
        <div style="grid-column:1/-1;background:var(--surface-2, #f8fafc);border:1.5px solid var(--border, #e2e8f0);border-radius:20px;padding:28px 18px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.02)">
          <div style="font-size:2.4rem;margin-bottom:8px">🤝</div>
          <p style="margin:0 0 6px;font-weight:900;font-size:1.15rem;color:var(--text-primary)">تمت تلبية جميع طلبات أهالينا السابقة بنجاح!</p>
          <p style="margin:0 0 16px;font-size:0.9rem;color:var(--text-muted);max-width:540px;margin-inline:auto;line-height:1.6">
            لا توجد طلبات جارية مفتوحة من أهالينا في هذه اللحظة. هل تبحث عن فني أو خدمة فورية؟ تواصل مباشرة مع أمهر الفنيين المعتمدين في دليلك:
          </p>

          <!-- Quick Service Categories Chips -->
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:20px;max-width:680px;margin-inline:auto">
            <a href="search.html?q=سباك" class="btn btn-outline btn-sm" style="border-radius:12px;font-size:0.84rem;font-weight:700;padding:7px 14px;background:var(--surface,#fff);display:inline-flex;align-items:center;gap:5px">
              <span>🪠</span><span>سباك وأدوات صحية</span>
            </a>
            <a href="search.html?q=كهربائي" class="btn btn-outline btn-sm" style="border-radius:12px;font-size:0.84rem;font-weight:700;padding:7px 14px;background:var(--surface,#fff);display:inline-flex;align-items:center;gap:5px">
              <span>⚡</span><span>كهربائي منازل</span>
            </a>
            <a href="search.html?q=تكييف" class="btn btn-outline btn-sm" style="border-radius:12px;font-size:0.84rem;font-weight:700;padding:7px 14px;background:var(--surface,#fff);display:inline-flex;align-items:center;gap:5px">
              <span>❄️</span><span>صيانة تكييف وتبريد</span>
            </a>
            <a href="search.html?q=نجار" class="btn btn-outline btn-sm" style="border-radius:12px;font-size:0.84rem;font-weight:700;padding:7px 14px;background:var(--surface,#fff);display:inline-flex;align-items:center;gap:5px">
              <span>🪚</span><span>نجار موبيليا وأبواب</span>
            </a>
            <a href="search.html?q=نقاش" class="btn btn-outline btn-sm" style="border-radius:12px;font-size:0.84rem;font-weight:700;padding:7px 14px;background:var(--surface,#fff);display:inline-flex;align-items:center;gap:5px">
              <span>🎨</span><span>نقاش وتشطيبات</span>
            </a>
            <a href="search.html?q=ميكانيكي" class="btn btn-outline btn-sm" style="border-radius:12px;font-size:0.84rem;font-weight:700;padding:7px 14px;background:var(--surface,#fff);display:inline-flex;align-items:center;gap:5px">
              <span>🚗</span><span>ميكانيكا وصيانة سيارات</span>
            </a>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
            <button type="button" class="btn btn-primary btn-open-service-request-modal" style="border-radius:14px;font-weight:800;padding:10px 22px;font-size:0.92rem;box-shadow:0 4px 15px rgba(2,132,199,0.3)">
              <span>➕ اطلب فني / خدمة جديدة الآن</span>
            </button>
            <a href="categories.html" class="btn btn-outline" style="border-radius:14px;font-weight:800;padding:10px 20px;font-size:0.92rem">
              <span>تصفح دليل كافة الفنيين (165+ مهنة) ←</span>
            </a>
          </div>
        </div>
      `;

      $grid.querySelector('.btn-open-service-request-modal')?.addEventListener('click', () => {
        openNeedServiceModal(() => loadRequests(container, limit));
      });
      return;
    }

    const currentUser = getCurrentUser();

    $grid.innerHTML = requests.map(r => {
      const isClosed = r.status === 'closed';
      const isOwner = currentUser && (currentUser.uid === r.userId || r.isOwner || isAdmin(currentUser));
      const waText = encodeURIComponent(`السلام عليكم، أنا فني بخصوص طلبك على دليل المنزلة والمطرية: "${r.title}" في ${r.village}`);
      const waUrl = !r.isPhoneMasked && r.userPhone 
        ? `https://wa.me/2${r.userPhone.replace(/[^0-9]/g,'')}?text=${waText}` 
        : `https://wa.me/201004128504?text=${waText}`;

      return `
        <article class="need-service-card" id="req-${esc(r.id)}" data-req-card="${esc(r.id)}">
          
          ${isOwner ? `
            <div style="background:rgba(16,185,129,0.12);border:1.5px solid rgba(16,185,129,0.4);border-radius:12px;padding:8px 10px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
              <div style="font-size:0.78rem;color:#047857;font-weight:800;display:flex;align-items:center;gap:5px">
                <span>👑</span>
                <span>طلبك الخاص</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                ${!isClosed ? `
                  <button type="button" class="btn btn-sm btn-close-my-request" data-req-id="${esc(r.id)}" style="background:#10b981;color:#fff;border-radius:8px;font-size:0.75rem;padding:5px 10px;font-weight:800;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px">
                    <span>✓</span>
                    <span>تم العثور على الخدمة</span>
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-delete-my-request" data-req-id="${esc(r.id)}" style="background:#ef4444;color:#fff;border-radius:8px;font-size:0.75rem;padding:5px 8px;font-weight:800;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px" title="حذف الطلب نهائياً">
                  <span>🗑️</span>
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ` : ''}

          <div class="need-service-card-header">
            <span class="need-category-pill">
              <span>🔧</span>
              <span>${esc(r.category || 'خدمة عامة')}</span>
            </span>
            <span class="need-status-pill ${isClosed ? 'need-status-pill--closed' : 'need-status-pill--open'}">
              ${isClosed ? '✓ تم الاتفاق' : '<span style="width:6px;height:6px;border-radius:50%;background:#15803d;display:inline-block"></span> قيد البحث عن فني'}
            </span>
          </div>

          <h4 class="need-title">${esc(r.title)}</h4>

          <div class="need-meta">
            <span class="need-meta-item">📍 <strong>${esc(r.village || 'المنزلة')}</strong></span>
            <span class="need-meta-item">⏰ <strong>${esc(r.timing || 'خلال اليوم')}</strong></span>
            <span class="need-meta-item">👤 ${esc(r.userName || 'أحد أهالي المدينة')}</span>
          </div>

          ${r.description ? `
            <p class="need-description">${esc(r.description)}</p>
          ` : ''}

          <div class="need-privacy-notice">
            <span class="need-privacy-icon">🛡️</span>
            <span><strong>رقم الهاتف:</strong> ${r.userPhone || (r.isPhoneMasked ? 'محمي بالخصوصية' : 'متاح للاتصال')}</span>
          </div>

          <!-- Interactive Community Reactions: Like, Dislike & Report -->
          <div class="need-reactions" style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border, #e2e8f0);padding-top:10px;margin-top:12px;gap:6px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px">
              <button type="button" class="btn-req-vote ${r.userVote === 'like' ? 'voted-active' : ''}" data-target-id="${esc(r.id)}" data-vote="like" title="إعجاب بالطلب" style="background:${r.userVote === 'like' ? '#dcfce7' : '#f1f5f9'};color:${r.userVote === 'like' ? '#15803d' : '#475569'};border:1px solid ${r.userVote === 'like' ? '#86efac' : '#cbd5e1'};border-radius:8px;padding:4px 10px;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;cursor:pointer;transition:all 0.2s">
                <span>👍</span>
                <span class="count-val">${r.likesCount || 0}</span>
              </button>
              <button type="button" class="btn-req-vote ${r.userVote === 'dislike' ? 'voted-active' : ''}" data-target-id="${esc(r.id)}" data-vote="dislike" title="عدم إعجاب" style="background:${r.userVote === 'dislike' ? '#fee2e2' : '#f1f5f9'};color:${r.userVote === 'dislike' ? '#b91c1c' : '#475569'};border:1px solid ${r.userVote === 'dislike' ? '#fca5a5' : '#cbd5e1'};border-radius:8px;padding:4px 10px;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;cursor:pointer;transition:all 0.2s">
                <span>👎</span>
                <span class="count-val">${r.dislikesCount || 0}</span>
              </button>
            </div>
            <button type="button" class="btn-req-report" data-target-id="${esc(r.id)}" data-target-title="${esc(r.title)}" title="إبلاغ عن طلب غير جاد" style="background:none;border:none;color:#64748b;font-size:0.75rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 6px;border-radius:6px;transition:color 0.2s">
              <span>🚩</span>
              <span>إبلاغ عن غير جاد</span>
            </button>
          </div>

          ${!isClosed ? `
            <div style="display:flex;gap:8px;margin-top:auto">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;border-radius:12px;font-weight:800;gap:6px">
                <span>💬</span>
                <span>أنا متاح / تقديم عرض</span>
              </a>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');

    // Attach owner action listeners (تم العثور على الخدمة)
    $grid.querySelectorAll('.btn-close-my-request').forEach(btn => {
      btn.addEventListener('click', async () => {
        const reqId = btn.getAttribute('data-req-id');
        if (!reqId) return;

        if (!confirm('تهانينا! هل تم العثور على الفني وإنجاز الخدمة بالفعل؟\nسيتم إغلاق طلبك وحذفه تلقائياً من القائمة النشطة.')) return;

        btn.disabled = true;
        btn.textContent = 'جاري الإغلاق...';

        try {
          const res = await closeServiceRequest(reqId);
          if (res?.success) {
            toast.success('تم إغلاق طلبك بنجاح! يسعدنا تلبية احتياجك عبر دليل المنزلة والمطرية.');
            // Animate card removal
            const card = $grid.querySelector(`[data-req-card="${reqId}"]`);
            if (card) {
              card.style.transition = 'all 0.35s ease';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.9)';
              setTimeout(() => loadRequests(container, limit), 400);
            } else {
              loadRequests(container, limit);
            }
          } else {
            toast.error(res?.error || 'تعذر إغلاق الطلب');
            btn.disabled = false;
            btn.textContent = '✓ تم العثور على الخدمة';
          }
        } catch (err) {
          toast.error('حدث خطأ في الاتصال');
          btn.disabled = false;
          btn.textContent = '✓ تم العثور على الخدمة';
        }
      });
    });

    // Attach owner action listeners (حذف الطلب نهائياً)
    $grid.querySelectorAll('.btn-delete-my-request').forEach(btn => {
      btn.addEventListener('click', async () => {
        const reqId = btn.getAttribute('data-req-id');
        if (!reqId) return;

        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من الدليل؟')) return;

        btn.disabled = true;
        btn.textContent = 'جاري الحذف...';

        try {
          const res = await deleteServiceRequest(reqId);
          if (res?.success) {
            toast.success('تم حذف طلب الخدمة بنجاح');
            const card = $grid.querySelector(`[data-req-card="${reqId}"]`);
            if (card) {
              card.style.transition = 'all 0.35s ease';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.9)';
              setTimeout(() => loadRequests(container, limit), 400);
            } else {
              loadRequests(container, limit);
            }
          } else {
            toast.error(res?.error || 'تعذر حذف الطلب');
            btn.disabled = false;
            btn.textContent = '🗑️ حذف';
          }
        } catch (err) {
          toast.error('حدث خطأ في الاتصال');
          btn.disabled = false;
          btn.textContent = '🗑️ حذف';
        }
      });
    });

    // Attach reaction listeners (لايك، ديسلايك، إبلاغ)
    $grid.querySelectorAll('.btn-req-vote').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const user = getCurrentUser();
        if (!user) {
          toast.info('يجب تسجيل الدخول بحسابك أولاً للتفاعل مع الطلبات');
          return;
        }
        const targetId = btn.getAttribute('data-target-id');
        const voteType = btn.getAttribute('data-vote');
        if (!targetId || !voteType) return;

        btn.disabled = true;
        try {
          const res = await voteInteractiveItem({ targetId, targetType: 'service_request', voteType });
          if (res?.deleted) {
            toast.warning('تم حذف هذا الطلب تلقائياً لتجاوزه حد 25 ديسلايك من المجتمع');
            const card = $grid.querySelector(`[data-req-card="${targetId}"]`);
            if (card) {
              card.style.transition = 'all 0.35s ease';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.85)';
              setTimeout(() => card.remove(), 350);
            }
            return;
          }
          if (res?.success) {
            const card = $grid.querySelector(`[data-req-card="${targetId}"]`);
            if (card) {
              const likeBtn = card.querySelector('.btn-req-vote[data-vote="like"]');
              const dislikeBtn = card.querySelector('.btn-req-vote[data-vote="dislike"]');
              if (likeBtn) {
                likeBtn.querySelector('.count-val').textContent = res.likesCount || 0;
                const isL = res.userVote === 'like';
                likeBtn.style.background = isL ? '#dcfce7' : '#f1f5f9';
                likeBtn.style.color = isL ? '#15803d' : '#475569';
                likeBtn.style.borderColor = isL ? '#86efac' : '#cbd5e1';
              }
              if (dislikeBtn) {
                dislikeBtn.querySelector('.count-val').textContent = res.dislikesCount || 0;
                const isD = res.userVote === 'dislike';
                dislikeBtn.style.background = isD ? '#fee2e2' : '#f1f5f9';
                dislikeBtn.style.color = isD ? '#b91c1c' : '#475569';
                dislikeBtn.style.borderColor = isD ? '#fca5a5' : '#cbd5e1';
              }
            }
          } else {
            toast.error(res?.error || 'تعذر تسجيل التفاعل');
          }
        } catch (err) {
          toast.error('حدث خطأ أثناء الاتصال');
        } finally {
          btn.disabled = false;
        }
      });
    });

    $grid.querySelectorAll('.btn-req-report').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const user = getCurrentUser();
        if (!user) {
          toast.info('يجب تسجيل الدخول بحسابك أولاً لتقديم بلاغ');
          return;
        }
        const targetId = btn.getAttribute('data-target-id');
        const targetTitle = btn.getAttribute('data-target-title') || 'هذا الطلب';
        if (!targetId) return;

        const reason = prompt(`إبلاغ عن عدم جدية الطلب (${targetTitle}):\nاكتب سبب الإبلاغ باختصار (مثال: طلب وهمي، رقم خاطئ، تم إنجازه ولم يغلقه):`, 'طلب غير جاد');
        if (reason === null) return;

        btn.disabled = true;
        try {
          const res = await reportInteractiveItem({ targetId, targetType: 'service_request', reason: reason.trim() || 'طلب غير جاد' });
          if (res?.success) {
            toast.success(res.message || 'تم تسجيل البلاغ وستتم المراجعة فوراً');
          } else {
            toast.error(res?.error || 'تعذر إرسال البلاغ');
          }
        } catch (err) {
          toast.error('حدث خطأ أثناء الإبلاغ');
        } finally {
          btn.disabled = false;
        }
      });
    });

  } catch (err) {
    console.error('[ServiceRequestsSection] load error:', err);
    $grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#ef4444;padding:16px">تعذر تحميل طلبات الخدمات حالياً.</div>`;
  }

}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
