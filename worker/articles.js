import { createTursoDB } from './turso.js';

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

function slugify(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  const s = raw.normalize('NFKD').replace(/[^\p{L}\p{N}\s-]+/gu, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return s || ('article-' + Date.now());
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
      logoUrl: imageUrl(row.place_logo_url), coverImageUrl: imageUrl(row.place_cover_url)
    } : null
  };
}

async function bySlug(db, slug, includeUnpublished) {
  let sql = 'SELECT a.*, p.name AS place_name, p.slug AS place_slug, p.area AS place_area, p.address AS place_address, p.phone AS place_phone, p.logo_url AS place_logo_url, p.cover_image_url AS place_cover_url FROM articles a JOIN places p ON p.id=a.place_id WHERE a.slug = ?';
  if (!includeUnpublished) sql += " AND a.status = 'published'";
  sql += ' LIMIT 1';
  return mapRow(await db.prepare(sql).bind(slug).first().catch(() => null));
}

function card(article) {
  const p = article.place || {};
  const href = '/article/' + encodeURIComponent(article.slug) + '/';
  const excerpt = article.excerpt || text(article.content, 180);
  const img = article.coverImageUrl
    ? '<img class="blog-card__image" src="' + esc(article.coverImageUrl) + '" width="640" height="360" loading="lazy" decoding="async" alt="' + esc(article.title) + '">'
    : '<div class="blog-card__image blog-card__image--placeholder" aria-hidden="true">📝</div>';
  return '<article class="blog-card">' +
    '<a class="blog-card__image-link" href="' + esc(href) + '" aria-label="' + esc(article.title) + '">' + img + '</a>' +
    '<div class="blog-card__body">' +
      '<div class="blog-card__meta">' + (p.name ? '<a href="/place/' + encodeURIComponent(p.slug || p.id || '') + '/">' + esc(p.name) + '</a>' : '') + '</div>' +
      '<h2 class="blog-card__title"><a href="' + esc(href) + '">' + esc(article.title) + '</a></h2>' +
      '<p class="blog-card__excerpt">' + esc(excerpt) + '</p>' +
      '<a class="blog-card__read" href="' + esc(href) + '">قراءة المقال ←</a>' +
    '</div></article>';
}

