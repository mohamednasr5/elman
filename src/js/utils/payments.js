/**
 * src/js/utils/payments.js
 * Comprehensive Payment Methods Engine for Dalil Manzala & Matariya
 * Manages supported payment channels, 3D animated badges, tooltips, and GEO/SEO schemas.
 */

export const PAYMENT_METHODS = [
  {
    id: 'vodafone_cash',
    nameAr: 'فودافون كاش',
    nameEn: 'Vodafone Cash',
    question: 'هل المكان يقبل فودافون كاش؟',
    description: 'يقبل الدفع والتحويل عبر محفظة فودافون كاش (Vodafone Cash)',
    icon: '/assets/images/payments/vodafone-cash.png',
    color: '#E60000',
    schemaValue: 'Vodafone Cash'
  },
  {
    id: 'instapay',
    nameAr: 'انستاباي',
    nameEn: 'InstaPay',
    question: 'هل المكان يقبل انستاباي (InstaPay)؟',
    description: 'يقبل التحويل اللحظي المباشر عبر شبكة انستاباي (InstaPay)',
    icon: '/assets/images/payments/instapay.svg',
    color: '#46106E',
    schemaValue: 'InstaPay'
  },
  {
    id: 'visa',
    nameAr: 'فيزا وبطاقات بنكية',
    nameEn: 'Visa / Cards',
    question: 'هل المكان يقبل الدفع بالفيزا والبطاقات؟',
    description: 'يقبل الدفع الإلكتروني ببطاقات الفيزا، ماستركارد، وميزة (POS)',
    icon: '/assets/images/payments/visa.svg',
    color: '#0E2AA0',
    schemaValue: 'Credit Card'
  },
  {
    id: 'fawry',
    nameAr: 'فوري بلس',
    nameEn: 'Fawry Plus',
    question: 'هل المكان يقبل الدفع بفوري؟',
    description: 'يقبل الدفع وتأكيد المعاملات عبر ماكينات وخدمات فوري (Fawry)',
    icon: '/assets/images/payments/fawry.png',
    color: '#FFBF00',
    schemaValue: 'Fawry'
  },
  {
    id: 'bank_transfer',
    nameAr: 'تحويل بنكي',
    nameEn: 'Bank Transfer',
    question: 'هل المكان يقبل التحويل البنكي المباشر؟',
    description: 'يقبل استلام المدفوعات عبر التحويلات البنكية المباشرة (حسابات بنوك مصر)',
    icon: '/assets/images/payments/bank-transfer.png',
    color: '#1E293B',
    schemaValue: 'Bank Transfer'
  },
  {
    id: 'cash',
    nameAr: 'الدفع نقداً / عند الاستلام',
    nameEn: 'Cash / COD',
    question: 'هل المكان يقبل الدفع نقداً؟',
    description: 'يقبل الدفع نقداً عند الشراء في المكان أو عند الاستلام',
    icon: '/assets/images/payments/bank-transfer.png',
    color: '#10B981',
    schemaValue: 'Cash'
  },
  {
    id: 'apple_pay',
    nameAr: 'Apple Pay',
    nameEn: 'Apple Pay',
    question: 'هل المكان يقبل أبل باي (Apple Pay)؟',
    description: 'يقبل الدفع اللحظي الآمن عبر محفظة Apple Pay بميزة الدفع اللاتلامسي NFC',
    icon: '/assets/images/payments/visa.svg',
    color: '#000000',
    schemaValue: 'Apple Pay'
  },
  {
    id: 'google_pay',
    nameAr: 'Google Pay',
    nameEn: 'Google Pay',
    question: 'هل المكان يقبل جوجل باي (Google Pay)؟',
    description: 'يقبل الدفع السريع والآمن عبر محفظة Google Pay بالهواتف والبطاقات الذكية',
    icon: '/assets/images/payments/visa.svg',
    color: '#4285F4',
    schemaValue: 'Google Pay'
  }
];

