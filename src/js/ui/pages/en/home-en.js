/**
 * Dalil El Manzala & El Matariya — English Home Page
 * Dedicated native English homepage renderer
 */

import { getCategories, getPublishedPlaces, getActiveOffers, getAds, getCached, FALLBACK_CATEGORIES } from '../../../core/db.js';
import { WORKER_URL } from '../../../core/firebase.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../../components/PlaceCard.js';
import { isAtmPlace } from '../../../utils/atm.js';
import { mountSponsoredShowcase, isPlaceSponsored } from '../../components/SponsoredShowcase.js';
import { formatPrice, calcDiscount } from '../../../utils/arabic.js';
import { daysUntil } from '../../../utils/date.js';
import { getCurrentUser } from '../../../core/auth.js';
import { executeFastSearch, warmupSearchEngine } from '../../../services/search-engine.service.js';
import { getCategorySvg } from '../../../utils/professions-data.js';
import { getCategoryVisualMeta, renderCategoryCardIcon } from '../../../utils/category-visual.js';
import { resolveDeliveryVehicle } from '../../../utils/delivery-vehicle.js';
import { VILLAGE_NAMES_EN, CATEGORY_NAMES_EN, translateArea, translateCategory } from '../../../utils/category-i18n.js';

let _typewriterTimer = null;
let _verifiedRotationTimer = null;
let _verifiedItems = [];
let _verifiedIndex = 0;

export async function renderEnglishHomePage($container, { user } = {}) {
  document.title = 'Dalil El Manzala & El Matariya | #1 Official Digital Directory';
  
  $container.innerHTML = homeHtml();
  initTypewriter();

  // Instant render from cache
  try {
    const cachedCats = getCached('categories_all');
    const cachedPlaces = getCached('published_100_');
    if (Array.isArray(cachedCats) && cachedCats.length) renderCategories(cachedCats);
    if (Array.isArray(cachedPlaces) && cachedPlaces.length) {
      renderVerifiedShowcase(cachedPlaces);
      renderLatestPlaces(cachedPlaces.slice(0, 8));
      renderStatsBar(cachedPlaces.length, cachedCats?.length || 31);
      warmupSearchEngine(cachedPlaces, cachedCats || []);
    }
  } catch (_) {}

  // Fetch live fresh data
  let categories = [], places = [], offers = [], ads = [];
  try {
    const [cRes, pRes, oRes, aRes] = await Promise.allSettled([
      getCategories(),
      getPublishedPlaces({ limit: 100 }),
      getActiveOffers(8),
      getAds('homepage')
    ]);
    categories = cRes.status === 'fulfilled' && Array.isArray(cRes.value) && cRes.value.length ? cRes.value : (getCached('categories_all') || FALLBACK_CATEGORIES || []);
    places = pRes.status === 'fulfilled' && Array.isArray(pRes.value) && pRes.value.length ? pRes.value : (getCached('published_100_') || []);
    offers = oRes.status === 'fulfilled' && Array.isArray(oRes.value) ? oRes.value : (getCached('offers_active_8') || []);
    ads = aRes.status === 'fulfilled' && Array.isArray(aRes.value) ? aRes.value : (getCached('ads_homepage') || []);
  } catch (e) {
    console.warn('[HomeEn] Data load error:', e);
  }

  // Populate instant place registry
  if (typeof window !== 'undefined' && Array.isArray(places)) {
    window._placesRegistry = window._placesRegistry || new Map();
    for (const p of places) {
      if (!p) continue;
      const key = String(p.slug || p.id || p._key || '').toLowerCase().trim();
      if (key) {
        window._placesRegistry.set(key, p);
        if (p.id) window._placesRegistry.set(String(p.id).toLowerCase().trim(), p);
        if (p.slug) window._placesRegistry.set(String(p.slug).toLowerCase().trim(), p);
      }
    }
  }

  renderCategories(categories);
  renderVerifiedShowcase(places);
  renderLatestPlaces(places.slice(0, 8));
  renderOffers(offers);
  renderDeliveryServices(places);
  renderAds(ads);
  renderStatsBar(places.length, categories.length);
  setupLiveSearch();
  setupVillagesFilter();
  warmupSearchEngine(places, categories);

  // Mount English sponsored showcase
  try {
    mountSponsoredShowcase('home-sponsored-container', places, {
      title: 'Featured Places & Verified Listings',
      subtitle: 'Top rated and recommended businesses in El Manzala & El Matariya'
    });
  } catch (_) {}
}

