/**
 * المنزلة وناسها — Search Page
 * Smart Arabic text search with normalization, synonyms, instant caching,
 * and AI Semantic Search integration.
 */

import { getPublishedPlaces, getCategories, getAllProducts, getActiveOffers } from '../../core/db.js';
import { executeFastSearch } from '../../services/search-engine.service.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { normalizeArabic, arabicScore, extractSearchKeywords, expandArabicSearchIntent, arabicMatch } from '../../utils/arabic.js';
import { isAtmPlace, isAtmReadyAndOperational } from '../../utils/atm.js';
import { aiSearch, aiSmartSearch } from '../../services/ai.service.js';
import { mountVoiceSearchButton } from '../../services/voice.service.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_CENTER, MANZALA_VILLAGES_LIST } from '../../utils/maps.js';
import { toast } from '../components/Toast.js';

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

export async function renderSearchPage($container, { q = '', user }) {
  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="font-size:var(--font-size-3xl);font-weight:800;color:#fff;margin-bottom:var(--space-4)">
          البحث في دليل المنزلة والمطرية الرقمي
        </h1>
        
        <!-- Search Form -->
        <div style="max-width:680px;margin:0 auto">
          <div class="hero-search" style="box-shadow:var(--shadow-xl)">
            <input
              type="search"
              id="search-page-input"
              class="hero-search__input"
              placeholder="ابحث عن مكان، دكتور، صيدلية، سباك، محل في المنزلة والمطرية والقرى..."
              value="${escAttr(q)}"
              autocomplete="off"
            />
            <button class="hero-search__btn" id="search-page-btn">
              <span>🔍</span> بحث
            </button>
          </div>

          <!-- Smart AI Button & Quick Filter Chips -->
          <div style="margin-top:var(--space-3);display:flex;align-items:center;justify-content:center;gap:var(--space-2);flex-wrap:wrap">
            <button class="btn btn-sm btn-outline" id="btn-ai-search" style="border-color:rgba(255,255,255,0.4);color:#fff">
              ✨ بحث ذكي بالذكاء الاصطناعي
            </button>
            <span style="color:rgba(255,255,255,0.7);font-size:var(--font-size-xs)">|</span>
            <span style="color:rgba(255,255,255,0.8);font-size:var(--font-size-xs)">المدن والقرى:</span>
            <button class="chip" onclick="searchFor('المنزلة')" style="cursor:pointer">🏙️ المنزلة</button>
            <button class="chip" onclick="searchFor('المطرية')" style="cursor:pointer">🌊 المطرية</button>
            <button class="chip" onclick="searchFor('العصافرة')" style="cursor:pointer">🌾 العصافرة</button>
            <button class="chip" onclick="searchFor('الجمالية')" style="cursor:pointer">🏛️ الجمالية</button>
            <button class="chip" onclick="searchFor('ميت سلسيل')" style="cursor:pointer">🏢 ميت سلسيل</button>
            <button class="chip" onclick="searchFor('البصراط')" style="cursor:pointer">🏡 البصراط</button>
            <button class="chip" onclick="searchFor('العزيزة')" style="cursor:pointer">🌴 العزيزة</button>
            <button class="chip" onclick="searchFor('الأحمدية')" style="cursor:pointer">🌾 الأحمدية</button>
            <button class="chip" onclick="searchFor('الروضة')" style="cursor:pointer">🌺 الروضة</button>
            <button class="chip" onclick="searchFor('الحوتة')" style="cursor:pointer">🐟 الحوتة</button>
            <button class="chip" onclick="searchFor('النسايمة')" style="cursor:pointer">🌳 النسايمة</button>
            <button class="chip" onclick="searchFor('ميت خضير')" style="cursor:pointer">🏘️ ميت خضير</button>
            <button class="chip" onclick="searchFor('ميت شريف')" style="cursor:pointer">🏡 ميت شريف</button>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-4)">
        <div class="search-results-meta" id="search-meta" style="margin:0">
          ${q ? `نتائج البحث عن: "<strong>${escHtml(q)}</strong>"` : 'أدخل كلمة البحث للبدء'}
        </div>
        <select id="search-sort-filter" class="form-select" style="max-width:210px;margin:0">
          <option value="relevance">🎯 الأكثر مطابقة</option>
          <option value="nearest">📍 الأقرب إليّ (حسب موقعي GPS)</option>
          <option value="highest-rating">★ الأعلى تقييماً (5.0 → 1.0)</option>
          <option value="most-reviews">💬 الأكثر تقييماً</option>
          <option value="negative">⚠️ التقييمات الأقل / سلبية</option>
        </select>
      </div>

      <div class="places-grid" id="search-results-grid">
        ${q ? Array(4).fill(renderPlaceCardSkeleton()).join('') : ''}
      </div>
    </div>
  `;

  const searchInput = document.getElementById('search-page-input');
  const searchBtn = document.getElementById('search-page-btn');
  const searchSort = document.getElementById('search-sort-filter');
  const aiSearchBtn = document.getElementById('btn-ai-search');
  const metaEl = document.getElementById('search-meta');
  const gridEl = document.getElementById('search-results-grid');

  let allPlaces = [];
  let allProductsList = [];
  let allOffersList = [];

  // Fast pre-fetch places, products, and offers in parallel
  try {
    const [pList, prList, offList] = await Promise.all([
      getPublishedPlaces({ limit: 200 }),
      getAllProducts().catch(() => []),
      getActiveOffers().catch(() => [])
    ]);
    allPlaces = pList || [];
    allProductsList = prList || [];
    allOffersList = offList || [];
  } catch (err) {
    console.warn('Failed to pre-fetch places for search:', err);
  }

  const currentUser = getCurrentUser() || user;

  async function performSearch(queryText, isAi = false) {
    const query = (queryText || '').trim();
    if (!query) {
      if (metaEl) metaEl.innerHTML = 'يرجى إدخال كلمة للبحث';
      if (gridEl) gridEl.innerHTML = '';
      return;
    }

    saveSearchHistory(query);

    if (isAi) {
      if (metaEl) metaEl.innerHTML = `✨ جاري التحليل الذكي للبحث عن "<strong>${escHtml(query)}</strong>"...`;
      aiSmartSearch(query, allPlaces).then(async (aiRes) => {
        if (aiRes && aiRes.results && aiRes.results.length > 0) {
          const matchedIds = new Set(aiRes.results.map(r => r.id));
          const results = allPlaces.filter(p => matchedIds.has(p._key || p.id));
          await renderResults(results, `✨ نتائج ذكية مقترحة لـ "<strong>${escHtml(query)}</strong>" (${results.length})`);
        } else {
          await localSearch(query);
        }
      }).catch(async () => await localSearch(query));
    } else {
      await localSearch(query);
    }
  }

  async function localSearch(query) {
    const rawClean = extractSearchKeywords(query);
    const normalQ = normalizeArabic(rawClean);
    const queryIntents = expandArabicSearchIntent(query);

    const scored = allPlaces.map(place => {
      // 1. Name & NameEn Match
      const nameScore = Math.max(arabicScore(place.name || '', query), arabicScore(place.name || '', rawClean));
      const nameEnScore = place.nameEn ? (place.nameEn.toLowerCase().includes(query.toLowerCase()) ? 90 : 0) : 0;

      // 2. Category Synonyms Match (e.g. صيدليه / صيدلية / علاج / بنك / atm / مطعم)
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
        if (syns.some(s => normalQ === s || normalQ.includes(s))) {
          if (placeCatKey.includes(cKey) || placeCatName.includes(cKey) || placeNameNorm.includes(cKey)) {
            categorySynonymScore = 95;
            break;
          }
        }
      }

      // 3. Medical Specialty Match
      let specialtyScore = 0;
      if (place.medicalSpecialty) {
        const specNorm = normalizeArabic(place.medicalSpecialty);
        if (specNorm.includes(normalQ) || normalQ.includes(specNorm)) {
          specialtyScore = 95;
        } else if (queryIntents.some(intent => specNorm.includes(intent) || intent.includes(specNorm))) {
          specialtyScore = 90;
        }
      }

      // 4. Services Match
      let serviceScore = 0;
      if (place.services && Array.isArray(place.services)) {
        place.services.forEach(s => {
          const ns = normalizeArabic(s);
          if (ns.includes(normalQ) || normalQ.includes(ns)) serviceScore = Math.max(serviceScore, 90);
          if (queryIntents.some(intent => ns.includes(intent) || intent.includes(ns))) {
            serviceScore = Math.max(serviceScore, 80);
          }
        });
      }

      // 5. Products Match
      let productScore = 0;
      const placeProducts = (allProductsList || []).filter(prod => prod.placeId === (place.id || place.slug));
      for (const prod of placeProducts) {
        const prodNameNorm = normalizeArabic(prod.name || '').toLowerCase();
        if (prodNameNorm.includes(normalQ) || normalQ.includes(prodNameNorm) || queryIntents.some(i => prodNameNorm.includes(i) || i.includes(prodNameNorm))) {
          productScore = 95;
          break;
        }
      }

      // 6. Offers Match
      let offerScore = 0;
      const placeOffers = (allOffersList || []).filter(off => off.placeId === (place.id || place.slug));
      for (const off of placeOffers) {
        const offTitleNorm = normalizeArabic(off.title || '').toLowerCase();
        if (offTitleNorm.includes(normalQ) || normalQ.includes(offTitleNorm) || queryIntents.some(i => offTitleNorm.includes(i) || i.includes(offTitleNorm))) {
          offerScore = 90;
          break;
        }
      }

      // 7. Address & Area Match
      const addressScore = place.address ? Math.max(arabicScore(place.address, query), arabicScore(place.address, rawClean)) * 0.9 : 0;
      const areaScore = Math.max(arabicScore(place.area || '', query), arabicScore(place.area || '', rawClean)) * 0.85;

      // 8. Category Text Match
      let catScore = 0;
      const catVal = normalizeArabic(`${place.customCategory || ''} ${place.categoryName || ''} ${place.categoryId || ''}`);
      if (catVal.includes(normalQ) || normalQ.includes(catVal)) {
        catScore = 85;
      } else if (queryIntents.some(intent => catVal.includes(intent) || intent.includes(catVal))) {
        catScore = 75;
      }

      // 9. Description Match
      const descScore = place.description ? Math.max(arabicScore(place.description, query), arabicScore(place.description, rawClean)) * 0.75 : 0;

      // 10. Semantic Cross-field Match
      let semanticScore = 0;
      const fullPlaceIndex = normalizeArabic(
        `${place.name || ''} ${place.nameEn || ''} ${place.medicalSpecialty || ''} ${(place.services || []).join(' ')} ${place.address || ''} ${place.area || ''} ${place.categoryName || ''} ${place.customCategory || ''} ${place.categoryId || ''} ${place.description || ''}`
      );

      queryIntents.forEach(intent => {
        if (intent && intent.length >= 2 && fullPlaceIndex.includes(intent)) {
          semanticScore = Math.max(semanticScore, 70);
        }
      });

      const total = Math.max(
        nameScore, 
        nameEnScore, 
        categorySynonymScore,
        specialtyScore, 
        serviceScore, 
        productScore,
        offerScore,
        addressScore, 
        areaScore, 
        catScore, 
        descScore, 
        semanticScore
      );

      return { place, total };
    })
    .filter(item => item.total > 0 && (!isAtmPlace(item.place) || isAtmReadyAndOperational(item.place, 15)))
    .sort((a, b) => b.total - a.total)
    .map(item => item.place);

    const finalResults = sortSearchPlaces(scored, currentUser?.uid);
    await renderResults(finalResults, `تم العثور على <strong>${finalResults.length}</strong> مكان لـ "<strong>${escHtml(query)}</strong>"`);
  }

  let currentResults = [];
  let currentMeta = '';

  async function renderResults(places, metaText) {
    currentResults = places;
    if (metaText) currentMeta = metaText;
    if (metaEl) metaEl.innerHTML = currentMeta;

    const sortBy = searchSort?.value || 'relevance';
    let sorted = [...places];

    if (sortBy === 'nearest') {
      if (!_searchUserLocation) {
        toast.info('جاري تحديد موقعك الجغرافي لترتيب النتائج بالأقرب إليك... 📍');
        try {
          _searchUserLocation = await getUserLocation();
          toast.success('تم تحديد موقعك! تم ترتيب الأماكن حسب الأقرب لموقعك 📍');
        } catch (err) {
          if (err.code === 1) {
            toast.warning('يرجى السماح للمتصفح بالوصول للموقع (Allow Location) في شريط العنوان 📍');
          } else {
            toast.info('تم الترتيب حسب المسافة من مركز المنزلة 📍');
          }
          _searchUserLocation = MANZALA_CENTER;
        }
      }
      sorted = sortPlacesByDistance(sorted, _searchUserLocation);
    } else if (sortBy === 'highest-rating') {
      sorted.sort((a, b) => (Number(b.rating) || 5.0) - (Number(a.rating) || 5.0));
    } else if (sortBy === 'most-reviews') {
      sorted.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
    } else if (sortBy === 'negative') {
      sorted.sort((a, b) => (Number(a.rating) || 5.0) - (Number(b.rating) || 5.0));
    }

    if (!gridEl) return;

    if (sorted.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">لم نعثر على نتائج</h3>
          <p class="empty-state__text">تأكد من كتابة الكلمات بشكل صحيح أو جرب كلمات أخرى</p>
        </div>
      `;
    } else {
      gridEl.innerHTML = sorted.map(p => renderPlaceCard(p)).join('');
    }
  }

  searchSort?.addEventListener('change', async () => {
    if (currentResults.length > 0) {
      await renderResults(currentResults);
    }
  });

  window.searchFor = (keyword) => {
    if (searchInput) searchInput.value = keyword;
    performSearch(keyword, false);
  };

  searchBtn?.addEventListener('click', () => performSearch(searchInput?.value || '', false));
  
  // Instant Live Search as you type
  let _searchDebounce = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(_searchDebounce);
    const val = e.target.value;
    if (!val.trim()) {
      if (gridEl) gridEl.innerHTML = '';
      if (metaEl) metaEl.innerHTML = 'أدخل كلمة البحث للبدء';
      return;
    }
    _searchDebounce = setTimeout(() => {
      performSearch(val, false);
    }, 60);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(_searchDebounce);
      performSearch(searchInput?.value || '', false);
    }
  });

  aiSearchBtn?.addEventListener('click', () => performSearch(searchInput?.value || 'أفضل الأماكن', true));

  // Initialize Voice Search
  mountVoiceSearchButton({
    inputEl: searchInput,
    onSearch: (spokenText) => {
      performSearch(spokenText, false);
    }
  });

  // Initial trigger if q is present
  if (q) {
    performSearch(q, false);
  }
}

function sortSearchPlaces(places, currentUid = null) {
  const seen = new Set();
  const sponsored = [];
  const verified = [];
  const userOwned = [];
  const others = [];

  places.forEach(place => {
    const key = place.id || place._key || place.slug;
    if (!key || seen.has(key)) return;
    seen.add(key);

    const isSpons = Boolean((place.isSponsored || place.isFeatured || place.isPromoted) && (!place.sponsoredUntil || place.sponsoredUntil > Date.now()));
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

function saveSearchHistory(q) {
  try {
    const list = JSON.parse(localStorage.getItem('recent-searches') || '[]');
    const updated = [q, ...list.filter(item => item !== q)].slice(0, 8);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  } catch {}
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
