/**
 * api.js — Unified Cloudflare Worker API Client
 * المعيارية: كل البيانات تمر من هنا → Worker → D1 / R2
 *
 * Architecture:
 *   Firebase Auth  → login + ID token only
 *   Firebase FCM   → push notifications only
 *   Worker + D1    → ALL data (users, places, categories, offers, products, settings, etc.)
 *   Worker + R2    → ALL files/images
 *
 * Usage:
 *   import { api } from './api.js';
 *   const places = await api.get('/api/places');
 *   const result = await api.post('/api/places/create', data, idToken);
 */

import { WORKER_URL } from './firebase.js';

// ── Internal fetch wrapper ─────────────────────────────────────────────────
async function _apiFetch(method, path, body = null, idToken = null, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
    ...(opts.headers || {})
  };

  const fetchOpts = {
    method,
    headers,
    signal: opts.signal || AbortSignal.timeout(opts.timeout || 10000),
  };

  if (body !== null && method !== 'GET' && method !== 'DELETE') {
    fetchOpts.body = JSON.stringify(body);
  }

  const res = await fetch(`${WORKER_URL}${path}`, fetchOpts);
  const data = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response' }));

  if (!res.ok && !data.success) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Public API ─────────────────────────────────────────────────────────────
export const api = {
  /**
   * GET /api/...
   * @param {string} path - e.g. '/api/places?slug=foo'
   * @param {string|null} idToken - Firebase ID token (optional)
   * @param {object} opts - { timeout, signal }
   */
  get: (path, idToken = null, opts = {}) =>
    _apiFetch('GET', path, null, idToken, opts),

  /**
   * POST /api/...
   * @param {string} path
   * @param {object} body
   * @param {string|null} idToken
   */
  post: (path, body = {}, idToken = null, opts = {}) =>
    _apiFetch('POST', path, body, idToken, opts),

  /**
   * PUT /api/...
   */
  put: (path, body = {}, idToken = null, opts = {}) =>
    _apiFetch('PUT', path, body, idToken, opts),

  /**
   * PATCH /api/...
   */
  patch: (path, body = {}, idToken = null, opts = {}) =>
    _apiFetch('PATCH', path, body, idToken, opts),

  /**
   * DELETE /api/...
   */
  delete: (path, idToken = null, opts = {}) =>
    _apiFetch('DELETE', path, null, idToken, opts),

  /**
   * Upload file to R2 via Worker
   * @param {File} file
   * @param {string} path - R2 path e.g. 'places/cover/place-slug.webp'
   * @param {string} idToken - Required for upload
   * @returns {{ url: string, key: string }}
   */
  upload: async (file, r2Path, idToken, onProgress = null) => {
    if (!idToken) throw new Error('ID token required for file upload');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', r2Path);

    const res = await fetch(`${WORKER_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}` },
      body: formData,
      signal: AbortSignal.timeout(60000)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Upload failed: HTTP ${res.status}`);
    return data;
  },

  /**
   * Raw fetch (for custom needs)
   */
  raw: (path, opts = {}) => fetch(`${WORKER_URL}${path}`, opts)
};

// ── Typed API Helpers (Semantic shortcuts) ─────────────────────────────────

/** Users */
export const usersApi = {
  /** POST /api/users/sync — sync Firebase user to D1, returns D1 profile */
  sync: (uid, name, email, photoURL, role, idToken) =>
    api.post('/api/users/sync', { uid, name, email, photoURL, role, status: 'active' }, idToken),

  /** GET /api/users/:uid — get single user from D1 */
  getById: (uid, idToken = null) =>
    api.get(`/api/users/${uid}`, idToken),

  /** GET /api/users — list all users (admin only) */
  list: (idToken) =>
    api.get('/api/users', idToken),

  /** PATCH /api/users/:uid — update user role/status */
  update: (uid, updates, idToken) =>
    api.patch(`/api/users/${uid}`, updates, idToken),

  /** GET /api/users/:uid/places — get places owned by user */
  getPlaces: (uid, idToken = null) =>
    api.get(`/api/places?owner_id=${encodeURIComponent(uid)}`, idToken),
};

/** Places */
export const placesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/api/places${qs ? '?' + qs : ''}`);
  },
  getBySlug: (slug) => api.get(`/api/places?slug=${encodeURIComponent(slug)}`),
  search: (q, category = '', area = '', limit = 20, offset = 0) =>
    api.get(`/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&area=${encodeURIComponent(area)}&limit=${limit}&offset=${offset}`),
  create: (data, idToken) => api.post('/api/places/create', data, idToken),
  update: (id, data, idToken) => api.put(`/api/places/${id}`, data, idToken),
  delete: (id, idToken) => api.delete(`/api/places/${id}`, idToken),
  verify: (id, idToken) => api.post(`/api/places/${id}/verify`, {}, idToken),
};

/** Categories */
export const categoriesApi = {
  list: () => api.get('/api/categories'),
  create: (data, idToken) => api.post('/api/categories', data, idToken),
  update: (id, data, idToken) => api.put(`/api/categories/${id}`, data, idToken),
  delete: (id, idToken) => api.delete(`/api/categories/${id}`, idToken),
};

/** Offers */
export const offersApi = {
  list: (placeId = null) => api.get(placeId ? `/api/offers?place_id=${placeId}` : '/api/offers'),
  create: (data, idToken) => api.post('/api/offers', data, idToken),
  update: (id, data, idToken) => api.put(`/api/offers/${id}`, data, idToken),
  delete: (id, idToken) => api.delete(`/api/offers/${id}`, idToken),
};

/** Products */
export const productsApi = {
  list: (placeId = null) => api.get(placeId ? `/api/products?place_id=${placeId}` : '/api/products'),
  create: (data, idToken) => api.post('/api/products', data, idToken),
  update: (id, data, idToken) => api.put(`/api/products/${id}`, data, idToken),
  delete: (id, idToken) => api.delete(`/api/products/${id}`, idToken),
};

/** Settings */
export const settingsApi = {
  get: () => api.get('/api/settings'),
  update: (key, value, idToken) => api.post('/api/settings', { key, value }, idToken),
};

/** AI */
export const aiApi = {
  search: (query, idToken = null) => api.post('/api/ai/search', { query }, idToken),
  translate: (text, idToken) => api.post('/api/ai/translate', { text }, idToken),
  suggest: (text, idToken = null) => api.post('/api/ai/suggestions', { text }, idToken),
};