export const PAYMENT_METHODS_MAP = Object.fromEntries(
  PAYMENT_METHODS.map(m => [m.id, m])
);

/**
 * Normalizes input payment methods from varied formats into clean array of IDs
 */
export function normalizePaymentMethods(input) {
  if (!input) return [];
  let list = [];
  if (Array.isArray(input)) {
    list = input;
  } else if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) list = parsed;
      else list = input.split(',').map(s => s.trim());
    } catch (_) {
      list = input.split(',').map(s => s.trim());
    }
  }
  return list
    .map(id => String(id).toLowerCase().replace(/[\s-]+/g, '_'))
    .filter(id => Boolean(PAYMENT_METHODS_MAP[id]));
}

/**
 * Renders unified 3D square badges for accepted payment methods with animated tooltips
 */
export function renderPaymentBadges(paymentMethods = [], options = {}) {
  const cleanList = normalizePaymentMethods(paymentMethods);
  if (!cleanList || cleanList.length === 0) return '';

  const { isEn = false, title = '' } = options;

  const badgesHtml = cleanList.map(id => {
    const method = PAYMENT_METHODS_MAP[id];
    if (!method) return '';
    const name = isEn ? method.nameEn : method.nameAr;
    const tooltipText = isEn 
      ? `Accepts ${method.nameEn}`
      : `يقبل الدفع بواسطة: ${method.nameAr}`;

    return `
      <div class="payment-badge-wrapper" tabindex="0" role="img" aria-label="${escapeHtml(tooltipText)}" data-payment-id="${escapeHtml(method.id)}">
        <div class="payment-badge-3d" data-payment-id="${escapeHtml(method.id)}" tabindex="0" role="button" aria-label="${escapeHtml(tooltipText)}">
          <span class="payment-badge-3d__icon">
            <img src="${escapeHtml(method.icon)}" alt="" width="42" height="42" loading="lazy" decoding="async" />
          </span>
          <span class="payment-badge-3d__name">${escapeHtml(name)}</span>
        </div>
        <div class="payment-badge-tooltip" role="tooltip">
          <span class="payment-badge-tooltip__title">${escapeHtml(name)}</span>
          <span class="payment-badge-tooltip__desc">${escapeHtml(method.description)}</span>
        </div>
      </div>
    `;
  }).join('');

  return badgesHtml;
}

/**
 * Renders self-contained SVG for each accepted payment pill matching the official wireframe
 */
