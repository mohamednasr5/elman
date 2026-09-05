/**
 * المنزلة وناسها — Contact & Partner Advertising Page
 * Interactive, richly animated, and high-converting contact page
 * for advertising, official verification, and inquiries.
 * Dispatches directly to elfannanm@gmail.com + mohamednasrofficial@gmail.com
 * and syncs to Firebase Realtime Database.
 */

import { getSettings, dbPush, serverTimestamp } from '../../core/db.js';
import { toast } from '../components/Toast.js';
import { MANZALA_VILLAGES_LIST } from '../../utils/maps.js';

/* ── Topic registry (single source of truth) ─────────────────── */
const TOPICS = {
  verification: {
    icon: '🛡️',
    title: 'توثيق حساب أو مكان',
    desc: 'الشارة الرسمية المعتمدة لحماية اسمك ونشاطك',
    hint: 'سنعطي طلبك أولوية مراجعة خاصة للتوثيق 🛡️',
    emailLabel: 'طلب توثيق حساب أو مكان بالعلامة المعتمدة',
    msgLabel: 'بيانات التوثيق وإثبات ملكية النشاط',
    placeholder: 'اكتب اسم المحل أو النشاط أو العيادة بالضبط، وصفحات التواصل التي ترغب في ربطها بالتوثيق...'
  },
  ads: {
    icon: '📢',
    title: 'إعلان على الدليل',
    desc: 'ظهور مميز في قمة الموقع والتطبيق لكل أهل المنطقة',
    hint: 'أعلى معدل ظهور ونقرات لأهل المنزلة والمطرية 📢',
    emailLabel: 'إعلان على الدليل وترويج مدفوع',
    msgLabel: 'تفاصيل الإعلان والميزانية أو المدة المقترحة',
    placeholder: 'أخبرنا عن نوع الإعلان الذي تريده (إعلان قمة الموقع، شريط إعلاني، ترويج صفحة مكانك) والمدة المقترحة...'
  },
  showcase: {
    icon: '🔥',
    title: 'ظهور منتجات وعروض',
    desc: 'أبرز منتجاتك وخصوماتك أولاً لكل المتابعين',
    hint: 'عروضك ستظهر أولاً لكل متابعي المنطقة 🔥',
    emailLabel: 'طلب ظهور المنتجات والعروض الحصرية',
    msgLabel: 'تفاصيل العروض والمنتجات المراد إبرازها',
    placeholder: 'ما هي المنتجات أو العروض الترويجية والخصومات التي ترغب في إبرازها لأهالي المنزلة والمطرية؟...'
  },
  inquiry: {
    icon: '💬',
    title: 'استفسارات عامة',
    desc: 'أي سؤال حول المنصة والخدمات والأماكن',
    hint: 'فريق الدعم يرد خلال أقل من ساعتين 💬',
    emailLabel: 'استفسارات عامة حول الدليل',
    msgLabel: 'نص الاستفسار والتفاصيل',
    placeholder: 'اكتب استفسارك بالتفصيل وسنرد عليك في أقرب وقت...'
  },
  suggestion: {
    icon: '💡',
    title: 'اقتراح لتطوير المنصة',
    desc: 'شاركنا أفكارك لتطوير الدليل لخدمة أهل المنطقة',
    hint: 'كل اقتراح يصل مباشرة للإدارة التنفيذية 💡',
    emailLabel: 'اقتراح أو فكرة لتطوير المنصة',
    msgLabel: 'نص الاقتراح والتفاصيل',
    placeholder: 'شاركنا فكرتك أو اقتراحك لتطوير المنصة بالتفصيل...'
  },
  complaint: {
    icon: '⚠️',
    title: 'شكوى أو بلاغ',
    desc: 'أبلغنا عن أي مشكلة أو محتوى مخالف بسرية تامة',
    hint: 'بلاغاتك تُتعامل بسرية تامة وعاجلة ⚠️',
    emailLabel: 'شكوى أو بلاغ عن نشاط أو محتوى',
    msgLabel: 'نص الشكوى أو تفاصيل البلاغ',
    placeholder: 'اشرح لنا المشكلة أو البلاغ بالتفصيل لنقوم بالتحقق العاجل واتخاذ اللازم فوراً...'
  }
};

const TOPIC_ORDER = ['verification', 'ads', 'showcase', 'inquiry', 'suggestion', 'complaint'];

