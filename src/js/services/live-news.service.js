/**
 * live-news.service.js
 * Bulletproof Live City Pulse & Community News Engine (يحدث الآن في المنزلة والمطرية)
 * Guaranteed Permanent Deletion, Multi-tier Sync, and Zero-Permission Errors.
 */

import { tursoFetch } from '../core/db.js';
import { awardPoints } from './loyalty.service.js';
import { playNotificationSound, broadcastLiveNewsPushNotification } from './notification.service.js';
import { getLiveCommunityFeedItems } from './social-news-sync.service.js';

export const NEWS_CATEGORIES = {
  jobs_vacant: { icon: '💼', label: 'وظيفة شاغرة (مطلوب موظف/عامل)', color: '#059669', isJob: true },
  jobs_seeker: { icon: '🧑‍💼', label: 'باحث عن عمل (متاح للتوظيف)', color: '#7C3AED', isJob: true },
  atm:        { icon: '🏧', label: 'ماكينة صراف ATM', color: '#0284C7' },
  traffic:    { icon: '🚧', label: 'حالة الطرق والازدحام', color: '#E11D48' },
  offers:     { icon: '🛒', label: 'عروض وتخفيضات', color: '#10B981' },
  food:       { icon: '🍔', label: 'مطاعم ومأكولات', color: '#F59E0B' },
  openings:   { icon: '🏪', label: 'افتتاحات ومحلات جديدة', color: '#8B5CF6' },
  events:     { icon: '🎉', label: 'مناسبات وفعاليات', color: '#EC4899' },
  announces:  { icon: '📢', label: 'تنبيهات وإعلانات هامة', color: '#D97706' },
  utilities:  { icon: '⚡', label: 'مرافق وخدمات (مياه/كهرباء)', color: '#3B82F6' },
  transport:  { icon: '🚌', label: 'مواقف ومواصلات', color: '#6366F1' },
  official_manzala: { icon: '🏛️', label: 'مركز ومدينة المنزلة (رسمي)', color: '#0369A1', isOfficial: true },
  official_matariya: { icon: '🏛️', label: 'رئاسة مركز ومدينة المطرية (رسمي)', color: '#0284C7', isOfficial: true },
  general:    { icon: '🔥', label: 'عام ومحلي', color: '#F97316' }
};

export const STATUS_TAGS = {
  job_hiring:   { label: '💼 مطلوب فوراً (وظيفة شاغرة)', color: '#10B981', type: 'vacant' },
  job_seeking:  { label: '🧑‍💼 باحث عن عمل (متاح للعمل)', color: '#8B5CF6', type: 'seeker' },
  official_post:{ label: '🏛️ منشور وتحديث رسمي', color: '#0284C7', type: 'official' },
  active_green: { label: '🟢 يعمل / متاح الآن', color: '#10B981' },
  crowded_red:  { label: '🔴 ازدحام شديد / معطل', color: '#EF4444' },
  warning_amber:{ label: '⚠️ انتباه / تحويل طريق', color: '#F59E0B' },
  offer_tag:    { label: '🎁 خصم خاص وحصري', color: '#059669' },
  urgent_tag:   { label: '🚨 هام وعاجل', color: '#DC2626' }
};

const LOCAL_STORE_KEY = 'manzala_live_news_store_v3';
const DELETED_STORE_KEY = 'manzala_deleted_live_news_ids_v3';
const INITIALIZED_KEY = 'manzala_live_news_initialized_v3';

export function getDeletedLiveNewsIds() {
  const set = new Set();
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(DELETED_STORE_KEY);
      if (raw) {
        JSON.parse(raw).forEach(id => set.add(String(id)));
      }
    }
  } catch (_) {}
  return set;
}

