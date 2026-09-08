import { normalizeArabic } from './arabic.js';
/**
 * المنزلة وناسها — ATM & Cash Availability System
 * Real-time crowdsourced ATM status polls (Cash availability, Deposit, Contactless/NFC, Operational status),
 * unified branding, and simplified form support.
 */

import { tursoFetch } from '../core/db.js';

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

  const cId = (place.categoryId || place.category_id || '').toLowerCase().trim();
  const subId = (place.subcategoryId || place.subcategory_id || '').toLowerCase().trim();
  const cName = normalizeArabic(category?.name || '').toLowerCase();
  const pName = normalizeArabic(place.name || '').toLowerCase();
  const customCat = normalizeArabic(place.customCategory || place.custom_category || '').toLowerCase();
  const catName = normalizeArabic(place.categoryName || place.category_name || '').toLowerCase();

  // 1. HARD EXCLUSION: If place is in ANY craft or non-banking profession, it is NEVER an ATM!
  const CRAFT_CATEGORY_IDS = [
    'plumbing-drainage', 'decor-finishing', 'electrical', 'hvac-refrigeration',
    'carpentry-furniture', 'building-construction', 'automotive-vehicles',
    'blacksmith-alumital', 'cleaning-home-services', 'agriculture-gardening',
    'home-appliances-maintenance', 'tailoring-clothing', 'barber-beauty',
    'transportation-logistics', 'misc-services', 'home-food-kitchen', 'holy-quran-reciter'
  ];

  if (CRAFT_CATEGORY_IDS.includes(cId) || subId || place.isCraft) {
    return false;
  }

  // If text refers to plumbing, sanitary, drainage, or any crafts/professions
  const fullText = `${pName} ${customCat} ${catName} ${cName}`;
  if (/(سباك|سباكة|سباكه|صرف.*صح|مواسير|صحي|تسليك|نقاش|نجار|حداد|كهربا|تكييف|ميكانيك|خياط|حلاق|كوافير|طباخ|جزار|سمك|صيدل|دكتور|طبيب|معمل|عياد|مهن|حرف)/.test(fullText)) {
    return false;
  }

  // 2. Strict ATM identification (Only real Automated Teller Machines and Bank Cash Points)
  const isAtmCatId = cId === 'atm' || cId === 'atm-machines' || cId === 'ماكينة صراف آلي' || cId === 'صراف آلي';
  const hasAtmKeywordInCat = /(ماكينة.*صراف|صراف.*آل|صراف.*ال|صرافة|\batm\b)/.test(catName) ||
                             /(ماكينة.*صراف|صراف.*آل|صراف.*ال|صرافة|\batm\b)/.test(cName) ||
                             /(ماكينة.*صراف|صراف.*آل|صراف.*ال|صرافة|\batm\b)/.test(customCat);

  const hasAtmInName = /(ماكينة.*صراف|صراف.*آل|صراف.*ال|ماكينة.*atm|\batm\b)/.test(pName);

  return Boolean(isAtmCatId || hasAtmKeywordInCat || hasAtmInName);
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
  if(!placeId||!questionKey) return;
  const data=await tursoFetch('/api/places/'+encodeURIComponent(placeId)+'/atm-poll',{method:'POST',body:JSON.stringify({questionKey,voteType})});
  if(!data?.success) throw new Error(data?.error||'تعذر حفظ تقييم ماكينة الصراف');
  if(typeof localStorage!=='undefined') localStorage.setItem('atm_vote_'+placeId+'_'+questionKey,JSON.stringify({choice:voteType,time:Date.now()}));
  return data.data || {};
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