export async function renderContactPage($container, { user } = {}) {
  const settings = await getSettings().catch(() => ({}));
  const waLink = settings?.contact?.whatsappLink || 'https://wa.me/wasendernew';

  const topicOptionsHtml = TOPIC_ORDER.map(key => {
    const t = TOPICS[key];
    return `
      <button type="button" class="cq-option cq-option--${key}" role="option" data-topic="${key}">
        <span class="cq-option__icon">${t.icon}</span>
        <span class="cq-option__text">
          <span class="cq-option__title">${t.title}</span>
          <span class="cq-option__desc">${t.desc}</span>
        </span>
        <span class="cq-option__check">✓</span>
      </button>`;
  }).join('');

  $container.innerHTML = `
    <!-- ═══════════════════════════════════════════════════════════
         1. HERO SECTION (الواجهة البصرية الإبداعية الفاخرة — بدون أي أرقام)
         ═══════════════════════════════════════════════════════════ -->
    <section class="cx-hero">
      <div class="cx-hero__bg" aria-hidden="true">
        <div class="cx-orb cx-orb--1"></div>
        <div class="cx-orb cx-orb--2"></div>
        <div class="cx-orb cx-orb--3"></div>
        <div class="cx-grid-overlay"></div>
        <div class="cx-sparkles" id="cx-sparkles"></div>
      </div>

      <div class="cx-hero__content">
        <div class="cx-hero__badge reveal">
          <span class="cx-hero__badge-spark">✨</span>
          <span>المنصة الرقمية الأولى في المنزلة والمطرية ومحيطهما</span>
        </div>

        <h1 class="cx-hero__title reveal" style="--rd:90ms">
          طوّر نشاطك، وثّق مكانك،
          <br/>
          وضاعف <span class="cx-gradient-text">مبيعاتك وأرباحك</span>
        </h1>

        <p class="cx-hero__desc reveal" style="--rd:180ms">
          تواصل مباشر مع إدارة «دليل المنزلة والمطرية الرقمي». احصل على مكانة الصدارة في البحث،
          وشارة التوثيق الرسمية، وانقل عروضك ومنتجاتك لكل هاتف ومنزل في المنطقة.
        </p>

        <div class="cx-hero__actions reveal" style="--rd:270ms">
          <a href="#contact-form-section" id="cx-hero-cta" class="cx-btn cx-btn--gold">
            <span class="cx-btn__shine" aria-hidden="true"></span>
            <span class="cx-btn__ico">🚀</span>
            <span>ابدأ طلب الإعلان أو التوثيق</span>
          </a>
          <a href="${escAttr(waLink)}" target="_blank" rel="noopener" class="cx-btn cx-btn--wa">
            <span class="cx-btn__ico">💬</span>
            <span>محادثة واتساب فورية</span>
          </a>
        </div>

        <div class="cx-hero__trust reveal" style="--rd:360ms">
          <span class="cx-trust-pill">⭐ ثقة أهل المنطقة</span>
          <span class="cx-trust-dot"></span>
          <span class="cx-trust-pill">⚡ رد خلال ساعات</span>
          <span class="cx-trust-dot"></span>
          <span class="cx-trust-pill">🔒 سرية تامة</span>
        </div>
      </div>
    </section>

    <div class="container" style="max-width:1100px;margin:0 auto;padding:0 16px">
      
      <!-- ═══════════════════════════════════════════════════════════
           2. THREE PILLARS (البطاقات الثلاث الكبرى للمميزات والخدمات)
           ═══════════════════════════════════════════════════════════ -->
      <section class="pillars-grid">
        
        <!-- Pillar 1: Top Sponsored Ads -->
        <div class="pillar-card pillar-card--sponsor">
          <div class="pillar-icon-box" style="color:#F5A623">📢</div>
          <div style="font-size:11.5px;font-weight:900;color:#FCD34D;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase">
            الأكثر تأثيراً ومبيعات ⭐
          </div>
          <h2 class="pillar-title">الإعلان والترويج المدفوع</h2>
          <p class="pillar-desc">
            اجعل نشاطك أول ما يراه الزائر فور فتح الموقع أو التطبيق في صدارة شريط الإعلانات الذهبي، لزيادة مبيعاتك واتصالات عملائك.
          </p>
          <ul class="pillar-list">
            <li><span class="bullet-icon">✦</span><span>ظهور دائم ومثبت في قمة كل الصفحات ونتائج البحث.</span></li>
            <li><span class="bullet-icon">✦</span><span>شارة إعلان ذهبية مميزة تجذب انتباه الزبائن فوراً.</span></li>
            <li><span class="bullet-icon">✦</span><span>توجيه مباشر وسريع لرقم هاتفك ومحادثة الواتساب.</span></li>
            <li><span class="bullet-icon">✦</span><span>معدل نقرات وظهور يفوق الأماكن العادية بأكثر من 4 أضعاف.</span></li>
          </ul>
          <button type="button" class="btn btn-primary btn-block btn-select-topic" data-topic="ads" style="background:#F5A623;border-color:#F5A623;color:#0B1E30;font-weight:900;border-radius:10px;padding:12px">
            طلب إعلان مميز 📢
          </button>
        </div>

        <!-- Pillar 2: Account Verification -->
        <div class="pillar-card pillar-card--verify">
          <div class="pillar-icon-box" style="color:#38BDF8">🛡️</div>
          <div style="font-size:11.5px;font-weight:900;color:#38BDF8;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase">
            الثقة وحماية الهوية ✓
          </div>
          <h2 class="pillar-title">توثيق حسابك ومكانك</h2>
          <p class="pillar-desc">
            احصل على العلامة المعتمدة الرسمية لاسم نشاطك التجاري أو المهني، واحمِ علامتك واسمك من أي انتحال أو تزييف بالمنطقة.
          </p>
          <ul class="pillar-list">
            <li><span class="bullet-icon">✦</span><span>شارة التحقق الزرقاء/الذهبية الرسمية بجوار اسمك.</span></li>
            <li><span class="bullet-icon">✦</span><span>صلاحية حصرية لإضافة المنتجات والخدمات وقوائم الأسعار.</span></li>
            <li><span class="bullet-icon">✦</span><span>أولوية الترتيب في البحث والظهور للأماكن الموثقة.</span></li>
            <li><span class="bullet-icon">✦</span><span>حماية ملكية كاملة برقم هاتفك وحسابك المسجل.</span></li>
          </ul>
          <button type="button" class="btn btn-primary btn-block btn-select-topic" data-topic="verification" style="background:#0284C7;border-color:#0284C7;color:#fff;font-weight:900;border-radius:10px;padding:12px">
            طلب توثيق المكان 🛡️
          </button>
        </div>

        <!-- Pillar 3: Products & Offers Showcase -->
        <div class="pillar-card pillar-card--showcase">
          <div class="pillar-icon-box" style="color:#10B981">🔥</div>
          <div style="font-size:11.5px;font-weight:900;color:#34D399;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase">
            تنشيط المبيعات الحصرية 🛍️
          </div>
          <h2 class="pillar-title">ظهور منتجاتك وعروضك</h2>
          <p class="pillar-desc">
            انشر خصوماتك وتخفيضاتك لتظهر أولاً في قسم العروض والمنتجات الحصرية لكل سكان المنزلة والمطرية والمراكز المجاورة.
          </p>
          <ul class="pillar-list">
            <li><span class="bullet-icon">✦</span><span>ظهور بارز في شاشات العروض اليومية وصفحة عروض الدليل.</span></li>
            <li><span class="bullet-icon">✦</span><span>إشعارات تنبيهية للمتابعين والمهتمين فور إضافة أي عرض.</span></li>
            <li><span class="bullet-icon">✦</span><span>كتالوج منتجات احترافي بأسعارك وصورك بضغطة زر.</span></li>
            <li><span class="bullet-icon">✦</span><span>وصول سريع ومباشر للزبائن الجاهزين للشراء فوراً.</span></li>
          </ul>
          <button type="button" class="btn btn-primary btn-block btn-select-topic" data-topic="showcase" style="background:#10B981;border-color:#10B981;color:#fff;font-weight:900;border-radius:10px;padding:12px">
            إبراز المنتجات والعروض 🔥
          </button>
        </div>

      </section>

      <!-- ═══════════════════════════════════════════════════════════
           3. LIVE STATS STRIP (شريط أرقام الثقة والتفاعل الحقيقي)
           ═══════════════════════════════════════════════════════════ -->
      <section class="contact-stats-strip">
        <div class="contact-stat-item">
          <div class="contact-stat-val">+50,000</div>
          <div class="contact-stat-lbl">مشاهدة وتفاعل شهرياً بالمنطقة</div>
        </div>
        <div class="contact-stat-item">
          <div class="contact-stat-val">+1,000</div>
          <div class="contact-stat-lbl">نشاط تجاري وعيادة ومهنة مسجلة</div>
        </div>
        <div class="contact-stat-item">
          <div class="contact-stat-val">100%</div>
          <div class="contact-stat-lbl">استهداف محلي للمنزلة والمطرية وقراهما</div>
        </div>
        <div class="contact-stat-item">
          <div class="contact-stat-val">أقل من ساعتين</div>
          <div class="contact-stat-lbl">متوسط سرعة الرد والمتابعة الفورية</div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           4. FEATURES MATRIX (لماذا الشراكة مع دليل المنزلة والمطرية؟)
           ═══════════════════════════════════════════════════════════ -->
      <section style="margin-bottom:60px">
        <div style="text-align:center;margin-bottom:32px">
          <h2 style="font-size:clamp(1.5rem,3vw,2rem);font-weight:900;color:var(--text-primary);margin-bottom:10px">
            لماذا يختار التجار والأطباء وأصحاب المهن دليل المنزلة والمطرية؟
          </h2>
          <p style="color:var(--text-muted);max-width:650px;margin:0 auto;line-height:1.6">
            نوفر لك بيئة تسويقية رقمية متطورة مصممة خصيصاً لتناسب مجتمعنا المحلي وتضمن لك أعلى عائد حقيقي على نشاطك.
          </p>
        </div>

        <div class="features-matrix-grid">
          <div class="feature-box">
            <div class="feature-box__icon">⚡</div>
            <div>
              <h3 class="feature-box__title">تطبيق وموقع فائق السرعة</h3>
              <p class="feature-box__desc">واجهة خفيفة جداً تفتح في أجزاء من الثانية وتعمل حتى في حال ضعف الاتصال بشبكة الإنترنت.</p>
            </div>
          </div>

          <div class="feature-box">
            <div class="feature-box__icon">🤖</div>
            <div>
              <h3 class="feature-box__title">بحث ذكي باللهجة المحلية</h3>
              <p class="feature-box__desc">محرك بحث متقدم يفهم مسميات أهل المنزلة والمطرية وتفاصيل المهن والعيادات بدقة تامة.</p>
            </div>
          </div>

          <div class="feature-box">
            <div class="feature-box__icon">🗺️</div>
            <div>
              <h3 class="feature-box__title">ربط دقيق بخرائط Google</h3>
              <p class="feature-box__desc">توجيه الزبائن والمشترين مباشرة إلى موقع محلك أو عيادتك بضغطة زر دون إرهاقهم في السؤال.</p>
            </div>
          </div>

          <div class="feature-box">
            <div class="feature-box__icon">🔔</div>
            <div>
              <h3 class="feature-box__title">إشعارات Push لكل الهواتف</h3>
              <p class="feature-box__desc">تنبيهات فورية ومباشرة ترسل لأهالي المنطقة عند إطلاق عروضك أو فعالياتك التجارية الجديدة.</p>
            </div>
          </div>

          <div class="feature-box">
            <div class="feature-box__icon">📊</div>
            <div>
              <h3 class="feature-box__title">إحصائيات شفافة ومباشرة</h3>
              <p class="feature-box__desc">تابع كم شخص شاهد صفحتك، كم شخص اتصل بك، ومن أي منطقة وصلك الزبون بكل وضوح.</p>
            </div>
          </div>

          <div class="feature-box">
            <div class="feature-box__icon">🤝</div>
            <div>
              <h3 class="feature-box__title">فريق دعم محلي يقف بجانبك</h3>
              <p class="feature-box__desc">فريق عمل متواجد معك بالمنزلة والمطرية يساعدك في التصوير، التنسيق، وتحديث بياناتك في أي وقت.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           5. VIP DIRECT WHATSAPP BANNER (تواصل مباشر سريع)
           ═══════════════════════════════════════════════════════════ -->
      <section style="margin-bottom:60px">
        <div style="background:linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%);border-radius:20px;padding:36px 28px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;box-shadow:0 12px 30px rgba(6,78,59,0.25);border:1px solid rgba(52,211,153,0.3)">
          <div style="display:flex;align-items:center;gap:18px">
            <div style="width:64px;height:64px;border-radius:50%;background:#10B981;display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 0 25px rgba(16,185,129,0.5);flex-shrink:0">
              💬
            </div>
            <div>
              <h2 style="font-size:1.4rem;font-weight:900;margin-bottom:6px;color:#fff">
                هل تفضل المحادثة المباشرة عبر WhatsApp فوراً؟
              </h2>
              <p style="color:#D1FAE5;font-size:0.95rem;margin:0;line-height:1.5">
                تواصل الآن مع مسؤول إدارة المنصة لمناقشة تفاصيل إعلانك أو توثيق حسابك في محادثة مباشرة وسريعة.
              </p>
            </div>
          </div>

          <div>
            <a href="${escAttr(waLink)}" target="_blank" rel="noopener" class="btn btn-lg" style="background:#fff;color:#065F46;font-weight:900;padding:14px 28px;border-radius:12px;display:inline-flex;align-items:center;gap:10px;box-shadow:0 4px 15px rgba(0,0,0,0.15)">
              <span style="font-size:20px">🟢</span>
              <span>فتح محادثة WhatsApp الآن</span>
            </a>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           6. INTERACTIVE CONTACT & REQUEST FORM (الفورم المزدوج الذكي)
           ═══════════════════════════════════════════════════════════ -->
      <section id="contact-form-section" style="margin-bottom:80px">
        <div class="contact-form-card">
          
          <div style="text-align:center;margin-bottom:28px">
            <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(2,132,199,0.1);color:#0284C7;font-weight:800;font-size:13px;padding:4px 14px;border-radius:9999px;margin-bottom:12px">
              <span>✍️</span>
              <span>نموذج التواصل وطلبات الإدارة</span>
            </div>
            <h2 style="font-size:1.6rem;font-weight:900;color:var(--text-primary);margin-bottom:8px">
              أرسل رسالتك أو طلبك إلى إدارة الدليل مباشرة
            </h2>
            <p style="color:var(--text-muted);font-size:0.92rem;max-width:560px;margin:0 auto;line-height:1.6">
              يصل بريدك فوراً إلى الإدارة التنفيذية للمنصة مع إشعار بالبريد الإلكتروني، وسيتم الرد عليك في غضون وقت قصير.
            </p>
          </div>

            <!-- هدف الرسالة: قائمة منسدلة فاخرة متحركة -->
            <div class="form-group" style="margin-bottom:20px">
              <label class="form-label cx-label" style="font-weight:800;font-size:14px;margin-bottom:8px">
                هدف الرسالة <span class="required">*</span>
              </label>
              <div class="cq-select" id="cq-topic-select">
                <button type="button" class="cq-select__trigger" id="cq-topic-trigger"
                        aria-haspopup="listbox" aria-expanded="false" aria-controls="cq-topic-panel">
                  <span class="cq-select__icon" id="cq-topic-icon">📩</span>
                  <span class="cq-select__value is-placeholder" id="cq-topic-value">اختر هدف رسالتك من القائمة...</span>
                  <span class="cq-select__chevron" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                </button>
                <div class="cq-select__panel" id="cq-topic-panel" role="listbox" aria-label="هدف الرسالة">
                  <div class="cq-select__panel-head">اختر نوع طلبك ✨</div>
                  ${topicOptionsHtml}
                </div>
              </div>
              <div class="cq-select__hint" id="cq-topic-hint">اختر الهدف وسنخصص نموذج الرسالة تلقائياً ليناسب طلبك ✨</div>
            </div>

          <!-- The Form -->
          <form id="contact-master-form" style="display:flex;flex-direction:column;gap:18px">
            <input type="hidden" id="cf-selected-topic" value="" />

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:700">الاسم بالكامل <span class="required">*</span></label>
                <input type="text" id="cf-name" class="form-input" placeholder="اكتب اسمك الكريم..." required value="${escAttr(user?.name || '')}" style="font-size:14px" />
              </div>

              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:700">رقم الهاتف / الواتساب للتواصل <span class="required">*</span></label>
                <input type="tel" id="cf-phone" class="form-input" placeholder="010XXXXXXXX أو 011/012/015..." required value="${escAttr(user?.phone || '')}" style="direction:ltr;text-align:right;font-size:14px" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-weight:700">البريد الإلكتروني (اختياري)</label>
                <input type="email" id="cf-email" class="form-input" placeholder="name@example.com" value="${escAttr(user?.email || '')}" style="direction:ltr;font-size:14px" />
              </div>

              <div class="form-group" style="margin:0" id="cf-place-group">
                <label class="form-label" style="font-weight:700" id="cf-place-label">اسم المكان أو النشاط التجاري (إن وجد)</label>
                <input type="text" id="cf-place-name" class="form-input" placeholder="مثال: مطعم كذا، صيدلية كذا، دكتور فلان..." style="font-size:14px" />
              </div>
            </div>

            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:700">المدينة أو القرية داخل المنزلة / المطرية <span class="required">*</span></label>
              <select id="cf-area" class="form-select" style="font-size:14px">
                ${MANZALA_VILLAGES_LIST.map(v => `<option value="${escAttr(v)}">📍 ${v}</option>`).join('')}
                <option value="other">✏️ قرية أو منطقة أخرى مجاورة...</option>
              </select>
              <div id="cf-custom-area-wrapper" style="margin-top:8px;display:none">
                <input type="text" id="cf-custom-area" class="form-input" placeholder="اكتب اسم قريتك أو منطقتك هنا..." style="font-size:13px" />
              </div>
            </div>

            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-weight:700" id="cf-message-label">
                تفاصيل الطلب أو نص الرسالة <span class="required">*</span>
              </label>
              <textarea id="cf-message" class="form-textarea" rows="4" required placeholder="اكتب تفاصيل طلبك للإعلان، أو نوع التوثيق المطلوب، أو أي استفسار تريده بالتفصيل..." style="font-size:14px;line-height:1.6"></textarea>
            </div>

            <div style="background:rgba(2,132,199,0.06);border:1px solid rgba(2,132,199,0.2);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text-secondary)">
              <span style="font-size:18px">🛡️</span>
              <span>
                خصوصية تامة: بياناتك وأرقامك في سرية تامة ولا تُشارك مع أي طرف خارجي نهائياً، وتستخدم حصراً لمتابعة طلبك من قبل إدارة الدليل.
              </span>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" id="cf-submit-btn" style="font-weight:900;font-size:16px;padding:14px;border-radius:12px;box-shadow:0 6px 20px rgba(2,132,199,0.3);cursor:pointer;gap:8px">
              <span style="font-size:18px">🚀</span>
              <span id="cf-submit-text">إرسال الرسالة إلى الإدارة الآن</span>
            </button>
          </form>

          <!-- Success State View (Hidden initially) -->
          <div id="contact-success-state" style="display:none" class="contact-success-card">
            <div style="width:72px;height:72px;border-radius:50%;background:#10B981;color:#fff;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 18px auto;box-shadow:0 8px 24px rgba(16,185,129,0.4)">
              ✓
            </div>
            <h3 style="font-size:1.5rem;font-weight:900;color:var(--text-primary);margin-bottom:8px">
              تم إرسال طلبك بنجاح تام!
            </h3>
            <p style="color:var(--text-muted);font-size:0.95rem;max-width:520px;margin:0 auto 20px auto;line-height:1.6">
              تم تسليم رسالتك إلى إدارة الدليل ووصلت نسخة عبر البريد الإلكتروني الرسمي. سنقوم بمراجعة طلبك والتواصل معك عبر الهاتف أو الواتساب في أقرب وقت.
            </p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <a href="${escAttr(waLink)}" id="btn-success-wa-shortcut" target="_blank" rel="noopener" class="btn btn-whatsapp" style="border-radius:10px;font-weight:800;padding:10px 20px">
                <span>💬</span>
                <span>تأكيد المتابعة عبر WhatsApp</span>
              </a>
              <button type="button" id="btn-reset-contact-form" class="btn btn-outline" style="border-radius:10px;font-weight:800;padding:10px 20px">
                إرسال رسالة أخرى
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  `;

  /* ═══════════════════════════════════════════════════════════
     ANIMATION SYSTEMS & REVEALS
     ═══════════════════════════════════════════════════════════ */

  // 1. Scroll Reveal
  const revealEls = $container.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // 2. Hero Sparkles
  const sparklesBox = document.getElementById('cx-sparkles');
  if (sparklesBox) {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.className = 'cx-spark';
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.top = (Math.random() * 100).toFixed(1) + '%';
      s.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
      s.style.animationDuration = (4 + Math.random() * 4).toFixed(2) + 's';
      const size = (2 + Math.random() * 3).toFixed(1);
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      sparklesBox.appendChild(s);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CUSTOM TOPIC DROPDOWN (القائمة المنسدلة الفاخرة)
     ═══════════════════════════════════════════════════════════ */

  const cqRoot = document.getElementById('cq-topic-select');
  const cqTrigger = document.getElementById('cq-topic-trigger');
  const cqPanel = document.getElementById('cq-topic-panel');
  const cqIcon = document.getElementById('cq-topic-icon');
  const cqValue = document.getElementById('cq-topic-value');
  const cqHint = document.getElementById('cq-topic-hint');
  const selectedTopicInput = document.getElementById('cf-selected-topic');
  const messageLabel = document.getElementById('cf-message-label');
  const messageInput = document.getElementById('cf-message');
  const areaSelect = document.getElementById('cf-area');
  const customAreaWrapper = document.getElementById('cf-custom-area-wrapper');
  const form = document.getElementById('contact-master-form');
  const successState = document.getElementById('contact-success-state');
  const submitBtn = document.getElementById('cf-submit-btn');
  const submitText = document.getElementById('cf-submit-text');

  const openPanel = () => {
    if (!cqRoot || !cqTrigger) return;
    cqRoot.classList.add('is-open');
    cqTrigger.setAttribute('aria-expanded', 'true');
  };
  const closePanel = () => {
    if (!cqRoot || !cqTrigger) return;
    cqRoot.classList.remove('is-open');
    cqTrigger.setAttribute('aria-expanded', 'false');
  };

  cqTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    cqRoot.classList.contains('is-open') ? closePanel() : openPanel();
  });

  document.addEventListener('click', (e) => {
    if (cqRoot && !cqRoot.contains(e.target)) closePanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cqRoot?.classList.contains('is-open')) {
      closePanel();
      cqTrigger?.focus();
    }
  });

  // Apply topic: updates hidden input, dropdown visuals, message label/placeholder
  function setTopic(topicKey, { fromUser = false } = {}) {
    const t = TOPICS[topicKey];
    if (!t) return;

    if (selectedTopicInput) selectedTopicInput.value = topicKey;
    if (cqRoot) {
      cqRoot.dataset.topic = topicKey;
      cqRoot.classList.remove('is-error');
    }
    if (cqIcon) cqIcon.textContent = t.icon;
    if (cqValue) {
      cqValue.textContent = t.title;
      cqValue.classList.remove('is-placeholder');
    }
    if (cqHint) {
      cqHint.textContent = t.hint;
      cqHint.classList.add('is-active');
    }

    cqPanel?.querySelectorAll('.cq-option').forEach(opt => {
      opt.classList.toggle('is-selected', opt.getAttribute('data-topic') === topicKey);
    });

    if (messageInput) messageInput.placeholder = t.placeholder;
    if (messageLabel) messageLabel.innerHTML = `${t.msgLabel} <span class="required">*</span>`;

    if (fromUser) closePanel();
  }

  cqPanel?.querySelectorAll('.cq-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setTopic(opt.getAttribute('data-topic'), { fromUser: true });
    });
  });

  // Pillar CTA buttons → preselect topic + smooth scroll + pulse dropdown
  document.querySelectorAll('.btn-select-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      setTopic(btn.getAttribute('data-topic'));
      const formSection = document.getElementById('contact-form-section');
      if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (cqRoot) {
        cqRoot.classList.remove('is-pulse');
        void cqRoot.offsetWidth; // reflow to restart animation
        cqRoot.classList.add('is-pulse');
        setTimeout(() => cqRoot.classList.remove('is-pulse'), 1600);
      }
    });
  });

  // Hero CTA smooth scroll
  document.getElementById('cx-hero-cta')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('contact-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Area select custom toggle
  areaSelect?.addEventListener('change', (e) => {
    if (customAreaWrapper) {
      customAreaWrapper.style.display = e.target.value === 'other' ? 'block' : 'none';
    }
  });

  // Reset form handler
  document.getElementById('btn-reset-contact-form')?.addEventListener('click', () => {
    if (form) {
      form.reset();
      form.style.display = 'flex';
    }
    if (successState) successState.style.display = 'none';
    if (selectedTopicInput) selectedTopicInput.value = '';
    if (cqRoot) {
      delete cqRoot.dataset.topic;
      cqRoot.classList.remove('is-error');
    }
    if (cqIcon) cqIcon.textContent = '📩';
    if (cqValue) {
      cqValue.textContent = 'اختر هدف رسالتك من القائمة...';
      cqValue.classList.add('is-placeholder');
    }
    if (cqHint) {
      cqHint.textContent = 'اختر الهدف وسنخصص نموذج الرسالة تلقائياً ليناسب طلبك ✨';
      cqHint.classList.remove('is-active');
    }
    cqPanel?.querySelectorAll('.cq-option').forEach(opt => opt.classList.remove('is-selected'));
    if (messageInput) messageInput.placeholder = 'اكتب تفاصيل طلبك للإعلان، أو نوع التوثيق المطلوب، أو أي استفسار تريده بالتفصيل...';
    if (messageLabel) messageLabel.innerHTML = 'تفاصيل الطلب أو نص الرسالة <span class="required">*</span>';
  });

  // Form Submit Handler with Double-Email Forwarding & Database Sync
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const topicKey = selectedTopicInput?.value || '';
    if (!topicKey || !TOPICS[topicKey]) {
      cqRoot?.classList.add('is-error');
      cqRoot?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.warning('يرجى اختيار هدف الرسالة من القائمة المنسدلة أولاً');
      setTimeout(() => cqRoot?.classList.remove('is-error'), 2200);
      return;
    }

    const name = document.getElementById('cf-name')?.value.trim();
    const phone = document.getElementById('cf-phone')?.value.trim();
    const email = document.getElementById('cf-email')?.value.trim();
    const placeName = document.getElementById('cf-place-name')?.value.trim();
    const areaVal = areaSelect?.value === 'other'
      ? (document.getElementById('cf-custom-area')?.value.trim() || 'المنزلة والمطرية')
      : (areaSelect?.value || 'المنزلة');
    const message = document.getElementById('cf-message')?.value.trim();
    const topicLabel = TOPICS[topicKey].emailLabel;

    if (!name || !phone || !message) {
      toast.warning('يرجى ملء كافة الحقول الإلزامية المطلوبة (الاسم، الهاتف، الرسالة)');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      if (submitText) submitText.textContent = 'جاري الإرسال وتوصيل الرسالة...';
    }

    const payload = {
      name,
      phone,
      email: email || 'بدون إيميل',
      placeName: placeName || 'غير محدد',
      area: areaVal,
      topicKey,
      topicLabel,
      message,
      createdAt: Date.now(),
      dateFormatted: new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }),
      userAgent: navigator.userAgent
    };

    try {
      // 1. Save to Firebase Realtime Database
      await dbPush('contactMessages', {
        ...payload,
        serverTime: serverTimestamp()
      }).catch(err => console.warn('[Contact] DB Push backup note:', err.message));

      // 2. Dispatch email to Primary: elfannanm@gmail.com, CC: mohamednasrofficial@gmail.com
      const emailPromise = fetch('https://formsubmit.co/ajax/elfannanm@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[دليل المنزلة والمطرية] ${topicLabel} - من ${name}`,
          _cc: 'mohamednasrofficial@gmail.com',
          _template: 'table',
          _captcha: 'false',
          'نوع الطلب': topicLabel,
          'اسم الراسل': name,
          'رقم الهاتف / الواتساب': phone,
          'البريد الإلكتروني': email || 'غير متوفر',
          'اسم المكان أو النشاط': placeName || 'غير متوفر',
          'المنطقة / القرية': areaVal,
          'تفاصيل الرسالة': message,
          'توقيت الإرسال': payload.dateFormatted
        })
      }).catch(err => console.warn('[Contact] Email forward note:', err.message));

      // Wait a moment for network dispatch
      await Promise.race([emailPromise, new Promise(r => setTimeout(r, 2000))]);

      // Update success WhatsApp shortcut
      const waShortcut = document.getElementById('btn-success-wa-shortcut');
      if (waShortcut) {
        const text = encodeURIComponent(
          `السلام عليكم، أرسلت طلباً عبر موقع دليل المنزلة والمطرية:\n` +
          `• النوع: ${topicLabel}\n` +
          `• الاسم: ${name}\n` +
          `• الهاتف: ${phone}\n` +
          (placeName ? `• المكان: ${placeName}\n` : '') +
          `• المنطقة: ${areaVal}\n` +
          `• التفاصيل: ${message}`
        );
        waShortcut.href = `${waLink}?text=${text}`;
      }

      toast.success('تم إرسال رسالتك بنجاح إلى إدارة الدليل! ✨');
      if (form) form.style.display = 'none';
      if (successState) successState.style.display = 'block';

      successState?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الإرسال، يمكنك التواصل مباشرة عبر الواتساب.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        if (submitText) submitText.textContent = 'إرسال الرسالة إلى الإدارة الآن';
      }
    }
  });
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