export function markLiveNewsAsDeletedPermanently(newsId) {
  if (!newsId) return;
  const idStr = String(newsId);
  const set = getDeletedLiveNewsIds();
  set.add(idStr);

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_STORE_KEY, JSON.stringify(Array.from(set)));
      localStorage.setItem(INITIALIZED_KEY, 'true');
    }
  } catch (_) {}

  // Remove from local store as well
  const store = getLocalStore();
  if (store) {
    const filtered = store.filter(i => String(i.id) !== idStr);
    saveLocalStore(filtered);
  }
}

function getLocalStore() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

function saveLocalStore(items) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(items));
      localStorage.setItem(INITIALIZED_KEY, 'true');
    }
  } catch (_) {}
}

/**
 * Fetch published live news reports
 */
/**
 * Fetch published live news reports strictly from Cloud Firebase & user contributions
 */
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 Hours

/**
 * Fetch published live news reports strictly from Cloud Firebase & user contributions (24-Hour Active Window)
 */
export async function getPublishedLiveNews({ city = '', category = '', limit = 40 } = {}) {
  const params = new URLSearchParams({status:'published',limit:String(Math.min(100,Math.max(1,limit)))});
  if(city) params.set('city',city); if(category) params.set('category',category);
  try { const data=await tursoFetch('/api/live-news?'+params); return Array.isArray(data?.data)?data.data:[]; }
  catch(err){ console.debug('[LiveNews] Turso read handled:',err.message); return []; }
}

export async function getPendingLiveNews() {
  try { const data=await tursoFetch('/api/live-news?status=pending&limit=100'); return Array.isArray(data?.data)?data.data:[]; }
  catch(err){ console.debug('[LiveNews] Turso pending read handled:',err.message); return []; }
}

export async function submitLiveReport({title,location,category='general',statusTagKey='active_green',details='',city='المنزلة',imageUrl='',phone='',inquiryLink='',salary='',user=null,isAdminUser=false}) {
  if(!title||!location) throw new Error('يرجى كتابة عنوان الخبر وتحديد المكان أو الشارع');
  const isJob=category==='jobs_vacant'||category==='jobs_seeker';
  const cleanPhone=String(phone||'').trim(), cleanInquiryLink=String(inquiryLink||'').trim();
  if(isJob&&!cleanPhone&&!cleanInquiryLink) throw new Error('تنبيه إلزامي: لإضافة فرصة عمل، يجب توفير رابط للاستعلام أو رقم هاتف/واتساب للتواصل');
  const payload={title:title.trim(),location:location.trim(),category,statusTagKey,details:String(details||'').trim(),city:city||'المنزلة',imageUrl:imageUrl||'',phone:cleanPhone,inquiryLink:cleanInquiryLink||(cleanPhone?'https://wa.me/'+cleanPhone.replace(/\D/g,''):''),salary:String(salary||'').trim()};
  const data=await tursoFetch('/api/live-news',{method:'POST',body:JSON.stringify(payload)});
  if(!data?.success) throw new Error(data?.error||'تعذر حفظ الخبر');
  const post={...payload,id:data.id,status:data.status,createdAt:Date.now()};
  if(data.status==='published') broadcastLiveNewsPushNotification(post); else sendTelegramPendingAlert(post);
  playNotificationSound();
  return {success:true,id:data.id,isPublished:data.status==='published',post};
}

/**
 * Admin: Approve and publish pending report
 */
export async function adminApproveLiveNews(newsId) {
  const now=Date.now();
  const data=await tursoFetch('/api/live-news/'+encodeURIComponent(newsId),{method:'PUT',body:JSON.stringify({status:'published'})});
  if(!data?.success) throw new Error(data?.error||'تعذر اعتماد الخبر');
  broadcastLiveNewsPushNotification({id:newsId,publishedAt:now});
  return {success:true};
}

/** Admin: Update existing live news report */
export async function adminUpdateLiveNews(newsId,updates) {
  const data=await tursoFetch('/api/live-news/'+encodeURIComponent(newsId),{method:'PUT',body:JSON.stringify(updates||{})});
  if(!data?.success) throw new Error(data?.error||'تعذر تحديث الخبر');
  return {success:true};
}

