/**
 * now.js — المنزلة والمطرية الآن (يحدث الآن)
 * يجمع حصرياً بين: «مين متاح دلوقتي» (طوارئ الحرفيين) + «طلبات الخدمات» (طلبات أهالي المدينة)
 */

import { renderWhoIsAvailableNow } from '../components/WhoIsAvailableNow.js';
import { renderServiceRequestsSection } from '../components/ServiceRequestsSection.js';
import { openNeedServiceModal } from '../components/NeedServiceModal.js';

export async function renderNowPage($container) {
  $container.innerHTML = `
    <div class="container" style="max-width:1240px;margin:0 auto;padding:16px 12px">
      
      <!-- Luxury Hero Banner for "طلبات أهالينا" -->
      <div class="now-hero-banner" style="background:linear-gradient(135deg,#0B192C 0%,#1E3E62 60%,#0077FF 100%);border-radius:24px;padding:28px 24px;margin-bottom:24px;color:#fff;box-shadow:0 12px 36px rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px">
        <div style="max-width:720px">
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#FCD34D;padding:4px 14px;border-radius:9999px;font-size:12px;font-weight:800;margin-bottom:12px">
            <span>🤝 خدمة تفاعلية مباشرة لأهالي المنزلة والمطرية</span>
          </div>
          <h1 style="font-size:clamp(1.5rem, 3.2vw, 2.1rem);font-weight:900;margin:0 0 8px;color:#FFFFFF;line-height:1.3">
            طلبات أهالينا — مين فاضي ييجي وطلبات الخدمات
          </h1>
          <p style="margin:0;font-size:14px;color:#E2E8F0;line-height:1.7">
            منصة أهالينا المركزية: تواصل فوري مع الفنيين المستعدين للتحرك الفوري إلى منزلك (مين فاضي ييجي؟)، أو اكتب طلبك واحتياجك لأي صنايعي وتلق عروض الفنيين مباشرة.
          </p>
          
          <!-- Quick Sub-navigation anchor pills -->
          <div style="display:flex;align-items:center;gap:10px;margin-top:16px;flex-wrap:wrap">
            <a href="#now-craftsmen-container" class="btn btn-sm" style="background:rgba(255,255,255,0.18);color:#fff;border-radius:12px;font-weight:800;font-size:13px;border:1px solid rgba(255,255,255,0.3);text-decoration:none">
              <span>⚡ مين متاح ييجي دلوقتي؟</span>
            </a>
            <a href="#now-service-requests-container" class="btn btn-sm" style="background:rgba(255,255,255,0.18);color:#fff;border-radius:12px;font-weight:800;font-size:13px;border:1px solid rgba(255,255,255,0.3);text-decoration:none">
              <span>📢 طلبات الخدمات الجارية</span>
            </a>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <button type="button" class="btn btn-primary btn-open-now-service-modal" style="border-radius:14px;font-weight:800;padding:12px 24px;font-size:14.5px;box-shadow:0 4px 18px rgba(0,119,255,0.45);display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0077FF 0%,#0099FF 100%)">
            <span>➕ اطلب صنايعي أو خدمة الآن</span>
          </button>
        </div>
      </div>

      <!-- 1. Live Temporary Availability for Craftsmen (مين فاضي ييجي دلوقتي؟) -->
      <div id="now-craftsmen-container"></div>

      <!-- 2. Community Service Requests Feed (طلبات أهالينا الجارية) -->
      <div id="now-service-requests-container" style="margin-top:2rem"></div>

    </div>
  `;

  // Attach modal trigger for top banner button
  $container.querySelector('.btn-open-now-service-modal')?.addEventListener('click', () => {
    openNeedServiceModal(() => {
      const $serviceRequestsBox = document.getElementById('now-service-requests-container');
      if ($serviceRequestsBox) {
        renderServiceRequestsSection($serviceRequestsBox, { limit: 16, showHero: true, isCompact: false });
      }
    });
  });

  // 1. Mount Live On-Call Craftsmen
  const $craftsmenBox = document.getElementById('now-craftsmen-container');
  if ($craftsmenBox) {
    await renderWhoIsAvailableNow($craftsmenBox);
  }

  // 2. Mount Service Requests Section (full feed with hero banner)
  const $serviceRequestsBox = document.getElementById('now-service-requests-container');
  if ($serviceRequestsBox) {
    await renderServiceRequestsSection($serviceRequestsBox, { limit: 16, showHero: true, isCompact: false });
  }

  // 3. Smooth scroll and highlight target from URL hash (e.g. #req-... or #craftsman-...)
  if (window.location.hash) {
    setTimeout(() => {
      try {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.style.transition = 'all 0.4s ease';
          target.style.boxShadow = '0 0 0 4px #0284c7, 0 8px 24px rgba(2, 132, 199, 0.3)';
          target.style.transform = 'scale(1.02)';
          setTimeout(() => {
            target.style.transform = '';
            setTimeout(() => {
              target.style.boxShadow = '';
            }, 3000);
          }, 600);
        }
      } catch (_) {}
    }, 250);
  }
}
