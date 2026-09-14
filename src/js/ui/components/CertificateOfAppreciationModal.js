/**
 * CertificateOfAppreciationModal.js
 * شهادة تقدير وتكريم وتَمَيُّز رسمية لنشاط المكان من دليل المنزلة والمطرية الرقمي
 * بمقاس A4 أفقي قياسي (A4 Landscape - 297mm x 210mm)
 * 
 * المزايا المحدثة:
 * 1. شعار الدليل الرسمي المعتمد في ترويسة الشهادة (icon-192x192.png)
 * 2. حذف كافة علامات التشكيل لخط عصري وواضح وراقي
 * 3. تخصيص اسم المنطقة الفعلي للمكان ديناميكياً (بالأحمدية / بالمطرية / بالمنزلة / بالجمالية / بميت سلسيل...)
 * 4. تكبير الختم الرسمي الأزرق وتوسيعه لمنع أي قص
 * 5. علامة مائية فخمة خفيفة وزخارف أمان راقية لملء مساحة الشهادة
 * 6. تكبير الخطوط والاسم لتناسق بصري مثالي
 * 7. مطابقة تامة 100% بين المعاينة والطباعة الفورية والتحميل عالي الدقة (Canvas 300 DPI)
 */

import { toast } from './Toast.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { toArabicCategory } from '../../utils/category-i18n.js';
import { getCached } from '../../core/db.js';
import { checkIsPlaceVerified } from './PlaceProfileCardModal.js';

/**
 * يستخرج منطقة المكان الفعلية ويضيف حرف الجر (بـ) بشكل لغوي دقيق
 * مثلاً: الأحمدية -> بالأحمدية | المطرية -> بالمطرية | المنزلة -> بالمنزلة | ميت سلسيل -> بميت سلسيل
 */
export function formatPlaceLocationWithBa(place = {}) {
  let raw = String(place.area || place.city || '').trim();

  // إذا لم تكن محددة أو عامة، نحاول استخراجها من العنوان التفصيلي
  if (!raw || raw.toLowerCase() === 'all' || raw === 'الكل' || raw === 'المنزلة والمطرية') {
    const addr = String(place.address || '').trim();
    const knownAreas = [
      'الأحمدية', 'المطرية', 'المنزلة', 'الجمالية', 'ميت سلسيل', 
      'البصراط', 'العزيزة', 'الروضة', 'العصافرة', 'ميت خضير', 
      'ميت شريف', 'النسايمة', 'الحوتة', 'الفروسات', 'شعارنة', 'الشبول'
    ];
    for (const a of knownAreas) {
      if (addr.includes(a)) {
        raw = a;
        break;
      }
    }
  }

  if (!raw || raw === 'المنزلة والمطرية') {
    raw = 'المنزلة';
  }

  // تنظيف السوابق إن وجدت
  raw = raw.replace(/^(مدينة|مركز|قرية|منطقة)s+/i, '').trim();

  if (raw.startsWith('بال') || raw.startsWith('بـ') || raw.startsWith('بالم')) {
    return raw;
  }
  if (raw.startsWith('ال')) {
    return 'ب' + raw; // المنزلة -> بالمنزلة ، الأحمدية -> بالأحمدية
  }
  return 'بـ' + raw; // ميت سلسيل -> بـميت سلسيل
}

