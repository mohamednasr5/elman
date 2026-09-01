/**
 * دليل المنزلة والمطرية — Advanced SEO & AI Semantic Discovery Engine
 * Dynamic meta tags, Open Graph, Twitter Cards, and Rich Schema.org (JSON-LD)
 * Canonical Domain: https://dalilmanzala.com
 */

const DEFAULT_TITLE = 'دليل المنزلة والمطرية الرقمي الشامل | أنشطة، أطباء، خدمات، وفرص عمل';
const DEFAULT_DESC  = 'دليل المنزلة والمطرية الرقمي الشامل (dalilmanzala.com) — دليلك الأكبر لجميع المحلات، الأطباء، العيادات، الصيدليات، ماكينات ATM، الحرفيين، الوظائف، والخدمات في المنزلة، المطرية، العصافرة، والقرى المجاورة بمحافظة الدقهلية.';
const DEFAULT_KEYWORDS = 'دليل المنزلة والمطرية, دليل المنزلة, دليل المطرية دقهلية, dalilmanzala, دكتور في المنزلة, صيدلية في المنزلة, صيدلية في المطرية, ماكينات ATM المنزلة, وظائف المنزلة والمطرية, سباك المنزلة, كهربائي المطرية, خدمات الدقهلية, بحيرة المنزلة';
const DEFAULT_IMAGE = 'https://dalilmanzala.com/icons/icon-512x512.png';
const SITE_URL      = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.includes('dalilmanzala')) ? window.location.origin : 'https://dalilmanzala.com';

const REGIONAL_COVERAGE_AREAS = [
  'المنزلة', 'المطرية', 'العصافرة', 'الجمالية', 'ميت سلسيل',
  'البصراط', 'العزيزة', 'الأحمدية', 'الروضة', 'الحوتة',
  'النسايمة', 'ميت خضير', 'ميت شريف', 'الشبول', 'ميت مرجا سلسيل', 'محافظة الدقهلية'
];

/**
 * Update page meta tags dynamically
 */
export function setMeta({ title, description, keywords, image, url, type = 'website', noindex = false } = {}) {
  const t = title ? `${title} | دليل المنزلة والمطرية` : DEFAULT_TITLE;
  const d = description || DEFAULT_DESC;
  const k = keywords || DEFAULT_KEYWORDS;
  const img = image || DEFAULT_IMAGE;
  const u = url ? (url.startsWith('http') ? url : `${SITE_URL}/${url.replace(/^\//, '')}`) : window.location.href;

  // Title
  document.title = t;
  setTag('meta[property="og:title"]', 'property', 'og:title', 'content', t);
  setTag('meta[name="twitter:title"]', 'name', 'twitter:title', 'content', t);

  // Description
  setOrCreateMeta('name', 'description', d);
  setTag('meta[property="og:description"]', 'property', 'og:description', 'content', d);
  setTag('meta[name="twitter:description"]', 'name', 'twitter:description', 'content', d);

  // Keywords
  setOrCreateMeta('name', 'keywords', k);

  // Image
  setTag('meta[property="og:image"]', 'property', 'og:image', 'content', img);
  setTag('meta[name="twitter:image"]', 'name', 'twitter:image', 'content', img);
  setTag('meta[property="og:image:width"]', 'property', 'og:image:width', 'content', '1200');
  setTag('meta[property="og:image:height"]', 'property', 'og:image:height', 'content', '630');

  // URL / Canonical
  setTag('meta[property="og:url"]', 'property', 'og:url', 'content', u);
  setCanonical(u);

  // Type & Site Name
  setTag('meta[property="og:type"]', 'property', 'og:type', 'content', type);
  setTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'content', 'دليل المنزلة والمطرية');
  setTag('meta[property="og:locale"]', 'property', 'og:locale', 'content', 'ar_EG');

  // Twitter card
  setOrCreateMeta('name', 'twitter:card', 'summary_large_image');

  // Robots
  setOrCreateMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
}

/**
 * Inject LocalBusiness / Store / Medical / Restaurant schema for a place
 */
