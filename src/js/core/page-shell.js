// Shared page shell — bilingual, responsive, and safe for dynamic content.
import { initAuth, onAuthStateChange, waitForAuth, isAdmin } from './auth.js';
import { t, getLang, isEnglish, localizeUrl, switchLanguage, applyLangToDOM } from './i18n.js';
import { installI18nHardening, localizedHref } from './i18n-runtime.js';

function _headerHTML(active='') {
  const links = [
    ['/index.html','nav_home',''],['/popular.html','nav_popular','🔥'],['/places.html','nav_places',''],['/categories.html','nav_categories',''],
    ['/offers.html','nav_offers',''],['/now.html','nav_now','🤝'],['/around-me.html','nav_around_me','🧭'],['/favorites.html','nav_favorites','❤️']
  ];
  const norm = p => String(p || '').replace(/^\/+/, '').replace(/\.html$/,'');
  const current = norm(active);
  return `<header class="header" id="site-header" role="banner"><div class="container header__inner">
    <a href="${localizedHref('/index.html')}" class="header__logo" aria-label="${t('site_title')}">
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
      <div class="header-live-dropdown__footer"><a href="${localizedHref('/search.html')}" class="header-live-dropdown__all-btn"><span>${t('search_view_all')}</span><span>${isEnglish()?'→':'←'}</span></a></div>
    </div></div>
    <nav class="header__nav" aria-label="${t('nav_aria')}">${links.map(([file,key,emoji])=>`<a href="${localizedHref(file)}" class="header__nav-link${norm(file)===current?' active':''}"><span>${t(key)}</span>${emoji?`<span class="header__nav-emoji">${emoji}</span>`:''}</a>`).join('')}</nav>
    <button type="button" class="lang-toggle-btn" id="lang-toggle-btn" aria-label="${t('lang_aria')}" title="${t('lang_aria')}"><span class="lang-globe">🌐</span><span class="lang-name">${t('lang_toggle_label')}</span></button>
    <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="${t('theme_aria')}" title="${t('theme_aria')}"><span class="theme-icon-light">☀️</span><span class="theme-icon-dark">🌙</span></button>
    <div class="header__user" id="header-user-section"><a href="${localizedHref('/login.html')}" class="btn btn-primary btn-sm"><span>🔑</span> ${t('nav_login')}</a></div>
  </div></header>`;
}

function _bottomNavHTML(active='') {
  const items = [['/index.html','🏠','mobile_home'],['/categories.html','📋','mobile_categories'],['/offers.html','🏷️','mobile_offers'],['#more','☰','mobile_more']];
  const norm = p => String(p || '').replace(/^\/+/, '').replace(/\.html$/,'');
  const a = norm(active);
  return `<nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="${t('mobile_quick_nav')}">
    <a href="${localizedHref(items[0][0])}" class="bottom-nav__item${norm(items[0][0])===a?' active':''}"><span class="bottom-nav__icon">${items[0][1]}</span><span class="bottom-nav__label">${t(items[0][2])}</span></a>
    <a href="${localizedHref(items[1][0])}" class="bottom-nav__item${norm(items[1][0])===a?' active':''}"><span class="bottom-nav__icon">${items[1][1]}</span><span class="bottom-nav__label">${t(items[1][2])}</span></a>
    <div class="bottom-nav__fab"><button type="button" class="bottom-nav__fab-btn bottom-nav__voice-assistant-fab" id="global-voice-assistant-fab" aria-label="${t('voice_assistant')}"><span class="fab-letter-m">M</span><span class="fab-mic-badge">🎙️</span></button></div>
    <a href="${localizedHref(items[2][0])}" class="bottom-nav__item${norm(items[2][0])===a?' active':''}"><span class="bottom-nav__icon">${items[2][1]}</span><span class="bottom-nav__label">${t(items[2][2])}</span></a>
    <button type="button" class="bottom-nav__item" id="bottom-nav-more-btn" aria-label="${t('mobile_more')}"><span class="bottom-nav__icon">${items[3][1]}</span><span class="bottom-nav__label">${t(items[3][2])}</span></button>
  </nav>`;
}

function _footerHTML(){
  return `<footer class="footer" id="site-footer" role="contentinfo"><div class="container"><div class="footer__brand"><a href="${localizedHref('/index.html')}" class="footer__logo"><img src="/icons/icon-96x96.png" alt="${t('site_title')}" width="40" height="40"><span class="footer__logo-name">${t('site_title')}</span></a><p class="footer__description">${t('site_tagline')}</p></div></div></footer>`;
}

export async function initPage(activeFile='') {
  _inject('header-slot', _headerHTML(activeFile));
  _inject('footer-slot', _footerHTML());
  _inject('nav-slot', _bottomNavHTML(activeFile));
  _bindLanguageToggle();
  _bindThemeToggle();
  applyLangToDOM(getLang());
  installI18nHardening();
  try { initAuth(); onAuthStateChange(() => {}); } catch (_) {}
}

function _bindLanguageToggle(){
  const btn = document.getElementById('lang-toggle-btn');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound='1';
  btn.addEventListener('click', () => switchLanguage(getLang()==='ar' ? 'en' : 'ar'));
}

function _bindThemeToggle(){
  document.querySelectorAll('#theme-toggle-btn,.theme-toggle-btn').forEach(btn=>{
    if(btn.dataset.bound) return;
    btn.dataset.bound='1';
    btn.addEventListener('click',()=>{
      const current=document.documentElement.getAttribute('data-theme')||'light';
      const next=current==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',next);
      document.body?.classList.toggle('dark-theme',next==='dark');
      document.body?.classList.toggle('light-theme',next==='light');
      localStorage.setItem('elmanzala-theme',next);
    });
  });
}

function _inject(id,html){
  const slot=document.getElementById(id);
  if(!slot)return;
  const tmp=document.createElement('div');
  tmp.innerHTML=html.trim();
  slot.replaceWith(tmp.firstElementChild);
}

export { waitForAuth, isAdmin };
