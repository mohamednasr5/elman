import { getCategories, getPlacesByCategory, getPublishedPlaces } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard } from '../components/PlaceCard.js';
import { mountSponsoredShowcase } from '../components/SponsoredShowcase.js';
import { setMeta, setBreadcrumbSchema } from '../../utils/seo.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_CENTER } from '../../utils/maps.js';
import { toast } from '../components/Toast.js';

let _catUserLocation = null;

export async function renderCategoriesPage($container) {
  setMeta({ title: 'التصنيفات والأنشطة', url: 'https://elmanzala.com/categories.html' });
  setBreadcrumbSchema([
    { name: 'الرئيسية', url: 'https://elmanzala.com/' },
    { name: 'التصنيفات', url: 'https://elmanzala.com/categories.html' }
  ]);

  $container.innerHTML = `
    <div class="category-page-header">
      <div class="container text-center">
        <h1 style="font-size:var(--font-size-3xl);font-weight:800;color:var(--primary);margin-bottom:var(--space-2)">
          تصنيفات الدليل
        </h1>
        <p style="color:var(--text-secondary);max-width:540px;margin:0 auto">
          تصفح الأماكن والمحلات والأطباء في المنزلة مصنفة حسب النشاط
        </p>
      </div>
    </div>

    <div class="container section">
      <!-- Dedicated Sponsored Showcase Section -->
      <div id="categories-sponsored-showcase" style="margin-bottom:var(--space-6)"></div>

      <div class="categories-grid" id="all-categories-grid">
        ${Array(12).fill('<div class="skeleton-category-card"><div class="skeleton-category-card__icon skeleton"></div><div class="skeleton-category-card__name skeleton"></div></div>').join('')}
      </div>
    </div>
  `;

  const [categories, places] = await Promise.all([
    getCategories(),
    getPublishedPlaces()
  ]);

  // Mount Sponsored Showcase
  mountSponsoredShowcase('categories-sponsored-showcase', places || [], {
    title: 'إعلانات وأنشطة مميزة',
    subtitle: 'أنشطة تجارية موصى بها من كافة الأقسام'
  });

  const grid = document.getElementById('all-categories-grid');
  if (!grid) return;

  if (!categories || categories.length === 0) {
    grid.innerHTML = `<p class="text-muted text-center" style="grid-column:1/-1">لا توجد تصنيفات بعد</p>`;
    return;
  }

  // Calculate live count of places for each category
  const countMap = {};
  places.forEach(p => {
    const cId = p.categoryId;
    if (cId) countMap[cId] = (countMap[cId] || 0) + 1;
  });

  grid.innerHTML = categories.map(cat => {
    const count = countMap[cat.slug] || countMap[cat._key] || countMap[cat.id] || 0;
    return `
      <a href="category.html?slug=${encodeURIComponent(cat.slug || cat._key)}" class="category-card animate-fade-in">
        <div class="category-card__icon">${cat.icon || '📁'}</div>
        <div class="category-card__name">${escHtml(cat.name)}</div>
        <div class="category-card__count">${count > 0 ? `${count} مكان` : 'استكشف الأماكن'}</div>
      </a>
    `;
  }).join('');
}

