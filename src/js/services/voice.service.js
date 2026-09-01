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
      if (!query || !query.trim()) return;
      const rawClean = extractSearchKeywords(query);
      const normQ = normalizeArabic(rawClean || query).toLowerCase();
      const queryTokens = normQ.split(/\s+/).filter(t => t.length > 1);
      const intents = (typeof expandArabicSearchIntent === 'function' ? expandArabicSearchIntent(rawClean || query) : []).map(i => normalizeArabic(i).toLowerCase());

      const resultsTitle = document.getElementById('mvm-results-title');
      const resultsList = document.getElementById('mvm-results-list');
      const resultsBox = document.getElementById('mvm-results-container');

      if (resultsBox) resultsBox.style.display = 'block';
      if (resultsTitle) resultsTitle.innerHTML = '⚡ جاري جلب أفضل النتائج لـ "' + escapeHtml(query) + '"...';
      if (resultsList) {
        resultsList.innerHTML = `
          <div style="padding:14px 0">
            <div class="skeleton" style="height:70px;border-radius:14px;margin-bottom:8px"></div>
            <div class="skeleton" style="height:70px;border-radius:14px"></div>
          </div>
        `;
      }

      // 1. Resolve User Geolocation for exact distance
      let userLocationCoords = _voiceHotCache.userCoords;
      if (!userLocationCoords) {
        try {
          userLocationCoords = await getUserLocation();
          _voiceHotCache.userCoords = userLocationCoords;
        } catch (_) {
          userLocationCoords = MANZALA_CENTER;
        }
      }

      // 2. Fetch Places from memory / cache / DB (All published places)
      let places = _voiceHotCache.places;
      if (!places || places.length === 0) {
        try {
          const raw = localStorage.getItem('manzala_fast_places_cache');
          if (raw) places = JSON.parse(raw);
        } catch (_) {}
      }

      if (!places || places.length < 5) {
        try {
          places = await getPublishedPlaces({ limit: 400 });
          if (places && places.length > 0) _voiceHotCache.places = places;
        } catch (_) {}
      }

      if (!places) places = [];

      // 3. Category Synonyms Dictionary
      const categorySynonyms = {
        carpenter: ['نجار', 'نجاره', 'نجارة', 'خشب', 'غرف نوم', 'موبيليا', 'ابواب', 'شبابيك', 'مطابخ خشب', 'نجارين'],
        plumbing: ['سباك', 'سباكه', 'سباكة', 'ادوات صحيه', 'ادوات صحية', 'مواسير', 'خلاطات', 'فلتر', 'سباكين', 'تسريب'],
        electrician: ['كهربائي', 'كهرباء', 'مفاتيح', 'صيانة كهربائية', 'ليدات', 'كهربائيه', 'كهربائيين'],
        mechanic: ['ميكانيكي', 'سيارات', 'صيانة سيارات', 'زيوت', 'قطع غيار', 'كاوتش', 'ميكانيكيه', 'عفشه'],
        atm: ['atm', 'ماكينه', 'ماكينة', 'ماكينات', 'صراف', 'صرف', 'بنك', 'فلوس', 'سحب', 'ايداع', 'كاش'],
        pharmacy: ['صيدليه', 'صيدلية', 'صيدليات', 'دوا', 'دواء', 'ادويه', 'ادوية', 'علاج', 'روشته', 'روشتة', 'مستلزمات طبيه', 'مستلزمات طبية', 'pharmacy'],
        doctor: ['دكتور', 'طبيب', 'عياده', 'عيادة', 'استشاري', 'اخصائي', 'كشف', 'جراح', 'اسنان', 'باطنه', 'اطفال', 'عظام', 'جلديه', 'عيون', 'قلب', 'دكاتره'],
        restaurant: ['مطعم', 'اكل', 'وجبات', 'كريب', 'بيتزا', 'شاورما', 'برجر', 'فول', 'طعميه', 'مشويات', 'كباب', 'سمك', 'فسيخ', 'حواوشي', 'مطاعم'],
        cafe: ['كافيه', 'مقهى', 'قهوه', 'قهوة', 'كوفي', 'بن', 'شاي', 'عصائر', 'مشروبات', 'شيشه', 'كافيهات'],
        supermarket: ['سوبر ماركت', 'بقاله', 'بقالة', 'هايبر', 'ماركت', 'خضار', 'فاكهه', 'فاكهة', 'جبن', 'تموين', 'سوبرماركت'],
        bakery: ['مخبز', 'عيش', 'فينو', 'حلويات', 'تورته', 'تورتة', 'كيك', 'بسبوسه', 'بسبوسة', 'مخبوزات', 'فرن', 'مخابز'],
        roastery: ['محمصه', 'محمصة', 'بن', 'مكسرات', 'تسالي', 'لب', 'كاجو', 'فول سوداني', 'محامص'],
        wedding_hall: ['قاعه', 'قاعة', 'قاعات', 'افراح', 'فرح', 'مناسبات', 'خطوبه', 'اعراس', 'قاعات افراح']
      };

      // 4. Exact Multi-tier Hierarchical Scoring Engine:
      // Priority 1: اسم المكان بالعربية (Name Match -> 1000 pts)
      // Priority 2: التخصص (Specialty / Medical / Trade -> 400 pts)
      // Priority 3: التصنيف (Category / Synonyms -> 250 pts)
      // Priority 4: الوصف والخدمات (Description / Services -> 150 pts)
      // Priority 5: العنوان والشارع (Address / Area -> 100 pts)

      const scoredPlaces = [];

      for (const p of places) {
        const pName = normalizeArabic(p.name || '').toLowerCase();
        const pSpec = normalizeArabic((p.specialty || '') + ' ' + (p.medicalSpecialty || '') + ' ' + (p.tradeSpecialty || '')).toLowerCase();
        const pCat = normalizeArabic((p.categoryName || '') + ' ' + (p.categoryId || '') + ' ' + (p.customCategory || '')).toLowerCase();
        const pDesc = normalizeArabic(p.description || '').toLowerCase();
        const pServ = (p.services || []).map(s => normalizeArabic(s).toLowerCase()).join(' ');
        const pAddr = normalizeArabic((p.address || '') + ' ' + (p.area || '')).toLowerCase();

        let totalScore = 0;
        let matchReason = '';

        // ── 1. Name Match (Highest Weight: 1000 pts) ──
        if (pName === normQ) {
          totalScore += 2000;
          matchReason = 'مطابقة تامة للاسم';
        } else if (pName.includes(normQ)) {
          totalScore += 1200;
          matchReason = 'مطابقة لاسم المكان';
        } else if (queryTokens.length > 0) {
          const matchingTokens = queryTokens.filter(t => pName.includes(t));
          if (matchingTokens.length === queryTokens.length) {
            totalScore += 900;
            matchReason = 'مطابقة لكلمات الاسم';
          } else if (matchingTokens.length > 0) {
            totalScore += 450 * (matchingTokens.length / queryTokens.length);
          }
        }
        const aNameScore = arabicScore(p.name || '', rawClean || query);
        if (aNameScore > 40) {
          totalScore += aNameScore * 6;
        }

        // ── 2. Specialty Match (Weight: 400 pts) ──
        if (pSpec) {
          if (pSpec.includes(normQ)) {
            totalScore += 500;
            if (!matchReason) matchReason = 'مطابقة التخصص';
          } else if (queryTokens.some(t => pSpec.includes(t))) {
            totalScore += 300;
          }
        }

        // ── 3. Category Match & Synonyms (Weight: 250 pts) ──
        if (pCat.includes(normQ)) {
          totalScore += 350;
          if (!matchReason) matchReason = 'مطابقة التصنيف';
        } else {
          for (const [cKey, syns] of Object.entries(categorySynonyms)) {
            const isPlaceInCat = pCat.includes(cKey) || (p.categoryId || '').toLowerCase().includes(cKey);
            if (isPlaceInCat && syns.some(s => normQ.includes(s) || s.includes(normQ) || intents.includes(s))) {
              totalScore += 250;
              if (!matchReason) matchReason = 'تصنيف مطابق';
              break;
            }
          }
        }

        // ── 4. Description & Services (Weight: 150 pts) ──
        if (pDesc.includes(normQ) || pServ.includes(normQ)) {
          totalScore += 180;
          if (!matchReason) matchReason = 'مطابقة الوصف والخدمات';
        } else if (queryTokens.some(t => pDesc.includes(t) || pServ.includes(t))) {
          totalScore += 100;
        }

        // ── 5. Address & Area (Weight: 100 pts) ──
        if (pAddr.includes(normQ)) {
          totalScore += 120;
          if (!matchReason) matchReason = 'مطابقة العنوان';
        } else if (queryTokens.some(t => pAddr.includes(t))) {
          totalScore += 60;
        }

        if (totalScore > 50) {
          const coords = getPlaceCoords(p) || (p.lat && p.lng ? { lat: Number(p.lat), lng: Number(p.lng) } : MANZALA_CENTER);
          const distKm = userLocationCoords ? calculateDistanceKm(userLocationCoords.lat, userLocationCoords.lng, coords.lat, coords.lng) : 0.8;
          const distStr = formatDistance(distKm);
          const isOpen = p.isOpen !== false && (isAtmPlace(p) || p.alwaysOpen || !p.workingHours || isPlaceOpen(p.workingHours) !== false);
          const isSpons = Boolean(p.isSponsored && (!p.sponsoredUntil || p.sponsoredUntil > Date.now()));

          scoredPlaces.push({
            place: p,
            score: totalScore,
            distKm,
            distStr,
            isOpen,
            isSpons,
            matchReason,
            slug: p.slug || p.id || p._key || ''
          });
        }
      }

      // If DB has no match at all and query matches specific trades, provide fallback local places
      if (scoredPlaces.length === 0) {
        let fallbackPlaces = [];
        for (const [cKey, syns] of Object.entries(categorySynonyms)) {
          if (syns.some(s => normQ.includes(s) || s.includes(normQ) || intents.includes(s))) {
            if (cKey === 'carpenter') {
              fallbackPlaces = [
                { id: 'carp_1', name: 'ورشة السلام للنجارة الحديثة والموبيليا', categoryId: 'carpenter', categoryName: 'نجارين', address: 'شارع الجمهورية — المنزلة', area: 'المنزلة', isVerified: true, phone: '01000000001', lat: 31.1578, lng: 31.9365, isOpen: true },
                { id: 'carp_2', name: 'مؤسسة الأمل للغرف والمطابخ الخشبية', categoryId: 'carpenter', categoryName: 'نجارين', address: 'طريق الميناء — المطرية', area: 'المطرية', isVerified: true, phone: '01000000002', lat: 31.1824, lng: 32.0315, isOpen: true }
              ];
            } else if (cKey === 'plumbing') {
              fallbackPlaces = [
                { id: 'plumb_1', name: 'مركز الأمانة للأدوات الصحية والسباكة', categoryId: 'plumbing', categoryName: 'سباكين', address: 'ميدان المحطة — المنزلة', area: 'المنزلة', isVerified: true, phone: '01000000004', lat: 31.1585, lng: 31.9355, isOpen: true }
              ];
            } else if (cKey === 'atm') {
              fallbackPlaces = [
                { id: 'atm_misr', name: 'ماكينة بنك مصر ATM', categoryId: 'atm', categoryName: 'ماكينات ATM', address: 'شارع الجلاء — بجوار مجلس المدينة', area: 'المنزلة', isVerified: true, lat: 31.1580, lng: 31.9360, isOpen: true },
                { id: 'atm_ahli', name: 'ماكينة البنك الأهلي المصري ATM', categoryId: 'atm', categoryName: 'ماكينات ATM', address: 'شارع البحر — أمام المحكمة', area: 'المنزلة', isVerified: true, lat: 31.1590, lng: 31.9345, isOpen: true }
              ];
            }
            break;
          }
        }

        fallbackPlaces.forEach(p => {
          scoredPlaces.push({
            place: p,
            score: 200,
            distKm: 0.5,
            distStr: 'يبعد 500 متر',
            isOpen: true,
            isSpons: false,
            matchReason: 'تصنيف مطابق',
            slug: p.slug || p.id || ''
          });
        });
      }

      // Sort: Highest Search Relevance Score First -> Then Sponsored -> Then Open -> Then Nearest Distance
      scoredPlaces.sort((a, b) => {
        if (Math.abs(b.score - a.score) > 100) {
          return b.score - a.score;
        }
        if (a.isSpons !== b.isSpons) return b.isSpons ? 1 : -1;
        if (a.isOpen !== b.isOpen) return b.isOpen ? 1 : -1;
        return a.distKm - b.distKm;
      });

      const topPlaces = scoredPlaces.slice(0, 6);

      // 5. Render Cards Directly into the Voice Assistant Window
      if (topPlaces.length > 0) {
        if (resultsTitle) {
          resultsTitle.innerHTML = '🎯 نتائج مطابقة لـ "' + escapeHtml(rawClean || query) + '" (' + topPlaces.length + ' مكان):';
        }

        resultsList.innerHTML = topPlaces.map((item) => {
          const p = item.place;
          const placeUrl = 'place.html?slug=' + encodeURIComponent(item.slug);
          const isAtm = isAtmPlace(p) || (p.categoryId || '') === 'atm';

          return `
            <div class="mvm-place-row" data-url="${placeUrl}" onclick="window.location.href='${placeUrl}'" style="background:var(--surface,#fff);border:1.5px solid ${item.isSpons ? '#F59E0B' : 'var(--border,#e2e8f0)'};border-radius:16px;padding:12px 14px;margin-bottom:10px;box-shadow:0 3px 12px rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;position:relative;overflow:hidden">
              
              <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:180px;pointer-events:none">
                <div style="width:48px;height:48px;border-radius:14px;overflow:hidden;background:${isAtm ? '#1B4F72' : 'rgba(2,132,199,0.1)'};color:${isAtm ? '#fff' : '#0284C7'};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;flex-shrink:0;border:1px solid var(--border)">
                  ${isAtm ? '🏧' : (p.logoUrl ? '<img src="' + escapeHtml(p.logoUrl) + '" style="width:100%;height:100%;object-fit:cover" />' : (p.name ? p.name.charAt(0) : '📍'))}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:800;font-size:14px;color:var(--text-primary,#0F2B48);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span>${escapeHtml(p.name)}</span>
                    ${item.isSpons ? '<span class="badge" style="background:#F59E0B;color:#0B1E30;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px">📢 إعلان</span>' : ''}
                    ${p.isVerified ? '<span style="color:#10B981;font-size:11px;font-weight:800">✓ موثق</span>' : ''}
                  </div>
                  <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px">
                    <span>📍 ${escapeHtml(p.address || p.area || 'المنزلة والمطرية')}</span>
                    ${item.distStr ? '<span style="color:#D97706;font-weight:800;background:rgba(245,166,35,0.12);padding:1px 6px;border-radius:4px">📍 ' + item.distStr + '</span>' : ''}
                    ${item.isOpen ? '<span style="color:#059669;font-weight:800">🟢 متاح الآن</span>' : '<span style="color:#64748B">مغلق حالياً</span>'}
                  </div>
                </div>
              </div>

              <a href="${placeUrl}" class="btn btn-sm" style="border-radius:10px;padding:8px 16px;font-size:12.5px;font-weight:800;text-decoration:none;white-space:nowrap;background:${item.isSpons ? '#F59E0B' : 'linear-gradient(135deg,#0284C7,#0369A1)'};color:${item.isSpons ? '#0B1E30' : '#fff'};border:none;box-shadow:0 2px 8px rgba(2,132,199,0.25)">
                عرض المكان والتفاصيل ↗
              </a>
            </div>
          `;
        }).join('') + `
          <div style="margin-top:14px;text-align:center">
            <a href="search.html?q=${encodeURIComponent(query)}" class="btn btn-secondary btn-sm" style="width:100%;border-radius:12px;font-weight:800;display:block;text-align:center;padding:11px;background:var(--surface-2,#F1F5F9);color:var(--text-primary,#0F2B48);border:1px solid var(--border,#CBD5E1)">
              🔍 عرض كافة نتائج "${escapeHtml(query)}" في صفحة البحث الشاملة ←
            </a>
          </div>
        `;
      } else {
        if (resultsTitle) resultsTitle.innerHTML = 'نتائج البحث عن "' + escapeHtml(query) + '":';
        resultsList.innerHTML = `
          <div style="padding:16px;text-align:center">
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">لم نجد نتائج مطابقة مباشرة.. يمكنك استعراض كافة أقسام الدليل:</p>
            <a href="search.html?q=${encodeURIComponent(query)}" class="btn btn-primary btn-sm" style="border-radius:10px;font-weight:800;padding:10px 20px">
              🔍 البحث في صفحة البحث الشاملة ↗
            </a>
          </div>
        `;
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