function css() {
  return '<style>' +
  ':root{--blog-primary:#0f4c5c;--blog-muted:#64748b;--blog-border:#e2e8f0}' +
  '.blog-page{max-width:1180px;margin:0 auto;padding:32px 16px 64px}' +
  '.blog-hero{padding:28px 22px;margin-bottom:24px;border:1px solid var(--blog-border);border-radius:24px;background:linear-gradient(135deg,#f0fdfa,#fff)}' +
  '.blog-hero h1{margin:0 0 8px;font-size:clamp(1.7rem,4vw,2.5rem);font-weight:900;color:#0f172a}' +
  '.blog-hero p{margin:0;color:var(--blog-muted);line-height:1.9}' +
  '.blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}' +
  '.blog-card{display:flex;flex-direction:column;overflow:hidden;background:#fff;border:1px solid var(--blog-border);border-radius:18px;box-shadow:0 6px 24px rgba(15,23,42,.06)}' +
  '.blog-card__image-link{display:block;aspect-ratio:16/9;background:#edf2f7;overflow:hidden}' +
  '.blog-card__image{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s ease}' +
  '.blog-card:hover .blog-card__image{transform:scale(1.03)}' +
  '.blog-card__image--placeholder{display:grid;place-items:center;font-size:42px}' +
  '.blog-card__body{padding:16px}.blog-card__meta{font-size:.78rem;color:#0f766e;font-weight:800;margin-bottom:7px}' +
  '.blog-card__meta a{color:inherit;text-decoration:none}.blog-card__title{font-size:1.08rem;line-height:1.55;margin:0 0 7px;font-weight:900;color:#0f172a}' +
  '.blog-card__title a{color:inherit;text-decoration:none}.blog-card__excerpt{margin:0 0 13px;line-height:1.85;color:#475569;font-size:.92rem}' +
  '.blog-card__read{color:#0f4c5c;font-weight:800;text-decoration:none}' +
  '.article-page{max-width:960px;margin:0 auto;padding:30px 16px 72px}.article-breadcrumb{font-size:.85rem;color:#64748b;margin-bottom:14px}.article-breadcrumb a{color:#0f4c5c;text-decoration:none}' +
  '.article-shell{background:#fff;border:1px solid var(--blog-border);border-radius:24px;overflow:hidden;box-shadow:0 10px 38px rgba(15,23,42,.07)}' +
  '.article-cover{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#edf2f7}.article-content{padding:28px 22px}' +
  '.article-content h1{font-size:clamp(1.8rem,4vw,2.7rem);line-height:1.35;margin:0 0 12px;color:#0f172a;font-weight:900}' +
  '.article-meta{display:flex;gap:8px;flex-wrap:wrap;color:#64748b;font-size:.84rem;margin-bottom:22px}.article-prose{font-size:1.03rem;line-height:2.05;color:#243447}.article-prose p{margin:0 0 1em}' +
  '.place-context{margin-top:28px;border:1px solid #cbd5e1;border-radius:18px;padding:16px;background:#f8fafc}.place-context__head{display:flex;align-items:center;gap:12px}' +
  '.place-context__logo{width:54px;height:54px;border-radius:14px;object-fit:cover;background:#e2e8f0}.place-context__name{font-size:1rem;font-weight:900;color:#0f172a}.place-context__name a{color:inherit;text-decoration:none}' +
  '.place-context__data{margin:10px 0 0;color:#475569;line-height:1.8;font-size:.9rem}.related-articles{margin-top:30px}.related-articles h2{font-size:1.2rem;font-weight:900;margin:0 0 14px}' +
  '.article-keywords{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px}.article-keywords span{background:#ecfeff;color:#0f766e;border-radius:999px;padding:5px 10px;font-size:.75rem;font-weight:800}' +
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

    let sql = 'SELECT a.*, p.name AS place_name, p.slug AS place_slug, p.area AS place_area, p.address AS place_address, p.phone AS place_phone, p.logo_url AS place_logo_url, p.cover_image_url AS place_cover_url FROM articles a JOIN places p ON p.id=a.place_id WHERE a.status = "published" AND p.status = "published"';
    const args = [];
    if (placeId) { sql += ' AND a.place_id = ?'; args.push(placeId); }
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
    const place=await db.prepare('SELECT id,name,slug,area,address,phone,logo_url,cover_image_url,owner_id,status FROM places WHERE id=? LIMIT 1').bind(placeId).first().catch(()=>null);
    if(!place) return {status:404,body:{success:false,error:'المكان غير موجود'}};
    if(!user.isAdmin && String(place.owner_id)!==String(user.uid)) return {status:403,body:{success:false,error:'يمكن لصاحب المكان فقط إدارة مقالاته'}};

    const existingId=String(body.id||'').trim();
    const existing=existingId?await db.prepare('SELECT * FROM articles WHERE id=? LIMIT 1').bind(existingId).first().catch(()=>null):null;
    const countRow=await db.prepare("SELECT COUNT(*) AS count FROM articles WHERE place_id=? AND status<>'deleted' AND id<>?").bind(placeId,existingId||'').first().catch(()=>({count:0}));
    if(!existing && Number(countRow?.count||0)>=6) return {status:409,body:{success:false,error:'يمكنك إضافة 6 مقالات كحد أقصى لهذا المكان'}};
    if(existing && !user.isAdmin && String(existing.owner_id)!==String(user.uid)) return {status:403,body:{success:false,error:'لا يمكنك تعديل هذا المقال'}};

    const title=text(body.title,180), content=text(body.content,10000);
    if(title.length<6) return {status:400,body:{success:false,error:'عنوان المقال قصير جدًا'}};
    if(content.length<120) return {status:400,body:{success:false,error:'محتوى المقال قصير جدًا'}};

    let slug=slugify(body.slug||title);
    const slugOwner=await db.prepare('SELECT id FROM articles WHERE slug=? AND id<>? LIMIT 1').bind(slug,existingId||'').first().catch(()=>null);
    if(slugOwner) slug=slug+'-'+(existingId||('x'+Date.now())).slice(-6);

    const now=Date.now(), status=body.status==='draft'?'draft':'published';
    const cover=imageUrl(body.cover_image_url||body.coverImageUrl);
    const kws=JSON.stringify(keywords(body.keywords));
    const excerpt=text(body.excerpt||content.slice(0,180),280);
    const id=existing?.id||existingId||('art_'+Date.now()+'_'+Math.random().toString(36).slice(2,8));

    if(existing) {
      await db.prepare('UPDATE articles SET title=?,excerpt=?,content=?,keywords_json=?,cover_image_url=?,status=?,ai_generated=?,updated_at=?,published_at=CASE WHEN ?="published" THEN COALESCE(published_at,?) ELSE published_at END WHERE id=?')
        .bind(title,excerpt,content,kws,cover,status,body.ai_generated?1:0,now,status,now,id).run();
    } else {
      await db.prepare('INSERT INTO articles(id,place_id,owner_id,slug,title,excerpt,content,keywords_json,cover_image_url,status,ai_generated,created_at,updated_at,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id,placeId,user.uid,slug,title,excerpt,content,kws,cover,status,body.ai_generated?1:0,now,now,status==='published'?now:null).run();
    }

    return {status:200,body:{success:true,data:await bySlug(db,slug,true)}};
  }

  if (request.method === 'PUT' && match) {
    if (!user) return {status:401,body:{success:false,error:'يجب تسجيل الدخول'}};
    const id=decodeURIComponent(match[1]);
    const existing=await db.prepare('SELECT * FROM articles WHERE id=? LIMIT 1').bind(id).first().catch(()=>null);
    if(!existing) return {status:404,body:{success:false,error:'المقال غير موجود'}};
    if(!user.isAdmin && String(existing.owner_id)!==String(user.uid)) return {status:403,body:{success:false,error:'لا يمكنك تعديل هذا المقال'}};
    const body=await request.json().catch(()=>({}));
    const title=text(body.title??existing.title,180), content=text(body.content??existing.content,10000);
    const cover=imageUrl(body.cover_image_url??body.coverImageUrl??existing.cover_image_url);
    const kws=JSON.stringify(keywords(body.keywords??existing.keywords_json));
    const excerpt=text(body.excerpt??content.slice(0,180),280);
    const status=body.status==='draft'?'draft':'published', now=Date.now();
    await db.prepare('UPDATE articles SET title=?,excerpt=?,content=?,keywords_json=?,cover_image_url=?,status=?,ai_generated=?,updated_at=?,published_at=CASE WHEN ?="published" THEN COALESCE(published_at,?) ELSE published_at END WHERE id=?')
      .bind(title,excerpt,content,kws,cover,status,body.ai_generated==null?Number(existing.ai_generated||0):body.ai_generated?1:0,now,status,now,id).run();
    return {status:200,body:{success:true,data:mapRow(await db.prepare('SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a JOIN places p ON p.id=a.place_id WHERE a.id=? LIMIT 1').bind(id).first())}};
  }

  if (request.method === 'DELETE' && match) {
    if (!user) return {status:401,body:{success:false,error:'يجب تسجيل الدخول'}};
    const id=decodeURIComponent(match[1]);
    const existing=await db.prepare('SELECT owner_id FROM articles WHERE id=? LIMIT 1').bind(id).first().catch(()=>null);
    if(!existing) return {status:404,body:{success:false,error:'المقال غير موجود'}};
    if(!user.isAdmin && String(existing.owner_id)!==String(user.uid)) return {status:403,body:{success:false,error:'لا يمكنك حذف هذا المقال'}};
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
    const rows=(await db.prepare('SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a JOIN places p ON p.id=a.place_id WHERE a.status="published" AND p.status="published" ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT 30').all().catch(()=>({results:[]}))).results||[];
    const title='المدونة المحلية | مقالات محلات وخدمات المنزلة والمطرية';
    const desc='مقالات محلية مفيدة يكتبها أصحاب الأنشطة عن خدماتهم وأعمالهم في المنزلة والمطرية مع روابط مباشرة لكل مكان.';
    const html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>'+esc(title)+'</title><meta name="description" content="'+esc(desc)+'"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">' +
      '<link rel="canonical" href="'+SITE+'/blog/"><meta property="og:type" content="website"><meta property="og:url" content="'+SITE+'/blog/"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(desc)+'">'+css()+
      '</head><body><main class="blog-page"><header class="blog-hero"><h1>'+esc(title)+'</h1><p>'+esc(desc)+'</p></header><section class="blog-grid" aria-label="أحدث المقالات">'+rows.map(r=>card(mapRow(r))).join('')+'</section></main></body></html>';
    return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=300'}});
  }

  const slug=decodeURIComponent(p.slice('/article/'.length).replace(/^\/+/,''));
  if(!slug) return null;
  const article=await bySlug(db,slug,false);
  if(!article) return new Response('Not Found',{status:404,headers:{'content-type':'text/plain; charset=utf-8'}});
  const place=article.place||{};
  const placeUrl=SITE+'/place/'+encodeURIComponent(place.slug||place.id||'')+'/';
  const canonical=SITE+'/article/'+encodeURIComponent(article.slug)+'/';
  const relatedRows=(await db.prepare('SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a JOIN places p ON p.id=a.place_id WHERE a.status="published" AND p.status="published" AND a.place_id=? AND a.id<>? ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT 6').bind(article.placeId,article.id).all().catch(()=>({results:[]}))).results||[];
  const related=relatedRows.map(mapRow);
  const published=new Date(article.publishedAt||article.createdAt).toISOString();
  const modified=new Date(article.updatedAt||article.createdAt).toISOString();

  const schema={'@context':'https://schema.org','@type':'Article','@id':canonical+'#article',
    headline:article.title,description:article.excerpt||article.content.slice(0,180),
    image:article.coverImageUrl?[article.coverImageUrl]:[SITE+'/assets/images/og-whatsapp.jpg'],
    datePublished:published,dateModified:modified,
    mainEntityOfPage:{'@type':'WebPage','@id':canonical},
    about:{'@type':'LocalBusiness','@id':placeUrl+'#business',name:place.name,url:placeUrl},
    author:{'@type':'Organization','name':place.name||'صاحب النشاط'},
    publisher:{'@type':'Organization','name':'دليل المنزلة والمطرية الرقمي',url:SITE,logo:{'@type':'ImageObject',url:SITE+'/icons/icon-512x512.png'}}
  };
  const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
    {'@type':'ListItem',position:1,name:'الرئيسية',item:SITE+'/'},
    {'@type':'ListItem',position:2,name:'المدونة',item:SITE+'/blog/'},
    {'@type':'ListItem',position:3,name:place.name||'المكان',item:placeUrl},
    {'@type':'ListItem',position:4,name:article.title,item:canonical}
  ]};
  const kws=article.keywords.map(k=>'<span>'+esc(k)+'</span>').join('');
  const logo=place.logoUrl||place.coverImageUrl;
  const placeCard='<aside class="place-context" aria-label="المقال مرتبط بالمكان"><div class="place-context__head">' +
    (logo?'<img class="place-context__logo" src="'+esc(logo)+'" alt="'+esc(place.name)+'">':'') +
    '<div><div class="place-context__name"><a href="'+esc(placeUrl)+'">'+esc(place.name)+'</a></div><div style="color:#0f766e;font-size:.8rem;font-weight:700">مقال مرتبط بهذا المكان</div></div></div>' +
    '<p class="place-context__data">📍 '+esc(place.area||'المنزلة والمطرية')+(place.address?' — '+esc(place.address):'')+(place.phone?' · 📞 '+esc(place.phone):'')+'</p>' +
    '<a href="'+esc(placeUrl)+'" style="font-weight:900;color:#0f4c5c;text-decoration:none">فتح بطاقة المكان والتفاصيل ←</a></aside>';
  const relatedHtml=related.length?'<section class="related-articles"><h2>مقالات أخرى عن '+esc(place.name)+'</h2><div class="blog-grid">'+related.map(card).join('')+'</div></section>':'';
  const html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>'+esc(article.title)+' | '+esc(place.name)+' | دليل المنزلة والمطرية</title>' +
    '<meta name="description" content="'+esc(article.excerpt||article.content.slice(0,180))+'"><meta name="keywords" content="'+esc(article.keywords.join(', '))+'">' +
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">' +
    '<link rel="canonical" href="'+esc(canonical)+'"><link rel="alternate" hreflang="ar" href="'+esc(canonical)+'"><link rel="alternate" hreflang="x-default" href="'+esc(canonical)+'">' +
    '<meta property="og:type" content="article"><meta property="og:url" content="'+esc(canonical)+'"><meta property="og:title" content="'+esc(article.title)+'"><meta property="og:description" content="'+esc(article.excerpt||article.content.slice(0,180))+'"><meta property="og:image" content="'+esc(article.coverImageUrl||SITE+'/assets/images/og-whatsapp.jpg')+'">'+css()+
    '<script type="application/ld+json">'+JSON.stringify(schema)+'</script><script type="application/ld+json">'+JSON.stringify(breadcrumb)+'</script>' +
    '</head><body><main class="article-page"><div class="article-breadcrumb"><a href="/">الرئيسية</a> / <a href="/blog/">المدونة</a> / <a href="'+esc(placeUrl)+'">'+esc(place.name||'المكان')+'</a> / <span>'+esc(article.title)+'</span></div>' +
    '<article class="article-shell">' +
      (article.coverImageUrl?'<img class="article-cover" src="'+esc(article.coverImageUrl)+'" alt="'+esc(article.title)+'" width="960" height="540" loading="eager" fetchpriority="high">':'<div class="article-cover" aria-hidden="true"></div>') +
      '<div class="article-content"><h1>'+esc(article.title)+'</h1><div class="article-meta"><a href="'+esc(placeUrl)+'">'+esc(place.name||'')+'</a><span>•</span><time datetime="'+esc(modified)+'">'+new Date(article.updatedAt||article.createdAt).toLocaleDateString('ar-EG')+'</time></div>' +
      '<div class="article-prose">'+article.content.split('\n\n').map(v=>'<p>'+esc(v)+'</p>').join('')+'</div>' +
      (kws?'<div class="article-keywords" aria-label="الكلمات المفتاحية">'+kws+'</div>':'') +
      placeCard+relatedHtml+'</div></article></main></body></html>';
  return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=300'}});
}

export async function getPublishedArticlesForPlace(env, placeId, limit) {
  const db=createTursoDB(env);
  const rows=(await db.prepare('SELECT a.*, p.name AS place_name,p.slug AS place_slug,p.area AS place_area,p.address AS place_address,p.phone AS place_phone,p.logo_url AS place_logo_url,p.cover_image_url AS place_cover_url FROM articles a JOIN places p ON p.id=a.place_id WHERE a.place_id=? AND a.status="published" AND p.status="published" ORDER BY COALESCE(a.published_at,a.created_at) DESC LIMIT ?').bind(placeId,Math.min(6,Math.max(1,Number(limit||6)))).all().catch(()=>({results:[]}))).results||[];
  return rows.map(mapRow);
}