export async function renderCategoryPage($container, { slug, query, user }) {
  const decodedSlug = slug ? decodeURIComponent(slug) : '';
  const categories = await getCategories();
  const cat = categories?.find(c => 
    c.slug === slug || 
    c._key === slug || 
    c.slug === decodedSlug || 
    c.id === slug ||
    c.id === decodedSlug ||
    c.name === decodedSlug || 
    c.nameEn === slug
  );

  if (!cat) {
    $container.innerHTML = `
      <div class="error-page">
        <div class="error-page__content">
          <h1 class="error-page__title">التصنيف غير موجود</h1>
          <a href="categories.html" class="btn btn-primary">تصفح كل التصنيفات</a>
        </div>
      </div>
    `;
    return;
  }

  setMeta({
    title: `${cat.name} في المنزلة — دليل الأماكن`,
    description: `دليل ${cat.name} في مدينة المنزلة — ابحث عن العناوين وأرقام الهواتف ومواعيد العمل والأسعار`,
    url: `https://elmanzala.com/category.html?slug=${slug}`
  });

  setBreadcrumbSchema([
    { name: 'الرئيسية', url: 'https://elmanzala.com/' },
    { name: 'التصنيفات', url: 'https://elmanzala.com/categories.html' },
    { name: cat.name, url: `https://elmanzala.com/category.html?slug=${slug}` }
  ]);

  $container.innerHTML = `
    <div class="category-page-header">
      <div class="container text-center">
        <div class="category-page-icon" style="margin:0 auto var(--space-4);background:var(--primary-alpha)">
          ${cat.icon || '📁'}
        </div>
        <h1 style="font-size:var(--font-size-3xl);font-weight:800;color:var(--primary);margin-bottom:var(--space-2)">
          ${escHtml(cat.name)} في المنزلة
        </h1>
        <p style="color:var(--text-secondary);max-width:540px;margin:0 auto">
          أفضل وأشهر الأماكن في قسم ${escHtml(cat.name)} بمدينة المنزلة
        </p>
      </div>
    </div>

    <div class="container section">
      <!-- Filter & Sort Bar -->
      <div class="filter-bar" style="margin-bottom:var(--space-5);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="font-size:14px;font-weight:700;color:var(--text-primary)">
          <span>📋 قائمة الأماكن في قسم ${escHtml(cat.name)}</span>
        </div>
        <select id="cat-sort-filter" class="form-select" style="max-width:210px;margin:0">
          <option value="default">⭐ الافتراضي (المميز والموثق)</option>
          <option value="nearest">📍 الأقرب إليّ (حسب موقعي GPS)</option>
          <option value="highest-rating">★ الأعلى تقييماً (5.0 → 1.0)</option>
          <option value="most-reviews">💬 الأكثر تقييماً وتفاعلاً</option>
          <option value="negative">⚠️ التقييمات الأقل / سلبية</option>
          <option value="newest">🆕 الأحدث إضافة</option>
        </select>
      </div>

      <div class="places-grid" id="category-places-grid">
        ${Array(4).fill('<div class="skeleton-place-card" style="height:260px"><div class="skeleton-place-card__cover skeleton"></div></div>').join('')}
      </div>
    </div>
  `;

  const rawPlaces = await getPlacesByCategory(cat.slug || cat._key);
  const grid = document.getElementById('category-places-grid');
  const sortSelect = document.getElementById('cat-sort-filter');
  if (!grid) return;

  if (!rawPlaces || rawPlaces.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">${cat.icon || '🏪'}</div>
        <h3 class="empty-state__title">لا توجد أماكن مسجلة في هذا القسم بعد</h3>
        <p class="empty-state__text">هل تملك نشاطاً في هذا المجال؟ أضف مكانك الآن مجاناً</p>
        <a href="dashboard.html?section=add" class="btn btn-primary">➕ إضافة مكان في قسم ${escHtml(cat.name)}</a>
      </div>
    `;
    return;
  }

  async function renderSortedPlaces() {
    const sortBy = sortSelect?.value || 'default';
    let places = [...rawPlaces];

    if (sortBy === 'nearest') {
      if (!_catUserLocation) {
        toast.info('جاري تحديد موقعك الجغرافي لحساب المسافات... 📍');
        try {
          _catUserLocation = await getUserLocation();
          toast.success('تم تحديد موقعك! تم ترتيب الأماكن حسب الأقرب لموقعك 📍');
        } catch (err) {
          toast.warning('تعذر الوصول للـ GPS، تم الترتيب حسب المسافة من مركز المنزلة');
          _catUserLocation = MANZALA_CENTER;
        }
      }
      places = sortPlacesByDistance(places, _catUserLocation);
    } else if (sortBy === 'highest-rating') {
      places.sort((a, b) => (Number(b.rating) || 5.0) - (Number(a.rating) || 5.0));
    } else if (sortBy === 'most-reviews') {
      places.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
    } else if (sortBy === 'negative') {
      places.sort((a, b) => (Number(a.rating) || 5.0) - (Number(b.rating) || 5.0));
    } else if (sortBy === 'newest') {
      places.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else {
      // Sort sponsored first, then verified places
      places.sort((a, b) => {
        const aSpons = Boolean(a.isSponsored || a.isFeatured || a.isPromoted) ? 1 : 0;
        const bSpons = Boolean(b.isSponsored || b.isFeatured || b.isPromoted) ? 1 : 0;
        if (bSpons !== aSpons) return bSpons - aSpons;
        return (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0);
      });
    }

    grid.innerHTML = places.map(p => renderPlaceCard(p)).join('');
  }

  sortSelect?.addEventListener('change', renderSortedPlaces);
  renderSortedPlaces();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
