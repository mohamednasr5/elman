/**
 * WhoIsAvailableNow.js
 * «مين متاح ييجي دلوقتي؟» — Live Temporary Availability for Emergency Craftsmen
 */

import { fetchLiveCraftsmen, toggleCraftsmanLive, voteInteractiveItem, reportInteractiveItem } from '../../services/interactive-hub.service.js';
import { getCurrentUser } from '../../core/auth.js';
import { showModal } from './Modal.js';
import { toast } from './Toast.js';

export async function renderWhoIsAvailableNow($container, options = {}) {
  if (!$container) return;

  $container.innerHTML = `
    <div class="oncall-craftsmen-section">
      <div class="oncall-header">
        <div class="oncall-title-box">
          <div class="oncall-beacon-badge" aria-hidden="true">
            <div class="oncall-beacon-ping"></div>
            <svg class="oncall-beacon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <circle cx="12" cy="12" r="5"></circle>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
              <path d="M12 3a9 9 0 0 1 9 9"></path>
              <path d="M12 12l6 -3"></path>
            </svg>
            <div class="oncall-beacon-dot"></div>
          </div>
          <div>
            <h3 style="margin:0;font-size:1.35rem;font-weight:900;color:#fff;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span>مين متاح ييجي دلوقتي؟</span>
              <span style="font-size:0.75rem;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.5);color:#6ee7b7;padding:2px 10px;border-radius:12px;font-weight:800;display:inline-flex;align-items:center;gap:5px">
                <span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block"></span>
                <span>طوارئ وزيارات فورية — مباشر</span>
              </span>
            </h3>
            <p style="margin:4px 0 0;font-size:0.86rem;color:#bae6fd;line-height:1.5">
              فنيون وحرفيون متاحون للتحرك فوراً إلى قريتك أو منزلك بالمنزلة والمطرية (سباكة، كهرباء، تكييف، صيانة وطوارئ)
            </p>
          </div>
        </div>

        <button type="button" id="btn-toggle-my-craftsman-live" class="btn" style="background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:#fff;border-radius:14px;font-weight:800;padding:10px 20px;border:1px solid rgba(125,211,252,0.4);cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 6px 20px rgba(2,132,199,0.35);transition:all 0.25s ease">
          <span style="font-size:1.15rem">⚡</span>
          <span>أنا صنايعي ومتاح للزيارات الآن</span>
        </button>
      </div>

      <div id="oncall-craftsmen-list" class="oncall-grid">
        <div style="grid-column:1/-1;text-align:center;padding:25px 0;color:#94a3b8">
          <span>جاري تحديث قائمة المتاحين الآن...</span>
        </div>
      </div>
    </div>
  `;

  // Attach button event
  const $toggleBtn = $container.querySelector('#btn-toggle-my-craftsman-live');
  $toggleBtn?.addEventListener('click', () => {
    openCraftsmanLiveToggleModal(() => loadCraftsmen($container));
  });

  await loadCraftsmen($container);
}

