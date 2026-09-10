/**
 * المنزلة وناسها — Business Card Scanner Service
 * Handles image optimization, R2 upload, and OpenRouter Vision AI extraction.
 */

import { WORKER_URL } from '../core/firebase.js';
import { getIdToken } from '../core/auth.js';
import { uploadImage } from './upload.service.js';

const MAX_IMAGE_INPUT_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif', 'image/gif'
];

/**
 * Validates and optimizes a business card image for OCR text recognition.
 * Resizes to max 1600px to maintain crisp text while keeping payload compact.
 * 
 * @param {File|Blob} file 
 * @returns {Promise<{ optimizedBlob: Blob, previewUrl: string, width: number, height: number }>}
 */
export async function prepareCardImage(file) {
  if (!file) {
    throw new Error('يرجى اختيار صورة كارت المحل');
  }

  // Check file type
  const type = (file.type || '').toLowerCase();
  const isAllowed = ALLOWED_MIME_TYPES.includes(type) || type.startsWith('image/');
  if (!isAllowed) {
    throw new Error('صيغة الملف غير مدعومة. يرجى تصوير الكارت أو اختيار صورة بصيغة JPG أو PNG أو WebP');
  }

  // Check initial size
  if (file.size > MAX_IMAGE_INPUT_SIZE) {
    throw new Error('حجم الصورة كبير جداً (أكثر من 15 ميجابايت). يرجى التقاط صورة بدقة عادية');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('الصورة غير صالحة أو تالفة. يرجى إعادة التقاط الكارت'));
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        if (originalWidth < 100 || originalHeight < 100) {
          return reject(new Error('أبعاد الصورة صغيرة جداً ولا يمكن قراءة نصوص الكارت منها. يرجى تصوير الكارت عن قرب'));
        }

        // Maintain high resolution for OCR (up to 1600px)
        const maxDimension = 1600;
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
            targetHeight = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as high-quality WebP (with fallback to JPEG)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('فشل معالجة الصورة'));
            }
            const previewUrl = URL.createObjectURL(blob);
            resolve({
              optimizedBlob: blob,
              previewUrl,
              width: targetWidth,
              height: targetHeight
            });
          },
          'image/webp',
          0.90 // 90% quality ensures fine printed Arabic text remains sharp
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads business card image to Cloudflare R2 under `business-cards` folder.
 * 
 * @param {Blob|File} imageBlob 
 * @param {Function} [onProgress]
 * @returns {Promise<{ url: string, key: string }>}
 */
export async function uploadCardImageToR2(imageBlob, onProgress = null) {
  const ext = imageBlob.type === 'image/webp' ? 'webp' : 'jpg';
  const customFileName = `card_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  return await uploadImage(imageBlob, 'business-cards', customFileName, onProgress);
}

/**
 * Sends the business card image to the OpenRouter Vision AI pipeline on Worker.
 * 
 * @param {string} imageUrl - Public R2 URL of the uploaded business card
 * @returns {Promise<Object>} Extracted business card structured data
 */
export async function extractCardDataWithAI(imageUrl) {
  if (!imageUrl) {
    throw new Error('رابط صورة الكارت مطلوب لبدء المعالجة');
  }

  const token = await getIdToken();
  if (!token) {
    throw new Error('يجب تسجيل الدخول لاستخدام ميزة الفحص الذكي لكروت المحلات');
  }

  const response = await fetch(`${WORKER_URL}/api/ai/scan-business-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ imageUrl }),
    signal: AbortSignal.timeout(35000) // 35s timeout for AI Vision processing & failover
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    const errorMsg = result.error || 'تعذر قراءة الكارت تلقائياً حالياً. يمكنك إدخال البيانات يدوياً، ولن تفقد أي بيانات.';
    const err = new Error(errorMsg);
    err.code = result.code || 'AI_EXTRACTION_FAILED';
    throw err;
  }

  return result.cardData;
}

/**
 * Calculates which required and recommended business fields are still empty
 * after AI extraction and comparing with current user inputs.
 * 
 * @param {Object} cardData - Extracted AI data
 * @param {Object} currentFormValues - Existing form fields
 * @returns {Array<{ key: string, label: string, icon: string, isRequired: boolean }>}
 */
export function calculateMissingFields(cardData = {}, currentFormValues = {}) {
  const fields = [];

  const valName = currentFormValues.name || cardData.businessNameAr;
  if (!valName || !valName.trim()) {
    fields.push({ key: 'name', label: 'اسم المحل أو النشاط', icon: '🏪', isRequired: true });
  }

  const valCategory = currentFormValues.category || cardData.categoryId;
  if (!valCategory || !valCategory.trim()) {
    fields.push({ key: 'category', label: 'التصنيف أو التخصص المهني', icon: '📂', isRequired: true });
  }

  const valPhone = currentFormValues.phone || cardData.phone;
  if (!valPhone || !valPhone.trim()) {
    fields.push({ key: 'phone', label: 'رقم الهاتف للتواصل', icon: '📞', isRequired: true });
  }

  const valAddress = currentFormValues.address || cardData.address;
  if (!valAddress || !valAddress.trim()) {
    fields.push({ key: 'address', label: 'العنوان بالتفصيل أو الشارع', icon: '📍', isRequired: false });
  }

  const valDesc = currentFormValues.description || cardData.description;
  if (!valDesc || !valDesc.trim()) {
    fields.push({ key: 'description', label: 'وصف النشاط والخدمات', icon: '📝', isRequired: false });
  }

  const valHours = currentFormValues.workingHours || cardData.workingHoursText;
  if (!valHours || !valHours.trim()) {
    fields.push({ key: 'workingHours', label: 'مواعيد وساعات العمل', icon: '🕒', isRequired: false });
  }

  const valCover = currentFormValues.coverUrl;
  if (!valCover || !valCover.trim()) {
    fields.push({ key: 'cover', label: 'صورة الغلاف (اختياري - يوجد غلاف افتراضي)', icon: '🖼️', isRequired: false });
  }

  return fields;
}
