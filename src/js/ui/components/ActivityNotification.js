/**
 * ActivityNotification.js — Real Local Activity / Social Proof Floating Card
 * دليل المنزلة والمطرية الرقمي
 *
 * Controlled Frequency & Smart Suppression Rules:
 * 1. Shows ONLY ONCE per day per visitor (مرة واحدة فقط في اليوم للزائر على الكمبيوتر والموبايل).
 * 2. Absolutely NEVER shown on the wallet / buy coins page (/wallet.html or #packages).
 * 3. Absolutely NEVER shown while the Smart Voice Assistant modal is open.
 * 4. Dismisses immediately if the user opens the Voice Assistant or navigates to the wallet page.
 * 5. 100% REAL statistics from Turso database (visits, phone calls, WhatsApp contacts).
 */

import { WORKER_URL } from '../../core/firebase.js';

const CONFIG = {
  INITIAL_DELAY: 4500,    // 4.5s after entering the page before the single notification appears
  DISPLAY_DURATION: 5000, // 5s visible on screen before smooth auto-dismissal
  STORAGE_KEY: 'dalil_activity_notification_history',
  DAILY_SHOWN_KEY: 'dalil_activity_notif_daily_shown',
  DAILY_TIMESTAMP_KEY: 'dalil_activity_notif_last_ts'
};

let _timerId = null;
let _dismissTimerId = null;
let _activeCardEl = null;
let _isInitialized = false;
let _hasShownOnCurrentPage = false;
let _currentPageKey = (typeof window !== 'undefined') ? (window.location.pathname + window.location.search) : '';

export function isWalletOrCoinsPage() {
  if (typeof window === 'undefined') return true;
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  return (
    path.includes('wallet') ||
    path.includes('coins') ||
    hash.includes('wallet') ||
    hash.includes('packages') ||
    search.includes('wallet') ||
    search.includes('coins') ||
    Boolean(document.getElementById('wallet-container') || document.querySelector('.wallet-page-hero'))
  );
}

export function isVoiceAssistantOrModalOpen() {
  if (typeof document === 'undefined') return false;
  return (
    document.body.classList.contains('voice-modal-open') ||
    document.body.classList.contains('mobile-more-open') ||
    Boolean(document.getElementById('manzala-voice-modal')) ||
    Boolean(document.querySelector('.manzala-voice-modal-backdrop')) ||
    Boolean(document.querySelector('.mvm-backdrop')) ||
    Boolean(document.querySelector('.modal.open, .modal.active, .swal2-shown')) ||
    Boolean(window.__voiceAssistantActive)
  );
}

export function dismissActivityNotificationImmediately() {
  if (_activeCardEl) {
    dismissNotification(_activeCardEl);
  }
  if (_timerId) {
    clearTimeout(_timerId);
    _timerId = null;
  }
}

// Pool of candidate places for seamless cycling of diverse places ("مكان شكل")
let _placesPool = [];
let _poolIndex = 0;
let _lastShownPlaceId = null;
let _isFetching = false;

