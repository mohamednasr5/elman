/**
 * English authenticated header.
 * Keeps the English shell independent from Arabic labels while reusing the
 * same Firebase/Turso authentication state and account actions.
 */
import { initAuth, onAuthStateChange, signInWithGoogle, signOut, isAdmin } from './auth.js';

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function renderSignedOut(container) {
  container.innerHTML = `
    <a href="/en/login/" class="btn btn-primary btn-sm english-header-login-btn" id="english-header-login-btn">
      <span aria-hidden="true">🔑</span> Sign In
    </a>
  `;
  container.querySelector('#english-header-login-btn')?.addEventListener('click', async event => {
    event.preventDefault();
    const btn = event.currentTarget;
    btn.classList.add('loading');
    btn.setAttribute('aria-busy', 'true');
    btn.style.pointerEvents = 'none';
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('[EnglishAuth] Google sign-in failed:', error);
      window.location.href = '/en/login/';
    } finally {
      btn.classList.remove('loading');
      btn.removeAttribute('aria-busy');
      btn.style.pointerEvents = '';
    }
  });
}

function renderSignedIn(container, user) {
  const firstName = String(user?.name || 'Account').trim().split(/\s+/)[0] || 'Account';
  const photo = user?.photoURL || '/icons/icon-72x72.png';
  container.innerHTML = `
    <div class="header__user english-header-user">
      <button class="header__user-btn english-header-user-btn" id="english-user-menu-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <img src="${esc(photo)}" alt="${esc(user?.name || 'Account')}" class="header__avatar" width="32" height="32" loading="eager" decoding="async" onerror="this.src='/icons/icon-72x72.png'">
        <span class="header__user-name">${esc(firstName)}</span>
        <span aria-hidden="true">▾</span>
      </button>
      <div class="header__dropdown english-header-dropdown" id="english-user-dropdown" role="menu">
        <a href="/en/dashboard/" class="header__dropdown-item" role="menuitem">🏠 Dashboard</a>
        <a href="/en/dashboard/?section=places" class="header__dropdown-item" role="menuitem">📍 My Places</a>
        <a href="/en/dashboard/?section=add" class="header__dropdown-item" role="menuitem">➕ Add a Place</a>
        ${isAdmin(user) ? '<div class="header__dropdown-divider"></div><a href="/en/dashboard/?section=admin" class="header__dropdown-item" role="menuitem">⚙️ Administration</a>' : ''}
        <div class="header__dropdown-divider"></div>
        <button class="header__dropdown-item header__dropdown-item--danger" id="english-logout-btn" type="button" role="menuitem">🚪 Sign Out</button>
      </div>
    </div>
  `;

  const menuBtn = container.querySelector('#english-user-menu-btn');
  const dropdown = container.querySelector('#english-user-dropdown');
  menuBtn?.addEventListener('click', event => {
    event.stopPropagation();
    const open = dropdown?.classList.toggle('open') || false;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  if (!container.dataset.documentClickBound) {
    document.addEventListener('click', () => {
      dropdown?.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    });
    container.dataset.documentClickBound = '1';
  }
  container.querySelector('#english-logout-btn')?.addEventListener('click', async () => {
    try { await signOut(); } catch (error) { console.error('[EnglishAuth] sign-out failed:', error); }
  });
}

export async function installEnglishAuthHeader() {
  const container = document.getElementById('header-user-section');
  if (!container) return;

  await initAuth();
  const paint = user => user ? renderSignedIn(container, user) : renderSignedOut(container);
  paint(null);
  onAuthStateChange(paint);
}
