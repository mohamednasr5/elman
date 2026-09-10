/**
 * now.js — المنزلة والمطرية الآن (يحدث الآن)
 * متكامل مع: مين متاح ييجي دلوقتي + محتاج خدمة + نبض المدينة المباشر
 */
import { mountLivePulseSection } from '../components/LivePulseSection.js?v=c1cf1c7c';
import { renderWhoIsAvailableNow } from '../components/WhoIsAvailableNow.js';
import { openNeedServiceModal } from '../components/NeedServiceModal.js';
import { fetchServiceRequests } from '../../services/interactive-hub.service.js';

export async function renderNowPage($container) {
  $container.innerHTML = `
    <div class="container" style="max-width:1240px;margin:0 auto;padding:16px 12px">
      
      <!-- 1. Live Temporary Availability for Craftsmen (مين متاح ييجي دلوقتي؟) -->
      <div id="now-craftsmen-container"></div>

      <!-- 2. Need Service Hero & Feed (محتاج خدمة) -->
      <section class="need-service-hero">
        <div style="max-width:640px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:1.6rem">🛠️</span>
            <h2 style="font-size:1.45rem;font-weight:900;margin:0;color:#fff">
              خدمة «محتاج خدمة» بالمنزلة والمطرية
            </h2>
          </div>
          <p style="margin:0;font-size:0.92rem;color:#e0e7ff;line-height:1.6">
            بدل ما تسأل وتتصل بعشرة، اكتب مشكلتك واحتياجك مرة واحدة. سنصلك بالفنيين المتاحين فوراً، ورقمك في أمان تام لا يظهر علناً.
          </p>
        </div>

        <button type="button" id="btn-open-need-service-modal" class="btn" style="background:#f59e0b;color:#1e1b4b;font-weight:900;border-radius:14px;padding:12px 24px;font-size:1rem;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 6px 20px rgba(245,158,11,0.3)">
          <span>➕</span>
          <span>اطلب خدمة / صنايعي الآن</span>
        </button>
      </section>

      <!-- Live Service Requests Feed -->
      <div style="margin-bottom:2.5rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
            <span>📢</span>
            <span>طلبات الأهالي الجارية</span>
            <span style="font-size:0.75rem;background:var(--surface-2);color:var(--text-secondary);padding:3px 10px;border-radius:12px;border:1px solid var(--border)">محدث لحظياً</span>
          </h3>
          <div style="font-size:0.8rem;color:var(--text-secondary)">
            هل أنت فني أو صاحب مهنة؟ يمكنك التفاعل مع الطلبات المفتوحة
          </div>
        </div>

        <div id="service-requests-feed" class="need-service-grid">
          <div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--text-secondary)">
            جاري تحميل طلبات الخدمات...
          </div>
        </div>
      </div>

      <!-- 3. City Pulse & Community News (نبض المدينة المباشر) -->
      <div id="standalone-live-pulse-container"></div>

    </div>
  `;

  // 1. Mount Live On-Call Craftsmen
  const $craftsmenBox = document.getElementById('now-craftsmen-container');
  if ($craftsmenBox) {
    await renderWhoIsAvailableNow($craftsmenBox);
  }

  // 2. Attach Need Service Modal button
  document.getElementById('btn-open-need-service-modal')?.addEventListener('click', () => {
    openNeedServiceModal(() => loadFeed());
  });

  // 3. Load Requests Feed
  async function loadFeed() {
    const $feed = document.getElementById('service-requests-feed');
    if (!$feed) return;

    try {
      const requests = await fetchServiceRequests({ status: 'open', limit: 12 });
      if (!requests || requests.length === 0) {
        $feed.innerHTML = `
          <div style="grid-column:1/-1;background:var(--surface-2);border:1px dashed var(--border);border-radius:16px;padding:32px;text-align:center">
            <div style="font-size:2rem;margin-bottom:8px">🤝</div>
            <p style="margin:0 0 6px;font-weight:700;font-size:1rem;color:var(--text)">لا توجد طلبات مفتوحة حالياً</p>
            <p style="margin:0;font-size:0.85rem;color:var(--text-secondary)">كن أول من يسجل احتياجه ويصل إليه الفنيون المعتمدون بالمنزلة</p>
          </div>
        `;
        return;
      }

      $feed.innerHTML = requests.map(r => {
        const isClosed = r.status === 'closed';
        const waText = encodeURIComponent(`السلام عليكم، أنا فني بخصوص طلبك على دليل المنزلة: "${r.title}" في ${r.village}`);
        const waUrl = !r.isPhoneMasked && r.userPhone 
          ? `https://wa.me/2${r.userPhone.replace(/[^0-9]/g,'')}?text=${waText}` 
          : `https://wa.me/201004128504?text=${waText}`;

        return `
          <div class="need-service-card">
            <div class="need-service-card-header">
              <span class="need-category-pill">🔧 ${r.category}</span>
              <span class="need-status-pill ${isClosed ? 'need-status-pill--closed' : 'need-status-pill--open'}">
                ${isClosed ? '✓ تم الاتفاق' : '🟢 قيد البحث عن فني'}
              </span>
            </div>

            <h4 class="need-title">${r.title}</h4>

            <div class="need-meta">
              <span class="need-meta-item">📍 <strong>${r.village}</strong></span>
              <span class="need-meta-item">⏰ <strong>${r.timing}</strong></span>
              <span class="need-meta-item">👤 ${r.userName}</span>
            </div>

            ${r.description ? `
              <p class="need-description">${r.description}</p>
            ` : ''}

            <div class="need-privacy-notice">
              <span class="need-privacy-icon">🛡️</span>
              <span><strong>رقم الهاتف:</strong> ${r.userPhone || 'محمي بالخصوصية'} (مشاركة آمنة)</span>
            </div>

            ${!isClosed ? `
              <div style="display:flex;gap:8px;margin-top:auto">
                <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;border-radius:10px;font-weight:700">
                  <span>💬</span>
                  <span>أنا متاح / تقديم عرض</span>
                </a>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('[NowPage] feed error:', err);
      $feed.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#ef4444">تعذر تحميل الطلبات حالياً.</div>`;
    }
  }

  await loadFeed();

  // 4. Mount City Pulse
  mountLivePulseSection('standalone-live-pulse-container');
}
