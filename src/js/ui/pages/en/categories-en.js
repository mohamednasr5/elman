/**
 * Dalil El Manzala & El Matariya — English Categories Page
 * Handles both the /en/categories/ list and /en/category/{slug}/ views
 */

import { getCategories, getPlacesByCategory, getPublishedPlaces } from '../../../core/db.js';
import { getCurrentUser } from '../../../core/auth.js';
import { renderPlaceCard } from '../../components/PlaceCard.js';
import { mountSponsoredShowcase } from '../../components/SponsoredShowcase.js';
import { PROFESSION_CATEGORIES, getCategoryBySlug, getCategorySvg } from '../../../utils/professions-data.js';
import { getCategoryVisualMeta, renderCategoryCardIcon } from '../../../utils/category-visual.js';
import { translateCategory, translateArea } from '../../../utils/category-i18n.js';

export async function renderEnglishCategoriesPage($container) {
  document.title = 'Categories & Activities | Dalil El Manzala & El Matariya';

  $container.innerHTML = `
    <div class="container" style="padding-top:var(--space-3)">
      <div class="page-back-bar">
        <button type="button" class="btn-page-back" id="btn-categories-back" title="Go Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 19 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
        <nav class="page-breadcrumbs" aria-label="Breadcrumb">
          <a href="/en/">Home</a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">Categories & Activities</span>
        </nav>
      </div>
    </div>

    <div class="category-page-header">
      <div class="container text-center">
        <h1 style="font-size:var(--font-size-3xl);font-weight:800;color:var(--primary);margin-bottom:var(--space-2)">
          Directory Categories
        </h1>
        <p style="color:var(--text-secondary);max-width:540px;margin:0 auto">
          Browse local businesses, clinics, shops, and craftsmen in El Manzala, El Matariya, and surrounding towns by activity.
        </p>
      </div>
    </div>

    <div class="container section">
      <div id="categories-sponsored-showcase" style="margin-bottom:var(--space-6)"></div>
      <div class="categories-grid" id="all-categories-grid">
        ${Array(12).fill('<div class="skeleton-category-card"><div class="skeleton-category-card__icon skeleton"></div><div class="skeleton-category-card__name skeleton"></div></div>').join('')}
      </div>
    </div>
  `;

  document.getElementById('btn-categories-back')?.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/en/';
  });

  const [rawCategories, places] = await Promise.all([
    getCategories(),
    getPublishedPlaces({ limit: 100 })
  ]);

  const catMap = new Map();
  PROFESSION_CATEGORIES.forEach(pc => {
    catMap.set(pc.slug, { ...pc, _key: pc.slug, isCraft: true });
  });
  (rawCategories || []).forEach(rc => {
    const slug = rc.slug || rc._key || rc.id;
    if (!catMap.has(slug)) catMap.set(slug, rc);
  });
  const categories = Array.from(catMap.values());

  mountSponsoredShowcase('categories-sponsored-showcase', places || [], {
    title: 'Featured Places & Verified Listings',
    subtitle: 'Recommended businesses across all directory categories'
  });

  const grid = document.getElementById('all-categories-grid');
  if (!grid) return;

  grid.innerHTML = categories.map(c => {
    const slug = c.slug || c._key || c.id || '';
    const visual = getCategoryVisualMeta(c);
    const icon = renderCategoryCardIcon(c, { size: 40 });
    const name = translateCategory(c.nameEn || c.name || slug, true);
    return `
      <a href="/en/category/${encodeURIComponent(slug)}/" class="category-card animate-fade-in" style="--cat-color:${visual.color};--cat-bg:${visual.bgColor};--cat-border:${visual.borderColor}">
        <div class="category-card__icon" style="background:${visual.bgColor};border-color:${visual.borderColor}">
          ${icon}
        </div>
        <div class="category-card__name">${escHtml(name)}</div>
      </a>
    `;
  }).join('');
}

