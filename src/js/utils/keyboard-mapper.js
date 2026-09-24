/**
 * المنزلة وناسها — Keyboard & Transliteration Helper
 * Automatically detects when a user accidentally types Arabic search terms using the English keyboard layout,
 * converting keystrokes (e.g. "l'ul" -> "مطعم", "w]gdm" -> "صيدلية", "hlhk" -> "امان", "hglk.gm" -> "المنزلة")
 * or common phonetics/Franco-Arabic, exactly like Google Search.
 */

export const EN_TO_AR_KEYMAP = {
  // Lowercase
  '`': 'ذ', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0', '-': '-', '=': '=',
  'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'د', '\\': '\\',
  'a': 'ش', 's': 'س', 'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ك', '\'': 'ط',
  'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا', 'n': 'ى', 'm': 'ة', ',': 'و', '.': 'ز', '/': 'ظ',

  // Uppercase / Shifted
  '~': 'ّ', '!': '!', '@': '@', '#': '#', '$': '$', '%': '٪', '^': '^', '&': '&', '*': '*', '(': '(', ')': ')', '_': '_', '+': '+',
  'Q': 'َ', 'W': 'ً', 'E': 'ُ', 'R': 'ٌ', 'T': 'لإ', 'Y': 'إ', 'U': '‘', 'I': '÷', 'O': '×', 'P': '؛', '{': '<', '}': '>', '|': '|',
  'A': 'ِ', 'S': 'ٍ', 'D': '[', 'F': ']', 'G': 'لأ', 'H': 'أ', 'J': 'ـ', 'K': '،', 'L': '/', ':': ':', '"': '"',
  'Z': '~', 'X': 'ْ', 'C': '}', 'V': '{', 'B': 'لآ', 'N': 'آ', 'M': '\'', '<': '،', '>': '؛', '?': '؟'
};

export const COMMON_PHONETICS = {
  'restaurant': 'مطعم', 'restaurants': 'مطاعم', 'mat3am': 'مطعم', 'matam': 'مطعم', 'mata3em': 'مطاعم',
  'doctor': 'دكتور', 'doctors': 'أطباء', 'tabib': 'طبيب', 'doktor': 'دكتور', 'daktar': 'دكتور',
  'pharmacy': 'صيدلية', 'pharmacies': 'صيدليات', 'saydalia': 'صيدلية', 'saydalyah': 'صيدلية', 'saydaliyah': 'صيدلية',
  'supermarket': 'سوبر ماركت', 'market': 'ماركت', 'bakala': 'بقالة', 'grocery': 'بقالة',
  'hospital': 'مستشفى', 'mostashfa': 'مستشفى', 'mustashfa': 'مستشفى',
  'clinic': 'عيادة', '3eyada': 'عيادة', 'eyada': 'عيادة',
  'plumber': 'سباك', 'sabak': 'سباك', 'electrician': 'كهربائي', 'kahraba': 'كهرباء',
  'cafe': 'كافيه', 'coffee': 'كافيه', 'ahwa': 'قهوة', 'maqha': 'مقهى',
  'bakery': 'مخبز', 'forn': 'فرن', 'halawiat': 'حلويات',
  'manzala': 'المنزلة', 'el manzala': 'المنزلة', 'elmanzala': 'المنزلة', 'almanzala': 'المنزلة',
  'matariya': 'المطرية', 'el matariya': 'المطرية', 'elmatariya': 'المطرية', 'mataria': 'المطرية',
  'asafra': 'العصافرة', 'elasafra': 'العصافرة', 'gamalia': 'الجمالية', 'mitselsil': 'ميت سلسيل',
  'aman': 'أمان', 'fawry': 'فوري', 'atm': 'صراف آلي ATM', 'bank': 'بنك'
};

/**
 * Checks if the string is primarily composed of Latin characters and punctuation
 * that likely represent an Arabic phrase typed with the wrong keyboard layout.
 */
