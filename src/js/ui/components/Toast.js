/**
 * المنزلة وناسها — Toast Notification Component
 */

let _container = null;

function getContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'toast-container';
    _container.setAttribute('role', 'region');
    _container.setAttribute('aria-label', 'الإشعارات');
    document.body.appendChild(_container);
  }
  return _container;
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'|'default'} type
 * @param {number} duration ms
 */
export function showToast(message, type = 'default', duration = 4000) {
  const container = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.style.setProperty('--duration', `${duration}ms`);

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
    default: '●'
  };

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type] || icons.default}</span>
    <span class="toast__message">${escapeHtml(message)}</span>
    <button class="toast__close" aria-label="إغلاق">✕</button>
  `;

  // Style duration for progress bar
  toast.querySelector('.toast__close').addEventListener('click', () => dismiss(toast));

  container.appendChild(toast);

  // Auto-dismiss
  const timer = setTimeout(() => dismiss(toast), duration);

  // Store timer reference
  toast._dismissTimer = timer;

  return {
    dismiss: () => {
      clearTimeout(timer);
      dismiss(toast);
    },
    update: (newMessage) => {
      toast.querySelector('.toast__message').textContent = newMessage;
    }
  };
}

function dismiss(toast) {
  if (!toast.parentNode) return;
  toast.classList.add('removing');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
  setTimeout(() => toast.remove(), 400); // Fallback
}

// Convenience methods
export const toast = {
  success: (msg, duration) => showToast(msg, 'success', duration),
  error:   (msg, duration) => showToast(msg, 'error', duration || 6000),
  warning: (msg, duration) => showToast(msg, 'warning', duration),
  info:    (msg, duration) => showToast(msg, 'info', duration),
  show:    showToast
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
