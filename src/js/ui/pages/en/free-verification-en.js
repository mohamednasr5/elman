/**
 * Dalil El Manzala & El Matariya — English Free Verification Offer Page
 * Dedicated native English free verification renderer
 */

import { toast } from '../../components/Toast.js';

const POSTER_IMAGE_PATH = '/assets/images/dalil-free-verification-poster.jpg';

export async function renderEnglishFreeVerificationPage($container, { user } = {}) {
  document.title = 'Free Verification for Business Owners | Dalil El Manzala';
  let selectedPhotoBase64 = '';

  $container.innerHTML = `
    <div class="fv-page">
      <!-- Hero Section -->
      <section class="fv-hero">
        <div class="fv-hero__badge">
          <span>🎁 Exclusive Free Offer for Shop & Business Owners</span>
        </div>
        <h1 class="fv-hero__title">
          Get the <span>Official Verified Badge 🛡️ for Free</span>!
        </h1>
        <p class="fv-hero__subtitle">
          In support of local business growth, <strong>Dalil El Manzala & El Matariya</strong> offers free lifetime official verification to shop and business owners who display our official directory notice flyer in their store.
        </p>
      </section>

      <!-- Steps Guide -->
      <div class="fv-steps">
        <div class="fv-step-card">
          <span class="fv-step-card__num">1</span>
          <span class="fv-step-card__icon">🖨️</span>
          <h4 class="fv-step-card__title">Print Directory Notice</h4>
          <p class="fv-step-card__desc">Download or directly print our official directory flyer in standard full-color A4 size.</p>
        </div>

        <div class="fv-step-card">
          <span class="fv-step-card__num">2</span>
          <span class="fv-step-card__icon">📌</span>
          <h4 class="fv-step-card__title">Hang in a Visible Spot</h4>
          <p class="fv-step-card__desc">Place the notice clearly in your storefront, cashier desk, or entrance where every customer can see it.</p>
        </div>

        <div class="fv-step-card">
          <span class="fv-step-card__num">3</span>
          <span class="fv-step-card__icon">📸</span>
          <h4 class="fv-step-card__title">Take a Shop Photo</h4>
          <p class="fv-step-card__desc">Take a clear photo with your phone showing the flyer hanging inside your store and its surrounding area.</p>
        </div>

        <div class="fv-step-card">
          <span class="fv-step-card__num">4</span>
          <span class="fv-step-card__icon">🛡️</span>
          <h4 class="fv-step-card__title">Official Verification</h4>
          <p class="fv-step-card__desc">Submit your photo below. Within 24 hours of review, your official verified badge will be activated!</p>
        </div>
      </div>

      <!-- Poster Showcase & Actions -->
      <div class="fv-poster-box">
        <div class="fv-poster-box__header">
          <h3>Official Directory Notice Poster (Standard A4 Size)</h3>
          <p>Preview the notice flyer, download the high-resolution file for print, or print directly.</p>
        </div>

        <div class="fv-poster-layout">
          <!-- Poster Preview Card -->
          <div class="fv-poster-preview" id="fv-open-preview" title="Click to enlarge flyer">
            <img src="${POSTER_IMAGE_PATH}" alt="Dalil El Manzala Official Notice Flyer" loading="eager" />
            <span class="fv-poster-preview__badge">Print-Ready A4 Size</span>
            <div class="fv-poster-preview__overlay">
              <span style="font-size:1.6rem;">🔍</span>
              <span>Click for Full Size Preview</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="fv-poster-actions">
            <button type="button" class="fv-action-btn fv-action-btn--preview" id="fv-btn-preview">
              <span>🔍</span>
              <span>Preview A4 Flyer</span>
            </button>

            <a href="${POSTER_IMAGE_PATH}" download="Dalil-Elmanzala-A4-Poster.jpg" class="fv-action-btn fv-action-btn--download" id="fv-btn-download">
              <span>📥</span>
              <span>Download High-Res Flyer</span>
            </a>

            <button type="button" class="fv-action-btn fv-action-btn--print" id="fv-btn-print">
              <span>🖨️</span>
              <span>Print Flyer Directly</span>
            </button>

            <div class="fv-spec-note">
              💡 <strong>Tip:</strong> Printing on premium coated white A4 paper provides an elegant, durable look for your store.
            </div>
          </div>
        </div>
      </div>

      <!-- Application Form -->
      <div class="fv-form-card" id="fv-form-section">
        <div class="fv-form-card__header">
          <h3>📝 Free Verification Application & Photo Submission</h3>
          <p>Provide your business details and upload a photo showing the flyer displayed in your shop.</p>
        </div>

        <form id="fv-verification-form" autocomplete="on">
          <div class="fv-form-grid">
            <div class="fv-field">
              <label for="fv-place-name">Shop or Business Name <span class="req">*</span></label>
              <input type="text" id="fv-place-name" name="placeName" required placeholder="e.g. Al Noor Pharmacy, Haven Restaurant..." />
            </div>

            <div class="fv-field">
              <label for="fv-owner-name">Owner or Manager Full Name <span class="req">*</span></label>
              <input type="text" id="fv-owner-name" name="ownerName" value="${escAttr(user?.displayName || '')}" required placeholder="Full Name..." />
            </div>

            <div class="fv-field">
              <label for="fv-phone">Phone Number <span class="req">*</span></label>
              <input type="tel" id="fv-phone" name="phone" value="${escAttr(user?.phoneNumber || '')}" required placeholder="010XXXXXXXX" />
            </div>

            <div class="fv-field">
              <label for="fv-whatsapp">WhatsApp Number (Optional)</label>
              <input type="tel" id="fv-whatsapp" name="whatsapp" placeholder="01XXXXXXXXX" />
            </div>

            <div class="fv-field fv-form-col-span-2">
              <label for="fv-address">Detailed Business Address <span class="req">*</span></label>
              <input type="text" id="fv-address" name="address" required placeholder="City / Village, Street name, and nearby landmark" />
            </div>

            <div class="fv-field fv-form-col-span-2">
              <label for="fv-flyer-location">Flyer Location Inside Store <span class="req">*</span></label>
              <input type="text" id="fv-flyer-location" name="flyerLocation" required placeholder="e.g. Front glass entrance, directly beside the cashier desk..." />
            </div>

            <!-- Image Upload Zone -->
            <div class="fv-field fv-form-col-span-2">
              <label>Photo of Flyer Displayed in Your Shop <span class="req">*</span></label>
              <input type="file" id="fv-file-input" accept="image/*" capture="environment" style="display:none;" />
              
              <div class="fv-upload-zone" id="fv-drop-zone">
                <div class="fv-upload-zone__icon">📸</div>
                <div class="fv-upload-zone__title">Click to take or select a photo of the flyer in your store</div>
                <p class="fv-upload-zone__desc">Take a clear photo with your smartphone camera showing the flyer and its surrounding shop area (Supports JPG, PNG, WEBP)</p>
                
                <div id="fv-preview-container" style="display:none;">
                  <div class="fv-upload-preview">
                    <img id="fv-preview-img" src="" alt="Flyer photo preview" />
                    <button type="button" class="fv-upload-remove-btn" id="fv-remove-img" title="Remove photo">✕</button>
                  </div>
                  <div style="font-size:0.85rem;color:#10B981;font-weight:700;margin-top:6px;">✓ Photo selected successfully</div>
                </div>
              </div>
            </div>

            <div class="fv-field fv-form-col-span-2">
              <label for="fv-notes">Additional Notes (Optional)</label>
              <textarea id="fv-notes" name="notes" rows="2" placeholder="Any extra details or notes..."></textarea>
            </div>
          </div>

          <button type="submit" class="fv-submit-btn" id="fv-submit-btn">
            <span>🚀 Submit Verification Request for Review</span>
          </button>
        </form>
      </div>

      <!-- Critical Warnings Box -->
      <div class="fv-warnings-box" role="alert">
        <div class="fv-warnings-box__header">
          <span class="fv-warnings-box__icon">⚠️</span>
          <h4>Crucial Conditions for Ongoing Verification:</h4>
        </div>
        <ul class="fv-warnings-list">
          <li class="fv-warning-item">
            <span class="fv-warning-item__bullet">1</span>
            <div>
              <strong>The flyer MUST be placed in plain view of customers:</strong>
              The initiative is intended for customers and visitors to clearly see the directory notice, not hidden away behind back-office walls.
            </div>
          </li>
          <li class="fv-warning-item">
            <span class="fv-warning-item__bullet">2</span>
            <div>
              <strong>Permanent Verification Revocation:</strong>
              If a directory field representative visits your shop and the notice flyer is not visible, your verified badge will be revoked immediately without appeal.
            </div>
          </li>
          <li class="fv-warning-item">
            <span class="fv-warning-item__bullet">3</span>
            <div>
              <strong>Periodic Field Audits:</strong>
              Directory community representatives regularly visit businesses across El Manzala and El Matariya to audit listings and verify authenticity.
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- A4 Modal Preview -->
    <div class="fv-modal" id="fv-modal">
      <div class="fv-modal__content">
        <div class="fv-modal__header">
          <h4>Directory Flyer Preview (A4 Size)</h4>
          <button type="button" class="fv-modal__close-btn" id="fv-modal-close">×</button>
        </div>
        <div class="fv-modal__body">
          <img src="${POSTER_IMAGE_PATH}" alt="Directory flyer full resolution" />
        </div>
        <div class="fv-modal__footer">
          <a href="${POSTER_IMAGE_PATH}" download="Dalil-Elmanzala-A4-Poster.jpg" class="fv-action-btn fv-action-btn--download" style="width:auto;padding:.6rem 1.2rem;font-size:.9rem;">
            📥 Download
          </a>
          <button type="button" class="fv-action-btn fv-action-btn--print" id="fv-modal-print" style="width:auto;padding:.6rem 1.2rem;font-size:.9rem;">
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  `;

  // Modal logic
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
  $modal?.addEventListener('click', e => { if (e.target === $modal) closeModal(); });

  // Print handler
  const printPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Directory Notice Flyer</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
          img { width: 100vw; height: 100vh; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="${POSTER_IMAGE_PATH}" onload="window.print();window.close();" />
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  document.getElementById('fv-btn-print')?.addEventListener('click', printPoster);
  document.getElementById('fv-modal-print')?.addEventListener('click', printPoster);

  // File upload processing
  const $dropZone = document.getElementById('fv-drop-zone');
  const $fileInput = document.getElementById('fv-file-input');
  const $previewContainer = document.getElementById('fv-preview-container');
  const $previewImg = document.getElementById('fv-preview-img');
  const $removeImgBtn = document.getElementById('fv-remove-img');

  $dropZone?.addEventListener('click', e => {
    if (e.target === $removeImgBtn) return;
    $fileInput.click();
  });

  const processFile = file => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPG, PNG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
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

  $fileInput?.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  });

  $removeImgBtn?.addEventListener('click', e => {
    e.stopPropagation();
    selectedPhotoBase64 = '';
    $fileInput.value = '';
    $previewContainer.style.display = 'none';
  });

  // Form submission
  const $form = document.getElementById('fv-verification-form');
  const $submitBtn = document.getElementById('fv-submit-btn');

  $form?.addEventListener('submit', async e => {
    e.preventDefault();

    const placeName = document.getElementById('fv-place-name')?.value.trim();
    const ownerName = document.getElementById('fv-owner-name')?.value.trim();
    const phone = document.getElementById('fv-phone')?.value.trim();
    const whatsapp = document.getElementById('fv-whatsapp')?.value.trim();
    const address = document.getElementById('fv-address')?.value.trim();
    const flyerLocation = document.getElementById('fv-flyer-location')?.value.trim();
    const notes = document.getElementById('fv-notes')?.value.trim();

    if (!selectedPhotoBase64) {
      toast.error('Please upload a photo of the flyer in your store');
      $dropZone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    $submitBtn.disabled = true;
    $submitBtn.innerHTML = '<span>Submitting application... ⏳</span>';

    try {
      const resp = await fetch('/api/free-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        toast.success('Your verification application was submitted successfully!');
        const formCard = document.getElementById('fv-form-section');
        if (formCard) {
          formCard.innerHTML = `
            <div style="text-align:center;padding:2.5rem 1rem;">
              <div style="font-size:3.5rem;margin-bottom:1rem;">🎉</div>
              <h3 style="font-size:1.6rem;font-weight:800;color:#10B981;margin-bottom:0.75rem;">Verification Request Received!</h3>
              <p style="font-size:1.05rem;line-height:1.7;color:var(--text-secondary);max-width:560px;margin:0 auto 1.5rem;">
                Thank you for displaying the directory flyer in your store. Our audit team will review your photo and activate your official verified badge within <strong>24 hours</strong>.
              </p>
              <div style="display:inline-flex;align-items:center;gap:.5rem;background:rgba(16,185,129,0.1);color:#10B981;padding:.6rem 1.25rem;border-radius:12px;font-weight:700;">
                <span>Application ID:</span>
                <code>${escHtml(data.id || 'fvr_ok')}</code>
              </div>
              <div style="margin-top:2rem;">
                <a href="/en/contact/" class="fv-action-btn fv-action-btn--preview" style="display:inline-flex;width:auto;padding:.8rem 2rem;">
                  Back to Contact Page
                </a>
              </div>
            </div>
          `;
          formCard.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        toast.error(data.error || 'An error occurred while submitting. Please try again.');
        $submitBtn.disabled = false;
        $submitBtn.innerHTML = '<span>🚀 Submit Verification Request for Review</span>';
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      $submitBtn.disabled = false;
      $submitBtn.innerHTML = '<span>🚀 Submit Verification Request for Review</span>';
    }
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
