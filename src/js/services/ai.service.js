/**
 * المنزلة وناسها — AI Service
 * Powered by Cloudflare Worker + OpenRouter (Ox Alpha model)
 * Handles:
 * 1. Intelligent Arabic-to-English Place Name Translation
 * 2. AI Cover Image Generation & Art Style Prompting
 * 3. AI Smart Semantic Search & Categorization
 */

import { WORKER_URL } from '../core/firebase.js';
import { getIdToken } from '../core/auth.js';

/**
 * Translate Arabic Place Name to natural English
 * @param {string} arabicName
 * @param {string} category
 * @returns {Promise<string>}
 */
export async function translatePlaceName(arabicName, category = '') {
  if (!arabicName) return '';

  const token = await getIdToken();

  try {
    const res = await fetch(`${WORKER_URL}/api/ai/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ name: arabicName, category })
    });

    if (!res.ok) throw new Error('فشلت الترجمة الذكية');
    const data = await res.json();
    return data.translatedName || data.nameEn || arabicName;
  } catch (err) {
    console.warn('[AI] Translation fallback:', err);
    // Fallback phonetic transliteration
    const { transliterateArabic } = await import('../utils/slug.js');
    return transliterateArabic(arabicName);
  }
}

/**
 * Generate AI Cover Image for Place
 * @param {string} placeName
 * @param {string} categoryName
 * @param {string} area
 * @returns {Promise<string>} R2 image URL or AI generated background
 */
export async function generateCoverImage(placeName, categoryName = '', area = 'المنزلة') {
  const token = await getIdToken();

  try {
    const res = await fetch(`${WORKER_URL}/api/ai/generate-cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ placeName, categoryName, area })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'تعذر إنشاء الصورة بالذكاء الاصطناعي');
    }

    const data = await res.json();
    return data.imageUrl;
  } catch (err) {
    console.warn('[AI] Cover generation error:', err);
    throw err;
  }
}

/**
 * Smart Semantic AI Search
 * @param {string} query
 * @param {Array} places
 * @returns {Promise<{results: Array, intent: string, suggestedCategory: string}>}
 */
export async function aiSmartSearch(query, places = []) {
  if (!query) return { results: places, intent: '', suggestedCategory: null };

  const token = await getIdToken();

  try {
    const res = await fetch(`${WORKER_URL}/api/ai/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ query, placeTitles: places.map(p => ({ id: p._key || p.id, name: p.name, desc: p.description, cat: p.categoryId })) })
    });

    if (!res.ok) throw new Error('فشل البحث الذكي');
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[AI] Smart search fallback to local search:', err);
    return null;
  }
}
