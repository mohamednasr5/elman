/**
 * المنزلة وناسها — AI Service
 * Multi-model AI orchestration via OpenRouter & Cloudflare Worker
 * Covers: Natural English Name Translation, High-Res Categorized Cover Generator,
 * Dynamic Place Logo Generator, and Semantic AI Search.
 */

import { generateSlug, transliterateToEnglishName } from '../utils/slug.js';
import { WORKER_URL } from '../core/firebase.js';

// Multi-Model Cascade (Free & Ultra-Fast Models on OpenRouter)
const AI_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2.5-7b-instruct:free'
];

/**
 * Call OpenRouter with automatic cascade through multiple models
 */
async function callOpenRouterWithFallback(prompt, systemPrompt = 'You are a precise multilingual naming assistant.') {
  for (const model of AI_MODELS) {
    try {
      const workerRes = await fetch(`${WORKER_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt, model }),
        signal: AbortSignal.timeout(6000)
      });
      if (workerRes.ok) {
        const data = await workerRes.json();
        const text = data.result || data.text || data.content || (data.choices && data.choices[0]?.message?.content);
        if (text && typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      }
    } catch (_) {
      // Try next model
    }
  }
  return null;
}

/**
 * Intelligent Egyptian Business Dictionary for immediate deterministic translation
 */
const EGYPTIAN_BIZ_DICT = {
  'صيدلية': 'Pharmacy',
  'دكتور': 'Dr.',
  'طبيب': 'Clinic',
  'عيادة': 'Clinic',
  'مستشفى': 'Hospital',
  'معمل': 'Lab',
  'سوبر ماركت': 'Supermarket',
  'ماركت': 'Market',
  'هايبر': 'Hypermarket',
  'مطعم': 'Restaurant',
  'مشويات': 'Grill',
  'اسماك': 'Fish & Seafood',
  'أسماك': 'Seafood',
  'كافيه': 'Cafe',
  'مقهى': 'Coffee Shop',
  'شاورما': 'Shawarma',
  'فول': 'Foul & Falafel',
  'طعمية': 'Falafel',
  'كشري': 'Koshary',
  'حلويات': 'Sweets & Pastry',
  'مخبز': 'Bakery',
  'فرن': 'Bakery',
  'عصير': 'Juice Bar',
  'عصائر': 'Juice Bar',
  'محل': 'Store',
  'معرض': 'Gallery',
  'بوتيك': 'Boutique',
  'ملابس': 'Fashion & Clothing',
  'أحذية': 'Shoes',
  'مجوهرات': 'Jewelry',
  'ذهب': 'Gold & Jewelry',
  'موبايل': 'Phones & Accessories',
  'هواتف': 'Mobile Store',
  'كمبيوتر': 'Computers & Tech',
  'مكتبة': 'Stationery & Bookstore',
  'حلاق': 'Barbershop',
  'كوافير': 'Beauty Salon',
  'صالون': 'Salon',
  'جيم': 'Gym & Fitness',
  'مغسلة': 'Laundry',
  'دراي كلين': 'Dry Clean',
  'سباك': 'Plumber',
  'كهربائي': 'Electrician',
  'نجار': 'Carpenter',
  'نقاش': 'Painter',
  'حداد': 'Blacksmith',
  'ميكانيكي': 'Auto Mechanic',
  'كاوتش': 'Tires Service',
  'غيار': 'Spare Parts',
  'بنزينة': 'Gas Station',
  'فندق': 'Hotel',
  'عقارات': 'Real Estate',
  'محامي': 'Lawyer Firm',
  'محاسب': 'Accountant',
  'مهندس': 'Engineering Office',
  'استوديو': 'Photo Studio',
  'تنسيق': 'Events & Decor',
  'بلايستيشن': 'PlayStation & Gaming'
};

/**
 * 1. Translate Arabic Place Name to natural, professional English
 */
export async function translatePlaceName(arabicName, category = '') {
  if (!arabicName || typeof arabicName !== 'string') return '';
  const cleanArabic = arabicName.trim();

  // Try AI translation via Multi-Model Cascade
  try {
    const prompt = `Translate this Arabic place or business name from Egypt to clean, natural English for a modern online directory. Give ONLY the English name. No explanations, no quotes, no extra words.\n\nArabic Name: ${cleanArabic}\nCategory: ${category || 'Local Business'}`;
    const aiResult = await callOpenRouterWithFallback(prompt);

    if (aiResult) {
      let cleaned = aiResult.replace(/["'`]/g, '').trim();
      cleaned = cleaned.replace(/^(Translation|Name|English):\s*/i, '').trim();

      // Check if it has no Arabic letters
      const hasArabic = /[\u0600-\u06FF]/.test(cleaned);
      if (cleaned && !hasArabic && cleaned.length >= 2) {
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('[AI] Translation failed, using dictionary fallback:', err);
  }

  // High-Quality Fallback: Egyptian Business Dictionary + Transliteration
  let translatedWords = [];
  const words = cleanArabic.split(/\s+/);

  for (const word of words) {
    const cleanWord = word.replace(/^[وال]/, '');
    if (EGYPTIAN_BIZ_DICT[word]) {
      translatedWords.push(EGYPTIAN_BIZ_DICT[word]);
    } else if (EGYPTIAN_BIZ_DICT[cleanWord]) {
      translatedWords.push(EGYPTIAN_BIZ_DICT[cleanWord]);
    } else {
      const trans = transliterateToEnglishName(word);
      if (trans) translatedWords.push(trans);
    }
  }

  if (translatedWords.length > 0) {
    return translatedWords.join(' ');
  }

  return transliterateToEnglishName(cleanArabic) || generateSlug(cleanArabic) || 'Local Business';
}

/**
 * 2. Generate Professional Specialized Cover Image URL based on Category & Keywords
 */
export async function generateCoverImage(placeName = '', categoryName = '', area = 'المنزلة') {
  const queryMap = {
    'طبيب': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    'دكتور': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    'صيدلية': 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=1200&q=80',
    'سوبر ماركت': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
    'ماركت': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
    'مطعم': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    'كافيه': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
    'مخبز': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80',
    'ملابس': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
    'جيم': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    'حلاق': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80',
    'كوافير': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
    'سباك': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80',
    'نجار': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1200&q=80',
    'ميكانيكي': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&q=80'
  };

  const combined = (placeName + ' ' + categoryName).toLowerCase();
  for (const [key, url] of Object.entries(queryMap)) {
    if (combined.includes(key)) {
      return url;
    }
  }

  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80';
}

/**
 * 3. Generate Distinctive Vector Brand Logo based on Place Name & Category
 */
export function generateLogoImage(placeName = '', categoryName = '') {
  const name = (placeName || 'مكان').trim();
  
  const categoryColors = {
    'طبيب': { bg: '0284C7', text: 'FFFFFF' },
    'صيدلية': { bg: '059669', text: 'FFFFFF' },
    'مطعم': { bg: 'EA580C', text: 'FFFFFF' },
    'كافيه': { bg: '78350F', text: 'FFFFFF' },
    'سوبر ماركت': { bg: '4F46E5', text: 'FFFFFF' },
    'مخبز': { bg: 'D97706', text: 'FFFFFF' },
    'جيم': { bg: 'DC2626', text: 'FFFFFF' },
    'ملابس': { bg: '9333EA', text: 'FFFFFF' },
    'موبايل': { bg: '2563EB', text: 'FFFFFF' },
    'حلاق': { bg: '1E293B', text: 'F59E0B' },
    'كوافير': { bg: 'DB2777', text: 'FFFFFF' },
    'عقارات': { bg: '0F766E', text: 'FFFFFF' }
  };

  let palette = { bg: '1B4F72', text: 'FFFFFF' };
  for (const [key, val] of Object.entries(categoryColors)) {
    if (categoryName.includes(key) || name.includes(key)) {
      palette = val;
      break;
    }
  }

  const words = name.split(/\s+/).filter(Boolean);
  let initials = words.length >= 2 
    ? words[0].slice(0, 1) + ' ' + words[1].slice(0, 1)
    : name.slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${palette.bg}&color=${palette.text}&size=512&bold=true&font-size=0.42&rounded=false&format=svg`;
}

// Alias for backwards compatibility
export const generatePlaceLogo = generateLogoImage;

/**
 * 4. AI Smart Semantic Search
 */
export async function aiSearch(query) {
  if (!query || !query.trim()) return { results: [], suggestions: [] };
  try {
    const res = await fetch(`${WORKER_URL}/api/ai/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return { results: [], suggestions: [] };
}
