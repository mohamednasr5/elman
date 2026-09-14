/**
 * CertificateOfAppreciationModal.js
 * شهادة تقدير وتكريم وتَمَيُّز رسمية لنشاط المكان من دليل المنزلة والمطرية الرقمي
 * بمقاس A4 أفقي قياسي (A4 Landscape - 297mm x 210mm)
 * 
 * المزايا والمواصفات المحدثة:
 * 1. حذف الشعار العلوي تماماً
 * 2. توزيع متناسق ومدروس لكامل مساحة الشهادة لمنع أي فراغات غير مبررة
 * 3. تكبير الختم الأزرق المعتمد ليكون بارزاً وفخماً وواضحاً (142px في العرض و380px في التحميل)
 * 4. تصحيح اتجاه نصوص الختم المقوسة (DALIL EL MANZALA) لتقرأ معتدلة للأعلى بدون أي قلب
 * 5. رسم شارة التوثيق الزرقاء المعتمدة بجانب اسم المكان في ملف الصورة المحملة مطابقة للمعاينة 100%
 * 6. ضبط دقيق للطباعة على صفحة واحدة A4 بدون أي تشوه
 */

import { toast } from './Toast.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { toArabicCategory } from '../../utils/category-i18n.js';
import { getCached } from '../../core/db.js';
import { checkIsPlaceVerified } from './PlaceProfileCardModal.js';

/**
 * دالة إنشاء الختم الرقمي المعتمد بصيغة SVG نقي فائق الوضوح (مع نصوص مقوسة معتدلة)
 */
