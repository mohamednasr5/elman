/**
 * wallet.js — Dalil Gold Coins Economy & Luxury 3D Digital Wallet
 * "ذهبيات الدليل" — الرصيد، شحن باقات إنستاباي وفودافون كاش، تحويل رصيد P2P، ودليل أسعار التمييز
 */

import { waitForAuth, getCurrentUser, signInWithGoogle, getIdToken } from '../../core/auth.js';
import { api } from '../../core/api.js';
import { WORKER_URL } from '../../core/firebase.js';
import { toast } from '../components/Toast.js';
import { showModal } from '../components/Modal.js';
import { getStoredCoinsBalance, fetchLiveCoinsBalance, setStoredCoinsBalance } from '../../core/coins-sync.js';

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PACKAGES = [
  { id: 'pkg-500', coins: 500, price: 100, tag: '', savings: '' },
  { id: 'pkg-1000', coins: 1000, price: 190, tag: 'شائعة', savings: 'وفر 10 ج.م 🎁', tagClass: 'wallet-pkg-card__tag--popular' },
  { id: 'pkg-2000', coins: 2000, price: 350, tag: 'الأكثر طلباً 👑', savings: 'وفر 50 ج.م 🎁', featured: true, tagClass: 'wallet-pkg-card__tag--top' },
  { id: 'pkg-5000', coins: 5000, price: 850, tag: 'باقة التوفير 🌟', savings: 'وفر 150 ج.م 🎁', tagClass: 'wallet-pkg-card__tag--savings' },
  { id: 'pkg-7000', coins: 7000, price: 1000, tag: 'العرض الأكبر 🔥', savings: 'وفر 400 ج.م 🎁', tagClass: 'wallet-pkg-card__tag--top' }
];

