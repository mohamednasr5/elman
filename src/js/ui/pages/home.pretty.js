/**
 * المنزلة وناسها — Home Page
 * Full homepage with hero, search, categories, places, offers, delivery
 */

import { getCategories, getPublishedPlaces, getActiveOffers, getAds, getSettings, getCached, FALLBACK_CATEGORIES } from '../../core/db.js';
import { WORKER_URL } from '../../core/firebase.js';
import { appState } from '../../core/state.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { isAtmPlace } from '../../utils/atm.js';
import { mountSponsoredShowcase, isPlaceSponsored } from '../components/SponsoredShowcase.js';
import { formatPrice, calcDiscount, normalizeArabic, arabicScore, arabicMatch } from '../../utils/arabic.js';
import { daysUntil } from '../../utils/date.js';
import { getCurrentUser } from '../../core/auth.js';
import { openManzalaVoiceAssistantModal } from '../../services/voice.service.js';
import { executeFastSearch, warmupSearchEngine } from '../../services/search-engine.service.js';
import { getCategorySvg } from '../../utils/professions-data.js';
import { getCategoryVisualMeta, renderCategoryCardIcon } from '../../utils/category-visual.js';
import { resolveDeliveryVehicle } from '../../utils/delivery-vehicle.js';
// NOTE: mountLivePulseSection, mountAroundMeRadar, renderWhoIsAvailableNow are
// loaded lazily (dynamic import) because they render below-the-fold content.

