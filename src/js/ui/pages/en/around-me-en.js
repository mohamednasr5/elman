/**
 * Dalil El Manzala & El Matariya — English Around Me Page
 * Dedicated native English GPS distance directory renderer
 */

import { getPublishedPlaces } from '../../../core/db.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../../components/PlaceCard.js';
import { getUserLocation, sortPlacesByDistance } from '../../../utils/maps.js';

export async function renderEnglishAroundMePage($container) {
  document.title = 'Places Around Me | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          📍 Places & Services Around Me
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Find the closest verified businesses, doctors, and services based on your live GPS location.
        </p>
      </div>
    </div>

    <div class="container section">
      <div id="around-me-gps-prompt" style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;text-align:center;margin-bottom:24px">
        <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">Enable GPS Location Access</h3>
        <p style="color:var(--text-secondary);font-size:14px;max-width:480px;margin:0 auto 16px">
          Click the button below to allow location access and discover nearby places in El Manzala & El Matariya ordered by distance.
        </p>
        <button type="button" class="btn btn-primary" id="btn-locate-me">
          <span>📡 Locate Me & Sort by Distance</span>
        </button>
      </div>

      <div class="search-stats-bar" style="margin-bottom:var(--space-4);color:var(--text-secondary);font-size:var(--font-size-sm)">
        <span id="around-count-label">Loading places...</span>
      </div>

      <div class="grid grid-4" id="around-places-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  const places = await getPublishedPlaces({ limit: 100 });
  const grid = document.getElementById('around-places-grid');
  const countLabel = document.getElementById('around-count-label');
  const locateBtn = document.getElementById('btn-locate-me');
  const promptBox = document.getElementById('around-me-gps-prompt');

  function renderList(list, userCoords = null) {
    if (!grid) return;
    if (countLabel) countLabel.textContent = `Showing ${list.length} places`;
    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
          <div class="empty-state__icon">📍</div>
          <h3 class="empty-state__title">No nearby places found</h3>
          <p class="empty-state__text">Make sure location services are enabled or try browsing all places.</p>
          <a href="/en/places/" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse All Places</a>
        </div>
      `;
      return;
    }
    grid.innerHTML = list.map(p => renderPlaceCard(p)).join('');
  }

  renderList(places || []);

  locateBtn?.addEventListener('click', async () => {
    locateBtn.disabled = true;
    locateBtn.textContent = 'Acquiring GPS location...';
    try {
      const coords = await getUserLocation();
      const sorted = sortPlacesByDistance(places || [], coords);
      promptBox.style.display = 'none';
      renderList(sorted, coords);
    } catch (err) {
      alert('Could not access GPS location. Please check browser permissions and try again.');
      locateBtn.disabled = false;
      locateBtn.textContent = '📡 Try Again';
    }
  });
}
