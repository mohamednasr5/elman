/**
 * المنزلة وناسها — Contact & Advertising Page
 * With Typewriter Slogans & Fair Placement Algorithm Live Showcase
 */

import { getSettings, dbPush, serverTimestamp, getPublishedPlaces } from '../../core/db.js';
import { toast } from '../components/Toast.js';
import { MANZALA_VILLAGES_LIST } from '../../utils/maps.js';

const TOPICS = {
  verification: {
    icon: '🛡️',
    title: 'توثيق حساب أو مكان',
    desc: 'شارة توثيق رسمية تعزز الثقة وتحمي هوية نشاطك',
    hint: 'التوثيق يميز نشاطك ويمنح العميل سبباً إضافياً للثقة 🛡️',
    emailLabel: 'طلب توثيق حساب أو مكان بالعلامة المعتمدة',
    msgLabel: 'بيانات التوثيق وإثبات ملكية النشاط',
    placeholder: 'اكتب اسم المحل أو النشاط أو العيادة بالضبط...'
  },
  ads: {
    icon: '📢',
    title: 'إعلان على الدليل',
    desc: 'ظهور إعلاني بارز أمام جمهور المنزلة والمطرية طوال الشهر',
    hint: 'اجعل نشاطك من أوائل الخيارات التي يراها العميل 📢',
    emailLabel: 'إعلان على الدليل وترويج مدفوع',
    msgLabel: 'تفاصيل الإعلان والميزانية أو المدة المقترحة',
    placeholder: 'أخبرنا عن نوع الإعلان الذي تريده والمدة المقترحة...'
  },
  showcase: {
    icon: '🔥',
    title: 'ظهور منتجات وعروض',
    desc: 'أبرز منتجاتك وخصوماتك أولاً لكل المتابعين',
    hint: 'عروضك ستظهر أولاً لكل متابعي المنطقة 🔥',
    emailLabel: 'طلب ظهور المنتجات والعروض الحصرية',
    msgLabel: 'تفاصيل العروض والمنتجات المراد إبرازها',
    placeholder: 'ما هي المنتجات أو العروض التي ترغب في إبرازها؟...'
  },
  listing: {
    icon: '📍',
    title: 'إضافة مكانك أو محلك',
    desc: 'أضف نشاطك إلى دليل المنزلة والمطرية ليجده العملاء بسهولة',
    hint: 'اجعل نشاطك موجوداً في المكان الصحيح أمام عملائك 📍',
    emailLabel: 'طلب إضافة مكان أو محل إلى الدليل',
    msgLabel: 'تفاصيل المكان أو المحل المطلوب إضافته',
    placeholder: 'اكتب اسم المحل أو النشاط، العنوان، رقم الهاتف، والقسم...'
  },
  inquiry: {
    icon: '💬',
    title: 'استفسارات عامة',
    desc: 'أي سؤال حول المنصة والخدمات والأماكن',
    hint: 'فريق الدعم يرد خلال أقل من ساعتين 💬',
    emailLabel: 'استفسارات عامة حول الدليل',
    msgLabel: 'نص الاستفسار والتفاصيل',
    placeholder: 'اكتب استفسارك بالتفصيل...'
  },
  suggestion: {
    icon: '💡',
    title: 'اقتراح لتطوير المنصة',
    desc: 'شاركنا أفكارك لتطوير الدليل لخدمة أهل المنطقة',
    hint: 'كل اقتراح يصل مباشرة للإدارة التنفيذية 💡',
    emailLabel: 'اقتراح أو فكرة لتطوير المنصة',
    msgLabel: 'نص الاقتراح والتفاصيل',
    placeholder: 'شاركنا فكرتك أو اقتراحك...'
  },
  complaint: {
    icon: '⚠️',
    title: 'شكوى أو بلاغ',
    desc: 'أبلغنا عن أي مشكلة أو محتوى مخالف بسرية تامة',
    hint: 'بلاغاتك تُتعامل بسرية تامة وعاجلة ⚠️',
    emailLabel: 'شكوى أو بلاغ عن نشاط أو محتوى',
    msgLabel: 'نص الشكوى أو تفاصيل البلاغ',
    placeholder: 'اشرح لنا المشكلة أو البلاغ بالتفصيل...'
  }
};

