/**
 * Place 3D Views Badge with Animated Eye Icon
 * Styled exactly like the 3D category tag (.place-category-tag) in 3D tactile pill style
 * with a distinctive pupil glance and eyelid blink animation.
 */

export function getAnimatedEyeSvg(options = {}) {
  const size = options.size || 16;
  return `
    <svg class="p3d-eye-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g class="p3d-eye-lid">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <g class="p3d-eye-pupil">
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <circle cx="13.2" cy="10.8" r="0.95" fill="#ffffff" stroke="none" />
        </g>
      </g>
    </svg>
  `;
}

export function resolvePlaceViewsCount(placeOrViews) {
  if (typeof placeOrViews === 'number') {
    return Math.max(1, Math.round(placeOrViews));
  }
  if (!placeOrViews || typeof placeOrViews !== 'object') {
    return 1;
  }
  const count = Number(
    placeOrViews.views ??
    placeOrViews.stats?.views ??
    placeOrViews.viewsCount ??
    placeOrViews.views_count ??
    placeOrViews.viewCount ??
    0
  );
  return Math.max(1, Math.round(count));
}

/**
 * Renders 3D View Count Badge matching the 3D category button (.place-category-tag)
 * @param {Object|number} placeOrViews Place object or view count
 * @param {Object} options Configuration options ({ isEn, compact })
 * @returns {string} HTML string for the 3D view badge
 */
export function renderPlaceViewsBadgeHTML(placeOrViews, options = {}) {
  const isEn = Boolean(options.isEn);
  const compact = Boolean(options.compact);
  const views = resolvePlaceViewsCount(placeOrViews);

  const formattedNum = views.toLocaleString('en-US');
  const labelText = isEn ? 'views' : 'مشاهدة';
  const tooltipText = isEn 
    ? `${formattedNum} total views` 
    : `تمت مشاهدة هذا المكان ${formattedNum} مرة`;

  const compactClass = compact ? 'place-views-badge-3d--compact' : '';
  const eyeSvg = getAnimatedEyeSvg({ size: compact ? 14 : 16 });

  return `
    <div class="place-views-badge-3d ${compactClass}" title="${tooltipText}" aria-label="${formattedNum} ${labelText}">
      <span class="place-views-eye" aria-hidden="true">${eyeSvg}</span>
      <span class="place-views-num">${formattedNum}</span>
      <span class="place-views-txt">${labelText}</span>
    </div>
  `;
}
