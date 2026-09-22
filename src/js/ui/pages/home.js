import{getCategories as pe,getPublishedPlaces as Q,getActiveOffers as J,getAds as me,getCached as w,FALLBACK_CATEGORIES as R}from"../../core/db.js";import{WORKER_URL as K}from"../../core/firebase.js";import"../../core/state.js";import{renderPlaceCard as he,renderPlaceCardSkeleton as ge}from"../components/PlaceCard.js?v=20260922_03";import{isAtmPlace as ve}from"../../utils/atm.js";import{mountSponsoredShowcase as ue,isPlaceSponsored as fe}from"../components/SponsoredShowcase.js";import{formatPrice as Y,calcDiscount as be,arabicMatch as X}from"../../utils/arabic.js";import{daysUntil as ye}from"../../utils/date.js";import{getCurrentUser as q}from"../../core/auth.js";import{openManzalaVoiceAssistantModal as _e}from"../../services/voice.service.js";import{executeFastSearch as we,warmupSearchEngine as z}from"../../services/search-engine.service.js";import{getCategorySvg as ee}from"../../utils/professions-data.js";import{resolvePlaceMedia as rm}from"../../utils/category-assets.js?v=20260923_01";import{getCategoryVisualMeta as xe,renderCategoryCardIcon as Ce}from"../../utils/category-visual.js";import{resolveDeliveryVehicle as $e}from"../../utils/delivery-vehicle.js";const Je={pharmacy:{emoji:"\u{1F48A}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},supermarket:{emoji:"\u{1F6D2}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},paint:{emoji:"\u{1F3A8}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},herbs:{emoji:"\u{1F33F}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},doctor:{emoji:"\u{1F468}\u200D\u2695\uFE0F",color:"rgba(41,128,185,0.1)",border:"#2980B9"},plumbing:{emoji:"\u{1F527}",color:"rgba(52,73,94,0.1)",border:"#52596E"},plumber:{emoji:"\u{1FAA0}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpenter:{emoji:"\u{1FA9A}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},tiler:{emoji:"\u{1F9F1}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},painter:{emoji:"\u{1F58C}\uFE0F",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},electrician:{emoji:"\u26A1",color:"rgba(243,156,18,0.1)",border:"#F39C12"},"ac-technician":{emoji:"\u2744\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},blacksmith:{emoji:"\u{1F6E0}\uFE0F",color:"rgba(52,73,94,0.1)",border:"#52596E"},alumital:{emoji:"\u{1FA9F}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},mechanic:{emoji:"\u{1F529}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},upholsterer:{emoji:"\u{1F6CB}\uFE0F",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},feed:{emoji:"\u{1F33E}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},poultry:{emoji:"\u{1F357}",color:"rgba(243,156,18,0.1)",border:"#F39C12"},bakery:{emoji:"\u{1F35E}",color:"rgba(230,126,34,0.1)",border:"#E67E22"},vegetables:{emoji:"\u{1F96C}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},antiques:{emoji:"\u{1F3FA}",color:"rgba(149,165,166,0.1)",border:"#95A5A6"},electronics:{emoji:"\u{1F4FA}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},carpet:{emoji:"\u{1F9F6}",color:"rgba(155,89,182,0.1)",border:"#9B59B6"},mattress:{emoji:"\u{1F6CF}\uFE0F",color:"rgba(52,152,219,0.1)",border:"#3498DB"},china:{emoji:"\u{1F37D}\uFE0F",color:"rgba(231,76,60,0.1)",border:"#E74C3C"},electrical:{emoji:"\u{1F4A1}",color:"rgba(241,196,15,0.1)",border:"#F1C40F"},roastery:{emoji:"\u{1F95C}",color:"rgba(101,67,33,0.1)",border:"#654321"},phones:{emoji:"\u{1F4F1}",color:"rgba(41,128,185,0.1)",border:"#2980B9"},grocery:{emoji:"\u{1F3EA}",color:"rgba(39,174,96,0.1)",border:"#27AE60"},hypermarket:{emoji:"\u{1F3EC}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"},delivery:{emoji:"\u{1F680}",color:"rgba(231,76,60,0.1)",border:"#E74C3C"}},Ke={emoji:"\u{1F3EA}",color:"rgba(27,79,114,0.1)",border:"#1B4F72"};export async function renderHomePage(c,{user:r}={}){const i=document.getElementById("hero-section-static");if(!!!i)c.innerHTML=ce(),ne();else{i.removeAttribute("id");const e=[];let a=i.nextSibling;for(;a;)e.push(a),a=a.nextSibling;e.forEach(g=>g.parentNode&&g.parentNode.removeChild(g));const d=document.createElement("div");d.innerHTML=ce();const p=d.querySelector(".hero");if(p){if(!i.querySelector(".hero-heritage-decor")){const g=p.querySelector(".hero-heritage-decor");g&&i.insertAdjacentElement("afterbegin",g)}p.remove()}for(;d.firstChild;)c.appendChild(d.firstChild);ne()}T();try{const e=w("categories_all"),a=w("published_100_");if(Array.isArray(e)&&e.length>0&&(te(e),oe(e)),Array.isArray(a)&&a.length>0){const d=q()||r;T(a);const p=U(a,d?.uid);F(p.slice(0,8)),se(a.length,e?.length||31),z(a,e||[])}}catch{}let o=[],s=[],l=[],u=[];try{const[e,a,d,p]=await Promise.allSettled([pe(),Q({limit:100}),J(8),me("homepage")]);o=e.status==="fulfilled"&&Array.isArray(e.value)&&e.value.length?e.value:w("categories_all")||R||[],s=a.status==="fulfilled"&&Array.isArray(a.value)&&a.value.length?a.value:w("published_100_")||[],l=d.status==="fulfilled"&&Array.isArray(d.value)?d.value:w("offers_active_8")||[],u=p.status==="fulfilled"&&Array.isArray(p.value)?p.value:w("ads_homepage")||[]}catch(e){console.warn("[Home] Data load non-fatal warning:",e),o=w("categories_all")||R||[],s=w("published_100_")||[],l=w("offers_active_8")||[],u=w("ads_homepage")||[]}const h=q()||r;if(typeof window<"u"&&Array.isArray(s)&&s.length>0){window._placesRegistry=window._placesRegistry||new Map;for(const e of s){if(!e)continue;const a=String(e.slug||e.id||e._key||"").toLowerCase().trim();a&&(window._placesRegistry.set(a,e),e.id&&window._placesRegistry.set(String(e.id).toLowerCase().trim(),e),e.slug&&window._placesRegistry.set(String(e.slug).toLowerCase().trim(),e))}}try{o&&o.length&&te(o)}catch(e){console.warn("[Home] renderCategories err:",e)}try{T(s)}catch(e){console.warn("[Home] initHomeVerifiedShowcase err:",e)}try{const e=U(s,h?.uid);F(e.slice(0,8))}catch(e){console.warn("[Home] renderLatestPlaces err:",e)}try{l&&l.length&&re(l)}catch(e){console.warn("[Home] renderOffers err:",e)}try{const e=(s||[]).filter(a=>{if(!a)return!1;if(a.deliveryType||a.categoryId?.includes("delivery"))return!0;const d=String(a.name||"").toLowerCase();return/توكتوك|تاكسي|شانجي|اتوبيس|توصيل|دليفري|وصلي/i.test(d)?!/صيدلية|مطعم|كشري|حلواني|سوبر\s*ماركت|هايبر/i.test(d):!1});e.length&&ke(e)}catch(e){console.warn("[Home] renderDeliveryServices err:",e)}try{u&&u.length&&Se(u)}catch(e){console.warn("[Home] renderAds err:",e)}try{se(s.length||0,o?.length||31)}catch{}try{z(s,o||[])}catch{}try{oe(o||[])}catch{}try{Me()}catch{}Promise.resolve().then(()=>{try{import("../components/WhoIsAvailableNow.js").then(({renderWhoIsAvailableNow:e})=>{const a=document.getElementById("home-oncall-craftsmen-container");a&&e(a)}).catch(e=>console.warn("[Home] WhoIsAvailableNow load err:",e))}catch{}try{import("../components/ServiceRequestsSection.js").then(({renderServiceRequestsSection:e})=>{const a=document.getElementById("home-service-requests-container");a&&e(a,{limit:4,showHero:!1,isCompact:!0})}).catch(e=>console.warn("[Home] ServiceRequestsSection load err:",e))}catch{}try{import("../components/AroundMeRadar.js").then(({mountAroundMeRadar:e})=>{e("home-around-me-container")}).catch(e=>console.warn("[Home] AroundMeRadar load err:",e))}catch{}try{ue("home-sponsored-container",s,{title:"\u0623\u0645\u0627\u0643\u0646 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0645\u064A\u0632\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",subtitle:"\u0623\u0646\u0634\u0637\u0629 \u062A\u062C\u0627\u0631\u064A\u0629 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u0648\u0635\u0649 \u0628\u0647\u0627 \u0648\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u062F\u064A\u0646\u0629",maxVisible:4})}catch(e){console.warn("[Home] SponsoredShowcase mount err:",e)}try{import("../components/WideAdsBanner.js").then(({mountWideAdsBanner:e})=>e("wide-ads-banner")).catch(e=>console.warn("[Home] WideAdsBanner load err:",e))}catch{}try{import("../components/HomeJobBoardFeed.js").then(({mountHomeJobBoardFeed:e})=>e("home-job-board-grid")).catch(e=>console.warn("[Home] HomeJobBoardFeed load err:",e))}catch{}try{Be()}catch{}}),typeof window<"u"&&!window._homeRealtimeSyncAttached&&(window._homeRealtimeSyncAttached=!0,window.addEventListener("manzala:realtime_sync",async e=>{try{const[a,d]=await Promise.all([Q({limit:100,forceFresh:!0}).catch(()=>[]),J(8).catch(()=>[])]);if(a&&a.length){const p=q()||userArg,g=U(a,p?.uid);F(g.slice(0,8)),T(a),z(a,w("categories_all")||[])}d&&d.length&&re(d)}catch(a){console.warn("[Home Realtime Sync Error]:",a)}}))}function U(c,r=null,i=!0){const t=new Set,o=[],s=[];[...c].sort((p,g)=>{const f=Number(p.createdAt)||Number(p.updatedAt)||0;return(Number(g.createdAt)||Number(g.updatedAt)||0)-f}).forEach(p=>{const g=p._key||p.id;t.has(g)||(t.add(g),fe(p)?o.push(p):s.push(p))});const u=ie(o),h=Math.min(s.length,45),e=s.slice(0,h),a=s.slice(h),d=ie(e);return[...u,...d,...a]}function te(c){const r=document.getElementById("categories-grid");if(!r)return;const i=Array.isArray(c)&&c.length>0?c:w("categories_all")||R||[];if(!i||!i.length)return r.querySelector(".category-card"),void 0;r.innerHTML=i.map(t=>{const o=t.slug||t._key||t.id||"",s=xe(t),l=Ce(t,{size:40});return`
      <a href="category.html?slug=${encodeURIComponent(o)}"
         class="category-card animate-fade-in"
         style="--cat-color:${s.color};--cat-bg:${s.bgColor};--cat-border:${s.borderColor}"
         aria-label="${t.name}">
        <div class="category-card__icon" style="background:${s.bgColor};border-color:${s.borderColor};--cat-color:${s.color};">
          ${l}
        </div>
        <div class="category-card__name">${_(t.name)}</div>
      </a>
    `}).join("")}const ae="manzala_verified_showcase_v1";let I=null,C=[],P=0;const Le=[{id:"p_1788703900620_oae8ka",slug:"mtam-basl-wbaha-llmakwlat-albhrya",name:"\u0645\u0637\u0639\u0645 \u0628\u0627\u0633\u0644 \u0648\u0628\u0627\u0647\u0649 \u0644\u0644\u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0628\u062D\u0631\u064A\u0629",area:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u062F\u0642\u0647\u0644\u064A\u0629",address:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629 - \u0634 \u0627\u0644\u062B\u0648\u0631\u0629",phone:"01062944644",whatsapp:"01062944644",category:"\u0645\u0637\u0627\u0639\u0645 \u0648\u0623\u0633\u0645\u0627\u0643",cover:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!0},{id:"-P03LX9MledW_z7QfyHO",slug:"-P03LX9MledW_z7QfyHO",name:"\u0627\u0644\u062D\u0633\u0646 \u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062D\u0645\u0648\u0644\u0629",area:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0634\u0627\u0631\u0639 \u0627\u0644\u0628\u062D\u0631",address:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0634\u0627\u0631\u0639 \u0627\u0644\u0628\u062D\u0631 \u0623\u0645\u0627\u0645 \u0627\u0644\u0628\u0646\u0643",phone:"01026046049",whatsapp:"01026046049",category:"\u0635\u064A\u0627\u0646\u0629 \u0648\u0645\u0648\u0628\u0627\u064A\u0644",cover:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!0},{id:"p_1788801925745_vuxmjs",slug:"mtbkh-eyma-llaakl-albyty",name:"\u0645\u0637\u0628\u062E \u0625\u064A\u0645\u0649 \u0644\u0644\u0623\u0643\u0644 \u0627\u0644\u0628\u064A\u062A\u064A",area:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0637\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629",address:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u0637\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",phone:"01090123456",whatsapp:"01090123456",category:"\u0623\u0643\u0644 \u0628\u064A\u062A\u064A \u0648\u062D\u0644\u0648\u064A\u0627\u062A",cover:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!1},{id:"-P0hEa0K6ZfAM65O27G9",slug:"kwafyr-mnh-asad",name:"\u0643\u0648\u0627\u0641\u064A\u0631 \u0645\u0646\u0647 \u0623\u0633\u0639\u062F",area:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u062D\u064A \u0627\u0644\u0633\u0644\u0627\u0645",address:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 - \u062D\u064A \u0627\u0644\u0633\u0644\u0627\u0645",phone:"01099887766",whatsapp:"01099887766",category:"\u0628\u064A\u0648\u062A\u064A \u0648\u0643\u0648\u0627\u0641\u064A\u0631",cover:"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=180&q=75",coverImageUrl:"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=180&q=75",isSponsored:!1}];function T(c=null){const r=document.getElementById("home-verified-cards-grid"),i=document.getElementById("home-verified-status-text");if(!r)return;let t=null;try{const h=localStorage.getItem(ae);if(h){const e=JSON.parse(h);Array.isArray(e)&&e.length>0&&(t=e)}}catch{}if(Array.isArray(c)&&c.length>0){const h=a=>!!(a&&(a.isVerified===!0||a.isVerified==="true"||a.isVerified===1||a.isVerified==="1"||a.is_verified===1||a.is_verified===!0||a.is_verified==="true"||a.is_verified==="1"||a.verificationStatus==="verified"||a.verification_status==="verified")&&(!a.verifiedUntil||Number(a.verifiedUntil)>Date.now())),e=c.filter(a=>h(a)&&!ve(a)).map(a=>{const d=(a.customCategory||a.custom_category||"").trim(),p=(a.categoryName||a.category_name||"").trim(),g=d&&!["other","\u0623\u062E\u0631\u0649","\u0639\u0627\u0645","\u0646\u0634\u0627\u0637 \u0639\u0627\u0645"].includes(d.toLowerCase())?d:p||a.categoryId||"\u0646\u0634\u0627\u0637 \u062A\u062C\u0627\u0631\u064A";return{...a,id:a.id||a._key,slug:a.slug||a.id,name:a.name,area:a.area||"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",address:a.address||"",phone:a.phone||"",whatsapp:a.whatsapp||"",logoUrl:a.logoUrl||"",coverImageUrl:a.coverImageUrl||a.gallery&&a.gallery[0]||"",category:g,categoryName:g,customCategory:d,cover:a.coverImageUrl||a.logoUrl||a.gallery&&a.gallery[0]||"",isSponsored:!!(a.isSponsored&&(!a.sponsoredUntil||a.sponsoredUntil>Date.now()))}});if(e.length>0){C=e;try{localStorage.setItem(ae,JSON.stringify(e))}catch{}}}else C.length||(t&&t.length>0?C=t:C=[...Le]);if(typeof window<"u"&&Array.isArray(C)){window._placesRegistry=window._placesRegistry||new Map;for(const h of C){if(!h)continue;const e=String(h.slug||h.id||"").toLowerCase().trim();e&&(window._placesRegistry.set(e,h),h.slug&&window._placesRegistry.set(String(h.slug).toLowerCase().trim(),h),h.id&&window._placesRegistry.set(String(h.id).toLowerCase().trim(),h))}}const o=["\u{1F947} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #1","\u{1F948} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #2","\u{1F949} \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #3","\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #4"];function s(h){r.innerHTML=h.map((e,a)=>{const d=e.slug||e.id||"";return`
      <article class="fair-place-card" data-card-index="${a}"
               data-place-id="${n(e.id||"")}"
               data-place-slug="${n(d)}"
               data-name="${n(e.name||"")}"
               data-phone="${n(e.phone||"")}"
               data-whatsapp="${n(e.whatsapp||"")}"
               data-area="${n(e.area||"")}"
               data-address="${n(e.address||"")}"
               data-cover="${n(e.coverImageUrl||e.cover||"")}"
               data-logo="${n(e.logoUrl||e.logo||"")}"
               data-category="${n(e.category||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${n(d)}', event) : (window.location.href='/place/${encodeURIComponent(d)}/')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(d)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(d)}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(d)}', this)"
               style="cursor:pointer">
        <span class="fair-place-card__rank">${o[a]||`\u{1F396}\uFE0F \u0627\u0644\u0635\u062F\u0627\u0631\u0629 #${a+1}`}</span>
        <div class="fair-place-card__cover">
          ${e.coverImageUrl||e.cover?`<img src="${n(e.coverImageUrl||e.cover)}" alt="${n(e.name)}" loading="lazy" onerror="this.style.display='none';">`:`<div class="fair-place-card__cover-placeholder" aria-hidden="true">🏪</div>`}
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
          <a href="/place/${encodeURIComponent(d)}/" class="fair-place-card__link" onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${n(d)}', event) : (window.location.href='/place/${encodeURIComponent(d)}/')">\u0639\u0631\u0636 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0643\u0627\u0646 \u2197</a>
        </div>
      </article>
    `}).join("")}const l=C.length,u=[];for(let h=0;h<Math.min(4,l);h++)u.push(C[(P+h)%l]);if(s(u),I&&(clearInterval(I),I=null),l>=2){let h=1;I=setInterval(()=>{r.querySelectorAll(".fair-place-card").forEach(a=>a.classList.add("anim-swap")),setTimeout(()=>{P=(P+1)%C.length,h++;const a=[],d=C.length;for(let p=0;p<Math.min(4,d);p++)a.push(C[(P+p)%d]);s(a),i&&(i.innerHTML=`<b>تدوير الصدارة الذكي (${h}):</b> كل الأماكن نسبة ظهورها وترتيبها واحدة بعدالة 100% ✨`)},300)},4500)}}function ie(c){const r=[...c];for(let i=r.length-1;i>0;i--){const t=Math.floor(Math.random()*(i+1));[r[i],r[t]]=[r[t],r[i]]}return r}function F(c){const r=document.getElementById("latest-places-grid");if(r){if(!c||!c.length){if(r.querySelector(".fair-place-card")||r.querySelector(".place-card"))return;r.innerHTML=`
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">\u{1F3EA}</div>
        <p class="empty-state__text">\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0645\u0627\u0643\u0646 \u0645\u0633\u062C\u0644\u0629 \u0628\u0639\u062F</p>
        <a href="dashboard.html?section=add" class="btn btn-primary btn-sm" style="margin-top:1rem">\u0623\u0636\u0641 \u0623\u0648\u0644 \u0645\u0643\u0627\u0646</a>
      </div>
    `;return}r.innerHTML=c.map(i=>he(i)).join("")}}function re(c){const r=document.getElementById("offers-scroll"),i=document.getElementById("offers-section");if(r){if(!c||!c.length){r.querySelector(".offer-card")||i&&(i.style.display="none");return}i&&(i.style.display=""),r.innerHTML=c.map(t=>{const o=t.discountPercent||be(t.oldPrice,t.newPrice),s=ye(t.endDate);return`
      <article class="offer-card"
               data-place-slug="${n(t.placeSlug||"")}"
               data-name="${n(t.placeName||t.title||"")}"
               data-cover="${n(t.imageUrl||"")}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${n(t.placeSlug||"")}', event) : (window.location.href='/place/${encodeURIComponent(t.placeSlug||"")}/')"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(t.placeSlug||"")}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(t.placeSlug||"")}', this)"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(t.placeSlug||"")}', this)"
               style="cursor:pointer">
        <div class="offer-card__image">
          ${t.imageUrl?`<img src="${n(t.imageUrl)}" alt="${n(t.title)}" loading="lazy" />`:'<div style="width:100%;height:100%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:2rem">\u{1F3F7}\uFE0F</div>'}
          ${o>0?`<span class="offer-card__discount-badge">-${o}%</span>`:""}
        </div>
        <div class="offer-card__body">
          <h3 class="offer-card__title">${_(t.title)}</h3>
          ${t.placeName?`<div class="offer-card__place">\u{1F4CD} ${_(t.placeName)}</div>`:""}
          ${t.newPrice?`
          <div class="offer-card__price">
            <span class="offer-card__price-new">${Y(t.newPrice)}</span>
            ${t.oldPrice?`<span class="offer-card__price-old">${Y(t.oldPrice)}</span>`:""}
          </div>
          `:""}
          <div class="offer-card__expiry">
            \u23F0 ${s>0?`\u064A\u0646\u062A\u0647\u064A \u062E\u0644\u0627\u0644 ${s} \u064A\u0648\u0645`:"\u064A\u0646\u062A\u0647\u064A \u0627\u0644\u064A\u0648\u0645"}
          </div>
        </div>
      </article>
    `}).join("")}}function ke(c){const r=document.getElementById("delivery-grid"),i=document.getElementById("delivery-section");if(r){if(!c||!c.length){r.querySelector(".delivery-card")||i&&(i.style.display="none");return}i&&(i.style.display=""),r.innerHTML=c.slice(0,8).map(t=>{const o=t.slug||t._key||t.id||"",s=$e(t),l=t.area?` \u2022 ${_(t.area)}`:" \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629";return`
    <a href="/place/${encodeURIComponent(o)}/" class="delivery-card"
       style="--vehicle-color: ${s.color}; --vehicle-bg: ${s.bgColor}; --vehicle-border: ${s.borderColor}; --vehicle-glow: ${s.glowColor};"
       data-place-id="${n(t.id||t._key||"")}"
       data-place-slug="${n(o)}"
       data-name="${n(t.name||"")}"
       data-phone="${n(t.phone||"")}"
       data-whatsapp="${n(t.whatsapp||"")}"
       data-area="${n(t.area||"")}"
       data-cover="${n(t.coverImageUrl||"")}"
       data-logo="${n(t.logoUrl||"")}"
       onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${n(o)}', event) : (window.location.href='/place/${encodeURIComponent(o)}/')"
       ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(o)}', this)"
       onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(o)}', this)"
       onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(o)}', this)">
      <div class="delivery-card__icon" aria-label="${s.name}">
        <span class="delivery-card__emoji" aria-hidden="true">${s.icon}</span>
      </div>
      <div class="delivery-card__info">
        <div class="delivery-card__name">${_(t.name)}</div>
        <div class="delivery-card__type">
          <span class="delivery-card__type-tag" style="color: ${s.color}; font-weight: 700;">${s.label}</span>
          <span class="delivery-card__type-area">${l}</span>
        </div>
      </div>
    </a>
  `}).join("")}}function Se(c){const r=document.getElementById("ads-container");if(!r||!c||!c.length)return;const i=c.filter(t=>t&&(t.imageUrl||t.image_url));if(!i.length){r.innerHTML="";return}r.innerHTML=i.map(t=>{let o=(t.link||"#").trim();o.startsWith("place.html")&&(o="/"+o);const s=t.id||t._id||"",l=t.title||"\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632",u=t.imageUrl||t.image_url||"";return`
      <a href="${n(o)}" class="ad-banner" target="_blank" rel="noopener noreferrer sponsored" aria-label="${n(l)}" data-ad-id="${n(s)}">
        <span class="ad-banner__label" aria-label="\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632">
          <span class="ad-banner__star" aria-hidden="true">\u2B50</span>
          <span class="ad-banner__text">\u0625\u0639\u0644\u0627\u0646 \u0645\u0645\u064A\u0632</span>
        </span>
        <img src="${n(u)}" alt="${n(l)}" loading="lazy" decoding="async"
             width="800" height="420" style="aspect-ratio:16/7;" />
      </a>
    `}).join(""),r.querySelectorAll(".ad-banner").forEach(t=>{t.addEventListener("click",()=>{const o=t.getAttribute("data-ad-id");if(o&&K)try{fetch(`${K}/api/ads/track-click`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o}),keepalive:!0}).catch(()=>{})}catch{}})})}class Ae{constructor(){this.ctx=null,this.lastTickTime=0}init(){if(!this.ctx&&typeof window<"u"){const r=window.AudioContext||window.webkitAudioContext;r&&(this.ctx=new r)}}playTick(r=550){try{if(!this.ctx||this.ctx.state!=="running")return;const i=this.ctx.currentTime;if(i-this.lastTickTime<.038)return;this.lastTickTime=i;const t=this.ctx.createOscillator(),o=this.ctx.createGain();t.type="sine",t.frequency.setValueAtTime(r,i),t.frequency.exponentialRampToValueAtTime(r*1.35,i+.018),o.gain.setValueAtTime(.04,i),o.gain.exponentialRampToValueAtTime(1e-4,i+.022),t.connect(o),o.connect(this.ctx.destination),t.start(i),t.stop(i+.028)}catch{}}playDoneChime(){try{if(!this.ctx||this.ctx.state!=="running")return;const r=this.ctx.currentTime;[1046.5,1318.51,1567.98,2093].forEach((t,o)=>{const s=this.ctx.createOscillator(),l=this.ctx.createGain();s.type="triangle",s.frequency.setValueAtTime(t,r+o*.055),l.gain.setValueAtTime(.06,r+o*.055),l.gain.exponentialRampToValueAtTime(1e-4,r+o*.055+.32),s.connect(l),l.connect(this.ctx.destination),s.start(r+o*.055),s.stop(r+o*.055+.35)})}catch{}}}const A=new Ae;function se(c,r){const i=document.getElementById("stats-bar");if(!i)return;const t=5e4,o=Math.max(15e3,Number(c)||0),s=12e3,l=Math.max(124,Number(r)||0),u=55;i.innerHTML=`
    <div class="stats-bar__inner container">
      <div class="stats-bar__item stats-interactive-item" title="\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0634\u0647\u0631\u064A \u0628\u0627\u0644\u0645\u0646\u0637\u0642\u0629">
        <div class="stats-bar__value" data-target="${t}" data-prefix="+" data-suffix="">+${t.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0645\u0634\u0627\u0647\u062F\u0629 \u0648\u0632\u064A\u0627\u0631\u0629 \u0634\u0647\u0631\u064A\u0627\u064B</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0639\u062F\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0646 \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629">
        <div class="stats-bar__value" data-target="${o}" data-prefix="+" data-suffix="">+${o.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0646\u0634\u0627\u0637 \u062A\u062C\u0627\u0631\u064A \u0648\u0639\u064A\u0627\u062F\u0629 \u0648\u0645\u0647\u0646\u0629 \u0645\u0633\u062C\u0644\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u064A\u0648\u0645\u064A \u0641\u064A \u0645\u062F\u0646 \u0648\u0642\u0631\u0649 \u0627\u0644\u062F\u0644\u064A\u0644">
        <div class="stats-bar__value" data-target="${s}" data-prefix="+" data-suffix="">+${s.toLocaleString("en-US")}</div>
        <div class="stats-bar__label">\u0639\u0645\u0644\u064A\u0629 \u0628\u062D\u062B \u064A\u0648\u0645\u064A\u0627\u064B</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0639\u062F\u062F \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0646 \u0648\u0627\u0644\u062D\u0631\u0641 \u0627\u0644\u0645\u063A\u0637\u0627\u0629">
        <div class="stats-bar__value" data-target="${l}" data-prefix="+" data-suffix="">+${l}</div>
        <div class="stats-bar__label">\u062A\u0635\u0646\u064A\u0641 \u0648\u0645\u0647\u0646\u0629 \u0648\u062D\u0631\u0641\u0629</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u0627\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062F\u0644\u064A\u0644">
        <div class="stats-bar__value" data-target="${u}" data-prefix="+" data-suffix="">+${u}</div>
        <div class="stats-bar__label">\u0645\u062F\u064A\u0646\u0629 \u0648\u0642\u0631\u064A\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062F\u0644\u064A\u0644</div>
      </div>
      <div class="stats-bar__divider" aria-hidden="true"></div>
      <div class="stats-bar__item stats-interactive-item" title="\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A">
        <div class="stats-bar__value stats-text-badge">\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629</div>
        <div class="stats-bar__label">\u0645\u062D\u0627\u0641\u0638\u0629 \u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629</div>
      </div>
    </div>
  `,Ee(i)}function Ee(c){let r=!1,i=!1;function t(){if(i)return;i=!0;const o=c.querySelectorAll(".stats-bar__value[data-target]");if(!o.length){i=!1;return}const s=1800,l=performance.now();o.forEach(e=>{e.classList.remove("stats-done"),e.classList.add("stats-counting")});let u=-1;function h(e){const a=e-l,d=Math.min(1,a/s),p=1-Math.pow(1-d,3);o.forEach(g=>{const f=parseInt(g.getAttribute("data-target"),10)||0,m=g.getAttribute("data-prefix")||"",b=g.getAttribute("data-suffix")||"",$=Math.floor(p*f);if(g.textContent=`${m}${$.toLocaleString("en-US")}${b}`,$!==u){u=$;const x=420+$/Math.max(1,f)*430;A.playTick(x)}}),d<1?requestAnimationFrame(h):(o.forEach(g=>{const f=parseInt(g.getAttribute("data-target"),10)||0,m=g.getAttribute("data-prefix")||"",b=g.getAttribute("data-suffix")||"";g.textContent=`${m}${f.toLocaleString("en-US")}${b}`,g.classList.remove("stats-counting"),g.classList.add("stats-done")}),A.playDoneChime(),i=!1)}requestAnimationFrame(h)}if("IntersectionObserver"in window){const o=new IntersectionObserver(s=>{s.forEach(l=>{l.isIntersecting&&!r&&(r=!0,t(),o.disconnect())})},{threshold:.15});o.observe(c)}else t();c.querySelectorAll(".stats-interactive-item").forEach(o=>{o.addEventListener("click",()=>{A.init(),A.ctx&&A.ctx.state==="suspended"&&A.ctx.resume().catch(()=>{}),t()})})}function oe(c){const r=document.getElementById("hero-search-glow-wrap"),i=document.getElementById("hero-search-input"),t=document.getElementById("hero-search-btn"),o=document.getElementById("hero-search-clear"),s=document.getElementById("hero-live-dropdown");if(!i)return;s&&!document.getElementById("hero-live-list")&&(s.innerHTML=`
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
    `);const l=document.getElementById("hero-live-list"),u=document.getElementById("hero-live-count"),h=document.getElementById("hero-live-all-btn"),e=document.getElementById("hero-quick-cats");e&&Array.isArray(c)&&c.length>0&&(e.innerHTML=c.slice(0,10).map(m=>{const b=m.slug||m._key||m.id||"",$=ee(b||m.name,18);return`
        <a href="category.html?slug=${encodeURIComponent(b)}" class="hero__quick-cat">
          ${$||m.icon||"\u{1F3EA}"} ${_(m.name)}
        </a>
      `}).join(""));function a(){const m=i.value.trim();m&&(window.location.href=`search.html?q=${encodeURIComponent(m)}`)}t?.addEventListener("click",m=>{m.stopPropagation(),a()}),i.addEventListener("keydown",m=>{m.key==="Enter"?a():m.key==="Escape"&&s?.classList.remove("visible")}),o?.addEventListener("click",m=>{m.stopPropagation(),i.value="",o.classList.remove("visible"),s?.classList.remove("visible"),l&&(l.innerHTML=""),i.focus()});function d(){!s||!l||(u&&(u.textContent="\u0645\u0642\u062A\u0631\u062D\u0627\u062A"),l.innerHTML=`
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
    `,l.querySelectorAll(".hero-live-suggestion-chip").forEach(m=>{m.addEventListener("click",b=>{b.preventDefault(),b.stopPropagation();const $=m.getAttribute("data-q")||"";i.value=$,i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus()})}),s.classList.add("visible"))}i.addEventListener("focus",()=>{i.value.trim().length>=1&&l?.children.length>0?s?.classList.add("visible"):i.value.trim()||d()}),i.addEventListener("click",()=>{i.value.trim()||d()});let p=null,g=0;i.addEventListener("input",()=>{const m=i.value.trim();if(o?.classList.toggle("visible",m.length>0),h&&(h.href=`search.html?q=${encodeURIComponent(m)}`),!m){s?.classList.remove("visible"),l&&(l.innerHTML="");return}const b=m.length<=2?0:35;clearTimeout(p),p=setTimeout(async()=>{const $=++g;try{let D=function(y,v){if(!y)return"";if(!v)return _(y);const k=v.trim().split(/\s+/).filter(Boolean);if(!k.length)return _(y);const E=k.map(L=>L.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),M=new RegExp(`(${E.join("|")})`,"gi");return _(y).replace(M,'<span class="search-highlight">$1</span>')};const x=await we(m,{limit:6});if($!==g||!s||!l)return;if(!x||x.length===0){u&&(u.textContent="0"),l.innerHTML=`
            <div class="hero-live-empty">
              <div class="hero-live-empty__icon">\u{1F50D}</div>
              <div class="hero-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="hero-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,s.classList.add("visible");return}u&&(u.textContent=String(x.length));let N="";x.matchingCategories&&x.matchingCategories.length>0&&(N=`
            <div class="hero-live-matched-cats">
              <span class="hero-live-matched-cats__label">\u26A1 \u0623\u0642\u0633\u0627\u0645 \u0645\u0637\u0627\u0628\u0642\u0629:</span>
              <div class="hero-live-matched-cats__chips">
                ${x.matchingCategories.map(y=>{const v=y.slug||y.id||"",k=ee(v||y.name,16);return`
                    <a href="category.html?slug=${encodeURIComponent(v)}" class="hero-live-matched-cat-chip" onclick="event.stopPropagation()">
                      ${k||y.icon||"\u{1F3EA}"}
                      <span>${_(y.name)}</span>
                    </a>
                  `}).join("")}
              </div>
            </div>
          `),l.innerHTML=N+x.map(y=>{const v=y.raw||y,k=v.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",E=v.categoryName||y.category||"",M=v.area||v.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",L=v.slug||v.id||"",B=v.photoURL||v.logo||v.coverURL||v.coverImageUrl||v.logoUrl||"",le=v.isVerified||!1,O=v.isOpen!==void 0?v.isOpen:!0,Z=(k.trim()[0]||"\u0645").toUpperCase(),j=(v.phone||"").trim(),W=(v.whatsapp||v.phone||"").trim(),S=W?W.replace(/[^0-9]/g,""):"",H=S?S.startsWith("2")?S:S.startsWith("0")?"2"+S:"20"+S:"";let G="";if((j||H)&&(G=`
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
            `),typeof window<"u"&&window._placesRegistry&&L){const de=String(L).toLowerCase().trim();window._placesRegistry.set(de,v),v.slug&&window._placesRegistry.set(String(v.slug).toLowerCase().trim(),v),v.id&&window._placesRegistry.set(String(v.id).toLowerCase().trim(),v)}return`
            <a href="/place.html?slug=${encodeURIComponent(L)}" class="hero-live-dropdown__item" role="option"
               data-place-id="${n(v.id||L)}"
               data-place-slug="${n(L)}"
               data-name="${n(k)}"
               data-phone="${n(v.phone||"")}"
               data-whatsapp="${n(v.whatsapp||"")}"
               data-area="${n(M)}"
               data-address="${n(v.address||"")}"
               data-cover="${n(v.coverImageUrl||B)}"
               data-logo="${n(v.logoUrl||B)}"
               data-category="${n(E)}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${n(L)}', event) : null"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(L)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${n(L)}', this)">
              <div class="hero-live-avatar">
                ${B?`<img src="${n(B)}" alt="${n(k)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'hero-live-avatar-fallback\\'>${Z}</div>'"/>`:`<div class="hero-live-avatar-fallback">${Z}</div>`}
              </div>
              <div class="hero-live-content">
                <div class="hero-live-title-row">
                  <span class="hero-live-name">${D(k,m)}</span>
                  ${le?'<span class="hero-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="hero-live-meta-row">
                  ${E?`<span class="hero-live-cat">${D(E,m)}</span>`:""}
                  <span class="hero-live-area">${_(M)}</span>
                  <span class="${O?"hero-live-status-open":"hero-live-status-closed"}">
                    ${O?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
              ${G}
            </a>
          `}).join(""),s.classList.add("visible")}catch(x){console.warn("[HeroLiveSearch] error:",x)}},b)}),document.addEventListener("click",m=>{r?.contains(m.target)||s?.classList.remove("visible")}),document.getElementById("hero-voice-trigger-btn")?.addEventListener("click",m=>{m.preventDefault(),m.stopPropagation(),_e()})}function Me(){const c=document.getElementById("villages-filter-input"),r=document.querySelectorAll(".village-grid-item");!c||!r.length||c.addEventListener("input",()=>{const i=c.value.trim();r.forEach(t=>{const o=t.getAttribute("data-name")||"",s=t.textContent||"",l=!i||X(o,i)||X(s,i);t.style.display=l?"flex":"none"})})}let V=null;function ne(){if(typeof window>"u")return;V&&clearTimeout(V);const c=document.getElementById("typewriter-part-1"),r=document.getElementById("typewriter-part-2"),i=document.getElementById("typewriter-part-3");if(!c||!r||!i)return;const t="\u0641\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",o=" \u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629\u061F",s=["\u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0645\u0647\u0631 \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648\u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u062D\u0644\u0627\u062A\u060C \u0627\u0644\u0645\u0637\u0627\u0639\u0645\u060C \u0648\u0627\u0644\u0643\u0627\u0641\u064A\u0647\u0627\u062A","\u062F\u0644\u064A\u0644\u0643 \u0644\u0644\u062D\u0631\u0641\u064A\u064A\u0646: \u0633\u0628\u0627\u0643\u060C \u0646\u062C\u0627\u0631\u060C \u0643\u0647\u0631\u0628\u0627\u0626\u064A\u060C \u0648\u0646\u0642\u0627\u0634","\u0623\u0642\u0648\u0649 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062D\u0635\u0631\u064A\u0629 \u0648\u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629"];c.textContent=t,r.textContent=o,i.textContent||(i.textContent=s[0]);let l=!1;const u=d=>new Promise(p=>{V=setTimeout(p,d)});async function h(d,p,g=50){for(let f=0;f<p.length;f++){if(l)return;d.textContent+=p[f];const m=Math.floor(Math.random()*25);await u(g+m)}}async function e(d,p=null,g=25){const f=d.textContent,m=p!==null?p:f.length;for(let b=0;b<m;b++){if(l)return;d.textContent=f.slice(0,f.length-1-b),await u(g)}}async function a(){await u(3500);let d=0;for(;!l;){await e(i,null,18),await u(250),d++;const p=s[d%s.length];await h(i,p,38),await u(4e3)}}a().catch(()=>{})}function ce(){const c=[{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629",icon:"\u{1F3D9}\uFE0F",desc:"\u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0648\u0627\u0644\u0645\u0631\u0643\u0632"},{name:"\u0627\u0644\u0645\u0637\u0631\u064A\u0629",icon:"\u{1F30A}",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0628\u062D\u064A\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u062F\u064A\u0646\u0629 \u0648\u0645\u062C\u0644\u0633 \u0642\u0631\u0648\u064A \u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629"},{name:"\u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629"},{name:"\u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A",icon:"\u{1F40E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0641\u0631\u0648\u0633\u0627\u062A"},{name:"\u0627\u0644\u0628\u0635\u0631\u0627\u0637",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u0627\u0637"},{name:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3E2}",desc:"\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u064A\u062A \u0634\u0631\u064A\u0641",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u0634\u0631\u064A\u0641"},{name:"\u0627\u0644\u0639\u0627\u0645\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0627\u0645\u0631\u0629"},{name:"\u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0633\u062A\u0627\u064A\u062A\u0629"},{name:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0643\u0641\u0631 \u062D\u062C\u0627\u062C"},{name:"\u0645\u064A\u062A \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0645\u064A\u062A \u062E\u0636\u064A\u0631"},{name:"\u0627\u0644\u0639\u0632\u064A\u0632\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0632\u064A\u0632\u0629"},{name:"\u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645",icon:"\u{1F54A}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u062F\u0627\u0631 \u0627\u0644\u0633\u0644\u0627\u0645"},{name:"\u0627\u0644\u0634\u0628\u0648\u0644",icon:"\u{1F30A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0628\u0648\u0644"},{name:"\u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629"},{name:"\u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629",icon:"\u{1F333}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0639\u0644\u0645"},{name:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632",icon:"\u{1F34C}",desc:"\u062E\u0646\u062F\u0642 \u0627\u0644\u0645\u0648\u0632"},{name:"\u0627\u0644\u062D\u0648\u062A\u0629",icon:"\u{1F41F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062D\u0648\u062A\u0629"},{name:"\u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0632\u0627\u0642\u0632\u0629"},{name:"\u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629",icon:"\u{1F33F}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0634\u0631\u064A\u0641\u064A\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0633\u0631\u0627\u062C"},{name:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631",icon:"\u2728",desc:"\u0623\u0648\u0644\u0627\u062F \u0646\u0648\u0631"},{name:"\u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0632\u0639\u0627\u062A\u0631\u0629"},{name:"\u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u062A\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0628\u0635\u0627\u064A\u0644\u0629"},{name:"\u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629",icon:"\u{1F334}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0647\u0646\u0627\u064A\u062F\u0629"},{name:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627",icon:"\u{1F3E1}",desc:"\u0623\u0648\u0644\u0627\u062F \u0628\u0627\u0646\u0627"},{name:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627",icon:"\u{1F33E}",desc:"\u0623\u0648\u0644\u0627\u062F \u062D\u0627\u0646\u0627"},{name:"\u0627\u0644\u0642\u0637\u0634\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0642\u0637\u0634\u0629"},{name:"\u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629",icon:"\u{1F525}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062D\u0627\u0631\u0642\u0629"},{name:"\u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629",icon:"\u{1F9F1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0637\u0648\u0627\u0628\u0631\u0629"},{name:"\u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0639\u0645\u0627\u0631\u0646\u0629"},{name:"\u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629",icon:"\u{1F42A}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0645\u0627\u0645\u0644\u0629"},{name:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631",icon:"\u{1F331}",desc:"\u0625\u0635\u0644\u0627\u062D \u0623\u0628\u0648 \u0627\u0644\u0623\u062E\u0636\u0631"},{name:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642",icon:"\u{1F6E3}\uFE0F",desc:"\u0639\u0632\u0628\u0629 \u0627\u0644\u0645\u0641\u0627\u0631\u0642"},{name:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F30A}",desc:"\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",icon:"\u{1F3DB}\uFE0F",desc:"\u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"},{name:"\u0627\u0644\u062C\u0648\u0627\u0628\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u062C\u0648\u0627\u0628\u0631"},{name:"\u0627\u0644\u0645\u0648\u0627\u062C\u062F",icon:"\u{1F33E}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u0648\u0627\u062C\u062F"},{name:"\u0627\u0644\u0636\u0647\u064A\u0631",icon:"\u{1F3E1}",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0636\u0647\u064A\u0631"},{name:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631",icon:"\u{1F333}",desc:"\u0623\u0648\u0644\u0627\u062F \u0635\u0628\u0648\u0631"},{name:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631",icon:"\u{1F334}",desc:"\u0623\u0628\u0648 \u062E\u0636\u064A\u0631"},{name:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633",icon:"\u{1F33E}",desc:"\u0628\u0637\u0644 \u0634\u0645\u064A\u0633"},{name:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646",icon:"\u{1F33A}",desc:"\u062D\u064A \u0627\u0644\u0628\u0633\u0627\u062A\u064A\u0646"},{name:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629",icon:"\u{1F3D8}\uFE0F",desc:"\u0627\u0644\u062E\u0644\u0627\u064A\u0641\u0629"},{name:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639",icon:"\u26FA",desc:"\u0627\u0644\u0639\u0631\u0628 \u0648\u0627\u0644\u0646\u062C\u0648\u0639"},{name:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A",icon:"\u26CF\uFE0F",desc:"\u0627\u0644\u062C\u0628\u0627\u0633\u0627\u062A"},{name:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A",icon:"\u{1F6E1}\uFE0F",desc:"\u0627\u0644\u062C\u0633\u0631 \u0627\u0644\u0648\u0627\u0642\u064A"},{name:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629",icon:"\u{1F6E3}\uFE0F",desc:"\u0637\u0631\u064A\u0642 \u0627\u0644\u0634\u0648\u0646\u0629"},{name:"\u0627\u0644\u0645\u062B\u0644\u062B",icon:"\u{1F53A}",desc:"\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u062B\u0644\u062B"},{name:"\u0627\u0644\u0645\u062C\u0627\u064A\u0631",icon:"\u{1F3D8}\uFE0F",desc:"\u0642\u0631\u064A\u0629 \u0627\u0644\u0645\u062C\u0627\u064A\u0631"},{name:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F",icon:"\u{1F686}",desc:"\u0634\u0631\u0642 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062D\u062F\u064A\u062F"},{name:"\u0627\u0644\u0642\u0628\u0644\u064A\u0629",icon:"\u{1F9ED}",desc:"\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0642\u0628\u0644\u064A\u0629"}];return`
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

    <!-- Towns & Villages Directory Section -->
    <section class="section" style="background:var(--surface);padding-block:var(--space-8);border-bottom:1px solid var(--border)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);flex-wrap:wrap;gap:12px">
          <div>
            <h2 class="section-title" style="margin-bottom:2px">
              <span>\u{1F5FA}\uFE0F</span> \u0627\u0633\u062A\u0643\u0634\u0641 \u062D\u0633\u0628 \u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0648\u0627\u0644\u0642\u0631\u064A\u0629 (${c.length})
            </h2>
            <p style="font-size:13px;color:var(--text-muted);margin:0">\u062A\u0635\u0641\u062D \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0648\u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629</p>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <input type="text" id="villages-filter-input" placeholder="\u{1F50D} \u0627\u0628\u062D\u062B \u0639\u0646 \u0642\u0631\u064A\u062A\u0643 \u0623\u0648 \u0645\u062F\u064A\u0646\u062A\u0643..." class="form-input" style="font-size:12.5px;padding:6px 12px;width:210px;margin:0" />
            <a href="places.html" class="section-link" style="white-space:nowrap">\u0643\u0644 \u0627\u0644\u0645\u062F\u0646 \u0648\u0627\u0644\u0642\u0631\u0649 \u2190</a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:10px;margin-top:14px" id="villages-grid-container">
          ${c.map(r=>`
            <a href="${{\u0627\u0644\u0639\u0632\u064A\u0632\u0629:"#/village/al-aziza",\u0627\u0644\u0628\u0635\u0631\u0627\u0637:"#/village/al-basrat",\u0627\u0644\u0634\u0628\u0648\u0644:"#/village/al-shabboul",\u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629:"#/village/al-asafra",\u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629:"#/village/al-nasayma"}[r.name]||`places.html?area=${encodeURIComponent(r.name)}`}" class="category-card village-grid-item" data-name="${n(r.name)}" style="padding:12px 8px;text-align:center;text-decoration:none;border-radius:var(--radius-md);transition:all 0.2s ease;display:flex;flex-direction:column;align-items:center" title="\u062F\u0644\u064A\u0644 \u0623\u0645\u0627\u0643\u0646 \u0648\u062E\u062F\u0645\u0627\u062A \u0648\u0645\u0648\u0627\u0635\u0644\u0627\u062A ${r.name}">
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
        color: #047857;
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
              <span id="home-verified-status-text">تدوير الصدارة الذكي: كل الأماكن نسبة ظهورها وترتيبها واحدة بعدالة 100% ✨</span>
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
          ${Array(4).fill(ge()).join("")}
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

    <!-- Job Board Feed (طلبات العمل ووظائف متاحة) -->
    <section class="section" id="home-job-board-section" style="background:var(--surface-2);padding-block:var(--space-10)">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6);flex-wrap:wrap;gap:12px">
          <div>
            <h2 class="section-title" style="margin-bottom:4px">
              <span>💼</span> طلبات العمل ووظائف متاحة
            </h2>
            <p style="margin:0;font-size:13px;color:var(--text-muted)">
              فرص عمل وكوادر محلية متجددة في المنزلة والمطرية بتكافؤ الفرص في العرض
            </p>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <a href="job-seekers.html" class="btn btn-sm" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:12px;font-weight:700;text-decoration:none">
              <span>طالبين عمل ↤</span>
            </a>
            <a href="jobs.html" class="btn btn-sm" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:12px;font-weight:700;text-decoration:none">
              <span>وظائف شاغرة ↤</span>
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
  `}function _(c){return c?String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function n(c){return c?String(c).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function Be(){try{let o=function(){try{localStorage.setItem("__has_seen_welcome_video_v1","true")}catch{}i&&i.pause(),r.style.opacity="0";const s=r.querySelector(".first-visit-video-card");s&&(s.style.transform="scale(0.92)"),setTimeout(()=>{r&&r.parentNode&&r.parentNode.removeChild(r)},350)};return}catch(c){console.warn("[Welcome Video] error:",c)}}
