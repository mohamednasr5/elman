/**
 * mobile-tooltip.js
 * Universal Mobile Touch Tooltip & Badge Explainer
 * Allows users on smartphones/tablets to tap any badge or label to see its explanation clearly.
 */

const BADGE_DESCRIPTIONS = {
  'موثق': {
    title: '👑 نشاط موثق رسمياً بالعلامة الزرقاء',
    desc: 'تم التحقق من هوية هذا النشاط التجاري ومقره الفعلي لضمان أعلى مستويات الثقة والمصداقية لجميع أهالي المنزلة والمطرية.',
    icon: '👑'
  },
  'إعلان مدفوع': {
    title: '⭐ نشاط تجاري مميز وإعلان مدفوع',
    desc: 'هذا النشاط يظهر في قمة نتائج البحث والأقسام الرئيسية لتسهيل وصول العملاء إليه وتقديم أفضل العروض.',
    icon: '⭐'
  },
  'قيد المراجعة': {
    title: '⏳ قيد المراجعة والتدقيق',
    desc: 'هذا الطلب أو التحديث يخضع حالياً لمراجعة وتدقيق إدارة المنصة للتأكد من صحة البيانات قبل نشره.',
    icon: '⏳'
  },
  'وظيفة شاغرة': {
    title: '💼 فرصة عمل متاحة حالياً',
    desc: 'إعلان عن طلب موظفين أو عمالة.. يمكنك النقر للتواصل المباشر مع صاحب العمل عبر الهاتف أو واتساب.',
    icon: '💼'
  },
  'باحث عن عمل': {
    title: '🧑‍💼 باحث عن فرصة عمل',
    desc: 'مواطن يعرض مهاراته وخبراته للالتحاق بفرصة عمل مناسبة داخل المنزلة أو المطرية أو المناطق المجاورة.',
    icon: '🧑‍💼'
  },
  'صراف آلي': {
    title: '🏧 ماكينة صراف آلي (ATM)',
    desc: 'ماكينة بنكية تتيح السحب النقدي الفوري والإيداع ومتابعة حالتها اللحظية في قسم يحدث الآن.',
    icon: '🏧'
  },
  'توصيل': {
    title: '🛵 متوفر خدمة التوصيل للمنازل (دليفري)',
    desc: 'يقدم هذا المكان خدمة التوصيل السريع للطلبات إلى المنازل في المنزلة والمطرية والقرى التابعة.',
    icon: '🛵'
  }
};

let _tooltipContainer = null;
let _activeTimeout = null;

export function initUniversalMobileTouchTooltips() {
  if (typeof document === 'undefined') return;

  // Intercept touch & click on badges, labels, and elements with title/data-tooltip
  document.addEventListener('click', (e) => {
    // 1. Find matched badge or tooltip element
    const badgeEl = e.target.closest(
      '.badge, .badge-verified, .badge-sponsored, .badge-pending, .badge-job-pulse, .badge-job-seeker-pulse, .badge-live-pulse-vibrant, [data-tooltip], [title], [data-badge-info]'
    );

    if (!badgeEl) {
      dismissActiveTooltip();
      return;
    }

    // Determine explanation text
    const textContent = (badgeEl.textContent || '').trim();
    let title = badgeEl.getAttribute('title') || badgeEl.getAttribute('data-tooltip') || badgeEl.getAttribute('aria-label') || '';
    let desc = '';
    let icon = '💡';

    // Match dictionary
    for (const [key, info] of Object.entries(BADGE_DESCRIPTIONS)) {
      if (textContent.includes(key) || title.includes(key)) {
        title = info.title;
        desc = info.desc;
        icon = info.icon;
        break;
      }
    }

    if (!title && !desc) {
      if (textContent) {
        title = textContent;
        desc = 'تلميح توضيحي لحالة العنصر في دليل المنزلة والمطرية الرقمي.';
      } else {
        return;
      }
    }

    // Prevent navigation if badge is inside a link/card
    e.preventDefault();
    e.stopPropagation();

    // Haptic feedback on mobile
    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch (_) {}
    }

    showTouchTooltip(badgeEl, { title, desc, icon });
  }, { capture: true });

  // Dismiss on scroll or touch outside
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

  const rect = targetEl.getBoundingClientRect();
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    _tooltipContainer.classList.add('mobile-mode-bottom');
  } else {
    _tooltipContainer.classList.add('desktop-mode-floating');
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