export function openCertificateOfAppreciationModal(place = {}, category = {}) {
  const existing = document.getElementById('certificate-modal-overlay');
  if (existing) existing.remove();

  const placeName = (place.name || 'اسم النشاط').trim();
  const rawCustom = (place.customCategory || place.custom_category || '').trim();
  let rawCatName = (category?.name || place.categoryName || place.category_name || '').trim();
  const targetCatId = (place.categoryId || place.category_id || '').trim().toLowerCase();

  // Resolve Category Name
  if (!rawCatName || ['other', 'أخرى', 'عام', 'نشاط عام', 'خدمات وأنشطة', 'نشاط تجاري وخدمات', 'نشاط تجاري'].includes(rawCatName.toLowerCase())) {
    try {
      const allCachedCats = (typeof getCached === 'function' ? getCached('categories_all') : null) 
        || (typeof window !== 'undefined' && window.__categories_cache) 
        || [];
      if (allCachedCats.length && targetCatId) {
        const found = allCachedCats.find(c => {
          const cKey = String(c._key || c.id || '').trim().toLowerCase();
          const cSlug = String(c.slug || '').trim().toLowerCase();
          return cKey === targetCatId || cSlug === targetCatId || cKey.replace(/-/g, ' ') === targetCatId.replace(/-/g, ' ');
        });
        if (found?.name) rawCatName = found.name.trim();
      }
    } catch (_) {}
  }

  if (!rawCatName || ['other', 'أخرى', 'عام', 'نشاط عام', 'خدمات وأنشطة', 'نشاط تجاري وخدمات', 'نشاط تجاري'].includes(rawCatName.toLowerCase())) {
    const dictName = toArabicCategory(targetCatId);
    if (dictName && !['other', 'أخرى', 'عام', 'نشاط عام', 'خدمات وأنشطة', 'نشاط تجاري وخدمات', 'نشاط تجاري'].includes(dictName.toLowerCase())) {
      rawCatName = dictName;
    }
  }

  let categoryName = '';
  if (rawCustom && !['other', 'أخرى', 'عام', 'نشاط عام', 'خدمات وأنشطة', 'نشاط تجاري وخدمات', 'نشاط تجاري'].includes(rawCustom.toLowerCase())) {
    categoryName = rawCustom;
  } else if (rawCatName && !['other', 'أخرى', 'عام', 'نشاط عام', 'خدمات وأنشطة', 'نشاط تجاري وخدمات', 'نشاط تجاري'].includes(rawCatName.toLowerCase())) {
    categoryName = rawCatName;
  } else if (rawCustom) {
    categoryName = rawCustom;
  } else if (rawCatName) {
    categoryName = rawCatName;
  } else {
    categoryName = 'نشاط تجاري وخدمات';
  }

  // Doctor / Medical Specialty check
  const docInfo = resolveDoctorSpecialty(place, category);
  const displayCategory = (place.medicalSpecialty && String(place.medicalSpecialty).trim())
    ? place.medicalSpecialty.trim()
    : (docInfo.isDoctor && (docInfo.specialtyLabel || docInfo.specialtyTitle)
        ? (docInfo.specialtyLabel || docInfo.specialtyTitle)
        : categoryName);

  const isVerified = checkIsPlaceVerified(place);
  const locationWithBa = formatPlaceLocationWithBa(place);

  const now = new Date();
  const issueYear = now.getFullYear();
  const rawId = (place.id || place._key || place.slug || '00000').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  const serialNumber = 'DLM-' + issueYear + '-' + (rawId || '88492');

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const formattedDate = now.getDate() + ' ' + arabicMonths[now.getMonth()] + ' ' + issueYear + 'م';

  const overlay = document.createElement('div');
  overlay.id = 'certificate-modal-overlay';
  overlay.className = 'certificate-modal-overlay animate-fade-in';

  overlay.innerHTML = `
    <style id="certificate-modal-styles">
      .certificate-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        overflow-y: auto;
        box-sizing: border-box;
      }
      .certificate-modal-dialog {
        background: #0B1329;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        width: 100%;
        max-width: 1080px;
        box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.85);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        margin: auto;
      }
      .certificate-modal-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 22px;
        background: #111D38;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        gap: 12px;
        flex-wrap: wrap;
      }
      .certificate-modal-close {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #FFFFFF;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 17px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .certificate-modal-close:hover {
        background: rgba(239, 68, 68, 0.85);
        transform: scale(1.05);
      }
      .certificate-modal-title {
        color: #FFFFFF;
        font-size: 15px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }
      .certificate-owner-tag {
        background: rgba(245, 158, 11, 0.2);
        color: #FBBF24;
        border: 1px solid rgba(245, 158, 11, 0.4);
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .certificate-modal-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .btn-print-cert {
        background: #FFFFFF;
        color: #0F172A !important;
        border: 1px solid #E2E8F0;
        font-weight: 800;
        border-radius: 10px;
        padding: 9px 18px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13.5px;
        transition: all 0.2s ease;
      }
      .btn-print-cert:hover {
        background: #F1F5F9;
        transform: translateY(-1px);
      }
      .btn-download-cert {
        background: linear-gradient(135deg, #0284C7, #0369A1);
        color: #FFFFFF !important;
        border: none;
        font-weight: 800;
        border-radius: 10px;
        padding: 9px 20px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13.5px;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
        transition: all 0.2s ease;
      }
      .btn-download-cert:hover {
        background: linear-gradient(135deg, #0369A1, #075985);
        transform: translateY(-1px);
      }
      .certificate-preview-container {
        padding: 24px 16px;
        background: #070D1C;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-x: auto;
      }
      
      /* The A4 Landscape Sheet (297mm x 210mm ~ 1.414 ratio) */
      .certificate-sheet {
        width: 100%;
        max-width: 980px;
        aspect-ratio: 297 / 210;
        min-height: 590px;
        background: #FCFBF7;
        color: #0F172A;
        box-shadow: 0 20px 55px rgba(0, 0, 0, 0.65);
        border-radius: 6px;
        padding: 16px;
        box-sizing: border-box;
        position: relative;
        direction: rtl;
        font-family: 'Cairo', 'Tajawal', sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Subtle Security Watermark in Center */
      .cert-watermark-bg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 340px;
        height: 340px;
        opacity: 0.055;
        pointer-events: none;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cert-watermark-bg img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: grayscale(100%) contrast(150%);
      }

      .cert-outer-border {
        border: 4px solid #D97706;
        height: 100%;
        box-sizing: border-box;
        position: relative;
        padding: 6px;
        display: flex;
        flex-direction: column;
        z-index: 2;
      }

      .cert-corner {
        position: absolute;
        width: 48px;
        height: 48px;
        z-index: 10;
        pointer-events: none;
      }
      .cert-corner--tl { top: -2px; left: -2px; }
      .cert-corner--tr { top: -2px; right: -2px; }
      .cert-corner--bl { bottom: -2px; left: -2px; }
      .cert-corner--br { bottom: -2px; right: -2px; }

      .cert-inner-border {
        border: 2.5px solid #0F2744;
        height: 100%;
        box-sizing: border-box;
        padding: 12px 24px 8px 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: radial-gradient(circle at center, rgba(255,255,255,0.92) 0%, rgba(250,248,242,0.95) 70%, rgba(245,239,225,0.98) 100%);
        position: relative;
      }

      .cert-inner-border::before {
        content: '';
        position: absolute;
        inset: 4px;
        border: 1px dashed rgba(217, 119, 6, 0.45);
        pointer-events: none;
      }

      /* Header */
      .cert-header {
        text-align: center;
        margin-bottom: 4px;
        position: relative;
        z-index: 3;
      }
      .cert-crest-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        margin-bottom: 4px;
      }
      .cert-crest-emblem {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 2px;
      }
      .cert-official-logo-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.18));
      }
      .cert-platform-name {
        font-size: 16px;
        font-weight: 900;
        color: #0284C7;
        letter-spacing: 0.5px;
      }
      .cert-platform-sub {
        font-size: 11px;
        color: #64748B;
        font-weight: 700;
      }

      .cert-title-container {
        margin-top: 4px;
      }
      .cert-title-ribbon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: linear-gradient(135deg, #0F2744 0%, #1B4F72 50%, #0F2744 100%);
        padding: 6px 32px;
        border-radius: 9999px;
        border: 2px solid #D97706;
        box-shadow: 0 4px 14px rgba(15, 39, 68, 0.25);
      }
      .cert-title-decor {
        color: #F59E0B;
        font-size: 14px;
      }
      .cert-main-title {
        margin: 0;
        font-size: 23px;
        font-weight: 900;
        color: #F59E0B;
        letter-spacing: 0.5px;
      }
      .cert-sub-title {
        font-size: 9.5px;
        font-weight: 800;
        color: #64748B;
        letter-spacing: 2px;
        margin-top: 3px;
      }

      /* Body */
      .cert-body {
        text-align: center;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        z-index: 3;
        padding: 4px 0;
      }
      .cert-intro {
        font-size: 14px;
        font-weight: 800;
        color: #334155;
        margin: 0 0 4px 0;
      }
      .cert-honoree-wrap {
        margin: 4px 0 6px 0;
      }
      .cert-honoree-name {
        font-size: 32px;
        font-weight: 900;
        color: #0F2744;
        line-height: 1.25;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .cert-verified-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #38BDF8, #0284C7);
        color: #FFFFFF;
        border-radius: 50%;
        font-size: 14px;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
      }
      .cert-honoree-category {
        font-size: 14px;
        font-weight: 800;
        color: #0369A1;
        margin-top: 2px;
      }

      .cert-endorsement-text {
        max-width: 840px;
        margin: 0 auto;
        line-height: 1.65;
      }
      .cert-paragraph {
        font-size: 15px;
        font-weight: 700;
        color: #1E293B;
        margin: 4px 0;
      }
      .cert-paragraph strong {
        color: #0F2744;
        font-weight: 900;
      }
      .cert-paragraph--congrats {
        font-size: 15.5px;
        color: #B45309;
        font-weight: 800;
        margin-top: 4px;
      }
      .cert-highlight-name {
        color: #0F2744;
        font-weight: 900;
        text-decoration: underline;
        text-decoration-color: #F59E0B;
        text-underline-offset: 4px;
      }

      .cert-proud-badge {
        display: inline-block;
        background: rgba(245, 158, 11, 0.12);
        border: 1.5px solid #F59E0B;
        color: #B45309;
        padding: 5px 22px;
        border-radius: 9999px;
        font-size: 15px;
        font-weight: 900;
        margin: 6px auto 0 auto;
      }

      /* Footer */
      .cert-footer {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr;
        align-items: center;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1.5px solid rgba(217, 119, 6, 0.25);
        position: relative;
        z-index: 3;
      }

      .cert-signature-block {
        text-align: center;
      }
      .cert-sig-label {
        font-size: 11.5px;
        color: #64748B;
        font-weight: 700;
      }
      .cert-sig-authority {
        font-size: 12px;
        font-weight: 800;
        color: #0F2744;
        margin-bottom: 2px;
      }
      .cert-sig-artwork {
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cert-sig-svg {
        height: 40px;
        width: 140px;
      }
      .cert-sig-name {
        font-size: 11px;
        color: #1E293B;
        font-weight: 800;
      }

      .cert-meta-block {
        text-align: center;
        font-size: 10.5px;
        color: #64748B;
        line-height: 1.45;
      }
      .cert-meta-crest {
        font-size: 18px;
        margin-bottom: 1px;
      }
      .cert-meta-domain {
        font-size: 13.5px;
        font-weight: 900;
        color: #0284C7;
      }
      .cert-meta-serial code {
        font-family: monospace;
        color: #475569;
        font-weight: 700;
      }

      .cert-stamp-block {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .cert-official-stamp {
        width: 112px;
        height: 112px;
        transform: rotate(-8deg);
        filter: drop-shadow(0 3px 6px rgba(29, 78, 216, 0.25));
      }
      .cert-stamp-svg {
        width: 100%;
        height: 100%;
      }

      /* Direct A4 Print Rules */
      @media print {
        @page {
          size: A4 landscape;
          margin: 0;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #FCFBF7 !important;
          width: 297mm !important;
          height: 210mm !important;
          overflow: hidden !important;
        }
        body * {
          visibility: hidden !important;
        }
        #certificate-print-root, #certificate-print-root * {
          visibility: visible !important;
        }
        #certificate-print-root {
          position: fixed !important;
          inset: 0 !important;
          left: 0 !important;
          top: 0 !important;
          width: 297mm !important;
          height: 210mm !important;
          max-width: 297mm !important;
          max-height: 210mm !important;
          margin: 0 !important;
          padding: 8mm !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background: #FCFBF7 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          z-index: 99999999 !important;
        }
        .certificate-modal-toolbar, .certificate-modal-overlay {
          background: transparent !important;
          box-shadow: none !important;
        }
      }

      /* Mobile responsiveness for preview */
      @media (max-width: 768px) {
        .certificate-preview-container {
          padding: 12px 6px;
        }
        .certificate-sheet {
          min-height: auto;
          aspect-ratio: auto;
          padding: 10px;
        }
        .cert-honoree-name {
          font-size: 22px;
        }
        .cert-paragraph {
          font-size: 13px;
        }
        .cert-footer {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }
    </style>

    <div class="certificate-modal-dialog" role="dialog" aria-modal="true" aria-label="شهادة تقدير وتكريم رسمية">
      <!-- Toolbar -->
      <div class="certificate-modal-toolbar">
        <button type="button" class="certificate-modal-close" id="btn-close-cert-modal" aria-label="إغلاق النافذة">✕</button>
        
        <div class="certificate-modal-title">
          <span style="font-size:18px">🎖️</span>
          <span>شهادة تقدير وتكريم رسمية لنشاطك (مقاس A4)</span>
          <span class="certificate-owner-tag">خاص بصاحب النشاط 🔒</span>
        </div>

        <div class="certificate-modal-actions">
          <button type="button" class="btn-print-cert" id="btn-print-certificate" title="طباعة مباشرة بمقاس A4">
            <span>🖨️</span>
            <span>طباعة الشهادة (A4)</span>
          </button>
          <button type="button" class="btn-download-cert" id="btn-download-certificate" title="تحميل صورة عالية الجودة للشهادة">
            <span>📥</span>
            <span>تحميل الشهادة (PNG)</span>
          </button>
        </div>
      </div>

      <!-- Preview Container -->
      <div class="certificate-preview-container">
        <!-- A4 Landscape Certificate Canvas / Printable Frame -->
        <div id="certificate-print-root" class="certificate-sheet">
          
          <!-- Subtle Security Watermark in Background -->
          <div class="cert-watermark-bg">
            <img src="/icons/icon-192x192.png" alt="watermark" />
          </div>

          <!-- Outer Gold Border -->
          <div class="cert-outer-border">
            
            <!-- Corner Ornaments -->
            <div class="cert-corner cert-corner--tl">
              <svg viewBox="0 0 60 60"><path d="M0,0 L60,0 C35,0 0,35 0,60 Z" fill="#D97706"/><circle cx="16" cy="16" r="4" fill="#F59E0B"/><path d="M8,45 Q8,8 45,8" stroke="#B45309" stroke-width="2" fill="none"/></svg>
            </div>
            <div class="cert-corner cert-corner--tr">
              <svg viewBox="0 0 60 60"><path d="M60,0 L0,0 C25,0 60,35 60,60 Z" fill="#D97706"/><circle cx="44" cy="16" r="4" fill="#F59E0B"/><path d="M52,45 Q52,8 15,8" stroke="#B45309" stroke-width="2" fill="none"/></svg>
            </div>
            <div class="cert-corner cert-corner--bl">
              <svg viewBox="0 0 60 60"><path d="M0,60 L60,60 C35,60 0,25 0,0 Z" fill="#D97706"/><circle cx="16" cy="44" r="4" fill="#F59E0B"/><path d="M8,15 Q8,52 45,52" stroke="#B45309" stroke-width="2" fill="none"/></svg>
            </div>
            <div class="cert-corner cert-corner--br">
              <svg viewBox="0 0 60 60"><path d="M60,60 L0,60 C25,60 60,25 60,0 Z" fill="#D97706"/><circle cx="44" cy="44" r="4" fill="#F59E0B"/><path d="M52,15 Q52,52 15,52" stroke="#B45309" stroke-width="2" fill="none"/></svg>
            </div>

            <!-- Inner Navy Border -->
            <div class="cert-inner-border">
              
              <!-- Header Section -->
              <div class="cert-header">
                <div class="cert-crest-wrap">
                  <!-- Official Directory Logo -->
                  <div class="cert-crest-emblem">
                    <img src="/icons/icon-192x192.png" alt="شعار دليل المنزلة والمطرية الرسمي" class="cert-official-logo-img" />
                  </div>
                  <div class="cert-platform-name">
                    دليل المنزلة والمطرية الرقمي
                  </div>
                  <div class="cert-platform-sub">
                    المنصة الرسمية المعتمدة للأنشطة والخدمات بمحافظة الدقهلية
                  </div>
                </div>

                <!-- Main Certificate Title -->
                <div class="cert-title-container">
                  <div class="cert-title-ribbon">
                    <span class="cert-title-decor">❖</span>
                    <h1 class="cert-main-title">شهادة تقدير وتميز</h1>
                    <span class="cert-title-decor">❖</span>
                  </div>
                  <div class="cert-sub-title">CERTIFICATE OF APPRECIATION & EXCELLENCE</div>
                </div>
              </div>

              <!-- Certificate Body -->
              <div class="cert-body">
                
                <p class="cert-intro">
                  تشهد إدارة دليل المنزلة والمطرية الرقمي بأن:
                </p>

                <!-- Honoree Place Name -->
                <div class="cert-honoree-wrap">
                  <div class="cert-honoree-name">
                    ${placeName}
                    ${isVerified ? '<span class="cert-verified-badge" title="نشاط موثق رسمياً">✓</span>' : ''}
                  </div>
                  <div class="cert-honoree-category">
                    (مدرج تحت تصنيف: <strong>${displayCategory}</strong>)
                  </div>
                </div>

                <!-- Official Endorsement Text (Without Tashkeel + Dynamic Area) -->
                <div class="cert-endorsement-text">
                  <p class="cert-paragraph">
                    بأنه مشهور <strong>${locationWithBa}</strong> ولديه العديد من الزوار اليوميين في دليل المنزلة والمطرية الرقمي.
                  </p>
                  <p class="cert-paragraph">
                    كما أنه صنف من <strong>أكثر البطاقات تم البحث عنها</strong> في الدليل في آخر 30 يوماً.
                  </p>
                  <p class="cert-paragraph cert-paragraph--congrats">
                    وبناء عليه تتقدم إدارة دليل المنزلة والمطرية بكل أسمى معاني الحب والتهاني إلى
                    <span class="cert-highlight-name">${placeName}</span>.
                  </p>
                </div>

                <!-- Emotional Appreciation Note -->
                <div class="cert-proud-badge">
                  ❤️ نحن فخورين أنكم جزء منا ❤️
                </div>

              </div>

              <!-- Certificate Footer: Signatures, Stamp & Seal -->
              <div class="cert-footer">
                
                <!-- Right: Signature of Management -->
                <div class="cert-signature-block">
                  <div class="cert-sig-label">التوقيع والاعتماد</div>
                  <div class="cert-sig-authority">إدارة دليل المنزلة والمطرية الرقمي الرسمي</div>
                  <div class="cert-sig-artwork">
                    <!-- Elegant Blue Calligraphy Fountain Pen Signature -->
                    <svg viewBox="0 0 200 60" class="cert-sig-svg">
                      <path d="M20,42 Q45,15 70,30 T120,25 Q145,15 160,35 Q175,48 190,20 M75,25 Q95,48 105,18 Q115,45 135,38" 
                            fill="none" stroke="#1E3A8A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M40,38 C60,52 140,50 185,42" 
                            fill="none" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round"/>
                      <circle cx="188" cy="22" r="2.5" fill="#1E3A8A"/>
                    </svg>
                  </div>
                  <div class="cert-sig-name">م. محمد حماد — الإدارة العامة</div>
                </div>

                <!-- Center: Verification Code & Domain -->
                <div class="cert-meta-block">
                  <div class="cert-meta-crest">🎖️</div>
                  <div class="cert-meta-domain">dalilmanzala.com</div>
                  <div class="cert-meta-serial">الرقم التسلسلي: <code>${serialNumber}</code></div>
                  <div class="cert-meta-date">تاريخ الإصدار: ${formattedDate}</div>
                </div>

                <!-- Left: Official Blue Digital Stamp (Enlarged & Prominent) -->
                <div class="cert-stamp-block">
                  <div class="cert-official-stamp">
                    <svg viewBox="0 0 160 160" class="cert-stamp-svg">
                      <!-- Outer Dotted Circle -->
                      <circle cx="80" cy="80" r="75" fill="none" stroke="#1D4ED8" stroke-width="2.2" stroke-dasharray="5 3.5"/>
                      <!-- Inner Double Solid Circle -->
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#1D4ED8" stroke-width="2.8"/>
                      <circle cx="80" cy="80" r="49" fill="none" stroke="#1D4ED8" stroke-width="1.6"/>
                      
                      <!-- Top Curved Text (دليل المنزلة والمطرية الرقمي) -->
                      <path id="stampTextTop" d="M 20,80 A 60,60 0 0,1 140,80" fill="none"/>
                      <text font-size="11" font-weight="900" fill="#1D4ED8" letter-spacing="0.5">
                        <textPath href="#stampTextTop" startOffset="50%" text-anchor="middle">
                          دليل المنزلة والمطرية الرقمي
                        </textPath>
                      </text>

                      <!-- Bottom Curved Text (DALIL EL MANZALA) -->
                      <path id="stampTextBottom" d="M 140,80 A 60,60 0 0,1 20,80" fill="none"/>
                      <text font-size="9.5" font-weight="900" fill="#1D4ED8" letter-spacing="1.5">
                        <textPath href="#stampTextBottom" startOffset="50%" text-anchor="middle">
                          ★ DALIL EL MANZALA ★
                        </textPath>
                      </text>

                      <!-- Center Badge / Stars -->
                      <text x="80" y="67" font-size="13.5" font-weight="900" text-anchor="middle" fill="#1D4ED8">
                        ★ معتمد ★
                      </text>
                      <text x="80" y="83" font-size="10.5" font-weight="800" text-anchor="middle" fill="#1D4ED8">
                        إدارة التوثيق والجودة
                      </text>
                      <text x="80" y="97" font-size="9" font-weight="700" text-anchor="middle" fill="#2563EB">
                        OFFICIAL SEAL
                      </text>
                    </svg>
                  </div>
                </div>

              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Attach Print Handler
  const printBtn = overlay.querySelector('#btn-print-certificate');
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // Attach Download Handler
  const downloadBtn = overlay.querySelector('#btn-download-certificate');
  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>⏳ جاري توليد الشهادة...</span>';

    try {
      await generateCertificateCanvasDownload({
        placeName,
        categoryName: displayCategory,
        locationWithBa,
        serialNumber,
        formattedDate,
        isVerified
      });
      toast.success('تم تحميل شهادة التقدير بنجاح! نعتز بنشاطكم في دليل المنزلة 🎖️');
    } catch (err) {
      console.error('[Certificate] Export failed:', err);
      toast.error('حدث خطأ أثناء تحميل الشهادة. يمكنك استخدام زر الطباعة وحفظها كملف PDF.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<span>📥</span><span>تحميل الشهادة (PNG)</span>';
    }
  });

  // Close handlers
  const closeModal = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 200);
  };

  overlay.querySelector('#btn-close-cert-modal').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // ESC key
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
  document.addEventListener('keydown', onKeyDown);
}

/**
 * تحميل صورة بأمان مع دعم التخزين المؤقت
 */
function loadSafeImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    setTimeout(() => resolve(null), 3000);
  });
}

/**
 * محرك توليد الشهادة على HTML5 Canvas بدقة A4 أصلية فائقة (2480 × 1754 px @ 300 DPI)
 * يضمن مطابقة 100% للشكل المعروض على الشاشة
 */
async function generateCertificateCanvasDownload({
  placeName,
  categoryName,
  locationWithBa,
  serialNumber,
  formattedDate,
  isVerified
}) {
  const W = 2480;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Preload official logo
  const logoImg = await loadSafeImage('/icons/icon-192x192.png');

  // 1. Background (Parchment Ivory)
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W / 1.2);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(0.65, '#FAF8F2');
  bgGrad.addColorStop(1, '#F5EFE1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Watermark in Background
  if (logoImg) {
    ctx.save();
    ctx.globalAlpha = 0.055;
    const wmSize = 650;
    ctx.drawImage(logoImg, (W - wmSize) / 2, (H - wmSize) / 2 + 30, wmSize, wmSize);
    ctx.restore();
  }

  // 3. Luxury Gold & Navy Borders
  // Outer Gold Border
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 14;
  ctx.strokeRect(55, 55, W - 110, H - 110);

  // Middle Accent Border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.strokeRect(75, 75, W - 150, H - 150);

  // Inner Royal Navy Border
  ctx.strokeStyle = '#0F2744';
  ctx.lineWidth = 10;
  ctx.strokeRect(90, 90, W - 180, H - 180);

  // Inner dashed security border
  ctx.save();
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(106, 106, W - 212, H - 212);
  ctx.restore();

  // 4. Corner Flourishes
  const drawCorner = (cx, cy, flipX, flipY) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(85, 0);
    ctx.quadraticCurveTo(0, 0, 0, 85);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI / 2);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(28, 28, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCorner(90, 90, false, false);
  drawCorner(W - 90, 90, true, false);
  drawCorner(90, H - 90, false, true);
  drawCorner(W - 90, H - 90, true, true);

  // 5. Header: Official Logo & Platform Name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw Official Logo at top
  const logoSize = 135;
  const logoY = 175;
  if (logoImg) {
    ctx.drawImage(logoImg, (W - logoSize) / 2, logoY - logoSize / 2, logoSize, logoSize);
  }

  // Platform Name
  ctx.font = 'bold 36px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0284C7';
  ctx.fillText('دليل المنزلة والمطرية الرقمي', W / 2, 280);

  ctx.font = '600 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('المنصة الرسمية المعتمدة للأنشطة والخدمات بمحافظة الدقهلية', W / 2, 325);

  // Main Title Ribbon
  const ribbonW = 940;
  const ribbonH = 92;
  const ribbonX = (W - ribbonW) / 2;
  const ribbonY = 365;

  const ribbonGrad = ctx.createLinearGradient(ribbonX, ribbonY, ribbonX + ribbonW, ribbonY + ribbonH);
  ribbonGrad.addColorStop(0, '#0F2744');
  ribbonGrad.addColorStop(0.5, '#1B4F72');
  ribbonGrad.addColorStop(1, '#0F2744');

  ctx.fillStyle = ribbonGrad;
  ctx.beginPath();
  ctx.roundRect(ribbonX, ribbonY, ribbonW, ribbonH, 22);
  ctx.fill();

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Title Text inside Ribbon (Without Tashkeel)
  ctx.font = '900 48px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('❖  شهادة تقدير وتميز  ❖', W / 2, ribbonY + ribbonH / 2 + 2);

  // English Subtitle
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('CERTIFICATE OF APPRECIATION & EXCELLENCE', W / 2, ribbonY + ribbonH + 32);

  // 6. Body Text
  let curY = 550;

  // Intro
  ctx.font = 'bold 30px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('تشهد إدارة دليل المنزلة والمطرية الرقمي بأن:', W / 2, curY);

  curY += 72;

  // Place Name (Large, Bold, Regal)
  ctx.font = '900 66px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0F2744';
  const displayPlaceTitle = isVerified ? (placeName + ' ✓') : placeName;
  ctx.fillText(displayPlaceTitle, W / 2, curY);

  curY += 56;

  // Category
  ctx.font = 'bold 28px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0369A1';
  ctx.fillText('(مدرج تحت تصنيف: ' + categoryName + ')', W / 2, curY);

  curY += 76;

  // Exact Paragraphs without Tashkeel + with Dynamic Location
  ctx.font = 'bold 32px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('بأنه مشهور ' + locationWithBa + ' ولديه العديد من الزوار اليوميين في دليل المنزلة والمطرية الرقمي.', W / 2, curY);

  curY += 60;
  ctx.fillText('كما أنه صنف من أكثر البطاقات تم البحث عنها في الدليل في آخر 30 يوماً.', W / 2, curY);

  curY += 66;
  ctx.fillStyle = '#B45309';
  ctx.fillText('وبناء عليه تتقدم إدارة دليل المنزلة والمطرية بكل أسمى معاني الحب والتهاني إلى (' + placeName + ')', W / 2, curY);

  curY += 82;

  // Emotional Tagline Box
  const proudW = 760;
  const proudH = 64;
  const proudX = (W - proudW) / 2;
  const proudY = curY - 36;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.beginPath();
  ctx.roundRect(proudX, proudY, proudW, proudH, 32);
  ctx.fill();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '900 32px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#B45309';
  ctx.fillText('❤️ نحن فخورين أنكم جزء منا ❤️', W / 2, curY);

  // 7. Footer: Signatures & Stamp
  const footerY = 1460;

  // --- Right Side: Signature ---
  const sigCenterX = W - 460;
  ctx.font = 'bold 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('التوقيع والاعتماد', sigCenterX, footerY - 110);

  ctx.font = 'bold 22px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0F2744';
  ctx.fillText('إدارة دليل المنزلة والمطرية الرقمي الرسمي', sigCenterX, footerY - 75);

  // Signature strokes
  ctx.save();
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(sigCenterX - 140, footerY + 10);
  ctx.bezierCurveTo(sigCenterX - 100, footerY - 50, sigCenterX - 40, footerY - 20, sigCenterX, footerY - 10);
  ctx.bezierCurveTo(sigCenterX + 40, footerY, sigCenterX + 70, footerY - 60, sigCenterX + 100, footerY - 20);
  ctx.bezierCurveTo(sigCenterX + 120, footerY + 10, sigCenterX + 150, footerY - 30, sigCenterX + 160, footerY - 5);
  ctx.stroke();

  // Flourish underline
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sigCenterX - 120, footerY + 25);
  ctx.quadraticCurveTo(sigCenterX, footerY + 45, sigCenterX + 150, footerY + 15);
  ctx.stroke();
  ctx.restore();

  ctx.font = 'bold 22px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('م. محمد حماد — الإدارة العامة', sigCenterX, footerY + 65);

  // --- Center: Verification Code & Domain ---
  const metaCenterX = W / 2;
  ctx.font = 'bold 36px "Segoe UI", sans-serif';
  ctx.fillText('🎖️', metaCenterX, footerY - 80);

  ctx.font = '900 28px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0284C7';
  ctx.fillText('dalilmanzala.com', metaCenterX, footerY - 35);

  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillStyle = '#64748B';
  ctx.fillText('الرقم التسلسلي: ' + serialNumber, metaCenterX, footerY + 5);

  ctx.font = '600 20px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('تاريخ الإصدار: ' + formattedDate, metaCenterX, footerY + 40);

  // --- Left Side: Official Blue Digital Stamp (Enlarged) ---
  const stampCenterX = 450;
  const stampCenterY = footerY - 20;
  const stampR = 135; // Enlarged stamp radius

  ctx.save();
  ctx.translate(stampCenterX, stampCenterY);
  ctx.rotate(-8 * Math.PI / 180); // authentic stamp slant

  // Outer Dashed Circle
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 4;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, stampR, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Double Solid Circle
  ctx.setLineDash([]);
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(0, 0, stampR - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(0, 0, stampR - 44, 0, Math.PI * 2);
  ctx.stroke();

  // Stamp Texts
  ctx.font = '900 21px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1D4ED8';
  ctx.fillText('دليل المنزلة والمطرية', 0, -70);

  ctx.font = '900 28px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText('★ معتمد ★', 0, -12);

  ctx.font = 'bold 20px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText('إدارة التوثيق والجودة', 0, 22);

  ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DALIL EL MANZALA', 0, 70);

  ctx.restore();

  // Trigger Download
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const safePlaceSlug = (placeName || 'مكان').replace(/[^a-zA-Z0-9؀-ۿ]+/g, '-');
  const fileName = 'شهادة-تقدير-' + safePlaceSlug + '.png';

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