export async function renderEnglishCategoryPage($container, { slug, query, user } = {}) {
  const decodedSlug = slug ? decodeURIComponent(slug).toLowerCase().trim() : '';

  const rawCategories = (await getCategories()) || [];
  const catMap = new Map();
  PROFESSION_CATEGORIES.forEach(pc => {
    catMap.set(pc.slug.toLowerCase(), { ...pc, _key: pc.slug, isCraft: true });
  });
  rawCategories.forEach(rc => {
    const s = String(rc.slug || rc._key || rc.id || '').toLowerCase();
    if (!catMap.has(s)) catMap.set(s, rc);
  });
  const categories = Array.from(catMap.values());

  const cat = categories.find(c => 
    c.slug?.toLowerCase() === decodedSlug || 
    c._key?.toLowerCase() === decodedSlug || 
    c.id?.toLowerCase() === decodedSlug ||
    c.nameEn?.toLowerCase() === decodedSlug ||
    c.name?.toLowerCase() === decodedSlug
  );

  if (!cat) {
    $container.innerHTML = `
      <div class="container section text-center" style="padding:60px 16px">
        <h1 style="color:var(--primary);margin-bottom:1rem">Category Not Found</h1>
        <p style="color:var(--text-secondary);margin-bottom:2rem">The category you requested could not be found or has been moved.</p>
        <a href="/en/categories/" class="btn btn-primary">Browse All Categories</a>
      </div>
    `;
    return;
  }

  const craftCat = getCategoryBySlug(cat.slug || cat._key || cat.id);
  const catVisual = getCategoryVisualMeta(craftCat || cat);
  const catName = translateCategory(cat.nameEn || cat.name || cat.slug, true);

  document.title = `${catName} | Dalil El Manzala & El Matariya`;

  $container.innerHTML = `
    <div class="container" style="padding-top:var(--space-3)">
      <div class="page-back-bar">
        <button type="button" class="btn-page-back" id="btn-cat-back" title="Back to categories">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 19 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
        <nav class="page-breadcrumbs" aria-label="Breadcrumb">
          <a href="/en/">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="/en/categories/">Categories</a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${escHtml(catName)}</span>
        </nav>
      </div>
    </div>

    <div class="category-page-header">
      <div class="container text-center">
        <div class="category-page-icon" style="margin:0 auto var(--space-4);width:76px;height:76px;background:${catVisual.bgColor};border:2px solid ${catVisual.borderColor};border-radius:24px;display:flex;align-items:center;justify-content:center">
          ${renderCategoryCardIcon(craftCat || cat, { size: 48 })}
        </div>
        <h1 style="font-size:var(--font-size-3xl);font-weight:800;color:var(--primary);margin-bottom:var(--space-2)">
          ${escHtml(catName)} in El Manzala & El Matariya
        </h1>
        <p style="color:var(--text-secondary);max-width:540px;margin:0 auto">
          Verified places, clinics, shops, and professionals in ${escHtml(catName)}.
        </p>
      </div>
    </div>

    <div class="container section">
      <!-- Search within category -->
      <div style="margin-bottom:var(--space-6);max-width:500px">
        <input type="search" id="cat-search-input" class="form-input" placeholder="Search within ${escAttr(catName)}..." style="margin:0" />
      </div>

      <div class="search-stats-bar" style="margin-bottom:var(--space-4);color:var(--text-secondary);font-size:var(--font-size-sm)">
        <span id="cat-count-label">Loading places...</span>
      </div>

      <div class="grid grid-4" id="cat-places-grid">
        ${Array(8).fill('<div class="skeleton-place-card skeleton"></div>').join('')}
      </div>
    </div>
  `;

  document.getElementById('btn-cat-back')?.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/en/categories/';
  });

  const catPlaces = await getPlacesByCategory(cat.slug || cat._key || cat.id);
  const grid = document.getElementById('cat-places-grid');
  const countLabel = document.getElementById('cat-count-label');
  const searchInput = document.getElementById('cat-search-input');

  function renderList(list) {
    if (countLabel) countLabel.textContent = `Found ${list.length} places in ${catName}`;
    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:48px 16px">
          <div class="empty-state__icon">🏪</div>
          <p class="empty-state__text">No places found in this category yet.</p>
          <a href="/en/dashboard/?section=add" class="btn btn-primary btn-sm" style="margin-top:1rem">Add the First Place</a>
        </div>
      `;
      return;
    }
    grid.innerHTML = list.map(p => renderPlaceCard(p)).join('');
  }

  renderList(catPlaces || []);

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      renderList(catPlaces || []);
      return;
    }
    const filtered = (catPlaces || []).filter(p => {
      const name = String(p.nameEn || p.name_en || p.name || '').toLowerCase();
      const desc = String(p.descriptionEn || p.description_en || p.description || '').toLowerCase();
      const area = String(p.areaEn || p.area || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || area.includes(q);
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
