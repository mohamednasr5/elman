/**
 * AppointmentModal.js
 * خدمة «حجز وطلب موعد» — Booking and Appointment Request Modal
 */

import { createAppointment } from '../../services/interactive-hub.service.js';
import { getCurrentUser } from '../../core/auth.js';
import { sendTelegramAdminNotification } from '../../core/db.js';
import { showModal } from './Modal.js';
import { toast } from './Toast.js';

export function openAppointmentModal(place) {
  if (!place) return;
  const user = getCurrentUser();

  showModal({
    title: `طلب حجز موعد لدى ${place.name}`,
    size: 'md',
    content: `
      <form id="appointment-booking-form" style="display:flex;flex-direction:column;gap:14px;text-align:right">
        
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:12px;font-size:0.84rem;color:#0369a1;line-height:1.5">
          📅 حدد موعدك المفضل وسنقوم بتسجيل طلبك وإرسال تأكيد الحجز مباشرة لإدارة المكان عبر الواتساب.
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">التاريخ المفضل *</label>
            <input type="date" id="apt-date" required class="form-control" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
          </div>
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">الفترة المفضلة *</label>
            <select id="apt-time" class="form-control" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1">
              <option value="صباحاً (10 ص - 2 ظ)">صباحاً (10 ص - 2 ظ)</option>
              <option value="مساءً (5 م - 9 م)" selected>مساءً (5 م - 9 م)</option>
              <option value="طوارئ / أول موعد متاح">أول موعد متاح</option>
            </select>
          </div>
        </div>

        <div>
          <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">الخدمة أو سبب الزيارة</label>
          <input type="text" id="apt-service" class="form-control" placeholder="مثال: كشف، استشارة، صيانة..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">اسمك الكريم *</label>
            <input type="text" id="apt-name" required class="form-control" value="${user?.name || ''}" placeholder="اسم العميل" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
          </div>
          <div>
            <label style="display:block;font-weight:700;font-size:0.88rem;margin-bottom:6px">رقم هاتفك للتأكيد *</label>
            <input type="tel" id="apt-phone" required class="form-control" placeholder="01xxxxxxxxx" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1" />
          </div>
        </div>

        <div style="margin-top:10px">
          <button type="submit" id="btn-submit-apt" class="btn btn-primary" style="width:100%;padding:12px;border-radius:10px;font-weight:800;font-size:1rem">
            ✅ تأكيد وإرسال طلب الحجز
          </button>
        </div>
      </form>
    `
  });

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateInput = document.getElementById('apt-date');
  if (dateInput) {
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  const form = document.getElementById('appointment-booking-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-apt');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري إرسال الطلب...'; }

    const date = document.getElementById('apt-date')?.value;
    const time = document.getElementById('apt-time')?.value;
    const service = document.getElementById('apt-service')?.value.trim();
    const name = document.getElementById('apt-name')?.value.trim();
    const phone = document.getElementById('apt-phone')?.value.trim();

    try {
      await createAppointment({
        placeId: place.id,
        placeName: place.name,
        clientName: name,
        clientPhone: phone,
        preferredDate: date,
        preferredTime: time,
        serviceNeeded: service
      });

      sendTelegramAdminNotification('appointment_booking', {
        placeId: place.id,
        placeName: place.name,
        clientName: name,
        clientPhone: phone,
        preferredDate: date,
        preferredTime: time,
        serviceNeeded: service
      }).catch(() => {});

      toast.success('تم تسجيل طلب حجزك بنجاح!');
      document.querySelector('.modal-overlay')?.remove();

      // If place has whatsapp, prompt direct whatsapp confirmation
      const waRaw = (place.whatsapp || place.phone || '').replace(/[^0-9]/g, '');
      if (waRaw && waRaw.length >= 10) {
        const digits = waRaw.replace(/^0+/, '');
        const msg = `السلام عليكم، أنا ${name} وأود تأكيد حجز موعد لدى ${place.name} ليوم ${date} فترة (${time}) بخصوص: ${service || 'كشف/خدمة'}. تم تقديم الطلب عبر دليل المنزلة.`;
        const waUrl = `https://wa.me/20${digits}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ طلب الحجز');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '✅ تأكيد وإرسال طلب الحجز'; }
    }
  });
}
