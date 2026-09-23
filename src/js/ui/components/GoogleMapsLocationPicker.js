/**
 * Optional Google Maps location helper for the place form.
 *
 * Supports three independent location inputs:
 * 1) detailed address (always allowed),
 * 2) Google Maps share URL (optional),
 * 3) live device GPS -> Google Maps URL (optional).
 *
 * The form remains savable without coordinates or a Maps link.
 */
import { extractCoordinates, getUserLocation } from '../../utils/maps.js';
import { tursoFetch } from '../../core/db.js';

const GOOGLE_MAPS_URL = 'https://www.google.com/maps';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function googleUrl(lat, lng) {
  return `${GOOGLE_MAPS_URL}?q=${encodeURIComponent(`${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`)}`;
}

function ensureStyles() {
  if (document.getElementById('google-maps-picker-styles')) return;
  const style = document.createElement('style');
  style.id = 'google-maps-picker-styles';
  style.textContent = `
    .gm-location-picker{margin-top:10px;border:1px solid rgba(27,79,114,.16);border-radius:14px;padding:12px;background:#f8fbfd}
    .gm-location-picker__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}
    .gm-location-picker__btn{border:1px solid #1b4f72;background:#fff;color:#1b4f72;border-radius:10px;padding:9px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
    .gm-location-picker__btn--primary{background:#1b4f72;color:#fff}
    .gm-location-picker__btn--gps{border-color:#059669;color:#047857;background:#ecfdf5}
    .gm-location-picker__hint{margin:7px 0 0;font-size:12px;line-height:1.7;color:#64748b}
    .gm-location-picker__status{margin-top:8px;font-size:12px;color:#475569;min-height:18px}
    .gm-location-picker__preview{margin-top:10px;border-radius:12px;overflow:hidden;border:1px solid #dbe4ea;background:#fff}
    .gm-location-picker__preview iframe{display:block;width:100%;height:230px;border:0}
    .gm-location-picker__result{margin-top:9px;padding:10px;border-radius:10px;background:#ecfdf5;color:#065f46;font-size:12px;line-height:1.8}
    .gm-location-picker__result strong{display:block;margin-bottom:3px}
    .gm-location-picker__coords{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;font-size:11px;color:#475569;background:#fff}
    @media(max-width:640px){.gm-location-picker__actions{display:grid;grid-template-columns:1fr}.gm-location-picker__btn{width:100%}.gm-location-picker__preview iframe{height:210px}}
  `;
  document.head.appendChild(style);
}

function notify(message, type = 'info') {
  try {
    if (typeof window.toast?.[type] === 'function') window.toast[type](message);
    else if (typeof window.showToast === 'function') window.showToast(message, type);
  } catch (_) {}
}

async function resolveMapsInput(input, statusEl, previewEl, coordsEl) {
  const value = input?.value?.trim() || '';
  if (!value) {
    if (previewEl) previewEl.innerHTML = '';
    if (coordsEl) coordsEl.textContent = '';
    if (statusEl) statusEl.textContent = 'رابط خرائط Google اختياري — يمكنك الحفظ بدونه.';
    return null;
  }

  if (statusEl) statusEl.textContent = 'جاري قراءة موقع خرائط Google…';
  const coords = await extractCoordinates(value);
  if (!coords) {
    if (statusEl) statusEl.textContent = 'تعذر استخراج الإحداثيات من الرابط. يمكنك الاحتفاظ بالرابط أو إعادة نسخه من Google Maps.';
    return null;
  }

  renderPreview(coords, previewEl, coordsEl);
  if (statusEl) statusEl.textContent = 'تم تحديد الموقع من رابط Google Maps ✓';
  input.dataset.coordinates = JSON.stringify({ lat: coords.lat, lng: coords.lng });
  return coords;
}

function renderPreview(coords, previewEl, coordsEl) {
  if (!coords || !previewEl) return;
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=17&output=embed`;
  previewEl.innerHTML = `<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${esc(src)}" title="معاينة الموقع على خرائط Google"></iframe>`;
  if (coordsEl) coordsEl.textContent = `الموقع: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function mountForForm() {
  const mapsInput = document.getElementById('p-maps');
  const addressInput = document.getElementById('p-address');
  if (!mapsInput || mapsInput.dataset.googlePickerMounted === '1') return;
  mapsInput.dataset.googlePickerMounted = '1';
  ensureStyles();

  const wrap = document.createElement('div');
  wrap.className = 'gm-location-picker';
  wrap.innerHTML = `
    <div style="font-weight:800;color:#1b4f72">📍 تحديد موقع النشاط</div>
    <div class="gm-location-picker__hint">اكتب المدينة/المنطقة ثم العنوان التفصيلي، مثل: <strong>المنزلة — شارع الرياح بجوار فرن أم أميرة</strong>. سيبحث النظام تلقائياً عن الشارع والمعلم ويقترح الإحداثيات الحقيقية، ولن ينشئ إحداثيات وهمية.</div>
    <div class="gm-location-picker__actions">
      <button type="button" class="gm-location-picker__btn gm-location-picker__btn--primary" data-gm-open>🗺️ فتح خرائط Google لاختيار الموقع</button>
      <button type="button" class="gm-location-picker__btn gm-location-picker__btn--gps" data-gm-gps>📍 استخدام موقعي الحالي</button>
      <button type="button" class="gm-location-picker__btn" data-gm-paste>🔗 لصق رابط خرائط Google</button>
    </div>
    <div class="gm-location-picker__status" data-gm-status>اكتب العنوان التفصيلي ليتم البحث عنه تلقائياً.</div>
    <div class="gm-location-picker__result" data-gm-result hidden></div>
    <div class="gm-location-picker__preview" data-gm-preview></div>
    <div class="gm-location-picker__coords" data-gm-coords></div>
  `;
  mapsInput.insertAdjacentElement('afterend', wrap);

  const status = wrap.querySelector('[data-gm-status]');
  const preview = wrap.querySelector('[data-gm-preview]');
  const coords = wrap.querySelector('[data-gm-coords]');
  const resultBox = wrap.querySelector('[data-gm-result]');

  async function resolveAddressAutomatically() {
    const address = addressInput?.value?.trim() || '';
    const areaInput = document.getElementById('p-area');
    const area = areaInput?.value?.trim() || '';
    const nameInput = document.getElementById('p-name');
    const name = nameInput?.value?.trim() || '';
    if (!address && !name) return null;

    if (status) status.textContent = '🔎 جاري البحث عن الشارع والمعلم والمكان على الخرائط…';
    if (resultBox) { resultBox.hidden = false; resultBox.innerHTML = 'جاري مطابقة العنوان مع الخرائط…'; }

    try {
      const data = await tursoFetch('/api/maps/geocode', {
        method: 'POST',
        body: JSON.stringify({ placeName:name, address, area })
      });
      if (!data?.success) throw new Error(data?.error || 'لم يتم العثور على موقع');

      if (data.selected && !data.coordinateConflict) {
        const point = data.selected;
        mapsInput.dataset.coordinates = JSON.stringify({lat:Number(point.lat),lng:Number(point.lng)});
        mapsInput.value = point.mapsLink || mapsInput.value;
        renderPreview(point, preview, coords);
        if (resultBox) {
          resultBox.hidden = false;
          resultBox.innerHTML = '<strong>✓ تم تحديد الموقع</strong>' +
            esc(point.formattedAddress || 'موقع مطابق') +
            '<br><span>دقة المطابقة: '+Math.round(Number(data.confidence||0)*100)+'%</span>';
        }
        if (status) status.textContent = 'تم العثور على موقع حقيقي متوافق مع العنوان ✓';
        mapsInput.dispatchEvent(new Event('input', { bubbles:true }));
        return point;
      }

      if (data.coordinateConflict) {
        if (resultBox) {
          resultBox.hidden = false;
          resultBox.innerHTML = '<strong>⚠ يوجد مكان قريب جداً من الإحداثيات المقترحة</strong>' +
            esc(data.coordinateConflict.name || '') +
            ' — المسافة '+esc(String(data.coordinateConflict.distanceMeters||0))+' متر. اختر نقطة المبنى يدوياً ولا يتم تحريكها تلقائياً.';
        }
        if (status) status.textContent = 'تم إيقاف الحفظ التلقائي لأن هناك تعارضاً أقل من 3 أمتار.';
        return null;
      }

      if (Array.isArray(data.candidates) && data.candidates.length) {
        if (resultBox) {
          resultBox.hidden = false;
          resultBox.innerHTML = '<strong>تم العثور على عدة نتائج</strong> يجب اختيار النقطة الصحيحة من خرائط Google قبل الحفظ.';
        }
        if (status) status.textContent = 'العنوان غير حاسم بما يكفي؛ راجع النتائج قبل اعتماد الموقع.';
        return null;
      }
      throw new Error('لم يتم العثور على موقع موثوق');
    } catch (err) {
      if (resultBox) { resultBox.hidden = false; resultBox.innerHTML = esc(err?.message || 'تعذر تحديد الموقع تلقائياً'); }
      if (status) status.textContent = 'تعذر تحديد موقع موثوق تلقائياً. يمكنك استخدام رابط خرائط Google أو GPS.';
      return null;
    }
  }

  wrap.querySelector('[data-gm-open]').addEventListener('click', () => {
    const query = addressInput?.value?.trim() || 'المنزلة الدقهلية مصر';
    const url = `${GOOGLE_MAPS_URL}/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    status.textContent = 'بعد اختيار المكان في Google Maps اضغط «مشاركة» وانسخ الرابط، ثم اضغط «لصق رابط خرائط Google» هنا.';
  });

  wrap.querySelector('[data-gm-paste]').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) throw new Error('empty');
      mapsInput.value = text.trim();
      mapsInput.dispatchEvent(new Event('input', { bubbles: true }));
      await resolveMapsInput(mapsInput, status, preview, coords);
    } catch (_) {
      mapsInput.focus();
      status.textContent = 'الصق رابط المشاركة في حقل «رابط خرائط Google» ثم اضغط خارج الحقل لاستخراج الموقع.';
    }
  });

  wrap.querySelector('[data-gm-gps]').addEventListener('click', async () => {
    status.textContent = 'جاري تحديد موقعك بدقة…';
    try {
      const location = await getUserLocation();
      const url = googleUrl(location.lat, location.lng);
      mapsInput.value = url;
      mapsInput.dataset.coordinates = JSON.stringify({ lat: location.lat, lng: location.lng });
      renderPreview(location, preview, coords);
      mapsInput.dispatchEvent(new Event('input', { bubbles: true }));
      status.textContent = `تم تحديد موقعك الحالي بدقة ${Math.round(location.accuracy || 0)} متر ✓ ويمكنك تعديل الموقع من Google Maps قبل الحفظ.`;
    } catch (err) {
      status.textContent = 'تعذر تحديد موقعك. تأكد من السماح للموقع في المتصفح، أو استخدم رابط Google Maps يدويًا.';
    }
  });

  let timer = null;
  let addressTimer = null;
  mapsInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => resolveMapsInput(mapsInput, status, preview, coords), 450);
  });

  const triggerAddressResolve = () => {
    clearTimeout(addressTimer);
    addressTimer = setTimeout(() => {
      if (!(mapsInput.value || '').trim()) resolveAddressAutomatically();
    }, 900);
  };
  [addressInput, document.getElementById('p-area'), document.getElementById('p-name')]
    .filter(Boolean)
    .forEach(el => el.addEventListener('input', triggerAddressResolve));
  [addressInput, document.getElementById('p-area')]
    .filter(Boolean)
    .forEach(el => el.addEventListener('blur', triggerAddressResolve));

  if (mapsInput.value.trim()) resolveMapsInput(mapsInput, status, preview, coords);
  else if ((addressInput?.value || '').trim()) resolveAddressAutomatically();
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
