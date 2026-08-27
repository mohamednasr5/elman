/**
 * المنزلة وناسها — Static Pages (Privacy, Terms, Contact Us)
 */

import { getSettings } from '../../core/db.js';
import { toast } from '../components/Toast.js';

export async function renderStaticPage($container, type) {
  if (type === 'privacy') {
    $container.innerHTML = `
      <div class="container section" style="max-width:800px">
        <div class="form-section animate-fade-in">
          <h1 style="color:var(--primary);margin-bottom:var(--space-4)">سياسة الخصوصية</h1>
          <p style="margin-bottom:1rem;color:var(--text-secondary);line-height:1.8">
            أهلاً بك في منصة <strong>المنزلة وناسها</strong>. نحن نلتزم بحماية خصوصية بيانات مستخدمينا وزوارنا وأصحاب الأنشطة التجارية في مدينة المنزلة.
          </p>
          <h2 style="font-size:var(--font-size-lg);margin:1.5rem 0 0.5rem">1. البيانات التي نجمعها</h2>
          <p style="color:var(--text-secondary);line-height:1.8">
            - معلومات تسجيل الدخول عبر Google (الاسم، البريد الإلكتروني، الصورة الشخصية).<br/>
            - معلومات الأماكن والمحلات العامة التي يضيفها أصحاب الأنشطة (الاسم، أرقام التواصل، العنوان، مواعيد العمل، الصور، العروض).
          </p>
          <h2 style="font-size:var(--font-size-lg);margin:1.5rem 0 0.5rem">2. استخدام البيانات</h2>
          <p style="color:var(--text-secondary);line-height:1.8">
            تُستخدم البيانات فقط لغرض عرض الدليل وتسهيل وصول أهل وزوار مدينة المنزلة إلى الخدمات والأماكن المحلية. لا نقوم ببيع أو مشاركة بياناتك الشخصية مع أي أطراف ثالثة.
          </p>
          <h2 style="font-size:var(--font-size-lg);margin:1.5rem 0 0.5rem">3. أمان الحسابات</h2>
          <p style="color:var(--text-secondary);line-height:1.8">
            تتم عمليات تسجيل الدخول بشكل آمن بالكامل عبر Firebase Authentication دون تخزين كلمات المرور.
          </p>
        </div>
      </div>
    `;
  } else if (type === 'terms') {
    $container.innerHTML = `
      <div class="container section" style="max-width:800px">
        <div class="form-section animate-fade-in">
          <h1 style="color:var(--primary);margin-bottom:var(--space-4)">شروط الاستخدام</h1>
          <p style="margin-bottom:1rem;color:var(--text-secondary);line-height:1.8">
            باستخدامك لمنصة <strong>المنزلة وناسها</strong>، فإنك توافق على الالتزام بالشروط والأحكام التالية:
          </p>
          <h2 style="font-size:var(--font-size-lg);margin:1.5rem 0 0.5rem">1. دقة وصحة البيانات</h2>
          <p style="color:var(--text-secondary);line-height:1.8">
            يتعهد صاحب النشاط بتقديم معلومات صحيحة ودقيقة عن محله أو خدمته، بما في ذلك أرقام الهواتف والأسعار ومواعيد العمل.
          </p>
          <h2 style="font-size:var(--font-size-lg);margin:1.5rem 0 0.5rem">2. التوثيق والعلامة الموثقة</h2>
          <p style="color:var(--text-secondary);line-height:1.8">
            يخضع توثيق الأنشطة التجارية لتدقيق إدارة المنصة، وللإدارة الحق في رفض أو سحب التوثيق في حال ثبوت بيانات غير صحيحة أو مخالفات.
          </p>
          <h2 style="font-size:var(--font-size-lg);margin:1.5rem 0 0.5rem">3. المحتوى المحظور</h2>
          <p style="color:var(--text-secondary);line-height:1.8">
            يُمنع منعاً باتاً نشر أي عروض أو منتجات أو صور تخالف القوانين أو الآداب العامة أو تتضمن معلومات مضللة.
          </p>
        </div>
      </div>
    `;
  }
}

export async function renderContactPage($container, { user }) {
  const settings = await getSettings();
  const waLink = settings?.contact?.whatsappLink || 'https://wa.me/wasendernew';

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          📧 تواصل معنا
        </h1>
        <p style="color:rgba(255,255,255,0.8);max-width:540px;margin:0 auto">
          يسعدنا تواصلكم واستقبال استفساراتكم واقتراحاتكم لتطوير منصة المنزلة وناسها
        </p>
      </div>
    </div>

    <div class="container section" style="max-width:680px">
      <div class="form-section animate-fade-in-up">
        
        <div style="text-align:center;margin-bottom:var(--space-6)">
          <div style="font-size:3rem;margin-bottom:var(--space-2)">💬</div>
          <h2 style="font-size:var(--font-size-xl);margin-bottom:var(--space-2)">تواصل مباشر عبر WhatsApp</h2>
          <p style="color:var(--text-muted);font-size:var(--font-size-sm)">أسرع وسيلة للرد على استفساراتكم وطلبات التوثيق والإعلانات</p>
          <a href="${escAttr(waLink)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg" style="margin-top:var(--space-4)">
            💬 فتح محادثة WhatsApp
          </a>
        </div>

        <div class="divider"></div>

        <h3 style="font-size:var(--font-size-base);font-weight:700;margin-bottom:var(--space-4)">أو أرسل لنا رسالة سريعة</h3>
        <form id="contact-form">
          <div class="form-group">
            <label class="form-label">الاسم</label>
            <input type="text" id="c-name" class="form-input" required value="${escAttr(user?.name || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">رقم الهاتف أو البريد الإلكتروني</label>
            <input type="text" id="c-contact" class="form-input" required value="${escAttr(user?.email || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">نص الرسالة</label>
            <textarea id="c-msg" class="form-textarea" required placeholder="اكتب استفسارك أو طلبك هنا..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="btn-send-contact">
            إرسال الرسالة
          </button>
        </form>

      </div>
    </div>
  `;

  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('c-name')?.value;
    const msg = document.getElementById('c-msg')?.value;
    toast.success('شكراً لتواصلك! سيتم الرد عليك في أقرب وقت.');
    const text = encodeURIComponent(`رسالة من موقع المنزلة وناسها:\nالاسم: ${name}\nالرسالة: ${msg}`);
    window.open(`${waLink}?text=${text}`, '_blank');
  });
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
