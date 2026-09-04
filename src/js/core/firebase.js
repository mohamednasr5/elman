/**
 * المنزلة وناسها — Firebase Core Initialization
 * Uses Firebase 9+ compat SDK via CDN for simplicity without bundler
 */

// Firebase configuration — loaded from settings or hardcoded for init
export const firebaseConfig = {
  apiKey: "AIzaSyBK0c6d7sCOqdj3ZikvVqz7qKy_lzJP3p0",
  authDomain: "elmanzla.firebaseapp.com",
  databaseURL: "https://elmanzla-default-rtdb.firebaseio.com",
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

/**
 * Firebase initialization is done once in index.html via CDN scripts.
 * This module exports references to Firebase services.
 */

let _app = null;
let _auth = null;
let _db = null;

/**
 * Initialize Firebase (safely handles CDN script loading delay)
 */
export function initFirebase() {
  if (_app && _db && _auth) return { app: _app, auth: _auth, db: _db };

  const fb = (typeof window !== 'undefined' && window.firebase) 
    ? window.firebase 
    : (typeof firebase !== 'undefined' ? firebase : null);

  if (!fb || typeof fb.initializeApp !== 'function') {
    return null;
  }

  try {
    _app = (fb.apps && fb.apps.length > 0) ? fb.apps[0] : fb.initializeApp(firebaseConfig);
    _auth = fb.auth();
    _db = fb.database();

    // Enable Analytics
    if (typeof fb.analytics !== 'undefined') {
      try { fb.analytics(); } catch(_) {}
    }
  } catch (err) {
    console.warn('[initFirebase] Warning:', err);
  }

  return { app: _app, auth: _auth, db: _db };
}

/**
 * Ensures Firebase is loaded and ready before queries run
 */
export async function ensureFirebaseReady(timeoutMs = 5000) {
  if (_app && _db && _auth) return { app: _app, auth: _auth, db: _db };

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = initFirebase();
    if (ready && ready.db) return ready;
    await new Promise(r => setTimeout(r, 40));
  }

  return initFirebase();
}

export function getAuth() {
  if (!_auth) {
    initFirebase();
  }
  if (!_auth) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return _auth;
}

export function getDB() {
  if (!_db) {
    initFirebase();
  }
  if (!_db) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return _db;
}

export function getApp() {
  if (!_app) {
    initFirebase();
  }
  if (!_app) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return _app;
}
