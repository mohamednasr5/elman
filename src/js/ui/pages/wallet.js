/**
 * wallet.js — Dalil Gold Coins Economy & User Wallet Page
 * "ذهبيات الدليل" — الرصيد، شحن باقات فودافون كاش، تحويل رصيد P2P، ودليل أسعار التمييز
 */

import { waitForAuth, getCurrentUser, signInWithGoogle, getIdToken } from '../../core/auth.js';
import { api } from '../../core/api.js';
import { WORKER_URL } from '../../core/firebase.js';
import { toast } from '../components/Toast.js';
import { showModal } from '../components/Modal.js';

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function renderWalletPage($container) {
  if (!$container) return;

  $container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:50vh;flex-direction:column;gap:1rem">
      <div class="spinner spinner-lg"></div>
      <p style="color:var(--text-muted);font-size:.9rem">جاري فتح محفظة ذهبيات الدليل...</p>
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
    let balanceData = { balance: 0, totalEarned: 0, history: [], purchases: [] };

    try {
      const res = await api.get('/api/coins/balance', token);
      if (res.success && res.data) {
        balanceData = res.data;
      }
    } catch (err) {
      console.warn('[Wallet balance fetch error]:', err);
    }

    renderUserWallet($container, user, balanceData);
  } catch (err) {
    console.error('[renderWalletPage error]:', err);
    $container.innerHTML = `
      <div class="empty-state" style="padding:4rem 1rem;text-align:center">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h3>تعذر تحميل بيانات المحفظة</h3>
        <p style="color:var(--text-muted)">حدث خطأ أثناء تحميل بيانات رصيدك، يرجى المحاولة مرة أخرى.</p>
        <button class="btn btn-primary" onclick="location.reload()" style="margin-top:1rem">إعادة المحاولة</button>
      </div>
    `;
  }
}

