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
    <div class="gm-location-picker__hint">يمكنك كتابة العنوان التفصيلي فقط، أو إضافة رابط مشاركة من خرائط Google، أو استخدام موقعك الحالي. تحديد الموقع على الخريطة <strong>اختياري</strong> ولن يمنع حفظ النشاط.</div>
    <div class="gm-location-picker__actions">
      <button type="button" class="gm-location-picker__btn gm-location-picker__btn--primary" data-gm-open>🗺️ فتح خرائط Google لاختيار الموقع</button>
      <button type="button" class="gm-location-picker__btn gm-location-picker__btn--gps" data-gm-gps>📍 استخدام موقعي الحالي</button>
      <button type="button" class="gm-location-picker__btn" data-gm-paste>🔗 لصق رابط خرائط Google</button>
    </div>
    <div class="gm-location-picker__status" data-gm-status>رابط الخرائط اختياري — يمكنك الحفظ بدونه.</div>
    <div class="gm-location-picker__preview" data-gm-preview></div>
    <div class="gm-location-picker__coords" data-gm-coords></div>
  `;
  mapsInput.insertAdjacentElement('afterend', wrap);

  const status = wrap.querySelector('[data-gm-status]');
  const preview = wrap.querySelector('[data-gm-preview]');
  const coords = wrap.querySelector('[data-gm-coords]');

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
  mapsInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => resolveMapsInput(mapsInput, status, preview, coords), 450);
  });

  if (mapsInput.value.trim()) resolveMapsInput(mapsInput, status, preview, coords);
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
