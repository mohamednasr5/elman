import { createTursoDB } from './turso.js';
import { toConciseEnglishSlug } from './article-ai.js';

const SITE = 'https://dalilmanzala.com';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function text(value, max) {
  return String(value ?? '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max || 12000);
}

function keywords(value) {
  let list = value;
  if (typeof value === 'string') {
    try { list = JSON.parse(value); } catch (_) { list = value.split(/[,،|]/); }
  }
  if (!Array.isArray(list)) list = [];
  return [...new Set(list.map(v => String(v ?? '').trim()).filter(Boolean))].slice(0, 12);
}

function slugify(value, defaultName = 'article') {
  return toConciseEnglishSlug(value, defaultName);
}

function imageUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https:\/\/(www\.)?dalilmanzala\.com\//i.test(raw)) return raw;
  if (raw.startsWith('/api/r2/') || raw.startsWith('/assets/')) return SITE + raw;
  const m = raw.match(/^https?:\/\/[^/]+\.r2\.dev\/(.+)$/i);
  return m ? SITE + '/api/r2/' + m[1] : '';
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id, placeId: row.place_id, ownerId: row.owner_id, slug: row.slug,
    title: row.title, excerpt: row.excerpt || '', content: row.content || '',
    keywords: keywords(row.keywords_json), coverImageUrl: imageUrl(row.cover_image_url),
    status: row.status || 'published', aiGenerated: Boolean(row.ai_generated),
    createdAt: Number(row.created_at || 0), updatedAt: Number(row.updated_at || 0),
    publishedAt: Number(row.published_at || row.created_at || 0),
    place: row.place_name ? {
      id: row.place_id, name: row.place_name, slug: row.place_slug,
      area: row.place_area || '', address: row.place_address || '', phone: row.place_phone || '',
      whatsapp: row.place_whatsapp || '',
      logoUrl: imageUrl(row.place_logo_url), coverImageUrl: imageUrl(row.place_cover_url),
      isVerified: Number(row.place_is_verified || 0) === 1 || String(row.place_verification_status || '').toLowerCase() === 'verified',
      rating: Number(row.place_rating || 0),
      reviewCount: Number(row.place_review_count || 0)
    } : null
  };
}

async function bySlug(db, slug, includeUnpublished) {
  const s = String(slug || '').trim();
  let sql = 'SELECT a.*, p.name AS place_name, p.slug AS place_slug, p.area AS place_area, p.address AS place_address, p.phone AS place_phone, p.whatsapp AS place_whatsapp, p.logo_url AS place_logo_url, p.cover_image_url AS place_cover_url, p.is_verified AS place_is_verified, p.verification_status AS place_verification_status, (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE place_id = p.id AND status = \'published\') AS place_rating, (SELECT COUNT(*) FROM reviews WHERE place_id = p.id AND status = \'published\') AS place_review_count FROM articles a JOIN places p ON p.id=a.place_id WHERE (a.slug = ? OR a.slug = ? OR a.id = ?)';
  if (!includeUnpublished) sql += " AND a.status = 'published'";
  sql += ' LIMIT 1';
  let rawRow = await db.prepare(sql).bind(s, decodeURIComponent(s), s).first().catch(() => null);

  // Fallback: If not found, check if a legacy non-English slug corresponds to this English slug
  if (!rawRow) {
    let legacySql = 'SELECT a.*, p.name AS place_name, p.slug AS place_slug, p.area AS place_area, p.address AS place_address, p.phone AS place_phone, p.whatsapp AS place_whatsapp, p.logo_url AS place_logo_url, p.cover_image_url AS place_cover_url, p.is_verified AS place_is_verified, p.verification_status AS place_verification_status, (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE place_id = p.id AND status = \'published\') AS place_rating, (SELECT COUNT(*) FROM reviews WHERE place_id = p.id AND status = \'published\') AS place_review_count FROM articles a JOIN places p ON p.id=a.place_id';
    if (!includeUnpublished) legacySql += " WHERE a.status = 'published'";
    legacySql += ' ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT 20';
    const candidates = (await db.prepare(legacySql).all().catch(() => ({results:[]}))).results || [];
    for (const r of candidates) {
      const generated = toConciseEnglishSlug(`${r.place_name || ''} ${r.title}`, 'article');
      if (generated === s || generated.startsWith(s) || s.startsWith(generated)) {
        await db.prepare('UPDATE articles SET slug=? WHERE id=?').bind(generated, r.id).run().catch(() => {});
        r.slug = generated;
        rawRow = r;
        break;
      }
    }
  }

  if (!rawRow) return null;

  // Auto-upgrade legacy Arabic slugs to clean English slugs in DB
  if (rawRow.slug && !/^[a-z0-9-]+$/.test(rawRow.slug)) {
    const cleanSlug = toConciseEnglishSlug(`${rawRow.place_name || ''} ${rawRow.title}`, 'article');
    if (cleanSlug) {
      await db.prepare('UPDATE articles SET slug=? WHERE id=?').bind(cleanSlug, rawRow.id).run().catch(() => {});
      rawRow.slug = cleanSlug;
    }
  }

  return mapRow(rawRow);
}

function formatProse(rawContent) {
  const blocks = String(rawContent || '').split(/\n\n+/);
  let isFirstParagraph = true;
  return blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.slice(4).trim();
      return '<h3 class="prose-h3"><span class="prose-h3__icon" aria-hidden="true">✨</span><span>' + esc(headingText) + '</span></h3>';
    }
    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.slice(3).trim();
      return '<h2 class="prose-h2"><span class="prose-h2__icon" aria-hidden="true">📌</span><span>' + esc(headingText) + '</span></h2>';
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').map(li => li.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
      return '<ul class="prose-list">' + items.map(it => '<li>' + esc(it) + '</li>').join('') + '</ul>';
    }
    if (isFirstParagraph) {
      isFirstParagraph = false;
      return '<p class="prose-p prose-lead">' + esc(trimmed) + '</p>';
    }
    return '<p class="prose-p">' + esc(trimmed) + '</p>';
  }).filter(Boolean).join('\n');
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (_) {
    return '';
  }
}

function card(article) {
  const p = article.place || {};
  const href = '/article/' + encodeURIComponent(article.slug) + '/';
  const placeHref = '/place/' + encodeURIComponent(p.slug || p.id || '') + '/';
  const excerpt = article.excerpt || text(article.content, 160);
  const words = String(article.content || '').trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 150));
  const pubDate = formatDate(article.publishedAt);
  const img = article.coverImageUrl
    ? '<img class="blog-card__image" src="' + esc(article.coverImageUrl) + '" width="640" height="360" loading="lazy" decoding="async" alt="' + esc(article.title) + '">'
    : '<div class="blog-card__image blog-card__image--placeholder" aria-hidden="true"><span>📝</span></div>';

  return '<article class="blog-card">' +
    '<a class="blog-card__image-link" href="' + esc(href) + '" aria-label="' + esc(article.title) + '">' +
      img +
      '<div class="blog-card__overlay-gradient" aria-hidden="true"></div>' +
      '<div class="blog-card__overlay-badge"><span>📍</span> ' + esc(p.area || 'المنزلة والمطرية') + '</div>' +
    '</a>' +
    '<div class="blog-card__body">' +
      '<div class="blog-card__meta">' +
        (p.name ? '<a class="blog-card__place-chip" href="' + esc(placeHref) + '" title="' + esc(p.name) + '"><span class="blog-card__verified-badge">✓</span><span>' + esc(p.name) + '</span></a>' : '<span></span>') +
        '<span class="blog-card__time">⏱️ ' + readTime + ' د قراءة</span>' +
      '</div>' +
      '<h2 class="blog-card__title"><a href="' + esc(href) + '">' + esc(article.title) + '</a></h2>' +
      '<p class="blog-card__excerpt">' + esc(excerpt) + '</p>' +
      '<div class="blog-card__footer">' +
        '<a class="blog-card__read" href="' + esc(href) + '"><span>قراءة المقال كاملاً</span><span class="blog-card__arrow-circle" aria-hidden="true">←</span></a>' +
        (pubDate ? '<span class="blog-card__date">' + esc(pubDate) + '</span>' : '') +
      '</div>' +
    '</div></article>';
}

