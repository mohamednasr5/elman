/**
 * Dalil El Manzala & El Matariya — English Place Details Page
 * Dedicated native English place detail renderer
 */

import { getPlace, getPlaceBySlug, getPublishedPlaces, getPlaceOffers, getPlaceProducts, getPlaceReviews, addPlaceReview, trackPlaceView } from '../../../core/db.js';
import { getCurrentUser } from '../../../core/auth.js';
import { renderVerifiedBadge, renderDeliveryBadge, renderSponsoredBadge, renderOnlineBadge } from '../../components/VerifiedBadge.js';
import { renderPlaceCard } from '../../components/PlaceCard.js';
import { isFavorite, toggleFavorite } from '../../../services/favorites.service.js';
import { buildContextualWhatsAppLink } from '../../../services/whatsapp.service.js';
import { getOptimizedImageUrl, IMAGE_SIZES } from '../../../services/image-cdn.service.js';
import { getDefaultPlaceAssets } from '../../../utils/category-assets.js';
import { isAtmPlace, ATM_UNIFIED_COVER, ATM_UNIFIED_LOGO, getAtmLiveStatus } from '../../../utils/atm.js';
import { getPlaceLiveStatus } from '../../../utils/live-hours.js';
import { resolveDoctorSpecialty } from '../../../utils/specialty.js';
import { resolvePlaceProfession } from '../../../utils/professions-data.js';
import { translateArea, translateCategory } from '../../../utils/category-i18n.js';

