/**
 * المنزلة وناسها — Place Detail Page
 * Full production place view with cover, logo, verified badge, working hours,
 * contact buttons, Google Maps, offers, products, photo gallery, and verification request.
 */

import { getPlaceBySlug, getCategories, getPublishedPlaces, getPlaceOffers, getPlaceProducts, getSettings, trackPlaceView, trackPlaceStat, getPlaceReviews, addPlaceReview, updatePlaceReview, deletePlaceReview, isFollowingPlace, followPlace, unfollowPlace, isPlaceBanned, reportPlaceReview, HAMMAD_PLACE_SLUG, dbUpdate, subscribeToOwnerPresence } from '../../core/db.js';
import { getCurrentUser, signInWithGoogle, isAdmin } from '../../core/auth.js';
import { setMeta, setPlaceSchema, setBreadcrumbSchema } from '../../utils/seo.js';
import { renderVerifiedBadge, renderDeliveryBadge, renderSponsoredBadge, renderOnlineBadge } from '../components/VerifiedBadge.js';
import { formatWorkingHours, isPlaceOpen, formatDateRange, daysUntil, formatDate } from '../../utils/date.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { submitVerificationRequest } from '../../services/places.service.js';
import { toast } from '../components/Toast.js';
import { openPlaceProfileCardModal } from '../components/PlaceProfileCardModal.js';
import { openOfferFullDetailsModal, openProductFullDetailsModal } from '../components/OfferProductModals.js';
import { resolveMapEmbedInfo, extractCoordinates } from '../../utils/maps.js';

