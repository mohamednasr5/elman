/**
 * المنزلة وناسها — Authentication Module
 *
 * Architecture (Final):
 *   Firebase Auth  → Google Sign-In + ID Token ONLY
 *   Firebase FCM   → Push Notifications ONLY
 *   Turso          → User profiles, roles, placeIds (via Worker)
 *   NO Firebase Realtime Database usage whatsoever
 */

import { getAuth, WORKER_URL } from './firebase.js';
import { appState } from './state.js';
import { emit } from './events.js';

let _authUnsubscribe = null;

// ── Persistent Cache Key ───────────────────────────────────────────────────
const PERSISTENT_USER_KEY = 'manzala_persistent_user';

/**
 * Get initial cached user synchronously from localStorage (0ms instant session)
 */
function getInitialCachedUser() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(PERSISTENT_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.uid) return user;
    }
  } catch (_) {}
  return null;
}

// Pre-populate appState with cached user immediately on module evaluation
const _initialCachedUser = getInitialCachedUser();
if (_initialCachedUser) {
  appState.set('user', _initialCachedUser);
  appState.set('authLoading', false);
}

// ── Admin Emails ───────────────────────────────────────────────────────────
export const ADMIN_EMAILS = [
  'elfannanm@gmail.com',
  'mohamednasrofficial@gmail.com'
];

// ── initAuth ───────────────────────────────────────────────────────────────
/**
 * Initialize auth state listener.
 * On sign-in: syncs user to Turso and fetches full Turso profile (role, placeIds).
 */
export function initAuth() {
  const auth = getAuth();
  if (!auth) {
    // Firebase is optional for public pages; Auth is used only for login/notifications.
    appState.set('authLoading', false);
    return null;
  }

  // Set local persistence
  try {
    if (firebase?.auth?.Auth?.Persistence?.LOCAL) {
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
    }
  } catch (_) {}

  _authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Sync to Turso and get full profile back
        const profile = await _syncUserToD1(firebaseUser);
        appState.set('user', profile);
        appState.set('authLoading', false);
        try { localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(profile)); } catch (_) {}
        emit('auth:signedIn', profile);
      } catch (err) {
        console.error('[Auth] Turso sync failed, using Firebase profile:', err);
        const basic = _buildBasicProfile(firebaseUser);
        appState.set('user', basic);
        appState.set('authLoading', false);
        try { localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(basic)); } catch (_) {}
        emit('auth:signedIn', basic);
      }
    } else {
      const currentStored = getInitialCachedUser();
      if (!currentStored) {
        appState.set('user', null);
        appState.set('authLoading', false);
        emit('auth:signedOut');
      } else {
        setTimeout(() => {
          if (!auth.currentUser) {
            localStorage.removeItem(PERSISTENT_USER_KEY);
            appState.set('user', null);
            appState.set('authLoading', false);
            emit('auth:signedOut');
          }
        }, 1500);
      }
    }
  });
}

// ── Sign In/Out ────────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const auth = getAuth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return null;
    throw err;
  }
}

export async function signOut() {
  const auth = getAuth();
  try {
    localStorage.removeItem(PERSISTENT_USER_KEY);
    localStorage.removeItem('manzala_user');
  } catch (_) {}
  appState.set('user', null);
  await auth.signOut();
  emit('auth:signedOut');
}

// ── Token ──────────────────────────────────────────────────────────────────
/**
 * Get Firebase ID Token (for Worker API authorization)
 */
export async function getIdToken(forceRefresh = false) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

// ── Current User ───────────────────────────────────────────────────────────
export function getCurrentUser() {
  return appState.get('user');
}

