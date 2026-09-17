/**
 * phone.js
 * Comprehensive phone number normalization, query detection, and matching utilities
 * Supports Egyptian mobiles (010, 011, 012, 015) and landlines (050 Dakahlia, 057 Damietta, etc.)
 */

/**
 * Converts Eastern Arabic and Persian/Urdu digits to standard ASCII (0-9)
 */
export function toAsciiDigits(str = '') {
  return String(str || '')
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 1776));
}

/**
 * Normalizes any phone number string:
 * - Converts Arabic/Hindi/Persian digits (٠-٩, ۰-۹) to standard ASCII (0-9)
 * - Removes non-digit characters (+, -, spaces, parentheses)
 * - Resolves country code (+20, 0020, 20) to standard local 0-prefixed number
 */
export function normalizePhoneNumber(raw = '') {
  if (!raw) return '';
  let s = toAsciiDigits(raw).replace(/\D/g, '');

  if (s.startsWith('0020')) s = s.slice(4);
  else if (s.startsWith('20') && (s.startsWith('201') || s.startsWith('205') || s.length >= 11)) s = s.slice(2);

  if (s.startsWith('1') && s.length >= 9) s = '0' + s;
  else if (s.startsWith('5') && s.length >= 7) s = '0' + s;

  return s;
}

/**
 * Checks specifically if a phone number appears to be an incomplete Egyptian mobile number
 * (e.g. 10 digits starting with 01, where an 11-digit mobile was clearly intended)
 */
export function isIncompleteMobilePhone(raw = '') {
  if (!raw) return false;
  let s = toAsciiDigits(raw).replace(/\D/g, '');
  if (s.startsWith('0020')) s = s.slice(4);
  else if (s.startsWith('20') && (s.startsWith('201') || s.length >= 11)) s = s.slice(2);

  if (s.startsWith('1') && !s.startsWith('01') && (s.length === 9 || s.length === 10)) {
    if (/^1[0125]/.test(s)) s = '0' + s;
  }

  // If it starts with 01 (Egyptian mobile prefix: 010, 011, 012, 015) and has 10 digits
  if (s.startsWith('01') && s.length === 10) {
    return true;
  }
  // Also detect 9-digit attempts starting with 01[0125]
  if (/^01[0125]\d{6}$/.test(s)) {
    return true;
  }
  return false;
}

/**
 * Returns detailed validation status and human-friendly messages
 */
