import { buildContextualWhatsAppLink } from './whatsapp.service.js';
/**
 * المنزلة وناسها — Smart Voice Search Service (البحث الصوتي الذكي)
 * Arabic (Egyptian / Standard) voice recognition with instant normalization (أ/إ/آ, ى/ي, ة/ه),
 * conversational filler removal, and live search triggering.
 */

import { normalizeArabic, arabicScore, arabicMatch, expandArabicSearchIntent, extractSearchKeywords, stripAl } from '../utils/arabic.js';
import { toast } from '../ui/components/Toast.js';
import { getPublishedPlaces, getCategories, getAllProducts, getActiveOffers } from '../core/db.js';
import { isAtmPlace, isAtmReadyAndOperational, getAtmLiveStatus, formatAtmTimeAgo, ATM_UNIFIED_LOGO } from '../utils/atm.js';
import { getUserLocation, calculateDistanceKm, formatDistance, getPlaceCoords, MANZALA_CENTER } from '../utils/maps.js';
import { isPlaceOpen } from '../utils/date.js';
import { executeFastSearch } from './search-engine.service.js';


// ── HYPER-FAST INSTANT HOT CACHE (0ms Response Time) ──
let _voiceHotCache = {
  places: null,
  categories: null,
  products: null,
  offers: null,
  userCoords: null,
  lastUpdated: 0
};

export async function warmUpVoiceAssistantCache() {
  if (!_voiceHotCache.places && typeof localStorage !== 'undefined') {
    try {
      const localPlaces = localStorage.getItem('manzala_fast_places_cache');
      const localCats = localStorage.getItem('manzala_fast_cats_cache');
      const localCoords = localStorage.getItem('manzala_fast_user_coords');
      if (localPlaces) _voiceHotCache.places = JSON.parse(localPlaces);
      if (localCats) _voiceHotCache.categories = JSON.parse(localCats);
      if (localCoords) _voiceHotCache.userCoords = JSON.parse(localCoords);
    } catch (_) {}
  }

  // Background refresh
  try {
    const [places, categories, products, offers] = await Promise.all([
      getPublishedPlaces({ limit: 200 }).catch(() => []),
      getCategories().catch(() => []),
      getAllProducts().catch(() => []),
      getActiveOffers(50).catch(() => [])
    ]);

    if (places && places.length > 0) {
      _voiceHotCache.places = places;
      _voiceHotCache.lastUpdated = Date.now();
      try {
        localStorage.setItem('manzala_fast_places_cache', JSON.stringify(places.slice(0, 150)));
      } catch (_) {}
    }

    if (categories && categories.length > 0) {
      _voiceHotCache.categories = categories;
      try {
        localStorage.setItem('manzala_fast_cats_cache', JSON.stringify(categories));
      } catch (_) {}
    }

    if (products && products.length > 0) {
      _voiceHotCache.products = products;
    }

    if (offers && offers.length > 0) {
      _voiceHotCache.offers = offers;
    }

    if (!_voiceHotCache.userCoords) {
      _voiceHotCache.userCoords = MANZALA_CENTER;
    }
  } catch (_) {}
}

// Public search cache does not depend on Firebase.
// Firebase is reserved for authentication and push notifications.
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      setTimeout(() => {
        warmUpVoiceAssistantCache().catch(() => {});
      }, 6000);
    }, { timeout: 12000 });
  } else {
    setTimeout(() => {
      warmUpVoiceAssistantCache().catch(() => {});
    }, 6000);
  }
}

export class VoiceSearch {
  constructor(options = {}) {
    this.onResult = options.onResult || (() => {});
    this.onInterim = options.onInterim || (() => {});
    this.onStart = options.onStart || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.onError = options.onError || (() => {});

    this.isListening = false;
    this.recognition = null;
    this.initRecognition();
  }

