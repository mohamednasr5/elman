/**
 * المنزلة وناسها — Place Detail Page
 * Full production place view with cover, logo, verified badge, working hours,
 * contact buttons, Google Maps, offers, products, photo gallery, and verification request.
 */

import { getPlaceBySlug, getCategories, getPlaceOffers, getPlaceProducts, getSettings, trackPlaceView, trackPlaceStat } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { setMeta, setPlaceSchema, setBreadcrumbSchema } from '../../utils/seo.js';
import { renderVerifiedBadge, renderDeliveryBadge, renderSponsoredBadge } from '../components/VerifiedBadge.js';
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
    const catInfo = resolvePlaceCategoryInfo(place, category);
    const currentUser = getCurrentUser() || user;
    const isOwner = currentUser && currentUser.uid === place.ownerId;
    const placeId = place.id || place._key;

    // Track View Count & Profile Visitor
    trackPlaceView(place, currentUser);

    // Update SEO
    setMeta({
      title: `${place.name} — ${catInfo.name || 'دليل المنزلة'}`,
      description: place.description || `تعرف على ${place.name} في المنزلة — مواعيد العمل، أرقام التواصل، العنوان، والخدمات`,
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
                <div class="place-title">
                  <h1 class="place-title__name">${escHtml(place.name)}</h1>
                  ${((place.isSponsored || place.isFeatured || place.isPromoted) && (!place.sponsoredUntil || place.sponsoredUntil > Date.now())) ? renderSponsoredBadge() : ''}
                  ${place.isVerified ? renderVerifiedBadge() : ''}
                  ${place.deliveryType ? renderDeliveryBadge(place.deliveryType) : ''}
                </div>
                
                <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
                  <a href="category.html?slug=${catInfo.slug}" class="place-category-tag">
                    ${catInfo.icon} ${escHtml(catInfo.name)}
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
                  هذا الشخص أو المكان غير موثق حالياً
                </div>
                <div class="unverified-notice__text">
                  العلامة الموثقة تضمن صحة البيانات وتمنحك مميزات إضافية وتظهر قبل الجميع فى دليل المنزلة
                </div>
              </div>
              ${isOwner ? `
                <button class="btn btn-secondary btn-sm" id="btn-request-verification">
                  طلب التوثيق ⭐
                </button>
              ` : `
                <button class="btn btn-outline btn-sm" id="btn-claim-place">
                  أنت صاحب النشاط؟
                </button>
              `}
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
          <div class="info-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
              <h3 class="info-card__title" style="margin:0;font-size:var(--font-size-base)">
                <span>🗺️</span> الموقع على الخريطة
              </h3>
              ${mapInfo.directLink ? `
                <a href="${escAttr(mapInfo.directLink)}" target="_blank" rel="noopener" class="btn btn--outline btn--sm" style="font-size:11px;padding:3px 10px;border-radius:var(--radius-full);gap:4px">
                  <span>📍</span> فتح في الخرائط
                </a>
              ` : ''}
            </div>

            ${place.address ? `
              <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-secondary);margin-bottom:10px;background:var(--surface-2);padding:6px 10px;border-radius:var(--radius-sm)">
                <span style="color:var(--primary);flex-shrink:0">📌</span>
                <span class="truncate">${escHtml(place.address)}</span>
              </div>
            ` : ''}

            <div class="place-map" style="position:relative;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border);height:230px">
              <iframe 
                src="${escAttr(mapInfo.embedUrl)}" 
                style="border:0;width:100%;height:100%;display:block" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade"
                title="موقع ${escAttr(place.name)}">
              </iframe>
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
            <div class="verification-step__text">علامة التوثيق المعتمدة ✓ + إضافة المنتجات والعروض + أولوية الظهور في نتائج البحث والتصدر في دليل المنزلة</div>
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
 * Smart Resolver for Google Maps Embed and Directions URL
 * Supports:
 * - Direct Lat/Lng Coordinates (place.location)
 * - Google Maps short links (e.g. https://maps.app.goo.gl/ruGRycBTGHt8Ecr2A)
 * - Plus Codes (e.g. 5XVJ+GF مركز المنزلة)
 * - Detailed addresses (e.g. الضهير، مركز المنزلة، محافظة الدقهلية 35642)
 * - Fallback to Name + Area
 */
function resolveMapEmbedInfo(place) {
  let embedUrl = '';
  let directLink = place.mapsLink || '';

  // 1. Direct Lat/Lng Coordinates
  if (place.location && place.location.lat && place.location.lng) {
    const lat = Number(place.location.lat);
    const lng = Number(place.location.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=ar&z=16&output=embed`;
      if (!directLink) directLink = `https://www.google.com/maps?q=${lat},${lng}`;
      return { embedUrl, directLink };
    }
  }

  // 2. Coordinates inside mapsLink (@lat,lng or q=lat,lng or ll=lat,lng)
  if (place.mapsLink) {
    const coordMatch = place.mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                       place.mapsLink.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                       place.mapsLink.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=ar&z=16&output=embed`;
      return { embedUrl, directLink };
    }
  }

  // 3. Address or Plus Code or Detailed location text
  const rawAddress = (place.address || '').trim();
  const rawArea = (place.area || '').trim();
  const rawName = (place.name || '').trim();

  let queryTarget = '';
  if (rawAddress) {
    queryTarget = rawAddress.includes('المنزلة') ? rawAddress : `${rawAddress}، المنزلة، الدقهلية`;
  } else if (rawArea) {
    queryTarget = `${rawName} ${rawArea} المنزلة الدقهلية`;
  } else {
    queryTarget = `${rawName} المنزلة الدقهلية`;
  }

  // Google Maps Embed Query
  embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(queryTarget)}&hl=ar&z=16&output=embed`;

  if (!directLink) {
    directLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryTarget)}`;
  }

  return { embedUrl, directLink };
}
