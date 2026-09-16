/**
 * ActivityNotification.js — Real Local Activity / Social Proof Floating Card
 * دليل المنزلة والمطرية الرقمي
 *
 * Requirements:
 * 1. 100% REAL statistics from Turso database (visits, phone calls, WhatsApp contacts). No fake/random numbers.
 * 2. Strictly display each place AT MOST ONCE per calendar day per user/browser.
 * 3. Mobile safety: Never conflicts with or blocks bottom navigation (.bottom-nav) or floating action buttons.
 * 4. Clickable card navigating to the place detail page.
 */

import { WORKER_URL } from '../../core/firebase.js';

const CONFIG = {
  INITIAL_DELAY: 10000,   // 10s after page load before first notification
  DISPLAY_DURATION: 8500, // 8.5s visible
  SHOW_INTERVAL: 42000,   // 42s between notifications
  STORAGE_KEY: 'dalil_activity_notification_history'
};

let _timerId = null;
let _dismissTimerId = null;
let _activeCardEl = null;
let _isInitialized = false;

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
    // New day: reset history
    const fresh = { date: today, placeIds: [] };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch (_) {
    return { date: getTodayString(), placeIds: [] };
  }
}

function markPlaceShownToday(placeId) {
  if (!placeId) return;
  try {
    const history = getDailyHistory();
    if (!history.placeIds.includes(placeId)) {
      history.placeIds.push(placeId);
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(history));
    }
  } catch (_) {}
}

async function fetchEligiblePlaces(excludeIds = []) {
  try {
    const query = excludeIds.length ? `?excludeIds=${encodeURIComponent(excludeIds.join(','))}` : '';
    const res = await fetch(`${WORKER_URL}/api/activity-notifications${query}`, {
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
  }
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
    }, 3500);
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
  }, 400);

  if (_dismissTimerId) {
    clearTimeout(_dismissTimerId);
    _dismissTimerId = null;
  }
}

async function showNextActivityNotification() {
  // Do not show if user is actively in a full-screen modal or sheet
  if (
    document.body.classList.contains('mobile-more-open') ||
    document.body.classList.contains('voice-modal-open') ||
    document.querySelector('.modal.open, .modal.active')
  ) {
    scheduleNext(CONFIG.SHOW_INTERVAL / 2);
    return;
  }

  // Dismiss any existing card first
  if (_activeCardEl) {
    dismissNotification(_activeCardEl);
  }

  const history = getDailyHistory();
  const places = await fetchEligiblePlaces(history.placeIds);

  // Filter out any place already seen today
  const candidate = places.find(p => p && p.place && !history.placeIds.includes(p.place.id));
  if (!candidate) {
    // No new places for today: wait longer before retrying
    scheduleNext(CONFIG.SHOW_INTERVAL * 2);
    return;
  }

  const cardEl = renderNotificationCard(candidate);
  if (!cardEl) {
    scheduleNext(CONFIG.SHOW_INTERVAL);
    return;
  }

  // Record strictly in daily history
  markPlaceShownToday(candidate.place.id);

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

  // Schedule next notification cycle
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

  // Delay first appearance so it doesn't distract immediately on load
  scheduleNext(CONFIG.INITIAL_DELAY);
}
