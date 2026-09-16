import { getPlace } from '../../core/db.js';

// Dashboard certificate hardening:
// 1) Guarantees the certificate button opens even after dashboard re-renders.
// 2) Fetches the exact place by ID when the local rendered list is stale.
// 3) Keeps the on-screen A4 preview fully visible without changing export/print output.
// 4) Scales one fixed A4 canvas as a single unit so absolute-positioned seal/QR elements
//    remain locked to the exact coordinates used by the certificate renderer/exporter.
// 5) Loads the certificate renderer lazily with a cache-busting URL so an old cached
//    CertificateOfAppreciationModal.js can never block the dashboard action.

const CERTIFICATE_MODULE_URL = new URL('../components/CertificateOfAppreciationModal.js?v=1d36f2f9_certfix_v3', import.meta.url).href;

let _certificateModulePromise = null;
function loadCertificateModule() {
  if (!_certificateModulePromise) {
    _certificateModulePromise = import(CERTIFICATE_MODULE_URL);
  }
  return _certificateModulePromise;
}

function installCertificatePreviewStyles() {
  if (document.getElementById('dashboard-certificate-preview-fix')) return;
  const style = document.createElement('style');
  style.id = 'dashboard-certificate-preview-fix';
  style.textContent = `
    .certificate-preview-container {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
      padding: 14px 8px !important;
    }

    /* Keep the A4 artwork at its native 840x594 canvas size.
       Never resize the certificate itself: scale the complete canvas instead. */
    .dashboard-cert-preview-stage,
    .certificate-stage {
      position: relative !important;
      flex: 0 0 auto !important;
      width: calc(840px * var(--cert-scale, var(--cert-preview-scale, 1))) !important;
      height: calc(594px * var(--cert-scale, var(--cert-preview-scale, 1))) !important;
      min-width: 0 !important;
      min-height: 0 !important;
      display: block !important;
      overflow: visible !important;
      margin: 0 auto !important;
    }

    .dashboard-cert-preview-stage > .certificate-sheet,
    .certificate-stage > .certificate-sheet {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 840px !important;
      height: 594px !important;
      min-width: 840px !important;
      max-width: 840px !important;
      min-height: 594px !important;
      max-height: 594px !important;
      aspect-ratio: auto !important;
      box-sizing: border-box !important;
      flex: none !important;
      margin: 0 !important;
      transform: scale(var(--cert-scale, var(--cert-preview-scale, 1))) !important;
      transform-origin: top left !important;
    }

    @media (max-width: 700px) {
      .certificate-modal-overlay {
        padding: 4px !important;
        align-items: center !important;
      }
      .certificate-modal-dialog {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 12px !important;
      }
      .certificate-modal-toolbar {
        padding: 8px 10px !important;
        gap: 8px !important;
      }
      .certificate-modal-title {
        font-size: 11.5px !important;
        line-height: 1.3 !important;
      }
      .certificate-preview-container {
        width: 100% !important;
        padding: 8px 4px !important;
        overflow: hidden !important;
        align-items: center !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function setupCertificatePreviewScaling() {
  const container = document.querySelector('#certificate-modal-overlay .certificate-preview-container');
  const sheet = container?.querySelector('.certificate-sheet');
  if (!container || !sheet) return;

  let stage = sheet.parentElement?.classList.contains('certificate-stage')
    ? sheet.parentElement
    : (sheet.parentElement?.classList.contains('dashboard-cert-preview-stage') ? sheet.parentElement : null);

  if (!stage) {
    stage = document.createElement('div');
    stage.className = 'certificate-stage dashboard-cert-preview-stage';
    sheet.parentNode.insertBefore(stage, sheet);
    stage.appendChild(sheet);
  }

  const update = () => {
    const isMobile = window.innerWidth <= 640;
    const padX = isMobile ? 8 : 24;
    const availableWidth = Math.max(1, container.clientWidth - padX);
    let scale = availableWidth / 840;
    const topOffset = isMobile ? 110 : 140;
    const availableHeight = Math.max(160, window.innerHeight - topOffset);
    scale = Math.min(scale, availableHeight / 594);
    scale = Math.min(1.0, Math.max(0.25, scale));

    stage.style.setProperty('--cert-scale', String(scale));
    stage.style.setProperty('--cert-preview-scale', String(scale));
  };

  update();

  if (!stage.__certResizeObserver && typeof ResizeObserver !== 'undefined') {
    stage.__certResizeObserver = new ResizeObserver(update);
    stage.__certResizeObserver.observe(container);
  }
  if (!stage.__certWindowResizeBound) {
    window.addEventListener('resize', update, { passive: true });
    stage.__certWindowResizeBound = true;
  }
}

async function openDashboardCertificate(button) {
  const pid = String(button?.dataset?.placeId || '').trim();
  if (!pid) return;

  installCertificatePreviewStyles();

  button.disabled = true;
  const previousOpacity = button.style.opacity;
  button.style.opacity = '0.7';

  try {
    let place = null;
    try {
      place = await getPlace(pid);
    } catch (err) {
      console.warn('[Dashboard Certificate] getPlace failed, trying cached dashboard data:', err);
    }

    if (!place) {
      const item = button.closest('.my-place-item');
      const name = item?.querySelector('.my-place-item__name')?.textContent?.trim() || '';
      place = { id: pid, name: name.replace(/🛡️|🏷️|🎖️/g, '').trim() };
    }

    // Lazy-load a fresh certificate module. This deliberately avoids the old
    // static import path which could keep a stale module alive in a PWA cache.
    const { openCertificateOfAppreciationModal } = await loadCertificateModule();
    if (typeof openCertificateOfAppreciationModal !== 'function') {
      throw new Error('Certificate renderer is unavailable');
    }

    openCertificateOfAppreciationModal(place, {});

    // The modal is injected synchronously, but one/two animation frames ensure
    // the browser has established its real dimensions before calculating scale.
    requestAnimationFrame(() => {
      setupCertificatePreviewScaling();
      requestAnimationFrame(setupCertificatePreviewScaling);
    });
  } catch (err) {
    console.error('[Dashboard Certificate] open failed:', err);
    const message = 'تعذر فتح شهادة التقدير حالياً. أعد المحاولة بعد لحظات.';
    if (typeof window.toast?.error === 'function') window.toast.error(message);
    else console.error(message);
  } finally {
    button.disabled = false;
    button.style.opacity = previousOpacity;
  }
}

if (typeof document !== 'undefined') {
  installCertificatePreviewStyles();

  // Capture phase prevents another dashboard listener from swallowing the click.
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('.btn-dash-cert');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    openDashboardCertificate(button);
  }, true);
}
