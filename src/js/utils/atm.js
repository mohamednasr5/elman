import { normalizeArabic } from './arabic.js';
/**
 * المنزلة وناسها — ATM & Cash Availability System
 * Real-time crowdsourced ATM status polls (Cash availability, Deposit, Contactless/NFC, Operational status),
 * unified branding, and simplified form support.
 */

import { dbGet, dbUpdate } from '../core/db.js';

export const ATM_UNIFIED_COVER = 'assets/images/atm-cover.jpg';
export const ATM_UNIFIED_LOGO = 'assets/images/atm-logo.png';

export const ATM_POLL_QUESTIONS = [
  {
    key: 'cash',
    icon: '💵',
    title: 'هل يوجد أموال (كاش) بالماكينة الآن؟',
    desc: 'لمعرفة توفر النقدية الجاهزة للسحب الفوري',
    yesLabel: 'نعم .. يوجد أموال',
    yesShort: 'يوجد أموال',
    noLabel: 'لا .. فارغة من الأموال',
    noShort: 'فارغة',
    badgeYes: '<span class="atm-badge-cash-available">💵 متوفر بها كاش وأموال ⚡</span>',
    badgeNo: '🔴 فارغة من الأموال حالياً',
    badgeNone: '⚪ لم تسجل إجابات حديثة'
  },
  {
    key: 'working',
    icon: '⚙️',
    title: 'هل الماكينة تعمل وتستجيب الآن؟',
    desc: 'لمعرفة هل النظام يعمل أم الماكينة معطلة / شاشة متوقفة',
    yesLabel: 'نعم تعمل حالياً',
    yesShort: 'تعمل حالياً',
    noLabel: 'لا .. الماكينة خارج نطاق الخدمة',
    noShort: 'خارج الخدمة',
    badgeYes: '<span class="atm-badge-machine-working">⚙️ الماكينة تعمل وتستجيب ⚡</span>',
    badgeNo: '🔴 الماكينة خارج نطاق الخدمة',
    badgeNone: '⚪ لم تسجل إجابات'
  },
  {
    key: 'deposit',
    icon: '📥',
    title: 'هل يمكن الإيداع بها؟',
    desc: 'لمعرفة هل درج الإيداع النقدي متاح ويعمل',
    yesLabel: 'نعم .. تقبل الإيداع النقدي',
    yesShort: 'تقبل الإيداع',
    noLabel: 'لا .. سحب فقط (لا تقبل الإيداع)',
    noShort: 'سحب فقط',
    badgeYes: '🟢 تدعم الإيداع النقدي',
    badgeNo: '⚪ سحب نقدي فقط',
    badgeNone: '⚪ غير محدد'
  },
  {
    key: 'contactless',
    icon: '📲',
    title: 'هل تقبل التلامس بالفيزا (Contactless / NFC)؟',
    desc: 'إمكانية السحب بتمرير البطاقة أو الهاتف بدون إدخال الفيزا',
    yesLabel: 'نعم .. يمكن استخدامها بدون إدخال الفيزا',
    yesShort: 'تلامسي بدون إدخال',
    noLabel: 'لا .. لابد من إدخال الفيزا بالماكينة',
    noShort: 'تتطلب إدخال الفيزا',
    badgeYes: '🟢 تدعم التلامس الذكي (NFC)',
    badgeNo: '⚪ تتطلب إدخال الفيزا',
    badgeNone: '⚪ غير محدد'
  }
];

/**
 * Checks whether a place or category is an ATM / Cash machine
 */
/**
 * Checks whether a place or category is an ATM / Cash machine
 */
/**
 * Checks whether a place or category is an ATM / Cash machine
 */
