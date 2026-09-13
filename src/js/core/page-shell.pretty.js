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
