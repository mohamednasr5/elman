/**
 * المنزلة وناسها — PlaceCard Component
 */

import { renderVerifiedBadge, renderDeliveryBadge } from './VerifiedBadge.js';

/**
 * Render a place card HTML string
 */
export function renderPlaceCard(place) {
  const coverImg = place.coverImageUrl
    ? `<img src="${escAttr(place.coverImageUrl)}" alt="${escAttr(place.name)}" loading="lazy" class="lazy" />`
    : `<div class="place-card__cover-placeholder">${getCategoryEmoji(place.categoryId)}</div>`;

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
    ? `<a href="https://wa.me/${cleanPhone(place.whatsapp)}" target="_blank" rel="noopener" class="place-card__action-btn place-card__action-btn--whatsapp" title="واتساب" onclick="event.stopPropagation();trackStat('${escAttr(place._key||place.id)}','whatsappClicks')">💬</a>`
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

function getCategoryEmoji(categoryId) {
  return '🏪';
}