export function renderPaymentPillSVG(methodId) {
  switch (methodId) {
    case 'google_pay':
      return `<svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Google Pay">
        <rect x="0.5" y="0.5" width="39" height="19" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
        <path d="M11.4 10.16c0-.34-.03-.67-.08-1H7v1.89h2.47c-.11.58-.43 1.07-.92 1.4v1.16h1.49c.87-.8 1.36-1.98 1.36-3.45z" fill="#4285F4"/>
        <path d="M7 14.6c1.24 0 2.29-.41 3.05-1.12l-1.49-1.16c-.41.28-.94.44-1.56.44-1.2 0-2.22-.81-2.58-1.9H2.89v1.2C3.66 13.56 5.2 14.6 7 14.6z" fill="#34A853"/>
        <path d="M4.42 10.86c-.1-.28-.15-.58-.15-.86s.05-.58.15-.86V7.94H2.89A4.77 4.77 0 002.4 10c0 .77.18 1.5.49 2.06l1.53-1.2z" fill="#FBBC05"/>
        <path d="M7 6.48c.68 0 1.28.23 1.76.69l1.32-1.32C9.28 5.11 8.23 4.6 7 4.6 5.2 4.6 3.66 5.64 2.89 7.94l1.53 1.2c.36-1.09 1.38-1.9 2.58-1.9z" fill="#EA4335"/>
        <path d="M14.5 6.5h2.2c.6 0 1.1.18 1.47.53.37.35.56.81.56 1.38 0 .58-.19 1.04-.56 1.39-.37.35-.87.52-1.47.52h-1.04V13h-1.16V6.5zm1.16 2.86h1.04c.3 0 .54-.08.7-.24.16-.16.24-.38.24-.65 0-.28-.08-.5-.24-.66-.16-.16-.4-.24-.7-.24h-1.04v1.79zm7.3 1.1c0 .48-.15.86-.45 1.14-.3.28-.7.42-1.2.42-.4 0-.74-.08-1.01-.25-.27-.17-.46-.42-.56-.75l1.01-.42c.1.22.25.35.45.42.1.04.22.06.34.06.22 0 .4-.06.52-.18.12-.12.18-.28.18-.47 0-.33-.2-.54-.6-.65l-.83-.22c-.41-.11-.73-.28-.95-.51-.22-.23-.33-.53-.33-.9 0-.44.15-.79.44-1.05.29-.26.68-.39 1.16-.39.38 0 .7.08.96.24.26.16.44.38.53.67l-1 .41c-.08-.18-.21-.29-.38-.34-.08-.03-.18-.04-.28-.04-.18 0-.33.05-.44.14-.11.09-.16.22-.16.37 0 .27.18.45.54.54l.82.22c.44.12.78.3.99.54.21.24.32.55.32.93zm4.5 1.54l-.42 1h-1.18l2.12-4.87h1.22l2.13 4.87h-1.24l-.43-1h-2.2zm1.88-.93l-.78-1.85-.78 1.85h1.56z" fill="#3c4043"/>
      </svg>`;
    case 'apple_pay':
      return `<svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Apple Pay">
        <rect x="0.5" y="0.5" width="39" height="19" rx="4" fill="#ffffff" stroke="#e2e8f0"/>
        <path d="M10.8 10.4c-.01-.98.8-1.46.84-1.48-.46-.66-1.17-.76-1.42-.77-.6-.06-1.18.35-1.49.35-.3 0-.78-.34-1.28-.33-.65.01-1.26.38-1.59.96-.68 1.18-.17 2.92.48 3.86.32.46.7.98 1.2.96.48-.02.66-.31 1.24-.31.57 0 .74.31 1.25.3.51-.01.84-.46 1.16-.92.36-.53.51-1.05.52-1.07-.01-.01-1-.38-1.01-1.55zM9.9 7.35c.26-.32.44-.76.39-1.2-.38.02-.83.25-1.1.57-.24.28-.45.72-.39 1.16.42.03.85-.21 1.1-.53z" fill="#000000"/>
        <path d="M14.5 6.2h2.2c.6 0 1.1.18 1.47.53.37.35.56.81.56 1.38 0 .58-.19 1.04-.56 1.39-.37.35-.87.52-1.47.52h-1.04V13h-1.16V6.2zm1.16 2.86h1.04c.3 0 .54-.08.7-.24.16-.16.24-.38.24-.65 0-.28-.08-.5-.24-.66-.16-.16-.4-.24-.7-.24h-1.04v1.79zm5.2 2.6c0-.52.2-.94.6-1.24.4-.3.94-.46 1.62-.46.42 0 .78.06 1.08.18v-.26c0-.32-.1-.58-.29-.75-.19-.18-.46-.27-.81-.27-.38 0-.72.08-1.01.25l-.36-.8c.43-.24.95-.36 1.55-.36.68 0 1.22.18 1.6.54.39.36.58.87.58 1.54V13h-1.06v-.66c-.32.48-.82.72-1.49.72-.56 0-1.02-.16-1.37-.47-.36-.32-.54-.74-.54-1.25zm3.3-.26v-.55c-.24-.1-.53-.15-.87-.15-.4 0-.7.08-.9.24-.2.16-.3.38-.3.65 0 .26.09.47.28.61.19.14.44.22.76.22.45 0 .78-.15 1-.46.03-.04.03-.07.03-.11zm4.7-2.78l1.32 3.86 1.28-3.86h1.24L29.6 15h-1.18l.84-2.12-1.84-4.22h1.26z" fill="#000000"/>
      </svg>`;
    case 'visa':
    case 'card':
    case 'cards':
    case 'credit_card':
      return `<svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa & Cards">
        <rect x="1" y="1" width="38" height="18" rx="3.5" fill="#1E293B" stroke="#334155"/>
        <rect x="4.5" y="6" width="6" height="4.5" rx="1" fill="#F59E0B"/>
        <line x1="4.5" y1="8.25" x2="10.5" y2="8.25" stroke="#B45309" stroke-width="0.5"/>
        <path d="M12.5 6.5A3.5 3.5 0 0 1 12.5 10" stroke="rgba(255,255,255,0.7)" stroke-width="0.8" fill="none"/>
        <path d="M14 5.5A5.5 5.5 0 0 1 14 11" stroke="rgba(255,255,255,0.7)" stroke-width="0.8" fill="none"/>
        <circle cx="28" cy="10" r="4.2" fill="#EF4444" fill-opacity="0.9"/>
        <circle cx="33" cy="10" r="4.2" fill="#F59E0B" fill-opacity="0.9"/>
      </svg>`;
    case 'cash':
      return `<svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cash & Wallet">
        <rect x="1" y="1" width="38" height="18" rx="3.5" fill="#10B981"/>
        <rect x="7" y="4.5" width="26" height="11" rx="2" fill="none" stroke="#ffffff" stroke-width="1.2"/>
        <circle cx="20" cy="10" r="2.5" fill="#ffffff"/>
        <circle cx="10" cy="10" r="1" fill="#ffffff"/>
        <circle cx="30" cy="10" r="1" fill="#ffffff"/>
      </svg>`;
    case 'instapay':
      return `<svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="InstaPay">
        <rect x="1" y="1" width="38" height="18" rx="3.5" fill="#46106E"/>
        <g transform="translate(6, 4) scale(0.24)">
          <rect x="5" y="2" width="14" height="7" rx="3.5" fill="#FFFFFF"/>
          <rect x="5" y="13" width="14" height="26" rx="3.5" fill="#FFFFFF"/>
          <path d="M26 13 L36 26 L26 39 L31 39 L41 26 L31 13 Z" fill="#FF5733"/>
          <path d="M38 13 L48 26 L38 39 L43 39 L53 26 L43 13 Z" fill="#FFA033"/>
          <rect x="53" y="13" width="15" height="26" rx="3.5" fill="#FFFFFF"/>
        </g>
        <text x="27" y="13.5" font-family="system-ui, sans-serif" font-size="7.5" font-weight="900" fill="#FFFFFF">PAY</text>
      </svg>`;
    case 'vodafone_cash':
      return `<svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Vodafone Cash">
        <rect x="1" y="1" width="38" height="18" rx="3.5" fill="#E60000"/>
        <circle cx="12" cy="10" r="4.5" fill="#ffffff"/>
        <path d="M12 7.8c-1.2 0-2.2 1-2.2 2.2s1 2.2 2.2 2.2c.6 0 1.2-.25 1.6-.65l-.65-.65c-.24.24-.58.4-.95.4-.75 0-1.35-.6-1.35-1.35s.6-1.35 1.35-1.35c.37 0 .71.16.95.4l.65-.65c-.4-.4-1-.65-1.6-.65z" fill="#E60000"/>
        <text x="20" y="13.5" font-family="system-ui, sans-serif" font-size="7.5" font-weight="900" fill="#FFFFFF">CASH</text>
      </svg>`;
    default:
      return `<svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="38" height="18" rx="3.5" fill="#3B82F6"/><text x="20" y="13.5" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">PAY</text></svg>`;
  }
}

