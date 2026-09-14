/**
 * CertificateOfAppreciationModal.js
 * شهادة تقدير وتكريم وتَمَيُّز رسمية لنشاط المكان من دليل المنزلة والمطرية الرقمي
 * بمقاس A4 أفقي قياسي (A4 Landscape - 297mm x 210mm)
 * 
 * المزايا والمواصفات:
 * 1. حذف الشعار العلوي تماماً والاعتماد على ترويسة ملكية راقية
 * 2. اعتماد النص الجديد الرسمي المعتمد بالكامل
 * 3. خلو النص من التشكيل المعقد لخط عربي حديث وفخم وواضح
 * 4. تكبير الختم الرسمي الأزرق المعتمد ووضعه بدقة بالجهة اليسرى
 * 5. توقيع رقمي أصلي للمهندس محمد حماد
 * 6. علامة مائية شعار أمان خفيفة بدون أي مربعات أو حواف
 * 7. مطابقة 100% بين المعاينة والطباعة المباشرة والتحميل (صفحة واحدة A4 بدون أي تشوه أو انقسام)
 */

import { toast } from './Toast.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { toArabicCategory } from '../../utils/category-i18n.js';
import { getCached } from '../../core/db.js';
import { checkIsPlaceVerified } from './PlaceProfileCardModal.js';

/**
 * دالة إنشاء الختم الرقمي المعتمد بصيغة SVG نقي فائق الوضوح
 */
export function getOfficialSealSvgMarkup(size = 160) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 160 160" width="${size}" height="${size}" class="cert-stamp-svg">
      <!-- Outer Dotted Security Circle -->
      <circle cx="80" cy="80" r="76" fill="none" stroke="#1D4ED8" stroke-width="2.2" stroke-dasharray="5 3.5"/>
      <!-- Inner Double Solid Circle -->
      <circle cx="80" cy="80" r="70" fill="none" stroke="#1D4ED8" stroke-width="2.8"/>
      <circle cx="80" cy="80" r="49" fill="none" stroke="#1D4ED8" stroke-width="1.6"/>
      
      <defs>
        <path id="stampTextTopPath" d="M 20,80 A 60,60 0 0,1 140,80" fill="none"/>
        <path id="stampTextBottomPath" d="M 140,80 A 60,60 0 0,1 20,80" fill="none"/>
      </defs>

      <!-- Top Curved Text (دليل المنزلة والمطرية الرقمي) -->
      <text font-size="11.5" font-weight="900" fill="#1D4ED8" letter-spacing="0.5" font-family="'Cairo', 'Segoe UI', sans-serif">
        <textPath href="#stampTextTopPath" xlink:href="#stampTextTopPath" startOffset="50%" text-anchor="middle">
          دليل المنزلة والمطرية الرقمي
        </textPath>
      </text>

      <!-- Bottom Curved Text (DALIL EL MANZALA) -->
      <text font-size="9.5" font-weight="900" fill="#1D4ED8" letter-spacing="1.5" font-family="'Segoe UI', Arial, sans-serif">
        <textPath href="#stampTextBottomPath" xlink:href="#stampTextBottomPath" startOffset="50%" text-anchor="middle">
          ★ DALIL EL MANZALA ★
        </textPath>
      </text>

      <!-- Center Badge & Official Text -->
      <text x="80" y="67" font-size="13.5" font-weight="900" text-anchor="middle" fill="#1D4ED8" font-family="'Cairo', 'Segoe UI', sans-serif">
        ★ معتمد ★
      </text>
      <text x="80" y="83" font-size="10.5" font-weight="800" text-anchor="middle" fill="#1D4ED8" font-family="'Cairo', 'Segoe UI', sans-serif">
        إدارة التوثيق والجودة
      </text>
      <text x="80" y="97" font-size="9" font-weight="700" text-anchor="middle" fill="#2563EB" font-family="'Segoe UI', Arial, sans-serif">
        OFFICIAL SEAL
      </text>
    </svg>
  `;
}

/**
 * دالة إنشاء التوقيع الرقمي للمهندس محمد حماد
 */
export function getOfficialSignatureSvgMarkup(width = 140, height = 40) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="${width}" height="${height}" class="cert-sig-svg">
      <path d="M20,42 Q45,15 70,30 T120,25 Q145,15 160,35 Q175,48 190,20 M75,25 Q95,48 105,18 Q115,45 135,38" 
            fill="none" stroke="#1E3A8A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M40,38 C60,52 140,50 185,42" 
            fill="none" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="188" cy="22" r="2.5" fill="#1E3A8A"/>
    </svg>
  `;
}

