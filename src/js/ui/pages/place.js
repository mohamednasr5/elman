import { buildContextualWhatsAppLink } from '../../services/whatsapp.service.js';
import { isEnglish, t, localizeUrl } from '../../core/i18n.js';
/**
 * المنزلة وناسها — Place Detail Page
 * Full production place view with cover, logo, verified badge, working hours,
 * contact buttons, Google Maps, offers, products, photo gallery, and verification request.
 */

import { getPlace, getPlaceBySlug, getCategories, getCached, getPublishedPlaces, getPlaceOffers, getPlaceProducts, getSettings, trackPlaceView, trackPlaceStat, getPlaceReviews, addPlaceReview, updatePlaceReview, deletePlaceReview, isFollowingPlace, followPlace, unfollowPlace, isPlaceBanned, reportPlaceReview, reportPlaceData, dbUpdate, subscribeToOwnerPresence, HAMMAD_PLACE_SLUG, getPlaceBranches, updatePlaceAvailability } from '../../core/db.js?v=63fea2cf_v6';
import { getCurrentUser, signInWithGoogle, isAdmin } from '../../core/auth.js';
import { setMeta, setPlaceSchema, setBreadcrumbSchema } from '../../utils/seo.js';
import { renderVerifiedBadge, renderDeliveryBadge, renderSponsoredBadge, renderOnlineBadge } from '../components/VerifiedBadge.js';
import { formatWorkingHours, isPlaceOpen, formatDateRange, daysUntil, formatDate } from '../../utils/date.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { submitVerificationRequest } from '../../services/places.service.js?v=63fea2cf_v6';
import { toast } from '../components/Toast.js';
import { openPlaceProfileCardModal } from '../components/PlaceProfileCardModal.js';
import { openStorefrontQrModal } from '../components/StorefrontQrModal.js';
import { getPlaceLiveStatus } from '../../utils/live-hours.js';
import { openOfferFullDetailsModal, openProductFullDetailsModal } from '../components/OfferProductModals.js';
import { resolveMapEmbedInfo, extractCoordinates } from '../../utils/maps.js';
import { resolveDoctorSpecialty } from '../../utils/specialty.js';
import { getDefaultPlaceAssets } from '../../utils/category-assets.js';
import { isAtmPlace, ATM_UNIFIED_COVER, ATM_UNIFIED_LOGO, ATM_POLL_QUESTIONS, formatAtmTimeAgo, submitAtmPollVote } from '../../utils/atm.js';
import { awardPoints, getLoyaltyLevelInfo } from '../../services/loyalty.service.js';
import { getOptimizedImageUrl, IMAGE_SIZES } from '../../services/image-cdn.service.js';
import { resolvePlaceProfession, getCategorySvg, getProfessionSvg } from '../../utils/professions-data.js';
import { generateCleanSlug } from '../../utils/slug.js';
import { formatSocialUrl } from '../../utils/social.js';
import { isValidPhoneNumber } from '../../utils/phone.js';
import { renderTrustCard } from '../components/TrustCard.js';
import { openAppointmentModal } from '../components/AppointmentModal.js';

export function renderAvailabilityBadge(status) {
  if (!status) return '';
  const s = String(status).toLowerCase();
  if (s === 'busy') {
    return `
      <span class="place-availability-badge place-availability-badge--busy" style="display:inline-flex;align-items:center;gap:6px;background:#FEF3C7;color:#92400E;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:700;border:1px solid #FCD34D" title="هذا المكان أو الفني مشغول حالياً">
        <span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;display:inline-block"></span>
        <span>مشغول حالياً</span>
      </span>
    `;
  } else if (s === 'unavailable') {
    return `
      <span class="place-availability-badge place-availability-badge--unavailable" style="display:inline-flex;align-items:center;gap:6px;background:#FEE2E2;color:#991B1B;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:700;border:1px solid #FECACA" title="هذا المكان أو الفني غير متاح الآن">
        <span style="width:8px;height:8px;border-radius:50%;background:#EF4444;display:inline-block"></span>
        <span>غير متاح الآن</span>
      </span>
    `;
  } else if (s === 'available') {
    return `
      <span class="place-availability-badge place-availability-badge--available" style="display:inline-flex;align-items:center;gap:6px;background:#DCFCE7;color:#166534;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:700;border:1px solid #BBF7D0" title="جاهز للرد واستقبال طلباتكم">
        <span style="width:8px;height:8px;border-radius:50%;background:#22C55E;display:inline-block;box-shadow:0 0 0 2px rgba(34,197,94,0.3)"></span>
        <span>🟢 متاح لاستقبال الطلبات</span>
      </span>
    `;
  }
  return '';
}

export function normalizePlace(p) {
  if (!p || typeof p !== 'object') return p;
  const logo = p.logoUrl || p.logo_url || p.logo || null;
  const cover = p.coverImageUrl || p.cover_image_url || p.cover || null;
  return {
    ...p,
    logoUrl: logo,
    logo_url: logo,
    coverImageUrl: cover,
    cover_image_url: cover,
    categoryId: p.categoryId || p.category_id || '',
    category_id: p.categoryId || p.category_id || '',
    customCategory: p.customCategory || p.custom_category || '',
    custom_category: p.customCategory || p.custom_category || '',
    subcategoryId: p.subcategoryId || p.subcategory_id || '',
    subcategory_id: p.subcategoryId || p.subcategory_id || '',
    ownerId: p.ownerId || p.owner_id || '',
    owner_id: p.ownerId || p.owner_id || '',
    ownerEmail: p.ownerEmail || p.owner_email || '',
    owner_email: p.ownerEmail || p.owner_email || '',
    mapsLink: p.mapsLink || p.maps_link || '',
    maps_link: p.mapsLink || p.maps_link || '',
    workingHours: p.workingHours || p.working_hours || {},
    working_hours: p.workingHours || p.working_hours || {},
    isVerified: Boolean(p.isVerified || p.is_verified || p.verified),
    is_verified: Boolean(p.isVerified || p.is_verified || p.verified)
  };
}

