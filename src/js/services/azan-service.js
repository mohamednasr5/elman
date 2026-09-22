/**
 * Dalil El Manzala & El Matariya — Fullscreen Azan Service
 * خدمة رفع الأذان التفاعلي بكامل الشاشة لمدينة المنزلة والمطرية
 * 
 * - فيديو متجاوب: pc.mp4 للأفقي و phone.mp4 للرأسي/الجوال
 * - صوت مخصص: adhan alfajr.mp3 لأذان الفجر، و adhan.mp3 لباقي الصلوات
 * - توقيت محلي دقيق لمدينة المنزلة والمطرية (Africa/Cairo)
 * - مؤقت نبضي دقيق بدون الحاجة لإعادة تحميل الصفحة
 * - استثناء لوحة التحكم
 */

// إحداثيات مدينة المنزلة والمطرية بمحافظة الدقهلية
const LATITUDE = 31.1582;
const LONGITUDE = 31.9360;

// مدة نافذة الأذان النشطة بالثواني (3 دقائق ونصف)
const AZAN_WINDOW_SECONDS = 210;

let _activeOverlay = null;
let _activeAudio = null;
let _activeVideo = null;
let _heartbeatTimer = null;
let _isServiceInitialized = false;

/**
 * فحص استثناء الصفحة الحالية (لوحة التحكم والإدارة)
 */
export function isExcludedPage() {
  if (typeof window === 'undefined') return true;
  const p = (window.location.pathname || '').toLowerCase();
  return (
    p.includes('/dashboard') ||
    p.includes('/admin') ||
    p.endsWith('dashboard.html') ||
    p.endsWith('admin.html')
  );
}

/**
 * معرفة فارق التوقيت لمصر تلقائياً (صيفي UTC+3 أو شتوي UTC+2)
 */
function getEgyptTimezoneOffset(date = new Date()) {
  try {
    const tzStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      timeZoneName: 'shortOffset'
    }).format(date);
    const m = tzStr.match(/GMT([+-]\d+)/);
    if (m) return parseInt(m[1], 10);
  } catch (_) {}
  const m = date.getMonth(); // الصيفي يبدأ أواخر إبريل وينتهي أواخر أكتوبر
  return (m >= 4 && m <= 9) ? 3 : 2;
}

/**
 * استخراج أجزاء التوقيت اللحظي الدقيق لمدينة المنزلة والمطرية (توقيت مصر)
 */
export function getEgyptNowParts(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    }).formatToParts(date);
    const p = {};
    for (const part of parts) {
      p[part.type] = parseInt(part.value, 10);
    }
    return {
      year: p.year,
      month: p.month,
      day: p.day,
      hours: (p.hour || 0) % 24,
      minutes: p.minute || 0,
      seconds: p.second || 0
    };
  } catch (_) {
    const tz = getEgyptTimezoneOffset(date);
    const utcHours = date.getUTCHours();
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hours: (utcHours + tz + 24) % 24,
      minutes: date.getUTCMinutes(),
      seconds: date.getUTCSeconds()
    };
  }
}

/**
 * حساب مواقيت الصلوات الخمس لمدينة المنزلة طبقاً للهيئة المصرية العامة للمساحة
 */
export function calculateElmanzalaPrayers(date = new Date()) {
  const d2r = Math.PI / 180;
  const r2d = 180 / Math.PI;

  const egParts = getEgyptNowParts(date);
  const timezone = getEgyptTimezoneOffset(date);

  const year = egParts.year;
  const month = egParts.month;
  const day = egParts.day;

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const d = jd - 2451545.0;

  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(g * d2r) + 0.020 * Math.sin(2 * g * d2r)) % 360;
  const e = 23.439 - 0.00000036 * d;
  const RA = Math.atan2(Math.cos(e * d2r) * Math.sin(L * d2r), Math.cos(L * d2r)) * r2d / 15;
  const decl = Math.asin(Math.sin(e * d2r) * Math.sin(L * d2r)) * r2d;
  const EqT = q / 15 - ((RA + 24) % 24);

  const noon = 12 + timezone - LONGITUDE / 15 - EqT;

  function sunHourAngle(angle, direction = 'ccw') {
    const cosHA = (Math.sin(angle * d2r) - Math.sin(LATITUDE * d2r) * Math.sin(decl * d2r)) / (Math.cos(LATITUDE * d2r) * Math.cos(decl * d2r));
    if (cosHA > 1 || cosHA < -1) return null;
    const ha = Math.acos(cosHA) * r2d / 15;
    return direction === 'ccw' ? -ha : ha;
  }

  // زوايا الهيئة العامة للمساحة المصرية
  const fajrHA = sunHourAngle(-19.5, 'ccw');
  const sunsetHA = sunHourAngle(-0.8333, 'cw');
  const ishaHA = sunHourAngle(-17.5, 'cw');

  const noonZenith = Math.abs(LATITUDE - decl);
  const asrZenith = Math.atan(1 + Math.tan(noonZenith * d2r)) * r2d;
  const asrHA = sunHourAngle(90 - asrZenith, 'cw');

  function toMinutes(hourDec) {
    let h = (hourDec + 24) % 24;
    return Math.round(h * 60);
  }

  function formatTime(minutes) {
    const h24 = Math.floor(minutes / 60) % 24;
    const min = minutes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    const h12 = h24 % 12 || 12;
    const period = h24 >= 12 ? 'م' : 'ص';
    return {
      time24: `${pad(h24)}:${pad(min)}`,
      time12: `${pad(h12)}:${pad(min)} ${period}`,
      totalMinutes: minutes
    };
  }

  return [
    { id: 'fajr', name: 'الفجر', isFajr: true, ...formatTime(toMinutes(noon + fajrHA)) },
    { id: 'dhuhr', name: 'الظهر', isFajr: false, ...formatTime(toMinutes(noon + 2 / 60)) },
    { id: 'asr', name: 'العصر', isFajr: false, ...formatTime(toMinutes(noon + asrHA)) },
    { id: 'maghrib', name: 'المغرب', isFajr: false, ...formatTime(toMinutes(noon + sunsetHA + 2 / 60)) },
    { id: 'isha', name: 'العشاء', isFajr: false, ...formatTime(toMinutes(noon + ishaHA)) }
  ];
}