export function getOfficialSealSvgMarkup(size = 180) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" width="${size}" height="${size}" class="cert-stamp-svg">
      <!-- Disc Background to prevent overlapping underlying certificate border lines -->
      <circle cx="100" cy="100" r="95" fill="#FCFBF7"/>

      <!-- Outer Dotted Security Circle -->
      <circle cx="100" cy="100" r="95" fill="none" stroke="#1D4ED8" stroke-width="2.6" stroke-dasharray="6 4"/>
      <!-- Inner Double Solid Circle -->
      <circle cx="100" cy="100" r="88" fill="none" stroke="#1D4ED8" stroke-width="3.2"/>
      <circle cx="100" cy="100" r="62" fill="none" stroke="#1D4ED8" stroke-width="2"/>
      
      <defs>
        <!-- Top arc: baseline at r=72 centered neatly between r=62 and r=88 -->
        <path id="dlmStampTopPath" d="M 28,100 A 72,72 0 0,1 172,100" fill="none"/>
        <!-- Bottom arc: baseline at r=74 facing center -->
        <path id="dlmStampBottomPath" d="M 26,100 A 74,74 0 0,0 174,100" fill="none"/>
      </defs>

      <!-- Top Curved Text (دليل المنزلة والمطرية الرقمي) -->
      <text font-size="12" font-weight="900" fill="#1D4ED8" letter-spacing="0.3" font-family="'Cairo', 'Segoe UI', sans-serif">
        <textPath href="#dlmStampTopPath" xlink:href="#dlmStampTopPath" startOffset="50%" text-anchor="middle">
          دليل المنزلة والمطرية الرقمي
        </textPath>
      </text>

      <!-- Bottom Curved Text (DALIL EL MANZALA) - Reads upright facing center -->
      <text font-size="10.5" font-weight="900" fill="#1D4ED8" letter-spacing="1.5" font-family="'Segoe UI', Arial, sans-serif">
        <textPath href="#dlmStampBottomPath" xlink:href="#dlmStampBottomPath" startOffset="50%" text-anchor="middle">
          ★ DALIL EL MANZALA ★
        </textPath>
      </text>

      <!-- Center Badge & Official Text -->
      <text x="100" y="86" font-size="15" font-weight="900" text-anchor="middle" fill="#1D4ED8" font-family="'Cairo', 'Segoe UI', sans-serif">
        ★ مـعـتـمـد ★
      </text>
      <text x="100" y="104" font-size="11.5" font-weight="800" text-anchor="middle" fill="#1D4ED8" font-family="'Cairo', 'Segoe UI', sans-serif">
        إدارة التوثيق والجودة
      </text>
      <text x="100" y="121" font-size="9" font-weight="800" text-anchor="middle" fill="#2563EB" letter-spacing="1.5" font-family="'Segoe UI', Arial, sans-serif">
        OFFICIAL SEAL
      </text>
    </svg>
  `;
}

/**
 * دالة إنشاء التوقيع الرقمي للمهندس محمد حماد
 */
export function getOfficialSignatureSvgMarkup(width = 160, height = 45) {
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

  const rawSlug = (safePlace.slug || safePlace.id || safePlace._key || '').trim();
  const placeSlug = String(rawSlug).replace(/-[a-z0-9_]{5,7}$/i, '') || rawSlug;
  const placeUrl = placeSlug ? `https://dalilmanzala.com/${encodeURIComponent(placeSlug)}` : 'https://dalilmanzala.com';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(placeUrl)}&format=png&margin=1`;

  const overlay = document.createElement('div');
  overlay.id = 'certificate-modal-overlay';
  overlay.className = 'certificate-modal-overlay animate-fade-in';

  overlay.innerHTML = `
    <style id="certificate-modal-styles">
      @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800;900&display=swap');

      .certificate-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.92);
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

      /* Subtle Security Watermark Vector in Center */
      .cert-watermark-bg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 340px;
        height: 340px;
        opacity: 0.038;
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
        padding: 14px 28px 12px 28px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: radial-gradient(circle at center, rgba(255,255,255,0.96) 0%, rgba(250,248,242,0.96) 65%, rgba(245,239,225,0.98) 100%);
        position: relative;
      }

      .cert-inner-border::before {
        content: '';
        position: absolute;
        inset: 4px;
        border: 1px dashed rgba(217, 119, 6, 0.4);
        pointer-events: none;
      }

      /* Header */
      .cert-header {
        text-align: center;
        margin-bottom: 4px;
        position: relative;
        z-index: 3;
      }
      .cert-platform-name {
        font-size: 17px;
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
        margin-top: 6px;
      }
      .cert-title-ribbon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: linear-gradient(135deg, #0F2744 0%, #1B4F72 50%, #0F2744 100%);
        padding: 5px 36px;
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
        font-size: 21.5px;
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
        justify-content: space-evenly;
        position: relative;
        z-index: 3;
        padding: 6px 0;
      }
      .cert-intro {
        font-family: 'Cairo', 'Tajawal', sans-serif;
        font-size: 16px;
        font-weight: 700;
        color: #334155;
        margin: 0;
      }
      .cert-honoree-wrap {
        margin: 4px 0 8px 0;
      }
      .cert-honoree-name {
        font-family: 'Cairo', 'Segoe UI', sans-serif;
        font-size: 34px;
        font-weight: 900;
        color: #0F2744;
        line-height: 1.25;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-wrap: nowrap;
      }
      .cert-verified-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #38BDF8, #0284C7);
        color: #FFFFFF;
        border-radius: 50%;
        font-size: 14px;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
      }

      .cert-endorsement-text {
        max-width: 880px;
        margin: 0 auto;
        font-family: 'Cairo', 'Tajawal', sans-serif;
      }
      .cert-paragraph {
        font-size: 14.5px;
        font-weight: 700;
        color: #1E293B;
        margin: 8px 0;
        line-height: 1.85;
        letter-spacing: 0.1px;
      }
      .cert-paragraph strong {
        color: #0F2744;
        font-weight: 900;
        font-family: 'Cairo', 'Tajawal', sans-serif;
      }
      
      .cert-quote-tag {
        font-family: 'Cairo', 'Tajawal', sans-serif;
        font-size: 14px;
        font-weight: 800;
        color: #B45309;
        font-style: normal;
        margin: 8px 0 6px 0;
      }

      .cert-proud-badge {
        display: inline-block;
        background: rgba(245, 158, 11, 0.12);
        border: 1.5px solid #F59E0B;
        color: #92400E;
        padding: 6px 24px;
        border-radius: 9999px;
        font-family: 'Cairo', 'Tajawal', sans-serif;
        font-size: 13px;
        font-weight: 700;
        margin: 4px auto 0 auto;
        line-height: 1.5;
      }

      /* Footer */
      .cert-footer {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 16px;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1.5px solid rgba(217, 119, 6, 0.25);
        position: relative;
        z-index: 3;
      }

      .cert-signature-block {
        text-align: center;
      }
      .cert-sig-authority {
        font-size: 12px;
        font-weight: 900;
        color: #0F2744;
        margin-bottom: 1px;
      }
      .cert-sig-label {
        font-size: 10.5px;
        color: #64748B;
        font-weight: 700;
      }
      .cert-sig-artwork {
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cert-sig-name {
        font-size: 11px;
        color: #1E293B;
        font-weight: 800;
      }

      .cert-meta-block {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        text-align: right;
        background: #FFFFFF;
        border: 1.5px solid #CBD5E1;
        border-radius: 12px;
        padding: 6px 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
      }
      .cert-qr-frame {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 3px;
        flex-shrink: 0;
      }
      .cert-qr-img {
        width: 52px;
        height: 52px;
        display: block;
        border-radius: 4px;
        object-fit: contain;
      }
      .cert-qr-label {
        font-size: 8.5px;
        font-weight: 800;
        color: #0369A1;
        margin-top: 2px;
        white-space: nowrap;
        font-family: 'Cairo', sans-serif;
      }
      .cert-meta-texts {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        font-size: 11px;
        color: #475569;
        line-height: 1.5;
        white-space: nowrap;
      }
      .cert-meta-domain {
        font-size: 13.5px;
        font-weight: 900;
        color: #0284C7;
        text-decoration: none;
        direction: ltr;
        display: inline-block;
        font-family: 'Cairo', sans-serif;
      }
      .cert-meta-domain:hover {
        text-decoration: underline;
      }
      .cert-meta-serial {
        font-size: 11px;
        font-weight: 700;
        color: #334155;
      }
      .cert-meta-serial code {
        font-family: 'Cairo', monospace;
        color: #0F2744;
        font-weight: 800;
      }
      .cert-meta-date {
        font-size: 10px;
        font-weight: 700;
        color: #64748B;
      }

      /* Prominent Enlarged Stamp */
      .cert-stamp-block {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .cert-official-stamp {
        width: 142px;
        height: 142px;
        transform: rotate(-8deg);
        filter: drop-shadow(0 3px 6px rgba(29, 78, 216, 0.28));
      }
      .cert-stamp-svg {
        width: 100%;
        height: 100%;
      }

      /* Strict Single Page Print Rules (Landscape A4) with Full Color Preservation */
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
        :root {
          color-scheme: light !important;
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
          background-color: #FCFBF7 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body * {
          visibility: hidden !important;
        }
        #certificate-print-root, #certificate-print-root * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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
          background-color: #FCFBF7 !important;
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
          border-color: #D97706 !important;
        }
        #certificate-print-root .cert-inner-border {
          height: 100% !important;
          max-height: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          padding: 12px 28px 8px 28px !important;
          border-color: #0F2744 !important;
          background: radial-gradient(circle at center, rgba(255,255,255,0.96) 0%, rgba(250,248,242,0.96) 65%, rgba(245,239,225,0.98) 100%) !important;
          background-color: #FAF8F2 !important;
        }
        #certificate-print-root .cert-title-ribbon {
          background: linear-gradient(135deg, #0F2744 0%, #1B4F72 50%, #0F2744 100%) !important;
          background-color: #0F2744 !important;
          border-color: #D97706 !important;
          filter: none !important;
          -webkit-filter: none !important;
        }
        #certificate-print-root .cert-main-title {
          color: #F59E0B !important;
        }
        #certificate-print-root .cert-platform-name {
          color: #0284C7 !important;
        }
        #certificate-print-root .cert-honoree-name {
          color: #0F2744 !important;
        }
        #certificate-print-root .cert-verified-badge {
          background: #0284C7 !important;
          color: #FFFFFF !important;
        }
        #certificate-print-root .cert-quote-tag {
          color: #B45309 !important;
        }
        #certificate-print-root .cert-proud-badge {
          background: rgba(245, 158, 11, 0.12) !important;
          border-color: #F59E0B !important;
          color: #92400E !important;
        }
        #certificate-print-root .cert-footer {
          display: grid !important;
          grid-template-columns: 1fr auto 1fr !important;
          align-items: center !important;
          gap: 16px !important;
          margin-top: 4px !important;
          padding-top: 4px !important;
          border-color: rgba(217, 119, 6, 0.25) !important;
        }
        #certificate-print-root .cert-meta-block {
          background: #FFFFFF !important;
          border: 1.5px solid #CBD5E1 !important;
          border-radius: 10px !important;
          padding: 5px 12px !important;
          gap: 12px !important;
        }
        #certificate-print-root .cert-official-stamp {
          width: 142px !important;
          height: 142px !important;
          transform: rotate(-8deg) !important;
          filter: none !important;
          -webkit-filter: none !important;
        }
        #certificate-print-root .cert-stamp-svg,
        #certificate-print-root .cert-sig-svg {
          filter: none !important;
          -webkit-filter: none !important;
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
            <svg viewBox="0 0 200 200" width="340" height="340" fill="none" stroke="#D97706" opacity="0.04">
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
              
              <!-- Header Section -->
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
                    <h1 class="cert-main-title">شهادة تقدير وتميز</h1>
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
                </div>

                <!-- Official Endorsement Text (Without diacritics / Tashkeel) -->
                <div class="cert-endorsement-text">
                  <p class="cert-paragraph">
                    تقديرا للحضور المميز والمكانة البارزة والمساهمة الفعالة في المجتمع المحلي، وما يحظى به من اهتمام وتفاعل ملحوظ لدى جمهور مدينة المنزلة والمطرية.
                  </p>
                  <p class="cert-paragraph">
                    ويأتي هذا التكريم استنادا إلى مؤشرات التفاعل والبحث والرواج المسجلة على منصة دليل المنزلة والمطرية الرقمي، حيث حققت بطاقة <strong>[${placeName}]</strong> حضورا متقدما ضمن أكثر البطاقات بحثا وزيارة خلال آخر 30 يوما.
                  </p>
                  <p class="cert-paragraph">
                    وإيمانا منا بأن التميز الحقيقي يستحق أن يرى ويقدر ويوثق، تتقدم إدارة دليل المنزلة والمطرية الرقمي بخالص التقدير والاعتزاز بهذا الحضور المميز، مع أطيب التمنيات بدوام النجاح والتألق والعطاء.
                  </p>
                  <div class="cert-quote-tag">
                    «التميز لا يقاس بالحضور فقط... بل بالأثر الذي يتركه»
                  </div>
                </div>

                <!-- Appreciation Tagline -->
                <div class="cert-proud-badge">
                  شكرا لكم.. «أنتم لا تظهرون في الدليل فقط... بل أنتم جزء من قصته ونجاحه» ومع خالص التقدير والامتنان
                </div>

              </div>

              <!-- Certificate Footer: Signatures, Stamp & Seal -->
              <div class="cert-footer">
                
                <!-- Right: Signature of Management -->
                <div class="cert-signature-block">
                  <div class="cert-sig-authority">إدارة دليل المنزلة والمطرية الرقمي</div>
                  <div class="cert-sig-label">الدليل الرقمي الأول من نوعه في المنزلة والمطرية</div>
                  <div class="cert-sig-artwork">
                    ${getOfficialSignatureSvgMarkup(160, 42)}
                  </div>
                  <div class="cert-sig-name">مهندس محمد حماد — المدير العام</div>
                </div>

                <!-- Center: Verification Code & Domain with QR Code -->
                <div class="cert-meta-block">
                  <div class="cert-qr-frame">
                    <img src="${qrImageUrl}" alt="رمز التحقق" class="cert-qr-img" />
                    <span class="cert-qr-label">رمز التحقق الذكي</span>
                  </div>
                  <div class="cert-meta-texts">
                    <div class="cert-meta-domain">dalilmanzala.com</div>
                    <div class="cert-meta-serial">الرقم التسلسلي: <code>${serialNumber}</code></div>
                    <div class="cert-meta-date">تاريخ الإصدار: ${formattedDate}</div>
                  </div>
                </div>

                <!-- Left: Official Blue Digital Stamp (Enlarged & Prominent) -->
                <div class="cert-stamp-block">
                  <div class="cert-official-stamp">
                    ${getOfficialSealSvgMarkup(142)}
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
        isVerified,
        qrImageUrl,
        placeUrl
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
    setTimeout(() => resolve(null), 3500);
  });
}

/**
 * محرك توليد الشهادة على HTML5 Canvas بدقة A4 أصلية فائقة (2480 × 1754 px @ 300 DPI)
 * موزعة بانتظام ملكي كامل بدون أي فراغات فارغة، ومع ختم كبير مائل وشارة توثيق زرقاء مطابقة 100%
 */
async function generateCertificateCanvasDownload({
  placeName,
  categoryName,
  serialNumber,
  formattedDate,
  isVerified,
  qrImageUrl,
  placeUrl
}) {
  const W = 2480;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Ensure professional fonts (like Amiri) are fully rendered before drawing
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  // Preload SVG Seal Stamp, Signature, and QR Code as High-Res Assets
  const sealSvgString = getOfficialSealSvgMarkup(420);
  const sigSvgString = getOfficialSignatureSvgMarkup(360, 100);

  const [sealImg, sigImg, qrImg] = await Promise.all([
    loadSafeImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sealSvgString)),
    loadSafeImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sigSvgString)),
    loadSafeImage(qrImageUrl)
  ]);

  // 1. Background (Parchment Ivory)
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 250, W / 2, H / 2, W / 1.15);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(0.65, '#FAF8F2');
  bgGrad.addColorStop(1, '#F5EFE1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Vector Security Watermark in Center
  ctx.save();
  ctx.strokeStyle = '#D97706';
  ctx.fillStyle = '#D97706';
  ctx.globalAlpha = 0.038;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 420, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 350, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 260, 0, Math.PI * 2);
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

  // 5. Header Section (Without top logo)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Platform Name
  ctx.font = '900 42px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0284C7';
  ctx.fillText('دليل المنزلة والمطرية الرقمي', W / 2, 160);

  ctx.font = '700 23px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('المنصة الرقمية الأولى المعتمدة للأنشطة والخدمات بالمنزلة والمطرية', W / 2, 205);

  // Main Title Ribbon
  const ribbonW = 980;
  const ribbonH = 88;
  const ribbonX = (W - ribbonW) / 2;
  const ribbonY = 240;

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

  // Title Text inside Ribbon
  ctx.font = '900 48px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('❖  شهادة تقدير وتميز  ❖', W / 2, ribbonY + ribbonH / 2 + 2);

  // English Subtitle
  ctx.font = 'bold 19px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('CERTIFICATE OF APPRECIATION & EXCELLENCE', W / 2, ribbonY + ribbonH + 28);

  // 6. Body Text (Evenly & majestically distributed to fill A4 landscape completely)
  let curY = 440;

  // Intro (Cairo bold, without diacritics)
  ctx.font = '700 32px "Cairo", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('تتشرف إدارة دليل المنزلة والمطرية الرقمي بتقديم هذه الشهادة إلى', W / 2, curY);

  curY += 85;

  // Place Name with Blue Verified Badge (Exact WYSIWYG match to DOM)
  ctx.font = '900 76px "Cairo", sans-serif';
  ctx.fillStyle = '#0F2744';
  
  if (isVerified) {
    const nameText = placeName;
    const nameMetrics = ctx.measureText(nameText);
    const badgeR = 24;
    const badgeGap = 16;
    const totalW = nameMetrics.width + badgeGap + (badgeR * 2);
    const startX = (W - totalW) / 2;
    
    // Name on the right (RTL), badge on the left
    const nameCenterX = startX + totalW - (nameMetrics.width / 2);
    ctx.fillText(nameText, nameCenterX, curY);
    
    const badgeCenterX = startX + badgeR;
    const badgeCenterY = curY;
    
    // Draw Blue Gradient Verified Badge Circle
    ctx.save();
    const badgeGrad = ctx.createLinearGradient(badgeCenterX - badgeR, badgeCenterY - badgeR, badgeCenterX + badgeR, badgeCenterY + badgeR);
    badgeGrad.addColorStop(0, '#38BDF8');
    badgeGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.arc(badgeCenterX, badgeCenterY, badgeR, 0, Math.PI * 2);
    ctx.fill();
    
    // White checkmark inside badge
    ctx.font = '900 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('✓', badgeCenterX, badgeCenterY + 1);
    ctx.restore();
  } else {
    ctx.fillText(placeName, W / 2, curY);
  }

  // Category line is completely removed as requested
  curY += 95;

  // Paragraph 1 (Cairo bold, no diacritics)
  ctx.font = '700 30px "Cairo", sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('تقديرا للحضور المميز والمكانة البارزة والمساهمة الفعالة في المجتمع المحلي،', W / 2, curY);
  curY += 56;
  ctx.fillText('وما يحظى به من اهتمام وتفاعل ملحوظ لدى جمهور مدينة المنزلة والمطرية.', W / 2, curY);

  curY += 86;

  // Paragraph 2 (Cairo bold, no diacritics)
  ctx.fillText('ويأتي هذا التكريم استنادا إلى مؤشرات التفاعل والبحث والرواج المسجلة على منصة دليل المنزلة والمطرية الرقمي،', W / 2, curY);
  curY += 56;
  ctx.fillText('حيث حققت بطاقة [' + placeName + '] حضورا متقدما ضمن أكثر البطاقات بحثا وزيارة خلال آخر 30 يوما.', W / 2, curY);

  curY += 86;

  // Paragraph 3 (Cairo bold, no diacritics)
  ctx.fillText('وإيمانا منا بأن التميز الحقيقي يستحق أن يرى ويقدر ويوثق، تتقدم إدارة دليل المنزلة والمطرية الرقمي بخالص التقدير والاعتزاز', W / 2, curY);
  curY += 56;
  ctx.fillText('بهذا الحضور المميز، مع أطيب التمنيات بدوام النجاح والتألق والعطاء.', W / 2, curY);

  curY += 86;

  // Quote (Cairo bold, no diacritics)
  ctx.font = '800 31px "Cairo", sans-serif';
  ctx.fillStyle = '#B45309';
  ctx.fillText('«التميز لا يقاس بالحضور فقط... بل بالأثر الذي يتركه»', W / 2, curY);

  curY += 84;

  // Appreciation Tagline Box (Cairo bold, no diacritics)
  const proudW = 1680;
  const proudH = 74;
  const proudX = (W - proudW) / 2;
  const proudY = curY - 37;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.beginPath();
  ctx.roundRect(proudX, proudY, proudW, proudH, 37);
  ctx.fill();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = '700 26px "Cairo", sans-serif';
  ctx.fillStyle = '#92400E';
  ctx.fillText('شكرا لكم.. «أنتم لا تظهرون في الدليل فقط... بل أنتم جزء من قصته ونجاحه» ومع خالص التقدير والامتنان', W / 2, curY);

  // Subtle separator line above footer
  ctx.save();
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, 1285);
  ctx.lineTo(W - 140, 1285);
  ctx.stroke();
  ctx.restore();

  // 7. Footer: Signatures, Metadata, QR Code, and Prominent Enlarged Stamp
  const footerY = 1465;

  // --- Right Side: Signature Block ---
  const sigCenterX = W - 480;
  ctx.font = 'bold 26px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0F2744';
  ctx.fillText('إدارة دليل المنزلة والمطرية الرقمي', sigCenterX, footerY - 105);

  ctx.font = '700 20px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('الدليل الرقمي الأول من نوعه في المنزلة والمطرية', sigCenterX, footerY - 72);

  // Signature artwork
  if (sigImg) {
    ctx.drawImage(sigImg, sigCenterX - 140, footerY - 50, 280, 80);
  } else {
    ctx.save();
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sigCenterX - 110, footerY);
    ctx.bezierCurveTo(sigCenterX - 70, footerY - 45, sigCenterX - 10, footerY - 10, sigCenterX + 50, footerY - 20);
    ctx.bezierCurveTo(sigCenterX + 80, footerY - 10, sigCenterX + 100, footerY + 15, sigCenterX + 120, footerY - 5);
    ctx.stroke();
    ctx.restore();
  }

  ctx.font = 'bold 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('مهندس محمد حماد — المدير العام', sigCenterX, footerY + 58);

  // --- Center: Verification Code & Domain with QR Code ---
  const metaCenterX = W / 2;

  if (qrImg) {
    // Elegant Container Card for QR & Meta details (Separates QR completely from texts)
    const cardW = 460;
    const cardH = 154;
    const cardX = metaCenterX - (cardW / 2);
    const cardY = footerY - 95;

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // QR Image on the right side of the card (RTL layout)
    const qrSize = 106;
    const qrX = cardX + cardW - qrSize - 16;
    const qrY = cardY + 12;

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    ctx.font = 'bold 15px "Cairo", sans-serif';
    ctx.fillStyle = '#0369A1';
    ctx.textAlign = 'center';
    ctx.fillText('رمز التحقق الذكي', qrX + (qrSize / 2), qrY + qrSize + 20);

    // Text details placed on the left side of the card with guaranteed separation from QR
    const textStartX = qrX - 22;
    ctx.textAlign = 'right';
    
    ctx.font = '900 24px "Cairo", sans-serif';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('dalilmanzala.com', textStartX, cardY + 40);

    ctx.font = 'bold 18px "Cairo", monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('الرقم التسلسلي: ' + serialNumber, textStartX, cardY + 76);

    ctx.font = '700 17px "Cairo", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('تاريخ الإصدار: ' + formattedDate, textStartX, cardY + 112);
  } else {
    // Fallback if QR image is not loaded
    ctx.textAlign = 'center';
    ctx.font = 'bold 38px "Segoe UI", sans-serif';
    ctx.fillText('🎖️', metaCenterX, footerY - 82);

    ctx.font = '900 28px "Cairo", sans-serif';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('dalilmanzala.com', metaCenterX, footerY - 36);

    ctx.font = 'bold 20px "Cairo", monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('الرقم التسلسلي: ' + serialNumber, metaCenterX, footerY + 6);

    ctx.font = '700 19px "Cairo", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('تاريخ الإصدار: ' + formattedDate, metaCenterX, footerY + 44);
  }

  // --- Left Side: Official Blue Digital Stamp (Enlarged & Authoritative: 360px) ---
  const stampCenterX = 480;
  const stampCenterY = footerY - 15;
  const stampSize = 360;

  ctx.save();
  ctx.translate(stampCenterX, stampCenterY);
  ctx.rotate(-8 * Math.PI / 180);

  if (sealImg) {
    ctx.drawImage(sealImg, -stampSize / 2, -stampSize / 2, stampSize, stampSize);
  } else {
    // Fallback High-Def Canvas Stamp
    const stampR = stampSize / 2;
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, stampR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(0, 0, stampR - 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, stampR - 55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '900 24px "Cairo", "Segoe UI", sans-serif';
    ctx.fillStyle = '#1D4ED8';
    ctx.fillText('دليل المنزلة والمطرية', 0, -82);

    ctx.font = '900 32px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('★ معتمد ★', 0, -12);

    ctx.font = 'bold 24px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('إدارة التوثيق والجودة', 0, 28);

    ctx.font = '900 21px "Segoe UI", Arial, sans-serif';
    ctx.fillText('DALIL EL MANZALA', 0, 80);
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
