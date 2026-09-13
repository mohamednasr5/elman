// Pretty entrypoint intentionally delegates to the canonical page shell.
// This prevents minification/generation from restoring an older More-menu implementation.
export { initPage, waitForAuth, isAdmin } from './page-shell.js';

/* MOBILE_MORE_MENU_DELEGATED_FIX_v1 */
(function(){
  if (window.__mobileMoreDelegatedFix) return;
  window.__mobileMoreDelegatedFix = true;
  const getLang = () => (document.documentElement.lang || '').toLowerCase().startsWith('en') ? 'en' : 'ar';
  const labels = {
    ar: { title:'المزيد', close:'إغلاق', links:[['الرئيسية','/index.html'],['دليل الأماكن','/places.html'],['التصنيفات','/categories.html'],['العروض','/offers.html'],['المفضلة','/favorites.html'],['إضافة مكان','/dashboard.html?section=add'],['لوحة التحكم','/dashboard.html'],['التوثيق المجاني','/free-verification.html'],['خدمات الطوارئ','/emergency.html'],['البحث في الدليل','/search.html'],['طلبات أهالينا','/now.html'],['تواصل معنا','/contact.html'],['عن المنزلة','/manzala.html'],['عن المطرية','/matariya.html']]},
    en: { title:'More', close:'Close', links:[['Home','/en/'],['Places Directory','/en/places/'],['Categories','/en/categories/'],['Offers','/en/offers/'],['Favorites','/en/favorites/'],['Add a Place','/en/dashboard/?section=add'],['Dashboard','/en/dashboard/'],['Free Verification','/en/free-verification/'],['Emergency Services','/en/emergency/'],['Search Directory','/en/search/'],['Community Requests','/en/now/'],['Contact Us','/en/contact/'],['About El Manzala','/en/manzala/'],['About El Matariya','/en/matariya/']]}
  };
  function sheet(){
    let el=document.getElementById('mobile-more-sheet');
    const l=labels[getLang()];
    if(el){ el.querySelector('[data-more-title]')?.replaceChildren(document.createTextNode(l.title)); return el; }
    el=document.createElement('div'); el.id='mobile-more-sheet'; el.className='mobile-more-sheet'; el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="mobile-more-sheet__backdrop" data-more-close></div><section class="mobile-more-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title"><div class="mobile-more-sheet__head"><h2 id="mobile-more-title" data-more-title></h2><button type="button" class="mobile-more-sheet__close" data-more-close aria-label="'+l.close+'">×</button></div><nav class="mobile-more-sheet__links" data-more-links></nav></section>';
    document.body.appendChild(el);
    const links=el.querySelector('[data-more-links]');
    links.innerHTML=l.links.map(([text,href])=>'<a class="mobile-more-sheet__link" href="'+href+'"><span>'+text+'</span><span aria-hidden="true">›</span></a>').join('');
    el.querySelector('[data-more-title]').textContent=l.title;
    el.querySelector('.mobile-more-sheet__close').setAttribute('aria-label',l.close);
    el.addEventListener('click',e=>{ if(e.target.closest('[data-more-close]')) close(); });
    return el;
  }
  function open(){ const el=sheet(); el.classList.add('is-open'); el.setAttribute('aria-hidden','false'); document.body.classList.add('mobile-more-open'); document.getElementById('bottom-nav-more-btn')?.setAttribute('aria-expanded','true'); }
  function close(){ const el=document.getElementById('mobile-more-sheet'); if(!el)return; el.classList.remove('is-open'); el.setAttribute('aria-hidden','true'); document.body.classList.remove('mobile-more-open'); document.getElementById('bottom-nav-more-btn')?.setAttribute('aria-expanded','false'); }
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#bottom-nav-more-btn');
    if(btn){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); const el=document.getElementById('mobile-more-sheet'); if(el?.classList.contains('is-open')) close(); else open(); }
  }, true);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
  window.openMobileMoreMenu=open; window.closeMobileMoreMenu=close;
})();

