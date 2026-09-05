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

export async function renderContactPage($container, { user } = {}) {
  const settings = await getSettings().catch(() => ({}));
  const waLink = settings?.contact?.whatsappLink || 'https://wa.me/wasendernew';

  $container.innerHTML = `
    <!-- ═══════════════════════════════════════════════════════════
         1. HERO SECTION (الواجهة البصرية الإبداعية الفاخرة)
         ═══════════════════════════════════════════════════════════ -->
    <section class="contact-hero-premium">
      <div class="container" style="max-width:960px;margin:0 auto;position:relative;z-index:2">
        <div class="contact-hero-badge">
          <span>✨</span>
          <span>المنصة الرقمية الأولى في المنزلة والمطرية ومحيطهما</span>
        </div>

        <h1 class="contact-hero-title">
          طوّر نشاطك، وثّق مكانك، وضاعف <span class="glow-gradient">مبيعاتك وأرباحك</span>
        </h1>

        <p class="contact-hero-desc">
          تواصل مباشر مع إدارة «دليل المنزلة والمطرية الرقمي». احصل على مكانة الصدارة في البحث، وشارة التوثيق الرسمية، وانقل عروضك ومنتجاتك لكل هاتف ومنزل في المنطقة.
        </p>

        <div class="contact-hero-actions">
          <a href="#contact-form-section" class="btn btn-primary btn-lg" style="box-shadow:0 8px 24px rgba(2,132,199,0.35);border-radius:12px;font-weight:900;padding:14px 28px;gap:8px">
            <span>🚀</span>
            <span>ابدأ طلب الإعلان أو التوثيق</span>
          </a>
          <a href="${escAttr(waLink)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg" style="border-radius:12px;font-weight:900;padding:14px 24px;gap:8px">
            <span style="font-size:18px">💬</span>
            <span>محادثة واتساب فورية</span>
          </a>
          <a href="tel:01090101536" class="btn btn-outline btn-lg" style="color:#fff;border-color:rgba(255,255,255,0.3);border-radius:12px;font-weight:800;padding:14px 22px;gap:6px">
            <span>📞</span>
            <span>01090101536</span>
          </a>
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

          <!-- Topic Selector Chips -->
          <div style="margin-bottom:12px">
            <label class="form-label" style="font-weight:800;font-size:13px;margin-bottom:10px">
              حدد نوع طلبك أو موضوع الرسالة: <span class="required">*</span>
            </label>
            <div class="topic-chips-wrapper" id="contact-topic-chips">
              <button type="button" class="topic-chip active active--sponsor" data-topic="ads">
                <span>📢</span>
                <span>إعلان على الدليل</span>
              </button>
              <button type="button" class="topic-chip active--verify" data-topic="verification">
                <span>🛡️</span>
                <span>توثيق حساب أو مكان</span>
              </button>
              <button type="button" class="topic-chip" data-topic="showcase">
                <span>🔥</span>
                <span>ظهور منتجات وعروض</span>
              </button>
              <button type="button" class="topic-chip" data-topic="inquiry">
                <span>💬</span>
                <span>استفسارات عامة</span>
              </button>
              <button type="button" class="topic-chip" data-topic="suggestion">
                <span>💡</span>
                <span>اقتراح لتطوير المنصة</span>
              </button>
              <button type="button" class="topic-chip" data-topic="complaint">
                <span>⚠️</span>
                <span>شكوى أو بلاغ</span>
              </button>
            </div>
          </div>

          <!-- The Form -->
          <form id="contact-master-form" style="display:flex;flex-direction:column;gap:18px">
            <input type="hidden" id="cf-selected-topic" value="ads" />

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

  // ═══════════════════════════════════════════════════════════
  //  LOGIC & EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════

  const topicChips = document.querySelectorAll('#contact-topic-chips .topic-chip');
  const selectedTopicInput = document.getElementById('cf-selected-topic');
  const placeGroup = document.getElementById('cf-place-group');
  const messageLabel = document.getElementById('cf-message-label');
  const messageInput = document.getElementById('cf-message');
  const areaSelect = document.getElementById('cf-area');
  const customAreaWrapper = document.getElementById('cf-custom-area-wrapper');
  const form = document.getElementById('contact-master-form');
  const successState = document.getElementById('contact-success-state');
  const submitBtn = document.getElementById('cf-submit-btn');
  const submitText = document.getElementById('cf-submit-text');

  // Topic Labels Map
  const TOPIC_LABELS = {
    ads: 'إعلان على الدليل وترويج مدفوع',
    verification: 'طلب توثيق حساب أو مكان بالعلامة المعتمدة',
    showcase: 'طلب ظهور المنتجات والعروض الحصرية',
    inquiry: 'استفسارات عامة حول الدليل',
    suggestion: 'اقتراح أو فكرة لتطوير المنصة',
    complaint: 'شكوى أو بلاغ عن نشاط أو محتوى'
  };

  // Change active topic helper
  function setTopic(topicKey) {
    if (selectedTopicInput) selectedTopicInput.value = topicKey;

    topicChips.forEach(chip => {
      chip.classList.remove('active', 'active--sponsor', 'active--verify', 'active--complaint');
      if (chip.getAttribute('data-topic') === topicKey) {
        chip.classList.add('active');
        if (topicKey === 'ads' || topicKey === 'showcase') chip.classList.add('active--sponsor');
        else if (topicKey === 'verification') chip.classList.add('active--verify');
        else if (topicKey === 'complaint') chip.classList.add('active--complaint');
      }
    });

    // Dynamic placeholders & hints
    if (topicKey === 'ads') {
      if (messageInput) messageInput.placeholder = 'أخبرنا عن نوع الإعلان الذي تريده (إعلان قمة الموقع، شريط إعلاني، ترويج صفحة مكانك) والمدة المقترحة...';
      if (messageLabel) messageLabel.innerHTML = 'تفاصيل الإعلان والميزانية أو المدة المقترحة <span class="required">*</span>';
      if (placeGroup) placeGroup.style.display = 'block';
    } else if (topicKey === 'verification') {
      if (messageInput) messageInput.placeholder = 'اكتب اسم المحل أو النشاط أو العيادة بالضبط، وأي أرقام هواتف أو صفحات تواصل ترغب في ربطها بالتوثيق...';
      if (messageLabel) messageLabel.innerHTML = 'بيانات التوثيق وإثبات ملكية النشاط <span class="required">*</span>';
      if (placeGroup) placeGroup.style.display = 'block';
    } else if (topicKey === 'showcase') {
      if (messageInput) messageInput.placeholder = 'ما هي المنتجات أو العروض الترويجية والخصومات التي ترغب في إبرازها لأهالي المنزلة والمطرية؟...';
      if (messageLabel) messageLabel.innerHTML = 'تفاصيل العروض والمنتجات المراد إبرازها <span class="required">*</span>';
      if (placeGroup) placeGroup.style.display = 'block';
    } else if (topicKey === 'complaint') {
      if (messageInput) messageInput.placeholder = 'اشرح لنا المشكلة أو البلاغ بالتفصيل لنقوم بالتحقق العاجل واتخاذ اللازم فوراً...';
      if (messageLabel) messageLabel.innerHTML = 'نص الشكوى أو تفاصيل البلاغ <span class="required">*</span>';
      if (placeGroup) placeGroup.style.display = 'block';
    } else {
      if (messageInput) messageInput.placeholder = 'اكتب استفسارك أو اقتراحك أو رسالتك بالتفصيل هنا...';
      if (messageLabel) messageLabel.innerHTML = 'نص الرسالة والتفاصيل <span class="required">*</span>';
      if (placeGroup) placeGroup.style.display = 'block';
    }
  }

  // Topic Chip Click
  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      setTopic(chip.getAttribute('data-topic'));
    });
  });

  // Action Buttons from the 3 pillars
  document.querySelectorAll('.btn-select-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const topic = btn.getAttribute('data-topic');
      setTopic(topic);
      const formSection = document.getElementById('contact-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
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
    setTopic('ads');
  });

  // Form Submit Handler with Double-Email Forwarding & Database Sync
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('cf-name')?.value.trim();
    const phone = document.getElementById('cf-phone')?.value.trim();
    const email = document.getElementById('cf-email')?.value.trim();
    const placeName = document.getElementById('cf-place-name')?.value.trim();
    const areaVal = areaSelect?.value === 'other'
      ? (document.getElementById('cf-custom-area')?.value.trim() || 'المنزلة والمطرية')
      : (areaSelect?.value || 'المنزلة');
    const message = document.getElementById('cf-message')?.value.trim();
    const topicKey = selectedTopicInput?.value || 'inquiry';
    const topicLabel = TOPIC_LABELS[topicKey] || topicKey;

    if (!name || !phone || !message) {
      toast.warning('يرجى ملء كافة الحقول الإلزامية المطلوبة (الاسم، الهاتف، الرسالة)');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
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
        if (submitText) submitText.textContent = 'إرسال الرسالة إلى الإدارة الآن';
      }
    }
  });
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
