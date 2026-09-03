/**
 * StorefrontQrModal.js
 * Storefront QR Placard & Printable Poster Generator (لوحة QR الذكية لواجهة المحل)
 * Displays prominent phone & WhatsApp numbers directly under the QR code
 */

import { toast } from './Toast.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { getDefaultPlaceAssets } from '../../utils/category-assets.js';
import { checkIsPlaceVerified, drawCanvasVerifiedBadge } from './PlaceProfileCardModal.js';

export function openStorefrontQrModal(place = {}, category = {}) {
  const existing = document.getElementById('storefront-qr-modal-overlay');
  if (existing) existing.remove();

  const placeName = place.name || 'اسم النشاط';
  const categoryName = category.name || place.categoryName || place.customCategory || 'نشاط تجاري وخدمات';
  const docInfo = resolveDoctorSpecialty(place, category);
  const placeSlug = place.slug || place.id || '';
  const placeUrl = `https://dalilmanzala.com/${encodeURIComponent(placeSlug)}`;
  const defaultAssets = getDefaultPlaceAssets(place, category);
  const isVerified = checkIsPlaceVerified(place);

  const phone = (place.phone || '').trim();
  const whatsapp = (place.whatsapp || '').trim();

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(placeUrl)}&format=png&margin=1`;

  const overlay = document.createElement('div');
  overlay.id = 'storefront-qr-modal-overlay';
  overlay.className = 'profile-card-modal-overlay animate-fade-in';

  overlay.innerHTML = `
    <div class="profile-card-modal" role="dialog" aria-modal="true" aria-label="طباعة لوحة QR لواجهة المكان" style="max-width:580px">
      <!-- Toolbar -->
      <div class="profile-card-modal__toolbar">
        <button type="button" class="profile-card-modal__close" id="btn-close-qr-modal" aria-label="إغلاق">✕</button>

        <div style="font-weight:800;color:var(--text-primary);font-size:14px">
          🖨️ لوحة QR الذكية لواجهة المحل
        </div>

        <button type="button" class="btn btn-primary btn-sm" id="btn-download-qr-poster">
          <span>📥</span> تحميل وطباعة
        </button>
      </div>

      <!-- Poster Preview -->
      <div class="profile-card-modal__body" style="padding:16px;background:var(--surface-2);display:flex;justify-content:center">
        <div id="qr-poster-preview" style="background:#FFFFFF;border:2px solid #E2E8F0;border-radius:18px;padding:24px 20px;width:100%;max-width:390px;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,0.1);color:#0F172A">
          
          <div style="border:2.5px dashed #0284C7;border-radius:14px;padding:18px 14px;background:#FAFCFF">
            <!-- Platform Crest -->
            <div style="font-size:12.5px;font-weight:900;color:#0284C7;margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:5px">
              <span>🛡️</span> دليل المنزلة والمطرية الرقمي
            </div>

            <!-- Place Name -->
            <h3 style="font-size:19px;font-weight:900;color:#0F172A;margin:6px 0 4px 0;line-height:1.3">
              ${placeName}
              ${isVerified ? '<span style="color:#0284C7;font-size:16px">✓</span>' : ''}
            </h3>

            <!-- Category / Specialty -->
            <p style="font-size:13px;color:#0369A1;margin:0 0 12px 0;font-weight:800">
              ${place.medicalSpecialty 
                ? `🩺 ${place.medicalSpecialty}` 
                : (docInfo.isDoctor 
                    ? `${docInfo.icon} ${docInfo.specialtyLabel || docInfo.specialtyTitle}` 
                    : `${defaultAssets.categoryIcon || '🏪'} ${categoryName}`)}
            </p>

            <!-- QR Code Frame -->
            <div style="background:#FFFFFF;border:2px solid #CBD5E1;border-radius:14px;padding:12px;display:inline-block;margin:4px 0 10px 0;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
              <img src="${qrImageUrl}" alt="QR Code" style="width:180px;height:180px;display:block;border-radius:8px" />
            </div>

            <!-- PROMINENT PHONE NUMBERS UNDER QR -->
            ${(phone || whatsapp) ? `
              <div style="background:#FFFFFF;border:2px solid #0284C7;border-radius:12px;padding:10px 14px;margin:8px 0 12px 0;box-shadow:0 2px 8px rgba(2,132,199,0.1)">
                ${phone ? `
                  <div style="font-size:17px;font-weight:900;color:#0F172A;letter-spacing:0.5px;display:flex;align-items:center;justify-content:center;gap:6px;direction:ltr;margin:2px 0">
                    <span style="font-size:16px">📞</span>
                    <span>${phone}</span>
                  </div>
                ` : ''}
                ${whatsapp && whatsapp !== phone ? `
                  <div style="font-size:16px;font-weight:900;color:#15803D;letter-spacing:0.5px;display:flex;align-items:center;justify-content:center;gap:6px;direction:ltr;margin:4px 0 2px 0;border-top:${phone ? '1px dashed #E2E8F0;padding-top:4px' : 'none'}">
                    <img src="./icons/whatsapp.png" alt="WhatsApp" class="wa-official-icon-sm" />
                    <span>${whatsapp}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Scan Prompt -->
            <p style="font-size:12px;font-weight:800;color:#0F172A;margin:4px 0">
              📲 امسح الرمز بكاميرا هاتفك
            </p>
            <p style="font-size:11px;color:#64748B;margin:0;line-height:1.4">
              لعرض مواعيد العمل، العروض، وأرقام التواصل المباشر
            </p>

            <!-- Footer Domain -->
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid #E2E8F0;font-size:12px;font-weight:900;color:#0284C7">
              dalilmanzala.com
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const closeModal = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 200);
  };

  overlay.querySelector('#btn-close-qr-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Render & Download Canvas
  overlay.querySelector('#btn-download-qr-poster').addEventListener('click', async () => {
    const btn = overlay.querySelector('#btn-download-qr-poster');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ جاري التوليد...</span>';

    try {
      await generateAndDownloadQrPoster({
        place,
        categoryName,
        docInfo,
        defaultAssets,
        placeUrl,
        qrImageUrl,
        isVerified,
        phone,
        whatsapp
      });
      toast.success('تم إنشاء لوحة الـ QR بنجاح وجاهزة للطباعة! 🖨️✨');
    } catch (err) {
      console.error('[StorefrontQR] Export error:', err);
      toast.error('حدث خطأ أثناء تحميل لوحة QR');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>📥</span> تحميل وطباعة';
    }
  });
}

