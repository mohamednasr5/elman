/**
 * مؤشرات مصراوي الحية — أسعار الذهب، العملات، الطقس
 * Dalil El Manzala & El Matariya - Masrawy Live Market Indicators
 */

const STORAGE_KEY = 'manzala_market_indicators_v1';
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

const ICONS = {
  gold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>`,
  currency: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>`
};

/**
 * Smart Animated Weather Engine:
 * Generates interactive, hardware-accelerated animated SVGs for:
 * - Sunny (rotating rays, glowing pulsing sun)
 * - Cloudy (multi-layer drifting clouds)
 * - Partly Cloudy (rotating sun with drifting cloud)
 * - Rain (falling animated raindrops)
 * - Thunder / Storm (dark storm cloud, falling drops, flashing lightning bolt)
 * - Night (glowing crescent moon with twinkling stars)
 */
export function getAnimatedWeatherSVG(weatherData = {}, isLarge = false) {
  let cond = String(weatherData?.condition || '').trim().toLowerCase();
  if (!cond) {
    const curHour = new Date().getUTCHours() + 3; // Egypt Time (UTC+3)
    const egyptHour = curHour % 24;
    cond = (egyptHour >= 19 || egyptHour < 6) ? 'night' : 'sunny';
  }

  const size = isLarge ? 48 : 20;

  if (cond === 'thunder') {
    return `<svg class="mw-weather-anim mw-weather-anim--thunder" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-cloud-main" d="M17.5 14H6.5A4.5 4.5 0 0 1 6.5 5 5 5 0 0 1 15.5 6 4.5 4.5 0 0 1 17.5 14z" fill="#334155" stroke="#64748b"/>
      <polygon class="mw-lightning-bolt" points="13 10 9 16 12 16 11 21 16 14 13 14 15 10" fill="#facc15" stroke="#eab308" stroke-width="1"/>
      <line class="mw-rain-drop-1" x1="7" y1="16" x2="6" y2="19" stroke="#38bdf8" stroke-width="2"/>
      <line class="mw-rain-drop-2" x1="17" y1="16" x2="16" y2="19" stroke="#38bdf8" stroke-width="2"/>
    </svg>`;
  }

  if (cond === 'rain') {
    return `<svg class="mw-weather-anim mw-weather-anim--rain" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-cloud-main" d="M17.5 13H6.5A4.5 4.5 0 0 1 6.5 4 5 5 0 0 1 15.5 5 4.5 4.5 0 0 1 17.5 13z" fill="#475569" stroke="#94a3b8"/>
      <line class="mw-rain-drop-1" x1="7.5" y1="15" x2="6.5" y2="19" stroke="#38bdf8" stroke-width="2"/>
      <line class="mw-rain-drop-2" x1="12" y1="15" x2="11" y2="19" stroke="#38bdf8" stroke-width="2"/>
      <line class="mw-rain-drop-3" x1="16.5" y1="15" x2="15.5" y2="19" stroke="#38bdf8" stroke-width="2"/>
    </svg>`;
  }

  if (cond === 'cloudy') {
    return `<svg class="mw-weather-anim mw-weather-anim--clouds" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-cloud-back" d="M15.5 11H8A3.5 3.5 0 0 1 8 4 4 4 0 0 1 15 5 3.5 3.5 0 0 1 15.5 11z" fill="#64748b" stroke="#94a3b8" opacity="0.75"/>
      <path class="mw-cloud-main" d="M18.5 17H7.5A4.5 4.5 0 0 1 7.5 8 5 5 0 0 1 16.5 9 4.5 4.5 0 0 1 18.5 17z" fill="#94a3b8" stroke="#cbd5e1"/>
    </svg>`;
  }

  if (cond === 'partlycloudy' || cond === 'partly_cloudy' || cond === 'partly') {
    return `<svg class="mw-weather-anim mw-weather-anim--partly" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g class="mw-sun-rays" stroke="#f59e0b" stroke-width="1.8">
        <line x1="16" y1="2" x2="16" y2="4"/>
        <line x1="21.6" y1="4.4" x2="20.2" y2="5.8"/>
        <line x1="23" y1="10" x2="21" y2="10"/>
      </g>
      <circle class="mw-sun-body" cx="16" cy="9" r="4.5" fill="#fbbf24" stroke="#f59e0b"/>
      <path class="mw-cloud-main" d="M17 19H6.5A4.5 4.5 0 0 1 6.5 10 5 5 0 0 1 15 11 4.5 4.5 0 0 1 17 19z" fill="#e2e8f0" stroke="#94a3b8"/>
    </svg>`;
  }

  if (cond === 'night') {
    return `<svg class="mw-weather-anim mw-weather-anim--night" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-moon-body" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#fef08a" stroke="#fde047"/>
      <circle class="mw-star-1" cx="18" cy="5" r="1.2" fill="#38bdf8"/>
      <circle class="mw-star-2" cx="7" cy="6" r="1" fill="#e0f2fe"/>
    </svg>`;
  }

  // Default: Sunny (شمس ذهبية متحركة ومشعة)
  return `<svg class="mw-weather-anim mw-weather-anim--sun" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g class="mw-sun-rays" stroke="#f59e0b" stroke-width="1.9">
      <line x1="12" y1="1.5" x2="12" y2="3.5"/>
      <line x1="12" y1="20.5" x2="12" y2="22.5"/>
      <line x1="1.5" y1="12" x2="3.5" y2="12"/>
      <line x1="20.5" y1="12" x2="22.5" y2="12"/>
      <line x1="4.5" y1="4.5" x2="6" y2="6"/>
      <line x1="18" y1="18" x2="19.5" y2="19.5"/>
      <line x1="4.5" y1="19.5" x2="6" y2="18"/>
      <line x1="18" y1="6" x2="19.5" y2="4.5"/>
    </g>
    <circle class="mw-sun-body" cx="12" cy="12" r="5" fill="#f59e0b" stroke="#d97706"/>
  </svg>`;
}

