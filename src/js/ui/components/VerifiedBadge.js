/**
 * Render sponsored / featured place badge
 */
export function renderSponsoredBadge() {
  return `
    <span class="badge-sponsored" title="هذا الشخص أو المحل دفع مقابل مادي لظهور هذا الإعلان هنا" aria-label="هذا الشخص أو المحل دفع مقابل مادي لظهور هذا الإعلان هنا">
      <span class="badge-sponsored__icon">📢</span>
      <span class="badge-sponsored__text">إعلان مدفوع</span>
    </span>
  `;
}

/**
 * Render verified badge HTML
 */
export function renderVerifiedBadge() {
  return `
    <span class="badge-verified" title="هذه الشخصية أو المحل موثوق بهم" aria-label="هذه الشخصية أو المحل موثوق بهم">
      <svg class="badge-verified__svg" viewBox="0 0 24 24" width="18" height="18" fill="#1DA1F2" aria-hidden="true">
        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6s-2.95.875-3.6 2.148c-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5s.875 2.95 2.148 3.6c-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148s2.95-.875 3.6-2.148c.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 4.2l-4.2-4.2 1.4-1.4 2.8 2.8 6.8-6.8 1.4 1.4-8.2 8.2z"/>
      </svg>
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

/**
 * Render Live Online Owner Badge (متصل الآن بالأخضر)
 */
export function renderOnlineBadge(isOnline = true) {
  if (!isOnline) return '';
  return `
    <span class="badge-online-pulse" title="صاحب المكان متصل الآن بالموقع ومتاح للرد والتواصل" aria-label="صاحب المكان متصل الآن">
      <span class="online-indicator-dot"></span>
      <span class="online-indicator-text">متصل الآن</span>
    </span>
  `;
}

