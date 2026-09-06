import { getPublishedPlaces } from '../../core/db.js';
import { getFavoriteIds } from '../../services/favorites.service.js';
import { renderPlaceCard } from '../components/PlaceCard.js';

export async function renderFavoritesPage(container) {
  container.innerHTML = `
    <div class="container section favorites-page">
      <div class="page-back-bar">
        <button type="button" class="btn-page-back" onclick="history.length > 1 ? history.back() : location.href='index.html'">← رجوع</button>
        <nav class="page-breadcrumbs" aria-label="مسار التنقل"><a href="index.html">الرئيسية</a><span class="breadcrumb-sep">/</span><span class="breadcrumb-current">المفضلة</span></nav>
      </div>
      <div class="favorites-hero">
        <div class="favorites-hero__icon">♥</div>
        <div><span class="favorites-hero__kicker">أماكنك المحفوظة</span><h1>المفضلة</h1><p>ارجع بسرعة للأماكن التي تهمك — محفوظة على جهازك وتعمل حتى بدون تسجيل دخول.</p></div>
      </div>
      <div id="favorites-grid" class="places-grid"></div>
    </div>`;

  const grid = document.getElementById('favorites-grid');
  const ids = new Set(getFavoriteIds());
  if (!ids.size) {
    grid.innerHTML = `
      <div class="empty-state favorites-empty" style="grid-column:1/-1">
        <div class="empty-state__icon">♡</div>
        <h2 class="empty-state__title">لم تحفظ أي مكان بعد</h2>
        <p class="empty-state__text">اضغط ♥ على أي بطاقة مكان لتجده هنا بسرعة.</p>
        <a href="places.html" class="btn btn-primary">استكشف الأماكن</a>
      </div>`;
    return;
  }

  try {
    const places = await getPublishedPlaces({ limit: 250 });
    const saved = (places || []).filter(p => ids.has(String(p.id || p._key || p.slug)));
    if (!saved.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔄</div><h2 class="empty-state__title">المكان المحفوظ لم يعد متاحًا</h2><p class="empty-state__text">قد يكون تم حذفه أو إلغاء نشره.</p></div>';
      return;
    }
    grid.innerHTML = saved.map(renderPlaceCard).join('');
  } catch (_) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">⚠️</div><h2 class="empty-state__title">تعذر تحميل المفضلة</h2><p class="empty-state__text">تحقق من الاتصال وحاول مرة أخرى.</p></div>';
  }
}