export function openCertificateOfAppreciationModal(place = {}, category = {}) {
  const existing = document.getElementById('certificate-modal-overlay');
  if (existing) existing.remove();

  const safePlace = place || {};
  const safeCategory = category || {};

  const placeName = (safePlace.name || 'اسم النشاط').trim();
  const rawCustom = (safePlace.customCategory || safePlace.custom_category || '').trim();
  let rawCatName = (safeCategory?.name || safePlace.categoryName || safePlace.category_name || '').trim();
  const targetCatId = (safePlace.categoryId || safePlace.category_id || '').trim().toLowerCase();

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
  const docInfo = resolveDoctorSpecialty(safePlace, safeCategory);
  const displayCategory = (safePlace.medicalSpecialty && String(safePlace.medicalSpecialty).trim())
    ? safePlace.medicalSpecialty.trim()
    : (docInfo.isDoctor && (docInfo.specialtyLabel || docInfo.specialtyTitle)
        ? (docInfo.specialtyLabel || docInfo.specialtyTitle)
        : categoryName);

  const isVerified = checkIsPlaceVerified(safePlace);

  const now = new Date();
  const issueYear = now.getFullYear();
  const rawId = (safePlace.id || safePlace._key || safePlace.slug || '00000').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
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
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
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
        max-width: 1100px;
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
        padding: 20px 14px;
        background: #070D1C;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      /* The Standard A4 Landscape Certificate Sheet (297mm x 210mm ~ 1.414 ratio) */
      .certificate-sheet {
        width: 100%;
        max-width: 980px;
        min-width: 740px;
        aspect-ratio: 297 / 210;
        background: #FCFBF7;
        color: #0F172A;
        box-shadow: 0 20px 55px rgba(0, 0, 0, 0.65);
        border-radius: 6px;
        padding: 12px;
        box-sizing: border-box;
        position: relative;
        direction: rtl;
        font-family: 'Cairo', 'Tajawal', sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Subtle Security Watermark Vector Emblem in Center */
      .cert-watermark-bg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 320px;
        height: 320px;
        opacity: 0.04;
        pointer-events: none;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
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
        padding: 12px 26px 10px 26px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(250,248,242,0.96) 65%, rgba(245,239,225,0.98) 100%);
        position: relative;
      }

      .cert-inner-border::before {
        content: '';
        position: absolute;
        inset: 4px;
        border: 1px dashed rgba(217, 119, 6, 0.4);
        pointer-events: none;
      }

      /* Header (Without top logo) */
      .cert-header {
        text-align: center;
        margin-bottom: 2px;
        position: relative;
        z-index: 3;
      }
      .cert-platform-name {
        font-size: 16.5px;
        font-weight: 900;
        color: #0284C7;
        letter-spacing: 0.5px;
        line-height: 1.2;
      }
      .cert-platform-sub {
        font-size: 11px;
        color: #64748B;
        font-weight: 700;
        margin-top: 1px;
      }

      .cert-title-container {
        margin-top: 5px;
      }
      .cert-title-ribbon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: linear-gradient(135deg, #0F2744 0%, #1B4F72 50%, #0F2744 100%);
        padding: 5px 34px;
        border-radius: 9999px;
        border: 2px solid #D97706;
        box-shadow: 0 4px 12px rgba(15, 39, 68, 0.25);
      }
      .cert-title-decor {
        color: #F59E0B;
        font-size: 13px;
      }
      .cert-main-title {
        margin: 0;
        font-size: 21px;
        font-weight: 900;
        color: #F59E0B;
        letter-spacing: 0.5px;
      }
      .cert-sub-title {
        font-size: 8.5px;
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
        font-size: 13px;
        font-weight: 800;
        color: #334155;
        margin: 0 0 3px 0;
      }
      .cert-honoree-wrap {
        margin: 2px 0 4px 0;
      }
      .cert-honoree-name {
        font-size: 28px;
        font-weight: 900;
        color: #0F2744;
        line-height: 1.2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: nowrap;
      }
      .cert-verified-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #38BDF8, #0284C7);
        color: #FFFFFF;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
      }
      .cert-honoree-category {
        font-size: 12.5px;
        font-weight: 800;
        color: #0369A1;
        margin-top: 2px;
      }

      .cert-endorsement-text {
        max-width: 860px;
        margin: 2px auto;
        line-height: 1.55;
      }
      .cert-paragraph {
        font-size: 12.5px;
        font-weight: 700;
        color: #1E293B;
        margin: 3px 0;
      }
      .cert-paragraph strong {
        color: #0F2744;
        font-weight: 900;
      }
      
      .cert-quote-tag {
        font-size: 12px;
        font-weight: 800;
        color: #B45309;
        font-style: italic;
        margin: 3px 0;
      }

      .cert-proud-badge {
        display: inline-block;
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid #F59E0B;
        color: #92400E;
        padding: 4px 18px;
        border-radius: 9999px;
        font-size: 11.5px;
        font-weight: 800;
        margin: 4px auto 0 auto;
        line-height: 1.4;
      }

      /* Footer */
      .cert-footer {
        display: grid;
        grid-template-columns: 1.3fr 1fr 1fr;
        align-items: center;
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1.5px solid rgba(217, 119, 6, 0.25);
        position: relative;
        z-index: 3;
      }

      .cert-signature-block {
        text-align: center;
      }
      .cert-sig-authority {
        font-size: 11.5px;
        font-weight: 900;
        color: #0F2744;
        margin-bottom: 1px;
      }
      .cert-sig-label {
        font-size: 10px;
        color: #64748B;
        font-weight: 700;
      }
      .cert-sig-artwork {
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cert-sig-name {
        font-size: 10.5px;
        color: #1E293B;
        font-weight: 800;
      }

      .cert-meta-block {
        text-align: center;
        font-size: 10px;
        color: #64748B;
        line-height: 1.4;
      }
      .cert-meta-crest {
        font-size: 17px;
        margin-bottom: 1px;
      }
      .cert-meta-domain {
        font-size: 12.5px;
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
        filter: drop-shadow(0 2px 5px rgba(29, 78, 216, 0.25));
      }
      .cert-stamp-svg {
        width: 100%;
        height: 100%;
      }

      /* Strict Single Page Print Rules (Landscape A4) */
      @media print {
        @page {
          size: A4 landscape;
          margin: 0 !important;
        }
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        html, body {
          width: 100% !important;
          height: 100% !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #FCFBF7 !important;
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
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          margin: 0 !important;
          padding: 6mm !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background: #FCFBF7 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: stretch !important;
          z-index: 99999999 !important;
        }
        #certificate-print-root .cert-outer-border {
          height: 100% !important;
          max-height: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
        #certificate-print-root .cert-inner-border {
          height: 100% !important;
          max-height: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          padding: 12px 26px 8px 26px !important;
        }
        #certificate-print-root .cert-footer {
          display: grid !important;
          grid-template-columns: 1.3fr 1fr 1fr !important;
          align-items: center !important;
          margin-top: 4px !important;
          padding-top: 4px !important;
        }
        #certificate-print-root .cert-official-stamp {
          width: 112px !important;
          height: 112px !important;
          transform: rotate(-8deg) !important;
        }
        .certificate-modal-toolbar, .certificate-modal-overlay {
          background: transparent !important;
          box-shadow: none !important;
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
          
          <!-- Subtle Security Watermark in Background (Pure Vector) -->
          <div class="cert-watermark-bg" aria-hidden="true">
            <svg viewBox="0 0 200 200" width="320" height="320" fill="none" stroke="#D97706" opacity="0.04">
              <circle cx="100" cy="100" r="92" stroke-width="2" stroke-dasharray="6 4"/>
              <circle cx="100" cy="100" r="84" stroke-width="1.5"/>
              <circle cx="100" cy="100" r="60" stroke-width="1"/>
              <polygon points="100,45 112,80 148,80 119,102 130,137 100,116 70,137 81,102 52,80 88,80" fill="#D97706" opacity="0.4"/>
            </svg>
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
              
              <!-- Header Section (Without top logo) -->
              <div class="cert-header">
                <div class="cert-platform-name">
                  دليل المنزلة والمطرية الرقمي
                </div>
                <div class="cert-platform-sub">
                  المنصة الرقمية الأولى المعتمدة للأنشطة والخدمات بالمنزلة والمطرية
                </div>

                <!-- Main Certificate Title -->
                <div class="cert-title-container">
                  <div class="cert-title-ribbon">
                    <span class="cert-title-decor">❖</span>
                    <h1 class="cert-main-title">شهادة تقدير وتميّز</h1>
                    <span class="cert-title-decor">❖</span>
                  </div>
                  <div class="cert-sub-title">CERTIFICATE OF APPRECIATION & EXCELLENCE</div>
                </div>
              </div>

              <!-- Certificate Body -->
              <div class="cert-body">
                
                <p class="cert-intro">
                  تتشرف إدارة دليل المنزلة والمطرية الرقمي بتقديم هذه الشهادة إلى
                </p>

                <!-- Honoree Place Name -->
                <div class="cert-honoree-wrap">
                  <div class="cert-honoree-name">
                    <span>${placeName}</span>
                    ${isVerified ? '<span class="cert-verified-badge" title="نشاط موثق رسمياً">✓</span>' : ''}
                  </div>
                  <div class="cert-honoree-category">
                    (تصنيف: <strong>${displayCategory}</strong>)
                  </div>
                </div>

                <!-- Official Endorsement Text -->
                <div class="cert-endorsement-text">
                  <p class="cert-paragraph">
                    تقديرًا للحضور المميز، والمكانة البارزة، والمساهمة الفعّالة في المجتمع المحلي، وما يحظى به من اهتمام وتفاعل ملحوظ لدى جمهور مدينة المنزلة والمطرية.
                  </p>
                  <p class="cert-paragraph">
                    ويأتي هذا التكريم استنادًا إلى مؤشرات التفاعل والبحث والرواج المسجلة على منصة دليل المنزلة والمطرية الرقمي، حيث حققت بطاقة <strong>[${placeName}]</strong> حضورًا متقدمًا ضمن أكثر البطاقات بحثًا وزيارة خلال آخر 30 يومًا.
                  </p>
                  <p class="cert-paragraph">
                    وإيمانًا منّا بأن التميّز الحقيقي يستحق أن يُرى، ويُقدَّر، ويُوثَّق، تتقدم إدارة دليل المنزلة والمطرية الرقمي بخالص التقدير والاعتزاز بهذا الحضور المميز، مع أطيب التمنيات بدوام النجاح والتألق والعطاء.
                  </p>
                  <div class="cert-quote-tag">
                    «التميّز لا يُقاس بالحضور فقط... بل بالأثر الذي يتركه.»
                  </div>
                </div>

                <!-- Appreciation Tagline -->
                <div class="cert-proud-badge">
                  شكراً لكم.. «أنتم لا تظهرون في الدليل فقط... بل أنتم جزء من قصته ونجاحه.» ومع خالص التقدير والامتنان
                </div>

              </div>

              <!-- Certificate Footer: Signatures, Stamp & Seal -->
              <div class="cert-footer">
                
                <!-- Right: Signature of Management -->
                <div class="cert-signature-block">
                  <div class="cert-sig-authority">إدارة دليل المنزلة والمطرية الرقمي</div>
                  <div class="cert-sig-label">الدليل الرقمي الأول من نوعه في المنزلة والمطرية</div>
                  <div class="cert-sig-artwork">
                    ${getOfficialSignatureSvgMarkup(140, 38)}
                  </div>
                  <div class="cert-sig-name">مهندس محمد حماد — المدير العام</div>
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
                    ${getOfficialSealSvgMarkup(112)}
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
 * يضمن مطابقة 100% للشكل المعروض على الشاشة بما في ذلك الختم والنصوص والتوقيع
 */
async function generateCertificateCanvasDownload({
  placeName,
  categoryName,
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

  // Preload SVG Seal Stamp and Signature as High-Res Vectors
  const sealSvgString = getOfficialSealSvgMarkup(360);
  const sigSvgString = getOfficialSignatureSvgMarkup(320, 90);

  const [sealImg, sigImg] = await Promise.all([
    loadSafeImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sealSvgString)),
    loadSafeImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sigSvgString))
  ]);

  // 1. Background (Parchment Ivory)
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W / 1.2);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(0.65, '#FAF8F2');
  bgGrad.addColorStop(1, '#F5EFE1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Vector Security Watermark in Center
  ctx.save();
  ctx.strokeStyle = '#D97706';
  ctx.fillStyle = '#D97706';
  ctx.globalAlpha = 0.035;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 380, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 320, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 240, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

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
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
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

  // 5. Header Section (No top logo)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Platform Name
  ctx.font = '900 38px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0284C7';
  ctx.fillText('دليل المنزلة والمطرية الرقمي', W / 2, 175);

  ctx.font = '700 23px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('المنصة الرقمية الأولى المعتمدة للأنشطة والخدمات بالمنزلة والمطرية', W / 2, 220);

  // Main Title Ribbon
  const ribbonW = 920;
  const ribbonH = 84;
  const ribbonX = (W - ribbonW) / 2;
  const ribbonY = 255;

  const ribbonGrad = ctx.createLinearGradient(ribbonX, ribbonY, ribbonX + ribbonW, ribbonY + ribbonH);
  ribbonGrad.addColorStop(0, '#0F2744');
  ribbonGrad.addColorStop(0.5, '#1B4F72');
  ribbonGrad.addColorStop(1, '#0F2744');

  ctx.fillStyle = ribbonGrad;
  ctx.beginPath();
  ctx.roundRect(ribbonX, ribbonY, ribbonW, ribbonH, 20);
  ctx.fill();

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Title Text inside Ribbon
  ctx.font = '900 44px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('❖  شهادة تقدير وتميّز  ❖', W / 2, ribbonY + ribbonH / 2 + 2);

  // English Subtitle
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('CERTIFICATE OF APPRECIATION & EXCELLENCE', W / 2, ribbonY + ribbonH + 28);

  // 6. Body Text
  let curY = 430;

  // Intro
  ctx.font = 'bold 28px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('تتشرف إدارة دليل المنزلة والمطرية الرقمي بتقديم هذه الشهادة إلى', W / 2, curY);

  curY += 70;

  // Place Name (Large, Bold, Regal)
  ctx.font = '900 62px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0F2744';
  const displayPlaceTitle = isVerified ? (placeName + ' ✓') : placeName;
  ctx.fillText(displayPlaceTitle, W / 2, curY);

  curY += 56;

  // Category
  ctx.font = 'bold 27px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0369A1';
  ctx.fillText('(تصنيف: ' + categoryName + ')', W / 2, curY);

  curY += 75;

  // Paragraph 1
  ctx.font = '700 27px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('تقديرًا للحضور المميز، والمكانة البارزة، والمساهمة الفعّالة في المجتمع المحلي،', W / 2, curY);
  curY += 44;
  ctx.fillText('وما يحظى به من اهتمام وتفاعل ملحوظ لدى جمهور مدينة المنزلة والمطرية.', W / 2, curY);

  curY += 66;

  // Paragraph 2
  ctx.fillText('ويأتي هذا التكريم استنادًا إلى مؤشرات التفاعل والبحث والرواج المسجلة على منصة دليل المنزلة والمطرية الرقمي،', W / 2, curY);
  curY += 44;
  ctx.fillText('حيث حققت بطاقة [' + placeName + '] حضورًا متقدمًا ضمن أكثر البطاقات بحثًا وزيارة خلال آخر 30 يومًا.', W / 2, curY);

  curY += 66;

  // Paragraph 3
  ctx.fillText('وإيمانًا منّا بأن التميّز الحقيقي يستحق أن يُرى، ويُقدَّر، ويُوثَّق، تتقدم إدارة دليل المنزلة والمطرية الرقمي بخالص التقدير والاعتزاز', W / 2, curY);
  curY += 44;
  ctx.fillText('بهذا الحضور المميز، مع أطيب التمنيات بدوام النجاح والتألق والعطاء.', W / 2, curY);

  curY += 65;

  // Quote 1
  ctx.font = '900 26px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#B45309';
  ctx.fillText('«التميّز لا يُقاس بالحضور فقط... بل بالأثر الذي يتركه.»', W / 2, curY);

  curY += 65;

  // Appreciation Tagline Box
  const proudW = 1400;
  const proudH = 62;
  const proudX = (W - proudW) / 2;
  const proudY = curY - 31;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.beginPath();
  ctx.roundRect(proudX, proudY, proudW, proudH, 31);
  ctx.fill();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '800 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#92400E';
  ctx.fillText('شكراً لكم.. «أنتم لا تظهرون في الدليل فقط... بل أنتم جزء من قصته ونجاحه.» ومع خالص التقدير والامتنان', W / 2, curY);

  // 7. Footer: Signatures & Stamp
  const footerY = 1475;

  // --- Right Side: Signature ---
  const sigCenterX = W - 460;
  ctx.font = 'bold 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0F2744';
  ctx.fillText('إدارة دليل المنزلة والمطرية الرقمي', sigCenterX, footerY - 95);

  ctx.font = '700 19px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('الدليل الرقمي الأول من نوعه في المنزلة والمطرية', sigCenterX, footerY - 65);

  // Signature image or fallback stroke
  if (sigImg) {
    ctx.drawImage(sigImg, sigCenterX - 130, footerY - 45, 260, 75);
  } else {
    ctx.save();
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sigCenterX - 100, footerY);
    ctx.bezierCurveTo(sigCenterX - 60, footerY - 40, sigCenterX, footerY - 10, sigCenterX + 50, footerY - 20);
    ctx.bezierCurveTo(sigCenterX + 70, footerY - 10, sigCenterX + 90, footerY + 10, sigCenterX + 110, footerY - 5);
    ctx.stroke();
    ctx.restore();
  }

  ctx.font = 'bold 22px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('مهندس محمد حماد — المدير العام', sigCenterX, footerY + 55);

  // --- Center: Verification Code & Domain ---
  const metaCenterX = W / 2;
  ctx.font = 'bold 36px "Segoe UI", sans-serif';
  ctx.fillText('🎖️', metaCenterX, footerY - 80);

  ctx.font = '900 27px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0284C7';
  ctx.fillText('dalilmanzala.com', metaCenterX, footerY - 35);

  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillStyle = '#64748B';
  ctx.fillText('الرقم التسلسلي: ' + serialNumber, metaCenterX, footerY + 5);

  ctx.font = '600 20px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('تاريخ الإصدار: ' + formattedDate, metaCenterX, footerY + 40);

  // --- Left Side: Official Blue Digital Stamp ---
  const stampCenterX = 450;
  const stampCenterY = footerY - 15;
  const stampSize = 250;

  ctx.save();
  ctx.translate(stampCenterX, stampCenterY);
  ctx.rotate(-8 * Math.PI / 180);

  if (sealImg) {
    ctx.drawImage(sealImg, -stampSize / 2, -stampSize / 2, stampSize, stampSize);
  } else {
    // Fallback Canvas Stamp
    const stampR = stampSize / 2;
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 4;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, stampR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, stampR - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, stampR - 44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '900 20px "Cairo", "Segoe UI", sans-serif';
    ctx.fillStyle = '#1D4ED8';
    ctx.fillText('دليل المنزلة والمطرية', 0, -65);

    ctx.font = '900 26px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('★ معتمد ★', 0, -10);

    ctx.font = 'bold 19px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('إدارة التوثيق والجودة', 0, 22);

    ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
    ctx.fillText('DALIL EL MANZALA', 0, 65);
  }

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
