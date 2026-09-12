/**
 * Dalil El Manzala & El Matariya — English Popular Places Page
 * Dedicated native English popular places renderer
 */

import { getPublishedPlaces, getCategories } from '../../../core/db.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../../components/PlaceCard.js';
import { translateCategory, VILLAGE_NAMES_EN } from '../../../utils/category-i18n.js';

export async function renderEnglishPopularPage($container, { filter = 'views', category = '', area = '', q = '' } = {}) {
  document.title = 'Most Popular & Top Rated Places | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          ⭐ Most Popular Places
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px">
          The most viewed, highest rated, and top recommended places across El Manzala and El Matariya.
        </p>
      </div>
    </div>

    <div class="container section">
      <div class="filter-bar">
        <select id="popular-sort-filter" class="form-select" style="max-width:220px">
          <option value="views" ${filter === 'views' ? 'selected' : ''}>👁️ Most Viewed</option>
          <option value="rating" ${filter === 'rating' ? 'selected' : ''}>★ Highest Rated</option>
          <option value="reviews" ${filter === 'reviews' ? 'selected' : ''}>💬 Most Reviewed</option>
        </select>
        <select id="popular-category-filter" class="form-select" style="max-width:200px">
          <option value="">All Categories</option>
        </select>
        <select id="popular-area-filter" class="form-select" style="max-width:200px">
          <option value="">All Towns & Villages</option>
          ${Object.values(VILLAGE_NAMES_EN).map(en => `<option value="${escAttr(en)}" ${area.toLowerCase() === en.toLowerCase() ? 'selected' : ''}>${escHtml(en)}</option>`).join('')}
        </select>
      </div>

      <div class="grid grid-4" id="popular-places-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  const [places, categories] = await Promise.all([
    getPublishedPlaces({ limit: 100 }),
    getCategories()
  ]);

  const catSelect = document.getElementById('popular-category-filter');
  if (catSelect && categories) {
    categories.forEach(c => {
      const slug = c.slug || c._key || c.id;
      const name = translateCategory(c.nameEn || c.name || slug, true);
      catSelect.innerHTML += `<option value="${escAttr(slug)}" ${category === slug ? 'selected' : ''}>${escHtml(name)}</option>`;
    });
  }

  const grid = document.getElementById('popular-places-grid');
  const sortSelect = document.getElementById('popular-sort-filter');
  const areaSelect = document.getElementById('popular-area-filter');

  function update() {
    const s = sortSelect?.value || 'views';
    const c = catSelect?.value || '';
    const a = areaSelect?.value || '';

    let list = [...(places || [])];
    if (c) list = list.filter(p => p.categoryId === c || p.categoryName === c);
    if (a) list = list.filter(p => (p.areaEn || p.area || '').toLowerCase().includes(a.toLowerCase()));

    if (s === 'rating') {
      list.sort((x, y) => Number(y.rating || 5) - Number(x.rating || 5));
    } else if (s === 'reviews') {
      list.sort((x, y) => Number(y.reviewCount || 0) - Number(x.reviewCount || 0));
    } else {
      list.sort((x, y) => Number(y.viewsCount || y.viewCount || 0) - Number(x.viewsCount || x.viewCount || 0));
    }

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
          <div class="empty-state__icon">⭐</div>
          <h3 class="empty-state__title">No popular places found</h3>
          <p class="empty-state__text">Try adjusting your category or town selection.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(p => renderPlaceCard(p)).join('');
  }

  sortSelect?.addEventListener('change', update);
  catSelect?.addEventListener('change', update);
  areaSelect?.addEventListener('change', update);

  update();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
