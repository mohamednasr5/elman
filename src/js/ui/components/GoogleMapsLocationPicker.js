/**
 * Interactive Location Picker & Map Engine for Dalil Al-Manzala
 *
 * Provides:
 * 1) Interactive Leaflet map with draggable pin & click-to-pinpoint.
 * 2) Auto-geocoding with local gazetteer & multi-tier fallbacks (never 500 / 422).
 * 3) Device live GPS locator.
 * 4) Direct Google Maps sync & clipboard paste.
 */
import { extractCoordinates, getUserLocation } from '../../utils/maps.js';
import { tursoFetch } from '../../core/db.js';

const GOOGLE_MAPS_URL = 'https://www.google.com/maps';
const DEFAULT_CENTER = { lat: 31.1578, lng: 31.9367 }; // El Manzala Center

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function googleUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

let _leafletPromise = null;
function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'));
  if (window.L && window.L.map) return Promise.resolve(window.L);
  if (_leafletPromise) return _leafletPromise;

  _leafletPromise = new Promise((resolve, reject) => {
    // Inject CSS
    if (!document.getElementById('leaflet-core-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-core-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Inject JS
    const script = document.createElement('script');
    script.id = 'leaflet-core-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet failed to initialize'));
    };
    script.onerror = () => reject(new Error('Failed to load Leaflet script'));
    document.head.appendChild(script);
  });

  return _leafletPromise;
}

function ensureStyles() {
  if (document.getElementById('google-maps-picker-styles')) return;
  const style = document.createElement('style');
  style.id = 'google-maps-picker-styles';
  style.textContent = `
    .gm-location-picker {
      margin-top: 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 16px;
      padding: 16px;
      background: #f8fafc;
      box-shadow: 0 2px 10px rgba(15,23,42,0.04);
      transition: border-color .2s ease;
    }
    .gm-location-picker:focus-within {
      border-color: #0f766e;
    }
    .gm-location-picker__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }
    .gm-location-picker__title {
      font-weight: 800;
      color: #0f172a;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .gm-location-picker__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 10px 0;
    }
    .gm-location-picker__btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      border-radius: 10px;
      padding: 8px 14px;
      font: inherit;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all .2s ease;
    }
    .gm-location-picker__btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .gm-location-picker__btn--gps {
      border-color: #10b981;
      color: #047857;
      background: #ecfdf5;
    }
    .gm-location-picker__btn--gps:hover {
      background: #d1fae5;
    }
    .gm-location-picker__btn--maps {
      border-color: #38bdf8;
      color: #0284c7;
      background: #f0f9ff;
    }
    .gm-location-picker__btn--maps:hover {
      background: #e0f2fe;
    }
    .gm-location-picker__status {
      margin-top: 8px;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.6;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .gm-location-picker__status--success {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    .gm-location-picker__map-canvas {
      width: 100%;
      height: 270px;
      border-radius: 14px;
      overflow: hidden;
      border: 1.5px solid #cbd5e1;
      margin-top: 12px;
      position: relative;
      background: #e2e8f0;
      z-index: 1;
    }
    .gm-location-picker__coords {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11.5px;
      color: #64748b;
    }
    .interactive-map-pin {
      cursor: grab;
      user-select: none;
    }
    .interactive-map-pin:active {
      cursor: grabbing;
    }
    @media(max-width:640px) {
      .gm-location-picker__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .gm-location-picker__map-canvas {
        height: 230px;
      }
    }
  `;
  document.head.appendChild(style);
}

