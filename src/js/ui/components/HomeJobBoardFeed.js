/**
 * HomeJobBoardFeed.js — قسم طلبات العمل ووظائف متاحة في الصفحة الرئيسية
 * يعرض عشوائياً وبمبدأ تكافؤ الفرص كوادر الباحثين عن عمل والوظائف المتاحة
 */

import { WORKER_URL } from '../../core/firebase.js';

export async function mountHomeJobBoardFeed(containerId = 'home-job-board-grid') {
  const grid = document.getElementById(containerId);
  const section = document.getElementById('home-job-board-section');
  if (!grid) return;

  try {
    const [seekersRes, jobsRes] = await Promise.allSettled([
      fetch(`${WORKER_URL}/api/job-seekers?status=active`, { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
      fetch(`${WORKER_URL}/api/jobs?status=active`, { signal: AbortSignal.timeout(6000) }).then(r => r.json())
    ]);

    const seekers = seekersRes.status === 'fulfilled' && Array.isArray(seekersRes.value?.data) ? seekersRes.value.data : [];
    const jobs = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : [];

    if (seekers.length === 0 && jobs.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = '';

    // Shuffle helper (Fisher-Yates)
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const shuffledSeekers = shuffle(seekers);
    const shuffledJobs = shuffle(jobs);

    // Equal opportunity: alternate between a seeker and a job
    const combined = [];
    const maxItems = 6;
    const maxLen = Math.max(shuffledSeekers.length, shuffledJobs.length);
    const seekerFirst = Math.random() >= 0.5;

    for (let i = 0; i < maxLen; i++) {
      const first = seekerFirst ? shuffledSeekers[i] : shuffledJobs[i];
      const second = seekerFirst ? shuffledJobs[i] : shuffledSeekers[i];
      const typeFirst = seekerFirst ? 'seeker' : 'job';
      const typeSecond = seekerFirst ? 'job' : 'seeker';

      if (first && combined.length < maxItems) combined.push({ type: typeFirst, data: first });
      if (second && combined.length < maxItems) combined.push({ type: typeSecond, data: second });
    }

    grid.innerHTML = combined.map(({ type, data }) => {
      if (type === 'seeker') {
        const expStr = data.experience_years ? `خبرة ${data.experience_years} سنوات` : 'مبتدئ / حديث';
        const ageStr = data.age ? `${data.age} سنة` : '';
        return `
          <div class="home-jb-card home-jb-card--seeker" onclick="window.location.href='/job-seekers.html?id=${data.id}'">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <span class="home-jb-card__badge home-jb-card__badge--seeker">👤 طالب عمل</span>
              <span style="font-size:11.5px;color:var(--text-muted);font-weight:700">📍 ${escapeHtml(data.location || 'المنزلة')}</span>
            </div>
            <div>
              <h3 class="home-jb-card__title">${escapeHtml(data.name)}</h3>
              <div class="home-jb-card__prof">💼 ${escapeHtml(data.profession)}</div>
            </div>
            <div class="home-jb-card__meta">
              <span>👤 ${data.gender === 'female' ? 'أنثى' : 'ذكر'}${ageStr ? ` (${ageStr})` : ''}</span>
              <span>⏳ ${expStr}</span>
            </div>
            <p class="home-jb-card__desc">${escapeHtml(data.bio || data.description || 'يبحث عن فرصة عمل تناسب مهاراته.')}</p>
            <div class="home-jb-card__footer">
              <a href="/job-seekers.html?id=${data.id}" class="home-jb-card__action home-jb-card__action--seeker" onclick="event.stopPropagation()">
                <span>مشاهدة الطلب ↤</span>
              </a>
            </div>
          </div>
        `;
      } else {
        const salaryText = data.salary_type === 'specified' && data.salary
          ? `${Number(data.salary).toLocaleString('ar-EG')} ج.م`
          : 'الراتب يحدد في المقابلة';
        return `
          <div class="home-jb-card home-jb-card--job" onclick="window.location.href='/jobs.html?id=${data.id}'">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <span class="home-jb-card__badge home-jb-card__badge--job">📢 وظيفة متاحة</span>
              <span style="font-size:11.5px;color:var(--text-muted);font-weight:700">📍 ${escapeHtml(data.location || 'المنزلة')}</span>
            </div>
            <div>
              <h3 class="home-jb-card__title">${escapeHtml(data.title)}</h3>
              <div class="home-jb-card__prof">🏢 ${escapeHtml(data.workplace || data.workplaceName || '')}</div>
            </div>
            <div class="home-jb-card__meta">
              <span>💼 ${escapeHtml(data.profession)}</span>
              <span>💵 ${salaryText}</span>
            </div>
            <p class="home-jb-card__desc">${escapeHtml(data.description || 'فرصة عمل شاغرة للتواصل والتقديم المباشر.')}</p>
            <div class="home-jb-card__footer">
              <a href="/jobs.html?id=${data.id}" class="home-jb-card__action home-jb-card__action--job" onclick="event.stopPropagation()">
                <span>مشاهدة الوظيفة ↤</span>
              </a>
            </div>
          </div>
        `;
      }
    }).join('');

  } catch (err) {
    console.warn('[HomeJobBoardFeed Error]:', err);
    if (section) section.style.display = 'none';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
