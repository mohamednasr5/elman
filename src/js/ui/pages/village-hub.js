/**
 * village-hub.js
 * صفحات القرى بعمق وتغطية الحرفيين ودليل المواصلات والتصويت المجتمعي
 */

import { fetchVillagePolls, voteVillageService, fetchLiveCraftsmen } from '../../services/interactive-hub.service.js';
import { toast } from '../components/Toast.js';

export const VILLAGE_DATA = {
  'al-aziza': {
    name: 'قرية العزيزة',
    desc: 'من كبرى قرى مركز المنزلة، تشتهر بالحركة التجارية والزراعية وتقع على طريق المنزلة - بورسعيد.',
    distanceKm: 4.5,
    station: 'موقف العزيزة بميدان المحطة / الجامع الجديد بالمنزلة',
    fare: '5 - 7 جنيه',
    transitType: 'ميكروباص وسرفيس منتظم حتى منتصف الليل'
  },
  'al-basrat': {
    name: 'قرية البصراط',
    desc: 'قرية عريقة على بحيرة المنزلة تشتهر بالصيد والخدمات والنشاط الحرفي المتنوع.',
    distanceKm: 6.0,
    station: 'موقف البصراط بالمنزلة (شارع البحر)',
    fare: '6 - 8 جنيه',
    transitType: 'ميكروباص وتمناية متوفرة باستمرار'
  },
  'al-shabboul': {
    name: 'قرية الشبول',
    desc: 'قرية بحرية عريقة تتميز بطبيعتها المتصلة بالبحيرة والثروة السمكية.',
    distanceKm: 8.5,
    station: 'موقف الشبول والنسايمة بالمنزلة',
    fare: '8 - 10 جنيه',
    transitType: 'ميكروباصات منتظمة'
  },
  'al-asafra': {
    name: 'قرية العصافرة',
    desc: 'من أقدم وأكبر قرى المنزلة ذات الكثافة السكانية والأنشطة التجارية الحيوية.',
    distanceKm: 5.0,
    station: 'موقف العصافرة بموقف الأتوبيس الجديد',
    fare: '6 - 7 جنيه',
    transitType: 'سرفيس وميكروباص متواصل'
  },
  'al-nasayma': {
    name: 'قرية النسايمة',
    desc: 'قرية رائدة في الإنتاج السمكي والزراعي وتضم مجتمعاً متماسكاً وخدمات متنامية.',
    distanceKm: 9.0,
    station: 'موقف النسايمة بالمنزلة',
    fare: '9 - 11 جنيه',
    transitType: 'ميكروباصات'
  }
};

