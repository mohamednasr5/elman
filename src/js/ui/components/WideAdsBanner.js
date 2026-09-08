/**
 * WideAdsBanner — responsive site-wide advertisement banner.
 * Source of truth: Turso /api/ads. Maximum 10 active ads, 5 visible per rotation.
 */
import { getAds } from '../../core/db.js';

const timers = new WeakMap();

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function esc(v) {
  return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export async function mountWideAdsBanner(target = 'wide-ads-banner') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  try {
    const all = await getAds('');
    const now = Date.now();
    const active = (all || [])
      .filter(a => a && a.isActive !== false && Number(a.is_active ?? 1) !== 0)
      .filter(a => !a.startDate || Number(a.startDate) <= now)
      .filter(a => !a.endDate || Number(a.endDate) > now)
      .filter(a => a.imageUrl && a.link)
      .slice(0, 10);

    if (!active.length) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    if (timers.has(container)) clearInterval(timers.get(container));

    let ordered = shuffle(active);
    let groupIndex = 0;

    const render = () => {
      const groupCount = Math.ceil(ordered.length / 5);
      const start = (groupIndex % groupCount) * 5;
      const group = ordered.slice(start, start + 5);

      container.innerHTML = `
        <section aria-label="إعلانات الموقع" style="width:100%;margin:12px 0 20px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <strong style="font-size:14px;font-weight:900;color:var(--text-primary,#0f273d);white-space:nowrap">إعلانك هنا يحقق أهدافك</strong>
            <span aria-hidden="true" style="height:1px;flex:1;background:currentColor;opacity:.12"></span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(5,group.length)},minmax(0,1fr));gap:10px">
            ${group.map(ad => `
              <a href="${esc(ad.link)}" target="_blank" rel="noopener noreferrer sponsored" aria-label="${esc(ad.title || 'إعلان')}"
                 style="display:block;width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:14px;background:#f1f5f9;box-shadow:0 3px 14px rgba(0,0,0,.08);transition:transform .25s ease,box-shadow .25s ease">
                <img src="${esc(ad.imageUrl)}" alt="${esc(ad.title || 'إعلان')}" loading="lazy" decoding="async"
                     style="display:block;width:100%;height:100%;object-fit:cover"
                     onerror="this.closest('a')?.remove()">
              </a>`).join('')}
          </div>
        </section>`;

      const links = container.querySelectorAll('a');
      links.forEach(a => {
        a.addEventListener('mouseenter', () => { a.style.transform='translateY(-2px)'; });
        a.addEventListener('mouseleave', () => { a.style.transform='translateY(0)'; });
      });
    };

    render();
    if (ordered.length > 5) {
      const timer = setInterval(() => {
        ordered = shuffle(active);
        groupIndex = (groupIndex + 1) % Math.ceil(ordered.length / 5);
        render();
      }, 60000);
      timers.set(container, timer);
    }
  } catch (err) {
    container.hidden = true;
    console.warn('[WideAdsBanner] failed:', err);
  }
}
