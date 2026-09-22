/*
 * المنزلة وناسها — Upload Service
 * Resilient image optimization + R2 upload with auth refresh, timeout and retries.
 */

import { WORKER_URL, R2_PUBLIC_URL } from '../core/firebase.js';
import { getIdToken, getCurrentUser } from '../core/auth.js';

const MAX_INPUT_SIZE = 15 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 9 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'];
const UPLOAD_ATTEMPTS = 3;
const UPLOAD_TIMEOUT_MS = 45000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getFreshToken(forceRefresh = false) {
  const user = getCurrentUser?.();
  if (user?.getIdToken) {
    try {
      const token = await user.getIdToken(Boolean(forceRefresh));
      if (token) return token;
    } catch (_) {}
  }
  try { return await getIdToken(Boolean(forceRefresh)); } catch (_) {}
  try { return await getIdToken(); } catch (_) { return ''; }
}

async function uploadOnce(url, fileToUpload, filename, key, folder, token) {
  const formData = new FormData();
  formData.append('file', fileToUpload, filename);
  formData.append('key', key);
  formData.append('path', key);
  formData.append('folder', folder);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: formData,
      signal: controller.signal,
      cache: 'no-store'
    });
  } finally {
    clearTimeout(timer);
  }
}

function friendlyUploadError(status, details = '') {
  if (status === 401 || status === 403) return 'انتهت جلسة الدخول. يرجى المحاولة مرة أخرى بعد تحديث تسجيل الدخول.';
  if (status === 413) return 'الصورة كبيرة جدًا بعد الضغط. اختر صورة أصغر أو انتظر لحظة ثم أعد المحاولة.';
  if (status >= 500 || /network|failed to fetch|timeout|aborted/i.test(details)) return 'تعذر رفع الصورة إلى الخادم الآن. سيتم إعادة المحاولة تلقائيًا.';
  return details || 'فشل رفع الصورة إلى الخادم.';
}

export async function uploadImage(file, folder = 'places', customFileName = null, onProgress = null) {
  if (!file) throw new Error('يرجى اختيار ملف للصورة');
  if (file.size > MAX_INPUT_SIZE) throw new Error('حجم الصورة يجب ألا يتجاوز 15 ميجابايت');

  const rawType = (file.type || '').toLowerCase();
  const nameExt = ((file.name || '').split('.').pop() || '').toLowerCase();
  const isAllowed = ALLOWED_TYPES.includes(rawType) || ['jpg','jpeg','png','webp','gif','avif','heic','heif'].includes(nameExt);
  if (!isAllowed) throw new Error('نوع الملف غير مدعوم. يرجى استخدام JPG أو PNG أو WebP');

  let fileToUpload = file;
  try { fileToUpload = await convertToWebP(file, 1600, 0.82, MAX_UPLOAD_SIZE); }
  catch (err) { console.warn('[Upload] WebP conversion failed:', err); }

  if (fileToUpload.size > MAX_UPLOAD_SIZE) {
    try { fileToUpload = await convertToWebP(fileToUpload, 1200, 0.72, MAX_UPLOAD_SIZE); }
    catch (err) { console.warn('[Upload] second compression failed:', err); }
  }
  if (fileToUpload.size > MAX_UPLOAD_SIZE) throw new Error('الصورة ما زالت كبيرة بعد الضغط. اختر صورة أصغر.');

  const uploadMime = (fileToUpload.type || rawType || 'image/jpeg').toLowerCase();
  const ext = uploadMime === 'image/webp' ? 'webp' : (uploadMime === 'image/png' ? 'png' : uploadMime === 'image/gif' ? 'gif' : uploadMime === 'image/avif' ? 'avif' : 'jpg');
  const safeFolder = String(folder || 'places').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'places';
  const filename = customFileName || (Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '.' + ext);
  const key = safeFolder + '/' + filename;

  let lastError = null;
  for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
    try {
      const token = await getFreshToken(attempt > 1);
      if (!token) throw new Error('يجب تسجيل الدخول أولاً لرفع الصور');
      if (typeof onProgress === 'function') onProgress(Math.min(95, 20 + (attempt - 1) * 10));

      const response = await uploadOnce(WORKER_URL + '/api/upload', fileToUpload, filename, key, safeFolder, token);
      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}

      if (response.ok && data?.success !== false) {
        if (typeof onProgress === 'function') onProgress(100);
        const publicUrl = String(data.url || (R2_PUBLIC_URL + '/' + key)).replace('/api/r2/api/r2/', '/api/r2/');
        return { url: publicUrl, key: data.key || key };
      }

      if (response.status === 401 || response.status === 403) await getFreshToken(true);
      throw new Error(friendlyUploadError(response.status, data?.error || data?.message || raw));
    } catch (err) {
      lastError = err;
      const transient = attempt < UPLOAD_ATTEMPTS && (
        err?.name === 'AbortError' ||
        /تعذر رفع الصورة|الخادم|network|failed to fetch|timeout|500|502|503|504/i.test(String(err?.message || ''))
      );
      if (!transient) break;
      await sleep(700 * attempt);
    }
  }
  throw lastError || new Error('فشل رفع الصورة إلى الخادم');
}

export async function deleteImage(key) {
  if (!key) return;
  const token = await getFreshToken(false);
  if (!token) return;
  try {
    await fetch(WORKER_URL + '/api/upload/' + encodeURIComponent(key), {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store'
    });
  } catch (err) { console.warn('[Upload] Delete failed:', err); }
}

export function convertToWebP(file, maxWidth = 1400, quality = 0.85, maxBytes = MAX_UPLOAD_SIZE) {
  return new Promise((resolve) => {
    if (file?.type === 'image/webp' && file.size <= maxBytes) return resolve(file);
    let objectUrl = '';
    try { objectUrl = URL.createObjectURL(file); } catch (_) { return resolve(file); }
    const img = new Image();
    const timeout = setTimeout(() => { try { URL.revokeObjectURL(objectUrl); } catch (_) {} resolve(file); }, 8000);
    img.onerror = () => { clearTimeout(timeout); try { URL.revokeObjectURL(objectUrl); } catch (_) {} resolve(file); };
    img.onload = () => {
      clearTimeout(timeout);
      try {
        let width = img.width || 0, height = img.height || 0;
        if (!width || !height) { URL.revokeObjectURL(objectUrl); return resolve(file); }
        if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(objectUrl); return resolve(file); }
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          try { URL.revokeObjectURL(objectUrl); } catch (_) {}
          if (blob && blob.size > 0) {
            const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
            return resolve(new File([blob], baseName + '.webp', { type: 'image/webp' }));
          }
          resolve(file);
        }, 'image/webp', quality);
      } catch (_) { try { URL.revokeObjectURL(objectUrl); } catch (_) {} resolve(file); }
    };
    img.src = objectUrl;
  });
}