/**
 * AddPlaceOnboardingModal.js
 * Interactive 3D Onboarding Guide for Adding a New Place (يظهر للمستخدم أول مرة فقط)
 * Example place in guide: "مهندس محمد محمد حماد"
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

  overlay.innerHTML = `
    <div class="onboarding-3d-modal" role="dialog" aria-modal="true" aria-label="دليل إضافة مكانك في الدليل">
      
      <!-- Modal Top Header -->
      <div class="onboarding-3d-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="onboarding-badge-icon">🚀</span>
          <div>
            <h3 style="font-size:17px;font-weight:900;color:var(--text-primary,#0F172A);margin:0">كيف تضيف مكانك وتحقق أعلى مشاهدات؟</h3>
            <p style="font-size:12px;color:var(--text-muted,#64748B);margin:2px 0 0 0">دليل إرشادي سريع يوضح لك الخطوات الثلاث السحرية</p>
          </div>
        </div>
        <button type="button" class="onboarding-close-btn" id="btn-close-onboarding-top" aria-label="إغلاق">✕</button>
      </div>

      <!-- 3D Perspective Cards Showcase -->
      <div class="onboarding-3d-stage">
        
        <!-- Step 1: 3D Card -->
        <div class="card-3d-wrapper step-1">
          <div class="card-3d-inner">
            <div class="card-3d-glow"></div>
            <div class="step-num-pill">1</div>
            <div class="card-3d-icon">📍</div>
            <h4 class="card-3d-title">الاسم والموقع بدقة</h4>
            <p class="card-3d-desc">
              اكتب اسم نشاطك واضحاً ومميزاً مثل:
            </p>
            <div class="example-box">
              <span class="example-tag">مثال حي</span>
              <strong style="color:#0284C7;font-size:13.5px">مهندس محمد محمد حماد</strong>
              <div style="font-size:11px;color:#64748B;margin-top:3px">📍 المنزلة — الطريق الزراعي</div>
            </div>
            <div class="card-tip">💡 يساعد محرك البحث بالذكاء الاصطناعي في جلب العملاء لك فوراً.</div>
          </div>
        </div>

        <!-- Step 2: 3D Card -->
        <div class="card-3d-wrapper step-2">
          <div class="card-3d-inner">
            <div class="card-3d-glow"></div>
            <div class="step-num-pill">2</div>
            <div class="card-3d-icon">📞</div>
            <h4 class="card-3d-title">أرقام التواصل والواتساب</h4>
            <p class="card-3d-desc">
              أضف رقم هاتفك وواتسابك المباشر مع تحديد مواعيد العمل اليومية.
            </p>
            <div class="example-box">
              <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;color:#15803D;font-weight:800;direction:ltr">
                <img src="./icons/whatsapp.png" style="width:16px;height:16px" alt="wa" />
                <span>201009945088</span>
              </div>
              <div style="font-size:11px;color:#059669;margin-top:4px">🟢 تفعيل الاتصال والمراسلة بنقرة واحدة</div>
            </div>
            <div class="card-tip">⚡ يتيح للعملاء الاتصال بك أو مراسلتك دون حفظ رقمك.</div>
          </div>
        </div>

        <!-- Step 3: 3D Card -->
        <div class="card-3d-wrapper step-3">
          <div class="card-3d-inner">
            <div class="card-3d-glow"></div>
            <div class="step-num-pill">3</div>
            <div class="card-3d-icon">✨</div>
            <h4 class="card-3d-title">الشعار والغلاف والتوثيق</h4>
            <p class="card-3d-desc">
              ارفع صوراً واضحة، واطلب شارة التوثيق الزرقاء لتتصدر الأوائل دائماً.
            </p>
            <div class="example-box">
              <span class="badge" style="background:#E0F2FE;color:#0369A1;font-weight:900;font-size:11.5px;padding:4px 10px;border-radius:20px">
                ✓ موثق رسمياً بالدليل
              </span>
              <div style="font-size:11px;color:#64748B;margin-top:5px">🖨️ الحصول على بوستر QR مجاني لواجهة محلك</div>
            </div>
            <div class="card-tip">👑 الأماكن الموثقة تحصل على 10 أضعاف الزيارات والاتصالات!</div>
          </div>
        </div>

      </div>

      <!-- Action Footer -->
      <div class="onboarding-3d-footer">
        <label class="onboarding-dont-show-again">
          <input type="checkbox" id="chk-onboarding-dont-show" checked />
          <span>لا تعرض هذه النصائح الإرشادية مرة أخرى</span>
        </label>

        <button type="button" class="btn btn-primary btn-lg btn-onboarding-start" id="btn-start-adding-place">
          <span>فهمت، ابدأ إضافة مكاني الآن 🚀</span>
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const closeOnboarding = () => {
    const chk = document.getElementById('chk-onboarding-dont-show');
    if (chk && chk.checked) {
      markAddPlaceOnboardingSeen();
    }
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 250);
  };

  overlay.querySelector('#btn-close-onboarding-top').addEventListener('click', closeOnboarding);
  overlay.querySelector('#btn-start-adding-place').addEventListener('click', closeOnboarding);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOnboarding();
  });
}
