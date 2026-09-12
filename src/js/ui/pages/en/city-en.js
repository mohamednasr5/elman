/**
 * Dalil El Manzala & El Matariya — English City Hubs (El Manzala & El Matariya)
 */

import { getPublishedPlaces } from '../../../core/db.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../../components/PlaceCard.js';

export async function renderEnglishCityPage($container, cityKey = 'manzala') {
  const isManzala = cityKey === 'manzala';
  const cityName = isManzala ? 'El Manzala' : 'El Matariya';
  const title = `Guide to ${cityName} | Dalil El Manzala & El Matariya`;
  document.title = title;

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🏙️ ${escHtml(cityName)} Directory
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Explore all verified places, clinics, pharmacies, restaurants, and craftsmen located in ${escHtml(cityName)}.
        </p>
      </div>
    </div>

    <div class="container section">
      <div class="search-stats-bar" style="margin-bottom:var(--space-4);color:var(--text-secondary);font-size:var(--font-size-sm)">
        <span id="city-count-label">Loading places in ${escHtml(cityName)}...</span>
      </div>

      <div class="grid grid-4" id="city-places-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  const places = await getPublishedPlaces({ limit: 150 });
  const arMatch = isManzala ? 'المنزلة' : 'المطرية';
  const filtered = (places || []).filter(p => {
    const a = (p.areaEn || p.area || '').toLowerCase();
    return a.includes(cityName.toLowerCase()) || (p.area || '').includes(arMatch);
  });

  const countLabel = document.getElementById('city-count-label');
  const grid = document.getElementById('city-places-grid');

  if (countLabel) countLabel.textContent = `Found ${filtered.length} places in ${cityName}`;
  if (grid) {
    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:48px 16px">
          <div class="empty-state__icon">📍</div>
          <p class="empty-state__text">No places found in this city yet.</p>
          <a href="/en/places/" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse All Places</a>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(p => renderPlaceCard(p)).join('');
    }
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
