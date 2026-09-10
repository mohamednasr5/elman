import{initAuth as W,onAuthStateChange as N,signOut as M,waitForAuth as R,isAdmin as _,getCurrentUser as P,getClientIp as j,signInWithGoogle as G}from"./auth.js";import{toast as c}from"../ui/components/Toast.js";function K(e){return`
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
      ${[["index.html","\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"],["popular.html","\u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0639\u0628\u064A\u0629 \u{1F525}"],["places.html","\u0627\u0644\u0623\u0645\u0627\u0643\u0646"],["categories.html","\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A"],["offers.html","\u0627\u0644\u0639\u0631\u0648\u0636"],["now.html","\u064A\u062D\u062F\u062B \u0627\u0644\u0622\u0646 \u{1F525}"],["around-me.html","\u0628\u0627\u0644\u0642\u0631\u0628 \u0645\u0646\u064A \u{1F9ED}"],["favorites.html","\u2764\uFE0F \u0627\u0644\u0645\u0641\u0636\u0644\u0629"]].map(([i,o])=>`<a href="${i}" class="header__nav-link${i===e?" active":""}">${o}</a>`).join("")}
    </nav>
    
    <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u0648\u0627\u0644\u0646\u0647\u0627\u0631\u064A" title="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A / \u0627\u0644\u0641\u0627\u062A\u062D">
      <span class="theme-icon-light">\u2600\uFE0F</span>
      <span class="theme-icon-dark">\u{1F319}</span>
    </button>

    <div class="header__user" id="header-user-section">
      <a href="login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>
    </div>
  </div>
</header>`}function V(e){if(e==="admin/index.html")return`
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
</nav>`;if(e==="dashboard.html")return`
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
  <a href="${n[0][0]}" class="bottom-nav__item${n[0][0]===e?" active":""}">
    <span class="bottom-nav__icon">${n[0][1]}</span>
    <span class="bottom-nav__label">${n[0][2]}</span>
  </a>
  <a href="${n[1][0]}" class="bottom-nav__item${n[1][0]===e?" active":""}">
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
  <a href="${n[2][0]}" class="bottom-nav__item${n[2][0]===e?" active":""}">
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
</div>`}export async function initPage(e=""){J(),y("header-slot",K(e));const n=e==="index.html"||e==="home"||typeof window<"u"&&(window.location.pathname==="/"||window.location.pathname.endsWith("/index.html")||window.location.pathname.endsWith("/"));if(e==="place.html"||e==="place"||typeof window<"u"&&(window.location.pathname.includes("place.html")||window.location.pathname.startsWith("/p/"))){const t=document.getElementById("wide-ads-banner");t&&t.remove()}else if(n){const t=(l=0)=>{const r=document.getElementById("wide-ads-banner");r&&!r.dataset.wideAdsMounted?import("../ui/components/WideAdsBanner.js").then(({mountWideAdsBanner:m})=>m(r)).catch(()=>{}):!r&&l<25&&setTimeout(()=>t(l+1),100)};t()}else{let t=document.getElementById("wide-ads-banner");if(!t){t=document.createElement("div"),t.id="wide-ads-banner",t.className="container wide-ads-banner-page-top",t.style.marginTop="calc(var(--header-height, 64px) + 22px)",t.style.marginBottom="24px";const l=document.getElementById("site-header"),r=document.getElementById("page-container")||document.querySelector("main")||document.querySelector("#admin-container")||document.querySelector(".admin-layout")||document.querySelector("#app")||document.body;l&&l.nextSibling?l.parentNode.insertBefore(t,l.nextSibling):r&&r.firstChild?r.insertBefore(t,r.firstChild):r?r.appendChild(t):document.body.appendChild(t)}t&&setTimeout(()=>{import("../ui/components/WideAdsBanner.js").then(({mountWideAdsBanner:l})=>l(t)).catch(()=>{})},50)}y("footer-slot",O()),y("nav-slot",V(e)),y("pwa-slot",Y()),Q(),X();try{import("../services/voice.service.js").then(({bindGlobalVoiceAssistantFab:t})=>t()).catch(t=>console.warn("[initPage] voice FAB init failed:",t))}catch(t){console.warn("[initPage] voice FAB import failed:",t)}const o=document.getElementById("site-header"),a=document.getElementById("scroll-to-top-btn");window.addEventListener("scroll",()=>{const t=window.scrollY||window.pageYOffset||0;o?.classList.toggle("scrolled",t>8),a?.classList.toggle("visible",t>300)},{passive:!0}),a?.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})});try{re()}catch(t){console.warn("[initPage] header search init failed:",t)}document.addEventListener("click",t=>{(t.target.closest("#bottom-nav-more-btn")||t.target.closest("#dash-bottom-more-btn"))&&(t.preventDefault(),openDashboardMoreModal())});const s=t=>{"requestIdleCallback"in window?requestIdleCallback(t,{timeout:2500}):setTimeout(t,0)};s(async()=>{try{const{ensureFirebaseReady:t}=await import("./firebase.js");(await t(2500))?.auth&&W()}catch{}try{await le()}catch{}try{const[{initLiveNotificationSubscriber:t},{initFcmMessaging:l}]=await Promise.all([import("../services/notification.service.js"),import("../services/fcm.service.js")]);N(r=>{ee(r),t(r?.uid),l(r)})}catch{}try{const{getSettings:t}=await import("./db.js"),r=(await t())?.contact?.whatsappLink;r&&document.querySelectorAll("[data-wa]").forEach(m=>{m.href=r})}catch{}});try{ne()}catch(t){console.warn("[initPage] PWA setup failed:",t)}"serviceWorker"in navigator&&s(()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));try{["manzala_fast_places_cache","manzala_live_news_store_v2","manzala_global_broadcast_notifs_cache"].forEach(l=>localStorage.removeItem(l))}catch{}s(()=>{import("../services/realtime-sync.service.js").then(({initRealtimePwaSyncBus:t})=>t()).catch(()=>{}),import("../utils/mobile-tooltip.js").then(({initUniversalMobileTouchTooltips:t})=>t()).catch(()=>{});try{Z()}catch{}try{ie()}catch{}})}function Q(){try{(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.matchMedia&&window.matchMedia("(display-mode: fullscreen)").matches||window.matchMedia&&window.matchMedia("(display-mode: minimal-ui)").matches||window.navigator.standalone===!0||document.referrer&&document.referrer.includes("android-app://")||navigator.userAgent&&(navigator.userAgent.includes("wv")||navigator.userAgent.includes("Android")&&navigator.userAgent.includes("Version/"))||new URLSearchParams(window.location.search).get("source")==="apk"||new URLSearchParams(window.location.search).get("source")==="pwa")&&document.querySelectorAll("#footer-apk-container, .footer__apk-download, .apk-pro-download-btn").forEach(n=>{n.style.display="none"})}catch{}}function J(){const e=localStorage.getItem("elmanzala-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");A(e)}function X(){document.querySelectorAll("#theme-toggle-btn, .theme-toggle-btn").forEach(e=>{e.addEventListener("click",()=>{const i=(document.documentElement.getAttribute("data-theme")||"light")==="dark"?"light":"dark";A(i),localStorage.setItem("elmanzala-theme",i),c.info(i==="dark"?"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u{1F319}":"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A \u2600\uFE0F")})})}function A(e){document.documentElement.setAttribute("data-theme",e),document.body&&(document.body.classList.toggle("dark-theme",e==="dark"),document.body.classList.toggle("light-theme",e==="light"));const n=document.querySelector('meta[name="theme-color"]');n&&n.setAttribute("content",e==="dark"?"#0F172A":"#1B4F72")}function Z(){const e=new Set,n=a=>{if(a)try{const s=new URL(a,location.href);if(s.origin===location.origin&&!e.has(s.href)){e.add(s.href);const t=document.createElement("link");t.rel="prefetch",t.href=s.href,document.head.appendChild(t)}}catch{}};document.addEventListener("mouseover",a=>{const s=a.target.closest("a[href]");s&&n(s.href)},{passive:!0}),document.addEventListener("touchstart",a=>{const s=a.target.closest("a[href]");s&&n(s.href)},{passive:!0});const i=["index.html","popular.html","places.html","categories.html","offers.html","search.html"],o=()=>{i.forEach(a=>n(a))};"requestIdleCallback"in window?window.requestIdleCallback(o,{timeout:1500}):setTimeout(o,800)}export{R as waitForAuth,_ as isAdmin};function y(e,n){const i=document.getElementById(e);if(!i)return;const o=document.createElement("div");o.innerHTML=n.trim(),i.replaceWith(o.firstElementChild)}function ee(e){const n=document.getElementById("header-user-section");if(n)if(e){n.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px">
        <a href="dashboard.html?section=notifications" class="header-notif-btn" title="\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);color:var(--text-primary);text-decoration:none;font-size:16px;transition:all 0.2s">
          <span>\u{1F514}</span>
          <span id="header-notifs-badge" class="header-notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:9999px;border:1.5px solid #fff;min-width:16px;text-align:center">0</span>
        </a>

        <div style="position:relative">
          <button class="header__user-btn" id="usr-btn" aria-haspopup="true" aria-expanded="false">
            <img src="${D(e.photoURL||"./icons/icon-72x72.png")}"
                 class="header__avatar" width="32" height="32"
                 onerror="this.src='./icons/icon-72x72.png'"
                 alt="${x(e.name)}"/>
            <span class="header__user-name">${x((e.name||"").split(" ")[0])}</span>
            <span aria-hidden="true">\u25BE</span>
          </button>
          <div class="header__dropdown" id="usr-dd" role="menu">
            <a href="dashboard.html"                          class="header__dropdown-item" role="menuitem">\u{1F3E0} \u0644\u0648\u062D\u062A\u064A</a>
            <a href="dashboard.html?section=notifications"    class="header__dropdown-item" role="menuitem">\u{1F514} \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A</a>
            <a href="dashboard.html?section=add"              class="header__dropdown-item" role="menuitem">\u2795 \u0625\u0636\u0627\u0641\u0629 \u0645\u0643\u0627\u0646</a>
            ${_(e)?'<a href="admin.html" class="header__dropdown-item" style="color:var(--secondary,#F5A623);font-weight:bold" role="menuitem">\u2699\uFE0F \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629</a>':""}
            <a href="dashboard.html?section=loyalty"          class="header__dropdown-item" role="menuitem">\u{1F381} \u0646\u0627\u062F\u064A \u0627\u0644\u0648\u0644\u0627\u0621 \u0648\u0627\u0644\u0646\u0642\u0627\u0637</a>
            <hr style="margin:4px 0;border:none;border-top:1px solid var(--border)"/>
            <button class="header__dropdown-item" id="logout-btn" role="menuitem" style="color:var(--danger)">\u{1F6AA} \u062E\u0631\u0648\u062C</button>
          </div>
        </div>
      </div>`;const i=document.getElementById("usr-btn"),o=document.getElementById("usr-dd");i&&o&&(i.addEventListener("click",a=>{if(a.preventDefault(),a.stopPropagation(),window.innerWidth<769){openDashboardMoreModal(e);return}const s=o.classList.contains("open");o.classList.toggle("open",!s),i.setAttribute("aria-expanded",s?"false":"true")}),document.addEventListener("click",a=>{!a.target.closest("#usr-btn")&&!a.target.closest("#usr-dd")&&(o.classList.remove("open"),i.setAttribute("aria-expanded","false"))})),document.getElementById("logout-btn")?.addEventListener("click",async()=>{await M(),c.success("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D"),location.reload()})}else n.innerHTML='<a href="login.html" class="btn btn-primary btn-sm"><span>\u{1F511}</span> \u062F\u062E\u0648\u0644</a>'}export async function openDashboardMoreModal(e=null){const n=e||P(),i=!!(n&&(n.uid||n.id)),o=i&&_(n),a=i?n.name||n.displayName||"\u0635\u0627\u062D\u0628 \u0627\u0644\u0646\u0634\u0627\u0637":"\u0632\u0627\u0626\u0631 \u0643\u0631\u064A\u0645",s=i&&n.photoURL||"./icons/icon-72x72.png",t=typeof window<"u"&&(window.location.pathname.endsWith("dashboard.html")||window.location.pathname.endsWith("/dashboard.html")),l=i?`
    <div class="more-menu-container" style="direction:rtl;text-align:right">
      <!-- User Info Card -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;background:var(--surface-2,#F8FAFC);border-radius:14px;margin-bottom:12px;border:1px solid var(--border,#E2E8F0)">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${D(s)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--primary,#1B4F72)" alt="${x(a)}" onerror="this.src='./icons/icon-72x72.png'"/>
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
  `,{showModal:r}=await import("../ui/components/Modal.js"),m=r({title:i?"\u2630 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0648\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645":"\u2630 \u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629",content:l,sheet:!0,closeable:!0,size:"sm"}),b=document.querySelector(".modal");return b&&(b.querySelectorAll("[data-dash-nav]").forEach(f=>{f.addEventListener("click",p=>{const d=f.getAttribute("data-dash-nav");t&&typeof window.switchDashboardSection=="function"?(p.preventDefault(),m.close(),window.switchDashboardSection(d,null,!0)):m.close()})}),document.getElementById("more-modal-logout-btn")?.addEventListener("click",async()=>{m.close(),await M(),c.success("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D"),window.location.reload()}),document.getElementById("more-modal-google-login-btn")?.addEventListener("click",async f=>{f.preventDefault();const p=f.currentTarget,d=p.innerHTML;try{p.disabled=!0,p.style.opacity="0.7",p.innerHTML="<span>\u062C\u0627\u0631\u064A \u0641\u062A\u062D \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644...</span>";const h=await G();h?(m.close(),c.success(`\u0623\u0647\u0644\u0627\u064B \u0628\u0643 ${h.displayName||h.name||""} \u{1F44B}`),window.location.reload()):(p.disabled=!1,p.style.opacity="1",p.innerHTML=d)}catch(h){p.disabled=!1,p.style.opacity="1",p.innerHTML=d,console.error("[MoreModal GoogleSignIn] error:",h),h?.code!=="auth/popup-closed-by-user"&&c.error("\u062A\u0639\u0630\u0631 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644: "+(h?.message||"\u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649"))}})),m}typeof window<"u"&&(window.openDashboardMoreModal=openDashboardMoreModal);let g=typeof window<"u"&&window.__deferredPwaPrompt?window.__deferredPwaPrompt:null;typeof window<"u"&&(window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),g=e,window.__deferredPwaPrompt=e}),window.addEventListener("appinstalled",()=>{try{localStorage.setItem("pwa-installed","true")}catch{}g=null,typeof window<"u"&&(window.__deferredPwaPrompt=null),v()}));function te(){return typeof window>"u"?!1:!!(window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: window-controls-overlay)").matches||window.navigator.standalone||document.referrer.includes("android-app://")||localStorage.getItem("pwa-installed")==="true")}function ae(){try{const e=localStorage.getItem("pwa-dismissed");if(!e)return!1;const n=parseInt(e,10);return isNaN(n)?!1:Date.now()-n<7200*1e3}catch{return!1}}function I(){if(te()||ae())return!1;try{if(sessionStorage.getItem("pwa_session_shown")==="true")return!1}catch{}return!0}function ne(){const e=!localStorage.getItem("manzala_voice_guide_seen");e&&setTimeout(()=>{S()},2e3);const n=e?12e3:5e3,i=()=>{(g||typeof window<"u"&&window.__deferredPwaPrompt)&&I()&&!document.getElementById("voice-guide-callout")&&oe()};I()&&(g||typeof window<"u"&&window.__deferredPwaPrompt?setTimeout(i,n):typeof window<"u"&&window.addEventListener("beforeinstallprompt",()=>{setTimeout(i,n)},{once:!0})),document.addEventListener("click",o=>{if(o.target.closest("#pwa-banner-close")||o.target.closest("#pwa-banner-later")){o.preventDefault(),v();return}if(o.target.closest("#pwa-install-btn")){o.preventDefault(),se();return}if(o.target.closest("#desktop-voice-fab")){o.preventDefault();try{import("../services/voice.service.js").then(({openManzalaVoiceAssistantModal:a})=>a()).catch(()=>{})}catch{}return}})}function oe(){if(!I())return;const e=document.getElementById("pwa-banner");if(e){try{sessionStorage.setItem("pwa_session_shown","true")}catch{}e.hidden=!1,e.style.display="block",requestAnimationFrame(()=>{e.classList.add("visible")})}}function v(){const e=document.getElementById("pwa-banner");e&&(e.classList.remove("visible"),setTimeout(()=>{e.hidden=!0,e.style.display="none"},350));try{localStorage.setItem("pwa-dismissed",Date.now().toString()),sessionStorage.setItem("pwa_session_shown","true")}catch{}S()}async function se(){const e=g||(typeof window<"u"?window.__deferredPwaPrompt:null);if(e)try{e.prompt();const{outcome:n}=await e.userChoice;if(n==="accepted"){try{localStorage.setItem("pwa-installed","true")}catch{}v(),c.success("\u062A\u0645 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0646\u062C\u0627\u062D! \u0633\u062A\u062C\u062F\u0647 \u0641\u064A \u0634\u0627\u0634\u0629 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0647\u0627\u062A\u0641\u0643 \u{1F389}"),setTimeout(()=>S(),1200)}else v()}catch{v()}finally{g=null,typeof window<"u"&&(window.__deferredPwaPrompt=null)}else v()}function S(){if(!(typeof document>"u")){try{if(localStorage.getItem("manzala_voice_guide_seen")==="true")return;localStorage.setItem("manzala_voice_guide_seen","true")}catch{return}setTimeout(()=>{const e=window.innerWidth>=769;let n=null;if(e?n=document.getElementById("desktop-voice-fab")||document.getElementById("global-voice-assistant-fab"):n=document.getElementById("global-voice-assistant-fab")||document.querySelector(".bottom-nav__fab-btn")||document.querySelector(".bottom-nav__fab"),!n)return;document.getElementById("voice-guide-callout")?.remove();const i=document.getElementById("pwa-banner");i&&i.classList.contains("visible")&&(i.classList.remove("visible"),i.style.display="none",i.hidden=!0);const o=document.createElement("div");o.className="voice-guide-callout",o.id="voice-guide-callout",o.setAttribute("role","tooltip"),o.innerHTML=`
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
    `,document.body.appendChild(o),n.classList.add("voice-mic-highlighted");const a=()=>{o.classList.add("fade-out"),n?.classList.remove("voice-mic-highlighted"),setTimeout(()=>o.remove(),350)};o.querySelector("#voice-guide-callout-close")?.addEventListener("click",t=>{t.stopPropagation(),a()}),o.querySelector("#voice-guide-bubble")?.addEventListener("click",t=>{if(!t.target.closest("#voice-guide-callout-close")){a();try{import("../services/voice.service.js").then(({openManzalaVoiceAssistantModal:l})=>l()).catch(()=>{})}catch{}}}),n.addEventListener("click",a,{once:!0});const s=t=>{!o.contains(t.target)&&!n.contains(t.target)&&(a(),document.removeEventListener("click",s))};setTimeout(()=>{document.addEventListener("click",s)},400),setTimeout(()=>{document.body.contains(o)&&(a(),document.removeEventListener("click",s))},9e3)},500)}}function x(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function D(e){return e?String(e).replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function ie(){if(typeof window>"u")return;const e=new Date().getFullYear(),n=()=>{try{console.log(`%c\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${e}).`,"background: linear-gradient(135deg, #0B2239, #153A5C); color: #F5A623; font-size: 16px; font-weight: 800; padding: 12px 20px; border-radius: 8px; border: 2px solid #F5A623; font-family: Cairo, Tahoma, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.5);"),console.log(`%c\u26A0\uFE0F \u062A\u062D\u0630\u064A\u0631 \u0642\u0627\u0646\u0648\u0646\u064A \u0631\u0633\u0645\u064A:
\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0645\u0633\u062C\u0644\u0629 \u0648\u0645\u062D\u0645\u064A\u0629 \u0631\u0642\u0645\u064A\u0627\u064B\u060C \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0646\u0642\u0644\u0647\u0627 \u0623\u0648 \u0646\u0633\u062E\u0647\u0627 \u062D\u062A\u0649 \u0644\u0627 \u064A\u062A\u0645 \u0645\u0633\u0627\u0621\u0644\u062A\u0643 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u0623\u0645\u0627\u0645 \u0627\u0644\u0645\u062D\u0627\u0643\u0645 \u0628\u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629.`,"color: #EF4444; font-size: 13px; font-weight: 700; line-height: 1.8; font-family: Cairo, Tahoma, sans-serif;"),console.log("%c\u0631\u0627\u0628\u0637 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629: %chttps://dalilmanzala.com/","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #0284C7; font-size: 11px; font-weight: 700; text-decoration: underline;"),console.log("%c\u{1F4AC} \u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A: %chttps://wa.me/wasendernew","color: #64748B; font-size: 11px; font-family: Cairo, sans-serif;","color: #10B981; font-size: 11px; font-weight: 700; text-decoration: underline;")}catch{}};n();let i=window.outerWidth-window.innerWidth,o=window.outerHeight-window.innerHeight;window.addEventListener("resize",()=>{const a=window.outerWidth-window.innerWidth,s=window.outerHeight-window.innerHeight;(a!==i||s!==o)&&(i=a,o=s,n())},{passive:!0}),document.addEventListener("contextmenu",a=>{const s=a.target.tagName.toLowerCase();s==="input"||s==="textarea"||a.target.isContentEditable||(a.preventDefault(),typeof c<"u"&&c.info&&c.info("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0645\u064A\u0629 \u0642\u0627\u0646\u0648\u0646\u064A\u0627\u064B \u2014 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0646\u0633\u062E \u0623\u0648 \u0646\u0642\u0644 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("copy",a=>{const s=a.target.tagName?a.target.tagName.toLowerCase():"";s==="input"||s==="textarea"||a.target.isContentEditable||(a.preventDefault(),a.clipboardData&&a.clipboardData.setData("text/plain",`\xA9 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u0629 \u0648\u0627\u0644\u0645\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A (${e}). https://dalilmanzala.com/`),typeof c<"u"&&c.warning&&c.warning("\u26A0\uFE0F \u062A\u0645 \u062D\u0641\u0638 \u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0644\u0643\u064A\u0629: \u0644\u0627 \u064A\u062C\u0648\u0632 \u0646\u0633\u062E \u0623\u0648 \u0627\u0642\u062A\u0628\u0627\u0633 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644."))}),document.addEventListener("cut",a=>{const s=a.target.tagName?a.target.tagName.toLowerCase():"";s==="input"||s==="textarea"||a.target.isContentEditable||a.preventDefault()}),document.addEventListener("keydown",a=>{const s=a.target.tagName?a.target.tagName.toLowerCase():"",t=s==="input"||s==="textarea"||a.target.isContentEditable;(a.key==="F12"||a.ctrlKey&&a.shiftKey&&(a.key==="I"||a.key==="i"||a.key==="J"||a.key==="j"||a.key==="C"||a.key==="c"))&&n(),a.ctrlKey&&(a.key==="u"||a.key==="U"||a.key==="s"||a.key==="S"||a.key==="p"||a.key==="P")&&(a.preventDefault(),typeof c<"u"&&c.warning&&c.warning("\u{1F512} \u0645\u0635\u062F\u0631 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0644 \u0645\u062D\u0645\u064A\u0629 \u0628\u0645\u0648\u062C\u0628 \u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0627\u0644\u0641\u0643\u0631\u064A\u0629.")),a.ctrlKey&&(a.key==="c"||a.key==="C")&&!t&&(window.getSelection?window.getSelection().toString():"").length>0&&(a.preventDefault(),typeof c<"u"&&c.warning&&c.warning("\u{1F6E1}\uFE0F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0645\u062D\u0645\u064A: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0646\u0633\u062E \u0644\u0645\u0646\u0639 \u0627\u0644\u062A\u0639\u062F\u064A \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A."))})}async function le(){try{const e=P();if(e&&_(e))return;if(e&&e.status==="suspended"){F("\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u062D\u0633\u0627\u0628\u0643 \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629 \u0644\u0645\u062E\u0627\u0644\u0641\u0629 \u0627\u0644\u0634\u0631\u0648\u0637.");return}const n=await j();if(n){const{isIpBanned:i}=await import("./db.js"),o=await i(n);if(o){const a=o.reason||"\u0645\u062E\u0627\u0644\u0641\u0629 \u0645\u0639\u0627\u064A\u064A\u0631 \u0648\u0633\u064A\u0627\u0633\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629",s=o.bannedUntil?new Date(o.bannedUntil).toLocaleDateString("ar-EG"):null,t=o.isPermanent?`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${n}) \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u0646\u0635\u0629 \u0628\u0633\u0628\u0628: ${a}`:`\u062A\u0645 \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 \u062C\u0647\u0627\u0632\u0643 (${n}) \u062D\u062A\u0649 ${s} \u0628\u0633\u0628\u0628: ${a}`;F(t)}}}catch(e){console.debug("[_enforceBanGuard] notice:",e)}}function F(e){document.body.innerHTML=`
    <div style="min-height:100vh;background:#06101E;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif;direction:rtl;text-align:center">
      <div style="max-width:540px;background:#0F273D;border:1px solid rgba(239,68,68,0.4);border-radius:20px;padding:36px 24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
        <div style="font-size:64px;margin-bottom:16px">\u{1F6AB}</div>
        <h1 style="color:#EF4444;font-size:1.8rem;margin-bottom:12px;font-weight:900">\u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin-bottom:24px;background:rgba(239,68,68,0.1);padding:14px;border-radius:12px;border:1px dashed rgba(239,68,68,0.3)">
          ${e}
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
  `}function re(){const e=document.getElementById("header-search-container"),n=document.getElementById("header-search-pill"),i=document.getElementById("header-search-trigger"),o=document.getElementById("header-search-input"),a=document.getElementById("header-search-clear"),s=document.getElementById("header-live-dropdown"),t=document.getElementById("header-live-list"),l=document.getElementById("header-live-count"),r=document.getElementById("header-live-all-btn");if(!o)return;let m=null,b=0;const f=()=>{n?.classList.add("expanded"),o.focus(),o.value.trim().length>=1&&s?.classList.add("visible")},p=()=>{n?.classList.remove("expanded"),s?.classList.remove("visible")};i?.addEventListener("click",d=>{d.stopPropagation(),n?.classList.contains("expanded")&&o.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(o.value.trim())}`:f()}),o.addEventListener("focus",()=>{n?.classList.add("expanded"),o.value.trim().length>=1&&t?.children.length>0&&s?.classList.add("visible")}),a?.addEventListener("click",d=>{d.stopPropagation(),o.value="",a.classList.remove("visible"),s?.classList.remove("visible"),t&&(t.innerHTML=""),o.focus()}),o.addEventListener("keydown",d=>{d.key==="Enter"&&o.value.trim()?window.location.href=`search.html?q=${encodeURIComponent(o.value.trim())}`:d.key==="Escape"&&p()}),o.addEventListener("input",()=>{const d=o.value.trim();if(a?.classList.toggle("visible",d.length>0),r&&(r.href=`search.html?q=${encodeURIComponent(d)}`),!d){s?.classList.remove("visible"),t&&(t.innerHTML="");return}clearTimeout(m),m=setTimeout(async()=>{const h=++b;try{const{executeFastSearch:E}=await import("../services/search-engine.service.js"),w=await E(d,{limit:6});if(h!==b||!s||!t)return;if(!w||w.length===0){l&&(l.textContent="0"),t.innerHTML=`
            <div class="header-live-empty">
              <div class="header-live-empty__icon">\u{1F50D}</div>
              <div class="header-live-empty__title">\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0645\u0627\u0643\u0646 \u0645\u0637\u0627\u0628\u0642\u0629</div>
              <div class="header-live-empty__desc">\u062C\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u062E\u0631\u0649 \u0645\u062B\u0644 (\u0635\u064A\u062F\u0644\u064A\u0629\u060C \u062F\u0643\u062A\u0648\u0631\u060C \u0645\u0637\u0639\u0645\u060C \u0646\u062C\u0627\u0631)</div>
            </div>
          `,s.classList.add("visible");return}l&&(l.textContent=String(w.length)),t.innerHTML=w.map(L=>{const u=L.raw||L,B=u.name||"\u0645\u0643\u0627\u0646 \u0628\u0627\u0644\u062F\u0644\u064A\u0644",z=u.categoryName||L.category||"",H=u.area||u.address||"\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u0629",q=u.slug||u.id||"",C=u.photoURL||u.logo||u.coverURL||"",U=u.isVerified||!1,T=u.isOpen!==void 0?u.isOpen:!0,$=(B.trim()[0]||"\u0645").toUpperCase();return`
            <a href="/place.html?slug=${encodeURIComponent(q)}" class="header-live-dropdown__item" role="option">
              <div class="header-live-avatar">
                ${C?`<img src="${C}" alt="${k(B)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'header-live-avatar-fallback\\'>${$}</div>'"/>`:`<div class="header-live-avatar-fallback">${$}</div>`}
              </div>
              <div class="header-live-content">
                <div class="header-live-title-row">
                  <span class="header-live-name">${k(B)}</span>
                  ${U?'<span class="header-live-verified" title="\u0645\u0643\u0627\u0646 \u0645\u0648\u062B\u0642">\u2713</span>':""}
                </div>
                <div class="header-live-meta-row">
                  ${z?`<span class="header-live-cat">${k(z)}</span>`:""}
                  <span class="header-live-area">${k(H)}</span>
                  <span class="${T?"header-live-status-open":"header-live-status-closed"}">
                    ${T?"\u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0622\u0646":"\u0645\u063A\u0644\u0642"}
                  </span>
                </div>
              </div>
            </a>
          `}).join(""),s.classList.add("visible")}catch(E){console.warn("[HeaderLiveSearch] search error:",E)}},120)}),document.addEventListener("click",d=>{e?.contains(d.target)||(s?.classList.remove("visible"),window.innerWidth<=767&&n?.classList.remove("expanded"))})}function k(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
