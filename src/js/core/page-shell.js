// Shared page shell — bilingual, responsive, and safe for dynamic content.
import { initAuth, onAuthStateChange, waitForAuth, isAdmin } from './auth.js';
import { getLang, isEnglish, switchLanguage, applyLangToDOM } from './i18n.js';
import { bindGlobalVoiceAssistantFab } from '../services/voice.service.js';

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
  const loginHref = isEn ? '/en/login/' : '/login.html';
  const loginText = isEn ? 'Sign In' : 'دخول';
  const searchPlaceholder = isEn ? 'Search for places, services, doctors...' : 'ابحث عن مكان، دكتور، خدمة...';
  const searchTitle = isEn ? 'Quick Search' : 'بحث سريع في المنزلة والمطرية';
  const searchAria = isEn ? 'Search the directory' : 'بحث في الدليل';
  const langBtnLabel = isEn ? 'EN' : 'AR';
  const langBtnTitle = isEn ? 'Switch to Arabic' : 'Switch to English';
  return `<header class="header" id="site-header" role="banner">
    <div class="container header__inner">
      <a href="${logoHref}" class="header__logo" aria-label="${logoName}"><img src="/icons/icon-96x96.png" alt="${logoName}" width="36" height="36" class="header__logo-img" onerror="this.src='/favicon-48x48.png';"><div class="header__logo-text"><span class="header__logo-name">${logoName}</span></div></a>
      <div class="header-search-expandable" id="header-search-container" role="search"><div class="header-search-pill" id="header-search-pill">
        <button type="button" class="header-search-btn-trigger" id="header-search-trigger" aria-label="${searchAria}" title="${searchTitle}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button>
        <input type="search" id="header-search-input" class="header-search-input" placeholder="${searchPlaceholder}" autocomplete="off" aria-label="${searchPlaceholder}">
        <button type="button" class="header-search-clear-btn" id="header-search-clear" aria-label="${isEn ? 'Clear' : 'مسح'}" title="${isEn ? 'Clear' : 'مسح'}">✕</button>
      </div><div class="header-live-dropdown" id="header-live-dropdown" aria-live="polite"><div class="header-live-dropdown__header"><span>⚡ ${isEn ? 'Live Quick Suggestions:' : 'مقترحات سريعة:'}</span><span class="header-live-dropdown__count" id="header-live-count">0</span></div><div class="header-live-dropdown__list" id="header-live-list"></div><div class="header-live-dropdown__footer"><a href="${isEn ? '/en/search/' : '/search.html'}" class="header-live-dropdown__all-btn"><span>${isEn ? 'View all results on search page' : 'عرض كافة النتائج في صفحة البحث'}</span><span>${isEn ? '→' : '←'}</span></a></div></div></div>
      <nav class="header__nav" aria-label="${isEn ? 'Main Navigation' : 'التنقل الرئيسي'}">${links.map(([file,title,emoji]) => `<a href="${file}" class="header__nav-link${norm(file) === current ? ' active' : ''}"><span>${title}</span>${emoji ? `<span class="header__nav-emoji">${emoji}</span>` : ''}</a>`).join('')}</nav>
      <button type="button" class="lang-toggle-btn" id="lang-toggle-btn" aria-label="${langBtnTitle}" title="${langBtnTitle}"><span class="lang-globe">🌐</span><span class="lang-name">${langBtnLabel}</span></button>
      <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="${isEn ? 'Toggle Theme' : 'تبديل الوضع الليلي'}" title="${isEn ? 'Toggle Dark/Light Mode' : 'تبديل الوضع الليلي / الفاتح'}"><span class="theme-icon-light">☀️</span><span class="theme-icon-dark">🌙</span></button>
      <div class="header__user" id="header-user-section"><a href="${loginHref}" class="btn btn-primary btn-sm"><span>🔑</span> ${loginText}</a></div>
    </div>
  </header>`;
}