/* MOBILE_MORE_MENU_DELEGATED_FIX_v2 */
(function(){
  if (window.__mobileMoreDelegatedFix) return;
  window.__mobileMoreDelegatedFix = true;
  const getLang = () => (document.documentElement.lang || '').toLowerCase().startsWith('en') ? 'en' : 'ar';
  const getUser = () => { try { const raw=localStorage.getItem('manzala_persistent_user'); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } };
  const isAdmin = user => !!user && (user.role==='admin'||user.role==='superadmin'||['elfannanm@gmail.com','mohamednasrofficial@gmail.com'].includes(String(user.email||'').toLowerCase()));
  const labels = {
    ar: { title:'المزيد', close:'إغلاق', public:[['الرئيسية','/index.html'],['دليل الأماكن','/places.html'],['التصنيفات','/categories.html'],['العروض','/offers.html'],['المفضلة','/favorites.html'],['خدمات الطوارئ','/emergency.html'],['البحث في الدليل','/search.html'],['طلبات أهالينا','/now.html'],['تواصل معنا','/contact.html'],['عن المنزلة','/manzala.html'],['عن المطرية','/matariya.html']] },
    en: { title:'More', close:'Close', public:[['Home','/en/'],['Places Directory','/en/places/'],['Categories','/en/categories/'],['Offers','/en/offers/'],['Favorites','/en/favorites/'],['Emergency Services','/en/emergency/'],['Search Directory','/en/search/'],['Community Requests','/en/now/'],['Contact Us','/en/contact/'],['About El Manzala','/en/manzala/'],['About El Matariya','/en/matariya/']] }
  };
  const dashboard = {
    ar:[['🏠 نظرة عامة','/dashboard.html?section=overview'],['📍 أماكني','/dashboard.html?section=places'],['📈 التقارير والإحصائيات','/dashboard.html?section=analytics'],['⭐ متابعاتي وعروضها','/dashboard.html?section=following'],['🗺️ بالقرب مني (GPS)','/dashboard.html?section=around-me'],['🎁 نادي الولاء والنقاط','/dashboard.html?section=loyalty'],['📸 تصوير كارت المحل (AI)','/dashboard.html?section=add&action=scan'],['➕ إضافة مكان يدوياً','/dashboard.html?section=add'],['🔔 الإشعارات والزيارات','/dashboard.html?section=notifications'],['🛡️ توثيق الملف','/contact.html?type=verification']],
    en:[['🏠 Overview','/en/dashboard/?section=overview'],['📍 My Places','/en/dashboard/?section=places'],['📈 Analytics & Reports','/en/dashboard/?section=analytics'],['⭐ My Following & Offers','/en/dashboard/?section=following'],['🗺️ Near Me (GPS)','/en/dashboard/?section=around-me'],['🎁 Loyalty & Points','/en/dashboard/?section=loyalty'],['📸 Business Card Scanner (AI)','/en/dashboard/?section=add-scan'],['➕ Add a Place','/en/dashboard/?section=add'],['🔔 Notifications & Visits','/en/dashboard/?section=notifications'],['🛡️ Verify Your Profile','/en/dashboard/?section=verification']]
  };
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function sheet(){
    let el=document.getElementById('mobile-more-sheet'); const lang=getLang(), l=labels[lang], user=getUser();
    if(el){ el.querySelector('[data-more-title]')?.replaceChildren(document.createTextNode(l.title)); return el; }
    el=document.createElement('div'); el.id='mobile-more-sheet'; el.className='mobile-more-sheet'; el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="mobile-more-sheet__backdrop" data-more-close></div><section class="mobile-more-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title"><div class="mobile-more-sheet__head"><h2 id="mobile-more-title" data-more-title></h2><button type="button" class="mobile-more-sheet__close" data-more-close aria-label="'+escapeHtml(l.close)+'">×</button></div><nav class="mobile-more-sheet__links" data-more-links></nav></section></div>';
    document.body.appendChild(el);
    const links=el.querySelector('[data-more-links]');
    const items=user ? dashboard[lang].concat(l.public.map(([t,h])=>[t,h])) : l.public;
    const adminItems=user&&isAdmin(user)?(lang==='en'?[['⚙️ Administration','/admin/']]:[['⚙️ لوحة تحكم الإدارة','/admin/']]):[];
    links.innerHTML=items.concat(adminItems).map(([text,href])=>'<a class="mobile-more-sheet__link" href="'+href+'"><span>'+escapeHtml(text)+'</span><span aria-hidden="true">›</span></a>').join('');
    el.querySelector('[data-more-title]').textContent=l.title;
    el.addEventListener('click',e=>{ if(e.target.closest('[data-more-close]')) close(); });
    return el;
  }
  function open(){const el=sheet();el.classList.add('is-open');el.setAttribute('aria-hidden','false');document.body.classList.add('mobile-more-open');document.getElementById('bottom-nav-more-btn')?.setAttribute('aria-expanded','true');}
  function close(){const el=document.getElementById('mobile-more-sheet');if(!el)return;el.classList.remove('is-open');el.setAttribute('aria-hidden','true');document.body.classList.remove('mobile-more-open');document.getElementById('bottom-nav-more-btn')?.setAttribute('aria-expanded','false');}
  document.addEventListener('click',e=>{const btn=e.target.closest?.('#bottom-nav-more-btn');if(btn){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const el=document.getElementById('mobile-more-sheet');if(el?.classList.contains('is-open'))close();else open();}},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  window.openMobileMoreMenu=open; window.closeMobileMoreMenu=close;
})();
