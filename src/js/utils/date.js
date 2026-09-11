/**
 * المنزلة وناسها — Date Utilities
 */

import { getArabicDay, getArabicMonth } from './arabic.js';

/**
 * Format timestamp to Arabic date string
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = getArabicMonth(d.getMonth());
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format timestamp to relative Arabic time (e.g. "منذ ٣ ساعات")
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  if (seconds < 60)   return 'الآن';
  if (minutes < 60)   return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  if (hours < 24)     return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  if (days < 30)      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
  if (months < 12)    return `منذ ${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
  return `منذ ${years} ${years === 1 ? 'سنة' : 'سنوات'}`;
}

/**
 * Format time from HH:MM string to Arabic 12h format
 */
export function formatTime(time24) {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr);
  const min = minStr || '00';
  const period = hour < 12 ? 'ص' : 'م';
  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;
  return `${hour}:${min} ${period}`;
}

/**
 * Get today's day key for working hours
 */
export function getTodayKey() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

/**
 * Check if a place is currently open
 */
export function isPlaceOpen(workingHours) {
  if (!workingHours) return null;

  const todayKey = getTodayKey();
  const todayHours = workingHours[todayKey];

  if (!todayHours) return null;
  if (todayHours.closed) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}

/**
 * Format working hours for display
 */
export function formatWorkingHours(workingHours) {
  const dayNames = {
    saturday:  'السبت',
    sunday:    'الأحد',
    monday:    'الاثنين',
    tuesday:   'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday:  'الخميس',
    friday:    'الجمعة'
  };

  const order = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  return order.map(day => ({
    key: day,
    name: dayNames[day],
    ...( workingHours?.[day] || { open: '', close: '', closed: true }),
    isToday: day === getTodayKey()
  }));
}

/**
 * Format date range for offers
 */
export function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (!start && !end) return '';
  if (!end) return `من ${start}`;
  if (!start) return `حتى ${end}`;
  return `${start} — ${end}`;
}

/**
 * Check if an offer has expired
 */
export function isExpired(endDate) {
  return endDate < Date.now();
}

/**
 * Get remaining days until expiry
 */
export function daysUntil(timestamp) {
  const diff = timestamp - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Format publication timestamp to accurate, friendly Arabic relative + clock time
 * (e.g. "اليوم 8:31 ص (منذ 13 ساعة)", "منذ 5 دقائق (9:59 م)", "أمس الساعة 9:04 م")
 */
export function formatPublishTime(timestamp) {
  if (!timestamp) return 'حديثاً';
  const ts = Number(timestamp);
  if (isNaN(ts) || ts <= 0) return 'حديثاً';

  const timeMs = ts < 10000000000 ? ts * 1000 : ts;
  const now = Date.now();
  const diffMs = Math.max(0, now - timeMs);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const date = new Date(timeMs);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  const hour12 = hours % 12 || 12;
  const timeStr = `${hour12}:${minutes} ${period}`;

  if (diffSec < 60) {
    return 'الآن (منذ لحظات)';
  }
  if (diffMin < 60) {
    if (diffMin === 1) return 'منذ دقيقة واحدة';
    if (diffMin === 2) return 'منذ دقيقتين';
    if (diffMin >= 3 && diffMin <= 10) return `منذ ${diffMin} دقائق (${timeStr})`;
    return `منذ ${diffMin} دقيقة (${timeStr})`;
  }

  const nowDate = new Date(now);
  const isToday = date.getDate() === nowDate.getDate() &&
                  date.getMonth() === nowDate.getMonth() &&
                  date.getFullYear() === nowDate.getFullYear();

  if (isToday) {
    if (diffHours === 1) return `اليوم ${timeStr} (منذ ساعة)`;
    if (diffHours === 2) return `اليوم ${timeStr} (منذ ساعتين)`;
    if (diffHours >= 3 && diffHours <= 10) return `اليوم ${timeStr} (منذ ${diffHours} ساعات)`;
    return `اليوم ${timeStr} (منذ ${diffHours} ساعة)`;
  }

  const yesterday = new Date(now - 86400000);
  const isYesterday = date.getDate() === yesterday.getDate() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `أمس الساعة ${timeStr}`;
  }

  if (diffDays === 2) {
    return `منذ يومين (${timeStr})`;
  }

  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${date.getDate()} ${months[date.getMonth()]} (${timeStr})`;
}

/**
 * Format full Gregorian Arabic date and time string
 * (e.g. "الجمعة 11 سبتمبر 2026 - الساعة 8:31 صباحاً")
 */
export function formatFullDateTime(timestamp) {
  if (!timestamp) return '';
  const ts = Number(timestamp);
  if (isNaN(ts) || ts <= 0) return '';
  const timeMs = ts < 10000000000 ? ts * 1000 : ts;
  const d = new Date(timeMs);
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  const hour12 = hours % 12 || 12;
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} - الساعة ${hour12}:${minutes} ${period}`;
}
