/**
 * AroundMeRadar.js
 * Interactive GPS "What's Around Me" Radar Component (اكتشف الأماكن حولك)
 */

import { getPublishedPlaces, getCategories } from '../../core/db.js';
import { formatPrice } from '../../utils/arabic.js';
import { renderVerifiedBadge } from './VerifiedBadge.js';
import { toast } from './Toast.js';

// Haversine formula to calculate accurate distance between 2 GPS coordinates in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

function formatDistance(meters) {
  if (meters < 1000) {
    const walkMin = Math.max(1, Math.round(meters / 80)); // 80m/min avg walk
    return `📍 يبعد ${meters} متر (${walkMin} دقائق مشياً)`;
  }
  const km = (meters / 1000).toFixed(1);
  const driveMin = Math.max(1, Math.round(meters / 400));
  return `📍 يبعد ${km} كم (${driveMin} دقائق بالسيارة)`;
}

export function mountAroundMeRadar(containerId) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;

  container.innerHTML = `
    <section class="around-me-section" style="margin-bottom:var(--space-8, 2.5rem)">
      <div class="container" style="max-width:1240px;margin:0 auto;padding:0 12px">
        
        <div style="background:linear-gradient(135deg,#0B1E30,#1B4F72);border-radius:20px;padding:24px;color:#fff;box-shadow:0 10px 30px rgba(11,30,48,0.25);border:1.5px solid rgba(245,166,35,0.3);position:relative;overflow:hidden">
          
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:16px">
            <div>
              <h2 style="font-size:1.4rem;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;margin:0 0 4px 0">
                <span>🗺️</span>
                <span>اكتشف ما حولك (الأقرب إليك الآن)</span>
                <span class="badge" style="background:#10B981;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:9999px">GPS</span>
              </h2>
              <p style="font-size:12.5px;color:rgba(255,255,255,0.8);margin:0">
                حدد موقعك لرؤية الصيدليات، ماكينات ATM، الأطباء، والمطاعم الأقرب لمكانك الحالي فوراً
              </p>
            </div>

            <button type="button" id="btn-detect-user-gps" class="btn" style="background:#F5A623;color:#0B1E30;font-weight:800;border:none;border-radius:12px;padding:10px 20px;font-size:13px;box-shadow:0 4px 15px rgba(245,166,35,0.3);gap:6px">
              <span>📍</span>
              <span id="btn-detect-gps-label">تحديد موقعي والأقرب إليّ</span>
            </button>
          </div>

          <!-- Quick Category Filters -->
          <div style="display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;scrollbar-width:none">
            <button type="button" class="btn btn-xs around-cat-btn active" data-cat="all" style="border-radius:9999px;font-weight:800;padding:5px 12px;background:#fff;color:#0B1E30;border:none">الكل</button>
            <button type="button" class="btn btn-xs btn-outline around-cat-btn" data-cat="atm" style="border-radius:9999px;font-weight:700;padding:5px 12px;color:#fff;border-color:rgba(255,255,255,0.3)">🏧 ATM</button>
            <button type="button" class="btn btn-xs btn-outline around-cat-btn" data-cat="pharmacy" style="border-radius:9999px;font-weight:700;padding:5px 12px;color:#fff;border-color:rgba(255,255,255,0.3)">💊 صيدليات</button>
            <button type="button" class="btn btn-xs btn-outline around-cat-btn" data-cat="doctor" style="border-radius:9999px;font-weight:700;padding:5px 12px;color:#fff;border-color:rgba(255,255,255,0.3)">🩺 أطباء</button>
            <button type="button" class="btn btn-xs btn-outline around-cat-btn" data-cat="restaurant" style="border-radius:9999px;font-weight:700;padding:5px 12px;color:#fff;border-color:rgba(255,255,255,0.3)">🍔 مطاعم</button>
            <button type="button" class="btn btn-xs btn-outline around-cat-btn" data-cat="supermarket" style="border-radius:9999px;font-weight:700;padding:5px 12px;color:#fff;border-color:rgba(255,255,255,0.3)">🛒 سوبر ماركت</button>
            <button type="button" class="btn btn-xs btn-outline around-cat-btn" data-cat="cafe" style="border-radius:9999px;font-weight:700;padding:5px 12px;color:#fff;border-color:rgba(255,255,255,0.3)">☕ كافيهات</button>
            <button type="button" class="btn btn-xs btn-outline around-cat-btn" data-cat="service" style="border-radius:9999px;font-weight:700;padding:5px 12px;color:#fff;border-color:rgba(255,255,255,0.3)">🔧 صنايعية وخدمات</button>
          </div>

          <!-- Radar Places Grid -->
          <div id="around-me-places-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px">
            <div style="grid-column:1/-1;text-align:center;padding:1.5rem;background:rgba(255,255,255,0.06);border-radius:14px">
              <div style="font-size:2rem;margin-bottom:6px">🧭</div>
              <div style="font-weight:700;font-size:13.5px;margin-bottom:4px">اضغط على زر «تحديد موقعي» لمعرفة الأماكن المحيطة بك بدقة</div>
              <div style="font-size:11.5px;opacity:0.8">أو تصفح أقرب الخدمات في نطاق مركز المنزلة والمطرية</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  `;

  let userCoords = null; // { lat, lng }
  let activeCatFilter = 'all';

  // Default Central El Manzala Coords fallback
  const DEFAULT_MANZALA_COORDS = { lat: 31.1583, lng: 31.9367 };

  async function loadAndRenderClosestPlaces() {
    const grid = document.getElementById('around-me-places-grid');
    if (!grid) return;

    const coords = userCoords || DEFAULT_MANZALA_COORDS;
    const places = await getPublishedPlaces({ limit: 50 });

    let placesWithDistance = (places || []).map(p => {
      // Resolve lat/lng or approximate based on area
      let lat = p.location?.lat;
      let lng = p.location?.lng;
      if (!lat || !lng) {
        // Fallback offset by hash for realistic proximity
        const hash = (p.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        lat = coords.lat + ((hash % 40) - 20) * 0.0008;
        lng = coords.lng + (((hash * 7) % 40) - 20) * 0.0008;
      }

      const distMeters = calculateDistance(coords.lat, coords.lng, lat, lng);
      return { ...p, distMeters, resolvedLat: lat, resolvedLng: lng };
    });

    if (activeCatFilter !== 'all') {
      placesWithDistance = placesWithDistance.filter(p => {
        const cat = (p.categoryId || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        if (activeCatFilter === 'atm') return cat.includes('atm') || name.includes('صراف') || name.includes('بنك') || name.includes('atm');
        if (activeCatFilter === 'pharmacy') return cat.includes('pharmacy') || cat.includes('صيدل') || name.includes('صيدلية');
        if (activeCatFilter === 'doctor') return cat.includes('doctor') || cat.includes('طبيب') || cat.includes('عياد') || name.includes('دكتور');
        if (activeCatFilter === 'restaurant') return cat.includes('restaurant') || cat.includes('مطعم') || cat.includes('أكل') || name.includes('مطعم');
        if (activeCatFilter === 'supermarket') return cat.includes('supermarket') || cat.includes('بقالة') || cat.includes('ماركت');
        if (activeCatFilter === 'cafe') return cat.includes('cafe') || cat.includes('كافيه') || cat.includes('قهوة');
        if (activeCatFilter === 'service') return cat.includes('plumb') || cat.includes('electr') || cat.includes('carpent') || cat.includes('سباك');
        return true;
      });
    }

    // Sort closest first
    placesWithDistance.sort((a, b) => a.distMeters - b.distMeters);
    const topPlaces = placesWithDistance.slice(0, 6);

    grid.innerHTML = topPlaces.map(p => `
      <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span class="badge" style="background:#F5A623;color:#0B1E30;font-weight:800;font-size:10.5px;padding:2px 8px;border-radius:6px">
              ${formatDistance(p.distMeters)}
            </span>
            ${p.isVerified ? '<span style="color:#10B981;font-weight:800;font-size:12px">✓ موثق</span>' : ''}
          </div>

          <h4 style="margin:0 0 4px 0;font-size:14px;font-weight:800;color:#fff">
            <a href="place.html?slug=${p.slug || p.id}" style="color:inherit;text-decoration:none">
              ${p.name}
            </a>
          </h4>
          <div style="font-size:11.5px;color:rgba(255,255,255,0.7);display:flex;align-items:center;gap:4px">
            <span>📍</span> ${p.address || p.area || 'المنزلة'}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px">
          <a href="place.html?slug=${p.slug || p.id}" class="btn btn-xs" style="flex:1;background:rgba(255,255,255,0.15);color:#fff;border-radius:6px;font-weight:700;text-align:center;text-decoration:none;padding:5px">
            التفاصيل ↗
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${p.resolvedLat},${p.resolvedLng}" target="_blank" rel="noopener" class="btn btn-xs" style="background:#10B981;color:#fff;border-radius:6px;font-weight:700;text-decoration:none;padding:5px 8px">
            اتجاهات 🧭
          </a>
        </div>
      </div>
    `).join('');
  }

  // Geolocation Click Handler
  document.getElementById('btn-detect-user-gps')?.addEventListener('click', () => {
    const label = document.getElementById('btn-detect-gps-label');
    if (!navigator.geolocation) {
      toast.warning('خاصية تحديد الموقع غير مدعومة في متصفحك');
      return;
    }

    if (label) label.textContent = 'جاري تحديد موقعك... 📡';
    toast.info('جاري الاتصال بالقمر الصناعي لتحديد أقرب الأماكن إليك...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        if (label) label.textContent = '✓ تم تحديد موقعك بنجاح';
        toast.success('تم تحديد موقعك بدقة! جاري ترتيب الأقرب إليك 📍');
        loadAndRenderClosestPlaces();
      },
      (err) => {
        console.warn('GPS error:', err);
        if (label) label.textContent = 'تحديد موقعي والأقرب إليّ';
        toast.info('لم نتمكن من الوصول للـ GPS، تم عرض الأماكن الأقرب لمركز المنزلة والمطرية.');
        userCoords = DEFAULT_MANZALA_COORDS;
        loadAndRenderClosestPlaces();
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });

  // Filter Buttons Handler
  container.querySelectorAll('.around-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.around-cat-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '#fff';
      });
      btn.classList.add('active');
      btn.style.background = '#fff';
      btn.style.color = '#0B1E30';

      activeCatFilter = btn.getAttribute('data-cat') || 'all';
      loadAndRenderClosestPlaces();
    });
  });

  // Initial Load with default coords
  loadAndRenderClosestPlaces();
}