export async function renderPlacePage($container, { slug, user }) {
  // Show skeleton
  $container.innerHTML = `
    <div class="place-hero skeleton"></div>
    <div class="container" style="max-width:var(--container-xl);margin:0 auto;padding:1rem">
      <div class="skeleton" style="height:120px;border-radius:16px;margin-top:-50px;margin-bottom:2rem"></div>
      <div class="skeleton" style="height:200px;border-radius:16px"></div>
    </div>
  `;

  try {
    const place = await getPlaceBySlug(slug);

    if (!place) {
      $container.innerHTML = `
        <div class="error-page">
          <div class="error-page__content animate-fade-in-up">
            <div class="error-page__code">404</div>
            <h1 class="error-page__title">المكان غير موجود</h1>
            <p class="error-page__text">عذراً، لم يتم العثور على هذا المكان أو قد يكون تم حذفه</p>
            <a href="places.html" class="btn btn-primary btn-lg">تصفح دليل الأماكن</a>
          </div>
        </div>
      `;
      return;
    }

    const currentUser = getCurrentUser() || user;
    const isOwner = currentUser && currentUser.uid === place.ownerId;
    const isUserAdmin = currentUser && isAdmin(currentUser);

    // Check if place is currently banned
    if (isPlaceBanned(place) && !isUserAdmin && !isOwner) {
      $container.innerHTML = `
        <div class="error-page" style="padding:80px 20px;text-align:center">
          <div class="error-page__content animate-fade-in-up" style="max-width:500px;margin:0 auto">
            <div style="font-size:64px;margin-bottom:16px">🚫</div>
            <h1 class="error-page__title" style="color:var(--danger,#EF4444);font-size:24px;margin-bottom:12px">هذا النشاط محظور حالياً</h1>
            <p class="error-page__text" style="color:var(--text-muted);line-height:1.6;margin-bottom:24px">
              تم حظر أو تعليق عرض هذا المكان مؤقتاً لمخالفة شروط وسياسات الاستخدام الخاصة بدليل المنزلة والمطرية الرقمي.
            </p>
            <a href="places.html" class="btn btn-primary btn-lg">العودة لدليل الأماكن</a>
          </div>
        </div>
      `;
      return;
    }

    const placeId = place.id || place._key;

    // Parallel load with safe fallbacks
    const [categories, offers, products, settings, reviews, allPublishedPlaces] = await Promise.all([
      getCategories().catch(() => []),
      getPlaceOffers(placeId).catch(() => []),
      getPlaceProducts(placeId).catch(() => []),
      getSettings().catch(() => ({})),
      getPlaceReviews(placeId).catch(() => []),
      getPublishedPlaces({ limit: 40 }).catch(() => [])
    ]);

    const category = categories?.find(c => c._key === place.categoryId || c.slug === place.categoryId);
    const catInfo = resolvePlaceCategoryInfo(place, category);
    const isFollowing = currentUser ? await isFollowingPlace(placeId, currentUser.uid).catch(() => false) : false;

    // ── Reviews / Ratings Summary ──
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const totalReviews = safeReviews.length;
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;

    safeReviews.forEach(review => {
      const rating = Math.min(5, Math.max(1, parseInt(review.rating, 10) || 5));
      starCounts[rating]++;
      ratingSum += rating;
    });

    const isHammad = place.slug === HAMMAD_PLACE_SLUG || placeId === HAMMAD_PLACE_SLUG || String(placeId).includes('mhmd-hmad') || String(place.name || '').includes('محمد حماد') || String(place.slug || '').includes('5lQJ1o');
    const avgRating = isHammad ? 5.0 : (totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0.0);
    const userReview = currentUser ? safeReviews.find(review => review.userId === currentUser.uid) : null;

    // Track View Count & Profile Visitor safely
    try { trackPlaceView(place, currentUser); } catch (_) {}

    // Update SEO safely
    try {
      setMeta({
        title: `${place.name} — ${catInfo.name || 'دليل المنزلة والمطرية الرقمي'}`,
        description: place.description || `تعرف على ${place.name} في المنزلة والمطرية — مواعيد العمل، أرقام التواصل، العنوان، والخدمات`,
        image: place.coverImageUrl || place.logoUrl,
        url: `https://elmanzala.com/place.html?slug=${place.slug}`
      });

      setPlaceSchema(place, category);
      setBreadcrumbSchema([
        { name: 'الرئيسية', url: 'https://elmanzala.com/' },
        { name: 'الأماكن', url: 'https://elmanzala.com/places.html' },
        { name: catInfo.name || 'القسم', url: `https://elmanzala.com/category.html?slug=${catInfo.slug}` },
        { name: place.name, url: `https://elmanzala.com/place.html?slug=${place.slug}` }
      ]);
    } catch (_) {}

    // Working hours status
    const isOpen = isPlaceOpen(place.workingHours);
    const workingHoursList = formatWorkingHours(place.workingHours);

    // Resolve Smart Google Map info (supports coords, short links, Plus codes, and addresses)
    const mapInfo = resolveMapEmbedInfo(place);

    // Render Full Page
    $container.innerHTML = `
      <!-- Place Hero Cover -->
      <section class="place-hero">
        ${place.coverImageUrl
          ? `<img src="${escAttr(place.coverImageUrl)}" alt="${escAttr(place.name)}" class="place-hero__cover" />`
          : `<div class="place-hero__cover-placeholder">${catInfo.icon || '🏪'}</div>`
        }
        <div class="place-hero__overlay"></div>
      </section>

      <!-- Main Layout -->
      <div class="place-layout container">
        <div class="place-main-col">
          
          <!-- Place Header Info Card -->
          <div class="place-header-card animate-fade-in-up">
            <div class="place-header-card__top">
              <div class="place-logo">
                ${place.logoUrl
                  ? `<img src="${escAttr(place.logoUrl)}" alt="${escAttr(place.name)} logo" />`
                  : `<div class="place-logo__placeholder">${catInfo.icon || '🏪'}</div>`
                }
              </div>
              <div class="place-header-card__info">
                <div class="place-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <h1 class="place-title__name" style="margin:0">${escHtml(place.name)}</h1>
                    ${((place.isSponsored || place.isFeatured || place.isPromoted) && (!place.sponsoredUntil || place.sponsoredUntil > Date.now())) ? renderSponsoredBadge() : ''}
                    ${place.isVerified ? renderVerifiedBadge() : ''}
                    ${place.deliveryType ? renderDeliveryBadge(place.deliveryType) : ''}
                    <span id="place-owner-online-container" class="place-owner-online-slot"></span>
                  </div>

                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <button type="button" class="btn-download-profile-card btn-download-profile-trigger" id="btn-download-profile-card" data-pid="${escAttr(placeId)}" title="تحميل البطاقة التعريفية لمشاركتها كصورة">
                      <span class="card-icon">🪪</span>
                      <span>تحميل البطاقة التعريفية</span>
                    </button>

                    <button type="button" class="btn btn-sm btn-outline btn-follow-place-trigger ${isFollowing ? 'following' : ''}" id="btn-follow-place" data-pid="${escAttr(placeId)}" style="border-radius:var(--radius-full);gap:5px;font-size:12px;padding:5px 12px;${isFollowing ? 'background:rgba(16,185,129,0.12);color:var(--success);border-color:var(--success);font-weight:700' : 'background:var(--surface);border-color:var(--border)'}" title="متابعة المكان ومشاهدة عروضه في حسابك">
                      <span class="follow-icon">${isFollowing ? '✓' : '🔔'}</span>
                      <span class="follow-label">${isFollowing ? 'متابع' : 'متابعة'}</span>
                      ${place.followersCount ? `<span class="follow-count-badge" style="opacity:0.8;font-size:11px">(${place.followersCount})</span>` : ''}
                    </button>

                    <button type="button" class="btn btn-sm btn-outline btn-share-place-trigger" style="border-radius:var(--radius-full);gap:5px;font-size:12px;padding:5px 12px;box-shadow:0 1px 4px rgba(0,0,0,0.05);background:var(--surface);border-color:var(--border)" title="مشاركة بطاقة هذا المكان">
                      <span>📤</span>
                      <span>مشاركة</span>
                    </button>
                  </div>
                </div>
                
                <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-top:4px">
                  <a href="category.html?slug=${catInfo.slug}" class="place-category-tag">
                    ${catInfo.icon} ${escHtml(catInfo.name)}
                  </a>
                  ${place.nameEn ? `<span style="color:var(--text-muted);font-size:var(--font-size-sm);direction:ltr">(${escHtml(place.nameEn)})</span>` : ''}
                  
                  <div style="display:inline-flex;align-items:center;gap:4px;color:#F59E0B;font-weight:700;font-size:12.5px;background:rgba(245,158,11,0.08);padding:3px 8px;border-radius:var(--radius-sm)">
                    <span>★</span>
                    <span>${avgRating.toFixed(1)}</span>
                    <span style="color:var(--text-muted);font-weight:normal;font-size:11px">(${totalReviews > 0 ? `${totalReviews} تقييم` : '0.0'})</span>
                  </div>
                </div>

                <div class="place-address">
                  <span>📍</span>
                  <span>${escHtml(place.address || place.area || 'مدينة المنزلة')}</span>
                </div>
              </div>
            </div>

            <!-- Quick Action Buttons -->
            <div class="place-contact-btns">
              ${place.phone ? `
                <a href="tel:${cleanPhone(place.phone)}" class="btn btn-primary" onclick="trackStat('${escAttr(placeId)}', 'phoneClicks')" title="اتصال هاتفي">
                  <span>📞</span>
                  <span>اتصال (${escHtml(place.phone)})</span>
                </a>
              ` : ''}
              
              ${place.whatsapp ? `
                <a href="https://wa.me/${formatWhatsApp(place.whatsapp)}?text=${encodeURIComponent(`مرحباً، وجدتك على دليل المنزلة والمطرية الرقمي وأود الاستفسار عن خدماتك`)}" 
                   target="_blank" 
                   rel="noopener" 
                   class="btn btn-whatsapp" 
                   onclick="trackStat('${escAttr(placeId)}', 'whatsappClicks')" 
                   title="محادثة واتساب">
                  <span>💬</span>
                  <span>محادثة واتساب</span>
                </a>
              ` : ''}
              
              ${place.mapsLink || place.location ? `
                <a href="${escAttr(mapInfo.directLink || place.mapsLink || `https://www.google.com/maps/search/?api=1&query=${place.location?.lat},${place.location?.lng}`)}" 
                   target="_blank" 
                   rel="noopener" 
                   class="btn btn-outline ${(!place.phone || !place.whatsapp) ? '' : 'btn--full-mobile'}" 
                   onclick="trackStat('${escAttr(placeId)}', 'directionsClicks')" 
                   title="الاتجاهات على الخريطة">
                  <span>🗺️</span>
                  <span>الاتجاهات على الخريطة</span>
                </a>
              ` : ''}

              ${isOwner ? `
                <a href="dashboard.html?section=places&id=${escAttr(placeId)}" class="btn btn-secondary btn--full-mobile">
                  <span>⚙️</span>
                  <span>إدارة وتعديل المكان</span>
                </a>
              ` : ''}
            </div>
          </div>

          <!-- Unverified Place Notice & Verification CTA -->
          ${!place.isVerified ? `
            <div class="unverified-notice animate-fade-in">
              <div class="unverified-notice__icon">ℹ️</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:var(--font-size-sm);color:var(--text-primary);margin-bottom:2px">
                  هذا الشخص أو المكان غير موثق حالياً
                </div>
                <div class="unverified-notice__text">
                  العلامة الموثقة تضمن صحة البيانات وتمنحك مميزات إضافية وتظهر قبل الجميع فى دليل المنزلة والمطرية الرقمي
                </div>
              </div>
              <div class="unverified-notice__actions">
                <button class="btn btn-sm btn-primary" id="btn-request-verification">
                  <span>🛡️</span> طلب التوثيق الآن
                </button>
                <button class="btn btn-sm btn-outline" id="btn-claim-place">
                  أنا صاحب هذا المكان
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Description -->
          ${place.description ? `
            <section class="info-card">
              <h2 class="info-card__title">
                <span>📝</span> عن الشخص / المكان / الخدمة
              </h2>
              <p style="white-space:pre-line;color:var(--text-secondary);line-height:1.8">
                ${escHtml(place.description)}
              </p>
            </section>
          ` : ''}

          <!-- Services / Tags -->
          ${place.services && place.services.length > 0 ? `
            <section class="info-card">
              <h2 class="info-card__title">
                <span>✨</span> الخدمات والمميزات
              </h2>
              <div class="services-tags">
                ${place.services.map(s => `<span class="chip chip--primary">✓ ${escHtml(s)}</span>`).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Active Offers Section -->
          ${offers && offers.length > 0 ? `
            <section class="info-card" id="place-offers-card">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-4)">
                <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:6px">
                  <span>🏷️</span> العروض والتخفيضات الحالية (${offers.length})
                </h2>
                <a href="offers.html?place=${escAttr(place.slug || place.id)}" class="btn btn-sm btn-outline" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);gap:4px">
                  🔍 تصفح كافة عروض المكان ↗
                </a>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4)">
                ${offers.map(offer => {
                  const discount = offer.discountPercent || calcDiscount(offer.oldPrice, offer.newPrice);
                  const days = daysUntil(offer.endDate);
                  return `
                    <div class="offer-card place-interactive-offer-card" data-offer-id="${escAttr(offer.id || offer._id)}" title="انقر لمشاهدة تفاصيل وطلب العرض">
                      <div class="offer-card__image">
                        ${offer.imageUrl 
                          ? `<img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" loading="lazy" />` 
                          : `<div style="padding:2rem;text-align:center;font-size:2.5rem;color:var(--text-muted)">🏷️</div>`}
                        ${discount > 0 ? `<span class="offer-card__discount-badge">خصم -${discount}%</span>` : ''}
                      </div>
                      <div class="offer-card__body">
                        <h3 class="offer-card__title">${escHtml(offer.title)}</h3>
                        ${offer.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-2);line-height:1.5">${escHtml(offer.description)}</p>` : ''}
                        <div class="offer-card__price">
                          <span class="offer-card__price-new">${formatPrice(offer.newPrice)}</span>
                          ${offer.oldPrice ? `<span class="offer-card__price-old">${formatPrice(offer.oldPrice)}</span>` : ''}
                        </div>
                        <div class="offer-card__expiry">⏰ ينتهي: ${formatDateRange(offer.startDate, offer.endDate)}</div>
                        <div class="offer-card__cta-btn">
                          <span>👁️ اضغط لمشاهدة تفاصيل وطلب العرض</span>
                          <span>↗</span>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Products Section (Only for verified places) -->
          ${place.isVerified && products && products.length > 0 ? `
            <section class="info-card" id="place-products-card">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-4)">
                <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:6px">
                  <span>🛍️</span> قائمة المنتجات والأسعار (${products.length})
                </h2>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="chip chip--success" style="font-size:11px">موثق ✓</span>
                  <a href="products.html?place=${escAttr(place.slug || place.id)}" class="btn btn-sm btn-outline" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);gap:4px">
                    🔍 تصفح كافة منتجات المكان ↗
                  </a>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-4)">
                ${products.map(p => `
                  <div class="product-card place-interactive-product-card" data-product-id="${escAttr(p.id)}" title="انقر لمشاهدة تفاصيل وطلب المنتج">
                    <div class="product-card__image">
                      ${p.imageUrl ? `<img src="${escAttr(p.imageUrl)}" alt="${escAttr(p.name)}" loading="lazy" />` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:var(--text-muted)">📦</div>`}
                      ${p.isFeatured ? `<span class="product-card__featured">مميز ⭐</span>` : ''}
                    </div>
                    <div class="product-card__body">
                      <h3 class="product-card__name">${escHtml(p.name)}</h3>
                      ${p.category ? `<div style="font-size:11px;color:var(--primary);margin-bottom:4px;font-weight:600">🏷️ ${escHtml(p.category)}</div>` : ''}
                      ${p.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-2);line-height:1.5">${escHtml(p.description)}</p>` : ''}
                      <div class="product-card__price">
                        <span class="product-card__price-current">${formatPrice(p.price)}</span>
                        ${p.oldPrice ? `<span class="product-card__price-old">${formatPrice(p.oldPrice)}</span>` : ''}
                      </div>
                      <div class="product-card__cta-btn">
                        <span>🛍️ اضغط لتفاصيل وطلب المنتج</span>
                        <span>↗</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Google-Style 5-Star Reviews & Ratings Section -->
          <section class="info-card reviews-section" id="place-reviews-card">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-4)">
              <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:8px">
                <span style="color:#F59E0B">⭐</span> تقييمات وآراء الزوار (${totalReviews})
              </h2>

              <div>
                ${currentUser ? `
                  ${userReview ? `
                    ${(!isHammad || currentUser.role === 'superadmin') ? `
                      <button class="btn btn-sm btn-outline" id="btn-open-review-modal" style="font-size:12.5px;border-radius:var(--radius-full)">
                        ✏️ تعديل تقييمي
                      </button>
                    ` : `
                      <span class="badge" style="background:rgba(245,158,11,0.12);color:#D97706;font-size:11.5px">✓ تم تسجيل تقييمك</span>
                    `}
                  ` : `
                    <button class="btn btn-sm btn-primary" id="btn-open-review-modal" style="font-size:12.5px;border-radius:var(--radius-full);box-shadow:0 2px 8px rgba(27,79,114,0.25)">
                      ⭐ اكتب تقييمك الآن
                    </button>
                  `}
                ` : `
                  <button class="btn btn-sm btn-secondary" id="btn-login-to-review" style="font-size:12.5px;border-radius:var(--radius-full)">
                    🔒 تسجيل الدخول للتقييم
                  </button>
                `}
              </div>
            </div>

            <!-- Reviews Sentiment Filter Tabs -->
            <div class="reviews-sentiment-tabs" style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
              <button type="button" class="btn btn-sm btn-outline review-filter-tab active" data-sentiment="all" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);background:var(--primary-alpha);font-weight:700">
                الكل (${totalReviews})
              </button>
              <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="positive" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);color:var(--success);border-color:rgba(16,185,129,0.3)">
                👍 إيجابي 3-5 نجوم (${safeReviews.filter(r => (Number(r.rating) || 5) >= 3).length})
              </button>
              <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="negative" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);color:var(--danger);border-color:rgba(239,68,68,0.3)">
                👎 سلبي 1-2 نجوم (${safeReviews.filter(r => (Number(r.rating) || 5) <= 2).length})
              </button>
            </div>

            <!-- Reviews List -->
            ${totalReviews === 0 ? `
              <div style="text-align:center;padding:2rem 1rem;color:var(--text-muted)">
                <div style="font-size:2.5rem;margin-bottom:8px">💬</div>
                <p style="font-size:13.5px;margin:0">كن أول من يكتب تقييماً وتجربة حقيقية عن هذا المكان!</p>
              </div>
            ` : `
              <div class="reviews-list" id="place-reviews-list" style="display:flex;flex-direction:column;gap:12px">
                ${safeReviews.map(r => {
                  const isMine = currentUser && currentUser.uid === r.userId;
                  const rStars = Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5));
                  const timeStr = formatDate(r.createdAt || Date.now());

                  return `
                    <div class="review-card" data-stars="${rStars}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;transition:all 0.2s">
                      
                      <!-- Header: User Info + Stars -->
                      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                        
                        <div style="display:flex;align-items:center;gap:10px">
                          <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);flex-shrink:0;border:1px solid var(--border)">
                            ${r.userPhoto ? `<img src="${escAttr(r.userPhoto)}" alt="${escAttr(r.userName)}" style="width:100%;height:100%;object-fit:cover" />` : (r.userName?.charAt(0) || '👤')}
                          </div>
                          <div>
                            <div style="font-weight:700;font-size:13.5px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                              <span>${escHtml(r.userName || 'مستخدم مسجل')}</span>
                              ${isMine ? `<span class="badge" style="font-size:10px;padding:1px 6px;background:var(--primary-alpha);color:var(--primary)">تقييمك</span>` : ''}
                            </div>
                            <div style="font-size:11px;color:var(--text-muted)">
                              ${timeStr} ${r.isEdited ? '• (معدل)' : ''}
                            </div>
                          </div>
                        </div>

                        <!-- Stars & Actions -->
                        <div style="display:flex;align-items:center;gap:10px">
                          <div style="color:#F59E0B;font-size:1.1rem;letter-spacing:1px">
                            ${'★'.repeat(rStars)}${'☆'.repeat(5 - rStars)}
                          </div>

                          ${isMine && (!isHammad || currentUser.role === 'superadmin') ? `
                            <div style="display:flex;gap:4px">
                              ${(r.editCount || 0) < 1 ? `
                                <button class="btn btn-ghost btn-sm btn-edit-review" data-rid="${escAttr(r.id)}" title="تعديل التقييم (مسموح مرة واحدة)" style="padding:2px 6px;font-size:12px">
                                  ✏️
                                </button>
                              ` : ''}
                              <button class="btn btn-ghost btn-sm btn-delete-review" data-rid="${escAttr(r.id)}" title="حذف التقييم" style="padding:2px 6px;font-size:12px;color:var(--danger)">
                                🗑️
                              </button>
                            </div>
                          ` : ''}
                        </div>

                      </div>

                      <!-- Comment Text (Strict plain text) -->
                      <div style="font-size:13.5px;line-height:1.6;color:var(--text-secondary);background:var(--surface-2);padding:10px 12px;border-radius:var(--radius-sm)">
                        ${escHtml(r.comment || '')}
                      </div>

                      <!-- Admin Reviewed Compliance Note (هذا التعليق تم الإبلاغ عنه وبعد المراجعة تأكدنا أنه يلتزم بالسياسة) -->
                      ${(r.isReviewedByAdmin && (r.adminReviewStatus === 'approved_compliant' || r.adminReviewNote)) ? `
                        <div class="admin-review-compliant-note" style="margin-top:8px;padding:8px 12px;background:rgba(16,185,129,0.08);border-right:3px solid #10B981;border-radius:var(--radius-sm);font-size:12px;color:#047857;line-height:1.5;display:flex;align-items:center;gap:6px">
                          <span>🛡️</span>
                          <span><strong>ملاحظة الإدارة:</strong> هذا التعليق تم الإبلاغ عنه، وبعد المراجعة تأكدنا أنه يلتزم بالسياسة ولا داعي لحذفه.</span>
                        </div>
                      ` : ''}

                      <!-- Report Action -->
                      ${!isMine ? `
                        <div style="display:flex;justify-content:flex-end;margin-top:6px">
                          <button type="button" class="btn-report-review" onclick="window.reportReviewAction('${escAttr(placeId)}', '${escAttr(r.id)}', '${escAttr(place.name)}')" style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:2px 4px;border-radius:4px;transition:color 0.2s" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'" title="الإبلاغ عن هذا التعليق كمسيء">
                            <span>🚩</span> الإبلاغ عن هذا التعليق كمسيء
                          </button>
                        </div>
                      ` : ''}

                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </section>

          <!-- Photo Gallery -->
          ${place.imageUrls && place.imageUrls.length > 0 ? `
            <section class="info-card">
              <h2 class="info-card__title">
                <span>🖼️</span> معرض الصور (${place.imageUrls.length})
              </h2>
              <div class="place-gallery">
                ${place.imageUrls.map((url, i) => `
                  <div class="place-gallery__item" onclick="openLightbox('${escAttr(url)}')">
                    <img src="${escAttr(url)}" alt="صورة ${escAttr(place.name)} ${i+1}" loading="lazy" />
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

        </div>

        <!-- Sidebar Col -->
        <div class="place-sidebar-col">
          
          <!-- Spotlight: شخصية / مكان اليوم الموثق -->
          <div class="spotlight-card" id="spotlight-place-container">
            <div class="skeleton" style="height:170px;border-radius:12px"></div>
          </div>

          <!-- Working Hours Card -->
          <div class="working-hours">
            <div class="working-hours__header" id="toggle-working-hours">
              <div class="working-hours__title">
                <span>🕒</span> مواعيد العمل
              </div>
              <div class="working-hours__status ${isOpen ? 'working-hours__status--open' : 'working-hours__status--closed'}">
                ${isOpen === null ? 'غير محدد' : (isOpen ? '🟢 مفتوح الآن' : '🔴 مغلق الآن')}
              </div>
            </div>
            <div class="working-hours__body expanded" id="working-hours-list">
              ${workingHoursList.map(h => `
                <div class="working-hours__row ${h.isToday ? 'working-hours__row--today' : ''}">
                  <span class="working-hours__day">${h.name} ${h.isToday ? '(اليوم)' : ''}</span>
                  <span class="working-hours__time ${h.closed ? 'working-hours__time--closed' : ''}">
                    ${h.closed ? 'مغلق' : `${h.open} — ${h.close}`}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Social Media Links (وسائل التواصل الاجتماعي) -->
          ${hasSocial(place.social) ? `
            <div class="info-card">
              <h3 class="info-card__title" style="font-size:var(--font-size-base)">
                <span>🌐</span> وسائل التواصل والموقع
              </h3>
              <div class="social-links" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
                ${place.social?.facebook ? `
                  <a href="${escAttr(place.social.facebook)}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--fb" title="فيسبوك">
                    ${SOCIAL_ICONS.facebook}
                    <span>فيسبوك</span>
                  </a>
                ` : ''}
                ${(place.social?.x || place.social?.twitter) ? `
                  <a href="${escAttr(place.social.x || place.social.twitter)}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--x" title="منصة X (تويتر)">
                    ${SOCIAL_ICONS.x}
                    <span>منصة X</span>
                  </a>
                ` : ''}
                ${place.social?.instagram ? `
                  <a href="${escAttr(place.social.instagram)}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--ig" title="إنستجرام">
                    ${SOCIAL_ICONS.instagram}
                    <span>إنستجرام</span>
                  </a>
                ` : ''}
                ${place.social?.tiktok ? `
                  <a href="${escAttr(place.social.tiktok)}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--tt" title="تيك توك">
                    ${SOCIAL_ICONS.tiktok}
                    <span>تيك توك</span>
                  </a>
                ` : ''}
                ${place.social?.threads ? `
                  <a href="${escAttr(place.social.threads)}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--th" title="ثريدز">
                    ${SOCIAL_ICONS.threads}
                    <span>ثريدز</span>
                  </a>
                ` : ''}
                ${place.social?.youtube ? `
                  <a href="${escAttr(place.social.youtube)}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--yt" title="يوتيوب">
                    ${SOCIAL_ICONS.youtube}
                    <span>يوتيوب</span>
                  </a>
                ` : ''}
                ${place.social?.website ? `
                  <a href="${escAttr(place.social.website)}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--web" title="الموقع الإلكتروني الرسمي">
                    ${SOCIAL_ICONS.website}
                    <span>الموقع الرسمي</span>
                  </a>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Google Maps Card -->
          <div class="info-card place-map-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);flex-wrap:wrap;gap:8px">
              <h3 class="info-card__title" style="margin:0;font-size:var(--font-size-base)">
                <span>🗺️</span> الموقع على الخريطة
              </h3>
              ${mapInfo.directLink ? `
                <a href="${escAttr(mapInfo.directLink)}" target="_blank" rel="noopener" class="btn btn-directions-gps" title="فتح مسار القيادة والملاحة المباشرة للوصول إلى هذا المكان عبر خرائط جوجل">
                  <span class="gps-icon">🧭</span>
                  <span>الوصول للمكان عبر الخرائط</span>
                  <span class="gps-arrow">↗</span>
                </a>
              ` : ''}
            </div>

            ${place.address ? `
              <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-secondary);margin-bottom:10px;background:var(--surface-2);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--border)">
                <span style="color:var(--primary);flex-shrink:0;font-size:14px">📌</span>
                <span class="truncate" style="font-weight:600">${escHtml(place.address)}</span>
              </div>
            ` : ''}

            <div class="place-map" style="position:relative;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);height:280px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
              <iframe 
                src="${escAttr(mapInfo.embedUrl)}" 
                style="border:0;width:100%;height:100%;display:block" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="strict-origin-when-cross-origin"
                title="موقع ${escAttr(place.name)}">
              </iframe>
            </div>
          </div>

        </div>
      </div>
    `;

    // ── Setup Interactivity ──

    // Asynchronous real-time map link coordinate resolution for short links (e.g. maps.app.goo.gl)
    if (place.mapsLink && (!place.location || !place.location.lat)) {
      extractCoordinates(place.mapsLink).then(async (resolvedCoords) => {
        if (resolvedCoords && resolvedCoords.lat && resolvedCoords.lng) {
          const mapIframe = document.querySelector('.place-map iframe');
          if (mapIframe) {
            mapIframe.src = `https://maps.google.com/maps?q=${resolvedCoords.lat},${resolvedCoords.lng}&hl=ar&z=17&output=embed`;
          }
          const mapDirectLink = document.querySelector('.info-card a.btn-directions-gps, .info-card a[href*="google.com/maps"], .info-card a[href*="maps.google.com"]');
          if (mapDirectLink) {
            mapDirectLink.href = `https://www.google.com/maps/dir/?api=1&destination=${resolvedCoords.lat},${resolvedCoords.lng}`;
          }
          if (mapDirectLink && !mapDirectLink.href.includes('q=')) {
            mapDirectLink.href = `https://www.google.com/maps?q=${resolvedCoords.lat},${resolvedCoords.lng}`;
          }
          // Silently cache into database for instant 0ms loads in the future
          try {
            await dbUpdate(`places/${placeId}`, {
              location: { lat: resolvedCoords.lat, lng: resolvedCoords.lng }
            });
          } catch (_) {}
        }
      }).catch(() => {});
    }

    // ── Live Owner Online Presence (متصل الآن بالأخضر) ──
    const ownerId = place.ownerId || place.userId || place.createdBy;
    const onlineContainer = document.getElementById('place-owner-online-container');

    if (onlineContainer) {
      const isCurrentOwner = currentUser && ownerId && currentUser.uid === ownerId;
      if (isCurrentOwner) {
        onlineContainer.innerHTML = renderOnlineBadge(true);
      } else if (ownerId) {
        subscribeToOwnerPresence(ownerId, ({ isOnline }) => {
          if (isOnline) {
            onlineContainer.innerHTML = renderOnlineBadge(true);
          } else {
            onlineContainer.innerHTML = '';
          }
        });
      }
    }

    // Working hours toggle
    document.getElementById('toggle-working-hours')?.addEventListener('click', () => {
      document.getElementById('working-hours-list')?.classList.toggle('expanded');
    });

    // ── Interactive Offers & Products Full Details Modal Triggers ──
    document.querySelectorAll('.place-interactive-offer-card').forEach(card => {
      card.addEventListener('click', () => {
        const oId = card.getAttribute('data-offer-id');
        const targetOffer = (offers || []).find(o => (o.id || o._id) === oId);
        if (targetOffer) {
          openOfferFullDetailsModal(targetOffer, place);
        }
      });
    });

    document.querySelectorAll('.place-interactive-product-card').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-product-id');
        const targetProduct = (products || []).find(p => p.id === pId);
        if (targetProduct) {
          openProductFullDetailsModal(targetProduct, place);
        }
      });
    });

    // Verification Request Button
    const waUrl = settings?.contact?.whatsappLink || 'https://wa.me/wasendernew';

    document.getElementById('btn-request-verification')?.addEventListener('click', () => {
      showVerificationModal(place, user, waUrl);
    });

    document.getElementById('btn-claim-place')?.addEventListener('click', () => {
      showClaimModal(place, waUrl);
    });

    // Login to review
    document.getElementById('btn-login-to-review')?.addEventListener('click', async () => {
      try {
        const loggedUser = await signInWithGoogle();
        if (loggedUser) {
          renderPlacePage($container, { slug, user: loggedUser });
        }
      } catch (err) {
        toast.error('تعذر تسجيل الدخول: ' + err.message);
      }
    });

    // Open Add / Edit Review Modal
    document.getElementById('btn-open-review-modal')?.addEventListener('click', () => {
      openReviewModal(place, currentUser, userReview, () => {
        renderPlacePage($container, { slug, user: currentUser });
      });
    });

    // Edit specific review button
    document.querySelectorAll('.btn-edit-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const rId = btn.getAttribute('data-rid');
        const targetReview = safeReviews.find(r => r.id === rId);
        if (targetReview) {
          openReviewModal(place, currentUser, targetReview, () => {
            renderPlacePage($container, { slug, user: currentUser });
          });
        }
      });
    });

    // Delete review button
    document.querySelectorAll('.btn-delete-review').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rId = btn.getAttribute('data-rid');
        const ok = await showConfirm({
          title: 'حذف التقييم',
          message: 'هل أنت متأكد من رغبتك في حذف تقييمك لهذا المكان؟',
          confirmText: 'نعم، حذف',
          cancelText: 'إلغاء'
        });
        if (ok) {
          try {
            await deletePlaceReview(place.id || place._key, rId, currentUser);
            toast.success('تم حذف التقييم');
            renderPlacePage($container, { slug, user: currentUser });
          } catch (err) {
            toast.error(err.message || 'فشل حذف التقييم');
          }
        }
      });
    });

    // Setup Place Sharing Handlers (Web Share + Modal)
    setupPlaceSharing(place);

    // Setup Place Profile Card Download Modal (Manhom Style)
    document.querySelectorAll('.btn-download-profile-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        openPlaceProfileCardModal(place, category);
      });
    });

    // Mount Spotlight of Today Widget (شخصية / مكان اليوم الموثق)
    mountSpotlightPlaceWidget(allPublishedPlaces, placeId, settings?.contact?.whatsappLink || 'https://wa.me/wasendernew');

    // Setup Place Following System
    setupPlaceFollowing(placeId, currentUser);

    // Setup Reviews Sentiment Filter Tabs
    setupReviewsSentimentFilter();

  } catch (err) {
    console.error('[PlacePage] Render error:', err);
    $container.innerHTML = `
      <div class="empty-state" style="padding:4rem 1rem">
        <div class="empty-state__icon">⚠️</div>
        <h2 class="empty-state__title">حدث خطأ أثناء تحميل بيانات المكان</h2>
        <button class="btn btn-primary" onclick="location.reload()">تحديث الصفحة</button>
      </div>
    `;
  }
}