function mountForForm() {
  const mapsInput = document.getElementById('p-maps');
  const addressInput = document.getElementById('p-address');
  if (!mapsInput || mapsInput.dataset.googlePickerMounted === '1') return;
  mapsInput.dataset.googlePickerMounted = '1';
  ensureStyles();

  // Hide the old duplicate preview box if it exists in dashboard.js
  const oldBox = document.getElementById('map-live-preview-box');
  if (oldBox) oldBox.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'gm-location-picker';
  wrap.innerHTML = `
    <div class="gm-location-picker__header">
      <div class="gm-location-picker__title">
        <span>🗺️ خريطة الموقع الجغرافي للمحل / النشاط</span>
      </div>
      <span style="font-size:11px;color:#0f766e;font-weight:700">تثبيت تفاعلي بدبوس الخريطة 📍</span>
    </div>
    <div style="font-size:12px;color:#64748b;line-height:1.6">
      يتعرف النظام تلقائياً على الشارع والمدينة، ويمكنك <b>سحب الدبوس الأحمر</b> على الخريطة لتثبيت مكان المحل أو مدخل النشاط بالضبط.
    </div>

    <div class="gm-location-picker__actions">
      <button type="button" class="gm-location-picker__btn gm-location-picker__btn--gps" data-gm-gps>
        <span>📍 موقعي الحالي (GPS)</span>
      </button>
      <button type="button" class="gm-location-picker__btn gm-location-picker__btn--maps" data-gm-open>
        <span>🗺️ فتح في Google Maps</span>
      </button>
      <button type="button" class="gm-location-picker__btn" data-gm-paste>
        <span>🔗 لصق رابط</span>
      </button>
      <button type="button" class="gm-location-picker__btn" data-gm-refresh>
        <span>🔎 إعادة التحديد بالعنوان</span>
      </button>
    </div>

    <div class="gm-location-picker__status" data-gm-status>
      اكتب العنوان ليتم التعرف على الشارع والمنطقة، ثم اسحب الدبوس لتثبيت موقع المحل.
    </div>

    <div class="gm-location-picker__map-canvas" data-gm-canvas></div>

    <div class="gm-location-picker__coords" data-gm-coords>
      <span>الإحداثيات: <b data-gm-coords-val dir="ltr">—</b></span>
      <span style="font-size:11px">💡 انقر على أي نقطة بالخريطة لتحريك الدبوس فوراً</span>
    </div>
  `;

  mapsInput.insertAdjacentElement('afterend', wrap);

  const statusEl = wrap.querySelector('[data-gm-status]');
  const canvasEl = wrap.querySelector('[data-gm-canvas]');
  const coordsValEl = wrap.querySelector('[data-gm-coords-val]');

  let leafletMap = null;
  let leafletMarker = null;
  let activeCoords = null;

  // Initialize interactive Leaflet map
  async function initMap(initialLat, initialLng) {
    try {
      const L = await loadLeaflet();
      if (!canvasEl) return;

      if (!leafletMap) {
        leafletMap = L.map(canvasEl, {
          zoomControl: true,
          scrollWheelZoom: false,
          tap: true
        }).setView([initialLat, initialLng], 16);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(leafletMap);

        const pinIcon = L.divIcon({
          className: 'interactive-map-pin',
          html: `
            <div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
              <div style="background:#dc2626;color:#fff;border:2.5px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.35);font-size:17px">📍</div>
              <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #dc2626;margin-top:-2px"></div>
            </div>
          `,
          iconSize: [34, 42],
          iconAnchor: [17, 42]
        });

        leafletMarker = L.marker([initialLat, initialLng], {
          icon: pinIcon,
          draggable: true
        }).addTo(leafletMap);

        leafletMarker.on('dragend', () => {
          const pos = leafletMarker.getLatLng();
          onCoordsChanged(pos.lat, pos.lng, 'تم تثبيت موقع المحل بالسحب اليدوي ✓');
        });

        leafletMap.on('click', (e) => {
          leafletMarker.setLatLng(e.latlng);
          onCoordsChanged(e.latlng.lat, e.latlng.lng, 'تم نقل موقع المحل للنقطة المحددة ✓');
        });

        setTimeout(() => leafletMap?.invalidateSize(), 300);
      } else {
        leafletMap.setView([initialLat, initialLng], 16);
        leafletMarker.setLatLng([initialLat, initialLng]);
      }
    } catch (_) {
      // Fallback: Embed Google Maps iframe if Leaflet is blocked or offline
      canvasEl.innerHTML = `
        <iframe src="https://maps.google.com/maps?q=${initialLat},${initialLng}&hl=ar&z=17&output=embed"
          style="border:0;width:100%;height:100%;display:block" loading="lazy"></iframe>
      `;
    }
  }

  function onCoordsChanged(lat, lng, feedbackText = '') {
    lat = Number(Number(lat).toFixed(6));
    lng = Number(Number(lng).toFixed(6));
    activeCoords = { lat, lng };

    // Update inputs
    const mapsUrl = googleUrl(lat, lng);
    mapsInput.value = mapsUrl;
    mapsInput.dataset.coordinates = JSON.stringify({ lat, lng });

    // Update coordinates display
    if (coordsValEl) coordsValEl.textContent = `${lat}, ${lng}`;

    // Update status
    if (statusEl) {
      statusEl.className = 'gm-location-picker__status gm-location-picker__status--success';
      statusEl.innerHTML = feedbackText
        ? `<b>✅ ${esc(feedbackText)}</b><br><span style="font-size:11px">تم تحديث الإحداثيات ورابط Google Maps بنجاح.</span>`
        : `<b>✅ تم تحديد الموقع: (${lat}, ${lng})</b><br><span style="font-size:11px">يمكنك سحب الدبوس 📍 لضبط مكان المحل بالضبط.</span>`;
    }

    // Trigger input event so any listeners update
    try {
      mapsInput.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (_) {}
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instant In-Browser Local Gazetteer (القاموس الجغرافي اللحظي بدون أي انتظار)
  // ─────────────────────────────────────────────────────────────────────────
  const LOCAL_GAZETTEER = [
    // El Manzala Streets & Landmarks
    { keywords: ['امن الدولة', 'أمن الدولة', 'السحاب', 'برج السحاب', 'شارع امن الدولة'], lat: 31.1570, lng: 31.9385, name: 'شارع أمن الدولة، المنزلة' },
    { keywords: ['شارع البحر', 'كورنيش البحر', 'كورنيش', 'البحر'], lat: 31.1585, lng: 31.9355, name: 'شارع البحر، المنزلة' },
    { keywords: ['شارع الرياح', 'الرياح', 'فرن ام اميرة', 'ام اميرة'], lat: 31.1592, lng: 31.9348, name: 'شارع الرياح، المنزلة' },
    { keywords: ['شارع بورسعيد', 'بور سعيد'], lat: 31.1565, lng: 31.9380, name: 'شارع بورسعيد، المنزلة' },
    { keywords: ['ميدان المحطة', 'المحطة', 'محطة القطار'], lat: 31.1588, lng: 31.9412, name: 'ميدان المحطة، المنزلة' },
    { keywords: ['ميدان الساعة', 'الساعة'], lat: 31.1575, lng: 31.9372, name: 'ميدان الساعة، المنزلة' },
    { keywords: ['شارع الجلاء', 'الجلاء'], lat: 31.1580, lng: 31.9335, name: 'شارع الجلاء، المنزلة' },
    { keywords: ['شارع الثورة', 'الثورة'], lat: 31.1572, lng: 31.9350, name: 'شارع الثورة، المنزلة' },
    { keywords: ['شارع المستشفى', 'مستشفى المنزلة', 'المستشفى العام'], lat: 31.1550, lng: 31.9360, name: 'شارع المستشفى العام، المنزلة' },
    { keywords: ['شارع المحكمة', 'مجمع المحاكم', 'المحكمة'], lat: 31.1568, lng: 31.9395, name: 'شارع المحكمة، المنزلة' },
    { keywords: ['طريق الشونة', 'الشونة'], lat: 31.1540, lng: 31.9300, name: 'طريق الشونة، المنزلة' },
    { keywords: ['حي البساتين', 'البساتين'], lat: 31.1605, lng: 31.9320, name: 'حي البساتين، المنزلة' },
    { keywords: ['المعهد الديني', 'معهد المنزلة'], lat: 31.1610, lng: 31.9390, name: 'منطقة المعهد الديني، المنزلة' },
    { keywords: ['المثلث', 'منطقة المثلث'], lat: 31.1620, lng: 31.9410, name: 'منطقة المثلث، المنزلة' },
    { keywords: ['المجاير', 'منطقة المجاير'], lat: 31.1595, lng: 31.9380, name: 'المجاير، المنزلة' },
    { keywords: ['شرق السكة', 'السكة الحديد'], lat: 31.1600, lng: 31.9450, name: 'شرق السكة الحديد، المنزلة' },
    { keywords: ['القومية'], lat: 31.1570, lng: 31.9330, name: 'منطقة القومية، المنزلة' },
    { keywords: ['الخلايفة'], lat: 31.1560, lng: 31.9405, name: 'حي الخلايفة، المنزلة' },
    { keywords: ['القبلية', 'المنطقة القبلية'], lat: 31.1525, lng: 31.9350, name: 'المنطقة القبلية، المنزلة' },
    { keywords: ['وسط البلد'], lat: 31.1578, lng: 31.9367, name: 'وسط البلد، المنزلة' },
    { keywords: ['كوبري العزيزة', 'جسر العزيزة'], lat: 31.1615, lng: 31.9730, name: 'كوبري العزيزة، المنزلة' },
    { keywords: ['مجلس المدينة', 'مجلس مدينة المنزلة'], lat: 31.1573, lng: 31.9390, name: 'مجلس المدينة، المنزلة' },
    { keywords: ['الادارة التعليمية', 'الإدارة التعليمية'], lat: 31.1562, lng: 31.9378, name: 'الإدارة التعليمية، المنزلة' },
    { keywords: ['التامين الصحي', 'التأمين الصحي'], lat: 31.1555, lng: 31.9365, name: 'التأمين الصحي، المنزلة' },
    { keywords: ['نادي المنزلة', 'نادي المنزلة الرياضي'], lat: 31.1602, lng: 31.9340, name: 'نادي المنزلة الرياضي' },
    { keywords: ['الاستاد', 'الملعب'], lat: 31.1615, lng: 31.9330, name: 'استاد المنزلة' },
    { keywords: ['السجل المدني', 'قسم الشرطة', 'مركز شرطة المنزلة'], lat: 31.1582, lng: 31.9400, name: 'مركز شرطة المنزلة' },
    { keywords: ['المرور', 'وحدة المرور'], lat: 31.1535, lng: 31.9290, name: 'وحدة مرور المنزلة' },
    { keywords: ['مساكن السمنودي'], lat: 31.1625, lng: 31.9350, name: 'مساكن السمنودي، المنزلة' },
    { keywords: ['مساكن الزهراء'], lat: 31.1640, lng: 31.9390, name: 'مساكن الزهراء، المنزلة' },
    { keywords: ['بنك مصر', 'البنك الاهلي', 'البنك الأهلي'], lat: 31.1576, lng: 31.9375, name: 'منطقة البنوك، المنزلة' },
    { keywords: ['سنترال المنزلة', 'السنترال'], lat: 31.1580, lng: 31.9382, name: 'سنترال المنزلة' },
    { keywords: ['شارع الجمهورية'], lat: 31.1579, lng: 31.9360, name: 'شارع الجمهورية، المنزلة' },
    { keywords: ['شارع احمد عرابي', 'شارع أحمد عرابي'], lat: 31.1583, lng: 31.9345, name: 'شارع أحمد عرابي، المنزلة' },
    { keywords: ['شارع عبد المنعم رياض'], lat: 31.1569, lng: 31.9368, name: 'شارع عبد المنعم رياض، المنزلة' },
    { keywords: ['المنزلة الجديدة'], lat: 31.1650, lng: 31.9450, name: 'المنزلة الجديدة' },

    // Matareya Landmarks & Streets
    { keywords: ['ميناء المطرية', 'شارع الميناء', 'الميناء', 'المينا'], lat: 31.1810, lng: 32.0350, name: 'ميناء المطرية' },
    { keywords: ['سوق السمك', 'حلقة السمك', 'حلقة المطرية'], lat: 31.1820, lng: 32.0330, name: 'حلقة وسوق السمك، المطرية' },
    { keywords: ['حي الزيتون', 'الزيتون'], lat: 31.1830, lng: 32.0290, name: 'حي الزيتون، المطرية' },
    { keywords: ['الجباسات'], lat: 31.1870, lng: 32.0340, name: 'الجباسات، المطرية' },
    { keywords: ['الجسر الواقي'], lat: 31.1890, lng: 32.0280, name: 'الجسر الواقي، المطرية' },
    { keywords: ['مستشفى المطرية'], lat: 31.1840, lng: 32.0300, name: 'مستشفى المطرية المركزي' },
    { keywords: ['مجلس مدينة المطرية'], lat: 31.1828, lng: 32.0310, name: 'مجلس مدينة المطرية' },

    // Centers & Cities
    { keywords: ['المنزلة', 'مركز المنزلة', 'مدينة المنزلة'], lat: 31.1578, lng: 31.9367, name: 'المنزلة، الدقهلية' },
    { keywords: ['المطرية', 'مركز المطرية', 'مدينة المطرية'], lat: 31.1825, lng: 32.0315, name: 'المطرية، الدقهلية' },
    { keywords: ['الجمالية', 'مدينة الجمالية'], lat: 31.1865, lng: 31.8980, name: 'الجمالية، الدقهلية' },
    { keywords: ['ميت سلسيل'], lat: 31.1903, lng: 31.8492, name: 'ميت سلسيل، الدقهلية' },
    { keywords: ['الكردي'], lat: 31.1690, lng: 31.8340, name: 'الكردي، الدقهلية' },

    // Villages
    { keywords: ['العصافرة', 'قرية العصافرة'], lat: 31.1950, lng: 32.0150, name: 'العصافرة، المطرية' },
    { keywords: ['البصراط', 'قرية البصراط'], lat: 31.1410, lng: 31.8950, name: 'البصراط، المنزلة' },
    { keywords: ['كفر البصراط'], lat: 31.1440, lng: 31.8980, name: 'كفر البصراط، المنزلة' },
    { keywords: ['العزيزة', 'قرية العزيزة'], lat: 31.1620, lng: 31.9750, name: 'العزيزة، المنزلة' },
    { keywords: ['النسايمة', 'قرية النسايمة'], lat: 31.2150, lng: 31.9820, name: 'النسايمة، المنزلة' },
    { keywords: ['الفروسات', 'قرية الفروسات'], lat: 31.1480, lng: 31.9210, name: 'الفروسات، المنزلة' },
    { keywords: ['ميت شريف', 'قرية ميت شريف'], lat: 31.1340, lng: 31.8720, name: 'ميت شريف، المنزلة' },
    { keywords: ['الأحمدية', 'الاحمدية', 'قرية الأحمدية'], lat: 31.1290, lng: 31.9120, name: 'الأحمدية، المنزلة' },
    { keywords: ['الشبول', 'عرب الشبول'], lat: 31.2410, lng: 32.0520, name: 'الشبول، المنزلة' },
    { keywords: ['الحوتة', 'قرية الحوتة'], lat: 31.2280, lng: 32.0180, name: 'الحوتة، المنزلة' },
    { keywords: ['الزهراء', 'قرية الزهراء'], lat: 31.1650, lng: 31.9400, name: 'قرية الزهراء، المنزلة' },
    { keywords: ['دار السلام'], lat: 31.1780, lng: 31.9850, name: 'دار السلام، المنزلة' },
    { keywords: ['ميت خضير'], lat: 31.1510, lng: 31.8890, name: 'ميت خضير، المنزلة' },
    { keywords: ['أبو خضير'], lat: 31.1530, lng: 31.8840, name: 'أبو خضير، المنزلة' },
    { keywords: ['ميت مرجا', 'ميت مرجا سلسيل'], lat: 31.1820, lng: 31.8650, name: 'ميت مرجا، المنزلة' },
    { keywords: ['المواجد'], lat: 31.1240, lng: 31.9380, name: 'المواجد، المنزلة' },
    { keywords: ['بني هلال', 'بن هلال'], lat: 31.1390, lng: 31.9520, name: 'بني هلال، المنزلة' },
    { keywords: ['الستايتة'], lat: 31.1660, lng: 31.9480, name: 'الستايتة، المنزلة' },
    { keywords: ['العامرة'], lat: 31.1710, lng: 31.9610, name: 'العامرة، المنزلة' },
    { keywords: ['كفر حجاج'], lat: 31.1550, lng: 31.9180, name: 'كفر حجاج، المنزلة' },
    { keywords: ['قنيبرة'], lat: 31.1520, lng: 31.8670, name: 'قنيبرة، المنزلة' },
    { keywords: ['الروضة'], lat: 31.1920, lng: 31.8750, name: 'الروضة، المنزلة' },
    { keywords: ['الضهير'], lat: 31.1980, lng: 32.0420, name: 'الضهير، المطرية' },
    { keywords: ['أولاد صبور'], lat: 31.2110, lng: 32.0580, name: 'أولاد صبور، المطرية' },
    { keywords: ['كفر رجب'], lat: 31.1790, lng: 32.0250, name: 'كفر رجب، المطرية' },
    { keywords: ['العكارشة'], lat: 31.1850, lng: 32.0380, name: 'العكارشة، المطرية' },
    { keywords: ['الغصنة'], lat: 31.1910, lng: 32.0490, name: 'الغصنة، المطرية' }
  ];

  function normStr(v) {
    return String(v || '').toLowerCase()
      .normalize('NFKD')
      .replace(/[ً-ٰٟ]/g, '')
      .replace(/[إأآا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .trim();
  }

  function matchLocalAddress(address, area) {
    const hay = normStr(address + ' ' + area);
    if (!hay) return null;
    let best = null;
    let maxLen = 0;
    for (const item of LOCAL_GAZETTEER) {
      for (const kw of item.keywords) {
        const nKw = normStr(kw);
        if (hay.includes(nKw) && nKw.length > maxLen) {
          maxLen = nKw.length;
          best = item;
        }
      }
    }
    return best;
  }

  function getAreaCenter(area) {
    const a = normStr(area);
    if (a.includes('مطريه') || a.includes('المطرية')) return { lat: 31.1825, lng: 32.0315, name: 'المطرية، الدقهلية' };
    if (a.includes('جماليه') || a.includes('الجمالية')) return { lat: 31.1865, lng: 31.8980, name: 'الجمالية، الدقهلية' };
    if (a.includes('سلسيل')) return { lat: 31.1903, lng: 31.8492, name: 'ميت سلسيل، الدقهلية' };
    if (a.includes('بصراط') || a.includes('بسراط')) return { lat: 31.1410, lng: 31.8950, name: 'البصراط، المنزلة' };
    if (a.includes('عزيزه') || a.includes('العزيزة')) return { lat: 31.1620, lng: 31.9750, name: 'العزيزة، المنزلة' };
    if (a.includes('عصافره') || a.includes('العصافرة')) return { lat: 31.1950, lng: 32.0150, name: 'العصافرة، المطرية' };
    if (a.includes('فروسات')) return { lat: 31.1480, lng: 31.9210, name: 'الفروسات، المنزلة' };
    if (a.includes('نسايمه')) return { lat: 31.2150, lng: 31.9820, name: 'النسايمة، المنزلة' };
    if (a.includes('شبول')) return { lat: 31.2410, lng: 32.0520, name: 'الشبول، المنزلة' };
    return { lat: 31.1578, lng: 31.9367, name: 'المنزلة، الدقهلية' };
  }

  async function resolveAddressAutomatically(force = false) {
    const address = addressInput?.value?.trim() || '';
    const areaInput = document.getElementById('p-area');
    const area = (areaInput?.value === 'other'
      ? document.getElementById('p-custom-area')?.value.trim()
      : areaInput?.value.trim()) || 'المنزلة';
    const nameInput = document.getElementById('p-name');
    const name = nameInput?.value?.trim() || '';

    if (!address && !name && !area) return null;

    // 1. Instant In-Browser Local Match (0ms, 100% Reliable, Never Fails)
    const localMatch = matchLocalAddress(address, area);
    if (localMatch) {
      onCoordsChanged(localMatch.lat, localMatch.lng, `تم تحديد الموقع: ${localMatch.name}`);
      initMap(localMatch.lat, localMatch.lng);
      return localMatch;
    }

    // 2. City / Area Center Fallback
    const areaCenter = getAreaCenter(area);
    onCoordsChanged(areaCenter.lat, areaCenter.lng, `تم تحديد نطاق: ${areaCenter.name} — اسحب الدبوس 📍 لتحديد مكان المحل بالضبط`);
    initMap(areaCenter.lat, areaCenter.lng);

    // 3. Optional Background Refinement (Silent, Never Shows Errors to User)
    if (typeof window !== 'undefined' && window.navigator?.onLine) {
      try {
        const data = await tursoFetch('/api/maps/geocode', {
          method: 'POST',
          body: JSON.stringify({ placeName: name, address, area })
        });
        if (data?.selected?.lat && data?.selected?.lng) {
          const pt = data.selected;
          onCoordsChanged(pt.lat, pt.lng, pt.formattedAddress ? `تم تحديد موقع: ${pt.formattedAddress}` : 'تم تحديد الموقع بنجاح');
          initMap(pt.lat, pt.lng);
        }
      } catch (_) {
        // Silently ignored because the local match or area center is already active!
      }
    }

    return areaCenter;
  }

  // Action Button: GPS
  wrap.querySelector('[data-gm-gps]')?.addEventListener('click', async () => {
    if (statusEl) statusEl.textContent = 'جاري قراءة موقع جهازك الحالي بدقة…';
    try {
      const loc = await getUserLocation();
      onCoordsChanged(loc.lat, loc.lng, `تم التقاط موقعك الحالي بدقة ${Math.round(loc.accuracy || 0)} متر ✓`);
      initMap(loc.lat, loc.lng);
    } catch (err) {
      if (statusEl) statusEl.textContent = 'تعذر الوصول لموقع الجهاز. تأكد من السماح بالوصول للموقع في المتصفح.';
    }
  });

  // Action Button: Open in Google Maps
  wrap.querySelector('[data-gm-open]')?.addEventListener('click', () => {
    if (activeCoords) {
      window.open(googleUrl(activeCoords.lat, activeCoords.lng), '_blank', 'noopener,noreferrer');
    } else {
      const query = [addressInput?.value, document.getElementById('p-area')?.value, 'المنزلة الدقهلية'].filter(Boolean).join(' ');
      window.open(`${GOOGLE_MAPS_URL}/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
    }
  });

  // Action Button: Paste Link
  wrap.querySelector('[data-gm-paste]')?.addEventListener('click', async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) throw new Error('empty');
      const coords = await extractCoordinates(text);
      if (coords?.lat && coords?.lng) {
        onCoordsChanged(coords.lat, coords.lng, 'تم استخراج الموقع بنجاح من الرابط الملصوق ✓');
        initMap(coords.lat, coords.lng);
      } else {
        mapsInput.value = text;
        if (statusEl) statusEl.textContent = 'تم لصق الرابط. يمكنك سحب الدبوس لتأكيد النقطة على الخريطة.';
      }
    } catch (_) {
      mapsInput.focus();
      if (statusEl) statusEl.textContent = 'الصق الرابط في حقل رابط خرائط جوجل ثم اضغط خارج الحقل.';
    }
  });

  // Action Button: Refresh
  wrap.querySelector('[data-gm-refresh]')?.addEventListener('click', () => resolveAddressAutomatically(true));

  // Auto-resolve when address or area changes
  let addrTimer = null;
  const onAddressChanged = () => {
    clearTimeout(addrTimer);
    addrTimer = setTimeout(() => {
      resolveAddressAutomatically(true);
    }, 700);
  };

  const onAreaChanged = () => {
    clearTimeout(addrTimer);
    resolveAddressAutomatically(true);
  };

  document.getElementById('p-area')?.addEventListener('change', onAreaChanged);
  document.getElementById('p-custom-area')?.addEventListener('change', onAreaChanged);
  if (addressInput) {
    addressInput.addEventListener('input', onAddressChanged);
    addressInput.addEventListener('change', onAddressChanged);
    addressInput.addEventListener('blur', onAddressChanged);
  }
  document.getElementById('p-name')?.addEventListener('blur', onAddressChanged);

  // Check if place already has coordinates
  let initLat = DEFAULT_CENTER.lat;
  let initLng = DEFAULT_CENTER.lng;
  let hasExisting = false;

  if (mapsInput.dataset.coordinates) {
    try {
      const parsed = JSON.parse(mapsInput.dataset.coordinates);
      if (parsed.lat && parsed.lng) {
        initLat = Number(parsed.lat);
        initLng = Number(parsed.lng);
        hasExisting = true;
      }
    } catch (_) {}
  } else if (mapsInput.value.trim()) {
    extractCoordinates(mapsInput.value.trim()).then(c => {
      if (c?.lat && c?.lng) {
        onCoordsChanged(c.lat, c.lng, 'الموقع المحفوظ للمكان ✓');
        initMap(c.lat, c.lng);
      }
    });
  }

  if (hasExisting) {
    onCoordsChanged(initLat, initLng, 'الموقع المحفوظ للمكان ✓');
    initMap(initLat, initLng);
  } else if ((addressInput?.value || '').trim()) {
    resolveAddressAutomatically();
  } else {
    initMap(initLat, initLng);
  }
}

export function initGoogleMapsLocationPicker() {
  mountForForm();
  if (document.body.dataset.gmPickerObserver === '1') return;
  document.body.dataset.gmPickerObserver = '1';
  const observer = new MutationObserver(() => mountForForm());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof window !== 'undefined') {
  window.initGoogleMapsLocationPicker = initGoogleMapsLocationPicker;
}

