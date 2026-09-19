/**
 * مؤشرات السوق والطقس ومواقيت الصلاة الحية
 * Dalil El Manzala & El Matariya - Live Market, Weather & Prayer Times Indicators
 */

const STORAGE_KEY = 'manzala_market_indicators_v2';
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export function getEgyptTimeInfo() {
  const d = new Date();
  const curHour = (d.getUTCHours() + 3) % 24; // UTC+3 Egypt Time
  const isNight = curHour >= 18 || curHour < 6;
  return { curHour, isNight };
}

const ICONS = {
  gold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 17 22 12"></polyline>
  </svg>`,
  currency: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>`,
  prayer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v2"></path>
    <path d="M12 4a7 7 0 0 0-7 7v9h14v-9a7 7 0 0 0-7-7z"></path>
    <path d="M9 20v-5a3 3 0 0 1 6 0v5"></path>
  </svg>`
};

/**
 * دقة فلكية معتمدة وفق الهيئة المصرية العامة للمساحة لمواقيت الصلاة
 */
export function calculatePrayerTimes(date = new Date(), lat = 31.1582, lng = 31.9360, timezone = 3) {
  const d2r = Math.PI / 180;
  const r2d = 180 / Math.PI;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const d = jd - 2451545.0;

  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(g * d2r) + 0.020 * Math.sin(2 * g * d2r)) % 360;
  const e = 23.439 - 0.00000036 * d;
  const RA = Math.atan2(Math.cos(e * d2r) * Math.sin(L * d2r), Math.cos(L * d2r)) * r2d / 15;
  const decl = Math.asin(Math.sin(e * d2r) * Math.sin(L * d2r)) * r2d;
  const EqT = q / 15 - ((RA + 24) % 24);

  const noon = 12 + timezone - lng / 15 - EqT;

  function sunHourAngle(angle, direction = 'ccw') {
    const cosHA = (Math.sin(angle * d2r) - Math.sin(lat * d2r) * Math.sin(decl * d2r)) / (Math.cos(lat * d2r) * Math.cos(decl * d2r));
    if (cosHA > 1 || cosHA < -1) return null;
    const ha = Math.acos(cosHA) * r2d / 15;
    return direction === 'ccw' ? -ha : ha;
  }

  const fajrHA = sunHourAngle(-19.5, 'ccw');
  const sunriseHA = sunHourAngle(-0.8333, 'ccw');
  const sunsetHA = sunHourAngle(-0.8333, 'cw');
  const ishaHA = sunHourAngle(-17.5, 'cw');

  const noonZenith = Math.abs(lat - decl);
  const asrZenith = Math.atan(1 + Math.tan(noonZenith * d2r)) * r2d;
  const asrHA = sunHourAngle(90 - asrZenith, 'cw');

  function toMinutes(hourDec) {
    let h = (hourDec + 24) % 24;
    return Math.round(h * 60);
  }

  function formatTime(minutes) {
    const h24 = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    const h12 = h24 % 12 || 12;
    const period = h24 >= 12 ? 'م' : 'ص';
    return {
      time24: pad(h24) + ':' + pad(m),
      time12: pad(h12) + ':' + pad(m) + ' ' + period,
      totalMinutes: minutes
    };
  }

  const prayers = [
    { id: 'fajr', name: 'الفجر', icon: '🌙', ...formatTime(toMinutes(noon + fajrHA)) },
    { id: 'sunrise', name: 'الشروق', icon: '🌅', ...formatTime(toMinutes(noon + sunriseHA)) },
    { id: 'dhuhr', name: 'الظهر', icon: '☀️', ...formatTime(toMinutes(noon + 2 / 60)) },
    { id: 'asr', name: 'العصر', icon: '🌤️', ...formatTime(toMinutes(noon + asrHA)) },
    { id: 'maghrib', name: 'المغرب', icon: '🌇', ...formatTime(toMinutes(noon + sunsetHA + 2 / 60)) },
    { id: 'isha', name: 'العشاء', icon: '🌌', ...formatTime(toMinutes(noon + ishaHA)) }
  ];

  const now = new Date();
  const currentMinutes = (now.getUTCHours() + timezone) * 60 + now.getUTCMinutes();
  const currentSecondsInDay = currentMinutes * 60 + now.getUTCSeconds();

  let nextPrayer = null;
  let remainingSecs = 0;

  for (const p of prayers) {
    if (p.id === 'sunrise') continue;
    const pSeconds = p.totalMinutes * 60;
    if (pSeconds > currentSecondsInDay) {
      nextPrayer = p;
      remainingSecs = pSeconds - currentSecondsInDay;
      break;
    }
  }

  if (!nextPrayer) {
    nextPrayer = prayers[0];
    remainingSecs = (24 * 3600 - currentSecondsInDay) + (prayers[0].totalMinutes * 60);
  }

  const remH = Math.max(0, Math.floor(remainingSecs / 3600));
  const remM = Math.max(0, Math.floor((remainingSecs % 3600) / 60));
  const remS = Math.max(0, remainingSecs % 60);

  const hUnit = (remH >= 3 && remH <= 10) ? 'ساعات' : (remH === 2 ? 'ساعتان' : (remH === 1 ? 'ساعة واحدة' : 'ساعة'));
  const mUnit = 'دقيقة';
  const sUnit = 'ثانية';

  const hStr = String(remH);
  const mStr = String(remM);
  const sStr = String(remS).padStart(2, '0');

  const remText = `${hStr} ${hUnit} و ${mStr} ${mUnit} و ${sStr} ${sUnit}`;

  return { prayers, nextPrayer, remainingSecs, remH, remM, remS, hUnit, mUnit, sUnit, hStr, mStr, sStr, remText };
}

/**
 * Smart Animated Weather Engine:
 * Generates interactive, hardware-accelerated animated SVGs for:
 * - Sunny (rotating rays, glowing pulsing sun)
 * - Cloudy (multi-layer drifting clouds)
 * - Partly Cloudy (rotating sun with drifting cloud)
 * - Rain (falling animated raindrops)
 * - Thunder / Storm (dark storm cloud, falling drops, flashing lightning bolt)
 * - Night (glowing crescent moon with twinkling stars)
 * - Cloudy Night (moon with drifting clouds)
 */
export function getAnimatedWeatherSVG(weatherData = {}, isLarge = false) {
  const norm = normalizeWeatherData(weatherData);
  const cond = norm.condition.toLowerCase();
  const size = isLarge ? 48 : 20;

  if (cond === 'thunder') {
    return `<svg class="mw-weather-anim mw-weather-anim--thunder" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-cloud-main" d="M17.5 14H6.5A4.5 4.5 0 0 1 6.5 5 5 5 0 0 1 15.5 6 4.5 4.5 0 0 1 17.5 14z" fill="#334155" stroke="#64748b"/>
      <polygon class="mw-lightning-bolt" points="13 10 9 16 12 16 11 21 16 14 13 14 15 10" fill="#facc15" stroke="#eab308" stroke-width="1"/>
      <line class="mw-rain-drop-1" x1="7" y1="16" x2="6" y2="19" stroke="#38bdf8" stroke-width="2"/>
      <line class="mw-rain-drop-2" x1="17" y1="16" x2="16" y2="19" stroke="#38bdf8" stroke-width="2"/>
    </svg>`;
  }

  if (cond === 'rain') {
    return `<svg class="mw-weather-anim mw-weather-anim--rain" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-cloud-main" d="M17.5 13H6.5A4.5 4.5 0 0 1 6.5 4 5 5 0 0 1 15.5 5 4.5 4.5 0 0 1 17.5 13z" fill="#475569" stroke="#94a3b8"/>
      <line class="mw-rain-drop-1" x1="7.5" y1="15" x2="6.5" y2="19" stroke="#38bdf8" stroke-width="2"/>
      <line class="mw-rain-drop-2" x1="12" y1="15" x2="11" y2="19" stroke="#38bdf8" stroke-width="2"/>
      <line class="mw-rain-drop-3" x1="16.5" y1="15" x2="15.5" y2="19" stroke="#38bdf8" stroke-width="2"/>
    </svg>`;
  }

  if (cond === 'cloudy') {
    return `<svg class="mw-weather-anim mw-weather-anim--clouds" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-cloud-back" d="M15.5 11H8A3.5 3.5 0 0 1 8 4 4 4 0 0 1 15 5 3.5 3.5 0 0 1 15.5 11z" fill="#64748b" stroke="#94a3b8" opacity="0.75"/>
      <path class="mw-cloud-main" d="M18.5 17H7.5A4.5 4.5 0 0 1 7.5 8 5 5 0 0 1 16.5 9 4.5 4.5 0 0 1 18.5 17z" fill="#94a3b8" stroke="#cbd5e1"/>
    </svg>`;
  }

  if (cond === 'cloudynight' || cond === 'cloudy_night') {
    return `<svg class="mw-weather-anim mw-weather-anim--night" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-moon-body" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#fef08a" stroke="#fde047"/>
      <path class="mw-cloud-main" d="M19 19H8.5A4.5 4.5 0 0 1 8.5 11 4.5 4.5 0 0 1 17 12 4.5 4.5 0 0 1 19 19z" fill="#94a3b8" stroke="#cbd5e1" opacity="0.9"/>
      <circle class="mw-star-1" cx="19" cy="5" r="1.2" fill="#38bdf8"/>
    </svg>`;
  }

  if (cond === 'partlycloudy' || cond === 'partly_cloudy' || cond === 'partly') {
    return `<svg class="mw-weather-anim mw-weather-anim--partly" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g class="mw-sun-rays" stroke="#f59e0b" stroke-width="1.8">
        <line x1="16" y1="2" x2="16" y2="4"/>
        <line x1="21.6" y1="4.4" x2="20.2" y2="5.8"/>
        <line x1="23" y1="10" x2="21" y2="10"/>
      </g>
      <circle class="mw-sun-body" cx="16" cy="9" r="4.5" fill="#fbbf24" stroke="#f59e0b"/>
      <path class="mw-cloud-main" d="M17 19H6.5A4.5 4.5 0 0 1 6.5 10 5 5 0 0 1 15 11 4.5 4.5 0 0 1 17 19z" fill="#e2e8f0" stroke="#94a3b8"/>
    </svg>`;
  }

  if (cond === 'night') {
    return `<svg class="mw-weather-anim mw-weather-anim--night" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="mw-moon-body" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#fef08a" stroke="#fde047"/>
      <circle class="mw-star-1" cx="18" cy="5" r="1.2" fill="#38bdf8"/>
      <circle class="mw-star-2" cx="7" cy="6" r="1" fill="#e0f2fe"/>
    </svg>`;
  }

  // Default: Sunny (شمس ذهبية متحركة ومشعة)
  return `<svg class="mw-weather-anim mw-weather-anim--sun" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g class="mw-sun-rays" stroke="#f59e0b" stroke-width="1.9">
      <line x1="12" y1="1.5" x2="12" y2="3.5"/>
      <line x1="12" y1="20.5" x2="12" y2="22.5"/>
      <line x1="1.5" y1="12" x2="3.5" y2="12"/>
      <line x1="20.5" y1="12" x2="22.5" y2="12"/>
      <line x1="4.5" y1="4.5" x2="6" y2="6"/>
      <line x1="18" y1="18" x2="19.5" y2="19.5"/>
      <line x1="4.5" y1="19.5" x2="6" y2="18"/>
      <line x1="18" y1="6" x2="19.5" y2="4.5"/>
    </g>
    <circle class="mw-sun-body" cx="12" cy="12" r="5" fill="#f59e0b" stroke="#d97706"/>
  </svg>`;
}

export function normalizeWeatherData(weather = {}) {
  const { isNight } = getEgyptTimeInfo();
  let cond = String(weather?.condition || '').trim().toLowerCase();
  let label = String(weather?.conditionLabel || '').trim();

  // Smart nighttime adaptation:
  if (isNight) {
    if (/thunder|storm|برق|رعد/.test(cond) || /thunder|storm|برق|رعد/.test(label)) {
      cond = 'thunder';
      label = 'عواصف رعدية';
    } else if (/rain|أمطار|مطر/.test(cond) || /rain|أمطار|مطر/.test(label)) {
      cond = 'rain';
      label = 'أمطار';
    } else if (/cloudy|overcast|غيوم/.test(cond) && !/partly|sunny|شمس/.test(cond) && !/شمس/.test(label)) {
      cond = 'cloudy';
      label = 'غائم بالسحب';
    } else if (/partly|sunnycloud|شمس وسحب|شمس وسحاب|غائم جزئيا/.test(cond) || /شمس وسحب|غائم جزئيا/.test(label)) {
      cond = 'cloudyNight';
      label = 'سحب ليلية';
    } else {
      cond = 'night';
      label = 'صافٍ ليلاً';
    }
  } else {
    // Daytime:
    if (/night|ليل/.test(cond) || /صافٍ ليلاً|سحب ليلية/.test(label)) {
      if (cond === 'cloudyNight' || /سحب/.test(label)) {
        cond = 'partlyCloudy';
        label = 'شمس وسحب';
      } else {
        cond = 'sunny';
        label = 'مشمس صافٍ';
      }
    }
  }

  return {
    ...weather,
    city: 'المنزلة والمطرية',
    condition: cond || (isNight ? 'night' : 'sunny'),
    conditionLabel: label || (isNight ? 'صافٍ ليلاً' : 'مشمس صافٍ')
  };
}

function getStoredMarketData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) return parsed;
    }
  } catch (_) {}
  return null;
}

function saveStoredMarketData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (_) {}
}

const FALLBACK_DATA = {
  gold: {
    title: 'سعر جرام الذهب عيار 21',
    karat: '21',
    date: 'اليوم',
    price: '6330',
    rawPrice: 6330,
    currency: 'جنيه',
    rates: { k24: '7234', k21: '6330', k18: '5426' }
  },
  currency: {
    title: 'سعر صرف الدولار مقابل الجنيه المصري',
    code: 'USD',
    date: 'اليوم',
    price: '52.14',
    rawPrice: 52.14,
    currency: 'جنيه',
    rates: { usd: '52.14', eur: '56.83', sar: '13.90' }
  },
  weather: {
    temp: '25',
    high: '27',
    low: '21',
    city: 'المنزلة والمطرية',
    humidity: '55%',
    wind: 'شمالية معتدلة',
    condition: 'night',
    conditionLabel: 'صافٍ ليلاً'
  }
};

let currentMarketData = getStoredMarketData()?.data || FALLBACK_DATA;

function getGoldCardHTML(gold) {
  return `
    <div class="mw-card-content">
      <div class="mw-card-head-row">
        <span class="mw-icon mw-icon-gold">${ICONS.gold}</span>
        <h4 class="mw-card-title">${gold.title || 'سعر جرام الذهب عيار 21'}</h4>
      </div>
      <p class="mw-card-date">${gold.date || 'اليوم'}</p>
      <div class="mw-price-box">
        <span class="mw-price-num">${gold.price || '6330'}</span>
        <span class="mw-price-curr">${gold.currency || 'جنيه'}</span>
      </div>
      ${gold.rates ? `
        <div class="mw-sub-rates">
          <div class="mw-sub-rate-row">
            <span>عيار 24:</span>
            <span class="mw-sub-rate-val">${gold.rates.k24 || '—'} ج</span>
          </div>
          <div class="mw-sub-rate-row">
            <span>عيار 18:</span>
            <span class="mw-sub-rate-val">${gold.rates.k18 || '—'} ج</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function getCurrencyCardHTML(curr) {
  return `
    <div class="mw-card-content">
      <div class="mw-card-head-row">
        <span class="mw-icon mw-icon-currency">${ICONS.currency}</span>
        <h4 class="mw-card-title">${curr.title || 'سعر صرف الدولار مقابل الجنيه المصري'}</h4>
      </div>
      <p class="mw-card-date">${curr.date || 'اليوم'}</p>
      <div class="mw-price-box">
        <span class="mw-price-num">${curr.price || '52.14'}</span>
        <span class="mw-price-curr">${curr.currency || 'جنيه'}</span>
      </div>
      ${curr.rates ? `
        <div class="mw-sub-rates">
          <div class="mw-sub-rate-row">
            <span>الريال السعودي:</span>
            <span class="mw-sub-rate-val">${curr.rates.sar || '13.90'} ج</span>
          </div>
          <div class="mw-sub-rate-row">
            <span>اليورو:</span>
            <span class="mw-sub-rate-val">${curr.rates.eur || '56.83'} ج</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function getWeatherCardHTML(weather) {
  const norm = normalizeWeatherData(weather);
  const condLabel = norm.conditionLabel;
  return `
    <div class="mw-card-content">
      <div class="mw-card-head-row">
        <span class="mw-icon mw-icon-weather">${getAnimatedWeatherSVG(norm, false)}</span>
        <div class="mw-weather-location">${norm.city || 'المنزلة والمطرية'}</div>
      </div>
      <div class="mw-weather-dtls">
        <div class="mw-weather-main-temp">
          <span class="mw-weather-high">${norm.high || norm.temp || '27'}°</span>
          <span class="mw-weather-low">${norm.low || '21'}°</span>
        </div>
        <div class="mw-weather-sun-icon">
          ${getAnimatedWeatherSVG(norm, true)}
        </div>
      </div>
      <div class="mw-weather-condition-badge" style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:800;color:#38bdf8;margin:6px 0 10px;background:rgba(56,189,248,0.12);padding:4px 12px;border-radius:14px;border:1px solid rgba(56,189,248,0.25)">
        <span>الحالة الجوية:</span>
        <span style="color:#ffffff">${condLabel}</span>
      </div>
      <div class="mw-weather-info-box">
        <div class="mw-weather-info-item">الرطوبة: <span>${norm.humidity || '55%'}</span></div>
        <div class="mw-weather-info-item">الرياح: <span>${norm.wind || 'شمالية معتدلة'}</span></div>
      </div>
    </div>
  `;
}

export function getPrayerCardHTML(prayerData = null) {
  const pData = prayerData || calculatePrayerTimes();
  const next = pData.nextPrayer;
  let dateStr = 'اليوم';
  try {
    dateStr = new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date());
  } catch (_) {}

  return `
    <div class="mw-card-content mw-card-content--prayer">
      <div class="mw-card-head-row">
        <span class="mw-icon mw-icon-prayer">${ICONS.prayer}</span>
        <h4 class="mw-card-title">مواقيت الصلاة في المنصورة والمنزلة</h4>
      </div>
      <p class="mw-card-date">${dateStr}</p>
      
      <div class="mw-prayer-next-banner">
        <div class="mw-prayer-next-label">الصلاة القادمة: <strong class="mw-prayer-next-name">صلاة ${next.name}</strong></div>
        
        <!-- 3 Boxes: ساعات / دقيقة / ثانية -->
        <div class="mw-prayer-countdown-boxes" aria-label="${pData.remText}">
          <div class="mw-pcd-item">
            <span class="mw-pcd-num mw-live-pcd-h">${pData.hStr}</span>
            <span class="mw-pcd-lbl mw-live-pcd-hlbl">${pData.hUnit}</span>
          </div>
          <div class="mw-pcd-item">
            <span class="mw-pcd-num mw-live-pcd-m">${pData.mStr}</span>
            <span class="mw-pcd-lbl">${pData.mUnit}</span>
          </div>
          <div class="mw-pcd-item">
            <span class="mw-pcd-num mw-live-pcd-s">${pData.sStr}</span>
            <span class="mw-pcd-lbl">${pData.sUnit}</span>
          </div>
        </div>

        <div class="mw-prayer-countdown-text mw-live-prayer-countdown">${pData.remText}</div>
        <small class="mw-prayer-countdown-sub">متبقي على رفع الأذان</small>
      </div>

      <div class="mw-prayer-times-grid">
        ${pData.prayers.map(p => `
          <div class="mw-prayer-row ${p.id === next.id ? 'is-next' : ''}">
            <div class="mw-prayer-row-left">
              <span class="mw-prayer-icon">${p.icon}</span>
              <span class="mw-prayer-name">${p.name}</span>
            </div>
            <span class="mw-prayer-time">${p.time12}</span>
          </div>
        `).join('')}
      </div>

      <div class="mw-prayer-footer">
        <a href="./prayer-times.html" class="mw-prayer-link-btn">
          <span>عرض جدول الأسبوع، أذكار بعد الصلاة، والسنن</span>
          <span class="mw-arrow">←</span>
        </a>
      </div>
    </div>
  `;
}

/**
 * Renders the HTML markup for the Market Widgets Bar
 */
export function renderMarketWidgetsHTML(data = currentMarketData) {
  const gold = data?.gold || FALLBACK_DATA.gold;
  const curr = data?.currency || FALLBACK_DATA.currency;
  const weather = normalizeWeatherData(data?.weather || FALLBACK_DATA.weather);
  const prayer = calculatePrayerTimes();

  return `
    <div class="market-widgets-bar" id="market-widgets-bar" role="region" aria-label="مؤشرات الأسعار والطقس ومواقيت الصلاة الحية">
      <!-- 1. Gold Price Widget -->
      <div class="market-widget-item market-widget-item--gold" data-widget="gold" tabindex="0" role="button" aria-expanded="false" aria-label="أسعار الذهب">
        <span class="mw-icon mw-icon-gold">${ICONS.gold}</span>
        <span class="mw-label mw-label-full">أسعار الذهب</span>
        <span class="mw-label mw-label-short"><span class="mw-quick-val">${gold.price || '6330'}</span> ج</span>
        
        <!-- Desktop Dropdown -->
        <div class="market-widget-dropdown" id="mw-dropdown-gold" role="tooltip">
          ${getGoldCardHTML(gold)}
        </div>
      </div>

      <!-- 2. Currency Rates Widget -->
      <div class="market-widget-item market-widget-item--currency" data-widget="currency" tabindex="0" role="button" aria-expanded="false" aria-label="أسعار العملات">
        <span class="mw-icon mw-icon-currency">${ICONS.currency}</span>
        <span class="mw-label mw-label-full">أسعار العملات</span>
        <span class="mw-label mw-label-short"><span class="mw-quick-val">${curr.price || '52.14'}</span> ج</span>
        
        <!-- Desktop Dropdown -->
        <div class="market-widget-dropdown" id="mw-dropdown-currency" role="tooltip">
          ${getCurrencyCardHTML(curr)}
        </div>
      </div>

      <!-- 3. Weather Widget (Smart Animated) -->
      <div class="market-widget-item market-widget-item--weather" data-widget="weather" tabindex="0" role="button" aria-expanded="false" aria-label="الطقس">
        <span class="mw-icon mw-icon-weather">${getAnimatedWeatherSVG(weather, false)}</span>
        <span class="mw-label"><span class="mw-quick-val">${weather.temp || '34'}°</span></span>
        
        <!-- Desktop Dropdown -->
        <div class="market-widget-dropdown" id="mw-dropdown-weather" role="tooltip">
          ${getWeatherCardHTML(weather)}
        </div>
      </div>

      <!-- 4. Prayer Times Widget (يعرض الصلاة القادمة فقط) -->
      <div class="market-widget-item market-widget-item--prayer" data-widget="prayer" tabindex="0" role="button" aria-expanded="false" aria-label="صلاة ${prayer.nextPrayer.name}">
        <span class="mw-icon mw-icon-prayer">${ICONS.prayer}</span>
        <span class="mw-label mw-label-prayer-only"><span class="mw-quick-val">صلاة ${prayer.nextPrayer.name}</span> <span class="mw-prayer-btn-time">${prayer.nextPrayer.time12}</span></span>
        
        <!-- Desktop Dropdown -->
        <div class="market-widget-dropdown market-widget-dropdown--prayer" id="mw-dropdown-prayer" role="tooltip">
          ${getPrayerCardHTML(prayer)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Ensures global mobile modal is in DOM
 */
function ensureMobileModalEl() {
  let modalWrap = document.getElementById('market-widget-mobile-modal');
  if (!modalWrap) {
    modalWrap = document.createElement('div');
    modalWrap.id = 'market-widget-mobile-modal';
    modalWrap.className = 'mw-mobile-modal-wrap';
    modalWrap.innerHTML = `
      <div class="mw-mobile-modal-backdrop" id="mw-mobile-modal-backdrop"></div>
      <div class="mw-mobile-modal-card" role="dialog" aria-modal="true">
        <button type="button" class="mw-mobile-modal-close" id="mw-mobile-modal-close" aria-label="إغلاق">✕</button>
        <div class="mw-mobile-modal-body" id="mw-mobile-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modalWrap);

    const close = () => {
      modalWrap.classList.remove('is-open');
      document.body.classList.remove('mw-modal-open');
    };

    modalWrap.querySelector('#mw-mobile-modal-backdrop').onclick = close;
    modalWrap.querySelector('#mw-mobile-modal-close').onclick = close;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalWrap.classList.contains('is-open')) close();
    });
  }
  return modalWrap;
}

let _prayerTicker = null;
function ensurePrayerTicker() {
  if (_prayerTicker) return;
  _prayerTicker = setInterval(() => {
    const hasBoxes = document.querySelectorAll('.mw-live-pcd-s').length > 0;
    const hasText = document.querySelectorAll('.mw-live-prayer-countdown').length > 0;
    const pData = calculatePrayerTimes();

    if (hasBoxes) {
      document.querySelectorAll('.mw-live-pcd-h').forEach(el => { el.textContent = pData.hStr; });
      document.querySelectorAll('.mw-live-pcd-hlbl').forEach(el => { el.textContent = pData.hUnit; });
      document.querySelectorAll('.mw-live-pcd-m').forEach(el => { el.textContent = pData.mStr; });
      document.querySelectorAll('.mw-live-pcd-s').forEach(el => { el.textContent = pData.sStr; });
    }

    if (hasText) {
      document.querySelectorAll('.mw-live-prayer-countdown').forEach(el => {
        el.textContent = pData.remText;
      });
    }

    // Keep top bar button updated with current next prayer
    document.querySelectorAll('.market-widget-item--prayer .mw-label-prayer-only').forEach(el => {
      const qVal = el.querySelector('.mw-quick-val');
      const tVal = el.querySelector('.mw-prayer-btn-time');
      if (qVal && qVal.textContent !== `صلاة ${pData.nextPrayer.name}`) {
        qVal.textContent = `صلاة ${pData.nextPrayer.name}`;
      }
      if (tVal && tVal.textContent !== pData.nextPrayer.time12) {
        tVal.textContent = pData.nextPrayer.time12;
      }
    });
  }, 1000);
}

function openMobileModal(type) {
  const modalWrap = ensureMobileModalEl();
  const body = modalWrap.querySelector('#mw-mobile-modal-body');
  if (!body) return;

  const data = currentMarketData;
  if (type === 'gold') {
    body.innerHTML = getGoldCardHTML(data.gold || FALLBACK_DATA.gold);
  } else if (type === 'currency') {
    body.innerHTML = getCurrencyCardHTML(data.currency || FALLBACK_DATA.currency);
  } else if (type === 'weather') {
    body.innerHTML = getWeatherCardHTML(data.weather || FALLBACK_DATA.weather);
  } else if (type === 'prayer') {
    body.innerHTML = getPrayerCardHTML(calculatePrayerTimes());
    ensurePrayerTicker();
  }

  modalWrap.classList.add('is-open');
  document.body.classList.add('mw-modal-open');
}

/**
 * Updates an already rendered bar with fresh data
 */
export function updateMarketWidgetsDOM(container, data) {
  if (!container) return;
  const newHtml = renderMarketWidgetsHTML(data);
  const temp = document.createElement('div');
  temp.innerHTML = newHtml;
  const newBar = temp.firstElementChild;
  if (newBar) {
    container.replaceWith(newBar);
    bindMarketWidgetsEvents(newBar);
  }
}

/**
 * Binds interactivity:
 * - Desktop: Hover flyout dropdowns
 * - Mobile (< 768px): Centered clean dialog modal attached to document.body
 */
export function bindMarketWidgetsEvents(barEl) {
  if (!barEl) return;

  barEl.querySelectorAll('.market-widget-item').forEach(item => {
    const type = item.getAttribute('data-widget');

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      // On mobile screens (< 768px), open full clean centered modal
      if (window.innerWidth < 768) {
        openMobileModal(type);
        return;
      }

      // On desktop, toggle dropdown
      const dropdown = item.querySelector('.market-widget-dropdown');
      if (!dropdown) return;
      const wasOpen = dropdown.classList.contains('is-open');
      barEl.querySelectorAll('.market-widget-dropdown').forEach(d => d.classList.remove('is-open'));
      barEl.querySelectorAll('.market-widget-item').forEach(i => {
        i.classList.remove('active');
        i.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        dropdown.classList.add('is-open');
        item.classList.add('active');
        item.setAttribute('aria-expanded', 'true');
        if (type === 'prayer') ensurePrayerTicker();
      }
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  // Global click outside (desktop)
  document.addEventListener('click', (e) => {
    if (!barEl.contains(e.target)) {
      barEl.querySelectorAll('.market-widget-dropdown').forEach(d => d.classList.remove('is-open'));
      barEl.querySelectorAll('.market-widget-item').forEach(i => {
        i.classList.remove('active');
        i.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      barEl.querySelectorAll('.market-widget-dropdown').forEach(d => d.classList.remove('is-open'));
      barEl.querySelectorAll('.market-widget-item').forEach(i => {
        i.classList.remove('active');
        i.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/**
 * Fetches fresh live indicators from the backend Worker API
 */
export async function fetchLiveMarketIndicators() {
  const cached = getStoredMarketData();
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_MAX_AGE_MS)) {
    return cached.data;
  }

  try {
    const res = await fetch('/api/market-widgets', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        saveStoredMarketData(json.data);
        currentMarketData = json.data;
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Live Market Indicators] Fetch failed, using cached:', err?.message || err);
  }

  return currentMarketData;
}

/**
 * Universal Mount Function:
 * Mounts in `.page-back-bar` (the exact empty space next to "رجوع" on Mobile & Desktop)
 */
let _observerActive = false;

function tryMount() {
  // 1. Check if page has `.page-back-bar` (place.html, categories.html, search.html, favorites.html)
  const backBar = document.querySelector('.page-back-bar');
  if (backBar) {
    // If a global wrap exists elsewhere on page, remove it
    const oldWrap = document.getElementById('global-market-widgets-wrap');
    if (oldWrap) oldWrap.remove();

    if (!backBar.querySelector('.market-widgets-bar')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = renderMarketWidgetsHTML(currentMarketData);
      const bar = wrap.firstElementChild;
      backBar.appendChild(bar);
      bindMarketWidgetsEvents(bar);
    }
    return true;
  }

  // 2. Check if page has dedicated slot `#home-market-widgets-slot` or `#market-widgets-slot`
  const customSlot = document.getElementById('home-market-widgets-slot') || document.getElementById('market-widgets-slot');
  if (customSlot) {
    if (!customSlot.querySelector('.market-widgets-bar')) {
      customSlot.innerHTML = renderMarketWidgetsHTML(currentMarketData);
      const bar = customSlot.querySelector('.market-widgets-bar');
      if (bar) bindMarketWidgetsEvents(bar);
    }
    return true;
  }

  // 3. Mount for Home Page (index.html) ONLY — never on detail pages
  const isHomePage = (
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname.endsWith('/en/') ||
    window.location.pathname.endsWith('/en/index.html') ||
    !!document.getElementById('hero-section-static') ||
    !!document.getElementById('home-verified-cards-grid')
  );

  const header = document.getElementById('site-header');
  if (isHomePage && header && !document.getElementById('global-market-widgets-wrap')) {
    const wrap = document.createElement('div');
    wrap.id = 'global-market-widgets-wrap';
    wrap.className = 'home-market-widgets-wrap';
    wrap.innerHTML = renderMarketWidgetsHTML(currentMarketData);
    
    const main = document.querySelector('main') || document.body;
    if (header.nextSibling) {
      header.parentNode.insertBefore(wrap, header.nextSibling);
    } else {
      main.insertBefore(wrap, main.firstChild);
    }
    const bar = wrap.querySelector('.market-widgets-bar');
    if (bar) bindMarketWidgetsEvents(bar);
    return true;
  }

  return false;
}

export function mountMarketWidgets() {
  if (typeof document === 'undefined') return;

  // Load CSS dynamically if not already in document
  if (!document.getElementById('market-widgets-css')) {
    const link = document.createElement('link');
    link.id = 'market-widgets-css';
    link.rel = 'stylesheet';
    link.href = '/src/css/components/market-widgets.css';
    document.head.appendChild(link);
  }

  tryMount();

  // Mutation observer to catch dynamically rendered page-back-bars
  if (!_observerActive && typeof MutationObserver !== 'undefined') {
    _observerActive = true;
    const observer = new MutationObserver(() => {
      const backBar = document.querySelector('.page-back-bar');
      if (backBar && !backBar.querySelector('.market-widgets-bar')) {
        const oldWrap = document.getElementById('global-market-widgets-wrap');
        if (oldWrap) oldWrap.remove();

        const wrap = document.createElement('div');
        wrap.innerHTML = renderMarketWidgetsHTML(currentMarketData);
        const bar = wrap.firstElementChild;
        backBar.appendChild(bar);
        bindMarketWidgetsEvents(bar);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Fetch latest data in background & update all mounted bars
  fetchLiveMarketIndicators().then(freshData => {
    if (!freshData) return;
    document.querySelectorAll('.market-widgets-bar').forEach(bar => {
      updateMarketWidgetsDOM(bar, freshData);
    });
  }).catch(() => {});
}
