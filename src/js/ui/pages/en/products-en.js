/**
 * Dalil El Manzala & El Matariya — English Products Page
 * Dedicated native English products catalog renderer
 */

import { getPublishedPlaces } from '../../../core/db.js';

export async function renderEnglishProductsPage($container) {
  document.title = 'Products Catalog | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🛍️ Products & Catalogs
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Browse local products, merchandise, and catalogs from verified stores in El Manzala & El Matariya.
        </p>
      </div>
    </div>

    <div class="container section">
      <div class="empty-state" style="text-align:center;padding:56px 16px">
        <div class="empty-state__icon">📦</div>
        <h3 class="empty-state__title">Products Catalog Coming Soon</h3>
        <p class="empty-state__text">Local store catalogs are currently being updated by verified business owners.</p>
        <a href="/en/places/" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse Verified Places &rarr;</a>
      </div>
    </div>
  `;
}