function mountSpotlightPlaceWidget(allPlaces = [], currentPlaceId = '', waBaseUrl = 'https://wa.me/wasendernew') {
  const container = document.getElementById('spotlight-place-container');
  if (!container) return;

  const verifiedPlaces = (allPlaces || []).filter(p => 
    (p.isVerified || (p.verifiedUntil && Number(p.verifiedUntil) > Date.now())) && 
    (p.id !== currentPlaceId && p._key !== currentPlaceId && p.slug !== currentPlaceId)
  );

  const fallbackPlaces = (allPlaces || []).filter(p => 
    (p.isVerified || p.isSponsored || p.isFeatured) &&
    (p.id !== currentPlaceId && p._key !== currentPlaceId && p.slug !== currentPlaceId)
  );

  const candidates = verifiedPlaces.length > 0 ? verifiedPlaces : (fallbackPlaces.length > 0 ? fallbackPlaces : allPlaces.filter(p => p.id !== currentPlaceId));

  if (!candidates || candidates.length === 0) {
    container.style.display = 'none';
    return;
  }

  let currentIndex = Math.floor(Date.now() / 60000) % candidates.length;

  const renderCard = (targetPlace) => {
    if (!targetPlace) return;
    const pName = targetPlace.name || 'شخصية اليوم';
    const pCategory = targetPlace.categoryName || targetPlace.customCategory || 'نشاط موثق';
    const pArea = targetPlace.area || targetPlace.address || 'المنزلة';
    const pImg = targetPlace.logoUrl || targetPlace.coverImageUrl || './icons/icon-72x72.png';
    const pSlug = targetPlace.slug || targetPlace.id || targetPlace._key;

    const waMsg = encodeURIComponent('مرحباً، أود توثيق مكاني / شخصيتي في دليل المنزلة والمطرية الرقمي للظهور في مكان/شخصية اليوم');
    const waUrl = waBaseUrl.includes('?') ? `${waBaseUrl}&text=${waMsg}` : `${waBaseUrl}?text=${waMsg}`;

    container.innerHTML = `
      <div class="spotlight-header">
        <div class="spotlight-title">
          <span class="spotlight-badge-icon">🛡️</span>
          <span>شخصية / مكان اليوم</span>
        </div>
        <span class="chip chip--success" style="font-size:10px;padding:2px 8px;font-weight:700">موثق ✓</span>
      </div>

      <div class="spotlight-body animate-fade-in" id="spotlight-body-content">
        <a href="place.html?slug=${encodeURIComponent(pSlug)}" class="spotlight-profile-link" title="عرض ملف ${escAttr(pName)}">
          <div class="spotlight-avatar-box">
            <img src="${escAttr(pImg)}" alt="${escAttr(pName)}" class="spotlight-avatar-img" onerror="this.src='./icons/icon-72x72.png'" />
          </div>
          <div class="spotlight-info">
            <div class="spotlight-name">
              <span>${escHtml(pName)}</span>
              <span class="spotlight-v-badge" title="موثق">✓</span>
            </div>
            <div class="spotlight-category">${escHtml(pCategory)}</div>
            <div class="spotlight-area">📍 ${escHtml(pArea)}</div>
          </div>
        </a>

        <a href="${escAttr(waUrl)}" 
           target="_blank" 
           rel="noopener" 
           class="btn-spotlight-claim" 
           title="طلب توثيق ملفك للظهور في شخصية ومكان اليوم">
          <span class="claim-icon">🛡️</span>
          <span>وثق مكانك أو شخصيتك لتظهر هنا</span>
          <span class="claim-arrow">←</span>
        </a>
      </div>
    `;
  };

  renderCard(candidates[currentIndex]);

  // Rotate every 60 seconds (1 minute)
  if (candidates.length > 1) {
    if (window._spotlightInterval) clearInterval(window._spotlightInterval);
    window._spotlightInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % candidates.length;
      renderCard(candidates[currentIndex]);
    }, 60000);
  }
}

