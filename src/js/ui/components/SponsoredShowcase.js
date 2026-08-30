/**
 * المنزلة وناسها — Sponsored Places Showcase Component
 * Displays prominent sponsored / paid ad cards in dedicated showcase zones
 * with instant random shuffle on refresh and automatic 60-second rotation.
 */

import { renderPlaceCard } from './PlaceCard.js';

const _rotationTimers = new Map();

/**
 * Render and mount the Sponsored Ads Showcase in a container
 * @param {HTMLElement|string} target - Container element or ID
 * @param {Array} places - List of places
 * @param {Object} options - Custom options (title, subtitle, maxVisible)
 */
export function mountSponsoredShowcase(target, places = [], options = {}) {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  // Filter only active unexpired sponsored places
  const now = Date.now();
  const sponsored = (places || []).filter(p => 
    (p.isSponsored || p.isFeatured || p.isPromoted) && 
    (!p.sponsoredUntil || p.sponsoredUntil > now)
  );

  if (sponsored.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  // Shuffle initially on page load for fair exposure
  const shuffled = [...sponsored].sort(() => Math.random() - 0.5);
  
  const title = options.title || 'أماكن وإعلانات مميزة';
  const subtitle = options.subtitle || 'أنشطة وخدمات موصى بها في المنزلة';
  const maxVisible = options.maxVisible || 3;
  let currentIndex = 0;

  // Generate unique instance ID
  const instanceId = 'spons-showcase-' + Math.random().toString(36).slice(2, 8);

  container.innerHTML = `
    <div class="sponsored-showcase-wrapper" id="${instanceId}">
      <div class="sponsored-showcase-header">
        <div class="sponsored-showcase-title-wrap">
          <div class="sponsored-showcase-badge">
            <span class="pulse-dot"></span>
            <span>⭐ إعلانات مميزة</span>
          </div>
          <h2 class="sponsored-showcase-title">${title}</h2>
          <p class="sponsored-showcase-subtitle">${subtitle}</p>
        </div>

        <div class="sponsored-showcase-actions" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <a href="https://wa.me/wasendernew?text=${encodeURIComponent('مرحباً، أود حجز إعلان مميز يظهر في دليل المنزلة والمطرية الرقمي')}" 
             target="_blank" 
             rel="noopener" 
             class="btn btn-sm btn-secondary sponsored-cta-btn" 
             style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;border-radius:var(--radius-full);white-space:nowrap;box-shadow:0 2px 10px rgba(245,166,35,0.25);transition:transform 0.2s">
            <span>📣</span>
            <span>لو عاوز إعلانك يظهر هنا تواصل معنا</span>
          </a>

          ${shuffled.length > 1 ? `
            <div class="sponsored-showcase-controls">
              <span class="sponsored-timer-tag" title="تتغير البطاقات تلقائياً كل دقيقة">
                ⏱️ تحديث كل دقيقة
              </span>
              <button class="sponsored-nav-btn prev-btn" aria-label="السابق">❮</button>
              <button class="sponsored-nav-btn next-btn" aria-label="التالي">❯</button>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="sponsored-cards-grid" id="${instanceId}-grid">
        <!-- Cards injected dynamically -->
      </div>
    </div>
  `;

  const gridEl = document.getElementById(`${instanceId}-grid`);
  const prevBtn = container.querySelector('.prev-btn');
  const nextBtn = container.querySelector('.next-btn');

  function renderCurrentSlice() {
    if (!gridEl) return;
    
    // Pick slice of places
    const visiblePlaces = [];
    const count = Math.min(maxVisible, shuffled.length);
    for (let i = 0; i < count; i++) {
      const idx = (currentIndex + i) % shuffled.length;
      visiblePlaces.push(shuffled[idx]);
    }

    gridEl.classList.remove('fade-in-cards');
    void gridEl.offsetWidth; // Trigger reflow for animation
    gridEl.innerHTML = visiblePlaces.map(p => renderPlaceCard(p)).join('');
    gridEl.classList.add('fade-in-cards');
  }

  function advanceNext() {
    if (shuffled.length <= 1) return;
    currentIndex = (currentIndex + 1) % shuffled.length;
    renderCurrentSlice();
  }

  function advancePrev() {
    if (shuffled.length <= 1) return;
    currentIndex = (currentIndex - 1 + shuffled.length) % shuffled.length;
    renderCurrentSlice();
  }

  // Initial render
  renderCurrentSlice();

  // Button clicks
  prevBtn?.addEventListener('click', advancePrev);
  nextBtn?.addEventListener('click', advanceNext);

  // Clear previous timer for this container if exists
  if (_rotationTimers.has(container)) {
    clearInterval(_rotationTimers.get(container));
  }

  // Auto rotate every 60 seconds (1 minute) if more than 1 sponsored place exists
  if (shuffled.length > 1) {
    const timer = setInterval(advanceNext, 60000);
    _rotationTimers.set(container, timer);
  }
}
