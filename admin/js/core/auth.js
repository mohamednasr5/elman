/**
 * المنزلة وناسها — Admin Auth Module
 * Handles Firebase authentication specifically for the admin panel.
 */

import { hasPermission } from './permissions.js';

export const firebaseConfig = {
  apiKey: "AIzaSyCUGCecmvBdf6b38UVIM9zcxhbbux7VSzM",
  authDomain: "elmanzla-7402a.firebaseapp.com",
  projectId: "elmanzla-7402a",
  storageBucket: "elmanzla-7402a.firebasestorage.app",
  messagingSenderId: "252271215500",
  appId: "1:252271215500:web:adc234e58f4ba455fdcca9",
  measurementId: "G-EY6TEPLGSK"
};

let _auth = null;
let _currentAdmin = null;
let _authListeners = [];
let _isAuthReady = false;
let _authReadyPromise = null;

/**
 * Initialize Firebase Auth for the admin portal.
 */
export function initAdminAuth() {
  if (_authReadyPromise) return _authReadyPromise;

  _authReadyPromise = new Promise((resolve) => {
    const fb = (typeof window !== 'undefined' && window.firebase) ? window.firebase : null;
    if (!fb || typeof fb.initializeApp !== 'function') {
      console.error('[AdminAuth] Firebase SDK not found on window');
      _isAuthReady = true;
      resolve(null);
      return;
    }

    const app = (fb.apps && fb.apps.length > 0) ? fb.apps[0] : fb.initializeApp(firebaseConfig);
    _auth = fb.auth(app);

    _auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          // Fetch current admin profile/role from worker /api/admin/dashboard or session
          _currentAdmin = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            role: 'ADMIN' // Default to ADMIN while loading profile
          };
          
          // Check role from session cache or wait for first API call
          try {
            const cachedRole = sessionStorage.getItem(`admin_role_${user.uid}`);
            if (cachedRole) {
              _currentAdmin.role = cachedRole;
            }
          } catch (_) {}

        } catch (e) {
          console.error('[AdminAuth] Error fetching token:', e);
          _currentAdmin = null;
        }
      } else {
        _currentAdmin = null;
      }

      _isAuthReady = true;
      resolve(_currentAdmin);
      notifyListeners();
    });
  });

  return _authReadyPromise;
}

export async function waitForAuth() {
  if (_isAuthReady) return _currentAdmin;
  return initAdminAuth();
}

export function getCurrentAdmin() {
  return _currentAdmin;
}

export function setCurrentAdminRole(role) {
  if (_currentAdmin && role) {
    _currentAdmin.role = role.toUpperCase();
    try {
      sessionStorage.setItem(`admin_role_${_currentAdmin.uid}`, _currentAdmin.role);
    } catch (_) {}
    notifyListeners();
  }
}

export async function getAdminToken() {
  if (!_auth && typeof window !== 'undefined' && window.firebase) {
    initAdminAuth();
  }
  const user = _auth ? _auth.currentUser : null;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (err) {
    console.error('[AdminAuth] Failed to refresh token:', err);
    return null;
  }
}

export async function signInWithGoogle() {
  if (!_auth) initAdminAuth();
  if (!_auth) throw new Error('Firebase Auth not ready');
  const provider = new window.firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await _auth.signInWithPopup(provider);
  return result.user;
}

export async function signOutAdmin() {
  if (_auth) {
    await _auth.signOut();
  }
  _currentAdmin = null;
  sessionStorage.clear();
  notifyListeners();
}

export function onAdminAuthChange(callback) {
  _authListeners.push(callback);
  if (_isAuthReady) {
    try {
      callback(_currentAdmin);
    } catch (e) {
      console.error(e);
    }
  }
  return () => {
    _authListeners = _authListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners() {
  for (const listener of _authListeners) {
    try {
      listener(_currentAdmin);
    } catch (e) {
      console.error('[AdminAuth] Listener error:', e);
    }
  }
}

export function can(permission) {
  if (!_currentAdmin) return false;
  return hasPermission(_currentAdmin.role, permission);
}
