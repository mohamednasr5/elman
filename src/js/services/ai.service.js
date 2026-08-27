import { generateSlug } from '../../utils/slug.js';

// Note: In production, fetch the key from your Cloudflare Worker to hide it
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const WORKER_URL = 'https://elmanzala.nonm1724.workers.dev';

// Model cascade for text generation
const TEXT_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2.5-7b-instruct:free'
];

async function callOpenRouter(prompt, models = TEXT_MODELS) {
  for (const model of models) {
    try {
      // First try via Worker (to hide API key)
      const workerRes = await fetch(`${WORKER_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
        signal: AbortSignal.timeout(8000)
      });
      if (workerRes.ok) {
        const data = await workerRes.json();
        if (data.result || data.text || data.content) {
          return data.result || data.text || data.content;
        }
      }
    } catch (_) {}
    // Worker failed, try next model
  }
  return null;
}

export async function translatePlaceName(arabicName, category) {
  const prompt = `Translate this Arabic business/place name to natural English. Give ONLY the English name, nothing else.\nArabic: ${arabicName}\nCategory: ${category || 'business'}`;
  const res = await callOpenRouter(prompt);
  if (res) {
    if (!/[\u0600-\u06FF]/.test(res)) {
      return res.trim();
    }
  }
  return generateSlug(arabicName) || 'place';
}

export async function generateCoverImage(placeName, categoryName = '', area = 'المنزلة') {
  // Map categories to high-quality Unsplash queries
  const queryMap = {
    'طبيب': 'modern medical clinic',
    'صيدلية': 'pharmacy store interior',
    'مطعم': 'restaurant interior food',
    'كافيه': 'cozy cafe coffee',
    'سوبر ماركت': 'supermarket grocery store',
    'مخبز': 'artisan bakery bread',
    'ميكانيكي': 'auto repair garage workshop',
    'سباك': 'plumbing professional tools',
    'كهربائي': 'electrical professional tools',
    'نجار': 'carpenter workshop wood',
    'مدرسة': 'school education modern',
    'جيم': 'modern gym fitness center',
    'فندق': 'hotel lobby luxury',
    'حلاق': 'barber shop modern',
    'خياط': 'tailor fashion atelier',
    'صالون': 'beauty salon modern',
  };
  
  // Find matching query
  let query = 'professional business egypt';
  for (const [key, val] of Object.entries(queryMap)) {
    if (categoryName.includes(key) || placeName.includes(key)) {
      query = val;
      break;
    }
  }
  
  // Use Unsplash source with category-specific query
  const seed = encodeURIComponent(placeName + categoryName).slice(0, 20);
  return `https://source.unsplash.com/1200x400/?${encodeURIComponent(query)}&sig=${seed}`;
}

export function generateLogoImage(placeName, categoryName = '') {
  // Use ui-avatars for professional letter-based logo
  const name = placeName.trim() || 'م';
  const bgColors = {
    'طبيب': '0EA5E9',
    'صيدلية': '10B981',
    'مطعم': 'F59E0B',
    'كافيه': '92400E',
    'سوبر ماركت': '6366F1',
    'default': '1B4F72'
  };
  let bg = bgColors.default;
  for (const [key, color] of Object.entries(bgColors)) {
    if (categoryName.includes(key)) { bg = color; break; }
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=400&bold=true&font-size=0.35&rounded=false&format=png`;
}

export async function aiSearch(query) {
  try {
    const res = await fetch(`${WORKER_URL}/api/ai/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) return await res.json();
  } catch (_) {}
  return { results: [], suggestions: [] };
}
