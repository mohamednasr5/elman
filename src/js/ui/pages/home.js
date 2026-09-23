import{getCategories as de,getPublishedPlaces as G,getActiveOffers as Q,getAds as pe,getCached as x,FALLBACK_CATEGORIES as J}from"../../core/db.js";import{WORKER_URL as K}from"../../core/firebase.js";import"../../core/state.js";import{renderPlaceCard as me,renderPlaceCardSkeleton as he}from"../components/PlaceCard.js?v=20260923_04";import{isAtmPlace as ge}from"../../utils/atm.js";import{mountSponsoredShowcase as ve,isPlaceSponsored as ue}from"../components/SponsoredShowcase.js";import{formatPrice as Y,calcDiscount as fe,arabicMatch as X}from"../../utils/arabic.js";import{daysUntil as be}from"../../utils/date.js";import{getCurrentUser as R}from"../../core/auth.js";import{openManzalaVoiceAssistantModal as ye}from"../../services/voice.service.js";import{executeFastSearch as _e,warmupSearchEngine as F}from"../../services/search-engine.service.js";import{getCategorySvg as ee}from"../../utils/professions-data.js";import{getCategoryVisualMeta as we}from"../../utils/category-visual.js";import{resolveDeliveryVehicle as xe}from"../../utils/delivery-vehicle.js";import{resolvePlaceMedia as Ce}from"../../utils/category-assets.js?v=20260923_04";const Qe={pharmacy:{emoji:"\u{1F48A}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},supermarket:{emoji:"\u{1F6D2}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},paint:{emoji:"\u{1F3A8}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},herbs:{emoji:"\u{1F33F}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},doctor:{emoji:"\u{1F468}\u200D\u2695\uFE0F",color:"rgba(41,128,185,0.1)",border:"#2980B9"},plumbing:{emoji:"\u{1F527}",color:"rgba(52,73,94,0.1)",border:"#52596E"},plumber:{emoji:"\u{1FAA0}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpenter:{emoji:"\u{1FA9A}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},tiler:{emoji:"\u{1F9F1}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},painter:{emoji:"\u{1F58C}\uFE0F",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},electrician:{emoji:"\u26A1",color:"rgba(243,156,18,0.1)",border:"#F39C12"},"ac-technician":{emoji:"\u2744\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},blacksmith:{emoji:"\u{1F6E0}\uFE0F",color:"rgba(52,73,94,0.1)",border:"#52596E"},alumital:{emoji:"\u{1FA9F}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},mechanic:{emoji:"\u{1F529}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},upholsterer:{emoji:"\u{1F6CB}\uFE0F",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},feed:{emoji:"\u{1F33E}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},poultry:{emoji:"\u{1F357}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},bakery:{emoji:"\u{1F35E}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},vegetables:{emoji:"\u{1F96C}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},antiques:{emoji:"\u{1F3FA}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},electronics:{emoji:"\u{1F4FA}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpet:{emoji:"\u{1F9F6}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},mattress:{emoji:"\u{1F6CF}\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},china:{emoji:"\u{1F37D}\uFE0F",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},electrical:{emoji:"\u{1F4A1}",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},roastery:{emoji:"\u{1F95C}",color:"rgba(101,67,33,0.1)",border:"#654321"},phones:{emoji:"\u{1F4F1}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},grocery:{emoji:"\u{1F3EA}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},hypermarket:{emoji:"\u{1F3EC}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"},delivery:{emoji:"\u{1F680}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"}},Je={emoji:"\u{1F3EA}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"};export async function renderHomePage(c,{user:s}={}){const i=document.getElementById("hero-section-static");if(!!!i)c.innerHTML=ne(),oe();else{i.removeAttribute("id");const e=[];let t=i.nextSibling;for(;t;)e.push(t),t=t.nextSibling;e.forEach(h=>h.parentNode&&h.parentNode.removeChild(h));const l=document.createElement("div");l.innerHTML=ne();const p=l.querySelector(".hero");if(p){if(!i.querySelector(".hero-heritage-decor")){const h=p.querySelector(".hero-heritage-decor");h&&i.insertAdjacentElement("afterbegin",h)}p.remove()}for(;l.firstChild;)c.appendChild(l.firstChild);oe()}T();try{const e=x("categories_all"),t=x("published_100_");if(Array.isArray(e)&&e.length>0&&se(e),Array.isArray(t)&&t.length>0){const l=R()||s;T(t);const p=q(t,l?.uid);z(p.slice(0,8)),re(t.length,e?.length||31),F(t,e||[])}}catch{}let o=[],r=[],d=[],u=[];try{const[e,t,l,p]=await Promise.allSettled([de(),G({limit:100}),Q(8),pe("homepage")]);o=e.status==="fulfilled"&&Array.isArray(e.value)&&e.value.length?e.value:x("categories_all")||J||[],r=t.status==="fulfilled"&&Array.isArray(t.value)&&t.value.length?t.value:x("published_100_")||[],d=l.status==="fulfilled"&&Array.isArray(l.value)?l.value:x("offers_active_8")||[],u=p.status==="fulfilled"&&Array.isArray(p.value)?p.value:x("ads_homepage")||[]}catch(e){console.warn("[Home] Data load non-fatal warning:",e),o=x("categories_all")||J||[],r=x("published_100_")||[],d=x("offers_active_8")||[],u=x("ads_homepage")||[]}const g=R()||s;if(typeof window<"u"&&Array.isArray(r)&&r.length>0){window._placesRegistry=window._placesRegistry||new Map;for(const e of r){if(!e)continue;const t=String(e.slug||e.id||e._key||"").toLowerCase().trim();t&&(window._placesRegistry.set(t,e),e.id&&window._placesRegistry.set(String(e.id).toLowerCase().trim(),e),e.slug&&window._placesRegistry.set(String(e.slug).toLowerCase().trim(),e))}}try{T(r)}catch(e){console.warn("[Home] initHomeVerifiedShowcase err:",e)}try{const e=q(r,g?.uid);z(e.slice(0,8))}catch(e){console.warn("[Home] renderLatestPlaces err:",e)}try{d&&d.length&&ie(d)}catch(e){console.warn("[Home] renderOffers err:",e)}try{const e=(r||[]).filter(t=>{if(!t)return!1;if(t.deliveryType||t.categoryId?.includes("delivery"))return!0;const l=String(t.name||"").toLowerCase();return/توكتوك|تاكسي|شانجي|اتوبيس|توصيل|دليفري|وصلي/i.test(l)?!/صيدلية|مطعم|كشري|حلواني|سوبر\s*ماركت|هايبر/i.test(l):!1});e.length&&Le(e)}catch(e){console.warn("[Home] renderDeliveryServices err:",e)}try{u&&u.length&&$e(u)}catch(e){console.warn("[Home] renderAds err:",e)}try{re(r.length||0,o?.length||31)}catch{}try{F(r,o||[])}catch{}try{se(o||[])}catch{}Promise.resolve().then(()=>{try{import("../components/WhoIsAvailableNow.js").then(({renderWhoIsAvailableNow:e})=>{const t=document.getElementById("home-oncall-craftsmen-container");t&&e(t)}).catch(e=>console.warn("[Home] WhoIsAvailableNow load err:",e))}catch{}try{import("../components/ServiceRequestsSection.js").then(({renderServiceRequestsSection:e})=>{const t=document.getElementById("home-service-requests-container");t&&e(t,{limit:4,showHero:!1,isCompact:!0})}).catch(e=>console.warn("[Home] ServiceRequestsSection load err:",e))}catch{}try{import("../components/AroundMeRadar.js").then(({mountAroundMeRadar:e})=>{e("home-around-me-container")}).catch(e=>console.warn("[Home] AroundMeRadar load err:",e))}catch{}try{ve("home-sponsored-container",r,{title:"\u0623\u0645\u0627\u0643\u0646 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0645\u064A\u0632\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",subtitle:"\u0623\u0646\u0634\u0637\u0629 \u062A\u062C\u0627\u0631\u064A\u0629 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u0648\u0635\u0649 \u0628\u0647\u0627 \u0648\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u062F\u064A\u0646\u0629",maxVisible:4})}catch(e){console.warn("[Home] SponsoredShowcase mount err:",e)}try{import("../components/WideAdsBanner.js").then(({mountWideAdsBanner:e})=>e("wide-ads-banner")).catch(e=>console.warn("[Home] WideAdsBanner load err:",e))}catch{}try{import("../components/HomeJobBoardFeed.js").then(({mountHomeJobBoardFeed:e})=>e("home-job-board-grid")).catch(e=>console.warn("[Home] HomeJobBoardFeed load err:",e))}catch{}try{import("../../services/articles.service.js").then(async({getArticles:e})=>{const t=document.getElementById("home-blog-section"),l=document.getElementById("home-blog-grid");if(!t||!l)return;const p=await e({limit:4}).catch(()=>[]);if(!Array.isArray(p)||!p.length){t.style.display="none";return}t.style.display="";l.innerHTML=p.map(a=>{const h="/article/"+encodeURIComponent(a.slug||"")+"/",m=a.place||{},u=a.coverImageUrl?`<img src="${String(a.coverImageUrl).replace(/"/g,"&quot;")}" alt="${String(a.title||"مقال").replace(/"/g,"&quot;")}" width="640" height="360" loading="lazy" decoding="async" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block">`:'<div style="aspect-ratio:16/9;background:#f1f5f9;display:grid;place-items:center;font-size:36px">📝</div>';return`<article class="blog-card" style="display:flex;flex-direction:column;overflow:hidden;background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 4px 20px rgba(15,23,42,.05);transition:transform .2s"><a href="${h}" style="display:block;overflow:hidden">${u}</a><div style="padding:16px;display:flex;flex-direction:column;flex-grow:1">${m.name?`<div style="font-size:.78rem;color:#0f766e;font-weight:800;margin-bottom:6px"><a href="/place/${encodeURIComponent(m.slug||m.id||"")}/" style="color:inherit;text-decoration:none">${String(m.name).replace(/</g,"&lt;")}</a></div>`:""}<h3 style="font-size:1.02rem;line-height:1.5;margin:0 0 8px;font-weight:900"><a href="${h}" style="color:#0f172a;text-decoration:none">${String(a.title||"").replace(/</g,"&lt;")}</a></h3><p style="margin:0 0 12px;line-height:1.7;color:#64748b;font-size:.85rem;flex-grow:1">${String(a.excerpt||a.content||"").slice(0,120).replace(/</g,"&lt;")}...</p><a href="${h}" style="color:#0f4c5c;font-weight:800;font-size:.85rem;text-decoration:none;display:inline-flex;align-items:center;gap:4px">قراءة المقال ←</a></div></article>`}).join("")}).catch(()=>{const t=document.getElementById("home-blog-section");t&&(t.style.display="none")})}catch{}try{Ee()}catch{}}),typeof window<"u"&&!window._homeRealtimeSyncAttached&&(window._homeRealtimeSyncAttached=!0,window.addEventListener("manzala:realtime_sync",async e=>{try{const[t,l]=await Promise.all([G({limit:100,forceFresh:!0}).catch(()=>[]),Q(8).catch(()=>[])]);if(t&&t.length){const p=R()||userArg,h=q(t,p?.uid);z(h.slice(0,8)),T(t),F(t,x("categories_all")||[])}l&&l.length&&ie(l)}catch(t){console.warn("[Home Realtime Sync Error]:",t)}}))}function q(c,s=null,i=!0){const a=new Set,o=[],r=[];[...c].sort((p,h)=>{const f=Number(p.createdAt)||Number(p.updatedAt)||0;return(Number(h.createdAt)||Number(h.updatedAt)||0)-f}).forEach(p=>{const h=p._key||p.id;a.has(h)||(a.add(h),ue(p)?o.push(p):r.push(p))});const u=te(o),g=Math.min(r.length,45),e=r.slice(0,g),t=r.slice(g),l=te(e);return[...u,...l,...t]}function Ke(){}const ae="manzala_verified_showcase_v1";let P=null,C=[],I=0;const ke=[];function T(c=null){const s=document.getElementById("home-verified-cards-grid"),i=document.getElementById("home-verified-status-text");if(!s)return;let a=null;try{const g=localStorage.getItem(ae);if(g){const e=JSON.parse(g);Array.isArray(e)&&e.length>0&&(a=e)}}catch{}if(Array.isArray(c)&&c.length>0){const g=t=>!!(t&&(t.isVerified===!0||t.isVerified==="true"||t.isVerified===1||t.isVerified==="1"||t.is_verified===1||t.is_verified===!0||t.is_verified==="true"||t.is_verified==="1"||t.verificationStatus==="verified"||t.verification_status==="verified")&&(!t.verifiedUntil||Number(t.verifiedUntil)>Date.now())),e=c.filter(t=>g(t)&&!ge(t)).map(t=>{const l=(t.customCategory||t.custom_category||"").trim(),p=(t.categoryName||t.category_name||"").trim(),h=l&&!["other","\u0623\u062E\u0631\u0649","\u0639\u0627\u0645","\u0646\u0634\u0627\u0637 \u0639\u0627\u0645"].includes(l.toLowerCase())?l:p||t.categoryId||"\u0646\u0634\u0627\u0637 \u062A\u062C\u0627\u0631\u064A",f=Ce(t);return{...t,id:t.id||t._key,slug:t.slug||t.id,name:t.name,area:t.area||"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",address:t.address||"",phone:t.phone||"",whatsapp:t.whatsapp||"",logoUrl:f.logoFallback||"",coverImageUrl:f.cover||f.categoryCover||"",category:h,categoryName:h,customCategory:l,cover:f.cover||f.categoryCover||"",categoryCover:f.categoryCover||"",isSponsored:!!(t.isSponsored&&(!t.sponsoredUntil||t.sponsoredUntil>Date.now()))}});if(e.length>0){C=e;try{localStorage.setItem(ae,JSON.stringify(e))}catch{}}}else C.length||(a&&a.length>0?C=a:C=[...ke]);if(typeof window<"u"&&Array.isArray(C)){window._placesRegistry=window._placesRegistry||new Map;for(const g of C){if(!g)continue;const e=String(g.slug||g.id||"").toLowerCase().trim();e&&(window._placesRegistry.set(e,g),g.slug&&window._placesRegistry.set(String(g.slug).toLowerCase().trim(),g),g.id&&window._placesRegistry.set(String(g.id).toLowerCase().trim(),g))}}const o=["\u{1F947} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #1","\u{1F948} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #2","\u{1F949} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #3","\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #4"];function r(g){s.innerHTML=g.map((e,t)=>{const l=e.slug||e.id||"",p=we(e.categoryId||e.category||e.categoryName||""),h=e.coverImageUrl||e.cover||"",f=e.categoryCover||p.cover||"",m=h?`<img src="${n(h)}" alt="${n(e.name)}" loading="eager" fetchpriority="high" decoding="async" width="640" height="360"
             data-category-fallback="${n(f)}"
             onerror="if(!this.dataset.triedCdn&&this.src.includes('/api/r2/')){this.dataset.triedCdn='1';this.src='https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/'+this.src.split('/api/r2/')[1];}else if(!this.dataset.triedCat&&this.dataset.categoryFallback){this.dataset.triedCat='1';this.src=this.dataset.categoryFallback;}else{this.onerror=null;this.closest('.fair-place-card__cover')?.classList.remove('media-missing');this.outerHTML='<div class=\\'fair-place-card__cover-placeholder\\' style=\\'background:${p.gradient};display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;\\'><span>${p.icon}</span></div>';}">`:`<div class="fair-place-card__cover-placeholder" style="background:${p.gradient};display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;"><span>${p.icon}</span></div>`;return`
      <article class="fair-place-card" data-card-index="${t}"
               data-place-id="${n(e.id||"")}"
               data-place-slug="${n(l)}"
               data-name="${n(e.name||"")}"
               data-phone="${n(e.phone||"")}"
               data-whatsapp="${n(e.whatsapp||"")}"
               data-area="${n(e.area||"")}"
               data-address="${n(e.address||"")}"
               data-cover="${n(h)}"
               data-logo="${n(e.logoUrl||e.logo||"")}"
               data-category="${n(e.category||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${n(l)}', event) : (window.location.href='/place/${encodeURIComponent(l)}/')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(l)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(l)}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(l)}', this)"
               style="cursor:pointer">
        <span class="fair-place-card__rank">${o[t]||`\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #${t+1}`}</span>
        <div class="fair-place-card__cover">
          ${m}
          <div class="fair-place-card__badges">
            ${e.isSponsored?'<span class="fair-badge-sponsored">\u2B50 \u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632</span>':""}
            <span class="fair-badge-verified">\u2713 \u0645\u0648\u062B\u0642 \u0631\u0633\u0645\u064A\u0627\u064B</span>
          </div>
        </div>
        <div class="fair-place-card__body">
          <h3 class="fair-place-card__title" title="${n(e.name)}">${_(e.name)}</h3>
          <div class="fair-place-card__meta">
            <span>\u{1F4CD} ${_(e.area)}</span>
            <span>\u{1F3F7}\uFE0F ${_(e.category)}</span>
          </div>
          <a href="/place/${encodeURIComponent(l)}/" class="fair-place-card__link" onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${n(l)}', event) : (window.location.href='/place/${encodeURIComponent(l)}/')">\u0639\u0631\u0636 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0643\u0627\u0646 \u2197</a>
        </div>
      </article>
    `}).join("")}const d=C.length,u=[];for(let g=0;g<Math.min(4,d);g++)u.push(C[(I+g)%d]);if(r(u),P&&(clearInterval(P),P=null),d>=2){let g=1;P=setInterval(()=>{s.querySelectorAll(".fair-place-card").forEach(t=>t.classList.add("anim-swap")),setTimeout(()=>{I=(I+1)%C.length,g++;const t=[],l=C.length;for(let p=0;p<Math.min(4,l);p++)t.push(C[(I+p)%l]);r(t),i&&(i.innerHTML=`<b>\u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0635\u062F\u0627\u0631\u0629 \u0627\u0644\u0630\u0643\u064A (${g}):</b> \u0643\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0646\u0633\u0628\u0629 \u0638\u0647\u0648\u0631\u0647\u0627 \u0648\u062A\u0631\u062A\u064A\u0628\u0647\u0627 \u0648\u0627\u062D\u062F\u0629 \u0628\u0639\u062F\u0627\u0644\u0629 100% \u2728`)},300)},4500)}}function te(c){const s=[...c];for(let i=s.length-1;i>0;i--){const a=Math.floor(Math.random()*(i+1));[s[i],s[a]]=[s[a],s[i]]}return s}function z(c){const s=document.getElementById("latest-places-grid");if(s){if(!c||!c.length){if(s.querySelector(".fair-place-card")||s.querySelector(".place-card"))return;s.innerHTML=`
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">\u{1F3EA}</div>
        <p class="empty-state__text">\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0645\u0627\u0643\u0646 \u0645\u0633\u062C\u0644\u0629 \u0628\u0639\u062F</p>
        <a href="dashboard.html?section=add" class="btn btn-primary btn-sm" style="margin-top:1rem">\u0623\u0636\u0641 \u0623\u0648\u0644 \u0645\u0643\u0627\u0646</a>
      </div>
    `;return}s.innerHTML=c.map(i=>me(i)).join("")}}function ie(c){const s=document.getElementById("offers-scroll"),i=document.getElementById("offers-section");if(s){if(!c||!c.length){s.querySelector(".offer-card")||i&&(i.style.display="none");return}i&&(i.style.display=""),s.innerHTML=c.map(a=>{const o=a.discountPercent||fe(a.oldPrice,a.newPrice),r=be(a.endDate);return`
      <article class="offer-card"
               data-place-slug="${n(a.placeSlug||"")}"
               data-name="${n(a.placeName||a.title||"")}"
               data-cover="${n(a.imageUrl||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${n(a.placeSlug||"")}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(a.placeSlug||"")}')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(a.placeSlug||"")}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(a.placeSlug||"")}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(a.placeSlug||"")}', this)"
               style="cursor:pointer">
        <div class="offer-card__image">
          ${a.imageUrl?`<img src="${n(a.imageUrl)}" alt="${n(a.title)}" loading="lazy" />`:'<div style="width:100%;height:100%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:2rem">\u{1F3F7}\uFE0F</div>'}
          ${o>0?`<span class="offer-card__discount-badge">-${o}%</span>`:""}
        </div>
        <div class="offer-card__body">
          <h3 class="offer-card__title">${_(a.title)}</h3>
          ${a.placeName?`<div class="offer-card__place">\u{1F4CD} ${_(a.placeName)}</div>`:""}
          ${a.newPrice?`
          <div class="offer-card__price">
            <span class="offer-card__price-new">${Y(a.newPrice)}</span>
            ${a.oldPrice?`<span class="offer-card__price-old">${Y(a.oldPrice)}</span>`:""}
          </div>
          `:""}
          <div class="offer-card__expiry">
            \u23F0 ${r>0?`\u064A\u0646\u062A\u0647\u064A \u062E\u0644\u0627\u0644 ${r} \u064A\u0648\u0645`:"\u064A\u0646\u062A\u0647\u064A \u0627\u0644\u064A\u0648\u0645"}
          </div>
        </div>
      </article>
    `}).join("")}}function Le(c){const s=document.getElementById("delivery-grid"),i=document.getElementById("delivery-section");if(s){if(!c||!c.length){s.querySelector(".delivery-card")||i&&(i.style.display="none");return}i&&(i.style.display=""),s.innerHTML=c.slice(0,8).map(a=>{const o=a.slug||a._key||a.id||"",r=xe(a),d=a.area?` \u2022 ${_(a.area)}`:" \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629";return`
    <a href="/place/${encodeURIComponent(o)}/" class="delivery-card"
       style="--vehicle-color: ${r.color}; --vehicle-bg: ${r.bgColor}; --vehicle-border: ${r.borderColor}; --vehicle-glow: ${r.glowColor};"
       data-place-id="${n(a.id||a._key||"")}"
       data-place-slug="${n(o)}"
       data-name="${n(a.name||"")}"
       data-phone="${n(a.phone||"")}"
       data-whatsapp="${n(a.whatsapp||"")}"
       data-area="${n(a.area||"")}"
       data-cover="${n(a.coverImageUrl||"")}"
       data-logo="${n(a.logoUrl||"")}"
       onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${n(o)}', event) : (window.location.href='/place/${encodeURIComponent(o)}/')"
       ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(o)}', this)"
       onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(o)}', this)"
       onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(o)}', this)">
      <div class="delivery-card__icon" aria-label="${r.name}">
        <span class="delivery-card__emoji" aria-hidden="true">${r.icon}</span>
      </div>
      <div class="delivery-card__info">
        <div class="delivery-card__name">${_(a.name)}</div>
        <div class="delivery-card__type">
          <span class="delivery-card__type-tag" style="color: ${r.color}; font-weight: 700;">${r.label}</span>
          <span class="delivery-card__type-area">${d}</span>
        </div>
      </div>
    </a>
  `}).join("")}}function $e(c){const s=document.getElementById("ads-container");if(!s||!c||!c.length)return;const i=c.filter(a=>a&&(a.imageUrl||a.image_url));if(!i.length){s.innerHTML="";return}s.innerHTML=i.map(a=>{let o=(a.link||"#").trim();o.startsWith("place.html")&&(o="/"+o);const r=a.id||a._id||"",d=a.title||"\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632",u=a.imageUrl||a.image_url||"";return`
      <a href="${n(o)}" class="ad-banner" target="_blank" rel="noopener noreferrer sponsored" aria-label="${n(d)}" data-ad-id="${n(r)}">
        <span class="ad-banner__label" aria-label="\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632">
          <span class="ad-banner__star" aria-hidden="true">\u2B50</span>
          <span class="ad-banner__text">\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632</span>
        </span>
        <img src="${n(u)}" alt="${n(d)}" loading="lazy" decoding="async"
             width="800" height="420" style="aspect-ratio:16/7;" />
      </a>
    `}).join(""),s.querySelectorAll(".ad-banner").forEach(a=>{a.addEventListener("click",()=>{const o=a.getAttribute("data-ad-id");if(o&&K)try{fetch(`${K}/api/ads/track-click`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o}),keepalive:!0}).catch(()=>{})}catch{}})})}class Se{constructor(){this.ctx=null,this.lastTickTime=0}init(){if(!this.ctx&&typeof window<"u"){const s=window.AudioContext||window.webkitAudioContext;s&&(this.ctx=new s)}}playTick(s=550){try{if(!this.ctx||this.ctx.state!=="running")return;const i=this.ctx.currentTime;if(i-this.lastTickTime<.038)return;this.lastTickTime=i;const a=this.ctx.createOscillator(),o=this.ctx.createGain();a.type="sine",a.frequency.setValueAtTime(s,i),a.frequency.exponentialRampToValueAtTime(s*1.35,i+.018),o.gain.setValueAtTime(.04,i),o.gain.exponentialRampToValueAtTime(1e-4,i+.022),a.connect(o),o.connect(this.ctx.destination),a.start(i),a.stop(i+.028)}catch{}}playDoneChime(){try{if(!this.ctx||this.ctx.state!=="running")return;const s=this.ctx.currentTime;[1046.5,1318.51,1567.98,2093].forEach((a,o)=>{const r=this.ctx.createOscillator(),d=this.ctx.createGain();r.type="triangle",r.frequency.setValueAtTime(a,s+o*.055),d.gain.setValueAtTime(.06,s+o*.055),d.gain.exponentialRampToValueAtTime(1e-4,s+o*.055+.32),r.connect(d),d.connect(this.ctx.destination),r.start(s+o*.055),r.stop(s+o*.055+.35)})}catch{}}}const E=new Se;function re(){const c=document.getElementById("stats-bar");c&&(c.innerHTML=`
    <div class="stats-bar__inner container">
      <div class="stats-bar__item stats-interactive-item" title="\u062F\u0644\u064A\u0644 \u0645\u062D\u0644\u064A \u0645\u062A\u062C\u062F\u062F \u0644\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A">
        <div class="stats-bar__value">\u062F\u0644\u064A\u0644 \u0645\u062A\u062C\u062F\u062F</div>
        <div class="stats-bar__label">\u0623\u0645\u0627\u0643\u0646 \u0648\u0623\u0646\u0634\u0637\u0629 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u062D\u0644\u064A\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0628\u062D\u062B \u0645\u062D\u0644\u064A \u0633\u0631\u064A\u0639 \u0639\u0646 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A">
        <div class="stats-bar__value">\u0628\u062D\u062B \u0630\u0643\u064A</div>
        <div class="stats-bar__label">\u0627\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u062A\u062E\u0635\u0635 \u0623\u0648 \u0627\u0644\u062E\u062F\u0645\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u062A\u063A\u0637\u064A\u0629 \u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629">
        <div class="stats-bar__value">\u062A\u063A\u0637\u064A\u0629 \u0645\u062D\u0644\u064A\u0629</div>
        <div class="stats-bar__label">\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0644\u064A\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u062D\u062F\u064A\u062B">
        <div class="stats-bar__value">\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062A\u062C\u062F\u062F\u0629</div>
        <div class="stats-bar__label">\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0646\u0634\u0627\u0637 \u0648\u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u062A\u0648\u0627\u0635\u0644</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629">
        <div class="stats-bar__value">\u0648\u0635\u0648\u0644 \u0645\u0628\u0627\u0634\u0631</div>
        <div class="stats-bar__label">\u0627\u062A\u0635\u0627\u0644 \u0648\u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u0627\u062A\u062C\u0627\u0647\u0627\u062A</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A">
        <div class="stats-bar__value stats-text-badge">\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629</div>
        <div class="stats-bar__label">\u0645\u062D\u0627\u0641\u0638\u0629 \u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629</div>
      </div>
    </div>
  `)}function Ye(c){let s=!1,i=!1;function a(){if(i)return;i=!0;const o=c.querySelectorAll(".stats-bar__value[data-target]");if(!o.length){i=!1;return}const r=1800,d=performance.now();o.forEach(e=>{e.classList.remove("stats-done"),e.classList.add("stats-counting")});let u=-1;function g(e){const t=e-d,l=Math.min(1,t/r),p=1-Math.pow(1-l,3);o.forEach(h=>{const f=parseInt(h.getAttribute("data-target"),10)||0,m=h.getAttribute("data-prefix")||"",b=h.getAttribute("data-suffix")||"",k=Math.floor(p*f);if(h.textContent=`${m}${k.toLocaleString("en-US")}${b}`,k!==u){u=k;const w=420+k/Math.max(1,f)*430;E.playTick(w)}}),l<1?requestAnimationFrame(g):(o.forEach(h=>{const f=parseInt(h.getAttribute("data-target"),10)||0,m=h.getAttribute("data-prefix")||"",b=h.getAttribute("data-suffix")||"";h.textContent=`${m}${f.toLocaleString("en-US")}${b}`,h.classList.remove("stats-counting"),h.classList.add("stats-done")}),E.playDoneChime(),i=!1)}requestAnimationFrame(g)}if("IntersectionObserver"in window){const o=new IntersectionObserver(r=>{r.forEach(d=>{d.isIntersecting&&!s&&(s=!0,a(),o.disconnect())})},{threshold:.15});o.observe(c)}else a();c.querySelectorAll(".stats-interactive-item").forEach(o=>{o.addEventListener("click",()=>{E.init(),E.ctx&&E.ctx.state==="suspended"&&E.ctx.resume().catch(()=>{}),a()})})}function se(c){const s=document.getElementById("hero-search-glow-wrap"),i=document.getElementById("hero-search-input"),a=document.getElementById("hero-search-btn"),o=document.getElementById("hero-search-clear"),r=document.getElementById("hero-live-dropdown");if(!i)return;r&&!document.getElementById("hero-live-list")&&(r.innerHTML=`
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
    `);const d=document.getElementById("hero-live-list"),u=document.getElementById("hero-live-count"),g=document.getElementById("hero-live-all-btn"),e=document.getElementById("hero-quick-cats");e&&Array.isArray(c)&&c.length>0&&(e.innerHTML=c.slice(0,10).map(m=>{const b=m.slug||m._key||m.id||"",k=ee(b||m.name,18);return`
        <a href="category.html?slug=${encodeURIComponent(b)}" class="hero__quick-cat">
          ${k||m.icon||"\u{1F3EA}"} ${_(m.name)}
        </a>
      `}).join(""));function t(){const m=i.value.trim();m&&(window.location.href=`search.html?q=${encodeURIComponent(m)}`)}a?.addEventListener("click",m=>{m.stopPropagation(),t()}),i.addEventListener("keydown",m=>{m.key==="Enter"?t():m.key==="Escape"&&r?.classList.remove("visible")}),o?.addEventListener("click",m=>{m.stopPropagation(),i.value="",o.classList.remove("visible"),r?.classList.remove("visible"),d&&(d.innerHTML=""),i.focus()});function l(){!r||!d||(u&&(u.textContent="\u0645\u0642\u062A\u0631\u062D\u0627\u062A"),d.innerHTML=`
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
    `,d.querySelectorAll(".hero-live-suggestion-chip").forEach(m=>{m.addEventListener("click",b=>{b.preventDefault(),b.stopPropagation();const k=m.getAttribute("data-q")||"";i.value=k,i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus()})}),r.classList.add("visible"))}i.addEventListener("focus",()=>{i.value.trim().length>=1&&d?.children.length>0?r?.classList.add("visible"):i.value.trim()||l()}),i.addEventListener("click",()=>{i.value.trim()||l()});let p=null,h=0;i.addEventListener("input",()=>{const m=i.value.trim();if(o?.classList.toggle("visible",m.length>0),g&&(g.href=`search.html?q=${encodeURIComponent(m)}`),!m){r?.classList.remove("visible"),d&&(d.innerHTML="");return}const b=m.length<=2?0:35;clearTimeout(p),p=setTimeout(async()=>{const k=++h;try{let D=function(y,v){if(!y)return"";if(!v)return _(y);const $=v.trim().split(/\s+/).filter(Boolean);if(!$.length)return _(y);const B=$.map(L=>L.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),A=new RegExp(`(${B.join("|")})`,"gi");return _(y).replace(A,'<span class="search-highlight">$1</span>')};const w=await _e(m,{limit:6});if(k!==h||!r||!d)return;if(!w||w.length===0){u&&(u.textContent="0"),d.innerHTML=`
            <div class="hero-live-empty">
              <div class="hero-live-empty__icon">\u{1F50D}</div>
              <div class="hero-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="hero-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,r.classList.add("visible");return}u&&(u.textContent=String(w.length));let V="";w.matchingCategories&&w.matchingCategories.length>0&&(V=`
            <div class="hero-live-matched-cats">
              <span class="hero-live-matched-cats__label">\u26A1 \u0623\u0642\u0633\u0627\u0645 \u0645\u0637\u0627\u0628\u0642\u0629:</span>
              <div class="hero-live-matched-cats__chips">
                ${w.matchingCategories.map(y=>{const v=y.slug||y.id||"",$=ee(v||y.name,16);return`
                    <a href="category.html?slug=${encodeURIComponent(v)}" class="hero-live-matched-cat-chip" onclick="event.stopPropagation()">
                      ${$||y.icon||"\u{1F3EA}"}
                      <span>${_(y.name)}</span>
                    </a>
                  `}).join("")}
              </div>
            </div>
          `),d.innerHTML=V+w.map(y=>{const v=y.raw||y,$=v.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",B=v.categoryName||y.category||"",A=v.area||v.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",L=v.slug||v.id||"",M=v.photoURL||v.logo||v.coverURL||v.coverImageUrl||v.logoUrl||"",ce=v.isVerified||!1,N=v.isOpen!==void 0?v.isOpen:!0,Z=($.trim()[0]||"\u0645").toUpperCase(),j=(v.phone||"").trim(),O=(v.whatsapp||v.phone||"").trim(),S=O?O.replace(/[^0-9]/g,""):"",H=S?S.startsWith("2")?S:S.startsWith("0")?"2"+S:"20"+S:"";let W="";if((j||H)&&(W=`
              <div class="hero-live-actions" onclick="event.stopPropagation()">
                ${j?`
                  <a href="tel:${n(j)}" class="hero-live-action-btn hero-live-action-btn--call" title="\u0627\u062A\u0635\u0627\u0644 \u0647\u0627\u062A\u0641\u064A \u0645\u0628\u0627\u0634\u0631" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span class="action-btn-text">\u0627\u062A\u0635\u0627\u0644</span>
                  </a>
                `:""}
                ${H?`
                  <a href="https://wa.me/${n(H)}" target="_blank" rel="noopener" class="hero-live-action-btn hero-live-action-btn--wa" title="\u0645\u062D\u0627\u062F\u062B\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0641\u0648\u0631\u064A\u0629" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.35-.49.07-1.12.1-3.26-.79-2.73-1.14-4.5-3.89-4.63-4.07-.14-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36.002.52.01.17.01.39-.06.61.47.24.58.8 1.95.87 2.09.07.15.12.32.02.52-.09.21-.14.33-.29.5-.14.17-.3.38-.43.51-.15.15-.3.32-.13.62.18.3.78 1.29 1.68 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.79.84 2.1 1 .3.15.51.23.58.36.08.13.08.76-.16 1.43z"/></svg>
                    <span class="action-btn-text">\u0648\u0627\u062A\u0633\u0627\u0628</span>
                  </a>
                `:""}
              </div>
            `),typeof window<"u"&&window._placesRegistry&&L){const le=String(L).toLowerCase().trim();window._placesRegistry.set(le,v),v.slug&&window._placesRegistry.set(String(v.slug).toLowerCase().trim(),v),v.id&&window._placesRegistry.set(String(v.id).toLowerCase().trim(),v)}return`
            <a href="/place.html?slug=${encodeURIComponent(L)}" class="hero-live-dropdown__item" role="option"
               data-place-id="${n(v.id||L)}"
               data-place-slug="${n(L)}"
               data-name="${n($)}"
               data-phone="${n(v.phone||"")}"
               data-whatsapp="${n(v.whatsapp||"")}"
               data-area="${n(A)}"
               data-address="${n(v.address||"")}"
               data-cover="${n(v.coverImageUrl||M)}"
               data-logo="${n(v.logoUrl||M)}"
               data-category="${n(B)}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${n(L)}', event) : null"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(L)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(L)}', this)">
              <div class="hero-live-avatar">
                ${M?`<img src="${n(M)}" alt="${n($)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'hero-live-avatar-fallback\\'>${Z}</div>'"/>`:`<div class="hero-live-avatar-fallback">${Z}</div>`}
              </div>
              <div class="hero-live-content">
                <div class="hero-live-title-row">
                  <span class="hero-live-name">${D($,m)}</span>
                  ${ce?'<span class="hero-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="hero-live-meta-row">
                  ${B?`<span class="hero-live-cat">${D(B,m)}</span>`:""}
                  <span class="hero-live-area">${_(A)}</span>
                  <span class="${N?"hero-live-status-open":"hero-live-status-closed"}">
                    ${N?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
              ${W}
            </a>
          `}).join(""),r.classList.add("visible")}catch(w){console.warn("[HeroLiveSearch] error:",w)}},b)}),document.addEventListener("click",m=>{s?.contains(m.target)||r?.classList.remove("visible")}),document.getElementById("hero-voice-trigger-btn")?.addEventListener("click",m=>{m.preventDefault(),m.stopPropagation(),ye()})}function Xe(){const c=document.getElementById("villages-filter-input"),s=document.querySelectorAll(".village-grid-item");!c||!s.length||c.addEventListener("input",()=>{const i=c.value.trim();s.forEach(a=>{const o=a.getAttribute("data-name")||"",r=a.textContent||"",d=!i||X(o,i)||X(r,i);a.style.display=d?"flex":"none"})})}let U=null;function oe(){if(typeof window>"u")return;U&&clearTimeout(U);const c=document.getElementById("typewriter-part-1"),s=document.getElementById("typewriter-part-2"),i=document.getElementById("typewriter-part-3");if(!c||!s||!i)return;const a="\u0641\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",o=" \u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",r=["\u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0645\u0647\u0631 \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648\u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u062D\u0644\u0627\u062A\u060C \u0627\u0644\u0645\u0637\u0627\u0639\u0645\u060C \u0648\u0627\u0644\u0643\u0627\u0641\u064A\u0647\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0644\u062D\u0631\u0641\u064A\u064A\u0646: \u0633\u0628\u0627\u0643\u060C \u0646\u062C\u0627\u0631\u060C \u0643\u0647\u0631\u0628\u0627\u0626\u064A\u060C \u0648\u0646\u0642\u0627\u0634","\u0623\u0642\u0648\u0649 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062D\u0635\u0631\u064A\u0629 \u0648\u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629"];c.textContent=a,s.textContent=o,i.textContent||(i.textContent=r[0]);let d=!1;const u=l=>new Promise(p=>{U=setTimeout(p,l)});async function g(l,p,h=50){for(let f=0;f<p.length;f++){if(d)return;l.textContent+=p[f];const m=Math.floor(Math.random()*25);await u(h+m)}}async function e(l,p=null,h=25){const f=l.textContent,m=p!==null?p:f.length;for(let b=0;b<m;b++){if(d)return;l.textContent=f.slice(0,f.length-1-b),await u(h)}}async function t(){await u(3500);let l=0;for(;!d;){await e(i,null,18),await u(250),l++;const p=r[l%r.length];await g(i,p,38),await u(4e3)}}t().catch(()=>{})}function ne(){const c=[{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629",icon:"\u{1F3D9}\uFE0F",desc:"\u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0648\u0627\u0644\u0645\u0631\u0643\u0632"},{name:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629",icon:"\u{1F30A}",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0645\u062C\u0644\u0633 \u0642\u0631\u0648\u064A \u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629"},{name:"\u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629"},{name:"\u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A",icon:"\u{1F40E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A"},{name:"\u0627\u0644\u0628\u0635\u0631\u0627\u0637",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u0627\u0637"},{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3E2}",desc:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u064A\u062A \u0634\u0631\u064A\u0641",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u0634\u0631\u064A\u0641"},{name:"\u0627\u0644\u0639\u0627\u0645\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0627\u0645\u0631\u0629"},{name:"\u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629"},{name:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C"},{name:"\u0645\u064A\u062A \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u062E\u0636\u064A\u0631"},{name:"\u0627\u0644\u0639\u0632\u064A\u0632\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0632\u064A\u0632\u0629"},{name:"\u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645",icon:"\u{1F54A}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645"},{name:"\u0627\u0644\u0634\u0628\u0648\u0644",icon:"\u{1F30A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0628\u0648\u0644"},{name:"\u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629"},{name:"\u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629",icon:"\u{1F333}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645"},{name:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632",icon:"\u{1F34C}",desc:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632"},{name:"\u0627\u0644\u062D\u0648\u062A\u0629",icon:"\u{1F41F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062D\u0648\u062A\u0629"},{name:"\u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629"},{name:"\u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C"},{name:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631",icon:"\u2728",desc:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631"},{name:"\u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629"},{name:"\u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627"},{name:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627",icon:"\u{1F33E}",desc:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627"},{name:"\u0627\u0644\u0642\u0637\u0634\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0637\u0634\u0629"},{name:"\u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629",icon:"\u{1F525}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629"},{name:"\u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629",icon:"\u{1F9F1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629"},{name:"\u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629",icon:"\u{1F42A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629"},{name:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631",icon:"\u{1F331}",desc:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631"},{name:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642",icon:"\u{1F6E3}\uFE0F",desc:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642"},{name:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F30A}",desc:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0627\u0644\u062C\u0648\u0627\u0628\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0648\u0627\u0628\u0631"},{name:"\u0627\u0644\u0645\u0648\u0627\u062C\u062F",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u0648\u0627\u062C\u062F"},{name:"\u0627\u0644\u0636\u0647\u064A\u0631",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0636\u0647\u064A\u0631"},{name:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631",icon:"\u{1F333}",desc:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631"},{name:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631"},{name:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633",icon:"\u{1F33E}",desc:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633"},{name:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646",icon:"\u{1F33A}",desc:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646"},{name:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629"},{name:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639",icon:"\u26FA",desc:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639"},{name:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A",icon:"\u26CF\uFE0F",desc:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A"},{name:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A",icon:"\u{1F6E1}\uFE0F",desc:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A"},{name:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629",icon:"\u{1F6E3}\uFE0F",desc:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629"},{name:"\u0627\u0644\u0645\u062B\u0644\u062B",icon:"\u{1F53A}",desc:"\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u062B\u0644\u062B"},{name:"\u0627\u0644\u0645\u062C\u0627\u064A\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062C\u0627\u064A\u0631"},{name:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F",icon:"\u{1F686}",desc:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F"},{name:"\u0627\u0644\u0642\u0628\u0644\u064A\u0629",icon:"\u{1F9ED}",desc:"\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0642\u0628\u0644\u064A\u0629"}];return`
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
          <a class="command-card" href="qibla.html" aria-label="\u0628\u0648\u0635\u0644\u0629 \u0627\u0644\u0642\u0628\u0644\u0629">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">\u{1F9ED}</span>
            <span class="command-card__body"><strong>\u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u0642\u0628\u0644\u0629</strong><small>\u0628\u0648\u0635\u0644\u0629 3D \u0644\u0644\u0643\u0639\u0628\u0629 \u0627\u0644\u0645\u0634\u0631\u0641\u0629</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--job-seekers" href="job-seekers.html" aria-label="\u0628\u0627\u062D\u062B \u0639\u0646 \u0639\u0645\u0644">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">\u{1F4BC}</span>
            <span class="command-card__body"><strong>\u0628\u0627\u062D\u062B \u0639\u0646 \u0639\u0645\u0644</strong><small>\u0627\u0628\u062D\u062B \u0639\u0646 \u0641\u0631\u0635\u0629 \u0639\u0645\u0644 \u062A\u0646\u0627\u0633\u0628 \u0645\u0647\u0646\u062A\u0643 \u0648\u062E\u0628\u0631\u062A\u0643</small></span><span class="command-card__arrow">\u2190</span>
          </a>
          <a class="command-card command-card--jobs" href="jobs.html" aria-label="\u0648\u0638\u064A\u0641\u0629 \u0645\u062A\u0627\u062D\u0629">
            <span class="command-card__orb"></span><span class="command-card__icon" aria-hidden="true">\u{1F4E2}</span>
            <span class="command-card__body"><strong>\u0648\u0638\u064A\u0641\u0629 \u0645\u062A\u0627\u062D\u0629</strong><small>\u0648\u0638\u0627\u0626\u0641 \u0648\u0641\u0631\u0635 \u0639\u0645\u0644 \u0645\u062A\u0627\u062D\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629</small></span><span class="command-card__arrow">\u2190</span>
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

    <!-- Verified Places Showcase Section (\u0623\u0645\u0627\u0643\u0646 \u0645\u0648\u062B\u0642\u0629 \u0648\u0645\u062D\u062F\u062B\u0629 \u0628\u0627\u0633\u062A\u0645\u0631\u0627\u0631) -->
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
              \u0623\u0645\u0627\u0643\u0646 \u0623\u0643\u0645\u0644\u062A \u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u0648\u0628\u064A\u0627\u0646\u0627\u062A\u0647\u0627 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629\u060C \u0645\u0639 \u0639\u0631\u0636 \u0645\u062A\u062C\u062F\u062F \u0644\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0645\u0648\u062B\u0642\u0629.
            </p>
          </div>
          <a href="places.html?filter=verified" class="section-link">\u0643\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0645\u0648\u062B\u0642\u0629 \u2190</a>
        </div>

        <div class="home-verified-box">
          <div class="home-verified-subbar">
            <div class="home-verified-status">
              <span class="home-verified-dot"></span>
              <span id="home-verified-status-text">\u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0635\u062F\u0627\u0631\u0629 \u0627\u0644\u0630\u0643\u064A: \u0643\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0646\u0633\u0628\u0629 \u0638\u0647\u0648\u0631\u0647\u0627 \u0648\u062A\u0631\u062A\u064A\u0628\u0647\u0627 \u0648\u0627\u062D\u062F\u0629 \u0628\u0639\u062F\u0627\u0644\u0629 100% \u2728</span>
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
          ${Array(4).fill(he()).join("")}
        </div>
        <div class="show-more">
          <a href="places.html" class="btn btn-outline btn-lg">\u0639\u0631\u0636 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646</a>
        </div>
      </div>
    </section>

    <!-- Local Blog Section -->
<section class="section" id="home-blog-section" style="display:none"><div class="container"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6);gap:12px;flex-wrap:wrap"><div><h2 class="section-title">\u{1F4DD} \u0645\u0646 \u0645\u062F\u0648\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629</h2><p style="margin:0;color:var(--text-muted);font-size:13px">\u0645\u0642\u0627\u0644\u0627\u062A \u0645\u0641\u064A\u062F\u0629 \u064A\u0643\u062A\u0628\u0647\u0627 \u0623\u0635\u062D\u0627\u0628 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0639\u0646 \u062E\u062F\u0645\u0627\u062A\u0647\u0645 \u0648\u0623\u0639\u0645\u0627\u0644\u0647\u0645.</p></div><a href="/blog/" class="section-link">\u0643\u0644 \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A \u2190</a></div><div class="blog-grid" id="home-blog-grid"></div></div></section>

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

    <!-- Job Board Feed (\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0639\u0645\u0644 \u0648\u0648\u0638\u0627\u0626\u0641 \u0645\u062A\u0627\u062D\u0629) -->
    <section class="section" id="home-job-board-section" style="background:var(--surface-2);padding-block:var(--space-10)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6);flex-wrap:wrap;gap:12px">
          <div>
            <h2 class="section-title" style="margin-bottom:4px">
              <span>\u{1F4BC}</span> \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0639\u0645\u0644 \u0648\u0648\u0638\u0627\u0626\u0641 \u0645\u062A\u0627\u062D\u0629
            </h2>
            <p style="margin:0;font-size:13px;color:var(--text-muted)">
              \u0641\u0631\u0635 \u0639\u0645\u0644 \u0648\u0643\u0648\u0627\u062F\u0631 \u0645\u062D\u0644\u064A\u0629 \u0645\u062A\u062C\u062F\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0628\u062A\u0643\u0627\u0641\u0624 \u0627\u0644\u0641\u0631\u0635 \u0641\u064A \u0627\u0644\u0639\u0631\u0636
            </p>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <a href="job-seekers.html" class="btn btn-sm" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:12px;font-weight:700;text-decoration:none">
              <span>\u0637\u0627\u0644\u0628\u064A\u0646 \u0639\u0645\u0644 \u21A4</span>
            </a>
            <a href="jobs.html" class="btn btn-sm" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:12px;font-weight:700;text-decoration:none">
              <span>\u0648\u0638\u0627\u0626\u0641 \u0634\u0627\u063A\u0631\u0629 \u21A4</span>
            </a>
          </div>
        </div>
        <div class="home-jb-grid" id="home-job-board-grid">
          <div style="grid-column:1/-1;text-align:center;padding:24px 0">
            <div class="spinner spinner-sm"></div>
          </div>
        </div>
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
  `}function _(c){return c?String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function n(c){return c?String(c).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function Ee(){try{let o=function(){try{localStorage.setItem("__has_seen_welcome_video_v1","true")}catch{}i&&i.pause(),s.style.opacity="0";const r=s.querySelector(".first-visit-video-card");r&&(r.style.transform="scale(0.92)"),setTimeout(()=>{s&&s.parentNode&&s.parentNode.removeChild(s)},350)};return}catch(c){console.warn("[Welcome Video] error:",c)}}
