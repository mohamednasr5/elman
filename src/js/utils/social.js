/**
 * المنزلة وناسها — Social Media Utilities
 * Smart normalization and formatting for social media handles and URLs.
 * 
 * Supports:
 * - Raw handles: 'djmrpoop'
 * - Prefixed handles: '@djmrpoop'
 * - Domain without protocol: 'instagram.com/djmrpoop', 'www.instagram.com/djmrpoop'
 * - Full URLs: 'https://www.instagram.com/djmrpoop', 'http://...'
 * - Mobile / web subdomains: 'm.facebook.com', 'web.facebook.com', etc.
 * - Profile IDs and share links: 'facebook.com/profile.php?id=123', 'fb.com/share/...'
 */

const ARABIC_INDIC_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

/**
 * Normalizes Arabic/Indic digits to standard Western ASCII digits.
 * @param {string} str 
 * @returns {string}
 */
export function normalizeDigits(str = '') {
  if (!str) return '';
  return String(str).replace(/[٠-٩]/g, d => ARABIC_INDIC_DIGITS.indexOf(d));
}

/**
 * Cleans tracking and telemetry parameters from social URLs while
 * preserving essential query parameters (e.g. ?id= for facebook profile.php, ?v= for youtube).
 * @param {string} urlStr 
 * @returns {string}
 */
function cleanTrackingParams(urlStr) {
  try {
    const url = new URL(urlStr);
    const trackingKeys = [
      'igsh', 'igshid', 'mibextid', 'fbclid', '_rdr', '_r', '_t',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'feature', 'si', 'share_id', 'tt_from'
    ];
    
    // Only strip params if it's not a generic profile link with mandatory IDs
    trackingKeys.forEach(k => url.searchParams.delete(k));

    let clean = url.toString();
    // Clean trailing slash for simple domain or simple profile path without queries
    if (clean.endsWith('/') && !clean.includes('/share/')) {
      // If pathname is just "/" (e.g. https://example.com/), remove trailing slash
      if (url.pathname === '/' && !url.search && !url.hash) {
        clean = clean.slice(0, -1);
      } else if (url.pathname.length > 1 && !url.search && !url.hash && !clean.includes('/share/')) {
        clean = clean.slice(0, -1);
      }
    }
    return clean;
  } catch (_) {
    return urlStr;
  }
}

/**
 * Extracts a clean handle/username from raw input:
 * Removes leading/trailing spaces, quotes, '@', and leading slashes.
 * @param {string} raw 
 * @returns {string}
 */
