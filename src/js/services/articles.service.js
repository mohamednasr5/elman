import { api } from '../core/api.js';
import { getIdToken } from '../core/auth.js';
import { uploadImage } from './upload.service.js';

async function token() {
  try {
    const t = await getIdToken(false);
    if (t) return t;
  } catch (_) {}
  try {
    const { getAuth } = await import('../core/auth.js');
    const auth = getAuth();
    for (let i = 0; i < 20; i++) {
      if (auth?.currentUser) {
        const t = await auth.currentUser.getIdToken().catch(() => null);
        if (t) return t;
      }
      await new Promise(r => setTimeout(r, 100));
    }
  } catch (_) {}
  return '';
}

export async function getArticles({ placeId = '', limit = 6, offset = 0 } = {}) {
  const qs = new URLSearchParams();
  if (placeId) qs.set('place_id', placeId);
  qs.set('limit', String(Math.min(50, Math.max(1, limit))));
  qs.set('offset', String(Math.max(0, offset)));
  const idToken = await token().catch(() => '');
  const data = await api.get('/api/articles?' + qs.toString(), idToken || null);
  return Array.isArray(data?.data) ? data.data : [];
}

export async function getArticleBySlug(slug) {
  if (!slug) return null;
  const data = await api.get('/api/articles?slug=' + encodeURIComponent(slug));
  return data?.data || null;
}

export async function generateArticle({ placeId, topic, title = '', keywords = [] } = {}) {
  const idToken = await token();
  if (!idToken) throw new Error('يجب تسجيل الدخول أولاً');
  const data = await api.post('/api/articles/generate', { placeId, topic, title, keywords }, idToken, { timeout: 20000 });
  if (!data?.success) throw new Error(data?.error || 'تعذر توليد المقال');
  return data.data || data;
}

export async function saveArticle(article, { draft = false } = {}) {
  const idToken = await token();
  if (!idToken) throw new Error('يجب تسجيل الدخول أولاً');
  const payload = { ...article, status: draft ? 'draft' : 'published' };
  const data = await api.post('/api/articles', payload, idToken, { timeout: 15000 });
  if (!data?.success) throw new Error(data?.error || 'تعذر حفظ المقال');
  return data.data;
}

export async function updateArticle(id, article, { draft = false } = {}) {
  const idToken = await token();
  if (!idToken) throw new Error('يجب تسجيل الدخول أولاً');
  const data = await api.put('/api/articles/' + encodeURIComponent(id), { ...article, status: draft ? 'draft' : 'published' }, idToken, { timeout: 15000 });
  if (!data?.success) throw new Error(data?.error || 'تعذر تحديث المقال');
  return data.data;
}

export async function deleteArticle(id) {
  const idToken = await token();
  if (!idToken) throw new Error('يجب تسجيل الدخول أولاً');
  const data = await api.delete('/api/articles/' + encodeURIComponent(id), idToken);
  if (!data?.success) throw new Error(data?.error || 'تعذر حذف المقال');
  return true;
}

export async function uploadArticleCover(file, slugHint = '') {
  if (!file) return '';
  const safe = String(slugHint || 'article').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 50) || 'article';
  const optimized = await import('./upload.service.js').then(m => m.convertToWebP(file, 1200, 0.78, 1800000).catch(() => file));
  const result = await uploadImage(optimized, 'articles', safe + '-' + Date.now() + '.webp');
  return result?.url || '';
}