export async function renderVillageHubPage($container, { slug = 'al-aziza' } = {}) {
  const village = VILLAGE_DATA[slug] || VILLAGE_DATA['al-aziza'];

  $container.innerHTML = `
    <div class="container" style="max-width:1100px;margin:0 auto;padding:24px 16px">
      
      <!-- Village Hero Banner -->
      <div class="village-hub-banner">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span style="font-size:2rem">🏘️</span>
          <div>
            <h1 style="margin:0;font-size:1.65rem;font-weight:900">${village.name} — دليل الخدمات والحرفيين</h1>
            <p style="margin:4px 0 0;font-size:0.92rem;opacity:0.9">${village.desc}</p>
          </div>
        </div>

        <!-- Village Selector Pills -->
        <div style="display:flex;gap:8px;overflow-x:auto;padding-top:14px;scrollbar-width:none">
          ${Object.entries(VILLAGE_DATA).map(([key, v]) => `
            <a href="#/village/${key}" class="btn btn-sm" style="background:${key === slug ? '#ffffff' : 'rgba(255,255,255,0.15)'};color:${key === slug ? '#064e3b' : '#ffffff'};border-radius:20px;font-weight:800;text-decoration:none;padding:5px 14px;white-space:nowrap">
              ${v.name}
            </a>
          `).join('')}
        </div>
      </div>

      <!-- Transit & How-to-Reach Guide -->
      <div style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:2rem;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
        <h3 style="margin:0 0 14px;font-size:1.15rem;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:8px">
          <span>🚐</span>
          <span>دليل المواصلات والوصول إلى ${village.name}</span>
        </h3>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px">
          <div style="background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0">
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px">موقع الموقف بالمنزلة</div>
            <div style="font-weight:800;color:#1e293b;font-size:0.92rem">📍 ${village.station}</div>
          </div>
          <div style="background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0">
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px">الأجرة التقريبية</div>
            <div style="font-weight:800;color:#059669;font-size:0.92rem">💵 ${village.fare}</div>
          </div>
          <div style="background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0">
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px">المسافة من مركز المنزلة</div>
            <div style="font-weight:800;color:#0284c7;font-size:0.92rem">🛣️ حوالي ${village.distanceKm} كم</div>
          </div>
          <div style="background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0">
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px">نوع وسيلة النقل</div>
            <div style="font-weight:800;color:#1e293b;font-size:0.92rem">🚌 ${village.transitType}</div>
          </div>
        </div>
      </div>

      <!-- Missing Services Community Poll -->
      <div class="village-poll-card">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px">
          <div>
            <h3 style="margin:0;font-size:1.15rem;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:8px">
              <span>🗳️</span>
              <span>استطلاع رأي أهالي ${village.name}: ما هي أكثر خدمة تحتاجها القرية حالياً؟</span>
            </h3>
            <p style="margin:4px 0 0;font-size:0.82rem;color:#64748b">شارك بصوتك لإيصال صوت أهالي القرية للمسؤولين وأصحاب المشاريع والعيادات</p>
          </div>
          <div id="poll-total-votes" style="font-size:0.82rem;background:#f1f5f9;padding:4px 12px;border-radius:20px;font-weight:700;color:#475569">
            جاري التحميل...
          </div>
        </div>

        <div id="village-poll-options-container">
          <div style="text-align:center;padding:20px;color:#94a3b8">جاري تحميل خيارات الاستطلاع...</div>
        </div>
      </div>

    </div>
  `;

  await loadVillagePolls($container, village.name);
}

async function loadVillagePolls($container, villageName) {
  const container = $container.querySelector('#village-poll-options-container');
  const totalBadge = $container.querySelector('#poll-total-votes');
  if (!container) return;

  try {
    const res = await fetchVillagePolls(villageName);
    const polls = res?.polls || [];
    const total = res?.totalVotes || 0;

    if (totalBadge) totalBadge.textContent = `${total} صوت مجتمعي`;

    container.innerHTML = polls.map(p => `
      <div class="poll-option-row">
        <div class="poll-option-label">
          <span>${p.label}</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:#059669;font-weight:800">${p.percentage}%</span>
            <button type="button" class="btn btn-sm btn-vote" data-key="${p.key}" style="background:#0284c7;color:#fff;border:none;padding:3px 10px;border-radius:8px;font-weight:700;cursor:pointer">
              صوّت
            </button>
          </div>
        </div>
        <div class="poll-bar-bg">
          <div class="poll-bar-fill" style="width:${p.percentage}%;"></div>
        </div>
      </div>
    `).join('');

    // Attach voting events
    container.querySelectorAll('.btn-vote').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        btn.disabled = true;
        btn.textContent = '...';
        try {
          const vRes = await voteVillageService(villageName, key);
          if (vRes?.success) {
            toast.success(vRes.message || 'تم تسجيل صوتك بنجاح!');
            await loadVillagePolls($container, villageName);
          } else {
            toast.error(vRes?.error || 'تعذر التصويت');
            btn.disabled = false;
            btn.textContent = 'صوّت';
          }
        } catch (err) {
          toast.error('حدث خطأ أثناء التصويت');
          btn.disabled = false;
          btn.textContent = 'صوّت';
        }
      });
    });

  } catch (err) {
    console.error('[VillageHub] poll load error:', err);
    container.innerHTML = '<div style="color:#ef4444;text-align:center">تعذر تحميل الاستطلاع حالياً.</div>';
  }
}
