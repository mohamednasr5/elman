/**
 * المنزلة وناسها — Home Page
 * Full homepage with hero, search, categories, places, offers, delivery
 */

import { getCategories, getPublishedPlaces, getActiveOffers, getAds, getSettings } from '../../core/db.js';
import { appState } from '../../core/state.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { daysUntil } from '../../utils/date.js';
import { normalizeArabic, arabicScore } from '../../utils/arabic.js';
import { getCurrentUser } from '../../core/auth.js';

const CATEGORY_EMOJIS = {
  'pharmacy':    { emoji: '💊', color: 'rgba(231,76,60,0.1)',    border: '#E74C3C' },
  'supermarket': { emoji: '🛒', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'paint':       { emoji: '🎨', color: 'rgba(155,89,182,0.1)',   border: '#9B59B6' },
  'herbs':       { emoji: '🌿', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'doctor':      { emoji: '👨‍⚕️', color: 'rgba(41,128,185,0.1)',  border: '#2980B9' },
  'plumbing':    { emoji: '🔧', color: 'rgba(52,73,94,0.1)',     border: '#52596E' },
  'feed':        { emoji: '🌾', color: 'rgba(243,156,18,0.1)',   border: '#F39C12' },
  'poultry':     { emoji: '🍗', color: 'rgba(243,156,18,0.1)',   border: '#F39C12' },
  'bakery':      { emoji: '🍞', color: 'rgba(230,126,34,0.1)',   border: '#E67E22' },
  'vegetables':  { emoji: '🥬', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'antiques':    { emoji: '🏺', color: 'rgba(149,165,166,0.1)',  border: '#95A5A6' },
  'electronics': { emoji: '📺', color: 'rgba(41,128,185,0.1)',   border: '#2980B9' },
  'carpet':      { emoji: '🛋️', color: 'rgba(155,89,182,0.1)',   border: '#9B59B6' },
  'mattress':    { emoji: '🛏️', color: 'rgba(52,152,219,0.1)',   border: '#3498DB' },
  'china':       { emoji: '🍽️', color: 'rgba(231,76,60,0.1)',    border: '#E74C3C' },
  'electrical':  { emoji: '💡', color: 'rgba(241,196,15,0.1)',   border: '#F1C40F' },
  'roastery':    { emoji: '🥜', color: 'rgba(101,67,33,0.1)',    border: '#654321' },
  'phones':      { emoji: '📱', color: 'rgba(41,128,185,0.1)',   border: '#2980B9' },
  'grocery':     { emoji: '🏪', color: 'rgba(39,174,96,0.1)',    border: '#27AE60' },
  'hypermarket': { emoji: '🏬', color: 'rgba(27,79,114,0.1)',    border: '#1B4F72' },
  'delivery':    { emoji: '🚀', color: 'rgba(231,76,60,0.1)',    border: '#E74C3C' },
};

const DEFAULT_CAT = { emoji: '🏪', color: 'rgba(27,79,114,0.1)', border: '#1B4F72' };

export async function renderHomePage($main, { user } = {}) {
  // Render structure immediately
  $main.innerHTML = getHomeHTML();

  try {
    const [categories, places, offers, ads] = await Promise.all([
      getCategories(),
      getPublishedPlaces({ limit: 16 }),
      getActiveOffers(8),
      getAds('homepage')
    ]);

    const currentUser = getCurrentUser() || user;
    const sortedPlaces = sortPlaces(places || [], currentUser?.uid);

    // Render sections
    renderCategories(categories || []);
    renderVerifiedPlaces(sortedPlaces.filter(p => p.isVerified).slice(0, 8));
    renderLatestPlaces(sortedPlaces.slice(0, 8));
    renderOffers(offers || []);
    renderDeliveryServices((places || []).filter(p => p.categoryId?.includes('delivery') || p.deliveryType));
    renderAds(ads || []);

    // Setup hero search
    setupHeroSearch(categories || []);

    // Stats bar
    renderStatsBar((places || []).length, (categories || []).length);

  } catch (err) {
    console.error('[Home] Render failed:', err);
  }
}

function sortPlaces(places, currentUid = null) {
  const seen = new Set();
  const verified = [];
  const userOwned = [];
  const others = [];

  places.forEach(place => {
    const k = place._key || place.id;
    if (seen.has(k)) return;
    seen.add(k);

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

function renderCategories(categories) {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  if (!categories || !categories.length) {
    grid.innerHTML = `<p class="text-muted text-center" style="grid-column:1/-1">لا توجد تصنيفات بعد</p>`;
    return;
  }

  grid.innerHTML = categories.map(cat => {
    const style = CATEGORY_EMOJIS[cat.slug] || DEFAULT_CAT;
    return `
      <a href="category.html?slug=${encodeURIComponent(cat.slug || cat._key)}"
         class="category-card animate-fade-in"
         style="--cat-color:${style.color};--cat-color-border:${style.border}"
         aria-label="${cat.name}">
        <div class="category-card__icon">${cat.icon || style.emoji}</div>
        <div class="category-card__name">${escHtml(cat.name)}</div>
        ${cat.placeCount ? `<div class="category-card__count">${cat.placeCount} مكان</div>` : ''}
      </a>
    `;
  }).join('');
}

function renderVerifiedPlaces(places) {
  const section = document.getElementById('verified-places-section');
  const grid = document.getElementById('verified-places-grid');
  if (!grid) return;

  if (!places || !places.length) {
    section?.remove();
    return;
  }

  grid.innerHTML = places.map(p => renderPlaceCard(p)).join('');
}

function renderLatestPlaces(places) {
  const grid = document.getElementById('latest-places-grid');
  if (!grid) return;

  if (!places || !places.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🏪</div>
        <h3 class="empty-state__title">كن أول من يضيف مكانه في المنزلة</h3>
        <a href="dashboard.html?section=add" class="btn btn-primary" style="margin-top:1rem">➕ إضافة مكان</a>
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
    section?.remove();
    return;
  }

  scroll.innerHTML = offers.map(offer => {
    const discount = offer.discountPercent || calcDiscount(offer.oldPrice, offer.newPrice);
    const days = daysUntil(offer.endDate);

    return `
      <article class="offer-card" onclick="window.location.href='place.html?slug=${encodeURIComponent(offer.placeSlug || '')}'" style="cursor:pointer">
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
    section?.remove();
    return;
  }

  const deliveryIcons = { motorcycle: '🏍️', tuktuk: '🛺', car: '🚗' };

  grid.innerHTML = places.slice(0, 6).map(place => `
    <a href="place.html?slug=${encodeURIComponent(place.slug || place._key)}" class="delivery-card">
      <div class="delivery-card__icon">${deliveryIcons[place.deliveryType] || '🚀'}</div>
      <div class="delivery-card__info">
        <div class="delivery-card__name">${escHtml(place.name)}</div>
        <div class="delivery-card__type">خدمة توصيل بالمنزلة</div>
      </div>
    </a>
  `).join('');
}

function renderAds(ads) {
  const container = document.getElementById('ads-container');
  if (!container || !ads || !ads.length) return;

  container.innerHTML = ads.map(ad => `
    <a href="${escAttr(ad.link || '#')}" class="ad-banner" target="_blank" rel="noopener noreferrer">
      <span class="ad-banner__label">إعلان</span>
      ${ad.imageUrl ? `<img src="${escAttr(ad.imageUrl)}" alt="${escAttr(ad.title || 'إعلان')}" />` : ''}
    </a>
  `).join('');
}

function renderStatsBar(placesCount, categoriesCount) {
  const bar = document.getElementById('stats-bar');
  if (!bar) return;

  bar.innerHTML = `
    <div class="stats-bar__inner container">
      <div class="stats-bar__item">
        <div class="stats-bar__value">${placesCount || 0}+</div>
        <div class="stats-bar__label">مكان ومحل مسجل</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item">
        <div class="stats-bar__value">${categoriesCount || 21}</div>
        <div class="stats-bar__label">تصنيف ونشاط</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item">
        <div class="stats-bar__value">المنزلة</div>
        <div class="stats-bar__label">محافظة الدقهلية</div>
      </div>
    </div>
  `;
}

function setupHeroSearch(categories) {
  const input = document.getElementById('hero-search-input');
  const btn = document.getElementById('hero-search-btn');

  if (!input) return;

  const quickCats = document.getElementById('hero-quick-cats');
  if (quickCats && categories) {
    quickCats.innerHTML = categories.slice(0, 8).map(cat => {
      const style = CATEGORY_EMOJIS[cat.slug] || DEFAULT_CAT;
      return `
        <a href="category.html?slug=${encodeURIComponent(cat.slug || cat._key)}" class="hero__quick-cat">
          ${cat.icon || style.emoji} ${escHtml(cat.name)}
        </a>
      `;
    }).join('');
  }

  function doSearch() {
    const q = input.value.trim();
    if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
  }

  btn?.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
}

function getHomeHTML() {
  return `
    <!-- Hero Section -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__inner">
        <div class="hero__eyebrow animate-fade-in">
          <span aria-hidden="true">📍</span>
          دليل مدينة المنزلة الرقمي
        </div>
        <h1 class="hero__title animate-fade-in-up" id="hero-title">
          ابحث في <span>المنزلة</span>
          <br />وابلغ وجهتك بسهولة
        </h1>
        <p class="hero__subtitle animate-fade-in">
          اعثر على المحلات والأطباء والخدمات والأماكن في مدينة المنزلة بنقرة واحدة
        </p>

        <!-- Search Box -->
        <div class="hero__search">
          <div class="hero-search" role="search">
            <input
              type="search"
              id="hero-search-input"
              class="hero-search__input"
              placeholder="ابحث عن محل، دكتور، خدمة أو مكان في المنزلة..."
              autocomplete="off"
            />
            <button class="hero-search__btn" id="hero-search-btn" aria-label="بحث">
              <span>🔍</span> بحث
            </button>
          </div>
        </div>

        <!-- Quick Categories -->
        <div class="hero__quick-cats" id="hero-quick-cats"></div>
      </div>
    </section>

    <!-- Stats Bar -->
    <div class="stats-bar" id="stats-bar"></div>

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

    <!-- Verified Places Section -->
    <section class="section" id="verified-places-section" style="background:var(--surface);padding-block:var(--space-10)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">
            <span>✅</span> أماكن موثقة
          </h2>
          <a href="places.html?filter=verified" class="section-link">عرض الكل ←</a>
        </div>
        <div class="places-grid" id="verified-places-grid">
          ${Array(4).fill(renderPlaceCardSkeleton()).join('')}
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
        <h2 class="section-title">
          <span>🚀</span> خدمات التوصيل
        </h2>
        <div class="delivery-grid" id="delivery-grid"></div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="section" style="background:linear-gradient(135deg,var(--primary-dark) 0%,var(--primary) 100%);color:#fff">
      <div class="container text-center">
        <div style="font-size:3rem;margin-bottom:var(--space-4)">🏪</div>
        <h2 style="color:#fff;font-size:var(--font-size-2xl);font-weight:800;margin-bottom:var(--space-3)">
          أضف مكانك في دليل المنزلة
        </h2>
        <p style="color:rgba(255,255,255,0.8);max-width:480px;margin:0 auto var(--space-6)">
          سجّل محلك أو خدمتك الآن وكن جزءاً من أكبر دليل رقمي لمدينة المنزلة
        </p>
        <a href="dashboard.html?section=add" class="btn btn-secondary btn-xl">
          <span>➕</span> أضف مكانك الآن — مجاناً
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
