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
    icon: '/assets/images/payments/vodafone-cash.svg',
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
    nameEn: 'Fawry',
    question: 'هل المكان يقبل الدفع بفوري؟',
    description: 'يقبل الدفع وتأكيد المعاملات عبر ماكينات وخدمات فوري (Fawry)',
    icon: '/assets/images/payments/fawry.svg',
    color: '#FFBF00',
    schemaValue: 'Fawry'
  },
  {
    id: 'bank_transfer',
    nameAr: 'تحويل بنكي',
    nameEn: 'Bank Transfer',
    question: 'هل المكان يقبل التحويل البنكي؟',
    description: 'يقبل استلام المدفوعات عبر التحويلات البنكية المباشرة (حسابات بنوك مصر)',
    icon: '/assets/images/payments/bank-transfer.svg',
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
      <div class="payment-badge-wrapper" tabindex="0" role="img" aria-label="${escapeHtml(tooltipText)}">
        <div class="payment-badge-3d" data-payment-id="${escapeHtml(method.id)}">
          <img src="${escapeHtml(method.icon)}" alt="${escapeHtml(name)}" width="48" height="48" loading="lazy" decoding="async" />
        </div>
        <div class="payment-badge-tooltip" role="tooltip">
          <span class="payment-badge-tooltip__title">${escapeHtml(name)}</span>
          <span class="payment-badge-tooltip__desc">${escapeHtml(method.description)}</span>
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
        <span class="place-payment-header__badge">${isEn ? `${cleanList.length} Verified Methods` : `${cleanList.length} طرق دفع معتمدة`}</span>
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
    <div class="form-section payment-form-section" id="${prefix}-section">
      <div class="form-section__header" style="margin-bottom:12px">
        <h3 style="font-size:15px;font-weight:800;color:var(--primary,#1B4F72);display:flex;align-items:center;gap:8px;margin:0">
          <span>💳</span> طرق الدفع الإلكتروني والتحويل المقبولة
        </h3>
        <p style="font-size:12px;color:var(--text-muted,#64748B);margin:4px 0 0">
          حدد طرق الدفع التي يستطيع زبائنك استخدامها لديك (ستظهر بشعارات 3D رسمية ومميزة بملف نشاطك):
        </p>
      </div>

      <div class="payment-options-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        ${PAYMENT_METHODS.map(m => {
          const isChecked = currentSet.has(m.id);
          return `
            <label class="payment-option-card ${isChecked ? 'is-selected' : ''}" for="${prefix}-${m.id}">
              <div class="payment-option-checkbox">
                <input 
                  type="checkbox" 
                  id="${prefix}-${m.id}" 
                  class="payment-method-checkbox ${prefix}-checkbox" 
                  value="${m.id}" 
                  ${isChecked ? 'checked' : ''} 
                />
                <span class="custom-check-box"></span>
              </div>
              <div class="payment-option-logo">
                <img src="${m.icon}" alt="${m.nameAr}" width="38" height="38" loading="lazy" />
              </div>
              <div class="payment-option-info">
                <span class="payment-option-name">${m.nameAr}</span>
                <span class="payment-option-desc">${m.nameEn}</span>
              </div>
            </label>
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
  const checkboxes = document.querySelectorAll(`.${prefix}-checkbox`);
  checkboxes.forEach(cb => {
    const card = cb.closest('.payment-option-card');
    cb.addEventListener('change', () => {
      if (card) {
        if (cb.checked) card.classList.add('is-selected');
        else card.classList.remove('is-selected');
      }
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
