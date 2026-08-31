import { getActiveOffers, getPublishedPlaces } from '../../core/db.js';
import { mountSponsoredShowcase } from '../components/SponsoredShowcase.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { daysUntil, formatDateRange } from '../../utils/date.js';
import { setMeta, setBreadcrumbSchema } from '../../utils/seo.js';
import { openOfferFullDetailsModal } from '../components/OfferProductModals.js';

export async function renderOffersPage($container) {
  const urlParams = new URLSearchParams(window.location.search);
  const placeSlugFilter = urlParams.get('place') || '';

  setMeta({
    title: 'العروض اليومية والخصومات في دليل المنزلة والمطرية الرقمي',
    description: 'تصفح أحدث عروض وتخفيضات محلات وأنشطة مدينة المنزلة والمطرية المحدثة يومياً',
    url: 'https://elmanzala.com/offers.html'
  });

  setBreadcrumbSchema([
    { name: 'الرئيسية', url: 'https://elmanzala.com/' },
    { name: 'العروض اليومية', url: 'https://elmanzala.com/offers.html' }
  ]);

  $container.innerHTML = `
    <div class="search-page-header">
      <div class="container text-center">
        <h1 style="color:#fff;font-size:var(--font-size-3xl);margin-bottom:var(--space-2)" id="offers-main-title">
          🏷️ العروض والتخفيضات اليومية
        </h1>
        <p style="color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto;font-size:14px" id="offers-main-subtitle">
          أفضل الصفقات والخصومات المتاحة حالياً من محلات وأنشطة دليل المنزلة والمطرية
        </p>
      </div>
    </div>

    <div class="container section">
      <!-- Search & Place Filter Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px;max-width:460px">
          <input type="search" id="offers-search-input" class="form-input" placeholder="🔍 بحث في العروض أو أسماء المحلات..." style="margin:0" />
        </div>
        <div id="offers-filter-badge-container"></div>
      </div>

      <!-- Dedicated Sponsored Showcase Section -->
      <div id="offers-sponsored-showcase" style="margin-bottom:var(--space-6)"></div>

      <div class="places-grid" id="offers-page-grid">
        ${Array(6).fill('<div class="skeleton-place-card" style="height:280px"><div class="skeleton-place-card__cover skeleton"></div></div>').join('')}
      </div>
    </div>
  `;

  try {
    const [rawOffers, places] = await Promise.all([
      getActiveOffers(100),
      getPublishedPlaces()
    ]);

    const placesMap = {};
    (places || []).forEach(p => {
      if (p.slug) placesMap[p.slug] = p;
      if (p.id) placesMap[p.id] = p;
      if (p._key) placesMap[p._key] = p;
    });

    let offers = rawOffers || [];

    // Filter by place if query param provided
    if (placeSlugFilter) {
      const targetPlace = placesMap[placeSlugFilter];
      offers = offers.filter(o => o.placeSlug === placeSlugFilter || o.placeId === placeSlugFilter || (targetPlace && o.placeName === targetPlace.name));
      
      const titleEl = document.getElementById('offers-main-title');
      const subEl = document.getElementById('offers-main-subtitle');
      const badgeContainer = document.getElementById('offers-filter-badge-container');

      if (targetPlace) {
        if (titleEl) titleEl.textContent = `🎁 عروض وتخفيضات: ${targetPlace.name}`;
        if (subEl) subEl.textContent = `تصفح كافة العروض المتاحة والمحدثة لدى ${targetPlace.name} (${targetPlace.area || 'المنزلة'})`;
      }
      if (badgeContainer) {
        badgeContainer.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge--success" style="font-size:12px;padding:4px 10px">📍 مفلتر لمكان محدد</span>
            <a href="offers.html" class="btn btn-xs btn-outline" style="font-size:11px;border-radius:var(--radius-full)">إظهار كل العروض ✕</a>
          </div>
        `;
      }
    }

    // Mount Sponsored Showcase
    mountSponsoredShowcase('offers-sponsored-showcase', places || [], {
      title: 'إعلانات وعروض مميزة من الرعاة',
      subtitle: 'أنشطة ومحلات تقدم عروض وخدمات مميزة'
    });

    const grid = document.getElementById('offers-page-grid');
    const searchInput = document.getElementById('offers-search-input');
    if (!grid) return;

    const renderGrid = (items) => {
      if (!items || items.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;padding:3rem 1rem">
            <div class="empty-state__icon">🏷️</div>
            <h2 class="empty-state__title">لا توجد عروض مطابقة حالياً</h2>
            <p class="empty-state__text">تابع الصفحة باستمرار لمعرفة أحدث العروض والخصومات في المنزلة والمطرية</p>
            <a href="dashboard.html" class="btn btn-primary">أضف عرضاً لمحلك</a>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map(offer => {
        const discount = offer.discountPercent || calcDiscount(offer.oldPrice, offer.newPrice);
        const days = daysUntil(offer.endDate);
        const pObj = placesMap[offer.placeSlug] || placesMap[offer.placeId] || { name: offer.placeName, phone: offer.placePhone, whatsapp: offer.placeWhatsapp, slug: offer.placeSlug };

        return `
          <article class="offer-card animate-fade-in offer-item-card" data-offer-id="${escAttr(offer.id || offer._id)}" style="cursor:pointer" title="انقر لمشاهدة التفاصيل الكاملة والطلب">
            <div class="offer-card__image">
              ${offer.imageUrl 
                ? `<img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" loading="lazy" />` 
                : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:var(--text-muted)">🏷️</div>`
              }
              ${discount > 0 ? `<span class="offer-card__discount-badge">خصم -${discount}%</span>` : ''}
            </div>
            <div class="offer-card__body">
              <h2 class="offer-card__title" style="font-size:15px">${escHtml(offer.title)}</h2>
              ${offer.placeName ? `<div class="offer-card__place">📍 ${escHtml(offer.placeName)}</div>` : ''}
              ${offer.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-2);line-height:1.5">${escHtml(offer.description)}</p>` : ''}
              
              <div class="offer-card__price">
                <span class="offer-card__price-new">${formatPrice(offer.newPrice)}</span>
                ${offer.oldPrice ? `<span class="offer-card__price-old">${formatPrice(offer.oldPrice)}</span>` : ''}
              </div>

              <div class="offer-card__expiry">
                ⏰ ${days > 0 ? `ينتهي خلال ${days} يوم` : 'ينتهي اليوم'} (${formatDateRange(offer.startDate, offer.endDate)})
              </div>

              <div class="offer-card__cta-btn">
                <span>👁️ مشاهدة تفاصيل وطلب العرض</span>
                <span>↗</span>
              </div>
            </div>
          </article>
        `;
      }).join('');

      // Bind click handlers to open full uncropped modal
      grid.querySelectorAll('.offer-item-card').forEach(card => {
        card.addEventListener('click', () => {
          const oId = card.getAttribute('data-offer-id');
          const targetOffer = items.find(o => (o.id || o._id) === oId);
          if (targetOffer) {
            const pObj = placesMap[targetOffer.placeSlug] || placesMap[targetOffer.placeId] || { name: targetOffer.placeName, phone: targetOffer.placePhone, whatsapp: targetOffer.placeWhatsapp, slug: targetOffer.placeSlug };
            openOfferFullDetailsModal(targetOffer, pObj);
          }
        });
      });
    };

    renderGrid(offers);

    // Search filter handler
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = offers.filter(o => 
        !q ||
        (o.title || '').toLowerCase().includes(q) ||
        (o.placeName || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
      );
      renderGrid(filtered);
    });

  } catch (err) {
    console.error('[OffersPage] Error:', err);
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
