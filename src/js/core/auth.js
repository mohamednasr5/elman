/**
 * المنزلة وناسها — Authentication Module
 * Handles Google Sign-In, user profile management in RTDB
 */

import { getAuth, getDB } from './firebase.js';
import { appState } from './state.js';
import { emit } from './events.js';

let _authUnsubscribe = null;

/**
 * Initialize auth state listener.
 * Creates/updates user profile in RTDB on every sign-in.
 */
export function initAuth() {
  const auth = getAuth();

  _authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await syncUserProfile(firebaseUser);
        appState.set('user', profile);
        appState.set('authLoading', false);
        emit('auth:signedIn', profile);
      } catch (err) {
        console.error('[Auth] Failed to sync user profile:', err);
        appState.set('user', buildBasicProfile(firebaseUser));
        appState.set('authLoading', false);
        emit('auth:signedIn', appState.get('user'));
      }
    } else {
      appState.set('user', null);
      appState.set('authLoading', false);
      emit('auth:signedOut');
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
  await auth.signOut();
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

// ── Private helpers ──

/**
 * Sync user profile to Firebase RTDB
 * Creates new profile on first sign-in, updates lastLoginAt on subsequent
 */
async function syncUserProfile(firebaseUser) {
  const db = getDB();
  const uid = firebaseUser.uid;
  const userRef = db.ref(`users/${uid}`);

  const snapshot = await userRef.once('value');
  const now = firebase.database.ServerValue.TIMESTAMP;
  const userEmail = (firebaseUser.email || '').trim().toLowerCase();
  const isSuper = ADMIN_EMAILS.includes(userEmail);
  const defaultRole = isSuper ? 'superadmin' : 'user';

  if (!snapshot.exists()) {
    // New user — create full profile
    const profile = {
      uid,
      name: firebaseUser.displayName || 'مستخدم',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      createdAt: now,
      lastLoginAt: now,
      status: 'active',
      role: defaultRole,
      placeIds: {},
      metadata: {
        totalPlaces: 0,
        joinedFrom: 'web'
      }
    };

    await userRef.set(profile);
    return { ...profile, createdAt: Date.now(), lastLoginAt: Date.now() };
  } else {
    // Existing user — update lastLoginAt and elevate role if admin email
    const existing = snapshot.val();

    const updates = {
      lastLoginAt: now,
      name: firebaseUser.displayName || existing.name,
      photoURL: firebaseUser.photoURL || existing.photoURL,
    };

    if (isSuper && existing.role !== 'superadmin' && existing.role !== 'admin') {
      updates.role = 'superadmin';
    }

    // Check account status
    if (existing.status === 'suspended') {
      await getAuth().signOut();
      throw new Error('ACCOUNT_SUSPENDED');
    }

    await userRef.update(updates);
    return { ...existing, ...updates, role: updates.role || existing.role || defaultRole, lastLoginAt: Date.now() };
  }
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

/**
 * Cleanup auth listener
 */
export function destroyAuth() {
  if (_authUnsubscribe) {
    _authUnsubscribe();
    _authUnsubscribe = null;
  }
}