function showVerificationModal(place, user, waUrl) {
  showModal({
    title: 'طلب توثيق النشاط / الشخص / المكان',
    size: 'sm',
    content: `
      <div class="verification-modal__steps">
        <div class="verification-step">
          <div class="verification-step__num">1</div>
          <div>
            <div class="verification-step__title">مراجعة إدارة المنصة</div>
            <div class="verification-step__text">يتم تدقيق بيانات النشاط أو المهنة لضمان دقة الدليل لأهل المنزلة</div>
          </div>
        </div>
        <div class="verification-step">
          <div class="verification-step__num">2</div>
          <div>
            <div class="verification-step__title">مميزات التوثيق الفوري</div>
            <div class="verification-step__text">علامة التوثيق المعتمدة ✓ + إضافة المنتجات والعروض + أولوية الظهور في نتائج البحث والتصدر في دليل المنزلة والمطرية الرقمي</div>
          </div>
        </div>
        <div class="verification-step">
          <div class="verification-step__num">3</div>
          <div>
            <div class="verification-step__title">التواصل عبر واتساب</div>
            <div class="verification-step__text">اضغط على الزر أدناه للتواصل المباشر مع إدارة المنصة لطلب التوثيق</div>
          </div>
        </div>
      </div>
    `,
    buttons: [
      {
        label: '💬 طلب التوثيق عبر WhatsApp',
        type: 'whatsapp',
        onClick: async () => {
          if (user) {
            try {
              await submitVerificationRequest(place.id || place._key, user);
              toast.success('تم تسجيل طلب التوثيق وإرساله للإدارة');
            } catch (e) {
              console.warn('Req submit error:', e);
            }
          }
          const text = encodeURIComponent(`السلام عليكم، أود طلب توثيق نشاطي على منصة المنزلة وناسها:\nالاسم: ${place.name}\nرابط النشاط: https://elmanzala.com/place.html?slug=${place.slug}`);
          window.open(`${waUrl}?text=${text}`, '_blank');
        },
        closeOnClick: true
      },
      {
        label: 'إلغاء',
        type: 'ghost',
        closeOnClick: true
      }
    ]
  });
}

