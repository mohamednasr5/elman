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
            باستخدامك لمنصة <strong>دليل المنزلة والمطرية الرقمي</strong>، فإنك توافق على الالتزام بالشروط والأحكام التالية:
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
  } else if (type === 'legal') {
    $container.innerHTML = `
      <div class="container section" style="max-width:860px;margin:0 auto;padding:var(--space-6) 16px">
        <div class="form-section animate-fade-in" style="background:var(--surface);border-radius:24px;border:1px solid var(--border);padding:32px 28px;box-shadow:0 10px 35px rgba(0,0,0,0.05)">
          
          <!-- Header Hero Badge -->
          <div style="text-align:center;margin-bottom:28px">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:20px;background:rgba(27,79,114,0.1);color:var(--primary);font-size:2rem;margin-bottom:12px;border:1.5px solid rgba(27,79,114,0.25)">
              ⚖️
            </div>
            <h1 style="color:var(--primary);font-size:1.8rem;font-weight:800;margin-bottom:6px">
              السياسة القانونية وإخلاء المسؤولية
            </h1>
            <div style="font-size:1.05rem;font-weight:700;color:var(--secondary,#F5A623);margin-bottom:8px">
              دليل المنزلة والمطرية الرقمي
            </div>
            <span class="badge" style="background:var(--surface-2);color:var(--text-muted);font-size:12px;font-weight:700;padding:4px 12px;border-radius:9999px;border:1px solid var(--border)">
              📅 تاريخ آخر تحديث: سبتمبر 2026
            </span>
          </div>

          <div style="background:rgba(2,132,199,0.06);border:1.5px solid rgba(2,132,199,0.2);border-radius:16px;padding:18px;margin-bottom:28px;line-height:1.8;color:var(--text-primary)">
            مرحبًا بكم في <strong>«دليل المنزلة والمطرية الرقمي»</strong>، المنصة المحلية التي تهدف إلى جمع الأماكن والأنشطة والخدمات والمعلومات التي تهم أهالي المنزلة والمطرية والقرى والمناطق المحيطة بهما، وتسهيل الوصول إليها بصورة رقمية حديثة.
            <div style="margin-top:10px;font-weight:700;color:#0369A1">
              استخدامك للمنصة أو تصفحك للمحتوى المنشور عليها يعني اطلاعك وموافقتك الكاملة على البنود القانونية التالية:
            </div>
          </div>

          <div class="legal-articles" style="display:flex;flex-direction:column;gap:20px;line-height:1.85;color:var(--text-secondary)">
            
            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>📌</span> أولًا: مسؤولية المحتوى المنشور
              </h2>
              <p style="margin:0">
                جميع البيانات والمعلومات والأوصاف والتقييمات والآراء والتعليقات والصور وأرقام التواصل وغيرها من المحتويات التي يتم نشرها على دليل المنزلة والمطرية الرقمي تعبّر عن مسؤولية ناشرها أو المستخدم الذي قام بإضافتها، ولا تمثل بالضرورة رأي أو موقف إدارة المنصة.
              </p>
              <p style="margin:8px 0 0 0">
                وتبذل إدارة المنصة جهدًا معقولًا لمتابعة المحتوى المنشور، إلا أنها لا تضمن أن جميع البيانات المقدمة من المستخدمين صحيحة أو مكتملة أو محدثة في جميع الأوقات.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>🏪</span> ثانيًا: إضافة الأماكن والمنشآت
              </h2>
              <p style="margin:0">
                تتيح المنصة للمستخدمين إمكانية إضافة الأماكن والمنشآت والخدمات والمواقع إلى الدليل.
              </p>
              <p style="margin:8px 0 0 0">
                وبالتالي، فإن ظهور أي محل أو شركة أو مطعم أو طبيب أو مكتب أو مؤسسة أو خدمة أو أي مكان آخر على الدليل لا يعني بالضرورة أن إدارة المنصة قامت بإنشائه أو اعتماده أو تزكيته أو التعاقد معه.
              </p>
              <p style="margin:8px 0 0 0">
                كما أن بيانات المكان قد تكون أُضيفت بواسطة صاحب النشاط أو أحد المستخدمين، وقد تخضع للتعديل أو التحديث بمرور الوقت.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>🛡️</span> ثالثًا: دور إدارة المنصة
              </h2>
              <p style="margin:0">
                يقتصر دور إدارة دليل المنزلة والمطرية الرقمي بصورة أساسية على إدارة وتشغيل المنصة، وتنظيم المحتوى، ومتابعة البلاغات، والإشراف على المحتوى المنشور، واتخاذ الإجراءات المناسبة تجاه المحتوى الذي يخالف شروط الاستخدام أو القوانين واللوائح المعمول بها.
              </p>
              <p style="margin:8px 0 0 0">
                ولا تتحمل إدارة المنصة مسؤولية مباشرة عن كل معلومة أو رأي أو تقييم أو إعلان أو وصف يقوم أحد المستخدمين بإضافته.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>🗑️</span> رابعًا: حذف أو تعديل الأماكن والمحتوى
              </h2>
              <p style="margin:0">
                نظرًا لأن المنصة تتيح للمستخدمين إضافة الأماكن والمعلومات، فقد يظهر على الدليل محتوى تم إنشاؤه بواسطة مستخدمين مستقلين عن إدارة المنصة.
              </p>
              <p style="margin:8px 0 0 0">
                ولا يُفهم وجود أي مكان أو نشاط على الدليل على أنه اعتماد رسمي أو تزكية من إدارة المنصة.
              </p>
              <p style="margin:8px 0 0 0">
                ويحق لإدارة المنصة، وفقًا لسياساتها وإمكاناتها ووفقًا للقوانين المعمول بها، مراجعة المحتوى واتخاذ ما تراه مناسبًا بشأن المحتوى المخالف، بما في ذلك التعديل أو الإخفاء أو الحذف أو تقييد الوصول إليه.
              </p>
              <p style="margin:8px 0 0 0">
                كما يمكن للمستخدمين الإبلاغ عن أي محتوى يرونه غير لائق أو مخالفًا للقوانين أو لسياسة المنصة.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--danger,#EF4444);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>🚫</span> خامسًا: المحتوى غير المقبول
              </h2>
              <p style="margin:0 0 8px 0">
                لا تسمح المنصة بنشر أو الترويج للمحتوى الذي يتضمن، على سبيل المثال لا الحصر:
              </p>
              <ul style="margin:0;padding-right:20px;display:flex;flex-direction:column;gap:6px">
                <li>المحتوى الفاضح أو المنافي للآداب العامة.</li>
                <li>الإساءة أو التشهير أو التهديد أو التحريض على العنف.</li>
                <li>خطاب الكراهية أو التحريض ضد فئة من المجتمع.</li>
                <li>المحتوى الذي ينتهك حقوق الآخرين أو خصوصيتهم.</li>
                <li>المعلومات الاحتيالية أو المضللة بصورة متعمدة.</li>
                <li>المحتوى المخالف للقوانين واللوائح المصرية المعمول بها.</li>
                <li>أي محتوى ترى إدارة المنصة أنه غير مناسب لطبيعة الدليل أو يضر بالمستخدمين أو بالمجتمع.</li>
              </ul>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>⭐</span> سادسًا: الآراء والتقييمات
              </h2>
              <p style="margin:0">
                التقييمات والتعليقات والآراء المنشورة من المستخدمين تمثل وجهات نظر أصحابها فقط.
              </p>
              <p style="margin:8px 0 0 0">
                ولا تتحمل إدارة دليل المنزلة والمطرية الرقمي مسؤولية اعتبار هذه الآراء حقائق مؤكدة، كما لا يعني نشر تقييم إيجابي أو سلبي أن الإدارة تتفق معه.
              </p>
              <p style="margin:8px 0 0 0">
                ويُنصح دائمًا بالتحقق من المعلومات المهمة مباشرة من مقدم الخدمة أو الجهة المعنية قبل اتخاذ أي قرار.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>📞</span> سابعًا: البيانات وأرقام التواصل
              </h2>
              <p style="margin:0">
                قد تتغير أرقام الهواتف والعناوين ومواعيد العمل والأسعار والخدمات وغيرها من بيانات المنشآت بمرور الوقت.
              </p>
              <p style="margin:8px 0 0 0">
                لذلك لا تضمن المنصة استمرار دقة جميع البيانات المنشورة، وتسعى إلى تحديث المعلومات وتصحيح الأخطاء كلما تم الإبلاغ عنها أو اكتشافها.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>⚖️</span> ثامنًا: الالتزام بالقوانين المصرية
              </h2>
              <p style="margin:0">
                تلتزم منصة دليل المنزلة والمطرية الرقمي باحترام القوانين واللوائح المصرية المعمول بها، وتتعاون مع الجهات المختصة متى كان ذلك مطلوبًا قانونًا، مع مراعاة الإجراءات والضوابط القانونية ذات الصلة.
              </p>
              <p style="margin:8px 0 0 0">
                ولا تهدف المنصة إلى تقديم أي محتوى أو خدمة تتعارض مع القوانين المصرية أو النظام العام أو الآداب العامة.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border);background:rgba(245,166,35,0.06);border-radius:14px;padding:16px;border:1px solid rgba(245,166,35,0.25)">
              <h2 style="font-size:1.15rem;font-weight:800;color:#B45309;margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>🇪🇬</span> تاسعًا: رسالتنا تجاه مصر
              </h2>
              <p style="margin:0;color:var(--text-primary)">
                دليل المنزلة والمطرية الرقمي مشروع مصري محلي نابع من حبنا لبلدنا وأهلنا، ونسعى من خلاله إلى دعم أصحاب الأعمال والحرف والخدمات، وتشجيع النشاط التجاري والسياحي والمجتمعي، والمساهمة في التحول الرقمي وخدمة أهالي المنطقة.
              </p>
              <p style="margin:8px 0 0 0;color:var(--text-primary)">
                ونؤمن بأن التكنولوجيا يمكن أن تكون وسيلة حقيقية لخدمة المجتمع، وربط المواطنين بأصحاب الخدمات والأعمال، والمساهمة في بناء مستقبل أفضل لمصر.
              </p>
              <p style="margin:8px 0 0 0;color:var(--text-primary)">
                ونحن نعتز بمصر وشعبها ومؤسساتها، وندعم كل جهد وطني يستهدف التنمية والاستقرار والتقدم والارتقاء بمستقبل الوطن، ونسعى إلى أن يكون دليل المنزلة والمطرية الرقمي منصة إيجابية تخدم المجتمع وتدعم التنمية المحلية.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>📋</span> عاشرًا: حدود المسؤولية
              </h2>
              <p style="margin:0">
                باستخدامك للمنصة، فإنك تقر بأن المحتوى الذي ينشئه المستخدمون قد لا يكون صادرًا عن إدارة الدليل، وأن مسؤولية التحقق من المعلومات قبل الاعتماد عليها تقع على المستخدم، خصوصًا في الأمور التجارية أو المالية أو الطبية أو القانونية أو غيرها من المجالات التي تتطلب التحقق من مصدر متخصص.
              </p>
              <p style="margin:8px 0 0 0">
                ولا يُعد إدراج أي نشاط أو منشأة في الدليل شهادة أو ترخيصًا أو اعتمادًا رسميًا من إدارة المنصة.
              </p>
            </div>

            <div style="padding-bottom:18px;border-bottom:1px solid var(--border)">
              <h2 style="font-size:1.15rem;font-weight:800;color:var(--primary);margin:0 0 8px 0;display:flex;align-items:center;gap:8px">
                <span>🚨</span> الحادي عشر: الإبلاغ عن المخالفات
              </h2>
              <p style="margin:0">
                إذا وجدت أي محتوى تعتقد أنه مخالف للقانون أو للآداب العامة أو لسياسات المنصة، يمكنك الإبلاغ عنه من خلال وسائل التواصل المتاحة داخل الدليل.
              </p>
              <p style="margin:8px 0 0 0">
                وتقوم إدارة المنصة بمراجعة البلاغات واتخاذ الإجراء المناسب وفق طبيعة المحتوى والظروف المحيطة به والقوانين والسياسات المعمول بها.
              </p>
            </div>

            <!-- Important Notice Banner -->
            <div style="background:linear-gradient(135deg, #0B2239 0%, #1B4F72 100%);color:#fff;border-radius:16px;padding:20px;border:1.5px solid rgba(245,166,35,0.4);box-shadow:0 8px 25px rgba(11,34,57,0.3)">
              <h3 style="font-size:1.2rem;font-weight:800;color:#FDE68A;margin:0 0 10px 0;display:flex;align-items:center;gap:8px">
                <span>⚠️</span> تنويه مهم
              </h3>
              <p style="margin:0 0 8px 0;font-size:13.5px;color:rgba(255,255,255,0.95);line-height:1.7">
                دليل المنزلة والمطرية الرقمي هو منصة دليل ومعلومات محلية، وليس جهة حكومية أو جهة اعتماد أو جهة رقابية.
              </p>
              <p style="margin:0 0 12px 0;font-size:13.5px;color:rgba(255,255,255,0.95);line-height:1.7">
                وأي ظهور لمكان أو نشاط أو مؤسسة أو شخص أو خدمة داخل المنصة لا يعني أن هذا المكان أو النشاط معتمد أو موصى به من إدارة الدليل، ما لم تنص المنصة صراحة على خلاف ذلك.
              </p>
              <div style="font-size:14px;font-weight:800;color:#F5A623;display:flex;align-items:center;gap:6px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.15)">
                <span>🇪🇬❤️</span>
                <span>نحن نعمل على بناء دليل محلي مفتوح ومفيد لأهالي المنزلة والمطرية والقرى المجاورة، مع الحفاظ على بيئة رقمية محترمة وآمنة وإيجابية للجميع.</span>
              </div>
            </div>

            <!-- Contact & Official Channels Card -->
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;background:var(--surface-2);border:1px solid var(--border);border-radius:16px;padding:16px 20px;margin-top:4px">
              <div>
                <div style="font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:3px">
                  🌐 الموقع الرسمي: <a href="https://dalilmanzala.com/" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:underline">https://dalilmanzala.com/</a>
                </div>
                <div style="font-size:12.5px;color:var(--text-secondary)">
                  للاستفسارات والإقتراحات يرجى التواصل معنا عبر الواتساب
                </div>
              </div>
              <a href="https://wa.me/wasendernew" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm" style="display:inline-flex;align-items:center;gap:6px;font-weight:800;padding:8px 18px;border-radius:9999px">
                <span>💬</span>
                <span>تواصل عبر الواتساب</span>
              </a>
            </div>

            <div style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:10px;font-weight:700">
              © 2026 دليل المنزلة والمطرية الرقمي — جميع الحقوق محفوظة.
            </div>

          </div>

        </div>
      </div>
    `;
  }
}

import { renderContactPage as renderContactPageImpl } from './contact.js';
export async function renderContactPage($container, opts) {
  return renderContactPageImpl($container, opts);
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
