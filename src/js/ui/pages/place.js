/**
 * المنزلة وناسها — Place Detail Page
 * Full production place view with cover, logo, verified badge, working hours,
 * contact buttons, Google Maps, offers, products, photo gallery, and verification request.
 */

import { getPlaceBySlug, getCategories, getPlaceOffers, getPlaceProducts, getSettings, trackPlaceView, trackPlaceStat } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { setMeta, setPlaceSchema, setBreadcrumbSchema } from '../../utils/seo.js';
import { renderVerifiedBadge, renderDeliveryBadge } from '../components/VerifiedBadge.js';
import { formatWorkingHours, isPlaceOpen, formatDateRange, daysUntil } from '../../utils/date.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { showModal } from '../components/Modal.js';
import { submitVerificationRequest } from '../../services/places.service.js';
import { toast } from '../components/Toast.js';

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

    // Parallel load
    const [categories, offers, products, settings] = await Promise.all([
      getCategories(),
      getPlaceOffers(place.id || place._key),
      getPlaceProducts(place.id || place._key),
      getSettings()
    ]);

    const category = categories?.find(c => c._key === place.categoryId || c.slug === place.categoryId);
    const currentUser = getCurrentUser() || user;
    const isOwner = currentUser && currentUser.uid === place.ownerId;
    const placeId = place.id || place._key;

    // Track View Count
    trackPlaceView(placeId);

    // Update SEO
    setMeta({
      title: `${place.name} — ${category?.name || 'دليل المنزلة'}`,
      description: place.description || `تعرف على ${place.name} في المنزلة — مواعيد العمل، أرقام التواصل، العنوان، والخدمات`,
      image: place.coverImageUrl || place.logoUrl,
      url: `https://elmanzala.com/place.html?slug=${place.slug}`
    });

    setPlaceSchema(place, category);
    setBreadcrumbSchema([
      { name: 'الرئيسية', url: 'https://elmanzala.com/' },
      { name: 'الأماكن', url: 'https://elmanzala.com/places.html' },
      { name: category?.name || 'القسم', url: `https://elmanzala.com/category.html?slug=${category?.slug || place.categoryId}` },
      { name: place.name, url: `https://elmanzala.com/place.html?slug=${place.slug}` }
    ]);

    // Working hours status
    const isOpen = isPlaceOpen(place.workingHours);
    const workingHoursList = formatWorkingHours(place.workingHours);

    // Render Full Page
    $container.innerHTML = `
      <!-- Place Hero Cover -->
      <section class="place-hero">
        ${place.coverImageUrl
          ? `<img src="${escAttr(place.coverImageUrl)}" alt="${escAttr(place.name)}" class="place-hero__cover" />`
          : `<div class="place-hero__cover-placeholder">${category?.icon || '🏪'}</div>`
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
                  : `<div class="place-logo__placeholder">${category?.icon || '🏪'}</div>`
                }
              </div>
              <div class="place-header-card__info">
                <div class="place-title">
                  <h1 class="place-title__name">${escHtml(place.name)}</h1>
                  ${place.isVerified ? renderVerifiedBadge() : ''}
                  ${place.deliveryType ? renderDeliveryBadge(place.deliveryType) : ''}
                </div>
                
                <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
                  <a href="category.html?slug=${category?.slug || place.categoryId}" class="place-category-tag">
                    ${category?.icon || '📁'} ${escHtml(category?.name || 'عام')}
                  </a>
                  ${place.nameEn ? `<span style="color:var(--text-muted);font-size:var(--font-size-sm);direction:ltr">(${escHtml(place.nameEn)})</span>` : ''}
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
                <a href="tel:${cleanPhone(place.phone)}" class="btn btn-primary" onclick="trackStat('${escAttr(placeId)}', 'phoneClicks')">
                  📞 اتصال (${escHtml(place.phone)})
                </a>
              ` : ''}
              
              ${place.whatsapp ? `
                <a href="https://wa.me/${formatWhatsApp(place.whatsapp)}?text=${encodeURIComponent(`مرحباً، وجدتك على دليل المنزلة وناسها وأود الاستفسار عن خدماتك`)}" 
                   target="_blank" 
                   rel="noopener" 
                   class="btn btn-whatsapp" 
                   onclick="trackStat('${escAttr(placeId)}', 'whatsappClicks')">
                  💬 محادثة واتساب
                </a>
              ` : ''}
              
              ${place.mapsLink || place.location ? `
                <a href="${escAttr(place.mapsLink || `https://www.google.com/maps/search/?api=1&query=${place.location?.lat},${place.location?.lng}`)}" 
                   target="_blank" 
                   rel="noopener" 
                   class="btn btn-outline" 
                   onclick="trackStat('${escAttr(placeId)}', 'directionsClicks')">
                  🗺️ الاتجاهات على الخريطة
                </a>
              ` : ''}

              ${isOwner ? `
                <a href="dashboard.html?section=places&id=${escAttr(placeId)}" class="btn btn-secondary">
                  ⚙️ إدارة وتعديل المكان
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
                  هذا المكان غير موثق حالياً
                </div>
                <div class="unverified-notice__text">
                  العلامة الموثقة تضمن صحة البيانات وتمنح المكان مميزات إضافة المنتجات و3 عروض يومية
                </div>
              </div>
              ${isOwner ? `
                <button class="btn btn-secondary btn-sm" id="btn-request-verification">
                  طلب توثيق المكان ⭐
                </button>
              ` : `
                <button class="btn btn-outline btn-sm" id="btn-claim-place">
                  أنت صاحب المكان؟
                </button>
              `}
            </div>
          ` : ''}

          <!-- Description -->
          ${place.description ? `
            <section class="info-card">
              <h2 class="info-card__title">
                <span>📝</span> عن المكان
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
            <section class="info-card">
              <h2 class="info-card__title">
                <span>🏷️</span> العروض الحالية (${offers.length})
              </h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--space-4)">
                ${offers.map(offer => {
                  const discount = offer.discountPercent || calcDiscount(offer.oldPrice, offer.newPrice);
                  const days = daysUntil(offer.endDate);
                  return `
                    <div class="offer-card">
                      <div class="offer-card__image">
                        ${offer.imageUrl ? `<img src="${escAttr(offer.imageUrl)}" alt="${escAttr(offer.title)}" loading="lazy" />` : `<div style="padding:2rem;text-align:center;font-size:2rem">🏷️</div>`}
                        ${discount > 0 ? `<span class="offer-card__discount-badge">-${discount}%</span>` : ''}
                      </div>
                      <div class="offer-card__body">
                        <h3 class="offer-card__title">${escHtml(offer.title)}</h3>
                        ${offer.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-2)">${escHtml(offer.description)}</p>` : ''}
                        <div class="offer-card__price">
                          <span class="offer-card__price-new">${formatPrice(offer.newPrice)}</span>
                          ${offer.oldPrice ? `<span class="offer-card__price-old">${formatPrice(offer.oldPrice)}</span>` : ''}
                        </div>
                        <div class="offer-card__expiry">⏰ ينتهي: ${formatDateRange(offer.startDate, offer.endDate)}</div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Products Section (Only for verified places) -->
          ${place.isVerified && products && products.length > 0 ? `
            <section class="info-card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
                <h2 class="info-card__title" style="margin-bottom:0">
                  <span>🛍️</span> قائمة المنتجات والأسعار (${products.length})
                </h2>
                <span class="chip chip--success">موثق ✓</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--space-4)">
                ${products.map(p => `
                  <div class="product-card">
                    <div class="product-card__image">
                      ${p.imageUrl ? `<img src="${escAttr(p.imageUrl)}" alt="${escAttr(p.name)}" loading="lazy" />` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:var(--text-muted)">📦</div>`}
                      ${p.isFeatured ? `<span class="product-card__featured">مميز ⭐</span>` : ''}
                    </div>
                    <div class="product-card__body">
                      <h3 class="product-card__name">${escHtml(p.name)}</h3>
                      ${p.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-2)">${escHtml(p.description)}</p>` : ''}
                      <div class="product-card__price">
                        <span class="product-card__price-current">${formatPrice(p.price)}</span>
                        ${p.oldPrice ? `<span class="product-card__price-old">${formatPrice(p.oldPrice)}</span>` : ''}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

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

          <!-- Social Media Links -->
          ${hasSocial(place.social) ? `
            <div class="info-card">
              <h3 class="info-card__title" style="font-size:var(--font-size-base)">
                <span>🌐</span> وسائل التواصل
              </h3>
              <div class="social-links">
                ${place.social.facebook ? `<a href="${escAttr(place.social.facebook)}" target="_blank" rel="noopener" class="social-link">📘 فيسبوك</a>` : ''}
                ${place.social.instagram ? `<a href="${escAttr(place.social.instagram)}" target="_blank" rel="noopener" class="social-link">📷 إنستجرام</a>` : ''}
                ${place.social.tiktok ? `<a href="${escAttr(place.social.tiktok)}" target="_blank" rel="noopener" class="social-link">🎵 تيك توك</a>` : ''}
                ${place.social.youtube ? `<a href="${escAttr(place.social.youtube)}" target="_blank" rel="noopener" class="social-link">▶️ يوتيوب</a>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Google Maps Card -->
          <div class="info-card">
            <h3 class="info-card__title" style="font-size:var(--font-size-base)">
              <span>🗺️</span> الموقع على الخريطة
            </h3>
            <div class="place-map">
              ${place.location?.lat ? `
                <iframe 
                  src="https://maps.google.com/maps?q=${place.location.lat},${place.location.lng}&hl=ar&z=15&output=embed" 
                  style="border:0;width:100%;height:100%" 
                  loading="lazy" 
                  title="موقع ${escAttr(place.name)}">
                </iframe>
              ` : `
                <a href="${escAttr(place.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' المنزلة')}`)}" 
                   target="_blank" 
                   rel="noopener" 
                   class="map-placeholder">
                  <span style="font-size:2rem">📍</span>
                  <span>فتح في تطبيق Google Maps</span>
                </a>
              `}
            </div>
          </div>

        </div>
      </div>
    `;

    // ── Setup Interactivity ──

    // Working hours toggle
    document.getElementById('toggle-working-hours')?.addEventListener('click', () => {
      document.getElementById('working-hours-list')?.classList.toggle('expanded');
    });

    // Verification Request Button
    const waUrl = settings?.contact?.whatsappLink || 'https://wa.me/wasendernew';

    document.getElementById('btn-request-verification')?.addEventListener('click', () => {
      showVerificationModal(place, user, waUrl);
    });

    document.getElementById('btn-claim-place')?.addEventListener('click', () => {
      showClaimModal(place, waUrl);
    });

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

function showVerificationModal(place, user, waUrl) {
  showModal({
    title: 'طلب توثيق المكان',
    size: 'sm',
    content: `
      <div class="verification-modal__steps">
        <div class="verification-step">
          <div class="verification-step__num">1</div>
          <div>
            <div class="verification-step__title">مراجعة إدارة المنصة</div>
            <div class="verification-step__text">يتم تدقيق بيانات النشاط التجاري لضمان دقة الدليل لأهل المنزلة</div>
          </div>
        </div>
        <div class="verification-step">
          <div class="verification-step__num">2</div>
          <div>
            <div class="verification-step__title">مميزات التوثيق الفوري</div>
            <div class="verification-step__text">علامة التوثيق الذهبية ✓ + إضافة حتى 350 منتجاً + 3 عروض يومية + أولوية الظهور في نتائج البحث</div>
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
          const text = encodeURIComponent(`السلام عليكم، أود طلب توثيق مكاني على منصة المنزلة وناسها:\nاسم المكان: ${place.name}\nرابط المكان: https://elmanzala.com/place.html?slug=${place.slug}`);
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
window.openLightbox = (imgUrl) => {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <img src="${escAttr(imgUrl)}" class="lightbox__img" alt="صورة مكبرة" />
  `;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
};

function hasSocial(social) {
  return social && (social.facebook || social.instagram || social.tiktok || social.youtube);
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