export async function renderPlacePage($container, { slug, user, initialPlace = null }) {
  // ── Instant 0ms Place Detection ──
  let place = initialPlace ? normalizePlace(initialPlace) : null;
  const cleanSlug = String(slug || '').toLowerCase().trim();

  if (!place && typeof window !== 'undefined') {
    if (window._placesRegistry) {
      place = window._placesRegistry.get(cleanSlug) || window._placesRegistry.get(String(slug || '').trim());
    }
    if (!place && window.__INSTANT_PLACE__) {
      const ip = window.__INSTANT_PLACE__;
      if (ip && (String(ip.slug || '').toLowerCase() === cleanSlug || String(ip.id || '').toLowerCase() === cleanSlug || !cleanSlug)) {
        place = ip;
      }
    }
    if (!place) {
      try {
        const raw = sessionStorage.getItem('instant_place_' + cleanSlug) || sessionStorage.getItem('instant_place_latest');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (
            String(parsed.slug || '').toLowerCase() === cleanSlug ||
            String(parsed.id || '').toLowerCase() === cleanSlug ||
            !cleanSlug
          )) {
            place = parsed;
          }
        }
      } catch (_) {}
    }
    if (!place) {
      try {
        const raw = localStorage.getItem('instant_place_' + cleanSlug) || localStorage.getItem('instant_place_latest');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (
            String(parsed.slug || '').toLowerCase() === cleanSlug ||
            String(parsed.id || '').toLowerCase() === cleanSlug ||
            !cleanSlug
          )) {
            place = parsed;
          }
        }
      } catch (_) {}
    }
    if (!place) {
      try {
        const rawPool = localStorage.getItem('manzala_verified_showcase_v1');
        if (rawPool) {
          const pool = JSON.parse(rawPool);
          if (Array.isArray(pool)) {
            place = pool.find(item => item && (String(item.slug || '').toLowerCase() === cleanSlug || String(item.id || '').toLowerCase() === cleanSlug));
          }
        }
      } catch (_) {}
    }
  }

  if (place) {
    place = normalizePlace(place);
  }

  // If no cached place in memory or session, display smooth skeleton while fetching (unless already pre-rendered by SSR)
  if (!place && !$container.querySelector('.place-header-card:not(.skeleton)')) {
    $container.innerHTML = `
      <div class="place-hero skeleton"></div>
      <div class="container" style="max-width:var(--container-xl);margin:0 auto;padding:1rem">
        <div class="skeleton" style="height:120px;border-radius:16px;margin-top:-50px;margin-bottom:2rem"></div>
        <div class="skeleton" style="height:200px;border-radius:16px"></div>
      </div>
    `;
  }

  try {
    if (!place) {
      if (typeof window !== 'undefined' && window.__PLACE_PREFETCH_PROMISE__) {
        try {
          const preRes = await window.__PLACE_PREFETCH_PROMISE__;
          if (preRes && (preRes.data || preRes.name)) {
            place = normalizePlace(preRes.data || preRes);
          }
        } catch (_) {}
      }
      if (!place) {
        place = normalizePlace(await getPlaceBySlug(slug));
      }
    }

    if (!place) {
      window.location.replace('/404.html?type=place&reason=deleted');
      return;
    }

    // Silent background revalidation when served from instant cache
    if (initialPlace || window.__INSTANT_PLACE__ || place) {
      const revalPromise = (typeof window !== 'undefined' && window.__PLACE_PREFETCH_PROMISE__) ? window.__PLACE_PREFETCH_PROMISE__ : getPlaceBySlug(slug);
      Promise.resolve(revalPromise).then(res => {
        const freshPlace = normalizePlace((res && res.data) ? res.data : res);
        if (freshPlace && freshPlace.name) {
          try {
            const ser = JSON.stringify(freshPlace);
            sessionStorage.setItem('instant_place_' + cleanSlug, ser);
            sessionStorage.setItem('instant_place_latest', ser);
            localStorage.setItem('instant_place_' + cleanSlug, ser);
            localStorage.setItem('instant_place_latest', ser);
          } catch (_) {}
        }
      }).catch(() => {});
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
    const isHammad = (place.slug === HAMMAD_PLACE_SLUG || place.name?.includes('محمد حماد'));

    // Fast categories retrieval (cached in IDB / memory - non-blocking for instant render)
    let categories = getCached('categories_all') || [];
    let category = categories.find(c => c._key === place.categoryId || c.slug === place.categoryId);
    let catInfo = resolvePlaceCategoryInfo(place, category);
    const isAtm = isAtmPlace(place, category);

    // Asynchronously resolve & update category metadata if not present in instant cache
    if (!categories.length) {
      getCategories().then(cats => {
        if (!cats?.length) return;
        const freshCat = cats.find(c => c._key === place.categoryId || c.slug === place.categoryId);
        if (freshCat) {
          const freshCatInfo = resolvePlaceCategoryInfo(place, freshCat);
          const badgeEl = $container.querySelector('.place-badge--category');
          if (badgeEl && freshCatInfo.name) {
            badgeEl.innerHTML = `${freshCatInfo.icon ? `<span style="margin-left:4px">${freshCatInfo.icon}</span>` : ''}${freshCatInfo.name}`;
          }
        }
      }).catch(() => {});
    }
    const isFollowing = false; // Resolved asynchronously

    // ── Initial Reviews / Ratings Summary (0ms) ──
    let safeReviews = Array.isArray(place.reviews) ? place.reviews : [];
    if (!safeReviews.length) {
      const fastCached = getCached(`reviews_${placeId}`) || (isHammad ? (getCached('reviews_p_1788742873778_6k8a9v') || getCached('reviews_almhnds-mhmd-hmad')) : null);
      if (Array.isArray(fastCached) && fastCached.length > 0) {
        safeReviews = fastCached;
      }
    }
    let totalReviews = safeReviews.length || Number(place.reviewCount) || Number(place.review_count) || Number(place.reviewsCount) || Number(place.ratingCount) || Number(place.stats?.reviewCount) || Number(place.stats?.reviewsCount) || 0;
    if (totalReviews === 0 && (place.slug === 'almhnds-mhmd-hmad' || place.slug === 'mhnds-mhmd-hmad-5lQJ1o' || place.id === 'p_1788742873778_6k8a9v' || isHammad)) {
      totalReviews = 500;
    }
    let avgRating = totalReviews > 0 ? (Number(place.rating) || Number(place.stats?.rating) || 5.0) : 0.0;
    if (safeReviews.length > 0) {
      let rSum = 0;
      safeReviews.forEach(r => { rSum += (Number(r.rating) || 5); });
      avgRating = Math.round((rSum / safeReviews.length) * 10) / 10;
    }

    // Early fetch reviews in parallel with page rendering
    const reviewsFetchPromise = !isAtm ? getPlaceReviews(placeId, place.slug) : Promise.resolve([]);

    const hasValidPhone = !isAtm && isValidPhoneNumber(place.phone);
    const hasValidWhatsapp = isValidPhoneNumber(place.whatsapp);

    const calculatedCompleteness = Math.min(100,
      (place.isVerified ? 30 : 0) + ((hasValidPhone || hasValidWhatsapp) ? 20 : 0) +
      ((place.lat || place.latitude) && (place.lng || place.longitude) ? 15 : 0) + (place.address ? 10 : 0) +
      ((place.coverImageUrl || place.logoUrl || place.cover_image_url || place.logo_url) ? 10 : 0) +
      ((place.workingHours || place.openHours) ? 5 : 0) + (place.description ? 5 : 0) + (totalReviews > 0 ? 5 : 0)
    );
    const hasManualTrustScore = place.trustScore !== undefined || place.trust_score !== undefined;
    const trustScore = hasManualTrustScore ? Math.max(0, Math.min(100, Number(place.trustScore ?? place.trust_score) || 0)) : calculatedCompleteness;
    const trustClass = trustScore < 50 ? 'place-trust-mini--low' : trustScore < 75 ? 'place-trust-mini--medium' : 'place-trust-mini--high';
    let userReview = currentUser ? safeReviews.find(review => review.userId === currentUser.uid) : null;

    // Track View Count & Profile Visitor safely
    const isEn = isEnglish();
    const placeDisplayName = (isEn && (place.nameEn || place.name_en)) ? (place.nameEn || place.name_en) : (place.name || '');
    const placeDisplayDesc = (isEn && (place.descriptionEn || place.description_en)) ? (place.descriptionEn || place.description_en) : (place.description || '');
    const placeDisplayAddress = (isEn && (place.addressEn || place.address_en)) ? (place.addressEn || place.address_en) : (place.address || '');
    const placeDisplayArea = (isEn && (place.areaEn || place.area_en)) ? (place.areaEn || place.area_en) : (isEn ? 'El Manzala' : (place.area || 'المنزلة والمطرية'));
    const displayServices = (isEn && ((place.servicesEn && place.servicesEn.length) || (place.services_en && place.services_en.length)))
      ? (place.servicesEn || place.services_en)
      : (place.services || []);

    try { trackPlaceView(place, currentUser); } catch (_) {}

    // Update SEO safely for top Google Indexing
    try {
      const placeSpecialty = (isEn && (place.customCategoryEn || place.custom_category_en)) ? (place.customCategoryEn || place.custom_category_en) : (place.specialty || catInfo.name || 'دليل الأنشطة');
      const placeArea = placeDisplayArea;
      const phoneText = place.phone ? (isEn ? `, Phone: ${place.phone}` : `، الهاتف: ${place.phone}`) : '';
      const addressText = placeDisplayAddress ? (isEn ? `, Address: ${placeDisplayAddress}` : `، العنوان: ${placeDisplayAddress}`) : '';
      
      const seoTitle = isEn ? `${placeDisplayName} | Dalil El Manzala & El Matariya Directory` : `${place.name} | دليل المنزلة والمطرية الرقمي`;
      const seoDesc = isEn
        ? `${placeDisplayName} in ${placeArea}. ${placeSpecialty}${addressText}${phoneText}. Working hours, customer reviews, and direct contact via Dalil El Manzala.`
        : `${place.name} في ${placeArea}. ${placeSpecialty}${addressText}${phoneText}. مواعيد العمل، تقييمات العملاء، وأرقام التواصل عبر دليل المنزلة والمطرية الرقمي.`;
      const rawPlaceSlug = place.slug || place.id;
      const cleanTranslit = generateCleanSlug(place.name);
      const isIdLike = (s) => !s || s.startsWith('p_') || s.startsWith('-P0') || (s.length > 20 && /^[a-zA-Z0-9_-]+$/.test(s));

      let canonicalSlug = '';
      if (place.slug && !isIdLike(place.slug)) {
        canonicalSlug = String(place.slug).replace(/-[a-z0-9_]{5,7}$/i, '') || place.slug;
      } else if (cleanSlug && !isIdLike(cleanSlug)) {
        canonicalSlug = cleanSlug;
      } else {
        canonicalSlug = cleanTranslit || place.id;
      }

      const placeCanonical = isEn
        ? `https://dalilmanzala.com/en/place/${encodeURIComponent(canonicalSlug)}`
        : `https://dalilmanzala.com/place/${encodeURIComponent(canonicalSlug)}`;

      // Seamless URL normalization in browser address bar (SEO & user experience)
      try {
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          if (canonicalSlug && !isIdLike(canonicalSlug) && (window.location.pathname.includes('place.html') || window.location.pathname.startsWith('/p/'))) {
            window.history.replaceState(null, '', isEn ? `/en/place/${encodeURIComponent(canonicalSlug)}` : `/place/${encodeURIComponent(canonicalSlug)}`);
          }
        }
      } catch (_) {}

      setMeta({
        title: seoTitle,
        description: seoDesc,
        keywords: `${placeDisplayName}, ${placeSpecialty}, ${placeArea}, دليل المنزلة, دليل المطرية, رقم ${place.name}, عنوان ${place.name}, ${place.tags ? (Array.isArray(place.tags) ? place.tags.join(', ') : place.tags) : ''}`,
        image: place.coverImageUrl || place.cover_image_url || place.logoUrl || place.logo_url,
        url: placeCanonical
      });

      setPlaceSchema(place, category);
      setBreadcrumbSchema([
        { name: 'الرئيسية', url: 'https://dalilmanzala.com/' },
        { name: 'الأماكن', url: 'https://dalilmanzala.com/places.html' },
        { name: catInfo.name || 'القسم', url: `https://dalilmanzala.com/category/${encodeURIComponent(catInfo.slug || '')}` },
        { name: place.name, url: placeCanonical }
      ]);
    } catch (_) {}

    // Working hours status (with intelligent parent inheritance for branches)
    const isBranchPlace = Boolean(place.parentId || place.parent_id);
    const hasOwnHours = place.workingHours && typeof place.workingHours === 'object' && Object.keys(place.workingHours).length > 0;
    if (isBranchPlace && (!hasOwnHours || place.same_as_main_hours || place.sameAsMainHours)) {
      try {
        const parentPlace = await getPlace(place.parentId || place.parent_id);
        if (parentPlace && (parentPlace.workingHours || parentPlace.working_hours)) {
          place.workingHours = parentPlace.workingHours || parentPlace.working_hours;
          if (parentPlace.alwaysOpen) place.alwaysOpen = true;
          if (parentPlace.alwaysOpenExcept) place.alwaysOpenExcept = true;
        }
      } catch (_) {}
    }

    const isOpen = isPlaceOpen(place.workingHours);
    const workingHoursList = formatWorkingHours(place.workingHours);

    const defaultAssets = getDefaultPlaceAssets(place, category);
    const rawCover = place.coverImageUrl || place.cover_image_url || (isAtm ? ATM_UNIFIED_COVER : defaultAssets.coverImageUrl);
    const rawLogo = place.logoUrl || place.logo_url || (isAtm ? ATM_UNIFIED_LOGO : defaultAssets.logoUrl);
    const placeCover = getOptimizedImageUrl(rawCover, IMAGE_SIZES.MEDIUM);
    const placeLogo = getOptimizedImageUrl(rawLogo, IMAGE_SIZES.MEDIUM);

    // Resolve Smart Google Map info (supports coords, short links, Plus codes, and addresses)
    const mapInfo = resolveMapEmbedInfo(place);
    const docInfo = resolveDoctorSpecialty(place, category);
    const profInfo = resolvePlaceProfession(place);
    const craftCatSvg = getCategorySvg(catInfo?.slug || place.categoryId || '', 18);

    // Render Full Page
    window._currentActivePlace = place;
    $container.innerHTML = `
      <!-- Top Navigation & Return Bar -->
      <div class="container" style="padding-top:var(--space-3);padding-bottom:var(--space-1)">
        <div class="page-back-bar">
          <button type="button" class="btn-page-back" id="btn-place-back" title="${isEn ? 'Go back' : 'الرجوع للصفحة السابقة'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 19 12 12 5"></polyline>
            </svg>
            <span>${isEn ? 'Back' : 'رجوع'}</span>
          </button>
          <nav class="page-breadcrumbs" aria-label="مسار التنقل">
            <a href="${localizeUrl('index.html', isEn ? 'en' : 'ar')}">${isEn ? 'Home' : 'الرئيسية'}</a>
            <span class="breadcrumb-sep">/</span>
            <a href="${localizeUrl('categories.html', isEn ? 'en' : 'ar')}">${isEn ? 'Categories' : 'التصنيفات'}</a>
            <span class="breadcrumb-sep">/</span>
            <a href="category.html?slug=${encodeURIComponent(catInfo?.slug || place.categoryId || 'other')}">${escHtml(catInfo?.name || (isEn ? 'Category' : 'التصنيف'))}</a>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">${escHtml(placeDisplayName)}</span>
          </nav>
        </div>
      </div>

      <!-- Place Hero Cover -->
      <section class="place-hero">
        ${placeCover
          ? `<img src="${escAttr(placeCover)}" alt="${escAttr(place.name)}" class="place-hero__cover" fetchpriority="high" decoding="async" />`
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
                ${placeLogo
                  ? `<img src="${escAttr(placeLogo)}" alt="${escAttr(place.name)} logo" decoding="async" />`
                  : `<div class="place-logo__placeholder">${catInfo.icon || '🏪'}</div>`
                }
              </div>
              <div class="place-header-card__info">
                <div class="place-title">
                  <div class="place-title__main">
                    <h1 class="place-title__name">${escHtml(placeDisplayName)}</h1>
                    ${(!isAtm && (place.isSponsored || place.isFeatured || place.isPromoted) && (!place.sponsoredUntil || place.sponsoredUntil > Date.now())) ? renderSponsoredBadge() : ''}
                    ${place.isVerified ? renderVerifiedBadge() : ''}
                    ${(!isAtm && (place.deliveryType || place.categoryId === 'delivery' || place.categoryId?.includes('delivery') || /توكتوك|تاكسي|شانجي|اتوبيس|وصلي/i.test(place.name || '')) && !/صيدلية|مطعم|كشري|حلواني|سوبر\s*ماركت/i.test(place.name || '')) ? renderDeliveryBadge(place) : ''}
                    <span id="place-owner-online-container" class="place-owner-online-slot"></span>
                  </div>

                  <div class="place-title-actions-row">
                    <button type="button" class="btn-download-profile-card btn-download-profile-trigger" id="btn-download-profile-card" data-pid="${escAttr(placeId)}" title="تحميل البطاقة التعريفية لمشاركتها كصورة">
                      <span class="card-icon">🪪</span>
                      <span>تحميل البطاقة</span>
                    </button>

                    <button type="button" class="btn btn-sm btn-outline btn-open-storefront-qr" id="btn-open-storefront-qr" style="border-radius:var(--radius-full);gap:5px;font-size:12px;padding:5px 12px;background:var(--surface);border-color:var(--border)" title="طباعة لوحة QR ذكية لواجهة المحل">
                      <span>🖨️</span>
                      <span>لوحة QR للمحل</span>
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
                
                <div class="place-header-badges-row" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0">
                  <a href="category.html?slug=${encodeURIComponent(catInfo?.slug || place.categoryId || 'other')}" class="place-category-tag">
                    ${craftCatSvg || catInfo?.icon || '🏪'} ${escHtml(catInfo?.name || 'تصنيف')}
                  </a>
                  ${profInfo ? `
                    <a href="category.html?slug=${encodeURIComponent(profInfo.categorySlug || catInfo?.slug || 'crafts')}&prof=${encodeURIComponent(profInfo.id || '')}" class="place-profession-badge" style="text-decoration:none;padding:4px 12px;font-size:12.5px;display:inline-flex;align-items:center;gap:6px" title="تصفح جميع فنيي ${escHtml(profInfo.name || '')}">
                      ${getProfessionSvg(profInfo.id, { size: 16, color: profInfo.categoryColor || 'currentColor' })}
                      <span>${escHtml(profInfo.name || '')}</span>
                    </a>
                  ` : ''}
                  ${place.nameEn ? `<span class="place-header-en-name" style="color:var(--text-muted);font-size:var(--font-size-sm);direction:ltr">(${escHtml(place.nameEn)})</span>` : ''}
                  ${place.medicalSpecialty ? `
                    <span class="badge" style="background:#E0F2FE;color:#0369A1;font-weight:700;font-size:12.5px;padding:3px 10px;border-radius:9999px;border:1px solid #BAE6FD">
                      🩺 تخصص: ${escHtml(place.medicalSpecialty)}
                    </span>
                  ` : ''}

                  ${!isAtm ? `
                    <div id="place-header-rating-badge" style="display:inline-flex;align-items:center;gap:4px;color:${totalReviews > 0 ? '#F59E0B' : 'var(--text-muted)'};font-weight:700;font-size:12px;background:${totalReviews > 0 ? 'rgba(245,158,11,0.08)' : 'var(--surface-2)'};padding:3px 8px;border-radius:var(--radius-sm);border:1px solid var(--border)">
                      ${totalReviews > 0 ? `
                        <span>★</span>
                        <span>${avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
                        <span style="color:var(--text-muted);font-weight:normal;font-size:11px">(${totalReviews} تقييم)</span>
                      ` : `
                        <span>✨</span>
                        <span>لا توجد تقييمات بعد</span>
                      `}
                    </div>
                  ` : ''}
                  <div id="place-availability-badge-container">
                    ${renderAvailabilityBadge(place.availabilityStatus || place.availability_status)}
                  </div>
                  <span class="place-trust-mini ${trustClass}" title="مؤشر نسبة استيفاء حقول ومعلومات هذا الملف (وليس تقييماً لجودة النشاط)">📋 اكتمال الملف ${trustScore}%</span>
                </div>
                <div class="place-address">
                  <span>📍</span>
                  <span>${escHtml(place.address || place.area || 'مدينة المنزلة')}</span>
                </div>
              </div>
            </div>

            <!-- Quick Action Buttons -->
            <div class="place-contact-btns">
              ${(!hasValidPhone && !hasValidWhatsapp && !isAtm) ? `
                <div class="place-no-phone-notice" style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface-2);border:1px dashed var(--border);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:8px;width:100%;flex-wrap:wrap">
                  <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary)">
                    <span style="font-size:16px">ℹ️</span>
                    <span><strong>رقم التواصل غير متاح حالياً</strong> لهذا النشاط.</span>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline" onclick="window.openSuggestPhoneNumber({ placeId: '${escAttr(placeId)}', placeName: '${escAttr(place.name || '')}' })" style="gap:5px;font-size:12px;font-weight:700;color:var(--primary)">
                    <span>💡</span>
                    <span>اقترح رقمًا صحيحًا</span>
                  </button>
                </div>
              ` : ''}

              ${hasValidPhone ? `
                <a href="tel:${cleanPhone(place.phone)}" class="btn btn-primary" onclick="trackStat('${escAttr(placeId)}', 'phoneClicks')" title="اتصال هاتفي">
                  <span>📞</span>
                  <span>اتصال (${escHtml(place.phone)})</span>
                </a>
              ` : ''}
              
              ${hasValidWhatsapp ? `
                <a href="${buildContextualWhatsAppLink(place.whatsapp, { source: 'place_page', placeName: place.name, placeSlug: place.slug })}" 
                   target="_blank" 
                   rel="noopener" 
                   class="btn btn-whatsapp" onclick="trackStat('${escAttr(placeId)}', 'whatsappClicks')" title="محادثة واتساب">
                  <img src="./icons/whatsapp.png" alt="WhatsApp" class="wa-official-icon" />
                  <span>محادثة واتساب</span>
                </a>
              ` : ''}
              
              ${place.mapsLink || place.location ? `
                <a href="${escAttr(mapInfo.directLink || place.mapsLink || `https://www.google.com/maps/search/?api=1&query=${place.location?.lat},${place.location?.lng}`)}" 
                   target="_blank" 
                   rel="noopener" 
                   class="btn btn-outline ${(!hasValidPhone || !hasValidWhatsapp) ? '' : 'btn--full-mobile'}" 
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
              ${(!isAtm && (place.allowAppointments === true || (place.allowAppointments !== false && (place.categoryId === 'doctor' || place.categoryId?.includes('clinic') || place.categoryId === 'health')))) ? `
                <button type="button" class="btn btn-outline btn--full-mobile" id="btn-book-appointment" style="border-color:#0284c7;color:#0284c7;font-weight:800;gap:6px">
                  <span>📅</span>
                  <span>طلب حجز موعد / استشارة</span>
                </button>
              ` : ''}
              <button type="button" class="btn btn-outline btn--full-mobile" id="btn-report-place-data" data-place-id="${escAttr(placeId)}" data-place-name="${escAttr(place.name || '')}">
                <span>🚩</span>
                <span>الإبلاغ عن معلومة غير صحيحة</span>
              </button>
              
              ${(isOwner || (currentUser && currentUser.isAdmin)) ? `
                <div class="availability-quick-switch" style="display:flex;align-items:center;gap:8px;background:var(--surface-2);padding:8px 14px;border-radius:var(--radius-md);margin-top:8px;border:1px solid var(--border);width:100%;justify-content:space-between;flex-wrap:wrap">
                  <span style="font-size:12.5px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                    <span>⚡</span> <span>تعديل حالتك الآن:</span>
                  </span>
                  <select id="quick-availability-select" class="form-select" style="padding:4px 10px;font-size:12.5px;font-weight:700;border-radius:var(--radius-sm);cursor:pointer;border:1px solid var(--border);background:var(--surface)">
                    <option value="available" ${(place.availabilityStatus || place.availability_status) === 'available' ? 'selected' : ''}>🟢 متاح الآن</option>
                    <option value="busy" ${(place.availabilityStatus || place.availability_status) === 'busy' ? 'selected' : ''}>🟡 مشغول حالياً</option>
                    <option value="unavailable" ${(place.availabilityStatus || place.availability_status) === 'unavailable' ? 'selected' : ''}>🔴 غير متاح حالياً</option>
                  </select>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- ATM Cash Availability Live Poll Card -->
          ${isAtm ? `
            <div class="atm-poll-card animate-fade-in-up" id="atm-poll-section" style="background:linear-gradient(135deg, #0F2B48 0%, #1B4F72 100%);color:#fff;padding:20px;border-radius:var(--radius-lg);margin-bottom:var(--space-4);box-shadow:0 8px 24px rgba(27,79,114,0.25);border:1px solid rgba(255,255,255,0.15)">
              ${renderAtmPollMarkup(place.atmPoll, placeId)}
            </div>
          ` : ''}

                    <!-- Unverified Place Notice & Verification CTA -->
          ${!place.isVerified ? `
            <div class="unverified-notice animate-fade-in">
              <div class="unverified-notice__icon">ℹ️</div>
              <div class="unverified-notice__body">
                <div class="unverified-notice__title">
                  هذا الشخص أو المكان غير موثق حالياً
                </div>
                <p class="unverified-notice__text">
                  العلامة الموثقة تضمن صحة البيانات وتمنحك مميزات إضافية وتظهر قبل الجميع فى دليل المنزلة والمطرية الرقمي
                </p>
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
          ${!isAtm && placeDisplayDesc ? `
            <section class="info-card">
              <h2 class="info-card__title">
                <span>📝</span> ${isEn ? 'About this Business' : 'عن الشخص / المكان / الخدمة'}
              </h2>
              <p style="white-space:pre-line;color:var(--text-secondary);line-height:1.8">
                ${escHtml(placeDisplayDesc)}
              </p>
            </section>
          ` : ''}

          <!-- Services / Tags -->
          ${!isAtm && displayServices && displayServices.length > 0 ? `
            <section class="info-card">
              <h2 class="info-card__title">
                <span>✨</span> ${isEn ? 'Services & Features' : 'الخدمات والمميزات'}
              </h2>
              <div class="services-tags">
                ${displayServices.map(s => `<span class="chip chip--primary">✓ ${escHtml(s)}</span>`).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Active Offers Slot -->
          <div id="place-offers-slot"></div>

          <!-- Products Slot (Verified Places) -->
          <div id="place-products-slot"></div>

          <!-- Activity Trust Breakdown Card -->
          ${!isAtm ? renderTrustCard(place) : ''}

          <!-- Google-Style 5-Star Reviews Slot -->
          <div id="place-reviews-slot">
            ${!isAtm ? renderReviewsSectionHTML({ placeId, placeName: place.name, safeReviews, totalReviews, currentUser, userReview, isHammad }) : ''}
          </div>

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

          <!-- Working Hours Card (Hidden for ATMs) -->
          ${!isAtm ? renderWorkingHoursSectionHTML({ isOpen, workingHoursList }) : ''}

          <!-- Social Media Links (وسائل التواصل الاجتماعي) -->
          ${hasSocial(place.social) ? `
            <div class="info-card">
              <h3 class="info-card__title" style="font-size:var(--font-size-base)">
                <span>🌐</span> وسائل التواصل والموقع
              </h3>
              <div class="social-links" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
                ${place.social?.facebook ? `
                  <a href="${escAttr(formatSocialUrl('facebook', place.social.facebook))}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--fb" title="فيسبوك">
                    ${SOCIAL_ICONS.facebook}
                    <span>فيسبوك</span>
                  </a>
                ` : ''}
                ${(place.social?.x || place.social?.twitter) ? `
                  <a href="${escAttr(formatSocialUrl('x', place.social.x || place.social.twitter))}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--x" title="منصة X (تويتر)">
                    ${SOCIAL_ICONS.x}
                    <span>منصة X</span>
                  </a>
                ` : ''}
                ${place.social?.instagram ? `
                  <a href="${escAttr(formatSocialUrl('instagram', place.social.instagram))}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--ig" title="إنستجرام">
                    ${SOCIAL_ICONS.instagram}
                    <span>إنستجرام</span>
                  </a>
                ` : ''}
                ${place.social?.tiktok ? `
                  <a href="${escAttr(formatSocialUrl('tiktok', place.social.tiktok))}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--tt" title="تيك توك">
                    ${SOCIAL_ICONS.tiktok}
                    <span>تيك توك</span>
                  </a>
                ` : ''}
                ${place.social?.threads ? `
                  <a href="${escAttr(formatSocialUrl('threads', place.social.threads))}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--th" title="ثريدز">
                    ${SOCIAL_ICONS.threads}
                    <span>ثريدز</span>
                  </a>
                ` : ''}
                ${place.social?.youtube ? `
                  <a href="${escAttr(formatSocialUrl('youtube', place.social.youtube))}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--yt" title="يوتيوب">
                    ${SOCIAL_ICONS.youtube}
                    <span>يوتيوب</span>
                  </a>
                ` : ''}
                ${place.social?.website ? `
                  <a href="${escAttr(formatSocialUrl('website', place.social.website))}" target="_blank" rel="noopener" class="social-brand-btn social-brand-btn--web" title="الموقع الإلكتروني الرسمي">
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

          <!-- Other Branches Section (فروع أخرى لهذا المكان) -->
          <div class="info-card place-branches-card" id="place-branches-card" style="display:none;margin-top:var(--space-4)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--space-3)">
              <span style="font-size:20px">🏢</span>
              <h3 class="info-card__title" style="margin:0;font-size:var(--font-size-base);font-weight:700">فروع أخرى لهذا المكان</h3>
            </div>
            <div id="place-branches-list" class="branches-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:14px">
              <!-- Rendered dynamically -->
            </div>
          </div>

        </div>
      </div>
    `;

    // ── Setup Interactivity ──

    // Expose global trackStat for inline event handlers
    window.trackStat = function(pid, s, extra) {
      trackPlaceStat(pid, s, extra);
    };

    // Track view and search keyword if visitor arrived from search or query
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const searchKeyword = urlParams.get('q') || urlParams.get('keyword') || urlParams.get('ref_query') || '';
      trackPlaceStat(placeId, 'views', { keyword: searchKeyword });
    } catch (_) {}

    // Quick availability status switcher for owner/admin
    const availSelect = document.getElementById('quick-availability-select');
    if (availSelect) {
      availSelect.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        try {
          await updatePlaceAvailability(placeId, newStatus);
          toast('تم تحديث حالة التوافر بنجاح', 'success');
          const badge = document.getElementById('place-availability-badge-container');
          if (badge) badge.innerHTML = renderAvailabilityBadge(newStatus);
        } catch (err) {
          toast('فشل تحديث الحالة: ' + err.message, 'error');
        }
      });
    }

    // ── Load & Render Other Branches ──
    getPlaceBranches(placeId || place.id).then(branches => {
      const branchesCard = document.getElementById('place-branches-card');
      const branchesList = document.getElementById('place-branches-list');
      if (!branchesCard || !branchesList) return;
      const otherBranches = (branches || []).filter(b => b.id !== placeId && b.slug !== cleanSlug);
      if (otherBranches.length === 0) return;

      branchesCard.style.display = 'block';
      branchesList.innerHTML = otherBranches.map(b => {
        const branchPhone = b.phone || place.phone || '';
        const branchWhatsapp = b.whatsapp || place.whatsapp || '';
        const bStatus = b.availability_status || b.availabilityStatus || 'available';
        const isMain = b.is_main;
        const isSameAsMain = b.same_as_main_hours !== false && b.sameAsMainHours !== false;
        const bHours = (b.working_hours && typeof b.working_hours === 'object' && Object.keys(b.working_hours).length > 0)
          ? b.working_hours
          : (b.workingHours && typeof b.workingHours === 'object' && Object.keys(b.workingHours).length > 0)
            ? b.workingHours
            : (place.workingHours || place.working_hours || {});
        const liveStatus = getPlaceLiveStatus(bHours);
        return `
          <div class="branch-card" style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="badge ${isMain ? 'badge--primary' : 'badge--secondary'}" style="font-size:11px">
                    ${isMain ? '🏢 المقر الرئيسي' : '📍 فرع'}
                  </span>
                  <span class="badge" style="font-size:11px;font-weight:700;${liveStatus.isOpen ? 'background:#DCFCE7;color:#166534;border:1px solid #BBF7D0' : 'background:#FEE2E2;color:#991B1B;border:1px solid #FECACA'}">
                    ${liveStatus.isOpen ? '🟢 ' + liveStatus.badgeText : '🔴 ' + liveStatus.badgeText}
                  </span>
                </div>
                ${renderAvailabilityBadge(bStatus)}
              </div>
              <h4 style="font-size:15px;font-weight:700;margin:0 0 6px 0;color:var(--text-primary)">
                ${escHtml(b.name || place.name)}
              </h4>
              <p style="font-size:12.5px;color:var(--text-secondary);margin:0 0 6px 0;display:flex;align-items:center;gap:5px">
                <span>📍</span>
                <span>${escHtml(b.address || b.area || place.address || '')}</span>
              </p>
              <div style="font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;gap:5px">
                <span>⏰</span>
                <span>${isSameAsMain ? 'نفس مواعيد عمل المقر الرئيسي' : (liveStatus.details || 'مواعيد العمل محددة')}</span>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px dashed var(--border)">
              ${(branchPhone && isValidPhoneNumber(branchPhone)) ? `
                <a href="tel:${cleanPhone(branchPhone)}" class="btn btn-primary btn-sm" onclick="trackStat('${escAttr(b.id)}', 'phoneClicks')" style="font-size:12px;padding:4px 10px">
                  <span>📞 اتصال</span>
                </a>
              ` : ''}
              ${(branchWhatsapp && isValidPhoneNumber(branchWhatsapp)) ? `
                <a href="${buildContextualWhatsAppLink(branchWhatsapp, { source: 'branch_card', placeName: b.name, placeSlug: b.slug })}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm" onclick="trackStat('${escAttr(b.id)}', 'whatsappClicks')" style="font-size:12px;padding:4px 10px">
                  <span>واتساب</span>
                </a>
              ` : ''}
              <a href="place.html?slug=${encodeURIComponent(b.slug || b.id)}" class="btn btn-outline btn-sm" style="font-size:12px;padding:4px 10px;margin-right:auto">
                <span>عرض الفرع ←</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
    }).catch(() => {});

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

    // Smart Page Back Button
    document.getElementById('btn-place-back')?.addEventListener('click', () => {
      if (window.history.length > 1 && document.referrer && !document.referrer.includes('login')) {
        window.history.back();
      } else {
        window.location.href = `category.html?slug=${catInfo.slug || 'all'}`;
      }
    });

    // Verification Request Button
    let waUrl = 'https://wa.me/wasendernew';

    document.getElementById('btn-request-verification')?.addEventListener('click', () => {
      showVerificationModal(place, user, waUrl);
    });

    document.getElementById('btn-claim-place')?.addEventListener('click', () => {
      showClaimModal(place, waUrl);
    });

    // Initial Reviews Event Binding
    bindReviewsEvents(place, currentUser, safeReviews, userReview, $container, slug);

    // Setup Place Sharing Handlers (Web Share + Modal)
    setupPlaceSharing(place);

    // Setup Place Profile Card Download Modal (Manhom Style)
    document.querySelectorAll('.btn-download-profile-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        openPlaceProfileCardModal(place, category);
      });
    });

    // Setup Storefront QR Placard & Poster Generator Modal
    document.querySelectorAll('.btn-open-storefront-qr, #btn-open-storefront-qr').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openStorefrontQrModal(place, category);
      });
    });

    // Setup Place Following System
    setupPlaceFollowing(placeId, currentUser);

    // Setup ATM Cash Availability Live Poll Interactivity
    if (isAtm) {
      setupAtmPollInteractivity(placeId, place.atmPoll);
    }

    // Dismiss splash loading animation if active
    try {
      if (typeof window !== 'undefined' && typeof window.hideSplash === 'function') {
        window.hideSplash();
      }
    } catch (_) {}

    // ── Non-Blocking Background Hydration ──

    // 1. Hydrate Offers in background
    if (!isAtm) {
      getPlaceOffers(placeId).then(offers => {
        if (Array.isArray(offers) && offers.length > 0) {
          const slot = document.getElementById('place-offers-slot');
          if (slot) {
            slot.innerHTML = renderOffersSectionHTML(offers, place);
            bindOffersEvents(offers, place);
          }
        }
      }).catch(() => {});
    }

    // 2. Hydrate Products in background (Verified Places)
    if (!isAtm && place.isVerified) {
      getPlaceProducts(placeId).then(products => {
        if (Array.isArray(products) && products.length > 0) {
          const slot = document.getElementById('place-products-slot');
          if (slot) {
            slot.innerHTML = renderProductsSectionHTML(products, place);
            bindProductsEvents(products, place);
          }
        }
      }).catch(() => {});
    }

    // 3. Hydrate Live Reviews in background (SWR + Realtime Sync)
    if (!isAtm) {
      const applyReviewsData = (list) => {
        if (!Array.isArray(list) || !list.length) return;
        safeReviews = list;
        totalReviews = safeReviews.length;
        let rSum = 0;
        safeReviews.forEach(r => { rSum += (Number(r.rating) || 5); });
        avgRating = totalReviews > 0 ? (safeReviews.length > 0 ? Math.round((rSum / safeReviews.length) * 10) / 10 : (Number(place.rating) || 5.0)) : (Number(place.rating) || 0.0);
        userReview = currentUser ? safeReviews.find(r => r.userId === currentUser.uid) : null;

        const slot = document.getElementById('place-reviews-slot');
        if (slot) {
          slot.innerHTML = renderReviewsSectionHTML({ placeId, placeName: place.name, safeReviews, totalReviews, currentUser, userReview, isHammad });
          bindReviewsEvents(place, currentUser, safeReviews, userReview, $container, slug);
        }

        const ratingBadge = document.getElementById('place-header-rating-badge');
        if (ratingBadge) {
          ratingBadge.innerHTML = `
            <span>★</span>
            <span>${avgRating > 0 ? avgRating.toFixed(1) : (totalReviews > 0 ? '5.0' : '0.0')}</span>
            <span style="color:var(--text-muted);font-weight:normal;font-size:11px">(${totalReviews > 0 ? `${totalReviews} تقييم` : 'جديد'})</span>
          `;
        }
      };
      // Reviews are rendered from cache immediately when available; never show an infinite spinner.
      const loadingFallbackTimer = null;

      reviewsFetchPromise.then(liveReviews => {
        if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);
        if (Array.isArray(liveReviews) && liveReviews.length > 0) {
          applyReviewsData(liveReviews);
        }
      }).catch(() => {
        if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);
      });

      // Listen for background SWR fresh reviews event
      window.addEventListener('reviews:fresh_data', (e) => {
        const { targetId, effectiveSlug, reviews: freshList } = e.detail || {};
        if (freshList && freshList.length > 0) {
          if (targetId === placeId || targetId === place.id || effectiveSlug === place.slug || effectiveSlug === slug || isHammad) {
            applyReviewsData(freshList);
          }
        }
      });

      // Listen for revalidation fresh data
      window.addEventListener('place:fresh_data', (e) => {
        const fresh = e.detail;
        if (fresh && (fresh.id === placeId || fresh.slug === place.slug || fresh.slug === slug)) {
          const freshCount = Number(fresh.reviewCount || fresh.review_count || fresh.stats?.reviewCount || 0);
          if (freshCount > 0 && freshCount !== totalReviews) {
            totalReviews = freshCount;
            avgRating = Number(fresh.rating || fresh.stats?.rating || avgRating || 5.0);
            const rb = document.getElementById('place-header-rating-badge');
            if (rb) {
              rb.innerHTML = `
                <span>★</span>
                <span>${avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
                <span style="color:var(--text-muted);font-weight:normal;font-size:11px">(${totalReviews} تقييم)</span>
              `;
            }
          }
        }
      }, { once: true });
    }

    // 4. Hydrate Spotlight Widget & Settings in background idle
    const loadSpotlight = () => {
      Promise.all([
        getPublishedPlaces({ limit: 40 }).catch(() => []),
        getSettings().catch(() => ({}))
      ]).then(([allPublished, settings]) => {
        if (settings?.contact?.whatsappLink) {
          waUrl = settings.contact.whatsappLink;
        }
        mountSpotlightPlaceWidget(allPublished, placeId, waUrl);
      }).catch(() => {});
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(loadSpotlight, { timeout: 2500 });
    } else {
      setTimeout(loadSpotlight, 120);
    }

    // 5. Silent Revalidation for Instant Place Cache
    if (initialPlace) {
      getPlaceBySlug(slug).then(freshPlace => {
        if (freshPlace && isPlaceBanned(freshPlace) && !isUserAdmin && !isOwner) {
          location.reload();
        }
      }).catch(() => {});
    }

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

function renderAtmPollMarkup(poll = {}, placeId = '') {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:2.2rem;background:rgba(255,255,255,0.12);width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.25);flex-shrink:0">🏧</span>
        <div>
          <h2 style="font-size:1.25rem;font-weight:800;color:#fff;margin:0 0 4px 0">استبيان حالة ماكينة الصراف الآلي المباشر (تحديثات حية)</h2>
          <div style="font-size:12.5px;color:rgba(255,255,255,0.8);line-height:1.5">مشاركة حية من أهالي وزوار المنزلة والمطرية لمعرفة حالة النقدية، الإيداع، التلامس، والتشغيل</div>
        </div>
      </div>
      <span class="badge" style="background:rgba(245,166,35,0.2);color:#FEF08A;border:1px solid rgba(245,166,35,0.4);font-size:11.5px;font-weight:700;padding:5px 12px;border-radius:var(--radius-full)">
        ⚡ تحديث لحظي مباشر
      </span>
    </div>

    <!-- 4-Question Live Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
      ${ATM_POLL_QUESTIONS.map(q => {
        let qData = poll[q.key] || {};
        if (q.key === 'cash' && poll.yesCount !== undefined && !poll.cash) {
          qData = {
            yesCount: poll.yesCount,
            noCount: poll.noCount,
            totalVotes: poll.totalVotes,
            lastAnswerTime: poll.lastAnswerTime || poll.updatedAt,
            lastAnswerChoice: poll.lastAnswerChoice
          };
        }

        const yesCount = Number(qData.yesCount) || 0;
        const noCount = Number(qData.noCount) || 0;
        const totalVotes = Number(qData.totalVotes) || (yesCount + noCount);
        const yesPct = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;
        const noPct = totalVotes > 0 ? (100 - yesPct) : 0;
        const lastAnswerTime = qData.lastAnswerTime;

        let userChoice = null;
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(`atm_vote_${placeId}_${q.key}`) || (q.key === 'cash' ? localStorage.getItem(`atm_vote_${placeId}`) : null);
            if (raw) {
              const parsed = JSON.parse(raw);
              userChoice = parsed.choice;
            }
          }
        } catch (_) {}

        let statusBadge = '';
        if (totalVotes === 0) {
          statusBadge = `<span style="background:rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:var(--radius-full);font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,0.2)">${q.badgeNone}</span>`;
        } else if (yesCount >= noCount) {
          statusBadge = `<span style="background:linear-gradient(135deg, #10B981, #059669);color:#fff;padding:4px 12px;border-radius:var(--radius-full);font-size:11.5px;font-weight:800;box-shadow:0 2px 8px rgba(16,185,129,0.3)">${q.badgeYes}</span>`;
        } else {
          statusBadge = `<span style="background:linear-gradient(135deg, #EF4444, #DC2626);color:#fff;padding:4px 12px;border-radius:var(--radius-full);font-size:11.5px;font-weight:800;box-shadow:0 2px 8px rgba(239,68,68,0.3)">${q.badgeNo}</span>`;
        }

        const timeAgoText = lastAnswerTime ? formatAtmTimeAgo(lastAnswerTime) : 'لم تسجل إجابات بعد';

        return `
          <div class="atm-q-card" style="background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.14);border-radius:var(--radius-md);padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
            <div>
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:1.3rem">${q.icon}</span>
                  <h3 style="font-size:1.02rem;font-weight:800;color:#fff;margin:0">${q.title}</h3>
                </div>
                <div>${statusBadge}</div>
              </div>
              <div style="font-size:11.5px;color:rgba(255,255,255,0.7);margin-bottom:10px">${q.desc}</div>

              <!-- Progress bar & counts -->
              <div style="background:rgba(255,255,255,0.06);padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:12px;border:1px solid rgba(255,255,255,0.08)">
                <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;margin-bottom:6px">
                  <span style="color:#A7F3D0">نعم: ${yesPct}% (${yesCount})</span>
                  <span style="color:#FECACA">لا: ${noPct}% (${noCount})</span>
                </div>
                <div style="height:8px;background:rgba(255,255,255,0.12);border-radius:9999px;overflow:hidden;display:flex;margin-bottom:8px">
                  <div style="width:${yesPct}%;background:#10B981;transition:width 0.4s ease"></div>
                  <div style="width:${noPct}%;background:#EF4444;transition:width 0.4s ease"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.75)">
                  <span>⏱️ <strong>آخر إجابة:</strong> <span style="color:#FEF08A">${timeAgoText}</span></span>
                  <span>👥 ${totalVotes} صوت</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div>
              <div style="font-size:11.5px;font-weight:700;color:#FEF3C7;margin-bottom:6px">
                ${userChoice ? '✅ تم تسجيل إجابتك على هذا السؤال' : 'اختر إجابتك لتحديث الحالة:'}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                <button type="button" class="btn btn-sm btn-atm-vote" data-q="${q.key}" data-choice="yes" ${userChoice ? 'disabled style="opacity:0.6;cursor:not-allowed"' : ''} style="background:linear-gradient(135deg, #10B981 0%, #059669 100%);color:#fff;border:none;font-weight:700;padding:6px 8px;border-radius:var(--radius-sm);font-size:12px;cursor:pointer;white-space:normal;line-height:1.3;text-align:center" title="${q.yesLabel}">
                  ${q.yesLabel} ${userChoice === 'yes' ? '✓' : ''}
                </button>
                <button type="button" class="btn btn-sm btn-atm-vote" data-q="${q.key}" data-choice="no" ${userChoice ? 'disabled style="opacity:0.6;cursor:not-allowed"' : ''} style="background:linear-gradient(135deg, #EF4444 0%, #DC2626 100%);color:#fff;border:none;font-weight:700;padding:6px 8px;border-radius:var(--radius-sm);font-size:12px;cursor:pointer;white-space:normal;line-height:1.3;text-align:center" title="${q.noLabel}">
                  ${q.noLabel} ${userChoice === 'no' ? '✓' : ''}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function setupAtmPollInteractivity(placeId, initialPoll = {}) {
  const pollSection = document.getElementById('atm-poll-section');
  if (!pollSection) return;

  const attachButtons = () => {
    pollSection.querySelectorAll('.btn-atm-vote').forEach(btn => {
      btn.addEventListener('click', async () => {
        const qKey = btn.getAttribute('data-q');
        const choice = btn.getAttribute('data-choice');
        if (!qKey || !choice) return;

        btn.disabled = true;
        try {
          const updatedPoll = await submitAtmPollVote(placeId, qKey, choice);
          toast.success('تم تسجيل إجابتك بنجاح! شكراً لمساعدتك لأهالي المنزلة والمطرية ✨');
          pollSection.innerHTML = renderAtmPollMarkup(updatedPoll, placeId);
          attachButtons();
        } catch (err) {
          console.error(err);
          toast.error('تعذر تسجيل التصويت، يرجى المحاولة لاحقاً');
          btn.disabled = false;
        }
      });
    });
  };

  attachButtons();
}

function mountSpotlightPlaceWidget(allPlaces = [], currentPlaceId = '', waBaseUrl = 'https://wa.me/wasendernew') {
  const container = document.getElementById('spotlight-place-container');
  if (!container) return;

  const verifiedPlaces = (allPlaces || []).filter(p => 
    !isAtmPlace(p) &&
    (p.isVerified || (p.verifiedUntil && Number(p.verifiedUntil) > Date.now())) && 
    (p.id !== currentPlaceId && p._key !== currentPlaceId && p.slug !== currentPlaceId)
  );

  const fallbackPlaces = (allPlaces || []).filter(p => 
    !isAtmPlace(p) &&
    (p.isVerified || p.isSponsored || p.isFeatured) &&
    (p.id !== currentPlaceId && p._key !== currentPlaceId && p.slug !== currentPlaceId)
  );

  const candidates = verifiedPlaces.length > 0 ? verifiedPlaces : (fallbackPlaces.length > 0 ? fallbackPlaces : allPlaces.filter(p => !isAtmPlace(p) && p.id !== currentPlaceId));

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
    const pImg = targetPlace.logoUrl || targetPlace.logo_url || targetPlace.coverImageUrl || targetPlace.cover_image_url || './icons/icon-72x72.png';
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
        <a href="/place.html?slug=${encodeURIComponent(pSlug)}" class="spotlight-profile-link" title="عرض ملف ${escAttr(pName)}">
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
  return isValidPhoneNumber(phone) ? (phone?.replace(/\D/g, '') || '') : '';
}

function formatWhatsApp(phone) {
  if (!phone || !isValidPhoneNumber(phone)) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('201') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith('00201') && cleaned.length === 14) {
    return cleaned.slice(2);
  }
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return '2' + cleaned; // Produces 201xxxxxxxxx (2 + 01...)
  }
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return '20' + cleaned; // Produces 201xxxxxxxxx
  }
  if (cleaned.startsWith('21') && cleaned.length === 11) {
    return '20' + cleaned.slice(1); // Fixes 2100xxxxxxx -> 20100xxxxxxx
  }
  return cleaned.startsWith('0') ? '2' + cleaned : cleaned;
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

            // Refresh live reviews on this page immediately
            try {
              const freshReviews = await getPlaceReviews(place.id || place._key, place.slug);
              safeReviews = Array.isArray(freshReviews) ? freshReviews : [];
              totalReviews = safeReviews.length;
              let rSum = 0;
              safeReviews.forEach(r => { rSum += (Number(r.rating) || 5); });
              avgRating = totalReviews > 0 ? Math.round((rSum / totalReviews) * 10) / 10 : 0.0;
              userReview = user ? safeReviews.find(r => r.userId === user.uid) : null;

              const slot = document.getElementById('place-reviews-slot');
              if (slot) {
                slot.innerHTML = renderReviewsSectionHTML({ placeId: place.id || place._key, placeName: place.name, safeReviews, totalReviews, currentUser: user, userReview, isHammad });
                bindReviewsEvents(place, user, safeReviews, userReview, $container, slug);
              }

              const ratingBadge = document.getElementById('place-header-rating-badge');
              if (ratingBadge) {
                ratingBadge.innerHTML = `
                  <span>★</span>
                  <span>${avgRating > 0 ? avgRating.toFixed(1) : (totalReviews > 0 ? '5.0' : '0.0')}</span>
                  <span style="color:var(--text-muted);font-weight:normal;font-size:11px">(${totalReviews > 0 ? `${totalReviews} تقييم` : 'جديد'})</span>
                `;
              }
            } catch (syncErr) {
              console.warn('[Review] immediate UI sync error:', syncErr);
            }

            if (onDone) {
              Promise.resolve().then(() => onDone()).catch(refreshErr => {
                console.error('[Review] refresh after successful submit failed:', refreshErr);
              });
            }
          } catch (err) {
            console.error('[Review] submit failed:', err);
            const message = err?.message || String(err) || 'تعذر حفظ التقييم';
            toast.error(message === 'is not defined' ? 'تعذر إتمام العملية. يرجى تحديث الصفحة والمحاولة مرة أخرى.' : message);
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
  const rawSlug = place.slug || place.id || '';
  const isIdLike = (s) => !s || s.startsWith('p_') || s.startsWith('-P0') || (s.length > 20 && /^[a-zA-Z0-9_-]+$/.test(s));
  const cleanTranslit = generateCleanSlug(place.name);

  let canonicalSlug = '';
  if (place.slug && !isIdLike(place.slug)) {
    canonicalSlug = String(place.slug).replace(/-[a-z0-9_]{5,7}$/i, '') || place.slug;
  } else {
    canonicalSlug = cleanTranslit || place.id;
  }
  const finalSlug = (canonicalSlug && canonicalSlug.length >= 3) ? canonicalSlug : rawSlug;
  // Branded official share URL via Cloudflare Worker Dynamic OpenGraph handler
  const brandedShareUrl = `https://dalilmanzala.com/p/${encodeURIComponent(finalSlug || rawSlug)}`;
  const coverUrl = place.coverImageUrl || place.cover_image_url || place.logoUrl || place.logo_url || 'https://dalilmanzala.com/assets/images/og-whatsapp.jpg';

  const shareTitle = `${placeName} | دليل المنزلة والمطرية الرقمي`;
  const shareText = `📍 *${placeName}*
📌 العنوان: ${placeAddress}
🔗 رابط المكان: ${brandedShareUrl}

تم مشاركة هذه البطاقة من دليل المنزلة والمطرية الرقمي - انت كمان ممكن تضيف مكانك على الدليل مجانا من هنا
https://dalilmanzala.com`;

  triggers.forEach(btn => {
    btn.addEventListener('click', async () => {
      trackPlaceStat(place.id || placeId, 'shareClicks');
      // 1. Try Native Web Share API (Mobile native app chooser)
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: brandedShareUrl
          });
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            openCustomShareModal({ placeName, placeAddress, placeUrl: brandedShareUrl, coverUrl, shareText });
          }
          return;
        }
      }

      // 2. Custom Share Modal Fallback
      openCustomShareModal({ placeName, placeAddress, placeUrl: brandedShareUrl, coverUrl, shareText });
    });
  });
}

