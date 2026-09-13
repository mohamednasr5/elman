/**
 * Dalil El Manzala & El Matariya — English Search Page
 * Dedicated native English search results renderer
 */

import { getPublishedPlaces, getCategories } from '../../../core/db.js';
import { renderEnglishPlaceCard, renderEnglishPlaceCardSkeleton } from '../../components/en/PlaceCardEn.js';
import { executeFastSearch, warmupSearchEngine } from '../../../services/search-engine.service.js';
import { isPhoneSearchQuery, matchPlaceByPhone } from '../../../utils/phone.js';
import { translateArea, translateCategory } from '../../../utils/category-i18n.js';

export async function renderEnglishSearchPage($container, { q = '' } = {}) {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = q || urlParams.get('q') || '';

  document.title = initialQuery ? `Search results for "${initialQuery}" | Dalil El Manzala` : 'Search Directory | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🔍 Search Directory
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Find doctors, clinics, pharmacies, shops, craftsmen, and phone numbers in El Manzala & El Matariya.
        </p>
      </div>
    </div>

    <div class="container section">
      <div style="max-width:640px;margin:0 auto var(--space-6)">
        <div style="position:relative">
          <input type="search" id="search-page-input" class="form-input" placeholder="Search by name, doctor specialty, craft, or phone..." value="${escAttr(initialQuery)}" style="font-size:16px;padding:12px 18px" autocomplete="off" />
        </div>
      </div>

      <div class="search-stats-bar" style="margin-bottom:var(--space-4);color:var(--text-secondary);font-size:var(--font-size-sm)">
        <span id="search-count-label">Loading search engine...</span>
      </div>

      <div class="grid grid-4" id="search-results-grid">
        ${Array(8).fill(renderEnglishPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  const [places, categories] = await Promise.all([
    getPublishedPlaces({ limit: 150 }),
    getCategories()
  ]);

  warmupSearchEngine(places || [], categories || []);

  const input = document.getElementById('search-page-input');
  const countLabel = document.getElementById('search-count-label');
  const grid = document.getElementById('search-results-grid');

  function doSearch() {
    const val = (input?.value || '').trim();
    if (!val) {
      if (countLabel) countLabel.textContent = `Showing all ${places.length} places`;
      grid.innerHTML = (places || []).slice(0, 16).map(p => renderEnglishPlaceCard(p)).join('');
      return;
    }

    let results = [];
    if (isPhoneSearchQuery(val)) {
      results = (places || []).filter(p => matchPlaceByPhone(p, val));
    } else {
      results = executeFastSearch(val, { limit: 50 });
      if (!results || !results.length) {
        const lower = val.toLowerCase();
        results = (places || []).filter(p => {
          const nameEn = String(p.nameEn || p.name_en || '').toLowerCase();
          const nameAr = String(p.name || '').toLowerCase();
          const desc = String(p.descriptionEn || p.description || '').toLowerCase();
          return nameEn.includes(lower) || nameAr.includes(lower) || desc.includes(lower);
        });
      }
    }

    if (countLabel) countLabel.textContent = `Found ${results.length} results for "${val}"`;

    if (!results.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">No results found for "${escHtml(val)}"</h3>
          <p class="empty-state__text">Please check the spelling or search for broader terms like "clinic", "pharmacy", or "supermarket".</p>
          <a href="/en/places/" class="btn btn-primary btn-sm" style="margin-top:1rem">Browse All Places</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = results.map(p => renderEnglishPlaceCard(p)).join('');
  }

  input?.addEventListener('input', doSearch);
  doSearch();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