function ensureStyles() {
  if (document.getElementById('activity-notif-styles')) return;
  const link = document.createElement('link');
  link.id = 'activity-notif-styles';
  link.rel = 'stylesheet';
  link.href = '/src/css/components/activity-notification.css';
  document.head.appendChild(link);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hasShownToday() {
  if (typeof window === 'undefined') return true;
  try {
    const lastDate = localStorage.getItem(CONFIG.DAILY_SHOWN_KEY);
    const lastTs = parseInt(localStorage.getItem(CONFIG.DAILY_TIMESTAMP_KEY) || '0', 10);
    const today = getTodayString();

    if (lastDate === today) {
      return true;
    }
    // Also protect against midnight overlap: require at least 18 hours before showing again
    if (lastTs && (Date.now() - lastTs) < 18 * 60 * 60 * 1000) {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

export function markShownToday() {
  if (typeof window === 'undefined') return;
  try {
    const today = getTodayString();
    localStorage.setItem(CONFIG.DAILY_SHOWN_KEY, today);
    localStorage.setItem(CONFIG.DAILY_TIMESTAMP_KEY, String(Date.now()));
  } catch (_) {}
}

function getDailyHistory() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return { date: getTodayString(), placeIds: [] };
    const parsed = JSON.parse(raw);
    const today = getTodayString();
    if (parsed && parsed.date === today && Array.isArray(parsed.placeIds)) {
      return parsed;
    }
    const fresh = { date: today, placeIds: [] };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch (_) {
    return { date: getTodayString(), placeIds: [] };
  }
}

function markPlaceShown(placeId) {
  if (!placeId) return;
  try {
    const history = getDailyHistory();
    if (!history.placeIds.includes(placeId)) {
      history.placeIds.push(placeId);
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(history));
    }
  } catch (_) {}
}

async function fetchEligiblePlaces() {
  if (_isFetching) return [];
  _isFetching = true;
  try {
    const res = await fetch(`${WORKER_URL}/api/activity-notifications`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    if (!json.success || !Array.isArray(json.places)) return [];
    return json.places;
  } catch (_) {
    return [];
  } finally {
    _isFetching = false;
  }
}

/**
 * Get the next diverse place candidate ("مكان شكل")
 * Guarantees consecutive cards are never the same place.
 */
async function getNextCandidate() {
  if (!_placesPool.length) {
    const fresh = await fetchEligiblePlaces();
    if (fresh && fresh.length) {
      _placesPool = shuffleArray(fresh.slice());
      _poolIndex = 0;
    }
  }

  if (!_placesPool.length) return null;

  // Cycle through the pool to find a candidate DIFFERENT from the last shown place
  let attempts = 0;
  while (attempts < _placesPool.length) {
    if (_poolIndex >= _placesPool.length) {
      // Loop around and reshuffle for maximum diversity
      _poolIndex = 0;
      shuffleArray(_placesPool);
    }

    const candidate = _placesPool[_poolIndex];
    _poolIndex++;
    attempts++;

    if (candidate && candidate.place && candidate.place.id !== _lastShownPlaceId) {
      _lastShownPlaceId = candidate.place.id;
      return candidate;
    }
  }

  // Fallback if pool has only 1 place
  const fallback = _placesPool[0];
  if (fallback && fallback.place) {
    _lastShownPlaceId = fallback.place.id;
    return fallback;
  }

  return null;
}

function renderNotificationCard(item) {
  const { place, stats } = item;
  if (!place || !place.name) return null;

  const visitsCount = Number(stats?.visits || 0);
  const phoneCount = Number(stats?.phoneClicks || 0);
  const whatsappCount = Number(stats?.whatsappClicks || 0);

  // Safety check: Never render if total genuine activity is zero
  if (visitsCount + phoneCount + whatsappCount <= 0) return null;

  const card = document.createElement('aside');
  card.className = 'activity-notif-card';
  card.id = 'dalil-activity-notification';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-label', `نشاط حقيقي على الدليل: ${place.name}`);

  const logoSrc = place.logo || '/icons/icon-96x96.png';
  const placeUrl = place.url || `/place/${encodeURIComponent(place.slug || place.id)}/`;

  card.innerHTML = `
    <a href="${placeUrl}" class="activity-notif-inner" aria-label="عرض تفاصيل ${escapeHtml(place.name)}">
      <div class="activity-notif-logo-wrap">
        <img 
          src="${escapeHtml(logoSrc)}" 
          alt="${escapeHtml(place.name)}" 
          class="activity-notif-logo" 
          width="48" 
          height="48" 
          loading="eager" 
          decoding="async" 
          onerror="this.onerror=null;this.src='/icons/icon-96x96.png';"
        />
        <span class="activity-notif-live-dot" title="نشاط مباشر"></span>
      </div>
      <div class="activity-notif-body">
        <div class="activity-notif-kicker">
          <span class="activity-notif-kicker-text">نشاط على الدليل</span>
          <span class="activity-notif-time-badge">آخر 30 يوم</span>
        </div>
        <h4 class="activity-notif-title">${escapeHtml(place.name)}</h4>
        <div class="activity-notif-stats-row">
          ${visitsCount > 0 ? `
            <span class="activity-notif-stat" title="عدد الزيارات المسجلة">
              <span class="activity-stat-icon">👁️</span>
              <strong class="activity-stat-num">${visitsCount.toLocaleString('ar-EG')}</strong> زيارة
            </span>
          ` : ''}
          ${phoneCount > 0 ? `
            <span class="activity-notif-stat" title="عدد الاتصالات الهاتفية">
              <span class="activity-stat-icon">📞</span>
              <strong class="activity-stat-num">${phoneCount.toLocaleString('ar-EG')}</strong> اتصالًا
            </span>
          ` : ''}
          ${whatsappCount > 0 ? `
            <span class="activity-notif-stat" title="عدد محادثات واتساب">
              <span class="activity-stat-icon">💬</span>
              <strong class="activity-stat-num">${whatsappCount.toLocaleString('ar-EG')}</strong> واتساب
            </span>
          ` : ''}
        </div>
      </div>
      <div class="activity-notif-arrow" aria-hidden="true">↤</div>
    </a>
    <button type="button" class="activity-notif-close-btn" aria-label="إغلاق الإشعار" title="إغلاق">✕</button>
  `;

  // Close button handler (dismiss and prevent event bubbling to <a>)
  const closeBtn = card.querySelector('.activity-notif-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissNotification(card);
    });
  }

  // Hover & touch pause dismissal
  card.addEventListener('mouseenter', pauseDismissal);
  card.addEventListener('mouseleave', resumeDismissal);
  card.addEventListener('touchstart', pauseDismissal, { passive: true });
  card.addEventListener('touchend', resumeDismissal, { passive: true });

  return card;
}

function pauseDismissal() {
  if (_dismissTimerId) {
    clearTimeout(_dismissTimerId);
    _dismissTimerId = null;
  }
}

function resumeDismissal() {
  if (_activeCardEl && !_dismissTimerId) {
    _dismissTimerId = setTimeout(() => {
      dismissNotification(_activeCardEl);
    }, 3000);
  }
}

function dismissNotification(cardEl) {
  if (!cardEl) return;
  cardEl.classList.remove('activity-notif-card--visible');
  cardEl.classList.add('activity-notif-card--leaving');

  setTimeout(() => {
    try {
      cardEl.remove();
    } catch (_) {}
    if (_activeCardEl === cardEl) {
      _activeCardEl = null;
    }
  }, 380);

  if (_dismissTimerId) {
    clearTimeout(_dismissTimerId);
    _dismissTimerId = null;
  }
}

async function showNextActivityNotification() {
  // 1. Strictly suppressed on wallet / coins purchase page
  if (isWalletOrCoinsPage()) {
    dismissActivityNotificationImmediately();
    return;
  }

  // 2. Controlled frequency: Only ONE appearance per day per visitor (Desktop & Mobile)
  if (hasShownToday() || _hasShownOnCurrentPage) {
    return;
  }

  // 3. Strictly suppressed if Smart Voice Assistant or modal is open
  if (isVoiceAssistantOrModalOpen()) {
    // Retry in 4s in case user closes assistant, but ONLY if we haven't shown today
    if (!hasShownToday()) {
      scheduleNext(4000);
    }
    return;
  }

  // Dismiss any existing card smoothly first
  if (_activeCardEl) {
    dismissNotification(_activeCardEl);
  }

  // Pick next candidate - guaranteed "مكان شكل" (different place each time)
  const candidate = await getNextCandidate();
  if (!candidate) {
    return;
  }

  // Double check again before rendering (user might have clicked assistant or navigated while fetching)
  if (isWalletOrCoinsPage() || isVoiceAssistantOrModalOpen() || _hasShownOnCurrentPage || hasShownToday()) {
    return;
  }

  const cardEl = renderNotificationCard(candidate);
  if (!cardEl) {
    return;
  }

  markPlaceShown(candidate.place.id);
  markShownToday(); // MARKED AS SHOWN TODAY (ONCE PER DAY GUARANTEE)!
  _hasShownOnCurrentPage = true;

  // Append to container
  let container = document.getElementById('activity-notif-host');
  if (!container) {
    container = document.createElement('div');
    container.id = 'activity-notif-host';
    container.className = 'activity-notif-host';
    document.body.appendChild(container);
  }

  container.appendChild(cardEl);
  _activeCardEl = cardEl;

  // Trigger smooth enter transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cardEl.classList.add('activity-notif-card--visible');
    });
  });

  // Schedule automatic smooth exit
  _dismissTimerId = setTimeout(() => {
    dismissNotification(cardEl);
  }, CONFIG.DISPLAY_DURATION);

  // NOTICE: NO MORE scheduleNext()!
  // Once shown on the current page, it will NEVER show again on this page.
}