function openCustomShareModal({ placeName, placeAddress, placeUrl, coverUrl, shareText }) {
  const shareTitle = `${placeName} | دليل المنزلة والمطرية الرقمي`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const tgShare = `https://t.me/share/url?url=${encodeURIComponent(placeUrl)}&text=${encodeURIComponent(shareText)}`;
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(placeUrl)}`;
  const twShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(placeUrl)}&text=${encodeURIComponent(shareText)}`;

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
          تم مشاركة هذه البطاقة من دليل المنزلة والمطرية الرقمي - انت كمان ممكن تضيف مكانك على الدليل مجانا من هنا:<br/>
          <a href="https://dalilmanzala.com" target="_blank" rel="noopener" style="color:var(--primary);font-weight:700">https://dalilmanzala.com</a>
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
        toast.success('تم نسخ تفاصيل ورابط البطاقة بنجاح! 📋');
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
        trackPlaceStat(placeId, 'favoriteClicks');
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
 * Setup Reviews Sentiment Filter & Progressive Pagination (Load More)
 */
function setupReviewsSentimentFilter(place = {}, currentUser = null, safeReviews = [], userReview = null, $container = null, slug = '') {
  const tabs = document.querySelectorAll('.review-filter-tab');
  const reviewsList = document.getElementById('place-reviews-list');
  const loadMoreWrap = document.getElementById('reviews-load-more-wrap');
  const loadMoreBtn = document.getElementById('btn-load-more-reviews');
  const loadMoreCount = document.getElementById('load-more-count');

  if (!tabs.length || !reviewsList) return;
  const reviews = Array.isArray(safeReviews) ? safeReviews : [];

  let currentSentiment = 'all';
  let visibleCount = 15;
  const pageSize = 20;

  function getFilteredList() {
    if (currentSentiment === 'all') return reviews;
    if (currentSentiment === 'positive') return reviews.filter(r => (Number(r.rating) || 5) >= 3);
    if (currentSentiment === 'negative') return reviews.filter(r => (Number(r.rating) || 5) <= 2);
    const s = parseInt(currentSentiment, 10);
    if (!isNaN(s)) return reviews.filter(r => (Number(r.rating) || 5) === s);
    return reviews;
  }

  function renderCurrentSlice() {
    const filtered = getFilteredList();
    if (filtered.length === 0) {
      reviewsList.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;background:var(--surface-2);border-radius:var(--radius-md);color:var(--text-muted);font-size:13.5px">
          ${currentSentiment === 'negative' 
            ? '✨ لا توجد أي تقييمات سلبية مسجلة لهذا المكان حتى الآن (جميع التقييمات إيجابية 5 و 4 نجوم).' 
            : 'لا توجد تقييمات مطابقة لهذا الفلتر حالياً.'}
        </div>
      `;
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    const slice = filtered.slice(0, visibleCount);
    reviewsList.innerHTML = slice.map(r => renderSingleReviewCard(r, currentUser, place, place?.name)).join('');

    const remaining = filtered.length - slice.length;
    if (loadMoreWrap && loadMoreBtn && loadMoreCount) {
      if (remaining > 0) {
        loadMoreWrap.style.display = 'block';
        loadMoreCount.textContent = String(remaining);
      } else {
        loadMoreWrap.style.display = 'none';
      }
    }
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

      currentSentiment = tab.getAttribute('data-sentiment') || 'all';
      visibleCount = 15;
      renderCurrentSlice();
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.onclick = () => {
      visibleCount += pageSize;
      renderCurrentSlice();
    };
  }
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




function renderWorkingHoursSectionHTML({ isOpen, workingHoursList }) {
  return `
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
              ${h.closed ? 'مغلق' : ((h.open === '00:00' && (h.close === '23:59' || h.close === '24:00')) ? 'مفتوح 24 ساعة 🟢' : `${h.open} — ${h.close}`)}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderSingleReviewCard(r, currentUser = null, place = {}, placeName = '') {
  const isMine = currentUser && currentUser.uid === r.userId;
  const isHammadPlace = (place && (place.slug === 'almhnds-mhmd-hmad' || place.slug === 'mhnds-mhmd-hmad-5lQJ1o' || place.id === 'p_1788742873778_6k8a9v')) || false;
  const rStars = Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5));
  const timeStr = formatDate(r.createdAt || Date.now());
  const userPts = Number(r.userPoints || r.points) || getDeterministicReviewerPoints(r.userName, r.id);
  const lvl = getLoyaltyLevelInfo(userPts).currentLevel;

  return `
    <div class="review-card" data-stars="${rStars}" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;transition:all 0.2s">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);flex-shrink:0;border:1px solid var(--border)">
            ${r.userPhoto ? `<img src="${escAttr(r.userPhoto)}" alt="${escAttr(r.userName)}" style="width:100%;height:100%;object-fit:cover" />` : (r.userName?.charAt(0) || '👤')}
          </div>
          <div>
            <div style="font-weight:700;font-size:13.5px;color:var(--text-primary);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span>${escHtml(r.userName || 'مستخدم مسجل')}</span>
              <span class="badge" style="font-size:10.5px;padding:2px 8px;border-radius:9999px;background:rgba(245,166,35,0.12);color:${lvl.color};border:1px solid ${lvl.color}40;font-weight:800;display:inline-flex;align-items:center;gap:3px">
                <span>${lvl.icon}</span>
                <span>${lvl.name}</span>
              </span>
              ${isMine ? `<span class="badge" style="font-size:10px;padding:1px 6px;background:var(--primary-alpha);color:var(--primary)">تقييمك</span>` : ''}
            </div>
            <div style="font-size:11px;color:var(--text-muted)">
              ${timeStr} ${r.isEdited ? '• (معدل)' : ''}
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px">
          <div style="color:#F59E0B;font-size:1.1rem;letter-spacing:1px">
            ${'★'.repeat(rStars)}${'☆'.repeat(5 - rStars)}
          </div>
          ${isMine && (!isHammadPlace || currentUser?.role === 'superadmin') ? `
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

      <div style="font-size:13.5px;line-height:1.6;color:var(--text-secondary);background:var(--surface-2);padding:10px 12px;border-radius:var(--radius-sm)">
        ${escHtml(r.comment || '')}
      </div>

      ${(r.isReviewedByAdmin && (r.adminReviewStatus === 'approved_compliant' || r.adminReviewNote)) ? `
        <div class="admin-review-compliant-note" style="margin-top:8px;padding:8px 12px;background:rgba(16,185,129,0.08);border-right:3px solid #10B981;border-radius:var(--radius-sm);font-size:12px;color:#047857;line-height:1.5;display:flex;align-items:center;gap:6px">
          <span>🛡️</span>
          <span><strong>ملاحظة الإدارة:</strong> هذا التعليق تم الإبلاغ عنه، وبعد المراجعة تأكدنا أنه يلتزم بالسياسة ولا داعي لحذفه.</span>
        </div>
      ` : ''}

      ${!isMine ? `
        <div style="display:flex;justify-content:flex-end;margin-top:6px">
          <button type="button" class="btn-report-review" onclick="window.reportReviewAction('${escAttr(place?.id || '')}', '${escAttr(r.id)}', '${escAttr(placeName || place?.name || '')}')" style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:2px 4px;border-radius:4px;transition:color 0.2s" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'" title="الإبلاغ عن هذا التعليق كمسيء">
            <span>🚩</span> الإبلاغ عن هذا التعليق كمسيء
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderReviewsSectionHTML({ placeId, placeName, safeReviews = [], totalReviews = 0, currentUser = null, userReview = null, isHammad = false }) {
  let c5 = safeReviews.filter(r => (Number(r.rating) || 5) === 5).length;
  let c4 = safeReviews.filter(r => (Number(r.rating) || 5) === 4).length;
  let c3 = safeReviews.filter(r => (Number(r.rating) || 5) === 3).length;
  let c2 = safeReviews.filter(r => (Number(r.rating) || 5) === 2).length;
  let c1 = safeReviews.filter(r => (Number(r.rating) || 5) === 1).length;
  let cPos = safeReviews.filter(r => (Number(r.rating) || 5) >= 3).length;
  let cNeg = safeReviews.filter(r => (Number(r.rating) || 5) <= 2).length;

  if (safeReviews.length === 0 && isHammad) {
    c5 = 388;
    c4 = 112;
    c3 = 0;
    c2 = 0;
    c1 = 0;
    cPos = 500;
    cNeg = 0;
    totalReviews = 500;
  } else if (safeReviews.length > 0) {
    totalReviews = safeReviews.length;
  }

  const initialSlice = safeReviews.slice(0, 15);
  const remaining = Math.max(0, safeReviews.length - initialSlice.length);

  return `
    <!-- Google-Style 5-Star Reviews & Ratings Section -->
    <section class="info-card reviews-section" id="place-reviews-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-4)">
        <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:8px">
          <span style="color:#F59E0B">⭐</span> تقييمات وآراء الزوار (<span id="reviews-header-total-count">${totalReviews}</span>)
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

      <!-- Reviews Sentiment Filter Tabs & Star Filters -->
      <div class="reviews-sentiment-tabs" style="display:flex;align-items:center;gap:6px;margin-bottom:14px;flex-wrap:wrap">
        <button type="button" class="btn btn-sm btn-outline review-filter-tab active" data-sentiment="all" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);background:var(--primary-alpha);font-weight:700">
          الكل (${totalReviews})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="positive" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);color:var(--success);border-color:rgba(16,185,129,0.3)">
          👍 إيجابي 3-5 نجوم (${cPos})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="negative" style="font-size:12px;padding:4px 12px;border-radius:var(--radius-full);color:var(--danger);border-color:rgba(239,68,68,0.3)">
          👎 سلبي 1-2 نجوم (${cNeg})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="5" style="font-size:11.5px;padding:3px 10px;border-radius:var(--radius-full);border-color:rgba(245,158,11,0.4);color:#D97706">
          ★ 5 (${c5})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="4" style="font-size:11.5px;padding:3px 10px;border-radius:var(--radius-full);border-color:rgba(245,158,11,0.4);color:#D97706">
          ★ 4 (${c4})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="3" style="font-size:11.5px;padding:3px 10px;border-radius:var(--radius-full);border-color:rgba(245,158,11,0.4);color:#D97706">
          ★ 3 (${c3})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="2" style="font-size:11.5px;padding:3px 10px;border-radius:var(--radius-full);border-color:rgba(239,68,68,0.3);color:#DC2626">
          ★ 2 (${c2})
        </button>
        <button type="button" class="btn btn-sm btn-outline review-filter-tab" data-sentiment="1" style="font-size:11.5px;padding:3px 10px;border-radius:var(--radius-full);border-color:rgba(239,68,68,0.3);color:#DC2626">
          ★ 1 (${c1})
        </button>
      </div>

      <!-- Reviews List -->
      ${totalReviews === 0 ? `
        <div style="text-align:center;padding:2rem 1rem;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:8px">💬</div>
          <p style="font-size:13.5px;margin:0">كن أول من يكتب تقييماً وتجربة حقيقية عن هذا المكان!</p>
        </div>
      ` : (safeReviews.length === 0 ? `
        <div id="reviews-loading-indicator" style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted);font-size:13.5px">
          <div class="spinner" style="width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;margin:0 auto 10px;animation:spin .8s linear infinite"></div>
          جاري تحميل تقييمات الزوار (${totalReviews} تقييم)...
        </div>
        <div class="reviews-list" id="place-reviews-list" style="display:flex;flex-direction:column;gap:12px"></div>
      ` : `
        <div class="reviews-list" id="place-reviews-list" style="display:flex;flex-direction:column;gap:12px">
          ${initialSlice.map(r => renderSingleReviewCard(r, currentUser, { id: placeId, name: placeName }, placeName)).join('')}
        </div>

        <!-- Load More Button -->
        <div id="reviews-load-more-wrap" style="text-align:center;margin-top:16px;${remaining > 0 ? '' : 'display:none'}">
          <button type="button" id="btn-load-more-reviews" class="btn btn-outline" style="border-radius:var(--radius-full);padding:8px 24px;font-size:13px;font-weight:700">
            عرض المزيد من التقييمات (<span id="load-more-count">${remaining}</span> متبقي) ↓
          </button>
        </div>
      `)}
    </section>
  `;
}


function getDeterministicReviewerPoints(name = '', id = '') {
  const str = (name + id).trim() || 'مستخدم';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const mod = abs % 100;
  if (mod < 28) {
    return 80 + (abs % 400); // 🥉 مستكشف مبتدئ (80 - 479)
  } else if (mod < 62) {
    return 520 + (abs % 900); // 🥈 مساهم نشط (520 - 1419)
  } else if (mod < 84) {
    return 1550 + (abs % 1800); // 🥇 خبير المنزلة والمطرية (1550 - 3349)
  } else if (mod < 94) {
    return 3550 + (abs % 1350); // 💎 مساهم موثوق ذهبي (3550 - 4899)
  } else {
    return 5100 + (abs % 2200); // 👑 نخبة المنزلة VIP (5100 - 7299)
  }
}


if (typeof window !== 'undefined') {
  window.openPlaceDataReport = ({ placeId, placeName }) => {
    const modal = showModal({
      title: '🚩 الإبلاغ عن بيانات المكان',
      size: 'sm',
      content: '<div style="display:flex;flex-direction:column;gap:14px">' +
        '<div style="padding:12px 14px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border);font-size:13px;line-height:1.7">ساعدنا في إبقاء دليل المنزلة والمطرية دقيقًا ومحدثًا.<br><strong>' + escHtml(placeName || 'هذا المكان') + '</strong></div>' +
        '<label class="form-label" style="font-weight:800">ما المشكلة؟</label>' +
        '<select id="place-data-report-reason" class="form-select">' +
        '<option value="رقم الهاتف غير صحيح">رقم الهاتف غير صحيح</option><option value="المكان مغلق أو انتقل">المكان مغلق أو انتقل</option><option value="العنوان غير صحيح">العنوان غير صحيح</option><option value="التصنيف غير صحيح">التصنيف غير صحيح</option><option value="المعلومات قديمة">المعلومات قديمة</option><option value="المكان مكرر">المكان مكرر</option><option value="المكان غير موجود">المكان غير موجود</option><option value="أخرى">أخرى</option></select>' +
        '<label class="form-label" style="font-weight:800">تفاصيل إضافية <span style="font-weight:500;color:var(--text-muted)">(اختياري)</span></label>' +
        '<textarea id="place-data-report-details" class="form-textarea" rows="4" maxlength="1000" placeholder="اكتب التصحيح أو المعلومة التي تعرفها..."></textarea></div>',
      buttons: [
        { label:'🚩 إرسال البلاغ', type:'danger', closeOnClick:false, onClick:async () => {
          const reason=document.getElementById('place-data-report-reason')?.value || 'أخرى';
          const details=document.getElementById('place-data-report-details')?.value || '';
          try {
            const u=getCurrentUser();
            await reportPlaceData({placeId,reason,details,reporterName:u?.name||u?.displayName||'زائر'});
            toast.success('تم استلام البلاغ. شكرًا لمساعدتنا في تحديث الدليل! 🚩');
            modal.close();
          } catch(err) { toast.error(err.message || 'تعذر إرسال البلاغ'); }
        }},
        { label:'إلغاء', type:'ghost', closeOnClick:true }
      ]
    });
  };

  window.openSuggestPhoneNumber = ({ placeId, placeName }) => {
    const modal = showModal({
      title: '💡 اقتراح رقم هاتف للمكان',
      size: 'sm',
      content: `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="padding:12px 14px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border);font-size:13px;line-height:1.7">
            ساعد أهالي المنزلة والمطرية في الوصول لهذا المكان.<br>
            <strong>${escHtml(placeName || 'هذا المكان')}</strong>
          </div>
          <div>
            <label class="form-label" style="font-weight:800;display:block;margin-bottom:6px">رقم الهاتف أو الواتساب المقترح:</label>
            <input id="suggested-phone-input" type="tel" class="form-input" dir="ltr" placeholder="مثال: 01012345678 أو 050xxxxxxx" autocomplete="tel" style="width:100%" />
          </div>
          <div>
            <label class="form-label" style="font-weight:800;display:block;margin-bottom:6px">ملاحظة إضافية <span style="font-weight:500;color:var(--text-muted)">(اختياري)</span>:</label>
            <input id="suggested-phone-note" type="text" class="form-input" placeholder="مثال: رقم الدليفري، رقم المسؤول، فرع..." style="width:100%" />
          </div>
        </div>
      `,
      buttons: [
        {
          label: '📤 إرسال الاقتراح للمراجعة',
          type: 'primary',
          closeOnClick: false,
          onClick: async () => {
            const rawPhone = document.getElementById('suggested-phone-input')?.value?.trim() || '';
            const note = document.getElementById('suggested-phone-note')?.value?.trim() || '';
            if (!isValidPhoneNumber(rawPhone)) {
              toast.error('يرجى كتابة رقم هاتف مصري صحيح (موبايل 11 رقم أو أرضي)');
              return;
            }
            try {
              const u = getCurrentUser();
              const details = `رقم مقترح: ${rawPhone}${note ? ` | ملاحظة: ${note}` : ''}`;
              await reportPlaceData({
                placeId,
                reason: 'رقم الهاتف غير صحيح',
                details,
                reporterName: u?.name || u?.displayName || 'مستخدم متطوع'
              });
              toast.success('شكرًا لمساهمتك! تم إرسال الرقم المقترح للمراجعة والاعتماد. 💡');
              modal.close();
            } catch (err) {
              toast.error(err.message || 'تعذر إرسال الاقتراح');
            }
          }
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });
  };
}


if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const aptBtn = event.target.closest?.('#btn-book-appointment');
    if (aptBtn && window._currentActivePlace) {
      event.preventDefault();
      event.stopPropagation();
      openAppointmentModal(window._currentActivePlace);
      return;
    }

    const btn = event.target.closest?.('#btn-report-place-data');
    if (!btn || !window.openPlaceDataReport) return;
    event.preventDefault();
    event.stopPropagation();
    window.openPlaceDataReport({
      placeId: btn.getAttribute('data-place-id'),
      placeName: btn.getAttribute('data-place-name')
    });
  }, { passive: false });
}

function renderOffersSectionHTML(offers, place) {
  if (!offers || offers.length === 0) return '';
  return `
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
  `;
}

function renderProductsSectionHTML(products, place) {
  if (!products || products.length === 0) return '';
  return `
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
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4)">
        ${products.map(p => `
          <div class="product-card place-interactive-product-card" data-product-id="${escAttr(p.id)}" title="انقر لمشاهدة تفاصيل وطلب المنتج">
            <div class="product-card__image">
              ${p.imageUrl ? `<img src="${escAttr(p.imageUrl)}" alt="${escAttr(p.name)}" loading="lazy" />` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:var(--text-muted)">📦</div>`}
              ${p.isFeatured ? `<span class="product-card__featured">مميز ⭐</span>` : ''}
            </div>
            <div class="product-card__body">
              <h3 class="product-card__name" style="font-size:1.05rem;font-weight:700">${escHtml(p.name)}</h3>
              ${p.category ? `<div style="font-size:11px;color:var(--primary);margin-bottom:4px;font-weight:600">🏷️ ${escHtml(p.category)}</div>` : ''}
              ${p.description ? `<p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escHtml(p.description)}</p>` : ''}
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
                <span>🛍️ اضغط لتفاصيل وطلب المنتج</span>
                <span>↗</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function bindOffersEvents(offers, place) {
  document.querySelectorAll('.place-interactive-offer-card').forEach(card => {
    card.addEventListener('click', () => {
      const oId = card.getAttribute('data-offer-id');
      const targetOffer = (offers || []).find(o => (o.id || o._id) === oId);
      if (targetOffer) {
        openOfferFullDetailsModal(targetOffer, place);
      }
    });
  });
}

function bindProductsEvents(products, place) {
  document.querySelectorAll('.place-interactive-product-card').forEach(card => {
    card.addEventListener('click', () => {
      const pId = card.getAttribute('data-product-id');
      const targetProduct = (products || []).find(p => p.id === pId);
      if (targetProduct) {
        openProductFullDetailsModal(targetProduct, place);
      }
    });
  });
}

function bindReviewsEvents(place, currentUser, safeReviews, userReview, $container, slug) {
  // Login to review
  document.getElementById('btn-login-to-review')?.addEventListener('click', async () => {
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        renderPlacePage($container, { slug, user: loggedUser, initialPlace: place });
      }
    } catch (err) {
      toast.error('تعذر تسجيل الدخول: ' + err.message);
    }
  });

  // Open Add / Edit Review Modal
  document.getElementById('btn-open-review-modal')?.addEventListener('click', () => {
    openReviewModal(place, currentUser, userReview, () => {
      renderPlacePage($container, { slug, user: currentUser, initialPlace: place });
    });
  });

  // Event delegation for edit/delete review buttons inside reviewsList
  const reviewsList = document.getElementById('place-reviews-list');
  if (reviewsList) {
    reviewsList.onclick = async (event) => {
      const editBtn = event.target.closest('.btn-edit-review');
      if (editBtn) {
        const rId = editBtn.getAttribute('data-rid');
        const targetReview = safeReviews.find(r => r.id === rId);
        if (targetReview) {
          openReviewModal(place, currentUser, targetReview, () => {
            renderPlacePage($container, { slug, user: currentUser, initialPlace: place });
          });
        }
        return;
      }

      const delBtn = event.target.closest('.btn-delete-review');
      if (delBtn) {
        const rId = delBtn.getAttribute('data-rid');
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
            renderPlacePage($container, { slug, user: currentUser, initialPlace: place });
          } catch (err) {
            toast.error(err.message || 'فشل حذف التقييم');
          }
        }
        return;
      }
    };
  }

  // Setup Reviews Sentiment Filter Tabs and pagination
  setupReviewsSentimentFilter(place, currentUser, safeReviews, userReview, $container, slug);

  // ── Universal Realtime Synchronization Listener (Live Updates Without Refresh) ──
  const realtimeHandler = async (event) => {
    try {
      const type = event.detail?.type;
      const payloadPlace = event.detail?.payload?.place;
      const targetSlug = cleanSlug;
      const targetId = String(place?.id || place?._key || '');

      const isMatchingPlace = payloadPlace && (
        String(payloadPlace.slug || '').toLowerCase() === targetSlug ||
        String(payloadPlace.id || '') === targetId
      );

      if (isMatchingPlace || type === 'DATA_VERSION_CHANGED') {
        const freshPlace = await getPlaceBySlug(targetSlug || targetId);
        if (freshPlace) {
          // 1. Update Availability badge reactively
          const availBadgeContainer = document.getElementById('place-availability-badge-container');
          if (availBadgeContainer) {
            availBadgeContainer.innerHTML = renderAvailabilityBadge(freshPlace.availabilityStatus || freshPlace.availability_status);
          }
          // 2. Update verified badge if changed
          if (freshPlace.isVerified !== place.isVerified) {
            const verifiedBadgeEl = document.querySelector('.place-verified-badge');
            if (verifiedBadgeEl) {
              verifiedBadgeEl.style.display = freshPlace.isVerified ? 'inline-flex' : 'none';
            }
          }
        }
      }
    } catch (_) {}
  };

  if (window._currentPlaceRealtimeHandler) {
    window.removeEventListener('manzala:realtime_sync', window._currentPlaceRealtimeHandler);
  }
  window._currentPlaceRealtimeHandler = realtimeHandler;
  window.addEventListener('manzala:realtime_sync', realtimeHandler);
}
