import { getPlace } from '../../core/db.js';
import { openCertificateOfAppreciationModal } from '../components/CertificateOfAppreciationModal.js';

// Dashboard certificate hardening:
// 1) Guarantees the certificate button opens even after dashboard re-renders.
// 2) Fetches the exact place by ID when the local rendered list is stale.
// 3) Keeps the on-screen A4 preview fully visible without changing export/print output.
// 4) On phones, uses the available width instead of shrinking the A4 canvas excessively.

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
      overflow: auto !important;
      padding: 16px !important;
    }
    .certificate-preview-container .certificate-sheet {
      width: min(840px, calc(100vw - 72px)) !important;
      min-width: 0 !important;
      max-width: 100% !important;
      height: auto !important;
      max-height: calc(100vh - 190px) !important;
      aspect-ratio: 297 / 210 !important;
      box-sizing: border-box !important;
      flex: 0 1 auto !important;
    }
    @media (max-width: 700px) {
      .certificate-modal-overlay {
        padding: 2px !important;
        align-items: center !important;
      }
      .certificate-modal-dialog {
        width: 100% !important;
        max-width: 100% !important;
        max-height: calc(100vh - 4px) !important;
        border-radius: 14px !important;
      }
      .certificate-modal-toolbar {
        padding: 8px 9px !important;
        gap: 6px !important;
      }
      .certificate-modal-title {
        font-size: 12px !important;
        line-height: 1.3 !important;
      }
      .certificate-preview-container {
        width: 100% !important;
        padding: 6px 4px !important;
        overflow: auto !important;
        align-items: flex-start !important;
      }
      .certificate-preview-container .certificate-sheet {
        /* Fill the phone viewport horizontally; do not let the A4 canvas become a tiny thumbnail. */
        width: calc(100vw - 14px) !important;
        min-width: calc(100vw - 14px) !important;
        max-width: calc(100vw - 14px) !important;
        height: auto !important;
        max-height: none !important;
        aspect-ratio: 297 / 210 !important;
        flex: 0 0 auto !important;
      }
    }

    /* Very narrow phones: preserve readable width and allow vertical scrolling. */
    @media (max-width: 380px) {
      .certificate-preview-container { padding: 5px 2px !important; }
      .certificate-preview-container .certificate-sheet {
        width: calc(100vw - 8px) !important;
        min-width: calc(100vw - 8px) !important;
        max-width: calc(100vw - 8px) !important;
      }
    }
  `;
  document.head.appendChild(style);
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

    openCertificateOfAppreciationModal(place, {});
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