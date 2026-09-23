import { getPlacesPaginated, getCategories, getCached } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js?v=20260923_04';
import { isAtmPlace, filterAtmPlaces, isAtmReadyAndOperational } from '../../utils/atm.js';
import { mountSponsoredShowcase, isPlaceSponsored } from '../components/SponsoredShowcase.js';
import { normalizeArabic, arabicScore, arabicMatch } from '../../utils/arabic.js';
import { mountVoiceSearchButton } from '../../services/voice.service.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_CENTER, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';
import { isPhoneSearchQuery, normalizePhoneNumber, matchPlaceByPhone, formatPhoneNumberForDisplay } from '../../utils/phone.js';
import { toast } from '../components/Toast.js';

let _userLocationCoords = null;
let _cleanupPlacesPage = null;

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
            placeholder="ابحث بالاسم، التخصص، أو برقم الهاتف (01... / 05...)..." 
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
      </div>      <!-- Grid -->
      <div class="places-grid" id="places-directory-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
      <div id="places-load-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin:20px 0 8px">
        <div id="places-load-spinner" hidden aria-hidden="true" style="width:24px;height:24px;border:3px solid rgba(27,79,114,.16);border-top-color:#1B4F72;border-radius:50%;animation:placesSpin .8s linear infinite"></div>
        <button id="places-load-more" type="button" class="btn btn-outline" hidden style="min-width:190px;border-radius:14px;padding:10px 18px;font-weight:800">عرض المزيد من الأماكن</button>
        <div id="places-load-sentinel" style="height:2px;width:100%" aria-hidden="true"></div>
        <span id="places-load-message" style="font-size:12px;color:var(--text-secondary);text-align:center"></span>
      </div>
      <style>@keyframes placesSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#places-load-spinner{animation:none!important}}</style>
    </div>
  `;

  try {
    let places = [];
    let masterPool = [];
    let categories = [];
    let page = 1;
    let hasMore = true;
    let isLoading = false;
    let requestSerial = 0;
    let currentUser = getCurrentUser() || user;
    let currentCategories = [];
    const PAGE_SIZE = 24;

    _cleanupPlacesPage?.();
    let realtimeHandler = null;
    let intersectionObserver = null;
    let rotationTimer = null;

    const catSelect = document.getElementById('places-category-filter');
    const searchInput = document.getElementById('places-search-filter');
    const areaSelect = document.getElementById('places-area-filter');
    const verifiedSelect = document.getElementById('places-verified-filter');
    const sortSelect = document.getElementById('places-sort-filter');
    const atmSlot = document.getElementById('places-atm-filters-slot');
    const grid = document.getElementById('places-directory-grid');
    const loadMoreBtn = document.getElementById('places-load-more');
    const loadSpinner = document.getElementById('places-load-spinner');
    const loadMessage = document.getElementById('places-load-message');
    const loadSentinel = document.getElementById('places-load-sentinel');

    // Instant sub-second initial paint from local memory/cache
    const cachedInitial = getCached('published_100_') || getCached('places_all') || [];
    if (Array.isArray(cachedInitial) && cachedInitial.length > 0) {
      masterPool = [...cachedInitial];
      places = [...cachedInitial];
      renderCurrentPage();
    }

    categories = await getCategories().catch(() => []);
    currentCategories = categories || [];
    if (catSelect && currentCategories.length) {
      catSelect.innerHTML = '<option value="">جميع التصنيفات</option>' + currentCategories.map(cat => {
        const value = cat.slug || cat._key || cat.id || '';
        const selected = query.category === value ? ' selected' : '';
        return `<option value="${escAttr(value)}"${selected}>${cat.icon || '📁'} ${escHtml(cat.name || value)}</option>`;
      }).join('');
    }

    mountSponsoredShowcase('places-sponsored-showcase', [], {
      title: 'إعلانات وأنشطة مميزة',
      subtitle: 'أبرز الأنشطة التجارية في دليل المنزلة والمطرية الرقمي'
    });

    function getFilterState() {
      return {
        q: searchInput?.value.trim() || '',
        area: areaSelect?.value || '',
        category: catSelect?.value || '',
        verified: verifiedSelect?.value === 'verified',
        sort: sortSelect?.value || 'default'
      };
    }

    function updateLoadingUI() {
      if (loadSpinner) loadSpinner.hidden = !isLoading;
      if (loadMoreBtn) loadMoreBtn.hidden = isLoading || !hasMore;
      if (loadMessage) {
        if (isLoading) loadMessage.textContent = 'جاري تحميل النتائج من الخادم…';
        else if (!hasMore && places.length) loadMessage.textContent = `تم عرض ${places.length} مكانًا`;
        else loadMessage.textContent = '';
      }
    }

    function getClientVisiblePlaces() {
      const state = getFilterState();
      const source = (places && places.length > 0) ? places : masterPool;
      let visible = [...source];
      const isPhone = isPhoneSearchQuery(state.q);
      const isAtmFilterActive = state.category === 'atm' || state.category.includes('صراف') || (state.q && (state.q.includes('صراف') || state.q.toLowerCase().includes('atm')));

      if (atmSlot) atmSlot.style.display = isAtmFilterActive ? 'block' : 'none';

      if (state.category) {
        const catNorm = state.category.toLowerCase().trim();
        visible = visible.filter(p => {
          const cId = String(p.categoryId || p.category_id || '').toLowerCase();
          const cSlug = String(p.categorySlug || p.category_slug || '').toLowerCase();
          const cCustom = String(p.customCategory || p.custom_category || '').toLowerCase();
          const cName = String(p.categoryName || p.category_name || '').toLowerCase();
          return cId === catNorm || cSlug === catNorm || cCustom.includes(catNorm) || cName.includes(catNorm);
        });
      }

      if (state.area) {
        visible = visible.filter(p => String(p.area || '').includes(state.area));
      }

      if (state.verified) {
        visible = visible.filter(p => Boolean(p.isVerified || p.is_verified));
      }

      if (state.q) {
        if (isPhone) {
          const qPhone = normalizePhoneNumber(state.q);
          visible = visible.filter(p => matchPlaceByPhone(p, qPhone));
        } else {
          const normQ = normalizeArabic(state.q.toLowerCase().trim());
          visible = visible.filter(p => {
            const hay = normalizeArabic([p.name, p.nameEn, p.description, p.address, p.area, p.phone, p.whatsapp].filter(Boolean).join(' ').toLowerCase());
            return hay.includes(normQ);
          });
        }
      }

      if (isAtmFilterActive && _currentAtmPlacesFilter === 'all') {
        visible = visible.filter(p => !isAtmPlace(p) || isAtmReadyAndOperational(p, 15));
      }
      if (isAtmFilterActive && _currentAtmPlacesFilter !== 'all') {
        visible = filterAtmPlaces(visible, _currentAtmPlacesFilter, 15);
      }

      if (state.sort === 'nearest') {
        if (_userLocationCoords) visible = sortPlacesByDistance(visible, _userLocationCoords);
      } else if (state.sort === 'highest-rating') {
        visible.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      } else if (state.sort === 'most-reviews') {
        visible.sort((a, b) => Number(b.reviewCount || b.reviewsCount || 0) - Number(a.reviewCount || a.reviewsCount || 0));
      } else if (state.sort === 'newest') {
        visible.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      }
      return visible;
    }

    function renderCurrentPage() {
      const visible = getClientVisiblePlaces();
      if (!grid) return;

      if (!visible.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">لا توجد نتائج تطابق بحثك</h3>
          <p class="empty-state__text">جرب تغيير كلمة البحث أو المدينة أو التصنيف</p>
        </div>`;
        return;
      }

      grid.innerHTML = visible.map(p => renderPlaceCard(p)).join('');
      updateLoadingUI();
    }

    async function fetchPlacesPage({ reset = false } = {}) {
      if (isLoading) return;
      const serial = ++requestSerial;
      const state = getFilterState();
      isLoading = true;
      updateLoadingUI();

      try {
        let pageLimit = PAGE_SIZE;
        let selectedSort = state.sort;

        // Distance sorting needs a larger candidate pool, but only when explicitly requested.
        if (selectedSort === 'nearest') {
          pageLimit = 100;
          page = 1;
        }

        const result = await getPlacesPaginated({
          page,
          limit: pageLimit,
          category: state.category,
          area: state.area,
          q: state.q,
          sort: selectedSort === 'highest-rating' ? 'rating' : (selectedSort === 'most-reviews' ? 'reviews' : (selectedSort === 'newest' ? 'newest' : 'default')),
          verified: state.verified,
          forceFresh: reset
        });

        if (serial !== requestSerial) return;

        const incoming = Array.isArray(result?.places) ? result.places : [];
        if (reset) places = [];

        const seen = new Set(places.map(p => String(p?.id || p?.slug || '').toLowerCase()));
        incoming.forEach(p => {
          const key = String(p?.id || p?.slug || '').toLowerCase();
          if (key && !seen.has(key)) { places.push(p); seen.add(key); }
          if (key && !masterPool.some(m => String(m?.id || m?.slug || '').toLowerCase() === key)) {
            masterPool.push(p);
          }
        });

        hasMore = selectedSort === 'nearest' ? false : Boolean(result?.pagination?.hasMore);

        if (reset) {
          mountSponsoredShowcase('places-sponsored-showcase', places, {
            title: 'إعلانات وأنشطة مميزة',
            subtitle: 'أبرز الأنشطة التجارية في دليل المنزلة والمطرية الرقمي'
          });
        }

        renderCurrentPage();
      } catch (err) {
        console.warn('[PlacesPage] Paginated load:', err);
        if (reset && !places.length && grid) {
          grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">⚠️</div><h3 class="empty-state__title">تعذر تحميل الأماكن الآن</h3><p class="empty-state__text">تحقق من الاتصال وحاول مرة أخرى.</p></div>`;
        }
      } finally {
        if (serial === requestSerial) {
          isLoading = false;
          updateLoadingUI();
        }
      }
    }

    function applyFilters() {
      page = 1;
      hasMore = true;
      // Instant sub-second UI response
      renderCurrentPage();
      fetchPlacesPage({ reset: true });
    }

    async function loadMore() {
      if (isLoading || !hasMore) return;
      page += 1;
      await fetchPlacesPage({ reset: false });
    }

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
        renderCurrentPage();
      });
    });

    loadMoreBtn?.addEventListener('click', loadMore);
    searchInput?.addEventListener('input', debounce(() => applyFilters(), 300));
    areaSelect?.addEventListener('change', () => applyFilters());
    catSelect?.addEventListener('change', () => applyFilters());
    verifiedSelect?.addEventListener('change', () => applyFilters());
    sortSelect?.addEventListener('change', async () => {
      if (sortSelect.value === 'nearest' && !_userLocationCoords) {
        toast.info('جاري تحديد موقعك الجغرافي لحساب الأماكن الأقرب إليك… 📍');
        try {
          _userLocationCoords = await getUserLocation();
          toast.success('تم تحديد موقعك! 📍');
        } catch (err) {
          _userLocationCoords = MANZALA_CENTER;
          toast.info('تعذر الوصول لموقعك، تم استخدام مركز المنزلة للمقارنة.');
        }
      }
      applyFilters();
    });

    mountVoiceSearchButton({
      inputEl: searchInput,
      onSearch: () => applyFilters()
    });

    // First page only: no more 1000-record download on initial navigation.
    await fetchPlacesPage({ reset: true });

    realtimeHandler = async (e) => {
      const type = e.detail?.type;
      if (type === 'NEW_PLACE' || type === 'PLACE_UPDATED' || type === 'PLACE_DELETED' || type === 'DATA_VERSION_CHANGED') {
        await applyFilters();
      }
    };
    window.addEventListener('manzala:realtime_sync', realtimeHandler);

    intersectionObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMore();
    }, { rootMargin: '700px 0px' });
    if (loadSentinel) intersectionObserver.observe(loadSentinel);

    rotationTimer = setInterval(() => {
      if (sortSelect?.value === 'default' && !searchInput?.value.trim()) renderCurrentPage();
    }, 60000);

    _cleanupPlacesPage = () => {
      try { if (realtimeHandler) window.removeEventListener('manzala:realtime_sync', realtimeHandler); } catch (_) {}
      try { intersectionObserver?.disconnect(); } catch (_) {}
      try { if (rotationTimer) clearInterval(rotationTimer); } catch (_) {}
      _cleanupPlacesPage = null;
    };
  } catch (err) {
    console.error('[PlacesPage] Load error:', err);
  }
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sortDirectoryPlaces(places, currentUid = null, shuffleSponsored = true) {
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

  // Fair rotation: Randomly shuffle sponsored places every minute so each gets equal top billing
  const finalSponsored = (shuffleSponsored && sponsored.length > 1) ? shuffleArray(sponsored) : sponsored;

  return [...finalSponsored, ...regular];
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
