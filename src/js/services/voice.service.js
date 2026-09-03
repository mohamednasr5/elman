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
      if (interim && interim.trim().length > 2) {
        executeVoiceAssistantSearch(interim, true);
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
  orbBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!_modalVoiceInstance) {
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
          executeVoiceAssistantSearch(interim, true);
        },
        onResult: (finalText) => {
          if (transcriptBox) {
            transcriptBox.innerHTML = `<span class="mvm-final-query">🔍 "${finalText}"</span>`;
          }
          executeVoiceAssistantSearch(finalText, false);
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
    }

    if (_modalVoiceInstance && _modalVoiceInstance.isListening) {
      _modalVoiceInstance.stop();
    } else if (_modalVoiceInstance) {
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
  const closeBtn = document.getElementById('mvm-close-btn');
  const doClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeManzalaVoiceAssistantModal();
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', doClose);
    closeBtn.addEventListener('touchend', doClose, { passive: false });
  }

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop || e.target.closest('#mvm-close-btn')) {
      doClose(e);
    }
  });

      async function executeVoiceAssistantSearch(query, isInterim = false) {
    if (!query || !query.trim()) return;

    const resultsTitle = document.getElementById('mvm-results-title');
    const resultsList = document.getElementById('mvm-results-list');
    const resultsBox = document.getElementById('mvm-results-container');

    if (resultsBox) resultsBox.style.display = 'block';
    if (resultsTitle && !isInterim) {
      resultsTitle.innerHTML = '⚡ أفضل الأماكن المطابقة لـ "' + escapeHtml(query) + '":';
    }

    try {
      // ⚡ Sub-millisecond Execution (< 3ms)
      const results = await executeFastSearch(query, {
        userCoords: _voiceHotCache.userCoords,
        limit: 8
      });

      if (!resultsList) return;

      if (results.length === 0) {
        if (!isInterim) {
          resultsList.innerHTML = `
            <div style="text-align:center;padding:18px 12px;color:var(--text-muted)">
              <div style="font-size:24px;margin-bottom:6px">🔍</div>
              <div style="font-size:14px;font-weight:700">لم يتم العثور على مكان مطابق فورياً</div>
              <div style="font-size:12px;margin-top:4px">جرب التحدث باسم آخر مثل "دكتور أسنان"، "صيدلية بالمطرية"، "معمل ألبان"</div>
            </div>
          `;
        }
        return;
      }

      // Render Top Match Cards Immediately
      resultsList.innerHTML = results.map(doc => {
        const p = doc.raw || doc;
        const placeName = p.name || 'مكان بالدليل';
        const catName = p.categoryName || doc.category || 'نشاط تجاري';
        const fullAddress = p.address || p.area || 'مدينة المنزلة';
        const phone = p.phone || '';
        const whatsapp = p.whatsapp || p.phone || '';
        const placeSlug = p.slug || p.id || '';
        const matchedReason = doc.matchedReason || '';

        return `
          <div class="mvm-result-card animate-fade-in" style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:12px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${escapeHtml(placeName)}
                </h4>
                ${p.isVerified ? '<span style="color:#0284C7;font-size:13px;font-weight:800" title="موثق">✓</span>' : ''}
              </div>
              <div style="font-size:12px;color:var(--primary);font-weight:700;margin-bottom:2px">
                ${matchedReason ? `<span style="background:rgba(2,132,199,0.1);color:#0284C7;padding:1px 6px;border-radius:4px;font-size:11px;margin-left:4px">${escapeHtml(matchedReason)}</span>` : ''}
                ${escapeHtml(catName)}
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                📍 ${escapeHtml(fullAddress)}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              ${phone ? `
                <a href="tel:${escapeAttr(phone)}" class="btn btn-sm btn-primary" style="padding:6px 10px;font-size:12px;border-radius:8px;text-decoration:none" title="اتصال">
                  📞
                </a>
              ` : ''}
              ${whatsapp ? `
                <a href="https://wa.me/${formatVoiceWhatsApp(whatsapp)}" target="_blank" rel="noopener" class="btn btn-sm btn-whatsapp" style="padding:6px 10px;font-size:12px;border-radius:8px;text-decoration:none;display:inline-flex;align-items:center;gap:4px" title="محادثة واتساب"><img src="./icons/whatsapp.png" alt="WhatsApp" class="wa-official-icon-sm" /></a>
              ` : ''}
              <a href="place.html?slug=${escapeAttr(placeSlug)}" class="btn btn-sm btn-outline" style="padding:6px 10px;font-size:12px;border-radius:8px;text-decoration:none" title="عرض التفاصيل">
                👁️
              </a>
            </div>
          </div>
        `;
      }).join('');

      // If final speech, trigger natural smart audio synthesis
      if (!isInterim && results.length > 0) {
        speakAssistantVoiceResponse(results[0], results.length, query);
      }

    } catch (err) {
      console.error('[VoiceSearch] Instant Search Error:', err);
    }
  }

  function speakAssistantVoiceResponse(topResult, totalCount, query) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const pName = topResult.name || 'المكان';
      const text = totalCount === 1 
        ? `لقيت لك ${pName}` 
        : `لقيت لك ${totalCount} أماكن مطابقة، أول نتيجة هي ${pName}`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-EG';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }
}

