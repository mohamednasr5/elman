/**
 * CertificateOfAppreciationModal.js
 * شهادة تقدير وتكريم وتَمَيُّز رسمية لنشاط المكان من دليل المنزلة والمطرية الرقمي
 * بمقاس A4 أفقي قياسي (A4 Landscape - 297mm x 210mm)
 * 
 * المزايا:
 * 1. حصرية لصاحب المكان فقط (isOwner)
 * 2. زر طباعة مباشر عبر نافذة الطباعة بمقاس وتنسيق A4 دقيق
 * 3. زر تحميل صورة فائقة الدقة (2480 × 1754 @ 300 DPI) للطباعة أو المشاركة
 * 4. تصميم ملكي فاخر بإطارات ذهبية وزخارف رسمية
 * 5. ختم رقمي أزرق معتمد وتوقيع بخط اليد للإدارة
 * 6. النص الدقيق المطلوب كاملاً
 */

import { toast } from './Toast.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { toArabicCategory } from '../../utils/category-i18n.js';
import { getCached } from '../../core/db.js';
import { checkIsPlaceVerified } from './PlaceProfileCardModal.js';

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
        background: rgba(15, 23, 42, 0.85);
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
        max-width: 1060px;
        box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        margin: auto;
      }
      .certificate-modal-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        background: #111D38;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        gap: 12px;
        flex-wrap: wrap;
      }
      .certificate-modal-close {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #FFFFFF;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 16px;
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
        padding: 8px 16px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
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
        padding: 8px 18px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
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
        max-width: 960px;
        aspect-ratio: 297 / 210;
        min-height: 520px;
        background: #FCFBF7;
        color: #0F172A;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        border-radius: 8px;
        padding: 16px;
        box-sizing: border-box;
        position: relative;
        direction: rtl;
        font-family: 'Cairo', 'Tajawal', sans-serif;
        display: flex;
        flex-direction: column;
      }

      .cert-outer-border {
        border: 4px solid #D97706;
        height: 100%;
        box-sizing: border-box;
        position: relative;
        padding: 6px;
        display: flex;
        flex-direction: column;
      }

      .cert-corner {
        position: absolute;
        width: 46px;
        height: 46px;
        z-index: 10;
        pointer-events: none;
      }
      .cert-corner--tl { top: -2px; left: -2px; }
      .cert-corner--tr { top: -2px; right: -2px; }
      .cert-corner--bl { bottom: -2px; left: -2px; }
      .cert-corner--br { bottom: -2px; right: -2px; }

      .cert-inner-border {
        border: 2px solid #0F2744;
        height: 100%;
        box-sizing: border-box;
        padding: 14px 20px 10px 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: radial-gradient(circle at center, #FFFFFF 0%, #FAF8F2 70%, #F5EFE1 100%);
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
        margin-bottom: 6px;
        position: relative;
        z-index: 2;
      }
      .cert-crest-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        margin-bottom: 6px;
      }
      .cert-crest-emblem {
        width: 44px;
        height: 44px;
      }
      .cert-platform-name {
        font-size: 15px;
        font-weight: 900;
        color: #0284C7;
        letter-spacing: 0.5px;
      }
      .cert-platform-sub {
        font-size: 10.5px;
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
        padding: 6px 28px;
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
        font-size: 22px;
        font-weight: 900;
        color: #F59E0B;
        letter-spacing: 1px;
      }
      .cert-sub-title {
        font-size: 9px;
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
        z-index: 2;
        padding: 4px 0;
      }
      .cert-intro {
        font-size: 13.5px;
        font-weight: 800;
        color: #334155;
        margin: 0 0 4px 0;
      }
      .cert-honoree-wrap {
        margin: 4px 0 8px 0;
      }
      .cert-honoree-name {
        font-size: 28px;
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
        width: 22px;
        height: 22px;
        background: linear-gradient(135deg, #38BDF8, #0284C7);
        color: #FFFFFF;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
      }
      .cert-honoree-category {
        font-size: 13px;
        font-weight: 800;
        color: #0369A1;
        margin-top: 2px;
      }

      .cert-endorsement-text {
        max-width: 800px;
        margin: 0 auto;
        line-height: 1.6;
      }
      .cert-paragraph {
        font-size: 14px;
        font-weight: 700;
        color: #1E293B;
        margin: 3px 0;
      }
      .cert-paragraph strong {
        color: #0F2744;
      }
      .cert-paragraph--congrats {
        font-size: 14.5px;
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
        padding: 4px 18px;
        border-radius: 9999px;
        font-size: 14px;
        font-weight: 900;
        margin: 8px auto 0 auto;
      }

      /* Footer */
      .cert-footer {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr;
        align-items: center;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid rgba(217, 119, 6, 0.25);
        position: relative;
        z-index: 2;
      }

      .cert-signature-block {
        text-align: center;
      }
      .cert-sig-label {
        font-size: 11px;
        color: #64748B;
        font-weight: 700;
      }
      .cert-sig-authority {
        font-size: 11.5px;
        font-weight: 800;
        color: #0F2744;
        margin-bottom: 2px;
      }
      .cert-sig-artwork {
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cert-sig-svg {
        height: 36px;
        width: 130px;
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
        font-size: 16px;
        margin-bottom: 1px;
      }
      .cert-meta-domain {
        font-size: 13px;
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
        width: 88px;
        height: 88px;
        transform: rotate(-8deg);
        filter: drop-shadow(0 2px 5px rgba(29, 78, 216, 0.2));
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
          background: #FFFFFF !important;
        }
        body * {
          visibility: hidden !important;
        }
        #certificate-print-root, #certificate-print-root * {
          visibility: visible !important;
        }
        #certificate-print-root {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 297mm !important;
          height: 210mm !important;
          max-width: none !important;
          min-width: 0 !important;
          margin: 0 !important;
          padding: 10mm !important;
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
          font-size: 20px;
        }
        .cert-paragraph {
          font-size: 12px;
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
                  <div class="cert-crest-emblem">
                    <svg viewBox="0 0 64 64" class="cert-shield-svg">
                      <circle cx="32" cy="32" r="30" fill="url(#crestGrad)" stroke="#D97706" stroke-width="2"/>
                      <defs>
                        <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#0284C7"/>
                          <stop offset="100%" stop-color="#0B2545"/>
                        </linearGradient>
                      </defs>
                      <path d="M32 10 L44 20 L44 36 C44 46 32 54 32 54 C32 54 20 46 20 36 L20 20 Z" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.5"/>
                      <polygon points="32,22 35,28 42,29 37,34 38,41 32,38 26,41 27,34 22,29 29,28" fill="#FFFFFF"/>
                    </svg>
                  </div>
                  <div class="cert-platform-name">
                    دَلِيلُ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ الرَّقْمِيُّ
                  </div>
                  <div class="cert-platform-sub">
                    المنصة الرسمية المعتمدة للأنشطة والخدمات بمحافظة الدقهلية
                  </div>
                </div>

                <!-- Main Certificate Title -->
                <div class="cert-title-container">
                  <div class="cert-title-ribbon">
                    <span class="cert-title-decor">❖</span>
                    <h1 class="cert-main-title">شَهَادَةُ تَقْدِيرٍ وَتَمَيُّز</h1>
                    <span class="cert-title-decor">❖</span>
                  </div>
                  <div class="cert-sub-title">CERTIFICATE OF APPRECIATION & EXCELLENCE</div>
                </div>
              </div>

              <!-- Certificate Body -->
              <div class="cert-body">
                
                <p class="cert-intro">
                  تَشْهَدُ إِدَارَةُ دَلِيلِ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ الرَّقْمِيِّ بِأَنَّ:
                </p>

                <!-- Honoree Place Name -->
                <div class="cert-honoree-wrap">
                  <div class="cert-honoree-name">
                    ${placeName}
                    ${isVerified ? '<span class="cert-verified-badge" title="نشاط موثق رسمياً">✓</span>' : ''}
                  </div>
                  <div class="cert-honoree-category">
                    (مُدْرَجٌ تَحْتَ تَصْنِيف: <strong>${displayCategory}</strong>)
                  </div>
                </div>

                <!-- Official Endorsement Text -->
                <div class="cert-endorsement-text">
                  <p class="cert-paragraph">
                    بِأَنَّهُ مَشْهُورٌ بِالْمَنْزِلَةِ وَلَدَيْهِ الْعَدِيدُ مِنَ الزُّوَّارِ الْيَوْمِيِّينَ فِي دَلِيلِ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ الرَّقْمِيِّ.
                  </p>
                  <p class="cert-paragraph">
                    كَمَا أَنَّهُ صُنِّفَ مِنْ <strong>أَكْثَرِ الْبِطَاقَاتِ الَّتِي تَمَّ الْبَحْثُ عَنْهَا</strong> فِي الدَّلِيلِ فِي آخِرِ 30 يَوْماً.
                  </p>
                  <p class="cert-paragraph cert-paragraph--congrats">
                    وَبِنَاءً عَلَيْهِ تَتَقَدَّمُ إِدَارَةُ دَلِيلِ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ بِكُلِّ أَسْمَى مَعَانِي الْحُبِّ وَالتَّهَانِي إِلَى
                    <span class="cert-highlight-name">${placeName}</span>.
                  </p>
                </div>

                <!-- Emotional Appreciation Note -->
                <div class="cert-proud-badge">
                  ❤️ نَحْنُ فَخُورُونَ أَنَّكُمْ جُزْءٌ مِنَّا ❤️
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

                <!-- Left: Official Blue Digital Stamp -->
                <div class="cert-stamp-block">
                  <div class="cert-official-stamp">
                    <svg viewBox="0 0 160 160" class="cert-stamp-svg">
                      <!-- Outer Dotted Circle -->
                      <circle cx="80" cy="80" r="74" fill="none" stroke="#1D4ED8" stroke-width="2" stroke-dasharray="4 3"/>
                      <!-- Inner Double Solid Circle -->
                      <circle cx="80" cy="80" r="69" fill="none" stroke="#1D4ED8" stroke-width="2.5"/>
                      <circle cx="80" cy="80" r="48" fill="none" stroke="#1D4ED8" stroke-width="1.5"/>
                      
                      <!-- Top Curved Text (دليل المنزلة والمطرية) -->
                      <path id="stampTextTop" d="M 22,80 A 58,58 0 0,1 138,80" fill="none"/>
                      <text font-size="10.5" font-weight="900" fill="#1D4ED8" letter-spacing="1">
                        <textPath href="#stampTextTop" startOffset="50%" text-anchor="middle">
                          دليل المنزلة والمطرية الرقمي
                        </textPath>
                      </text>

                      <!-- Bottom Curved Text (DALIL EL MANZALA) -->
                      <path id="stampTextBottom" d="M 138,80 A 58,58 0 0,1 22,80" fill="none"/>
                      <text font-size="9" font-weight="900" fill="#1D4ED8" letter-spacing="1.5">
                        <textPath href="#stampTextBottom" startOffset="50%" text-anchor="middle">
                          ★ DALIL EL MANZALA ★
                        </textPath>
                      </text>

                      <!-- Center Badge / Stars -->
                      <text x="80" y="68" font-size="13" font-weight="900" text-anchor="middle" fill="#1D4ED8">
                        ★ معتمد ★
                      </text>
                      <text x="80" y="84" font-size="10" font-weight="800" text-anchor="middle" fill="#1D4ED8">
                        إدارة التوثيق
                      </text>
                      <text x="80" y="98" font-size="8.5" font-weight="700" text-anchor="middle" fill="#2563EB">
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
 * محرك توليد الشهادة على HTML5 Canvas بدقة A4 أصلية فائقة (2480 × 1754 px @ 300 DPI)
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

  // 1. Background (Parchment Ivory)
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W / 1.2);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(0.6, '#FDFBF7');
  bgGrad.addColorStop(1, '#F7F2E6');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle Watermark Emblem in Background
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#0F2744';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2 + 30, 420, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Borders
  // Outer Gold Border
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 14;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  // Middle Thin Accent Border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.strokeRect(80, 80, W - 160, H - 160);

  // Inner Royal Navy Border
  ctx.strokeStyle = '#0F2744';
  ctx.lineWidth = 10;
  ctx.strokeRect(96, 96, W - 192, H - 192);

  // 3. Corner Flourishes
  const drawCorner = (cx, cy, flipX, flipY) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(80, 0);
    ctx.quadraticCurveTo(0, 0, 0, 80);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI / 2);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(26, 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCorner(96, 96, false, false);
  drawCorner(W - 96, 96, true, false);
  drawCorner(96, H - 96, false, true);
  drawCorner(W - 96, H - 96, true, true);

  // 4. Header: Platform Crest & Name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Platform Name
  ctx.font = 'bold 36px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0284C7';
  ctx.fillText('دَلِيلُ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ الرَّقْمِيُّ', W / 2, 190);

  ctx.font = '500 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('المنصة الرسمية المعتمدة للأنشطة والخدمات بمحافظة الدقهلية', W / 2, 235);

  // Main Ribbon Banner
  const ribbonW = 920;
  const ribbonH = 95;
  const ribbonX = (W - ribbonW) / 2;
  const ribbonY = 275;

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
  ctx.font = '900 48px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('❖  شَهَادَةُ تَقْدِيرٍ وَتَمَيُّز  ❖', W / 2, ribbonY + ribbonH / 2 + 2);

  // English Subtitle
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('CERTIFICATE OF APPRECIATION & EXCELLENCE', W / 2, ribbonY + ribbonH + 34);

  // 5. Body Text
  let curY = 465;

  ctx.font = 'bold 30px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('تَشْهَدُ إِدَارَةُ دَلِيلِ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ الرَّقْمِيِّ بِأَنَّ:', W / 2, curY);

  curY += 75;

  // Place Name (Large, Bold, Regal)
  ctx.font = '900 62px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0F2744';
  const displayPlaceTitle = isVerified ? (placeName + ' ✓') : placeName;
  ctx.fillText(displayPlaceTitle, W / 2, curY);

  curY += 55;

  // Category
  ctx.font = 'bold 28px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0369A1';
  ctx.fillText('(مُدْرَجٌ تَحْتَ تَصْنِيف: ' + categoryName + ')', W / 2, curY);

  curY += 75;

  // Exact Requested Paragraphs
  ctx.font = 'bold 32px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('بِأَنَّهُ مَشْهُورٌ بِالْمَنْزِلَةِ وَلَدَيْهِ الْعَدِيدُ مِنَ الزُّوَّارِ الْيَوْمِيِّينَ فِي دَلِيلِ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ الرَّقْمِيِّ.', W / 2, curY);

  curY += 60;
  ctx.fillText('كَمَا أَنَّهُ صُنِّفَ مِنْ أَكْثَرِ الْبِطَاقَاتِ الَّتِي تَمَّ الْبَحْثُ عَنْهَا فِي الدَّلِيلِ فِي آخِرِ 30 يَوْماً.', W / 2, curY);

  curY += 65;
  ctx.fillStyle = '#B45309';
  ctx.fillText('وَبِنَاءً عَلَيْهِ تَتَقَدَّمُ إِدَارَةُ دَلِيلِ الْمَنْزِلَةِ وَالْمَطَرِيَّةِ بِكُلِّ أَسْمَى مَعَانِي الْحُبِّ وَالتَّهَانِي إِلَى (' + placeName + ')', W / 2, curY);

  curY += 80;

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
  ctx.fillText('❤️ نَحْنُ فَخُورُونَ أَنَّكُمْ جُزْءٌ مِنَّا ❤️', W / 2, curY);

  // 6. Footer: Signatures & Stamp
  const footerY = 1450;

  // --- Right Side: Signature ---
  const sigCenterX = W - 450;
  ctx.font = 'bold 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('التوقيع والاعتماد', sigCenterX, footerY - 110);

  ctx.font = 'bold 22px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0F2744';
  ctx.fillText('إدارة دليل المنزلة والمطرية الرقمي الرسمي', sigCenterX, footerY - 75);

  // Draw Signature strokes
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

  // Signature underline flourish
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

  ctx.font = '500 20px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('تاريخ الإصدار: ' + formattedDate, metaCenterX, footerY + 40);

  // --- Left Side: Official Blue Digital Stamp ---
  const stampCenterX = 450;
  const stampCenterY = footerY - 25;
  const stampR = 110;

  ctx.save();
  ctx.translate(stampCenterX, stampCenterY);
  ctx.rotate(-8 * Math.PI / 180); // authentic stamp slant

  // Outer Dashed Circle
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, stampR, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Double Solid Circle
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, stampR - 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, stampR - 35, 0, Math.PI * 2);
  ctx.stroke();

  // Stamp Texts
  ctx.font = '900 19px "Cairo", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1D4ED8';
  ctx.fillText('دليل المنزلة والمطرية', 0, -56);

  ctx.font = '900 24px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText('★ معتمد ★', 0, -10);

  ctx.font = 'bold 18px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText('إدارة التوثيق والجودة', 0, 18);

  ctx.font = '900 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DALIL EL MANZALA', 0, 56);

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
