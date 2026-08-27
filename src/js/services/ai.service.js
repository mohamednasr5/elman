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
    // Smart English transliteration with Egyptian dictionary
    const { transliterateToEnglishName } = await import('../utils/slug.js');
    return transliterateToEnglishName(arabicName);
  }
}

/**
 * Generate AI Cover Image for Place with category specialization
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

    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl) return data.imageUrl;
    }
  } catch (err) {
    console.warn('[AI] Cover Worker fallback:', err);
  }

  // Fallback high-quality curated cover based on category
  const covers = {
    doctor: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    pharmacy: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=1200&q=80',
    supermarket: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
    plumber: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80',
    carpenter: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1200&q=80',
    tiler: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    painter: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80',
    electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
    printing: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&q=80',
    bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80',
    phones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
    delivery: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=1200&q=80',
    herbs: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&q=80',
    paint: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80'
  };

  const catKey = (categoryName || '').toLowerCase();
  for (const k in covers) {
    if (catKey.includes(k)) return covers[k];
  }

  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80';
}

/**
 * Generate an elegant branded Logo badge from place name and category
 * Returns a high-res SVG Data URL
 */
export function generatePlaceLogo(placeName, categoryId = '') {
  if (!placeName) placeName = 'مكان';
  const name = placeName.trim();
  
  // Extract 1 or 2 initials or main word
  const words = name.split(/\s+/);
  let initials = '';
  if (words.length === 1) {
    initials = words[0].slice(0, 2);
  } else {
    initials = words[0][0] + (words[1] ? words[1][0] : '');
  }

  // Palette by category
  const palettes = {
    doctor: { bg: '#1B4F72', accent: '#3498DB', icon: '👨‍⚕️' },
    pharmacy: { bg: '#922B21', accent: '#E74C3C', icon: '💊' },
    supermarket: { bg: '#196F3D', accent: '#2ECC71', icon: '🛒' },
    plumber: { bg: '#154360', accent: '#2980B9', icon: '🪠' },
    carpenter: { bg: '#784212', accent: '#E67E22', icon: '🪚' },
    tiler: { bg: '#512E5F', accent: '#8E44AD', icon: '🧱' },
    painter: { bg: '#7D6608', accent: '#F1C40F', icon: '🖌️' },
    electrician: { bg: '#7E5109', accent: '#F39C12', icon: '⚡' },
    printing: { bg: '#1A5276', accent: '#1ABC9C', icon: '🖨️' },
    bakery: { bg: '#7E5109', accent: '#E67E22', icon: '🍞' },
    phones: { bg: '#2C3E50', accent: '#BDC3C7', icon: '📱' },
    delivery: { bg: '#641E16', accent: '#E74C3C', icon: '🚀' }
  };

  const pal = palettes[categoryId] || { bg: '#1B4F72', accent: '#F39C12', icon: '🏪' };

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.bg}"/>
      <stop offset="100%" stop-color="${pal.accent}"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#g)"/>
  <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3" stroke-dasharray="6,6"/>
  <text x="100" y="70" font-family="'Cairo', sans-serif" font-size="34" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" filter="url(#s)">${pal.icon}</text>
  <text x="100" y="130" font-family="'Cairo', 'Segoe UI', Tahoma, sans-serif" font-size="30" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" letter-spacing="1">${initials}</text>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
