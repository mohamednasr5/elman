/**
 * LivePulseSection.js
 * Interactive Real-Time City Pulse Component (يحدث الآن في المنزلة والمطرية)
 */

import { getPublishedLiveNews, submitLiveReport, reactToLiveNews, NEWS_CATEGORIES, STATUS_TAGS } from '../../services/live-news.service.js';
import { getCurrentUser, isAdmin } from '../../core/auth.js';
import { getLoyaltyLevelInfo } from '../../services/loyalty.service.js';
import { formatDate } from '../../utils/date.js';
import { showModal } from './Modal.js';
import { toast } from './Toast.js';

function timeAgo(ts) {
  if (!ts) return 'الآن';
  const diffSec = Math.floor((Date.now() - Number(ts)) / 1000);
  if (diffSec < 60) return 'منذ لحظات';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
  return formatDate(ts);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function mountLivePulseSection(containerId) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;

  container.innerHTML = `
    <section class="live-pulse-section" style="margin-bottom:var(--space-8, 2.5rem)">
      <div class="container" style="max-width:1240px;margin:0 auto;padding:0 12px">
        
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <h2 style="font-size:1.4rem;font-weight:800;color:var(--text-primary,#0F2B48);display:flex;align-items:center;gap:8px;margin:0 0 4px 0">
              <span style="display:inline-block;animation:pulseLive 1.5s infinite">🔥</span>
              <span>المنزلة والمطرية الآن (يحدث الآن)</span>
              <span class="badge" style="background:#EF4444;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:9999px;letter-spacing:0.5px">LIVE</span>
            </h2>
            <div style="font-size:12.5px;color:var(--text-muted);margin:0">
              تحديثات حية لحظة بلحظة يشاركها أهالي المدينة: ماكينات الصراف، حالة الطرق، والافتتاحات والعروض
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <button type="button" id="btn-open-live-report-modal" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,#0284C7,#0369A1);border:none;border-radius:12px;font-weight:800;padding:8px 16px;box-shadow:0 4px 14px rgba(2,132,199,0.25);gap:6px">
              <span>➕</span>
              <span>شارك خبراً أو تحديثاً الآن</span>
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="live-pulse-filters" style="display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;scrollbar-width:none">
          <button type="button" class="btn btn-sm live-filter-btn active" data-city="all" data-cat="all" style="border-radius:9999px;font-weight:800;font-size:12px;padding:5px 14px;background:#0F2B48;color:#fff;border:none">
            الكل 🌐
          </button>
          <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="المنزلة" data-cat="all" style="border-radius:9999px;font-weight:700;font-size:12px;padding:5px 14px">
            📍 المنزلة
          </button>
          <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="المطرية" data-cat="all" style="border-radius:9999px;font-weight:700;font-size:12px;padding:5px 14px">
            🌊 المطرية
          </button>
          <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="all" data-cat="atm" style="border-radius:9999px;font-weight:700;font-size:12px;padding:5px 14px">
            🏧 ماكينات ATM
          </button>
          <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="all" data-cat="traffic" style="border-radius:9999px;font-weight:700;font-size:12px;padding:5px 14px">
            🚧 الطرق والمرور
          </button>
          <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="all" data-cat="offers" style="border-radius:9999px;font-weight:700;font-size:12px;padding:5px 14px">
            🛒 عروض حية
          </button>
        </div>

        <!-- Live Cards Grid -->
        <div id="live-pulse-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:14px">
          <div class="skeleton" style="height:160px;border-radius:16px"></div>
          <div class="skeleton" style="height:160px;border-radius:16px"></div>
          <div class="skeleton" style="height:160px;border-radius:16px"></div>
        </div>

      </div>
    </section>
  `;

  let activeCity = 'all';
  let activeCat = 'all';

  async function renderNewsCards() {
    const grid = document.getElementById('live-pulse-cards-grid');
    if (!grid) return;

    const newsList = await getPublishedLiveNews({ city: activeCity, category: activeCat, limit: 12 });
    const user = getCurrentUser();

    if (!newsList.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2.5rem;background:var(--surface,#fff);border-radius:16px;border:1px solid var(--border,#e2e8f0)">
          <div style="font-size:2.5rem;margin-bottom:8px">🔥</div>
          <h3 style="font-size:15px;font-weight:700;margin:0 0 6px 0">لا توجد أخبار مسجلة في هذا القسم حالياً</h3>
          <p style="font-size:12.5px;color:var(--text-muted);margin:0 0 14px 0">كن أول من يشارك خبراً أو حالة طريق أو ماكينة صراف!</p>
          <button type="button" class="btn btn-sm btn-primary btn-open-report-trigger" style="border-radius:10px;font-weight:800">
            ➕ شارك خبراً الآن
          </button>
        </div>
      `;
      grid.querySelector('.btn-open-report-trigger')?.addEventListener('click', () => openLiveReportModal(renderNewsCards));
      return;
    }

    grid.innerHTML = newsList.map(item => {
      const cat = NEWS_CATEGORIES[item.category] || NEWS_CATEGORIES.general;
      const tag = STATUS_TAGS[item.statusTagKey] || STATUS_TAGS.active_green;
      const userReaction = item.reactedUsers?.[user?.uid];
      const confirms = item.reactions?.confirm || 0;
      const loves = item.reactions?.love || 0;
      const doubts = item.reactions?.doubt || 0;
      const authorPts = Number(item.userPoints) || 350;
      const authorLvl = getLoyaltyLevelInfo(authorPts).currentLevel;

      return `
        <div class="live-news-card" data-news-id="${item.id}" style="background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:16px;padding:16px;box-shadow:0 3px 15px rgba(0,0,0,0.04);display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.2s,box-shadow 0.2s">
          <div>
            <!-- Card Top: Category + Status Tag + Time -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="badge" style="background:rgba(2,132,199,0.1);color:${cat.color};font-weight:800;font-size:11px;padding:3px 8px;border-radius:6px">
                  ${cat.icon} ${cat.label}
                </span>
                <span class="badge" style="background:rgba(16,185,129,0.1);color:${tag.color};font-weight:800;font-size:11px;padding:3px 8px;border-radius:6px">
                  ${tag.label}
                </span>
              </div>
              <span style="font-size:11px;color:var(--text-muted);font-weight:600">
                🕒 ${timeAgo(item.createdAt)}
              </span>
            </div>

            <!-- Title -->
            <h3 style="font-size:14.5px;font-weight:800;color:var(--text-primary,#0F2B48);margin:0 0 6px 0;line-height:1.4">
              ${esc(item.title)}
            </h3>

            <!-- Location -->
            <div style="font-size:12px;color:var(--primary,#1B4F72);font-weight:700;display:flex;align-items:center;gap:4px;margin-bottom:8px">
              <span>📍</span>
              <span>${esc(item.location)} (${esc(item.city || 'المنزلة')})</span>
            </div>

            <!-- Details -->
            ${item.details ? `
              <p style="font-size:12.5px;color:var(--text-secondary,#475569);line-height:1.5;margin:0 0 12px 0;background:var(--surface-2,#f8fafc);padding:8px 10px;border-radius:8px">
                ${esc(item.details)}
              </p>
            ` : ''}
          </div>

          <!-- Bottom: Author + Interactive Reactions -->
          <div style="border-top:1px solid var(--border,#e2e8f0);padding-top:10px;margin-top:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:11.5px">
              <div style="display:flex;align-items:center;gap:5px">
                <span style="color:var(--text-muted)">بواسطة:</span>
                <strong style="color:var(--text-primary)">${esc(item.userName || 'مواطن')}</strong>
                <span class="badge" style="font-size:9.5px;padding:1px 5px;background:rgba(245,166,35,0.15);color:${authorLvl.color};border-radius:4px;font-weight:800">
                  ${authorLvl.icon}
                </span>
              </div>
              <div style="font-size:11px;color:#059669;font-weight:700">
                👥 ${confirms} شخصًا أكدوا ذلك
              </div>
            </div>

            <!-- Reaction Buttons -->
            <div style="display:flex;align-items:center;gap:6px;justify-content:space-between">
              <button type="button" class="btn btn-xs btn-react-live" data-nid="${item.id}" data-type="confirm" style="flex:1;border-radius:8px;font-weight:700;font-size:11.5px;padding:5px 8px;background:${userReaction === 'confirm' ? '#10B981' : 'var(--surface-2,#f1f5f9)'};color:${userReaction === 'confirm' ? '#fff' : 'inherit'};border:1px solid var(--border,#e2e8f0)">
                👍 تأكيد (${confirms})
              </button>
              <button type="button" class="btn btn-xs btn-react-live" data-nid="${item.id}" data-type="love" style="border-radius:8px;font-weight:700;font-size:11.5px;padding:5px 10px;background:${userReaction === 'love' ? '#EF4444' : 'var(--surface-2,#f1f5f9)'};color:${userReaction === 'love' ? '#fff' : 'inherit'};border:1px solid var(--border,#e2e8f0)">
                ❤️ (${loves})
              </button>
              <button type="button" class="btn btn-xs btn-react-live" data-nid="${item.id}" data-type="doubt" style="border-radius:8px;font-weight:700;font-size:11.5px;padding:5px 10px;background:${userReaction === 'doubt' ? '#64748B' : 'var(--surface-2,#f1f5f9)'};color:${userReaction === 'doubt' ? '#fff' : 'inherit'};border:1px solid var(--border,#e2e8f0)" title="غير دقيق">
                👎 (${doubts})
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind Reactions
    grid.querySelectorAll('.btn-react-live').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = getCurrentUser();
        if (!u) {
          toast.info('يرجى تسجيل الدخول لتأكيد أو التفاعل مع الخبر');
          return;
        }
        const nid = btn.getAttribute('data-nid');
        const type = btn.getAttribute('data-type');
        try {
          await reactToLiveNews(nid, type, u);
          renderNewsCards();
        } catch (err) {
          toast.error(err.message || 'فشل التفاعل');
        }
      });
    });
  }

  // Initial Load
  renderNewsCards();

  // Tab Listeners
  container.querySelectorAll('.live-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.live-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '';
      });
      btn.classList.add('active');
      btn.style.background = '#0F2B48';
      btn.style.color = '#fff';

      activeCity = btn.getAttribute('data-city') || 'all';
      activeCat = btn.getAttribute('data-cat') || 'all';
      renderNewsCards();
    });
  });

  // Open Modal Listener
  document.getElementById('btn-open-live-report-modal')?.addEventListener('click', () => {
    openLiveReportModal(renderNewsCards);
  });
}

