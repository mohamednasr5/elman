import { buildContextualWhatsAppLink } from '../../services/whatsapp.service.js';
import { isEnglish, t, localizeUrl } from '../../core/i18n.js';
import { translateCategory, toArabicCategory } from '../../utils/category-i18n.js';
/**
 * المنزلة وناسها — Place Detail Page
 * Full production place view with cover, logo, verified badge, working hours,
 * contact buttons, Google Maps, offers, products, photo gallery, and verification request.
 */

import { WORKER_URL } from '../../core/firebase.js';
import { getPlace, getPlaceBySlug, getCategories, getCached, getPublishedPlaces, getPlaceOffers, getPlaceProducts, getSettings, trackPlaceView, trackPlaceStat, getPlaceReviews, addPlaceReview, updatePlaceReview, deletePlaceReview, isFollowingPlace, followPlace, unfollowPlace, isPlaceBanned, reportPlaceReview, reportPlaceData, submitPhoneSuggestion, dbUpdate, subscribeToOwnerPresence, HAMMAD_PLACE_SLUG, getPlaceBranches, updatePlaceAvailability } from '../../core/db.js?v=a58f9ed6';
import { getCurrentUser, signInWithGoogle, isAdmin, onAuthStateChange, getIdToken } from '../../core/auth.js';
import { api } from '../../core/api.js';
import { getStoredCoinsBalance, fetchLiveCoinsBalance, setStoredCoinsBalance } from '../../core/coins-sync.js';
import { setMeta, setPlaceSchema, setBreadcrumbSchema } from '../../utils/seo.js';
import { renderVerifiedBadge, renderDeliveryBadge, renderSponsoredBadge, renderOnlineBadge } from '../components/VerifiedBadge.js';
import { formatWorkingHours, isPlaceOpen, formatDateRange, daysUntil, formatDate } from '../../utils/date.js';
import { formatPrice, calcDiscount } from '../../utils/arabic.js';
import { showModal, showConfirm } from '../components/Modal.js';
import { submitVerificationRequest } from '../../services/places.service.js?v=a58f9ed6';
import { toast } from '../components/Toast.js';
import { openPlaceProfileCardModal } from '../components/PlaceProfileCardModal.js';
import { openStorefrontQrModal } from '../components/StorefrontQrModal.js';
import { openCertificateOfAppreciationModal } from '../components/CertificateOfAppreciationModal.js';
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
import { renderMarketWidgetsHTML, bindMarketWidgetsEvents } from '../components/MarketWidgets.js';
import { renderPaymentBadges } from '../../utils/payments.js';

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

/* ═══════════════════════════════════════════════════════════════
   3D Tactile Graphic Generators (High-Fidelity Vector System)
   ═══════════════════════════════════════════════════════════════ */
function getWhatsApp3dSvg() {
  return `
    <svg class="p3d-dish-svg" viewBox="0 0 54 54" width="46" height="46" aria-hidden="true">
      <defs>
        <radialGradient id="p3dWaDish" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="55%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#047857"/>
        </radialGradient>
      </defs>
      <circle cx="27" cy="27" r="24" fill="url(#p3dWaDish)"/>
      <circle cx="27" cy="27" r="22.5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
      <path fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.25))" d="M27 12c-7.7 0-14 6.3-14 14 0 2.6.7 5.1 2 7.3L13 41l8-2.1c2.1 1.2 4.5 1.8 6.9 1.8 7.7 0 14-6.3 14-14s-6.3-14-14-14zm7.2 19.8c-.3.8-1.7 1.6-2.4 1.7-.6.1-1.4.2-4.5-1.1-3.7-1.5-6-5.3-6.2-5.5-.2-.3-1.6-2.1-1.6-4.1s1-2.9 1.4-3.3c.4-.4.8-.5 1.1-.5.3 0 .5 0 .8.1.3.1.7.1.9.7.3.7 1 2.5 1.1 2.7.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.6.6-.2.2-.4.4-.2.8.2.4.9 1.6 2 2.6 1.4 1.2 2.6 1.6 3 1.8.4.2.6.1.8-.1.3-.3 1.1-1.3 1.4-1.7.3-.4.6-.3 1-.2.4.2 2.5 1.2 2.9 1.4.4.2.7.3.8.5.1.2.1 1.2-.2 2z"/>
    </svg>
  `;
}

function getPhone3dSvg() {
  return `
    <svg class="p3d-dish-svg" viewBox="0 0 54 54" width="46" height="46" aria-hidden="true">
      <defs>
        <radialGradient id="p3dCallDish" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="55%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </radialGradient>
        <linearGradient id="p3dPhoneRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff7b7b"/>
          <stop offset="45%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#b91c1c"/>
        </linearGradient>
      </defs>
      <circle cx="27" cy="27" r="24" fill="url(#p3dCallDish)"/>
      <circle cx="27" cy="27" r="22.5" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
      <g transform="translate(14, 13) scale(1.15)">
        <path fill="url(#p3dPhoneRed)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))" d="M19.5 15.5c-1.2 0-2.4-.2-3.5-.6-.4-.1-.8 0-1.1.3l-2.2 2.2c-2.8-1.4-5.1-3.7-6.5-6.5l2.2-2.2c.3-.3.4-.7.3-1.1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H3.6c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c-.1-.6-.5-1.1-1.1-1.1z"/>
        <path fill="rgba(255,255,255,0.4)" d="M5 4.5c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5v1.5c0 .3-.2.5-.5.5h-2c-.3 0-.5-.2-.5-.5v-1.5z"/>
      </g>
    </svg>
  `;
}

function getDownload3dSvg() {
  return `
    <svg class="p3d-tool-svg" viewBox="0 0 68 68" width="56" height="56" aria-hidden="true">
      <defs>
        <linearGradient id="p3dDlPed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="50%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="p3dDlCard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f0f9ff"/>
        </linearGradient>
      </defs>
      <!-- 3D Pedestal Dish -->
      <ellipse cx="34" cy="54" rx="26" ry="9" fill="url(#p3dDlPed)" filter="drop-shadow(0 3px 6px rgba(2,132,199,0.4))"/>
      <ellipse cx="34" cy="51" rx="24.5" ry="7.5" fill="#e0f2fe"/>
      <!-- 3D Profile ID Card on top -->
      <g transform="translate(17, 15) rotate(-2 17 14)" filter="drop-shadow(0 5px 8px rgba(3,105,161,0.45))">
        <rect x="0" y="0" width="34" height="25" rx="4.5" fill="url(#p3dDlCard)" stroke="#38bdf8" stroke-width="1.2"/>
        <path d="M0 4.5 Q0 0 4.5 0 L29.5 0 Q34 0 34 4.5 L34 7 L0 7 Z" fill="#0284c7"/>
        <rect x="3.5" y="9.5" width="9" height="11.5" rx="2" fill="#e2e8f0"/>
        <circle cx="8" cy="13.2" r="2.2" fill="#64748b"/>
        <path d="M5 19.5 C5 17 11 17 11 19.5 Z" fill="#64748b"/>
        <rect x="15" y="10.5" width="15" height="2.2" rx="1" fill="#0284c7"/>
        <rect x="15" y="14.5" width="12" height="1.8" rx="0.9" fill="#94a3b8"/>
        <rect x="15" y="18" width="14" height="1.8" rx="0.9" fill="#cbd5e1"/>
      </g>
    </svg>
  `;
}

function getQr3dSvg() {
  return `
    <svg class="p3d-tool-svg" viewBox="0 0 68 68" width="56" height="56" aria-hidden="true">
      <defs>
        <linearGradient id="p3dQrPed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#faf5ff"/>
          <stop offset="50%" stop-color="#e9d5ff"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
        <linearGradient id="p3dQrMachine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a855f7"/>
          <stop offset="60%" stop-color="#7e22ce"/>
          <stop offset="100%" stop-color="#581c87"/>
        </linearGradient>
      </defs>
      <!-- 3D Pedestal Dish -->
      <ellipse cx="34" cy="54" rx="26" ry="9" fill="url(#p3dQrPed)" filter="drop-shadow(0 3px 6px rgba(126,34,206,0.3))"/>
      <ellipse cx="34" cy="51" rx="24.5" ry="7.5" fill="#faf5ff"/>
      <!-- Machine Connector -->
      <path d="M28 44 L31 52 L37 52 L40 44 Z" fill="#581c87"/>
      <!-- 3D Terminal Body -->
      <rect x="20" y="22" width="28" height="23" rx="5.5" fill="url(#p3dQrMachine)" filter="drop-shadow(0 4px 6px rgba(88,28,135,0.35))"/>
      <rect x="23" y="18" width="22" height="6" rx="2.5" fill="#4c1d95"/>
      <!-- White Paper with QR -->
      <g filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))">
        <rect x="25" y="11" width="18" height="21" rx="2.5" fill="#ffffff" stroke="#e9d5ff" stroke-width="0.8"/>
        <rect x="27.5" y="13.5" width="4" height="4" fill="#1e1b4b"/>
        <rect x="36.5" y="13.5" width="4" height="4" fill="#1e1b4b"/>
        <rect x="27.5" y="22.5" width="4" height="4" fill="#1e1b4b"/>
        <rect x="34.5" y="20.5" width="2.2" height="2.2" fill="#1e1b4b"/>
        <rect x="37.5" y="23.5" width="3" height="3" fill="#1e1b4b"/>
        <rect x="33.5" y="25" width="2.2" height="2.2" fill="#1e1b4b"/>
      </g>
    </svg>
  `;
}

function getCert3dSvg() {
  return `
    <svg class="p3d-tool-svg" viewBox="0 0 68 68" width="56" height="56" aria-hidden="true">
      <defs>
        <linearGradient id="p3dCertPed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="50%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
        <linearGradient id="p3dCertGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
        <linearGradient id="p3dCertRib" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="100%" stop-color="#dc2626"/>
        </linearGradient>
      </defs>
      <!-- 3D Pedestal Dish -->
      <ellipse cx="34" cy="54" rx="26" ry="9" fill="url(#p3dCertPed)" filter="drop-shadow(0 3px 6px rgba(217,119,6,0.3))"/>
      <ellipse cx="34" cy="51" rx="24.5" ry="7.5" fill="#fffdf5"/>
      <!-- Ribbon Tails -->
      <path fill="url(#p3dCertRib)" d="M26 38 L20 54 L27 51 L31 54 L30 38 Z" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.18))"/>
      <path fill="url(#p3dCertRib)" d="M38 38 L37 54 L41 51 L48 54 L42 38 Z" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.18))"/>
      <!-- Gold Medal Coin -->
      <circle cx="34" cy="27" r="17.5" fill="url(#p3dCertGold)" filter="drop-shadow(0 4px 6px rgba(180,83,9,0.35))"/>
      <circle cx="34" cy="27" r="14.5" fill="none" stroke="#fef08a" stroke-width="1.2" stroke-dasharray="2 1"/>
      <!-- Star in center -->
      <path fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.25))" d="M34 17 L36.8 23.6 L44 24.2 L38.6 28.8 L40.2 35.8 L34 32.1 L27.8 35.8 L29.4 28.8 L24 24.2 L31.2 23.6 Z"/>
    </svg>
  `;
}

