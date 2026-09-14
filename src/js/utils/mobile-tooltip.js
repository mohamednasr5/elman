/**
 * mobile-tooltip.js
 * Mobile Touch Tooltip Engine strictly for:
 * 1. إعلان ممول / إعلان مدفوع
 * 2. موثق
 * 3. رتبة المستخدم
 */

const BADGE_DESCRIPTIONS = {
  'verified': {
    title: 'حساب مشهور تم التأكد منه وموثق رسمي',
    desc: 'حساب مشهور تم التأكد منه وموثق رسمي',
    icon: '✓'
  },
  'sponsored': {
    title: '⭐ نشاط تجاري مميز وإعلان ممول',
    desc: 'هذا النشاط يظهر في قمة نتائج البحث والأقسام الرئيسية لتسهيل وصول العملاء إليه وتقديم أفضل العروض.',
    icon: '⭐'
  },
  'rank': {
    title: '🎖️ رتبة المستخدم ومستوى المساهمة',
    desc: 'رتبة شرفية تُمنح للمستخدم بناءً على عدد مشاركاته، تقييماته للأماكن، ونقاط ولائه في الدليل.',
    icon: '🎖️'
  }
};

let _tooltipContainer = null;
let _activeTimeout = null;

export function initUniversalMobileTouchTooltips() {
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (e) => {
    if (
      e.target.closest('.header-notif-btn') ||
      e.target.closest('#header-notifs-badge') ||
      e.target.closest('#usr-btn') ||
      e.target.closest('#usr-dd') ||
      e.target.closest('a[href*="notifications"]')
    ) {
      dismissActiveTooltip();
      return;
    }

    const badgeEl = e.target.closest(
      '.badge-verified, .badge-sponsored, .badge-user-rank, .user-rank-badge, .loyalty-rank-badge, [data-badge="verified"], [data-badge="sponsored"], [data-badge="rank"]'
    );

    if (!badgeEl) {
      dismissActiveTooltip();
      return;
    }

    const text = (badgeEl.textContent || '').trim();
    let info = null;

    if (badgeEl.classList.contains('badge-verified') || text.includes('موثق')) {
      info = BADGE_DESCRIPTIONS.verified;
    } else if (badgeEl.classList.contains('badge-sponsored') || text.includes('إعلان') || text.includes('ممول') || text.includes('مدفوع')) {
      info = BADGE_DESCRIPTIONS.sponsored;
    } else if (
      badgeEl.classList.contains('badge-user-rank') ||
      badgeEl.classList.contains('user-rank-badge') ||
      text.includes('مستكشف') ||
      text.includes('سفير') ||
      text.includes('عمدة') ||
      text.includes('رائد') ||
      text.includes('رتبة') ||
      text.includes('مدير')
    ) {
      info = BADGE_DESCRIPTIONS.rank;
    }

    if (!info) {
      dismissActiveTooltip();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch (_) {}
    }

    showTouchTooltip(badgeEl, info);
  }, { capture: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dismissActiveTooltip();
  });
}

function showTouchTooltip(anchor, info) {
  dismissActiveTooltip();

  _tooltipContainer = document.createElement('div');
  _tooltipContainer.className = 'mobile-touch-tooltip mobile-touch-tooltip--verified-sync';
  _tooltipContainer.setAttribute('role', 'status');
  _tooltipContainer.innerHTML = `
    <div class="mobile-touch-tooltip__icon" aria-hidden="true">${info.icon}</div>
    <div class="mobile-touch-tooltip__content">
      <div class="mobile-touch-tooltip__title">${escapeHtml(info.title)}</div>
      <div class="mobile-touch-tooltip__desc">${escapeHtml(info.desc)}</div>
    </div>
    <button type="button" class="mobile-touch-tooltip__close" aria-label="إغلاق">×</button>
  `;

  document.body.appendChild(_tooltipContainer);
  _tooltipContainer.querySelector('.mobile-touch-tooltip__close')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    dismissActiveTooltip();
  });

  requestAnimationFrame(() => _tooltipContainer?.classList.add('is-visible'));

  clearTimeout(_activeTimeout);
  _activeTimeout = setTimeout(() => dismissActiveTooltip(), 4200);
}

function dismissActiveTooltip() {
  clearTimeout(_activeTimeout);
  _activeTimeout = null;
  if (!_tooltipContainer) return;
  _tooltipContainer.classList.remove('is-visible');
  const el = _tooltipContainer;
  _tooltipContainer = null;
  setTimeout(() => el.remove(), 180);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}