/**
 * محرك رسم لوحة الـ QR بدقة طباعة فائقة (1400 × 2040 A4 Portrait)
 */
async function generateAndDownloadQrPoster({
  place,
  categoryName,
  docInfo = {},
  defaultAssets = {},
  placeUrl,
  qrImageUrl,
  isVerified,
  phone = '',
  whatsapp = ''
}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const W = 1400;
  const H = 2040;
  canvas.width = W;
  canvas.height = H;

  // 1. White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 2. Luxury Outer Navy / Gold Border
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 16;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.strokeStyle = '#F5A623';
  ctx.lineWidth = 4;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  // 3. Top Banner
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 44px "Cairo", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🛡️ دليل المنزلة والمطرية الرقمي', W / 2, 130);

  // 4. Place Name & Verified Check
  const placeName = place.name || 'اسم النشاط';
  ctx.fillStyle = '#0284C7';
  ctx.font = '900 68px "Cairo", sans-serif';
  
  if (isVerified) {
    const textWidth = ctx.measureText(placeName).width;
    const badgeRadius = 24;
    const gap = 20;
    const totalW = textWidth + gap + (badgeRadius * 2);
    const startX = (W - totalW) / 2;
    
    ctx.textAlign = 'left';
    ctx.fillText(placeName, startX + (badgeRadius * 2) + gap, 240);
    drawCanvasVerifiedBadge(ctx, startX + badgeRadius, 240, badgeRadius);
  } else {
    ctx.textAlign = 'center';
    ctx.fillText(placeName, W / 2, 240);
  }

  // 5. Category / Specialty Subtitle
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 40px "Cairo", sans-serif';
  ctx.textAlign = 'center';
  const subtitle = place.medicalSpecialty 
    ? `🩺 ${place.medicalSpecialty}` 
    : (docInfo.isDoctor 
        ? `${docInfo.icon} ${docInfo.specialtyLabel || docInfo.specialtyTitle}` 
        : `${defaultAssets.categoryIcon || '🏪'} ${categoryName}`);
  ctx.fillText(subtitle, W / 2, 325);

  // 6. Center QR Code Frame
  const qrBoxSize = 740;
  const qrBoxX = (W - qrBoxSize) / 2;
  const qrBoxY = 410;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 6;
  ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  ctx.restore();

  try {
    const qrImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = qrImageUrl;
      setTimeout(() => resolve(null), 3000);
    });

    if (qrImg) {
      const innerSize = 650;
      const innerX = (W - innerSize) / 2;
      const innerY = qrBoxY + (qrBoxSize - innerSize) / 2;
      ctx.drawImage(qrImg, innerX, innerY, innerSize, innerSize);
    }
  } catch (_) {}

  // 7. PROMINENT PHONE NUMBERS BOX DIRECTLY UNDER QR
  let nextY = 1220;
  if (phone || whatsapp) {
    const phoneBoxW = 900;
    const hasBoth = Boolean(phone && whatsapp && phone !== whatsapp);
    const phoneBoxH = hasBoth ? 190 : 120;
    const phoneBoxX = (W - phoneBoxW) / 2;
    const phoneBoxY = 1190;

    ctx.save();
    ctx.shadowColor = 'rgba(2, 132, 199, 0.18)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#F0F9FF';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 5;

    // Draw rounded rectangle for phone box
    const r = 24;
    ctx.beginPath();
    ctx.moveTo(phoneBoxX + r, phoneBoxY);
    ctx.lineTo(phoneBoxX + phoneBoxW - r, phoneBoxY);
    ctx.quadraticCurveTo(phoneBoxX + phoneBoxW, phoneBoxY, phoneBoxX + phoneBoxW, phoneBoxY + r);
    ctx.lineTo(phoneBoxX + phoneBoxW, phoneBoxY + phoneBoxH - r);
    ctx.quadraticCurveTo(phoneBoxX + phoneBoxW, phoneBoxY + phoneBoxH, phoneBoxX + phoneBoxW - r, phoneBoxY + phoneBoxH);
    ctx.lineTo(phoneBoxX + r, phoneBoxY + phoneBoxH);
    ctx.quadraticCurveTo(phoneBoxX, phoneBoxY + phoneBoxH, phoneBoxX, phoneBoxY + phoneBoxH - r);
    ctx.lineTo(phoneBoxX, phoneBoxY + r);
    ctx.quadraticCurveTo(phoneBoxX, phoneBoxY, phoneBoxX + r, phoneBoxY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw Numbers with Icons
    if (hasBoth) {
      // Primary Phone
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 58px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📞 ${phone}`, W / 2, phoneBoxY + 65);

      // Divider line
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(phoneBoxX + 60, phoneBoxY + 105);
      ctx.lineTo(phoneBoxX + phoneBoxW - 60, phoneBoxY + 105);
      ctx.stroke();

      // WhatsApp Phone
      ctx.fillStyle = '#15803D';
      ctx.font = '900 54px "Segoe UI", sans-serif';
      ctx.fillText(`💬 واتساب: ${whatsapp}`, W / 2, phoneBoxY + 155);

      nextY = phoneBoxY + phoneBoxH + 60;
    } else {
      const singleNum = phone || whatsapp;
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 66px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📞 ${singleNum}`, W / 2, phoneBoxY + 75);

      nextY = phoneBoxY + phoneBoxH + 60;
    }
  }

  // 8. Scan Instruction Box
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 48px "Cairo", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📲 امسح الرمز بكاميرا هاتفك', W / 2, nextY);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 36px "Cairo", sans-serif';
  ctx.fillText('لعرض مواعيد العمل، المنتجات، وأرقام التواصل المباشر', W / 2, nextY + 70);

  // 9. Footer Strip
  ctx.fillStyle = '#0284C7';
  ctx.font = 'bold 44px "Segoe UI", sans-serif';
  ctx.fillText('dalilmanzala.com', W / 2, nextY + 165);

  // 10. Trigger Download
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const sanitizedName = (place.name || 'مكان').replace(/[/\\?%*:|"<>]/g, '-');
          a.href = url;
          a.download = `${sanitizedName}-لوحة-واجهة-المحل-QR.png`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 1000);
          resolve();
        }
      }, 'image/png', 0.95);
    } catch (_) {
      resolve();
    }
  });
}