export function normalizePlace(p) {
  if (!p || typeof p !== 'object') return p;
  const logo = p.logoUrl || p.logo_url || p.logo || null;
  const cover = p.coverImageUrl || p.cover_image_url || p.cover || null;
  let stats = p.stats || {};
  if (typeof p.stats_json === 'string') {
    try { stats = JSON.parse(p.stats_json); } catch (_) {}
  } else if (p.stats_json && typeof p.stats_json === 'object') {
    stats = p.stats_json;
  }
  const reviewCount = Number(p.reviewCount ?? p.review_count ?? p.reviewsCount ?? stats.reviewCount ?? stats.reviewsCount ?? 0);
  const rating = Number(p.rating ?? stats.rating ?? 0);

  return {
    ...p,
    logoUrl: logo,
    logo_url: logo,
    coverImageUrl: cover,
    cover_image_url: cover,
    reviewCount,
    review_count: reviewCount,
    reviewsCount: reviewCount,
    rating,
    stats: {
      ...stats,
      reviewCount,
      reviewsCount: reviewCount,
      rating
    },
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

    const placeId = place.id || place._key;
    const isHammad = (place.slug === HAMMAD_PLACE_SLUG || place.name?.includes('محمد حماد'));
    const urlParams = new URLSearchParams(window.location.search);
    const isCertPreview = urlParams.has('cert') || urlParams.has('certificate');

    const currentUser = getCurrentUser() || user;
    const isOwner = Boolean(
      isCertPreview ||
      isHammad ||
      (currentUser && (
        (place.ownerId && currentUser.uid === place.ownerId) ||
        (place.userId && currentUser.uid === place.userId) ||
        (place.ownerUid && currentUser.uid === place.ownerUid) ||
        (place.email && currentUser.email && place.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        isAdmin(currentUser)
      ))
    );
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

    // Fast categories retrieval (cached in IDB / memory - non-blocking for instant render)
    let categories = getCached('categories_all') || [];
    const matchCategory = (cats, targetId) => {
      if (!cats?.length || !targetId) return null;
      const tid = String(targetId).trim().toLowerCase();
      return cats.find(c => {
        const cKey = String(c._key || c.id || '').trim().toLowerCase();
        const cSlug = String(c.slug || '').trim().toLowerCase();
        return cKey === tid || cSlug === tid || cKey.replace(/-/g, ' ') === tid.replace(/-/g, ' ');
      }) || null;
    };

    let category = matchCategory(categories, place.categoryId);
    let catInfo = resolvePlaceCategoryInfo(place, category);
    const isAtm = isAtmPlace(place, category);

    // Asynchronously resolve & update category metadata if not present in instant cache
    if (!category) {
      getCategories().then(cats => {
        if (!cats?.length) return;
        const freshCat = matchCategory(cats, place.categoryId);
        if (freshCat) {
          category = freshCat;
          catInfo = resolvePlaceCategoryInfo(place, freshCat);
          const badgeEl = $container.querySelector('.place-badge--category');
          if (badgeEl && catInfo.name) {
            badgeEl.innerHTML = `${catInfo.icon ? `<span style="margin-left:4px">${catInfo.icon}</span>` : ''}${catInfo.name}`;
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
      } else {
        try {
          const rawLocal = localStorage.getItem(`reviews_${placeId}`) || (place.slug ? localStorage.getItem(`reviews_${place.slug}`) : null);
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed) && parsed.length > 0) safeReviews = parsed;
          }
        } catch (_) {}
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

    const hasValidPhone = !isAtm && isValidPhoneNumber(place.phone) && !place.phoneUnavailable;
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
        url: placeCanonical,
        geo: {
          area: placeArea,
          latitude: place.latitude || place.location?.lat,
          longitude: place.longitude || place.location?.lng,
          placename: `${placeArea}، الدقهلية، مصر`
        },
        alternates: {
          ar: `https://dalilmanzala.com/place/${encodeURIComponent(canonicalSlug)}`,
          en: `https://dalilmanzala.com/en/place/${encodeURIComponent(canonicalSlug)}`,
          xDefault: `https://dalilmanzala.com/place/${encodeURIComponent(canonicalSlug)}`
        }
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
    const placeVersion = place.updatedAt || place.updated_at || null;
    const placeCover = getOptimizedImageUrl(rawCover, IMAGE_SIZES.MEDIUM, placeVersion);
    const placeLogo = getOptimizedImageUrl(rawLogo, IMAGE_SIZES.MEDIUM, placeVersion);

    // Resolve Smart Google Map info (supports coords, short links, Plus codes, and addresses)
    const mapInfo = resolveMapEmbedInfo(place);
    const docInfo = resolveDoctorSpecialty(place, category);
    const profInfo = resolvePlaceProfession(place);
    const craftCatSvg = getCategorySvg(catInfo?.slug || place.categoryId || '', 18);

    // Render Full Page
    window._currentActivePlace = place;
    $container.innerHTML = `
      <style id="cert-btn-pulse-style">
        @keyframes certBtnPulseAttention {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6), 0 2px 6px rgba(217, 119, 6, 0.2);
          }
          50% {
            transform: scale(1.028);
            box-shadow: 0 0 0 10px rgba(245, 158, 11, 0), 0 4px 16px rgba(245, 158, 11, 0.35);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0), 0 2px 6px rgba(217, 119, 6, 0.2);
          }
        }
        .btn-appreciation-certificate-pulse {
          animation: certBtnPulseAttention 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
          background: linear-gradient(135deg, rgba(245,158,11,0.16), rgba(217,119,6,0.25)) !important;
          border: 1.5px solid #F59E0B !important;
          color: #B45309 !important;
        }
        .btn-appreciation-certificate-pulse:hover {
          transform: scale(1.04) !important;
          background: linear-gradient(135deg, rgba(245,158,11,0.28), rgba(217,119,6,0.36)) !important;
        }
      </style>
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
          ${renderMarketWidgetsHTML()}
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
          ? `<img src="${escAttr(placeCover)}" alt="${escAttr(place.name)}" class="place-hero__cover" fetchpriority="high" decoding="async" onerror="if(this.dataset.fallbackApplied!=='1'){this.dataset.fallbackApplied='1';this.src='/assets/images/default-cover.jpg';}" />`
          : `<div class="place-hero__cover-placeholder">${catInfo.icon || '🏪'}</div>`
        }
        <div class="place-hero__overlay"></div>
      </section>

      <!-- Main Layout -->
      <div class="place-layout container">
        <div class="place-main-col">
          
          <!-- Place Header Info Card (Restructured strictly matching user wireframe) -->
          <div class="place-header-card animate-fade-in-up">
            <!-- Row 1: Logo + Place Name + Verified Badge + Online Status -->
            <div class="place-card-row-identity">
              <div class="place-card-logo">
                ${placeLogo
                  ? `<img src="${escAttr(placeLogo)}" alt="${escAttr(place.name)}" decoding="async" onerror="if(this.dataset.fallbackApplied!=='1'){this.dataset.fallbackApplied='1';this.src='/assets/images/default-logo.jpg';}else{this.onerror=null;this.src='/icons/icon-192x192.png';}" />`
                  : `<div class="place-card-logo__placeholder">${craftCatSvg || catInfo.icon || '🏪'}</div>`
                }
              </div>
              <div class="place-card-identity-text">
                <div class="place-card-name-wrap">
                  <h1 class="place-card-name">${escHtml(placeDisplayName)}</h1>
                  ${place.isVerified ? renderVerifiedBadge() : ''}
                  ${(!isAtm && (place.isSponsored || place.isFeatured || place.isPromoted) && (!place.sponsoredUntil || place.sponsoredUntil > Date.now())) ? renderSponsoredBadge() : ''}
                  ${(!isAtm && (place.deliveryType || place.categoryId === 'delivery' || place.categoryId?.includes('delivery') || /توكتوك|تاكسي|شانجي|اتوبيس|وصلي/i.test(place.name || '')) && !/صيدلية|مطعم|كشري|حلواني|سوبر\s*ماركت/i.test(place.name || '')) ? renderDeliveryBadge(place) : ''}
                  <span id="place-owner-online-container" class="place-owner-online-slot"></span>
                </div>
              </div>
            </div>

            <!-- Row 2: Category, Rating Inline, Calligraphy Banner & Profile Completeness -->
            <div class="place-card-row-meta">
              <div class="place-card-meta-tags">
                <a href="category.html?slug=${encodeURIComponent(catInfo?.slug || place.categoryId || 'other')}" class="place-category-tag">
                  <span style="color:#0284c7;font-weight:900;font-size:14px">✚</span>
                  <span>${escHtml(catInfo?.name || 'تصنيف')}</span>
                </a>
                ${!isAtm ? `
                  <div id="place-header-rating-badge" class="place-rating-badge-inline" role="button" tabindex="0" title="اضغط للانتقال إلى تقييمات ومراجعات المكان" aria-label="تقييم المكان، اضغط للانتقال إلى التقييمات" style="cursor:pointer">
                    ${totalReviews > 0 ? `
                      <span class="rating-star">★</span>
                      <span class="rating-val">${avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
                      <span class="rating-sub">(${totalReviews} تقييم)</span>
                    ` : `
                      <span class="rating-star">★</span>
                      <span class="rating-val">5.0</span>
                      <span class="rating-sub">(0 تقييم)</span>
                    `}
                  </div>
                ` : ''}
                ${profInfo ? `
                  <a href="category.html?slug=${encodeURIComponent(profInfo.categorySlug || catInfo?.slug || 'crafts')}&prof=${encodeURIComponent(profInfo.id || '')}" class="place-profession-badge" style="text-decoration:none;padding:4px 12px;font-size:12.5px;display:inline-flex;align-items:center;gap:6px" title="تصفح جميع فنيي ${escHtml(profInfo.name || '')}">
                    ${getProfessionSvg(profInfo.id, { size: 16, color: profInfo.categoryColor || 'currentColor' })}
                    <span>${escHtml(profInfo.name || '')}</span>
                  </a>
                ` : ''}
                ${(isEn && place.nameEn) ? `<span class="place-header-en-name" style="color:var(--text-muted);font-size:var(--font-size-sm);direction:ltr">(${escHtml(place.nameEn)})</span>` : ''}
                ${place.medicalSpecialty ? `
                  <span class="badge-medical-specialty">
                    🩺 تخصص: ${escHtml(place.medicalSpecialty)}
                  </span>
                ` : ''}
              </div>

              <div class="place-card-meta-left">
                ${trustScore ? `
                  <span class="place-trust-mini ${trustClass}" title="مؤشر نسبة استيفاء حقول ومعلومات هذا الملف">
                    <span class="trust-check-badge">✓</span>
                    <span>%${trustScore}</span>
                    <span>اكتمال الملف</span>
                    <span style="font-size:13px">📋</span>
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Row 3: Full Address (Spans cleanly without crowding) -->
            <div class="place-card-row-address-rating">
              <div class="place-address">
                <span>${escHtml(place.address || place.area || 'مدينة المنزلة')}</span>
                <span class="addr-pin">📍</span>
              </div>
            </div>

            <!-- Row 4: Primary Contact Actions (Call / Suggest Phone + WhatsApp) -->
            <div class="place-card-row-contact">
              ${hasValidPhone ? `
                <a href="tel:${cleanPhone(place.phone)}" class="place-btn-contact place-btn-contact--call" onclick="trackStat('${escAttr(placeId)}', 'phoneClicks')" title="اتصال هاتفي">
                  <div class="place-btn-contact__icon">
                    ${getPhone3dSvg()}
                  </div>
                  <div class="place-btn-contact__text">
                    <span class="place-btn-contact__label">اتصال هاتفي</span>
                    <span class="place-btn-contact__val" dir="ltr">${escHtml(place.phone)}</span>
                  </div>
                  <div class="place-btn-contact__arrow">‹</div>
                </a>
              ` : `
                <button type="button" class="place-btn-contact place-btn-contact--suggest" onclick="window.openSuggestPhoneNumber({ placeId: '${escAttr(placeId)}', placeName: '${escAttr(place.name || '')}' })" title="اقتراح رقم هاتف لهذا المكان">
                  <div class="place-btn-contact__icon">✍️</div>
                  <div class="place-btn-contact__text">
                    <span class="place-btn-contact__label">هل تعرف رقم المكان؟</span>
                    <span class="place-btn-contact__sub">اضغط هنا واكتبه فوراً</span>
                  </div>
                  <div class="place-btn-contact__arrow">‹</div>
                </button>
              `}

              ${hasValidWhatsapp ? `
                <a href="${buildContextualWhatsAppLink(place.whatsapp, { source: 'place_page', placeName: place.name, placeSlug: place.slug })}" 
                   target="_blank" 
                   rel="noopener" 
                   class="place-btn-contact place-btn-contact--wa" 
                   onclick="trackStat('${escAttr(placeId)}', 'whatsappClicks')" 
                   title="محادثة واتساب">
                  <div class="place-btn-contact__icon">
                    ${getWhatsApp3dSvg()}
                  </div>
                  <div class="place-btn-contact__text">
                    <span class="place-btn-contact__label">التواصل عبر الواتساب</span>
                    <span class="place-btn-contact__sub">شات وتواصل فوري</span>
                  </div>
                  <div class="place-btn-contact__arrow">›</div>
                </a>
              ` : ((!isAtm && (place.allowAppointments === true || (place.allowAppointments !== false && (place.categoryId === 'doctor' || place.categoryId?.includes('clinic') || place.categoryId === 'health')))) ? `
                <button type="button" class="place-btn-contact place-btn-contact--appointment" id="btn-book-appointment" title="طلب حجز موعد / استشارة">
                  <div class="place-btn-contact__icon">📅</div>
                  <div class="place-btn-contact__text">
                    <span class="place-btn-contact__label">حجز موعد</span>
                    <span class="place-btn-contact__sub">طلب مسبق واستشارة</span>
                  </div>
                  <div class="place-btn-contact__arrow">›</div>
                </button>
              ` : `
                <button type="button" class="place-btn-contact place-btn-contact--share btn-share-place-trigger" title="مشاركة بطاقة هذا المكان">
                  <div class="place-btn-contact__icon">📤</div>
                  <div class="place-btn-contact__text">
                    <span class="place-btn-contact__label">مشاركة المكان</span>
                    <span class="place-btn-contact__sub">إرسال للأصدقاء</span>
                  </div>
                  <div class="place-btn-contact__arrow">›</div>
                </button>
              `)}
            </div>

            <!-- Row 5: Secondary Trio Cards (3D Chic Cards with click animation) -->
            <div class="place-card-row-tools-trio">
              <!-- Card 1: Download Profile Card (Sapphire Tech 3D) -->
              <button type="button" class="place-tool-card place-tool-card--download btn-download-profile-trigger" id="btn-download-profile-card" data-pid="${escAttr(placeId)}" title="تحميل البطاقة التعريفية لمشاركتها كصورة">
                <div class="place-tool-card__icon-box">
                  ${getDownload3dSvg()}
                </div>
                <div class="place-tool-card__body">
                  <div class="place-tool-card__title">تحميل البطاقة</div>
                  <div class="place-tool-card__hint">صورة جاهزة للمشاركة</div>
                </div>
                <div class="place-tool-card__arrow">›</div>
              </button>

              <!-- Card 2: Storefront QR Poster (Royal Purple 3D) -->
              <button type="button" class="place-tool-card place-tool-card--qr btn-open-storefront-qr" id="btn-open-storefront-qr" title="طباعة لوحة QR ذكية لواجهة المحل">
                <div class="place-tool-card__icon-box">
                  ${getQr3dSvg()}
                </div>
                <div class="place-tool-card__body">
                  <div class="place-tool-card__title">لوحة QR المحل</div>
                  <div class="place-tool-card__hint">لطباعتها على الواجهة</div>
                </div>
                <div class="place-tool-card__arrow">›</div>
              </button>

              <!-- Card 3: Certificate of Appreciation (Prestige Gold 3D) -->
              <button type="button" class="place-tool-card place-tool-card--cert btn-appreciation-certificate" id="btn-appreciation-certificate-header" title="عرض وتحميل وطباعة شهادة التقدير الرسمية لنشاطك (A4)">
                <div class="place-tool-card__icon-box">
                  ${getCert3dSvg()}
                </div>
                <div class="place-tool-card__body">
                  <div class="place-tool-card__title">شهادة تقدير</div>
                  <div class="place-tool-card__hint">شهادة رسمية A4</div>
                </div>
                <div class="place-tool-card__arrow">›</div>
              </button>
            </div>

            <!-- Row 6: Management & Availability Status & Quick Actions -->
            <div class="place-card-row-bottom">
              <div class="place-card-row-bottom__right">
                ${(isOwner || currentUser?.isAdmin) ? `
                  <select id="quick-availability-select" class="place-quick-availability-select" title="تعديل حالة التوافر الفوري">
                    <option value="available" ${(place.availabilityStatus || place.availability_status) === 'available' ? 'selected' : ''}>🟢 متاح الآن</option>
                    <option value="busy" ${(place.availabilityStatus || place.availability_status) === 'busy' ? 'selected' : ''}>🟡 مشغول حالياً</option>
                    <option value="unavailable" ${(place.availabilityStatus || place.availability_status) === 'unavailable' ? 'selected' : ''}>🔴 غير متاح حالياً</option>
                  </select>
                ` : `
                  <div id="place-availability-badge-container">
                    ${renderAvailabilityBadge(place.availabilityStatus || place.availability_status)}
                  </div>
                `}

                ${isOwner ? `
                  <a href="dashboard.html?section=places&id=${escAttr(placeId)}" class="place-pill-btn place-pill-btn--manage" title="لوحة تحكم وإدارة المكان">
                    <span style="font-size:14px">⚙️</span>
                    <span>إدارة وتعديل المكان</span>
                  </a>
                ` : `
                  <button type="button" class="place-pill-btn place-pill-btn--claim" id="btn-claim-place" title="المطالبة بملكية هذا النشاط التجاري">
                    <span>🛡️</span>
                    <span>أنا صاحب هذا المكان</span>
                  </button>
                `}
              </div>

              <div class="place-card-row-bottom__left">
                <button type="button" class="place-pill-btn btn-share-place-trigger" title="مشاركة هذا المكان">
                  <span style="font-size:14px">👥</span>
                  <span>مشاركة</span>
                </button>

                <button type="button" class="place-pill-btn btn-follow-place-trigger ${isFollowing ? 'following' : ''}" id="btn-follow-place" data-pid="${escAttr(placeId)}" title="متابعة المكان ومشاهدة أحدث عروضه">
                  <span class="follow-icon" style="color:#eab308;font-size:14px">${isFollowing ? '✓' : '🔔'}</span>
                  <span class="follow-label">${isFollowing ? 'متابع' : 'متابعة'}</span>
                  ${place.followersCount ? `<span class="follow-count-badge" style="opacity:0.8;font-size:11px">(${place.followersCount})</span>` : ''}
                </button>
              </div>
            </div>

            ${(!isOwner && !currentUser?.isAdmin) ? `
              <div style="text-align:center;margin-top:10px">
                <button type="button" class="btn-report-discreet" id="btn-report-place-data" data-place-id="${escAttr(placeId)}" data-place-name="${escAttr(place.name || '')}" style="background:none;border:none;color:var(--text-muted);font-size:11.5px;cursor:pointer;text-decoration:underline;display:inline-flex;align-items:center;gap:4px">
                  <span>🚩</span> <span>هل لاحظت خطأ أو ترغب في تعديل بيانات هذا النشاط؟</span>
                </button>
              </div>
            ` : ''}
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
                <button type="button" class="btn btn-sm btn-primary" id="btn-request-verification">
                  <span>🛡️</span> ${isEn ? 'Verify Now (5,000 Gold)' : 'وثّق مكانك الآن (5,000 ذهبية)'}
                </button>
                ${!(place.isSponsored || place.is_sponsored) ? `
                  <button type="button" class="btn btn-sm btn-action-promote-place" id="btn-request-promote-place" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;border:none;font-weight:800;border-radius:var(--radius-sm);display:inline-flex;align-items:center;gap:4px">
                    <span>🌟</span> إعلان مميز (500 ذهبية)
                  </button>
                ` : ''}
                <button class="btn btn-sm btn-outline" id="btn-claim-place">
                  ${isEn ? 'I own this business' : 'أنا صاحب هذا المكان'}
                </button>
              </div>
            </div>
          ` : `
            ${!(place.isSponsored || place.is_sponsored) ? `
              <div class="unverified-notice animate-fade-in" style="background:linear-gradient(135deg,rgba(245,166,35,0.08),rgba(217,119,6,0.12));border-color:rgba(245,166,35,0.35)">
                <div class="unverified-notice__icon">🌟</div>
                <div class="unverified-notice__body">
                  <div class="unverified-notice__title" style="color:#92400E">
                    ضاعف وصول وزيارات (${escHtml(place.name || 'المكان')}) الآن
                  </div>
                  <p class="unverified-notice__text" style="color:#78350F">
                    احجز صدارة نتائج البحث والتصنيف كإعلان مميز لمدة شهر كامل لجذب آلاف العملاء والاتصالات المباشرة.
                  </p>
                </div>
                <div class="unverified-notice__actions">
                  <button type="button" class="btn btn-sm btn-action-promote-place" id="btn-request-promote-place" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;border:none;font-weight:900;padding:8px 18px;border-radius:10px;box-shadow:0 4px 12px rgba(217,119,6,0.3);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                    <span>🌟</span> تفعيل إعلان مميز (500 ذهبية)
                  </button>
                </div>
              </div>
            ` : ''}
          `}

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

          <!-- Accepted Payment Methods 3D Badges (GEO / SEO & UX) -->
          ${!isAtm ? renderPaymentBadges(place.paymentMethods || place.payment_methods || place.stats?.paymentMethods, { isEn }) : ''}

          <!-- Active Offers Slot -->
          <div id="place-offers-slot"></div>

          <!-- Products Slot (Verified Places) -->
          <div id="place-products-slot"></div>

          <!-- Activity Trust Breakdown Card -->
          ${!isAtm ? renderTrustCard(place) : ''}

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

          <!-- Google-Style 5-Star Reviews Slot (Directly below Place Card as requested!) -->
          <div id="place-reviews-slot">
            ${!isAtm ? renderReviewsSectionHTML({ placeId, placeName: place.name, safeReviews, totalReviews, currentUser, userReview, isHammad }) : ''}
          </div>

        </div>

        <!-- Sidebar Col -->
        <div class="place-sidebar-col">
          
          <!-- Spotlight: شخصية / مكان اليوم الموثق -->
          <div class="spotlight-card" id="spotlight-place-container">
            <div class="skeleton" style="height:170px;border-radius:12px"></div>
          </div>

          <!-- Working Hours Card (Hidden for ATMs) -->
          ${!isAtm ? renderWorkingHoursSectionHTML({ isOpen, workingHoursList }) : ''}

          <!-- Job Board Sidebar Cards (طالب عمل / وظيفة متاحة) -->
          ${!isAtm ? renderPlaceJobBoardCardsHTML(place) : ''}

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

    // Smooth scroll down to Reviews when clicking the header rating badge
    const ratingBadgeEl = document.getElementById('place-header-rating-badge');
    if (ratingBadgeEl) {
      const scrollToReviews = (e) => {
        if (e) e.preventDefault();
        const reviewsTarget = document.getElementById('place-reviews-card') || document.getElementById('place-reviews-slot');
        if (reviewsTarget) {
          reviewsTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
          reviewsTarget.classList.add('review-scroll-highlight');
          setTimeout(() => reviewsTarget.classList.remove('review-scroll-highlight'), 1800);
        }
      };
      ratingBadgeEl.addEventListener('click', scrollToReviews);
      ratingBadgeEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          scrollToReviews(e);
        }
      });
    }

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
          onlineContainer.innerHTML = renderOnlineBadge(Boolean(isOnline));
        });
      } else {
        onlineContainer.innerHTML = renderOnlineBadge(false);
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

    // Masrawy Live Market Indicators (Gold, Currency, Weather)
    const placeMwBar = document.getElementById('market-widgets-bar');
    if (placeMwBar) bindMarketWidgetsEvents(placeMwBar);

    // Verification Request Button: Redirect directly to contact page to see verification prices
    let waUrl = 'https://wa.me/wasendernew';

    document.getElementById('btn-request-verification')?.addEventListener('click', (e) => {
      e.preventDefault();
      showVerificationModal(place, currentUser, waUrl);
    });

    document.querySelectorAll('#btn-request-promote-place, .btn-action-promote-place').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showPromoteModal(place, currentUser);
      });
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

    // Setup Certificate of Appreciation Modal for Place Owner
    document.querySelectorAll('.btn-appreciation-certificate, #btn-appreciation-certificate-header, #btn-appreciation-certificate-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCertificateOfAppreciationModal(place, category);
      });
    });

    // Auto-open certificate modal if ?cert=open in URL
    if (urlParams.get('cert') === 'open') {
      setTimeout(() => {
        openCertificateOfAppreciationModal(place, category);
      }, 400);
    }

    // Dynamic Auth State Listener: reveal certificate button if owner signs in asynchronously
    onAuthStateChange((latestUser) => {
      try {
        if (!latestUser) return;
        const nowOwner = Boolean(
          isCertPreview ||
          isHammad ||
          (latestUser && (
            (place?.ownerId && latestUser.uid === place.ownerId) ||
            (place?.userId && latestUser.uid === place.userId) ||
            (place?.ownerUid && latestUser.uid === place.ownerUid) ||
            (place?.email && latestUser.email && String(place.email).toLowerCase() === String(latestUser.email).toLowerCase()) ||
            isAdmin(latestUser)
          ))
        );
        if (nowOwner) {
          const actionsRow = document.querySelector('.place-title-actions-row');
          if (actionsRow && !document.getElementById('btn-appreciation-certificate-header')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-sm btn-outline btn-appreciation-certificate btn-appreciation-certificate-pulse';
            btn.id = 'btn-appreciation-certificate-header';
            btn.style.cssText = 'border-radius:var(--radius-full);gap:5px;font-size:12px;padding:5px 12px;font-weight:800';
            btn.title = 'عرض وتحميل شهادة التقدير الرسمية لنشاطك من الدليل (A4)';
            btn.innerHTML = '<span>🎖️</span><span>شهادة تقدير</span>';
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              openCertificateOfAppreciationModal(place, category);
            });
            actionsRow.appendChild(btn);
          }
        }
      } catch (authErr) {
        console.warn('[PlacePage] Auth state listener warning:', authErr);
      }
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
        const initialCount = Number(place.reviewCount || place.review_count || place.reviewsCount || place.stats?.reviewCount || 0);
        totalReviews = Math.max(safeReviews.length, initialCount);
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

        try {
          const ser = JSON.stringify(list);
          localStorage.setItem(`reviews_${placeId}`, ser);
          if (place.slug) localStorage.setItem(`reviews_${place.slug}`, ser);
        } catch (_) {}
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
        mountPlaceJobBoardWidget(place);
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
          const curUser = getCurrentUser();
          if (curUser?.uid) {
            awardPoints(curUser.uid, 'UPDATE_ATM', { placeId }).then(res => {
              if (res?.success) toast.info(`🎉 حصلت على +${res.awarded} نقطة في نادي الولاء!`);
            }).catch(() => {});
          }
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

function isPlaceStrictlyVerified(p) {
  if (!p || typeof p !== 'object') return false;
  const isV = Boolean(
    p.isVerified === true ||
    p.isVerified === 'true' ||
    p.isVerified === 1 ||
    p.isVerified === '1' ||
    p.is_verified === 1 ||
    p.is_verified === true ||
    p.is_verified === 'true' ||
    p.is_verified === '1' ||
    p.verificationStatus === 'verified' ||
    p.verification_status === 'verified'
  );
  if (!isV) return false;
  if (p.verifiedUntil && Number(p.verifiedUntil) <= Date.now()) return false;
  return true;
}

function mountSpotlightPlaceWidget(allPlaces = [], currentPlaceId = '', waBaseUrl = 'https://wa.me/wasendernew') {
  const container = document.getElementById('spotlight-place-container');
  if (!container) return;

  // STRICT RULE: Only places explicitly verified by the admin can appear in "شخصية / مكان اليوم".
  // Never fall back to unverified places!
  const verifiedPlaces = (allPlaces || []).filter(p => 
    !isAtmPlace(p) &&
    isPlaceStrictlyVerified(p) &&
    (p.id !== currentPlaceId && p._key !== currentPlaceId && p.slug !== currentPlaceId)
  );

  if (!verifiedPlaces || verifiedPlaces.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  const candidates = verifiedPlaces;
  let currentIndex = Math.floor(Date.now() / 60000) % candidates.length;

  const renderCard = (targetPlace) => {
    if (!targetPlace) return;
    const isTargetVerified = isPlaceStrictlyVerified(targetPlace);
    if (!isTargetVerified) return;

    const pName = targetPlace.name || 'شخصية اليوم';
    const rawCustom = (targetPlace.customCategory || targetPlace.custom_category || '').trim();
    const rawCat = (targetPlace.categoryName || targetPlace.category_name || '').trim();
    const pCategory = (rawCustom && !['other', 'أخرى', 'عام', 'نشاط عام'].includes(rawCustom.toLowerCase()))
      ? rawCustom
      : (rawCat || 'نشاط موثق');
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
        <span class="chip chip--success" style="font-size:10px;padding:2px 8px;font-weight:700">موثق رسمياً ✓</span>
      </div>

      <div class="spotlight-body animate-fade-in" id="spotlight-body-content">
        <a href="/place.html?slug=${encodeURIComponent(pSlug)}" class="spotlight-profile-link" title="عرض ملف ${escAttr(pName)}">
          <div class="spotlight-avatar-box">
            <img src="${escAttr(pImg)}" alt="${escAttr(pName)}" class="spotlight-avatar-img" onerror="this.src='./icons/icon-72x72.png'" />
          </div>
          <div class="spotlight-info">
            <div class="spotlight-name">
              <span>${escHtml(pName)}</span>
              <span class="spotlight-v-badge" title="موثق رسمياً">✓</span>
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
  const placeName = place?.name || 'المكان';
  const placeId = place?.id || place?._key;
  const isUserAdmin = isAdmin(user) || isAdmin();
  const storedBal = getStoredCoinsBalance();
  const cost = 5000;
  const hasEnough = storedBal >= cost || isUserAdmin;
  const isLoggedIn = Boolean((user && user.uid) || isUserAdmin);

  function renderActions(enough) {
    if ((isLoggedIn && enough) || isUserAdmin) {
      return `
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button type="button" id="btn-place-confirm-verify" class="btn btn-primary btn-lg" style="background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;border:none;font-weight:900;padding:10px 22px;border-radius:10px;box-shadow:0 4px 14px rgba(37,99,235,0.35);cursor:pointer">
            ✓ توثيق المكان الآن فوراً (5,000 ذهبية)
          </button>
        </div>
      `;
    }
    return `
      <div style="padding:4px 0 10px 0">
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a href="/wallet.html#packages" class="btn btn-primary" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;border:none;font-weight:800;padding:10px 18px;border-radius:10px;text-decoration:none">
            🪙 شحن الذهبيات في المحفظة
          </a>
          <a href="/free-verification.html" class="btn btn-outline" style="font-weight:800;padding:10px 18px;border-radius:10px;text-decoration:none">
            🎁 التوثيق المجاني بملصق الدليل
          </a>
        </div>
      </div>
    `;
  }

  const contentHtml = `
    <div style="padding:14px 10px;text-align:center">
      <div style="width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);color:#2563EB;display:inline-flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 6px 18px rgba(37,99,235,0.2);margin:0 auto 12px auto">
        🛡️
      </div>
      <h3 style="font-size:17px;font-weight:900;color:var(--text-primary,#0F172A);margin:0 0 6px 0">
        توثيق (${escHtml(placeName)}) بالعلامة الزرقاء
      </h3>
      <p style="font-size:12.5px;color:var(--text-muted,#64748B);line-height:1.6;margin:0 0 16px 0">
        احصل على شارة التوثيق الرسمية المعتمدة فوراً لزيادة ثقة العملاء وصدارة الظهور مدى الحياة.
      </p>

      <div style="background:var(--surface-2,#F8FAFC);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:12px 14px;text-align:right;margin-bottom:16px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:18px">🛡️</span>
          <div style="font-size:12.5px;color:var(--text-primary,#1E293B)">
            <strong>علامة التوثيق الزرقاء:</strong> شارة رسمية معتمدة على ملف المكان مدى الحياة.
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:18px">⭐</span>
          <div style="font-size:12.5px;color:var(--text-primary,#1E293B)">
            <strong>أسبقية في نتائج البحث:</strong> تصدر الأماكن الموثقة في كافة التصنيفات والبحث الذكي.
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:18px">🎁</span>
          <div style="font-size:12.5px;color:var(--text-primary,#1E293B)">
            <strong>إمكانية التوثيق المجاني:</strong> متاح مجاناً بنشر ملصق الدليل الرسمي في محلك التجاري.
          </div>
        </div>
      </div>

      <div style="background:rgba(37,99,235,0.06);border:1.5px solid rgba(37,99,235,0.25);border-radius:12px;padding:10px 14px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div style="text-align:right">
          <span style="font-size:11px;color:#1E40AF;display:block;font-weight:700">التوثيق الفوري بالذهبيات</span>
          <strong style="font-size:16px;color:#1D4ED8">5,000 ذهبية 🪙</strong>
        </div>
        <div style="text-align:left">
          <span style="font-size:11px;color:var(--text-muted);display:block">رصيدك الحالي</span>
          <strong id="modal-place-verify-bal" style="font-size:15px;color:${hasEnough ? '#059669' : '#DC2626'}">
            ${storedBal.toLocaleString('ar-EG')} ذهبية ${hasEnough ? '✓' : '⚠️'}
          </strong>
        </div>
      </div>

      <div id="modal-place-verify-actions">
        ${renderActions(hasEnough)}
      </div>
    </div>
  `;

  const modal = showModal({
    title: '🛡️ توثيق المكان بالعلامة الزرقاء',
    content: contentHtml,
    buttons: [{ label: 'إغلاق', type: 'ghost', closeOnClick: true }]
  });

  function bindConfirm() {
    const btn = document.getElementById('btn-place-confirm-verify');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '⏳ جاري التوثيق...';
      try {
        const token = await getIdToken();
        const res = await api.post('/api/coins/promote', { targetType: 'verification', targetId: placeId }, token);
        if (res.success) {
          const newBal = Number(res.newBalance || 0);
          setStoredCoinsBalance(newBal);
          try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k && (k.startsWith('places_owner_') || k.startsWith('cache_places') || k.includes(placeId))) {
                localStorage.removeItem(k);
              }
            }
          } catch (_) {}
          modal.close();
          toast.success(`تهانينا! تم توثيق (${placeName}) رسمياً بالعلامة الزرقاء مدى الحياة بنجاح! 👑✨`);
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          toast.error(res.error || 'تعذر إتمام التوثيق');
          btn.disabled = false;
          btn.innerHTML = '✓ توثيق المكان الآن فوراً (5,000 ذهبية)';
        }
      } catch (err) {
        toast.error(err.message || 'حدث خطأ أثناء التوثيق');
        btn.disabled = false;
        btn.innerHTML = '✓ توثيق المكان الآن فوراً (5,000 ذهبية)';
      }
    });
  }

  bindConfirm();

  // Background live sync balance
  fetchLiveCoinsBalance().then(fresh => {
    if (typeof fresh === 'number') {
      const isNowEnough = fresh >= cost || isUserAdmin;
      const balDisplay = document.getElementById('modal-place-verify-bal');
      if (balDisplay) {
        balDisplay.textContent = `${fresh.toLocaleString('ar-EG')} ذهبية ${isNowEnough ? '✓' : '⚠️'}`;
        balDisplay.style.color = isNowEnough ? '#059669' : '#DC2626';
      }
      const actionsContainer = document.getElementById('modal-place-verify-actions');
      if (actionsContainer && isNowEnough !== hasEnough) {
        actionsContainer.innerHTML = renderActions(isNowEnough);
        bindConfirm();
      }
    }
  }).catch(() => {});
}

function showPromoteModal(place, user) {
  const placeName = place?.name || 'المكان';
  const placeId = place?.id || place?._key;
  const isUserAdmin = isAdmin(user) || isAdmin();
  const storedBal = getStoredCoinsBalance();
  const cost = 500;
  const hasEnough = storedBal >= cost || isUserAdmin;

  function renderActions(enough) {
    if (enough || isUserAdmin) {
      return `
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button type="button" id="btn-place-confirm-promote" class="btn btn-primary btn-lg" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;border:none;font-weight:900;padding:10px 22px;border-radius:10px;box-shadow:0 4px 14px rgba(217,119,6,0.35);cursor:pointer">
            🚀 تفعيل الإعلان المميز الآن (500 ذهبية)
          </button>
        </div>
      `;
    }
    return `
      <div style="padding:4px 0 10px 0">
        <p style="font-size:12px;color:#DC2626;font-weight:700;margin-bottom:12px">
          رصيدك الحالي غير كافٍ لتفعيل الإعلان المميز (يلزم 500 ذهبية).
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a href="/wallet.html" class="btn btn-primary" style="background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;border:none;font-weight:800;padding:10px 18px;border-radius:10px;text-decoration:none">
            🪙 شحن الذهبيات في المحفظة
          </a>
          <a href="https://wa.me/201062035882?text=${encodeURIComponent(`السلام عليكم، أريد شحن 500 ذهبية لتفعيل إعلان مميز لمكاني (${placeName})`)}" target="_blank" class="btn btn-outline" style="font-weight:800;padding:10px 18px;border-radius:10px;display:inline-flex;align-items:center;gap:6px">
            💬 شحن عبر فودافون كاش / واتساب
          </a>
        </div>
      </div>
    `;
  }

  const contentHtml = `
    <div style="padding:14px 10px;text-align:center">
      <div style="width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%);color:#D97706;display:inline-flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 6px 18px rgba(245,166,35,0.25);margin:0 auto 12px auto">
        🌟
      </div>
      <h3 style="font-size:17px;font-weight:900;color:var(--text-primary,#0F172A);margin:0 0 6px 0">
        ترقية (${escHtml(placeName)}) لإعلان مميز
      </h3>
      <p style="font-size:12.5px;color:var(--text-muted,#64748B);line-height:1.6;margin:0 0 16px 0">
        احجز صدارة الدليل ونتائج البحث لمشروعك، واجذب آلاف المشاهدات والاتصالات المباشرة في المنزلة والمطرية.
      </p>

      <div style="background:var(--surface-2,#F8FAFC);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:12px 14px;text-align:right;margin-bottom:16px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:18px">👑</span>
          <div style="font-size:12.5px;color:var(--text-primary,#1E293B)">
            <strong>الظهور في صدارة الدليل:</strong> تثبيت نشاطك في أعلى نتائج البحث والتصنيف لمدة <strong>شهر كامل (30 يوماً)</strong>.
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:18px">✨</span>
          <div style="font-size:12.5px;color:var(--text-primary,#1E293B)">
            <strong>شارة ذهبية بارزة:</strong> علامة «👑 إعلان مميز» مميزة تلفت انتباه الزوار فوراً.
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:18px">📈</span>
          <div style="font-size:12.5px;color:var(--text-primary,#1E293B)">
            <strong>مضاعفة الاتصالات:</strong> أسبقية الاتصال المباشر ومحادثات واتساب من العملاء.
          </div>
        </div>
      </div>

      <div style="background:rgba(245,166,35,0.08);border:1.5px solid rgba(245,166,35,0.3);border-radius:12px;padding:10px 14px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div style="text-align:right">
          <span style="font-size:11px;color:#92400E;display:block;font-weight:700">تكلفة الترقية (30 يوماً)</span>
          <strong style="font-size:16px;color:#B45309">500 ذهبية 🪙</strong>
        </div>
        <div style="text-align:left">
          <span style="font-size:11px;color:var(--text-muted);display:block">رصيدك الحالي</span>
          <strong id="modal-place-promote-bal" style="font-size:15px;color:${hasEnough ? '#059669' : '#DC2626'}">
            ${storedBal.toLocaleString('ar-EG')} ذهبية ${hasEnough ? '✓' : '⚠️'}
          </strong>
        </div>
      </div>

      <div id="modal-place-promote-actions">
        ${renderActions(hasEnough)}
      </div>
    </div>
  `;

  const modal = showModal({
    title: '🌟 ترقية إعلان مميز',
    content: contentHtml,
    buttons: [{ label: 'إغلاق', type: 'ghost', closeOnClick: true }]
  });

  function bindConfirm() {
    const btn = document.getElementById('btn-place-confirm-promote');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '⏳ جاري التفعيل...';
      try {
        const token = await getIdToken();
        const res = await api.post('/api/coins/promote', { targetType: 'place', targetId: placeId }, token);
        if (res.success) {
          const newBal = Number(res.newBalance || 0);
          setStoredCoinsBalance(newBal);
          try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k && (k.startsWith('places_owner_') || k.startsWith('cache_places') || k.includes(placeId))) {
                localStorage.removeItem(k);
              }
            }
          } catch (_) {}
          modal.close();
          toast.success(`تم ترقية (${placeName}) كإعلان مميز في صدارة الدليل لمدة 30 يوماً بنجاح! 👑✨`);
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          toast.error(res.error || 'تعذر ترقية المكان');
          btn.disabled = false;
          btn.innerHTML = '🚀 تفعيل الإعلان المميز الآن (500 ذهبية)';
        }
      } catch (err) {
        toast.error(err.message || 'حدث خطأ أثناء الترقية');
        btn.disabled = false;
        btn.innerHTML = '🚀 تفعيل الإعلان المميز الآن (500 ذهبية)';
      }
    });
  }

  bindConfirm();

  // Background live sync
  fetchLiveCoinsBalance().then(fresh => {
    if (typeof fresh === 'number') {
      const isNowEnough = fresh >= cost || isUserAdmin;
      const balDisplay = document.getElementById('modal-place-promote-bal');
      if (balDisplay) {
        balDisplay.textContent = `${fresh.toLocaleString('ar-EG')} ذهبية ${isNowEnough ? '✓' : '⚠️'}`;
        balDisplay.style.color = isNowEnough ? '#059669' : '#DC2626';
      }
      const actionsContainer = document.getElementById('modal-place-promote-actions');
      if (actionsContainer && isNowEnough !== hasEnough) {
        actionsContainer.innerHTML = renderActions(isNowEnough);
        bindConfirm();
      }
    }
  }).catch(() => {});
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
  const isEn = isEnglish();
  const rawCustom = (place.customCategory || place.custom_category || '').trim();
  const rawCatName = (place.categoryName || place.category_name || '').trim();
  const catId = (place.categoryId || '').toLowerCase();
  
  let name = '';
  if (rawCustom && !['other', 'أخرى', 'عام', 'نشاط عام', 'خدمات وأنشطة', 'نشاط تجاري وخدمات', 'نشاط تجاري'].includes(rawCustom.toLowerCase())) {
    name = rawCustom;
  } else if (category && category.name && !['other', 'أخرى', 'عام', 'نشاط عام'].includes(category.name.toLowerCase())) {
    name = category.name;
  } else if (rawCatName && !['other', 'أخرى', 'عام', 'نشاط عام'].includes(rawCatName.toLowerCase())) {
    name = rawCatName;
  } else {
    const dictName = toArabicCategory(catId);
    if (dictName && !['other', 'أخرى', 'عام', 'نشاط عام', 'خدمات وأنشطة', 'نشاط تجاري وخدمات', 'نشاط تجاري'].includes(dictName.toLowerCase())) {
      name = dictName;
    } else {
      name = rawCustom || rawCatName || (category && category.name) || (isEn ? 'Services & Activities' : 'خدمات وأنشطة');
    }
  }

  name = translateCategory(name, isEn);

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

        ${!user ? `
          <!-- Guest Reviewer Name Field -->
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-weight:700;display:flex;align-items:center;gap:6px;font-size:13px">
              <span>👤</span>
              <span>اسمك الكريم <span style="font-weight:500;color:var(--text-muted);font-size:11.5px">(اختياري، يظهر مع التقييم):</span></span>
            </label>
            <input 
              id="review-guest-name-input" 
              class="form-input" 
              type="text" 
              maxlength="50" 
              placeholder="مثال: أحمد، مريم، زائر..." 
              value="" 
              style="font-size:14px;width:100%" />
          </div>
        ` : `
          <div style="font-size:12.5px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;background:var(--surface-2);padding:8px 12px;border-radius:10px;border:1px solid var(--border)">
            <span>👤</span> التقييم باسم: <strong style="color:var(--primary);font-weight:800">${escHtml(user.name || user.displayName || 'مستخدم')}</strong>
          </div>
        `}

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
          const guestName = document.getElementById('review-guest-name-input')?.value?.trim() || '';
          if (!commentVal) {
            toast.warning('يرجى كتابة نص التقييم');
            return;
          }

          const actionBtn = document.querySelector('.modal-footer .btn-primary') || document.activeElement;
          if (actionBtn && !actionBtn.disabled) {
            actionBtn.disabled = true;
            actionBtn.innerText = '⏳ جاري النشر...';
          }

          const effectiveUser = user || {
            uid: 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            name: guestName || 'عميل وزائر',
            photoURL: ''
          };

          try {
            if (existingReview) {
              await updatePlaceReview(place.id || place._key, existingReview.id, {
                rating: selectedRating,
                comment: commentVal
              }, effectiveUser);
              toast.success('تم تحديث تقييمك بنجاح ✨');
            } else {
              await addPlaceReview({
                placeId: place.id || place._key,
                placeName: place.name,
                placeSlug: place.slug,
                user: effectiveUser,
                rating: selectedRating,
                comment: commentVal
              });
              toast.success('شكراً لمشاركتك! تم نشر تقييمك بنجاح ⭐');
              if (effectiveUser?.uid && !effectiveUser.uid.startsWith('guest_')) {
                awardPoints(effectiveUser.uid, 'ADD_REVIEW', { placeId: place.id || place._key, placeName: place.name }).then(res => {
                  if (res?.success) toast.info(`🎉 حصلت على +${res.awarded} نقطة في نادي الولاء!`);
                }).catch(() => {});
              }
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
                ratingBadge.innerHTML = totalReviews > 0 ? `
                  <span class="rating-star">★</span>
                  <span class="rating-val">${avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
                  <span class="rating-sub">(${totalReviews} تقييم)</span>
                ` : `
                  <span class="rating-star-empty">✨</span>
                  <span class="rating-none">لا توجد تقييمات بعد</span>
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
            if (actionBtn) {
              actionBtn.disabled = false;
              actionBtn.innerText = existingReview ? '💾 حفظ التعديل' : '🚀 نشر التقييم';
            }
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

let _jbRotationTimer = null;

function renderPlaceJobBoardCardsHTML(place) {
  const loc = encodeURIComponent(place.area || place.city || 'المنزلة');
  const workplace = encodeURIComponent(place.name || '');

  return `
    <div id="place-jb-showcase-container" class="place-jb-widget-wrapper">
      <!-- بطاقة طالب عمل -->
      <div class="place-jb-card">
        <div class="place-jb-card__head">
          <span class="place-jb-card__icon">💼</span>
          <div>
            <h4 class="place-jb-card__title">طالب عمل أو كادر محلي؟</h4>
            <p class="place-jb-card__desc">تصفح الباحثين عن عمل في هذه المنطقة أو اعرض سيرتك الذاتية لأصحاب المحل.</p>
          </div>
        </div>
        <a href="/job-seekers.html?location=${loc}" class="place-jb-card__btn place-jb-card__btn--amber">
          <span>استعراض الباحثين عن عمل ↤</span>
        </a>
      </div>

      <!-- بطاقة وظيفة متاحة -->
      <div class="place-jb-card">
        <div class="place-jb-card__head">
          <span class="place-jb-card__icon">📢</span>
          <div>
            <h4 class="place-jb-card__title">فرص عمل ووظائف متاحة</h4>
            <p class="place-jb-card__desc">هل تبحث عن عمل هنا أو أعلن المكان عن شاغر وظيفي؟ استعرض الوظائف الشاغرة.</p>
          </div>
        </div>
        <a href="/jobs.html?workplace=${workplace}&location=${loc}" class="place-jb-card__btn">
          <span>الوظائف الشاغرة والتقديم ↤</span>
        </a>
      </div>
    </div>
  `;
}

async function mountPlaceJobBoardWidget(place) {
  const container = document.getElementById('place-jb-showcase-container');
  if (!container || !place) return;

  if (_jbRotationTimer) {
    clearInterval(_jbRotationTimer);
    _jbRotationTimer = null;
  }

  const targetArea = (place.area || place.city || 'المنزلة').trim();
  const workplaceName = (place.name || '').trim();

  try {
    const [jobsRes, seekersRes] = await Promise.allSettled([
      fetch(`${WORKER_URL}/api/jobs?status=active`, { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
      fetch(`${WORKER_URL}/api/job-seekers?status=active`, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
    ]);

    const rawJobs = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : [];
    const rawSeekers = seekersRes.status === 'fulfilled' && Array.isArray(seekersRes.value?.data) ? seekersRes.value.data : [];

    // Featured items get absolute top priority across the entire website!
    const featuredJobs = rawJobs.filter(j => j.isFeatured);
    const featuredSeekers = rawSeekers.filter(s => s.isFeatured);

    // Matching by area or workplace
    const localJobs = rawJobs.filter(j => !j.isFeatured && (
      (j.workplace && j.workplace.toLowerCase() === workplaceName.toLowerCase()) ||
      (j.location && (j.location.includes(targetArea) || targetArea.includes(j.location)))
    ));

    const localSeekers = rawSeekers.filter(s => !s.isFeatured && (
      s.location && (s.location.includes(targetArea) || targetArea.includes(s.location))
    ));

    // Other active items
    const otherJobs = rawJobs.filter(j => !j.isFeatured && !localJobs.includes(j)).slice(0, 4);
    const otherSeekers = rawSeekers.filter(s => !s.isFeatured && !localSeekers.includes(s)).slice(0, 4);

    const playlist = [
      ...featuredJobs.map(j => ({ type: 'job', data: j, isFeatured: true })),
      ...featuredSeekers.map(s => ({ type: 'seeker', data: s, isFeatured: true })),
      ...localJobs.map(j => ({ type: 'job', data: j, isFeatured: false })),
      ...localSeekers.map(s => ({ type: 'seeker', data: s, isFeatured: false })),
      ...otherJobs.map(j => ({ type: 'job', data: j, isFeatured: false })),
      ...otherSeekers.map(s => ({ type: 'seeker', data: s, isFeatured: false }))
    ];

    if (playlist.length === 0) return;

    let currentIndex = 0;

    const renderCurrentCard = (index) => {
      const item = playlist[index];
      if (!item) return;

      const isJob = item.type === 'job';
      const d = item.data;
      const isFeatured = item.isFeatured || Boolean(d.isFeatured);
      const total = playlist.length;

      let cardHtml = '';
      if (isJob) {
        const salaryText = d.salary ? `${Number(d.salary).toLocaleString('ar-EG')} ج.م` : 'يحدد في المقابلة';
        cardHtml = `
          <div class="place-jb-card place-jb-card--interactive ${isFeatured ? 'place-jb-card--featured' : ''}" style="${isFeatured ? 'border: 2px solid #F5A623; box-shadow: 0 0 20px rgba(245,166,35,0.22);' : ''}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
              <span class="place-jb-badge place-jb-badge--job" style="font-size:11px;font-weight:800;background:rgba(2,132,199,0.12);color:#0284C7;padding:3px 8px;border-radius:6px">📢 فرصة عمل متاحة</span>
              ${isFeatured ? '<span class="place-jb-badge place-jb-badge--featured" style="font-size:11px;font-weight:900;background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;padding:3px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:3px">⭐ إعلان مميز</span>' : ''}
              <span style="font-size:11px;color:var(--text-muted);font-weight:700">📍 ${escHtml(d.location || targetArea)}</span>
            </div>

            <div class="place-jb-card__head" style="margin-top:6px">
              <span class="place-jb-card__icon" style="font-size:24px">🏢</span>
              <div style="min-width:0">
                <h4 class="place-jb-card__title" style="font-size:15px;line-height:1.4">${escHtml(d.title)}</h4>
                <div style="font-size:12px;color:var(--primary);font-weight:800;margin-top:2px">${escHtml(d.workplace || d.workplaceName || workplaceName)}</div>
              </div>
            </div>

            <div class="place-jb-card__meta" style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;font-size:11.5px">
              <span style="background:rgba(0,0,0,0.04);padding:2px 8px;border-radius:4px">💼 ${escHtml(d.profession || 'عام')}</span>
              <span style="background:rgba(0,0,0,0.04);padding:2px 8px;border-radius:4px">💵 ${salaryText}</span>
              ${d.working_hours || d.workingHours ? `<span style="background:rgba(0,0,0,0.04);padding:2px 8px;border-radius:4px">⏱️ ${d.working_hours || d.workingHours} ساعات</span>` : ''}
            </div>

            <p class="place-jb-card__desc" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escHtml(d.description || 'فرصة عمل متاحة للتواصل والتقديم المباشر.')}</p>

            <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
              <a href="/jobs.html?id=${encodeURIComponent(d.id)}" class="place-jb-card__btn" style="flex:1;text-align:center">
                <span>التفاصيل والتقديم ↤</span>
              </a>
              ${d.phone ? `<a href="tel:${escAttr(d.phone)}" class="place-jb-btn-icon" title="اتصال بالمسؤول" style="width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;background:rgba(16,185,129,0.12);color:#10B981;border-radius:8px;text-decoration:none;font-size:15px">📞</a>` : ''}
              ${d.whatsapp ? `<a href="https://wa.me/2${escAttr(String(d.whatsapp).replace(/^0/, ''))}" target="_blank" rel="noopener" class="place-jb-btn-icon" title="تواصل واتساب" style="width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;background:rgba(37,211,102,0.12);color:#25D366;border-radius:8px;text-decoration:none;font-size:15px">💬</a>` : ''}
            </div>

            ${total > 1 ? `
              <div class="place-jb-nav" style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06)">
                <span class="place-jb-nav__counter" style="font-size:11px;color:var(--text-muted);font-weight:700">
                  إعلان ${index + 1} من ${total} • ⏱️ تبديل كل دقيقتين
                </span>
                <div style="display:flex;gap:6px">
                  <button type="button" class="place-jb-arrow" id="btn-place-jb-prev" title="السابق" style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-weight:800;font-size:14px;color:var(--text-primary)">‹</button>
                  <button type="button" class="place-jb-arrow" id="btn-place-jb-next" title="التالي" style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-weight:800;font-size:14px;color:var(--text-primary)">›</button>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        const expText = d.experience_years ? `خبرة ${d.experience_years} سنوات` : 'كادر طموح / باحث عن عمل';
        cardHtml = `
          <div class="place-jb-card place-jb-card--interactive ${isFeatured ? 'place-jb-card--featured' : ''}" style="${isFeatured ? 'border: 2px solid #F5A623; box-shadow: 0 0 20px rgba(245,166,35,0.22);' : ''}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
              <span class="place-jb-badge place-jb-badge--seeker" style="font-size:11px;font-weight:800;background:rgba(245,166,35,0.15);color:#D97706;padding:3px 8px;border-radius:6px">💼 باحث عن عمل وكادر محلي</span>
              ${isFeatured ? '<span class="place-jb-badge place-jb-badge--featured" style="font-size:11px;font-weight:900;background:linear-gradient(135deg,#F5A623,#D97706);color:#fff;padding:3px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:3px">⭐ إعلان مميز</span>' : ''}
              <span style="font-size:11px;color:var(--text-muted);font-weight:700">📍 ${escHtml(d.location || targetArea)}</span>
            </div>

            <div class="place-jb-card__head" style="margin-top:6px">
              <span class="place-jb-card__icon" style="font-size:24px">👤</span>
              <div style="min-width:0">
                <h4 class="place-jb-card__title" style="font-size:15px;line-height:1.4">${escHtml(d.name)}</h4>
                <div style="font-size:12px;color:#D97706;font-weight:800;margin-top:2px">المهنة: ${escHtml(d.profession)}</div>
              </div>
            </div>

            <div class="place-jb-card__meta" style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;font-size:11.5px">
              <span style="background:rgba(0,0,0,0.04);padding:2px 8px;border-radius:4px">⏳ ${expText}</span>
              ${d.expectedSalary || d.expected_salary ? `<span style="background:rgba(0,0,0,0.04);padding:2px 8px;border-radius:4px">💵 متوقع: ${Number(d.expectedSalary || d.expected_salary).toLocaleString('ar-EG')} ج.م</span>` : ''}
            </div>

            <p class="place-jb-card__desc" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escHtml(d.bio || d.description || 'كادر محلي يبحث عن فرصة عمل تناسب مهاراته.')}</p>

            <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
              <a href="/job-seekers.html?id=${encodeURIComponent(d.id)}" class="place-jb-card__btn place-jb-card__btn--amber" style="flex:1;text-align:center">
                <span>استعراض السيرة والتواصل ↤</span>
              </a>
              ${d.phone ? `<a href="tel:${escAttr(d.phone)}" class="place-jb-btn-icon" title="اتصال بالكادر" style="width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;background:rgba(16,185,129,0.12);color:#10B981;border-radius:8px;text-decoration:none;font-size:15px">📞</a>` : ''}
            </div>

            ${total > 1 ? `
              <div class="place-jb-nav" style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06)">
                <span class="place-jb-nav__counter" style="font-size:11px;color:var(--text-muted);font-weight:700">
                  إعلان ${index + 1} من ${total} • ⏱️ تبديل كل دقيقتين
                </span>
                <div style="display:flex;gap:6px">
                  <button type="button" class="place-jb-arrow" id="btn-place-jb-prev" title="السابق" style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-weight:800;font-size:14px;color:var(--text-primary)">‹</button>
                  <button type="button" class="place-jb-arrow" id="btn-place-jb-next" title="التالي" style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-weight:800;font-size:14px;color:var(--text-primary)">›</button>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }

      container.innerHTML = cardHtml;

      if (total > 1) {
        document.getElementById('btn-place-jb-prev')?.addEventListener('click', (e) => {
          e.preventDefault();
          currentIndex = (currentIndex - 1 + total) % total;
          renderCurrentCard(currentIndex);
          resetTimer();
        });
        document.getElementById('btn-place-jb-next')?.addEventListener('click', (e) => {
          e.preventDefault();
          currentIndex = (currentIndex + 1) % total;
          renderCurrentCard(currentIndex);
          resetTimer();
        });
      }
    };

    const resetTimer = () => {
      if (_jbRotationTimer) clearInterval(_jbRotationTimer);
      if (playlist.length > 1) {
        _jbRotationTimer = setInterval(() => {
          currentIndex = (currentIndex + 1) % playlist.length;
          renderCurrentCard(currentIndex);
        }, 120000); // 2 minutes auto-rotate
      }
    };

    renderCurrentCard(currentIndex);
    resetTimer();

  } catch (err) {
    console.warn('[mountPlaceJobBoardWidget Error]:', err);
  }
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

  const sumRating = (c5 * 5) + (c4 * 4) + (c3 * 3) + (c2 * 2) + (c1 * 1);
  const avgRatingVal = totalReviews > 0 ? (sumRating / totalReviews) : (isHammad ? 4.8 : 5.0);
  const displayScore = totalReviews > 0 ? avgRatingVal.toFixed(1) : (isHammad ? '4.8' : '5.0');
  const numScore = parseFloat(displayScore);
  const p5 = totalReviews > 0 ? Math.round((c5 / totalReviews) * 100) : (isHammad ? 78 : 100);
  const p4 = totalReviews > 0 ? Math.round((c4 / totalReviews) * 100) : (isHammad ? 22 : 0);
  const p3 = totalReviews > 0 ? Math.round((c3 / totalReviews) * 100) : 0;
  const p2 = totalReviews > 0 ? Math.round((c2 / totalReviews) * 100) : 0;
  const p1 = totalReviews > 0 ? Math.round((c1 / totalReviews) * 100) : 0;

  const initialSlice = safeReviews.slice(0, 15);
  const remaining = Math.max(0, safeReviews.length - initialSlice.length);

  return `
    <!-- Google-Style 5-Star Reviews & Ratings Section -->
    <section class="info-card reviews-section" id="place-reviews-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-3)">
        <h2 class="info-card__title" style="margin:0;display:flex;align-items:center;gap:8px">
          <span style="color:#F59E0B">⭐</span> تقييمات وآراء الزوار (<span id="reviews-header-total-count">${totalReviews}</span>)
        </h2>

        <div>
          ${userReview ? `
            ${(!isHammad || currentUser?.role === 'superadmin') ? `
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
        </div>
      </div>

      <!-- Google-Style Rating Breakdown Box (Directly below Place Card & before comments) -->
      <div class="google-rating-card">
        <div class="google-rating-summary">
          <div class="google-rating-score">${displayScore}</div>
          <div class="google-rating-stars" style="color:#F59E0B;letter-spacing:2px">
            ${'★'.repeat(Math.min(5, Math.max(1, Math.round(numScore))))}
          </div>
          <div class="google-rating-count">${totalReviews} تقييم</div>
        </div>

        <div class="google-rating-bars">
          <div class="google-rating-bar-row">
            <span class="bar-num">5</span>
            <div class="bar-track"><div class="bar-fill" style="width:${p5}%"></div></div>
          </div>
          <div class="google-rating-bar-row">
            <span class="bar-num">4</span>
            <div class="bar-track"><div class="bar-fill" style="width:${p4}%"></div></div>
          </div>
          <div class="google-rating-bar-row">
            <span class="bar-num">3</span>
            <div class="bar-track"><div class="bar-fill" style="width:${p3}%"></div></div>
          </div>
          <div class="google-rating-bar-row">
            <span class="bar-num">2</span>
            <div class="bar-track"><div class="bar-fill" style="width:${p2}%"></div></div>
          </div>
          <div class="google-rating-bar-row">
            <span class="bar-num">1</span>
            <div class="bar-track"><div class="bar-fill" style="width:${p1}%"></div></div>
          </div>
        </div>

        <div class="google-rating-action">
          <button type="button" class="btn-write-review" onclick="document.getElementById('btn-open-review-modal')?.click() || document.getElementById('btn-login-to-review')?.click()" title="كتابة تقييم ومراجعة لهذا المكان">
            <span>✏️</span>
            <span>كتابة مراجعة</span>
          </button>
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
    let isSubmitting = false;

    let modalInstance = null;

    const doSubmit = async () => {
      if (isSubmitting) return;
      const phoneInput = document.getElementById('suggested-phone-input');
      const rawPhone = phoneInput?.value?.trim() || '';
      const reporter = document.getElementById('suggested-reporter-name')?.value?.trim() || '';
      const note = document.getElementById('suggested-phone-note')?.value?.trim() || '';

      if (!isValidPhoneNumber(rawPhone)) {
        toast.error('يرجى كتابة رقم هاتف مصري صحيح (موبايل 11 رقم أو أرضي)');
        phoneInput?.focus();
        return;
      }

      const saveDirectBtn = document.getElementById('btn-save-phone-direct');
      const saveFooterBtn = modalInstance?.getBody()?.closest('.modal')?.querySelector('.modal__footer .btn-primary');

      try {
        isSubmitting = true;
        if (saveDirectBtn) {
          saveDirectBtn.disabled = true;
          saveDirectBtn.innerHTML = '<span>⏳ جاري حفظ وإرسال الرقم...</span>';
        }
        if (saveFooterBtn) {
          saveFooterBtn.disabled = true;
          saveFooterBtn.textContent = '⏳ جاري الحفظ...';
        }

        const u = getCurrentUser();
        const reporterName = reporter || u?.name || u?.displayName || 'مستخدم متطوع';
        await submitPhoneSuggestion({
          placeId,
          placeName,
          suggestedPhone: rawPhone,
          note,
          reporterName
        });
        toast.success('شكرًا جزيلاً لمساهمتك! تم حفظ وإرسال الرقم المقترح وسيتم اعتماده في الدليل. 💡');
        modalInstance?.close();
      } catch (err) {
        toast.error(err.message || 'تعذر إرسال الرقم المقترح');
        if (saveDirectBtn) {
          saveDirectBtn.disabled = false;
          saveDirectBtn.innerHTML = `
            <span class="suggest-phone-btn-icon">💾</span>
            <span class="suggest-phone-btn-text">حفظ وإرسال رقم الهاتف للاعتماد</span>
            <span class="suggest-phone-btn-arrow">←</span>
          `;
        }
        if (saveFooterBtn) {
          saveFooterBtn.disabled = false;
          saveFooterBtn.textContent = '💾 حفظ وإرسال الرقم';
        }
      } finally {
        isSubmitting = false;
      }
    };

    modalInstance = showModal({
      title: '💡 اقتراح رقم هاتف لهذا المكان',
      size: 'sm',
      className: 'modal--suggest-phone',
      content: `
        <div class="suggest-phone-modal">
          <div class="suggest-phone-banner">
            <div class="suggest-phone-banner__icon">📱</div>
            <div class="suggest-phone-banner__content">
              <span class="suggest-phone-banner__label">المساهمة برقم تواصل معتمد لـ:</span>
              <strong class="suggest-phone-banner__name">${escHtml(placeName || 'هذا المكان')}</strong>
            </div>
          </div>

          <!-- مكان الإدخال المتجاوب مع زر الحفظ المباشر المدمج للهاتف و PWA -->
          <div class="suggest-phone-field suggest-phone-field--primary">
            <label class="suggest-phone-field__label" for="suggested-phone-input">
              <span class="suggest-phone-field__icon">📞</span>
              <span>رقم الهاتف أو الواتساب المقترح <span class="suggest-phone-required">*</span></span>
            </label>
            <div class="suggest-phone-input-wrap">
              <input id="suggested-phone-input" 
                     type="tel" 
                     inputmode="numeric" 
                     pattern="[0-9]*" 
                     class="form-input suggest-phone-input" 
                     dir="ltr" 
                     placeholder="01xxxxxxxxx أو رقم أرضي" 
                     maxlength="11" 
                     autocomplete="tel" 
                     autofocus />
              <span class="suggest-phone-input-badge">🇪🇬</span>
              <button type="button" id="btn-clear-suggested-phone" class="suggest-phone-input-clear" style="display:none" title="مسح">✕</button>
            </div>
            <div class="suggest-phone-input-status" id="suggest-phone-input-status">
              <span class="suggest-phone-field__help">يدعم الموبايل (11 رقم) والخطوط الأرضية والخط الساخن.</span>
            </div>

            <!-- زر الحفظ بعد اقتراح الرقم يظهر فوراً تحت مكان الإدخال ليكون مرئياً بالكامل على الهاتف و PWA -->
            <div class="suggest-phone-inline-actions">
              <button type="button" id="btn-save-phone-direct" class="suggest-phone-submit-btn" title="حفظ وإرسال الرقم فوراً">
                <span class="suggest-phone-btn-icon">💾</span>
                <span class="suggest-phone-btn-text">حفظ وإرسال رقم الهاتف للاعتماد</span>
                <span class="suggest-phone-btn-arrow">←</span>
              </button>
            </div>
          </div>

          <!-- الحقول الإضافية قابلة للطي للحفاظ على ارتفاع النافذة ومنع الاختفاء مع لوحة مفاتيح الهاتف -->
          <details class="suggest-phone-optional-details">
            <summary class="suggest-phone-optional-summary">
              <span>➕ إضافة اسمك أو ملاحظة توضيحية (اختياري)</span>
              <span class="suggest-phone-optional-chevron">▾</span>
            </summary>
            <div class="suggest-phone-optional-body">
              <div class="suggest-phone-field">
                <label class="suggest-phone-field__label" for="suggested-reporter-name">
                  <span class="suggest-phone-field__icon">👤</span>
                  <span>اسمك أو صفتك <span class="suggest-phone-optional">(اختياري)</span></span>
                </label>
                <input id="suggested-reporter-name" type="text" class="form-input suggest-phone-input" placeholder="مثال: أحمد (زبون / صاحب المكان)" />
              </div>

              <div class="suggest-phone-field">
                <label class="suggest-phone-field__label" for="suggested-phone-note">
                  <span class="suggest-phone-field__icon">📝</span>
                  <span>ملاحظة توضيحية <span class="suggest-phone-optional">(اختياري)</span></span>
                </label>
                <input id="suggested-phone-note" type="text" class="form-input suggest-phone-input" placeholder="مثال: رقم الدليفري، رقم الاستقبال، فرع..." />
              </div>
            </div>
          </details>

          <div class="suggest-phone-trust-hint">
            <span class="suggest-phone-trust-hint__icon">🛡️</span>
            <span>يتم تدقيق ومراجعة الرقم واعتماده فوراً لتسهيل وصول أهالي وزوار المنطقة للمكان.</span>
          </div>
        </div>
      `,
      buttons: [
        {
          label: '💾 حفظ وإرسال الرقم',
          type: 'primary',
          closeOnClick: false,
          onClick: doSubmit
        },
        { label: 'إلغاء', type: 'ghost', closeOnClick: true }
      ]
    });

    // Wire up events
    setTimeout(() => {
      const phoneInput = document.getElementById('suggested-phone-input');
      const directSaveBtn = document.getElementById('btn-save-phone-direct');
      const clearBtn = document.getElementById('btn-clear-suggested-phone');
      const statusEl = document.getElementById('suggest-phone-input-status');

      if (directSaveBtn) {
        directSaveBtn.addEventListener('click', (e) => {
          e.preventDefault();
          doSubmit();
        });
      }

      if (clearBtn && phoneInput) {
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          phoneInput.value = '';
          clearBtn.style.display = 'none';
          if (statusEl) statusEl.innerHTML = '<span class="suggest-phone-field__help">يدعم الموبايل (11 رقم) والخطوط الأرضية والخط الساخن.</span>';
          phoneInput.focus();
        });
      }

      if (phoneInput) {
        phoneInput.addEventListener('input', () => {
          // Normalize Arabic/Persian digits to English digits
          let val = phoneInput.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
          val = val.replace(/[^\d]/g, '');
          phoneInput.value = val;

          if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';

          if (statusEl) {
            if (val.length === 11 && isValidPhoneNumber(val)) {
              statusEl.innerHTML = '<span style="color:#16a34a;font-weight:800">✓ رقم مصري صحيح وجاهز للحفظ</span>';
              if (directSaveBtn) directSaveBtn.style.filter = 'brightness(1.1)';
            } else if (val.length > 0 && val.length < 11 && (val.startsWith('01') || val.startsWith('05'))) {
              statusEl.innerHTML = `<span style="color:#d97706;font-weight:700">متبقي ${11 - val.length} أرقام لاكتمال الرقم...</span>`;
            } else if (val.length >= 7 && isValidPhoneNumber(val)) {
              statusEl.innerHTML = '<span style="color:#16a34a;font-weight:800">✓ رقم تواصل صحيح وجاهز للحفظ</span>';
            } else {
              statusEl.innerHTML = '<span class="suggest-phone-field__help">يدعم الموبايل (11 رقم) والخطوط الأرضية والخط الساخن.</span>';
            }
          }
        });

        phoneInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            doSubmit();
          }
        });

        try { phoneInput.focus(); } catch (_) {}
      }
    }, 50);
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
