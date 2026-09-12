/**
 * AddPlaceOnboardingModal.js
 * Interactive, site-native onboarding for adding a place.
 * Shows a short animated walkthrough instead of static cards.
 */

const STORAGE_KEY = 'manzala_seen_add_place_onboarding_v1';

export function hasSeenAddPlaceOnboarding() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markAddPlaceOnboardingSeen() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function showAddPlaceOnboardingModal(force = false) {
  if (typeof document === 'undefined') return;
  if (!force && hasSeenAddPlaceOnboarding()) return;

  const existing = document.getElementById('add-place-onboarding-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'add-place-onboarding-overlay';
  overlay.className = 'onboarding-3d-overlay animate-fade-in';

  const style = document.createElement('style');
  style.id = 'add-place-onboarding-premium-style';
  style.textContent = `
    #add-place-onboarding-overlay .onboarding-native-modal{position:relative;width:min(1080px,94vw);max-height:92vh;overflow:hidden;background:linear-gradient(145deg,#fff 0%,#f8fbff 55%,#eef8ff 100%);border:1px solid rgba(2,132,199,.18);border-radius:28px;box-shadow:0 35px 100px rgba(15,23,42,.28),0 0 0 1px rgba(255,255,255,.8) inset;direction:rtl;color:#0f172a}
    #add-place-onboarding-overlay .native-topline{height:4px;background:linear-gradient(90deg,#0284c7,#38bdf8,#f59e0b,#0284c7);background-size:220% 100%;animation:nativeGradient 4s linear infinite}
    #add-place-onboarding-overlay .native-head{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.76);backdrop-filter:blur(16px)}
    #add-place-onboarding-overlay .native-brand{display:flex;align-items:center;gap:12px}.native-logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:white;font-size:24px;box-shadow:0 10px 24px rgba(2,132,199,.25);animation:nativeFloat 3s ease-in-out infinite}.native-title{font-size:20px;font-weight:950;margin:0;letter-spacing:-.4px}.native-subtitle{font-size:12px;color:#64748b;margin-top:3px}.native-close{width:38px;height:38px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:20px;cursor:pointer;transition:.2s}.native-close:hover{transform:rotate(90deg);background:#f8fafc;color:#0f172a}
    #add-place-onboarding-overlay .native-body{padding:22px 24px 20px;overflow:auto;max-height:calc(92vh - 170px)}.native-progress{display:flex;align-items:center;gap:8px;margin-bottom:18px}.native-progress .dot{height:7px;flex:1;border-radius:99px;background:#dbeafe;overflow:hidden;position:relative}.native-progress .dot.active:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0284c7,#38bdf8);animation:nativeProgress 1.8s ease forwards}
    #add-place-onboarding-overlay .native-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;align-items:stretch}.native-browser{position:relative;min-height:390px;border:1px solid #dbeafe;border-radius:22px;background:#fff;box-shadow:0 18px 45px rgba(15,23,42,.09);overflow:hidden}.browser-bar{height:42px;display:flex;align-items:center;gap:7px;padding:0 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0}.browser-dot{width:8px;height:8px;border-radius:50%;background:#cbd5e1}.browser-url{margin:auto;width:58%;height:24px;border-radius:8px;background:#eef2f7;color:#94a3b8;font-size:9px;display:flex;align-items:center;justify-content:center}
    .site-preview{padding:18px;background:linear-gradient(180deg,#f8fbff,#fff)}.site-cover{height:112px;border-radius:16px;background:linear-gradient(135deg,#0f172a 0%,#0369a1 48%,#38bdf8 100%);position:relative;overflow:hidden}.site-cover:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.12);right:-70px;top:-110px;animation:nativePulse 3s ease-in-out infinite}.site-card{position:relative;margin:-40px 16px 0;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:16px;box-shadow:0 14px 30px rgba(15,23,42,.12)}.site-avatar{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;background:linear-gradient(135deg,#e0f2fe,#bae6fd);border:4px solid white;box-shadow:0 8px 18px rgba(2,132,199,.18);font-size:27px;margin-top:-44px;position:relative}.site-name{font-size:17px;font-weight:950;margin-top:10px;color:#0f172a}.site-meta{font-size:10px;color:#64748b;margin-top:4px}.site-actions{display:flex;gap:7px;margin-top:13px}.site-action{flex:1;height:34px;border-radius:9px;display:grid;place-items:center;font-size:10px;font-weight:900;border:1px solid #dbeafe}.site-action.primary{background:#0284c7;color:#fff;border-color:#0284c7}.site-action.whatsapp{background:#ecfdf5;color:#15803d;border-color:#bbf7d0}
    .live-cursor{position:absolute;width:28px;height:28px;z-index:4;filter:drop-shadow(0 5px 6px rgba(0,0,0,.18));animation:nativeCursor 4.8s ease-in-out infinite;pointer-events:none}.live-cursor:before{content:"";display:block;width:0;height:0;border-left:11px solid #0f172a;border-top:17px solid transparent;border-bottom:4px solid transparent;transform:rotate(-35deg)}
    .native-info{display:flex;flex-direction:column;justify-content:center;padding:4px 4px 4px 8px}.step-kicker{display:inline-flex;width:max-content;align-items:center;gap:6px;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:999px;padding:6px 11px;font-size:11px;font-weight:950;margin-bottom:12px}.native-info h2{font-size:26px;line-height:1.35;margin:0 0 9px;font-weight:950;letter-spacing:-.7px}.native-info p{font-size:13px;line-height:1.8;color:#64748b;margin:0 0 16px}.feature-list{display:grid;gap:9px}.feature{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:13px;background:rgba(255,255,255,.8);border:1px solid #e2e8f0;font-size:11.5px;font-weight:800;color:#334155;animation:nativeItem .5s ease both}.feature:nth-child(2){animation-delay:.08s}.feature:nth-child(3){animation-delay:.16s}.feature:nth-child(4){animation-delay:.24s}.feature-icon{width:29px;height:29px;border-radius:9px;display:grid;place-items:center;background:#eff6ff;font-size:15px;flex:0 0 auto}
    .native-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 24px;border-top:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.82)}.native-note{font-size:10.5px;color:#64748b}.native-note strong{color:#0284c7}.native-start{border:0;border-radius:13px;padding:12px 20px;background:linear-gradient(135deg,#0284c7,#0369a1);color:white;font-weight:950;cursor:pointer;box-shadow:0 9px 22px rgba(2,132,199,.22);transition:.2s}.native-start:hover{transform:translateY(-2px);box-shadow:0 13px 28px rgba(2,132,199,.3)}
    @keyframes nativeGradient{to{background-position:220% 0}}@keyframes nativeFloat{50%{transform:translateY(-4px) rotate(2deg)}}@keyframes nativePulse{50%{transform:scale(1.12);opacity:.65}}@keyframes nativeCursor{0%,8%{left:68%;top:68%}24%{left:37%;top:38%}40%{left:62%;top:58%}58%{left:72%;top:79%}76%{left:42%;top:77%}92%,100%{left:68%;top:68%}}@keyframes nativeItem{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes nativeProgress{from{transform:translateX(100%)}to{transform:translateX(0)}}
    @media(max-width:820px){.native-layout{grid-template-columns:1fr!important}.native-browser{min-height:330px}.native-info{padding:4px 0}.native-info h2{font-size:21px}.native-footer{flex-direction:column;align-items:stretch}.native-start{width:100%}}
  `;
  document.head.appendChild(style);

  overlay.innerHTML = `
    <div class="onboarding-native-modal" role="dialog" aria-modal="true" aria-label="تدريب إضافة نشاطك إلى دليل المنزلة">
      <div class="native-topline"></div>
      <header class="native-head"><div class="native-brand"><div class="native-logo">🚀</div><div><h3 class="native-title">أضف نشاطك إلى دليل المنزلة</h3><div class="native-subtitle">جولة سريعة داخل الموقع — من البيانات إلى الظهور أمام العملاء</div></div></div><button type="button" class="native-close" id="btn-close-onboarding-top" aria-label="إغلاق">×</button></header>
      <main class="native-body">
        <div class="native-progress" aria-hidden="true"><span class="dot active"></span><span class="dot active"></span><span class="dot active"></span><span class="dot active"></span></div>
        <div class="native-layout">
          <section class="native-browser" aria-label="معاينة تفاعلية لشكل النشاط داخل الموقع"><div class="browser-bar"><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span><div class="browser-url">dalilmanzala.com / place / نشاطك</div></div><div class="site-preview"><div class="site-cover"></div><div class="site-card"><div class="site-avatar">🏪</div><div class="site-name">نشاطك التجاري</div><div class="site-meta">📍 المنزلة — يظهر للعملاء عند البحث عن خدمتك</div><div class="site-actions"><div class="site-action primary">📍 الموقع</div><div class="site-action whatsapp">💬 واتساب</div><div class="site-action">⭐ التقييمات</div></div><div style="margin-top:13px;height:7px;border-radius:99px;background:#e2e8f0;width:72%"></div><div style="margin-top:7px;height:7px;border-radius:99px;background:#f1f5f9;width:48%"></div></div></div><div class="live-cursor" aria-hidden="true"></div></section>
          <section class="native-info"><div class="step-kicker">✨ تدريب تفاعلي داخل الدليل</div><h2>هكذا سيظهر نشاطك للعميل بعد الإضافة</h2><p>شرح عملي داخل شكل الموقع نفسه، يوضح أهم البيانات التي تجعل العميل يجدك ويتواصل معك بسرعة.</p><div class="feature-list"><div class="feature"><span class="feature-icon">📍</span><span><strong>1 — الاسم والموقع</strong><br>اسم واضح + موقع دقيق لظهور أفضل في البحث.</span></div><div class="feature"><span class="feature-icon">📞</span><span><strong>2 — الهاتف وواتساب</strong><br>العميل يصل إليك مباشرة من صفحة نشاطك.</span></div><div class="feature"><span class="feature-icon">📸</span><span><strong>3 — الصور والهوية</strong><br>أضف الشعار والغلاف والصور ليبدو نشاطك احترافيًا.</span></div><div class="feature"><span class="feature-icon">🏆</span><span><strong>4 — التوثيق والتقييمات</strong><br>أكمل بياناتك واجمع تقييمات حقيقية لبناء الثقة.</span></div></div></section>
        </div>
      </main>
      <footer class="native-footer"><div class="native-note">🔒 بياناتك تظل تحت سيطرتك • <strong>رقم التواصل في المثال: 01279934735</strong></div><button type="button" class="native-start" id="btn-start-adding-place">البدء وإدخال بيانات النشاط 🚀</button></footer>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const closeOnboarding = () => {
    const chk = document.getElementById('chk-onboarding-dont-show');
    if (chk && chk.checked) markAddPlaceOnboardingSeen();
    else markAddPlaceOnboardingSeen();
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.remove(); style.remove(); document.body.style.overflow = ''; }, 280);
  };

  overlay.querySelector('#btn-close-onboarding-top')?.addEventListener('click', closeOnboarding);
  overlay.querySelector('#btn-start-adding-place')?.addEventListener('click', closeOnboarding);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOnboarding(); });
}