/**
 * تحديد مسار الفيديو المناسب لشاشة المستخدم
 * - pc.mp4: للشاشات العريضة والأفقية (حاسوب، لابتوب، تابلت)
 * - phone.mp4: للهواتف الذكية والشاشات الرأسية
 */
export function getAppropriateVideoSrc() {
  if (typeof window === 'undefined') return '/azan/pc.mp4';
  const isLandscape = window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
  return isLandscape ? '/azan/pc.mp4' : '/azan/phone.mp4';
}

/**
 * تحديد مسار ملف الصوت المخصص لكل صلاة
 * - adhan alfajr.mp3 لصلاة الفجر حصراً
 * - adhan.mp3 لباقي الصلوات
 */
export function getAppropriateAudioSrc(prayer) {
  if (prayer && (prayer.id === 'fajr' || prayer.isFajr)) {
    return '/azan/adhan-alfajr.mp3';
  }
  return '/azan/adhan.mp3';
}

/**
 * التحقق مما إذا كان الأذان قد رُفع أو تم إغلاقه اليوم لهذه الصلاة
 */
function isPrayerDismissedToday(prayerId, dateKey) {
  try {
    const key = `azan_seen_${dateKey}_${prayerId}`;
    return !!(sessionStorage.getItem(key) || localStorage.getItem(key));
  } catch (_) {
    return false;
  }
}

/**
 * حفظ حالة الصلاة لمنع تكرار الأذان في نفس اليوم
 */
function markPrayerDismissed(prayerId, dateKey) {
  try {
    const key = `azan_seen_${dateKey}_${prayerId}`;
    sessionStorage.setItem(key, '1');
    localStorage.setItem(key, '1');
  } catch (_) {}
}

/**
 * إغلاق شاشة الأذان وإيقاف الوسائط بسلاسة
 */
