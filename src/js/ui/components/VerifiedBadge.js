/**
 * المنزلة وناسها — Verified Badge Component
 */

/**
 * Render verified badge HTML
 */
export function renderVerifiedBadge() {
  return `
    <span class="badge-verified" title="مكان موثق من إدارة المنزلة وناسها">
      <span class="badge-verified__icon" aria-hidden="true">✓</span>
      <span class="badge-verified__text">موثق</span>
    </span>
  `;
}

/**
 * Render pending verification badge
 */
export function renderPendingBadge() {
  return `
    <span class="badge-pending" title="طلب التوثيق قيد المراجعة">
      <span aria-hidden="true">⏳</span>
      قيد المراجعة
    </span>
  `;
}

/**
 * Render status badge
 */
export function renderStatusBadge(status) {
  const map = {
    published:  { text: 'منشور',   cls: 'badge--published' },
    draft:      { text: 'مسودة',   cls: 'badge--draft' },
    pending:    { text: 'قيد المراجعة', cls: 'badge--pending' },
    suspended:  { text: 'موقوف',   cls: 'badge--suspended' },
    rejected:   { text: 'مرفوض',   cls: 'badge--rejected' },
  };
  const item = map[status] || { text: status, cls: '' };
  return `<span class="badge ${item.cls}">${item.text}</span>`;
}

/**
 * Render delivery type badge
 */
export function renderDeliveryBadge(type) {
  const map = {
    motorcycle: { text: 'موتوسيكل', icon: '🏍️' },
    tuktuk:     { text: 'توكتوك',   icon: '🛺' },
    car:        { text: 'سيارة',    icon: '🚗' }
  };
  const item = map[type];
  if (!item) return '';
  return `<span class="badge-delivery">${item.icon} ${item.text}</span>`;
}
