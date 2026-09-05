/**
 * المنزلة وناسها — Home Page
 * Full homepage with hero, search, categories, places, offers, delivery
 */

import { getCategories, getPublishedPlaces, getActiveOffers, getAds, getSettings } from '../../core/db.js';
import { appState } from '../../core/state.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { isAtmPlace } from '../../utils/atm.js';
import { mountSponsoredShowcase } from '../components/SponsoredShowcase.js';
import { formatPrice, calcDiscount, normalizeArabic, arabicScore, arabicMatch } from '../../utils/arabic.js';
import { daysUntil } from '../../utils/date.js';
import { getCurrentUser } from '../../core/auth.js';
import { mountVoiceSearchButton } from '../../services/voice.service.js';
import { mountLivePulseSection } from '../components/LivePulseSection.js';
import { mountAroundMeRadar } from '../components/AroundMeRadar.js';

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
  // Render structure immediately
  $main.innerHTML = getHomeHTML();

  try {
    const [categories, places, offers, ads] = await Promise.all([
      getCategories(),
      getPublishedPlaces({ limit: 100 }),
      getActiveOffers(8),
      getAds('homepage')
    ]);

    const currentUser = getCurrentUser() || user;
    const allPlaces = places || [];

    // Render sections
    mountLivePulseSection('home-live-pulse-container');
    mountAroundMeRadar('home-around-me-container');

    mountSponsoredShowcase('home-sponsored-container', allPlaces, {
      title: 'أماكن وإعلانات مميزة في المنزلة والمطرية',
      subtitle: 'أنشطة تجارية وخدمات موصى بها ومعتمدة في المدينة'
    });

    renderCategories(categories || []);
    
    // Verified Places: Sponsored ALWAYS first, then dynamic 1-minute random rotation for all other places
    startVerifiedPlacesRotation(allPlaces);

    // Latest Places (أحدث الأماكن): Sponsored first ALWAYS, then newest added places regardless of verification
    const latestPlaces = sortLatestPlaces(allPlaces, currentUser?.uid);
    renderLatestPlaces(latestPlaces.slice(0, 8));

    renderOffers(offers || []);
    renderDeliveryServices(allPlaces.filter(p => p.categoryId?.includes('delivery') || p.deliveryType));
    renderAds(ads || []);

    // Setup hero search
    setupHeroSearch(categories || []);

    // Setup villages and towns quick search filter
    setupVillagesSearch();

    // Setup Hero Typewriter Animation
    initHeroTypewriterAnimation();

    // Stats bar
    renderStatsBar((allPlaces.length || 0), (categories?.length || 31));

    // First visit welcome video popup (1.mp4)
    checkAndShowFirstVisitVideo();

  } catch (err) {
    console.error('[Home] Render failed:', err);
  }
}

function isPlaceSponsored(place) {
  if (!place) return false;
  return Boolean(
    (place.isSponsored || place.isFeatured || place.isPromoted) &&
    (!place.sponsoredUntil || place.sponsoredUntil > Date.now())
  );
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
  if (!grid || !categories) return;

  grid.innerHTML = categories.slice(0, 12).map(cat => {
    const style = CATEGORY_EMOJIS[cat.slug] || DEFAULT_CAT;
    return `
      <a href="category.html?slug=${encodeURIComponent(cat.slug || cat._key)}"
         class="category-card animate-fade-in"
         style="--cat-color-border:${style.border}"
         aria-label="${cat.name}">
        <div class="category-card__icon">${cat.icon || style.emoji}</div>
        <div class="category-card__name">${escHtml(cat.name)}</div>
      </a>
    `;
  }).join('');
}

let _verifiedPlacesInterval = null;

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startVerifiedPlacesRotation(allPlaces) {
  if (_verifiedPlacesInterval) {
    clearInterval(_verifiedPlacesInterval);
    _verifiedPlacesInterval = null;
  }

  const eligiblePlaces = allPlaces.filter(p => p.isVerified && !isAtmPlace(p));
  if (!eligiblePlaces.length) {
    document.getElementById('verified-places-section')?.remove();
    return;
  }

  // Separate sponsored places from non-sponsored places
  const sponsored = eligiblePlaces.filter(p => isPlaceSponsored(p));
  const regular = eligiblePlaces.filter(p => !isPlaceSponsored(p));

  const updateDisplay = (isInterval = false) => {
    // Both sponsored and regular places are shuffled randomly every minute for 100% fair rotation & equal exposure
    const shuffledSponsored = shuffleArray(sponsored);
    const shuffledRegular = shuffleArray(regular);
    const combined = [...shuffledSponsored, ...shuffledRegular];
    renderVerifiedPlaces(combined.slice(0, 8), isInterval);

    // Also update and re-shuffle Latest Places sponsored ads fairly
    const latestGrid = document.getElementById('latest-places-grid');
    if (latestGrid) {
      const latestPlaces = sortLatestPlaces(allPlaces, null, true);
      renderLatestPlaces(latestPlaces.slice(0, 8));
    }
  };

  // Immediate first render
  updateDisplay(false);

  // Rotate randomly every 60 seconds (1 minute) to guarantee fair exposure for all advertisers
  _verifiedPlacesInterval = setInterval(() => {
    updateDisplay(true);
  }, 60000);
}