export function extractRawHandle(raw = '') {
  if (!raw) return '';
  let s = normalizeDigits(String(raw).trim());
  // Remove wrapping quotes if any
  s = s.replace(/^["'`]|["'`]$/g, '').trim();
  // Remove leading @ or /
  s = s.replace(/^[@/]+/, '').trim();
  return s;
}

/**
 * Detects the intended social platform from a URL or string if detectable.
 * @param {string} input 
 * @returns {'facebook'|'instagram'|'tiktok'|'x'|'threads'|'youtube'|'telegram'|'snapchat'|'website'|null}
 */
export function detectPlatformFromUrl(input = '') {
  if (!input) return null;
  const s = String(input).toLowerCase();

  if (s.includes('facebook.com') || s.includes('fb.com') || s.includes('fb.me') || s.includes('fb.watch')) return 'facebook';
  if (s.includes('instagram.com') || s.includes('instagr.am')) return 'instagram';
  if (s.includes('tiktok.com')) return 'tiktok';
  if (s.includes('twitter.com') || s.includes('x.com')) return 'x';
  if (s.includes('threads.net')) return 'threads';
  if (s.includes('youtube.com') || s.includes('youtu.be')) return 'youtube';
  if (s.includes('t.me') || s.includes('telegram.me')) return 'telegram';
  if (s.includes('snapchat.com')) return 'snapchat';
  if (s.includes('wa.me') || s.includes('whatsapp.com')) return 'whatsapp';
  
  return null;
}

/**
 * Normalizes any social media link or handle for a specific platform.
 * 
 * Examples for Instagram:
 * - 'djmrpoop' -> 'https://www.instagram.com/djmrpoop'
 * - '@djmrpoop' -> 'https://www.instagram.com/djmrpoop'
 * - 'instagram.com/djmrpoop' -> 'https://www.instagram.com/djmrpoop'
 * - 'https://www.instagram.com/djmrpoop?igsh=xyz' -> 'https://www.instagram.com/djmrpoop'
 * 
 * @param {string} platform - 'instagram' | 'facebook' | 'tiktok' | 'x' | 'twitter' | 'threads' | 'youtube' | 'website' | 'telegram' | 'snapchat'
 * @param {string} input - Raw input from user (handle, @handle, URL, etc.)
 * @returns {string} Fully qualified, normalized HTTPS URL (or empty string if input was blank)
 */
export function normalizeSocialLink(platform = '', input = '') {
  if (!input || typeof input !== 'string') return '';
  let raw = normalizeDigits(input.trim());
  if (!raw) return '';

  const plat = String(platform || '').toLowerCase().trim();

  // Normalize aliases
  const p = plat === 'twitter' ? 'x' : plat;

  // 1. If it's already an HTTP / HTTPS link or starts with domain
  const hasProtocol = /^https?:\/\//i.test(raw);
  let urlCandidate = hasProtocol ? raw : '';

  // If no protocol but starts with a known domain pattern (e.g. "instagram.com/...", "www.facebook.com/...")
  if (!hasProtocol) {
    if (/^(www\.)?(facebook\.com|fb\.com|fb\.me|instagram\.com|instagr\.am|tiktok\.com|vm\.tiktok\.com|twitter\.com|x\.com|threads\.net|youtube\.com|youtu\.be|t\.me|snapchat\.com)/i.test(raw)) {
      urlCandidate = 'https://' + raw;
    } else if (p === 'website' && /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(raw)) {
      urlCandidate = 'https://' + raw;
    }
  }

  // If we have a URL candidate, normalize protocol and canonical domain-specific rules
  if (urlCandidate) {
    try {
      // If protocol was http://, upgrade to https:// for known platforms
      if (urlCandidate.startsWith('http://') && p !== 'website') {
        urlCandidate = 'https://' + urlCandidate.slice(7);
      }

      // Canonical domains:
      // Facebook: m.facebook, web.facebook, fb.com, fb.me -> www.facebook.com
      if (p === 'facebook' || urlCandidate.includes('facebook.com') || urlCandidate.includes('fb.com') || urlCandidate.includes('fb.me')) {
        urlCandidate = urlCandidate
          .replace(/https?:\/\/(m|web|touch|mbasic)\.facebook\.com/i, 'https://www.facebook.com')
          .replace(/https?:\/\/facebook\.com/i, 'https://www.facebook.com')
          .replace(/https?:\/\/(www\.)?fb\.(com|me)/i, 'https://www.facebook.com');
      }

      // Instagram: instagram.com, instagr.am -> www.instagram.com
      if (p === 'instagram' || urlCandidate.includes('instagram.com') || urlCandidate.includes('instagr.am')) {
        urlCandidate = urlCandidate
          .replace(/https?:\/\/(www\.)?instagr\.am/i, 'https://www.instagram.com')
          .replace(/https?:\/\/instagram\.com/i, 'https://www.instagram.com');
      }

      // TikTok: tiktok.com -> www.tiktok.com
      if (p === 'tiktok' || urlCandidate.includes('tiktok.com')) {
        urlCandidate = urlCandidate.replace(/https?:\/\/tiktok\.com/i, 'https://www.tiktok.com');
      }

      // YouTube: youtube.com -> www.youtube.com
      if (p === 'youtube' || urlCandidate.includes('youtube.com')) {
        urlCandidate = urlCandidate.replace(/https?:\/\/youtube\.com/i, 'https://www.youtube.com');
      }

      // Threads: threads.net -> www.threads.net
      if (p === 'threads' || urlCandidate.includes('threads.net')) {
        urlCandidate = urlCandidate.replace(/https?:\/\/threads\.net/i, 'https://www.threads.net');
      }

      // Normalize Twitter URLs to x.com
      if (p === 'x' && urlCandidate.includes('twitter.com')) {
        urlCandidate = urlCandidate.replace(/https?:\/\/(www\.)?twitter\.com/i, 'https://x.com');
      }

      // Clean unwanted tracking query params
      return cleanTrackingParams(urlCandidate);
    } catch (_) {
      return urlCandidate;
    }
  }

  // 2. Not a URL: treat as Handle / Username / Path
  // Strip any leading '@' or extra slashes or spaces
  const handle = extractRawHandle(raw);
  if (!handle) return '';

  switch (p) {
    case 'instagram': {
      // Instagram username cannot contain slashes or question marks
      const cleanUser = handle.replace(/[/?#].*$/, '').replace(/^@+/, '');
      return `https://www.instagram.com/${cleanUser}`;
    }

    case 'facebook': {
      // If user provided a profile.php format or path with slash
      if (handle.startsWith('profile.php') || handle.startsWith('pages/') || handle.startsWith('share/')) {
        return `https://www.facebook.com/${handle}`;
      }
      const cleanUser = handle.replace(/^@+/, '');
      return `https://www.facebook.com/${cleanUser}`;
    }

    case 'tiktok': {
      // TikTok handles in URLs standardly use '@'
      const cleanUser = handle.replace(/^@+/, '');
      return `https://www.tiktok.com/@${cleanUser}`;
    }

    case 'x':
    case 'twitter': {
      const cleanUser = handle.replace(/[/?#].*$/, '').replace(/^@+/, '');
      return `https://x.com/${cleanUser}`;
    }

    case 'threads': {
      // Threads URLs standardly use '@'
      const cleanUser = handle.replace(/[/?#].*$/, '').replace(/^@+/, '');
      return `https://www.threads.net/@${cleanUser}`;
    }

    case 'youtube': {
      // If user typed a channel handle or name
      if (handle.startsWith('c/') || handle.startsWith('channel/') || handle.startsWith('user/')) {
        return `https://www.youtube.com/${handle}`;
      }
      const cleanUser = handle.replace(/^@+/, '');
      return `https://www.youtube.com/@${cleanUser}`;
    }

    case 'telegram': {
      const cleanUser = handle.replace(/[/?#].*$/, '').replace(/^@+/, '');
      return `https://t.me/${cleanUser}`;
    }

    case 'snapchat': {
      const cleanUser = handle.replace(/[/?#].*$/, '').replace(/^@+/, '');
      return `https://www.snapchat.com/add/${cleanUser}`;
    }

    case 'website': {
      // If handle looks like a domain (e.g. mysite.com or mysite.com/menu)
      if (handle.includes('.')) {
        return `https://${handle}`;
      }
      return `https://${handle}.com`;
    }

    default: {
      return `https://${handle}`;
    }
  }
}

/**
 * Normalizes an entire social object (e.g. place.social).
 * Ensures all known platforms have clean HTTPS URLs and removes empty strings.
 * 
 * @param {Object} socialObj 
 * @returns {Object}
 */
export function normalizeSocialLinks(socialObj = {}) {
  if (!socialObj || typeof socialObj !== 'object') return {};

  const normalized = {};
  const platforms = ['facebook', 'instagram', 'tiktok', 'x', 'twitter', 'threads', 'youtube', 'website', 'telegram', 'snapchat'];

  platforms.forEach(plat => {
    const rawVal = socialObj[plat] || (plat === 'x' ? socialObj.twitter : '') || (plat === 'twitter' ? socialObj.x : '');
    if (rawVal) {
      const clean = normalizeSocialLink(plat, rawVal);
      if (clean) {
        normalized[plat] = clean;
        if (plat === 'x') normalized.twitter = clean;
        if (plat === 'twitter') normalized.x = clean;
      }
    }
  });

  return normalized;
}

/**
 * Formats a social link safely for display in HTML <a> tags.
 * Even if the database has a raw handle like "@djmrpoop" or "djmrpoop",
 * this guarantees the generated href is always a valid HTTPS URL.
 * 
 * @param {string} platform 
 * @param {string} rawVal 
 * @returns {string}
 */
export function formatSocialUrl(platform, rawVal) {
  return normalizeSocialLink(platform, rawVal);
}

/**
 * Attaches smart auto-normalization behavior to input fields on blur and input.
 * When the user types 'djmrpoop' or '@djmrpoop' and leaves the field, it automatically
 * expands to 'https://www.instagram.com/djmrpoop'.
 * 
 * @param {HTMLInputElement} inputEl 
 * @param {string} platform 
 */
export function attachSmartSocialInput(inputEl, platform) {
  if (!inputEl) return;

  // Normalize on blur (when user finishes typing and moves to next field)
  inputEl.addEventListener('blur', () => {
    const val = inputEl.value.trim();
    if (!val) return;
    const normalized = normalizeSocialLink(platform, val);
    if (normalized && normalized !== val) {
      inputEl.value = normalized;
      // Trigger change event for any reactive form listeners
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Also catch paste events to instantly format clean URLs
  inputEl.addEventListener('paste', () => {
    setTimeout(() => {
      const val = inputEl.value.trim();
      if (!val) return;
      const normalized = normalizeSocialLink(platform, val);
      if (normalized && normalized !== val) {
        inputEl.value = normalized;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 50);
  });
}
