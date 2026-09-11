/**
 * src/js/utils/seo-entity.js
 * Universal Local SEO, Schema.org (JSON-LD), and Meta Generator for dalilmanzala.com
 * Compatible with Node.js build scripts, Cloudflare Workers, and Browser ESM.
 */

export const SITE_DOMAIN = 'https://dalilmanzala.com';
export const DEFAULT_OG_IMAGE = `${SITE_DOMAIN}/assets/images/og-whatsapp.jpg`;

export const COVERAGE_AREAS = [
  'المنزلة', 'المطرية', 'العصافرة', 'الجمالية', 'ميت سلسيل',
  'البصراط', 'العزيزة', 'الأحمدية', 'الروضة', 'الحوتة',
  'النسايمة', 'ميت خضير', 'ميت شريف', 'الشبول', 'محافظة الدقهلية'
];

/**
 * Escapes HTML characters for safe attribute and text node embedding
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Maps category strings and slugs to appropriate Schema.org types
 */
export function mapCategoryToSchemaType(categoryStr = '') {
  const c = String(categoryStr || '').toLowerCase();

  if (/doctor|clinic|عيادة|طبيب|دكتور|استشاري|اخصائي/.test(c)) return 'Physician';
  if (/dentist|اسنان|أسنان/.test(c)) return 'Dentist';
  if (/pharmacy|صيدلية|صيدليه/.test(c)) return 'Pharmacy';
  if (/restaurant|مطعم|مشويات|وجبات|كريب|شاورما|بيتزا/.test(c)) return 'Restaurant';
  if (/cafe|coffee|كافيه|قهوة|مقهى/.test(c)) return 'CafeOrCoffeeShop';
  if (/bakery|مخبز|حلواني|معجنات/.test(c)) return 'Bakery';
  if (/plumb|سباك|سباكة/.test(c)) return 'Plumber';
  if (/electric|كهرباء|كهربائي/.test(c)) return 'Electrician';
  if (/carpenter|نجار|نجارة|أثاث|موبيليا/.test(c)) return 'HomeAndConstructionBusiness';
  if (/blacksmith|حداد|حدادة|الوميتال/.test(c)) return 'HomeAndConstructionBusiness';
  if (/clothing|ملابس|بدل|عبايات|فساتين/.test(c)) return 'ClothingStore';
  if (/shoe|احذية|أحذية/.test(c)) return 'ShoeStore';
  if (/gold|jewel|ذهب|مجوهرات|صاغة/.test(c)) return 'JewelryStore';
  if (/supermarket|بقالة|هايبر|ماركت/.test(c)) return 'GroceryStore';
  if (/car|ميكانيكي|تصليح سيارات|كاوتش|غسيل سيارات/.test(c)) return 'AutoRepair';
  if (/barber|حلاق|كوافير|بيوتي سنتر|صالون/.test(c)) return 'BeautySalon';
  if (/hotel|فندق|لوكاندا/.test(c)) return 'Hotel';
  if (/real.*estate|عقارات|شقق/.test(c)) return 'RealEstateAgent';
  if (/print|مطبعة|دعاية|إعلانات/.test(c)) return 'ProfessionalService';
  if (/store|محل|معرض|بيع/.test(c)) return 'Store';

  return 'LocalBusiness';
}

/**
 * Generate human-readable Arabic category name from slug or ID
 */
export function getArabicCategoryName(category = '') {
  if (!category) return 'نشاط وخدمة';
  const c = String(category).trim();

  const map = {
    'restaurants and cafes': 'مطاعم وكافيهات',
    'doctor': 'أطباء وعيادات',
    'pharmacy': 'صيدليات',
    'clothing store': 'محلات ملابس',
    'phones': 'موبايلات وهواتف',
    'atm': 'ماكينات صراف آلي ATM',
    'delivery': 'خدمات توصيل وشحن',
    'building-construction': 'مقاولات وبناء',
    'fish shop': 'أسماك ومأكولات بحرية',
    'roastery': 'محامص ومقالي تسالي',
    'physical therapy and nutrition center': 'علاج طبيعي وتغذية',
    'institutes and colleges': 'معاهد وكليات',
    'advertising-and-marketing-company': 'دعاية وإعلان وتصميم',
    'henna-art-&-engraving': 'حنة وتجميل',
    'artificial intelligence engineer': 'هندسة وبرمجة وذكاء اصطناعي'
  };

  if (map[c.toLowerCase()]) return map[c.toLowerCase()];
  return c;
}

/**
 * Generates comprehensive, valid Local SEO metadata and JSON-LD for a business entity
 */
