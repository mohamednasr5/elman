/**
 * المنزلة وناسها — Search Page
 * Smart Arabic text search with normalization, suggestions, recent searches,
 * and AI Semantic Search integration.
 */

import { getPublishedPlaces, getCategories } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { normalizeArabic, arabicScore } from '../../utils/arabic.js';
import { aiSmartSearch } from '../../services/ai.service.js';

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
            <span style="color:rgba(255,255,255,0.8);font-size:var(--font-size-xs)">كلمات شائعة:</span>
            <button class="chip" onclick="searchFor('صيدلية')" style="cursor:pointer">💊 صيدلية</button>
            <button class="chip" onclick="searchFor('دكتور')" style="cursor:pointer">👨‍⚕️ دكتور</button>
            <button class="chip" onclick="searchFor('سوبر ماركت')" style="cursor:pointer">🛒 سوبر ماركت</button>
            <button class="chip" onclick="searchFor('مخبز')" style="cursor:pointer">🍞 مخبز</button>
            <button class="chip" onclick="searchFor('سباكة')" style="cursor:pointer">🔧 سباكة</button>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <div class="search-results-meta" id="search-meta">
        ${q ? `نتائج البحث عن: "<strong>${escHtml(q)}</strong>"` : 'أدخل كلمة البحث للبدء'}
      </div>

      <div class="places-grid" id="search-results-grid">
        ${q ? Array(4).fill(renderPlaceCardSkeleton()).join('') : ''}
      </div>
    </div>
  `;

  const searchInput = document.getElementById('search-page-input');
  const searchBtn = document.getElementById('search-page-btn');
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
    const normalQ = normalizeArabic(query);

    const scored = allPlaces.map(place => {
      const nameScore = arabicScore(place.name, query);
      const descScore = arabicScore(place.description, query) * 0.6;
      const areaScore = arabicScore(place.area, query) * 0.8;
      const serviceScore = place.services?.some(s => normalizeArabic(s).includes(normalQ)) ? 70 : 0;
      const catScore = arabicScore(place.categoryId, query) * 0.5;

      const total = Math.max(nameScore, descScore, areaScore, serviceScore, catScore);
      return { place, total };
    })
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .map(item => item.place);

    // Sorting rule: Verified first -> User owned -> Others
    const finalResults = sortSearchPlaces(scored, currentUser?.uid);
    renderResults(finalResults, `تم العثور على <strong>${finalResults.length}</strong> مكان لـ "<strong>${escHtml(query)}</strong>"`);
  }

  function renderResults(places, metaText) {
    metaEl.innerHTML = metaText;

    if (places.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">لم نعثر على نتائج</h3>
          <p class="empty-state__text">تأكد من كتابة الكلمات بشكل صحيح أو جرب كلمات أخرى</p>
        </div>
      `;
    } else {
      gridEl.innerHTML = places.map(p => renderPlaceCard(p)).join('');
    }
  }

  window.searchFor = (keyword) => {
    if (searchInput) searchInput.value = keyword;
    performSearch(keyword, false);
  };

  searchBtn?.addEventListener('click', () => performSearch(searchInput.value, false));
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch(searchInput.value, false);
  });

  aiSearchBtn?.addEventListener('click', () => performSearch(searchInput.value || 'أفضل الأماكن', true));

  // Initial trigger if q is present
  if (q) {
    performSearch(q, false);
  }
}

function sortSearchPlaces(places, currentUid = null) {
  const seen = new Set();
  const verified = [];
  const userOwned = [];
  const others = [];

  places.forEach(place => {
    const key = place.id || place._key;
    if (seen.has(key)) return;
    seen.add(key);

    if (place.isVerified) {
      verified.push(place);
    } else if (currentUid && place.ownerId === currentUid) {
      userOwned.push(place);
    } else {
      others.push(place);
    }
  });

  return [...verified, ...userOwned, ...others];
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
