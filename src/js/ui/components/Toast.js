/**
 * المنزلة وناسها — Toast Notification Component
 * Mobile/PWA friendly: success and action feedback stay centered in the viewport
 * so they are not hidden behind the browser chrome or bottom navigation.
 */

// Side-effect module: place rating motion is initialized whenever this shared
// component is loaded; it only acts when .google-rating-card exists in the DOM.
import '../animations/place-rating-animation.js';

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

  toast.querySelector('.toast__close').addEventListener('click', () => dismiss(toast));
  container.appendChild(toast);

  const timer = setTimeout(() => dismiss(toast), duration);
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
  setTimeout(() => toast.remove(), 400);
}

// Convenience methods
export const toast = {
  success: (msg, duration) => showToast(msg, 'success', duration),
  error:   (msg, duration) => showToast(msg, 'error', duration || 6000),
  warning: (msg, duration) => showToast(msg, 'warning', duration),
  info:    (msg, duration) => showToast(msg, 'info', duration),
  show:    showToast,
  custom: ({ title, message, icon = '🔔', actionText, actionUrl, duration = 6000 } = {}) => {
    const container = getContainer();
    const el = document.createElement('div');
    el.className = 'toast toast--info';
    el.setAttribute('role', 'alert');
    el.style.setProperty('--duration', `${duration}ms`);

    el.innerHTML = `
      <div class="toast__custom-content">
        <span class="toast__custom-icon" aria-hidden="true">${escapeHtml(icon)}</span>
        <div class="toast__custom-copy">
          <div class="toast__custom-title">${escapeHtml(title || '')}</div>
          <div class="toast__custom-message">${escapeHtml(message || '')}</div>
          ${actionText && actionUrl ? `
            <a href="${escapeHtml(actionUrl)}" target="${actionUrl.startsWith('http') ? '_blank' : '_self'}" class="btn btn-sm btn-primary toast__custom-action">
              ${escapeHtml(actionText)}
            </a>
          ` : ''}
        </div>
        <button class="toast__close" aria-label="إغلاق">✕</button>
      </div>
    `;

    el.querySelector('.toast__close')?.addEventListener('click', () => dismiss(el));
    container.appendChild(el);

    const timer = setTimeout(() => dismiss(el), duration);
    el._dismissTimer = timer;
    return { dismiss: () => { clearTimeout(timer); dismiss(el); } };
  }
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