function getStoredMarketData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) return parsed;
    }
  } catch (_) {}
  return null;
}

function saveStoredMarketData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (_) {}
}

const FALLBACK_DATA = {
  gold: {
    title: 'سعر جرام الذهب عيار 21',
    karat: '21',
    date: 'اليوم',
    price: '6330',
    rawPrice: 6330,
    currency: 'جنيه',
    rates: { k24: '7234', k21: '6330', k18: '5426' }
  },
  currency: {
    title: 'سعر صرف الدولار مقابل الجنيه المصري',
    code: 'USD',
    date: 'اليوم',
    price: '52.14',
    rawPrice: 52.14,
    currency: 'جنيه',
    rates: { usd: '52.14', eur: '56.83', sar: '13.90' }
  },
  weather: {
    temp: '34',
    high: '34',
    low: '25',
    city: 'القاهرة - مصر',
    humidity: '38%',
    wind: 'شمال غرب',
    condition: 'sunny',
    conditionLabel: 'مشمس صافٍ'
  }
};

let currentMarketData = getStoredMarketData()?.data || FALLBACK_DATA;

function getGoldCardHTML(gold) {
  return `
    <div class="mw-card-content">
      <div class="mw-card-head-row">
        <span class="mw-icon mw-icon-gold">${ICONS.gold}</span>
        <h4 class="mw-card-title">${gold.title || 'سعر جرام الذهب عيار 21'}</h4>
      </div>
      <p class="mw-card-date">${gold.date || 'اليوم'}</p>
      <div class="mw-price-box">
        <span class="mw-price-num">${gold.price || '6330'}</span>
        <span class="mw-price-curr">${gold.currency || 'جنيه'}</span>
      </div>
      ${gold.rates ? `
        <div class="mw-sub-rates">
          <div class="mw-sub-rate-row">
            <span>عيار 24:</span>
            <span class="mw-sub-rate-val">${gold.rates.k24 || '—'} ج</span>
          </div>
          <div class="mw-sub-rate-row">
            <span>عيار 18:</span>
            <span class="mw-sub-rate-val">${gold.rates.k18 || '—'} ج</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function getCurrencyCardHTML(curr) {
  return `
    <div class="mw-card-content">
      <div class="mw-card-head-row">
        <span class="mw-icon mw-icon-currency">${ICONS.currency}</span>
        <h4 class="mw-card-title">${curr.title || 'سعر صرف الدولار مقابل الجنيه المصري'}</h4>
      </div>
      <p class="mw-card-date">${curr.date || 'اليوم'}</p>
      <div class="mw-price-box">
        <span class="mw-price-num">${curr.price || '52.14'}</span>
        <span class="mw-price-curr">${curr.currency || 'جنيه'}</span>
      </div>
      ${curr.rates ? `
        <div class="mw-sub-rates">
          <div class="mw-sub-rate-row">
            <span>الريال السعودي:</span>
            <span class="mw-sub-rate-val">${curr.rates.sar || '13.90'} ج</span>
          </div>
          <div class="mw-sub-rate-row">
            <span>اليورو:</span>
            <span class="mw-sub-rate-val">${curr.rates.eur || '56.83'} ج</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function getWeatherCardHTML(weather) {
  const condLabel = weather.conditionLabel || (Number(weather.temp || weather.high) >= 30 ? 'مشمس حار' : 'معتدل');
  return `
    <div class="mw-card-content">
      <div class="mw-card-head-row">
        <span class="mw-icon mw-icon-weather">${getAnimatedWeatherSVG(weather, false)}</span>
        <div class="mw-weather-location">${weather.city || 'القاهرة - مصر'}</div>
      </div>
      <div class="mw-weather-dtls">
        <div class="mw-weather-main-temp">
          <span class="mw-weather-high">${weather.high || weather.temp || '34'}°</span>
          <span class="mw-weather-low">${weather.low || '25'}°</span>
        </div>
        <div class="mw-weather-sun-icon">
          ${getAnimatedWeatherSVG(weather, true)}
        </div>
      </div>
      <div class="mw-weather-condition-badge" style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:800;color:#38bdf8;margin:6px 0 10px;background:rgba(56,189,248,0.12);padding:4px 12px;border-radius:14px;border:1px solid rgba(56,189,248,0.25)">
        <span>الحالة الجوية:</span>
        <span style="color:#ffffff">${condLabel}</span>
      </div>
      <div class="mw-weather-info-box">
        <div class="mw-weather-info-item">الرطوبة: <span>${weather.humidity || '38%'}</span></div>
        <div class="mw-weather-info-item">الرياح: <span>${weather.wind || 'شمال غرب'}</span></div>
      </div>
    </div>
  `;
}

/**
 * Renders the HTML markup for the Market Widgets Bar
 */
export function renderMarketWidgetsHTML(data = currentMarketData) {
  const gold = data?.gold || FALLBACK_DATA.gold;
  const curr = data?.currency || FALLBACK_DATA.currency;
  const weather = data?.weather || FALLBACK_DATA.weather;

  return `
    <div class="market-widgets-bar" id="market-widgets-bar" role="region" aria-label="مؤشرات الأسعار والطقس الحية">
      <!-- 1. Gold Price Widget -->
      <div class="market-widget-item market-widget-item--gold" data-widget="gold" tabindex="0" role="button" aria-expanded="false" aria-label="أسعار الذهب">
        <span class="mw-icon mw-icon-gold">${ICONS.gold}</span>
        <span class="mw-label mw-label-full">أسعار الذهب</span>
        <span class="mw-label mw-label-short"><span class="mw-quick-val">${gold.price || '6330'}</span> ج</span>
        
        <!-- Desktop Dropdown -->
        <div class="market-widget-dropdown" id="mw-dropdown-gold" role="tooltip">
          ${getGoldCardHTML(gold)}
        </div>
      </div>

      <!-- 2. Currency Rates Widget -->
      <div class="market-widget-item market-widget-item--currency" data-widget="currency" tabindex="0" role="button" aria-expanded="false" aria-label="أسعار العملات">
        <span class="mw-icon mw-icon-currency">${ICONS.currency}</span>
        <span class="mw-label mw-label-full">أسعار العملات</span>
        <span class="mw-label mw-label-short"><span class="mw-quick-val">${curr.price || '52.14'}</span> ج</span>
        
        <!-- Desktop Dropdown -->
        <div class="market-widget-dropdown" id="mw-dropdown-currency" role="tooltip">
          ${getCurrencyCardHTML(curr)}
        </div>
      </div>

      <!-- 3. Weather Widget (Smart Animated) -->
      <div class="market-widget-item market-widget-item--weather" data-widget="weather" tabindex="0" role="button" aria-expanded="false" aria-label="الطقس">
        <span class="mw-icon mw-icon-weather">${getAnimatedWeatherSVG(weather, false)}</span>
        <span class="mw-label"><span class="mw-quick-val">${weather.temp || '34'}°</span></span>
        
        <!-- Desktop Dropdown -->
        <div class="market-widget-dropdown" id="mw-dropdown-weather" role="tooltip">
          ${getWeatherCardHTML(weather)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Ensures global mobile modal is in DOM
 */
function ensureMobileModalEl() {
  let modalWrap = document.getElementById('market-widget-mobile-modal');
  if (!modalWrap) {
    modalWrap = document.createElement('div');
    modalWrap.id = 'market-widget-mobile-modal';
    modalWrap.className = 'mw-mobile-modal-wrap';
    modalWrap.innerHTML = `
      <div class="mw-mobile-modal-backdrop" id="mw-mobile-modal-backdrop"></div>
      <div class="mw-mobile-modal-card" role="dialog" aria-modal="true">
        <button type="button" class="mw-mobile-modal-close" id="mw-mobile-modal-close" aria-label="إغلاق">✕</button>
        <div class="mw-mobile-modal-body" id="mw-mobile-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modalWrap);

    const close = () => {
      modalWrap.classList.remove('is-open');
      document.body.classList.remove('mw-modal-open');
    };

    modalWrap.querySelector('#mw-mobile-modal-backdrop').onclick = close;
    modalWrap.querySelector('#mw-mobile-modal-close').onclick = close;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalWrap.classList.contains('is-open')) close();
    });
  }
  return modalWrap;
}

