import { initPlaceFormWizard as initExistingPlaceFormWizard } from './AddPlaceOnboardingWizard.js';

/**
 * AddPlaceOnboardingModal.js
 * مثال عملي حي (Live Demo Simulation) لإضافة نشاط داخل دليل المنزلة.
 * يعرض محاكاة حقيقية لملء نموذج الإضافة خطوة بخطوة مع معاينة مباشرة متزامنة،
 * بدلاً من عرض بطاقات ثابتة.
 */

const STORAGE_KEY = 'manzala_seen_add_place_onboarding_v2';
const DEMO_NAME = 'مهندس محمد حماد';
const DEMO_LOCATION = 'المنزلة، الدقهلية';
const DEMO_PHONE = '01279934735';

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
    #add-place-onboarding-overlay{position:fixed;inset:0;background:rgba(8,15,28,.62);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px}
    #add-place-onboarding-overlay .onboarding-native-modal{position:relative;width:min(1120px,96vw);max-height:94vh;overflow:hidden;background:linear-gradient(150deg,#0b1220 0%,#0f1b2e 45%,#0b2338 100%);border:1px solid rgba(56,189,248,.22);border-radius:26px;box-shadow:0 40px 110px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.04) inset;direction:rtl;color:#e6f1ff;font-family:'Cairo',sans-serif}
    #add-place-onboarding-overlay .native-topline{height:3px;background:linear-gradient(90deg,#0284c7,#38bdf8,#f59e0b,#0284c7);background-size:220% 100%;animation:nativeGradient 4s linear infinite}
    #add-place-onboarding-overlay .native-head{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid rgba(148,163,184,.14)}
    #add-place-onboarding-overlay .native-brand{display:flex;align-items:center;gap:12px}
    #add-place-onboarding-overlay .native-logo{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-size:22px;box-shadow:0 10px 26px rgba(2,132,199,.35);animation:nativeFloat 3s ease-in-out infinite}
    #add-place-onboarding-overlay .native-title{font-size:19px;font-weight:900;margin:0;letter-spacing:-.3px;color:#fff}
    #add-place-onboarding-overlay .native-subtitle{font-size:11.5px;color:#93a5c4;margin-top:3px}
    #add-place-onboarding-overlay .native-close{width:36px;height:36px;border-radius:12px;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.04);color:#cbd5e1;font-size:19px;cursor:pointer;transition:.2s;line-height:1}
    #add-place-onboarding-overlay .native-close:hover{transform:rotate(90deg);background:rgba(255,255,255,.09);color:#fff}
    #add-place-onboarding-overlay .native-body{padding:18px 22px 6px;overflow:auto;max-height:calc(94vh - 168px)}
    #add-place-onboarding-overlay .sim-tabs{display:flex;gap:8px;margin-bottom:16px}
    #add-place-onboarding-overlay .sim-tab{flex:1;text-align:center;padding:9px 4px;border-radius:11px;font-size:10.5px;font-weight:800;color:#6b81a3;background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.14);position:relative;overflow:hidden;transition:.35s}
    #add-place-onboarding-overlay .sim-tab .bar{position:absolute;bottom:0;right:0;height:2.5px;width:0;background:linear-gradient(90deg,#38bdf8,#0284c7)}
    #add-place-onboarding-overlay .sim-tab.on{color:#e0f2fe;background:rgba(2,132,199,.16);border-color:rgba(56,189,248,.4)}
    #add-place-onboarding-overlay .sim-tab.done{color:#7dd3fc}
    #add-place-onboarding-overlay .sim-tab.filling .bar{animation:tabFill 1.9s linear forwards}
    #add-place-onboarding-overlay .native-layout{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:stretch}
    #add-place-onboarding-overlay .sim-panel{position:relative;border:1px solid rgba(148,163,184,.16);border-radius:20px;background:rgba(255,255,255,.03);padding:18px;min-height:400px}
    #add-place-onboarding-overlay .sim-panel-title{font-size:11px;font-weight:800;color:#7dd3fc;display:flex;align-items:center;gap:6px;margin-bottom:14px}
    #add-place-onboarding-overlay .sim-panel-title:before{content:"";width:6px;height:6px;border-radius:50%;background:#38bdf8;box-shadow:0 0 0 4px rgba(56,189,248,.18)}
    #add-place-onboarding-overlay .sim-field{margin-bottom:12px;opacity:.35;transition:opacity .4s}
    #add-place-onboarding-overlay .sim-field.on{opacity:1}
    #add-place-onboarding-overlay .sim-field-label{font-size:10.5px;color:#93a5c4;margin-bottom:6px;display:flex;align-items:center;gap:6px}
    #add-place-onboarding-overlay .sim-check{width:14px;height:14px;border-radius:50%;background:#134e2f;color:#4ade80;display:none;align-items:center;justify-content:center;font-size:9px;flex:0 0 auto}
    #add-place-onboarding-overlay .sim-field.done .sim-check{display:inline-flex}
    #add-place-onboarding-overlay .sim-input{position:relative;min-height:38px;border-radius:11px;border:1px solid rgba(148,163,184,.28);background:rgba(2,10,22,.55);padding:9px 12px;font-size:12.5px;color:#e6f1ff;display:flex;align-items:center;font-weight:700}
    #add-place-onboarding-overlay .sim-field.active .sim-input{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.14)}
    #add-place-onboarding-overlay .sim-caret{display:inline-block;width:2px;height:14px;background:#38bdf8;margin-right:2px;animation:caretBlink .9s steps(1) infinite}
    #add-place-onboarding-overlay .sim-toggle-row{display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(148,163,184,.28);background:rgba(2,10,22,.55);border-radius:11px;padding:9px 12px;font-size:11.5px;font-weight:800;color:#cfe3ff}
    #add-place-onboarding-overlay .sim-switch{width:38px;height:21px;border-radius:99px;background:#334155;position:relative;transition:.35s}
    #add-place-onboarding-overlay .sim-switch:after{content:"";position:absolute;width:16px;height:16px;border-radius:50%;background:#e2e8f0;top:2.5px;right:2.5px;transition:.35s}
    #add-place-onboarding-overlay .sim-switch.on{background:#16a34a}
    #add-place-onboarding-overlay .sim-switch.on:after{right:19.5px;background:#fff}
    #add-place-onboarding-overlay .sim-upload-row{display:flex;gap:10px}
    #add-place-onboarding-overlay .sim-upload{flex:1;border:1.5px dashed rgba(148,163,184,.4);border-radius:14px;height:78px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:10px;color:#7f93b5;font-weight:800;position:relative;overflow:hidden;transition:.4s}
    #add-place-onboarding-overlay .sim-upload .ic{font-size:18px}
    #add-place-onboarding-overlay .sim-upload.filled{border-style:solid;border-color:#38bdf8;background:linear-gradient(135deg,#0369a1,#38bdf8);color:#fff;animation:uploadPop .5s ease}
    #add-place-onboarding-overlay .sim-stars{display:flex;gap:5px;font-size:19px}
    #add-place-onboarding-overlay .sim-star{color:#334155;transition:.3s;transform:scale(1)}
    #add-place-onboarding-overlay .sim-star.on{color:#fbbf24;animation:starPop .4s ease}
    #add-place-onboarding-overlay .sim-badge-row{display:flex;align-items:center;gap:8px;margin-top:6px}
    #add-place-onboarding-overlay .sim-verified{display:inline-flex;align-items:center;gap:5px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.35);color:#7dd3fc;font-size:10.5px;font-weight:900;padding:5px 10px;border-radius:999px;opacity:0;transform:scale(.7);transition:.4s}
    #add-place-onboarding-overlay .sim-verified.on{opacity:1;transform:scale(1)}
    #add-place-onboarding-overlay .sim-cursor{position:absolute;width:22px;height:22px;top:0;left:0;z-index:9;pointer-events:none;transform:translate(60px,60px);transition:transform .85s cubic-bezier(.65,0,.35,1);filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}
    #add-place-onboarding-overlay .sim-cursor svg{width:100%;height:100%}
    #add-place-onboarding-overlay .sim-ripple{position:absolute;width:10px;height:10px;border-radius:50%;background:rgba(56,189,248,.55);top:0;left:0;transform:translate(-50%,-50%);animation:rippleGo .55s ease-out forwards;pointer-events:none;z-index:8}
    #add-place-onboarding-overlay .prev-browser{position:relative;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.22);background:#0a1526}
    #add-place-onboarding-overlay .prev-bar{height:34px;display:flex;align-items:center;gap:6px;padding:0 12px;background:#0d1a2e;border-bottom:1px solid rgba(148,163,184,.16)}
    #add-place-onboarding-overlay .prev-dot{width:7px;height:7px;border-radius:50%;background:#33445e}
    #add-place-onboarding-overlay .prev-url{margin:auto;width:60%;height:20px;border-radius:7px;background:#132644;color:#7f93b5;font-size:8.5px;display:flex;align-items:center;justify-content:center;direction:ltr}
    #add-place-onboarding-overlay .prev-body{padding:16px}
    #add-place-onboarding-overlay .prev-cover{height:100px;border-radius:14px;background:linear-gradient(135deg,#0f172a,#0369a1 55%,#38bdf8);position:relative;overflow:hidden;transition:.5s}
    #add-place-onboarding-overlay .prev-cover:after{content:"";position:absolute;width:190px;height:190px;border-radius:50%;background:rgba(255,255,255,.1);right:-60px;top:-90px;animation:nativePulse 3s ease-in-out infinite}
    #add-place-onboarding-overlay .prev-card{position:relative;margin:-34px 12px 0;background:#0e1c33;border:1px solid rgba(148,163,184,.2);border-radius:16px;padding:14px;box-shadow:0 16px 34px rgba(0,0,0,.35)}
    #add-place-onboarding-overlay .prev-avatar{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#1b3358,#0c1a30);border:3px solid #0e1c33;box-shadow:0 8px 18px rgba(0,0,0,.35);font-size:23px;margin-top:-38px;position:relative;transition:.4s}
    #add-place-onboarding-overlay .prev-name{font-size:15.5px;font-weight:900;margin-top:9px;color:#fff;min-height:20px}
    #add-place-onboarding-overlay .prev-name .sim-caret{background:#38bdf8}
    #add-place-onboarding-overlay .prev-meta{font-size:10px;color:#93a5c4;margin-top:4px;min-height:14px}
    #add-place-onboarding-overlay .prev-actions{display:flex;gap:6px;margin-top:12px}
    #add-place-onboarding-overlay .prev-action{flex:1;height:32px;border-radius:9px;display:grid;place-items:center;font-size:9.5px;font-weight:900;border:1px solid rgba(148,163,184,.25);color:#93a5c4;transition:.4s}
    #add-place-onboarding-overlay .prev-action.primary{background:#0284c7;color:#fff;border-color:#0284c7}
    #add-place-onboarding-overlay .prev-action.whatsapp.on{background:#0d3b25;color:#4ade80;border-color:#166534;box-shadow:0 0 0 3px rgba(34,197,94,.15)}
    #add-place-onboarding-overlay .prev-stars{margin-top:11px;font-size:12px;color:#334155;display:flex;gap:3px;align-items:center}
    #add-place-onboarding-overlay .prev-stars .s{color:#334155;transition:.3s}
    #add-place-onboarding-overlay .prev-stars .s.on{color:#fbbf24}
    #add-place-onboarding-overlay .prev-ribbon{position:absolute;top:10px;left:10px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;font-size:9.5px;font-weight:900;padding:5px 10px;border-radius:999px;opacity:0;transform:translateY(-6px) scale(.8);transition:.5s;box-shadow:0 8px 18px rgba(22,163,74,.4)}
    #add-place-onboarding-overlay .prev-ribbon.on{opacity:1;transform:translateY(0) scale(1)}
    #add-place-onboarding-overlay .native-info{display:flex;flex-direction:column;justify-content:flex-start;padding:2px}
    #add-place-onboarding-overlay .step-kicker{display:inline-flex;width:max-content;align-items:center;gap:6px;background:rgba(2,132,199,.15);color:#7dd3fc;border:1px solid rgba(56,189,248,.3);border-radius:999px;padding:6px 11px;font-size:10.5px;font-weight:900;margin-bottom:10px}
    #add-place-onboarding-overlay .native-info h2{font-size:20px;line-height:1.4;margin:0 0 8px;font-weight:900;letter-spacing:-.4px;color:#fff;min-height:28px}
    #add-place-onboarding-overlay .native-info p{font-size:12px;line-height:1.85;color:#93a5c4;margin:0;min-height:38px}
    #add-place-onboarding-overlay .toast-success{position:absolute;bottom:14px;left:50%;transform:translateX(-50%) translateY(20px);background:#0e1c33;border:1px solid rgba(56,189,248,.35);color:#e6f1ff;font-size:11px;font-weight:800;padding:10px 16px;border-radius:12px;display:flex;align-items:center;gap:8px;opacity:0;transition:.5s;box-shadow:0 14px 30px rgba(0,0,0,.4);white-space:nowrap;z-index:10}
    #add-place-onboarding-overlay .toast-success.on{opacity:1;transform:translateX(-50%) translateY(0)}
    #add-place-onboarding-overlay .native-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;border-top:1px solid rgba(148,163,184,.14)}
    #add-place-onboarding-overlay .native-note{font-size:10px;color:#7f93b5}
    #add-place-onboarding-overlay .native-note strong{color:#38bdf8}
    #add-place-onboarding-overlay .native-start{border:0;border-radius:13px;padding:12px 22px;background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 10px 24px rgba(2,132,199,.35);transition:.2s;font-size:13px}
    #add-place-onboarding-overlay .native-start:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(2,132,199,.45)}
    @keyframes nativeGradient{to{background-position:220% 0}}
    @keyframes nativeFloat{50%{transform:translateY(-4px) rotate(2deg)}}
    @keyframes nativePulse{50%{transform:scale(1.12);opacity:.65}}
    @keyframes caretBlink{50%{opacity:0}}
    @keyframes tabFill{from{width:0}to{width:100%}}
    @keyframes rippleGo{from{width:10px;height:10px;opacity:.7}to{width:46px;height:46px;opacity:0}}
    @keyframes uploadPop{0%{transform:scale(.8);opacity:.4}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
    @keyframes starPop{0%{transform:scale(.4) rotate(-25deg)}70%{transform:scale(1.25)}100%{transform:scale(1) rotate(0)}}
    .onboarding-3d-overlay.fade-out{animation:fadeOutOverlay .25s ease forwards}
    @keyframes fadeOutOverlay{to{opacity:0}}
    @media(max-width:860px){#add-place-onboarding-overlay .native-layout{grid-template-columns:1fr!important}#add-place-onboarding-overlay .sim-panel{min-height:340px}#add-place-onboarding-overlay .native-info h2{font-size:17px}#add-place-onboarding-overlay .native-footer{flex-direction:column;align-items:stretch}#add-place-onboarding-overlay .native-start{width:100%}}
  `;
  document.head.appendChild(style);

  overlay.innerHTML = `
    <div class="onboarding-native-modal" role="dialog" aria-modal="true" aria-label="مثال عملي حي لإضافة نشاطك إلى دليل المنزلة والمطرية">
      <div class="native-topline"></div>
      <header class="native-head"><div class="native-brand"><div class="native-logo">🚀</div><div><h3 class="native-title">مثال عملي: هكذا يضيف العميل نشاطه</h3><div class="native-subtitle">محاكاة حية لملء البيانات ونشرها فور اكتمالها</div></div></div><button type="button" class="native-close" id="btn-close-onboarding-top" aria-label="إغلاق">×</button></header>
      <main class="native-body">
        <div class="sim-tabs" id="sim-tabs"><div class="sim-tab" data-tab="1"><span class="lbl">البيانات الأساسية</span><span class="bar"></span></div><div class="sim-tab" data-tab="2"><span class="lbl">التواصل وواتساب</span><span class="bar"></span></div><div class="sim-tab" data-tab="3"><span class="lbl">الصور والهوية</span><span class="bar"></span></div><div class="sim-tab" data-tab="4"><span class="lbl">التقييم والنشر</span><span class="bar"></span></div></div>
        <div class="native-layout">
          <section class="sim-panel" id="sim-panel"><div class="sim-panel-title">نموذج إضافة النشاط — محاكاة حية</div><div class="sim-field" id="f-name" data-step="1"><div class="sim-field-label"><span class="sim-check">✓</span>اسم النشاط</div><div class="sim-input"><span class="txt" id="in-name"></span></div></div><div class="sim-field" id="f-loc" data-step="1"><div class="sim-field-label"><span class="sim-check">✓</span>📍 الموقع</div><div class="sim-input"><span class="txt" id="in-loc"></span></div></div><div class="sim-field" id="f-phone" data-step="2"><div class="sim-field-label"><span class="sim-check">✓</span>📞 رقم الهاتف</div><div class="sim-input" style="direction:ltr;justify-content:flex-end"><span class="txt" id="in-phone"></span></div></div><div class="sim-field" id="f-wa" data-step="2"><div class="sim-toggle-row"><span>💬 تفعيل التواصل عبر واتساب</span><span class="sim-switch" id="wa-switch"></span></div></div><div class="sim-field" id="f-media" data-step="3"><div class="sim-field-label"><span class="sim-check">✓</span>📸 الشعار والغلاف</div><div class="sim-upload-row"><div class="sim-upload" id="up-logo"><span class="ic">🏪</span><span>رفع الشعار</span></div><div class="sim-upload" id="up-cover"><span class="ic">🖼️</span><span>رفع صورة الغلاف</span></div></div></div><div class="sim-field" id="f-rate" data-step="4"><div class="sim-field-label"><span class="sim-check">✓</span>🏆 التوثيق والتقييمات</div><div class="sim-stars" id="sim-stars"><span class="sim-star" data-i="1">★</span><span class="sim-star" data-i="2">★</span><span class="sim-star" data-i="3">★</span><span class="sim-star" data-i="4">★</span><span class="sim-star" data-i="5">★</span></div><div class="sim-badge-row"><span class="sim-verified" id="verified-badge">✔ نشاط موثّق</span></div></div><div class="sim-cursor" id="sim-cursor"><svg viewBox="0 0 24 24" fill="none"><path d="M4 2l14 8-6 1.5L10 18 4 2z" fill="#38bdf8" stroke="#0b1220" stroke-width="1"/></svg></div></section>
          <section class="native-info"><div class="step-kicker" id="step-kicker">✨ خطوة 1 من 4</div><h2 id="step-title">١) اكتب اسم نشاطك وموقعه</h2><p id="step-desc">اسم واضح + موقع دقيق يظهران فورًا في صفحتك أمام العملاء داخل الدليل.</p><div class="prev-browser" style="margin-top:16px"><div class="prev-bar"><span class="prev-dot"></span><span class="prev-dot"></span><span class="prev-dot"></span><div class="prev-url">dalilmanzala.com/place/…</div></div><div class="prev-body"><div class="prev-cover"></div><div class="prev-card"><div class="prev-ribbon" id="prev-ribbon">✅ تم النشر</div><div class="prev-avatar" id="prev-avatar">🏪</div><div class="prev-name" id="prev-name"></div><div class="prev-meta" id="prev-meta">📍 بانتظار إدخال الموقع…</div><div class="prev-actions"><div class="prev-action primary">📍 الموقع</div><div class="prev-action whatsapp" id="prev-whatsapp">💬 واتساب</div><div class="prev-action">⭐ التقييمات</div></div><div class="prev-stars" id="prev-stars"><span class="s">★</span><span class="s">★</span><span class="s">★</span><span class="s">★</span><span class="s">★</span></div></div><div class="toast-success" id="toast-success">🎉 تم إضافة نشاطك وظهر أمام عملائك الآن</div></div></div></section>
        </div>
      </main>
      <footer class="native-footer"><div class="native-note">🔒 مثال توضيحي فقط • <strong>الاسم: ${DEMO_NAME} — رقم المثال: ${DEMO_PHONE}</strong></div><button type="button" class="native-start" id="btn-start-adding-place">ابدأ إضافة نشاطك الآن 🚀</button></footer>
    </div>`;

  document.body.appendChild(overlay); document.body.style.overflow = 'hidden';
  const token = { cancelled: false, timers: [] };
  const wait = (ms) => new Promise((resolve) => { const t = setTimeout(resolve, ms); token.timers.push(t); });
  const panel = overlay.querySelector('#sim-panel'); const cursor = overlay.querySelector('#sim-cursor');
  const moveCursor = (targetEl) => { if (!targetEl || token.cancelled) return; const pRect = panel.getBoundingClientRect(); const tRect = targetEl.getBoundingClientRect(); const x = tRect.left - pRect.left + tRect.width * .7; const y = tRect.top - pRect.top + tRect.height * .5; cursor.style.transform = `translate(${x}px,${y}px)`; const ripple = document.createElement('span'); ripple.className = 'sim-ripple'; ripple.style.left = x + 'px'; ripple.style.top = y + 'px'; panel.appendChild(ripple); setTimeout(() => ripple.remove(), 600); };
  const typeInto = async (el, text, speed = 55, caretParent) => { el.textContent = ''; const caret = document.createElement('span'); caret.className = 'sim-caret'; (caretParent || el).appendChild(caret); for (let i = 0; i < text.length; i++) { if (token.cancelled) return; el.textContent = text.slice(0, i + 1); (caretParent || el).appendChild(caret); await wait(speed); } caret.remove(); };
  const setActiveTab = (n) => overlay.querySelectorAll('.sim-tab').forEach((t) => { const step = Number(t.dataset.tab); t.classList.toggle('done', step < n); t.classList.toggle('on', step === n); t.classList.toggle('filling', step === n); });
  const setActiveFields = (n) => overlay.querySelectorAll('.sim-field').forEach((f) => { const step = Number(f.dataset.step); f.classList.toggle('on', step <= n); f.classList.toggle('active', step === n); });
  const stepMeta = {1:{kicker:'✨ خطوة 1 من 4',title:'١) اكتب اسم نشاطك وموقعه',desc:'اسم واضح + موقع دقيق يظهران فورًا في صفحتك أمام العملاء داخل الدليل.'},2:{kicker:'✨ خطوة 2 من 4',title:'٢) أضف رقم الهاتف وواتساب',desc:'العميل يتواصل معك مباشرة بضغطة واحدة من صفحة نشاطك.'},3:{kicker:'✨ خطوة 3 من 4',title:'٣) ارفع الشعار وصورة الغلاف',desc:'الهوية البصرية تمنح نشاطك مظهرًا احترافيًا يزيد ثقة العميل.'},4:{kicker:'✨ خطوة 4 من 4',title:'٤) وثّق نشاطك وانشره',desc:'بمجرد الحفظ، يظهر نشاطك مباشرة للعملاء داخل دليل المنزلة والمطرية.'}};
  const setStepText = (n) => { const m = stepMeta[n]; overlay.querySelector('#step-kicker').textContent = m.kicker; overlay.querySelector('#step-title').textContent = m.title; overlay.querySelector('#step-desc').textContent = m.desc; };
  const resetVisualState = () => { overlay.querySelectorAll('.sim-field').forEach((f)=>f.classList.remove('on','active','done')); overlay.querySelector('#in-name').textContent=''; overlay.querySelector('#in-loc').textContent=''; overlay.querySelector('#in-phone').textContent=''; overlay.querySelector('#wa-switch').classList.remove('on'); overlay.querySelector('#up-logo').classList.remove('filled'); overlay.querySelector('#up-cover').classList.remove('filled'); overlay.querySelector('#up-logo').innerHTML='<span class="ic">🏪</span><span>رفع الشعار</span>'; overlay.querySelector('#up-cover').innerHTML='<span class="ic">🖼️</span><span>رفع صورة الغلاف</span>'; overlay.querySelectorAll('.sim-star').forEach((s)=>s.classList.remove('on')); overlay.querySelector('#verified-badge').classList.remove('on'); overlay.querySelector('#prev-name').textContent=''; overlay.querySelector('#prev-meta').textContent='📍 بانتظار إدخال الموقع…'; overlay.querySelector('#prev-whatsapp').classList.remove('on'); overlay.querySelectorAll('#prev-stars .s').forEach((s)=>s.classList.remove('on')); overlay.querySelector('#prev-ribbon').classList.remove('on'); overlay.querySelector('#toast-success').classList.remove('on'); };
  const runLoop = async () => { while (!token.cancelled) { resetVisualState(); await wait(400); setActiveTab(1); setActiveFields(1); setStepText(1); const fName=overlay.querySelector('#f-name'); moveCursor(fName); await wait(250); await typeInto(overlay.querySelector('#in-name'),DEMO_NAME,60); typeInto(overlay.querySelector('#prev-name'),DEMO_NAME,60); fName.classList.add('done'); await wait(350); const fLoc=overlay.querySelector('#f-loc'); moveCursor(fLoc); await wait(250); await typeInto(overlay.querySelector('#in-loc'),DEMO_LOCATION,55); overlay.querySelector('#prev-meta').textContent=`📍 ${DEMO_LOCATION} — يظهر للعملاء عند البحث عن خدمتك`; fLoc.classList.add('done'); await wait(700); if(token.cancelled)return; setActiveTab(2); setActiveFields(2); setStepText(2); const fPhone=overlay.querySelector('#f-phone'); moveCursor(fPhone); await wait(250); await typeInto(overlay.querySelector('#in-phone'),DEMO_PHONE,45); fPhone.classList.add('done'); await wait(300); const fWa=overlay.querySelector('#f-wa'); moveCursor(overlay.querySelector('#wa-switch')); await wait(300); overlay.querySelector('#wa-switch').classList.add('on'); overlay.querySelector('#prev-whatsapp').classList.add('on'); fWa.classList.add('done'); await wait(750); if(token.cancelled)return; setActiveTab(3); setActiveFields(3); setStepText(3); const upLogo=overlay.querySelector('#up-logo'); moveCursor(upLogo); await wait(300); upLogo.classList.add('filled'); upLogo.innerHTML='<span class="ic">🏪</span><span>تم الرفع ✓</span>'; overlay.querySelector('#prev-avatar').style.background='linear-gradient(135deg,#0284c7,#38bdf8)'; await wait(450); const upCover=overlay.querySelector('#up-cover'); moveCursor(upCover); await wait(300); upCover.classList.add('filled'); upCover.innerHTML='<span class="ic">🖼️</span><span>تم الرفع ✓</span>'; overlay.querySelector('#f-media').classList.add('done'); await wait(750); if(token.cancelled)return; setActiveTab(4); setActiveFields(4); setStepText(4); const stars=overlay.querySelectorAll('.sim-star'); const prevStars=overlay.querySelectorAll('#prev-stars .s'); for(let i=0;i<stars.length;i++){if(token.cancelled)return; moveCursor(stars[i]); await wait(180); stars[i].classList.add('on'); prevStars[i].classList.add('on');} await wait(200); overlay.querySelector('#verified-badge').classList.add('on'); overlay.querySelector('#f-rate').classList.add('done'); await wait(350); overlay.querySelector('#prev-ribbon').classList.add('on'); overlay.querySelector('#toast-success').classList.add('on'); await wait(3200); if(token.cancelled)return; } };
  runLoop();
  const closeOnboarding = () => { token.cancelled=true; token.timers.forEach((t)=>clearTimeout(t)); markAddPlaceOnboardingSeen(); overlay.classList.add('fade-out'); setTimeout(()=>{overlay.remove();style.remove();document.body.style.overflow='';},280); };
  overlay.querySelector('#btn-close-onboarding-top')?.addEventListener('click',closeOnboarding); overlay.querySelector('#btn-start-adding-place')?.addEventListener('click',closeOnboarding); overlay.addEventListener('click',(e)=>{if(e.target===overlay)closeOnboarding();});
}

export function initPlaceFormWizard() {
  if (!hasSeenAddPlaceOnboarding()) {
    showAddPlaceOnboardingModal();
    markAddPlaceOnboardingSeen();
  }
  return initExistingPlaceFormWizard();
}
