/**
 * worker/admin.js
 * Dedicated Admin API Router for Dalil El-Manzala V2
 * 
 * Provides production-grade Server-Side Aggregations, RBAC Enforcement,
 * Server-Side Pagination & Filtering, R2 Media Manager, Audit Logging,
 * FCM Push Dispatching, and System Health Diagnostics.
 */

import { createTursoDB } from './turso.js';

// ── Superadmin Email Whitelist ──
const SUPERADMIN_EMAILS = new Set([
  'elfannanm@gmail.com',
  'mohamednasrofficial@gmail.com'
]);

// ── Granular RBAC Permissions ──
const ROLE_PERMISSIONS = {
  superadmin: ['*'],
  admin: [
    'dashboard.read',
    'places.read', 'places.create', 'places.update', 'places.delete', 'places.verify', 'places.publish',
    'users.read', 'users.update', 'users.suspend', 'users.ban', 'users.role',
    'verification.read', 'verification.decide',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'reviews.read', 'reviews.moderate', 'reviews.delete',
    'products.read', 'products.create', 'products.update', 'products.approve', 'products.delete',
    'offers.read', 'offers.create', 'offers.update', 'offers.delete',
    'ads.read', 'ads.create', 'ads.update', 'ads.delete',
    'news.read', 'news.create', 'news.update', 'news.moderate', 'news.delete',
    'notifications.read', 'notifications.send',
    'media.read', 'media.upload', 'media.delete',
    'settings.read', 'settings.update',
    'audit.read',
    'system.read',
    'security.read', 'security.ban'
  ],
  moderator: [
    'dashboard.read',
    'places.read', 'places.verify',
    'verification.read', 'verification.decide',
    'reviews.read', 'reviews.moderate', 'reviews.delete',
    'products.read', 'products.approve',
    'news.read', 'news.moderate',
    'audit.read'
  ],
  editor: [
    'dashboard.read',
    'places.read', 'places.create', 'places.update',
    'categories.read', 'categories.update',
    'offers.read', 'offers.create', 'offers.update',
    'ads.read', 'ads.create', 'ads.update',
    'news.read', 'news.create', 'news.update',
    'media.read', 'media.upload'
  ],
  support: [
    'dashboard.read',
    'places.read',
    'users.read',
    'verification.read',
    'reviews.read',
    'audit.read'
  ]
};

function hasPermission(user, permission) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const perms = ROLE_PERMISSIONS[user.role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}

