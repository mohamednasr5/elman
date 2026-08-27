/**
 * المنزلة وناسها — Modal Component
 * Accessible, animated modal dialogs and bottom sheets
 */

let _activeModal = null;

/**
 * Show a modal
 * @param {Object} options
 * @param {string} options.title
 * @param {string|HTMLElement} options.content
 * @param {Array} options.buttons - [{label, type, onClick, closeOnClick}]
 * @param {string} options.size - 'sm'|''|'lg'|'xl'
 * @param {boolean} options.sheet - Use bottom sheet on mobile
 * @param {boolean} options.closeable - Show close button
 * @param {Function} options.onClose
 * @returns {Object} { close, setContent, setTitle }
 */
export function showModal({
  title = '',
  content = '',
  buttons = [],
  size = '',
  sheet = false,
  closeable = true,
  onClose = null
} = {}) {
  // Close any existing modal
  if (_activeModal) _activeModal.close();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  if (title) overlay.setAttribute('aria-label', title);

  // Create modal
  const modal = document.createElement('div');
  modal.className = `modal${size ? ` modal--${size}` : ''}${sheet ? ' modal--sheet' : ''}`;

  // Drag handle for sheets
  if (sheet) {
    modal.innerHTML = `<div class="modal__drag-handle"></div>`;
  }

  // Header
  if (title || closeable) {
    const header = document.createElement('div');
    header.className = 'modal__header';
    header.innerHTML = `
      <h2 class="modal__title">${title}</h2>
      ${closeable ? '<button class="modal__close" aria-label="إغلاق">✕</button>' : ''}
    `;
    modal.appendChild(header);

    if (closeable) {
      header.querySelector('.modal__close').addEventListener('click', close);
    }
  }

  // Body
  const body = document.createElement('div');
  body.className = 'modal__body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }
  modal.appendChild(body);

  // Footer with buttons
  if (buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal__footer';
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `btn btn-${btn.type || 'primary'}${btn.size ? ` btn-${btn.size}` : ''}`;
      button.textContent = btn.label;
      button.addEventListener('click', () => {
        if (btn.onClick) btn.onClick();
        if (btn.closeOnClick !== false) close();
      });
      footer.appendChild(button);
    });
    modal.appendChild(footer);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Close on backdrop click
  if (closeable) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  // Close on Escape
  const keyHandler = (e) => {
    if (e.key === 'Escape' && closeable) close();
  };
  document.addEventListener('keydown', keyHandler);

  function close() {
    overlay.classList.remove('active');
    document.removeEventListener('keydown', keyHandler);
    document.body.style.overflow = '';
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    setTimeout(() => overlay.remove(), 400); // Fallback
    _activeModal = null;
    if (onClose) onClose();
  }

  const api = {
    close,
    setContent: (newContent) => {
      if (typeof newContent === 'string') {
        body.innerHTML = newContent;
      } else {
        body.innerHTML = '';
        body.appendChild(newContent);
      }
    },
    setTitle: (newTitle) => {
      const titleEl = modal.querySelector('.modal__title');
      if (titleEl) titleEl.textContent = newTitle;
    },
    getBody: () => body
  };

  _activeModal = api;
  return api;
}

/**
 * Show a confirmation dialog
 */
export function showConfirm({
  title = 'تأكيد',
  message = 'هل أنت متأكد؟',
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  confirmType = 'danger',
  icon = '⚠️'
}) {
  return new Promise((resolve) => {
    const modal = showModal({
      title,
      size: 'sm',
      closeable: true,
      content: `
        <div class="confirm-dialog">
          <div class="confirm-dialog__icon">${icon}</div>
          <div class="confirm-dialog__title">${title}</div>
          <p class="confirm-dialog__text">${message}</p>
        </div>
      `,
      buttons: [
        {
          label: confirmLabel,
          type: confirmType,
          onClick: () => resolve(true),
          closeOnClick: true
        },
        {
          label: cancelLabel,
          type: 'ghost',
          onClick: () => resolve(false),
          closeOnClick: true
        }
      ],
      onClose: () => resolve(false)
    });
  });
}

/**
 * Show alert dialog
 */
export function showAlert({
  title = 'تنبيه',
  message,
  icon = 'ℹ️'
}) {
  return new Promise((resolve) => {
    showModal({
      title,
      size: 'sm',
      content: `
        <div style="text-align:center;padding:var(--space-4) 0">
          <div style="font-size:2.5rem;margin-bottom:var(--space-3)">${icon}</div>
          <p style="color:var(--text-secondary)">${message}</p>
        </div>
      `,
      buttons: [
        { label: 'حسناً', type: 'primary', onClick: () => resolve(), closeOnClick: true }
      ],
      onClose: () => resolve()
    });
  });
}

/**
 * Close active modal programmatically
 */
export function closeModal() {
  _activeModal?.close();
}
