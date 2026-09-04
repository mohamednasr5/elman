/**
 * phone.js
 * Comprehensive phone number normalization, query detection, and matching utilities
 * Supports Egyptian mobiles (010, 011, 012, 015) and landlines (050 Dakahlia, 057 Damietta, etc.)
 */

/**
 * Normalizes any phone number string:
 * - Converts Arabic/Hindi digits (٠-٩) to standard ASCII (0-9)
 * - Removes non-digit characters (+, -, spaces, parentheses)
 * - Resolves country code (+20, 0020, 20) to standard local 0-prefixed number
 */
export function normalizePhoneNumber(raw = '') {
  if (!raw) return '';
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let s = String(raw).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d));
  s = s.replace(/\D/g, '');

  if (s.startsWith('0020')) s = s.slice(4);
  else if (s.startsWith('20') && (s.startsWith('201') || s.startsWith('205') || s.length >= 11)) s = s.slice(2);

  if (s.startsWith('1') && s.length >= 9) s = '0' + s;
  else if (s.startsWith('5') && s.length >= 7) s = '0' + s;

  return s;
}

/**
 * Detects if a search query is intended as a phone number:
 * Starts with '01' (mobile) or '05' (landline) and has at least 3 digits.
 */
export function isPhoneSearchQuery(query = '') {
  const norm = normalizePhoneNumber(query);
  return (norm.startsWith('01') || norm.startsWith('05')) && norm.length >= 3;
}

/**
 * Extracts all valid normalized phone and WhatsApp numbers for a place
 */
export function extractPlacePhoneNumbers(place = {}) {
  if (!place) return [];
  const numbers = new Set();
  const candidates = [
    place.phone,
    place.whatsapp,
    place.contact?.phone,
    place.contact?.whatsapp,
    ...(Array.isArray(place.phones) ? place.phones : []),
    ...(Array.isArray(place.contactNumbers) ? place.contactNumbers : [])
  ];

  candidates.forEach(c => {
    if (c) {
      const norm = normalizePhoneNumber(c);
      if (norm && norm.length >= 6) {
        numbers.add(norm);
      }
    }
  });

  return Array.from(numbers);
}

/**
 * Checks if a place matches a given phone search query
 */
export function matchPlaceByPhone(place, queryPhone) {
  const qNorm = normalizePhoneNumber(queryPhone);
  if (!qNorm) return false;
  const placeNumbers = extractPlacePhoneNumbers(place);
  
  return placeNumbers.some(pNum => {
    if (pNum === qNorm) return true;
    if (qNorm.length >= 4 && pNum.includes(qNorm)) return true;
    if (pNum.length >= 4 && qNorm.includes(pNum)) return true;
    return false;
  });
}

/**
 * Formats a phone number for clean RTL/LTR display
 */
export function formatPhoneNumberForDisplay(phone = '') {
  const norm = normalizePhoneNumber(phone);
  if (!norm) return phone;
  // Egyptian mobile format: 010 3758 1121
  if (norm.length === 11 && norm.startsWith('01')) {
    return ${norm.slice(0, 3)}  ;
  }
  // Landline format: 050 771 2345
  if (norm.length >= 8 && norm.startsWith('05')) {
    return ${norm.slice(0, 3)}  ;
  }
  return norm;
}
