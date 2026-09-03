/**
 * المنزلة وناسها — PlaceCard Component
 */

import { renderVerifiedBadge, renderDeliveryBadge, renderSponsoredBadge } from './VerifiedBadge.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { getDefaultPlaceAssets } from '../../utils/category-assets.js';
import { isAtmPlace, ATM_UNIFIED_COVER, ATM_UNIFIED_LOGO, getAtmLiveStatus, formatAtmTimeAgo } from '../../utils/atm.js';
import { getPlaceLiveStatus } from '../../utils/live-hours.js';

/**
 * Render a place card HTML string
 */
export function renderPlaceCard(place) {
  const isAtm = isAtmPlace(place);
  const defaultAssets = getDefaultPlaceAssets(place);
  const isSponsored = !isAtm && Boolean((place.isSponsored || place.isFeatured || place.isPromoted) && (!place.sponsoredUntil || place.sponsoredUntil > Date.now()));
  const catStyle = getCategoryCardCover(place);
  
  const finalCover = isAtm ? ATM_UNIFIED_COVER : (place.coverImageUrl || defaultAssets.coverImageUrl);
  const finalLogo = isAtm ? ATM_UNIFIED_LOGO : (place.logoUrl || defaultAssets.logoUrl);

  const coverImg = finalCover
    ? `<img src="${escAttr(finalCover)}" alt="${escAttr(place.name)}" loading="lazy" />`
    : `<div class="place-card__cover-placeholder" style="background:${catStyle.gradient}">
        <span class="place-card__cover-icon">${catStyle.icon}</span>
        <span class="place-card__cover-tag">${escHtml(catStyle.label)}</span>
       </div>`;

  const logoImg = finalLogo
    ? `<img src="${escAttr(finalLogo)}" alt="${escAttr(place.name)} logo" loading="lazy" />`
    : `<div class="place-card__logo-placeholder">${catStyle.icon}</div>`;

  const sponsoredTag = isSponsored ? `<div class="place-card__sponsored-tag">${renderSponsoredBadge()}</div>` : '';
  const verifiedBadge = place.isVerified ? renderVerifiedBadge() : '';
  const deliveryBadge = (!isAtm && place.deliveryType) ? renderDeliveryBadge(place.deliveryType) : '';
  const placeUrl = `place.html?slug=${encodeURIComponent(place.slug || place.id || place._key)}`;

  let atmCashBadge = '';
  if (isAtm) {
    const status = getAtmLiveStatus(place, 15);
    if (status) {
      const badges = [];
      if (status.hasCash || (!status.isCashRecent && status.allTimeHasCash)) {
        badges.push(`<span class="badge atm-badge-card-cash" style="font-size:11px;padding:3px 10px;border-radius:var(--radius-full)">💵 متوفر بها كاش ${status.isCashRecent ? '⚡ (آخر 15 د)' : ''}</span>`);
      } else if (status.noCash || (!status.isCashRecent && status.allTimeNoCash)) {
        badges.push(`<span class="badge" style="background:#FEE2E2;color:#991B1B;font-size:11px;font-weight:800;padding:3px 8px;border-radius:var(--radius-full);display:inline-flex;align-items:center;gap:4px">🔴 فارغة حالياً ${status.isCashRecent ? '⚡ (آخر 15 د)' : ''}</span>`);
      }

      if (status.isWorking || (!status.isWorkRecent && status.allTimeWorking)) {
        badges.push(`<span class="badge atm-badge-card-working" style="font-size:11px;padding:3px 10px;border-radius:var(--radius-full)">⚙️ الماكينة تعمل</span>`);
      } else if (status.isOutOfService || (!status.isWorkRecent && status.allTimeOutOfService)) {
        badges.push(`<span class="badge" style="background:#FEE2E2;color:#DC2626;font-size:11px;font-weight:700;padding:3px 8px;border-radius:var(--radius-full)">⚠️ خارج الخدمة</span>`);
      }

      if (badges.length > 0) {
        atmCashBadge = `<div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">${badges.join('')}</div>`;
      }
    }
  }

  const phoneBtn = place.phone
    ? `<a href="tel:${cleanPhone(place.phone)}" class="place-card__action-btn" title="اتصال" onclick="event.stopPropagation();trackStat('${escAttr(place._key||place.id)}','phoneClicks')">📞</a>`
    : '';

  const liveHours = getPlaceLiveStatus(place.openHours);
  const liveHoursBadge = !isAtm ? `
    <span class="badge" style="background:${liveHours.isOpen ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};color:${liveHours.color};font-weight:800;font-size:11px;padding:2px 8px;border-radius:var(--radius-full);display:inline-flex;align-items:center;gap:4px">
      <span>${liveHours.isOpen ? '🟢' : '🔴'}</span>
      <span>${liveHours.badgeText}</span>
    </span>
  ` : '';

  const docInfo = resolveDoctorSpecialty(place);
  const doctorSpecialtyBadge = docInfo.isDoctor ? `
    <div style="margin:4px 0 2px 0">
      <span class="badge" style="background:#E0F2FE;color:#0369A1;font-weight:800;font-size:11.5px;padding:2px 8px;border-radius:9999px;border:1px solid #BAE6FD;display:inline-flex;align-items:center;gap:4px">
        <span>${docInfo.icon}</span>
        <span>${docInfo.shortLabel || docInfo.specialtyTitle}</span>
      </span>
    </div>
  ` : '';

  const waBtn = place.whatsapp
    ? `<a href="https://wa.me/${formatWhatsApp(place.whatsapp)}" target="_blank" rel="noopener" class="place-card__action-btn place-card__action-btn--whatsapp" title="واتساب" onclick="event.stopPropagation();trackStat('${escAttr(place._key||place.id)}','whatsappClicks')">💬</a>`
    : '';

  const cardClasses = [
    'place-card',
    isSponsored ? 'place-card--sponsored' : '',
    place.isVerified ? 'place-card--verified' : ''
  ].filter(Boolean).join(' ');

  return `
    <article class="${cardClasses}" 
             role="article"
             onclick="window.location.href='${placeUrl}'"
             data-place-id="${escAttr(place._key || place.id)}">
      ${sponsoredTag}
      <div class="place-card__cover">
        ${coverImg}
        <div class="place-card__logo">${logoImg}</div>
      </div>
      <div class="place-card__body">
        <h3 class="place-card__name">
          <span class="truncate">${escHtml(place.name)}</span>
          ${verifiedBadge}
        </h3>
        <div class="place-card__category" style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
          ${liveHoursBadge}
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span>📍 ${escHtml(place.area || 'المنزلة')}</span>
            ${place._distanceStr ? `<span class="badge" style="background:rgba(16,185,129,0.12);color:var(--success);font-size:10.5px;padding:1px 6px;border-radius:var(--radius-sm);font-weight:700">على بعد ${escHtml(place._distanceStr)}</span>` : ''}
            ${deliveryBadge}
          </div>
          ${(() => {
            const isHammad = (place.slug && (place.slug.includes('mhmd-hmad') || place.slug.includes('5lQJ1o'))) || (place.name && place.name.includes('محمد حماد'));
            const rCount = Number(place.reviewCount != null ? place.reviewCount : (place.reviews ? Object.keys(place.reviews).length : (place.stats?.reviewsCount || 0)));
            const rScore = rCount > 0 ? (isHammad ? '5.0' : Number(place.rating || 5.0).toFixed(1)) : '0.0';
            return `
              <div style="display:inline-flex;align-items:center;gap:3px;font-size:11.5px;color:#F59E0B;font-weight:700;background:rgba(245,158,11,0.08);padding:2px 7px;border-radius:var(--radius-sm)">
                <span>★</span>
                <span>${rScore}</span>
                <span style="color:var(--text-muted);font-weight:normal;font-size:10px">(${rCount > 0 ? `${rCount} تقييم` : '0.0'})</span>
              </div>
            `;
          })()}
        </div>
        ${atmCashBadge}
        ${place.description ? `<p class="place-card__description">${escHtml(place.description)}</p>` : ''}
      </div>
      <div class="place-card__footer">
        <a href="${placeUrl}" class="btn btn-outline btn-sm">عرض التفاصيل</a>
        <div class="place-card__actions">
          ${phoneBtn}
          ${waBtn}
        </div>
      </div>
    </article>
  `;
}