  isSupported() {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  initRecognition() {
    if (!this.isSupported()) return;

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'ar-EG'; // Egyptian Arabic dialect
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        this.onInterim(interimTranscript);
      }

      if (finalTranscript) {
        const cleanedText = VoiceSearch.cleanSpokenArabic(finalTranscript);
        this.onResult(cleanedText, finalTranscript);
        this.stop();
      } else if (interimTranscript && interimTranscript.trim().length >= 3) {
        // Fast live interim search
        const cleanedText = VoiceSearch.cleanSpokenArabic(interimTranscript);
        if (this._interimTimeout) clearTimeout(this._interimTimeout);
        this._interimTimeout = setTimeout(() => {
          this.onResult(cleanedText, interimTranscript);
        }, 200);
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.onEnd();
      
      if (event.error === 'not-allowed') {
        toast.warning('يرجى السماح بالوصول للميكروفون لتفعيل البحث الصوتي 🎙️');
      } else if (event.error === 'no-speech') {
        toast.info('لم يتم سماع أي صوت، اضغط على الميكروفون وتحدث مرة أخرى');
      } else if (event.error !== 'aborted') {
        console.warn('[VoiceSearch] error:', event.error);
      }
      this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
    };
  }

  start() {
    if (!this.isSupported()) {
      toast.warning('البحث الصوتي غير مدعوم في هذا المتصفح. يرجى استخدام متصفح حديث مثل Chrome أو Safari أو Edge.');
      return false;
    }

    if (this.isListening) {
      this.stop();
      return false;
    }

    // Always create a fresh SpeechRecognition instance on every click
    this.initRecognition();

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('[VoiceSearch] Start failed, retrying fresh instance:', err);
      try {
        this.initRecognition();
        this.recognition.start();
        return true;
      } catch (retryErr) {
        console.error('[VoiceSearch] Retry failed:', retryErr);
        this.isListening = false;
        this.onEnd();
        return false;
      }
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {
        try {
          this.recognition.abort();
        } catch (_) {}
      }
    }
    this.isListening = false;
    this.onEnd();
  }

  /**
   * Smart Spoken Arabic Cleaner & Normalizer
   * Removes Egyptian dialect conversational question words & cleans all letter ambiguities
   */
  static cleanSpokenArabic(text) {
    if (!text) return '';

    let cleaned = text.trim();

    // 1. Remove spoken conversational prefixes
    const conversationalPrefixes = [
      /^(عاوز|عايز|عاوزه|عايزه|محتاج|محتاجه|محتاجين)\s+(ادور على|اوصل ل|اعرف|اشوف|مكان|محل)?\s*/i,
      /^(ابحث عن|ابحث لي عن|ابحثلي عن|دورلي على|دور على|شوفلي|وريني|هاتلي)\s*/i,
      /^(فين في المنزلة|فين في المنزله|فين في المطرية|فين مكان|فين|عند مين في المنزلة|عند مين في المطرية|مين في المنزلة|مين في المطرية|مين احسن|مين افضل|مين اشطر|مين)\s*/i,
      /^(دليل المنزلة والمطرية|دليل المنزلة والمطريه|دليل المنزلة|دليل المنزله|دليل المطرية|دليل المطريه|محلات المنزلة|محلات المطرية|خدمات المنزلة|خدمات المطرية)\s*/i,
      /^(لو سمحت|من فضلك|بالله عليك|يا ريت)\s*/i
    ];

    for (const prefix of conversationalPrefixes) {
      cleaned = cleaned.replace(prefix, '').trim();
    }

    // 2. Remove spoken trailing words
    const conversationalSuffixes = [
      /\s*(في المنزلة والمطرية|في المنزلة|في المنزله|في المطرية|في المطريه|في المنزلة دقهلية|في مدينة المنزلة|بتاع المنزلة|بتاع المطرية|بالمنزلة|بالمطرية)$/i,
      /\s*(قريب مني|شغال دلوقتي|مفتوح دلوقتي|رقم تليفونه|عنوانه)$/i
    ];

    for (const suffix of conversationalSuffixes) {
      cleaned = cleaned.replace(suffix, '').trim();
    }

    // 3. Normalize common spoken phonetic variations
    cleaned = cleaned
      .replace(/[ٱ]/g, 'ا')
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ى]/g, 'ي')
      .replace(/[ئ]/g, 'ي')
      .replace(/[ؤ]/g, 'و');

    return cleaned || text.trim();
  }
}

