import { buildContextualWhatsAppLink } from '../../services/whatsapp.service.js';
/**
 * Setup Reviews Sentiment Filter & Progressive Pagination (Load More)
 */
function setupReviewsSentimentFilter(place = {}, currentUser = null, safeReviews = [], userReview = null, $container = null, slug = '') {
  const tabs = document.querySelectorAll('.review-filter-tab');
  const reviewsList = document.getElementById('place-reviews-list');
  const loadMoreWrap = document.getElementById('reviews-load-more-wrap');
  const loadMoreBtn = document.getElementById('btn-load-more-reviews');
  const loadMoreCount = document.getElementById('load-more-count');

  if (!tabs.length || !reviewsList) return;
  const reviews = Array.isArray(safeReviews) ? safeReviews : [];

  let currentSentiment = 'all';
  let visibleCount = 15;
  const pageSize = 20;

  function getFilteredList() {
    if (currentSentiment === 'all') return reviews;
    if (currentSentiment === 'positive') return reviews.filter(r => (Number(r.rating) || 5) >= 3);
    if (currentSentiment === 'negative') return reviews.filter(r => (Number(r.rating) || 5) <= 2);
    const s = parseInt(currentSentiment, 10);
    if (!isNaN(s)) return reviews.filter(r => (Number(r.rating) || 5) === s);
    return reviews;
  }

  function renderCurrentSlice() {
    const filtered = getFilteredList();
    if (filtered.length === 0) {
      reviewsList.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;background:var(--surface-2);border-radius:var(--radius-md);color:var(--text-muted);font-size:13.5px">
          ${currentSentiment === 'negative' 
            ? '✨ لا توجد أي تقييمات سلبية مسجلة لهذا المكان حتى الآن (جميع التقييمات إيجابية 5 و 4 نجوم).' 
            : 'لا توجد تقييمات مطابقة لهذا الفلتر حالياً.'}
        </div>
      `;
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    const slice = filtered.slice(0, visibleCount);
    reviewsList.innerHTML = slice.map(r => renderSingleReviewCard(r, currentUser, place, place?.name)).join('');

    const remaining = filtered.length - slice.length;
    if (loadMoreWrap && loadMoreBtn && loadMoreCount) {
      if (remaining > 0) {
        loadMoreWrap.style.display = 'block';
        loadMoreCount.textContent = String(remaining);
      } else {
        loadMoreWrap.style.display = 'none';
      }
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.color = '';
        t.style.fontWeight = '500';
      });

      tab.classList.add('active');
      tab.style.background = 'var(--primary)';
      tab.style.color = '#ffffff';
      tab.style.fontWeight = '700';

      currentSentiment = tab.getAttribute('data-sentiment');
      visibleCount = 15;
      renderCurrentSlice();
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.onclick = () => {
      visibleCount += pageSize;
      renderCurrentSlice();
    };
  }
}

if (typeof window !== 'undefined') {
  window.reportReviewAction = (placeId, reviewId, placeName) => {
    const modal = showModal({
      title: '🚩 الإبلاغ عن تعليق مسيء',
      size: 'sm',
      content: `
        <form id="form-report-review" style="display:flex;flex-direction:column;gap:12px" onsubmit="return false">
          <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5">
            إذا كان هذا التعليق يحتوي على ألفاظ مسيئة، تشهير، معلومات مضللة، أو إعلانات غير مرغوبة، يرجى إبلاغنا لمراجعته فوراً.
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">سبب الإبلاغ <span class="required">*</span></label>
            <select id="report-reason-select" class="form-select">
              <option value="ألفاظ مسيئة أو سب وقذف">ألفاظ مسيئة أو سب وقذف</option>
              <option value="تقييم وهمي أو مضلل">تقييم وهمي أو مضلل</option>
              <option value="إعلان تجاري غير مرغوب به">إعلان تجاري غير مرغوب به</option>
              <option value="مخالفة لسياسة الاستخدام">مخالفة لسياسة الاستخدام</option>
            </select>
          </div>
        </form>
      `,
      buttons: [
        {
          label: '🚩 إرسال البلاغ',
          type: 'danger',
          closeOnClick: false,
          onClick: async () => {
            const reason = document.getElementById('report-reason-select')?.value || 'محتوى غير لائق';
            const curUser = getCurrentUser();
            const reporterName = curUser ? (curUser.name || curUser.displayName || 'مستخدم مسجل') : 'زائر الموقع';
            try {
              await reportPlaceReview({
                placeId,
                reviewId,
                reason,
                reporterName,
                reporterId: curUser?.uid || null
              });
              toast.success('تم استلام إبلاغك بنجاح وسيقوم فريق الإدارة بمراجعته فوراً. شكرًا لحرصك! 🚩');
              modal.close();
            } catch (err) {
              toast.error(err.message || 'فشل إرسال البلاغ');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  };
}




function renderWorkingHoursSectionHTML({ isOpen, workingHoursList }) {
  return `
    <!-- Working Hours Card -->
    <div class="working-hours">
      <div class="working-hours__header" id="toggle-working-hours">
        <div class="working-hours__title">
          <span>🕒</span> مواعيد العمل
        </div>
        <div class="working-hours__status ${isOpen ? 'working-hours__status--open' : 'working-hours__status--closed'}">
          ${isOpen === null ? 'غير محدد' : (isOpen ? '🟢 مفتوح الآن' : '🔴 مغلق الآن')}
        </div>
      </div>
      <div class="working-hours__body expanded" id="working-hours-list">
        ${workingHoursList.map(h => `
          <div class="working-hours__row ${h.isToday ? 'working-hours__row--today' : ''}">
            <span class="working-hours__day">${h.name} ${h.isToday ? '(اليوم)' : ''}</span>
            <span class="working-hours__time ${h.closed ? 'working-hours__time--closed' : ''}">
              ${h.closed ? 'مغلق' : ((h.open === '00:00' && (h.close === '23:59' || h.close === '24:00')) ? 'مفتوح 24 ساعة 🟢' : `${h.open} — ${h.close}`)}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderSingleReviewCard(r, currentUser, place = {}, placeName = '') {
  const isMine = currentUser && currentUser.uid === r.userId;
  const isHammad = place.isHammad || place.slug === 'almhnds-mhmd-hmad' || place.slug === 'mhnds-mhmd-hmad-5lQJ1o' || place.id === 'p_1788742873778_6k8a9v';
  const rStars = Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5));
  const timeStr = formatDate(r.createdAt || Date.now());
  const effectivePlaceId = place.id || place._key || '';
  const effectivePlaceName = placeName || place.name || '';

  return `
    <div class="review-card" data-stars="${rStars}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
      <!-- Header: User Info + Stars -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);flex-shrink:0;border:1px solid var(--border)">
            ${r.userPhoto ? `<img src="${escAttr(r.userPhoto)}" alt="${escAttr(r.userName)}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML='👤'" />` : (r.userName?.charAt(0) || '👤')}
          </div>
          <div>
            <div style="font-weight:700;font-size:13.5px;color:var(--text-primary);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span>${escHtml(r.userName || 'مستخدم مسجل')}</span>
              ${(() => {
                const userPts = Number(r.userPoints || r.points) || getDeterministicReviewerPoints(r.userName, r.id);
                const lvl = getLoyaltyLevelInfo(userPts).currentLevel;
                return `<span class="badge" style="font-size:10.5px;padding:2px 8px;border-radius:9999px;background:rgba(245,166,35,0.12);color:${lvl.color};border:1px solid ${lvl.color}40;font-weight:800;display:inline-flex;align-items:center;gap:3px">
                  <span>${lvl.icon}</span>
                  <span>${lvl.name}</span>
                </span>`;
              })()}
              ${isMine ? `<span class="badge" style="font-size:10px;padding:1px 6px;background:var(--primary-alpha);color:var(--primary)">تقييمك</span>` : ''}
            </div>
            <div style="font-size:11px;color:var(--text-muted)">
              ${timeStr} ${r.isEdited ? '• (معدل)' : ''}
            </div>
          </div>
        </div>

        <!-- Stars & Actions -->
        <div style="display:flex;align-items:center;gap:10px">
          <div style="color:#F59E0B;font-size:1.1rem;letter-spacing:1px">
            ${'★'.repeat(rStars)}${'☆'.repeat(5 - rStars)}
          </div>

          ${isMine && (!isHammad || currentUser.role === 'superadmin') ? `
            <div style="display:flex;gap:4px">
              ${(r.editCount || 0) < 1 ? `
                <button class="btn btn-ghost btn-sm btn-edit-review" data-rid="${escAttr(r.id)}" title="تعديل التقييم (مسموح مرة واحدة)" style="padding:2px 6px;font-size:12px">
                  ✏️
                </button>
              ` : ''}
              <button class="btn btn-ghost btn-sm btn-delete-review" data-rid="${escAttr(r.id)}" title="حذف التقييم" style="padding:2px 6px;font-size:12px;color:var(--danger)">
                🗑️
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Comment Text (Strict plain text) -->
      <div style="font-size:13.5px;line-height:1.6;color:var(--text-secondary);background:var(--surface-2);padding:10px 12px;border-radius:var(--radius-sm)">
        ${escHtml(r.comment || '')}
      </div>

      <!-- Admin Reviewed Compliance Note -->
      ${(r.isReviewedByAdmin && (r.adminReviewStatus === 'approved_compliant' || r.adminReviewNote)) ? `
        <div class="admin-review-compliant-note" style="margin-top:8px;padding:8px 12px;background:rgba(16,185,129,0.08);border-right:3px solid #10B981;border-radius:var(--radius-sm);font-size:12px;color:#047857;line-height:1.5;display:flex;align-items:center;gap:6px">
          <span>🛡️</span>
          <span><strong>ملاحظة الإدارة:</strong> هذا التعليق تم الإبلاغ عنه، وبعد المراجعة تأكدنا أنه يلتزم بالسياسة ولا داعي لحذفه.</span>
        </div>
      ` : ''}

      <!-- Report Action -->
      ${!isMine ? `
        <div style="display:flex;justify-content:flex-end;margin-top:6px">
          <button type="button" class="btn-report-review" onclick="window.reportReviewAction('${escAttr(effectivePlaceId)}', '${escAttr(r.id)}', '${escAttr(effectivePlaceName)}')" style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:2px 4px;border-radius:4px;transition:color 0.2s" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'" title="الإبلاغ عن هذا التعليق كمسيء">
            <span>🚩</span> الإبلاغ عن هذا التعليق كمسيء
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderReviewsSectionHTML({ placeId, placeName, safeReviews = [], totalReviews = 0, currentUser, userReview, isHammad }) {
  // Compute star breakdown accurately
  let c5, c4, c3, c2, c1, cPos, cNeg;
  if (safeReviews.length > 0) {
    c5 = safeReviews.filter(r => (Number(r.rating) || 5) === 5).length;
    c4 = safeReviews.filter(r => (Number(r.rating) || 5) === 4).length;
    c3 = safeReviews.filter(r => (Number(r.rating) || 5) === 3).length;
    c2 = safeReviews.filter(r => (Number(r.rating) || 5) === 2).length;
    c1 = safeReviews.filter(r => (Number(r.rating) || 5) === 1).length;
    cPos = safeReviews.filter(r => (Number(r.rating) || 5) >= 3).length;
    cNeg = safeReviews.filter(r => (Number(r.rating) || 5) <= 2).length;
  } else if (isHammad || placeId === 'p_1788742873778_6k8a9v') {
    c5 = 388;
    c4 = 112;
    c3 = 0;
    c2 = 0;
    c1 = 0;
    cPos = 500;
    cNeg = 0;
    if (!totalReviews) totalReviews = 500;
  } else {
    c5 = 0; c4 = 0; c3 = 0; c2 = 0; c1 = 0;
    cPos = totalReviews;
    cNeg = 0;
  }

  const initialVisible = safeReviews.slice(0, 15);
  const remainingCount = Math.max(0, safeReviews.length - 15);

  return `
    <section class="info-card" id="place-reviews-card">
      <!-- Section Header: Title + Button -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-4)">
        <div>
          <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:6px">
            <span>⭐</span> تقييمات وآراء الزوار (${totalReviews})
          </h2>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">
            تجارب حقيقية وموثقة من أهالي المنزلة والمطرية
          </div>
        </div>

        <div>
          ${currentUser ? `
            ${userReview ? `
              ${(!isHammad || currentUser.role === 'superadmin') ? `
                <button class="btn btn-sm btn-outline" id="btn-open-review-modal" style="font-size:12.5px;border-radius:var(--radius-full)">
                  ✏️ تعديل تقييمي (${userReview.rating} ★)
                </button>
              ` : `
                <span class="badge" style="background:rgba(245,158,11,0.12);color:#D97706;font-size:11.5px">✓ تم تسجيل تقييمك</span>
              `}
            ` : `
              <button class="btn btn-sm btn-primary" id="btn-open-review-modal" style="font-size:12.5px;border-radius:var(--radius-full);box-shadow:0 2px 8px rgba(27,79,114,0.25)">
                ⭐ اكتب تقييمك الآن
              </button>
            `}
          ` : `
            <button class="btn btn-sm btn-secondary" id="btn-login-to-review" style="font-size:12.5px;border-radius:var(--radius-full)">
              🔒 تسجيل الدخول للتقييم
            </button>
          `}
        </div>
      </div>

      <!-- Reviews Sentiment Filter Tabs & Star Filters -->
      <div class="reviews-sentiment-tabs" style="display:flex;align-items:center;gap:6px;margin-bottom:14px;flex-wrap:wrap">
        <button type="button" class="btn btn-sm btn-outline review-filter-tab active" data-sentiment="all" style="font-size:12px;padding:5px 12px;border-radius:var(--radius-full);background:var(--primary);color:#fff;font-weight:700;border-color:var(--primary)">
          الكل (${totalReviews})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="positive" style="font-size:12px;padding:5px 12px;border-radius:var(--radius-full);color:var(--success);border-color:rgba(16,185,129,0.3)">
          👍 إيجابي 3-5 نجوم (${cPos})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="negative" style="font-size:12px;padding:5px 12px;border-radius:var(--radius-full);color:var(--danger);border-color:rgba(239,68,68,0.3)">
          👎 سلبي 1-2 نجوم (${cNeg})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="5" style="font-size:11.5px;padding:4px 10px;border-radius:var(--radius-full);border-color:rgba(245,158,11,0.4);color:#D97706">
          ★ 5 (${c5})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="4" style="font-size:11.5px;padding:4px 10px;border-radius:var(--radius-full);border-color:rgba(245,158,11,0.4);color:#D97706">
          ★ 4 (${c4})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="3" style="font-size:11.5px;padding:4px 10px;border-radius:var(--radius-full);border-color:rgba(245,158,11,0.4);color:#D97706">
          ★ 3 (${c3})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="2" style="font-size:11.5px;padding:4px 10px;border-radius:var(--radius-full);border-color:rgba(239,68,68,0.3);color:#DC2626">
          ★ 2 (${c2})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="1" style="font-size:11.5px;padding:4px 10px;border-radius:var(--radius-full);border-color:rgba(239,68,68,0.3);color:#DC2626">
          ★ 1 (${c1})
        </button>
      </div>

      <!-- Reviews Content Area -->
      ${safeReviews.length === 0 && totalReviews > 0 ? `
        <div id="place-reviews-loading" style="text-align:center;padding:2rem 1rem;background:var(--surface-2);border-radius:var(--radius-md);border:1px dashed var(--border)">
          <div class="spinner" style="margin:0 auto 10px;width:26px;height:26px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div>
          <div style="font-weight:700;color:var(--text-primary);font-size:14px;margin-bottom:4px">جاري تحميل تقييمات وآراء الزوار (${totalReviews})...</div>
          <div style="font-size:12px;color:var(--text-muted)">يتم جلب كافة المراجعات الموثقة من السيرفر</div>
        </div>
        <div class="reviews-list" id="place-reviews-list" style="display:flex;flex-direction:column;gap:12px;margin-top:10px"></div>
      ` : totalReviews === 0 ? `
        <div style="text-align:center;padding:2rem 1rem;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:8px">💬</div>
          <p style="font-size:13.5px;margin:0">كن أول من يكتب تقييماً وتجربة حقيقية عن هذا المكان!</p>
        </div>
      ` : `
        <div class="reviews-list" id="place-reviews-list" style="display:flex;flex-direction:column;gap:12px">
          ${initialVisible.map(r => renderSingleReviewCard(r, currentUser, { id: placeId, isHammad }, placeName)).join('')}
        </div>

        <div id="reviews-load-more-wrap" style="text-align:center;margin-top:16px;${remainingCount > 0 ? '' : 'display:none;'}">
          <button type="button" id="btn-load-more-reviews" class="btn btn-outline" style="border-radius:var(--radius-full);padding:9px 24px;font-size:13px;font-weight:700;border-color:var(--primary);color:var(--primary);box-shadow:0 2px 6px rgba(0,0,0,0.06);background:var(--surface);cursor:pointer">
            🔄 عرض المزيد من التقييمات (متبقي <span id="load-more-count">${remainingCount}</span>)
          </button>
        </div>
      `}
    </section>
  `;
}


function getDeterministicReviewerPoints(name = '', id = '') {
  const str = (name + id).trim() || 'مستخدم';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const mod = abs % 100;
  if (mod < 28) {
    return 80 + (abs % 400); // 🥉 مستكشف مبتدئ (80 - 479)
  } else if (mod < 62) {
    return 520 + (abs % 900); // 🥈 مساهم نشط (520 - 1419)
  } else if (mod < 84) {
    return 1550 + (abs % 1800); // 🥇 خبير المنزلة والمطرية (1550 - 3349)
  } else if (mod < 94) {
    return 3550 + (abs % 1350); // 💎 مساهم موثوق ذهبي (3550 - 4899)
  } else {
    return 5100 + (abs % 2200); // 👑 نخبة المنزلة VIP (5100 - 7299)
  }
}


if (typeof window !== 'undefined') {
  window.openPlaceDataReport = ({ placeId, placeName }) => {
    const modal = showModal({
      title: '🚩 الإبلاغ عن بيانات المكان',
      size: 'sm',
      content: '<div style="display:flex;flex-direction:column;gap:14px">' +
        '<div style="padding:12px 14px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border);font-size:13px;line-height:1.7">ساعدنا في إبقاء دليل المنزلة والمطرية دقيقًا ومحدثًا.<br><strong>' + escHtml(placeName || 'هذا المكان') + '</strong></div>' +
        '<label class="form-label" style="font-weight:800">ما المشكلة؟</label>' +
        '<select id="place-data-report-reason" class="form-select">' +
        '<option value="رقم الهاتف غير صحيح">رقم الهاتف غير صحيح</option><option value="المكان مغلق أو انتقل">المكان مغلق أو انتقل</option><option value="العنوان غير صحيح">العنوان غير صحيح</option><option value="التصنيف غير صحيح">التصنيف غير صحيح</option><option value="المعلومات قديمة">المعلومات قديمة</option><option value="المكان مكرر">المكان مكرر</option><option value="المكان غير موجود">المكان غير موجود</option><option value="أخرى">أخرى</option></select>' +
        '<label class="form-label" style="font-weight:800">تفاصيل إضافية <span style="font-weight:500;color:var(--text-muted)">(اختياري)</span></label>' +
        '<textarea id="place-data-report-details" class="form-textarea" rows="4" maxlength="1000" placeholder="اكتب التصحيح أو المعلومة التي تعرفها..."></textarea></div>',
      buttons: [
        { label:'🚩 إرسال البلاغ', type:'danger', closeOnClick:false, onClick:async () => {
          const reason=document.getElementById('place-data-report-reason')?.value || 'أخرى';
          const details=document.getElementById('place-data-report-details')?.value || '';
          try {
            const u=getCurrentUser();
            await reportPlaceData({placeId,reason,details,reporterName:u?.name||u?.displayName||'زائر'});
            toast.success('تم استلام البلاغ. شكرًا لمساعدتنا في تحديث الدليل! 🚩');
            modal.close();
          } catch(err) { toast.error(err.message || 'تعذر إرسال البلاغ'); }
        }},
        { label:'إلغاء', type:'ghost', closeOnClick:true }
      ]
    });
  };
}


if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest?.('#btn-report-place-data');
    if (!btn || !window.openPlaceDataReport) return;
    event.preventDefault();
    event.stopPropagation();
    window.openPlaceDataReport({
      placeId: btn.getAttribute('data-place-id'),
      placeName: btn.getAttribute('data-place-name')
    });
  }, { passive: false });
}

function renderOffersSectionHTML(offers, place) {
  if (!offers || offers.length === 0) return '';
  return `
    <section class="info-card" id="place-offers-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-4)">
        <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:6px">
          <span>🏷️</span> العروض والتخفيضات الحالية (${offers.length})
        </h2>
        <a href="offers.html?place=${escAttr(place.slug || place.id)}" class="btn btn-sm btn-outline" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);gap:4px">
          🔍 تصفح كافة عروض المكان ↗
        </a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4)">
        ${offers.map(offer => {
          const discount = offer.discountPercent || calcDiscount(offer.oldPrice, offer.newPrice);
          return `
            <div class="offer-card place-interactive-offer-card" data-offer-id="${escAttr(offer.id || offer._id)}" title="انقر لمشاهدة تفاصيل وطلب العرض">
              <div class="offer-card__image">
                ${offer.imageUrl 
                  ? `<img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" loading="lazy" />` 
                  : `<div style="padding:2rem;text-align:center;font-size:2.5rem;color:var(--text-muted)">🏷️</div>`}
                ${discount > 0 ? `<span class="offer-card__discount-badge">خصم -${discount}%</span>` : ''}
              </div>
              <div class="offer-card__body">
                <h3 class="offer-card__title">${escHtml(offer.title)}</h3>
                ${offer.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-2);line-height:1.5">${escHtml(offer.description)}</p>` : ''}
                <div class="offer-card__price">
                  <span class="offer-card__price-new">${formatPrice(offer.newPrice)}</span>
                  ${offer.oldPrice ? `<span class="offer-card__price-old">${formatPrice(offer.oldPrice)}</span>` : ''}
                </div>
                <div class="offer-card__expiry">⏰ ينتهي: ${formatDateRange(offer.startDate, offer.endDate)}</div>
                <div class="offer-card__cta-btn">
                  <span>👁️ اضغط لمشاهدة تفاصيل وطلب العرض</span>
                  <span>↗</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderProductsSectionHTML(products, place) {
  if (!products || products.length === 0) return '';
  return `
    <section class="info-card" id="place-products-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-4)">
        <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:6px">
          <span>🛍️</span> قائمة المنتجات والأسعار (${products.length})
        </h2>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="chip chip--success" style="font-size:11px">موثق ✓</span>
          <a href="products.html?place=${escAttr(place.slug || place.id)}" class="btn btn-sm btn-outline" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);gap:4px">
            🔍 تصفح كافة منتجات المكان ↗
          </a>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4)">
        ${products.map(p => `
          <div class="product-card place-interactive-product-card" data-product-id="${escAttr(p.id)}" title="انقر لمشاهدة تفاصيل وطلب المنتج">
            <div class="product-card__image">
              ${p.imageUrl ? `<img src="${escAttr(p.imageUrl)}" alt="${escAttr(p.name)}" loading="lazy" />` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:var(--text-muted)">📦</div>`}
              ${p.isFeatured ? `<span class="product-card__featured">مميز ⭐</span>` : ''}
            </div>
            <div class="product-card__body">
              <h3 class="product-card__name" style="font-size:1.05rem;font-weight:700">${escHtml(p.name)}</h3>
              ${p.category ? `<div style="font-size:11px;color:var(--primary);margin-bottom:4px;font-weight:600">🏷️ ${escHtml(p.category)}</div>` : ''}
              ${p.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escHtml(p.description)}</p>` : ''}
              <div class="product-card__price" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span class="product-card__price-current">${formatPrice(p.price)}</span>
                ${p.oldPrice ? `<span class="product-card__price-old">${formatPrice(p.oldPrice)}</span>` : ''}
                ${p.oldPrice && Number(p.oldPrice) > Number(p.price) ? `
                  <span class="badge" style="background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;font-size:10.5px;font-weight:800;padding:2px 6px;border-radius:4px;margin-right:auto">
                    وفرت ${formatPrice(Number(p.oldPrice) - Number(p.price))}
                  </span>
                ` : ''}
              </div>
              <div class="product-card__cta-btn">
                <span>🛍️ اضغط لتفاصيل وطلب المنتج</span>
                <span>↗</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function bindOffersEvents(offers, place) {
  document.querySelectorAll('.place-interactive-offer-card').forEach(card => {
    card.addEventListener('click', () => {
      const oId = card.getAttribute('data-offer-id');
      const targetOffer = (offers || []).find(o => (o.id || o._id) === oId);
      if (targetOffer) {
        openOfferFullDetailsModal(targetOffer, place);
      }
    });
  });
}

function bindProductsEvents(products, place) {
  document.querySelectorAll('.place-interactive-product-card').forEach(card => {
    card.addEventListener('click', () => {
      const pId = card.getAttribute('data-product-id');
      const targetProduct = (products || []).find(p => p.id === pId);
      if (targetProduct) {
        openProductFullDetailsModal(targetProduct, place);
      }
    });
  });
}

function bindReviewsEvents(place, currentUser, safeReviews, userReview, $container, slug) {
  // Login to review
  document.getElementById('btn-login-to-review')?.addEventListener('click', async () => {
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        renderPlacePage($container, { slug, user: loggedUser, initialPlace: place });
      }
    } catch (err) {
      toast.error('تعذر تسجيل الدخول: ' + err.message);
    }
  });

  // Open Add / Edit Review Modal
  document.getElementById('btn-open-review-modal')?.addEventListener('click', () => {
    openReviewModal(place, currentUser, userReview, () => {
      renderPlacePage($container, { slug, user: currentUser, initialPlace: place });
    });
  });

  // Event delegation on reviewsList for edit & delete buttons
  const reviewsList = document.getElementById('place-reviews-list');
  if (reviewsList) {
    reviewsList.onclick = async (e) => {
      const editBtn = e.target.closest('.btn-edit-review');
      if (editBtn) {
        const rId = editBtn.getAttribute('data-rid');
        const targetReview = (safeReviews || []).find(r => r.id === rId);
        if (targetReview) {
          openReviewModal(place, currentUser, targetReview, () => {
            renderPlacePage($container, { slug, user: currentUser, initialPlace: place });
          });
        }
        return;
      }

      const delBtn = e.target.closest('.btn-delete-review');
      if (delBtn) {
        const rId = delBtn.getAttribute('data-rid');
        const ok = await showConfirm({
          title: 'حذف التقييم',
          message: 'هل أنت متأكد من رغبتك في حذف تقييمك لهذا المكان؟',
          confirmText: 'نعم، حذف',
          cancelText: 'إلغاء'
        });
        if (ok) {
          try {
            await deletePlaceReview(place.id || place._key, rId, currentUser);
            toast.success('تم حذف التقييم');
            renderPlacePage($container, { slug, user: currentUser, initialPlace: place });
          } catch (err) {
            toast.error(err.message || 'فشل حذف التقييم');
          }
        }
        return;
      }
    };
  }

  // Setup Reviews Sentiment Filter Tabs and pagination
  setupReviewsSentimentFilter(place, currentUser, safeReviews, userReview, $container, slug);
}
