/**
 * المنزلة وناسها — الأكثر شعبية ورواجاً (Trending & Popular Discovery)
 * Features 7 smart filters, trending categories, GPS distance sorting,
 * and live availability badges.
 */

import { getPublishedPlaces, getCategories } from '../../core/db.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { normalizeArabic, arabicMatch } from '../../utils/arabic.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';
import { toast } from '../components/Toast.js';

let _userCoords = null;
let _cachedPlaces = null;
let _categories = null;

const POPULAR_FILTERS = [
  { id: 'views', label: '🔥 الأكثر بحثاً وزيارة', icon: '🔥' },
  { id: 'rating', label: '⭐ الأعلى تقييماً', icon: '⭐' },
  { id: 'contacts', label: '📞 الأكثر تواصلاً', icon: '📞' },
  { id: 'favorites', label: '❤️ الأكثر حفظاً', icon: '❤️' },
  { id: 'nearest', label: '📍 الأقرب إليك', icon: '📍' },
  { id: 'newest', label: '🆕 المضاف حديثاً', icon: '🆕' },
  { id: 'verified', label: '🏆 الأنشطة الموثقة', icon: '🏆' }
];

const TRENDING_CHIPS = [
  { id: '', label: '🌐 الكل' },
  { id: 'restaurants', label: '🍽️ مطاعم وكافيهات' },
  { id: 'electronics', label: '📱 صيانة موبايلات وإلكترونيات' },
  { id: 'doctors', label: '👨‍⚕️ عيادات وأطباء' },
  { id: 'fashion', label: '👗 ملابس وموضة' },
  { id: 'crafts', label: '🔧 صنايعية وخدمات منزلية' },
  { id: 'groceries', label: '🛒 سوبر ماركت وأغذية' },
  { id: 'pharmacies', label: '💊 صيدليات وعناية' }
];

