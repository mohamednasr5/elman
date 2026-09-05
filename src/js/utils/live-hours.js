/**
 * live-hours.js
 * Intelligent Working Hours & Realtime Opening Status Engine with Countdown
 */

export function getPlaceLiveStatus(openHours = null) {
  if (!openHours) {
    return {
      isOpen: true,
      badgeText: 'مفتوح للزوار',
      badgeClass: 'status-open-neutral',
      color: '#10B981',
      details: 'متاح للزيارة والتواصل'
    };
  }

  if (openHours.is24 || openHours.is24Hours || openHours === '24') {
    return {
      isOpen: true,
      badgeText: 'متاح 24 ساعة',
      badgeClass: 'status-open-24',
      color: '#059669',
      details: 'خدمة مستمرة على مدار اليوم'
    };
  }

  const now = new Date();
  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayKey = daysMap[now.getDay()];
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;

  const todaySchedule = openHours[currentDayKey] || openHours.daily || openHours;

  if (!todaySchedule || todaySchedule.closed) {
    return {
      isOpen: false,
      badgeText: 'مغلق اليوم',
      badgeClass: 'status-closed',
      color: '#EF4444',
      details: 'عطلة رسمية'
    };
  }

  const openTimeStr = todaySchedule.open || openHours.open || '09:00';
  const closeTimeStr = todaySchedule.close || openHours.close || '23:00';

  const [openH, openM] = openTimeStr.split(':').map(Number);
  const [closeH, closeM] = closeTimeStr.split(':').map(Number);

  const openVal = (openH || 9) * 60 + (openM || 0);
  let closeVal = (closeH || 23) * 60 + (closeM || 0);

  if (closeVal < openVal) {
    closeVal += 24 * 60;
  }

  let effectiveCurrent = currentTimeVal;
  if (currentTimeVal < openVal && closeVal > 24 * 60) {
    effectiveCurrent += 24 * 60;
  }

  if (effectiveCurrent >= openVal && effectiveCurrent <= closeVal) {
    const remainingMins = closeVal - effectiveCurrent;
    const remainingHours = Math.floor(remainingMins / 60);

    let countdownStr = '';
    if (remainingMins <= 60) {
      countdownStr = `متبقي ${remainingMins} دقيقة`;
    } else {
      countdownStr = `يغلق بعد ${remainingHours} س`;
    }

    return {
      isOpen: true,
      badgeText: `مفتوح الآن • ${countdownStr}`,
      badgeClass: 'status-open-pulse',
      color: '#10B981',
      details: `مواعيد اليوم: من ${openTimeStr} إلى ${closeTimeStr}`
    };
  } else {
    return {
      isOpen: false,
      badgeText: `مغلق الآن • يفتح ${openTimeStr}`,
      badgeClass: 'status-closed',
      color: '#EF4444',
      details: `مواعيد العمل: من ${openTimeStr} إلى ${closeTimeStr}`
    };
  }
}