function css() {
  return '<style>' +
  '@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap");' +
  ':root{' +
    '--font-sans:"Cairo",system-ui,-apple-system,sans-serif;' +
    '--blog-primary:#0f766e;' +
    '--blog-primary-dark:#0f4c5c;' +
    '--blog-accent:#0284c7;' +
    '--blog-text-main:#0f172a;' +
    '--blog-text-body:#334155;' +
    '--blog-muted:#64748b;' +
    '--blog-border:#e2e8f0;' +
    '--blog-surface:#ffffff;' +
    '--blog-bg:#f8fafc;' +
  '}' +
  '*{box-sizing:border-box}' +
  'body{margin:0;font-family:var(--font-sans);background:var(--blog-bg);color:var(--blog-text-body);direction:rtl;text-align:right;line-height:1.8;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}' +
  
  '#readingProgressBar{position:fixed;top:0;left:0;height:3.5px;background:linear-gradient(90deg,#0f766e,#06b6d4,#10b981);z-index:99999;width:0%;transition:width .1s ease-out}' +
  
  '.article-nav-wrap{background:rgba(255,255,255,.94);border-bottom:1px solid var(--blog-border);position:sticky;top:0;z-index:1000;backdrop-filter:blur(10px)}' +
  '.article-nav-container{max-width:1240px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}' +
  '.article-breadcrumb{display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--blog-muted);flex-wrap:wrap}' +
  '.article-breadcrumb a{color:var(--blog-primary);text-decoration:none;font-weight:700;transition:color .2s}' +
  '.article-breadcrumb a:hover{color:var(--blog-primary-dark);text-decoration:underline}' +
  '.article-breadcrumb .sep{color:#cbd5e1;font-size:.75rem}' +
  '.nav-home-btn{display:inline-flex;align-items:center;gap:6px;font-size:.84rem;font-weight:800;color:#0f4c5c;background:#f0fdfa;border:1px solid #ccfbf1;padding:6px 14px;border-radius:999px;text-decoration:none;transition:all .2s}' +
  '.nav-home-btn:hover{background:#ccfbf1;transform:translateY(-1px)}' +

  '.blog-page{max-width:1240px;margin:0 auto;padding:36px 20px 80px}' +
  '.blog-hero{padding:38px 30px;margin-bottom:36px;border:1px solid rgba(255,255,255,.15);border-radius:28px;background:linear-gradient(135deg,#0f4c5c 0%,#0f766e 55%,#115e59 100%);color:#fff;box-shadow:0 18px 40px -10px rgba(15,76,92,.28);position:relative;overflow:hidden}' +
  '.blog-hero__badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.28);padding:5px 14px;border-radius:999px;font-size:.82rem;font-weight:800;margin-bottom:14px;color:#fff}' +
  '.blog-hero h1{margin:0 0 10px;font-size:clamp(1.85rem,4.2vw,2.7rem);font-weight:900;line-height:1.35;color:#fff}' +
  '.blog-hero p{margin:0;color:#f1f5f9;font-size:1.05rem;line-height:1.9;max-width:800px}' +

  '@keyframes cardEntrance{0%{opacity:0;transform:translateY(24px) scale(.98)}100%{opacity:1;transform:translateY(0) scale(1)}}' +
  '.blog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}' +
  '@media(max-width:1080px){.blog-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}}' +
  '@media(max-width:680px){.blog-grid{grid-template-columns:minmax(0,1fr);gap:20px}}' +

  '.blog-card{display:flex;flex-direction:column;overflow:hidden;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;box-shadow:0 4px 20px -2px rgba(15,23,42,.05);transition:transform .32s cubic-bezier(.16,1,.3,1),box-shadow .32s cubic-bezier(.16,1,.3,1),border-color .32s;position:relative;animation:cardEntrance .5s cubic-bezier(.16,1,.3,1) both}' +
  '.blog-card:nth-child(1){animation-delay:.04s}' +
  '.blog-card:nth-child(2){animation-delay:.10s}' +
  '.blog-card:nth-child(3){animation-delay:.16s}' +
  '.blog-card:nth-child(4){animation-delay:.22s}' +
  '.blog-card:nth-child(5){animation-delay:.28s}' +
  '.blog-card:nth-child(6){animation-delay:.34s}' +
  '.blog-card:nth-child(7){animation-delay:.40s}' +
  '.blog-card:nth-child(8){animation-delay:.46s}' +
  '.blog-card:nth-child(9){animation-delay:.52s}' +
  '.blog-card:nth-child(n+10){animation-delay:.58s}' +
  '.blog-card:hover{transform:translateY(-8px);box-shadow:0 22px 42px -10px rgba(15,76,92,.18),0 0 0 1px rgba(15,118,110,.25);border-color:rgba(15,118,110,.45)}' +

  '.blog-card__image-link{display:block;aspect-ratio:16/9;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);overflow:hidden;position:relative}' +
  '.blog-card__image{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s cubic-bezier(.16,1,.3,1)}' +
  '.blog-card:hover .blog-card__image{transform:scale(1.08)}' +
  '.blog-card__image--placeholder{display:grid;place-items:center;font-size:44px;height:100%;background:linear-gradient(135deg,#0f4c5c 0%,#0f766e 100%);color:#fff}' +
  '.blog-card__overlay-gradient{position:absolute;inset:0;background:linear-gradient(to top,rgba(15,23,42,.6) 0%,transparent 60%);pointer-events:none}' +
  '.blog-card__overlay-badge{position:absolute;bottom:12px;right:12px;background:rgba(15,23,42,.85);backdrop-filter:blur(8px);color:#fff;font-size:.76rem;font-weight:700;padding:4px 12px;border-radius:999px;display:inline-flex;align-items:center;gap:5px;border:1px solid rgba(255,255,255,.2);box-shadow:0 4px 12px rgba(0,0,0,.2)}' +

  '.blog-card__body{padding:22px;display:flex;flex-direction:column;flex:1}' +
  '.blog-card__meta{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;font-size:.82rem}' +
  '.blog-card__place-chip{display:inline-flex;align-items:center;gap:6px;background:#f0fdfa;color:#0f766e;border:1px solid #ccfbf1;padding:3px 10px;border-radius:999px;font-weight:800;font-size:.78rem;text-decoration:none;max-width:65%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:all .2s ease}' +
  '.blog-card__place-chip:hover{background:#ccfbf1;color:#115e59}' +
  '.blog-card__verified-badge{background:#0f766e;color:#fff;border-radius:50%;width:14px;height:14px;display:inline-grid;place-items:center;font-size:9px;font-weight:900;flex-shrink:0}' +
  '.blog-card__time{color:#64748b;font-size:.76rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}' +

  '.blog-card__title{font-size:1.18rem;line-height:1.55;margin:0 0 10px;font-weight:900;color:var(--blog-text-main);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:3em}' +
  '.blog-card__title a{color:inherit;text-decoration:none;transition:color .2s ease}' +
  '.blog-card:hover .blog-card__title a{color:#0f766e}' +

  '.blog-card__excerpt{margin:0 0 18px;line-height:1.75;color:#475569;font-size:.92rem;flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}' +
  '.blog-card__footer{margin-top:auto;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}' +
  '.blog-card__read{color:#0f766e;font-weight:800;font-size:.88rem;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:color .2s ease}' +
  '.blog-card__arrow-circle{width:30px;height:30px;border-radius:50%;background:#f0fdfa;color:#0f766e;border:1px solid #ccfbf1;display:inline-grid;place-items:center;font-size:13px;font-weight:900;transition:transform .25s cubic-bezier(.16,1,.3,1),background .2s,color .2s,border-color .2s}' +
  '.blog-card:hover .blog-card__read{color:#0f4c5c}' +
  '.blog-card:hover .blog-card__arrow-circle{transform:translateX(-5px);background:#0f766e;color:#fff;border-color:#0f766e}' +
  '.blog-card__date{font-size:.76rem;color:#94a3b8;font-weight:600}' +

  '.article-page{max-width:920px;margin:0 auto;padding:24px 16px 80px}' +
  '.article-shell{background:#ffffff;border:1.5px solid var(--blog-border);border-radius:28px;overflow:hidden;box-shadow:0 12px 42px rgba(15,23,42,.06)}' +
  '.article-cover-wrap{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#0f172a}' +
  '.article-cover{width:100%;height:100%;object-fit:cover;display:block}' +
  '.article-content{padding:36px 32px 44px}' +
  '@media(max-width:640px){.article-content{padding:22px 18px 32px}}' +

  '.article-header{margin-bottom:26px}' +
  '.article-badge-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}' +
  '.badge-verified{display:inline-flex;align-items:center;gap:6px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-size:.78rem;font-weight:800;padding:4px 12px;border-radius:999px}' +
  '.badge-time{display:inline-flex;align-items:center;gap:5px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;font-size:.78rem;font-weight:700;padding:4px 12px;border-radius:999px}' +
  '.article-title{font-size:clamp(1.8rem,4.2vw,2.55rem);line-height:1.38;margin:0 0 16px;color:var(--blog-text-main);font-weight:900;letter-spacing:-.015em}' +
  '.article-meta-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap;color:var(--blog-muted);font-size:.88rem;padding-bottom:20px;border-bottom:1px solid #f1f5f9}' +
  '.article-author-link{color:var(--blog-primary);font-weight:800;text-decoration:none;display:inline-flex;align-items:center;gap:6px}' +
  '.article-author-link:hover{text-decoration:underline}' +

  '.article-prose{font-size:1.15rem;line-height:2.15;color:var(--blog-text-body)}' +
  '.prose-lead{font-size:1.22rem;line-height:2.2;font-weight:600;color:#0f172a;background:linear-gradient(135deg,#f0fdfa 0%,#ffffff 100%);border-right:4px solid var(--blog-primary);padding:20px 22px;border-radius:0 18px 18px 0;margin-bottom:28px;box-shadow:0 4px 20px rgba(15,118,110,.05)}' +
  '.prose-p{margin:0 0 24px;text-align:justify}' +
  '.prose-h3{font-size:1.38rem;font-weight:900;color:#0f172a;margin:38px 0 16px;display:flex;align-items:center;gap:10px;padding-right:14px;border-right:4px solid var(--blog-primary);line-height:1.45}' +
  '.prose-h3__icon{font-size:1.2rem;color:#0f766e}' +
  '.prose-h2{font-size:1.5rem;font-weight:900;color:#0f172a;margin:42px 0 18px;line-height:1.45;display:flex;align-items:center;gap:10px}' +
  '.prose-h2__icon{font-size:1.25rem}' +
  '.prose-list{margin:0 0 24px;padding-right:24px;line-height:2.1}' +
  '.prose-list li{margin-bottom:8px}' +

  '.article-share-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#f8fafc;border:1px solid var(--blog-border);border-radius:20px;padding:16px 22px;margin:36px 0 30px}' +
  '.article-share-title{font-size:.94rem;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:8px}' +
  '.article-share-buttons{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
  '.btn-share{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;font-weight:800;font-size:.85rem;text-decoration:none;color:#fff;border:none;cursor:pointer;transition:transform .15s,opacity .15s}' +
  '.btn-share:hover{opacity:.92;transform:translateY(-2px)}' +
  '.btn-share--wa{background:linear-gradient(135deg,#25d366 0%,#128c7e 100%)}' +
  '.btn-share--fb{background:#1877f2}' +
  '.btn-share--copy{background:#0f4c5c}' +

  '.place-context{margin-top:40px;border:1.5px solid rgba(15,118,110,.3);border-radius:24px;padding:26px;background:linear-gradient(135deg,#ffffff 0%,#f0fdfa 100%);box-shadow:0 12px 36px rgba(15,118,110,.08);position:relative;overflow:hidden}' +
  '.place-context::before{content:"";position:absolute;top:0;right:0;width:140px;height:140px;background:radial-gradient(circle,rgba(15,118,110,.12) 0%,transparent 70%);pointer-events:none}' +
  '.place-context__badge{display:inline-flex;align-items:center;gap:6px;background:#0f766e;color:#fff;font-size:.78rem;font-weight:800;padding:5px 14px;border-radius:999px;margin-bottom:16px}' +
  '.place-context__head{display:flex;align-items:center;gap:16px;flex-wrap:wrap}' +
  '.place-context__logo{width:72px;height:72px;border-radius:18px;object-fit:cover;background:#e2e8f0;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.08);flex-shrink:0}' +
  '.place-context__name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
  '.place-context__name{font-size:1.35rem;font-weight:900;color:#0f172a;line-height:1.35;margin:0}' +
  '.place-context__name a{color:inherit;text-decoration:none;transition:color .2s}' +
  '.place-context__name a:hover{color:#0f766e}' +
  '.place-context__verified{display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%);color:#fff;font-size:.76rem;font-weight:800;padding:3px 10px;border-radius:999px;box-shadow:0 2px 8px rgba(15,118,110,.25);border:1px solid rgba(255,255,255,.3)}' +
  '.place-context__check{background:#fff;color:#0f766e;border-radius:50%;width:13px;height:13px;display:inline-grid;place-items:center;font-size:9px;font-weight:900}' +
  '.place-context__meta-row{display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap}' +
  '.place-context__meta-sep{color:#cbd5e1;font-size:.8rem}' +
  '.place-context__area{color:#0f766e;font-size:.86rem;font-weight:800}' +
  '.place-context__rating{display:inline-flex;align-items:center;gap:5px;background:#fffbeb;border:1px solid #fde68a;color:#b45309;padding:3px 9px;border-radius:999px;font-size:.82rem;font-weight:800}' +
  '.place-context__star{color:#f59e0b;font-size:.85rem}' +
  '.place-context__rating-count{color:#92400e;font-size:.74rem;font-weight:600}' +
  '.place-context__data{margin:14px 0 18px;color:#475569;line-height:1.8;font-size:.92rem;display:flex;gap:16px;flex-wrap:wrap}' +
  '.place-context__actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:18px;padding-top:18px;border-top:1px dashed rgba(15,118,110,.22)}' +
  '.place-context__btn-primary{background:linear-gradient(135deg,#0f766e 0%,#0f4c5c 100%);color:#fff;padding:12px 22px;border-radius:12px;font-weight:800;font-size:.92rem;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(15,76,92,.25);transition:transform .15s,box-shadow .15s}' +
  '.place-context__btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(15,76,92,.35)}' +
  '.place-context__btn-call{background:#10b981;color:#fff;padding:11px 18px;border-radius:12px;font-weight:800;font-size:.88rem;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:transform .15s}' +
  '.place-context__btn-call:hover{transform:translateY(-2px)}' +
  '.place-context__btn-wa{background:#25d366;color:#fff;padding:11px 18px;border-radius:12px;font-weight:800;font-size:.88rem;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:transform .15s}' +
  '.place-context__btn-wa:hover{transform:translateY(-2px)}' +

  /* ── Continuous Live Articles Ticker (Left to Right / Flow Towards Right) ── */
  '.articles-ticker-wrapper{margin:28px 0 10px;background:#ffffff;border:1.5px solid rgba(15,118,110,.2);border-radius:18px;display:flex;align-items:center;overflow:hidden;box-shadow:0 6px 20px -4px rgba(15,76,92,.08);position:relative;height:56px}' +
  '.articles-ticker-label{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0f766e 0%,#0f4c5c 100%);color:#fff;padding:0 18px;height:100%;font-weight:900;font-size:.88rem;white-space:nowrap;flex-shrink:0;position:relative;z-index:3;box-shadow:4px 0 16px rgba(0,0,0,.1)}' +
  '.ticker-animated-svg{flex-shrink:0;color:#fef08a;animation:tickerSvgGlow 2.5s ease-in-out infinite}' +
  '@keyframes tickerSvgGlow{0%,100%{filter:drop-shadow(0 0 2px rgba(254,240,138,.4))}50%{filter:drop-shadow(0 0 8px rgba(254,240,138,.9))}}' +
  '.ticker-svg-lines{animation:svgWavePulse 1.6s ease-in-out infinite}' +
  '@keyframes svgWavePulse{0%,100%{opacity:.4;transform:translateX(0)}50%{opacity:1;transform:translateX(1px)}}' +
  '.ticker-svg-glow{animation:svgDotPulse 1.2s cubic-bezier(.4,0,.6,1) infinite}' +
  '@keyframes svgDotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.6}}' +
  '.ticker-badge-text{letter-spacing:-.01em}' +
  '.articles-ticker-track{flex:1;overflow:hidden;height:100%;display:flex;align-items:center;position:relative;mask-image:linear-gradient(to right,transparent 0%,black 24px,black calc(100% - 24px),transparent 100%);-webkit-mask-image:linear-gradient(to right,transparent 0%,black 24px,black calc(100% - 24px),transparent 100%)}' +
  '.articles-ticker-content{display:flex;align-items:center;width:max-content;animation:tickerMoveToRight 42s linear infinite;will-change:transform}' +
  '.articles-ticker-wrapper:hover .articles-ticker-content{animation-play-state:paused!important}' +
  '@keyframes tickerMoveToRight{0%{transform:translateX(-50%)}100%{transform:translateX(0%)}}' +
  '.ticker-entry{display:inline-flex;align-items:center;white-space:nowrap;padding:0 12px}' +
  '.ticker-link{display:inline-flex;align-items:center;gap:8px;color:#0f172a;text-decoration:none;font-weight:800;font-size:.9rem;transition:color .2s ease}' +
  '.ticker-link:hover{color:#0f766e}' +
  '.ticker-bullet{font-size:.95rem;color:#0f766e}' +
  '.ticker-text{max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.ticker-separator{display:inline-flex;align-items:center;gap:6px;margin:0 16px}' +
  '.ticker-sep-badge{display:inline-flex;align-items:center;gap:6px;background:#f0fdfa;border:1px solid #ccfbf1;padding:3px 10px;border-radius:999px;color:#0f766e;font-size:.76rem;font-weight:800;text-decoration:none;transition:background .2s,border-color .2s;white-space:nowrap}' +
  '.ticker-sep-badge:hover{background:#ccfbf1;border-color:#99f6e4}' +
  '.ticker-sep-logo{width:24px;height:24px;border-radius:50%;object-fit:cover;background:#e2e8f0;border:1.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.08);flex-shrink:0}' +
  '.ticker-sep-icon{font-size:14px;flex-shrink:0}' +
  '.ticker-sep-name{font-size:.74rem;color:#0f766e;font-weight:800}' +
  '@media(max-width:680px){.articles-ticker-wrapper{height:50px}.articles-ticker-label{padding:0 12px;font-size:.8rem}.ticker-text{max-width:240px;font-size:.84rem}}' +

  '.article-keywords{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:18px;border-top:1px solid #f1f5f9}' +
  '.article-keywords span{background:#ecfeff;color:#0f766e;border-radius:999px;padding:6px 14px;font-size:.8rem;font-weight:800;border:1px solid #cffafe;transition:all .2s}' +
  '.article-keywords span:hover{background:#cffafe}' +

  '.related-articles{margin-top:40px;border-top:1px solid var(--blog-border);padding-top:32px}' +
  '.related-articles h2{font-size:1.35rem;font-weight:900;margin:0 0 20px;color:var(--blog-text-main);display:flex;align-items:center;gap:8px}' +
  '</style>';
}

