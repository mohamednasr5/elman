/**
 * NeedServiceModal.js
 * خدمة «محتاج خدمة» — Privacy-First Service Request Dispatcher
 */

import { createServiceRequest } from '../../services/interactive-hub.service.js';
import { getCurrentUser } from '../../core/auth.js';
import { showModal } from './Modal.js';
import { toast } from './Toast.js';

export function openNeedServiceModal(onCreated) {
  const user = getCurrentUser();

  if (!user) {
    showModal({
      title: 'تسجيل الدخول مطلوب',
      size: 'sm',
      content: `
        <div style="text-align:center;padding:16px 8px">
          <div style="font-size:2.8rem;margin-bottom:12px">🔐</div>
          <h3 style="font-size:1.15rem;font-weight:900;color:var(--text-primary);margin:0 0 8px">
            تسجيل الدخول مطلوب أولاً
          </h3>
          <p style="font-size:0.88rem;color:var(--text-muted);line-height:1.6;margin:0 0 20px">
            حفاظاً على مصداقية طلبات الخدمات بالدليل، ومتابعة عروض الفنيين والقدرة على إغلاق أو حذف طلبك عند العثور على فني، يرجى تسجيل الدخول بحسابك.
          </p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <a href="login.html?redirect=${encodeURIComponent(location.pathname + location.search)}" class="btn btn-primary" style="padding:12px;border-radius:12px;font-weight:800;font-size:0.95rem;justify-content:center;display:flex;align-items:center;gap:6px">
              <span>تسجيل الدخول / إنشاء حساب</span>
              <span>←</span>
            </a>
            <button type="button" class="btn btn-ghost btn-sm" onclick="document.querySelector('.modal-overlay')?.remove()" style="color:var(--text-muted);margin-top:4px">
              إلغاء
            </button>
          </div>
        </div>
      `
    });
    return;
  }

  showModal({
    title: 'طلبات الخدمات — اطلب خدمة أو صنايعي الآن',
    size: 'md',
    content: `
      <form id="need-service-form" style="display:flex;flex-direction:column;gap:14px;text-align:right">
        
        <!-- Privacy Seal Banner -->
        <div style="background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border:1.5px solid #86efac;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;color:#166534">
          <span style="font-size:1.4rem">🛡️</span>
          <div style="font-size:0.82rem;line-height:1.4">
            <strong>خصوصيتك محمية 100%:</strong> لن يظهر رقم هاتفك علناً في الدليل، وسنتيح التواصل وتقديم العروض فقط للفنيين المناسبين لطلبك.
          </div>
        </div>

        <div>
          <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">عنوان احتياجك باختصار *</label>
          <input type="text" id="req-title" required class="form-control" placeholder="مثال: محتاج سباك لإصلاح تسريب مياه بالحمام" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">نوع الخدمة المطلوبة *</label>
            <select id="req-category" class="form-control" required style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1">
              <option value="سباكة وصحي">سباكة وصحي</option>
              <option value="كهرباء منازل">كهرباء منازل</option>
              <option value="نقاشة ودهانات">نقاشة ودهانات</option>
              <option value="نجارة وأبواب">نجارة وأبواب</option>
              <option value="صيانة تكييف وتبريد">تكييف وتبريد</option>
              <option value="صيانة أجهزة منزلية">صيانة أجهزة منزلية</option>
              <option value="ألوميتال وشبابيك">ألوميتال وشبابيك</option>
              <option value="ونش إنقاذ وسيارة">ونش وسيارات</option>
              <option value="تنظيف ونقل أثاث">تنظيف ونقل أثاث</option>
              <option value="أخرى">خدمة أخرى</option>
            </select>
          </div>

          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">المنطقة أو القرية *</label>
            <select id="req-village" class="form-control" required style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1">
              <option value="المنزلة - وسط البلد">المنزلة - وسط البلد</option>
              <option value="المنزلة - حي الفردوس">المنزلة - حي الفردوس</option>
              <option value="المنزلة - حي المسالخ">المنزلة - حي المسالخ</option>
              <option value="المطرية">المطرية دقهلية</option>
              <option value="قرية العزيزة">قرية العزيزة</option>
              <option value="قرية البصراط">قرية البصراط</option>
              <option value="قرية الشبول">قرية الشبول</option>
              <option value="قرية العصافرة">قرية العصافرة</option>
              <option value="قرية النسايمة">قرية النسايمة</option>
              <option value="قرية الفروسات">قرية الفروسات</option>
              <option value="قرية ميت شريف">قرية ميت شريف</option>
              <option value="قرية الأحمدية">قرية الأحمدية</option>
              <option value="قرية أولاد حانا">قرية أولاد حانا</option>
              <option value="قرية أخرى بالمنزلة">قرية أخرى بالمنزلة</option>
            </select>
          </div>
        </div>

        <div>
          <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">الوقت المفضل لتنفيذ الخدمة</label>
          <select id="req-timing" class="form-control" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1">
            <option value="عاجل الآن (طوارئ)">عاجل الآن (طوارئ)</option>
            <option value="اليوم صباحاً">اليوم صباحاً</option>
            <option value="اليوم مساءً">اليوم مساءً</option>
            <option value="غداً صباحاً" selected>غداً صباحاً</option>
            <option value="خلال الأيام القادمة">خلال الأيام القادمة</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">تفاصيل المشكلة أو الشغل المطلوب</label>
          <textarea id="req-description" rows="3" class="form-control" placeholder="اكتب تفاصيل إضافية تساعد الفني في تقييم الوقت وقطع الغيار المطلوبة..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1"></textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">اسمك الكريم *</label>
            <input type="text" id="req-user-name" required class="form-control" value="${user?.name || ''}" placeholder="مثال: أحمد مصطفى" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
          </div>
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">رقم هاتفك للتواصل *</label>
            <input type="tel" id="req-user-phone" required class="form-control" placeholder="01xxxxxxxxx" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
          </div>
        </div>

        <div style="margin-top:8px">
          <button type="submit" id="btn-submit-need" class="btn btn-primary" style="width:100%;padding:12px;border-radius:10px;font-weight:800;font-size:1rem">
            📢 نشر طلبي واستقبال العروض
          </button>
        </div>
      </form>
    `
  });

  const form = document.getElementById('need-service-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-need');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري إرسال طلبك...'; }

    const title = document.getElementById('req-title')?.value.trim();
    const category = document.getElementById('req-category')?.value;
    const village = document.getElementById('req-village')?.value;
    const timing = document.getElementById('req-timing')?.value;
    const description = document.getElementById('req-description')?.value.trim();
    const userName = document.getElementById('req-user-name')?.value.trim();
    const userPhone = document.getElementById('req-user-phone')?.value.trim();

    try {
      const res = await createServiceRequest({
        title,
        category,
        village,
        timing,
        description,
        userName,
        userPhone,
        userId: user?.uid
      });

      if (res?.success) {
        toast.success('تم نشر طلبك بنجاح! سيتواصل معك الفنيون المناسبون.');
        document.querySelector('.modal-overlay')?.remove();
        if (typeof onCreated === 'function') onCreated();
      } else {
        toast.error(res?.error || 'تعذر إرسال الطلب');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '📢 نشر طلبي واستقبال العروض'; }
    }
  });
}
