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
        <span class="mvm-chips-label">أو اختر سريعاً:</span>
        <div class="mvm-chips-scroll">
          <button type="button" class="mvm-chip" data-query="atm" style="background:linear-gradient(135deg,rgba(15,43,72,0.9),rgba(27,79,114,0.9));color:#fff;border-color:rgba(255,255,255,0.2);font-weight:800">🏧 ماكينة ATM (أقرب صراف آلي)</button>
          <button type="button" class="mvm-chip" data-query="صيدلية">💊 صيدلية</button>
          <button type="button" class="mvm-chip" data-query="دكتور">🩺 دكتور</button>
          <button type="button" class="mvm-chip" data-query="مطعم">🍕 مطعم</button>
          <button type="button" class="mvm-chip" data-query="كافيه">☕ كافيه</button>
          <button type="button" class="mvm-chip" data-query="سباك">🪠 سباك</button>
          <button type="button" class="mvm-chip" data-query="نجار">🪚 نجار</button>
          <button type="button" class="mvm-chip" data-query="سوبر ماركت">🛒 سوبر ماركت</button>
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

    const dialectMeta = extractSmartDialectKeyword(query);
    const rawClean = dialectMeta.keyword;
    const normQ = normalizeArabic(rawClean || query).toLowerCase();
    const queryFullNorm = normalizeArabic(query).toLowerCase();
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
        resultsList.innerHTML = `
          <div style="padding:15px;text-align:center;color:var(--text-muted)">
            <div class="spinner spinner-sm" style="margin:0 auto 8px"></div>
            جاري البحث السريع...
          </div>
        `;
      }
      places = await getPublishedPlaces({ limit: 150 }).catch(() => []);
      _voiceHotCache.places = places;
    }

    const userLocationCoords = _voiceHotCache.userCoords || MANZALA_CENTER;

    // ── 1. Special ATM & Cash Machines Handling ──
    if (isAtmSearch) {
      const atmPlaces = (places || []).filter(p => isAtmPlace(p) && isAtmReadyAndOperational(p, 15));
      const wantsCash = normQ.includes('سحب') || normQ.includes('كاش') || normQ.includes('فلوس');

      const atmScored = atmPlaces.map(p => {
        const coords = getPlaceCoords(p) || MANZALA_CENTER;
        const distKm = userLocationCoords ? calculateDistanceKm(userLocationCoords.lat, userLocationCoords.lng, coords.lat, coords.lng) : Infinity;
        const status = getAtmLiveStatus(p, 15);

        return {
          place: p,
          distKm,
          distStr: formatDistance(distKm),
          status,
          coords
        };
      });

      atmScored.sort((a, b) => {
        if (wantsCash) {
          if (a.status?.hasCash && !b.status?.hasCash) return -1;
          if (!a.status?.hasCash && b.status?.hasCash) return 1;
        }
        return a.distKm - b.distKm;
      });

      if (atmScored.length > 0) {
        if (resultsTitle) {
          resultsTitle.innerHTML = `🏧 أقرب ماكينات الصراف الآلي (ATM) لموقعك مرتبة بالأقرب:`;
        }

        resultsList.innerHTML = `
          ${atmScored.slice(0, 5).map((item, idx) => {
            const p = item.place;
            const placeUrl = `place.html?slug=${encodeURIComponent(p.slug || p.id)}`;
            const distLabel = item.distStr ? `على بعد ${item.distStr}` : escapeHtml(p.area || 'المنزلة');

            return `
              <div style="background:var(--surface,#fff);border:1.5px solid var(--border,#e2e8f0);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px">
                  <img src="assets/images/atm-logo.png" alt="ATM" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #F5A623;flex-shrink:0" />
                  <div style="min-width:0;flex:1">
                    <div style="font-weight:800;font-size:14px;color:var(--text-primary,#0F2B48);line-height:1.3;margin-bottom:3px">
                      ${escapeHtml(p.name)}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                      <span style="font-size:11.5px;color:#D97706;font-weight:700;background:rgba(245,166,35,0.12);padding:2px 8px;border-radius:9999px">
                        📍 ${distLabel}
                      </span>
                      ${idx === 0 ? '<span style="font-size:10.5px;color:#047857;font-weight:800;background:rgba(16,185,129,0.15);padding:2px 6px;border-radius:4px">⚡ الأقرب</span>' : ''}
                      <span style="font-size:10.5px;color:#059669;font-weight:700;background:rgba(16,185,129,0.1);padding:2px 6px;border-radius:4px">🟢 متاح 24 ساعة</span>
                    </div>
                  </div>
                </div>

                <a href="${placeUrl}" class="btn btn-primary btn-sm" style="border-radius:8px;padding:8px 14px;font-size:12.5px;font-weight:700;white-space:nowrap;flex-shrink:0;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                  <span>عرض تفاصيل الماكينة</span>
                  <span>←</span>
                </a>
              </div>
            `;
          }).join('')}

          <div style="margin-top:10px;text-align:center">
            <a href="places.html?category=atm" class="btn btn-secondary btn-sm" style="width:100%;border-radius:10px;font-weight:700;display:block;text-align:center;padding:10px">
              🏧 استعراض كافة ماكينات الصراف الآلي بالدليل (${atmScored.length} ماكينة) ←
            </a>
          </div>
        `;
        return;
      }
    }

    // ── 2. Special Medical & Doctor Query Handling ──
    const isDoctorQuery = (
      normQ.includes('دكتور') ||
      normQ.includes('طبيب') ||
      normQ.includes('عياد') ||
      normQ.includes('استشاري') ||
      normQ.includes('اخصائي') ||
      normQ.includes('جراح') ||
      normQ.includes('اسنان') ||
      normQ.includes('باطنة') ||
      normQ.includes('باطنه') ||
      normQ.includes('اطفال') ||
      normQ.includes('عظام') ||
      normQ.includes('جلدية') ||
      normQ.includes('جلديه') ||
      normQ.includes('عيون') ||
      normQ.includes('اورام') ||
      normQ.includes('مخ واعصاب') ||
      normQ.includes('قلب') ||
      normQ.includes('نساء وتوليد') ||
      normQ.includes('مسالك')
    );

    if (isDoctorQuery) {
      const medicalSpecialties = [
        'جراحة عامة', 'جراحة', 'أسنان', 'اسنان', 'باطنة وجهاز هضمي', 'باطنة', 'باطنه', 
        'أطفال وحديثي الولادة', 'أطفال', 'اطفال', 'عظام ومفاصل', 'عظام', 
        'نساء وتوليد', 'جلدية وتجميل', 'جلدية', 'جلديه', 'عيون ورمد', 'عيون', 'رمد', 
        'أنف وأذن وحنجرة', 'أنف وأذن', 'انف واذن', 'أورام', 'اورام', 
        'مخ وأعصاب', 'مخ واعصاب', 'قلب وأوعية دموية', 'قلب', 
        'مسالك بولية وتناسلية', 'مسالك', 'علاج طبيعي وتغذية', 'علاج طبيعي', 
        'صدر وحساسية', 'صدر', 'ذكورة وعقم', 'ذكورة', 'تجميل'
      ];

      let targetSpecialty = '';
      for (const spec of medicalSpecialties) {
        if (normQ.includes(normalizeArabic(spec).toLowerCase())) {
          targetSpecialty = spec;
          break;
        }
      }

      const doctorPlaces = (places || []).filter(p => {
        const pCat = normalizeArabic(`${p.categoryId || ''} ${p.customCategory || ''} ${p.categoryName || ''}`).toLowerCase();
        const pName = normalizeArabic(p.name || '').toLowerCase();
        const pSpec = normalizeArabic(p.medicalSpecialty || '').toLowerCase();
        const pServices = (p.services || []).map(s => normalizeArabic(s).toLowerCase());

        const isDocPlace = pCat.includes('doctor') || pCat.includes('clinic') || pCat.includes('دكتور') || pCat.includes('عياد') || pName.includes('دكتور') || pName.includes('طبيب') || Boolean(p.medicalSpecialty);
        if (!isDocPlace) return false;

        if (targetSpecialty) {
          const specNorm = normalizeArabic(targetSpecialty).toLowerCase();
          const matchesSpec = pSpec.includes(specNorm) || pName.includes(specNorm) || pServices.some(s => s.includes(specNorm)) || pCat.includes(specNorm);
          return matchesSpec;
        }

        return true;
      });

      if (doctorPlaces.length > 0) {
        const scoredDoctors = doctorPlaces.map(p => {
          const coords = getPlaceCoords(p) || MANZALA_CENTER;
          const distKm = userLocationCoords ? calculateDistanceKm(userLocationCoords.lat, userLocationCoords.lng, coords.lat, coords.lng) : Infinity;
          const distStr = formatDistance(distKm);
          const rating = p.avgRating || p.rating || 5.0;
          const reviewsCount = p.totalReviews || p.reviewsCount || 0;
          const isOpen = p.alwaysOpen || (p.workingHours ? isPlaceOpen(p.workingHours) : true);
          
          let qualityScore = rating * (1 + 0.15 * Math.log10(reviewsCount + 1)) + (p.isVerified ? 1.5 : 0);
          if (dialectMeta.wantsOpenNow && isOpen) qualityScore += 5;
          if (dialectMeta.wantsNearest && distKm < 2) qualityScore += 3;

          return {
            place: p,
            distKm,
            distStr,
            rating,
            reviewsCount,
            qualityScore,
            isOpen,
            coords
          };
        });

        if (dialectMeta.wantsOpenNow) {
          scoredDoctors.sort((a, b) => (b.isOpen ? 1 : 0) - (a.isOpen ? 1 : 0) || b.qualityScore - a.qualityScore);
        } else if (dialectMeta.wantsBest) {
          scoredDoctors.sort((a, b) => b.qualityScore - a.qualityScore || a.distKm - b.distKm);
        } else {
          scoredDoctors.sort((a, b) => {
            if (a.place.isVerified && !b.place.isVerified) return -1;
            if (!a.place.isVerified && b.place.isVerified) return 1;
            return a.distKm - b.distKm || b.qualityScore - a.qualityScore;
          });
        }

        const titleText = dialectMeta.wantsOpenNow
          ? `🟢 أطباء ${targetSpecialty ? `تخصص "${escapeHtml(targetSpecialty)}"` : ''} المتاحين والعيادات المفتوحة الآن:`
          : dialectMeta.wantsBest
          ? `⭐ أفضل الأطباء ${targetSpecialty ? `تخصص "${escapeHtml(targetSpecialty)}"` : ''} في المنزلة والمطرية حسب التقييمات:`
          : `👨‍⚕️ أطباء ${targetSpecialty ? `تخصص "${escapeHtml(targetSpecialty)}"` : ''} مرتبين بالأقرب لموقعك:`;

        if (resultsTitle) resultsTitle.innerHTML = titleText;

        resultsList.innerHTML = `
          ${scoredDoctors.slice(0, 5).map((item, idx) => {
            const p = item.place;
            const placeUrl = `place.html?slug=${encodeURIComponent(p.slug || p.id)}`;
            const isTopRated = idx === 0 && dialectMeta.wantsBest;

            return `
              <div style="background:var(--surface,#fff);border:1.5px solid ${isTopRated ? '#F59E0B' : 'var(--border,#e2e8f0)'};border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px">
                  ${p.logoUrl 
                    ? `<img src="${escapeHtml(p.logoUrl)}" alt="${escapeHtml(p.name)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #0284C7;flex-shrink:0" />`
                    : `<div style="width:48px;height:48px;border-radius:50%;background:#E0F2FE;color:#0369A1;display:flex;align-items:center;justify-content:center;font-size:22px;border:2px solid #0284C7;flex-shrink:0">👨‍⚕️</div>`
                  }
                  <div style="min-width:0;flex:1">
                    <div style="font-weight:800;font-size:14px;color:var(--text-primary,#0F2B48);display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
                      <span>${escapeHtml(p.name)}</span>
                      ${p.isVerified ? '<span style="color:#10B981;font-size:11px;font-weight:700">✓ موثق</span>' : ''}
                      ${isTopRated ? '<span class="badge" style="background:#F59E0B;color:#fff;font-size:10.5px;font-weight:800;padding:2px 6px;border-radius:4px">🏆 الأعلى تقييماً</span>' : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px">
                      <span class="badge" style="background:#E0F2FE;color:#0369A1;font-weight:700;font-size:11px;padding:2px 8px;border-radius:9999px">
                        🩺 ${escapeHtml(p.medicalSpecialty || targetSpecialty || 'طبيب استشاري')}
                      </span>
                      ${item.isOpen ? '<span style="color:#059669;font-weight:700;font-size:11px;background:rgba(16,185,129,0.1);padding:2px 6px;border-radius:4px">🟢 مفتوح الآن</span>' : ''}
                      <span style="color:#D97706;font-weight:700;font-size:11.5px">
                        ★ ${item.rating.toFixed(1)} (${item.reviewsCount} تقييم)
                      </span>
                      ${item.distStr ? `<span style="color:var(--text-muted);font-size:11px">📍 ${item.distStr}</span>` : ''}
                    </div>
                  </div>
                </div>

                <a href="${placeUrl}" class="btn btn-primary btn-sm" style="border-radius:8px;padding:8px 14px;font-size:12.5px;font-weight:700;white-space:nowrap;flex-shrink:0;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                  <span>تفاصيل العيادة والحجز</span>
                  <span>←</span>
                </a>
              </div>
            `;
          }).join('')}

          <div style="margin-top:10px;text-align:center">
            <a href="places.html?category=doctor${targetSpecialty ? `&q=${encodeURIComponent(targetSpecialty)}` : ''}" class="btn btn-secondary btn-sm" style="width:100%;border-radius:10px;font-weight:700;display:block;text-align:center;padding:10px">
              👨‍⚕️ تصفح كافة عيادات الأطباء في الدليل (${doctorPlaces.length} طبيب) ←
            </a>
          </div>
        `;
        return;
      }
    }

    // ── 3. General Comprehensive Place Search ──
    const isPlaceSponsored = (p) => Boolean(
      (p.isSponsored || p.isFeatured || p.isPromoted) && 
      (!p.sponsoredUntil || p.sponsoredUntil > Date.now())
    );

    const checkPlaceIsOpen = (p) => {
      if (isAtmPlace(p)) return true;
      if (p.alwaysOpen) return true;
      if (!p.workingHours) return true;
      const openState = isPlaceOpen(p.workingHours);
      return openState !== false;
    };

    const allCachedProducts = _voiceHotCache.products || [];
    const allCachedOffers = _voiceHotCache.offers || [];

    const scored = (places || []).map(p => {
      const pId = p.id || p.slug;
      const pName = normalizeArabic(p.name || '').toLowerCase();
      const pNameEn = (p.nameEn || '').toLowerCase();
      const pSpec = normalizeArabic(p.medicalSpecialty || '').toLowerCase();
      const pDesc = normalizeArabic(p.description || '').toLowerCase();
      const pAddress = normalizeArabic(p.address || '').toLowerCase();
      const pArea = normalizeArabic(p.area || '').toLowerCase();
      const pCat = normalizeArabic(`${p.customCategory || ''} ${p.categoryName || ''} ${p.categoryId || ''}`).toLowerCase();
      const pServices = (p.services || []).map(s => normalizeArabic(s).toLowerCase());

      // 1. Direct Field Scores
      const nameScore = Math.max(arabicScore(p.name || '', query), arabicScore(p.name || '', rawClean));
      const nameEnScore = pNameEn && pNameEn.includes(normQ) ? 0.9 : 0;
      const specScore = p.medicalSpecialty ? Math.max(arabicScore(p.medicalSpecialty, query), arabicScore(p.medicalSpecialty, rawClean)) : 0;
      const addressScore = p.address ? Math.max(arabicScore(p.address, query), arabicScore(p.address, rawClean)) * 0.9 : 0;
      const areaScore = p.area ? Math.max(arabicScore(p.area, query), arabicScore(p.area, rawClean)) * 0.85 : 0;
      const descScore = p.description ? Math.max(arabicScore(p.description, query), arabicScore(p.description, rawClean)) * 0.75 : 0;
      const catScore = arabicScore(p.categoryId || p.categoryName || '', rawClean || query);

      // 2. Services / Keywords Match
      let servScore = 0;
      if (pServices.some(s => s.includes(normQ) || normQ.includes(s))) {
        servScore = 0.95;
      }

      // 3. Deep Product Search for this place (e.g. بيتزا, شاورما, كريب, برجر, سمك, تورتة)
      let matchedProduct = null;
      let productScore = 0;
      const placeProducts = allCachedProducts.filter(prod => prod.placeId === pId);
      for (const prod of placeProducts) {
        const prodNameNorm = normalizeArabic(prod.name || '').toLowerCase();
        const prodDescNorm = normalizeArabic(prod.description || '').toLowerCase();
        if (prodNameNorm.includes(normQ) || normQ.includes(prodNameNorm) || intents.some(i => prodNameNorm.includes(i) || i.includes(prodNameNorm))) {
          matchedProduct = prod;
          productScore = 0.98;
          break;
        }
      }

      // 4. Deep Offer Search for this place (e.g. خصم على البيتزا, عرض التوفير)
      let matchedOffer = null;
      let offerScore = 0;
      const placeOffers = allCachedOffers.filter(off => off.placeId === pId);
      for (const off of placeOffers) {
        const offTitleNorm = normalizeArabic(off.title || '').toLowerCase();
        const offDescNorm = normalizeArabic(off.description || '').toLowerCase();
        if (offTitleNorm.includes(normQ) || normQ.includes(offTitleNorm) || intents.some(i => offTitleNorm.includes(i) || i.includes(offTitleNorm))) {
          matchedOffer = off;
          offerScore = 0.95;
          break;
        }
      }

      // 5. Deep cross-field intent matching
      let intentScore = 0;
      const fullPlaceIndex = `${pName} ${pNameEn} ${pSpec} ${pServices.join(' ')} ${pAddress} ${pArea} ${pCat} ${pDesc}`;
      intents.forEach(intent => {
        if (!intent || intent.length < 2) return;
        if (pName.includes(intent) || pSpec.includes(intent)) intentScore = Math.max(intentScore, 0.95);
        else if (pServices.some(s => s.includes(intent) || intent.includes(s))) intentScore = Math.max(intentScore, 0.9);
        else if (pAddress.includes(intent) || pArea.includes(intent)) intentScore = Math.max(intentScore, 0.85);
        else if (pCat.includes(intent)) intentScore = Math.max(intentScore, 0.85);
        else if (pDesc.includes(intent)) intentScore = Math.max(intentScore, 0.7);
        else if (fullPlaceIndex.includes(intent)) intentScore = Math.max(intentScore, 0.65);
      });

      const directSubstringMatch = (
        pName.includes(normQ) ||
        pSpec.includes(normQ) ||
        pServices.some(s => s.includes(normQ)) ||
        pAddress.includes(normQ) ||
        pArea.includes(normQ) ||
        pCat.includes(normQ) ||
        pDesc.includes(normQ)
      );

      const relevanceScore = Math.max(
        nameScore,
        nameEnScore,
        specScore,
        servScore,
        productScore,
        offerScore,
        addressScore,
        areaScore,
        catScore * 0.9,
        descScore,
        intentScore,
        directSubstringMatch ? 0.75 : 0
      );

      const coords = getPlaceCoords(p) || MANZALA_CENTER;
      const distKm = userLocationCoords ? calculateDistanceKm(userLocationCoords.lat, userLocationCoords.lng, coords.lat, coords.lng) : Infinity;
      const distStr = formatDistance(distKm);
      const isOpen = checkPlaceIsOpen(p);
      const isExplicitlyClosed = isAtmPlace(p) ? false : (p.workingHours ? (isPlaceOpen(p.workingHours) === false) : false);

      // Dialect boosted compound score
      let compoundScore = relevanceScore * 100;
      if (matchedProduct) compoundScore += 45;
      if (matchedOffer) compoundScore += 35;
      if (dialectMeta.wantsOpenNow) {
        if (isOpen) compoundScore += 80;
        if (isExplicitlyClosed) compoundScore -= 50;
      }
      if (dialectMeta.wantsNearest) {
        if (distKm < 1.5) compoundScore += 40;
        else if (distKm < 4.0) compoundScore += 20;
      }
      if (dialectMeta.wantsBest) {
        const rVal = p.avgRating || p.rating || 5.0;
        compoundScore += rVal * 10;
      }

      return {
        place: p,
        score: relevanceScore,
        compoundScore,
        matchedProduct,
        matchedOffer,
        isSpons: isPlaceSponsored(p),
        distKm,
        distStr,
        isOpen,
        isExplicitlyClosed,
        coords
      };
    }).filter(item => item.score > 0.12 && (!isAtmPlace(item.place) || isAtmReadyAndOperational(item.place, 15)));

    // Sort: Compound Dialect Score -> Open Now -> Distance
    scored.sort((a, b) => {
      if (a.isSpons && !b.isSpons) return -1;
      if (!a.isSpons && b.isSpons) return 1;
      return b.compoundScore - a.compoundScore || a.distKm - b.distKm;
    });

    const topPlaces = scored.slice(0, 5).map(s => ({
      ...s.place,
      _isSponsoredResult: s.isSpons,
      _distStr: s.distStr,
      _isOpen: s.isOpen,
      _isExplicitlyClosed: s.isExplicitlyClosed,
      _matchedProduct: s.matchedProduct,
      _matchedOffer: s.matchedOffer,
      _coords: s.coords
    }));

    if (topPlaces.length > 0) {
      const sponsoredCount = topPlaces.filter(p => p._isSponsoredResult).length;
      if (resultsTitle) {
        if (dialectMeta.wantsOpenNow) {
          resultsTitle.innerHTML = `🟢 نتائج البحث عن "${escapeHtml(rawClean || query)}" (المفتوحة وشغالة الآن):`;
        } else if (dialectMeta.wantsNearest) {
          resultsTitle.innerHTML = `📍 أقرب الأماكن لـ "${escapeHtml(rawClean || query)}" لموقعك:`;
        } else if (dialectMeta.wantsBest) {
          resultsTitle.innerHTML = `⭐ أفضل نتائج البحث عن "${escapeHtml(rawClean || query)}" حسب التقييمات:`;
        } else {
          resultsTitle.innerHTML = `🎯 أقرب الأماكن لـ "${escapeHtml(rawClean || query)}" مرتبة بالأقرب لموقعك${sponsoredCount > 0 ? ' (يتصدرها إعلان مميز ⭐)' : ''}:`;
        }
      }

      resultsList.innerHTML = `
        ${topPlaces.map((p, idx) => {
          const isSponsored = p._isSponsoredResult;
          const placeUrl = `place.html?slug=${encodeURIComponent(p.slug || p.id)}`;
          const rowStyle = isSponsored 
            ? 'background:linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.03) 100%);border:1.5px solid #F59E0B;box-shadow:0 3px 12px rgba(245,158,11,0.18);position:relative;margin-bottom:10px;border-radius:12px;padding:12px 14px;'
            : 'border:1.5px solid var(--border,#e2e8f0);margin-bottom:10px;border-radius:12px;padding:12px 14px;background:var(--surface,#fff);box-shadow:0 2px 8px rgba(0,0,0,0.04);';

          return `
            <div class="mvm-place-row ${isSponsored ? 'mvm-place-row--sponsored' : ''}" style="${rowStyle};display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap" onclick="window.location.href='${placeUrl}'">
              <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px">
                <div class="mvm-place-avatar" style="${isSponsored ? 'border:2px solid #F59E0B;' : ''};flex-shrink:0">
                  ${p.logoUrl 
                    ? `<img src="${escapeHtml(p.logoUrl)}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover" />`
                    : `<div class="mvm-avatar-fallback" style="${isSponsored ? 'background:#F59E0B;color:#fff;' : ''}">${escapeHtml((p.name || 'م')[0])}</div>`
                  }
                </div>
                <div class="mvm-place-info" style="flex:1;min-width:0">
                  <div class="mvm-place-name" style="font-weight:800;font-size:14px;color:var(--text-primary,#0F2B48);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span>${escapeHtml(p.name)}</span>
                    ${isSponsored ? `<span class="badge" style="background:linear-gradient(135deg, #F59E0B 0%, #D97706 100%);color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;box-shadow:0 1px 4px rgba(245,158,11,0.3);margin-right:4px">📢 إعلان</span>` : ''}
                    ${idx === 0 && !isSponsored ? '<span class="badge" style="background:#10B981;color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px">⚡ الأقرب إليك</span>' : ''}
                    ${p.isVerified ? '<span style="color:#10B981;font-size:11px;font-weight:700">✓ موثق</span>' : ''}
                  </div>
                  <div class="mvm-place-meta" style="margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px">
                    ${p._distStr ? `<span style="color:#D97706;font-weight:700">📍 على بعد ${p._distStr}</span>` : `<span>📍 ${escapeHtml(p.area || 'المنزلة')}</span>`}
                    ${p.alwaysOpen || isAtmPlace(p) ? '<span class="badge" style="background:rgba(16,185,129,0.15);color:#047857;font-weight:700;font-size:10.5px">🟢 متاح 24 ساعة</span>' : (p._isExplicitlyClosed ? '<span class="badge" style="background:#FEE2E2;color:#991B1B;font-size:10px">🔴 مغلق الآن</span>' : '<span class="badge" style="background:rgba(16,185,129,0.15);color:#047857;font-weight:700;font-size:10.5px">🟢 مفتوح الآن</span>')}
                    ${p.customCategory || p.categoryName ? `<span style="color:var(--primary);font-weight:600">🏷️ ${escapeHtml(p.customCategory || p.categoryName)}</span>` : ''}
                  </div>
                </div>
              </div>

              <a href="${placeUrl}" class="btn btn-sm ${isSponsored ? 'btn-secondary' : 'btn-primary'}" style="border-radius:8px;padding:7px 14px;font-size:12.5px;white-space:nowrap;font-weight:700;flex-shrink:0;text-decoration:none;${isSponsored ? 'background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;border:none;' : ''}">
                ${isSponsored ? '⭐ عرض الإعلان ←' : 'عرض المكان ←'}
              </a>
            </div>
          `;
        }).join('')}

        <div style="margin-top:10px;text-align:center">
          <a href="search.html?q=${encodeURIComponent(query)}" class="btn btn-secondary btn-sm" style="width:100%;border-radius:10px;font-weight:700;display:block;text-align:center;padding:10px">
            🔍 عرض كافة نتائج البحث (${scored.length} مكان) ←
          </a>
        </div>
      `;
    } else {
      if (resultsTitle) resultsTitle.innerHTML = `لم نجد نتائج مباشرة لـ "${escapeHtml(query)}"`;
      resultsList.innerHTML = `
        <div style="padding:12px;text-align:center">
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">يمكنك البحث المتقدم في الدليل بكافة الكلمات المرادفة:</p>
          <a href="search.html?q=${encodeURIComponent(query)}" class="btn btn-primary btn-sm" style="border-radius:8px">
            🔍 الانتقال لصفحة البحث الشاملة
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

