/**
 * المنزلة وناسها — Products Page
 */

import { dbGet } from '../../core/db.js';
import { formatPrice } from '../../utils/arabic.js';
import { setMeta, setBreadcrumbSchema } from '../../utils/seo.js';

export async function renderProductsPage($container) {
  setMeta({
    title: 'دليل المنتجات والأسعار في المنزلة',
    description: 'تصفح قائمة المنتجات والأسعار المتاحة لدى المحلات الموثقة في مدينة المنزلة',
    url: 'https://elmanzala.com/products.html'
  });

  setBreadcrumbSchema([
    { name: 'الرئيسية', url: 'https://elmanzala.com/' },
    { name: 'المنتجات', url: 'https://elmanzala.com/products.html' }
  ]);

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)">
          🛍️ دليل المنتجات والأسعار
        </h1>
        <p style="color:rgba(255,255,255,0.8);max-width:540px;margin:0 auto">
          استكشف المنتجات المعروضة من المحلات الموثقة بمدينة المنزلة
        </p>
      </div>
    </div>

    <div class="container section">
      <div class="places-grid" id="all-products-grid">
        ${Array(8).fill('<div class="skeleton-place-card" style="height:260px"><div class="skeleton-place-card__cover skeleton"></div></div>').join('')}
      </div>
    </div>
  `;

  try {
    const rawProductsMap = await dbGet('products') || {};
    const placesMap = await dbGet('places') || {};
    const allProducts = [];

    Object.entries(rawProductsMap).forEach(([placeId, products]) => {
      const place = placesMap[placeId];
      if (products && typeof products === 'object') {
        Object.entries(products).forEach(([pId, prod]) => {
          if (prod) {
            allProducts.push({
              ...prod,
              id: pId,
              placeId,
              placeName: place?.name || 'محل بالمنزلة',
              placeSlug: place?.slug || ''
            });
          }
        });
      }
    });

    const grid = document.getElementById('all-products-grid');
    if (!grid) return;

    if (allProducts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">📦</div>
          <h2 class="empty-state__title">لا توجد منتجات مسجلة بعد</h2>
          <p class="empty-state__text">المنتجات متاحة حصرياً للأماكن الموثقة</p>
          <a href="dashboard.html" class="btn btn-primary">لوحة التحكم</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = allProducts.map(p => `
      <article class="product-card animate-fade-in" onclick="window.location.href='place.html?slug=${escAttr(p.placeSlug)}'" style="cursor:pointer">
        <div class="product-card__image">
          ${p.imageUrl ? `<img src="${escAttr(p.imageUrl)}" alt="${escAttr(p.name)}" loading="lazy" />` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:var(--surface-3)">📦</div>`}
          ${p.isFeatured ? `<span class="product-card__featured">مميز ⭐</span>` : ''}
        </div>
        <div class="product-card__body">
          <h2 class="product-card__name" style="font-size:var(--font-size-base)">${escHtml(p.name)}</h2>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-2)">📍 ${escHtml(p.placeName)}</div>
          <div class="product-card__price">
            <span class="product-card__price-current">${formatPrice(p.price)}</span>
            ${p.oldPrice ? `<span class="product-card__price-old">${formatPrice(p.oldPrice)}</span>` : ''}
          </div>
        </div>
      </article>
    `).join('');

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
