/**
 * المنزلة وناسها — Search Page
 * Smart Arabic text search with normalization, suggestions, recent searches,
 * and AI Semantic Search integration.
 */

import { getPublishedPlaces, getCategories } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { normalizeArabic, arabicScore, extractSearchKeywords, expandArabicSearchIntent } from '../../utils/arabic.js';
import { aiSearch, aiSmartSearch } from '../../services/ai.service.js';

export async function renderSearchPage($container, { q = '', user }) {
  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="font-size:var(--font-size-3xl);font-weight:800;color:#fff;margin-bottom:var(--space-4)">
          البحث في المنزلة
        </h1>
        
        <!-- Search Form -->
        <div style="max-width:680px;margin:0 auto">
          <div class="hero-search" style="box-shadow:var(--shadow-xl)">
            <input
              type="search"
              id="search-page-input"
              class="hero-search__input"
              placeholder="ابحث عن محل، دكتور، صيدلية، سباك، معرض..."
              value="${escAttr(q)}"
              autocomplete="off"
            />
            <button class="hero-search__btn" id="search-page-btn">
              <span>🔍</span> بحث
            </button>
          </div>

          <!-- Smart AI Button -->
          <div style="margin-top:var(--space-3);display:flex;align-items:center;justify-content:center;gap:var(--space-2);flex-wrap:wrap">
            <button class="btn btn-sm btn-outline" id="btn-ai-search" style="border-color:rgba(255,255,255,0.4);color:#fff">
              ✨ بحث ذكي بالذكاء الاصطناعي
            </button>
            <span style="color:rgba(255,255,255,0.7);font-size:var(--font-size-xs)">|</span>
            <span style="color:rgba(255,255,255,0.8);font-size:var(--font-size-xs)">كلمات ومهن شائعة:</span>
            <button class="chip" onclick="searchFor('سباك')" style="cursor:pointer">🪠 سباك</button>
            <button class="chip" onclick="searchFor('نجار')" style="cursor:pointer">🪚 نجار</button>
            <button class="chip" onclick="searchFor('مبلط')" style="cursor:pointer">🧱 مبلط</button>
            <button class="chip" onclick="searchFor('كهربائي')" style="cursor:pointer">⚡ كهربائي</button>
            <button class="chip" onclick="searchFor('نقاش')" style="cursor:pointer">🖌️ نقاش</button>
            <button class="chip" onclick="searchFor('دكتور')" style="cursor:pointer">👨‍⚕️ دكتور</button>
            <button class="chip" onclick="searchFor('صيدلية')" style="cursor:pointer">💊 صيدلية</button>
            <button class="chip" onclick="searchFor('سوبر ماركت')" style="cursor:pointer">🛒 سوبر ماركت</button>
            <button class="chip" onclick="searchFor('مخبز')" style="cursor:pointer">🍞 مخبز</button>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-4)">
        <div class="search-results-meta" id="search-meta" style="margin:0">
          ${q ? `نتائج البحث عن: "<strong>${escHtml(q)}</strong>"` : 'أدخل كلمة البحث للبدء'}
        </div>
        <select id="search-sort-filter" class="form-select" style="max-width:200px;margin:0">
          <option value="relevance">🎯 الأكثر مطابقة</option>
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

  try {
    allPlaces = await getPublishedPlaces({ limit: 150 });
  } catch (err) {
    console.warn('Failed to pre-fetch places for search:', err);
  }

  const currentUser = getCurrentUser() || user;

  function performSearch(queryText, isAi = false) {
    const query = queryText.trim();
    if (!query) {
      metaEl.innerHTML = 'يرجى إدخال كلمة للبحث';
      gridEl.innerHTML = '';
      return;
    }

    saveSearchHistory(query);

    if (isAi) {
      metaEl.innerHTML = `✨ جاري التحليل الذكي للبحث عن "<strong>${escHtml(query)}</strong>"...`;
      aiSmartSearch(query, allPlaces).then(aiRes => {
        if (aiRes && aiRes.results && aiRes.results.length > 0) {
          const matchedIds = new Set(aiRes.results.map(r => r.id));
          const results = allPlaces.filter(p => matchedIds.has(p._key || p.id));
          renderResults(results, `✨ نتائج ذكية مقترحة لـ "<strong>${escHtml(query)}</strong>" (${results.length})`);
        } else {
          // Fallback to local
          localSearch(query);
        }
      }).catch(() => localSearch(query));
    } else {
      localSearch(query);
    }
  }

  function localSearch(query) {
    const rawClean = extractSearchKeywords(query);
    const normalQ = normalizeArabic(rawClean);
    const queryIntents = expandArabicSearchIntent(query);

    const scored = allPlaces.map(place => {
      // 1. Direct Name, Description & Area Match
      const nameScore = Math.max(arabicScore(place.name, query), arabicScore(place.name, rawClean));
      const descScore = Math.max(arabicScore(place.description, query), arabicScore(place.description, rawClean)) * 0.7;
      const areaScore = arabicScore(place.area, query) * 0.8;

      // 2. Services Matching (Direct + Semantic Intent)
      let serviceScore = 0;
      if (place.services && Array.isArray(place.services)) {
        place.services.forEach(s => {
          const ns = normalizeArabic(s);
          if (ns.includes(normalQ) || normalQ.includes(ns)) serviceScore = Math.max(serviceScore, 85);
          if (queryIntents.some(intent => ns.includes(intent) || intent.includes(ns))) {
            serviceScore = Math.max(serviceScore, 75);
          }
        });
      }

      // 3. Category & Custom Category Matching
      let catScore = 0;
      const catVal = normalizeArabic(`${place.customCategory || ''} ${place.categoryName || ''} ${place.categoryId || ''}`);
      if (catVal.includes(normalQ) || normalQ.includes(catVal)) {
        catScore = 90;
      } else if (queryIntents.some(intent => catVal.includes(intent) || intent.includes(catVal))) {
        catScore = 80;
      }

      // 4. Delivery Vehicle Type Matching (car -> سيارة/عربية, tuktuk -> توكتوك, motorcycle -> موتوسيكل)
      let deliveryScore = 0;
      if (place.deliveryType) {
        const dt = normalizeArabic(place.deliveryType);
        const dtMap = {
          'car': ['سيارة', 'عربية', 'عربيات', 'مشوار', 'مشاوير', 'تاكسي', 'رحلات', 'توصيل', 'شاحنة'],
          'tuktuk': ['توكتوك', 'توك توك', 'تكاتك', 'مشاوير', 'توصيل'],
          'motorcycle': ['موتوسيكل', 'موتسيكل', 'موتوسيكلات', 'دليفري', 'توصيل']
        };
        const dtSynonyms = (dtMap[place.deliveryType] || []).map(normalizeArabic);
        if (queryIntents.some(intent => dtSynonyms.includes(intent) || dt.includes(intent) || intent.includes(dt))) {
          deliveryScore = 85;
        }
      }

      // 5. Semantic Intent Cross-Field Match
      let semanticScore = 0;
      const fullPlaceText = normalizeArabic(
        `${place.name || ''} ${place.description || ''} ${place.area || ''} ${place.categoryName || ''} ${place.customCategory || ''} ${place.categoryId || ''} ${(place.services || []).join(' ')}`
      );

      queryIntents.forEach(intent => {
        if (intent && intent.length >= 2 && fullPlaceText.includes(intent)) {
          semanticScore = Math.max(semanticScore, 70);
        }
      });

      const total = Math.max(nameScore, descScore, areaScore, serviceScore, catScore, deliveryScore, semanticScore);
      return { place, total };
    })
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .map(item => item.place);

    // Sorting rule: Verified first -> User owned -> Others
    const finalResults = sortSearchPlaces(scored, currentUser?.uid);
    renderResults(finalResults, `تم العثور على <strong>${finalResults.length}</strong> مكان لـ "<strong>${escHtml(query)}</strong>"`);
  }

  let currentResults = [];
  let currentMeta = '';

  function renderResults(places, metaText) {
    currentResults = places;
    if (metaText) currentMeta = metaText;
    metaEl.innerHTML = currentMeta;

    const sortBy = searchSort?.value || 'relevance';
    let sorted = [...places];

    if (sortBy === 'highest-rating') {
      sorted.sort((a, b) => (Number(b.rating) || 5.0) - (Number(a.rating) || 5.0));
    } else if (sortBy === 'most-reviews') {
      sorted.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
    } else if (sortBy === 'negative') {
      sorted.sort((a, b) => (Number(a.rating) || 5.0) - (Number(b.rating) || 5.0));
    }

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

  searchSort?.addEventListener('change', () => {
    if (currentResults.length > 0) {
      renderResults(currentResults);
    }
  });

  window.searchFor = (keyword) => {
    if (searchInput) searchInput.value = keyword;
    performSearch(keyword, false);
  };

  searchBtn?.addEventListener('click', () => performSearch(searchInput.value, false));
  
  // Instant Live Search as you type (0ms latency)
  let _searchDebounce = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(_searchDebounce);
    const val = e.target.value;
    if (!val.trim()) {
      gridEl.innerHTML = '';
      metaEl.innerHTML = 'أدخل كلمة البحث للبدء';
      return;
    }
    _searchDebounce = setTimeout(() => {
      performSearch(val, false);
    }, 60);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(_searchDebounce);
      performSearch(searchInput.value, false);
    }
  });

  aiSearchBtn?.addEventListener('click', () => performSearch(searchInput.value || 'أفضل الأماكن', true));

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
    const key = place.id || place._key;
    if (seen.has(key)) return;
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
