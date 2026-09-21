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
        <div class="payment-badge-3d" data-payment-id="${escapeHtml(method.id)}">
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
      </div>
    `;
  }).join('');

  const headingText = title || (isEn ? 'Accepted Payment Methods' : 'طرق الدفع المقبولة في هذا المكان');

  return `
    <section class="place-payment-section animate-fade-in" id="place-payment-methods-card">
      <div class="place-payment-header">
        <span class="place-payment-header__icon">💳</span>
        <h3 class="place-payment-header__title">${escapeHtml(headingText)}</h3>
        <span class="place-payment-header__badge">${isEn ? 'Available Methods' : 'وسائل الدفع المتاحة'}</span>
      </div>
      <div class="place-payment-badges-grid">
        ${badgesHtml}
      </div>
      <div class="place-payment-hint">
        <span>💡</span> ${isEn ? 'Hover or tap any payment logo to learn more' : 'مرر الماوس أو اضغط على أي شعار لمعرفة تفاصيل الدفع'}
      </div>
    </section>
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
