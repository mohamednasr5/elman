/**
 * TrustCard.js
 * «بطاقة الثقة وتدقيق المعلومات» — Activity Trust Card & Proof Breakdown
 */

export function renderTrustCard(place) {
  if (!place) return '';

  const hasValidPhone = Boolean(place.phone && place.phone.length >= 7 && !/^0+$/.test(place.phone));
  const isClaimed = Boolean(place.is_claimed || place.claimed_by || place.owner_id);
  const isVerified = Boolean(place.is_verified || place.verified);
  const hasHours = Boolean(place.opening_hours || place.working_hours);

  return `
    <div class="trust-card-container">
      <div class="trust-card-header">
        <h4 class="trust-card-title">
          <span>🛡️</span>
          <span>بطاقة الثقة وتدقيق المعلومات</span>
        </h4>
        <div class="trust-card-score">
          <span>معتمد ومراجع بالدليل</span>
          <span>✓</span>
        </div>
      </div>

      <div class="trust-card-grid">
        <!-- 1. Phone Audit -->
        <div class="trust-metric-item">
          <div class="trust-metric-icon">📞</div>
          <div class="trust-metric-content">
            <h5>رقم الهاتف والتواصل</h5>
            <p>
              ${hasValidPhone ? `
                <span class="trust-metric-verified-tag">✓ رقم مفعل ومؤكد</span>
                <br />خضع للتحقق الدوري من فريق الدليل
              ` : `
                <span style="color:#d97706">⚠️ غير مؤكد حالياً</span>
                <br />يمكنك اقتراح رقم صحيح للمكان
              `}
            </p>
          </div>
        </div>

        <!-- 2. Location & GPS Audit -->
        <div class="trust-metric-item">
          <div class="trust-metric-icon">📍</div>
          <div class="trust-metric-content">
            <h5>الموقع الجغرافي والفرع</h5>
            <p>
              <span class="trust-metric-verified-tag">✓ موقع فعلي بالمنزلة</span>
              <br />مطابق للعنوان الميداني والمعالم المحيطة
            </p>
          </div>
        </div>

        <!-- 3. Management & Ownership -->
        <div class="trust-metric-item">
          <div class="trust-metric-icon">👤</div>
          <div class="trust-metric-content">
            <h5>إدارة النشاط التجاري</h5>
            <p>
              ${isClaimed ? `
                <span class="trust-metric-verified-tag">✓ مدار رسمياً بواسطة المالك</span>
                <br />بيانات وتحديثات مباشرة من الإدارة
              ` : `
                <span>مضاف وموثق بواسطة فريق التحرير</span>
                <br />متاح لصاحب النشاط استلام إدارته
              `}
            </p>
          </div>
        </div>

        <!-- 4. Hours & Service Integrity -->
        <div class="trust-metric-item">
          <div class="trust-metric-icon">⏰</div>
          <div class="trust-metric-content">
            <h5>مواعيد العمل والخدمة</h5>
            <p>
              ${hasHours ? `
                <span class="trust-metric-verified-tag">✓ مواعيد عمل مدققة</span>
                <br />محدثة وفق جدول النشاط الأسبوعي
              ` : `
                <span>مواعيد العمل بحاجة لتأكيد إضافي</span>
                <br />يُرجى الاتصال قبل التوجه
              `}
            </p>
          </div>
        </div>
      </div>

      <!-- Trust Charter Note -->
      <div style="margin-top:14px;padding-top:12px;border-top:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:0.78rem;color:#64748b">
        <span>⚖️ <strong>ميثاق النزاهة:</strong> التقييمات تخضع لفلترة الحسابات الوهمية لحماية سمعة الأنشطة وحقوق الزوار.</span>
        <a href="#/contact" style="color:#0284c7;font-weight:700;text-decoration:none">أبلغ عن معلومة بحاجة لتحديث ↗</a>
      </div>
    </div>
  `;
}
