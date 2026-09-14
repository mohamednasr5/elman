/**
 * TrustCard.js
 * «بطاقة الثقة وتدقيق المعلومات» — Activity Trust Card & Proof Breakdown
 */

export function renderTrustCard(place) {
  if (!place) return '';

  const hasValidPhone = Boolean(place.phone && place.phone.length >= 7 && !/^0+$/.test(place.phone));
  const isClaimed = Boolean(place.is_claimed || place.claimed_by || place.owner_id);
  const isVerified = Boolean(place.is_verified || place.verified || place.isVerified);
  const hasHours = Boolean(place.opening_hours || place.working_hours || place.workingHours);

  const rawArea = String(place.area || place.city || place.address || 'المنزلة والمطرية').trim();
  let areaDisplay = rawArea;
  if (!areaDisplay.startsWith('ب') && !areaDisplay.startsWith('في ') && !areaDisplay.startsWith('ف')) {
    areaDisplay = areaDisplay.startsWith('ال') ? `ب${areaDisplay}` : `بـ ${areaDisplay}`;
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const placeName = place.name || 'هذا المكان';
  const waBase = String(place.adminWhatsapp || 'https://wa.me/wasendernew').trim();
  const waMessage = encodeURIComponent(`مرحباً، أنا صاحب مكان "${placeName}" وأود ربط المكان بحسابي على منصة المنزلة وناسها.`);
  const waUrl = waBase.includes('?') ? `${waBase}&text=${waMessage}` : `${waBase}?text=${waMessage}`;
  const verificationUrl = `/contact.html?topic=verification&place=${encodeURIComponent(placeName)}#pricing`;

  return `
    <div class="trust-card-container">
      <div class="trust-card-header">
        <h4 class="trust-card-title">
          <span>🛡️</span>
          <span>بطاقة الثقة وتدقيق المعلومات</span>
        </h4>
        <div class="trust-card-score">
          <span>${isVerified ? 'موثق ومراجع بالدليل' : 'معتمد ومراجع بالدليل'}</span>
          <span>✓</span>
        </div>
      </div>

      <div class="trust-card-grid">
        <div class="trust-metric-item">
          <div class="trust-metric-icon">📞</div>
          <div class="trust-metric-content">
            <h5>رقم الهاتف والتواصل</h5>
            <p>${hasValidPhone ? `<span class="trust-metric-verified-tag">✓ رقم مفعل ومؤكد</span><br />خضع للتحقق الدوري من فريق الدليل` : `<span style="color:#d97706">⚠️ غير مؤكد حالياً</span><br />يمكنك اقتراح رقم صحيح للمكان`}</p>
          </div>
        </div>

        <div class="trust-metric-item">
          <div class="trust-metric-icon">📍</div>
          <div class="trust-metric-content">
            <h5>الموقع الجغرافي والفرع</h5>
            <p><span class="trust-metric-verified-tag">✓ موقع فعلي ${esc(areaDisplay)}</span><br />مطابق للعنوان الميداني والمعالم المحيطة</p>
          </div>
        </div>

        <div class="trust-metric-item">
          <div class="trust-metric-icon">👤</div>
          <div class="trust-metric-content">
            <h5>إدارة النشاط التجاري</h5>
            <p>${isClaimed ? `<span class="trust-metric-verified-tag">✓ مدار رسمياً بواسطة المالك</span><br />بيانات وتحديثات مباشرة من الإدارة` : `<span>مضاف وموثق بواسطة فريق التحرير</span><br />متاح لصاحب النشاط استلام إدارته`}</p>
          </div>
        </div>

        <div class="trust-metric-item">
          <div class="trust-metric-icon">⏰</div>
          <div class="trust-metric-content">
            <h5>مواعيد العمل والخدمة</h5>
            <p>${hasHours ? `<span class="trust-metric-verified-tag">✓ مواعيد عمل مدققة</span><br />محدثة وفق جدول النشاط الأسبوعي` : `<span>مواعيد العمل بحاجة لتأكيد إضافي</span><br />يُرجى الاتصال قبل التوجه`}</p>
          </div>
        </div>
      </div>

      <div class="trust-card-actions" aria-label="إجراءات التوثيق وإدارة المكان">
        <div class="trust-card-actions__message">
          <strong>${isVerified ? '🛡️ المكان موثق رسميًا' : '✨ وثّق مكانك واستفد من مزايا التوثيق'}</strong>
          <span>${isVerified ? 'التوثيق يعزز الثقة ويمنح الملف حضورًا ومصداقية أكبر.' : 'العلامة الموثقة تعزز الثقة وتمنحك مميزات إضافية وتساعد ملفك على الظهور قبل الجميع.'}</span>
        </div>
        <div class="trust-card-actions__buttons">
          <a href="${verificationUrl}" class="trust-card-action trust-card-action--verify" id="trust-card-request-verification">
            <span>🛡️</span><span>${isVerified ? 'معلومات ومزايا التوثيق' : 'طلب التوثيق الآن'}</span>
          </a>
          <a href="${esc(waUrl)}" target="_blank" rel="noopener" class="trust-card-action trust-card-action--claim" id="trust-card-claim-place" title="أنا صاحب المكان — اطلب إدارته عبر WhatsApp">
            <span>👤</span><span>أنا صاحب المكان — اطلب إدارته</span>
          </a>
        </div>
      </div>

      <div class="trust-card-charter">
        <span>⚖️ <strong>ميثاق النزاهة:</strong> التقييمات تخضع لفلترة الحسابات الوهمية لحماية سمعة الأنشطة وحقوق الزوار.</span>
        <a href="#/contact">أبلغ عن معلومة بحاجة لتحديث ↗</a>
      </div>
    </div>
  `;
}