function _bottomNavHTML(active = '') {
  const isEn = isEnglish();
  const items = isEn ? [['/en/','🏠','Home'],['/en/categories/','📋','Categories'],['/en/offers/','🏷️','Offers'],['#more','☰','More']] : [['/index.html','🏠','الرئيسية'],['/categories.html','📋','التصنيفات'],['/offers.html','🏷️','العروض'],['#more','☰','المزيد']];
  const norm = p => String(p || '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/\.html$/, '');
  const a = norm(active);
  return `<nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="${isEn ? 'Quick Navigation' : 'تنقل سريع'}">
    <a href="${items[0][0]}" class="bottom-nav__item${norm(items[0][0]) === a ? ' active' : ''}"><span class="bottom-nav__icon">${items[0][1]}</span><span class="bottom-nav__label">${items[0][2]}</span></a>
    <a href="${items[1][0]}" class="bottom-nav__item${norm(items[1][0]) === a ? ' active' : ''}"><span class="bottom-nav__icon">${items[1][1]}</span><span class="bottom-nav__label">${items[1][2]}</span></a>
    <div class="bottom-nav__fab"><button type="button" class="bottom-nav__fab-btn bottom-nav__voice-assistant-fab" id="global-voice-assistant-fab" aria-label="${isEn ? 'Voice Assistant' : 'مساعد المنزلة الصوتي'}"><span class="fab-letter-m">M</span><span class="fab-mic-badge">🎙️</span></button></div>
    <a href="${items[2][0]}" class="bottom-nav__item${norm(items[2][0]) === a ? ' active' : ''}"><span class="bottom-nav__icon">${items[2][1]}</span><span class="bottom-nav__label">${items[2][2]}</span></a>
    <button type="button" class="bottom-nav__item" id="bottom-nav-more-btn" aria-label="${items[3][2]}"><span class="bottom-nav__icon">${items[3][1]}</span><span class="bottom-nav__label">${items[3][2]}</span></button>
  </nav>`;
}

function _footerHTML() {
  const isEn = isEnglish();
  const homeHref = isEn ? '/en/' : '/index.html';
  const title = isEn ? 'Dalil El Manzala & El Matariya' : 'دليل المنزلة والمطرية الرقمي';
  const tagline = isEn ? 'Your digital guide to places, businesses, professionals and local services in El Manzala, El Matariya and nearby areas in Dakahlia, Egypt.' : 'دليلك الرقمي الشامل لجميع الأماكن، المحلات، العيادات، الحرفيين والخدمات في المنزلة والمطرية والمناطق المجاورة بالدقهلية.';
  const groups = isEn ? [
    {title:'Quick Links',links:[['/en/','Home'],['/en/popular/','Popular'],['/en/places/','Places Directory'],['/en/categories/','Categories'],['/en/offers/','Offers'],['/en/now/','Community Requests'],['/en/around-me/','Near Me'],['/en/manzala/','About El Manzala'],['/en/matariya/','About El Matariya'],['/en/favorites/','Favorites']]},
    {title:'Directory & Services',links:[['/en/dashboard/?section=add','Add a Place or Business'],['/en/dashboard/','Dashboard'],['/en/free-verification/','Free Verification'],['/en/emergency/','Emergency & Hotlines'],['/en/search/','Search Directory']]},
    {title:'Support',links:[['/en/contact/','Contact Us'],['/en/privacy/','Privacy Policy'],['/en/terms/','Terms of Use'],['/en/legal/','Legal Policy & Disclaimer']]}
  ] : [
    {title:'روابط سريعة',links:[['/index.html','الصفحة الرئيسية'],['/places.html','دليل الأماكن والمهن'],['/categories.html','التصنيفات'],['/offers.html','العروض'],['/now.html','طلبات أهالينا'],['/around-me.html','اكتشف حولك'],['/manzala.html','عن المنزلة'],['/matariya.html','عن المطرية'],['/favorites.html','المفضلة']]},
    {title:'الخدمات والدليل',links:[['/dashboard.html?section=add','إضافة مكان أو نشاط'],['/dashboard.html','لوحة التحكم'],['/free-verification.html','التوثيق المجاني'],['/emergency.html','طوارئ وأرقام هامة'],['/search.html','البحث في الدليل']]},
    {title:'المساعدة والتواصل',links:[['/contact.html','تواصل معنا'],['/privacy.html','الخصوصية'],['/terms.html','الشروط'],['/legal.html','السياسة القانونية وإخلاء المسؤولية']]}
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
function _bindMoreMenu(){const btn=document.getElementById('bottom-nav-more-btn');if(!btn||btn.dataset.bound)return;btn.dataset.bound='1';const isEn=isEnglish();const items=isEn?[['/en/places/','📍','Places Directory'],['/en/categories/','📋','Categories'],['/en/popular/','🔥','Popular'],['/en/around-me/','🧭','Near Me'],['/en/manzala/','🏙️','About El Manzala'],['/en/matariya/','🌊','About El Matariya'],['/en/favorites/','❤️','Favorites'],['/en/contact/','✉️','Contact Us']]:[['/places.html','📍','دليل الأماكن'],['/categories.html','📋','التصنيفات'],['/popular.html','🔥','الأكثر شعبية'],['/around-me.html','🧭','اكتشف حولك'],['/manzala.html','🏙️','عن المنزلة'],['/matariya.html','🌊','عن المطرية'],['/favorites.html','❤️','المفضلة'],['/contact.html','✉️','تواصل معنا']];let sheet=document.getElementById('mobile-more-sheet');if(!sheet){sheet=document.createElement('div');sheet.id='mobile-more-sheet';sheet.className='mobile-more-sheet';sheet.innerHTML=`<div class="mobile-more-sheet__backdrop" data-close="1"></div><section class="mobile-more-sheet__panel" role="dialog" aria-modal="true" aria-label="${isEn?'More':'المزيد'}"><div class="mobile-more-sheet__head"><strong>${isEn?'More':'المزيد'}</strong><button type="button" data-close="1" aria-label="${isEn?'Close':'إغلاق'}">×</button></div><div class="mobile-more-sheet__grid">${items.map(x=>`<a href="${x[0]}"><span>${x[1]}</span><b>${x[2]}</b></a>`).join('')}</div></section>`;document.body.appendChild(sheet)}const open=()=>sheet.classList.add('is-open'),close=()=>sheet.classList.remove('is-open');btn.addEventListener('click',e=>{e.preventDefault();open()});sheet.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',close))}
function _loadShellCSS(){if(document.getElementById('shell-mobile-fixes-css'))return;const l=document.createElement('link');l.id='shell-mobile-fixes-css';l.rel='stylesheet';l.href='/src/css/mobile-shell-fixes.css?v=20260913_1';document.head.appendChild(l)}
export async function initPage(activeFile=''){applyLangToDOM(getLang());_loadShellCSS();_inject('header-slot',_headerHTML(activeFile));_inject('footer-slot',_footerHTML());_inject('nav-slot',_bottomNavHTML(activeFile));_bindLanguageToggle();_bindThemeToggle();_setupHeaderSearch();_bindMoreMenu();try{bindGlobalVoiceAssistantFab()}catch(_){}try{initAuth();onAuthStateChange(()=>{})}catch(_){} }
export { waitForAuth, isAdmin };
