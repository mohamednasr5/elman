/**
 * المنزلة وناسها — Offer & Product Full Details Modals
 * Renders rich uncropped high-resolution view, pricing breakdown,
 * countdown timers, and direct WhatsApp / Call actions.
 */

import { showModal } from './Modal.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { formatDateRange, formatDate } from '../../utils/date.js';
import { dbIncrement } from '../../core/db.js';

if (typeof window !== 'undefined') {
  window.trackOfferClick = (offerId) => {
    if (offerId) dbIncrement(`offers/${offerId}/clicks`, 1).catch(() => {});
  };
  window.trackProductClick = (placeId, productId) => {
    if (placeId && productId) dbIncrement(`products/${placeId}/${productId}/clicks`, 1).catch(() => {});
  };
}

/**
 * Open full details modal for an offer
 */
export function openOfferFullDetailsModal(offer, place = {}) {
  if (!offer) return;

  const offerId = offer.id || offer._id || offer._key;
  if (offerId) {
    dbIncrement(`offers/${offerId}/views`, 1).catch(() => {});
  }

  const placeName = place?.name || offer.placeName || 'النشاط التجاري';
  const placePhone = place?.phone || offer.placePhone || '';
  const placeWhatsapp = place?.whatsapp || place?.phone || offer.placeWhatsapp || offer.placePhone || '';
  const placeSlug = place?.slug || offer.placeSlug || '';

  const cleanPhone = (placePhone || '').replace(/\D/g, '');
  let cleanWa = (placeWhatsapp || '').replace(/\D/g, '');
  if (cleanWa.startsWith('0')) cleanWa = '2' + cleanWa;
  if (!cleanWa && cleanPhone) cleanWa = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;

  const waMessage = encodeURIComponent(`السلام عليكم، أرغب في طلب / الاستفسار عن عرض:\n🎁 *${offer.title}*\n💰 بسعر: *${offer.newPrice || 0} ج.م*\n🏪 من: *${placeName}*\nعبر دليل المنزلة والمطرية الرقمي.`);
  const waLink = cleanWa ? `https://wa.me/${cleanWa}?text=${waMessage}` : null;

  showModal({
    title: `🎁 تفاصيل العرض: ${escHtml(offer.title)}`,
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:16px;padding:4px">
        <!-- Full Uncropped Image Box -->
        ${offer.imageUrl ? `
          <div style="width:100%;max-height:380px;border-radius:var(--radius-lg);overflow:hidden;background:#0B1320;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md)">
            <img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" style="max-width:100%;max-height:380px;width:auto;height:auto;object-fit:contain;display:block;margin:0 auto" />
          </div>
        ` : ''}

        <!-- Details Box -->
        <div style="background:var(--surface-2);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap">
            <h2 style="font-size:1.35rem;font-weight:800;color:var(--text-primary);margin:0;line-height:1.4">
              ${escHtml(offer.title)}
            </h2>
            ${offer.discountPercent ? `
              <span class="badge badge--danger" style="font-size:13px;font-weight:800;padding:4px 10px;border-radius:var(--radius-full)">
                خصم -${offer.discountPercent}%
              </span>
            ` : ''}
          </div>

          <!-- Pricing Box -->
          <div style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:var(--surface);border-radius:var(--radius-md);border:1.5px solid rgba(16,185,129,0.35);margin-bottom:14px;flex-wrap:wrap">
            <div>
              <span style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:2px">السعر الحالي بعد الخصم:</span>
              <strong style="font-size:1.6rem;color:#10B981;font-weight:900">${formatPrice(offer.newPrice)}</strong>
            </div>
            ${offer.oldPrice ? `
              <div>
                <span style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:2px">السعر الأصلي:</span>
                <span style="text-decoration:line-through;color:var(--text-muted);font-size:1.2rem">${formatPrice(offer.oldPrice)}</span>
              </div>
              <div style="margin-right:auto;background:#ECFDF5;color:#065F46;padding:5px 12px;border-radius:var(--radius-full);font-size:12px;font-weight:700;border:1px solid #A7F3D0">
                💰 وفرت ${Number(offer.oldPrice) - Number(offer.newPrice)} ج.م
              </div>
            ` : ''}
          </div>

          <!-- Description -->
          ${offer.description ? `
            <div style="margin-bottom:14px">
              <h4 style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px">📋 تفاصيل وشروط العرض:</h4>
              <p style="white-space:pre-line;color:var(--text-secondary);font-size:13.5px;line-height:1.7;margin:0">
                ${escHtml(offer.description)}
              </p>
            </div>
          ` : ''}

          <!-- Place & Validity Info -->
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--text-muted);padding-top:12px;border-top:1px dashed var(--border);flex-wrap:wrap;gap:8px">
            <div>
              🏪 مقدم من: <strong>${escHtml(placeName)}</strong>
              ${placeSlug ? `<a href="place.html?slug=${escAttr(placeSlug)}" style="color:var(--primary);margin-right:6px;font-weight:600">زيارة المكان ↗</a>` : ''}
            </div>
            <div>
              ⏰ صلاحية العرض: <strong>${formatDateRange(offer.startDate, offer.endDate)}</strong>
            </div>
          </div>

          <!-- Stats Impression Badge -->
          <div style="display:flex;align-items:center;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted);flex-wrap:wrap">
            <span class="badge" style="background:rgba(27,79,114,0.08);color:var(--primary);font-weight:700">👁️ ${(offer.views || 0) + 1} مشاهدة</span>
            <span class="badge" style="background:rgba(16,185,129,0.08);color:#059669;font-weight:700">👆 ${offer.clicks || 0} نقرة وطلب</span>
          </div>
        </div>

        <!-- Direct Actions -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          ${waLink ? `
            <a href="${escAttr(waLink)}" target="_blank" rel="noopener" onclick="window.trackOfferClick('${escAttr(offerId)}')" class="btn btn-success" style="padding:10px 16px;border-radius:var(--radius-md);background:linear-gradient(135deg,#25D366 0%,#128C7E 100%);color:#fff;border:none;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(37,211,102,0.3)">
              <span>📱</span> اطلب هذا العرض عبر واتساب
            </a>
          ` : ''}
          ${cleanPhone ? `
            <a href="tel:${escAttr(cleanPhone)}" onclick="window.trackOfferClick('${escAttr(offerId)}')" class="btn btn-primary" style="padding:10px 16px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;gap:6px">
              <span>📞</span> اتصال للاستفسار (${escHtml(cleanPhone)})
            </a>
          ` : ''}
        </div>
      </div>
    `,
    buttons: [
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });
}

/**
 * Open full details modal for a product
 */
export function openProductFullDetailsModal(product, place = {}) {
  if (!product) return;

  const productId = product.id || product._key;
  const placeId = place?.id || place?._key || product.placeId;

  if (placeId && productId) {
    dbIncrement(`products/${placeId}/${productId}/views`, 1).catch(() => {});
  }

  const placeName = place?.name || product.placeName || 'النشاط التجاري';
  const placePhone = place?.phone || product.placePhone || '';
  const placeWhatsapp = place?.whatsapp || place?.phone || product.placeWhatsapp || product.placePhone || '';
  const placeSlug = place?.slug || product.placeSlug || '';

  const cleanPhone = (placePhone || '').replace(/\D/g, '');
  let cleanWa = (placeWhatsapp || '').replace(/\D/g, '');
  if (cleanWa.startsWith('0')) cleanWa = '2' + cleanWa;
  if (!cleanWa && cleanPhone) cleanWa = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;

  const waMessage = encodeURIComponent(`السلام عليكم، أرغب في طلب / حجز منتج:\n🛍️ *${product.name}*\n💰 السعر: *${product.price || 0} ج.م*\n🏪 من: *${placeName}*\nعبر دليل المنزلة والمطرية الرقمي.`);
  const waLink = cleanWa ? `https://wa.me/${cleanWa}?text=${waMessage}` : null;

  showModal({
    title: `🛍️ تفاصيل المنتج: ${escHtml(product.name)}`,
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:16px;padding:4px">
        <!-- Full Uncropped Image Box -->
        ${product.imageUrl ? `
          <div style="width:100%;max-height:380px;border-radius:var(--radius-lg);overflow:hidden;background:#0B1320;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md)">
            <img src="${escAttr(product.imageUrl)}" alt="${escAttr(product.name)}" style="max-width:100%;max-height:380px;width:auto;height:auto;object-fit:contain;display:block;margin:0 auto" />
          </div>
        ` : ''}

        <!-- Details Box -->
        <div style="background:var(--surface-2);padding:18px;border-radius:var(--radius-lg);border:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap">
            <h2 style="font-size:1.35rem;font-weight:800;color:var(--text-primary);margin:0;line-height:1.4">
              ${escHtml(product.name)}
            </h2>
            ${product.category ? `
              <span class="chip chip--primary" style="font-size:12px;font-weight:700">
                🏷️ ${escHtml(product.category)}
              </span>
            ` : ''}
          </div>

          <!-- Pricing Box -->
          <div style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:var(--surface);border-radius:var(--radius-md);border:1.5px solid rgba(27,79,114,0.35);margin-bottom:14px;flex-wrap:wrap">
            <div>
              <span style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:2px">السعر الحالي:</span>
              <strong style="font-size:1.6rem;color:var(--primary);font-weight:900">${formatPrice(product.price)}</strong>
            </div>
            ${product.oldPrice ? `
              <div>
                <span style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:2px">السعر السابق:</span>
                <span style="text-decoration:line-through;color:var(--text-muted);font-size:1.2rem">${formatPrice(product.oldPrice)}</span>
              </div>
            ` : ''}
            ${product.oldPrice && Number(product.oldPrice) > Number(product.price) ? `
              <div style="margin-right:auto;background:#ECFDF5;color:#065F46;padding:6px 14px;border-radius:var(--radius-full);font-size:13px;font-weight:800;border:1px solid #A7F3D0;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(16,185,129,0.15)">
                <span>💰</span>
                <span>وفرت: <strong>${formatPrice(Number(product.oldPrice) - Number(product.price))}</strong></span>
                <span style="background:#10B981;color:#fff;padding:2px 7px;border-radius:var(--radius-sm);font-size:11px;font-weight:800">
                  خصم ${Math.round(((Number(product.oldPrice) - Number(product.price)) / Number(product.oldPrice)) * 100)}%
                </span>
              </div>
            ` : ''}
          </div>

          <!-- Description -->
          ${product.description ? `
            <div style="margin-bottom:14px">
              <h4 style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px">📝 وصف المنتج والمواصفات:</h4>
              <p style="white-space:pre-line;color:var(--text-secondary);font-size:13.5px;line-height:1.7;margin:0">
                ${escHtml(product.description)}
              </p>
            </div>
          ` : ''}

          <!-- Place Info -->
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--text-muted);padding-top:12px;border-top:1px dashed var(--border);flex-wrap:wrap;gap:8px">
            <div>
              🏪 متوفر لدى: <strong>${escHtml(placeName)}</strong>
              ${placeSlug ? `<a href="place.html?slug=${escAttr(placeSlug)}" style="color:var(--primary);margin-right:6px;font-weight:600">زيارة المكان ↗</a>` : ''}
            </div>
            ${product.createdAt ? `<div>📅 تاريخ الإضافة: <strong>${formatDate(product.createdAt)}</strong></div>` : ''}
          </div>

          <!-- Stats Impression Badge -->
          <div style="display:flex;align-items:center;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted);flex-wrap:wrap">
            <span class="badge" style="background:rgba(27,79,114,0.08);color:var(--primary);font-weight:700">👁️ ${(product.views || 0) + 1} مشاهدة</span>
            <span class="badge" style="background:rgba(16,185,129,0.08);color:#059669;font-weight:700">👆 ${product.clicks || 0} نقرة وطلب</span>
          </div>
        </div>

        <!-- Direct Actions -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          ${waLink ? `
            <a href="${escAttr(waLink)}" target="_blank" rel="noopener" onclick="window.trackProductClick('${escAttr(placeId)}', '${escAttr(productId)}')" class="btn btn-success" style="padding:10px 16px;border-radius:var(--radius-md);background:linear-gradient(135deg,#25D366 0%,#128C7E 100%);color:#fff;border:none;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(37,211,102,0.3)">
              <span>🛍️</span> اطلب هذا المنتج عبر واتساب
            </a>
          ` : ''}
          ${cleanPhone ? `
            <a href="tel:${escAttr(cleanPhone)}" onclick="window.trackProductClick('${escAttr(placeId)}', '${escAttr(productId)}')" class="btn btn-primary" style="padding:10px 16px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;gap:6px">
              <span>📞</span> اتصل بالمحل (${escHtml(cleanPhone)})
            </a>
          ` : ''}
        </div>
      </div>
    `,
    buttons: [
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });
}