function scheduleNext(delayMs) {
  if (_timerId) clearTimeout(_timerId);
  _timerId = setTimeout(showNextActivityNotification, delayMs);
}

function setupObserverAndListeners() {
  if (typeof document === 'undefined') return;

  // Listen to popstate / history navigation
  window.addEventListener('popstate', () => {
    if (hasShownToday()) return;
    const newKey = window.location.pathname + window.location.search;
    if (newKey !== _currentPageKey) {
      _currentPageKey = newKey;
      _hasShownOnCurrentPage = false;
      if (isWalletOrCoinsPage()) {
        dismissActivityNotificationImmediately();
      } else if (!isVoiceAssistantOrModalOpen()) {
        scheduleNext(CONFIG.INITIAL_DELAY);
      }
    }
  });

  // Observe class mutations on document.body to instantly kill notification when voice assistant or wallet opens
  const observer = new MutationObserver(() => {
    if (isWalletOrCoinsPage() || isVoiceAssistantOrModalOpen()) {
      dismissActivityNotificationImmediately();
    }
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Initialize Activity Social Proof Notifications
 * Safely invoked on page boot
 */
export function initActivityNotifications() {
  if (isWalletOrCoinsPage()) {
    dismissActivityNotificationImmediately();
    return;
  }

  // Once-per-day rule (Desktop & Mobile): If already shown to visitor today, do nothing
  if (hasShownToday()) {
    return;
  }

  ensureStyles();

  if (!_isInitialized) {
    _isInitialized = true;
    setupObserverAndListeners();
  }

  // Check if this is a fresh page navigation
  const currentKey = (typeof window !== 'undefined') ? (window.location.pathname + window.location.search) : '';
  if (currentKey !== _currentPageKey) {
    _currentPageKey = currentKey;
    _hasShownOnCurrentPage = false;
  }

  if (!_hasShownOnCurrentPage && !isVoiceAssistantOrModalOpen()) {
    scheduleNext(CONFIG.INITIAL_DELAY);
  }
}
