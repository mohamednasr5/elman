/**
 * المنزلة وناسها — Authentication Module
 * Handles Google Sign-In, user profile management in RTDB
 */

import { getAuth, getDB, WORKER_URL } from './firebase.js';
import { appState } from './state.js';
import { emit } from './events.js';

let _authUnsubscribe = null;

/**
 * Initialize auth state listener.
 * Creates/updates user profile in RTDB on every sign-in.
 */
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

/**
 * Initialize auth state listener with strict LOCAL persistence and zero-flicker session.
 */
export function initAuth() {
  const auth = getAuth();

  // 1. Set explicit local persistence so Firebase never drops session across tabs/PWA/restarts
  try {
    if (firebase?.auth?.Auth?.Persistence?.LOCAL) {
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => {
        console.debug('[Auth] Persistence set warning:', err);
      });
    }
  } catch (_) {}

  // 2. Auth state change listener
  _authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await syncUserProfile(firebaseUser);
        appState.set('user', profile);
        appState.set('authLoading', false);
        try {
          localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(profile));
        } catch (_) {}
        setupUserPresence(firebaseUser.uid);
        emit('auth:signedIn', profile);
      } catch (err) {
        console.error('[Auth] Failed to sync user profile:', err);
        const basic = buildBasicProfile(firebaseUser);
        appState.set('user', basic);
        appState.set('authLoading', false);
        try {
          localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(basic));
        } catch (_) {}
        setupUserPresence(firebaseUser.uid);
        emit('auth:signedIn', basic);
      }
    } else {
      // Only clear user if Firebase explicitly says no user AND we are not mid-login
      const currentStored = getInitialCachedUser();
      if (!currentStored) {
        appState.set('user', null);
        appState.set('authLoading', false);
        cleanupUserPresence();
        emit('auth:signedOut');
      } else {
        // Fallback grace check: wait a moment in case Firebase was still initializing
        setTimeout(() => {
          if (!auth.currentUser) {
            localStorage.removeItem(PERSISTENT_USER_KEY);
            appState.set('user', null);
            appState.set('authLoading', false);
            cleanupUserPresence();
            emit('auth:signedOut');
          }
        }, 1500);
      }
    }
  });
}

/**
 * Sign in with Google popup
 */
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

/**
 * Sign out
 */
export async function signOut() {
  const auth = getAuth();
  try {
    localStorage.removeItem(PERSISTENT_USER_KEY);
    localStorage.removeItem('manzala_user');
  } catch (_) {}
  appState.set('user', null);
  cleanupUserPresence();
  await auth.signOut();
  emit('auth:signedOut');
}

/**
 * Get current Firebase ID Token (for worker requests)
 */
export async function getIdToken(forceRefresh = false) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

/**
 * Get current user (sync)
 */
export function getCurrentUser() {
  return appState.get('user');
}

// ── Authorized Admin Emails ──
export const ADMIN_EMAILS = [
  'elfannanm@gmail.com',
  'mohamednasrofficial@gmail.com'
];

/**
 * Check if user is admin or superadmin
 */
export function isAdmin(user = null) {
  const u = user || getCurrentUser();
  if (!u) return false;
  const email = (u.email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(email) || u.role === 'admin' || u.role === 'superadmin';
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(user = null) {
  const u = user || getCurrentUser();
  if (!u) return false;
  const email = (u.email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(email) || u.role === 'superadmin';
}

/**
 * Wait for auth to be ready (returns Promise)
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    const cached = appState.get('user') || getInitialCachedUser();
    if (cached) {
      return resolve(cached);
    }
    if (!appState.get('authLoading')) {
      return resolve(appState.get('user'));
    }
    
    let resolved = false;
    const finish = (val) => {
      if (resolved) return;
      resolved = true;
      try { unsub(); } catch (e) {}
      resolve(val);
    };

    const unsub = appState.subscribe('authLoading', (loading) => {
      if (!loading) {
        finish(appState.get('user'));
      }
    });

    // Fallback timer
    setTimeout(() => {
      if (!resolved) {
        try {
          const auth = getAuth();
          const fbUser = auth?.currentUser;
          if (fbUser) {
            const profile = buildBasicProfile(fbUser);
            finish(profile);
          } else {
            finish(appState.get('user'));
          }
        } catch (err) {
          finish(appState.get('user'));
        }
      }
    }, 5000);
  });
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  // If not loading anymore, call immediately
  if (!appState.get('authLoading')) {
    callback(appState.get('user'));
  }
  return appState.subscribe('user', (user) => {
    callback(user);
  });
}

let _cachedClientIp = null;
export async function getClientIp() {
  if (_cachedClientIp) return _cachedClientIp;
  try {
    const stored = sessionStorage.getItem('client_ip');
    if (stored) {
      _cachedClientIp = stored;
      return stored;
    }
  } catch (_) {}

  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        _cachedClientIp = String(data.ip).trim();
        try { sessionStorage.setItem('client_ip', _cachedClientIp); } catch (_) {}
        return _cachedClientIp;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Sync user profile (Local + Auth token based, No RTDB dependency)
 */
async function syncUserProfile(firebaseUser) {
  const uid = firebaseUser.uid;
  const userEmail = (firebaseUser.email || '').trim().toLowerCase();
  const isSuper = ADMIN_EMAILS.includes(userEmail);
  const defaultRole = isSuper ? 'superadmin' : 'user';
  const ip = await getClientIp();

  const profile = {
    uid,
    name: firebaseUser.displayName || 'مستخدم',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    registrationIp: ip || null,
    lastIp: ip || null,
    status: 'active',
    role: defaultRole,
    placeIds: {}
  };

  // Sync user profile to Cloudflare D1
  try {
    fetch(`${WORKER_URL}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        name: profile.name,
        email: profile.email,
        photoURL: profile.photoURL,
        role: profile.role,
        status: profile.status
      })
    }).catch(() => {});
  } catch (_) {}

  return profile;
}

/**
 * Build minimal profile from Firebase user (fallback)
 */
function buildBasicProfile(firebaseUser) {
  const userEmail = (firebaseUser.email || '').trim().toLowerCase();
  const isSuper = ADMIN_EMAILS.includes(userEmail);

  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || 'مستخدم',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    role: isSuper ? 'superadmin' : 'user',
    status: 'active',
    placeIds: {}
  };
}

let _currentPresenceUid = null;

function setupUserPresence(uid) {
  _currentPresenceUid = uid;
}

function cleanupUserPresence() {
  _currentPresenceUid = null;
}

/**
 * Cleanup auth listener
 */
export function destroyAuth() {
  if (_authUnsubscribe) {
    _authUnsubscribe();
    _authUnsubscribe = null;
  }
  cleanupUserPresence();
}

