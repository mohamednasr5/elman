/**
 * المنزلة وناسها — PlaceCard Component
 */

import { renderVerifiedBadge, renderDeliveryBadge } from './VerifiedBadge.js';

/**
 * Render a place card HTML string
 */
export function renderPlaceCard(place) {
  const catStyle = getCategoryCardCover(place.categoryId);
  const coverImg = place.coverImageUrl
    ? `<img src="${escAttr(place.coverImageUrl)}" alt="${escAttr(place.name)}" loading="lazy" />`
    : `<div class="place-card__cover-placeholder" style="background:${catStyle.gradient}">
        <span class="place-card__cover-icon">${catStyle.icon}</span>
        <span class="place-card__cover-tag">${escHtml(catStyle.label)}</span>
       </div>`;

  const logoImg = place.logoUrl
    ? `<img src="${escAttr(place.logoUrl)}" alt="${escAttr(place.name)} logo" loading="lazy" />`
    : `<div class="place-card__logo-placeholder">${getCategoryEmoji(place.categoryId)}</div>`;

  const verifiedBadge = place.isVerified ? renderVerifiedBadge() : '';
  const deliveryBadge = place.deliveryType ? renderDeliveryBadge(place.deliveryType) : '';
  const placeUrl = `place.html?slug=${encodeURIComponent(place.slug || place.id || place._key)}`;

  const phoneBtn = place.phone
    ? `<a href="tel:${cleanPhone(place.phone)}" class="place-card__action-btn" title="اتصال" onclick="event.stopPropagation();trackStat('${escAttr(place._key||place.id)}','phoneClicks')">📞</a>`
    : '';

  const waBtn = place.whatsapp
    ? `<a href="https://wa.me/${formatWhatsApp(place.whatsapp)}" target="_blank" rel="noopener" class="place-card__action-btn place-card__action-btn--whatsapp" title="واتساب" onclick="event.stopPropagation();trackStat('${escAttr(place._key||place.id)}','whatsappClicks')">💬</a>`
    : '';

  return `
    <article class="place-card${place.isVerified ? ' place-card--verified' : ''}" 
             role="article"
             onclick="window.location.href='${placeUrl}'"
             data-place-id="${escAttr(place._key || place.id)}">
      <div class="place-card__cover">
        ${coverImg}
        <div class="place-card__logo">${logoImg}</div>
      </div>
      <div class="place-card__body">
        <h3 class="place-card__name">
          <span class="truncate">${escHtml(place.name)}</span>
          ${verifiedBadge}
        </h3>
        <div class="place-card__category">
          📍 ${escHtml(place.area || 'المنزلة')}
          ${deliveryBadge}
        </div>
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

function getCategoryCardCover(categoryId) {
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
  return map[categoryId] || { icon: '🏪', label: 'المنزلة وناسها', gradient: 'linear-gradient(135deg, #1B4F72 0%, #154360 100%)' };
}

function getCategoryEmoji(categoryId) {
  return getCategoryCardCover(categoryId).icon;
}
