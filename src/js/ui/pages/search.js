/**
 * المنزلة وناسها — Search Page (Advanced High-Speed Search)
 * Ultra-fast local-first search with fuzzy Arabic NLP, synonyms, instant filters,
 * background Turso Edge synchronization, and AI Semantic Search.
 */

import { getPublishedPlaces, getCategories, getAllProducts, getActiveOffers, searchPlacesTurso } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { isPlaceSponsored } from '../components/SponsoredShowcase.js';
import { normalizeArabic, arabicScore, extractSearchKeywords, expandArabicSearchIntent } from '../../utils/arabic.js';
import { isAtmPlace, isAtmReadyAndOperational } from '../../utils/atm.js';
import { aiSmartSearch } from '../../services/ai.service.js';
import { mountVoiceSearchButton } from '../../services/voice.service.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_CENTER } from '../../utils/maps.js';
import { isPhoneSearchQuery, normalizePhoneNumber, matchPlaceByPhone, formatPhoneNumberForDisplay } from '../../utils/phone.js';
import { toast } from '../components/Toast.js';
import { getPlaceLiveStatus } from '../../utils/live-hours.js';

let _searchUserLocation = null;

// Category Synonyms Map for rich matching
const SEARCH_CATEGORY_SYNONYMS = {
  pharmacy: ['صيدليه', 'صيدلية', 'صيدليات', 'دوا', 'دواء', 'ادويه', 'ادوية', 'علاج', 'روشته', 'روشتة', 'مستلزمات طبيه', 'pharmacy'],
  atm: ['atm', 'ماكينه', 'ماكينة', 'ماكينات', 'صراف', 'صرف', 'بنك', 'فلوس', 'سحب', 'ايداع', 'كاش'],
  doctor: ['دكتور', 'طبيب', 'عياده', 'عيادة', 'استشاري', 'اخصائي', 'كشف', 'جراح', 'اسنان', 'باطنه', 'اطفال', 'عظام', 'جلديه', 'عيون', 'قلب', 'دكاتره'],
  restaurant: ['مطعم', 'اكل', 'وجبات', 'كريب', 'بيتزا', 'شاورما', 'برجر', 'فول', 'طعميه', 'مشويات', 'كباب', 'سمك', 'فسيخ', 'حواوشي', 'مطاعم'],
  cafe: ['كافيه', 'مقهى', 'قهوه', 'قهوة', 'كوفي', 'بن', 'شاي', 'عصائر', 'مشروبات', 'شيشه', 'كافيهات'],
  supermarket: ['سوبر ماركت', 'بقاله', 'بقالة', 'هايبر', 'ماركت', 'خضار', 'فاكهه', 'فاكهة', 'جبن', 'تموين', 'سوبرماركت'],
  bakery: ['مخبز', 'عيش', 'فينو', 'حلويات', 'تورته', 'تورتة', 'كيك', 'بسبوسه', 'بسبوسة', 'مخبوزات', 'فرن', 'مخابز'],
  roastery: ['محمصه', 'محمصة', 'بن', 'مكسرات', 'تسالي', 'لب', 'كاجو', 'فول سوداني', 'محامص'],
  plumbing: ['سباك', 'سباكه', 'سباكة', 'ادوات صحيه', 'ادوات صحية', 'مواسير', 'خلاطات', 'فلتر', 'سباكين'],
  carpenter: ['نجار', 'نجاره', 'نجارة', 'خشب', 'غرف نوم', 'موبيليا', 'ابواب', 'شبابيك', 'نجارين'],
  electrician: ['كهربائي', 'كهرباء', 'مفاتيح', 'صيانة كهربائية', 'ليدات', 'كهربائيه'],
  mechanic: ['ميكانيكي', 'سيارات', 'صيانة سيارات', 'زيوت', 'قطع غيار', 'كاوتش', 'ميكانيكيه']
};