export async function handleArticlesApi(request, url, env, user) {
  const db = createTursoDB(env);
  const path = url.pathname;

  if (request.method === 'GET' && path === '/api/articles') {
    const placeId = String(url.searchParams.get('place_id') || '').trim();
    const slug = String(url.searchParams.get('slug') || '').trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 6), 1), 50);
    const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0);

    if (slug) {
      const a = await bySlug(db, slug, Boolean(user?.isAdmin));
      if (!a || (a.status !== 'published' && a.ownerId !== user?.uid && !user?.isAdmin))
        return { status: 404, body: { success:false, error:'المقال غير موجود' } };
      return { status:200, body:{success:true,data:a} };
    }

    let sql = 'SELECT a.*, p.name AS place_name, p.slug AS place_slug, p.area AS place_area, p.address AS place_address, p.phone AS place_phone, p.whatsapp AS place_whatsapp, p.logo_url AS place_logo_url, p.cover_image_url AS place_cover_url, p.is_verified AS place_is_verified, p.verification_status AS place_verification_status, (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE place_id = p.id AND status = \'published\') AS place_rating, (SELECT COUNT(*) FROM reviews WHERE place_id = p.id AND status = \'published\') AS place_review_count FROM articles a LEFT JOIN places p ON p.id=a.place_id';
    const args = [];
    if (placeId) {
      sql += " WHERE a.place_id = ? AND a.status <> 'deleted'";
      args.push(placeId);
    } else {
      sql += " WHERE a.status = 'published'";
    }
    sql += ' ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);
    const rows = (await db.prepare(sql).bind(...args).all().catch(() => ({results:[]}))).results || [];
    return {status:200,body:{success:true,data:rows.map(mapRow),total:rows.length}};
  }

  const match = path.match(/^\/api\/articles\/([^/]+)$/);

  if (request.method === 'POST' && path === '/api/articles') {
    if (!user) return {status:401,body:{success:false,error:'يجب تسجيل الدخول'}};
    const body=await request.json().catch(()=>({}));
    const placeId=String(body.place_id||body.placeId||'').trim();
    if(!placeId) return {status:400,body:{success:false,error:'المكان مطلوب'}};
    const place=await db.prepare('SELECT id,name,slug,area,address,phone,logo_url,cover_image_url,owner_id,owner_email,status FROM places WHERE id=? LIMIT 1').bind(placeId).first().catch(()=>null);
    if(!place) return {status:404,body:{success:false,error:'المكان غير موجود'}};

    const isPlaceOwner = Boolean(
      user?.isAdmin ||
      String(place.owner_id || '').trim() === String(user?.uid || '').trim() ||
      (place.owner_email && user?.email && String(place.owner_email).trim().toLowerCase() === String(user.email).trim().toLowerCase())
    );
    if(!isPlaceOwner) return {status:403,body:{success:false,error:'يمكن لصاحب المكان فقط إدارة مقالاته'}};

    const existingId=String(body.id||'').trim();
    const existing=existingId?await db.prepare('SELECT * FROM articles WHERE id=? LIMIT 1').bind(existingId).first().catch(()=>null):null;
    if(existing && !user.isAdmin && String(existing.owner_id)!==String(user.uid) && !isPlaceOwner) return {status:403,body:{success:false,error:'لا يمكنك تعديل هذا المقال'}};

    const title=text(body.title,180), content=text(body.content,10000);
    if(title.length<6) return {status:400,body:{success:false,error:'عنوان المقال قصير جدًا'}};
    if(content.length<80) return {status:400,body:{success:false,error:'محتوى المقال قصير جدًا'}};

    const now=Date.now(), status=body.status==='draft'?'draft':'published';
    const ARTICLE_COIN_COST = 200;
    const isPublishingNew = status === 'published' && (!existing || existing.status !== 'published');

    let userRow = null;
    let currentBalance = 0;
    if (isPublishingNew) {
      userRow = await db.prepare('SELECT id, points FROM users WHERE id = ? OR (LOWER(email) = ? AND email != "") ORDER BY points DESC LIMIT 1')
        .bind(user.uid, (user.email || '').toLowerCase().trim()).first().catch(() => null);
      currentBalance = Number(userRow?.points || 0);

      if (!user.isAdmin && currentBalance < ARTICLE_COIN_COST) {
        return {
          status: 402,
          body: {
            success: false,
            code: 'INSUFFICIENT_COINS',
            error: `رصيدك الحالي (${currentBalance} ذهبية) غير كافٍ. يلزم ${ARTICLE_COIN_COST} عملة ذهبية لنشر المقال. يرجى شحن محفظتك للمتابعة.`,
            required: ARTICLE_COIN_COST,
            balance: currentBalance
          }
        };
      }
    }

    let slug=slugify(body.slug||title, place.slug||place.name||'article');
    const slugOwner=await db.prepare('SELECT id FROM articles WHERE slug=? AND id<>? LIMIT 1').bind(slug,existingId||'').first().catch(()=>null);
    if(slugOwner) slug=slug+'-'+(existingId||('x'+Date.now())).slice(-4);

    const cover=imageUrl(body.cover_image_url||body.coverImageUrl);
    const kws=JSON.stringify(keywords(body.keywords));
    const excerpt=text(body.excerpt||content.slice(0,180),280);
    const id=existing?.id||existingId||('art_'+Date.now()+'_'+Math.random().toString(36).slice(2,8));

    if(existing) {
      await db.prepare("UPDATE articles SET title=?,slug=?,excerpt=?,content=?,keywords_json=?,cover_image_url=?,status=?,ai_generated=?,updated_at=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END WHERE id=?")
        .bind(title,slug,excerpt,content,kws,cover,status,body.ai_generated?1:0,now,status,now,id).run();
    } else {
      await db.prepare('INSERT INTO articles(id,place_id,owner_id,slug,title,excerpt,content,keywords_json,cover_image_url,status,ai_generated,created_at,updated_at,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id,placeId,user.uid,slug,title,excerpt,content,kws,cover,status,body.ai_generated?1:0,now,now,status==='published'?now:null).run();
    }

    let newBalance = currentBalance;
    if (isPublishingNew && !user.isAdmin) {
      const targetUserId = userRow?.id || user.uid;
      await db.prepare('UPDATE users SET points = MAX(0, points - ?), updated_at = ? WHERE id = ?')
        .bind(ARTICLE_COIN_COST, now, targetUserId).run().catch(() => {});
      const logId = 'lh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      await db.prepare(`
        INSERT INTO loyalty_history (id, user_id, type, rule_key, amount, label, meta_json, created_at)
        VALUES (?, ?, 'redeem', 'ARTICLE_PUBLISH', ?, ?, ?, ?)
      `).bind(
        logId,
        user.uid,
        -ARTICLE_COIN_COST,
        `نشر مقال: ${title.slice(0, 45)}`,
        JSON.stringify({ articleId: id, placeId, title }),
        now
      ).run().catch(() => {});
      newBalance = Math.max(0, currentBalance - ARTICLE_COIN_COST);
    }

    return {status:200,body:{success:true,data:await bySlug(db,slug,true),newBalance}};
  }

  if (request.method === 'PUT' && match) {
    if (!user) return {status:401,body:{success:false,error:'يجب تسجيل الدخول'}};
    const id=decodeURIComponent(match[1]);
    const existing=await db.prepare('SELECT * FROM articles WHERE id=? LIMIT 1').bind(id).first().catch(()=>null);
    if(!existing) return {status:404,body:{success:false,error:'المقال غير موجود'}};
    const place=await db.prepare('SELECT owner_id,owner_email,slug,name FROM places WHERE id=? LIMIT 1').bind(existing.place_id).first().catch(()=>null);
    const isOwner = Boolean(
      user.isAdmin ||
      String(existing.owner_id || '').trim() === String(user.uid || '').trim() ||
      (place?.owner_id && String(place.owner_id).trim() === String(user.uid).trim()) ||
      (place?.owner_email && user.email && String(place.owner_email).trim().toLowerCase() === String(user.email).trim().toLowerCase())
    );
    if(!isOwner) return {status:403,body:{success:false,error:'لا يمكنك تعديل هذا المقال'}};
    const body=await request.json().catch(()=>({}));
    const title=text(body.title??existing.title,180), content=text(body.content??existing.content,10000);
    const cover=imageUrl(body.cover_image_url??body.coverImageUrl??existing.cover_image_url);
    const kws=JSON.stringify(keywords(body.keywords??existing.keywords_json));
    const excerpt=text(body.excerpt??content.slice(0,180),280);
    const status=body.status==='draft'?'draft':'published', now=Date.now();

    const ARTICLE_COIN_COST = 200;
    const isPublishingNew = status === 'published' && existing.status !== 'published';
    let userRow = null;
    let currentBalance = 0;
    if (isPublishingNew) {
      userRow = await db.prepare('SELECT id, points FROM users WHERE id = ? OR (LOWER(email) = ? AND email != "") ORDER BY points DESC LIMIT 1')
        .bind(user.uid, (user.email || '').toLowerCase().trim()).first().catch(() => null);
      currentBalance = Number(userRow?.points || 0);

      if (!user.isAdmin && currentBalance < ARTICLE_COIN_COST) {
        return {
          status: 402,
          body: {
            success: false,
            code: 'INSUFFICIENT_COINS',
            error: `رصيدك الحالي (${currentBalance} ذهبية) غير كافٍ. يلزم ${ARTICLE_COIN_COST} عملة ذهبية لنشر المقال. يرجى شحن محفظتك للمتابعة.`,
            required: ARTICLE_COIN_COST,
            balance: currentBalance
          }
        };
      }
    }

    let slug = existing.slug;
    if (body.slug || !slug || !/^[a-z0-9-]+$/.test(slug)) {
      slug = slugify(body.slug || existing.slug || title, place?.slug || place?.name || 'article');
      const slugOwner = await db.prepare('SELECT id FROM articles WHERE slug=? AND id<>? LIMIT 1').bind(slug, id).first().catch(() => null);
      if (slugOwner) slug = slug + '-' + id.slice(-4);
    }

    await db.prepare("UPDATE articles SET title=?,slug=?,excerpt=?,content=?,keywords_json=?,cover_image_url=?,status=?,ai_generated=?,updated_at=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END WHERE id=?")
      .bind(title,slug,excerpt,content,kws,cover,status,body.ai_generated==null?Number(existing.ai_generated||0):body.ai_generated?1:0,now,status,now,id).run();

    let newBalance = currentBalance;
    if (isPublishingNew && !user.isAdmin) {
      const targetUserId = userRow?.id || user.uid;
      await db.prepare('UPDATE users SET points = MAX(0, points - ?), updated_at = ? WHERE id = ?')
        .bind(ARTICLE_COIN_COST, now, targetUserId).run().catch(() => {});
      const logId = 'lh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      await db.prepare(`
        INSERT INTO loyalty_history (id, user_id, type, rule_key, amount, label, meta_json, created_at)
        VALUES (?, ?, 'redeem', 'ARTICLE_PUBLISH', ?, ?, ?, ?)
      `).bind(
        logId,
        user.uid,
        -ARTICLE_COIN_COST,
        `نشر مقال: ${title.slice(0, 45)}`,
        JSON.stringify({ articleId: id, placeId: existing.place_id, title }),
        now
      ).run().catch(() => {});
      newBalance = Math.max(0, currentBalance - ARTICLE_COIN_COST);
    }

    return {status:200,body:{success:true,data:mapRow(await db.prepare('SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.whatsapp AS place_whatsapp,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a JOIN places p ON p.id=a.place_id WHERE a.id=? LIMIT 1').bind(id).first()),newBalance}};
  }

  if (request.method === 'DELETE' && match) {
    if (!user) return {status:401,body:{success:false,error:'يجب تسجيل الدخول'}};
    const id=decodeURIComponent(match[1]);
    const existing=await db.prepare('SELECT place_id, owner_id FROM articles WHERE id=? LIMIT 1').bind(id).first().catch(()=>null);
    if(!existing) return {status:404,body:{success:false,error:'المقال غير موجود'}};
    const place=await db.prepare('SELECT owner_id,owner_email FROM places WHERE id=? LIMIT 1').bind(existing.place_id).first().catch(()=>null);
    const isOwner = Boolean(
      user.isAdmin ||
      String(existing.owner_id || '').trim() === String(user.uid || '').trim() ||
      (place?.owner_id && String(place.owner_id).trim() === String(user.uid).trim()) ||
      (place?.owner_email && user.email && String(place.owner_email).trim().toLowerCase() === String(user.email).trim().toLowerCase())
    );
    if(!isOwner) return {status:403,body:{success:false,error:'لا يمكنك حذف هذا المقال'}};
    await db.prepare('DELETE FROM articles WHERE id=?').bind(id).run();
    return {status:200,body:{success:true}};
  }

  return null;
}

export async function handleArticlePublicPage(request, url, env) {
  const db=createTursoDB(env);
  const p=url.pathname.replace(/\/+$/,'') || '/';
  if(p!=='/blog' && !p.startsWith('/article/')) return null;

  if(p==='/blog') {
    const rows=(await db.prepare("SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.whatsapp AS place_whatsapp,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a LEFT JOIN places p ON p.id=a.place_id WHERE a.status='published' ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT 120").all().catch(()=>({results:[]}))).results||[];
    const title='المدونة المحلية | مقالات محلات وخدمات المنزلة والمطرية';
    const desc='مقالات محلية مفيدة يكتبها أصحاب الأنشطة عن خدماتهم وأعمالهم في المنزلة والمطرية مع روابط مباشرة لكل مكان.';
    const emptyStateHTML = `
      <div style="text-align:center;padding:50px 20px;background:#fff;border-radius:24px;border:1px solid #e2e8f0;grid-column:1/-1">
        <div style="font-size:52px;margin-bottom:12px">✍️</div>
        <h2 style="font-size:1.35rem;font-weight:900;margin:0 0 8px;color:#0f172a">لا توجد مقالات منشورة بعد</h2>
        <p style="color:#64748b;margin:0 0 20px;font-size:0.95rem;max-width:500px;margin-left:auto;margin-right:auto">كن أول من ينشر مقالاً حصرياً عن نشاطك التجاري في المنزلة والمطرية مع روابط قوية لصفحتك في جوجل والدليل.</p>
        <a href="/dashboard.html?section=articles" style="display:inline-flex;align-items:center;gap:6px;background:#0f4c5c;color:#fff;padding:12px 24px;border-radius:12px;font-weight:800;text-decoration:none;box-shadow:0 4px 14px rgba(15,76,92,.25)">✍️ اكتب مقالك الآن من لوحة التحكم</a>
      </div>
    `;
    const gridContent = rows.length ? rows.map(r=>card(mapRow(r))).join('') : emptyStateHTML;
    const blogSchema = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': SITE + '/blog/#blog',
      name: title,
      description: desc,
      url: SITE + '/blog/',
      inLanguage: 'ar-EG',
      publisher: {
        '@type': 'Organization',
        name: 'دليل المنزلة والمطرية الرقمي',
        url: SITE,
        logo: { '@type': 'ImageObject', url: SITE + '/icons/icon-512x512.png' }
      },
      blogPost: rows.slice(0, 30).map(r => ({
        '@type': 'BlogPosting',
        headline: r.title,
        url: SITE + '/article/' + encodeURIComponent(r.slug) + '/',
        datePublished: new Date(r.published_at || r.created_at).toISOString(),
        image: r.cover_image_url || (SITE + '/assets/images/og-whatsapp.jpg')
      }))
    };
    let tickerHtml = '';
    if (rows.length > 0) {
      let shuffled = [...rows];
      if (shuffled.length > 1) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
      }
      let tickerItems = shuffled.slice(0, 10);
      while (tickerItems.length < 10 && tickerItems.length > 0) {
        tickerItems = tickerItems.concat(tickerItems).slice(0, 10);
      }

      const itemsMarkup = tickerItems.map(r => {
        const itemHref = '/article/' + encodeURIComponent(r.slug) + '/';
        const itemTitle = esc(r.title);
        const itemPlace = esc(r.place_name || 'دليل المنزلة والمطرية');
        const itemLogo = r.place_logo_url || r.place_cover_url;
        const logoImg = itemLogo
          ? '<img class="ticker-sep-logo" src="' + esc(imageUrl(itemLogo)) + '" alt="' + itemPlace + '" width="24" height="24" loading="lazy">'
          : '<span class="ticker-sep-icon" aria-hidden="true">🏪</span>';

        return '<div class="ticker-entry">' +
          '<a href="' + itemHref + '" class="ticker-link" title="' + itemTitle + '">' +
            '<span class="ticker-bullet">📰</span>' +
            '<span class="ticker-text">' + itemTitle + '</span>' +
          '</a>' +
          '<div class="ticker-separator" title="' + itemPlace + '">' +
            '<span class="ticker-sep-badge">' + logoImg + '<span class="ticker-sep-name">' + itemPlace + '</span></span>' +
          '</div>' +
        '</div>';
      }).join('');

      tickerHtml = '<div class="articles-ticker-wrapper" aria-label="شريط أحدث المقالات الإخباري">' +
        '<div class="articles-ticker-label">' +
          '<svg class="ticker-animated-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<path class="ticker-svg-paper" d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m4 13a2 2 0 0 1-2-2V9a2 2 0 0 0-2-2h-2m4 13H9a2 2 0 0 1-2-2V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path class="ticker-svg-lines" d="M7 9h6M7 13h4M17 13h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
            '<circle class="ticker-svg-glow" cx="19" cy="6" r="2.5" fill="#facc15"/>' +
          '</svg>' +
          '<span class="ticker-badge-text">آخر المقالات</span>' +
        '</div>' +
        '<div class="articles-ticker-track" dir="ltr">' +
          '<div class="articles-ticker-content">' +
            itemsMarkup + itemsMarkup +
          '</div>' +
        '</div>' +
      '</div>';
    }

    const html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>'+esc(title)+'</title><meta name="description" content="'+esc(desc)+'"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">' +
      '<link rel="canonical" href="'+SITE+'/blog/"><meta property="og:type" content="website"><meta property="og:url" content="'+SITE+'/blog/"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(desc)+'">'+css()+
      '<script type="application/ld+json">' + JSON.stringify(blogSchema) + '</script>' +
      '</head><body>' +
      '<div class="article-nav-wrap"><div class="article-nav-container"><div class="article-breadcrumb"><a href="/">الرئيسية</a><span class="sep">/</span><span>المدونة الرسمية</span></div><a href="/" class="nav-home-btn">🏠 دليل المنزلة والمطرية</a></div></div>' +
      '<main class="blog-page"><header class="blog-hero"><div class="blog-hero__badge">📰 المقالات والأخبار الحصرية</div><h1>'+esc(title)+'</h1><p>'+esc(desc)+'</p>' + tickerHtml + '</header><section class="blog-grid" aria-label="أحدث المقالات">'+gridContent+'</section></main></body></html>';
    return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=60'}});
  }

  const rawReqSlug = p.slice('/article/'.length).replace(/^\/+/,'');
  const slug = decodeURIComponent(rawReqSlug);
  if(!slug) return null;

  const article = await bySlug(db, slug, false);
  if(!article) return new Response('Not Found',{status:404,headers:{'content-type':'text/plain; charset=utf-8'}});

  // 301 Permanent Redirect if accessed by legacy Arabic slug, encoded URI, or ID
  if (article.slug && article.slug !== rawReqSlug && /^[a-z0-9-]+$/.test(article.slug)) {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': `${SITE}/article/${encodeURIComponent(article.slug)}/`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  }

  const place = article.place || {};
  const placeUrl = SITE + '/place/' + encodeURIComponent(place.slug || place.id || '') + '/';
  const canonical = SITE + '/article/' + encodeURIComponent(article.slug) + '/';
  const relatedRows = (await db.prepare("SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a LEFT JOIN places p ON p.id=a.place_id WHERE a.status='published' AND a.place_id=? AND a.id<>? ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT 6").bind(article.placeId,article.id).all().catch(()=>({results:[]}))).results||[];
  const related = relatedRows.map(mapRow);
  const published = new Date(article.publishedAt || article.createdAt).toISOString();
  const modified = new Date(article.updatedAt || article.createdAt).toISOString();
  const words = String(article.content || '').trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 150));

  const schema = {
    '@context': 'https://schema.org',
    '@type': ['Article', 'BlogPosting'],
    '@id': canonical + '#article',
    headline: article.title,
    description: article.excerpt || article.content.slice(0, 180),
    articleBody: article.content,
    wordCount: words,
    inLanguage: 'ar-EG',
    image: article.coverImageUrl ? [article.coverImageUrl] : [SITE + '/assets/images/og-whatsapp.jpg'],
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    about: {
      '@type': 'LocalBusiness',
      '@id': placeUrl + '#business',
      name: place.name,
      url: placeUrl,
      telephone: place.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: place.address || place.area || 'المنزلة',
        addressLocality: place.area || 'المنزلة',
        addressRegion: 'الدقهلية',
        addressCountry: 'EG'
      }
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-title', '.prose-lead', '.prose-p']
    },
    author: { '@type': 'Organization', name: place.name || 'صاحب النشاط', url: placeUrl },
    publisher: {
      '@type': 'Organization',
      name: 'دليل المنزلة والمطرية الرقمي',
      url: SITE,
      logo: { '@type': 'ImageObject', url: SITE + '/icons/icon-512x512.png' }
    }
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'المدونة', item: SITE + '/blog/' },
      { '@type': 'ListItem', position: 3, name: place.name || 'المكان', item: placeUrl },
      { '@type': 'ListItem', position: 4, name: article.title, item: canonical }
    ]
  };

  const kws = article.keywords.map(k => '<span>' + esc(k) + '</span>').join('');
  const logo = place.logoUrl || place.coverImageUrl;
  const rawPhone = String(place.phone || '').trim();
  const rawWa = String(place.whatsapp || rawPhone).trim();
  const phoneClean = rawPhone.replace(/\D/g, '');
  const waClean = rawWa.replace(/\D/g, '');
  const waLink = waClean ? `https://wa.me/2${waClean.startsWith('0') ? waClean.slice(1) : waClean}?text=${encodeURIComponent('مرحباً، قرأت مقالكم «' + article.title + '» في دليل المنزلة وأود الاستفسار')}` : '';

  const shareText = encodeURIComponent(`${article.title}\n${canonical}`);
  const shareWa = `https://api.whatsapp.com/send?text=${shareText}`;
  const shareFb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`;

  const isVerified = Boolean(place.isVerified);
  const ratingVal = Number(place.rating || 0) || 4.9;
  const reviewCount = Number(place.reviewCount || 0);
  const verifiedBadge = isVerified ? '<span class="place-context__verified" title="مكان موثق ومعتمد رسمياً"><span class="place-context__check">✓</span> موثق رسمياً</span>' : '';
  const ratingBadge = '<span class="place-context__rating" title="تقييم المكان"><span class="place-context__star">⭐</span><strong>' + ratingVal.toFixed(1) + '</strong>' + (reviewCount > 0 ? '<span class="place-context__rating-count">(' + reviewCount + ' تقييم)</span>' : '<span class="place-context__rating-count">(موثق)</span>') + '</span>';

  const placeCard = '<aside class="place-context" aria-label="المقال مرتبط بالنشاط التجاري في الدليل">' +
    '<div class="place-context__badge">🏪 مقال رسمي وموثق في دليل المنزلة والمطرية</div>' +
    '<div class="place-context__head">' +
      (logo ? '<img class="place-context__logo" src="' + esc(logo) + '" alt="' + esc(place.name) + '" width="72" height="72" loading="lazy">' : '') +
      '<div>' +
        '<div class="place-context__name-row">' +
          '<h3 class="place-context__name"><a href="' + esc(placeUrl) + '">' + esc(place.name) + '</a></h3>' +
          verifiedBadge +
        '</div>' +
        '<div class="place-context__meta-row">' +
          '<span class="place-context__area">📍 ' + esc(place.area || 'المنزلة والمطرية') + '</span>' +
          '<span class="place-context__meta-sep">•</span>' +
          ratingBadge +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="place-context__data">' +
      (place.address ? '<span>📌 ' + esc(place.address) + '</span>' : '') +
      (place.phone ? '<span>📞 ' + esc(place.phone) + '</span>' : '') +
    '</div>' +
    '<div class="place-context__actions">' +
      '<a href="' + esc(placeUrl) + '" class="place-context__btn-primary">عرض صفحة المكان كاملة في الدليل ↗</a>' +
      (phoneClean ? '<a href="tel:' + esc(phoneClean) + '" class="place-context__btn-call">اتصال 📞</a>' : '') +
      (waLink ? '<a href="' + esc(waLink) + '" target="_blank" rel="noopener noreferrer" class="place-context__btn-wa">واتساب 💬</a>' : '') +
    '</div>' +
  '</aside>';

  const shareBar = '<div class="article-share-strip">' +
    '<div class="article-share-title"><span>📢</span><span>مشاركة هذا المقال:</span></div>' +
    '<div class="article-share-buttons">' +
      '<a href="' + esc(shareWa) + '" target="_blank" rel="noopener noreferrer" class="btn-share btn-share--wa">واتساب 💬</a>' +
      '<a href="' + esc(shareFb) + '" target="_blank" rel="noopener noreferrer" class="btn-share btn-share--fb">فيسبوك f</a>' +
      '<button type="button" class="btn-share btn-share--copy" id="btnCopyLink">نسخ الرابط 📋</button>' +
    '</div>' +
  '</div>';

  const relatedHtml = related.length ? '<section class="related-articles"><h2><span>📝</span><span>مقالات أخرى تهمك عن ' + esc(place.name) + '</span></h2><div class="blog-grid">' + related.map(card).join('') + '</div></section>' : '';

  const clientScript = '<script>' +
    'window.addEventListener("scroll",function(){' +
      'var h=document.documentElement,b=document.body;' +
      'var st="scrollTop" in h?h.scrollTop:b.scrollTop;' +
      'var sh="scrollHeight" in h?h.scrollHeight:b.scrollHeight;' +
      'var ch="clientHeight" in h?h.clientHeight:b.clientHeight;' +
      'var p=(st/(sh-ch))*100;' +
      'var el=document.getElementById("readingProgressBar");' +
      'if(el)el.style.width=Math.min(100,Math.max(0,p))+"%";' +
    '});' +
    'var cb=document.getElementById("btnCopyLink");' +
    'if(cb){' +
      'cb.addEventListener("click",function(){' +
        'if(navigator.clipboard&&navigator.clipboard.writeText){' +
          'navigator.clipboard.writeText(window.location.href).then(function(){' +
            'cb.textContent="تم النسخ! ✅";' +
            'setTimeout(function(){cb.textContent="نسخ الرابط 📋";},2500);' +
          '});' +
        '}' +
      '});' +
    '}' +
  '</script>';

  // Extract FAQ items for FAQPage Schema (Google Rich Snippets & AI Search Q&A)
  const faqItems = [];
  const faqSection = (article.content || '').split(/##\s+(?:الأسئلة الشائعة|أسئلة شائعة|FAQ)/i)[1];
  if (faqSection) {
    const rawFaqContent = faqSection.split(/\n##\s+/)[0];
    const qMatches = rawFaqContent.match(/###\s+([^\n]+)\n+([\s\S]*?)(?=\n###\s+|$)/g) || [];
    for (const block of qMatches) {
      const qTitle = block.match(/###\s+(?:س\d*[:：\-]?\s*)?([^\n?؟]+[?؟]?)/)?.[1]?.trim();
      const aText = block.replace(/^###[^\n]+\n+/, '').replace(/^[-*]\s+/gm, '').trim();
      if (qTitle && aText) {
        faqItems.push({
          '@type': 'Question',
          name: qTitle,
          acceptedAnswer: {
            '@type': 'Answer',
            text: aText
          }
        });
      }
    }
  }
  const faqSchema = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems
  } : null;

  const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(article.title) + ' | ' + esc(place.name) + ' | دليل المنزلة والمطرية</title>' +
    '<meta name="description" content="' + esc(article.excerpt || article.content.slice(0, 180)) + '">' +
    '<meta name="keywords" content="' + esc(article.keywords.join(', ')) + '">' +
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">' +
    '<meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">' +
    '<meta name="bingbot" content="index,follow,max-snippet:-1,max-image-preview:large">' +
    '<link rel="canonical" href="' + esc(canonical) + '">' +
    '<link rel="alternate" hreflang="ar" href="' + esc(canonical) + '">' +
    '<link rel="alternate" hreflang="x-default" href="' + esc(canonical) + '">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:site_name" content="دليل المنزلة والمطرية الرقمي">' +
    '<meta property="og:url" content="' + esc(canonical) + '">' +
    '<meta property="og:title" content="' + esc(article.title) + '">' +
    '<meta property="og:description" content="' + esc(article.excerpt || article.content.slice(0, 180)) + '">' +
    '<meta property="og:image" content="' + esc(article.coverImageUrl || SITE + '/assets/images/og-whatsapp.jpg') + '">' +
    '<meta property="og:image:width" content="1200">' +
    '<meta property="og:image:height" content="675">' +
    '<meta property="article:published_time" content="' + esc(published) + '">' +
    '<meta property="article:modified_time" content="' + esc(modified) + '">' +
    '<meta property="article:section" content="' + esc(place.category || 'أعمال محلية') + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(article.title) + '">' +
    '<meta name="twitter:description" content="' + esc(article.excerpt || article.content.slice(0, 180)) + '">' +
    '<meta name="twitter:image" content="' + esc(article.coverImageUrl || SITE + '/assets/images/og-whatsapp.jpg') + '">' +
    css() +
    '<script type="application/ld+json">' + JSON.stringify(schema) + '</script>' +
    '<script type="application/ld+json">' + JSON.stringify(breadcrumb) + '</script>' +
    (faqSchema ? '<script type="application/ld+json">' + JSON.stringify(faqSchema) + '</script>' : '') +
    '</head><body>' +
    '<div id="readingProgressBar"></div>' +
    '<div class="article-nav-wrap"><div class="article-nav-container"><div class="article-breadcrumb"><a href="/">الرئيسية</a><span class="sep">/</span><a href="/blog/">المدونة</a><span class="sep">/</span><a href="' + esc(placeUrl) + '">' + esc(place.name || 'المكان') + '</a><span class="sep">/</span><span>' + esc(article.title) + '</span></div><a href="' + esc(placeUrl) + '" class="nav-home-btn">🏪 صفحة النشاط</a></div></div>' +
    '<main class="article-page">' +
      '<article class="article-shell">' +
        (article.coverImageUrl ? '<div class="article-cover-wrap"><img class="article-cover" src="' + esc(article.coverImageUrl) + '" alt="' + esc(article.title) + '" width="960" height="540" fetchpriority="high"></div>' : '') +
        '<div class="article-content">' +
          '<header class="article-header">' +
            '<div class="article-badge-row">' +
              '<span class="badge-verified">✓ نشاط موثق بالدليل</span>' +
              '<span class="badge-time">⏱️ ' + readTime + ' د قراءة (~' + words + ' كلمة)</span>' +
            '</div>' +
            '<h1 class="article-title">' + esc(article.title) + '</h1>' +
            '<div class="article-meta-row">' +
              '<a href="' + esc(placeUrl) + '" class="article-author-link">🏪 ' + esc(place.name || '') + '</a>' +
              '<span>•</span>' +
              '<time datetime="' + esc(modified) + '">📅 ' + new Date(article.updatedAt || article.createdAt).toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' }) + '</time>' +
            '</div>' +
          '</header>' +
          '<div class="article-prose">' + formatProse(article.content) + '</div>' +
          (kws ? '<div class="article-keywords" aria-label="الكلمات المفتاحية">' + kws + '</div>' : '') +
          shareBar +
          placeCard +
          relatedHtml +
        '</div>' +
      '</article>' +
    '</main>' +
    clientScript +
    '</body></html>';

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=180, stale-while-revalidate=86400'
    }
  });
}

export async function getPublishedArticlesForPlace(env, placeId, limit) {
  const db=createTursoDB(env);
  const rows=(await db.prepare("SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a LEFT JOIN places p ON p.id=a.place_id WHERE a.place_id=? AND a.status='published' ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT ?").bind(placeId,Math.min(6,Math.max(1,Number(limit||6)))).all().catch(()=>({results:[]}))).results||[];
  return rows.map(mapRow);
}