/**
 * Resolves place payment methods fallbacking gracefully to standard default set matching user mockup
 */
export function resolvePlacePaymentMethods(placeOrMethods) {
  let raw = [];
  if (Array.isArray(placeOrMethods)) {
    raw = placeOrMethods;
  } else if (placeOrMethods && typeof placeOrMethods === 'object') {
    raw = placeOrMethods.paymentMethods || placeOrMethods.payment_methods || placeOrMethods.payments || [];
  }
  let normalized = normalizePaymentMethods(raw);
  if (!normalized || normalized.length === 0) {
    // Default 4 standard channels shown in user wireframe:
    // Cash / Green Wallet, Card / POS, Apple Pay, Google Pay
    normalized = ['cash', 'visa', 'apple_pay', 'google_pay'];
  }
  return normalized;
}

/**
 * Renders the prominent horizontal strip under place category & address in Place Header Card
 */
export function renderPlacePaymentStripHTML(placeOrMethods, options = {}) {
  const isEn = Boolean(options.isEn);
  const list = resolvePlacePaymentMethods(placeOrMethods);
  if (!list || list.length === 0) return '';

  const pills = list.map(id => {
    const m = PAYMENT_METHODS_MAP[id] || { nameAr: id, nameEn: id };
    const name = isEn ? (m.nameEn || m.nameAr) : m.nameAr;
    const svg = renderPaymentPillSVG(id);
    return `
      <span class="payment-pill" role="img" aria-label="${escapeHtml(name)}" title="${escapeHtml(name)}">
        ${svg}
        <span class="pill-tooltip">${escapeHtml(name)}</span>
      </span>
    `;
  }).join('');

  return `
    <div class="place-payment-strip" aria-label="${isEn ? 'Accepted Payment Methods' : 'وسائل الدفع المقبولة'}">
      <span class="place-payment-strip__label">
        <span>${isEn ? 'This business accepts:' : 'هذا النشاط يقبل المدفوعات:'}</span>
      </span>
      <div class="place-payment-strip__pills">
        ${pills}
      </div>
    </div>
  `;
}

