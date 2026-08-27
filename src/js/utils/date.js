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
