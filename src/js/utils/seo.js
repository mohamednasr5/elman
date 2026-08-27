/**
 * المنزلة وناسها — SEO Utility
 * Dynamic meta tags, Schema.org, Open Graph per page
 */

const DEFAULT_TITLE = 'المنزلة وناسها | دليل المنزلة الرقمي';
const DEFAULT_DESC  = 'دليل المنزلة الرقمي — ابحث عن الأطباء والمحلات والخدمات والأماكن في مدينة المنزلة';
const DEFAULT_IMAGE = 'https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/assets/og-default.webp';
const SITE_URL      = window.location.origin;

/**
 * Update page meta tags
 */
export function setMeta({ title, description, image, url, type = 'website', noindex = false } = {}) {
  const t = title ? `${title} | المنزلة وناسها` : DEFAULT_TITLE;
  const d = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  const u = url ? `${SITE_URL}${url}` : window.location.href;

  // Title
  document.title = t;
  setTag('meta[property="og:title"]', 'property', 'og:title', 'content', t);
  setTag('meta[name="twitter:title"]', 'name', 'twitter:title', 'content', t);

  // Description
  setOrCreateMeta('name', 'description', d);
  setTag('meta[property="og:description"]', 'property', 'og:description', 'content', d);
  setTag('meta[name="twitter:description"]', 'name', 'twitter:description', 'content', d);

  // Image
  setTag('meta[property="og:image"]', 'property', 'og:image', 'content', img);
  setTag('meta[name="twitter:image"]', 'name', 'twitter:image', 'content', img);
  setTag('meta[property="og:image:width"]', 'property', 'og:image:width', 'content', '1200');
  setTag('meta[property="og:image:height"]', 'property', 'og:image:height', 'content', '630');

  // URL / Canonical
  setTag('meta[property="og:url"]', 'property', 'og:url', 'content', u);
  setCanonical(u);

  // Type
  setTag('meta[property="og:type"]', 'property', 'og:type', 'content', type);

  // Twitter card
  setOrCreateMeta('name', 'twitter:card', 'summary_large_image');

  // Noindex
  setOrCreateMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
}

/**
 * Inject LocalBusiness schema for a place
 */
export function setPlaceSchema(place, category) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': mapCategoryToSchema(category?.nameEn || 'LocalBusiness'),
    name: place.name,
    description: place.description || '',
    image: place.coverImageUrl || DEFAULT_IMAGE,
    url: `${SITE_URL}/#/place/${place.slug}`,
    telephone: place.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address || '',
      addressLocality: 'المنزلة',
      addressRegion: 'Dakahlia',
      addressCountry: 'EG'
    },
    geo: place.location?.lat ? {
      '@type': 'GeoCoordinates',
      latitude: place.location.lat,
      longitude: place.location.lng
    } : undefined,
    openingHoursSpecification: buildOpeningHours(place.workingHours),
    sameAs: [
      place.social?.facebook,
      place.social?.instagram,
    ].filter(Boolean),
    priceRange: '$$',
    aggregateRating: undefined
  };

  // Remove undefined fields
  const cleaned = JSON.parse(JSON.stringify(schema));
  injectSchema(cleaned, 'place-schema');
}

/**
 * Inject BreadcrumbList schema
 */
export function setBreadcrumbSchema(items) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined
    }))
  };
  injectSchema(schema, 'breadcrumb-schema');
}

/**
 * Inject Product schema
 */
export function setProductSchema(product, placeName) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.imageUrl || undefined,
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: placeName },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EGP',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'
    }
  };

  const cleaned = JSON.parse(JSON.stringify(schema));
  injectSchema(cleaned, 'product-schema');
}

/**
 * Inject Offer schema for a deal
 */
export function setOfferSchema(offer, place) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: offer.title,
    description: offer.description || '',
    price: offer.newPrice,
    priceCurrency: 'EGP',
    validFrom: offer.startDate ? new Date(offer.startDate).toISOString() : undefined,
    validThrough: offer.endDate ? new Date(offer.endDate).toISOString() : undefined,
    seller: {
      '@type': 'LocalBusiness',
      name: place.name
    }
  };

  const cleaned = JSON.parse(JSON.stringify(schema));
  injectSchema(cleaned, 'offer-schema');
}

/**
 * Set FAQ schema
 */
export function setFaqSchema(faqs) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
  injectSchema(schema, 'faq-schema');
}

/**
 * Clean up schemas when navigating away
 */
export function clearSchemas() {
  document.querySelectorAll('script[data-schema]').forEach(el => el.remove());
}

// ── Private helpers ──

function setOrCreateMeta(attr, value, content) {
  let el = document.querySelector(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setTag(selector, attr, attrVal, contentAttr, content) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute(contentAttr, content);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

function injectSchema(schema, id) {
  let el = document.querySelector(`script[data-schema="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-schema', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(schema);
}

function mapCategoryToSchema(categoryNameEn) {
  const map = {
    'pharmacy': 'Pharmacy',
    'doctor': 'Physician',
    'supermarket': 'GroceryStore',
    'bakery': 'Bakery',
    'restaurant': 'Restaurant',
    'delivery': 'DeliveryService',
    'store': 'Store',
  };
  const key = categoryNameEn.toLowerCase();
  return map[key] || 'LocalBusiness';
}

function buildOpeningHours(workingHours) {
  if (!workingHours) return undefined;

  const dayMap = {
    saturday:  'Sa',
    sunday:    'Su',
    monday:    'Mo',
    tuesday:   'Tu',
    wednesday: 'We',
    thursday:  'Th',
    friday:    'Fr'
  };

  return Object.entries(workingHours)
    .filter(([, hours]) => !hours.closed && hours.open && hours.close)
    .map(([day, hours]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${getDayName(dayMap[day])}`,
      opens: hours.open,
      closes: hours.close
    }));
}

function getDayName(abbr) {
  const map = { Mo:'Monday', Tu:'Tuesday', We:'Wednesday', Th:'Thursday', Fr:'Friday', Sa:'Saturday', Su:'Sunday' };
  return map[abbr] || abbr;
}