export function isAdmin(user = null) {
  const u = user || getCurrentUser();
  if (!u) return false;
  const email = (u.email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(email) || u.role === 'admin' || u.role === 'superadmin';
}

export function isSuperAdmin(user = null) {
  const u = user || getCurrentUser();
  if (!u) return false;
  const email = (u.email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(email) || u.role === 'superadmin';
}

// ── waitForAuth ────────────────────────────────────────────────────────────
export function waitForAuth() {
  return new Promise((resolve) => {
    const cached = appState.get('user') || getInitialCachedUser();
    if (cached) return resolve(cached);
    if (!appState.get('authLoading')) return resolve(appState.get('user'));

    let resolved = false;
    const finish = (val) => {
      if (resolved) return;
      resolved = true;
      try { unsub(); } catch (_) {}
      resolve(val);
    };

    const unsub = appState.subscribe('authLoading', (loading) => {
      if (!loading) finish(appState.get('user'));
    });

    setTimeout(() => {
      if (!resolved) {
        try {
          const fbUser = getAuth()?.currentUser;
          finish(fbUser ? _buildBasicProfile(fbUser) : appState.get('user'));
        } catch (_) { finish(appState.get('user')); }
      }
    }, 5000);
  });
}

// ── onAuthStateChange ──────────────────────────────────────────────────────
export function onAuthStateChange(callback) {
  if (!appState.get('authLoading')) callback(appState.get('user'));
  return appState.subscribe('user', (user) => callback(user));
}

// ── Client IP ──────────────────────────────────────────────────────────────
let _cachedClientIp = null;
export async function getClientIp() {
  if (_cachedClientIp) return _cachedClientIp;
  try {
    const stored = sessionStorage.getItem('client_ip');
    if (stored) { _cachedClientIp = stored; return stored; }
  } catch (_) {}
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) {
        _cachedClientIp = String(data.ip).trim();
        try { sessionStorage.setItem('client_ip', _cachedClientIp); } catch (_) {}
        return _cachedClientIp;
      }
    }
  } catch (_) {}
  return null;
}

// ── D1 User Sync (Core) ────────────────────────────────────────────────────
/**
 * Sync Firebase user → D1 users table, then fetch full D1 profile.
 * D1 is the source of truth for role, placeIds, status, etc.
 * Firebase Auth is used ONLY for identity (uid, name, email, photoURL).
 *
 * @param {firebase.User} firebaseUser
 * @returns {Promise<UserProfile>}
 */
async function _syncUserToD1(firebaseUser) {
  const uid = firebaseUser.uid;
  const email = (firebaseUser.email || '').trim().toLowerCase();
  const name = firebaseUser.displayName || 'مستخدم';
  const photoURL = firebaseUser.photoURL || '';
  const isSuper = ADMIN_EMAILS.includes(email);

  const token = await firebaseUser.getIdToken(true);
  const syncRes = await fetch(`${WORKER_URL}/api/users/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ uid, name, email, photoURL, role: isSuper ? 'superadmin' : 'user', status: 'active' }),
    signal: AbortSignal.timeout(8000)
  });

  const syncData = await syncRes.json().catch(() => ({}));
  if (!syncRes.ok || !syncData?.success) {
    throw new Error(syncData?.error || `User sync HTTP ${syncRes.status}`);
  }

  const d1Profile = syncData.data || syncData.user || {};
  return {
    uid,
    name: d1Profile.name || name,
    email: d1Profile.email || firebaseUser.email || '',
    photoURL: d1Profile.photo_url || d1Profile.photoURL || photoURL,
    role: d1Profile.role || (isSuper ? 'superadmin' : 'user'),
    status: d1Profile.status || 'active',
    phone: d1Profile.phone || null,
    createdAt: d1Profile.created_at || Date.now(),
    lastLoginAt: Date.now()
  };
}

/**
 * Build minimal profile from Firebase user alone (fallback when D1 fails)
 */
function _buildBasicProfile(firebaseUser) {
  const email = (firebaseUser.email || '').trim().toLowerCase();
  const isSuper = ADMIN_EMAILS.includes(email);
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || 'مستخدم',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    role: isSuper ? 'superadmin' : 'user',
    status: 'active',
    phone: null,
  };
}

// ── Cleanup ────────────────────────────────────────────────────────────────
export function destroyAuth() {
  if (_authUnsubscribe) {
    _authUnsubscribe();
    _authUnsubscribe = null;
  }
}
