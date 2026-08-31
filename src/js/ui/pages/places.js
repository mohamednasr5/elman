import { getPublishedPlaces, getCategories } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { isAtmPlace, filterAtmPlaces, isAtmReadyAndOperational } from '../../utils/atm.js';
import { mountSponsoredShowcase } from '../components/SponsoredShowcase.js';
import { normalizeArabic, arabicScore, arabicMatch } from '../../utils/arabic.js';
import { mountVoiceSearchButton } from '../../services/voice.service.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_CENTER, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';
import { toast } from '../components/Toast.js';

let _userLocationCoords = null;

export async function renderPlacesPage($container, { query = {}, user }) {
  const towns = MANZALA_VILLAGES_LIST;

  // Resolve initial area selection (support both ?area= and ?q= if matching a town)
  let initialArea = query.area || '';
  let initialQuery = query.q || '';

  if (!initialArea && initialQuery) {
    const matchedTown = towns.find(t => arabicMatch(t, initialQuery));
    if (matchedTown) {
      initialArea = matchedTown;
      initialQuery = '';
    }
  }

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">دليل الأماكن والخدمات والمهن</h1>
        <p style="color:rgba(255,255,255,0.85);max-width:620px;margin:0 auto;line-height:1.6">
          استكشف جميع الأنشطة التجارية والعيادات والمهن في المنزلة، المطرية، العصافرة، الجمالية، والقرى المجاورة
        </p>
      </div>
    </div>

    <div class="container section">
      <!-- Dedicated Sponsored Showcase Section -->
      <div id="places-sponsored-showcase" style="margin-bottom:var(--space-6)"></div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div style="position:relative;flex:1;min-width:200px">
          <input 
            type="search" 
            id="places-search-filter" 
            class="form-input" 
            placeholder="ابحث بالاسم أو الخدمة..." 
            value="${escAttr(initialQuery)}"
            style="margin:0;padding-left:45px"
          />
        </div>

        <select id="places-area-filter" class="form-select" style="max-width:180px">
          <option value="">🏙️ جميع المدن والقرى</option>
          ${towns.map(t => `<option value="${escAttr(t)}" ${initialArea === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        
        <select id="places-category-filter" class="form-select" style="max-width:190px">
          <option value="">جميع التصنيفات</option>
        </select>

        <select id="places-verified-filter" class="form-select" style="max-width:150px">
          <option value="">كل الحالات</option>
          <option value="verified" ${query.filter === 'verified' ? 'selected' : ''}>الموثقة فقط ✓</option>
        </select>

        <select id="places-sort-filter" class="form-select" style="max-width:200px">
          <option value="default">⭐ الافتراضي (المميز والموثق)</option>
          <option value="nearest">📍 الأقرب إليّ (GPS)</option>
          <option value="highest-rating">★ الأعلى تقييماً</option>
          <option value="most-reviews">💬 الأكثر تفاعلاً</option>
          <option value="newest">🆕 الأحدث إضافة</option>
        </select>
      </div>

      <!-- ATM 15-Minute Filter Bar Slot -->
      <div id="places-atm-filters-slot" style="display:none;margin-bottom:var(--space-4)">
        <div class="atm-filters-bar animate-fade-in" style="background:linear-gradient(135deg, #0F2B48 0%, #1B4F72 100%);color:#fff;padding:14px 18px;border-radius:var(--radius-lg);border:1px solid rgba(255,255,255,0.15);box-shadow:0 6px 20px rgba(27,79,114,0.25)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:1.4rem">🏧</span>
              <span style="font-size:0.98rem;font-weight:800;color:#fff">فلترة ماكينات الصراف الآلي الحية (آخر 15 دقيقة):</span>
            </div>
            <span class="badge" style="background:rgba(16,185,129,0.2);color:#A7F3D0;border:1px solid rgba(16,185,129,0.4);font-weight:700;font-size:11px;padding:3px 8px;border-radius:9999px">
              ● تقارير آخر 15 دقيقة
            </span>
          </div>
          <div class="atm-filter-pills" id="places-atm-pills-bar" style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-xs btn-atm-places-filter active" data-atm-filter="all" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:#F5A623;color:#0F2B48;border:1px solid #F5A623">
              🌐 الكل
            </button>
            <button type="button" class="btn btn-xs btn-atm-places-filter" data-atm-filter="has-cash" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:rgba(16,185,129,0.2);color:#A7F3D0;border:1px solid rgba(16,185,129,0.4)">
              💵 ماكينات بها أموال حالياً
            </button>
            <button type="button" class="btn btn-xs btn-atm-places-filter" data-atm-filter="working" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:rgba(59,130,246,0.2);color:#BFDBFE;border:1px solid rgba(59,130,246,0.4)">
              🟢 ماكينات تعمل حالياً
            </button>
            <button type="button" class="btn btn-xs btn-atm-places-filter" data-atm-filter="out-of-service" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:rgba(239,68,68,0.2);color:#FECACA;border:1px solid rgba(239,68,68,0.4)">
              🔴 خارج نطاق الخدمة
            </button>
            <button type="button" class="btn btn-xs btn-atm-places-filter" data-atm-filter="no-cash" style="border-radius:var(--radius-full);font-size:11.5px;font-weight:700;padding:5px 12px;background:rgba(245,158,11,0.2);color:#FDE68A;border:1px solid rgba(245,158,11,0.4)">
              🚫 ليس بها أموال حالياً
            </button>
          </div>
        </div>
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

    // Mount Sponsored Showcase
    mountSponsoredShowcase('places-sponsored-showcase', places || [], {
      title: 'إعلانات وأنشطة مميزة',
      subtitle: 'أبرز الأنشطة التجارية في دليل المنزلة والمطرية الرقمي'
    });

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

    let _currentAtmPlacesFilter = 'all';
    const atmSlot = document.getElementById('places-atm-filters-slot');
    const searchInput = document.getElementById('places-search-filter');
    const areaSelect = document.getElementById('places-area-filter');
    const verifiedSelect = document.getElementById('places-verified-filter');
    const sortSelect = document.getElementById('places-sort-filter');
    const grid = document.getElementById('places-directory-grid');
    const countMeta = document.getElementById('places-count-meta');

    async function applyFilters() {
      const q = searchInput?.value.trim() || '';
      const selectedArea = areaSelect?.value || '';
      const selectedCat = catSelect?.value || '';
      const onlyVerified = verifiedSelect?.value === 'verified';
      const sortBy = sortSelect?.value || 'default';

      let filtered = [...places];

      // Filter by area / town (STRICT village & city isolation)
      if (selectedArea) {
        filtered = filtered.filter(p => {
          const pArea = (p.area || '').trim();
          return pArea === selectedArea || arabicMatch(pArea, selectedArea);
        });
      }

      // Filter by category
      const isAtmFilterActive = selectedCat === 'atm' || selectedCat.includes('صراف') || (q && (q.includes('صراف') || q.includes('atm')));
      if (atmSlot) {
        atmSlot.style.display = isAtmFilterActive ? 'block' : 'none';
      }

      if (selectedCat) {
        filtered = filtered.filter(p => p.categoryId === selectedCat || p.subcategoryId === selectedCat || (selectedCat === 'atm' && isAtmPlace(p)));
      }

      // Exclude broken or empty ATMs from standard search queries unless explicit ATM filter is chosen
      if (isAtmFilterActive && _currentAtmPlacesFilter === 'all') {
        filtered = filtered.filter(p => !isAtmPlace(p) || isAtmReadyAndOperational(p, 15));
      }

      if (isAtmFilterActive && _currentAtmPlacesFilter !== 'all') {
        filtered = filterAtmPlaces(filtered, _currentAtmPlacesFilter, 15);
      }

      // Filter by verified (Exclude ATMs from general commercial verified list)
      if (onlyVerified) {
        filtered = filtered.filter(p => p.isVerified && !isAtmPlace(p));
      }

      // Filter by search query
      if (q) {
        filtered = filtered
          .map(p => {
            const score = Math.max(
              arabicScore(p.name, q),
              arabicScore(p.categoryName || '', q) * 0.9,
              p.services?.some(s => arabicMatch(s, q)) ? 75 : 0,
              arabicScore(p.area || '', q) * 0.85,
              arabicScore(p.address || '', q) * 0.7
            );
            return { place: p, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.place);
      }

      // Sorting & Location Distance Filter
      let sorted = [];
      if (sortBy === 'nearest') {
        if (!_userLocationCoords) {
          toast.info('جاري تحديد موقعك الجغرافي لحساب الأماكن الأقرب إليك... 📍');
          try {
            _userLocationCoords = await getUserLocation();
            toast.success('تم تحديد موقعك! تم ترتيب الأماكن من الأقرب إلى الأبعد 📍');
          } catch (err) {
            if (err.code === 1) {
              toast.warning('يرجى السماح للمتصفح بالوصول للموقع (Allow Location) في شريط العنوان 📍');
            } else {
              toast.info('تم الترتيب حسب المسافة من مركز المنزلة 📍');
            }
            _userLocationCoords = MANZALA_CENTER;
          }
        }
        sorted = sortPlacesByDistance(filtered, _userLocationCoords);
      } else if (sortBy === 'highest-rating') {
        sorted = filtered.sort((a, b) => (Number(b.rating) || 5.0) - (Number(a.rating) || 5.0));
      } else if (sortBy === 'most-reviews') {
        sorted = filtered.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
      } else if (sortBy === 'negative') {
        sorted = filtered.sort((a, b) => (Number(a.rating) || 5.0) - (Number(b.rating) || 5.0));
      } else if (sortBy === 'newest') {
        sorted = filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } else {
        // Default: Verified first -> Current User's -> Others
        sorted = sortDirectoryPlaces(filtered, currentUser?.uid);
      }

      // Render
      countMeta.textContent = `تم العثور على ${sorted.length} مكان في دليل المنزلة والمطرية والقرى ${sortBy === 'nearest' ? '• مرتبة بالأقرب لموقعك' : ''}`;

      if (sorted.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state__icon">🔍</div>
            <h3 class="empty-state__title">لا توجد نتائج تطابق بحثك</h3>
            <p class="empty-state__text">جرب البحث بكلمات أخرى أو اختر مدينة/قرية أو تصنيفاً مختلفاً</p>
          </div>
        `;
      } else {
        grid.innerHTML = sorted.map(p => renderPlaceCard(p)).join('');
      }
    }

    // ATM Places Filter buttons handler
    document.querySelectorAll('#places-atm-pills-bar .btn-atm-places-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#places-atm-pills-bar .btn-atm-places-filter').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'rgba(255,255,255,0.15)';
          b.style.color = '#fff';
          b.style.borderColor = 'rgba(255,255,255,0.25)';
        });
        btn.classList.add('active');
        btn.style.background = '#F5A623';
        btn.style.color = '#0F2B48';
        btn.style.borderColor = '#F5A623';

        _currentAtmPlacesFilter = btn.getAttribute('data-atm-filter') || 'all';
        applyFilters();
      });
    });

    // Event listeners
    searchInput?.addEventListener('input', debounce(applyFilters, 250));
    areaSelect?.addEventListener('change', applyFilters);
    catSelect?.addEventListener('change', applyFilters);
    verifiedSelect?.addEventListener('change', applyFilters);
    sortSelect?.addEventListener('change', applyFilters);

    // Initialize Smart Voice Search
    mountVoiceSearchButton({
      inputEl: searchInput,
      onSearch: (spokenText) => {
        applyFilters();
      }
    });

    // Initial render
    applyFilters();

  } catch (err) {
    console.error('[PlacesPage] Load error:', err);
  }
}

function isPlaceSponsored(place) {
  if (!place) return false;
  return Boolean(
    (place.isSponsored || place.isFeatured || place.isPromoted) &&
    (!place.sponsoredUntil || place.sponsoredUntil > Date.now())
  );
}

function sortDirectoryPlaces(places, currentUid = null) {
  const seen = new Set();
  const sponsored = [];
  const regular = [];

  const sortedByTime = [...places].sort((a, b) => {
    const timeA = Number(a.createdAt) || Number(a.updatedAt) || 0;
    const timeB = Number(b.createdAt) || Number(b.updatedAt) || 0;
    return timeB - timeA;
  });

  sortedByTime.forEach(place => {
    const k = place._key || place.id;
    if (seen.has(k)) return;
    seen.add(k);

    if (isPlaceSponsored(place)) {
      sponsored.push(place);
    } else {
      regular.push(place);
    }
  });

  return [...sponsored, ...regular];
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