function openMobileModal(type) {
  const modalWrap = ensureMobileModalEl();
  const body = modalWrap.querySelector('#mw-mobile-modal-body');
  if (!body) return;

  const data = currentMarketData;
  if (type === 'gold') {
    body.innerHTML = getGoldCardHTML(data.gold || FALLBACK_DATA.gold);
  } else if (type === 'currency') {
    body.innerHTML = getCurrencyCardHTML(data.currency || FALLBACK_DATA.currency);
  } else if (type === 'weather') {
    body.innerHTML = getWeatherCardHTML(data.weather || FALLBACK_DATA.weather);
  }

  modalWrap.classList.add('is-open');
  document.body.classList.add('mw-modal-open');
}

/**
 * Updates an already rendered bar with fresh data
 */
export function updateMarketWidgetsDOM(container, data) {
  if (!container) return;
  const newHtml = renderMarketWidgetsHTML(data);
  const temp = document.createElement('div');
  temp.innerHTML = newHtml;
  const newBar = temp.firstElementChild;
  if (newBar) {
    container.replaceWith(newBar);
    bindMarketWidgetsEvents(newBar);
  }
}

/**
 * Binds interactivity:
 * - Desktop: Hover flyout dropdowns
 * - Mobile (< 768px): Centered clean dialog modal attached to document.body
 */
