/**
 * ServiceRequestsSection.js
 * «طلبات الخدمات» — Privacy-First Live Community Service Requests Feed & Dispatcher
 * يعرض طلبات أهالي المنزلة والمطرية مع خصوصية كاملة للأرقام وزر إضافة طلب فوري
 */

import { fetchServiceRequests } from '../../services/interactive-hub.service.js';
import { openNeedServiceModal } from './NeedServiceModal.js';

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
                  طلبات الخدمات
                </h3>
                <span style="font-size:0.75rem;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);color:#fef08a;padding:2px 10px;border-radius:12px;font-weight:800;display:inline-flex;align-items:center;gap:5px">
                  <span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span>
                  <span>مباشر — استقبال عروض الفنيين</span>
                </span>
              </div>
              <p style="margin:0;font-size:0.88rem;color:#e0e7ff;line-height:1.6">
                محتاج سباك، كهربائي، نجار، صيانة تكييف أو أي خدمة؟ اكتب احتياجك مرة واحدة وسيصلك الفنيون المناسبون فوراً. (رقمك في أمان تام ولا يظهر للعامة).
              </p>
            </div>
          </div>

          <button type="button" class="need-service-cta-btn btn-open-service-request-modal">
            <span style="font-size:1.15rem">➕</span>
            <span>اطلب خدمة / صنايعي الآن</span>
          </button>
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
                <span>طلبات الخدمات الجارية</span>
                <span style="font-size:0.75rem;background:rgba(245,158,11,0.15);color:#d97706;padding:2px 8px;border-radius:10px;font-weight:700">محدث لحظياً</span>
              </h3>
              <p style="margin:2px 0 0;font-size:0.82rem;color:var(--text-muted)">
                تفاعل وقدم عروضك للطلبات المفتوحة بالمنزلة والمطرية
              </p>
            </div>
          </div>

          <button type="button" class="need-service-cta-btn btn-open-service-request-modal" style="padding:8px 18px;font-size:0.88rem">
            <span>➕</span>
            <span>اطلب خدمة الآن</span>
          </button>
        </div>
      ` : ''}

      <!-- Grid of Service Requests -->
      <div class="need-service-grid service-requests-grid-slot">
        <div style="grid-column:1/-1;text-align:center;padding:28px 0;color:var(--text-muted)">
          <span>جاري تحميل طلبات الخدمات...</span>
        </div>
      </div>

      ${isCompact ? `
        <div style="text-align:center;margin-top:14px">
          <a href="now.html" class="btn btn-outline btn-sm" style="border-radius:12px;font-weight:800;padding:8px 20px">
            <span>عرض كافة طلبات الخدمات في صفحة يحدث الآن</span>
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
        <div style="grid-column:1/-1;background:var(--surface-2, #f8fafc);border:1.5px dashed var(--border, #cbd5e1);border-radius:18px;padding:34px 20px;text-align:center">
          <div style="font-size:2.2rem;margin-bottom:8px">🤝</div>
          <p style="margin:0 0 6px;font-weight:800;font-size:1.05rem;color:var(--text-primary)">لا توجد طلبات خدمات مفتوحة حالياً</p>
          <p style="margin:0 0 16px;font-size:0.85rem;color:var(--text-muted);max-width:440px;margin-inline:auto">
            كن أول من يسجل احتياجه (سباكة، كهرباء، صيانة) لتصلك عروض الفنيين والحرفيين المعتمدين فوراً
          </p>
          <button type="button" class="btn btn-primary btn-sm btn-open-service-request-modal" style="border-radius:12px;font-weight:800;padding:8px 20px">
            <span>➕ اطلب خدمة الآن</span>
          </button>
        </div>
      `;

      $grid.querySelector('.btn-open-service-request-modal')?.addEventListener('click', () => {
        openNeedServiceModal(() => loadRequests(container, limit));
      });
      return;
    }

    $grid.innerHTML = requests.map(r => {
      const isClosed = r.status === 'closed';
      const waText = encodeURIComponent(`السلام عليكم، أنا فني بخصوص طلبك على دليل المنزلة والمطرية: "${r.title}" في ${r.village}`);
      const waUrl = !r.isPhoneMasked && r.userPhone 
        ? `https://wa.me/2${r.userPhone.replace(/[^0-9]/g,'')}?text=${waText}` 
        : `https://wa.me/201004128504?text=${waText}`;

      return `
        <article class="need-service-card">
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
            <span><strong>رقم الهاتف:</strong> ${r.userPhone ? 'محمي بالخصوصية' : 'متاح للفنيين المختارين فقط'}</span>
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

  } catch (err) {
    console.error('[ServiceRequestsSection] load error:', err);
    $grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#ef4444;padding:16px">تعذر تحميل طلبات الخدمات حالياً.</div>`;
  }
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
