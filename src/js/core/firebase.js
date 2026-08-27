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

/**
 * Firebase initialization is done once in index.html via CDN scripts.
 * This module exports references to Firebase services.
 */

let _app = null;
let _auth = null;
let _db = null;

/**
 * Initialize Firebase (call once on app start)
 */
export function initFirebase() {
  if (_app) return { app: _app, auth: _auth, db: _db };

  // firebase is loaded globally from CDN
  _app = firebase.initializeApp(firebaseConfig);
  _auth = firebase.auth();
  _db = firebase.database();

  // Enable Analytics
  if (typeof firebase.analytics !== 'undefined') {
    try { firebase.analytics(); } catch(_) {}
  }

  return { app: _app, auth: _auth, db: _db };
}

export function getAuth() {
  if (!_auth) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return _auth;
}

export function getDB() {
  if (!_db) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return _db;
}

export function getApp() {
  if (!_app) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return _app;
}