export function closeManzalaVoiceAssistantModal() {
  if (_modalVoiceInstance) {
    try {
      _modalVoiceInstance.stop();
    } catch (_) {}
    _modalVoiceInstance = null;
  }
  const modals = document.querySelectorAll('.manzala-voice-modal-backdrop, #manzala-voice-modal-backdrop');
  modals.forEach(m => {
    m.classList.remove('visible');
    setTimeout(() => {
      m.remove();
    }, 200);
  });
  _activeVoiceModal = null;
  try { window.speechSynthesis?.cancel(); } catch (_) {}
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function bindGlobalVoiceAssistantFab() {
  if (typeof document === 'undefined') return;

  // 1. Direct Bind to all known floating FABs & Nav buttons
  const selectors = [
    '#global-voice-assistant-fab',
    '.bottom-nav__voice-assistant-fab',
    '.fab-voice-assistant',
    '#btn-global-voice-assistant',
    '.global-voice-trigger',
    '.btn-voice-search',
    '[data-action="voice-search"]',
    '[data-voice-trigger]'
  ];

  const handleTrigger = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openManzalaVoiceAssistantModal();
  };

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(btn => {
      btn.removeEventListener('click', handleTrigger);
      btn.addEventListener('click', handleTrigger);
      btn.addEventListener('touchend', (e) => {
        // Prevent ghost click on touch devices
        e.preventDefault();
        openManzalaVoiceAssistantModal();
      }, { passive: false });
    });
  });

  // 2. Global Event Delegation as foolproof safety net
  if (!window._globalVoiceFabDelegated) {
    window._globalVoiceFabDelegated = true;
    document.addEventListener('click', (e) => {
      const target = e.target.closest('#global-voice-assistant-fab, .bottom-nav__voice-assistant-fab, .fab-voice-assistant, #btn-global-voice-assistant, .global-voice-trigger, [data-voice-trigger]');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        openManzalaVoiceAssistantModal();
      }
    }, { capture: true });
  }
}

function formatVoiceWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('201') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('00201') && cleaned.length === 14) return cleaned.slice(2);
  if (cleaned.startsWith('01') && cleaned.length === 11) return '2' + cleaned;
  if (cleaned.startsWith('1') && cleaned.length === 10) return '20' + cleaned;
  if (cleaned.startsWith('21') && cleaned.length === 11) return '20' + cleaned.slice(1);
  return cleaned.startsWith('0') ? '2' + cleaned : cleaned;
}
