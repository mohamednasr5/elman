/**
 * المنزلة وناسها — Stat Card Component
 * CRITICAL RULE: Never converts failures into 0.
 * If data fails or is unavailable, explicitly renders "غير متاح" with a retry action.
 */

export function renderStatCard({
  id = '',
  title = '',
  value = null,
  icon = '',
  subtitle = '',
  badge = '',
  badgeType = 'neutral',
  isLoading = false,
  isError = false,
  errorMessage = 'غير متاح',
  onRetry = null
}) {
  const card = document.createElement('div');
  card.className = 'admin-stat-card';
  if (id) card.id = `stat-card-${id}`;

  if (isLoading) {
    card.innerHTML = `
      <div class="stat-card-header">
        <span class="skeleton-text" style="width: 60%; height: 16px;"></span>
        <span class="skeleton-circle" style="width: 36px; height: 36px;"></span>
      </div>
      <div class="stat-card-body">
        <span class="skeleton-text" style="width: 40%; height: 32px; margin-top: 8px;"></span>
      </div>
      <div class="stat-card-footer">
        <span class="skeleton-text" style="width: 80%; height: 14px;"></span>
      </div>
    `;
    return card;
  }

  if (isError || value === null || value === undefined) {
    card.classList.add('stat-card-error');
    card.innerHTML = `
      <div class="stat-card-header">
        <span class="stat-card-title">${escapeHtml(title)}</span>
        <span class="stat-card-icon stat-icon-error">⚠</span>
      </div>
      <div class="stat-card-body">
        <div class="stat-value-error-wrap">
          <span class="stat-value stat-value-error">${escapeHtml(errorMessage || 'غير متاح')}</span>
          <button type="button" class="btn-stat-retry" title="إعادة محاولة جلب البيانات">↻ إعادة المحاولة</button>
        </div>
      </div>
      <div class="stat-card-footer">
        <span class="stat-error-hint">تعذر الاستعلام من قاعدة البيانات</span>
      </div>
    `;

    if (onRetry) {
      const retryBtn = card.querySelector('.btn-stat-retry');
      if (retryBtn) retryBtn.addEventListener('click', onRetry);
    }
    return card;
  }

  // Valid metric display
  const formattedVal = typeof value === 'number' ? value.toLocaleString('ar-EG') : escapeHtml(value);

  card.innerHTML = `
    <div class="stat-card-header">
      <span class="stat-card-title">${escapeHtml(title)}</span>
      ${icon ? `<span class="stat-card-icon">${icon}</span>` : ''}
    </div>
    <div class="stat-card-body">
      <div class="stat-value-wrap">
        <span class="stat-value">${formattedVal}</span>
        ${badge ? `<span class="stat-badge stat-badge-${badgeType}">${escapeHtml(badge)}</span>` : ''}
      </div>
    </div>
    ${subtitle ? `<div class="stat-card-footer"><span class="stat-subtitle">${escapeHtml(subtitle)}</span></div>` : ''}
  `;

  return card;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
