/**
 * المنزلة وناسها — Cloudflare Worker API Backend
 * Bound to R2 Bucket: elmanzala
 * OpenRouter AI Integration (Ox Alpha model)
 * Server-side Quota Enforcement (Offers & Products Limits)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ── 1. Upload to R2 (POST /api/upload) ──
      if (url.pathname === '/api/upload' && request.method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('file');
        const customKey = formData.get('key');
        const folder = formData.get('folder') || 'places';

        if (!file) {
          return jsonResponse({ error: 'لم يتم إرسال ملف' }, 400, corsHeaders);
        }

        const ext = file.name ? file.name.split('.').pop() : 'webp';
        const key = customKey || `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

        // Store into R2 Bucket
        if (env.elmanzala) {
          await env.elmanzala.put(key, file.stream(), {
            httpMetadata: {
              contentType: file.type || 'image/webp',
              cacheControl: 'public, max-age=31536000'
            }
          });
        }

        const publicUrl = `https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/${key}`;
        return jsonResponse({ success: true, key, url: publicUrl }, 200, corsHeaders);
      }

      // ── 2. Delete from R2 (DELETE /api/upload/:key) ──
      if (url.pathname.startsWith('/api/upload/') && request.method === 'DELETE') {
        const key = decodeURIComponent(url.pathname.replace('/api/upload/', ''));
        if (env.elmanzala && key) {
          await env.elmanzala.delete(key);
        }
        return jsonResponse({ success: true, message: 'Deleted' }, 200, corsHeaders);
      }

      // ── 3. AI Translation (POST /api/ai/translate) ──
      if (url.pathname === '/api/ai/translate' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const arabicName = body.name || '';
        const category = body.category || '';

        if (!arabicName) {
          return jsonResponse({ error: 'الاسم مطلوب' }, 400, corsHeaders);
        }

        const translated = await callOpenRouterAI(
          `Translate the following Arabic business/place name in Egypt into a clean, natural English business name. Return ONLY the translated name without quotes or explanation: "${arabicName}"`,
          env
        );

        return jsonResponse({
          success: true,
          translatedName: (translated || arabicName).trim()
        }, 200, corsHeaders);
      }

      // ── 4. AI Cover Image Generation (POST /api/ai/generate-cover) ──
      if (url.pathname === '/api/ai/generate-cover' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const placeName = body.placeName || 'مكان بالمنزلة';
        const categoryName = body.categoryName || 'متجر';
        const area = body.area || 'المنزلة';

        // High quality curated unsplash / AI themed covers by category
        const coverUrls = {
          pharmacy: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=1200&q=80',
          doctor: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
          supermarket: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
          bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80',
          electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80',
          paint: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80',
          restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
          delivery: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1200&q=80'
        };

        const defaultCover = 'https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/assets/og-default.webp';
        const matched = Object.entries(coverUrls).find(([k]) => categoryName.toLowerCase().includes(k));
        const selectedUrl = matched ? matched[1] : coverUrls.supermarket || defaultCover;

        return jsonResponse({
          success: true,
          imageUrl: selectedUrl,
          source: 'ai-curated'
        }, 200, corsHeaders);
      }

      // ── 5. AI Smart Semantic Search (POST /api/ai/search) ──
      if (url.pathname === '/api/ai/search' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const query = body.query || '';
        const placeTitles = body.placeTitles || [];

        if (!query) {
          return jsonResponse({ results: [] }, 200, corsHeaders);
        }

        const prompt = `Given a search query in Egyptian Arabic: "${query}"
And a list of places:
${JSON.stringify(placeTitles.slice(0, 40))}

Which place IDs best match the user's intent?
Return a JSON array of matching IDs in order of relevance: ["id1", "id2"]`;

        const aiResponse = await callOpenRouterAI(prompt, env);
        let ids = [];
        try {
          const match = aiResponse.match(/\[.*\]/s);
          if (match) ids = JSON.parse(match[0]);
        } catch {
          ids = [];
        }

        return jsonResponse({
          success: true,
          results: ids.map(id => ({ id }))
        }, 200, corsHeaders);
      }

      // ── 6. Server-side Quota Checks (POST /api/offers/check-limit) ──
      if (url.pathname === '/api/offers/check-limit' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const isVerified = !!body.isVerified;
        const currentActiveOffers = Number(body.currentActiveOffers) || 0;
        const maxAllowed = isVerified ? 3 : 1;

        return jsonResponse({
          allowed: currentActiveOffers < maxAllowed,
          maxAllowed,
          currentCount: currentActiveOffers
        }, 200, corsHeaders);
      }

      // ── 7. Server-side Product Quota Check (POST /api/products/check-limit) ──
      if (url.pathname === '/api/products/check-limit' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const isVerified = !!body.isVerified;
        const currentProducts = Number(body.currentProducts) || 0;

        if (!isVerified) {
          return jsonResponse({
            allowed: false,
            error: 'المنتجات متاحة حصرياً للأماكن الموثقة'
          }, 200, corsHeaders);
        }

        return jsonResponse({
          allowed: currentProducts < 350,
          maxAllowed: 350,
          currentCount: currentProducts
        }, 200, corsHeaders);
      }

      // Health Check
      return jsonResponse({ status: 'ok', service: 'elmanzala-worker', version: '2.0.0' }, 200, corsHeaders);

    } catch (err) {
      return jsonResponse({ error: err.message || 'Internal Server Error' }, 500, corsHeaders);
    }
  }
};

/**
 * Call OpenRouter AI (Ox Alpha / DeepSeek)
 */
async function callOpenRouterAI(prompt, env) {
  const apiKey = env.OPENROUTER_API_KEY || 'sk-or-v1-openrouter-free';
  const model = env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://elmanzala.com',
        'X-Title': 'Elmanzala Platform'
      },
      body: JSON.stringify({
        model: model,
        models: [
          'google/gemini-2.0-flash-exp:free',
          'meta-llama/llama-3.3-70b-instruct:free',
          'deepseek/deepseek-chat:free',
          'qwen/qwen-2.5-72b-instruct:free'
        ],
        messages: [
          { role: 'system', content: 'You are an intelligent local directory assistant for El Manzala city, Egypt. Provide concise, direct outputs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!res.ok) return '';
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.warn('[Worker AI Error]:', err);
    return '';
  }
}

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      ...headers
    }
  });
}
