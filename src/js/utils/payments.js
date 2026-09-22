/**
 * src/js/utils/payments.js
 * Comprehensive Payment Methods Engine for Dalil Manzala & Matariya
 * Manages supported payment channels, 3D animated badges, tooltips, and GEO/SEO schemas.
 */

export const PAYMENT_METHODS = [
  {
    id: 'visa',
    nameAr: 'فيزا',
    titleAr: 'فيزا',
    nameEn: 'Visa',
    icon: '/images/payment/visa.svg',
    fallbackIcon: '/assets/images/payments/visa.svg',
    question: 'هل المكان يقبل بطاقات فيزا؟',
    description: 'يقبل الدفع ببطاقات فيزا البنكية'
  },
  {
    id: 'mastercard',
    nameAr: 'ماستركارد',
    titleAr: 'ماستركارد',
    nameEn: 'Mastercard',
    icon: '/images/payment/mastercard.png',
    fallbackIcon: '/assets/images/payments/mastercard.svg',
    question: 'هل المكان يقبل ماستركارد؟',
    description: 'يقبل الدفع ببطاقات ماستركارد البنكية'
  },
  {
    id: 'meeza',
    nameAr: 'ميزة',
    titleAr: 'ميزة',
    nameEn: 'Meeza',
    icon: '/images/payment/meeza.png',
    fallbackIcon: '/assets/images/payments/meeza.png',
    question: 'هل المكان يقبل بطاقة ميزة؟',
    description: 'يقبل الدفع ببطاقات ميزة الوطنية المصرية'
  },
  {
    id: 'apple_pay',
    nameAr: 'أبل باي',
    titleAr: 'أبل باي',
    nameEn: 'Apple Pay',
    icon: '/images/payment/apple-pay.png',
    fallbackIcon: '/assets/images/payments/apple-pay.png',
    question: 'هل المكان يقبل أبل باي (Apple Pay)؟',
    description: 'يقبل الدفع اللحظي الآمن عبر محفظة Apple Pay'
  },
  {
    id: 'google_pay',
    nameAr: 'جوجل باي',
    titleAr: 'جوجل باي',
    nameEn: 'Google Pay',
    icon: '/images/payment/google-pay-mark.png',
    fallbackIcon: '/assets/images/payments/google-pay.png',
    question: 'هل المكان يقبل جوجل باي (Google Pay)؟',
    description: 'يقبل الدفع السريع والآمن عبر محفظة Google Pay'
  },
  {
    id: 'vodafone_cash',
    nameAr: 'فودافون',
    titleAr: 'فودافون كاش',
    nameEn: 'Vodafone Cash',
    icon: '/images/payment/vodafone-cash.svg',
    fallbackIcon: '/assets/images/payments/vodafone-cash.svg',
    question: 'هل المكان يقبل فودافون كاش؟',
    description: 'يقبل التحويل عبر محفظة فودافون كاش'
  },
  {
    id: 'etisalat_cash',
    nameAr: 'اتصالات',
    titleAr: 'اتصالات كاش',
    nameEn: 'Etisalat Cash',
    icon: '/images/payment/etisalat-cash.png',
    fallbackIcon: '/assets/images/payments/etisalat-cash.png',
    question: 'هل المكان يقبل اتصالات كاش؟',
    description: 'يقبل التحويل عبر محفظة اتصالات كاش'
  },
  {
    id: 'orange_money',
    nameAr: 'أورنج',
    titleAr: 'أورنج موني',
    nameEn: 'Orange Money',
    icon: '/images/payment/orange-money.png',
    fallbackIcon: '/assets/images/payments/orange-money.png',
    question: 'هل المكان يقبل أورنج موني؟',
    description: 'يقبل التحويل عبر محفظة أورنج موني'
  },
  {
    id: 'instapay',
    nameAr: 'انستا باي',
    titleAr: 'انستا باي',
    nameEn: 'InstaPay',
    icon: '/images/payment/instapay.svg',
    fallbackIcon: '/assets/images/payments/instapay.svg',
    question: 'هل المكان يقبل انستا باي (InstaPay)؟',
    description: 'يقبل التحويل اللحظي المباشر عبر شبكة انستا باي (InstaPay)'
  },
  {
    id: 'cod',
    nameAr: 'عند الاستلام',
    titleAr: 'الدفع عند الاستلام',
    nameEn: 'Cash on Delivery',
    icon: '/images/payment/cod.svg',
    fallbackIcon: '/assets/images/payments/cod.svg',
    question: 'هل المكان يقبل الدفع عند الاستلام؟',
    description: 'يقبل الدفع نقداً عند الاستلام أو بمقر النشاط'
  },
  {
    id: 'fawry',
    nameAr: 'فوري',
    titleAr: 'فوري بلس',
    nameEn: 'Fawry Plus',
    icon: '/images/payment/fawry.svg',
    fallbackIcon: '/assets/images/payments/fawry.svg',
    question: 'هل المكان يقبل الدفع بفوري؟',
    description: 'يقبل الدفع وتأكيد المعاملات عبر ماكينات وخدمات فوري'
  },
  {
    id: 'bank_transfer',
    nameAr: 'تحويل بنكي',
    titleAr: 'تحويل بنكي',
    nameEn: 'Bank Transfer',
    icon: '/images/payment/bank-transfer.svg',
    fallbackIcon: '/assets/images/payments/bank-transfer.svg',
    question: 'هل المكان يقبل التحويل البنكي المباشر؟',
    description: 'يقبل استلام المدفوعات عبر التحويلات البنكية المباشرة'
  }
];