function homeHtml() {
  const towns = Object.entries(VILLAGE_NAMES_EN).map(([ar, en]) => ({ name: en, arName: ar }));

  return `
    <section class="hero" aria-label="Hero">
      <div class="hero__bg-glow" aria-hidden="true"></div>
      <div class="container hero__content">
        <div class="hero__badge animate-fade-in">
          <span class="pulse-dot"></span>
          <span>Official Digital Directory of El Manzala & El Matariya</span>
        </div>
        <h1 class="hero__title">
          <span class="hero__title-line" id="typewriter-part-1">Find Anything in El Manzala & El Matariya</span>
          <span class="hero__title-sub" id="typewriter-part-3">Your comprehensive guide for local services, clinics & shops</span>
        </h1>

        <!-- Search Bar -->
        <div class="hero-search-wrap" id="hero-search-glow-wrap">
          <div class="hero-search-box">
            <span class="hero-search-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="search" id="hero-search-input" class="hero-search-input" placeholder="Search by name, doctor specialty, craft, or phone number..." autocomplete="off" />
            <button type="button" id="hero-search-clear" class="hero-search-clear" aria-label="Clear" style="display:none">✕</button>
            <button type="button" id="hero-search-btn" class="btn btn-primary hero-search-submit">Search</button>
          </div>
          <!-- Live search dropdown -->
          <div class="hero-live-dropdown" id="hero-live-dropdown" style="display:none">
            <div class="hero-live-dropdown__header">
              <span>⚡ Instant Results:</span>
              <span class="hero-live-dropdown__count" id="hero-live-count">0</span>
            </div>
            <div class="hero-live-dropdown__list" id="hero-live-list"></div>
          </div>
        </div>

        <!-- Quick category chips -->
        <div class="hero__quick-chips">
          <a href="/en/category/doctor" class="quick-chip">🩺 Doctors</a>
          <a href="/en/category/pharmacy" class="quick-chip">💊 Pharmacies</a>
          <a href="/en/category/restaurants-and-cafes" class="quick-chip">🍔 Restaurants</a>
          <a href="/en/category/supermarket" class="quick-chip">🛒 Supermarket</a>
          <a href="/en/category/electrician" class="quick-chip">⚡ Electricians</a>
          <a href="/en/category/plumbing" class="quick-chip">🔧 Plumbers</a>
          <a href="/en/category/carpenter" class="quick-chip">🪚 Carpenters</a>
          <a href="/en/category/atm" class="quick-chip">🏧 ATMs</a>
        </div>
      </div>
    </section>

    <!-- Sponsored Showcase Slot -->
    <div class="container section" id="home-sponsored-container" style="display:none"></div>

    <!-- Categories Section -->
    <section class="section container" aria-labelledby="categories-heading">
      <div class="section-header">
        <div>
          <h2 id="categories-heading" class="section-title">Directory Categories</h2>
          <p class="section-subtitle">Browse all activities, professions and services</p>
        </div>
        <a href="/en/categories/" class="section-link">View All Categories &rarr;</a>
      </div>
      <div class="categories-grid" id="categories-grid">
        ${Array(10).fill('<div class="skeleton-category-card"><div class="skeleton-category-card__icon skeleton"></div><div class="skeleton-category-card__name skeleton"></div></div>').join('')}
      </div>
    </section>

    <!-- Verified Showcase Section -->
    <section class="section container" id="verified-showcase-section" aria-labelledby="verified-heading">
      <div class="section-header">
        <div>
          <h2 id="verified-heading" class="section-title">Verified Places Showcase</h2>
          <p class="section-subtitle" id="home-verified-status-text">Officially verified businesses and active professionals</p>
        </div>
        <a href="/en/places/?filter=verified" class="section-link">All Verified Places &rarr;</a>
      </div>
      <div class="grid grid-4" id="home-verified-cards-grid">
        ${Array(4).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </section>

    <!-- Latest Places Section -->
    <section class="section container" aria-labelledby="latest-places-heading">
      <div class="section-header">
        <div>
          <h2 id="latest-places-heading" class="section-title">Recently Added & Updated</h2>
          <p class="section-subtitle">The newest places registered in the directory</p>
        </div>
        <a href="/en/places/" class="section-link">Browse All Places &rarr;</a>
      </div>
      <div class="grid grid-4" id="latest-places-grid">
        ${Array(8).fill(renderPlaceCardSkeleton()).join('')}
      </div>
    </section>

    <!-- Exclusive Offers Section -->
    <section class="section container" id="offers-section" style="display:none" aria-labelledby="offers-heading">
      <div class="section-header">
        <div>
          <h2 id="offers-heading" class="section-title">Exclusive Deals & Offers</h2>
          <p class="section-subtitle">Special discounts from local businesses</p>
        </div>
        <a href="/en/offers/" class="section-link">All Offers &rarr;</a>
      </div>
      <div class="grid grid-4" id="offers-scroll"></div>
    </section>

    <!-- Delivery & Express Transport Section -->
    <section class="section container" id="delivery-section" style="display:none" aria-labelledby="delivery-heading">
      <div class="section-header">
        <div>
          <h2 id="delivery-heading" class="section-title">Express Delivery & Transport</h2>
          <p class="section-subtitle">TukTuk, taxi, and quick delivery drivers available now</p>
        </div>
        <a href="/en/places/?category=delivery" class="section-link">All Delivery &rarr;</a>
      </div>
      <div class="grid grid-4" id="delivery-grid"></div>
    </section>

    <!-- Ad Banners Slot -->
    <div class="container section" id="ads-container"></div>

    <!-- Interactive Statistics Bar -->
    <div id="stats-bar" class="stats-bar-wrapper"></div>

    <!-- 55 Towns & Villages Grid -->
    <section class="section container" aria-labelledby="villages-heading">
      <div class="section-header">
        <div>
          <h2 id="villages-heading" class="section-title">55 Towns & Villages Covered</h2>
          <p class="section-subtitle">Find services in your exact district or village</p>
        </div>
        <div style="min-width:220px">
          <input type="search" id="villages-filter-input" class="form-input" placeholder="Search village or town..." style="margin:0;padding:6px 12px;font-size:13px" />
        </div>
      </div>
      <div class="villages-grid" id="villages-grid">
        ${towns.map(t => `
          <a href="/en/places/?area=${encodeURIComponent(t.name)}" class="village-grid-item" data-name="${escAttr(t.name.toLowerCase())}">
            <span class="village-icon">📍</span>
            <span class="village-name">${escHtml(t.name)}</span>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

function initTypewriter() {
  if (typeof window === 'undefined') return;
  _typewriterTimer && clearTimeout(_typewriterTimer);
  const el = document.getElementById('typewriter-part-3');
  if (!el) return;

  const phrases = [
    'Your trusted guide for local towns and villages',
    'Find top doctors, clinics, and specialized pharmacies',
    'Discover popular shops, restaurants, and cafes',
    'Professional craftsmen: plumbers, carpenters, electricians',
    'Exclusive daily offers and verified discounts'
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function type() {
    const current = phrases[phraseIdx % phrases.length];
    if (isDeleting) {
      charIdx--;
      el.textContent = current.slice(0, charIdx);
      if (charIdx <= 0) {
        isDeleting = false;
        phraseIdx++;
        _typewriterTimer = setTimeout(type, 500);
        return;
      }
      _typewriterTimer = setTimeout(type, 20);
    } else {
      charIdx++;
      el.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) {
        isDeleting = true;
        _typewriterTimer = setTimeout(type, 3500);
        return;
      }
      _typewriterTimer = setTimeout(type, 40);
    }
  }

  _typewriterTimer = setTimeout(type, 2000);
}

function renderCategories(categories) {
  const grid = document.getElementById('categories-grid');
  if (!grid || !Array.isArray(categories) || !categories.length) return;

  grid.innerHTML = categories.slice(0, 16).map(c => {
    const slug = c.slug || c._key || c.id || '';
    const visual = getCategoryVisualMeta(c);
    const icon = renderCategoryCardIcon(c, { size: 36 });
    const name = translateCategory(c.nameEn || c.name || slug, true);
    return `
      <a href="/en/category/${encodeURIComponent(slug)}/" class="category-card" style="--cat-color:${visual.color};--cat-bg:${visual.bgColor};--cat-border:${visual.borderColor}">
        <div class="category-card__icon" style="background:${visual.bgColor};border-color:${visual.borderColor}">
          ${icon}
        </div>
        <div class="category-card__name">${escHtml(name)}</div>
      </a>
    `;
  }).join('');
}

function renderVerifiedShowcase(places) {
  const grid = document.getElementById('home-verified-cards-grid');
  if (!grid) return;

  const verified = (places || []).filter(p => p && (p.isVerified || p.is_verified) && !isAtmPlace(p));
  if (!verified.length) {
    grid.innerHTML = places.slice(0, 4).map(p => renderPlaceCard(p)).join('');
    return;
  }

  _verifiedItems = verified;
  const ranks = ['🥇 Featured #1', '🥈 Featured #2', '🥉 Featured #3', '🎖️ Featured #4'];

  function update() {
    const count = _verifiedItems.length;
    const slice = [];
    for (let i = 0; i < Math.min(4, count); i++) {
      slice.push(_verifiedItems[(_verifiedIndex + i) % count]);
    }
    grid.innerHTML = slice.map((p, idx) => {
      const slug = p.slug || p.id || '';
      const name = p.nameEn || p.name_en || p.name || '';
      const area = translateArea(p.areaEn || p.area || '', true) || 'El Manzala';
      const cat = translateCategory(p.categoryName || p.category || '', true);
      const cover = p.coverImageUrl || p.cover || '/assets/images/og-whatsapp.jpg';
      return `
        <article class="fair-place-card" style="cursor:pointer" onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(slug)}', event) : (window.location.href='/en/place/${encodeURIComponent(slug)}')">
          <span class="fair-place-card__rank">${ranks[idx] || `Featured #${idx + 1}`}</span>
          <div class="fair-place-card__cover">
            <img src="${escAttr(cover)}" alt="${escAttr(name)}" loading="lazy" onerror="this.src='/assets/images/og-whatsapp.jpg'" />
            <div class="fair-place-card__badges">
              <span class="fair-badge-verified">✓ Verified</span>
            </div>
          </div>
          <div class="fair-place-card__body">
            <h3 class="fair-place-card__title" title="${escAttr(name)}">${escHtml(name)}</h3>
            <div class="fair-place-card__meta">
              <span>📍 ${escHtml(area)}</span>
              <span>🏷️ ${escHtml(cat)}</span>
            </div>
            <a href="/en/place/${encodeURIComponent(slug)}" class="fair-place-card__link">View Details &rarr;</a>
          </div>
        </article>
      `;
    }).join('');
  }

  update();
  if (verified.length > 4) {
    _verifiedRotationTimer && clearInterval(_verifiedRotationTimer);
    _verifiedRotationTimer = setInterval(() => {
      _verifiedIndex = (_verifiedIndex + 1) % _verifiedItems.length;
      update();
    }, 5000);
  }
}

function renderLatestPlaces(places) {
  const grid = document.getElementById('latest-places-grid');
  if (!grid) return;
  if (!places || !places.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:48px 16px">
        <div class="empty-state__icon">🏪</div>
        <p class="empty-state__text">No registered places found yet.</p>
        <a href="/en/dashboard/?section=add" class="btn btn-primary btn-sm" style="margin-top:1rem">Add the First Place</a>
      </div>
    `;
    return;
  }
  grid.innerHTML = places.map(p => renderPlaceCard(p)).join('');
}

function renderOffers(offers) {
  const sec = document.getElementById('offers-section');
  const scroll = document.getElementById('offers-scroll');
  if (!sec || !scroll) return;
  if (!offers || !offers.length) {
    sec.style.display = 'none';
    return;
  }
  sec.style.display = 'block';
  scroll.innerHTML = offers.map(o => {
    const disc = o.discountPercent || calcDiscount(o.oldPrice, o.newPrice);
    const left = daysUntil(o.endDate);
    const slug = o.placeSlug || '';
    return `
      <article class="offer-card" style="cursor:pointer" onclick="window.location.href='/en/place/${encodeURIComponent(slug)}'">
        <div class="offer-card__image">
          ${o.imageUrl ? `<img src="${escAttr(o.imageUrl)}" alt="${escAttr(o.title)}" loading="lazy" />` : '<div style="width:100%;height:100%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:2rem">🏷️</div>'}
          ${disc > 0 ? `<span class="offer-card__discount-badge">-${disc}%</span>` : ''}
        </div>
        <div class="offer-card__body">
          <h3 class="offer-card__title">${escHtml(o.titleEn || o.title)}</h3>
          ${o.placeName ? `<div class="offer-card__place">📍 ${escHtml(o.placeNameEn || o.placeName)}</div>` : ''}
          ${o.newPrice ? `
            <div class="offer-card__price">
              <span class="offer-card__price-new">${escHtml(o.newPrice)} EGP</span>
              ${o.oldPrice ? `<span class="offer-card__price-old">${escHtml(o.oldPrice)} EGP</span>` : ''}
            </div>
          ` : ''}
          <div class="offer-card__expiry">
            ⏱️ ${left > 0 ? `Expires in ${left} days` : 'Expires today'}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderDeliveryServices(places) {
  const sec = document.getElementById('delivery-section');
  const grid = document.getElementById('delivery-grid');
  if (!sec || !grid) return;

  const delivery = (places || []).filter(p => {
    if (!p) return false;
    if (p.deliveryType || p.categoryId?.includes('delivery')) return true;
    const name = String(p.name || '').toLowerCase();
    return /توكتوك|تاكسي|شانجي|اتوبيس|توصيل|دليفري|وصلي/i.test(name) && !/صيدلية|مطعم|كشري|حلواني|سوبر/i.test(name);
  });

  if (!delivery.length) {
    sec.style.display = 'none';
    return;
  }
  sec.style.display = 'block';
  grid.innerHTML = delivery.slice(0, 8).map(p => {
    const slug = p.slug || p.id || '';
    const v = resolveDeliveryVehicle(p);
    const name = p.nameEn || p.name_en || p.name || '';
    const area = translateArea(p.areaEn || p.area || '', true) || 'El Manzala';
    return `
      <a href="/en/place/${encodeURIComponent(slug)}" class="delivery-card" style="--vehicle-color:${v.color};--vehicle-bg:${v.bgColor};--vehicle-border:${v.borderColor}">
        <div class="delivery-card__icon">
          <span class="delivery-card__emoji">${v.icon}</span>
        </div>
        <div class="delivery-card__info">
          <div class="delivery-card__name">${escHtml(name)}</div>
          <div class="delivery-card__type">
            <span class="delivery-card__type-tag" style="color:${v.color}">${v.labelEn || v.label}</span>
            <span class="delivery-card__type-area">• ${escHtml(area)}</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function renderAds(ads) {
  const container = document.getElementById('ads-container');
  if (!container || !ads || !ads.length) return;
  const filtered = ads.filter(a => a && (a.imageUrl || a.image_url));
  if (!filtered.length) { container.innerHTML = ''; return; }

  container.innerHTML = filtered.map(a => {
    let link = (a.link || '#').trim();
    if (link.startsWith('/place/')) link = link.replace('/place/', '/en/place/');
    return `
      <a href="${escAttr(link)}" class="ad-banner" target="_blank" rel="noopener noreferrer sponsored">
        <span class="ad-banner__label">⭐ Featured Ad</span>
        <img src="${escAttr(a.imageUrl || a.image_url)}" alt="${escAttr(a.title || 'Sponsored Ad')}" loading="lazy" style="aspect-ratio:16/7" />
      </a>
    `;
  }).join('');
}

function renderStatsBar(placeCount, catCount) {
  const el = document.getElementById('stats-bar');
  if (!el) return;
  const visits = 50000;
  const places = Math.max(15000, Number(placeCount) || 0);
  const searches = 12000;
  const cats = Math.max(124, Number(catCount) || 0);
  const villages = 55;

  el.innerHTML = `
    <div class="stats-bar__inner container">
      <div class="stats-bar__item">
        <div class="stats-bar__value">+${visits.toLocaleString('en-US')}</div>
        <div class="stats-bar__label">Monthly Visitors</div>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <div class="stats-bar__value">+${places.toLocaleString('en-US')}</div>
        <div class="stats-bar__label">Places & Businesses</div>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <div class="stats-bar__value">+${searches.toLocaleString('en-US')}</div>
        <div class="stats-bar__label">Daily Searches</div>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <div class="stats-bar__value">+${cats}</div>
        <div class="stats-bar__label">Categories & Crafts</div>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <div class="stats-bar__value">+${villages}</div>
        <div class="stats-bar__label">Cities & Villages</div>
      </div>
    </div>
  `;
}

function setupLiveSearch() {
  const input = document.getElementById('hero-search-input');
  const btn = document.getElementById('hero-search-btn');
  const clear = document.getElementById('hero-search-clear');
  const dropdown = document.getElementById('hero-live-dropdown');
  const list = document.getElementById('hero-live-list');
  const countBadge = document.getElementById('hero-live-count');

  if (!input) return;

  function doSearch() {
    const q = input.value.trim();
    if (q) window.location.href = `/en/places/?q=${encodeURIComponent(q)}`;
  }

  btn?.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (clear) clear.style.display = val ? 'inline-flex' : 'none';

    if (!val || val.length < 2) {
      if (dropdown) dropdown.style.display = 'none';
      return;
    }

    try {
      const results = executeFastSearch(val, { limit: 5 });
      if (!results || !results.length) {
        if (dropdown) dropdown.style.display = 'none';
        return;
      }
      if (countBadge) countBadge.textContent = results.length;
      if (list) {
        list.innerHTML = results.map(r => {
          const name = r.nameEn || r.name_en || r.name || '';
          const area = translateArea(r.areaEn || r.area || '', true);
          const slug = r.slug || r.id || '';
          return `
            <a href="/en/place/${encodeURIComponent(slug)}" class="hero-live-item">
              <div class="hero-live-item__title">${escHtml(name)}</div>
              <div class="hero-live-item__sub">📍 ${escHtml(area)}</div>
            </a>
          `;
        }).join('');
      }
      if (dropdown) dropdown.style.display = 'block';
    } catch (_) {}
  });

  clear?.addEventListener('click', () => {
    input.value = '';
    clear.style.display = 'none';
    if (dropdown) dropdown.style.display = 'none';
    input.focus();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#hero-search-glow-wrap') && dropdown) {
      dropdown.style.display = 'none';
    }
  });
}

function setupVillagesFilter() {
  const input = document.getElementById('villages-filter-input');
  const items = document.querySelectorAll('.village-grid-item');
  if (!input || !items.length) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    items.forEach(item => {
      const name = item.getAttribute('data-name') || '';
      item.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
    });
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
