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
  show:    showToast,
  custom: ({ title, message, icon = '🔔', actionText, actionUrl, duration = 6000 } = {}) => {
    const container = getContainer();
    const el = document.createElement('div');
    el.className = 'toast toast--info';
    el.setAttribute('role', 'alert');
    el.style.setProperty('--duration', `${duration}ms`);
    el.style.background = 'var(--surface-card, #0F2B48)';
    el.style.color = '#fff';
    el.style.border = '1.5px solid var(--secondary, #F5A623)';
    el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    el.style.borderRadius = '12px';
    el.style.padding = '12px 14px';

    el.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px;width:100%">
        <span style="font-size:1.4rem;flex-shrink:0">${icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:13.5px;color:#F5A623">${escapeHtml(title || '')}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.9);margin-top:2px;line-height:1.4">${escapeHtml(message || '')}</div>
          ${actionText && actionUrl ? `
            <a href="${escapeHtml(actionUrl)}" target="${actionUrl.startsWith('http') ? '_blank' : '_self'}" class="btn btn-sm btn-primary" style="margin-top:6px;font-size:11.5px;padding:4px 10px;border-radius:6px;font-weight:700;display:inline-block">
              ${escapeHtml(actionText)}
            </a>
          ` : ''}
        </div>
        <button class="toast__close" aria-label="إغلاق" style="color:rgba(255,255,255,0.7);background:none;border:none;cursor:pointer;font-size:14px">✕</button>
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
