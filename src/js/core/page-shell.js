import{initAuth as W,onAuthStateChange as N,signOut as T,waitForAuth as R,isAdmin as _,getCurrentUser as P,getClientIp as j,signInWithGoogle as G}from"./auth.js";import{toast as d}from"../ui/components/Toast.js";function K(t){return`
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
      ${[["index.html","\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"],["popular.html","\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629 \u{1F525}"],["places.html","\u0627\u0644\u0623\u0645\u0627\u0643\u0646"],["categories.html","\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A"],["offers.html","\u0627\u0644\u0639\u0631\u0648\u0636"],["now.html","\u064A\u062D\u062F\u062B \u0627\u0644\u0622\u0646 \u{1F525}"],["around-me.html","\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A \u{1F9ED}"],["favorites.html","\u2764\uFE0F \u0627\u0644\u0645\u0641\u0636\u0644\u0629"]].map(([s,o])=>`<a href="${s}" class="header__nav-link${s===t?" active":""}">${o}</a>`).join("")}
    </nav>
    
    <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u0648\u0627\u0644\u0646\u0647\u0627\u0631\u064A" title="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A / \u0627\u0644\u0641\u0627\u062A\u062D">
      <span class="theme-icon-light">\u2600\uFE0F</span>
      <span class="theme-icon-dark">\u{1F319}</span>
    </button>

    <div class="header__user" id="header-user-section">
      <a href="login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>
    </div>
  </div>
</header>`}function V(t){if(t==="admin/index.html")return`
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
  <button type="button" data-dash-sec="more" class="bottom-nav__item" id="dash-bottom-more-btn" aria-label="\u0627\u0644\u0645\u0632\u064A\u062F">
    <span class="bottom-nav__icon">\u2630</span>
    <span class="bottom-nav__label">\u0627\u0644\u0645\u0632\u064A\u062F</span>
  </button>
</nav>`;const n=[["index.html","\u{1F3E0}","\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"],["categories.html","\u{1F4CB}","\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A"],["offers.html","\u{1F3F7}\uFE0F","\u0627\u0644\u0639\u0631\u0648\u0636"],["#more","\u2630","\u0627\u0644\u0645\u0632\u064A\u062F"]];return`
<nav class="bottom-nav" id="bottom-nav" role="navigation" aria-label="\u062A\u0646\u0642\u0644 \u0633\u0631\u064A\u0639">
  <a href="${n[0][0]}" class="bottom-nav__item${n[0][0]===t?" active":""}">
    <span class="bottom-nav__icon">${n[0][1]}</span>
    <span class="bottom-nav__label">${n[0][2]}</span>
  </a>
  <a href="${n[1][0]}" class="bottom-nav__item${n[1][0]===t?" active":""}">
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
  <a href="${n[2][0]}" class="bottom-nav__item${n[2][0]===t?" active":""}">
    <span class="bottom-nav__icon">${n[2][1]}</span>
    <span class="bottom-nav__label">${n[2][2]}</span>
  </a>
  <button type="button" class="bottom-nav__item" id="bottom-nav-more-btn" aria-label="\u0627\u0644\u0645\u0632\u064A\u062F">
    <span class="bottom-nav__icon">${n[3][1]}</span>
    <span class="bottom-nav__label">${n[3][2]}</span>
  </button>
</nav>`}function O(){return`
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
          <li><a href="popular.html"    class="footer__link">\u{1F525} \u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629</a></li>
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
</footer>`}function Y(){return`
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
</div>`}export async function initPage(t=""){if(J(),y("header-slot",K(t)),t==="index.html"||t==="home"||typeof window<"u"&&(window.location.pathname==="/"||window.location.pathname.endsWith("/index.html")||window.location.pathname.endsWith("/"))){const e=(i=0)=>{const r=document.getElementById("wide-ads-banner");r&&!r.dataset.wideAdsMounted?import("../ui/components/WideAdsBanner.js").then(({mountWideAdsBanner:u})=>u(r)).catch(()=>{}):!r&&i<25&&setTimeout(()=>e(i+1),100)};e()}else{let e=document.getElementById("wide-ads-banner");if(!e){e=document.createElement("div"),e.id="wide-ads-banner",e.className="container wide-ads-banner-page-top",e.style.margin="14px auto";const i=document.getElementById("site-header"),r=document.getElementById("page-container")||document.querySelector("main")||document.querySelector("#admin-container")||document.querySelector(".admin-layout")||document.querySelector("#app")||document.body;i&&i.nextSibling?i.parentNode.insertBefore(e,i.nextSibling):r&&r.firstChild?r.insertBefore(e,r.firstChild):r?r.appendChild(e):document.body.appendChild(e)}e&&setTimeout(()=>{import("../ui/components/WideAdsBanner.js").then(({mountWideAdsBanner:i})=>i(e)).catch(()=>{})},50)}y("footer-slot",O()),y("nav-slot",V(t)),y("pwa-slot",Y()),Q(),X();try{import("../services/voice.service.js").then(({bindGlobalVoiceAssistantFab:e})=>e()).catch(e=>console.warn("[initPage] voice FAB init failed:",e))}catch(e){console.warn("[initPage] voice FAB import failed:",e)}const s=document.getElementById("site-header"),o=document.getElementById("scroll-to-top-btn");window.addEventListener("scroll",()=>{const e=window.scrollY||window.pageYOffset||0;s?.classList.toggle("scrolled",e>8),o?.classList.toggle("visible",e>300)},{passive:!0}),o?.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})});try{le()}catch(e){console.warn("[initPage] header search init failed:",e)}document.addEventListener("click",e=>{(e.target.closest("#bottom-nav-more-btn")||e.target.closest("#dash-bottom-more-btn"))&&(e.preventDefault(),openDashboardMoreModal())});const a=e=>{"requestIdleCallback"in window?requestIdleCallback(e,{timeout:2500}):setTimeout(e,0)};a(async()=>{try{const{ensureFirebaseReady:e}=await import("./firebase.js");(await e(2500))?.auth&&W()}catch{}try{await re()}catch{}try{const[{initLiveNotificationSubscriber:e},{initFcmMessaging:i}]=await Promise.all([import("../services/notification.service.js"),import("../services/fcm.service.js")]);N(r=>{ee(r),e(r?.uid),i(r)})}catch{}try{const{getSettings:e}=await import("./db.js"),r=(await e())?.contact?.whatsappLink;r&&document.querySelectorAll("[data-wa]").forEach(u=>{u.href=r})}catch{}});try{ne()}catch(e){console.warn("[initPage] PWA setup failed:",e)}"serviceWorker"in navigator&&a(()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));try{["manzala_fast_places_cache","manzala_live_news_store_v2","manzala_global_broadcast_notifs_cache"].forEach(i=>localStorage.removeItem(i))}catch{}a(()=>{import("../services/realtime-sync.service.js").then(({initRealtimePwaSyncBus:e})=>e()).catch(()=>{}),import("../utils/mobile-tooltip.js").then(({initUniversalMobileTouchTooltips:e})=>e()).catch(()=>{});try{Z()}catch{}try{ie()}catch{}})}function Q(){try{(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.matchMedia&&window.matchMedia("(display-mode: fullscreen)").matches||window.matchMedia&&window.matchMedia("(display-mode: minimal-ui)").matches||window.navigator.standalone===!0||document.referrer&&document.referrer.includes("android-app://")||navigator.userAgent&&(navigator.userAgent.includes("wv")||navigator.userAgent.includes("Android")&&navigator.userAgent.includes("Version/"))||new URLSearchParams(window.location.search).get("source")==="apk"||new URLSearchParams(window.location.search).get("source")==="pwa")&&document.querySelectorAll("#footer-apk-container, .footer__apk-download, .apk-pro-download-btn").forEach(n=>{n.style.display="none"})}catch{}}function J(){const t=localStorage.getItem("elmanzala-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");A(t)}function X(){document.querySelectorAll("#theme-toggle-btn, .theme-toggle-btn").forEach(t=>{t.addEventListener("click",()=>{const s=(document.documentElement.getAttribute("data-theme")||"light")==="dark"?"light":"dark";A(s),localStorage.setItem("elmanzala-theme",s),d.info(s==="dark"?"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u{1F319}":"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A \u2600\uFE0F")})})}function A(t){document.documentElement.setAttribute("data-theme",t),document.body&&(document.body.classList.toggle("dark-theme",t==="dark"),document.body.classList.toggle("light-theme",t==="light"));const n=document.querySelector('meta[name="theme-color"]');n&&n.setAttribute("content",t==="dark"?"#0F172A":"#1B4F72")}function Z(){const t=new Set,n=a=>{if(a)try{const e=new URL(a,location.href);if(e.origin===location.origin&&!t.has(e.href)){t.add(e.href);const i=document.createElement("link");i.rel="prefetch",i.href=e.href,document.head.appendChild(i)}}catch{}};document.addEventListener("mouseover",a=>{const e=a.target.closest("a[href]");e&&n(e.href)},{passive:!0}),document.addEventListener("touchstart",a=>{const e=a.target.closest("a[href]");e&&n(e.href)},{passive:!0});const s=["index.html","popular.html","places.html","categories.html","offers.html","search.html"],o=()=>{s.forEach(a=>n(a))};"requestIdleCallback"in window?window.requestIdleCallback(o,{timeout:1500}):setTimeout(o,800)}export{R as waitForAuth,_ as isAdmin};function y(t,n){const s=document.getElementById(t);if(!s)return;const o=document.createElement("div");o.innerHTML=n.trim(),s.replaceWith(o.firstElementChild)}function ee(t){const n=document.getElementById("header-user-section");if(n)if(t){n.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px">
        <a href="dashboard.html?section=notifications" class="header-notif-btn" title="\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);color:var(--text-primary);text-decoration:none;font-size:16px;transition:all 0.2s">
          <span>\u{1F514}</span>
          <span id="header-notifs-badge" class="header-notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:9999px;border:1.5px solid #fff;min-width:16px;text-align:center">0</span>
        </a>

        <div style="position:relative">
          <button class="header__user-btn" id="usr-btn" aria-haspopup="true" aria-expanded="false">
            <img src="${F(t.photoURL||"./icons/icon-72x72.png")}"
                 class="header__avatar" width="32" height="32"
                 onerror="this.src='./icons/icon-72x72.png'"
                 alt="${x(t.name)}"/>
            <span class="header__user-name">${x((t.name||"").split(" ")[0])}</span>
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
      </div>`;const s=document.getElementById("usr-btn"),o=document.getElementById("usr-dd");s&&o&&(s.addEventListener("click",a=>{if(a.preventDefault(),a.stopPropagation(),window.innerWidth<769){openDashboardMoreModal(t);return}const e=o.classList.contains("open");o.classList.toggle("open",!e),s.setAttribute("aria-expanded",e?"false":"true")}),document.addEventListener("click",a=>{!a.target.closest("#usr-btn")&&!a.target.closest("#usr-dd")&&(o.classList.remove("open"),s.setAttribute("aria-expanded","false"))})),document.getElementById("logout-btn")?.addEventListener("click",async()=>{await T(),d.success("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D"),location.reload()})}else n.innerHTML='<a href="login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>'}export async function openDashboardMoreModal(t=null){const n=t||P(),s=!!(n&&(n.uid||n.id)),o=s&&_(n),a=s?n.name||n.displayName||"\u0635\u0627\u062D\u0628 \u0627\u0644\u0646\u0634\u0627\u0637":"\u0632\u0627\u0626\u0631 \u0643\u0631\u064A\u0645",e=s&&n.photoURL||"./icons/icon-72x72.png",i=typeof window<"u"&&(window.location.pathname.endsWith("dashboard.html")||window.location.pathname.endsWith("/dashboard.html")),r=s?`
    <div class="more-menu-container" style="direction:rtl;text-align:right">
      <!-- User Info Card -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;background:var(--surface-2,#F8FAFC);border-radius:14px;margin-bottom:12px;border:1px solid var(--border,#E2E8F0)">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${F(e)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--primary,#1B4F72)" alt="${x(a)}" onerror="this.src='./icons/icon-72x72.png'"/>
          <div>
            <div style="font-weight:800;font-size:0.98rem;color:var(--text-primary,#0F172A)">${x(a)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted,#64748B)">${o?"\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629 \u2B50":"\u0635\u0627\u062D\u0628 \u062D\u0633\u0627\u0628 \u062A\u062C\u0627\u0631\u064A"}</div>
          </div>
        </div>
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

      <!-- Dashboard Sections Grid -->
      <div style="font-weight:800;font-size:0.88rem;color:var(--text-muted,#64748B);margin-bottom:8px">\u0623\u0642\u0633\u0627\u0645 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645</div>
      <div class="more-menu-grid">
        <a href="dashboard.html?section=overview" class="more-menu-tile" data-dash-nav="overview">
          <span class="tile-icon">\u{1F4CA}</span>
          <span class="tile-title">\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629</span>
        </a>
        <a href="dashboard.html?section=places" class="more-menu-tile" data-dash-nav="places">
          <span class="tile-icon">\u{1F3EA}</span>
          <span class="tile-title">\u0623\u0645\u0627\u0643\u0646\u064A</span>
        </a>
        <a href="dashboard.html?section=add" class="more-menu-tile" data-dash-nav="add" style="background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.3);color:#059669">
          <span class="tile-icon">\u2795</span>
          <span class="tile-title">\u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646</span>
        </a>
        <a href="dashboard.html?section=offers" class="more-menu-tile" data-dash-nav="offers">
          <span class="tile-icon">\u{1F3F7}\uFE0F</span>
          <span class="tile-title">\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0631\u0648\u0636</span>
        </a>
        <a href="dashboard.html?section=products" class="more-menu-tile" data-dash-nav="products">
          <span class="tile-icon">\u{1F4E6}</span>
          <span class="tile-title">\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</span>
        </a>
        <a href="dashboard.html?section=notifications" class="more-menu-tile" data-dash-nav="notifications">
          <span class="tile-icon">\u{1F514}</span>
          <span class="tile-title">\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A</span>
        </a>
        <a href="dashboard.html?section=following" class="more-menu-tile" data-dash-nav="following">
          <span class="tile-icon">\u2B50</span>
          <span class="tile-title">\u0645\u062A\u0627\u0628\u0639\u0627\u062A\u064A</span>
        </a>
        <a href="dashboard.html?section=loyalty" class="more-menu-tile" data-dash-nav="loyalty">
          <span class="tile-icon">\u{1F381}</span>
          <span class="tile-title">\u0646\u0627\u062F\u064A \u0627\u0644\u0648\u0644\u0627\u0621</span>
        </a>
        <a href="around-me.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F9ED}</span>
          <span class="tile-title">\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A</span>
        </a>
        <a href="popular.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F525}</span>
          <span class="tile-title">\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629</span>
        </a>
        <a href="favorites.html" class="more-menu-tile">
          <span class="tile-icon">\u2764\uFE0F</span>
          <span class="tile-title">\u0627\u0644\u0645\u0641\u0636\u0644\u0629</span>
        </a>
        ${o?`
          <a href="admin.html" class="more-menu-tile" style="grid-column:1 / -1;background:rgba(27,79,114,0.08);border-color:rgba(27,79,114,0.3);color:var(--primary)">
            <span class="tile-icon">\u2699\uFE0F</span>
            <span class="tile-title">\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629</span>
          </a>
        `:""}
      </div>

      <!-- Quick Services -->
      <div style="font-weight:800;font-size:0.88rem;color:var(--text-muted,#64748B);margin-bottom:6px;margin-top:4px">\u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064A\u0639\u0629</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <a href="contact.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F4AC}</span>
          <span>\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A</span>
        </a>
        <a href="quran.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F4D6}</span>
          <span>\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u0623\u0630\u0643\u0627\u0631</span>
        </a>
        <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="more-menu-row">
          <span style="font-size:18px">\u{1F4E5}</span>
          <span>\u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F APK</span>
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
          \u064A\u0646\u062A\u0638\u0631\u0643 \u0627\u0644\u0639\u062F\u064A\u062F \u0645\u0646 \u0627\u0644\u0645\u0645\u064A\u0632\u0627\u062A \u0648\u0627\u0644\u0639\u0631\u0648\u0636
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

        <div style="margin-top:14px;padding-top:10px;border-top:1px dashed rgba(245,158,11,0.3);display:flex;flex-direction:column;gap:3px">
          <div style="font-weight:900;font-size:0.92rem;color:var(--primary,#1B4F72)">\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A</div>
          <div style="font-size:0.8rem;color:#D97706;font-weight:700">\u0627\u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0623\u0648\u0644 \u0641\u0649 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u2B50</div>
        </div>
      </div>

      <!-- Quick Links for Guests -->
      <div style="font-weight:800;font-size:0.88rem;color:var(--text-muted,#64748B);margin-bottom:8px">\u0631\u0648\u0627\u0628\u0637 \u062A\u0647\u0645\u0643</div>
      <div class="more-menu-grid" style="margin-bottom:10px">
        <a href="around-me.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F9ED}</span>
          <span class="tile-title">\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A</span>
        </a>
        <a href="popular.html" class="more-menu-tile">
          <span class="tile-icon">\u{1F525}</span>
          <span class="tile-title">\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629</span>
        </a>
        <a href="favorites.html" class="more-menu-tile">
          <span class="tile-icon">\u2764\uFE0F</span>
          <span class="tile-title">\u0627\u0644\u0645\u0641\u0636\u0644\u0629</span>
        </a>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px">
        <a href="contact.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F4AC}</span>
          <span>\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A</span>
        </a>
        <a href="quran.html" class="more-menu-row">
          <span style="font-size:18px">\u{1F4D6}</span>
          <span>\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u0623\u0630\u0643\u0627\u0631</span>
        </a>
        <a href="dalilmanzala.apk" download="dalilmanzala.apk" class="more-menu-row">
          <span style="font-size:18px">\u{1F4E5}</span>
          <span>\u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F APK</span>
        </a>
      </div>
    </div>
  `,{showModal:u}=await import("../ui/components/Modal.js"),h=u({title:s?"\u2630 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0648\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645":"\u2630 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",content:r,sheet:!0,closeable:!0,size:"sm"}),b=document.querySelector(".modal");return b&&(b.querySelectorAll("[data-dash-nav]").forEach(f=>{f.addEventListener("click",c=>{const l=f.getAttribute("data-dash-nav");i&&typeof window.switchDashboardSection=="function"?(c.preventDefault(),h.close(),window.switchDashboardSection(l,null,!0)):h.close()})}),document.getElementById("more-modal-logout-btn")?.addEventListener("click",async()=>{h.close(),await T(),d.success("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D"),window.location.reload()}),document.getElementById("more-modal-google-login-btn")?.addEventListener("click",async f=>{f.preventDefault();const c=f.currentTarget,l=c.innerHTML;try{c.disabled=!0,c.style.opacity="0.7",c.innerHTML="<span>\u062C\u0627\u0631\u064A \u0641\u062A\u062D \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644...</span>";const m=await G();m?(h.close(),d.success(`\u0623\u0647\u0644\u0627\u064B \u0628\u0643 ${m.displayName||m.name||""} \u{1F44B}`),window.location.reload()):(c.disabled=!1,c.style.opacity="1",c.innerHTML=l)}catch(m){c.disabled=!1,c.style.opacity="1",c.innerHTML=l,console.error("[MoreModal GoogleSignIn] error:",m),m?.code!=="auth/popup-closed-by-user"&&d.error("\u062A\u0639\u0630\u0631 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644: "+(m?.message||"\u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649"))}})),h}typeof window<"u"&&(window.openDashboardMoreModal=openDashboardMoreModal);let g=typeof window<"u"&&window.__deferredPwaPrompt?window.__deferredPwaPrompt:null;typeof window<"u"&&(window.addEventListener("beforeinstallprompt",t=>{t.preventDefault(),g=t,window.__deferredPwaPrompt=t}),window.addEventListener("appinstalled",()=>{try{localStorage.setItem("pwa-installed","true")}catch{}g=null,typeof window<"u"&&(window.__deferredPwaPrompt=null),v()}));function te(){return typeof window>"u"?!1:!!(window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: window-controls-overlay)").matches||window.navigator.standalone||document.referrer.includes("android-app://")||localStorage.getItem("pwa-installed")==="true")}function ae(){try{const t=localStorage.getItem("pwa-dismissed");if(!t)return!1;const n=parseInt(t,10);return isNaN(n)?!1:Date.now()-n<7200*1e3}catch{return!1}}function I(){if(te()||ae())return!1;try{if(sessionStorage.getItem("pwa_session_shown")==="true")return!1}catch{}return!0}function ne(){const t=!localStorage.getItem("manzala_voice_guide_seen");t&&setTimeout(()=>{S()},2e3);const n=t?12e3:5e3,s=()=>{(g||typeof window<"u"&&window.__deferredPwaPrompt)&&I()&&!document.getElementById("voice-guide-callout")&&oe()};I()&&(g||typeof window<"u"&&window.__deferredPwaPrompt?setTimeout(s,n):typeof window<"u"&&window.addEventListener("beforeinstallprompt",()=>{setTimeout(s,n)},{once:!0})),document.addEventListener("click",o=>{if(o.target.closest("#pwa-banner-close")||o.target.closest("#pwa-banner-later")){o.preventDefault(),v();return}if(o.target.closest("#pwa-install-btn")){o.preventDefault(),se();return}if(o.target.closest("#desktop-voice-fab")){o.preventDefault();try{import("../services/voice.service.js").then(({openManzalaVoiceAssistantModal:a})=>a()).catch(()=>{})}catch{}return}})}function oe(){if(!I())return;const t=document.getElementById("pwa-banner");if(t){try{sessionStorage.setItem("pwa_session_shown","true")}catch{}t.hidden=!1,t.style.display="block",requestAnimationFrame(()=>{t.classList.add("visible")})}}function v(){const t=document.getElementById("pwa-banner");t&&(t.classList.remove("visible"),setTimeout(()=>{t.hidden=!0,t.style.display="none"},350));try{localStorage.setItem("pwa-dismissed",Date.now().toString()),sessionStorage.setItem("pwa_session_shown","true")}catch{}S()}async function se(){const t=g||(typeof window<"u"?window.__deferredPwaPrompt:null);if(t)try{t.prompt();const{outcome:n}=await t.userChoice;if(n==="accepted"){try{localStorage.setItem("pwa-installed","true")}catch{}v(),d.success("\u062A\u0645 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0646\u062C\u0627\u062D! \u0633\u062A\u062C\u062F\u0647 \u0641\u064A \u0634\u0627\u0634\u0629 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0647\u0627\u062A\u0641\u0643 \u{1F389}"),setTimeout(()=>S(),1200)}else v()}catch{v()}finally{g=null,typeof window<"u"&&(window.__deferredPwaPrompt=null)}else v()}function S(){if(!(typeof document>"u")){try{if(localStorage.getItem("manzala_voice_guide_seen")==="true")return;localStorage.setItem("manzala_voice_guide_seen","true")}catch{return}setTimeout(()=>{const t=window.innerWidth>=769;let n=null;if(t?n=document.getElementById("desktop-voice-fab")||document.getElementById("global-voice-assistant-fab"):n=document.getElementById("global-voice-assistant-fab")||document.querySelector(".bottom-nav__fab-btn")||document.querySelector(".bottom-nav__fab"),!n)return;document.getElementById("voice-guide-callout")?.remove();const s=document.getElementById("pwa-banner");s&&s.classList.contains("visible")&&(s.classList.remove("visible"),s.style.display="none",s.hidden=!0);const o=document.createElement("div");o.className="voice-guide-callout",o.id="voice-guide-callout",o.setAttribute("role","tooltip"),o.innerHTML=`
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
    `,document.body.appendChild(o),n.classList.add("voice-mic-highlighted");const a=()=>{o.classList.add("fade-out"),n?.classList.remove("voice-mic-highlighted"),setTimeout(()=>o.remove(),350)};o.querySelector("#voice-guide-callout-close")?.addEventListener("click",i=>{i.stopPropagation(),a()}),o.querySelector("#voice-guide-bubble")?.addEventListener("click",i=>{if(!i.target.closest("#voice-guide-callout-close")){a();try{import("../services/voice.service.js").then(({openManzalaVoiceAssistantModal:r})=>r()).catch(()=>{})}catch{}}}),n.addEventListener("click",a,{once:!0});const e=i=>{!o.contains(i.target)&&!n.contains(i.target)&&(a(),document.removeEventListener("click",e))};setTimeout(()=>{document.addEventListener("click",e)},400),setTimeout(()=>{document.body.contains(o)&&(a(),document.removeEventListener("click",e))},9e3)},500)}}function x(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function F(t){return t?String(t).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function ie(){if(typeof window>"u")return;const t=new Date().getFullYear(),n=()=>{try{console.log(`%c\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${t}).`,"background: linear-gradient(135deg, #0B2239, #153A5C); color: #F5A623; font-size: 16px; font-weight: 800; padding: 12px 20px; border-radius: 8px; border: 2px solid #F5A623; font-family: Cairo, Tahoma, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.5);"),console.log(`%c\u26A0\uFE0F \u062A\u062D\u0630\u064A\u0631 \u0642\u0627\u0646\u0648\u0646\u064A \u0631\u0633\u0645\u064A:
\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0645\u0633\u062C\u0644\u0629 \u0648\u0645\u062D\u0645\u064A\u0629 \u0631\u0642\u0645\u064A\u0627\u064B\u060C \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0646\u0642\u0644\u0647\u0627 \u0623\u0648 \u0646\u0633\u062E\u0647\u0627 \u062D\u062A\u0649 \u0644\u0627 \u064A\u062A\u0645 \u0645\u0633\u0627\u0621\u0644\u062A\u0643 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u0623\u0645\u0627\u0645 \u0627\u0644\u0645\u062D\u0627\u0643\u0645 \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629.`,"color: #EF4444; font-size: 13px; font-weight: 700; line-height: 1.8; font-family: Cairo, Tahoma, sans-serif;"),console.log("%c\u0631\u0627\u0628\u0637 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629: %chttps://dalilmanzala.com/","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #0284C7; font-size: 11px; font-weight: 700; text-decoration: underline;"),console.log("%c\u{1F4AC} \u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A: %chttps://wa.me/wasendernew","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #10B981; font-size: 11px; font-weight: 700; text-decoration: underline;")}catch{}};n();let s=window.outerWidth-window.innerWidth,o=window.outerHeight-window.innerHeight;window.addEventListener("resize",()=>{const a=window.outerWidth-window.innerWidth,e=window.outerHeight-window.innerHeight;(a!==s||e!==o)&&(s=a,o=e,n())},{passive:!0}),document.addEventListener("contextmenu",a=>{const e=a.target.tagName.toLowerCase();e==="input"||e==="textarea"||a.target.isContentEditable||(a.preventDefault(),typeof d<"u"&&d.info&&d.info("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0645\u064A\u0629 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u2014 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0646\u0633\u062E \u0623\u0648 \u0646\u0642\u0644 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("copy",a=>{const e=a.target.tagName?a.target.tagName.toLowerCase():"";e==="input"||e==="textarea"||a.target.isContentEditable||(a.preventDefault(),a.clipboardData&&a.clipboardData.setData("text/plain",`\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${t}). https://dalilmanzala.com/`),typeof d<"u"&&d.warning&&d.warning("\u26A0\uFE0F \u062A\u0645 \u062D\u0641\u0638 \u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0644\u0643\u064A\u0629: \u0644\u0627 \u064A\u062C\u0648\u0632 \u0646\u0633\u062E \u0623\u0648 \u0627\u0642\u062A\u0628\u0627\u0633 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("cut",a=>{const e=a.target.tagName?a.target.tagName.toLowerCase():"";e==="input"||e==="textarea"||a.target.isContentEditable||a.preventDefault()}),document.addEventListener("keydown",a=>{const e=a.target.tagName?a.target.tagName.toLowerCase():"",i=e==="input"||e==="textarea"||a.target.isContentEditable;(a.key==="F12"||a.ctrlKey&&a.shiftKey&&(a.key==="I"||a.key==="i"||a.key==="J"||a.key==="j"||a.key==="C"||a.key==="c"))&&n(),a.ctrlKey&&(a.key==="u"||a.key==="U"||a.key==="s"||a.key==="S"||a.key==="p"||a.key==="P")&&(a.preventDefault(),typeof d<"u"&&d.warning&&d.warning("\u{1F512} \u0645\u0635\u062F\u0631 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644 \u0645\u062D\u0645\u064A\u0629 \u0628\u0645\u0648\u062C\u0628 \u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0627\u0644\u0641\u0643\u0631\u064A\u0629.")),a.ctrlKey&&(a.key==="c"||a.key==="C")&&!i&&(window.getSelection?window.getSelection().toString():"").length>0&&(a.preventDefault(),typeof d<"u"&&d.warning&&d.warning("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0645\u062D\u0645\u064A: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0646\u0633\u062E \u0644\u0645\u0646\u0639 \u0627\u0644\u062A\u0639\u062F\u064A \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A."))})}async function re(){try{const t=P();if(t&&_(t))return;if(t&&t.status==="suspended"){D("\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u062D\u0633\u0627\u0628\u0643 \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629 \u0644\u0645\u062E\u0627\u0644\u0641\u0629 \u0627\u0644\u0634\u0631\u0648\u0637.");return}const n=await j();if(n){const{isIpBanned:s}=await import("./db.js"),o=await s(n);if(o){const a=o.reason||"\u0645\u062E\u0627\u0644\u0641\u0629 \u0645\u0639\u0627\u064A\u064A\u0631 \u0648\u0633\u064A\u0627\u0633\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629",e=o.bannedUntil?new Date(o.bannedUntil).toLocaleDateString("ar-EG"):null,i=o.isPermanent?`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${n}) \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u0646\u0635\u0629 \u0628\u0633\u0628\u0628: ${a}`:`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${n}) \u062D\u062A\u0649 ${e} \u0628\u0633\u0628\u0628: ${a}`;D(i)}}}catch(t){console.debug("[_enforceBanGuard] notice:",t)}}function D(t){document.body.innerHTML=`
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
  `}function le(){const t=document.getElementById("header-search-container"),n=document.getElementById("header-search-pill"),s=document.getElementById("header-search-trigger"),o=document.getElementById("header-search-input"),a=document.getElementById("header-search-clear"),e=document.getElementById("header-live-dropdown"),i=document.getElementById("header-live-list"),r=document.getElementById("header-live-count"),u=document.getElementById("header-live-all-btn");if(!o)return;let h=null,b=0;const f=()=>{n?.classList.add("expanded"),o.focus(),o.value.trim().length>=1&&e?.classList.add("visible")},c=()=>{n?.classList.remove("expanded"),e?.classList.remove("visible")};s?.addEventListener("click",l=>{l.stopPropagation(),n?.classList.contains("expanded")&&o.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(o.value.trim())}`:f()}),o.addEventListener("focus",()=>{n?.classList.add("expanded"),o.value.trim().length>=1&&i?.children.length>0&&e?.classList.add("visible")}),a?.addEventListener("click",l=>{l.stopPropagation(),o.value="",a.classList.remove("visible"),e?.classList.remove("visible"),i&&(i.innerHTML=""),o.focus()}),o.addEventListener("keydown",l=>{l.key==="Enter"&&o.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(o.value.trim())}`:l.key==="Escape"&&c()}),o.addEventListener("input",()=>{const l=o.value.trim();if(a?.classList.toggle("visible",l.length>0),u&&(u.href=`search.html?q=${encodeURIComponent(l)}`),!l){e?.classList.remove("visible"),i&&(i.innerHTML="");return}clearTimeout(h),h=setTimeout(async()=>{const m=++b;try{const{executeFastSearch:E}=await import("../services/search-engine.service.js"),w=await E(l,{limit:6});if(m!==b||!e||!i)return;if(!w||w.length===0){r&&(r.textContent="0"),i.innerHTML=`
            <div class="header-live-empty">
              <div class="header-live-empty__icon">\u{1F50D}</div>
              <div class="header-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="header-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,e.classList.add("visible");return}r&&(r.textContent=String(w.length)),i.innerHTML=w.map(L=>{const p=L.raw||L,B=p.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",z=p.categoryName||L.category||"",H=p.area||p.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",q=p.slug||p.id||"",C=p.photoURL||p.logo||p.coverURL||"",U=p.isVerified||!1,$=p.isOpen!==void 0?p.isOpen:!0,M=(B.trim()[0]||"\u0645").toUpperCase();return`
            <a href="/place.html?slug=${encodeURIComponent(q)}" class="header-live-dropdown__item" role="option">
              <div class="header-live-avatar">
                ${C?`<img src="${C}" alt="${k(B)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'header-live-avatar-fallback\\'>${M}</div>'"/>`:`<div class="header-live-avatar-fallback">${M}</div>`}
              </div>
              <div class="header-live-content">
                <div class="header-live-title-row">
                  <span class="header-live-name">${k(B)}</span>
                  ${U?'<span class="header-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="header-live-meta-row">
                  ${z?`<span class="header-live-cat">${k(z)}</span>`:""}
                  <span class="header-live-area">${k(H)}</span>
                  <span class="${$?"header-live-status-open":"header-live-status-closed"}">
                    ${$?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
            </a>
          `}).join(""),e.classList.add("visible")}catch(E){console.warn("[HeaderLiveSearch] search error:",E)}},120)}),document.addEventListener("click",l=>{t?.contains(l.target)||(e?.classList.remove("visible"),window.innerWidth<=767&&n?.classList.remove("expanded"))})}function k(t){return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