export async function renderEnglishPlacePage($container, { slug, user, initialPlace = null } = {}) {
  const cleanSlug = String(slug || '').toLowerCase().trim();
  let place = initialPlace;

  if (!place && typeof window !== 'undefined' && window._placesRegistry) {
    place = window._placesRegistry.get(cleanSlug);
  }

  // Fetch place if not cached
  if (!place) {
    $container.innerHTML = `
      <div class="container section text-center" style="padding:80px 16px">
        <div class="skeleton" style="width:100px;height:100px;border-radius:50%;margin:0 auto var(--space-4)"></div>
        <div class="skeleton" style="width:240px;height:28px;margin:0 auto var(--space-2)"></div>
        <div class="skeleton" style="width:360px;height:18px;margin:0 auto"></div>
      </div>
    `;
    try {
      place = await getPlaceBySlug(cleanSlug);
      if (!place && cleanSlug) place = await getPlace(cleanSlug);
    } catch (err) {
      console.warn('[PlaceEn] Fetch error:', err);
    }
  }

  if (!place) {
    $container.innerHTML = `
      <div class="container section text-center" style="padding:60px 16px">
        <h1 style="color:var(--primary);margin-bottom:1rem">Place Not Found</h1>
        <p style="color:var(--text-secondary);margin-bottom:2rem">The place or business you are looking for does not exist or has been removed.</p>
        <a href="/en/places/" class="btn btn-primary">Browse All Places</a>
      </div>
    `;
    return;
  }

  try { trackPlaceView(place, getCurrentUser()); } catch (_) {}

  const isAtm = isAtmPlace(place);
  const defaultAssets = getDefaultPlaceAssets(place);
  const name = place.nameEn || place.name_en || place.name || 'Local Place';
  const desc = place.descriptionEn || place.description_en || place.description || '';
  const rawArea = place.areaEn || place.area_en || place.area || '';
  const area = translateArea(rawArea, true) || 'El Manzala';
  const address = place.addressEn || place.address_en || place.address || '';
  const cat = translateCategory(place.categoryName || place.customCategory || place.categoryId || '', true);

  document.title = `${name} | Dalil El Manzala & El Matariya`;

  const rawCover = place.coverImageUrl || (isAtm ? ATM_UNIFIED_COVER : defaultAssets.coverImageUrl);
  const rawLogo = place.logoUrl || (isAtm ? ATM_UNIFIED_LOGO : defaultAssets.logoUrl);
  const coverUrl = getOptimizedImageUrl(rawCover, IMAGE_SIZES.COVER) || '/assets/images/og-whatsapp.jpg';
  const logoUrl = getOptimizedImageUrl(rawLogo, IMAGE_SIZES.LOGO);

  const placeId = place.id || place._key || place.slug;
  const isFav = isFavorite(placeId);
  const verifiedBadge = (place.isVerified || place.is_verified) ? renderVerifiedBadge() : '';
  const liveHours = getPlaceLiveStatus(place.openHours || place.workingHours);
  const liveHoursBadge = (!isAtm && liveHours && !liveHours.isUnknown) ? `
    <span class="badge" style="background:${liveHours.isOpen ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};color:${liveHours.color};font-weight:800;font-size:12px;padding:3px 10px;border-radius:var(--radius-full);display:inline-flex;align-items:center;gap:5px">
      <span>${liveHours.isOpen ? '🟢' : '🔴'}</span>
      <span>${liveHours.isOpen ? 'Open Now' : 'Closed Now'}</span>
    </span>
  ` : '';

  $container.innerHTML = `
    <!-- Top Breadcrumb Bar -->
    <div class="container" style="padding-top:var(--space-3)">
      <div class="page-back-bar">
        <button type="button" class="btn-page-back" id="btn-place-back" title="Go Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 19 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
        <nav class="page-breadcrumbs" aria-label="Breadcrumbs">
          <a href="/en/">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="/en/places/">Places</a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${escHtml(name)}</span>
        </nav>
      </div>
    </div>

    <!-- Place Profile Hero -->
    <div class="place-detail-hero">
      <div class="container">
        <div class="place-detail-cover" style="background-image:url('${escAttr(coverUrl)}')">
          <div class="place-detail-cover__overlay"></div>
        </div>
        <div class="place-detail-header-card">
          <div class="place-detail-header-inner">
            <div class="place-detail-logo-wrap">
              ${logoUrl ? `<img src="${escAttr(logoUrl)}" alt="${escAttr(name)}" class="place-detail-logo" />` : '<div class="place-detail-logo-placeholder">🏪</div>'}
            </div>
            <div class="place-detail-info">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                <span class="badge" style="background:var(--surface-2);color:var(--text-secondary);font-size:12px;padding:3px 8px;border-radius:4px">🏷️ ${escHtml(cat)}</span>
                <span class="badge" style="background:var(--surface-2);color:var(--text-secondary);font-size:12px;padding:3px 8px;border-radius:4px">📍 ${escHtml(area)}</span>
                ${liveHoursBadge}
              </div>
              <h1 class="place-detail-title">
                ${escHtml(name)}
                ${verifiedBadge}
              </h1>
              ${desc ? `<p class="place-detail-desc">${escHtml(desc)}</p>` : ''}
              ${address ? `<p class="place-detail-address" style="font-size:13px;color:var(--text-muted);margin-top:4px">📍 ${escHtml(address)}</p>` : ''}
            </div>
            <div class="place-detail-actions-top">
              <button type="button" class="btn btn-outline btn-sm ${isFav ? 'btn-danger' : ''}" id="btn-fav-place">
                <span>${isFav ? '♥ Saved' : '♡ Save Place'}</span>
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-share-place">
                <span>🔗 Share</span>
              </button>
            </div>
          </div>

          <!-- Direct Contact Action Buttons Bar -->
          <div class="place-action-buttons-bar">
            ${place.phone ? `
              <a href="tel:${escAttr(place.phone.replace(/\\D/g, ''))}" class="btn btn-primary" style="flex:1;min-width:140px;justify-content:center">
                <span>📞 Call (${escHtml(place.phone)})</span>
              </a>
            ` : ''}
            ${place.whatsapp ? `
              <a href="${buildContextualWhatsAppLink(place.whatsapp, { source: 'place_page', placeName: name })}" target="_blank" rel="noopener" class="btn" style="background:#25D366;color:#fff;flex:1;min-width:140px;justify-content:center">
                <span>💬 WhatsApp Chat</span>
              </a>
            ` : ''}
            ${(place.mapsLink || place.lat) ? `
              <a href="${escAttr(place.mapsLink || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`)}" target="_blank" rel="noopener" class="btn btn-secondary" style="flex:1;min-width:140px;justify-content:center">
                <span>🗺️ Google Maps</span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Section -->
    <div class="container section">
      <div class="place-detail-layout" style="display:grid;grid-template-columns:2fr 1fr;gap:24px">
        <!-- Main Column -->
        <div class="place-main-col">
          <!-- Overview Card -->
          <div class="card" style="padding:24px;margin-bottom:24px">
            <h2 style="font-size:1.25rem;font-weight:800;color:var(--primary);margin-bottom:16px">About This Business</h2>
            <p style="line-height:1.8;color:var(--text-primary)">
              ${escHtml(desc || `${name} is a local business registered in Dalil El Manzala & El Matariya directory under the ${cat} category, located in ${area}.`)}
            </p>

            ${place.services && place.services.length ? `
              <h3 style="font-size:1.05rem;font-weight:700;margin:20px 0 10px">Services & Features</h3>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${place.services.map(s => `<span class="badge" style="background:var(--surface-2);color:var(--text-primary);padding:4px 10px;border-radius:9999px">✓ ${escHtml(s)}</span>`).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Customer Reviews Card -->
          <div class="card" style="padding:24px;margin-bottom:24px" id="place-reviews-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h2 style="font-size:1.25rem;font-weight:800;color:var(--primary);margin:0">Customer Reviews & Ratings</h2>
            </div>
            <div id="place-reviews-list">
              <p style="color:var(--text-secondary);font-size:14px">Loading customer reviews...</p>
            </div>
          </div>
        </div>

        <!-- Sidebar Column -->
        <div class="place-side-col">
          <!-- Business Info Card -->
          <div class="card" style="padding:20px;margin-bottom:24px">
            <h3 style="font-size:1.1rem;font-weight:800;color:var(--primary);margin-bottom:14px">Business Details</h3>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;font-size:14px">
              <li><strong>Category:</strong> ${escHtml(cat)}</li>
              <li><strong>City / Village:</strong> ${escHtml(area)}</li>
              ${address ? `<li><strong>Address:</strong> ${escHtml(address)}</li>` : ''}
              ${place.phone ? `<li><strong>Phone:</strong> <a href="tel:${escAttr(place.phone)}">${escHtml(place.phone)}</a></li>` : ''}
              ${place.whatsapp ? `<li><strong>WhatsApp:</strong> <a href="https://wa.me/${escAttr(place.whatsapp)}" target="_blank" rel="noopener">${escHtml(place.whatsapp)}</a></li>` : ''}
            </ul>
          </div>

          <!-- Verification / Ownership Card -->
          <div class="card" style="padding:20px;background:var(--surface-2);border:1px dashed var(--border)">
            <h4 style="font-size:1rem;font-weight:700;margin-bottom:8px">Are you the owner of this business?</h4>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
              Claim and verify your profile for free to update contact details, working hours, and special offers.
            </p>
            <a href="/en/free-verification/" class="btn btn-outline btn-sm" style="width:100%;justify-content:center">
              Free Verification & Claim Profile &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-place-back')?.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/en/places/';
  });

  document.getElementById('btn-fav-place')?.addEventListener('click', () => {
    toggleFavorite(placeId);
    renderEnglishPlacePage($container, { slug, user, initialPlace: place });
  });

  document.getElementById('btn-share-place')?.addEventListener('click', async () => {
    const shareData = {
      title: name,
      text: `${name} on Dalil El Manzala & El Matariya Directory`,
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  });

  // Load reviews
  try {
    const reviews = await getPlaceReviews(placeId);
    const reviewsListEl = document.getElementById('place-reviews-list');
    if (reviewsListEl) {
      if (!reviews || !reviews.length) {
        reviewsListEl.innerHTML = `
          <p style="color:var(--text-secondary);font-size:14px;padding:12px 0">No reviews yet. Be the first to review this place!</p>
        `;
      } else {
        reviewsListEl.innerHTML = reviews.map(r => `
          <div style="border-bottom:1px solid var(--border);padding:12px 0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <strong>${escHtml(r.userName || 'Customer')}</strong>
              <span style="color:#F59E0B">★ ${Number(r.rating || 5).toFixed(1)}</span>
            </div>
            <p style="color:var(--text-secondary);font-size:13.5px;margin:0">${escHtml(r.comment || '')}</p>
          </div>
        `).join('');
      }
    }
  } catch (_) {}
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
