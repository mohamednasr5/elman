/**
 * المنزلة وناسها — System Health & Diagnostics Page
 */

import { AdminService } from '../services/admin.service.js';
import { toast } from '../components/toast.js';

export async function renderSystemHealthPage(container) {
  container.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">صحة النظام والخدمات السحابية</h1>
        <p class="admin-page-desc">مراقبة فورية لأداء وزمن استجابة قواعد البيانات ومخازن الملفات والخوادم</p>
      </div>
      <div class="admin-page-actions">
        <button type="button" class="btn btn-secondary" id="btn-run-health-check">↻ فحص فوري شامل</button>
      </div>
    </div>

    <div class="admin-card mb-4" id="overall-status-card">
      <div class="overall-status-banner status-banner-loading">
        <div class="spinner"></div>
        <div>
          <h3>جاري فحص جميع الخدمات...</h3>
          <p>يتم قياس زمن الاستجابة لكل مكون سحابي على حدة</p>
        </div>
      </div>
    </div>

    <!-- Health Grid -->
    <div class="health-services-grid" id="health-services-grid">
      <!-- Injected via loadHealth -->
    </div>
  `;

  const btn = container.querySelector('#btn-run-health-check');
  btn.addEventListener('click', () => loadHealth(container));

  await loadHealth(container);
}

async function loadHealth(container) {
  const overallBanner = container.querySelector('#overall-status-card');
  const grid = container.querySelector('#health-services-grid');

  overallBanner.innerHTML = `
    <div class="overall-status-banner status-banner-loading">
      <div class="spinner"></div>
      <div>
        <h3>جاري اختبار الاتصال بالخوادم وقواعد البيانات...</h3>
        <p>يتم إرسال نبضات فحص (Ping / Query Probe) وقياس زمن الاستجابة بالميللي ثانية</p>
      </div>
    </div>
  `;

  try {
    const data = await AdminService.getSystemHealth();
    renderOverallStatus(overallBanner, data);
    renderServiceCards(grid, data);
  } catch (err) {
    console.error(err);
    toast.error('فشل إجراء فحص صحة النظام');
    overallBanner.innerHTML = `
      <div class="overall-status-banner status-banner-outage">
        <span class="status-big-icon">⚠</span>
        <div>
          <h3>فشل الاتصال بخادم الحوسبة (Worker Outage)</h3>
          <p>${escapeHtml(err.message || 'تعذر الوصول إلى نقطة فحص النظام')}</p>
        </div>
      </div>
    `;
  }
}

function renderOverallStatus(container, data) {
  const isOk = data.status === 'OPERATIONAL';
  const isDegraded = data.status === 'DEGRADED';

  const bannerClass = isOk ? 'status-banner-operational' : (isDegraded ? 'status-banner-degraded' : 'status-banner-outage');
  const icon = isOk ? '✓' : (isDegraded ? '⚠' : '✕');
  const title = isOk ? 'جميع الأنظمة والخدمات تعمل بكفاءة تامة' : (isDegraded ? 'أداء منخفض في بعض المكونات السحابية' : 'عطل جزئي أو كلي في إحدى الخدمات الرئيسية');

  container.innerHTML = `
    <div class="overall-status-banner ${bannerClass}">
      <span class="status-big-icon">${icon}</span>
      <div>
        <h3>${title}</h3>
        <p>تاريخ آخر فحص: ${new Date(data.timestamp || Date.now()).toLocaleTimeString('ar-EG')} • موقع خادم التوجيه: Cloudflare Edge (${escapeHtml(data.worker?.colo || 'Local')})</p>
      </div>
    </div>
  `;
}

function renderServiceCards(container, data) {
  const services = [
    {
      name: 'قاعدة بيانات Turso (libSQL)',
      type: 'Database',
      icon: '🗄️',
      status: data.turso?.status || 'UNKNOWN',
      latency: data.turso?.latency_ms,
      desc: 'قاعدة البيانات الأساسية للمحلات والمستخدمين والمنتجات والتقييمات',
      notes: data.turso?.status === 'OPERATIONAL' ? 'الاتصال مستقر ويدعم الاستعلامات المتزامنة' : (data.turso?.error || 'تعذر الاتصال بقاعدة البيانات')
    },
    {
      name: 'مخزن الملفات والوسائط Cloudflare R2',
      type: 'Object Storage',
      icon: '📦',
      status: data.r2?.status || 'UNKNOWN',
      latency: data.r2?.latency_ms,
      desc: 'تخزين صور المحلات، المنتجات، والوثائق عبر CDN عام فائق السرعة',
      notes: data.r2?.status === 'OPERATIONAL' ? 'المخزن متاح ويدعم الرفع والاسترجاع المباشر' : 'خطأ في قراءة مخزن R2'
    },
    {
      name: 'خادم الحوسبة الطرفي Cloudflare Worker',
      type: 'Serverless Edge API',
      icon: '⚡',
      status: data.worker?.status || 'UNKNOWN',
      latency: data.worker?.latency_ms,
      desc: 'معالجة وتأمين جميع طلبات الـ API والتحقق من صلاحيات المشرفين',
      notes: `نقطة التواجد (Colo): ${escapeHtml(data.worker?.colo || 'Local')} • الإصدار: v2.0 Production`
    },
    {
      name: 'خدمة إشعارات الهواتف (Firebase FCM)',
      type: 'Push Messaging',
      icon: '🔔',
      status: data.fcm?.status || 'UNKNOWN',
      latency: data.fcm?.latency_ms,
      desc: 'بث تنبيهات الويب الفورية لأجهزة المشتركين والمحلات',
      notes: data.fcm?.status === 'OPERATIONAL' ? 'المفاتيح والـ Endpoints مهيأة بشكل صحيح' : 'مراجعة مفاتيح وتصاريح FCM'
    }
  ];

  container.innerHTML = services.map(s => {
    const isOk = s.status === 'OPERATIONAL';
    const statusClass = isOk ? 'service-ok' : 'service-err';
    return `
      <div class="service-health-card ${statusClass}">
        <div class="service-card-top">
          <span class="service-icon">${s.icon}</span>
          <div class="service-title-meta">
            <strong>${escapeHtml(s.name)}</strong>
            <small class="text-muted">${escapeHtml(s.type)}</small>
          </div>
          <span class="service-badge badge-${isOk ? 'success' : 'danger'}">${isOk ? 'يعمل' : 'خلل'}</span>
        </div>

        <div class="service-card-middle">
          <div class="service-latency">
            <span class="latency-label">زمن الاستجابة:</span>
            <strong class="latency-value ${s.latency > 500 ? 'text-warning' : 'text-success'}">
              ${s.latency !== undefined && s.latency !== null ? `${s.latency} ms` : 'غير متاح'}
            </strong>
          </div>
          <p class="service-desc">${escapeHtml(s.desc)}</p>
        </div>

        <div class="service-card-bottom">
          <span class="service-notes ${isOk ? 'text-muted' : 'text-danger'}">${escapeHtml(s.notes)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
