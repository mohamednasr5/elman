import{ensureFirebaseReady as F}from"./firebase.js";import{initAuth as R,onAuthStateChange as U,signOut as N,waitForAuth as W,isAdmin as _,getCurrentUser as j,getClientIp as O}from"./auth.js";import{getSettings as K,isIpBanned as V}from"./db.js";import{toast as r}from"../ui/components/Toast.js";import{bindGlobalVoiceAssistantFab as G,openManzalaVoiceAssistantModal as S}from"../services/voice.service.js";import{initRealtimePwaSyncBus as Y}from"../services/realtime-sync.service.js";import{initLiveNotificationSubscriber as J}from"../services/notification.service.js";import{initFcmMessaging as Q}from"../services/fcm.service.js";import{initUniversalMobileTouchTooltips as X}from"../utils/mobile-tooltip.js";import{executeFastSearch as Z}from"../services/search-engine.service.js";import{mountWideAdsBanner as ee}from"../ui/components/WideAdsBanner.js";function te(t){return`
<header class="header" id="site-header" role="banner">
  <div class="container header__inner">
    <a href="index.html" class="header__logo" aria-label="\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A">
      <img src="./icons/icon-48x48.png" alt="\u0634\u0639\u0627\u0631 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A" width="36" height="36" decoding="async" class="header__logo-img"/>
      <div class="header__logo-text">
        <span class="header__logo-name">\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629</span>
      </div>
    </a>

    <div class="header-search-expandable" id="header-search-container" role="search">
      <div class="header-search-pill" id="header-search-pill">
        <button type="button" class="header-search-btn-trigger" id="header-search-trigger" aria-label="\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u062F\u0644\u064A\u0644" title="\u0628\u062D\u062B \u0633\u0631\u064A\u0639 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <input type="search" id="header-search-input" class="header-search-input"
               placeholder="\u0627\u0628\u062D\u062B \u0639\u0646 \u0645\u0643\u0627\u0646\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0635\u064A\u062F\u0644\u064A\u0629\u060C \u0645\u0637\u0639\u0645..."
               autocomplete="off" aria-label="\u0627\u0628\u062D\u062B \u0641\u064A \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629"/>
        <button type="button" class="header-search-clear-btn" id="header-search-clear" aria-label="\u0645\u0633\u062D \u0627\u0644\u0628\u062D\u062B" title="\u0645\u0633\u062D">\u2715</button>
      </div>

      <!-- Floating Live Results Dropdown -->
      <div class="header-live-dropdown" id="header-live-dropdown" aria-live="polite">
        <div class="header-live-dropdown__header">
          <span>\u26A1 \u0646\u062A\u0627\u0626\u062C \u0628\u062D\u062B \u0641\u0648\u0631\u064A\u0629:</span>
          <span class="header-live-dropdown__count" id="header-live-count">0</span>
        </div>
        <div class="header-live-dropdown__list" id="header-live-list"></div>
        <div class="header-live-dropdown__footer">
          <a href="search.html" class="header-live-dropdown__all-btn" id="header-live-all-btn">
            <span>\u0639\u0631\u0636 \u0643\u0627\u0641\u0629 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u0628\u062D\u062B</span>
            <span>\u2190</span>
          </a>
        </div>
      </div>
    </div>

    <nav class="header__nav" aria-label="\u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A">
      ${[["index.html","\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"],["places.html","\u0627\u0644\u0623\u0645\u0627\u0643\u0646"],["categories.html","\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A"],["offers.html","\u0627\u0644\u0639\u0631\u0648\u0636"],["now.html","\u064A\u062D\u062F\u062B \u0627\u0644\u0622\u0646 \u{1F525}"],["around-me.html","\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A \u{1F9ED}"],["favorites.html","\u2764\uFE0F \u0627\u0644\u0645\u0641\u0636\u0644\u0629"]].map(([s,o])=>`<a href="${s}" class="header__nav-link${s===t?" active":""}">${o}</a>`).join("")}
    </nav>
    
    <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u0648\u0627\u0644\u0646\u0647\u0627\u0631\u064A" title="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A / \u0627\u0644\u0641\u0627\u062A\u062D">
      <span class="theme-icon-light">\u2600\uFE0F</span>
      <span class="theme-icon-dark">\u{1F319}</span>
    </button>

    <div class="header__user" id="header-user-section">
      <a href="login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>
    </div>
  </div>
</header>`}function ae(t){if(t==="admin/index.html")return`
<nav class="bottom-nav bottom-nav--admin" id="admin-mobile-bottom-nav" role="navigation" aria-label="\u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629">
  <button type="button" data-admin-sec="overview" class="bottom-nav__item active">
    <span class="bottom-nav__icon">\u{1F4CA}</span>
    <span class="bottom-nav__label">\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A</span>
  </button>
  <button type="button" data-admin-sec="places" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u{1F4CD}</span>
    <span class="bottom-nav__label">\u0627\u0644\u0623\u0645\u0627\u0643\u0646</span>
  </button>
  <button type="button" data-admin-sec="verification" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u{1F6E1}\uFE0F</span>
    <span class="bottom-nav__label">\u0627\u0644\u062A\u0648\u062B\u064A\u0642</span>
  </button>
  <button type="button" data-admin-sec="categories" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u{1F4C1}</span>
    <span class="bottom-nav__label">\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A</span>
  </button>
  <button type="button" data-admin-sec="ads" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u{1F4E2}</span>
    <span class="bottom-nav__label">\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A</span>
  </button>
  <button type="button" data-admin-sec="settings" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u2699\uFE0F</span>
    <span class="bottom-nav__label">\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A</span>
  </button>
</nav>`;if(t==="dashboard.html")return`
<nav class="bottom-nav bottom-nav--dashboard" id="dash-mobile-bottom-nav" role="navigation" aria-label="\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645">
  <button type="button" data-dash-sec="overview" class="bottom-nav__item active">
    <span class="bottom-nav__icon">\u{1F4CA}</span>
    <span class="bottom-nav__label">\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629</span>
  </button>
  <button type="button" data-dash-sec="places" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u{1F3EA}</span>
    <span class="bottom-nav__label">\u0623\u0645\u0627\u0643\u0646\u064A</span>
  </button>
  <div class="bottom-nav__fab">
    <div class="fab-guide-bubble" id="fab-add-place-guide" role="tooltip">
      <span class="fab-guide-sparkle">\u2728</span>
      <span class="fab-guide-text">\u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646 \u062C\u062F\u064A\u062F</span>
      <span class="fab-guide-arrow"></span>
    </div>
    <button type="button" data-dash-sec="add" class="bottom-nav__fab-btn fab-btn--pulsing-glow" aria-label="\u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646" title="\u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646 \u062C\u062F\u064A\u062F">
      <span class="fab-icon-plus">\u2795</span>
      <span class="fab-sun-rays"></span>
    </button>
  </div>
  <button type="button" data-dash-sec="offers" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u{1F3F7}\uFE0F</span>
    <span class="bottom-nav__label">\u0627\u0644\u0639\u0631\u0648\u0636</span>
  </button>
  <button type="button" data-dash-sec="products" class="bottom-nav__item">
    <span class="bottom-nav__icon">\u{1F4E6}</span>
    <span class="bottom-nav__label">\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</span>
  </button>
</nav>`;const a=[["index.html","\u{1F3E0}","\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"],["categories.html","\u{1F4CB}","\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A"],["offers.html","\u{1F3F7}\uFE0F","\u0627\u0644\u0639\u0631\u0648\u0636"],["dashboard.html","\u{1F464}","\u062D\u0633\u0627\u0628\u064A"]];return`
<nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="\u062A\u0646\u0642\u0644 \u0633\u0631\u064A\u0639">
  <a href="${a[0][0]}" class="bottom-nav__item${a[0][0]===t?" active":""}">
    <span class="bottom-nav__icon">${a[0][1]}</span>
    <span class="bottom-nav__label">${a[0][2]}</span>
  </a>
  <a href="${a[1][0]}" class="bottom-nav__item${a[1][0]===t?" active":""}">
    <span class="bottom-nav__icon">${a[1][1]}</span>
    <span class="bottom-nav__label">${a[1][2]}</span>
  </a>
  <div class="bottom-nav__fab">
    <button type="button" class="bottom-nav__fab-btn bottom-nav__voice-assistant-fab" id="global-voice-assistant-fab" aria-label="\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A" title="\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A (M)">
      <span class="fab-letter-m">M</span>
      <span class="fab-pulse-ring"></span>
      <span class="fab-pulse-ring ring-2"></span>
      <span class="fab-mic-badge">\u{1F399}\uFE0F</span>
    </button>
  </div>
  <a href="${a[2][0]}" class="bottom-nav__item${a[2][0]===t?" active":""}">
    <span class="bottom-nav__icon">${a[2][1]}</span>
    <span class="bottom-nav__label">${a[2][2]}</span>
  </a>
  <a href="${a[3][0]}" class="bottom-nav__item${a[3][0]===t?" active":""}">
    <span class="bottom-nav__icon">${a[3][1]}</span>
    <span class="bottom-nav__label">${a[3][2]}</span>
  </a>
</nav>`}function ne(){return`
<footer class="footer" id="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a href="index.html" class="footer__logo">
          <img src="./icons/icon-48x48.png" alt="\u0634\u0639\u0627\u0631 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A" width="40" height="40" loading="lazy" decoding="async"/>
          <span class="footer__logo-name">\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A</span>
        </a>
        <p class="footer__description">
          \u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0631\u0642\u0645\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646\u060C \u0627\u0644\u0645\u062D\u0644\u0627\u062A\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0627\u0644\u062D\u0631\u0641\u064A\u064A\u0646 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629\u060C \u0627\u0644\u0645\u0637\u0631\u064A\u0629\u060C \u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629\u060C \u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629\u060C \u0645\u064A\u062A \u0633\u0644\u0633\u064A\u0644\u060C \u0627\u0644\u0628\u0635\u0631\u0627\u0637\u060C \u0627\u0644\u0639\u0632\u064A\u0632\u0629\u060C \u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629\u060C \u0627\u0644\u0631\u0648\u0636\u0629\u060C \u0627\u0644\u062D\u0648\u062A\u0629\u060C \u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629\u060C \u0645\u064A\u062A \u062E\u0636\u064A\u0631\u060C \u0645\u064A\u062A \u0634\u0631\u064A\u0641\u060C \u0648\u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629 \u0628\u0645\u062D\u0627\u0641\u0638\u0629 \u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629.
        </p>
        <div class="footer__apk-download" id="footer-apk-container" style="margin-top:18px">
          <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="apk-pro-download-btn" id="footer-apk-download-btn" title="\u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0644\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F APK">
            <div class="apk-btn-icon-box">
              <svg class="android-svg-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1557-.2698.0632-.6141-.2066-.7698-.2693-.1552-.6135-.0632-.7692.2066l-2.0231 3.5042c-1.4286-.6507-3.0373-1.0135-4.8786-1.0135-1.8412 0-3.45.3628-4.8785 1.0135L5.0995 5.301c-.1557-.2698-.5-.3618-.7692-.2066-.2698.1557-.3623.5-.2066.7698l1.996 3.4572C2.6806 11.2334.3333 15.1165.3333 19.6667h23.3334c0-4.5502-2.3473-8.4333-5.7867-10.3453"/>
              </svg>
            </div>
            <div class="apk-btn-text-box">
              <span class="apk-btn-sub">\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F \u0627\u0644\u0645\u0628\u0627\u0634\u0631</span>
              <span class="apk-btn-main">\u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 APK</span>
            </div>
            <div class="apk-btn-arrow-box">
              <svg class="download-arrow-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
          </a>
        </div>
      </div>
      <div>
        <h3 class="footer__col-title">\u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064A\u0639\u0629</h3>
        <ul class="footer__links">
          <li><a href="index.html"      class="footer__link">\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629</a></li>
          <li><a href="places.html"     class="footer__link">\u062F\u0644\u064A\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646</a></li>
          <li><a href="categories.html" class="footer__link">\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A</a></li>
          <li><a href="offers.html"     class="footer__link">\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u064A\u0648\u0645\u064A\u0629</a></li>
          <li><a href="products.html"   class="footer__link">\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u062F\u0644\u064A\u0644</h3>
        <ul class="footer__links">
          <li><a href="dashboard.html?section=add" class="footer__link">\u2795 \u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646 \u062C\u062F\u064A\u062F</a></li>
          <li><a href="dashboard.html"             class="footer__link">\u{1F4CA} \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645</a></li>
          <li><a href="search.html"                class="footer__link">\u{1F50D} \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645</a></li>
          <li><a href="manzala.html"               class="footer__link">\u{1F3DB}\uFE0F \u0639\u0646 \u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629</a></li>
          <li><a href="matariya.html"              class="footer__link">\u26F5 \u0639\u0646 \u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0637\u0631\u064A\u0629</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627</h3>
        <ul class="footer__links">
          <li><a href="contact.html"  class="footer__link">\u{1F4E7} \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627</a></li>
          <li><a href="legal.html"    class="footer__link">\u2696\uFE0F \u0642\u0627\u0646\u0648\u0646\u064A \u0648\u0625\u062E\u0644\u0627\u0621 \u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064A\u0629</a></li>
          <li><a href="privacy.html"  class="footer__link">\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629</a></li>
          <li><a href="terms.html"    class="footer__link">\u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p class="footer__copyright">\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${new Date().getFullYear()}).</p>
      <div class="footer__bottom-links">
        <a href="legal.html"   class="footer__bottom-link">\u0642\u0627\u0646\u0648\u0646\u064A</a>
        <a href="privacy.html" class="footer__bottom-link">\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629</a>
        <a href="terms.html"   class="footer__bottom-link">\u0627\u0644\u0634\u0631\u0648\u0637</a>
        <a href="contact.html" class="footer__bottom-link">\u062A\u0648\u0627\u0635\u0644</a>
      </div>
    </div>
  </div>

  <!-- Desktop Floating Voice FAB (Visible on Desktop >= 769px) -->
  <button type="button" class="desktop-voice-fab" id="desktop-voice-fab" aria-label="\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A" title="\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A (M)" data-voice-trigger="true">
    <span class="desktop-voice-fab__icon">\u{1F399}\uFE0F</span>
    <span class="desktop-voice-fab__pulse"></span>
  </button>

  <!-- Scroll to Top Floating Button -->
  <button type="button" class="scroll-to-top-btn" id="scroll-to-top-btn" aria-label="\u0627\u0644\u0635\u0639\u0648\u062F \u0644\u0623\u0639\u0644\u0649 \u0627\u0644\u0635\u0641\u062D\u0629" title="\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0623\u0639\u0644\u0649 \u0627\u0644\u0635\u0641\u062D\u0629">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  </button>
</footer>`}function oe(){return`
<div class="pwa-banner" id="pwa-banner" hidden role="dialog" aria-label="\u062A\u062B\u0628\u064A\u062A \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A">
  <div class="pwa-banner__rect">
    <div class="pwa-banner__lead">
      <img src="./icons/icon-96x96.png" alt="\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629" class="pwa-banner__rect-icon" width="42" height="42" loading="eager" decoding="async" />
      <div class="pwa-banner__rect-text">
        <strong class="pwa-banner__rect-title">\u062B\u0628\u062A \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A</strong>
        <span class="pwa-banner__rect-desc">\u0648\u062E\u0644\u064A\u0643 \u062F\u0627\u064A\u0645\u0627\u064B \u0645\u062A\u0627\u0628\u0639</span>
      </div>
    </div>
    <div class="pwa-banner__rect-actions">
      <button type="button" class="pwa-banner__rect-install" id="pwa-install-btn">\u062A\u062B\u0628\u064A\u062A</button>
      <button type="button" class="pwa-banner__rect-close" id="pwa-banner-close" aria-label="\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0646\u0628\u064A\u0647" title="\u0625\u063A\u0644\u0627\u0642">\u2715</button>
    </div>
  </div>
</div>`}export async function initPage(t=""){if(ie(),h("header-slot",te(t)),!t.includes("admin/")&&t!=="dashboard.html"){let e=document.getElementById("wide-ads-banner");if(!e&&t!=="index.html"&&t!==""){const n=document.getElementById("page-container")||document.querySelector("main");n&&(e=document.createElement("div"),e.id="wide-ads-banner",e.className="container",n.insertAdjacentElement("afterend",e))}e&&setTimeout(()=>ee(e),100)}h("footer-slot",ne()),h("nav-slot",ae(t)),h("pwa-slot",oe()),se(),re();try{G()}catch(e){console.warn("[initPage] voice FAB init failed:",e)}const a=document.getElementById("site-header"),s=document.getElementById("scroll-to-top-btn");window.addEventListener("scroll",()=>{const e=window.scrollY||window.pageYOffset||0;a?.classList.toggle("scrolled",e>8),s?.classList.toggle("visible",e>300)},{passive:!0}),s?.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})});try{ve()}catch(e){console.warn("[initPage] header search init failed:",e)}const o=e=>{"requestIdleCallback"in window?requestIdleCallback(e,{timeout:2500}):setTimeout(e,0)};o(async()=>{try{(await F(2500))?.auth&&R()}catch{}try{await be()}catch{}try{U(e=>{ce(e),J(e?.uid),Q(e)})}catch{}try{const n=(await K())?.contact?.whatsappLink;n&&document.querySelectorAll("[data-wa]").forEach(i=>{i.href=n})}catch{}});try{me()}catch(e){console.warn("[initPage] PWA setup failed:",e)}"serviceWorker"in navigator&&o(()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));try{["manzala_fast_places_cache","manzala_live_news_store_v2","manzala_global_broadcast_notifs_cache"].forEach(n=>localStorage.removeItem(n))}catch{}o(()=>{try{Y()}catch{}try{X()}catch{}try{le()}catch{}try{fe()}catch{}})}function se(){try{(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.matchMedia&&window.matchMedia("(display-mode: fullscreen)").matches||window.matchMedia&&window.matchMedia("(display-mode: minimal-ui)").matches||window.navigator.standalone===!0||document.referrer&&document.referrer.includes("android-app://")||navigator.userAgent&&(navigator.userAgent.includes("wv")||navigator.userAgent.includes("Android")&&navigator.userAgent.includes("Version/"))||new URLSearchParams(window.location.search).get("source")==="apk"||new URLSearchParams(window.location.search).get("source")==="pwa")&&document.querySelectorAll("#footer-apk-container, .footer__apk-download, .apk-pro-download-btn").forEach(a=>{a.style.display="none"})}catch{}}function ie(){const t=localStorage.getItem("elmanzala-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");$(t)}function re(){document.querySelectorAll("#theme-toggle-btn, .theme-toggle-btn").forEach(t=>{t.addEventListener("click",()=>{const s=(document.documentElement.getAttribute("data-theme")||"light")==="dark"?"light":"dark";$(s),localStorage.setItem("elmanzala-theme",s),r.info(s==="dark"?"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u{1F319}":"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A \u2600\uFE0F")})})}function $(t){document.documentElement.setAttribute("data-theme",t),document.body&&(document.body.classList.toggle("dark-theme",t==="dark"),document.body.classList.toggle("light-theme",t==="light"));const a=document.querySelector('meta[name="theme-color"]');a&&a.setAttribute("content",t==="dark"?"#0F172A":"#1B4F72")}function le(){const t=new Set,a=e=>{if(e)try{const n=new URL(e,location.href);if(n.origin===location.origin&&!t.has(n.href)){t.add(n.href);const i=document.createElement("link");i.rel="prefetch",i.href=n.href,document.head.appendChild(i)}}catch{}};document.addEventListener("mouseover",e=>{const n=e.target.closest("a[href]");n&&a(n.href)},{passive:!0}),document.addEventListener("touchstart",e=>{const n=e.target.closest("a[href]");n&&a(n.href)},{passive:!0});const s=["index.html","places.html","categories.html","offers.html","search.html"],o=()=>{s.forEach(e=>a(e))};"requestIdleCallback"in window?window.requestIdleCallback(o,{timeout:1500}):setTimeout(o,800)}export{W as waitForAuth,_ as isAdmin};function h(t,a){const s=document.getElementById(t);if(!s)return;const o=document.createElement("div");o.innerHTML=a.trim(),s.replaceWith(o.firstElementChild)}function ce(t){const a=document.getElementById("header-user-section");if(a)if(t){a.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px">
        <a href="dashboard.html?section=notifications" class="header-notif-btn" title="\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);color:var(--text-primary);text-decoration:none;font-size:16px;transition:all 0.2s">
          <span>\u{1F514}</span>
          <span id="header-notifs-badge" class="header-notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:9999px;border:1.5px solid #fff;min-width:16px;text-align:center">0</span>
        </a>

        <div style="position:relative">
          <button class="header__user-btn" id="usr-btn" aria-haspopup="true" aria-expanded="false">
            <img src="${he(t.photoURL||"./icons/icon-72x72.png")}"
                 class="header__avatar" width="32" height="32"
                 onerror="this.src='./icons/icon-72x72.png'"
                 alt="${C(t.name)}"/>
            <span class="header__user-name">${C((t.name||"").split(" ")[0])}</span>
            <span aria-hidden="true">\u25BE</span>
          </button>
          <div class="header__dropdown" id="usr-dd" role="menu">
            <a href="dashboard.html"                          class="header__dropdown-item" role="menuitem">\u{1F3E0} \u0644\u0648\u062D\u062A\u064A</a>
            <a href="dashboard.html?section=notifications"    class="header__dropdown-item" role="menuitem">\u{1F514} \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A</a>
            <a href="dashboard.html?section=add"              class="header__dropdown-item" role="menuitem">\u2795 \u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646</a>
            ${_(t)?'<a href="admin.html" class="header__dropdown-item" style="color:var(--secondary,#F5A623);font-weight:bold" role="menuitem">\u2699\uFE0F \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629</a>':""}
            <a href="dashboard.html?section=loyalty"          class="header__dropdown-item" role="menuitem">\u{1F381} \u0646\u0627\u062F\u064A \u0627\u0644\u0648\u0644\u0627\u0621 \u0648\u0627\u0644\u0646\u0642\u0627\u0637</a>
            <hr style="margin:4px 0;border:none;border-top:1px solid var(--border)"/>
            <button class="header__dropdown-item" id="logout-btn" role="menuitem" style="color:var(--danger)">\u{1F6AA} \u062E\u0631\u0648\u062C</button>
          </div>
        </div>
      </div>`;const s=document.getElementById("usr-btn"),o=document.getElementById("usr-dd");s&&o&&(s.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation();const n=o.classList.contains("open");o.classList.toggle("open",!n),s.setAttribute("aria-expanded",n?"false":"true")}),document.addEventListener("click",e=>{!e.target.closest("#usr-btn")&&!e.target.closest("#usr-dd")&&(o.classList.remove("open"),s.setAttribute("aria-expanded","false"))})),document.getElementById("logout-btn")?.addEventListener("click",async()=>{await N(),r.success("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D"),location.reload()})}else a.innerHTML='<a href="login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>'}let m=null;function de(){return typeof window>"u"?!1:!!(window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: window-controls-overlay)").matches||window.navigator.standalone||document.referrer.includes("android-app://")||localStorage.getItem("pwa-installed")==="true")}function pe(){try{const t=localStorage.getItem("pwa-dismissed");if(!t)return!1;const a=parseInt(t,10);return isNaN(a)?!0:Date.now()-a<336*60*60*1e3}catch{return!1}}function f(){if(de()||pe())return!1;try{if(sessionStorage.getItem("pwa_session_shown")==="true")return!1}catch{}return!0}function me(){try{localStorage.getItem("manzala_voice_guide_seen")||setTimeout(()=>{const t=document.getElementById("pwa-banner");(!t||t.hidden||!t.classList.contains("visible"))&&w()},3500)}catch{}f()&&(window.addEventListener("beforeinstallprompt",t=>{t.preventDefault(),m=t,setTimeout(()=>{f()&&T()},5e3)}),setTimeout(()=>{f()&&T()},7e3)),document.addEventListener("click",t=>{if(t.target.closest("#pwa-banner-close")||t.target.closest("#pwa-banner-later")){t.preventDefault(),u();return}if(t.target.closest("#pwa-install-btn")){t.preventDefault(),ue();return}if(t.target.closest("#desktop-voice-fab")){t.preventDefault();try{S()}catch{}return}})}function T(){if(!f())return;const t=document.getElementById("pwa-banner");if(t){try{sessionStorage.setItem("pwa_session_shown","true")}catch{}t.hidden=!1,t.style.display="block",requestAnimationFrame(()=>{t.classList.add("visible")})}}function u(){const t=document.getElementById("pwa-banner");t&&(t.classList.remove("visible"),setTimeout(()=>{t.hidden=!0,t.style.display="none"},350));try{localStorage.setItem("pwa-dismissed",Date.now().toString()),sessionStorage.setItem("pwa_session_shown","true")}catch{}w()}async function ue(){if(m)try{m.prompt();const{outcome:t}=await m.userChoice;t==="accepted"?(localStorage.setItem("pwa-installed","true"),u(),r.success("\u062A\u0645 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0646\u062C\u0627\u062D! \u0633\u062A\u062C\u062F\u0647 \u0641\u064A \u0634\u0627\u0634\u0629 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0647\u0627\u062A\u0641\u0643 \u{1F389}"),setTimeout(()=>w(),1200)):u(),m=null}catch{u()}else/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream?r.info('\u0644\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0639\u0644\u0649 \u0627\u0644\u0622\u064A\u0641\u0648\u0646: \u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0632\u0631 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u238B \u062B\u0645 \u0627\u062E\u062A\u0631 "\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629" \u2795',7e3):r.info('\u0644\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642: \u0627\u0641\u062A\u062D \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062A\u0635\u0641\u062D (\u22EE) \u0648\u0627\u062E\u062A\u0631 "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642" (Install app)'),u()}function w(){if(!(typeof document>"u")){try{if(localStorage.getItem("manzala_voice_guide_seen")==="true")return;localStorage.setItem("manzala_voice_guide_seen","true")}catch{return}setTimeout(()=>{const t=window.innerWidth>=769;let a=null;if(t?a=document.getElementById("desktop-voice-fab")||document.getElementById("global-voice-assistant-fab"):a=document.getElementById("global-voice-assistant-fab")||document.querySelector(".bottom-nav__fab-btn")||document.querySelector(".bottom-nav__fab"),!a)return;document.getElementById("voice-guide-callout")?.remove();const s=document.createElement("div");s.className="voice-guide-callout",s.id="voice-guide-callout",s.setAttribute("role","tooltip"),s.innerHTML=`
      <div class="voice-guide-callout__bubble" id="voice-guide-bubble">
        <button type="button" class="voice-guide-callout__close" id="voice-guide-callout-close" aria-label="\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0644\u0645\u064A\u062D" title="\u0625\u063A\u0644\u0627\u0642">\u2715</button>
        <div class="voice-guide-callout__body">
          <span class="voice-guide-callout__text">\u0645\u0645\u0643\u0646 \u062A\u0628\u062D\u062B \u0628\u0627\u0644\u0635\u0648\u062A \u0645\u0646 \u0647\u0646\u0627</span>
          <span class="voice-guide-callout__mic">\u{1F399}\uFE0F</span>
        </div>
      </div>
      <div class="voice-guide-callout__arrow-wrap">
        <svg class="voice-guide-callout__arrow" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="3" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    `,document.body.appendChild(s),a.classList.add("voice-mic-highlighted");const o=()=>{s.classList.add("fade-out"),a?.classList.remove("voice-mic-highlighted"),setTimeout(()=>s.remove(),350)};s.querySelector("#voice-guide-callout-close")?.addEventListener("click",n=>{n.stopPropagation(),o()}),s.querySelector("#voice-guide-bubble")?.addEventListener("click",n=>{if(!n.target.closest("#voice-guide-callout-close")){o();try{S()}catch{}}}),a.addEventListener("click",o,{once:!0});const e=n=>{!s.contains(n.target)&&!a.contains(n.target)&&(o(),document.removeEventListener("click",e))};setTimeout(()=>{document.addEventListener("click",e)},400),setTimeout(()=>{document.body.contains(s)&&(o(),document.removeEventListener("click",e))},9e3)},500)}}function C(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function he(t){return t?String(t).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function fe(){if(typeof window>"u")return;const t=new Date().getFullYear(),a=()=>{try{console.log(`%c\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${t}).`,"background: linear-gradient(135deg, #0B2239, #153A5C); color: #F5A623; font-size: 16px; font-weight: 800; padding: 12px 20px; border-radius: 8px; border: 2px solid #F5A623; font-family: Cairo, Tahoma, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.5);"),console.log(`%c\u26A0\uFE0F \u062A\u062D\u0630\u064A\u0631 \u0642\u0627\u0646\u0648\u0646\u064A \u0631\u0633\u0645\u064A:
\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0645\u0633\u062C\u0644\u0629 \u0648\u0645\u062D\u0645\u064A\u0629 \u0631\u0642\u0645\u064A\u0627\u064B\u060C \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0646\u0642\u0644\u0647\u0627 \u0623\u0648 \u0646\u0633\u062E\u0647\u0627 \u062D\u062A\u0649 \u0644\u0627 \u064A\u062A\u0645 \u0645\u0633\u0627\u0621\u0644\u062A\u0643 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u0623\u0645\u0627\u0645 \u0627\u0644\u0645\u062D\u0627\u0643\u0645 \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629.`,"color: #EF4444; font-size: 13px; font-weight: 700; line-height: 1.8; font-family: Cairo, Tahoma, sans-serif;"),console.log("%c\u0631\u0627\u0628\u0637 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629: %chttps://dalilmanzala.com/","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #0284C7; font-size: 11px; font-weight: 700; text-decoration: underline;"),console.log("%c\u{1F4AC} \u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A: %chttps://wa.me/wasendernew","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #10B981; font-size: 11px; font-weight: 700; text-decoration: underline;")}catch{}};a();let s=window.outerWidth-window.innerWidth,o=window.outerHeight-window.innerHeight;window.addEventListener("resize",()=>{const e=window.outerWidth-window.innerWidth,n=window.outerHeight-window.innerHeight;(e!==s||n!==o)&&(s=e,o=n,a())},{passive:!0}),document.addEventListener("contextmenu",e=>{const n=e.target.tagName.toLowerCase();n==="input"||n==="textarea"||e.target.isContentEditable||(e.preventDefault(),typeof r<"u"&&r.info&&r.info("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0645\u064A\u0629 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u2014 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0646\u0633\u062E \u0623\u0648 \u0646\u0642\u0644 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("copy",e=>{const n=e.target.tagName?e.target.tagName.toLowerCase():"";n==="input"||n==="textarea"||e.target.isContentEditable||(e.preventDefault(),e.clipboardData&&e.clipboardData.setData("text/plain",`\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${t}). https://dalilmanzala.com/`),typeof r<"u"&&r.warning&&r.warning("\u26A0\uFE0F \u062A\u0645 \u062D\u0641\u0638 \u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0644\u0643\u064A\u0629: \u0644\u0627 \u064A\u062C\u0648\u0632 \u0646\u0633\u062E \u0623\u0648 \u0627\u0642\u062A\u0628\u0627\u0633 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("cut",e=>{const n=e.target.tagName?e.target.tagName.toLowerCase():"";n==="input"||n==="textarea"||e.target.isContentEditable||e.preventDefault()}),document.addEventListener("keydown",e=>{const n=e.target.tagName?e.target.tagName.toLowerCase():"",i=n==="input"||n==="textarea"||e.target.isContentEditable;(e.key==="F12"||e.ctrlKey&&e.shiftKey&&(e.key==="I"||e.key==="i"||e.key==="J"||e.key==="j"||e.key==="C"||e.key==="c"))&&a(),e.ctrlKey&&(e.key==="u"||e.key==="U"||e.key==="s"||e.key==="S"||e.key==="p"||e.key==="P")&&(e.preventDefault(),typeof r<"u"&&r.warning&&r.warning("\u{1F512} \u0645\u0635\u062F\u0631 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644 \u0645\u062D\u0645\u064A\u0629 \u0628\u0645\u0648\u062C\u0628 \u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0627\u0644\u0641\u0643\u0631\u064A\u0629.")),e.ctrlKey&&(e.key==="c"||e.key==="C")&&!i&&(window.getSelection?window.getSelection().toString():"").length>0&&(e.preventDefault(),typeof r<"u"&&r.warning&&r.warning("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0645\u062D\u0645\u064A: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0646\u0633\u062E \u0644\u0645\u0646\u0639 \u0627\u0644\u062A\u0639\u062F\u064A \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A."))})}async function be(){try{const t=j();if(t&&_(t))return;if(t&&t.status==="suspended"){A("\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u062D\u0633\u0627\u0628\u0643 \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629 \u0644\u0645\u062E\u0627\u0644\u0641\u0629 \u0627\u0644\u0634\u0631\u0648\u0637.");return}const a=await O();if(a){const s=await V(a);if(s){const o=s.reason||"\u0645\u062E\u0627\u0644\u0641\u0629 \u0645\u0639\u0627\u064A\u064A\u0631 \u0648\u0633\u064A\u0627\u0633\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629",e=s.bannedUntil?new Date(s.bannedUntil).toLocaleDateString("ar-EG"):null,n=s.isPermanent?`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${a}) \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u0646\u0635\u0629 \u0628\u0633\u0628\u0628: ${o}`:`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${a}) \u062D\u062A\u0649 ${e} \u0628\u0633\u0628\u0628: ${o}`;A(n)}}}catch(t){console.debug("[_enforceBanGuard] notice:",t)}}function A(t){document.body.innerHTML=`
    <div style="min-height:100vh;background:#06101E;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif;direction:rtl;text-align:center">
      <div style="max-width:540px;background:#0F273D;border:1px solid rgba(239,68,68,0.4);border-radius:20px;padding:36px 24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
        <div style="font-size:64px;margin-bottom:16px">\u{1F6AB}</div>
        <h1 style="color:#EF4444;font-size:1.8rem;margin-bottom:12px;font-weight:900">\u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin-bottom:24px;background:rgba(239,68,68,0.1);padding:14px;border-radius:12px;border:1px dashed rgba(239,68,68,0.3)">
          ${t}
        </p>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;margin-bottom:24px">
          \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A \u064A\u0644\u062A\u0632\u0645 \u0628\u062D\u0645\u0627\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0647 \u0648\u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0646\u0632\u0627\u0647\u0629 \u0648\u0623\u0645\u0627\u0646 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062D\u0644\u064A. \u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0631\u0649 \u0623\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u062A\u0645 \u0628\u0627\u0644\u062E\u0637\u0623\u060C \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u0629.
        </div>
        <a href="https://wa.me/wasendernew" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#000;font-weight:800;padding:12px 24px;border-radius:12px;text-decoration:none">
          <span>\u{1F4AC}</span>
          <span>\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628</span>
        </a>
      </div>
    </div>
  `}function ve(){const t=document.getElementById("header-search-container"),a=document.getElementById("header-search-pill"),s=document.getElementById("header-search-trigger"),o=document.getElementById("header-search-input"),e=document.getElementById("header-search-clear"),n=document.getElementById("header-live-dropdown"),i=document.getElementById("header-live-list"),p=document.getElementById("header-live-count"),y=document.getElementById("header-live-all-btn");if(!o)return;let k=null,x=0;const M=()=>{a?.classList.add("expanded"),o.focus(),o.value.trim().length>=1&&n?.classList.add("visible")},z=()=>{a?.classList.remove("expanded"),n?.classList.remove("visible")};s?.addEventListener("click",l=>{l.stopPropagation(),a?.classList.contains("expanded")&&o.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(o.value.trim())}`:M()}),o.addEventListener("focus",()=>{a?.classList.add("expanded"),o.value.trim().length>=1&&i?.children.length>0&&n?.classList.add("visible")}),e?.addEventListener("click",l=>{l.stopPropagation(),o.value="",e.classList.remove("visible"),n?.classList.remove("visible"),i&&(i.innerHTML=""),o.focus()}),o.addEventListener("keydown",l=>{l.key==="Enter"&&o.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(o.value.trim())}`:l.key==="Escape"&&z()}),o.addEventListener("input",()=>{const l=o.value.trim();if(e?.classList.toggle("visible",l.length>0),y&&(y.href=`search.html?q=${encodeURIComponent(l)}`),!l){n?.classList.remove("visible"),i&&(i.innerHTML="");return}clearTimeout(k),k=setTimeout(async()=>{const D=++x;try{const d=await Z(l,{limit:6});if(D!==x||!n||!i)return;if(!d||d.length===0){p&&(p.textContent="0"),i.innerHTML=`
            <div class="header-live-empty">
              <div class="header-live-empty__icon">\u{1F50D}</div>
              <div class="header-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="header-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,n.classList.add("visible");return}p&&(p.textContent=String(d.length)),i.innerHTML=d.map(v=>{const c=v.raw||v,g=c.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",L=c.categoryName||v.category||"",P=c.area||c.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",H=c.slug||c.id||"",E=c.photoURL||c.logo||c.coverURL||"",q=c.isVerified||!1,I=c.isOpen!==void 0?c.isOpen:!0,B=(g.trim()[0]||"\u0645").toUpperCase();return`
            <a href="/place.html?slug=${encodeURIComponent(H)}" class="header-live-dropdown__item" role="option">
              <div class="header-live-avatar">
                ${E?`<img src="${E}" alt="${b(g)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'header-live-avatar-fallback\\'>${B}</div>'"/>`:`<div class="header-live-avatar-fallback">${B}</div>`}
              </div>
              <div class="header-live-content">
                <div class="header-live-title-row">
                  <span class="header-live-name">${b(g)}</span>
                  ${q?'<span class="header-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="header-live-meta-row">
                  ${L?`<span class="header-live-cat">${b(L)}</span>`:""}
                  <span class="header-live-area">${b(P)}</span>
                  <span class="${I?"header-live-status-open":"header-live-status-closed"}">
                    ${I?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
            </a>
          `}).join(""),n.classList.add("visible")}catch(d){console.warn("[HeaderLiveSearch] search error:",d)}},120)}),document.addEventListener("click",l=>{t?.contains(l.target)||(n?.classList.remove("visible"),window.innerWidth<=767&&a?.classList.remove("expanded"))})}function b(t){return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
