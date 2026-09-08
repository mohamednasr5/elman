/**
 * المنزلة وناسها — Modal Component
 */

let _activeModal = null;

export function showModal({
  title = '',
  content = '',
  footer = '',
  size = 'md', // sm, md, lg, xl
  onClose = null
}) {
  closeModal();

  const backdrop = document.createElement('div');
  backdrop.className = 'admin-modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = `admin-modal admin-modal-${size}`;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="admin-modal-header">
      <h3 class="admin-modal-title">${escapeHtml(title)}</h3>
      <button type="button" class="admin-modal-close" aria-label="إغلاق">&times;</button>
    </div>
    <div class="admin-modal-body">${typeof content === 'string' ? content : ''}</div>
    ${footer ? `<div class="admin-modal-footer">${footer}</div>` : ''}
  `;

  if (content instanceof HTMLElement) {
    modal.querySelector('.admin-modal-body').appendChild(content);
  }

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  const closeBtn = modal.querySelector('.admin-modal-close');
  const doClose = () => {
    document.body.style.overflow = '';
    backdrop.classList.add('admin-modal-hiding');
    setTimeout(() => {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (onClose) onClose();
      if (_activeModal === backdrop) _activeModal = null;
    }, 200);
  };

  closeBtn.addEventListener('click', doClose);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) doClose();
  });

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      doClose();
      window.removeEventListener('keydown', onKeyDown);
    }
  };
  window.addEventListener('keydown', onKeyDown);

  _activeModal = backdrop;

  return {
    element: modal,
    backdrop,
    close: doClose,
    setLoading(loading) {
      if (loading) {
        modal.classList.add('admin-modal-loading');
      } else {
        modal.classList.remove('admin-modal-loading');
      }
    }
  };
}

export function closeModal() {
  if (_activeModal) {
    const closeBtn = _activeModal.querySelector('.admin-modal-close');
    if (closeBtn) closeBtn.click();
    else {
      if (_activeModal.parentNode) _activeModal.parentNode.removeChild(_activeModal);
      document.body.style.overflow = '';
      _activeModal = null;
    }
  }
}

export function confirmModal({
  title = 'تأكيد الإجراء',
  message = 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger' // danger, primary, warning
}) {
  return new Promise((resolve) => {
    const footer = `
      <button type="button" class="btn btn-secondary btn-cancel-confirm">${escapeHtml(cancelText)}</button>
      <button type="button" class="btn btn-${variant} btn-action-confirm">${escapeHtml(confirmText)}</button>
    `;

    const modal = showModal({
      title,
      content: `<p class="admin-confirm-msg">${escapeHtml(message)}</p>`,
      footer,
      size: 'sm',
      onClose: () => resolve(false)
    });

    const actionBtn = modal.element.querySelector('.btn-action-confirm');
    const cancelBtn = modal.element.querySelector('.btn-cancel-confirm');

    actionBtn.addEventListener('click', () => {
      modal.close();
      resolve(true);
    });

    cancelBtn.addEventListener('click', () => {
      modal.close();
      resolve(false);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
