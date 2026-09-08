/**
 * loyalty.service.js
 * Comprehensive Gamification & Loyalty Rewards Engine
 * Supports points accrual, levels, daily bonus, and 5000 points Place Verification Redemption.
 */

import { WORKER_URL } from '../core/firebase.js';
import { playNotificationSound } from './notification.service.js';

export const VERIFICATION_POINTS_COST = 5000;

export const LOYALTY_LEVELS = [
  { id: 'bronze', name: 'مستكشف مبتدئ', min: 0, max: 499, icon: '🥉', color: '#CD7F32' },
  { id: 'silver', name: 'مساهم نشط', min: 500, max: 1499, icon: '🥈', color: '#94A3B8' },
  { id: 'gold', name: 'خبير المنزلة والمطرية', min: 1500, max: 3499, icon: '🥇', color: '#F59E0B' },
  { id: 'diamond', name: 'مساهم موثوق ذهبي', min: 3500, max: 4999, icon: '💎', color: '#0EA5E9' },
  { id: 'vip', name: 'نخبة المنزلة والمطرية VIP', min: 5000, max: Infinity, icon: '👑', color: '#10B981' }
];

export const POINTS_RULES = {
  ADD_PLACE: { points: 50, label: 'إضافة مكان أو نشاط جديد بالدليل' },
  ADD_REVIEW: { points: 25, label: 'كتابة تقييم ومراجعة لمكان' },
  UPDATE_ATM: { points: 20, label: 'تحديث حالة ماكينة صراف آلي ATM' },
  DAILY_LOGIN: { points: 10, label: 'تسجيل الدخول اليومي' },
  SHARE_PLACE: { points: 10, label: 'مشاركة رابط مكان' },
  RATE_PLACE: { points: 5, label: 'تقييم سريع بالنجوم' }
};

/**
 * Get user's current loyalty level & progress
 */
export function getLoyaltyLevelInfo(points = 0) {
  const pts = Math.max(0, parseInt(points, 10) || 0);
  const current = LOYALTY_LEVELS.find(l => pts >= l.min && pts <= l.max) || LOYALTY_LEVELS[0];
  const nextLevel = LOYALTY_LEVELS[LOYALTY_LEVELS.indexOf(current) + 1] || null;

  let progressPct = 100;
  let pointsToNext = 0;

  if (nextLevel) {
    const range = nextLevel.min - current.min;
    const progress = pts - current.min;
    progressPct = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
    pointsToNext = nextLevel.min - pts;
  }

  const canRedeemVerification = pts >= VERIFICATION_POINTS_COST;

  return {
    points: pts,
    currentLevel: current,
    nextLevel,
    progressPct,
    pointsToNext,
    canRedeemVerification,
    verificationCost: VERIFICATION_POINTS_COST,
    pointsToVerification: Math.max(0, VERIFICATION_POINTS_COST - pts)
  };
}

/**
 * Fetch fresh user loyalty data from Firebase
 */
/**
 * Fetch fresh user loyalty data from Firebase (with multi-path fallback)
 */
export async function getUserLoyaltyProfile(uid) {
  if (!uid) return { points:0,totalEarned:0,history:[],lastDailyBonusDate:null };
  try {
    const { getIdToken } = await import('../core/auth.js'); const token=await getIdToken();
    const res=await fetch(WORKER_URL + '/api/loyalty/'+encodeURIComponent(uid),{headers:token?{Authorization:'Bearer '+token}:{}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data.success) throw new Error(data.error||'تعذر تحميل رصيد النقاط');
    return data.data;
  } catch(err) { console.debug('[LoyaltyService] Turso read failed:',err); return {points:0,totalEarned:0,history:[],lastDailyBonusDate:null}; }
}

export async function awardPoints(uid,ruleKey,customMeta={}) {
  if(!uid) return null;
  const amount=Math.max(1,Math.min(1000,Number(customMeta.pointsOverride||POINTS_RULES[ruleKey]?.points||10)));
  try {
    const {getIdToken}=await import('../core/auth.js'); const token=await getIdToken();
    const res=await fetch('/api/loyalty/'+encodeURIComponent(uid),{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action:'award',ruleKey,amount,label:customMeta.label||POINTS_RULES[ruleKey]?.label||'مكافأة تفاعل',meta:customMeta})});
    const data=await res.json().catch(()=>({})); if(!res.ok||!data.success) throw new Error(data.error||'تعذر إضافة النقاط');
    playNotificationSound(); return {success:true,newPoints:Number(data.newPoints||0),awarded:amount};
  } catch(err) { return {success:false,error:err}; }
}

export async function claimDailyBonus(uid) {
  if(!uid) return {success:false,reason:'no_uid'};
  const {getIdToken}=await import('../core/auth.js'); const token=await getIdToken();
  const res=await fetch('/api/loyalty/'+encodeURIComponent(uid),{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action:'daily'})});
  const data=await res.json().catch(()=>({})); if(res.status===409) return {success:false,reason:'already_claimed'};
  if(!res.ok||!data.success) return {success:false,reason:'error',message:data.error||'تعذر صرف المكافأة'};
  playNotificationSound(); return {success:true,newPoints:Number(data.newPoints||0),awarded:10};
}

export async function redeemPointsForVerification(uid,placeId,placeName='') {
  if(!uid||!placeId) return {success:false,message:'بيانات غير مكتملة'};
  try {
    const {getIdToken}=await import('../core/auth.js'); const token=await getIdToken();
    const res=await fetch('/api/loyalty/'+encodeURIComponent(uid),{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action:'redeem_verification',placeId,placeName})});
    const data=await res.json().catch(()=>({})); if(!res.ok||!data.success) return {success:false,message:data.error||'حدث خطأ أثناء استبدال النقاط'};
    playNotificationSound(); return {success:true,newPoints:Number(data.newPoints||0),verifiedUntil:data.verifiedUntil,message:'تهانينا! تم توثيق مكانك ('+(placeName||placeId)+') رسمياً لمدة عام كامل! 🌟'};
  } catch(err) { return {success:false,message:err.message||'حدث خطأ أثناء استبدال النقاط'}; }
}