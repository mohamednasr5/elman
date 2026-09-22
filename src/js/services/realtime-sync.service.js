/**
 * Universal Realtime Synchronization & Instant Push Engine.
 * Keeps the hot local cache usable while refreshing changed public data in background.
 */
import { playNotificationSound } from './notification.service.js';
let _syncChannel = null, _eventSource = null, _currentDataVersion = null, _isInitialized = false, _checkTimer = null, _isReconciling = false;

export function initRealtimePwaSyncBus() {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;
  if ('BroadcastChannel' in window && !_syncChannel) { try { _syncChannel = new BroadcastChannel('manzala_realtime_sync_bus'); _syncChannel.onmessage = e => { const {type,payload}=e.data||{}; handleIncomingRealtimeEvent(type,payload,false); }; } catch (_) {} }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data?.type === 'DATA_VERSION_CHANGED') handleIncomingRealtimeEvent('DATA_VERSION_CHANGED', e.data.payload||{}, true); });
  connectSyncStream();
  const check=()=>reconcileVersionDifference();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){check();if(!_eventSource||_eventSource.readyState===EventSource.CLOSED)connectSyncStream();}});
  window.addEventListener('focus',check); window.addEventListener('online',()=>{check();connectSyncStream();});
  _checkTimer=setInterval(check,20000); check();
  window.addEventListener('beforeunload',()=>{if(_checkTimer)clearInterval(_checkTimer);try{_eventSource?.close();}catch(_){}},{once:true});
}
function connectSyncStream(){
  if(typeof window==='undefined'||typeof EventSource==='undefined')return;
  if(_eventSource&&_eventSource.readyState!==EventSource.CLOSED)return;
  try{
    _eventSource=new EventSource(`/api/sync/stream?v=${encodeURIComponent(_currentDataVersion||'0')}`);
    _eventSource.addEventListener('connected',e=>{try{const d=JSON.parse(e.data);if(d?.version){if(_currentDataVersion&&_currentDataVersion!==d.version)handleIncomingRealtimeEvent('DATA_VERSION_CHANGED',d,true);_currentDataVersion=d.version;}}catch(_){} });
    _eventSource.addEventListener('change',e=>{try{const d=JSON.parse(e.data);if(d?.version&&d.version!==_currentDataVersion){_currentDataVersion=d.version;handleIncomingRealtimeEvent(d.type||'DATA_VERSION_CHANGED',d,true);}}catch(_){} });
    _eventSource.onerror=()=>{try{_eventSource.close();}catch(_){} _eventSource=null;setTimeout(()=>{if(typeof document!=='undefined'&&document.visibilityState==='visible')connectSyncStream();},5000);};
  }catch(err){console.warn('[RealtimeSync] Stream connection warning:',err?.message||err);}
}
async function reconcileVersionDifference(){
  if(_isReconciling)return; _isReconciling=true;
  try{const r=await fetch('/api/sync/version',{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)return;const d=await r.json();const v=d?.version;if(v&&v!=='0'){if(_currentDataVersion&&_currentDataVersion!==v){_currentDataVersion=v;handleIncomingRealtimeEvent('DATA_VERSION_CHANGED',{version:v},true);}else _currentDataVersion=v;}}catch(_){}finally{_isReconciling=false;}
}
export function broadcastRealtimeChange(type,payload={}){if(typeof window==='undefined')return;if(_syncChannel){try{_syncChannel.postMessage({type,payload,timestamp:Date.now()});}catch(_){} } handleIncomingRealtimeEvent(type,payload,false);}
async function refreshHotPublicCache(){
  try{
    const db=await import('../core/db.js'),se=await import('./search-engine.service.js');
    db.clearDbCache('published_');db.clearDbCache('offers_');db.clearDbCache('ads_');
    const [places,cats]=await Promise.all([db.getPublishedPlaces({limit:200,forceFresh:true}).catch(()=>[]),db.getCategories().catch(()=>[])]);
    if(places?.length){try{localStorage.setItem('manzala_fast_places_cache',JSON.stringify(places.slice(0,150)));}catch(_){} se.warmupSearchEngine(places,cats||[]);}
    if(cats?.length){try{localStorage.setItem('manzala_fast_cats_cache',JSON.stringify(cats));}catch(_){} }
  }catch(_){}
}
function handleIncomingRealtimeEvent(type,payload,isRemote=false){
  if(!type)return;
  if('serviceWorker'in navigator&&navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage({type:'INVALIDATE_API_CACHE',payload:{timestamp:Date.now()}});
  if(type==='DATA_VERSION_CHANGED'||type==='NEW_PLACE'||type==='PLACE_UPDATED')refreshHotPublicCache();
  if(type==='NEW_LIVE_NEWS'){try{localStorage.removeItem('manzala_live_news_store_v3');}catch(_){} }
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('manzala:realtime_sync',{detail:{type,payload,isRemote,timestamp:Date.now()}}));
  if(isRemote){
    const p=payload?.place,n=payload?.news,isEn=String(document.documentElement.lang||'').toLowerCase().startsWith('en');
    if(type==='NEW_PLACE'&&p)showPwaNativeSystemNotification(isEn?'🎉 New business: '+p.name:'🎉 انضمام نشاط جديد: '+p.name,isEn?`${p.name} has joined the directory.`:`${p.name} من ${p.area||'المنزلة والمطرية'} انضم حديثاً للدليل`,'/place/'+encodeURIComponent(p.slug||p.id)+'/');
    else if(type==='PLACE_UPDATED'&&p?.isVerified)showPwaNativeSystemNotification(isEn?'👑 Profile verified: '+p.name:'👑 تم توثيق رسمي جديد: '+p.name,isEn?`${p.name} is now officially verified.`:`تم توثيق ${p.name} رسمياً بالعلامة الزرقاء`,'/place/'+encodeURIComponent(p.slug||p.id)+'/');
    else if(type==='NEW_LIVE_NEWS'&&n)showPwaNativeSystemNotification(isEn?'🔥 Live update: '+n.title:'🔥 تحديث حي: '+n.title,(n.location||'')+' — '+(n.details||(isEn?'New live update':'تحديث مباشر جديد')),'now.html');
  }
}
function showPwaNativeSystemNotification(title,body,url){if(typeof window==='undefined')return;playNotificationSound();if('serviceWorker'in navigator&&navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage({type:'SHOW_PWA_NOTIFICATION',payload:{title,message:body,url:url||'./',icon:'./icons/icon-192x192.png'}});else if('Notification'in window&&Notification.permission==='granted'){try{new Notification(title,{body,icon:'./icons/icon-192x192.png',dir:String(document.documentElement.dir||'rtl'),lang:String(document.documentElement.lang||'ar')});}catch(_){} }}
