/**
 * AddPlaceOnboardingModal.js
 * Interactive World-Class 3D Onboarding Guide for Adding a New Place (يظهر للمستخدم أول مرة فقط)
 * - 3D Gyroscope & Mouse Magnetic Tilt (حركة ثلاثية الأبعاد بصرية عالمية)
 * - Floating Holographic Glows & Ambient Particle Lighting
 * - Dynamic Step Interactivity & Floating Badges
 * - Example place in guide: "مهندس محمد محمد حماد"
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
      
      <!-- Top Ambient Light Beam -->
      <div class="onboarding-modal-top-beam"></div>

      <!-- Modal Top Header -->
      <div class="onboarding-3d-header">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="onboarding-badge-icon-premium">
            <span class="icon-core">🚀</span>
            <div class="icon-halo"></div>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <h3 style="font-size:18px;font-weight:900;color:var(--text-primary,#0F172A);margin:0">كيف تضيف مكانك وتحقق أعلى مشاهدات؟</h3>
              <span class="pulse-tag-3d">✨ دليل ذكي</span>
            </div>
            <p style="font-size:12.5px;color:var(--text-muted,#64748B);margin:3px 0 0 0">
              شاهد تجربة الـ 3D التفاعلية للخطوات الثلاث الذهبية لظهور استثنائي
            </p>
          </div>
        </div>
        <button type="button" class="onboarding-close-btn" id="btn-close-onboarding-top" aria-label="إغلاق">✕</button>
      </div>

      <!-- 3D Perspective Cards Showcase -->
      <div class="onboarding-3d-stage" id="onboarding-3d-stage">
        
        <!-- Step 1: 3D Card (الاسم والموقع) -->
        <div class="card-3d-wrapper step-1" data-tilt>
          <div class="card-3d-inner">
            <div class="card-glass-shine"></div>
            <div class="card-hologram-glow glow-blue"></div>
            
            <div class="card-top-row">
              <div class="step-num-pill-3d">
                <span>1</span>
                <div class="pill-ring"></div>
              </div>
              <div class="card-floating-badge">📍 موقع دقيق</div>
            </div>

            <div class="card-3d-icon-wrap">
              <span class="card-3d-icon">📍</span>
            </div>

            <h4 class="card-3d-title">الاسم والموقع بدقة</h4>
            <p class="card-3d-desc">
              اكتب اسم نشاطك واضحاً ومميزاً ليتعرف عليه عملاء مدينتك فوراً:
            </p>

            <div class="example-box-3d">
              <span class="example-tag-3d">مثال حي</span>
              <div class="example-avatar-row">
                <div class="mini-avatar-badge">م</div>
                <div style="text-align:right">
                  <strong style="color:#0284C7;font-size:14px;display:block">مهندس محمد محمد حماد</strong>
                  <span style="font-size:11.5px;color:#64748B">📍 المنزلة — الطريق الزراعي</span>
                </div>
              </div>
            </div>

            <div class="card-tip-3d">
              <span class="tip-sparkle">⚡</span>
              <span>يتم فهرسته فورياً بمحرك البحث الصوتي والذكاء الاصطناعي.</span>
            </div>
          </div>
        </div>

        <!-- Step 2: 3D Card (أرقام التواصل والواتساب) -->
        <div class="card-3d-wrapper step-2" data-tilt>
          <div class="card-3d-inner">
            <div class="card-glass-shine"></div>
            <div class="card-hologram-glow glow-green"></div>

            <div class="card-top-row">
              <div class="step-num-pill-3d num-green">
                <span>2</span>
                <div class="pill-ring ring-green"></div>
              </div>
              <div class="card-floating-badge badge-green">📞 تواصل لحظي</div>
            </div>

            <div class="card-3d-icon-wrap icon-green">
              <span class="card-3d-icon">📞</span>
            </div>

            <h4 class="card-3d-title">أرقام التواصل والواتساب</h4>
            <p class="card-3d-desc">
              أضف هاتفك المباشر مع رقم واتساب لتسهيل طلبات وحجوزات العملاء:
            </p>

            <div class="example-box-3d wa-box">
              <span class="example-tag-3d wa-tag">اتصال وواتساب</span>
              <div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:13.5px;color:#15803D;font-weight:900;direction:ltr">
                <img src="./icons/whatsapp.png" style="width:20px;height:20px" alt="wa" />
                <span>201009945088</span>
              </div>
              <div style="font-size:11px;color:#059669;margin-top:6px;font-weight:700">
                🟢 رسالة مخصصة تلقائية توضح مصدر العميل
              </div>
            </div>

            <div class="card-tip-3d tip-green">
              <span class="tip-sparkle">💬</span>
              <span>محادثة واتساب مجهزة برابط الدليل بنقرة واحدة بدون حفظ الرقم!</span>
            </div>
          </div>
        </div>

        <!-- Step 3: 3D Card (الشعار والغلاف والتوثيق) -->
        <div class="card-3d-wrapper step-3" data-tilt>
          <div class="card-3d-inner">
            <div class="card-glass-shine"></div>
            <div class="card-hologram-glow glow-gold"></div>

            <div class="card-top-row">
              <div class="step-num-pill-3d num-gold">
                <span>3</span>
                <div class="pill-ring ring-gold"></div>
              </div>
              <div class="card-floating-badge badge-gold">👑 مكان موثق</div>
            </div>

            <div class="card-3d-icon-wrap icon-gold">
              <span class="card-3d-icon">✨</span>
            </div>

            <h4 class="card-3d-title">الشعار والغلاف والتوثيق</h4>
            <p class="card-3d-desc">
              ارفع صور واجهة المكان، واطلب شارة التوثيق لتتصدر نتائج البحث دائماً:
            </p>

            <div class="example-box-3d gold-box">
              <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                <span class="badge" style="background:#E0F2FE;color:#0284C7;font-weight:900;font-size:12px;padding:4px 12px;border-radius:20px;border:1px solid #BAE6FD">
                  ✓ موثق رسمياً بالدليل
                </span>
              </div>
              <div style="font-size:11.5px;color:#475569;margin-top:7px;font-weight:800">
                🖨️ بوستر QR عالي الدقة لواجهة المحل مجاناً
              </div>
            </div>

            <div class="card-tip-3d tip-gold">
              <span class="tip-sparkle">🏆</span>
              <span>الأماكن الموثقة تحقق 10 أضعاف المشاهدات والاتصالات في المنزلة!</span>
            </div>
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

  // ── Global Interactive 3D Card Magnetic Tilt Effect ──
  setupMagnetic3DTilt(overlay);

  const closeOnboarding = () => {
    const chk = document.getElementById('chk-onboarding-dont-show');
    if (chk && chk.checked) {
      markAddPlaceOnboardingSeen();
    }
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 300);
  };

  overlay.querySelector('#btn-close-onboarding-top').addEventListener('click', closeOnboarding);
  overlay.querySelector('#btn-start-adding-place').addEventListener('click', closeOnboarding);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOnboarding();
  });
}

/**
 * 3D Magnetic Parallax & Tilt Motion (حركة ثلاثية الأبعاد بصرية تفاعلية)
 */
function setupMagnetic3DTilt(container) {
  const cards = container.querySelectorAll('[data-tilt]');
  if (!cards.length) return;

  cards.forEach(card => {
    const inner = card.querySelector('.card-3d-inner');
    const shine = card.querySelector('.card-glass-shine');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate 3D tilt angles (max 15 deg)
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px) scale3d(1.03, 1.03, 1.03)`;
      
      if (shine) {
        const shineX = (x / rect.width) * 100;
        const shineY = (y / rect.height) * 100;
        shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`;
        shine.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
      if (shine) {
        shine.style.opacity = '0';
      }
    });
  });
}
