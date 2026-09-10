/**
 * المنزلة وناسها — Upload Service
 * Handles image optimization and upload to Cloudflare R2 via Cloudflare Worker
 */

import { WORKER_URL, R2_PUBLIC_URL } from '../core/firebase.js';
import { getIdToken } from '../core/auth.js';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB (aligned with scanner input limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'];

/**
 * Upload an image file to R2 storage
 * @param {File|Blob} file
 * @param {string} folder - 'places' | 'products' | 'offers' | 'ads' | 'avatars' | 'business-cards'
 * @param {string} [customFileName]
 * @param {Function} [onProgress]
 * @returns {Promise<{url: string, key: string}>}
 */
export async function uploadImage(file, folder = 'places', customFileName = null, onProgress = null) {
  if (!file) throw new Error('يرجى اختيار ملف للصورة');
  if (file.size > MAX_FILE_SIZE) throw new Error('حجم الصورة يجب ألا يتجاوز 15 ميجابايت');
  if (!ALLOWED_TYPES.includes((file.type || '').toLowerCase())) throw new Error('نوع الملف غير مدعوم. يرجى استخدام JPG أو PNG أو WebP أو HEIC');

  let fileToUpload = file;
  try {
    fileToUpload = await convertToWebP(file, 1400, 0.85);
  } catch (convErr) {
    console.warn('[Upload] WebP conversion fallback to original:', convErr);
    fileToUpload = file;
  }

  // A native HEIC/HEIF blob must never reach /api/upload unchanged because the
  // Worker intentionally stores only web-friendly formats. If conversion was
  // unavailable, fail with a clear message instead of sending an unsupported MIME.
  const uploadMime = (fileToUpload.type || '').toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(uploadMime)) {
    throw new Error('تعذر تحويل صورة الكارت إلى صيغة مدعومة. يرجى إعادة التصوير أو اختيار JPG/PNG/WebP');
  }

  const token = await getIdToken();
  if (!token) throw new Error('يجب تسجيل الدخول أولاً لرفع الصور');

  const ext = uploadMime === 'image/webp' ? 'webp' : (uploadMime === 'image/png' ? 'png' : uploadMime === 'image/gif' ? 'gif' : uploadMime === 'image/avif' ? 'avif' : 'jpg');
  const filename = customFileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const key = `${folder}/${filename}`;

  const formData = new FormData();
  formData.append('file', fileToUpload, filename);
  formData.append('key', key);
  formData.append('folder', folder);

  const response = await fetch(`${WORKER_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || 'فشل رفع الصورة إلى الخادم');
  }

  const result = await response.json();
  const publicUrl = result.url || `${R2_PUBLIC_URL}/${key}`;

  return { url: publicUrl, key: result.key || key };
}

/** Delete a file from R2 via Worker */
export async function deleteImage(key) {
  if (!key) return;
  const token = await getIdToken();
  if (!token) return;

  try {
    await fetch(`${WORKER_URL}/api/upload/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err) {
    console.warn('[Upload] Delete failed:', err);
  }
}

/** Convert image File/Blob to optimized WebP via Canvas. */
export function convertToWebP(file, maxWidth = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/webp' && file.size < 1024 * 1024) return resolve(file);

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('تعذر تهيئة معالج الصورة في المتصفح'));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (blob) return resolve(blob);
          resolve(file);
        }, 'image/webp', quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