export async function renderPopularPage($container, { filter = 'views', category = '', area = '', q = '' } = {}) {
  let currentFilter = filter || 'views';
  let currentCategory = category || '';
  let currentArea = area || '';
  let searchQuery = q || '';

  $container.innerHTML = `
    <!-- Hero Banner -->
    <section class="popular-hero" style="background:linear-gradient(135deg, #0F2B48 0%, #1B4F72 60%, #0284C7 100%);color:#fff;padding:2.5rem 1rem 2rem 1rem;border-radius:0 0 var(--radius-xl) var(--radius-xl);text-align:center;box-shadow:0 8px 30px rgba(15,43,72,0.25);margin-bottom:1.5rem">
      <div class="container" style="max-width:800px;margin:0 auto">
        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.15);backdrop-filter:blur(6px);padding:5px 14px;border-radius:9999px;font-size:12.5px;font-weight:700;margin-bottom:12px;border:1px solid rgba(255,255,255,0.2)">
          <span>🔥 التريند في المنزلة والمطرية</span>
        </div>
        <h1 style="font-size:clamp(1.6rem, 4vw, 2.3rem);font-weight:900;margin-bottom:8px;line-height:1.3;color:#fff">
          الأكثر شعبية وطلباً في المنزلة والمطرية
        </h1>
        <p style="font-size:0.95rem;color:rgba(255,255,255,0.85);max-width:580px;margin:0 auto 1.5rem auto;line-height:1.6">
          اكتشف أفضل الأنشطة والمحلات والمهن الأعلى تقييماً، الأكثر تواصلاً وزيارة، والأقرب لموقعك حالياً
        </p>

        <!-- Search Bar Inside Hero -->
        <div style="max-width:540px;margin:0 auto;position:relative">
          <input 
            type="search" 
            id="popular-search-input" 
            class="form-input" 
            placeholder="ابحث بالاسم، المهنة، أو الخدمة..." 
            value="${escAttr(searchQuery)}"
            style="background:#fff;color:#0F2B48;border-radius:9999px;padding:12px 20px 12px 48px;font-size:14.5px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:none"
          />
          <span style="position:absolute;left:18px;top:50%;transform:translateY(-50%);font-size:18px;pointer-events:none;color:#64748b">🔍</span>
        </div>
      </div>
    </section>

    <div class="container" style="max-width:var(--container-xl, 1200px);margin:0 auto;padding:0 1rem 3rem 1rem">
      
      <!-- 7 Smart Filter Pills -->
      <div style="margin-bottom:1.25rem">
        <div style="font-weight:800;font-size:13.5px;margin-bottom:8px;color:var(--text-secondary);display:flex;align-items:center;gap:6px">
          <span>🎯 ترتيب وترشيح الأنشطة حسب:</span>
        </div>
        <div class="filter-pills-bar" id="popular-filter-pills" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch">
          ${POPULAR_FILTERS.map(f => `
            <button 
              type="button" 
              class="btn-popular-filter ${currentFilter === f.id ? 'active' : ''}" 
              data-filter="${f.id}"
              style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9999px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;border:1px solid var(--border);background:${currentFilter === f.id ? 'var(--primary)' : 'var(--surface)'};color:${currentFilter === f.id ? '#fff' : 'var(--text-primary)'};box-shadow:${currentFilter === f.id ? '0 3px 10px rgba(2,132,199,0.3)' : 'none'}"
            >
              ${f.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Trending Chips Bar -->
      <div style="margin-bottom:1.5rem;background:var(--surface-2);padding:12px 14px;border-radius:var(--radius-lg);border:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <div style="font-weight:800;font-size:13px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
            <span>⚡ رائج ومطلوب الآن:</span>
          </div>
          <!-- Area Filter Select -->
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:12px;color:var(--text-muted)">المنطقة:</span>
            <select id="popular-area-select" class="form-select" style="padding:4px 10px;font-size:12px;font-weight:700;border-radius:var(--radius-sm);max-width:140px">
              <option value="">🏙️ كل المناطق</option>
              ${MANZALA_VILLAGES_LIST.map(a => `<option value="${escAttr(a)}" ${currentArea === a ? 'selected' : ''}>${a}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="trending-chips-bar" id="popular-trending-chips" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">
          ${TRENDING_CHIPS.map(c => `
            <button 
              type="button" 
              class="chip-trending ${currentCategory === c.id ? 'active' : ''}" 
              data-cat="${c.id}"
              style="display:inline-flex;align-items:center;padding:5px 12px;border-radius:var(--radius-full);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;border:1px solid ${currentCategory === c.id ? 'var(--primary)' : 'var(--border)'};background:${currentCategory === c.id ? 'var(--primary)' : 'var(--surface)'};color:${currentCategory === c.id ? '#fff' : 'var(--text-secondary)'}"
            >
              ${c.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Results Header & Counter -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
        <div id="popular-results-count" style="font-size:13.5px;font-weight:800;color:var(--text-primary)">
          جاري تجهيز النتائج الأكثر شعبية...
        </div>
        <div id="popular-active-pill-desc" style="font-size:12px;color:var(--text-muted);font-weight:600">
        </div>
      </div>

      <!-- Places Grid Container -->
      <div id="popular-places-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:1.25rem">
        ${renderPlaceCardSkeleton()}
        ${renderPlaceCardSkeleton()}
        ${renderPlaceCardSkeleton()}
        ${renderPlaceCardSkeleton()}
      </div>
    </div>
  `;

  // Fetch places and categories
  try {
    const [places, categories] = await Promise.all([
      _cachedPlaces ? Promise.resolve(_cachedPlaces) : getPublishedPlaces(),
      _categories ? Promise.resolve(_categories) : getCategories().catch(() => [])
    ]);
    _cachedPlaces = places || [];
    _categories = categories || [];

    setupEvents();
    applyAndRender();
  } catch (err) {
    console.error('Failed to load popular places:', err);
    const grid = document.getElementById('popular-places-grid');
    if (grid) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-muted)">حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.</div>`;
    }
  }

  function setupEvents() {
    // Search input
    const searchInput = document.getElementById('popular-search-input');
    let searchDebounce = null;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchQuery = e.target.value.trim();
        updateUrl();
        applyAndRender();
      }, 250);
    });

    // Filter pills
    const pillsContainer = document.getElementById('popular-filter-pills');
    pillsContainer?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const targetFilter = btn.getAttribute('data-filter');
      if (targetFilter === currentFilter) return;

      if (targetFilter === 'nearest' && !_userCoords) {
        toast.info('جاري تحديد موقعك الجغرافي لعرض الأقرب إليك...');
        try {
          const loc = await getUserLocation();
          if (loc && loc.latitude && loc.longitude) {
            _userCoords = { lat: loc.latitude, lng: loc.longitude };
          } else {
            toast.error('لم نتمكن من تحديد موقعك بدقة، سيتم ترتيب الأماكن حسب مركز المنزلة.');
          }
        } catch (_) {
          toast.error('يرجى تفعيل صلاحية تحديد الموقع (GPS) لترتيب الأماكن حسب الأقرب لك.');
        }
      }

      currentFilter = targetFilter;
      // Update pills active styling
      pillsContainer.querySelectorAll('.btn-popular-filter').forEach(el => {
        const isActive = el.getAttribute('data-filter') === currentFilter;
        el.style.background = isActive ? 'var(--primary)' : 'var(--surface)';
        el.style.color = isActive ? '#fff' : 'var(--text-primary)';
        el.style.boxShadow = isActive ? '0 3px 10px rgba(2,132,199,0.3)' : 'none';
      });

      updateUrl();
      applyAndRender();
    });

    // Trending chips
    const chipsContainer = document.getElementById('popular-trending-chips');
    chipsContainer?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-cat]');
      if (!chip) return;
      const cat = chip.getAttribute('data-cat');
      currentCategory = cat;
      chipsContainer.querySelectorAll('.chip-trending').forEach(el => {
        const isActive = el.getAttribute('data-cat') === currentCategory;
        el.style.background = isActive ? 'var(--primary)' : 'var(--surface)';
        el.style.color = isActive ? '#fff' : 'var(--text-secondary)';
        el.style.borderColor = isActive ? 'var(--primary)' : 'var(--border)';
      });

      updateUrl();
      applyAndRender();
    });

    // Area select
    const areaSelect = document.getElementById('popular-area-select');
    areaSelect?.addEventListener('change', (e) => {
      currentArea = e.target.value;
      updateUrl();
      applyAndRender();
    });
  }

  function updateUrl() {
    const p = new URLSearchParams();
    if (currentFilter && currentFilter !== 'views') p.set('filter', currentFilter);
    if (currentCategory) p.set('category', currentCategory);
    if (currentArea) p.set('area', currentArea);
    if (searchQuery) p.set('q', searchQuery);
    const newUrl = location.pathname + (p.toString() ? '?' + p.toString() : '');
    window.history.replaceState(null, '', newUrl);
  }

  function applyAndRender() {
    const grid = document.getElementById('popular-places-grid');
    const countEl = document.getElementById('popular-results-count');
    const descEl = document.getElementById('popular-active-pill-desc');
    if (!grid) return;

    let list = [...(_cachedPlaces || [])];

    // Filter by area
    if (currentArea) {
      list = list.filter(p => (p.area || '').trim() === currentArea.trim());
    }

    // Filter by category
    if (currentCategory) {
      list = list.filter(p => {
        const pCat = (p.categoryId || p.category_id || '').toLowerCase();
        const pSub = (p.subcategoryId || p.subcategory_id || '').toLowerCase();
        return pCat === currentCategory || pSub.includes(currentCategory);
      });
    }

    // Filter by search query
    if (searchQuery) {
      const qNorm = normalizeArabic(searchQuery);
      list = list.filter(p => {
        const nameNorm = normalizeArabic(p.name || '');
        const catNorm = normalizeArabic(p.categoryName || p.customCategory || '');
        const descNorm = normalizeArabic(p.description || '');
        const addrNorm = normalizeArabic(p.address || '');
        return nameNorm.includes(qNorm) || catNorm.includes(qNorm) || descNorm.includes(qNorm) || addrNorm.includes(qNorm);
      });
    }

    // Apply 7 Smart Sorts / Filters
    let filterDesc = '';
    switch (currentFilter) {
      case 'views':
        filterDesc = 'مرتبة تنازلياً حسب عدد الزيارات والمشاهدات';
        list.sort((a, b) => {
          const vA = Number(a.views || a.stats?.views || 0);
          const vB = Number(b.views || b.stats?.views || 0);
          return vB - vA;
        });
        break;

      case 'rating':
        filterDesc = 'مرتبة حسب أعلى تقييم وعدد آراء الزوار';
        list.sort((a, b) => {
          const rA = Number(a.rating || 0);
          const rB = Number(b.rating || 0);
          if (rB !== rA) return rB - rA;
          const cA = Number(a.reviewCount || a.reviewsCount || 0);
          const cB = Number(b.reviewCount || b.reviewsCount || 0);
          return cB - cA;
        });
        break;

      case 'contacts':
        filterDesc = 'مرتبة حسب الأنشطة الأكثر تلقياً للاتصالات والرسائل';
        list.sort((a, b) => {
          const cA = Number(a.phoneClicks || a.stats?.phoneClicks || 0) + Number(a.whatsappClicks || a.stats?.whatsappClicks || 0);
          const cB = Number(b.phoneClicks || b.stats?.phoneClicks || 0) + Number(b.whatsappClicks || b.stats?.whatsappClicks || 0);
          return cB - cA;
        });
        break;

      case 'favorites':
        filterDesc = 'مرتبة حسب الأنشطة الأكثر حفظاً في المفضلة';
        list.sort((a, b) => {
          const fA = Number(a.favoriteClicks || a.stats?.favoriteClicks || 0);
          const fB = Number(b.favoriteClicks || b.stats?.favoriteClicks || 0);
          return fB - fA;
        });
        break;

      case 'nearest':
        filterDesc = 'مرتبة حسب المسافة الأقرب إليك';
        if (_userCoords) {
          list = sortPlacesByDistance(list, _userCoords.lat, _userCoords.lng);
        } else {
          list.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
        }
        break;

      case 'newest':
        filterDesc = 'مرتبة من الأحدث إلى الأقدم في المنصة';
        list.sort((a, b) => {
          const tA = new Date(a.createdAt || a.created_at || 0).getTime() || 0;
          const tB = new Date(b.createdAt || b.created_at || 0).getTime() || 0;
          return tB - tA;
        });
        break;

      case 'verified':
        filterDesc = 'الأنشطة الموثقة والنشطة بالعلامة المعتمدة';
        list = list.filter(p => p.isVerified);
        list.sort((a, b) => (Number(b.trustScore || 0) - Number(a.trustScore || 0)));
        break;

      default:
        break;
    }

    if (descEl) descEl.textContent = filterDesc;
    if (countEl) {
      countEl.innerHTML = `عرض <strong>${list.length}</strong> نشاط ومكان شعبي ورائج`;
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem 1.5rem;background:var(--surface);border-radius:var(--radius-xl);border:1px solid var(--border)">
          <div style="font-size:3rem;margin-bottom:10px">🔍</div>
          <h3 style="font-size:1.2rem;font-weight:800;color:var(--text-primary);margin-bottom:6px">لم نجد أنشطة تطابق هذا الفلتر حالياً</h3>
          <p style="color:var(--text-secondary);font-size:0.92rem;max-width:400px;margin:0 auto 1.25rem auto">جرب اختيار تصنيف آخر أو إزالة البحث لعرض كافة الأنشطة الأكثر شعبية.</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-reset-popular-filters" style="border-radius:9999px;padding:8px 20px">عرض كافة الأنشطة</button>
        </div>
      `;

      document.getElementById('btn-reset-popular-filters')?.addEventListener('click', () => {
        currentCategory = '';
        currentArea = '';
        searchQuery = '';
        const searchInput = document.getElementById('popular-search-input');
        if (searchInput) searchInput.value = '';
        const areaSelect = document.getElementById('popular-area-select');
        if (areaSelect) areaSelect.value = '';
        updateUrl();
        applyAndRender();
      });
      return;
    }

    grid.innerHTML = list.map(p => renderPlaceCard(p)).join('');
  }
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