export const PAYMENT_METHODS_MAP = Object.fromEntries(
  PAYMENT_METHODS.map(m => [m.id, m])
);

export const DEFAULT_PAYMENT_METHOD_IDS = [
  'visa',
  'mastercard',
  'meeza',
  'apple_pay',
  'google_pay',
  'vodafone_cash',
  'etisalat_cash',
  'orange_money',
  'instapay',
  'cod'
];

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

  const aliasMap = {
    cash: 'cod',
    card: 'visa',
    cards: 'visa',
    credit_card: 'visa',
    master_card: 'mastercard',
    orange: 'orange_money',
    orangemoney: 'orange_money',
    etisalat: 'etisalat_cash',
    etisalatcash: 'etisalat_cash',
    vodafone: 'vodafone_cash',
    vodafonecash: 'vodafone_cash',
    applepay: 'apple_pay',
    googlepay: 'google_pay',
    gpay: 'google_pay',
    insta_pay: 'instapay',
    insta: 'instapay'
  };

  return list
    .map(id => {
      const clean = String(id).toLowerCase().replace(/[\s-]+/g, '_');
      return aliasMap[clean] || clean;
    })
    .filter(id => Boolean(PAYMENT_METHODS_MAP[id]));
}

/**
 * Resolves place payment methods fallbacking gracefully to the 10 official channels
 */
export function resolvePlacePaymentMethods(placeOrMethods) {
  let raw = [];
  if (Array.isArray(placeOrMethods)) {
    raw = placeOrMethods;
  } else if (placeOrMethods && typeof placeOrMethods === 'object') {
    raw = placeOrMethods.paymentMethods || placeOrMethods.payment_methods || placeOrMethods.payments || placeOrMethods.stats?.paymentMethods || placeOrMethods.stats?.payment_methods || [];
  }
  const clean = normalizePaymentMethods(raw);
  return Array.isArray(clean) ? clean : [];
}

/**
 * Renders individual payment badge matching user's exact specification
 * Without any external links whatsoever.
 */
export function renderPaymentItemHTML(methodId, options = {}) {
  const method = PAYMENT_METHODS_MAP[methodId];
  if (!method) return '';
  const title = method.titleAr || method.nameAr;
  const label = method.nameAr;
  const icon = method.icon;
  const fallback = method.fallbackIcon || method.icon;

  return `<div class="flex h-8 items-center gap-1.5 overflow-hidden rounded-md border border-gray-200 bg-white px-2 dark:border-[#333] dark:bg-[#1c1c1c] payment-badge-pill" title="${escapeHtml(title)}"><img alt="${escapeHtml(title)}" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="h-4.5 w-4.5 shrink-0 object-contain" style="color:transparent" src="${escapeHtml(icon)}" onerror="if(this.dataset.tried!=='1'){this.dataset.tried='1';this.src='${escapeHtml(fallback)}';}"><span class="whitespace-nowrap text-[10px] font-semibold text-ink-2 dark:text-white/60">${escapeHtml(label)}</span></div>`;
}

/**
 * Renders the full payment methods strip for place detail page (place.html)
 */
export function renderPlacePaymentStripHTML(placeOrMethods, options = {}) {
  const isEn = Boolean(options.isEn);
  const list = resolvePlacePaymentMethods(placeOrMethods);
  if (!list || !Array.isArray(list) || list.length === 0) return '';

  const badgesHtml = list.map(id => renderPaymentItemHTML(id, options)).filter(Boolean).join('');
  if (!badgesHtml || !badgesHtml.trim()) return '';

  return `
    <div class="place-payment-methods-wrapper" style="margin:10px 0 8px 0" aria-label="${isEn ? 'Accepted Payment Methods' : 'وسائل الدفع المقبولة'}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:12.5px;font-weight:800;color:var(--text-secondary,#475569)">
          ${isEn ? 'This business accepts:' : 'هذا النشاط يقبل المدفوعات:'}
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 payment-methods-badges-list">
        ${badgesHtml}
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
  if (!list || !Array.isArray(list) || list.length === 0) return '';

  const badgesHtml = list.map(id => renderPaymentItemHTML(id, options)).filter(Boolean).join('');
  if (!badgesHtml || !badgesHtml.trim()) return '';

  return `
    <div class="place-card__payments-strip" aria-label="${isEn ? 'Accepted Payment Methods' : 'وسائل الدفع المقبولة'}">
      <div class="flex flex-wrap items-center gap-1.5 payment-methods-badges-list">
        ${badgesHtml}
      </div>
    </div>
  `;
}

/**
 * Renders unified 3D square badges (backward compatibility)
 */
export function renderPaymentBadges(paymentMethods = [], options = {}) {
  const cleanList = normalizePaymentMethods(paymentMethods);
  if (!cleanList || cleanList.length === 0) return '';
  return renderPlacePaymentStripHTML(cleanList, options);
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