function showClaimModal(place, waUrl) {
  showModal({
    title: 'ملكية هذا النشاط',
    size: 'sm',
    content: `
      <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:1rem">
        هل أنت صاحب أو مدير <strong>${escHtml(place.name)}</strong>؟ تواصل مع إدارة المنصة عبر واتساب لتأكيد ملكية المكان والتحكم الكامل في بياناته وعروضه.
      </p>
    `,
    buttons: [
      {
        label: '💬 تواصل مع الإدارة عبر WhatsApp',
        type: 'whatsapp',
        onClick: () => {
          const text = encodeURIComponent(`مرحباً، أنا صاحب مكان "${place.name}" وأود ربط المكان بحسابي على منصة المنزلة وناسها.`);
          window.open(`${waUrl}?text=${text}`, '_blank');
        },
        closeOnClick: true
      },
      {
        label: 'إغلاق',
        type: 'ghost',
        closeOnClick: true
      }
    ]
  });
}

// Lightbox helper
if (typeof window !== 'undefined') {
  window.openLightbox = (imgUrl) => {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <img src="${escAttr(imgUrl)}" class="lightbox__img" alt="صورة مكبرة" />
    `;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  };
}

function hasSocial(social) {
  if (!social || typeof social !== 'object') return false;
  return Boolean(
    social.facebook ||
    social.instagram ||
    social.tiktok ||
    social.youtube ||
    social.threads ||
    social.x ||
    social.twitter ||
    social.website
  );
}

const SOCIAL_ICONS = {
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none"><rect width="20" height="20" x="2" y="2" rx="5" fill="url(#ig-grad)"/><path fill="#fff" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/><defs><linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#f09433"/><stop offset=".25" stop-color="#e6683c"/><stop offset=".5" stop-color="#dc2743"/><stop offset=".75" stop-color="#cc2366"/><stop offset="1" stop-color="#bc1888"/></linearGradient></defs></svg>`,
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.67 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.33V9.28a8.28 8.28 0 0 0 3.91 1.05v-3.45a4.85 4.85 0 0 1-.02-.19z"/></svg>`,
  threads: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24C5.467 24 .017 18.598.017 11.933.017 5.268 5.467-.134 12.186-.134c6.72 0 12.17 5.402 12.17 12.067 0 6.665-5.45 12.067-12.17 12.067zm0-2.317c5.441 0 9.853-4.366 9.853-9.75 0-5.385-4.412-9.75-9.853-9.75-5.441 0-9.853 4.365-9.853 9.75 0 5.384 4.412 9.75 9.853 9.75zm1.536-5.834c-1.39 0-2.333-.708-2.333-2.023 0-1.314.943-2.023 2.333-2.023 1.39 0 2.333.709 2.333 2.023 0 1.315-.943 2.023-2.333 2.023z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  website: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
};

export function resolvePlaceCategoryInfo(place, category = null) {
  const customCat = (place.customCategory || place.categoryName || '').trim();
  const catId = (place.categoryId || '').toLowerCase();
  
  let name = '';
  if (customCat && customCat !== 'other' && customCat !== 'أخرى' && customCat !== 'عام') {
    name = customCat;
  } else if (category && category.name && category.name !== 'أخرى' && category.name !== 'عام') {
    name = category.name;
  } else if (place.categoryName && place.categoryName !== 'أخرى' && place.categoryName !== 'عام') {
    name = place.categoryName;
  } else {
    name = customCat || 'خدمات وأنشطة';
  }

  // AI Semantic Icon Matching
  let icon = category?.icon;
  if (!icon || icon === '📁' || catId === 'other') {
    const raw = (name + ' ' + (place.name || '') + ' ' + (place.description || '')).toLowerCase();
    
    if (raw.includes('تصوير') || raw.includes('فوتو') || raw.includes('استوديو') || raw.includes('كاميرا')) icon = '📸';
    else if (raw.includes('رخام') || raw.includes('جرانيت') || raw.includes('محجر') || raw.includes('بلاط')) icon = '🏛️';
    else if (raw.includes('برمج') || raw.includes('كمبيوتر') || raw.includes('سوفت وير') || raw.includes('موقع') || raw.includes('تطوير') || raw.includes('سايبر')) icon = '💻';
    else if (raw.includes('تعليم') || raw.includes('سنتر') || raw.includes('درس') || raw.includes('مدرس') || raw.includes('حضانة') || raw.includes('كورس') || raw.includes('أكاديم')) icon = '📚';
    else if (raw.includes('حلو') || raw.includes('تورت') || raw.includes('كيك') || raw.includes('شوكول') || raw.includes('باتيسري') || raw.includes('بسبوس')) icon = '🍰';
    else if (raw.includes('ورد') || raw.includes('زهور') || raw.includes('هد') || raw.includes('بوكيه') || raw.includes('تغليف')) icon = '💐';
    else if (raw.includes('ميكاب') || raw.includes('بيوتي') || raw.includes('تجميل') || raw.includes('كوافير') || raw.includes('صالون')) icon = '💄';
    else if (raw.includes('ملابس') || raw.includes('فستان') || raw.includes('عباي') || raw.includes('أتيليه') || raw.includes('خياط') || raw.includes('ترزي') || raw.includes('أزياء')) icon = '👗';
    else if (raw.includes('بدل') || raw.includes('رجالي') || raw.includes('قميص') || raw.includes('كلاسيك')) icon = '👔';
    else if (raw.includes('حذاء') || raw.includes('أحذية') || raw.includes('كوتش') || raw.includes('شنط') || raw.includes('جلود')) icon = '👟';
    else if (raw.includes('عقار') || raw.includes('شقق') || raw.includes('مقاول') || raw.includes('بناء') || raw.includes('تشطيب') || raw.includes('ديكور') || raw.includes('معمار')) icon = '🏢';
    else if (raw.includes('عرب') || raw.includes('سيار') || raw.includes('ميكانيك') || raw.includes('قطع غيار') || raw.includes('زيوت') || raw.includes('كاوتش') || raw.includes('تأجير')) icon = '🚗';
    else if (raw.includes('توكتوك') || raw.includes('موتوسيكل') || raw.includes('دراج') || raw.includes('دليفري') || raw.includes('مشاوير')) icon = '🛵';
    else if (raw.includes('دهان') || raw.includes('نقاش') || raw.includes('بويات') || raw.includes('ألوان')) icon = '🎨';
    else if (raw.includes('نجار') || raw.includes('موبيليا') || raw.includes('غرف') || raw.includes('أثاث') || raw.includes('خشب')) icon = '🪚';
    else if (raw.includes('سباك') || raw.includes('فلتر') || raw.includes('فلاتر') || raw.includes('مواسير') || raw.includes('أدوات صحية')) icon = '🪠';
    else if (raw.includes('كهرب') || raw.includes('أجهزة') || raw.includes('إلكترون') || raw.includes('تكييف') || raw.includes('تبريد')) icon = '⚡';
    else if (raw.includes('بيطر') || raw.includes('أعلاف') || raw.includes('دواجن') || raw.includes('فراخ') || raw.includes('كتاكيت') || raw.includes('طيور') || raw.includes('كلاب') || raw.includes('قطط')) icon = '🐾';
    else if (raw.includes('سمك') || raw.includes('أسماك') || raw.includes('فسيخ') || raw.includes('رنجة') || raw.includes('جمبري') || raw.includes('بحري')) icon = '🐟';
    else if (raw.includes('جزار') || raw.includes('لحوم') || raw.includes('كبدة') || raw.includes('مشويات') || raw.includes('كباب')) icon = '🥩';
    else if (raw.includes('خضار') || raw.includes('فاكه') || raw.includes('خضروات') || raw.includes('فواكه')) icon = '🥦';
    else if (raw.includes('عطار') || raw.includes('بهارات') || raw.includes('أعشاب') || raw.includes('توابل')) icon = '🌿';
    else if (raw.includes('بصريات') || raw.includes('نظارات') || raw.includes('عدسات') || raw.includes('عيون')) icon = '👓';
    else if (raw.includes('جيم') || raw.includes('رياض') || raw.includes('فتنس') || raw.includes('كمال أجسام') || raw.includes('تخسيس')) icon = '🏋️';
    else if (raw.includes('ألعاب') || raw.includes('بلايستيشن') || raw.includes('بلاي ستيشن') || raw.includes('أطفال') || raw.includes('ملاهي')) icon = '🎮';
    else if (raw.includes('سياح') || raw.includes('رحلات') || raw.includes('طيران') || raw.includes('حجز') || raw.includes('عمرة')) icon = '✈️';
    else if (raw.includes('مطعم') || raw.includes('أكل') || raw.includes('كريب') || raw.includes('شاورما') || raw.includes('بيتزا') || raw.includes('فطائر')) icon = '🍽️';
    else if (raw.includes('كافيه') || raw.includes('قهوة') || raw.includes('بن') || raw.includes('شاي') || raw.includes('عصائر') || raw.includes('مشروبات')) icon = '☕';
    else if (raw.includes('صيدل') || raw.includes('دواء') || raw.includes('أدوية') || raw.includes('علاج')) icon = '💊';
    else if (raw.includes('دكتور') || raw.includes('طبيب') || raw.includes('عياد') || raw.includes('استشاري') || raw.includes('أخصائي') || raw.includes('أسنان') || raw.includes('معمل') || raw.includes('تحاليل')) icon = '🩺';
    else if (raw.includes('سوبر') || raw.includes('ماركت') || raw.includes('بقالة') || raw.includes('هايبر')) icon = '🛒';
    else if (raw.includes('مكتب') || raw.includes('أدوات مدرسية') || raw.includes('طباعة') || raw.includes('تصوير مستندات')) icon = '📖';
    else if (raw.includes('حلاق') || raw.includes('تصفيف') || raw.includes('شعر')) icon = '💈';
    else if (raw.includes('موبايل') || raw.includes('هاتف') || raw.includes('هواتف') || raw.includes('صيانة موبايل')) icon = '📱';
    else icon = '✨';
  }

  const slug = category?.slug || place.categoryId || 'other';
  return { name, icon, slug };
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function cleanPhone(phone) {
  return phone?.replace(/\D/g, '') || '';
}

function formatWhatsApp(phone) {
  let cleaned = cleanPhone(phone);
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return '2' + cleaned;
  }
  return cleaned;
}



/**
 * Open interactive 5-star review modal
 */
function openReviewModal(place, user, existingReview, onDone) {
  let selectedRating = existingReview ? (Number(existingReview.rating) || 5) : 5;

  const modal = showModal({
    title: existingReview ? '✏️ تعديل تقييمك للمكان' : '⭐ إضافة تقييم ورأي عن المكان',
    size: 'md',
    content: `
      <form id="place-review-form" style="display:flex;flex-direction:column;gap:16px">
        
        <!-- Place Name Header -->
        <div style="font-weight:700;font-size:14px;color:var(--primary);display:flex;align-items:center;gap:6px">
          <span>📍</span> ${escHtml(place.name)}
        </div>

        <!-- Stars Picker -->
        <div style="text-align:center;background:var(--surface-2);padding:16px;border-radius:var(--radius-md);border:1px solid var(--border)">
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">
            اضغط لاختيار عدد النجوم:
          </div>
          <div id="star-picker" style="display:inline-flex;gap:6px;direction:ltr;cursor:pointer;font-size:2.2rem;line-height:1">
            ${[1, 2, 3, 4, 5].map(num => `
              <span class="star-item" data-star="${num}" style="color:${num <= selectedRating ? '#F59E0B' : '#D1D5DB'};transition:transform 0.15s">★</span>
            `).join('')}
          </div>
          <div id="star-label" style="font-size:12px;font-weight:700;color:#F59E0B;margin-top:6px">
            ${getStarLabel(selectedRating)}
          </div>
        </div>

        <!-- Textarea (Strict plain text) -->
        <div class="form-group" style="margin:0">
          <label class="form-label" style="display:flex;justify-content:space-between;align-items:center">
            <span>رأيك وتجربتك بالتفصيل (نص فقط) <span class="required">*</span></span>
            <span id="char-counter" style="font-size:11px;color:var(--text-muted)">0 / 500</span>
          </label>
          <textarea 
            id="review-comment-input" 
            class="form-textarea" 
            rows="4" 
            maxlength="500"
            placeholder="اكتب تجربتك الصادقة عن هذا المكان..." 
            required>${escHtml(existingReview?.comment || '')}</textarea>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
            🔒 لا يُسمح بوضع روابط أو ملفات، التقييم يشمل نصوصاً واضحة فقط.
          </div>
        </div>

      </form>
    `,
    buttons: [
      {
        label: existingReview ? '💾 حفظ التعديل' : '🚀 نشر التقييم',
        type: 'primary',
        closeOnClick: false,
        onClick: async () => {
          const commentVal = document.getElementById('review-comment-input')?.value.trim();
          if (!commentVal) {
            toast.warning('يرجى كتابة نص التقييم');
            return;
          }

          try {
            if (existingReview) {
              await updatePlaceReview(place.id || place._key, existingReview.id, {
                rating: selectedRating,
                comment: commentVal
              }, user);
              toast.success('تم تحديث تقييمك بنجاح ✨');
            } else {
              await addPlaceReview({
                placeId: place.id || place._key,
                placeName: place.name,
                placeSlug: place.slug,
                user,
                rating: selectedRating,
                comment: commentVal
              });
              toast.success('شكراً لمشاركتك! تم نشر تقييمك بنجاح ⭐');
            }
            modal.close();
            if (onDone) onDone();
          } catch (err) {
            toast.error(err.message || 'فشل حفظ التقييم');
          }
        }
      },
      { label: 'إلغاء', type: 'ghost', closeOnClick: true }
    ]
  });

  // Setup Star Interactivity
  const starContainer = document.getElementById('star-picker');
  const starLabel = document.getElementById('star-label');
  const commentInput = document.getElementById('review-comment-input');
  const charCounter = document.getElementById('char-counter');

  function updateStars(val) {
    selectedRating = val;
    starContainer?.querySelectorAll('.star-item').forEach(el => {
      const s = parseInt(el.getAttribute('data-star'), 10);
      el.style.color = s <= val ? '#F59E0B' : '#D1D5DB';
    });
    if (starLabel) starLabel.textContent = getStarLabel(val);
  }

  starContainer?.querySelectorAll('.star-item').forEach(el => {
    el.addEventListener('click', () => {
      const s = parseInt(el.getAttribute('data-star'), 10);
      updateStars(s);
    });
    el.addEventListener('mouseenter', () => {
      const s = parseInt(el.getAttribute('data-star'), 10);
      starContainer.querySelectorAll('.star-item').forEach(item => {
        const itemVal = parseInt(item.getAttribute('data-star'), 10);
        item.style.color = itemVal <= s ? '#F59E0B' : '#D1D5DB';
      });
      if (starLabel) starLabel.textContent = getStarLabel(s);
    });
  });

  starContainer?.addEventListener('mouseleave', () => {
    updateStars(selectedRating);
  });

  commentInput?.addEventListener('input', () => {
    if (charCounter) {
      charCounter.textContent = `${commentInput.value.length} / 500`;
    }
  });

  if (commentInput && charCounter) {
    charCounter.textContent = `${commentInput.value.length} / 500`;
  }
}

function getStarLabel(rating) {
  const labels = {
    5: 'ممتاز جداً ★★★★★',
    4: 'جيد جداً ★★★★☆',
    3: 'متوسط / مقبول ★★★☆☆',
    2: 'ضعيف ★★☆☆☆',
    1: 'سيء جداً ★☆☆☆☆'
  };
  return labels[rating] || 'ممتاز ★★★★★';
}

/**
 * Setup Place Sharing (Web Share API + Custom Modal Fallback)
 */
function setupPlaceSharing(place) {
  const triggers = document.querySelectorAll('.btn-share-place-trigger');
  if (!triggers.length) return;

  const placeName = place.name || 'المكان';
  const placeAddress = place.address || place.area || 'مدينة المنزلة، محافظة الدقهلية';
  const placeUrl = window.location.href;
  const placeSlug = place.slug || place.id || '';
  const ogProxyUrl = `https://elmanzala.nonm1724.workers.dev/p/${encodeURIComponent(placeSlug)}`;
  const coverUrl = place.coverImageUrl || place.logoUrl || 'https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/assets/og-default.webp';

  const shareText = `📍 *${placeName}*
📌 العنوان: ${placeAddress}
🔗 رابط المكان على الدليل: ${placeUrl}

✨ تم مشاركة هذه البطاقة من دليل المنزلة والمطرية الرقمي.. أنتم كمان ممكن تضيفوا محلكم أو شركتكم مجاناً معنا من هنا:
🌐 https://dalilmanzala.com`;

  triggers.forEach(btn => {
    btn.addEventListener('click', async () => {
      // 1. Try Native Web Share API (Mobile native app chooser)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${placeName} | دليل المنزلة والمطرية الرقمي`,
            text: shareText,
            url: ogProxyUrl
          });
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            openCustomShareModal({ placeName, placeAddress, placeUrl, ogProxyUrl, coverUrl, shareText });
          }
          return;
        }
      }

      // 2. Custom Share Modal Fallback
      openCustomShareModal({ placeName, placeAddress, placeUrl, ogProxyUrl, coverUrl, shareText });
    });
  });
}

