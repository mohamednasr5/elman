import{getCategories as de,getPublishedPlaces as G,getActiveOffers as Q,getAds as pe,getCached as C,FALLBACK_CATEGORIES as J}from"../../core/db.js";import{WORKER_URL as K}from"../../core/firebase.js";import"../../core/state.js";import{renderPlaceCard as me,renderPlaceCardSkeleton as he}from"../components/PlaceCard.js?v=20260923_04";import{isAtmPlace as ge}from"../../utils/atm.js";import{mountSponsoredShowcase as ve,isPlaceSponsored as ue}from"../components/SponsoredShowcase.js";import{formatPrice as Y,calcDiscount as fe,arabicMatch as X}from"../../utils/arabic.js";import{daysUntil as be}from"../../utils/date.js";import{getCurrentUser as q}from"../../core/auth.js";import{openManzalaVoiceAssistantModal as ye}from"../../services/voice.service.js";import{executeFastSearch as _e,warmupSearchEngine as F}from"../../services/search-engine.service.js";import{getCategorySvg as ee}from"../../utils/professions-data.js";import{getCategoryVisualMeta as we}from"../../utils/category-visual.js";import{resolveDeliveryVehicle as xe}from"../../utils/delivery-vehicle.js";import{resolvePlaceMedia as Ce}from"../../utils/category-assets.js?v=20260923_04";const Je={pharmacy:{emoji:"\u{1F48A}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},supermarket:{emoji:"\u{1F6D2}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},paint:{emoji:"\u{1F3A8}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},herbs:{emoji:"\u{1F33F}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},doctor:{emoji:"\u{1F468}\u200D\u2695\uFE0F",color:"rgba(41,128,185,0.1)",border:"#2980B9"},plumbing:{emoji:"\u{1F527}",color:"rgba(52,73,94,0.1)",border:"#52596E"},plumber:{emoji:"\u{1FAA0}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpenter:{emoji:"\u{1FA9A}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},tiler:{emoji:"\u{1F9F1}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},painter:{emoji:"\u{1F58C}\uFE0F",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},electrician:{emoji:"\u26A1",color:"rgba(243,156,18,0.1)",border:"#F39C12"},"ac-technician":{emoji:"\u2744\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},blacksmith:{emoji:"\u{1F6E0}\uFE0F",color:"rgba(52,73,94,0.1)",border:"#52596E"},alumital:{emoji:"\u{1FA9F}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},mechanic:{emoji:"\u{1F529}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},upholsterer:{emoji:"\u{1F6CB}\uFE0F",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},feed:{emoji:"\u{1F33E}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},poultry:{emoji:"\u{1F357}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},bakery:{emoji:"\u{1F35E}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},vegetables:{emoji:"\u{1F96C}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},antiques:{emoji:"\u{1F3FA}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},electronics:{emoji:"\u{1F4FA}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpet:{emoji:"\u{1F9F6}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},mattress:{emoji:"\u{1F6CF}\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},china:{emoji:"\u{1F37D}\uFE0F",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},electrical:{emoji:"\u{1F4A1}",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},roastery:{emoji:"\u{1F95C}",color:"rgba(101,67,33,0.1)",border:"#654321"},phones:{emoji:"\u{1F4F1}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},grocery:{emoji:"\u{1F3EA}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},hypermarket:{emoji:"\u{1F3EC}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"},delivery:{emoji:"\u{1F680}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"}},Ke={emoji:"\u{1F3EA}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"};export async function renderHomePage(l,{user:s}={}){const r=document.getElementById("hero-section-static");if(!!!r)l.innerHTML=oe(),ne();else{r.removeAttribute("id");const e=[];let a=r.nextSibling;for(;a;)e.push(a),a=a.nextSibling;e.forEach(m=>m.parentNode&&m.parentNode.removeChild(m));const c=document.createElement("div");c.innerHTML=oe();const p=c.querySelector(".hero");if(p){if(!r.querySelector(".hero-heritage-decor")){const m=p.querySelector(".hero-heritage-decor");m&&r.insertAdjacentElement("afterbegin",m)}p.remove()}for(;c.firstChild;)l.appendChild(c.firstChild);ne()}j();try{const e=C("categories_all"),a=C("published_100_");if(Array.isArray(e)&&e.length>0&&se(e),Array.isArray(a)&&a.length>0){const c=q()||s;j(a);const p=z(a,c?.uid);U(p.slice(0,8)),ie(a.length,e?.length||31),F(a,e||[])}}catch{}let n=[],i=[],d=[],u=[];try{const[e,a,c,p]=await Promise.allSettled([de(),G({limit:100}),Q(8),pe("homepage")]);n=e.status==="fulfilled"&&Array.isArray(e.value)&&e.value.length?e.value:C("categories_all")||J||[],i=a.status==="fulfilled"&&Array.isArray(a.value)&&a.value.length?a.value:C("published_100_")||[],d=c.status==="fulfilled"&&Array.isArray(c.value)?c.value:C("offers_active_8")||[],u=p.status==="fulfilled"&&Array.isArray(p.value)?p.value:C("ads_homepage")||[]}catch(e){console.warn("[Home] Data load non-fatal warning:",e),n=C("categories_all")||J||[],i=C("published_100_")||[],d=C("offers_active_8")||[],u=C("ads_homepage")||[]}const g=q()||s;if(typeof window<"u"&&Array.isArray(i)&&i.length>0){window._placesRegistry=window._placesRegistry||new Map;for(const e of i){if(!e)continue;const a=String(e.slug||e.id||e._key||"").toLowerCase().trim();a&&(window._placesRegistry.set(a,e),e.id&&window._placesRegistry.set(String(e.id).toLowerCase().trim(),e),e.slug&&window._placesRegistry.set(String(e.slug).toLowerCase().trim(),e))}}try{j(i)}catch(e){console.warn("[Home] initHomeVerifiedShowcase err:",e)}try{const e=z(i,g?.uid);U(e.slice(0,8))}catch(e){console.warn("[Home] renderLatestPlaces err:",e)}try{d&&d.length&&re(d)}catch(e){console.warn("[Home] renderOffers err:",e)}try{const e=(i||[]).filter(a=>{if(!a)return!1;if(a.deliveryType||a.categoryId?.includes("delivery"))return!0;const c=String(a.name||"").toLowerCase();return/توكتوك|تاكسي|شانجي|اتوبيس|توصيل|دليفري|وصلي/i.test(c)?!/صيدلية|مطعم|كشري|حلواني|سوبر\s*ماركت|هايبر/i.test(c):!1});e.length&&Le(e)}catch(e){console.warn("[Home] renderDeliveryServices err:",e)}try{u&&u.length&&ke(u)}catch(e){console.warn("[Home] renderAds err:",e)}try{ie(i.length||0,n?.length||31)}catch{}try{F(i,n||[])}catch{}try{se(n||[])}catch{}Promise.resolve().then(()=>{try{import("../components/WhoIsAvailableNow.js").then(({renderWhoIsAvailableNow:e})=>{const a=document.getElementById("home-oncall-craftsmen-container");a&&e(a)}).catch(e=>console.warn("[Home] WhoIsAvailableNow load err:",e))}catch{}try{import("../components/ServiceRequestsSection.js").then(({renderServiceRequestsSection:e})=>{const a=document.getElementById("home-service-requests-container");a&&e(a,{limit:4,showHero:!1,isCompact:!0})}).catch(e=>console.warn("[Home] ServiceRequestsSection load err:",e))}catch{}try{import("../components/AroundMeRadar.js").then(({mountAroundMeRadar:e})=>{e("home-around-me-container")}).catch(e=>console.warn("[Home] AroundMeRadar load err:",e))}catch{}try{ve("home-sponsored-container",i,{title:"\u0623\u0645\u0627\u0643\u0646 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0645\u064A\u0632\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",subtitle:"\u0623\u0646\u0634\u0637\u0629 \u062A\u062C\u0627\u0631\u064A\u0629 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u0648\u0635\u0649 \u0628\u0647\u0627 \u0648\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u062F\u064A\u0646\u0629",maxVisible:4})}catch(e){console.warn("[Home] SponsoredShowcase mount err:",e)}try{import("../components/WideAdsBanner.js").then(({mountWideAdsBanner:e})=>e("wide-ads-banner")).catch(e=>console.warn("[Home] WideAdsBanner load err:",e))}catch{}try{import("../components/HomeJobBoardFeed.js").then(({mountHomeJobBoardFeed:e})=>e("home-job-board-grid")).catch(e=>console.warn("[Home] HomeJobBoardFeed load err:",e))}catch{}try{import("../../services/articles.service.js").then(async({getArticles:e})=>{const a=document.getElementById("home-blog-section"),c=document.getElementById("home-blog-grid");if(!a||!c)return;const p=await e({limit:3}).catch(()=>[]);if(!Array.isArray(p)||!p.length){a.style.display="none";return}a.style.display="",c.innerHTML=p.map(m=>{const f="/article/"+encodeURIComponent(m.slug||"")+"/",h=m.place||{},b="/place/"+encodeURIComponent(h.slug||h.id||"")+"/",x=String(m.content||"").trim().split(/\s+/).length,_=Math.max(1,Math.ceil(x/150)),M=m.coverImageUrl?`<img class="blog-card__image" src="${String(m.coverImageUrl).replace(/"/g,"&quot;")}" alt="${String(m.title||"\u0645\u0642\u0627\u0644").replace(/"/g,"&quot;")}" width="640" height="360" loading="lazy" decoding="async">`:'<div class="blog-card__image blog-card__image--placeholder" aria-hidden="true"><span>\u{1F4DD}</span></div>';return`
            <article class="blog-card">
              <a class="blog-card__image-link" href="${f}" aria-label="${String(m.title||"").replace(/"/g,"&quot;")}">
                ${M}
                <div class="blog-card__overlay-gradient" aria-hidden="true"></div>
                <div class="blog-card__overlay-badge"><span>\u{1F4CD}</span> ${String(h.area||"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629").replace(/</g,"&lt;")}</div>
              </a>
              <div class="blog-card__body">
                <div class="blog-card__meta">
                  ${h.name?`<a class="blog-card__place-chip" href="${b}" title="${String(h.name).replace(/"/g,"&quot;")}"><span class="blog-card__verified-badge">\u2713</span><span>${String(h.name).replace(/</g,"&lt;")}</span></a>`:"<span></span>"}
                  <span class="blog-card__time">\u23F1\uFE0F ${_} \u062F \u0642\u0631\u0627\u0621\u0629</span>
                </div>
                <h3 class="blog-card__title"><a href="${f}">${String(m.title||"").replace(/</g,"&lt;")}</a></h3>
                <p class="blog-card__excerpt">${String(m.excerpt||m.content||"").slice(0,130).replace(/</g,"&lt;")}...</p>
                <div class="blog-card__footer">
                  <a class="blog-card__read" href="${f}"><span>\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0642\u0627\u0644 \u0643\u0627\u0645\u0644\u0627\u064B</span><span class="blog-card__arrow-circle" aria-hidden="true">\u2190</span></a>
                </div>
              </div>
            </article>
          `}).join("")}).catch(()=>{const e=document.getElementById("home-blog-section");e&&(e.style.display="none")})}catch{}try{Be()}catch{}}),typeof window<"u"&&!window._homeRealtimeSyncAttached&&(window._homeRealtimeSyncAttached=!0,window.addEventListener("manzala:realtime_sync",async e=>{try{const[a,c]=await Promise.all([G({limit:100,forceFresh:!0}).catch(()=>[]),Q(8).catch(()=>[])]);if(a&&a.length){const p=q()||userArg,m=z(a,p?.uid);U(m.slice(0,8)),j(a),F(a,C("categories_all")||[])}c&&c.length&&re(c)}catch(a){console.warn("[Home Realtime Sync Error]:",a)}}))}function z(l,s=null,r=!0){const t=new Set,n=[],i=[];[...l].sort((p,m)=>{const f=Number(p.createdAt)||Number(p.updatedAt)||0;return(Number(m.createdAt)||Number(m.updatedAt)||0)-f}).forEach(p=>{const m=p._key||p.id;t.has(m)||(t.add(m),ue(p)?n.push(p):i.push(p))});const u=te(n),g=Math.min(i.length,45),e=i.slice(0,g),a=i.slice(g),c=te(e);return[...u,...c,...a]}function Ye(){}const ae="manzala_verified_showcase_v1";let P=null,$=[],T=0;const $e=[];function j(l=null){const s=document.getElementById("home-verified-cards-grid"),r=document.getElementById("home-verified-status-text");if(!s)return;let t=null;try{const g=localStorage.getItem(ae);if(g){const e=JSON.parse(g);Array.isArray(e)&&e.length>0&&(t=e)}}catch{}if(Array.isArray(l)&&l.length>0){const g=a=>!!(a&&(a.isVerified===!0||a.isVerified==="true"||a.isVerified===1||a.isVerified==="1"||a.is_verified===1||a.is_verified===!0||a.is_verified==="true"||a.is_verified==="1"||a.verificationStatus==="verified"||a.verification_status==="verified")&&(!a.verifiedUntil||Number(a.verifiedUntil)>Date.now())),e=l.filter(a=>g(a)&&!ge(a)).map(a=>{const c=(a.customCategory||a.custom_category||"").trim(),p=(a.categoryName||a.category_name||"").trim(),m=c&&!["other","\u0623\u062E\u0631\u0649","\u0639\u0627\u0645","\u0646\u0634\u0627\u0637 \u0639\u0627\u0645"].includes(c.toLowerCase())?c:p||a.categoryId||"\u0646\u0634\u0627\u0637 \u062A\u062C\u0627\u0631\u064A",f=Ce(a);return{...a,id:a.id||a._key,slug:a.slug||a.id,name:a.name,area:a.area||"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",address:a.address||"",phone:a.phone||"",whatsapp:a.whatsapp||"",logoUrl:f.logoFallback||"",coverImageUrl:f.cover||f.categoryCover||"",category:m,categoryName:m,customCategory:c,cover:f.cover||f.categoryCover||"",categoryCover:f.categoryCover||"",isSponsored:!!(a.isSponsored&&(!a.sponsoredUntil||a.sponsoredUntil>Date.now()))}});if(e.length>0){$=e;try{localStorage.setItem(ae,JSON.stringify(e))}catch{}}}else $.length||(t&&t.length>0?$=t:$=[...$e]);if(typeof window<"u"&&Array.isArray($)){window._placesRegistry=window._placesRegistry||new Map;for(const g of $){if(!g)continue;const e=String(g.slug||g.id||"").toLowerCase().trim();e&&(window._placesRegistry.set(e,g),g.slug&&window._placesRegistry.set(String(g.slug).toLowerCase().trim(),g),g.id&&window._placesRegistry.set(String(g.id).toLowerCase().trim(),g))}}const n=["\u{1F947} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #1","\u{1F948} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #2","\u{1F949} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #3","\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #4"];function i(g){s.innerHTML=g.map((e,a)=>{const c=e.slug||e.id||"",p=we(e.categoryId||e.category||e.categoryName||""),m=e.coverImageUrl||e.cover||"",f=e.categoryCover||p.cover||"",h=m?`<img src="${o(m)}" alt="${o(e.name)}" loading="eager" fetchpriority="high" decoding="async" width="640" height="360"
             data-category-fallback="${o(f)}"
             onerror="if(!this.dataset.triedCdn&&this.src.includes('/api/r2/')){this.dataset.triedCdn='1';this.src='https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/'+this.src.split('/api/r2/')[1];}else if(!this.dataset.triedCat&&this.dataset.categoryFallback){this.dataset.triedCat='1';this.src=this.dataset.categoryFallback;}else{this.onerror=null;this.closest('.fair-place-card__cover')?.classList.remove('media-missing');this.outerHTML='<div class=\\'fair-place-card__cover-placeholder\\' style=\\'background:${p.gradient};display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;\\'><span>${p.icon}</span></div>';}">`:`<div class="fair-place-card__cover-placeholder" style="background:${p.gradient};display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;"><span>${p.icon}</span></div>`;return`
      <article class="fair-place-card" data-card-index="${a}"
               data-place-id="${o(e.id||"")}"
               data-place-slug="${o(c)}"
               data-name="${o(e.name||"")}"
               data-phone="${o(e.phone||"")}"
               data-whatsapp="${o(e.whatsapp||"")}"
               data-area="${o(e.area||"")}"
               data-address="${o(e.address||"")}"
               data-cover="${o(m)}"
               data-logo="${o(e.logoUrl||e.logo||"")}"
               data-category="${o(e.category||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${o(c)}', event) : (window.location.href='/place/${encodeURIComponent(c)}/')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(c)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(c)}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(c)}', this)"
               style="cursor:pointer">
        <span class="fair-place-card__rank">${n[a]||`\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #${a+1}`}</span>
        <div class="fair-place-card__cover">
          ${h}
          <div class="fair-place-card__badges">
            ${e.isSponsored?'<span class="fair-badge-sponsored">\u2B50 \u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632</span>':""}
            <span class="fair-badge-verified">\u2713 \u0645\u0648\u062B\u0642 \u0631\u0633\u0645\u064A\u0627\u064B</span>
          </div>
        </div>
        <div class="fair-place-card__body">
          <h3 class="fair-place-card__title" title="${o(e.name)}">${w(e.name)}</h3>
          <div class="fair-place-card__meta">
            <span>\u{1F4CD} ${w(e.area)}</span>
            <span>\u{1F3F7}\uFE0F ${w(e.category)}</span>
          </div>
          <a href="/place/${encodeURIComponent(c)}/" class="fair-place-card__link" onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${o(c)}', event) : (window.location.href='/place/${encodeURIComponent(c)}/')">\u0639\u0631\u0636 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0643\u0627\u0646 \u2197</a>
        </div>
      </article>
    `}).join("")}const d=$.length,u=[];for(let g=0;g<Math.min(4,d);g++)u.push($[(T+g)%d]);if(i(u),P&&(clearInterval(P),P=null),d>=2){let g=1;P=setInterval(()=>{s.querySelectorAll(".fair-place-card").forEach(a=>a.classList.add("anim-swap")),setTimeout(()=>{T=(T+1)%$.length,g++;const a=[],c=$.length;for(let p=0;p<Math.min(4,c);p++)a.push($[(T+p)%c]);i(a),r&&(r.innerHTML=`<b>\u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0635\u062F\u0627\u0631\u0629 \u0627\u0644\u0630\u0643\u064A (${g}):</b> \u0643\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0646\u0633\u0628\u0629 \u0638\u0647\u0648\u0631\u0647\u0627 \u0648\u062A\u0631\u062A\u064A\u0628\u0647\u0627 \u0648\u0627\u062D\u062F\u0629 \u0628\u0639\u062F\u0627\u0644\u0629 100% \u2728`)},300)},4500)}}function te(l){const s=[...l];for(let r=s.length-1;r>0;r--){const t=Math.floor(Math.random()*(r+1));[s[r],s[t]]=[s[t],s[r]]}return s}function U(l){const s=document.getElementById("latest-places-grid");if(s){if(!l||!l.length){if(s.querySelector(".fair-place-card")||s.querySelector(".place-card"))return;s.innerHTML=`
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">\u{1F3EA}</div>
        <p class="empty-state__text">\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0645\u0627\u0643\u0646 \u0645\u0633\u062C\u0644\u0629 \u0628\u0639\u062F</p>
        <a href="dashboard.html?section=add" class="btn btn-primary btn-sm" style="margin-top:1rem">\u0623\u0636\u0641 \u0623\u0648\u0644 \u0645\u0643\u0627\u0646</a>
      </div>
    `;return}s.innerHTML=l.map(r=>me(r)).join("")}}function re(l){const s=document.getElementById("offers-scroll"),r=document.getElementById("offers-section");if(s){if(!l||!l.length){s.querySelector(".offer-card")||r&&(r.style.display="none");return}r&&(r.style.display=""),s.innerHTML=l.map(t=>{const n=t.discountPercent||fe(t.oldPrice,t.newPrice),i=be(t.endDate);return`
      <article class="offer-card"
               data-place-slug="${o(t.placeSlug||"")}"
               data-name="${o(t.placeName||t.title||"")}"
               data-cover="${o(t.imageUrl||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${o(t.placeSlug||"")}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(t.placeSlug||"")}')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(t.placeSlug||"")}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(t.placeSlug||"")}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(t.placeSlug||"")}', this)"
               style="cursor:pointer">
        <div class="offer-card__image">
          ${t.imageUrl?`<img src="${o(t.imageUrl)}" alt="${o(t.title)}" loading="lazy" />`:'<div style="width:100%;height:100%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:2rem">\u{1F3F7}\uFE0F</div>'}
          ${n>0?`<span class="offer-card__discount-badge">-${n}%</span>`:""}
        </div>
        <div class="offer-card__body">
          <h3 class="offer-card__title">${w(t.title)}</h3>
          ${t.placeName?`<div class="offer-card__place">\u{1F4CD} ${w(t.placeName)}</div>`:""}
          ${t.newPrice?`
          <div class="offer-card__price">
            <span class="offer-card__price-new">${Y(t.newPrice)}</span>
            ${t.oldPrice?`<span class="offer-card__price-old">${Y(t.oldPrice)}</span>`:""}
          </div>
          `:""}
          <div class="offer-card__expiry">
            \u23F0 ${i>0?`\u064A\u0646\u062A\u0647\u064A \u062E\u0644\u0627\u0644 ${i} \u064A\u0648\u0645`:"\u064A\u0646\u062A\u0647\u064A \u0627\u0644\u064A\u0648\u0645"}
          </div>
        </div>
      </article>
    `}).join("")}}function Le(l){const s=document.getElementById("delivery-grid"),r=document.getElementById("delivery-section");if(s){if(!l||!l.length){s.querySelector(".delivery-card")||r&&(r.style.display="none");return}r&&(r.style.display=""),s.innerHTML=l.slice(0,8).map(t=>{const n=t.slug||t._key||t.id||"",i=xe(t),d=t.area?` \u2022 ${w(t.area)}`:" \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629";return`
    <a href="/place/${encodeURIComponent(n)}/" class="delivery-card"
       style="--vehicle-color: ${i.color}; --vehicle-bg: ${i.bgColor}; --vehicle-border: ${i.borderColor}; --vehicle-glow: ${i.glowColor};"
       data-place-id="${o(t.id||t._key||"")}"
       data-place-slug="${o(n)}"
       data-name="${o(t.name||"")}"
       data-phone="${o(t.phone||"")}"
       data-whatsapp="${o(t.whatsapp||"")}"
       data-area="${o(t.area||"")}"
       data-cover="${o(t.coverImageUrl||"")}"
       data-logo="${o(t.logoUrl||"")}"
       onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${o(n)}', event) : (window.location.href='/place/${encodeURIComponent(n)}/')"
       ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(n)}', this)"
       onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(n)}', this)"
       onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(n)}', this)">
      <div class="delivery-card__icon" aria-label="${i.name}">
        <span class="delivery-card__emoji" aria-hidden="true">${i.icon}</span>
      </div>
      <div class="delivery-card__info">
        <div class="delivery-card__name">${w(t.name)}</div>
        <div class="delivery-card__type">
          <span class="delivery-card__type-tag" style="color: ${i.color}; font-weight: 700;">${i.label}</span>
          <span class="delivery-card__type-area">${d}</span>
        </div>
      </div>
    </a>
  `}).join("")}}function ke(l){const s=document.getElementById("ads-container");if(!s||!l||!l.length)return;const r=l.filter(t=>t&&(t.imageUrl||t.image_url));if(!r.length){s.innerHTML="";return}s.innerHTML=r.map(t=>{let n=(t.link||"#").trim();n.startsWith("place.html")&&(n="/"+n);const i=t.id||t._id||"",d=t.title||"\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632",u=t.imageUrl||t.image_url||"";return`
      <a href="${o(n)}" class="ad-banner" target="_blank" rel="noopener noreferrer sponsored" aria-label="${o(d)}" data-ad-id="${o(i)}">
        <span class="ad-banner__label" aria-label="\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632">
          <span class="ad-banner__star" aria-hidden="true">\u2B50</span>
          <span class="ad-banner__text">\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632</span>
        </span>
        <img src="${o(u)}" alt="${o(d)}" loading="lazy" decoding="async"
             width="800" height="420" style="aspect-ratio:16/7;" />
      </a>
    `}).join(""),s.querySelectorAll(".ad-banner").forEach(t=>{t.addEventListener("click",()=>{const n=t.getAttribute("data-ad-id");if(n&&K)try{fetch(`${K}/api/ads/track-click`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:n}),keepalive:!0}).catch(()=>{})}catch{}})})}class Se{constructor(){this.ctx=null,this.lastTickTime=0}init(){if(!this.ctx&&typeof window<"u"){const s=window.AudioContext||window.webkitAudioContext;s&&(this.ctx=new s)}}playTick(s=550){try{if(!this.ctx||this.ctx.state!=="running")return;const r=this.ctx.currentTime;if(r-this.lastTickTime<.038)return;this.lastTickTime=r;const t=this.ctx.createOscillator(),n=this.ctx.createGain();t.type="sine",t.frequency.setValueAtTime(s,r),t.frequency.exponentialRampToValueAtTime(s*1.35,r+.018),n.gain.setValueAtTime(.04,r),n.gain.exponentialRampToValueAtTime(1e-4,r+.022),t.connect(n),n.connect(this.ctx.destination),t.start(r),t.stop(r+.028)}catch{}}playDoneChime(){try{if(!this.ctx||this.ctx.state!=="running")return;const s=this.ctx.currentTime;[1046.5,1318.51,1567.98,2093].forEach((t,n)=>{const i=this.ctx.createOscillator(),d=this.ctx.createGain();i.type="triangle",i.frequency.setValueAtTime(t,s+n*.055),d.gain.setValueAtTime(.06,s+n*.055),d.gain.exponentialRampToValueAtTime(1e-4,s+n*.055+.32),i.connect(d),d.connect(this.ctx.destination),i.start(s+n*.055),i.stop(s+n*.055+.35)})}catch{}}}const E=new Se;function ie(l,s){const r=document.getElementById("stats-bar");if(!r)return;const t=5e4,n=Math.max(15e3,Number(l)||0),i=12e3,d=Math.max(124,Number(s)||0),u=55;r.innerHTML=`
    <div class="stats-bar__inner container">
      <div class="stats-bar__item stats-interactive-item" title="\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0634\u0647\u0631\u064A \u0628\u0627\u0644\u0645\u0646\u0637\u0642\u0629">
        <div class="stats-bar__value" data-target="${t}" data-prefix="+" data-suffix="">+${t.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0645\u0634\u0627\u0647\u062F\u0629 \u0648\u0632\u064A\u0627\u0631\u0629 \u0634\u0647\u0631\u064A\u0627\u064B</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0639\u062F\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0646 \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629">
        <div class="stats-bar__value" data-target="${n}" data-prefix="+" data-suffix="">+${n.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0646\u0634\u0627\u0637 \u062A\u062C\u0627\u0631\u064A \u0648\u0639\u064A\u0627\u062F\u0629 \u0648\u0645\u0647\u0646\u0629 \u0645\u0633\u062C\u0644\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u064A\u0648\u0645\u064A \u0641\u064A \u0645\u062F\u0646 \u0648\u0642\u0631\u0649 \u0627\u0644\u062F\u0644\u064A\u0644">
        <div class="stats-bar__value" data-target="${i}" data-prefix="+" data-suffix="">+${i.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0639\u0645\u0644\u064A\u0629 \u0628\u062D\u062B \u064A\u0648\u0645\u064A\u0627\u064B</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0639\u062F\u062F \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0646 \u0648\u0627\u0644\u062D\u0631\u0641 \u0627\u0644\u0645\u063A\u0637\u0627\u0629">
        <div class="stats-bar__value" data-target="${d}" data-prefix="+" data-suffix="">+${d}</div>
        <div class="stats-bar__label">\u062A\u0635\u0646\u064A\u0641 \u0648\u0645\u0647\u0646\u0629 \u0648\u062D\u0631\u0641\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0627\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062F\u0644\u064A\u0644">
        <div class="stats-bar__value" data-target="${u}" data-prefix="+" data-suffix="">+${u}</div>
        <div class="stats-bar__label">\u0645\u062F\u064A\u0646\u0629 \u0648\u0642\u0631\u064A\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062F\u0644\u064A\u0644</div>
      </div>
    </div>
  `,Ee(r)}function Ee(l){let s=!1,r=!1;function t(){if(r)return;r=!0;const n=l.querySelectorAll(".stats-bar__value[data-target]");if(!n.length){r=!1;return}const i=1800,d=performance.now();n.forEach(e=>{e.classList.remove("stats-done"),e.classList.add("stats-counting")});let u=-1;function g(e){const a=e-d,c=Math.min(1,a/i),p=1-Math.pow(1-c,3);n.forEach(m=>{const f=parseInt(m.getAttribute("data-target"),10)||0,h=m.getAttribute("data-prefix")||"",b=m.getAttribute("data-suffix")||"",x=Math.floor(p*f);if(m.textContent=`${h}${x.toLocaleString("en-US")}${b}`,x!==u){u=x;const _=420+x/Math.max(1,f)*430;E.playTick(_)}}),c<1?requestAnimationFrame(g):(n.forEach(m=>{const f=parseInt(m.getAttribute("data-target"),10)||0,h=m.getAttribute("data-prefix")||"",b=m.getAttribute("data-suffix")||"";m.textContent=`${h}${f.toLocaleString("en-US")}${b}`,m.classList.remove("stats-counting"),m.classList.add("stats-done")}),E.playDoneChime(),r=!1)}requestAnimationFrame(g)}if("IntersectionObserver"in window){const n=new IntersectionObserver(i=>{i.forEach(d=>{d.isIntersecting&&!s&&(s=!0,t(),n.disconnect())})},{threshold:.15});n.observe(l)}else t();l.querySelectorAll(".stats-interactive-item").forEach(n=>{n.addEventListener("click",()=>{E.init(),E.ctx&&E.ctx.state==="suspended"&&E.ctx.resume().catch(()=>{}),t()})})}function se(l){const s=document.getElementById("hero-search-glow-wrap"),r=document.getElementById("hero-search-input"),t=document.getElementById("hero-search-btn"),n=document.getElementById("hero-search-clear"),i=document.getElementById("hero-live-dropdown");if(!r)return;i&&!document.getElementById("hero-live-list")&&(i.innerHTML=`
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
    `);const d=document.getElementById("hero-live-list"),u=document.getElementById("hero-live-count"),g=document.getElementById("hero-live-all-btn"),e=document.getElementById("hero-quick-cats");e&&Array.isArray(l)&&l.length>0&&(e.innerHTML=l.slice(0,10).map(h=>{const b=h.slug||h._key||h.id||"",x=ee(b||h.name,18);return`
        <a href="category.html?slug=${encodeURIComponent(b)}" class="hero__quick-cat">
          ${x||h.icon||"\u{1F3EA}"} ${w(h.name)}
        </a>
      `}).join(""));function a(){const h=r.value.trim();h&&(window.location.href=`search.html?q=${encodeURIComponent(h)}`)}t?.addEventListener("click",h=>{h.stopPropagation(),a()}),r.addEventListener("keydown",h=>{h.key==="Enter"?a():h.key==="Escape"&&i?.classList.remove("visible")}),n?.addEventListener("click",h=>{h.stopPropagation(),r.value="",n.classList.remove("visible"),i?.classList.remove("visible"),d&&(d.innerHTML=""),r.focus()});function c(){!i||!d||(u&&(u.textContent="\u0645\u0642\u062A\u0631\u062D\u0627\u062A"),d.innerHTML=`
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
    `,d.querySelectorAll(".hero-live-suggestion-chip").forEach(h=>{h.addEventListener("click",b=>{b.preventDefault(),b.stopPropagation();const x=h.getAttribute("data-q")||"";r.value=x,r.dispatchEvent(new Event("input",{bubbles:!0})),r.focus()})}),i.classList.add("visible"))}r.addEventListener("focus",()=>{r.value.trim().length>=1&&d?.children.length>0?i?.classList.add("visible"):r.value.trim()||c()}),r.addEventListener("click",()=>{r.value.trim()||c()});let p=null,m=0;r.addEventListener("input",()=>{const h=r.value.trim();if(n?.classList.toggle("visible",h.length>0),g&&(g.href=`search.html?q=${encodeURIComponent(h)}`),!h){i?.classList.remove("visible"),d&&(d.innerHTML="");return}const b=h.length<=2?0:35;clearTimeout(p),p=setTimeout(async()=>{const x=++m;try{let M=function(y,v){if(!y)return"";if(!v)return w(y);const k=v.trim().split(/\s+/).filter(Boolean);if(!k.length)return w(y);const B=k.map(L=>L.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),A=new RegExp(`(${B.join("|")})`,"gi");return w(y).replace(A,'<span class="search-highlight">$1</span>')};const _=await _e(h,{limit:6});if(x!==m||!i||!d)return;if(!_||_.length===0){u&&(u.textContent="0"),d.innerHTML=`
            <div class="hero-live-empty">
              <div class="hero-live-empty__icon">\u{1F50D}</div>
              <div class="hero-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="hero-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,i.classList.add("visible");return}u&&(u.textContent=String(_.length));let D="";_.matchingCategories&&_.matchingCategories.length>0&&(D=`
            <div class="hero-live-matched-cats">
              <span class="hero-live-matched-cats__label">\u26A1 \u0623\u0642\u0633\u0627\u0645 \u0645\u0637\u0627\u0628\u0642\u0629:</span>
              <div class="hero-live-matched-cats__chips">
                ${_.matchingCategories.map(y=>{const v=y.slug||y.id||"",k=ee(v||y.name,16);return`
                    <a href="category.html?slug=${encodeURIComponent(v)}" class="hero-live-matched-cat-chip" onclick="event.stopPropagation()">
                      ${k||y.icon||"\u{1F3EA}"}
                      <span>${w(y.name)}</span>
                    </a>
                  `}).join("")}
              </div>
            </div>
          `),d.innerHTML=D+_.map(y=>{const v=y.raw||y,k=v.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",B=v.categoryName||y.category||"",A=v.area||v.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",L=v.slug||v.id||"",I=v.photoURL||v.logo||v.coverURL||v.coverImageUrl||v.logoUrl||"",ce=v.isVerified||!1,N=v.isOpen!==void 0?v.isOpen:!0,Z=(k.trim()[0]||"\u0645").toUpperCase(),H=(v.phone||"").trim(),O=(v.whatsapp||v.phone||"").trim(),S=O?O.replace(/[^0-9]/g,""):"",R=S?S.startsWith("2")?S:S.startsWith("0")?"2"+S:"20"+S:"";let W="";if((H||R)&&(W=`
              <div class="hero-live-actions" onclick="event.stopPropagation()">
                ${H?`
                  <a href="tel:${o(H)}" class="hero-live-action-btn hero-live-action-btn--call" title="\u0627\u062A\u0635\u0627\u0644 \u0647\u0627\u062A\u0641\u064A \u0645\u0628\u0627\u0634\u0631" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span class="action-btn-text">\u0627\u062A\u0635\u0627\u0644</span>
                  </a>
                `:""}
                ${R?`
                  <a href="https://wa.me/${o(R)}" target="_blank" rel="noopener" class="hero-live-action-btn hero-live-action-btn--wa" title="\u0645\u062D\u0627\u062F\u062B\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0641\u0648\u0631\u064A\u0629" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.35-.49.07-1.12.1-3.26-.79-2.73-1.14-4.5-3.89-4.63-4.07-.14-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36.002.52.01.17.01.39-.06.61.47.24.58.8 1.95.87 2.09.07.15.12.32.02.52-.09.21-.14.33-.29.5-.14.17-.3.38-.43.51-.15.15-.3.32-.13.62.18.3.78 1.29 1.68 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.79.84 2.1 1 .3.15.51.23.58.36.08.13.08.76-.16 1.43z"/></svg>
                    <span class="action-btn-text">\u0648\u0627\u062A\u0633\u0627\u0628</span>
                  </a>
                `:""}
              </div>
            `),typeof window<"u"&&window._placesRegistry&&L){const le=String(L).toLowerCase().trim();window._placesRegistry.set(le,v),v.slug&&window._placesRegistry.set(String(v.slug).toLowerCase().trim(),v),v.id&&window._placesRegistry.set(String(v.id).toLowerCase().trim(),v)}return`
            <a href="/place.html?slug=${encodeURIComponent(L)}" class="hero-live-dropdown__item" role="option"
               data-place-id="${o(v.id||L)}"
               data-place-slug="${o(L)}"
               data-name="${o(k)}"
               data-phone="${o(v.phone||"")}"
               data-whatsapp="${o(v.whatsapp||"")}"
               data-area="${o(A)}"
               data-address="${o(v.address||"")}"
               data-cover="${o(v.coverImageUrl||I)}"
               data-logo="${o(v.logoUrl||I)}"
               data-category="${o(B)}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${o(L)}', event) : null"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(L)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${o(L)}', this)">
              <div class="hero-live-avatar">
                ${I?`<img src="${o(I)}" alt="${o(k)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'hero-live-avatar-fallback\\'>${Z}</div>'"/>`:`<div class="hero-live-avatar-fallback">${Z}</div>`}
              </div>
              <div class="hero-live-content">
                <div class="hero-live-title-row">
                  <span class="hero-live-name">${M(k,h)}</span>
                  ${ce?'<span class="hero-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="hero-live-meta-row">
                  ${B?`<span class="hero-live-cat">${M(B,h)}</span>`:""}
                  <span class="hero-live-area">${w(A)}</span>
                  <span class="${N?"hero-live-status-open":"hero-live-status-closed"}">
                    ${N?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
              ${W}
            </a>
          `}).join(""),i.classList.add("visible")}catch(_){console.warn("[HeroLiveSearch] error:",_)}},b)}),document.addEventListener("click",h=>{s?.contains(h.target)||i?.classList.remove("visible")}),document.getElementById("hero-voice-trigger-btn")?.addEventListener("click",h=>{h.preventDefault(),h.stopPropagation(),ye()})}function Xe(){const l=document.getElementById("villages-filter-input"),s=document.querySelectorAll(".village-grid-item");!l||!s.length||l.addEventListener("input",()=>{const r=l.value.trim();s.forEach(t=>{const n=t.getAttribute("data-name")||"",i=t.textContent||"",d=!r||X(n,r)||X(i,r);t.style.display=d?"flex":"none"})})}let V=null;function ne(){if(typeof window>"u")return;V&&clearTimeout(V);const l=document.getElementById("typewriter-part-1"),s=document.getElementById("typewriter-part-2"),r=document.getElementById("typewriter-part-3");if(!l||!s||!r)return;const t="\u0641\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",n=" \u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",i=["\u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0645\u0647\u0631 \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648\u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u062D\u0644\u0627\u062A\u060C \u0627\u0644\u0645\u0637\u0627\u0639\u0645\u060C \u0648\u0627\u0644\u0643\u0627\u0641\u064A\u0647\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0644\u062D\u0631\u0641\u064A\u064A\u0646: \u0633\u0628\u0627\u0643\u060C \u0646\u062C\u0627\u0631\u060C \u0643\u0647\u0631\u0628\u0627\u0626\u064A\u060C \u0648\u0646\u0642\u0627\u0634","\u0623\u0642\u0648\u0649 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062D\u0635\u0631\u064A\u0629 \u0648\u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629"];l.textContent=t,s.textContent=n,r.textContent||(r.textContent=i[0]);let d=!1;const u=c=>new Promise(p=>{V=setTimeout(p,c)});async function g(c,p,m=50){for(let f=0;f<p.length;f++){if(d)return;c.textContent+=p[f];const h=Math.floor(Math.random()*25);await u(m+h)}}async function e(c,p=null,m=25){const f=c.textContent,h=p!==null?p:f.length;for(let b=0;b<h;b++){if(d)return;c.textContent=f.slice(0,f.length-1-b),await u(m)}}async function a(){await u(3500);let c=0;for(;!d;){await e(r,null,18),await u(250),c++;const p=i[c%i.length];await g(r,p,38),await u(4e3)}}a().catch(()=>{})}function oe(){const l=[{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629",icon:"\u{1F3D9}\uFE0F",desc:"\u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0648\u0627\u0644\u0645\u0631\u0643\u0632"},{name:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629",icon:"\u{1F30A}",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0645\u062C\u0644\u0633 \u0642\u0631\u0648\u064A \u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629"},{name:"\u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629"},{name:"\u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A",icon:"\u{1F40E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A"},{name:"\u0627\u0644\u0628\u0635\u0631\u0627\u0637",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u0627\u0637"},{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3E2}",desc:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u064A\u062A \u0634\u0631\u064A\u0641",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u0634\u0631\u064A\u0641"},{name:"\u0627\u0644\u0639\u0627\u0645\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0627\u0645\u0631\u0629"},{name:"\u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629"},{name:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C"},{name:"\u0645\u064A\u062A \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u062E\u0636\u064A\u0631"},{name:"\u0627\u0644\u0639\u0632\u064A\u0632\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0632\u064A\u0632\u0629"},{name:"\u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645",icon:"\u{1F54A}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645"},{name:"\u0627\u0644\u0634\u0628\u0648\u0644",icon:"\u{1F30A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0628\u0648\u0644"},{name:"\u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629"},{name:"\u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629",icon:"\u{1F333}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645"},{name:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632",icon:"\u{1F34C}",desc:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632"},{name:"\u0627\u0644\u062D\u0648\u062A\u0629",icon:"\u{1F41F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062D\u0648\u062A\u0629"},{name:"\u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629"},{name:"\u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C"},{name:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631",icon:"\u2728",desc:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631"},{name:"\u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629"},{name:"\u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627"},{name:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627",icon:"\u{1F33E}",desc:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627"},{name:"\u0627\u0644\u0642\u0637\u0634\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0637\u0634\u0629"},{name:"\u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629",icon:"\u{1F525}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629"},{name:"\u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629",icon:"\u{1F9F1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629"},{name:"\u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629",icon:"\u{1F42A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629"},{name:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631",icon:"\u{1F331}",desc:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631"},{name:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642",icon:"\u{1F6E3}\uFE0F",desc:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642"},{name:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F30A}",desc:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0627\u0644\u062C\u0648\u0627\u0628\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0648\u0627\u0628\u0631"},{name:"\u0627\u0644\u0645\u0648\u0627\u062C\u062F",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u0648\u0627\u062C\u062F"},{name:"\u0627\u0644\u0636\u0647\u064A\u0631",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0636\u0647\u064A\u0631"},{name:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631",icon:"\u{1F333}",desc:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631"},{name:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631"},{name:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633",icon:"\u{1F33E}",desc:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633"},{name:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646",icon:"\u{1F33A}",desc:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646"},{name:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629"},{name:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639",icon:"\u26FA",desc:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639"},{name:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A",icon:"\u26CF\uFE0F",desc:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A"},{name:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A",icon:"\u{1F6E1}\uFE0F",desc:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A"},{name:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629",icon:"\u{1F6E3}\uFE0F",desc:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629"},{name:"\u0627\u0644\u0645\u062B\u0644\u062B",icon:"\u{1F53A}",desc:"\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u062B\u0644\u062B"},{name:"\u0627\u0644\u0645\u062C\u0627\u064A\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062C\u0627\u064A\u0631"},{name:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F",icon:"\u{1F686}",desc:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F"},{name:"\u0627\u0644\u0642\u0628\u0644\u064A\u0629",icon:"\u{1F9ED}",desc:"\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0642\u0628\u0644\u064A\u0629"}];return`
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
    <section class="section" id="home-blog-section" style="background:var(--surface);padding-block:var(--space-10);display:none">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
          <h2 class="section-title">
            <span>\u{1F4DD}</span> \u0645\u0642\u0627\u0644\u0627\u062A \u0648\u0623\u062E\u0628\u0627\u0631 \u062D\u0635\u0631\u064A\u0629
          </h2>
          <a href="/blog/" class="section-link">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</a>
        </div>
        <div class="blog-grid" id="home-blog-grid"></div>
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
  `}function w(l){return l?String(l).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function o(l){return l?String(l).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function Be(){try{let n=function(){try{localStorage.setItem("__has_seen_welcome_video_v1","true")}catch{}r&&r.pause(),s.style.opacity="0";const i=s.querySelector(".first-visit-video-card");i&&(i.style.transform="scale(0.92)"),setTimeout(()=>{s&&s.parentNode&&s.parentNode.removeChild(s)},350)};return}catch(l){console.warn("[Welcome Video] error:",l)}}
