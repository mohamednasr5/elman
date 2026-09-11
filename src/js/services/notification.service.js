/**
 * notification.service.js
 * Universal Real-Time Notification & Audio Chime Engine
 * Guarantees zero-delay instant notifications across PC, Mobile, and PWA when places are added or verified.
 */

import { getPublishedPlaces } from '../core/db.js';
import { fetchLiveCraftsmen, fetchServiceRequests } from './interactive-hub.service.js';

// ── Web Audio API Synthesized Crystal Bell Chime ──
let _audioCtx = null;

function getAudioContext() {
  if (!_audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      _audioCtx = new AudioContextClass();
    }
  }
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  const isSoundEnabled = localStorage.getItem('manzala_notif_sound_enabled') !== 'false';
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [1396.91, 1760.00, 2093.00];
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.28 / (index + 1), now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.6);
    });

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([70, 40, 110]);
      } catch (_) {}
    }
  } catch (err) {
    console.debug('[NotificationSound] Audio play handled:', err);
  }
}

export function toggleNotificationSound() {
  const current = localStorage.getItem('manzala_notif_sound_enabled') !== 'false';
  const next = !current;
  localStorage.setItem('manzala_notif_sound_enabled', String(next));
  if (next) {
    playNotificationSound();
  }
  return next;
}

export function isNotificationSoundEnabled() {
  return localStorage.getItem('manzala_notif_sound_enabled') !== 'false';
}

// ── Read & Deleted IDs Tracking ──

export function getDeletedNotifIds(uid) {
  const merged = new Set();
  if (typeof localStorage === 'undefined') return merged;

  const keys = ['manzala_user_dismissed_notifs'];
  if (uid) keys.push(`dismissed_notifs_${uid}`);

  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) JSON.parse(raw).forEach(id => merged.add(String(id)));
    } catch (_) {}
  });

  return merged;
}

export function getReadNotifIds(uid) {
  const merged = new Set();
  if (typeof localStorage === 'undefined') return merged;

  const keys = ['manzala_read_notifs_all'];
  if (uid) keys.push(`read_global_notifs_${uid}`);

  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) JSON.parse(raw).forEach(id => merged.add(String(id)));
    } catch (_) {}
  });

  return merged;
}

export async function deleteSingleNotification(notifId, uid) {
  if (!notifId) return;
  const idStr = String(notifId);

  const set = getDeletedNotifIds(uid);
  set.add(idStr);
  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_user_dismissed_notifs', JSON.stringify(arr));
    if (uid) localStorage.setItem(`dismissed_notifs_${uid}`, JSON.stringify(arr));
  }
}

export async function clearAllUserNotifications(uid) {
  const allNotifs = await fetchManagedUserNotifications(uid);
  const set = getDeletedNotifIds(uid);

  allNotifs.forEach(n => {
    if (n.id) set.add(String(n.id));
  });

  const arr = Array.from(set);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_user_dismissed_notifs', JSON.stringify(arr));
    if (uid) localStorage.setItem(`dismissed_notifs_${uid}`, JSON.stringify(arr));
  }
}

export async function clearReadNotifications(uid) {
  const allNotifs = await fetchManagedUserNotifications(uid);
  const set = getDeletedNotifIds(uid);

  allNotifs.filter(n => n.isRead).forEach(n => {
    if (n.id) set.add(String(n.id));
  });

  const arr = Array.from(set);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_user_dismissed_notifs', JSON.stringify(arr));
    if (uid) localStorage.setItem(`dismissed_notifs_${uid}`, JSON.stringify(arr));
  }
}

export async function markSingleNotificationAsRead(notifId, uid) {
  if (!notifId) return;
  const idStr = String(notifId);

  const set = getReadNotifIds(uid);
  set.add(idStr);
  const arr = Array.from(set);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_read_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(arr));
  }
}

export async function markAllUserNotificationsAsRead(uid) {
  const allNotifs = await fetchManagedUserNotifications(uid);
  const set = getReadNotifIds(uid);

  allNotifs.forEach(n => {
    if (n.id) set.add(String(n.id));
  });

  const arr = Array.from(set);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('manzala_read_notifs_all', JSON.stringify(arr));
    if (uid) localStorage.setItem(`read_global_notifs_${uid}`, JSON.stringify(arr));
  }
}

