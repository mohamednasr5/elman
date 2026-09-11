import{getCategories as oe,getPublishedPlaces as ne,getActiveOffers as ce,getAds as le,getCached as V}from"../../core/db.js";import{WORKER_URL as Z}from"../../core/firebase.js";import"../../core/state.js";import{renderPlaceCard as de,renderPlaceCardSkeleton as pe}from"../components/PlaceCard.js";import{isAtmPlace as me}from"../../utils/atm.js";import{mountSponsoredShowcase as he,isPlaceSponsored as ge}from"../components/SponsoredShowcase.js";import{formatPrice as N,calcDiscount as ve,arabicMatch as O}from"../../utils/arabic.js";import{daysUntil as ue}from"../../utils/date.js";import{getCurrentUser as W}from"../../core/auth.js";import{openManzalaVoiceAssistantModal as fe}from"../../services/voice.service.js";import{executeFastSearch as be,warmupSearchEngine as Q}from"../../services/search-engine.service.js";import{getCategorySvg as G}from"../../utils/professions-data.js";import{getCategoryVisualMeta as ye,renderCategoryCardIcon as _e}from"../../utils/category-visual.js";import{resolveDeliveryVehicle as we}from"../../utils/delivery-vehicle.js";const Ge={pharmacy:{emoji:"\u{1F48A}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},supermarket:{emoji:"\u{1F6D2}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},paint:{emoji:"\u{1F3A8}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},herbs:{emoji:"\u{1F33F}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},doctor:{emoji:"\u{1F468}\u200D\u2695\uFE0F",color:"rgba(41,128,185,0.1)",border:"#2980B9"},plumbing:{emoji:"\u{1F527}",color:"rgba(52,73,94,0.1)",border:"#52596E"},plumber:{emoji:"\u{1FAA0}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpenter:{emoji:"\u{1FA9A}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},tiler:{emoji:"\u{1F9F1}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},painter:{emoji:"\u{1F58C}\uFE0F",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},electrician:{emoji:"\u26A1",color:"rgba(243,156,18,0.1)",border:"#F39C12"},"ac-technician":{emoji:"\u2744\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},blacksmith:{emoji:"\u{1F6E0}\uFE0F",color:"rgba(52,73,94,0.1)",border:"#52596E"},alumital:{emoji:"\u{1FA9F}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},mechanic:{emoji:"\u{1F529}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},upholsterer:{emoji:"\u{1F6CB}\uFE0F",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},feed:{emoji:"\u{1F33E}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},poultry:{emoji:"\u{1F357}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},bakery:{emoji:"\u{1F35E}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},vegetables:{emoji:"\u{1F96C}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},antiques:{emoji:"\u{1F3FA}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},electronics:{emoji:"\u{1F4FA}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpet:{emoji:"\u{1F9F6}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},mattress:{emoji:"\u{1F6CF}\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},china:{emoji:"\u{1F37D}\uFE0F",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},electrical:{emoji:"\u{1F4A1}",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},roastery:{emoji:"\u{1F95C}",color:"rgba(101,67,33,0.1)",border:"#654321"},phones:{emoji:"\u{1F4F1}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},grocery:{emoji:"\u{1F3EA}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},hypermarket:{emoji:"\u{1F3EC}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"},delivery:{emoji:"\u{1F680}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"}},Je={emoji:"\u{1F3EA}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"};export async function renderHomePage(n,{user:r}={}){const a=document.getElementById("hero-section-static");if(!!!a)n.innerHTML=ie(),te();else{a.removeAttribute("id");const t=[];let s=a.nextSibling;for(;s;)t.push(s),s=s.nextSibling;t.forEach(l=>l.parentNode&&l.parentNode.removeChild(l));const c=document.createElement("div");c.innerHTML=ie();const h=c.querySelector(".hero");if(h){if(!a.querySelector(".hero-heritage-decor")){const l=h.querySelector(".hero-heritage-decor");l&&a.insertAdjacentElement("afterbegin",l)}h.remove()}for(;c.firstChild;)n.appendChild(c.firstChild);te()}j();try{const t=V("categories_all"),s=V("published_100_");if(Array.isArray(t)&&t.length>0&&(K(t),ae(t)),Array.isArray(s)&&s.length>0){const c=W()||r;j(s);const h=J(s,c?.uid);X(h.slice(0,8)),ee(s.length,t?.length||31),Q(s,t||[])}}catch{}try{const[t,s,c,h]=await Promise.all([oe(),ne({limit:100}),ce(8),le("homepage")]),l=W()||r,i=s||[];if(typeof window<"u"&&Array.isArray(i)){window._placesRegistry=window._placesRegistry||new Map;for(const d of i){if(!d)continue;const v=String(d.slug||d.id||d._key||"").toLowerCase().trim();v&&(window._placesRegistry.set(v,d),d.id&&window._placesRegistry.set(String(d.id).toLowerCase().trim(),d),d.slug&&window._placesRegistry.set(String(d.slug).toLowerCase().trim(),d))}}K(t||[]),j(i);const u=J(i,l?.uid);X(u.slice(0,8)),$e(c||[]);const g=(i||[]).filter(d=>{if(!d)return!1;if(d.deliveryType||d.categoryId?.includes("delivery"))return!0;const v=String(d.name||"").toLowerCase();return/توكتوك|تاكسي|شانجي|اتوبيس|توصيل|دليفري|وصلي/i.test(v)?!/صيدلية|مطعم|كشري|حلواني|سوبر\s*ماركت|هايبر/i.test(v):!1});ke(g),Le(h||[]),ee(i.length||0,t?.length||31),Q(i,t||[]),ae(t||[]),Ee(),Promise.resolve().then(()=>{import("../components/WhoIsAvailableNow.js").then(({renderWhoIsAvailableNow:d})=>{const v=document.getElementById("home-oncall-craftsmen-container");v&&d(v)}).catch(()=>{}),import("../components/ServiceRequestsSection.js").then(({renderServiceRequestsSection:d})=>{const v=document.getElementById("home-service-requests-container");v&&d(v,{limit:4,showHero:!1,isCompact:!0})}).catch(()=>{}),import("../components/AroundMeRadar.js").then(({mountAroundMeRadar:d})=>{d("home-around-me-container")}).catch(()=>{}),he("home-sponsored-container",i,{title:"\u0623\u0645\u0627\u0643\u0646 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0645\u064A\u0632\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",subtitle:"\u0623\u0646\u0634\u0637\u0629 \u062A\u062C\u0627\u0631\u064A\u0629 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u0648\u0635\u0649 \u0628\u0647\u0627 \u0648\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u062F\u064A\u0646\u0629",maxVisible:4});try{import("../components/WideAdsBanner.js").then(({mountWideAdsBanner:d})=>d("wide-ads-banner")).catch(()=>{})}catch{}Be()})}catch{}}function J(n,r=null,a=!1){const e=new Set,t=[],s=[];return[...n].sort((l,i)=>{const u=Number(l.createdAt)||Number(l.updatedAt)||0;return(Number(i.createdAt)||Number(i.updatedAt)||0)-u}).forEach(l=>{const i=l._key||l.id;e.has(i)||(e.add(i),ge(l)?t.push(l):s.push(l))}),[...a?Ce(t):t,...s]}function K(n){const r=document.getElementById("categories-grid");!r||!n||(r.innerHTML=n.map(a=>{const e=a.slug||a._key||a.id||"",t=ye(a),s=_e(a,{size:40});return`
      <a href="category.html?slug=${encodeURIComponent(e)}"
         class="category-card animate-fade-in"
         style="--cat-color:${t.color};--cat-bg:${t.bgColor};--cat-border:${t.borderColor}"
         aria-label="${a.name}">
        <div class="category-card__icon" style="background:${t.bgColor};border-color:${t.borderColor};--cat-color:${t.color};">
          ${s}
        </div>
        <div class="category-card__name">${y(a.name)}</div>
      </a>
    `}).join(""))}const Y="manzala_verified_showcase_v1";let A=null,x=[],I=0;const xe=[{id:"p_1788703900620_oae8ka",slug:"mtam-basl-wbaha-llmakwlat-albhrya",name:"\u0645\u0637\u0639\u0645 \u0628\u0627\u0633\u0644 \u0648\u0628\u0627\u0647\u0649 \u0644\u0644\u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0628\u062D\u0631\u064A\u0629",area:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u062F\u0642\u0647\u0644\u064A\u0629",address:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629 - \u0634 \u0627\u0644\u062B\u0648\u0631\u0629",phone:"01062944644",whatsapp:"01062944644",category:"\u0645\u0637\u0627\u0639\u0645 \u0648\u0623\u0633\u0645\u0627\u0643",cover:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!0},{id:"-P03LX9MledW_z7QfyHO",slug:"-P03LX9MledW_z7QfyHO",name:"\u0627\u0644\u062D\u0633\u0646 \u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062D\u0645\u0648\u0644\u0629",area:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0634\u0627\u0631\u0639 \u0627\u0644\u0628\u062D\u0631",address:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0634\u0627\u0631\u0639 \u0627\u0644\u0628\u062D\u0631 \u0623\u0645\u0627\u0645 \u0627\u0644\u0628\u0646\u0643",phone:"01026046049",whatsapp:"01026046049",category:"\u0635\u064A\u0627\u0646\u0629 \u0648\u0645\u0648\u0628\u0627\u064A\u0644",cover:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!0},{id:"p_1788801925745_vuxmjs",slug:"mtbkh-eyma-llaakl-albyty",name:"\u0645\u0637\u0628\u062E \u0625\u064A\u0645\u0649 \u0644\u0644\u0623\u0643\u0644 \u0627\u0644\u0628\u064A\u062A\u064A",area:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0637\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629",address:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0637\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",phone:"01090123456",whatsapp:"01090123456",category:"\u0623\u0643\u0644 \u0628\u064A\u062A\u064A \u0648\u062D\u0644\u0648\u064A\u0627\u062A",cover:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!1},{id:"-P0hEa0K6ZfAM65O27G9",slug:"kwafyr-mnh-asad",name:"\u0643\u0648\u0627\u0641\u064A\u0631 \u0645\u0646\u0647 \u0623\u0633\u0639\u062F",area:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u062D\u064A \u0627\u0644\u0633\u0644\u0627\u0645",address:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u062D\u064A \u0627\u0644\u0633\u0644\u0627\u0645",phone:"01099887766",whatsapp:"01099887766",category:"\u0628\u064A\u0648\u062A\u064A \u0648\u0643\u0648\u0627\u0641\u064A\u0631",cover:"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!1}];function j(n=null){const r=document.getElementById("home-verified-cards-grid"),a=document.getElementById("home-verified-status-text");if(!r)return;let e=null;try{const l=localStorage.getItem(Y);if(l){const i=JSON.parse(l);Array.isArray(i)&&i.length>0&&(e=i)}}catch{}if(Array.isArray(n)&&n.length>0){const l=n.filter(i=>i&&i.isVerified&&!me(i)).map(i=>({...i,id:i.id||i._key,slug:i.slug||i.id,name:i.name,area:i.area||"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",address:i.address||"",phone:i.phone||"",whatsapp:i.whatsapp||"",logoUrl:i.logoUrl||"",coverImageUrl:i.coverImageUrl||i.gallery&&i.gallery[0]||"",category:i.categoryName||i.customCategory||i.categoryId||"\u0646\u0634\u0627\u0637 \u062A\u062C\u0627\u0631\u064A",cover:i.coverImageUrl||i.logoUrl||i.gallery&&i.gallery[0]||"/assets/images/og-whatsapp.jpg",isSponsored:!!(i.isSponsored&&(!i.sponsoredUntil||i.sponsoredUntil>Date.now()))}));if(l.length>0){x=l;try{localStorage.setItem(Y,JSON.stringify(l))}catch{}}}else x.length||(e&&e.length>0?x=e:x=[...xe]);if(typeof window<"u"&&Array.isArray(x)){window._placesRegistry=window._placesRegistry||new Map;for(const l of x){if(!l)continue;const i=String(l.slug||l.id||"").toLowerCase().trim();i&&(window._placesRegistry.set(i,l),l.slug&&window._placesRegistry.set(String(l.slug).toLowerCase().trim(),l),l.id&&window._placesRegistry.set(String(l.id).toLowerCase().trim(),l))}}const t=["\u{1F947} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #1","\u{1F948} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #2","\u{1F949} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #3","\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #4"];function s(l){r.innerHTML=l.map((i,u)=>{const g=i.slug||i.id||"";return`
      <article class="fair-place-card" data-card-index="${u}"
               data-place-id="${o(i.id||"")}"
               data-place-slug="${o(g)}"
               data-name="${o(i.name||"")}"
               data-phone="${o(i.phone||"")}"
               data-whatsapp="${o(i.whatsapp||"")}"
               data-area="${o(i.area||"")}"
               data-address="${o(i.address||"")}"
               data-cover="${o(i.coverImageUrl||i.cover||"")}"
               data-logo="${o(i.logoUrl||i.logo||"")}"
               data-category="${o(i.category||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${o(g)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(g)}')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(g)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(g)}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(g)}', this)"
               style="cursor:pointer">
        <span class="fair-place-card__rank">${t[u]||`\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #${u+1}`}</span>
        <div class="fair-place-card__cover">
          <img src="${o(i.coverImageUrl||i.cover)}" alt="${o(i.name)}" loading="lazy" onerror="this.src='/assets/images/og-whatsapp.jpg'">
          <div class="fair-place-card__badges">
            ${i.isSponsored?'<span class="fair-badge-sponsored">\u2B50 \u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632</span>':""}
            <span class="fair-badge-verified">\u2713 \u0645\u0648\u062B\u0642 \u0631\u0633\u0645\u064A\u0627\u064B</span>
          </div>
        </div>
        <div class="fair-place-card__body">
          <h3 class="fair-place-card__title" title="${o(i.name)}">${y(i.name)}</h3>
          <div class="fair-place-card__meta">
            <span>\u{1F4CD} ${y(i.area)}</span>
            <span>\u{1F3F7}\uFE0F ${y(i.category)}</span>
          </div>
          <a href="/place.html?slug=${encodeURIComponent(g)}" class="fair-place-card__link" onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${o(g)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(g)}')">\u0639\u0631\u0636 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0643\u0627\u0646 \u2197</a>
        </div>
      </article>
    `}).join("")}const c=x.length,h=[];for(let l=0;l<Math.min(4,c);l++)h.push(x[(I+l)%c]);if(s(h),A&&(clearInterval(A),A=null),c>=2){let l=1;A=setInterval(()=>{r.querySelectorAll(".fair-place-card").forEach(u=>u.classList.add("anim-swap")),setTimeout(()=>{I=(I+1)%x.length,l++;const u=[],g=x.length;for(let d=0;d<Math.min(4,g);d++)u.push(x[(I+d)%g]);s(u),a&&(a.innerHTML=`\u{1F7E2} <b>\u062A\u0645 \u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0635\u062F\u0627\u0631\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B (${l}):</b> \u062A\u062A\u063A\u064A\u0631 \u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u062F\u0648\u0631\u064A\u0627\u064B \u0644\u0636\u0645\u0627\u0646 \u062A\u0643\u0627\u0641\u0624 \u0646\u0633\u0628 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0645\u0648\u062B\u0642\u0629!`)},300)},4500)}}function Ce(n){const r=[...n];for(let a=r.length-1;a>0;a--){const e=Math.floor(Math.random()*(a+1));[r[a],r[e]]=[r[e],r[a]]}return r}function X(n){const r=document.getElementById("latest-places-grid");if(r){if(!n||!n.length){r.innerHTML=`
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">\u{1F3EA}</div>
        <p class="empty-state__text">\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0645\u0627\u0643\u0646 \u0645\u0633\u062C\u0644\u0629 \u0628\u0639\u062F</p>
        <a href="dashboard.html?section=add" class="btn btn-primary btn-sm" style="margin-top:1rem">\u0623\u0636\u0641 \u0623\u0648\u0644 \u0645\u0643\u0627\u0646</a>
      </div>
    `;return}r.innerHTML=n.map(a=>de(a)).join("")}}function $e(n){const r=document.getElementById("offers-scroll"),a=document.getElementById("offers-section");if(r){if(!n||!n.length){a?.remove();return}r.innerHTML=n.map(e=>{const t=e.discountPercent||ve(e.oldPrice,e.newPrice),s=ue(e.endDate);return`
      <article class="offer-card"
               data-place-slug="${o(e.placeSlug||"")}"
               data-name="${o(e.placeName||e.title||"")}"
               data-cover="${o(e.imageUrl||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${o(e.placeSlug||"")}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(e.placeSlug||"")}')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(e.placeSlug||"")}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(e.placeSlug||"")}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(e.placeSlug||"")}', this)"
               style="cursor:pointer">
        <div class="offer-card__image">
          ${e.imageUrl?`<img src="${o(e.imageUrl)}" alt="${o(e.title)}" loading="lazy" />`:'<div style="width:100%;height:100%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:2rem">\u{1F3F7}\uFE0F</div>'}
          ${t>0?`<span class="offer-card__discount-badge">-${t}%</span>`:""}
        </div>
        <div class="offer-card__body">
          <h3 class="offer-card__title">${y(e.title)}</h3>
          ${e.placeName?`<div class="offer-card__place">\u{1F4CD} ${y(e.placeName)}</div>`:""}
          ${e.newPrice?`
          <div class="offer-card__price">
            <span class="offer-card__price-new">${N(e.newPrice)}</span>
            ${e.oldPrice?`<span class="offer-card__price-old">${N(e.oldPrice)}</span>`:""}
          </div>
          `:""}
          <div class="offer-card__expiry">
            \u23F0 ${s>0?`\u064A\u0646\u062A\u0647\u064A \u062E\u0644\u0627\u0644 ${s} \u064A\u0648\u0645`:"\u064A\u0646\u062A\u0647\u064A \u0627\u0644\u064A\u0648\u0645"}
          </div>
        </div>
      </article>
    `}).join("")}}function ke(n){const r=document.getElementById("delivery-grid"),a=document.getElementById("delivery-section");if(r){if(!n||!n.length){a?.remove();return}r.innerHTML=n.slice(0,8).map(e=>{const t=e.slug||e._key||e.id||"",s=we(e),c=e.area?` \u2022 ${y(e.area)}`:" \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629";return`
    <a href="/place.html?slug=${encodeURIComponent(t)}" class="delivery-card"
       style="--vehicle-color: ${s.color}; --vehicle-bg: ${s.bgColor}; --vehicle-border: ${s.borderColor}; --vehicle-glow: ${s.glowColor};"
       data-place-id="${o(e.id||e._key||"")}"
       data-place-slug="${o(t)}"
       data-name="${o(e.name||"")}"
       data-phone="${o(e.phone||"")}"
       data-whatsapp="${o(e.whatsapp||"")}"
       data-area="${o(e.area||"")}"
       data-cover="${o(e.coverImageUrl||"")}"
       data-logo="${o(e.logoUrl||"")}"
       onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${o(t)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(t)}')"
       ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(t)}', this)"
       onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(t)}', this)"
       onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(t)}', this)">
      <div class="delivery-card__icon" aria-label="${s.name}">
        <span class="delivery-card__emoji" aria-hidden="true">${s.icon}</span>
      </div>
      <div class="delivery-card__info">
        <div class="delivery-card__name">${y(e.name)}</div>
        <div class="delivery-card__type">
          <span class="delivery-card__type-tag" style="color: ${s.color}; font-weight: 700;">${s.label}</span>
          <span class="delivery-card__type-area">${c}</span>
        </div>
      </div>
    </a>
  `}).join("")}}function Le(n){const r=document.getElementById("ads-container");if(!r||!n||!n.length)return;const a=n.filter(e=>e&&(e.imageUrl||e.image_url));if(!a.length){r.innerHTML="";return}r.innerHTML=a.map(e=>{let t=(e.link||"#").trim();t.startsWith("place.html")&&(t="/"+t);const s=e.id||e._id||"",c=e.title||"\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632",h=e.imageUrl||e.image_url||"";return`
      <a href="${o(t)}" class="ad-banner" target="_blank" rel="noopener noreferrer sponsored" aria-label="${o(c)}" data-ad-id="${o(s)}">
        <span class="ad-banner__label" aria-label="\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632">
          <span class="ad-banner__star" aria-hidden="true">\u2B50</span>
          <span class="ad-banner__text">\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632</span>
        </span>
        <img src="${o(h)}" alt="${o(c)}" loading="lazy" decoding="async"
             width="800" height="420" style="aspect-ratio:16/7;" />
      </a>
    `}).join(""),r.querySelectorAll(".ad-banner").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-ad-id");if(t&&Z)try{fetch(`${Z}/api/ads/track-click`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:t}),keepalive:!0}).catch(()=>{})}catch{}})})}class Se{constructor(){this.ctx=null,this.lastTickTime=0}init(){if(!this.ctx&&typeof window<"u"){const r=window.AudioContext||window.webkitAudioContext;r&&(this.ctx=new r)}}playTick(r=550){try{if(!this.ctx||this.ctx.state!=="running")return;const a=this.ctx.currentTime;if(a-this.lastTickTime<.038)return;this.lastTickTime=a;const e=this.ctx.createOscillator(),t=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(r,a),e.frequency.exponentialRampToValueAtTime(r*1.35,a+.018),t.gain.setValueAtTime(.04,a),t.gain.exponentialRampToValueAtTime(1e-4,a+.022),e.connect(t),t.connect(this.ctx.destination),e.start(a),e.stop(a+.028)}catch{}}playDoneChime(){try{if(!this.ctx||this.ctx.state!=="running")return;const r=this.ctx.currentTime;[1046.5,1318.51,1567.98,2093].forEach((e,t)=>{const s=this.ctx.createOscillator(),c=this.ctx.createGain();s.type="triangle",s.frequency.setValueAtTime(e,r+t*.055),c.gain.setValueAtTime(.06,r+t*.055),c.gain.exponentialRampToValueAtTime(1e-4,r+t*.055+.32),s.connect(c),c.connect(this.ctx.destination),s.start(r+t*.055),s.stop(r+t*.055+.35)})}catch{}}}const S=new Se;function ee(n,r){const a=document.getElementById("stats-bar");if(!a)return;const e=5e4,t=Math.max(15e3,Number(n)||0),s=12e3,c=Math.max(124,Number(r)||0),h=55;a.innerHTML=`
    <div class="stats-bar__inner container">
      <div class="stats-bar__item stats-interactive-item" title="\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0634\u0647\u0631\u064A \u0628\u0627\u0644\u0645\u0646\u0637\u0642\u0629">
        <div class="stats-bar__value" data-target="${e}" data-prefix="+" data-suffix="">+${e.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0645\u0634\u0627\u0647\u062F\u0629 \u0648\u0632\u064A\u0627\u0631\u0629 \u0634\u0647\u0631\u064A\u0627\u064B</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0639\u062F\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0646 \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629">
        <div class="stats-bar__value" data-target="${t}" data-prefix="+" data-suffix="">+${t.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0646\u0634\u0627\u0637 \u062A\u062C\u0627\u0631\u064A \u0648\u0639\u064A\u0627\u062F\u0629 \u0648\u0645\u0647\u0646\u0629 \u0645\u0633\u062C\u0644\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u064A\u0648\u0645\u064A \u0641\u064A \u0645\u062F\u0646 \u0648\u0642\u0631\u0649 \u0627\u0644\u062F\u0644\u064A\u0644">
        <div class="stats-bar__value" data-target="${s}" data-prefix="+" data-suffix="">+${s.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0639\u0645\u0644\u064A\u0629 \u0628\u062D\u062B \u064A\u0648\u0645\u064A\u0627\u064B</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0639\u062F\u062F \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0646 \u0648\u0627\u0644\u062D\u0631\u0641 \u0627\u0644\u0645\u063A\u0637\u0627\u0629">
        <div class="stats-bar__value" data-target="${c}" data-prefix="+" data-suffix="">+${c}</div>
        <div class="stats-bar__label">\u062A\u0635\u0646\u064A\u0641 \u0648\u0645\u0647\u0646\u0629 \u0648\u062D\u0631\u0641\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0627\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062F\u0644\u064A\u0644">
        <div class="stats-bar__value" data-target="${h}" data-prefix="+" data-suffix="">+${h}</div>
        <div class="stats-bar__label">\u0645\u062F\u064A\u0646\u0629 \u0648\u0642\u0631\u064A\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062F\u0644\u064A\u0644</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A">
        <div class="stats-bar__value stats-text-badge">\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629</div>
        <div class="stats-bar__label">\u0645\u062D\u0627\u0641\u0638\u0629 \u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629</div>
      </div>
    </div>
  `,Me(a)}function Me(n){let r=!1,a=!1;function e(){if(a)return;a=!0;const t=n.querySelectorAll(".stats-bar__value[data-target]");if(!t.length){a=!1;return}const s=1800,c=performance.now();t.forEach(i=>{i.classList.remove("stats-done"),i.classList.add("stats-counting")});let h=-1;function l(i){const u=i-c,g=Math.min(1,u/s),d=1-Math.pow(1-g,3);t.forEach(v=>{const _=parseInt(v.getAttribute("data-target"),10)||0,p=v.getAttribute("data-prefix")||"",f=v.getAttribute("data-suffix")||"",C=Math.floor(d*_);if(v.textContent=`${p}${C.toLocaleString("en-US")}${f}`,C!==h){h=C;const w=420+C/Math.max(1,_)*430;S.playTick(w)}}),g<1?requestAnimationFrame(l):(t.forEach(v=>{const _=parseInt(v.getAttribute("data-target"),10)||0,p=v.getAttribute("data-prefix")||"",f=v.getAttribute("data-suffix")||"";v.textContent=`${p}${_.toLocaleString("en-US")}${f}`,v.classList.remove("stats-counting"),v.classList.add("stats-done")}),S.playDoneChime(),a=!1)}requestAnimationFrame(l)}if("IntersectionObserver"in window){const t=new IntersectionObserver(s=>{s.forEach(c=>{c.isIntersecting&&!r&&(r=!0,e(),t.disconnect())})},{threshold:.15});t.observe(n)}else e();n.querySelectorAll(".stats-interactive-item").forEach(t=>{t.addEventListener("click",()=>{S.init(),S.ctx&&S.ctx.state==="suspended"&&S.ctx.resume().catch(()=>{}),e()})})}function ae(n){const r=document.getElementById("hero-search-glow-wrap"),a=document.getElementById("hero-search-input"),e=document.getElementById("hero-search-btn"),t=document.getElementById("hero-search-clear"),s=document.getElementById("hero-live-dropdown");if(!a)return;s&&!document.getElementById("hero-live-list")&&(s.innerHTML=`
      <div class="hero-live-dropdown__header">
        <span>\u26A1 \u0646\u062A\u0627\u0626\u062C \u0628\u062D\u062B \u0641\u0648\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629:</span>
        <span class="hero-live-dropdown__count" id="hero-live-count">0</span>
      </div>
      <div class="hero-live-dropdown__list" id="hero-live-list"></div>
      <div class="hero-live-dropdown__footer">
        <a href="search.html" class="hero-live-dropdown__all-btn" id="hero-live-all-btn">
          <span>\u0639\u0631\u0636 \u0643\u0627\u0641\u0629 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645</span>
          <span>\u2190</span>
        </a>
      </div>
    `);const c=document.getElementById("hero-live-list"),h=document.getElementById("hero-live-count"),l=document.getElementById("hero-live-all-btn"),i=document.getElementById("hero-quick-cats");i&&n&&(i.innerHTML=n.slice(0,10).map(p=>{const f=p.slug||p._key||p.id||"",C=G(f||p.name,18);return`
        <a href="category.html?slug=${encodeURIComponent(f)}" class="hero__quick-cat">
          ${C||p.icon||"\u{1F3EA}"} ${y(p.name)}
        </a>
      `}).join(""));function u(){const p=a.value.trim();p&&(window.location.href=`search.html?q=${encodeURIComponent(p)}`)}e?.addEventListener("click",p=>{p.stopPropagation(),u()}),a.addEventListener("keydown",p=>{p.key==="Enter"?u():p.key==="Escape"&&s?.classList.remove("visible")}),t?.addEventListener("click",p=>{p.stopPropagation(),a.value="",t.classList.remove("visible"),s?.classList.remove("visible"),c&&(c.innerHTML=""),a.focus()});function g(){!s||!c||(h&&(h.textContent="\u0645\u0642\u062A\u0631\u062D\u0627\u062A"),c.innerHTML=`
      <div class="hero-live-suggestions">
        <div class="hero-live-suggestions__title">\u26A1 \u0645\u0642\u062A\u0631\u062D\u0627\u062A \u0633\u0631\u064A\u0639\u0629 \u0648\u0645\u0637\u0644\u0648\u0628\u0629 \u0627\u0644\u0622\u0646:</div>
        <div class="hero-live-suggestions__chips">
          <button type="button" class="hero-live-suggestion-chip" data-q="\u0635\u064A\u062F\u0644\u064A\u0629">\u{1F48A} \u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0648\u0637\u0648\u0627\u0631\u0626</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="\u062F\u0643\u062A\u0648\u0631 \u0639\u064A\u0627\u062F\u0629">\u{1FA7A} \u0623\u0637\u0628\u0627\u0621 \u0648\u0639\u064A\u0627\u062F\u0627\u062A</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="\u0633\u0628\u0627\u0643">\u{1F527} \u0633\u0628\u0627\u0643\u064A\u0646 \u0648\u0623\u0639\u0637\u0627\u0644</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="\u0643\u0647\u0631\u0628\u0627\u0626\u064A">\u26A1 \u0641\u0646\u064A\u064A\u0646 \u0643\u0647\u0631\u0628\u0627\u0621</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="\u0645\u0637\u0639\u0645">\u{1F354} \u0645\u0637\u0627\u0639\u0645 \u0648\u062F\u0644\u064A\u0641\u0631\u064A</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A">\u{1F6D2} \u0628\u0642\u0627\u0644\u0629 \u0648\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="\u0645\u0633\u062A\u0634\u0641\u0649">\u{1F3E5} \u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0625\u0633\u0639\u0627\u0641</button>
          <button type="button" class="hero-live-suggestion-chip" data-q="\u062D\u0645\u0627\u062F">\u2B50 \u062D\u0645\u0627\u062F</button>
        </div>
      </div>
    `,c.querySelectorAll(".hero-live-suggestion-chip").forEach(p=>{p.addEventListener("click",f=>{f.preventDefault(),f.stopPropagation();const C=p.getAttribute("data-q")||"";a.value=C,a.dispatchEvent(new Event("input",{bubbles:!0})),a.focus()})}),s.classList.add("visible"))}a.addEventListener("focus",()=>{a.value.trim().length>=1&&c?.children.length>0?s?.classList.add("visible"):a.value.trim()||g()}),a.addEventListener("click",()=>{a.value.trim()||g()});let d=null,v=0;a.addEventListener("input",()=>{const p=a.value.trim();if(t?.classList.toggle("visible",p.length>0),l&&(l.href=`search.html?q=${encodeURIComponent(p)}`),!p){s?.classList.remove("visible"),c&&(c.innerHTML="");return}const f=p.length<=2?0:35;clearTimeout(d),d=setTimeout(async()=>{const C=++v;try{let z=function(b,m){if(!b)return"";if(!m)return y(b);const k=m.trim().split(/\s+/).filter(Boolean);if(!k.length)return y(b);const M=k.map($=>$.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),E=new RegExp(`(${M.join("|")})`,"gi");return y(b).replace(E,'<span class="search-highlight">$1</span>')};const w=await be(p,{limit:6});if(C!==v||!s||!c)return;if(!w||w.length===0){h&&(h.textContent="0"),c.innerHTML=`
            <div class="hero-live-empty">
              <div class="hero-live-empty__icon">\u{1F50D}</div>
              <div class="hero-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="hero-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,s.classList.add("visible");return}h&&(h.textContent=String(w.length));let U="";w.matchingCategories&&w.matchingCategories.length>0&&(U=`
            <div class="hero-live-matched-cats">
              <span class="hero-live-matched-cats__label">\u26A1 \u0623\u0642\u0633\u0627\u0645 \u0645\u0637\u0627\u0628\u0642\u0629:</span>
              <div class="hero-live-matched-cats__chips">
                ${w.matchingCategories.map(b=>{const m=b.slug||b.id||"",k=G(m||b.name,16);return`
                    <a href="category.html?slug=${encodeURIComponent(m)}" class="hero-live-matched-cat-chip" onclick="event.stopPropagation()">
                      ${k||b.icon||"\u{1F3EA}"}
                      <span>${y(b.name)}</span>
                    </a>
                  `}).join("")}
              </div>
            </div>
          `),c.innerHTML=U+w.map(b=>{const m=b.raw||b,k=m.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",M=m.categoryName||b.category||"",E=m.area||m.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",$=m.slug||m.id||"",B=m.photoURL||m.logo||m.coverURL||m.coverImageUrl||m.logoUrl||"",re=m.isVerified||!1,H=m.isOpen!==void 0?m.isOpen:!0,R=(k.trim()[0]||"\u0645").toUpperCase(),P=(m.phone||"").trim(),F=(m.whatsapp||m.phone||"").trim(),L=F?F.replace(/[^0-9]/g,""):"",T=L?L.startsWith("2")?L:L.startsWith("0")?"2"+L:"20"+L:"";let D="";if((P||T)&&(D=`
              <div class="hero-live-actions" onclick="event.stopPropagation()">
                ${P?`
                  <a href="tel:${o(P)}" class="hero-live-action-btn hero-live-action-btn--call" title="\u0627\u062A\u0635\u0627\u0644 \u0647\u0627\u062A\u0641\u064A \u0645\u0628\u0627\u0634\u0631" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span class="action-btn-text">\u0627\u062A\u0635\u0627\u0644</span>
                  </a>
                `:""}
                ${T?`
                  <a href="https://wa.me/${o(T)}" target="_blank" rel="noopener" class="hero-live-action-btn hero-live-action-btn--wa" title="\u0645\u062D\u0627\u062F\u062B\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0641\u0648\u0631\u064A\u0629" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.35-.49.07-1.12.1-3.26-.79-2.73-1.14-4.5-3.89-4.63-4.07-.14-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36.002.52.01.17.01.39-.06.61.47.24.58.8 1.95.87 2.09.07.15.12.32.02.52-.09.21-.14.33-.29.5-.14.17-.3.38-.43.51-.15.15-.3.32-.13.62.18.3.78 1.29 1.68 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.79.84 2.1 1 .3.15.51.23.58.36.08.13.08.76-.16 1.43z"/></svg>
                    <span class="action-btn-text">\u0648\u0627\u062A\u0633\u0627\u0628</span>
                  </a>
                `:""}
              </div>
            `),typeof window<"u"&&window._placesRegistry&&$){const se=String($).toLowerCase().trim();window._placesRegistry.set(se,m),m.slug&&window._placesRegistry.set(String(m.slug).toLowerCase().trim(),m),m.id&&window._placesRegistry.set(String(m.id).toLowerCase().trim(),m)}return`
            <a href="/place.html?slug=${encodeURIComponent($)}" class="hero-live-dropdown__item" role="option"
               data-place-id="${o(m.id||$)}"
               data-place-slug="${o($)}"
               data-name="${o(k)}"
               data-phone="${o(m.phone||"")}"
               data-whatsapp="${o(m.whatsapp||"")}"
               data-area="${o(E)}"
               data-address="${o(m.address||"")}"
               data-cover="${o(m.coverImageUrl||B)}"
               data-logo="${o(m.logoUrl||B)}"
               data-category="${o(M)}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${o($)}', event) : null"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o($)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o($)}', this)">
              <div class="hero-live-avatar">
                ${B?`<img src="${o(B)}" alt="${o(k)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'hero-live-avatar-fallback\\'>${R}</div>'"/>`:`<div class="hero-live-avatar-fallback">${R}</div>`}
              </div>
              <div class="hero-live-content">
                <div class="hero-live-title-row">
                  <span class="hero-live-name">${z(k,p)}</span>
                  ${re?'<span class="hero-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="hero-live-meta-row">
                  ${M?`<span class="hero-live-cat">${z(M,p)}</span>`:""}
                  <span class="hero-live-area">${y(E)}</span>
                  <span class="${H?"hero-live-status-open":"hero-live-status-closed"}">
                    ${H?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
              ${D}
            </a>
          `}).join(""),s.classList.add("visible")}catch(w){console.warn("[HeroLiveSearch] error:",w)}},f)}),document.addEventListener("click",p=>{r?.contains(p.target)||s?.classList.remove("visible")}),document.getElementById("hero-voice-trigger-btn")?.addEventListener("click",p=>{p.preventDefault(),p.stopPropagation(),fe()})}function Ee(){const n=document.getElementById("villages-filter-input"),r=document.querySelectorAll(".village-grid-item");!n||!r.length||n.addEventListener("input",()=>{const a=n.value.trim();r.forEach(e=>{const t=e.getAttribute("data-name")||"",s=e.textContent||"",c=!a||O(t,a)||O(s,a);e.style.display=c?"flex":"none"})})}let q=null;function te(){if(typeof window>"u")return;q&&clearTimeout(q);const n=document.getElementById("typewriter-part-1"),r=document.getElementById("typewriter-part-2"),a=document.getElementById("typewriter-part-3");if(!n||!r||!a)return;const e="\u0641\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",t=" \u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",s=["\u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0645\u0647\u0631 \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648\u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u062D\u0644\u0627\u062A\u060C \u0627\u0644\u0645\u0637\u0627\u0639\u0645\u060C \u0648\u0627\u0644\u0643\u0627\u0641\u064A\u0647\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0644\u062D\u0631\u0641\u064A\u064A\u0646: \u0633\u0628\u0627\u0643\u060C \u0646\u062C\u0627\u0631\u060C \u0643\u0647\u0631\u0628\u0627\u0626\u064A\u060C \u0648\u0646\u0642\u0627\u0634","\u0623\u0642\u0648\u0649 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062D\u0635\u0631\u064A\u0629 \u0648\u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629"];n.textContent=e,r.textContent=t,a.textContent||(a.textContent=s[0]);let c=!1;const h=g=>new Promise(d=>{q=setTimeout(d,g)});async function l(g,d,v=50){for(let _=0;_<d.length;_++){if(c)return;g.textContent+=d[_];const p=Math.floor(Math.random()*25);await h(v+p)}}async function i(g,d=null,v=25){const _=g.textContent,p=d!==null?d:_.length;for(let f=0;f<p;f++){if(c)return;g.textContent=_.slice(0,_.length-1-f),await h(v)}}async function u(){await h(3500);let g=0;for(;!c;){await i(a,null,18),await h(250),g++;const d=s[g%s.length];await l(a,d,38),await h(4e3)}}u().catch(()=>{})}function ie(){const n=[{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629",icon:"\u{1F3D9}\uFE0F",desc:"\u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0648\u0627\u0644\u0645\u0631\u0643\u0632"},{name:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629",icon:"\u{1F30A}",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0645\u062C\u0644\u0633 \u0642\u0631\u0648\u064A \u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629"},{name:"\u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629"},{name:"\u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A",icon:"\u{1F40E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A"},{name:"\u0627\u0644\u0628\u0635\u0631\u0627\u0637",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u0627\u0637"},{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3E2}",desc:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u064A\u062A \u0634\u0631\u064A\u0641",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u0634\u0631\u064A\u0641"},{name:"\u0627\u0644\u0639\u0627\u0645\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0627\u0645\u0631\u0629"},{name:"\u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629"},{name:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C"},{name:"\u0645\u064A\u062A \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u062E\u0636\u064A\u0631"},{name:"\u0627\u0644\u0639\u0632\u064A\u0632\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0632\u064A\u0632\u0629"},{name:"\u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645",icon:"\u{1F54A}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645"},{name:"\u0627\u0644\u0634\u0628\u0648\u0644",icon:"\u{1F30A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0628\u0648\u0644"},{name:"\u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629"},{name:"\u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629",icon:"\u{1F333}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645"},{name:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632",icon:"\u{1F34C}",desc:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632"},{name:"\u0627\u0644\u062D\u0648\u062A\u0629",icon:"\u{1F41F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062D\u0648\u062A\u0629"},{name:"\u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629"},{name:"\u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C"},{name:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631",icon:"\u2728",desc:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631"},{name:"\u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629"},{name:"\u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627"},{name:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627",icon:"\u{1F33E}",desc:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627"},{name:"\u0627\u0644\u0642\u0637\u0634\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0637\u0634\u0629"},{name:"\u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629",icon:"\u{1F525}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629"},{name:"\u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629",icon:"\u{1F9F1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629"},{name:"\u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629",icon:"\u{1F42A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629"},{name:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631",icon:"\u{1F331}",desc:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631"},{name:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642",icon:"\u{1F6E3}\uFE0F",desc:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642"},{name:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F30A}",desc:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0627\u0644\u062C\u0648\u0627\u0628\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0648\u0627\u0628\u0631"},{name:"\u0627\u0644\u0645\u0648\u0627\u062C\u062F",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u0648\u0627\u062C\u062F"},{name:"\u0627\u0644\u0636\u0647\u064A\u0631",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0636\u0647\u064A\u0631"},{name:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631",icon:"\u{1F333}",desc:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631"},{name:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631"},{name:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633",icon:"\u{1F33E}",desc:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633"},{name:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646",icon:"\u{1F33A}",desc:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646"},{name:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629"},{name:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639",icon:"\u26FA",desc:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639"},{name:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A",icon:"\u26CF\uFE0F",desc:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A"},{name:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A",icon:"\u{1F6E1}\uFE0F",desc:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A"},{name:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629",icon:"\u{1F6E3}\uFE0F",desc:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629"},{name:"\u0627\u0644\u0645\u062B\u0644\u062B",icon:"\u{1F53A}",desc:"\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u062B\u0644\u062B"},{name:"\u0627\u0644\u0645\u062C\u0627\u064A\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062C\u0627\u064A\u0631"},{name:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F",icon:"\u{1F686}",desc:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F"},{name:"\u0627\u0644\u0642\u0628\u0644\u064A\u0629",icon:"\u{1F9ED}",desc:"\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0642\u0628\u0644\u064A\u0629"}];return`
    <!-- Hero Section -->
    <section class="hero" aria-labelledby="hero-title">
      <!-- Manzala & Matariya Heritage Watermark Decorative Silhouettes -->
      <div class="hero-heritage-decor" aria-hidden="true">
        <!-- Palm Trees Right & Left -->
        <svg class="decor-item decor-palm-right" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C48 95 47 65 52 45 C40 38 25 42 12 52 C20 40 32 32 50 38 C42 22 28 14 10 16 C25 10 40 18 52 35 C52 18 48 5 38 0 C50 3 56 18 56 35 C64 18 78 10 92 16 C76 15 63 24 57 38 C75 32 88 40 95 52 C82 42 68 38 56 45 C58 65 57 95 55 130 Z" />
        </svg>
        <svg class="decor-item decor-palm-left" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C52 95 53 65 48 45 C60 38 75 42 88 52 C80 40 68 32 50 38 C58 22 72 14 90 16 C75 10 60 18 48 35 C48 18 52 5 62 0 C50 3 44 18 44 35 C36 18 22 10 8 16 C24 15 37 24 43 38 C25 32 12 40 5 52 C18 42 32 38 44 45 C42 65 43 95 45 130 Z" />
        </svg>

        <!-- Traditional Fishing Boat / Faluka with Sail (\u0641\u0644\u0648\u0643\u0629 \u0635\u064A\u062F \u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629) -->
        <svg class="decor-item decor-boat-left" viewBox="0 0 120 70" fill="currentColor">
          <path d="M15 48 C35 56 85 56 105 48 C115 54 95 62 60 62 C25 62 5 54 15 48 Z" />
          <path d="M58 48 L58 10 L88 38 L58 44 Z" opacity="0.9" />
          <path d="M54 48 L54 18 L32 42 L54 45 Z" opacity="0.75" />
          <path d="M10 65 C30 63 50 67 70 65 C90 63 110 67 118 65" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>
        </svg>

        <svg class="decor-item decor-boat-right" viewBox="0 0 100 60" fill="currentColor">
          <path d="M12 40 C30 48 70 48 88 40 C96 46 80 52 50 52 C20 52 4 46 12 40 Z" />
          <path d="M48 40 L48 8 L72 32 L48 36 Z" opacity="0.9" />
          <path d="M45 40 L45 16 L28 35 L45 37 Z" opacity="0.7" />
        </svg>

        <!-- Swimming Fishes (\u0633\u0645\u0643 \u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u0637\u0627\u0632\u062C - \u0628\u0644\u0637\u064A \u0648\u0648\u0642\u0627\u0631) -->
        <svg class="decor-item decor-fish-1" viewBox="0 0 70 35" fill="currentColor">
          <path d="M5 17 C20 6 45 6 60 17 C45 28 20 28 5 17 Z M60 17 L70 8 L66 17 L70 26 Z" />
          <circle cx="22" cy="14" r="2" fill="#fff" opacity="0.5"/>
          <path d="M30 11 Q36 8 42 11" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.7"/>
        </svg>

        <svg class="decor-item decor-fish-2" viewBox="0 0 55 28" fill="currentColor">
          <path d="M5 14 C16 5 36 5 48 14 C36 23 16 23 5 14 Z M48 14 L56 7 L53 14 L56 21 Z" />
          <circle cx="18" cy="11" r="1.5" fill="#fff" opacity="0.5"/>
        </svg>

        <svg class="decor-item decor-fish-3" viewBox="0 0 45 22" fill="currentColor">
          <path d="M4 11 C13 4 30 4 39 11 C30 18 13 18 4 11 Z M39 11 L46 5 L43 11 L46 17 Z" />
        </svg>

        <!-- Water Ripples / Lake Waves (\u0623\u0645\u0648\u0627\u062C \u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u0647\u0627\u062F\u0626\u0629) -->
        <svg class="decor-item decor-waves" viewBox="0 0 600 60" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M10 20 C40 10 70 30 100 20 C130 10 160 30 190 20 C220 10 250 30 280 20 C310 10 340 30 370 20 C400 10 430 30 460 20 C490 10 520 30 550 20 C570 14 590 24 600 20" opacity="0.45"/>
          <path d="M30 40 C60 30 90 50 120 40 C150 30 180 50 210 40 C240 30 270 50 300 40 C330 30 360 50 390 40 C420 30 450 50 480 40 C510 30 540 50 570 40" opacity="0.3"/>
        </svg>

        <!-- Flying Lake Waterbirds (\u0646\u0648\u0627\u0631\u0633 \u0648\u0637\u0627\u0626\u0631 \u0627\u0644\u0628\u062C\u0639 \u0641\u0648\u0642 \u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629) -->
        <svg class="decor-item decor-birds" viewBox="0 0 100 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M5 25 Q15 12 25 25 Q35 12 45 25" opacity="0.6"/>
          <path d="M50 16 Q58 5 66 16 Q74 5 82 16" opacity="0.45"/>
          <path d="M80 28 Q86 19 92 28 Q98 19 104 28" opacity="0.4"/>
        </svg>
      </div>

      <div class="hero__inner">
        <div class="hero__eyebrow animate-fade-in">
          <span aria-hidden="true">\u{1F4CD}</span>
          \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A \u2014 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0646\u0627\u0633\u0647\u0627
        </div>
        <h1 class="hero__title animate-fade-in-up" id="hero-title" aria-label="\u0641\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F \u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F \u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629">
          <span class="hero__title-line1">
            <span id="typewriter-part-1" class="hero__title-highlight">\u0641\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F</span>
            <span id="typewriter-part-2" class="hero__title-white"> \u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F</span>
          </span>
          <span class="hero__title-line2">
            <span id="typewriter-part-3" class="hero__title-subtext">\u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629</span>
            <span class="typewriter-cursor" aria-hidden="true">|</span>
          </span>
        </h1>
        <p class="hero__subtitle animate-fade-in">
          \u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0631\u0642\u0645\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646\u060C \u0627\u0644\u0645\u062D\u0644\u0627\u062A\u060C \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648\u0627\u0644\u0645\u0647\u0646 \u0648\u0627\u0644\u062D\u0631\u0641\u064A\u064A\u0646 (\u0633\u0628\u0627\u0643\u060C \u0646\u062C\u0627\u0631\u060C \u0645\u0628\u0644\u0637\u060C \u0643\u0647\u0631\u0628\u0627\u0626\u064A\u060C \u0646\u0642\u0627\u0634) \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629\u060C \u0627\u0644\u0645\u0637\u0631\u064A\u0629\u060C \u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629\u060C \u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629\u060C \u0645\u064A\u062A \u0633\u0644\u0633\u064A\u0644\u060C \u0627\u0644\u0628\u0635\u0631\u0627\u0637\u060C \u0627\u0644\u0639\u0632\u064A\u0632\u0629\u060C \u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629\u060C \u0627\u0644\u0631\u0648\u0636\u0629\u060C \u0627\u0644\u062D\u0648\u062A\u0629\u060C \u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629\u060C \u0645\u064A\u062A \u062E\u0636\u064A\u0631\u060C \u0648\u0645\u064A\u062A \u0634\u0631\u064A\u0641.
        </p>

        <!-- Search Box (Exact Image Match: Full Glowing Horizontal Neon Border + Blue Voice Button + Search Button) -->
        <div class="hero__search">
          <div class="hero-search-glow-wrap" id="hero-search-glow-wrap">
            <div class="hero-search-pill" id="hero-search-pill" role="search">
              <!-- Left Voice Search Button (\u0632\u0631 \u0627\u0644\u0645\u0627\u064A\u0643 \u0627\u0644\u0623\u0632\u0631\u0642 \u0645\u062B\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u062A\u0645\u0627\u0645\u0627\u064B) -->
              <div class="hero-search-voice-wrap" id="hero-search-voice-slot">
                <button type="button" class="hero-voice-btn" id="hero-voice-trigger-btn" aria-label="\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A" title="\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A">
                  <span class="voice-wave-left" aria-hidden="true">(((</span>
                  <svg class="voice-mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <span class="voice-wave-right" aria-hidden="true">)))</span>
                </button>
              </div>

              <!-- Input Divider -->
              <div class="hero-search-divider" aria-hidden="true"></div>

              <!-- Main Input -->
              <input
                type="search"
                id="hero-search-input"
                class="hero-search-pill-input"
                placeholder="\u0627\u0628\u062D\u062B \u0639\u0646 \u0645\u0643\u0627\u0646 \u0623\u0648 \u062E\u062F\u0645\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629..."
                autocomplete="off"
                aria-label="\u0627\u0628\u062D\u062B \u0641\u064A \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629"
              />

              <button type="button" class="hero-search-clear-btn" id="hero-search-clear" aria-label="\u0645\u0633\u062D \u0627\u0644\u0628\u062D\u062B" title="\u0645\u0633\u062D">\u2715</button>

              <!-- Right Circular Search Button -->
              <button class="hero-search-btn-trigger" id="hero-search-btn" aria-label="\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u062F\u0644\u064A\u0644" title="\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u062F\u0644\u064A\u0644">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>

            <!-- Hero Floating Live Results Dropdown -->
            <div class="hero-live-dropdown" id="hero-live-dropdown" aria-live="polite">
              <div class="hero-live-dropdown__header">
                <span>\u26A1 \u0646\u062A\u0627\u0626\u062C \u0628\u062D\u062B \u0641\u0648\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629:</span>
                <span class="hero-live-dropdown__count" id="hero-live-count">0</span>
              </div>
              <div class="hero-live-dropdown__list" id="hero-live-list"></div>
              <div class="hero-live-dropdown__footer">
                <a href="search.html" class="hero-live-dropdown__all-btn" id="hero-live-all-btn">
                  <span>\u0639\u0631\u0636 \u0643\u0627\u0641\u0629 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645</span>
                  <span>\u2190</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Categories -->
        <div class="hero__quick-cats" id="hero-quick-cats"></div>
      </div>
    </section>

    <!-- Stats Bar -->
    <div class="stats-bar" id="stats-bar"></div>

    <!-- Local Command Center: high-frequency actions -->
    <section class="local-command-center" aria-labelledby="local-command-title">
      <div class="container">
        <div class="command-heading">
          <div>
            <span class="command-kicker"><span class="command-kicker__dot"></span> \u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0645\u062D\u0644\u064A \u0641\u064A \u062E\u0637\u0648\u0629</span>
            <h2 id="local-command-title">\u0645\u062D\u062A\u0627\u062C \u0625\u064A\u0647 \u062F\u0644\u0648\u0642\u062A\u064A\u061F</h2>
            <p>\u0627\u062E\u062A\u0635\u0631 \u0627\u0644\u0637\u0631\u064A\u0642 \u0648\u0648\u0635\u0644 \u0644\u0644\u0645\u0643\u0627\u0646 \u0623\u0648 \u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u062A\u064A \u062A\u0628\u062D\u062B \u0639\u0646\u0647\u0627 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629.</p>
          </div>
          <a href="search.html" class="command-search-link" aria-label="\u0641\u062A\u062D \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645">\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645 <span>\u2190</span></a>
        </div>
        <div class="command-grid">
          <a class="command-card command-card--search" href="search.html">
            <span class="command-card__orb"></span><span class="command-card__icon">\u{1F50E}</span>
            <span class="command-card__body"><strong>\u0627\u0628\u062D\u062B \u0639\u0646 \u0623\u064A \u0634\u064A\u0621</strong><small>\u0645\u0643\u0627\u0646\u060C \u0637\u0628\u064A\u0628\u060C \u0645\u062D\u0644 \u0623\u0648 \u0635\u0646\u0627\u064A\u0639\u064A</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--nearby" href="around-me.html">
            <span class="command-card__orb"></span><span class="command-card__icon">\u{1F4CD}</span>
            <span class="command-card__body"><strong>\u0627\u0644\u0623\u0642\u0631\u0628 \u0625\u0644\u064A\u0643</strong><small>\u0627\u0643\u062A\u0634\u0641 \u0645\u0627 \u062D\u0648\u0644\u0643 \u0627\u0644\u0622\u0646</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--open" href="places.html?filter=open">
            <span class="command-card__orb"></span><span class="command-card__icon">\u{1F7E2}</span>
            <span class="command-card__body"><strong>\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646</strong><small>\u062E\u062F\u0645\u0627\u062A \u0648\u0623\u0645\u0627\u0643\u0646 \u0645\u062A\u0627\u062D\u0629</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--live" href="now.html">
            <span class="command-card__orb"></span><span class="command-card__icon">\u{1F91D}</span>
            <span class="command-card__body"><strong>\u0637\u0644\u0628\u0627\u062A \u0623\u0647\u0627\u0644\u064A\u0646\u0627</strong><small>\u0645\u064A\u0646 \u0641\u0627\u0636\u064A \u064A\u064A\u062C\u064A \u0648\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062E\u062F\u0645\u0627\u062A</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--offers" href="offers.html">
            <span class="command-card__orb"></span><span class="command-card__icon">\u{1F3F7}\uFE0F</span>
            <span class="command-card__body"><strong>\u0639\u0631\u0648\u0636 \u0627\u0644\u064A\u0648\u0645</strong><small>\u062E\u0635\u0648\u0645\u0627\u062A \u0648\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0645\u064A\u0632\u0629</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--emergency" href="emergency.html">
            <span class="command-card__orb"></span><span class="command-card__icon">\u{1F6A8}</span>
            <span class="command-card__body"><strong>\u062F\u0644\u064A\u0644 \u0627\u0644\u0637\u0648\u0627\u0631\u0626</strong><small>\u0623\u0631\u0642\u0627\u0645 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u0647\u0645\u0629</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card" href="quran.html" aria-label="\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">\u2726</span>
            <span class="command-card__body"><strong>\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645</strong><small>\u062A\u0644\u0627\u0648\u0629 \u0648\u0642\u0631\u0627\u0621\u0629 \u0628\u0648\u0627\u062C\u0647\u0629 \u0625\u0633\u0644\u0627\u0645\u064A\u0629</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--nearby" href="hadith.html" aria-label="\u0627\u0644\u0623\u062D\u0627\u062F\u064A\u062B \u0627\u0644\u0634\u0631\u064A\u0641\u0629">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">\u06DE</span>
            <span class="command-card__body"><strong>\u0627\u0644\u0623\u062D\u0627\u062F\u064A\u062B \u0627\u0644\u0634\u0631\u064A\u0641\u0629</strong><small>\u0627\u0642\u0631\u0623 \u0648\u0627\u0628\u062D\u062B \u0628\u0633\u0631\u0639\u0629</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--open" href="quran-search.html" aria-label="\u0627\u0644\u0628\u0627\u062D\u062B \u0641\u064A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">\u2315</span>
            <span class="command-card__body"><strong>\u0627\u0644\u0628\u0627\u062D\u062B \u0641\u064A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645</strong><small>\u0627\u0628\u062D\u062B \u0628\u0623\u064A \u0643\u0644\u0645\u0629 \u0628\u0630\u0643\u0627\u0621</small></span><span class="command-card__arrow">\u2190</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Dedicated 1:1 Wide Advertisement Showcase (Immediately after "\u0645\u062D\u062A\u0627\u062C \u0625\u064A\u0647 \u062F\u0644\u0648\u0642\u062A\u064A\u061F") -->
    <div id="wide-ads-banner" class="container" style="min-height:0;margin:14px auto"></div>

    <!-- Trust Strip -->
    <section class="trust-strip" aria-label="\u0644\u0645\u0627\u0630\u0627 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F">
      <div class="container trust-strip__inner">
        <div class="trust-item"><span>\u{1F6E1}\uFE0F</span><div><strong>\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0644\u064A\u0629</strong><small>\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0645\u0635\u0645\u0645\u0629 \u0644\u0644\u0645\u0646\u0637\u0642\u0629</small></div></div>
        <div class="trust-item"><span>\u{1F4CD}</span><div><strong>\u0642\u0631\u064A\u0628 \u0645\u0646\u0643</strong><small>\u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u062D\u0648\u0644\u0643</small></div></div>
        <div class="trust-item"><span>\u26A1</span><div><strong>\u0628\u062D\u062B \u0633\u0631\u064A\u0639</strong><small>\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0628\u0623\u0642\u0644 \u062E\u0637\u0648\u0627\u062A</small></div></div>
        <div class="trust-item"><span>\u{1F504}</span><div><strong>\u062F\u0644\u064A\u0644 \u0645\u062A\u062C\u062F\u062F</strong><small>\u0623\u0645\u0627\u0643\u0646 \u0648\u0639\u0631\u0648\u0636 \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u062C\u062F\u064A\u062F\u0629</small></div></div>
      </div>
    </section>

    <div id="ads-container" class="container" style="min-height:0"></div>

    <!-- Towns & Villages Directory Section -->
    <section class="section" style="background:var(--surface);padding-block:var(--space-8);border-bottom:1px solid var(--border)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);flex-wrap:wrap;gap:12px">
          <div>
            <h2 class="section-title" style="margin-bottom:2px">
              <span>\u{1F5FA}\uFE0F</span> \u0627\u0633\u062A\u0643\u0634\u0641 \u062D\u0633\u0628 \u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0648\u0627\u0644\u0642\u0631\u064A\u0629 (${n.length})
            </h2>
            <p style="font-size:13px;color:var(--text-muted);margin:0">\u062A\u0635\u0641\u062D \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629</p>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <input type="text" id="villages-filter-input" placeholder="\u{1F50D} \u0627\u0628\u062D\u062B \u0639\u0646 \u0642\u0631\u064A\u062A\u0643 \u0623\u0648 \u0645\u062F\u064A\u0646\u062A\u0643..." class="form-input" style="font-size:12.5px;padding:6px 12px;width:210px;margin:0" />
            <a href="places.html" class="section-link" style="white-space:nowrap">\u0643\u0644 \u0627\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u2190</a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:10px;margin-top:14px" id="villages-grid-container">
          ${n.map(r=>`
            <a href="${{\u0627\u0644\u0639\u0632\u064A\u0632\u0629:"#/village/al-aziza",\u0627\u0644\u0628\u0635\u0631\u0627\u0637:"#/village/al-basrat",\u0627\u0644\u0634\u0628\u0648\u0644:"#/village/al-shabboul",\u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629:"#/village/al-asafra",\u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629:"#/village/al-nasayma"}[r.name]||`places.html?area=${encodeURIComponent(r.name)}`}" class="category-card village-grid-item" data-name="${o(r.name)}" style="padding:12px 8px;text-align:center;text-decoration:none;border-radius:var(--radius-md);transition:all 0.2s ease;display:flex;flex-direction:column;align-items:center" title="\u062F\u0644\u064A\u0644 \u0623\u0645\u0627\u0643\u0646 \u0648\u062E\u062F\u0645\u0627\u062A \u0648\u0645\u0648\u0627\u0635\u0644\u0627\u062A ${r.name}">
              <div style="font-size:22px;margin-bottom:4px">${r.icon}</div>
              <div style="font-weight:700;font-size:13px;color:var(--text-primary)">${r.name}</div>
              <div style="font-size:11px;color:var(--text-secondary);font-weight:600;margin-top:2px">${r.desc}</div>
            </a>
          `).join("")}
        </div>
      </div>
    </section>

    <!-- \u26A1 \u0642\u0633\u0645 \u0645\u064A\u0646 \u0645\u062A\u0627\u062D \u064A\u064A\u062C\u064A \u062F\u0644\u0648\u0642\u062A\u064A (\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u062D\u0631\u0641\u064A\u064A\u0646) -->
    <div class="container section" style="padding-top:0;padding-bottom:0">
      <div id="home-oncall-craftsmen-container"></div>
    </div>

    <!-- \u{1F4E2} \u0642\u0633\u0645 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062E\u062F\u0645\u0627\u062A (\u0633\u062C\u0644 \u0627\u062D\u062A\u064A\u0627\u062C\u0643 / \u0639\u0631\u0648\u0636 \u0627\u0644\u0641\u0646\u064A\u064A\u0646 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629) -->
    <div class="container section" style="padding-top:0;padding-bottom:0;margin-top:1.5rem">
      <div id="home-service-requests-container"></div>
    </div>

    <!-- \u{1F5FA}\uFE0F \u0627\u0643\u062A\u0634\u0641 \u0645\u0627 \u062D\u0648\u0644\u0643 (GPS Radar) -->
    <div id="home-around-me-container"></div>

    <!-- Dedicated Sponsored Showcase Section -->
    <div class="container section" style="padding-bottom:0" id="home-sponsored-container"></div>

    <!-- Categories Section -->
    <section class="section">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">\u062A\u0635\u0641\u062D \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A</h2>
          <a href="categories.html" class="section-link">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</a>
        </div>
        <div class="categories-grid" id="categories-grid">
          ${Array(8).fill('<div class="skeleton-category-card"><div class="skeleton-category-card__icon skeleton"></div><div class="skeleton-category-card__name skeleton"></div></div>').join("")}
        </div>
      </div>
    </section>

    <!-- Verified Places Showcase Section (\u0623\u0645\u0627\u0643\u0646 \u0648\u062B\u0642\u062A \u0635\u0641\u062D\u062A\u0647\u0627 \u0645\u0639\u0646\u0627) -->
    <style>
      .home-verified-section {
        background: var(--surface);
        padding-block: var(--space-8);
      }
      .home-verified-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-4);
        flex-wrap: wrap;
        gap: 12px;
      }
      .home-verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #10B981;
        padding: 3px 12px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 6px;
      }
      .home-verified-dot {
        width: 7px;
        height: 7px;
        background: #10B981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10B981;
        animation: fairPulse 1.6s infinite;
        display: inline-block;
      }
      .home-verified-title {
        margin: 0 0 4px 0;
        font-size: clamp(1.3rem, 2.5vw, 1.75rem);
        font-weight: 800;
        color: var(--text-primary);
      }
      .home-verified-subtitle {
        color: var(--text-muted);
        font-size: 13.5px;
        margin: 0;
      }
      .home-verified-box {
        background: linear-gradient(145deg, #091E33 0%, #0F2F4E 60%, #0A2238 100%);
        border: 1px solid rgba(245, 166, 35, 0.35);
        border-radius: 20px;
        padding: 18px 18px 22px 18px;
        box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.45);
        color: #ffffff;
        position: relative;
        overflow: hidden;
      }
      .home-verified-subbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .home-verified-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: #F1F5F9;
      }
      .home-verified-live-tag {
        background: rgba(245, 166, 35, 0.15);
        border: 1px solid rgba(245, 166, 35, 0.4);
        color: #FCD34D;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11.5px;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .fair-cards-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        transition: opacity 0.3s ease;
      }
      .fair-place-card {
        background: #0C2339;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        overflow: hidden;
        transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease, border-color 0.25s;
        box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        position: relative;
      }
      .fair-place-card.anim-swap {
        transform: scale(0.93) translateY(6px);
        opacity: 0.45;
      }
      .fair-place-card:hover {
        border-color: #F5A623;
        transform: translateY(-3px);
      }
      .fair-place-card__rank {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 3;
        padding: 2px 8px;
        background: rgba(11, 34, 57, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(245, 166, 35, 0.6);
        color: #FCD34D;
        border-radius: 9999px;
        font-size: 10.5px;
        font-weight: 800;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
      }
      .fair-place-card__cover {
        height: 115px;
        width: 100%;
        position: relative;
        background: #153857;
        overflow: hidden;
      }
      .fair-place-card__cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s;
      }
      .fair-place-card:hover .fair-place-card__cover img {
        transform: scale(1.06);
      }
      .fair-place-card__badges {
        position: absolute;
        bottom: 6px;
        right: 6px;
        left: 6px;
        display: flex;
        align-items: center;
        gap: 5px;
        flex-wrap: wrap;
      }
      .fair-badge-sponsored {
        background: linear-gradient(135deg, #F5A623, #D97706);
        color: #000;
        font-size: 10px;
        font-weight: 900;
        padding: 2px 7px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
      }
      .fair-badge-verified {
        background: #0284C7;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
      }
      .fair-place-card__body {
        padding: 12px 10px 14px 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
      }
      .fair-place-card__title {
        font-size: 13.5px;
        font-weight: 800;
        color: #FFFFFF;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .fair-place-card__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11.5px;
        color: #94A3B8;
        gap: 4px;
      }
      .fair-place-card__link {
        margin-top: 6px;
        padding: 5px 8px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #38BDF8;
        text-align: center;
        border-radius: 7px;
        font-size: 11px;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s;
      }
      .fair-place-card__link:hover {
        background: #0284C7;
        color: #fff;
      }
      @media (max-width: 991px) {
        .fair-cards-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 540px) {
        .fair-cards-grid {
          grid-template-columns: 1fr;
        }
        .home-verified-box {
          padding: 16px 12px;
        }
      }
    </style>

    <section class="section home-verified-section" id="verified-places-section">
      <div class="container">
        <div class="home-verified-header">
          <div>
            <div class="home-verified-badge">
              <span class="home-verified-dot"></span>
              <span>\u062A\u0648\u062B\u064A\u0642 \u0631\u0633\u0645\u064A \u0645\u0639\u062A\u0645\u062F \u{1F6E1}\uFE0F</span>
            </div>
            <h2 class="section-title home-verified-title">
              \u0623\u0645\u0627\u0643\u0646 \u0648\u062B\u0642\u062A \u0635\u0641\u062D\u062A\u0647\u0627 \u0645\u0639\u0646\u0627
            </h2>
            <p class="home-verified-subtitle">
              \u0623\u0646\u0634\u0637\u0629 \u062A\u062C\u0627\u0631\u064A\u0629 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u0639\u062A\u0645\u062F\u0629 \u0628\u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0645\u0639 \u062A\u062F\u0648\u064A\u0631 \u0639\u0627\u062F\u0644 \u0648\u0645\u0633\u062A\u0645\u0631 \u0641\u064A \u0627\u0644\u0635\u062F\u0627\u0631\u0629
            </p>
          </div>
          <a href="places.html?filter=verified" class="section-link">\u0643\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0645\u0648\u062B\u0642\u0629 \u2190</a>
        </div>

        <div class="home-verified-box">
          <div class="home-verified-subbar">
            <div class="home-verified-status">
              <span class="home-verified-dot"></span>
              <span id="home-verified-status-text">\u0628\u062B \u0645\u0628\u0627\u0634\u0631: \u062A\u062A\u063A\u064A\u0631 \u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0645\u0648\u062B\u0642\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0643\u0644 4.5 \u062B\u0648\u0627\u0646\u064D \u0644\u0636\u0645\u0627\u0646 \u0639\u062F\u0627\u0644\u0629 \u0627\u0644\u0638\u0647\u0648\u0631</span>
            </div>
            <div class="home-verified-live-tag">
              <span>\u26A1 \u062A\u062F\u0648\u064A\u0631 \u062D\u064A \u0645\u0633\u062A\u0645\u0631</span>
            </div>
          </div>

          <!-- 4 Horizontal Cards Grid -->
          <div class="fair-cards-grid" id="home-verified-cards-grid">
            <div style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; color: #94A3B8;">\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0645\u0648\u062B\u0642\u0629...</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Places Section -->
    <section class="section">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">\u0623\u062D\u062F\u062B \u0627\u0644\u0623\u0645\u0627\u0643\u0646</h2>
          <a href="places.html" class="section-link">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</a>
        </div>
        <div class="places-grid" id="latest-places-grid">
          ${Array(4).fill(pe()).join("")}
        </div>
        <div class="show-more">
          <a href="places.html" class="btn btn-outline btn-lg">\u0639\u0631\u0636 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646</a>
        </div>
      </div>
    </section>

    <!-- Offers Section -->
    <section class="section" id="offers-section" style="background:var(--surface);padding-block:var(--space-10)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">
            <span>\u{1F3F7}\uFE0F</span> \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u064A\u0648\u0645\u064A\u0629
          </h2>
          <a href="offers.html" class="section-link">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</a>
        </div>
        <div class="offers-scroll" id="offers-scroll"></div>
      </div>
    </section>

    <!-- Delivery Services Section -->
    <section class="section" id="delivery-section">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">
            <span style="display:inline-flex;align-items:center;gap:3px;font-size:1.1em;">\u{1F6FA} \u{1F697} \u{1F6F5}</span> \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0648\u0627\u0644\u0645\u0634\u0627\u0648\u064A\u0631
          </h2>
          <a href="/places.html?category=delivery" class="section-link">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</a>
        </div>
        <div class="delivery-grid" id="delivery-grid"></div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="section home-cta-section" style="background:linear-gradient(135deg,var(--primary-dark) 0%,var(--primary) 100%);color:#fff;position:relative;overflow:hidden">
      <!-- Manzala & Matariya Heritage Watermark Decorative Silhouettes for CTA Section -->
      <div class="cta-heritage-decor" aria-hidden="true">
        <!-- Right Palm Tree -->
        <svg class="cta-decor-item cta-palm-right" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C48 95 47 65 52 45 C40 38 25 42 12 52 C20 40 32 32 50 38 C42 22 28 14 10 16 C25 10 40 18 52 35 C52 18 48 5 38 0 C50 3 56 18 56 35 C64 18 78 10 92 16 C76 15 63 24 57 38 C75 32 88 40 95 52 C82 42 68 38 56 45 C58 65 57 95 55 130 Z" />
        </svg>

        <!-- Left Palm Tree -->
        <svg class="cta-decor-item cta-palm-left" viewBox="0 0 100 130" fill="currentColor">
          <path d="M50 130 C52 95 53 65 48 45 C60 38 75 42 88 52 C80 40 68 32 50 38 C58 22 72 14 90 16 C75 10 60 18 48 35 C48 18 52 5 62 0 C50 3 44 18 44 35 C36 18 22 10 8 16 C24 15 37 24 43 38 C25 32 12 40 5 52 C18 42 32 38 44 45 C42 65 43 95 45 130 Z" />
        </svg>

        <!-- Fishing Net / \u0634\u0628\u0627\u0643 \u0627\u0644\u0635\u064A\u062F \u0627\u0644\u062A\u0631\u0627\u062B\u064A\u0629 \u0644\u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 -->
        <svg class="cta-decor-item cta-net" viewBox="0 0 180 100" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M10 10 L170 90 M30 10 L180 80 M50 10 L180 60 M70 10 L180 40 M90 10 L180 20 M10 30 L160 100 M10 50 L140 100 M10 70 L120 100 M10 90 L100 100" opacity="0.35"/>
          <path d="M170 10 L10 90 M150 10 L0 80 M130 10 L0 60 M110 10 L0 40 M90 10 L0 20 M170 30 L20 100 M170 50 L40 100 M170 70 L60 100 M170 90 L80 100" opacity="0.35"/>
        </svg>

        <!-- Faluka / Fishing Boat with Sail -->
        <svg class="cta-decor-item cta-boat" viewBox="0 0 120 70" fill="currentColor">
          <path d="M15 48 C35 56 85 56 105 48 C115 54 95 62 60 62 C25 62 5 54 15 48 Z" />
          <path d="M58 48 L58 10 L88 38 L58 44 Z" opacity="0.9" />
          <path d="M54 48 L54 18 L32 42 L54 45 Z" opacity="0.75" />
        </svg>

        <!-- Jumping Fish (\u0633\u0645\u0643 \u0627\u0644\u0628\u0644\u0637\u064A \u0648\u0627\u0644\u0648\u0642\u0627\u0631) -->
        <svg class="cta-decor-item cta-fish-left" viewBox="0 0 65 32" fill="currentColor">
          <path d="M5 16 C18 6 42 6 56 16 C42 26 18 26 5 16 Z M56 16 L65 8 L61 16 L65 24 Z" />
          <circle cx="20" cy="13" r="1.8" fill="#fff" opacity="0.5"/>
        </svg>

        <svg class="cta-decor-item cta-fish-right" viewBox="0 0 50 25" fill="currentColor">
          <path d="M4 12 C14 5 33 5 44 12 C33 19 14 19 4 12 Z M44 12 L50 6 L47 12 L50 18 Z" />
        </svg>

        <!-- Gentle Lake Waves -->
        <svg class="cta-decor-item cta-waves" viewBox="0 0 600 50" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M0 15 C30 8 60 22 90 15 C120 8 150 22 180 15 C210 8 240 22 270 15 C300 8 330 22 360 15 C390 8 420 22 450 15 C480 8 510 22 540 15 C570 8 600 22 630 15" opacity="0.4"/>
          <path d="M20 32 C50 25 80 39 110 32 C140 25 170 39 200 32 C230 25 260 39 290 32 C320 25 350 39 380 32 C410 25 440 39 470 32 C500 25 530 39 560 32 C590 25 620 39 650 32" opacity="0.25"/>
        </svg>
      </div>

      <div class="container text-center" style="position:relative;z-index:1">
        <div style="font-size:3rem;margin-bottom:var(--space-4)">\u{1F3EA}</div>
        <h2 style="color:#fff;font-size:var(--font-size-2xl);font-weight:800;margin-bottom:var(--space-3)">
          \u0623\u0636\u0641 \u0645\u0643\u0627\u0646\u0643 \u0641\u064A \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A
        </h2>
        <p style="color:rgba(255,255,255,0.85);max-width:520px;margin:0 auto var(--space-6);line-height:1.6">
          \u0633\u062C\u0651\u0644 \u0645\u062D\u0644\u0643 \u0623\u0648 \u062E\u062F\u0645\u062A\u0643 \u0627\u0644\u0622\u0646 \u0648\u0643\u0646 \u062C\u0632\u0621\u0627\u064B \u0645\u0646 \u0623\u0643\u0628\u0631 \u062F\u0644\u064A\u0644 \u0631\u0642\u0645\u064A \u0644\u0645\u062F\u064A\u0646\u062A\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629
        </p>
        <a href="dashboard.html?section=add" class="btn btn-secondary btn-xl btn-pulse-cta">
          <span class="cta-btn-shimmer" aria-hidden="true"></span>
          <span class="cta-btn-icon">\u2795</span>
          <span class="cta-btn-text">\u0623\u0636\u0641 \u0645\u0643\u0627\u0646\u0643 \u0627\u0644\u0622\u0646 \u2014 \u0645\u062C\u0627\u0646\u0627\u064B</span>
        </a>
      </div>
    </section>
  `}function y(n){return n?String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function o(n){return n?String(n).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function Be(){try{let t=function(){try{localStorage.setItem("__has_seen_welcome_video_v1","true")}catch{}a&&a.pause(),r.style.opacity="0";const s=r.querySelector(".first-visit-video-card");s&&(s.style.transform="scale(0.92)"),setTimeout(()=>{r&&r.parentNode&&r.parentNode.removeChild(r)},350)};return}catch(n){console.warn("[Welcome Video] error:",n)}}
