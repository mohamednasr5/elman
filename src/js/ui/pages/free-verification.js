/**
 * دليل المنزلة والمطرية — صفحة عرض التوثيق المجاني لأصحاب المحلات
 * Free Verification Offer for Shop Owners
 */

import { toast } from '../components/Toast.js';

const POSTER_IMAGE_PATH = './assets/images/dalil-free-verification-poster.jpg';

export async function renderFreeVerificationPage($container, { user } = {}) {
  let selectedPhotoBase64 = '';

  $container.innerHTML = `
    <div class="fv-page">
      <!-- Hero Section -->
      <section class="fv-hero">
        <div class="fv-hero__badge">
          <span>🎁 عرض حصري وخاص لأصحاب الأنشطة والمحلات التجارية</span>
        </div>
        <h1 class="fv-hero__title">
          احصل على <span>شارة التوثيق المعتمدة 🛡️ مجاناً</span> لمكانك!
        </h1>
        <p class="fv-hero__subtitle">
          في إطار دعم التجارة المحلية، يسر منصة <strong>دليل المنزلة والمطرية الرقمي</strong> منح التوثيق الرسمي المجاني مدى الحياة لكل صاحب محل أو نشاط يساهم في نشر الدليل بين زبائنه وعملائه من خلال طباعة وتعليق ملصق الدليل الرسمي.
        </p>
      </section>

      <!-- Steps Guide -->
      <div class="fv-steps">
        <div class="fv-step-card">
          <span class="fv-step-card__num">1</span>
          <span class="fv-step-card__icon">🖨️</span>
          <h4 class="fv-step-card__title">اطبع ورقة الدليل</h4>
          <p class="fv-step-card__desc">قم بتحميل أو طباعة بوستر الدليل الرسمي بمقاس الورقة القياسي A4 ألوان بجودة عالية.</p>
        </div>

        <div class="fv-step-card">
          <span class="fv-step-card__num">2</span>
          <span class="fv-step-card__icon">📌</span>
          <h4 class="fv-step-card__title">علّقها في مكان بارز</h4>
          <p class="fv-step-card__desc">ضع الورقة في واجهة محلك، بجوار الكاشير، أو في مكان واضح ومباشر يشاهده كل زائر وزبون.</p>
        </div>

        <div class="fv-step-card">
          <span class="fv-step-card__num">3</span>
          <span class="fv-step-card__icon">📸</span>
          <h4 class="fv-step-card__title">صوّر الورقة بمحلك</h4>
          <p class="fv-step-card__desc">التقط صورة واضحة من هاتفك تُظهر الورقة معلقة داخل المحل والمكان المحيط بها.</p>
        </div>

        <div class="fv-step-card">
          <span class="fv-step-card__num">4</span>
          <span class="fv-step-card__icon">🛡️</span>
          <h4 class="fv-step-card__title">توثيق رسمي فوري</h4>
          <p class="fv-step-card__desc">ارفع الصورة في النموذج أدناه، وخلال 24 ساعة ستظهر شارة التوثيق الذهبية/الزرقاء على صفحتك!</p>
        </div>
      </div>

      <!-- Poster Showcase & Actions -->
      <div class="fv-poster-box">
        <div class="fv-poster-box__header">
          <h3>ملصق الإعلان المعتمد (مقاس A4 القياسي)</h3>
          <p>يمكنك معاينة الملصق، أو تحميله للطباعة في أي مكتبة أو مطبعة، أو طباعته مباشرة</p>
        </div>

        <div class="fv-poster-layout">
          <!-- Poster Preview Card -->
          <div class="fv-poster-preview" id="fv-open-preview" title="اضغط لتكبير الملصق">
            <img src="${POSTER_IMAGE_PATH}" alt="بوستر إعلان دليل المنزلة والمطرية" loading="eager"/>
            <span class="fv-poster-preview__badge">مقاس A4 جاهز للطباعة</span>
            <div class="fv-poster-preview__overlay">
              <span style="font-size:1.6rem;">🔍</span>
              <span>اضغط للمعاينة بالحجم الكامل</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="fv-poster-actions">
            <button type="button" class="fv-action-btn fv-action-btn--preview" id="fv-btn-preview">
              <span>🔍</span>
              <span>معاينة بمقاس A4</span>
            </button>

            <a href="${POSTER_IMAGE_PATH}" download="Dalil-Elmanzala-A4-Poster.jpg" class="fv-action-btn fv-action-btn--download" id="fv-btn-download">
              <span>📥</span>
              <span>تحميل الملصق بجودة عالية</span>
            </a>

            <button type="button" class="fv-action-btn fv-action-btn--print" id="fv-btn-print">
              <span>🖨️</span>
              <span>طباعة الملصق مباشرة</span>
            </button>

            <div class="fv-spec-note">
              💡 <strong>نصيحة:</strong> يفضل الطباعة على ورق أبيض مقوى (كوشيه أو فوتو) مقاس A4 للحصول على مظهر أنيق يليق بمحلك.
            </div>
          </div>
        </div>
      </div>

      <!-- Application Form -->
      <div class="fv-form-card" id="fv-form-section">
        <div class="fv-form-card__header">
          <h3>📝 نموذج طلب التوثيق المجاني وإرسال الصورة</h3>
          <p>أدخل بيانات محلك وارفع صورة توضح الورقة معلقة داخل المحل ليتم مراجعتها وتفعيل التوثيق</p>
        </div>

        <form id="fv-verification-form" autocomplete="on">
          <div class="fv-form-grid">
            <div class="fv-field">
              <label for="fv-place-name">اسم المحل أو النشاط التجاري <span class="req">*</span></label>
              <input type="text" id="fv-place-name" name="placeName" required placeholder="مثال: أسماك الشريف، صيدلية النور..." />
            </div>

            <div class="fv-field">
              <label for="fv-owner-name">اسم صاحب المحل / المسؤول <span class="req">*</span></label>
              <input type="text" id="fv-owner-name" name="ownerName" value="${user?.displayName || ''}" required placeholder="الاسم ثلاثي..." />
            </div>

            <div class="fv-field">
              <label for="fv-phone">رقم الهاتف للتواصل <span class="req">*</span></label>
              <input type="tel" id="fv-phone" name="phone" dir="ltr" style="text-align:right" value="${user?.phoneNumber || ''}" required placeholder="010XXXXXXXX" />
            </div>

            <div class="fv-field">
              <label for="fv-whatsapp">رقم الواتساب (إن وُجد)</label>
              <input type="tel" id="fv-whatsapp" name="whatsapp" dir="ltr" style="text-align:right" placeholder="01XXXXXXXXX" />
            </div>

            <div class="fv-field fv-form-col-span-2">
              <label for="fv-address">عنوان المحل بالتفصيل <span class="req">*</span></label>
              <input type="text" id="fv-address" name="address" required placeholder="المدينة (المنزلة / المطرية / قرية...) - الشارع وعلامة مميزة" />
            </div>

            <div class="fv-field fv-form-col-span-2">
              <label for="fv-flyer-location">مكان تعليق الورقة داخل المحل <span class="req">*</span></label>
              <input type="text" id="fv-flyer-location" name="flyerLocation" required placeholder="مثال: على زجاج الواجهة الرئيسي، فوق الكاشير مباشرة..." />
            </div>

            <!-- Image Upload Zone -->
            <div class="fv-field fv-form-col-span-2">
              <label>صورة الورقة معلقة في محلك <span class="req">*</span></label>
              <input type="file" id="fv-file-input" accept="image/*" capture="environment" style="display:none;" />
              
              <div class="fv-upload-zone" id="fv-drop-zone">
                <div class="fv-upload-zone__icon">📸</div>
                <div class="fv-upload-zone__title">اضغط لالتقاط أو اختيار صورة للورقة المعلقة</div>
                <p class="fv-upload-zone__desc">التقط صورة واضحة بكاميرا هاتفك تظهر الورقة وموقعها داخل المحل (يدعم JPG, PNG, WEBP)</p>
                
                <div id="fv-preview-container" style="display:none;">
                  <div class="fv-upload-preview">
                    <img id="fv-preview-img" src="" alt="معاينة صورة الورقة المعلقة" />
                    <button type="button" class="fv-upload-remove-btn" id="fv-remove-img" title="حذف الصورة">✕</button>
                  </div>
                  <div style="font-size:0.85rem;color:#10B981;font-weight:700;margin-top:6px;">✓ تم اختيار الصورة بنجاح</div>
                </div>
              </div>
            </div>

            <div class="fv-field fv-form-col-span-2">
              <label for="fv-notes">ملاحظات إضافية (اختياري)</label>
              <textarea id="fv-notes" name="notes" rows="2" placeholder="أي تفاصيل أخرى ترغب في ذكرها..."></textarea>
            </div>
          </div>

          <button type="submit" class="fv-submit-btn" id="fv-submit-btn">
            <span>🚀 إرسال طلب التوثيق للمراجعة</span>
          </button>
        </form>
      </div>

      <!-- Critical Warnings Box -->
      <div class="fv-warnings-box" role="alert">
        <div class="fv-warnings-box__header">
          <span class="fv-warnings-box__icon">⚠️</span>
          <h4>تنبيهات وشروط حاسمة لضمان استمرار التوثيق:</h4>
        </div>
        <ul class="fv-warnings-list">
          <li class="fv-warning-item">
            <span class="fv-warning-item__bullet">1</span>
            <div>
              <strong>لابد أن تكون الورقة أمام الناس والناس يشاهدونها:</strong>
              هدف المبادرة هو رؤية الزبائن والجمهور لملصق الدليل بوضوح تام، وليست موضوعة في مكان غير مرئي أو خلف كواليس العمل.
            </div>
          </li>
          <li class="fv-warning-item">
            <span class="fv-warning-item__bullet">2</span>
            <div>
              <strong>سحب التوثيق الفوري دون تراجع:</strong>
              إذا مر أحد ممثلي أو مسؤولي الدليل على محلك ولم يجد الورقة معلقة، سيتم سحب وإلغاء شارة التوثيق من مكانك فوراً دون أي تراجع مرة أخرى.
            </div>
          </li>
          <li class="fv-warning-item">
            <span class="fv-warning-item__bullet">3</span>
            <div>
              <strong>جولات تفقدية دورية ومفاجئة:</strong>
              فريق الدليل ومندوبونا منتشرون في كافة شوارع وأحياء وقرى المنزلة والمطرية، ووارد جداً في أي وقت أن يدخل عليك أحد المشرفين للتأكد الميداني من وجود الإعلان.
            </div>
          </li>
        </ul>
      </div>

    </div>

    <!-- Hidden Printable Element for Direct A4 Print -->
    <div id="fv-printable-poster" style="display:none;">
      <img src="${POSTER_IMAGE_PATH}" alt="ملصق دليل المنزلة والمطرية" />
    </div>

    <!-- A4 Modal Preview -->
    <div class="fv-modal" id="fv-modal">
      <div class="fv-modal__content">
        <div class="fv-modal__header">
          <h4>معاينة ملصق الدليل (مقاس A4)</h4>
          <button type="button" class="fv-modal__close-btn" id="fv-modal-close">×</button>
        </div>
        <div class="fv-modal__body">
          <img src="${POSTER_IMAGE_PATH}" alt="ملصق دليل المنزلة والمطرية بدقة كاملة" />
        </div>
        <div class="fv-modal__footer">
          <a href="${POSTER_IMAGE_PATH}" download="Dalil-Elmanzala-A4-Poster.jpg" class="fv-action-btn fv-action-btn--download" style="width:auto;padding:.6rem 1.2rem;font-size:.9rem;">
            📥 تحميل
          </a>
          <button type="button" class="fv-action-btn fv-action-btn--print" id="fv-modal-print" style="width:auto;padding:.6rem 1.2rem;font-size:.9rem;">
            🖨️ طباعة
          </button>
        </div>
      </div>
    </div>
  `;

  // --- Modal Logic ---
  const $modal = document.getElementById('fv-modal');
  const openModal = () => {
    $modal.style.display = 'flex';
    requestAnimationFrame(() => $modal.classList.add('active'));
  };
  const closeModal = () => {
    $modal.classList.remove('active');
    setTimeout(() => { $modal.style.display = 'none'; }, 200);
  };

  document.getElementById('fv-open-preview')?.addEventListener('click', openModal);
  document.getElementById('fv-btn-preview')?.addEventListener('click', openModal);
  document.getElementById('fv-modal-close')?.addEventListener('click', closeModal);
  $modal?.addEventListener('click', (e) => {
    if (e.target === $modal) closeModal();
  });

  // --- Print Handler ---
  const handlePrint = () => {
    const $printEl = document.getElementById('fv-printable-poster');
    if ($printEl) {
      $printEl.style.display = 'flex';
      window.print();
      setTimeout(() => {
        $printEl.style.display = 'none';
      }, 1000);
    } else {
      window.print();
    }
  };
  document.getElementById('fv-btn-print')?.addEventListener('click', handlePrint);
  document.getElementById('fv-modal-print')?.addEventListener('click', () => {
    closeModal();
    setTimeout(handlePrint, 250);
  });

  // --- Photo Upload Logic (with automatic canvas downscale for fast mobile submission) ---
  const $dropZone = document.getElementById('fv-drop-zone');
  const $fileInput = document.getElementById('fv-file-input');
  const $previewContainer = document.getElementById('fv-preview-container');
  const $previewImg = document.getElementById('fv-preview-img');
  const $removeImgBtn = document.getElementById('fv-remove-img');

  $dropZone?.addEventListener('click', (e) => {
    if (e.target === $removeImgBtn) return;
    $fileInput.click();
  });

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح (JPG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Downscale image to max 1280px to optimize network and storage
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        selectedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.85);
        $previewImg.src = selectedPhotoBase64;
        $previewContainer.style.display = 'block';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  $fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  });

  $removeImgBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedPhotoBase64 = '';
    $fileInput.value = '';
    $previewContainer.style.display = 'none';
  });

  // Drag and drop support
  ['dragenter', 'dragover'].forEach(eventName => {
    $dropZone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      $dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    $dropZone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      $dropZone.classList.remove('dragover');
    });
  });

  $dropZone?.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt?.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  });

  // --- Form Submission Logic ---
  const $form = document.getElementById('fv-verification-form');
  const $submitBtn = document.getElementById('fv-submit-btn');

  $form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const placeName = document.getElementById('fv-place-name')?.value.trim();
    const ownerName = document.getElementById('fv-owner-name')?.value.trim();
    const phone = document.getElementById('fv-phone')?.value.trim();
    const whatsapp = document.getElementById('fv-whatsapp')?.value.trim();
    const address = document.getElementById('fv-address')?.value.trim();
    const flyerLocation = document.getElementById('fv-flyer-location')?.value.trim();
    const notes = document.getElementById('fv-notes')?.value.trim();

    if (!placeName) {
      toast.error('يرجى كتابة اسم المحل أو النشاط التجاري');
      document.getElementById('fv-place-name')?.focus();
      return;
    }

    if (!ownerName) {
      toast.error('يرجى كتابة اسم صاحب المحل أو المسؤول');
      document.getElementById('fv-owner-name')?.focus();
      return;
    }

    if (!phone) {
      toast.error('يرجى كتابة رقم الهاتف للتواصل');
      document.getElementById('fv-phone')?.focus();
      return;
    }

    if (!address) {
      toast.error('يرجى كتابة عنوان المحل بالتفصيل');
      document.getElementById('fv-address')?.focus();
      return;
    }

    if (!flyerLocation) {
      toast.error('يرجى توضيح مكان تعليق الورقة داخل المحل');
      document.getElementById('fv-flyer-location')?.focus();
      return;
    }

    if (!selectedPhotoBase64) {
      toast.error('يرجى رفع صورة توضح الورقة معلقة داخل المحل');
      $dropZone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Submit payload
    $submitBtn.disabled = true;
    $submitBtn.innerHTML = '<span>جاري إرسال الطلب وحفظ الصورة... ⏳</span>';

    try {
      const resp = await fetch('/api/free-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          placeName,
          ownerName,
          phone,
          whatsapp,
          address,
          flyerLocation,
          notes,
          photoData: selectedPhotoBase64
        })
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data.success) {
        toast.success('تم استلام طلبك بنجاح!');
        // Show success state in place of form
        const $formCard = document.getElementById('fv-form-section');
        if ($formCard) {
          $formCard.innerHTML = `
            <div style="text-align:center;padding:2.5rem 1rem;">
              <div style="font-size:3.5rem;margin-bottom:1rem;">🎉</div>
              <h3 style="font-size:1.6rem;font-weight:800;color:#10B981;margin-bottom:0.75rem;">تم إرسال طلب التوثيق المجاني بنجاح!</h3>
              <p style="font-size:1.05rem;line-height:1.7;color:var(--text-secondary,#475569);max-width:560px;margin:0 auto 1.5rem;">
                نشكرك على مشاركتك في نشر الدليل لدعم أهل المنزلة والمطرية. سيقوم فريق المراجعة بمطابقة صورة الملصق في محلك وتفعيل شارة التوثيق الرسمية خلال <strong>24 ساعة</strong>.
              </p>
              <div style="display:inline-flex;align-items:center;gap:.5rem;background:rgba(16,185,129,0.1);color:#10B981;padding:.6rem 1.25rem;border-radius:12px;font-weight:700;">
                <span>رقم الطلب:</span>
                <code>${data.id || 'fvr_ok'}</code>
              </div>
              <div style="margin-top:2rem;">
                <a href="contact.html" class="fv-action-btn fv-action-btn--preview" style="display:inline-flex;width:auto;padding:.8rem 2rem;">
                  العودة لصفحة التواصل
                </a>
              </div>
            </div>
          `;
          $formCard.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        toast.error(data.error || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً');
        $submitBtn.disabled = false;
        $submitBtn.innerHTML = '<span>🚀 إرسال طلب التوثيق للمراجعة</span>';
      }
    } catch (err) {
      console.error('[Free Verification Submit Error]:', err);
      toast.error('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً');
      $submitBtn.disabled = false;
      $submitBtn.innerHTML = '<span>🚀 إرسال طلب التوثيق للمراجعة</span>';
    }
  });
}
