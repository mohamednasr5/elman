/**
 * search-engine.service.js
 * Advanced Local In-Memory Unified Search Engine with Query Deconstruction & Field-Specific Weighting
 */

import { normalizeArabic, stripAl } from '../utils/arabic.js';
import { getPublishedPlaces, getCategories } from '../core/db.js';
import { idbGetAll, STORES } from './idb-cache.service.js';
import { resolveDoctorSpecialty, MEDICAL_SPECIALTY_MAP } from '../utils/specialty.js';
import { MASTER_LOCATIONS, extractLocationFromQuery } from '../utils/locations-data.js';
import { isPlaceOpen } from '../utils/date.js';
import { calculateDistanceKm } from '../utils/maps.js';
import { isPhoneSearchQuery, matchPlaceByPhone } from '../utils/phone.js';

export const EGYPTIAN_DIALECT_SYNONYMS = {
  general_surgery: {
    canonical: 'دكتور جراحة عامة',
    synonyms: ['جراحة عامة', 'جراحه عامه', 'جراح عام', 'دكتور جراحة', 'دكتور جراحه', 'دكتور جراح', 'عيادة جراحة', 'جراحة']
  },
  vascular_surgery: {
    canonical: 'دكتور جراحة أوعية دموية',
    synonyms: ['اوعية دموية', 'أوعية دموية', 'اوعيه دمويه', 'قدم سكري', 'قدم سكرى', 'دوالي', 'دوالى', 'دكتور اوعية دموية', 'جراح اوعية دموية']
  },
  dental: {
    canonical: 'دكتور أسنان',
    synonyms: ['سنان', 'اسنان', 'أسنان', 'دكتور سنان', 'طبيب سنان', 'دكتور اسنان', 'وجع سنان', 'ضروس', 'حشو', 'تجميل اسنان', 'زراعة اسنان', 'تقويم', 'خلع ضرس', 'عيادة اسنان']
  },
  ophthalmology: {
    canonical: 'دكتور عيون',
    synonyms: ['عيون', 'عين', 'رمد', 'دكتور عيون', 'طبيب عيون', 'نظارات', 'بصريات', 'ليزك', 'فحص قاع عين', 'كشف عيون']
  },
  pediatrics: {
    canonical: 'دكتور أطفال',
    synonyms: ['اطفال', 'أطفال', 'طفل', 'بيبي', 'مبتسرين', 'حديثي الولادة', 'تطعيمات اطفال', 'دكتور اطفال', 'طبيب اطفال']
  },
  internal_medicine: {
    canonical: 'دكتور باطنة',
    synonyms: ['باطنة', 'باطنه', 'معدة', 'قولون', 'سكر', 'ضغط', 'كبد', 'جهاز هضمي', 'دكتور باطنة', 'حميات']
  },
  orthopedics: {
    canonical: 'دكتور عظام',
    synonyms: ['عظام', 'مفاصل', 'كسر', 'كسور', 'عمود فقري', 'غضروف', 'ركبة', 'دكتور عظام', 'طبيب عظام', 'جبيرة']
  },
  pharmacy: {
    canonical: 'صيدلية',
    synonyms: ['صيدلية', 'صيدليه', 'اجزاخانة', 'أجزاخانة', 'دوا', 'دواء', 'ادوية', 'أدوية', 'علاج', 'روشتة', 'روشته', 'مستلزمات طبية', 'اسعاف', 'حقن', 'شاش وقطن', 'بامبرز', 'لبن اطفال']
  },
  dairy: {
    canonical: 'معمل ألبان وجبنة',
    synonyms: ['بتاع جبنة', 'بتاع جبنه', 'معمل جبنة', 'معمل البان', 'جبنة', 'جبنه', 'جبنة بيضا', 'جبنة قديمة', 'جبنة رومي', 'قشطة', 'قشطه', 'زبدة', 'زبده', 'سمنة بلدي', 'لبن', 'زبادي', 'مش', 'مورته', 'ألبان']
  },
  supermarket: {
    canonical: 'سوبر ماركت',
    synonyms: ['سوبر ماركت', 'سوبرماركت', 'ماركت', 'بقالة', 'بقاله', 'بقال', 'تموين', 'سلع', 'زيت', 'سكر', 'أرز', 'شعرية', 'مكرونة', 'شيبسي', 'شوكولاتة', 'منظفات', 'سمن']
  },
  roastery: {
    canonical: 'محمصة ولب ومكسرات',
    synonyms: ['محمصة', 'محمصه', 'مقلة', 'مقله', 'تسالي', 'لب', 'مكسرات', 'كاجو', 'فستق', 'عين جمل', 'بن', 'قهوة', 'شوكولاتة', 'ياميش', 'سوداني', 'حبوب']
  },
  bakery: {
    canonical: 'مخبز وحلواني',
    synonyms: ['مخبز', 'فرن', 'عيش', 'عيش بلدي', 'فينو', 'باتيه', 'كرواسون', 'حلواني', 'حلويات', 'تورتة', 'تورته', 'كيك', 'جاتوه', 'بسبوسة', 'كنافة', 'كحك', 'بسكويت']
  },
  restaurant_fish: {
    canonical: 'مطعم أسماك وفسيخ',
    synonyms: ['سمك', 'اسماك', 'أسماك', 'سمك مشوي', 'سمك مقلي', 'جمبري', 'سي فود', 'فسيخ', 'رنجة', 'فسخاني', 'شوي سمك', 'حلقة السمك']
  },
  restaurant_grills: {
    canonical: 'مشويات وكبابجي',
    synonyms: ['مشويات', 'كبابجي', 'كباب', 'كفتة', 'كفته', 'طرب', 'فراخ مشوية', 'شيش طاووق', 'حواوشي', 'مشوي']
  },
  restaurant_fastfood: {
    canonical: 'وجبات سريعة ومطاعم',
    synonyms: ['مطعم', 'اكل', 'وجبات', 'ساندوتشات', 'كريب', 'بيتزا', 'شاورما', 'برجر', 'فرايد تشيكن', 'بروستد', 'كشري', 'فول وطعمية']
  },
  cafe_juice: {
    canonical: 'كافيه وعصائر فريش',
    synonyms: ['كافيه', 'مقهى', 'قهوة بلدي', 'عصير', 'قصب', 'سموذي', 'كوكتيل فواكه', 'ايس كوفي', 'شاي']
  },
  auto_repair: {
    canonical: 'صيانة سيارات وميكانيكا',
    synonyms: ['عربيات', 'عربية', 'عربيه', 'سيارات', 'سيارة', 'ميكانيكي', 'فني ميكانيكا', 'بتاع عربيات', 'صنايعي ميكانيكا', 'صيانة عربيات', 'عفشة', 'كهربائي سيارات', 'سمكري', 'دوكو', 'زيوت', 'كاوتش', 'قطع غيار']
  },
  plumbing: {
    canonical: 'سباكة وأدوات صحية',
    synonyms: ['سباك', 'سباكة', 'سباكه', 'فني سباكة', 'بتاع سباكة', 'صنايعي سباكة', 'سباك منازل', 'ادوات صحية', 'مواسير', 'حنفيات', 'خلاطات', 'سيفون', 'تسريب مياه', 'تأسيس سباكة', 'تصليح سباكة', 'فلتر مياه', 'سخان']
  },
  electrical: {
    canonical: 'كهرباء وتأسيس',
    synonyms: [
      'كهربائي', 'كهربا', 'فني كهربا', 'فني كهرباء', 'بتاع كهربا', 'بتاع الكهربا',
      'صنايعي كهربا', 'صنايعي كهرباء', 'كهربائي منازل', 'كهربائي سيارات', 'فني كهربائي',
      'صيانة كهرباء', 'تصليح كهربا', 'تأسيس كهرباء', 'توصيل كهربا', 'لمبات', 'ليدات',
      'اسلاك', 'مفاتيح كهرباء', 'نجف', 'سبوتات', 'ليد بروفايل'
    ]
  },
  carpentry: {
    canonical: 'نجارة وأثاث',
    synonyms: ['نجار', 'نجارة', 'نجاره', 'فني نجارة', 'صنايعي نجارة', 'بتاع نجارة', 'نجار موبيليا', 'اثاث', 'أثاث', 'موبيليا', 'غرف نوم', 'انتريه', 'سفرة', 'ابواب', 'شبابيك', 'مطابخ خشب']
  },
  clothing: {
    canonical: 'ملابس وأزياء',
    synonyms: ['هدوم', 'لبس', 'ملابس', 'محل لبس', 'رجالي', 'حريمي', 'اطفال', 'فساتين', 'بدل', 'عبايات', 'طرح', 'جينز', 'تيشرتات']
  },
  shoes: {
    canonical: 'أحذية وشنط',
    synonyms: ['جزم', 'كوتشيات', 'احذية', 'أحذية', 'شنط', 'جلد', 'صنادل', 'صيانة احذية']
  },
  mobile_phones: {
    canonical: 'هواتف وصيانة موبايل',
    synonyms: ['موبايل', 'موبايلات', 'تليفون', 'هواتف', 'ايفون', 'سامسونج', 'شاشات موبايل', 'صيانة موبايل', 'شاحن', 'سماعات', 'جرابات']
  },
  barber_salon: {
    canonical: 'حلاقة وكوافير',
    synonyms: ['حلاق', 'حلاقة', 'قص شعر', 'كوافير', 'تجميل', 'ميك اب', 'بيوتي سنتر', 'بروتين', 'سيشوار']
  }
};

