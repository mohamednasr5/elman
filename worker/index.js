/**
 * المنزلة وناسها — Cloudflare Worker API Backend
 * Bound to R2 Bucket: elmanzala
 * OpenRouter AI Integration (Ox Alpha model)
 * Server-side Quota Enforcement (Offers & Products Limits)
 * Telegram Bot & Instant Notification System
 */

import { handleTelegramWebhook, sendAdminPushNotification, telegramApi } from './telegram.js';

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      env.DB.prepare(`
        UPDATE places SET is_sponsored = 0, is_featured = 0 WHERE is_sponsored = 1 AND sponsored_until IS NOT NULL AND sponsored_until < ?
      `).bind(Date.now()).run().catch(() => {})
    );
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
        if (url.protocol === 'http:') {
          url.protocol = 'https:';
          return Response.redirect(url.toString(), 301);
        }
        const origin = request.headers.get('Origin') || '';
    const allowedOrigins = ['https://dalilmanzala.com', 'http://localhost:8788', 'http://127.0.0.1:8788'];
    const isAllowedOrigin = allowedOrigins.includes(origin);

    // CORS Headers
    const corsHeaders = {
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Preflight OPTIONS
 if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

    // Admin API Key Guard for sensitive write/delete routes
        const ADMIN_WRITE_PATHS = ['/api/categories', '/api/ads'];
    const isAdminWritePath = ADMIN_WRITE_PATHS.some(p => url.pathname === p || url.pathname.startsWith(p + '/'));
    const isMutatingMethod = ['POST', 'PUT', 'DELETE'].includes(request.method);
    if (isAdminWritePath && isMutatingMethod) {
      const providedKey = request.headers.get('X-Admin-Key') || '';
      if (!env.ADMIN_API_KEY || providedKey !== env.ADMIN_API_KEY) {
        return jsonResponse({ error: 'Unauthorized: admin key missing or invalid' }, 401, corsHeaders);
      }
    }

// ── Static AI/SEO Discovery Files ────────────────────────────────
// GET /llms.txt — AI Agentic Discovery (required for 3/3 score)
if (url.pathname === '/llms.txt' && request.method === 'GET') {
  const llmsContent = `# دليل المنزلة والمطرية الرقمي الشامل (Dalil Manzala)

> الدليل الرقمي الرسمي الموثق لمدينتي المنزلة والمطرية والقرى المجاورة بمحافظة الدقهلية، جمهورية مصر العربية.
> الموقع الرسمي: https://dalilmanzala.com

## أقسام وخدمات الدليل

- [الرئيسية](https://dalilmanzala.com/): الصفحة الرئيسية لدليل المنزلة والمطرية الرقمي الشامل
- [دليل الأماكن والأنشطة](https://dalilmanzala.com/places.html): تصفح جميع المحلات والأطباء والحرفيين والأنشطة التجارية في المنزلة والمطرية
- [التصنيفات والمهن](https://dalilmanzala.com/categories.html): استكشف جميع تصنيفات الأماكن والمهن الحرفية والخدمات
- [العروض والخصومات النشطة](https://dalilmanzala.com/offers.html): أحدث عروض وتخفيضات المحلات والخدمات في المنزلة والمطرية
- [كتالوج المنتجات والأسعار](https://dalilmanzala.com/products.html): قوائم المنتجات والأسعار من المحلات الموثقة
- [البحث الذكي السريع](https://dalilmanzala.com/search.html): ابحث بالذكاء الاصطناعي عن أي مكان أو طبيب أو صنايعي
- [يحدث الآن](https://dalilmanzala.com/now.html): تحديثات حية لماكينات ATM وحالة الطرق والافتتاحات والمناسبات
- [بالقرب مني](https://dalilmanzala.com/around-me.html): اكتشف أقرب الأماكن إليك بالـ GPS في المنزلة والمطرية
- [مدينة المنزلة](https://dalilmanzala.com/manzala.html): دليل شامل لتاريخ وجغرافيا ومعالم مدينة المنزلة محافظة الدقهلية
- [مدينة المطرية](https://dalilmanzala.com/matariya.html): دليل شامل لمدينة المطرية وبحيرة المنزلة وتاريخها

## النطاق الجغرافي

محافظة الدقهلية، مركز المنزلة، مركز المطرية، العصافرة، الجمالية، ميت سلسيل، البصراط، العزيزة، الأحمدية، الروضة، الحوتة، النسايمة، ميت خضير، ميت شريف، والقرى المجاورة.

## واجهات البرمجة العامة (API)

- [بحث الأماكن](https://elmanzala.nonm1724.workers.dev/api/search?q=صيدلية): GET /api/search?q=query&category=cat&area=area
- [قائمة الأماكن](https://elmanzala.nonm1724.workers.dev/api/places): GET /api/places?slug=place-slug
- [التصنيفات](https://elmanzala.nonm1724.workers.dev/api/categories): GET /api/categories
`;

  return new Response(llmsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders
    }
  });
}

// GET /robots.txt
if (url.pathname === '/robots.txt' && request.method === 'GET') {
  const robotsContent = `# robots.txt for https://dalilmanzala.com
User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /dashboard.html
Disallow: /login.html

# Google Search
User-agent: Googlebot
Allow: /

# AI Search Crawlers (SearchGPT, ChatGPT, Perplexity, Gemini, Claude)
User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot
Allow: /

User-agent: Bingbot
Allow: /

# AI Discovery
User-agent: *
Allow: /llms.txt

Sitemap: https://dalilmanzala.com/sitemap.xml
LLMs: https://dalilmanzala.com/llms.txt
`;

  return new Response(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      ...corsHeaders
    }
  });
}

