/**
 * المنزلة وناسها — Firebase Core Initialization
 * Architecture: Cloudflare D1 + R2 + Worker (Primary Backend & DB)
 * Firebase Auth is used for user authentication and tokens.
 * Firebase Cloud Messaging (FCM) is used for Web Push notifications.
 * Firebase Realtime Database is completely deprecated and removed.
 */

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBK0c6d7sCOqdj3ZikvVqz7qKy_lzJP3p0",
  authDomain: "elmanzla.firebaseapp.com",
  projectId: "elmanzla",
  storageBucket: "elmanzla.firebasestorage.app",
  messagingSenderId: "230168369208",
  appId: "1:230168369208:web:84175973e7838d07ddeecd",
  measurementId: "G-JD2LSTR2G1"
};

// Cloudflare Worker base URL
export const WORKER_URL = 'https://elmanzala.nonm1724.workers.dev';

// R2 Public CDN base URL
export const R2_PUBLIC_URL = 'https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev';

// Web Push VAPID Key Pair
export const FCM_VAPID_KEY = 'BGysPV54ekHXamWK9ZZ_dkoW2PgeGjQbniLME3oEY277KzX4KlgjPWVwdvz_e5eZosozZjk9GjdvhzWRE1R4yxQ';

let _app = null;
let _auth = null;

// Safe dummy DB stub to prevent legacy references from crashing
const _dummySnap = {
  exists: () => false,
  val: () => null,
  forEach: () => {},
  numChildren: () => 0,
  key: null
};

const _dummyRef = {
  once: async () => _dummySnap,
  on: () => {},
  off: () => {},
  set: async () => {},
  update: async () => {},
  remove: async () => {},
  push: (data) => ({ key: 'd1_' + Date.now(), then: (fn) => Promise.resolve(fn ? fn() : null) }),
  transaction: async (fn) => ({ committed: true, snapshot: _dummySnap }),
  orderByChild: function() { return this; },
  equalTo: function() { return this; },
  limitToLast: function() { return this; },
  limitToFirst: function() { return this; },
  startAt: function() { return this; },
  endAt: function() { return this; }
};

const _dummyDb = {
  ref: (path) => _dummyRef
};

// Global polyfill so NO legacy script or cached file ever throws on database or ServerValue
function _applyServerValuePolyfill() {
  if (typeof window === 'undefined') return;
  const dummyServerValue = { TIMESTAMP: Date.now() };
  
  window.firebase = window.firebase || {};
  if (!window.firebase.database) {
    const _dbFn = function() { return _dummyDb; };
    _dbFn.ServerValue = dummyServerValue;
    window.firebase.database = _dbFn;
  } else {
    try {
      window.firebase.database.ServerValue = window.firebase.database.ServerValue || dummyServerValue;
    } catch (_) {}
  }

  // Also bind to window.ServerValue directly if a legacy script references it naked
  window.ServerValue = window.ServerValue || dummyServerValue;

  // Also guard globalThis
  if (typeof globalThis !== 'undefined') {
    globalThis.ServerValue = globalThis.ServerValue || dummyServerValue;
    if (globalThis.firebase) {
      if (!globalThis.firebase.database) {
        globalThis.firebase.database = window.firebase.database;
      } else {
        try {
          globalThis.firebase.database.ServerValue = globalThis.firebase.database.ServerValue || dummyServerValue;
        } catch (_) {}
      }
    }
  }
}

_applyServerValuePolyfill();

/**
 * Initialize Firebase Auth and Analytics (No RTDB)
 */
export function initFirebase() {
  if (_app && _auth) return { app: _app, auth: _auth, db: _dummyDb };

  const fb = (typeof window !== 'undefined' && window.firebase) 
    ? window.firebase 
    : (typeof firebase !== 'undefined' ? firebase : null);

  _applyServerValuePolyfill();

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

  return { app: _app, auth: _auth, db: _dummyDb };
}

/**
 * Ensures Firebase is loaded and ready
 */
export async function ensureFirebaseReady(timeoutMs = 5000) {
  if (_app && _auth) return { app: _app, auth: _auth, db: _dummyDb };

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
    console.warn('[getAuth] Firebase auth not ready yet');
    return null;
  }
  return _auth;
}

export function getDB() {
  return _dummyDb;
}

export function getApp() {
  if (!_app) {
    initFirebase();
  }
  return _app;
}