export function deconstructQuery(query = '') {
  const norm = normalizeArabic(query).trim().toLowerCase();
  
  // Clean conversational prefixes (e.g. "عاوز", "عايز", "محتاج", "بدور على", "فين", "مكان")
  let cleanQuery = norm
    .replace(/^(عاوز|عايز|عاوزه|عايزه|محتاج|محتاجه|محتاجين|بدور على|بدور علي|ابحث عن|شوفلي|هاتلي|قولي على|قولي علي|فين|مكان|دكان|محل|معرض|رقم|تليفون)\s+/g, '')
    .trim();

  // Detect Egyptian craftsman/technician prefix ("فني", "بتاع", "صنايعي", "معلم")
  let tradePrefix = '';
  const tradePrefixMatch = cleanQuery.match(/^(فني|بتاع|صنايعي|معلم)\s+(.+)$/);
  if (tradePrefixMatch) {
    tradePrefix = tradePrefixMatch[1];
    cleanQuery = tradePrefixMatch[2].trim();
  }

  const isDoctor = norm.includes('دكتور') || norm.includes('طبيب') || norm.includes('عياد') || norm.includes('عيادة') || norm.includes('استشاري') || norm.includes('اخصائي') || norm.includes('جراح');
  
  let targetSpecialty = null;
  for (const item of MEDICAL_SPECIALTY_MAP) {
    const isMatched = item.keywords.some(k => norm.includes(normalizeArabic(k)));
    if (isMatched) {
      targetSpecialty = item;
      break;
    }
  }

  const location = extractLocationFromQuery(norm);

  return {
    isDoctor,
    targetSpecialty,
    location,
    normalizedQuery: norm,
    cleanQuery: cleanQuery || norm,
    tradePrefix
  };
}

