/**
 * Project-wide i18n hardening layer.
 * Keeps legacy/static UI bilingual without touching user/business content.
 */
import { getLang, isEnglish, t } from './i18n.js';

const ROUTES = {
  '/index.html':'/', '/places.html':'/places', '/categories.html':'/categories', '/search.html':'/search',
  '/offers.html':'/offers', '/now.html':'/now', '/around-me.html':'/around-me', '/contact.html':'/contact',
  '/free-verification.html':'/free-verification', '/favorites.html':'/favorites', '/dashboard.html':'/dashboard',
  '/login.html':'/login', '/emergency.html':'/emergency', '/privacy.html':'/privacy', '/terms.html':'/terms',
  '/legal.html':'/legal', '/hadith.html':'/hadith', '/quran.html':'/quran', '/quran-search.html':'/quran-search',
  '/quran-surah.html':'/quran-surah', '/products.html':'/products', '/manzala.html':'/manzala', '/matariya.html':'/matariya'
};

const LEGACY = new Map(Object.entries({
  'مفتوح الآن':'Open Now','مغلق الآن':'Closed Now','مغلق حالياً':'Closed Now','غير محدد':'Not specified','بحث سريع':'Quick Search','بحث في الدليل':'Search the directory','الرئيسية':'Home','الأكثر شعبية':'Popular','الأماكن':'Places','التصنيفات':'Categories','العروض':'Offers','طلبات أهالينا':'Community Requests','بالقرب مني':'Near Me','المفضلة':'Favorites','تواصل معنا':'Contact Us','التوثيق المجاني':'Free Verification','طوارئ وأرقام هامة':'Emergency & Hotlines','لوحة التحكم':'Dashboard','تسجيل الدخول':'Sign In','تسجيل الخروج':'Sign Out','حفظ':'Save','إلغاء':'Cancel','حذف':'Delete','تعديل':'Edit','إغلاق':'Close','إرسال':'Submit','رجوع':'Back','قراءة المزيد':'Read More','عرض التفاصيل':'View Details','تصفية':'Filter','الكل':'All','العنوان':'Address','الهاتف':'Phone','واتساب':'WhatsApp','مواعيد العمل':'Working Hours','الخدمات والمنتجات':'Services & Products','آراء وتقييمات العملاء':'Customer Reviews & Ratings','أضف تقييمك ورأيك':'Write a Review','الصور والمعرض':'Photos & Gallery','الفروع الأخرى':'Other Branches','أماكن مشابهة في المنطقة':'Similar Places Nearby','جاري التحميل...':'Loading...','حدث خطأ غير متوقع، يرجى المحاولة لاحقاً':'An unexpected error occurred, please try again later','تم تسجيل الخروج':'Signed out successfully','مكان بالدليل':'Directory listing','مفتوح 24 ساعة يومياً 🟢':'Open 24 hours daily 🟢','فلاتر سريعة':'Quick filters','✨ الكل':'✨ All','خروج':'Sign Out','الإدارة':'Administration','أماكني':'My Places','إضافة مكان':'Add Place','لوحة تحكمي':'My Dashboard'
}));

export function cleanPath(path=window.location.pathname){
  let p=String(path||'/').replace(/^\/(en|ar)(\/|$)/,'/');
  if(!p.startsWith('/')) p='/'+p;
  return p || '/';
}

export function localizedHref(path,targetLang=getLang()){
  if(!path || /^(https?:)?\/\//i.test(path) || /^(mailto|tel):/i.test(path)) return path;
  const [base,hash='']=String(path).split('#');
  const [pathname,query='']=base.split('?');
  let clean=cleanPath(pathname);
  if(ROUTES[clean]) clean=ROUTES[clean];
  const prefix=targetLang==='en' ? (clean==='/'?'/en/':`/en${clean}`) : clean;
  return `${prefix}${query?`?${query}`:''}${hash?`#${hash}`:''}`;
}

export function translateLegacyElement(el){
  if(!(el instanceof Element) || !isEnglish() || el.hasAttribute('data-i18n')) return;
  if(el.children.length===0){
    const text=(el.textContent||'').trim();
    if(LEGACY.has(text)) el.textContent=LEGACY.get(text);
  }
  for(const attr of ['placeholder','title','aria-label']){
    const value=el.getAttribute(attr);
    if(value && LEGACY.has(value)) el.setAttribute(attr,LEGACY.get(value));
  }
}

export function installI18nHardening(){
  if(typeof document==='undefined' || document.documentElement.dataset.i18nHardening==='1') return;
  document.documentElement.dataset.i18nHardening='1';
  const cssId='dalil-i18n-layout-css';
  if(!document.getElementById(cssId)){
    const link=document.createElement('link'); link.id=cssId; link.rel='stylesheet'; link.href='/src/css/i18n-layout.css?v=20260913'; document.head.appendChild(link);
  }
  const scan=()=>{
    document.querySelectorAll('[data-i18n],[data-i18n-aria],[data-i18n-title],button,a,label,span,p,h1,h2,h3,h4,h5,h6,small,strong,input,textarea').forEach(el=>{
      if(el.hasAttribute('data-i18n')){
        const key=el.getAttribute('data-i18n');
        const value=t(key);
        if(el.matches('input,textarea')) el.setAttribute('placeholder',value); else el.textContent=value;
      }
      if(el.hasAttribute('data-i18n-aria')) el.setAttribute('aria-label',t(el.getAttribute('data-i18n-aria')));
      if(el.hasAttribute('data-i18n-title')) el.setAttribute('title',t(el.getAttribute('data-i18n-title')));
      translateLegacyElement(el);
    });
  };
  scan();
  const observer=new MutationObserver(mutations=>{for(const m of mutations) for(const n of m.addedNodes) if(n.nodeType===1){translateLegacyElement(n);n.querySelectorAll?.('button,a,label,span,p,h1,h2,h3,h4,h5,h6,small,strong,input,textarea,[data-i18n]').forEach(translateLegacyElement);}});
  observer.observe(document.body||document.documentElement,{childList:true,subtree:true});
  window.addEventListener('dalil:languagechange',scan);
}

export function navigateToLocalized(path){ window.location.assign(localizedHref(path)); }
