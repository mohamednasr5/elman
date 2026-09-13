// Shared page shell — bilingual, responsive, and safe for dynamic content.
import { initAuth, onAuthStateChange, waitForAuth, isAdmin, signOut } from './auth.js';
import { getLang, isEnglish, switchLanguage, applyLangToDOM } from './i18n.js';
import { bindGlobalVoiceAssistantFab } from '../services/voice.service.js';

function _escShell(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _getStoredUser() {
  try {
    const raw = localStorage.getItem('manzala_persistent_user') || localStorage.getItem('manzala_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function _renderHeaderUserSlot(user = null) {
  const isEn = isEnglish();
  const u = user || _getStoredUser();
  if (u && (u.uid || u.id)) {
    const name = String(u.displayName || u.name || (isEn ? 'Account' : 'حسابي')).trim();
    const firstName = name.split(/\s+/)[0] || (isEn ? 'Account' : 'حسابي');
    const photo = u.photoURL || u.photo_url || '/icons/icon-72x72.png';
    const isUserAdmin = isAdmin(u);
    return `<div class="header__user" style="position:relative"><button class="header__user-btn" id="header-user-menu-btn" type="button" aria-haspopup="true" aria-expanded="false" title="${_escShell(name)}"><img src="${_escShell(photo)}" alt="${_escShell(firstName)}" class="header__avatar" width="32" height="32" onerror="this.src='/icons/icon-72x72.png'"><span class="header__user-name">${_escShell(firstName)}</span><span aria-hidden="true" style="font-size:10px">▾</span></button><div class="header__dropdown" id="header-user-dropdown" role="menu"><a href="${isEn ? '/en/dashboard/' : '/dashboard.html'}" class="header__dropdown-item" role="menuitem">🏠 ${isEn ? 'Dashboard' : 'لوحة تحكمي'}</a><a href="${isEn ? '/en/dashboard/?section=places' : '/dashboard.html?section=places'}" class="header__dropdown-item" role="menuitem">📍 ${isEn ? 'My Places' : 'أماكني'}</a><a href="${isEn ? '/en/dashboard/?section=add' : '/dashboard.html?section=add'}" class="header__dropdown-item" role="menuitem">➕ ${isEn ? 'Add Place' : 'إضافة مكان'}</a><a href="${isEn ? '/en/dashboard/?section=loyalty' : '/dashboard.html?section=loyalty'}" class="header__dropdown-item" role="menuitem">🎁 ${isEn ? 'Loyalty Rewards' : 'نادي الولاء'}</a><a href="${isEn ? '/en/dashboard/?section=notifications' : '/dashboard.html?section=notifications'}" class="header__dropdown-item" role="menuitem">🔔 ${isEn ? 'Notifications' : 'الإشعارات'}</a>${isUserAdmin ? `<div class="header__dropdown-divider"></div><a href="/admin/index.html" class="header__dropdown-item" style="color:var(--secondary)" role="menuitem">⚙️ ${isEn ? 'Administration' : 'لوحة الإدارة'}</a>` : ''}<div class="header__dropdown-divider"></div><button class="header__dropdown-item header__dropdown-item--danger" id="header-logout-btn" type="button" role="menuitem">🚪 ${isEn ? 'Sign Out' : 'تسجيل الخروج'}</button></div></div>`;
  }
  const loginHref = isEn ? '/en/login/' : '/login.html';
  const loginText = isEn ? 'Sign In' : 'دخول';
  return `<a href="${loginHref}" class="btn btn-primary btn-sm"><span>🔑</span> ${loginText}</a>`;
}

function _bindHeaderUserEvents(user = null) {
  const wrap = document.getElementById('header-user-section');
  if (!wrap) return;
  wrap.innerHTML = _renderHeaderUserSlot(user);

  const btn = document.getElementById('header-user-menu-btn');
  const dropdown = document.getElementById('header-user-dropdown');
  if (btn && dropdown) {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(Boolean(dropdown.classList.contains('open'))));
    };
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.getElementById('header-logout-btn')?.addEventListener('click', async () => {
      try { await signOut(); } catch (_) {}
      window.location.reload();
    });
  }
}

function _headerHTML(active = '') {
  const isEn = isEnglish();
  const links = isEn ? [
    ['/en/', 'Home', ''], ['/en/popular/', 'Popular', '🔥'], ['/en/places/', 'Places', ''],
    ['/en/categories/', 'Categories', ''], ['/en/offers/', 'Offers', ''], ['/en/now/', 'Community', '🤝'],
    ['/en/around-me/', 'Near Me', '🧭'], ['/en/favorites/', 'Favorites', '❤️']
  ] : [
    ['/index.html', 'الرئيسية', ''], ['/popular.html', 'الأكثر شعبية', '🔥'], ['/places.html', 'الأماكن', ''],
    ['/categories.html', 'التصنيفات', ''], ['/offers.html', 'العروض', ''], ['/now.html', 'طلبات أهالينا', '🤝'],
    ['/around-me.html', 'بالقرب مني', '🧭'], ['/favorites.html', 'المفضلة', '❤️']
  ];
  const norm = p => String(p || '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/\.html$/, '');
  const current = norm(active);
  const logoHref = isEn ? '/en/' : '/index.html';
  const logoName = isEn ? 'Dalil El Manzala' : 'دليل المنزلة والمطرية';
  const searchPlaceholder = isEn ? 'Search for places, services, doctors...' : 'ابحث عن مكان، دكتور، خدمة...';
  const searchTitle = isEn ? 'Quick Search' : 'بحث سريع في المنزلة والمطرية';
  const searchAria = isEn ? 'Search the directory' : 'بحث في الدليل';
  const langBtnLabel = isEn ? 'EN' : 'AR';
  const langBtnTitle = isEn ? 'Switch to Arabic' : 'Switch to English';
  return `<header class="header" id="site-header" role="banner"><div class="container header__inner"><a href="${logoHref}" class="header__logo" aria-label="${logoName}"><img src="/icons/icon-96x96.png" alt="${logoName}" width="36" height="36" class="header__logo-img" onerror="this.src='/favicon-48x48.png';"><div class="header__logo-text"><span class="header__logo-name">${logoName}</span></div></a><div class="header-search-expandable" id="header-search-container" role="search"><div class="header-search-pill" id="header-search-pill"><button type="button" class="header-search-btn-trigger" id="header-search-trigger" aria-label="${searchAria}" title="${searchTitle}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button><input type="search" id="header-search-input" class="header-search-input" placeholder="${searchPlaceholder}" autocomplete="off" aria-label="${searchPlaceholder}"><button type="button" class="header-search-clear-btn" id="header-search-clear" aria-label="${isEn ? 'Clear' : 'مسح'}" title="${isEn ? 'Clear' : 'مسح'}">✕</button></div><div class="header-live-dropdown" id="header-live-dropdown" aria-live="polite"><div class="header-live-dropdown__header"><span>⚡ ${isEn ? 'Live Quick Suggestions:' : 'مقترحات سريعة:'}</span><span class="header-live-dropdown__count" id="header-live-count">0</span></div><div class="header-live-dropdown__list" id="header-live-list"></div><div class="header-live-dropdown__footer"><a href="${isEn ? '/en/search/' : '/search.html'}" class="header-live-dropdown__all-btn"><span>${isEn ? 'View all results on search page' : 'عرض كافة النتائج في صفحة البحث'}</span><span>${isEn ? '→' : '←'}</span></a></div></div></div><nav class="header__nav" aria-label="${isEn ? 'Main Navigation' : 'التنقل الرئيسي'}">${links.map(([file,title,emoji]) => `<a href="${file}" class="header__nav-link${norm(file) === current ? ' active' : ''}"><span>${title}</span>${emoji ? `<span class="header__nav-emoji">${emoji}</span>` : ''}</a>`).join('')}</nav><button type="button" class="lang-toggle-btn" id="lang-toggle-btn" aria-label="${langBtnTitle}" title="${langBtnTitle}"><span class="lang-globe">🌐</span><span class="lang-name">${langBtnLabel}</span></button><button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="${isEn ? 'Toggle Theme' : 'تبديل الوضع الليلي'}" title="${isEn ? 'Toggle Dark/Light Mode' : 'تبديل الوضع الليلي / الفاتح'}"><span class="theme-icon-light">☀️</span><span class="theme-icon-dark">🌙</span></button><div class="header__user" id="header-user-section">${_renderHeaderUserSlot()}</div></div></header>`;
}

function _bottomNavHTML(active = '') {
  const isEn = isEnglish();
  const items = isEn ? [['/en/','🏠','Home'],['/en/categories/','📋','Categories'],['/en/offers/','🏷️','Offers'],['#more','☰','More']] : [['/index.html','🏠','الرئيسية'],['/categories.html','📋','التصنيفات'],['/offers.html','🏷️','العروض'],['#more','☰','المزيد']];
  const norm = p => String(p || '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/\.html$/, '');
  const a = norm(active);
  return `<nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="${isEn ? 'Quick Navigation' : 'تنقل سريع'}"><a href="${items[0][0]}" class="bottom-nav__item${norm(items[0][0]) === a ? ' active' : ''}"><span class="bottom-nav__icon">${items[0][1]}</span><span class="bottom-nav__label">${items[0][2]}</span></a><a href="${items[1][0]}" class="bottom-nav__item${norm(items[1][0]) === a ? ' active' : ''}"><span class="bottom-nav__icon">${items[1][1]}</span><span class="bottom-nav__label">${items[1][2]}</span></a><div class="bottom-nav__fab"><button type="button" class="bottom-nav__fab-btn bottom-nav__voice-assistant-fab" id="global-voice-assistant-fab" aria-label="${isEn ? 'Voice Assistant' : 'مساعد المنزلة الصوتي'}"><span class="fab-letter-m">M</span><span class="fab-mic-badge">🎙️</span></button></div><a href="${items[2][0]}" class="bottom-nav__item${norm(items[2][0]) === a ? ' active' : ''}"><span class="bottom-nav__icon">${items[2][1]}</span><span class="bottom-nav__label">${items[2][2]}</span></a><button type="button" class="bottom-nav__item" id="bottom-nav-more-btn" aria-expanded="false" aria-label="${items[3][2]}"><span class="bottom-nav__icon">${items[3][1]}</span><span class="bottom-nav__label">${items[3][2]}</span></button></nav>`;
}

function _footerHTML() {
  const isEn = isEnglish();
  const homeHref = isEn ? '/en/' : '/index.html';
  const title = isEn ? 'Dalil El Manzala & El Matariya' : 'دليل المنزلة والمطرية الرقمي';
  const tagline = isEn ? 'Your digital guide to places, businesses, professionals and local services in El Manzala, El Matariya and nearby areas in Dakahlia, Egypt.' : 'دليلك الرقمي الشامل لجميع الأماكن، المحلات، العيادات، الحرفيين والخدمات في المنزلة والمطرية والمناطق المجاورة بالدقهلية.';
  const groups = isEn ? [
    {title:'Quick Links',links:[['/en/','Home'],['/en/places/','Places Directory'],['/en/categories/','Categories'],['/en/offers/','Offers'],['/en/favorites/','Favorites']]},
    {title:'Directory & Services',links:[['/en/dashboard/?section=add','Add a Place'],['/en/dashboard/','Dashboard'],['/en/free-verification/','Free Verification'],['/en/emergency/','Emergency Services'],['/en/search/','Search Directory'],['/en/now/','Community Requests']]},
    {title:'Support & Contact',links:[['/en/legal/','Legal Policy'],['/en/contact/','Contact Us'],['/en/terms/','Terms & Conditions'],['/en/privacy/','Privacy Policy'],['/en/manzala/','About El Manzala'],['/en/matariya/','About El Matariya']]}
  ] : [
    {title:'روابط سريعة',links:[['/index.html','الصفحة الرئيسية'],['/places.html','دليل الأماكن'],['/categories.html','التصنيفات'],['/offers.html','العروض'],['/favorites.html','المفضلة']]},
    {title:'الخدمات والدليل',links:[['/dashboard.html?section=add','إضافة مكان'],['/dashboard.html','لوحة التحكم'],['/free-verification.html','التوثيق المجاني'],['/emergency.html','خدمات الطوارئ'],['/search.html','البحث في الدليل'],['/now.html','طلبات أهالينا']]},
    {title:'المساعدة والتواصل',links:[['/legal.html','السياسة القانونية'],['/contact.html','تواصل معنا'],['/terms.html','الشروط والأحكام'],['/privacy.html','الخصوصية'],['/manzala.html','عن المنزلة'],['/matariya.html','عن المطرية']]}
  ];
  return `<footer class="footer" id="site-footer" role="contentinfo"><div class="container"><div class="footer__grid"><div class="footer__brand"><a href="${homeHref}" class="footer__logo"><img src="/icons/icon-96x96.png" alt="${title}" width="40" height="40" onerror="this.src='/favicon-48x48.png';"><span class="footer__logo-name">${title}</span></a><p class="footer__description">${tagline}</p></div>${groups.map(g=>`<div class="footer__column"><h3 class="footer__col-title">${g.title}</h3><ul class="footer__links">${g.links.map(([h,l])=>`<li><a href="${h}" class="footer__link">${l}</a></li>`).join('')}</ul></div>`).join('')}</div><div class="footer__bottom"><p class="footer__copyright">${isEn ? '© 2026 Dalil El Manzala & El Matariya. All rights reserved.' : '© 2026 دليل المنزلة والمطرية الرقمي. جميع الحقوق محفوظة.'}</p><div class="footer__bottom-links"><a href="${isEn?'/en/privacy/':'/privacy.html'}" class="footer__bottom-link">${isEn?'Privacy':'الخصوصية'}</a><a href="${isEn?'/en/terms/':'/terms.html'}" class="footer__bottom-link">${isEn?'Terms':'الشروط'}</a><a href="${isEn?'/en/contact/':'/contact.html'}" class="footer__bottom-link">${isEn?'Contact':'تواصل'}</a></div></div></div></footer>`;
}

function _setupHeaderSearch() {
  const pill=document.getElementById('header-search-pill'), trigger=document.getElementById('header-search-trigger'), input=document.getElementById('header-search-input'), clear=document.getElementById('header-search-clear'), dropdown=document.getElementById('header-live-dropdown');
  if(!pill||!input)return; const isEn=isEnglish();
  const suggestions=isEn?[['🩺 Doctors','doctor'],['💊 Pharmacies','pharmacy'],['🍔 Restaurants','restaurant'],['🔧 Plumbers','plumber'],['⚡ Electricians','electrician'],['🛒 Supermarket','supermarket']]:[['💊 صيدليات','صيدلية'],['🩺 أطباء','عيادة دكتور'],['🔧 سباكين','سباك'],['⚡ كهربائي','كهربائي'],['🍔 مطاعم','مطعم'],['🛒 سوبر ماركت','سوبر ماركت']];
  const show=()=>{const list=document.getElementById('header-live-list'),count=document.getElementById('header-live-count');if(!list)return;count&&(count.textContent=String(suggestions.length));list.innerHTML=`<div class="header-live-suggestions"><div class="header-live-suggestions__title">⚡ ${isEn?'Quick Search Suggestions:':'مقترحات سريعة ومطلوبة:'}</div><div class="header-live-suggestions__chips">${suggestions.map(s=>`<button type="button" class="header-live-suggestion-chip" data-q="${s[1]}">${s[0]}</button>`).join('')}</div></div>`;list.querySelectorAll('.header-live-suggestion-chip').forEach(c=>c.addEventListener('click',()=>{window.location.href=isEn?`/en/search/?q=${encodeURIComponent(c.dataset.q||'')}`:`/search.html?q=${encodeURIComponent(c.dataset.q||'')}`}));dropdown?.classList.add('visible')};
  const close=()=>{pill.classList.remove('expanded');dropdown?.classList.remove('visible')};
  trigger?.addEventListener('click',e=>{e.stopPropagation();const v=input.value.trim();if(pill.classList.contains('expanded')&&v)window.location.href=isEn?`/en/search/?q=${encodeURIComponent(v)}`:`/search.html?q=${encodeURIComponent(v)}`;else if(pill.classList.contains('expanded'))close();else{pill.classList.add('expanded');input.focus();if(!v)show()}});
  pill.addEventListener('click',e=>{if(!pill.classList.contains('expanded')){e.stopPropagation();pill.classList.add('expanded');input.focus();if(!input.value.trim())show()}});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const v=input.value.trim();if(v)window.location.href=isEn?`/en/search/?q=${encodeURIComponent(v)}`:`/search.html?q=${encodeURIComponent(v)}`}if(e.key==='Escape')close()});
  clear?.addEventListener('click',e=>{e.stopPropagation();input.value='';show();input.focus()});
  document.addEventListener('click',e=>{if(!pill.contains(e.target)&&!dropdown?.contains(e.target))close()});
}
function _bindLanguageToggle(){const b=document.getElementById('lang-toggle-btn');if(!b||b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',e=>{e.preventDefault();switchLanguage(isEnglish()?'ar':'en')})}
function _bindThemeToggle(){document.querySelectorAll('#theme-toggle-btn,.theme-toggle-btn').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',()=>{const c=document.documentElement.getAttribute('data-theme')||'light',n=c==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);document.body?.classList.toggle('dark-theme',n==='dark');document.body?.classList.toggle('light-theme',n==='light');localStorage.setItem('elmanzala-theme',n)})})}
function _inject(id,html){const slot=document.getElementById(id);if(!slot)return;const tmp=document.createElement('div');tmp.innerHTML=html.trim();slot.replaceWith(tmp.firstElementChild)}

function _loadShellCSS(){
  if(!document.getElementById('shell-mobile-fixes-css')){
    const l=document.createElement('link');
    l.id='shell-mobile-fixes-css';
    l.rel='stylesheet';
    l.href='/src/css/mobile-shell-fixes.css?v=b47ccc25_3';
    document.head.appendChild(l);
  }
  // Critical fallback: the More sheet must never become a normal block in document flow
  // if the external stylesheet is delayed, stale, or unavailable.
  if(!document.getElementById('shell-mobile-more-critical-css')){
    const s=document.createElement('style');
    s.id='shell-mobile-more-critical-css';
    s.textContent=`
      .mobile-more-sheet{position:fixed!important;inset:0!important;z-index:13500!important;visibility:hidden!important;pointer-events:none!important;display:block!important}
      .mobile-more-sheet.is-open{visibility:visible!important;pointer-events:auto!important}
      .mobile-more-sheet__backdrop{position:absolute!important;inset:0!important;display:block!important;background:rgba(15,23,42,.62)!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;opacity:0!important}
      .mobile-more-sheet.is-open .mobile-more-sheet__backdrop{opacity:1!important}
      .mobile-more-sheet__panel{position:absolute!important;left:8px!important;right:8px!important;bottom:calc(var(--bottom-nav-height,64px) + 8px + env(safe-area-inset-bottom))!important;max-height:min(84dvh,720px)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;background:var(--surface,#fff)!important;border-radius:24px!important;padding:10px 14px 14px!important;box-sizing:border-box!important;transform:translateY(24px)!important;opacity:0!important;transition:transform .24s cubic-bezier(.16,1,.3,1),opacity .24s ease!important}
      .mobile-more-sheet.is-open .mobile-more-sheet__panel{transform:translateY(0)!important;opacity:1!important}
      body.mobile-more-open{overflow:hidden!important}
      body.mobile-more-open #mobile-action-hints,body.mobile-more-open .pwa-banner,body.mobile-more-open #manzala-push-prompt-card,body.mobile-more-open .push-prompt-card{display:none!important;opacity:0!important;pointer-events:none!important;visibility:hidden!important}
      @media(min-width:768px){.mobile-more-sheet{display:none!important}}`;
    document.head.appendChild(s);
  }
}

function _bindMoreMenu(){
  const isEn = isEnglish();
  const getUser = () => {
    try {
      const raw = localStorage.getItem('manzala_persistent_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  };
  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  function getSheetEl() {
    let sheet = document.getElementById('mobile-more-sheet');
    const user = getUser();
    const isUserAdmin = isAdmin(user);

    const publicLinks = isEn ? [
      { url: '/en/places/', icon: '📍', label: 'Places Directory' },
      { url: '/en/categories/', icon: '📋', label: 'Categories' },
      { url: '/en/popular/', icon: '🔥', label: 'Popular Places' },
      { url: '/en/around-me/', icon: '🧭', label: 'Near Me (GPS)' },
      { url: '/en/offers/', icon: '🏷️', label: 'Special Offers' },
      { url: '/en/favorites/', icon: '❤️', label: 'Favorites' },
      { url: '/en/emergency/', icon: '🚨', label: 'Emergency' },
      { url: '/en/now/', icon: '📢', label: 'Community Requests' },
      { url: '/en/search/', icon: '🔍', label: 'Search Directory' },
      { url: '/en/manzala/', icon: '🏙️', label: 'About El Manzala' },
      { url: '/en/matariya/', icon: '🌊', label: 'About El Matariya' },
      { url: '/en/contact/', icon: '✉️', label: 'Contact Us' }
    ] : [
      { url: '/places.html', icon: '📍', label: 'دليل الأماكن' },
      { url: '/categories.html', icon: '📋', label: 'التصنيفات' },
      { url: '/popular.html', icon: '🔥', label: 'الأكثر شعبية' },
      { url: '/around-me.html', icon: '🧭', label: 'اكتشف حولك (GPS)' },
      { url: '/offers.html', icon: '🏷️', label: 'العروض والخصومات' },
      { url: '/favorites.html', icon: '❤️', label: 'المفضلة' },
      { url: '/emergency.html', icon: '🚨', label: 'خدمات الطوارئ' },
      { url: '/now.html', icon: '📢', label: 'طلبات أهالينا' },
      { url: '/search.html', icon: '🔍', label: 'البحث في الدليل' },
      { url: '/manzala.html', icon: '🏙️', label: 'عن مدينة المنزلة' },
      { url: '/matariya.html', icon: '🌊', label: 'عن مدينة المطرية' },
      { url: '/contact.html', icon: '✉️', label: 'تواصل معنا' }
    ];

    const dashLinks = isEn ? [
      { url: '/en/dashboard/?section=overview', icon: '🏠', label: 'Overview' },
      { url: '/en/dashboard/?section=places', icon: '📍', label: 'My Places' },
      { url: '/en/dashboard/?section=add', icon: '➕', label: 'Add a Place', cls: 'mobile-more-card--accent' },
      { url: '/en/dashboard/?section=add-scan', icon: '📸', label: 'Card Scanner (AI)', cls: 'mobile-more-card--accent' },
      { url: '/en/dashboard/?section=analytics', icon: '📈', label: 'Analytics & Reports' },
      { url: '/en/dashboard/?section=loyalty', icon: '🎁', label: 'Loyalty & Points' },
      { url: '/en/dashboard/?section=notifications', icon: '🔔', label: 'Notifications' },
      { url: '/en/dashboard/?section=following', icon: '⭐', label: 'My Following' },
      { url: '/en/dashboard/?section=verification', icon: '🛡️', label: 'Verification Badge' }
    ] : [
      { url: '/dashboard.html?section=overview', icon: '🏠', label: 'نظرة عامة' },
      { url: '/dashboard.html?section=places', icon: '📍', label: 'أماكني' },
      { url: '/dashboard.html?section=add', icon: '➕', label: 'إضافة مكان', cls: 'mobile-more-card--accent' },
      { url: '/dashboard.html?section=add&action=scan', icon: '📸', label: 'تصوير كارت (AI)', cls: 'mobile-more-card--accent' },
      { url: '/dashboard.html?section=analytics', icon: '📈', label: 'التقارير والإحصائيات' },
      { url: '/dashboard.html?section=loyalty', icon: '🎁', label: 'نادي الولاء والنقاط' },
      { url: '/dashboard.html?section=notifications', icon: '🔔', label: 'الإشعارات والزيارات' },
      { url: '/dashboard.html?section=following', icon: '⭐', label: 'متابعاتي وعروضها' },
      { url: '/contact.html?type=verification', icon: '🛡️', label: 'توثيق الملف (العلامة الزرقاء)' }
    ];

    if (isUserAdmin) {
      dashLinks.push(isEn 
        ? { url: '/admin/', icon: '⚙️', label: 'Administration', cls: 'mobile-more-card--admin' }
        : { url: '/admin/index.html', icon: '⚙️', label: 'لوحة تحكم الإدارة', cls: 'mobile-more-card--admin' }
      );
    }

    const renderCards = (items) => items.map(item => `
      <a href="${item.url}" class="mobile-more-card ${item.cls || ''}">
        <span class="mobile-more-card__icon">${item.icon}</span>
        <span class="mobile-more-card__label">${escapeHtml(item.label)}</span>
        <span class="mobile-more-card__arrow" aria-hidden="true">›</span>
      </a>
    `).join('');

    let userHeaderHtml = '';
    if (user && user.uid) {
      const uName = user.name || user.displayName || (isEn ? 'User' : 'مستخدم');
      const uAvatar = user.photoURL || '/icons/icon-72x72.png';
      const uRole = isUserAdmin ? (isEn ? 'Admin ⭐' : 'مدير المنصة ⭐') : (isEn ? 'Business Owner' : 'صاحب نشاط');
      userHeaderHtml = `
        <div class="mobile-more-sheet__user">
          <img src="${escapeHtml(uAvatar)}" class="mobile-more-sheet__avatar" alt="${escapeHtml(uName)}" onerror="this.src='/icons/icon-72x72.png'">
          <div class="mobile-more-sheet__user-meta">
            <strong class="mobile-more-sheet__user-name">${escapeHtml(uName)}</strong>
            <span class="mobile-more-sheet__user-role">${escapeHtml(uRole)}</span>
          </div>
          <a href="${isEn ? '/en/dashboard/' : '/dashboard.html'}" class="mobile-more-sheet__dash-link">${isEn ? 'Dashboard ›' : 'لوحتي ›'}</a>
        </div>
        <div class="mobile-more-sheet__section-title">📊 ${isEn ? 'Dashboard & Tools' : 'لوحة التحكم وأدواتك'}</div>
        <div class="mobile-more-sheet__grid">${renderCards(dashLinks)}</div>
      `;
    } else {
      userHeaderHtml = `
        <div class="mobile-more-sheet__guest-banner">
          <div class="mobile-more-sheet__guest-content">
            <strong>${isEn ? 'Own a business in El Manzala?' : 'صاحب نشاط أو محل في المنزلة؟'}</strong>
            <p>${isEn ? 'Sign in to add and manage your place.' : 'سجّل دخولك لإضافة نشاطك التجاري والظهور لآلاف الزوار مجاناً.'}</p>
          </div>
          <a href="${isEn ? '/en/login/' : '/login.html'}" class="mobile-more-sheet__guest-btn">${isEn ? 'Sign In 🔑' : 'دخول 🔑'}</a>
        </div>
      `;
    }

    const directoryTitle = isEn ? 'City Directory & Services' : 'خدمات الدليل والمدينة';

    const panelHtml = `
      <div class="mobile-more-sheet__backdrop" data-close="1"></div>
      <section class="mobile-more-sheet__panel" role="dialog" aria-modal="true" aria-label="${isEn ? 'More' : 'المزيد'}">
        <div class="mobile-more-sheet__handle"></div>
        <div class="mobile-more-sheet__head">
          <div class="mobile-more-sheet__head-title">
            <span class="mobile-more-sheet__head-icon">✨</span>
            <h2>${isEn ? 'More & Services' : 'المزيد والخدمات'}</h2>
          </div>
          <button type="button" class="mobile-more-sheet__close" data-close="1" aria-label="${isEn ? 'Close' : 'إغلاق'}">✕</button>
        </div>
        <div class="mobile-more-sheet__scroll">
          ${userHeaderHtml}
          <div class="mobile-more-sheet__section-title">🧭 ${escapeHtml(directoryTitle)}</div>
          <div class="mobile-more-sheet__grid">${renderCards(publicLinks)}</div>
        </div>
      </section>
    `;

    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'mobile-more-sheet';
      sheet.className = 'mobile-more-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      sheet.innerHTML = panelHtml;
      document.body.appendChild(sheet);
    } else {
      sheet.innerHTML = panelHtml;
    }

    sheet.querySelectorAll('[data-close]').forEach(el => {
      el.onclick = e => { e.preventDefault(); e.stopPropagation(); close(); };
    });

    sheet.querySelectorAll('.mobile-more-card').forEach(card => {
      card.onclick = () => { close(); };
    });

    return sheet;
  }

  const open = () => {
    const sheet = getSheetEl();
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mobile-more-open');
    document.getElementById('bottom-nav-more-btn')?.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    const sheet = document.getElementById('mobile-more-sheet');
    if (!sheet) return;
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-more-open');
    document.getElementById('bottom-nav-more-btn')?.setAttribute('aria-expanded', 'false');
  };

  if (!window.__mobileMoreMenuListenerBound) {
    window.__mobileMoreMenuListenerBound = true;
    document.addEventListener('click', e => {
      const btn = e.target.closest?.('#bottom-nav-more-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const sheet = document.getElementById('mobile-more-sheet');
        if (sheet?.classList.contains('is-open')) close();
        else open();
      }
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

function _bindGlobalPhoneAutoFormat() {
  if (window.__globalPhoneAutoFormatBound) return;
  window.__globalPhoneAutoFormatBound = true;

  const isPhoneInput = (el) => {
    if (!el || !(el instanceof HTMLInputElement)) return false;
    if (el.type === 'tel') return true;
    const attr = `${el.id || ''} ${el.name || ''} ${el.className || ''}`.toLowerCase();
    return /\b(phone|whatsapp|mobile|telephon|hataf)\b/.test(attr) ||
      el.id === 'p-phone' || el.id === 'p-whatsapp' ||
      el.id === 'bm-phone' || el.id === 'bm-whatsapp' ||
      el.id === 'cf-phone' || el.id === 'fv-phone' || el.id === 'fv-whatsapp' ||
      el.id === 'aep-phone' || el.id === 'aep-whatsapp' ||
      el.id === 'apt-phone' || el.id === 'req-user-phone' || el.id === 'live-phone' ||
      el.id === 'suggested-phone-input' ||
      el.classList.contains('b-phone') || el.classList.contains('b-whatsapp');
  };

  const handleInput = (e) => {
    const el = e.target;
    if (!isPhoneInput(el)) return;
    const raw = el.value;
    if (!raw) return;

    if (!/[\u0660-\u0669\u06F0-\u06F9]/.test(raw)) return;

    const start = el.selectionStart ?? raw.length;
    const textBefore = raw.slice(0, start);
    const convertedBefore = textBefore
      .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 1632))
      .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 1776));

    const convertedFull = raw
      .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 1632))
      .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 1776));

    el.value = convertedFull;
    const newPos = Math.min(convertedFull.length, convertedBefore.length);
    try {
      el.setSelectionRange(newPos, newPos);
    } catch (_) {}
  };

  document.addEventListener('input', handleInput, true);
  document.addEventListener('paste', (e) => {
    const el = e.target;
    if (isPhoneInput(el)) {
      requestAnimationFrame(() => handleInput({ target: el }));
    }
  }, true);
}

export async function initPage(activeFile=''){
  applyLangToDOM(getLang());
  _loadShellCSS();
  _inject('header-slot',_headerHTML(activeFile));
  _inject('footer-slot',_footerHTML());
  _inject('nav-slot',_bottomNavHTML(activeFile));
  _bindLanguageToggle();
  _bindThemeToggle();
  _setupHeaderSearch();
  _bindMoreMenu();
  _bindHeaderUserEvents();
  _bindGlobalPhoneAutoFormat();
  try{bindGlobalVoiceAssistantFab()}catch(_){}
  try{
    initAuth();
    onAuthStateChange((user)=>{
      _bindHeaderUserEvents(user);
    });
  }catch(_){}
}
export { waitForAuth, isAdmin };