/**
 * Render skeleton card placeholder
 */
export function renderPlaceCardSkeleton() {
  return `
    <div class="skeleton-place-card" aria-hidden="true">
      <div class="skeleton-place-card__cover skeleton"></div>
      <div class="skeleton-place-card__body">
        <div class="skeleton-place-card__logo skeleton"></div>
        <div class="skeleton-place-card__title skeleton"></div>
        <div class="skeleton-place-card__subtitle skeleton"></div>
        <div class="skeleton-place-card__text skeleton"></div>
        <div class="skeleton-place-card__text skeleton" style="width:60%"></div>
      </div>
    </div>
  `;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function cleanPhone(phone) {
  return phone?.replace(/\D/g, '') || '';
}

function formatWhatsApp(phone) {
  let cleaned = cleanPhone(phone);
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return '2' + cleaned;
  }
  // If it already starts with 201, return as is
  return cleaned;
}

function getCategoryCardCover(placeOrCatId) {
  const isObj = placeOrCatId && typeof placeOrCatId === 'object';
  const categoryId = (isObj ? placeOrCatId.categoryId : placeOrCatId) || '';
  const customCat = isObj ? (placeOrCatId.customCategory || placeOrCatId.categoryName || '') : '';
  const name = isObj ? (placeOrCatId.name || '') : '';

  const map = {
    'doctor':      { icon: '👨‍⚕️', label: 'دكتور وعيادات', gradient: 'linear-gradient(135deg, #1B4F72 0%, #2980B9 100%)' },
    'pharmacy':    { icon: '💊', label: 'صيدلية', gradient: 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)' },
    'supermarket': { icon: '🛒', label: 'سوبر ماركت', gradient: 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)' },
    'plumber':     { icon: '🪠', label: 'سباك (فني سباكة)', gradient: 'linear-gradient(135deg, #1A5276 0%, #2E86C1 100%)' },
    'carpenter':   { icon: '🪚', label: 'نجار وموبيليا', gradient: 'linear-gradient(135deg, #B9770E 0%, #E67E22 100%)' },
    'tiler':       { icon: '🧱', label: 'مبلط سيراميك', gradient: 'linear-gradient(135deg, #6C3483 0%, #8E44AD 100%)' },
    'painter':     { icon: '🖌️', label: 'نقاش ودهانات', gradient: 'linear-gradient(135deg, #D4AC0D 0%, #F1C40F 100%)' },
    'electrician': { icon: '⚡', label: 'كهربائي منازل', gradient: 'linear-gradient(135deg, #D35400 0%, #E67E22 100%)' },
    'printing':    { icon: '🖨️', label: 'مطبعة ودعاية', gradient: 'linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)' },
    'bakery':      { icon: '🍞', label: 'مخبز وحلواني', gradient: 'linear-gradient(135deg, #D68910 0%, #F39C12 100%)' },
    'phones':      { icon: '📱', label: 'صيانة وموبايل', gradient: 'linear-gradient(135deg, #2E4053 0%, #5D6D7E 100%)' },
    'delivery':    { icon: '🚀', label: 'خدمات توصيل', gradient: 'linear-gradient(135deg, #922B21 0%, #C0392B 100%)' }
  };

  if (map[categoryId]) return map[categoryId];

  // Semantic custom search
  const raw = (customCat + ' ' + name + ' ' + categoryId).toLowerCase();
  let icon = '🏪';
  let label = customCat || 'دليل المنزلة والمطرية الرقمي';

  if (raw.includes('تصوير') || raw.includes('فوتو') || raw.includes('استوديو')) { icon = '📸'; }
  else if (raw.includes('رخام') || raw.includes('جرانيت')) { icon = '🏛️'; }
  else if (raw.includes('برمج') || raw.includes('كمبيوتر') || raw.includes('سوفت وير')) { icon = '💻'; }
  else if (raw.includes('حلو') || raw.includes('تورت') || raw.includes('باتيسري')) { icon = '🍰'; }
  else if (raw.includes('ورد') || raw.includes('زهور')) { icon = '💐'; }
  else if (raw.includes('ميكاب') || raw.includes('بيوتي') || raw.includes('كوافير')) { icon = '💄'; }
  else if (raw.includes('ملابس') || raw.includes('فستان') || raw.includes('أزياء')) { icon = '👗'; }
  else if (raw.includes('عقار') || raw.includes('شقق') || raw.includes('مقاول')) { icon = '🏢'; }
  else if (raw.includes('سيار') || raw.includes('عرب') || raw.includes('ميكانيك')) { icon = '🚗'; }
  else if (raw.includes('توكتوك') || raw.includes('موتوسيكل')) { icon = '🛵'; }
  else if (raw.includes('مطعم') || raw.includes('أكل') || raw.includes('مشويات')) { icon = '🍽️'; }
  else if (raw.includes('كافيه') || raw.includes('قهوة') || raw.includes('مشروبات')) { icon = '☕'; }
  else if (raw.includes('صيدل') || raw.includes('دواء')) { icon = '💊'; }
  else if (raw.includes('دكتور') || raw.includes('طبيب') || raw.includes('عياد')) { icon = '🩺'; }
  else if (raw.includes('ماركت') || raw.includes('سوبر')) { icon = '🛒'; }

  return { icon, label, gradient: 'linear-gradient(135deg, #1B4F72 0%, #154360 100%)' };
}