export class SearchIndex {
  constructor() {
    this.documents = [];
    this.tokenMap = new Map();
    this.isReady = false;
  }

  buildIndex(places = [], categories = []) {
    this.documents = [];
    this.tokenMap.clear();

    const catMap = new Map();
    categories.forEach(c => {
      if (c.slug) catMap.set(c.slug, c);
      if (c._key) catMap.set(c._key, c);
      if (c.id) catMap.set(String(c.id), c);
    });

    places.forEach(place => {
      const cat = catMap.get(place.categoryId) || {};
      const docInfo = resolveDoctorSpecialty(place, cat);
      
      const pName = place.name || '';
      const pCat = cat.name || place.categoryName || place.customCategory || '';
      const pSpec = docInfo.isDoctor ? (docInfo.specialtyLabel || docInfo.specialtyTitle || '') : (place.specialty || place.medicalSpecialty || '');
      const pSub = place.subCategory || '';
      const pDesc = place.description || '';
      const pAddr = place.address || '';
      const pArea = place.area || 'المنزلة';
      const pCity = place.city || (pArea.includes('المطرية') ? 'المطرية' : 'المنزلة');
      const pServices = Array.isArray(place.services) ? place.services.join(' ') : (place.services || '');
      const pKeywords = Array.isArray(place.keywords) ? place.keywords.join(' ') : '';
      const pPhone = place.phone || '';

      const locMatch = extractLocationFromQuery(`${pAddr} ${pArea} ${pCity}`);
      const village = locMatch?.name || (pArea !== 'المنزلة' && pArea !== 'المطرية' ? pArea : 'المنزلة');

      const pNameEn = place.nameEn || place.name_en || '';
      const pDescEn = place.descriptionEn || place.description_en || '';
      const pAddrEn = place.addressEn || place.address_en || '';
      const pCatEn = place.customCategoryEn || place.custom_category_en || cat.name_en || '';
      const pServicesEn = Array.isArray(place.servicesEn) ? place.servicesEn.join(' ') : (Array.isArray(place.services_en) ? place.services_en.join(' ') : '');

      const rawSearchText = [
        pName,
        pNameEn,
        pCat,
        pCatEn,
        pSpec,
        pSub,
        pDesc,
        pDescEn,
        pAddr,
        pAddrEn,
        pArea,
        pCity,
        village,
        pServices,
        pServicesEn,
        pKeywords,
        pPhone
      ].join(' ');

      const normalizedSearchText = normalizeArabic(rawSearchText);

      const doc = {
        id: place.id || place._key || place.slug,
        raw: place,
        name: pName,
        nameNorm: normalizeArabic(pName),
        category: pCat,
        categoryNorm: normalizeArabic(pCat),
        specialty: pSpec,
        specialtyNorm: normalizeArabic(pSpec),
        specialtyKey: docInfo.specialtyKey,
        subCategory: pSub,
        description: pDesc,
        descriptionNorm: normalizeArabic(pDesc),
        address: pAddr,
        area: pArea,
        city: pCity,
        village: village,
        services: pServices,
        servicesNorm: normalizeArabic(pServices),
        phone: pPhone,
        isVerified: Boolean(place.isVerified),
        rating: Number(place.avgRating || place.rating || 5.0),
        reviewsCount: Number(place.reviewsCount || place.totalReviews || 0),
        openHours: place.openHours || place.workingHours || null,
        lat: Number(place.location?.lat || place.lat || 0),
        lng: Number(place.location?.lng || place.lng || 0),
        docInfo,
        searchText: normalizedSearchText,
        tokens: normalizedSearchText.split(/\s+/).filter(t => t.length > 1)
      };

      this.documents.push(doc);

      doc.tokens.forEach(tok => {
        if (!this.tokenMap.has(tok)) {
          this.tokenMap.set(tok, new Set());
        }
        this.tokenMap.get(tok).add(doc);
      });
    });

    this.categories = categories || [];
    this.isReady = true;
  }

