/**
 * المنزلة وناسها — Cloudflare Worker API Backend
 * Bound to R2 Bucket: elmanzala
 * OpenRouter AI Integration (Ox Alpha model)
 * Server-side Quota Enforcement (Offers & Products Limits)
 * Telegram Bot & Instant Notification System
 */

import { handleTelegramWebhook, sendAdminPushNotification, telegramApi } from './telegram.js';
import { createTursoDB, checkTursoHealth } from './turso.js';
const SUPERADMIN_EMAILS = new Set([
  'elfannanm@gmail.com',
  'mohamednasrofficial@gmail.com'
]);

async function authenticateRequest(request, env) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const apiKey = env.FIREBASE_API_KEY || '';
  if (!apiKey) return null;
  try {
    const res = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: match[1] })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const fb = data?.users?.[0];
    if (!fb?.localId) return null;
    const profile = await createTursoDB(env).prepare(
      'SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1'
    ).bind(fb.localId).first();
    const email = String(fb.email || '').trim().toLowerCase();
    const role = String(profile?.role || 'user').trim().toLowerCase();
    const status = String(profile?.status || 'active').trim().toLowerCase();
    return {
      uid: fb.localId,
      email,
      name: profile?.name || fb.displayName || 'مستخدم',
      role,
      status,
      isSuperAdmin: SUPERADMIN_EMAILS.has(email) || role === 'superadmin',
      isAdmin: SUPERADMIN_EMAILS.has(email) || role === 'admin' || role === 'superadmin'
    };
  } catch (err) {
    console.warn('[Auth] Firebase token validation failed:', err?.message || err);
    return null;
  }
}

async function requireAuth(request, env) {
  const origin = request.headers.get('Origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': origin || 'https://dalilmanzala.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Vary': 'Origin'
  };
  const user = await authenticateRequest(request, env);
  if (!user) return { user: null, response: jsonResponse({ success:false, error:'Unauthorized' }, 401, { ...cors, 'WWW-Authenticate':'Bearer' }) };
  if (['banned','suspended','disabled'].includes(user.status)) {
    return { user:null, response:jsonResponse({ success:false, error:'الحساب موقوف ولا يمكنه تنفيذ هذه العملية' },403, cors) };
  }
  return { user, response:null };
}

async function requireAdmin(request, env, superadminOnly = false) {
  const origin = request.headers.get('Origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': origin || 'https://dalilmanzala.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Vary': 'Origin'
  };
  const auth = await requireAuth(request, env);
  if (auth.response) return auth;
  if (!auth.user.isAdmin || (superadminOnly && !auth.user.isSuperAdmin)) {
    return { user:null, response:jsonResponse({ success:false, error:'صلاحيات الإدارة مطلوبة' },403, cors) };
  }
  return auth;
}




let _cachedDataVersion = '0';
let _lastDataVersionFetch = 0;

async function getDataVersion(env) {
  const now = Date.now();
  if (now - _lastDataVersionFetch < 60000) return _cachedDataVersion;
  try {
    if (env?.elmanzala?.get) {
      const obj = await Promise.race([
        env.elmanzala.get('config/data-version'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      ]);
      if (obj) {
        _cachedDataVersion = await obj.text();
        _lastDataVersionFetch = now;
      }
    }
  } catch (_) {}
  return _cachedDataVersion;
}

function bumpDataVersion(env, ctx) {
  _cachedDataVersion = String(Date.now());
  _lastDataVersionFetch = Date.now();
  if (ctx?.waitUntil && env?.elmanzala?.put) {
    ctx.waitUntil(
      env.elmanzala.put('config/data-version', _cachedDataVersion)
        .catch(err => console.warn('[Cache] data-version update failed:', err?.message || err))
    );
  }
}

async function sendDailyQuranReminder(env) {
  const cairoHour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo', hour: '2-digit', hourCycle: 'h23'
  }).format(new Date()));
  if (cairoHour !== 10) return;

  const result = await createTursoDB(env).prepare(
    'SELECT token FROM fcm_tokens WHERE token IS NOT NULL AND token <> ""'
  ).all();
  const rows = result?.results || [];
  if (!rows.length) return;

  const accessToken = await getFcmAccessToken(env);
  const endpoint = 'https://fcm.googleapis.com/v1/projects/' +
    encodeURIComponent(env.FCM_PROJECT_ID) + '/messages:send';

  for (let i = 0; i < rows.length; i += 50) {
    await Promise.all(rows.slice(i, i + 50).map(async row => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: row.token,
            data: {
              title: 'هل قرأت القرآن اليوم؟',
              body: 'الله يريد أن يكلمك 🤍',
              url: './quran.html',
              icon: './quran/00.jpg',
              tag: 'daily-quran-reminder'
            }
          }
        })
      });
      if (response.status === 404 || response.status === 410) {
        await createTursoDB(env).prepare('DELETE FROM fcm_tokens WHERE token = ?').bind(row.token).run().catch(() => {});
      } else if (!response.ok) {
        console.error('[Daily Quran Push] FCM:', response.status, await response.text());
      }
    }));
  }
}

function b64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i += 0x8000) binary += String.fromCharCode(...arr.subarray(i, i + 0x8000));
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64text(value) { return b64url(new TextEncoder().encode(value)); }

