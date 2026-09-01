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

    getUserLocation().then(coords => {
      if (coords) {
        _voiceHotCache.userCoords = coords;
        try {
          localStorage.setItem('manzala_fast_user_coords', JSON.stringify(coords));
        } catch (_) {}
      }
    }).catch(() => {
      if (!_voiceHotCache.userCoords) _voiceHotCache.userCoords = MANZALA_CENTER;
    });
  } catch (_) {}
}

// Auto warm up on module load
if (typeof window !== 'undefined') {
  setTimeout(warmUpVoiceAssistantCache, 100);
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
        <button type="button" class="mvm-close-btn" id="mvm-close-btn" aria-label="إغلاق">✕</button>
      </div>

      <!-- Assistant Central Orb & Wave Animation -->
      <div class="mvm-center-stage">
        <div class="mvm-orb-wrapper" id="mvm-orb-btn" role="button" title="اضغط للتحدث أو إعادة الاستماع">
          <div class="mvm-orb-core">
            <span class="mvm-orb-letter">M</span>
          </div>
          <div class="mvm-orb-pulse pulse-1"></div>
          <div class="mvm-orb-pulse pulse-2"></div>
        </div>

        <!-- Live Waveform Bars -->
        <div class="mvm-waveform" id="mvm-waveform">
          <span class="wave-bar wb-1"></span>
          <span class="wave-bar wb-2"></span>
          <span class="wave-bar wb-3"></span>
          <span class="wave-bar wb-4"></span>
          <span class="wave-bar wb-5"></span>
          <span class="wave-bar wb-6"></span>
          <span class="wave-bar wb-7"></span>
        </div>

        <!-- Live Status Label -->
        <div class="mvm-status" id="mvm-status-text">
          🎙️ جاري الاستماع.. قل ما تبحث عنه الآن
        </div>

        <!-- Live Transcription Bubble -->
        <div class="mvm-transcript-box" id="mvm-transcript-box">
          <span class="mvm-transcript-placeholder">مثال: "عاوز صيدلية قريبة", "دكتور عظام", "مطعم كريب", "سباك"...</span>
        </div>
      </div>

      <!-- Quick Suggestion Chips -->
      <div class="mvm-quick-chips">
        <span class="mvm-chips-label">⚡ أو اختر تصنيفاً سريعاً:</span>
        <div class="mvm-chips-scroll">
          <button type="button" class="mvm-chip" data-query="atm">🏧 ماكينات ATM</button>
          <button type="button" class="mvm-chip" data-query="صيدلية">💊 صيدليات</button>
          <button type="button" class="mvm-chip" data-query="دكتور">🩺 أطباء وعيادات</button>
          <button type="button" class="mvm-chip" data-query="مطعم">🍕 مطاعم وبيتزا</button>
          <button type="button" class="mvm-chip" data-query="كافيه">☕ كافيهات ومشروبات</button>
          <button type="button" class="mvm-chip" data-query="سوبر ماركت">🛒 سوبر ماركت</button>
          <button type="button" class="mvm-chip" data-query="سباك">🪠 سباكين</button>
          <button type="button" class="mvm-chip" data-query="نجار">🪚 نجارين</button>
          <button type="button" class="mvm-chip" data-query="محمصة">🥜 محامص وتسالي</button>
          <button type="button" class="mvm-chip" data-query="قاعة افراح">👑 قاعات أفراح</button>
        </div>
      </div>

      <!-- Instant Live Results Preview Container -->
      <div class="mvm-results-container" id="mvm-results-container" style="display:none">
        <div class="mvm-results-header">
          <span class="mvm-results-title" id="mvm-results-title">أقرب الأماكن المطابقة:</span>
        </div>
        <div class="mvm-results-list" id="mvm-results-list"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modalBackdrop);
  _activeVoiceModal = modalBackdrop;

  requestAnimationFrame(() => {
    modalBackdrop.classList.add('visible');
  });

  const statusText = document.getElementById('mvm-status-text');
  const transcriptBox = document.getElementById('mvm-transcript-box');
  const waveform = document.getElementById('mvm-waveform');
  const orbBtn = document.getElementById('mvm-orb-btn');
  const resultsContainer = document.getElementById('mvm-results-container');
  const resultsList = document.getElementById('mvm-results-list');
  const resultsTitle = document.getElementById('mvm-results-title');

  // Initialize Speech Recognition for Assistant
  _modalVoiceInstance = new VoiceSearch({
    onStart: () => {
      if (statusText) statusText.innerHTML = '🟢 <span style="color:var(--success,#10B981);font-weight:800">استمع إليك الآن..</span> تفضل بالحديث';
      if (waveform) waveform.classList.add('active');
      if (orbBtn) orbBtn.classList.add('listening');
    },
    onInterim: (interim) => {
      if (transcriptBox) {
        transcriptBox.innerHTML = `<span class="mvm-live-interim">"${interim}"</span>`;
      }
    },
    onResult: async (cleaned, raw) => {
      const query = cleaned || raw;
      if (transcriptBox) {
        transcriptBox.innerHTML = `<span class="mvm-final-query">🔍 "${query}"</span>`;
      }
      if (statusText) {
        statusText.innerHTML = '⚡ <span style="color:var(--secondary,#F5A623);font-weight:800">تم التعرف! جاري جلب الأماكن فوراً...</span>';
      }
      if (waveform) waveform.classList.remove('active');
      if (orbBtn) orbBtn.classList.remove('listening');

      // Fetch and display instant matching places
      await executeVoiceAssistantSearch(query);
    },
    onEnd: () => {
      if (waveform) waveform.classList.remove('active');
      if (orbBtn) orbBtn.classList.remove('listening');
      if (statusText && !transcriptBox?.querySelector('.mvm-final-query')) {
        statusText.innerHTML = '🎙️ اضغط على حرف <strong>M</strong> في المنتصف للتحدث مجدداً';
      }
    },
    onError: () => {
      if (waveform) waveform.classList.remove('active');
      if (orbBtn) orbBtn.classList.remove('listening');
      if (statusText) {
        statusText.innerHTML = '⚠️ اضغط على حرف <strong>M</strong> للتحدث مرة أخرى';
      }
    }
  });

  // Start listening immediately
  _modalVoiceInstance.start();

  // Orb click to toggle / restart listening
  orbBtn?.addEventListener('click', () => {
    if (_modalVoiceInstance.isListening) {
      _modalVoiceInstance.stop();
    } else {
      _modalVoiceInstance.start();
    }
  });

  // Chip buttons click
  modalBackdrop.querySelectorAll('.mvm-chip').forEach(btn => {
    btn.addEventListener('click', async () => {
      const q = btn.getAttribute('data-query');
      if (transcriptBox) {
        transcriptBox.innerHTML = `<span class="mvm-final-query">🔍 "${q}"</span>`;
      }
      await executeVoiceAssistantSearch(q);
    });
  });

  // Close Handlers
  document.getElementById('mvm-close-btn')?.addEventListener('click', closeManzalaVoiceAssistantModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeManzalaVoiceAssistantModal();
    }
  });

      async function executeVoiceAssistantSearch(query) {
    if (!query) return;
    if (resultsContainer) resultsContainer.style.display = 'block';

    try {
      const dialectMeta = extractSmartDialectKeyword(query);
      const rawClean = dialectMeta.keyword;
      const normQ = normalizeArabic(rawClean || query).toLowerCase();
      const intents = (typeof expandArabicSearchIntent === 'function' ? expandArabicSearchIntent(rawClean || query) : []).map(i => normalizeArabic(i).toLowerCase());

      const isAtmSearch = (
        normQ.includes('atm') ||
        normQ.includes('ماكين') ||
        normQ.includes('اي تي ام') ||
        normQ.includes('ايه تي ام') ||
        normQ.includes('صراف') ||
        normQ.includes('صرف ال') ||
        normQ.includes('فلوس') ||
        normQ.includes('سحب') ||
        normQ.includes('ايداع') ||
        normQ.includes('كاش')
      );

      // Instant Hot Cache Resolution (0ms)
      let places = _voiceHotCache.places;
      if (!places || places.length === 0) {
        try {
          const raw = localStorage.getItem('manzala_fast_places_cache');
          if (raw) places = JSON.parse(raw);
        } catch (_) {}
      }

      if (!places || places.length === 0) {
        if (resultsList) {
          resultsList.innerHTML = '<div style="padding:15px;text-align:center;color:var(--text-muted)"><div class="spinner spinner-sm" style="margin:0 auto 8px"></div>جاري البحث السريع...</div>';
        }
        places = await getPublishedPlaces({ limit: 150 }).catch(() => []);
        _voiceHotCache.places = places;
      }

      const userLocationCoords = _voiceHotCache.userCoords || MANZALA_CENTER;

      // Category Synonyms Map
      const categorySynonyms = {
        pharmacy: ['صيدليه', 'صيدلية', 'صيدليات', 'دوا', 'دواء', 'ادويه', 'ادوية', 'علاج', 'روشته', 'روشتة', 'مستلزمات طبيه', 'pharmacy', 'medicine'],
        supermarket: ['سوبر ماركت', 'بقاله', 'بقالة', 'هايبر', 'ماركت', 'خضار', 'فاكهه', 'فاكهة', 'جبن', 'تموين', 'سوبرماركت'],
        doctor: ['دكتور', 'طبيب', 'عياده', 'عيادة', 'استشاري', 'اخصائي', 'كشف', 'جراح', 'اسنان', 'باطنه', 'اطفال', 'عظام', 'جلديه', 'عيون', 'قلب', 'دكاتره'],
        restaurant: ['مطعم', 'اكل', 'وجبات', 'كريب', 'بيتزا', 'شاورما', 'برجر', 'فول', 'طعميه', 'مشويات', 'كباب', 'سمك', 'فسيخ', 'حواوشي', 'مطاعم'],
        cafe: ['كافيه', 'مقهى', 'قهوه', 'قهوة', 'كوفي', 'بن', 'شاي', 'عصائر', 'مشروبات', 'شيشه', 'كافيهات'],
        bakery: ['مخبز', 'عيش', 'فينو', 'حلويات', 'تورته', 'تورتة', 'كيك', 'بسبوسه', 'بسبوسة', 'مخبوزات', 'فرن', 'مخابز'],
        roastery: ['محمصه', 'محمصة', 'بن', 'مكسرات', 'تسالي', 'لب', 'كاجو', 'فول سوداني', 'محامص'],
        atm: ['atm', 'ماكينه', 'ماكينة', 'صراف', 'بنك', 'فلوس', 'سحب', 'ايداع', 'كاش', 'ماكينات'],
        plumbing: ['سباك', 'سباكه', 'سباكة', 'ادوات صحيه', 'ادوات صحية', 'مواسير', 'خلاطات', 'فلتر', 'سباكين'],
        carpenter: ['نجار', 'نجاره', 'نجارة', 'خشب', 'غرف نوم', 'موبيليا', 'ابواب', 'شبابيك', 'نجارين'],
        electrician: ['كهربائي', 'كهرباء', 'مفاتيح', 'صيانة كهربائية', 'ليدات', 'كهربائيه'],
        mechanic: ['ميكانيكي', 'سيارات', 'صيانة سيارات', 'زيوت', 'قطع غيار', 'كاوتش', 'ميكانيكيه']
      };

      // ── 1. Special ATM Handling ──
      if (isAtmSearch) {
        const atmPlaces = (places || []).filter(p => isAtmPlace(p) && isAtmReadyAndOperational(p, 15));
        const wantsCash = normQ.includes('سحب') || normQ.includes('كاش') || normQ.includes('فلوس');

        const atmScored = atmPlaces.map(p => {
          const coords = getPlaceCoords(p) || MANZALA_CENTER;
          const distKm = userLocationCoords ? calculateDistanceKm(userLocationCoords.lat, userLocationCoords.lng, coords.lat, coords.lng) : Infinity;
          const status = getAtmLiveStatus(p, 15);
          return { place: p, distKm, distStr: formatDistance(distKm), status, coords };
        });

        atmScored.sort((a, b) => {
          if (wantsCash) {
            if (a.status && a.status.hasCash && (!b.status || !b.status.hasCash)) return -1;
            if ((!a.status || !a.status.hasCash) && b.status && b.status.hasCash) return 1;
          }
          return a.distKm - b.distKm;
        });

        if (atmScored.length > 0) {
          if (resultsTitle) resultsTitle.innerHTML = '🏧 أقرب ماكينات الصراف الآلي (ATM) لموقعك:';
          resultsList.innerHTML = atmScored.slice(0, 5).map(item => {
            const p = item.place;
            const placeUrl = 'place.html?slug=' + encodeURIComponent(p.slug || p.id);
            return '<div style="background:var(--surface,#fff);border:1.5px solid var(--border,#e2e8f0);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
              '<div style="display:flex;align-items:center;gap:10px">' +
                '<div style="width:44px;height:44px;border-radius:10px;background:#1B4F72;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex-shrink:0">🏧</div>' +
                '<div>' +
                  '<div style="font-weight:800;font-size:14px;color:var(--text-primary,#0F2B48)">' + escapeHtml(p.name) + '</div>' +
                  '<div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;margin-top:2px">' +
                    '<span style="color:#059669;font-weight:700">' + (item.status && item.status.isLive ? '🟢 تعمل الآن' : '🟢 متاحة') + '</span>' +
                    (item.distStr ? '<span>• 📍 ' + item.distStr + '</span>' : '') +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<a href="' + placeUrl + '" class="btn btn-primary btn-sm" style="border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;text-decoration:none">التفاصيل ↗</a>' +
            '</div>';
          }).join('');
          return;
        }
      }

      // ── 2. General Comprehensive Place Search ──
      const isPlaceSponsored = (p) => Boolean((p.isSponsored || p.isFeatured || p.isPromoted) && (!p.sponsoredUntil || p.sponsoredUntil > Date.now()));
      const checkPlaceIsOpen = (p) => isAtmPlace(p) || p.alwaysOpen || !p.workingHours || isPlaceOpen(p.workingHours) !== false;

      const scored = (places || []).map(p => {
        const pId = p.id || p.slug;
        const pName = normalizeArabic(p.name || '').toLowerCase();
        const pDesc = normalizeArabic(p.description || '').toLowerCase();
        const pAddress = normalizeArabic(p.address || '').toLowerCase();
        const pArea = normalizeArabic(p.area || '').toLowerCase();
        const pCatKey = (p.categoryId || '').toLowerCase();
        const pCatName = normalizeArabic((p.customCategory || '') + ' ' + (p.categoryName || '')).toLowerCase();
        const pServices = (p.services || []).map(s => normalizeArabic(s).toLowerCase());

        // Category Synonyms Match
        let catMatchScore = 0;
        const catSyns = categorySynonyms[pCatKey] || [];
        if (catSyns.some(syn => normQ.includes(syn) || syn.includes(normQ) || intents.includes(syn))) {
          catMatchScore = 95;
        }

        // Direct Text Match Scores
        const nameScore = Math.max(arabicScore(p.name || '', query), arabicScore(p.name || '', rawClean));
        const specScore = p.medicalSpecialty ? arabicScore(p.medicalSpecialty, query) : 0;
        const servScore = pServices.some(s => s.includes(normQ) || normQ.includes(s) || intents.some(i => s.includes(i))) ? 90 : 0;
        const descScore = pDesc.includes(normQ) ? 75 : 0;
        const addressScore = pAddress.includes(normQ) || pArea.includes(normQ) ? 70 : 0;

        // Intent match
        let intentScore = 0;
        intents.forEach(intent => {
          if (!intent || intent.length < 2) return;
          if (pName.includes(intent)) intentScore = Math.max(intentScore, 90);
          else if (pServices.some(s => s.includes(intent))) intentScore = Math.max(intentScore, 85);
          else if (pDesc.includes(intent) || pCatName.includes(intent)) intentScore = Math.max(intentScore, 75);
        });

        const directHit = pName.includes(normQ) || pCatName.includes(normQ) || pCatKey.includes(normQ) || pDesc.includes(normQ);

        const relevanceScore = Math.max(
          nameScore,
          catMatchScore,
          specScore,
          servScore,
          descScore,
          addressScore,
          intentScore,
          directHit ? 80 : 0
        );

        const coords = getPlaceCoords(p) || MANZALA_CENTER;
        const distKm = userLocationCoords ? calculateDistanceKm(userLocationCoords.lat, userLocationCoords.lng, coords.lat, coords.lng) : Infinity;
        const distStr = formatDistance(distKm);
        const isOpen = checkPlaceIsOpen(p);
        const isSpons = isPlaceSponsored(p);

        let compoundScore = relevanceScore;
        if (isSpons) compoundScore += 200;
        if (dialectMeta.wantsOpenNow && isOpen) compoundScore += 50;
        if (dialectMeta.wantsNearest && distKm < 2.0) compoundScore += 30;
        if (p.isVerified) compoundScore += 20;

        return {
          place: p,
          score: relevanceScore,
          compoundScore,
          distKm,
          distStr,
          isOpen,
          isSpons,
          coords
        };
      }).filter(item => item.score > 25);

      // Sort
      scored.sort((a, b) => b.compoundScore - a.compoundScore || a.distKm - b.distKm);

      const topPlaces = scored.slice(0, 6).map(s => ({
        ...s.place,
        _isSponsoredResult: s.isSpons,
        _distStr: s.distStr,
        _isOpen: s.isOpen
      }));

      if (topPlaces.length > 0) {
        if (resultsTitle) {
          resultsTitle.innerHTML = '🎯 أقرب نتائج لـ "' + escapeHtml(rawClean || query) + '" في المنزلة والمطرية:';
        }

        resultsList.innerHTML = topPlaces.map((p, idx) => {
          const isSponsored = p._isSponsoredResult;
          const placeUrl = 'place.html?slug=' + encodeURIComponent(p.slug || p.id);
          return '<div class="mvm-place-row" style="background:var(--surface,#fff);border:1.5px solid ' + (isSponsored ? '#F59E0B' : 'var(--border,#e2e8f0)') + ';border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
            '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px">' +
              '<div style="width:46px;height:46px;border-radius:50%;overflow:hidden;background:rgba(27,79,114,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--primary);flex-shrink:0;border:1px solid var(--border)">' +
                (p.logoUrl ? '<img src="' + escapeHtml(p.logoUrl) + '" style="width:100%;height:100%;object-fit:cover" />' : (p.name ? p.name.charAt(0) : '📍')) +
              '</div>' +
              '<div style="flex:1;min-width:0">' +
                '<div style="font-weight:800;font-size:14px;color:var(--text-primary,#0F2B48);display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                  '<span>' + escapeHtml(p.name) + '</span>' +
                  (isSponsored ? '<span class="badge" style="background:#F59E0B;color:#0B1E30;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px">📢 إعلان</span>' : '') +
                  (p.isVerified ? '<span style="color:#10B981;font-size:11px;font-weight:800">✓ موثق</span>' : '') +
                '</div>' +
                '<div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:3px">' +
                  '<span>📍 ' + escapeHtml(p.address || p.area || 'المنزلة') + '</span>' +
                  (p._distStr ? '<span style="color:#D97706;font-weight:700">' + p._distStr + '</span>' : '') +
                  (p._isOpen ? '<span style="color:#059669;font-weight:700">🟢 مفتوح</span>' : '') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<a href="' + placeUrl + '" class="btn btn-sm btn-primary" style="border-radius:8px;padding:7px 14px;font-size:12.5px;font-weight:800;text-decoration:none;white-space:nowrap;background:' + (isSponsored ? '#F59E0B' : '#0284C7') + ';color:' + (isSponsored ? '#0B1E30' : '#fff') + ';border:none">' +
              'عرض المكان ↗' +
            '</a>' +
          '</div>';
        }).join('') +
        '<div style="margin-top:10px;text-align:center">' +
          '<a href="search.html?q=' + encodeURIComponent(query) + '" class="btn btn-secondary btn-sm" style="width:100%;border-radius:10px;font-weight:700;display:block;text-align:center;padding:10px">' +
            '🔍 عرض كافة نتائج البحث (' + scored.length + ' نتيجة) في صفحة البحث ←' +
          '</a>' +
        '</div>';
      } else {
        if (resultsTitle) resultsTitle.innerHTML = 'لم نجد نتائج لـ "' + escapeHtml(query) + '"';
        resultsList.innerHTML = '<div style="padding:16px;text-align:center">' +
          '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">جرب البحث بكلمات أخرى أو تصفح الدليل الشامل:</p>' +
          '<a href="search.html?q=' + encodeURIComponent(query) + '" class="btn btn-primary btn-sm" style="border-radius:8px">' +
            '🔍 البحث الشامل في الدليل' +
          '</a>' +
        '</div>';
      }
    } catch (err) {
      console.error('[VoiceSearch] execute error:', err);
      if (resultsTitle) resultsTitle.innerHTML = 'نتائج البحث:';
      if (resultsList) {
        resultsList.innerHTML = '<div style="padding:16px;text-align:center">' +
          '<a href="search.html?q=' + encodeURIComponent(query) + '" class="btn btn-primary btn-sm" style="border-radius:8px">' +
            '🔍 اضغط هنا لعرض نتائج "' + escapeHtml(query) + '" في صفحة البحث' +
          '</a>' +
        '</div>';
      }
    }
  }
}

export function closeManzalaVoiceAssistantModal() {
  if (_modalVoiceInstance) {
    _modalVoiceInstance.stop();
    _modalVoiceInstance = null;
  }
  if (_activeVoiceModal) {
    _activeVoiceModal.classList.remove('visible');
    setTimeout(() => {
      if (_activeVoiceModal && _activeVoiceModal.parentNode) {
        _activeVoiceModal.parentNode.removeChild(_activeVoiceModal);
      }
      _activeVoiceModal = null;
    }, 300);
  }
}

/**
 * Attach Voice Assistant Modal Click Handler to all M FAB buttons across the site
 */
export function bindGlobalVoiceAssistantFab() {
  document.querySelectorAll('#global-voice-assistant-fab, .bottom-nav__voice-assistant-fab').forEach(btn => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openManzalaVoiceAssistantModal();
      });
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