function renderGuestWallet($container) {
  $container.innerHTML = `
    <div class="container" style="max-width:760px;margin:24px auto;padding:0 16px">
      <!-- 3D Gold Coin Presentation -->
      <div class="coin-3d-scene">
        <div class="coin-3d">
          <div class="coin-face">
            <div class="coin-title-arc">DALIL GOLD COIN</div>
            <div class="coin-symbol">🪙</div>
            <div class="coin-sub-arc">دليل المنزلة والمطرية</div>
          </div>
          <div class="coin-face coin-face--back">
            <div class="coin-title-arc">DALIL GOLD COIN</div>
            <div class="coin-symbol">👑</div>
            <div class="coin-sub-arc">المنزلة والمطرية</div>
          </div>
        </div>
      </div>

      <div class="wallet-hero">
        <span class="wallet-hero__badge">✨ اقتصاد المنصة الرقمي</span>
        <h1 style="font-size:26px;font-weight:900;margin:0 0 10px;color:#fff">ذهبيات الدليل (Dalil Gold Coins)</h1>
        <p style="font-size:14px;color:rgba(255,255,255,0.8);max-width:540px;margin:0 auto 20px;line-height:1.6">
          العملة الرقمية الرسمية لدليل المنزلة والمطرية. استخدم ذهبياتك في تمييز أنشطتك، إعلانات الوظائف، وتوثيق ملفك التجاري بالعلامة الزرقاء الملكية.
        </p>
        <button type="button" class="wallet-btn-gold" id="btn-wallet-guest-login">
          <span>🔑 تسجيل الدخول لفتح محفظتك</span>
        </button>
      </div>

      <!-- Packages Preview -->
      <div class="wallet-sec-header">
        <h2 class="wallet-sec-title"><span>💰</span> باقات شحن العملات الذهبية</h2>
      </div>
      ${renderPackagesCardsHTML()}

      <!-- Services Preview -->
      <div class="wallet-sec-header">
        <h2 class="wallet-sec-title"><span>🌟</span> خدمات التمييز والتوثيق المتاحة</h2>
      </div>
      ${renderServicesGuideHTML()}
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
}

function renderUserWallet($container, user, balanceData) {
  const currentBalance = Number(balanceData.balance || 0);

  $container.innerHTML = `
    <div class="container" style="max-width:880px;margin:24px auto;padding:0 16px">

      <!-- 3D Gold Coin Visual -->
      <div class="coin-3d-scene">
        <div class="coin-3d" title="انقر لتثبيت / تحريك العملة">
          <div class="coin-face">
            <div class="coin-title-arc">DALIL GOLD COIN</div>
            <div class="coin-symbol">🪙</div>
            <div class="coin-sub-arc">دليل المنزلة والمطرية</div>
          </div>
          <div class="coin-face coin-face--back">
            <div class="coin-title-arc">DALIL GOLD COIN</div>
            <div class="coin-symbol">👑</div>
            <div class="coin-sub-arc">المنزلة والمطرية</div>
          </div>
        </div>
      </div>

      <!-- Hero Balance Card -->
      <div class="wallet-hero">
        <span class="wallet-hero__badge">🪙 محفظتي الرقمية المعتمدة</span>
        <div class="wallet-hero__balance-val">
          <span id="wallet-live-balance">${currentBalance.toLocaleString('ar-EG')}</span>
          <span style="font-size:32px">🪙</span>
        </div>
        <div class="wallet-hero__balance-label">رصيدك الحالي من ذهبيات الدليل</div>

        <div class="wallet-hero__actions">
          <a href="#packages-section" class="wallet-btn-gold">
            <span>⚡ شحن الرصيد الآن</span>
          </a>
          <a href="#transfer-section" class="wallet-btn-glass">
            <span>↗️ تحويل لصديق</span>
          </a>
          <button type="button" class="wallet-btn-glass" id="btn-refresh-balance">
            <span>🔄 تحديث الرصيد</span>
          </button>
        </div>
      </div>

      <!-- Packages Section -->
      <div class="wallet-sec-header" id="packages-section">
        <h2 class="wallet-sec-title">
          <span>💳</span>
          <span>باقات شحن ذهبيات الدليل</span>
        </h2>
        <span style="font-size:12px;color:var(--text-muted);font-weight:700">دفع فوري عبر فودافون كاش</span>
      </div>

      ${renderPackagesCardsHTML()}

      <!-- Vodafone Cash Form Box -->
      <div class="voda-box" id="vodafone-cash-box">
        <div class="voda-box__head">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="voda-badge">📱 فودافون كاش</span>
            <strong style="font-size:15px;color:var(--text-primary)">بيانات التحويل الرسمي المعتمد</strong>
          </div>
          <span style="font-size:11.5px;color:var(--text-muted);font-weight:700">تأكيد فوري خلال دقائق</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;margin-bottom:16px">
          <!-- Number Card -->
          <div class="voda-info-card">
            <div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:2px">رقم محفظة فودافون كاش للتحويل:</div>
              <div class="voda-number" id="voda-phone-display">01279934735</div>
            </div>
            <button type="button" class="btn-copy" id="btn-copy-voda-phone" data-copy="01279934735">
              <span>📋 نسخ الرقم</span>
            </button>
          </div>

          <!-- Name Card -->
          <div class="voda-info-card">
            <div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:2px">اسم صاحب المحفظة المستلم:</div>
              <div style="font-size:18px;font-weight:900;color:var(--text-primary)" id="voda-name-display">محمد نصر</div>
            </div>
            <button type="button" class="btn-copy" id="btn-copy-voda-name" data-copy="محمد نصر">
              <span>📋 نسخ الاسم</span>
            </button>
          </div>
        </div>

        <!-- Purchase Submission Form -->
        <form id="form-coin-purchase" style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px">
          <div style="font-weight:900;font-size:14px;margin-bottom:12px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
            <span>📝</span>
            <span>تأكيد التحويل وإرسال الإيصال للشحن الفوري</span>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:12px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:800;font-size:12.5px">الباقة المختارة <span style="color:#ef4444">*</span></label>
              <select class="form-select" id="purchase-package-select" name="package" required style="width:100%;font-weight:700">
                <option value="500-100">500 ذهبية — 100 ج.م</option>
                <option value="1000-190" selected>1,000 ذهبية — 190 ج.م (توفير 10 ج)</option>
                <option value="2000-350">2,000 ذهبية — 350 ج.م (توفير 50 ج ⭐)</option>
                <option value="5000-850">5,000 ذهبية — 850 ج.م (باقة التوثيق 👑)</option>
                <option value="7000-1000">7,000 ذهبية — 1,000 ج.م (العرض الأكبر 🔥)</option>
              </select>
            </div>

            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:800;font-size:12.5px">رقم المحفظة التي قمت بالتحويل منها <span style="color:#ef4444">*</span></label>
              <input type="tel" class="form-input" id="purchase-sender-phone" name="senderPhone" placeholder="01xxxxxxxxx" required pattern="^01[0125][0-9]{8}$" style="direction:ltr;text-align:right" />
            </div>
          </div>

          <!-- Receipt Upload -->
          <div class="form-group" style="margin-bottom:14px">
            <label class="form-label" style="font-weight:800;font-size:12.5px">صورة سكرين شوت أو إيصال التحويل <span style="color:#ef4444">*</span></label>
            <input type="file" id="purchase-receipt-file" accept="image/*" class="form-input" required />
            <small style="color:var(--text-muted);font-size:11px;display:block;margin-top:4px">
              📸 التقط صورة أو لقطة شاشة لرسالة تأكيد التحويل من تطبيق فودافون كاش أو رسالة SMS
            </small>
            <div id="receipt-preview-wrap" style="display:none;margin-top:10px;text-align:center">
              <img id="receipt-preview-img" src="" alt="معاينة الإيصال" style="max-height:160px;border-radius:10px;border:1.5px solid var(--border);box-shadow:0 2px 10px rgba(0,0,0,0.1)" />
            </div>
          </div>

          <button type="submit" class="wallet-btn-gold" id="btn-submit-purchase" style="width:100%;justify-content:center;font-size:15px">
            <span>✅ إرسال إشعار التحويل وشحن الرصيد</span>
          </button>
        </form>
      </div>

      <!-- P2P Coin Transfer Section -->
      <div class="wallet-sec-header" id="transfer-section">
        <h2 class="wallet-sec-title">
          <span>🤝</span>
          <span>تحويل ذهبيات الدليل من شخص لآخر</span>
        </h2>
        <span style="font-size:12px;color:var(--text-muted);font-weight:700">تحويل فوري بدون رسوم</span>
      </div>

      <div class="wallet-transfer-box">
        <form id="form-p2p-transfer">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:14px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:800;font-size:12.5px">رقم هاتف أو بريد المستلم <span style="color:#ef4444">*</span></label>
              <input type="text" class="form-input" id="transfer-recipient-input" placeholder="01xxxxxxxxx أو user@gmail.com" required />
            </div>

            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:800;font-size:12.5px">عدد العملات الذهبية للتحويل <span style="color:#ef4444">*</span></label>
              <input type="number" class="form-input" id="transfer-amount-input" min="10" max="50000" placeholder="الحد الأدنى 10 ذهبيات" required />
            </div>
          </div>

          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label" style="font-weight:800;font-size:12.5px">ملاحظة أو رسالة إهداء (اختياري)</label>
            <input type="text" class="form-input" id="transfer-note-input" placeholder="مثال: شكر وتقدير / تمييز إعلان / دعم" maxlength="150" />
          </div>

          <button type="submit" class="btn btn-primary" id="btn-submit-transfer" style="width:100%;padding:12px;font-weight:900;border-radius:12px">
            <span>↗️ تأكيد وتحويل العملات فوراً</span>
          </button>
        </form>
      </div>

      <!-- Services & Pricing Catalog -->
      <div class="wallet-sec-header">
        <h2 class="wallet-sec-title">
          <span>🌟</span>
          <span>خدمات وأسعار التمييز بالعملات الذهبية</span>
        </h2>
      </div>

      ${renderServicesGuideHTML()}

      <!-- Non-Refundable Policy Alert -->
      <div class="wallet-policy-alert">
        <span style="font-size:24px;line-height:1">⚠️</span>
        <div style="font-size:12.5px;line-height:1.6">
          <strong style="display:block;font-size:13.5px;margin-bottom:2px">تأكيد هام وقاطع لجميع المستخدمين:</strong>
          العملات الذهبية المستخدمة في تمييز الأنشطة أو الوظائف أو التوثيق <strong>غير قابلة للاسترداد نهائياً وأبداً</strong> بعد تفعيل أي إعلان أو تعديل بياناته أو حذفه من قبل صاحب الشأن.
        </div>
      </div>

      <!-- Transaction & Request History -->
      <div class="wallet-sec-header">
        <h2 class="wallet-sec-title">
          <span>📜</span>
          <span>سجل المعاملات والشحن</span>
        </h2>
      </div>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow-x:auto;padding:8px">
        ${renderHistoryHTML(balanceData)}
      </div>

    </div>
  `;

  bindWalletEvents($container, user, balanceData);
}

function renderPackagesCardsHTML() {
  const packages = [
    { coins: 500, price: 100, tag: '', savings: '' },
    { coins: 1000, price: 190, tag: 'شائعة', savings: 'وفر 10 ج' },
    { coins: 2000, price: 350, tag: 'الأكثر طلباً ⭐', savings: 'وفر 50 ج', featured: true },
    { coins: 5000, price: 850, tag: 'باقة التوثيق 👑', savings: 'وفر 150 ج' },
    { coins: 7000, price: 1000, tag: 'العرض الأكبر 🔥', savings: 'وفر 400 ج' }
  ];

  return `
    <div class="wallet-packages-grid">
      ${packages.map(p => `
        <div class="wallet-pkg-card ${p.featured ? 'wallet-pkg-card--featured' : ''}">
          ${p.tag ? `<span class="wallet-pkg-tag">${p.tag}</span>` : ''}
          <div class="wallet-pkg-coins">
            <span>${p.coins.toLocaleString('ar-EG')}</span>
            <span style="font-size:22px">🪙</span>
          </div>
          <div class="wallet-pkg-coins-label">عملة ذهبية</div>
          <div class="wallet-pkg-price">${p.price} ج.م</div>
          ${p.savings ? `<div class="wallet-pkg-savings">🎁 ${p.savings}</div>` : '<div style="height:22px"></div>'}
          <button type="button" class="wallet-pkg-btn btn-select-package" data-coins="${p.coins}" data-price="${p.price}">
            <span>شحن الباقة ↤</span>
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderServicesGuideHTML() {
  return `
    <div class="wallet-services-grid">
      <div class="wallet-srv-card" style="border-color:#38BDF8">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">👑 توثيق المكان بالعلامة الزرقاء</h3>
          <span class="wallet-srv-card__cost">5,000 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: مدى الحياة (دائم)</div>
        <p style="font-size:12px;color:var(--text-muted);margin:0;line-height:1.5">
          توثيق رسمي يمنح نشاطك الشارة الملكية الزرقاء وإشعار فوري لجميع متابعي المنصة وظهور في صدارة البحث.
        </p>
      </div>

      <div class="wallet-srv-card" style="border-color:#F5A623">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">🌟 تمييز المكان كإعلان مميز</h3>
          <span class="wallet-srv-card__cost">500 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: شهر كامل (30 يوماً)</div>
        <p style="font-size:12px;color:var(--text-muted);margin:0;line-height:1.5">
          تصعيد المكان في القسم المخصص للإعلانات المميزة بالصفحة الرئيسية وتصنيفه بالأولوية الذهبية.
        </p>
      </div>

      <div class="wallet-srv-card" style="border-color:#10B981">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">💼 تمييز طالب عمل (كادر محلي)</h3>
          <span class="wallet-srv-card__cost">500 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: 3 أيام</div>
        <p style="font-size:12px;color:var(--text-muted);margin:0;line-height:1.5">
          عرض سيرتك الذاتية في بطاقات الأماكن الدوارة والصفحة الرئيسية بأولوية مطلقة لأصحاب العمل.
        </p>
      </div>

      <div class="wallet-srv-card" style="border-color:#6366F1">
        <div class="wallet-srv-card__head">
          <h3 class="wallet-srv-card__title">📢 تمييز فرصة عمل شاغرة</h3>
          <span class="wallet-srv-card__cost">500 ذهبية</span>
        </div>
        <div class="wallet-srv-card__duration">المدة: 3 أيام</div>
        <p style="font-size:12px;color:var(--text-muted);margin:0;line-height:1.5">
          إبراز الوظيفة الشاغرة في صدارة لوحة الوظائف وبطاقات الأماكن لإيجاد الموظف المطلوب بسرعة قياسية.
        </p>
      </div>
    </div>
  `;
}

function renderHistoryHTML(balanceData) {
  const history = balanceData.history || [];
  const purchases = balanceData.purchases || [];

  if (history.length === 0 && purchases.length === 0) {
    return `<div style="text-align:center;padding:32px 16px;color:var(--text-muted);font-size:13.5px">لا توجد معاملات سابقة حتى الآن. ابدأ بشحن رصيدك واستمتع بالخدمات!</div>`;
  }

  return `
    <table class="wallet-history-table">
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>البيان والنوع</th>
          <th>القيمة</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${purchases.map(p => {
          const statusLabels = {
            pending: '<span class="badge" style="background:rgba(245,166,35,0.15);color:#D97706;padding:2px 8px;border-radius:6px;font-weight:800">⏳ قيد المراجعة</span>',
            approved: '<span class="badge" style="background:rgba(16,185,129,0.15);color:#10B981;padding:2px 8px;border-radius:6px;font-weight:800">✅ تم الشحن</span>',
            rejected: '<span class="badge" style="background:rgba(239,68,68,0.15);color:#EF4444;padding:2px 8px;border-radius:6px;font-weight:800">❌ مرفوض</span>'
          };
          const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
          return `
            <tr>
              <td style="color:var(--text-muted);font-size:12px">${dateStr}</td>
              <td>
                <div style="font-weight:800;color:var(--text-primary)">شحن ${p.package_coins} ذهبية</div>
                <div style="font-size:11px;color:var(--text-muted)">فودافون كاش (${p.amount_egp} ج.م) • من: ${p.vodafone_sender_number || ''}</div>
              </td>
              <td style="font-weight:900;color:#10B981">+${p.package_coins} 🪙</td>
              <td>${statusLabels[p.status] || p.status}</td>
            </tr>
          `;
        }).join('')}

        ${history.map(h => {
          const isPositive = Number(h.amount) > 0;
          const dateStr = h.created_at ? new Date(h.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
          return `
            <tr>
              <td style="color:var(--text-muted);font-size:12px">${dateStr}</td>
              <td>
                <div style="font-weight:700;color:var(--text-primary)">${escHtml(h.label || h.rule_key || 'معاملة')}</div>
              </td>
              <td style="font-weight:900;color:${isPositive ? '#10B981' : '#EF4444'}">
                ${isPositive ? '+' : ''}${h.amount} 🪙
              </td>
              <td><span style="color:#10B981;font-size:12px;font-weight:700">مكتملة</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function bindWalletEvents($container, user, balanceData) {
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

  // 2. Select Package from Grid
  $container.querySelectorAll('.btn-select-package').forEach(btn => {
    btn.addEventListener('click', () => {
      const coins = btn.getAttribute('data-coins');
      const price = btn.getAttribute('data-price');
      const select = document.getElementById('purchase-package-select');
      if (select) {
        const targetVal = `${coins}-${price}`;
        select.value = targetVal;
        const box = document.getElementById('vodafone-cash-box');
        if (box) {
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          box.style.transition = 'outline 0.3s';
          box.style.outline = '3px solid #F5A623';
          setTimeout(() => { box.style.outline = 'none'; }, 1500);
        }
      }
    });
  });

  // 3. Receipt Preview Handler
  const fileInput = document.getElementById('purchase-receipt-file');
  const previewWrap = document.getElementById('receipt-preview-wrap');
  const previewImg = document.getElementById('receipt-preview-img');

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImg && previewWrap) {
          previewImg.src = e.target.result;
          previewWrap.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // 4. Submit Purchase Request Form
  const formPurchase = document.getElementById('form-coin-purchase');
  formPurchase?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-purchase');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري رفع الإيصال والتحقق...</span>';
    }

    try {
      const selectVal = document.getElementById('purchase-package-select')?.value || '1000-190';
      const [coinsStr, priceStr] = selectVal.split('-');
      const coins = parseInt(coinsStr, 10);
      const price = parseInt(priceStr, 10);
      const senderPhone = (document.getElementById('purchase-sender-phone')?.value || '').trim();
      const file = fileInput?.files?.[0];

      if (!file) throw new Error('يرجى اختيار صورة إيصال التحويل');
      if (!/^01[0125][0-9]{8}$/.test(senderPhone)) {
        throw new Error('يرجى إدخال رقم هاتف فودافون كاش مصري صحيح (11 رقم)');
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
        vodafoneSenderNumber: senderPhone,
        receiptUrl
      }, token);

      if (purchaseRes.success) {
        showModal({
          title: '🎉 تم إرسال طلب الشحن بنجاح',
          content: `
            <div style="text-align:center;padding:16px">
              <div style="font-size:48px;margin-bottom:10px">🪙</div>
              <h3 style="font-weight:900;color:#10B981;margin-bottom:8px">طلب شحن ${coins.toLocaleString('ar-EG')} ذهبية قيد المراجعة</h3>
              <p style="font-size:13.5px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">
                تم استلام إيصالك بنجاح من الرقم (${senderPhone}). سيتم مراجعة التحويل من قبل الإدارة وإيداع الذهبيات في محفظتك خلال دقائق معدودة!
              </p>
              <div style="background:var(--surface-2);border-radius:10px;padding:10px;font-size:12px;color:var(--text-primary)">
                كود الطلب: <code>${purchaseRes.purchaseId}</code>
              </div>
            </div>
          `,
          buttons: [{
            label: 'رائع، شكراً لك',
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
        btnSubmit.innerHTML = '<span>✅ إرسال إشعار التحويل وشحن الرصيد</span>';
      }
    }
  });

  // 5. P2P Transfer Submit
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

    if (!confirm(`هل أنت متأكد من رغبتك في تحويل ${amount} ذهبية إلى (${recipient})؟\n\nالعملية فورية ولا يمكن الرجوع عنها.`)) {
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>جاري إتمام التحويل...</span>';
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

  // 6. Refresh balance button
  document.getElementById('btn-refresh-balance')?.addEventListener('click', () => {
    location.reload();
  });
}