/**
 * Mount Voice Search button onto any search input container
 */
export function mountVoiceSearchButton({ inputEl, buttonContainerEl, onSearch }) {
  if (!inputEl) return null;

  let btnEl = null;

  const voice = new VoiceSearch({
    onStart: () => {
      if (btnEl) {
        btnEl.classList.add('listening');
        btnEl.setAttribute('title', 'جاري الاستماع... تحدث الآن 🎙️');
        btnEl.innerHTML = '<span class="voice-pulse-ring"></span>🎙️';
      }
      inputEl.setAttribute('placeholder', '🎙️ جاري الاستماع... تحدث الآن');
    },
    onInterim: (interimText) => {
      inputEl.value = interimText;
    },
    onResult: (cleanedText, rawText) => {
      inputEl.value = cleanedText || rawText;
      if (onSearch) {
        onSearch(inputEl.value);
      }
    },
    onEnd: () => {
      if (btnEl) {
        btnEl.classList.remove('listening');
        btnEl.setAttribute('title', 'البحث الصوتي الذكي');
        btnEl.innerHTML = '🎙️';
      }
      inputEl.setAttribute('placeholder', inputEl.getAttribute('data-original-placeholder') || 'ابحث باسم المكان أو الخدمة...');
    },
    onError: () => {
      if (btnEl) {
        btnEl.classList.remove('listening');
        btnEl.innerHTML = '🎙️';
      }
    }
  });

  inputEl.setAttribute('data-original-placeholder', inputEl.getAttribute('placeholder') || '');

  const parent = buttonContainerEl || inputEl.parentElement;
  if (parent) {
    const existing = parent.querySelector('.btn-voice-search');
    if (existing) existing.remove();
  }

  btnEl = document.createElement('button');
  btnEl.type = 'button';
  btnEl.className = 'btn-voice-search';
  btnEl.setAttribute('title', 'البحث الصوتي الذكي');
  btnEl.setAttribute('aria-label', 'البحث الصوتي الذكي');
  btnEl.innerHTML = '🎙️';

  btnEl.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (voice.isListening) {
      voice.stop();
    } else {
      voice.start();
    }
  });

  if (buttonContainerEl) {
    buttonContainerEl.appendChild(btnEl);
  } else if (inputEl.parentElement) {
    inputEl.parentElement.style.position = 'relative';
    inputEl.parentElement.appendChild(btnEl);
  }

  return voice;
}

/**
 * ─────────────────────────────────────────────────────────────
 *  MANZALA GLOBAL VOICE ASSISTANT MODAL (مساعد المنزلة الصوتي)
 * ─────────────────────────────────────────────────────────────
 */
let _activeVoiceModal = null;
let _modalVoiceInstance = null;