export function isAtmPlace(place, category = null) {
  if (!place) return false;
  const cId = (place.categoryId || '').toLowerCase();
  const cName = normalizeArabic(category?.name || '').toLowerCase();
  const pName = normalizeArabic(place.name || '').toLowerCase();
  const customCat = normalizeArabic(place.customCategory || '').toLowerCase();
  const catName = normalizeArabic(place.categoryName || '').toLowerCase();

  return (
    cId === 'atm' ||
    cId === 'atm-machines' ||
    cId.includes('atm') ||
    cId.includes('صراف') ||
    cId.includes('صرف') ||
    cName.includes('صراف') ||
    cName.includes('صرف') ||
    cName.includes('atm') ||
    pName.includes('صراف') ||
    pName.includes('صرف') ||
    pName.includes('atm') ||
    customCat.includes('صراف') ||
    customCat.includes('صرف') ||
    customCat.includes('atm') ||
    catName.includes('صراف') ||
    catName.includes('صرف') ||
    catName.includes('atm')
  );
}

export function formatAtmTimeAgo(timestamp) {
  if (!timestamp) return 'منذ قليل';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن (منذ ثوانٍ معدودة)';
  if (mins === 1) return 'منذ دقيقة واحدة';
  if (mins === 2) return 'منذ دقيقتين';
  if (mins <= 10) return `منذ ${mins} دقائق`;
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return 'منذ ساعة';
  if (hours === 2) return 'منذ ساعتين';
  if (hours <= 10) return `منذ ${hours} ساعات`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days === 2) return 'منذ يومين';
  return `منذ ${days} أيام`;
}

/**
 * Submits a vote on a specific ATM survey question
 * @param {string} placeId
 * @param {string} questionKey ('cash' | 'deposit' | 'contactless' | 'working')
 * @param {'yes' | 'no'} voteType
 */
export async function submitAtmPollVote(placeId, questionKey, voteType) {
  if (!placeId || !questionKey) return;
  const now = Date.now();
  const isYes = voteType === 'yes';

  const pollPath = `places/${placeId}/atmPoll`;
  const snap = await dbGet(pollPath, false) || {};

  // Resolve question node with backward compatibility for cash
  let qData = snap[questionKey] || {};
  if (questionKey === 'cash' && snap.yesCount !== undefined && !snap.cash) {
    qData = {
      yesCount: Number(snap.yesCount) || 0,
      noCount: Number(snap.noCount) || 0,
      totalVotes: Number(snap.totalVotes) || 0,
      lastAnswerTime: snap.lastAnswerTime || snap.updatedAt,
      lastAnswerChoice: snap.lastAnswerChoice
    };
  }

  const currentYes = Number(qData.yesCount) || 0;
  const currentNo = Number(qData.noCount) || 0;
  const total = (Number(qData.totalVotes) || (currentYes + currentNo)) + 1;

  const updatedQ = {
    yesCount: isYes ? currentYes + 1 : currentYes,
    noCount: !isYes ? currentNo + 1 : currentNo,
    totalVotes: total,
    lastAnswerTime: now,
    lastAnswerChoice: voteType,
    updatedAt: now
  };

  const updates = {};
  updates[`${pollPath}/${questionKey}`] = updatedQ;
  updates[`${pollPath}/updatedAt`] = now;
  if (questionKey === 'cash') {
    updates[`${pollPath}/yesCount`] = updatedQ.yesCount;
    updates[`${pollPath}/noCount`] = updatedQ.noCount;
    updates[`${pollPath}/totalVotes`] = updatedQ.totalVotes;
    updates[`${pollPath}/lastAnswerTime`] = now;
    updates[`${pollPath}/lastAnswerChoice`] = voteType;
  }

  await dbUpdate('', updates);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`atm_vote_${placeId}_${questionKey}`, JSON.stringify({
      choice: voteType,
      time: now
    }));
  }

  const result = { ...snap, [questionKey]: updatedQ, updatedAt: now };
  if (questionKey === 'cash') {
    Object.assign(result, updatedQ);
  }
  return result;
}

// Backward compatibility alias
export const submitAtmCashVote = (placeId, voteType) => submitAtmPollVote(placeId, 'cash', voteType);


/**
 * Resolves ATM live status based on reports in the last 15 minutes window
 */
