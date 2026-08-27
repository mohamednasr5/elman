/**
 * المنزلة وناسها — Daily Offers Page
 */

import { getActiveOffers } from '../../core/db.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { daysUntil, formatDateRange } from '../../utils/date.js';
import { setMeta, setBreadcrumbSchema } from '../../utils/seo.js';

export async function renderOffersPage($container) {
  setMeta({
    title: 'العروض اليومية والخصومات في المنزلة',
    description: 'تصفح أحدث عروض وتخفيضات محلات وأنشطة مدينة المنزلة المحدثة يومياً',
    url: '/#/offers'
  });

  setBreadcrumbSchema([
    { name: 'الرئيسية', url: '/#/' },
    { name: 'العروض اليومية', url: '/#/offers' }
  ]);

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🏷️ العروض والتخفيضات اليومية
        </h1>
        <p style="color:rgba(255,255,255,0.8);max-width:540px;margin:0 auto">
          أفضل الصفقات والخصومات المتاحة حالياً من محلات وأنشطة مدينة المنزلة
        </p>
      </div>
    </div>

    <div class="container section">
      <div class="places-grid" id="offers-page-grid">
        ${Array(6).fill('<div class="skeleton-place-card" style="height:280px"><div class="skeleton-place-card__cover skeleton"></div></div>').join('')}
      </div>
    </div>
  `;

  try {
    const offers = await getActiveOffers(50);
    const grid = document.getElementById('offers-page-grid');
    if (!grid) return;

    if (!offers || offers.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🏷️</div>
          <h2 class="empty-state__title">لا توجد عروض نشطة حالياً</h2>
          <p class="empty-state__text">تأكد من متابعة الصفحة لمعرفة أحدث العروض والخصومات في المنزلة</p>
          <a href="#/dashboard" class="btn btn-primary">أضف عرضاً لمحلك</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = offers.map(offer => {
      const discount = offer.discountPercent || calcDiscount(offer.oldPrice, offer.newPrice);
      const days = daysUntil(offer.endDate);

      return `
        <article class="offer-card animate-fade-in" onclick="window.location.hash='#/place/${escAttr(offer.placeSlug || '')}'" style="cursor:pointer">
          <div class="offer-card__image">
            ${offer.imageUrl 
              ? `<img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" loading="lazy" />` 
              : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:var(--primary-alpha)">🏷️</div>`
            }
            ${discount > 0 ? `<span class="offer-card__discount-badge">خصم -${discount}%</span>` : ''}
          </div>
          <div class="offer-card__body">
            <h2 class="offer-card__title" style="font-size:var(--font-size-base)">${escHtml(offer.title)}</h2>
            ${offer.placeName ? `<div class="offer-card__place">📍 ${escHtml(offer.placeName)}</div>` : ''}
            ${offer.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-3)">${escHtml(offer.description)}</p>` : ''}
            
            <div class="offer-card__price">
              <span class="offer-card__price-new">${formatPrice(offer.newPrice)}</span>
              ${offer.oldPrice ? `<span class="offer-card__price-old">${formatPrice(offer.oldPrice)}</span>` : ''}
            </div>

            <div class="offer-card__expiry">
              ⏰ ${days > 0 ? `ينتهي خلال ${days} يوم` : 'ينتهي اليوم'} (${formatDateRange(offer.startDate, offer.endDate)})
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('[OffersPage] Error:', err);
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
