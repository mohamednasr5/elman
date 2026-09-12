/**
 * المنزلة وناسها — Search Page (Advanced High-Speed Search)
 * Ultra-fast local-first search with fuzzy Arabic NLP, synonyms, instant filters,
 * background Turso Edge synchronization, and AI Semantic Search.
 */

import { getPublishedPlaces, getCategories, getAllProducts, getActiveOffers, searchPlacesTurso } from '../../core/db.js';
import { getCurrentUser } from '../../core/auth.js';
import { renderPlaceCard, renderPlaceCardSkeleton } from '../components/PlaceCard.js';
import { isPlaceSponsored } from '../components/SponsoredShowcase.js';
import { normalizeArabic, arabicScore, extractSearchKeywords, expandArabicSearchIntent } from '../../utils/arabic.js';
import { isAtmPlace, isAtmReadyAndOperational } from '../../utils/atm.js';
import { aiSmartSearch } from '../../services/ai.service.js';
import { mountVoiceSearchButton } from '../../services/voice.service.js';
import { getUserLocation, sortPlacesByDistance, MANZALA_CENTER } from '../../utils/maps.js';
import { isPhoneSearchQuery, normalizePhoneNumber, matchPlaceByPhone, formatPhoneNumberForDisplay } from '../../utils/phone.js';
import { toast } from '../components/Toast.js';
import { getPlaceLiveStatus } from '../../utils/live-hours.js';

let _searchUserLocation = null;

// Category Synonyms Map for rich matching
const SEARCH_CATEGORY_SYNONYMS = {
  pharmacy: ['صيدليه', 'صيدلية', 'صيدليات', 'دوا', 'دواء', 'ادويه', 'ادوية', 'علاج', 'روشته', 'روشتة', 'مستلزمات طبيه', 'pharmacy'],
  atm: ['atm', 'ماكينه', 'ماكينة', 'ماكينات', 'صراف', 'صرف', 'بنك', 'فلوس', 'سحب', 'ايداع', 'كاش'],
  doctor: ['دكتور', 'طبيب', 'عياده', 'عيادة', 'استشاري', 'اخصائي', 'كشف', 'جراح', 'اسنان', 'باطنه', 'اطفال', 'عظام', 'جلديه', 'عيون', 'قلب', 'دكاتره'],
  restaurant: ['مطعم', 'اكل', 'وجبات', 'كريب', 'بيتزا', 'شاورما', 'برجر', 'فول', 'طعميه', 'مشويات', 'كباب', 'سمك', 'فسيخ', 'حواوشي', 'مطاعم'],
  cafe: ['كافيه', 'مقهى', 'قهوه', 'قهوة', 'كوفي', 'بن', 'شاي', 'عصائر', 'مشروبات', 'شيشه', 'كافيهات'],
  supermarket: ['سوبر ماركت', 'بقاله', 'بقالة', 'هايبر', 'ماركت', 'خضار', 'فاكهه', 'فاكهة', 'جبن', 'تموين', 'سوبرماركت'],
  bakery: ['مخبز', 'عيش', 'فينو', 'حلويات', 'تورته', 'تورتة', 'كيك', 'بسبوسه', 'بسبوسة', 'مخبوزات', 'فرن', 'مخابز'],
  roastery: ['محمصه', 'محمصة', 'بن', 'مكسرات', 'تسالي', 'لب', 'كاجو', 'فول سوداني', 'محامص'],
  plumbing: ['سباك', 'سباكه', 'سباكة', 'فني سباكة', 'بتاع سباكة', 'صنايعي سباكة', 'سباك منازل', 'ادوات صحيه', 'ادوات صحية', 'مواسير', 'خلاطات', 'فلتر', 'سباكين'],
  carpenter: ['نجار', 'نجاره', 'نجارة', 'فني نجارة', 'صنايعي نجارة', 'بتاع نجارة', 'نجار موبيليا', 'خشب', 'غرف نوم', 'موبيليا', 'ابواب', 'شبابيك', 'نجارين'],
  electrician: ['كهربائي', 'كهرباء', 'فني كهربا', 'فني كهرباء', 'بتاع كهربا', 'صنايعي كهربا', 'كهربائي منازل', 'فني كهربائي', 'تصليح كهربا', 'تأسيس كهرباء', 'مفاتيح', 'صيانة كهربائية', 'ليدات', 'كهربائيه'],
  mechanic: ['ميكانيكي', 'فني ميكانيكا', 'بتاع عربيات', 'صنايعي ميكانيكا', 'سيارات', 'صيانة سيارات', 'زيوت', 'قطع غيار', 'كاوتش', 'ميكانيكيه']
};

