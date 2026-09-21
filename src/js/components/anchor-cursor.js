/**
 * Springing ship-anchor pointer for desktop pointer devices.
 * Keeps the native text cursor on editable controls for accessibility.
 */
let anchorCursorInitialized = false;

export function initAnchorCursor() {
  if (anchorCursorInitialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  anchorCursorInitialized = true;

  const finePointer = window.matchMedia?.('(pointer: fine)');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!finePointer?.matches || reducedMotion?.matches) return;

  const anchor = document.createElement('div');
  anchor.className = 'anchor-cursor';
  anchor.setAttribute('aria-hidden', 'true');
  anchor.innerHTML = `
    <svg viewBox="0 0 64 64" focusable="false">
      <defs>
        <linearGradient id="anchorCursorMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f8fafc"/>
          <stop offset=".45" stop-color="#94a3b8"/>
          <stop offset="1" stop-color="#334155"/>
        </linearGradient>
      </defs>
      <path d="M32 7v30" fill="none" stroke="url(#anchorCursorMetal)" stroke-width="7" stroke-linecap="round"/>
      <circle cx="32" cy="10" r="7" fill="none" stroke="url(#anchorCursorMetal)" stroke-width="5"/>
      <path d="M17 27c0 11 6.7 18 15 18s15-7 15-18" fill="none" stroke="url(#anchorCursorMetal)" stroke-width="7" stroke-linecap="round"/>
      <path d="M9 42l8 8 8-8M55 42l-8 8-8-8" fill="none" stroke="url(#anchorCursorMetal)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 55h24" fill="none" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
  document.body.appendChild(anchor);
  document.documentElement.classList.add('has-anchor-cursor');

  let targetX = -100, targetY = -100, x = targetX, y = targetY, vx = 0, vy = 0;
  let visible = false;

  const onMove = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    visible = true;
    anchor.classList.add('is-visible');
  };
  const onLeave = () => {
    visible = false;
    anchor.classList.remove('is-visible');
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave, { passive: true });

  const tick = () => {
    if (!visible) {
      x += (-100 - x) * 0.12;
      y += (-100 - y) * 0.12;
    } else {
      const dx = targetX - x;
      const dy = targetY - y;
      vx += dx * 0.16;
      vy += dy * 0.16;
      vx *= 0.72;
      vy *= 0.72;
      x += vx;
      y += vy;
    }
    const speed = Math.min(12, Math.hypot(vx, vy));
    const angle = Math.max(-8, Math.min(8, vx * 0.7));
    anchor.style.transform = `translate3d(${x}px,${y}px,0) rotate(${angle}deg) scale(${1 + speed * 0.008})`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