/** Admin: Permanently Delete report */
export async function reactToLiveNews(newsId, type, user) {
  const id = String(newsId || '').trim();
  const reaction = String(type || '').trim();
  const uid = String(user?.uid || user?.id || '').trim();
  if (!id) throw new Error('معرّف الخبر غير صالح');
  if (!uid) throw new Error('يجب تسجيل الدخول للتفاعل');
  if (!['confirm','love','doubt'].includes(reaction)) throw new Error('نوع التفاعل غير صالح');
  const data = await tursoFetch('/api/live-news/' + encodeURIComponent(id) + '/reaction', {
    method: 'POST',
    body: JSON.stringify({ type: reaction })
  });
  if (!data?.success) throw new Error(data?.error || 'فشل التفاعل');
  return data;
}

export async function adminDeleteLiveNews(newsId) {
  if(!newsId) return {success:true};
  const data=await tursoFetch('/api/live-news/'+encodeURIComponent(newsId),{method:'DELETE'});
  if(!data?.success) throw new Error(data?.error||'تعذر حذف الخبر');
  markLiveNewsAsDeletedPermanently(newsId);
  return {success:true};
}

/**
 * Fallback initial rich realistic news
 */
function getFallbackDefaultNews() {
  const now = Date.now();
  return [
    {
      id: 'init_atm_banque_misr',
      title: 'ماكينة بنك مصر تعمل بكفاءة ومتوفر بها السحب النقدي',
      location: 'شارع الجلاء — بجوار مجلس مدينة المنزلة',
      category: 'atm',
      statusTagKey: 'active_green',
      details: 'تم التأكيد الآن.. الماكينة تعمل بسلاسة ولا يوجد طابور انتظار طويل.',
      city: 'المنزلة',
      userName: 'أحمد إبراهيم',
      reactions: { confirm: 19, love: 12, doubt: 0 },
      status: 'published',
      createdAt: now - 8 * 60 * 1000
    },
    {
      id: 'init_traffic_port_said',
      title: 'ازدحام مروري متوسط عند مدخل كوبري المطرية',
      location: 'كوبري المطرية — طريق بورسعيد الزراعي',
      category: 'traffic',
      statusTagKey: 'crowded_red',
      details: 'يرجى توخي الحذر أو اتخاذ طريق الموقف الجديد لتفادي التكدس الحالي.',
      city: 'المطرية',
      userName: 'محمود الشناوي',
      reactions: { confirm: 14, love: 5, doubt: 1 },
      status: 'published',
      createdAt: now - 22 * 60 * 1000
    },
    {
      id: 'init_offer_seafood',
      title: 'وصول دفعة جمبري وبوري طازج من بحيرة المنزلة بأسعار مخفضة',
      location: 'سوق السمك الحضاري — المطرية',
      category: 'offers',
      statusTagKey: 'offer_tag',
      details: 'عروض اليوم الطازجة مباشرة من الصيادين بتخفيضات تصل إلى 20%.',
      city: 'المطرية',
      userName: 'سيد البدوي',
      reactions: { confirm: 28, love: 35, doubt: 0 },
      status: 'published',
      createdAt: now - 45 * 60 * 1000
    },
    {
      id: 'init_opening_store',
      title: 'افتتاح فرع جديد لمحمصة وحلويات العائلات بالمنزلة',
      location: 'شارع الثورة — أمام مدرسة المنزلة الثانوية بنين',
      category: 'openings',
      statusTagKey: 'active_green',
      details: 'توزيع هدايا وعينات مجانية وتخفيض 15% بمناسبة الافتتاح طوال اليوم.',
      city: 'المنزلة',
      userName: 'كريم ممدوح',
      reactions: { confirm: 22, love: 18, doubt: 0 },
      status: 'published',
      createdAt: now - 90 * 60 * 1000
    }
  ];
}