/**
 * Renders compact payment badges row for PlaceCard.js
 */
export function renderPlaceCardPaymentStripHTML(placeOrMethods, options = {}) {
  const isEn = Boolean(options.isEn);
  const list = resolvePlacePaymentMethods(placeOrMethods);
  if (!list || list.length === 0) return '';

  const pills = list.map(id => {
    const m = PAYMENT_METHODS_MAP[id] || { nameAr: id, nameEn: id };
    const name = isEn ? (m.nameEn || m.nameAr) : m.nameAr;
    const svg = renderPaymentPillSVG(id);
    return `
      <span class="payment-pill" role="img" aria-label="${escapeHtml(name)}" title="${escapeHtml(name)}">
        ${svg}
        <span class="pill-tooltip">${escapeHtml(name)}</span>
      </span>
    `;
  }).join('');

  return `
    <div class="place-card__payments" aria-label="${isEn ? 'Accepted Payment Methods' : 'وسائل الدفع'}">
      <span class="place-card__payments-label">${isEn ? 'Accepts:' : 'يقبل المدفوعات:'}</span>
      <div class="place-card__payments-pills">
        ${pills}
      </div>
    </div>
  `;
}

/**
 * Renders interactive selection cards / toggles in Place Creation & Edit forms
 */
export function renderPaymentSelectForm(selectedMethods = [], prefix = 'p-pay') {
  const currentList = normalizePaymentMethods(selectedMethods);
  const currentSet = new Set(currentList);

  return `
    <div class="form-section payment-form-section animate-fade-in" id="${prefix}-section">
      <div class="payment-form-section__header">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <h3 class="payment-form-title">
            <span class="payment-title-icon">💳</span> طرق ووسائل الدفع والتحويل المقبولة
          </h3>
          <span class="payment-form-badge">
            تظهر بشعارات 3D رسمية للزوار
          </span>
        </div>
        <p class="payment-form-subtitle">
          حدد هل يقبل المكان كل وسيلة من الوسائل التالية (فودافون كاش، انستاباي، فيزا، فوري، تحويل بنكي) ليسهل على العملاء التعامل معك:
        </p>
      </div>

      <div class="payment-options-grid">
        ${PAYMENT_METHODS.map(m => {
          const isChecked = currentSet.has(m.id);
          return `
            <div 
              class="payment-option-card ${isChecked ? 'is-selected' : ''}" 
              id="${prefix}-card-${m.id}"
              data-method-id="${m.id}" 
              data-prefix="${prefix}"
              role="button" 
              tabindex="0"
              aria-pressed="${isChecked ? 'true' : 'false'}"
            >
              <div class="payment-option-top">
                <div class="payment-option-logo-box">
                  <img src="${m.icon}" alt="${escapeHtml(m.nameAr)}" width="44" height="44" loading="lazy" />
                </div>
                <div class="payment-option-status-group">
                  <span class="payment-status-badge ${isChecked ? 'is-active' : ''}" id="${prefix}-status-${m.id}">
                    ${isChecked ? '✓ يقبل الدفع' : '✕ لا يقبل'}
                  </span>
                  <label class="payment-switch" onclick="event.stopPropagation()">
                    <input 
                      type="checkbox" 
                      id="${prefix}-${m.id}" 
                      class="payment-method-checkbox ${prefix}-checkbox" 
                      value="${m.id}" 
                      ${isChecked ? 'checked' : ''} 
                    />
                    <span class="payment-switch-slider"></span>
                  </label>
                </div>
              </div>

              <div class="payment-option-body">
                <div class="payment-option-question">${escapeHtml(m.question)}</div>
                <div class="payment-option-sub">${escapeHtml(m.nameAr)} • ${escapeHtml(m.nameEn)}</div>
                <div class="payment-option-desc">${escapeHtml(m.description)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Helper to collect selected payment method IDs from form checkboxes
 */
export function getSelectedPaymentMethods(prefix = 'p-pay') {
  if (typeof document === 'undefined') return [];
  const checked = document.querySelectorAll(`.${prefix}-checkbox:checked`);
  const results = [];
  checked.forEach(cb => {
    if (cb.value && PAYMENT_METHODS_MAP[cb.value]) {
      results.push(cb.value);
    }
  });
  return results;
}

/**
 * Initializes toggle click animations and dynamic active class toggles on form cards
 */
export function initPaymentFormEvents(prefix = 'p-pay') {
  if (typeof document === 'undefined') return;
  const cards = document.querySelectorAll(`[id^="${prefix}-card-"]`);
  cards.forEach(card => {
    const methodId = card.dataset.methodId;
    const cb = document.getElementById(`${prefix}-${methodId}`);
    const statusBadge = document.getElementById(`${prefix}-status-${methodId}`);
    
    if (!cb) return;

    const updateState = (checked) => {
      cb.checked = checked;
      if (checked) {
        card.classList.add('is-selected');
        card.setAttribute('aria-pressed', 'true');
        if (statusBadge) {
          statusBadge.textContent = '✓ يقبل الدفع';
          statusBadge.classList.add('is-active');
        }
      } else {
        card.classList.remove('is-selected');
        card.setAttribute('aria-pressed', 'false');
        if (statusBadge) {
          statusBadge.textContent = '✕ لا يقبل';
          statusBadge.classList.remove('is-active');
        }
      }
    };

    // Card click toggles checkbox
    card.addEventListener('click', (e) => {
      if (e.target.closest('.payment-switch')) return;
      e.preventDefault();
      updateState(!cb.checked);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Keyboard support: Enter / Space toggles
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        updateState(!cb.checked);
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Direct checkbox change
    cb.addEventListener('change', () => {
      updateState(cb.checked);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
