/**
 * mobile-tooltip.js
 * Mobile Touch Tooltip Engine strictly for:
 * 1. إعلان ممول / إعلان مدفوع
 * 2. موثق
 * 3. رتبة المستخدم
 */

const BADGE_DESCRIPTIONS = {
  'verified': {
    title: '👑 نشاط موثق رسمياً بالعلامة الزرقاء',
    desc: 'تم التحقق من هوية هذا النشاط التجاري ومقره الفعلي لضمان أعلى مستويات الثقة والمصداقية لجميع أهالي المنزلة والمطرية.',
    icon: '👑'
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
    // Exclude notification bell, profile button, dropdowns, navigation links
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

    // Strictly match ONLY 1. Verified, 2. Sponsored, 3. User Rank
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

    // Intercept click only for these 3 badges to show explanation
    e.preventDefault();
    e.stopPropagation();

    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch (_) {}
    }

    showTouchTooltip(badgeEl, info);
  }, { capture: true });

  window.addEventListener('scroll', dismissActiveTooltip, { passive: true });
}

function showTouchTooltip(targetEl, { title, desc, icon }) {
  dismissActiveTooltip();

  _tooltipContainer = document.createElement('div');
  _tooltipContainer.className = 'mobile-touch-tooltip-bubble';
  _tooltipContainer.innerHTML = `
    <div class="mobile-tooltip-card">
      <div class="mobile-tooltip-header">
        <span class="mobile-tooltip-icon">${icon}</span>
        <strong class="mobile-tooltip-title">${title}</strong>
        <button type="button" class="mobile-tooltip-close" aria-label="إغلاق">✕</button>
      </div>
      ${desc ? `<div class="mobile-tooltip-body">${desc}</div>` : ''}
    </div>
  `;

  document.body.appendChild(_tooltipContainer);

  const isMobile = window.innerWidth <= 640;
  if (isMobile) {
    _tooltipContainer.classList.add('mobile-mode-bottom');
  } else {
    _tooltipContainer.classList.add('desktop-mode-floating');
    const rect = targetEl.getBoundingClientRect();
    const top = rect.top + window.scrollY - 10;
    const left = rect.left + window.scrollX + (rect.width / 2);
    _tooltipContainer.style.top = `${top}px`;
    _tooltipContainer.style.left = `${left}px`;
  }

  requestAnimationFrame(() => {
    _tooltipContainer?.classList.add('visible');
  });

  _tooltipContainer.querySelector('.mobile-tooltip-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissActiveTooltip();
  });

  _activeTimeout = setTimeout(() => {
    dismissActiveTooltip();
  }, 4000);
}

export function dismissActiveTooltip() {
  if (_activeTimeout) {
    clearTimeout(_activeTimeout);
    _activeTimeout = null;
  }
  if (_tooltipContainer) {
    _tooltipContainer.classList.remove('visible');
    const el = _tooltipContainer;
    _tooltipContainer = null;
    setTimeout(() => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 250);
  }
}
