/**
 * المنزلة وناسها — Places Listing Page
 * Filterable and searchable directory with verified places priority
 */

import { getPublishedPlaces, getCategories } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { normalizeArabic, arabicScore } from '../../utils/arabic.js';

export async function renderPlacesPage($container, { query = {}, user }) {
  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">دليل الأماكن والخدمات</h1>
        <p style="color:rgba(255,255,255,0.8);max-width:540px;margin:0 auto">استكشف جميع الأنشطة التجارية والخدمات المسجلة في مدينة المنزلة</p>
      </div>
    </div>

    <div class="container section">
      <!-- Filter Bar -->
      <div class="filter-bar">
        <input 
          type="search" 
          id="places-search-filter" 
          class="form-input" 
          placeholder="ابحث بالاسم أو الخدمة..." 
          value="${escAttr(query.q || '')}"
        />
        
        <select id="places-category-filter" class="form-select" style="max-width:220px">
          <option value="">جميع التصنيفات</option>
        </select>

        <select id="places-verified-filter" class="form-select" style="max-width:180px">
          <option value="">كل الأماكن</option>
          <option value="verified" ${query.filter === 'verified' ? 'selected' : ''}>الموثقة فقط ✓</option>
        </select>
      </div>

      <!-- Results Count Meta -->
      <div class="search-results-meta" id="places-count-meta">
        جاري تحميل الأماكن...
      </div>

      <!-- Grid -->
      <div class="places-grid" id="places-directory-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </div>
  `;

  try {
    const [places, categories] = await Promise.all([
      getPublishedPlaces({ limit: 100 }),
      getCategories()
    ]);

    const currentUser = getCurrentUser() || user;

    // Populate Category dropdown
    const catSelect = document.getElementById('places-category-filter');
    if (catSelect && categories) {
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.slug || cat._key;
        opt.textContent = `${cat.icon || '📁'} ${cat.name}`;
        if (query.category === opt.value) opt.selected = true;
        catSelect.appendChild(opt);
      });
    }

    const searchInput = document.getElementById('places-search-filter');
    const verifiedSelect = document.getElementById('places-verified-filter');
    const grid = document.getElementById('places-directory-grid');
    const countMeta = document.getElementById('places-count-meta');

    function applyFilters() {
      const q = searchInput?.value.trim() || '';
      const selectedCat = catSelect?.value || '';
      const onlyVerified = verifiedSelect?.value === 'verified';

      let filtered = [...places];

      // Filter by category
      if (selectedCat) {
        filtered = filtered.filter(p => p.categoryId === selectedCat || p.subcategoryId === selectedCat);
      }

      // Filter by verified
      if (onlyVerified) {
        filtered = filtered.filter(p => p.isVerified);
      }

      // Filter by search query
      if (q) {
        const normalQ = normalizeArabic(q);
        filtered = filtered
          .map(p => {
            const score = Math.max(
              arabicScore(p.name, q),
              arabicScore(p.description, q) * 0.7,
              p.services?.some(s => normalizeArabic(s).includes(normalQ)) ? 60 : 0
            );
            return { place: p, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.place);
      }

      // Final Sorting rule: Verified first -> Current User's -> Others
      const sorted = sortDirectoryPlaces(filtered, currentUser?.uid);

      // Render
      countMeta.textContent = `تم العثور على ${sorted.length} مكان في المنزلة`;

      if (sorted.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state__icon">🔍</div>
            <h3 class="empty-state__title">لا توجد نتائج تطابق بحثك</h3>
            <p class="empty-state__text">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً</p>
          </div>
        `;
      } else {
        grid.innerHTML = sorted.map(p => renderPlaceCard(p)).join('');
      }
    }

    // Event listeners
    searchInput?.addEventListener('input', debounce(applyFilters, 250));
    catSelect?.addEventListener('change', applyFilters);
    verifiedSelect?.addEventListener('change', applyFilters);

    // Initial render
    applyFilters();

  } catch (err) {
    console.error('[PlacesPage] Load error:', err);
  }
}

function sortDirectoryPlaces(places, currentUid = null) {
  const seen = new Set();
  const sponsored = [];
  const verified = [];
  const userOwned = [];
  const others = [];

  places.forEach(place => {
    const k = place._key || place.id;
    if (seen.has(k)) return;
    seen.add(k);

    const isSpons = Boolean(place.isSponsored || place.isFeatured || place.isPromoted);
    if (isSpons) {
      sponsored.push(place);
    } else if (place.isVerified) {
      verified.push(place);
    } else if (currentUid && place.ownerId === currentUid) {
      userOwned.push(place);
    } else {
      others.push(place);
    }
  });

  return [...sponsored, ...verified, ...userOwned, ...others];
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
