/**
 * المنزلة وناسها — ATM & Cash Availability System
 * Real-time crowdsourced ATM status polls (Cash availability, Deposit, Contactless/NFC, Operational status),
 * unified branding, and simplified form support.
 */

import { dbGet, dbUpdate } from '../core/db.js';

export const ATM_UNIFIED_COVER = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80';
export const ATM_UNIFIED_LOGO = 'https://ui-avatars.com/api/?name=%D8%B5%D8%B1%D8%A7%D9%81+%D8%A2%D9%84%D9%8A&background=1B4F72&color=F5A623&size=200&bold=true&font-size=0.35&format=png';

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
    badgeYes: '🟢 متوفر بها كاش وأموال',
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
    badgeYes: '🟢 الماكينة تعمل وتستجيب',
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
export function isAtmPlace(place, category = null) {
  if (!place) return false;
  const cId = (place.categoryId || '').toLowerCase();
  const cName = (category?.name || '').toLowerCase();
  const pName = (place.name || '').toLowerCase();
  const customCat = (place.customCategory || '').toLowerCase();

  return (
    cId === 'atm' ||
    cId === 'atm-machines' ||
    cId === 'صراف-الي' ||
    cId === 'صراف_الي' ||
    cId.includes('صراف') ||
    cId.includes('atm') ||
    cName.includes('صراف') ||
    cName.includes('atm') ||
    pName.includes('صراف آلي') ||
    pName.includes('ماكينة صراف') ||
    pName.includes('صراف الي') ||
    pName.includes('atm') ||
    customCat.includes('صراف') ||
    customCat.includes('atm')
  );
}

/**
 * Formats relative time in Egyptian Arabic for ATM polls
 */
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
