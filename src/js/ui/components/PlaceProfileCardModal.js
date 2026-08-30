/**
 * PlaceProfileCardModal.js
 * مكون نافذة "تحميل البطاقة التعريفية" التفاعلية
 * مع إمكانية تغيير ألوان الخلفية (بالتطابق مع نموذج من هم) وتنزيل بطاقة عالية الجودة PNG
 */

import { toast } from './Toast.js';

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

/**
 * يفتح نافذة إنشاء وتحميل البطاقة التعريفية لأي نشاط
 */
export function openPlaceProfileCardModal(place = {}, category = {}) {
  const existing = document.getElementById('profile-card-modal-overlay');
  if (existing) existing.remove();

  const theme = CARD_COLOR_THEMES.find(t => t.id === _selectedThemeId) || CARD_COLOR_THEMES[0];
  const placeName = place.name || 'اسم النشاط';
  const categoryName = category.name || place.categoryName || place.customCategory || 'نشاط تجاري وخدمات';
  const placeArea = place.area || place.address || 'المنزلة والمطرية';
  const logoUrl = place.logoUrl || place.coverImageUrl || '';

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
            <!-- Card Header: Title -->
            <div class="manhom-card-header">
              <span class="manhom-card-eyebrow">تعرفوا على</span>
            </div>

            <!-- Card Avatar / Logo Frame -->
            <div class="manhom-card-avatar-box">
              <div class="manhom-card-avatar-inner">
                ${logoUrl 
                  ? `<img src="${logoUrl}" alt="${placeName}" id="live-preview-avatar-img" crossorigin="anonymous" />` 
                  : `<div class="avatar-fallback-placeholder">${placeName.charAt(0) || '📍'}</div>`
                }
              </div>
            </div>

            <!-- Card Bottom Gradient Body -->
            <div class="manhom-card-content" id="live-manhom-card-content" style="background: linear-gradient(180deg, ${theme.start} 0%, ${theme.mid} 40%, ${theme.end} 100%)">
              <h2 class="manhom-card-name">
                <span>${placeName}</span>
                ${place.isVerified ? '<span class="manhom-card-verified-badge" title="موثق">✓</span>' : ''}
              </h2>

              <p class="manhom-card-category">
                ${categoryName}
              </p>

              <div class="manhom-card-location">
                <span>📍 ${placeArea}</span>
              </div>
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
        categoryName,
        placeArea,
        theme: activeTheme,
        logoUrl
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
 * محرك رسم وتوليد الصورة بدقة فائقة عبر HTML5 Canvas
 */
async function generateAndDownloadPlaceCard({ place, categoryName, placeArea, theme, logoUrl }) {
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

  // 2. Top Header text "تعرفوا على"
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 50px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText('تعرفوا على', W / 2, 110);

  // 3. Lower 65% Gradient Background Block
  const gradY = 440;
  const gradH = H - gradY - 110;
  const grad = ctx.createLinearGradient(0, gradY, 0, gradY + gradH);
  grad.addColorStop(0, theme.start);
  grad.addColorStop(0.4, theme.mid);
  grad.addColorStop(1, theme.end);

  ctx.fillStyle = grad;
  ctx.fillRect(0, gradY, W, gradH);

  // 4. Draw Avatar / Logo Box (Centered, with rounded corners and border)
  const avatarSize = 360;
  const avatarX = (W - avatarSize) / 2;
  const avatarY = 220;
  const radius = 32;

  // Draw Avatar Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, radius);
  ctx.fill();
  ctx.restore();

  // Draw Avatar Inner Image or Fallback
  let imageLoaded = false;
  if (logoUrl) {
    try {
      const img = await loadImageAsync(logoUrl);
      ctx.save();
      drawRoundedRect(ctx, avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16, radius - 6);
      ctx.clip();
      ctx.drawImage(img, avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16);
      ctx.restore();
      imageLoaded = true;
    } catch (_) {
      imageLoaded = false;
    }
  }

  if (!imageLoaded) {
    // Draw placeholder avatar with initials
    ctx.save();
    drawRoundedRect(ctx, avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16, radius - 6);
    ctx.fillStyle = theme.mid;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 120px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((place.name || 'م').charAt(0), W / 2, avatarY + avatarSize / 2);
    ctx.restore();
  }

  // Draw white stroke around Avatar Box
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 10;
  drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, radius);
  ctx.stroke();
  ctx.restore();

  // 5. Place Name on Colored Gradient
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 62px "Cairo", "Segoe UI", sans-serif';
  
  const nameY = 700;
  const nameText = place.name || 'اسم النشاط';
  ctx.fillText(nameText, W / 2, nameY);

  // If verified, draw verified badge symbol next to name
  if (place.isVerified) {
    const textWidth = ctx.measureText(nameText).width;
    const badgeX = (W / 2) + (textWidth / 2) + 32;
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('✓', badgeX, nameY);
  }
  ctx.restore();

  // 6. Category / Subtitle
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = '600 42px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(categoryName, W / 2, 790);
  ctx.restore();

  // 7. Area / Location Tag
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '500 32px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(`📍 ${placeArea}`, W / 2, 860);
  ctx.restore();

  // 8. White Footer Strip (110px height at bottom)
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

  // 9. Export to Blob and Trigger Download
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

function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });
}
