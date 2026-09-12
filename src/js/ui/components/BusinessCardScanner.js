/**
 * المنزلة وناسها — Business Card AI Autofill Component
 * Provides a mobile-first, camera-enabled business card scanner
 * that extracts commercial data via OpenRouter Vision AI and
 * safely populates the business registration form without overwriting user data.
 */

import { prepareCardImage, uploadCardImageToR2, extractCardDataWithAI, calculateMissingFields } from '../../services/card-scanner.service.js?v=63fea2cf_scanner_v2';
import { normalizeSocialLink } from '../../utils/social.js?v=63fea2cf_scanner_v2';
import { toast } from './Toast.js?v=63fea2cf_scanner_v2';

export function createBusinessCardScanner({ onAutofillComplete = null } = {}) {
  let isProcessing = false;
  let currentImageBlob = null;
  let currentPreviewUrl = null;
  let streamTracks = null;

  const $wrapper = document.createElement('div');
  $wrapper.id = 'business-card-scanner-root';
  $wrapper.className = 'bcs-container animate-fade-in';

  function renderInitial() {
    $wrapper.innerHTML = `
      <div class="bcs-card">
        <div class="bcs-badge-row">
          <span class="bcs-badge">
            <span class="bcs-badge-sparkle">✨</span>
            <span>ميزة جديدة: تعبئة ذكية بالذكاء الاصطناعي</span>
          </span>
        </div>

        <div class="bcs-content-box">
          <div class="bcs-icon-circle">📸</div>
          <div class="bcs-text-group">
            <h3 class="bcs-title">معاك كارت المحل؟ 📸</h3>
            <p class="bcs-subtitle">صوّره وهيسهّل عليك ملء البيانات كتير. التقط صورة واضحة لكارت المحل، وسيقوم الذكاء الاصطناعي بقراءة البيانات وملء الحقول المتاحة تلقائيًا.</p>
          </div>
        </div>

        <div class="bcs-actions-grid">
          <button type="button" class="btn btn-primary bcs-btn-main" id="bcs-btn-take-photo">
            <span style="font-size:18px">📸</span>
            <span>تصوير كارت المحل</span>
          </button>
          
          <button type="button" class="btn btn-outline bcs-btn-sub" id="bcs-btn-choose-file">
            <span style="font-size:16px">📁</span>
            <span>أو اختر صورة من جهازك</span>
          </button>

          <!-- Hidden Native Inputs -->
          <input type="file" id="bcs-camera-input" accept="image/*" capture="environment" style="display:none" />
          <input type="file" id="bcs-gallery-input" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" style="display:none" />
        </div>

        <div class="bcs-footer-hint">
          <span>💡</span>
          <span>هذه الخطوة اختيارية تماماً، ويمكنك في أي وقت كتابة البيانات يدويًا بنفسك.</span>
        </div>
      </div>
    `;

    attachInitialListeners();
  }

  function attachInitialListeners() {
    const $btnCamera = $wrapper.querySelector('#bcs-btn-take-photo');
    const $btnGallery = $wrapper.querySelector('#bcs-btn-choose-file');
    const $cameraInput = $wrapper.querySelector('#bcs-camera-input');
    const $galleryInput = $wrapper.querySelector('#bcs-gallery-input');

    if ($btnCamera && $cameraInput) {
      $btnCamera.addEventListener('click', () => {
        if (isProcessing) return;
        // Check if device supports MediaDevices with rear camera stream
        if (window.innerWidth <= 768 || !navigator?.mediaDevices?.getUserMedia) {
          // On mobile, direct environment camera input gives the best native OS camera experience
          $cameraInput.click();
        } else {
          // On desktop / tablets, try opening the in-page camera viewfinder modal
          openCameraModal();
        }
      });

      $cameraInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          await handleSelectedImage(file);
        }
        $cameraInput.value = '';
      });
    }

    if ($btnGallery && $galleryInput) {
      $btnGallery.addEventListener('click', () => {
        if (isProcessing) return;
        $galleryInput.click();
      });

      $galleryInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          await handleSelectedImage(file);
        }
        $galleryInput.value = '';
      });
    }
  }

  // ── Desktop / Web Viewfinder Camera Modal ──
  async function openCameraModal() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      streamTracks = stream.getTracks();

      const $modal = document.createElement('div');
      $modal.id = 'bcs-camera-modal';
      $modal.className = 'bcs-camera-overlay animate-fade-in';
      $modal.innerHTML = `
        <div class="bcs-camera-dialog">
          <div class="bcs-camera-topbar">
            <div style="font-weight:700;color:#fff;font-size:15px">📸 ضع كارت المحل داخل الإطار</div>
            <button type="button" class="bcs-camera-close" id="bcs-close-viewfinder">✕</button>
          </div>
          <div class="bcs-camera-viewfinder">
            <video id="bcs-video-feed" playsinline autoplay muted></video>
            <div class="bcs-guide-frame">
              <div class="bcs-frame-corner top-right"></div>
              <div class="bcs-frame-corner top-left"></div>
              <div class="bcs-frame-corner bottom-right"></div>
              <div class="bcs-frame-corner bottom-left"></div>
              <div class="bcs-frame-hint">تأكد من وضوح الكلمات وأرقام الهواتف</div>
            </div>
          </div>
          <div class="bcs-camera-bottombar">
            <button type="button" class="bcs-shutter-btn" id="bcs-capture-shutter" title="التقاط الصورة">
              <div class="bcs-shutter-circle"></div>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild($modal);
      const $video = $modal.querySelector('#bcs-video-feed');
      $video.srcObject = stream;

      $modal.querySelector('#bcs-close-viewfinder')?.addEventListener('click', () => {
        closeCameraStream();
        $modal.remove();
      });

      $modal.querySelector('#bcs-capture-shutter')?.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = $video.videoWidth || 1280;
        canvas.height = $video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage($video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          closeCameraStream();
          $modal.remove();
          if (blob) {
            await handleSelectedImage(blob);
          }
        }, 'image/webp', 0.92);
      });

    } catch (camErr) {
      console.warn('[BusinessCardScanner] Camera access notice:', camErr);
      // Fallback directly to native input
      const $camInput = $wrapper.querySelector('#bcs-camera-input');
      if ($camInput) $camInput.click();
    }
  }

  function closeCameraStream() {
    if (streamTracks) {
      streamTracks.forEach(t => t.stop());
      streamTracks = null;
    }
  }

  // ── Handle Selected Image & Show Preview ──
  async function handleSelectedImage(fileOrBlob) {
    try {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      toast.info('جاري تجهيز صورة الكارت...');
      const prepared = await prepareCardImage(fileOrBlob);
      currentImageBlob = prepared.optimizedBlob;
      currentPreviewUrl = prepared.previewUrl;

      renderPreviewState(currentPreviewUrl);
    } catch (err) {
      toast.error(err.message || 'فشل تجهيز الصورة. يرجى اختيار صورة واضحة لكارت المحل.');
    }
  }

  // ── Preview State with Confirmation & Retake ──
  function renderPreviewState(previewUrl) {
    $wrapper.innerHTML = `
      <div class="bcs-card bcs-card--preview animate-fade-in-up">
        <div class="bcs-preview-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:20px">🔍</span>
            <strong style="font-size:15px;color:var(--text-primary)">معاينة كارت المحل الملتقط</strong>
          </div>
          <span class="badge" style="background:#E0F2FE;color:#0369A1;font-weight:700">جاهز للتحليل</span>
        </div>

        <div class="bcs-preview-media-box">
          <img src="${previewUrl}" alt="كارت المحل" class="bcs-preview-img" />
          <div class="bcs-preview-overlay-info">
            <span>✨ سيقوم الذكاء الاصطناعي باستخراج الاسم والتصنيف والهواتف والخدمات تلقائياً</span>
          </div>
        </div>

        <div class="bcs-preview-actions">
          <button type="button" class="btn btn-primary bcs-btn-confirm" id="bcs-confirm-extract">
            <span>⚡ استخراج البيانات بالذكاء الاصطناعي</span>
          </button>
          <button type="button" class="btn btn-outline bcs-btn-retake" id="bcs-retake-photo">
            <span>🔄 إعادة التصوير</span>
          </button>
          <button type="button" class="btn btn-ghost bcs-btn-cancel" id="bcs-cancel-preview">
            <span>إلغاء</span>
          </button>
        </div>
      </div>
    `;

    $wrapper.querySelector('#bcs-confirm-extract')?.addEventListener('click', () => {
      startAiExtractionPipeline();
    });

    $wrapper.querySelector('#bcs-retake-photo')?.addEventListener('click', () => {
      $wrapper.querySelector('#bcs-camera-input')?.click() || renderInitial();
    });

    $wrapper.querySelector('#bcs-cancel-preview')?.addEventListener('click', () => {
      if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
      currentImageBlob = null;
      currentPreviewUrl = null;
      renderInitial();
    });
  }

  // ── Step Progression State During Processing ──
  function renderStepState(activeStepIndex = 1, stepStatus = {}) {
    const steps = [
      { id: 1, text: 'تم رفع وتأمين صورة الكارت على السيرفر', doneText: 'تم رفع صورة الكارت بنجاح ✓' },
      { id: 2, text: 'جاري قراءة البيانات المكتوبة بالذكاء الاصطناعي...', doneText: 'تمت قراءة نصوص الكارت ✓' },
      { id: 3, text: 'جاري تنظيم البيانات ومطابقة التصنيف والأرقام...', doneText: 'تم تنظيم البيانات ومطابقة التصنيف ✓' },
      { id: 4, text: 'جاري ملء حقول النموذج تلقائياً...', doneText: 'تم ملء البيانات بنجاح ✓' }
    ];

    $wrapper.innerHTML = `
      <div class="bcs-card bcs-card--processing animate-fade-in">
        <div class="bcs-processing-header">
          <div class="spinner spinner-md"></div>
          <div>
            <h4 style="margin:0 0 4px 0;font-size:15px;color:var(--text-primary);font-weight:800">جاري فحص كارت المحل واستخراج البيانات...</h4>
            <div style="font-size:12px;color:var(--text-muted)">يرجى الانتظار ثوانٍ قليلة بينما يقوم الذكاء الاصطناعي بتنظيم البيانات</div>
          </div>
        </div>

        <div class="bcs-stepper-box">
          ${steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < activeStepIndex || (stepNum === activeStepIndex && stepStatus[stepNum] === 'done');
            const isCurrent = stepNum === activeStepIndex && stepStatus[stepNum] !== 'done';
            return `
              <div class="bcs-step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
                <div class="bcs-step-dot">
                  ${isCompleted ? '✓' : (isCurrent ? '<div class="spinner spinner-sm"></div>' : stepNum)}
                </div>
                <div class="bcs-step-label">
                  ${isCompleted ? step.doneText : step.text}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ── Execution Pipeline (Upload -> AI Vision -> Non-destructive Fill -> Checklist) ──
  async function startAiExtractionPipeline() {
    if (isProcessing || !currentImageBlob) return;
    isProcessing = true;

    try {
      // Step 1: Upload to R2
      renderStepState(1);
      const uploadRes = await uploadCardImageToR2(currentImageBlob);
      const r2Url = uploadRes?.url;
      if (!r2Url) {
        throw new Error('فشل رفع صورة الكارت إلى السيرفر');
      }

      // Step 2 & 3: Vision Extraction via Worker
      renderStepState(2);
      const cardData = await extractCardDataWithAI(r2Url);

      renderStepState(3);
      await new Promise(r => setTimeout(r, 400));

      // Step 4: Autofill Form Fields (Non-Destructively)
      renderStepState(4, { 4: 'done' });
      await new Promise(r => setTimeout(r, 400));

      const filledCount = applyDataToPlaceForm(cardData);

      // Compute Missing Fields Checklist
      const currentValues = gatherCurrentFormValues();
      const missingFields = calculateMissingFields(cardData, currentValues);

      renderSuccessAndChecklist(cardData, filledCount, missingFields);
      toast.success('تم استخراج بيانات كارت المحل وملء الحقول بنجاح!');

      if (typeof onAutofillComplete === 'function') {
        onAutofillComplete(cardData, missingFields);
      }

    } catch (err) {
      console.error('[BusinessCardScanner] Pipeline failed:', err);
      isProcessing = false;
      toast.warning('نعتذر، هناك ضغط كبير على الدليل وخدمات الذكاء الاصطناعي (AI) حالياً. تم تحويلك للإدخال اليدوي المباشر.');
      hideScannerAndFocusManual();
    } finally {
      isProcessing = false;
    }
  }

  // ── Non-Destructive Form Autofill Logic ──
  function applyDataToPlaceForm(data) {
    if (!data) return 0;
    let filledCount = 0;

    // Helper: only set if current input is empty or contains placeholder
    function setIfEmpty(selector, val) {
      const el = document.querySelector(selector);
      if (el && val && typeof val === 'string' && val.trim()) {
        const currentVal = el.value.trim();
        if (!currentVal) {
          el.value = val.trim();
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          // Add subtle green flash animation to highlight updated field
          el.classList.add('field-autofilled');
          setTimeout(() => el.classList.remove('field-autofilled'), 2500);
          filledCount++;
          return true;
        }
      }
      return false;
    }

    // 1. Arabic Business Name
    setIfEmpty('#p-name', data.businessNameAr);

    // 2. English Business Name
    setIfEmpty('#p-name-en', data.businessNameEn);

    // 3. Category & Subcategory Matching
    if (data.categoryId) {
      const $catSelect = document.querySelector('#p-category');
      const isSelectEmpty = !$catSelect || !$catSelect.value || $catSelect.value === '';
      
      if (isSelectEmpty) {
        // Trigger matching category tab in the craft picker
        const $matchingTab = document.querySelector(`[data-cat-id="${data.categoryId}"]`);
        if ($matchingTab) {
          $matchingTab.click();
          filledCount++;
        } else if ($catSelect) {
          $catSelect.value = data.categoryId;
          $catSelect.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
        }

        // Subcategory / Profession selection
        if (data.subcategoryId) {
          setTimeout(() => {
            const $subprofBtn = document.querySelector(`[data-prof-id="${data.subcategoryId}"], [data-subprof-id="${data.subcategoryId}"]`);
            if ($subprofBtn) {
              $subprofBtn.click();
            }
          }, 200);
        }
      }
    }

    // 4. Area / Village Matching
    if (data.area) {
      const $areaInput = document.querySelector('#p-area');
      if ($areaInput && !$areaInput.value) {
        // Try finding matching area pill
        const normalizedCardArea = data.area.trim().toLowerCase();
        const $matchingPill = Array.from(document.querySelectorAll('.area-select-pill')).find(p => {
          const name = (p.getAttribute('data-area-name') || '').toLowerCase();
          return name && (name === normalizedCardArea || normalizedCardArea.includes(name) || name.includes(normalizedCardArea));
        });
        if ($matchingPill) {
          $matchingPill.click();
          filledCount++;
        } else {
          // Click 'other' and put in custom area input
          const $otherPill = document.querySelector('.area-select-pill[data-area-name="other"]');
          if ($otherPill) {
            $otherPill.click();
            setIfEmpty('#p-custom-area', data.area);
            filledCount++;
          }
        }
      }
    }

    // 5. Address Details
    setIfEmpty('#p-address', data.address);

    // 6. Primary Phone
    setIfEmpty('#p-phone', data.phone);

    // 7. WhatsApp Number
    setIfEmpty('#p-whatsapp', data.whatsapp || data.phone);

    // 8. Description
    setIfEmpty('#p-desc', data.description);

    // 9. Services / Tags
    if (Array.isArray(data.services) && data.services.length > 0) {
      const $servicesInput = document.querySelector('#p-services');
      const $tagsList = document.querySelector('#p-tags-list');
      if ($servicesInput && (!servicesListHasItems($tagsList) && !$servicesInput.value.trim())) {
        const cleanServices = data.services.slice(0, 8);
        $servicesInput.value = cleanServices.join('، ');
        $servicesInput.dispatchEvent(new Event('input', { bubbles: true }));

        // If tag pills DOM exists, render them visually
        if ($tagsList) {
          cleanServices.forEach(srv => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'service-tag-pill animate-pop';
            tagSpan.innerHTML = `<span>${escapeHtmlText(srv)}</span><button type="button" class="remove-tag" style="background:none;border:none;color:inherit;cursor:pointer;margin-right:4px">×</button>`;
            tagSpan.querySelector('.remove-tag')?.addEventListener('click', () => {
              tagSpan.remove();
              syncTagsInput();
            });
            $tagsList.appendChild(tagSpan);
          });
        }
        filledCount++;
      }
    }

    // 10. Social Media Links
    if (data.social) {
      setIfEmpty('#p-social-facebook', normalizeSocialLink('facebook', data.social.facebook));
      setIfEmpty('#p-social-instagram', normalizeSocialLink('instagram', data.social.instagram));
      setIfEmpty('#p-social-tiktok', normalizeSocialLink('tiktok', data.social.tiktok));
      setIfEmpty('#p-social-website', normalizeSocialLink('website', data.social.website));
      if (data.social.x || data.social.twitter) {
        setIfEmpty('#p-social-x', normalizeSocialLink('x', data.social.x || data.social.twitter));
      }
      if (data.social.threads) {
        setIfEmpty('#p-social-threads', normalizeSocialLink('threads', data.social.threads));
      }
      if (data.social.youtube) {
        setIfEmpty('#p-social-youtube', normalizeSocialLink('youtube', data.social.youtube));
      }
    }

    return filledCount;
  }

  function servicesListHasItems($tagsList) {
    return $tagsList && $tagsList.children.length > 0;
  }

  function syncTagsInput() {
    const $tagsList = document.querySelector('#p-tags-list');
    const $servicesInput = document.querySelector('#p-services');
    if ($tagsList && $servicesInput) {
      const tags = Array.from($tagsList.querySelectorAll('.service-tag-pill span')).map(s => s.textContent.trim()).filter(Boolean);
      $servicesInput.value = tags.join('، ');
      $servicesInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function gatherCurrentFormValues() {
    return {
      name: document.querySelector('#p-name')?.value || '',
      category: document.querySelector('#p-category')?.value || '',
      phone: document.querySelector('#p-phone')?.value || '',
      address: document.querySelector('#p-address')?.value || '',
      area: document.querySelector('#p-area')?.value || '',
      description: document.querySelector('#p-desc')?.value || '',
      workingHours: document.querySelector('input[name="p-hours-mode"]:checked')?.value || '',
      coverUrl: document.querySelector('#p-cover-url')?.value || ''
    };
  }

  // ── Success State & Missing Fields Checklist ──
  function renderSuccessAndChecklist(cardData, filledCount, missingFields) {
    $wrapper.innerHTML = `
      <div class="bcs-card bcs-card--success animate-fade-in-up">
        <div class="bcs-success-header">
          <div class="bcs-success-icon">✓</div>
          <div>
            <h4 style="margin:0 0 4px 0;font-size:16px;color:#065F46;font-weight:800">
              تم استخراج بيانات المحل من الكارت بنجاح 👍
            </h4>
            <div style="font-size:13px;color:#047857">
              تمت تعبئة <strong>${filledCount}</strong> من حقول النموذج تلقائياً وفق ما قرأه الذكاء الاصطناعي من الكارت.
            </div>
          </div>
        </div>

        <!-- Missing Fields Checklist -->
        ${missingFields.length > 0 ? `
          <div class="bcs-checklist-card">
            <div class="bcs-checklist-title">
              <span>📋</span>
              <span>مطلوب منك استكمال أو مراجعة الحقول التالية:</span>
            </div>
            <ul class="bcs-checklist-items">
              ${missingFields.map(field => `
                <li class="bcs-checklist-item ${field.isRequired ? 'required-field' : ''}">
                  <span class="bcs-chk-icon">${field.icon}</span>
                  <span class="bcs-chk-label">${field.label}</span>
                  ${field.isRequired ? '<span class="bcs-chk-req">(إلزامي)</span>' : '<span class="bcs-chk-opt">(يُفضل إكماله)</span>'}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : `
          <div style="padding:10px 14px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;font-size:13px;color:#065F46;font-weight:700">
            🎉 تم استخراج كافة البيانات الأساسية من الكارت بالكامل!
          </div>
        `}

        <div class="bcs-success-actions">
          <button type="button" class="btn btn-primary" id="bcs-btn-review-form" style="font-weight:800">
            <span>✓ راجع البيانات واستكمل المتبقي</span>
          </button>
          
          <button type="button" class="btn btn-outline btn-sm" id="bcs-btn-scan-another">
            <span>🔄 مسح كارت آخر</span>
          </button>
        </div>

        <div style="font-size:11.5px;color:var(--text-muted);margin-top:8px;text-align:center">
          🔒 البيانات المستخرجة لم تُحفظ بعد. يمكنك مراجعتها وتعديلها بحرية، ثم الضغط على "حفظ المكان" أسفل الصفحة.
        </div>
      </div>
    `;

    $wrapper.querySelector('#bcs-btn-review-form')?.addEventListener('click', () => {
      // Smooth scroll to the first empty required field or first form group
      const emptyInput = document.querySelector('#place-form input:required:invalid, #p-address, #p-desc');
      if (emptyInput) {
        emptyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emptyInput.focus();
      } else {
        document.querySelector('#place-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    $wrapper.querySelector('#bcs-btn-scan-another')?.addEventListener('click', () => {
      renderInitial();
    });
  }

  // ── Error State With Manual Continuation ──
  function renderErrorState(errorMessage) {
    $wrapper.innerHTML = `
      <div class="bcs-card bcs-card--error animate-fade-in">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="font-size:26px">⚠️</span>
          <div>
            <h4 style="margin:0 0 6px 0;font-size:15px;color:#991B1B;font-weight:800">ضغط كبير على خدمات الذكاء الاصطناعي (AI)</h4>
            <p style="margin:0 0 12px 0;font-size:13px;color:#B91C1C;line-height:1.5">
              ${escapeHtmlText(errorMessage || 'نعتذر، هناك ضغط كبير على الدليل وخدمات الذكاء الاصطناعي (AI) حالياً. يرجى إدخال بيانات المحل يدوياً وبسهولة.')}
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button type="button" class="btn btn-primary btn-sm" id="bcs-btn-fill-manually">
                <span>✍️ المتابعة وإدخال البيانات يدوياً</span>
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="bcs-btn-try-again">
                <span>🔄 محاولة أخرى</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    $wrapper.querySelector('#bcs-btn-try-again')?.addEventListener('click', () => {
      renderInitial();
    });

    $wrapper.querySelector('#bcs-btn-fill-manually')?.addEventListener('click', () => {
      hideScannerAndFocusManual();
    });
  }

  function hideScannerAndFocusManual() {
    $wrapper.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    $wrapper.style.opacity = '0';
    $wrapper.style.transform = 'translateY(-10px)';
    $wrapper.style.maxHeight = '0';
    $wrapper.style.overflow = 'hidden';
    $wrapper.style.margin = '0';
    $wrapper.style.padding = '0';
    setTimeout(() => {
      $wrapper.style.display = 'none';
      const nameInput = document.querySelector('#p-name') || document.querySelector('#place-form input');
      if (nameInput) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus();
      }
    }, 350);
  }

  function escapeHtmlText(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Mount initial view
  renderInitial();
  return $wrapper;
}