async function loadCraftsmen($container) {
  const $list = $container.querySelector('#oncall-craftsmen-list');
  if (!$list) return;

  try {
    const craftsmen = await fetchLiveCraftsmen();

    if (!craftsmen || craftsmen.length === 0) {
      $list.innerHTML = `
        <div style="grid-column:1/-1;background:rgba(255,255,255,0.05);border:1px dashed rgba(255,255,255,0.2);border-radius:16px;padding:24px 18px;text-align:center">
          <div style="font-size:2rem;margin-bottom:6px">⏱️</div>
          <p style="margin:0 0 6px;font-weight:800;color:#f1f5f9;font-size:1.02rem">لا يوجد فنيون في وضع الطوارئ اللحظي في هذه الدقيقة</p>
          <p style="margin:0 0 16px;font-size:0.84rem;color:#94a3b8;max-width:480px;margin-inline:auto;line-height:1.5">
            يمكنك الاتصال المباشر بأمهر الفنيين والحرفيين المسجلين والمعتمدين في دليلك:
          </p>
          
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:16px">
            <a href="search.html?q=سباك" class="btn btn-sm" style="background:rgba(255,255,255,0.1);color:#fff;border-radius:10px;font-size:0.8rem;padding:6px 12px;border:1px solid rgba(255,255,255,0.15)">🪠 سباك</a>
            <a href="search.html?q=كهربائي" class="btn btn-sm" style="background:rgba(255,255,255,0.1);color:#fff;border-radius:10px;font-size:0.8rem;padding:6px 12px;border:1px solid rgba(255,255,255,0.15)">⚡ كهربائي</a>
            <a href="search.html?q=تكييف" class="btn btn-sm" style="background:rgba(255,255,255,0.1);color:#fff;border-radius:10px;font-size:0.8rem;padding:6px 12px;border:1px solid rgba(255,255,255,0.15)">❄️ فني تكييف</a>
            <a href="search.html?q=نجار" class="btn btn-sm" style="background:rgba(255,255,255,0.1);color:#fff;border-radius:10px;font-size:0.8rem;padding:6px 12px;border:1px solid rgba(255,255,255,0.15)">🪚 نجار</a>
            <a href="search.html?q=نقاش" class="btn btn-sm" style="background:rgba(255,255,255,0.1);color:#fff;border-radius:10px;font-size:0.8rem;padding:6px 12px;border:1px solid rgba(255,255,255,0.15)">🎨 نقاش</a>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap">
            <a href="categories.html" class="btn btn-sm" style="background:rgba(2,132,199,0.3);color:#7dd3fc;border:1px solid rgba(2,132,199,0.6);border-radius:12px;font-weight:800;padding:8px 18px">
              <span>تصفح دليل الفنيين والحرفيين المعتمدين ←</span>
            </a>
          </div>
        </div>
      `;
      return;
    }

    $list.innerHTML = craftsmen.map(c => {
      const hoursLeft = Math.floor(c.remainingMinutes / 60);
      const minsLeft = c.remainingMinutes % 60;
      const timeDisplay = hoursLeft > 0 ? `${hoursLeft}س و${minsLeft}د` : `${minsLeft} دقيقة`;
      const villagesStr = Array.isArray(c.coverageVillages) && c.coverageVillages.length > 0 
        ? c.coverageVillages.slice(0, 3).join('، ') + (c.coverageVillages.length > 3 ? '...' : '') 
        : 'المنزلة وقراها';

      const phoneClean = (c.phone || '').replace(/[^0-9+]/g, '');
      const waClean = (c.whatsapp || c.phone || '').replace(/[^0-9]/g, '');
      const waLink = waClean ? `https://wa.me/2${waClean.startsWith('0') ? waClean.slice(1) : waClean}?text=${encodeURIComponent('السلام عليكم، شفتك على دليل المنزلة متاح الآن ومحتاج زيارة فورية')}` : null;

      return `
        <div class="oncall-card" id="craftsman-${c.id || ''}">
          <div class="oncall-card-top">
            <div class="oncall-craftsman-info">
              <h4>${c.craftsmanName}</h4>
              <div class="oncall-craftsman-spec">
                <span>🔧</span>
                <span>${c.professionName}</span>
              </div>
            </div>
            <div class="oncall-countdown-pill" title="ينتهي التوفر التلقائي للحفاظ على المصداقية">
              <span>⏳ متاح:</span>
              <span>${timeDisplay}</span>
            </div>
          </div>

          <div class="oncall-tags">
            <span class="oncall-tag oncall-tag--eta">🚀 وصول: ~${c.etaMinutes} دقيقة</span>
            <span class="oncall-tag oncall-tag--fee">💵 كشفية: ${c.inspectionFee}</span>
            <span class="oncall-tag">📍 يغطي: ${villagesStr}</span>
          </div>

          <div class="oncall-actions">
            ${phoneClean ? `
              <a href="tel:${phoneClean}" class="oncall-btn-call">
                <span>📞</span>
                <span>اتصال فوري</span>
              </a>
            ` : ''}
            ${waLink ? `
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="oncall-btn-whatsapp">
                <span>💬</span>
                <span>واتساب</span>
              </a>
            ` : ''}
            ${c.placeId ? `
              <a href="place.html?id=${encodeURIComponent(c.placeId)}" class="oncall-btn-view" style="display:inline-flex;align-items:center;gap:4px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.08);color:#e2e8f0;text-decoration:none;font-size:0.82rem;font-weight:700;border:1px solid rgba(255,255,255,0.15)">
                <span>👤</span>
                <span>مشاهدة ملفه</span>
              </a>
            ` : ''}
          </div>

          <!-- Interactive Community Reactions: Like, Dislike & Report -->
          <div class="oncall-reactions" style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:12px;gap:6px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px">
              <button type="button" class="btn-live-vote ${c.userVote === 'like' ? 'voted-active' : ''}" data-target-id="${c.id}" data-vote="like" title="إعجاب بالفني" style="background:${c.userVote === 'like' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'};color:${c.userVote === 'like' ? '#34d399' : '#cbd5e1'};border:1px solid ${c.userVote === 'like' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'};border-radius:8px;padding:4px 10px;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;cursor:pointer;transition:all 0.2s">
                <span>👍</span>
                <span class="count-val">${c.likesCount || 0}</span>
              </button>
              <button type="button" class="btn-live-vote ${c.userVote === 'dislike' ? 'voted-active' : ''}" data-target-id="${c.id}" data-vote="dislike" title="عدم إعجاب" style="background:${c.userVote === 'dislike' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'};color:${c.userVote === 'dislike' ? '#f87171' : '#cbd5e1'};border:1px solid ${c.userVote === 'dislike' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'};border-radius:8px;padding:4px 10px;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;cursor:pointer;transition:all 0.2s">
                <span>👎</span>
                <span class="count-val">${c.dislikesCount || 0}</span>
              </button>
            </div>
            <button type="button" class="btn-live-report" data-target-id="${c.id}" data-target-name="${(c.craftsmanName || '').replace(/"/g, '&quot;')}" title="إبلاغ عن شخص غير جاد" style="background:none;border:none;color:#94a3b8;font-size:0.75rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 6px;border-radius:6px;transition:color 0.2s">
              <span>🚩</span>
              <span>إبلاغ عن غير جاد</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach interaction listeners
    $list.querySelectorAll('.btn-live-vote').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const user = getCurrentUser();
        if (!user) {
          toast.info('يجب تسجيل الدخول بحسابك أولاً للتفاعل باللايك والديسلايك');
          return;
        }
        const targetId = btn.getAttribute('data-target-id');
        const voteType = btn.getAttribute('data-vote');
        if (!targetId || !voteType) return;

        btn.disabled = true;
        try {
          const res = await voteInteractiveItem({ targetId, targetType: 'craftsman', voteType });
          if (res?.deleted) {
            toast.warning('تم حذف إعلان هذا الصنايعي فوراً لتجاوزه حد 25 ديسلايك من المجتمع');
            const card = document.getElementById(`craftsman-${targetId}`);
            if (card) {
              card.style.transition = 'all 0.35s ease';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.85)';
              setTimeout(() => card.remove(), 350);
            }
            return;
          }
          if (res?.success) {
            const card = document.getElementById(`craftsman-${targetId}`);
            if (card) {
              const likeBtn = card.querySelector('.btn-live-vote[data-vote="like"]');
              const dislikeBtn = card.querySelector('.btn-live-vote[data-vote="dislike"]');
              if (likeBtn) {
                likeBtn.querySelector('.count-val').textContent = res.likesCount || 0;
                const isL = res.userVote === 'like';
                likeBtn.style.background = isL ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)';
                likeBtn.style.color = isL ? '#34d399' : '#cbd5e1';
                likeBtn.style.borderColor = isL ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)';
              }
              if (dislikeBtn) {
                dislikeBtn.querySelector('.count-val').textContent = res.dislikesCount || 0;
                const isD = res.userVote === 'dislike';
                dislikeBtn.style.background = isD ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)';
                dislikeBtn.style.color = isD ? '#f87171' : '#cbd5e1';
                dislikeBtn.style.borderColor = isD ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)';
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

    $list.querySelectorAll('.btn-live-report').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const user = getCurrentUser();
        if (!user) {
          toast.info('يجب تسجيل الدخول بحسابك أولاً لتقديم بلاغ');
          return;
        }
        const targetId = btn.getAttribute('data-target-id');
        const targetName = btn.getAttribute('data-target-name') || 'هذا الفني';
        if (!targetId) return;

        const reason = prompt(`إبلاغ عن عدم الجدية بخصوص (${targetName}):\nاكتب سبب الإبلاغ باختصار (مثال: شخص غير جاد، لم يرد على الهاتف، بيانات مضللة):`, 'شخص غير جاد');
        if (reason === null) return;

        btn.disabled = true;
        try {
          const res = await reportInteractiveItem({ targetId, targetType: 'craftsman', reason: reason.trim() || 'شخص غير جاد' });
          if (res?.success) {
            toast.success(res.message || 'تم تسجيل البلاغ وسيتولى فريق الإدارة مراجعته');
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
    console.error('[WhoIsAvailableNow] load error:', err);
    $list.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#ef4444">تعذر تحميل القائمة حالياً.</div>`;
  }
}

export function openCraftsmanLiveToggleModal(onSuccess) {
  const user = getCurrentUser();

  showModal({
    title: 'تفعيل التوفر المؤقت (متاح ييجي دلوقتي)',
    size: 'md',
    content: `
      <form id="craftsman-live-form" style="display:flex;flex-direction:column;gap:14px;text-align:right">
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:12px;font-size:0.82rem;color:#0369a1;line-height:1.5">
          ℹ️ تفعيل هذه الميزة يضع اسمك ورقاقك في أعلى المنصة كفني مستعد للطوارئ فوراً. تنتهي الحالة تلقائياً بعد مرور الساعات المحددة لضمان الشفافية.
        </div>

        <div>
          <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">اسمك أو اسم الورشة *</label>
          <input type="text" id="live-craftsman-name" required class="form-control" placeholder="مثال: فني محمد السعيد" value="${user?.name || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
        </div>

        <div>
          <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">التخصص والنشاط / المهنة الحرة *</label>
          <input 
            type="text" 
            id="live-profession-name" 
            list="craft-professions-list" 
            required 
            class="form-control" 
            placeholder="اكتب مهنتك ونشاطك بدقة (مثال: سباك منازل، فني ألوميتال، نجار موبيليا، مبلط سيراميك...)" 
            style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1;font-size:0.9rem" 
            autocomplete="off"
          />
          <datalist id="craft-professions-list">
            <option value="سباكة وصحي منازل وطوارئ">
            <option value="كهربائي منازل وتوصيلات">
            <option value="تكييف وأجهزة تبريد">
            <option value="صيانة أجهزة منزلية وغسالات">
            <option value="نجارة موبيليا وأقفال أبواب">
            <option value="نقاش ودهانات وديكور حديث">
            <option value="مبلط وسيراميك وبورسلين">
            <option value="فني ألوميتال ومطابخ وشبابيك">
            <option value="حداد وكريتال وأبواب حديد">
            <option value="صنايعي جبس بورد وأسقف معلقة">
            <option value="فني دش ورسيفر وكاميرات مراقبة">
            <option value="طوارئ كاوتش وبطاريات متنقل">
            <option value="ونش إنقاذ وسحب سيارات">
            <option value="ميكانيكي سيارات متنقل">
            <option value="كهربائي سيارات وطوارئ طريق">
            <option value="فني صيانة موتوسيكلات وتروسيكلات">
            <option value="منجد وستائر ومفروشات">
            <option value="أعمال عزل أسطح وخزانات">
            <option value="فني زجاج ومرايا">
            <option value="بناء ومحارة وترميمات">
          </datalist>
          <span style="font-size:0.75rem;color:#64748b;margin-top:4px;display:block">💡 يمكنك اختيار مهنة من المقترحات أو كتابة مهنتك ونشاطك الحر بأسلوبك.</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">مدة التوفر الآن *</label>
            <select id="live-hours" class="form-control" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1">
              <option value="2">ساعتان (2 ساعة)</option>
              <option value="4" selected>4 ساعات</option>
              <option value="8">8 ساعات (اليوم كاملاً)</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">وقت الوصول التقديري</label>
            <select id="live-eta" class="form-control" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1">
              <option value="20">20 دقيقة</option>
              <option value="35" selected>30 - 40 دقيقة</option>
              <option value="60">ساعة واحدة</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">رقم الهاتف للاتصال *</label>
            <input type="tel" id="live-phone" required class="form-control" placeholder="01xxxxxxxxx" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
          </div>
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">تكلفة المعاينة/الكشف</label>
            <input type="text" id="live-fee" class="form-control" placeholder="مثال: 50 جنيه أو حسب الاتفاق" value="حسب الاتفاق" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
          </div>
        </div>

        <div>
          <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">القرى والمناطق التي تستطيع التوجه إليها</label>
          <input type="text" id="live-villages" class="form-control" placeholder="مثال: المنزلة، البصراط، العزيزة، العصافرة" value="المنزلة، العزيزة، البصراط" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
        </div>

        <div style="display:flex;gap:10px;margin-top:10px">
          <button type="submit" id="btn-submit-live" class="btn btn-primary" style="flex:2;padding:12px;border-radius:10px;font-weight:800">
            🟢 تفعيل وضعي كمتاح الآن
          </button>
        </div>
      </form>
    `
  });

  const form = document.getElementById('craftsman-live-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-live');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري التفعيل...'; }

    const name = document.getElementById('live-craftsman-name')?.value.trim();
    const profession = document.getElementById('live-profession-name')?.value;
    const hours = Number(document.getElementById('live-hours')?.value || 4);
    const eta = Number(document.getElementById('live-eta')?.value || 30);
    const phone = document.getElementById('live-phone')?.value.trim();
    const fee = document.getElementById('live-fee')?.value.trim();
    const villages = (document.getElementById('live-villages')?.value || '')
      .split(/[,،]/)
      .map(v => v.trim())
      .filter(Boolean);

    try {
      const res = await toggleCraftsmanLive({
        craftsmanName: name,
        professionId: 'craftsman_' + Date.now(),
        professionName: profession,
        hoursAvailable: hours,
        etaMinutes: eta,
        phone,
        inspectionFee: fee,
        coverageVillages: villages.length > 0 ? villages : ['المنزلة'],
        isAvailable: true
      });

      if (res?.success) {
        toast.success(res.message || 'تم تفعيل توفرك بنجاح!');
        document.querySelector('.modal-overlay')?.remove();
        if (typeof onSuccess === 'function') onSuccess();
      } else {
        toast.error(res?.error || 'فشل تفعيل الحالة');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🟢 تفعيل وضعي كمتاح الآن'; }
    }
  });
}