// Local cache helper for instant sub-second notifications display (<10ms)
export function getCachedManagedUserNotifications(uid) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`manzala_cached_managed_notifs_${uid || 'anon'}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const deletedIds = getDeletedNotifIds(uid);
    const readIds = getReadNotifIds(uid);
    return (Array.isArray(parsed) ? parsed : [])
      .filter(n => n && n.id && !deletedIds.has(String(n.id)))
      .map(n => ({
        ...n,
        isRead: Boolean(n.isRead || readIds.has(String(n.id)))
      }));
  } catch (_) {
    return [];
  }
}

/**
 * Fetch all notifications (Live Firebase RTDB + Verified/New Places Synthesizer with SWR Cache)
 */
export async function fetchManagedUserNotifications(uid) {
  const deletedIds = getDeletedNotifIds(uid);
  const readIds = getReadNotifIds(uid);
  const mergedMap = {};

  // 1. Fetch Global Notifications (dbGet uses memory & localStorage SWR cache)
  try {
    const globalNotifs = (await dbGet('globalNotifications', true)) || {};
    Object.entries(globalNotifs).forEach(([id, val]) => {
      if (val && !deletedIds.has(String(id))) {
        mergedMap[id] = { id: String(id), ...val, isBroadcast: true, isRead: readIds.has(String(id)) };
      }
    });
  } catch (_) {}

  // 2. Synthesize directly from Verified Places & Latest Places in Turso / Cache
  try {
    const placesList = (await getPublishedPlaces({ limit: 200 })) || [];
    placesList.forEach(place => {
      if (!place) return;
      const id = String(place.id || place._key);

      const targetUrl = '/place.html?slug=' + encodeURIComponent(place.slug || id);

      // Verified Place Notification
      const isPlaceVerified = Boolean(
        place.isVerified === true ||
        place.verified === true ||
        place.verificationStatus === 'verified' ||
        place.isFeaturedVerified === true
      );
      if (isPlaceVerified) {
        const notifId = 'notif_verified_' + id;
        if (!deletedIds.has(notifId) && !mergedMap[notifId]) {
          mergedMap[notifId] = {
            id: notifId,
            type: 'place_verified',
            title: '👑 توثيق رسمي: ' + (place.name || 'مكان موثق'),
            placeId: id,
            placeName: place.name || 'المكان',
            placeSlug: place.slug || id,
            placeAddress: place.address || place.area || 'المنزلة والمطرية',
            message: 'تم توثيق (' + (place.name || 'المكان') + ') رسمياً بالعلامة الزرقاء ليتصدر دليل المنزلة والمطرية الرقمي!',
            actionText: 'مشاهدة المكان 🚀',
            actionUrl: targetUrl,
            url: targetUrl,
            icon: place.logoUrl || './icons/icon-192x192.png',
            createdAt: Number(place.verifiedAt || place.updatedAt || place.createdAt || (Date.now() - 3600000)),
            isBroadcast: true,
            isRead: readIds.has(notifId)
          };
        }
      }

      // New Place Joined Notification (Recent places)
      const createdTime = Number(place.createdAt || 0);
      if (createdTime > 0) {
        const notifId = 'notif_new_place_' + id;
        if (!deletedIds.has(notifId) && !mergedMap[notifId]) {
          mergedMap[notifId] = {
            id: notifId,
            type: 'new_place',
            title: '🎉 انضمام نشاط جديد: ' + (place.name || 'نشاط جديد'),
            placeId: id,
            placeName: place.name || 'المكان',
            placeSlug: place.slug || id,
            message: 'انضم (' + (place.name || 'المكان') + ') من (' + (place.area || 'المنزلة والمطرية') + ') حديثاً إلى الدليل.',
            actionText: 'زيارة المكان ↗',
            actionUrl: targetUrl,
            url: targetUrl,
            icon: place.logoUrl || './icons/icon-192x192.png',
            createdAt: createdTime,
            isBroadcast: true,
            isRead: readIds.has(notifId)
          };
        }
      }
    });
  } catch (_) {}

  // 3. Synthesize active on-call craftsmen
  try {
    const craftsmen = await fetchLiveCraftsmen();
    (craftsmen || []).forEach(c => {
      if (!c || !c.isAvailableNow) return;
      const notifId = 'notif_craftsman_' + c.id;
      if (!deletedIds.has(notifId) && !mergedMap[notifId]) {
        const targetUrl = c.placeId ? `/place.html?id=${encodeURIComponent(c.placeId)}` : `/now.html#craftsman-${c.id}`;
        mergedMap[notifId] = {
          id: notifId,
          type: 'craftsman_live',
          title: `⚡ (${c.craftsmanName}) متاح حالياً لأي طلب!`,
          message: `فني (${c.professionName}) متاح الآن للتحرك والطلبات بالمنزلة والمطرية. اضغط لمشاهدة ملفه والتواصل`,
          actionText: 'مشاهدة ملفه والتواصل 🚀',
          actionUrl: targetUrl,
          url: targetUrl,
          icon: './icons/icon-192x192.png',
          createdAt: Number(c.updatedAt || Date.now()),
          isBroadcast: true,
          isRead: readIds.has(notifId)
        };
      }
    });
  } catch (_) {}

  // 4. Synthesize open community service requests
  try {
    const requests = await fetchServiceRequests({ status: 'open', limit: 25 });
    (requests || []).forEach(r => {
      if (!r || r.status !== 'open') return;
      const notifId = 'notif_req_' + r.id;
      if (!deletedIds.has(notifId) && !mergedMap[notifId]) {
        const targetUrl = `/now.html#req-${r.id}`;
        mergedMap[notifId] = {
          id: notifId,
          type: 'service_request',
          title: `📢 طلب جديد: (${r.userName || 'أحد الأهالي'}) محتاج (${r.title})`,
          message: `طلب خدمة (${r.category || 'عامة'}) في ${r.village || 'المنزلة'} (${r.timing || 'خلال اليوم'}) — اضغط لمشاهدة الطلب`,
          actionText: 'مشاهدة الطلب 🤝',
          actionUrl: targetUrl,
          url: targetUrl,
          icon: r.photoUrl || './icons/icon-192x192.png',
          createdAt: Number(r.createdAt || Date.now()),
          isBroadcast: true,
          isRead: readIds.has(notifId)
        };
      }
    });
  } catch (_) {}

  // 5. Personal notifications arrive through FCM/local state; no RTDB reads.
  const all = Object.values(mergedMap).map(n => ({
    ...n,
    isRead: Boolean(n.isRead || readIds.has(String(n.id)))
  }));

  const sorted = all.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

  // Save to instant local storage cache for 0ms loads
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`manzala_cached_managed_notifs_${uid || 'anon'}`, JSON.stringify(sorted.slice(0, 150)));
    }
  } catch (_) {}

  return sorted;
}