function renderVerifiedPlaces(places, animate = false) {
  const section = document.getElementById('verified-places-section');
  const grid = document.getElementById('verified-places-grid');
  if (!grid) return;

  if (!places || !places.length) {
    section?.remove();
    return;
  }

  if (animate) {
    grid.style.transition = 'opacity 0.3s ease';
    grid.style.opacity = '0.3';
    setTimeout(() => {
      grid.innerHTML = places.map(p => renderPlaceCard(p)).join('');
      grid.style.opacity = '1';
    }, 300);
  } else {
    grid.innerHTML = places.map(p => renderPlaceCard(p)).join('');
  }
}

function renderLatestPlaces(places) {
  const grid = document.getElementById('latest-places-grid');
  if (!grid) return;

  if (!places || !places.length) {
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
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
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
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
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

  const targetPlaces = Math.max(15000, Number(placesCount) || 0);
  const targetCategories = Math.max(72, Number(categoriesCount) || 0);
  const targetVillages = 55;

  bar.innerHTML = `
    <div class="stats-bar__inner container">
      <div class="stats-bar__item stats-interactive-item" title="انقر لإعادة تشغيل الحركة والصوت">
        <div class="stats-bar__value" data-target="${targetPlaces}" data-prefix="+" data-suffix="">+0</div>
        <div class="stats-bar__label">مكان ومحل ومهنة مسجلة</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="انقر لإعادة تشغيل الحركة والصوت">
        <div class="stats-bar__value" data-target="${targetCategories}" data-prefix="" data-suffix="">0</div>
        <div class="stats-bar__label">تصنيف ومهنة وحرفة</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="انقر لإعادة تشغيل الحركة والصوت">
        <div class="stats-bar__value" data-target="${targetVillages}" data-prefix="+" data-suffix="">+0</div>
        <div class="stats-bar__label">مدينة وقرية مغطاة بالكامل</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="دليل المنزلة والمطرية الرقمي">
        <div class="stats-bar__value stats-text-badge">المنزلة والمطرية</div>
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

        el.textContent = `${prefix}${currentNum}${suffix}`;

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
          el.textContent = `${prefix}${target}${suffix}`;
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
      runAnimation();
    });
  });
}

function setupHeroSearch(categories) {
  const input = document.getElementById('hero-search-input');
  const btn = document.getElementById('hero-search-btn');

  if (!input) return;

  const quickCats = document.getElementById('hero-quick-cats');
  if (quickCats && categories) {
    quickCats.innerHTML = categories.slice(0, 10).map(cat => {
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

  // Initialize Smart Voice Search
  mountVoiceSearchButton({
    inputEl: input,
    onSearch: (spokenText) => {
      if (spokenText) {
        window.location.href = `search.html?q=${encodeURIComponent(spokenText)}`;
      }
    }
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

  // Start with empty strings to begin typing animation
  part1El.textContent = '';
  part2El.textContent = '';
  part3El.textContent = '';

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
    await sleep(250);
    // 1. Type "فين في المنزلة والمطرية؟" in gold
    await typeText(part1El, phrase1, 48);
    await sleep(200);

    // 2. Type " مين في المنزلة والمطرية؟" in white
    await typeText(part2El, phrase2, 42);
    await sleep(350);

    // 3. Loop through sub-phrases on the second line
    let idx = 0;
    while (!isCancelled) {
      const currentSub = subPhrases[idx % subPhrases.length];
      await typeText(part3El, currentSub, 38);
      
      // Pause at full sentence
      await sleep(4000);

      // Backspace and switch to next phrase
      await deleteText(part3El, null, 18);
      await sleep(300);
      idx++;
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

        <!-- Search Box -->
        <div class="hero__search">
          <div class="hero-search" role="search">
            <input
              type="search"
              id="hero-search-input"
              class="hero-search__input"
              placeholder="ابحث: سباك، دكتور، صيدلية، مطعم في المنزلة، المطرية، القرى..."
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
          ${villageList.map(t => `
            <a href="places.html?area=${encodeURIComponent(t.name)}" class="category-card village-grid-item" data-name="${escAttr(t.name)}" style="padding:12px 8px;text-align:center;text-decoration:none;border-radius:var(--radius-md);transition:all 0.2s ease;display:flex;flex-direction:column;align-items:center" title="دليل أماكن وخدمات ${t.name}">
              <div style="font-size:22px;margin-bottom:4px">${t.icon}</div>
              <div style="font-weight:700;font-size:13px;color:var(--text-primary)">${t.name}</div>
              <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">${t.desc}</div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- 🔥 المنزلة والمطرية الآن (يحدث الآن) -->
    <div id="home-live-pulse-container"></div>

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

    <!-- Verified Places Section -->
    <section class="section" id="verified-places-section" style="background:var(--surface);padding-block:var(--space-10)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">
            <span class="sparkle-star-icon">⭐</span> الأكثر شهرة في المنزلة والمطرية
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