const ORDER = ['verification', 'ads', 'showcase', 'listing', 'inquiry', 'suggestion', 'complaint'];

export async function renderContactPage($container, { user } = {}) {
  const settings = await getSettings().catch(() => ({}));
  const waLink = settings?.contact?.whatsappLink || 'https://wa.me/wasendernew';

  const opts = ORDER.map(k => {
    const t = TOPICS[k];
    return `
      <button type="button" class="cq-option cq-option--${k}" role="option" data-topic="${k}">
        <span class="cq-option__icon">${t.icon}</span>
        <span class="cq-option__text">
          <span class="cq-option__title">${t.title}</span>
          <span class="cq-option__desc">${t.desc}</span>
        </span>
        <span class="cq-option__check">✓</span>
      </button>
    `;
  }).join('');

  $container.innerHTML = `
    <style>
      /* Embedded Styles for Typewriter and Fair Rotation Showcase */
      .cx-hero__content { opacity: 1 !important; transform: none !important; }
      .cx-typewriter-container {
        min-height: 110px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10px auto 20px auto;
        max-width: 900px;
      }
      .cx-typewriter-text {
        font-size: clamp(1.6rem, 4vw, 2.7rem);
        font-weight: 900;
        line-height: 1.35;
        background: linear-gradient(135deg, #FFFFFF 15%, #FCD34D 65%, #F5A623 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline-block;
        min-height: 1.35em;
      }
      .cx-typewriter-cursor {
        display: inline-block;
        color: #F5A623;
        font-size: clamp(1.8rem, 4.2vw, 2.9rem);
        font-weight: 300;
        animation: cxCursorBlink 0.8s infinite;
        margin-right: 4px;
        vertical-align: middle;
      }
      @keyframes cxCursorBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      /* Fair Placement & Rotation Section */
      .fair-rotation-section {
        background: linear-gradient(145deg, #091E33 0%, #0F2F4E 55%, #0A2238 100%);
        border: 1px solid rgba(245, 166, 35, 0.35);
        border-radius: 26px;
        padding: 38px 28px;
        margin: 45px 0 35px 0;
        box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.55);
        color: #ffffff;
        position: relative;
        overflow: hidden;
      }
      .fair-rotation-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.45);
        color: #34D399;
        padding: 6px 18px;
        border-radius: 9999px;
        font-size: 13.5px;
        font-weight: 800;
        margin-bottom: 16px;
      }
      .fair-pulse-dot {
        width: 8px;
        height: 8px;
        background: #10B981;
        border-radius: 50%;
        box-shadow: 0 0 10px #10B981;
        animation: fairPulse 1.6s infinite;
      }
      @keyframes fairPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.6; }
      }
      .fair-rotation-title {
        font-size: clamp(1.4rem, 3.2vw, 2.2rem);
        font-weight: 900;
        color: #FFFFFF;
        margin: 0 0 12px 0;
        line-height: 1.35;
      }
      .fair-rotation-subtitle {
        color: #CBD5E1;
        font-size: 15px;
        line-height: 1.75;
        max-width: 860px;
        margin: 0 0 28px 0;
      }
      .fair-rules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
        margin-bottom: 30px;
      }
      .fair-rule-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 18px;
        padding: 22px;
        transition: all 0.3s ease;
      }
      .fair-rule-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(245, 166, 35, 0.4);
        transform: translateY(-3px);
      }
      .fair-rule-icon {
        font-size: 28px;
        margin-bottom: 10px;
      }
      .fair-rule-card h3 {
        font-size: 16px;
        font-weight: 800;
        color: #F8FAFC;
        margin: 0 0 8px 0;
      }
      .fair-rule-card p {
        font-size: 13.5px;
        color: #94A3B8;
        line-height: 1.65;
        margin: 0;
      }
      .fair-demo-box {
        background: rgba(4, 15, 26, 0.75);
        border: 1px solid rgba(245, 166, 35, 0.28);
        border-radius: 20px;
        padding: 22px;
        position: relative;
      }
      .fair-demo-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .fair-demo-status {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13.5px;
        font-weight: 700;
        color: #F1F5F9;
      }
      .fair-demo-badge {
        background: rgba(245, 166, 35, 0.15);
        border: 1px solid rgba(245, 166, 35, 0.4);
        color: #FCD34D;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .fair-cards-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        transition: opacity 0.3s ease;
      }
      .fair-place-card {
        background: #0C2339;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 18px;
        overflow: hidden;
        transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease, border-color 0.3s;
        box-shadow: 0 10px 25px -8px rgba(0, 0, 0, 0.55);
        display: flex;
        flex-direction: column;
        position: relative;
      }
      .fair-place-card.anim-swap {
        transform: scale(0.92) translateY(8px);
        opacity: 0.5;
      }
      .fair-place-card:hover {
        border-color: #F5A623;
        transform: translateY(-4px);
      }
      .fair-place-card__rank {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 3;
        padding: 3px 10px;
        background: rgba(11, 34, 57, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(245, 166, 35, 0.6);
        color: #FCD34D;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 800;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
      }
      .fair-place-card__cover {
        height: 120px;
        width: 100%;
        position: relative;
        background: #153857;
        overflow: hidden;
      }
      .fair-place-card__cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s;
      }
      .fair-place-card:hover .fair-place-card__cover img {
        transform: scale(1.06);
      }
      .fair-place-card__badges {
        position: absolute;
        bottom: 8px;
        right: 8px;
        left: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .fair-badge-sponsored {
        background: linear-gradient(135deg, #F5A623, #D97706);
        color: #000;
        font-size: 10.5px;
        font-weight: 900;
        padding: 2px 8px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      }
      .fair-badge-verified {
        background: #0284C7;
        color: #fff;
        font-size: 10.5px;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      }
      .fair-place-card__body {
        padding: 14px 12px 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
      }
      .fair-place-card__title {
        font-size: 14.5px;
        font-weight: 800;
        color: #FFFFFF;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .fair-place-card__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        color: #94A3B8;
        gap: 4px;
      }
      .fair-place-card__link {
        margin-top: 6px;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #38BDF8;
        text-align: center;
        border-radius: 8px;
        font-size: 11.5px;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s;
      }
      .fair-place-card__link:hover {
        background: #0284C7;
        color: #fff;
      }
      @media (max-width: 991px) {
        .fair-cards-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 540px) {
        .fair-cards-grid {
          grid-template-columns: 1fr;
        }
        .fair-rotation-section {
          padding: 24px 16px;
        }
      }
    </style>

    <!-- Hero Section with Typewriter Slogans -->
    <section class="cx-hero">
      <div class="cx-hero__bg" aria-hidden="true">
        <div class="cx-orb cx-orb--1"></div>
        <div class="cx-orb cx-orb--2"></div>
        <div class="cx-orb cx-orb--3"></div>
        <div class="cx-grid-overlay"></div>
        <div class="cx-sparkles" id="cx-sparkles"></div>
      </div>
      <div class="cx-hero__content">
        <div class="cx-hero__badge">
          <span>✨</span>
          <span>المنصة الرقمية الأولى لربط الأنشطة والخدمات في المنزلة والمطرية ومحيطهما</span>
        </div>

        <!-- Dynamic Typewriter Heading -->
        <div class="cx-typewriter-container">
          <h1 class="cx-hero__title" aria-live="polite">
            <span class="cx-typewriter-text" id="cx-typewriter"></span><span class="cx-typewriter-cursor">|</span>
          </h1>
        </div>

        <p class="cx-hero__desc">
          تواصل مباشر مع إدارة «دليل المنزلة والمطرية الرقمي» واحصل على خدمات التوثيق والترويج التي تضمن وصول نشاطك ومحلك لآلاف الزوار يومياً مع ميزة التدوير العادل في الصدارة.
        </p>

        <div class="cx-hero__actions">
          <a href="#contact-form-section" id="cx-hero-cta" class="cx-btn cx-btn--gold">
            <span>🚀</span>
            <span>ابدأ طلبك الآن</span>
          </a>
          <a href="${escAttr(waLink)}" target="_blank" rel="noopener" class="cx-btn cx-btn--wa">
            <span>💬</span>
            <span>محادثة واتساب مباشرة</span>
          </a>
        </div>
      </div>
    </section>

    <div class="container" style="max-width:1100px;margin:0 auto;padding:0 16px">

      <!-- 3 Pricing Pillars -->
      <section class="pillars-grid">
        <div class="pillar-card pillar-card--sponsor">
          <div class="pillar-icon-box">📢</div>
          <div class="pillar-price">💰 100 جنيه مصري / شهرياً</div>
          <h2 class="pillar-title">الإعلان والترويج المدفوع</h2>
          <p class="pillar-desc">اجعل نشاطك في الواجهة والصدارة أمام العملاء المحليين.</p>
          <button type="button" class="btn btn-primary btn-block btn-select-topic" data-topic="ads">ابدأ إعلانك 📢</button>
        </div>

        <div class="pillar-card pillar-card--verify">
          <div class="pillar-icon-box">🛡️</div>
          <div class="pillar-price">💎 1000 جنيه مصري / مدى الحياة</div>
          <h2 class="pillar-title">توثيق حسابك ومكانك</h2>
          <p class="pillar-desc">توثيق رسمي بالعلامة المعتمدة يعزز الثقة والمصداقية التامة.</p>
          <button type="button" class="btn btn-primary btn-block btn-select-topic" data-topic="verification">وثّق مكانك 🛡️</button>
        </div>

        <div class="pillar-card pillar-card--showcase">
          <div class="pillar-icon-box">🔥</div>
          <div class="pillar-kicker">إبراز المنتجات والعروض 🛍️</div>
          <h2 class="pillar-title">ظهور منتجاتك وعروضك</h2>
          <p class="pillar-desc">حوّل منتجاتك وعروضك إلى سبب مباشر لزيارة محلك وزيادة مبيعاتك.</p>
          <button type="button" class="btn btn-primary btn-block btn-select-topic" data-topic="showcase">إبراز المنتجات 🔥</button>
        </div>
      </section>

      <!-- Fair Algorithm Rotation Showcase Section -->
      <section class="fair-rotation-section" id="fair-rotation-section">
        <div class="fair-rotation-badge">
          <span class="fair-pulse-dot"></span>
          <span>خوارزمية التدوير الذكي والظهور العادل</span>
        </div>
        <h2 class="fair-rotation-title">
          كيف يظهر أصحاب الإعلانات والتوثيق على الدليل مع عدالة تامة في الترتيب؟
        </h2>
        <p class="fair-rotation-subtitle">
          حرصاً منا على تكافؤ الفرص لجميع أصحاب المشروعات والمحلات المشتركة، نطبق نظام تدوير خوارزمي عادل وذكي يضمن أن كل نشاط موثق أو مميز يأخذ حقه كاملاً في الصدارة والواجهة، بدون أي احتكار للمركز الأول.
        </p>

        <!-- 3 Feature Highlights -->
        <div class="fair-rules-grid">
          <div class="fair-rule-card">
            <div class="fair-rule-icon">🔄</div>
            <h3>تدوير خوارزمي عادل وتلقائي</h3>
            <p>تتبدل مواقع وبطاقات الأنشطة المميزة والموثقة دورياً مع كل زيارة مستخدم، ليحظى كل نشاط بنصيب متساوٍ من التواجد في المركز الأول والصدارة.</p>
          </div>
          <div class="fair-rule-card">
            <div class="fair-rule-icon">⭐</div>
            <h3>أسبقية الصدارة على النتائج العادية</h3>
            <p>الأماكن الموثقة والمميزة تتقدم تلقائياً على كافة الأماكن غير الموثقة في كافة التصنيفات، وصفحات البحث، والواجهة الرئيسية.</p>
          </div>
          <div class="fair-rule-card">
            <div class="fair-rule-icon">📍</div>
            <h3>ربط ذكي بالنطاق الجغرافي</h3>
            <p>ترشح الخوارزمية الأنشطة الموثقة الأقرب للعميل في المنزلة أو المطرية أو قريته أولاً لتسهيل الاتصال والطلب الفوري.</p>
          </div>
        </div>

        <!-- Live 4-Card Rotating Algorithm Simulation -->
        <div class="fair-demo-box">
          <div class="fair-demo-topbar">
            <div class="fair-demo-status">
              <span class="fair-pulse-dot"></span>
              <span id="fair-demo-status-text">بث مباشر لمحاكاة الخوارزمية: تتبدل أماكن البطاقات تلقائياً كل 4.5 ثوانٍ لضمان عدالة التكافؤ</span>
            </div>
            <div class="fair-demo-badge">
              <span>⚡ تدوير حي مستمر</span>
            </div>
          </div>

          <!-- 4 Horizontal Cards Grid -->
          <div class="fair-cards-grid" id="fair-cards-grid">
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #94A3B8;">جاري تحميل محاكاة الأماكن...</div>
          </div>
        </div>
      </section>

      <!-- Place Add Service Card -->
      <section class="place-add-service-card" aria-labelledby="place-listing-title">
        <div class="place-add-service-card__glow" aria-hidden="true"></div>
        <div class="place-add-service-card__icon">📍</div>
        <div class="place-add-service-card__content">
          <div class="place-add-service-card__eyebrow">خدمة إضافة مكانك أو محلك</div>
          <h2 id="place-listing-title" class="place-add-service-card__title">خلي مكانك موجود في دليل المنزلة والمطرية</h2>
          <p class="place-add-service-card__desc">عندك محل أو عيادة أو مكتب أو ورشة أو شركة أو خدمة؟ أرسل بيانات نشاطك وسنراجعها لإضافتها إلى الدليل بصورة احترافية، مع تنظيم المعلومات الأساسية ليسهل على العملاء الوصول إليك والتواصل معك.</p>
          <div class="place-add-service-card__features">
            <span>📌 بيانات وموقع النشاط</span>
            <span>📞 الهاتف والواتساب</span>
            <span>🗺️ ربط الموقع بالخرائط</span>
            <span>🔎 ظهور أفضل في الدليل</span>
          </div>
        </div>
        <div class="place-add-service-card__action">
          <button type="button" class="place-add-service-card__btn btn-select-topic" data-topic="listing">📍 أضف مكانك الآن</button>
          <small>سنتواصل معك لتأكيد البيانات قبل الإضافة</small>
        </div>
      </section>

      <!-- Stats Strip -->
      <section class="contact-stats-strip">
        <div class="contact-stat-item">
          <div class="contact-stat-val">+50,000</div>
          <div class="contact-stat-lbl">مشاهدة وتفاعل شهرياً بالمنطقة</div>
        </div>
        <div class="contact-stat-item">
          <div class="contact-stat-val contact-counter" data-target="15000" data-prefix="" data-suffix="+">0</div>
          <div class="contact-stat-lbl">نشاط تجاري وعيادة ومهنة مسجلة</div>
        </div>
        <div class="contact-stat-item">
          <div class="contact-stat-val">100%</div>
          <div class="contact-stat-lbl">استهداف محلي</div>
        </div>
        <div class="contact-stat-item">
          <div class="contact-stat-val">أقل من ساعتين</div>
          <div class="contact-stat-lbl">متوسط سرعة الرد</div>
        </div>
      </section>

      <!-- Contact Form Section -->
      <section id="contact-form-section" style="margin-bottom:80px">
        <div class="contact-form-card">
          <div style="text-align:center;margin-bottom:28px">
            <div class="contact-form-badge">✍️ نموذج التواصل وطلبات الإدارة</div>
            <h2 class="contact-form-title">أرسل رسالتك أو طلبك إلى إدارة الدليل مباشرة</h2>
            <p class="contact-form-desc">اختر هدف الطلب، ثم أرسل بياناتك وسنراجع الطلب ونتواصل معك.</p>
          </div>

          <div class="form-group" style="margin-bottom:20px">
            <label class="form-label cx-label">هدف الرسالة <span class="required">*</span></label>
            <div class="cq-select" id="cq-topic-select">
              <button type="button" class="cq-select__trigger" id="cq-topic-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cq-select__icon" id="cq-topic-icon">📩</span>
                <span class="cq-select__value is-placeholder" id="cq-topic-value">اختر هدف رسالتك من القائمة...</span>
                <span class="cq-select__chevron" aria-hidden="true">⌄</span>
              </button>
              <div class="cq-select__panel" id="cq-topic-panel" role="listbox">
                <div class="cq-select__panel-head">اختر نوع طلبك ✨</div>
                ${opts}
              </div>
            </div>
            <div class="cq-select__hint" id="cq-topic-hint">اختر الهدف وسنخصص النموذج تلقائياً ✨</div>
          </div>

          <form id="contact-master-form" style="display:flex;flex-direction:column;gap:18px">
            <input type="hidden" id="cf-selected-topic">
            
            <div class="contact-form-grid">
              <div class="form-group">
                <label class="form-label">الاسم بالكامل <span class="required">*</span></label>
                <input id="cf-name" class="form-input" required value="${escAttr(user?.name||'')}" placeholder="اكتب اسمك الكريم...">
              </div>
              <div class="form-group">
                <label class="form-label">رقم الهاتف / الواتساب <span class="required">*</span></label>
                <input id="cf-phone" type="tel" class="form-input" required value="${escAttr(user?.phone||'')}" placeholder="010XXXXXXXX">
              </div>
            </div>

            <div class="contact-form-grid">
              <div class="form-group">
                <label class="form-label">البريد الإلكتروني</label>
                <input id="cf-email" type="email" class="form-input" value="${escAttr(user?.email||'')}" placeholder="name@example.com">
              </div>
              <div class="form-group">
                <label class="form-label">اسم المكان أو النشاط التجاري</label>
                <input id="cf-place-name" class="form-input" placeholder="اسم المحل أو النشاط...">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">المدينة أو القرية <span class="required">*</span></label>
              <select id="cf-area" class="form-select">
                ${MANZALA_VILLAGES_LIST.map(v => `<option value="${escAttr(v)}">📍 ${v}</option>`).join('')}
                <option value="other">✏️ منطقة أخرى</option>
              </select>
              <div id="cf-custom-area-wrapper" style="display:none;margin-top:8px">
                <input id="cf-custom-area" class="form-input" placeholder="اكتب اسم المنطقة...">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" id="cf-message-label">تفاصيل الطلب أو نص الرسالة <span class="required">*</span></label>
              <textarea id="cf-message" class="form-textarea" rows="5" required placeholder="اكتب تفاصيل طلبك..."></textarea>
            </div>

            <div class="contact-privacy">🛡️ خصوصية تامة: تستخدم بياناتك حصراً لمتابعة طلبك من قبل إدارة الدليل.</div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" id="cf-submit-btn">
              <span>🚀</span>
              <span id="cf-submit-text">إرسال الطلب إلى الإدارة الآن</span>
            </button>
          </form>

          <div id="contact-success-state" style="display:none" class="contact-success-card">
            <div>✓</div>
            <h3>تم إرسال طلبك بنجاح!</h3>
            <p>تم تسليم طلبك إلى إدارة الدليل وسنتواصل معك في أقرب وقت.</p>
          </div>
        </div>
      </section>

    </div>
  `;

  // 1. Initialize Slogan Typewriter
  initContactTypewriter();

  // 2. Initialize Fair Placement 4-Card Rotation Showcase
  initFairRotationShowcase();

  // 3. Form logic & Topics Dropdown
  const root = document.getElementById('cq-topic-select');
  const trigger = document.getElementById('cq-topic-trigger');
  const panel = document.getElementById('cq-topic-panel');
  const icon = document.getElementById('cq-topic-icon');
  const value = document.getElementById('cq-topic-value');
  const hint = document.getElementById('cq-topic-hint');
  const selected = document.getElementById('cf-selected-topic');
  const label = document.getElementById('cf-message-label');
  const message = document.getElementById('cf-message');
  const area = document.getElementById('cf-area');
  const custom = document.getElementById('cf-custom-area-wrapper');
  const form = document.getElementById('contact-master-form');
  const success = document.getElementById('contact-success-state');
  const submit = document.getElementById('cf-submit-btn');
  const submitText = document.getElementById('cf-submit-text');

  const close = () => {
    root?.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    root?.classList.add('is-open');
    trigger?.setAttribute('aria-expanded', 'true');
  };

  trigger?.addEventListener('click', () => root.classList.contains('is-open') ? close() : open());
  document.addEventListener('click', e => {
    if (root && !root.contains(e.target)) close();
  });

  function setTopic(k) {
    const t = TOPICS[k];
    if (!t) return;
    selected.value = k;
    root.dataset.topic = k;
    icon.textContent = t.icon;
    value.textContent = t.title;
    value.classList.remove('is-placeholder');
    hint.textContent = t.hint;
    hint.classList.add('is-active');
    panel.querySelectorAll('.cq-option').forEach(o => o.classList.toggle('is-selected', o.dataset.topic === k));
    message.placeholder = t.placeholder;
    label.innerHTML = `${t.msgLabel} <span class="required">*</span>`;
    close();
  }

  panel?.querySelectorAll('.cq-option').forEach(o => o.addEventListener('click', () => setTopic(o.dataset.topic)));
  $container.querySelectorAll('.btn-select-topic').forEach(b => b.addEventListener('click', () => {
    setTopic(b.dataset.topic);
    document.getElementById('contact-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  document.getElementById('cx-hero-cta')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('contact-form-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  area?.addEventListener('change', e => custom.style.display = e.target.value === 'other' ? 'block' : 'none');

  initContactCounters($container);

  // Form Submit
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const topic = selected.value;
    if (!TOPICS[topic]) {
      root.classList.add('is-error');
      toast.warning('يرجى اختيار هدف الرسالة أولاً');
      return;
    }
    const name = document.getElementById('cf-name').value.trim();
    const phone = document.getElementById('cf-phone').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const placeName = document.getElementById('cf-place-name').value.trim();
    const areaVal = area.value === 'other' ? (document.getElementById('cf-custom-area').value.trim() || 'المنزلة والمطرية') : area.value;
    const messageVal = message.value.trim();
    const topicLabel = TOPICS[topic].emailLabel;

    if (!name || !phone || !messageVal) {
      toast.warning('يرجى ملء الحقول الإلزامية');
      return;
    }

    submit.disabled = true;
    submitText.textContent = 'جاري الإرسال...';
    const payload = {
      name,
      phone,
      email: email || 'بدون إيميل',
      placeName: placeName || 'غير محدد',
      area: areaVal,
      topicKey: topic,
      topicLabel,
      message: messageVal,
      createdAt: Date.now(),
      dateFormatted: new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }),
      userAgent: navigator.userAgent
    };

    try {
      await dbPush('contactMessages', { ...payload, serverTime: serverTimestamp() }).catch(() => {});
      await fetch('https://formsubmit.co/ajax/elfannanm@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: `[دليل المنزلة والمطرية] ${topicLabel} - من ${name}`,
          _cc: 'mohamednasrofficial@gmail.com',
          ...payload
        })
      });
      form.style.display = 'none';
      success.style.display = 'block';
    } catch (err) {
      console.error(err);
      toast.error('تعذر إرسال الطلب حالياً. حاول مرة أخرى.');
      submit.disabled = false;
      submitText.textContent = 'إرسال الطلب إلى الإدارة الآن';
    }
  });
}

