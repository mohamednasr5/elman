/**
 * المنزلة وناسها — Toast Notifications Component
 */

let _container = null;

function ensureContainer() {
  if (!_container || !document.body.contains(_container)) {
    _container = document.createElement('div');
    _container.id = 'admin-toast-container';
    _container.className = 'admin-toast-container';
    document.body.appendChild(_container);
  }
  return _container;
}

export const toast = {
  show(message, type = 'info', duration = 4000) {
    const container = ensureContainer();
    
    const el = document.createElement('div');
    el.className = `admin-toast admin-toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    el.innerHTML = `
      <span class="admin-toast-icon">${icons[type] || 'ℹ'}</span>
      <div class="admin-toast-body">${escapeHtml(message)}</div>
      <button type="button" class="admin-toast-close" aria-label="إغلاق">&times;</button>
    `;

    const closeBtn = el.querySelector('.admin-toast-close');
    const close = () => {
      el.classList.add('admin-toast-hiding');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    };

    closeBtn.addEventListener('click', close);
    container.appendChild(el);

    if (duration > 0) {
      setTimeout(close, duration);
    }

    return { close };
  },

  success(msg, duration = 4000) {
    return this.show(msg, 'success', duration);
  },

  error(msg, duration = 6000) {
    return this.show(msg, 'error', duration);
  },

  warning(msg, duration = 5000) {
    return this.show(msg, 'warning', duration);
  },

  info(msg, duration = 4000) {
    return this.show(msg, 'info', duration);
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
