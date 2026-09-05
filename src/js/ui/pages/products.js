import { dbGet, isPlaceBanned } from '../../core/db.js';
import { formatPrice } from '../../utils/arabic.js';
import { setMeta, setBreadcrumbSchema } from '../../utils/seo.js';
import { openProductFullDetailsModal } from '../components/OfferProductModals.js';

export async function renderProductsPage($container) {
  const urlParams = new URLSearchParams(window.location.search);
  const placeSlugFilter = urlParams.get('place') || '';

  setMeta({
    title: 'دليل المنتجات والأسعار في المنزلة والمطرية',
    description: 'تصفح قائمة المنتجات والأسعار المتاحة لدى المحلات الموثقة في دليل المنزلة والمطرية الرقمي',
    url: 'https://elmanzala.com/products.html'
  });

  setBreadcrumbSchema([
    { name: 'الرئيسية', url: 'https://elmanzala.com/' },
    { name: 'المنتجات', url: 'https://elmanzala.com/products.html' }
  ]);

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)" id="products-main-title">
          🛍️ دليل المنتجات والأسعار
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px" id="products-main-subtitle">
          استكشف أحدث المنتجات والأسعار المعروضة من المحلات الموثقة في المنزلة والمطرية
        </p>
      </div>
    </div>

    <div class="container section">
      <!-- Search & Place Filter Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px;max-width:460px">
          <input type="search" id="products-search-input" class="form-input" placeholder="🔍 بحث باسم المنتج أو المحل أو التصنيف..." style="margin:0" />
        </div>
        <div id="products-filter-badge-container"></div>
      </div>

      <div class="places-grid" id="all-products-grid">
        ${Array(8).fill('<div class="skeleton-place-card" style="height:260px"><div class="skeleton-place-card__cover skeleton"></div></div>').join('')}
      </div>
    </div>
  `;

  try {
    const rawProductsMap = await dbGet('products') || {};
    const placesMap = await dbGet('places') || {};
    let allProducts = [];

    Object.entries(rawProductsMap).forEach(([placeId, products]) => {
      const place = placesMap[placeId];
      if (place && isPlaceBanned(place)) return; // Skip products from banned places

      if (products && typeof products === 'object') {
        Object.entries(products).forEach(([pId, prod]) => {
          if (!prod) return;
          // Only show approved products (or legacy products without status)
          const isApproved = prod.status === 'approved' || prod.isApproved === true || (!prod.status && prod.isApproved === undefined);
          if (isApproved) {
            allProducts.push({
              ...prod,
              id: pId,
              placeId,
              placeName: place?.name || 'محل بالمنزلة',
              placePhone: place?.phone || '',
              placeWhatsapp: place?.whatsapp || place?.phone || '',
              placeSlug: place?.slug || placeId
            });
          }
        });
      }
    });

    // Filter by place if requested
    if (placeSlugFilter) {
      const matchedPlace = Object.values(placesMap).find(p => p.slug === placeSlugFilter || p.id === placeSlugFilter);
      allProducts = allProducts.filter(p => p.placeSlug === placeSlugFilter || p.placeId === placeSlugFilter || (matchedPlace && p.placeName === matchedPlace.name));

      const titleEl = document.getElementById('products-main-title');
      const subEl = document.getElementById('products-main-subtitle');
      const badgeContainer = document.getElementById('products-filter-badge-container');

      if (matchedPlace) {
        if (titleEl) titleEl.textContent = `🛍️ منتجات وقائمة أسعار: ${matchedPlace.name}`;
        if (subEl) subEl.textContent = `تصفح كافة المنتجات والأسعار المتاحة لدى ${matchedPlace.name} (${matchedPlace.area || 'المنزلة'})`;
      }
      if (badgeContainer) {
        badgeContainer.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge--success" style="font-size:12px;padding:4px 10px">📍 مفلتر لمكان محدد</span>
            <a href="products.html" class="btn btn-xs btn-outline" style="font-size:11px;border-radius:var(--radius-full)">إظهار كل المنتجات ✕</a>
          </div>
        `;
      }
    }

    const grid = document.getElementById('all-products-grid');
    const searchInput = document.getElementById('products-search-input');
    if (!grid) return;

    const renderGrid = (items) => {
      if (!items || items.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;padding:3rem 1rem">
            <div class="empty-state__icon">📦</div>
            <h2 class="empty-state__title">لا توجد منتجات مسجلة حالياً</h2>
            <p class="empty-state__text">المنتجات متاحة حصرياً للأماكن والأنشطة الموثقة</p>
            <a href="dashboard.html" class="btn btn-primary">لوحة التحكم</a>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map(p => `
        <article class="product-card animate-fade-in product-item-card" data-product-id="${escAttr(p.id)}" data-place-id="${escAttr(p.placeId)}" style="cursor:pointer" title="انقر لمشاهدة تفاصيل وطلب المنتج">
          <div class="product-card__image">
            ${p.imageUrl 
              ? `<img src="${escAttr(p.imageUrl)}" alt="${escAttr(p.name)}" loading="lazy" />` 
              : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:var(--text-muted)">📦</div>`
            }
            ${p.isFeatured ? `<span class="product-card__featured">مميز ⭐</span>` : ''}
          </div>
          <div class="product-card__body">
            <h2 class="product-card__name" style="font-size:15px">${escHtml(p.name)}</h2>
            <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:var(--space-2)">📍 ${escHtml(p.placeName)}</div>
            ${p.category ? `<div style="font-size:11px;color:var(--primary);margin-bottom:4px;font-weight:600">🏷️ ${escHtml(p.category)}</div>` : ''}
            ${p.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-2);line-height:1.5">${escHtml(p.description)}</p>` : ''}
            <div class="product-card__price" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span class="product-card__price-current">${formatPrice(p.price)}</span>
              ${p.oldPrice ? `<span class="product-card__price-old">${formatPrice(p.oldPrice)}</span>` : ''}
              ${p.oldPrice && Number(p.oldPrice) > Number(p.price) ? `
                <span class="badge" style="background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;font-size:10.5px;font-weight:800;padding:2px 6px;border-radius:4px;margin-right:auto">
                  وفرت ${formatPrice(Number(p.oldPrice) - Number(p.price))}
                </span>
              ` : ''}
            </div>
            <div class="product-card__cta-btn">
              <span>🛍️ تفاصيل وطلب المنتج</span>
              <span>↗</span>
            </div>
          </div>
        </article>
      `).join('');

      // Bind click handlers for full uncropped modal
      grid.querySelectorAll('.product-item-card').forEach(card => {
        card.addEventListener('click', () => {
          const pId = card.getAttribute('data-product-id');
          const placeId = card.getAttribute('data-place-id');
          const targetProd = items.find(p => p.id === pId && p.placeId === placeId);
          if (targetProd) {
            const pObj = placesMap[targetProd.placeId] || { name: targetProd.placeName, phone: targetProd.placePhone, whatsapp: targetProd.placeWhatsapp, slug: targetProd.placeSlug };
            openProductFullDetailsModal(targetProd, pObj);
          }
        });
      });
    };

    renderGrid(allProducts);

    // Search filter handler
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = allProducts.filter(p => 
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.placeName || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
      renderGrid(filtered);
    });

  } catch (err) {
    console.error('[ProductsPage] Error:', err);
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
