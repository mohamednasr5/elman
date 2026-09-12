/**
 * Dalil El Manzala & El Matariya — English Places Page
 * Dedicated native English places directory renderer
 */

import { getPublishedPlaces, getCategories } from '../../../core/db.js';
import { getCurrentUser } from '../../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../../components/PlaceCard.js';
import { isAtmPlace, filterAtmPlaces, isAtmReadyAndOperational } from '../../../utils/atm.js';
import { mountSponsoredShowcase, isPlaceSponsored } from '../../components/SponsoredShowcase.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_CENTER, MANZALA_VILLAGES_LIST } from '../../../utils/maps.js';
import { isPhoneSearchQuery, normalizePhoneNumber, matchPlaceByPhone } from '../../../utils/phone.js';
import { VILLAGE_NAMES_EN, CATEGORY_NAMES_EN, translateArea, translateCategory } from '../../../utils/category-i18n.js';

let _userLocationCoords = null;

export async function renderEnglishPlacesPage($container, { query = {}, user } = {}) {
  document.title = 'All Places & Businesses | Dalil El Manzala & El Matariya';

  const towns = Object.entries(VILLAGE_NAMES_EN).map(([ar, en]) => ({ ar, en }));
  let initialArea = query.area || '';
  let initialQuery = query.q || '';

  // Reverse match English area if Arabic was passed
  if (initialArea && VILLAGE_NAMES_EN[initialArea]) {
    initialArea = VILLAGE_NAMES_EN[initialArea];
  }

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">Places & Services Directory</h1>
        <p style="color:rgba(255,255,255,0.85);max-width:620px;margin:0 auto;line-height:1.6">
          Explore businesses, clinics, pharmacies, craftsmen, and services across El Manzala, El Matariya, and surrounding towns.
        </p>
      </div>
    </div>

    <div class="container section">
      <!-- Sponsored Showcase Section -->
      <div id="places-sponsored-showcase" style="margin-bottom:var(--space-6)"></div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div style="position:relative;flex:1;min-width:200px">
          <input 
            type="search" 
            id="places-search-filter" 
            class="form-input" 
            placeholder="Search by name, specialty, craft, or phone..." 
            value="${escAttr(initialQuery)}"
            style="margin:0;padding-left:14px"
          />
        </div>

        <select id="places-area-filter" class="form-select" style="max-width:200px">
          <option value="">🏙️ All Cities & Villages</option>
          ${towns.map(t => `<option value="${escAttr(t.en)}" ${initialArea.toLowerCase() === t.en.toLowerCase() ? 'selected' : ''}>${escHtml(t.en)}</option>`).join('')}
        </select>
        
        <select id="places-category-filter" class="form-select" style="max-width:200px">
          <option value="">All Categories</option>
        </select>

        <select id="places-verified-filter" class="form-select" style="max-width:150px">
          <option value="">All Statuses</option>
          <option value="verified" ${query.filter === 'verified' ? 'selected' : ''}>Verified Only ✓</option>
        </select>

        <select id="places-sort-filter" class="form-select" style="max-width:200px">
          <option value="default">⭐ Default (Featured & Verified)</option>
          <option value="nearest">📍 Nearest to Me (GPS)</option>
          <option value="highest-rating">★ Highest Rated</option>
          <option value="most-reviews">💬 Most Reviewed</option>
          <option value="newest">🆕 Newly Added</option>
        </select>
      </div>

      <!-- ATM Filter Bar -->
      <div id="places-atm-filters-slot" style="display:none;margin-bottom:var(--space-4)">
        <div class="atm-filters-bar animate-fade-in" style="background:linear-gradient(135deg, #0F2B48 0%, #1B4F72 100%);color:#fff;padding:14px 18px;border-radius:var(--radius-lg);border:1px solid rgba(255,255,255,0.15)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:1.4rem">🏧</span>
              <span style="font-size:0.98rem;font-weight:800;color:#fff">Live ATM Status (Last 15 Minutes):</span>
            </div>
            <span class="badge" style="background:rgba(16,185,129,0.2);color:#A7F3D0;border:1px solid rgba(16,185,129,0.4);font-weight:700;font-size:11px;padding:3px 8px;border-radius:9999px">
              ● Live Community Updates
            </span>
          </div>
          <div class="atm-filter-pills" id="places-atm-pills-bar" style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-xs btn-atm-places-filter active" data-atm-filter="all" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:#F5A623;color:#0F2B48;border:1px solid #F5A623">
              🌐 All ATMs
            </button>
            <button type="button" class="btn btn-xs btn-atm-places-filter" data-atm-filter="has-cash" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:rgba(16,185,129,0.2);color:#A7F3D0;border:1px solid rgba(16,185,129,0.4)">
              💵 Has Cash Currently
            </button>
            <button type="button" class="btn btn-xs btn-atm-places-filter" data-atm-filter="working" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:rgba(59,130,246,0.2);color:#BFDBFE;border:1px solid rgba(59,130,246,0.4)">
              🟢 Operational Currently
            </button>
          </div>
        </div>
      </div>

      <div class="search-stats-bar" style="margin-bottom:var(--space-4);color:var(--text-secondary);font-size:var(--font-size-sm);display:flex;align-items:center;justify-content:space-between">
        <span id="places-count-label">Loading places...</span>
      </div>

      <div class="grid grid-4" id="places-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  // Fetch data
  const [places, categories] = await Promise.all([
    getPublishedPlaces({ limit: 100 }),
    getCategories()
  ]);

  // Populate category filter options
  const catSelect = document.getElementById('places-category-filter');
  if (catSelect && categories) {
    categories.forEach(c => {
      const slug = c.slug || c._key || c.id;
      const name = translateCategory(c.nameEn || c.name || slug, true);
      const isSelected = query.category === slug || query.category === c.name;
      catSelect.innerHTML += `<option value="${escAttr(slug)}" ${isSelected ? 'selected' : ''}>${escHtml(name)}</option>`;
    });
  }

  // Mount sponsored showcase
  mountSponsoredShowcase('places-sponsored-showcase', places, {
    title: 'Featured Places & Verified Listings',
    subtitle: 'Top rated and recommended businesses in El Manzala & El Matariya'
  });

  const searchInput = document.getElementById('places-search-filter');
  const areaSelect = document.getElementById('places-area-filter');
  const verifiedSelect = document.getElementById('places-verified-filter');
  const sortSelect = document.getElementById('places-sort-filter');
  const countLabel = document.getElementById('places-count-label');
  const grid = document.getElementById('places-grid');
  const atmSlot = document.getElementById('places-atm-filters-slot');
  let currentAtmFilter = 'all';

  function applyFilters() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    const selArea = (areaSelect?.value || '').trim().toLowerCase();
    const selCat = (catSelect?.value || '').trim();
    const selVer = (verifiedSelect?.value || '').trim();
    const selSort = (sortSelect?.value || 'default').trim();

    // Check ATM bar visibility
    const isAtmSelected = selCat === 'atm' || q.includes('atm') || q.includes('cash');
    if (atmSlot) atmSlot.style.display = isAtmSelected ? 'block' : 'none';

    let filtered = (places || []).filter(p => {
      if (!p) return false;

      // Verified filter
      if (selVer === 'verified' && !p.isVerified && !p.is_verified) return false;

      // Area filter
      if (selArea) {
        const pArea = (p.areaEn || translateArea(p.area, true) || '').toLowerCase();
        if (!pArea.includes(selArea) && !(p.area || '').toLowerCase().includes(selArea)) return false;
      }

      // Category filter
      if (selCat) {
        const cId = String(p.categoryId || p.category_id || '').toLowerCase();
        const cName = String(p.categoryName || p.category || '').toLowerCase();
        const cCustom = String(p.customCategory || '').toLowerCase();
        if (cId !== selCat.toLowerCase() && !cName.includes(selCat.toLowerCase()) && !cCustom.includes(selCat.toLowerCase())) {
          return false;
        }
      }

      // Search Query filter
      if (q) {
        if (isPhoneSearchQuery(q)) {
          if (!matchPlaceByPhone(p, q)) return false;
        } else {
          const nameEn = String(p.nameEn || p.name_en || '').toLowerCase();
          const nameAr = String(p.name || '').toLowerCase();
          const descEn = String(p.descriptionEn || p.description_en || '').toLowerCase();
          const descAr = String(p.description || '').toLowerCase();
          const catStr = String(p.categoryName || p.customCategory || '').toLowerCase();
          const match = nameEn.includes(q) || nameAr.includes(q) || descEn.includes(q) || descAr.includes(q) || catStr.includes(q);
          if (!match) return false;
        }
      }

      // ATM Status filter
      if (isAtmSelected && currentAtmFilter !== 'all') {
        return filterAtmPlaces(p, currentAtmFilter);
      }

      return true;
    });

    // Sorting
    if (selSort === 'nearest' && _userLocationCoords) {
      filtered = sortPlacesByDistance(filtered, _userLocationCoords);
    } else if (selSort === 'highest-rating') {
      filtered.sort((a, b) => Number(b.rating || 5) - Number(a.rating || 5));
    } else if (selSort === 'most-reviews') {
      filtered.sort((a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0));
    } else if (selSort === 'newest') {
      filtered.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    } else {
      // Default: Sponsored & Verified first
      filtered.sort((a, b) => {
        const aSpons = isPlaceSponsored(a) ? 1 : 0;
        const bSpons = isPlaceSponsored(b) ? 1 : 0;
        if (bSpons !== aSpons) return bSpons - aSpons;
        const aVer = (a.isVerified || a.is_verified) ? 1 : 0;
        const bVer = (b.isVerified || b.is_verified) ? 1 : 0;
        return bVer - aVer;
      });
    }

    if (countLabel) {
      countLabel.textContent = `Found ${filtered.length} places and services`;
    }

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:56px 16px">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">No matching places found</h3>
          <p class="empty-state__text">Try adjusting your search query, town selection, or filters.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-clear-filters" style="margin-top:1rem">Reset Filters</button>
        </div>
      `;
      document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (areaSelect) areaSelect.value = '';
        if (catSelect) catSelect.value = '';
        if (verifiedSelect) verifiedSelect.value = '';
        if (sortSelect) sortSelect.value = 'default';
        applyFilters();
      });
      return;
    }

    grid.innerHTML = filtered.map(p => renderPlaceCard(p)).join('');
  }

  searchInput?.addEventListener('input', applyFilters);
  areaSelect?.addEventListener('change', applyFilters);
  catSelect?.addEventListener('change', applyFilters);
  verifiedSelect?.addEventListener('change', applyFilters);

  sortSelect?.addEventListener('change', async () => {
    if (sortSelect.value === 'nearest' && !_userLocationCoords) {
      try {
        _userLocationCoords = await getUserLocation();
      } catch (_) {
        alert('Could not get GPS location. Please allow location access in your browser.');
        sortSelect.value = 'default';
      }
    }
    applyFilters();
  });

  // ATM pill buttons
  document.querySelectorAll('.btn-atm-places-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-atm-places-filter').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255,255,255,0.1)';
        b.style.color = '#fff';
      });
      btn.classList.add('active');
      btn.style.background = '#F5A623';
      btn.style.color = '#0F2B48';
      currentAtmFilter = btn.getAttribute('data-atm-filter') || 'all';
      applyFilters();
    });
  });

  applyFilters();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
