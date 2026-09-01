/**
 * LivePulseSection.js
 * Distinguished & Ultra-Animated Live City Pulse Component (يحدث الآن في المنزلة والمطرية)
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
  if (diffSec < 60) return 'منذ ثوانٍ';
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
        
        <!-- Luxury Gradient Header Banner -->
        <div style="background:linear-gradient(135deg,#0B1E30 0%,#1B4F72 60%,#0369A1 100%);border-radius:22px;padding:22px 24px;color:#fff;margin-bottom:18px;box-shadow:0 10px 30px rgba(11,30,48,0.2);border:1.5px solid rgba(245,166,35,0.35);position:relative;overflow:hidden">
          
          <!-- Subtle animated background circle -->
          <div style="position:absolute;top:-40px;left:-40px;width:160px;height:160px;background:rgba(245,166,35,0.12);border-radius:50%;filter:blur(30px);pointer-events:none"></div>
          
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;position:relative;z-index:2">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <div class="live-radar-container">
                  <div class="live-radar-dot"></div>
                  <div class="live-radar-ring"></div>
                  <div class="live-radar-ring ring-2"></div>
                </div>
                <h2 style="font-size:1.45rem;font-weight:900;color:#fff;margin:0;display:flex;align-items:center;gap:8px">
                  <span>المنزلة والمطرية الآن</span>
                  <span class="badge" style="background:#EF4444;color:#fff;font-size:11px;font-weight:900;padding:2px 8px;border-radius:9999px;letter-spacing:0.8px;box-shadow:0 0 10px rgba(239,68,68,0.6)">يحدث الآن</span>
                </h2>
              </div>
              <p style="font-size:13px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5">
                نبض المدينة المباشر: ماكينات ATM الجاهزة، حالة الطرق والازدحام، الافتتاحات، وأقوى العروض الحية
              </p>
            </div>

            <button type="button" id="btn-open-live-report-modal" class="btn btn-shimmer-live" style="border-radius:14px;font-weight:800;padding:10px 22px;color:#fff;font-size:13.5px;display:inline-flex;align-items:center;gap:8px;cursor:pointer">
              <span style="font-size:16px">➕</span>
              <span>شارك خبراً أو حالة الآن</span>
            </button>
          </div>

          <!-- Animated Live Filter Pills -->
          <div class="live-pulse-filters" style="display:flex;align-items:center;gap:8px;overflow-x:auto;padding-top:16px;scrollbar-width:none;-webkit-overflow-scrolling:touch">
            <button type="button" class="btn btn-sm live-filter-btn active" data-city="all" data-cat="all" style="border-radius:9999px;font-weight:800;font-size:12px;padding:6px 16px;background:#F5A623;color:#0B1E30;border:none;flex-shrink:0;box-shadow:0 2px 10px rgba(245,166,35,0.4)">
              الكل 🌐
            </button>
            <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="المنزلة" data-cat="all" style="border-radius:9999px;font-weight:700;font-size:12px;padding:6px 16px;color:#fff;border-color:rgba(255,255,255,0.3);flex-shrink:0">
              📍 المنزلة
            </button>
            <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="المطرية" data-cat="all" style="border-radius:9999px;font-weight:700;font-size:12px;padding:6px 16px;color:#fff;border-color:rgba(255,255,255,0.3);flex-shrink:0">
              🌊 المطرية
            </button>
            <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="all" data-cat="atm" style="border-radius:9999px;font-weight:700;font-size:12px;padding:6px 16px;color:#fff;border-color:rgba(255,255,255,0.3);flex-shrink:0">
              🏧 ماكينات ATM
            </button>
            <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="all" data-cat="traffic" style="border-radius:9999px;font-weight:700;font-size:12px;padding:6px 16px;color:#fff;border-color:rgba(255,255,255,0.3);flex-shrink:0">
              🚧 الطرق والمرور
            </button>
            <button type="button" class="btn btn-sm btn-outline live-filter-btn" data-city="all" data-cat="offers" style="border-radius:9999px;font-weight:700;font-size:12px;padding:6px 16px;color:#fff;border-color:rgba(255,255,255,0.3);flex-shrink:0">
              🛒 عروض وتخفيضات
            </button>
          </div>

        </div>

        <!-- Live Cards Grid -->
        <div id="live-pulse-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(290px, 1fr));gap:16px">
          <div class="skeleton" style="height:170px;border-radius:18px"></div>
          <div class="skeleton" style="height:170px;border-radius:18px"></div>
          <div class="skeleton" style="height:170px;border-radius:18px"></div>
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
        <div style="grid-column:1/-1;text-align:center;padding:3rem 1.5rem;background:var(--surface,#fff);border-radius:20px;border:1.5px dashed var(--border,#e2e8f0);box-shadow:0 4px 20px rgba(0,0,0,0.02)">
          <div style="font-size:2.8rem;margin-bottom:10px;animation:pulseLive 1.5s infinite">🔥</div>
          <h3 style="font-size:16px;font-weight:800;color:var(--text-primary,#0F2B48);margin:0 0 6px 0">لا توجد تحديثات مسجلة في هذا القسم حالياً</h3>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">كن أول من يشارك خبراً أو حالة طريق أو ماكينة صراف في المنزلة والمطرية!</p>
          <button type="button" class="btn btn-shimmer-live btn-open-report-trigger" style="border-radius:12px;font-weight:800;padding:8px 20px;color:#fff">
            ➕ شارك خبراً الآن
          </button>
        </div>
      `;
      grid.querySelector('.btn-open-report-trigger')?.addEventListener('click', () => openLiveReportModal(renderNewsCards));
      return;
    }

    grid.innerHTML = newsList.map((item, index) => {
      const cat = NEWS_CATEGORIES[item.category] || NEWS_CATEGORIES.general;
      const tag = STATUS_TAGS[item.statusTagKey] || STATUS_TAGS.active_green;
      const userReaction = item.reactedUsers?.[user?.uid];
      const confirms = item.reactions?.confirm || 0;
      const loves = item.reactions?.love || 0;
      const doubts = item.reactions?.doubt || 0;
      const authorPts = Number(item.userPoints) || 350;
      const authorLvl = getLoyaltyLevelInfo(authorPts).currentLevel;

      return `
        <div class="live-news-card-luxury live-card-stagger" data-news-id="${item.id}" style="animation-delay:${index * 0.07}s">
          <div>
            <!-- Card Top: Category + Status Tag + Live Time -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="badge" style="background:rgba(2,132,199,0.12);color:${cat.color};font-weight:800;font-size:11.5px;padding:4px 10px;border-radius:8px">
                  ${cat.icon} ${cat.label}
                </span>
                <span class="badge" style="background:rgba(16,185,129,0.12);color:${tag.color};font-weight:800;font-size:11.5px;padding:4px 10px;border-radius:8px">
                  ${tag.label}
                </span>
              </div>
              <span style="font-size:11.5px;color:var(--text-muted);font-weight:700;display:flex;align-items:center;gap:4px">
                <span style="color:#10B981">●</span> ${timeAgo(item.createdAt)}
              </span>
            </div>

            <!-- Title -->
            <h3 style="font-size:15px;font-weight:800;color:var(--text-primary,#0F2B48);margin:0 0 6px 0;line-height:1.45">
              ${esc(item.title)}
            </h3>

            <!-- Location -->
            <div style="font-size:12.5px;color:var(--primary,#1B4F72);font-weight:800;display:flex;align-items:center;gap:4px;margin-bottom:8px">
              <span>📍</span>
              <span>${esc(item.location)} (${esc(item.city || 'المنزلة')})</span>
            </div>

            <!-- Details -->
            ${item.details ? `
              <p style="font-size:12.5px;color:var(--text-secondary,#475569);line-height:1.55;margin:0 0 12px 0;background:var(--surface-2,#F8FAFC);padding:10px 12px;border-radius:10px;border:1px solid rgba(0,0,0,0.03)">
                ${esc(item.details)}
              </p>
            ` : ''}
          </div>

          <!-- Bottom: Author + Interactive Reactions -->
          <div style="border-top:1px solid var(--border,#E2E8F0);padding-top:12px;margin-top:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:12px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="color:var(--text-muted)">بواسطة:</span>
                <strong style="color:var(--text-primary)">${esc(item.userName || 'مواطن')}</strong>
                <span class="badge" style="font-size:10px;padding:2px 6px;background:rgba(245,166,35,0.15);color:${authorLvl.color};border-radius:6px;font-weight:800" title="${authorLvl.name}">
                  ${authorLvl.icon} ${authorLvl.name}
                </span>
              </div>
              <div style="font-size:11.5px;color:#059669;font-weight:800;display:flex;align-items:center;gap:4px">
                <span>👥</span>
                <span>${confirms} أكدوا ذلك</span>
              </div>
            </div>

            <!-- Reaction Buttons -->
            <div style="display:flex;align-items:center;gap:8px">
              <button type="button" class="btn btn-xs btn-react-live btn-reaction-pop" data-nid="${item.id}" data-type="confirm" style="flex:1;border-radius:10px;font-weight:800;font-size:12px;padding:6px 10px;background:${userReaction === 'confirm' ? '#10B981' : 'var(--surface-2,#F1F5F9)'};color:${userReaction === 'confirm' ? '#fff' : '#0F2B48'};border:1px solid ${userReaction === 'confirm' ? '#10B981' : 'var(--border,#CBD5E1)'}">
                👍 تأكيد (${confirms})
              </button>
              <button type="button" class="btn btn-xs btn-react-live btn-reaction-pop" data-nid="${item.id}" data-type="love" style="border-radius:10px;font-weight:800;font-size:12px;padding:6px 12px;background:${userReaction === 'love' ? '#EF4444' : 'var(--surface-2,#F1F5F9)'};color:${userReaction === 'love' ? '#fff' : '#0F2B48'};border:1px solid ${userReaction === 'love' ? '#EF4444' : 'var(--border,#CBD5E1)'}">
                ❤️ (${loves})
              </button>
              <button type="button" class="btn btn-xs btn-react-live btn-reaction-pop" data-nid="${item.id}" data-type="doubt" style="border-radius:10px;font-weight:800;font-size:12px;padding:6px 12px;background:${userReaction === 'doubt' ? '#64748B' : 'var(--surface-2,#F1F5F9)'};color:${userReaction === 'doubt' ? '#fff' : '#0F2B48'};border:1px solid ${userReaction === 'doubt' ? '#64748B' : 'var(--border,#CBD5E1)'}" title="غير دقيق">
                👎 (${doubts})
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind Reaction Clicks
    grid.querySelectorAll('.btn-react-live').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = getCurrentUser();
        if (!u) {
          toast.info('يرجى تسجيل الدخول أولاً للتفاعل مع الخبر');
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

  // Tab Listeners with animated styles
  container.querySelectorAll('.live-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.live-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '#fff';
        b.style.boxShadow = '';
      });
      btn.classList.add('active');
      btn.style.background = '#F5A623';
      btn.style.color = '#0B1E30';
      btn.style.boxShadow = '0 2px 10px rgba(245,166,35,0.4)';

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
    title: '🔥 شارك خبراً أو حالة تحدث الآن',
    size: 'md',
    content: `
      <form id="form-submit-live-report" style="display:flex;flex-direction:column;gap:14px" onsubmit="return false">
        
        <div style="background:linear-gradient(135deg,rgba(2,132,199,0.08),rgba(245,166,35,0.08));border:1.5px solid rgba(2,132,199,0.25);border-radius:14px;padding:14px;font-size:13px;color:var(--text-primary);line-height:1.5">
          📢 <strong>مرحباً بك!</strong> ساهم في إفادة أهالي المنزلة والمطرية بآخر التحديثات الحية.
          ${isUserAdmin ? '<div style="color:#059669;font-weight:800;margin-top:6px">👑 بصفتك مشرفاً، سيتم نشر خبرك فوراً على الدليل!</div>' : '<div style="color:#D97706;font-weight:700;margin-top:6px">⏳ يتم مراجعة الأخبار سريعاً من فريق الإدارة واعتمادها فوراً لضمان دقة المعلومات وسيكسبك كل خبر معتمد +20 نقطة ولاء! ⭐</div>'}
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:800">عنوان الخبر / التحديث <span class="required">*</span></label>
          <input type="text" id="live-input-title" class="form-input" placeholder="مثال: ماكينة بنك مصر تعمل الآن / ازدحام عند مدخل الكوبري" required />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:800">المدينة / المركز <span class="required">*</span></label>
            <select id="live-select-city" class="form-select">
              <option value="المنزلة">📍 المنزلة</option>
              <option value="المطرية">🌊 المطرية</option>
              <option value="العصافرة">🌾 العصافرة والقرى المجاورة</option>
            </select>
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:800">التصنيف <span class="required">*</span></label>
            <select id="live-select-category" class="form-select">
              ${Object.entries(NEWS_CATEGORIES).map(([k, c]) => `
                <option value="${k}">${c.icon} ${c.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:800">المكان / الشارع بالتحديد <span class="required">*</span></label>
            <input type="text" id="live-input-location" class="form-input" placeholder="مثال: شارع الجلاء، أمام المحطة" required />
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:800">شارة الحالة <span class="required">*</span></label>
            <select id="live-select-status-tag" class="form-select">
              ${Object.entries(STATUS_TAGS).map(([k, t]) => `
                <option value="${k}">${t.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-weight:800">تفاصيل إضافية توضيحية</label>
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
