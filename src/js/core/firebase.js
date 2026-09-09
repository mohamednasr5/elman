/**
 * المنزلة وناسها — Firebase Core Initialization
 * Architecture: Turso + R2 + Worker (Primary Backend & DB)
 * Firebase Auth is used for user authentication and tokens.
 * Firebase Cloud Messaging (FCM) is used for Web Push notifications.
 * Firebase Realtime Database is completely deprecated and removed.
 */

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCUGCecmvBdf6b38UVIM9zcxhbbux7VSzM",
  authDomain: "elmanzla-7402a.firebaseapp.com",
  projectId: "elmanzla-7402a",
  storageBucket: "elmanzla-7402a.firebasestorage.app",
  messagingSenderId: "252271215500",
  appId: "1:252271215500:web:adc234e58f4ba455fdcca9",
  measurementId: "G-EY6TEPLGSK"
};

// Cloudflare Worker base URL
export const WORKER_URL = '';

// R2 Public CDN base URL
export const R2_PUBLIC_URL = 'https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev';

// Web Push VAPID Key Pair
export const FCM_VAPID_KEY = 'BEm1Vn_Ol2QKgHvU91MMprcgs3uMjp36fJrO591d0PCzn_lZ0ITSwSwYVzDSgEed5V2HFvN8fiy8DMOTLR8BuE8';

let _app = null;
let _auth = null;

/** Firebase Auth/FCM only. No Firebase database client is initialized. */
/**
 * Initialize Firebase Auth and Analytics (No RTDB)
 */
export function initFirebase() {
  if (_app && _auth) return { app: _app, auth: _auth, db: null };

  const fb = (typeof window !== 'undefined' && window.firebase) 
    ? window.firebase 
    : (typeof firebase !== 'undefined' ? firebase : null);

    if (!fb || typeof fb.initializeApp !== 'function') {
    return null;
  }

  try {
    _app = (fb.apps && fb.apps.length > 0) ? fb.apps[0] : fb.initializeApp(firebaseConfig);
    if (typeof fb.auth === 'function') {
      _auth = fb.auth();
    }

    // Enable Analytics if available
    if (typeof fb.analytics === 'function') {
      try { fb.analytics(); } catch(_) {}
    }
  } catch (err) {
    console.warn('[initFirebase] Warning:', err);
  }

  return { app: _app, auth: _auth, db: null };
}

let _firebaseLoadPromise = null;

export function loadFirebaseSDK() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.firebase && window.firebase.initializeApp) return Promise.resolve(window.firebase);
  if (_firebaseLoadPromise) return _firebaseLoadPromise;

  _firebaseLoadPromise = new Promise((resolve) => {
    const scripts = [
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js'
    ];
    const loadNext = (idx) => {
      if (idx >= scripts.length) {
        resolve(window.firebase || null);
        return;
      }
      const s = document.createElement('script');
      s.src = scripts[idx];
      s.async = true;
      s.onload = () => loadNext(idx + 1);
      s.onerror = () => loadNext(idx + 1);
      document.head.appendChild(s);
    };
    loadNext(0);
  });
  return _firebaseLoadPromise;
}

/**
 * Ensures Firebase is loaded and ready (lazy-loads SDK if not present)
 */
export async function ensureFirebaseReady(timeoutMs = 6000) {
  if (_app && _auth) return { app: _app, auth: _auth, db: null };

  const fb = typeof window !== 'undefined' ? window.firebase : null;
  if (!fb || !fb.initializeApp) {
    await loadFirebaseSDK();
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = initFirebase();
    if (ready && ready.auth) return ready;
    await new Promise(r => setTimeout(r, 40));
  }

  return initFirebase();
}

export function getAuth() {
  if (!_auth) {
    initFirebase();
  }
  if (!_auth) {
    const fb = typeof window !== 'undefined' ? window.firebase : null;
    if (fb && typeof fb.auth === 'function') {
      _auth = fb.auth();
      return _auth;
    }
    console.debug('[getAuth] Firebase auth not ready yet');
    return null;
  }
  return _auth;
}


export function getApp() {
  if (!_app) {
    initFirebase();
  }
  return _app;
}
