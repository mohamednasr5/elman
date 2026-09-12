import{initAuth as X,onAuthStateChange as Z,signOut as j,waitForAuth as G,isAdmin as $,getCurrentUser as K,getClientIp as ee,signInWithGoogle as te}from"./auth.js";import{toast as p}from"../ui/components/Toast.js";function ae(a){const n=[["/index.html","\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"],["/popular.html","\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629 \u{1F525}"],["/places.html","\u0627\u0644\u0623\u0645\u0627\u0643\u0646"],["/categories.html","\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A"],["/offers.html","\u0627\u0644\u0639\u0631\u0648\u0636"],["/now.html","\u0637\u0644\u0628\u0627\u062A \u0623\u0647\u0627\u0644\u064A\u0646\u0627 \u{1F91D}"],["/around-me.html","\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A \u{1F9ED}"],["/favorites.html","\u2764\uFE0F \u0627\u0644\u0645\u0641\u0636\u0644\u0629"]],i=e=>String(e||"").replace(/^\/+/,""),t=i(a);return`
<header class="header" id="site-header" role="banner">
  <div class="container header__inner">
    <a href="/index.html" class="header__logo" aria-label="\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A">
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
          <a href="/search.html" class="header-live-dropdown__all-btn" id="header-live-all-btn">
            <span>\u0639\u0631\u0636 \u0643\u0627\u0641\u0629 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u0628\u062D\u062B</span>
            <span>\u2190</span>
          </a>
        </div>
      </div>
    </div>

    <nav class="header__nav" aria-label="\u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A">
      ${n.map(([e,s])=>`<a href="${e}" class="header__nav-link${i(e)===t?" active":""}">${s}</a>`).join("")}
    </nav>
    
    <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u0648\u0627\u0644\u0646\u0647\u0627\u0631\u064A" title="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A / \u0627\u0644\u0641\u0627\u062A\u062D">
      <span class="theme-icon-light">\u2600\uFE0F</span>
      <span class="theme-icon-dark">\u{1F319}</span>
    </button>

    <div class="header__user" id="header-user-section">
      <a href="/login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>
    </div>
  </div>
</header>`}function ne(a){if(a==="admin/index.html")return`
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
</nav>`;if(a==="dashboard.html")return`
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
  <button type="button" data-dash-sec="more" class="bottom-nav__item" id="dash-bottom-more-btn" aria-label="\u0627\u0644\u0645\u0632\u064A\u062F">
    <span class="bottom-nav__icon">\u2630</span>
    <span class="bottom-nav__label">\u0627\u0644\u0645\u0632\u064A\u062F</span>
  </button>
</nav>`;const n=[["/index.html","\u{1F3E0}","\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"],["/categories.html","\u{1F4CB}","\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A"],["/offers.html","\u{1F3F7}\uFE0F","\u0627\u0644\u0639\u0631\u0648\u0636"],["#more","\u2630","\u0627\u0644\u0645\u0632\u064A\u062F"]],i=e=>String(e||"").replace(/^\/+/,""),t=i(a);return`
<nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="\u062A\u0646\u0642\u0644 \u0633\u0631\u064A\u0639">
  <a href="${n[0][0]}" class="bottom-nav__item${i(n[0][0])===t?" active":""}">
    <span class="bottom-nav__icon">${n[0][1]}</span>
    <span class="bottom-nav__label">${n[0][2]}</span>
  </a>
  <a href="${n[1][0]}" class="bottom-nav__item${i(n[1][0])===t?" active":""}">
    <span class="bottom-nav__icon">${n[1][1]}</span>
    <span class="bottom-nav__label">${n[1][2]}</span>
  </a>
  <div class="bottom-nav__fab">
    <button type="button" class="bottom-nav__fab-btn bottom-nav__voice-assistant-fab" id="global-voice-assistant-fab" aria-label="\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A" title="\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0630\u0643\u064A (M)">
      <span class="fab-letter-m">M</span>
      <span class="fab-pulse-ring"></span>
      <span class="fab-pulse-ring ring-2"></span>
      <span class="fab-mic-badge">\u{1F399}\uFE0F</span>
    </button>
  </div>
  <a href="${n[2][0]}" class="bottom-nav__item${i(n[2][0])===t?" active":""}">
    <span class="bottom-nav__icon">${n[2][1]}</span>
    <span class="bottom-nav__label">${n[2][2]}</span>
  </a>
  <button type="button" class="bottom-nav__item" id="bottom-nav-more-btn" aria-label="\u0627\u0644\u0645\u0632\u064A\u062F">
    <span class="bottom-nav__icon">${n[3][1]}</span>
    <span class="bottom-nav__label">${n[3][2]}</span>
  </button>
</nav>`}function se(){return`
<footer class="footer" id="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a href="/index.html" class="footer__logo">
          <img src="./icons/icon-48x48.png" alt="\u0634\u0639\u0627\u0631 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A" width="40" height="40" loading="lazy" decoding="async"/>
          <span class="footer__logo-name">\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A</span>
        </a>
        <p class="footer__description">
          \u062F\u0644\u064A\u0644\u0643 \u0627\u0644\u0631\u0642\u0645\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646\u060C \u0627\u0644\u0645\u062D\u0644\u0627\u062A\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0627\u0644\u062D\u0631\u0641\u064A\u064A\u0646 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u0629\u060C \u0627\u0644\u0645\u0637\u0631\u064A\u0629\u060C \u0627\u0644\u0639\u0635\u0627\u0641\u0631\u0629\u060C \u0627\u0644\u062C\u0645\u0627\u0644\u064A\u0629\u060C \u0645\u064A\u062A \u0633\u0644\u0633\u064A\u0644\u060C \u0627\u0644\u0628\u0635\u0631\u0627\u0637\u060C \u0627\u0644\u0639\u0632\u064A\u0632\u0629\u060C \u0627\u0644\u0623\u062D\u0645\u062F\u064A\u0629\u060C \u0627\u0644\u0631\u0648\u0636\u0629\u060C \u0627\u0644\u062D\u0648\u062A\u0629\u060C \u0627\u0644\u0646\u0633\u0627\u064A\u0645\u0629\u060C \u0645\u064A\u062A \u062E\u0636\u064A\u0631\u060C \u0645\u064A\u062A \u0634\u0631\u064A\u0641\u060C \u0648\u0643\u0627\u0641\u0629 \u0627\u0644\u0642\u0631\u0649 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629 \u0628\u0645\u062D\u0627\u0641\u0638\u0629 \u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629.
        </p>
        <div class="footer__apk-download" id="footer-apk-container" style="margin-top:18px">
          <a href="/dalilmanzala.apk" download="dalilmanzala.apk" class="apk-pro-download-btn" id="footer-apk-download-btn" title="\u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0644\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F APK">
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
          <li><a href="/index.html"      class="footer__link">\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629</a></li>
          <li><a href="/popular.html"    class="footer__link">\u{1F525} \u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629</a></li>
          <li><a href="/places.html"     class="footer__link">\u062F\u0644\u064A\u0644 \u0627\u0644\u0623\u0645\u0627\u0643\u0646</a></li>
          <li><a href="/categories.html" class="footer__link">\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A</a></li>
          <li><a href="/offers.html"     class="footer__link">\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u064A\u0648\u0645\u064A\u0629</a></li>
          <li><a href="/products.html"   class="footer__link">\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u062F\u0644\u064A\u0644</h3>
        <ul class="footer__links">
          <li><a href="/dashboard.html?section=add" class="footer__link">\u2795 \u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646 \u062C\u062F\u064A\u062F</a></li>
          <li><a href="/dashboard.html"             class="footer__link">\u{1F4CA} \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645</a></li>
          <li><a href="/search.html"                class="footer__link">\u{1F50D} \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645</a></li>
          <li><a href="/manzala.html"               class="footer__link">\u{1F3DB}\uFE0F \u0639\u0646 \u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629</a></li>
          <li><a href="/matariya.html"              class="footer__link">\u26F5 \u0639\u0646 \u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0637\u0631\u064A\u0629</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627</h3>
        <ul class="footer__links">
          <li><a href="/contact.html"  class="footer__link">\u{1F4E7} \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627</a></li>
          <li><a href="/legal.html"    class="footer__link">\u2696\uFE0F \u0642\u0627\u0646\u0648\u0646\u064A \u0648\u0625\u062E\u0644\u0627\u0621 \u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064A\u0629</a></li>
          <li><a href="/privacy.html"  class="footer__link">\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629</a></li>
          <li><a href="/terms.html"    class="footer__link">\u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645</a></li>
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
</footer>`}function ie(){return`
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
</div>`}export function getAdsBannerPlacement(a="",n=""){const i=String(a||"").toLowerCase(),t=typeof window<"u"&&window.location?window.location.pathname.toLowerCase():"",e=typeof window<"u"&&window.location?window.location.search:"",s=String(n||(e?new URLSearchParams(e).get("section"):"")||"").toLowerCase();return i.includes("place.html")||i==="place"||i.startsWith("/p/")||i.includes("/p/")||i.includes("/place/")||t.includes("place.html")||t.startsWith("/p/")||t.includes("/place/")||i.includes("admin")||t.includes("admin.html")||t.includes("/admin")||i.includes("quran")||i.includes("hadith")||t.includes("quran")||t.includes("hadith")||i.includes("contact.html")||t.includes("contact.html")||i.includes("login")||t.includes("login.html")||t.includes("/login")||t.endsWith("login.html")?"none":i.includes("dashboard")||t.includes("dashboard.html")||t.includes("/dashboard")?s==="add"||s==="add-place"||s==="edit"||s==="edit-place"?"none":"bottom":i==="index.html"||i==="home"||t==="/"||t.endsWith("/index.html")||t.endsWith("/")?"home":i.includes("places.html")||t.includes("places.html")||i.includes("categories.html")||i.includes("category.html")||t.includes("categories.html")||t.includes("category.html")||t.includes("/category/")||i.includes("offers.html")||t.includes("offers.html")||i.includes("now.html")||t.includes("now.html")||i.includes("around-me.html")||t.includes("around-me.html")?"top":"bottom"}export function updateAdsBannerPlacement(a="",n=""){if(typeof window>"u"||typeof document>"u")return;const i=getAdsBannerPlacement(a,n);let t=document.getElementById("wide-ads-banner");if(i==="none"){t&&(t.style.display="none");return}if(i==="home"){const e=(s=0)=>{const o=document.getElementById("wide-ads-banner");o&&!o.dataset.wideAdsMounted?import("../ui/components/WideAdsBanner.js").then(({mountWideAdsBanner:r})=>r(o)).catch(()=>{}):!o&&s<25&&setTimeout(()=>e(s+1),100)};e();return}if(t||(t=document.createElement("div"),t.id="wide-ads-banner",t.className="container"),t.style.display="",i==="top"){t.className="container wide-ads-banner-page-top",t.style.marginTop="calc(var(--header-height, 64px) + 20px)",t.style.marginBottom="20px";const e=document.getElementById("site-header")||document.getElementById("header-slot"),s=document.getElementById("page-container")||document.querySelector("main")||document.getElementById("app");s&&s.parentNode?(t.nextSibling!==s||t.parentNode!==s.parentNode)&&s.parentNode.insertBefore(t,s):e&&e.nextSibling&&e.parentNode?t.previousSibling!==e&&e.parentNode.insertBefore(t,e.nextSibling):document.body.contains(t)||document.body.insertBefore(t,document.body.firstChild)}else if(i==="bottom"){t.className="container wide-ads-banner-page-bottom",t.style.marginTop="28px",t.style.marginBottom="28px";const e=document.getElementById("pwa-slot"),s=document.getElementById("footer-slot"),o=document.getElementById("nav-slot"),r=document.getElementById("page-container")||document.querySelector("main");e&&e.parentNode?(t.nextSibling!==e||t.parentNode!==e.parentNode)&&e.parentNode.insertBefore(t,e):s&&s.parentNode?(t.nextSibling!==s||t.parentNode!==s.parentNode)&&s.parentNode.insertBefore(t,s):o&&o.parentNode?(t.nextSibling!==o||t.parentNode!==o.parentNode)&&o.parentNode.insertBefore(t,o):r&&r.nextSibling&&r.parentNode?r.parentNode.insertBefore(t,r.nextSibling):document.body.contains(t)||document.body.appendChild(t)}t.dataset.wideAdsMounted||import("../ui/components/WideAdsBanner.js").then(({mountWideAdsBanner:e})=>e(t)).catch(()=>{})}typeof window<"u"&&(window.updateAdsBannerPlacement=updateAdsBannerPlacement,window.getAdsBannerPlacement=getAdsBannerPlacement);export async function initPage(a=""){le(),I("header-slot",ae(a)),I("footer-slot",se()),I("nav-slot",ne(a)),I("pwa-slot",ie()),updateAdsBannerPlacement(a),oe(),re();try{import("../services/voice.service.js").then(({bindGlobalVoiceAssistantFab:e})=>e()).catch(e=>console.warn("[initPage] voice FAB init failed:",e))}catch(e){console.warn("[initPage] voice FAB import failed:",e)}const n=document.getElementById("site-header"),i=document.getElementById("scroll-to-top-btn");window.addEventListener("scroll",()=>{const e=window.scrollY||window.pageYOffset||0;n?.classList.toggle("scrolled",e>8),i?.classList.toggle("visible",e>300)},{passive:!0}),i?.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})});try{be()}catch(e){console.warn("[initPage] header search init failed:",e)}document.addEventListener("click",e=>{(e.target.closest("#bottom-nav-more-btn")||e.target.closest("#dash-bottom-more-btn"))&&(e.preventDefault(),openDashboardMoreModal())});const t=e=>{"requestIdleCallback"in window?requestIdleCallback(e,{timeout:2500}):setTimeout(e,0)};t(async()=>{try{const{ensureFirebaseReady:e}=await import("./firebase.js");(await e(2500))?.auth&&X()}catch{}try{await ve()}catch{}try{const[{initLiveNotificationSubscriber:e},{initFcmMessaging:s}]=await Promise.all([import("../services/notification.service.js"),import("../services/fcm.service.js")]);Z(o=>{de(o),e(o?.uid),s(o)})}catch{}try{const{getSettings:e}=await import("./db.js"),o=(await e())?.contact?.whatsappLink;o&&document.querySelectorAll("[data-wa]").forEach(r=>{r.href=o})}catch{}});try{ue()}catch(e){console.warn("[initPage] PWA setup failed:",e)}"serviceWorker"in navigator&&t(()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));try{["manzala_fast_places_cache","manzala_live_news_store_v2","manzala_global_broadcast_notifs_cache"].forEach(s=>localStorage.removeItem(s))}catch{}t(()=>{import("../services/realtime-sync.service.js").then(({initRealtimePwaSyncBus:e})=>e()).catch(()=>{}),import("../utils/mobile-tooltip.js").then(({initUniversalMobileTouchTooltips:e})=>e()).catch(()=>{});try{ce()}catch{}try{ge()}catch{}})}function oe(){try{(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.matchMedia&&window.matchMedia("(display-mode: fullscreen)").matches||window.matchMedia&&window.matchMedia("(display-mode: minimal-ui)").matches||window.navigator.standalone===!0||document.referrer&&document.referrer.includes("android-app://")||navigator.userAgent&&(navigator.userAgent.includes("wv")||navigator.userAgent.includes("Android")&&navigator.userAgent.includes("Version/"))||new URLSearchParams(window.location.search).get("source")==="apk"||new URLSearchParams(window.location.search).get("source")==="pwa")&&document.querySelectorAll("#footer-apk-container, .footer__apk-download, .apk-pro-download-btn").forEach(n=>{n.style.display="none"})}catch{}}function le(){const a=localStorage.getItem("elmanzala-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");V(a)}function re(){document.querySelectorAll("#theme-toggle-btn, .theme-toggle-btn").forEach(a=>{a.addEventListener("click",()=>{const i=(document.documentElement.getAttribute("data-theme")||"light")==="dark"?"light":"dark";V(i),localStorage.setItem("elmanzala-theme",i),p.info(i==="dark"?"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u{1F319}":"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A \u2600\uFE0F")})})}function V(a){document.documentElement.setAttribute("data-theme",a),document.body&&(document.body.classList.toggle("dark-theme",a==="dark"),document.body.classList.toggle("light-theme",a==="light"));const n=document.querySelector('meta[name="theme-color"]');n&&n.setAttribute("content",a==="dark"?"#0F172A":"#1B4F72")}function ce(){const a=new Set,n=e=>{if(e)try{const s=document.baseURI||location.origin,o=new URL(e,s);if(o.origin===location.origin&&!a.has(o.href)){a.add(o.href);const r=document.createElement("link");r.rel="prefetch",r.href=o.href,document.head.appendChild(r)}}catch{}};document.addEventListener("mouseover",e=>{const s=e.target.closest("a[href]");s&&n(s.getAttribute("href"))},{passive:!0}),document.addEventListener("touchstart",e=>{const s=e.target.closest("a[href]");s&&n(s.getAttribute("href"))},{passive:!0});const i=["/index.html","/popular.html","/places.html","/categories.html","/offers.html","/search.html"],t=()=>{i.forEach(e=>n(e))};"requestIdleCallback"in window?window.requestIdleCallback(t,{timeout:1500}):setTimeout(t,800)}export{G as waitForAuth,$ as isAdmin};function I(a,n){const i=document.getElementById(a);if(!i)return;const t=document.createElement("div");t.innerHTML=n.trim(),i.replaceWith(t.firstElementChild)}function de(a){const n=document.getElementById("header-user-section");if(n)if(a){n.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px">
        <a href="dashboard.html?section=notifications" class="header-notif-btn" title="\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);color:var(--text-primary);text-decoration:none;font-size:16px;transition:all 0.2s">
          <span>\u{1F514}</span>
          <span id="header-notifs-badge" class="header-notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:9999px;border:1.5px solid #fff;min-width:16px;text-align:center">0</span>
        </a>

        <div style="position:relative">
          <button class="header__user-btn" id="usr-btn" aria-haspopup="true" aria-expanded="false">
            <img src="${O(a.photoURL||"./icons/icon-72x72.png")}"
                 class="header__avatar" width="32" height="32"
                 onerror="this.src='./icons/icon-72x72.png'"
                 alt="${z(a.name)}"/>
            <span class="header__user-name">${z((a.name||"").split(" ")[0])}</span>
            <span aria-hidden="true">\u25BE</span>
          </button>
          <div class="header__dropdown" id="usr-dd" role="menu">
            <a href="dashboard.html"                          class="header__dropdown-item" role="menuitem">\u{1F3E0} \u0644\u0648\u062D\u062A\u064A</a>
            <a href="dashboard.html?section=notifications"    class="header__dropdown-item" role="menuitem">\u{1F514} \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A</a>
            <a href="dashboard.html?section=add&action=scan"  class="header__dropdown-item" role="menuitem" style="color:#059669;font-weight:700">\u{1F4F8} \u062A\u0635\u0648\u064A\u0631 \u0643\u0627\u0631\u062A \u0627\u0644\u0645\u062D\u0644 (AI)</a>
            <a href="dashboard.html?section=add"              class="header__dropdown-item" role="menuitem">\u2795 \u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646</a>
            ${$(a)?'<a href="admin.html" class="header__dropdown-item" style="color:var(--secondary,#F5A623);font-weight:bold" role="menuitem">\u2699\uFE0F \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629</a>':""}
            <a href="dashboard.html?section=loyalty"          class="header__dropdown-item" role="menuitem">\u{1F381} \u0646\u0627\u062F\u064A \u0627\u0644\u0648\u0644\u0627\u0621 \u0648\u0627\u0644\u0646\u0642\u0627\u0637</a>
            <hr style="margin:4px 0;border:none;border-top:1px solid var(--border)"/>
            <button class="header__dropdown-item" id="logout-btn" role="menuitem" style="color:var(--danger)">\u{1F6AA} \u062E\u0631\u0648\u062C</button>
          </div>
        </div>
      </div>`;const i=document.getElementById("usr-btn"),t=document.getElementById("usr-dd");i&&t&&(i.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),window.innerWidth<769){openDashboardMoreModal(a);return}const s=t.classList.contains("open");t.classList.toggle("open",!s),i.setAttribute("aria-expanded",s?"false":"true")}),document.addEventListener("click",e=>{!e.target.closest("#usr-btn")&&!e.target.closest("#usr-dd")&&(t.classList.remove("open"),i.setAttribute("aria-expanded","false"))})),document.getElementById("logout-btn")?.addEventListener("click",async()=>{await j(),p.success("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D"),location.reload()})}else n.innerHTML='<a href="login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>'}export async function openDashboardMoreModal(a=null){const n=a||K(),i=!!(n&&(n.uid||n.id)),t=i&&$(n),e=i?n.name||n.displayName||"\u0635\u0627\u062D\u0628 \u0627\u0644\u0646\u0634\u0627\u0637":"\u0632\u0627\u0626\u0631 \u0643\u0631\u064A\u0645",s=i&&n.photoURL||"./icons/icon-72x72.png",o=typeof window<"u"&&(window.location.pathname.endsWith("dashboard.html")||window.location.pathname.endsWith("/dashboard.html")),r=i?`
    <div class="more-menu-container" style="direction:rtl;text-align:right">
      <!-- User Info Card -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--surface-2,#F8FAFC);border-radius:14px;margin-bottom:12px;border:1px solid var(--border,#E2E8F0)">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${O(s)}" style="width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid var(--primary,#1B4F72)" alt="${z(e)}" onerror="this.src='./icons/icon-72x72.png'"/>
          <div>
            <div style="font-weight:800;font-size:0.98rem;color:var(--text-primary,#0F172A)">${z(e)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted,#64748B)">${t?"\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629 \u2B50":"\u0635\u0627\u062D\u0628 \u062D\u0633\u0627\u0628 \u062A\u062C\u0627\u0631\u064A"}</div>
          </div>
        </div>
        <a href="dashboard.html?section=overview" class="btn btn-sm btn-outline" data-dash-nav="overview" style="border-radius:10px;font-weight:700;font-size:12px">\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u{1F4CA}</a>
      </div>

      <!-- Golden Verification Card -->
      <a href="contact.html?type=verification" class="more-menu-highlight-card" id="more-modal-verify-card">
        <div style="font-size:26px;line-height:1;background:rgba(245,166,35,0.22);padding:8px;border-radius:10px;flex-shrink:0">\u{1F6E1}\uFE0F</div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:0.95rem;color:#92400E;display:flex;align-items:center;justify-content:space-between">
            <span>\u0648\u062B\u0651\u0642 \u0645\u0644\u0641\u0643 \u0627\u0644\u062A\u062C\u0627\u0631\u064A</span>
            <span style="font-size:11px;background:#d97706;color:#fff;padding:2px 7px;border-radius:6px;font-weight:700">\u0634\u0627\u0631\u0629 \u0627\u0644\u062A\u0648\u062B\u064A\u0642</span>
          </div>
          <div style="font-size:0.78rem;color:#78350F;margin-top:2px">\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0627\u0631\u0629 \u0627\u0644\u0632\u0631\u0642\u0627\u0621 \u{1F6E1}\uFE0F \u0648\u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0638\u0647\u0648\u0631 \u0641\u064A \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0628\u062D\u062B</div>
        </div>
      </a>

      <!-- 1. \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 -->
      <div class="more-section-header">
        <span class="more-section-title"><span>\u{1F4BC}</span> \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0644</span>
        <span class="more-section-badge">\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0646\u0634\u0637\u0629</span>
      </div>
      <div class="more-menu-grid">
        <a href="dashboard.html?section=add&action=scan" class="more-menu-tile" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #10b981;" data-dash-nav="scan">
          <span class="tile-icon" style="background:rgba(16,185,129,0.2)">\u{1F4F8}</span>
          <div class="tile-info">
            <span class="tile-title" style="color:#065f46;font-weight:800">\u062A\u0635\u0648\u064A\u0631 \u0643\u0627\u0631\u062A \u0627\u0644\u0645\u062D\u0644</span>
            <span class="tile-sub" style="color:#047857">\u0625\u0636\u0627\u0641\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u2728</span>
          </div>
        </a>
        <a href="dashboard.html?section=places" class="more-menu-tile" data-dash-nav="places">
          <span class="tile-icon">\u{1F3EC}</span>
          <div class="tile-info">
            <span class="tile-title">\u0623\u0645\u0627\u0643\u0646\u064A</span>
            <span class="tile-sub">\u0625\u062F\u0627\u0631\u0629 \u0648\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0623\u0646\u0634\u0637\u0629</span>
          </div>
        </a>
        <a href="dashboard.html?section=add" class="more-menu-tile more-menu-tile--green" data-dash-nav="add">
          <span class="tile-icon" style="background:rgba(16,185,129,0.15)">\u2795</span>
          <div class="tile-info">
            <span class="tile-title">\u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646 \u064A\u062F\u0648\u064A\u0627\u064B</span>
            <span class="tile-sub">\u0623\u0636\u0641 \u0646\u0634\u0627\u0637\u0643 \u0645\u062C\u0627\u0646\u0627\u064B</span>
          </div>
        </a>
        <a href="dashboard.html?section=offers" class="more-menu-tile" data-dash-nav="offers">
          <span class="tile-icon">\u{1F3F7}\uFE0F</span>
          <div class="tile-info">
            <span class="tile-title">\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0631\u0648\u0636</span>
            <span class="tile-sub">\u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u062A\u062E\u0641\u064A\u0636\u0627\u062A</span>
          </div>
        </a>
        <a href="dashboard.html?section=products" class="more-menu-tile" data-dash-nav="products">
          <span class="tile-icon">\u{1F4E6}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</span>
            <span class="tile-sub">\u0642\u0627\u0626\u0645\u0629 \u0648\u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C</span>
          </div>
        </a>
        <a href="dashboard.html?section=overview" class="more-menu-tile" data-dash-nav="overview">
          <span class="tile-icon">\u{1F4CA}</span>
          <div class="tile-info">
            <span class="tile-title">\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629</span>
            <span class="tile-sub">\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0627\u0621</span>
          </div>
        </a>
        <a href="dashboard.html?section=loyalty" class="more-menu-tile more-menu-tile--gold" data-dash-nav="loyalty">
          <span class="tile-icon" style="background:rgba(245,158,11,0.15)">\u{1F381}</span>
          <div class="tile-info">
            <span class="tile-title">\u0646\u0627\u062F\u064A \u0627\u0644\u0648\u0644\u0627\u0621</span>
            <span class="tile-sub">\u0627\u0644\u0645\u0643\u0627\u0641\u0622\u062A \u0648\u0627\u0644\u062A\u0648\u062B\u064A\u0642</span>
          </div>
        </a>
      </div>

      <!-- 2. \u062D\u0633\u0627\u0628\u064A \u0648\u0646\u0634\u0627\u0637\u064A -->
      <div class="more-section-header">
        <span class="more-section-title"><span>\u{1F464}</span> \u062D\u0633\u0627\u0628\u064A \u0648\u062A\u0641\u0627\u0639\u0644\u064A</span>
        <span class="more-section-badge">\u0634\u062E\u0635\u064A</span>
      </div>
      <div class="more-menu-grid">
        <a href="favorites.html" class="more-menu-tile">
          <span class="tile-icon">\u2764\uFE0F</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0645\u0641\u0636\u0644\u0629</span>
            <span class="tile-sub">\u0623\u0645\u0627\u0643\u0646\u064A \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629</span>
          </div>
        </a>
        <a href="dashboard.html?section=following" class="more-menu-tile" data-dash-nav="following">
          <span class="tile-icon">\u2B50</span>
          <div class="tile-info">
            <span class="tile-title">\u0645\u062A\u0627\u0628\u0639\u0627\u062A\u064A</span>
            <span class="tile-sub">\u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629</span>
          </div>
        </a>
        <a href="dashboard.html?section=notifications" class="more-menu-tile" data-dash-nav="notifications">
          <span class="tile-icon">\u{1F514}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A</span>
            <span class="tile-sub">\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0648\u0627\u0644\u0631\u0633\u0627\u0626\u0644</span>
          </div>
        </a>
        <a href="around-me.html" class="more-menu-tile more-menu-tile--blue">
          <span class="tile-icon" style="background:rgba(2,132,199,0.15)">\u{1F9ED}</span>
          <div class="tile-info">
            <span class="tile-title">\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A</span>
            <span class="tile-sub">\u0623\u0645\u0627\u0643\u0646 \u062D\u0633\u0628 \u0645\u0648\u0642\u0639\u0643 GPS</span>
          </div>
        </a>
      </div>

      <!-- 3. \u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u062F\u0644\u064A\u0644 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A -->
      <div class="more-section-header">
        <span class="more-section-title"><span>\u2728</span> \u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u062F\u0644\u064A\u0644</span>
      </div>
      <div class="more-menu-grid">
        <a href="/search.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F50D}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645</span>
            <span class="tile-sub">\u0628\u062D\u062B \u0630\u0643\u064A \u0648\u0633\u0631\u064A\u0639</span>
          </div>
        </a>
        <a href="/popular.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F525}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629</span>
            <span class="tile-sub">\u0627\u0644\u0623\u0639\u0644\u0649 \u062A\u0642\u064A\u064A\u0645\u0627\u064B \u0648\u0632\u064A\u0627\u0631\u0629</span>
          </div>
        </a>
        <a href="/categories.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F4D1}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A</span>
            <span class="tile-sub">\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u0647\u0646</span>
          </div>
        </a>
        <a href="/now.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F91D}</span>
          <div class="tile-info">
            <span class="tile-title">\u0637\u0644\u0628\u0627\u062A \u0623\u0647\u0627\u0644\u064A\u0646\u0627</span>
            <span class="tile-sub">\u0645\u064A\u0646 \u0641\u0627\u0636\u064A \u064A\u064A\u062C\u064A \u0648\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062E\u062F\u0645\u0627\u062A</span>
          </div>
        </a>
      </div>

      ${t?`
        <div style="margin-top:10px">
          <a href="/admin.html" class="more-menu-tile" style="background:linear-gradient(135deg, rgba(27,79,114,0.1) 0%, rgba(40,116,166,0.15) 100%);border-color:rgba(27,79,114,0.35);color:var(--primary);min-height:56px">
            <span class="tile-icon" style="background:rgba(27,79,114,0.15);font-size:22px">\u2699\uFE0F</span>
            <div class="tile-info">
              <span class="tile-title" style="font-size:0.95rem">\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 (Admin)</span>
              <span class="tile-sub">\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0645\u0627\u0643\u0646\u060C \u0627\u0644\u062A\u0648\u062B\u064A\u0642\u060C \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A\u060C \u0648\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646</span>
            </div>
          </a>
        </div>
      `:""}

      <!-- 4. \u062E\u062F\u0645\u0627\u062A \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A -->
      <div class="more-section-header" style="margin-top:16px">
        <span class="more-section-title"><span>\u{1F4F1}</span> \u062E\u062F\u0645\u0627\u062A \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <a href="quran.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F54C}</span>
          <span>\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u0623\u0630\u0643\u0627\u0631 \u0648\u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u0629</span>
        </a>
        <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="more-menu-row">
          <span style="font-size:18px">\u{1F4E5}</span>
          <span>\u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F APK \u0627\u0644\u0645\u0628\u0627\u0634\u0631</span>
        </a>
        <a href="contact.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F4AC}</span>
          <span>\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A</span>
        </a>
      </div>

      <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border,#E2E8F0)">
        <button type="button" class="btn btn-outline btn-block" id="more-modal-logout-btn" style="color:var(--danger,#EF4444);border-color:rgba(239,68,68,0.3);font-weight:700">
          <span>\u{1F6AA}</span> \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C
        </button>
      </div>
    </div>
  `:`
    <div class="more-menu-container" style="direction:rtl;text-align:right">
      <!-- Guest User Header Card -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--surface-2,#F8FAFC);border-radius:14px;margin-bottom:12px;border:1px solid var(--border,#E2E8F0)">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:22px;border:2px solid var(--primary,#1B4F72);box-shadow:0 3px 10px rgba(0,0,0,0.1);flex-shrink:0">
            \u{1F464}
          </div>
          <div>
            <div style="font-weight:900;font-size:1.02rem;color:var(--text-primary,#0F172A)">\u0632\u0627\u0626\u0631 \u0643\u0631\u064A\u0645</div>
            <div style="font-size:0.8rem;color:var(--text-muted,#64748B)">\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629</div>
          </div>
        </div>
        <a href="login.html" class="btn btn-primary btn-sm" style="font-weight:800;padding:7px 18px;border-radius:10px;display:inline-flex;align-items:center;gap:6px">
          <span>\u{1F511}</span> \u062F\u062E\u0648\u0644
        </a>
      </div>

      <!-- Google Sign-in Interactive Promo Card -->
      <div class="guest-login-promo-card" style="background:linear-gradient(145deg, rgba(27,79,114,0.05) 0%, rgba(245,158,11,0.12) 100%);border:1.5px solid rgba(245,158,11,0.45);border-radius:16px;padding:18px 14px;margin-bottom:14px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.03)">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.08);margin-bottom:10px">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        </div>

        <div style="font-weight:900;font-size:1.02rem;color:var(--text-primary,#0F172A);margin-bottom:6px;line-height:1.4">
          \u0627\u062F\u062E\u0644 \u0628\u062D\u0633\u0627\u0628 \u062C\u0648\u062C\u0644 \u0628\u0636\u063A\u0637\u0629 \u0632\u0631
        </div>
        <div style="font-size:0.86rem;color:var(--text-muted,#475569);margin-bottom:14px;line-height:1.5">
          \u064A\u0646\u062A\u0638\u0631\u0643 \u0627\u0644\u0639\u062F\u064A\u062F \u0645\u0646 \u0627\u0644\u0645\u0645\u064A\u0632\u0627\u062A \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646\u0643
        </div>

        <button type="button" class="btn btn-block" id="more-modal-google-login-btn" style="background:#ffffff;color:#0F172A;border:1.5px solid #CBD5E1;font-weight:800;font-size:0.92rem;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 16px;border-radius:12px;box-shadow:0 3px 10px rgba(0,0,0,0.07);cursor:pointer;width:100%;transition:transform 0.15s ease">
          <svg width="20" height="20" viewBox="0 0 24 24" style="flex-shrink:0">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0628\u062D\u0633\u0627\u0628 Google</span>
        </button>
      </div>

      <!-- Quick Links for Guests -->
      <div class="more-section-header">
        <span class="more-section-title"><span>\u{1F9ED}</span> \u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u062F\u0644\u064A\u0644</span>
      </div>
      <div class="more-menu-grid" style="margin-bottom:10px">
        <a href="/search.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F50D}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0628\u062D\u062B \u0627\u0644\u0645\u062A\u0642\u062F\u0645</span>
            <span class="tile-sub">\u0628\u062D\u062B \u0633\u0631\u064A\u0639 \u0628\u0627\u0644\u0623\u0645\u0627\u0643\u0646</span>
          </div>
        </a>
        <a href="/around-me.html" class="more-menu-tile more-menu-tile--blue">
          <span class="tile-icon" style="background:rgba(2,132,199,0.15)">\u{1F9ED}</span>
          <div class="tile-info">
            <span class="tile-title">\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A</span>
            <span class="tile-sub">\u0623\u0642\u0631\u0628 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0625\u0644\u064A\u0643</span>
          </div>
        </a>
        <a href="/popular.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F525}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629</span>
            <span class="tile-sub">\u0627\u0644\u0623\u0639\u0644\u0649 \u0632\u064A\u0627\u0631\u0629 \u0648\u062A\u0642\u064A\u064A\u0645\u0627\u064B</span>
          </div>
        </a>
        <a href="/categories.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F4D1}</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A</span>
            <span class="tile-sub">\u062F\u0644\u064A\u0644 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u0647\u0646</span>
          </div>
        </a>
        <a href="/favorites.html" class="more-menu-tile">
          <span class="tile-icon">\u2764\uFE0F</span>
          <div class="tile-info">
            <span class="tile-title">\u0627\u0644\u0645\u0641\u0636\u0644\u0629</span>
            <span class="tile-sub">\u0642\u0627\u0626\u0645\u062A\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629</span>
          </div>
        </a>
        <a href="/now.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F91D}</span>
          <div class="tile-info">
            <span class="tile-title">\u0637\u0644\u0628\u0627\u062A \u0623\u0647\u0627\u0644\u064A\u0646\u0627</span>
            <span class="tile-sub">\u0645\u064A\u0646 \u0641\u0627\u0636\u064A \u064A\u064A\u062C\u064A \u0648\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062E\u062F\u0645\u0627\u062A</span>
          </div>
        </a>
      </div>

      <div class="more-section-header" style="margin-top:14px">
        <span class="more-section-title"><span>\u{1F4F1}</span> \u062E\u062F\u0645\u0627\u062A \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <a href="quran.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F54C}</span>
          <span>\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u0623\u0630\u0643\u0627\u0631 \u0648\u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u0629</span>
        </a>
        <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="more-menu-row">
          <span style="font-size:18px">\u{1F4E5}</span>
          <span>\u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F APK \u0627\u0644\u0645\u0628\u0627\u0634\u0631</span>
        </a>
        <a href="contact.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F4AC}</span>
          <span>\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A</span>
        </a>
      </div>
    </div>
  `,{showModal:w}=await import("../ui/components/Modal.js"),g=w({title:i?"\u2630 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0648\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645":"\u2630 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",content:r,sheet:!0,closeable:!0,size:"sm"}),E=document.querySelector(".modal");return E&&(E.querySelectorAll("[data-dash-nav]").forEach(f=>{f.addEventListener("click",m=>{const _=f.getAttribute("data-dash-nav");o&&typeof window.switchDashboardSection=="function"?(m.preventDefault(),g.close(),window.switchDashboardSection(_,null,!0)):g.close()})}),document.getElementById("more-modal-logout-btn")?.addEventListener("click",async()=>{g.close(),await j(),p.success("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D"),window.location.reload()}),document.getElementById("more-modal-google-login-btn")?.addEventListener("click",async f=>{f.preventDefault();const m=f.currentTarget,_=m.innerHTML;try{m.disabled=!0,m.style.opacity="0.7",m.innerHTML="<span>\u062C\u0627\u0631\u064A \u0641\u062A\u062D \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644...</span>";const c=await te();c?(g.close(),p.success(`\u0623\u0647\u0644\u0627\u064B \u0628\u0643 ${c.displayName||c.name||""} \u{1F44B}`),window.location.reload()):(m.disabled=!1,m.style.opacity="1",m.innerHTML=_)}catch(c){m.disabled=!1,m.style.opacity="1",m.innerHTML=_,console.error("[MoreModal GoogleSignIn] error:",c),c?.code!=="auth/popup-closed-by-user"&&p.error("\u062A\u0639\u0630\u0631 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644: "+(c?.message||"\u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649"))}})),g}typeof window<"u"&&(window.openDashboardMoreModal=openDashboardMoreModal);let x=typeof window<"u"&&window.__deferredPwaPrompt?window.__deferredPwaPrompt:null;typeof window<"u"&&(window.addEventListener("beforeinstallprompt",a=>{a.preventDefault(),x=a,window.__deferredPwaPrompt=a}),window.addEventListener("appinstalled",()=>{try{localStorage.setItem("pwa-installed","true")}catch{}x=null,typeof window<"u"&&(window.__deferredPwaPrompt=null),k()}));function pe(){return typeof window>"u"?!1:!!(window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: window-controls-overlay)").matches||window.navigator.standalone||document.referrer.includes("android-app://")||localStorage.getItem("pwa-installed")==="true")}function me(){try{const a=localStorage.getItem("pwa-dismissed");if(!a)return!1;const n=parseInt(a,10);return isNaN(n)?!1:Date.now()-n<7200*1e3}catch{return!1}}function F(){if(pe()||me())return!1;try{if(sessionStorage.getItem("pwa_session_shown")==="true")return!1}catch{}return!0}function ue(){const a=!localStorage.getItem("manzala_voice_guide_seen");a&&setTimeout(()=>{N()},2e3);const n=a?12e3:5e3,i=()=>{(x||typeof window<"u"&&window.__deferredPwaPrompt)&&F()&&!document.getElementById("voice-guide-callout")&&he()};F()&&(x||typeof window<"u"&&window.__deferredPwaPrompt?setTimeout(i,n):typeof window<"u"&&window.addEventListener("beforeinstallprompt",()=>{setTimeout(i,n)},{once:!0})),document.addEventListener("click",t=>{if(t.target.closest("#pwa-banner-close")||t.target.closest("#pwa-banner-later")){t.preventDefault(),k();return}if(t.target.closest("#pwa-install-btn")){t.preventDefault(),fe();return}if(t.target.closest("#desktop-voice-fab")){t.preventDefault();try{import("../services/voice.service.js").then(({openManzalaVoiceAssistantModal:e})=>e()).catch(()=>{})}catch{}return}})}function he(){if(!F())return;const a=document.getElementById("pwa-banner");if(a){try{sessionStorage.setItem("pwa_session_shown","true")}catch{}a.hidden=!1,a.style.display="block",requestAnimationFrame(()=>{a.classList.add("visible")})}}function k(){const a=document.getElementById("pwa-banner");a&&(a.classList.remove("visible"),setTimeout(()=>{a.hidden=!0,a.style.display="none"},350));try{localStorage.setItem("pwa-dismissed",Date.now().toString()),sessionStorage.setItem("pwa_session_shown","true")}catch{}N()}async function fe(){const a=x||(typeof window<"u"?window.__deferredPwaPrompt:null);if(a)try{a.prompt();const{outcome:n}=await a.userChoice;if(n==="accepted"){try{localStorage.setItem("pwa-installed","true")}catch{}k(),p.success("\u062A\u0645 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0646\u062C\u0627\u062D! \u0633\u062A\u062C\u062F\u0647 \u0641\u064A \u0634\u0627\u0634\u0629 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0647\u0627\u062A\u0641\u0643 \u{1F389}"),setTimeout(()=>N(),1200)}else k()}catch{k()}finally{x=null,typeof window<"u"&&(window.__deferredPwaPrompt=null)}else k()}function N(){if(!(typeof document>"u")){try{if(localStorage.getItem("manzala_voice_guide_seen")==="true")return;localStorage.setItem("manzala_voice_guide_seen","true")}catch{return}setTimeout(()=>{const a=window.innerWidth>=769;let n=null;if(a?n=document.getElementById("desktop-voice-fab")||document.getElementById("global-voice-assistant-fab"):n=document.getElementById("global-voice-assistant-fab")||document.querySelector(".bottom-nav__fab-btn")||document.querySelector(".bottom-nav__fab"),!n)return;document.getElementById("voice-guide-callout")?.remove();const i=document.getElementById("pwa-banner");i&&i.classList.contains("visible")&&(i.classList.remove("visible"),i.style.display="none",i.hidden=!0);const t=document.createElement("div");t.className="voice-guide-callout",t.id="voice-guide-callout",t.setAttribute("role","tooltip"),t.innerHTML=`
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
    `,document.body.appendChild(t),n.classList.add("voice-mic-highlighted");const e=()=>{t.classList.add("fade-out"),n?.classList.remove("voice-mic-highlighted"),setTimeout(()=>t.remove(),350)};t.querySelector("#voice-guide-callout-close")?.addEventListener("click",o=>{o.stopPropagation(),e()}),t.querySelector("#voice-guide-bubble")?.addEventListener("click",o=>{if(!o.target.closest("#voice-guide-callout-close")){e();try{import("../services/voice.service.js").then(({openManzalaVoiceAssistantModal:r})=>r()).catch(()=>{})}catch{}}}),n.addEventListener("click",e,{once:!0});const s=o=>{!t.contains(o.target)&&!n.contains(o.target)&&(e(),document.removeEventListener("click",s))};setTimeout(()=>{document.addEventListener("click",s)},400),setTimeout(()=>{document.body.contains(t)&&(e(),document.removeEventListener("click",s))},9e3)},500)}}function z(a){return a?String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function O(a){return a?String(a).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function ge(){if(typeof window>"u")return;const a=new Date().getFullYear(),n=()=>{try{console.log(`%c\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${a}).`,"background: linear-gradient(135deg, #0B2239, #153A5C); color: #F5A623; font-size: 16px; font-weight: 800; padding: 12px 20px; border-radius: 8px; border: 2px solid #F5A623; font-family: Cairo, Tahoma, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.5);"),console.log(`%c\u26A0\uFE0F \u062A\u062D\u0630\u064A\u0631 \u0642\u0627\u0646\u0648\u0646\u064A \u0631\u0633\u0645\u064A:
\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0645\u0633\u062C\u0644\u0629 \u0648\u0645\u062D\u0645\u064A\u0629 \u0631\u0642\u0645\u064A\u0627\u064B\u060C \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0646\u0642\u0644\u0647\u0627 \u0623\u0648 \u0646\u0633\u062E\u0647\u0627 \u062D\u062A\u0649 \u0644\u0627 \u064A\u062A\u0645 \u0645\u0633\u0627\u0621\u0644\u062A\u0643 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u0623\u0645\u0627\u0645 \u0627\u0644\u0645\u062D\u0627\u0643\u0645 \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629.`,"color: #EF4444; font-size: 13px; font-weight: 700; line-height: 1.8; font-family: Cairo, Tahoma, sans-serif;"),console.log("%c\u0631\u0627\u0628\u0637 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629: %chttps://dalilmanzala.com/","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #0284C7; font-size: 11px; font-weight: 700; text-decoration: underline;"),console.log("%c\u{1F4AC} \u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A: %chttps://wa.me/wasendernew","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #10B981; font-size: 11px; font-weight: 700; text-decoration: underline;")}catch{}};n();let i=window.outerWidth-window.innerWidth,t=window.outerHeight-window.innerHeight;window.addEventListener("resize",()=>{const e=window.outerWidth-window.innerWidth,s=window.outerHeight-window.innerHeight;(e!==i||s!==t)&&(i=e,t=s,n())},{passive:!0}),document.addEventListener("contextmenu",e=>{const s=e.target.tagName.toLowerCase();s==="input"||s==="textarea"||e.target.isContentEditable||(e.preventDefault(),typeof p<"u"&&p.info&&p.info("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0645\u064A\u0629 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u2014 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0646\u0633\u062E \u0623\u0648 \u0646\u0642\u0644 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("copy",e=>{const s=e.target.tagName?e.target.tagName.toLowerCase():"";s==="input"||s==="textarea"||e.target.isContentEditable||(e.preventDefault(),e.clipboardData&&e.clipboardData.setData("text/plain",`\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${a}). https://dalilmanzala.com/`),typeof p<"u"&&p.warning&&p.warning("\u26A0\uFE0F \u062A\u0645 \u062D\u0641\u0638 \u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0644\u0643\u064A\u0629: \u0644\u0627 \u064A\u062C\u0648\u0632 \u0646\u0633\u062E \u0623\u0648 \u0627\u0642\u062A\u0628\u0627\u0633 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("cut",e=>{const s=e.target.tagName?e.target.tagName.toLowerCase():"";s==="input"||s==="textarea"||e.target.isContentEditable||e.preventDefault()}),document.addEventListener("keydown",e=>{const s=e.target.tagName?e.target.tagName.toLowerCase():"",o=s==="input"||s==="textarea"||e.target.isContentEditable;(e.key==="F12"||e.ctrlKey&&e.shiftKey&&(e.key==="I"||e.key==="i"||e.key==="J"||e.key==="j"||e.key==="C"||e.key==="c"))&&n(),e.ctrlKey&&(e.key==="u"||e.key==="U"||e.key==="s"||e.key==="S"||e.key==="p"||e.key==="P")&&(e.preventDefault(),typeof p<"u"&&p.warning&&p.warning("\u{1F512} \u0645\u0635\u062F\u0631 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644 \u0645\u062D\u0645\u064A\u0629 \u0628\u0645\u0648\u062C\u0628 \u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0627\u0644\u0641\u0643\u0631\u064A\u0629.")),e.ctrlKey&&(e.key==="c"||e.key==="C")&&!o&&(window.getSelection?window.getSelection().toString():"").length>0&&(e.preventDefault(),typeof p<"u"&&p.warning&&p.warning("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0645\u062D\u0645\u064A: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0646\u0633\u062E \u0644\u0645\u0646\u0639 \u0627\u0644\u062A\u0639\u062F\u064A \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A."))})}async function ve(){try{let a=K();if(!a)try{a=await G(1500)}catch{}if(a&&$(a))return;if(a&&a.status==="suspended"){Y("\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u062D\u0633\u0627\u0628\u0643 \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629 \u0644\u0645\u062E\u0627\u0644\u0641\u0629 \u0627\u0644\u0634\u0631\u0648\u0637.");return}const n=await ee();if(n){if(n==="156.197.215.243")return;const{isIpBanned:i}=await import("./db.js"),t=await i(n),e=!!(t&&t.isPermanent),s=!!(t&&t.bannedUntil&&Number(t.bannedUntil)>Date.now());if(e||s){const o=t.reason||"\u0645\u062E\u0627\u0644\u0641\u0629 \u0645\u0639\u0627\u064A\u064A\u0631 \u0648\u0633\u064A\u0627\u0633\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629",r=e?null:new Date(t.bannedUntil).toLocaleDateString("ar-EG"),w=e?`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${n}) \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u0646\u0635\u0629 \u0628\u0633\u0628\u0628: ${o}`:`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${n}) \u062D\u062A\u0649 ${r} \u0628\u0633\u0628\u0628: ${o}`;Y(w)}}}catch(a){console.debug("[_enforceBanGuard] notice:",a)}}function Y(a){document.body.innerHTML=`
    <div style="min-height:100vh;background:#06101E;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif;direction:rtl;text-align:center">
      <div style="max-width:540px;background:#0F273D;border:1px solid rgba(239,68,68,0.4);border-radius:20px;padding:36px 24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
        <div style="font-size:64px;margin-bottom:16px">\u{1F6AB}</div>
        <h1 style="color:#EF4444;font-size:1.8rem;margin-bottom:12px;font-weight:900">\u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin-bottom:24px;background:rgba(239,68,68,0.1);padding:14px;border-radius:12px;border:1px dashed rgba(239,68,68,0.3)">
          ${a}
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
  `}function be(){const a=document.getElementById("header-search-container"),n=document.getElementById("header-search-pill"),i=document.getElementById("header-search-trigger"),t=document.getElementById("header-search-input"),e=document.getElementById("header-search-clear"),s=document.getElementById("header-live-dropdown"),o=document.getElementById("header-live-list"),r=document.getElementById("header-live-count"),w=document.getElementById("header-live-all-btn");if(!t)return;let g=null,E=0;function f(){!s||!o||(r&&(r.textContent="\u0645\u0642\u062A\u0631\u062D\u0627\u062A"),o.innerHTML=`
      <div class="header-live-suggestions">
        <div class="header-live-suggestions__title">\u26A1 \u0645\u0642\u062A\u0631\u062D\u0627\u062A \u0633\u0631\u064A\u0639\u0629 \u0648\u0645\u0637\u0644\u0648\u0628\u0629:</div>
        <div class="header-live-suggestions__chips">
          <button type="button" class="header-live-suggestion-chip" data-q="\u0635\u064A\u062F\u0644\u064A\u0629">\u{1F48A} \u0635\u064A\u062F\u0644\u064A\u0627\u062A</button>
          <button type="button" class="header-live-suggestion-chip" data-q="\u0639\u064A\u0627\u062F\u0629 \u062F\u0643\u062A\u0648\u0631">\u{1FA7A} \u0623\u0637\u0628\u0627\u0621</button>
          <button type="button" class="header-live-suggestion-chip" data-q="\u0633\u0628\u0627\u0643">\u{1F527} \u0633\u0628\u0627\u0643\u064A\u0646</button>
          <button type="button" class="header-live-suggestion-chip" data-q="\u0643\u0647\u0631\u0628\u0627\u0626\u064A">\u26A1 \u0643\u0647\u0631\u0628\u0627\u0626\u064A</button>
          <button type="button" class="header-live-suggestion-chip" data-q="\u0645\u0637\u0639\u0645">\u{1F354} \u0645\u0637\u0627\u0639\u0645</button>
          <button type="button" class="header-live-suggestion-chip" data-q="\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A">\u{1F6D2} \u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A</button>
          <button type="button" class="header-live-suggestion-chip" data-q="\u062D\u0645\u0627\u062F">\u2B50 \u062D\u0645\u0627\u062F</button>
        </div>
      </div>
    `,o.querySelectorAll(".header-live-suggestion-chip").forEach(c=>{c.addEventListener("click",B=>{B.preventDefault(),B.stopPropagation();const P=c.getAttribute("data-q")||"";t.value=P,t.dispatchEvent(new Event("input",{bubbles:!0})),t.focus()})}),s.classList.add("visible"))}const m=()=>{n?.classList.add("expanded"),t.focus(),t.value.trim().length>=1?s?.classList.add("visible"):f()},_=()=>{n?.classList.remove("expanded"),s?.classList.remove("visible")};i?.addEventListener("click",c=>{c.stopPropagation(),n?.classList.contains("expanded")&&t.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(t.value.trim())}`:m()}),t.addEventListener("focus",()=>{n?.classList.add("expanded"),t.value.trim().length>=1&&o?.children.length>0?s?.classList.add("visible"):t.value.trim()||f()}),t.addEventListener("click",()=>{t.value.trim()||f()}),e?.addEventListener("click",c=>{c.stopPropagation(),t.value="",e.classList.remove("visible"),s?.classList.remove("visible"),o&&(o.innerHTML=""),t.focus()}),t.addEventListener("keydown",c=>{c.key==="Enter"&&t.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(t.value.trim())}`:c.key==="Escape"&&_()}),t.addEventListener("input",()=>{const c=t.value.trim();if(e?.classList.toggle("visible",c.length>0),w&&(w.href=`search.html?q=${encodeURIComponent(c)}`),!c){s?.classList.remove("visible"),o&&(o.innerHTML="");return}const B=c.length<=2?0:35;clearTimeout(g),g=setTimeout(async()=>{const P=++E;try{let H=function(u,l){if(!u)return"";if(!l)return d(u);const b=l.trim().split(/\s+/).filter(Boolean);if(!b.length)return d(u);const L=b.map(h=>h.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),S=new RegExp(`(${L.join("|")})`,"gi");return d(u).replace(S,'<span class="search-highlight">$1</span>')};const{executeFastSearch:A}=await import("../services/search-engine.service.js"),v=await A(c,{limit:6});if(P!==E||!s||!o)return;if(!v||v.length===0){r&&(r.textContent="0"),o.innerHTML=`
            <div class="header-live-empty">
              <div class="header-live-empty__icon">\u{1F50D}</div>
              <div class="header-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="header-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,s.classList.add("visible");return}r&&(r.textContent=String(v.length));let D="";v.matchingCategories&&v.matchingCategories.length>0&&(D=`
            <div class="hero-live-matched-cats" style="margin-bottom:6px">
              <span class="hero-live-matched-cats__label">\u26A1 \u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629:</span>
              <div class="hero-live-matched-cats__chips">
                ${v.matchingCategories.map(u=>{const l=u.slug||u.id||"";return`
                    <a href="category.html?slug=${encodeURIComponent(l)}" class="hero-live-matched-cat-chip" onclick="event.stopPropagation()">
                      ${u.icon||"\u{1F3EA}"}
                      <span>${d(u.name)}</span>
                    </a>
                  `}).join("")}
              </div>
            </div>
          `),o.innerHTML=D+v.map(u=>{const l=u.raw||u,b=l.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",L=l.categoryName||u.category||"",S=l.area||l.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",h=l.slug||l.id||"",C=l.photoURL||l.logo||l.coverURL||l.coverImageUrl||l.logoUrl||"",J=l.isVerified||!1,q=l.isOpen!==void 0?l.isOpen:!0,M=(l.phone||"").trim(),U=(l.whatsapp||l.phone||"").trim(),y=U?U.replace(/[^0-9]/g,""):"",T=y?y.startsWith("2")?y:y.startsWith("0")?"2"+y:"20"+y:"";let W="";if((M||T)&&(W=`
              <div class="header-live-actions" onclick="event.stopPropagation()">
                ${M?`
                  <a href="tel:${d(M)}" class="header-live-action-btn header-live-action-btn--call" title="\u0627\u062A\u0635\u0627\u0644 \u0647\u0627\u062A\u0641\u064A" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span class="action-btn-text">\u0627\u062A\u0635\u0627\u0644</span>
                  </a>
                `:""}
                ${T?`
                  <a href="https://wa.me/${d(T)}" target="_blank" rel="noopener" class="header-live-action-btn header-live-action-btn--wa" title="\u0648\u0627\u062A\u0633\u0627\u0628" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.35-.49.07-1.12.1-3.26-.79-2.73-1.14-4.5-3.89-4.63-4.07-.14-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36.002.52.01.17.01.39-.06.61.47.24.58.8 1.95.87 2.09.07.15.12.32.02.52-.09.21-.14.33-.29.5-.14.17-.3.38-.43.51-.15.15-.3.32-.13.62.18.3.78 1.29 1.68 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.79.84 2.1 1 .3.15.51.23.58.36.08.13.08.76-.16 1.43z"/></svg>
                    <span class="action-btn-text">\u0648\u0627\u062A\u0633\u0627\u0628</span>
                  </a>
                `:""}
              </div>
            `),typeof window<"u"&&window._placesRegistry&&h){const Q=String(h).toLowerCase().trim();window._placesRegistry.set(Q,l),l.slug&&window._placesRegistry.set(String(l.slug).toLowerCase().trim(),l),l.id&&window._placesRegistry.set(String(l.id).toLowerCase().trim(),l)}const R=(b.trim()[0]||"\u0645").toUpperCase();return`
            <a href="/place.html?slug=${encodeURIComponent(h)}" class="header-live-dropdown__item" role="option"
               data-place-id="${d(l.id||h)}"
               data-place-slug="${d(h)}"
               data-name="${d(b)}"
               data-phone="${d(l.phone||"")}"
               data-whatsapp="${d(l.whatsapp||"")}"
               data-area="${d(S)}"
               data-address="${d(l.address||"")}"
               data-cover="${d(l.coverImageUrl||C)}"
               data-logo="${d(l.logoUrl||C)}"
               data-category="${d(L)}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${d(h)}', event) : null"
               ontouchstart="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${d(h)}', this)"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${d(h)}', this)">
              <div class="header-live-avatar">
                ${C?`<img src="${C}" alt="${d(b)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'header-live-avatar-fallback\\'>${R}</div>'"/>`:`<div class="header-live-avatar-fallback">${R}</div>`}
              </div>
              <div class="header-live-content">
                <div class="header-live-title-row">
                  <span class="header-live-name">${H(b,c)}</span>
                  ${J?'<span class="header-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="header-live-meta-row">
                  ${L?`<span class="header-live-cat">${H(L,c)}</span>`:""}
                  <span class="header-live-area">${d(S)}</span>
                  <span class="${q?"header-live-status-open":"header-live-status-closed"}">
                    ${q?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
              ${W}
            </a>
          `}).join(""),s.classList.add("visible")}catch(A){console.warn("[HeaderLiveSearch] search error:",A)}},B)}),document.addEventListener("click",c=>{a?.contains(c.target)||(s?.classList.remove("visible"),window.innerWidth<=767&&n?.classList.remove("expanded"))})}function d(a){return String(a||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
