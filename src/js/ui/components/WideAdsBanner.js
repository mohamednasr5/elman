/**
 * WideAdsBanner — responsive site-wide 1:1 advertisement banner.
 * Features:
 * - Prioritizes dedicated 1:1 wide_strip ads configured in Admin Dashboard
 * - High-end animated shimmering gloss / light sweep (لامعة انيميشن متحركة)
 * - True 1:1 aspect ratio cards with smooth hover lift
 * - Mobile responsive horizontal snap-scroll
 * - Real-time click tracking
 */
import { getAds } from '../../core/db.js';
import { WORKER_URL } from '../../core/firebase.js';

const timers = new WeakMap();

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function esc(v) {
  return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function injectStylesOnce() {
  if (document.getElementById('wide-ads-banner-styles')) return;
  const style = document.createElement('style');
  style.id = 'wide-ads-banner-styles';
  style.textContent = `
    .wide-ads-banner-wrap {
      width: 100%;
      margin: 14px 0 22px;
      direction: rtl;
    }
    .wide-ads-banner-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .wide-ads-banner-title {
      font-size: 14.5px;
      font-weight: 900;
      color: var(--text-primary, #0f273d);
      white-space: nowrap;
      letter-spacing: -0.2px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .wide-ads-banner-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #F59E0B;
      box-shadow: 0 0 10px #F59E0B;
      animation: wideAdDotPulse 2s ease-in-out infinite;
    }
    @keyframes wideAdDotPulse {
      0%, 100% { transform: scale(1); opacity: 0.85; }
      50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 14px #F59E0B; }
    }
    .wide-ads-banner-line {
      height: 1.5px;
      flex: 1;
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.45) 0%, rgba(15, 39, 61, 0.07) 100%);
      border-radius: 2px;
    }
    .wide-ads-banner-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
    }
    .wide-ad-card {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      border-radius: 16px;
      background: #0B132B;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
      text-decoration: none;
      isolation: isolate;
      cursor: pointer;
    }
    .wide-ad-card:hover {
      transform: translateY(-5px) scale(1.025);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
      border-color: rgba(245, 158, 11, 0.7);
    }
    .wide-ad-card:active {
      transform: translateY(-2px) scale(1.01);
    }
    .wide-ad-img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.45s ease;
    }
    .wide-ad-card:hover .wide-ad-img {
      transform: scale(1.06);
    }

    /* ── Shimmer / Gloss Light Sweep Animation (اللمعة المتحركة) ── */
    .wide-ad-shimmer {
      position: absolute;
      top: -80%;
      left: -100%;
      width: 65%;
      height: 260%;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.08) 25%,
        rgba(255, 255, 255, 0.75) 50%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: rotate(26deg);
      pointer-events: none;
      animation: wideAdShine 3.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: calc(var(--ad-index, 0) * 0.45s);
      z-index: 2;
    }
    @keyframes wideAdShine {
      0% {
        transform: translateX(-160%) rotate(26deg);
        opacity: 0;
      }
      12% {
        opacity: 1;
      }
      38% {
        transform: translateX(360%) rotate(26deg);
        opacity: 0.9;
      }
      100% {
        transform: translateX(360%) rotate(26deg);
        opacity: 0;
      }
    }

    /* ── Luxury Badge on Square Ads ── */
    .wide-ad-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      display: inline-flex;
      align-items: center;
      gap: 3.5px;
      padding: 3px 8px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.8);
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45), 0 0 8px rgba(245, 158, 11, 0.35);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 4;
      pointer-events: none;
      user-select: none;
    }
    .wide-ad-badge-star {
      font-size: 10.5px;
      line-height: 1;
    }

    /* ── Mobile Horizontal Snap-Scroll ── */
    @media (max-width: 640px) {
      .wide-ads-banner-grid {
        display: flex !important;
        overflow-x: auto !important;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;
        gap: 10px !important;
      }
      .wide-ads-banner-grid::-webkit-scrollbar {
        height: 4px;
      }
      .wide-ads-banner-grid::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.18);
        border-radius: 4px;
      }
      .wide-ad-card {
        flex: 0 0 135px !important;
        scroll-snap-align: start;
        border-radius: 14px;
      }
    }
  `;
  document.head.appendChild(style);
}

const DEFAULT_FALLBACK_AD = {
  id: 'default-wide-strip-ad',
  title: 'مساحة إعلانية - أعلن هنا',
  imageUrl: '/assets/images/default-ad-square.webp',
  link: 'https://dalilmanzala.com/contact.html',
  placement: 'wide_strip',
  isDefault: true
};

export async function mountWideAdsBanner(target = 'wide-ads-banner') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  injectStylesOnce();

  try {
    const all = await getAds('');
    const now = Date.now();
    const active = (all || [])
      .filter(a => a && a.isActive !== false && Number(a.is_active ?? 1) !== 0)
      .filter(a => !a.startDate || Number(a.startDate) <= now)
      .filter(a => !a.endDate || Number(a.endDate) > now)
      .filter(a => a.imageUrl && a.link);

    // Prioritize dedicated 1:1 wide_strip ads configured in Admin Dashboard
    const wideStripAds = active.filter(a => a.placement === 'wide_strip');
    let pool = wideStripAds.length > 0 ? [...wideStripAds] : [...active];

    const hasRealAds = pool.length > 0;

    // If no ads exist, or fewer than 5, use the default fallback ad with user's image and contact link
    if (!hasRealAds) {
      pool = Array.from({ length: 5 }, (_, idx) => ({
        ...DEFAULT_FALLBACK_AD,
        id: `default-ad-${idx + 1}`
      }));
    } else if (pool.length < 5) {
      const fillCount = 5 - pool.length;
      for (let i = 0; i < fillCount; i++) {
        pool.push({
          ...DEFAULT_FALLBACK_AD,
          id: `default-ad-${i + 1}`
        });
      }
    }

    container.hidden = false;
    if (timers.has(container)) clearInterval(timers.get(container));

    let ordered = pool.length > 5 ? shuffle(pool) : [...pool];
    let groupIndex = 0;

    const render = () => {
      const groupCount = Math.ceil(ordered.length / 5);
      const start = (groupIndex % groupCount) * 5;
      const group = ordered.slice(start, start + 5);

      container.innerHTML = `
        <section aria-label="إعلانات الموقع" class="wide-ads-banner-wrap">
          <div class="wide-ads-banner-header">
            <strong class="wide-ads-banner-title">
              <span class="wide-ads-banner-dot" aria-hidden="true"></span>
              إعلانك هنا يحقق أهدافك
            </strong>
            <span class="wide-ads-banner-line" aria-hidden="true"></span>
          </div>
          <div class="wide-ads-banner-grid">
            ${group.map((ad, idx) => `
              <a href="${esc(ad.link || DEFAULT_FALLBACK_AD.link)}" target="_blank" rel="noopener noreferrer ${ad.isDefault ? '' : 'sponsored'}" aria-label="${esc(ad.title || 'مساحة إعلانية')}"
                 class="wide-ad-card" data-ad-id="${esc(ad.id || ad._id || '')}"
                 style="--ad-index: ${idx}">
                <span class="wide-ad-badge" aria-label="${ad.isDefault ? 'مساحة إعلانية' : 'إعلان مميز'}">
                  <span class="wide-ad-badge-star" aria-hidden="true">${ad.isDefault ? '📢' : '⭐'}</span>
                  <span>${ad.isDefault ? 'أعلن هنا' : 'مميز'}</span>
                </span>
                <img src="${esc(ad.imageUrl || DEFAULT_FALLBACK_AD.imageUrl)}" alt="${esc(ad.title || 'إعلان')}" loading="lazy" decoding="async"
                     class="wide-ad-img"
                     onerror="if(this.src!=='${DEFAULT_FALLBACK_AD.imageUrl}'){this.src='${DEFAULT_FALLBACK_AD.imageUrl}';}else{this.closest('a')?.remove();}">
                <span class="wide-ad-shimmer" aria-hidden="true"></span>
              </a>`).join('')}
          </div>
        </section>`;

      // Click tracking (skip for default ads)
      container.querySelectorAll('.wide-ad-card').forEach(link => {
        link.addEventListener('click', () => {
          const adId = link.getAttribute('data-ad-id');
          if (adId && !adId.startsWith('default-') && WORKER_URL) {
            try {
              fetch(`${WORKER_URL}/api/ads/track-click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: adId }),
                keepalive: true
              }).catch(() => {});
            } catch (_) {}
          }
        });
      });
    };

    render();

    if (hasRealAds && ordered.length > 5) {
      const timer = setInterval(() => {
        ordered = shuffle(pool);
        groupIndex = (groupIndex + 1) % Math.ceil(ordered.length / 5);
        render();
      }, 45000);
      timers.set(container, timer);
    }
  } catch (err) {
    container.hidden = true;
    console.warn('[WideAdsBanner] failed:', err);
  }
}
