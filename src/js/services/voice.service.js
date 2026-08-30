/**
 * المنزلة وناسها — Smart Voice Search Service (البحث الصوتي الذكي)
 * Arabic (Egyptian / Standard) voice recognition with instant normalization (أ/إ/آ, ى/ي, ة/ه),
 * conversational filler removal, and live search triggering.
 */

import { normalizeArabic } from '../utils/arabic.js';
import { toast } from '../ui/components/Toast.js';

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
            <h3 class="mvm-title">مساعد المنزلة الصوتي الذكي</h3>
            <p class="mvm-subtitle">تحدث بحرية.. وسنعثر لك على المكان فوراً</p>
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
    if (resultsList) {
      resultsList.innerHTML = `
        <div style="padding:15px;text-align:center;color:var(--text-muted)">
          <div class="spinner spinner-sm" style="margin:0 auto 8px"></div>
          جاري البحث عن أفضل النتائج في المنزلة...
        </div>
      `;
    }

    try {
      const { getPublishedPlaces, getCategories } = await import('../core/db.js');
      const { normalizeArabic, arabicScore } = await import('../utils/arabic.js');

      const [places, categories] = await Promise.all([
        getPublishedPlaces({ limit: 60 }),
        getCategories()
      ]);

      const normQ = normalizeArabic(query).toLowerCase();

      // Find direct matching places
      const scored = (places || []).map(p => {
        const nameScore = arabicScore(p.name || '', query);
        const descScore = arabicScore(p.description || '', query);
        const catScore = arabicScore(p.categoryId || '', query);
        const servScore = (p.services || []).some(s => normalizeArabic(s).includes(normQ)) ? 0.8 : 0;
        const total = Math.max(nameScore, descScore * 0.7, catScore * 0.9, servScore);
        return { place: p, score: total };
      }).filter(item => item.score > 0.15 || normalizeArabic(item.place.name || '').includes(normQ) || (item.place.area && normalizeArabic(item.place.area).includes(normQ)))
        .sort((a, b) => b.score - a.score);

      const topPlaces = scored.slice(0, 3).map(s => s.place);

      if (topPlaces.length > 0) {
        if (resultsTitle) resultsTitle.innerHTML = `🎯 وجدنا لك ${scored.length} مكان مطابق لـ "<strong>${escapeHtml(query)}</strong>":`;
        resultsList.innerHTML = `
          ${topPlaces.map(p => `
            <div class="mvm-place-row" onclick="window.location.href='place.html?slug=${encodeURIComponent(p.slug || p.id)}'">
              <div class="mvm-place-avatar">
                ${p.logoUrl 
                  ? `<img src="${escapeHtml(p.logoUrl)}" alt="${escapeHtml(p.name)}" />`
                  : `<div class="mvm-avatar-fallback">${escapeHtml((p.name || 'م')[0])}</div>`
                }
              </div>
              <div class="mvm-place-info">
                <div class="mvm-place-name">
                  <span>${escapeHtml(p.name)}</span>
                  ${p.isVerified ? '<span style="color:#10B981;font-size:11px">✓ موثق</span>' : ''}
                </div>
                <div class="mvm-place-meta">
                  <span>📍 ${escapeHtml(p.area || 'المنزلة')}</span>
                  ${p.phone ? `<span style="direction:ltr">📞 ${escapeHtml(p.phone)}</span>` : ''}
                </div>
              </div>
              <a href="place.html?slug=${encodeURIComponent(p.slug || p.id)}" class="btn btn-sm btn-primary" style="border-radius:8px;padding:4px 12px;font-size:12px;white-space:nowrap">عرض المكان ←</a>
            </div>
          `).join('')}

          <div style="margin-top:10px;text-align:center">
            <a href="search.html?q=${encodeURIComponent(query)}" class="btn btn-secondary btn-sm" style="width:100%;border-radius:10px;font-weight:700">
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
    } catch (err) {
      console.warn('[VoiceAssistant] search error:', err);
      if (resultsList) {
        resultsList.innerHTML = `
          <div style="text-align:center;padding:10px">
            <a href="search.html?q=${encodeURIComponent(query)}" class="btn btn-primary btn-sm">الانتقال لنتائج البحث ←</a>
          </div>
        `;
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

