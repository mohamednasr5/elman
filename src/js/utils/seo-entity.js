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
  const c = String(category).trim().toLowerCase();

  const map = {
    'cash and balance services': 'خدمات كاش ورصيد',
    'cash-and-balance-services': 'خدمات كاش ورصيد',
    'cash and balance': 'خدمات كاش ورصيد',
    'cash': 'خدمات كاش ورصيد',
    'restaurants and cafes': 'مطاعم وكافيهات',
    'restaurants-and-cafes': 'مطاعم وكافيهات',
    'doctor': 'أطباء وعيادات',
    'pharmacy': 'صيدليات',
    'clothing store': 'محلات ملابس',
    'clothing-store': 'محلات ملابس',
    'phones': 'موبايلات وهواتف',
    'supermarket': 'سوبر ماركت',
    'atm': 'ماكينات صراف آلي ATM',
    'delivery': 'خدمات توصيل وشحن',
    'building-construction': 'مقاولات وبناء',
    'fish shop': 'أسماك ومأكولات بحرية',
    'fish-shop': 'أسماك ومأكولات بحرية',
    'confectioner and cake shop': 'حلويات ومخبوزات',
    'butchery and meat': 'جزارة ولحوم',
    'electrical appliance maintenance': 'صيانة أجهزة كهربائية',
    'sale of computers and laptops': 'كمبيوتر ولاب توب',
    'plumbing': 'سباكة وأدوات صحية',
    'electrician': 'كهرباء وتجهيزات',
    'wedding, engagement and evening dress atelier': 'أتيليه وفساتين',
    'real estate company': 'عقارات واستثمار عقاري',
    'travel and tourism': 'سياحة ورحلات',
    'courses center': 'مراكز تدريب وكورسات',
    'carpenter': 'نجارة وموبيليا',
    'painter': 'دهانات وديكور',
    'tiler': 'سيراميك وبلاط',
    'blacksmith': 'حدادة وكريتال',
    'alumital': 'ألوميتال وزجاج',
    'gym': 'صالات رياضية وجيم',
    'gold-and-jewelry-shops': 'ذهب ومجوهرات',
    'gold and jewelry shops': 'ذهب ومجوهرات',
    'haircut-and-shave': 'صالونات وحلاقة',
    'haircut and shave': 'صالونات وحلاقة',
    'bookstore': 'مكتبات وأدوات مدرسية',
    'auto_repair': 'صيانة سيارات وميكانيكا',
    'auto repair': 'صيانة سيارات وميكانيكا',
    'bakery': 'مخابز وأفران',
    'dentist': 'طب أسنان',
    'pediatrician': 'أطباء أطفال',
    'ophthalmology': 'طب وجراحة عيون',
    'roastery': 'محامص ومقالي تسالي',
    'physical therapy and nutrition center': 'علاج طبيعي وتغذية',
    'institutes and colleges': 'معاهد وكليات',
    'advertising-and-marketing-company': 'دعاية وإعلان وتصميم',
    'henna-art-&-engraving': 'حنة وتجميل',
    'artificial intelligence engineer': 'هندسة وبرمجة وذكاء اصطناعي'
  };

  if (map[c]) return map[c];
  if (map[c.replace(/-/g, ' ')]) return map[c.replace(/-/g, ' ')];
  if (map[c.replace(/\s+/g, '-')]) return map[c.replace(/\s+/g, '-')];
  return category;
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
  const canonicalUrl = `${SITE_DOMAIN}/place/${encodeURIComponent(slug)}/`;
  const categorySlug = encodeURIComponent(String(rawCategory).toLowerCase().replace(/\s+/g, '-'));
  const categoryUrl = `${SITE_DOMAIN}/category/${categorySlug}/`;

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
    ...(Array.isArray(place.paymentMethods || place.payment_methods) && (place.paymentMethods || place.payment_methods).length > 0 ? {
      paymentAccepted: [...new Set((place.paymentMethods || place.payment_methods).map(id => {
        const s = String(id).toLowerCase();
        if (s.includes('vodafone')) return 'Vodafone Cash';
        if (s.includes('insta')) return 'InstaPay';
        if (s.includes('visa') || s.includes('card')) return 'Credit Card';
        if (s.includes('fawry')) return 'Fawry';
        if (s.includes('bank')) return 'Bank Transfer';
        if (s.includes('cash')) return 'Cash';
        return null;
      }).filter(Boolean))]
    } : {}),
    areaServed: COVERAGE_AREAS.map(area => ({
      '@type': 'AdministrativeArea',
      name: area
    }))
  };

  // Geo coordinates: emit only coordinates actually supplied for this place.
  // Never invent city-centre coordinates for an individual business.
  const lat = Number(place.latitude ?? place.location?.lat);
  const lng = Number(place.longitude ?? place.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
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

  // AEO/GEO factual question-and-answer data for the visible page content
  const faqQuestions = [];
  if (place.phone) {
    faqQuestions.push({
      '@type': 'Question',
      name: `ما هو رقم هاتف وتواصل ${rawName}؟`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `رقم هاتف التواصل مع ${rawName} هو ${place.phone}، ويمكنك التواصل معه مباشرة أو عبر واتساب من خلال دليل المنزلة والمطرية الرقمي.`
      }
    });
  }
  faqQuestions.push({
    '@type': 'Question',
    name: `أين يقع ${rawName}؟`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `يقع ${rawName} في ${rawArea}${rawAddress ? ` - ${rawAddress}` : ''}، محافظة الدقهلية.`
    }
  });

  // Payment Q&A: include only methods explicitly stored for this place.
  const pmList = place.paymentMethods || place.payment_methods || [];
  if (Array.isArray(pmList) && pmList.length > 0) {
    const pmNames = [...new Set(pmList.map(id => {
      const s = String(id).toLowerCase();
      if (s.includes('vodafone')) return 'فودافون كاش';
      if (s.includes('insta')) return 'إنستاباي (InstaPay)';
      if (s.includes('visa') || s.includes('card')) return 'فيزا وبطاقات بنكية';
      if (s.includes('fawry')) return 'فوري';
      if (s.includes('bank')) return 'تحويل بنكي';
      if (s.includes('cash')) return 'الدفع نقداً';
      return null;
    }).filter(Boolean))];
    if (pmNames.length > 0) {
      faqQuestions.push({
        '@type': 'Question',
        name: `ما هي طرق الدفع المتاحة لدى ${rawName}؟`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `طرق الدفع المسجلة لدى ${rawName} هي: ${pmNames.join('، ')}.`
        }
      });
    }
  }

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
    schemas: [businessSchema, breadcrumbSchema],
    qa: faqQuestions
  };
}