export async function renderSearchPage($container, { q = '', user } = {}) {
  const initialQ = (q || '').trim();

  $container.innerHTML = `
    <div class="container" style="padding-top:var(--space-3)">
      <div class="page-back-bar">
        <button type="button" class="btn-page-back" id="btn-search-back" title="الرجوع للصفحة السابقة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 19 12 12 5"></polyline>
          </svg>
          <span>رجوع</span>
        </button>
        <nav class="page-breadcrumbs" aria-label="مسار التنقل">
          <a href="index.html">الرئيسية</a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">البحث المتقدم</span>
        </nav>
      </div>
    </div>

    <!-- Search Hero Header (Luxury 2026 Redesign) -->
    <div class="search-page-hero-luxury">
      <!-- Ambient Glowing Backdrop Orbs -->
      <div class="search-hero-orb search-hero-orb-1" aria-hidden="true"></div>
      <div class="search-hero-orb search-hero-orb-2" aria-hidden="true"></div>

      <div class="container text-center" style="position:relative;z-index:2">
        <!-- Floating Shimmer Tag Badge -->
        <div class="search-hero-badge-wrap">
          <span class="search-hero-badge">
            <span class="search-hero-badge-icon">⚡</span>
            <span>البحث الفوري فائق السرعة بالذكاء الاصطناعي 2026</span>
          </span>
        </div>

        <!-- Main Title -->
        <h1 class="search-hero-title">
          <span class="search-hero-title-icon" aria-hidden="true">🔍</span>
          <span>البحث الذكي في </span>
          <span class="search-hero-title-gradient">دليل المنزلة والمطرية</span>
        </h1>

        <!-- Subtitle -->
        <p class="search-hero-subtitle">
          ابحث بالاسم، النشاط التجاري، التخصص الطبي، الصنايعية والحرفيين، أو برقم الهاتف في كافة المدن والقرى
        </p>

        <!-- Search Input Stage (Neon Glow Aura Pill) -->
        <div class="search-hero-input-stage">
          <div class="search-pill-glow-wrap" id="search-pill-glow-wrap">
            <div class="search-pill-inner" role="search">
              <!-- Right Circular Search Submit Button (First in RTL) -->
              <button class="search-pill-btn-submit" id="search-page-btn" aria-label="تنفيذ البحث" title="ابحث الآن">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              <!-- Main Input Field -->
              <input
                type="search"
                id="search-page-input"
                class="search-pill-field"
                placeholder="ابحث عن مكان، دكتور، صيدلية، مطعم، سباك، أو برقم الهاتف..."
                value="${escAttr(initialQ)}"
                autocomplete="off"
                aria-label="اكتب ما تبحث عنه"
              />

              <!-- Smooth Clear Button -->
              <button type="button" class="search-pill-clear" id="btn-search-clear" aria-label="مسح البحث" title="مسح النص" style="display:${initialQ ? 'inline-flex' : 'none'}">
                ✕
              </button>

              <!-- Divider -->
              <div class="search-pill-sep" aria-hidden="true"></div>

              <!-- Dedicated Voice Search Slot -->
              <div class="search-pill-voice-slot" id="search-page-voice-slot">
                <!-- Voice button mounted cleanly via mountVoiceSearchButton -->
              </div>
            </div>
          </div>

          <!-- Quick Actions & Cities Row -->
          <div class="search-hero-actions-bar">
            <button type="button" class="search-ai-magic-btn" id="btn-ai-search" title="تحليل نية البحث واقتراح أفضل النتائج بالذكاء الاصطناعي">
              <span class="ai-sparkle-icon">✨</span>
              <span>بحث ذكي بالذكاء الاصطناعي</span>
            </button>

            <span class="search-hero-actions-sep" aria-hidden="true">|</span>
            <span class="search-hero-actions-label">📍 مدن سريعة:</span>

            <div class="search-hero-chips-wrap">
              <button type="button" class="search-quick-city-chip" data-quick-area="المنزلة">🏙️ المنزلة</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="المطرية">🌊 المطرية</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="العصافرة">🌾 العصافرة</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="الجمالية">🏛️ الجمالية</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="ميت سلسيل">🏢 ميت سلسيل</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Results Container -->
    <div class="container section" style="padding-top:0">
      
      <!-- Modern Filter Card -->
      <div class="search-filter-card">
        <div class="search-filters-bar">
          <!-- 1. Category Filter -->
          <div class="search-filter-select-wrap">
            <label class="search-filter-label" for="search-category-select">📂 القسم / النشاط</label>
            <select id="search-category-select" class="search-filter-select">
              <option value="all">كافة التصنيفات والأنشطة</option>
              <option value="restaurants">🍔 مطاعم ومأكولات</option>
              <option value="cafes">☕ كافيهات ومقاهي</option>
              <option value="doctors">🩺 أطباء وعيادات</option>
              <option value="pharmacies">💊 صيدليات ومستلزمات طبية</option>
              <option value="supermarkets">🛒 سوبر ماركت ومواد غذائية</option>
              <option value="bakeries">🥖 مخابز وحلواني</option>
              <option value="crafts">🛠️ صنايعية ومهن حرفية</option>
              <option value="clothing">👗 ملابس وأزياء</option>
              <option value="electronics">📱 إلكترونيات وموبايلات</option>
              <option value="services">🏢 بنوك وماكينات ATM وخدمات</option>
              <option value="automotive">🚗 سيارات وصيانة</option>
            </select>
          </div>

          <!-- 2. Area Filter -->
          <div class="search-filter-select-wrap">
            <label class="search-filter-label" for="search-area-select">📍 المدينة / القرية</label>
            <select id="search-area-select" class="search-filter-select">
              <option value="all">كافة المدن والقرى</option>
              <option value="المنزلة">🏙️ المنزلة (المدينة)</option>
              <option value="المطرية">🌊 المطرية (دقهلية)</option>
              <option value="العصافرة">🌾 العصافرة</option>
              <option value="الجمالية">🏛️ الجمالية</option>
              <option value="ميت سلسيل">🏢 ميت سلسيل</option>
              <option value="البصراط">🏡 البصراط</option>
              <option value="العزيزة">🌴 العزيزة</option>
              <option value="الأحمدية">🌾 الأحمدية</option>
              <option value="الروضة">🌺 الروضة</option>
              <option value="الحوتة">🐟 الحوتة</option>
              <option value="النسايمة">🌳 النسايمة</option>
              <option value="ميت خضير">🏘️ ميت خضير</option>
              <option value="ميت شريف">🏡 ميت شريف</option>
            </select>
          </div>

          <!-- 3. Sort Filter -->
          <div class="search-filter-select-wrap">
            <label class="search-filter-label" for="search-sort-select">⚡ ترتيب النتائج</label>
            <select id="search-sort-select" class="search-filter-select">
              <option value="relevance">🎯 الأكثر مطابقة</option>
              <option value="nearest">📍 الأقرب إليّ (GPS)</option>
              <option value="highest-rating">★ الأعلى تقييماً (5.0 → 1.0)</option>
              <option value="most-reviews">💬 الأكثر تقييماً</option>
              <option value="newest">🆕 الأحدث إضافة</option>
            </select>
          </div>
        </div>

        <!-- Smart Quick Filter Pills -->
        <div class="search-smart-filters" id="search-smart-filters" aria-label="فلاتر سريعة">
          <button type="button" class="search-smart-filter is-active" data-smart-filter="all">✨ الكل</button>
          <button type="button" class="search-smart-filter" data-smart-filter="open">🟢 مفتوح الآن</button>
          <button type="button" class="search-smart-filter" data-smart-filter="verified">🛡️ موثق فقط</button>
          <button type="button" class="search-smart-filter" data-smart-filter="top">⭐ تقييم 4.5+</button>
          <button type="button" class="search-smart-filter" data-smart-filter="nearby">📍 الأقرب إليّ</button>
          <button type="button" class="search-smart-filter" data-smart-filter="offers">🏷️ به عروض</button>
        </div>
      </div>

      <!-- Results Meta Summary -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div class="search-results-meta" id="search-meta" style="margin:0;font-size:0.95rem;font-weight:700">
          جاري البحث...
        </div>
        <button type="button" id="btn-reset-filters" class="btn btn-sm btn-outline" style="border-radius:10px;font-size:12px;display:none">
          🔄 إعادة ضبط الفلاتر
        </button>
      </div>

      <!-- Results Grid -->
      <div class="places-grid" id="search-results-grid">
        ${Array(4).fill(renderPlaceCardSkeleton()).join('')}
      </div>

      <!-- Pagination / Load More -->
      <div id="search-pagination-container" style="text-align:center;margin-top:var(--space-6);display:none">
        <button id="btn-load-more-search" class="btn btn-outline" style="padding:10px 28px;border-radius:12px;font-size:14px;font-weight:700">
          عرض المزيد من النتائج ⬇️
        </button>
      </div>
    </div>
  `;

  const searchInput = document.getElementById('search-page-input');
  const searchBtn = document.getElementById('search-page-btn');
  const searchClearBtn = document.getElementById('btn-search-clear');
  const categorySelect = document.getElementById('search-category-select');
  const areaSelect = document.getElementById('search-area-select');
  const sortSelect = document.getElementById('search-sort-select');
  const aiSearchBtn = document.getElementById('btn-ai-search');
  const resetFiltersBtn = document.getElementById('btn-reset-filters');
  const metaEl = document.getElementById('search-meta');
  const gridEl = document.getElementById('search-results-grid');

  let allPlaces = [];
  let activeSmartFilter = 'all';
  let currentUser = getCurrentUser() || user;

  // 1. Ensure Local In-Memory Cache (0ms response)
  async function ensureLocalPlaces() {
    if (allPlaces.length > 0) return allPlaces;
    try {
      allPlaces = await getPublishedPlaces({ limit: 400 });
    } catch (_) {
      allPlaces = [];
    }
    return allPlaces;
  }

  // Pre-hydrate in background immediately
  ensureLocalPlaces().then(() => {
    if (!initialQ && searchInput && !searchInput.value.trim()) {
      applyFiltersAndRender();
    }
  });

  // Apply all active filters & sort on places
  async function applyFiltersAndRender() {
    const q = (searchInput?.value || '').trim();
    const cat = categorySelect?.value || 'all';
    const area = areaSelect?.value || 'all';
    const sortBy = sortSelect?.value || 'relevance';

    // Show reset button if any filter is non-default
    if (resetFiltersBtn) {
      resetFiltersBtn.style.display = (cat !== 'all' || area !== 'all' || activeSmartFilter !== 'all' || q) ? 'inline-flex' : 'none';
    }

    if (searchClearBtn) {
      searchClearBtn.style.display = q ? 'inline-flex' : 'none';
    }

    // Sync selected state on quick area chips
    document.querySelectorAll('[data-quick-area]').forEach(c => {
      c.classList.toggle('is-active', c.getAttribute('data-quick-area') === area);
    });

    // If query looks like a phone number, run phone search
    if (isPhoneSearchQuery(q)) {
      await handlePhoneSearch(q);
      return;
    }

    await ensureLocalPlaces();
    let places = [...allPlaces];

    // Text search scoring
    if (q) {
      const rawClean = extractSearchKeywords(q);
      const normalQ = normalizeArabic(rawClean);
      const queryIntents = expandArabicSearchIntent(q);

      const scored = places.map(place => {
        const nameScore = Math.max(arabicScore(place.name || '', q), arabicScore(place.name || '', rawClean));
        const nameEnScore = place.nameEn ? (place.nameEn.toLowerCase().includes(q.toLowerCase()) ? 90 : 0) : 0;

        let categorySynonymScore = 0;
        const placeCatKey = (place.categoryId || '').toLowerCase();
        const placeCatName = normalizeArabic((place.customCategory || '') + ' ' + (place.categoryName || '')).toLowerCase();
        const placeNameNorm = normalizeArabic(place.name || '').toLowerCase();

        for (const [cKey, syns] of Object.entries(SEARCH_CATEGORY_SYNONYMS)) {
          if (placeCatKey.includes(cKey) || placeCatName.includes(cKey) || placeNameNorm.includes(cKey)) {
            if (syns.some(s => normalQ.includes(s) || s.includes(normalQ) || queryIntents.includes(s))) {
              categorySynonymScore = 95;
              break;
            }
          }
        }

        let specialtyScore = 0;
        if (place.medicalSpecialty) {
          const specNorm = normalizeArabic(place.medicalSpecialty);
          if (specNorm.includes(normalQ) || normalQ.includes(specNorm)) specialtyScore = 95;
        }

        let serviceScore = 0;
        if (Array.isArray(place.services)) {
          place.services.forEach(s => {
            const ns = normalizeArabic(s);
            if (ns.includes(normalQ) || normalQ.includes(ns)) serviceScore = Math.max(serviceScore, 90);
          });
        }

        const addressScore = place.address ? Math.max(arabicScore(place.address, q), arabicScore(place.address, rawClean)) * 0.9 : 0;
        const areaScore = Math.max(arabicScore(place.area || '', q), arabicScore(place.area || '', rawClean)) * 0.85;

        const total = Math.max(nameScore, nameEnScore, categorySynonymScore, specialtyScore, serviceScore, addressScore, areaScore);
        return { place, total };
      })
      .filter(item => item.total > 0 && (!isAtmPlace(item.place) || isAtmReadyAndOperational(item.place, 15)))
      .sort((a, b) => b.total - a.total)
      .map(item => item.place);

      places = scored;
    }

    // Filter by Category Select
    if (cat !== 'all') {
      places = places.filter(p => {
        const pCat = (p.categoryId || '').toLowerCase();
        const pCustom = (p.customCategory || '').toLowerCase();
        const pName = (p.categoryName || '').toLowerCase();
        if (cat === 'restaurants') return pCat.includes('restaurant') || pCat.includes('food') || pCustom.includes('مطعم') || pName.includes('مطعم');
        if (cat === 'cafes') return pCat.includes('cafe') || pCustom.includes('كافيه') || pName.includes('كافيه') || pCustom.includes('قهوة');
        if (cat === 'doctors') return pCat.includes('doctor') || pCat.includes('clinic') || pCustom.includes('طبيب') || pCustom.includes('دكتور');
        if (cat === 'pharmacies') return pCat.includes('pharmacy') || pCustom.includes('صيدلية');
        if (cat === 'supermarkets') return pCat.includes('supermarket') || pCat.includes('grocery') || pCustom.includes('سوبر') || pCustom.includes('ماركت');
        if (cat === 'bakeries') return pCat.includes('bakery') || pCustom.includes('مخبز') || pCustom.includes('حلواني');
        if (cat === 'crafts') return pCat.includes('craft') || pCat.includes('plumbing') || pCat.includes('carpenter') || pCustom.includes('سباك') || pCustom.includes('نجار') || pCustom.includes('كهربائي');
        if (cat === 'clothing') return pCat.includes('clothing') || pCat.includes('fashion') || pCustom.includes('ملابس');
        if (cat === 'electronics') return pCat.includes('electronic') || pCat.includes('mobile') || pCustom.includes('موبايل') || pCustom.includes('كمبيوتر');
        if (cat === 'services') return pCat.includes('atm') || pCat.includes('bank') || pCat.includes('service') || pCustom.includes('بنك');
        if (cat === 'automotive') return pCat.includes('car') || pCat.includes('auto') || pCat.includes('mechanic') || pCustom.includes('سيارات');
        return pCat === cat || pCustom.includes(cat);
      });
    }

    // Filter by Area Select
    if (area !== 'all') {
      places = places.filter(p => {
        const pArea = (p.area || '').toLowerCase();
        const pAddress = (p.address || '').toLowerCase();
        return pArea.includes(area.toLowerCase()) || pAddress.includes(area.toLowerCase());
      });
    }

    // Filter by Smart Pills
    if (activeSmartFilter === 'verified') {
      places = places.filter(p => Boolean(p.isVerified));
    } else if (activeSmartFilter === 'top') {
      places = places.filter(p => Number(p.rating || 0) >= 4.5);
    } else if (activeSmartFilter === 'open') {
      places = places.filter(p => {
        const live = getPlaceLiveStatus(p.openHours || p.workingHours || p.working_hours);
        return live.isOpen === true;
      });
    } else if (activeSmartFilter === 'offers') {
      places = places.filter(p => Number(p.offer_count || p.offerCount || 0) > 0);
    } else if (activeSmartFilter === 'nearby') {
      if (!_searchUserLocation) {
        try { _searchUserLocation = await getUserLocation(); } catch (_) { _searchUserLocation = MANZALA_CENTER; }
      }
      places = sortPlacesByDistance(places, _searchUserLocation);
    }

    // Sorting
    if (sortBy === 'nearest') {
      if (!_searchUserLocation) {
        try {
          _searchUserLocation = await getUserLocation();
          toast.success('تم تحديد موقعك وترتيب الأماكن حسب الأقرب لك 📍');
        } catch (_) {
          _searchUserLocation = MANZALA_CENTER;
        }
      }
      places = sortPlacesByDistance(places, _searchUserLocation);
    } else if (sortBy === 'highest-rating') {
      places.sort((a, b) => (Number(b.rating) || 5.0) - (Number(a.rating) || 5.0));
    } else if (sortBy === 'most-reviews') {
      places.sort((a, b) => (Number(b.reviewCount || b.review_count) || 0) - (Number(a.reviewCount || a.review_count) || 0));
    } else if (sortBy === 'newest') {
      places.sort((a, b) => (b.created_at || b.updated_at || 0) - (a.created_at || a.updated_at || 0));
    }

    renderResultsToDOM(places, q);
  }

  function renderResultsToDOM(places, q) {
    if (!gridEl) return;

    if (metaEl) {
      if (q) {
        metaEl.innerHTML = `تم العثور على <strong style="color:var(--primary);font-size:1.1rem">${places.length}</strong> مكان لـ: "<strong>${escHtml(q)}</strong>" <span style="background:rgba(16,185,129,0.12);color:#059669;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;margin-right:6px">⚡ فوري</span>`;
      } else {
        metaEl.innerHTML = `عرض <strong style="color:var(--primary);font-size:1.1rem">${places.length}</strong> مكان في الدليل`;
      }
    }

    if (places.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;background:var(--surface);border:1px dashed var(--border);border-radius:20px;padding:48px 20px;text-align:center">
          <div style="font-size:3.5rem;margin-bottom:12px">🔍</div>
          <h3 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-bottom:8px">لم نعثر على أماكن مطابقة</h3>
          <p style="color:var(--text-muted);font-size:0.95rem;max-width:500px;margin:0 auto 20px auto">
            جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر (التصنيف أو المنطقة).
          </p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
            <button type="button" class="btn btn-primary btn-sm" id="btn-empty-reset" style="padding:8px 20px;border-radius:10px;font-weight:700">
              🔄 إعادة ضبط الفلاتر
            </button>
            <a href="dashboard.html?section=add" class="btn btn-outline btn-sm" style="padding:8px 20px;border-radius:10px;font-weight:700">
              ➕ إضافة هذا المكان للدليل
            </a>
          </div>
          <div style="margin-top:20px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--text-muted)">اقتراحات شائعة:</span>
            <button class="chip" onclick="searchFor('مطاعم')">🍔 مطاعم</button>
            <button class="chip" onclick="searchFor('صيدلية')">💊 صيدلية</button>
            <button class="chip" onclick="searchFor('دكتور')">🩺 دكتور</button>
            <button class="chip" onclick="searchFor('سباك')">🛠️ سباك</button>
            <button class="chip" onclick="searchFor('المطرية')">🌊 المطرية</button>
          </div>
        </div>
      `;
      document.getElementById('btn-empty-reset')?.addEventListener('click', resetAllFilters);
    } else {
      gridEl.innerHTML = places.map(p => renderPlaceCard(p)).join('');
    }
  }

  async function handlePhoneSearch(query) {
    const qPhone = normalizePhoneNumber(query);
    const displayPhone = formatPhoneNumberForDisplay(qPhone);
    await ensureLocalPlaces();
    let matched = allPlaces.filter(p => matchPlaceByPhone(p, qPhone) && (!isAtmPlace(p) || isAtmReadyAndOperational(p, 15)));

    if (matched.length > 0) {
      toast.success(`تم العثور على (${matched.length}) نشاط مرتبط برقم الهاتف 📞`);
      if (metaEl) {
        metaEl.innerHTML = `📞 تم العثور على <strong>${matched.length}</strong> نشاط مرتبط بالرقم: <span style="direction:ltr;display:inline-block;font-weight:900;color:var(--primary);font-size:15px">${escHtml(displayPhone)}</span>`;
      }
      if (gridEl) gridEl.innerHTML = matched.map(p => renderPlaceCard(p)).join('');
    } else {
      if (metaEl) {
        metaEl.innerHTML = `⚠️ لا يوجد نشاط تجاري مرتبط برقم الهاتف: <span style="direction:ltr;font-weight:800;color:#B45309">${escHtml(displayPhone)}</span>`;
      }
      if (gridEl) {
        gridEl.innerHTML = `
          <div class="empty-state phone-empty-state animate-fade-in" style="grid-column:1/-1;background:var(--surface);border:1.5px solid #F59E0B;border-radius:20px;padding:40px 24px;text-align:center;max-width:640px;margin:1.5rem auto">
            <div style="width:70px;height:70px;border-radius:50%;background:rgba(245,158,11,0.14);color:#D97706;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px auto">
              📞
            </div>
            <h2 style="font-size:1.35rem;font-weight:900;color:var(--text-primary);margin-bottom:8px">
              لا يوجد نشاط مسجل برقم الهاتف هذا
            </h2>
            <div style="display:inline-block;background:rgba(2,132,199,0.08);color:#0284C7;font-weight:900;font-size:16px;padding:6px 20px;border-radius:9999px;margin-bottom:14px;direction:ltr">
              ${escHtml(displayPhone)}
            </div>
            <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;margin:0 0 20px 0">
              لم نعثر على أي نشاط أو محل أو دكتور مسجل بهذا الرقم. إذا كنت صاحب هذا النشاط، يمكنك إضافته مجاناً ليظهر للآلاف فوراً.
            </p>
            <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
              <a href="dashboard.html?section=add&phone=${encodeURIComponent(qPhone)}" class="btn btn-primary" style="padding:10px 22px;border-radius:12px;font-size:13.5px">
                ➕ إضافة هذا النشاط للدليل
              </a>
              <button type="button" class="btn btn-outline" id="btn-phone-clear-search" style="padding:10px 20px;border-radius:12px;font-size:13.5px">
                🔍 البحث باسم آخر
              </button>
            </div>
          </div>
        `;
        document.getElementById('btn-phone-clear-search')?.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            applyFiltersAndRender();
            searchInput.focus();
          }
        });
      }
    }
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = 'all';
    if (areaSelect) areaSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'relevance';
    activeSmartFilter = 'all';
    document.querySelectorAll('.search-smart-filter').forEach(b => {
      b.classList.toggle('is-active', b.dataset.smartFilter === 'all');
    });
    document.querySelectorAll('[data-quick-area]').forEach(c => c.classList.remove('is-active'));
    applyFiltersAndRender();
  }

  // Live Instant Debounce
  let _liveSearchTimer = null;
  let _edgeSyncTimer = null;

  searchInput?.addEventListener('input', (e) => {
    clearTimeout(_liveSearchTimer);
    clearTimeout(_edgeSyncTimer);
    const val = e.target.value;

    // Fast local filter (immediate 40ms)
    _liveSearchTimer = setTimeout(() => {
      applyFiltersAndRender();
    }, 40);

    // Deep Edge search sync after 300ms if query >= 2 chars
    if (val.trim().length >= 2) {
      _edgeSyncTimer = setTimeout(async () => {
        try {
          const tursoRes = await searchPlacesTurso(val.trim(), {
            category: categorySelect?.value !== 'all' ? categorySelect?.value : '',
            area: areaSelect?.value !== 'all' ? areaSelect?.value : '',
            limit: 30
          });
          if (tursoRes && Array.isArray(tursoRes.places) && tursoRes.places.length > 0) {
            const existingKeys = new Set(allPlaces.map(p => p.id || p.slug));
            let addedNew = false;
            tursoRes.places.forEach(tp => {
              if (!existingKeys.has(tp.id) && !existingKeys.has(tp.slug)) {
                allPlaces.push(tp);
                existingKeys.add(tp.id || tp.slug);
                addedNew = true;
              }
            });
            if (addedNew) {
              applyFiltersAndRender();
            }
          }
        } catch (_) {}
      }, 300);
    }
  });

  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      applyFiltersAndRender();
      searchInput.focus();
    }
  });

  searchBtn?.addEventListener('click', () => {
    applyFiltersAndRender();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyFiltersAndRender();
    }
  });

  categorySelect?.addEventListener('change', () => applyFiltersAndRender());
  areaSelect?.addEventListener('change', () => applyFiltersAndRender());
  sortSelect?.addEventListener('change', () => applyFiltersAndRender());
  resetFiltersBtn?.addEventListener('click', resetAllFilters);

  // Smart Pills Click
  document.querySelectorAll('.search-smart-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.search-smart-filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeSmartFilter = btn.dataset.smartFilter || 'all';
      applyFiltersAndRender();
    });
  });

  // Quick Area Chips Click (with toggle)
  document.querySelectorAll('[data-quick-area]').forEach(chip => {
    chip.addEventListener('click', () => {
      const area = chip.getAttribute('data-quick-area');
      if (areaSelect) {
        areaSelect.value = (areaSelect.value === area) ? 'all' : area;
      }
      applyFiltersAndRender();
    });
  });

  // AI Smart Search Button
  aiSearchBtn?.addEventListener('click', async () => {
    const q = searchInput?.value?.trim() || 'أفضل الأماكن';
    await ensureLocalPlaces();
    if (metaEl) metaEl.innerHTML = `✨ جاري التحليل الذكي للبحث عن: "<strong>${escHtml(q)}</strong>"...`;
    try {
      const aiRes = await aiSmartSearch(q, allPlaces);
      if (aiRes && aiRes.results && aiRes.results.length > 0) {
        const matchedIds = new Set(aiRes.results.map(r => r.id));
        const results = allPlaces.filter(p => matchedIds.has(p._key || p.id));
        renderResultsToDOM(results, q);
        if (metaEl) metaEl.innerHTML = `✨ نتائج ذكية مقترحة بالذكاء الاصطناعي لـ: "<strong>${escHtml(q)}</strong>" (${results.length})`;
      } else {
        applyFiltersAndRender();
      }
    } catch (_) {
      applyFiltersAndRender();
    }
  });

  // Global helper for quick search
  window.searchFor = (keyword) => {
    if (searchInput) searchInput.value = keyword;
    applyFiltersAndRender();
  };

  // Back button
  document.getElementById('btn-search-back')?.addEventListener('click', () => {
    if (window.history.length > 1 && document.referrer && !document.referrer.includes('login')) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });

  // Initialize Voice Search Button in dedicated luxury slot
  const voiceSlot = document.getElementById('search-page-voice-slot');
  try {
    mountVoiceSearchButton({
      inputEl: searchInput,
      buttonContainerEl: voiceSlot,
      onSearch: (spokenText) => {
        if (searchInput) searchInput.value = spokenText;
        applyFiltersAndRender();
      }
    });
  } catch (_) {}

  // Trigger initial search if q was passed in URL
  if (initialQ) {
    applyFiltersAndRender();
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
