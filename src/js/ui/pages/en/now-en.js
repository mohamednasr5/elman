/**
 * Dalil El Manzala & El Matariya — English Open Now Page
 * Dedicated native English "Open Now" directory renderer
 */

import { getPublishedPlaces, getCategories } from '../../../core/db.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../../components/PlaceCard.js';
import { isPlaceOpen } from '../../../utils/date.js';
import { VILLAGE_NAMES_EN, translateCategory, translateArea } from '../../../utils/category-i18n.js';

export async function renderEnglishNowPage($container) {
  document.title = 'Open Right Now | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🟢 Places Open Right Now
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          Find pharmacies, clinics, restaurants, supermarkets, and emergency services currently open in El Manzala & El Matariya.
        </p>
      </div>
    </div>

    <div class="container section">
      <div class="filter-bar">
        <div style="position:relative;flex:1;min-width:200px">
          <input type="search" id="now-search-filter" class="form-input" placeholder="Search open places..." style="margin:0" />
        </div>
        <select id="now-category-filter" class="form-select" style="max-width:200px">
          <option value="">All Categories</option>
        </select>
        <select id="now-area-filter" class="form-select" style="max-width:200px">
          <option value="">All Towns & Villages</option>
          ${Object.values(VILLAGE_NAMES_EN).map(en => `<option value="${escAttr(en)}">${escHtml(en)}</option>`).join('')}
        </select>
      </div>

      <div class="search-stats-bar" style="margin-bottom:var(--space-4);color:var(--text-secondary);font-size:var(--font-size-sm)">
        <span id="now-count-label">Checking open places...</span>
      </div>

      <div class="grid grid-4" id="now-places-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  const [places, categories] = await Promise.all([
    getPublishedPlaces({ limit: 100 }),
    getCategories()
  ]);

  const catSelect = document.getElementById('now-category-filter');
  if (catSelect && categories) {
    categories.forEach(c => {
      const slug = c.slug || c._key || c.id;
      const name = translateCategory(c.nameEn || c.name || slug, true);
      catSelect.innerHTML += `<option value="${escAttr(slug)}">${escHtml(name)}</option>`;
    });
  }

  const grid = document.getElementById('now-places-grid');
  const countLabel = document.getElementById('now-count-label');
  const searchInput = document.getElementById('now-search-filter');
  const areaSelect = document.getElementById('now-area-filter');

  function getOpenPlaces() {
    return (places || []).filter(p => {
      if (!p) return false;
      const hours = p.openHours || p.workingHours || p.working_hours;
      // If no hours specified, consider open by default unless marked unavailable
      if (!hours || typeof hours !== 'object' || Object.keys(hours).length === 0) return true;
      return isPlaceOpen(hours);
    });
  }

  const openList = getOpenPlaces();

  function applyFilter() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    const selCat = (catSelect?.value || '').trim().toLowerCase();
    const selArea = (areaSelect?.value || '').trim().toLowerCase();

    const filtered = openList.filter(p => {
      if (selCat) {
        const cId = String(p.categoryId || p.category_id || '').toLowerCase();
        const cName = String(p.categoryName || p.category || '').toLowerCase();
        if (cId !== selCat && !cName.includes(selCat)) return false;
      }
      if (selArea) {
        const pArea = (p.areaEn || translateArea(p.area, true) || '').toLowerCase();
        if (!pArea.includes(selArea)) return false;
      }
      if (q) {
        const name = String(p.nameEn || p.name_en || p.name || '').toLowerCase();
        const desc = String(p.descriptionEn || p.description_en || p.description || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });

    if (countLabel) countLabel.textContent = `${filtered.length} places open right now`;

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
          <div class="empty-state__icon">🌙</div>
          <h3 class="empty-state__title">No open places matching your filter</h3>
          <p class="empty-state__text">Try checking other categories, towns, or reset your filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => renderPlaceCard(p)).join('');
  }

  searchInput?.addEventListener('input', applyFilter);
  catSelect?.addEventListener('change', applyFilter);
  areaSelect?.addEventListener('change', applyFilter);

  applyFilter();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
