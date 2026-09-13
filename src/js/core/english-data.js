import { VILLAGE_NAMES_EN, CATEGORY_NAMES_EN, translateArea, translateCategory } from '../utils/category-i18n.js';

const ARABIC_RE = /[\u0600-\u06FF]/;
export const hasArabic = value => ARABIC_RE.test(String(value ?? ''));
export const englishText = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  return text && !hasArabic(text) ? text : fallback;
};

export function englishName(place, fallback = 'Local Business') {
  return englishText(place?.nameEn ?? place?.name_en, '') || englishText(place?.name, fallback);
}
export function englishDescription(place) {
  return englishText(place?.descriptionEn ?? place?.description_en, '') || englishText(place?.description, '');
}
export function englishAddress(place) {
  return englishText(place?.addressEn ?? place?.address_en, '') || englishText(place?.address, '');
}
export function englishArea(place, fallback = 'El Manzala') {
  const raw = place?.areaEn ?? place?.area_en ?? place?.area ?? '';
  if (VILLAGE_NAMES_EN[raw]) return VILLAGE_NAMES_EN[raw];
  const translated = translateArea(raw, true);
  return englishText(translated, fallback);
}
export function englishCategory(place, fallback = 'Local Services') {
  const raw = place?.categoryNameEn ?? place?.category_en ?? place?.categoryName ?? place?.customCategory ?? place?.categoryId ?? '';
  const translated = translateCategory(raw, true);
  if (translated && !hasArabic(translated)) return translated;
  const key = String(raw).trim().toLowerCase().replace(/_/g, '-');
  return CATEGORY_NAMES_EN[key] || englishText(raw, fallback);
}

export function projectPlaceToEnglish(place = {}) {
  return {
    ...place,
    _en: true,
    displayName: englishName(place),
    displayDescription: englishDescription(place),
    displayAddress: englishAddress(place),
    displayArea: englishArea(place),
    displayCategory: englishCategory(place)
  };
}

export function englishServices(place) {
  return Array.isArray(place?.services) ? place.services.map(v => englishText(v, '')).filter(Boolean) : [];
}
