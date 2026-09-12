import { resolveDeliveryVehicle } from '../../utils/delivery-vehicle.js';
import { isEnglish } from '../../core/i18n.js';

/**
 * Render sponsored / featured place badge
 */
export function renderSponsoredBadge() {
  const isEn = isEnglish();
  const tip = isEn ? 'Sponsored Featured Listing' : 'هذا الشخص أو المحل دفع مقابل مادي لظهور هذا الإعلان هنا';
  const text = isEn ? 'Sponsored' : 'إعلان مدفوع';
  return `
    <span class="badge-sponsored" title="${tip}" aria-label="${tip}">
      <span class="badge-sponsored__icon">📢</span>
      <span class="badge-sponsored__text">${text}</span>
    </span>
  `;
}

/**
 * Render verified badge HTML
 */
export function renderVerifiedBadge() {
  const isEn = isEnglish();
  const tip = isEn ? 'Officially Verified Profile' : 'هذه الشخصية أو المكان عامة ومشهورة وموثقة';
  const text = isEn ? 'Verified' : 'موثق';
  return `
    <span class="badge-verified" title="${tip}" aria-label="${tip}">
      <svg class="badge-verified__svg" viewBox="0 0 24 24" width="18" height="18" fill="#1DA1F2" aria-hidden="true">
        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6s-2.95.875-3.6 2.148c-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5s.875 2.95 2.148 3.6c-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148s2.95-.875 3.6-2.148c.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 4.2l-4.2-4.2 1.4-1.4 2.8 2.8 6.8-6.8 1.4 1.4-8.2 8.2z"/>
      </svg>
      <span class="badge-verified__text">${text}</span>
    </span>
  `;
}

/**
 * Render pending verification badge
 */
export function renderPendingBadge() {
  const isEn = isEnglish();
  const tip = isEn ? 'Verification request is under review' : 'طلب التوثيق قيد المراجعة';
  const text = isEn ? 'Under Review' : 'قيد المراجعة';
  return `
    <span class="badge-pending" title="${tip}">
      <span aria-hidden="true">⏳</span>
      ${text}
    </span>
  `;
}

/**
 * Render status badge
 */
export function renderStatusBadge(status) {
  const isEn = isEnglish();
  const mapAr = {
    published:  { text: 'منشور',   cls: 'badge--published' },
    draft:      { text: 'مسودة',   cls: 'badge--draft' },
    pending:    { text: 'قيد المراجعة', cls: 'badge--pending' },
    suspended:  { text: 'موقوف',   cls: 'badge--suspended' },
    rejected:   { text: 'مرفوض',   cls: 'badge--rejected' },
  };
  const mapEn = {
    published:  { text: 'Published',   cls: 'badge--published' },
    draft:      { text: 'Draft',       cls: 'badge--draft' },
    pending:    { text: 'Under Review', cls: 'badge--pending' },
    suspended:  { text: 'Suspended',   cls: 'badge--suspended' },
    rejected:   { text: 'Rejected',    cls: 'badge--rejected' },
  };
  const map = isEn ? mapEn : mapAr;
  const item = map[status] || { text: status, cls: '' };
  return `<span class="badge ${item.cls}">${item.text}</span>`;
}

/**
 * Render delivery type badge
 */
export function renderDeliveryBadge(typeOrPlace) {
  if (!typeOrPlace) return '';
  const item = resolveDeliveryVehicle(typeOrPlace);
  if (!item) return '';
  const isEn = isEnglish();
  const label = isEn ? (item.labelEn || item.name || 'Express Delivery') : item.label;
  return `<span class="badge-delivery" style="border-color: ${item.borderColor || 'rgba(0,0,0,0.1)'}; background: ${item.bgColor || 'rgba(0,0,0,0.05)'}; color: ${item.color || 'inherit'};"><span aria-hidden="true">${item.icon}</span> ${label}</span>`;
}

/**
 * Render Live Online Owner Badge (متصل الآن بالأخضر)
 */
export function renderOnlineBadge(isOnline = true) {
  if (!isOnline) return '';
  const isEn = isEnglish();
  const tip = isEn ? 'Place owner is online now and ready to respond' : 'صاحب المكان متصل الآن بالموقع ومتاح للرد والتواصل';
  const text = isEn ? 'Online Now' : 'متصل الآن';
  return `
    <span class="badge-online-pulse" title="${tip}" aria-label="${tip}">
      <span class="online-indicator-dot"></span>
      <span class="online-indicator-text">${text}</span>
    </span>
  `;
}

