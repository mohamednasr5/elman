/**
 * ActivityNotification.js — Real Local Activity / Social Proof Floating Card
 * دليل المنزلة والمطرية الرقمي
 *
 * Requirements:
 * 1. 100% REAL statistics from Turso database (visits, phone calls, WhatsApp contacts). No fake/random numbers.
 * 2. Mobile safety: Raised above bottom navigation and mobile action pills (z-index 12080).
 * 3. Rotates every 10 seconds with a DIFFERENT place each time ("مكان شكل").
 * 4. Clickable card navigating to the place detail page.
 */

import { WORKER_URL } from '../../core/firebase.js';

const CONFIG = {
  INITIAL_DELAY: 3000,    // 3s after page load before first notification
  DISPLAY_DURATION: 5500, // 5.5s visible on screen
  SHOW_INTERVAL: 10000,   // 10s repeat cycle between notifications
  STORAGE_KEY: 'dalil_activity_notification_history'
};

let _timerId = null;
let _dismissTimerId = null;
let _activeCardEl = null;
let _isInitialized = false;

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
  const placeUrl = place.url || `/place.html?id=${encodeURIComponent(place.id)}`;

  card.innerHTML = `
    <a href="${placeUrl}" class="activity-notif-inner" aria-label="عرض تفاصيل ${escapeHtml(place.name)}">
      <div class="activity-notif-logo-wrap">
        <img 
          src="${escapeHtml(logoSrc)}" 
          alt="${escapeHtml(place.name)}" 
          class="activity-notif-logo" 
          width="48" 
          height="48" 
          loading="lazy" 
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
  // Do not show if user is actively in a full-screen modal, menu, or sheet
  if (
    document.body.classList.contains('mobile-more-open') ||
    document.body.classList.contains('voice-modal-open') ||
    document.querySelector('.modal.open, .modal.active, .manzala-voice-modal-backdrop')
  ) {
    scheduleNext(CONFIG.SHOW_INTERVAL / 2);
    return;
  }

  // Dismiss any existing card smoothly first
  if (_activeCardEl) {
    dismissNotification(_activeCardEl);
  }

  // Pick next candidate - guaranteed "مكان شكل" (different place each time)
  const candidate = await getNextCandidate();
  if (!candidate) {
    scheduleNext(CONFIG.SHOW_INTERVAL);
    return;
  }

  const cardEl = renderNotificationCard(candidate);
  if (!cardEl) {
    scheduleNext(CONFIG.SHOW_INTERVAL);
    return;
  }

  markPlaceShown(candidate.place.id);

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

  // Schedule next notification cycle (every 10s repeats with a different place)
  scheduleNext(CONFIG.SHOW_INTERVAL);
}

function scheduleNext(delayMs) {
  if (_timerId) clearTimeout(_timerId);
  _timerId = setTimeout(showNextActivityNotification, delayMs);
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
  if (_isInitialized) return;
  _isInitialized = true;

  ensureStyles();

  // Delay first appearance so it doesn't distract immediately on initial render
  scheduleNext(CONFIG.INITIAL_DELAY);
}