export function getPhoneValidationStatus(raw = '') {
  if (!raw) return { isValid: false, isEmpty: true, message: '' };
  const norm = normalizePhoneNumber(raw);
  if (!norm) return { isValid: false, isEmpty: true, message: '' };

  // 1. Incomplete mobile check (10 digits starting with 01)
  if (isIncompleteMobilePhone(raw) || (norm.startsWith('01') && norm.length === 10)) {
    return {
      isValid: false,
      isIncompleteMobile: true,
      message: '⚠️ رقم الهاتف ناقص! لقد كتبت 10 أرقام فقط لرقم موبايل، ورقم الموبايل المصري يتكون من 11 رقماً (مثال: 01xxxxxxxxx).'
    };
  }

  // 2. Dummy numbers check
  if (/^0+$/.test(norm) || /^(\d)\1+$/.test(norm) || /^0?(\d)\1+$/.test(norm)) {
    return { isValid: false, isDummy: true, message: 'رقم الهاتف غير صحيح (أرقام مكررة).' };
  }
  if (/^01[0125](\d)\1{7}$/.test(norm) || /^01\d00000000$/.test(norm)) {
    return { isValid: false, isDummy: true, message: 'رقم الهاتف غير صحيح (أرقام وهمية).' };
  }
  if (norm === '12345678' || norm === '123456789' || norm === '01234567890') {
    return { isValid: false, isDummy: true, message: 'رقم الهاتف غير صحيح.' };
  }

  // 3. Egyptian Mobile: exactly 11 digits starting with 010, 011, 012, 015
  if (/^01[0125]\d{8}$/.test(norm)) {
    return { isValid: true, type: 'mobile', message: '' };
  }

  // If it starts with 01 but is not 11 digits, it is strictly INVALID
  if (norm.startsWith('01')) {
    return {
      isValid: false,
      isIncompleteMobile: norm.length < 11,
      message: `رقم الموبايل غير مكتمل (${norm.length} أرقام من 11).`
    };
  }

  // 4. Hotlines & Unified numbers: 4 to 7 digits (e.g. 17555, 19xxx, 16xxx, 15xxx, corporate short numbers)
  if (norm.length >= 4 && norm.length <= 7 && !norm.startsWith('0')) {
    return { isValid: true, type: 'unified', message: '' };
  }

  // 5. Egyptian Landlines: starting with 02, 03, 04x, 05x, 06x, 08x, 09x (8 to 10 digits)
  if (/^0[2-9]\d{6,8}$/.test(norm)) {
    return { isValid: true, type: 'landline', message: '' };
  }

  // 6. Local Landlines (without area code, 6-8 digits):
  if (/^[2-8]\d{5,7}$/.test(norm)) {
    return { isValid: true, type: 'landline_local', message: '' };
  }

  // 7. General valid international number (8 to 15 digits, not starting with 01)
  if (!norm.startsWith('01') && norm.length >= 8 && norm.length <= 15 && !/^(\d)\1+$/.test(norm)) {
    return { isValid: true, type: 'international', message: '' };
  }

  return { isValid: false, message: 'رقم الهاتف غير صحيح.' };
}

/**
 * Validates whether a phone number is a realistic, non-dummy number.
 * Supports Egyptian mobiles (11 digits), Landlines (8-10 digits), and Unified/Hotlines (4-7 digits).
 * Strictly flags incomplete 10-digit mobile numbers as invalid.
 */
export function isValidPhoneNumber(raw = '') {
  if (!raw) return false;
  return getPhoneValidationStatus(raw).isValid;
}

/**
 * Returns normalized phone number if valid, or empty string if invalid/dummy
 */
export function cleanValidPhone(raw = '') {
  return isValidPhoneNumber(raw) ? normalizePhoneNumber(raw) : '';
}

/**
 * Detects if a search query is intended as a phone number:
 * - Starts with '01' (mobile) or '05' (landline) with at least 3 digits.
 * - Or unified hotline short numbers (e.g. 17555, 19xxx, 16xxx - 4 to 5 digits starting with 1).
 */
export function isPhoneSearchQuery(query = '') {
  const norm = normalizePhoneNumber(query);
  if (!norm) return false;
  // Egyptian mobiles (01...) or landlines (05...)
  if ((norm.startsWith('01') || norm.startsWith('05')) && norm.length >= 3) return true;
  // Egyptian hotlines / unified short numbers (e.g. 17555, 19xxx, 16xxx, 15xxx - typically 4-5 digits)
  if (/^1[5-9]\d{3}$/.test(norm) || (norm.length >= 4 && norm.length <= 5 && /^\d+$/.test(String(query).trim()))) return true;
  return false;
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
      // Support unified numbers like 17555 (length >= 4) as well as regular phone numbers
      if (norm && norm.length >= 4) {
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
  // Unified / Hotline (e.g. 17555, 19666, 16xxx)
  if (norm.length >= 4 && norm.length <= 5 && norm.startsWith('1')) {
    return norm;
  }
  // Egyptian mobile format: 010 3758 1121
  if (norm.length === 11 && norm.startsWith('01')) {
    return `${norm.slice(0, 3)} ${norm.slice(3, 7)} ${norm.slice(7)}`;
  }
  // Landline format: 050 771 2345
  if (norm.length >= 8 && norm.startsWith('05')) {
    return `${norm.slice(0, 3)} ${norm.slice(3, 6)} ${norm.slice(6)}`;
  }
  return norm;
}