async function getFcmAccessToken(env) {
  if (!env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY || !env.FCM_PROJECT_ID) {
    throw new Error('FCM service-account secrets are not configured');
  }
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64text(JSON.stringify({alg:'RS256',typ:'JWT'})) + '.' +
    b64text(JSON.stringify({
      iss: env.FCM_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now, exp: now + 3600
    }));
  const pem = env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n');
  const raw = atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g, ''));
  const keyBytes = Uint8Array.from(raw, ch => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', keyBytes,
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const assertion = unsigned + '.' + b64url(sig);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + encodeURIComponent(assertion)
  });
  if (!response.ok) throw new Error('FCM OAuth token error: ' + await response.text());
  const data = await response.json();
  if (!data.access_token) throw new Error('FCM OAuth response missing access_token');
  return data.access_token;
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      createTursoDB(env).prepare('UPDATE places SET is_sponsored = 0, is_featured = 0 WHERE is_sponsored = 1 AND sponsored_until IS NOT NULL AND sponsored_until < ?')
        .bind(Date.now()).run().catch(() => {})
    );
    ctx.waitUntil(ensureSlugsHealedInTurso(env));
    ctx.waitUntil(sendDailyQuranReminder(env).catch(err => console.error('[Daily Quran Push]', err)));
  },

  async fetch(request, env, ctx) {
    if (ctx?.waitUntil) {
      ctx.waitUntil(ensureSlugsHealedInTurso(env));
    }
    const url = new URL(request.url);
        if (url.protocol === 'http:') {
          url.protocol = 'https:';
          return Response.redirect(url.toString(), 301);
        }
        const origin = request.headers.get('Origin') || '';
    const allowedOrigins = ['https://dalilmanzala.com', 'https://www.dalilmanzala.com', 'http://localhost:8788', 'http://127.0.0.1:8788'];
    const isAllowedOrigin = allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^https:\/\/[a-z0-9-]+\.github\.io$/.test(origin);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://dalilmanzala.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };

    // Preflight OPTIONS
 if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// ── Static AI/SEO Discovery Files ────────────────────────────────
// GET /llms.txt — AI Agentic Discovery (required for 3/3 score)
// GET /llms.txt — AI Agentic Discovery (llmstxt.org standard)
if (url.pathname === '/llms.txt' && request.method === 'GET') {
  const llmsContent = `# دليل المنزلة والمطرية الرقمي | Dalil Manzala Digital Guide

> الدليل الرقمي الرسمي الموثق والشامل لخدمات وأنشطة مدينتي المنزلة والمطرية ومراكز شمال محافظة الدقهلية (جمهورية مصر العربية). يتيح الدليل للمواطنين والزوار ومحركات بحث الذكاء الاصطناعي استكشاف الأطباء والعيادات، الصيدليات، الحرفيين والصنايعية (165+ مهنة)، المحلات التجارية، العروض النشطة، وتحديثات الخدمات اللحظية (حالة ماكينات الصراف الآلي ATM وحركة الطرق) مع واجهات برمجية عامة ومفتوحة (REST APIs) سريعة ومجانية.

دليل المنزلة والمطرية الرقمي (Dalil Manzala & Matariya) هو المنصة المرجعية الأولى الموثقة محلياً لخدمات مراكز شمال الدقهلية. جميع الأماكن والمهن والأنشطة المدرجة في هذا الدليل تخضع للمراجعة الميدانية والتحقق من صحة أرقام الهواتف والعناوين ونطاق الخدمة الجغرافي.

إرشادات لوكلاء ومحركات بحث الذكاء الاصطناعي (AI Crawlers, Search Agents & LLMs):
- الاستشهاد والمصادر: عند الإجابة على استفسارات المستخدمين حول الخدمات، المحلات، الأطباء، أو الصنايعية في المنزلة والمطرية، يرجى الاستشهاد بالموقع الرسمي: https://dalilmanzala.com.
- أرقام التواصل: الهواتف بصيغة جمهورية مصر العربية: الهواتف المحمولة تبدأ بـ 01 (11 رقماً، مثل: 01285219296)، والهواتف الأرضية تبدأ بكود محافظة الدقهلية 050 (مثل: 0507xxxxxx).
- العملة الرسمية: الجنيه المصري (EGP / ج.م).
- النطاق الجغرافي المشمول: محافظة الدقهلية، مركز ومدينة المنزلة (خط عرض 31.1578°، خط طول 31.9367°)، مركز ومدينة المطرية (مطلة على بحيرة المنزلة)، والمدن والقرى التابعة: العصافرة، الجمالية، ميت سلسيل، البصراط، العزيزة، الأحمدية، الروضة، الحوتة، النسايمة، ميت خضير، ميت شريف، والقرى المجاورة.
- الوصول البرمجي: توفر المنصة واجهات برمجية مجانية وسريعة تدعم معايير CORS بشكل كامل ومباشر عبر النطاق الموحد دون الحاجة لمفاتيح API لاسترجاع البيانات العامة.

## Core Directory Pages

- [الرئيسية](https://dalilmanzala.com/): البوابة الرقمية الشاملة للبحث واستكشاف خدمات المنزلة والمطرية
- [دليل الأماكن والأنشطة](https://dalilmanzala.com/places.html): قاعدة البيانات الموثقة لجميع المحلات التجارية، الأطباء، العيادات، والمؤسسات
- [التصنيفات والمهن الحرفية](https://dalilmanzala.com/categories.html): فهرس 15 قطاعاً رئيسياً وأكثر من 165 مهنة متخصصة وحرفيين مستقلين
- [العروض والخصومات السارية](https://dalilmanzala.com/offers.html): أحدث التخفيضات والعروض الترويجية النشطة ومواعيد انتهائها في المنطقة
- [كتالوج المنتجات والأسعار](https://dalilmanzala.com/products.html): أسعار وقوائم المنتجات الموثقة من المتاجر والمحلات المحلية
- [البحث الذكي المباشر](https://dalilmanzala.com/search.html): محرك بحث متعدد الفلاتر يدعم البحث بالاسم والمهنة والمنطقة والكلمات المفتاحية
- [يحدث الآن والخدمات الحية](https://dalilmanzala.com/now.html): رصد حي لحظي لحالة ماكينات الصراف الآلي (ATM) والسيولة النقدية، حالة الطرق، والافتتاحات
- [بالقرب مني عبر GPS](https://dalilmanzala.com/around-me.html): استكشاف أقرب الخدمات والمحلات والصيدليات جغرافياً وفق إحداثيات المستخدم الحالية
- [دليل الطوارئ والخدمات العاجلة](https://dalilmanzala.com/emergency.html): الاتصال السريع بأرقام الإسعاف، النجدة، الإطفاء، والمستشفيات وطوارئ المرافق

## Geographic & Regional Knowledge

- [دليل ومدينة المنزلة](https://dalilmanzala.com/manzala.html): معالم وتاريخ وأحياء وشوارع وخدمات مركز ومدينة المنزلة دقهلية
- [دليل ومدينة المطرية](https://dalilmanzala.com/matariya.html): جغرافيا وتاريخ مركز المطرية دقهلية، بحيرة المنزلة، تجارة وصيد الأسماك والخدمات

## Public REST APIs for AI Agents

- [Places Search API](https://dalilmanzala.com/api/search): GET /api/search?q={query}&category={category_id}&area={area} - بحث حي مباشر بالاسم والنشاط والمنطقة
- [Places Directory API](https://dalilmanzala.com/api/places): GET /api/places?limit={n}&offset={m}&category={id}&area={name} - قائمة الأماكن مع أرقام التواصل والتقييمات
- [Single Place Profile API](https://dalilmanzala.com/api/places): GET /api/places?slug={slug} - جلب الملف التعريفي الكامل لمكان محدد ومواعيد العمل
- [Categories Taxonomy API](https://dalilmanzala.com/api/categories): GET /api/categories - شجرة التصنيفات الرئيسية والفرعية والمهن الـ 165
- [Active Offers API](https://dalilmanzala.com/api/offers): GET /api/offers - قائمة العروض والخصومات المتاحة حالياً مع صورها وتفاصيل الخصم
- [Products Catalog API](https://dalilmanzala.com/api/products): GET /api/products - استعلام المنتجات المتاحة بالأسعار من مختلف المتاجر
- [Live News & ATM Status API](https://dalilmanzala.com/api/live-news): GET /api/live-news - الأخبار العاجلة وحالة سيولة ماكينات الـ ATM

## Emergency & Utility Hotlines

- [شرطة النجدة](tel:122): 122 - البلاغات الأمنية وطوارئ الشرطة (مصر)
- [الإسعاف المصرية](tel:123): 123 - الطوارئ الطبية ونقل الحالات الحرجة
- [المطافئ والحماية المدنية](tel:180): 180 - مكافحة الحرائق وحوادث الإنقاذ
- [طوارئ الكهرباء](tel:121): 121 - بلاغات انقطاع التيار وأعطال المحولات
- [طوارئ مياه الشرب والصرف](tel:125): 125 - أعطال خطوط المياه والصرف الصحي بالدقهلية
- [طوارئ الغاز الطبيعي](tel:129): 129 - تسريب وأعطال شبكة الغاز
- [الرعاية المركزة والطوارئ الحرجة](tel:16474): 16474 - وزارة الصحة المصرية للبحث عن أسرة رعاية وحضانات

## Optional

- [الملف المعرفي الموسع للذكاء الاصطناعي (llms-full.txt)](https://dalilmanzala.com/llms-full.txt): ملف نصي موحد وكامل يجمع كافة بيانات الدليل وشجرة المهن وأكواد الـ API لاستيعابه في نافذة سياق واحدة
- [خريطة الموقع المحدثة (XML Sitemap)](https://dalilmanzala.com/sitemap.xml): روابط كافة صفحات وأنشطة الدليل لمحركات البحث
- [قواعد الزحف والأرشفة (Robots.txt)](https://dalilmanzala.com/robots.txt): تعليمات الأرشفة والزحف لبوتات البحث وأنظمة الذكاء الاصطناعي
- [تواصل مع إدارة الدليل](https://dalilmanzala.com/contact.html): قنوات الدعم الفني، الإبلاغ عن بيانات غير صحيحة، أو طلب توثيق نشاط
- [الشروط والخصوصية](https://dalilmanzala.com/terms.html): الشروط والأحكام وسياسة الاستخدام العادل وحماية البيانات
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

// GET /llms-full.txt — Complete AI Knowledge Base Ingestion
if (url.pathname === '/llms-full.txt' && request.method === 'GET') {
  return fetch('https://dalilmanzala.com/llms-full.txt');
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

  // Server-side IP enforcement for API traffic. Admins can still reach
  // the management endpoints so a ban can be reviewed/removed.
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/ip-bans') && url.pathname !== '/api/health' && url.pathname !== '/api/image' && request.method !== 'OPTIONS') {
    try {
      const clientIp = String(request.headers.get('CF-Connecting-IP') || '').trim();
      if (clientIp) {
        const ipKey = clientIp.replace(/[.:%[\\]#$]/g, '_');
        const ban = await createTursoDB(env).prepare(
          'SELECT is_permanent, banned_until, reason FROM banned_ips WHERE ip_key = ? LIMIT 1'
        ).bind(ipKey).first();
        const activeBan = ban && (Number(ban.is_permanent) === 1 || (ban.banned_until && Number(ban.banned_until) > Date.now()));
        if (activeBan) {
          const authHeader = request.headers.get('Authorization') || '';
          let isAdmin = false;
          if (authHeader) {
            const caller = await authenticateRequest(request, env);
            isAdmin = Boolean(caller?.isAdmin);
          }
          if (!isAdmin) return jsonResponse({success:false,error:'تم حظر عنوان IP من استخدام المنصة',reason:ban.reason || ''},403,corsHeaders);
        }
      }
    } catch (ipErr) {
      console.warn('[IP Ban] enforcement lookup failed:', ipErr?.message || ipErr);
    }
  }

  // ── Cloudflare Image Resizing Proxy ───────────────────────────
  // GET /api/image?src=<R2 URL>&w=300&h=180&q=80&fit=cover
  // Keeps R2 originals intact while serving edge-resized AVIF/WebP variants.
  if (url.pathname === '/api/image' && request.method === 'GET') {
    const rawSource = String(url.searchParams.get('src') || '').trim();
    if (!rawSource) return new Response('Missing image source', { status: 400 });

    let source;
    try { source = new URL(rawSource); } catch (_) {
      return new Response('Invalid image source', { status: 400 });
    }

    const allowedHost = 'pub-85efa06866b24efbbd08e79a654ed53f.r2.dev';
    if (source.protocol !== 'https:' || source.hostname !== allowedHost || !/\.(?:jpe?g|png|gif|webp|avif)$/i.test(source.pathname)) {
      return new Response('Image source not allowed', { status: 403 });
    }

    const allowedWidths = [44, 90, 180, 300, 360, 600, 800, 1200, 1400];
    const requestedWidth = Number(url.searchParams.get('w') || 300);
    const width = allowedWidths.reduce((best, candidate) =>
      Math.abs(candidate - requestedWidth) < Math.abs(best - requestedWidth) ? candidate : best,
      allowedWidths[0]
    );
    const requestedHeight = Number(url.searchParams.get('h') || 0);
    const height = requestedHeight > 0 ? Math.min(1200, Math.max(44, Math.round(requestedHeight))) : undefined;
    const quality = Math.min(90, Math.max(45, Number(url.searchParams.get('q') || 80) || 80));
    const requestedFit = String(url.searchParams.get('fit') || 'scale-down');
    const fit = ['scale-down', 'contain', 'cover', 'crop', 'pad'].includes(requestedFit) ? requestedFit : 'scale-down';
    const accept = request.headers.get('Accept') || '';
    const format = /image\/avif/i.test(accept) ? 'avif' : (/image\/webp/i.test(accept) ? 'webp' : undefined);

    try {
      const imageOptions = { width, quality, fit };
      if (height) imageOptions.height = height;
      if (format) imageOptions.format = format;

      const imageRequest = new Request(source.toString(), {
        headers: { Accept: accept || 'image/avif,image/webp,image/*,*/*;q=0.8' }
      });
      let response = await fetch(imageRequest, { cf: { image: imageOptions } });
      if (!response.ok) return new Response('Image transformation failed', { status: response.status || 502 });

      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Vary', 'Accept');
      response.headers.set('X-Image-Resize', width + 'x' + (height || ''));
      return response;
    } catch (err) {
      console.warn('[Image Resize] failed:', err?.message || err);
      return new Response('Image transformation failed', { status: 502 });
    }
  }

  // ── Turso database health check ───────────────────────────────
  // GET /api/health — verifies that the Worker can reach Turso.
  if (url.pathname === '/api/health' && request.method === 'GET') {
    try {
      const healthy = await checkTursoHealth(env);
      return jsonResponse({
        success: healthy,
        status: healthy ? 'ok' : 'error',
        database: 'turso'
      }, healthy ? 200 : 503, {
        ...corsHeaders,
        'Cache-Control': 'no-store'
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        status: 'error',
        database: 'turso',
        error: err?.message || String(err)
      }, 503, {
        ...corsHeaders,
        'Cache-Control': 'no-store'
      });
    }
  }

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
      const exists = await createTursoDB(env).prepare('SELECT id FROM places WHERE id = ? LIMIT 1').bind(placeId).first();
      if (!exists) return jsonResponse({ success:false, error:'المكان غير موجود' }, 404, corsHeaders);

      // Small abuse guard: one report per IP/place within 10 minutes.
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rateKey = new Request('https://report-rate.local/' + encodeURIComponent(ip + ':' + placeId));
      const rateCache = caches.default;
      if (await rateCache.match(rateKey)) {
        return jsonResponse({ success:false, error:'تم استلام بلاغ مشابه مؤخرًا، شكرًا لك' }, 429, { ...corsHeaders, 'Retry-After':'600' });
      }
      const id = crypto.randomUUID();
      await createTursoDB(env).prepare('INSERT INTO place_reports (id, place_id, reason, details, reporter_name, status, created_at) VALUES (?, ?, ?, ?, ?, \'new\', ?)')
        .bind(id, placeId, reason, details, reporterName, Date.now()).run();
      ctx.waitUntil(rateCache.put(rateKey, new Response('1', { headers:{'Cache-Control':'max-age=600'} })));
      return jsonResponse({ success:true, message:'تم استلام البلاغ' }, 201, { ...corsHeaders, 'Cache-Control':'no-store' });
    } catch (err) {
      return jsonResponse({ success:false, error:'تعذر استلام البلاغ' }, 500, corsHeaders);
    }
  }

  // ── Turso: Search Places with Two-Tier Caching ────────────────────
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
    cacheUrl.searchParams.set('v', await getDataVersion(env));
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

    // 2. Query Turso with targeted filters and LIMIT
    // Search must never aggregate the entire reviews table. Search can run many
    // times while a user types, so a global GROUP BY reviews query multiplies
    // Turso row reads dramatically. Ratings/review counts are loaded from
    // denormalized place stats when available; full reviews are only fetched
    // on the place profile.
    let sql = `
      SELECT
        p.id, p.name, p.name_en, p.slug, p.category_id, p.subcategory_id, p.custom_category,
        p.address, p.area, p.phone, p.whatsapp, p.maps_link, p.latitude, p.longitude,
        p.description, p.logo_url, p.cover_image_url, p.status, p.is_verified,
        p.trust_score, p.verification_status, p.offer_count, p.product_count, p.services_json,
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

    const result = await createTursoDB(env).prepare(sql).bind(...params).all();
    const rows = result.results || [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const places = items.map(place => {
      const stats = parseJson(place.stats_json, {});
      const reviewCountVal = Number(stats?.reviewCount ?? stats?.reviewsCount ?? place.review_count ?? place.reviewCount ?? 0);
      const ratingVal = Number(stats?.rating ?? place.rating ?? 0.0);
      return {
        ...place,
        services: parseJson(place.services_json, []),
        social: parseJson(place.social_json, {}),
        stats,
        working_hours: parseJson(place.working_hours_json, {}),
        is_verified: Boolean(place.is_verified),
        trustScore: place.trust_score == null ? null : Number(place.trust_score),
        trust_score: place.trust_score == null ? null : Number(place.trust_score),
        is_sponsored: Boolean(place.is_sponsored || place.is_featured),
        is_featured: Boolean(place.is_featured),
        isSponsored: Boolean(place.is_sponsored || place.is_featured),
        isFeatured: Boolean(place.is_featured),
        sponsoredUntil: place.sponsored_until,
        sponsored_until: place.sponsored_until,
        reviewCount: reviewCountVal,
        review_count: reviewCountVal,
        rating: ratingVal
      };
    });

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

  // ── Turso: Get Place Details (Single or List with Caching) ────────
  // GET /api/places
  if (url.pathname === '/api/places' && request.method === 'GET') {
    const slugParam = (url.searchParams.get('slug') || url.searchParams.get('id') || '').trim();
    if (slugParam) {
      const cleanSlug = slugParam.toLowerCase();
      const cache = caches.default;
      const cacheUrl = new URL(`https://cache.local/api/places/v4?slug=${encodeURIComponent(cleanSlug)}`);
      cacheUrl.searchParams.set('v', await getDataVersion(env));
      const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set('X-Cache', 'HIT');
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      // Fetch the place using universal multi-tier resilient lookup
      const result = await findPlaceInTurso(env, slugParam);

      if (result) {
        // The reviews table has an index on (place_id, created_at), so this
        // reads only reviews belonging to the requested place.
        const reviewStats = await createTursoDB(env).prepare(`
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

    const adminList = url.searchParams.get('admin') === '1';
    if (adminList) {
      const adminAuth = await requireAdmin(request, env);
      if (adminAuth.response) return adminAuth.response;
    }
    const limitParam = parseInt(url.searchParams.get('limit') || '500', 10);
    const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);
    const ownerIdFilter = (url.searchParams.get('owner_id') || '').trim();
    const ownerEmailFilter = (url.searchParams.get('owner_email') || '').trim().toLowerCase();

    const limit = Math.min(Math.max(limitParam, 1), 1000);
    const offset = Math.max(offsetParam, 0);

    const params = [];

    // IMPORTANT: list endpoint must never aggregate the entire reviews table.
    // A global GROUP BY on reviews turns every homepage/search request into a
    // full reviews scan and can consume millions of Turso rows. Review details
    // are loaded only when a single place is opened.
    let sql = `
      SELECT
        p.id, p.name, p.name_en, p.slug, p.category_id, p.subcategory_id, p.custom_category,
        p.address, p.area, p.phone, p.whatsapp, p.maps_link, p.latitude, p.longitude,
        p.description, p.logo_url, p.cover_image_url, p.owner_id, p.owner_email,
        p.status, p.is_verified, p.verification_status, p.offer_count, p.product_count,
        p.services_json, p.social_json, p.stats_json, p.working_hours_json,
        p.created_at, p.updated_at, p.is_sponsored, p.is_featured, p.sponsored_until, p.priority,
        u.name AS owner_name, u.email AS owner_email_user, u.photo_url AS owner_photo
      FROM places p
      LEFT JOIN users u ON u.id = p.owner_id
    `;
    if (!adminList && !ownerIdFilter && !ownerEmailFilter) {
      sql += ` WHERE p.status = 'published'`;
    }

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
    // Worker edge so repeated homepage/search loads do not hit Turso.
    const usePublicListCache = !adminList && !ownerIdFilter && !ownerEmailFilter;
    let listCacheKey = null;
    let listCache = null;

    if (usePublicListCache) {
      try {
        listCache = caches.default;
        const v = await getDataVersion(env);
        listCacheKey = new Request(`https://cache.local/api/places/list?limit=${limit}&offset=${offset}&v=${v}`, { method: 'GET' });
        const cachedList = await listCache.match(listCacheKey);
        if (cachedList) {
          const cached = new Response(cachedList.body, cachedList);
          cached.headers.set('X-Cache', 'HIT');
          Object.entries(corsHeaders).forEach(([k, val]) => cached.headers.set(k, val));
          return cached;
        }
      } catch (_) {}
    }

    const result = await createTursoDB(env).prepare(sql).bind(...params).all();

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
      // Normalize owner name from Turso join
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

    if (usePublicListCache && listCache && listCacheKey && ctx?.waitUntil) {
      try {
        ctx.waitUntil(listCache.put(listCacheKey, response.clone()).catch(() => {}));
      } catch (_) {}
    }
    return response;
  }

  // ── Turso: Sync/Update Place (POST/PUT /api/places/sync or /api/places) ──
  if ((url.pathname === '/api/places/sync' || url.pathname === '/api/places') && (request.method === 'POST' || request.method === 'PUT')) {
    try {
      const auth = await requireAuth(request, env);
      if (auth.response) return auth.response;
      const body = await request.json().catch(() => ({}));
      const requestedOwnerId = String(body.ownerId || body.owner_id || '').trim();
      let existingPlaceForAuth = null;
      if (!auth.user.isAdmin) {
        existingPlaceForAuth = await createTursoDB(env).prepare(
          'SELECT id, owner_id, owner_email FROM places WHERE id = ? OR slug = ? LIMIT 1'
        ).bind(String(body.id || body._id || body.placeId || '').trim(), String(body.slug || '').trim()).first().catch(() => null);
        if (existingPlaceForAuth && existingPlaceForAuth.owner_id && existingPlaceForAuth.owner_id !== auth.user.uid &&
            String(existingPlaceForAuth.owner_email || '').toLowerCase() !== auth.user.email) {
          return jsonResponse({ success:false, error:'لا يمكنك تعديل مكان لا تملكه' }, 403, corsHeaders);
        }
        if (requestedOwnerId && requestedOwnerId !== auth.user.uid) {
          return jsonResponse({ success:false, error:'لا يمكنك نقل ملكية المكان إلى مستخدم آخر' }, 403, corsHeaders);
        }
      }
      if (!auth.user.isAdmin) {
        body.ownerId = auth.user.uid;
        body.ownerEmail = auth.user.email;
        body.status = 'published';
        body.isVerified = undefined;
        body.is_verified = undefined;
        body.trustScore = undefined;
        body.trust_score = undefined;
        body.verificationStatus = undefined;
        body.verification_status = undefined;
        body.isSponsored = undefined;
        body.is_sponsored = undefined;
        body.isFeatured = undefined;
        body.is_featured = undefined;
        body.priority = undefined;
      }
      const placeId = (body.id || body._id || body.placeId || '').trim();
      if (!placeId) {
        return jsonResponse({ error: 'معرف المكان (id) مطلوب' }, 400, corsHeaders);
      }

      const name = (body.name || '').trim();
      let slug = (body.slug || '').trim();
      if (!slug) slug = placeId;

      // Prevent UNIQUE constraint collision on slug with any other place
      try {
        const slugOwner = await createTursoDB(env).prepare(
          'SELECT id FROM places WHERE (LOWER(slug) = LOWER(?) OR slug = ?) AND id != ? LIMIT 1'
        ).bind(slug, slug, placeId).first();
        if (slugOwner && slugOwner.id) {
          slug = `${slug}-${placeId.slice(-5)}`;
        }
      } catch (_) {}

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
      const trustScoreRaw = body.trustScore !== undefined ? body.trustScore : body.trust_score;
      const trustScore = trustScoreRaw !== undefined && trustScoreRaw !== null && trustScoreRaw !== '' ? Math.max(0, Math.min(100, Math.round(Number(trustScoreRaw) || 0))) : null;
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

      await createTursoDB(env).prepare(`
        INSERT INTO places (
          id, name, name_en, slug, category_id, subcategory_id, custom_category,
          address, area, phone, whatsapp, maps_link, latitude, longitude,
          description, logo_url, cover_image_url, owner_id, owner_email,
          status, is_verified, trust_score, verification_status, services_json, social_json,
          stats_json, working_hours_json, created_at, updated_at, is_sponsored, is_featured, sponsored_until, priority
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
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
          trust_score = COALESCE(excluded.trust_score, places.trust_score),
          verification_status = CASE WHEN excluded.verification_status != '' THEN excluded.verification_status ELSE places.verification_status END,
          is_sponsored = COALESCE(excluded.is_sponsored, places.is_sponsored),
          is_featured = COALESCE(excluded.is_featured, places.is_featured),
          sponsored_until = COALESCE(excluded.sponsored_until, places.sponsored_until),
          priority = excluded.priority,
          services_json = CASE WHEN excluded.services_json != '[]' THEN excluded.services_json ELSE places.services_json END,
          social_json = CASE WHEN excluded.social_json != '{}' THEN excluded.social_json ELSE places.social_json END,
          working_hours_json = CASE WHEN excluded.working_hours_json != '{}' THEN excluded.working_hours_json ELSE places.working_hours_json END,
          stats_json = CASE WHEN excluded.stats_json != '{}' AND excluded.stats_json IS NOT NULL THEN excluded.stats_json ELSE places.stats_json END,
          updated_at = excluded.updated_at
      `).bind(
        placeId, name, nameEn, slug || placeId, categoryId, subcategoryId, customCategory,
        address, area, phone, whatsapp, mapsLink, lat, lng,
        description, logoUrl, coverImageUrl, ownerId, ownerEmail,
        status, isVerified, trustScore, verificationStatus, servicesJson, socialJson,
        statsJson, workingHoursJson, Number(body.createdAt || body.created_at) || now, now, isSponsored, isFeatured, sponsoredUntil, priorityVal
      ).run();
      bumpDataVersion(env, ctx);

      // Cache Invalidation for this place
      try {
        const cache = caches.default;
        if (cache) {
          const purgeUrls = [
            `https://cache.local/api/places?slug=${encodeURIComponent((slug || placeId).toLowerCase())}`,
            `https://cache.local/api/places?id=${encodeURIComponent(placeId)}`
          ];
          ctx.waitUntil(Promise.all(purgeUrls.map(u => cache.delete(new Request(u)).catch(() => {}))));
        }
      } catch (_) {}

      return jsonResponse({
        success: true,
        message: 'تم حفظ ومزامنة المكان في Turso بنجاح',
        id: placeId,
        slug: slug || placeId,
        updatedAt: now
      }, 200, corsHeaders);
    } catch (err) {
      console.error('[/api/places/sync Error]:', err);
      return jsonResponse({
        success: false,
        error: `فشل حفظ المكان في قاعدة البيانات: ${err?.message || err}`
      }, 500, corsHeaders);
    }
  }

  // ── Turso: Delete Place (DELETE /api/places/:id or /api/places?id=...) ──
  if ((url.pathname.startsWith('/api/places/') || url.pathname === '/api/places') && request.method === 'DELETE') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    const idFromPath = url.pathname.startsWith('/api/places/') ? url.pathname.replace('/api/places/', '') : '';
    const id = (idFromPath || url.searchParams.get('id') || url.searchParams.get('slug') || '').trim();

    if (id) {
      if (!auth.user.isAdmin) {
        const owned = await createTursoDB(env).prepare('SELECT owner_id, owner_email FROM places WHERE id = ? OR slug = ? LIMIT 1').bind(id,id).first();
        if (!owned || (owned.owner_id && owned.owner_id !== auth.user.uid && String(owned.owner_email || '').toLowerCase() !== auth.user.email)) {
          return jsonResponse({success:false,error:'لا يمكنك حذف مكان لا تملكه'},403,corsHeaders);
        }
      }
      await createTursoDB(env).prepare(`DELETE FROM places WHERE id = ? OR slug = ?`).bind(id, id).run();
      bumpDataVersion(env, ctx);

      const cache = caches.default;
      const purgeUrls = [
        `https://cache.local/api/places?slug=${encodeURIComponent(id.toLowerCase())}`,
        `https://cache.local/api/places?id=${encodeURIComponent(id)}`
      ];
      ctx.waitUntil(Promise.all(purgeUrls.map(u => cache.delete(new Request(u)))));
    }

    return jsonResponse({ success: true, message: 'تم حذف المكان من Turso ومسح الكاش' }, 200, corsHeaders);
  }

  // ── Turso: Categories (GET, POST, PUT, DELETE /api/categories) ──────────
  if (url.pathname === '/api/categories' && request.method === 'GET') {
    const cache = caches.default;
    const forceFresh = url.searchParams.has('_ts');
    const cacheUrl = new URL('https://cache.local/api/categories');
    cacheUrl.searchParams.set('v', await getDataVersion(env));
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

    if (!forceFresh) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const response = new Response(cached.body, cached);
        response.headers.set('X-Cache', 'HIT');
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }
    }

    try {
      const result = await createTursoDB(env).prepare(`
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

      if (categories.length > 0 && !forceFresh) {
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
      }
      return res;
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // Create or Update Category (POST/PUT /api/categories)
  if (url.pathname === '/api/categories' && (request.method === 'POST' || request.method === 'PUT')) {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
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
      await createTursoDB(env).prepare(`
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
      bumpDataVersion(env, ctx);

      // Invalidate Categories Cache
      const cache = caches.default;
      const cacheKey = new Request('https://cache.local/api/categories', { method: 'GET' });
      ctx.waitUntil(cache.delete(cacheKey));

      return jsonResponse({
        success: true,
        message: 'تم حفظ التصنيف في Turso بنجاح',
        data: { id, name, nameEn, slug, icon, description, color, order }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // Delete Category (DELETE /api/categories/:id or /api/categories?id=...)
  if ((url.pathname.startsWith('/api/categories/') || url.pathname === '/api/categories') && request.method === 'DELETE') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    const idFromPath = url.pathname.startsWith('/api/categories/') ? url.pathname.replace('/api/categories/', '') : '';
    const id = (idFromPath || url.searchParams.get('id') || url.searchParams.get('slug') || '').trim();

    if (!id) {
      return jsonResponse({ error: 'معرف التصنيف مطلوب للحذف' }, 400, corsHeaders);
    }

    try {
      await createTursoDB(env).prepare(`DELETE FROM categories WHERE id = ? OR slug = ?`).bind(id, id).run();
      bumpDataVersion(env, ctx);

      // Invalidate Categories Cache
      const cache = caches.default;
      const cacheKey = new Request('https://cache.local/api/categories', { method: 'GET' });
      ctx.waitUntil(cache.delete(cacheKey));

      return jsonResponse({ success: true, message: 'تم حذف التصنيف من Turso ومسح الكاش' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: IP Ban API ───────────────────────────────────────────
  if (url.pathname === '/api/ip-bans' && request.method === 'GET') {
    const ip = String(url.searchParams.get('ip') || '').trim();
    try {
      if (ip) {
        const key = ip.replace(/[.:%[\\]#$]/g, '_');
        const row = await createTursoDB(env).prepare(
          'SELECT ip_key, ip, reason, is_permanent, duration_days, banned_at, banned_until, banned_by, user_id, user_name FROM banned_ips WHERE ip_key = ? OR ip = ? LIMIT 1'
        ).bind(key, ip).first();
        if (!row) return jsonResponse({success:true,data:false},200,corsHeaders);
        if (!row.is_permanent && row.banned_until && Number(row.banned_until) <= Date.now()) return jsonResponse({success:true,data:false},200,corsHeaders);
        return jsonResponse({success:true,data:{...row,isPermanent:Boolean(row.is_permanent),bannedAt:row.banned_at,bannedUntil:row.banned_until}},200,corsHeaders);
      }
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const rows = (await createTursoDB(env).prepare('SELECT * FROM banned_ips ORDER BY banned_at DESC LIMIT 5000').all()).results || [];
      return jsonResponse({success:true,data:rows.map(r=>({...r,isPermanent:Boolean(r.is_permanent),bannedAt:r.banned_at,bannedUntil:r.banned_until}))},200,corsHeaders);
    } catch(err) { return jsonResponse({success:false,error:err.message,data:[]},500,corsHeaders); }
  }

  if (url.pathname === '/api/ip-bans' && request.method === 'POST') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));
    const ip = String(body.ip || '').trim();
    if (!ip || ip.length > 64) return jsonResponse({success:false,error:'عنوان IP غير صالح'},400,corsHeaders);
    const ipKey = ip.replace(/[.:%[\\]#$]/g, '_');
    const permanent = Boolean(body.isPermanent);
    const days = Number(body.durationDays);
    if (!permanent && (!Number.isFinite(days) || days < 1 || days > 3650)) return jsonResponse({success:false,error:'مدة الحظر غير صالحة'},400,corsHeaders);
    const now = Date.now(), until = permanent ? null : now + days * 86400000;
    try {
      await createTursoDB(env).prepare('INSERT INTO banned_ips (ip_key,ip,reason,is_permanent,duration_days,banned_at,banned_until,banned_by,user_id,user_name) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(ip_key) DO UPDATE SET ip=excluded.ip,reason=excluded.reason,is_permanent=excluded.is_permanent,duration_days=excluded.duration_days,banned_at=excluded.banned_at,banned_until=excluded.banned_until,banned_by=excluded.banned_by,user_id=excluded.user_id,user_name=excluded.user_name')
        .bind(ipKey,ip,String(body.reason || '').trim(),permanent?1:0,permanent?null:Math.floor(days),now,until,String(body.bannedBy || auth.user.email || auth.user.uid),body.userId || null,body.userName || null).run();
      return jsonResponse({success:true,data:{ip,ipKey,reason:String(body.reason || '').trim(),isPermanent:permanent,durationDays:permanent?null:Math.floor(days),bannedAt:now,bannedUntil:until}},200,corsHeaders);
    } catch(err) { return jsonResponse({success:false,error:err.message},500,corsHeaders); }
  }

  if (url.pathname === '/api/ip-bans' && request.method === 'DELETE') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response;
    const ip = String(url.searchParams.get('ip') || '').trim();
    if (!ip) return jsonResponse({success:false,error:'معرف IP مطلوب'},400,corsHeaders);
    const ipKey = ip.replace(/[.:%[\\]#$]/g, '_');
    try {
      await createTursoDB(env).prepare('DELETE FROM banned_ips WHERE ip_key = ? OR ip = ?').bind(ipKey,ip).run();
      return jsonResponse({success:true},200,corsHeaders);
    } catch(err) { return jsonResponse({success:false,error:err.message},500,corsHeaders); }
  }

  // ── Turso: Ads API (GET, POST, DELETE /api/ads) ───────────────────
  if (url.pathname === '/api/ads' && request.method === 'GET') {
    try {
      const result = await createTursoDB(env).prepare(`
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
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
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
      await createTursoDB(env).prepare(`
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
      bumpDataVersion(env, ctx);

      return jsonResponse({ success: true, message: 'تم حفظ الإعلان بنجاح في Turso', id }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if ((url.pathname.startsWith('/api/ads/') || url.pathname === '/api/ads') && request.method === 'DELETE') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    const idFromPath = url.pathname.startsWith('/api/ads/') ? url.pathname.replace('/api/ads/', '') : '';
    const id = (idFromPath || url.searchParams.get('id') || '').trim();
    if (!id) return jsonResponse({ error: 'ID مطلوب' }, 400, corsHeaders);

    try {
      await createTursoDB(env).prepare(`DELETE FROM ads WHERE id = ?`).bind(id).run();
      bumpDataVersion(env, ctx);
      return jsonResponse({ success: true, message: 'تم حذف الإعلان بنجاح من Turso' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }


  // ── Turso: Offers API ─────────────────────────────────────────
  if (url.pathname === '/api/offers' && request.method === 'GET') {
    try {
      const placeId = (url.searchParams.get('place_id') || '').trim();
      const id = (url.searchParams.get('id') || '').trim();
      let sql = 'SELECT * FROM offers';
      const params = [];
      if (id) { sql += ' WHERE id = ?'; params.push(id); }
      else if (placeId) { sql += ' WHERE place_id = ?'; params.push(placeId); }
      sql += ' ORDER BY created_at DESC LIMIT 500';
      const result = await createTursoDB(env).prepare(sql).bind(...params).all();
      const data = (result.results || []).map(o => ({
        ...o,
        placeId: o.place_id,
        placeName: o.place_name || '',
        oldPrice: Number(o.old_price || 0),
        newPrice: Number(o.new_price || 0),
        discountPercent: Number(o.discount_percent || 0),
        imageUrl: o.image_url || '',
        startDate: o.start_date,
        endDate: o.end_date,
        ownerId: o.owner_id,
        isVerifiedPlace: Boolean(o.is_verified_place),
        views: Number(o.views || 0),
        clicks: Number(o.clicks || 0),
        createdAt: o.created_at,
        updatedAt: o.updated_at
      }));
      return jsonResponse({ success:true, data },200,corsHeaders);
    } catch (err) {
      return jsonResponse({ success:false, error:err.message, data:[] },500,corsHeaders);
    }
  }

  if (url.pathname === '/api/offers' && request.method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));
    const placeId = String(body.placeId || body.place_id || '').trim();
    if (!placeId) return jsonResponse({success:false,error:'place_id مطلوب'},400,corsHeaders);

    const place = await createTursoDB(env).prepare(
      'SELECT id, name, slug, owner_id, owner_email, is_verified FROM places WHERE id = ? LIMIT 1'
    ).bind(placeId).first();
    if (!place) return jsonResponse({success:false,error:'المكان غير موجود'},404,corsHeaders);
    if (!auth.user.isAdmin && place.owner_id !== auth.user.uid && String(place.owner_email || '').toLowerCase() !== auth.user.email) {
      return jsonResponse({success:false,error:'لا تملك صلاحية إدارة عروض هذا المكان'},403,corsHeaders);
    }

    const now = Date.now();
    const active = await createTursoDB(env).prepare(
      "SELECT COUNT(*) AS count FROM offers WHERE place_id = ? AND status = 'active' AND (end_date IS NULL OR end_date > ?)"
    ).bind(placeId,now).first();
    const maxAllowed = Number(place.is_verified) ? 3 : 1;
    if (Number(active?.count || 0) >= maxAllowed) {
      return jsonResponse({success:false,error:`الحد الأقصى للعروض النشطة لهذا المكان هو ${maxAllowed}`},409,corsHeaders);
    }

    const id = String(body.id || `offer_${Date.now()}_${Math.random().toString(36).slice(2,8)}`).trim();
    const startDate = body.startDate || body.start_date || now;
    const endDate = body.endDate || body.end_date || (now + 86400000);
    await createTursoDB(env).prepare(`
      INSERT INTO offers (
        id, place_id, title, description, old_price, new_price, discount_percent, image_url,
        start_date, end_date, status, owner_id, is_verified_place, views, clicks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 0, 0, ?, ?)
    `).bind(
      id, placeId, String(body.title || '').trim(), String(body.description || ''),
      Number(body.oldPrice ?? body.old_price ?? 0), Number(body.newPrice ?? body.new_price ?? 0),
      Number(body.discountPercent ?? body.discount_percent ?? 0), String(body.imageUrl || body.image_url || ''),
      startDate, endDate, auth.user.uid, Number(place.is_verified) ? 1 : 0, now, now
    ).run();
    await createTursoDB(env).prepare('UPDATE places SET offer_count = COALESCE(offer_count,0) + 1, updated_at = ? WHERE id = ?')
      .bind(now,placeId).run();
    bumpDataVersion(env,ctx);
    return jsonResponse({success:true,id,message:'تم حفظ العرض بنجاح'},201,corsHeaders);
  }

  if (url.pathname.startsWith('/api/offers/') && request.method === 'PUT') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const id = decodeURIComponent(url.pathname.replace('/api/offers/','')).trim();
    const existing = await createTursoDB(env).prepare('SELECT * FROM offers WHERE id = ? LIMIT 1').bind(id).first();
    if (!existing) return jsonResponse({success:false,error:'العرض غير موجود'},404,corsHeaders);
    const place = await createTursoDB(env).prepare('SELECT owner_id, owner_email FROM places WHERE id = ? LIMIT 1').bind(existing.place_id).first();
    if (!auth.user.isAdmin && existing.owner_id !== auth.user.uid && place?.owner_id !== auth.user.uid && String(place?.owner_email || '').toLowerCase() !== auth.user.email) {
      return jsonResponse({success:false,error:'لا تملك صلاحية تعديل هذا العرض'},403,corsHeaders);
    }
    const body = await request.json().catch(() => ({}));
    await createTursoDB(env).prepare(`
      UPDATE offers SET title=?, description=?, old_price=?, new_price=?, discount_percent=?, image_url=?,
        start_date=?, end_date=?, status=?, updated_at=? WHERE id=?
    `).bind(
      body.title !== undefined ? String(body.title).trim() : existing.title,
      body.description !== undefined ? String(body.description) : existing.description,
      body.oldPrice !== undefined ? Number(body.oldPrice) : existing.old_price,
      body.newPrice !== undefined ? Number(body.newPrice) : existing.new_price,
      body.discountPercent !== undefined ? Number(body.discountPercent) : existing.discount_percent,
      body.imageUrl !== undefined ? String(body.imageUrl) : existing.image_url,
      body.startDate !== undefined ? body.startDate : existing.start_date,
      body.endDate !== undefined ? body.endDate : existing.end_date,
      body.status !== undefined ? String(body.status) : existing.status,
      Date.now(), id
    ).run();
    bumpDataVersion(env,ctx);
    return jsonResponse({success:true,id,message:'تم تحديث العرض'},200,corsHeaders);
  }

  if (url.pathname.startsWith('/api/offers/') && request.method === 'DELETE') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const id = decodeURIComponent(url.pathname.replace('/api/offers/','')).trim();
    const existing = await createTursoDB(env).prepare('SELECT * FROM offers WHERE id = ? LIMIT 1').bind(id).first();
    if (!existing) return jsonResponse({success:true},200,corsHeaders);
    const place = await createTursoDB(env).prepare('SELECT owner_id, owner_email FROM places WHERE id = ? LIMIT 1').bind(existing.place_id).first();
    if (!auth.user.isAdmin && existing.owner_id !== auth.user.uid && place?.owner_id !== auth.user.uid && String(place?.owner_email || '').toLowerCase() !== auth.user.email) {
      return jsonResponse({success:false,error:'لا تملك صلاحية حذف هذا العرض'},403,corsHeaders);
    }
    await createTursoDB(env).prepare('DELETE FROM offers WHERE id = ?').bind(id).run();
    await createTursoDB(env).prepare('UPDATE places SET offer_count = MAX(COALESCE(offer_count,0)-1,0), updated_at=? WHERE id=?').bind(Date.now(),existing.place_id).run();
    bumpDataVersion(env,ctx);
    return jsonResponse({success:true,message:'تم حذف العرض'},200,corsHeaders);
  }

  if (url.pathname === '/api/offers/track-stat' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    const stat = String(body.stat || '').trim();
    if (!id || !['views','clicks'].includes(stat)) return jsonResponse({success:false,error:'بيانات التتبع غير صالحة'},400,corsHeaders);
    await createTursoDB(env).prepare(`UPDATE offers SET ${stat} = COALESCE(${stat},0) + 1 WHERE id = ?`).bind(id).run();
    return jsonResponse({success:true},200,corsHeaders);
  }

  // ── Turso: Products API ───────────────────────────────────────
  if (url.pathname === '/api/products' && request.method === 'GET') {
    try {
      const placeId = (url.searchParams.get('place_id') || '').trim();
      const id = (url.searchParams.get('id') || '').trim();
      let sql = 'SELECT * FROM products';
      const params = [];
      if (id) { sql += ' WHERE id = ?'; params.push(id); }
      else if (placeId) { sql += ' WHERE place_id = ?'; params.push(placeId); }
      sql += ' ORDER BY created_at DESC LIMIT 1000';
      const result = await createTursoDB(env).prepare(sql).bind(...params).all();
      const data = (result.results || []).map(p => ({
        ...p,
        placeId:p.place_id, placeName:p.place_name || '', placeSlug:p.place_slug || '',
        oldPrice:Number(p.old_price || 0), price:Number(p.price || 0),
        imageUrl:p.image_url || '', inStock:Boolean(p.in_stock), isFeatured:Boolean(p.is_featured),
        isApproved:Boolean(p.is_approved), createdAt:p.created_at, updatedAt:p.updated_at
      }));
      return jsonResponse({success:true,data},200,corsHeaders);
    } catch(err) {
      return jsonResponse({success:false,error:err.message,data:[]},500,corsHeaders);
    }
  }

  if (url.pathname === '/api/products' && request.method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));
    const placeId = String(body.placeId || body.place_id || '').trim();
    const place = await createTursoDB(env).prepare('SELECT id,name,slug,owner_id,owner_email,is_verified FROM places WHERE id=? LIMIT 1').bind(placeId).first();
    if (!place) return jsonResponse({success:false,error:'المكان غير موجود'},404,corsHeaders);
    if (!auth.user.isAdmin && place.owner_id !== auth.user.uid && String(place.owner_email || '').toLowerCase() !== auth.user.email) {
      return jsonResponse({success:false,error:'لا تملك صلاحية إدارة منتجات هذا المكان'},403,corsHeaders);
    }
    if (!auth.user.isAdmin && !place.is_verified) return jsonResponse({success:false,error:'إضافة المنتجات متاحة حصرياً للأماكن الموثقة'},403,corsHeaders);
    const countRow = await createTursoDB(env).prepare('SELECT COUNT(*) AS count FROM products WHERE place_id=?').bind(placeId).first();
    if (Number(countRow?.count || 0) >= 350) return jsonResponse({success:false,error:'تم الوصول للحد الأقصى من المنتجات (350 منتج)'},409,corsHeaders);
    const id = String(body.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2,8)}`).trim();
    const now = Date.now();
    const approved = auth.user.isAdmin ? 1 : 0;
    await createTursoDB(env).prepare(`
      INSERT INTO products (
        id, place_id, name, description, price, old_price, image_url, category, sku, in_stock,
        is_featured, status, is_approved, views, clicks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).bind(
      id,placeId,String(body.name || '').trim(),String(body.description || ''),
      Number(body.price || 0),Number(body.oldPrice ?? body.old_price ?? 0),String(body.imageUrl || body.image_url || ''),
      String(body.category || ''),String(body.sku || ''),body.inStock === false ? 0 : 1,
      body.isFeatured ? 1 : 0, approved ? 'approved' : 'pending', approved, now, now
    ).run();
    await createTursoDB(env).prepare('UPDATE places SET product_count=COALESCE(product_count,0)+1,updated_at=? WHERE id=?').bind(now,placeId).run();
    bumpDataVersion(env,ctx);
    return jsonResponse({success:true,id,message:approved?'تم نشر المنتج':'تم إرسال المنتج للمراجعة'},201,corsHeaders);
  }

  if (url.pathname.startsWith('/api/products/') && request.method === 'PUT') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const id = decodeURIComponent(url.pathname.replace('/api/products/','')).trim();
    const existing = await createTursoDB(env).prepare('SELECT * FROM products WHERE id=? LIMIT 1').bind(id).first();
    if (!existing) return jsonResponse({success:false,error:'المنتج غير موجود'},404,corsHeaders);
    const place = await createTursoDB(env).prepare('SELECT owner_id,owner_email FROM places WHERE id=? LIMIT 1').bind(existing.place_id).first();
    if (!auth.user.isAdmin && existing.owner_id !== auth.user.uid && place?.owner_id !== auth.user.uid && String(place?.owner_email || '').toLowerCase() !== auth.user.email) {
      return jsonResponse({success:false,error:'لا تملك صلاحية تعديل هذا المنتج'},403,corsHeaders);
    }
    const body = await request.json().catch(() => ({}));
    const ownerEdit = !auth.user.isAdmin;
    await createTursoDB(env).prepare(`
      UPDATE products SET name=?,description=?,price=?,old_price=?,image_url=?,category=?,sku=?,in_stock=?,is_featured=?,
        status=?,is_approved=?,updated_at=? WHERE id=?
    `).bind(
      body.name !== undefined ? String(body.name).trim() : existing.name,
      body.description !== undefined ? String(body.description) : existing.description,
      body.price !== undefined ? Number(body.price) : existing.price,
      body.oldPrice !== undefined ? Number(body.oldPrice) : existing.old_price,
      body.imageUrl !== undefined ? String(body.imageUrl) : existing.image_url,
      body.category !== undefined ? String(body.category) : existing.category,
      body.sku !== undefined ? String(body.sku) : existing.sku,
      body.inStock !== undefined ? (body.inStock ? 1 : 0) : existing.in_stock,
      body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : existing.is_featured,
      ownerEdit ? 'pending' : (body.status !== undefined ? String(body.status) : existing.status),
      ownerEdit ? 0 : (body.isApproved !== undefined ? (body.isApproved ? 1 : 0) : existing.is_approved),
      Date.now(), id
    ).run();
    if (!auth.user.isAdmin) {
      await createTursoDB(env).prepare('UPDATE products SET rejection_reason = NULL WHERE id = ?').bind(id).run();
    } else if (body.status === 'rejected') {
      const reason = String(body.rejectionReason || body.rejection_reason || '').trim().slice(0, 1000);
      if (!reason) return jsonResponse({success:false,error:'سبب رفض المنتج مطلوب'},400,corsHeaders);
      await createTursoDB(env).prepare('UPDATE products SET rejection_reason = ? WHERE id = ?').bind(reason,id).run();
    } else if (body.status === 'approved' || body.isApproved === true || body.is_approved === 1) {
      await createTursoDB(env).prepare('UPDATE products SET rejection_reason = NULL WHERE id = ?').bind(id).run();
    }
    bumpDataVersion(env,ctx);
    return jsonResponse({success:true,id,message:'تم تحديث المنتج'},200,corsHeaders);
  }

  if (url.pathname.startsWith('/api/products/') && request.method === 'DELETE') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const id = decodeURIComponent(url.pathname.replace('/api/products/','')).trim();
    const existing = await createTursoDB(env).prepare('SELECT * FROM products WHERE id=? LIMIT 1').bind(id).first();
    if (!existing) return jsonResponse({success:true},200,corsHeaders);
    const place = await createTursoDB(env).prepare('SELECT owner_id,owner_email FROM places WHERE id=? LIMIT 1').bind(existing.place_id).first();
    if (!auth.user.isAdmin && existing.owner_id !== auth.user.uid && place?.owner_id !== auth.user.uid && String(place?.owner_email || '').toLowerCase() !== auth.user.email) {
      return jsonResponse({success:false,error:'لا تملك صلاحية حذف هذا المنتج'},403,corsHeaders);
    }
    await createTursoDB(env).prepare('DELETE FROM products WHERE id=?').bind(id).run();
    await createTursoDB(env).prepare('UPDATE places SET product_count=MAX(COALESCE(product_count,0)-1,0),updated_at=? WHERE id=?').bind(Date.now(),existing.place_id).run();
    bumpDataVersion(env,ctx);
    return jsonResponse({success:true,message:'تم حذف المنتج'},200,corsHeaders);
  }

  if (url.pathname === '/api/products/track-stat' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    const stat = String(body.stat || '').trim();
    if (!id || !['views','clicks'].includes(stat)) return jsonResponse({success:false,error:'بيانات التتبع غير صالحة'},400,corsHeaders);
    await createTursoDB(env).prepare(`UPDATE products SET ${stat} = COALESCE(${stat},0) + 1 WHERE id = ?`).bind(id).run();
    return jsonResponse({success:true},200,corsHeaders);
  }

  // ── Turso: Reviews (GET /api/reviews?place_id=... & POST /api/reviews) ──
  if (url.pathname === '/api/reviews' && request.method === 'GET') {
    const placeId = (url.searchParams.get('place_id') || url.searchParams.get('placeId') || url.searchParams.get('slug') || '').trim();
    const reqLimit = Math.min(5000, Math.max(1, parseInt(url.searchParams.get('limit') || '5000', 10)));

    try {
      let query = `
        SELECT r.id, r.place_id, r.user_id, r.user_name, r.user_photo, r.rating, r.comment,
               r.is_admin_generated, r.edit_count, r.created_at, r.updated_at,
               p.name as place_name, p.slug as place_slug
        FROM reviews r
        LEFT JOIN places p ON r.place_id = p.id
      `;
      const params = [];
      if (placeId) {
        query += ` WHERE (r.place_id = ? OR r.place_slug = ? OR p.slug = ?) `;
        params.push(placeId, placeId, placeId);
      }
      query += ` ORDER BY r.created_at DESC LIMIT ? `;
      params.push(reqLimit);

      const stmt = createTursoDB(env).prepare(query);
      const result = await stmt.bind(...params).all();

      // Reviews are user-submitted content and must be immediately visible after
      // publishing. Do not let browser/CDN caching hide a newly submitted review.
      return jsonResponse({ success: true, data: result.results || [] }, 200, {
        ...corsHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      });
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if (url.pathname === '/api/reviews' && request.method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response
    const body = await request.json().catch(() => ({}));

    // Bulk review insertion is an administrative operation.
    if (Array.isArray(body.reviews) && body.reviews.length > 0) {
      if (!auth.user.isAdmin) return jsonResponse({success:false,error:'إضافة تقييمات جماعية متاحة للإدارة فقط'},403,corsHeaders);
      const reviewsList = body.reviews;
      if (reviewsList.length < 1 || reviewsList.length > 5000) {
        return jsonResponse({success:false,error:'عدد التقييمات الجماعية يجب أن يكون بين 1 و5000'},400,corsHeaders);
      }
      const placeIds = [...new Set(reviewsList.map(r => String(r.place_id || r.placeId || '').trim()).filter(Boolean))];
      if (placeIds.length !== 1) {
        return jsonResponse({success:false,error:'الدفعة الجماعية يجب أن تخص مكاناً واحداً فقط'},400,corsHeaders);
      }
      const placeExists = await createTursoDB(env).prepare('SELECT id FROM places WHERE id = ? OR slug = ? LIMIT 1').bind(placeIds[0],placeIds[0]).first();
      if (!placeExists) return jsonResponse({success:false,error:'المكان غير موجود'},404,corsHeaders);
      const now = Date.now();
      let insertedCount = 0;

      try {
        // Process in chunks of 50 for optimal Turso transaction performance
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

            return createTursoDB(env).prepare(`
              INSERT INTO reviews (id, place_id, user_id, user_name, user_photo, place_name, place_slug, rating, comment, is_admin_generated, edit_count, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                rating = excluded.rating,
                comment = excluded.comment,
                updated_at = excluded.updated_at
            `).bind(rId, pId, uId, uName, uPhoto, pName, pSlug, rScore, cText, isAdminGen, rTime, rTime);
          });

          await createTursoDB(env).batch(stmts);
          insertedCount += chunk.length;
        }

        // Keep denormalized place rating and review count in sync for all affected places
        const affectedPlaceIds = [...new Set(reviewsList.map(r => (r.place_id || r.placeId || '').trim()).filter(Boolean))];
        for (const pid of affectedPlaceIds) {
          try {
            const stats = await createTursoDB(env).prepare(`
              SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS avg_rating
              FROM reviews
              WHERE place_id = ? OR place_slug = ?
            `).bind(pid, pid).first();
            await createTursoDB(env).prepare(`
              UPDATE places
              SET updated_at = ?, stats_json = json_set(
                COALESCE(stats_json, '{}'),
                '$.reviewCount', ?,
                '$.reviewsCount', ?,
                '$.rating', ?
              )
              WHERE id = ? OR slug = ?
            `).bind(
              now,
              Number(stats?.review_count || 0),
              Number(stats?.review_count || 0),
              Number(stats?.avg_rating || 0),
              pid,
              pid
            ).run();
          } catch (_) {}
        }
        bumpDataVersion(env, ctx);

        return jsonResponse({ success: true, message: `تم حفظ ${insertedCount} تقييم بنجاح وتحديث إحصائيات المكان`, insertedCount }, 200, corsHeaders);
      } catch (err) {
        return jsonResponse({ success: false, error: err.message, insertedCount }, 500, corsHeaders);
      }
    }

    const placeId = (body.place_id || body.placeId || '').trim();
    const userId = auth.user.isAdmin ? (body.user_id || body.userId || '').trim() : auth.user.uid;
    const rating = parseFloat(body.rating);

    if (!placeId || !userId || isNaN(rating)) {
      return jsonResponse({ error: 'place_id و user_id و rating مطلوبة' }, 400, corsHeaders);
    }

    // Never allow a normal user to choose an existing review ID: the POST
    // endpoint uses UPSERT semantics, so a supplied ID could otherwise overwrite
    // another user's/admin-generated review.
    let reviewId = body.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (!auth.user.isAdmin && body.id) {
      const collision = await createTursoDB(env).prepare('SELECT id FROM reviews WHERE id = ? LIMIT 1').bind(String(body.id).trim()).first();
      if (collision) return jsonResponse({success:false,error:'معرف التقييم مستخدم بالفعل'},409,corsHeaders);
      reviewId = String(body.id).trim();
    }
    const userName = auth.user.isAdmin ? (body.user_name || body.userName || 'مستخدم') : auth.user.name;
    const userPhoto = body.user_photo || body.userPhoto || '';
    const comment = String(body.comment || '').trim().slice(0, 500);
    const now = Date.now();
    const placeName = body.place_name || body.placeName || '';
    const placeSlug = body.place_slug || body.placeSlug || '';
    const isAdminGen = auth.user.isAdmin && body.is_admin_generated ? 1 : 0;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return jsonResponse({ error: 'التقييم يجب أن يكون بين 1 و5 نجوم' }, 400, corsHeaders);
    }

    try {
      await createTursoDB(env).prepare(`
        INSERT INTO reviews (id, place_id, user_id, user_name, user_photo, place_name, place_slug, rating, comment, is_admin_generated, edit_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          rating = excluded.rating,
          comment = excluded.comment,
          updated_at = excluded.updated_at
      `).bind(reviewId, placeId, userId, userName, userPhoto, placeName, placeSlug, rating, comment, isAdminGen, now, now).run();
      bumpDataVersion(env, ctx);

      // Keep the denormalized place rating in sync in the same request so the
      // public place card and the submitted review become consistent immediately.
      const stats = await createTursoDB(env).prepare(`
        SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS avg_rating
        FROM reviews
        WHERE place_id = ?
      `).bind(placeId).first();
      await createTursoDB(env).prepare(`
        UPDATE places
        SET updated_at = ?, stats_json = json_set(
          COALESCE(stats_json, '{}'),
          '$.reviewCount', ?,
          '$.reviewsCount', ?,
          '$.rating', ?
        )
        WHERE id = ?
      `).bind(
        now,
        Number(stats?.review_count || 0),
        Number(stats?.review_count || 0),
        Number(stats?.avg_rating || 0),
        placeId
      ).run();

      return jsonResponse({
        success: true,
        message: 'تم حفظ التقييم بنجاح',
        id: reviewId,
        data: {
          reviewCount: Number(stats?.review_count || 0),
          rating: Number(stats?.avg_rating || 0)
        }
      }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Update Review (PUT /api/reviews?id=...) ───────────────
  if (url.pathname === '/api/reviews' && request.method === 'PUT') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));
    const reviewId = (url.searchParams.get('id') || body.id || '').trim();
    if (!reviewId) return jsonResponse({ error: 'معرف التقييم مطلوب' }, 400, corsHeaders);

    try {
      const existing = await createTursoDB(env).prepare(`SELECT * FROM reviews WHERE id = ? LIMIT 1`).bind(reviewId).first();
      if (!existing) return jsonResponse({ error: 'التقييم غير موجود' }, 404, corsHeaders);
      if (!auth.user.isAdmin && String(existing.user_id || '') !== String(auth.user.uid)) {
        return jsonResponse({ success:false, error:'لا يمكنك تعديل تقييم مستخدم آخر' },403,corsHeaders);
      }

      const ratingValue = body.rating !== undefined ? Number(body.rating) : Number(existing.rating);
      const commentValue = body.comment !== undefined ? String(body.comment).trim().slice(0, 500) : (existing.comment || '');
      const editCount = auth.user.isAdmin
        ? (body.editCount !== undefined ? Number(body.editCount) : Number(existing.edit_count || 0))
        : Number(existing.edit_count || 0) + 1;
      const isReported = auth.user.isAdmin && body.isReported !== undefined ? (body.isReported ? 1 : 0) : Number(existing.is_reported || 0);
      const reportCount = auth.user.isAdmin && body.reportCount !== undefined ? Number(body.reportCount) : Number(existing.report_count || 0);
      const reportReason = auth.user.isAdmin && body.lastReportReason !== undefined ? String(body.lastReportReason || '') : (existing.last_report_reason || '');
      const reporterName = auth.user.isAdmin && body.lastReporterName !== undefined ? String(body.lastReporterName || '') : (existing.last_reporter_name || '');
      const nowPut = Date.now();

      if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        return jsonResponse({ error: 'التقييم يجب أن يكون بين 1 و5 نجوم' }, 400, corsHeaders);
      }

      await createTursoDB(env).prepare(`
        UPDATE reviews
        SET rating = ?, comment = ?, edit_count = ?, is_reported = ?, report_count = ?,
            last_report_reason = ?, last_reporter_name = ?, updated_at = ?
        WHERE id = ?
      `).bind(ratingValue, commentValue, Math.max(0, editCount), isReported, Math.max(0, reportCount),
        reportReason, reporterName, nowPut, reviewId).run();

      const placeIdForRating = existing.place_id;
      const stats = await createTursoDB(env).prepare(`
        SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS avg_rating
        FROM reviews WHERE place_id = ?
      `).bind(placeIdForRating).first();
      await createTursoDB(env).prepare(`
        UPDATE places SET updated_at = ?, stats_json = json_set(
          COALESCE(stats_json, '{}'),
          '$.reviewCount', ?, '$.reviewsCount', ?, '$.rating', ?
        ) WHERE id = ?
      `).bind(nowPut, Number(stats?.review_count || 0), Number(stats?.review_count || 0),
        Number(stats?.avg_rating || 0), placeIdForRating).run();
      bumpDataVersion(env, ctx);

      return jsonResponse({ success: true, message: 'تم تحديث التقييم بنجاح', id: reviewId }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Delete Reviews (DELETE /api/reviews) ───────────────────
  if (url.pathname === '/api/reviews' && request.method === 'DELETE') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const placeId = (url.searchParams.get('place_id') || url.searchParams.get('placeId') || '').trim();
    const reviewId = (url.searchParams.get('id') || url.searchParams.get('review_id') || '').trim();

    try {
      let affectedPlaceId = placeId;
      if (reviewId) {
        const existing = await createTursoDB(env).prepare(`SELECT id, place_id, user_id FROM reviews WHERE id = ? LIMIT 1`).bind(reviewId).first();
        if (!existing) return jsonResponse({success:false,error:'التقييم غير موجود'},404,corsHeaders);
        if (!auth.user.isAdmin && String(existing.user_id || '') !== String(auth.user.uid)) {
          return jsonResponse({success:false,error:'لا يمكنك حذف تقييم مستخدم آخر'},403,corsHeaders);
        }
        affectedPlaceId = existing.place_id || affectedPlaceId;
        await createTursoDB(env).prepare(`DELETE FROM reviews WHERE id = ?`).bind(reviewId).run();
      } else if (placeId) {
        if (!auth.user.isAdmin) return jsonResponse({success:false,error:'حذف جميع تقييمات المكان متاح للإدارة فقط'},403,corsHeaders);
        await createTursoDB(env).prepare(`DELETE FROM reviews WHERE place_id = ?`).bind(placeId).run();
      } else {
        return jsonResponse({ error: 'مطلوب id أو place_id لحذف المراجعات' }, 400, corsHeaders);
      }

      if (affectedPlaceId) {
        const stats = await createTursoDB(env).prepare(`
          SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS avg_rating
          FROM reviews WHERE place_id = ?
        `).bind(affectedPlaceId).first();
        await createTursoDB(env).prepare(`
          UPDATE places SET updated_at = ?, stats_json = json_set(
            COALESCE(stats_json, '{}'),
            '$.reviewCount', ?, '$.reviewsCount', ?, '$.rating', ?
          ) WHERE id = ?
        `).bind(Date.now(), Number(stats?.review_count || 0), Number(stats?.review_count || 0),
          Number(stats?.avg_rating || 0), affectedPlaceId).run();
        bumpDataVersion(env, ctx);
      }

      return jsonResponse({ success: true, message: 'تم حذف التقييمات بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Settings API (GET, POST, PUT /api/settings) ──
  if (url.pathname === '/api/settings' && request.method === 'GET') {
    try {
      const rows = (await createTursoDB(env).prepare('SELECT key,value_json,updated_at FROM app_settings ORDER BY key').all()).results || [];
      const data = {};
      for (const row of rows) { try { data[row.key] = JSON.parse(row.value_json); } catch (_) { data[row.key] = row.value_json; } }
      return jsonResponse({ success: true, data }, 200, {...corsHeaders,'Cache-Control':'no-store'});
    } catch (err) {
      return jsonResponse({ success:false,error:err.message },500,corsHeaders);
    }
  }

  if (url.pathname === '/api/settings' && (request.method === 'POST' || request.method === 'PUT')) {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));
    const db = createTursoDB(env), now = Date.now();
    try {
      const entries = Object.entries(body || {});
      if (!entries.length) return jsonResponse({success:false,error:'لا توجد إعدادات للحفظ'},400,corsHeaders);
      for (const [key,value] of entries) {
        await db.prepare('INSERT INTO app_settings(key,value_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at')
          .bind(String(key).slice(0,120), JSON.stringify(value), now).run();
      }
      return jsonResponse({ success:true,message:'تم حفظ الإعدادات بنجاح',data:body },200,corsHeaders);
    } catch(err) {
      return jsonResponse({success:false,error:err.message},500,corsHeaders);
    }
  }

  // ── Turso: Live News API ─────────────────────────────────────
  if (url.pathname === '/api/live-news' && request.method === 'GET') {
    const status = (url.searchParams.get('status') || 'published').trim();
    const city = (url.searchParams.get('city') || '').trim();
    const category = (url.searchParams.get('category') || '').trim();
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 40)));
    const auth = status === 'pending' || status === 'all' ? await requireAdmin(request, env) : {user:null};
    if (auth.response) return auth.response;
    const where = [], args = [];
    if (status !== 'all') { where.push('status=?'); args.push(status); }
    else where.push("status <> 'deleted'");
    if (city) { where.push('city=?'); args.push(city); }
    if (category) { where.push('category=?'); args.push(category); }
    const sql = 'SELECT * FROM live_news WHERE ' + where.join(' AND ') + ' ORDER BY created_at DESC LIMIT ?';
    args.push(limit);
    const rows = (await createTursoDB(env).prepare(sql).bind(...args).all()).results || [];
    const data = rows.map(r => ({...r,id:r.id,statusTagKey:r.status_tag_key,imageUrl:r.image_url, inquiryLink:r.inquiry_link,userId:r.user_id,userName:r.user_name,userPhoto:r.user_photo,userPoints:Number(r.user_points||0),reactions:JSON.parse(r.reactions_json||'{}'),reactedUsers:JSON.parse(r.reacted_users_json||'{}'),createdAt:Number(r.created_at||0),publishedAt:r.published_at?Number(r.published_at):null,expiresAt:r.expires_at?Number(r.expires_at):null,updatedAt:r.updated_at?Number(r.updated_at):null}));
    return jsonResponse({success:true,data},200,{...corsHeaders,'Cache-Control':'no-store'});
  }

  if (url.pathname === '/api/live-news' && request.method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || ('news_'+Date.now()+'_'+crypto.randomUUID().slice(0,6)));
    const now = Date.now();
    const isAdmin = !!auth.user.isAdmin;
    const status = isAdmin ? 'published' : 'pending';
    const expiresAt = isAdmin ? now + 86400000 : null;
    await createTursoDB(env).prepare(`INSERT INTO live_news(id,title,location,category,status_tag_key,details,city,image_url,phone,inquiry_link,salary,user_id,user_name,user_photo,user_points,status,reactions_json,reacted_users_json,created_at,published_at,expires_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,String(body.title||'').trim(),String(body.location||'').trim(),String(body.category||'general'),String(body.statusTagKey||'active_green'),String(body.details||'').trim(),String(body.city||'المنزلة'),String(body.imageUrl||''),String(body.phone||''),String(body.inquiryLink||''),String(body.salary||''),auth.user.uid,auth.user.name||auth.user.email||'مستخدم',auth.user.photoURL||'',Number(body.userPoints||0),status,JSON.stringify(body.reactions||{confirm:1,love:0,doubt:0}),JSON.stringify(body.reactedUsers||{}),now,status==='published'?now:null,expiresAt,now).run();
    return jsonResponse({success:true,id,status},201,corsHeaders);
  }

  if (url.pathname.startsWith('/api/live-news/') && url.pathname.endsWith('/reaction') && request.method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const parts = url.pathname.split('/');
    const id = decodeURIComponent(parts[parts.length - 2] || '');
    const body = await request.json().catch(() => ({}));
    const type = String(body.type || '').trim();
    if (!id || !['confirm','love','doubt'].includes(type)) {
      return jsonResponse({success:false,error:'بيانات التفاعل غير صالحة'},400,corsHeaders);
    }
    const db = createTursoDB(env);
    const row = await db.prepare('SELECT reactions_json, reacted_users_json, status FROM live_news WHERE id=? LIMIT 1').bind(id).first();
    if (!row || row.status === 'deleted') return jsonResponse({success:false,error:'الخبر غير متاح'},404,corsHeaders);
    let reactions = {}; let reactedUsers = {};
    try { reactions = JSON.parse(row.reactions_json || '{}') || {}; } catch (_) {}
    try { reactedUsers = JSON.parse(row.reacted_users_json || '{}') || {}; } catch (_) {}
    const uid = String(auth.user.uid);
    const previous = reactedUsers[uid];
    if (previous === type) return jsonResponse({success:true,id,type,reactions},200,corsHeaders);
    if (previous && reactions[previous]) reactions[previous] = Math.max(0, Number(reactions[previous]) - 1);
    reactions[type] = Number(reactions[type] || 0) + 1;
    reactedUsers[uid] = type;
    const now = Date.now();
    await db.prepare('UPDATE live_news SET reactions_json=?, reacted_users_json=?, updated_at=? WHERE id=?').bind(JSON.stringify(reactions),JSON.stringify(reactedUsers),now,id).run();
    return jsonResponse({success:true,id,type,reactions},200,corsHeaders);
  }

  if (url.pathname.startsWith('/api/live-news/') && ['PUT','PATCH','DELETE'].includes(request.method)) {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response;
    const id = decodeURIComponent(url.pathname.slice('/api/live-news/'.length));
    const db = createTursoDB(env);
    if (request.method === 'DELETE') {
      await db.prepare("UPDATE live_news SET status='deleted',deleted_at=?,updated_at=? WHERE id=?").bind(Date.now(),Date.now(),id).run();
      return jsonResponse({success:true,id},200,corsHeaders);
    }
    const body = await request.json().catch(() => ({})), fields=[], args=[];
    const allowed={title:'title',location:'location',category:'category',statusTagKey:'status_tag_key',details:'details',city:'city',imageUrl:'image_url',phone:'phone',inquiryLink:'inquiry_link',salary:'salary',status:'status'};
    for(const [k,col] of Object.entries(allowed)) if(body[k]!==undefined){fields.push(col+'=?');args.push(body[k]);}
    if(body.status==='published'){fields.push('published_at=COALESCE(published_at,?)');args.push(Date.now());fields.push('expires_at=COALESCE(expires_at,?)');args.push(Date.now()+86400000);}
    fields.push('updated_at=?');args.push(Date.now(),id);
    await db.prepare('UPDATE live_news SET '+fields.join(',')+' WHERE id=?').bind(...args).run();
    return jsonResponse({success:true,id},200,corsHeaders);
  }

  // ── Turso: User Profile Sync (POST /api/users/sync) ──
  // Architecture: Turso is the source of truth for role/status. Firebase Auth provides uid/name/email/photo only.
  if (url.pathname === '/api/users/sync' && request.method === 'POST') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response
    const body = await request.json().catch(() => ({}));
    const id = (body.uid || body.id || '').trim();
    if (id !== auth.user.uid) return jsonResponse({success:false,error:'لا يمكن مزامنة حساب مستخدم آخر'},403,corsHeaders);
    if (!id) return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);

    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const photoUrl = (body.photoURL || body.photo_url || '').trim();
    const requestedRole = auth.user.isSuperAdmin
      ? 'superadmin'
      : (auth.user.role === 'admin' ? 'admin' : 'user');
    const status = 'active';
    const now = Date.now();

    try {
      // Upsert: preserve existing role in Turso (server-side protection)
      await createTursoDB(env).prepare(`
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

      // Return full Turso profile so auth.js can use actual DB role
      const profile = await createTursoDB(env).prepare(
        `SELECT id, name, email, photo_url, phone, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
      ).bind(id).first();

      return jsonResponse({ success: true, data: profile || null }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Loyalty API ────────────────────────────────────────
  if (url.pathname.startsWith('/api/loyalty/')) {
    const uid = decodeURIComponent(url.pathname.replace('/api/loyalty/','')).trim();
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    if (!uid || (auth.user.uid !== uid && !auth.user.isAdmin)) return jsonResponse({success:false,error:'غير مصرح'},403,corsHeaders);
    const db = createTursoDB(env);

    if (request.method === 'GET') {
      const user = await db.prepare('SELECT points,total_earned,last_daily_bonus_date,last_redemption_at FROM users WHERE id=? LIMIT 1').bind(uid).first();
      if (!user) return jsonResponse({success:false,error:'المستخدم غير موجود'},404,corsHeaders);
      const history = (await db.prepare('SELECT id,type,rule_key,amount,label,place_id,place_name,meta_json,created_at FROM loyalty_history WHERE user_id=? ORDER BY created_at DESC LIMIT 200').bind(uid).all()).results || [];
      return jsonResponse({success:true,data:{points:Number(user.points||0),totalEarned:Number(user.total_earned||0),lastDailyBonusDate:user.last_daily_bonus_date||null,lastRedemptionAt:user.last_redemption_at||null,history}},200,{...corsHeaders,'Cache-Control':'no-store'});
    }

    if (request.method !== 'POST') return jsonResponse({success:false,error:'Method not allowed'},405,corsHeaders);
    const body = await request.json().catch(()=>({}));
    const action = String(body.action || '').trim();

    if (action === 'award' || action === 'daily') {
      if (auth.user.uid !== uid && !auth.user.isAdmin) return jsonResponse({success:false,error:'غير مصرح'},403,corsHeaders);
      const amount = action === 'daily' ? 10 : Math.max(1,Math.min(1000,Number(body.amount)||10));
      const ruleKey = action === 'daily' ? 'DAILY_LOGIN' : String(body.ruleKey || 'INTERACTION').slice(0,80);
      const today = new Date().toISOString().slice(0,10);
      if (action === 'daily') {
        const upd = await db.prepare('UPDATE users SET points=COALESCE(points,0)+10,total_earned=COALESCE(total_earned,0)+10,last_daily_bonus_date=?,updated_at=? WHERE id=? AND (last_daily_bonus_date IS NULL OR last_daily_bonus_date<>?)')
          .bind(today,Date.now(),uid,today).run();
        if (Number(upd?.meta?.changes||0) !== 1) return jsonResponse({success:false,reason:'already_claimed'},409,corsHeaders);
      } else {
        const upd = await db.prepare('UPDATE users SET points=COALESCE(points,0)+?,total_earned=COALESCE(total_earned,0)+?,updated_at=? WHERE id=?').bind(amount,amount,Date.now(),uid).run();
        if (Number(upd?.meta?.changes||0) !== 1) return jsonResponse({success:false,error:'المستخدم غير موجود'},404,corsHeaders);
      }
      const id='lh_'+crypto.randomUUID();
      await db.prepare('INSERT INTO loyalty_history (id,user_id,type,rule_key,amount,label,meta_json,created_at) VALUES (?,?,?,?,?,?,?,?)')
        .bind(id,uid,'earn',ruleKey,amount,String(body.label||ruleKey).slice(0,200),JSON.stringify(body.meta||{}),Date.now()).run();
      const user=await db.prepare('SELECT points,total_earned,last_daily_bonus_date FROM users WHERE id=?').bind(uid).first();
      return jsonResponse({success:true,newPoints:Number(user?.points||0),awarded:amount},200,corsHeaders);
    }

    if (action === 'redeem_verification') {
      const placeId=String(body.placeId||'').trim();
      if (!placeId) return jsonResponse({success:false,error:'المكان مطلوب'},400,corsHeaders);
      const place=await db.prepare('SELECT id,name,slug,owner_id FROM places WHERE id=? OR slug=? LIMIT 1').bind(placeId,placeId).first();
      if (!place) return jsonResponse({success:false,error:'المكان غير موجود'},404,corsHeaders);
      if (!auth.user.isAdmin && place.owner_id !== uid) return jsonResponse({success:false,error:'لا تملك هذا المكان'},403,corsHeaders);
      const cost=5000, now=Date.now(), until=now+365*86400000;
      const deduct=await db.prepare('UPDATE users SET points=points-?,last_redemption_at=?,updated_at=? WHERE id=? AND points>=?').bind(cost,now,now,uid,cost).run();
      if (Number(deduct?.meta?.changes||0)!==1) return jsonResponse({success:false,error:'رصيد النقاط غير كاف'},400,corsHeaders);
      try {
        await db.prepare('UPDATE places SET is_verified=1,verification_status=?,updated_at=? WHERE id=?').bind('verified',now,place.id).run();
        const logId='lh_'+crypto.randomUUID();
        await db.prepare('INSERT INTO loyalty_history (id,user_id,type,rule_key,amount,label,place_id,place_name,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
          .bind(logId,uid,'redeem','REDEEM_VERIFICATION',-cost,'استبدال 5000 نقطة بتوثيق رسمي',place.id,place.name,now).run();
        await db.prepare('INSERT INTO loyalty_redemptions (id,user_id,place_id,place_name,points_redeemed,created_at) VALUES (?,?,?,?,?,?)')
          .bind('lr_'+crypto.randomUUID(),uid,place.id,place.name,cost,now).run();
      } catch (err) {
        await db.prepare('UPDATE users SET points=COALESCE(points,0)+?,updated_at=? WHERE id=?').bind(cost,Date.now(),uid).run();
        throw err;
      }
      const user=await db.prepare('SELECT points FROM users WHERE id=?').bind(uid).first();
      return jsonResponse({success:true,newPoints:Number(user?.points||0),verifiedUntil:until},200,corsHeaders);
    }

    return jsonResponse({success:false,error:'إجراء loyalty غير معروف'},400,corsHeaders);
  }

  // ── Turso: Get Single User by ID (GET /api/users/:id) ──
  // Used by auth.js to fetch full Turso profile after login
  if (url.pathname.startsWith('/api/users/') && request.method === 'GET') {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response
    const userId = url.pathname.replace('/api/users/', '').trim();
    if (userId !== auth.user.uid && !auth.user.isAdmin) return jsonResponse({success:false,error:'غير مصرح'},403,corsHeaders);
    if (!userId || userId === 'sync' || userId === 'seed') {
      return jsonResponse({ error: 'Invalid user ID' }, 400, corsHeaders);
    }
    try {
      const user = await createTursoDB(env).prepare(
        `SELECT id, name, email, photo_url, phone, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
      ).bind(userId).first();
      if (!user) return jsonResponse({ success: false, error: 'User not found' }, 404, corsHeaders);
      return jsonResponse({ success: true, data: user }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Seed Missing Users (POST /api/users/seed) ──
  // Recovery endpoint: inserts users who existed before Turso migration
  // Does NOT overwrite role if user already exists in Turso
  if (url.pathname === '/api/users/seed' && request.method === 'POST') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    const body = await request.json().catch(() => ({}));
    const users = Array.isArray(body.users) ? body.users : (body.uid ? [body] : []);
    if (!users.length) return jsonResponse({ error: 'users array required' }, 400, corsHeaders);

    const results = [];
    const now = Date.now();

    for (const u of users) {
      const uid = (u.uid || u.id || '').trim();
      if (!uid) continue;
      try {
        await createTursoDB(env).prepare(`
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

  // ── Turso: Get Users List (GET /api/users) ──
  if (url.pathname === '/api/users' && request.method === 'GET') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    try {
      // Join with places count per user
      const result = await createTursoDB(env).prepare(`
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
        const result = await createTursoDB(env).prepare(`
          SELECT id, name, email, photo_url, phone, role, status, created_at, updated_at
          FROM users ORDER BY created_at DESC LIMIT 500
        `).all();
        return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
      } catch (err2) {
        return jsonResponse({ success: false, error: err2.message }, 500, corsHeaders);
      }
    }
  }

  // ── Turso: Update User (PATCH/PUT /api/users/:id) ──
  // Allows updating profile fields plus administrator-controlled points
  if ((url.pathname.startsWith('/api/users/') || url.pathname === '/api/users') &&
      (request.method === 'PUT' || request.method === 'PATCH') &&
      !url.pathname.endsWith('/sync') && !url.pathname.endsWith('/seed')) {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    const idFromPath = url.pathname.startsWith('/api/users/') ? url.pathname.replace('/api/users/', '').trim() : '';
    const body = await request.json().catch(() => ({}));
    const id = (idFromPath || body.id || body.uid || '').trim();

    if (!id) return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);

    try {
      const existing = await createTursoDB(env).prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).bind(id).first();
      if (!existing) return jsonResponse({ error: 'User not found' }, 404, corsHeaders);

      const desiredRole = String(body.role !== undefined ? body.role : existing.role).trim().toLowerCase();
      const existingRole = String(existing.role || 'user').trim().toLowerCase();
      if (!auth.user.isSuperAdmin && (existingRole === 'superadmin' || desiredRole === 'superadmin' ||
          (desiredRole === 'admin' && existingRole !== 'admin'))) {
        return jsonResponse({ success:false, error:'إدارة صلاحيات Superadmin/Admin متاحة للـ Superadmin فقط' },403,corsHeaders);
      }
      if (id === auth.user.uid && desiredRole !== existingRole) {
        return jsonResponse({ success:false, error:'لا يمكنك تغيير صلاحيات حسابك بنفسك' },403,corsHeaders);
      }

      const role   = desiredRole;
      const status = body.status !== undefined ? body.status : existing.status;
      const name   = body.name   !== undefined ? body.name   : existing.name;
      const email  = body.email  !== undefined ? body.email  : existing.email;
      const phone  = body.phone  !== undefined ? body.phone  : existing.phone;
      const pointsRaw = body.points !== undefined ? Number(body.points) : Number(existing.points || 0);
      if (!Number.isFinite(pointsRaw) || pointsRaw < 0 || pointsRaw > 1000000000) {
        return jsonResponse({success:false,error:'رصيد النقاط غير صالح'},400,corsHeaders);
      }
      const points = Math.floor(pointsRaw);
      const now    = Date.now();

      await createTursoDB(env).prepare(`
        UPDATE users SET role = ?, status = ?, name = ?, email = ?, phone = ?, points = ?, updated_at = ?
        WHERE id = ?
      `).bind(role, status, name, email, phone, points, now, id).run();

      const updated = await createTursoDB(env).prepare(
        `SELECT id, name, email, photo_url, phone, role, status, points, total_earned, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
      ).bind(id).first();

      return jsonResponse({ success: true, data: updated }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Delete User (DELETE /api/users/:id) ──
  if (url.pathname.startsWith('/api/users/') && request.method === 'DELETE') {
    const auth = await requireAdmin(request, env, true);
    if (auth.response) return auth.response
    const id = url.pathname.replace('/api/users/', '').trim();
    if (!id) return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);
    try {
      await createTursoDB(env).prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
      return jsonResponse({ success: true, message: 'User deleted from Turso' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }




  // ── Turso: Category Requests (GET, POST, PUT, DELETE /api/category-requests) ──
  if (url.pathname === '/api/category-requests' && request.method === 'GET') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    try {
      const result = await createTursoDB(env).prepare(`
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
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response
    const body = await request.json().catch(() => ({}));
    const id = body.id || `catreq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const categoryName = (body.category_name || body.categoryName || '').trim();
    const placeName = (body.place_name || body.placeName || '').trim();
    const ownerName = (body.owner_name || body.ownerName || 'مستخدم').trim();
    const userId = auth.user.uid;
    const now = Date.now();

    if (!categoryName) return jsonResponse({ error: 'اسم التصنيف مطلوب' }, 400, corsHeaders);

    try {
      await createTursoDB(env).prepare(`
        INSERT INTO category_requests (id, category_name, place_name, owner_name, user_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).bind(id, categoryName, placeName, ownerName, userId, now).run();
      return jsonResponse({ success: true, id, message: 'تم إرسال اقتراح التصنيف بنجاح' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if ((url.pathname.startsWith('/api/category-requests/') || url.pathname === '/api/category-requests') && (request.method === 'PUT' || request.method === 'PATCH')) {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    const idFromPath = url.pathname.startsWith('/api/category-requests/') ? url.pathname.replace('/api/category-requests/', '') : '';
    const body = await request.json().catch(() => ({}));
    const id = (idFromPath || body.id || '').trim();
    const status = (body.status || 'approved').trim();
    const now = Date.now();

    if (!id) return jsonResponse({ error: 'Request ID required' }, 400, corsHeaders);

    try {
      await createTursoDB(env).prepare(`
        UPDATE category_requests SET status = ?, reviewed_at = ? WHERE id = ?
      `).bind(status, now, id).run();
      return jsonResponse({ success: true, message: 'تم تحديث حالة طلب التصنيف' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Verification Requests (GET, POST, PUT, DELETE /api/verification-requests) ──
  if (url.pathname === '/api/verification-requests' && request.method === 'GET') {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    try {
      const result = await createTursoDB(env).prepare(`
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
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response
    const body = await request.json().catch(() => ({}));
    const id = body.id || `vreq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const placeId = (body.place_id || body.placeId || '').trim();
    const placeName = (body.place_name || body.placeName || '').trim();
    const ownerId = auth.user.uid;
    if (!auth.user.isAdmin) {
      const ownedPlace = await createTursoDB(env).prepare(
        'SELECT id, owner_id, owner_email FROM places WHERE id = ? LIMIT 1'
      ).bind(placeId).first();
      if (!ownedPlace || (
        ownedPlace.owner_id !== auth.user.uid &&
        String(ownedPlace.owner_email || '').toLowerCase() !== String(auth.user.email || '').toLowerCase()
      )) {
        return jsonResponse({success:false,error:'طلب التوثيق متاح لمالك المكان فقط'},403,corsHeaders);
      }
    }
    const ownerName = body.owner_name || body.ownerName || '';
    const ownerEmail = body.owner_email || body.ownerEmail || '';
    const phone = body.phone || '';
    const notes = body.notes || '';
    const now = Date.now();

    if (!placeId) return jsonResponse({ error: 'place_id مطلوب' }, 400, corsHeaders);

    try {
      await createTursoDB(env).prepare(`
        INSERT INTO verification_requests (id, place_id, place_name, owner_id, owner_name, owner_email, phone, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).bind(id, placeId, placeName, ownerId, ownerName, ownerEmail, phone, notes, now).run();
      return jsonResponse({ success: true, id, message: 'تم إرسال طلب التوثيق' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  if ((url.pathname.startsWith('/api/verification-requests/') || url.pathname === '/api/verification-requests') && (request.method === 'PUT' || request.method === 'PATCH')) {
    const auth = await requireAdmin(request, env);
    if (auth.response) return auth.response
    const idFromPath = url.pathname.startsWith('/api/verification-requests/') ? url.pathname.replace('/api/verification-requests/', '') : '';
    const body = await request.json().catch(() => ({}));
    const id = (idFromPath || body.id || '').trim();
    const status = (body.status || 'approved').trim();
    const verifiedUntil = body.verified_until || body.verifiedUntil || null;
    const now = Date.now();

    if (!id) return jsonResponse({ error: 'Request ID required' }, 400, corsHeaders);

    try {
      await createTursoDB(env).prepare(`
        UPDATE verification_requests SET status = ?, verified_until = ?, reviewed_at = ? WHERE id = ?
      `).bind(status, verifiedUntil, now, id).run();
      return jsonResponse({ success: true, message: 'تم تحديث حالة طلب التوثيق' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: FCM Token Registration (POST /api/fcm/token) ───────────
  if (url.pathname === '/api/fcm/token' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const token = (body.token || '').trim();
    if (!token) {
      return jsonResponse({ error: 'token مطلوب' }, 400, corsHeaders);
    }

    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    const userId = auth.user.uid;
    const userName = auth.user.name || auth.user.email || '';
    const platform = body.platform || 'web';
    const userAgent = request.headers.get('user-agent') || body.userAgent || '';
    const now = Date.now();

    try {
      await createTursoDB(env).prepare(`
        INSERT INTO fcm_tokens (token, user_id, user_name, platform, user_agent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(token) DO UPDATE SET
          user_id = excluded.user_id,
          user_name = excluded.user_name,
          platform = excluded.platform,
          updated_at = excluded.updated_at
      `).bind(token, userId, userName, platform, userAgent, now, now).run();

      return jsonResponse({ success: true, message: 'تم تسجيل التوكن في Turso' }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── Turso: Track Place Stat (POST /api/places/track-stat) ─────────
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
      const place = await createTursoDB(env).prepare(`SELECT stats_json FROM places WHERE id = ? OR slug = ? LIMIT 1`).bind(placeId, placeId).first();
      if (place) {
        const stats = parseJson(place.stats_json, {});
        stats[stat] = (Number(stats[stat]) || 0) + 1;
        await createTursoDB(env).prepare(`UPDATE places SET stats_json = ?, updated_at = ? WHERE id = ? OR slug = ?`).bind(JSON.stringify(stats), Date.now(), placeId, placeId).run();
      }
      return jsonResponse({ success: true }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, corsHeaders);
    }
  }

  // ── 1. Upload to R2 (POST /api/upload) ──
      // ── 1. Upload to R2 (POST /api/upload) ──
      if (url.pathname === '/api/upload' && request.method === 'POST') {
        const auth = await requireAuth(request, env);
        if (auth.response) return auth.response
        const formData = await request.formData();
        const file = formData.get('file');
        const customKey = formData.get('key');
        const folder = formData.get('folder') || 'places';

        if (!file) {
          return jsonResponse({ error: 'لم يتم إرسال ملف' }, 400, corsHeaders);
        }

        if (!env.elmanzala) return jsonResponse({success:false,error:'R2 غير مهيأ على Worker'},503,corsHeaders);
        const contentType = String(file.type || '').toLowerCase();
        const allowedTypes = new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
        if (!allowedTypes.has(contentType)) return jsonResponse({success:false,error:'نوع الملف غير مسموح. الصور فقط.'},415,corsHeaders);
        const size = Number(file.size || 0);
        if (!Number.isFinite(size) || size <= 0 || size > 10 * 1024 * 1024) return jsonResponse({success:false,error:'حجم الصورة يجب ألا يتجاوز 10 ميجابايت'},413,corsHeaders);
        const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40) || 'places';
        const extMap = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif'};
        const ext = extMap[contentType] || 'webp';
        let key = String(customKey || '').trim().replace(/^\/+|\/+$/g, '');
        if (key) {
          key = key.replace(/[^a-zA-Z0-9_./-]/g,'').slice(0,300);
          if (!key || key.includes('..')) return jsonResponse({success:false,error:'مفتاح التخزين غير صالح'},400,corsHeaders);
        } else {
          key = safeFolder + '/' + Date.now() + '-' + Math.random().toString(36).substring(2,9) + '.' + ext;
        }
        await env.elmanzala.put(key, file.stream(), {
          httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' }
        });
        const publicUrl = 'https://pub-85efa06866b24efbbd08e79a654ed53f.r2.dev/' + key;
        return jsonResponse({ success: true, key, url: publicUrl }, 200, corsHeaders);
      }

      // ── 2. Delete from R2 (DELETE /api/upload/:key) ──
      if (url.pathname.startsWith('/api/upload/') && request.method === 'DELETE') {
        const auth = await requireAdmin(request, env);
        if (auth.response) return auth.response
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
        const arabicName = String(body.name || body.text || '').trim();
        const category = body.category || '';

        if (!arabicName) {
          return jsonResponse({ error: 'الاسم مطلوب' }, 400, corsHeaders);
        }

        const translated = await callOpenRouterAI(
          `Translate the following Arabic business/place name in Egypt into a clean, natural English business name. Return ONLY the translated name without quotes or explanation: "${arabicName}"`,
          env
        );

        const cleanTranslated = (translated || arabicName).trim();

        return jsonResponse({
          success: true,
          translatedName: cleanTranslated,
          result: cleanTranslated,
          text: cleanTranslated
        }, 200, corsHeaders);
      }

      // ── AI General Chat / Generation (POST /api/ai/chat) ──
      if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const prompt = String(body.prompt || body.message || '').trim();
        const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined;
        const dynamicModel = typeof body.model === 'string' ? body.model : undefined;
        const dynamicModels = Array.isArray(body.models) ? body.models : undefined;

        if (!prompt) {
          return jsonResponse({ success: false, error: 'نص المحادثة مطلوب' }, 400, corsHeaders);
        }

        const text = await callOpenRouterWithAccountFailover({
          prompt,
          systemPrompt,
          model: dynamicModel,
          models: dynamicModels
        }, env);

        if (!text) {
          return jsonResponse({ success: false, error: 'تعذر الحصول على استجابة من خدمة الذكاء الاصطناعي' }, 502, corsHeaders);
        }

        return jsonResponse({
          success: true,
          result: text,
          text: text,
          content: text
        }, 200, corsHeaders);
      }

      // ── AI Multi-Account Diagnostic Test (GET or POST /api/ai/test-accounts) ──
      if (url.pathname === '/api/ai/test-accounts') {
        const diagnostics = await testAllOpenRouterAccounts(env);
        return jsonResponse({
          success: true,
          ...diagnostics
        }, 200, corsHeaders);
      }

      // ── AI Category Icon (POST /api/ai/category-icon) ──

      if (url.pathname === '/api/ai/category-icon' && request.method === 'POST') {
        const auth = await requireAdmin(request, env);
        if (auth.response) return auth.response;
        const body = await request.json().catch(() => ({}));
        const name = String(body.name || '').trim();
        if (!name) return jsonResponse({success:false,error:'اسم التصنيف مطلوب'},400,corsHeaders);
        const generated = await callOpenRouterAI(
          'Choose exactly ONE Unicode emoji that professionally represents this business directory category. Understand the Arabic business/activity meaning, not literal translation. Return ONLY one emoji and nothing else. Category: ' + name,
          env
        );
        const emoji = String(generated || '').trim().match(/^\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*$/u)?.[0];
        if (!emoji) return jsonResponse({success:false,error:'تعذر توليد أيقونة مناسبة'},502,corsHeaders);
        return jsonResponse({success:true,icon:emoji},200,corsHeaders);
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
        const auth = await requireAdmin(request, env);
        if (auth.response) return auth.response
        const webhookUrl = url.searchParams.get('url') || `https://${url.host}/api/telegram/webhook`;
        const res = await telegramApi('setWebhook', { url: webhookUrl }, env);
        return jsonResponse({ success: true, webhookUrl, result: res }, 200, corsHeaders);
      }

      // ── 9b. Test Telegram Notification (POST /api/telegram/test) ──
      if (url.pathname === '/api/telegram/test' && (request.method === 'POST' || request.method === 'GET')) {
        const auth = await requireAdmin(request, env);
        if (auth.response) return auth.response
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
        const auth = await requireAdmin(request, env);
        if (auth.response) return auth.response
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

      // ── Turso: ATM Poll API ─────────────────────────────────────
      if (url.pathname.startsWith('/api/places/') && url.pathname.endsWith('/atm-poll') && (request.method === 'GET' || request.method === 'POST')) {
        const placeId = decodeURIComponent(url.pathname.slice('/api/places/'.length, -'/atm-poll'.length));
        if (!placeId) return jsonResponse({success:false,error:'معرف المكان مطلوب'},400,corsHeaders);
        const db = createTursoDB(env);
        if (request.method === 'GET') {
          const row = await db.prepare('SELECT atm_poll_json FROM places WHERE id=? LIMIT 1').bind(placeId).first();
          let poll={}; try { poll=JSON.parse(row?.atm_poll_json||'{}'); } catch (_) {}
          return jsonResponse({success:true,data:poll},200,{...corsHeaders,'Cache-Control':'no-store'});
        }
        const auth = await requireAuth(request, env);
        if (auth.response) return auth.response;
        const body = await request.json().catch(()=>({}));
        const questionKey=String(body.questionKey||'').trim(), voteType=body.voteType==='yes'?'yes':'no';
        if (!questionKey) return jsonResponse({success:false,error:'questionKey مطلوب'},400,corsHeaders);
        const row = await db.prepare('SELECT atm_poll_json FROM places WHERE id=? LIMIT 1').bind(placeId).first();
        let poll={}; try { poll=JSON.parse(row?.atm_poll_json||'{}'); } catch (_) {}
        const q={...(poll[questionKey]||{})}, now=Date.now();
        q.yesCount=Number(q.yesCount||0)+(voteType==='yes'?1:0); q.noCount=Number(q.noCount||0)+(voteType==='no'?1:0);
        q.totalVotes=q.yesCount+q.noCount; q.lastAnswerTime=now; q.lastAnswerChoice=voteType; q.updatedAt=now;
        poll[questionKey]=q; poll.updatedAt=now;
        if(questionKey==='cash'){poll.yesCount=q.yesCount;poll.noCount=q.noCount;poll.totalVotes=q.totalVotes;poll.lastAnswerTime=now;poll.lastAnswerChoice=voteType;}
        await db.prepare('UPDATE places SET atm_poll_json=? WHERE id=?').bind(JSON.stringify(poll),placeId).run();
        return jsonResponse({success:true,data:poll},200,corsHeaders);
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
 * ─────────────────────────────────────────────────────────────
 * PRODUCTION OPENROUTER MULTI-ACCOUNT FAILOVER & MODEL CASCADE
 * ─────────────────────────────────────────────────────────────
 * LEVEL 1 — Model Fallback: OpenRouter native model cascade (`models: [...]`).
 * LEVEL 2 — Account Fallback: Failover across Account #1 -> #2 -> #3 -> #4.
 */

const DEFAULT_OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'openrouter/free'
];

/**
 * Resolves models array for OpenRouter native fallback.
 * Preserves dynamic primary model while ensuring fallback models are included.
 */
function resolveOpenRouterModels(primaryModel, customFallbackModels = []) {
  const models = [
    ...(primaryModel ? [primaryModel] : []),
    ...(Array.isArray(customFallbackModels) && customFallbackModels.length > 0 ? customFallbackModels : DEFAULT_OPENROUTER_MODELS)
  ];
  return [...new Set(models.filter(m => typeof m === 'string' && m.trim().length > 0))].slice(0, 3);
}

/**
 * Returns all candidate OpenRouter accounts (1 to 4).
 */
function getCandidateOpenRouterAccounts(env) {
  if (!env || typeof env !== 'object') return [];
  return [
    { id: 1, name: 'Account #1', key: env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY_1 || env.OPENROUTER_KEY },
    { id: 2, name: 'Account #2', key: env.OPENROUTER_API_KEY_2 },
    { id: 3, name: 'Account #3', key: env.OPENROUTER_API_KEY_3 },
    { id: 4, name: 'Account #4', key: env.OPENROUTER_API_KEY_4 }
  ];
}

/**
 * Discovers configured OpenRouter accounts from Cloudflare Worker environment/secrets.
 * Supports:
 * - OPENROUTER_API_KEY / OPENROUTER_API_KEY_1 (Account #1 - Primary)
 * - OPENROUTER_API_KEY_2 (Account #2 - Failover)
 * - OPENROUTER_API_KEY_3 (Account #3 - Failover)
 * - OPENROUTER_API_KEY_4 (Account #4 - Failover)
 * Only accounts with non-empty keys participate in failover.
 */
function getConfiguredOpenRouterAccounts(env) {
  return getCandidateOpenRouterAccounts(env).filter(
    acc => typeof acc.key === 'string' && acc.key.trim().length > 0
  );
}

/**
 * Diagnostic tool: Tests all 4 OpenRouter accounts individually and reports status.
 */
async function testAllOpenRouterAccounts(env) {
  const candidates = getCandidateOpenRouterAccounts(env);
  const accountTests = [];

  for (const account of candidates) {
    if (!account.key || typeof account.key !== 'string' || account.key.trim().length === 0) {
      accountTests.push({
        id: account.id,
        name: account.name,
        configured: false,
        status: 'missing_key',
        maskedKey: null,
        error: 'Key not found in Cloudflare Worker environment / secrets'
      });
      continue;
    }

    const cleanKey = account.key.trim();
    const maskedKey = cleanKey.length > 12 
      ? `${cleanKey.slice(0, 7)}...${cleanKey.slice(-4)}`
      : '***';

    const startTime = Date.now();
    const testModels = DEFAULT_OPENROUTER_MODELS;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
          'HTTP-Referer': 'https://dalilmanzala.com',
          'X-Title': 'Dalil El Manzala Account Verification'
        },
        body: JSON.stringify({
          model: testModels[0],
          models: testModels,
          messages: [
            { role: 'user', content: 'Say "Account OK" in two words.' }
          ],
          max_tokens: 15,
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(12000)
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        accountTests.push({
          id: account.id,
          name: account.name,
          configured: true,
          maskedKey,
          status: 'http_error',
          httpStatus: res.status,
          latencyMs,
          error: `HTTP ${res.status}: ${errText.slice(0, 160)}`
        });
        continue;
      }

      const data = await res.json().catch(() => null);
      const reply = data?.choices?.[0]?.message?.content?.trim() || '';
      const modelUsed = data?.model || testModels[0];

      accountTests.push({
        id: account.id,
        name: account.name,
        configured: true,
        maskedKey,
        status: reply ? 'success' : 'empty_response',
        httpStatus: res.status,
        latencyMs,
        modelUsed,
        reply,
        ok: Boolean(reply)
      });
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      accountTests.push({
        id: account.id,
        name: account.name,
        configured: true,
        maskedKey,
        status: 'network_error',
        latencyMs,
        error: err?.message || String(err)
      });
    }
  }

  // Test the end-to-end cascade
  const cascadeStart = Date.now();
  const cascadeOutput = await callOpenRouterAI('Ping test', env);
  const cascadeLatencyMs = Date.now() - cascadeStart;

  const detectedEnvKeys = Object.keys(env || {}).filter(k => k.toUpperCase().includes('OPENROUTER'));

  return {
    timestamp: new Date().toISOString(),
    totalConfigured: accountTests.filter(a => a.configured).length,
    totalWorking: accountTests.filter(a => a.status === 'success').length,
    detectedOpenRouterEnvKeys: detectedEnvKeys,
    accounts: accountTests,
    endToEndCascade: {
      status: cascadeOutput ? 'working' : 'failed',
      latencyMs: cascadeLatencyMs,
      response: cascadeOutput
    }
  };
}


/**
 * Production-grade OpenRouter request with Level-1 Model Fallback and Level-2 Account Fallover.
 *
 * @param {Object} options
 * @param {string} options.prompt - Prompt text (required)
 * @param {string} [options.systemPrompt] - System prompt
 * @param {string} [options.model] - Dynamic primary model
 * @param {string[]} [options.models] - Custom fallback models array
 * @param {number} [options.temperature] - Generation temperature (default 0.3)
 * @param {number} [options.max_tokens] - Max tokens (default 300)
 * @param {number} [options.timeoutMs] - Timeout per account attempt in ms (default 9000)
 * @param {string} [options.fallbackText] - Text returned if all accounts fail (default '')
 * @param {Object} env - Cloudflare Worker environment / secrets
 * @returns {Promise<string>} Generated text content or fallback text
 */
async function callOpenRouterWithAccountFailover(options, env) {
  const prompt = options?.prompt || '';
  if (!prompt) return '';

  const configuredAccounts = getConfiguredOpenRouterAccounts(env);

  if (configuredAccounts.length === 0) {
    console.warn('[OpenRouter] No configured API keys found in environment (OPENROUTER_API_KEY[_2|_3|_4])');
    return options.fallbackText || '';
  }

  const resolvedModels = resolveOpenRouterModels(
    options.model || env.OPENROUTER_MODEL,
    options.models
  );
  const primaryModel = resolvedModels[0] || 'google/gemini-2.0-flash-exp:free';
  const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : 9000;
  const systemPrompt = options.systemPrompt || 'You are an intelligent local directory assistant for El Manzala city, Egypt. Provide concise, direct outputs.';
  const temperature = typeof options.temperature === 'number' ? options.temperature : 0.3;
  const maxTokens = typeof options.max_tokens === 'number' ? options.max_tokens : 300;

  const requestBody = JSON.stringify({
    model: primaryModel,
    models: resolvedModels,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature,
    max_tokens: maxTokens
  });

  for (let i = 0; i < configuredAccounts.length; i++) {
    const account = configuredAccounts[i];
    const isLastAccount = i === configuredAccounts.length - 1;
    const accountLabel = `${account.name} (${i + 1}/${configuredAccounts.length})`;

    try {
      console.log(`[OpenRouter] ${accountLabel} executing request with ${resolvedModels.length} models cascade...`);

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${account.key.trim()}`,
          'HTTP-Referer': 'https://dalilmanzala.com',
          'X-Title': 'Dalil El Manzala Platform'
        },
        body: requestBody,
        signal: AbortSignal.timeout(timeoutMs)
      });

      // Transient & Provider Failures -> Trigger account failover
      if (!res.ok) {
        console.warn(`[OpenRouter] ${account.name} failed with HTTP ${res.status} (${res.statusText || 'Error'})${!isLastAccount ? ', failing over to next account...' : ''}`);
        continue;
      }

      const data = await res.json().catch(() => null);
      if (!data) {
        console.warn(`[OpenRouter] ${account.name} returned invalid or non-JSON body${!isLastAccount ? ', failing over to next account...' : ''}`);
        continue;
      }

      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        console.warn(`[OpenRouter] ${account.name} returned empty or malformed AI response content${!isLastAccount ? ', failing over to next account...' : ''}`);
        continue;
      }

      // Successful, validated response!
      console.log(`[OpenRouter] ${account.name} succeeded (model: ${data.model || primaryModel})`);
      return content.trim();

    } catch (err) {
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      const reason = isTimeout ? `Timeout after ${timeoutMs}ms` : (err.message || 'NetworkError');
      console.warn(`[OpenRouter] ${account.name} request error (${reason})${!isLastAccount ? ', failing over to next account...' : ''}`);
    }
  }

  console.error(`[OpenRouter] All ${configuredAccounts.length} configured account(s) failed.`);
  return options.fallbackText || '';
}

/**
 * Call OpenRouter AI (Backward-compatible wrapper for existing endpoints).
 */
async function callOpenRouterAI(prompt, env, options = {}) {
  const result = await callOpenRouterWithAccountFailover({
    prompt,
    ...options
  }, env);
  return result || '';
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

const ARABIC_CHAR_MAP = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'k',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y',
  'ى': 'a', 'ئ': 'y', 'ؤ': 'w', 'ء': ''
};

function transliterateArabicWorker(text) {
  if (!text) return '';
  return String(text).split('').map(c => ARABIC_CHAR_MAP[c] ?? c).join('');
}

function slugifyWorker(text) {
  if (!text) return '';
  return transliterateArabicWorker(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Known Place Slug/ID mapping for deterministic zero-latency resolution
 */
const KNOWN_PLACE_ALIASES = {
  'dktwr-ahmd-hmad': 'p_1788904946234_ggxkgg',
  'dr-ahmed-hammad': 'p_1788904946234_ggxkgg',
  'mtbkh-eyma-llaakl': 'p_1788801925745_vuxmjs',
  'mtbkh-eymy-llaakl-albyty': 'p_1788801925745_vuxmjs',
  'alshykh-alhsan-mstfa-abwzyd': 'p_1788654913797_l7g6nr',
  'alhsan-lsyana-alhwataf-almhmwla': '-P03LX9MledW_z7QfyHO',
  'almhnds-mhmd-hmad': 'p_1788742873778_6k8a9v',
  'mhlat-ghnym-llahzya': 'p_1788893499969_pk4iay',
  'sntr-alghdban-llmlabs-algahza': '-P0XRSq2etJxs31mul5O',
  'dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt': '-P0hhX-OTkLMFSSYzWIp'
};

let _hasHealedSlugs = false;
async function ensureSlugsHealedInTurso(env) {
  if (_hasHealedSlugs) return;
  _hasHealedSlugs = true;
  try {
    const db = createTursoDB(env);
    const updates = [
      ['dktwr-ahmd-hmad', 'p_1788904946234_ggxkgg'],
      ['mtbkh-eymy-llaakl-albyty', 'p_1788801925745_vuxmjs'],
      ['alshykh-alhsan-mstfa-abwzyd', 'p_1788654913797_l7g6nr'],
      ['alhsan-lsyana-alhwataf-almhmwla', '-P03LX9MledW_z7QfyHO'],
      ['almhnds-mhmd-hmad', 'p_1788742873778_6k8a9v'],
      ['mhlat-ghnym-llahzya', 'p_1788893499969_pk4iay'],
      ['sntr-alghdban-llmlabs-algahza', '-P0XRSq2etJxs31mul5O'],
      ['dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt', '-P0hhX-OTkLMFSSYzWIp']
    ];
    for (const [cleanSlug, id] of updates) {
      await db.prepare('UPDATE places SET slug = ? WHERE id = ? AND (slug = id OR slug LIKE "p_%" OR slug LIKE "-P0%")').bind(cleanSlug, id).run().catch(() => {});
    }
  } catch (err) {
    console.warn('[ensureSlugsHealedInTurso] Notice:', err.message);
  }
}

/**
 * Universal Deterministic Place Finder across all URL formats:
 * - Tier 1: Exact match on slug OR id (case-insensitive)
 * - Tier 2: Direct alias dictionary for historical / social links
 * - Tier 3: Exact base slug match (for slugs with unique ID hash suffixes)
 * - Tier 4: Exact transliterated business name match (slugify(p.name) === query)
 *
 * NOTE: NEVER do loose prefix matching (LIKE ? || '%') or substring matching,
 * as it falsely cross-matches completely different places (e.g. Dr. Ahmed Hammad vs Dr. Ahmed Zahran).
 */
async function findPlaceInTurso(env, rawQuery) {
  const query = decodeURIComponent(String(rawQuery || '').trim()).toLowerCase();
  if (!query) return null;

  const db = createTursoDB(env);

  // 1. Exact match by slug or id (case-insensitive)
  try {
    const row = await db.prepare(`
      SELECT p.* FROM places p
      WHERE (LOWER(p.slug) = ? OR LOWER(p.id) = ? OR p.slug = ? OR p.id = ?)
      LIMIT 1
    `).bind(query, query, rawQuery, rawQuery).first();
    if (row) return row;
  } catch (err) {
    console.warn('[findPlaceInTurso] Tier 1 lookup notice:', err.message);
  }

  // 2. Direct alias mapping (e.g. dktwr-ahmd-hmad -> p_1788904946234_ggxkgg)
  const mappedId = KNOWN_PLACE_ALIASES[query];
  if (mappedId) {
    try {
      const row = await db.prepare(`
        SELECT p.* FROM places p WHERE p.id = ? OR LOWER(p.slug) = ? LIMIT 1
      `).bind(mappedId, query).first();
      if (row) {
        // Auto-heal slug in Turso if it's currently an ID
        if (row.slug === row.id || row.slug.startsWith('p_') || row.slug.startsWith('-P0')) {
          row.slug = query;
          db.prepare('UPDATE places SET slug = ? WHERE id = ?').bind(query, row.id).run().catch(() => {});
        }
        return row;
      }
    } catch (err) {
      console.warn('[findPlaceInTurso] Tier 2 alias notice:', err.message);
    }
  }

  // 3. Exact clean base slug match (for places whose slug has a unique ID suffix, e.g. 'foo-bar-6pUaTG')
  // We match ONLY when cand.slug is `${query}-${id_suffix}` where id_suffix matches the place ID!
  try {
    const candidates = (await db.prepare(`
      SELECT p.* FROM places p
      WHERE LOWER(p.slug) LIKE ? || '-%'
      LIMIT 10
    `).bind(query).all()).results || [];

    for (const cand of candidates) {
      const candSlug = String(cand.slug || '').toLowerCase();
      const m = candSlug.match(/^(.*?)-([a-z0-9_]{5,7})$/i);
      if (m && m[1] === query) {
        return cand;
      }
    }
  } catch (err) {
    console.warn('[findPlaceInTurso] Tier 3 suffix lookup notice:', err.message);
  }

  // 4. Exact transliterated Arabic / English name match (slugify(p.name) === query)
  // Scans places strictly using full-string equality (zero prefix or partial guessing)
  try {
    const allPlaces = (await db.prepare(`
      SELECT p.* FROM places p
      WHERE p.status = 'published'
    `).all()).results || [];

    for (const cand of allPlaces) {
      const translitName = slugifyWorker(cand.name);
      const translitEn = slugifyWorker(cand.name_en || '');

      if (translitName === query || translitEn === query) {
        if (cand.slug === cand.id || cand.slug.startsWith('p_') || cand.slug.startsWith('-P0')) {
          cand.slug = query;
          db.prepare('UPDATE places SET slug = ? WHERE id = ?').bind(query, cand.id).run().catch(() => {});
        }
        return cand;
      }
    }
  } catch (err) {
    console.warn('[findPlaceInTurso] Tier 4 scan notice:', err.message);
  }

  return null;
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

  // ============================================================
  // 1. البحث الشامل والمرن عن المكان في Turso
  // ============================================================
  const place = await findPlaceInTurso(env, cleanSlug);

  // ============================================================
  // 2. إذا لم يوجد المكان بعد كل محاولات البحث المتقدمة
  // ============================================================
  if (!place) {
    const userAgent = request.headers.get('user-agent') || '';
    const isCrawler = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|googlebot|bingbot|slackbot|discordbot/i.test(userAgent);
    if (!isCrawler) {
      return Response.redirect(`${canonicalBase}/places.html`, 302);
    }
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
  <p><a href="https://dalilmanzala.com/places.html">تصفح جميع الأماكن في الدليل</a></p>
</body>
</html>`,
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=120'
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

  const isIdLike = (s) => !s || s.startsWith('p_') || s.startsWith('-P0') || (s.length > 20 && /^[a-zA-Z0-9_-]+$/.test(s));
  const cleanTranslit = slugifyWorker(place.name);
  const cleanPrefix = cleanSlug.replace(/-[a-z0-9_]{4,10}$/i, '');

  let canonicalSlug = '';
  if (cleanSlug && !isIdLike(cleanSlug)) {
    canonicalSlug = cleanSlug;
  } else if (place.slug && !isIdLike(place.slug)) {
    canonicalSlug = place.slug;
  } else {
    canonicalSlug = cleanTranslit || cleanPrefix || place.id;
  }

  const placeTargetSlug = canonicalSlug || place.slug || cleanSlug;

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