export function isLikelyMistypedArabic(text) {
  if (!text || typeof text !== 'string') return false;
  const s = text.trim();
  if (s.length < 2) return false;

  // If text already has Arabic characters, it's not a mistyped English layout
  if (/[\u0600-\u06FF]/.test(s)) return false;

  // Check if text has Latin characters or keyboard punctuation
  if (!/[a-zA-Z;'/,\.\[\]]/.test(s)) return false;

  return true;
}

/**
 * Converts English keyboard layout keystrokes into the intended Arabic characters.
 */
export function convertEnKeyboardToAr(text) {
  if (!text || typeof text !== 'string') return '';
  const s = text.trim();
  if (!s) return '';

  // Check direct phonetic dictionary first (e.g. "mat3am" -> "مطعم")
  const lower = s.toLowerCase();
  if (COMMON_PHONETICS[lower]) {
    return COMMON_PHONETICS[lower];
  }

  // If already Arabic, return as-is
  if (/[\u0600-\u06FF]/.test(s) && !/[a-zA-Z]/.test(s)) {
    return s;
  }

  let converted = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    converted += EN_TO_AR_KEYMAP[ch] !== undefined ? EN_TO_AR_KEYMAP[ch] : ch;
  }

  return converted.trim();
}

/**
 * Generates both the original and converted search queries for matching.
 * Returns an object with:
 * { raw: string, converted: string, isConverted: boolean, suggestionHtml: string }
 */
export function getSmartSearchQueries(query) {
  const raw = (query || '').trim();
  if (!raw) return { raw: '', converted: '', isConverted: false, suggestionHtml: '' };

  if (isLikelyMistypedArabic(raw)) {
    const converted = convertEnKeyboardToAr(raw);
    if (converted && converted !== raw && /[\u0600-\u06FF]/.test(converted)) {
      return {
        raw,
        converted,
        isConverted: true,
        suggestionHtml: `هل تقصد: <strong>${escapeHtml(converted)}</strong>؟`
      };
    }
  }

  return { raw, converted: raw, isConverted: false, suggestionHtml: '' };
}

export function initGlobalKeyboardCorrection() {
  if (typeof document === 'undefined') return;

  function attachToInput(input) {
    if (!input || input.dataset.kmAttached) return;
    input.dataset.kmAttached = '1';

    let hintEl = null;

    function removeHint() {
      if (hintEl) {
        hintEl.remove();
        hintEl = null;
      }
    }

    function positionHint() {
      if (!hintEl) return;
      const rect = input.getBoundingClientRect();
      hintEl.style.position = 'absolute';
      hintEl.style.left = `${Math.max(10, rect.left)}px`;
      hintEl.style.top = `${rect.bottom + window.scrollY + 6}px`;
      hintEl.style.zIndex = '99999';
    }

    function updateHint() {
      const val = (input.value || '').trim();
      if (!isLikelyMistypedArabic(val)) {
        removeHint();
        return;
      }
      const converted = convertEnKeyboardToAr(val);
      if (!converted || converted === val || !/[\u0600-\u06FF]/.test(converted)) {
        removeHint();
        return;
      }

      if (!hintEl) {
        hintEl = document.createElement('div');
        hintEl.className = 'km-suggestion-chip';
        document.body.appendChild(hintEl);
      }

      hintEl.innerHTML = `<span>هل تقصد: <strong>${escapeHtml(converted)}</strong>؟</span> <button type="button" class="km-apply-btn" title="تحويل للعربية">تحويل ↵</button>`;
      
      const applyBtn = hintEl.querySelector('.km-apply-btn');
      applyBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        input.value = converted;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();
        removeHint();
      };

      positionHint();
    }

    input.addEventListener('input', updateHint);
    input.addEventListener('focus', updateHint);
    input.addEventListener('blur', () => {
      setTimeout(removeHint, 300);
    });
    window.addEventListener('resize', positionHint, { passive: true });
    window.addEventListener('scroll', positionHint, { passive: true });
  }

  const selector = 'input[type="search"], input[id*="search"], input[class*="search"], input[name*="search"], input[placeholder*="بحث"], input[placeholder*="ابحث"]';
  document.querySelectorAll(selector).forEach(attachToInput);

  if (document.body) {
    const observer = new MutationObserver(() => {
      document.querySelectorAll(selector).forEach(attachToInput);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