/**
 * Modal to Submit a Live Report
 */
export function openLiveReportModal(onSuccessCallback) {
  const user = getCurrentUser();
  if (!user) {
    toast.info('يرجى تسجيل الدخول أولاً للمشاركة في نشر الأخبار والتحديثات الحية');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    }, 1200);
    return;
  }

  const isUserAdmin = isAdmin(user);

  const modal = showModal({
    title: '🔥 شارك خبراً أو تحديثاً يحدث الآن',
    size: 'md',
    content: `
      <form id="form-submit-live-report" style="display:flex;flex-direction:column;gap:14px" onsubmit="return false">
        
        <div style="background:rgba(2,132,199,0.08);border:1px solid rgba(2,132,199,0.25);border-radius:12px;padding:12px;font-size:12.5px;color:var(--text-primary);line-height:1.5">
          📢 <strong>مرحباً بك!</strong> ساهم في إفادة أهالي المنزلة والمطرية بآخر التحديثات الحية.
          ${isUserAdmin ? '<div style="color:#059669;font-weight:700;margin-top:4px">👑 بصفتك مشرفاً، سيتم نشر خبرك فوراً على الدليل!</div>' : '<div style="color:#D97706;font-weight:600;margin-top:4px">⏳ يتم مراجعة الأخبار سريعاً من فريق الإدارة واعتمادها فوراً لضمان دقة المعلومات وسيكسبك كل خبر معتمد +20 نقطة ولاء!</div>'}
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:700">عنوان الخبر / الحدث <span class="required">*</span></label>
          <input type="text" id="live-input-title" class="form-input" placeholder="مثال: ماكينة بنك مصر تعمل الآن / ازدحام عند مدخل الكوبري" required />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">المدينة / المركز <span class="required">*</span></label>
            <select id="live-select-city" class="form-select">
              <option value="المنزلة">📍 المنزلة</option>
              <option value="المطرية">🌊 المطرية</option>
              <option value="العصافرة">🌾 العصافرة والقرى المجاورة</option>
            </select>
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">التصنيف <span class="required">*</span></label>
            <select id="live-select-category" class="form-select">
              ${Object.entries(NEWS_CATEGORIES).map(([k, c]) => `
                <option value="${k}">${c.icon} ${c.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">المكان / الشارع بالتحديد <span class="required">*</span></label>
            <input type="text" id="live-input-location" class="form-input" placeholder="مثال: شارع الجلاء، أمام المحطة" required />
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">شارة الحالة <span class="required">*</span></label>
            <select id="live-select-status-tag" class="form-select">
              ${Object.entries(STATUS_TAGS).map(([k, t]) => `
                <option value="${k}">${t.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:700">تفاصيل إضافية توضيحية</label>
          <textarea id="live-input-details" class="form-textarea" rows="3" placeholder="اكتب تفاصيل أكثر لمساعدة الناس (مثلاً: حالة الطابور، متوفر سحب وإيداع، موعد الانتهاء...)"></textarea>
        </div>

      </form>
    `,
    buttons: [
      {
        label: isUserAdmin ? '🚀 نشر الخبر فوراً' : '📤 إرسال الخبر للمراجعة',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const title = document.getElementById('live-input-title')?.value.trim();
          const location = document.getElementById('live-input-location')?.value.trim();
          const city = document.getElementById('live-select-city')?.value;
          const category = document.getElementById('live-select-category')?.value;
          const statusTagKey = document.getElementById('live-select-status-tag')?.value;
          const details = document.getElementById('live-input-details')?.value.trim();

          if (!title || !location) {
            toast.warning('يرجى ملء عنوان الخبر وتحديد المكان');
            return;
          }

          try {
            const res = await submitLiveReport({
              title,
              location,
              city,
              category,
              statusTagKey,
              details,
              user,
              isAdminUser: isUserAdmin
            });

            if (res.isPublished) {
              toast.success('تم نشر الخبر بنجاح على الدليل! 🔥');
            } else {
              toast.success('تم إرسال خبرك بنجاح! سيتم اعتماده ونشره خلال لحظات وسيربح حسابك نقاط ولاء ⭐');
            }

            modal.close();
            if (onSuccessCallback) onSuccessCallback();
          } catch (err) {
            toast.error(err.message || 'فشل إرسال الخبر');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });
}