function getCategoryEmoji(categoryId) {
  return getCategoryCardCover(categoryId).icon;
}

export function getCategoryBadge(place) {
  const catName = place.customCategory || place.categoryName || '';
  const catId = (place.categoryId || '').toLowerCase();

  const dict = {
    'doctor':      { name: 'طبيب وعيادات', icon: '👨‍⚕️', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    'pharmacy':    { name: 'صيدلية', icon: '💊', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
    'supermarket': { name: 'سوبر ماركت', icon: '🛒', bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
    'plumber':     { name: 'سباك', icon: '🪠', bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
    'carpenter':   { name: 'نجار وموبيليا', icon: '🪚', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
    'tiler':       { name: 'مبلط سيراميك', icon: '🧱', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    'painter':     { name: 'نقاش ودهانات', icon: '🖌️', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' },
    'electrician': { name: 'كهربائي', icon: '⚡', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
    'restaurant':  { name: 'مطعم ومأكولات', icon: '🍽️', color: '#C2410C', bg: '#FFF7ED', border: '#FFEDD5' },
    'cafe':        { name: 'كافيه ومشروبات', icon: '☕', color: '#78350F', bg: '#FEF3C7', border: '#FDE68A' },
    'mobile':      { name: 'صيانة وموبايل', icon: '📱', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    'phones':      { name: 'صيانة وموبايل', icon: '📱', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    'clothing':    { name: 'ملابس وأزياء', icon: '👗', color: '#BE185D', bg: '#FDF2F8', border: '#FBCFE8' },
    'gym':         { name: 'جيم ورياضة', icon: '🏋️', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
    'printing':    { name: 'مطبعة ودعاية', icon: '🖨️', color: '#334155', bg: '#F8FAFC', border: '#E2E8F0' },
    'bakery':      { name: 'مخبز وحلواني', icon: '🍞', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    'delivery':    { name: 'خدمات توصيل', icon: '🚀', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
    'barber':      { name: 'حلاق وتصفيف', icon: '💈', color: '#1E293B', bg: '#F1F5F9', border: '#CBD5E1' },
    'mechanic':    { name: 'ميكانيكي سيارات', icon: '🔧', color: '#334155', bg: '#F8FAFC', border: '#E2E8F0' },
    'marble':      { name: 'رخام وجرانيت', icon: '🪨', bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' },
    'ai':          { name: 'ذكاء اصطناعي وبرمجة', icon: '💻', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' }
  };

  let meta = dict[catId];
  if (!meta) {
    const raw = (catName + ' ' + catId + ' ' + (place.name || '')).toLowerCase();
    for (const [k, v] of Object.entries(dict)) {
      if (raw.includes(k) || raw.includes(v.name) || (k === 'doctor' && (raw.includes('دكتور') || raw.includes('طبيب') || raw.includes('عيادة'))) || (k === 'marble' && raw.includes('رخام')) || (k === 'phones' && (raw.includes('هاتف') || raw.includes('هواتف') || raw.includes('موبايل')))) {
        meta = v;
        break;
      }
    }
  }

  const displayName = catName || meta?.name || (place.categoryId ? place.categoryId : 'نشاط تجاري');
  const displayIcon = meta?.icon || '📁';
  const bg = meta?.bg || 'var(--primary-alpha)';
  const color = meta?.color || 'var(--primary)';
  const border = meta?.border || 'rgba(27, 79, 114, 0.2)';

  return `
    <span class="place-card__category-badge" style="background:${bg};color:${color};border-color:${border}">
      <span class="place-card__category-icon">${displayIcon}</span>
      <span class="place-card__category-text">${escHtml(displayName)}</span>
    </span>
  `;
}

