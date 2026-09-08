/**
 * المنزلة وناسها — Admin API Client
 * Strict production-grade HTTP client for /api/admin/* endpoints.
 * Never defaults errors or failed queries to 0 or empty lists.
 */

import { getAdminToken } from './auth.js';

// Base worker URL
export const API_BASE = 'https://elmanzala.nonm1724.workers.dev';

export class AdminApiError extends Error {
  constructor(message, status = 0, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Perform an authenticated request to the Admin API.
 * @param {string} endpoint - Path such as '/api/admin/dashboard' or query params
 * @param {RequestInit} [options={}]
 * @returns {Promise<any>} Response JSON data
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const token = await getAdminToken();
  if (!token) {
    throw new AdminApiError('جلسة تسجيل الدخول غير متوفرة أو منتهية', 401, 'UNAUTHORIZED');
  }

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 20000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let json = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      json = await res.json();
    } else {
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch (_) {
        json = { message: text };
      }
    }

    if (!res.ok) {
      const errMsg = json?.error?.message || json?.message || `فشل الطلب مع الرمز ${res.status}`;
      const errCode = json?.error?.code || `HTTP_${res.status}`;
      throw new AdminApiError(errMsg, res.status, errCode, json?.error?.details || null);
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof AdminApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new AdminApiError('انتهت مهلة انتظار الخادم (Timeout). يرجى المحاولة ثانية.', 408, 'TIMEOUT');
    }

    throw new AdminApiError(
      err.message || 'تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت',
      0,
      'NETWORK_ERROR'
    );
  }
}

// HTTP helpers
export const api = {
  get: (endpoint, params = null) => {
    let url = endpoint;
    if (params) {
      const q = new URLSearchParams();
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
          q.append(key, String(val));
        }
      }
      const qs = q.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return apiRequest(url, { method: 'GET' });
  },

  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body }),
  delete: (endpoint, body = null) => apiRequest(endpoint, { method: 'DELETE', ...(body ? { body } : {}) })
};