/**
 * Typewriter Effect for Hero Slogans
 */
function initContactTypewriter() {
  const el = document.getElementById('cx-typewriter');
  if (!el) return;

  const phrases = [
    'أنضم لأكثر من 15000 محل ومكان فى دليل المنزلة والمطرية الرقمي',
    'الدليل الأول فى المنطقة الهادف لزيادة مبيعات محلك أو مشروعك',
    'توثيقك لمكانك على الدليل يجعلك تظهر فى كل مكان'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function tick() {
    const current = phrases[phraseIndex];
    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 25 : 55;

    if (!isDeleting && charIndex === current.length) {
      delay = 2800; // Pause at end of completed sentence
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400; // Pause before starting next phrase
    }

    setTimeout(tick, delay);
  }

  tick();
}

/**
 * Fair Placement Algorithm Live Showcase with 4 Horizontal Cards
 */
async function initFairRotationShowcase() {
  const grid = document.getElementById('fair-cards-grid');
  const statusText = document.getElementById('fair-demo-status-text');
  if (!grid) return;

  // Curated directory items as base / fallback
  const fallbackPlaces = [
    {
      id: 'p_1788703900620_oae8ka',
      slug: 'mtam-basl-wbaha-llmakwlat-albhrya',
      name: 'مطعم باسل وباهى للمأكولات البحرية',
      area: 'المطرية دقهلية',
      category: 'مطاعم وأسماك',
      cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: '-P03LX9MledW_z7QfyHO',
      slug: '-P03LX9MledW_z7QfyHO',
      name: 'الحسن لصيانة الهواتف المحمولة',
      area: 'المنزلة - شارع البحر',
      category: 'صيانة وموبايل',
      cover: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'p_1788801925745_vuxmjs',
      slug: 'mtbkh-eyma-llaakl-albyty',
      name: 'مطبخ إيمى للأكل البيتي',
      area: 'المنزلة - طريق المنصورة',
      category: 'أكل بيتي وحلويات',
      cover: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: '-P0hEa0K6ZfAM65O27G9',
      slug: 'kwafyr-mnh-asad',
      name: 'كوافير منه أسعد',
      area: 'المنزلة - حي السلام',
      category: 'بيوتي وكوافير',
      cover: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'
    }
  ];

  let displayPlaces = [...fallbackPlaces];

  try {
    const livePlaces = await getPublishedPlaces({ limit: 25 });
    if (Array.isArray(livePlaces) && livePlaces.length >= 4) {
      // Pick 4 diverse places
      const picked = [];
      const seen = new Set();
      for (const p of livePlaces) {
        if (!p.name || seen.has(p.name)) continue;
        seen.add(p.name);
        picked.push({
          id: p.id || p._key,
          slug: p.slug || p.id,
          name: p.name,
          area: p.area || 'المنزلة والمطرية',
          category: p.categoryName || p.customCategory || p.categoryId || 'نشاط تجاري',
          cover: p.coverImageUrl || p.logoUrl || fallbackPlaces[picked.length % fallbackPlaces.length].cover
        });
        if (picked.length === 4) break;
      }
      if (picked.length === 4) displayPlaces = picked;
    }
  } catch (_) {}

  const rankLabels = [
    '🥇 الصدارة #1',
    '🥈 الصدارة #2',
    '🥉 الصدارة #3',
    '🎖️ الصدارة #4'
  ];

  function renderCards(placesList) {
    grid.innerHTML = placesList.map((p, index) => {
      const targetSlug = p.slug || p.id || '';
      return `
      <article class="fair-place-card" data-card-index="${index}"
               onclick="window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(targetSlug)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(targetSlug)}')"
               onpointerdown="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}')"
               onmouseenter="window.__prefetchPlaceCard && window.__prefetchPlaceCard('${escAttr(targetSlug)}')"
               style="cursor:pointer">
        <span class="fair-place-card__rank">${rankLabels[index]}</span>
        <div class="fair-place-card__cover">
          <img src="${escAttr(p.cover)}" alt="${escAttr(p.name)}" loading="lazy" onerror="this.src='${escAttr(fallbackPlaces[index % 4].cover)}'">
          <div class="fair-place-card__badges">
            <span class="fair-badge-sponsored">⭐ إعلان مميز</span>
            <span class="fair-badge-verified">✓ موثق رسمياً</span>
          </div>
        </div>
        <div class="fair-place-card__body">
          <h4 class="fair-place-card__title" title="${escAttr(p.name)}">${escHtml(p.name)}</h4>
          <div class="fair-place-card__meta">
            <span>📍 ${escHtml(p.area)}</span>
            <span>🏷️ ${escHtml(p.category)}</span>
          </div>
          <a href="/place.html?slug=${encodeURIComponent(targetSlug)}" class="fair-place-card__link" onclick="event.preventDefault(); window.__openPlaceCard ? window.__openPlaceCard(this, '${escAttr(targetSlug)}', event) : (window.location.href='/place.html?slug=${encodeURIComponent(targetSlug)}')">عرض بطاقة المكان ↗</a>
        </div>
      </article>
    `;
    }).join('');
  }

  // Initial render
  renderCards(displayPlaces);

  // Periodic Fair Shuffling Loop (every 4.5 seconds)
  let rotationCount = 1;
  setInterval(() => {
    // Add brief animation class
    const cards = grid.querySelectorAll('.fair-place-card');
    cards.forEach(c => c.classList.add('anim-swap'));

    setTimeout(() => {
      // Shift array by 1 position (rotation: 0->1->2->3->0)
      const first = displayPlaces.shift();
      displayPlaces.push(first);
      rotationCount++;

      renderCards(displayPlaces);

      if (statusText) {
        statusText.innerHTML = `🟢 <b>تم تدوير الصدارة تلقائياً (${rotationCount}):</b> تتغير المراكز دورياً لضمان تكافؤ نسب المشاهدة لكافة المشتركين!`;
      }
    }, 320);
  }, 4500);
}

function initContactCounters($container) {
  const counters = $container.querySelectorAll('.contact-counter[data-target]');
  if (!counters.length) return;
  const animate = (el) => {
    const target = Number(el.dataset.target || 0), duration = 1600, start = performance.now();
    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased).toLocaleString('en-US') + '+';
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: .35 });
    counters.forEach(el => io.observe(el));
  } else counters.forEach(animate);
}

function escAttr(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