export function closeAzan() {
  if (!_activeOverlay) return;

  const overlay = _activeOverlay;
  overlay.classList.add('azan-overlay--closing');

  if (_activeAudio) {
    try {
      _activeAudio.pause();
      _activeAudio.currentTime = 0;
      _activeAudio.removeAttribute('src');
      _activeAudio.load();
    } catch (_) {}
  }

  if (_activeVideo) {
    try {
      _activeVideo.pause();
      _activeVideo.removeAttribute('src');
      _activeVideo.load();
    } catch (_) {}
  }

  setTimeout(() => {
    try {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch (_) {}
    if (_activeOverlay === overlay) {
      _activeOverlay = null;
      _activeAudio = null;
      _activeVideo = null;
    }
  }, 450);
}

/**
 * تشغيل تجربة الأذان السينمائية بكامل الشاشة
 */
export function playAzan(prayer, dateKey) {
  if (typeof document === 'undefined') return;
  if (isExcludedPage()) return;
  if (_activeOverlay) return; // شاشة الأذان مفتوحة بالفعل

  if (dateKey && prayer?.id) {
    markPrayerDismissed(prayer.id, dateKey);
  }

  const videoSrc = getAppropriateVideoSrc();
  const audioSrc = getAppropriateAudioSrc(prayer);
  const prayerName = prayer?.name || 'الصلاة';
  const prayerTime = prayer?.time12 || '';

  // إنشاء العنصر الحاوي
  const overlay = document.createElement('div');
  overlay.className = 'azan-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `أذان صلاة ${prayerName}`);

  overlay.innerHTML = `
    <!-- فيديو الخلفية عالي الدقة -->
    <video class="azan-overlay__video" playsinline autoplay muted loop preload="auto">
      <source src="${videoSrc}" type="video/mp4">
    </video>

    <!-- تدرج سينمائي لضمان وضوح النصوص والأيقونات -->
    <div class="azan-overlay__scrim" aria-hidden="true"></div>

    <!-- شريط علوي يحتوي على الشعار وزر الإغلاق -->
    <div class="azan-overlay__topbar">
      <div class="azan-overlay__brand-pill">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/>
        </svg>
        <span>دليل المنزلة والمطرية الرقمي</span>
      </div>
      <button type="button" class="azan-overlay__close-btn" id="azan-close-btn" aria-label="إغلاق الأذان">
        <span>إغلاق الأذان</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- المحتوى المركزي الفاخر -->
    <div class="azan-overlay__center">
      <div class="azan-overlay__emblem" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 2L10 6h4l-2-4zm0 5c-3.31 0-6 2.69-6 6v7h12v-7c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4v5H8v-5c0-2.21 1.79-4 4-4zm-8 4v7h2v-7H4zm16 0v7h2v-7h-2z"/>
        </svg>
      </div>

      <div class="azan-overlay__badge">
        <span>🕌 رُفِعَ الآن الأذان المبارك</span>
      </div>

      <h1 class="azan-overlay__title">
        حان الآن موعد أذان <span class="azan-overlay__prayer-highlight">${prayerName}</span>
      </h1>

      <p class="azan-overlay__subtitle">
        حسب التوقيت المحلي لمدينة المنزلة والمطرية وما جاورهما
      </p>

      ${prayerTime ? `
        <div class="azan-overlay__time-box">
          <span>التوقيت:</span>
          <span class="azan-overlay__time-val">${prayerTime}</span>
        </div>
      ` : ''}

      <!-- موجات صوتية متحركة -->
      <div class="azan-overlay__wave" id="azan-wave" aria-hidden="true">
        <span class="azan-overlay__wave-bar"></span>
        <span class="azan-overlay__wave-bar"></span>
        <span class="azan-overlay__wave-bar"></span>
        <span class="azan-overlay__wave-bar"></span>
        <span class="azan-overlay__wave-bar"></span>
        <span class="azan-overlay__wave-bar"></span>
        <span class="azan-overlay__wave-bar"></span>
      </div>

      <!-- زر تشغيل الصوت في حال حجب المتصفح التشغيل التلقائي -->
      <button type="button" class="azan-overlay__unmute-btn" id="azan-unmute-btn" style="display:none;" aria-label="تشغيل صوت الأذان">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <span>انقر هنا لتشغيل صوت الأذان 🔊</span>
      </button>
    </div>

    <!-- تذييل الشاشة -->
    <div class="azan-overlay__bottom">
      <span>تقبل الله منا ومنكم صالح الأعمال والدعاء</span>
    </div>

    <!-- عنصر الصوت المستقل -->
    <audio class="azan-overlay__audio" preload="auto" playsinline>
      <source src="${audioSrc}" type="audio/mpeg">
    </audio>
  `;

  document.body.appendChild(overlay);

  _activeOverlay = overlay;
  const video = overlay.querySelector('video');
  const audio = overlay.querySelector('audio');
  const closeBtn = overlay.querySelector('#azan-close-btn');
  const unmuteBtn = overlay.querySelector('#azan-unmute-btn');
  const wave = overlay.querySelector('#azan-wave');

  _activeAudio = audio;
  _activeVideo = video;

  // إغلاق عند النقر على الزر
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAzan();
    });
  }

  // إغلاق عند الضغط على زر Escape
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeAzan();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
  document.addEventListener('keydown', onKeyDown);

  // تحديث الفيديو إذا تم تغيير اتجاه الشاشة أثناء العرض
  const onResize = () => {
    if (!_activeOverlay) {
      window.removeEventListener('resize', onResize);
      return;
    }
    const currentSrc = video.querySelector('source')?.getAttribute('src');
    const neededSrc = getAppropriateVideoSrc();
    if (currentSrc !== neededSrc) {
      video.pause();
      video.src = neededSrc;
      video.load();
      video.play().catch(() => {});
    }
  };
  window.addEventListener('resize', onResize, { passive: true });

  // تشغيل الفيديو المكتوم (مسموح به دائماً في كافة المتصفحات دون استثناء)
  if (video) {
    video.play().catch(() => {});
  }

  // تشغيل الصوت مع معالجة سياسة التشغيل التلقائي للمتصفحات (Autoplay Policy)
  if (audio) {
    audio.volume = 1.0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // الصوت اشتغل بنجاح وتلقائياً
          if (unmuteBtn) unmuteBtn.style.display = 'none';
        })
        .catch((err) => {
          // المتصفح حظر الصوت التلقائي لعدم وجود نقرة سابقة
          console.warn('[Azan] Audio autoplay blocked by browser, showing unmute prompt:', err);
          if (unmuteBtn) unmuteBtn.style.display = 'inline-flex';
          if (wave) wave.style.opacity = '0.3';

          const enableAudio = () => {
            audio.play().then(() => {
              if (unmuteBtn) unmuteBtn.style.display = 'none';
              if (wave) wave.style.opacity = '1';
              cleanupOneTouch();
            }).catch(() => {});
          };

          const cleanupOneTouch = () => {
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
          };

          if (unmuteBtn) {
            unmuteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              enableAudio();
            });
          }

          // نقرة على أي مكان في الشاشة لتفعيل الصوت
          document.addEventListener('click', enableAudio, { once: true });
          document.addEventListener('touchstart', enableAudio, { once: true });
        });
    }

    // عند انتهاء تلاوة الأذان، إغلاق الشاشة تلقائياً بعد 3 ثوانٍ
    audio.addEventListener('ended', () => {
      setTimeout(() => {
        closeAzan();
      }, 3500);
    });
  }
}

