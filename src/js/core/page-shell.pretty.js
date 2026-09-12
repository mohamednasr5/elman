// i18n-aware shared shell fixes
import { initAuth, onAuthStateChange, waitForAuth, isAdmin } from './auth.js';
import { t, getLang, isEnglish, localizeUrl, switchLanguage, applyLangToDOM } from './i18n.js';

function _headerHTML(active='') {
  const links = [
    ['/index.html','nav_home',''],['/popular.html','nav_popular','🔥'],['/places.html','nav_places',''],['/categories.html','nav_categories',''],
    ['/offers.html','nav_offers',''],['/now.html','nav_now','🤝'],['/around-me.html','nav_around_me','🧭'],['/favorites.html','nav_favorites','❤️']
  ];
  const norm = p => String(p || '').replace(/^\/+/, '');
  const current = norm(active);
  return `<header class="header" id="site-header" role="banner"><div class="container header__inner">
    <a href="${localizeUrl('/index.html')}" class="header__logo" aria-label="${t('site_title')}">
      <img src="/icons/icon-96x96.png" alt="${t('site_title')}" width="36" height="36" class="header__logo-img">
      <div class="header__logo-text"><span class="header__logo-name">${t('site_title')}</span></div>
    </a>
    <div class="header-search-expandable" id="header-search-container" role="search"><div class="header-search-pill" id="header-search-pill">
      <button type="button" class="header-search-btn-trigger" id="header-search-trigger" aria-label="${t('header_search_aria')}" title="${t('header_search_title')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>
      <input type="search" id="header-search-input" class="header-search-input" placeholder="${t('search_placeholder')}" autocomplete="off" aria-label="${t('search_placeholder')}">
      <button type="button" class="header-search-clear-btn" id="header-search-clear" aria-label="${t('search_clear')}" title="${t('search_clear')}">✕</button>
    </div>
    <div class="header-live-dropdown" id="header-live-dropdown" aria-live="polite">
      <div class="header-live-dropdown__header"><span>⚡ ${t('search_live_results')}</span><span class="header-live-dropdown__count" id="header-live-count">0</span></div>
      <div class="header-live-dropdown__list" id="header-live-list"></div>
      <div class="header-live-dropdown__footer"><a href="${localizeUrl('/search.html')}" class="header-live-dropdown__all-btn"><span>${t('search_view_all')}</span><span>${isEnglish()?'→':'←'}</span></a></div>
    </div></div>
    <nav class="header__nav" aria-label="${t('nav_aria')}">${links.map(([file,key,emoji])=>`<a href="${localizeUrl(file)}" class="header__nav-link${norm(file)===current?' active':''}"><span>${t(key)}</span>${emoji?`<span class="header__nav-emoji">${emoji}</span>`:''}</a>`).join('')}</nav>
    <button type="button" class="lang-toggle-btn" id="lang-toggle-btn" aria-label="${t('lang_aria')}" title="${t('lang_aria')}"><span class="lang-globe">🌐</span><span class="lang-name">${t('lang_toggle_label')}</span></button>
    <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="${t('theme_aria')}" title="${t('theme_aria')}"><span class="theme-icon-light">☀️</span><span class="theme-icon-dark">🌙</span></button>
    <div class="header__user" id="header-user-section"><a href="${localizeUrl('/login.html')}" class="btn btn-primary btn-sm"><span>🔑</span> ${t('nav_login')}</a></div>
  </div></header>`;
}

export async function initPage(activeFile='') {
  _inject('header-slot', _headerHTML(activeFile));
  _bindLanguageToggle();
  _bindThemeToggle();
  applyLangToDOM(getLang());
  try { initAuth(); onAuthStateChange(() => {}); } catch (_) {}
}

function _bindLanguageToggle() {
  const btn = document.getElementById('lang-toggle-btn');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound='1';
  btn.addEventListener('click', () => switchLanguage(getLang()==='ar' ? 'en' : 'ar'));
}

function _bindThemeToggle() {
  document.querySelectorAll('#theme-toggle-btn,.theme-toggle-btn').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound='1';
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      document.body?.classList.toggle('dark-theme', next === 'dark');
      document.body?.classList.toggle('light-theme', next === 'light');
      localStorage.setItem('elmanzala-theme', next);
    });
  });
}

function _inject(id, html) {
  const slot=document.getElementById(id);
  if (!slot) return;
  const tmp=document.createElement('div');
  tmp.innerHTML=html.trim();
  slot.replaceWith(tmp.firstElementChild);
}

export { waitForAuth, isAdmin };