export async function renderSearchPage($container, { q = '', user } = {}) {
  const initialQ = (q || '').trim();

  $container.innerHTML = `
    <div class="container" style="padding-top:var(--space-3)">
      <div class="page-back-bar">
        <button type="button" class="btn-page-back" id="btn-search-back" title="الرجوع للصفحة السابقة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 19 12 12 5"></polyline>
          </svg>
          <span>رجوع</span>
        </button>
        <nav class="page-breadcrumbs" aria-label="مسار التنقل">
          <a href="index.html">الرئيسية</a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">البحث المتقدم</span>
        </nav>
      </div>
    </div>

    <!-- Embedded Luxury Search CSS to guarantee 100% immediate rendering -->
    <style id="search-page-luxury-styles">
      .search-page-hero-luxury {
        position: relative !important;
        overflow: hidden !important;
        background: linear-gradient(135deg, #0A192F 0%, #0F2D59 50%, #0369A1 100%) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
        border-radius: 0 0 32px 32px !important;
        box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.45) !important;
        padding: 44px 16px 40px 16px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 20px !important;
      }
      [data-theme="dark"] .search-page-hero-luxury {
        background: radial-gradient(120% 120% at 50% 0%, #0A192F 0%, #061529 60%, #020813 100%) !important;
      }
      .search-hero-orb {
        position: absolute !important;
        border-radius: 50% !important;
        pointer-events: none !important;
        filter: blur(50px) !important;
        z-index: 1 !important;
      }
      .search-hero-orb-1 {
        top: -60px !important;
        right: 10% !important;
        width: 320px !important;
        height: 320px !important;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(56, 189, 248, 0) 70%) !important;
        animation: heroOrbFloat1 8s ease-in-out infinite alternate !important;
      }
      .search-hero-orb-2 {
        bottom: -80px !important;
        left: 8% !important;
        width: 380px !important;
        height: 380px !important;
        background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0) 70%) !important;
        animation: heroOrbFloat2 10s ease-in-out infinite alternate !important;
      }
      @keyframes heroOrbFloat1 {
        0% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-25px, 20px) scale(1.1); }
        100% { transform: translate(20px, -15px) scale(0.95); }
      }
      @keyframes heroOrbFloat2 {
        0% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(30px, -25px) scale(1.08); }
        100% { transform: translate(-20px, 15px) scale(0.92); }
      }
      .search-hero-badge-wrap {
        display: flex !important;
        justify-content: center !important;
        margin-bottom: 14px !important;
      }
      .search-hero-badge {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 6px 18px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.12) !important;
        border: 1px solid rgba(255, 255, 255, 0.25) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        color: #E0F2FE !important;
        font-size: 0.82rem !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18) !important;
      }
      .search-hero-badge-icon {
        font-size: 15px !important;
        display: inline-block !important;
        animation: heroIconPulse 2s ease-in-out infinite !important;
      }
      @keyframes heroIconPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.25); }
      }
      .search-hero-title {
        font-size: clamp(1.6rem, 3.8vw, 2.35rem) !important;
        font-weight: 900 !important;
        color: #FFFFFF !important;
        margin: 0 0 10px 0 !important;
        line-height: 1.35 !important;
        letter-spacing: -0.5px !important;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4) !important;
      }
      .search-hero-title-icon {
        display: inline-block !important;
        margin-left: 6px !important;
        animation: heroIconWiggle 3.5s ease-in-out infinite !important;
      }
      @keyframes heroIconWiggle {
        0%, 100% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(-8deg) scale(1.08); }
        75% { transform: rotate(8deg) scale(1.08); }
      }
      .search-hero-title-gradient {
        background: linear-gradient(135deg, #38BDF8 0%, #60A5FA 50%, #93C5FD 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        display: inline-block !important;
      }
      .search-hero-subtitle {
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: clamp(0.85rem, 2vw, 0.96rem) !important;
        margin: 0 auto 24px auto !important;
        max-width: 660px !important;
        line-height: 1.65 !important;
        font-weight: 500 !important;
      }
      .search-hero-input-stage {
        max-width: 740px !important;
        margin: 0 auto !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .search-pill-glow-wrap {
        position: relative !important;
        border-radius: 9999px !important;
        padding: 3px !important;
        background: linear-gradient(135deg, #38BDF8, #818CF8, #38BDF8) !important;
        box-shadow: 
          0 0 0 2px rgba(255, 255, 255, 0.85),
          0 0 16px 3px #0284C7,
          0 0 28px 6px rgba(2, 132, 199, 0.45),
          0 8px 24px rgba(0, 0, 0, 0.3) !important;
        animation: searchNeonPulse 3s ease-in-out infinite alternate !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }
      @keyframes searchNeonPulse {
        0% {
          box-shadow: 
            0 0 0 2px rgba(255, 255, 255, 0.85),
            0 0 12px 2px #0284C7,
            0 0 22px 4px rgba(2, 132, 199, 0.4),
            0 6px 20px rgba(0, 0, 0, 0.25);
        }
        100% {
          box-shadow: 
            0 0 0 2.5px #FFFFFF,
            0 0 18px 4px #38BDF8,
            0 0 34px 8px rgba(56, 189, 248, 0.65),
            0 10px 28px rgba(0, 0, 0, 0.35);
        }
      }
      .search-pill-glow-wrap:hover,
      .search-pill-glow-wrap:focus-within {
        box-shadow: 
          0 0 0 2.5px #FFFFFF,
          0 0 22px 6px #38BDF8,
          0 0 42px 10px rgba(56, 189, 248, 0.75),
          0 12px 32px rgba(0, 0, 0, 0.4) !important;
        transform: translateY(-2px) !important;
      }
      .search-pill-inner {
        position: relative !important;
        z-index: 2 !important;
        display: flex !important;
        align-items: center !important;
        background: #FFFFFF !important;
        border-radius: 9999px !important;
        height: 60px !important;
        padding: 5px 8px !important;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05) !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }
      [data-theme="dark"] .search-pill-inner {
        background: #0F172A !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
      }
      .search-pill-btn-submit {
        width: 48px !important;
        height: 48px !important;
        min-width: 48px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%) !important;
        color: #FFFFFF !important;
        border: none !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4) !important;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        flex-shrink: 0 !important;
        outline: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .search-pill-btn-submit:hover {
        transform: scale(1.08) rotate(-5deg) !important;
        box-shadow: 0 6px 20px rgba(2, 132, 199, 0.6) !important;
      }
      .search-pill-btn-submit:active {
        transform: scale(0.92) !important;
      }
      .search-pill-btn-submit svg {
        width: 22px !important;
        height: 22px !important;
        stroke: #FFFFFF !important;
      }
      .search-pill-field {
        flex: 1 1 auto !important;
        min-width: 80px !important;
        width: 100% !important;
        border: none !important;
        background: transparent !important;
        color: #0F172A !important;
        font-family: 'Cairo', var(--font-arabic, sans-serif) !important;
        font-size: 16px !important;
        font-weight: 700 !important;
        padding: 0 14px !important;
        outline: none !important;
        box-shadow: none !important;
        direction: rtl !important;
        text-align: right !important;
        -webkit-appearance: none !important;
        appearance: none !important;
      }
      [data-theme="dark"] .search-pill-field {
        color: #FFFFFF !important;
      }
      .search-pill-field::placeholder {
        color: #64748B !important;
        font-weight: 500 !important;
        font-size: 14px !important;
      }
      [data-theme="dark"] .search-pill-field::placeholder {
        color: #94A3B8 !important;
      }
      .search-pill-clear {
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important;
        border-radius: 50% !important;
        border: none !important;
        background: rgba(148, 163, 184, 0.2) !important;
        color: #64748B !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        outline: none !important;
        margin: 0 4px !important;
        flex-shrink: 0 !important;
      }
      .search-pill-clear:hover {
        background: rgba(239, 68, 68, 0.2) !important;
        color: #EF4444 !important;
        transform: scale(1.12) !important;
      }
      .search-pill-sep {
        width: 1px !important;
        height: 28px !important;
        background: #CBD5E1 !important;
        margin: 0 6px !important;
        flex-shrink: 0 !important;
      }
      [data-theme="dark"] .search-pill-sep {
        background: #334155 !important;
      }
      .search-pill-voice-slot {
        display: flex !important;
        align-items: center !important;
        flex-shrink: 0 !important;
        margin-left: 2px !important;
      }
      .search-pill-voice-slot .btn-voice-search {
        position: static !important;
        width: 44px !important;
        height: 44px !important;
        min-width: 44px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%) !important;
        border: none !important;
        color: #FFFFFF !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 1.18rem !important;
        cursor: pointer !important;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35) !important;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        outline: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .search-pill-voice-slot .btn-voice-search:hover {
        transform: scale(1.08) !important;
        background: linear-gradient(135deg, #0369A1 0%, #0284C7 100%) !important;
        box-shadow: 0 6px 18px rgba(2, 132, 199, 0.5) !important;
      }
      .search-pill-voice-slot .btn-voice-search:active {
        transform: scale(0.92) !important;
      }
      .search-hero-actions-bar {
        margin-top: 20px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 12px !important;
        flex-wrap: wrap !important;
      }
      .search-ai-magic-btn {
        position: relative !important;
        overflow: hidden !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 8px 20px !important;
        border-radius: 9999px !important;
        background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%) !important;
        border: 1.5px solid rgba(255, 255, 255, 0.35) !important;
        color: #FFFFFF !important;
        font-size: 13.5px !important;
        font-weight: 800 !important;
        cursor: pointer !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        box-shadow: 0 4px 18px rgba(124, 58, 237, 0.4) !important;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        outline: none !important;
      }
      .search-ai-magic-btn:hover {
        transform: translateY(-2px) scale(1.04) !important;
        box-shadow: 0 8px 26px rgba(124, 58, 237, 0.6) !important;
        border-color: #C084FC !important;
      }
      .search-ai-magic-btn:active {
        transform: scale(0.96) !important;
      }
      .ai-sparkle-icon {
        font-size: 15px !important;
        display: inline-block !important;
        animation: aiSparkleRotate 3s ease-in-out infinite !important;
      }
      @keyframes aiSparkleRotate {
        0%, 100% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(15deg) scale(1.2); }
      }
      .search-hero-actions-sep {
        color: rgba(255, 255, 255, 0.35) !important;
        font-size: 14px !important;
        user-select: none !important;
      }
      .search-hero-actions-label {
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 13.5px !important;
        font-weight: 700 !important;
        user-select: none !important;
      }
      .search-hero-chips-wrap {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        flex-wrap: wrap !important;
      }
      .search-quick-city-chip {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 6px 15px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.16) !important;
        border: 1.5px solid rgba(255, 255, 255, 0.28) !important;
        color: #FFFFFF !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15) !important;
        outline: none !important;
      }
      .search-quick-city-chip:hover {
        transform: translateY(-2px) scale(1.05) !important;
        background: #FFFFFF !important;
        border-color: #FFFFFF !important;
        color: #0284C7 !important;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25) !important;
      }
      .search-quick-city-chip:active {
        transform: scale(0.95) !important;
      }
      .search-quick-city-chip.is-active {
        background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%) !important;
        border-color: #38BDF8 !important;
        color: #FFFFFF !important;
        box-shadow: 0 4px 16px rgba(2, 132, 199, 0.5) !important;
      }
      @media (max-width: 640px) {
        .search-page-hero-luxury {
          padding: 30px 14px 26px 14px !important;
          border-radius: 0 0 24px 24px !important;
        }
        .search-hero-title {
          font-size: 1.55rem !important;
        }
        .search-hero-subtitle {
          font-size: 0.85rem !important;
          margin-bottom: 20px !important;
        }
        .search-pill-inner {
          height: 54px !important;
          padding: 4px 6px !important;
        }
        .search-pill-btn-submit {
          width: 42px !important;
          height: 42px !important;
          min-width: 42px !important;
        }
        .search-pill-btn-submit svg {
          width: 20px !important;
          height: 20px !important;
        }
        .search-pill-voice-slot .btn-voice-search {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          font-size: 1.05rem !important;
        }
        .search-pill-field {
          font-size: 14.5px !important;
          padding: 0 10px !important;
        }
        .search-hero-actions-bar {
          gap: 8px !important;
        }
        .search-ai-magic-btn {
          width: 100% !important;
          justify-content: center !important;
          padding: 9px 16px !important;
        }
        .search-hero-actions-sep {
          display: none !important;
        }
        .search-hero-actions-label {
          width: 100% !important;
          text-align: center !important;
        }
        .search-hero-chips-wrap {
          justify-content: center !important;
        }
        .search-quick-city-chip {
          padding: 5px 12px !important;
          font-size: 12px !important;
        }
      }
    </style>

    <!-- Search Hero Header (Luxury 2026 Redesign) -->
    <div class="search-page-hero-luxury" style="background:linear-gradient(135deg,#0A192F 0%,#0F2D59 50%,#0369A1 100%);color:#FFFFFF;padding:44px 16px 40px 16px;border-radius:0 0 32px 32px;position:relative;overflow:hidden">
      <!-- Ambient Glowing Backdrop Orbs -->
      <div class="search-hero-orb search-hero-orb-1" aria-hidden="true"></div>
      <div class="search-hero-orb search-hero-orb-2" aria-hidden="true"></div>

      <div class="container text-center" style="position:relative;z-index:2">
        <!-- Floating Shimmer Tag Badge -->
        <div class="search-hero-badge-wrap" style="display:flex;justify-content:center;margin-bottom:14px">
          <span class="search-hero-badge" style="display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:9999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#E0F2FE;font-size:0.82rem;font-weight:700">
            <span class="search-hero-badge-icon">⚡</span>
            <span>البحث الفوري فائق السرعة بالذكاء الاصطناعي 2026</span>
          </span>
        </div>

        <!-- Main Title -->
        <h1 class="search-hero-title" style="font-size:clamp(1.6rem,3.8vw,2.35rem);font-weight:900;color:#FFFFFF;margin:0 0 10px 0">
          <span class="search-hero-title-icon" aria-hidden="true">🔍</span>
          <span>البحث الذكي في </span>
          <span class="search-hero-title-gradient">دليل المنزلة والمطرية</span>
        </h1>

        <!-- Subtitle -->
        <p class="search-hero-subtitle" style="color:rgba(255,255,255,0.9);font-size:clamp(0.85rem,2vw,0.96rem);margin:0 auto 24px auto;max-width:660px;line-height:1.65;font-weight:500">
          ابحث بالاسم، النشاط التجاري، التخصص الطبي، الصنايعية والحرفيين، أو برقم الهاتف في كافة المدن والقرى
        </p>

        <!-- Search Input Stage (Neon Glow Aura Pill) -->
        <div class="search-hero-input-stage" style="max-width:740px;margin:0 auto;width:100%">
          <div class="search-pill-glow-wrap" id="search-pill-glow-wrap" style="border-radius:9999px;padding:3px;background:linear-gradient(135deg,#38BDF8,#818CF8,#38BDF8);width:100%">
            <div class="search-pill-inner" role="search" style="background:#FFFFFF;border-radius:9999px;height:60px;display:flex;align-items:center;padding:5px 8px;width:100%;box-sizing:border-box">
              <!-- Right Circular Search Submit Button (First in RTL) -->
              <button class="search-pill-btn-submit" id="search-page-btn" aria-label="تنفيذ البحث" title="ابحث الآن" style="width:48px;height:48px;min-width:48px;border-radius:50%;background:linear-gradient(135deg,#0284C7 0%,#0369A1 100%);color:#FFFFFF;border:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;stroke:#FFFFFF">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              <!-- Main Input Field -->
              <input
                type="search"
                id="search-page-input"
                class="search-pill-field"
                placeholder="ابحث عن مكان، دكتور، صيدلية، مطعم، سباك، أو برقم الهاتف..."
                value="${escAttr(initialQ)}"
                autocomplete="off"
                aria-label="اكتب ما تبحث عنه"
                style="flex:1 1 auto;width:100%;min-width:80px;border:none;background:transparent;color:#0F172A;font-size:16px;font-weight:700;padding:0 14px;outline:none;direction:rtl;text-align:right"
              />

              <!-- Smooth Clear Button -->
              <button type="button" class="search-pill-clear" id="btn-search-clear" aria-label="مسح البحث" title="مسح النص" style="display:${initialQ ? 'inline-flex' : 'none'};width:32px;height:32px;min-width:32px;border-radius:50%;border:none;background:rgba(148,163,184,0.2);color:#64748B;align-items:center;justify-content:center;cursor:pointer;font-size:13px;font-weight:800;margin:0 4px">
                ✕
              </button>

              <!-- Divider -->
              <div class="search-pill-sep" aria-hidden="true" style="width:1px;height:28px;background:#CBD5E1;margin:0 6px;flex-shrink:0"></div>

              <!-- Dedicated Voice Search Slot -->
              <div class="search-pill-voice-slot" id="search-page-voice-slot" style="display:flex;align-items:center;flex-shrink:0">
                <!-- Voice button mounted cleanly via mountVoiceSearchButton -->
              </div>
            </div>
          </div>

          <!-- Quick Actions & Cities Row -->
          <div class="search-hero-actions-bar" style="margin-top:20px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
            <button type="button" class="search-ai-magic-btn" id="btn-ai-search" title="تحليل نية البحث واقتراح أفضل النتائج بالذكاء الاصطناعي" style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:9999px;background:linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%);border:1.5px solid rgba(255,255,255,0.35);color:#FFFFFF;font-size:13.5px;font-weight:800;cursor:pointer">
              <span class="ai-sparkle-icon">✨</span>
              <span>بحث ذكي بالذكاء الاصطناعي</span>
            </button>

            <span class="search-hero-actions-sep" aria-hidden="true" style="color:rgba(255,255,255,0.35);font-size:14px">|</span>
            <span class="search-hero-actions-label" style="color:rgba(255,255,255,0.9);font-size:13.5px;font-weight:700">📍 مدن سريعة:</span>

            <div class="search-hero-chips-wrap" style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap">
              <button type="button" class="search-quick-city-chip" data-quick-area="المنزلة" style="display:inline-flex;align-items:center;gap:6px;padding:6px 15px;border-radius:9999px;background:rgba(255,255,255,0.16);border:1.5px solid rgba(255,255,255,0.28);color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer">🏙️ المنزلة</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="المطرية" style="display:inline-flex;align-items:center;gap:6px;padding:6px 15px;border-radius:9999px;background:rgba(255,255,255,0.16);border:1.5px solid rgba(255,255,255,0.28);color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer">🌊 المطرية</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="العصافرة" style="display:inline-flex;align-items:center;gap:6px;padding:6px 15px;border-radius:9999px;background:rgba(255,255,255,0.16);border:1.5px solid rgba(255,255,255,0.28);color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer">🌾 العصافرة</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="الجمالية" style="display:inline-flex;align-items:center;gap:6px;padding:6px 15px;border-radius:9999px;background:rgba(255,255,255,0.16);border:1.5px solid rgba(255,255,255,0.28);color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer">🏛️ الجمالية</button>
              <button type="button" class="search-quick-city-chip" data-quick-area="ميت سلسيل" style="display:inline-flex;align-items:center;gap:6px;padding:6px 15px;border-radius:9999px;background:rgba(255,255,255,0.16);border:1.5px solid rgba(255,255,255,0.28);color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer">🏢 ميت سلسيل</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Results Container -->
    <div class="container section" style="padding-top:0">
      
      <!-- Modern Filter Card -->
      <div class="search-filter-card">
        <div class="search-filters-bar">
          <!-- 1. Category Filter -->
          <div class="search-filter-select-wrap">
            <label class="search-filter-label" for="search-category-select">📂 القسم / النشاط</label>
            <select id="search-category-select" class="search-filter-select">
              <option value="all">كافة التصنيفات والأنشطة</option>
              <option value="restaurants">🍔 مطاعم ومأكولات</option>
              <option value="cafes">☕ كافيهات ومقاهي</option>
              <option value="doctors">🩺 أطباء وعيادات</option>
              <option value="pharmacies">💊 صيدليات ومستلزمات طبية</option>
              <option value="supermarkets">🛒 سوبر ماركت ومواد غذائية</option>
              <option value="bakeries">🥖 مخابز وحلواني</option>
              <option value="crafts">🛠️ صنايعية ومهن حرفية</option>
              <option value="clothing">👗 ملابس وأزياء</option>
              <option value="electronics">📱 إلكترونيات وموبايلات</option>
              <option value="services">🏢 بنوك وماكينات ATM وخدمات</option>
              <option value="automotive">🚗 سيارات وصيانة</option>
            </select>
          </div>

          <!-- 2. Area Filter -->
          <div class="search-filter-select-wrap">
            <label class="search-filter-label" for="search-area-select">📍 المدينة / القرية</label>
            <select id="search-area-select" class="search-filter-select">
              <option value="all">كافة المدن والقرى</option>
              <option value="المنزلة">🏙️ المنزلة (المدينة)</option>
              <option value="المطرية">🌊 المطرية (دقهلية)</option>
              <option value="العصافرة">🌾 العصافرة</option>
              <option value="الجمالية">🏛️ الجمالية</option>
              <option value="ميت سلسيل">🏢 ميت سلسيل</option>
              <option value="البصراط">🏡 البصراط</option>
              <option value="العزيزة">🌴 العزيزة</option>
              <option value="الأحمدية">🌾 الأحمدية</option>
              <option value="الروضة">🌺 الروضة</option>
              <option value="الحوتة">🐟 الحوتة</option>
              <option value="النسايمة">🌳 النسايمة</option>
              <option value="ميت خضير">🏘️ ميت خضير</option>
              <option value="ميت شريف">🏡 ميت شريف</option>
            </select>
          </div>

          <!-- 3. Sort Filter -->
          <div class="search-filter-select-wrap">
            <label class="search-filter-label" for="search-sort-select">⚡ ترتيب النتائج</label>
            <select id="search-sort-select" class="search-filter-select">
              <option value="relevance">🎯 الأكثر مطابقة</option>
              <option value="nearest">📍 الأقرب إليّ (GPS)</option>
              <option value="highest-rating">★ الأعلى تقييماً (5.0 → 1.0)</option>
              <option value="most-reviews">💬 الأكثر تقييماً</option>
              <option value="newest">🆕 الأحدث إضافة</option>
            </select>
          </div>
        </div>

        <!-- Smart Quick Filter Pills -->
        <div class="search-smart-filters" id="search-smart-filters" aria-label="فلاتر سريعة">
          <button type="button" class="search-smart-filter is-active" data-smart-filter="all">✨ الكل</button>
          <button type="button" class="search-smart-filter" data-smart-filter="open">🟢 مفتوح الآن</button>
          <button type="button" class="search-smart-filter" data-smart-filter="verified">🛡️ موثق فقط</button>
          <button type="button" class="search-smart-filter" data-smart-filter="top">⭐ تقييم 4.5+</button>
          <button type="button" class="search-smart-filter" data-smart-filter="nearby">📍 الأقرب إليّ</button>
          <button type="button" class="search-smart-filter" data-smart-filter="offers">🏷️ به عروض</button>
        </div>
      </div>

      <!-- Results Meta Summary -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div class="search-results-meta" id="search-meta" style="margin:0;font-size:0.95rem;font-weight:700">
          جاري البحث...
        </div>
        <button type="button" id="btn-reset-filters" class="btn btn-sm btn-outline" style="border-radius:10px;font-size:12px;display:none">
          🔄 إعادة ضبط الفلاتر
        </button>
      </div>

      <!-- Results Grid -->
      <div class="places-grid" id="search-results-grid">
        ${Array(4).fill(renderPlaceCardSkeleton()).join('')}
      </div>

      <!-- Pagination / Load More -->
      <div id="search-pagination-container" style="text-align:center;margin-top:var(--space-6);display:none">
        <button id="btn-load-more-search" class="btn btn-outline" style="padding:10px 28px;border-radius:12px;font-size:14px;font-weight:700">
          عرض المزيد من النتائج ⬇️
        </button>
      </div>
    </div>
  `;

  const searchInput = document.getElementById('search-page-input');
  const searchBtn = document.getElementById('search-page-btn');
  const searchClearBtn = document.getElementById('btn-search-clear');
  const categorySelect = document.getElementById('search-category-select');
  const areaSelect = document.getElementById('search-area-select');
  const sortSelect = document.getElementById('search-sort-select');
  const aiSearchBtn = document.getElementById('btn-ai-search');
  const resetFiltersBtn = document.getElementById('btn-reset-filters');
  const metaEl = document.getElementById('search-meta');
  const gridEl = document.getElementById('search-results-grid');

  let allPlaces = [];
  let activeSmartFilter = 'all';
  let currentUser = getCurrentUser() || user;

  // 1. Ensure Local In-Memory Cache (0ms response)
  async function ensureLocalPlaces() {
    if (allPlaces.length > 0) return allPlaces;
    try {
      allPlaces = await getPublishedPlaces({ limit: 400 });
    } catch (_) {
      allPlaces = [];
    }
    return allPlaces;
  }

  // Pre-hydrate in background immediately
  ensureLocalPlaces().then(() => {
    if (!initialQ && searchInput && !searchInput.value.trim()) {
      applyFiltersAndRender();
    }
  });

  // Apply all active filters & sort on places
  async function applyFiltersAndRender() {
    const q = (searchInput?.value || '').trim();
    const cat = categorySelect?.value || 'all';
    const area = areaSelect?.value || 'all';
    const sortBy = sortSelect?.value || 'relevance';

    // Show reset button if any filter is non-default
    if (resetFiltersBtn) {
      resetFiltersBtn.style.display = (cat !== 'all' || area !== 'all' || activeSmartFilter !== 'all' || q) ? 'inline-flex' : 'none';
    }

    if (searchClearBtn) {
      searchClearBtn.style.display = q ? 'inline-flex' : 'none';
    }

    // Sync selected state on quick area chips
    document.querySelectorAll('[data-quick-area]').forEach(c => {
      c.classList.toggle('is-active', c.getAttribute('data-quick-area') === area);
    });

    // If query looks like a phone number, run phone search
    if (isPhoneSearchQuery(q)) {
      await handlePhoneSearch(q);
      return;
    }

    await ensureLocalPlaces();
    let places = [...allPlaces];

    // Text search scoring
    if (q) {
      const rawClean = extractSearchKeywords(q);
      const normalQ = normalizeArabic(rawClean);
      const queryIntents = expandArabicSearchIntent(q);

      const scored = places.map(place => {
        const nameScore = Math.max(arabicScore(place.name || '', q), arabicScore(place.name || '', rawClean));
        const nameEnScore = place.nameEn ? (place.nameEn.toLowerCase().includes(q.toLowerCase()) ? 90 : 0) : 0;

        let categorySynonymScore = 0;
        const placeCatKey = (place.categoryId || '').toLowerCase();
        const placeCatName = normalizeArabic((place.customCategory || '') + ' ' + (place.categoryName || '')).toLowerCase();
        const placeNameNorm = normalizeArabic(place.name || '').toLowerCase();

        for (const [cKey, syns] of Object.entries(SEARCH_CATEGORY_SYNONYMS)) {
          if (placeCatKey.includes(cKey) || placeCatName.includes(cKey) || placeNameNorm.includes(cKey)) {
            if (syns.some(s => normalQ.includes(s) || s.includes(normalQ) || queryIntents.includes(s))) {
              categorySynonymScore = 95;
              break;
            }
          }
        }

        let specialtyScore = 0;
        if (place.medicalSpecialty) {
          const specNorm = normalizeArabic(place.medicalSpecialty);
          if (specNorm.includes(normalQ) || normalQ.includes(specNorm)) specialtyScore = 95;
        }

        let serviceScore = 0;
        if (Array.isArray(place.services)) {
          place.services.forEach(s => {
            const ns = normalizeArabic(s);
            if (ns.includes(normalQ) || normalQ.includes(ns)) serviceScore = Math.max(serviceScore, 90);
          });
        }

        const addressScore = place.address ? Math.max(arabicScore(place.address, q), arabicScore(place.address, rawClean)) * 0.9 : 0;
        const areaScore = Math.max(arabicScore(place.area || '', q), arabicScore(place.area || '', rawClean)) * 0.85;

        const total = Math.max(nameScore, nameEnScore, categorySynonymScore, specialtyScore, serviceScore, addressScore, areaScore);
        return { place, total };
      })
      .filter(item => item.total > 0 && (!isAtmPlace(item.place) || isAtmReadyAndOperational(item.place, 15)))
      .sort((a, b) => b.total - a.total)
      .map(item => item.place);

      places = scored;
    }

    // Filter by Category Select
    if (cat !== 'all') {
      places = places.filter(p => {
        const pCat = (p.categoryId || '').toLowerCase();
        const pCustom = (p.customCategory || '').toLowerCase();
        const pName = (p.categoryName || '').toLowerCase();
        if (cat === 'restaurants') return pCat.includes('restaurant') || pCat.includes('food') || pCustom.includes('مطعم') || pName.includes('مطعم');
        if (cat === 'cafes') return pCat.includes('cafe') || pCustom.includes('كافيه') || pName.includes('كافيه') || pCustom.includes('قهوة');
        if (cat === 'doctors') return pCat.includes('doctor') || pCat.includes('clinic') || pCustom.includes('طبيب') || pCustom.includes('دكتور');
        if (cat === 'pharmacies') return pCat.includes('pharmacy') || pCustom.includes('صيدلية');
        if (cat === 'supermarkets') return pCat.includes('supermarket') || pCat.includes('grocery') || pCustom.includes('سوبر') || pCustom.includes('ماركت');
        if (cat === 'bakeries') return pCat.includes('bakery') || pCustom.includes('مخبز') || pCustom.includes('حلواني');
        if (cat === 'crafts') return pCat.includes('craft') || pCat.includes('plumbing') || pCat.includes('carpenter') || pCustom.includes('سباك') || pCustom.includes('نجار') || pCustom.includes('كهربائي');
        if (cat === 'clothing') return pCat.includes('clothing') || pCat.includes('fashion') || pCustom.includes('ملابس');
        if (cat === 'electronics') return pCat.includes('electronic') || pCat.includes('mobile') || pCustom.includes('موبايل') || pCustom.includes('كمبيوتر');
        if (cat === 'services') return pCat.includes('atm') || pCat.includes('bank') || pCat.includes('service') || pCustom.includes('بنك');
        if (cat === 'automotive') return pCat.includes('car') || pCat.includes('auto') || pCat.includes('mechanic') || pCustom.includes('سيارات');
        return pCat === cat || pCustom.includes(cat);
      });
    }

    // Filter by Area Select
    if (area !== 'all') {
      places = places.filter(p => {
        const pArea = (p.area || '').toLowerCase();
        const pAddress = (p.address || '').toLowerCase();
        return pArea.includes(area.toLowerCase()) || pAddress.includes(area.toLowerCase());
      });
    }

    // Filter by Smart Pills
    if (activeSmartFilter === 'verified') {
      places = places.filter(p => Boolean(p.isVerified));
    } else if (activeSmartFilter === 'top') {
      places = places.filter(p => Number(p.rating || 0) >= 4.5);
    } else if (activeSmartFilter === 'open') {
      places = places.filter(p => {
        const live = getPlaceLiveStatus(p.openHours || p.workingHours || p.working_hours);
        return live.isOpen === true;
      });
    } else if (activeSmartFilter === 'offers') {
      places = places.filter(p => Number(p.offer_count || p.offerCount || 0) > 0);
    } else if (activeSmartFilter === 'nearby') {
      if (!_searchUserLocation) {
        try { _searchUserLocation = await getUserLocation(); } catch (_) { _searchUserLocation = MANZALA_CENTER; }
      }
      places = sortPlacesByDistance(places, _searchUserLocation);
    }

    // Sorting
    if (sortBy === 'nearest') {
      if (!_searchUserLocation) {
        try {
          _searchUserLocation = await getUserLocation();
          toast.success('تم تحديد موقعك وترتيب الأماكن حسب الأقرب لك 📍');
        } catch (_) {
          _searchUserLocation = MANZALA_CENTER;
        }
      }
      places = sortPlacesByDistance(places, _searchUserLocation);
    } else if (sortBy === 'highest-rating') {
      places.sort((a, b) => (Number(b.rating) || 5.0) - (Number(a.rating) || 5.0));
    } else if (sortBy === 'most-reviews') {
      places.sort((a, b) => (Number(b.reviewCount || b.review_count) || 0) - (Number(a.reviewCount || a.review_count) || 0));
    } else if (sortBy === 'newest') {
      places.sort((a, b) => (b.created_at || b.updated_at || 0) - (a.created_at || a.updated_at || 0));
    }

    renderResultsToDOM(places, q);
  }

  function renderResultsToDOM(places, q) {
    if (!gridEl) return;

    if (metaEl) {
      if (q) {
        metaEl.innerHTML = `تم العثور على <strong style="color:var(--primary);font-size:1.1rem">${places.length}</strong> مكان لـ: "<strong>${escHtml(q)}</strong>" <span style="background:rgba(16,185,129,0.12);color:#059669;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;margin-right:6px">⚡ فوري</span>`;
      } else {
        metaEl.innerHTML = `عرض <strong style="color:var(--primary);font-size:1.1rem">${places.length}</strong> مكان في الدليل`;
      }
    }

    if (places.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;background:var(--surface);border:1px dashed var(--border);border-radius:20px;padding:48px 20px;text-align:center">
          <div style="font-size:3.5rem;margin-bottom:12px">🔍</div>
          <h3 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-bottom:8px">لم نعثر على أماكن مطابقة</h3>
          <p style="color:var(--text-muted);font-size:0.95rem;max-width:500px;margin:0 auto 20px auto">
            جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر (التصنيف أو المنطقة).
          </p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
            <button type="button" class="btn btn-primary btn-sm" id="btn-empty-reset" style="padding:8px 20px;border-radius:10px;font-weight:700">
              🔄 إعادة ضبط الفلاتر
            </button>
            <a href="dashboard.html?section=add" class="btn btn-outline btn-sm" style="padding:8px 20px;border-radius:10px;font-weight:700">
              ➕ إضافة هذا المكان للدليل
            </a>
          </div>
          <div style="margin-top:20px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--text-muted)">اقتراحات شائعة:</span>
            <button class="chip" onclick="searchFor('مطاعم')">🍔 مطاعم</button>
            <button class="chip" onclick="searchFor('صيدلية')">💊 صيدلية</button>
            <button class="chip" onclick="searchFor('دكتور')">🩺 دكتور</button>
            <button class="chip" onclick="searchFor('سباك')">🛠️ سباك</button>
            <button class="chip" onclick="searchFor('المطرية')">🌊 المطرية</button>
          </div>
        </div>
      `;
      document.getElementById('btn-empty-reset')?.addEventListener('click', resetAllFilters);
    } else {
      gridEl.innerHTML = places.map(p => renderPlaceCard(p)).join('');
    }
  }

  async function handlePhoneSearch(query) {
    const qPhone = normalizePhoneNumber(query);
    const displayPhone = formatPhoneNumberForDisplay(qPhone);
    await ensureLocalPlaces();
    let matched = allPlaces.filter(p => matchPlaceByPhone(p, qPhone) && (!isAtmPlace(p) || isAtmReadyAndOperational(p, 15)));

    if (matched.length > 0) {
      toast.success(`تم العثور على (${matched.length}) نشاط مرتبط برقم الهاتف 📞`);
      if (metaEl) {
        metaEl.innerHTML = `📞 تم العثور على <strong>${matched.length}</strong> نشاط مرتبط بالرقم: <span style="direction:ltr;display:inline-block;font-weight:900;color:var(--primary);font-size:15px">${escHtml(displayPhone)}</span>`;
      }
      if (gridEl) gridEl.innerHTML = matched.map(p => renderPlaceCard(p)).join('');
    } else {
      if (metaEl) {
        metaEl.innerHTML = `⚠️ لا يوجد نشاط تجاري مرتبط برقم الهاتف: <span style="direction:ltr;font-weight:800;color:#B45309">${escHtml(displayPhone)}</span>`;
      }
      if (gridEl) {
        gridEl.innerHTML = `
          <div class="empty-state phone-empty-state animate-fade-in" style="grid-column:1/-1;background:var(--surface);border:1.5px solid #F59E0B;border-radius:20px;padding:40px 24px;text-align:center;max-width:640px;margin:1.5rem auto">
            <div style="width:70px;height:70px;border-radius:50%;background:rgba(245,158,11,0.14);color:#D97706;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px auto">
              📞
            </div>
            <h2 style="font-size:1.35rem;font-weight:900;color:var(--text-primary);margin-bottom:8px">
              لا يوجد نشاط مسجل برقم الهاتف هذا
            </h2>
            <div style="display:inline-block;background:rgba(2,132,199,0.08);color:#0284C7;font-weight:900;font-size:16px;padding:6px 20px;border-radius:9999px;margin-bottom:14px;direction:ltr">
              ${escHtml(displayPhone)}
            </div>
            <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;margin:0 0 20px 0">
              لم نعثر على أي نشاط أو محل أو دكتور مسجل بهذا الرقم. إذا كنت صاحب هذا النشاط، يمكنك إضافته مجاناً ليظهر للآلاف فوراً.
            </p>
            <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
              <a href="dashboard.html?section=add&phone=${encodeURIComponent(qPhone)}" class="btn btn-primary" style="padding:10px 22px;border-radius:12px;font-size:13.5px">
                ➕ إضافة هذا النشاط للدليل
              </a>
              <button type="button" class="btn btn-outline" id="btn-phone-clear-search" style="padding:10px 20px;border-radius:12px;font-size:13.5px">
                🔍 البحث باسم آخر
              </button>
            </div>
          </div>
        `;
        document.getElementById('btn-phone-clear-search')?.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            applyFiltersAndRender();
            searchInput.focus();
          }
        });
      }
    }
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = 'all';
    if (areaSelect) areaSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'relevance';
    activeSmartFilter = 'all';
    document.querySelectorAll('.search-smart-filter').forEach(b => {
      b.classList.toggle('is-active', b.dataset.smartFilter === 'all');
    });
    document.querySelectorAll('[data-quick-area]').forEach(c => c.classList.remove('is-active'));
    applyFiltersAndRender();
  }

  // Live Instant Debounce
  let _liveSearchTimer = null;
  let _edgeSyncTimer = null;

  searchInput?.addEventListener('input', (e) => {
    clearTimeout(_liveSearchTimer);
    clearTimeout(_edgeSyncTimer);
    const val = e.target.value;

    // Fast local filter (immediate 40ms)
    _liveSearchTimer = setTimeout(() => {
      applyFiltersAndRender();
    }, 40);

    // Deep Edge search sync after 300ms if query >= 2 chars
    if (val.trim().length >= 2) {
      _edgeSyncTimer = setTimeout(async () => {
        try {
          const tursoRes = await searchPlacesTurso(val.trim(), {
            category: categorySelect?.value !== 'all' ? categorySelect?.value : '',
            area: areaSelect?.value !== 'all' ? areaSelect?.value : '',
            limit: 30
          });
          if (tursoRes && Array.isArray(tursoRes.places) && tursoRes.places.length > 0) {
            const existingKeys = new Set(allPlaces.map(p => p.id || p.slug));
            let addedNew = false;
            tursoRes.places.forEach(tp => {
              if (!existingKeys.has(tp.id) && !existingKeys.has(tp.slug)) {
                allPlaces.push(tp);
                existingKeys.add(tp.id || tp.slug);
                addedNew = true;
              }
            });
            if (addedNew) {
              applyFiltersAndRender();
            }
          }
        } catch (_) {}
      }, 300);
    }
  });

  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      applyFiltersAndRender();
      searchInput.focus();
    }
  });

  searchBtn?.addEventListener('click', () => {
    applyFiltersAndRender();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyFiltersAndRender();
    }
  });

  categorySelect?.addEventListener('change', () => applyFiltersAndRender());
  areaSelect?.addEventListener('change', () => applyFiltersAndRender());
  sortSelect?.addEventListener('change', () => applyFiltersAndRender());
  resetFiltersBtn?.addEventListener('click', resetAllFilters);

  // Smart Pills Click
  document.querySelectorAll('.search-smart-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.search-smart-filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeSmartFilter = btn.dataset.smartFilter || 'all';
      applyFiltersAndRender();
    });
  });

  // Quick Area Chips Click (with toggle)
  document.querySelectorAll('[data-quick-area]').forEach(chip => {
    chip.addEventListener('click', () => {
      const area = chip.getAttribute('data-quick-area');
      if (areaSelect) {
        areaSelect.value = (areaSelect.value === area) ? 'all' : area;
      }
      applyFiltersAndRender();
    });
  });

  // AI Smart Search Button
  aiSearchBtn?.addEventListener('click', async () => {
    const q = searchInput?.value?.trim() || 'أفضل الأماكن';
    await ensureLocalPlaces();
    if (metaEl) metaEl.innerHTML = `✨ جاري التحليل الذكي للبحث عن: "<strong>${escHtml(q)}</strong>"...`;
    try {
      const aiRes = await aiSmartSearch(q, allPlaces);
      if (aiRes && aiRes.results && aiRes.results.length > 0) {
        const matchedIds = new Set(aiRes.results.map(r => r.id));
        const results = allPlaces.filter(p => matchedIds.has(p._key || p.id));
        renderResultsToDOM(results, q);
        if (metaEl) metaEl.innerHTML = `✨ نتائج ذكية مقترحة بالذكاء الاصطناعي لـ: "<strong>${escHtml(q)}</strong>" (${results.length})`;
      } else {
        applyFiltersAndRender();
      }
    } catch (_) {
      applyFiltersAndRender();
    }
  });

  // Global helper for quick search
  window.searchFor = (keyword) => {
    if (searchInput) searchInput.value = keyword;
    applyFiltersAndRender();
  };

  // Back button
  document.getElementById('btn-search-back')?.addEventListener('click', () => {
    if (window.history.length > 1 && document.referrer && !document.referrer.includes('login')) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });

  // Initialize Voice Search Button in dedicated luxury slot
  const voiceSlot = document.getElementById('search-page-voice-slot');
  try {
    mountVoiceSearchButton({
      inputEl: searchInput,
      buttonContainerEl: voiceSlot,
      onSearch: (spokenText) => {
        if (searchInput) searchInput.value = spokenText;
        applyFiltersAndRender();
      }
    });
  } catch (_) {}

  // Trigger initial search if q was passed in URL
  if (initialQ) {
    applyFiltersAndRender();
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