  searchCategories(query) {
    if (!query || !query.trim() || !this.categories || this.categories.length === 0) return [];
    const normQ = normalizeArabic(query).trim().toLowerCase();
    const isSingleChar = normQ.length === 1;
    const matches = [];

    for (const cat of this.categories) {
      const name = cat.name || '';
      const nameNorm = normalizeArabic(name);
      const nameNoAl = stripAl(nameNorm);
      const words = nameNorm.split(/\s+/).filter(Boolean);
      let catScore = 0;

      if (nameNorm === normQ) {
        catScore = 3500;
      } else if (nameNorm.startsWith(normQ)) {
        catScore = 3000;
      } else if (nameNoAl.startsWith(normQ)) {
        catScore = 2800;
      } else if (words.some(w => w.startsWith(normQ) || stripAl(w).startsWith(normQ))) {
        catScore = 2400;
      } else if (!isSingleChar && nameNorm.includes(normQ)) {
        catScore = 1200;
      }

      if (catScore >= 1000) {
        matches.push({
          id: cat.id || cat.slug || cat._key,
          slug: cat.slug || cat.id,
          name: cat.name,
          icon: cat.icon || '🏪',
          score: catScore
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 4);
  }

  search(query, options = {}) {
    if (!query || !query.trim()) {
      return this.documents.slice(0, options.limit || 10).map(d => ({ ...d, score: 100 }));
    }

    const { isDoctor, targetSpecialty, location, normalizedQuery: normQ, cleanQuery, tradePrefix } = deconstructQuery(query);
    const effectiveQuery = cleanQuery || normQ;
    const cleanNoAl = stripAl(effectiveQuery);
    const queryTokens = Array.from(new Set([
      ...normQ.split(/\s+/),
      ...effectiveQuery.split(/\s+/)
    ])).filter(Boolean);
    const isSingleChar = effectiveQuery.length === 1;
    const results = [];

    const wantsOpenNow = options.wantsOpenNow || normQ.includes('فاتح') || normQ.includes('شغال') || normQ.includes('دلوقت');
    const userCoords = options.userCoords || null;
    const isPhoneQuery = isPhoneSearchQuery(query);

    for (const doc of this.documents) {
      let score = 0;
      let matchedReason = '';

      // ── 0. PHONE NUMBER DIRECT MATCH (+5000 PTS) ──
      if (isPhoneQuery && matchPlaceByPhone(doc.raw, query)) {
        score += 5000;
        matchedReason = '📞 مطابقة رقم الهاتف';
      }

      const nameNoAl = stripAl(doc.nameNorm);
      const catNoAl = stripAl(doc.categoryNorm);
      const specNoAl = stripAl(doc.specialtyNorm);
      const nameWords = doc.nameNorm.split(/\s+/).filter(Boolean);
      const catWords = doc.categoryNorm.split(/\s+/).filter(Boolean);

      // ── 1. TARGET MEDICAL SPECIALTY EXACT MATCH (+2200 PTS) ──
      if (targetSpecialty && doc.docInfo.isDoctor) {
        if (doc.specialtyKey === targetSpecialty.key) {
          score += 2200;
          matchedReason = `${targetSpecialty.icon} ${targetSpecialty.title}`;
        } else {
          const hasKeyword = targetSpecialty.keywords.some(k => doc.searchText.includes(normalizeArabic(k)));
          if (hasKeyword) {
            score += 1400;
            if (!matchedReason) matchedReason = `${targetSpecialty.icon} ${targetSpecialty.title}`;
          }
        }
      }

      // ── 2. NAME MATCHING (PREFIX-FIRST FOR INSTANT 1-CHAR & SUB-SECOND SEARCH) ──
      if (doc.nameNorm === normQ || doc.nameNorm === effectiveQuery) {
        score += 4000;
        if (!matchedReason) matchedReason = 'مطابقة تامة لاسم المكان';
      } else if (doc.nameNorm.startsWith(normQ) || doc.nameNorm.startsWith(effectiveQuery)) {
        score += 3500;
        if (!matchedReason) matchedReason = `يبدأ بحرف "${effectiveQuery}"`;
      } else if (nameNoAl.startsWith(normQ) || (cleanNoAl && nameNoAl.startsWith(cleanNoAl))) {
        score += 3200;
        if (!matchedReason) matchedReason = `يبدأ بحرف "${cleanNoAl}"`;
      } else if (nameWords.some(w => w.startsWith(normQ) || w.startsWith(effectiveQuery) || (cleanNoAl && (stripAl(w).startsWith(cleanNoAl) || stripAl(w).startsWith(effectiveQuery))))) {
        score += 2800;
        if (!matchedReason) matchedReason = 'إحدى كلمات الاسم تبدأ بالبحث';
      } else if (!isSingleChar && (doc.nameNorm.includes(normQ) || doc.nameNorm.includes(effectiveQuery))) {
        score += 1000;
        if (!matchedReason) matchedReason = 'اسم المكان';
      } else if (!isSingleChar && queryTokens.every(tok => doc.nameNorm.includes(tok))) {
        score += 800;
        if (!matchedReason) matchedReason = 'كلمات اسم المكان';
      } else if (isSingleChar && doc.nameNorm.includes(effectiveQuery)) {
        // Inner character fallback for 1-char query (so prefix hits ALWAYS win)
        score += 180;
        if (!matchedReason) matchedReason = 'مطابقة حرف بالاسم';
      }

      // ── 3. CATEGORY & SPECIALTY PREFIX BOOSTS ──
      const matchesCat = (q) => q && (doc.categoryNorm.startsWith(q) || catNoAl.startsWith(q));
      const matchesCatWord = (q) => q && catWords.some(w => w.startsWith(q) || stripAl(w).startsWith(q));
      const matchesSpec = (q) => q && (doc.specialtyNorm.startsWith(q) || specNoAl.startsWith(q));

      if (matchesCat(normQ) || matchesCat(effectiveQuery) || matchesCat(cleanNoAl)) {
        score += 2500;
        if (!matchedReason) matchedReason = doc.category;
      } else if (matchesCatWord(normQ) || matchesCatWord(effectiveQuery) || matchesCatWord(cleanNoAl)) {
        score += 2200;
        if (!matchedReason) matchedReason = doc.category;
      } else if (matchesSpec(normQ) || matchesSpec(effectiveQuery) || matchesSpec(cleanNoAl)) {
        score += 2400;
        if (!matchedReason) matchedReason = doc.specialty;
      } else if (!isSingleChar && doc.categoryNorm && (doc.categoryNorm.includes(effectiveQuery) || (effectiveQuery.length >= 3 && effectiveQuery.includes(doc.categoryNorm)))) {
        score += 600;
        if (!matchedReason) matchedReason = doc.category;
      } else if (isSingleChar && doc.categoryNorm && doc.categoryNorm.includes(effectiveQuery)) {
        score += 120;
      }

      // ── 4. EGYPTIAN DIALECT & SYNONYM CLUSTERS (+900 PTS) ──
      if (!isSingleChar) {
        const checkPhrases = [normQ, effectiveQuery, tradePrefix ? `${tradePrefix} ${effectiveQuery}` : ''].filter(Boolean);
        for (const [clusterKey, clusterData] of Object.entries(EGYPTIAN_DIALECT_SYNONYMS)) {
          const isQueryInCluster = clusterData.synonyms.some(syn => {
            const nSyn = normalizeArabic(syn);
            return checkPhrases.some(cp => cp === nSyn || cp.startsWith(nSyn + ' ') || cp.endsWith(' ' + nSyn) || cp.includes(' ' + nSyn + ' '));
          });
          if (isQueryInCluster) {
            const isDocInCluster = clusterData.synonyms.some(syn => {
              const nSyn = normalizeArabic(syn);
              return doc.searchText.includes(nSyn);
            });
            if (isDocInCluster) {
              score += 900;
              if (tradePrefix) score += 400; // Extra boost when user explicitly said "فني" / "بتاع" / "صنايعي"
              if (!matchedReason) matchedReason = clusterData.canonical;
              break;
            }
          }
        }
      }

      // ── 5. LOCATION MATCH (+400 PTS) ──
      if (location) {
        const locNorm = normalizeArabic(location.name).toLowerCase();
        if (doc.searchText.includes(locNorm)) {
          score += 400;
        }
      }

      // ── 6. TOKEN OVERLAP (+100 per token) ──
      queryTokens.forEach(tok => {
        if (tok.length > 1 && doc.searchText.includes(tok)) {
          score += 100;
        }
      });

      // ── 7. VERIFIED & QUALITY BOOST (Only if place actually matches query) ──
      if (score > 0) {
        if (doc.isVerified) score += 60;
        score += Math.min(50, Math.floor(doc.rating * 10));

        // ── 8. OPEN NOW BOOST ──
        if (wantsOpenNow && doc.openHours) {
          const isOpen = isPlaceOpen(doc.openHours).isOpen;
          if (isOpen) score += 100;
        }

        // ── 9. DISTANCE PROXIMITY BOOST ──
        if (userCoords && doc.lat && doc.lng) {
          const distKm = calculateDistanceKm(userCoords.lat, userCoords.lng, doc.lat, doc.lng);
          doc.distanceKm = distKm;
          if (distKm <= 2) score += 150;
          else if (distKm <= 5) score += 80;
        }
      }

      // ── 10. SUBSTRING & CHAR MATCH FALLBACK (+120 / +350 pts) ──
      if (score === 0 && (doc.searchText.includes(normQ) || normQ.includes(doc.nameNorm))) {
        score += isSingleChar ? 120 : 350;
        if (!matchedReason) matchedReason = 'مطابقة في الدليل';
      }

      if (score >= 80) {
        results.push({
          ...doc,
          score,
          matchedReason: matchedReason || doc.specialty || doc.category || 'مطابقة في الدليل'
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const limit = options.limit || 10;
    const finalResults = results.slice(0, limit);
    if (options.includeCategories !== false) {
      finalResults.matchingCategories = this.searchCategories(query);
    }
    return finalResults;
  }
}

export const globalSearchIndex = new SearchIndex();

export function warmupSearchEngine(places = [], categories = []) {
  if ((Array.isArray(places) && places.length > 0) || (Array.isArray(categories) && categories.length > 0)) {
    globalSearchIndex.buildIndex(places || [], categories || []);
  }
}

export async function executeFastSearch(query = '', options = {}) {
  // Fast path: if index is already hot in memory, execute synchronously in 0ms!
  if (globalSearchIndex.isReady && globalSearchIndex.documents.length > 0) {
    return globalSearchIndex.search(query, options);
  }

  // 1. Try instant IndexedDB local index first (sub-millisecond)
  try {
    const [idbPlaces, idbCats] = await Promise.all([
      idbGetAll(STORES.PLACES),
      idbGetAll(STORES.CATEGORIES)
    ]);
    if (idbPlaces && idbPlaces.length > 0) {
      globalSearchIndex.buildIndex(idbPlaces, idbCats || []);
      return globalSearchIndex.search(query, options);
    }
  } catch (_) {}

  // 2. If index is still empty, load via getPublishedPlaces
  if (!globalSearchIndex.isReady || globalSearchIndex.documents.length === 0) {
    const [places, categories] = await Promise.all([
      getPublishedPlaces({ limit: 500 }).catch(() => []),
      getCategories().catch(() => [])
    ]);
    globalSearchIndex.buildIndex(places, categories);
  }

  return globalSearchIndex.search(query, options);
}
