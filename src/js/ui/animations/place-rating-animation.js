/**
 * Dalil Manzala — Place Rating Motion
 * Animates the rating score, stars, and distribution bars after the
 * place rating card enters the DOM. Safe for SPA re-renders.
 */

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function animateScore(el) {
  const raw = String(el.textContent || '').replace(/[^0-9.]/g, '');
  const target = Number.parseFloat(raw);
  if (!Number.isFinite(target)) return;

  if (reduceMotion()) {
    el.textContent = target.toFixed(1);
    return;
  }

  const duration = 1450;
  const started = performance.now();

  el.classList.add('dm-rating-score-counting');

  const frame = (now) => {
    const progress = clamp((now - started) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = value.toFixed(1);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = target.toFixed(1);
      el.classList.remove('dm-rating-score-counting');
      el.classList.add('dm-rating-score-complete');
    }
  };

  el.textContent = '0.0';
  requestAnimationFrame(frame);
}

function animateStars(el, score) {
  const rounded = clamp(Math.round(score), 0, 5);
  const existing = String(el.textContent || '');
  const starCount = Math.max(rounded, (existing.match(/★/g) || []).length);

  el.textContent = '';
  el.classList.add('dm-rating-stars-animating');

  for (let i = 0; i < starCount; i += 1) {
    const star = document.createElement('span');
    star.className = 'dm-rating-star';
    star.textContent = '★';
    star.setAttribute('aria-hidden', 'true');
    star.style.setProperty('--star-delay', `${i * 125}ms`);
    el.appendChild(star);
  }

  if (reduceMotion()) {
    el.classList.remove('dm-rating-stars-animating');
    return;
  }

  setTimeout(() => el.classList.remove('dm-rating-stars-animating'), starCount * 125 + 700);
}

function animateBars(card) {
  const fills = card.querySelectorAll('.google-rating-bars .bar-fill');
  fills.forEach((fill, index) => {
    const inlineWidth = String(fill.style.width || '').trim();
    const target = Number.parseFloat(inlineWidth);
    if (!Number.isFinite(target)) return;

    fill.dataset.ratingTarget = String(clamp(target, 0, 100));

    if (reduceMotion()) {
      fill.style.width = `${clamp(target, 0, 100)}%`;
      return;
    }

    fill.style.setProperty('--dm-rating-width', `${clamp(target, 0, 100)}%`);
    fill.style.width = '0%';
    fill.classList.add('dm-rating-bar-animating');
    fill.style.setProperty('--dm-bar-delay', `${index * 90}ms`);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.width = `${clamp(target, 0, 100)}%`;
      });
    });

    setTimeout(() => fill.classList.remove('dm-rating-bar-animating'), 950 + index * 90);
  });
}

function animateRatingCard(card) {
  if (!card || card.dataset.dmRatingAnimated === '1') return;
  card.dataset.dmRatingAnimated = '1';

  const scoreEl = card.querySelector('.google-rating-score');
  const starsEl = card.querySelector('.google-rating-stars');

  if (!scoreEl) return;
  const raw = String(scoreEl.textContent || '').replace(/[^0-9.]/g, '');
  const score = Number.parseFloat(raw);
  if (!Number.isFinite(score)) return;

  animateScore(scoreEl);
  if (starsEl) animateStars(starsEl, score);
  animateBars(card);

  card.classList.add('dm-rating-card-ready');
}

function scan(root = document) {
  root.querySelectorAll?.('.google-rating-card').forEach(animateRatingCard);
}

function init() {
  scan(document);

  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.('.google-rating-card')) animateRatingCard(node);
          scan(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
