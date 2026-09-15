import { getPlace } from '../../core/db.js';
import { openCertificateOfAppreciationModal } from '../components/CertificateOfAppreciationModal.js';

// Dashboard certificate hardening:
// 1) Guarantees the certificate button opens even after dashboard re-renders.
// 2) Fetches the exact place by ID when the local rendered list is stale.
// 3) Keeps the on-screen A4 preview fully visible without changing export/print output.

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
      .certificate-modal-overlay { padding: 6px !important; }
      .certificate-modal-dialog {
        width: 100% !important;
        max-width: 100% !important;
        max-height: calc(100vh - 12px) !important;
        border-radius: 14px !important;
      }
      .certificate-modal-toolbar { padding: 9px 10px !important; gap: 7px !important; }
      .certificate-preview-container { padding: 8px !important; }
      .certificate-preview-container .certificate-sheet {
        width: min(840px, calc(100vw - 28px)) !important;
        max-height: calc(100vh - 145px) !important;
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

    // The button may have been rendered from a cached owner list. If getPlace
    // did not resolve, use the rendered name only as a last-resort guard.
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
