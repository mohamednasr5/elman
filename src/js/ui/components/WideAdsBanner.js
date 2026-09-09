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
    const pool = wideStripAds.length > 0 ? wideStripAds : active;

    if (!pool.length) {
      container.hidden = true;
      return;
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
          <div class="wide-ads-banner-grid" style="${group.length < 5 ? `grid-template-columns: repeat(${group.length}, minmax(0, 1fr))` : ''}">
            ${group.map((ad, idx) => `
              <a href="${esc(ad.link)}" target="_blank" rel="noopener noreferrer sponsored" aria-label="${esc(ad.title || 'إعلان')}"
                 class="wide-ad-card" data-ad-id="${esc(ad.id || ad._id || '')}"
                 style="--ad-index: ${idx}">
                <img src="${esc(ad.imageUrl)}" alt="${esc(ad.title || 'إعلان')}" loading="lazy" decoding="async"
                     class="wide-ad-img"
                     onerror="this.closest('a')?.remove()">
                <span class="wide-ad-shimmer" aria-hidden="true"></span>
              </a>`).join('')}
          </div>
        </section>`;

      // Click tracking
      container.querySelectorAll('.wide-ad-card').forEach(link => {
        link.addEventListener('click', () => {
          const adId = link.getAttribute('data-ad-id');
          if (adId && WORKER_URL) {
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

    if (ordered.length > 5) {
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
