/**
 * Interactive Hearts & Appreciation Animation for Eng. Mohamed Hammad's Avatar
 * Dalil El Manzala & El Matariya
 */
export function setupAvatarHearts() {
  const avatars = document.querySelectorAll('.developer-avatar, [data-developer-avatar]');
  if (!avatars.length) return;

  const isEn = document.documentElement.lang === 'en' || location.pathname.includes('/en/');

  const phrasesAr = [
    '❤️ بحبكم في الله',
    '✨ نورتوا الدليل',
    '🌸 سعيد أنكم هنا',
    '❤️ منورين دايماً',
    '🌟 أهلاً بأهلنا الكرام',
    '🤲 دمتم بألف خير'
  ];

  const phrasesEn = [
    '❤️ Love you all!',
    '✨ Welcome to Dalil!',
    '🌸 So glad you are here!',
    '❤️ Blessed to have you here!',
    '🌟 Enjoy your visit!',
    '✨ Always grateful for you!'
  ];

  const phrases = isEn ? phrasesEn : phrasesAr;
  let phraseIndex = 0;

  if (!document.getElementById('avatar-hearts-css')) {
    const style = document.createElement('style');
    style.id = 'avatar-hearts-css';
    style.textContent = `
      .developer-avatar,
      [data-developer-avatar] {
        cursor: pointer !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease !important;
        position: relative !important;
      }
      .developer-avatar:hover,
      [data-developer-avatar]:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 20px 50px rgba(239, 68, 68, 0.35), 0 0 30px rgba(245, 158, 11, 0.3) !important;
      }
      .developer-avatar:active,
      .developer-avatar.avatar-pop,
      [data-developer-avatar]:active,
      [data-developer-avatar].avatar-pop {
        animation: avatarHeartBounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      }
      @keyframes avatarHeartBounce {
        0% { transform: scale(1); }
        35% { transform: scale(0.90) rotate(-3deg); }
        65% { transform: scale(1.12) rotate(3deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .avatar-heart-particle {
        position: fixed;
        pointer-events: none;
        z-index: 100000;
        will-change: transform, opacity;
        animation: heartFlyUp var(--fly-duration, 1.8s) cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .avatar-heart-emoji {
        display: inline-block;
        font-size: var(--heart-size, 26px);
        filter: drop-shadow(0 6px 14px rgba(239, 68, 68, 0.6));
        animation: heartWiggle 0.6s ease-in-out infinite alternate;
      }
      .avatar-phrase-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #ef4444 0%, #e11d48 50%, #be123c 100%);
        color: #ffffff !important;
        font-size: clamp(13px, 2.8vw, 15px);
        font-weight: 800;
        font-family: inherit;
        padding: 8px 18px;
        border-radius: 9999px;
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 12px 30px rgba(225, 29, 72, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15);
        white-space: nowrap;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
        letter-spacing: 0.01em;
        animation: badgeShine 1s ease-in-out infinite alternate;
      }
      @keyframes heartFlyUp {
        0% {
          opacity: 0;
          transform: translate3d(0, 0, 0) scale(0.3) rotate(0deg);
        }
        15% {
          opacity: 1;
          transform: translate3d(calc(var(--drift-x, 0px) * 0.25), -40px, 0) scale(1.15) rotate(var(--rot, 0deg));
        }
        70% {
          opacity: 0.95;
          transform: translate3d(calc(var(--drift-x, 0px) * 0.8), calc(var(--fly-y, -180px) * 0.75), 0) scale(1) rotate(calc(var(--rot, 0deg) * 1.5));
        }
        100% {
          opacity: 0;
          transform: translate3d(var(--drift-x, 0px), var(--fly-y, -220px), 0) scale(0.85) rotate(calc(var(--rot, 0deg) * 2));
        }
      }
      @keyframes heartWiggle {
        from { transform: rotate(-10deg) scale(1); }
        to { transform: rotate(10deg) scale(1.1); }
      }
      @keyframes badgeShine {
        from { filter: brightness(1); }
        to { filter: brightness(1.1); }
      }
    `;
    document.head.appendChild(style);
  }

  function spawnCelebration(avatar, clickX, clickY) {
    avatar.classList.remove('avatar-pop');
    void avatar.offsetWidth;
    avatar.classList.add('avatar-pop');

    const rect = avatar.getBoundingClientRect();
    const originX = clickX || (rect.left + rect.width / 2);
    const originY = clickY || (rect.top + rect.height / 3);

    const phraseText = phrases[phraseIndex % phrases.length];
    phraseIndex++;

    const badge = document.createElement('div');
    badge.className = 'avatar-heart-particle';
    badge.style.left = `${originX}px`;
    badge.style.top = `${originY - 10}px`;
    badge.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 80}px`);
    badge.style.setProperty('--fly-y', `${-140 - Math.random() * 60}px`);
    badge.style.setProperty('--rot', `${(Math.random() - 0.5) * 12}deg`);
    badge.style.setProperty('--fly-duration', '2.2s');

    const badgeContent = document.createElement('div');
    badgeContent.className = 'avatar-phrase-badge';
    badgeContent.textContent = phraseText;
    badge.appendChild(badgeContent);
    document.body.appendChild(badge);

    setTimeout(() => badge.remove(), 2300);

    const heartIcons = ['❤️', '💖', '💝', '❤️', '💕', '✨', '❤️'];
    const count = 5 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const heart = document.createElement('div');
      heart.className = 'avatar-heart-particle';
      heart.style.left = `${originX}px`;
      heart.style.top = `${originY}px`;

      const driftX = (Math.random() - 0.5) * 220;
      const flyY = -120 - Math.random() * 150;
      const rot = (Math.random() - 0.5) * 45;
      const duration = 1.4 + Math.random() * 0.9;
      const delay = i * 45;

      heart.style.setProperty('--drift-x', `${driftX}px`);
      heart.style.setProperty('--fly-y', `${flyY}px`);
      heart.style.setProperty('--rot', `${rot}deg`);
      heart.style.setProperty('--fly-duration', `${duration}s`);
      heart.style.animationDelay = `${delay}ms`;

      const heartEl = document.createElement('span');
      heartEl.className = 'avatar-heart-emoji';
      heartEl.style.setProperty('--heart-size', `${20 + Math.floor(Math.random() * 18)}px`);
      heartEl.textContent = heartIcons[Math.floor(Math.random() * heartIcons.length)];
      heart.appendChild(heartEl);

      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), (duration * 1000) + delay + 200);
    }
  }

  avatars.forEach(avatar => {
    if (avatar.dataset.heartsBound) return;
    avatar.dataset.heartsBound = '1';
    avatar.setAttribute('role', 'button');
    avatar.setAttribute('tabindex', '0');
    avatar.setAttribute('title', isEn ? 'Click me ❤️' : 'اضغط هنا ❤️');

    avatar.addEventListener('click', e => {
      spawnCelebration(avatar, e.clientX, e.clientY);
    });

    avatar.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        spawnCelebration(avatar);
      }
    });
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAvatarHearts);
  } else {
    setupAvatarHearts();
  }
}