export function setPlaceSchema(place, category) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': mapCategoryToSchema(category?.nameEn || category?.slug || 'LocalBusiness'),
    name: place.name,
    description: place.description || `${place.name} في مدينة ${place.area || 'المنزلة والمطرية'} — العنوان وأرقام الهواتف ومواعيد العمل والتقييمات`,
    image: place.coverImageUrl || place.logoUrl || DEFAULT_IMAGE,
    url: `${SITE_URL}/place.html?slug=${place.slug || place.id}`,
    telephone: place.phone || undefined,
    areaServed: REGIONAL_COVERAGE_AREAS,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address || '',
      addressLocality: place.area || 'المنزلة والمطرية',
      addressRegion: 'الدقهلية (Dakahlia)',
      addressCountry: 'EG'
    },
    geo: place.location?.lat ? {
      '@type': 'GeoCoordinates',
      latitude: Number(place.location.lat),
      longitude: Number(place.location.lng)
    } : {
      '@type': 'GeoCoordinates',
      latitude: 31.1585,
      longitude: 31.9360
    },
    openingHoursSpecification: buildOpeningHours(place.workingHours),
    sameAs: [
      place.social?.facebook,
      place.social?.instagram,
      place.social?.whatsapp ? `https://wa.me/2${place.social.whatsapp.replace(/\D/g, '')}` : null,
      place.social?.website
    ].filter(Boolean),
    priceRange: '$$',
    aggregateRating: place.rating ? {
      '@type': 'AggregateRating',
      ratingValue: Number(place.rating).toFixed(1),
      reviewCount: Math.max(1, Number(place.reviewCount) || 1),
      bestRating: '5',
      worstRating: '1'
    } : undefined
  };

  injectSchema('place-schema', schema);
}

/**
 * Inject BreadcrumbList Schema
 */
export function setBreadcrumbSchema(items) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? (item.url.startsWith('http') ? item.url : `${SITE_URL}/${item.url.replace(/^\//, '')}`) : SITE_URL
    }))
  };

  injectSchema('breadcrumb-schema', schema);
}

/**
 * Inject Website & Google Sitelinks Searchbox Schema
 */
export function setWebsiteSearchSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'دليل المنزلة والمطرية الرقمي',
    alternateName: ['Dalil Manzala', 'دليل المنزلة', 'دليل المطرية'],
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search.html?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  injectSchema('website-search-schema', schema);
}

/**
 * Helper: Inject JSON-LD Schema
 */
function injectSchema(id, schemaObj) {
  if (typeof document === 'undefined') return;
  // Clean undefined
  const cleaned = JSON.parse(JSON.stringify(schemaObj));
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(cleaned, null, 2);
}

function setOrCreateMeta(keyAttr, keyVal, content) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${keyAttr}="${keyVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(keyAttr, keyVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setTag(selector, attr, attrVal, contentAttr, contentVal) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute(contentAttr, contentVal);
}

function setCanonical(url) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

function mapCategoryToSchema(nameEn = '') {
  const lower = nameEn.toLowerCase();
  if (lower.includes('doctor') || lower.includes('clinic')) return 'MedicalBusiness';
  if (lower.includes('pharmacy')) return 'Pharmacy';
  if (lower.includes('restaurant') || lower.includes('food')) return 'Restaurant';
  if (lower.includes('cafe')) return 'CafeOrCoffeeShop';
  if (lower.includes('bank') || lower.includes('atm')) return 'AutomatedTeller';
  if (lower.includes('store') || lower.includes('market')) return 'Store';
  if (lower.includes('hotel')) return 'Hotel';
  return 'LocalBusiness';
}

function buildOpeningHours(workingHours) {
  if (!workingHours) return undefined;
  if (typeof workingHours === 'string') return undefined;

  const daysMap = {
    saturday: 'Saturday', sunday: 'Sunday', monday: 'Monday',
    tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday'
  };

  const specs = [];
  for (const [day, val] of Object.entries(workingHours)) {
    if (val && !val.closed && val.open && val.close) {
      specs.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: daysMap[day] || day,
        opens: val.open,
        closes: val.close
      });
    }
  }
  return specs.length ? specs : undefined;
}
