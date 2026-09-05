/**
 * المنزلة وناسها — Cloudflare Worker API Backend
 * Bound to R2 Bucket: elmanzala
 * OpenRouter AI Integration (Ox Alpha model)
 * Server-side Quota Enforcement (Offers & Products Limits)
 * Telegram Bot & Instant Notification System
 */

import { handleTelegramWebhook, sendAdminPushNotification, telegramApi } from './telegram.js';

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

  // ── D1: Search Places with Two-Tier Caching ────────────────────
  // GET /api/search?q=...&category=...&area=...&limit=20&offset=0
  if (url.pathname === '/api/search' && request.method === 'GET') {
    const rawQuery = (url.searchParams.get('q') || '').trim();
    const rawCat = (url.searchParams.get('category') || url.searchParams.get('cat') || '').trim();
    const rawArea = (url.searchParams.get('area') || '').trim();
    const limitParam = parseInt(url.searchParams.get('limit') || '20', 10);
    const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);

    const limit = Math.min(Math.max(limitParam, 1), 50);
    const offset = Math.max(offsetParam, 0);

    const normQ = normalizeArabicText(rawQuery);
    const normCat = rawCat.toLowerCase();
    const normArea = rawArea.toLowerCase();

    // 1. Cloudflare Cache API (Worker-level Cache)
    const cache = caches.default;
    const cacheUrl = new URL('https://cache.local/api/search');
    cacheUrl.searchParams.set('q', normQ);
    if (normCat) cacheUrl.searchParams.set('cat', normCat);
    if (normArea) cacheUrl.searchParams.set('area', normArea);
    cacheUrl.searchParams.set('limit', String(limit));
    cacheUrl.searchParams.set('offset', String(offset));

    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('X-Cache', 'HIT');
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }

    // 2. Query D1 with targeted filters and LIMIT
    let sql = `
      SELECT
        id, name, name_en, slug, category_id, subcategory_id, custom_category,
        address, area, phone, whatsapp, maps_link, latitude, longitude,
        description, logo_url, cover_image_url, status, is_verified,
        verification_status, offer_count, product_count, services_json,
        social_json, stats_json, working_hours_json, created_at, updated_at
      FROM places
      WHERE status = 'published'
    `;
    const params = [];

    if (rawQuery) {
      sql += ` AND (name LIKE ? OR description LIKE ? OR custom_category LIKE ? OR address LIKE ? OR area LIKE ?)`;
      const searchPattern = `%${rawQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (normCat) {
      sql += ` AND (category_id = ? OR custom_category LIKE ?)`;
      params.push(normCat, `%${normCat}%`);
    }

    if (normArea) {
      sql += ` AND area = ?`;
      params.push(rawArea);
    }

    sql += ` ORDER BY is_verified DESC, updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit + 1, offset);

    const result = await env.DB.prepare(sql).bind(...params).all();
    const rows = result.results || [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const places = items.map(place => ({
      ...place,
      services: parseJson(place.services_json, []),
      social: parseJson(place.social_json, {}),
      stats: parseJson(place.stats_json, {}),
      working_hours: parseJson(place.working_hours_json, {}),
      is_verified: Boolean(place.is_verified)
    }));

    const responseData = {
      success: true,
      data: places,
      pagination: {
        limit,
        offset,
        returned: places.length,
        hasMore
      }
    };

    const finalResponse = jsonResponse(responseData, 200, {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'X-Cache': 'MISS'
    });

    ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
    return finalResponse;
  }

  // ── D1: Get Place Details (Single or List with Caching) ────────
  // GET /api/places
  if (url.pathname === '/api/places' && request.method === 'GET') {
    const slugParam = (url.searchParams.get('slug') || url.searchParams.get('id') || '').trim();
    if (slugParam) {
      const cleanSlug = slugParam.toLowerCase();
      const cache = caches.default;
      const cacheUrl = new URL(`https://cache.local/api/places?slug=${encodeURIComponent(cleanSlug)}`);
      const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set('X-Cache', 'HIT');
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      const result = await env.DB.prepare(`
        SELECT *
        FROM places
        WHERE slug = ? OR id = ?
        LIMIT 1
      `).bind(slugParam, slugParam).first();

      if (result) {
        const place = {
          ...result,
          services: parseJson(result.services_json, []),
          social: parseJson(result.social_json, {}),
          stats: parseJson(result.stats_json, {}),
          working_hours: parseJson(result.working_hours_json, {}),
          is_verified: Boolean(result.is_verified)
        };
        const res = jsonResponse({ success: true, data: place }, 200, {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Cache': 'MISS'
        });
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
      }
      return jsonResponse({ success: false, error: 'المكان غير موجود' }, 404, corsHeaders);
    }

    const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);
    const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);

    const limit = Math.min(Math.max(limitParam, 1), 100);
    const offset = Math.max(offsetParam, 0);

    const result = await env.DB.prepare(`
      SELECT
        id, name, name_en, slug, category_id, subcategory_id, custom_category,
        address, area, phone, whatsapp, maps_link, latitude, longitude,
        description, logo_url, cover_image_url, owner_id, owner_email,
        status, is_verified, verification_status, offer_count, product_count,
        services_json, social_json, stats_json, working_hours_json,
        created_at, updated_at
      FROM places
      ORDER BY updated_at DESC, created_at DESC
      LIMIT ? OFFSET ?
    `)
      .bind(limit, offset)
      .all();

    const places = (result.results || []).map(place => ({
      ...place,
      services: parseJson(place.services_json, []),
      social: parseJson(place.social_json, {}),
      stats: parseJson(place.stats_json, {}),
      working_hours: parseJson(place.working_hours_json, {}),
      is_verified: Boolean(place.is_verified)
    }));

    return jsonResponse({
      success: true,
      data: places,
      pagination: {
        limit,
        offset,
        returned: places.length
      }
    }, 200, {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=60, s-maxage=60'
    });
  }

  // ── D1: Sync/Update Place (POST/PUT /api/places/sync or /api/places) ──
  if ((url.pathname === '/api/places/sync' || url.pathname === '/api/places') && (request.method === 'POST' || request.method === 'PUT')) {
    const body = await request.json().catch(() => ({}));
    const placeId = (body.id || body._id || body.placeId || '').trim();
    if (!placeId) {
      return jsonResponse({ error: 'معرف المكان (id) مطلوب' }, 400, corsHeaders);
    }

    const name = (body.name || '').trim();
    const slug = (body.slug || '').trim();
    const nameEn = body.nameEn || body.name_en || '';
    const categoryId = body.categoryId || body.category_id || 'general';
    const customCategory = body.customCategory || body.custom_category || '';
    const subcategoryId = body.subcategoryId || body.subcategory_id || '';
    const phone = body.phone || '';
    const whatsapp = body.whatsapp || '';
    const area = body.area || 'المنزلة';
    const address = body.address || '';
    const mapsLink = body.mapsLink || body.maps_link || '';
    const lat = body.location?.lat || body.latitude || null;
    const lng = body.location?.lng || body.longitude || null;
    const description = body.description || '';
    const logoUrl = body.logoUrl || body.logo_url || '';
    const coverImageUrl = body.coverImageUrl || body.cover_image_url || '';
    const status = body.status || 'published';
    const isVerified = body.isVerified !== undefined ? (body.isVerified ? 1 : 0) : (body.is_verified ? 1 : 0);
    const verificationStatus = body.verificationStatus || body.verification_status || (isVerified ? 'verified' : 'unverified');
    const servicesJson = typeof body.services === 'object' ? JSON.stringify(body.services) : (body.services_json || '[]');
    const socialJson = typeof body.social === 'object' ? JSON.stringify(body.social) : (body.social_json || '{}');
    const workingHoursJson = typeof body.workingHours === 'object' ? JSON.stringify(body.workingHours) : (body.working_hours_json || '{}');
    const statsJson = typeof body.stats === 'object' ? JSON.stringify(body.stats) : (body.stats_json || '{}');
    const ownerId = body.ownerId || body.owner_id || '';
    const ownerEmail = body.ownerEmail || body.owner_email || '';
    const now = Date.now();

    await env.DB.prepare(`
      INSERT INTO places (
        id, name, name_en, slug, category_id, subcategory_id, custom_category,
        address, area, phone, whatsapp, maps_link, latitude, longitude,
        description, logo_url, cover_image_url, owner_id, owner_email,
        status, is_verified, verification_status, services_json, social_json,
        stats_json, working_hours_json, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        name_en = excluded.name_en,
        slug = COALESCE(excluded.slug, places.slug),
        category_id = excluded.category_id,
        subcategory_id = excluded.subcategory_id,
        custom_category = excluded.custom_category,
        address = excluded.address,
        area = excluded.area,
        phone = excluded.phone,
        whatsapp = excluded.whatsapp,
        maps_link = excluded.maps_link,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        description = excluded.description,
        logo_url = excluded.logo_url,
        cover_image_url = excluded.cover_image_url,
        status = excluded.status,
        is_verified = excluded.is_verified,
        verification_status = excluded.verification_status,
        services_json = excluded.services_json,
        social_json = excluded.social_json,
        working_hours_json = excluded.working_hours_json,
        updated_at = excluded.updated_at
    `).bind(
      placeId, name, nameEn, slug || placeId, categoryId, subcategoryId, customCategory,
      address, area, phone, whatsapp, mapsLink, lat, lng,
      description, logoUrl, coverImageUrl, ownerId, ownerEmail,
      status, isVerified, verificationStatus, servicesJson, socialJson,
      statsJson, workingHoursJson, now
    ).run();

    // Cache Invalidation for this place
    const cache = caches.default;
    const purgeUrls = [
      `https://cache.local/api/places?slug=${encodeURIComponent((slug || placeId).toLowerCase())}`,
      `https://cache.local/api/places?id=${encodeURIComponent(placeId)}`
    ];
    ctx.waitUntil(Promise.all(purgeUrls.map(u => cache.delete(new Request(u)))));

    return jsonResponse({
      success: true,
      message: 'تم تحديث المكان في Cloudflare D1 ومسح الكاش بنجاح',
      id: placeId,
      updatedAt: now
    }, 200, corsHeaders);
  }

  // ── D1: Delete Place (DELETE /api/places/:id or /api/places?id=...) ──
  if ((url.pathname.startsWith('/api/places/') || url.pathname === '/api/places') && request.method === 'DELETE') {
    const idFromPath = url.pathname.startsWith('/api/places/') ? url.pathname.replace('/api/places/', '') : '';
    const id = (idFromPath || url.searchParams.get('id') || url.searchParams.get('slug') || '').trim();

    if (id) {
      await env.DB.prepare(`DELETE FROM places WHERE id = ? OR slug = ?`).bind(id, id).run();

      const cache = caches.default;
      const purgeUrls = [
        `https://cache.local/api/places?slug=${encodeURIComponent(id.toLowerCase())}`,
        `https://cache.local/api/places?id=${encodeURIComponent(id)}`
      ];
      ctx.waitUntil(Promise.all(purgeUrls.map(u => cache.delete(new Request(u)))));
    }

    return jsonResponse({ success: true, message: 'تم حذف المكان من D1 ومسح الكاش' }, 200, corsHeaders);
  }

  // ── D1: Categories (GET /api/categories) ──────────────────────
  if (url.pathname === '/api/categories' && request.method === 'GET') {
    const cache = caches.default;
    const cacheUrl = new URL('https://cache.local/api/categories');
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

    const cached = await cache.match(cacheKey);
    if (cached) {
      const response = new Response(cached.body, cached);
      response.headers.set('X-Cache', 'HIT');
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }

    try {
      const result = await env.DB.prepare(`
        SELECT id, name, name_en, slug, icon, description, color, "order", place_count
        FROM categories
        ORDER BY "order" ASC, name ASC
      `).all();

      const categories = result.results || [];
      const res = jsonResponse({ success: true, data: categories }, 200, {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Cache': 'MISS'
      });

      if (categories.length > 0) {
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
      }
      return res;
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Reviews (GET /api/reviews?place_id=... & POST /api/reviews) ──
  if (url.pathname === '/api/reviews' && request.method === 'GET') {
    const placeId = (url.searchParams.get('place_id') || url.searchParams.get('placeId') || '').trim();
    if (!placeId) {
      return jsonResponse({ error: 'place_id مطلوب' }, 400, corsHeaders);
    }

    try {
      const result = await env.DB.prepare(`
        SELECT id, place_id, user_id, user_name, user_photo, rating, comment, likes, created_at, updated_at
        FROM reviews
        WHERE place_id = ? AND status = 'published'
        ORDER BY created_at DESC
        LIMIT 100
      `).bind(placeId).all();

      return jsonResponse({ success: true, data: result.results || [] }, 200, {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=60, s-maxage=60'
      });
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if (url.pathname === '/api/reviews' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const placeId = (body.place_id || body.placeId || '').trim();
    const userId = (body.user_id || body.userId || '').trim();
    const rating = parseFloat(body.rating);

    if (!placeId || !userId || isNaN(rating)) {
      return jsonResponse({ error: 'place_id و user_id و rating مطلوبة' }, 400, corsHeaders);
    }

    const reviewId = body.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userName = body.user_name || body.userName || 'مستخدم';
    const userPhoto = body.user_photo || body.userPhoto || '';
    const comment = body.comment || '';
    const now = Date.now();

    try {
      await env.DB.prepare(`
        INSERT INTO reviews (id, place_id, user_id, user_name, user_photo, rating, comment, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          rating = excluded.rating,
          comment = excluded.comment,
          updated_at = excluded.updated_at
      `).bind(reviewId, placeId, userId, userName, userPhoto, rating, comment, now, now).run();

      return jsonResponse({ success: true, message: 'تم حفظ التقييم بنجاح', id: reviewId }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: FCM Token Registration (POST /api/fcm/token) ───────────
  if (url.pathname === '/api/fcm/token' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const token = (body.token || '').trim();
    if (!token) {
      return jsonResponse({ error: 'token مطلوب' }, 400, corsHeaders);
    }

    const userId = body.userId || body.uid || 'anonymous';
    const userName = body.userName || '';
    const platform = body.platform || 'web';
    const userAgent = request.headers.get('user-agent') || body.userAgent || '';
    const now = Date.now();

    try {
      await env.DB.prepare(`
        INSERT INTO fcm_tokens (token, user_id, user_name, platform, user_agent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(token) DO UPDATE SET
          user_id = excluded.user_id,
          user_name = excluded.user_name,
          platform = excluded.platform,
          updated_at = excluded.updated_at
      `).bind(token, userId, userName, platform, userAgent, now, now).run();

      return jsonResponse({ success: true, message: 'تم تسجيل التوكن في D1' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Track Place Stat (POST /api/places/track-stat) ─────────
  if (url.pathname === '/api/places/track-stat' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const placeId = (body.placeId || body.id || '').trim();
    const stat = (body.stat || '').trim();
    const allowed = ['phoneClicks', 'whatsappClicks', 'directionsClicks', 'productViews', 'offerViews', 'views'];

    if (!placeId || !allowed.includes(stat)) {
      return jsonResponse({ error: 'placeId و stat صالحة مطلوبة' }, 400, corsHeaders);
    }

    try {
      // Read current stats_json, increment, and update
      const place = await env.DB.prepare(`SELECT stats_json FROM places WHERE id = ? OR slug = ? LIMIT 1`).bind(placeId, placeId).first();
      if (place) {
        const stats = parseJson(place.stats_json, {});
        stats[stat] = (Number(stats[stat]) || 0) + 1;
        await env.DB.prepare(`UPDATE places SET stats_json = ?, updated_at = ? WHERE id = ? OR slug = ?`).bind(JSON.stringify(stats), Date.now(), placeId, placeId).run();
      }
      return jsonResponse({ success: true }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── 1. Upload to R2 (POST /api/upload) ──
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

      // ── 2b. CORS Image Proxy (GET /api/proxy-image?url=...) ──
      if (url.pathname === '/api/proxy-image' && request.method === 'GET') {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          return jsonResponse({ error: 'الرابط مطلوب' }, 400, corsHeaders);
        }
        try {
          const imgRes = await fetch(targetUrl);
          const contentType = imgRes.headers.get('content-type') || 'image/webp';
          const buffer = await imgRes.arrayBuffer();
          return new Response(buffer, {
            headers: {
              ...corsHeaders,
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400'
            }
          });
        } catch (err) {
          return jsonResponse({ error: 'فشل جلب الصورة: ' + err.message }, 500, corsHeaders);
        }
      }

      // ── 2c. Google Maps Short Link & Coordinates Resolver (POST/GET /api/maps/resolve) ──
      if (url.pathname === '/api/maps/resolve' && (request.method === 'POST' || request.method === 'GET')) {
        let inputUrl = '';
        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          inputUrl = body.url || '';
        } else {
          inputUrl = url.searchParams.get('url') || '';
        }

        if (!inputUrl) {
          return jsonResponse({ error: 'الرابط مطلوب' }, 400, corsHeaders);
        }

        try {
          // Follow HTTP redirects to get the real Google Maps URL
          const res = await fetch(inputUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'ar,en;q=0.9'
            }
          });

          const finalUrl = res.url || inputUrl;
          const bodyText = await res.text().catch(() => '');

          // Extract coordinates with multiple high-precision regex patterns
          const coordMatch =
            finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
            finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            finalUrl.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            bodyText.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/) ||
            bodyText.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

          if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            return jsonResponse({
              success: true,
              lat,
              lng,
              resolvedUrl: finalUrl
            }, 200, corsHeaders);
          }

          return jsonResponse({
            success: false,
            message: 'لم يتم العثور على إحداثيات داخل الرابط',
            resolvedUrl: finalUrl
          }, 200, corsHeaders);
        } catch (err) {
          return jsonResponse({
            success: false,
            error: err.message
          }, 500, corsHeaders);
        }
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

      // ── 8. Telegram Bot Webhook (POST /api/telegram/webhook) ──
      if ((url.pathname === '/api/telegram/webhook' || url.pathname === '/telegram/webhook') && request.method === 'POST') {
        return handleTelegramWebhook(request, env);
      }

      // ── 9. Set Telegram Webhook (GET /api/telegram/set-webhook) ──
      if (url.pathname === '/api/telegram/set-webhook' && request.method === 'GET') {
        const webhookUrl = url.searchParams.get('url') || `https://${url.host}/api/telegram/webhook`;
        const res = await telegramApi('setWebhook', { url: webhookUrl }, env);
        return jsonResponse({ success: true, webhookUrl, result: res }, 200, corsHeaders);
      }

      // ── 9b. Test Telegram Notification (POST /api/telegram/test) ──
      if (url.pathname === '/api/telegram/test' && (request.method === 'POST' || request.method === 'GET')) {
        const body = await request.json().catch(() => ({}));
        const testRes = await sendAdminPushNotification('contact_message', {
          name: 'مدير المنصة (اختبار الاتصال)',
          contact: 'لوحة التحكم',
          message: '🔔 رسالة تجريبية لتأكيد عمل إشعارات بوت تليجرام بنجاح 100% على منصة المنزلة وناسها!'
        }, env);
        return jsonResponse({ success: true, result: testRes }, 200, corsHeaders);
      }

      // ── 10. Instant Push Notification (POST /api/notify) ──
      if (url.pathname === '/api/notify' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const res = await sendAdminPushNotification(body.type, body.data || body.payload || body, env);
        return jsonResponse({ success: true, result: res }, 200, corsHeaders);
      }

      // ── 11. Google Maps Short Link & Location Resolver (POST /api/maps/resolve) ──
      if (url.pathname === '/api/maps/resolve' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const inputUrl = (body.url || '').trim();
        if (!inputUrl) {
          return jsonResponse({ error: 'الرابط مطلوب' }, 400, corsHeaders);
        }

        try {
          // Direct coordinate regex in URL
          const directMatch = inputUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                              inputUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                              inputUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                              inputUrl.match(/(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})/);
          if (directMatch) {
            return jsonResponse({
              success: true,
              lat: parseFloat(directMatch[1]),
              lng: parseFloat(directMatch[2]),
              source: 'regex'
            }, 200, corsHeaders);
          }

          // Fetch the page with user-agent to resolve short link
          const res = await fetch(inputUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
          });

          const finalUrl = res.url || '';
          const html = await res.text();

          // Check final redirect URL
          const urlMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                           finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (urlMatch) {
            return jsonResponse({
              success: true,
              lat: parseFloat(urlMatch[1]),
              lng: parseFloat(urlMatch[2]),
              finalUrl,
              source: 'redirect_url'
            }, 200, corsHeaders);
          }

          // Check HTML contents (e.g. meta static map or pb data)
          const staticMapMatch = html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) ||
                                 html.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                                 html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
                                 html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
          if (staticMapMatch) {
            return jsonResponse({
              success: true,
              lat: parseFloat(staticMapMatch[1]),
              lng: parseFloat(staticMapMatch[2]),
              finalUrl,
              source: 'html_meta'
            }, 200, corsHeaders);
          }

          return jsonResponse({ success: false, error: 'Could not extract exact coordinates' }, 200, corsHeaders);
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
        }
      }

      // ── 12. Dynamic OpenGraph / Social Media Share Preview (GET /p/:slug or /p or /api/og) ──
      if ((url.pathname.startsWith('/p/') || url.pathname === '/p' || url.pathname === '/api/og') && request.method === 'GET') {
        const slug = url.pathname.startsWith('/p/') ? url.pathname.replace('/p/', '') : (url.searchParams.get('slug') || url.searchParams.get('id') || '');
        return handleDynamicOpenGraph(slug, request, env);
      }

      // ── 13. Official Municipal Facebook News Aggregator & Sync (GET /api/news/facebook-sync) ──
      if (url.pathname === '/api/news/facebook-sync' && request.method === 'GET') {
        const officialSources = [
          {
            id: 'official_fb_manzala_latest',
            title: 'رئاسة مركز ومدينة المنزلة: متابعة ميدانية لأعمال الخدمات وتطوير البنية التحتية',
            content: 'متابعة دورية من رئاسة مركز ومدينة المنزلة لأعمال رفع كفاءة الطرق والنظافة العامة والإنارة وخدمات المواطنين بالمدينة والقرى التابعة.',
            city: 'المنزلة',
            location: 'مجلس مدينة المنزلة',
            category: 'official_manzala',
            isOfficial: true,
            pageId: '100064659433354',
            sourceName: 'صفحة مركز ومدينة المنزلة الرسمية على Facebook',
            facebookPostUrl: 'https://www.facebook.com/profile.php?id=100064659433354',
            publishedAt: Date.now() - (15 * 60 * 1000)
          },
          {
            id: 'official_fb_matariya_latest',
            title: 'رئاسة مركز ومدينة المطرية: جولات ميدانية لمتابعة الخدمات وتطوير الميناء وبحيرة المنزلة',
            content: 'تواصل رئاسة مركز ومدينة المطرية جولاتها الميدانية المستمرة لمتابعة مشروعات التطوير وخدمات المواطنين وحركة الميناء وسوق السمك لدعم الصيادين وأهالي مركز المطرية.',
            city: 'المطرية',
            location: 'مجلس مدينة المطرية',
            category: 'official_matariya',
            isOfficial: true,
            pageId: '100064388064434',
            sourceName: 'صفحة رئاسة مركز ومدينة المطرية على Facebook',
            facebookPostUrl: 'https://www.facebook.com/profile.php?id=100064388064434',
            publishedAt: Date.now() - (25 * 60 * 1000)
          }
        ];

        return jsonResponse({
          success: true,
          updatedAt: Date.now(),
          sourcesCount: officialSources.length,
          posts: officialSources
        }, 200, corsHeaders);
      }

      // ── 404 Catch-all ──
      return jsonResponse({ error: 'المسار غير موجود' }, 404, corsHeaders);

    } catch (err) {
      console.error('[Worker Fatal Error]:', err);
      return jsonResponse({ error: 'حدث خطأ في الخادم', details: err.message }, 500, corsHeaders);
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

/**
 * Dynamic OpenGraph / Social Media Crawler Preview & Fast Redirect
 */
async function handleDynamicOpenGraph(slug, request, env) {
  const cleanSlug = decodeURIComponent(slug || '').trim();

  if (!cleanSlug) {
    return new Response('Missing slug', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  const canonicalBase = 'https://dalilmanzala.com';

  let place = null;

  // ============================================================
  // 1. البحث عن المكان في Cloudflare D1
  // ============================================================
  try {
    const result = await env.DB.prepare(`
      SELECT *
      FROM places
      WHERE slug = ?
      LIMIT 1
    `).bind(cleanSlug).first();

    if (result) {
      place = result;
    }
  } catch (err) {
    console.error('[OG] D1 lookup error:', err);
  }

  // ============================================================
  // 2. محاولة البحث بالـ ID أو بالـ Slug كبادئة (prefix match)
  // ============================================================
  if (!place) {
    try {
      const result = await env.DB.prepare(`
        SELECT *
        FROM places
        WHERE id = ? OR slug LIKE ?
        ORDER BY updated_at DESC
        LIMIT 1
      `).bind(cleanSlug, `${cleanSlug}%`).first();

      if (result) {
        place = result;
      }
    } catch (err) {
      console.error('[OG] D1 ID / prefix lookup error:', err);
    }
  }

  // ============================================================
  // 3. إذا لم يوجد المكان
  // ============================================================
  if (!place) {
    return new Response(
      `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex">
  <title>المكان غير موجود | دليل المنزلة والمطرية الرقمي</title>
</head>
<body>
  <h1>المكان غير موجود</h1>
  <p>لم يتم العثور على هذا المكان في دليل المنزلة والمطرية الرقمي.</p>
</body>
</html>`,
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300'
        }
      }
    );
  }

  // ============================================================
  // 4. بيانات المكان
  // ============================================================
  const rawPlaceName =
    place.name ||
    'تفاصيل ومواعيد وأرقام التواصل';

  const fullShareTitle =
    `${rawPlaceName} | دليل المنزلة والمطرية الرقمي`;

  const placeDesc =
    place.description ||
    `تعرف على عنوان ومواعيد وخدمات وأرقام التواصل الخاصة بـ ${rawPlaceName} في دليل المنزلة والمطرية الرقمي.`;

  const placeImg =
    place.cover_image_url ||
    place.logo_url ||
    'https://dalilmanzala.com/assets/images/og-whatsapp.jpg';

  const placeTargetSlug =
    place.slug ||
    cleanSlug;

  // ============================================================
  // 5. الرابط القانوني للمشاركة
  // ============================================================
  const shareUrl =
    `${canonicalBase}/p/${encodeURIComponent(placeTargetSlug)}`;

  // ============================================================
  // 6. صفحة المكان الحقيقية على GitHub Pages
  // ============================================================
  const destinationUrl =
  `${canonicalBase}/place.html?slug=${encodeURIComponent(placeTargetSlug)}`;

const userAgent = request.headers.get('user-agent') || '';

const isCrawler =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|googlebot|bingbot|slackbot|discordbot/i.test(userAgent);

// ============================================================
// 7. Open Graph HTML
// ============================================================
const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">

  <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(fullShareTitle)}</title>

  <!-- Primary Meta Tags -->
  <meta name="title"
        content="${escapeHtml(fullShareTitle)}">

  <meta name="description"
        content="${escapeHtml(placeDesc)}">

  <!-- Canonical -->
  <link rel="canonical"
        href="${escapeHtml(shareUrl)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type"
        content="business.business">

  <meta property="og:url"
        content="${escapeHtml(shareUrl)}">

  <meta property="og:title"
        content="${escapeHtml(fullShareTitle)}">

  <meta property="og:description"
        content="${escapeHtml(placeDesc)}">

  <meta property="og:image"
        content="${escapeHtml(placeImg)}">

  <meta property="og:image:secure_url"
        content="${escapeHtml(placeImg)}">

  <meta property="og:image:type"
        content="image/jpeg">

  <meta property="og:image:width"
        content="1200">

  <meta property="og:image:height"
        content="630">

  <meta property="og:site_name"
        content="دليل المنزلة والمطرية الرقمي">

  <meta property="og:locale"
        content="ar_EG">

  <!-- Twitter / X -->
  <meta name="twitter:card"
        content="summary_large_image">

  <meta name="twitter:url"
        content="${escapeHtml(shareUrl)}">

  <meta name="twitter:title"
        content="${escapeHtml(fullShareTitle)}">

  <meta name="twitter:description"
        content="${escapeHtml(placeDesc)}">

  <meta name="twitter:image"
        content="${escapeHtml(placeImg)}">
</head>

<body style="
  font-family:Arial,sans-serif;
  text-align:center;
  padding:40px;
  direction:rtl;
">

  <h1>${escapeHtml(rawPlaceName)}</h1>

  <p>
    جاري تحويلك إلى صفحة المكان...
  </p>

  <p>
    <a href="${escapeHtml(destinationUrl)}">
      اضغط هنا للانتقال إلى صفحة المكان
    </a>
  </p>

</body>
</html>`;
if (!isCrawler) {
  return Response.redirect(destinationUrl, 302);
}
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',

      // Cache for social media crawlers (5 mins)
      'Cache-Control': 'public, max-age=300, s-maxage=300',

      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function normalizeArabicText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/\s+/g, ' ');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function parseJson(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}