const CATEGORY_EMOJIS = {
  'pharmacy':      { emoji: '💊', color: 'rgba(231,76,60,0.1)',    border: '#E74C3C' },
  'supermarket':   { emoji: '🛒', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'paint':         { emoji: '🎨', color: 'rgba(155,89,182,0.1)',   border: '#9B59B6' },
  'herbs':         { emoji: '🌿', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'doctor':        { emoji: '👨‍⚕️', color: 'rgba(41,128,185,0.1)',  border: '#2980B9' },
  'plumbing':      { emoji: '🔧', color: 'rgba(52,73,94,0.1)',     border: '#52596E' },
  'plumber':       { emoji: '🪠', color: 'rgba(41,128,185,0.1)',  border: '#2980B9' },
  'carpenter':     { emoji: '🪚', color: 'rgba(230,126,34,0.1)',   border: '#E67E22' },
  'tiler':         { emoji: '🧱', color: 'rgba(155,89,182,0.1)',   border: '#9B59B6' },
  'painter':       { emoji: '🖌️', color: 'rgba(241,196,15,0.1)',   border: '#F1C40F' },
  'electrician':   { emoji: '⚡', color: 'rgba(243,156,18,0.1)',   border: '#F39C12' },
  'ac-technician': { emoji: '❄️', color: 'rgba(52,152,219,0.1)',   border: '#3498DB' },
  'blacksmith':    { emoji: '🛠️', color: 'rgba(52,73,94,0.1)',     border: '#52596E' },
  'alumital':      { emoji: '🪟', color: 'rgba(149,165,166,0.1)',  border: '#95A5A6' },
  'mechanic':      { emoji: '🔩', color: 'rgba(231,76,60,0.1)',    border: '#E74C3C' },
  'upholsterer':   { emoji: '🛋️', color: 'rgba(155,89,182,0.1)',   border: '#9B59B6' },
  'feed':          { emoji: '🌾', color: 'rgba(243,156,18,0.1)',   border: '#F39C12' },
  'poultry':       { emoji: '🍗', color: 'rgba(243,156,18,0.1)',   border: '#F39C12' },
  'bakery':        { emoji: '🍞', color: 'rgba(230,126,34,0.1)',   border: '#E67E22' },
  'vegetables':    { emoji: '🥬', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'antiques':      { emoji: '🏺', color: 'rgba(149,165,166,0.1)',  border: '#95A5A6' },
  'electronics':   { emoji: '📺', color: 'rgba(41,128,185,0.1)',   border: '#2980B9' },
  'carpet':        { emoji: '🧶', color: 'rgba(155,89,182,0.1)',   border: '#9B59B6' },
  'mattress':      { emoji: '🛏️', color: 'rgba(52,152,219,0.1)',   border: '#3498DB' },
  'china':         { emoji: '🍽️', color: 'rgba(231,76,60,0.1)',    border: '#E74C3C' },
  'electrical':    { emoji: '💡', color: 'rgba(241,196,15,0.1)',   border: '#F1C40F' },
  'roastery':      { emoji: '🥜', color: 'rgba(101,67,33,0.1)',    border: '#654321' },
  'phones':        { emoji: '📱', color: 'rgba(41,128,185,0.1)',   border: '#2980B9' },
  'grocery':       { emoji: '🏪', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'hypermarket':   { emoji: '🏬', color: 'rgba(27,79,114,0.1)',    border: '#1B4F72' },
  'delivery':      { emoji: '🚀', color: 'rgba(231,76,60,0.1)',    border: '#E74C3C' },
};

const DEFAULT_CAT = { emoji: '🏪', color: 'rgba(27,79,114,0.1)', border: '#1B4F72' };

export async function renderHomePage($main, { user } = {}) {
  // ── Check if real Hero HTML already exists in the DOM (injected by index.html for LCP) ──
  const staticHero = document.getElementById('hero-section-static');
  const hasStaticHero = Boolean(staticHero);

  if (!hasStaticHero) {
    // Cold render (no static HTML) — inject full page structure
    $main.innerHTML = getHomeHTML();
    // Start typewriter IMMEDIATELY — hero elements are now in DOM
    initHeroTypewriterAnimation();
  } else {
    // ── Adopt the static hero from index.html (LCP already rendered) ──
    // Remove skeleton elements that home.js will replace with real content
    // (static stats-bar placeholder, categories skeleton, hero-section-static id)
    staticHero.removeAttribute('id'); // disown so getHomeHTML's hero won't conflict

    // Remove the static skeleton siblings (stats-bar placeholder, categories skeleton)
    const childrenToRemove = [];
    let node = staticHero.nextSibling;
    while (node) {
      childrenToRemove.push(node);
      node = node.nextSibling;
    }
    childrenToRemove.forEach(n => n.parentNode && n.parentNode.removeChild(n));

    // Inject full home structure — it will append after the adopted hero
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = getHomeHTML();
    // Remove the duplicate hero from the generated HTML (hero is already in DOM)
    const dynHero = tempDiv.querySelector('.hero');
    if (dynHero) {
      if (!staticHero.querySelector('.hero-heritage-decor')) {
        const decor = dynHero.querySelector('.hero-heritage-decor');
        if (decor) {
          staticHero.insertAdjacentElement('afterbegin', decor);
        }
      }
      dynHero.remove();
    }
    // Append remaining sections to $main
    while (tempDiv.firstChild) {
      $main.appendChild(tempDiv.firstChild);
    }

    // Start typewriter IMMEDIATELY — hero elements already in DOM from index.html
    initHeroTypewriterAnimation();
  }


  initHomeVerifiedShowcase();

  // ── ⚡ 0ms Sub-Second Instant Cache Hydration (Zero Skeleton Lag on Mobile PWA) ──
  try {
    const cachedCats = getCached('categories_all');
    const cachedPlaces = getCached('published_100_');
    if (Array.isArray(cachedCats) && cachedCats.length > 0) {
      renderCategories(cachedCats);
      setupHeroSearch(cachedCats);
    }
    if (Array.isArray(cachedPlaces) && cachedPlaces.length > 0) {
      const cu = getCurrentUser() || user;
      initHomeVerifiedShowcase(cachedPlaces);
      const sorted = sortLatestPlaces(cachedPlaces, cu?.uid);
      renderLatestPlaces(sorted.slice(0, 8));
      renderStatsBar(cachedPlaces.length, cachedCats?.length || 31);
      warmupSearchEngine(cachedPlaces, cachedCats || []);
    }
  } catch (_) {}

  let categories = [];
  let allPlaces = [];
  let offers = [];
  let ads = [];

  try {
    const [categoriesRes, placesRes, offersRes, adsRes] = await Promise.allSettled([
      getCategories(),
      getPublishedPlaces({ limit: 100 }),
      getActiveOffers(8),
      getAds('homepage')
    ]);

    categories = (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value) && categoriesRes.value.length)
      ? categoriesRes.value
      : (getCached('categories_all') || FALLBACK_CATEGORIES || []);

    allPlaces = (placesRes.status === 'fulfilled' && Array.isArray(placesRes.value) && placesRes.value.length)
      ? placesRes.value
      : (getCached('published_100_') || []);

    offers = (offersRes.status === 'fulfilled' && Array.isArray(offersRes.value))
      ? offersRes.value
      : (getCached('offers_active_8') || []);

    ads = (adsRes.status === 'fulfilled' && Array.isArray(adsRes.value))
      ? adsRes.value
      : (getCached('ads_homepage') || []);
  } catch (err) {
    console.warn('[Home] Data load non-fatal warning:', err);
    categories = getCached('categories_all') || FALLBACK_CATEGORIES || [];
    allPlaces = getCached('published_100_') || [];
    offers = getCached('offers_active_8') || [];
    ads = getCached('ads_homepage') || [];
  }

  const currentUser = getCurrentUser() || user;

  // Register all places in instant memory cache for 0ms transitions
  if (typeof window !== 'undefined' && Array.isArray(allPlaces) && allPlaces.length > 0) {
    window._placesRegistry = window._placesRegistry || new Map();
    for (const p of allPlaces) {
      if (!p) continue;
      const s = String(p.slug || p.id || p._key || '').toLowerCase().trim();
      if (s) {
        window._placesRegistry.set(s, p);
        if (p.id) window._placesRegistry.set(String(p.id).toLowerCase().trim(), p);
        if (p.slug) window._placesRegistry.set(String(p.slug).toLowerCase().trim(), p);
      }
    }
  }

  // ── Render above-fold sections (Synchronous & resilient) ──
  try {
    if (categories && categories.length) renderCategories(categories);
  } catch (e) { console.warn('[Home] renderCategories err:', e); }

  // Verified Places: 4-Card Horizontal Rotating Showcase with SWR Caching
  try {
    initHomeVerifiedShowcase(allPlaces);
  } catch (e) { console.warn('[Home] initHomeVerifiedShowcase err:', e); }

  // Latest Places: Sponsored first ALWAYS, then newest added places
  try {
    const latestPlaces = sortLatestPlaces(allPlaces, currentUser?.uid);
    renderLatestPlaces(latestPlaces.slice(0, 8));
  } catch (e) { console.warn('[Home] renderLatestPlaces err:', e); }

  try {
    if (offers && offers.length) renderOffers(offers);
  } catch (e) { console.warn('[Home] renderOffers err:', e); }

  try {
    const deliveryPlaces = (allPlaces || []).filter(p => {
      if (!p) return false;
      if (p.deliveryType) return true;
      if (p.categoryId?.includes('delivery')) return true;
      const name = String(p.name || '').toLowerCase();
      if (/توكتوك|تاكسي|شانجي|اتوبيس|توصيل|دليفري|وصلي/i.test(name)) {
        if (/صيدلية|مطعم|كشري|حلواني|سوبر\s*ماركت|هايبر/i.test(name)) return false;
        return true;
      }
      return false;
    });
    if (deliveryPlaces.length) renderDeliveryServices(deliveryPlaces);
  } catch (e) { console.warn('[Home] renderDeliveryServices err:', e); }

  try {
    if (ads && ads.length) renderAds(ads);
  } catch (e) { console.warn('[Home] renderAds err:', e); }

  // Stats bar
  try {
    renderStatsBar((allPlaces.length || 0), (categories?.length || 31));
  } catch (_) {}

  // Warm up search engine with fresh places & categories
  try {
    warmupSearchEngine(allPlaces, categories || []);
  } catch (_) {}

  // Setup hero search
  try {
    setupHeroSearch(categories || []);
  } catch (_) {}

  // Setup villages and towns quick search filter
  try {
    setupVillagesSearch();
  } catch (_) {}

  // ── Lazy-load below-fold sections (dynamic imports) ──
  // These are not visible on first screen — load after critical content
  Promise.resolve().then(() => {
    // WhoIsAvailable (craftsmen on-call) — first below-fold section
    try {
      import('../components/WhoIsAvailableNow.js').then(({ renderWhoIsAvailableNow }) => {
        const craftsmenBox = document.getElementById('home-oncall-craftsmen-container');
        if (craftsmenBox) renderWhoIsAvailableNow(craftsmenBox);
      }).catch(e => console.warn('[Home] WhoIsAvailableNow load err:', e));
    } catch (_) {}

    // Service Requests — قسم طلبات الخدمات الجارية
    try {
      import('../components/ServiceRequestsSection.js').then(({ renderServiceRequestsSection }) => {
        const reqBox = document.getElementById('home-service-requests-container');
        if (reqBox) renderServiceRequestsSection(reqBox, { limit: 4, showHero: false, isCompact: true });
      }).catch(e => console.warn('[Home] ServiceRequestsSection load err:', e));
    } catch (_) {}

    // AroundMeRadar — GPS nearby section
    try {
      import('../components/AroundMeRadar.js').then(({ mountAroundMeRadar }) => {
        mountAroundMeRadar('home-around-me-container');
      }).catch(e => console.warn('[Home] AroundMeRadar load err:', e));
    } catch (_) {}

    // SponsoredShowcase
    try {
      mountSponsoredShowcase('home-sponsored-container', allPlaces, {
        title: 'أماكن وإعلانات مميزة في المنزلة والمطرية',
        subtitle: 'أنشطة تجارية وخدمات موصى بها ومعتمدة في المدينة',
        maxVisible: 4
      });
    } catch (e) { console.warn('[Home] SponsoredShowcase mount err:', e); }

    // Wide ads banner
    try {
      import('../components/WideAdsBanner.js')
        .then(({ mountWideAdsBanner }) => mountWideAdsBanner('wide-ads-banner'))
        .catch(e => console.warn('[Home] WideAdsBanner load err:', e));
    } catch (_) {}

    // First visit welcome video popup (1.mp4)
    try {
      checkAndShowFirstVisitVideo();
    } catch (_) {}
  });
}

function sortLatestPlaces(places, currentUid = null, shuffleSponsored = false) {
  const seen = new Set();
  const sponsored = [];
  const regular = [];

  // Sort raw places by newest creation time first
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

  // Fair rotation: Randomly shuffle sponsored places order so every sponsor gets equal top visibility
  const finalSponsored = shuffleSponsored ? shuffleArray(sponsored) : sponsored;

  // Sponsored first, followed directly by the newest added places
  return [...finalSponsored, ...regular];
}

function renderCategories(categories) {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  const list = (Array.isArray(categories) && categories.length > 0)
    ? categories
    : (getCached('categories_all') || FALLBACK_CATEGORIES || []);

  if (!list || !list.length) {
    if (grid.querySelector('.category-card')) return;
    return;
  }

  grid.innerHTML = list.map(cat => {
    const slug = cat.slug || cat._key || cat.id || '';
    const visual = getCategoryVisualMeta(cat);
    const iconHtml = renderCategoryCardIcon(cat, { size: 40 });
    return `
      <a href="category.html?slug=${encodeURIComponent(slug)}"
         class="category-card animate-fade-in"
         style="--cat-color:${visual.color};--cat-bg:${visual.bgColor};--cat-border:${visual.borderColor}"
         aria-label="${cat.name}">
        <div class="category-card__icon" style="background:${visual.bgColor};border-color:${visual.borderColor};--cat-color:${visual.color};">
          ${iconHtml}
        </div>
        <div class="category-card__name">${escHtml(cat.name)}</div>
      </a>
    `;
  }).join('');
}

const VERIFIED_STORAGE_KEY = 'manzala_verified_showcase_v1';
let _homeVerifiedInterval = null;
let _homeVerifiedPool = [];
let _homeVerifiedRotationIndex = 0;

const FALLBACK_VERIFIED_PLACES = [
  {
    id: 'p_1788703900620_oae8ka',
    slug: 'mtam-basl-wbaha-llmakwlat-albhrya',
    name: 'مطعم باسل وباهى للمأكولات البحرية',
    area: 'المطرية دقهلية',
    address: 'المطرية - ش الثورة',
    phone: '01062944644',
    whatsapp: '01062944644',
    category: 'مطاعم وأسماك',
    cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&h=180&q=75',
    coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&h=180&q=75',
    isSponsored: true
  },
  {
    id: '-P03LX9MledW_z7QfyHO',
    slug: '-P03LX9MledW_z7QfyHO',
    name: 'الحسن لصيانة الهواتف المحمولة',
    area: 'المنزلة - شارع البحر',
    address: 'المنزلة - شارع البحر أمام البنك',
    phone: '01026046049',
    whatsapp: '01026046049',
    category: 'صيانة وموبايل',
    cover: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&h=180&q=75',
    coverImageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&h=180&q=75',
    isSponsored: true
  },
  {
    id: 'p_1788801925745_vuxmjs',
    slug: 'mtbkh-eyma-llaakl-albyty',
    name: 'مطبخ إيمى للأكل البيتي',
    area: 'المنزلة - طريق المنصورة',
    address: 'المنزلة - طريق المنصورة الرئيسي',
    phone: '01090123456',
    whatsapp: '01090123456',
    category: 'أكل بيتي وحلويات',
    cover: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&h=180&q=75',
    coverImageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&h=180&q=75',
    isSponsored: false
  },
  {
    id: '-P0hEa0K6ZfAM65O27G9',
    slug: 'kwafyr-mnh-asad',
    name: 'كوافير منه أسعد',
    area: 'المنزلة - حي السلام',
    address: 'المنزلة - حي السلام',
    phone: '01099887766',
    whatsapp: '01099887766',
    category: 'بيوتي وكوافير',
    cover: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=180&q=75',
    coverImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=180&q=75',
    isSponsored: false
  }
];

function initHomeVerifiedShowcase(allPlaces = null) {
  const grid = document.getElementById('home-verified-cards-grid');
  const statusText = document.getElementById('home-verified-status-text');
  if (!grid) return;

  // 1. Instant 0ms Load from Local Storage Cache
  let cachedPlaces = null;
  try {
    const raw = localStorage.getItem(VERIFIED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedPlaces = parsed;
      }
    }
  } catch (_) {}

  // 2. If places provided from DB / Worker, process and update cache with COMPLETE fields
  if (Array.isArray(allPlaces) && allPlaces.length > 0) {
    const extracted = allPlaces
      .filter(p => p && p.isVerified && !isAtmPlace(p))
      .map(p => ({
        ...p,
        id: p.id || p._key,
        slug: p.slug || p.id,
        name: p.name,
        area: p.area || 'المنزلة والمطرية',
        address: p.address || '',
        phone: p.phone || '',
        whatsapp: p.whatsapp || '',
        logoUrl: p.logoUrl || '',
        coverImageUrl: p.coverImageUrl || (p.gallery && p.gallery[0]) || '',
        category: p.categoryName || p.customCategory || p.categoryId || 'نشاط تجاري',
        cover: p.coverImageUrl || p.logoUrl || (p.gallery && p.gallery[0]) || '/assets/images/og-whatsapp.jpg',
        isSponsored: Boolean(p.isSponsored && (!p.sponsoredUntil || p.sponsoredUntil > Date.now()))
      }));

    if (extracted.length > 0) {
      _homeVerifiedPool = extracted;
      try {
        localStorage.setItem(VERIFIED_STORAGE_KEY, JSON.stringify(extracted));
      } catch (_) {}
    }
  } else if (!_homeVerifiedPool.length) {
    if (cachedPlaces && cachedPlaces.length > 0) {
      _homeVerifiedPool = cachedPlaces;
    } else {
      _homeVerifiedPool = [...FALLBACK_VERIFIED_PLACES];
    }
  }

  // Synchronously seed places registry for 0ms transitions
  if (typeof window !== 'undefined' && Array.isArray(_homeVerifiedPool)) {
    window._placesRegistry = window._placesRegistry || new Map();
    for (const p of _homeVerifiedPool) {
      if (!p) continue;
      const s = String(p.slug || p.id || '').toLowerCase().trim();
      if (s) {
        window._placesRegistry.set(s, p);
        if (p.slug) window._placesRegistry.set(String(p.slug).toLowerCase().trim(), p);
        if (p.id) window._placesRegistry.set(String(p.id).toLowerCase().trim(), p);
      }
    }
  }

  const rankLabels = [
    '🥇 الصدارة #1',
    '🥈 الصدارة #2',
    '🥉 الصدارة #3',
    '🎖️ الصدارة #4'
  ];

  function renderCards(slice) {
    grid.innerHTML = slice.map((p, index) => {
      const targetSlug = p.slug || p.id || '';
      return `
      <article class="fair-place-card" data-card-index="${index}"
               data-place-id="${escAttr(p.id || '')}"
               data-place-slug="${escAttr(targetSlug)}"
               data-name="${escAttr(p.name || '')}"
               data-phone="${escAttr(p.phone || '')}"
               data-whatsapp="${escAttr(p.whatsapp || '')}"
               data-area="${escAttr(p.area || '')}"
               data-address="${escAttr(p.address || '')}"
               data-cover="${escAttr(p.coverImageUrl || p.cover || '')}"
               data-logo="${escAttr(p.logoUrl || p.logo || '')}"
               data-category="${escAttr(p.category || '')}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(targetSlug)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(targetSlug)}')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}', this)"
               style="cursor:pointer">
        <span class="fair-place-card__rank">${rankLabels[index] || `🎖️ الصدارة #${index + 1}`}</span>
        <div class="fair-place-card__cover">
          <img src="${escAttr(p.coverImageUrl || p.cover)}" alt="${escAttr(p.name)}" loading="lazy" onerror="this.src='/assets/images/og-whatsapp.jpg'">
          <div class="fair-place-card__badges">
            ${p.isSponsored ? '<span class="fair-badge-sponsored">⭐ إعلان مميز</span>' : ''}
            <span class="fair-badge-verified">✓ موثق رسمياً</span>
          </div>
        </div>
        <div class="fair-place-card__body">
          <h3 class="fair-place-card__title" title="${escAttr(p.name)}">${escHtml(p.name)}</h3>
          <div class="fair-place-card__meta">
            <span>📍 ${escHtml(p.area)}</span>
            <span>🏷️ ${escHtml(p.category)}</span>
          </div>
          <a href="/place.html?slug=${encodeURIComponent(targetSlug)}" class="fair-place-card__link" onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(targetSlug)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(targetSlug)}')">عرض بطاقة المكان ↗</a>
        </div>
      </article>
    `;
    }).join('');
  }

  // Render initial 4 cards immediately (0ms)
  const total = _homeVerifiedPool.length;
  const initialSlice = [];
  for (let i = 0; i < Math.min(4, total); i++) {
    initialSlice.push(_homeVerifiedPool[(_homeVerifiedRotationIndex + i) % total]);
  }
  renderCards(initialSlice);

  // Setup periodic rotation every 4.5 seconds
  if (_homeVerifiedInterval) {
    clearInterval(_homeVerifiedInterval);
    _homeVerifiedInterval = null;
  }

  if (total >= 2) {
    let rotationRound = 1;
    _homeVerifiedInterval = setInterval(() => {
      const cards = grid.querySelectorAll('.fair-place-card');
      cards.forEach(c => c.classList.add('anim-swap'));

      setTimeout(() => {
        _homeVerifiedRotationIndex = (_homeVerifiedRotationIndex + 1) % _homeVerifiedPool.length;
        rotationRound++;

        const currentSlice = [];
        const poolSize = _homeVerifiedPool.length;
        for (let i = 0; i < Math.min(4, poolSize); i++) {
          currentSlice.push(_homeVerifiedPool[(_homeVerifiedRotationIndex + i) % poolSize]);
        }
        renderCards(currentSlice);

        if (statusText) {
          statusText.innerHTML = `🟢 <b>تم تدوير الصدارة تلقائياً (${rotationRound}):</b> تتغير المراكز دورياً لضمان تكافؤ نسب المشاهدة لكافة الأماكن الموثقة!`;
        }
      }, 300);
    }, 4500);
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

function renderLatestPlaces(places) {
  const grid = document.getElementById('latest-places-grid');
  if (!grid) return;

  if (!places || !places.length) {
    if (grid.querySelector('.fair-place-card') || grid.querySelector('.place-card')) return;
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🏪</div>
        <p class="empty-state__text">لا توجد أماكن مسجلة بعد</p>
        <a href="dashboard.html?section=add" class="btn btn-primary btn-sm" style="margin-top:1rem">أضف أول مكان</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = places.map(p => renderPlaceCard(p)).join('');
}

function renderOffers(offers) {
  const scroll = document.getElementById('offers-scroll');
  const section = document.getElementById('offers-section');
  if (!scroll) return;

  if (!offers || !offers.length) {
    if (!scroll.querySelector('.offer-card')) {
      if (section) section.style.display = 'none';
    }
    return;
  }
  if (section) section.style.display = '';

  scroll.innerHTML = offers.map(offer => {
    const discount = offer.discountPercent || calcDiscount(offer.oldPrice, offer.newPrice);
    const days = daysUntil(offer.endDate);

    return `
      <article class="offer-card"
               data-place-slug="${escAttr(offer.placeSlug || '')}"
               data-name="${escAttr(offer.placeName || offer.title || '')}"
               data-cover="${escAttr(offer.imageUrl || '')}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(offer.placeSlug || '')}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(offer.placeSlug || '')}')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(offer.placeSlug || '')}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(offer.placeSlug || '')}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(offer.placeSlug || '')}', this)"
               style="cursor:pointer">
        <div class="offer-card__image">
          ${offer.imageUrl
            ? `<img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" loading="lazy" />`
            : `<div style="width:100%;height:100%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:2rem">🏷️</div>`
          }
          ${discount > 0 ? `<span class="offer-card__discount-badge">-${discount}%</span>` : ''}
        </div>
        <div class="offer-card__body">
          <h3 class="offer-card__title">${escHtml(offer.title)}</h3>
          ${offer.placeName ? `<div class="offer-card__place">📍 ${escHtml(offer.placeName)}</div>` : ''}
          ${offer.newPrice ? `
          <div class="offer-card__price">
            <span class="offer-card__price-new">${formatPrice(offer.newPrice)}</span>
            ${offer.oldPrice ? `<span class="offer-card__price-old">${formatPrice(offer.oldPrice)}</span>` : ''}
          </div>
          ` : ''}
          <div class="offer-card__expiry">
            ⏰ ${days > 0 ? `ينتهي خلال ${days} يوم` : 'ينتهي اليوم'}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderDeliveryServices(places) {
  const grid = document.getElementById('delivery-grid');
  const section = document.getElementById('delivery-section');
  if (!grid) return;

  if (!places || !places.length) {
    if (!grid.querySelector('.delivery-card')) {
      if (section) section.style.display = 'none';
    }
    return;
  }
  if (section) section.style.display = '';

  grid.innerHTML = places.slice(0, 8).map(place => {
    const targetSlug = place.slug || place._key || place.id || '';
    const vMeta = resolveDeliveryVehicle(place);
    const locationPart = place.area ? ` • ${escHtml(place.area)}` : ' بالمنزلة';

    return `
    <a href="/place.html?slug=${encodeURIComponent(targetSlug)}" class="delivery-card"
       style="--vehicle-color: ${vMeta.color}; --vehicle-bg: ${vMeta.bgColor}; --vehicle-border: ${vMeta.borderColor}; --vehicle-glow: ${vMeta.glowColor};"
       data-place-id="${escAttr(place.id || place._key || '')}"
       data-place-slug="${escAttr(targetSlug)}"
       data-name="${escAttr(place.name || '')}"
       data-phone="${escAttr(place.phone || '')}"
       data-whatsapp="${escAttr(place.whatsapp || '')}"
       data-area="${escAttr(place.area || '')}"
       data-cover="${escAttr(place.coverImageUrl || '')}"
       data-logo="${escAttr(place.logoUrl || '')}"
       onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(targetSlug)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(targetSlug)}')"
       ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}', this)"
       onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}', this)"
       onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}', this)">
      <div class="delivery-card__icon" aria-label="${vMeta.name}">
        <span class="delivery-card__emoji" aria-hidden="true">${vMeta.icon}</span>
      </div>
      <div class="delivery-card__info">
        <div class="delivery-card__name">${escHtml(place.name)}</div>
        <div class="delivery-card__type">
          <span class="delivery-card__type-tag" style="color: ${vMeta.color}; font-weight: 700;">${vMeta.label}</span>
          <span class="delivery-card__type-area">${locationPart}</span>
        </div>
      </div>
    </a>
  `;
  }).join('');
}

function renderAds(ads) {
  const container = document.getElementById('ads-container');
  if (!container || !ads || !ads.length) return;

  const validAds = ads.filter(ad => ad && (ad.imageUrl || ad.image_url));
  if (!validAds.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = validAds.map(ad => {
    let link = (ad.link || '#').trim();
    if (link.startsWith('place.html')) {
      link = '/' + link;
    }
    const adId = ad.id || ad._id || '';
    const title = ad.title || 'إعلان مميز';
    const img = ad.imageUrl || ad.image_url || '';

    return `
      <a href="${escAttr(link)}" class="ad-banner" target="_blank" rel="noopener noreferrer sponsored" aria-label="${escAttr(title)}" data-ad-id="${escAttr(adId)}">
        <span class="ad-banner__label" aria-label="إعلان مميز">
          <span class="ad-banner__star" aria-hidden="true">⭐</span>
          <span class="ad-banner__text">إعلان مميز</span>
        </span>
        <img src="${escAttr(img)}" alt="${escAttr(title)}" loading="lazy" decoding="async"
             width="800" height="420" style="aspect-ratio:16/7;" />
      </a>
    `;
  }).join('');

  // Click tracking
  container.querySelectorAll('.ad-banner').forEach(linkEl => {
    linkEl.addEventListener('click', () => {
      const adId = linkEl.getAttribute('data-ad-id');
      if (adId && WORKER_URL) {
        try {
          fetch(`${WORKER_URL}/api/ads/track-click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: adId }),
            keepalive: true
          }).catch(() => {});
        } catch (_) {}
      }
    });
  });
}

/**
 * High-Performance Web Audio Synthesizer for Counter Sounds
 * Generates crisp mechanical ticks and melodic celebration chimes without external assets.
 */
class StatsSoundSynth {
  constructor() {
    this.ctx = null;
    this.lastTickTime = 0;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playTick(frequency = 550) {
    try {
      if (!this.ctx) return;
      if (this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      if (now - this.lastTickTime < 0.038) return; // Prevent audio congestion
      this.lastTickTime = now;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.35, now + 0.018);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.028);
    } catch (_) {}
  }

  playDoneChime() {
    try {
      if (!this.ctx) return;
      if (this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      // Melodic celebration arpeggio: C6 -> E6 -> G6 -> C7
      const notes = [1046.50, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.055);

        gain.gain.setValueAtTime(0.06, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.35);
      });
    } catch (_) {}
  }
}

const statsAudio = new StatsSoundSynth();

function renderStatsBar(placesCount, categoriesCount) {
  const bar = document.getElementById('stats-bar');
  if (!bar) return;

  const targetMonthlyVisits = 50000;
  const targetPlaces = Math.max(15000, Number(placesCount) || 0);
  const targetDailySearches = 12000;
  const targetCategories = Math.max(124, Number(categoriesCount) || 0);
  const targetVillages = 55;

  bar.innerHTML = `
    <div class="stats-bar__inner container">
      <div class="stats-bar__item stats-interactive-item" title="إحصائية الزيارات والتفاعل الشهري بالمنطقة">
        <div class="stats-bar__value" data-target="${targetMonthlyVisits}" data-prefix="+" data-suffix="">+${targetMonthlyVisits.toLocaleString('en-US')}</div>
        <div class="stats-bar__label">مشاهدة وزيارة شهرياً</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="عدد الأنشطة والمحلات والمهن والعيادات المسجلة">
        <div class="stats-bar__value" data-target="${targetPlaces}" data-prefix="+" data-suffix="">+${targetPlaces.toLocaleString('en-US')}</div>
        <div class="stats-bar__label">نشاط تجاري وعيادة ومهنة مسجلة</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="إحصائية عمليات البحث اليومي في مدن وقرى الدليل">
        <div class="stats-bar__value" data-target="${targetDailySearches}" data-prefix="+" data-suffix="">+${targetDailySearches.toLocaleString('en-US')}</div>
        <div class="stats-bar__label">عملية بحث يومياً</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="عدد التصنيفات والمهن والحرف المغطاة">
        <div class="stats-bar__value" data-target="${targetCategories}" data-prefix="+" data-suffix="">+${targetCategories}</div>
        <div class="stats-bar__label">تصنيف ومهنة وحرفة</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="المدن والقرى المسجلة بالدليل">
        <div class="stats-bar__value" data-target="${targetVillages}" data-prefix="+" data-suffix="">+${targetVillages}</div>
        <div class="stats-bar__label">مدينة وقرية مسجلة بالدليل</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="دليل المنزلة والمطرية والجمالية الرقمي">
        <div class="stats-bar__value stats-text-badge">المنزلة والمطرية والجمالية</div>
        <div class="stats-bar__label">محافظة الدقهلية</div>
      </div>
    </div>
  `;


  setupStatsBarCounter(bar);
}

function setupStatsBarCounter(bar) {
  let hasAnimated = false;
  let isRunning = false;

  function runAnimation() {
    if (isRunning) return;
    isRunning = true;

    const valueEls = bar.querySelectorAll('.stats-bar__value[data-target]');
    if (!valueEls.length) {
      isRunning = false;
      return;
    }

    const duration = 1800; // ms
    const startTime = performance.now();

    valueEls.forEach(el => {
      el.classList.remove('stats-done');
      el.classList.add('stats-counting');
    });

    let lastNum = -1;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth deceleration: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);

      valueEls.forEach(el => {
        const target = parseInt(el.getAttribute('data-target'), 10) || 0;
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const currentNum = Math.floor(ease * target);

        el.textContent = `${prefix}${currentNum.toLocaleString('en-US')}${suffix}`;

        if (currentNum !== lastNum) {
          lastNum = currentNum;
          // Frequency scales upward with counter progress (400Hz -> 850Hz)
          const pitch = 420 + (currentNum / Math.max(1, target)) * 430;
          statsAudio.playTick(pitch);
        }
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Final completion state
        valueEls.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10) || 0;
          const prefix = el.getAttribute('data-prefix') || '';
          const suffix = el.getAttribute('data-suffix') || '';
          el.textContent = `${prefix}${target.toLocaleString('en-US')}${suffix}`;
          el.classList.remove('stats-counting');
          el.classList.add('stats-done');
        });
        statsAudio.playDoneChime();
        isRunning = false;
      }
    }

    requestAnimationFrame(step);
  }

  // Trigger when scrolled into viewport
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          runAnimation();
          observer.disconnect();
        }
      });
    }, { threshold: 0.15 });
    observer.observe(bar);
  } else {
    runAnimation();
  }

  // Allow clicking any counter item to re-trigger animation & audio
  bar.querySelectorAll('.stats-interactive-item').forEach(item => {
    item.addEventListener('click', () => {
      statsAudio.init();
      if (statsAudio.ctx && statsAudio.ctx.state === 'suspended') {
        statsAudio.ctx.resume().catch(() => {});
      }
      runAnimation();
    });
  });
}

function setupHeroSearch(categories) {
  const container = document.getElementById('hero-search-glow-wrap');
  const input = document.getElementById('hero-search-input');
  const btn = document.getElementById('hero-search-btn');
  const clearBtn = document.getElementById('hero-search-clear');
  const dropdown = document.getElementById('hero-live-dropdown');

  if (!input) return;

  if (dropdown && !document.getElementById('hero-live-list')) {
    dropdown.innerHTML = `
      <div class="hero-live-dropdown__header">
        <span>⚡ نتائج بحث فورية في المنزلة والمطرية:</span>
        <span class="hero-live-dropdown__count" id="hero-live-count">0</span>
      </div>
      <div class="hero-live-dropdown__list" id="hero-live-list"></div>
      <div class="hero-live-dropdown__footer">
        <a href="search.html" class="hero-live-dropdown__all-btn" id="hero-live-all-btn">
          <span>عرض كافة النتائج في صفحة البحث المتقدم</span>
          <span>←</span>
        </a>
      </div>
    `;
  }

  const resultsList = document.getElementById('hero-live-list');
  const countBadge = document.getElementById('hero-live-count');
  const allBtn = document.getElementById('hero-live-all-btn');

  const quickCats = document.getElementById('hero-quick-cats');
  if (quickCats && Array.isArray(categories) && categories.length > 0) {
    quickCats.innerHTML = categories.slice(0, 10).map(cat => {
      const slug = cat.slug || cat._key || cat.id || '';
      const svgIcon = getCategorySvg(slug || cat.name, 18);
      return `
        <a href="category.html?slug=${encodeURIComponent(slug)}" class="hero__quick-cat">
          ${svgIcon || cat.icon || '🏪'} ${escHtml(cat.name)}
        </a>
      `;
    }).join('');
  }

  function doSearch() {
    const q = input.value.trim();
    if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
  }

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    doSearch();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      doSearch();
    } else if (e.key === 'Escape') {
      dropdown?.classList.remove('visible');
    }
  });

  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    clearBtn.classList.remove('visible');
    dropdown?.classList.remove('visible');
    if (resultsList) resultsList.innerHTML = '';
    input.focus();
  });

  function showHeroSuggestions() {
    if (!dropdown || !resultsList) return;
    countBadge && (countBadge.textContent = 'مقترحات');
    resultsList.innerHTML = `
      <div class="hero-live-suggestions">
        <div class="hero-live-suggestions__title">⚡ مقترحات سريعة ومطلوبة الآن:</div>
        <div class="hero-live-suggestions__chips">
          <button type="button" class="hero-live-suggestion-chip" data-q="صيدلية">💊 صيدليات وطوارئ</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="دكتور عيادة">🩺 أطباء وعيادات</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="سباك">🔧 سباكين وأعطال</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="كهربائي">⚡ فنيين كهرباء</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="مطعم">🍔 مطاعم ودليفري</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="سوبر ماركت">🛒 بقالة وسوبر ماركت</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="مستشفى">🏥 مستشفيات وإسعاف</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="حماد">⭐ حماد</button>
        </div>
      </div>
    `;
    resultsList.querySelectorAll('.hero-live-suggestion-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const q = chip.getAttribute('data-q') || '';
        input.value = q;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
    });
    dropdown.classList.add('visible');
  }

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 1 && resultsList?.children.length > 0) {
      dropdown?.classList.add('visible');
    } else if (!input.value.trim()) {
      showHeroSuggestions();
    }
  });

  input.addEventListener('click', () => {
    if (!input.value.trim()) {
      showHeroSuggestions();
    }
  });

  let debounceTimer = null;
  let activeSearchReq = 0;

  // ⚡ Live Search as user types in hero search
  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearBtn?.classList.toggle('visible', query.length > 0);

    if (allBtn) {
      allBtn.href = `search.html?q=${encodeURIComponent(query)}`;
    }

    if (!query) {
      dropdown?.classList.remove('visible');
      if (resultsList) resultsList.innerHTML = '';
      return;
    }

    // ⚡ 0ms immediate search execution for single-character or short queries
    const delay = query.length <= 2 ? 0 : 35;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const currentReq = ++activeSearchReq;
      try {
        const results = await executeFastSearch(query, { limit: 6 });
        if (currentReq !== activeSearchReq) return; // Discard stale response

        if (!dropdown || !resultsList) return;

        if (!results || results.length === 0) {
          countBadge && (countBadge.textContent = '0');
          resultsList.innerHTML = `
            <div class="hero-live-empty">
              <div class="hero-live-empty__icon">🔍</div>
              <div class="hero-live-empty__title">لم يتم العثور على أماكن مطابقة</div>
              <div class="hero-live-empty__desc">جرب كلمة أخرى مثل (صيدلية، دكتور، مطعم، نجار)</div>
            </div>
          `;
          dropdown.classList.add('visible');
          return;
        }

        countBadge && (countBadge.textContent = String(results.length));

        function highlightMatch(text, q) {
          if (!text) return '';
          if (!q) return escHtml(text);
          const words = q.trim().split(/\s+/).filter(Boolean);
          if (!words.length) return escHtml(text);
          const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
          return escHtml(text).replace(regex, '<span class="search-highlight">$1</span>');
        }

        let matchedCatsHtml = '';
        if (results.matchingCategories && results.matchingCategories.length > 0) {
          matchedCatsHtml = `
            <div class="hero-live-matched-cats">
              <span class="hero-live-matched-cats__label">⚡ أقسام مطابقة:</span>
              <div class="hero-live-matched-cats__chips">
                ${results.matchingCategories.map(cat => {
                  const catSlug = cat.slug || cat.id || '';
                  const svgIcon = getCategorySvg(catSlug || cat.name, 16);
                  return `
                    <a href="category.html?slug=${encodeURIComponent(catSlug)}" class="hero-live-matched-cat-chip" onclick="event.stopPropagation()">
                      ${svgIcon || cat.icon || '🏪'}
                      <span>${escHtml(cat.name)}</span>
                    </a>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }

        resultsList.innerHTML = matchedCatsHtml + results.map(doc => {
          const p = doc.raw || doc;
          const name = p.name || 'مكان بالدليل';
          const cat = p.categoryName || doc.category || '';
          const area = p.area || p.address || 'مدينة المنزلة';
          const slug = p.slug || p.id || '';
          const photo = p.photoURL || p.logo || p.coverURL || p.coverImageUrl || p.logoUrl || '';
          const isVerified = p.isVerified || false;
          const isOpen = p.isOpen !== undefined ? p.isOpen : true;
          const letter = (name.trim()[0] || 'م').toUpperCase();

          const phone = (p.phone || '').trim();
          const rawWa = (p.whatsapp || p.phone || '').trim();
          const cleanWa = rawWa ? rawWa.replace(/[^0-9]/g, '') : '';
          const waLink = cleanWa ? (cleanWa.startsWith('2') ? cleanWa : (cleanWa.startsWith('0') ? '2' + cleanWa : '20' + cleanWa)) : '';

          let actionsHtml = '';
          if (phone || waLink) {
            actionsHtml = `
              <div class="hero-live-actions" onclick="event.stopPropagation()">
                ${phone ? `
                  <a href="tel:${escAttr(phone)}" class="hero-live-action-btn hero-live-action-btn--call" title="اتصال هاتفي مباشر" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span class="action-btn-text">اتصال</span>
                  </a>
                ` : ''}
                ${waLink ? `
                  <a href="https://wa.me/${escAttr(waLink)}" target="_blank" rel="noopener" class="hero-live-action-btn hero-live-action-btn--wa" title="محادثة واتساب فورية" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.35-.49.07-1.12.1-3.26-.79-2.73-1.14-4.5-3.89-4.63-4.07-.14-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36.002.52.01.17.01.39-.06.61.47.24.58.8 1.95.87 2.09.07.15.12.32.02.52-.09.21-.14.33-.29.5-.14.17-.3.38-.43.51-.15.15-.3.32-.13.62.18.3.78 1.29 1.68 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.79.84 2.1 1 .3.15.51.23.58.36.08.13.08.76-.16 1.43z"/></svg>
                    <span class="action-btn-text">واتساب</span>
                  </a>
                ` : ''}
              </div>
            `;
          }

          if (typeof window !== 'undefined' && window._placesRegistry && slug) {
            const cleanSlug = String(slug).toLowerCase().trim();
            window._placesRegistry.set(cleanSlug, p);
            if (p.slug) window._placesRegistry.set(String(p.slug).toLowerCase().trim(), p);
            if (p.id) window._placesRegistry.set(String(p.id).toLowerCase().trim(), p);
          }

          return `
            <a href="/place.html?slug=${encodeURIComponent(slug)}" class="hero-live-dropdown__item" role="option"
               data-place-id="${escAttr(p.id || slug)}"
               data-place-slug="${escAttr(slug)}"
               data-name="${escAttr(name)}"
               data-phone="${escAttr(p.phone || '')}"
               data-whatsapp="${escAttr(p.whatsapp || '')}"
               data-area="${escAttr(area)}"
               data-address="${escAttr(p.address || '')}"
               data-cover="${escAttr(p.coverImageUrl || photo)}"
               data-logo="${escAttr(p.logoUrl || photo)}"
               data-category="${escAttr(cat)}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(slug)}', event) : null"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(slug)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(slug)}', this)">
              <div class="hero-live-avatar">
                ${photo
                  ? `<img src="${escAttr(photo)}" alt="${escAttr(name)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\\'hero-live-avatar-fallback\\\'>${letter}</div>'"/>`
                  : `<div class="hero-live-avatar-fallback">${letter}</div>`
                }
              </div>
              <div class="hero-live-content">
                <div class="hero-live-title-row">
                  <span class="hero-live-name">${highlightMatch(name, query)}</span>
                  ${isVerified ? '<span class="hero-live-verified" title="مكان موثق">✓</span>' : ''}
                </div>
                <div class="hero-live-meta-row">
                  ${cat ? `<span class="hero-live-cat">${highlightMatch(cat, query)}</span>` : ''}
                  <span class="hero-live-area">${escHtml(area)}</span>
                  <span class="${isOpen ? 'hero-live-status-open' : 'hero-live-status-closed'}">
                    ${isOpen ? 'مفتوح الآن' : 'مغلق'}
                  </span>
                </div>
              </div>
              ${actionsHtml}
            </a>
          `;
        }).join('');

        dropdown.classList.add('visible');
      } catch (err) {
        console.warn('[HeroLiveSearch] error:', err);
      }
    }, delay);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container?.contains(e.target)) {
      dropdown?.classList.remove('visible');
    }
  });

  // Initialize Voice Search on the left blue microphone button
  const voiceTriggerBtn = document.getElementById('hero-voice-trigger-btn');
  voiceTriggerBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openManzalaVoiceAssistantModal();
  });
}

function setupVillagesSearch() {
  const input = document.getElementById('villages-filter-input');
  const items = document.querySelectorAll('.village-grid-item');
  if (!input || !items.length) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    items.forEach(el => {
      const name = el.getAttribute('data-name') || '';
      const text = el.textContent || '';
      const match = !q || arabicMatch(name, q) || arabicMatch(text, q);
      el.style.display = match ? 'flex' : 'none';
    });
  });
}

/**
 * Professional Typewriter Animation Engine
 * Types the hero headline naturally with progressive letter-by-letter cadence and blinking cursor
 */
let _heroTypewriterTimeout = null;

function initHeroTypewriterAnimation() {
  if (typeof window === 'undefined') return;
  if (_heroTypewriterTimeout) clearTimeout(_heroTypewriterTimeout);

  const part1El = document.getElementById('typewriter-part-1');
  const part2El = document.getElementById('typewriter-part-2');
  const part3El = document.getElementById('typewriter-part-3');

  if (!part1El || !part2El || !part3El) return;

  const phrase1 = 'فين في المنزلة والمطرية؟';
  const phrase2 = ' مين في المنزلة والمطرية؟';
  const subPhrases = [
    'دليلك الشامل للمدن والقرى المجاورة',
    'دليلك لأمهر الأطباء، العيادات، والصيدليات',
    'دليلك لأفضل المحلات، المطاعم، والكافيهات',
    'دليلك للحرفيين: سباك، نجار، كهربائي، ونقاش',
    'أقوى العروض الحصرية والخصومات اليومية'
  ];

  // Keep line 1 (part1 and part2) stable so it never shifts or reflows
  part1El.textContent = phrase1;
  part2El.textContent = phrase2;
  if (!part3El.textContent) {
    part3El.textContent = subPhrases[0];
  }

  let isCancelled = false;
  const sleep = (ms) => new Promise(res => {
    _heroTypewriterTimeout = setTimeout(res, ms);
  });

  async function typeText(el, text, baseDelay = 50) {
    for (let i = 0; i < text.length; i++) {
      if (isCancelled) return;
      el.textContent += text[i];
      const jitter = Math.floor(Math.random() * 25);
      await sleep(baseDelay + jitter);
    }
  }

  async function deleteText(el, deleteCount = null, baseDelay = 25) {
    const original = el.textContent;
    const count = deleteCount !== null ? deleteCount : original.length;
    for (let i = 0; i < count; i++) {
      if (isCancelled) return;
      el.textContent = original.slice(0, original.length - 1 - i);
      await sleep(baseDelay);
    }
  }

  async function startTypingLoop() {
    // Initial pause while reading the first sub-phrase
    await sleep(3500);

    // Loop through sub-phrases on the second line without touching line 1
    let idx = 0;
    while (!isCancelled) {
      await deleteText(part3El, null, 18);
      await sleep(250);
      idx++;
      const nextSub = subPhrases[idx % subPhrases.length];
      await typeText(part3El, nextSub, 38);
      
      // Pause at full sentence
      await sleep(4000);
    }
  }

  startTypingLoop().catch(() => {});
}

function getHomeHTML() {
  const villageList = [
    { name: 'المنزلة', icon: '🏙️', desc: 'المدينة والمركز' },
    { name: 'المطرية', icon: '🌊', desc: 'مدينة وبحيرة المنزلة' },
    { name: 'الجمالية', icon: '🏛️', desc: 'مدينة ومجلس قروي الجمالية' },
    { name: 'العصافرة', icon: '🌾', desc: 'قرية العصافرة' },
    { name: 'الفروسات', icon: '🐎', desc: 'قرية الفروسات' },
    { name: 'البصراط', icon: '🏡', desc: 'قرية البصراط' },
    { name: 'المنزلة الجديدة', icon: '🏢', desc: 'المنزلة الجديدة' },
    { name: 'ميت شريف', icon: '🌿', desc: 'قرية ميت شريف' },
    { name: 'العامرة', icon: '🌾', desc: 'قرية العامرة' },
    { name: 'الستايتة', icon: '🏘️', desc: 'قرية الستايتة' },
    { name: 'كفر حجاج', icon: '🏡', desc: 'كفر حجاج' },
    { name: 'ميت خضير', icon: '🌴', desc: 'قرية ميت خضير' },
    { name: 'العزيزة', icon: '🌴', desc: 'قرية العزيزة' },
    { name: 'دار السلام', icon: '🕊️', desc: 'قرية دار السلام' },
    { name: 'الشبول', icon: '🌊', desc: 'قرية الشبول' },
    { name: 'الأحمدية', icon: '🌾', desc: 'قرية الأحمدية' },
    { name: 'النسايمة', icon: '🌳', desc: 'قرية النسايمة' },
    { name: 'أولاد علم', icon: '🏡', desc: 'أولاد علم' },
    { name: 'خندق الموز', icon: '🍌', desc: 'خندق الموز' },
    { name: 'الحوتة', icon: '🐟', desc: 'قرية الحوتة' },
    { name: 'القزاقزة', icon: '🏘️', desc: 'قرية القزاقزة' },
    { name: 'الشريفية', icon: '🌿', desc: 'قرية الشريفية' },
    { name: 'أولاد سراج', icon: '🏡', desc: 'أولاد سراج' },
    { name: 'أولاد نور', icon: '✨', desc: 'أولاد نور' },
    { name: 'الزعاترة', icon: '🌾', desc: 'قرية الزعاترة' },
    { name: 'القتايلة', icon: '🏘️', desc: 'قرية القتايلة' },
    { name: 'البصايلة', icon: '🏡', desc: 'قرية البصايلة' },
    { name: 'الهنايدة', icon: '🌴', desc: 'قرية الهنايدة' },
    { name: 'أولاد بانا', icon: '🏡', desc: 'أولاد بانا' },
    { name: 'أولاد حانا', icon: '🌾', desc: 'أولاد حانا' },
    { name: 'القطشة', icon: '🏘️', desc: 'قرية القطشة' },
    { name: 'المحارقة', icon: '🔥', desc: 'قرية المحارقة' },
    { name: 'الطوابرة', icon: '🧱', desc: 'قرية الطوابرة' },
    { name: 'العمارنة', icon: '🏡', desc: 'قرية العمارنة' },
    { name: 'الجماملة', icon: '🐪', desc: 'قرية الجماملة' },
    { name: 'إصلاح أبو الأخضر', icon: '🌱', desc: 'إصلاح أبو الأخضر' },
    { name: 'عزبة المفارق', icon: '🛣️', desc: 'عزبة المفارق' },
    { name: 'الإسكندرية الجديدة', icon: '🌊', desc: 'الإسكندرية الجديدة' },
    { name: 'مصر الجديدة', icon: '🏛️', desc: 'مصر الجديدة' },
    { name: 'الجوابر', icon: '🏘️', desc: 'قرية الجوابر' },
    { name: 'المواجد', icon: '🌾', desc: 'قرية المواجد' },
    { name: 'الضهير', icon: '🏡', desc: 'قرية الضهير' },
    { name: 'أولاد صبور', icon: '🌳', desc: 'أولاد صبور' },
    { name: 'أبو خضير', icon: '🌴', desc: 'أبو خضير' },
    { name: 'بطل شميس', icon: '🌾', desc: 'بطل شميس' },
    { name: 'حي البساتين', icon: '🌺', desc: 'حي البساتين' },
    { name: 'الخلايفة', icon: '🏘️', desc: 'الخلايفة' },
    { name: 'العرب والنجوع', icon: '⛺', desc: 'العرب والنجوع' },
    { name: 'الجباسات', icon: '⛏️', desc: 'الجباسات' },
    { name: 'الجسر الواقي', icon: '🛡️', desc: 'الجسر الواقي' },
    { name: 'طريق الشونة', icon: '🛣️', desc: 'طريق الشونة' },
    { name: 'المثلث', icon: '🔺', desc: 'منطقة المثلث' },
    { name: 'المجاير', icon: '🏘️', desc: 'قرية المجاير' },
    { name: 'شرق السكة الحديد', icon: '🚆', desc: 'شرق السكة الحديد' },
    { name: 'القبلية', icon: '🧭', desc: 'المنطقة القبلية' }
  ];

  return `
    <!-- Hero Section -->
    <section class="hero" aria-labelledby="hero-title">
      <!-- Manzala & Matariya Heritage Watermark Decorative Silhouettes -->
      <div class="hero-heritage-decor" aria-hidden="true">
        <!-- Palm Trees Right & Left -->
        <svg class="decor-item decor-palm-right" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C48 95 47 65 52 45 C40 38 25 42 12 52 C20 40 32 32 50 38 C42 22 28 14 10 16 C25 10 40 18 52 35 C52 18 48 5 38 0 C50 3 56 18 56 35 C64 18 78 10 92 16 C76 15 63 24 57 38 C75 32 88 40 95 52 C82 42 68 38 56 45 C58 65 57 95 55 130 Z" />
        </svg>
        <svg class="decor-item decor-palm-left" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C52 95 53 65 48 45 C60 38 75 42 88 52 C80 40 68 32 50 38 C58 22 72 14 90 16 C75 10 60 18 48 35 C48 18 52 5 62 0 C50 3 44 18 44 35 C36 18 22 10 8 16 C24 15 37 24 43 38 C25 32 12 40 5 52 C18 42 32 38 44 45 C42 65 43 95 45 130 Z" />
        </svg>

        <!-- Traditional Fishing Boat / Faluka with Sail (فلوكة صيد بحيرة المنزلة والمطرية) -->
        <svg class="decor-item decor-boat-left" viewBox="0 0 120 70" fill="currentColor">
          <path d="M15 48 C35 56 85 56 105 48 C115 54 95 62 60 62 C25 62 5 54 15 48 Z" />
          <path d="M58 48 L58 10 L88 38 L58 44 Z" opacity="0.9" />
          <path d="M54 48 L54 18 L32 42 L54 45 Z" opacity="0.75" />
          <path d="M10 65 C30 63 50 67 70 65 C90 63 110 67 118 65" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>
        </svg>

        <svg class="decor-item decor-boat-right" viewBox="0 0 100 60" fill="currentColor">
          <path d="M12 40 C30 48 70 48 88 40 C96 46 80 52 50 52 C20 52 4 46 12 40 Z" />
          <path d="M48 40 L48 8 L72 32 L48 36 Z" opacity="0.9" />
          <path d="M45 40 L45 16 L28 35 L45 37 Z" opacity="0.7" />
        </svg>

        <!-- Swimming Fishes (سمك بحيرة المنزلة الطازج - بلطي ووقار) -->
        <svg class="decor-item decor-fish-1" viewBox="0 0 70 35" fill="currentColor">
          <path d="M5 17 C20 6 45 6 60 17 C45 28 20 28 5 17 Z M60 17 L70 8 L66 17 L70 26 Z" />
          <circle cx="22" cy="14" r="2" fill="#fff" opacity="0.5"/>
          <path d="M30 11 Q36 8 42 11" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.7"/>
        </svg>

        <svg class="decor-item decor-fish-2" viewBox="0 0 55 28" fill="currentColor">
          <path d="M5 14 C16 5 36 5 48 14 C36 23 16 23 5 14 Z M48 14 L56 7 L53 14 L56 21 Z" />
          <circle cx="18" cy="11" r="1.5" fill="#fff" opacity="0.5"/>
        </svg>

        <svg class="decor-item decor-fish-3" viewBox="0 0 45 22" fill="currentColor">
          <path d="M4 11 C13 4 30 4 39 11 C30 18 13 18 4 11 Z M39 11 L46 5 L43 11 L46 17 Z" />
        </svg>

        <!-- Water Ripples / Lake Waves (أمواج بحيرة المنزلة الهادئة) -->
        <svg class="decor-item decor-waves" viewBox="0 0 600 60" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M10 20 C40 10 70 30 100 20 C130 10 160 30 190 20 C220 10 250 30 280 20 C310 10 340 30 370 20 C400 10 430 30 460 20 C490 10 520 30 550 20 C570 14 590 24 600 20" opacity="0.45"/>
          <path d="M30 40 C60 30 90 50 120 40 C150 30 180 50 210 40 C240 30 270 50 300 40 C330 30 360 50 390 40 C420 30 450 50 480 40 C510 30 540 50 570 40" opacity="0.3"/>
        </svg>

        <!-- Flying Lake Waterbirds (نوارس وطائر البجع فوق بحيرة المنزلة) -->
        <svg class="decor-item decor-birds" viewBox="0 0 100 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M5 25 Q15 12 25 25 Q35 12 45 25" opacity="0.6"/>
          <path d="M50 16 Q58 5 66 16 Q74 5 82 16" opacity="0.45"/>
          <path d="M80 28 Q86 19 92 28 Q98 19 104 28" opacity="0.4"/>
        </svg>
      </div>

      <div class="hero__inner">
        <div class="hero__eyebrow animate-fade-in">
          <span aria-hidden="true">📍</span>
          دليل المنزلة والمطرية الرقمي — المنزلة وناسها
        </div>
        <h1 class="hero__title animate-fade-in-up" id="hero-title" aria-label="فين في المنزلة والمطرية؟ مين في المنزلة والمطرية؟ دليلك الشامل للمدن والقرى المجاورة">
          <span class="hero__title-line1">
            <span id="typewriter-part-1" class="hero__title-highlight">فين في المنزلة والمطرية؟</span>
            <span id="typewriter-part-2" class="hero__title-white"> مين في المنزلة والمطرية؟</span>
          </span>
          <span class="hero__title-line2">
            <span id="typewriter-part-3" class="hero__title-subtext">دليلك الشامل للمدن والقرى المجاورة</span>
            <span class="typewriter-cursor" aria-hidden="true">|</span>
          </span>
        </h1>
        <p class="hero__subtitle animate-fade-in">
          دليلك الرقمي الشامل لجميع الأماكن، المحلات، الأطباء والعيادات، والمهن والحرفيين (سباك، نجار، مبلط، كهربائي، نقاش) في المنزلة، المطرية، العصافرة، الجمالية، ميت سلسيل، البصراط، العزيزة، الأحمدية، الروضة، الحوتة، النسايمة، ميت خضير، وميت شريف.
        </p>

        <!-- Search Box (Exact Image Match: Full Glowing Horizontal Neon Border + Blue Voice Button + Search Button) -->
        <div class="hero__search">
          <div class="hero-search-glow-wrap" id="hero-search-glow-wrap">
            <div class="hero-search-pill" id="hero-search-pill" role="search">
              <!-- Left Voice Search Button (زر المايك الأزرق مثل الصورة تماماً) -->
              <div class="hero-search-voice-wrap" id="hero-search-voice-slot">
                <button type="button" class="hero-voice-btn" id="hero-voice-trigger-btn" aria-label="البحث الصوتي الذكي" title="البحث الصوتي الذكي">
                  <span class="voice-wave-left" aria-hidden="true">(((</span>
                  <svg class="voice-mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <span class="voice-wave-right" aria-hidden="true">)))</span>
                </button>
              </div>

              <!-- Input Divider -->
              <div class="hero-search-divider" aria-hidden="true"></div>

              <!-- Main Input -->
              <input
                type="search"
                id="hero-search-input"
                class="hero-search-pill-input"
                placeholder="ابحث عن مكان أو خدمة في المنزلة والمطرية..."
                autocomplete="off"
                aria-label="ابحث في دليل المنزلة والمطرية"
              />

              <button type="button" class="hero-search-clear-btn" id="hero-search-clear" aria-label="مسح البحث" title="مسح">✕</button>

              <!-- Right Circular Search Button -->
              <button class="hero-search-btn-trigger" id="hero-search-btn" aria-label="بحث في الدليل" title="بحث في الدليل">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>

            <!-- Hero Floating Live Results Dropdown -->
            <div class="hero-live-dropdown" id="hero-live-dropdown" aria-live="polite">
              <div class="hero-live-dropdown__header">
                <span>⚡ نتائج بحث فورية في المنزلة والمطرية:</span>
                <span class="hero-live-dropdown__count" id="hero-live-count">0</span>
              </div>
              <div class="hero-live-dropdown__list" id="hero-live-list"></div>
              <div class="hero-live-dropdown__footer">
                <a href="search.html" class="hero-live-dropdown__all-btn" id="hero-live-all-btn">
                  <span>عرض كافة النتائج في صفحة البحث المتقدم</span>
                  <span>←</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Categories -->
        <div class="hero__quick-cats" id="hero-quick-cats"></div>
      </div>
    </section>

    <!-- Stats Bar -->
    <div class="stats-bar" id="stats-bar"></div>

    <!-- Local Command Center: high-frequency actions -->
    <section class="local-command-center" aria-labelledby="local-command-title">
      <div class="container">
        <div class="command-heading">
          <div>
            <span class="command-kicker"><span class="command-kicker__dot"></span> دليلك المحلي في خطوة</span>
            <h2 id="local-command-title">محتاج إيه دلوقتي؟</h2>
            <p>اختصر الطريق ووصل للمكان أو الخدمة التي تبحث عنها في المنزلة والمطرية.</p>
          </div>
          <a href="search.html" class="command-search-link" aria-label="فتح البحث المتقدم">البحث المتقدم <span>←</span></a>
        </div>
        <div class="command-grid">
          <a class="command-card command-card--search" href="search.html">
            <span class="command-card__orb"></span><span class="command-card__icon">🔎</span>
            <span class="command-card__body"><strong>ابحث عن أي شيء</strong><small>مكان، طبيب، محل أو صنايعي</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card command-card--nearby" href="around-me.html">
            <span class="command-card__orb"></span><span class="command-card__icon">📍</span>
            <span class="command-card__body"><strong>الأقرب إليك</strong><small>اكتشف ما حولك الآن</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card command-card--open" href="places.html?filter=open">
            <span class="command-card__orb"></span><span class="command-card__icon">🟢</span>
            <span class="command-card__body"><strong>مفتوح الآن</strong><small>خدمات وأماكن متاحة</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card command-card--live" href="now.html">
            <span class="command-card__orb"></span><span class="command-card__icon">🤝</span>
            <span class="command-card__body"><strong>طلبات أهالينا</strong><small>مين فاضي ييجي وطلبات الخدمات</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card command-card--offers" href="offers.html">
            <span class="command-card__orb"></span><span class="command-card__icon">🏷️</span>
            <span class="command-card__body"><strong>عروض اليوم</strong><small>خصومات ومنتجات مميزة</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card command-card--emergency" href="emergency.html">
            <span class="command-card__orb"></span><span class="command-card__icon">🚨</span>
            <span class="command-card__body"><strong>دليل الطوارئ</strong><small>أرقام وخدمات مهمة</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card" href="quran.html" aria-label="القرآن الكريم">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">✦</span>
            <span class="command-card__body"><strong>القرآن الكريم</strong><small>تلاوة وقراءة بواجهة إسلامية</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card command-card--nearby" href="hadith.html" aria-label="الأحاديث الشريفة">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">۞</span>
            <span class="command-card__body"><strong>الأحاديث الشريفة</strong><small>اقرأ وابحث بسرعة</small></span><span class="command-card__arrow">←</span>
          </a>
          <a class="command-card command-card--open" href="quran-search.html" aria-label="الباحث في القرآن الكريم">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">⌕</span>
            <span class="command-card__body"><strong>الباحث في القرآن الكريم</strong><small>ابحث بأي كلمة بذكاء</small></span><span class="command-card__arrow">←</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Dedicated 1:1 Wide Advertisement Showcase (Immediately after "محتاج إيه دلوقتي؟") -->
    <div id="wide-ads-banner" class="container" style="min-height:0;margin:14px auto"></div>

    <!-- Trust Strip -->
    <section class="trust-strip" aria-label="لماذا دليل المنزلة والمطرية؟">
      <div class="container trust-strip__inner">
        <div class="trust-item"><span>🛡️</span><div><strong>بيانات محلية</strong><small>معلومات مصممة للمنطقة</small></div></div>
        <div class="trust-item"><span>📍</span><div><strong>قريب منك</strong><small>اكتشف الخدمات حولك</small></div></div>
        <div class="trust-item"><span>⚡</span><div><strong>بحث سريع</strong><small>الوصول للمعلومة بأقل خطوات</small></div></div>
        <div class="trust-item"><span>🔄</span><div><strong>دليل متجدد</strong><small>أماكن وعروض ومعلومات جديدة</small></div></div>
      </div>
    </section>

    <div id="ads-container" class="container" style="min-height:0"></div>

    <!-- Towns & Villages Directory Section -->
    <section class="section" style="background:var(--surface);padding-block:var(--space-8);border-bottom:1px solid var(--border)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);flex-wrap:wrap;gap:12px">
          <div>
            <h2 class="section-title" style="margin-bottom:2px">
              <span>🗺️</span> استكشف حسب المدينة والقرية (${villageList.length})
            </h2>
            <p style="font-size:13px;color:var(--text-muted);margin:0">تصفح الخدمات والأنشطة التجارية في المنزلة والمطرية وكافة القرى المجاورة</p>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <input type="text" id="villages-filter-input" placeholder="🔍 ابحث عن قريتك أو مدينتك..." class="form-input" style="font-size:12.5px;padding:6px 12px;width:210px;margin:0" />
            <a href="places.html" class="section-link" style="white-space:nowrap">كل المدن والقرى ←</a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:10px;margin-top:14px" id="villages-grid-container">
          ${villageList.map(t => {
            const villageHubMap = {
              'العزيزة': '#/village/al-aziza',
              'البصراط': '#/village/al-basrat',
              'الشبول': '#/village/al-shabboul',
              'العصافرة': '#/village/al-asafra',
              'النسايمة': '#/village/al-nasayma'
            };
            const targetHref = villageHubMap[t.name] || `places.html?area=${encodeURIComponent(t.name)}`;
            return `
            <a href="${targetHref}" class="category-card village-grid-item" data-name="${escAttr(t.name)}" style="padding:12px 8px;text-align:center;text-decoration:none;border-radius:var(--radius-md);transition:all 0.2s ease;display:flex;flex-direction:column;align-items:center" title="دليل أماكن وخدمات ومواصلات ${t.name}">
              <div style="font-size:22px;margin-bottom:4px">${t.icon}</div>
              <div style="font-weight:700;font-size:13px;color:var(--text-primary)">${t.name}</div>
              <div style="font-size:11px;color:var(--text-secondary);font-weight:600;margin-top:2px">${t.desc}</div>
            </a>
          `;}).join('')}
        </div>
      </div>
    </section>

    <!-- ⚡ قسم مين متاح ييجي دلوقتي (طوارئ الحرفيين) -->
    <div class="container section" style="padding-top:0;padding-bottom:0">
      <div id="home-oncall-craftsmen-container"></div>
    </div>

    <!-- 📢 قسم طلبات الخدمات (سجل احتياجك / عروض الفنيين المباشرة) -->
    <div class="container section" style="padding-top:0;padding-bottom:0;margin-top:1.5rem">
      <div id="home-service-requests-container"></div>
    </div>

    <!-- 🗺️ اكتشف ما حولك (GPS Radar) -->
    <div id="home-around-me-container"></div>

    <!-- Dedicated Sponsored Showcase Section -->
    <div class="container section" style="padding-bottom:0" id="home-sponsored-container"></div>

    <!-- Categories Section -->
    <section class="section">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">تصفح التصنيفات</h2>
          <a href="categories.html" class="section-link">عرض الكل ←</a>
        </div>
        <div class="categories-grid" id="categories-grid">
          ${Array(8).fill('<div class="skeleton-category-card"><div class="skeleton-category-card__icon skeleton"></div><div class="skeleton-category-card__name skeleton"></div></div>').join('')}
        </div>
      </div>
    </section>

    <!-- Verified Places Showcase Section (أماكن وثقت صفحتها معنا) -->
    <style>
      .home-verified-section {
        background: var(--surface);
        padding-block: var(--space-8);
      }
      .home-verified-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-4);
        flex-wrap: wrap;
        gap: 12px;
      }
      .home-verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #10B981;
        padding: 3px 12px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 6px;
      }
      .home-verified-dot {
        width: 7px;
        height: 7px;
        background: #10B981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10B981;
        animation: fairPulse 1.6s infinite;
        display: inline-block;
      }
      .home-verified-title {
        margin: 0 0 4px 0;
        font-size: clamp(1.3rem, 2.5vw, 1.75rem);
        font-weight: 800;
        color: var(--text-primary);
      }
      .home-verified-subtitle {
        color: var(--text-muted);
        font-size: 13.5px;
        margin: 0;
      }
      .home-verified-box {
        background: linear-gradient(145deg, #091E33 0%, #0F2F4E 60%, #0A2238 100%);
        border: 1px solid rgba(245, 166, 35, 0.35);
        border-radius: 20px;
        padding: 18px 18px 22px 18px;
        box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.45);
        color: #ffffff;
        position: relative;
        overflow: hidden;
      }
      .home-verified-subbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .home-verified-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: #F1F5F9;
      }
      .home-verified-live-tag {
        background: rgba(245, 166, 35, 0.15);
        border: 1px solid rgba(245, 166, 35, 0.4);
        color: #FCD34D;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11.5px;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .fair-cards-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        transition: opacity 0.3s ease;
      }
      .fair-place-card {
        background: #0C2339;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        overflow: hidden;
        transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease, border-color 0.25s;
        box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        position: relative;
      }
      .fair-place-card.anim-swap {
        transform: scale(0.93) translateY(6px);
        opacity: 0.45;
      }
      .fair-place-card:hover {
        border-color: #F5A623;
        transform: translateY(-3px);
      }
      .fair-place-card__rank {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 3;
        padding: 2px 8px;
        background: rgba(11, 34, 57, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(245, 166, 35, 0.6);
        color: #FCD34D;
        border-radius: 9999px;
        font-size: 10.5px;
        font-weight: 800;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
      }
      .fair-place-card__cover {
        height: 115px;
        width: 100%;
        position: relative;
        background: #153857;
        overflow: hidden;
      }
      .fair-place-card__cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s;
      }
      .fair-place-card:hover .fair-place-card__cover img {
        transform: scale(1.06);
      }
      .fair-place-card__badges {
        position: absolute;
        bottom: 6px;
        right: 6px;
        left: 6px;
        display: flex;
        align-items: center;
        gap: 5px;
        flex-wrap: wrap;
      }
      .fair-badge-sponsored {
        background: linear-gradient(135deg, #F5A623, #D97706);
        color: #000;
        font-size: 10px;
        font-weight: 900;
        padding: 2px 7px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
      }
      .fair-badge-verified {
        background: #0284C7;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
      }
      .fair-place-card__body {
        padding: 12px 10px 14px 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
      }
      .fair-place-card__title {
        font-size: 13.5px;
        font-weight: 800;
        color: #FFFFFF;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .fair-place-card__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11.5px;
        color: #94A3B8;
        gap: 4px;
      }
      .fair-place-card__link {
        margin-top: 6px;
        padding: 5px 8px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #38BDF8;
        text-align: center;
        border-radius: 7px;
        font-size: 11px;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s;
      }
      .fair-place-card__link:hover {
        background: #0284C7;
        color: #fff;
      }
      @media (max-width: 991px) {
        .fair-cards-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 540px) {
        .fair-cards-grid {
          grid-template-columns: 1fr;
        }
        .home-verified-box {
          padding: 16px 12px;
        }
      }
    </style>

    <section class="section home-verified-section" id="verified-places-section">
      <div class="container">
        <div class="home-verified-header">
          <div>
            <div class="home-verified-badge">
              <span class="home-verified-dot"></span>
              <span>توثيق رسمي معتمد 🛡️</span>
            </div>
            <h2 class="section-title home-verified-title">
              أماكن وثقت صفحتها معنا
            </h2>
            <p class="home-verified-subtitle">
              أنشطة تجارية وخدمات معتمدة بالعلامة الرسمية في المنزلة والمطرية مع تدوير عادل ومستمر في الصدارة
            </p>
          </div>
          <a href="places.html?filter=verified" class="section-link">كل الأماكن الموثقة ←</a>
        </div>

        <div class="home-verified-box">
          <div class="home-verified-subbar">
            <div class="home-verified-status">
              <span class="home-verified-dot"></span>
              <span id="home-verified-status-text">بث مباشر: تتغير مراكز الأماكن الموثقة تلقائياً كل 4.5 ثوانٍ لضمان عدالة الظهور</span>
            </div>
            <div class="home-verified-live-tag">
              <span>⚡ تدوير حي مستمر</span>
            </div>
          </div>

          <!-- 4 Horizontal Cards Grid -->
          <div class="fair-cards-grid" id="home-verified-cards-grid">
            <div style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; color: #94A3B8;">جاري تحميل الأماكن الموثقة...</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Places Section -->
    <section class="section">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">أحدث الأماكن</h2>
          <a href="places.html" class="section-link">عرض الكل ←</a>
        </div>
        <div class="places-grid" id="latest-places-grid">
          ${Array(4).fill(renderPlaceCardSkeleton()).join('')}
        </div>
        <div class="show-more">
          <a href="places.html" class="btn btn-outline btn-lg">عرض جميع الأماكن</a>
        </div>
      </div>
    </section>

    <!-- Offers Section -->
    <section class="section" id="offers-section" style="background:var(--surface);padding-block:var(--space-10)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">
            <span>🏷️</span> العروض اليومية
          </h2>
          <a href="offers.html" class="section-link">عرض الكل ←</a>
        </div>
        <div class="offers-scroll" id="offers-scroll"></div>
      </div>
    </section>

    <!-- Delivery Services Section -->
    <section class="section" id="delivery-section">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">
            <span style="display:inline-flex;align-items:center;gap:3px;font-size:1.1em;">🛺 🚗 🛵</span> خدمات التوصيل والمشاوير
          </h2>
          <a href="/places.html?category=delivery" class="section-link">عرض الكل ←</a>
        </div>
        <div class="delivery-grid" id="delivery-grid"></div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="section home-cta-section" style="background:linear-gradient(135deg,var(--primary-dark) 0%,var(--primary) 100%);color:#fff;position:relative;overflow:hidden">
      <!-- Manzala & Matariya Heritage Watermark Decorative Silhouettes for CTA Section -->
      <div class="cta-heritage-decor" aria-hidden="true">
        <!-- Right Palm Tree -->
        <svg class="cta-decor-item cta-palm-right" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C48 95 47 65 52 45 C40 38 25 42 12 52 C20 40 32 32 50 38 C42 22 28 14 10 16 C25 10 40 18 52 35 C52 18 48 5 38 0 C50 3 56 18 56 35 C64 18 78 10 92 16 C76 15 63 24 57 38 C75 32 88 40 95 52 C82 42 68 38 56 45 C58 65 57 95 55 130 Z" />
        </svg>

        <!-- Left Palm Tree -->
        <svg class="cta-decor-item cta-palm-left" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C52 95 53 65 48 45 C60 38 75 42 88 52 C80 40 68 32 50 38 C58 22 72 14 90 16 C75 10 60 18 48 35 C48 18 52 5 62 0 C50 3 44 18 44 35 C36 18 22 10 8 16 C24 15 37 24 43 38 C25 32 12 40 5 52 C18 42 32 38 44 45 C42 65 43 95 45 130 Z" />
        </svg>

        <!-- Fishing Net / شباك الصيد التراثية لبحيرة المنزلة -->
        <svg class="cta-decor-item cta-net" viewBox="0 0 180 100" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M10 10 L170 90 M30 10 L180 80 M50 10 L180 60 M70 10 L180 40 M90 10 L180 20 M10 30 L160 100 M10 50 L140 100 M10 70 L120 100 M10 90 L100 100" opacity="0.35"/>
          <path d="M170 10 L10 90 M150 10 L0 80 M130 10 L0 60 M110 10 L0 40 M90 10 L0 20 M170 30 L20 100 M170 50 L40 100 M170 70 L60 100 M170 90 L80 100" opacity="0.35"/>
        </svg>

        <!-- Faluka / Fishing Boat with Sail -->
        <svg class="cta-decor-item cta-boat" viewBox="0 0 120 70" fill="currentColor">
          <path d="M15 48 C35 56 85 56 105 48 C115 54 95 62 60 62 C25 62 5 54 15 48 Z" />
          <path d="M58 48 L58 10 L88 38 L58 44 Z" opacity="0.9" />
          <path d="M54 48 L54 18 L32 42 L54 45 Z" opacity="0.75" />
        </svg>

        <!-- Jumping Fish (سمك البلطي والوقار) -->
        <svg class="cta-decor-item cta-fish-left" viewBox="0 0 65 32" fill="currentColor">
          <path d="M5 16 C18 6 42 6 56 16 C42 26 18 26 5 16 Z M56 16 L65 8 L61 16 L65 24 Z" />
          <circle cx="20" cy="13" r="1.8" fill="#fff" opacity="0.5"/>
        </svg>

        <svg class="cta-decor-item cta-fish-right" viewBox="0 0 50 25" fill="currentColor">
          <path d="M4 12 C14 5 33 5 44 12 C33 19 14 19 4 12 Z M44 12 L50 6 L47 12 L50 18 Z" />
        </svg>

        <!-- Gentle Lake Waves -->
        <svg class="cta-decor-item cta-waves" viewBox="0 0 600 50" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M0 15 C30 8 60 22 90 15 C120 8 150 22 180 15 C210 8 240 22 270 15 C300 8 330 22 360 15 C390 8 420 22 450 15 C480 8 510 22 540 15 C570 8 600 22 630 15" opacity="0.4"/>
          <path d="M20 32 C50 25 80 39 110 32 C140 25 170 39 200 32 C230 25 260 39 290 32 C320 25 350 39 380 32 C410 25 440 39 470 32 C500 25 530 39 560 32 C590 25 620 39 650 32" opacity="0.25"/>
        </svg>
      </div>

      <div class="container text-center" style="position:relative;z-index:1">
        <div style="font-size:3rem;margin-bottom:var(--space-4)">🏪</div>
        <h2 style="color:#fff;font-size:var(--font-size-2xl);font-weight:800;margin-bottom:var(--space-3)">
          أضف مكانك في دليل المنزلة والمطرية الرقمي
        </h2>
        <p style="color:rgba(255,255,255,0.85);max-width:520px;margin:0 auto var(--space-6);line-height:1.6">
          سجّل محلك أو خدمتك الآن وكن جزءاً من أكبر دليل رقمي لمدينتي المنزلة والمطرية وكافة القرى المجاورة
        </p>
        <a href="dashboard.html?section=add" class="btn btn-secondary btn-xl btn-pulse-cta">
          <span class="cta-btn-shimmer" aria-hidden="true"></span>
          <span class="cta-btn-icon">➕</span>
          <span class="cta-btn-text">أضف مكانك الآن — مجاناً</span>
        </a>
      </div>
    </section>
  `;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * First-Time Visitor Welcome Video Popup (1.mp4)
 */
function checkAndShowFirstVisitVideo() {
  try {
    // Disabled automatically to prevent net::ERR_CONNECTION_FAILED and accessibility audits
    return;
    if (typeof localStorage === 'undefined' || typeof document === 'undefined') return;
    const hasSeen = localStorage.getItem('__has_seen_welcome_video_v1');
    if (hasSeen) return;

    if (document.getElementById('first-visit-video-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'first-visit-video-modal';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      transition: opacity 0.35s ease;
    `;

    overlay.innerHTML = `
      <div class="first-visit-video-card" style="
        position: relative;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(27, 79, 114, 0.45);
        width: 100%;
        max-width: 660px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.92);
        transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <div style="display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; font-size: 14px;">
            <span>👋</span>
            <span>مرحباً بك في دليل المنزلة والمطرية الرقمي</span>
          </div>
          <button id="btn-close-welcome-video" style="
            background: rgba(255, 255, 255, 0.12);
            border: none;
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            font-weight: 700;
            transition: all 0.2s;
          " title="إغلاق وتخطي الفيديو">✕</button>
        </div>

        <!-- Video Player (1.mp4) -->
        <div style="position: relative; width: 100%; background: #000; display: flex; align-items: center; justify-content: center;">
          <video id="welcome-intro-video" src="1.mp4" playsinline autoplay controls style="width: 100%; max-height: 65vh; display: block; object-fit: contain;"></video>
          
          <!-- Sound Banner if browser blocks unmuted autoplay -->
          <div id="unmute-helper-banner" style="
            display: none;
            position: absolute;
            bottom: 65px;
            background: rgba(16, 185, 129, 0.95);
            color: #fff;
            padding: 8px 18px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.4);
            animation: bounceMute 1.2s infinite ease-in-out;
            z-index: 10;
          ">
            🔊 اضغط هنا لتشغيل الصوت مباشرة
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(255, 255, 255, 0.03); border-top: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 12px; color: rgba(255, 255, 255, 0.65);">يختفي الفيديو تلقائياً فور انتهائه ⏳</span>
          <button id="btn-skip-welcome-video" style="
            background: #1B4F72;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 7px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          ">تخطي الفيديو والدخول للموقع ←</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      const card = overlay.querySelector('.first-visit-video-card');
      if (card) card.style.transform = 'scale(1)';
    });

    const videoEl = document.getElementById('welcome-intro-video');
    const unmuteBanner = document.getElementById('unmute-helper-banner');

    function closeWelcomeModal() {
      try {
        localStorage.setItem('__has_seen_welcome_video_v1', 'true');
      } catch (_) {}

      if (videoEl) {
        videoEl.pause();
      }

      overlay.style.opacity = '0';
      const card = overlay.querySelector('.first-visit-video-card');
      if (card) card.style.transform = 'scale(0.92)';

      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 350);
    }

    if (videoEl) {
      videoEl.addEventListener('ended', closeWelcomeModal);

      // Force unmuted audio
      videoEl.muted = false;
      videoEl.volume = 1.0;

      // Attempt playing with full audio
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Playing with sound successfully
          if (unmuteBanner) unmuteBanner.style.display = 'none';
        }).catch(() => {
          // If browser blocked unmuted autoplay, play muted first then show helper
          videoEl.muted = true;
          videoEl.play().catch(() => {});
          if (unmuteBanner) unmuteBanner.style.display = 'block';

          // On any user interaction, immediately unmute and restore full volume
          const unmuteHandler = () => {
            videoEl.muted = false;
            videoEl.volume = 1.0;
            if (unmuteBanner) unmuteBanner.style.display = 'none';
            document.removeEventListener('click', unmuteHandler);
            document.removeEventListener('touchstart', unmuteHandler);
          };
          document.addEventListener('click', unmuteHandler, { once: true });
          document.addEventListener('touchstart', unmuteHandler, { once: true });
          unmuteBanner?.addEventListener('click', unmuteHandler);
        });
      }
    }

    document.getElementById('btn-close-welcome-video')?.addEventListener('click', closeWelcomeModal);
    document.getElementById('btn-skip-welcome-video')?.addEventListener('click', closeWelcomeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeWelcomeModal();
      }
    });

  } catch (err) {
    console.warn('[Welcome Video] error:', err);
  }
}
