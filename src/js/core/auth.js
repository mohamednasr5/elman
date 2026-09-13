/**
 * المنزلة وناسها — Authentication Module
 *
 * Architecture (Final):
 *   Firebase Auth  → Google Sign-In + ID Token ONLY
 *   Firebase FCM   → Push Notifications ONLY
 *   Turso          → User profiles, roles, placeIds (via Worker)
 *   NO Firebase Realtime Database usage whatsoever
 */

import { getAuth, WORKER_URL, ensureFirebaseReady } from './firebase.js';
import { appState } from './state.js';
import { emit } from './events.js';

let _authUnsubscribe = null;
const PERSISTENT_USER_KEY = 'manzala_persistent_user';

function getInitialCachedUser() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try { const raw = localStorage.getItem(PERSISTENT_USER_KEY); if (raw) { const user = JSON.parse(raw); if (user && user.uid) return user; } } catch (_) {}
  return null;
}

const _initialCachedUser = getInitialCachedUser();
if (_initialCachedUser) { appState.set('user', _initialCachedUser); appState.set('authLoading', false); }

export const ADMIN_EMAILS = ['elfannanm@gmail.com','mohamednasrofficial@gmail.com'];

export function initAuth() {
  const auth = getAuth();
  if (!auth) { appState.set('authLoading', false); return null; }
  try {
    const fb = typeof window !== 'undefined' ? window.firebase : null;
    if (fb?.auth?.setPersistence && fb?.auth?.Auth?.Persistence?.LOCAL) auth.setPersistence(fb.auth.Auth.Persistence.LOCAL).catch(() => {});
  } catch (_) {}
  _authUnsubscribe?.();
  _authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await _syncUserToTurso(firebaseUser);
        appState.set('user', profile); appState.set('authLoading', false);
        try { localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(profile)); } catch (_) {}
        emit('auth:signedIn', profile);
      } catch (err) {
        console.error('[Auth] Turso sync failed, using Firebase profile:', err);
        const basic = _buildBasicProfile(firebaseUser);
        appState.set('user', basic); appState.set('authLoading', false);
        try { localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(basic)); } catch (_) {}
        emit('auth:signedIn', basic);
      }
    } else {
      const currentStored = getInitialCachedUser();
      if (!currentStored) { appState.set('user', null); appState.set('authLoading', false); emit('auth:signedOut'); }
      else setTimeout(() => { if (!auth.currentUser) { localStorage.removeItem(PERSISTENT_USER_KEY); appState.set('user', null); appState.set('authLoading', false); emit('auth:signedOut'); } }, 1500);
    }
  });
  return _authUnsubscribe;
}

export async function signInWithGoogle() {
  const ready = await ensureFirebaseReady(8000);
  const auth = ready?.auth || getAuth();
  const fb = typeof window !== 'undefined' ? window.firebase : null;
  if (!auth || !fb?.auth?.GoogleAuthProvider) {
    const err = new Error('Google sign-in is temporarily unavailable because Firebase Authentication could not be initialized.');
    err.code = 'auth/not-initialized';
    throw err;
  }
  const provider = new fb.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (err) {
    if (err?.code === 'auth/popup-closed-by-user') return null;
    throw err;
  }
}

export async function signOut() {
  const auth = getAuth();
  try { localStorage.removeItem(PERSISTENT_USER_KEY); localStorage.removeItem('manzala_user'); } catch (_) {}
  appState.set('user', null);
  if (auth) await auth.signOut();
  emit('auth:signedOut');
}

export async function getIdToken(forceRefresh = false) { const auth = getAuth(); const user = auth?.currentUser; if (!user) return null; return user.getIdToken(forceRefresh); }
export function getCurrentUser() { return appState.get('user'); }
export function isAdmin(user = null) { const u=user||getCurrentUser(); if(!u)return false; const email=(u.email||'').trim().toLowerCase(); return ADMIN_EMAILS.includes(email)||u.role==='admin'||u.role==='superadmin'; }
export function isSuperAdmin(user = null) { const u=user||getCurrentUser(); if(!u)return false; const email=(u.email||'').trim().toLowerCase(); return ADMIN_EMAILS.includes(email)||u.role==='superadmin'; }

export function waitForAuth() {
  return new Promise((resolve) => {
    const cached = appState.get('user') || getInitialCachedUser();
    if (cached) return resolve(cached);
    if (!appState.get('authLoading')) return resolve(appState.get('user'));
    let resolved=false;
    const finish=(val)=>{if(resolved)return;resolved=true;try{unsub();}catch(_){}resolve(val);};
    const unsub=appState.subscribe('authLoading',(loading)=>{if(!loading)finish(appState.get('user'));});
    setTimeout(()=>{if(!resolved){try{const fbUser=getAuth()?.currentUser;finish(fbUser?_buildBasicProfile(fbUser):appState.get('user'));}catch(_){finish(appState.get('user'));}}},5000);
  });
}
export function onAuthStateChange(callback) { if(!appState.get('authLoading'))callback(appState.get('user')); return appState.subscribe('user',(user)=>callback(user)); }

let _cachedClientIp=null;
export async function getClientIp() {
  if(_cachedClientIp)return _cachedClientIp;
  try{const stored=sessionStorage.getItem('client_ip');if(stored){_cachedClientIp=stored;return stored;}}catch(_){ }
  try{const res=await fetch('https://api.ipify.org?format=json',{signal:AbortSignal.timeout(3000)});if(res.ok){const data=await res.json();if(data?.ip){_cachedClientIp=String(data.ip).trim();try{sessionStorage.setItem('client_ip',_cachedClientIp);}catch(_){}return _cachedClientIp;}}}catch(_){ }
  return null;
}

async function _syncUserToTurso(firebaseUser) {
  const uid=firebaseUser.uid, email=(firebaseUser.email||'').trim().toLowerCase(), name=firebaseUser.displayName||'مستخدم', photoURL=firebaseUser.photoURL||'', isSuper=ADMIN_EMAILS.includes(email);
  const token=await firebaseUser.getIdToken(true);
  const syncRes=await fetch(`${WORKER_URL}/api/users/sync`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({uid,name,email,photoURL,role:isSuper?'superadmin':'user',status:'active'}),signal:AbortSignal.timeout(8000),mode:'cors',cache:'no-store'});
  const syncData=await syncRes.json().catch(()=>({}));
  if(!syncRes.ok||!syncData?.success)throw new Error(syncData?.error||`User sync HTTP ${syncRes.status}`);
  const tursoProfile=syncData.data||syncData.user||{};
  return {uid,name:tursoProfile.name||name,email:tursoProfile.email||firebaseUser.email||'',photoURL:tursoProfile.photo_url||tursoProfile.photoURL||photoURL,role:tursoProfile.role||(isSuper?'superadmin':'user'),status:tursoProfile.status||'active',phone:tursoProfile.phone||null,createdAt:tursoProfile.created_at||Date.now(),lastLoginAt:Date.now()};
}
function _buildBasicProfile(firebaseUser){const email=(firebaseUser.email||'').trim().toLowerCase(),isSuper=ADMIN_EMAILS.includes(email);return{uid:firebaseUser.uid,name:firebaseUser.displayName||'مستخدم',email:firebaseUser.email||'',photoURL:firebaseUser.photoURL||'',role:isSuper?'superadmin':'user',status:'active',phone:null};}
export function destroyAuth(){if(_authUnsubscribe){_authUnsubscribe();_authUnsubscribe=null;}}
