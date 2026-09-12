/**
 * Dalil El Manzala & El Matariya — English Offers Page
 * Dedicated native English offers renderer
 */

import { getActiveOffers, getPublishedPlaces } from '../../../core/db.js';
import { mountSponsoredShowcase } from '../../components/SponsoredShowcase.js';
import { formatPrice, calcDiscount } from '../../../utils/arabic.js';
import { daysUntil } from '../../../utils/date.js';

export async function renderEnglishOffersPage($container) {
  document.title = 'Special Offers & Discounts | Dalil El Manzala & El Matariya';

  const urlParams = new URLSearchParams(window.location.search);
  const placeSlugFilter = urlParams.get('place') || '';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🏷️ Special Offers & Daily Deals
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          The best verified deals, promotions, and discounts from local businesses in El Manzala & El Matariya.
        </p>
      </div>
    </div>

    <div class="container section">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px;max-width:460px">
          <input type="search" id="offers-search-input" class="form-input" placeholder="🔍 Search offers or business names..." style="margin:0" />
        </div>
      </div>

      <div id="offers-sponsored-showcase" style="margin-bottom:var(--space-6)"></div>
      <div class="grid grid-4" id="offers-page-grid">
        ${Array(6).fill('<div class="skeleton-place-card skeleton" style="height:260px"></div>').join('')}
      </div>
    </div>
  `;

  const [offers, places] = await Promise.all([
    getActiveOffers(50),
    getPublishedPlaces({ limit: 100 })
  ]);

  mountSponsoredShowcase('offers-sponsored-showcase', places || [], {
    title: 'Featured Places & Verified Listings',
    subtitle: 'Businesses offering special deals and verified quality'
  });

  const grid = document.getElementById('offers-page-grid');
  const searchInput = document.getElementById('offers-search-input');

  function renderList(list) {
    if (!grid) return;
    if (!list || !list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
          <div class="empty-state__icon">🏷️</div>
          <h3 class="empty-state__title">No active offers right now</h3>
          <p class="empty-state__text">Check back soon for new discounts and exclusive local promotions.</p>
          <a href="/en/places/" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse All Places</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(o => {
      const disc = o.discountPercent || calcDiscount(o.oldPrice, o.newPrice);
      const left = daysUntil(o.endDate);
      const slug = o.placeSlug || '';
      const title = o.titleEn || o.title || 'Special Offer';
      const placeName = o.placeNameEn || o.placeName || '';
      return `
        <article class="offer-card" style="cursor:pointer" onclick="window.location.href='/en/place/${encodeURIComponent(slug)}'">
          <div class="offer-card__image">
            ${o.imageUrl ? `<img src="${escAttr(o.imageUrl)}" alt="${escAttr(title)}" loading="lazy" />` : '<div style="width:100%;height:100%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:2rem">🏷️</div>'}
            ${disc > 0 ? `<span class="offer-card__discount-badge">-${disc}%</span>` : ''}
          </div>
          <div class="offer-card__body">
            <h3 class="offer-card__title">${escHtml(title)}</h3>
            ${placeName ? `<div class="offer-card__place">📍 ${escHtml(placeName)}</div>` : ''}
            ${o.newPrice ? `
              <div class="offer-card__price">
                <span class="offer-card__price-new">${escHtml(o.newPrice)} EGP</span>
                ${o.oldPrice ? `<span class="offer-card__price-old">${escHtml(o.oldPrice)} EGP</span>` : ''}
              </div>
            ` : ''}
            <div class="offer-card__expiry">
              ⏱️ ${left > 0 ? `Expires in ${left} days` : 'Expires today'}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  let currentList = offers || [];
  if (placeSlugFilter) {
    currentList = currentList.filter(o => o.placeSlug === placeSlugFilter);
  }
  renderList(currentList);

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { renderList(currentList); return; }
    const filtered = currentList.filter(o => {
      const t = String(o.titleEn || o.title || '').toLowerCase();
      const p = String(o.placeNameEn || o.placeName || '').toLowerCase();
      return t.includes(q) || p.includes(q);
    });
    renderList(filtered);
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
