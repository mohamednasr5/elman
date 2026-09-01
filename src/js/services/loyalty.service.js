/**
 * loyalty.service.js
 * Comprehensive Gamification & Loyalty Rewards Engine
 * Supports points accrual, levels, daily bonus, and 5000 points Place Verification Redemption.
 */

import { getDB, dbGet, dbSet, dbUpdate } from '../core/db.js';
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
export async function getUserLoyaltyProfile(uid) {
  if (!uid) return null;
  const db = getDB();
  const snap = await db.ref(`users/${uid}/loyalty`).once('value');
  const data = snap.val() || {};

  return {
    points: data.points || 0,
    totalEarned: data.totalEarned || data.points || 0,
    history: data.history ? Object.values(data.history).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : [],
    lastDailyBonusDate: data.lastDailyBonusDate || null
  };
}

/**
 * Award points to a user for an activity
 */
export async function awardPoints(uid, ruleKey, customMeta = {}) {
  if (!uid) return null;
  const rule = POINTS_RULES[ruleKey] || { points: 10, label: 'مكافأة تفاعل' };
  const amount = customMeta.pointsOverride || rule.points;
  const db = getDB();

  try {
    const loyaltyRef = db.ref(`users/${uid}/loyalty`);
    const snap = await loyaltyRef.once('value');
    const cur = snap.val() || { points: 0, totalEarned: 0 };

    const newPoints = (cur.points || 0) + amount;
    const newTotal = (cur.totalEarned || 0) + amount;

    const logEntry = {
      id: db.ref().push().key,
      type: 'earn',
      ruleKey,
      amount: `+${amount}`,
      pointsDelta: amount,
      label: customMeta.label || rule.label,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      meta: customMeta
    };

    await Promise.all([
      loyaltyRef.update({
        points: newPoints,
        totalEarned: newTotal,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP
      }),
      db.ref(`users/${uid}/loyalty/history/${logEntry.id}`).set(logEntry)
    ]);

    playNotificationSound();
    return { success: true, newPoints, awarded: amount, label: logEntry.label };
  } catch (err) {
    console.error('[Loyalty] Error awarding points:', err);
    return { success: false, error: err };
  }
}

/**
 * Claim Daily Login Bonus (+10 points once every 24h)
 */
export async function claimDailyBonus(uid) {
  if (!uid) return { success: false, reason: 'no_uid' };
  const todayStr = new Date().toISOString().slice(0, 10);
  const db = getDB();

  const snap = await db.ref(`users/${uid}/loyalty/lastDailyBonusDate`).once('value');
  if (snap.val() === todayStr) {
    return { success: false, reason: 'already_claimed' };
  }

  const res = await awardPoints(uid, 'DAILY_LOGIN', { label: 'مكافأة تسجيل الدخول اليومي' });
  if (res && res.success) {
    await db.ref(`users/${uid}/loyalty/lastDailyBonusDate`).set(todayStr);
  }
  return res;
}

/**
 * Core Feature: Redeem 5000 Points for Full Place/Account Verification
 */
export async function redeemPointsForVerification(uid, placeId, placeName = '') {
  if (!uid || !placeId) {
    return { success: false, message: 'بيانات غير مكتملة' };
  }

  const db = getDB();

  try {
    const loyaltyRef = db.ref(`users/${uid}/loyalty`);
    const snap = await loyaltyRef.once('value');
    const loyalty = snap.val() || {};
    const curPoints = loyalty.points || 0;

    if (curPoints < VERIFICATION_POINTS_COST) {
      return {
        success: false,
        message: `رصيدك (${curPoints} نقطة) لا يكفي. تحتاج إلى ${VERIFICATION_POINTS_COST} نقطة لتوثيق المكان.`
      };
    }

    const newPoints = curPoints - VERIFICATION_POINTS_COST;
    const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;

    // 1. Verify Place in Firebase
    await db.ref(`places/${placeId}`).update({
      isVerified: true,
      verifiedAt: firebase.database.ServerValue.TIMESTAMP,
      verifiedUntil: oneYearFromNow,
      verifiedVia: 'loyalty_points_redemption',
      verifiedByPoints: VERIFICATION_POINTS_COST
    });

    // 2. Deduct points & log in history
    const logId = db.ref().push().key;
    const logEntry = {
      id: logId,
      type: 'redeem',
      ruleKey: 'REDEEM_VERIFICATION',
      amount: `-${VERIFICATION_POINTS_COST}`,
      pointsDelta: -VERIFICATION_POINTS_COST,
      label: `استبدال 5000 نقطة بتوثيق رسمي لمكان (${placeName || placeId})`,
      placeId,
      placeName,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    await Promise.all([
      loyaltyRef.update({
        points: newPoints,
        lastRedemptionAt: firebase.database.ServerValue.TIMESTAMP
      }),
      db.ref(`users/${uid}/loyalty/history/${logId}`).set(logEntry),
      db.ref(`loyaltyRedemptions/${logId}`).set({
        uid,
        placeId,
        placeName,
        pointsRedeemed: VERIFICATION_POINTS_COST,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      })
    ]);

    playNotificationSound();

    return {
      success: true,
      newPoints,
      verifiedUntil: oneYearFromNow,
      message: `تهانينا! تم استبدال ${VERIFICATION_POINTS_COST} نقطة وتوثيق مكانك (${placeName}) رسمياً لمدة عام كامل! 🌟`
    };
  } catch (err) {
    console.error('[Loyalty] Error redeeming points:', err);
    return { success: false, message: err.message || 'حدث خطأ أثناء استبدال النقاط' };
  }
}