export function bindMarketWidgetsEvents(barEl) {
  if (!barEl) return;

  barEl.querySelectorAll('.market-widget-item').forEach(item => {
    const type = item.getAttribute('data-widget');

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      // On mobile screens (< 768px), open full clean centered modal
      if (window.innerWidth < 768) {
        openMobileModal(type);
        return;
      }

      // On desktop, toggle dropdown
      const dropdown = item.querySelector('.market-widget-dropdown');
      if (!dropdown) return;
      const wasOpen = dropdown.classList.contains('is-open');
      barEl.querySelectorAll('.market-widget-dropdown').forEach(d => d.classList.remove('is-open'));
      barEl.querySelectorAll('.market-widget-item').forEach(i => {
        i.classList.remove('active');
        i.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        dropdown.classList.add('is-open');
        item.classList.add('active');
        item.setAttribute('aria-expanded', 'true');
      }
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  // Global click outside (desktop)
  document.addEventListener('click', (e) => {
    if (!barEl.contains(e.target)) {
      barEl.querySelectorAll('.market-widget-dropdown').forEach(d => d.classList.remove('is-open'));
      barEl.querySelectorAll('.market-widget-item').forEach(i => {
        i.classList.remove('active');
        i.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      barEl.querySelectorAll('.market-widget-dropdown').forEach(d => d.classList.remove('is-open'));
      barEl.querySelectorAll('.market-widget-item').forEach(i => {
        i.classList.remove('active');
        i.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/**
 * Fetches fresh live indicators from the backend Worker API
 */
export async function fetchLiveMarketIndicators() {
  const cached = getStoredMarketData();
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_MAX_AGE_MS)) {
    return cached.data;
  }

  try {
    const res = await fetch('/api/market-widgets', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        saveStoredMarketData(json.data);
        currentMarketData = json.data;
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Live Market Indicators] Fetch failed, using cached:', err?.message || err);
  }

  return currentMarketData;
}

/**
 * Universal Mount Function:
 * Mounts in `.page-back-bar` (the exact empty space next to "رجوع" on Mobile & Desktop)
 */
let _observerActive = false;

function tryMount() {
  // 1. Check if page has `.page-back-bar` (place.html, categories.html, search.html, favorites.html)
  const backBar = document.querySelector('.page-back-bar');
  if (backBar) {
    // If a global wrap exists elsewhere on page, remove it
    const oldWrap = document.getElementById('global-market-widgets-wrap');
    if (oldWrap) oldWrap.remove();

    if (!backBar.querySelector('.market-widgets-bar')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = renderMarketWidgetsHTML(currentMarketData);
      const bar = wrap.firstElementChild;
      backBar.appendChild(bar);
      bindMarketWidgetsEvents(bar);
    }
    return true;
  }

  // 2. Check if page has dedicated slot `#home-market-widgets-slot` or `#market-widgets-slot`
  const customSlot = document.getElementById('home-market-widgets-slot') || document.getElementById('market-widgets-slot');
  if (customSlot) {
    if (!customSlot.querySelector('.market-widgets-bar')) {
      customSlot.innerHTML = renderMarketWidgetsHTML(currentMarketData);
      const bar = customSlot.querySelector('.market-widgets-bar');
      if (bar) bindMarketWidgetsEvents(bar);
    }
    return true;
  }

  // 3. Mount for Home Page (index.html) ONLY — never on detail pages
  const isHomePage = (
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname.endsWith('/en/') ||
    window.location.pathname.endsWith('/en/index.html') ||
    !!document.getElementById('hero-section-static') ||
    !!document.getElementById('home-verified-cards-grid')
  );

  const header = document.getElementById('site-header');
  if (isHomePage && header && !document.getElementById('global-market-widgets-wrap')) {
    const wrap = document.createElement('div');
    wrap.id = 'global-market-widgets-wrap';
    wrap.className = 'home-market-widgets-wrap';
    wrap.innerHTML = renderMarketWidgetsHTML(currentMarketData);
    
    const main = document.querySelector('main') || document.body;
    if (header.nextSibling) {
      header.parentNode.insertBefore(wrap, header.nextSibling);
    } else {
      main.insertBefore(wrap, main.firstChild);
    }
    const bar = wrap.querySelector('.market-widgets-bar');
    if (bar) bindMarketWidgetsEvents(bar);
    return true;
  }

  return false;
}

export function mountMarketWidgets() {
  if (typeof document === 'undefined') return;

  // Load CSS dynamically if not already in document
  if (!document.getElementById('market-widgets-css')) {
    const link = document.createElement('link');
    link.id = 'market-widgets-css';
    link.rel = 'stylesheet';
    link.href = '/src/css/components/market-widgets.css';
    document.head.appendChild(link);
  }

  tryMount();

  // Mutation observer to catch dynamically rendered page-back-bars
  if (!_observerActive && typeof MutationObserver !== 'undefined') {
    _observerActive = true;
    const observer = new MutationObserver(() => {
      const backBar = document.querySelector('.page-back-bar');
      if (backBar && !backBar.querySelector('.market-widgets-bar')) {
        const oldWrap = document.getElementById('global-market-widgets-wrap');
        if (oldWrap) oldWrap.remove();

        const wrap = document.createElement('div');
        wrap.innerHTML = renderMarketWidgetsHTML(currentMarketData);
        const bar = wrap.firstElementChild;
        backBar.appendChild(bar);
        bindMarketWidgetsEvents(bar);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Fetch latest data in background & update all mounted bars
  fetchLiveMarketIndicators().then(freshData => {
    if (!freshData) return;
    document.querySelectorAll('.market-widgets-bar').forEach(bar => {
      updateMarketWidgetsDOM(bar, freshData);
    });
  }).catch(() => {});
}