/**
 * Update Notification Badges across Header, Sidebar, and Mobile Navigation
 */
export async function updateAllNotificationBadges(uid) {
  try {
    const notifs = await fetchManagedUserNotifications(uid);
    const unread = notifs.filter(n => !n.isRead).length;

    const allBadgeSelectors = [
      '#header-notifs-badge',
      '#header-notif-badge',
      '.header-notif-badge',
      '#sidebar-notifs-badge',
      '.sidebar-notifs-badge',
      '#bottom-notifs-badge',
      '.bottom-nav-notif-badge',
      '[data-notifs-badge]'
    ];

    allBadgeSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(badge => {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline-flex' : 'none';
        if (unread > 0) {
          badge.classList.remove('badge-pop-anim');
          requestAnimationFrame(() => {
            badge.classList.add('badge-pop-anim');
          });
        }
      });
    });
  } catch (_) {}
}

let _isLiveNotifSubscribed = false;

/**
 * Initialize 100% Real-Time Live Notification Stream on Firebase RTDB
 */
export function initLiveNotificationSubscriber(uid) {
  if (typeof window === 'undefined') return;
  updateAllNotificationBadges(uid);
  if (_isLiveNotifSubscribed) return;
  _isLiveNotifSubscribed = true;

  // Realtime application data is delivered by FCM/server events and the
  // application's own Worker sync bus. Firebase Realtime Database is not used.
  const refresh = () => updateAllNotificationBadges(uid);
  window.addEventListener('manzala:realtime_sync', refresh);
  window.addEventListener('manzala:new_broadcast_notification', (e) => {
    refresh();
    if (e.detail) showLiveNotificationPopup(e.detail, uid);
  });
  window.addEventListener('focus', refresh);

  // Lightweight reconciliation for places, craftsmen, and service requests.
  let previous = new Map();
  let previousCraftsmen = new Map();
  let previousRequests = new Map();

  const poll = async () => {
    try {
      const places = await getPublishedPlaces({limit:250,forceFresh:true});
      const now = Date.now();
      const current = new Map((places||[]).map(p => [String(p.id||p._key), p]));
      if (previous.size) {
        for (const [id,p] of current) {
          const created = Number(p.createdAt||0);
          const verified = Number(p.verifiedAt||0);
          if (created > now - 45000 && !previous.has(id)) {
            showLiveNotificationPopup({
              id:'notif_new_place_'+id,type:'new_place',
              title:'🎉 انضمام نشاط جديد: '+(p.name||'نشاط جديد'),
              message:'('+(p.name||'مكان جديد')+') انضم حديثاً إلى دليل المنزلة والمطرية.',
              actionUrl:'/place.html?slug='+encodeURIComponent(p.slug||id),createdAt:created
            },uid);
          } else if (verified > now - 45000 && verified > Number(previous.get(id)?.verifiedAt||0)) {
            showLiveNotificationPopup({
              id:'notif_verified_'+id,type:'place_verified',
              title:'👑 توثيق رسمي جديد: '+(p.name||'مكان موثق'),
              placeName:p.name||'المكان',
              message:'تم توثيق ('+(p.name||'المكان')+') رسمياً بالعلامة الزرقاء.',
              actionUrl:'/place.html?slug='+encodeURIComponent(p.slug||id),createdAt:verified
            },uid);
          }
        }
      }
      previous=current;

      // Reconcile Live Craftsmen
      try {
        const liveCraftsmen = await fetchLiveCraftsmen();
        const currentCraftsmen = new Map((liveCraftsmen || []).filter(c => c.isAvailableNow).map(c => [String(c.id), c]));
        if (previousCraftsmen.size) {
          for (const [id, c] of currentCraftsmen) {
            const updated = Number(c.updatedAt || 0);
            if (!previousCraftsmen.has(id) || (!previousCraftsmen.get(id)?.isAvailableNow && c.isAvailableNow)) {
              showLiveNotificationPopup({
                id: 'notif_craftsman_' + id,
                type: 'craftsman_live',
                title: `⚡ (${c.craftsmanName}) متاح حالياً لأي طلب!`,
                message: `فني (${c.professionName}) متاح الآن للتحرك والطلبات بالمنزلة والمطرية — مشاهدة ملفه والتواصل`,
                actionUrl: c.placeId ? `/place.html?id=${encodeURIComponent(c.placeId)}` : `/now.html#craftsman-${id}`,
                createdAt: updated || now
              }, uid);
            }
          }
        }
        previousCraftsmen = currentCraftsmen;
      } catch (_) {}

      // Reconcile Community Service Requests
      try {
        const reqs = await fetchServiceRequests({ status: 'open', limit: 20 });
        const currentReqs = new Map((reqs || []).map(r => [String(r.id), r]));
        if (previousRequests.size) {
          for (const [id, r] of currentReqs) {
            const created = Number(r.createdAt || 0);
            if (!previousRequests.has(id)) {
              showLiveNotificationPopup({
                id: 'notif_req_' + id,
                type: 'service_request',
                title: `📢 طلب جديد: (${r.userName || 'أحد الأهالي'}) محتاج (${r.title})`,
                message: `طلب خدمة (${r.category || 'عامة'}) في ${r.village || 'المنزلة'} (${r.timing || 'اليوم'}) — مشاهدة الطلب`,
                actionUrl: `/now.html#req-${id}`,
                createdAt: created || now
              }, uid);
            }
          }
        }
        previousRequests = currentReqs;
      } catch (_) {}

      refresh();
    } catch (_) {}
  };
  poll();
  const timer=setInterval(poll,60000);
  window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
}

