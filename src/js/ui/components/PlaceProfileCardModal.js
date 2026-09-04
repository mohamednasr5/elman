/**
 * PlaceProfileCardModal.js
 * مكون نافذة "تحميل البطاقة التعريفية" التفاعلية
 * مع دمج صورة الغلاف كخلفية، وصورة الشعار، وبيانات الاتصال والواتساب،
 * وإمكانية تغيير الألوان وتوليد صورة عالية الدقة PNG عبر HTML5 Canvas
 */

import { toast } from './Toast.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { getDefaultPlaceAssets } from '../../utils/category-assets.js';

export const CARD_COLOR_THEMES = [
  { id: 'navy', name: 'أزرق نيلي', start: '#0284c7', mid: '#0369a1', end: '#075985', swatch: '#0284c7' },
  { id: 'blue', name: 'أزرق ملكي', start: '#3b82f6', mid: '#2563eb', end: '#1e3a8a', swatch: '#2563eb' },
  { id: 'red', name: 'أحمر ياقوتي', start: '#f43f5e', mid: '#e11d48', end: '#881337', swatch: '#e11d48' },
  { id: 'orange', name: 'برتقالي دافئ', start: '#fb923c', mid: '#ea580c', end: '#9a3412', swatch: '#ea580c' },
  { id: 'cyan', name: 'تركواز مائي', start: '#22d3ee', mid: '#0891b2', end: '#155e75', swatch: '#0891b2' },
  { id: 'green', name: 'أخضر زمردي', start: '#34d399', mid: '#059669', end: '#064e3b', swatch: '#059669' },
  { id: 'purple', name: 'بنفسجي ملكي', start: '#a78bfa', mid: '#7c3aed', end: '#4c1d95', swatch: '#7c3aed' },
  { id: 'dark', name: 'أسود مذهب', start: '#374151', mid: '#1f2937', end: '#030712', swatch: '#1f2937' },
];

let _selectedThemeId = 'navy';

export function checkIsPlaceVerified(place) {
  if (!place) return false;
  return Boolean(
    place.isVerified === true ||
    place.isVerified === 'true' ||
    place.isVerified === 1 ||
    place.isVerified === '1' ||
    (place.verifiedUntil && Number(place.verifiedUntil) > Date.now()) ||
    place.verificationStatus === 'approved' ||
    place.status === 'verified'
  );
}

export function drawCanvasVerifiedBadge(ctx, centerX, centerY, radius = 18) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  // Sky Blue Gradient Circle
  const grad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
  grad.addColorStop(0, '#38BDF8');
  grad.addColorStop(1, '#0284C7');
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // White Border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Crisp White Checkmark
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', centerX, centerY + 1);
  ctx.restore();
}

/**
 * يفتح نافذة إنشاء وتحميل البطاقة التعريفية لأي نشاط
 */
