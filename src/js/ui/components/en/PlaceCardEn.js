import { projectPlaceToEnglish, englishServices } from '../../../core/english-data.js';
import { getOptimizedImageUrl, IMAGE_SIZES } from '../../../services/image-cdn.service.js';
import { getDefaultPlaceAssets } from '../../../utils/category-assets.js';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');

function imagePair(url, size, fallback = '/assets/images/og-whatsapp.jpg') {
  const original = String(url || '').trim();
  const optimized = getOptimizedImageUrl(original, size) || fallback;
  return {
    src: optimized,
    fallback: original && original !== optimized ? original : fallback
  };
}

export function renderEnglishPlaceCard(source = {}) {
  const place = projectPlaceToEnglish(source);
  const assets = getDefaultPlaceAssets(place);
  const coverPair = imagePair(place.coverImageUrl || assets.coverImageUrl, IMAGE_SIZES.THUMB);
  const logoPair = imagePair(place.logoUrl || assets.logoUrl, IMAGE_SIZES.LOGO, '');
  const slug = place.slug || place.id || place._key || '';
  const url = `/en/place/${encodeURIComponent(slug)}`;
  const verified = place.isVerified || place.is_verified;
  const services = englishServices(place);

  const imgAttrs = pair => `src="${esc(pair.src)}" data-fallback="${esc(pair.fallback)}" onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback}else{this.onerror=null;this.removeAttribute('src')};"`;

  return `<article class="en-place-card" data-place-slug="${esc(slug)}">
    <a href="${url}" class="en-place-card__media" aria-label="View ${esc(place.displayName)}">
      <img ${imgAttrs(coverPair)} alt="${esc(place.displayName)}" loading="lazy" decoding="async" width="800" height="480">
      <div class="en-place-card__media-overlay">
        ${verified ? '<span class="en-badge en-badge--verified">✓ Verified</span>' : '<span></span>'}
      </div>
    </a>
    <div class="en-place-card__body">
      <div class="en-place-card__identity">
        ${logoPair.src ? `<img class="en-place-card__logo" ${imgAttrs(logoPair)} alt="" width="44" height="44" loading="lazy" decoding="async">` : ''}
        <div style="min-width:0">
          <h3 class="en-place-card__title">${esc(place.displayName)}</h3>
          <div class="en-place-card__category">${esc(place.displayCategory)}</div>
        </div>
      </div>
      <div class="en-place-card__area">📍 ${esc(place.displayArea)}</div>
      ${place.displayDescription ? `<p class="en-place-card__desc">${esc(place.displayDescription)}</p>` : ''}
      ${services.length ? `<div class="en-place-card__services">${services.slice(0,3).map(s=>`<span class="en-badge en-badge--service">${esc(s)}</span>`).join('')}</div>` : ''}
      <div class="en-place-card__footer">
        <span class="en-place-card__meta">${place.reviewCount || place.reviewsCount ? `★ ${Number(place.rating || 0).toFixed(1)} · ${Number(place.reviewCount || place.reviewsCount)} reviews` : 'Local listing'}</span>
        <div class="en-place-card__actions">
          ${place.phone ? `<a class="en-place-card__action" href="tel:${esc(place.phone)}" aria-label="Call ${esc(place.displayName)}">📞</a>` : ''}
          ${place.whatsapp ? `<a class="en-place-card__action" href="https://wa.me/${esc(String(place.whatsapp).replace(/\D/g,''))}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(place.displayName)}">💬</a>` : ''}
          <a class="en-place-card__action" href="${url}" aria-label="View ${esc(place.displayName)}">→</a>
        </div>
      </div>
    </div>
  </article>`;
}

export function renderEnglishPlaceCardSkeleton() {
  return '<div class="en-place-card" aria-hidden="true"><div class="en-place-card__media"></div><div class="en-place-card__body"><div class="skeleton" style="height:20px;width:65%;margin-bottom:10px"></div><div class="skeleton" style="height:14px;width:42%;margin-bottom:16px"></div><div class="skeleton" style="height:42px;width:100%"></div></div></div>';
}
