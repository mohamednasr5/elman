/**
 * المنزلة وناسها — Global Layout & Common Functionality
 * Runs across all standalone HTML pages
 */

import { initFirebase } from './firebase.js';
import { initAuth, signInWithGoogle, signOut, getCurrentUser, isAdmin, onAuthStateChange } from './auth.js';
import { getSettings } from './db.js';
import { toast } from '../ui/components/Toast.js';

/**
 * Initialize layout for any page
 * @param {Object} options
 * @param {string} options.activeNav - 'home' | 'places' | 'categories' | 'offers' | 'products' | 'dashboard'
 */
export async function initPageLayout({ activeNav = '' } = {}) {
  // 1. Initialize Firebase
  initFirebase();

  // 2. Initialize Auth
  initAuth();

  // 3. Highlight current nav links
  highlightActiveNav(activeNav);

  // 4. Setup Header Search & Interactions
  setupHeaderEvents();

  // 5. Setup PWA Install Prompt
  setupPwaBanner();

  // 6. Load & Apply Site Settings
  loadAndApplySettings();

  // 7. Listen for Auth Changes to update Header
  onAuthStateChange((user) => {
    updateHeaderUserUI(user);
  });
}

function highlightActiveNav(activeNav) {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Desktop Header Nav
  document.querySelectorAll('.header__nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPath || (activeNav && href.includes(activeNav))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile Bottom Nav
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href === currentPath || (activeNav && href.includes(activeNav))) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function setupHeaderEvents() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Header Search Input
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      }
    });
  }

  // Mobile search button
  document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
    window.location.href = 'search.html';
  });
}

async function loadAndApplySettings() {
  try {
    const settings = await getSettings();
    if (!settings) return;

    // Site Name
    if (settings.general?.siteName) {
      document.querySelectorAll('.header__logo-name, .footer__logo-name').forEach(el => {
        el.textContent = settings.general.siteName;
      });
    }

    // Primary Color
    if (settings.general?.primaryColor) {
      document.documentElement.style.setProperty('--primary', settings.general.primaryColor);
    }

    // WhatsApp Links in footer
    const waLink = settings.contact?.whatsappLink || 'https://wa.me/wasendernew';
    const waFooterBtn = document.getElementById('footer-whatsapp-link');
    if (waFooterBtn) waFooterBtn.href = waLink;

  } catch (err) {
    console.warn('[Layout] Settings load:', err);
  }
}

export function updateHeaderUserUI(user) {
  const container = document.getElementById('header-user-section');
  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="header__user">
        <button class="header__user-btn" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
          <img src="${user.photoURL || './icons/icon-72x72.png'}" alt="${user.name}" class="header__avatar" width="32" height="32" />
          <span class="header__user-name">${user.name.split(' ')[0]}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div class="header__dropdown" id="user-dropdown" role="menu">
          <a href="dashboard.html" class="header__dropdown-item" role="menuitem">
            <span aria-hidden="true">🏠</span> لوحة تحكمي
          </a>
          <a href="dashboard.html?section=places" class="header__dropdown-item" role="menuitem">
            <span aria-hidden="true">📍</span> أماكني
          </a>
          <a href="dashboard.html?section=add" class="header__dropdown-item" role="menuitem">
            <span aria-hidden="true">➕</span> إضافة مكان
          </a>
          ${user.role === 'admin' || user.role === 'superadmin' ? `
            <div class="header__dropdown-divider"></div>
            <a href="admin.html" class="header__dropdown-item" role="menuitem" style="color:var(--secondary)">
              <span aria-hidden="true">⚙️</span> لوحة الإدارة
            </a>
          ` : ''}
          <div class="header__dropdown-divider"></div>
          <button class="header__dropdown-item header__dropdown-item--danger" id="logout-btn" role="menuitem">
            <span aria-hidden="true">🚪</span> تسجيل الخروج
          </button>
        </div>
      </div>
    `;

    const menuBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');

    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('open');
    });

    document.addEventListener('click', () => dropdown?.classList.remove('open'));

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await signOut();
      toast.success('تم تسجيل الخروج');
      window.location.reload();
    });

  } else {
    container.innerHTML = `
      <a href="login.html" class="btn btn-primary btn-sm header__login-btn">
        <span>🔑</span> دخول
      </a>
    `;
  }
}

// ── PWA Banner ──
let _deferredPrompt = null;

function setupPwaBanner() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    const banner = document.getElementById('pwa-banner');
    if (banner && !sessionStorage.getItem('pwa-dismissed')) {
      setTimeout(() => {
        banner.hidden = false;
        banner.classList.add('visible');
      }, 5000);
    }
  });

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (_deferredPrompt) {
      _deferredPrompt.prompt();
      _deferredPrompt = null;
      document.getElementById('pwa-banner')?.classList.remove('visible');
    }
  });

  document.getElementById('pwa-banner-close')?.addEventListener('click', () => {
    document.getElementById('pwa-banner')?.classList.remove('visible');
    sessionStorage.setItem('pwa-dismissed', '1');
  });
}
