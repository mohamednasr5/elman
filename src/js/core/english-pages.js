/** English Pages Controller — isolated presentation layer */
import { initPage } from './page-shell.js?v=ebc49583';
import { getCurrentUser, waitForAuth } from './auth.js';
import { installEnglishAudit } from './english-audit.js';
import { renderEnglishPlaceCard } from '../ui/components/en/PlaceCardEn.js';

const clean=p=>String(p||'/').replace(/^\/en(?:\/|$)/,'/').replace(/\/+$/,'')||'/';
const parts=()=>clean(location.pathname).split('/').filter(Boolean);
const page=()=>parts()[0]||'';
function loadEnglishStyles(){
  if(document.getElementById('english-design-system')) return;
  const link=document.createElement('link'); link.id='english-design-system'; link.rel='stylesheet'; link.href='/src/css/en/index.css?v=20260913.2'; document.head.appendChild(link);
}
function installEnglishCardBridge(root){
  if(!root || root.__englishCardBridgeInstalled) return;
  root.__englishCardBridgeInstalled=true;
  const upgrade=()=>{
    if(document.documentElement.lang!=='en') return;
    root.querySelectorAll('.place-card:not([data-en-upgraded]), .fair-place-card:not([data-en-upgraded])').forEach(card=>{
      const slug=card.getAttribute('data-place-slug')||card.getAttribute('data-slug')||'';
      const registry=typeof window!=='undefined' ? window._placesRegistry : null;
      const place=registry?.get(String(slug).toLowerCase().trim()) || (slug ? registry?.get(slug) : null);
      if(!place) return;
      const html=renderEnglishPlaceCard(place);
      if(!html) return;
      const wrapper=document.createElement('div'); wrapper.innerHTML=html.trim();
      const replacement=wrapper.firstElementChild; if(!replacement) return;
      replacement.setAttribute('data-en-upgraded','true'); card.replaceWith(replacement);
    });
  };
  upgrade();
  const observer=new MutationObserver(()=>upgrade()); observer.observe(root,{childList:true,subtree:true}); root.__englishCardBridgeObserver=observer;
}
async function render(container){
  const p=page(), q=new URLSearchParams(location.search), user=getCurrentUser();
  if(p==='place'){const {renderEnglishPlacePageV2}=await import('../ui/pages/en/place-en-v2.js');return renderEnglishPlacePageV2(container,{slug:parts()[1]||q.get('slug')||''});}
  if(p==='category'){const {renderEnglishCategoryPage}=await import('../ui/pages/en/categories-en.js');return renderEnglishCategoryPage(container,{slug:parts()[1]||q.get('slug')||'',query:{prof:q.get('prof')},user});}
  if(p==='categories'){const {renderEnglishCategoriesPage}=await import('../ui/pages/en/categories-en.js');return renderEnglishCategoriesPage(container);}
  if(p==='places'){const {renderEnglishPlacesPage}=await import('../ui/pages/en/places-en.js');return renderEnglishPlacesPage(container,{query:{q:q.get('q')||'',area:q.get('area')||'',category:q.get('category')||'',filter:q.get('filter')||''},user});}
  if(p==='search'){const {renderEnglishSearchPage}=await import('../ui/pages/en/search-en.js');return renderEnglishSearchPage(container,{q:q.get('q')||'',user});}
  if(p==='popular'){const {renderEnglishPopularPage}=await import('../ui/pages/en/popular-en.js');return renderEnglishPopularPage(container,{filter:q.get('filter')||'views',category:q.get('category')||'',area:q.get('area')||'',q:q.get('q')||''});}
  if(p==='offers'){const {renderEnglishOffersPage}=await import('../ui/pages/en/offers-en.js');return renderEnglishOffersPage(container);}
  if(p==='now'){const {renderEnglishNowPage}=await import('../ui/pages/en/now-en.js');return renderEnglishNowPage(container);}
  if(p==='around-me'){const {renderEnglishAroundMePage}=await import('../ui/pages/en/around-me-en.js');return renderEnglishAroundMePage(container);}
  if(p==='favorites'){const {renderEnglishFavoritesPage}=await import('../ui/pages/en/favorites-en.js');return renderEnglishFavoritesPage(container);}
  if(p==='contact'){const {renderEnglishContactPage}=await import('../ui/pages/en/contact-en.js');return renderEnglishContactPage(container);}
  if(p==='free-verification'){const {renderEnglishFreeVerificationPage}=await import('../ui/pages/en/free-verification-en.js');return renderEnglishFreeVerificationPage(container,{user});}
  if(p==='emergency'){const {renderEnglishEmergencyPage}=await import('../ui/pages/en/emergency-en.js');return renderEnglishEmergencyPage(container);}
  if(p==='products'){const {renderEnglishProductsPage}=await import('../ui/pages/en/products-en.js');return renderEnglishProductsPage(container);}
  if(p==='manzala'||p==='matariya'){const {renderEnglishCityPage}=await import('../ui/pages/en/city-en.js');return renderEnglishCityPage(container,p);}
  if(p==='privacy'||p==='terms'||p==='legal'){const {renderEnglishStaticPage}=await import('../ui/pages/static-en.js');return renderEnglishStaticPage(container,p);}
  if(p==='login'){const authUser=await waitForAuth();if(authUser){location.replace('/en/dashboard/');return;}const {renderEnglishLoginPage}=await import('../ui/pages/en/login-en.js');return renderEnglishLoginPage(container);}
  if(p==='dashboard'){const {renderEnglishDashboard}=await import('../ui/pages/en/dashboard-en.js');return renderEnglishDashboard(container,{user,section:q.get('section')||'overview'});}
  const {renderEnglishHomePage}=await import('../ui/pages/en/home-en.js');return renderEnglishHomePage(container,{user});
}
(async()=>{try{document.documentElement.lang='en';document.documentElement.dir='ltr';loadEnglishStyles();await initPage(`${page()||'index'}.html`);const container=document.getElementById('page-container');await render(container);installEnglishCardBridge(container);installEnglishAudit();}catch(error){console.error('[English Pages]',error);const c=document.getElementById('page-container');if(c)c.innerHTML='<section class="en-container en-section"><div class="en-empty"><div class="en-empty__icon">⚠️</div><h1>Something went wrong</h1><p class="en-muted">Please reload the page or return to the homepage.</p><a class="en-btn en-btn--primary" href="/en/">Return to Homepage</a></div></section>';}})();
