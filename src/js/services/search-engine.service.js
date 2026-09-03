/**
 * search-engine.service.js
 * Advanced Local In-Memory Unified Search Engine with Query Deconstruction & Field-Specific Weighting
 */

import { normalizeArabic } from '../utils/arabic.js';
import { getPublishedPlaces, getCategories } from '../core/db.js';
import { resolveDoctorSpecialty, MEDICAL_SPECIALTY_MAP } from '../utils/specialty.js';
import { MASTER_LOCATIONS, extractLocationFromQuery } from '../utils/locations-data.js';
import { isPlaceOpen } from '../utils/date.js';
import { calculateDistanceKm } from '../utils/maps.js';

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
    synonyms: ['عربيات', 'عربية', 'عربيه', 'سيارات', 'سيارة', 'ميكانيكي', 'صيانة عربيات', 'عفشة', 'كهربائي سيارات', 'سمكري', 'دوكو', 'زيوت', 'كاوتش', 'قطع غيار']
  },
  plumbing: {
    canonical: 'سباكة وأدوات صحية',
    synonyms: ['سباك', 'سباكة', 'سباكه', 'ادوات صحية', 'مواسير', 'حنفيات', 'خلاطات', 'سيفون', 'تسريب مياه', 'تأسيس سباكة']
  },
  electrical: {
    canonical: 'كهرباء وإنارة',
    synonyms: ['كهربائي', 'كهربا', 'صيانة كهرباء', 'لمبات', 'ليدات', 'اسلاك', 'مفاتيح كهرباء', 'نجف', 'تأسيس كهرباء']
  },
  carpentry: {
    canonical: 'نجارة وأثاث',
    synonyms: ['نجار', 'نجارة', 'نجاره', 'اثاث', 'أثاث', 'موبيليا', 'غرف نوم', 'انتريه', 'سفرة', 'ابواب', 'شبابيك', 'مطابخ خشب']
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
    normalizedQuery: norm
  };
}

class SearchIndex {
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

      const rawSearchText = [
        pName,
        pCat,
        pSpec,
        pSub,
        pDesc,
        pAddr,
        pArea,
        pCity,
        village,
        pServices,
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

    this.isReady = true;
  }

  search(query, options = {}) {
    if (!query || !query.trim()) {
      return this.documents.slice(0, options.limit || 10).map(d => ({ ...d, score: 100 }));
    }

    const { isDoctor, targetSpecialty, location, normalizedQuery: normQ } = deconstructQuery(query);
    const queryTokens = normQ.split(/\s+/).filter(Boolean);
    const results = [];

    const wantsOpenNow = options.wantsOpenNow || normQ.includes('فاتح') || normQ.includes('شغال') || normQ.includes('دلوقت');
    const userCoords = options.userCoords || null;

    for (const doc of this.documents) {
      let score = 0;
      let matchedReason = '';

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

      // ── 2. EXACT NAME MATCH (+1500 PTS) ──
      if (doc.nameNorm === normQ) {
        score += 1500;
        if (!matchedReason) matchedReason = 'مطابقة تامة لاسم المكان';
      } else if (doc.nameNorm.includes(normQ)) {
        score += 1000;
        if (!matchedReason) matchedReason = 'اسم المكان';
      } else if (queryTokens.every(tok => doc.nameNorm.includes(tok))) {
        score += 800;
        if (!matchedReason) matchedReason = 'كلمات اسم المكان';
      }

      // ── 3. EGYPTIAN DIALECT & SYNONYM CLUSTERS (+700 PTS) ──
      for (const [clusterKey, clusterData] of Object.entries(EGYPTIAN_DIALECT_SYNONYMS)) {
        const isQueryInCluster = clusterData.synonyms.some(syn => normQ.includes(normalizeArabic(syn)));
        if (isQueryInCluster) {
          const isDocInCluster = clusterData.synonyms.some(syn => doc.searchText.includes(normalizeArabic(syn)));
          if (isDocInCluster) {
            score += 700;
            if (!matchedReason) matchedReason = clusterData.canonical;
            break;
          }
        }
      }

      // ── 4. CATEGORY MATCH (+500 PTS) ──
      if (isDoctor && doc.docInfo.isDoctor) {
        score += 500;
      }
      if (doc.categoryNorm.includes(normQ) || normQ.includes(doc.categoryNorm)) {
        score += 500;
        if (!matchedReason) matchedReason = doc.category;
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

      // ── 7. VERIFIED & QUALITY BOOST ──
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

      if (score >= 100) {
        results.push({
          ...doc,
          score,
          matchedReason: matchedReason || doc.specialty || doc.category || 'مطابقة في الدليل'
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const limit = options.limit || 10;
    return results.slice(0, limit);
  }
}

export const globalSearchIndex = new SearchIndex();

export async function executeFastSearch(query = '', options = {}) {
  if (!globalSearchIndex.isReady || globalSearchIndex.documents.length === 0) {
    const [places, categories] = await Promise.all([
      getPublishedPlaces({ limit: 250 }).catch(() => []),
      getCategories().catch(() => [])
    ]);
    globalSearchIndex.buildIndex(places, categories);
  }

  return globalSearchIndex.search(query, options);
}