/**
 * فحص التوقيت الحالي لمدينة المنزلة والمطرية ومقارنته بمواقيت الصلوات
 */
export function checkPrayerTimesHeartbeat() {
  if (isExcludedPage()) return;
  if (_activeOverlay) return; // الأذان قيد العرض حالياً

  const now = new Date();
  const egParts = getEgyptNowParts(now);
  const currentSecondsInDay = egParts.hours * 3600 + egParts.minutes * 60 + egParts.seconds;
  const dateKey = `${egParts.year}-${String(egParts.month).padStart(2, '0')}-${String(egParts.day).padStart(2, '0')}`;

  const prayers = calculateElmanzalaPrayers(now);

  for (const p of prayers) {
    const pSeconds = p.totalMinutes * 60;
    const diff = currentSecondsInDay - pSeconds;

    // إذا حان موعد الأذان أو كان الزائر في نفس توقيت الأذان (خلال نافذة الـ 210 ثانية)
    if (diff >= 0 && diff < AZAN_WINDOW_SECONDS) {
      if (!isPrayerDismissedToday(p.id, dateKey)) {
        console.log(`[Azan] 🕌 حان الآن موعد أذان ${p.name} بتوقيت المنزلة والمطرية!`);
        playAzan(p, dateKey);
        break;
      }
    }
  }
}

function loadAzanStyles() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('azan-overlay-css')) {
    const link = document.createElement('link');
    link.id = 'azan-overlay-css';
    link.rel = 'stylesheet';
    link.href = '/src/css/components/azan-overlay.css?v=5.6.0';
    document.head.appendChild(link);
  }
}

/**
 * تهيئة خدمة الأذان على مستوى الموقع
 */
export function initAzanService() {
  if (isExcludedPage()) return;
  if (_isServiceInitialized) return;
  _isServiceInitialized = true;

  try { loadAzanStyles(); } catch (_) {}

  // فحص أولي فوري عند فتح أي صفحة (في حال دخل الزائر وقت رفع الأذان)
  setTimeout(() => {
    checkPrayerTimesHeartbeat();
  }, 1000);

  // نبض مستمر كل ثانية للتحقق من الموعد بدقة بالغة
  if (!_heartbeatTimer) {
    _heartbeatTimer = setInterval(checkPrayerTimesHeartbeat, 1000);
  }

  // فحص فوري عند عودة التبويب للنشاط أو التركيز (Background tab wakeup)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkPrayerTimesHeartbeat();
      }
    }, { passive: true });
    window.addEventListener('focus', checkPrayerTimesHeartbeat, { passive: true });
  }

  // إتاحة دالة اختبار سريعة في الكونسول للمطورين والمالك
  if (typeof window !== 'undefined') {
    window.__testAzan = (prayerName = 'asr') => {
      const prayers = calculateElmanzalaPrayers(new Date());
      const selected = prayers.find(p => p.id === String(prayerName).toLowerCase()) || prayers[2];
      playAzan(selected, null);
    };
    window.__closeAzan = closeAzan;
  }
}

// تسجيل فوري عند تحميل الموديول لضمان توفرها المباشر في الكونسول
if (typeof window !== 'undefined') {
  window.__testAzan = (prayerName = 'asr') => {
    const prayers = calculateElmanzalaPrayers(new Date());
    const selected = prayers.find(p => p.id === String(prayerName).toLowerCase()) || prayers[2];
    playAzan(selected, null);
  };
  window.__closeAzan = closeAzan;
}