function openCustomShareModal({ placeName, placeAddress, placeUrl, ogProxyUrl, coverUrl, shareText }) {
  const waShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const tgShare = `https://t.me/share/url?url=${encodeURIComponent(ogProxyUrl || placeUrl)}&text=${encodeURIComponent(shareText)}`;
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogProxyUrl || placeUrl)}`;
  const twShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(ogProxyUrl || placeUrl)}`;

  const modal = showModal({
    title: '📤 مشاركة بطاقة المكان',
    size: 'sm',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px;text-align:center">
        ${coverUrl ? `
          <div style="width:100%;height:130px;border-radius:var(--radius-md);overflow:hidden;background:#1B4F72">
            <img src="${escAttr(coverUrl)}" alt="${escAttr(placeName)}" style="width:100%;height:100%;object-fit:cover" />
          </div>
        ` : ''}

        <div>
          <h3 style="font-size:16px;font-weight:700;margin:0 0 4px 0;color:var(--text-primary)">${escHtml(placeName)}</h3>
          <p style="font-size:12.5px;color:var(--text-muted);margin:0">📍 ${escHtml(placeAddress)}</p>
        </div>

        <div style="font-size:12px;color:var(--text-secondary);background:var(--surface-2);padding:10px 12px;border-radius:var(--radius-md);line-height:1.6;border:1px solid var(--border)">
          ✨ تم مشاركة هذه البطاقة من دليل المنزلة والمطرية الرقمي..<br/>
          أنتم كمان ممكن تضيفوا محلكم أو شركتكم مجاناً معنا من هنا:<br/>
          <a href="https://dalilmanzala.com" target="_blank" rel="noopener" style="color:var(--primary);font-weight:700">dalilmanzala.com</a>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
          <a href="${escAttr(waShare)}" target="_blank" rel="noopener" class="btn btn-whatsapp" style="padding:10px;font-size:13px;border-radius:var(--radius-md);justify-content:center">
            <span>💬</span> واتساب
          </a>
          <a href="${escAttr(tgShare)}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:10px;font-size:13px;border-radius:var(--radius-md);justify-content:center;background:#0088cc;border-color:#0088cc">
            <span>✈️</span> تليجرام
          </a>
          <a href="${escAttr(fbShare)}" target="_blank" rel="noopener" class="btn btn-outline" style="padding:10px;font-size:13px;border-radius:var(--radius-md);justify-content:center;color:#1877f2;border-color:#1877f2">
            <span>👍</span> فيسبوك
          </a>
          <a href="${escAttr(twShare)}" target="_blank" rel="noopener" class="btn btn-outline" style="padding:10px;font-size:13px;border-radius:var(--radius-md);justify-content:center">
            <span>✖️</span> منصة X
          </a>
        </div>

        <button type="button" class="btn btn-secondary btn-copy-share-link" style="width:100%;margin-top:4px;border-radius:var(--radius-md);justify-content:center;font-size:13px;padding:10px">
          <span>📋</span> نسخ تفاصيل ورابط البطاقة
        </button>
      </div>
    `,
    buttons: [
      { label: 'إغلاق', type: 'ghost', closeOnClick: true }
    ]
  });

  document.querySelector('.btn-copy-share-link')?.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        toast.success('تم نسخ رابط وتفاصيل المكان بنجاح! 📋');
      } else {
        toast.info('الرابط: ' + placeUrl);
      }
    } catch (_) {
      toast.info('الرابط: ' + placeUrl);
    }
  });
}

/**
 * Setup Follow Place Button Live Toggle
 */
function setupPlaceFollowing(placeId, currentUser) {
  const btn = document.getElementById('btn-follow-place');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!currentUser) {
      toast.info('يرجى تسجيل الدخول أولاً لتتمكن من متابعة هذا المكان ومشاهدة عروضه في حسابك');
      setTimeout(() => {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      }, 1200);
      return;
    }

    const isNowFollowing = btn.classList.contains('following');
    const iconEl = btn.querySelector('.follow-icon');
    const labelEl = btn.querySelector('.follow-label');
    const countBadge = btn.querySelector('.follow-count-badge');

    try {
      if (isNowFollowing) {
        await unfollowPlace(placeId, currentUser);
        btn.classList.remove('following');
        btn.style.background = 'var(--surface)';
        btn.style.color = '';
        btn.style.borderColor = 'var(--border)';
        btn.style.fontWeight = 'normal';
        if (iconEl) iconEl.textContent = '🔔';
        if (labelEl) labelEl.textContent = 'متابعة';
        if (countBadge) {
          const c = Math.max(0, parseInt(countBadge.textContent.replace(/\D/g, ''), 10) - 1);
          countBadge.textContent = c > 0 ? `(${c})` : '';
        }
        toast.info('تم إلغاء متابعة المكان');
      } else {
        await followPlace(placeId, currentUser);
        btn.classList.add('following');
        btn.style.background = 'rgba(16,185,129,0.12)';
        btn.style.color = 'var(--success)';
        btn.style.borderColor = 'var(--success)';
        btn.style.fontWeight = '700';
        if (iconEl) iconEl.textContent = '✓';
        if (labelEl) labelEl.textContent = 'متابع';
        if (countBadge) {
          const c = (parseInt(countBadge.textContent.replace(/\D/g, ''), 10) || 0) + 1;
          countBadge.textContent = `(${c})`;
        }
        toast.success('تمت متابعة المكان بنجاح! ستظهر عروضه فوراً في قسم المتابعة بحسابك ⭐');
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء المتابعة');
    }
  });
}

/**
 * Setup Reviews Sentiment Filter (All / Positive 3-5 / Negative 1-2)
 */
function setupReviewsSentimentFilter() {
  const tabs = document.querySelectorAll('.review-filter-tab');
  const reviewCards = document.querySelectorAll('#place-reviews-list .review-card');
  const reviewsList = document.getElementById('place-reviews-list');
  if (!tabs.length || !reviewCards.length) return;

  let emptyMsg = document.getElementById('sentiment-filter-empty-msg');
  if (!emptyMsg && reviewsList) {
    emptyMsg = document.createElement('div');
    emptyMsg.id = 'sentiment-filter-empty-msg';
    emptyMsg.style.display = 'none';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.padding = '2rem 1rem';
    emptyMsg.style.color = 'var(--text-muted)';
    emptyMsg.style.fontSize = '13.5px';
    reviewsList.appendChild(emptyMsg);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.background = '';
        t.style.fontWeight = 'normal';
      });

      tab.classList.add('active');
      tab.style.background = 'var(--primary-alpha)';
      tab.style.fontWeight = '700';

      const sentiment = tab.getAttribute('data-sentiment');
      let visibleCount = 0;

      reviewCards.forEach(card => {
        const stars = parseInt(card.getAttribute('data-stars'), 10) || 5;
        if (sentiment === 'all') {
          card.style.display = 'block';
          visibleCount++;
        } else if (sentiment === 'positive') {
          if (stars >= 3) {
            card.style.display = 'block';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        } else if (sentiment === 'negative') {
          if (stars <= 2) {
            card.style.display = 'block';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        }
      });

      if (emptyMsg) {
        if (visibleCount === 0) {
          emptyMsg.style.display = 'block';
          emptyMsg.innerHTML = sentiment === 'negative'
            ? '<span>✨ لا توجد أي تقييمات سلبية مسجلة لهذا المكان حتى الآن.</span>'
            : '<span>لا توجد تقييمات مطابقة لهذا الفلتر.</span>';
        } else {
          emptyMsg.style.display = 'none';
        }
      }
    });
  });
}

if (typeof window !== 'undefined') {
  window.reportReviewAction = (placeId, reviewId, placeName) => {
    const modal = showModal({
      title: '🚩 الإبلاغ عن تعليق مسيء',
      size: 'sm',
      content: `
        <form id="form-report-review" style="display:flex;flex-direction:column;gap:12px" onsubmit="return false">
          <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5">
            إذا كان هذا التعليق يحتوي على ألفاظ مسيئة، تشهير، معلومات مضللة، أو إعلانات غير مرغوبة، يرجى إبلاغنا لمراجعته فوراً.
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700">سبب الإبلاغ <span class="required">*</span></label>
            <select id="report-reason-select" class="form-select">
              <option value="ألفاظ مسيئة أو سب وقذف">ألفاظ مسيئة أو سب وقذف</option>
              <option value="تقييم وهمي أو مضلل">تقييم وهمي أو مضلل</option>
              <option value="إعلان تجاري غير مرغوب به">إعلان تجاري غير مرغوب به</option>
              <option value="مخالفة لسياسة الاستخدام">مخالفة لسياسة الاستخدام</option>
            </select>
          </div>
        </form>
      `,
      buttons: [
        {
          label: '🚩 إرسال البلاغ',
          type: 'danger',
          closeOnClick: false,
          onClick: async () => {
            const reason = document.getElementById('report-reason-select')?.value || 'محتوى غير لائق';
            const curUser = getCurrentUser();
            const reporterName = curUser ? (curUser.name || curUser.displayName || 'مستخدم مسجل') : 'زائر الموقع';
            try {
              await reportPlaceReview({
                placeId,
                reviewId,
                reason,
                reporterName,
                reporterId: curUser?.uid || null
              });
              toast.success('تم استلام إبلاغك بنجاح وسيقوم فريق الإدارة بمراجعته فوراً. شكرًا لحرصك! 🚩');
              modal.close();
            } catch (err) {
              toast.error(err.message || 'فشل إرسال البلاغ');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  };
}