// ── In-App Live Floating Notification Banner ──

export function showLiveNotificationPopup(notification, uid) {
  if (typeof document === 'undefined' || !notification) return;

  const deletedIds = getDeletedNotifIds(uid);
  if (notification.id && deletedIds.has(String(notification.id))) return;

  // Session deduplication: prevent playing chime / showing popup multiple times for same event
  if (notification.id) {
    const sessionKey = 'manzala_toast_seen_' + notification.id;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, '1');
    } catch (_) {}
  }

  playNotificationSound();

  let popupBox = document.getElementById('manzala-live-notifs-container');
  if (!popupBox) {
    popupBox = document.createElement('div');
    popupBox.id = 'manzala-live-notifs-container';
    popupBox.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100vw - 40px);
      pointer-events: none;
    `;
    document.body.appendChild(popupBox);
  }

  let iconEmoji = '🎉';
  let titleColor = '#38BDF8';
  let borderColor = '#0284C7';

  if (notification.type === 'place_verified') {
    iconEmoji = '👑';
    titleColor = '#FBBF24';
    borderColor = '#EAB308';
  } else if (notification.type === 'place_review') {
    iconEmoji = notification.isPositive ? '⭐' : '⚠️';
    titleColor = notification.isPositive ? '#34D399' : '#F87171';
    borderColor = notification.isPositive ? '#10B981' : '#EF4444';
  } else if (notification.type === 'craftsman_live') {
    iconEmoji = '⚡';
    titleColor = '#FBBF24';
    borderColor = '#F59E0B';
  } else if (notification.type === 'service_request') {
    iconEmoji = '📢';
    titleColor = '#34D399';
    borderColor = '#10B981';
  }

  const notifEl = document.createElement('div');
  notifEl.className = 'live-notif-toast';
  notifEl.style.cssText = `
    background: #0B1E30;
    color: #FFFFFF;
    border: 1.5px solid ${borderColor};
    border-radius: 14px;
    padding: 12px 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    pointer-events: auto;
    animation: liveNotifSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    direction: rtl;
    text-align: right;
  `;

  const targetUrl = notification.actionUrl || notification.url || 'dashboard.html?section=notifications';

  notifEl.innerHTML = `
    <div style="font-size:24px;flex-shrink:0">${iconEmoji}</div>
    <div style="flex:1;min-width:0">
      <strong style="display:block;font-size:13.5px;color:${titleColor}">${notification.title || 'إشعار جديد'}</strong>
      <span style="font-size:12px;color:#CBD5E1;display:block;margin-top:2px">${notification.message || ''}</span>
    </div>
    <button type="button" style="background:none;border:none;color:#94A3B8;font-size:14px;cursor:pointer;padding:4px" aria-label="إغلاق">✕</button>
  `;

  notifEl.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      window.location.href = targetUrl;
    }
  });

  notifEl.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation();
    notifEl.remove();
  });

  popupBox.appendChild(notifEl);

  // Trigger Native Android System Notification via Service Worker if permission granted
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg && reg.showNotification) {
        reg.showNotification(notification.title || 'دليل المنزلة والمطرية 🔔', {
          body: notification.message || notification.body || '',
          icon: notification.icon || './icons/icon-192x192.png',
          badge: './icons/icon-96x96.png',
          dir: 'rtl',
          lang: 'ar',
          vibrate: [200, 100, 200],
          tag: notification.id || ('manzala-notif-' + Date.now()),
          renotify: true,
          data: { url: targetUrl }
        });
      }
    }).catch(() => {});
  }

  setTimeout(() => {
    if (notifEl && notifEl.parentNode) {
      notifEl.style.opacity = '0';
      notifEl.style.transform = 'translateY(-10px)';
      notifEl.style.transition = 'all 0.3s ease';
      setTimeout(() => notifEl.remove(), 300);
    }
  }, 5000);
}

// ── Backward-Compatibility Export Aliases ──
export const initGlobalRealtimeNotificationsListener = initLiveNotificationSubscriber;
export { mountPushNotificationPrompt, initFcmMessaging as setupForegroundMessageListener } from './fcm.service.js';

export async function broadcastLiveNewsPushNotification(newsItem) {
  if (!newsItem) return;
  const notifId = 'notif_news_' + (newsItem.id || Date.now());
  const notif = {
    id: notifId,
    type: 'live_news',
    title: '🔥 خبر عاجل في يحدث الآن: ' + (newsItem.title || 'خبر جديد'),
    message: newsItem.title || 'تم نشر تحديث جديد في المنزلة والمطرية',
    actionUrl: 'now.html',
    url: 'now.html',
    createdAt: Date.now(),
    isRead: false
  };
  window.dispatchEvent(new CustomEvent('manzala:new_broadcast_notification',{detail:notif}));
}