export function openPlaceProfileCardModal(place = {}, category = {}) {
  const existing = document.getElementById('profile-card-modal-overlay');
  if (existing) existing.remove();

  const theme = CARD_COLOR_THEMES.find(t => t.id === _selectedThemeId) || CARD_COLOR_THEMES[0];
  const placeName = place.name || 'اسم النشاط';
  const categoryName = category.name || place.categoryName || place.customCategory || 'نشاط تجاري وخدمات';

  // Resolve Doctor / Medical Specialty
  const docInfo = resolveDoctorSpecialty(place, category);
  const resolvedSpecialty = (place.medicalSpecialty && String(place.medicalSpecialty).trim())
    ? place.medicalSpecialty.trim()
    : (docInfo.isDoctor && (docInfo.specialtyLabel || docInfo.specialtyTitle)
        ? (docInfo.specialtyLabel || docInfo.specialtyTitle)
        : '');

  const displaySubtitle = resolvedSpecialty 
    ? (resolvedSpecialty.startsWith('دكتور') || resolvedSpecialty.startsWith('استشاري') || resolvedSpecialty.startsWith('أخصائي') || resolvedSpecialty.startsWith('عيادة')
        ? `🩺 ${resolvedSpecialty}`
        : `🩺 تخصص: ${resolvedSpecialty}`)
    : categoryName;

  const fullAddress = (place.address && String(place.address).trim())
    ? place.address.trim()
    : ((place.area && String(place.area).trim()) ? place.area.trim() : 'مدينة المنزلة');
  
  // Resolve exact image URLs
  const defaultAssets = getDefaultPlaceAssets(place, category);
  const coverUrl = place.coverImageUrl || place.coverImage || place.image || place.photos?.[0] || defaultAssets.coverImageUrl;
  const logoUrl = place.logoUrl || place.logo || place.photoURL || defaultAssets.logoUrl;
  const phone = place.phone || '';
  const whatsapp = place.whatsapp || place.phone || '';

  // Prefetch Data URLs in the background for instant, flawless canvas export
  if (coverUrl) fetchImageAsDataUrl(coverUrl).catch(() => {});
  if (logoUrl) fetchImageAsDataUrl(logoUrl).catch(() => {});

  const overlay = document.createElement('div');
  overlay.id = 'profile-card-modal-overlay';
  overlay.className = 'profile-card-modal-overlay animate-fade-in';

  overlay.innerHTML = `
    <div class="profile-card-modal" role="dialog" aria-modal="true" aria-label="تحميل البطاقة التعريفية">
      <!-- Modal Top Toolbar -->
      <div class="profile-card-modal__toolbar">
        <button type="button" class="profile-card-modal__close" id="btn-close-profile-modal" aria-label="إغلاق">✕</button>

        <div class="profile-card-modal__colors">
          <span class="colors-label">اختر لون الخلفية:</span>
          <div class="color-swatches-list" id="color-swatches-list">
            ${CARD_COLOR_THEMES.map(t => `
              <button 
                type="button" 
                class="color-swatch-btn ${t.id === _selectedThemeId ? 'active' : ''}" 
                data-theme-id="${t.id}" 
                style="background:${t.swatch}" 
                title="${t.name}" 
                aria-label="${t.name}">
              </button>
            `).join('')}
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-sm profile-card-download-trigger" id="btn-render-and-download-card">
          <span class="btn-icon">📥</span>
          <span>تحميل الصورة</span>
        </button>

        <div class="profile-card-modal__title-bar">
          تحميل البطاقة التعريفية
        </div>
      </div>

      <!-- Preview Stage -->
      <div class="profile-card-modal__body">
        <div class="profile-card-preview-wrapper" id="profile-card-preview-wrapper">
          
          <div class="manhom-profile-card" id="live-manhom-profile-card">
            <!-- Card Header with Cover Image as Background -->
            <div class="manhom-card-header ${coverUrl ? 'has-cover' : ''}" id="live-card-cover-header" style="${coverUrl ? `background-image: linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.75)), url('${coverUrl}')` : ''}">
              <span class="manhom-card-eyebrow">تعرفوا على</span>
            </div>

            <!-- Card Avatar / Logo Frame -->
            <div class="manhom-card-avatar-box">
              <div class="manhom-card-avatar-inner">
                ${logoUrl 
                  ? `<img src="${logoUrl}" alt="${placeName}" id="live-preview-avatar-img" />` 
                  : `<div class="avatar-fallback-placeholder">${placeName.charAt(0) || '📍'}</div>`
                }
              </div>
            </div>

            <!-- Card Bottom Gradient Body -->
            <div class="manhom-card-content" id="live-manhom-card-content" style="background: linear-gradient(180deg, ${theme.start} 0%, ${theme.mid} 40%, ${theme.end} 100%)">
              <h2 class="manhom-card-name">
                <span>${placeName}</span>
                ${checkIsPlaceVerified(place) ? '<span class="manhom-card-verified-badge" title="موثق">✓</span>' : ''}
              </h2>

              <p class="manhom-card-category" style="${resolvedSpecialty ? 'font-weight:700;letter-spacing:0.2px;line-height:1.4' : ''}">
                ${displaySubtitle}
              </p>

              <div class="manhom-card-location" title="${fullAddress}">
                <span>📍 ${fullAddress}</span>
              </div>

              <!-- Phone & WhatsApp Badges -->
              ${(phone || whatsapp) ? `
                <div class="manhom-card-contacts-pill">
                  ${phone ? `
                    <div class="contact-pill-item" title="رقم الهاتف">
                      <span class="contact-icon phone-icon">📞</span>
                      <span class="contact-num">${phone}</span>
                    </div>
                  ` : ''}
                  ${(phone && whatsapp && whatsapp !== phone) ? `<span class="contact-divider">|</span>` : ''}
                  ${whatsapp ? `
                    <div class="contact-pill-item whatsapp-pill-item" title="واتساب">
                      <span class="contact-icon wa-icon">💬</span>
                      <span class="contact-num">${whatsapp}</span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>

            <!-- Card Footer Strip -->
            <div class="manhom-card-footer">
              <div class="footer-platform">
                <span class="footer-shield">🛡️</span>
                <span>دليل المنزلة والمطرية الرقمي</span>
              </div>
              <div class="footer-domain">
                <span>dalilmanzala.com</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Event: Close modal
  const closeModal = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 200);
  };

  overlay.querySelector('#btn-close-profile-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Event: Change Color Theme
  const swatchesContainer = overlay.querySelector('#color-swatches-list');
  const cardContent = overlay.querySelector('#live-manhom-card-content');

  swatchesContainer.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tid = btn.getAttribute('data-theme-id');
      _selectedThemeId = tid;

      swatchesContainer.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const activeTheme = CARD_COLOR_THEMES.find(t => t.id === tid) || CARD_COLOR_THEMES[0];
      if (cardContent) {
        cardContent.style.background = `linear-gradient(180deg, ${activeTheme.start} 0%, ${activeTheme.mid} 40%, ${activeTheme.end} 100%)`;
      }
    });
  });

  // Event: Render & Download Card Canvas
  const downloadBtn = overlay.querySelector('#btn-render-and-download-card');
  downloadBtn.addEventListener('click', async () => {
    const activeTheme = CARD_COLOR_THEMES.find(t => t.id === _selectedThemeId) || CARD_COLOR_THEMES[0];
    
    downloadBtn.disabled = true;
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = `<span>⏳ جاري التصميم...</span>`;

    try {
      await generateAndDownloadPlaceCard({
        place,
        categoryName: displaySubtitle,
        fullAddress,
        theme: activeTheme,
        coverUrl,
        logoUrl,
        phone,
        whatsapp
      });
      toast.success('تم إنشاء وتحميل البطاقة التعريفية بنجاح! 🪪✨');
    } catch (err) {
      console.error('[ProfileCard] Generation error:', err);
      toast.error('حدث خطأ أثناء تحميل الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = originalText;
    }
  });
}

/**
 * محرك رسم وتوليد الصورة بدقة فائقة عبر HTML5 Canvas مع إسناد الغلاف والشعار وجهات الاتصال
 */
async function generateAndDownloadPlaceCard({ place, categoryName, fullAddress, theme, coverUrl, logoUrl, phone, whatsapp }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Ultra-crisp square dimensions (1200 x 1200)
  const W = 1200;
  const H = 1200;
  canvas.width = W;
  canvas.height = H;

  // 1. White Base Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 2. Draw Top Cover Image Section (Height: 440px)
  const topH = 440;
  let coverLoaded = false;

  if (coverUrl) {
    try {
      const coverImg = await loadSafeImageToCanvas(coverUrl);
      if (coverImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, topH);
        ctx.clip();
        
        // Draw cover with object-fit cover
        drawImageProp(ctx, coverImg, 0, 0, W, topH, 0.5, 0.5);

        // Dark gradient overlay for elegance & contrast
        const coverGrad = ctx.createLinearGradient(0, 0, 0, topH);
        coverGrad.addColorStop(0, 'rgba(15, 23, 42, 0.50)');
        coverGrad.addColorStop(1, 'rgba(15, 23, 42, 0.80)');
        ctx.fillStyle = coverGrad;
        ctx.fillRect(0, 0, W, topH);
        ctx.restore();
        coverLoaded = true;
      }
    } catch (_) {
      coverLoaded = false;
    }
  }

// Fallback Cover Background: Rich Deep Navy Gradient with Subtle Radial Glow
  if (!coverLoaded) {
    ctx.save();
    const fallbackCoverGrad = ctx.createLinearGradient(0, 0, W, topH);
    fallbackCoverGrad.addColorStop(0, '#0F172A');
    fallbackCoverGrad.addColorStop(0.5, '#1E293B');
    fallbackCoverGrad.addColorStop(1, '#0B1E30');
    ctx.fillStyle = fallbackCoverGrad;
    ctx.fillRect(0, 0, W, topH);

    const glow = ctx.createRadialGradient(W / 2, topH / 2, 20, W / 2, topH / 2, 300);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, topH);
    ctx.restore();
  }

  // 3. Top Header text "تعرفوا على"
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = coverLoaded ? '#FFFFFF' : '#0F172A';
  ctx.font = 'bold 52px "Cairo", "Segoe UI", sans-serif';
  if (coverLoaded) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillText('تعرفوا على', W / 2, 95);
  ctx.restore();

  // 4. Lower Gradient Background Block (Height from 440 to H-110)
  const gradY = 440;
  const gradH = H - gradY - 110;
  const grad = ctx.createLinearGradient(0, gradY, 0, gradY + gradH);
  grad.addColorStop(0, theme.start);
  grad.addColorStop(0.4, theme.mid);
  grad.addColorStop(1, theme.end);

  ctx.fillStyle = grad;
  ctx.fillRect(0, gradY, W, gradH);

  // 5. Draw Avatar / Logo Box (Centered, overlapping cover & gradient)
  const avatarSize = 340;
  const avatarX = (W - avatarSize) / 2;
  const avatarY = 210;
  const radius = 32;

  // Draw Avatar Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, radius);
  ctx.fill();
  ctx.restore();

  // Draw Avatar Inner Image
  let logoLoaded = false;
  const targetLogoUrl = logoUrl || coverUrl;

  if (targetLogoUrl) {
    try {
      const logoImg = await loadSafeImageToCanvas(targetLogoUrl);
      if (logoImg) {
        ctx.save();
        drawRoundedRect(ctx, avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16, radius - 6);
        ctx.clip();
        drawImageProp(ctx, logoImg, avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16, 0.5, 0.5);
        ctx.restore();
        logoLoaded = true;
      }
    } catch (_) {
      logoLoaded = false;
    }
  }

if (!logoLoaded) {
    ctx.save();
    drawRoundedRect(ctx, avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16, radius - 6);
    ctx.clip();
    const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX, avatarY + avatarSize);
    avatarGrad.addColorStop(0, '#FFFFFF');
    avatarGrad.addColorStop(1, '#F8FAFC');
    ctx.fillStyle = avatarGrad;
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);

    ctx.fillStyle = theme.mid;
    ctx.font = 'bold 95px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const catIcon = defaultAssets.categoryIcon || '🏪';
    ctx.fillText(catIcon, W / 2, avatarY + (avatarSize / 2) - 8);
    ctx.restore();
  }

  // Draw crisp white border around Avatar Box
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 10;
  drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, radius);
  ctx.stroke();
  ctx.restore();

  // 6. Place Name on Colored Gradient with Verified Badge
  ctx.save();
  ctx.font = 'bold 58px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.30)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  
  const nameY = 670;
  const nameText = place.name || 'اسم النشاط';
  const isVerified = checkIsPlaceVerified(place);

  if (isVerified) {
    const textWidth = ctx.measureText(nameText).width;
    const badgeRadius = 20;
    const gap = 16;
    const totalWidth = textWidth + gap + (badgeRadius * 2);
    
    // Centered group with badge on left in RTL
    const startX = (W - totalWidth) / 2;
    const badgeCenterX = startX + badgeRadius;
    
    // Draw Name text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, startX + (badgeRadius * 2) + gap, nameY);
    
    // Draw Verified Badge
    drawCanvasVerifiedBadge(ctx, badgeCenterX, nameY, badgeRadius);
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, W / 2, nameY);
  }
  ctx.restore();

  // 7. Category / Subtitle
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const subText = categoryName || '';
  let subFontSize = 38;
  if (subText.length > 45) subFontSize = 27;
  else if (subText.length > 30) subFontSize = 32;
  ctx.font = `600 ${subFontSize}px "Cairo", "Segoe UI", sans-serif`;
  ctx.fillText(subText, W / 2, 750);
  ctx.restore();

  // 8. Full Address / Location Tag
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
  
  const addrText = `📍 ${fullAddress || 'مدينة المنزلة'}`;
  let fontSize = 30;
  if (addrText.length > 55) {
    fontSize = 24;
  } else if (addrText.length > 40) {
    fontSize = 27;
  }
  ctx.font = `500 ${fontSize}px "Cairo", "Segoe UI", sans-serif`;
  
  // Auto-fit long addresses to prevent clipping
  const maxAddrWidth = 1040;
  const measuredWidth = ctx.measureText(addrText).width;
  if (measuredWidth > maxAddrWidth) {
    const scale = maxAddrWidth / measuredWidth;
    ctx.font = `500 ${Math.max(19, Math.floor(fontSize * scale))}px "Cairo", "Segoe UI", sans-serif`;
  }
  
  ctx.fillText(addrText, W / 2, 815);
  ctx.restore();

  // 9. Phone & WhatsApp Contacts Capsule Pill
  if (phone || whatsapp) {
    ctx.save();
    const pillW = 680;
    const pillH = 75;
    const pillX = (W - pillW) / 2;
    const pillY = 875;
    const pillRadius = 38;

    // Pill Frosted Glass Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillRadius);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px "Cairo", "Segoe UI", sans-serif';

    if (phone && whatsapp && phone !== whatsapp) {
      // Both numbers
      ctx.fillText(`📞 ${phone}   |   💬 ${whatsapp}`, W / 2, pillY + pillH / 2);
    } else {
      // Single contact number with call & whatsapp icon
      const contactNum = phone || whatsapp;
      ctx.fillText(`📞 اتصال & 💬 واتساب :  ${contactNum}`, W / 2, pillY + pillH / 2);
    }
    ctx.restore();
  }

  // 10. White Footer Strip (110px height at bottom)
  const footerY = H - 110;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, footerY, W, 110);

  // Footer top divider
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(W, footerY);
  ctx.stroke();

  // Right Side: دليل المنزلة والمطرية الرقمي
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 30px "Cairo", sans-serif';
  ctx.fillText('🛡️ دليل المنزلة والمطرية الرقمي', W - 60, footerY + 55);
  ctx.restore();

  // Left Side: dalilmanzala.com
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0284C7';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.fillText('dalilmanzala.com', 60, footerY + 55);
  ctx.restore();

  // 11. Export to Blob and Trigger Download
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedName = (place.name || 'مكان').replace(/[/\\?%*:|"<>]/g, '-');
  a.href = url;
  a.download = `${sanitizedName}-بطاقة-تعريفية.png`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * دالة آمنة 100% لتحميل أي صورة إلى Canvas متجاوزة قيود CORS
 */
async function loadSafeImageToCanvas(srcUrl) {
  if (!srcUrl) return null;

  try {
    const dataUrl = await fetchImageAsDataUrl(srcUrl);
    const finalSrc = dataUrl || srcUrl;

    return await new Promise((resolve) => {
      const img = new Image();
      if (!finalSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('[loadSafeImageToCanvas] Failed for:', srcUrl);
        resolve(null);
      };
      img.src = finalSrc;
      setTimeout(() => resolve(null), 2500);
    });
  } catch (err) {
    console.warn('[loadSafeImageToCanvas] Exception:', err);
    return null;
  }
}

/**
 * Fetch image as Base64 Data URL to completely bypass CORS canvas tainting
 * Uses multi-proxy failover architecture
 */
const _dataUrlCache = new Map();

async function fetchImageAsDataUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('data:')) return cleanUrl;

  if (_dataUrlCache.has(cleanUrl)) {
    return _dataUrlCache.get(cleanUrl);
  }

  // Strategy 1: High-speed Global Image CDN (images.weserv.nl)
  try {
    const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl.replace(/^https?:\/\//, ''))}&output=webp`;
    const res = await fetch(weservUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 100) {
        const dataUrl = await blobToDataUrl(blob);
        _dataUrlCache.set(cleanUrl, dataUrl);
        return dataUrl;
      }
    }
  } catch (_) {}

  // Strategy 2: CorsProxy.io
  try {
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(corsProxyUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 100) {
        const dataUrl = await blobToDataUrl(blob);
        _dataUrlCache.set(cleanUrl, dataUrl);
        return dataUrl;
      }
    }
  } catch (_) {}

  // Strategy 3: Direct fetch with CORS
  try {
    const res = await fetch(cleanUrl, { mode: 'cors', signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 100) {
        const dataUrl = await blobToDataUrl(blob);
        _dataUrlCache.set(cleanUrl, dataUrl);
        return dataUrl;
      }
    }
  } catch (_) {}

  // Strategy 4: Cloudflare Worker proxy
  try {
    const workerProxy = `https://elmanzala.nonm1724.workers.dev/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(workerProxy, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 100) {
        const dataUrl = await blobToDataUrl(blob);
        _dataUrlCache.set(cleanUrl, dataUrl);
        return dataUrl;
      }
    }
  } catch (_) {}

  return null;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw image with object-fit: cover on canvas
 */
function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const r = Math.min(w / iw, h / ih);
  let nw = iw * r;
  let nh = ih * r;
  let cx = 1;
  let cy = 1;
  let cw = 1;
  let ch = 1;
  let ar = 1;

  if (nw < w) ar = w / nw;
  if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
  nw *= ar;
  nh *= ar;

  cw = iw / (nw / w);
  ch = ih / (nh / h);

  cx = (iw - cw) * offsetX;
  cy = (ih - ch) * offsetY;

  if (cx < 0) cx = 0;
  if (cy < 0) cy = 0;
  if (cw > iw) cw = iw;
  if (ch > ih) ch = ih;

  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}