export function getAtmLiveStatus(place, windowMinutes = 15) {
  if (!place || !isAtmPlace(place)) return null;
  const poll = place.atmPoll || {};
  const windowMs = windowMinutes * 60 * 1000;
  const now = Date.now();

  // 1. Cash Status
  let cashData = poll.cash || {};
  if (poll.yesCount !== undefined && !poll.cash) {
    cashData = {
      yesCount: poll.yesCount,
      noCount: poll.noCount,
      totalVotes: poll.totalVotes,
      lastAnswerTime: poll.lastAnswerTime || poll.updatedAt,
      lastAnswerChoice: poll.lastAnswerChoice
    };
  }
  const cashTime = cashData.lastAnswerTime ? Number(cashData.lastAnswerTime) : 0;
  const isCashRecent = (now - cashTime) <= windowMs && cashTime > 0;
  const cashYes = Number(cashData.yesCount) || 0;
  const cashNo = Number(cashData.noCount) || 0;
  const hasCash = isCashRecent && (cashYes >= cashNo || cashData.lastAnswerChoice === 'yes');
  const noCash = isCashRecent && (cashNo > cashYes || cashData.lastAnswerChoice === 'no');

  // 2. Operational / Working Status
  const workData = poll.working || {};
  const workTime = workData.lastAnswerTime ? Number(workData.lastAnswerTime) : 0;
  const isWorkRecent = (now - workTime) <= windowMs && workTime > 0;
  const workYes = Number(workData.yesCount) || 0;
  const workNo = Number(workData.noCount) || 0;
  const isWorking = isWorkRecent && (workYes >= workNo || workData.lastAnswerChoice === 'yes');
  const isOutOfService = isWorkRecent && (workNo > workYes || workData.lastAnswerChoice === 'no');

  // Fallbacks if votes exist (even beyond 15m)
  const allTimeHasCash = cashTime > 0 && (cashYes >= cashNo);
  const allTimeNoCash = cashTime > 0 && (cashNo > cashYes);
  const allTimeWorking = workTime > 0 && (workYes >= workNo);
  const allTimeOutOfService = workTime > 0 && (workNo > workYes);

  return {
    isCashRecent,
    hasCash,
    noCash,
    isWorkRecent,
    isWorking,
    isOutOfService,
    allTimeHasCash,
    allTimeNoCash,
    allTimeWorking,
    allTimeOutOfService,
    cashTime,
    workTime,
    lastReportTime: Math.max(cashTime, workTime)
  };
}

/**
 * Filter ATM places based on active filter key:
 * 'has-cash' | 'working' | 'out-of-service' | 'no-cash' | 'all'
 */
export function filterAtmPlaces(places, filterKey, windowMinutes = 15) {
  if (!filterKey || filterKey === 'all') return places;

  return places.filter(p => {
    const status = getAtmLiveStatus(p, windowMinutes);
    if (!status) return false;

    if (filterKey === 'has-cash') {
      return status.hasCash || (!status.isCashRecent && status.allTimeHasCash);
    }
    if (filterKey === 'working') {
      return status.isWorking || (!status.isWorkRecent && status.allTimeWorking);
    }
    if (filterKey === 'out-of-service') {
      return status.isOutOfService || (!status.isWorkRecent && status.allTimeOutOfService);
    }
    if (filterKey === 'no-cash') {
      return status.noCash || (!status.isCashRecent && status.allTimeNoCash);
    }
    return true;
  });
}

/**
 * Checks if an ATM is active, working, and has cash available.
 * Returns FALSE if the ATM was reported out-of-service or reported without cash (empty).
 */
export function isAtmReadyAndOperational(place, windowMinutes = 15) {
  if (!place || !isAtmPlace(place)) return true;
  const status = getAtmLiveStatus(place, windowMinutes);
  if (!status) return true;

  // 1. Exclude if reported out of service (لا تعمل / خارج نطاق الخدمة)
  if (status.isOutOfService || (!status.isWorkRecent && status.allTimeOutOfService)) {
    return false;
  }

  // 2. Exclude if reported empty / without cash (فارغة / ليس بها أموال)
  if (status.noCash || (!status.isCashRecent && status.allTimeNoCash)) {
    return false;
  }

  return true;
}