export function generateBusinessSEO(place) {
  if (!place) return null;

  const rawName = (place.name || '').trim() || 'مكان في المنزلة';
  const rawArea = (place.area || '').trim() || 'المنزلة والمطرية';
  const rawAddress = (place.address || '').trim();
  const rawCategory = place.customCategory || place.category || place.categoryId || place.category_id || '';
  const catName = getArabicCategoryName(rawCategory);
  const slug = (place.slug || place.id || '').trim();

  // Canonical Clean URL
  const canonicalUrl = `${SITE_DOMAIN}/place/${encodeURIComponent(slug)}`;
  const categorySlug = encodeURIComponent(String(rawCategory).toLowerCase().replace(/\s+/g, '-'));
  const categoryUrl = `${SITE_DOMAIN}/category/${categorySlug}`;

  // SEO Title: Natural, compelling, within Google's 60-char display budget
  const title = `${rawName} في ${rawArea} | ${catName} | دليل المنزلة والمطرية`;

  // SEO Description: Rich in real local entity facts without keyword stuffing
  let descParts = [];
  descParts.push(`تعرف على ${rawName} في ${rawArea}`);
  if (rawAddress) descParts.push(`العنوان: ${rawAddress}`);
  if (place.phone) descParts.push(`تواصل هاتفياً: ${String(place.phone).trim()}`);
  if (place.whatsapp) descParts.push(`واتساب: ${String(place.whatsapp).trim()}`);
  descParts.push(`مواعيد العمل، الخريطة، والتقييمات في دليل المنزلة والمطرية الرقمي.`);
  const description = descParts.join(' — ');

  // Images
  let image = place.coverImageUrl || place.cover_image_url || place.logoUrl || place.logo_url || DEFAULT_OG_IMAGE;
  if (!image.startsWith('http://') && !image.startsWith('https://')) {
    image = `${SITE_DOMAIN}/${image.replace(/^\/+/, '')}`;
  }

  // Schema Type
  const schemaType = mapCategoryToSchemaType(rawCategory);

  // Parse working hours safely for Schema.org openingHoursSpecification
  let openingHoursSpecs = [];
  let workingHours = place.workingHours || place.working_hours;
  if (typeof workingHours === 'string') {
    try { workingHours = JSON.parse(workingHours); } catch (_) {}
  }
  if (workingHours && typeof workingHours === 'object') {
    const dayMap = {
      saturday: 'Saturday',
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday'
    };
    for (const [dayKey, dayVal] of Object.entries(workingHours)) {
      if (dayMap[dayKey.toLowerCase()] && dayVal && !dayVal.closed && dayVal.open && dayVal.close) {
        openingHoursSpecs.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: dayMap[dayKey.toLowerCase()],
          opens: dayVal.open,
          closes: dayVal.close
        });
      }
    }
  }

  // Parse social links for sameAs
  let sameAs = [];
  let social = place.social || place.social_json;
  if (typeof social === 'string') {
    try { social = JSON.parse(social); } catch (_) {}
  }
  if (social && typeof social === 'object') {
    for (const url of Object.values(social)) {
      if (url && typeof url === 'string' && url.startsWith('http')) {
        sameAs.push(url.trim());
      }
    }
  }

  // Main Business Schema
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${canonicalUrl}#business`,
    name: rawName,
    description: place.description || description,
    url: canonicalUrl,
    image: image,
    telephone: place.phone ? String(place.phone).trim() : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: rawAddress || rawArea,
      addressLocality: rawArea.includes('المطرية') ? 'المطرية' : 'المنزلة',
      addressRegion: 'الدقهلية',
      addressCountry: 'EG'
    },
    areaServed: COVERAGE_AREAS.map(area => ({
      '@type': 'AdministrativeArea',
      name: area
    }))
  };

  // Optional Geo coordinates (only if real and non-zero)
  const lat = Number(place.latitude);
  const lng = Number(place.longitude);
  if (!isNaN(lat) && !isNaN(lng) && lat > 20 && lng > 20) {
    businessSchema.geo = {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng
    };
  }

  // Optional opening hours
  if (openingHoursSpecs.length > 0) {
    businessSchema.openingHoursSpecification = openingHoursSpecs;
  }

  // Optional sameAs social links
  if (sameAs.length > 0) {
    businessSchema.sameAs = sameAs;
  }

  // Optional legitimate Rating / Reviews (NEVER fabricate!)
  const ratingVal = Number(place.rating || 0);
  const reviewCount = Number(place.reviewCount || place.review_count || 0);
  if (ratingVal > 0 && reviewCount > 0) {
    businessSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, ratingVal)),
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  // Breadcrumbs Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: `${SITE_DOMAIN}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'دليل الأماكن',
        item: `${SITE_DOMAIN}/places.html`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: catName,
        item: categoryUrl
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: rawName,
        item: canonicalUrl
      }
    ]
  };

  return {
    rawName,
    rawArea,
    rawAddress,
    catName,
    slug,
    canonicalUrl,
    categoryUrl,
    title,
    description,
    image,
    phone: place.phone ? String(place.phone).trim() : null,
    whatsapp: place.whatsapp ? String(place.whatsapp).trim() : null,
    schemas: [businessSchema, breadcrumbSchema]
  };
}

/**
 * Generates Local SEO metadata and JSON-LD for a category landing page
 */
export function generateCategorySEO(categoryName, places = []) {
  const catName = getArabicCategoryName(categoryName);
  const categorySlug = encodeURIComponent(String(categoryName).toLowerCase().replace(/\s+/g, '-'));
  const canonicalUrl = `${SITE_DOMAIN}/category/${categorySlug}`;

  const title = `${catName} في المنزلة والمطرية | دليل الأنشطة والخدمات الموثقة`;
  const description = `تصفح قائمة ${catName} في المنزلة والمطرية والقرى المجاورة. عناوين دقيقة، أرقام التواصل الفوري، مواعيد العمل، وتقييمات الأهالي بدليل المنزلة والمطرية.`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: `${SITE_DOMAIN}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'التصنيفات والأنشطة',
        item: `${SITE_DOMAIN}/categories.html`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: catName,
        item: canonicalUrl
      }
    ]
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: description,
    itemListElement: places.slice(0, 20).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_DOMAIN}/place/${encodeURIComponent(p.slug || p.id)}`,
      name: p.name
    }))
  };

  return {
    catName,
    categorySlug,
    canonicalUrl,
    title,
    description,
    schemas: [breadcrumbSchema, itemListSchema]
  };
}
