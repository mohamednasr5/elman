/**
 * Dalil El Manzala & El Matariya — English Favorites Page
 * Dedicated native English saved places renderer
 */

import { getFavoriteIds } from '../../../services/favorites.service.js';
import { getPublishedPlaces } from '../../../core/db.js';
import { renderEnglishPlaceCard, renderEnglishPlaceCardSkeleton } from '../../components/en/PlaceCardEn.js';

export async function renderEnglishFavoritesPage($container) {
  document.title = 'Saved Places & Favorites | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          ❤️ Saved Places & Favorites
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Quickly access your bookmarked doctors, pharmacies, shops, and services.
        </p>
      </div>
    </div>

    <div class="container section">
      <div class="grid grid-4" id="fav-places-grid">
        ${Array(4).fill(renderEnglishPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  const favIds = getFavoriteIds() || [];
  const grid = document.getElementById('fav-places-grid');

  if (!favIds.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
        <div class="empty-state__icon">🤍</div>
        <h3 class="empty-state__title">No saved places yet</h3>
        <p class="empty-state__text">Click the heart icon on any place or clinic card to save it here for instant access.</p>
        <a href="/en/places/" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse Places Directory</a>
      </div>
    `;
    return;
  }

  const places = await getPublishedPlaces({ limit: 200 });
  const favPlaces = (places || []).filter(p => favIds.includes(String(p.id)) || favIds.includes(String(p._key)) || favIds.includes(String(p.slug)));

  if (!favPlaces.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
        <div class="empty-state__icon">🤍</div>
        <h3 class="empty-state__title">Saved places not found</h3>
        <p class="empty-state__text">Your saved places may have been updated or removed.</p>
        <a href="/en/places/" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse Places Directory</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = favPlaces.map(p => renderEnglishPlaceCard(p)).join('');
}