export async function openManzalaVoiceAssistantModal() {
  // Close any existing instance
  if (_activeVoiceModal) {
    closeManzalaVoiceAssistantModal();
  }

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'manzala-voice-modal-backdrop';
  modalBackdrop.id = 'manzala-voice-modal-backdrop';

  modalBackdrop.innerHTML = `
    <div class="manzala-voice-modal-card" role="dialog" aria-modal="true">
      <!-- Header -->
      <div class="mvm-header">
        <div class="mvm-title-wrap">
          <span class="mvm-badge-icon">M</span>
          <div>
            <h3 class="mvm-title">مساعد دليل المنزلة والمطرية الصوتي الذكي</h3>
            <p class="mvm-subtitle">تحدث بحرية.. وسنعثر لك على المكان والخدمات فوراً</p>
          </div>
        </div>
        <button type="button" class="mvm-close" aria-label="إغلاق">✕</button>
      </div>

      <div class="mvm-body">
        <div class="mvm-search-row">
          <input id="mvm-input" class="mvm-input" type="search" inputmode="search" autocomplete="off" placeholder="مثال: صيدلية مفتوحة الآن قريبة مني" />
          <button type="button" id="mvm-mic-btn" class="mvm-mic-btn" aria-label="ابدأ البحث الصوتي">🎙️</button>
          <button type="button" id="mvm-search-btn" class="mvm-search-btn" aria-label="بحث">🔍</button>
        </div>
        <div id="mvm-status" class="mvm-status" aria-live="polite">اضغط على الميكروفون وتحدث بحرية.</div>
        <div id="mvm-results-container" class="mvm-results-container">
          <div id="mvm-results-list" class="mvm-results-list"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalBackdrop);
  _activeVoiceModal = modalBackdrop;

  const input = modalBackdrop.querySelector('#mvm-input');
  const mic = modalBackdrop.querySelector('#mvm-mic-btn');
  const close = modalBackdrop.querySelector('.mvm-close');
  const status = modalBackdrop.querySelector('#mvm-status');
  const results = modalBackdrop.querySelector('#mvm-results-list');

  const renderResults = (items = []) => {
    if (!results) return;
    if (!items.length) {
      results.innerHTML = '<div class="mvm-empty">لم نجد نتائج مطابقة. جرّب اسم المكان أو الخدمة بشكل أبسط.</div>';
      return;
    }
    results.innerHTML = items.slice(0, 12).map(place => {
      const id = place.id || place._key || place.slug;
      return `<a class="mvm-result" href="place.html?id=${encodeURIComponent(id)}"><strong>${escapeHtml(place.name || 'مكان')}</strong><span>${escapeHtml(place.categoryName || place.category || '')}</span><small>${escapeHtml(place.address || place.area || '')}</small></a>`;
    }).join('');
  };

  const runSearch = async (q) => {
    const query = String(q || '').trim();
    if (!query) return;
    status.textContent = `جاري البحث عن: ${query}`;
    try {
      const places = _voiceHotCache.places || await getPublishedPlaces({ limit: 200 });
      const expanded = expandArabicSearchIntent(query) || query;
      const keywords = extractSearchKeywords(expanded) || expanded;
      const scored = (places || []).map(place => {
        const score = Math.max(
          arabicScore(place.name || '', keywords),
          arabicScore(place.categoryName || place.category || '', keywords) * 0.9,
          arabicScore(place.area || '', keywords) * 0.85,
          arabicScore(place.address || '', keywords) * 0.7
        );
        return { place, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.place);
      renderResults(scored);
      status.textContent = `تم العثور على ${scored.length} نتيجة.`;
    } catch (err) {
      console.warn('[VoiceAssistant] search:', err);
      status.textContent = 'تعذر تنفيذ البحث الآن. حاول مرة أخرى.';
    }
  };

  _modalVoiceInstance = new VoiceSearch({
    onStart: () => {
      mic.classList.add('listening');
      mic.innerHTML = '🔴';
      status.textContent = 'جاري الاستماع... تحدث الآن';
    },
    onInterim: (text) => {
      input.value = text;
      status.textContent = `جاري الاستماع: ${text}`;
    },
    onResult: (text) => {
      input.value = text;
      runSearch(text);
    },
    onEnd: () => {
      mic.classList.remove('listening');
      mic.innerHTML = '🎙️';
    }
  });

  mic.addEventListener('click', () => {
    if (_modalVoiceInstance?.isListening) _modalVoiceInstance.stop();
    else _modalVoiceInstance?.start();
  });
  modalBackdrop.querySelector('#mvm-search-btn')?.addEventListener('click', () => runSearch(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(input.value); } });
  close.addEventListener('click', closeManzalaVoiceAssistantModal);
  modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeManzalaVoiceAssistantModal(); });

  return modalBackdrop;
}

export function closeManzalaVoiceAssistantModal() {
  try { _modalVoiceInstance?.stop(); } catch (_) {}
  _modalVoiceInstance = null;
  _activeVoiceModal?.remove();
  _activeVoiceModal = null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