// ── Ensure Admin Database Tables Exist ──
let _tablesEnsured = false;
async function ensureAdminTables(env) {
  if (_tablesEnsured) return;
  try {
    const db = createTursoDB(env);
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        admin_uid TEXT NOT NULL,
        admin_email TEXT,
        admin_name TEXT,
        role TEXT,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT,
        details_json TEXT,
        ip TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'success',
        created_at INTEGER NOT NULL
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_notifications_log (
        id TEXT PRIMARY KEY,
        sender_uid TEXT,
        sender_email TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        image_url TEXT,
        target_type TEXT,
        target_value TEXT,
        recipient_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        fail_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `).run();

    _tablesEnsured = true;
  } catch (err) {
    console.warn('[ensureAdminTables] Notice:', err?.message || err);
  }
}

// ── Record Audit Log ──
async function logAudit(env, { admin, action, resource, resourceId = null, details = {}, ip = '', userAgent = '', status = 'success' }) {
  try {
    const db = createTursoDB(env);
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_uid, admin_email, admin_name, role, action, resource, resource_id, details_json, ip, user_agent, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      admin.uid,
      admin.email,
      admin.name,
      admin.role,
      action,
      resource,
      String(resourceId || ''),
      JSON.stringify(details || {}),
      ip,
      userAgent.slice(0, 255),
      status,
      Date.now()
    ).run();
  } catch (err) {
    console.error('[logAudit] Error:', err?.message || err);
  }
}

// ── Admin Authentication & Authorization ──
async function authenticateAdmin(request, env, requiredPermission = null, corsHeaders = {}) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      admin: null,
      response: jsonResponse({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'مطلوب تسجيل الدخول كمسؤول (Bearer Token missing)' }
      }, 401, corsHeaders)
    };
  }

  const token = match[1].trim();
  const apiKey = env.FIREBASE_API_KEY || '';
  if (!apiKey) {
    return {
      admin: null,
      response: jsonResponse({
        success: false,
        error: { code: 'SERVER_CONFIG_ERROR', message: 'مفتاح Firebase غير مهيأ بالخادم' }
      }, 500, corsHeaders)
    };
  }

  let fbUser = null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    if (!res.ok) {
      return {
        admin: null,
        response: jsonResponse({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'انتهت صلاحية جلسة تسجيل الدخول، يرجى إعادة الدخول' }
        }, 401, corsHeaders)
      };
    }
    const data = await res.json();
    fbUser = data?.users?.[0];
  } catch (err) {
    return {
      admin: null,
      response: jsonResponse({
        success: false,
        error: { code: 'AUTH_GATEWAY_ERROR', message: 'تعذر التحقق من التوكن عبر بوابة المصادقة' }
      }, 502, corsHeaders)
    };
  }

  if (!fbUser || !fbUser.localId) {
    return {
      admin: null,
      response: jsonResponse({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' }
      }, 401, corsHeaders)
    };
  }

  // Lookup profile in Turso database
  let profile = null;
  try {
    const db = createTursoDB(env);
    profile = await db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1').bind(fbUser.localId).first();
  } catch (err) {
    console.warn('[AdminAuth] Turso user read warning:', err?.message || err);
  }

  const email = String(fbUser.email || '').trim().toLowerCase();
  const role = String(profile?.role || 'user').trim().toLowerCase();
  const status = String(profile?.status || 'active').trim().toLowerCase();
  const isSuperAdmin = SUPERADMIN_EMAILS.has(email) || role === 'superadmin';
  const isAdminUser = isSuperAdmin || ['admin', 'moderator', 'editor', 'support'].includes(role);

  if (['banned', 'suspended', 'disabled'].includes(status)) {
    return {
      admin: null,
      response: jsonResponse({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'هذا الحساب معلق ومحظور من الإدارة' }
      }, 403, corsHeaders)
    };
  }

  if (!isAdminUser) {
    return {
      admin: null,
      response: jsonResponse({
        success: false,
        error: { code: 'FORBIDDEN', message: 'ليس لديك صلاحيات للوصول إلى لوحة الإدارة' }
      }, 403, corsHeaders)
    };
  }

  const admin = {
    uid: fbUser.localId,
    email,
    name: profile?.name || fbUser.displayName || 'مسؤول النظام',
    role: isSuperAdmin ? 'superadmin' : role,
    isSuperAdmin,
    permissions: ROLE_PERMISSIONS[isSuperAdmin ? 'superadmin' : role] || []
  };

  if (requiredPermission && !hasPermission(admin, requiredPermission)) {
    return {
      admin: null,
      response: jsonResponse({
        success: false,
        error: { code: 'PERMISSION_DENIED', message: `ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء (${requiredPermission})` }
      }, 403, corsHeaders)
    };
  }

  return { admin, response: null };
}

// ── JSON Response Helper ──
function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}

// ─────────────────────────────────────────────────────────────
//  MAIN ADMIN ROUTER ENTRY POINT
// ─────────────────────────────────────────────────────────────
export async function handleAdminRequest(request, env, ctx, url, corsHeaders) {
  const path = url.pathname;
  const method = request.method;
  const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
  const userAgent = request.headers.get('User-Agent') || '';

  await ensureAdminTables(env);

  // ═════════════════════════════════════════════════════════════
  // 1. DASHBOARD AGGREGATION & HEALTH: GET /api/admin/dashboard
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/dashboard' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'dashboard.read', corsHeaders);
    if (response) return response;

    const db = createTursoDB(env);
    const metrics = {};
    const health = {};

    // Parallel SQL Aggregations (Never download all records to calculate counts!)
    const queryPromises = [
      // Places metrics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN is_sponsored = 1 THEN 1 ELSE 0 END) as sponsored
        FROM places
      `).first().then(r => {
        metrics.places = {
          total: Number(r?.total ?? 0),
          published: Number(r?.published ?? 0),
          pending: Number(r?.pending ?? 0),
          verified: Number(r?.verified ?? 0),
          sponsored: Number(r?.sponsored ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.places = { status: 'error', error: err.message, value: null };
      }),

      // Users metrics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' OR status IS NULL THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status IN ('banned','suspended') THEN 1 ELSE 0 END) as suspended,
          SUM(CASE WHEN role IN ('admin','superadmin') THEN 1 ELSE 0 END) as admins
        FROM users
      `).first().then(r => {
        metrics.users = {
          total: Number(r?.total ?? 0),
          active: Number(r?.active ?? 0),
          suspended: Number(r?.suspended ?? 0),
          admins: Number(r?.admins ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.users = { status: 'error', error: err.message, value: null };
      }),

      // Categories
      db.prepare('SELECT COUNT(*) as total FROM categories').first().then(r => {
        metrics.categories = { total: Number(r?.total ?? 0), status: 'ok' };
      }).catch(err => {
        metrics.categories = { status: 'error', error: err.message, value: null };
      }),

      // Reviews
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'published' OR status IS NULL THEN 1 ELSE 0 END) as published,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM reviews
      `).first().then(r => {
        metrics.reviews = {
          total: Number(r?.total ?? 0),
          published: Number(r?.published ?? 0),
          pending: Number(r?.pending ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.reviews = { status: 'error', error: err.message, value: null };
      }),

      // Products
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_approved = 1 OR status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN is_approved = 0 AND status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM products
      `).first().then(r => {
        metrics.products = {
          total: Number(r?.total ?? 0),
          approved: Number(r?.approved ?? 0),
          pending: Number(r?.pending ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.products = { status: 'error', error: err.message, value: null };
      }),

      // Offers
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' AND (end_date IS NULL OR end_date > ?) THEN 1 ELSE 0 END) as active
        FROM offers
      `).bind(Date.now()).first().then(r => {
        metrics.offers = {
          total: Number(r?.total ?? 0),
          active: Number(r?.active ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.offers = { status: 'error', error: err.message, value: null };
      }),

      // Ads
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(clicks) as totalClicks
        FROM ads
      `).first().then(r => {
        metrics.ads = {
          total: Number(r?.total ?? 0),
          active: Number(r?.active ?? 0),
          totalClicks: Number(r?.totalClicks ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.ads = { status: 'error', error: err.message, value: null };
      }),

      // Live Community News
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM live_news
      `).first().then(r => {
        metrics.liveNews = {
          total: Number(r?.total ?? 0),
          published: Number(r?.published ?? 0),
          pending: Number(r?.pending ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.liveNews = { status: 'error', error: err.message, value: null };
      }),

      // Reports
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as pending
        FROM place_reports
      `).first().then(r => {
        metrics.reports = {
          total: Number(r?.total ?? 0),
          pending: Number(r?.pending ?? 0),
          status: 'ok'
        };
      }).catch(err => {
        metrics.reports = { status: 'error', error: err.message, value: null };
      }),

      // FCM Tokens
      db.prepare('SELECT COUNT(*) as total FROM fcm_tokens').first().then(r => {
        metrics.fcmTokens = { total: Number(r?.total ?? 0), status: 'ok' };
      }).catch(err => {
        metrics.fcmTokens = { status: 'error', error: err.message, value: null };
      }),

      // Banned IPs
      db.prepare('SELECT COUNT(*) as total FROM banned_ips').first().then(r => {
        metrics.bannedIps = { total: Number(r?.total ?? 0), status: 'ok' };
      }).catch(err => {
        metrics.bannedIps = { status: 'error', error: err.message, value: null };
      })
    ];

    // Health Checks
    const startTurso = Date.now();
    const healthPromises = [
      db.prepare('SELECT 1 as ok').first().then(r => {
        health.turso = { status: r?.ok === 1 ? 'healthy' : 'degraded', latencyMs: Date.now() - startTurso };
      }).catch(err => {
        health.turso = { status: 'down', error: err.message, latencyMs: Date.now() - startTurso };
      }),

      // R2 Health
      (async () => {
        if (!env.elmanzala) {
          health.r2 = { status: 'unavailable', error: 'R2 binding not configured' };
          return;
        }
        try {
          const t0 = Date.now();
          await env.elmanzala.list({ limit: 1 });
          health.r2 = { status: 'healthy', latencyMs: Date.now() - t0 };
        } catch (e) {
          health.r2 = { status: 'down', error: e.message };
        }
      })(),

      // FCM Health
      (async () => {
        health.fcm = {
          status: (env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL) ? 'healthy' : 'unconfigured',
          projectId: env.FCM_PROJECT_ID || null
        };
      })(),

      // Worker Status
      Promise.resolve().then(() => {
        health.worker = {
          status: 'healthy',
          region: request.cf?.colo || 'edge',
          timestamp: Date.now()
        };
      })
    ];

    await Promise.all([...queryPromises, ...healthPromises]);

    return jsonResponse({
      success: true,
      data: {
        admin: {
          uid: admin.uid,
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        metrics,
        health,
        timestamp: Date.now()
      }
    }, 200, corsHeaders);
  }

  // ═════════════════════════════════════════════════════════════
  // 2. PLACES MANAGEMENT: /api/admin/places
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/places' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'places.read', corsHeaders);
    if (response) return response;

    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
    const offset = (page - 1) * limit;
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const category = (url.searchParams.get('category') || '').trim();
    const area = (url.searchParams.get('area') || '').trim();
    const status = (url.searchParams.get('status') || '').trim();
    const isVerified = url.searchParams.get('verified');
    const isSponsored = url.searchParams.get('sponsored');
    const sort = url.searchParams.get('sort') || 'updated_desc';

    const conditions = [];
    const args = [];

    if (search) {
      conditions.push('(LOWER(name) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(address) LIKE ?)');
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern, pattern);
    }
    if (category) {
      conditions.push('category_id = ?');
      args.push(category);
    }
    if (area) {
      conditions.push('area = ?');
      args.push(area);
    }
    if (status) {
      conditions.push('status = ?');
      args.push(status);
    }
    if (isVerified !== null && isVerified !== '') {
      conditions.push('is_verified = ?');
      args.push(Number(isVerified) ? 1 : 0);
    }
    if (isSponsored !== null && isSponsored !== '') {
      conditions.push('is_sponsored = ?');
      args.push(Number(isSponsored) ? 1 : 0);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'updated_at DESC';
    if (sort === 'created_desc') orderBy = 'created_at DESC';
    if (sort === 'name_asc') orderBy = 'name ASC';
    if (sort === 'trust_score_desc') orderBy = 'trust_score DESC';

    const db = createTursoDB(env);
    try {
      const countRes = await db.prepare(`SELECT COUNT(*) as count FROM places ${whereClause}`).bind(...args).first();
      const totalCount = Number(countRes?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      const items = await db.prepare(`
        SELECT id, name, slug, category_id, area, address, phone, whatsapp, 
               is_verified, is_sponsored, is_featured, status, trust_score, 
               logo_url, cover_image_url, created_at, updated_at, owner_email
        FROM places 
        ${whereClause} 
        ORDER BY ${orderBy} 
        LIMIT ? OFFSET ?
      `).bind(...args, limit, offset).all();

      return jsonResponse({
        success: true,
        data: items.results || [],
        meta: { page, limit, totalCount, totalPages }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({
        success: false,
        error: { code: 'DATABASE_ERROR', message: `خطأ في استعلام الأماكن: ${err.message}` }
      }, 500, corsHeaders);
    }
  }

  // Get single place for admin edit: GET /api/admin/places/:id
  if (path.startsWith('/api/admin/places/') && method === 'GET' && !path.includes('/verify') && !path.includes('/status')) {
    const { admin, response } = await authenticateAdmin(request, env, 'places.read', corsHeaders);
    if (response) return response;

    const id = path.replace('/api/admin/places/', '').trim();
    const db = createTursoDB(env);
    try {
      const place = await db.prepare('SELECT * FROM places WHERE id = ? OR slug = ? LIMIT 1').bind(id, id).first();
      if (!place) {
        return jsonResponse({ success: false, error: { code: 'NOT_FOUND', message: 'المكان غير موجود' } }, 404, corsHeaders);
      }
      return jsonResponse({ success: true, data: place }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Create / Update Place: POST/PUT /api/admin/places
  if ((path === '/api/admin/places' && method === 'POST') || (path.startsWith('/api/admin/places/') && method === 'PUT')) {
    const requiredPerm = method === 'POST' ? 'places.create' : 'places.update';
    const { admin, response } = await authenticateAdmin(request, env, requiredPerm, corsHeaders);
    if (response) return response;

    const payload = await request.json().catch(() => ({}));
    const id = method === 'PUT' 
      ? path.replace('/api/admin/places/', '').trim()
      : (payload.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

    if (!payload.name || !payload.name.trim()) {
      return jsonResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'اسم المكان مطلوب' } }, 400, corsHeaders);
    }

    const name = payload.name.trim();
    const slug = (payload.slug || id).trim().toLowerCase().replace(/[\s/\\?#%]+/g, '-');
    const categoryId = payload.categoryId || payload.category_id || '';
    const area = payload.area || '';
    const address = payload.address || '';
    const phone = payload.phone || '';
    const whatsapp = payload.whatsapp || '';
    const mapsLink = payload.mapsLink || payload.maps_link || '';
    const latitude = Number(payload.latitude) || null;
    const longitude = Number(payload.longitude) || null;
    const description = payload.description || '';
    const logoUrl = payload.logoUrl || payload.logo_url || '';
    const coverImageUrl = payload.coverImageUrl || payload.cover_image_url || '';
    const status = payload.status || 'published';
    const isVerified = Number(payload.isVerified ?? payload.is_verified ?? 0) ? 1 : 0;
    const isSponsored = Number(payload.isSponsored ?? payload.is_sponsored ?? 0) ? 1 : 0;
    const trustScore = payload.trustScore != null ? Number(payload.trustScore) : (isVerified ? 100 : 50);
    const now = Date.now();

    const db = createTursoDB(env);
    try {
      await db.prepare(`
        INSERT INTO places (
          id, name, slug, category_id, area, address, phone, whatsapp, maps_link,
          latitude, longitude, description, logo_url, cover_image_url, status,
          is_verified, is_sponsored, trust_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          category_id = excluded.category_id,
          area = excluded.area,
          address = excluded.address,
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
          is_sponsored = excluded.is_sponsored,
          trust_score = excluded.trust_score,
          updated_at = excluded.updated_at
      `).bind(
        id, name, slug, categoryId, area, address, phone, whatsapp, mapsLink,
        latitude, longitude, description, logoUrl, coverImageUrl, status,
        isVerified, isSponsored, trustScore, now, now
      ).run();

      await logAudit(env, {
        admin,
        action: method === 'POST' ? 'PLACE_CREATED' : 'PLACE_UPDATED',
        resource: 'places',
        resourceId: id,
        details: { name, slug, categoryId, status, isVerified },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, data: { id, slug, name } }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Delete Place: DELETE /api/admin/places/:id
  if (path.startsWith('/api/admin/places/') && method === 'DELETE') {
    const { admin, response } = await authenticateAdmin(request, env, 'places.delete', corsHeaders);
    if (response) return response;

    const id = path.replace('/api/admin/places/', '').trim();
    const db = createTursoDB(env);
    try {
      await db.prepare('DELETE FROM places WHERE id = ?').bind(id).run();

      await logAudit(env, {
        admin,
        action: 'PLACE_DELETED',
        resource: 'places',
        resourceId: id,
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, message: 'تم حذف المكان بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Toggle Verification: PATCH /api/admin/places/:id/verify
  if (path.match(/\/api\/admin\/places\/[^/]+\/verify$/) && method === 'PATCH') {
    const { admin, response } = await authenticateAdmin(request, env, 'places.verify', corsHeaders);
    if (response) return response;

    const id = path.replace('/api/admin/places/', '').replace('/verify', '').trim();
    const body = await request.json().catch(() => ({}));
    const isVerified = Number(body.isVerified ?? body.is_verified) ? 1 : 0;
    const trustScore = isVerified ? 100 : 50;

    const db = createTursoDB(env);
    try {
      await db.prepare('UPDATE places SET is_verified = ?, trust_score = ?, updated_at = ? WHERE id = ?')
        .bind(isVerified, trustScore, Date.now(), id).run();

      await logAudit(env, {
        admin,
        action: isVerified ? 'PLACE_VERIFIED' : 'PLACE_UNVERIFIED',
        resource: 'places',
        resourceId: id,
        details: { isVerified, trustScore },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, isVerified }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Change Place Status: PATCH /api/admin/places/:id/status
  if (path.match(/\/api\/admin\/places\/[^/]+\/status$/) && method === 'PATCH') {
    const { admin, response } = await authenticateAdmin(request, env, 'places.publish', corsHeaders);
    if (response) return response;

    const id = path.replace('/api/admin/places/', '').replace('/status', '').trim();
    const body = await request.json().catch(() => ({}));
    const status = String(body.status || 'published').trim();

    const db = createTursoDB(env);
    try {
      await db.prepare('UPDATE places SET status = ?, updated_at = ? WHERE id = ?')
        .bind(status, Date.now(), id).run();

      await logAudit(env, {
        admin,
        action: 'PLACE_STATUS_CHANGED',
        resource: 'places',
        resourceId: id,
        details: { status },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, status }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Bulk Places Action: POST /api/admin/places/bulk
  if (path === '/api/admin/places/bulk' && method === 'POST') {
    const { admin, response } = await authenticateAdmin(request, env, 'places.update', corsHeaders);
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const { action, ids } = body;
    if (!action || !Array.isArray(ids) || !ids.length) {
      return jsonResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'الإجراء ومعرفات العناصر مطلوبة' } }, 400, corsHeaders);
    }

    const db = createTursoDB(env);
    try {
      const placeholders = ids.map(() => '?').join(',');
      if (action === 'publish') {
        await db.prepare(`UPDATE places SET status = 'published', updated_at = ? WHERE id IN (${placeholders})`).bind(Date.now(), ...ids).run();
      } else if (action === 'unpublish') {
        await db.prepare(`UPDATE places SET status = 'pending', updated_at = ? WHERE id IN (${placeholders})`).bind(Date.now(), ...ids).run();
      } else if (action === 'verify') {
        await db.prepare(`UPDATE places SET is_verified = 1, trust_score = 100, updated_at = ? WHERE id IN (${placeholders})`).bind(Date.now(), ...ids).run();
      } else if (action === 'unverify') {
        await db.prepare(`UPDATE places SET is_verified = 0, trust_score = 50, updated_at = ? WHERE id IN (${placeholders})`).bind(Date.now(), ...ids).run();
      } else if (action === 'delete') {
        if (!hasPermission(admin, 'places.delete')) {
          return jsonResponse({ success: false, error: { code: 'FORBIDDEN', message: 'ليس لديك صلاحية الحذف' } }, 403, corsHeaders);
        }
        await db.prepare(`DELETE FROM places WHERE id IN (${placeholders})`).bind(...ids).run();
      } else {
        return jsonResponse({ success: false, error: { code: 'INVALID_ACTION', message: 'إجراء غير معروف' } }, 400, corsHeaders);
      }

      await logAudit(env, {
        admin,
        action: `PLACES_BULK_${action.toUpperCase()}`,
        resource: 'places',
        details: { count: ids.length, ids: ids.slice(0, 50) },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, count: ids.length }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 3. USERS MANAGEMENT: /api/admin/users
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/users' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'users.read', corsHeaders);
    if (response) return response;

    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
    const offset = (page - 1) * limit;
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const role = (url.searchParams.get('role') || '').trim();
    const status = (url.searchParams.get('status') || '').trim();

    const conditions = [];
    const args = [];

    if (search) {
      conditions.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)');
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern);
    }
    if (role) {
      conditions.push('role = ?');
      args.push(role);
    }
    if (status) {
      conditions.push('status = ?');
      args.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const db = createTursoDB(env);
    try {
      const countRes = await db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).bind(...args).first();
      const totalCount = Number(countRes?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      const items = await db.prepare(`
        SELECT id, name, email, role, status, phone, photo_url, points, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...args, limit, offset).all();

      return jsonResponse({
        success: true,
        data: items.results || [],
        meta: { page, limit, totalCount, totalPages }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Update User Role: PUT /api/admin/users/:id/role
  if (path.match(/\/api\/admin\/users\/[^/]+\/role$/) && method === 'PUT') {
    const { admin, response } = await authenticateAdmin(request, env, 'users.role', corsHeaders);
    if (response) return response;

    const uid = path.replace('/api/admin/users/', '').replace('/role', '').trim();
    const body = await request.json().catch(() => ({}));
    const newRole = String(body.role || 'user').trim().toLowerCase();

    if (!['superadmin', 'admin', 'moderator', 'editor', 'support', 'user'].includes(newRole)) {
      return jsonResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'الدور المحدد غير صالح' } }, 400, corsHeaders);
    }
    if (newRole === 'superadmin' && !admin.isSuperAdmin) {
      return jsonResponse({ success: false, error: { code: 'FORBIDDEN', message: 'فقط المدير التنفيذي يمكنه منح رتبة Superadmin' } }, 403, corsHeaders);
    }

    const db = createTursoDB(env);
    try {
      await db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').bind(newRole, Date.now(), uid).run();

      await logAudit(env, {
        admin,
        action: 'USER_ROLE_CHANGED',
        resource: 'users',
        resourceId: uid,
        details: { role: newRole },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, role: newRole }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Update User Status (Suspend/Activate): POST /api/admin/users/:id/status
  if (path.match(/\/api\/admin\/users\/[^/]+\/status$/) && method === 'POST') {
    const { admin, response } = await authenticateAdmin(request, env, 'users.suspend', corsHeaders);
    if (response) return response;

    const uid = path.replace('/api/admin/users/', '').replace('/status', '').trim();
    const body = await request.json().catch(() => ({}));
    const newStatus = String(body.status || 'active').trim().toLowerCase();

    const db = createTursoDB(env);
    try {
      await db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').bind(newStatus, Date.now(), uid).run();

      await logAudit(env, {
        admin,
        action: newStatus === 'active' ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
        resource: 'users',
        resourceId: uid,
        details: { status: newStatus },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, status: newStatus }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 4. VERIFICATION CENTER: /api/admin/verification & /api/admin/verification-queue
  // ═════════════════════════════════════════════════════════════
  if ((path === '/api/admin/verification' || path === '/api/admin/verification-queue') && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'verification.read', corsHeaders);
    if (response) return response;

    const db = createTursoDB(env);
    try {
      // Places with verification_status = 'pending' or 'unverified'
      const rows = await db.prepare(`
        SELECT id, name, slug, category_id, area, phone, whatsapp, is_verified, 
               verification_status, logo_url, cover_image_url, created_at, updated_at
        FROM places
        WHERE is_verified = 0 OR verification_status = 'pending'
        ORDER BY updated_at DESC
        LIMIT 100
      `).all();

      return jsonResponse({ success: true, data: rows.results || [] }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  const verifDecideMatch = path.match(/^\/api\/admin\/verification(?:-queue)?\/([^\/]+)\/decide$/);
  if (verifDecideMatch && method === 'POST') {
    const { admin, response } = await authenticateAdmin(request, env, 'verification.decide', corsHeaders);
    if (response) return response;

    const placeId = decodeURIComponent(verifDecideMatch[1]);
    const body = await request.json().catch(() => ({}));
    const decision = body.decision; // 'approved' or 'rejected'
    const notes = body.notes || '';

    const db = createTursoDB(env);
    try {
      const isApproved = decision === 'approved';
      await db.prepare(`
        UPDATE places
        SET is_verified = ?,
            verification_status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR slug = ?
      `).run(isApproved ? 1 : 0, decision, placeId, placeId);

      await logAudit(env, {
        adminId: admin.uid,
        adminEmail: admin.email,
        adminRole: admin.role,
        action: isApproved ? 'place.verify' : 'place.unverify',
        targetType: 'place',
        targetId: placeId,
        details: { decision, notes },
        ipAddress: getClientIp(request)
      });

      return jsonResponse({ success: true, message: isApproved ? 'تم توثيق المكان' : 'تم رفض طلب التوثيق' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 5. CATEGORIES MANAGEMENT: /api/admin/categories
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/categories' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'categories.read', corsHeaders);
    if (response) return response;

    const db = createTursoDB(env);
    try {
      const rows = await db.prepare(`
        SELECT c.*, COUNT(p.id) as live_places_count 
        FROM categories c
        LEFT JOIN places p ON p.category_id = c.id OR p.category_id = c.slug
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `).all();

      return jsonResponse({ success: true, data: rows.results || [] }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  if (path === '/api/admin/categories' && (method === 'POST' || method === 'PUT')) {
    const { admin, response } = await authenticateAdmin(request, env, 'categories.update', corsHeaders);
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const id = (body.id || body.slug || `cat_${Date.now()}`).trim();
    const name = (body.name || '').trim();
    const nameEn = (body.nameEn || body.name_en || '').trim();
    const slug = (body.slug || id).trim().toLowerCase().replace(/[\s/\\?#%]+/g, '-');
    const icon = body.icon || '🏪';
    const description = body.description || '';
    const color = body.color || '#1B4F72';
    const order = Number(body.order ?? 0);

    if (!name) return jsonResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'اسم القسم مطلوب' } }, 400, corsHeaders);

    const db = createTursoDB(env);
    try {
      await db.prepare(`
        INSERT INTO categories (id, name, name_en, slug, icon, description, color, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          name_en = excluded.name_en,
          slug = excluded.slug,
          icon = excluded.icon,
          description = excluded.description,
          color = excluded.color,
          sort_order = excluded.sort_order
      `).bind(id, name, nameEn, slug, icon, description, color, order, Date.now()).run();

      await logAudit(env, {
        admin,
        action: 'CATEGORY_SAVED',
        resource: 'categories',
        resourceId: id,
        details: { name, slug, order },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, data: { id, name, slug } }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  if (path.startsWith('/api/admin/categories/') && method === 'DELETE') {
    const { admin, response } = await authenticateAdmin(request, env, 'categories.delete', corsHeaders);
    if (response) return response;

    const id = path.replace('/api/admin/categories/', '').trim();
    const db = createTursoDB(env);
    try {
      // Check if places reference this category
      const refCheck = await db.prepare('SELECT COUNT(*) as count FROM places WHERE category_id = ?').bind(id).first();
      if (Number(refCheck?.count ?? 0) > 0) {
        return jsonResponse({
          success: false,
          error: { code: 'CATEGORY_IN_USE', message: `لا يمكن حذف هذا القسم لأنه مرتبط بـ ${refCheck.count} مكان مسجل. يرجى نقل الأماكن أولاً.` }
        }, 409, corsHeaders);
      }

      await db.prepare('DELETE FROM categories WHERE id = ? OR slug = ?').bind(id, id).run();

      await logAudit(env, {
        admin,
        action: 'CATEGORY_DELETED',
        resource: 'categories',
        resourceId: id,
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, message: 'تم حذف القسم بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 6. REVIEWS MODERATION: /api/admin/reviews
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/reviews' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'reviews.read', corsHeaders);
    if (response) return response;

    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
    const offset = (page - 1) * limit;
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const status = (url.searchParams.get('status') || '').trim();

    const conditions = [];
    const args = [];

    if (search) {
      conditions.push('(LOWER(r.comment) LIKE ? OR LOWER(r.user_name) LIKE ? OR LOWER(p.name) LIKE ?)');
      const pat = `%${search}%`;
      args.push(pat, pat, pat);
    }
    if (status) {
      conditions.push('r.status = ?');
      args.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const db = createTursoDB(env);
    try {
      const countRes = await db.prepare(`
        SELECT COUNT(*) as count 
        FROM reviews r 
        LEFT JOIN places p ON p.id = r.place_id 
        ${whereClause}
      `).bind(...args).first();

      const totalCount = Number(countRes?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      const items = await db.prepare(`
        SELECT r.*, p.name as place_name, p.slug as place_slug
        FROM reviews r
        LEFT JOIN places p ON p.id = r.place_id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...args, limit, offset).all();

      return jsonResponse({
        success: true,
        data: items.results || [],
        meta: { page, limit, totalCount, totalPages }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Delete review: DELETE /api/admin/reviews/:id
  if (path.startsWith('/api/admin/reviews/') && method === 'DELETE') {
    const { admin, response } = await authenticateAdmin(request, env, 'reviews.delete', corsHeaders);
    if (response) return response;

    const id = path.replace('/api/admin/reviews/', '').trim();
    const db = createTursoDB(env);
    try {
      await db.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();

      await logAudit(env, {
        admin,
        action: 'REVIEW_DELETED',
        resource: 'reviews',
        resourceId: id,
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, message: 'تم حذف التقييم' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 7. PRODUCTS MODERATION: /api/admin/products
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/products' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'products.read', corsHeaders);
    if (response) return response;

    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status');

    const conditions = [];
    const args = [];
    if (status) {
      conditions.push('p.status = ?');
      args.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const db = createTursoDB(env);
    try {
      const countRes = await db.prepare(`SELECT COUNT(*) as count FROM products p ${whereClause}`).bind(...args).first();
      const totalCount = Number(countRes?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      const items = await db.prepare(`
        SELECT p.*, pl.name as place_name, pl.slug as place_slug
        FROM products p
        LEFT JOIN places pl ON pl.id = p.place_id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...args, limit, offset).all();

      return jsonResponse({
        success: true,
        data: items.results || [],
        meta: { page, limit, totalCount, totalPages }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Approve / Reject Product: PUT /api/admin/products/:id/moderate
  if (path.match(/\/api\/admin\/products\/[^/]+\/moderate$/) && method === 'PUT') {
    const { admin, response } = await authenticateAdmin(request, env, 'products.approve', corsHeaders);
    if (response) return response;

    const id = path.replace('/api/admin/products/', '').replace('/moderate', '').trim();
    const body = await request.json().catch(() => ({}));
    const action = body.action || (body.status === 'approved' ? 'approve' : 'reject');
    const isApproved = action === 'approve' ? 1 : 0;
    const status = action === 'approve' ? 'approved' : 'rejected';
    const rejectionReason = body.rejectionReason || '';

    const db = createTursoDB(env);
    try {
      await db.prepare(`
        UPDATE products 
        SET is_approved = ?, status = ?, rejection_reason = ?, updated_at = ? 
        WHERE id = ?
      `).bind(isApproved, status, rejectionReason, Date.now(), id).run();

      await logAudit(env, {
        admin,
        action: action === 'approve' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
        resource: 'products',
        resourceId: id,
        details: { status, rejectionReason },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, status }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 8. R2 MEDIA MANAGER: /api/admin/media
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/media' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'media.read', corsHeaders);
    if (response) return response;

    if (!env.elmanzala) {
      return jsonResponse({ success: false, error: { code: 'R2_UNCONFIGURED', message: 'مساحة تخزين R2 غير مهيأة' } }, 503, corsHeaders);
    }

    const prefix = url.searchParams.get('prefix') || '';
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const cursor = url.searchParams.get('cursor') || undefined;

    try {
      const listing = await env.elmanzala.list({
        prefix,
        delimiter: '/',
        limit,
        cursor
      });

      const folders = (listing.delimitedPrefixes || []).map(p => ({
        prefix: p,
        name: p.slice(0, -1).split('/').pop() || p
      }));

      const files = (listing.objects || []).map(obj => ({
        key: obj.key,
        name: obj.key.split('/').pop() || obj.key,
        size: obj.size,
        uploaded: obj.uploaded ? obj.uploaded.getTime() : Date.now(),
        httpMetadata: obj.httpMetadata,
        url: `https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/${obj.key}`
      }));

      return jsonResponse({
        success: true,
        data: {
          prefix,
          folders,
          files,
          truncated: listing.truncated,
          cursor: listing.cursor || null
        }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'R2_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Delete R2 File: DELETE /api/admin/media
  if (path === '/api/admin/media' && method === 'DELETE') {
    const { admin, response } = await authenticateAdmin(request, env, 'media.delete', corsHeaders);
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const key = body.key || url.searchParams.get('key');
    if (!key) return jsonResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'مفتاح الملف مطلوب' } }, 400, corsHeaders);

    try {
      await env.elmanzala.delete(key);

      await logAudit(env, {
        admin,
        action: 'MEDIA_DELETED',
        resource: 'media',
        resourceId: key,
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, message: 'تم حذف الملف من R2 بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'R2_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 9. AUDIT LOGS: GET /api/admin/audit-logs
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/audit-logs' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'audit.read', corsHeaders);
    if (response) return response;

    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 30));
    const offset = (page - 1) * limit;
    const action = url.searchParams.get('action');
    const resource = url.searchParams.get('resource');

    const conditions = [];
    const args = [];
    if (action) {
      conditions.push('action = ?');
      args.push(action);
    }
    if (resource) {
      conditions.push('resource = ?');
      args.push(resource);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const db = createTursoDB(env);
    try {
      const countRes = await db.prepare(`SELECT COUNT(*) as count FROM admin_audit_logs ${whereClause}`).bind(...args).first();
      const totalCount = Number(countRes?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      const items = await db.prepare(`
        SELECT * FROM admin_audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...args, limit, offset).all();

      return jsonResponse({
        success: true,
        data: items.results || [],
        meta: { page, limit, totalCount, totalPages }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 10. SYSTEM HEALTH: GET /api/admin/system-health
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/system-health' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'system.read', corsHeaders);
    if (response) return response;

    const db = createTursoDB(env);
    const result = {
      timestamp: Date.now(),
      services: {}
    };

    // 1. Turso Health Check
    const t0 = Date.now();
    try {
      const ping = await db.prepare('SELECT 1 as ok').first();
      result.services.turso = {
        name: 'Turso libSQL Database',
        status: ping?.ok === 1 ? 'healthy' : 'degraded',
        latencyMs: Date.now() - t0,
        endpoint: env.TURSO_DATABASE_URL ? 'Connected' : 'Missing URL'
      };
    } catch (err) {
      result.services.turso = {
        name: 'Turso libSQL Database',
        status: 'down',
        latencyMs: Date.now() - t0,
        error: err.message
      };
    }

    // 2. Cloudflare R2 Health Check
    const tR2 = Date.now();
    try {
      if (!env.elmanzala) {
        result.services.r2 = { name: 'Cloudflare R2 Bucket', status: 'unavailable', error: 'Binding missing' };
      } else {
        await env.elmanzala.list({ limit: 1 });
        result.services.r2 = { name: 'Cloudflare R2 Bucket', status: 'healthy', latencyMs: Date.now() - tR2 };
      }
    } catch (err) {
      result.services.r2 = { name: 'Cloudflare R2 Bucket', status: 'down', latencyMs: Date.now() - tR2, error: err.message };
    }

    // 3. Firebase Auth Gateway Check
    const tFb = Date.now();
    try {
      const apiKey = env.FIREBASE_API_KEY || '';
      const fbCheck = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ continueUri: 'https://dalilmanzala.com' })
      });
      result.services.firebase = {
        name: 'Firebase Auth Identity Gateway',
        status: fbCheck.ok ? 'healthy' : 'degraded',
        latencyMs: Date.now() - tFb
      };
    } catch (err) {
      result.services.firebase = { name: 'Firebase Auth Gateway', status: 'down', error: err.message };
    }

    // 4. FCM Web Push Check
    result.services.fcm = {
      name: 'Firebase Cloud Messaging (FCM)',
      status: (env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL) ? 'healthy' : 'unconfigured',
      projectId: env.FCM_PROJECT_ID || null
    };

    // 5. Cloudflare Worker Runtime
    result.services.worker = {
      name: 'Cloudflare Edge Worker',
      status: 'healthy',
      colo: request.cf?.colo || 'unknown',
      asn: request.cf?.asn || 'unknown'
    };

    return jsonResponse({ success: true, data: result }, 200, corsHeaders);
  }

  // ═════════════════════════════════════════════════════════════
  // 11. GLOBAL SEARCH: GET /api/admin/search?q=...
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/search' && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'dashboard.read', corsHeaders);
    if (response) return response;

    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return jsonResponse({ success: true, data: { places: [], users: [], products: [], news: [] } }, 200, corsHeaders);
    }

    const pattern = `%${q}%`;
    const db = createTursoDB(env);
    try {
      const [places, users, products, news] = await Promise.all([
        db.prepare('SELECT id, name, slug, area, category_id, is_verified, status FROM places WHERE LOWER(name) LIKE ? OR LOWER(slug) LIKE ? OR phone LIKE ? LIMIT 6').bind(pattern, pattern, pattern).all(),
        db.prepare('SELECT id, name, email, role, status FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ? LIMIT 6').bind(pattern, pattern, pattern).all(),
        db.prepare('SELECT id, name, price, status, place_id FROM products WHERE LOWER(name) LIKE ? LIMIT 6').bind(pattern).all(),
        db.prepare('SELECT id, title, location, status FROM live_news WHERE LOWER(title) LIKE ? OR LOWER(details) LIKE ? LIMIT 6').bind(pattern, pattern).all()
      ]);

      return jsonResponse({
        success: true,
        data: {
          places: places.results || [],
          users: users.results || [],
          products: products.results || [],
          news: news.results || []
        }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 12. SECURITY / IP BANS: /api/admin/security/ip-bans
  // ═════════════════════════════════════════════════════════════
  if ((path === '/api/admin/security/ip-bans' || path === '/api/admin/security/bans') && method === 'GET') {
    const { admin, response } = await authenticateAdmin(request, env, 'security.read', corsHeaders);
    if (response) return response;

    const db = createTursoDB(env);
    try {
      const rows = await db.prepare('SELECT * FROM banned_ips ORDER BY banned_at DESC LIMIT 100').all();
      return jsonResponse({ success: true, data: rows.results || [] }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  if ((path === '/api/admin/security/ip-bans' || path === '/api/admin/security/bans') && method === 'POST') {
    const { admin, response } = await authenticateAdmin(request, env, 'security.ban', corsHeaders);
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const ip = String(body.ip || '').trim();
    const reason = String(body.reason || 'مخالفة معايير الاستخدام').trim();
    const isPermanent = Boolean(body.isPermanent);
    const durationDays = Number(body.durationDays) || 30;
    const now = Date.now();
    const bannedUntil = isPermanent ? null : now + (durationDays * 86400000);
    const ipKey = ip.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (!ip) return jsonResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'عنوان IP مطلوب' } }, 400, corsHeaders);

    const db = createTursoDB(env);
    try {
      await db.prepare(`
        INSERT INTO banned_ips (ip_key, ip, reason, is_permanent, duration_days, banned_at, banned_until, banned_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(ip_key) DO UPDATE SET
          reason = excluded.reason,
          is_permanent = excluded.is_permanent,
          banned_until = excluded.banned_until
      `).bind(ipKey, ip, reason, isPermanent ? 1 : 0, durationDays, now, bannedUntil, admin.name).run();

      await logAudit(env, {
        admin,
        action: 'IP_BANNED',
        resource: 'security',
        resourceId: ip,
        details: { reason, isPermanent, durationDays },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, message: 'تم حظر IP بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  if ((path.startsWith('/api/admin/security/ip-bans/') || path.startsWith('/api/admin/security/bans/')) && method === 'DELETE') {
    const { admin, response } = await authenticateAdmin(request, env, 'security.ban', corsHeaders);
    if (response) return response;

    const ip = path.replace(/^\/api\/admin\/security\/(?:ip-bans|bans)\//, '').trim();
    const ipKey = ip.replace(/[^a-zA-Z0-9_-]/g, '_');
    const db = createTursoDB(env);
    try {
      await db.prepare('DELETE FROM banned_ips WHERE ip_key = ? OR ip = ?').bind(ipKey, ip).run();

      await logAudit(env, {
        admin,
        action: 'IP_UNBANNED',
        resource: 'security',
        resourceId: ip,
        ip: clientIp,
        userAgent
      });

      return jsonResponse({ success: true, message: 'تم إلغاء حظر الـ IP' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 13. PUSH NOTIFICATIONS DISPATCH: POST /api/admin/notifications/send
  // ═════════════════════════════════════════════════════════════
  if (path === '/api/admin/notifications/send' && method === 'POST') {
    const { admin, response } = await authenticateAdmin(request, env, 'notifications.send', corsHeaders);
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const title = (body.title || '').trim();
    const message = (body.body || body.message || '').trim();
    const imageUrl = body.imageUrl || body.image || '';
    const targetUrl = body.url || './index.html';

    if (!title || !message) {
      return jsonResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'عنوان ونص الإشعار مطلوبان' } }, 400, corsHeaders);
    }

    const db = createTursoDB(env);
    try {
      const tokensRes = await db.prepare('SELECT token FROM fcm_tokens WHERE token IS NOT NULL AND token != ""').all();
      const tokens = (tokensRes.results || []).map(r => r.token);

      const notifId = `notif_${Date.now()}`;
      await db.prepare(`
        INSERT INTO admin_notifications_log (id, sender_uid, sender_email, title, body, image_url, target_type, target_value, recipient_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(notifId, admin.uid, admin.email, title, message, imageUrl, 'broadcast', 'all', tokens.length, Date.now()).run();

      await logAudit(env, {
        admin,
        action: 'NOTIFICATION_SENT',
        resource: 'notifications',
        resourceId: notifId,
        details: { title, recipientCount: tokens.length },
        ip: clientIp,
        userAgent
      });

      return jsonResponse({
        success: true,
        message: `تم جدولة الإشعار لـ ${tokens.length} جهاز مشترك`,
        data: { id: notifId, recipientCount: tokens.length }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } }, 500, corsHeaders);
    }
  }

  // Fallback for unmatched /api/admin/* route
  return jsonResponse({
    success: false,
    error: { code: 'NOT_FOUND', message: `مسار الإدارة غير موجود (${method} ${path})` }
  }, 404, corsHeaders);
}