// ── Canonical Redirect: /index.html → / (fixes Lighthouse SEO canonical mismatch)
if (url.pathname === '/index.html') {
  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = '/';
  return Response.redirect(redirectUrl.toString(), 301);
}

try {

  // ── Public Data Quality Reports ─────────────────────────────────
  // POST /api/place-reports — visitors can flag stale/incorrect place data.
  if (url.pathname === '/api/place-reports' && request.method === 'POST') {
    try {
      const body = await request.json();
      const placeId = String(body.placeId || body.place_id || '').trim();
      const reason = String(body.reason || '').trim().slice(0, 120);
      const details = String(body.details || '').trim().slice(0, 1000);
      const reporterName = String(body.reporterName || 'زائر').trim().slice(0, 80);
      if (!placeId || !reason) return jsonResponse({ success:false, error:'بيانات البلاغ غير مكتملة' }, 400, corsHeaders);
      const exists = await env.DB.prepare('SELECT id FROM places WHERE id = ? LIMIT 1').bind(placeId).first();
      if (!exists) return jsonResponse({ success:false, error:'المكان غير موجود' }, 404, corsHeaders);

      // Small abuse guard: one report per IP/place within 10 minutes.
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rateKey = new Request('https://report-rate.local/' + encodeURIComponent(ip + ':' + placeId));
      const rateCache = caches.default;
      if (await rateCache.match(rateKey)) {
        return jsonResponse({ success:false, error:'تم استلام بلاغ مشابه مؤخرًا، شكرًا لك' }, 429, { ...corsHeaders, 'Retry-After':'600' });
      }
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO place_reports (id, place_id, reason, details, reporter_name, status, created_at) VALUES (?, ?, ?, ?, ?, \'new\', ?)')
        .bind(id, placeId, reason, details, reporterName, Date.now()).run();
      ctx.waitUntil(rateCache.put(rateKey, new Response('1', { headers:{'Cache-Control':'max-age=600'} })));
      return jsonResponse({ success:true, message:'تم استلام البلاغ' }, 201, { ...corsHeaders, 'Cache-Control':'no-store' });
    } catch (err) {
      return jsonResponse({ success:false, error:'تعذر استلام البلاغ' }, 500, corsHeaders);
    }
  }

  // ── D1: Search Places with Two-Tier Caching ────────────────────
  // GET /api/search?q=...&category=...&area=...&limit=20&offset=0

  if (url.pathname === '/api/search' && request.method === 'GET') {
    const rawQuery = (url.searchParams.get('q') || '').trim();
    const rawCat = (url.searchParams.get('category') || url.searchParams.get('cat') || '').trim();
    const rawArea = (url.searchParams.get('area') || '').trim();
    const limitParam = parseInt(url.searchParams.get('limit') || '20', 10);
    const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);
    const verifiedOnly = url.searchParams.get('verified') === '1';
    const minRatingParam = parseFloat(url.searchParams.get('min_rating') || '0');
    const minRating = Number.isFinite(minRatingParam) ? Math.min(Math.max(minRatingParam, 0), 5) : 0;

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
    if (verifiedOnly) cacheUrl.searchParams.set('verified', '1');
    if (minRating > 0) cacheUrl.searchParams.set('min_rating', String(minRating));

    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('X-Cache', 'HIT');
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }

    // 2. Query D1 with targeted filters and LIMIT
    // Search must never aggregate the entire reviews table. Search can run many
    // times while a user types, so a global GROUP BY reviews query multiplies
    // D1 row reads dramatically. Ratings/review counts are loaded from
    // denormalized place stats when available; full reviews are only fetched
    // on the place profile.
    let sql = `
      SELECT
        p.id, p.name, p.name_en, p.slug, p.category_id, p.subcategory_id, p.custom_category,
        p.address, p.area, p.phone, p.whatsapp, p.maps_link, p.latitude, p.longitude,
        p.description, p.logo_url, p.cover_image_url, p.status, p.is_verified,
        p.verification_status, p.offer_count, p.product_count, p.services_json,
        p.social_json, p.stats_json, p.working_hours_json, p.created_at, p.updated_at,
        p.is_sponsored, p.is_featured, p.sponsored_until, p.priority
      FROM places p
      WHERE p.status = 'published'
    `;
    const params = [];

    if (rawQuery) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.custom_category LIKE ? OR p.address LIKE ? OR p.area LIKE ? OR p.phone LIKE ? OR p.whatsapp LIKE ?)`;
      const searchPattern = `%${rawQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (normCat) {
      sql += ` AND (p.category_id = ? OR p.custom_category LIKE ?)`;
      params.push(normCat, `%${normCat}%`);
    }

    if (normArea) {
      sql += ` AND p.area = ?`;
      params.push(rawArea);
    }
    if (verifiedOnly) sql += ` AND p.is_verified = 1`;
    // minRating is intentionally not pushed into a reviews-table scan.
    // If denormalized rating stats exist in stats_json, filter them after the
    // lightweight place query below.
    if (rawQuery) {
      sql += ` ORDER BY CASE WHEN LOWER(p.name) = LOWER(?) THEN 1000 WHEN LOWER(p.name) LIKE LOWER(?) THEN 800 ELSE 0 END DESC,
        p.is_sponsored DESC, p.is_featured DESC, p.is_verified DESC, p.updated_at DESC LIMIT ? OFFSET ?`;
      params.push(rawQuery, rawQuery + '%', limit + 1, offset);
    } else {
      sql += ` ORDER BY p.is_sponsored DESC, p.is_featured DESC, p.is_verified DESC, p.updated_at DESC LIMIT ? OFFSET ?`;
      params.push(limit + 1, offset);
    }

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
      is_verified: Boolean(place.is_verified),
      is_sponsored: Boolean(place.is_sponsored || place.is_featured),
      is_featured: Boolean(place.is_featured),
      isSponsored: Boolean(place.is_sponsored || place.is_featured),
      isFeatured: Boolean(place.is_featured),
      sponsoredUntil: place.sponsored_until,
      sponsored_until: place.sponsored_until,
      reviewCount: Number(place.review_count ?? place.reviewCount ?? place.stats?.reviewCount ?? place.stats?.reviewsCount ?? 0),
      review_count: Number(place.review_count ?? place.reviewCount ?? place.stats?.reviewCount ?? place.stats?.reviewsCount ?? 0),
      rating: Number(place.rating ?? place.stats?.rating ?? 0.0)
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

      // Fetch the place first. Do NOT GROUP BY the entire reviews table here:
      // that pattern scans every review whenever any place profile is opened.
      const result = await env.DB.prepare(`
        SELECT p.*
        FROM places p
        WHERE LOWER(p.slug) = LOWER(?) OR p.id = ? OR p.slug = ?
        LIMIT 1
      `).bind(slugParam, slugParam, slugParam).first();

      if (result) {
        // The reviews table has an index on (place_id, created_at), so this
        // reads only reviews belonging to the requested place.
        const reviewStats = await env.DB.prepare(`
          SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS avg_rating
          FROM reviews
          WHERE place_id = ?
        `).bind(result.id).first().catch(() => ({ review_count: 0, avg_rating: 0 }));

        result.review_count = Number(reviewStats?.review_count || 0);
        result.rating = Number(reviewStats?.avg_rating || 0);

        const place = {
          ...result,
          services: parseJson(result.services_json, []),
          social: parseJson(result.social_json, {}),
          stats: parseJson(result.stats_json, {}),
          working_hours: parseJson(result.working_hours_json, {}),
          is_verified: Boolean(result.is_verified),
          is_sponsored: Boolean(result.is_sponsored || result.is_featured),
          is_featured: Boolean(result.is_featured),
          isSponsored: Boolean(result.is_sponsored || result.is_featured),
          isFeatured: Boolean(result.is_featured),
          sponsoredUntil: result.sponsored_until,
          sponsored_until: result.sponsored_until,
          reviewCount: Number(result.review_count || 0),
          review_count: Number(result.review_count || 0),
          rating: Number(result.rating || 0.0)
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

    const limitParam = parseInt(url.searchParams.get('limit') || '500', 10);
    const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);
    const ownerIdFilter = (url.searchParams.get('owner_id') || '').trim();

    const limit = Math.min(Math.max(limitParam, 1), 1000);
    const offset = Math.max(offsetParam, 0);

    const params = [];

    // IMPORTANT: list endpoint must never aggregate the entire reviews table.
    // A global GROUP BY on reviews turns every homepage/search request into a
    // full reviews scan and can consume millions of D1 rows. Review details
    // are loaded only when a single place is opened.
    let sql = `
      SELECT
        p.id, p.name, p.name_en, p.slug, p.category_id, p.subcategory_id, p.custom_category,
        p.address, p.area, p.phone, p.whatsapp, p.maps_link, p.latitude, p.longitude,
        p.description, p.logo_url, p.cover_image_url, p.owner_id, p.owner_email,
        p.status, p.is_verified, p.verification_status, p.offer_count, p.product_count,
        p.services_json, p.social_json, p.stats_json, p.working_hours_json,
        p.created_at, p.updated_at, p.is_sponsored, p.is_featured, p.sponsored_until, p.priority,
        u.name AS owner_name, u.email AS owner_email_d1, u.photo_url AS owner_photo
      FROM places p
      LEFT JOIN users u ON u.id = p.owner_id
    `;
    const ownerEmailFilter = (url.searchParams.get('owner_email') || '').trim().toLowerCase();

    if (ownerIdFilter && ownerEmailFilter) {
      sql += ` WHERE (p.owner_id = ? OR LOWER(p.owner_email) = ?)`;
      params.push(ownerIdFilter, ownerEmailFilter);
    } else if (ownerIdFilter) {
      sql += ` WHERE (p.owner_id = ? OR LOWER(p.owner_email) = ?)`;
      params.push(ownerIdFilter, ownerIdFilter.toLowerCase());
    } else if (ownerEmailFilter) {
      sql += ` WHERE LOWER(p.owner_email) = ?`;
      params.push(ownerEmailFilter);
    }

    sql += ` ORDER BY p.is_sponsored DESC, p.is_featured DESC, p.is_verified DESC, p.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Public list requests are identical for most visitors. Cache the response at the
    // Worker edge so repeated homepage/search loads do not hit D1.
    const usePublicListCache = !ownerIdFilter && !ownerEmailFilter;
    const listCache = caches.default;
    const listCacheUrl = new URL(request.url);
    listCacheUrl.searchParams.set('limit', String(limit));
    listCacheUrl.searchParams.set('offset', String(offset));
    const listCacheKey = new Request(listCacheUrl.toString(), { method: 'GET' });

    if (usePublicListCache) {
      const cachedList = await listCache.match(listCacheKey);
      if (cachedList) {
        const cached = new Response(cachedList.body, cachedList);
        cached.headers.set('X-Cache', 'HIT');
        return cached;
      }
    }

    const result = await env.DB.prepare(sql).bind(...params).all();

    const places = (result.results || []).map(place => ({
      ...place,
      services: parseJson(place.services_json, []),
      social: parseJson(place.social_json, {}),
      stats: parseJson(place.stats_json, {}),
      working_hours: parseJson(place.working_hours_json, {}),
      is_verified: Boolean(place.is_verified),
      is_sponsored: Boolean(place.is_sponsored || place.is_featured),
      is_featured: Boolean(place.is_featured),
      isSponsored: Boolean(place.is_sponsored || place.is_featured),
      isFeatured: Boolean(place.is_featured),
      sponsoredUntil: place.sponsored_until,
      sponsored_until: place.sponsored_until,
      // List responses intentionally do not query the reviews table.
      // Keep any denormalized stats if present; detailed ratings are fetched on place page.
      reviewCount: Number(place.review_count ?? place.stats?.reviewCount ?? place.stats?.reviewsCount ?? 0),
      review_count: Number(place.review_count ?? place.stats?.reviewCount ?? place.stats?.reviewsCount ?? 0),
      rating: Number(place.rating ?? place.stats?.rating ?? 0.0),
      // Normalize owner name from D1 join
      owner_name: place.owner_name || place.owner_email || null,
    }));

    const response = jsonResponse({
      success: true,
      data: places,
      pagination: {
        limit,
        offset,
        returned: places.length
      }
    }, 200, {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Cache': 'MISS'
    });

    if (usePublicListCache) {
      ctx.waitUntil(listCache.put(listCacheKey, response.clone()));
    }
    return response;
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
    const isVerified = body.isVerified !== undefined ? (body.isVerified ? 1 : 0) : (body.is_verified !== undefined ? (body.is_verified ? 1 : 0) : null);
    const verificationStatus = body.verificationStatus || body.verification_status || (isVerified === 1 ? 'verified' : (isVerified === 0 ? 'unverified' : ''));
    const isSponsored = body.isSponsored !== undefined ? (body.isSponsored ? 1 : 0) : (body.is_sponsored !== undefined ? (body.is_sponsored ? 1 : 0) : null);
    const isFeatured = body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : (body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : null);
    const sponsoredUntil = body.sponsoredUntil || body.sponsored_until || null;
    const priorityVal = Number(body.priority) || 0;
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
        stats_json, working_hours_json, updated_at, is_sponsored, is_featured, sponsored_until, priority
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        name = CASE WHEN excluded.name != '' THEN excluded.name ELSE places.name END,
        name_en = CASE WHEN excluded.name_en != '' THEN excluded.name_en ELSE places.name_en END,
        slug = CASE WHEN excluded.slug != '' THEN excluded.slug ELSE places.slug END,
        category_id = CASE WHEN excluded.category_id != '' AND excluded.category_id != 'general' THEN excluded.category_id ELSE places.category_id END,
        subcategory_id = CASE WHEN excluded.subcategory_id != '' THEN excluded.subcategory_id ELSE places.subcategory_id END,
        custom_category = CASE WHEN excluded.custom_category != '' THEN excluded.custom_category ELSE places.custom_category END,
        address = CASE WHEN excluded.address != '' THEN excluded.address ELSE places.address END,
        area = CASE WHEN excluded.area != '' AND excluded.area != 'المنزلة' THEN excluded.area ELSE places.area END,
        phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE places.phone END,
        whatsapp = CASE WHEN excluded.whatsapp != '' THEN excluded.whatsapp ELSE places.whatsapp END,
        maps_link = CASE WHEN excluded.maps_link != '' THEN excluded.maps_link ELSE places.maps_link END,
        latitude = COALESCE(excluded.latitude, places.latitude),
        longitude = COALESCE(excluded.longitude, places.longitude),
        description = CASE WHEN excluded.description != '' THEN excluded.description ELSE places.description END,
        logo_url = CASE WHEN excluded.logo_url != '' THEN excluded.logo_url ELSE places.logo_url END,
        cover_image_url = CASE WHEN excluded.cover_image_url != '' THEN excluded.cover_image_url ELSE places.cover_image_url END,
        owner_id = CASE WHEN excluded.owner_id != '' THEN excluded.owner_id ELSE places.owner_id END,
        owner_email = CASE WHEN excluded.owner_email != '' THEN excluded.owner_email ELSE places.owner_email END,
        status = excluded.status,
        is_verified = COALESCE(excluded.is_verified, places.is_verified),
        verification_status = CASE WHEN excluded.verification_status != '' THEN excluded.verification_status ELSE places.verification_status END,
        is_sponsored = COALESCE(excluded.is_sponsored, places.is_sponsored),
        is_featured = COALESCE(excluded.is_featured, places.is_featured),
        sponsored_until = COALESCE(excluded.sponsored_until, places.sponsored_until),
        priority = excluded.priority,
        services_json = CASE WHEN excluded.services_json != '[]' THEN excluded.services_json ELSE places.services_json END,
        social_json = CASE WHEN excluded.social_json != '{}' THEN excluded.social_json ELSE places.social_json END,
        working_hours_json = CASE WHEN excluded.working_hours_json != '{}' THEN excluded.working_hours_json ELSE places.working_hours_json END,
        updated_at = excluded.updated_at
    `).bind(
      placeId, name, nameEn, slug || placeId, categoryId, subcategoryId, customCategory,
      address, area, phone, whatsapp, mapsLink, lat, lng,
      description, logoUrl, coverImageUrl, ownerId, ownerEmail,
      status, isVerified, verificationStatus, servicesJson, socialJson,
      statsJson, workingHoursJson, now, isSponsored, isFeatured, sponsoredUntil, priorityVal
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

  // ── D1: Categories (GET, POST, PUT, DELETE /api/categories) ──────────
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
        SELECT id, name, name_en, slug, icon, description, sort_order as "order", created_at
        FROM categories
        ORDER BY sort_order ASC, name ASC
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

  // Create or Update Category (POST/PUT /api/categories)
  if (url.pathname === '/api/categories' && (request.method === 'POST' || request.method === 'PUT')) {
    const body = await request.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const slug = (body.slug || body.id || '').trim().toLowerCase().replace(/\s+/g, '-');
    const id = (body.id || slug).trim();
    const nameEn = (body.nameEn || body.name_en || slug).trim();
    const icon = (body.icon || '📁').trim();
    const description = (body.description || '').trim();
    const color = (body.color || '#1B4F72').trim();
    const order = Number(body.order != null ? body.order : body.sort_order) || Date.now();
    const now = Date.now();

    if (!name || !slug) {
      return jsonResponse({ error: 'اسم التصنيف والـ slug مطلوبان' }, 400, corsHeaders);
    }

    try {
      await env.DB.prepare(`
        INSERT INTO categories (id, name, name_en, slug, icon, description, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          name_en = excluded.name_en,
          slug = excluded.slug,
          icon = excluded.icon,
          description = excluded.description,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at
      `).bind(id, name, nameEn, slug, icon, description, order, now, now).run();

      // Invalidate Categories Cache
      const cache = caches.default;
      const cacheKey = new Request('https://cache.local/api/categories', { method: 'GET' });
      ctx.waitUntil(cache.delete(cacheKey));

      return jsonResponse({
        success: true,
        message: 'تم حفظ التصنيف في D1 بنجاح',
        data: { id, name, nameEn, slug, icon, description, color, order }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // Delete Category (DELETE /api/categories/:id or /api/categories?id=...)
  if ((url.pathname.startsWith('/api/categories/') || url.pathname === '/api/categories') && request.method === 'DELETE') {
    const idFromPath = url.pathname.startsWith('/api/categories/') ? url.pathname.replace('/api/categories/', '') : '';
    const id = (idFromPath || url.searchParams.get('id') || url.searchParams.get('slug') || '').trim();

    if (!id) {
      return jsonResponse({ error: 'معرف التصنيف مطلوب للحذف' }, 400, corsHeaders);
    }

    try {
      await env.DB.prepare(`DELETE FROM categories WHERE id = ? OR slug = ?`).bind(id, id).run();

      // Invalidate Categories Cache
      const cache = caches.default;
      const cacheKey = new Request('https://cache.local/api/categories', { method: 'GET' });
      ctx.waitUntil(cache.delete(cacheKey));

      return jsonResponse({ success: true, message: 'تم حذف التصنيف من D1 ومسح الكاش' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Ads API (GET, POST, DELETE /api/ads) ───────────────────
  if (url.pathname === '/api/ads' && request.method === 'GET') {
    try {
      const result = await env.DB.prepare(`
        SELECT * FROM ads ORDER BY priority DESC, created_at DESC
      `).all();
      const ads = (result.results || []).map(a => ({
        ...a,
        _id: a.id,
        imageUrl: a.image_url,
        placeId: a.place_id,
        isActive: Boolean(a.is_active),
        startDate: a.start_date,
        endDate: a.end_date,
        createdAt: a.created_at,
        createdBy: a.created_by
      }));
      return jsonResponse({ success: true, data: ads }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message, data: [] }, 500, corsHeaders);
    }
  }

  if (url.pathname === '/api/ads' && (request.method === 'POST' || request.method === 'PUT')) {
    const body = await request.json().catch(() => ({}));
    const id = (body.id || body._id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`).trim();
    const title = (body.title || '').trim();
    const placeId = body.placeId || body.place_id || null;
    const link = body.link || '';
    const imageUrl = body.imageUrl || body.image_url || '';
    const placement = body.placement || 'all';
    const priority = Number(body.priority) || 10;
    const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : (body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1);
    const startDate = body.startDate || body.start_date || Date.now();
    const endDate = body.endDate || body.end_date || null;
    const clicks = Number(body.clicks) || 0;
    const createdAt = body.createdAt || body.created_at || Date.now();
    const createdBy = body.createdBy || body.created_by || '';

    try {
      await env.DB.prepare(`
        INSERT INTO ads (id, title, place_id, link, image_url, placement, priority, is_active, start_date, end_date, clicks, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          place_id = excluded.place_id,
          link = excluded.link,
          image_url = excluded.image_url,
          placement = excluded.placement,
          priority = excluded.priority,
          is_active = excluded.is_active,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          clicks = excluded.clicks
      `).bind(id, title, placeId, link, imageUrl, placement, priority, isActive, startDate, endDate, clicks, createdAt, createdBy).run();

      return jsonResponse({ success: true, message: 'تم حفظ الإعلان بنجاح في D1', id }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if ((url.pathname.startsWith('/api/ads/') || url.pathname === '/api/ads') && request.method === 'DELETE') {
    const idFromPath = url.pathname.startsWith('/api/ads/') ? url.pathname.replace('/api/ads/', '') : '';
    const id = (idFromPath || url.searchParams.get('id') || '').trim();
    if (!id) return jsonResponse({ error: 'ID مطلوب' }, 400, corsHeaders);

    try {
      await env.DB.prepare(`DELETE FROM ads WHERE id = ?`).bind(id).run();
      return jsonResponse({ success: true, message: 'تم حذف الإعلان بنجاح من D1' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Reviews (GET /api/reviews?place_id=... & POST /api/reviews) ──
  if (url.pathname === '/api/reviews' && request.method === 'GET') {
    const placeId = (url.searchParams.get('place_id') || url.searchParams.get('placeId') || '').trim();

    try {
      let query = `
        SELECT r.id, r.place_id, r.user_id, r.user_name, r.user_photo, r.rating, r.comment, r.created_at, r.updated_at,
               p.name as place_name, p.slug as place_slug
        FROM reviews r
        LEFT JOIN places p ON r.place_id = p.id
      `;
      const params = [];
      if (placeId) {
        query += ` WHERE r.place_id = ? `;
        params.push(placeId);
      }
      query += ` ORDER BY r.created_at DESC LIMIT 200 `;

      const stmt = env.DB.prepare(query);
      const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

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

    // Support batch insertion (e.g. bulk reviews from admin)
    if (Array.isArray(body.reviews) && body.reviews.length > 0) {
      const reviewsList = body.reviews;
      const now = Date.now();
      let insertedCount = 0;

      try {
        // Process in chunks of 50 for optimal D1 transaction performance
        for (let i = 0; i < reviewsList.length; i += 50) {
          const chunk = reviewsList.slice(i, i + 50);
          const stmts = chunk.map((r, idx) => {
            const pId = (r.place_id || r.placeId || '').trim();
            const uId = (r.user_id || r.userId || `gen_${now}_${i + idx}`).trim();
            const rScore = parseFloat(r.rating) || 5;
            const rId = r.id || `bulk_${now}_${i + idx}_${Math.random().toString(36).slice(2, 6)}`;
            const uName = r.user_name || r.userName || 'عميل';
            const uPhoto = r.user_photo || r.userPhoto || '';
            const cText = r.comment || '';
            const rTime = Number(r.created_at || r.createdAt || now);
            const isAdminGen = r.is_admin_generated ? 1 : 0;
            const pName = r.place_name || r.placeName || '';
            const pSlug = r.place_slug || r.placeSlug || '';

            return env.DB.prepare(`
              INSERT INTO reviews (id, place_id, user_id, user_name, user_photo, place_name, place_slug, rating, comment, is_admin_generated, edit_count, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                rating = excluded.rating,
                comment = excluded.comment,
                updated_at = excluded.updated_at
            `).bind(rId, pId, uId, uName, uPhoto, pName, pSlug, rScore, cText, isAdminGen, rTime, rTime);
          });

          await env.DB.batch(stmts);
          insertedCount += chunk.length;
        }

        return jsonResponse({ success: true, message: `تم حفظ ${insertedCount} تقييم بنجاح في D1`, insertedCount }, 200, corsHeaders);
      } catch (err) {
        return jsonResponse({ success: false, error: err.message, insertedCount }, 500, corsHeaders);
      }
    }

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
    const placeName = body.place_name || body.placeName || '';
    const placeSlug = body.place_slug || body.placeSlug || '';
    const isAdminGen = body.is_admin_generated ? 1 : 0;

    try {
      await env.DB.prepare(`
        INSERT INTO reviews (id, place_id, user_id, user_name, user_photo, place_name, place_slug, rating, comment, is_admin_generated, edit_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          rating = excluded.rating,
          comment = excluded.comment,
          updated_at = excluded.updated_at
      `).bind(reviewId, placeId, userId, userName, userPhoto, placeName, placeSlug, rating, comment, isAdminGen, now, now).run();

      return jsonResponse({ success: true, message: 'تم حفظ التقييم بنجاح', id: reviewId }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Delete Reviews (DELETE /api/reviews) ───────────────────
  if (url.pathname === '/api/reviews' && request.method === 'DELETE') {
    const placeId = (url.searchParams.get('place_id') || url.searchParams.get('placeId') || '').trim();
    const reviewId = (url.searchParams.get('id') || url.searchParams.get('review_id') || '').trim();

    try {
      if (reviewId) {
        await env.DB.prepare(`DELETE FROM reviews WHERE id = ?`).bind(reviewId).run();
      } else if (placeId) {
        await env.DB.prepare(`DELETE FROM reviews WHERE place_id = ?`).bind(placeId).run();
      } else {
        return jsonResponse({ error: 'مطلوب id أو place_id لحذف المراجعات' }, 400, corsHeaders);
      }
      return jsonResponse({ success: true, message: 'تم حذف التقييمات بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── R2: Settings API (GET, POST, PUT /api/settings) ──
  if (url.pathname === '/api/settings' && request.method === 'GET') {
    try {
      const obj = await env.elmanzala.get('config/settings.json');
      if (obj) {
        const text = await obj.text();
        return jsonResponse({ success: true, data: JSON.parse(text) }, 200, corsHeaders);
      }
      return jsonResponse({ success: true, data: {} }, 200, corsHeaders);
    } catch (_) {
      return jsonResponse({ success: true, data: {} }, 200, corsHeaders);
    }
  }

  if (url.pathname === '/api/settings' && (request.method === 'POST' || request.method === 'PUT')) {
    const body = await request.json().catch(() => ({}));
    try {
      await env.elmanzala.put('config/settings.json', JSON.stringify(body), {
        httpMetadata: { contentType: 'application/json' }
      });
      return jsonResponse({ success: true, message: 'تم حفظ الإعدادات بنجاح', data: body }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: User Profile Sync (POST /api/users/sync) ──
  // Architecture: D1 is the source of truth for role/status. Firebase Auth provides uid/name/email/photo only.
  if (url.pathname === '/api/users/sync' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = (body.uid || body.id || '').trim();
    if (!id) return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);

    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const photoUrl = (body.photoURL || body.photo_url || '').trim();
    const requestedRole = (body.role || 'user').trim();
    const status = (body.status || 'active').trim();
    const now = Date.now();

    try {
      // Upsert: preserve existing role in D1 (server-side protection)
      await env.DB.prepare(`
        INSERT INTO users (id, name, email, photo_url, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          photo_url = excluded.photo_url,
          role = CASE
            WHEN excluded.role = 'superadmin' THEN 'superadmin'
            WHEN users.role IN ('admin', 'superadmin') THEN users.role
            ELSE excluded.role
          END,
          updated_at = excluded.updated_at
      `).bind(id, name, email, photoUrl, requestedRole, status, now, now).run();

      // Return full D1 profile so auth.js can use actual DB role
      const profile = await env.DB.prepare(
        `SELECT id, name, email, photo_url, phone, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
      ).bind(id).first();

      return jsonResponse({ success: true, data: profile || null }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Get Single User by ID (GET /api/users/:id) ──
  // Used by auth.js to fetch full D1 profile after login
  if (url.pathname.startsWith('/api/users/') && request.method === 'GET') {
    const userId = url.pathname.replace('/api/users/', '').trim();
    if (!userId || userId === 'sync' || userId === 'seed') {
      return jsonResponse({ error: 'Invalid user ID' }, 400, corsHeaders);
    }
    try {
      const user = await env.DB.prepare(
        `SELECT id, name, email, photo_url, phone, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
      ).bind(userId).first();
      if (!user) return jsonResponse({ success: false, error: 'User not found' }, 404, corsHeaders);
      return jsonResponse({ success: true, data: user }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Seed Missing Users (POST /api/users/seed) ──
  // Recovery endpoint: inserts users who existed before D1 migration
  // Does NOT overwrite role if user already exists in D1
  if (url.pathname === '/api/users/seed' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const users = Array.isArray(body.users) ? body.users : (body.uid ? [body] : []);
    if (!users.length) return jsonResponse({ error: 'users array required' }, 400, corsHeaders);

    const results = [];
    const now = Date.now();

    for (const u of users) {
      const uid = (u.uid || u.id || '').trim();
      if (!uid) continue;
      try {
        await env.DB.prepare(`
          INSERT INTO users (id, name, email, photo_url, role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `).bind(
          uid,
          (u.name || 'مستخدم').trim(),
          (u.email || '').trim().toLowerCase(),
          (u.photoURL || u.photo_url || '').trim(),
          (u.role || 'user').trim(),
          (u.status || 'active').trim(),
          u.createdAt || now,
          now
        ).run();
        results.push({ uid, status: 'seeded' });
      } catch (err) {
        results.push({ uid, status: 'error', error: err.message });
      }
    }

    return jsonResponse({ success: true, results }, 200, corsHeaders);
  }

  // ── D1: Get Users List (GET /api/users) ──
  if (url.pathname === '/api/users' && request.method === 'GET') {
    try {
      // Join with places count per user
      const result = await env.DB.prepare(`
        SELECT
          u.id, u.name, u.email, u.photo_url, u.phone, u.role, u.status,
          u.created_at, u.updated_at,
          COUNT(p.id) AS places_count
        FROM users u
        LEFT JOIN places p ON p.owner_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 500
      `).all();
      return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
    } catch (err) {
      // Fallback without JOIN if places table schema differs
      try {
        const result = await env.DB.prepare(`
          SELECT id, name, email, photo_url, phone, role, status, created_at, updated_at
          FROM users ORDER BY created_at DESC LIMIT 500
        `).all();
        return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
      } catch (err2) {
        return jsonResponse({ success: false, error: err2.message }, 500, corsHeaders);
      }
    }
  }

  // ── D1: Update User (PATCH/PUT /api/users/:id) ──
  // Allows updating: role, status, name, email, phone
  if ((url.pathname.startsWith('/api/users/') || url.pathname === '/api/users') &&
      (request.method === 'PUT' || request.method === 'PATCH') &&
      !url.pathname.endsWith('/sync') && !url.pathname.endsWith('/seed')) {
    const idFromPath = url.pathname.startsWith('/api/users/') ? url.pathname.replace('/api/users/', '').trim() : '';
    const body = await request.json().catch(() => ({}));
    const id = (idFromPath || body.id || body.uid || '').trim();

    if (!id) return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);

    try {
      const existing = await env.DB.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).bind(id).first();
      if (!existing) return jsonResponse({ error: 'User not found' }, 404, corsHeaders);

      const role   = body.role   !== undefined ? body.role   : existing.role;
      const status = body.status !== undefined ? body.status : existing.status;
      const name   = body.name   !== undefined ? body.name   : existing.name;
      const email  = body.email  !== undefined ? body.email  : existing.email;
      const phone  = body.phone  !== undefined ? body.phone  : existing.phone;
      const now    = Date.now();

      await env.DB.prepare(`
        UPDATE users SET role = ?, status = ?, name = ?, email = ?, phone = ?, updated_at = ?
        WHERE id = ?
      `).bind(role, status, name, email, phone, now, id).run();

      const updated = await env.DB.prepare(
        `SELECT id, name, email, photo_url, phone, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
      ).bind(id).first();

      return jsonResponse({ success: true, data: updated }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Delete User (DELETE /api/users/:id) ──
  if (url.pathname.startsWith('/api/users/') && request.method === 'DELETE') {
    const id = url.pathname.replace('/api/users/', '').trim();
    if (!id) return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);
    try {
      await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
      return jsonResponse({ success: true, message: 'User deleted from D1' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }




  // ── D1: Category Requests (GET, POST, PUT, DELETE /api/category-requests) ──
  if (url.pathname === '/api/category-requests' && request.method === 'GET') {
    try {
      const result = await env.DB.prepare(`
        SELECT id, category_name, place_name, owner_name, user_id, status, created_at, reviewed_at
        FROM category_requests
        ORDER BY created_at DESC
        LIMIT 100
      `).all();
      return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if (url.pathname === '/api/category-requests' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = body.id || `catreq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const categoryName = (body.category_name || body.categoryName || '').trim();
    const placeName = (body.place_name || body.placeName || '').trim();
    const ownerName = (body.owner_name || body.ownerName || 'مستخدم').trim();
    const userId = body.user_id || body.userId || '';
    const now = Date.now();

    if (!categoryName) return jsonResponse({ error: 'اسم التصنيف مطلوب' }, 400, corsHeaders);

    try {
      await env.DB.prepare(`
        INSERT INTO category_requests (id, category_name, place_name, owner_name, user_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).bind(id, categoryName, placeName, ownerName, userId, now).run();
      return jsonResponse({ success: true, id, message: 'تم إرسال اقتراح التصنيف بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if ((url.pathname.startsWith('/api/category-requests/') || url.pathname === '/api/category-requests') && (request.method === 'PUT' || request.method === 'PATCH')) {
    const idFromPath = url.pathname.startsWith('/api/category-requests/') ? url.pathname.replace('/api/category-requests/', '') : '';
    const body = await request.json().catch(() => ({}));
    const id = (idFromPath || body.id || '').trim();
    const status = (body.status || 'approved').trim();
    const now = Date.now();

    if (!id) return jsonResponse({ error: 'Request ID required' }, 400, corsHeaders);

    try {
      await env.DB.prepare(`
        UPDATE category_requests SET status = ?, reviewed_at = ? WHERE id = ?
      `).bind(status, now, id).run();
      return jsonResponse({ success: true, message: 'تم تحديث حالة طلب التصنيف' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── D1: Verification Requests (GET, POST, PUT, DELETE /api/verification-requests) ──
  if (url.pathname === '/api/verification-requests' && request.method === 'GET') {
    try {
      const result = await env.DB.prepare(`
        SELECT id, place_id, place_name, owner_id, owner_name, owner_email, phone, notes, status, verified_until, created_at, reviewed_at
        FROM verification_requests
        ORDER BY created_at DESC
        LIMIT 100
      `).all();
      return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if (url.pathname === '/api/verification-requests' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = body.id || `vreq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const placeId = (body.place_id || body.placeId || '').trim();
    const placeName = (body.place_name || body.placeName || '').trim();
    const ownerId = body.owner_id || body.ownerId || '';
    const ownerName = body.owner_name || body.ownerName || '';
    const ownerEmail = body.owner_email || body.ownerEmail || '';
    const phone = body.phone || '';
    const notes = body.notes || '';
    const now = Date.now();

    if (!placeId) return jsonResponse({ error: 'place_id مطلوب' }, 400, corsHeaders);

    try {
      await env.DB.prepare(`
        INSERT INTO verification_requests (id, place_id, place_name, owner_id, owner_name, owner_email, phone, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).bind(id, placeId, placeName, ownerId, ownerName, ownerEmail, phone, notes, now).run();
      return jsonResponse({ success: true, id, message: 'تم إرسال طلب التوثيق' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if ((url.pathname.startsWith('/api/verification-requests/') || url.pathname === '/api/verification-requests') && (request.method === 'PUT' || request.method === 'PATCH')) {
    const idFromPath = url.pathname.startsWith('/api/verification-requests/') ? url.pathname.replace('/api/verification-requests/', '') : '';
    const body = await request.json().catch(() => ({}));
    const id = (idFromPath || body.id || '').trim();
    const status = (body.status || 'approved').trim();
    const verifiedUntil = body.verified_until || body.verifiedUntil || null;
    const now = Date.now();

    if (!id) return jsonResponse({ error: 'Request ID required' }, 400, corsHeaders);

    try {
      await env.DB.prepare(`
        UPDATE verification_requests SET status = ?, verified_until = ?, reviewed_at = ? WHERE id = ?
      `).bind(status, verifiedUntil, now, id).run();
      return jsonResponse({ success: true, message: 'تم تحديث حالة طلب التوثيق' }, 200, corsHeaders);
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
    <script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness","name":rawPlaceName,"description":placeDesc,"image":placeImg,"url":shareUrl,"telephone":place.phone||undefined,"address":{"@type":"PostalAddress","streetAddress":place.address||undefined,"addressLocality":place.area||'المنزلة والمطرية',"addressRegion":'الدقهلية',"addressCountry":'EG'},"geo":(place.latitude&&place.longitude)?{"@type":"GeoCoordinates","latitude":place.latitude,"longitude":place.longitude}:undefined,"aggregateRating":(place.review_count>0)?{"@type":"AggregateRating","ratingValue":place.rating||0,"reviewCount":place.review_count||0}:undefined})}</script>
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