/**
 * English Local SEO/AEO metadata for a business profile.
 * Uses only facts supplied by the place record; no guessed coordinates or payment methods.
 */
export function generateBusinessSEOEnglish(place) {
  if (!place) return null;
  const rawName = String(place.nameEn || place.name_en || place.name || '').trim() || 'Local business';
  const rawArea = String(place.areaEn || place.area_en || place.area || '').trim() || 'El Manzala & El Matariya';
  const rawAddress = String(place.addressEn || place.address_en || place.address || '').trim();
  const rawCategoryEn = String(place.customCategoryEn || place.custom_category_en || '').trim();
  const rawCategoryId = String(place.categoryId || place.category_id || '').trim();
  const rawCategory = rawCategoryEn || rawCategoryId || String(place.customCategory || place.category || '').trim();
  const catName = rawCategoryEn || rawCategoryId || 'Local Services';
  const slug = String(place.slug || place.id || '').trim();
  const categorySlug = encodeURIComponent(String(rawCategoryId || rawCategoryEn || rawCategory || 'local-services').toLowerCase().replace(/\s+/g, '-'));
  const canonicalUrl = `${SITE_DOMAIN}/en/place/${encodeURIComponent(slug)}/`;
  const categoryUrl = `${SITE_DOMAIN}/en/category/${categorySlug}/`;
  const title = `${rawName} in ${rawArea} | ${catName} | Dalil El Manzala`;
  const description = `Find ${rawName} in ${rawArea}${rawAddress ? ` — Address: ${rawAddress}` : ''}${place.phone ? ` — Phone: ${String(place.phone).trim()}` : ''}. Contact details, location, working hours and local information from Dalil El Manzala & El Matariya.`;
  const image = (() => {
    const v = place.coverImageUrl || place.cover_image_url || place.coverUrl || place.cover_url || place.logoUrl || place.logo_url || place.imageUrl || place.image_url || '';
    return v ? (String(v).startsWith('http') ? String(v) : `${SITE_DOMAIN}/${String(v).replace(/^\/+/, '')}`) : DEFAULT_OG_IMAGE;
  })();
  const schemaType = mapCategoryToSchemaType(rawCategory || place.customCategory || place.category || '');
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${canonicalUrl}#business`,
    name: rawName,
    description: String(place.descriptionEn || place.description_en || '').trim() || description,
    url: canonicalUrl,
    image,
    telephone: place.phone ? String(place.phone).trim() : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: rawAddress || rawArea,
      addressLocality: rawArea || 'El Manzala',
      addressRegion: 'Dakahlia',
      addressCountry: 'EG'
    },
  };
  const lat = Number(place.latitude ?? place.location?.lat);
  const lng = Number(place.longitude ?? place.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    businessSchema.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  }
  const sameAs = [];
  let social = place.social || place.social_json;
  if (typeof social === 'string') { try { social = JSON.parse(social); } catch (_) {} }
  if (social && typeof social === 'object') for (const url of Object.values(social)) if (typeof url === 'string' && url.startsWith('http')) sameAs.push(url.trim());
  if (sameAs.length) businessSchema.sameAs = [...new Set(sameAs)];
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_DOMAIN}/en/` },
      { '@type': 'ListItem', position: 2, name: 'Places', item: `${SITE_DOMAIN}/en/places/` },
      { '@type': 'ListItem', position: 3, name: catName, item: categoryUrl },
      { '@type': 'ListItem', position: 4, name: rawName, item: canonicalUrl }
    ]
  };
  const qa = [];
  if (place.phone) qa.push({ name: `What is the phone number for ${rawName}?`, acceptedAnswer: { text: `The listed phone number for ${rawName} is ${String(place.phone).trim()}.` } });
  qa.push({ name: `Where is ${rawName} located?`, acceptedAnswer: { text: `${rawName} is located in ${rawArea}${rawAddress ? ` at ${rawAddress}` : ''}, Dakahlia, Egypt.` } });
  return { rawName, rawArea, rawAddress, catName, slug, canonicalUrl, categoryUrl, title, description, image, phone: place.phone ? String(place.phone).trim() : null, whatsapp: place.whatsapp ? String(place.whatsapp).trim() : null, schemas: [businessSchema, breadcrumbSchema], qa };
}

/**
 * Generates Local SEO metadata and JSON-LD for a category landing page
 */
export function generateCategorySEO(categoryName, places = []) {
  const catName = getArabicCategoryName(categoryName);
  const categorySlug = encodeURIComponent(String(categoryName).toLowerCase().replace(/\s+/g, '-'));
  const canonicalUrl = `${SITE_DOMAIN}/category/${categorySlug}/`;

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
      url: `${SITE_DOMAIN}/place/${encodeURIComponent(p.slug || p.id)}/`,
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
