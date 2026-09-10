/**
 * now.js — المنزلة والمطرية الآن (يحدث الآن)
 * يجمع حصرياً بين: «مين متاح دلوقتي» (طوارئ الحرفيين) + «طلبات الخدمات» (طلبات أهالي المدينة)
 */

import { renderWhoIsAvailableNow } from '../components/WhoIsAvailableNow.js';
import { renderServiceRequestsSection } from '../components/ServiceRequestsSection.js';

export async function renderNowPage($container) {
  $container.innerHTML = `
    <div class="container" style="max-width:1240px;margin:0 auto;padding:16px 12px">
      
      <!-- 1. Live Temporary Availability for Craftsmen (مين متاح ييجي دلوقتي؟) -->
      <div id="now-craftsmen-container"></div>

      <!-- 2. Community Service Requests Feed (طلبات الخدمات) -->
      <div id="now-service-requests-container" style="margin-top:1.5rem"></div>

    </div>
  `;

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
}