export async function renderWalletPage($container) {
  if (!$container) return;

  $container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:1.2rem;background:#050B14;color:#E2E8F0">
      <div class="spinner spinner-lg" style="border-color:#F5A623;border-top-color:transparent"></div>
      <p style="color:#FDE68A;font-size:1rem;font-weight:700">جاري فتح محفظة ذهبيات الدليل الرقمية...</p>
    </div>
  `;

  let user = null;
  try {
    user = await waitForAuth();
  } catch (_) {
    user = getCurrentUser();
  }

  if (!user || !user.uid) {
    renderGuestWallet($container);
    return;
  }

  try {
    const token = await getIdToken();
    const stored = getStoredCoinsBalance();
    const profilePts = Number(user.points ?? user.coins ?? 0);
    const initialCoins = Math.max(stored, profilePts);

    let balanceData = { balance: initialCoins, totalEarned: Number(user.totalEarned || 0), history: [], purchases: [] };

    try {
      const res = await api.get('/api/coins/balance', token);
      if (res.success && res.data) {
        // Turso is authoritative, including a legitimate zero balance.
        const finalBal = Math.max(0, Number(res.data.balance ?? 0));
        balanceData = {
          ...res.data,
          balance: finalBal
        };
        setStoredCoinsBalance(finalBal);
      }
    } catch (err) {
      console.warn('[Wallet balance fetch error]:', err);
    }

    renderUserWallet($container, user, balanceData);
  } catch (err) {
    console.error('[renderWalletPage error]:', err);
    $container.innerHTML = `
      <div class="empty-state" style="padding:4rem 1rem;text-align:center;background:#050B14;color:#fff">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h3>تعذر تحميل بيانات المحفظة</h3>
        <p style="color:#94A3B8">حدث خطأ أثناء تحميل بيانات رصيدك، يرجى المحاولة مرة أخرى.</p>
        <button class="wallet-btn-gold" onclick="location.reload()" style="margin-top:1rem">إعادة المحاولة</button>
      </div>
    `;
  }
}

/**
 * Guest Wallet View (When user is not logged in)
 */
function renderGuestWallet($container) {
  $container.innerHTML = `
    <div id="wallet-main-wrapper">
      <div class="wallet-container">

        <!-- 1. Hero Banner Matching Reference Image -->
        ${renderHeroBannerHTML()}

        <!-- 2. Guest Login Capsule Card -->
        <div class="wallet-capsule-card">
          <div class="wallet-capsule__brand">
            <div class="wallet-capsule__script">Dalil Gold Coin</div>
            <div class="wallet-capsule__subscript">عملة محلية.. لمستقبل أفضل</div>
          </div>

          <div class="wallet-capsule__center">
            <span class="wallet-capsule__badge">👑 محفظتي الرقمية المعتمدة</span>
            <div class="wallet-capsule__sublabel">سجّل دخولك بحساب جوجل لفتح محفظتك وشحن ذهبياتك فوراً</div>
            
            <div style="margin-top:14px">
              <button type="button" class="wallet-btn-gold" id="btn-wallet-guest-login" style="font-size:1.05rem;padding:14px 32px">
                <span>🔑 تسجيل الدخول لفتح محفظتك</span>
              </button>
            </div>
          </div>

          <div class="wallet-capsule__medallion">
            <img src="/assets/images/dalil-gold-coin.jpg" alt="Dalil Gold Coin" class="wallet-capsule__medallion-img" />
          </div>
        </div>

        <!-- 3. Packages Section Preview -->
        <div class="wallet-sec-header" id="packages-section">
          <h2 class="wallet-sec-title">
            <span class="wallet-sec-title__icon">💳</span>
            <span>باقات شحن ذهبيات الدليل</span>
          </h2>
          <span class="wallet-sec-badge">دفع فوري عبر إنستاباي وفودافون كاش 📱</span>
        </div>

        ${renderPackagesCardsHTML(2000)}

        <!-- 4. Services Catalog Preview -->
        <div class="wallet-sec-header">
          <h2 class="wallet-sec-title">
            <span class="wallet-sec-title__icon">🌟</span>
            <span>خدمات وأسعار التمييز بالعملات الذهبية</span>
          </h2>
        </div>

        ${renderServicesGuideHTML()}

        <!-- 5. Bottom Trust & Community Strip -->
        ${renderTrustStripHTML()}

      </div>
    </div>
  `;

  document.getElementById('btn-wallet-guest-login')?.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
      location.reload();
    } catch (err) {
      toast.error('تعذر إتمام تسجيل الدخول: ' + (err.message || ''));
    }
  });

  // Attach click events on package cards to prompt login
  $container.querySelectorAll('.btn-select-package').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('btn-wallet-guest-login')?.click();
    });
  });
}

/**
 * Logged In User Wallet View
 */
function renderUserWallet($container, user, balanceData) {
  const currentBalance = Number(balanceData.balance || 0);
  const defaultCoins = 2000;
  const defaultPrice = 350;

  $container.innerHTML = `
    <div id="wallet-main-wrapper">
      <div class="wallet-container">

        <!-- 1. Hero Banner Matching Reference Design -->
        ${renderHeroBannerHTML()}

        <!-- 2. Capsule Wallet Balance Card -->
        <div class="wallet-capsule-card">
          <div class="wallet-capsule__brand">
            <div class="wallet-capsule__script">Dalil Gold Coin</div>
            <div class="wallet-capsule__subscript">عملة محلية.. لمستقبل أفضل</div>
          </div>

          <div class="wallet-capsule__center">
            <span class="wallet-capsule__badge">👑 محفظتي الرقمية المعتمدة</span>
            <div class="wallet-capsule__sublabel">رصيدك الحالي من ذهبيات الدليل</div>
            
            <div class="wallet-capsule__balance-row">
              <img src="/assets/images/dalil-gold-coin.jpg" alt="Coin Icon" class="wallet-capsule__coin-icon" />
              <div class="wallet-capsule__amount" id="wallet-live-balance">${currentBalance.toLocaleString('ar-EG')} <span style="font-size:1.3rem;font-weight:800;color:#FDE68A">ذهبية</span></div>
            </div>

            <div class="wallet-capsule__actions">
              <a href="#packages-section" class="wallet-btn-gold">
                <span>⚡ شحن الرصيد الآن</span>
              </a>
              <a href="#transfer-section" class="wallet-btn-blue">
                <span>🔁 تحويل لصديق</span>
              </a>
              <button type="button" class="wallet-btn-glass" id="btn-refresh-balance" title="تحديث الرصيد فوراً">
                <span>🔄 تحديث الرصيد</span>
              </button>
            </div>
          </div>

          <div class="wallet-capsule__medallion">
            <img src="/assets/images/dalil-gold-coin.jpg" alt="Dalil Gold Coin Medallion" class="wallet-capsule__medallion-img" />
          </div>
        </div>

        <!-- 3. Recharge Packages Section -->
        <div class="wallet-sec-header" id="packages-section">
          <h2 class="wallet-sec-title">
            <span class="wallet-sec-title__icon">💳</span>
            <span>باقات شحن ذهبيات الدليل</span>
          </h2>
          <span class="wallet-sec-badge">دفع فوري عبر إنستاباي وفودافون كاش 📱</span>
        </div>

        ${renderPackagesCardsHTML(defaultCoins)}

        <!-- 4. Dedicated 3D Payment Hub (InstaPay & Vodafone Cash) -->
        <div class="wallet-payment-hub" id="payment-hub-box">

          <!-- Method Selection Tabs -->
          <div class="wallet-payment-tabs">
            <button type="button" class="wallet-tab-btn is-active" id="tab-btn-instapay" data-tab="instapay">
              <span style="font-size:1.1rem">⚡</span>
              <span>الدفع المباشر عبر إنستاباي (InstaPay)</span>
            </button>
            <button type="button" class="wallet-tab-btn" id="tab-btn-vodafone" data-tab="vodafone">
              <span style="font-size:1.1rem">📱</span>
              <span>محفظة فودافون كاش (Vodafone Cash)</span>
            </button>
          </div>

          <!-- Selected Package Live Status -->
          <div class="wallet-selected-summary">
            <div class="wallet-selected-summary__info">
              <img src="/assets/images/dalil-gold-coin.jpg" alt="Coin Icon" class="wallet-selected-summary__icon" />
              <div>
                <div class="wallet-selected-summary__title">
                  الباقة المختارة: <strong id="selected-coins-display" style="color:#FDE68A">${defaultCoins.toLocaleString('ar-EG')}</strong> عملة ذهبية
                </div>
                <div class="wallet-selected-summary__sub">تأكيد تلقائي للشحن في محفظتك المعتمدة</div>
              </div>
            </div>

            <div class="wallet-selected-summary__price-box">
              <span class="wallet-selected-summary__price-val" id="selected-price-display">${defaultPrice}</span>
              <span class="wallet-selected-summary__price-lbl">جنيه مصري</span>
            </div>
          </div>

          <!-- TAB CONTENT A: INSTAPAY -->
          <div id="tab-content-instapay">
            <!-- Direct InstaPay CTA Button -->
            <a href="https://ipn.eg/S/01279934735" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="wallet-instapay-direct-btn" 
               id="btn-instapay-direct">
              <span style="font-size:1.4rem">⚡</span>
              <span>اضغط هنا للدفع مباشرة عبر إنستاباي (<span id="instapay-btn-price">${defaultPrice}</span> ج.م) ↗</span>
            </a>

            <!-- InstaPay Account Details Cards -->
            <div class="wallet-account-info-grid">
              <div class="wallet-info-card">
                <div>
                  <div class="wallet-info-card__label">رقم الحساب / الهاتف في إنستاباي:</div>
                  <div class="wallet-info-card__val" id="instapay-phone-display">01279934735</div>
                </div>
                <button type="button" class="wallet-btn-copy btn-copy" data-copy="01279934735">
                  <span>📋 نسخ الرقم</span>
                </button>
              </div>

              <div class="wallet-info-card">
                <div>
                  <div class="wallet-info-card__label">اسم صاحب الحساب المستلم:</div>
                  <div class="wallet-info-card__val" style="direction:rtl;text-align:right" id="instapay-name-display">محمد نصر نصر</div>
                </div>
                <button type="button" class="wallet-btn-copy btn-copy" data-copy="محمد نصر نصر">
                  <span>📋 نسخ الاسم</span>
                </button>
              </div>

              <div class="wallet-info-card">
                <div>
                  <div class="wallet-info-card__label">الشبكة المعتمدة:</div>
                  <div class="wallet-info-card__val" style="direction:rtl;text-align:right;font-size:0.95rem;color:#FDE68A">شبكة المدفوعات اللحظية IPN 🇪🇬</div>
                </div>
                <span style="font-size:1.3rem">🏦</span>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT B: VODAFONE CASH -->
          <div id="tab-content-vodafone" style="display:none">
            <div class="wallet-account-info-grid">
              <div class="wallet-info-card">
                <div>
                  <div class="wallet-info-card__label">رقم محفظة فودافون كاش للتحويل:</div>
                  <div class="wallet-info-card__val">01279934735</div>
                </div>
                <button type="button" class="wallet-btn-copy btn-copy" data-copy="01279934735">
                  <span>📋 نسخ الرقم</span>
                </button>
              </div>

              <div class="wallet-info-card">
                <div>
                  <div class="wallet-info-card__label">اسم صاحب المحفظة المستلم:</div>
                  <div class="wallet-info-card__val" style="direction:rtl;text-align:right">محمد نصر</div>
                </div>
                <button type="button" class="wallet-btn-copy btn-copy" data-copy="محمد نصر">
                  <span>📋 نسخ الاسم</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Unified Receipt Submission Form (Authorized Server Verification) -->
          <form class="wallet-purchase-form" id="form-coin-purchase">
            <div class="wallet-purchase-form__title">
              <span>📝</span>
              <span id="purchase-form-heading">تأكيد التحويل وإرسال الإيصال للشحن المعتمد</span>
            </div>

            <!-- Hidden Inputs to bind selected package dynamically -->
            <input type="hidden" id="purchase-coins-input" name="packageCoins" value="${defaultCoins}" />
            <input type="hidden" id="purchase-price-input" name="amountEgp" value="${defaultPrice}" />
            <input type="hidden" id="purchase-method-input" name="paymentMethod" value="instapay" />

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:14px;margin-bottom:14px">
              <div class="wallet-form-group" style="margin:0">
                <label class="wallet-form-label">الباقة المطلوبة <span style="color:#EF4444">*</span></label>
                <select class="wallet-form-select" id="purchase-package-select">
                  ${PACKAGES.map(p => `
                    <option value="${p.coins}-${p.price}" ${p.coins === defaultCoins ? 'selected' : ''}>
                      ${p.coins.toLocaleString('ar-EG')} ذهبية — ${p.price} ج.م ${p.savings ? '(' + p.savings + ')' : ''}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="wallet-form-group" style="margin:0">
                <label class="wallet-form-label">
                  <span id="sender-input-label">رقم الهاتف أو الحساب المحول منه</span> <span style="color:#EF4444">*</span>
                </label>
                <input type="tel" class="wallet-form-input" id="purchase-sender-phone" required placeholder="01xxxxxxxxx" style="direction:ltr;text-align:right" />
              </div>
            </div>

            <!-- Receipt File Upload (3D Animated Dropzone) -->
            <div class="wallet-form-group">
              <label class="wallet-form-label" style="display:flex;align-items:center;justify-content:space-between">
                <span>صورة إيصال التحويل أو لقطة الشاشة <span style="color:#EF4444">*</span></span>
                <span style="font-size:0.75rem;color:#F5A623;font-weight:700">⚡ سحب وإفلات أو اختيار مباشر</span>
              </label>
              
              <div class="wallet-receipt-dropzone" id="wallet-receipt-dropzone" role="button" tabindex="0" aria-label="رفع إيصال التحويل">
                <input type="file" id="purchase-receipt-file" accept="image/jpeg,image/png,image/webp,image/jpg" class="wallet-receipt-input" required />
                
                <!-- State 1: Prompt to Upload -->
                <div class="wallet-receipt-prompt" id="wallet-receipt-prompt">
                  <div class="wallet-receipt-icon-box">
                    <span class="wallet-receipt-icon">🧾</span>
                    <div class="wallet-receipt-icon-glow"></div>
                  </div>
                  <div class="wallet-receipt-texts">
                    <strong class="wallet-receipt-main-text">اضغط هنا لاختيار صورة الإيصال أو اسحبها إلى هنا</strong>
                    <p class="wallet-receipt-sub-text">التقط لقطة شاشة لرسالة تأكيد التحويل من إنستاباي أو محفظة فودافون كاش</p>
                  </div>
                  <div class="wallet-receipt-badge">
                    <span>📸 استعراض من الجهاز (PNG, JPG, WebP)</span>
                  </div>
                </div>

                <!-- State 2: 3D Preview Card -->
                <div class="wallet-receipt-preview" id="wallet-receipt-preview" style="display:none">
                  <div class="wallet-receipt-preview-card">
                    <div class="wallet-receipt-img-frame">
                      <img id="receipt-preview-img" src="" alt="معاينة إيصال التحويل" />
                      <div class="wallet-receipt-img-overlay">
                        <span class="receipt-overlay-tag">✓ إيصال معتمد</span>
                      </div>
                    </div>
                    <div class="wallet-receipt-meta">
                      <div class="wallet-receipt-meta-header">
                        <span class="wallet-receipt-file-name" id="receipt-file-name">receipt.jpg</span>
                        <span class="wallet-receipt-file-size" id="receipt-file-size">0 KB</span>
                      </div>
                      <div class="wallet-receipt-status-pill">
                        <span class="pulse-dot"></span>
                        <span>جاهز للاعتماد الفوري</span>
                      </div>
                      <div class="wallet-receipt-actions">
                        <button type="button" class="wallet-receipt-btn-change" id="btn-change-receipt">
                          <span>🔄 تغيير الصورة</span>
                        </button>
                        <button type="button" class="wallet-receipt-btn-remove" id="btn-remove-receipt">
                          <span>✕ إزالة</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" class="wallet-btn-gold" id="btn-submit-purchase" style="width:100%;font-size:1.05rem;padding:14px">
              <span>✅ إرسال إشعار التحويل واعتماد الشحن</span>
            </button>
          </form>

        </div>

        <!-- 5. P2P Coin Transfer Section -->
        <div class="wallet-sec-header" id="transfer-section">
          <h2 class="wallet-sec-title">
            <span class="wallet-sec-title__icon">🤝</span>
            <span>تحويل ذهبيات الدليل من شخص لآخر</span>
          </h2>
          <span class="wallet-sec-badge">تحويل فوري بدون أي رسوم</span>
        </div>

        <div class="wallet-transfer-box">
          <form id="form-p2p-transfer">
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:14px;margin-bottom:14px">
              <div class="wallet-form-group" style="margin:0">
                <label class="wallet-form-label">رقم هاتف أو بريد المستلم <span style="color:#EF4444">*</span></label>
                <input type="text" class="wallet-form-input" id="transfer-recipient-input" placeholder="01xxxxxxxxx أو user@gmail.com" required />
              </div>

              <div class="wallet-form-group" style="margin:0">
                <label class="wallet-form-label">عدد العملات الذهبية للتحويل <span style="color:#EF4444">*</span></label>
                <input type="number" class="wallet-form-input" id="transfer-amount-input" min="10" max="50000" placeholder="الحد الأدنى 10 ذهبيات" required />
              </div>
            </div>

            <div class="wallet-form-group" style="margin-bottom:18px">
              <label class="wallet-form-label">ملاحظة أو رسالة إهداء (اختياري)</label>
              <input type="text" class="wallet-form-input" id="transfer-note-input" placeholder="مثال: شكر وتقدير / تمييز إعلان / هدية" maxlength="150" />
            </div>

            <button type="submit" class="wallet-btn-blue" id="btn-submit-transfer" style="width:100%;font-size:1rem;padding:12px">
              <span>↗️ تأكيد وتحويل العملات فوراً</span>
            </button>
          </form>
        </div>

        <!-- 6. Services & Pricing Catalog -->
        <div class="wallet-sec-header">
          <h2 class="wallet-sec-title">
            <span class="wallet-sec-title__icon">🌟</span>
            <span>خدمات وأسعار التمييز بالعملات الذهبية</span>
          </h2>
        </div>

        ${renderServicesGuideHTML()}

        <!-- 7. Policy Alert -->
        <div class="wallet-policy-alert">
          <span style="font-size:1.8rem;line-height:1">⚠️</span>
          <div style="font-size:0.88rem;line-height:1.6">
            <strong style="display:block;font-size:0.95rem;margin-bottom:2px;color:#FDE68A">تنبيه هام وقاطع لجميع المستخدمين:</strong>
            العملات الذهبية المستخدمة في تمييز الأنشطة أو الوظائف أو التوثيق <strong>غير قابلة للاسترداد نهائياً وأبداً</strong> بعد تفعيل أي إعلان أو تعديل بياناته أو حذفه من قبل صاحب الشأن.
          </div>
        </div>

        <!-- 8. Transaction & Request History -->
        <div class="wallet-sec-header">
          <h2 class="wallet-sec-title">
            <span class="wallet-sec-title__icon">📜</span>
            <span>سجل المعاملات والشحن</span>
          </h2>
        </div>

        <div class="wallet-history-wrap">
          ${renderHistoryHTML(balanceData)}
        </div>

        <!-- 9. Bottom Trust & Community Strip -->
        ${renderTrustStripHTML()}

      </div>
    </div>
  `;

  bindWalletEvents($container, user, balanceData);
}

/**
 * 1. Hero Banner Component
 */
function renderHeroBannerHTML() {
  return `
    <div class="wallet-hero-banner">
      <div class="wallet-hero-banner__grid">
        
        <!-- Left: Tagline & Community Chips -->
        <div class="wallet-hero-col--left">
          <h1 class="wallet-hero-tagline">عملة أهل بلدنا</h1>
          <div class="wallet-hero-subtag">لدعم دليل المنزلة والمطرية الرقمي</div>
          
          <div class="wallet-hero-chips">
            <span class="wallet-hero-chip"><span class="wallet-hero-chip__icon">💎</span> ثقة</span>
            <span class="wallet-hero-chip"><span class="wallet-hero-chip__icon">👥</span> مشاركة</span>
            <span class="wallet-hero-chip"><span class="wallet-hero-chip__icon">📈</span> نمو</span>
            <span class="wallet-hero-chip"><span class="wallet-hero-chip__icon">🛡️</span> دعم محلي</span>
          </div>
        </div>

        <!-- Center: 3D Grand Coin & Podium -->
        <div class="wallet-hero-col--center">
          <div class="wallet-hero-spotlight"></div>
          
          <div class="wallet-hero-coin-wrap">
            <img src="/assets/images/dalil-gold-coin.jpg" alt="Dalil Gold Coin 3D" class="wallet-hero-coin-img" />
          </div>

          <div class="wallet-hero-podium">
            <div class="wallet-hero-podium__tier wallet-hero-podium__tier--top"></div>
            <div class="wallet-hero-podium__tier wallet-hero-podium__tier--base"></div>
          </div>
        </div>

        <!-- Right: Vision & Verified Points -->
        <div class="wallet-hero-col--right">
          <h2 class="wallet-hero-tagline" style="font-size:clamp(1.6rem, 2.8vw, 2.1rem)">معاً.. نبني دليلاً أقوى</h2>
          
          <div class="wallet-hero-points">
            <div class="wallet-hero-point">
              <span class="wallet-hero-point__check">✓</span>
              <span>عملة رقمية محلية معتمدة</span>
            </div>
            <div class="wallet-hero-point">
              <span class="wallet-hero-point__check">✓</span>
              <span>استخدامات متعددة داخل الدليل</span>
            </div>
            <div class="wallet-hero-point">
              <span class="wallet-hero-point__check">✓</span>
              <span>دعم الأعمال المحلية والمجتمع</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

/**
 * 2. 3D Recharge Packages Component
 */
function renderPackagesCardsHTML(selectedCoins = 2000) {
  return `
    <div class="wallet-packages-grid">
      ${PACKAGES.map(p => {
        const isSelected = p.coins === selectedCoins;
        return `
          <div class="wallet-pkg-card ${p.featured ? 'wallet-pkg-card--featured' : ''} ${isSelected ? 'is-selected' : ''}" 
               data-coins="${p.coins}" 
               data-price="${p.price}" 
               id="pkg-card-${p.coins}">
            
            ${p.tag ? `<span class="wallet-pkg-card__tag ${p.tagClass || ''}">${p.tag}</span>` : ''}
            
            <img src="/assets/images/dalil-gold-coin.jpg" alt="Gold Coins Stack" class="wallet-pkg-card__coin-img" />
            
            <div class="wallet-pkg-card__coins-wrap">
              <span class="wallet-pkg-card__coins-num">${p.coins.toLocaleString('ar-EG')}</span>
              <span style="font-size:1.2rem">🪙</span>
            </div>
            <div class="wallet-pkg-card__coins-lbl">عملة ذهبية</div>

            <div class="wallet-pkg-card__price">${p.price} ج.م</div>

            ${p.savings ? `<span class="wallet-pkg-card__savings">${p.savings}</span>` : `<div class="wallet-pkg-card__savings-placeholder"></div>`}

            <button type="button" class="wallet-pkg-card__btn btn-select-package" data-coins="${p.coins}" data-price="${p.price}">
              <span>اختر هذه الباقة 🛒</span>
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * 3. Services Catalog Component
 */
function renderServicesGuideHTML() {
  return `
    <div class="wallet-services-grid">
      <div class="wallet-srv-card" style="border-color:#38BDF8">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">👑 توثيق المكان بالعلامة الزرقاء</h3>
          <span class="wallet-srv-card__cost">5,000 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: مدى الحياة (توثيق دائم)</div>
        <p class="wallet-srv-card__desc">
          شارة توثيق رسمية تعزز الثقة والمصداقية وتمنح ملفك صدارة نتائج البحث وظهور مميز أمام كافة العملاء.
        </p>
        <a href="/dashboard.html?section=places" class="btn btn-sm" style="margin-top:10px;display:block;text-align:center;text-decoration:none;background:rgba(56,189,248,0.15);color:#38BDF8;border:1px solid rgba(56,189,248,0.4);border-radius:8px;padding:7px;font-weight:800">
          👑 توثيق أحد أنشطتي الآن
        </a>
      </div>

      <div class="wallet-srv-card" style="border-color:#F5A623">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">🌟 تمييز المكان كإعلان مميز</h3>
          <span class="wallet-srv-card__cost">500 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: شهر كامل (30 يوماً)</div>
        <p class="wallet-srv-card__desc">
          ظهور إعلاني بارز في الواجهة الرئيسية وتصنيفه بالأولوية الذهبية لجذب آلاف الزوار المحليين طوال الشهر.
        </p>
        <a href="/dashboard.html?section=places" class="btn btn-sm" style="margin-top:10px;display:block;text-align:center;text-decoration:none;background:rgba(245,166,35,0.15);color:#F5A623;border:1px solid rgba(245,166,35,0.4);border-radius:8px;padding:7px;font-weight:800">
          🌟 ترويج نشاطي كإعلان مميز
        </a>
      </div>

      <div class="wallet-srv-card" style="border-color:#10B981">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">💼 تمييز طالب عمل (سيرة ذاتية)</h3>
          <span class="wallet-srv-card__cost">500 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: 3 أيام متتالية</div>
        <p class="wallet-srv-card__desc">
          عرض سيرتك الذاتية في بطاقات الأماكن الدوارة وبصدر لوحة الكوادر لتصل لأصحاب العمل بشكل فوري.
        </p>
        <a href="/job-seekers.html" class="btn btn-sm" style="margin-top:10px;display:block;text-align:center;text-decoration:none;background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.4);border-radius:8px;padding:7px;font-weight:800">
          💼 تمييز سيرة ذاتية في الكوادر
        </a>
      </div>

      <div class="wallet-srv-card" style="border-color:#818CF8">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">📢 تمييز وظيفة شاغرة</h3>
          <span class="wallet-srv-card__cost">500 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: 3 أيام متتالية</div>
        <p class="wallet-srv-card__desc">
          إبراز فرصة العمل في صدارة لوحة الوظائف وبطاقات الأماكن لإيجاد الموظف المطلوب بسرعة قياسية.
        </p>
        <a href="/jobs.html" class="btn btn-sm" style="margin-top:10px;display:block;text-align:center;text-decoration:none;background:rgba(129,140,248,0.15);color:#818CF8;border:1px solid rgba(129,140,248,0.4);border-radius:8px;padding:7px;font-weight:800">
          📢 تمييز إعلان وظيفة
        </a>
      </div>
    </div>
  `;
}

/**
 * 4. Transaction History Table
 */
function renderHistoryHTML(balanceData) {
  const history = Array.isArray(balanceData.history) ? balanceData.history : [];
  const purchases = Array.isArray(balanceData.purchases) ? balanceData.purchases : [];

  const transactions = [
    ...purchases.map(p => ({
      kind: 'purchase',
      created_at: Number(p.created_at || 0),
      data: p
    })),
    ...history.map(h => ({
      kind: 'loyalty',
      created_at: Number(h.created_at || 0),
      data: h
    }))
  ].sort((a, b) => b.created_at - a.created_at);

  const classify = tx => {
    if (tx.kind === 'purchase') return 'purchase';
    const key = String(tx.data?.rule_key || '').toUpperCase();
    if (key === 'REDEEM_VERIFICATION') return 'verification';
    if (key === 'SPONSORED_PLACE') return 'sponsored';
    if (key === 'FEATURED_JOB' || key === 'FEATURED_SEEKER') return 'promotion';
    if (key === 'TRANSFER_OUT' || key === 'TRANSFER_IN') return 'transfer';
    if (key === 'COIN_PURCHASE') return 'purchase';
    if (key === 'ADMIN_ADJUST') return 'admin';
    if (key === 'DAILY_LOGIN' || key === 'INTERACTION') return 'earning';
    return 'other';
  };

  const typeLabels = {
    all: 'كل العمليات',
    purchase: 'شحن الرصيد',
    earning: 'مكافآت وكسب',
    verification: 'توثيق',
    sponsored: 'إعلان مميز',
    promotion: 'تمييز وظائف',
    transfer: 'تحويلات',
    admin: 'تعديلات إدارية',
    other: 'أخرى'
  };

  const typeIcons = {
    purchase: '💳',
    earning: '🎁',
    verification: '🔵',
    sponsored: '🌟',
    promotion: '📢',
    transfer: '🔁',
    admin: '⚙️',
    other: '💰'
  };

  if (transactions.length === 0) {
    return `<div class="wallet-history-empty" style="text-align:center;padding:42px 16px;color:#94A3B8;font-size:0.95rem">لا توجد معاملات مسجلة حتى الآن.</div>`;
  }

  const totalPositive = transactions.reduce((sum, tx) => sum + Math.max(0, Number(tx.data?.amount ?? tx.data?.package_coins ?? 0)), 0);
  const totalNegative = transactions.reduce((sum, tx) => sum + Math.min(0, Number(tx.data?.amount ?? 0)), 0);

  const transactionRows = transactions.map((tx, index) => {
    const category = classify(tx);
    const typeLabel = typeLabels[category] || typeLabels.other;
    const icon = typeIcons[category] || typeIcons.other;
    const dateStr = tx.created_at
      ? new Date(tx.created_at).toLocaleString('ar-EG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—';

    let amount = Number(tx.data?.amount ?? 0);
    let detail = '';
    let status = '<span style="color:#10B981;font-size:0.85rem;font-weight:800">مكتملة ✓</span>';

    if (tx.kind === 'purchase') {
      const p = tx.data;
      amount = Number(p.package_coins || 0);
      detail = `
        <div style="font-weight:800;color:#FFFFFF">شحن ${amount.toLocaleString('ar-EG')} ذهبية</div>
        <div style="font-size:0.78rem;color:#94A3B8">
          ${Number(p.amount_egp || 0).toLocaleString('ar-EG')} ج.م • ${escHtml(p.payment_method || 'تحويل إلكتروني')}
          ${p.vodafone_sender_number ? ' • من: ' + escHtml(p.vodafone_sender_number) : ''}
        </div>`;
      const statusLabels = {
        pending: '<span class="badge" style="background:rgba(245,166,35,0.15);color:#F5A623;padding:4px 10px;border-radius:8px;font-weight:800">⏳ قيد المراجعة</span>',
        approved: '<span class="badge" style="background:rgba(16,185,129,0.15);color:#10B981;padding:4px 10px;border-radius:8px;font-weight:800">✅ تم الشحن</span>',
        rejected: '<span class="badge" style="background:rgba(239,68,68,0.15);color:#EF4444;padding:4px 10px;border-radius:8px;font-weight:800">❌ مرفوض</span>'
      };
      status = statusLabels[p.status] || escHtml(p.status || 'غير محدد');
    } else {
      const h = tx.data;
      detail = `
        <div style="font-weight:700;color:#FFFFFF">${escHtml(h.label || h.rule_key || 'معاملة رصيد')}</div>
        ${h.place_name ? '<div style="font-size:0.78rem;color:#94A3B8">المكان: ' + escHtml(h.place_name) + '</div>' : ''}
      `;
    }

    const isPositive = amount > 0;
    const valueText = amount > 0
      ? '+' + amount.toLocaleString('ar-EG')
      : amount < 0
        ? amount.toLocaleString('ar-EG')
        : '0';

    return `
      <tr class="wallet-history-row"
          data-type="${category}"
          data-status="${tx.kind === 'purchase' ? escHtml(tx.data?.status || '') : 'completed'}"
          data-search="${escHtml([typeLabel, tx.data?.label, tx.data?.rule_key, tx.data?.place_name].filter(Boolean).join(' ')).toLowerCase()}"
          data-amount="${amount}"
          data-index="${index}">
        <td style="color:#94A3B8;font-size:0.82rem;white-space:nowrap">${escHtml(dateStr)}</td>
        <td><span style="font-weight:800;color:#FDE68A">${icon} ${typeLabel}</span></td>
        <td>${detail}</td>
        <td style="font-weight:900;color:${isPositive ? '#10B981' : amount < 0 ? '#EF4444' : '#94A3B8'};white-space:nowrap">${valueText} 🪙</td>
        <td>${status}</td>
      </tr>`;
  }).join('');

  return `
    <div class="wallet-history-toolbar" style="display:grid;grid-template-columns:minmax(190px,1fr) minmax(190px,1fr) minmax(220px,1.4fr) auto;gap:10px;align-items:center;margin-bottom:14px">
      <select id="wallet-history-type" class="wallet-form-select" style="margin:0">
        ${Object.entries(typeLabels).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}
      </select>
      <select id="wallet-history-status" class="wallet-form-select" style="margin:0">
        <option value="all">كل الحالات</option>
        <option value="approved">تم الشحن</option>
        <option value="pending">قيد المراجعة</option>
        <option value="rejected">مرفوض</option>
        <option value="completed">مكتملة</option>
      </select>
      <input id="wallet-history-search" class="wallet-form-input" type="search" placeholder="🔎 ابحث في البيان أو اسم المكان..." autocomplete="off" style="margin:0">
      <button type="button" id="wallet-history-reset" class="wallet-btn-glass" style="white-space:nowrap">↺ إعادة</button>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <div style="flex:1;min-width:150px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:10px 14px">
        <div style="font-size:.72rem;color:#94A3B8">إجمالي العمليات</div>
        <strong id="wallet-history-count" style="font-size:1.1rem;color:#FDE68A">${transactions.length.toLocaleString('ar-EG')}</strong>
      </div>
      <div style="flex:1;min-width:150px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2);border-radius:12px;padding:10px 14px">
        <div style="font-size:.72rem;color:#94A3B8">إجمالي الداخل المسجل</div>
        <strong style="font-size:1.1rem;color:#10B981">+${totalPositive.toLocaleString('ar-EG')} 🪙</strong>
      </div>
      <div style="flex:1;min-width:150px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.18);border-radius:12px;padding:10px 14px">
        <div style="font-size:.72rem;color:#94A3B8">إجمالي الخارج المسجل</div>
        <strong style="font-size:1.1rem;color:#EF4444">${totalNegative.toLocaleString('ar-EG')} 🪙</strong>
      </div>
    </div>

    <div style="overflow-x:auto">
      <table class="wallet-history-table">
        <thead>
          <tr>
            <th>التاريخ والوقت</th>
            <th>نوع العملية</th>
            <th>البيان والتفاصيل</th>
            <th>القيمة</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody id="wallet-history-body">
          ${transactionRows}
        </tbody>
      </table>
      <div id="wallet-history-no-results" style="display:none;text-align:center;padding:28px;color:#94A3B8">
        لا توجد عمليات تطابق الفلتر الحالي.
      </div>
    </div>
  `;
}
/**
 * 5. Trust & Community Footer Strip
 */
function renderTrustStripHTML() {
  return `
    <div class="wallet-trust-strip">
      <div class="wallet-trust-item">
        <span>🎧</span>
        <span>دعم فني سريع</span>
      </div>
      <div class="wallet-trust-item">
        <span>🛡️</span>
        <span>معاملات فورية وآمنة</span>
      </div>
      <div class="wallet-trust-item">
        <span>📍</span>
        <span>استخدام داخل دليل المنزلة والمطرية</span>
      </div>
      <div class="wallet-trust-item">
        <span>👥</span>
        <span>ادعم مجتمعك المحلي</span>
      </div>
      <div class="wallet-trust-item" style="margin-right:auto">
        <span class="wallet-trust-item__heart">🤍</span>
        <span style="color:#FDE68A">كل ذهبية .. تصنع فرقاً</span>
      </div>
    </div>
  `;
}

/**
 * Event Bindings & Payment Logic
 */
function bindWalletEvents($container, user, balanceData) {
  let activeCoins = 2000;
  let activePrice = 350;
  let activeMethod = 'instapay';

  // 1. Copy Buttons
  $container.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy');
      if (val) {
        try {
          await navigator.clipboard.writeText(val);
          const original = btn.innerHTML;
          btn.innerHTML = '<span>✓ تم النسخ!</span>';
          setTimeout(() => { btn.innerHTML = original; }, 2000);
          toast.success('تم نسخ ' + val + ' إلى الحافظة بنجاح 📋');
        } catch (_) {
          toast.info('الرقم: ' + val);
        }
      }
    });
  });

  // 2. Tab Toggles (InstaPay / Vodafone Cash)
  const tabBtnInsta = document.getElementById('tab-btn-instapay');
  const tabBtnVoda = document.getElementById('tab-btn-vodafone');
  const tabContentInsta = document.getElementById('tab-content-instapay');
  const tabContentVoda = document.getElementById('tab-content-vodafone');
  const methodInput = document.getElementById('purchase-method-input');
  const senderInputLabel = document.getElementById('sender-input-label');
  const formHeading = document.getElementById('purchase-form-heading');

  function setPaymentMethod(method) {
    activeMethod = method;
    if (methodInput) methodInput.value = method;

    if (method === 'instapay') {
      tabBtnInsta?.classList.add('is-active');
      tabBtnVoda?.classList.remove('is-active');
      if (tabContentInsta) tabContentInsta.style.display = 'block';
      if (tabContentVoda) tabContentVoda.style.display = 'none';
      if (senderInputLabel) senderInputLabel.textContent = 'رقم الحساب أو الهاتف المحول منه عبر إنستاباي';
      if (formHeading) formHeading.textContent = 'تأكيد تحويل إنستاباي وإرسال الإيصال للشحن المعتمد';
    } else {
      tabBtnVoda?.classList.add('is-active');
      tabBtnInsta?.classList.remove('is-active');
      if (tabContentVoda) tabContentVoda.style.display = 'block';
      if (tabContentInsta) tabContentInsta.style.display = 'none';
      if (senderInputLabel) senderInputLabel.textContent = 'رقم محفظة فودافون كاش التي قمت بالتحويل منها';
      if (formHeading) formHeading.textContent = 'تأكيد تحويل فودافون كاش وإرسال الإيصال للشحن المعتمد';
    }
  }

  tabBtnInsta?.addEventListener('click', () => setPaymentMethod('instapay'));
  tabBtnVoda?.addEventListener('click', () => setPaymentMethod('vodafone'));

  // 3. Update Selected Package State dynamically
  function updateSelectedPackage(coins, price, shouldScroll = true) {
    activeCoins = parseInt(coins, 10);
    activePrice = parseInt(price, 10);

    // Update active class on package cards
    $container.querySelectorAll('.wallet-pkg-card').forEach(card => {
      if (parseInt(card.getAttribute('data-coins'), 10) === activeCoins) {
        card.classList.add('is-selected');
      } else {
        card.classList.remove('is-selected');
      }
    });

    // Update Summary Card
    const coinsDisplay = document.getElementById('selected-coins-display');
    const priceDisplay = document.getElementById('selected-price-display');
    const instaBtnPrice = document.getElementById('instapay-btn-price');

    if (coinsDisplay) coinsDisplay.textContent = activeCoins.toLocaleString('ar-EG');
    if (priceDisplay) priceDisplay.textContent = String(activePrice);
    if (instaBtnPrice) instaBtnPrice.textContent = String(activePrice);

    // Update Form Inputs
    const coinsInput = document.getElementById('purchase-coins-input');
    const priceInput = document.getElementById('purchase-price-input');
    const select = document.getElementById('purchase-package-select');

    if (coinsInput) coinsInput.value = activeCoins;
    if (priceInput) priceInput.value = activePrice;
    if (select) select.value = `${activeCoins}-${activePrice}`;

    // Scroll to payment hub if requested
    if (shouldScroll) {
      const hub = document.getElementById('payment-hub-box');
      if (hub) {
        hub.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hub.style.transition = 'outline 0.3s ease';
        hub.style.outline = '3px solid #F5A623';
        setTimeout(() => { hub.style.outline = 'none'; }, 1600);
      }
    }
  }

  // 4. Select Package Click Handlers
  $container.querySelectorAll('.btn-select-package').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const coins = btn.getAttribute('data-coins');
      const price = btn.getAttribute('data-price');
      updateSelectedPackage(coins, price, true);
    });
  });

  $container.querySelectorAll('.wallet-pkg-card').forEach(card => {
    card.addEventListener('click', () => {
      const coins = card.getAttribute('data-coins');
      const price = card.getAttribute('data-price');
      updateSelectedPackage(coins, price, true);
    });
  });

  // When dropdown select changes
  const select = document.getElementById('purchase-package-select');
  select?.addEventListener('change', () => {
    const [c, p] = select.value.split('-');
    updateSelectedPackage(c, p, false);
  });

  // 5. 3D Receipt Dropzone & Preview Handler
  const dropzone = document.getElementById('wallet-receipt-dropzone');
  const fileInput = document.getElementById('purchase-receipt-file');
  const promptEl = document.getElementById('wallet-receipt-prompt');
  const previewWrap = document.getElementById('wallet-receipt-preview');
  const previewImg = document.getElementById('receipt-preview-img');
  const fileNameEl = document.getElementById('receipt-file-name');
  const fileSizeEl = document.getElementById('receipt-file-size');
  const btnChange = document.getElementById('btn-change-receipt');
  const btnRemove = document.getElementById('btn-remove-receipt');

  function formatFileSize(bytes) {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return Math.round(kb) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
  }

  function handleReceiptFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
      if (fileNameEl) fileNameEl.textContent = file.name || 'receipt_screenshot.png';
      if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
      if (promptEl) promptEl.style.display = 'none';
      if (previewWrap) previewWrap.style.display = 'block';
      dropzone?.classList.add('has-file');
      dropzone?.classList.remove('drag-over');
    };
    reader.readAsDataURL(file);
  }

  function resetReceiptUpload() {
    if (fileInput) fileInput.value = '';
    if (previewImg) previewImg.src = '';
    if (promptEl) promptEl.style.display = 'flex';
    if (previewWrap) previewWrap.style.display = 'none';
    dropzone?.classList.remove('has-file', 'drag-over');
  }

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleReceiptFile(file);
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone?.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      if (fileInput) {
        fileInput.files = files;
      }
      handleReceiptFile(files[0]);
    }
  });

  btnChange?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  btnRemove?.addEventListener('click', (e) => {
    e.stopPropagation();
    resetReceiptUpload();
  });

  // 6. Direct InstaPay Payment Button click feedback
  const instaBtn = document.getElementById('btn-instapay-direct');
  instaBtn?.addEventListener('click', () => {
    toast.info(`جاري فتح إنستاباي لدفع ${activePrice} ج.م... تذكر التقاط صورة إيصال التحويل!`);
  });

  // 7. Submit Purchase Request Form (Authoritative Server Verification)
  const formPurchase = document.getElementById('form-coin-purchase');
  formPurchase?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-purchase');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري رفع الإيصال والتحقق المعتمد...</span>';
    }

    try {
      const coins = activeCoins;
      const price = activePrice;
      const senderPhone = (document.getElementById('purchase-sender-phone')?.value || '').trim();
      const file = fileInput?.files?.[0];

      if (!file) throw new Error('يرجى اختيار صورة إيصال التحويل');
      if (!senderPhone || senderPhone.length < 4) {
        throw new Error('يرجى إدخال رقم هاتف أو حساب صحيح للمحول');
      }

      // Step A: Upload Receipt image to R2 via /api/upload
      const token = await getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'receipts');

      const uploadRes = await fetch(`${WORKER_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'فشل رفع صورة الإيصال');
      }

      const receiptUrl = uploadData.url;

      // Step B: Submit Purchase Request to /api/coins/purchase-request
      const purchaseRes = await api.post('/api/coins/purchase-request', {
        packageCoins: coins,
        amountEgp: price,
        vodafoneSenderNumber: `${activeMethod === 'instapay' ? 'InstaPay: ' : 'Vodafone: '}${senderPhone}`,
        receiptUrl
      }, token);

      if (purchaseRes.success) {
        showModal({
          title: '🎉 تم استلام طلب الشحن بنجاح',
          content: `
            <div style="text-align:center;padding:16px;background:#050B14;color:#fff;border-radius:16px">
              <div style="font-size:48px;margin-bottom:12px">🪙</div>
              <h3 style="font-weight:900;color:#FDE68A;margin-bottom:8px">طلب شحن ${coins.toLocaleString('ar-EG')} ذهبية قيد المراجعة</h3>
              <p style="font-size:0.9rem;color:#CBD5E1;line-height:1.6;margin-bottom:14px">
                تم استلام إيصال التحويل بمبلغ (${price} ج.م) بنجاح. سيتم مراجعة العملية من قبل الإدارة وإيداع الذهبيات في محفظتك المعتمدة خلال دقائق معدودة!
              </p>
              <div style="background:rgba(229,169,60,0.12);border:1px solid rgba(229,169,60,0.3);border-radius:10px;padding:10px;font-size:0.85rem;color:#FDE68A">
                كود العملية: <code>${purchaseRes.purchaseId}</code>
              </div>
            </div>
          `,
          buttons: [{
            label: 'تم، شكراً لك',
            type: 'primary',
            closeOnClick: true,
            onClick: () => location.reload()
          }]
        });
      }
    } catch (err) {
      console.error('[Purchase submit error]:', err);
      toast.error(err.message || 'فشل إرسال طلب الشحن');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>✅ إرسال إشعار التحويل واعتماد الشحن</span>';
      }
    }
  });

  // 8. P2P Transfer Submit
  const formTransfer = document.getElementById('form-p2p-transfer');
  formTransfer?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-transfer');
    const recipient = (document.getElementById('transfer-recipient-input')?.value || '').trim();
    const amount = parseInt(document.getElementById('transfer-amount-input')?.value, 10);
    const note = (document.getElementById('transfer-note-input')?.value || '').trim();

    if (!recipient) {
      toast.warning('يرجى إدخال رقم هاتف أو بريد المستلم');
      return;
    }
    if (isNaN(amount) || amount < 10) {
      toast.warning('الحد الأدنى للتحويل هو 10 ذهبيات');
      return;
    }

    if (!confirm(`هل أنت متأكد من رغبتك في تحويل ${amount} ذهبية إلى (${recipient})؟\n\nالعملية فورية ومحمية ولا يمكن الرجوع عنها بعد التأكيد.`)) {
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري إتمام التحويل الآمن...</span>';
    }

    try {
      const token = await getIdToken();
      const res = await api.post('/api/coins/transfer', {
        recipient,
        amount,
        note
      }, token);

      if (res.success) {
        toast.success(res.message || 'تم التحويل بنجاح! 🎉');
        if (res.newBalance !== undefined) {
          const liveBal = document.getElementById('wallet-live-balance');
          if (liveBal) liveBal.textContent = Number(res.newBalance).toLocaleString('ar-EG');
          try {
            localStorage.setItem('manzala_user_coins_balance', String(res.newBalance));
            window.dispatchEvent(new CustomEvent('coins:updated', { detail: { balance: res.newBalance } }));
          } catch (_) {}
        }
        formTransfer.reset();
        setTimeout(() => location.reload(), 1500);
      }
    } catch (err) {
      console.error('[P2P Transfer error]:', err);
      toast.error(err.message || 'فشل إتمام التحويل، تحقق من الرصيد وبيانات المستلم');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>↗️ تأكيد وتحويل العملات فوراً</span>';
      }
    }
  });

  // 9. Refresh balance button
  document.getElementById('btn-refresh-balance')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-refresh-balance');
    if (btn) btn.innerHTML = '<span>⏳ جاري التحديث...</span>';
    try {
      const liveBal = await fetchLiveCoinsBalance(true);
      const liveBalEl = document.getElementById('wallet-live-balance');
      if (liveBalEl) liveBalEl.innerHTML = `${Number(liveBal).toLocaleString('ar-EG')} <span style="font-size:1.3rem;font-weight:800;color:#FDE68A">ذهبية</span>`;
      toast.success('تم تحديث الرصيد بنجاح ✓');
    } catch (_) {
      location.reload();
    } finally {
      if (btn) btn.innerHTML = '<span>🔄 تحديث الرصيد</span>';
    }
  });
}
